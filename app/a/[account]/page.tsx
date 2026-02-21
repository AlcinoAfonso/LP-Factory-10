// app/a/[account]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import type { FormEvent } from "react";
import { useAccessContext } from "@/providers/AccessProvider";
import { saveSetupAndContinueAction, type SetupSaveState } from "./actions";
import { validateE10_4SetupForm } from "@/lib/onboarding/e10_4_setup_validation";

type DashState = "auth" | "onboarding" | "public";

function normalizeForCompare(s: string): string {
  return (s ?? "").toString().replace(/\s+/g, " ").trim().toLowerCase();
}

function isLikelyMachineDefaultName(name: string, accountSubdomain: string): boolean {
  const n = normalizeForCompare(name);
  if (!n) return false;

  const bySubdomain = normalizeForCompare(`Conta ${accountSubdomain}`);
  if (n === bySubdomain) return true;

  // Padrão “máquina” observado: "Conta acc-...."
  if (/^conta\s+acc-[a-z0-9]+$/i.test(name.trim())) return true;

  return false;
}

export default function Page(props: any) {
  const params = props.params as { account: string };

  const ctx = useAccessContext() as any;

  const isHome = params.account === "home";
  const hasCtx = Boolean(ctx?.account || ctx?.member);

  const state: DashState = useMemo(() => {
    if (isHome && !hasCtx) return "onboarding";
    if (hasCtx) return "auth";
    return "public";
  }, [isHome, hasCtx]);

  if (state === "auth") {
    const accountStatus = (ctx?.account?.status ?? null) as
      | "pending_setup"
      | "active"
      | "inactive"
      | "suspended"
      | null;

    const setupCompletedAt = (ctx?.account?.setupCompletedAt ?? null) as string | null;

    // E10.4: pending_setup + setup incompleto → Primeiros passos (form inline)
    if (accountStatus === "pending_setup" && !setupCompletedAt) {
      return <PendingSetupFirstSteps accountSubdomain={params.account} ctx={ctx} />;
    }

    // E10.5 (ainda sem UX): mantém o dashboard “limpo” para demais status/subestados
    return <main className="mx-auto max-w-5xl px-6 py-10" />;
  }

  if (state === "onboarding") {
    return <DashboardOnboarding />;
  }

  return <DashboardPublic />;
}

function PendingSetupFirstSteps({
  accountSubdomain,
  ctx,
}: {
  accountSubdomain: string;
  ctx: any;
}) {
  const initialState: SetupSaveState = { ok: true };

  const [serverState, action, isPending] = useActionState(
    saveSetupAndContinueAction,
    initialState
  );

  const existingName = ((ctx?.account?.name ?? "") as string).trim();
  const initialNameFromCtx =
    existingName && !isLikelyMachineDefaultName(existingName, accountSubdomain) ? existingName : "";

  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [dirty, setDirty] = useState<{ [k: string]: boolean }>({});

  const [nameValidatedOnce, setNameValidatedOnce] = useState(false);
  const [whatsappValidatedOnce, setWhatsappValidatedOnce] = useState(false);

  const [nameDirtyOnce, setNameDirtyOnce] = useState(false);

  const [name, setName] = useState<string>(initialNameFromCtx);
  const [niche, setNiche] = useState<string>("");
  const [preferredChannel, setPreferredChannel] = useState<"email" | "whatsapp">("email");
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [siteUrl, setSiteUrl] = useState<string>("");

  // Se o ctx chegar depois, só preenche se o usuário ainda não digitou.
  useEffect(() => {
    if (nameDirtyOnce) return;
    setName(initialNameFromCtx);
  }, [nameDirtyOnce, initialNameFromCtx]);

  // Após cada resposta do server (submit), “zera” dirty (para mostrar erros do server novamente).
  useEffect(() => {
    setDirty({});
  }, [serverState]);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const channelRef = useRef<HTMLSelectElement | null>(null);
  const whatsappRef = useRef<HTMLInputElement | null>(null);
  const siteRef = useRef<HTMLInputElement | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Mantém WhatsApp limpo quando o canal não é WhatsApp.
  useEffect(() => {
    if (preferredChannel !== "whatsapp" && whatsapp) {
      setWhatsapp("");
      setWhatsappValidatedOnce(false);
    }
  }, [preferredChannel]);

  const validation = useMemo(() => {
    return validateE10_4SetupForm({
      accountSubdomain,
      name,
      niche,
      preferred_channel: preferredChannel,
      whatsapp,
      site_url: siteUrl,
    });
  }, [accountSubdomain, name, niche, preferredChannel, whatsapp, siteUrl]);

  // Merge: server + client. Só “some” o erro do server depois que o usuário editar aquele campo.
  const mergedFieldErrors: any = useMemo(() => {
    const serverErrors: any = { ...(serverState?.fieldErrors ?? {}) };
    const clientErrors: any = { ...(validation.fieldErrors ?? {}) };
    const out: any = { ...serverErrors, ...clientErrors };

    const keys = ["name", "preferred_channel", "whatsapp", "site_url"] as const;
    for (const k of keys) {
      if (dirty[k] && !clientErrors[k]) {
        delete out[k];
      }
    }

    return out;
  }, [serverState?.fieldErrors, validation.fieldErrors, dirty]);

  const isNameValidNow = !mergedFieldErrors?.name;
  const canSubmitByName = isNameValidNow && !isPending;

  // Progressive disclosure (mobile) — revelação depende de blur+validação ok.
  const canRevealAfterName = isMobile && nameValidatedOnce && isNameValidNow;
  const shouldShowChannel = !isMobile || canRevealAfterName;
  const shouldShowWhatsapp =
    (!isMobile && preferredChannel === "whatsapp") ||
    (isMobile && canRevealAfterName && preferredChannel === "whatsapp");
  const whatsappValidGate = !mergedFieldErrors?.whatsapp;
  const shouldShowSite =
    !isMobile ||
    (canRevealAfterName && preferredChannel === "email") ||
    (shouldShowWhatsapp && whatsappValidatedOnce && whatsappValidGate);

  const showFieldError = (field: string) => {
    const msg = mergedFieldErrors?.[field];
    if (!msg) return null;
    if (submitted) return msg;
    if (touched[field]) return msg;
    return null;
  };

  const focusFirstInvalid = () => {
    if (mergedFieldErrors?.name) return nameRef.current?.focus();
    if (mergedFieldErrors?.preferred_channel) return channelRef.current?.focus();
    if (mergedFieldErrors?.whatsapp) return whatsappRef.current?.focus();
    if (mergedFieldErrors?.site_url) return siteRef.current?.focus();
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    setSubmitted(true);

    // Revalida antes de submeter para garantir: Enter só envia se válido.
    const v = validateE10_4SetupForm({
      accountSubdomain,
      name,
      niche,
      preferred_channel: preferredChannel,
      whatsapp,
      site_url: siteUrl,
    });

    if (!v.ok) {
      e.preventDefault();
      focusFirstInvalid();
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Ativar sua conta</h1>
          <p className="text-sm text-gray-600">
            Leva menos de 1 minuto. Isso personaliza seu dashboard.
          </p>
          <p className="text-xs text-gray-500">Você poderá ajustar essas informações depois.</p>
        </div>

        {serverState?.formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverState.formError}
          </div>
        ) : null}

        <form action={action} onSubmit={onSubmit} className="space-y-5">
          <input type="hidden" name="account_subdomain" value={accountSubdomain} />

          <div className="space-y-1">
            <label className="text-sm font-medium">Nome do projeto*</label>
            <input
              name="name"
              ref={nameRef}
              value={name}
              onChange={(e) => {
                setNameDirtyOnce(true);
                setName(e.target.value);
                setTouched((t) => ({ ...t, name: true }));
                setDirty((d) => ({ ...d, name: true }));
              }}
              onBlur={() => {
                const v = validateE10_4SetupForm({
                  accountSubdomain,
                  name,
                  niche,
                  preferred_channel: preferredChannel,
                  whatsapp,
                  site_url: siteUrl,
                });
                if (!v.fieldErrors?.name) setNameValidatedOnce(true);
              }}
              disabled={isPending}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ex.: Unico Digital"
              autoComplete="off"
              enterKeyHint={isMobile ? "next" : undefined}
            />
            {showFieldError("name") ? (
              <p className="text-sm text-red-600">{showFieldError("name")}</p>
            ) : (
              <p className="text-xs text-gray-500">
                Digite o nome do projeto que aparecerá no seu dashboard.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Nicho (opcional)</label>
            <input
              name="niche"
              value={niche}
              onChange={(e) => {
                setNiche(e.target.value);
                setDirty((d) => ({ ...d, niche: true }));
              }}
              disabled={isPending}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ex.: Harmonização facial"
              autoComplete="off"
              enterKeyHint={isMobile ? "next" : undefined}
            />
          </div>

          {shouldShowChannel ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">Preferência de canal</label>
              <select
                name="preferred_channel"
                ref={channelRef}
                value={preferredChannel}
                onChange={(e) => {
                  setPreferredChannel(e.target.value as any);
                  setTouched((t) => ({ ...t, preferred_channel: true }));
                  setDirty((d) => ({ ...d, preferred_channel: true }));
                }}
                disabled={isPending}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              {showFieldError("preferred_channel") ? (
                <p className="text-sm text-red-600">{showFieldError("preferred_channel")}</p>
              ) : null}
            </div>
          ) : null}

          {shouldShowWhatsapp ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">WhatsApp</label>
              <input
                name="whatsapp"
                ref={whatsappRef}
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  setDirty((d) => ({ ...d, whatsapp: true }));
                }}
                onBlur={() => {
                  setTouched((t) => ({ ...t, whatsapp: true }));
                  const v = validateE10_4SetupForm({
                    accountSubdomain,
                    name,
                    niche,
                    preferred_channel: preferredChannel,
                    whatsapp,
                    site_url: siteUrl,
                  });
                  if (!v.fieldErrors?.whatsapp) setWhatsappValidatedOnce(true);
                }}
                disabled={isPending}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Somente dígitos (10–15)"
                autoComplete="off"
                inputMode="tel"
                enterKeyHint={isMobile ? "next" : undefined}
              />
              {showFieldError("whatsapp") ? (
                <p className="text-sm text-red-600">{showFieldError("whatsapp")}</p>
              ) : null}
            </div>
          ) : null}

          {shouldShowSite ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">Link da LP/site (opcional)</label>
              <input
                name="site_url"
                ref={siteRef}
                value={siteUrl}
                onChange={(e) => {
                  setSiteUrl(e.target.value);
                  setDirty((d) => ({ ...d, site_url: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, site_url: true }))}
                disabled={isPending}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="dominio.com.br ou https://..."
                autoComplete="off"
                inputMode="url"
                enterKeyHint={isMobile ? "done" : undefined}
              />
              {showFieldError("site_url") ? (
                <p className="text-sm text-red-600">{showFieldError("site_url")}</p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmitByName}
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Salvando…" : "Salvar e continuar"}
          </button>
        </form>
      </div>
    </main>
  );
}

// Stubs atuais (mantidos)
function DashboardOnboarding() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-sm text-gray-600">Faça login ou crie sua conta para continuar.</p>
      </div>
    </main>
  );
}

function DashboardPublic() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">LP Factory</h1>
        <p className="text-sm text-gray-600">Acesse sua conta ou visite a home pública.</p>
      </div>
    </main>
  );
}

"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { validateE10_4SetupForm } from "@/lib/onboarding/e10_4_setup_validation";
import { Button } from "@/components/ui/button";
import { FormField, FormFieldError, FormFieldHint, FormFieldLabel } from "@/components/ui/form-field";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { saveSetupAndContinueAction, type SetupSaveState } from "../actions";

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

export function PendingSetupFirstSteps({
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

  useEffect(() => {
    if (nameDirtyOnce) return;
    setName(initialNameFromCtx);
  }, [nameDirtyOnce, initialNameFromCtx]);

  useEffect(() => {
    setDirty({});
  }, [serverState]);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const nicheRef = useRef<HTMLInputElement | null>(null);
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

  const mergedFieldErrors: any = useMemo(() => {
    const serverErrors: any = { ...(serverState?.fieldErrors ?? {}) };
    const clientErrors: any = { ...(validation.fieldErrors ?? {}) };
    const out: any = { ...serverErrors, ...clientErrors };

    const keys = ["name", "niche", "preferred_channel", "whatsapp", "site_url"] as const;
    for (const k of keys) {
      if (dirty[k] && !clientErrors[k]) {
        delete out[k];
      }
    }

    return out;
  }, [serverState?.fieldErrors, validation.fieldErrors, dirty]);

  const isNameValidNow = !mergedFieldErrors?.name;
  const canSubmit = validation.ok && !isPending;

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

  const focusFirstInvalid = (errors = mergedFieldErrors) => {
    if (errors?.name) return nameRef.current?.focus();
    if (errors?.niche) return nicheRef.current?.focus();
    if (errors?.preferred_channel) return channelRef.current?.focus();
    if (errors?.whatsapp) return whatsappRef.current?.focus();
    if (errors?.site_url) return siteRef.current?.focus();
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    setSubmitted(true);

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
      focusFirstInvalid(v.fieldErrors);
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
          <FeedbackMessage tone="error">{serverState.formError}</FeedbackMessage>
        ) : null}

        <form action={action} onSubmit={onSubmit} className="space-y-5">
          <input type="hidden" name="account_subdomain" value={accountSubdomain} />

          <FormField>
            <FormFieldLabel htmlFor="name" required>
              Nome do projeto
            </FormFieldLabel>
            <Input
              id="name"
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
              placeholder="Ex.: Unico Digital"
              autoComplete="off"
              enterKeyHint={isMobile ? "next" : undefined}
            />
            {showFieldError("name") ? (
              <FormFieldError>{showFieldError("name")}</FormFieldError>
            ) : (
              <FormFieldHint>Digite o nome do projeto que aparecerá no seu dashboard.</FormFieldHint>
            )}
          </FormField>

          <FormField>
            <FormFieldLabel htmlFor="niche" required>Nicho</FormFieldLabel>
            <Input
              id="niche"
              name="niche"
              ref={nicheRef}
              value={niche}
              onChange={(e) => {
                setNiche(e.target.value);
                setTouched((t) => ({ ...t, niche: true }));
                setDirty((d) => ({ ...d, niche: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, niche: true }))}
              disabled={isPending}
              placeholder="Ex.: Harmonização facial"
              autoComplete="off"
              enterKeyHint={isMobile ? "next" : undefined}
            />
            {showFieldError("niche") ? (
              <FormFieldError>{showFieldError("niche")}</FormFieldError>
            ) : null}
          </FormField>

          {shouldShowChannel ? (
            <FormField>
              <FormFieldLabel htmlFor="preferred_channel">Preferência de canal</FormFieldLabel>
              <Select
                id="preferred_channel"
                name="preferred_channel"
                ref={channelRef}
                value={preferredChannel}
                onChange={(e) => {
                  setPreferredChannel(e.target.value as any);
                  setTouched((t) => ({ ...t, preferred_channel: true }));
                  setDirty((d) => ({ ...d, preferred_channel: true }));
                }}
                disabled={isPending}
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
              {showFieldError("preferred_channel") ? (
                <FormFieldError>{showFieldError("preferred_channel")}</FormFieldError>
              ) : null}
            </FormField>
          ) : null}

          {shouldShowWhatsapp ? (
            <FormField>
              <FormFieldLabel htmlFor="whatsapp">WhatsApp</FormFieldLabel>
              <Input
                id="whatsapp"
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
                placeholder="Somente dígitos (10–15)"
                autoComplete="off"
                inputMode="tel"
                enterKeyHint={isMobile ? "next" : undefined}
              />
              {showFieldError("whatsapp") ? (
                <FormFieldError>{showFieldError("whatsapp")}</FormFieldError>
              ) : null}
            </FormField>
          ) : null}

          {shouldShowSite ? (
            <FormField>
              <FormFieldLabel htmlFor="site_url">Link da LP/site (opcional)</FormFieldLabel>
              <Input
                id="site_url"
                name="site_url"
                ref={siteRef}
                value={siteUrl}
                onChange={(e) => {
                  setSiteUrl(e.target.value);
                  setDirty((d) => ({ ...d, site_url: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, site_url: true }))}
                disabled={isPending}
                placeholder="dominio.com.br ou https://..."
                autoComplete="off"
                inputMode="url"
                enterKeyHint={isMobile ? "done" : undefined}
              />
              {showFieldError("site_url") ? (
                <FormFieldError>{showFieldError("site_url")}</FormFieldError>
              ) : null}
            </FormField>
          ) : null}

          <Button type="submit" disabled={!canSubmit}>
            {isPending ? "Salvando…" : "Salvar e continuar"}
          </Button>
        </form>
      </div>
    </main>
  );
}

// app/a/[account]/page.tsx
"use client";

import { useMemo, useActionState } from "react";
import { useAccessContext } from "@/providers/AccessProvider";
import {
  saveSetupAndContinueAction,
  type SetupSaveState,
} from "./actions";

type DashState = "auth" | "onboarding" | "public";

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

    const setupCompletedAt = (ctx?.account?.setupCompletedAt ?? null) as
      | string
      | null;

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

  const [state, action, isPending] = useActionState(
    saveSetupAndContinueAction,
    initialState
  );

  const defaultName = (ctx?.account?.name ?? `Conta ${accountSubdomain}`) as string;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Primeiros passos</h1>
          <p className="text-sm text-gray-600">
            Complete uma configuração rápida para continuar.
          </p>
        </div>

        {state?.formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.formError}
          </div>
        ) : null}

        <form action={action} className="space-y-5">
          {/* Guard do handler é server-side via Access Context, mas precisamos do subdomain para resolver o tenant */}
          <input type="hidden" name="account_subdomain" value={accountSubdomain} />

          <div className="space-y-1">
            <label className="text-sm font-medium">Nome do projeto</label>
            <input
              name="name"
              defaultValue={defaultName}
              disabled={isPending}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder={`Conta ${accountSubdomain}`}
              autoComplete="off"
            />
            {state?.fieldErrors?.name ? (
              <p className="text-sm text-red-600">{state.fieldErrors.name}</p>
            ) : (
              <p className="text-xs text-gray-500">
                Dica: não pode ser o nome padrão da conta.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Nicho (opcional)</label>
            <input
              name="niche"
              disabled={isPending}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ex.: Harmonização facial"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Preferência de canal</label>
            <select
              name="preferred_channel"
              defaultValue="email"
              disabled={isPending}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            {state?.fieldErrors?.preferred_channel ? (
              <p className="text-sm text-red-600">
                {state.fieldErrors.preferred_channel}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">WhatsApp (opcional)</label>
            <input
              name="whatsapp"
              disabled={isPending}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Somente dígitos (10–15)"
              autoComplete="off"
            />
            {state?.fieldErrors?.whatsapp ? (
              <p className="text-sm text-red-600">
                {state.fieldErrors.whatsapp}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Link da LP/site (opcional)</label>
            <input
              name="site_url"
              disabled={isPending}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="https://..."
              autoComplete="off"
            />
            {state?.fieldErrors?.site_url ? (
              <p className="text-sm text-red-600">
                {state.fieldErrors.site_url}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isPending}
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
        <p className="text-sm text-gray-600">
          Faça login ou crie sua conta para continuar.
        </p>
      </div>
    </main>
  );
}

function DashboardPublic() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">LP Factory</h1>
        <p className="text-sm text-gray-600">
          Acesse sua conta ou visite a home pública.
        </p>
      </div>
    </main>
  );
}

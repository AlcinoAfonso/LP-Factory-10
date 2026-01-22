// app/a/[account]/page.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAccessContext } from "@/providers/AccessProvider";

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
      | "trial"
      | null;

    if (accountStatus === "pending_setup") {
      return <PendingSetupShowcase />;
    }

    // Mantém o dashboard “limpo” para demais status (por enquanto)
    return <main className="mx-auto max-w-5xl px-6 py-10" />;
  }

  if (state === "onboarding") {
    return <DashboardOnboarding />;
  }

  return <DashboardPublic />;
}

function PendingSetupShowcase() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Modo vitrine</h1>
          <p className="text-sm text-gray-600">
            Você pode navegar e ver uma LP demo completa, mas sem publicar e sem
            recursos ativos (ex.: tracking). Para operar, inicie o Starter ou
            peça uma conta consultiva.
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <h2 className="text-base font-semibold">LP Demo (visualização)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Exemplo do que você terá quando a conta estiver ativa.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">Seções prontas</p>
              <p className="mt-1 text-sm text-gray-600">
                Hero, prova social, FAQ, CTA, formulário.
              </p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">Recursos (bloqueados)</p>
              <p className="mt-1 text-sm text-gray-600">
                Publicação, domínio, tracking e integrações.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="mailto:suporte@lpfactory.com.br?subject=LP%20Factory%20-%20Quero%20iniciar%20Starter"
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Iniciar Starter
          </a>

          <a
            href="mailto:suporte@lpfactory.com.br?subject=LP%20Factory%20-%20Quero%20conta%20consultiva"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Quero conta consultiva
          </a>

          <Link
            href="/a/home?clear_last=1"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Trocar de conta
          </Link>
        </div>
      </div>
    </main>
  );
}

function DashboardOnboarding() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-700">
      <p className="mb-3">
        Bem-vindo! Vamos criar sua primeira conta para começar.
      </p>
      <a
        href="/a/home?modal=new"
        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Criar primeira conta
      </a>
    </main>
  );
}

function DashboardPublic() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-gray-600">
        Use os botões no topo para entrar ou criar sua conta.
      </p>
    </main>
  );
}

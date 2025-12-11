// app/a/[account]/page.tsx
"use client";

import { useMemo } from "react";
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

  // Estado autenticado: por enquanto, dashboard “limpo” (sem diagnóstico/IDs/slug)
  if (state === "auth") {
    return <main className="mx-auto max-w-5xl px-6 py-10" />;
  }

  // Estados não autenticados seguem mínimos
  if (state === "onboarding") {
    return <DashboardOnboarding />;
  }

  return <DashboardPublic />;
}

/* ===================== Components ===================== */

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

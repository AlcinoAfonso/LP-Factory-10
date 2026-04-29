// app/a/[account]/page.tsx
"use client";

import { useMemo } from "react";
import { useAccessContext } from "@/providers/AccessProvider";
import { PendingSetupFirstSteps } from "./_components/PendingSetupFirstSteps";

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

    if (accountStatus === "pending_setup") {
      return <PendingSetupFirstSteps accountSubdomain={params.account} ctx={ctx} />;
    }

    return <main className="mx-auto max-w-5xl px-6 py-10" />;
  }

  if (state === "onboarding") {
    return <DashboardOnboarding />;
  }

  return <DashboardPublic />;
}

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

// app/a/[account]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccessContext } from "@/providers/AccessProvider";
import { createClient } from "@/supabase/client";

type DashState = "public" | "onboarding" | "auth" | "invalid";

export default function Page({ params }: { params: { account: string } }) {
  const router = useRouter();
  const supabase = createClient();

  const ctx = useAccessContext() as any;
  const [email, setEmail] = useState<string | null>(null);

  const isHome = params.account === "home";
  const hasCtx = Boolean(ctx?.account || ctx?.member);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setEmail(data.user?.email ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setEmail(sess?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const state: DashState = useMemo(() => {
    if (!email) return "public";
    if (isHome && !hasCtx) return "onboarding";
    if (hasCtx) return "auth";
    return "invalid";
  }, [email, isHome, hasCtx]);

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
    router.replace(`/a/${params.account}`);
    router.refresh();
  }

  return (
    <>
      <Header
        email={email}
        role={ctx?.member?.role}
        accountName={ctx?.account?.name ?? params.account}
        accountSlug={ctx?.account?.subdomain ?? params.account}
        onSignOut={signOut}
      />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Account Dashboard</h1>

        {state === "auth" && (
          <DashboardAuthenticated
            accountName={ctx?.account?.name}
            accountId={ctx?.account?.id}
            accountSlug={ctx?.account?.subdomain}
            role={ctx?.member?.role}
            memberStatus={ctx?.member?.status}
          />
        )}

        {state === "onboarding" && <DashboardOnboarding />}

        {state === "public" && <DashboardPublic />}

        {state === "invalid" && (
          <p className="mt-2 text-gray-600">
            Não foi possível resolver seu vínculo de acesso para esta conta.
          </p>
        )}
      </main>
    </>
  );
}

/* ===================== Components ===================== */

function Header({
  email,
  role,
  accountName,
  accountSlug,
  onSignOut,
}: {
  email: string | null;
  role?: string;
  accountName: string;
  accountSlug: string;
  onSignOut: () => Promise<void>;
}) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="text-sm font-semibold tracking-wide">
          LP Factory — <span className="text-gray-600">{accountName}</span>
          <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-gray-600">
            /a/{accountSlug}
          </span>
        </div>

        {email ? (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="font-medium">{email}</span>{" "}
              <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">
                {role ?? "—"}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Sair
            </button>
            <div
              aria-label="Avatar do usuário"
              className="ml-1 h-8 w-8 rounded-full border border-gray-300 bg-gray-100"
            />
          </div>
        ) : (
          <nav className="flex items-center gap-3">
            <a
              href="/auth/login"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Entrar
            </a>
            <a
              href="/auth/sign-up"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Criar conta
            </a>
            <div
              aria-label="Avatar do usuário"
              className="ml-2 h-8 w-8 rounded-full border border-gray-300 bg-gray-100"
            />
          </nav>
        )}
      </div>
    </header>
  );
}

function DashboardAuthenticated({
  accountName,
  accountId,
  accountSlug,
  role,
  memberStatus,
}: {
  accountName?: string;
  accountId?: string;
  accountSlug?: string;
  role?: string;
  memberStatus?: string;
}) {
  return (
    <div className="mt-4 grid gap-2 text-sm text-gray-700">
      <div>
        <span className="font-medium">Conta: </span>
        {accountName ?? "—"}{" "}
        <span className="text-gray-500">({accountId ?? "—"})</span>
      </div>
      <div>
        <span className="font-medium">Slug: </span>
        {accountSlug ?? "—"}
      </div>
      <div>
        <span className="font-medium">Papel: </span>
        {role ?? "—"}
      </div>
      <div>
        <span className="font-medium">Status membro: </span>
        {memberStatus ?? "—"}
      </div>
    </div>
  );
}

function DashboardOnboarding() {
  return (
    <div className="mt-4 space-y-3 text-gray-700">
      <p>Bem-vindo! Vamos criar sua primeira conta para começar.</p>
      <a
        href="/a/home?modal=new"
        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Criar primeira conta
      </a>
    </div>
  );
}

function DashboardPublic() {
  return (
    <p className="mt-2 text-gray-600">
      Use os botões no topo para entrar ou criar sua conta.
    </p>
  );
}

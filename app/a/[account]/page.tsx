"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccessContext } from "@/providers/AccessProvider";
import { createClient } from "@/supabase/client";
import AlertBanner from "@/components/ui/AlertBanner"; // ✅ novo import

type DashState = "public" | "onboarding" | "auth" | "invalid";

export default function Page({ params }: { params: { account: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const ctx = useAccessContext() as any;
  const [email, setEmail] = useState<string | null>(null);

  const isHome = params.account === "home";
  const hasCtx = Boolean(ctx?.account || ctx?.member);

  // Query params para abrir modais/estados (6.2.2)
  const modalQP = searchParams.get("modal");
  const stateQP = searchParams.get("state");
  const qpOnboarding = modalQP === "new" || stateQP === "onboarding";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpa a URL após abrir via query (?modal / ?state) — 6.2.2
  useEffect(() => {
    if (modalQP || stateQP) {
      const url = new URL(window.location.href);
      url.searchParams.delete("modal");
      url.searchParams.delete("state");
      router.replace(url.pathname + url.hash, { scroll: false });
    }
  }, [modalQP, stateQP, router]);

  const state: DashState = useMemo(() => {
    if (!email) return "public";
    if ((isHome && !hasCtx) || qpOnboarding) return "onboarding";
    if (hasCtx) return "auth";
    return "invalid";
  }, [email, isHome, hasCtx, qpOnboarding]);

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
    router.replace(`/a/${params.account}`);
    router.refresh();
  }

  const role = ctx?.member?.role ?? "—";
  const accountName = ctx?.account?.name ?? params.account;
  const accountSlug = ctx?.account?.subdomain ?? params.account;

  // ✅ status da conta vindo do Access Context (para exibir o banner do E7)
  const accountStatus = ctx?.account?.status as
    | "active"
    | "inactive"
    | "suspended"
    | "pending_setup"
    | "trial"
    | undefined;

  return (
    <>
      {/* HEADER */}
      <Header
        email={email}
        role={role}
        accountName={accountName}
        accountSlug={accountSlug}
        onSignOut={signOut}
      />

      {/* CONTEÚDO */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Account Dashboard</h1>

        {/* ✅ Banner E7: aparece apenas enquanto a conta estiver em pending_setup */}
        {accountStatus === "pending_setup" && (
          <AlertBanner
            type="info"
            title="Defina o nome da sua conta"
            description="Você pode alterá-lo quando quiser. Ao salvar, sua conta será ativada."
            actionLabel="Salvar nome da conta"
            fields={[
              { name: "name", type: "text", placeholder: "Nome da conta", required: true, minLength: 3 },
              { name: "account_id", type: "hidden", defaultValue: ctx?.account?.id },
              { name: "user_id", type: "hidden", defaultValue: ctx?.member?.user_id }, // opcional
            ]}
            onSubmit={async (fd) => {
              const { renameAccountAction } = await import("./actions");
              await renameAccountAction(undefined, fd);
            }}
          />
        )}

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

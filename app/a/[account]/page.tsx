"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccessContext } from "@/providers/AccessProvider";
import { createClient } from "@/supabase/client";

export default function Page({ params }: { params: { account: string } }) {
  const router = useRouter();
  const supabase = createClient();

  const ctx = useAccessContext();
  const anyCtx = (ctx ?? {}) as any;
  const [email, setEmail] = useState<string | null>(null);

  const isHome = params.account === "home";
  const hasCtx = Boolean(anyCtx.account || anyCtx.member);

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

  async function signOut() {
    await supabase.auth.signOut();
    setEmail(null);
    router.replace(`/a/${params.account}`);
    router.refresh();
  }

  const role = anyCtx.member?.role ?? "—";
  const accountName = anyCtx.account?.name ?? params.account;
  const accountSlug = anyCtx.account?.subdomain ?? params.account;

  // Estados:
  // - Public: !email (anônimo)
  // - Onboarding: isHome && email && !hasCtx
  // - Authenticated: hasCtx
  // - Slug inválido: email && !isHome && !hasCtx
  const state = useMemo<"public" | "onboarding" | "auth" | "invalid">(() => {
    if (!email) return "public";
    if (isHome && !hasCtx) return "onboarding";
    if (hasCtx) return "auth";
    return "invalid";
  }, [email, isHome, hasCtx]);

  return (
    <>
      {/* HEADER */}
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
                  {role}
                </span>
              </div>
              <button
                onClick={signOut}
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

      {/* CONTEÚDO */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Account Dashboard</h1>

        {state === "auth" && (
          <div className="mt-4 grid gap-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">Conta: </span>
              {anyCtx.account?.name ?? "—"}{" "}
              <span className="text-gray-500">({anyCtx.account?.id ?? "—"})</span>
            </div>
            <div>
              <span className="font-medium">Slug: </span>
              {anyCtx.account?.subdomain ?? "—"}
            </div>
            <div>
              <span className="font-medium">Papel: </span>
              {anyCtx.member?.role ?? "—"}
            </div>
            <div>
              <span className="font-medium">Status membro: </span>
              {anyCtx.member?.status ?? "—"}
            </div>
          </div>
        )}

        {state === "onboarding" && (
          <div className="mt-4 space-y-3 text-gray-700">
            <p>Bem-vindo! Vamos criar sua primeira conta para começar.</p>
            <a
              href="/a/home?modal=new"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Criar primeira conta
            </a>
          </div>
        )}

        {state === "public" && (
          <p className="mt-2 text-gray-600">
            Use os botões no topo para entrar ou criar sua conta.
          </p>
        )}

        {state === "invalid" && (
          <p className="mt-2 text-gray-600">
            Não foi possível resolver seu vínculo de acesso para esta conta.
          </p>
        )}
      </main>
    </>
  );
}

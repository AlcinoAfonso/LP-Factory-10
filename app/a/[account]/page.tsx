"use client";

import { useEffect, useState } from "react";
import AuthDialog from "@/components/auth/AuthDialog";
import { useAccessContext } from "@/providers/AccessProvider";
import { supabase } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "recovery" | "invite";

export default function Page({ params }: { params: { account: string } }) {
  const ctx = useAccessContext(); // ✅ dados: account, member, role, status, etc.
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<Mode>("login");
  const [email, setEmail] = useState<string | null>(null);

  // Apenas e-mail via Auth (sem SQL). Restante vem do AccessContext.
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
  }

  const role = ctx?.member?.role ?? "—";
  const accountName = ctx?.account?.name ?? params.account;
  const accountSlug = ctx?.account?.subdomain ?? params.account;

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
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  setAuthMode("signup");
                  setAuthOpen(true);
                }}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Criar conta
              </button>
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

        {ctx ? (
          <div className="mt-4 grid gap-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">Conta: </span>
              {ctx.account?.name ?? "—"}{" "}
              <span className="text-gray-500">({ctx.account?.id ?? "—"})</span>
            </div>
            <div>
              <span className="font-medium">Slug: </span>
              {ctx.account?.subdomain ?? "—"}
            </div>
            <div>
              <span className="font-medium">Papel: </span>
              {ctx.member?.role ?? "—"}
            </div>
            <div>
              <span className="font-medium">Status membro: </span>
              {ctx.member?.status ?? "—"}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-gray-600">
            {email
              ? "Não foi possível resolver seu vínculo de acesso para esta conta."
              : "Use os links no header para continuar."}
          </p>
        )}
      </main>

      {/* AUTH DIALOG */}
      <AuthDialog
        context="account"
        mode={authMode}
        open={authOpen}
        onOpenChange={setAuthOpen}
        onRequestModeChange={setAuthMode}
      />
    </>
  );
}

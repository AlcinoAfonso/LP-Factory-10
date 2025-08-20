"use client";

import { useEffect, useState } from "react";
import AuthDialog from "../../../src/components/auth/AuthDialog";
import { supabase } from "../../../lib/supabase-browser";

type Mode = "login" | "signup" | "recovery" | "invite";

export default function Page({ params }: { params: { account: string } }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<Mode>("login");
  const [email, setEmail] = useState<string | null>(null);

  // carrega sessão e escuta mudanças de auth
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setEmail(data.user?.email ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
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

  return (
    <>
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="text-sm font-semibold tracking-wide">LP Factory</div>

          {email ? (
            <div className="flex items-center gap-3">
              <div className="text-sm">
                <span className="font-medium">{email}</span>{" "}
                <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">owner</span>
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
        <h1 className="text-3xl font-semibold">Account Dashboard (pré-acesso)</h1>
        <p className="mt-2 text-gray-600">
          {email
            ? "Você está autenticado. Em breve listaremos suas contas aqui."
            : "Use os links no header para continuar."}
        </p>
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

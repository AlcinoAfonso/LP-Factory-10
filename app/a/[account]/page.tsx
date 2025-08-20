"use client";

import { useState } from "react";
import AuthDialog from "../../../src/components/auth/AuthDialog";

export default function Page({ params }: { params: { account: string } }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] =
    useState<"login" | "signup" | "recovery" | "invite">("login");

  return (
    <>
      {/* HEADER P&B */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="text-sm font-semibold tracking-wide">LP Factory</div>
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
        </div>
      </header>

      {/* CONTEÚDO MÍNIMO */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Account Dashboard (pré-acesso)</h1>
        <p className="mt-2 text-gray-600">Use os links no header para continuar.</p>
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

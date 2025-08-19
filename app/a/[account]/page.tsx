"use client";

import { useEffect, useRef, useState } from "react";

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function Modal({ title, open, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.activeElement as HTMLElement | null;
    setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("input, button, [tabindex]:not([tabindex='-1'])")
        ?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50">
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Page({ params }: { params: { account: string } }) {
  const [openSignIn, setOpenSignIn] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <>
      {/* HEADER P&B */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="text-sm font-semibold tracking-wide">LP Factory</div>
          <nav className="flex items-center gap-3">
            <button
              onClick={() => setOpenSignIn(true)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Entrar
            </button>
            <button
              onClick={() => setOpenCreate(true)}
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

      {/* Modal Entrar */}
      <Modal title="Entrar" open={openSignIn} onClose={() => setOpenSignIn(false)}>
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">E-mail</span>
            <input
              type="email"
              placeholder="seu@email.com"
              className="rounded-xl border px-3 py-2 outline-none focus:ring"
            />
          </label>
          <button
            type="submit"
            disabled
            className="mt-2 rounded-xl bg-gray-900 px-4 py-2 text-white disabled:opacity-40"
            title="Desabilitado nesta etapa"
          >
            Continuar
          </button>
        </form>
      </Modal>

      {/* Modal Criar conta */}
      <Modal title="Criar conta" open={openCreate} onClose={() => setOpenCreate(false)}>
        <form onSubmit={(e) => e.preventDefault()} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Nome da conta</span>
            <input
              type="text"
              placeholder="ex.: Clínica Exemplo"
              className="rounded-xl border px-3 py-2 outline-none focus:ring"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Seu e-mail</span>
            <input
              type="email"
              placeholder="seu@email.com"
              className="rounded-xl border px-3 py-2 outline-none focus:ring"
            />
          </label>
          <button
            type="submit"
            disabled
            className="mt-2 rounded-xl bg-gray-900 px-4 py-2 text-white disabled:opacity-40"
            title="Desabilitado nesta etapa"
          >
            Criar
          </button>
        </form>
      </Modal>
    </>
  );
}

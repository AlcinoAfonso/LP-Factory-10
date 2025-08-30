// src/components/auth/AuthDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./auth-forms/LoginForm";
import RecoveryForm from "./auth-forms/RecoveryForm";

type Props = {
  context: "account" | "admin" | "partner" | "workspace";
  mode: "login" | "signup" | "recovery" | "invite";
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onRequestModeChange?: (m: Props["mode"]) => void;
};

// PPS 8.x — chave de sincronização (usar mesma string na tela /auth/reset)
const KEY = "lf10:auth_reset_success";

export default function AuthDialog({
  context,
  mode,
  open,
  onOpenChange,
  onRequestModeChange,
}: Props) {
  const router = useRouter();
  const [synced, setSynced] = useState(false); // idempotência
  // timer robusto p/ Node/Edge/Browser
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Consumir sinal on-mount (caso o evento tenha ocorrido antes de montarmos)
  useEffect(() => {
    try {
      // só consome se modal estiver aberto
      if (open && !synced && typeof window !== "undefined") {
        const had = window.localStorage.getItem(KEY);
        if (had) {
          // telemetria leve (sem PII)
          console.log({
            event: "modal_sync",
            action: "consume_on_mount",
            ts: Date.now(),
          });
          setSynced(true);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            try {
              router.refresh();
            } catch {}
            onOpenChange(false); // fecha modal
            try {
              window.localStorage.removeItem(KEY);
            } catch {}
          }, 500);
        }
      }
    } catch {
      // localStorage indisponível — usuário pode usar fallback “Verificar status”
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, synced]);

  // Listener de storage para sincronização entre abas
  useEffect(() => {
    if (!open) return; // ativa listener só com modal aberto
    const onStorage = (e: StorageEvent) => {
      if (synced) return; // idempotência
      if (e.key === KEY && e.newValue) {
        console.log({
          event: "modal_sync",
          action: "consume_storage_event",
          ts: Date.now(),
        });
        setSynced(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          try {
            router.refresh();
          } catch {}
          onOpenChange(false); // fecha modal
          try {
            window.localStorage.removeItem(KEY);
          } catch {}
        }, 500);
      }
    };
    try {
      window.addEventListener("storage", onStorage);
    } catch {}
    return () => {
      try {
        window.removeEventListener("storage", onStorage);
      } catch {}
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, synced]);

  const title =
    mode === "login"
      ? "Entrar"
      : mode === "signup"
      ? "Criar conta"
      : mode === "recovery"
      ? "Recuperar acesso"
      : "Convite";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "login" && "Acesse sua conta com seu e-mail e senha."}
            {mode === "signup" && "Crie sua conta gratuita."}
            {mode === "recovery" && "Digite seu e-mail para recuperar o acesso."}
            {mode === "invite" && "Finalize o convite recebido."}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" && (
          <LoginForm
            onForgotClick={() => onRequestModeChange?.("recovery")}
            onSuccess={() => onOpenChange(false)} // fecha modal só no sucesso
          />
        )}

        {mode === "recovery" && (
          <RecoveryForm onBackToLogin={() => onRequestModeChange?.("login")} />
        )}

        {mode !== "login" && mode !== "recovery" && (
          <div className="text-sm text-gray-500">
            Formulário “{mode}” virá na próxima etapa.
          </div>
        )}

        {/* Fallback: se localStorage estiver bloqueado, usuário pode verificar */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              console.log({
                event: "modal_sync",
                action: "manual_check",
                ts: Date.now(),
              });
              try {
                const had = window.localStorage.getItem(KEY);
                if (had && !synced) {
                  setSynced(true);
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    try {
                      router.refresh();
                    } catch {}
                    onOpenChange(false);
                    try {
                      window.localStorage.removeItem(KEY);
                    } catch {}
                  }, 500);
                  return;
                }
              } catch {}
              try {
                router.refresh();
              } catch {}
            }}
          >
            Verificar status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

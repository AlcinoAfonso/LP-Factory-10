"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import LoginForm from "./auth-forms/LoginForm";
import RecoveryForm from "./auth-forms/RecoveryForm";

type Props = {
  context: "account" | "admin" | "partner" | "workspace";
  mode: "login" | "signup" | "recovery" | "invite";
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onRequestModeChange?: (m: Props["mode"]) => void;
};

export default function AuthDialog({
  context,
  mode,
  open,
  onOpenChange,
  onRequestModeChange,
}: Props) {
  const router = useRouter();
  const debounceTimer = useRef<number | null>(null);

  // Listener de sincronização (PPS 2.2 / 8.2)
  useEffect(() => {
    function handleStorage(ev: StorageEvent) {
      if (ev.key === "lf10:auth_reset_success" && ev.newValue) {
        if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

        debounceTimer.current = window.setTimeout(() => {
          localStorage.removeItem("lf10:auth_reset_success");
          onOpenChange(false); // fecha modal
          router.refresh(); // garante atualização pós-reset
        }, 500);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [onOpenChange, router]);

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
            onSuccess={() => onOpenChange(false)} // login fecha modal
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
      </DialogContent>
    </Dialog>
  );
}

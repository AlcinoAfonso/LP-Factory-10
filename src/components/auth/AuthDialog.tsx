"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import LoginForm from "./auth-forms/LoginForm";
import RecoveryForm from "./auth-forms/RecoveryForm";

type Props = {
  context: "account" | "admin" | "partner" | "workspace";
  mode: "login" | "signup" | "recovery" | "invite";
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onRequestModeChange?: (m: Props["mode"]) => void;
};

export default function AuthDialog({ context, mode, open, onOpenChange, onRequestModeChange }: Props) {
  const title = mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : mode === "recovery" ? "Recuperar acesso" : "Convite";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{context} — {mode}</DialogDescription>
        </DialogHeader>

        {mode === "login" && (
          <LoginForm
            onSuccess={() => onOpenChange(false)}
            onForgotClick={() => onRequestModeChange?.("recovery")}
          />
        )}

        {mode === "recovery" && (
          <RecoveryForm onBackToLogin={() => onRequestModeChange?.("login")} />
        )}

        {mode !== "login" && mode !== "recovery" && (
          <div className="text-sm text-gray-500">Formulário “{mode}” virá na próxima etapa.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

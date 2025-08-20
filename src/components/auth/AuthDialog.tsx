"use client";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import LoginForm from "./auth-forms/LoginForm";

type Props = {
  context: "account" | "admin" | "partner" | "workspace";
  mode: "login" | "signup" | "recovery" | "invite";
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

export default function AuthDialog({ context, mode, open, onOpenChange }: Props) {
  const title =
    mode === "login" ? "Entrar" :
    mode === "signup" ? "Criar conta" :
    mode === "recovery" ? "Recuperar acesso" : "Convite";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{context} — {mode}</DialogDescription>
        </DialogHeader>

        {mode === "login" ? (
          <LoginForm />
        ) : (
          <div className="text-sm text-gray-500">Formulário “{mode}” virá na próxima etapa.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

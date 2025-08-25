"use client";
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
            {mode === "recovery" &&
              "Digite seu e-mail para recuperar o acesso."}
            {mode === "invite" && "Finalize o convite recebido."}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" && (
          <LoginForm
            context={context}
            onRequestModeChange={onRequestModeChange}
          />
        )}

        {mode === "recovery" && (
          <RecoveryForm
            onBackToLogin={() => {
              // Ao concluir o envio ou clicar em voltar → troca para login
              onRequestModeChange?.("login");
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

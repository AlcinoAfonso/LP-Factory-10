// app/auth/reset/page.tsx
"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

// Opção 2 (PPS ajustado):
// - /auth/reset só é acessada em state=valid (confirm já filtrou erros)
// - Nenhuma leitura de query/state aqui; apenas o formulário de nova senha

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function ResetPasswordPage() {
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  function validatePassword(): string | null {
    if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
      return "Use ao menos 1 letra maiúscula, 1 minúscula e 1 número.";
    }
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

  async function handleReset() {
    setMsg(null);
    const v = validatePassword();
    if (v) {
      setMsg(v);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setLoading(false);

    if (error) {
      setMsg("Não foi possível atualizar a senha. Tente novamente.");
      return;
    }

    setMsg("Senha atualizada com sucesso! Redirecionando…");
    try {
      // Sinal para o AuthDialog fechar + refresh (PPS 8.x)
      localStorage.setItem("lf10:auth_reset_success", String(Date.now()));
    } catch {
      /* ignore */
    }

    // Redireciona após 3s para o destino padrão multi-tenant
    closeTimer.current = window.setTimeout(() => {
      window.location.href = "/a";
    }, 3000);
  }

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-xl font-semibold">Redefinir senha</h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="pwd1">Nova senha</Label>
          <Input
            id="pwd1"
            type="password"
            value={pwd1}
            onChange={(e) => setPwd1(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="pwd2">Confirmar senha</Label>
          <Input
            id="pwd2"
            type="password"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
          />
        </div>
      </div>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      <div className="flex gap-2">
        <Button disabled={loading} onClick={handleReset}>
          {loading ? "Atualizando..." : "Salvar nova senha"}
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/")}>
          Voltar ao login
        </Button>
      </div>
    </div>
  );
}

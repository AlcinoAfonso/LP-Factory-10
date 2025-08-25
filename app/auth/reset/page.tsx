"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function validate(): string | null {
    if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
      return "Use ao menos 1 letra maiúscula, 1 minúscula e 1 número.";
    }
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

  async function handleReset() {
    setMsg(null);
    const error = validate();
    if (error) {
      setMsg(error);
      return;
    }
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: pwd1,
      });
      if (updateError) {
        if (updateError.message.includes("expired")) {
          setMsg("O link expirou, solicite uma nova redefinição de senha.");
        } else {
          setMsg("Não foi possível atualizar a senha. Tente novamente.");
        }
        return;
      }
      setOk(true);
      setMsg("Senha atualizada com sucesso! Você será redirecionado.");
    } finally {
      setLoading(false);
    }
  }

  // Redirect automático após sucesso
  useEffect(() => {
    if (ok) {
      const t = setTimeout(() => {
        router.push("/a"); // middleware cuida de /a → /a/demo
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [ok, router]);

  if (ok) {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Senha redefinida</h1>
        <p>{msg}</p>
        <Button onClick={() => router.push("/a")}>
          Ir para página principal
        </Button>
      </div>
    );
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

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <Button disabled={loading} onClick={handleReset}>
        {loading ? "Atualizando..." : "Salvar nova senha"}
      </Button>
    </div>
  );
}

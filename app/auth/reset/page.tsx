"use client";

export const dynamic = "force-dynamic"; // força CSR, evita erro no build

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ResetState = "valid" | "expired" | "used" | "invalid";

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const state = (params.get("state") as ResetState) || "invalid";
  const reason = params.get("reason") || null;

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

    setMsg("Senha atualizada com sucesso! Este diálogo será fechado.");
    // PPS 8.1: sinalizar sucesso via localStorage
    localStorage.setItem("lf10:auth_reset_success", String(Date.now()));

    // redirect após 3s (fallback)
    closeTimer.current = window.setTimeout(() => {
      router.push("/a");
    }, 3000);
  }

  // limpar timer
  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // ---- UI ----
  if (state === "invalid") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">
          {reason === "expired"
            ? "Este link expirou."
            : reason === "used"
            ? "Este link já foi usado."
            : "Link inválido."}
        </p>
        <Button onClick={() => router.push("/a")}>Voltar</Button>
      </div>
    );
  }

  if (state !== "valid") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">
          {state === "expired"
            ? "Este link expirou."
            : state === "used"
            ? "Este link já foi usado."
            : "Link inválido."}
        </p>
        <Button onClick={() => router.push("/a")}>Voltar</Button>
      </div>
    );
  }

  // state === "valid"
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

      <Button disabled={loading} onClick={handleReset}>
        {loading ? "Atualizando..." : "Salvar nova senha"}
      </Button>
    </div>
  );
}

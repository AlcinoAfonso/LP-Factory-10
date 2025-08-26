"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type Props = {
  onForgotClick?: () => void;
  /** Fecha o modal no sucesso (AuthDialog passa isso). */
  onSuccess?: () => void;
};

export default function LoginForm({ onForgotClick, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // throttle progressivo
  const [failCount, setFailCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function applyThrottle(nextFails: number) {
    if (nextFails === 3) setCooldown(3);
    else if (nextFails >= 5) setCooldown(10);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading || cooldown > 0) return;

    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pwd,
    });

    setLoading(false);

    if (!error) {
      // 1) fecha o modal (UX)
      onSuccess?.();

      // 2) aguarda um tick para cookies de sessão estabilizarem
      // (defensivo; evita race com render SSR de /a)
      await new Promise((r) => setTimeout(r, 150));

      // 3) navegação FULL para garantir envio de cookies ao servidor
      if (typeof window !== "undefined") {
        window.location.assign("/a"); // middleware leva ao slug canônico (/a/demo)
      }
      return;
    }

    // erro
    const msg = (error.message || "").toLowerCase();
    const isNetwork = msg.includes("fetch") || msg.includes("network");
    if (isNetwork) {
      setErr("Erro de conexão. Tente novamente.");
      return;
    }

    // erro de credencial (mensagem genérica)
    setErr("E-mail ou senha incorretos");
    setPwd(""); // por segurança
    const nextFails = failCount + 1;
    setFailCount(nextFails);
    applyThrottle(nextFails);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pwd">Senha</Label>
        <Input
          id="pwd"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {cooldown > 0 && (
        <p className="text-sm text-muted-foreground">
          Aguarde {cooldown}s antes de tentar novamente.
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || cooldown > 0}
        className="w-full"
      >
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onForgotClick}
          className="text-sm underline text-muted-foreground hover:text-foreground"
        >
          Esqueci minha senha
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type Props = {
  onSuccess?: () => void;
  onForgotClick?: (email: string) => void;
};

export default function LoginForm({ onSuccess, onForgotClick }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Throttle progressivo
  const [fails, setFails] = useState(0);
  const wait = useMemo(() => (fails >= 5 ? 10 : fails >= 3 ? 3 : 0), [fails]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Já logado → pular modal
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        onSuccess?.() ?? router.push("/a");
      }
    })();
  }, [onSuccess, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    setErr(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pwd,
      });
      if (error) {
        // Erro de credencial (mensagem genérica)
        setErr("E-mail ou senha incorretos.");
        setPwd("");
        setFails((n) => n + 1);
        if (wait > 0) setCooldown(wait);
        return;
      }
      // Sucesso
      onSuccess?.() ?? router.push("/a");
    } catch {
      setErr("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="pwd">Senha</Label>
        <Input
          id="pwd"
          type="password"
          required
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
      </div>

      {err && (
        <p className="text-sm text-red-600">
          {cooldown > 0 ? `Aguarde ${cooldown}s antes de tentar novamente.` : err}
        </p>
      )}

      <Button type="submit" disabled={loading || cooldown > 0} className="w-full">
        {loading ? "Entrando..." : cooldown > 0 ? `Aguarde ${cooldown}s` : "Entrar"}
      </Button>

      <div className="text-sm text-center">
        <button
          type="button"
          className="text-blue-600 hover:underline"
          onClick={() => onForgotClick?.(email)}
        >
          Esqueci minha senha
        </button>
      </div>
    </form>
  );
}


"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type Props = {
  onSuccess?: () => void;
  onForgotClick?: (email: string) => void;
};

export default function LoginForm({ onSuccess, onForgotClick }: Props) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pwd,
    });
    setLoading(false);
    if (error) {
      setErr("Credenciais inválidas.");
      return;
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email" type="email" required placeholder="seu@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (err) setErr(null); }}
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password" type={show ? "text" : "password"} required placeholder="••••••••"
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); if (err) setErr(null); }}
            className="pr-20"
          />
          <Button
            type="button" variant="outline" size="sm"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={show}
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {show ? "Ocultar" : "Mostrar"}
          </Button>
        </div>
      </div>

      {err && <p role="alert" aria-live="polite" className="mt-1 text-sm text-red-600">{err}</p>}

      <Button type="submit" disabled={loading || !email || !pwd}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <Button type="button" variant="link" className="justify-start px-0"
        onClick={() => onForgotClick?.(email)}>
        Esqueci minha senha →
      </Button>
    </form>
  );
}

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
    if (error) {
      setErr("E-mail ou senha incorretos.");
    } else {
      onSuccess?.();
    }
    setLoading(false);
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

      {err && <p className="text-sm text-red-600">{err}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Entrando..." : "Entrar"}
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

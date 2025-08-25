"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type Props = { onBackToLogin?: () => void };

export default function RecoveryForm({ onBackToLogin }: Props) {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset`,
      });
      if (error) {
        setErr("Não foi possível enviar o e-mail. Tente novamente.");
        return;
      }
      setOk(true);
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Verifique seu e-mail</h2>
        <p>
          Enviamos um link para redefinir sua senha. O link expira em 10 minutos.
        </p>
        {onBackToLogin && (
          <Button onClick={onBackToLogin}>Voltar ao login</Button>
        )}
      </div>
    );
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

      {err && <p className="text-sm text-red-600">{err}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar e-mail de redefinição"}
      </Button>
    </form>
  );
}

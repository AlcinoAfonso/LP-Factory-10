"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type Props = {
  onBackToLogin?: () => void;
  onDone?: () => void; // fecha modal após confirmação
};

export default function RecoveryForm({ onBackToLogin, onDone }: Props) {
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

  // após mostrar a confirmação, fechamos o modal em ~1.5s
  useEffect(() => {
    if (ok) {
      const t = setTimeout(() => {
        onDone?.();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [ok, onDone]);

  if (ok) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Verifique seu e-mail</h2>
        <p>Enviamos um link para redefinir sua senha. O link expira em 10 minutos.</p>
        <Button
          type="button"
          onClick={() => {
            onDone?.() ?? onBackToLogin?.();
          }}
        >
          Fechar
        </Button>
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

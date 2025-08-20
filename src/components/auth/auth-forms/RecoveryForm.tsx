"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client"; // client oficial (browser)

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

    // Hardening: evita acesso a window em ambientes não-browser
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    try {
      const redirectTo = `${origin}/auth/reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setOk(true);
    } catch {
      setErr("Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-gray-700">
          Se o e-mail existir, enviamos um link para redefinição. Verifique sua caixa de entrada.
        </p>
        <Button onClick={onBackToLogin}>Voltar ao login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor="rec-email">E-mail</Label>
        <Input
          id="rec-email"
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (err) setErr(null);
          }}
        />
      </div>

      {err && (
        <p role="alert" aria-live="polite" className="mt-1 text-sm text-red-600">
          {err}
        </p>
      )}

      <Button type="submit" disabled={loading || !email}>
        {loading ? "Enviando..." : "Enviar e-mail de redefinição"}
      </Button>

      <Button type="button" variant="link" className="justify-start px-0" onClick={onBackToLogin}>
        ← Voltar para Entrar
      </Button>
    </form>
  );
}

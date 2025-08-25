"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type Props = {
  onBackToLogin?: () => void;
};

type Status = "idle" | "sending" | "sent" | "error";

export default function RecoveryForm({ onBackToLogin }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  // Reenvio após 30s
  const INITIAL = 30;
  const [count, setCount] = useState(INITIAL);
  const timerRef = useRef<number | null>(null);

  // Banner: link foi aberto em outra aba
  const [openedInAnotherTab, setOpenedInAnotherTab] = useState(false);

  useEffect(() => {
    // Ouve sinal vindo de /auth/reset quando o link for aberto
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("lp-auth-reset");
      bc.onmessage = (ev) => {
        if (ev?.data?.type === "opened") setOpenedInAnotherTab(true);
      };
    } catch {
      // BroadcastChannel indisponível (ok ignorar)
    }
    return () => {
      try {
        bc?.close();
      } catch {}
    };
  }, []);

  function startCountdown() {
    setCount(INITIAL);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return c - 1;
      });
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErr(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset`,
    });

    if (error) {
      setStatus("error");
      setErr("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setStatus("sent");
    startCountdown();
  }

  const canResend = useMemo(() => status === "sent" && count === 0, [status, count]);

  async function handleResend() {
    if (!canResend) return;
    setErr(null);
    setStatus("sending");

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset`,
    });

    if (error) {
      setStatus("error");
      setErr("Não foi possível reenviar. Tente novamente.");
      return;
    }
    setStatus("sent");
    startCountdown();
  }

  // --- UI ---

  if (status === "sent") {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Verifique seu e-mail</h2>
        <p>Enviamos um link para redefinir sua senha. O link expira em 10 minutos.</p>
        <p className="text-sm text-muted-foreground">Dica: confira também a pasta de spam.</p>

        {openedInAnotherTab && (
          <div className="text-sm rounded-md border p-2">
            Link aberto em outra aba — continue por lá para definir a nova senha.
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <Button type="button" variant="secondary" onClick={onBackToLogin}>
            Voltar ao login
          </Button>
          <Button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            aria-disabled={!canResend}
            title={!canResend ? `Aguarde ${count}s para reenviar` : "Reenviar e-mail"}
          >
            {canResend ? "Reenviar e-mail" : `Reenviar em ${count}s`}
          </Button>
        </div>
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
          autoFocus
        />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <Button type="submit" disabled={status === "sending"} className="w-full">
        {status === "sending" ? "Enviando..." : "Enviar e-mail de redefinição"}
      </Button>
    </form>
  );
}

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

  // cooldown 30s p/ evitar spam
  const INITIAL = 30;
  const [count, setCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [openedInAnotherTab, setOpenedInAnotherTab] = useState(false);
  const [processDone, setProcessDone] = useState(false);

  useEffect(() => {
    // Listener dos eventos vindos da /auth/reset
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("lp-auth-reset");
        bc.onmessage = (ev) => {
          const t = ev?.data?.type;
          if (t === "opened") setOpenedInAnotherTab(true);
          if (t === "success") setProcessDone(true);
          if (t === "expired" || t === "used") {
            // Mantém o modal; usuário pode reenviar pelo próprio e-mail novamente
            setOpenedInAnotherTab(false);
          }
        };
      }
    } catch {}
    return () => {
      try {
        bc?.close();
      } catch {}
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setCount(INITIAL);
    timerRef.current = window.setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErr(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset`,
    });

    // **Mensagem neutra** — não revela se e-mail existe
    if (error) {
      setStatus("error");
      setErr(null);
      // Mesmo com erro, mostramos mensagem neutra para não vazar existência
      setStatus("sent");
      startCountdown();
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

    // Continua **neutro** em caso de erro
    if (error) {
      setStatus("sent");
      startCountdown();
      return;
    }
    setStatus("sent");
    startCountdown();
  }

  // ---- UI ----
  if (status === "sent") {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Verifique seu e-mail</h2>
        <p>Se este e-mail estiver cadastrado, você receberá instruções.</p>
        <p className="text-sm text-muted-foreground">
          Dica: veja também a pasta de spam. O link expira em 10 minutos.
        </p>

        {openedInAnotherTab && (
          <div className="text-sm rounded-md border p-2">
            Abrimos o link em outra aba — continue por lá para definir a nova senha.
          </div>
        )}

        {processDone && (
          <div className="text-sm rounded-md border p-2">
            Processo concluído. Você já pode fechar este modal.
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


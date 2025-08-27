"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type Props = { onBackToLogin?: () => void };

export default function RecoveryForm({ onBackToLogin }: Props) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  // Cooldown 30s para reenvio
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  // Ouvir eventos da página /auth/reset (BroadcastChannel)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("lp-auth-reset");
      bc.onmessage = (
        ev: MessageEvent<{ type?: "opened" | "expired" | "used" | "success" }>
      ) => {
        const kind = ev?.data?.type;
        if (!kind) return;
        if (kind === "opened") setInfo("Abrimos o link em outra aba; continue por lá.");
        if (kind === "expired") setInfo("O link expirou. Reenvie um novo e-mail por aqui.");
        if (kind === "used") setInfo("Este link já foi usado. Reenvie um novo e-mail.");
        if (kind === "success") {
          setInfo("Processo concluído. Este diálogo será fechado.");
          if (closeTimer.current) window.clearTimeout(closeTimer.current);
          closeTimer.current = window.setTimeout(() => onBackToLogin?.(), 2000);
        }
      };
    } catch {}
    return () => {
      if (bc) {
        bc.onmessage = null;
        bc.close();
      }
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, [onBackToLogin]);

  async function handleSend() {
    setInfo(null);
    const emailTrim = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setInfo("Informe um e-mail válido.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      // Mensagem sempre neutra
      setInfo("Se este e-mail estiver cadastrado, você receberá instruções.");
      setCooldown(30);
      if (error) {
        // Mantém cópia neutra
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {info && <p className="text-sm text-muted-foreground">{info}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSend} disabled={sending || cooldown > 0}>
          {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Enviar e-mail de redefinição"}
        </Button>
        <Button variant="ghost" onClick={onBackToLogin}>
          Voltar ao login
        </Button>
      </div>
    </div>
  );
}

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

  // Listener de sincronização (localStorage + storage event)
  useEffect(() => {
    function handleStorage(ev: StorageEvent) {
      if (ev.key === "lf10:auth_reset_success" && ev.newValue) {
        setInfo("Processo concluído. Este diálogo será fechado.");
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => {
          localStorage.removeItem("lf10:auth_reset_success");
          onBackToLogin?.();
        }, 2000);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, [onBackToLogin]);

  async function handleSend() {
    setInfo(null);
    const emailTrim = email.trim();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailTrim)) {
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
        // Mantém cópia neutra (não expõe detalhes)
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

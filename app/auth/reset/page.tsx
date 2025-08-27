"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type LinkState = "checking" | "valid" | "expired" | "used" | "invalid" | "network_error";

function ResetInner() {
  const router = useRouter();
  const search = useSearchParams();

  const [state, setState] = useState<LinkState>("checking");
  const [msg, setMsg] = useState<string | null>(null);

  // UI: formulário de nova senha
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);

  // UI: reenvio inline quando expirado
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cdTimer = useRef<number | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    cdTimer.current = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => {
      if (cdTimer.current) window.clearTimeout(cdTimer.current);
    };
  }, [cooldown]);

  // Helpers
  const hashParams = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.hash.replace(/^#/, ""));
  }, []);

  const code = search.get("code") || hashParams.get("code") || null;
  const errorCode = search.get("error_code") || hashParams.get("error_code") || null;
  const errorParam = search.get("error") || hashParams.get("error") || null;
  const tokenHash = hashParams.get("token_hash") || hashParams.get("token") || null;

  // -> Broadcast para a aba do modal
  function notify(kind: "opened" | "expired" | "used" | "success") {
    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type: kind });
      // fecha logo para não vazar recurso
      setTimeout(() => bc.close(), 0);
    } catch {
      /* ignore */
    }
  }

  // 1) Validação do link e troca por sessão
  useEffect(() => {
    (async () => {
      // Se já chegou aqui por erro explícito do Supabase na URL
      const errLower = `${errorCode || errorParam || ""}`.toLowerCase();
      if (errLower.includes("otp_expired")) {
        setState("expired");
        setMsg("Este link expirou.");
        notify("expired");
        return;
      }
      if (errLower.includes("otp_disabled") || errLower.includes("otp_used")) {
        setState("used");
        setMsg("Este link já foi utilizado.");
        notify("used");
        return;
      }

      // Acesso direto sem token algum -> inválido
      if (!code && !tokenHash) {
        setState("invalid");
        setMsg("Link inválido. Solicite uma nova redefinição.");
        return;
      }

      // Tentar fluxo moderno (code)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setState("valid");
          setMsg(null);
          notify("opened");
          return;
        }
        const m = (error.message || "").toLowerCase();
        if (m.includes("expire")) {
          setState("expired");
          setMsg("Este link expirou.");
          notify("expired");
          return;
        }
        if (m.includes("used")) {
          setState("used");
          setMsg("Este link já foi utilizado.");
          notify("used");
          return;
        }
        // fallback
        setState("invalid");
        setMsg("Link inválido. Solicite uma nova redefinição.");
        return;
      }

      // Fallback antigo (token_hash)
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          // typings de versões antigas não declaram token_hash, mas método aceita
          // @ts-ignore
          token_hash: tokenHash,
        });
        if (!error) {
          setState("valid");
          setMsg(null);
          notify("opened");
          return;
        }
        const m = (error.message || "").toLowerCase();
        if (m.includes("expire")) {
          setState("expired");
          setMsg("Este link expirou.");
          notify("expired");
          return;
        }
        if (m.includes("used")) {
          setState("used");
          setMsg("Este link já foi utilizado.");
          notify("used");
          return;
        }
        setState("invalid");
        setMsg("Link inválido. Solicite uma nova redefinição.");
        return;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Salvar nova senha (estado "valid")
  async function handleSave() {
    setMsg(null);
    if (pwd1.length < 8) {
      setMsg("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (pwd1 !== pwd2) {
      setMsg("As senhas não coincidem.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setSaving(false);
    if (error) {
      setMsg("Erro ao salvar. Tente novamente.");
      return;
    }
    setMsg("Senha alterada com sucesso! Redirecionando…");
    notify("success");
    setTimeout(() => router.push("/a"), 1500);
  }

  // 3) Reenvio inline (estado "expired")
  async function handleResend() {
    setMsg(null);
    const emailTrim = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setMsg("Informe um e-mail válido.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    // Mensagem neutra SEMPRE
    setMsg("Se este e-mail estiver cadastrado, você receberá instruções.");
    setCooldown(30);
    if (error) return;
  }

  // ---------- UI ----------
  if (state === "checking") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p>Validando seu link…</p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">{msg || "Link inválido."}</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (state === "used") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">{msg || "Este link já foi utilizado."}</p>
        <div className="space-y-3">
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
          <div className="flex gap-2 justify-center">
            <Button onClick={handleResend} disabled={cooldown > 0}>
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail de redefinição"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/a")}>
              Ir para página principal
            </Button>
          </div>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">{msg || "Este link expirou."}</p>
        <div className="space-y-3">
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
          <div className="flex gap-2 justify-center">
            <Button onClick={handleResend} disabled={cooldown > 0}>
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail de redefinição"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/a")}>
              Ir para página principal
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Dica: verifique também a pasta de spam. O link expira em 10 minutos.
          </p>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>
      </div>
    );
  }

  // state === "valid" => formulário de nova senha
  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-xl font-semibold text-center">Redefinir senha</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="pwd1">Nova senha</Label>
          <Input
            id="pwd1"
            type="password"
            value={pwd1}
            onChange={(e) => setPwd1(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="pwd2">Confirmar senha</Label>
          <Input
            id="pwd2"
            type="password"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
          />
        </div>
      </div>
      {msg && <p className="text-sm text-red-600">{msg}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar nova senha"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/a")}>
          Ir para página principal
        </Button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-20 text-center">Validando seu link…</div>}>
      <ResetInner />
    </Suspense>
  );
}

"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-20 text-center"><p>Carregando…</p></div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

type LinkState = "valid" | "expired" | "used" | "invalid" | "network_error";

function ResetPasswordInner() {
  const router = useRouter();
  const search = useSearchParams();

  // Supabase pode enviar ?token_hash=... (padrão) ou ?code=...
  const queryToken = search.get("token_hash") || search.get("code");

  const [linkState, setLinkState] = useState<LinkState>("invalid");
  const [sessionReady, setSessionReady] = useState(false);

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Reenvio inline (quando expirado/usado/invalid)
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Avisar a aba original que o link foi aberto
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("lp-auth-reset");
        bc.postMessage({ type: "opened" });
        setTimeout(() => bc.close(), 0);
      }
    } catch {}
  }, []);

  // Validar link e abrir sessão — **somente verifyOtp(type:'recovery')**
  useEffect(() => {
    (async () => {
      // Alguns templates antigos trazem tokens no hash (#access_token&refresh_token)
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      try {
        if (queryToken) {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: queryToken,
          } as any);

          if (error) {
            const m = (error.message || "").toLowerCase();
            setLinkState(m.includes("used") ? "used" : "expired");
            try {
              if (typeof window !== "undefined" && "BroadcastChannel" in window) {
                const bc = new BroadcastChannel("lp-auth-reset");
                bc.postMessage({ type: m.includes("used") ? "used" : "expired" });
                setTimeout(() => bc.close(), 0);
              }
            } catch {}
            return;
          }

          setLinkState("valid");
          setSessionReady(true);
          return;
        }

        // Fallback: se vierem tokens no hash, tentamos setar sessão
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            setLinkState("network_error");
            return;
          }
          setLinkState("valid");
          setSessionReady(true);
          return;
        }

        // Sem nenhum token reconhecido
        setLinkState("invalid");
      } catch {
        setLinkState("network_error");
      }
    })();
  }, [queryToken]);

  const validate = useMemo(
    () =>
      function (): string | null {
        if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
        if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
          return "Use ao menos 1 letra maiúscula, 1 minúscula e 1 número.";
        }
        if (pwd1 !== pwd2) return "As senhas não coincidem.";
        return null;
      },
    [pwd1, pwd2]
  );

  async function handleReset() {
    setMsg(null);
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setLoading(false);

    if (error) {
      setMsg("Erro ao salvar. Tente novamente.");
      return;
    }
    setOk(true);
    setMsg("Senha alterada com sucesso! Redirecionando…");
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("lp-auth-reset");
        bc.postMessage({ type: "success" });
        setTimeout(() => bc.close(), 0);
      }
    } catch {}
  }

  useEffect(() => {
    if (ok) {
      const t = setTimeout(() => router.push("/a"), 3000);
      return () => clearTimeout(t);
    }
  }, [ok, router]);

  async function handleResend() {
    setResendMsg(null);
    setResendLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
        redirectTo: `${origin}/auth/reset`,
      });
      if (error) {
        setResendMsg("Não foi possível reenviar. Verifique o e-mail e tente novamente.");
      } else {
        setResendMsg("Enviamos um novo link. Verifique sua caixa de entrada (ou spam).");
        setCooldown(30);
      }
    } finally {
      setResendLoading(false);
    }
  }

  // ---------- UI ----------
  if (linkState === "invalid") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Link inválido. Solicite uma nova redefinição.</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (linkState === "expired" || linkState === "used" || linkState === "network_error") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6">
        <h1 className="text-xl font-semibold text-center">Redefinir senha</h1>
        <p className="text-center text-red-600">
          {linkState === "expired" && "Este link expirou."}
          {linkState === "used" && "Este link já foi usado."}
          {linkState === "network_error" && "Falha na validação do link. Tente novamente."}
        </p>

        <div className="space-y-3">
          <Label htmlFor="re-email">E-mail</Label>
          <Input
            id="re-email"
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="seu@email.com"
          />
          {resendMsg && (
            <p
              className={`text-sm ${
                resendMsg.includes("novo link") ? "text-green-600" : "text-red-600"
              }`}
            >
              {resendMsg}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleResend} disabled={resendLoading || !resendEmail || cooldown > 0}>
              {cooldown > 0
                ? `Reenviar em ${cooldown}s`
                : resendLoading
                ? "Enviando..."
                : "Reenviar e-mail de redefinição"}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/a")}>
              Ir para página principal
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Dica: verifique também a pasta de spam. O link expira em 10 minutos.
          </p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return <div className="max-w-md mx-auto mt-20 text-center"><p>Validando seu link…</p></div>;
  }

  if (ok) {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Senha redefinida</h1>
        <p>{msg}</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-xl font-semibold">Redefinir senha</h1>
      <div className="space-y-4">
        <div>
          <Label htmlFor="pwd1">Nova senha</Label>
          <Input id="pwd1" type="password" value={pwd1} onChange={(e) => setPwd1(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pwd2">Confirmar senha</Label>
          <Input id="pwd2" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
        </div>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <Button disabled={loading} onClick={handleReset}>
        {loading ? "Atualizando..." : "Salvar nova senha"}
      </Button>
    </div>
  );
}

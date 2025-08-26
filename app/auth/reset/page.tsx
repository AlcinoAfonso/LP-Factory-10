"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type LinkState = "valid" | "expired" | "used" | "invalid" | "network_error";
type RemoteEvent = { type: "opened" | "success" | "expired" | "used" };

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [sessionReady, setSessionReady] = useState(false);
  const [linkState, setLinkState] = useState<LinkState>("valid");

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const bcRef = useRef<BroadcastChannel | null>(null);

  // Cooldown do reenvio
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Classificação mais robusta do erro (usa status quando disponível)
  function classifyError(error: any): LinkState {
    const status = error?.status as number | undefined;
    const m = String(error?.message || "").toLowerCase();

    if (status === 400) return "invalid";
    if (status === 410) return "expired";

    if (m.includes("used")) return "used";
    if (m.includes("expire")) return "expired";
    if (m.includes("invalid") || m.includes("malformed")) return "invalid";

    return "network_error";
  }

  // Troca o token do link por uma sessão de recovery válida
  useEffect(() => {
    // Notificar a outra aba que este link foi aberto
    try {
      bcRef.current = new BroadcastChannel("lp-auth-reset");
      bcRef.current.postMessage({ type: "opened" } as RemoteEvent);
    } catch {
      // ignore
    }

    (async () => {
      // 1) Token via query (?code=...) — mais comum com resetPasswordForEmail
      const code = search.get("code");

      // 2) Também aceitamos ?token_hash=... (formato alternativo)
      const tokenHash = search.get("token_hash");

      // 3) Acesso direto sem token algum → inválido
      const hasHashFragment = typeof window !== "undefined" && !!window.location.hash;
      if (!code && !tokenHash && !hasHashFragment) {
        setLinkState("invalid");
        return;
      }

      // Tenta exchangeCodeForSession quando houver "code"
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setLinkState(classifyError(error));
          // Propaga estado para o modal original
          try {
            if (bcRef.current) {
              bcRef.current.postMessage({
                type: classifyError(error) === "used" ? "used" : "expired",
              } as RemoteEvent);
            }
          } catch {}
          return;
        }
        setSessionReady(true);
        return;
      }

      // Fallback: token_hash (algumas versões antigas/links)
      if (tokenHash) {
              const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (error) {
          setLinkState(classifyError(error));
          try {
            if (bcRef.current) {
              bcRef.current.postMessage({
                type: classifyError(error) === "used" ? "used" : "expired",
              } as RemoteEvent);
            }
          } catch {}
          return;
        }
        setSessionReady(true);
        return;
      }

      // Qualquer outro formato cai como inválido
      setLinkState("invalid");
    })();

    return () => {
      try {
        if (bcRef.current) {
          bcRef.current.close();
          bcRef.current = null;
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validação do formulário de nova senha
  function validate(): string | null {
    if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
      return "Use ao menos 1 letra maiúscula, 1 minúscula e 1 número.";
    }
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

  async function handleSaveNewPassword() {
    setMsg(null);
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setSaving(false);

    if (error) {
      setMsg("Não foi possível atualizar a senha. Tente novamente.");
      // Mantém a sessão de recovery ativa para nova tentativa por alguns minutos
      return;
    }

    setOk(true);
    setMsg("Senha alterada com sucesso!");
    try {
      if (bcRef.current) bcRef.current.postMessage({ type: "success" } as RemoteEvent);
    } catch {}

    setTimeout(() => router.push("/a"), 1800); // middleware leva à conta
  }

  async function handleResend() {
    if (!resendEmail) {
      setResendMsg("Informe seu e-mail.");
      return;
    }
    setResendMsg(null);
    setCooldown(30);
    const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) {
      setResendMsg("Se este e-mail estiver cadastrado, você receberá um novo link.");
      return;
    }
    setResendMsg("Enviamos um novo link. Verifique seu e-mail (e spam).");
  }

  // --- Render ---

  // Estados de erro de link
  if (linkState === "invalid") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Link inválido. Solicite uma nova redefinição.</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (linkState === "expired" || linkState === "used") {
    const title =
      linkState === "expired" ? "Este link expirou." : "Este link já foi usado.";
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">{title}</p>

        <div className="space-y-3 text-left">
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
                resendMsg.toLowerCase().includes("novo link") ? "text-green-600" : "text-red-600"
              }`}
            >
              {resendMsg}
            </p>
          )}
          <div className="flex gap-2">
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
        </div>
      </div>
    );
  }

  if (linkState === "network_error") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Erro de conexão. Tente novamente mais tarde.</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  // Link válido, mas ainda trocando por sessão
  if (!sessionReady) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p>Validando seu link…</p>
      </div>
    );
  }

  // Formulário de nova senha
  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-xl font-semibold">Redefinir senha</h1>

      {!ok && (
        <>
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

          <Button disabled={saving} onClick={handleSaveNewPassword}>
            {saving ? "Atualizando..." : "Salvar nova senha"}
          </Button>
        </>
      )}

      {ok && (
        <div className="space-y-3 text-center">
          <p className="text-green-600">{msg}</p>
          <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
        </div>
      )}
    </div>
  );
}

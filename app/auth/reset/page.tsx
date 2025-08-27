"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Estados possíveis do link de recuperação quando o usuário chega em /auth/reset
 */
type LinkState = "checking" | "form" | "expired" | "used" | "invalid";

/**
 * Página exportada com Suspense, para satisfazer o requisito do Next:
 * useSearchParams() deve estar em um boundary de Suspense.
 */
export default function ResetPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-20 text-center">Carregando…</div>}>
      <ResetPageInner />
    </Suspense>
  );
}

function ResetPageInner() {
  const router = useRouter();
  const search = useSearchParams();

  // --- leitura de query params padrão (ex.: ?code=..., ?error_code=otp_expired, etc.)
  const code = search.get("code") || null;
  const error = (search.get("error") || "").toLowerCase();
  const errorCode = (search.get("error_code") || "").toLowerCase();
  const errorDescription = (search.get("error_description") || "").toLowerCase();

  // --- leitura de parâmetros no fragmento (#...), que o Supabase ainda usa em alguns fluxos
  const hashParams = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    const raw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    return new URLSearchParams(raw);
  }, []);

  const tokenHash = hashParams.get("token_hash");
  const hashError = (hashParams.get("error") || "").toLowerCase();
  const hashErrorCode = (hashParams.get("error_code") || "").toLowerCase();
  const hashErrorDesc = (hashParams.get("error_description") || "").toLowerCase();

  const bcRef = useRef<BroadcastChannel | null>(null);
  const onceRef = useRef<{ opened?: boolean; expired?: boolean; used?: boolean }>({});

  const [state, setState] = useState<LinkState>("checking");

  // UI de reenvio inline quando expirado
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // cooldown de 30s para reenvio
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // abre canal e emite "opened" uma única vez
  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel("lp-auth-reset");
      if (!onceRef.current.opened) {
        bcRef.current.postMessage({ type: "opened" });
        onceRef.current.opened = true;
      }
    } catch {
      // ignore
    }
    return () => {
      try {
        bcRef.current?.close();
        bcRef.current = null;
      } catch {
        /* ignore */
      }
    };
  }, []);

  // helper para emitir eventos sem duplicar
  function emitOnce(kind: "expired" | "used") {
    if (!bcRef.current) return;
    if (onceRef.current[kind]) return;
    bcRef.current.postMessage({ type: kind });
    onceRef.current[kind] = true;
  }

  // Validação simples de email
  const isValidEmail = (e: string) =>
    !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  // Reenvio inline (apenas no estado "expired")
  async function handleResend() {
    setInfo(null);
    const e = email.trim();
    if (!isValidEmail(e)) {
      setInfo("Informe um e-mail válido.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      // mensagem sempre neutra, mesmo em erro (não revelar existência)
      setInfo("Se este e-mail estiver cadastrado, você receberá instruções.");
      setCooldown(30);
      if (error) {
        // não navegar; manter cópia neutra
        return;
      }
    } finally {
      setSending(false);
    }
  }

  // Mapeia rapidamente estados vindos do próprio callback do Supabase (query ou hash)
  function checkImmediateExpired(): boolean {
    // query
    if (errorCode === "otp_expired") return true;
    if (error === "access_denied" && errorDescription.includes("expired")) return true;

    // hash
    if (hashErrorCode === "otp_expired") return true;
    if (hashError === "access_denied" && hashErrorDesc.includes("expired")) return true;

    return false;
  }

  // Troca o code/token_hash por sessão válida OU sinaliza expired/used/invalid
  useEffect(() => {
    (async () => {
      // 1) Se já veio claro que expirou, mostra expired imediatamente
      if (checkImmediateExpired()) {
        setState("expired");
        emitOnce("expired");
        return;
      }

      // 2) Se não há nenhum token/param, é inválido (acesso direto)
      if (!code && !tokenHash) {
        setState("invalid");
        return;
      }

      // 3) Tenta primeiro com "code"
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setState("form");
          return;
        }
        const m = (error.message || "").toLowerCase();
        if (m.includes("expire")) {
          setState("expired");
          emitOnce("expired");
          return;
        }
        if (m.includes("used")) {
          setState("used");
          emitOnce("used");
          return;
        }
        // fallback
        // Se por algum motivo o "code" falhar sem indicar causa clara,
        // ainda tentamos o token_hash se ele existir.
      }

      // 4) Fallback: token_hash (links mais antigos)
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
       token_hash: tokenHash,
        });
        if (!error) {
          setState("form");
          return;
        }
        const m = (error.message || "").toLowerCase();
        if (m.includes("expire")) {
          setState("expired");
          emitOnce("expired");
          return;
        }
        if (m.includes("used")) {
          setState("used");
          emitOnce("used");
          return;
        }
        setState("invalid");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, tokenHash, error, errorCode, errorDescription, hashError, hashErrorCode, hashErrorDesc]);

  // --- Renders por estado ---

  if (state === "checking") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p>Validando seu link…</p>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6">
        <h1 className="text-xl font-semibold text-center">Redefinir senha</h1>
        <p className="text-center text-red-600">Este link expirou.</p>

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

          {info && <p className="text-sm text-muted-foreground">{info}</p>}

          <div className="flex gap-2">
            <Button onClick={handleResend} disabled={sending || cooldown > 0}>
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail de redefinição"}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/a")}>
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

  if (state === "used") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p>Este link já foi usado. Solicite uma nova redefinição.</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Link inválido. Solicite uma nova redefinição.</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  // state === "form"  → sessão de recuperação válida; mostrar formulário para nova senha
  return <ResetPasswordForm onSuccess={() => router.push("/a")} />;
}

/**
 * Formulário para definir a nova senha (já com sessão de recovery válida).
 * Mantido simples para não interferir no Cenário 2.
 */
function ResetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasUpper = (s: string) => /[A-Z]/.test(s);
  const hasLower = (s: string) => /[a-z]/.test(s);
  const hasDigit = (s: string) => /\d/.test(s);

  function validate(): string | null {
    if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
      return "Use ao menos 1 letra maiúscula, 1 minúscula e 1 número.";
    }
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

  async function handleSave() {
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
      setMsg("Não foi possível atualizar a senha. Tente novamente.");
      return;
    }
    setMsg("Senha atualizada com sucesso! Você será redirecionado.");
    // avisa a outra aba
    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type: "success" });
      setTimeout(() => bc.close(), 0);
    } catch {
      /* ignore */
    }
    setTimeout(onSuccess, 1200);
  }

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-xl font-semibold">Redefinir senha</h1>
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
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      <Button disabled={loading} onClick={handleSave}>
        {loading ? "Atualizando..." : "Salvar nova senha"}
      </Button>
    </div>
  );
}

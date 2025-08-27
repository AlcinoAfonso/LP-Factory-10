"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type LinkState = "valid" | "expired" | "used" | "invalid" | "network_error";

function parseHashParams(hash: string) {
  const h = hash?.startsWith("#") ? hash.slice(1) : hash || "";
  const sp = new URLSearchParams(h);
  const out: Record<string, string | null> = {};
  ["access_token", "error", "error_code", "error_description", "type", "token_hash", "code"].forEach(k => {
    out[k] = sp.get(k);
  });
  return out;
}

function classifyByErrorQuery(search: URLSearchParams, hash: string): LinkState | null {
  // Supabase pode nos redirecionar já com erro via query e/ou hash
  const qErr = (search.get("error") || "").toLowerCase();
  const qCode = (search.get("error_code") || "").toLowerCase();

  const h = parseHashParams(hash);
  const hErr = (h.error || "").toLowerCase();
  const hCode = (h.error_code || "").toLowerCase();

  const err = qErr || hErr;
  const code = qCode || hCode;

  if (!err && !code) return null;

  // Casos mais comuns
  if (code === "otp_expired") return "expired";       // link expirado (ou consumido por prefetch)
  if (err === "access_denied") return "invalid";      // genérico; manter neutro
  return "invalid";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [state, setState] = useState<LinkState>("valid");
  const [sessionReady, setSessionReady] = useState(false);

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);

  // Extração robusta de parâmetros
  const code = search.get("code");
  const tokenHash = search.get("token_hash");
  const hashParams = useMemo(() => parseHashParams(window.location.hash), [search]);
  const alreadyClassified = useMemo(() => classifyByErrorQuery(search, window.location.hash), [search]);

  const attempted = useRef(false);

  // 1) Se já veio com erro na URL (ex.: otp_expired), respeitar e NÃO tentar trocar sessão
  useEffect(() => {
    if (alreadyClassified) {
      setState(alreadyClassified);
      return;
    }

    // 2) Tentar fluxo "code" (links modernos)
    (async () => {
      if (attempted.current) return;
      attempted.current = true;

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const m = (error.message || "").toLowerCase();
            if (m.includes("expire")) setState("expired");
            else if (m.includes("used")) setState("used");
            else setState("invalid");
            return;
          }
          setSessionReady(true);
          setState("valid");
          return;
        }

        // 3) Fallback token_hash (links antigos)
        if (tokenHash || hashParams.token_hash) {
          const th = tokenHash || (hashParams.token_hash as string);
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: th,
          } as any);
          if (error) {
            const m = (error.message || "").toLowerCase();
            if (m.includes("expire")) setState("expired");
            else if (m.includes("used")) setState("used");
            else setState("invalid");
            return;
          }
          setSessionReady(true);
          setState("valid");
          return;
        }

        // 4) Fluxo hash com access_token + type=recovery (alguns templates)
        if (hashParams.access_token && (hashParams.type === "recovery")) {
          setSessionReady(true);
          setState("valid");
          return;
        }

        // 5) Nada reconhecido
        setState("invalid");
      } catch {
        setState("network_error");
      }
    })();
  }, [alreadyClassified, code, tokenHash, hashParams]);

  // Broadcast para a outra aba (modal)
  useEffect(() => {
    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type: state === "valid" ? "opened" : state });
      return () => bc.close();
    } catch {
      /* ignore */
    }
  }, [state]);

  // Validação simples
  const hasUpper = /[A-Z]/.test(pwd1);
  const hasLower = /[a-z]/.test(pwd1);
  const hasDigit = /\d/.test(pwd1);
  function validatePwd(): string | null {
    if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUpper || !hasLower || !hasDigit) return "Use ao menos 1 maiúscula, 1 minúscula e 1 número.";
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

  async function handleSave() {
    setMsg(null);
    const v = validatePwd();
    if (v) return setMsg(v);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setLoading(false);
    if (error) {
      setMsg("Não foi possível atualizar a senha. Tente novamente.");
      // Manter sessão válida para nova tentativa
      return;
    }
    setOk(true);
    setMsg("Senha alterada com sucesso! Redirecionando…");
    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type: "success" });
      bc.close();
    } catch {}
    setTimeout(() => router.push("/a"), 2000);
  }

  // ——— UI ———
  if (alreadyClassified === "expired" || state === "expired") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Este link expirou.</p>
        <InlineResend />
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
  if (state === "used") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Este link já foi usado.</p>
        <InlineResend />
      </div>
    );
  }
  if (state === "network_error") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Erro de rede. Tente novamente.</p>
        <Button onClick={() => location.reload()}>Tentar novamente</Button>
      </div>
    );
  }
  if (!sessionReady) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <p>Validando seu link…</p>
      </div>
    );
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
      <Button disabled={loading} onClick={handleSave}>{loading ? "Atualizando..." : "Salvar nova senha"}</Button>
    </div>
  );
}

function InlineResend() {
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    setInfo(null);
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      setInfo("Se este e-mail estiver cadastrado, você receberá um novo link. (expira em 10 minutos)");
      setCooldown(30);
      if (error) return; // manter mensagem neutra
      try {
        const bc = new BroadcastChannel("lp-auth-reset");
        bc.postMessage({ type: "opened" });
        bc.close();
      } catch {}
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="max-w-sm mx-auto">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
      </div>
      {info && <p className="text-sm text-muted-foreground">{info}</p>}
      <div className="flex gap-2 justify-center">
        <Button onClick={resend} disabled={sending || cooldown > 0}>
          {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail de redefinição"}
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/a")}>
          Ir para página principal
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Dica: verifique também a pasta de spam. O link expira em 10 minutos.</p>
    </div>
  );
}

// Exigência do Next: useSearchParams sob Suspense em rotas App
export function ResetPageWithSuspense() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-20 text-center">Carregando…</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}

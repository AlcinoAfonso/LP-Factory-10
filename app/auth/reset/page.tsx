"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type LinkState = "checking" | "valid" | "expired" | "used" | "invalid" | "network_error";

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function ResetPasswordPage() {
  const [state, setState] = useState<LinkState>("checking");
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // ---- Helpers -------------------------------------------------------------

  function postBC(type: "opened" | "success" | "expired" | "used") {
    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type });
      setTimeout(() => bc.close(), 0);
    } catch {
      /* ignore */
    }
  }

  function mapError(message: string) {
    const m = (message || "").toLowerCase();
    if (m.includes("expire")) {
      setState("expired");
      postBC("expired");
      return;
    }
    if (m.includes("used")) {
      setState("used");
      postBC("used");
      return;
    }
    if (m.includes("invalid") || m.includes("malformed")) {
      setState("invalid");
      return;
    }
    setState("network_error");
  }

  function validatePassword(): string | null {
    if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
      return "Use ao menos 1 letra maiúscula, 1 minúscula e 1 número.";
    }
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

  // ---- Parse & validar link ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = url.hash; // ex.: #access_token=...&refresh_token=...&type=recovery
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");

        // avisa modal que abrimos o link
        postBC("opened");

        // 1) Fluxo hash (links novos do Supabase)
        if (hash && hash.includes("access_token") && /type=recovery/.test(hash)) {
          const params = new URLSearchParams(hash.slice(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (!access_token || !refresh_token) {
            setState("invalid");
            return;
          }

          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (cancelled) return;
          if (error) {
            mapError(error.message);
            return;
          }

          // limpa o fragmento (#...) da URL
          window.history.replaceState({}, "", url.pathname + url.search);

          setState("valid");
          return;
        }

        // 2) Fluxo de query "code" (exchangeCodeForSession, se disponível)
        if (code && typeof (supabase.auth as any).exchangeCodeForSession === "function") {
          const { error } = await (supabase.auth as any).exchangeCodeForSession(code);
          if (cancelled) return;
          if (error) {
            mapError(error.message);
            return;
          }
          setState("valid");
          return;
        }

        // 3) Fluxo de query "token_hash" (fallback antigo)
        if (tokenHash) {
          const { error } = await (supabase.auth as any).verifyOtp({
            type: "recovery",
            // algumas tipagens antigas não têm "token_hash", por isso o cast via "any"
            token_hash: tokenHash,
          } as any);
          if (cancelled) return;
          if (error) {
            mapError(error.message);
            return;
          }
          setState("valid");
          return;
        }

        // Nenhum token → acesso direto inválido
        setState("invalid");
      } catch (e: any) {
        setState("network_error");
      }
    })();

    return () => {
      cancelled = true;
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // ---- Salvar nova senha ---------------------------------------------------

  async function handleReset() {
    setMsg(null);
    const v = validatePassword();
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

    setOk(true);
    setMsg("Senha atualizada com sucesso! Você será redirecionado.");
    postBC("success");

    // redireciona após 3s
    closeTimer.current = window.setTimeout(() => {
      window.location.href = "/a";
    }, 3000);
  }

  // ---- UI ------------------------------------------------------------------

  if (state === "checking") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p>Validando seu link…</p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Link inválido. Solicite uma nova redefinição.</p>
        <Button onClick={() => (window.location.href = "/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (state === "expired" || state === "used") {
    const text =
      state === "expired"
        ? "Este link expirou. Solicite uma nova redefinição."
        : "Este link já foi usado. Solicite uma nova redefinição.";
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">{text}</p>
        <Button onClick={() => (window.location.href = "/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (state === "network_error") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Erro de conexão. Tente novamente.</p>
        <Button onClick={() => (window.location.href = "/a")}>Ir para página principal</Button>
      </div>
    );
  }

  // state === "valid"
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
            autoFocus
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

      <Button disabled={loading} onClick={handleReset}>
        {loading ? "Atualizando..." : "Salvar nova senha"}
      </Button>
    </div>
  );
}

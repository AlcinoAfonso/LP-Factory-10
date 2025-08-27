"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const revalidate = false;

type LinkState = "checking" | "valid" | "expired" | "used" | "invalid" | "network_error";

function ResetInner() {
  const router = useRouter();
  const search = useSearchParams();

  const [state, setState] = useState<LinkState>("checking");
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type: "opened" });
      setTimeout(() => bc.close(), 0);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mapError = (m: string) => {
        const s = (m || "").toLowerCase();
        if (s.includes("expire")) return setState("expired");
        if (s.includes("used")) return setState("used");
        if (s.includes("invalid") || s.includes("not found")) return setState("invalid");
        return setState("network_error");
      };

      try {
        const code = search.get("code");
        const tokenHash = search.get("token_hash");
        const hash = typeof window !== "undefined" ? window.location.hash : "";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (error) return mapError(error.message);
          setState("valid");
          return;
        }

        // <<< fluxo antigo com token_hash (CORRIGIDO: usa token_hash, não token)
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (cancelled) return;
          if (error) return mapError(error.message);
          setState("valid");
          return;
        }

        // hash-style: #access_token=...&type=recovery
        if (hash && hash.includes("access_token") && /type=recovery/.test(hash)) {
          const { error } = await supabase.auth.getSessionFromUrl();
          if (cancelled) return;
          if (error) return mapError(error.message);
          window.history.replaceState({}, "", window.location.pathname + window.location.search);
          setState("valid");
          return;
        }

        setState("invalid");
      } catch (e: any) {
        const m = e?.message || String(e);
        const s = (m || "").toLowerCase();
        if (s.includes("expire")) setState("expired");
        else if (s.includes("used")) setState("used");
        else if (s.includes("invalid")) setState("invalid");
        else setState("network_error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [search]);

  function validate(): string | null {
    if (pwd1.length < 8) return "Mínimo 8 caracteres.";
    if (!/[A-Z]/.test(pwd1) || !/[a-z]/.test(pwd1) || !/\d/.test(pwd1)) {
      return "Use ao menos 1 maiúscula, 1 minúscula e 1 número.";
    }
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

  async function handleSave() {
    const v = validate();
    if (v) return setMsg(v);

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setBusy(false);

    if (error) {
      setMsg("Erro ao salvar. Tente novamente.");
      return;
    }

    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type: "success" });
      setTimeout(() => bc.close(), 0);
    } catch {}

    setMsg("Senha alterada com sucesso! Redirecionando…");
    setTimeout(() => router.push("/a"), 1500);
  }

  async function resend() {
    const ok = /\S+@\S+\.\S+/.test(email);
    if (!ok) return setMsg("Informe um e-mail válido.");
    setMsg(null);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setCooldown(30);
    setMsg("Se este e-mail estiver cadastrado, você receberá um novo link.");
  }

  if (state === "checking") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">Validando seu link…</div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Link inválido. Solicite uma nova redefinição.</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (state === "expired" || state === "used" || state === "network_error") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-5">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">
          {state === "expired" && "Este link expirou."}
          {state === "used" && "Este link já foi usado."}
          {state === "network_error" && "Não foi possível validar o link agora."}
        </p>

        <div className="space-y-2 text-left">
          <Label htmlFor="em">E-mail</Label>
          <Input
            id="em"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
        </div>

        {msg && <p className="text-sm">{msg}</p>}

        <div className="flex gap-2 justify-center">
          <Button onClick={resend} disabled={cooldown > 0}>
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
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-xl font-semibold">Redefinir senha</h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="p1">Nova senha</Label>
          <Input
            id="p1"
            type="password"
            value={pwd1}
            onChange={(e) => setPwd1(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="p2">Confirmar senha</Label>
          <Input
            id="p2"
            type="password"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
          />
        </div>
      </div>

      {msg && <p className="text-sm">{msg}</p>}

      <Button onClick={handleSave} disabled={busy}>
        {busy ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto mt-20 text-center">Validando seu link…</div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

type LinkState = "checking" | "valid" | "expired" | "used" | "invalid" | "network_error";

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

function PageInner() {
  const router = useRouter();
  const search = useSearchParams();

  // guardam o token só uma vez, antes do Supabase limpar a URL
  const initialCodeRef = useRef<string | null>(null);
  const initialHashRef = useRef<string | null>(null);

  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [sessionReady, setSessionReady] = useState(false);

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (initialCodeRef.current === null) {
      initialCodeRef.current = search.get("code");
    }
    if (initialHashRef.current === null) {
      initialHashRef.current = typeof window !== "undefined" ? window.location.hash : "";
    }

    (async () => {
      const code = initialCodeRef.current;
      const urlHash = initialHashRef.current || "";
      const tokenHash = new URLSearchParams(urlHash.replace(/^#/, "")).get("token_hash");

      const qError = search.get("error") || "";
      const qErrorCode = search.get("error_code") || "";
      const qDesc = (search.get("error_description") || "").toLowerCase();

      if (qError || qErrorCode || qDesc) {
        if (qErrorCode === "otp_expired" || qDesc.includes("expired")) setLinkState("expired");
        else if (qDesc.includes("used")) setLinkState("used");
        else setLinkState("invalid");
        return;
      }

      if (!code && !tokenHash) {
        setLinkState("invalid");
        return;
      }

      try {
        if (code && typeof supabase.auth.exchangeCodeForSession === "function") {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const m = (error.message || "").toLowerCase();
            if ((error as any).status === 410 || m.includes("expire")) setLinkState("expired");
            else if (m.includes("used")) setLinkState("used");
            else setLinkState("invalid");
            return;
          }
          setLinkState("valid");
          setSessionReady(true);
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (error) {
            const m = (error.message || "").toLowerCase();
            if ((error as any).status === 410 || m.includes("expire")) setLinkState("expired");
            else if (m.includes("used")) setLinkState("used");
            else setLinkState("invalid");
            return;
          }
          setLinkState("valid");
          setSessionReady(true);
        } else {
          setLinkState("invalid");
          return;
        }
      } catch {
        setLinkState("network_error");
        return;
      }

      try {
        const bc = new BroadcastChannel("lp-auth-reset");
        bc.postMessage({ type: "opened" });
        setTimeout(() => bc.close(), 0);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // roda só 1x

  function validate(): string | null {
    if (pwd1.length < 8) return "Mínimo de 8 caracteres.";
    if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
      return "Use ao menos 1 maiúscula, 1 minúscula e 1 número.";
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
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setSaving(false);

    if (error) {
      const m = (error.message || "").toLowerCase();
      const isNet = (error as any).status >= 500 || m.includes("network") || m.includes("fetch");
      setMsg(isNet ? "Erro de conexão. Tente novamente." : "Não foi possível atualizar a senha.");
      return;
    }

    setOk(true);
    setMsg("Senha alterada com sucesso! Redirecionando…");

    try {
      const bc = new BroadcastChannel("lp-auth-reset");
      bc.postMessage({ type: "success" });
      setTimeout(() => bc.close(), 0);
    } catch {}

    setTimeout(() => router.push("/a"), 2500);
  }

  if (linkState === "checking") {
    return <div className="max-w-md mx-auto mt-20 text-center">Validando link…</div>;
  }

  if (linkState !== "valid" && !sessionReady) {
    const text =
      linkState === "expired"
        ? "Este link expirou."
        : linkState === "used"
        ? "Este link já foi usado."
        : linkState === "network_error"
        ? "Falha de conexão. Tente novamente."
        : "Link inválido. Solicite uma nova redefinição.";

    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">{text}</p>
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

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      <Button disabled={saving} onClick={handleSave}>
        {saving ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-20 text-center">Carregando…</div>}>
      <PageInner />
    </Suspense>
  );
}

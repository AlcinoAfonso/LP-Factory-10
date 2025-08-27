"use client";

export const dynamic = "force-dynamic"; // evita SSG/HTML estático
export const revalidate = 0;

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type LinkState = "checking" | "valid" | "expired" | "used" | "invalid" | "network_error";

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function ResetPage() {
  const router = useRouter();

  // estado do link/sessão
  const [linkState, setLinkState] = useState<LinkState>("checking");

  // form
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // evita re-emissão duplicada
  const bcRef = useRef<BroadcastChannel | null>(null);
  const emitted = useRef<{ opened?: boolean; success?: boolean; expired?: boolean; used?: boolean }>({});

  // util: emitir evento 1x
  const postOnce = (type: "opened" | "success" | "expired" | "used") => {
    try {
      if (!bcRef.current) bcRef.current = new BroadcastChannel("lp-auth-reset");
      if (emitted.current[type]) return;
      bcRef.current.postMessage({ type });
      emitted.current[type] = true;
    } catch {
      /* ignore */
    }
  };

  // 1) Montagem: ler token do URL (query OU hash) e trocar por sessão
  useEffect(() => {
    let cancelled = false;

    const parseUrl = () => {
      const q = new URLSearchParams(window.location.search);
      const h = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));

      // formatos possíveis
      const code = q.get("code") || h.get("code"); // alguns provedores colocam code no hash
      const tokenHash = q.get("token_hash") || h.get("token_hash");

      // erros vindos do provedor
      const err = (q.get("error") || h.get("error") || "").toLowerCase();
      const errCode = (q.get("error_code") || h.get("error_code") || "").toLowerCase();
      const errDesc = (q.get("error_description") || h.get("error_description") || "").toLowerCase();

      return { code, tokenHash, err, errCode, errDesc };
    };

    const tryActivate = async () => {
      const { code, tokenHash, err, errCode, errDesc } = parseUrl();

      // se já veio expirado pela URL
      if (errCode === "otp_expired" || (err === "access_denied" && errDesc.includes("expired"))) {
        if (!cancelled) {
          setLinkState("expired");
          postOnce("expired");
        }
        return;
      }

      // nenhum token encontrado => inválido
      if (!code && !tokenHash) {
        if (!cancelled) setLinkState("invalid");
        return;
      }

      // tenta com code (Supabase Auth v2)
      if (code && typeof supabase.auth.exchangeCodeForSession === "function") {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            if (!cancelled) {
              setLinkState("valid");
              postOnce("opened");
              // opcional: limpar o query/hash para evitar ruído visual
              // window.history.replaceState({}, "", "/auth/reset");
            }
            return;
          }
          const m = (error.message || "").toLowerCase();
          if (!cancelled) {
            if ((error as any).status === 410 || m.includes("expire")) {
              setLinkState("expired");
              postOnce("expired");
            } else if (m.includes("used")) {
              setLinkState("used");
              postOnce("used");
            } else {
              setLinkState("invalid");
            }
          }
          return;
        } catch {
          if (!cancelled) setLinkState("network_error");
          return;
        }
      }

      // fallback: token_hash (fluxos antigos)
      if (tokenHash) {
        try {
          const payload: any = { type: "recovery", token_hash: tokenHash };
          const { error } = await supabase.auth.verifyOtp(payload);
          if (!error) {
            if (!cancelled) {
              setLinkState("valid");
              postOnce("opened");
              // window.history.replaceState({}, "", "/auth/reset");
            }
            return;
          }
          const m = (error.message || "").toLowerCase();
          if (!cancelled) {
            if ((error as any).status === 410 || m.includes("expire")) {
              setLinkState("expired");
              postOnce("expired");
            } else if (m.includes("used")) {
              setLinkState("used");
              postOnce("used");
            } else {
              setLinkState("invalid");
            }
          }
          return;
        } catch {
          if (!cancelled) setLinkState("network_error");
          return;
        }
      }

      // fallback final
      if (!cancelled) setLinkState("invalid");
    };

    tryActivate();

    return () => {
      cancelled = true;
      try {
        bcRef.current?.close();
        bcRef.current = null;
      } catch {
        /* ignore */
      }
    };
  }, []);

  // 2) Validação do formulário
  function validate(): string | null {
    if (pwd1.length < 8) return "Mínimo de 8 caracteres.";
    if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
      return "Use ao menos 1 maiúscula, 1 minúscula e 1 número.";
    }
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

  // 3) Salvar nova senha
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
    setMsg("Senha alterada com sucesso! Redirecionando…");
    postOnce("success");
    setTimeout(() => router.push("/a"), 2000);
  }

  // 4) Renders por estado
  if (linkState === "checking") {
    // Evita página estática: é client-only e dynamic, então atualiza logo
    return <div className="max-w-md mx-auto mt-20 text-center">Validando seu link…</div>;
  }

  if (linkState === "expired") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">Este link expirou.</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (linkState === "used") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p>Este link já foi usado. Solicite uma nova redefinição.</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  if (linkState === "invalid" || linkState === "network_error") {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">
          {linkState === "invalid"
            ? "Link inválido. Solicite uma nova redefinição."
            : "Falha de conexão. Tente novamente."}
        </p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
      </div>
    );
  }

  // linkState === "valid" → renderiza form
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

      <Button disabled={saving} onClick={handleSave}>
        {saving ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </div>
  );
}

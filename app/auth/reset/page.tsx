"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /\d/.test(s);

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();
  const code = search.get("code"); // <<< definido aqui e usado abaixo

  const [sessionReady, setSessionReady] = useState(false);
  const [tokenErr, setTokenErr] = useState<string | null>(null);

  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Troca o code do e-mail por sessão válida
  useEffect(() => {
    (async () => {
      if (!code) {
        setTokenErr("Link inválido. Solicite uma nova redefinição.");
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setTokenErr("O link expirou ou já foi usado. Solicite novamente.");
        return;
      }

      // Avisar a outra aba que o link foi aberto (mitigação UX)
      try {
        const bc = new BroadcastChannel("lp-auth-reset");
        bc.postMessage({ type: "opened" });
        setTimeout(() => bc.close(), 0);
      } catch {
        /* ignore */
      }

      setSessionReady(true);
    })();
  }, [code]);

  function validate(): string | null {
    if (pwd1.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!hasUpper(pwd1) || !hasLower(pwd1) || !hasDigit(pwd1)) {
      return "Use ao menos 1 letra maiúscula, 1 minúscula e 1 número.";
    }
    if (pwd1 !== pwd2) return "As senhas não coincidem.";
    return null;
  }

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
      setMsg("Não foi possível atualizar a senha. Solicite um novo link.");
      return;
    }
    setOk(true);
    setMsg("Senha atualizada com sucesso! Você será redirecionado.");
  }

  // Redirect automático após sucesso
  useEffect(() => {
    if (ok) {
      const t = setTimeout(() => router.push("/a"), 3000); // middleware envia para /a/demo
      return () => clearTimeout(t);
    }
  }, [ok, router]);

  // Estados
  if (tokenErr) {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-6 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-red-600">{tokenErr}</p>
        <Button onClick={() => router.push("/a")}>Ir para página principal</Button>
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

      <Button disabled={loading} onClick={handleReset}>
        {loading ? "Atualizando..." : "Salvar nova senha"}
      </Button>
    </div>
  );
}

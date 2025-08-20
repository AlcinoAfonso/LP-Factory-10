"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pwd1 !== pwd2) { setMsg("Senhas não coincidem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setLoading(false);
    if (error) { setMsg("Não foi possível atualizar a senha."); return; }
    setOk(true);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Definir nova senha</h1>

      {ok ? (
        <div className="grid gap-3">
          <p className="text-sm text-gray-700">Senha alterada com sucesso. Você já pode fazer login.</p>
          <Button onClick={() => (window.location.href = "/a/preview")}>Ir para o login</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="pwd1">Nova senha</Label>
            <Input id="pwd1" type="password" required value={pwd1} onChange={(e) => setPwd1(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="pwd2">Confirmar senha</Label>
            <Input id="pwd2" type="password" required value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
          </div>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar senha"}</Button>
        </form>
      )}
    </main>
  );
}

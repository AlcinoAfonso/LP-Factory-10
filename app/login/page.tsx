"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { getBrowserSupabase } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getBrowserSupabase();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Login pendente</CardTitle>
          <CardDescription>Entre com seu e-mail para receber o Magic Link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada e clique no link para continuar.
            </p>
          ) : (
            <form onSubmit={sendMagicLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-md border p-2"
              />
              <Button type="submit" className="w-full">Enviar Magic Link</Button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          )}

          <div className="flex gap-2 justify-center">
            <Button asChild variant="secondary">
              <Link href="/">Voltar ao início</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/select-account">Ir para seleção de conta</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

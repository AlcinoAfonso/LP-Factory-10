// app/a/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getAccessContext } from "@/lib/access/getAccessContext";

/**
 * Índice de /a (SSR)
 * - Se logado e houver conta válida → /a/[slug]
 * - Se logado e sem conta → fallback mínimo (sem 404/rotas ausentes)
 * - Se não logado → /auth/login
 */
export default async function AIndex() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  const ctx = await getAccessContext();

  if (ctx?.account_slug) {
    redirect(`/a/${ctx.account_slug}`);
  }

  // Fallback seguro: sessão ativa mas sem vínculo de conta
  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-xl font-semibold mb-2">Nenhuma conta encontrada</h1>
      <p className="text-sm text-gray-600">
        Sua sessão está ativa, mas não há vínculo com nenhuma conta.
      </p>
      <div className="mt-4 flex gap-3">
        <a
          href="/"
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
        >
          Página inicial
        </a>
        <a
          href="/auth/login"
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
        >
          Trocar usuário
        </a>
      </div>
    </div>
  );
}

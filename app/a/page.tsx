// app/a/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { getAccessContext } from "@/lib/access/getAccessContext";

/**
 * Índice de /a
 * - Requer usuário logado (usa getUser()).
 * - Não resolve UI aqui; apenas decide para onde ir:
 *    - Se existir conta válida → /a/[account_slug]
 *    - Se não existir → /onboarding/new
 *
 * Observação (E8.4):
 * A lógica de "qual conta" fica aqui (SSR), não no middleware.
 * O layout /a/[account] continuará resolvendo o Access Context completo.
 */
export default async function AIndex() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  // Usa o contexto atual para descobrir a primeira conta válida.
  // (Após o refactor [E8.3], getAccessContext estará adapters-only e membership-first.)
  const ctx = await getAccessContext();

  if (!ctx?.account_slug) {
    redirect("/onboarding/new");
  }

  redirect(`/a/${ctx.account_slug}`);
}

// app/page.tsx
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  // ✅ Deslogado: mostra a HOME pública (não manda para /auth/login)
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <header className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-semibold">LP Factory</div>
          <div className="flex gap-3">
            <a
              href="/?modal=login&next=/a"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Entrar
            </a>
            <a
              href="/?modal=signup"
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Criar conta
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-4xl font-semibold mb-3">Bem-vindo ao LP Factory</h1>
          <p className="text-gray-600">Crie páginas incríveis em minutos. Comece agora.</p>
        </main>
      </div>
    );
  }

  // ✅ Logado: mantém seu fluxo atual
  const ctx = await getAccessContext();
  if (!ctx?.account_slug) redirect("/onboarding/new");
  redirect(`/a/${ctx.account_slug}`);
}

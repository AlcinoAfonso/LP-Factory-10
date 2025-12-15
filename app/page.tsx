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

  // ✅ Público: não redireciona para /auth/login
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold mb-3">Bem-vindo ao LP Factory 10</h1>
        <p className="text-gray-600 mb-6">
          Acesse para entrar no seu dashboard.
        </p>

        <div className="flex gap-3">
          <a
            href="/?modal=login&next=/a"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Entrar
          </a>
        </div>
      </main>
    );
  }

  // ✅ Logado: segue fluxo normal
  const ctx = await getAccessContext();
  if (!ctx?.account_slug) redirect("/onboarding/new");
  redirect(`/a/${ctx.account_slug}`);
}

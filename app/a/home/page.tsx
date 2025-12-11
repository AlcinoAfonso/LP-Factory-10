// app/a/home/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  // 1) Precedência: cookie 'last_account_subdomain'
  const cookieStore = await cookies();
  const last = cookieStore.get("last_account_subdomain")?.value?.trim();

  if (last) {
    // Redirect direto: o gate SSR em /a/[account] valida allow/deny
    redirect(`/a/${last}`);
  }

  // 2) Fallback quando não há cookie / primeira vez
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-3">
        Bem-vindo ao LP Factory 10
      </h1>
      <p className="text-gray-600 mb-4">
        Você ainda não tem uma conta preferida. Use o topo da tela para
        entrar ou criar sua primeira conta.
      </p>
      <a
        href="/a/home?modal=new"
        className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Criar primeira conta
      </a>
    </main>
  );
}

// app/a/home/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserEmail } from '@/lib/auth/authAdapter';
import { getFirstAccountForCurrentUser } from '@/lib/access/adapters/accessContextAdapter';
import { Header } from '@/components/layout/Header';

type HomeSearchParams = {
  clear_last?: string;
};

export default async function HomePage(props: any) {
  const searchParams = (props.searchParams
    ? await props.searchParams
    : undefined) as HomeSearchParams | undefined;

  const clearLast = searchParams?.clear_last === '1';

  const userEmail = await getUserEmail();

  // C0.2 — Usuário logado
  if (userEmail) {
    // 1) Precedência: cookie 'last_account_subdomain'
    // Se clear_last=1, ignora o cookie para evitar loop e força fallback determinístico.
    const cookieStore = await cookies();
    const last = clearLast
      ? null
      : cookieStore.get('last_account_subdomain')?.value?.trim();

    if (last) {
      // Redirect direto: o gate SSR validará allow/deny e higienizará se necessário
      redirect(`/a/${last}`);
    }

    // 2) Fallback: primeira conta ativa (adapter atual)
    const accountSubdomain = await getFirstAccountForCurrentUser();
    if (accountSubdomain) {
      redirect(`/a/${accountSubdomain}`);
    }

    // 3) Fallback final: logado mas sem conta
    redirect('/auth/confirm/info');
  }

  // C0.1 — Usuário não logado (copy ajustado, mantendo hierarquia visual)
  return (
    <>
      <Header userEmail={null} />
      <main className="mx-auto max-w-3xl px-6 py-12 text-center">
        <h1 className="mb-2 text-3xl font-semibold">Bem-vindo ao LP Factory</h1>
        <p className="text-base text-gray-600">
          Crie páginas incríveis em minutos.{' '}
          <span className="font-medium text-gray-700">Comece agora.</span>
        </p>
      </main>
    </>
  );
}

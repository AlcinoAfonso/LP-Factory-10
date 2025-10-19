// app/a/home/page.tsx
import { redirect } from 'next/navigation';
import { getUserEmail } from '@/lib/auth/authAdapter';
import { getFirstAccountForCurrentUser } from '@/lib/access/adapters/accessContextAdapter';
import { Header } from '@/components/layout/Header';

export default async function HomePage() {
  const userEmail = await getUserEmail();
  
  // C0.2 — Usuário logado
  if (userEmail) {
    const accountSubdomain = await getFirstAccountForCurrentUser();
    
    if (accountSubdomain) {
      redirect(`/a/${accountSubdomain}`);
    }
    
    // Fallback: logado mas sem conta
    redirect('/auth/confirm/info');
  }
  
  // C0.1 — Usuário não logado
  return (
    <>
      <Header userEmail={null} />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold mb-4">Bem-vindo ao LP Factory</h1>
        <p className="text-gray-600">
          Use os botões no topo para entrar ou criar sua conta consultiva.
        </p>
      </main>
    </>
  );
}

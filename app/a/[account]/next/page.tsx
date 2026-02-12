// app/a/[account]/next/page.tsx
import 'server-only';

import { redirect } from 'next/navigation';
import { getAccessContext } from '@/lib/access/getAccessContext';

export default async function AccountNextPage({
  params,
}: {
  params: { account: string };
}) {
  const account = (params.account ?? '').toLowerCase().trim();
  const route = `/a/${account}/next`;

  const ctx = await getAccessContext({ params: { account }, route });

  // Fail-closed: se não tem contexto, deixa o middleware/fluxo de auth decidir.
  if (!ctx) {
    redirect('/auth/login');
  }

  // Se ainda estiver pending_setup, não deveria acessar /next
  if (ctx.account?.status === 'pending_setup') {
    redirect(`/a/${account}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Próximo passo</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sua conta está ativa. Agora escolha como você quer continuar.
      </p>

      <div className="mt-8 grid gap-4">
        <section className="rounded-xl border p-5">
          <h2 className="text-lg font-medium">Assinar um plano</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Desbloqueie a criação de LPs com um plano pago.
          </p>
          <div className="mt-4">
            <button className="rounded-md bg-black px-4 py-2 text-white">
              Ver planos
            </button>
          </div>
        </section>

        <section className="rounded-xl border p-5">
          <h2 className="text-lg font-medium">Conseguir um trial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Podemos liberar um trial promocional (a definir).
          </p>
          <div className="mt-4">
            <button className="rounded-md border px-4 py-2">
              Solicitar trial
            </button>
          </div>
        </section>

        <section className="rounded-xl border p-5">
          <h2 className="text-lg font-medium">Agendar consultoria</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Agende uma sessão para montar sua primeira campanha e LP.
          </p>
          <div className="mt-4">
            <button className="rounded-md border px-4 py-2">
              Agendar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

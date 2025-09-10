// app/a/[account]/layout.tsx
import { AccessProvider } from "@/providers/AccessProvider";
import { getAccessContext } from "@/lib/access/getAccessContext";

// Layout do Account Dashboard (SSR)
// - Resolve o Access Context no servidor
// - Aplica gate de bloqueio quando ACCESS_CONTEXT_ENFORCED = "true"
// - Evita 500: exibe uma página neutra de acesso restrito quando bloqueado

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { account: string };
}) {
  const ctx = await getAccessContext({ params });

  // Flag de rollout (E8.6)
  const ENFORCE =
    (process.env.ACCESS_CONTEXT_ENFORCED ?? "")
      .toString()
      .toLowerCase() === "true";

  // Gate SSR (E8.4): bloqueia quando a flag está ativa e o contexto está ausente ou bloqueado
  if (ENFORCE && (!ctx || (ctx as any).blocked)) {
    // Mensagem neutra; não expõe detalhes sensíveis
    return (
      <div className="mx-auto max-w-lg p-6">
        <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
        <p className="text-sm text-gray-600">
          Não foi possível carregar o contexto de acesso para esta conta.
        </p>

        {/* Se houver um motivo padronizado, mostra sutilmente (opcional) */}
        {(ctx as any)?.error_code ? (
          <p className="mt-2 text-xs text-gray-500">
            Código: {(ctx as any).error_code}
          </p>
        ) : null}

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
            Fazer login
          </a>
        </div>
      </div>
    );
  }

  // Fluxo normal (sem bloqueio)
  return <AccessProvider value={ctx}>{children}</AccessProvider>;
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { getCommercialEntitlementSignal } from "@/commercial-entitlements";
import { getAccessContext } from "@/lib/access/getAccessContext";
import { isLandingPageWorkspaceEnabled } from "@/lp-builder";

import { WorkspaceSubmitButton } from "../../_components/WorkspaceSubmitButton";
import { createLandingPageWorkspaceAction } from "../../workspace-actions";

type PageProps = Readonly<{
  params: Promise<{ account: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function NewLandingPage({ params, searchParams }: PageProps) {
  const { account } = await params;
  const query = searchParams ? await searchParams : {};
  const accountSubdomain = account.trim().toLowerCase();
  const route = `/a/${accountSubdomain}/landing-pages/new`;
  const access = await getAccessContext({ params: { account: accountSubdomain }, route });
  const accountId = (access?.account?.id ?? access?.account_id ?? null) as string | null;
  if (!isLandingPageWorkspaceEnabled() || !access || access.blocked || access.account?.status !== "active" || !["owner", "admin"].includes(String(access.role)) || !accountId) notFound();
  const entitlement = await getCommercialEntitlementSignal({ accountId });
  if (entitlement?.isCommerciallyEligible !== true) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Contexto da página" className="text-sm font-semibold text-brand-800">
        <Link href={`/a/${accountSubdomain}`} className="inline-flex min-h-11 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">Minhas landing pages</Link>
        <span aria-hidden="true"> → </span><span>Nova landing page</span>
      </nav>
      <section className="mt-4 rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-7">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Nova landing page</h1>
        <p className="mt-3 text-sm leading-6 text-graytech-600">Crie outro trabalho comercial. A configuração nasce somente no primeiro salvamento.</p>
        {typeof query.workspace_error === "string" ? <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Não foi possível criar a landing page e nenhum cadastro parcial foi mantido. Revise nome e endereço curto e tente novamente.</p> : null}
        <form action={createLandingPageWorkspaceAction} className="mt-6 grid gap-5">
          <input type="hidden" name="account" value={accountSubdomain} />
          <label className="text-sm font-semibold text-ink-900">Nome<input name="name" required maxLength={120} className="mt-2 min-h-11 w-full rounded-lg border border-surface-border px-3 font-normal" /></label>
          <label className="text-sm font-semibold text-ink-900">Endereço curto<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-2 min-h-11 w-full rounded-lg border border-surface-border px-3 font-normal" /></label>
          <WorkspaceSubmitButton idleLabel="Criar landing page" pendingLabel="Criando..." className="min-h-11 justify-self-start rounded-lg bg-brand-700 px-5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2" />
        </form>
      </section>
    </main>
  );
}

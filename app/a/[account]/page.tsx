import { getAccessContext } from "@/lib/access/getAccessContext";
import {
  getActionableNicheResolutionForAccount,
  getConfirmedOperationalNicheResolutionLabel,
} from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { PendingSetupFirstSteps } from "./_components/PendingSetupFirstSteps";
import { NicheResolutionCard } from "./_components/NicheResolutionCard";
import { getActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";

type DashState = "auth" | "onboarding" | "public";

type PageProps = {
  params: Promise<{ account: string }> | { account: string };
};

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const accountSubdomain = (resolvedParams.account ?? "").trim().toLowerCase();

  const isHome = accountSubdomain === "home";
  const ctx = isHome
    ? null
    : await getAccessContext({
        params: { account: accountSubdomain },
        route: `/a/${accountSubdomain}`,
      });
  const hasCtx = Boolean(ctx?.account || ctx?.member);

  const state: DashState = (() => {
    if (isHome && !hasCtx) return "onboarding";
    if (hasCtx) return "auth";
    return "public";
  })();

  if (state === "auth") {
    const accountStatus = (ctx?.account?.status ?? null) as
      | "pending_setup"
      | "active"
      | "inactive"
      | "suspended"
      | null;

    if (accountStatus === "pending_setup") {
      return <PendingSetupFirstSteps accountSubdomain={accountSubdomain} ctx={ctx} />;
    }

    const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
    const [nicheResolution, primaryTaxon] = accountId
      ? await Promise.all([
          getActionableNicheResolutionForAccount({
            accountId,
            accountStatus,
          }),
          getActivePrimaryAccountTaxon({ accountId }),
        ])
      : [null, null];
    const operationalNicheLabel = accountId && !primaryTaxon
      ? await getConfirmedOperationalNicheResolutionLabel({ accountId })
      : null;
    const resolvedNicheLabel = primaryTaxon?.name ?? operationalNicheLabel;

    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-6">
          {nicheResolution ? (
            <NicheResolutionCard
              accountSubdomain={accountSubdomain}
              resolution={nicheResolution}
            />
          ) : null}

          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            {resolvedNicheLabel ? (
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <p>Sua conta esta ativa para o nicho {resolvedNicheLabel}.</p>
                <p>Estamos desenvolvendo recursos para este nicho e entraremos em contato.</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                Sua conta esta ativa. Novos recursos do dashboard aparecerao aqui conforme forem liberados.
              </p>
            )}
          </section>
        </div>
      </main>
    );
  }

  if (state === "onboarding") {
    return <DashboardOnboarding />;
  }

  return <DashboardPublic />;
}

function DashboardOnboarding() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-sm text-gray-600">Faca login ou crie sua conta para continuar.</p>
      </div>
    </main>
  );
}

function DashboardPublic() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">LP Factory</h1>
        <p className="text-sm text-gray-600">Acesse sua conta ou visite a home publica.</p>
      </div>
    </main>
  );
}

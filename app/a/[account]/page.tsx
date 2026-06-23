import { getAccessContext } from "@/lib/access/getAccessContext";
import { getCommercialActivationHierarchicalBundle } from "@/conversion-content";
import { getActionableNicheResolutionForAccount } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { getActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import { PendingSetupFirstSteps } from "./_components/PendingSetupFirstSteps";
import { NicheResolutionCard } from "./_components/NicheResolutionCard";
import { GenericCommercialPage } from "./_components/commercial-page/GenericCommercialPage";
import { PublishedCommercialActivationPage } from "./_components/commercial-page/PublishedCommercialActivationPage";

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

    if (accountStatus !== "active") {
      return (
        <main className="mx-auto max-w-5xl px-6 py-10">
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Esta conta não está disponível para exibir a página comercial.
            </p>
          </section>
        </main>
      );
    }

    const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
    const nicheResolution = accountId
      ? await getActionableNicheResolutionForAccount({
          accountId,
          accountStatus,
        })
      : null;
    const primaryTaxon = accountId
      ? await getActivePrimaryAccountTaxon({ accountId })
      : null;
    const commercialActivation = primaryTaxon
      ? await getCommercialActivationHierarchicalBundle({
          taxonId: primaryTaxon.taxonId,
        })
      : null;
    const commercialPage =
      commercialActivation?.status === "ready" && commercialActivation.bundle ? (
        <PublishedCommercialActivationPage
          accountSubdomain={accountSubdomain}
          bundle={commercialActivation.bundle}
        />
      ) : (
        <GenericCommercialPage accountSubdomain={accountSubdomain} />
      );

    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="space-y-6">
          {nicheResolution ? (
            <NicheResolutionCard
              accountSubdomain={accountSubdomain}
              resolution={nicheResolution}
            />
          ) : null}

          {commercialPage}
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

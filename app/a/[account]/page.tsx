import { getAccessContext } from "@/lib/access/getAccessContext";
import { getCommercialActivationHierarchicalBundle } from "@/conversion-content";
import { getCommercialEntitlementSignal } from "../../../lib/commercial-entitlements";
import { getActionableNicheResolutionForAccount } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { getActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import { PendingSetupFirstSteps } from "./_components/PendingSetupFirstSteps";
import { NicheResolutionCard } from "./_components/NicheResolutionCard";
import { GenericCommercialPage } from "./_components/commercial-page/GenericCommercialPage";
import { PublishedCommercialActivationPage } from "./_components/commercial-page/PublishedCommercialActivationPage";
import { decideCommercialExperience } from "./_components/commercial-page/commercial-experience-policy";

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
    const [commercialEntitlement, nicheResolution, primaryTaxon] = accountId
      ? await Promise.all([
          getCommercialEntitlementSignal({ accountId }),
          getActionableNicheResolutionForAccount({ accountId, accountStatus }),
          getActivePrimaryAccountTaxon({ accountId }),
        ])
      : [null, null, null];
    const commercialExperience = decideCommercialExperience({
      actorRole: ctx?.role ?? "viewer",
      isCommerciallyEligible: commercialEntitlement?.isCommerciallyEligible === true,
    });

    if (commercialExperience.mode === "waiting") {
      return <CommercialWaitingState />;
    }

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
          showFinancialActions={commercialExperience.showFinancialActions}
        />
      ) : (
        <GenericCommercialPage
          accountSubdomain={accountSubdomain}
          showFinancialActions={commercialExperience.showFinancialActions}
        />
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

function CommercialWaitingState() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-2xl border border-surface-border bg-white p-6 shadow-card sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Ativação comercial
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Esta conta aguarda ativação comercial pelo proprietário.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-graytech-600 sm:text-base">
          O proprietário da conta pode concluir a contratação. Seus acessos existentes permanecem disponíveis.
        </p>
      </section>
    </main>
  );
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

import { getAccessContext } from "@/lib/access/getAccessContext";
import { getCommercialActivationHierarchicalBundle } from "@/conversion-content";
import { getCommercialEntitlementSignal } from "../../../lib/commercial-entitlements";
import {
  getAccountLandingPageOnboardingConfiguration,
  listAccountLandingPageDrafts,
  type AccountLandingPage,
  type AccountLandingPageOnboardingConfiguration,
} from "../../../lib/lp-builder";
import { getActionableNicheResolutionForAccount } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { getActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import { PendingSetupFirstSteps } from "./_components/PendingSetupFirstSteps";
import { NicheResolutionCard } from "./_components/NicheResolutionCard";
import { OnboardingConfigurationJourney } from "./_components/OnboardingConfigurationJourney";
import { OnboardingCompletionJourney } from "./_components/OnboardingCompletionJourney";
import { GenericCommercialPage } from "./_components/commercial-page/GenericCommercialPage";
import { PublishedCommercialActivationPage } from "./_components/commercial-page/PublishedCommercialActivationPage";
import {
  decideAccountJourney,
  type AccountOnboardingState,
} from "./_components/onboarding-journey-policy";

type DashState = "auth" | "onboarding" | "public";

type PageProps = {
  params: Promise<{ account: string }> | { account: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const accountSubdomain = (resolvedParams.account ?? "").trim().toLowerCase();
  const editOnboarding = resolvedSearchParams.edit_onboarding === "1";

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
    const actorRole = ctx?.role ?? "viewer";
    const isCommerciallyEligible =
      commercialEntitlement?.isCommerciallyEligible === true;
    let onboardingState: AccountOnboardingState = "not_loaded";
    let onboardingConfiguration: AccountLandingPageOnboardingConfiguration | null =
      null;
    let onboardingDrafts: readonly AccountLandingPage[] | null = null;

    if (
      accountId &&
      isCommerciallyEligible &&
      (actorRole === "owner" || actorRole === "admin")
    ) {
      const onboardingResult =
        await getAccountLandingPageOnboardingConfiguration({ accountId });
      if (onboardingResult.ok) {
        onboardingConfiguration = onboardingResult.configuration;
        if (!onboardingResult.configuration.complete) {
          onboardingState = "incomplete";
        } else if (onboardingResult.configuration.landingPageId) {
          onboardingState = "complete_bound";
        } else {
          const draftsResult = await listAccountLandingPageDrafts({ accountId });
          if (draftsResult.ok) {
            onboardingDrafts = draftsResult.drafts;
            onboardingState = "complete_unbound";
          } else {
            onboardingState = "blocked";
          }
        }
      } else {
        onboardingState =
          onboardingResult.error === "configuration_unavailable"
            ? "unavailable"
            : "blocked";
      }
    } else if (isCommerciallyEligible) {
      onboardingState = "blocked";
    }

    const accountJourney = decideAccountJourney({
      actorRole,
      isCommerciallyEligible,
      onboardingState,
    });

    if (accountJourney.mode === "waiting") {
      return <CommercialWaitingState />;
    }
    if (accountJourney.mode === "onboarding" && onboardingConfiguration) {
      return (
        <OnboardingConfigurationJourney
          accountSubdomain={accountSubdomain}
          configuration={onboardingConfiguration}
        />
      );
    }
    if (
      accountJourney.mode === "review" &&
      onboardingConfiguration &&
      onboardingDrafts
    ) {
      if (editOnboarding) {
        return (
          <OnboardingConfigurationJourney
            accountSubdomain={accountSubdomain}
            configuration={onboardingConfiguration}
            reviewMode
          />
        );
      }
      return (
        <OnboardingCompletionJourney
          accountSubdomain={accountSubdomain}
          configuration={onboardingConfiguration}
          drafts={onboardingDrafts}
        />
      );
    }
    if (accountJourney.mode === "operational") {
      return <OperationalReadyState />;
    }
    if (accountJourney.mode === "blocked") {
      return <OnboardingBlockedState />;
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
          showFinancialActions={accountJourney.showFinancialActions}
        />
      ) : (
        <GenericCommercialPage
          accountSubdomain={accountSubdomain}
          showFinancialActions={accountJourney.showFinancialActions}
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

function OperationalReadyState() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-card sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Configuração concluída
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Sua conta está pronta para trabalhar na primeira landing page.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-graytech-700 sm:text-base">
          O rascunho escolhido está vinculado a esta configuração e pronto para as próximas etapas do produto.
        </p>
      </section>
    </main>
  );
}

function OnboardingBlockedState() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">
          Configuração indisponível
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          A conta precisa de uma revisão antes de continuar.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-graytech-700 sm:text-base">
          Somente o proprietário ou um administrador ativo pode concluir esta configuração. Se você já tem esse acesso, confirme os dados da conta e tente novamente.
        </p>
      </section>
    </main>
  );
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

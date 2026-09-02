import { PendingSetupFirstSteps } from "./_components/PendingSetupFirstSteps";
import { NicheResolutionCard } from "./_components/NicheResolutionCard";
import { GenericCommercialPage } from "./_components/commercial-page/GenericCommercialPage";
import { PublishedCommercialActivationPage } from "./_components/commercial-page/PublishedCommercialActivationPage";
import { loadAccountJourney } from "./account-journey-loader";

type PageProps = {
  params: Promise<{ account: string }> | { account: string };
};

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const accountSubdomain = (resolvedParams.account ?? "").trim().toLowerCase();

  const journey = await loadAccountJourney({ accountSubdomain });

  if (journey.view === "pending_setup") {
    return <PendingSetupFirstSteps accountSubdomain={accountSubdomain} ctx={journey.ctx} />;
  }
  if (journey.view === "account_unavailable") {
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
  if (journey.view === "waiting") return <CommercialWaitingState />;
  if (journey.view === "commercial") {
    const commercialPage =
      journey.bundle ? (
        <PublishedCommercialActivationPage
          accountSubdomain={accountSubdomain}
          bundle={journey.bundle}
          showFinancialActions={journey.showFinancialActions}
        />
      ) : (
        <GenericCommercialPage
          accountSubdomain={accountSubdomain}
          showFinancialActions={journey.showFinancialActions}
        />
      );

    return (
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="space-y-6">
          {journey.nicheResolution ? (
            <NicheResolutionCard
              accountSubdomain={accountSubdomain}
              resolution={journey.nicheResolution}
            />
          ) : null}

          {commercialPage}
        </div>
      </main>
    );
  }

  if (journey.view === "home") {
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

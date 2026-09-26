import "server-only";

import { getAccessContext } from "@/lib/access/getAccessContext";
import { getCommercialActivationHierarchicalBundle } from "@/conversion-content";
import { readCommercialEntitlementSignal } from "../../../lib/commercial-entitlements";
import { loadFactualOnboarding } from "../../../lib/onboarding/factual/adapters/accountFactualOnboardingAdapter";
import { getActionableNicheResolutionForAccount } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { readActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import { loadPendingSetupConversation } from "../../../lib/onboarding/pending-setup/adapters/pendingSetupConversationAdapter";
import { decideAccountJourney } from "./_components/onboarding-journey-policy";

type DashState = "auth" | "onboarding" | "public";

// Account Dashboard read/presentation result; domain decisions remain in the policy.
// Only this route consumes the loader. Each branch carries its existing UI data.
export async function loadAccountJourney({
  accountSubdomain,
}: {
  accountSubdomain: string;
}) {
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
      const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
      const userId = (
        (ctx?.member as { userId?: string } | null | undefined)?.userId ?? null
      ) as string | null;
      const conversation = accountId && userId
        ? await loadPendingSetupConversation({ accountId, userId })
        : null;
      return { view: "pending_setup" as const, conversation };
    }

    if (accountStatus !== "active") {
      return { view: "account_unavailable" as const };
    }

    const accountId = (ctx?.account?.id ?? ctx?.account_id ?? null) as string | null;
    if (!accountId) return { view: "factual_unavailable" as const };
    const [entitlementRead, nicheResolution, taxonRead] = await Promise.all([
      readCommercialEntitlementSignal({ accountId }),
      getActionableNicheResolutionForAccount({ accountId, accountStatus }),
      readActivePrimaryAccountTaxon({ accountId }),
    ]);
    const actorRole = ctx?.role ?? "viewer";
    const isCommerciallyEligible =
      entitlementRead.ok && entitlementRead.signal.isCommerciallyEligible;
    const accountJourney = decideAccountJourney({
      actorRole,
      isCommerciallyEligible,
      entitlementLookupStatus: entitlementRead.ok ? "ok" : "error",
      taxonLookupStatus: taxonRead.ok ? "ok" : "error",
    });

    if (accountJourney.mode === "blocked") return { view: "factual_unavailable" as const };
    if (accountJourney.mode === "waiting") {
      return { view: "waiting" as const };
    }

    const primaryTaxon = taxonRead.ok ? taxonRead.taxon : null;
    if (isCommerciallyEligible && primaryTaxon) {
      const factual = await loadFactualOnboarding(accountSubdomain);
      if (factual.status === "available") return { view: "factual" as const, factual };
      return { view: "factual_unavailable" as const };
    }

    const commercialActivation = primaryTaxon
      ? await getCommercialActivationHierarchicalBundle({
          taxonId: primaryTaxon.taxonId,
        })
      : null;
    return {
      view: "commercial" as const,
      bundle: commercialActivation?.status === "ready" && commercialActivation.bundle
        ? commercialActivation.bundle
        : null,
      nicheResolution,
      showFinancialActions: accountJourney.showFinancialActions,
    };
  }

  if (state === "onboarding") {
    return { view: "home" as const };
  }

  return { view: "public" as const };
}

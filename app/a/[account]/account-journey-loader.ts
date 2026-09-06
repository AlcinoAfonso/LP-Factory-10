import "server-only";

import { getAccessContext } from "@/lib/access/getAccessContext";
import { getCommercialActivationHierarchicalBundle } from "@/conversion-content";
import { getCommercialEntitlementSignal } from "../../../lib/commercial-entitlements";
import { getActionableNicheResolutionForAccount } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { getActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
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
      return { view: "pending_setup" as const, ctx };
    }

    if (accountStatus !== "active") {
      return { view: "account_unavailable" as const };
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
    const accountJourney = decideAccountJourney({
      actorRole,
      isCommerciallyEligible,
    });

    if (accountJourney.mode === "waiting") {
      return { view: "waiting" as const };
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

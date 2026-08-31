import "server-only";

import { getAccessContext } from "@/lib/access/getAccessContext";
import { getCommercialActivationHierarchicalBundle } from "@/conversion-content";
import { getCommercialEntitlementSignal } from "../../../lib/commercial-entitlements";
import {
  getAccountLandingPageOnboardingConfiguration,
  isLandingPageWorkspaceEnabled,
  listAccountLandingPageDrafts,
  listAccountLandingPageWorkspace,
  type AccountLandingPage,
  type AccountLandingPageOnboardingConfiguration,
} from "../../../lib/lp-builder";
import { getActionableNicheResolutionForAccount } from "../../../lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter";
import { getActivePrimaryAccountTaxon } from "../../../lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter";
import {
  decideAccountJourney,
  type AccountOnboardingState,
} from "./_components/onboarding-journey-policy";

type DashState = "auth" | "onboarding" | "public";

// Account Dashboard read/presentation result; domain decisions remain in the policy.
// Only this route consumes the loader. Each branch carries its existing UI data.
export async function loadAccountJourney({
  accountSubdomain,
  workspaceCursor,
}: {
  accountSubdomain: string;
  workspaceCursor: string | string[] | undefined;
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
    const workspace =
      accountId && isCommerciallyEligible && isLandingPageWorkspaceEnabled()
        ? await listAccountLandingPageWorkspace({
            accountId,
            cursor:
              typeof workspaceCursor === "string"
                ? workspaceCursor
                : undefined,
          })
        : null;
    if (
      workspace?.ok &&
      actorRole !== "owner" &&
      actorRole !== "admin"
    ) {
      return { view: "workspace" as const, workspace };
    }
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
      return { view: "waiting" as const };
    }
    if (accountJourney.mode === "onboarding" && onboardingConfiguration) {
      return { view: "onboarding" as const, configuration: onboardingConfiguration };
    }
    if (
      accountJourney.mode === "review" &&
      onboardingConfiguration &&
      onboardingDrafts
    ) {
      return {
        view: "review" as const,
        configuration: onboardingConfiguration,
        drafts: onboardingDrafts,
      };
    }
    if (accountJourney.mode === "operational") {
      if (!accountId || !onboardingConfiguration?.landingPageId) {
        return { view: "blocked" as const };
      }
      if (!isLandingPageWorkspaceEnabled()) return { view: "workspace_rollout_pending" as const };
      if (!workspace?.ok) return { view: "workspace_unavailable" as const };
      return { view: "workspace" as const, workspace };
    }
    if (accountJourney.mode === "blocked") {
      return { view: "blocked" as const };
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

import type { MemberRole } from "@/lib/types/status";

export type AccountJourneyDecision = Readonly<{
  mode: "commercial" | "waiting" | "blocked";
  showFinancialActions: boolean;
}>;

export function decideAccountJourney(input: Readonly<{
  actorRole: MemberRole;
  isCommerciallyEligible: boolean;
  entitlementLookupStatus: "ok" | "error";
  taxonLookupStatus: "ok" | "error";
}>): AccountJourneyDecision {
  if (input.entitlementLookupStatus === "error" || input.taxonLookupStatus === "error") {
    return { mode: "blocked", showFinancialActions: false };
  }
  if (!input.isCommerciallyEligible && input.actorRole !== "owner") {
    return { mode: "waiting", showFinancialActions: false };
  }

  return {
    mode: "commercial",
    showFinancialActions:
      !input.isCommerciallyEligible && input.actorRole === "owner",
  };
}

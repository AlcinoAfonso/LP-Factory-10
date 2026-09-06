import type { MemberRole } from "@/lib/types/status";

export type AccountJourneyDecision = Readonly<{
  mode: "commercial" | "waiting";
  showFinancialActions: boolean;
}>;

export function decideAccountJourney(input: Readonly<{
  actorRole: MemberRole;
  isCommerciallyEligible: boolean;
}>): AccountJourneyDecision {
  if (!input.isCommerciallyEligible && input.actorRole !== "owner") {
    return { mode: "waiting", showFinancialActions: false };
  }

  return {
    mode: "commercial",
    showFinancialActions:
      !input.isCommerciallyEligible && input.actorRole === "owner",
  };
}

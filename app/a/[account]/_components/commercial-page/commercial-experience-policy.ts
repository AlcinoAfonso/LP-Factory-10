import type { MemberRole } from '@/lib/types/status';

export type CommercialPageVariant = 'generic-v1' | 'commercial_activation_published';

export type CommercialExperienceDecision = Readonly<{
  mode: 'commercial' | 'waiting';
  showFinancialActions: boolean;
}>;

export function decideCommercialExperience(input: Readonly<{
  actorRole: MemberRole;
  isCommerciallyEligible: boolean;
}>): CommercialExperienceDecision {
  if (input.actorRole !== 'owner' && !input.isCommerciallyEligible) {
    return { mode: 'waiting', showFinancialActions: false };
  }

  return {
    mode: 'commercial',
    showFinancialActions:
      input.actorRole === 'owner' && !input.isCommerciallyEligible,
  };
}

export function decideCommercialCtaInteraction(input: Readonly<{
  showFinancialActions: boolean;
  ctaLocation: 'hero' | 'plan_card' | 'final';
}>): 'disabled' | 'checkout' | 'navigate' {
  if (!input.showFinancialActions) return 'disabled';
  return input.ctaLocation === 'plan_card' ? 'checkout' : 'navigate';
}

import type { AccountStatus, MemberRole, MemberStatus } from '@/lib/types/status';

export type CheckoutAuthorityDecision =
  | Readonly<{ allowed: true }>
  | Readonly<{
      allowed: false;
      reason:
        | 'account_not_active'
        | 'membership_not_active'
        | 'insufficient_role'
        | 'account_already_commercially_eligible';
    }>;

export type CheckoutDecisionResult = 'allowed' | 'denied' | 'error';

export type CheckoutDecisionEvent = Readonly<{
  event: 'commercial_checkout_decision';
  operation: 'checkout';
  result: CheckoutDecisionResult;
  reason: string;
  account_id: string | null;
  actor_role: string | null;
  request_id: string | null;
  latency_ms: number;
}>;

export function decideCheckoutAccess(input: Readonly<{
  accountStatus: AccountStatus;
  membershipStatus: MemberStatus;
  actorRole: MemberRole;
}>): CheckoutAuthorityDecision {
  if (input.accountStatus !== 'active') {
    return { allowed: false, reason: 'account_not_active' };
  }
  if (input.membershipStatus !== 'active') {
    return { allowed: false, reason: 'membership_not_active' };
  }
  if (input.actorRole !== 'owner') {
    return { allowed: false, reason: 'insufficient_role' };
  }
  return { allowed: true };
}

export function decideCheckoutCommercialEligibility(
  isCommerciallyEligible: boolean,
): CheckoutAuthorityDecision {
  return isCommerciallyEligible
    ? { allowed: false, reason: 'account_already_commercially_eligible' }
    : { allowed: true };
}

export function createCheckoutDecisionRecorder(
  write: (event: CheckoutDecisionEvent) => void,
) {
  let recorded = false;

  return {
    record(event: CheckoutDecisionEvent) {
      if (recorded) return;
      recorded = true;
      try {
        write(event);
      } catch {
        // Logging is intentionally non-blocking.
      }
    },
  } as const;
}

export async function continueCheckoutWhenAuthorized<T>(input: Readonly<{
  decision: CheckoutAuthorityDecision;
  onAllowed: () => Promise<T>;
}>): Promise<
  | Readonly<{ allowed: false; reason: Exclude<CheckoutAuthorityDecision, { allowed: true }>['reason'] }>
  | Readonly<{ allowed: true; value: T }>
> {
  if (!input.decision.allowed) return input.decision;
  return { allowed: true, value: await input.onAllowed() };
}

export async function runAuthorizedCheckout<T>(input: Readonly<{
  recordAllowed: () => void;
  createCheckout: () => Promise<T>;
}>): Promise<T> {
  input.recordAllowed();
  return input.createCheckout();
}

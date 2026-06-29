export const BILLING_CHECKOUT_PLAN_KEYS = [
  "starter",
  "lite",
  "pro",
  "ultra",
] as const;

export type BillingCheckoutPlanKey = (typeof BILLING_CHECKOUT_PLAN_KEYS)[number];

export type BillingCheckoutProvider = "stripe";

export type BillingCheckoutMode = "subscription";

export type BillingCheckoutRecurrence = "monthly" | "annual";

export type BillingCheckoutExternalReferences = {
  providerCustomerId?: string | null;
  providerPriceId?: string | null;
  providerSubscriptionId?: string | null;
  providerCheckoutSessionId?: string | null;
};

export type BillingCheckoutRequest = {
  account_id: string;
  plan_key: BillingCheckoutPlanKey;
  provider: BillingCheckoutProvider;
  mode: BillingCheckoutMode;
  recurrence: BillingCheckoutRecurrence;
  successUrl?: string;
  cancelUrl?: string;
  externalReferences?: BillingCheckoutExternalReferences;
};

export type BillingCheckoutSession = {
  provider: BillingCheckoutProvider;
  mode: BillingCheckoutMode;
  plan_key: BillingCheckoutPlanKey;
  recurrence: BillingCheckoutRecurrence;
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  externalReferences: BillingCheckoutExternalReferences;
};

export type BillingCheckoutNormalizationResult =
  | {
      ok: true;
      checkout: BillingCheckoutSession;
    }
  | {
      ok: false;
      reason:
        | "invalid_account_id"
        | "invalid_plan_key"
        | "invalid_provider"
        | "invalid_mode"
        | "invalid_recurrence";
    };

export function isBillingCheckoutPlanKey(
  value: unknown,
): value is BillingCheckoutPlanKey {
  return (
    typeof value === "string" &&
    BILLING_CHECKOUT_PLAN_KEYS.includes(value as BillingCheckoutPlanKey)
  );
}

export function normalizeBillingCheckoutPlanKey(
  value: unknown,
): BillingCheckoutPlanKey | null {
  if (isBillingCheckoutPlanKey(value)) return value;
  if (value === "light") return "lite";
  return null;
}

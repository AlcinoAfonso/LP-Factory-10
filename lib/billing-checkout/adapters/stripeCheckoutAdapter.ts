import "server-only";

import {
  type BillingCheckoutExternalReferences,
  type BillingCheckoutNormalizationResult,
  type BillingCheckoutRecurrence,
  normalizeBillingCheckoutPlanKey,
} from "../contracts";

type StripeCheckoutDraftInput = {
  account_id: string;
  plan_key: unknown;
  recurrence: BillingCheckoutRecurrence;
  checkoutSessionId?: string | null;
  checkoutUrl?: string | null;
  externalReferences?: BillingCheckoutExternalReferences;
};

const recurrences: ReadonlySet<BillingCheckoutRecurrence> = new Set([
  "monthly",
  "annual",
]);

export function normalizeStripeCheckoutDraft(
  input: StripeCheckoutDraftInput,
): BillingCheckoutNormalizationResult {
  const accountId = input.account_id.trim();
  if (!accountId) return { ok: false, reason: "invalid_account_id" };

  const planKey = normalizeBillingCheckoutPlanKey(input.plan_key);
  if (!planKey) return { ok: false, reason: "invalid_plan_key" };

  if (!recurrences.has(input.recurrence)) {
    return { ok: false, reason: "invalid_recurrence" };
  }

  return {
    ok: true,
    checkout: {
      provider: "stripe",
      mode: "subscription",
      plan_key: planKey,
      recurrence: input.recurrence,
      checkoutSessionId: normalizeOptionalString(input.checkoutSessionId),
      checkoutUrl: normalizeOptionalString(input.checkoutUrl),
      externalReferences: normalizeExternalReferences({
        ...input.externalReferences,
        providerCheckoutSessionId:
          input.externalReferences?.providerCheckoutSessionId ??
          input.checkoutSessionId ??
          null,
      }),
    },
  };
}

function normalizeExternalReferences(
  references: BillingCheckoutExternalReferences,
): BillingCheckoutExternalReferences {
  return {
    providerCustomerId: normalizeOptionalString(references.providerCustomerId),
    providerPriceId: normalizeOptionalString(references.providerPriceId),
    providerSubscriptionId: normalizeOptionalString(
      references.providerSubscriptionId,
    ),
    providerCheckoutSessionId: normalizeOptionalString(
      references.providerCheckoutSessionId,
    ),
  };
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

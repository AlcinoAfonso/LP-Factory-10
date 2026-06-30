import "server-only";

import {
  type BillingCheckoutExternalReferences,
  type BillingCheckoutNormalizationResult,
  type BillingCheckoutPlanKey,
  type BillingCheckoutRecurrence,
  isBillingCheckoutPlanKey,
  normalizeBillingCheckoutPlanKey,
} from "../contracts";
import { resolveStripeTestPlanPrice } from "./stripePriceMap";

type StripeCheckoutDraftInput = {
  account_id: string;
  plan_key: unknown;
  recurrence: BillingCheckoutRecurrence;
  checkoutSessionId?: string | null;
  checkoutUrl?: string | null;
  externalReferences?: BillingCheckoutExternalReferences;
};

export type StripeCheckoutSessionReadinessInput = {
  account_id: unknown;
  plan_key: unknown;
  recurrence: unknown;
  successUrl: unknown;
  cancelUrl: unknown;
  env: Record<string, string | undefined> | null | undefined;
};

export type StripeCheckoutSessionCreateContract = {
  provider: "stripe";
  environment: "test";
  mode: "subscription";
  account_id: string;
  plan_key: BillingCheckoutPlanKey;
  recurrence: BillingCheckoutRecurrence;
  successUrl: string;
  cancelUrl: string;
  providerProductId: string;
  providerPriceId: string;
  providerSecretKeyEnv: "STRIPE_SECRET_KEY";
  externalReferences: BillingCheckoutExternalReferences;
};

export type StripeCheckoutSessionReadinessResult =
  | {
      ok: true;
      value: StripeCheckoutSessionCreateContract;
    }
  | {
      ok: false;
      reason:
        | "missing_env"
        | "missing_secret_key"
        | "invalid_secret_key"
        | "missing_account_id"
        | "invalid_plan_key"
        | "invalid_recurrence"
        | "missing_success_url"
        | "invalid_success_url"
        | "missing_cancel_url"
        | "invalid_cancel_url"
        | "missing_product_id"
        | "missing_price_id"
        | "mapping_incomplete";
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

export function validateStripeCheckoutSessionReadiness(
  input: StripeCheckoutSessionReadinessInput,
): StripeCheckoutSessionReadinessResult {
  if (!input.env) return { ok: false, reason: "missing_env" };

  const secretKey = normalizeOptionalString(input.env.STRIPE_SECRET_KEY);
  if (!secretKey) return { ok: false, reason: "missing_secret_key" };
  if (!secretKey.startsWith("sk_test_")) {
    return { ok: false, reason: "invalid_secret_key" };
  }

  const accountId = normalizeRequiredUnknownString(input.account_id);
  if (!accountId) return { ok: false, reason: "missing_account_id" };

  if (!isBillingCheckoutPlanKey(input.plan_key)) {
    return { ok: false, reason: "invalid_plan_key" };
  }

  if (!recurrences.has(input.recurrence as BillingCheckoutRecurrence)) {
    return { ok: false, reason: "invalid_recurrence" };
  }

  const successUrl = normalizeRequiredUrl(input.successUrl);
  if (!successUrl) {
    return {
      ok: false,
      reason:
        normalizeRequiredUnknownString(input.successUrl) === null
          ? "missing_success_url"
          : "invalid_success_url",
    };
  }

  const cancelUrl = normalizeRequiredUrl(input.cancelUrl);
  if (!cancelUrl) {
    return {
      ok: false,
      reason:
        normalizeRequiredUnknownString(input.cancelUrl) === null
          ? "missing_cancel_url"
          : "invalid_cancel_url",
    };
  }

  const resolvedPrice = resolveStripeTestPlanPrice({
    plan_key: input.plan_key,
    recurrence: input.recurrence,
    env: input.env,
  });

  if (!resolvedPrice.ok) return resolvedPrice;

  return {
    ok: true,
    value: {
      provider: "stripe",
      environment: "test",
      mode: "subscription",
      account_id: accountId,
      plan_key: resolvedPrice.value.plan_key,
      recurrence: resolvedPrice.value.recurrence,
      successUrl,
      cancelUrl,
      providerProductId: resolvedPrice.value.providerProductId,
      providerPriceId: resolvedPrice.value.providerPriceId,
      providerSecretKeyEnv: "STRIPE_SECRET_KEY",
      externalReferences: {
        providerProductId: resolvedPrice.value.providerProductId,
        providerPriceId: resolvedPrice.value.providerPriceId,
      },
    },
  };
}

function normalizeExternalReferences(
  references: BillingCheckoutExternalReferences,
): BillingCheckoutExternalReferences {
  return {
    providerCustomerId: normalizeOptionalString(references.providerCustomerId),
    providerProductId: normalizeOptionalString(references.providerProductId),
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

function normalizeRequiredUnknownString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredUrl(value: unknown): string | null {
  const stringValue = normalizeRequiredUnknownString(value);
  if (!stringValue) return null;

  try {
    const url = new URL(stringValue);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

import "server-only";

import {
  type BillingCheckoutExternalReferences,
  type BillingCheckoutNormalizationResult,
  type BillingCheckoutSession,
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

export type StripeCheckoutSessionCreationInput =
  StripeCheckoutSessionReadinessInput;

export type StripeCheckoutSessionCreationResult =
  | {
      ok: true;
      checkout: BillingCheckoutSession;
    }
  | {
      ok: false;
      reason:
        | StripeCheckoutSessionReadinessResultFailureReason
        | "stripe_request_failed"
        | "stripe_invalid_response"
        | "missing_checkout_url"
        | "invalid_checkout_url"
        | "invalid_checkout_session_id";
      status?: number;
    };

type StripeCheckoutSessionReadinessResultFailureReason = Extract<
  StripeCheckoutSessionReadinessResult,
  { ok: false }
>["reason"];

const STRIPE_CHECKOUT_SESSIONS_URL =
  "https://api.stripe.com/v1/checkout/sessions";

const STRIPE_API_VERSION = "2026-02-25.clover";

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

export async function createStripeTestCheckoutSession(
  input: StripeCheckoutSessionCreationInput,
): Promise<StripeCheckoutSessionCreationResult> {
  const readiness = validateStripeCheckoutSessionReadiness(input);
  if (!readiness.ok) return readiness;

  const secretKey = normalizeOptionalString(input.env?.STRIPE_SECRET_KEY);
  if (!secretKey) return { ok: false, reason: "missing_secret_key" };

  const contract = readiness.value;
  const body = new URLSearchParams();
  body.set("mode", contract.mode);
  body.set("success_url", contract.successUrl);
  body.set("cancel_url", contract.cancelUrl);
  body.set("client_reference_id", contract.account_id);
  body.set("line_items[0][price]", contract.providerPriceId);
  body.set("line_items[0][quantity]", "1");
  body.set("metadata[account_id]", contract.account_id);
  body.set("metadata[plan_key]", contract.plan_key);
  body.set("metadata[recurrence]", contract.recurrence);
  body.set("metadata[environment]", contract.environment);
  body.set("subscription_data[metadata][account_id]", contract.account_id);
  body.set("subscription_data[metadata][plan_key]", contract.plan_key);
  body.set("subscription_data[metadata][recurrence]", contract.recurrence);

  let response: Response;
  try {
    response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": STRIPE_API_VERSION,
      },
      body,
      cache: "no-store",
    });
  } catch {
    return { ok: false, reason: "stripe_request_failed" };
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "stripe_request_failed",
      status: response.status,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: "stripe_invalid_response" };
  }

  const checkoutSessionId = readStringProperty(payload, "id");
  if (!checkoutSessionId) {
    return { ok: false, reason: "invalid_checkout_session_id" };
  }

  if (!checkoutSessionId.startsWith("cs_test_")) {
    return { ok: false, reason: "invalid_checkout_session_id" };
  }

  const checkoutUrl = readStringProperty(payload, "url");
  if (!checkoutUrl) return { ok: false, reason: "missing_checkout_url" };
  if (!isValidHttpsUrl(checkoutUrl)) {
    return { ok: false, reason: "invalid_checkout_url" };
  }

  const normalized = normalizeStripeCheckoutDraft({
    account_id: contract.account_id,
    plan_key: contract.plan_key,
    recurrence: contract.recurrence,
    checkoutSessionId,
    checkoutUrl,
    externalReferences: {
      ...contract.externalReferences,
      providerCheckoutSessionId: checkoutSessionId,
    },
  });

  if (!normalized.ok) {
    return { ok: false, reason: "stripe_invalid_response" };
  }

  return { ok: true, checkout: normalized.checkout };
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

function readStringProperty(payload: unknown, property: string): string | null {
  if (!payload || typeof payload !== "object") return null;
  const value = (payload as Record<string, unknown>)[property];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

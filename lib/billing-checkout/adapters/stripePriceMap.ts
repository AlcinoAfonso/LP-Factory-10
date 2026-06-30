import "server-only";

import {
  BILLING_CHECKOUT_PLAN_KEYS,
  type BillingCheckoutPlanKey,
  type BillingCheckoutRecurrence,
  isBillingCheckoutPlanKey,
} from "../contracts";

export type StripeCheckoutEnvironment = "test";

export type StripePriceMapEntry = {
  environment: StripeCheckoutEnvironment;
  plan_key: BillingCheckoutPlanKey;
  recurrence: BillingCheckoutRecurrence;
  stripeProductId: string;
  stripePriceId: string;
};

export type StripePriceMapConfig = ReadonlyArray<StripePriceMapEntry>;

export type StripePriceLookupInput = {
  stripePriceId: string;
  stripeProductId?: string | null;
};

export type StripePriceLookupResult =
  | {
      ok: true;
      mapping: StripePriceMapEntry;
    }
  | {
      ok: false;
      reason:
        | "invalid_price_id"
        | "invalid_product_id"
        | "price_not_mapped"
        | "product_price_mismatch";
    };

type StripeTestPlanRecurrenceConfig = {
  productEnv: string;
  priceEnv: string;
};

export const STRIPE_TEST_PRICE_ENV_KEYS: Record<
  BillingCheckoutPlanKey,
  Record<BillingCheckoutRecurrence, StripeTestPlanRecurrenceConfig>
> = {
  starter: {
    monthly: {
      productEnv: "STRIPE_TEST_STARTER_MONTHLY_PRODUCT_ID",
      priceEnv: "STRIPE_TEST_STARTER_MONTHLY_PRICE_ID",
    },
    annual: {
      productEnv: "STRIPE_TEST_STARTER_ANNUAL_PRODUCT_ID",
      priceEnv: "STRIPE_TEST_STARTER_ANNUAL_PRICE_ID",
    },
  },
  lite: {
    monthly: {
      productEnv: "STRIPE_TEST_LITE_MONTHLY_PRODUCT_ID",
      priceEnv: "STRIPE_TEST_LITE_MONTHLY_PRICE_ID",
    },
    annual: {
      productEnv: "STRIPE_TEST_LITE_ANNUAL_PRODUCT_ID",
      priceEnv: "STRIPE_TEST_LITE_ANNUAL_PRICE_ID",
    },
  },
  pro: {
    monthly: {
      productEnv: "STRIPE_TEST_PRO_MONTHLY_PRODUCT_ID",
      priceEnv: "STRIPE_TEST_PRO_MONTHLY_PRICE_ID",
    },
    annual: {
      productEnv: "STRIPE_TEST_PRO_ANNUAL_PRODUCT_ID",
      priceEnv: "STRIPE_TEST_PRO_ANNUAL_PRICE_ID",
    },
  },
  ultra: {
    monthly: {
      productEnv: "STRIPE_TEST_ULTRA_MONTHLY_PRODUCT_ID",
      priceEnv: "STRIPE_TEST_ULTRA_MONTHLY_PRICE_ID",
    },
    annual: {
      productEnv: "STRIPE_TEST_ULTRA_ANNUAL_PRODUCT_ID",
      priceEnv: "STRIPE_TEST_ULTRA_ANNUAL_PRICE_ID",
    },
  },
};

const recurrenceKeys: BillingCheckoutRecurrence[] = ["monthly", "annual"];

export function buildStripeTestPriceMapFromEnv(
  env: Record<string, string | undefined>,
): StripePriceMapConfig {
  const entries: StripePriceMapEntry[] = [];

  for (const plan_key of BILLING_CHECKOUT_PLAN_KEYS) {
    for (const recurrence of recurrenceKeys) {
      const envKeys = STRIPE_TEST_PRICE_ENV_KEYS[plan_key][recurrence];
      const stripeProductId = normalizeRequiredString(env[envKeys.productEnv]);
      const stripePriceId = normalizeRequiredString(env[envKeys.priceEnv]);

      if (!stripeProductId || !stripePriceId) continue;

      entries.push({
        environment: "test",
        plan_key,
        recurrence,
        stripeProductId,
        stripePriceId,
      });
    }
  }

  return entries;
}

export function resolveStripeTestPriceMapping(
  input: StripePriceLookupInput,
  config: StripePriceMapConfig,
): StripePriceLookupResult {
  const stripePriceId = normalizeRequiredString(input.stripePriceId);
  if (!stripePriceId) return { ok: false, reason: "invalid_price_id" };

  const mapping = config.find((entry) => entry.stripePriceId === stripePriceId);
  if (!mapping) return { ok: false, reason: "price_not_mapped" };

  if (!isBillingCheckoutPlanKey(mapping.plan_key)) {
    return { ok: false, reason: "price_not_mapped" };
  }

  if (input.stripeProductId === null || input.stripeProductId === undefined) {
    return { ok: true, mapping };
  }

  const stripeProductId = normalizeRequiredString(input.stripeProductId);
  if (!stripeProductId) return { ok: false, reason: "invalid_product_id" };

  if (mapping.stripeProductId !== stripeProductId) {
    return { ok: false, reason: "product_price_mismatch" };
  }

  return { ok: true, mapping };
}

function normalizeRequiredString(value: string | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

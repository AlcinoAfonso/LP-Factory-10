import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import {
  type BillingCheckoutPlanKey,
  type BillingCheckoutRecurrence,
  isBillingCheckoutPlanKey,
} from "../contracts";
import {
  buildStripeTestPriceMapFromEnv,
  resolveStripeTestPriceMapping,
} from "./stripePriceMap";

export const STRIPE_WEBHOOK_EVENT_TYPES = [
  "invoice.paid",
  "checkout.session.completed",
  "customer.subscription.deleted",
  "invoice.payment_failed",
] as const;

export type StripeWebhookEventType = (typeof STRIPE_WEBHOOK_EVENT_TYPES)[number];

export type StripeWebhookEvent = {
  id: string;
  type: string;
  created?: number;
  livemode?: boolean;
  api_version?: string;
  data?: {
    object?: unknown;
  };
};

export type StripeVerifiedWebhookEventResult =
  | {
      ok: true;
      event: StripeWebhookEvent;
    }
  | {
      ok: false;
      reason:
        | "missing_webhook_secret"
        | "invalid_webhook_secret"
        | "missing_signature"
        | "invalid_signature"
        | "invalid_payload";
    };

export type StripeInvoicePaidEntitlement = {
  accountId: string;
  plan_key: BillingCheckoutPlanKey;
  recurrence: BillingCheckoutRecurrence;
  planNameSnapshot: string;
  subscriptionId: string;
  invoiceId: string;
  providerProductId: string;
  providerPriceId: string;
  startsAt: string | null;
  confirmedAt: string | null;
  expiresAt: string | null;
  metadataJson: Record<string, string | boolean | null>;
};

export type StripeInvoicePaidEntitlementResult =
  | {
      ok: true;
      entitlement: StripeInvoicePaidEntitlement;
    }
  | {
      ok: false;
      reason:
        | "unsupported_event_type"
        | "invalid_invoice"
        | "missing_subscription_id"
        | "stripe_subscription_fetch_failed"
        | "invalid_subscription"
        | "subscription_not_active"
        | "missing_metadata"
        | "invalid_account_id"
        | "invalid_plan_key"
        | "invalid_recurrence"
        | "invalid_price_id"
        | "invalid_product_id"
        | "missing_price_id"
        | "missing_product_id"
        | "price_not_mapped"
        | "product_price_mismatch";
      status?: number;
    };

type StripeSubscriptionLookupResult =
  | {
      ok: true;
      subscription: Record<string, unknown>;
    }
  | {
      ok: false;
      reason: "stripe_subscription_fetch_failed" | "invalid_subscription";
      status?: number;
    };

const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;
const STRIPE_SUBSCRIPTIONS_URL = "https://api.stripe.com/v1/subscriptions";
const STRIPE_API_VERSION = "2026-02-25.clover";

const recurrences = new Set<BillingCheckoutRecurrence>(["monthly", "annual"]);

export function verifyStripeWebhookEvent(input: {
  rawBody: string;
  signatureHeader: string | null;
  webhookSecret: string | undefined;
  toleranceSeconds?: number;
}): StripeVerifiedWebhookEventResult {
  const webhookSecret = normalizeRequiredString(input.webhookSecret);
  if (!webhookSecret) return { ok: false, reason: "missing_webhook_secret" };
  if (!webhookSecret.startsWith("whsec_")) {
    return { ok: false, reason: "invalid_webhook_secret" };
  }

  const signatureHeader = normalizeRequiredString(input.signatureHeader);
  if (!signatureHeader) return { ok: false, reason: "missing_signature" };

  const parsedSignature = parseStripeSignatureHeader(signatureHeader);
  if (!parsedSignature) return { ok: false, reason: "invalid_signature" };

  const toleranceSeconds =
    input.toleranceSeconds ?? STRIPE_SIGNATURE_TOLERANCE_SECONDS;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - parsedSignature.timestamp) > toleranceSeconds) {
    return { ok: false, reason: "invalid_signature" };
  }

  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(`${parsedSignature.timestamp}.${input.rawBody}`, "utf8")
    .digest("hex");

  const isValidSignature = parsedSignature.signatures.some((signature) =>
    secureCompareHex(signature, expectedSignature),
  );
  if (!isValidSignature) return { ok: false, reason: "invalid_signature" };

  let payload: unknown;
  try {
    payload = JSON.parse(input.rawBody);
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }

  const event = normalizeStripeWebhookEvent(payload);
  if (!event) return { ok: false, reason: "invalid_payload" };

  return { ok: true, event };
}

export function isSupportedStripeWebhookEventType(
  value: string,
): value is StripeWebhookEventType {
  return STRIPE_WEBHOOK_EVENT_TYPES.includes(value as StripeWebhookEventType);
}

export async function normalizeStripeInvoicePaidEntitlement(input: {
  event: StripeWebhookEvent;
  env: Record<string, string | undefined>;
}): Promise<StripeInvoicePaidEntitlementResult> {
  if (input.event.type !== "invoice.paid") {
    return { ok: false, reason: "unsupported_event_type" };
  }

  const invoice = normalizeRecord(input.event.data?.object);
  if (!invoice) return { ok: false, reason: "invalid_invoice" };

  const invoiceId = readString(invoice, "id");
  if (!invoiceId) return { ok: false, reason: "invalid_invoice" };

  const subscriptionId = readSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return { ok: false, reason: "missing_subscription_id" };

  const subscriptionLookup = await retrieveStripeSubscription({
    subscriptionId,
    env: input.env,
  });
  if (!subscriptionLookup.ok) return subscriptionLookup;

  const subscription = subscriptionLookup.subscription;
  const subscriptionStatus = readString(subscription, "status");
  if (subscriptionStatus !== "active") {
    return { ok: false, reason: "subscription_not_active" };
  }

  const metadata = {
    ...readMetadata(invoice),
    ...readMetadata(subscription),
  };
  const accountId = normalizeRequiredString(metadata.account_id);
  const planKey = metadata.plan_key;
  const recurrence = metadata.recurrence;

  if (!accountId || !planKey || !recurrence) {
    return { ok: false, reason: "missing_metadata" };
  }
  if (!isUuid(accountId)) return { ok: false, reason: "invalid_account_id" };
  if (!isBillingCheckoutPlanKey(planKey)) {
    return { ok: false, reason: "invalid_plan_key" };
  }
  if (!isBillingCheckoutRecurrence(recurrence)) {
    return { ok: false, reason: "invalid_recurrence" };
  }

  const price = readFirstSubscriptionPrice(subscription);
  if (!price.priceId) return { ok: false, reason: "missing_price_id" };
  if (!price.productId) return { ok: false, reason: "missing_product_id" };

  const mapping = resolveStripeTestPriceMapping(
    {
      stripePriceId: price.priceId,
      stripeProductId: price.productId,
    },
    buildStripeTestPriceMapFromEnv(input.env),
  );
  if (!mapping.ok) return mapping;

  if (mapping.mapping.plan_key !== planKey) {
    return { ok: false, reason: "invalid_plan_key" };
  }
  if (mapping.mapping.recurrence !== recurrence) {
    return { ok: false, reason: "invalid_recurrence" };
  }

  return {
    ok: true,
    entitlement: {
      accountId,
      plan_key: planKey,
      recurrence,
      planNameSnapshot: planNameSnapshots[planKey],
      subscriptionId,
      invoiceId,
      providerProductId: price.productId,
      providerPriceId: price.priceId,
      startsAt:
        unixSecondsToIsoString(readNumber(subscription, "current_period_start")) ??
        unixSecondsToIsoString(readNumber(invoice, "period_start")),
      confirmedAt:
        unixSecondsToIsoString(readInvoicePaidAt(invoice)) ??
        unixSecondsToIsoString(input.event.created),
      expiresAt:
        unixSecondsToIsoString(readNumber(subscription, "current_period_end")) ??
        unixSecondsToIsoString(readNumber(invoice, "period_end")),
      metadataJson: {
        stripe_event_id: input.event.id,
        stripe_event_type: input.event.type,
        stripe_invoice_id: invoiceId,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: price.priceId,
        stripe_product_id: price.productId,
        recurrence,
        livemode: input.event.livemode ?? null,
      },
    },
  };
}

function parseStripeSignatureHeader(
  signatureHeader: string,
): { timestamp: number; signatures: string[] } | null {
  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const timestamp = Number(timestampPart?.slice(2));
  if (!Number.isInteger(timestamp) || timestamp <= 0) return null;

  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter((signature) => /^[a-f0-9]{64}$/i.test(signature));

  return signatures.length > 0 ? { timestamp, signatures } : null;
}

function secureCompareHex(received: string, expected: string): boolean {
  try {
    const receivedBuffer = Buffer.from(received, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    return (
      receivedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(receivedBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}

function normalizeStripeWebhookEvent(payload: unknown): StripeWebhookEvent | null {
  const event = normalizeRecord(payload);
  if (!event) return null;

  const id = readString(event, "id");
  const type = readString(event, "type");
  if (!id || !type) return null;

  const data = normalizeRecord(event.data);
  return {
    id,
    type,
    created: readNumber(event, "created") ?? undefined,
    livemode: readBoolean(event, "livemode") ?? undefined,
    api_version: readString(event, "api_version") ?? undefined,
    data: data ? { object: data.object } : undefined,
  };
}

async function retrieveStripeSubscription(input: {
  subscriptionId: string;
  env: Record<string, string | undefined>;
}): Promise<StripeSubscriptionLookupResult> {
  const secretKey = normalizeRequiredString(input.env.STRIPE_SECRET_KEY);
  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    return { ok: false, reason: "stripe_subscription_fetch_failed" };
  }

  let response: Response;
  try {
    response = await fetch(
      `${STRIPE_SUBSCRIPTIONS_URL}/${encodeURIComponent(input.subscriptionId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Stripe-Version": STRIPE_API_VERSION,
        },
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, reason: "stripe_subscription_fetch_failed" };
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "stripe_subscription_fetch_failed",
      status: response.status,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, reason: "invalid_subscription" };
  }

  const subscription = normalizeRecord(payload);
  if (!subscription || !readString(subscription, "id")) {
    return { ok: false, reason: "invalid_subscription" };
  }

  return { ok: true, subscription };
}

function readSubscriptionIdFromInvoice(
  invoice: Record<string, unknown>,
): string | null {
  const subscription = invoice.subscription;
  if (typeof subscription === "string") return normalizeRequiredString(subscription);

  const subscriptionObject = normalizeRecord(subscription);
  const subscriptionObjectId = subscriptionObject
    ? readString(subscriptionObject, "id")
    : null;
  if (subscriptionObjectId) return subscriptionObjectId;

  const parent = normalizeRecord(invoice.parent);
  const subscriptionDetails = normalizeRecord(parent?.subscription_details);
  return readString(subscriptionDetails ?? {}, "subscription");
}

function readMetadata(source: Record<string, unknown>): Record<string, string> {
  const metadata = normalizeRecord(source.metadata);
  if (!metadata) return {};

  const entries = Object.entries(metadata).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return Object.fromEntries(entries);
}

function readFirstSubscriptionPrice(subscription: Record<string, unknown>): {
  priceId: string | null;
  productId: string | null;
} {
  const items = normalizeRecord(subscription.items);
  const data = Array.isArray(items?.data) ? items.data : [];
  const firstItem = normalizeRecord(data[0]);
  const price = normalizeRecord(firstItem?.price);
  if (!price) return { priceId: null, productId: null };

  const product = price.product;
  return {
    priceId: readString(price, "id"),
    productId:
      typeof product === "string"
        ? normalizeRequiredString(product)
        : readString(normalizeRecord(product) ?? {}, "id"),
  };
}

function readInvoicePaidAt(invoice: Record<string, unknown>): number | null {
  const statusTransitions = normalizeRecord(invoice.status_transitions);
  return readNumber(statusTransitions ?? {}, "paid_at");
}

function normalizeRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(
  source: Record<string, unknown>,
  property: string,
): string | null {
  return normalizeRequiredString(source[property]);
}

function readNumber(
  source: Record<string, unknown>,
  property: string,
): number | null {
  const value = source[property];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBoolean(
  source: Record<string, unknown>,
  property: string,
): boolean | null {
  const value = source[property];
  return typeof value === "boolean" ? value : null;
}

function normalizeRequiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isBillingCheckoutRecurrence(
  value: string,
): value is BillingCheckoutRecurrence {
  return recurrences.has(value as BillingCheckoutRecurrence);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function unixSecondsToIsoString(value: number | undefined | null): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return new Date(value * 1000).toISOString();
}

const planNameSnapshots: Record<BillingCheckoutPlanKey, string> = {
  starter: "Starter",
  lite: "Lite",
  pro: "Pro",
  ultra: "Ultra",
};

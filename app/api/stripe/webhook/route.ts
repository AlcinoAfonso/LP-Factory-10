import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";
import {
  isSupportedStripeWebhookEventType,
  normalizeStripeInvoicePaidEntitlement,
  verifyStripeWebhookEvent,
  type StripeInvoicePaidEntitlement,
  type StripeWebhookEvent,
} from "../../../../lib/billing-checkout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ServiceClient = ReturnType<typeof createServiceClient>;

type StripeWebhookEventRecord =
  | {
      ok: true;
      id: string;
      duplicate: false;
    }
  | {
      ok: true;
      duplicate: true;
    }
  | {
      ok: false;
      reason: string;
    };

type EntitlementWriteResult =
  | {
      ok: true;
      entitlementId: string;
    }
  | {
      ok: false;
      reason: string;
    };

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");

  const verified = verifyStripeWebhookEvent({
    rawBody,
    signatureHeader,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  });

  if (!verified.ok) {
    logStripeWebhook("warn", {
      event: "stripe_webhook_rejected",
      result: "signature_or_payload_invalid",
      reason: verified.reason,
    });

    return stripeWebhookResponse({ ok: false, error: verified.reason }, 400);
  }

  const stripeEvent = verified.event;
  if (!isSupportedStripeWebhookEventType(stripeEvent.type)) {
    logStripeWebhook("warn", {
      event: "stripe_webhook_rejected",
      provider: "stripe",
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      result: "unsupported_event_type",
    });

    return stripeWebhookResponse({ ok: false, error: "unsupported_event_type" }, 400);
  }

  const supabase = createServiceClient();
  const registered = await registerStripeWebhookEvent(supabase, stripeEvent);

  if (!registered.ok) {
    logStripeWebhook("error", {
      event: "stripe_webhook_failed",
      provider: "stripe",
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      result: "event_registration_failed",
      reason: registered.reason,
    });

    return stripeWebhookResponse({ ok: false, error: "event_registration_failed" }, 500);
  }

  if (registered.duplicate) {
    logStripeWebhook("info", {
      event: "stripe_webhook_duplicated",
      provider: "stripe",
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      result: "already_registered",
    });

    return stripeWebhookResponse({ ok: true, duplicate: true }, 200);
  }

  if (stripeEvent.type !== "invoice.paid") {
    await markStripeWebhookEvent(supabase, {
      id: registered.id,
      processingStatus: "ignored",
      metadataJson: {
        ...buildStripeWebhookEventMetadata(stripeEvent),
        ignored_reason: "future_scope",
      },
    });

    logStripeWebhook("info", {
      event: "stripe_webhook_ignored",
      provider: "stripe",
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      result: "future_scope",
    });

    return stripeWebhookResponse({ ok: true, ignored: true }, 200);
  }

  const normalized = await normalizeStripeInvoicePaidEntitlement({
    event: stripeEvent,
    env: process.env,
  });

  if (!normalized.ok) {
    await markStripeWebhookEvent(supabase, {
      id: registered.id,
      processingStatus: "failed",
      errorCode: normalized.reason,
      metadataJson: buildStripeWebhookEventMetadata(stripeEvent),
    });

    logStripeWebhook("warn", {
      event: "stripe_webhook_failed",
      provider: "stripe",
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      result: "invoice_not_eligible",
      reason: normalized.reason,
      status: normalized.status ?? null,
    });

    return stripeWebhookResponse(
      { ok: false, error: normalized.reason },
      normalized.reason === "stripe_subscription_fetch_failed" ? 502 : 400,
    );
  }

  const entitlementWrite = await upsertStripeEntitlement(supabase, {
    eventId: stripeEvent.id,
    entitlement: normalized.entitlement,
  });

  if (!entitlementWrite.ok) {
    await markStripeWebhookEvent(supabase, {
      id: registered.id,
      processingStatus: "failed",
      accountId: normalized.entitlement.accountId,
      externalReference: normalized.entitlement.subscriptionId,
      errorCode: entitlementWrite.reason,
      metadataJson: normalized.entitlement.metadataJson,
    });

    logStripeWebhook("error", {
      event: "stripe_webhook_failed",
      provider: "stripe",
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      account_id: normalized.entitlement.accountId,
      status: "ativo",
      result: "entitlement_write_failed",
      reason: entitlementWrite.reason,
    });

    return stripeWebhookResponse({ ok: false, error: "entitlement_write_failed" }, 500);
  }

  await markStripeWebhookEvent(supabase, {
    id: registered.id,
    processingStatus: "processed",
    accountId: normalized.entitlement.accountId,
    entitlementId: entitlementWrite.entitlementId,
    externalReference: normalized.entitlement.subscriptionId,
    metadataJson: normalized.entitlement.metadataJson,
  });

  logStripeWebhook("info", {
    event: "stripe_webhook_processed",
    provider: "stripe",
    stripe_event_id: stripeEvent.id,
    stripe_event_type: stripeEvent.type,
    account_id: normalized.entitlement.accountId,
    status: "ativo",
    result: "entitlement_upserted",
  });

  return stripeWebhookResponse({ ok: true }, 200);
}

async function registerStripeWebhookEvent(
  supabase: ServiceClient,
  stripeEvent: StripeWebhookEvent,
): Promise<StripeWebhookEventRecord> {
  const { data, error } = await supabase
    .from("stripe_webhook_events")
    .insert({
      event_id: stripeEvent.id,
      event_type: stripeEvent.type,
      provider: "stripe",
      processing_status: "processing",
      metadata_json: buildStripeWebhookEventMetadata(stripeEvent),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: true, duplicate: true };
    }
    return { ok: false, reason: error.code ?? "insert_failed" };
  }

  const id = typeof data?.id === "string" ? data.id : null;
  if (!id) return { ok: false, reason: "missing_event_record_id" };

  return { ok: true, duplicate: false, id };
}

async function markStripeWebhookEvent(
  supabase: ServiceClient,
  input: {
    id: string;
    processingStatus: "processed" | "ignored" | "failed";
    accountId?: string | null;
    entitlementId?: string | null;
    externalReference?: string | null;
    errorCode?: string | null;
    metadataJson: Record<string, string | boolean | null>;
  },
) {
  await supabase
    .from("stripe_webhook_events")
    .update({
      processing_status: input.processingStatus,
      account_id: input.accountId ?? null,
      entitlement_id: input.entitlementId ?? null,
      external_reference: input.externalReference ?? null,
      error_code: input.errorCode ?? null,
      metadata_json: input.metadataJson,
      processed_at: new Date().toISOString(),
    })
    .eq("id", input.id);
}

async function upsertStripeEntitlement(
  supabase: ServiceClient,
  input: {
    eventId: string;
    entitlement: StripeInvoicePaidEntitlement;
  },
): Promise<EntitlementWriteResult> {
  const entitlementPayload = {
    account_id: input.entitlement.accountId,
    plan_key: input.entitlement.plan_key,
    plan_name_snapshot: input.entitlement.planNameSnapshot,
    origin: "plano_pago_confirmado",
    status: "ativo",
    starts_at: input.entitlement.startsAt,
    confirmed_at: input.entitlement.confirmedAt,
    expires_at: input.entitlement.expiresAt,
    canceled_at: null,
    external_provider: "stripe",
    external_reference: input.entitlement.subscriptionId,
    idempotency_key: input.eventId,
    metadata_json: input.entitlement.metadataJson,
  };

  const { data: existingEntitlement, error: existingError } = await supabase
    .from("account_commercial_entitlements")
    .select("id")
    .eq("external_provider", "stripe")
    .eq("external_reference", input.entitlement.subscriptionId)
    .maybeSingle();

  if (existingError) {
    return { ok: false, reason: existingError.code ?? "entitlement_lookup_failed" };
  }

  if (typeof existingEntitlement?.id === "string") {
    const { data, error } = await supabase
      .from("account_commercial_entitlements")
      .update(entitlementPayload)
      .eq("id", existingEntitlement.id)
      .select("id")
      .single();

    if (error) return { ok: false, reason: error.code ?? "entitlement_update_failed" };
    return typeof data?.id === "string"
      ? { ok: true, entitlementId: data.id }
      : { ok: false, reason: "missing_entitlement_id" };
  }

  const { data, error } = await supabase
    .from("account_commercial_entitlements")
    .insert(entitlementPayload)
    .select("id")
    .single();

  if (error) return { ok: false, reason: error.code ?? "entitlement_insert_failed" };
  return typeof data?.id === "string"
    ? { ok: true, entitlementId: data.id }
    : { ok: false, reason: "missing_entitlement_id" };
}

function buildStripeWebhookEventMetadata(
  stripeEvent: StripeWebhookEvent,
): Record<string, string | boolean | null> {
  const object = normalizeRecord(stripeEvent.data?.object);
  return {
    stripe_event_id: stripeEvent.id,
    stripe_event_type: stripeEvent.type,
    stripe_object_id: readString(object, "id"),
    stripe_object_type: readString(object, "object"),
    livemode: stripeEvent.livemode ?? null,
  };
}

function stripeWebhookResponse(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function logStripeWebhook(
  level: "info" | "warn" | "error",
  payload: Record<string, unknown>,
) {
  const entry = {
    scope: "stripe_webhook",
    ts: new Date().toISOString(),
    ...payload,
  };

  if (level === "info") {
    console.log(JSON.stringify(entry));
    return;
  }
  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }
  console.error(JSON.stringify(entry));
}

function normalizeRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(
  source: Record<string, unknown> | null,
  property: string,
): string | null {
  const value = source?.[property];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

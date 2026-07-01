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
      action: "process";
      id: string;
      duplicate: false;
    }
  | {
      ok: true;
      action: "duplicate_final";
      duplicate: true;
      processingStatus: "processed" | "ignored";
    }
  | {
      ok: false;
      reason: string;
      status: number;
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

type MarkStripeWebhookEventResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };

const STALE_PROCESSING_RETRY_AFTER_MS = 10 * 60 * 1000;

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

    return stripeWebhookResponse(
      { ok: false, error: registered.reason },
      registered.status,
    );
  }

  if (registered.action === "duplicate_final") {
    logStripeWebhook("info", {
      event: "stripe_webhook_duplicated",
      provider: "stripe",
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      processing_status: registered.processingStatus,
      result: "already_final",
    });

    return stripeWebhookResponse({ ok: true, duplicate: true }, 200);
  }

  if (stripeEvent.type !== "invoice.paid") {
    const markedIgnored = await markStripeWebhookEvent(supabase, {
      id: registered.id,
      processingStatus: "ignored",
      metadataJson: {
        ...buildStripeWebhookEventMetadata(stripeEvent),
        ignored_reason: "future_scope",
      },
    });

    if (!markedIgnored.ok) {
      logStripeWebhook("error", {
        event: "stripe_webhook_failed",
        provider: "stripe",
        stripe_event_id: stripeEvent.id,
        stripe_event_type: stripeEvent.type,
        result: "event_mark_ignored_failed",
        reason: markedIgnored.reason,
      });

      return stripeWebhookResponse({ ok: false, error: "event_mark_failed" }, 500);
    }

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
    const markedFailed = await markStripeWebhookEvent(supabase, {
      id: registered.id,
      processingStatus: "failed",
      errorCode: normalized.reason,
      metadataJson: buildStripeWebhookEventMetadata(stripeEvent),
    });

    if (!markedFailed.ok) {
      logStripeWebhook("error", {
        event: "stripe_webhook_failed",
        provider: "stripe",
        stripe_event_id: stripeEvent.id,
        stripe_event_type: stripeEvent.type,
        result: "event_mark_failed_failed",
        reason: markedFailed.reason,
      });

      return stripeWebhookResponse({ ok: false, error: "event_mark_failed" }, 500);
    }

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
    const markedFailed = await markStripeWebhookEvent(supabase, {
      id: registered.id,
      processingStatus: "failed",
      accountId: normalized.entitlement.accountId,
      externalReference: normalized.entitlement.subscriptionId,
      errorCode: entitlementWrite.reason,
      metadataJson: normalized.entitlement.metadataJson,
    });

    if (!markedFailed.ok) {
      logStripeWebhook("error", {
        event: "stripe_webhook_failed",
        provider: "stripe",
        stripe_event_id: stripeEvent.id,
        stripe_event_type: stripeEvent.type,
        account_id: normalized.entitlement.accountId,
        status: "ativo",
        result: "event_mark_failed_failed",
        reason: markedFailed.reason,
      });

      return stripeWebhookResponse({ ok: false, error: "event_mark_failed" }, 500);
    }

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

  const markedProcessed = await markStripeWebhookEvent(supabase, {
    id: registered.id,
    processingStatus: "processed",
    accountId: normalized.entitlement.accountId,
    entitlementId: entitlementWrite.entitlementId,
    externalReference: normalized.entitlement.subscriptionId,
    metadataJson: normalized.entitlement.metadataJson,
  });

  if (!markedProcessed.ok) {
    logStripeWebhook("error", {
      event: "stripe_webhook_failed",
      provider: "stripe",
      stripe_event_id: stripeEvent.id,
      stripe_event_type: stripeEvent.type,
      account_id: normalized.entitlement.accountId,
      status: "ativo",
      result: "event_mark_processed_failed",
      reason: markedProcessed.reason,
    });

    return stripeWebhookResponse({ ok: false, error: "event_mark_failed" }, 500);
  }

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
      return resolveExistingStripeWebhookEvent(supabase, stripeEvent);
    }
    return { ok: false, reason: error.code ?? "insert_failed", status: 500 };
  }

  const id = typeof data?.id === "string" ? data.id : null;
  if (!id) {
    return { ok: false, reason: "missing_event_record_id", status: 500 };
  }

  return { ok: true, action: "process", duplicate: false, id };
}

async function resolveExistingStripeWebhookEvent(
  supabase: ServiceClient,
  stripeEvent: StripeWebhookEvent,
): Promise<StripeWebhookEventRecord> {
  const { data, error } = await supabase
    .from("stripe_webhook_events")
    .select("id, processing_status, updated_at, received_at")
    .eq("event_id", stripeEvent.id)
    .single();

  if (error) {
    return {
      ok: false,
      reason: error.code ?? "event_lookup_failed",
      status: 500,
    };
  }

  const id = typeof data?.id === "string" ? data.id : null;
  const processingStatus =
    typeof data?.processing_status === "string"
      ? data.processing_status
      : null;
  const lastTouchedAt = normalizeTimestamp(data?.updated_at ?? data?.received_at);

  if (!id || !processingStatus) {
    return { ok: false, reason: "event_record_incomplete", status: 500 };
  }

  if (processingStatus === "processed" || processingStatus === "ignored") {
    return {
      ok: true,
      action: "duplicate_final",
      duplicate: true,
      processingStatus,
    };
  }

  if (processingStatus === "failed") {
    const reset = await resetFailedStripeWebhookEventForRetry(supabase, {
      id,
      stripeEvent,
      retryReason: "previous_failed",
    });
    if (!reset.ok) {
      return { ok: false, reason: reset.reason, status: 500 };
    }
    return { ok: true, action: "process", duplicate: false, id };
  }

  if (processingStatus === "processing") {
    if (isStaleProcessingEvent(lastTouchedAt)) {
      const reset = await resetFailedStripeWebhookEventForRetry(supabase, {
        id,
        stripeEvent,
        retryReason: "stale_processing",
      });
      if (!reset.ok) {
        return { ok: false, reason: reset.reason, status: 500 };
      }
      return { ok: true, action: "process", duplicate: false, id };
    }

    return {
      ok: false,
      reason: "event_processing_in_progress",
      status: 409,
    };
  }

  return { ok: false, reason: "event_status_unknown", status: 500 };
}

async function resetFailedStripeWebhookEventForRetry(
  supabase: ServiceClient,
  input: {
    id: string;
    stripeEvent: StripeWebhookEvent;
    retryReason: "previous_failed" | "stale_processing";
  },
): Promise<MarkStripeWebhookEventResult> {
  const { data, error } = await supabase
    .from("stripe_webhook_events")
    .update({
      processing_status: "processing",
      account_id: null,
      entitlement_id: null,
      external_reference: null,
      error_code: null,
      metadata_json: {
        ...buildStripeWebhookEventMetadata(input.stripeEvent),
        retry_reason: input.retryReason,
      },
      processed_at: null,
    })
    .eq("id", input.id)
    .in("processing_status", ["failed", "processing"])
    .select("id")
    .single();

  if (error) {
    return { ok: false, reason: error.code ?? "event_retry_reset_failed" };
  }

  return typeof data?.id === "string"
    ? { ok: true }
    : { ok: false, reason: "event_retry_reset_missing_id" };
}

function normalizeTimestamp(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isStaleProcessingEvent(lastTouchedAt: number | null): boolean {
  if (lastTouchedAt === null) return false;
  return Date.now() - lastTouchedAt > STALE_PROCESSING_RETRY_AFTER_MS;
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
): Promise<MarkStripeWebhookEventResult> {
  const { data, error } = await supabase
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
    .eq("id", input.id)
    .select("id")
    .single();

  if (error) {
    return { ok: false, reason: error.code ?? "event_mark_failed" };
  }

  return typeof data?.id === "string"
    ? { ok: true }
    : { ok: false, reason: "event_mark_missing_id" };
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

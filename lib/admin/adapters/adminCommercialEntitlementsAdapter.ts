import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

const PLAN_NAME_SNAPSHOT = {
  starter: "Starter",
  lite: "Lite",
  pro: "Pro",
  ultra: "Ultra",
} as const;

const MANUAL_SOURCE_SURFACE = "admin_account_detail";

type ManualPlanKey = keyof typeof PLAN_NAME_SNAPSHOT;

type GrantManualEntitlementInput = {
  accountId: string;
  planKey: string;
  manualReason: string;
  expiresAt?: string | null;
  operatorUserId: string;
};

type CancelManualEntitlementInput = {
  accountId: string;
  manualReason: string;
  operatorUserId: string;
};

type AdminCommercialEntitlementResult =
  | { ok: true; entitlementId: string; operation: "created" | "updated" | "canceled" }
  | { ok: false; reason: AdminCommercialEntitlementFailureReason };

type AdminCommercialEntitlementFailureReason =
  | "invalid_account_id"
  | "account_not_found"
  | "account_not_active"
  | "invalid_plan_key"
  | "invalid_manual_reason"
  | "invalid_expires_at"
  | "conflicting_effective_entitlement"
  | "entitlement_lookup_failed"
  | "entitlement_insert_failed"
  | "entitlement_update_failed"
  | "missing_entitlement_id"
  | "manual_entitlement_not_found"
  | "duplicate_manual_entitlement";

export type AdminManualCommercialEntitlementState = {
  id: string;
  planKey: string;
  planNameSnapshot: string;
  status: string;
  startsAt: string | null;
  confirmedAt: string | null;
  expiresAt: string | null;
  canceledAt: string | null;
  updatedAt: string | null;
} | null;

export async function getAdminManualCommercialEntitlementState(
  accountId: string,
): Promise<AdminManualCommercialEntitlementState> {
  if (!isUuid(accountId)) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("account_commercial_entitlements")
    .select("id,plan_key,plan_name_snapshot,status,starts_at,confirmed_at,expires_at,canceled_at,updated_at")
    .eq("account_id", accountId)
    .eq("origin", "liberacao_manual")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    planKey: data.plan_key,
    planNameSnapshot: data.plan_name_snapshot,
    status: data.status,
    startsAt: data.starts_at,
    confirmedAt: data.confirmed_at,
    expiresAt: data.expires_at,
    canceledAt: data.canceled_at,
    updatedAt: data.updated_at,
  };
}

export async function grantAdminManualCommercialEntitlement(
  input: GrantManualEntitlementInput,
): Promise<AdminCommercialEntitlementResult> {
  const accountId = input.accountId.trim();
  if (!isUuid(accountId)) return { ok: false, reason: "invalid_account_id" };

  const planKey = normalizePlanKey(input.planKey);
  if (!planKey) return { ok: false, reason: "invalid_plan_key" };

  const manualReason = normalizeManualReason(input.manualReason);
  if (!manualReason) return { ok: false, reason: "invalid_manual_reason" };

  const now = new Date();
  const startsAt = now.toISOString();
  const confirmedAt = startsAt;
  const expiresAtInput = normalizeExpiresAt(input.expiresAt, now);
  if (expiresAtInput === "invalid") return { ok: false, reason: "invalid_expires_at" };

  const supabase = createServiceClient();
  const accountState = await readAccountState(supabase, accountId);
  if (!accountState.ok) return { ok: false, reason: accountState.reason };

  const conflict = await readEffectiveEntitlementConflict(supabase, accountId);
  if (!conflict.ok) return { ok: false, reason: conflict.reason };
  if (conflict.hasConflict) {
    return { ok: false, reason: "conflicting_effective_entitlement" };
  }

  const existingManual = await readActiveManualEntitlement(supabase, accountId);
  if (!existingManual.ok) return { ok: false, reason: existingManual.reason };

  const expiresAt = expiresAtInput ?? existingManual.expiresAt ?? null;

  const payload = {
    account_id: accountId,
    plan_key: planKey,
    plan_name_snapshot: PLAN_NAME_SNAPSHOT[planKey],
    origin: "liberacao_manual",
    status: "ativo",
    starts_at: startsAt,
    confirmed_at: confirmedAt,
    expires_at: expiresAt,
    canceled_at: null,
    external_provider: null,
    external_reference: null,
    idempotency_key: null,
    metadata_json: {
      manual_reason: manualReason,
      granted_by_user_id: input.operatorUserId,
      granted_at: confirmedAt,
      source_surface: MANUAL_SOURCE_SURFACE,
      operation: "grant_manual_entitlement",
    },
  };

  if (existingManual.entitlementId) {
    let updateQuery: any = supabase
      .from("account_commercial_entitlements")
      .update(payload)
      .eq("id", existingManual.entitlementId)
      .select("id");

    if (typeof updateQuery?.maxAffected === "function") {
      updateQuery = updateQuery.maxAffected(1);
    }

    const { data, error } = await updateQuery.single();

    if (error) return { ok: false, reason: "entitlement_update_failed" };
    return typeof data?.id === "string"
      ? { ok: true, entitlementId: data.id, operation: "updated" }
      : { ok: false, reason: "missing_entitlement_id" };
  }

  const { data, error } = await supabase
    .from("account_commercial_entitlements")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { ok: false, reason: "entitlement_insert_failed" };
  if (typeof data?.id !== "string") return { ok: false, reason: "missing_entitlement_id" };

  const postInsertManual = await readActiveManualEntitlement(supabase, accountId);
  if (!postInsertManual.ok) {
    if (postInsertManual.reason === "duplicate_manual_entitlement") {
      await cancelManualEntitlementById({
        supabase,
        entitlementId: data.id,
        operatorUserId: input.operatorUserId,
        manualReason: "duplicate_manual_entitlement_detected",
      });
    }

    return { ok: false, reason: postInsertManual.reason };
  }
  if (postInsertManual.entitlementId !== data.id) {
    await cancelManualEntitlementById({
      supabase,
      entitlementId: data.id,
      operatorUserId: input.operatorUserId,
      manualReason: "duplicate_manual_entitlement_detected",
    });
    return { ok: false, reason: "duplicate_manual_entitlement" };
  }

  return { ok: true, entitlementId: data.id, operation: "created" };
}

export async function cancelAdminManualCommercialEntitlement(
  input: CancelManualEntitlementInput,
): Promise<AdminCommercialEntitlementResult> {
  const accountId = input.accountId.trim();
  if (!isUuid(accountId)) return { ok: false, reason: "invalid_account_id" };

  const manualReason = normalizeManualReason(input.manualReason);
  if (!manualReason) return { ok: false, reason: "invalid_manual_reason" };

  const supabase = createServiceClient();
  const accountState = await readAccountState(supabase, accountId);
  if (!accountState.ok) return { ok: false, reason: accountState.reason };

  const existingManual = await readActiveManualEntitlement(supabase, accountId);
  if (!existingManual.ok) return { ok: false, reason: existingManual.reason };
  if (!existingManual.entitlementId) {
    return { ok: false, reason: "manual_entitlement_not_found" };
  }

  const canceledAt = new Date().toISOString();
  let updateQuery: any = supabase
    .from("account_commercial_entitlements")
    .update({
      status: "cancelado",
      canceled_at: canceledAt,
      metadata_json: {
        manual_reason: manualReason,
        canceled_by_user_id: input.operatorUserId,
        canceled_at: canceledAt,
        source_surface: MANUAL_SOURCE_SURFACE,
        operation: "cancel_manual_entitlement",
      },
    })
    .eq("id", existingManual.entitlementId)
    .select("id");

  if (typeof updateQuery?.maxAffected === "function") {
    updateQuery = updateQuery.maxAffected(1);
  }

  const { data, error } = await updateQuery.single();

  if (error) return { ok: false, reason: "entitlement_update_failed" };
  return typeof data?.id === "string"
    ? { ok: true, entitlementId: data.id, operation: "canceled" }
    : { ok: false, reason: "missing_entitlement_id" };
}

async function cancelManualEntitlementById(input: {
  supabase: ReturnType<typeof createServiceClient>;
  entitlementId: string;
  operatorUserId: string;
  manualReason: string;
}) {
  const canceledAt = new Date().toISOString();
  let updateQuery: any = input.supabase
    .from("account_commercial_entitlements")
    .update({
      status: "cancelado",
      canceled_at: canceledAt,
      metadata_json: {
        manual_reason: input.manualReason,
        canceled_by_user_id: input.operatorUserId,
        canceled_at: canceledAt,
        source_surface: MANUAL_SOURCE_SURFACE,
        operation: "cancel_manual_entitlement",
      },
    })
    .eq("id", input.entitlementId);

  if (typeof updateQuery?.maxAffected === "function") {
    updateQuery = updateQuery.maxAffected(1);
  }

  await updateQuery;
}

function normalizePlanKey(value: string): ManualPlanKey | null {
  const planKey = value.trim().toLowerCase();
  return planKey in PLAN_NAME_SNAPSHOT ? (planKey as ManualPlanKey) : null;
}

function normalizeManualReason(value: string) {
  const reason = value.trim();
  if (!reason) return null;
  return reason.slice(0, 500);
}

function normalizeExpiresAt(value: string | null | undefined, now: Date) {
  const raw = value?.trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "invalid";
  if (parsed.getTime() <= now.getTime()) return "invalid";
  return parsed.toISOString();
}

async function readAccountState(
  supabase: ReturnType<typeof createServiceClient>,
  accountId: string,
): Promise<
  | { ok: true }
  | { ok: false; reason: Extract<AdminCommercialEntitlementFailureReason, "account_not_found" | "account_not_active"> }
> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id,status")
    .eq("id", accountId)
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "account_not_found" };
  if (data.status !== "active") return { ok: false, reason: "account_not_active" };
  return { ok: true };
}

async function readEffectiveEntitlementConflict(
  supabase: ReturnType<typeof createServiceClient>,
  accountId: string,
): Promise<
  | { ok: true; hasConflict: boolean }
  | { ok: false; reason: Extract<AdminCommercialEntitlementFailureReason, "entitlement_lookup_failed"> }
> {
  const { data, error } = await supabase
    .from("v_account_commercial_entitlement_effective")
    .select("origin,is_commercially_eligible")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) return { ok: false, reason: "entitlement_lookup_failed" };

  return {
    ok: true,
    hasConflict:
      data?.is_commercially_eligible === true &&
      (data.origin === "plano_pago_confirmado" || data.origin === "trial"),
  };
}

async function readActiveManualEntitlement(
  supabase: ReturnType<typeof createServiceClient>,
  accountId: string,
): Promise<
  | { ok: true; entitlementId: string | null; expiresAt: string | null }
  | {
      ok: false;
      reason: Extract<
        AdminCommercialEntitlementFailureReason,
        "entitlement_lookup_failed" | "duplicate_manual_entitlement"
      >;
    }
> {
  const { data, error } = await supabase
    .from("account_commercial_entitlements")
    .select("id,expires_at")
    .eq("account_id", accountId)
    .eq("origin", "liberacao_manual")
    .eq("status", "ativo")
    .order("updated_at", { ascending: false })
    .limit(2);

  if (error) return { ok: false, reason: "entitlement_lookup_failed" };
  const rows = Array.isArray(data) ? data : [];
  if (rows.length > 1) return { ok: false, reason: "duplicate_manual_entitlement" };

  const row = rows[0];
  return {
    ok: true,
    entitlementId: typeof row?.id === "string" ? row.id : null,
    expiresAt: typeof row?.expires_at === "string" ? row.expires_at : null,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

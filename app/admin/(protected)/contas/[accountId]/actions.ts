"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/access/guards";
import {
  cancelAdminManualCommercialEntitlement,
  grantAdminManualCommercialEntitlement,
} from "@/lib/admin/adapters/adminCommercialEntitlementsAdapter";
import { createClient } from "@/lib/supabase/server";

export async function grantManualCommercialEntitlementAction(formData: FormData) {
  const gate = await requirePlatformAdmin();
  const accountId = String(formData.get("accountId") ?? "").trim();
  const targetPath = getAccountPath(accountId);

  if (!gate.allowed) {
    redirect(gate.redirect === "/auth/login" ? "/auth/login?next=%2Fadmin%2Fcontas" : "/auth/confirm/info");
  }

  const operatorUserId = await readCurrentUserId();
  if (!operatorUserId) {
    redirect(`${targetPath}?manual_entitlement=unauthorized`);
  }

  const result = await grantAdminManualCommercialEntitlement({
    accountId,
    planKey: String(formData.get("planKey") ?? ""),
    expiresAt: String(formData.get("expiresAt") ?? ""),
    manualReason: String(formData.get("manualReason") ?? ""),
    operatorUserId,
  });

  revalidatePath(targetPath);

  if (!result.ok) {
    redirect(`${targetPath}?manual_entitlement=${encodeURIComponent(result.reason)}`);
  }

  redirect(`${targetPath}?manual_entitlement=${result.operation}`);
}

export async function cancelManualCommercialEntitlementAction(formData: FormData) {
  const gate = await requirePlatformAdmin();
  const accountId = String(formData.get("accountId") ?? "").trim();
  const targetPath = getAccountPath(accountId);

  if (!gate.allowed) {
    redirect(gate.redirect === "/auth/login" ? "/auth/login?next=%2Fadmin%2Fcontas" : "/auth/confirm/info");
  }

  const operatorUserId = await readCurrentUserId();
  if (!operatorUserId) {
    redirect(`${targetPath}?manual_entitlement=unauthorized`);
  }

  const result = await cancelAdminManualCommercialEntitlement({
    accountId,
    manualReason: String(formData.get("cancelReason") ?? ""),
    operatorUserId,
  });

  revalidatePath(targetPath);

  if (!result.ok) {
    redirect(`${targetPath}?manual_entitlement=${encodeURIComponent(result.reason)}`);
  }

  redirect(`${targetPath}?manual_entitlement=canceled`);
}

async function readCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

function getAccountPath(accountId: string) {
  return accountId
    ? `/admin/contas/${encodeURIComponent(accountId)}`
    : "/admin/contas";
}

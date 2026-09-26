import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  NO_COMMERCIAL_ENTITLEMENT_SIGNAL,
  type CommercialEntitlementSignal,
  type GetCommercialEntitlementSignalInput,
} from "../contracts";

type CommercialEntitlementEffectiveRow = {
  is_commercially_eligible: boolean | null;
  effective_status: string | null;
  plan_key: string | null;
};

export async function getCommercialEntitlementSignal(
  input: GetCommercialEntitlementSignalInput,
): Promise<CommercialEntitlementSignal> {
  const result = await readCommercialEntitlementSignal(input);
  return result.ok ? result.signal : NO_COMMERCIAL_ENTITLEMENT_SIGNAL;
}

export type CommercialEntitlementReadResult =
  | Readonly<{ ok: true; signal: CommercialEntitlementSignal }>
  | Readonly<{ ok: false }>;

export async function readCommercialEntitlementSignal(
  input: GetCommercialEntitlementSignalInput,
): Promise<CommercialEntitlementReadResult> {
  const accountId = input.accountId.trim();
  if (!accountId) return { ok: true, signal: NO_COMMERCIAL_ENTITLEMENT_SIGNAL };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("v_account_commercial_entitlement_effective")
      .select("is_commercially_eligible,effective_status,plan_key")
      .eq("account_id", accountId)
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false };
    if (!data) return { ok: true, signal: NO_COMMERCIAL_ENTITLEMENT_SIGNAL };

    const row = data as CommercialEntitlementEffectiveRow;

    return { ok: true, signal: {
      isCommerciallyEligible: row.is_commercially_eligible === true,
      effectiveStatus: typeof row.effective_status === "string" ? row.effective_status : null,
      planKey: typeof row.plan_key === "string" ? row.plan_key : null,
    } };
  } catch {
    return { ok: false };
  }
}

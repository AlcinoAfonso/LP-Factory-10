// src/lib/access/plan.ts
import { createServerClient } from "../supabase/server";
import type * as Access from "./types";
import {
  mapEffectiveLimitsFromDB,
  toLegacyLimits,
  type DBEffectiveLimitsRow,
} from "./adapters";

export async function fetchPlanAndLimits(
  account_id: string
): Promise<{ plan: Access.PlanInfo; limits: Access.Limits }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .rpc<DBEffectiveLimitsRow>("get_account_effective_limits", { p_account_id: account_id })
    .single();

  if (error || !data) {
    throw new Error(`get_account_effective_limits failed: ${error?.message ?? "no data"}`);
  }

  const mapped = mapEffectiveLimitsFromDB(data);
  const plan: Access.PlanInfo = { id: mapped.plan.id, name: mapped.plan.name };
  const limits: Access.Limits = toLegacyLimits(mapped.limits);

  return { plan, limits };
}

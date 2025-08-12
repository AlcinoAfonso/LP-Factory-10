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

  const { data, error } = await supabase.rpc(
    "get_account_effective_limits",
    { p_account_id: account_id }
  );

  if (error) {
    throw new Error(`get_account_effective_limits failed: ${error.message}`);
  }

  // A RPC pode retornar 1 objeto ou 1 array com 1 linha
  const row = (Array.isArray(data) ? data[0] : data) as unknown as DBEffectiveLimitsRow | undefined;
  if (!row) throw new Error("get_account_effective_limits returned no rows");

  const mapped = mapEffectiveLimitsFromDB(row);
  const plan: Access.PlanInfo = { id: mapped.plan.id, name: mapped.plan.name };
  const limits: Access.Limits = toLegacyLimits(mapped.limits);

  return { plan, limits };
}

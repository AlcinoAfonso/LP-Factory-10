// src/lib/access/plan.ts
import { createServerClient } from "../supabase/server";
import type * as Access from "./types";
import {
  mapEffectiveLimitsFromDB,
  toLegacyLimits,
  type DBEffectiveLimitsRow,
} from "./adapters/planAdapter";

/** Lê plano/limites efetivos via RPC `get_account_effective_limits` (RLS ON). */
export async function fetchPlanAndLimits(
  account_id: string
): Promise<{ plan: Access.PlanInfo; limits: Access.Limits }> {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc(
    "get_account_effective_limits",
    { p_account_id: account_id }
  );

  if (error) throw new Error(`get_account_effective_limits failed: ${error.message}`);

  // Pode vir objeto ou array de uma linha
  const row = (Array.isArray(data) ? data[0] : data) as unknown as DBEffectiveLimitsRow | undefined;
  if (!row) throw new Error("get_account_effective_limits returned no rows");

  const mapped = mapEffectiveLimitsFromDB(row);

  // Respeita o shape atual de Access.PlanInfo e Access.Limits (legado snake_case)
  const plan: Access.PlanInfo = { id: mapped.plan.id, name: mapped.plan.name };
  const limits: Access.Limits = toLegacyLimits(mapped.limits);

  return { plan, limits };
}

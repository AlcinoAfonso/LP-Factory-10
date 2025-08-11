// src/lib/access/plan.ts
import { createServerClient } from "../supabase/server";
import type {
  Limits as AccessLimits,
  PlanInfo as AccessPlanInfo,
} from "./types";

/** Lê plano e limites efetivos via RPC `get_account_effective_limits` (RLS ON). */
export async function fetchPlanAndLimits(
  account_id: string
): Promise<{ plan: AccessPlanInfo; limits: AccessLimits }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .rpc("get_account_effective_limits", { p_account_id: account_id })
    .single();

  if (error) {
    throw new Error(`get_account_effective_limits failed: ${error.message}`);
  }

  const plan: AccessPlanInfo = {
    id: data.plan_id,
    name: data.plan_name,
    priceMonthly: data.price_monthly ?? null,
    features: data.plan_features ?? {},
  };

  const limits: AccessLimits = {
    maxLPs: Number(data.max_lps_effective ?? 0),
    maxConversions: Number(data.max_conversions_effective ?? 0),
    unlimitedLPs: !!data.max_lps_unlimited,
    unlimitedConversions: !!data.max_conversions_unlimited,
  };

  return { plan, limits };
}

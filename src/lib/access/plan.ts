// src/lib/access/plan.ts
import { createServerClient } from "../supabase/server";
import type { Limits, PlanInfo } from "./types";

/**
 * Lê plano e limites efetivos da conta via RPC `get_account_effective_limits`.
 * Fonte única: Supabase (RLS ON). Sem dados vindos do client.
 */
export async function fetchPlanAndLimits(
  account_id: string
): Promise<{ plan: PlanInfo; limits: Limits }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .rpc("get_account_effective_limits", { p_account_id: account_id })
    .single();

  if (error) {
    throw new Error(`get_account_effective_limits failed: ${error.message}`);
  }

  const plan: PlanInfo = {
    id: data.plan_id,
    name: data.plan_name,
    priceMonthly: data.price_monthly ?? null,
    features: data.plan_features ?? {},
  };

  const limits: Limits = {
    maxLPs: Number(data.max_lps_effective ?? 0),
    maxConversions: Number(data.max_conversions_effective ?? 0),
    unlimitedLPs: !!data.max_lps_unlimited,
    unlimitedConversions: !!data.max_conversions_unlimited,
  };

  return { plan, limits };
}
import type { Limits, PlanInfo } from './types';

/**
 * Contrato para obter plano e limites (fonte única = Supabase view/RPC).
 * Implementação real virá depois. Aqui é apenas assinatura.
 */
export async function fetchPlanAndLimits(
  _account_id: string,
): Promise<{ plan: PlanInfo; limits: Limits }> {
  // TODO: chamar view/RPC no Supabase (RLS ON)
  throw new Error('fetchPlanAndLimits() não implementado.');
}

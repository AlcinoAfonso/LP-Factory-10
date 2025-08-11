// src/lib/access/plan.ts
import { createServerClient } from "../supabase/server";
import type * as Access from "./types";

/** Lê plano/limites efetivos via RPC `get_account_effective_limits` (RLS ON). */
export async function fetchPlanAndLimits(
  account_id: string
): Promise<{ plan: Access.PlanInfo; limits: Access.Limits }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .rpc("get_account_effective_limits", { p_account_id: account_id })
    .single();

  if (error) {
    throw new Error(`get_account_effective_limits failed: ${error.message}`);
  }

  // Respeita seu PlanInfo (apenas id e name)
  const plan: Access.PlanInfo = {
    id: data.plan_id,
    name: data.plan_name,
  };

  // Respeita seu Limits (snake_case e campos obrigatórios)
  const limits: Access.Limits = {
    max_lps: Number(data.max_lps_effective ?? data.max_lps ?? 0),
    max_conversions: Number(
      data.max_conversions_effective ?? data.max_conversions ?? 0
    ),
    // A view não expõe max_domains; tentamos ler de plan_features, senão default seguro
    max_domains: Number(
      (data.plan_features?.max_domains as number | undefined) ?? 1
    ),

    // Extras aceitos pelo index signature (boolean|number):
    max_lps_unlimited: !!data.max_lps_unlimited,
    max_conversions_unlimited: !!data.max_conversions_unlimited,
  };

  return { plan, limits };
}

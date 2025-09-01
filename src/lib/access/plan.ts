import { createServer } from "@/lib/supabase/server";
import type * as Access from "./types";

/** Identificadores canônicos dos planos (alinhados ao banco). */
export type PlanId = "free" | "light" | "pro" | "ultra";

/**
 * Mapeamento temporário: PlanId ↔ Stripe Price ID
 * ⚠️ Fonte de verdade será a tabela plan_price_map (Stripe Sync 10).
 */
const PLAN_PRICE_MAP: Record<PlanId, string> = {
  free: "price_free_placeholder",
  light: "price_light_placeholder",
  pro: "price_pro_placeholder",
  ultra: "price_ultra_placeholder",
};

/** Retorna o Stripe Price ID de um planId (ou undefined se não existir). */
export function mapPlanIdToStripePrice(planId: PlanId): string | undefined {
  return PLAN_PRICE_MAP[planId];
}

/** Linha retornada pela RPC `get_account_effective_limits` */
export type DBEffectiveLimitsRow = {
  plan_id: string;
  plan_name: string;
  price_monthly: number | null;
  plan_features: Record<string, unknown> | null;
  max_lps: number | null;
  max_conversions: number | null;
  max_lps_unlimited: boolean | null;
  max_conversions_unlimited: boolean | null;
  max_lps_effective: number | null;
  max_conversions_effective: number | null;
};

/** DB (snake_case) → TS (camelCase) interno */
function mapEffectiveLimitsFromDB(row: DBEffectiveLimitsRow): {
  plan: {
    id: string;
    name: string;
    priceMonthly?: number | null;
    features?: Record<string, unknown> | null;
  };
  limits: {
    maxLPs: number;
    maxConversions: number;
    unlimitedLPs: boolean;
    unlimitedConversions: boolean;
    maxDomains?: number;
  };
} {
  const features = row.plan_features ?? null;
  const maxDomains =
    features && typeof (features as any).max_domains === "number"
      ? (features as any).max_domains
      : undefined;

  return {
    plan: {
      id: row.plan_id,
      name: row.plan_name,
      priceMonthly: row.price_monthly ?? null,
      features,
    },
    limits: {
      maxLPs: Number(row.max_lps_effective ?? row.max_lps ?? 0),
      maxConversions: Number(row.max_conversions_effective ?? row.max_conversions ?? 0),
      unlimitedLPs: Boolean(row.max_lps_unlimited ?? false),
      unlimitedConversions: Boolean(row.max_conversions_unlimited ?? false),
      maxDomains,
    },
  };
}

/** Compat: camelCase → shape legado (snake_case) esperado por Access.Limits atual */
function toLegacyLimits(l: {
  maxLPs: number;
  maxConversions: number;
  unlimitedLPs: boolean;
  unlimitedConversions: boolean;
  maxDomains?: number;
}): Access.Limits {
  return {
    max_lps: l.maxLPs,
    max_conversions: l.maxConversions,
    max_domains: l.maxDomains ?? 1,
    max_lps_unlimited: l.unlimitedLPs,
    max_conversions_unlimited: l.unlimitedConversions,
  };
}

/** Lê plano/limites efetivos via RPC `get_account_effective_limits` (RLS ON). */
export async function fetchPlanAndLimits(
  account_id: string
): Promise<{ plan: Access.PlanInfo; limits: Access.Limits }> {
  const supabase = createServer();

  const { data, error } = await supabase.rpc("get_account_effective_limits", {
    p_account_id: account_id,
  });
  if (error) throw new Error(`get_account_effective_limits failed: ${error.message}`);

  // Pode vir objeto ou array de uma linha
  const row = (Array.isArray(data) ? data[0] : data) as unknown as
    | DBEffectiveLimitsRow
    | undefined;
  if (!row) throw new Error("get_account_effective_limits returned no rows");

  const mapped = mapEffectiveLimitsFromDB(row);

  // Respeita o shape atual de Access.PlanInfo e Access.Limits (legado snake_case)
  const plan: Access.PlanInfo = { id: mapped.plan.id, name: mapped.plan.name };
  const limits: Access.Limits = toLegacyLimits(mapped.limits);

  return { plan, limits };
}

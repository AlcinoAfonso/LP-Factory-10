// src/lib/access/adapters/planAdapter.ts

// Linha retornada pela RPC `get_account_effective_limits`
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

// DB (snake_case) → TS (camelCase) interno do adapter
export function mapEffectiveLimitsFromDB(row: DBEffectiveLimitsRow): {
  plan: { id: string; name: string; priceMonthly?: number | null; features?: Record<string, unknown> | null };
  limits: { maxLPs: number; maxConversions: number; unlimitedLPs: boolean; unlimitedConversions: boolean; maxDomains?: number };
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

// Compat: camelCase → shape legado (snake_case) esperado por Access.Limits atual
export function toLegacyLimits(l: {
  maxLPs: number;
  maxConversions: number;
  unlimitedLPs: boolean;
  unlimitedConversions: boolean;
  maxDomains?: number;
}) {
  return {
    max_lps: l.maxLPs,
    max_conversions: l.maxConversions,
    max_domains: l.maxDomains ?? 1,
    max_lps_unlimited: l.unlimitedLPs,
    max_conversions_unlimited: l.unlimitedConversions,
  };
}

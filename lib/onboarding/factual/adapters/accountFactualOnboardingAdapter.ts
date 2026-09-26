import "server-only";

import { getAccessContext } from "@/lib/access/getAccessContext";
import { getUserEmail } from "@/lib/auth/authAdapter";
import { getCommercialEntitlementSignal } from "../../../commercial-entitlements";
import { createServiceClient } from "@/lib/supabase/service";
import { readFactualCoverageForTaxon } from "../../../conversion-content/adapters/factualFieldsAdapter";
import { getActivePrimaryAccountTaxon } from "../../niche-resolution/adapters/accountTaxonomyAdapter";
import { assessFactualCoverage, buildFactualProfileWrite, canEditFactualValues, hasSupportedFactualCatalog, isFactualReady, supportedFactualFieldKeys, type FactualValues } from "../policy";

export type AvailableFactualOnboarding = Readonly<{
  status: "available";
  accountId: string;
  accountSubdomain: string;
  email: string;
  taxonName: string;
  canEdit: boolean;
  creciApplicable: boolean;
  professionalCredentialApplicable: boolean;
  values: FactualValues;
  isReady: boolean;
}>;

export type FactualOnboardingLoad = AvailableFactualOnboarding | Readonly<{ status: "unavailable" }>;

type ProfileRow = {
  business_display_name: string | null;
  whatsapp: string | null;
  creci_registration: string | null;
  professional_regulatory_credential: string | null;
};

export async function loadFactualOnboarding(accountSubdomain: string): Promise<FactualOnboardingLoad> {
  try { return await readFactualOnboarding(accountSubdomain); }
  catch (error) {
    console.error("E10.10 factual read failed", { kind: error instanceof Error ? error.name : "unknown" });
    return { status: "unavailable" };
  }
}

async function readFactualOnboarding(accountSubdomain: string): Promise<FactualOnboardingLoad> {
  const slug = accountSubdomain.trim().toLowerCase();
  if (!slug || slug === "home") return { status: "unavailable" };

  const ctx = await getAccessContext({ params: { account: slug }, route: `/a/${slug}` });
  if (!ctx || ctx.blocked || ctx.account?.status !== "active" || ctx.status !== "active") {
    return { status: "unavailable" };
  }
  const accountId = ctx.account?.id ?? ctx.account_id;
  if (!accountId || !["owner", "admin", "editor", "viewer"].includes(ctx.role)) {
    return { status: "unavailable" };
  }

  const [entitlement, taxon, email] = await Promise.all([
    getCommercialEntitlementSignal({ accountId }),
    getActivePrimaryAccountTaxon({ accountId }),
    getUserEmail(),
  ]);
  if (!entitlement.isCommerciallyEligible || !taxon || !email) return { status: "unavailable" };

  const activeCatalog = await createServiceClient()
    .from("taxon_factual_fields")
    .select("field_key,definition")
    .eq("is_active", true)
    .in("field_key", [...supportedFactualFieldKeys]);
  if (activeCatalog.error || !hasSupportedFactualCatalog(activeCatalog.data)) {
    return { status: "unavailable" };
  }

  const coverage = await readFactualCoverageForTaxon(taxon.taxonId);
  if (!coverage.ok) return { status: "unavailable" };
  const assessed = assessFactualCoverage(coverage.value);
  if (!assessed.ok) return { status: "unavailable" };

  const { data, error } = await createServiceClient()
    .from("account_profiles")
    .select("business_display_name,whatsapp,creci_registration,professional_regulatory_credential")
    .eq("account_id", accountId)
    .maybeSingle();
  if (error) {
    console.error("E10.10 factual profile read failed", { code: error.code });
    return { status: "unavailable" };
  }
  const profile = data as ProfileRow | null;
  const values: FactualValues = {
    businessDisplayName: profile?.business_display_name ?? null,
    whatsapp: profile?.whatsapp ?? null,
    creciRegistration: profile?.creci_registration ?? null,
    professionalRegulatoryCredential: profile?.professional_regulatory_credential ?? null,
  };
  return {
    status: "available",
    accountId,
    accountSubdomain: slug,
    email,
    taxonName: taxon.name,
    canEdit: canEditFactualValues(ctx.role),
    creciApplicable: assessed.creciApplicable,
    professionalCredentialApplicable: assessed.professionalCredentialApplicable,
    values,
    isReady: isFactualReady(values),
  };
}

export async function saveFactualProfile(input: Readonly<{
  accountId: string;
  values: FactualValues;
  creciApplicable: boolean;
  professionalCredentialApplicable: boolean;
}>): Promise<boolean> {
  try { return await writeFactualProfile(input); }
  catch (error) {
    console.error("E10.10 factual write failed", { kind: error instanceof Error ? error.name : "unknown" });
    return false;
  }
}

async function writeFactualProfile(input: Readonly<{
  accountId: string;
  values: FactualValues;
  creciApplicable: boolean;
  professionalCredentialApplicable: boolean;
}>): Promise<boolean> {
  const payload = buildFactualProfileWrite(input.accountId, input.values, input.creciApplicable, input.professionalCredentialApplicable);
  const { account_id: accountId, ...changes } = payload;
  const supabase = createServiceClient();
  const updateExisting = async () => supabase
    .from("account_profiles")
    .update(changes)
    .eq("account_id", accountId)
    .select("account_id")
    .maybeSingle();

  const updated = await updateExisting();
  if (updated.error) {
    console.error("E10.10 factual profile update failed", { code: updated.error.code });
    return false;
  }
  if (updated.data) return true;

  const inserted = await supabase.from("account_profiles").insert(payload);
  if (!inserted.error) return true;
  if (inserted.error.code !== "23505") {
    console.error("E10.10 factual profile insert failed", { code: inserted.error.code });
    return false;
  }

  const retried = await updateExisting();
  if (retried.error) console.error("E10.10 factual profile retry failed", { code: retried.error.code });
  return !retried.error && Boolean(retried.data);
}

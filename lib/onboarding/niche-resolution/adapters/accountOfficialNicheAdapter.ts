import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { readActivePrimaryAccountTaxon } from "./accountTaxonomyAdapter";
import { validNicheDescription, type OfficialAccountNiche } from "../official-niche-policy";
export type OfficialNicheRead = { ok: true; niche: OfficialAccountNiche | null } | { ok: false };
export async function readAccountOfficialNiche(accountId: string): Promise<OfficialNicheRead> {
  try {
      const { data, error } = await createServiceClient().from("account_official_niches")
        .select("description,revision,confirmed_at,confirmed_by").eq("account_id", accountId).maybeSingle();
      if (error) return { ok: false };
      if (data) {
        const revision = Number(data.revision);
        if (!validNicheDescription(data.description) || !Number.isSafeInteger(revision) || revision < 1) return { ok: false };
        return { ok: true, niche: { name: data.description, revision: "text:" + revision,
          textRevision: revision, confirmed: true, confirmedAt: data.confirmed_at,
          confirmedBy: data.confirmed_by, taxonId: null, legacyUpdatedAt: null } };
      }
    const legacy = await readActivePrimaryAccountTaxon({ accountId });
    if (!legacy.ok) return { ok: false };
    return { ok: true, niche: legacy.taxon ? {
      ...legacy.taxon, revision: "legacy:" + legacy.taxon.taxonId + ":" + legacy.taxon.revision,
      textRevision: 0, legacyUpdatedAt: legacy.taxon.revision, confirmedBy: null,
    } : null };
  } catch { return { ok: false }; }
}


export async function readOfficialNicheContext(input: { accountId: string }) {
  return readAccountOfficialNiche(input.accountId);
}
export async function getAccountOfficialNiche(input: { accountId: string }) {
  const result = await readAccountOfficialNiche(input.accountId);
  return result.ok ? result.niche : null;
}

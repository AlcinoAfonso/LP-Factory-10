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
export async function confirmOfficialAccountNiche(input: {
  accountId: string; actorUserId: string; description: string; expectedRevision: string | null;
}) {
  if (!validNicheDescription(input.description)) return { ok: false as const, reason: "unavailable" };
  const current = await readAccountOfficialNiche(input.accountId);
  if (!current.ok) return { ok: false as const, reason: "unavailable" };
  if ((current.niche?.revision ?? null) !== input.expectedRevision) return { ok: false as const, reason: "conflict" };
  const { data, error } = await createServiceClient().rpc("confirm_account_official_niche_v1", {
    p_account_id: input.accountId, p_actor_user_id: input.actorUserId, p_description: input.description,
    p_expected_revision: current.niche?.textRevision ?? 0,
    p_expected_legacy_taxon_id: current.niche?.taxonId ?? null,
    p_expected_legacy_updated_at: current.niche?.legacyUpdatedAt ?? null, p_confirmed: true,
  });
  if (error || !Number.isSafeInteger(Number(data)) || Number(data) < 1) return { ok: false as const,
    reason: error?.message === "niche_changed" ? "conflict" : error?.message === "niche_product_exists" ? "product_exists" : "unavailable" };
  return { ok: true as const };
}


export async function readOfficialNicheContext(input: { accountId: string }) {
  return readAccountOfficialNiche(input.accountId);
}
export async function getAccountOfficialNiche(input: { accountId: string }) {
  const result = await readAccountOfficialNiche(input.accountId);
  return result.ok ? result.niche : null;
}

// The active-account flow confirms the server-owned displayed proposal, never client text.
export async function confirmAccountNicheDialogue(input: Readonly<{
  accountId: string; actorUserId: string; dialogueId: string; expectedVersion: number;
}>) {
  const { data, error } = await createServiceClient().rpc("confirm_account_niche_dialogue_v1", {
    p_account_id: input.accountId, p_user_id: input.actorUserId, p_dialogue_id: input.dialogueId,
    p_expected_version: input.expectedVersion, p_confirmed: true,
  });
  if (error || !Number.isSafeInteger(Number(data)) || Number(data)<1) return { ok: false as const,
    reason: error?.message === "niche_product_exists" ? "product_exists" : error?.code === "40001" ? "conflict" : "unavailable" };
  return { ok: true as const };
}

import "server-only";

import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import {
  fingerprintGenerationProfileProposal,
  validateGenerationProfileDraft,
  type AdminGenerationProfile,
  type AdminGenerationProfileListItem,
  type AdminGenerationProfileTaxon,
  type GenerationProfileDraftInput,
  type GenerationProfileLifecycleReadiness,
  type GenerationProfileMutationErrorCode,
  type GenerationProfileMutationResult,
} from "../landing-page/generation-profile";

const PROFILE_SELECT =
  "id,owner_taxon_id,version,status,generation_guidance,created_at,updated_at";
const ITEM_SELECT =
  "profile_id,module_key,module_version,variant_key,variant_version,priority,recommended_order,item_guidance";

export async function listAdminGenerationProfiles(): Promise<
  | Readonly<{ ok: true; items: readonly AdminGenerationProfileListItem[] }>
  | Readonly<{ ok: false; error: string }>
> {
  const supabase = createServiceClient();
  const { data: taxonRows, error: taxonError } = await supabase
    .from("business_taxons")
    .select("id,name,slug,level,parent_id,is_active")
    .in("level", ["segment", "niche"])
    .eq("is_active", true)
    .order("level", { ascending: false })
    .order("name", { ascending: true });
  if (taxonError || !Array.isArray(taxonRows)) {
    return { ok: false, error: "taxon_read_failed" };
  }

  const taxons = taxonRows.map(normalizeTaxon);
  if (taxons.some((taxon) => taxon === null)) {
    return { ok: false, error: "taxon_invalid_data" };
  }
  const validTaxons = taxons as AdminGenerationProfileTaxon[];
  const { data: profileRows, error: profileError } = await supabase
    .from("landing_page_generation_profiles")
    .select(PROFILE_SELECT)
    .in("owner_taxon_id", validTaxons.map((taxon) => taxon.id))
    .order("version", { ascending: false });
  if (profileError || !Array.isArray(profileRows)) {
    return { ok: false, error: "profile_read_failed" };
  }

  return {
    ok: true,
    items: validTaxons.map((taxon) => {
      const profiles = profileRows.filter((row) => row.owner_taxon_id === taxon.id);
      return {
        taxon,
        activeVersion: profiles.find((row) => row.status === "active")?.version ?? null,
        draftVersion: profiles.find((row) => row.status === "draft")?.version ?? null,
        archivedCount: profiles.filter((row) => row.status === "archived").length,
      };
    }),
  };
}

export async function readAdminGenerationProfileDetail(input: {
  taxonId: string;
}): Promise<
  | Readonly<{
      ok: true;
      taxon: AdminGenerationProfileTaxon;
      profiles: readonly AdminGenerationProfile[];
      lastActivatedOwnProfile: AdminGenerationProfile | null;
    }>
  | Readonly<{ ok: false; error: string }>
> {
  if (!z.uuid().safeParse(input.taxonId).success) {
    return { ok: false, error: "invalid_taxon_id" };
  }
  const supabase = createServiceClient();
  const { data: taxonRow, error: taxonError } = await supabase
    .from("business_taxons")
    .select("id,name,slug,level,parent_id,is_active")
    .eq("id", input.taxonId)
    .in("level", ["segment", "niche"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const taxon = normalizeTaxon(taxonRow);
  if (taxonError || !taxon) return { ok: false, error: "taxon_not_found" };

  const { data: profileRows, error: profileError } = await supabase
    .from("landing_page_generation_profiles")
    .select(PROFILE_SELECT)
    .eq("owner_taxon_id", input.taxonId)
    .order("version", { ascending: false });
  if (profileError || !Array.isArray(profileRows)) {
    return { ok: false, error: "profile_read_failed" };
  }
  const profileIds = profileRows.map((row) => row.id);
  const itemResult = profileIds.length === 0
    ? { data: [], error: null }
    : await supabase
        .from("landing_page_generation_profile_items")
        .select(ITEM_SELECT)
        .in("profile_id", profileIds)
        .order("recommended_order", { ascending: true });
  if (itemResult.error || !Array.isArray(itemResult.data)) {
    return { ok: false, error: "profile_item_read_failed" };
  }

  const profiles = profileRows.map((row) => normalizeAdminProfile(row, itemResult.data));
  if (profiles.some((profile) => profile === null)) {
    return { ok: false, error: "profile_invalid_data" };
  }
  const validProfiles = profiles as AdminGenerationProfile[];
  const activeProfile = validProfiles.find((profile) => profile.status === "active") ?? null;
  let lastActivatedOwnProfile = activeProfile;
  if (!activeProfile && profileIds.length > 0) {
    const { data: auditRow, error: auditError } = await supabase
      .from("audit_logs")
      .select("record_id")
      .eq("event", "generation_profile_activated")
      .in("record_id", profileIds)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (auditError) return { ok: false, error: "profile_history_read_failed" };
    if (auditRow?.record_id) {
      lastActivatedOwnProfile = validProfiles.find((profile) => profile.id === auditRow.record_id) ?? null;
    }
  }
  return { ok: true, taxon, profiles: validProfiles, lastActivatedOwnProfile };
}

export async function readAdminGenerationProfileLifecycleReadiness(): Promise<GenerationProfileLifecycleReadiness> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_landing_page_generation_profile_lifecycle_status");
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !isRecord(row) || row.ready !== true) {
    return {
      ready: false,
      reason: "Lifecycle indisponivel ate a migration e o verificador read-only serem aprovados.",
    };
  }
  return { ready: true, reason: "Lifecycle verificado e disponivel." };
}

export async function saveAdminGenerationProfileDraft(
  input: GenerationProfileDraftInput,
): Promise<GenerationProfileMutationResult> {
  const validated = validateGenerationProfileDraft(input);
  if (!validated.ok) return mutationFailure("invalid_data", validated.message);
  const lifecycle = await readAdminGenerationProfileLifecycleReadiness();
  if (!lifecycle.ready) return mutationFailure("lifecycle_unavailable", lifecycle.reason);

  const reviewResult = validated.value.requestId && validated.value.proposalFingerprint
    ? fingerprintGenerationProfileProposal(validated.value) === validated.value.proposalFingerprint
      ? "accepted"
      : "adjusted"
    : null;
  return callMutationRpc("save_landing_page_generation_profile_draft", {
    p_owner_taxon_id: validated.value.ownerTaxonId,
    p_profile_id: validated.value.profileId ?? null,
    p_expected_updated_at: validated.value.expectedUpdatedAt ?? null,
    p_generation_guidance: validated.value.generationGuidance,
    p_items: validated.value.recommendations.map(toRpcRecommendation),
    p_origin: validated.value.origin,
    p_request_id: validated.value.requestId ?? null,
    p_review_result: reviewResult,
  });
}

export async function activateAdminGenerationProfile(input: {
  taxonId: string;
  profileId: string;
  expectedUpdatedAt: string;
}): Promise<GenerationProfileMutationResult> {
  if (!z.uuid().safeParse(input.taxonId).success || !z.uuid().safeParse(input.profileId).success || !z.iso.datetime({ offset: true }).safeParse(input.expectedUpdatedAt).success) {
    return mutationFailure("invalid_data", "Activation input is invalid.");
  }
  const lifecycle = await readAdminGenerationProfileLifecycleReadiness();
  if (!lifecycle.ready) return mutationFailure("lifecycle_unavailable", lifecycle.reason);
  const detail = await readAdminGenerationProfileDetail({ taxonId: input.taxonId });
  if (!detail.ok) return mutationFailure("technical_failure", "Draft could not be validated before activation.");
  const draft = detail.profiles.find((profile) => profile.id === input.profileId);
  if (!draft || draft.status !== "draft" || draft.updatedAt !== input.expectedUpdatedAt) {
    return mutationFailure("stale_snapshot", "Draft snapshot changed before activation.");
  }
  const validated = validateGenerationProfileDraft({
    ownerTaxonId: input.taxonId,
    profileId: draft.id,
    expectedUpdatedAt: draft.updatedAt,
    generationGuidance: draft.generationGuidance,
    recommendations: draft.recommendations,
    origin: "manual",
  });
  if (!validated.ok) return mutationFailure("invalid_data", validated.message);
  return callMutationRpc("activate_landing_page_generation_profile", {
    p_profile_id: input.profileId,
    p_expected_updated_at: input.expectedUpdatedAt,
  });
}

export async function archiveAdminGenerationProfile(input: {
  profileId: string;
  expectedUpdatedAt: string;
}): Promise<GenerationProfileMutationResult> {
  if (!z.uuid().safeParse(input.profileId).success || !z.iso.datetime({ offset: true }).safeParse(input.expectedUpdatedAt).success) {
    return mutationFailure("invalid_data", "Archive input is invalid.");
  }
  const lifecycle = await readAdminGenerationProfileLifecycleReadiness();
  if (!lifecycle.ready) return mutationFailure("lifecycle_unavailable", lifecycle.reason);
  return callMutationRpc("archive_landing_page_generation_profile", {
    p_profile_id: input.profileId,
    p_expected_updated_at: input.expectedUpdatedAt,
  });
}

async function callMutationRpc(
  rpc: string,
  args: Record<string, unknown>,
): Promise<GenerationProfileMutationResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(rpc, args);
  if (error) return mapRpcError(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!isRecord(row) || typeof row.profile_id !== "string" || !Number.isInteger(row.version) || typeof row.updated_at !== "string") {
    return mutationFailure("technical_failure", "Lifecycle RPC returned an invalid result.");
  }
  return {
    ok: true,
    profileId: row.profile_id,
    version: row.version as number,
    updatedAt: row.updated_at,
  };
}

function mapRpcError(message: string): GenerationProfileMutationResult {
  const mappings: readonly [string, GenerationProfileMutationErrorCode][] = [
    ["E12_4_3_UNAUTHORIZED", "unauthorized"],
    ["E12_4_3_NOT_FOUND", "not_found"],
    ["E12_4_3_STALE_SNAPSHOT", "stale_snapshot"],
    ["E12_4_3_INVALID_STATE", "invalid_state"],
    ["E12_4_3_INVALID_INPUT", "invalid_data"],
  ];
  const match = mappings.find(([marker]) => message.includes(marker));
  if (match) return mutationFailure(match[1], message);
  if (/schema cache|function .* does not exist|PGRST202/i.test(message)) {
    return mutationFailure("lifecycle_unavailable", "Generation profile lifecycle is not available yet.");
  }
  if (/permission denied|insufficient privilege|42501/i.test(message)) {
    return mutationFailure("lifecycle_unavailable", "Generation profile lifecycle permissions are unavailable.");
  }
  return mutationFailure("technical_failure", "Generation profile mutation failed.");
}

function mutationFailure(code: GenerationProfileMutationErrorCode, message: string): GenerationProfileMutationResult {
  return { ok: false, error: { code, message } };
}

function toRpcRecommendation(item: GenerationProfileDraftInput["recommendations"][number]) {
  return {
    module_key: item.moduleKey,
    module_version: item.moduleVersion,
    variant_key: item.variantKey ?? null,
    variant_version: item.variantVersion ?? null,
    priority: item.priority,
    recommended_order: item.recommendedOrder,
    item_guidance: item.itemGuidance ?? null,
  };
}

function normalizeTaxon(value: unknown): AdminGenerationProfileTaxon | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" || typeof value.slug !== "string" || !["segment", "niche"].includes(String(value.level)) || (value.parent_id !== null && typeof value.parent_id !== "string")) return null;
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    level: value.level as AdminGenerationProfileTaxon["level"],
    parentId: value.parent_id as string | null,
  };
}

function normalizeAdminProfile(value: unknown, itemRows: unknown[]): AdminGenerationProfile | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.owner_taxon_id !== "string" || !Number.isInteger(value.version) || !["draft", "active", "archived"].includes(String(value.status)) || typeof value.generation_guidance !== "string" || typeof value.created_at !== "string" || typeof value.updated_at !== "string") return null;
  const recommendations = itemRows
    .filter((row) => isRecord(row) && row.profile_id === value.id)
    .map(normalizeRecommendation);
  if (recommendations.some((item) => item === null)) return null;
  return {
    id: value.id,
    ownerTaxonId: value.owner_taxon_id,
    version: value.version as number,
    status: value.status as AdminGenerationProfile["status"],
    generationGuidance: value.generation_guidance,
    recommendations: recommendations as AdminGenerationProfile["recommendations"],
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function normalizeRecommendation(value: unknown): AdminGenerationProfile["recommendations"][number] | null {
  if (!isRecord(value) || typeof value.module_key !== "string" || !Number.isInteger(value.module_version) || typeof value.priority !== "string" || !Number.isInteger(value.recommended_order)) return null;
  if ((value.variant_key === null) !== (value.variant_version === null)) return null;
  return {
    moduleKey: value.module_key,
    moduleVersion: value.module_version as number,
    ...(value.variant_key === null ? {} : { variantKey: String(value.variant_key), variantVersion: value.variant_version as number }),
    priority: value.priority as AdminGenerationProfile["recommendations"][number]["priority"],
    recommendedOrder: value.recommended_order as number,
    ...(value.item_guidance === null ? {} : { itemGuidance: String(value.item_guidance) }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import "server-only";

import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { normalizeLandingPageGenerationProfileItemRow } from "./landingPageGenerationProfileRowNormalization";
import type { LandingPageResearchResolutionResult } from "../landing-page/research-resolution";
import {
  composeAdminGenerationProfileListItem,
  fingerprintGenerationProfileProposal,
  normalizeGenerationProfileLifecycleReadiness,
  resolveLandingPageGenerationProfile,
  validateGenerationProfileDraft,
  type AdminGenerationProfile,
  type AdminGenerationProfileListItem,
  type AdminGenerationProfileTaxon,
  type GenerationProfileDraftInput,
  type GenerationProfileLifecycleReadiness,
  type GenerationProfileMutationErrorCode,
  type GenerationProfileMutationResult,
  type LandingPageGenerationProfile,
  type LandingPageGenerationProfileItem,
  type LandingPageGenerationProfileTaxonNode,
} from "../landing-page/generation-profile";

const PROFILE_SELECT =
  "id,owner_taxon_id,version,status,generation_guidance,created_at,updated_at";
const ITEM_SELECT =
  "id,profile_id,module_key,module_version,variant_key,variant_version,priority,recommended_order,item_guidance";

type ProfileTaxonSource = Readonly<{
  taxon: AdminGenerationProfileTaxon;
  isActive: boolean;
}>;

export async function listAdminGenerationProfiles(): Promise<
  | Readonly<{ ok: true; items: readonly AdminGenerationProfileListItem[] }>
  | Readonly<{ ok: false; error: string }>
> {
  const result = await readAdminGenerationProfileSummaries();
  return result.ok
    ? {
        ok: true,
        items: result.items.filter(
          (item) => item.taxon.level === "segment" || item.taxon.level === "niche",
        ),
      }
    : result;
}

export async function readAdminGenerationProfileSummaries(): Promise<
  | Readonly<{ ok: true; items: readonly AdminGenerationProfileListItem[] }>
  | Readonly<{ ok: false; error: string }>
> {
  const supabase = createServiceClient();
  const { data: taxonRows, error: taxonError } = await supabase
    .from("business_taxons")
    .select("id,name,slug,level,parent_id,is_active")
    .in("level", ["segment", "niche", "ultra_niche"])
    .order("level", { ascending: false })
    .order("name", { ascending: true });
  if (taxonError || !Array.isArray(taxonRows)) {
    return { ok: false, error: "taxon_read_failed" };
  }

  const taxonSources = taxonRows.map(normalizeProfileTaxonSource);
  if (taxonSources.some((taxon) => taxon === null)) {
    return { ok: false, error: "taxon_invalid_data" };
  }
  const validTaxonSources = taxonSources as ProfileTaxonSource[];
  const activeTaxons = validTaxonSources
    .filter((source) => source.isActive)
    .map((source) => source.taxon);
  if (validTaxonSources.length === 0) return { ok: true, items: [] };

  const { data: profileRows, error: profileError } = await supabase
    .from("landing_page_generation_profiles")
    .select(PROFILE_SELECT)
    .in("owner_taxon_id", validTaxonSources.map((source) => source.taxon.id))
    .order("version", { ascending: false });
  if (profileError || !Array.isArray(profileRows)) {
    return { ok: false, error: "profile_read_failed" };
  }

  const activeProfileIds = profileRows
    .filter((row) => row.status === "active")
    .map((row) => row.id);
  const itemResult = activeProfileIds.length === 0
    ? { data: [], error: null }
    : await supabase
        .from("landing_page_generation_profile_items")
        .select(ITEM_SELECT)
        .in("profile_id", activeProfileIds)
        .order("recommended_order", { ascending: true });
  if (itemResult.error || !Array.isArray(itemResult.data)) {
    return { ok: false, error: "profile_item_read_failed" };
  }

  const activeProfiles = profileRows
    .filter((row) => row.status === "active")
    .map((row) => normalizeResolvedProfile(row, itemResult.data));
  if (activeProfiles.some((profile) => profile === null)) {
    return { ok: false, error: "profile_invalid_data" };
  }

  const taxonSourceById = new Map(
    validTaxonSources.map((source) => [source.taxon.id, source]),
  );
  const taxonNameById = new Map(
    validTaxonSources.map((source) => [source.taxon.id, source.taxon.name]),
  );

  return {
    ok: true,
    items: activeTaxons.map((taxon) => {
      const profiles = profileRows.filter((row) => row.owner_taxon_id === taxon.id);
      const draftVersion = profiles.find((row) => row.status === "draft")?.version ?? null;
      const taxonChain = buildProfileTaxonChain(taxon.id, taxonSourceById);
      const resolved = resolveLandingPageGenerationProfile({
        taxonChain: {
          servedTaxonId: taxon.id,
          nodes: taxonChain,
        },
        profiles: (activeProfiles as LandingPageGenerationProfile[]).filter((profile) =>
          taxonChain.some((node) => node.taxonId === profile.ownerTaxonId),
        ),
      });

      const resolvedProfile = resolved.ok && resolved.value.kind === "resolved"
        ? resolved.value
        : null;

      return composeAdminGenerationProfileListItem({
        taxon,
        draftVersion,
        resolved: {
          state: !resolved.ok
            ? "unavailable"
            : resolved.value.kind === "absent"
              ? "absent"
              : resolved.value.relation === "own"
                ? "active_own"
                : "active_inherited",
          activeVersion: resolvedProfile?.profileVersion ?? null,
          ownerTaxonId: resolvedProfile?.ownerTaxonId ?? null,
          ownerTaxonName: resolvedProfile
            ? taxonNameById.get(resolvedProfile.ownerTaxonId) ?? null
            : null,
        },
      });
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
  const auditResult = profileIds.length === 0
    ? { data: [], error: null }
    : await supabase
        .from("audit_logs")
        .select("record_id,changes_json,created_at,id")
        .eq("event", "generation_profile_draft_saved")
        .in("record_id", profileIds)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
  if (auditResult.error || !Array.isArray(auditResult.data)) {
    return { ok: false, error: "profile_audit_read_failed" };
  }

  const profiles = profileRows.map((row) => normalizeAdminProfile(row, itemResult.data, auditResult.data));
  if (profiles.some((profile) => profile === null)) {
    return { ok: false, error: "profile_invalid_data" };
  }
  return { ok: true, taxon, profiles: profiles as AdminGenerationProfile[] };
}

export async function readAdminGenerationProfileLifecycleReadiness(): Promise<GenerationProfileLifecycleReadiness> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_landing_page_generation_profile_lifecycle_status");
  const row = Array.isArray(data) ? data[0] : data;
  return error ? normalizeGenerationProfileLifecycleReadiness(null) : normalizeGenerationProfileLifecycleReadiness(row);
}

export function getGenerationProfileAssistanceAvailability(input: {
  aiConfigured: boolean;
  research: LandingPageResearchResolutionResult | undefined;
}) {
  if (!input.aiConfigured) {
    return {
      available: false as const,
      reason: "Assistência por IA não configurada. O fluxo manual continua disponível.",
    };
  }
  if (!input.research) {
    return {
      available: false as const,
      reason: "Assistência indisponível: pesquisa E10.8 não comprovada.",
    };
  }
  if (!input.research.ok) {
    const incomplete =
      input.research.error.code === "RESEARCH_INCOMPLETE" ||
      input.research.error.code === "RESEARCH_MISSING";
    return {
      available: false as const,
      reason: incomplete
        ? "Assistência indisponível: a pesquisa E10.8 está incompleta."
        : "Assistência indisponível: o preflight E10.8 não pode ser comprovado.",
    };
  }
  return { available: true as const, reason: null };
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
    p_generation_guidance: validated.value.generationGuidance ?? null,
    p_items: validated.value.recommendations.map(toRpcRecommendation),
    p_origin: validated.value.origin,
    p_request_id: validated.value.requestId ?? null,
    p_review_result: reviewResult,
    p_audit_context: {
      gap_item_keys: validated.value.gapItemKeys ?? [],
      ...(validated.value.gapAnalysisCompleted ? {
        gap_analysis_completed: true,
        research_versions: validated.value.researchVersions,
      } : {}),
      ...(validated.value.gapDecision ? {
        gap_decision: validated.value.gapDecision,
        gap_impact_summary: validated.value.gapImpactSummary,
      } : {}),
    },
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
    ...(draft.generationGuidance === undefined ? {} : { generationGuidance: draft.generationGuidance }),
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

function buildProfileTaxonChain(
  servedTaxonId: string,
  taxonSourceById: ReadonlyMap<string, ProfileTaxonSource>,
): LandingPageGenerationProfileTaxonNode[] {
  const nodes: LandingPageGenerationProfileTaxonNode[] = [];
  const visited = new Set<string>();
  let currentTaxonId: string | null = servedTaxonId;

  while (currentTaxonId && nodes.length < 3 && !visited.has(currentTaxonId)) {
    visited.add(currentTaxonId);
    const source = taxonSourceById.get(currentTaxonId);
    if (!source) break;
    nodes.push({
      taxonId: source.taxon.id,
      level: source.taxon.level,
      parentId: source.taxon.parentId,
      status: source.isActive ? "active" : "inactive",
    });
    if (source.taxon.level === "segment") break;
    currentTaxonId = source.taxon.parentId;
  }

  return nodes;
}

function normalizeProfileTaxonSource(value: unknown): ProfileTaxonSource | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    !["segment", "niche", "ultra_niche"].includes(String(value.level)) ||
    (value.parent_id !== null && typeof value.parent_id !== "string") ||
    typeof value.is_active !== "boolean"
  ) {
    return null;
  }

  return {
    taxon: {
      id: value.id,
      name: value.name,
      slug: value.slug,
      level: value.level as AdminGenerationProfileTaxon["level"],
      parentId: value.parent_id as string | null,
    },
    isActive: value.is_active,
  };
}

function normalizeResolvedProfile(
  value: unknown,
  itemRows: unknown[],
): LandingPageGenerationProfile | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.owner_taxon_id !== "string" ||
    !Number.isInteger(value.version) ||
    value.status !== "active" ||
    (value.generation_guidance !== null && typeof value.generation_guidance !== "string")
  ) {
    return null;
  }

  const normalizedItems = itemRows
    .filter((row) => isRecord(row) && row.profile_id === value.id)
    .map(normalizeLandingPageGenerationProfileItemRow);
  if (normalizedItems.some((item) => item === null)) return null;

  return {
    id: value.id,
    ownerTaxonId: value.owner_taxon_id,
    version: value.version as number,
    status: "active",
    ...(value.generation_guidance === null
      ? {}
      : { generationGuidance: value.generation_guidance }),
    items: (normalizedItems as Readonly<{
      profileId: string;
      item: LandingPageGenerationProfileItem;
    }>[]).map(({ item }) => item),
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

function normalizeAdminProfile(value: unknown, itemRows: unknown[], auditRows: unknown[]): AdminGenerationProfile | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.owner_taxon_id !== "string" || !Number.isInteger(value.version) || !["draft", "active", "archived"].includes(String(value.status)) || (value.generation_guidance !== null && typeof value.generation_guidance !== "string") || typeof value.created_at !== "string" || typeof value.updated_at !== "string") return null;
  const recommendations = itemRows
    .filter((row) => isRecord(row) && row.profile_id === value.id)
    .map(normalizeRecommendation);
  if (recommendations.some((item) => item === null)) return null;
  const latestSave = auditRows.find((row) => isRecord(row) && row.record_id === value.id);
  const changes = latestSave && isRecord(latestSave) && isRecord(latestSave.changes_json) ? latestSave.changes_json : null;
  const lastGapDecision = changes?.gap_decision;
  if (lastGapDecision !== undefined && !["wait_for_modules", "proceed_with_available"].includes(String(lastGapDecision))) return null;
  return {
    id: value.id,
    ownerTaxonId: value.owner_taxon_id,
    version: value.version as number,
    status: value.status as AdminGenerationProfile["status"],
    ...(value.generation_guidance === null ? {} : { generationGuidance: value.generation_guidance }),
    recommendations: recommendations as AdminGenerationProfile["recommendations"],
    ...(lastGapDecision === undefined ? {} : { lastGapDecision: lastGapDecision as "wait_for_modules" | "proceed_with_available" }),
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

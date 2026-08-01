import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { normalizeLandingPageGenerationProfileItemRow } from "./landingPageGenerationProfileRowNormalization";
import {
  resolveLandingPageGenerationProfile,
  type LandingPageGenerationProfile,
  type LandingPageGenerationProfileItem,
  type LandingPageGenerationProfileTaxonNode,
  type LoadLandingPageGenerationProfileSourceResult,
  type ResolveLandingPageGenerationProfileResult,
} from "../landing-page/generation-profile";
import {
  landingPageGenerationProfileSchema,
  landingPageGenerationProfileSourceSchema,
  landingPageGenerationProfileTaxonChainSchema,
} from "../landing-page/generation-profile/schema";

export type LandingPageGenerationProfileReadClient = Pick<
  SupabaseClient,
  "from"
>;

export async function loadLandingPageGenerationProfileSourceFromClient(
  input: { taxonId: string },
  supabase: LandingPageGenerationProfileReadClient,
): Promise<LoadLandingPageGenerationProfileSourceResult> {
  const taxonId = input.taxonId.trim();
  if (!z.uuid().safeParse(taxonId).success) {
    return failure("INVALID_TAXON_ID", "Taxon id must be a UUID");
  }

  try {
    const chainResult = await readTaxonChain(supabase, taxonId);
    if (!chainResult.ok) return chainResult;

    const profileResult = await readActiveProfiles(
      supabase,
      chainResult.nodes.map((node) => node.taxonId),
    );
    if (!profileResult.ok) return profileResult;

    const taxonChain = {
      servedTaxonId: taxonId,
      nodes: chainResult.nodes,
    };
    if (!landingPageGenerationProfileTaxonChainSchema.safeParse(taxonChain).success) {
      return failure("INVALID_TAXON_CHAIN", "Generation profile taxon chain is invalid");
    }
    if (
      profileResult.profiles.some(
        (profile) => !landingPageGenerationProfileSchema.safeParse(profile).success,
      )
    ) {
      return failure("INVALID_PROFILE", "Generation profile is invalid");
    }

    const parsed = landingPageGenerationProfileSourceSchema.safeParse({
      taxonChain,
      profiles: profileResult.profiles,
    });

    if (!parsed.success) {
      return failure(
        "INVALID_PROFILE",
        "Generation profile source violates its domain contract",
      );
    }

    return { ok: true, value: deepFreeze(parsed.data) };
  } catch {
    return failure("READ_FAILED", "Generation profile source could not be read");
  }
}

export async function resolveLandingPageGenerationProfileForTaxonFromClient(
  input: { taxonId: string },
  supabase: LandingPageGenerationProfileReadClient,
): Promise<ResolveLandingPageGenerationProfileResult> {
  const source = await loadLandingPageGenerationProfileSourceFromClient(
    input,
    supabase,
  );
  if (!source.ok) return source;
  return resolveLandingPageGenerationProfile(source.value);
}

async function readTaxonChain(
  supabase: LandingPageGenerationProfileReadClient,
  servedTaxonId: string,
): Promise<
  | Readonly<{ ok: true; nodes: LandingPageGenerationProfileTaxonNode[] }>
  | Extract<LoadLandingPageGenerationProfileSourceResult, { ok: false }>
> {
  const nodes: LandingPageGenerationProfileTaxonNode[] = [];
  let currentTaxonId: string | null = servedTaxonId;

  for (let depth = 0; depth < 3 && currentTaxonId; depth += 1) {
    const { data, error } = await supabase
      .from("business_taxons")
      .select("id,parent_id,level,is_active")
      .eq("id", currentTaxonId)
      .limit(1)
      .maybeSingle();

    if (error) return failure("READ_FAILED", "Taxon chain could not be read");
    if (!data) {
      return depth === 0
        ? failure("TAXON_NOT_FOUND", "Served taxon was not found")
        : failure("INVALID_TAXON_CHAIN", "Taxon chain has a missing parent");
    }

    const node = normalizeTaxonNode(data);
    if (!node) {
      return failure("INVALID_TAXON_CHAIN", "Taxon chain contains an invalid node");
    }
    nodes.push(node);

    if (node.level === "segment") break;
    currentTaxonId = node.parentId;
  }

  return { ok: true, nodes };
}

async function readActiveProfiles(
  supabase: LandingPageGenerationProfileReadClient,
  ownerTaxonIds: readonly string[],
): Promise<
  | Readonly<{ ok: true; profiles: LandingPageGenerationProfile[] }>
  | Extract<LoadLandingPageGenerationProfileSourceResult, { ok: false }>
> {
  const { data: profileRows, error: profileError } = await supabase
    .from("landing_page_generation_profiles")
    .select("id,owner_taxon_id,version,status,generation_guidance")
    .in("owner_taxon_id", [...ownerTaxonIds])
    .eq("status", "active")
    .order("owner_taxon_id", { ascending: true })
    .order("version", { ascending: true });

  if (profileError) {
    return failure("READ_FAILED", "Generation profiles could not be read");
  }
  if (!Array.isArray(profileRows)) {
    return failure("INVALID_PROFILE", "Generation profile rows are invalid");
  }

  const normalizedProfiles = profileRows.map(normalizeProfile);
  if (normalizedProfiles.some((profile) => profile === null)) {
    return failure("INVALID_PROFILE", "Generation profile rows are invalid");
  }

  const profiles = normalizedProfiles as Omit<
    LandingPageGenerationProfile,
    "items"
  >[];
  if (profiles.length === 0) return { ok: true, profiles: [] };

  const profileIds = profiles.map((profile) => profile.id);
  const { data: itemRows, error: itemError } = await supabase
    .from("landing_page_generation_profile_items")
    .select(
      "id,profile_id,module_key,module_version,variant_key,variant_version,priority,recommended_order,item_guidance",
    )
    .in("profile_id", profileIds)
    .order("recommended_order", { ascending: true });

  if (itemError) {
    return failure("READ_FAILED", "Generation profile items could not be read");
  }
  if (!Array.isArray(itemRows)) {
    return failure("INVALID_PROFILE", "Generation profile item rows are invalid");
  }

  const normalizedItems = itemRows.map(normalizeLandingPageGenerationProfileItemRow);
  if (normalizedItems.some((item) => item === null)) {
    return failure("INVALID_PROFILE", "Generation profile item rows are invalid");
  }

  const items = normalizedItems as Readonly<{
    profileId: string;
    item: LandingPageGenerationProfileItem;
  }>[];
  if (items.some(({ profileId }) => !profileIds.includes(profileId))) {
    return failure("INVALID_PROFILE", "Generation profile item has no loaded profile");
  }

  return {
    ok: true,
    profiles: profiles.map((profile) => ({
      ...profile,
      items: items
        .filter((candidate) => candidate.profileId === profile.id)
        .map((candidate) => candidate.item),
    })),
  };
}

function normalizeTaxonNode(
  value: unknown,
): LandingPageGenerationProfileTaxonNode | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    !z.uuid().safeParse(value.id).success ||
    (value.parent_id !== null &&
      (typeof value.parent_id !== "string" ||
        !z.uuid().safeParse(value.parent_id).success)) ||
    !["ultra_niche", "niche", "segment"].includes(String(value.level)) ||
    typeof value.is_active !== "boolean"
  ) {
    return null;
  }

  return {
    taxonId: value.id,
    level: value.level as LandingPageGenerationProfileTaxonNode["level"],
    parentId: value.parent_id as string | null,
    status: value.is_active ? "active" : "inactive",
  };
}

function normalizeProfile(
  value: unknown,
): Omit<LandingPageGenerationProfile, "items"> | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.owner_taxon_id !== "string" ||
    !Number.isInteger(value.version) ||
    typeof value.status !== "string" ||
    (value.generation_guidance !== null && typeof value.generation_guidance !== "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    ownerTaxonId: value.owner_taxon_id,
    version: value.version as number,
    status: value.status as LandingPageGenerationProfile["status"],
    ...(value.generation_guidance === null ? {} : { generationGuidance: value.generation_guidance }),
  };
}

function failure(
  code: Extract<LoadLandingPageGenerationProfileSourceResult, { ok: false }>[
    "error"
  ]["code"],
  message: string,
): Extract<LoadLandingPageGenerationProfileSourceResult, { ok: false }> {
  return { ok: false, error: { code, message } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

import "server-only";

import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/service";
import {
  landingPageGenerationProfileSourceSchema,
  type LandingPageGenerationProfile,
  type LandingPageGenerationProfileItem,
  type LandingPageGenerationProfileTaxonNode,
  type LoadLandingPageGenerationProfileSourceResult,
} from "../landing-page/generation-profile";

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function loadLandingPageGenerationProfileSource(input: {
  taxonId: string;
}): Promise<LoadLandingPageGenerationProfileSourceResult> {
  const taxonId = input.taxonId.trim();
  if (!z.uuid().safeParse(taxonId).success) {
    return failure("INVALID_TAXON_ID", "Taxon id must be a UUID");
  }

  const supabase = createServiceClient();

  try {
    const chainResult = await readTaxonChain(supabase, taxonId);
    if (!chainResult.ok) return chainResult;

    const profileResult = await readActiveProfiles(
      supabase,
      chainResult.nodes.map((node) => node.taxonId),
    );
    if (!profileResult.ok) return profileResult;

    const parsed = landingPageGenerationProfileSourceSchema.safeParse({
      taxonChain: {
        servedTaxonId: taxonId,
        nodes: chainResult.nodes,
      },
      profiles: profileResult.profiles,
    });

    if (!parsed.success) {
      return failure(
        "NOT_NORMALIZABLE",
        "Generation profile source violates its domain contract",
      );
    }

    return { ok: true, value: deepFreeze(parsed.data) };
  } catch {
    return failure("READ_FAILED", "Generation profile source could not be read");
  }
}

async function readTaxonChain(
  supabase: ServiceClient,
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
        : failure("NOT_NORMALIZABLE", "Taxon chain has a missing parent");
    }

    const node = normalizeTaxonNode(data);
    if (!node) {
      return failure("NOT_NORMALIZABLE", "Taxon chain contains an invalid node");
    }
    nodes.push(node);

    if (node.level === "segment") break;
    currentTaxonId = node.parentId;
  }

  return { ok: true, nodes };
}

async function readActiveProfiles(
  supabase: ServiceClient,
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
    return failure("NOT_NORMALIZABLE", "Generation profile rows are invalid");
  }

  const normalizedProfiles = profileRows.map(normalizeProfile);
  if (normalizedProfiles.some((profile) => profile === null)) {
    return failure("NOT_NORMALIZABLE", "Generation profile rows are invalid");
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
    return failure("NOT_NORMALIZABLE", "Generation profile item rows are invalid");
  }

  const normalizedItems = itemRows.map(normalizeItem);
  if (normalizedItems.some((item) => item === null)) {
    return failure("NOT_NORMALIZABLE", "Generation profile item rows are invalid");
  }

  const items = normalizedItems as Readonly<{
    profileId: string;
    item: LandingPageGenerationProfileItem;
  }>[];
  if (items.some(({ profileId }) => !profileIds.includes(profileId))) {
    return failure("NOT_NORMALIZABLE", "Generation profile item has no loaded profile");
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
    typeof value.generation_guidance !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    ownerTaxonId: value.owner_taxon_id,
    version: value.version as number,
    status: value.status as LandingPageGenerationProfile["status"],
    generationGuidance: value.generation_guidance,
  };
}

function normalizeItem(
  value: unknown,
): Readonly<{
  profileId: string;
  item: LandingPageGenerationProfileItem;
}> | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.profile_id !== "string" ||
    typeof value.module_key !== "string" ||
    !Number.isInteger(value.module_version) ||
    (value.variant_key !== null && typeof value.variant_key !== "string") ||
    (value.variant_version !== null && !Number.isInteger(value.variant_version)) ||
    typeof value.priority !== "string" ||
    !Number.isInteger(value.recommended_order) ||
    (value.item_guidance !== null && typeof value.item_guidance !== "string")
  ) {
    return null;
  }

  const variant =
    value.variant_key === null || value.variant_version === null
      ? {}
      : {
          variantKey: value.variant_key,
          variantVersion: value.variant_version as number,
        };
  const guidance =
    value.item_guidance === null
      ? {}
      : { itemGuidance: value.item_guidance as string };

  return {
    profileId: value.profile_id,
    item: {
      id: value.id,
      moduleKey: value.module_key,
      moduleVersion: value.module_version as number,
      ...variant,
      priority: value.priority as LandingPageGenerationProfileItem["priority"],
      recommendedOrder: value.recommended_order as number,
      ...guidance,
    },
  };
}

function failure(
  code: Extract<LoadLandingPageGenerationProfileSourceResult, { ok: false }>["error"]["code"],
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

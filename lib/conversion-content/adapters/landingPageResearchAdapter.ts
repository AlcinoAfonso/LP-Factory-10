import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  LANDING_PAGE_RESEARCH_BLOCKS,
  isLandingPageResearchUuid,
  resolveLandingPageResearch,
  type LandingPageResearchItemDto,
  type LandingPageResearchNormalizedSource,
  type LandingPageResearchParentDto,
  type LandingPageResearchResolutionResult,
  type LandingPageResearchTaxonDto,
} from "../landing-page/research-resolution";

const AUDIENCE_SCOPES = ["business_buyer", "end_customer"] as const;
type ServiceClient = ReturnType<typeof createServiceClient>;
type ResearchRowsResult =
  | Readonly<{
      ok: true;
      researches: LandingPageResearchParentDto[];
      items: LandingPageResearchItemDto[];
    }>
  | Readonly<{
      ok: false;
      sourceStatus: "read_failed" | "not_normalizable";
    }>;

export async function resolveLandingPageResearchForTaxon(input: {
  taxonId: string;
  requestId?: string;
}): Promise<LandingPageResearchResolutionResult> {
  const taxonId = input.taxonId.trim();
  if (!isLandingPageResearchUuid(taxonId)) {
    return finishResolution({
      taxonId,
      requestId: input.requestId,
      source: { status: "ready", taxons: [], researches: [], items: [] },
    });
  }

  const supabase = createServiceClient();

  try {
    const { data: servedRow, error: servedError } = await supabase
      .from("business_taxons")
      .select("id,parent_id,is_active")
      .eq("id", taxonId)
      .limit(1)
      .maybeSingle();

    if (servedError) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: { status: "read_failed" },
      });
    }
    if (!servedRow) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: { status: "ready", taxons: [], researches: [], items: [] },
      });
    }

    const servedTaxon = normalizeTaxon(servedRow);
    if (!servedTaxon) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: { status: "not_normalizable" },
      });
    }

    if (!servedTaxon.isActive) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: {
          status: "ready",
          taxons: [servedTaxon],
          researches: [],
          items: [],
        },
      });
    }

    const ownResearch = await readResearchRows(
      supabase,
      servedTaxon.id,
      AUDIENCE_SCOPES,
    );
    if (!ownResearch.ok) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: { status: ownResearch.sourceStatus },
      });
    }

    const ownSource: LandingPageResearchNormalizedSource = {
      status: "ready",
      taxons: [servedTaxon],
      researches: ownResearch.researches,
      items: ownResearch.items,
    };
    const ownResult = resolveLandingPageResearch({ taxonId, source: ownSource });
    if (ownResult.ok || ownResult.error.code !== "DIRECT_PARENT_NOT_FOUND") {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: ownSource,
      });
    }
    if (!servedTaxon.parentId) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: ownSource,
      });
    }

    const { data: parentRow, error: parentError } = await supabase
      .from("business_taxons")
      .select("id,parent_id,is_active")
      .eq("id", servedTaxon.parentId)
      .limit(1)
      .maybeSingle();

    if (parentError) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: { status: "read_failed" },
      });
    }
    if (!parentRow) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: ownSource,
      });
    }

    const parentTaxon = normalizeTaxon(parentRow);
    if (!parentTaxon) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: { status: "not_normalizable" },
      });
    }

    if (!parentTaxon.isActive) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: {
          ...ownSource,
          taxons: [servedTaxon, parentTaxon],
        },
      });
    }

    const parentResearch = await readResearchRows(supabase, parentTaxon.id, [
      "business_buyer",
    ]);
    if (!parentResearch.ok) {
      return finishResolution({
        taxonId,
        requestId: input.requestId,
        source: { status: parentResearch.sourceStatus },
      });
    }

    return finishResolution({
      taxonId,
      requestId: input.requestId,
      source: {
        status: "ready",
        taxons: [servedTaxon, parentTaxon],
        researches: [
          ...ownResearch.researches,
          ...parentResearch.researches,
        ],
        items: [...ownResearch.items, ...parentResearch.items],
      },
    });
  } catch {
    return finishResolution({
      taxonId,
      requestId: input.requestId,
      source: { status: "read_failed" },
    });
  }
}

async function readResearchRows(
  supabase: ServiceClient,
  taxonId: string,
  audienceScopes: readonly (typeof AUDIENCE_SCOPES)[number][],
): Promise<ResearchRowsResult> {
  const { data: researchRows, error: researchError } = await supabase
    .from("taxon_market_research")
    .select("id,taxon_id,research_block,audience_scope,version,status")
    .eq("taxon_id", taxonId)
    .in("research_block", [...LANDING_PAGE_RESEARCH_BLOCKS])
    .in("audience_scope", [...audienceScopes])
    .eq("status", "active");

  if (researchError) return { ok: false, sourceStatus: "read_failed" };

  const researches = normalizeRows(researchRows, normalizeResearch);
  if (!researches) {
    return { ok: false, sourceStatus: "not_normalizable" };
  }

  const researchIds = researches.map((research) => research.id);
  if (researchIds.length === 0) {
    return { ok: true, researches, items: [] };
  }

  const { data: itemRows, error: itemError } = await supabase
    .from("taxon_market_research_items")
    .select("id,research_id,item_key,item_text,priority,sort_order,is_active")
    .in("research_id", researchIds);

  if (itemError) return { ok: false, sourceStatus: "read_failed" };

  const items = normalizeRows(itemRows, normalizeItem);
  if (!items) return { ok: false, sourceStatus: "not_normalizable" };

  return { ok: true, researches, items };
}

function finishResolution(input: {
  taxonId: string;
  requestId?: string;
  source: LandingPageResearchNormalizedSource;
}): LandingPageResearchResolutionResult {
  const result = resolveLandingPageResearch({
    taxonId: input.taxonId,
    source: input.source,
  });

  if (result.ok) {
    logResearchResolution("landing_page_research_resolution_completed", {
      requestId: input.requestId,
      taxonId: result.value.servedTaxonId,
      status: "ok",
      businessBuyerSourceRelation:
        result.value.businessBuyer.sourceRelation,
      businessBuyerSourceTaxonId: result.value.businessBuyer.sourceTaxonId,
      businessBuyerVersion: result.value.businessBuyer.version,
      endCustomerVersion: result.value.endCustomer.version,
    });
  } else {
    logResearchResolution("landing_page_research_resolution_failed", {
      requestId: input.requestId,
      taxonId: isLandingPageResearchUuid(input.taxonId)
        ? input.taxonId
        : null,
      status: "failed",
      errorCode: result.error.code,
      audienceScope: result.error.audienceScope,
      sourceRelation: result.error.sourceRelation,
      sourceTaxonId: result.error.sourceTaxonId,
    });
  }

  return result;
}

function normalizeTaxon(value: unknown): LandingPageResearchTaxonDto | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    !isLandingPageResearchUuid(value.id) ||
    (value.parent_id !== null &&
      (typeof value.parent_id !== "string" ||
        !isLandingPageResearchUuid(value.parent_id))) ||
    typeof value.is_active !== "boolean"
  ) {
    return null;
  }

  return {
    id: value.id,
    parentId: value.parent_id as string | null,
    isActive: value.is_active,
  };
}

function normalizeResearch(
  value: unknown,
): LandingPageResearchParentDto | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    !isLandingPageResearchUuid(value.id) ||
    typeof value.taxon_id !== "string" ||
    !isLandingPageResearchUuid(value.taxon_id) ||
    typeof value.research_block !== "string" ||
    !(LANDING_PAGE_RESEARCH_BLOCKS as readonly string[]).includes(
      value.research_block,
    ) ||
    typeof value.audience_scope !== "string" ||
    !(AUDIENCE_SCOPES as readonly string[]).includes(value.audience_scope) ||
    !Number.isInteger(value.version) ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    taxonId: value.taxon_id,
    researchBlock: value.research_block,
    audienceScope: value.audience_scope,
    version: value.version as number,
    status: value.status,
  };
}

function normalizeItem(value: unknown): LandingPageResearchItemDto | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    !isLandingPageResearchUuid(value.id) ||
    typeof value.research_id !== "string" ||
    !isLandingPageResearchUuid(value.research_id) ||
    (value.item_key !== null && typeof value.item_key !== "string") ||
    (value.item_text !== null && typeof value.item_text !== "string") ||
    (value.priority !== null && !Number.isInteger(value.priority)) ||
    (value.sort_order !== null && !Number.isInteger(value.sort_order)) ||
    typeof value.is_active !== "boolean"
  ) {
    return null;
  }

  return {
    id: value.id,
    researchId: value.research_id,
    itemKey: value.item_key as string | null,
    itemText: value.item_text as string | null,
    priority: value.priority as number | null,
    sortOrder: value.sort_order as number | null,
    isActive: value.is_active,
  };
}

function normalizeRows<T>(
  values: unknown,
  normalize: (value: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(values)) return null;
  const normalized = values.map(normalize);
  return normalized.some((value) => value === null)
    ? null
    : (normalized as T[]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function logResearchResolution(
  event: string,
  details: Readonly<Record<string, unknown>>,
): void {
  const payload = Object.fromEntries(
    Object.entries({ event, ...details }).filter(([, value]) => value !== undefined),
  );
  console.log(JSON.stringify(payload));
}

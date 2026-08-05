import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  LANDING_PAGE_RESEARCH_BLOCKS,
  isLandingPageResearchUuid,
  resolveLandingPageResearch,
  resolveLandingPageResearchBatch,
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
  const results = await resolveLandingPageResearchForTaxons({
    taxonIds: [taxonId],
    requestId: input.requestId,
  });
  return results.get(taxonId) as LandingPageResearchResolutionResult;
}

export async function resolveLandingPageResearchForTaxons(input: {
  taxonIds: readonly string[];
  requestId?: string;
}): Promise<ReadonlyMap<string, LandingPageResearchResolutionResult>> {
  const taxonIds = [...new Set(input.taxonIds.map((taxonId) => taxonId.trim()))];
  const results = new Map<string, LandingPageResearchResolutionResult>();
  const validTaxonIds = taxonIds.filter(isLandingPageResearchUuid);

  for (const taxonId of taxonIds.filter((candidate) => !isLandingPageResearchUuid(candidate))) {
    results.set(
      taxonId,
      finishResolution({
        taxonId,
        requestId: input.requestId,
        source: { status: "ready", taxons: [], researches: [], items: [] },
      }),
    );
  }

  if (validTaxonIds.length === 0) return results;

  const supabase = createServiceClient();

  try {
    const { data: servedRows, error: servedError } = await supabase
      .from("business_taxons")
      .select("id,parent_id,is_active")
      .in("id", validTaxonIds);

    if (servedError) {
      return finishBatchFailure(results, validTaxonIds, input.requestId, "read_failed");
    }

    const servedTaxons = normalizeRows(servedRows, normalizeTaxon);
    if (!servedTaxons) {
      return finishBatchFailure(results, validTaxonIds, input.requestId, "not_normalizable");
    }

    const ownResearch = await readResearchRows(supabase, validTaxonIds, AUDIENCE_SCOPES);
    if (!ownResearch.ok) {
      return finishBatchFailure(results, validTaxonIds, input.requestId, ownResearch.sourceStatus);
    }
    const ownInputs = validTaxonIds.map((taxonId) => {
      const servedTaxon = servedTaxons.find((taxon) => taxon.id === taxonId);
      const researches = ownResearch.researches.filter(
        (candidate) => candidate.taxonId === taxonId,
      );
      const researchIds = new Set(researches.map((candidate) => candidate.id));
      return {
        taxonId,
        source: {
          status: "ready" as const,
          taxons: servedTaxon ? [servedTaxon] : [],
          researches,
          items: ownResearch.items.filter((item) => researchIds.has(item.researchId)),
        },
      };
    });
    const ownResults = resolveLandingPageResearchBatch(ownInputs);
    const pendingParent: Array<{
      taxonId: string;
      servedTaxon: LandingPageResearchTaxonDto;
      source: Extract<LandingPageResearchNormalizedSource, { status: "ready" }>;
    }> = [];
    for (const [index, { taxonId, source }] of ownInputs.entries()) {
      const servedTaxon = servedTaxons.find((taxon) => taxon.id === taxonId);
      const ownResult = ownResults[index];

      if (
        servedTaxon?.parentId &&
        !ownResult.ok &&
        ownResult.error.code === "DIRECT_PARENT_NOT_FOUND"
      ) {
        pendingParent.push({ taxonId, servedTaxon, source });
        continue;
      }

      results.set(
        taxonId,
        finishResolution({
          taxonId,
          requestId: input.requestId,
          source,
        }),
      );
    }

    if (pendingParent.length === 0) return results;

    const parentIds = [...new Set(pendingParent.map(({ servedTaxon }) => servedTaxon.parentId as string))];
    const { data: parentRows, error: parentError } = await supabase
      .from("business_taxons")
      .select("id,parent_id,is_active")
      .in("id", parentIds);
    if (parentError) {
      return finishBatchFailure(
        results,
        pendingParent.map(({ taxonId }) => taxonId),
        input.requestId,
        "read_failed",
      );
    }

    const parentTaxons = normalizeRows(parentRows, normalizeTaxon);
    if (!parentTaxons) {
      return finishBatchFailure(
        results,
        pendingParent.map(({ taxonId }) => taxonId),
        input.requestId,
        "not_normalizable",
      );
    }
    const parentResearch = await readResearchRows(supabase, parentIds, ["business_buyer"]);
    if (!parentResearch.ok) {
      return finishBatchFailure(
        results,
        pendingParent.map(({ taxonId }) => taxonId),
        input.requestId,
        parentResearch.sourceStatus,
      );
    }

    for (const pending of pendingParent) {
      const parentTaxon = parentTaxons.find(
        (taxon) => taxon.id === pending.servedTaxon.parentId,
      );
      const researches = parentResearch.researches.filter(
        (research) => research.taxonId === pending.servedTaxon.parentId,
      );
      const researchIds = new Set(researches.map((research) => research.id));
      results.set(
        pending.taxonId,
        finishResolution({
          taxonId: pending.taxonId,
          requestId: input.requestId,
          source: {
            status: "ready",
            taxons: parentTaxon
              ? [pending.servedTaxon, parentTaxon]
              : [pending.servedTaxon],
            researches: [...pending.source.researches, ...researches],
            items: [
              ...pending.source.items,
              ...parentResearch.items.filter((item) => researchIds.has(item.researchId)),
            ],
          },
        }),
      );
    }

    return results;
  } catch {
    return finishBatchFailure(
      results,
      validTaxonIds.filter((taxonId) => !results.has(taxonId)),
      input.requestId,
      "read_failed",
    );
  }
}

async function readResearchRows(
  supabase: ServiceClient,
  taxonIds: readonly string[],
  audienceScopes: readonly (typeof AUDIENCE_SCOPES)[number][],
): Promise<ResearchRowsResult> {
  const { data: researchRows, error: researchError } = await supabase
    .from("taxon_market_research")
    .select("id,taxon_id,research_block,audience_scope,version,status")
    .in("taxon_id", [...taxonIds])
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

function finishBatchFailure(
  results: Map<string, LandingPageResearchResolutionResult>,
  taxonIds: readonly string[],
  requestId: string | undefined,
  sourceStatus: "read_failed" | "not_normalizable",
) {
  for (const taxonId of taxonIds) {
    results.set(
      taxonId,
      finishResolution({
        taxonId,
        requestId,
        source: { status: sourceStatus },
      }),
    );
  }
  return results;
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

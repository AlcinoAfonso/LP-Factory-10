import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  COMMERCIAL_RESEARCH_BLOCKS,
  type CommercialResearch,
  type CommercialResearchBlock,
  type CommercialResearchCandidate,
  type CommercialResearchItem,
  type CommercialResearchSource,
  type CommercialTaxon,
  type CommercialTemplateResolution,
} from "../contracts";
import {
  createGenericCommercialTemplateResolution,
  resolveCommercialTemplateFromCandidates,
} from "../commercialTemplateResolution";
import { ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_TEMPLATE } from "../templates/accountDashboardCommercialPage";

const MAX_TAXON_HIERARCHY_DEPTH = 10;
const TAXON_LEVELS = new Set<CommercialTaxon["level"]>([
  "segment",
  "niche",
  "ultra_niche",
]);

type TaxonRow = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  level: string;
};

type ResearchRow = {
  id: string;
  taxon_id: string;
  research_block: string;
  version: number;
};

type ResearchItemRow = {
  research_id: string;
  item_key: string;
  item_text: string;
  priority: number;
  sort_order: number;
};

export async function resolveAccountDashboardCommercialTemplate(input: {
  accountId: string;
}): Promise<CommercialTemplateResolution> {
  const accountId = input.accountId.trim();

  if (!accountId) {
    return createGenericCommercialTemplateResolution({
      alerts: ["missing_account_id"],
    });
  }

  try {
    const taxonHierarchy = await getActivePrimaryTaxonHierarchy(accountId);

    if (taxonHierarchy.length === 0) {
      return resolveCommercialTemplateFromCandidates({
        taxonHierarchy,
        researchCandidates: [],
      });
    }

    const researchCandidates = await getCompleteBusinessBuyerResearch(
      taxonHierarchy,
    );

    return resolveCommercialTemplateFromCandidates({
      taxonHierarchy,
      researchCandidates,
    });
  } catch (error) {
    console.error("resolveAccountDashboardCommercialTemplate failed:", {
      code: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : String(error),
    });

    return createGenericCommercialTemplateResolution({
      alerts: ["commercial_template_resolution_failed"],
    });
  }
}

async function getActivePrimaryTaxonHierarchy(
  accountId: string,
): Promise<CommercialTaxon[]> {
  const supabase = createServiceClient();
  const { data: primary, error: primaryError } = await supabase
    .from("account_taxonomy")
    .select("taxon_id")
    .eq("account_id", accountId)
    .eq("is_primary", true)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (primaryError) throw primaryError;

  const primaryTaxonId =
    (primary as { taxon_id?: string | null } | null)?.taxon_id ?? null;
  if (!primaryTaxonId) return [];

  const hierarchy: CommercialTaxon[] = [];
  const visited = new Set<string>();
  let currentTaxonId: string | null = primaryTaxonId;

  while (
    currentTaxonId &&
    hierarchy.length < MAX_TAXON_HIERARCHY_DEPTH &&
    !visited.has(currentTaxonId)
  ) {
    visited.add(currentTaxonId);

    const result: {
      data: TaxonRow | null;
      error: unknown;
    } = await supabase
      .from("business_taxons")
      .select("id,parent_id,name,slug,level")
      .eq("id", currentTaxonId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (result.error) throw result.error;

    const taxon = mapTaxonRow(result.data);
    if (!taxon) break;

    hierarchy.push(taxon);
    currentTaxonId = taxon.parentId;
  }

  return hierarchy;
}

async function getCompleteBusinessBuyerResearch(
  hierarchy: CommercialTaxon[],
): Promise<CommercialResearchCandidate[]> {
  const supabase = createServiceClient();
  const taxonIds = hierarchy.map((taxon) => taxon.taxonId);
  const { data: researchData, error: researchError } = await supabase
    .from("taxon_market_research")
    .select("id,taxon_id,research_block,version")
    .in("taxon_id", taxonIds)
    .eq(
      "audience_scope",
      ACCOUNT_DASHBOARD_COMMERCIAL_PAGE_TEMPLATE.audienceScope,
    )
    .eq("status", "active");

  if (researchError) throw researchError;

  const researchRows = ((researchData ?? []) as ResearchRow[]).filter(
    (row) => isCommercialResearchBlock(row.research_block),
  );
  const latestResearchRows = selectLatestResearchRows(researchRows);

  if (latestResearchRows.length === 0) return [];

  const { data: itemData, error: itemError } = await supabase
    .from("taxon_market_research_items")
    .select("research_id,item_key,item_text,priority,sort_order")
    .in(
      "research_id",
      latestResearchRows.map((row) => row.id),
    )
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("sort_order", { ascending: true });

  if (itemError) throw itemError;

  return groupCompleteResearchByTaxon(
    latestResearchRows,
    (itemData ?? []) as ResearchItemRow[],
  );
}

function selectLatestResearchRows(rows: ResearchRow[]): ResearchRow[] {
  const selected = new Map<string, ResearchRow>();

  for (const row of rows) {
    const key = `${row.taxon_id}:${row.research_block}`;
    const current = selected.get(key);

    if (!current || row.version > current.version) {
      selected.set(key, row);
    }
  }

  return Array.from(selected.values());
}

function groupCompleteResearchByTaxon(
  researchRows: ResearchRow[],
  itemRows: ResearchItemRow[],
): CommercialResearchCandidate[] {
  const researchById = new Map(researchRows.map((row) => [row.id, row]));
  const partialByTaxon = new Map<
    string,
    Partial<Record<CommercialResearchBlock, CommercialResearchItem[]>>
  >();
  const sourcesByTaxon = new Map<string, CommercialResearchSource[]>();

  for (const item of itemRows) {
    const research = researchById.get(item.research_id);

    if (!research || !isCommercialResearchBlock(research.research_block)) {
      continue;
    }

    const partial = partialByTaxon.get(research.taxon_id) ?? {};
    const blockItems = partial[research.research_block] ?? [];
    blockItems.push({
      key: item.item_key,
      text: item.item_text,
      priority: item.priority,
      sortOrder: item.sort_order,
    });
    partial[research.research_block] = blockItems;
    partialByTaxon.set(research.taxon_id, partial);

    const sources = sourcesByTaxon.get(research.taxon_id) ?? [];
    if (!sources.some((source) => source.researchId === research.id)) {
      sources.push({
        researchId: research.id,
        taxonId: research.taxon_id,
        block: research.research_block,
        version: research.version,
      });
      sourcesByTaxon.set(research.taxon_id, sources);
    }
  }

  const candidates: CommercialResearchCandidate[] = [];

  for (const [taxonId, partial] of partialByTaxon) {
    if (
      !COMMERCIAL_RESEARCH_BLOCKS.every(
        (block) => (partial[block]?.length ?? 0) > 0,
      )
    ) {
      continue;
    }

    candidates.push({
      taxonId,
      researchSources: (sourcesByTaxon.get(taxonId) ?? []).sort(
        (left, right) =>
          COMMERCIAL_RESEARCH_BLOCKS.indexOf(left.block) -
          COMMERCIAL_RESEARCH_BLOCKS.indexOf(right.block),
      ),
      research: {
        strategic_core: partial.strategic_core ?? [],
        lp_overview: partial.lp_overview ?? [],
        lp_sections: partial.lp_sections ?? [],
        seo: partial.seo ?? [],
      } satisfies CommercialResearch,
    });
  }

  return candidates;
}

function mapTaxonRow(row: TaxonRow | null): CommercialTaxon | null {
  if (
    !row?.id ||
    !row.name ||
    !row.slug ||
    !TAXON_LEVELS.has(row.level as CommercialTaxon["level"])
  ) {
    return null;
  }

  return {
    taxonId: row.id,
    parentId: row.parent_id,
    name: row.name,
    slug: row.slug,
    level: row.level as CommercialTaxon["level"],
  };
}

function isCommercialResearchBlock(
  value: string,
): value is CommercialResearchBlock {
  return COMMERCIAL_RESEARCH_BLOCKS.includes(
    value as CommercialResearchBlock,
  );
}

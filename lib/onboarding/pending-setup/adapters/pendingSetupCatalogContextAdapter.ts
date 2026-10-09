import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { matchBusinessTaxonsDeterministic } from "../../niche-resolution/adapters/taxonMatchAdapter";
import { activeAncestors, type AttendanceTaxon, type AttendanceMarketContext } from "../attendance-core";
import { redactPotentialContactDetails } from "../policy";

type CatalogRow = { id: string; name: string; level: AttendanceTaxon["level"]; parent_id: string | null; is_active: boolean };
type AliasRow = { id: string; taxon_id: string; alias_text: string };
export async function readAttendanceCatalog(): Promise<readonly AttendanceTaxon[] | null> {
  const service = createServiceClient();
  const taxons: CatalogRow[] = [];
  const aliases: AliasRow[] = [];
  for (let from = 0;; from += 1000) {
    const { data, error } = await service.from("business_taxons").select("id,name,level,parent_id,is_active")
      .eq("is_active", true).order("id").range(from, from + 999);
    if (error || !Array.isArray(data)) return null;
    taxons.push(...data as CatalogRow[]);
    if (data.length < 1000) break;
  }
  for (let from = 0;; from += 1000) {
    const { data, error } = await service.from("business_taxon_aliases").select("id,taxon_id,alias_text")
      .eq("is_active", true).order("id").range(from, from + 999);
    if (error || !Array.isArray(data)) return null;
    aliases.push(...data as AliasRow[]);
    if (data.length < 1000) break;
  }
  const catalog = taxons.map(row => ({
    id: row.id, name: row.name, level: row.level, parentId: row.parent_id, active: row.is_active,
    aliases: aliases.filter(alias => alias.taxon_id === row.id).map(alias => alias.alias_text),
  }));
  // Never silently truncate a catalog used to identify an existing classification.
  return JSON.stringify(catalog).length <= 80_000 ? catalog : null;
}
type ResearchRow = { id: string; taxon_id: string; updated_at: string };
type ItemRow = { research_id: string; item_key: string; item_text: string; notes: string | null };
export function projectAttendanceMarketContext(research: readonly ResearchRow[], items: readonly ItemRow[]): readonly AttendanceMarketContext[] {
  return research.map(row => ({
    taxonId: row.taxon_id, researchId: row.id, version: 1 as const, updatedAt: row.updated_at,
    items: items.filter(item => item.research_id === row.id).map(item => ({
      key: item.item_key, text: redactPotentialContactDetails(item.item_text),
      notes: item.notes ? redactPotentialContactDetails(item.notes) : null,
    })),
  }));
}
export async function readAttendanceMarketContext(query: string, catalog: readonly AttendanceTaxon[], selectedId: string | null) {
  const matched = await matchBusinessTaxonsDeterministic(query.slice(0, 4000), 3);
  if (!matched.ok) return null;
  const ids = [...new Set([selectedId, ...matched.candidates.map(candidate => candidate.taxonId)])]
    .filter((id): id is string => Boolean(id && catalog.some(taxon => taxon.id === id && activeAncestors(taxon, catalog))));
  if (!ids.length) return [];
  const service = createServiceClient();
  const { data: research, error } = await service.from("taxon_market_research")
    .select("id,taxon_id,updated_at").in("taxon_id", ids)
    .eq("research_block", "market_intelligence").eq("audience_scope", "business_buyer")
    .eq("version", 1).eq("status", "active").order("id");
  if (error || !Array.isArray(research)) return null;
  if (!research.length) return [];
  const rows = research as ResearchRow[];
  const { data: items, error: itemError } = await service.from("taxon_market_research_items")
    .select("research_id,item_key,item_text,notes").in("research_id", rows.map(row => row.id))
    .eq("is_active", true).order("research_id").order("sort_order").order("id").limit(121);
  if (itemError || !Array.isArray(items) || items.length > 120) return null;
  const context = projectAttendanceMarketContext(rows, items as ItemRow[]);
  return JSON.stringify(context).length <= 30_000 ? context : null;
}

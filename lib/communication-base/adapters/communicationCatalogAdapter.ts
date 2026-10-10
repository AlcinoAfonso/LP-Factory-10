import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { isCommunicationResourcesEnabled } from "../config";
import { communicationSections, type CommunicationSectionDefinition } from "../registry";
import { parseCommunicationCatalog, type CommunicationCatalogSection, type CommunicationCategory } from "../catalog";
import type { CommunicationBaseResult } from "../contracts";

export async function readCommunicationCatalog(): Promise<CommunicationBaseResult<readonly CommunicationCatalogSection[]>> {
  if (!isCommunicationResourcesEnabled()) return { ok: false, error: "unavailable" };
  try {
    const { data, error } = await createServiceClient().from("communication_base_sections")
      .select("id,section_key,category,format,label,sort_order,updated_at").order("sort_order").limit(151);
    const value = !error ? parseCommunicationCatalog(data) : null;
    return value ? { ok: true, value } : { ok: false, error: "read_failed" };
  } catch { return { ok: false, error: "read_failed" }; }
}
export async function readCommunicationDefinitions(): Promise<CommunicationBaseResult<readonly CommunicationSectionDefinition[]>> {
  return isCommunicationResourcesEnabled() ? readCommunicationCatalog() : { ok: true, value: communicationSections };
}
export async function saveCommunicationCatalogSection(input: Readonly<{
  id: string | null; category: CommunicationCategory; label: string; position: number; expectedUpdatedAt: string | null;
}>): Promise<CommunicationBaseResult<true>> {
  if (!isCommunicationResourcesEnabled()) return { ok: false, error: "unavailable" };
  try {
    const { data, error } = await createServiceClient().rpc("save_communication_base_section", {
      p_id: input.id, p_category: input.category, p_label: input.label, p_position: input.position,
      p_expected_updated_at: input.expectedUpdatedAt,
    });
    if (error) return { ok: false, error: error.code === "40001" ? "conflict" : "write_failed" };
    return data ? { ok: true, value: true } : { ok: false, error: "write_failed" };
  } catch { return { ok: false, error: "write_failed" }; }
}

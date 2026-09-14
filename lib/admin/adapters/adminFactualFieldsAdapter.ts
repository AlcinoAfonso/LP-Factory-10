import "server-only";

import type { FactualFieldDefinition } from "@/conversion-content/landing-page/input-catalog";
import { createServiceClient } from "@/lib/supabase/service";
import {
  createAdminFactualFieldCore,
  setAdminFactualFieldActiveCore,
  updateAdminFactualFieldCore,
  type AdminFactualFieldMutationPorts,
  type AdminFactualFieldMutationResult,
} from "./adminFactualFieldsAdapterCore";

const FULL_ROW = "id,field_key,taxon_id,definition,is_active,created_by,updated_by,created_at,updated_at";

export type { AdminFactualFieldMutationResult } from "./adminFactualFieldsAdapterCore";

export async function createAdminFactualField(input: Readonly<{ actorUserId: string; fieldKey: string; taxonId: string | null; definition: FactualFieldDefinition }>): Promise<AdminFactualFieldMutationResult> {
  return createAdminFactualFieldCore(input, ports());
}
export async function updateAdminFactualField(input: Readonly<{ actorUserId: string; id: string; expectedUpdatedAt: string; sameFactConfirmed: boolean; definition: FactualFieldDefinition }>): Promise<AdminFactualFieldMutationResult> {
  return updateAdminFactualFieldCore(input, ports());
}
export async function setAdminFactualFieldActive(input: Readonly<{ actorUserId: string; id: string; expectedUpdatedAt: string; nextActive: boolean }>): Promise<AdminFactualFieldMutationResult> {
  return setAdminFactualFieldActiveCore(input, ports());
}

function ports(): AdminFactualFieldMutationPorts {
  const supabase = createServiceClient();
  return {
    async taxonExists(taxonId) {
      const { data, error } = await supabase.from("business_taxons").select("id").eq("id", taxonId).in("level", ["segment", "niche", "ultra_niche"]).limit(1).maybeSingle();
      return !error && Boolean(data);
    },
    readField: (id) => supabase.from("taxon_factual_fields").select(FULL_ROW).eq("id", id).limit(1).maybeSingle(),
    createField: (input) => supabase.from("taxon_factual_fields").insert({ field_key: input.fieldKey, taxon_id: input.taxonId, definition: input.definition, created_by: input.actorUserId, updated_by: input.actorUserId }).select(FULL_ROW).limit(1).maybeSingle(),
    updateDefinition: (input) => supabase.from("taxon_factual_fields").update({ definition: input.definition, updated_by: input.actorUserId }).eq("id", input.id).eq("field_key", input.fieldKey).eq("updated_at", input.expectedUpdatedAt).select(FULL_ROW).limit(1).maybeSingle(),
    setActive: (input) => supabase.from("taxon_factual_fields").update({ is_active: input.nextActive, updated_by: input.actorUserId }).eq("id", input.id).eq("updated_at", input.expectedUpdatedAt).eq("is_active", input.expectedActive).select(FULL_ROW).limit(1).maybeSingle(),
  };
}

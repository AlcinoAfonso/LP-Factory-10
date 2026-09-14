import "server-only";

import { factualFieldDefinitionSchema, factualFieldKeySchema, type FactualFieldDefinition } from "@/conversion-content/landing-page/input-catalog";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminFactualFieldMutationResult = Readonly<{ ok: true; fieldKey: string }> | Readonly<{ ok: false; message: string }>;

export async function createAdminFactualField(input: Readonly<{ actorUserId: string; fieldKey: string; taxonId: string | null; definition: FactualFieldDefinition }>): Promise<AdminFactualFieldMutationResult> {
  const parsed = validateInput(input.fieldKey, input.definition);
  if (!parsed.ok) return parsed;
  const supabase = createServiceClient();
  if (input.taxonId && !(await taxonExists(supabase, input.taxonId))) return failure("A camada taxonômica selecionada não existe.");
  const { data, error } = await supabase.from("taxon_factual_fields").insert({
    field_key: input.fieldKey, taxon_id: input.taxonId, definition: input.definition,
    created_by: input.actorUserId, updated_by: input.actorUserId,
  }).select("field_key,taxon_id,definition,is_active").limit(1).maybeSingle();
  if (error || !isRecord(data) || data.field_key !== input.fieldKey || data.taxon_id !== input.taxonId || data.is_active !== true) return failure("O field não pôde ser criado e confirmado.");
  return { ok: true, fieldKey: input.fieldKey };
}

export async function updateAdminFactualField(input: Readonly<{ actorUserId: string; id: string; expectedUpdatedAt: string; sameFactConfirmed: boolean; definition: FactualFieldDefinition }>): Promise<AdminFactualFieldMutationResult> {
  if (!input.sameFactConfirmed) return failure("Confirme que a edição preserva o mesmo fato.");
  const supabase = createServiceClient();
  const { data: current, error: readError } = await supabase.from("taxon_factual_fields").select("id,field_key,taxon_id,definition,updated_at").eq("id", input.id).limit(1).maybeSingle();
  if (readError || !isRecord(current) || typeof current.field_key !== "string" || !isRecord(current.definition) || current.updated_at !== input.expectedUpdatedAt) return failure("O field mudou. Recarregue a página antes de editar.");
  const parsed = validateInput(current.field_key, input.definition);
  if (!parsed.ok) return parsed;
  if (current.definition.valueScope !== input.definition.valueScope) return failure("Mudança de escopo exige um novo fieldKey.");
  const { data, error } = await supabase.from("taxon_factual_fields").update({ definition: input.definition, updated_by: input.actorUserId })
    .eq("id", input.id).eq("field_key", current.field_key).eq("updated_at", input.expectedUpdatedAt)
    .select("field_key,definition,updated_at").limit(1).maybeSingle();
  if (error || !isRecord(data) || data.field_key !== current.field_key || data.updated_at === input.expectedUpdatedAt) return failure("A edição encontrou concorrência e não foi confirmada.");
  return { ok: true, fieldKey: current.field_key };
}

export async function setAdminFactualFieldActive(input: Readonly<{ actorUserId: string; id: string; expectedUpdatedAt: string; nextActive: boolean }>): Promise<AdminFactualFieldMutationResult> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("taxon_factual_fields").update({ is_active: input.nextActive, updated_by: input.actorUserId })
    .eq("id", input.id).eq("updated_at", input.expectedUpdatedAt).eq("is_active", !input.nextActive)
    .select("field_key,is_active,updated_at").limit(1).maybeSingle();
  if (error || !isRecord(data) || typeof data.field_key !== "string" || data.is_active !== input.nextActive || data.updated_at === input.expectedUpdatedAt) return failure("O estado do field mudou. Recarregue a página.");
  return { ok: true, fieldKey: data.field_key };
}

function validateInput(fieldKey: string, definition: FactualFieldDefinition): AdminFactualFieldMutationResult {
  if (!factualFieldKeySchema.safeParse(fieldKey).success) return failure("Use um fieldKey snake_case válido.");
  if (!factualFieldDefinitionSchema.safeParse(definition).success) return failure("A definição factual é inválida.");
  return { ok: true, fieldKey };
}
async function taxonExists(supabase: ReturnType<typeof createServiceClient>, taxonId: string): Promise<boolean> {
  const { data, error } = await supabase.from("business_taxons").select("id").eq("id", taxonId).in("level", ["segment", "niche", "ultra_niche"]).limit(1).maybeSingle();
  return !error && Boolean(data);
}
function failure(message: string): AdminFactualFieldMutationResult { return { ok: false, message }; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

import {
  factualFieldDefinitionSchema,
  factualFieldKeySchema,
  factualFieldRowSchema,
  type FactualFieldDefinition,
  type FactualFieldRow,
} from "@/conversion-content/landing-page/input-catalog";

export type AdminFactualFieldMutationResult = Readonly<{ ok: true; fieldKey: string }> | Readonly<{ ok: false; message: string }>;
export type AdminFactualFieldDatabaseResult = PromiseLike<Readonly<{ data: unknown; error: unknown }>>;

export type AdminFactualFieldMutationPorts = Readonly<{
  taxonExists(taxonId: string): PromiseLike<boolean>;
  readField(id: string): AdminFactualFieldDatabaseResult;
  createField(input: Readonly<{ fieldKey: string; taxonId: string | null; definition: FactualFieldDefinition; actorUserId: string }>): AdminFactualFieldDatabaseResult;
  updateDefinition(input: Readonly<{ id: string; fieldKey: string; expectedUpdatedAt: string; definition: FactualFieldDefinition; actorUserId: string }>): AdminFactualFieldDatabaseResult;
  setActive(input: Readonly<{ id: string; expectedUpdatedAt: string; expectedActive: boolean; nextActive: boolean; actorUserId: string }>): AdminFactualFieldDatabaseResult;
}>;

export async function createAdminFactualFieldCore(input: Readonly<{ actorUserId: string; fieldKey: string; taxonId: string | null; definition: FactualFieldDefinition }>, ports: AdminFactualFieldMutationPorts): Promise<AdminFactualFieldMutationResult> {
  const parsed = validateDefinition(input.fieldKey, input.definition);
  if (!parsed.ok) return parsed;
  if (input.taxonId && !(await ports.taxonExists(input.taxonId))) return failure("A camada taxonômica selecionada não existe.");
  const persisted = confirmedRow(await ports.createField(input));
  if (!persisted || persisted.fieldKey !== input.fieldKey || persisted.taxonId !== input.taxonId || !sameJson(persisted.definition, input.definition) || !persisted.isActive || persisted.createdBy !== input.actorUserId || persisted.updatedBy !== input.actorUserId) return failure("O field não pôde ser criado e confirmado.");
  return { ok: true, fieldKey: persisted.fieldKey };
}

export async function updateAdminFactualFieldCore(input: Readonly<{ actorUserId: string; id: string; expectedUpdatedAt: string; sameFactConfirmed: boolean; definition: FactualFieldDefinition }>, ports: AdminFactualFieldMutationPorts): Promise<AdminFactualFieldMutationResult> {
  if (!input.sameFactConfirmed) return failure("Confirme que a edição preserva o mesmo fato.");
  const current = confirmedRow(await ports.readField(input.id));
  if (!current || current.id !== input.id || current.updatedAt !== input.expectedUpdatedAt) return failure("O field mudou. Recarregue a página antes de editar.");
  const parsed = validateDefinition(current.fieldKey, input.definition);
  if (!parsed.ok) return parsed;
  if (current.definition.valueScope !== input.definition.valueScope) return failure("Mudança de escopo exige um novo fieldKey.");
  const persisted = confirmedRow(await ports.updateDefinition({ ...input, fieldKey: current.fieldKey }));
  if (!persisted || persisted.updatedAt === input.expectedUpdatedAt || persisted.updatedBy !== input.actorUserId || !sameStableColumns(persisted, current) || !sameJson(persisted.definition, input.definition)) return failure("A edição encontrou concorrência e não foi confirmada.");
  return { ok: true, fieldKey: persisted.fieldKey };
}

export async function setAdminFactualFieldActiveCore(input: Readonly<{ actorUserId: string; id: string; expectedUpdatedAt: string; nextActive: boolean }>, ports: AdminFactualFieldMutationPorts): Promise<AdminFactualFieldMutationResult> {
  const current = confirmedRow(await ports.readField(input.id));
  if (!current || current.id !== input.id || current.updatedAt !== input.expectedUpdatedAt || current.isActive === input.nextActive) return failure("O estado do field mudou. Recarregue a página.");
  const persisted = confirmedRow(await ports.setActive({ ...input, expectedActive: current.isActive }));
  if (!persisted || persisted.updatedAt === input.expectedUpdatedAt || persisted.updatedBy !== input.actorUserId || persisted.isActive !== input.nextActive || !sameStableColumns(persisted, current) || !sameJson(persisted.definition, current.definition)) return failure("O estado do field mudou. Recarregue a página.");
  return { ok: true, fieldKey: persisted.fieldKey };
}

function confirmedRow(response: Readonly<{ data: unknown; error: unknown }>): FactualFieldRow | null {
  if (response.error || !isRecord(response.data)) return null;
  const parsed = factualFieldRowSchema.safeParse({ id: response.data.id, fieldKey: response.data.field_key, taxonId: response.data.taxon_id, definition: response.data.definition, isActive: response.data.is_active, createdBy: response.data.created_by, updatedBy: response.data.updated_by, createdAt: response.data.created_at, updatedAt: response.data.updated_at });
  return parsed.success ? parsed.data : null;
}
function validateDefinition(fieldKey: string, definition: FactualFieldDefinition): AdminFactualFieldMutationResult {
  if (!factualFieldKeySchema.safeParse(fieldKey).success) return failure("Use um fieldKey snake_case válido.");
  if (!factualFieldDefinitionSchema.safeParse(definition).success) return failure("A definição factual é inválida.");
  return { ok: true, fieldKey };
}
function sameStableColumns(left: FactualFieldRow, right: FactualFieldRow): boolean { return left.id === right.id && left.fieldKey === right.fieldKey && left.taxonId === right.taxonId && left.createdBy === right.createdBy && left.createdAt === right.createdAt; }
function sameJson(left: unknown, right: unknown): boolean { return canonicalJson(left) === canonicalJson(right); }
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function failure(message: string): AdminFactualFieldMutationResult { return { ok: false, message }; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

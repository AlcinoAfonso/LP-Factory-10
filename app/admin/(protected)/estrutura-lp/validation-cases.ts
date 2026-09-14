import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createAdminFactualFieldCore,
  setAdminFactualFieldActiveCore,
  updateAdminFactualFieldCore,
  type AdminFactualFieldMutationPorts,
} from "../../../../lib/admin/adapters/adminFactualFieldsAdapterCore";
import type { FactualFieldDefinition } from "../../../../lib/conversion-content/landing-page/input-catalog";

const actor = "10000000-0000-4000-8000-000000000001";
const id = "10000000-0000-4000-8000-000000000002";
const originalAt = "2026-09-14T12:00:00.000Z";
const changedAt = "2026-09-14T12:01:00.000Z";
const definition: FactualFieldDefinition = { purpose: "Nome factual", valueType: "string", valueScope: "business", expectedValueOrigin: "business_provided", obligation: "required", validation: { kind: "type_only" } };

async function main() {
  const page = read("./page.tsx");
  const component = read("./_components/AdminFactualFields.tsx");
  const actions = read("./actions.ts");
  const adapter = read("../../../../lib/admin/adapters/adminFactualFieldsAdapter.ts");
  const readAdapter = read("../../../../lib/admin/adapters/adminLandingPageStructureAdapter.ts");

  assert.match(page, /AdminFactualFields/);
  assert.match(page, /view === "entradas"/);
  assert.doesNotMatch(page, /AdminInputCatalogLifecycle|versão|plano/i);
  assert.match(component, /Universal|Segmento|Nicho|Ultranicho/);
  assert.match(component, /Herdado|Próprio|Inativar|Reativar/);
  assert.match(component, /min-h-11|focus-visible:ring-4/);
  assert.doesNotMatch(component, /JSON\.stringify|textarea[^>]*definition/i);
  assert.match(actions, /requirePlatformAdmin/);
  assert.match(actions, /createAdminFactualField|updateAdminFactualField|setAdminFactualFieldActive/);
  assert.match(adapter, /expectedUpdatedAt/);
  assert.match(adapter, /FULL_ROW/);
  assert.match(readAdapter, /includeInactive: true/);

  const created = databaseRow({ created_by: actor, updated_by: actor });
  assert.deepEqual(await createAdminFactualFieldCore({ actorUserId: actor, fieldKey: "business_name", taxonId: null, definition }, ports({ created })), { ok: true, fieldKey: "business_name" });
  assert.ok(!(await createAdminFactualFieldCore({ actorUserId: actor, fieldKey: "business_name", taxonId: null, definition }, ports({ created: { ...created, definition: { ...definition, purpose: "Divergente" } } }))).ok);

  const updatedDefinition = { ...definition, purpose: "Nome factual atualizado" };
  const updated = databaseRow({ definition: updatedDefinition, updated_by: actor, updated_at: changedAt });
  assert.deepEqual(await updateAdminFactualFieldCore({ actorUserId: actor, id, expectedUpdatedAt: originalAt, sameFactConfirmed: true, definition: updatedDefinition }, ports({ updated })), { ok: true, fieldKey: "business_name" });
  assert.ok(!(await updateAdminFactualFieldCore({ actorUserId: actor, id, expectedUpdatedAt: originalAt, sameFactConfirmed: false, definition: updatedDefinition }, ports())).ok);
  assert.ok(!(await updateAdminFactualFieldCore({ actorUserId: actor, id, expectedUpdatedAt: originalAt, sameFactConfirmed: true, definition: { ...definition, valueScope: "offer", expectedValueOrigin: "offer_provided" } }, ports())).ok);
  assert.ok(!(await updateAdminFactualFieldCore({ actorUserId: actor, id, expectedUpdatedAt: changedAt, sameFactConfirmed: true, definition: updatedDefinition }, ports())).ok);
  assert.ok(!(await updateAdminFactualFieldCore({ actorUserId: actor, id, expectedUpdatedAt: originalAt, sameFactConfirmed: true, definition: updatedDefinition }, ports({ updated: { ...updated, field_key: "other_fact" } }))).ok);

  const toggled = databaseRow({ is_active: false, updated_by: actor, updated_at: changedAt });
  assert.deepEqual(await setAdminFactualFieldActiveCore({ actorUserId: actor, id, expectedUpdatedAt: originalAt, nextActive: false }, ports({ toggled })), { ok: true, fieldKey: "business_name" });
  assert.ok(!(await setAdminFactualFieldActiveCore({ actorUserId: actor, id, expectedUpdatedAt: changedAt, nextActive: false }, ports())).ok);
  assert.ok(!(await setAdminFactualFieldActiveCore({ actorUserId: actor, id, expectedUpdatedAt: originalAt, nextActive: false }, ports({ toggled: { ...toggled, definition: { ...definition, purpose: "Divergente" } } }))).ok);

  console.log("ok - E20.8 admin factual fields confirms create, update, toggle and optimistic concurrency behavior");
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });

type DatabaseRow = ReturnType<typeof databaseRow>;
function databaseRow(overrides: Partial<Record<string, unknown>> = {}) {
  return { id, field_key: "business_name", taxon_id: null, definition, is_active: true, created_by: null, updated_by: null, created_at: originalAt, updated_at: originalAt, ...overrides };
}
function ports(input: Readonly<{ created?: DatabaseRow; updated?: DatabaseRow; toggled?: DatabaseRow }> = {}): AdminFactualFieldMutationPorts {
  return {
    taxonExists: async () => true,
    readField: async () => ({ data: databaseRow(), error: null }),
    createField: async () => ({ data: input.created ?? databaseRow({ created_by: actor, updated_by: actor }), error: null }),
    updateDefinition: async () => ({ data: input.updated ?? databaseRow({ definition: updatedDefinitionDefault(), updated_by: actor, updated_at: changedAt }), error: null }),
    setActive: async () => ({ data: input.toggled ?? databaseRow({ is_active: false, updated_by: actor, updated_at: changedAt }), error: null }),
  };
}
function updatedDefinitionDefault(): FactualFieldDefinition { return { ...definition, purpose: "Nome factual atualizado" }; }
function read(relativePath: string) { return readFileSync(new URL(relativePath, import.meta.url), "utf8"); }

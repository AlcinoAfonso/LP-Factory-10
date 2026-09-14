import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { readCompleteFactualCoverageFromPages } from "../../adapters/factualFieldsAdapterCore";
import type { FactualFieldRow, FactualTaxonIdentity } from "./contracts";
import { buildFactualTaxonChain } from "./taxon-chain";
import { resolveFactualCoverage } from "./resolver";
import { factualFieldDefinitionSchema } from "./schema";

async function main() {
const segment = taxon("10000000-0000-4000-8000-000000000001", "segment", null);
const niche = taxon("10000000-0000-4000-8000-000000000002", "niche", segment.id);
const ultra = taxon("10000000-0000-4000-8000-000000000003", "ultra_niche", niche.id);
const built = buildFactualTaxonChain(ultra, [segment, niche, ultra]);
assert.ok(built.ok);

const rows = [row("business_name", null), row("segment_fact", segment.id), row("niche_fact", niche.id), row("ultra_fact", ultra.id)];
const resolved = resolveFactualCoverage({ taxonChain: built.value, rows });
assert.ok(resolved.ok);
assert.deepEqual(resolved.value.fields.map((field) => field.fieldKey), ["business_name", "segment_fact", "niche_fact", "ultra_fact"]);
assert.deepEqual(resolved.value.fields.map((field) => field.ownership), ["inherited", "inherited", "inherited", "own"]);
assert.deepEqual(resolved.value.appliedLayers.map((layer) => layer.level), ["universal", "segment", "niche", "ultra_niche"]);

assert.ok(!buildFactualTaxonChain(ultra, [segment, ultra]).ok);
assert.ok(!resolveFactualCoverage({ taxonChain: built.value, rows: [...rows, { ...rows[0], id: randomUUID() }] }).ok);
assert.ok(!resolveFactualCoverage({ taxonChain: built.value, rows: [row("foreign", "10000000-0000-4000-8000-000000000099")] }).ok);
assert.ok(resolveFactualCoverage({ taxonChain: built.value, rows: [{ ...row("inactive", null), isActive: false }] }).ok);
assert.ok(resolveFactualCoverage({ taxonChain: built.value, rows: [{ ...row("inactive", null), isActive: false }], includeInactive: true }).ok);
assert.ok(!factualFieldDefinitionSchema.safeParse({ ...row("x", null).definition, unknown: true }).success);

const manyRows = Array.from({ length: 501 }, (_, index) => row(`field_${index}`, null));
const paged = await readCompleteFactualCoverageFromPages(built.value, async (offset, limit) => ({ data: manyRows.slice(offset, offset + limit).map(toDatabaseRow), error: null }));
assert.ok(paged.ok);
assert.equal(paged.value.fields.length, 501);
const failed = await readCompleteFactualCoverageFromPages(built.value, async () => ({ data: null, error: { code: "boom" } }));
assert.ok(!failed.ok);
assert.equal(failed.error.code, "READ_FAILED");

console.log("ok - E20.8 factual fields contract, hierarchy, resolution and complete pagination");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

function taxon(id: string, level: FactualTaxonIdentity["level"], parentId: string | null): FactualTaxonIdentity {
  return { id, name: level, slug: level.replace("_", "-"), level, parentId, isActive: true };
}
function row(fieldKey: string, taxonId: string | null): FactualFieldRow {
  return { id: randomUUID(), fieldKey, taxonId, isActive: true, createdBy: null, updatedBy: null, createdAt: "2026-09-14T12:00:00.000Z", updatedAt: "2026-09-14T12:00:00.000Z", definition: { purpose: `Finalidade de ${fieldKey}`, valueType: "string", valueScope: "business", expectedValueOrigin: "business_provided", obligation: "required", validation: { kind: "type_only" } } };
}
function toDatabaseRow(value: FactualFieldRow) {
  return { id: value.id, field_key: value.fieldKey, taxon_id: value.taxonId, definition: value.definition, is_active: value.isActive, created_by: value.createdBy, updated_by: value.updatedBy, created_at: value.createdAt, updated_at: value.updatedAt };
}

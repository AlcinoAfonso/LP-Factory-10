import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import type { ResolvedFactualCoverage } from "../../conversion-content/landing-page/input-catalog";
import type { FactualFieldRow, FactualTaxonIdentity } from "../../conversion-content/landing-page/input-catalog/contracts";
import { resolveFactualCoverage } from "../../conversion-content/landing-page/input-catalog/resolver";
import { assessFactualCoverage, buildFactualProfileWrite, canEditFactualValues, hasFactualCatalogCutover, isFactualReady, validateFactualInput } from "./policy";

const activeCatalog = [
  { field_key: "business_display_name", definition: { obligation: "required", valueType: "string" } },
  { field_key: "creci_registration", definition: { obligation: "optional", valueType: "string" } },
  { field_key: "professional_regulatory_credential", definition: { obligation: "optional", valueType: "string" } },
];
assert.equal(hasFactualCatalogCutover(activeCatalog, 3), true);
assert.equal(hasFactualCatalogCutover(activeCatalog, 26), false);
assert.equal(hasFactualCatalogCutover(activeCatalog.slice(0, 2), 2), false);
assert.equal(hasFactualCatalogCutover([...activeCatalog, { field_key: "unexpected", definition: {} }], 4), false);
assert.equal(hasFactualCatalogCutover([activeCatalog[0], { ...activeCatalog[1], definition: { obligation: "required", valueType: "string" } }, activeCatalog[2]], 3), false);
assert.equal(hasFactualCatalogCutover(activeCatalog, null), false);

const business = { fieldKey: "business_display_name", originLayer: "universal", obligation: "required", valueType: "string" };
const creci = { fieldKey: "creci_registration", originLayer: "niche", originTaxon: { slug: "corretor-imoveis" }, obligation: "optional", valueType: "string" };
const credential = { fieldKey: "professional_regulatory_credential", originLayer: "segment", originTaxon: { slug: "servicos-profissionais" }, obligation: "optional", valueType: "string" };
const coverage = (fields: unknown[], segment = "outro-segmento", niche = "outro-nicho") => ({
  fields,
  appliedLayers: [
    { level: "universal", taxon: null },
    { level: "segment", taxon: { slug: segment } },
    { level: "niche", taxon: { slug: niche } },
  ],
}) as unknown as ResolvedFactualCoverage;

assert.deepEqual(assessFactualCoverage(coverage([business])), { ok: true, creciApplicable: false, professionalCredentialApplicable: false });
assert.deepEqual(assessFactualCoverage(coverage([business, creci], "imobiliario", "corretor-imoveis")), { ok: true, creciApplicable: true, professionalCredentialApplicable: false });
assert.deepEqual(assessFactualCoverage(coverage([business, credential], "servicos-profissionais")), { ok: true, creciApplicable: false, professionalCredentialApplicable: true });
assert.deepEqual(assessFactualCoverage(coverage([business], "servicos-profissionais")), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([business], "imobiliario", "corretor-imoveis")), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([business, credential])), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([business, creci])), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([business, { ...credential, obligation: "required" }], "servicos-profissionais")), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([business, { ...creci, obligation: "required" }], "imobiliario", "corretor-imoveis")), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([business, { fieldKey: "unexpected" }])), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([])), { ok: false });

const taxon = (id: string, slug: string, level: FactualTaxonIdentity["level"], parentId: string | null): FactualTaxonIdentity =>
  ({ id, slug, name: slug, level, parentId, isActive: true });
const imobiliario = taxon(randomUUID(), "imobiliario", "segment", null);
const corretor = taxon(randomUUID(), "corretor-imoveis", "niche", imobiliario.id);
const profissionais = taxon(randomUUID(), "servicos-profissionais", "segment", null);
const advogado = taxon(randomUUID(), "advogado", "niche", profissionais.id);
const outro = taxon(randomUUID(), "outro-segmento", "segment", null);
const row = (fieldKey: string, taxonId: string | null, obligation: "required" | "optional", isActive = true): FactualFieldRow => ({
  id: randomUUID(), fieldKey, taxonId, isActive, createdBy: null, updatedBy: null,
  createdAt: "2026-09-26T00:00:00.000Z", updatedAt: "2026-09-26T00:00:00.000Z",
  definition: { purpose: fieldKey, valueType: "string", valueScope: "business", expectedValueOrigin: "business_provided", obligation, validation: { kind: "type_only" } },
});
const rows: FactualFieldRow[] = [
  row("business_display_name", null, "required"),
  row("creci_registration", corretor.id, "optional"),
  row("professional_regulatory_credential", profissionais.id, "optional"),
  ...Array.from({ length: 23 }, (_, index) => {
    const inactive = row(`legacy_${index}`, null, "optional", false);
    return index === 0
      ? { ...inactive, definition: { ...inactive.definition, applicableWhen: { fieldKey: "traffic_source", operator: "equals" as const, value: "paid_search" } } }
      : inactive;
  }),
];
for (const [taxonChain, expected] of [
  [{ segment: imobiliario, niche: corretor }, ["business_display_name", "creci_registration"]],
  [{ segment: profissionais, niche: advogado }, ["business_display_name", "professional_regulatory_credential"]],
  [{ segment: outro }, ["business_display_name"]],
] as const) {
  const applicable = rows.filter((field) => field.taxonId === null || field.taxonId === taxonChain.segment.id || field.taxonId === taxonChain.niche?.id);
  const resolved = resolveFactualCoverage({ taxonChain, rows: applicable });
  assert.ok(resolved.ok);
  assert.deepEqual(resolved.value.fields.map((field) => field.fieldKey), expected);
  assert.equal(assessFactualCoverage(resolved.value).ok, true);
}

for (const role of ["owner", "admin", "editor"] as const) assert.equal(canEditFactualValues(role), true);
assert.equal(canEditFactualValues("viewer"), false);

const input = (changes: Partial<{ businessDisplayName: string; whatsapp: string; creciRegistration: string; professionalRegulatoryCredential: string }> = {}) => ({
  businessDisplayName: "Ana", whatsapp: "", creciRegistration: "", professionalRegulatoryCredential: "", ...changes,
});
assert.deepEqual(validateFactualInput(input({ businessDisplayName: "  Imobiliária Azul  " }), true, false), {
  ok: true,
  values: { businessDisplayName: "Imobiliária Azul", whatsapp: null, creciRegistration: null, professionalRegulatoryCredential: null },
});
assert.deepEqual(validateFactualInput(input({ whatsapp: " 11 99999-9999 ", creciRegistration: " 12345-F " }), true, false), {
  ok: true,
  values: { businessDisplayName: "Ana", whatsapp: "11 99999-9999", creciRegistration: "12345-F", professionalRegulatoryCredential: null },
});
assert.deepEqual(validateFactualInput(input({ professionalRegulatoryCredential: " OAB 12345 " }), false, true), {
  ok: true,
  values: { businessDisplayName: "Ana", whatsapp: null, creciRegistration: null, professionalRegulatoryCredential: "OAB 12345" },
});
assert.deepEqual(validateFactualInput(input({ creciRegistration: "ignored", professionalRegulatoryCredential: "ignored" }), false, false), {
  ok: true,
  values: { businessDisplayName: "Ana", whatsapp: null, creciRegistration: null, professionalRegulatoryCredential: null },
});
assert.equal(validateFactualInput(input({ businessDisplayName: " " }), false, false).ok, false);
assert.equal(validateFactualInput(input({ businessDisplayName: "x".repeat(121) }), false, false).ok, false);
assert.equal(validateFactualInput(input({ whatsapp: "x".repeat(33) }), false, false).ok, false);
assert.equal(validateFactualInput(input({ creciRegistration: "x".repeat(81) }), true, false).ok, false);
assert.equal(validateFactualInput(input({ professionalRegulatoryCredential: "x".repeat(121) }), false, true).ok, false);

const values = { businessDisplayName: "Ana", whatsapp: null, creciRegistration: null, professionalRegulatoryCredential: null };
assert.equal(isFactualReady(values), true);
assert.equal(isFactualReady({ ...values, businessDisplayName: " ", professionalRegulatoryCredential: "OAB" }), false);
const noOptionalWrite = buildFactualProfileWrite("account-id", values, false, false);
assert.equal(Object.hasOwn(noOptionalWrite, "creci_registration"), false);
assert.equal(Object.hasOwn(noOptionalWrite, "professional_regulatory_credential"), false);
const withCreciWrite = buildFactualProfileWrite("account-id", { ...values, creciRegistration: "12345-F" }, true, false);
assert.equal(withCreciWrite.creci_registration, "12345-F");
const withCredentialWrite = buildFactualProfileWrite("account-id", { ...values, professionalRegulatoryCredential: "OAB 12345" }, false, true);
assert.equal(withCredentialWrite.professional_regulatory_credential, "OAB 12345");

console.log("ok - E10.10 three-field factual coverage, roles, input and readiness");

import assert from "node:assert/strict";

import type { ResolvedFactualCoverage } from "../../conversion-content/landing-page/input-catalog";
import { assessFactualCoverage, canEditFactualValues, isFactualReady, validateFactualInput } from "./policy";

const business = {
  fieldKey: "business_display_name",
  originLayer: "universal",
  obligation: "required",
  valueType: "string",
};
const creci = {
  fieldKey: "creci_registration",
  originTaxon: { slug: "corretor-imoveis" },
  obligation: "optional",
  valueType: "string",
};
const coverage = (fields: unknown[]) => ({ fields }) as unknown as ResolvedFactualCoverage;

assert.deepEqual(assessFactualCoverage(coverage([business])), { ok: true, creciApplicable: false });
assert.deepEqual(assessFactualCoverage(coverage([business, creci])), { ok: true, creciApplicable: true });
assert.deepEqual(assessFactualCoverage(coverage([business, { ...creci, obligation: "required" }])), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([business, creci, { fieldKey: "professional_regulatory_credential" }])), { ok: false });
assert.deepEqual(assessFactualCoverage(coverage([])), { ok: false });

for (const role of ["owner", "admin", "editor"] as const) assert.equal(canEditFactualValues(role), true);
assert.equal(canEditFactualValues("viewer"), false);

assert.deepEqual(validateFactualInput({ businessDisplayName: "  Imobiliária Azul  ", whatsapp: "", creciRegistration: "" }, true), {
  ok: true,
  values: { businessDisplayName: "Imobiliária Azul", whatsapp: null, creciRegistration: null },
});
assert.deepEqual(validateFactualInput({ businessDisplayName: "Ana", whatsapp: " 11 99999-9999 ", creciRegistration: " 12345-F " }, true), {
  ok: true,
  values: { businessDisplayName: "Ana", whatsapp: "11 99999-9999", creciRegistration: "12345-F" },
});
assert.deepEqual(validateFactualInput({ businessDisplayName: "Ana", whatsapp: "", creciRegistration: "12345-F" }, false), {
  ok: true,
  values: { businessDisplayName: "Ana", whatsapp: null, creciRegistration: null },
});
assert.equal(validateFactualInput({ businessDisplayName: " ", whatsapp: "", creciRegistration: "" }, false).ok, false);
assert.equal(validateFactualInput({ businessDisplayName: "x".repeat(121), whatsapp: "", creciRegistration: "" }, false).ok, false);
assert.equal(validateFactualInput({ businessDisplayName: "Ana", whatsapp: "x".repeat(33), creciRegistration: "" }, false).ok, false);
assert.equal(validateFactualInput({ businessDisplayName: "Ana", whatsapp: "", creciRegistration: "x".repeat(81) }, true).ok, false);

assert.equal(isFactualReady({ businessDisplayName: "Ana", whatsapp: null, creciRegistration: null }), true);
assert.equal(isFactualReady({ businessDisplayName: " ", whatsapp: "11", creciRegistration: "123" }), false);

console.log("ok - E10.10 factual coverage, roles, input and readiness");

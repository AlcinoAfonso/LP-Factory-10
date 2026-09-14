import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
assert.match(adapter, /sameFactConfirmed/);
assert.match(adapter, /expectedUpdatedAt/);
assert.match(adapter, /Mudança de escopo exige um novo fieldKey/);
assert.match(readAdapter, /includeInactive: true/);

console.log("ok - E20.8 admin factual fields uses one structured, guarded and human-controlled surface");

function read(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

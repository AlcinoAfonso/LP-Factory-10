import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { listLandingPageRootVersions, resolveLandingPageRootParameters } from "../../../../lib/conversion-content/landing-page";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const adapter = readFileSync(new URL("../../../../lib/admin/adapters/adminLandingPageStructureAdapter.ts", import.meta.url), "utf8");
assert.match(page, /rootVersion|resolvedPresetKey/);
assert.match(page, /min-h-11|focus-visible:ring-4/);
assert.doesNotMatch(page + adapter, /AdminFactualFields|readFactualCoverageForTaxon|evaluationSuggestionHandoff|"entradas"/);
assert.equal(existsSync(new URL("./actions.ts", import.meta.url)), false);
assert.equal(existsSync(new URL("./_components/AdminFactualFields.tsx", import.meta.url)), false);
const versions = listLandingPageRootVersions();
assert.ok(versions.length > 0);
for (const rootVersion of versions) {
  const base = resolveLandingPageRootParameters({ rootVersion });
  assert.ok(base.ok);
  for (const presetKey of Object.keys(base.value.presets)) {
    const result = resolveLandingPageRootParameters({ rootVersion, presetKey });
    assert.ok(result.ok);
    assert.equal(result.value.rootVersion, rootVersion);
    assert.equal(result.value.resolvedPresetKey, presetKey);
    assert.equal(result.value.visualCriteria.visibleFocusRequired, true);
    assert.deepEqual(result.value.semanticRoles, base.value.semanticRoles);
  }
  assert.equal(resolveLandingPageRootParameters({ rootVersion, presetKey: "unknown" }).ok, false);
}
assert.equal(resolveLandingPageRootParameters({ rootVersion: -1 }).ok, false);
console.log("ok - Admin LP structure preserves root versions and presets without factual authority");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const adapter = readFileSync(
  new URL("../../../../lib/admin/adapters/adminLandingPageStructureAdapter.ts", import.meta.url),
  "utf8",
);
const navigation = readFileSync(
  new URL("../../../../components/admin/adminNavigation.ts", import.meta.url),
  "utf8",
);
const taxonomyList = readFileSync(new URL("../taxonomia/page.tsx", import.meta.url), "utf8");
const taxonomyDetail = readFileSync(new URL("../taxonomia/[taxonId]/page.tsx", import.meta.url), "utf8");
const taxonomyAdapter = readFileSync(
  new URL("../../../../lib/admin/adapters/adminTaxonomyAdapter.ts", import.meta.url),
  "utf8",
);
const conversionIndex = readFileSync(
  new URL("../../../../lib/conversion-content/index.ts", import.meta.url),
  "utf8",
);
const packageJson = readFileSync(new URL("../../../../package.json", import.meta.url), "utf8");

assert.match(page, /allowedValues\.map\(inputOptionLabel\)/);
assert.match(page, /rent:\s*"Locação"/);
assert.match(page, /return labels\[value\] \?\? humanize\(value\)/);
assert.doesNotMatch(page, /rent:\s*"rent"/);
assert.doesNotMatch(page, /Módulos e variantes|ModuleView|module-catalog/);
assert.doesNotMatch(adapter, /"modulos"|module-catalog|readModules/);
assert.doesNotMatch(page, /Pesquisas|ResearchView|ResearchAudience|research-resolution/);
assert.doesNotMatch(adapter, /"pesquisas"|readResearch|getAdminTaxonResearchPresentation|research-resolution/);
assert.match(adapter, /toInputCatalogTaxonIdentity/);
assert.doesNotMatch(adapter, /buildLandingPageInputCatalogTaxonChain\(selectedTaxon, taxonRead\.taxons\)/);
assert.doesNotMatch(navigation, /Módulos, variantes/);
assert.match(page, /parametros:\s*"Parâmetros"/);
assert.match(page, /entradas:\s*"Entradas"/);
assert.doesNotMatch(taxonomyList, /Pesquisa BB|Pesquisa EC|diagnostic\.(businessBuyer|endCustomer)/);
assert.doesNotMatch(taxonomyDetail, /Pesquisa BB|Pesquisa EC|diagnostic\.(businessBuyer|endCustomer)/);
assert.match(taxonomyDetail, /AdminTaxonResearchSelectionForm/);
assert.match(taxonomyDetail, /AdminTaxonInputCatalogReview/);
assert.doesNotMatch(taxonomyAdapter, /landingPageResearchAdapter|research-resolution|resolveLandingPageResearch|E10\.8/);
assert.match(taxonomyAdapter, /loadSelectedEndCustomerResearchFromClient/);
assert.match(taxonomyAdapter, /readAdminCommercialActivationOverview/);
assert.doesNotMatch(conversionIndex, /landingPageResearch|landingPageResearchAdapter|research-resolution/);
assert.doesNotMatch(packageJson, /validate:landing-page-research|research-resolution\/validation-cases/);
assert.match(packageJson, /validate:commercial-activation/);
assert.match(packageJson, /validate:taxon-preparation/);
assert.match(packageJson, /validate:lp-builder-generation-context/);

console.log("ok - admin retires E10.8 surfaces and preserves active consumers");

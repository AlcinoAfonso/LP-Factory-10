import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const comparison = readFileSync(
  new URL("./_components/OpenAiLandingPageTextComparison.tsx", import.meta.url),
  "utf8",
);
const comparisonActions = readFileSync(
  new URL("./comparisonActions.ts", import.meta.url),
  "utf8",
);
const configurationPage = readFileSync(
  new URL("../workloads-openai/page.tsx", import.meta.url),
  "utf8",
);
const navigation = readFileSync(
  new URL("../../../../components/admin/adminNavigation.ts", import.meta.url),
  "utf8",
);

assert.match(page, /const gate = await requirePlatformAdmin\(\)/);
assert.match(page, /redirect\("\/auth\/login\?next=%2Fadmin%2Ftestes-openai"\)/);
assert.equal(
  page.indexOf("await requirePlatformAdmin()") < page.indexOf("await Promise.all"),
  true,
  "the tests page must reauthorize platform_admin before service-role read models",
);
assert.match(page, /readOpenAiAdministrativeConfigurations/);
assert.match(page, /readOpenAiModelCatalog/);
assert.match(page, /projectOpenAiWorkloadConfigurationOptions/);
assert.match(page, /<OpenAiLandingPageTextComparison/);
assert.match(page, /maxDuration = 300/);
assert.match(page, /title="Testes OpenAI"/);
assert.match(page, /não cria candidata, não ativa configuração e não altera Production/);

assert.match(navigation, /title: 'Configuração OpenAI'/);
assert.match(navigation, /href: '\/admin\/workloads-openai'/);
assert.match(navigation, /title: 'Testes OpenAI'/);
assert.match(navigation, /href: '\/admin\/testes-openai'/);
assert.doesNotMatch(configurationPage, /OpenAiLandingPageTextComparison|comparisonActions/);
assert.doesNotMatch(configurationPage, /maxDuration = 300/);
assert.match(configurationPage, /Validar candidata comprova somente a configuração técnica/);

for (const comparisonLabel of [
  "Comparação textual da Landing Page",
  "Configurações do catálogo",
  "Avaliação cega",
  "Revelar configurações e eficiência",
  "Repetição focalizada",
  "Decisão humana",
  "Resumo transitório",
  "Custo não confirmado",
]) {
  assert.match(comparison, new RegExp(comparisonLabel));
}
assert.match(comparison, /não cria nem valida tecnicamente candidata/);
assert.match(comparison, /não altera Production/);
assert.match(comparison, /startLandingPageDraftComparisonAction/);
assert.match(comparison, /repeatLandingPageDraftComparisonAction/);
assert.match(comparison, /lg:grid-cols-2/);
assert.match(comparison, /sm:grid-cols/);
assert.match(comparison, /<label htmlFor=/);
assert.match(comparison, /min-h-11/);
assert.match(comparison, /focus-visible:/);
assert.match(comparison, /role="alert"/);
assert.match(comparison, /aria-live=/);
assert.match(comparison, /value="insufficient">Insuficiente/);
assert.match(comparison, /value="adequate">Adequada/);
assert.match(comparison, /value="superior">Superior/);
assert.match(comparison, /value="relevant">Relevante/);
assert.match(comparison, /isLandingPageDraftComparisonRecommendationEligible/);
assert.doesNotMatch(comparison, /\{value\}\/5|Substancial|substantial/);
assert.match(comparisonActions, /requirePlatformAdmin\(\)/);
assert.match(comparisonActions, /createHmac/);
assert.match(comparisonActions, /timingSafeEqual/);
assert.match(comparisonActions, /resolveCatalogCandidate/);
assert.doesNotMatch(comparison, /LandingPageRenderer/);
assert.doesNotMatch(comparison, /from\s+["'][^"']*supabase/i);
assert.doesNotMatch(comparison, /process\.env|OPENAI_API_KEY/);
assert.doesNotMatch(comparisonActions, /revalidatePath|redirect\(/);

for (const mutation of [
  "saveOpenAiConfigurationCandidate",
  "promoteOpenAiConfigurationCandidate",
  "activateOpenAiConfigurationRevision",
  "rollbackOpenAiConfigurationRevision",
]) {
  assert.doesNotMatch(comparisonActions, new RegExp(mutation));
}

console.log("ok - E21.3 Tests OpenAI is physically separated from configuration and lifecycle");

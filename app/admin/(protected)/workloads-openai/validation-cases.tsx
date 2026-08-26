import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const manager = readFileSync(
  new URL("./_components/OpenAiConfigurationManager.tsx", import.meta.url),
  "utf8",
);
const catalog = readFileSync(
  new URL("./_components/OpenAiModelCatalogManager.tsx", import.meta.url),
  "utf8",
);
const detail = readFileSync(
  new URL("./_components/OpenAiWorkloadDetail.tsx", import.meta.url),
  "utf8",
);
const comparison = readFileSync(
  new URL("./_components/OpenAiLandingPageTextComparison.tsx", import.meta.url),
  "utf8",
);
const actions = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");
const comparisonActions = readFileSync(
  new URL("./comparisonActions.ts", import.meta.url),
  "utf8",
);
const lifecycleUi = `${page}\n${manager}\n${catalog}\n${detail}`;
const ui = `${lifecycleUi}\n${comparison}`;

assert.match(page, /const gate = await requirePlatformAdmin\(\)/);
assert.match(page, /redirect\("\/auth\/login\?next=%2Fadmin%2Fworkloads-openai"\)/);
assert.equal(
  page.indexOf("await requirePlatformAdmin()") < page.indexOf("await Promise.all"),
  true,
  "the page must reauthorize platform_admin before service-role read models",
);
assert.match(page, /readOpenAiAdministrativeConfigurations/);
assert.match(page, /readOpenAiModelCatalog/);
assert.match(page, /listOpenAiWorkloadPresentations/);
assert.match(page, /projectOpenAiWorkloadConfigurationOptions/);
assert.doesNotMatch(page, /listOpenAiWorkloadConfigurationOptions/);
assert.match(page, /<OpenAiModelCatalogManager/);
assert.match(page, /<OpenAiConfigurationManager/);
assert.match(page, /<OpenAiLandingPageTextComparison/);
assert.match(page, /maxDuration = 300/);
assert.match(page, /Leitura administrativa indisponível/);
assert.match(page, /Supabase Inspect/);
assert.match(page, /Somente leitura/);

assert.match(catalog, /Catálogo global/);
assert.match(catalog, /Disponível para novas candidatas|disponíveis para novas candidatas/i);
assert.match(catalog, /Adicionar modelo/);
assert.match(catalog, /nasce indisponível|adicionado indisponível/i);
assert.match(catalog, /Configurar/);
assert.match(catalog, /openModelKey/);
assert.match(catalog, /addOpenAiModelCatalogModelAction/);
assert.match(catalog, /setOpenAiModelCatalogModelAvailabilityAction/);
assert.match(catalog, /setOpenAiModelCatalogParameterAvailabilityAction/);
assert.match(catalog, /from "@\/openai-workloads\/contracts"/);
assert.doesNotMatch(catalog, /from "@\/openai-workloads"/);
for (const field of [
  "apiKind",
  "model",
  "parameterValues",
  "parameterKind",
  "parameterValue",
  "availableForSelection",
  "expectedVersion",
]) {
  assert.match(catalog, new RegExp(`name=["']${field}["']`));
}

assert.match(manager, /Preview/);
assert.match(manager, /Production/);
assert.match(manager, /aria-pressed=/);
assert.match(manager, /sticky top-0/);
assert.match(manager, /overflow-y-auto/);
assert.match(manager, /overflow-x-hidden/);
assert.match(manager, />Recorte</);
assert.match(manager, />Configuração atual</);
assert.match(manager, />Imagem</);
assert.match(manager, /aria-expanded=/);
assert.match(manager, /aria-controls=/);
assert.match(manager, /openGroupKey/);
assert.match(manager, /visualGroup/);
assert.match(manager, /roadmapReference/);
assert.match(manager, /2 unidades técnicas/);
assert.match(manager, /agrupados apenas na apresentação/i);
assert.match(manager, /configurationOptions\.find/);
assert.doesNotMatch(manager, /landing_page_draft_/);

for (const lifecycleLabel of [
  "Configuração ativa",
  "Candidata editável",
  "Revisão validada pendente",
  "Histórico de revisões",
  "Eventos de ativação",
]) {
  assert.match(detail, new RegExp(lifecycleLabel));
}
for (const action of [
  "saveOpenAiConfigurationCandidateAction",
  "discardOpenAiConfigurationCandidateAction",
  "proveAndPromoteOpenAiConfigurationCandidateAction",
  "activateOpenAiConfigurationRevisionAction",
  "rollbackOpenAiConfigurationRevisionAction",
]) {
  assert.match(detail, new RegExp(action));
}
assert.match(detail, /options\.options/);
assert.match(detail, /name="model"/);
assert.match(detail, /name="reasoningEffort"/);
assert.match(detail, /name="quality"/);
assert.match(detail, /catalogAvailable/);
assert.match(detail, /candidateEligible/);
assert.match(detail, /disabled={!catalogAvailable \|\| !candidateEligible}/);

const saveAction = actionSection(
  actions,
  "saveOpenAiConfigurationCandidateAction",
  "discardOpenAiConfigurationCandidateAction",
);
const proofAction = actionSection(
  actions,
  "proveAndPromoteOpenAiConfigurationCandidateAction",
  "activateOpenAiConfigurationRevisionAction",
);
const activationAction = actionSection(
  actions,
  "activateOpenAiConfigurationRevisionAction",
  "rollbackOpenAiConfigurationRevisionAction",
);
const rollbackAction = actionSection(
  actions,
  "rollbackOpenAiConfigurationRevisionAction",
  "authorizedUnit",
);
assert.match(saveAction, /candidateIsEligibleForSave/);
assert.match(proofAction, /candidateIsStillEligible/);
assert.equal(
  proofAction.indexOf("candidateIsStillEligible") <
    proofAction.indexOf("promoteOpenAiConfigurationCandidate"),
  true,
);
for (const catalogIndependentLifecycleAction of [activationAction, rollbackAction]) {
  assert.doesNotMatch(
    catalogIndependentLifecycleAction,
    /readOpenAiModelCatalog|checkOpenAiModelCatalogConfigurationAvailable|candidateIsEligible/i,
  );
}

for (const stateLabel of [
  "Dados inválidos",
  "Alteração concorrente",
  "Prova operacional não aprovada",
  "Falha de ativação",
  "Leitura da configuração falhou",
]) {
  assert.match(detail, new RegExp(stateLabel));
}
assert.match(catalog, /Dados inválidos/);
assert.match(catalog, /Alteração concorrente/);
assert.match(catalog, /Alteração do catálogo não concluída/);

assert.match(ui, /<label htmlFor=/);
assert.match(ui, /min-h-11/);
assert.match(ui, /focus-visible:/);
assert.match(ui, /role="alert"/);
assert.match(ui, /aria-live=/);
assert.doesNotMatch(ui, /gpt-[a-z0-9.-]+/i);
assert.doesNotMatch(ui, /from\s+["'][^"']*supabase/i);
assert.doesNotMatch(ui, /\.rpc\s*\(/);
assert.doesNotMatch(ui, /Database\s*\[/);
assert.doesNotMatch(ui, /\bRow\b/);
assert.doesNotMatch(lifecycleUi, /benchmark|ranking|recomenda(?:ção|cao)/i);

for (const comparisonLabel of [
  "Comparação textual da Landing Page",
  "Avaliação cega",
  "Revelar configurações e eficiência",
  "Repetição focalizada",
  "Decisão humana",
  "Resumo transitório",
  "Custo não confirmado",
]) {
  assert.match(comparison, new RegExp(comparisonLabel));
}
assert.match(comparison, /startLandingPageDraftComparisonAction/);
assert.match(comparison, /repeatLandingPageDraftComparisonAction/);
assert.match(comparison, /desktop|lg:grid-cols-2/i);
assert.match(comparison, /sm:grid-cols/);
assert.match(comparisonActions, /requirePlatformAdmin\(\)/);
assert.match(comparisonActions, /createHmac/);
assert.match(comparisonActions, /timingSafeEqual/);
assert.match(comparisonActions, /resolveCatalogCandidate/);
assert.doesNotMatch(comparison, /LandingPageRenderer/);
assert.doesNotMatch(comparison, /from\s+["'][^"']*supabase/i);
assert.doesNotMatch(comparison, /process\.env|OPENAI_API_KEY/);
for (const mutation of [
  "saveOpenAiConfigurationCandidate",
  "promoteOpenAiConfigurationCandidate",
  "activateOpenAiConfigurationRevision",
  "rollbackOpenAiConfigurationRevision",
]) {
  assert.doesNotMatch(comparisonActions, new RegExp(mutation));
}

console.log("ok - E21.2.5 compact catalog, sticky workloads, lifecycle and UI boundaries");

function actionSection(source: string, startName: string, endName: string) {
  const start = source.indexOf(`export async function ${startName}`);
  const end = source.indexOf(`async function ${endName}`, start + 1) >= 0
    ? source.indexOf(`async function ${endName}`, start + 1)
    : source.indexOf(`export async function ${endName}`, start + 1);
  assert.notEqual(start, -1, `${startName} must exist`);
  assert.notEqual(end, -1, `${endName} must delimit ${startName}`);
  return source.slice(start, end);
}

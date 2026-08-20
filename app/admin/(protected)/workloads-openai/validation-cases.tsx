import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const manager = readFileSync(
  new URL("./_components/OpenAiConfigurationManager.tsx", import.meta.url),
  "utf8",
);
const ui = `${page}\n${manager}`;

assert.match(page, /const gate = await requirePlatformAdmin\(\)/);
assert.match(page, /redirect\("\/auth\/login\?next=%2Fadmin%2Fworkloads-openai"\)/);
assert.equal(
  page.indexOf("await requirePlatformAdmin()") <
    page.indexOf("await readConfigurationsSafely()"),
  true,
  "the page must reauthorize platform_admin before the service-role read model",
);
assert.match(page, /readOpenAiAdministrativeConfigurations/);
assert.match(page, /listOpenAiWorkloadConfigurationOptions/);
assert.match(page, /listOpenAiWorkloadInventory/);
assert.match(page, /readResult\.ok\s*\?/);
assert.match(page, /Leitura administrativa indisponível/);
assert.match(page, /nenhum controle de alteração está disponível/i);

assert.match(manager, /Production/);
assert.match(manager, /Preview/);
assert.match(manager, /Configuração ativa/);
assert.match(manager, /Candidata editável/);
assert.match(manager, /Revisão validada pendente/);
assert.match(manager, /Histórico de revisões/);
assert.match(manager, /Eventos de ativação/);
assert.match(manager, /Geração da Landing Page/);
assert.match(page, /Supabase Inspect/);
assert.match(page, /Somente leitura/);

for (const action of [
  "saveOpenAiConfigurationCandidateAction",
  "discardOpenAiConfigurationCandidateAction",
  "proveAndPromoteOpenAiConfigurationCandidateAction",
  "activateOpenAiConfigurationRevisionAction",
  "rollbackOpenAiConfigurationRevisionAction",
]) {
  assert.match(manager, new RegExp(action));
}

assert.match(manager, /configurationOptions\.find/);
assert.match(manager, /options\.options/);
assert.match(manager, /name="model"/);
assert.match(manager, /name="reasoningEffort"/);
assert.match(manager, /name="quality"/);
assert.doesNotMatch(manager, /gpt-[a-z0-9.-]+/i);

assert.match(manager, /<label htmlFor=/);
assert.match(manager, /min-h-11/);
assert.match(manager, /focus-visible:/);
assert.match(ui, /role="alert"/);
assert.match(manager, /aria-live=/);
assert.match(manager, /sm:grid-cols-2/);
assert.match(manager, /xl:grid-cols-2/);

for (const stateLabel of [
  "Dados inválidos",
  "Alteração concorrente",
  "Prova operacional não aprovada",
  "Falha de ativação",
  "Leitura da configuração falhou",
]) {
  assert.match(manager, new RegExp(stateLabel));
}

assert.doesNotMatch(ui, /from\s+["'][^"']*supabase/i);
assert.doesNotMatch(ui, /\.rpc\s*\(/);
assert.doesNotMatch(ui, /Database\s*\[/);
assert.doesNotMatch(ui, /\bRow\b/);
assert.doesNotMatch(ui, /benchmark|ranking|recomenda(?:ção|cao)/i);

console.log("ok - E21.2.4 admin UI lifecycle, options, actions and boundaries");

#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pluginDir = join(scriptDir, "..");
const repoRoot = join(pluginDir, "..", "..");
const manifestPath = join(pluginDir, ".codex-plugin", "plugin.json");
const marketplacePath = join(repoRoot, ".agents", "plugins", "marketplace.json");
const skillPath = join(pluginDir, "skills", "investigator-operational", "SKILL.md");
const presetsDir = join(pluginDir, "presets");
const validationDir = join(pluginDir, "validation", "scopes");

const requiredPresetFields = [
  "id",
  "title",
  "goal",
  "platforms",
  "requiredInputs",
  "checks",
  "allowedProbes",
  "blockedActions",
  "readyCriteria",
  "reportSections",
];

const forbiddenTerms = [
  ["lp", "factory", "investigator"].join("-"),
  ["agente", "investigativo", "universal"].join("-"),
  ["investigador", "operacional"].join("-"),
  ["LP Factory", "Investigator"].join(" "),
  ["Agente Investigativo", "Universal"].join(" "),
];

const results = [];

function pass(name, detail = "") {
  results.push({ status: "pass", name, detail });
}

function fail(name, detail) {
  results.push({ status: "fail", name, detail });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function checkExists(name, path) {
  if (existsSync(path)) {
    pass(name, relative(repoRoot, path));
    return true;
  }

  fail(name, `ausente: ${relative(repoRoot, path)}`);
  return false;
}

function runJsonScript(name, args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
    timeout: 20_000,
  });

  if (result.status !== 0) {
    fail(name, result.stderr.trim() || `codigo ${result.status}`);
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout);
    pass(name, "saida JSON valida");
    return parsed;
  } catch (error) {
    fail(name, `saida nao e JSON valido: ${error.message}`);
    return null;
  }
}

checkExists("manifest do plugin", manifestPath);
checkExists("marketplace local", marketplacePath);
checkExists("skill operacional", skillPath);
checkExists("diretorio de presets", presetsDir);
checkExists("diretorio de escopos de validacao", validationDir);

const manifest = existsSync(manifestPath) ? readJson(manifestPath) : null;
const marketplace = existsSync(marketplacePath) ? readJson(marketplacePath) : null;
const skillBody = existsSync(skillPath) ? readFileSync(skillPath, "utf8") : "";

if (manifest) {
  manifest.name === "agent-investigator"
    ? pass("manifest.name", manifest.name)
    : fail("manifest.name", `esperado agent-investigator, recebido ${manifest.name}`);

  manifest.interface?.displayName === "Investigator"
    ? pass("manifest displayName", manifest.interface.displayName)
    : fail("manifest displayName", "esperado Investigator");

  checkExists("manifest skills path", join(pluginDir, manifest.skills || ""));
}

if (marketplace) {
  const entry = marketplace.plugins?.find((plugin) => plugin.name === "agent-investigator");

  if (!entry) {
    fail("marketplace agent-investigator", "entrada ausente");
  } else {
    pass("marketplace agent-investigator", entry.source?.path || "");

    entry.source?.path === "./plugins/agent-investigator"
      ? pass("marketplace path canonico", entry.source.path)
      : fail("marketplace path canonico", `path recebido: ${entry.source?.path}`);
  }
}

if (skillBody) {
  skillBody.includes("name: investigator-operational")
    ? pass("skill frontmatter name", "investigator-operational")
    : fail("skill frontmatter name", "nome esperado ausente");

  for (const reference of [
    "automations/agent-investigator/README.md",
    "plugins/agent-investigator/tools/README.md",
    "plugins/agent-investigator/presets/README.md",
  ]) {
    skillBody.includes(reference)
      ? pass(`skill referencia ${reference}`, "presente")
      : fail(`skill referencia ${reference}`, "ausente");
  }
}

const presets = [];

if (existsSync(presetsDir)) {
  const presetFiles = readdirSync(presetsDir).filter((file) => file.endsWith(".json")).sort();
  const seenIds = new Set();

  for (const file of presetFiles) {
    const path = join(presetsDir, file);
    const preset = readJson(path);
    presets.push(preset);

    preset.id === file.replace(/\.json$/, "")
      ? pass(`preset id ${file}`, preset.id)
      : fail(`preset id ${file}`, `id recebido: ${preset.id}`);

    if (seenIds.has(preset.id)) {
      fail(`preset duplicado ${preset.id}`, file);
    } else {
      seenIds.add(preset.id);
    }

    for (const field of requiredPresetFields) {
      const value = preset[field];
      const valid = Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim() !== "";
      valid ? pass(`preset ${preset.id}.${field}`, "ok") : fail(`preset ${preset.id}.${field}`, "ausente ou vazio");
    }
  }

  presetFiles.length >= 7
    ? pass("quantidade minima de presets", String(presetFiles.length))
    : fail("quantidade minima de presets", `recebido ${presetFiles.length}`);
}

const presetIds = new Set(presets.map((preset) => preset.id));

if (existsSync(validationDir)) {
  const scopeFiles = readdirSync(validationDir).filter((file) => file.endsWith(".json")).sort();

  for (const file of scopeFiles) {
    const scope = readJson(join(validationDir, file));

    typeof scope.id === "string" && scope.id.trim() !== ""
      ? pass(`scope ${file}.id`, scope.id)
      : fail(`scope ${file}.id`, "ausente");

    Array.isArray(scope.presetIds) && scope.presetIds.length > 0
      ? pass(`scope ${file}.presetIds`, scope.presetIds.join(", "))
      : fail(`scope ${file}.presetIds`, "ausente ou vazio");

    for (const presetId of scope.presetIds || []) {
      presetIds.has(presetId)
        ? pass(`scope ${file} preset ${presetId}`, "existe")
        : fail(`scope ${file} preset ${presetId}`, "preset inexistente");
    }

    scope.mode === "read-only"
      ? pass(`scope ${file}.mode`, scope.mode)
      : fail(`scope ${file}.mode`, "esperado read-only");

    Array.isArray(scope.blockedActions) && scope.blockedActions.length > 0
      ? pass(`scope ${file}.blockedActions`, "ok")
      : fail(`scope ${file}.blockedActions`, "ausente ou vazio");
  }

  scopeFiles.length >= 3
    ? pass("quantidade minima de escopos de validacao", String(scopeFiles.length))
    : fail("quantidade minima de escopos de validacao", `recebido ${scopeFiles.length}`);
}

const listPresets = runJsonScript("script list-presets", [
  join("plugins", "agent-investigator", "scripts", "list-presets.mjs"),
]);

if (listPresets) {
  listPresets.total === presets.length
    ? pass("list-presets total", String(listPresets.total))
    : fail("list-presets total", `esperado ${presets.length}, recebido ${listPresets.total}`);
}

const readiness = runJsonScript("script tool-readiness", [
  join("plugins", "agent-investigator", "scripts", "tool-readiness.mjs"),
]);

if (readiness) {
  readiness.mode === "read-only"
    ? pass("tool-readiness modo", readiness.mode)
    : fail("tool-readiness modo", `recebido ${readiness.mode}`);

  readiness.secretsPolicy === "valores de secrets nao sao exibidos"
    ? pass("tool-readiness politica de secrets", readiness.secretsPolicy)
    : fail("tool-readiness politica de secrets", "politica inesperada");
}

const filesToScan = [
  manifestPath,
  marketplacePath,
  skillPath,
  join(pluginDir, "presets", "README.md"),
  join(pluginDir, "tools", "README.md"),
  join(repoRoot, "automations", "agent-investigator", "README.md"),
  join(repoRoot, "docs", "automations.md"),
].filter(existsSync);

for (const path of filesToScan) {
  const body = readFileSync(path, "utf8");
  for (const term of forbiddenTerms) {
    if (body.includes(term)) {
      fail(`termo legado ${term}`, relative(repoRoot, path));
    }
  }
}

if (!results.some((item) => item.name.startsWith("termo legado") && item.status === "fail")) {
  pass("termos legados", "nenhuma ocorrencia em arquivos canonicos");
}

const failed = results.filter((result) => result.status === "fail");

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      validator: "agent-investigator-operational",
      summary: {
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
      },
      results,
    },
    null,
    2,
  ),
);

if (failed.length > 0) {
  process.exitCode = 1;
}

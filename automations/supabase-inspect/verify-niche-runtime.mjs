import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

const allowedUnclearStatuses = new Set(["unclassified", "review_required"]);

function die(message) {
  console.error(message);
  process.exit(1);
}

function writeSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, markdown.endsWith("\n") ? markdown : `${markdown}\n`, "utf-8");
}

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    die(`Falta ${name}.`);
  }
  return value.trim();
}

function readInput() {
  const inputPath = resolve(process.env.NICHE_RUNTIME_INPUT_PATH || "../niche-runtime-results.json");
  const parsed = JSON.parse(readFileSync(inputPath, "utf-8"));

  if (!parsed || !Array.isArray(parsed.cases) || parsed.cases.length === 0) {
    die(`Arquivo de entrada invalido: ${inputPath}`);
  }

  return { inputPath, payload: parsed };
}

async function fetchAccountEvidence(client, subdomain) {
  const accountResult = await client.query(
    `select
       a.id,
       a.name,
       a.subdomain,
       a.status,
       ap.niche,
       anr.raw_input,
       anr.selected_taxon_id,
       bt.name as selected_taxon_name,
       anr.confidence,
       anr.should_use_deterministic_match,
       anr.should_escalate_to_ai,
       anr.ai_escalation_mode,
       anr.needs_admin_review,
       anr.reason,
       anr.resolution_status,
       anr.match_source,
       anr.score,
       anr.created_at,
       anr.updated_at
     from public.accounts a
     left join public.account_profiles ap
       on ap.account_id = a.id
     left join public.account_niche_resolutions anr
       on anr.account_id = a.id
     left join public.business_taxons bt
       on bt.id = anr.selected_taxon_id
     where a.subdomain = $1
     limit 1`,
    [subdomain],
  );

  const taxonomyResult = await client.query(
    `select count(*)::int as count
     from public.account_taxonomy at
     join public.accounts a
       on a.id = at.account_id
     where a.subdomain = $1`,
    [subdomain],
  );

  return {
    account: accountResult.rows[0] ?? null,
    taxonomyRows: Number(taxonomyResult.rows[0]?.count ?? 0),
  };
}

function assertCommon(testCase, evidence, failures) {
  const row = evidence.account;

  if (!row) {
    failures.push("conta nao encontrada pelo subdomain");
    return;
  }

  if (row.status !== "active") {
    failures.push(`accounts.status esperado active, recebido ${row.status ?? "null"}`);
  }

  if (row.name !== testCase.projectName) {
    failures.push(`accounts.name esperado ${testCase.projectName}, recebido ${row.name ?? "null"}`);
  }

  if (row.niche !== testCase.niche) {
    failures.push(`account_profiles.niche esperado ${testCase.niche}, recebido ${row.niche ?? "null"}`);
  }

  if (row.raw_input !== testCase.niche) {
    failures.push(`account_niche_resolutions.raw_input esperado ${testCase.niche}, recebido ${row.raw_input ?? "null"}`);
  }

  if (!row.resolution_status) {
    failures.push("account_niche_resolutions.resolution_status nao preenchido");
  }

  if (evidence.taxonomyRows !== 0) {
    failures.push(`account_taxonomy deveria ter 0 linhas, recebeu ${evidence.taxonomyRows}`);
  }
}

function assertStrong(row, failures) {
  if (row.resolution_status !== "deterministic_high_confidence") {
    failures.push(
      `resolution_status esperado deterministic_high_confidence, recebido ${row.resolution_status ?? "null"}`,
    );
  }

  if (!row.selected_taxon_id) {
    failures.push("selected_taxon_id deveria estar preenchido");
  }

  if (row.score === null || row.score === undefined) {
    failures.push("score deveria estar preenchido");
  }
}

function assertAlias(row, failures) {
  assertStrong(row, failures);

  if (!String(row.match_source ?? "").includes("alias")) {
    failures.push(`match_source deveria conter alias, recebido ${row.match_source ?? "null"}`);
  }
}

function assertUnclear(row, failures) {
  if (!allowedUnclearStatuses.has(row.resolution_status)) {
    failures.push(
      `resolution_status esperado unclassified ou review_required, recebido ${row.resolution_status ?? "null"}`,
    );
  }
}

function evaluateCase(testCase, evidence) {
  const failures = [];
  assertCommon(testCase, evidence, failures);

  if (evidence.account) {
    if (testCase.id === "strong_match") assertStrong(evidence.account, failures);
    if (testCase.id === "alias") assertAlias(evidence.account, failures);
    if (testCase.id === "unclear") assertUnclear(evidence.account, failures);
  }

  return {
    id: testCase.id,
    label: testCase.label,
    email: testCase.email,
    subdomain: testCase.subdomain,
    accountId: evidence.account?.id ?? null,
    accountStatus: evidence.account?.status ?? null,
    profileNiche: evidence.account?.niche ?? null,
    rawInput: evidence.account?.raw_input ?? null,
    selectedTaxonId: evidence.account?.selected_taxon_id ?? null,
    selectedTaxonName: evidence.account?.selected_taxon_name ?? null,
    confidence: evidence.account?.confidence ?? null,
    resolutionStatus: evidence.account?.resolution_status ?? null,
    matchSource: evidence.account?.match_source ?? null,
    score: evidence.account?.score ?? null,
    taxonomyRows: evidence.taxonomyRows,
    status: failures.length === 0 ? "passed" : "failed",
    failures,
  };
}

function renderSummary({ inputPath, appUrl, results }) {
  const passed = results.filter((entry) => entry.status === "passed").length;
  const failed = results.length - passed;

  writeSummary("# Runtime niche resolution verification");
  writeSummary(`- input_path: \`${inputPath}\``);
  writeSummary(`- app_url: \`${appUrl ?? "null"}\``);
  writeSummary(`- status: \`${failed === 0 ? "passed" : "failed"}\``);
  writeSummary(`- cases: \`${passed}/${results.length} passed\``);
  writeSummary("");
  writeSummary("| Caso | Subdomain | Status | Resolution | Taxon | Match source | Taxonomy rows |");
  writeSummary("| --- | --- | --- | --- | --- | --- | --- |");

  for (const result of results) {
    writeSummary(
      `| ${result.label} | \`${result.subdomain}\` | ${result.status} | \`${result.resolutionStatus ?? "null"}\` | \`${result.selectedTaxonName ?? result.selectedTaxonId ?? "null"}\` | \`${result.matchSource ?? "null"}\` | \`${result.taxonomyRows}\` |`,
    );
  }

  for (const result of results) {
    if (result.failures.length === 0) continue;
    writeSummary(`\n## Falhas - ${result.label}`);
    for (const failure of result.failures) {
      writeSummary(`- ${failure}`);
    }
  }
}

async function main() {
  const connectionString = requireEnv("SUPABASE_DB_URL_READONLY");
  const { inputPath, payload } = readInput();
  const client = new Client({ connectionString });
  const results = [];

  await client.connect();
  try {
    for (const testCase of payload.cases) {
      if (!testCase.subdomain) {
        results.push({
          id: testCase.id,
          label: testCase.label,
          email: testCase.email,
          subdomain: null,
          status: "failed",
          failures: ["subdomain ausente no arquivo de entrada"],
        });
        continue;
      }

      const evidence = await fetchAccountEvidence(client, testCase.subdomain);
      results.push(evaluateCase(testCase, evidence));
    }
  } finally {
    await client.end().catch(() => {});
  }

  const output = {
    kind: "niche_runtime_verification_results",
    appUrl: payload.appUrl ?? null,
    inputPath,
    completedAt: new Date().toISOString(),
    results,
  };

  console.log(JSON.stringify(output, null, 2));
  renderSummary({ inputPath, appUrl: payload.appUrl, results });

  if (results.some((entry) => entry.status !== "passed")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  die(`falha na verificacao runtime niche: ${error instanceof Error ? error.message : String(error)}`);
});

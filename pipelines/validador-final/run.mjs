import { appendFileSync, existsSync, readFileSync } from "node:fs";

const DEFAULT_BRIEFING_PATH =
  "pipelines/validador-final/templates/briefings/mvp1-login.json";

const REQUIRED_FIELDS = [
  "environment",
  "app_url",
  "login_email",
  "login_password",
  "expected_result_type",
  "expected_result_value",
];

function die(message) {
  console.error(message);
  process.exit(1);
}

function writeSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  try {
    appendFileSync(
      summaryPath,
      markdown.endsWith("\n") ? markdown : `${markdown}\n`,
      "utf-8",
    );
  } catch {
    // ignore summary write failure
  }
}

function maskPassword(value) {
  if (typeof value !== "string" || value.length === 0) return "(vazio)";
  return "***";
}

function loadBriefing() {
  const briefingPath =
    (process.env.BRIEFING_PATH || DEFAULT_BRIEFING_PATH).trim();

  if (!existsSync(briefingPath)) {
    die(`briefing_path não encontrado: ${briefingPath}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(briefingPath, "utf-8"));
  } catch (error) {
    die(
      `falha ao ler/parsear briefing JSON em ${briefingPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return { briefingPath, parsed };
}

function validateBriefing(briefing) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in briefing)) {
      die(`campo obrigatório ausente no briefing: ${field}`);
    }
  }

  if (!["preview", "production"].includes(briefing.environment)) {
    die("environment inválido: use preview ou production");
  }

  if (
    !["url_contains", "selector_visible"].includes(
      briefing.expected_result_type,
    )
  ) {
    die(
      "expected_result_type inválido: use url_contains ou selector_visible",
    );
  }

  for (const field of [
    "app_url",
    "login_email",
    "login_password",
    "expected_result_value",
  ]) {
    if (typeof briefing[field] !== "string" || briefing[field].trim() === "") {
      die(`campo inválido ou vazio no briefing: ${field}`);
    }
  }
}

function main() {
  const { briefingPath, parsed } = loadBriefing();
  validateBriefing(parsed);

  const output = {
    item: "3.5 Validador Final",
    stage: "item 5 do MR",
    status: "estrutura_base_ok",
    briefing_path: briefingPath,
    briefing_valid: true,
    next_step: "item 6 — implementar login real com Playwright",
  };

  console.log(JSON.stringify(output, null, 2));

  writeSummary("# Validador Final — estrutura base\n");
  writeSummary(`- item: \`3.5 Validador Final\``);
  writeSummary(`- stage: \`item 5 do MR\``);
  writeSummary(`- briefing_path: \`${briefingPath}\``);
  writeSummary(`- briefing_valid: \`true\``);
  writeSummary("");
  writeSummary("## Briefing validado");
  writeSummary(`- environment: \`${parsed.environment}\``);
  writeSummary(`- app_url: \`${parsed.app_url}\``);
  writeSummary(`- login_email: \`${parsed.login_email}\``);
  writeSummary(`- login_password: \`${maskPassword(parsed.login_password)}\``);
  writeSummary(
    `- expected_result_type: \`${parsed.expected_result_type}\``,
  );
  writeSummary(
    `- expected_result_value: \`${parsed.expected_result_value}\``,
  );
  writeSummary("");
  writeSummary(
    "> Estrutura base criada. Executor Playwright ainda não implementado.",
  );
}

main();

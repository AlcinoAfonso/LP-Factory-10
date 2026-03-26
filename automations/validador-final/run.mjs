import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { executeLoginAttempt } from "./login-playwright.mjs";

const DEFAULT_BRIEFING_PATH =
  "automations/validador-final/templates/briefings/mvp1-login.json";

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

function resolveOverrideOrFallback(fallbackValue, overrideEnvVar) {
  const overrideValue = process.env[overrideEnvVar];
  if (typeof overrideValue === "string" && overrideValue.trim() !== "") {
    return overrideValue.trim();
  }

  return fallbackValue;
}

async function main() {
  const { briefingPath, parsed } = loadBriefing();
  validateBriefing(parsed);

  const appUrlUsed = resolveOverrideOrFallback(parsed.app_url, "APP_URL_OVERRIDE");
  const loginEmail = resolveOverrideOrFallback(
    parsed.login_email,
    "LOGIN_EMAIL_OVERRIDE",
  );
  const loginPassword = resolveOverrideOrFallback(
    parsed.login_password,
    "LOGIN_PASSWORD_OVERRIDE",
  );

  const loginAttempt = await executeLoginAttempt({
    appUrl: appUrlUsed,
    loginEmail,
    loginPassword,
  });

  const output = {
    item: "3.5 Validador Final",
    stage: "item 6 do MR",
    briefing_path: briefingPath,
    app_url_used: appUrlUsed,
    login_attempt_executed: loginAttempt.login_attempt_executed,
    final_url: loginAttempt.final_url,
    ui_error: loginAttempt.ui_error,
    observed_result: loginAttempt.observed_result,
  };

  console.log(JSON.stringify(output, null, 2));

  writeSummary("# Validador Final — tentativa real de login (item 6)");
  writeSummary(`- item: \`${output.item}\``);
  writeSummary(`- stage: \`${output.stage}\``);
  writeSummary(`- briefing_path: \`${output.briefing_path}\``);
  writeSummary(`- environment: \`${parsed.environment}\``);
  writeSummary(`- app_url_used: \`${output.app_url_used}\``);
  writeSummary("- login_email: `provided`");
  writeSummary(`- login_attempt_executed: \`${output.login_attempt_executed}\``);
  writeSummary(`- final_url: \`${output.final_url ?? "null"}\``);
  writeSummary(`- has_ui_error: \`${output.ui_error ? "true" : "false"}\``);
  writeSummary(
    "- Fase 1: app_url manual por execução; credenciais reais via secrets override.",
  );
  writeSummary(
    "> Item 6 implementa apenas a tentativa real de login com Playwright. Validação oficial de sucesso, screenshot obrigatória e saída final do MVP 1 ficam para os próximos itens (7, 8 e 9).",
  );
}

main().catch((error) => {
  die(
    `falha ao executar tentativa real de login: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
});

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

function evaluateStatus({ expectedResultType, expectedResultValue, loginAttempt }) {
  if (expectedResultType === "url_contains") {
    const finalUrl = loginAttempt.final_url;
    const passed =
      typeof finalUrl === "string" && finalUrl.includes(expectedResultValue);
    return {
      status: passed ? "passed" : "failed",
      observedResult: passed
        ? `final_url contém o valor esperado: ${expectedResultValue}`
        : `final_url não contém o valor esperado: ${expectedResultValue}`,
    };
  }

  if (expectedResultType === "selector_visible") {
    const selectorVisible = loginAttempt.selector_visible_result === true;
    return {
      status: selectorVisible ? "passed" : "failed",
      observedResult: selectorVisible
        ? `seletor visível no estado final: ${expectedResultValue}`
        : `seletor não visível no estado final: ${expectedResultValue}`,
    };
  }

  return {
    status: "failed",
    observedResult: `tipo esperado não suportado: ${expectedResultType}`,
  };
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
    expectedResultType: parsed.expected_result_type,
    expectedResultValue: parsed.expected_result_value,
  });
  const evaluation = evaluateStatus({
    expectedResultType: parsed.expected_result_type,
    expectedResultValue: parsed.expected_result_value,
    loginAttempt,
  });

  const output = {
    item: "3.5 Validador Final",
    stage: "item 7 + item 8 mínimo do MR",
    status: evaluation.status,
    briefing_path: briefingPath,
    app_url_used: appUrlUsed,
    expected_result_type: parsed.expected_result_type,
    expected_result_value: parsed.expected_result_value,
    login_attempt_executed: loginAttempt.login_attempt_executed,
    final_url: loginAttempt.final_url,
    ui_error: loginAttempt.ui_error,
    observed_result: evaluation.observedResult,
    screenshot_path: loginAttempt.screenshot_path,
  };

  console.log(JSON.stringify(output, null, 2));

  writeSummary("# Validador Final — item 7 + item 8 mínimo");
  writeSummary(`- item: \`${output.item}\``);
  writeSummary(`- stage: \`${output.stage}\``);
  writeSummary(`- status: \`${output.status}\``);
  writeSummary(`- briefing_path: \`${output.briefing_path}\``);
  writeSummary(`- environment: \`${parsed.environment}\``);
  writeSummary(`- app_url_used: \`${output.app_url_used}\``);
  writeSummary(`- expected_result_type: \`${output.expected_result_type}\``);
  writeSummary(`- expected_result_value: \`${output.expected_result_value}\``);
  writeSummary(`- login_attempt_executed: \`${output.login_attempt_executed}\``);
  writeSummary(`- final_url: \`${output.final_url ?? "null"}\``);
  writeSummary(`- ui_error: \`${output.ui_error ?? "null"}\``);
  writeSummary(`- screenshot_path: \`${output.screenshot_path}\``);
  writeSummary(
    "- Fase 1: app_url, login_email e login_password manuais por execução.",
  );
}

main().catch((error) => {
  die(
    `falha ao executar tentativa real de login: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
});

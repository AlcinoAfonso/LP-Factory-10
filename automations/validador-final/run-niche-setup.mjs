import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAccount,
  hasAuthSuccessUrl,
  openAuth,
  withBrowserSession,
} from "./login-playwright.mjs";
import { findLatestEmailLinkForAlias } from "./mailbox-client.mjs";

const MAILBOX_POLL_TIMEOUT_MS = 120000;
const MAILBOX_POLL_INTERVAL_MS = 5000;
const DEFAULT_START_SEQUENCE = 100;
const DEFAULT_CASE_PRESET = "niche-resolution-20-6";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultOutputPath = resolve(scriptDir, "../niche-runtime-results.json");
const casesDir = resolve(scriptDir, "../niche-runtime-tests/cases");

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

function readStartSequence() {
  const raw = process.env.NICHE_RUNTIME_START_SEQUENCE;
  if (typeof raw !== "string" || raw.trim() === "") return DEFAULT_START_SEQUENCE;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    die(`NICHE_RUNTIME_START_SEQUENCE invalido: ${raw}`);
  }

  return parsed;
}

function readCasePreset() {
  const raw = process.env.NICHE_RUNTIME_CASE_PRESET;
  const preset = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : DEFAULT_CASE_PRESET;

  if (!/^[a-zA-Z0-9._-]+$/.test(preset)) {
    die(`NICHE_RUNTIME_CASE_PRESET invalido: ${preset}`);
  }

  return preset;
}

function defaultProjectSuffix(index) {
  if (index >= 0 && index < 26) return String.fromCharCode(65 + index);
  return String(index + 1);
}

function normalizeCase(rawCase, index, preset) {
  if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
    die(`Caso ${index + 1} invalido no preset ${preset}.`);
  }

  const niche = typeof rawCase.niche === "string" ? rawCase.niche.trim() : "";
  if (!niche) {
    die(`Caso ${index + 1} do preset ${preset} sem niche.`);
  }

  const sequenceOffset =
    rawCase.sequenceOffset === undefined ? index : Number.parseInt(String(rawCase.sequenceOffset), 10);

  if (!Number.isInteger(sequenceOffset) || sequenceOffset < 0) {
    die(`sequenceOffset invalido no caso ${index + 1} do preset ${preset}.`);
  }

  return {
    id: typeof rawCase.id === "string" && rawCase.id.trim() !== "" ? rawCase.id.trim() : `case_${index + 1}`,
    label:
      typeof rawCase.label === "string" && rawCase.label.trim() !== ""
        ? rawCase.label.trim()
        : `Caso ${index + 1}`,
    sequenceOffset,
    projectSuffix:
      typeof rawCase.projectSuffix === "string" && rawCase.projectSuffix.trim() !== ""
        ? rawCase.projectSuffix.trim()
        : defaultProjectSuffix(index),
    projectNameTemplate:
      typeof rawCase.projectNameTemplate === "string" && rawCase.projectNameTemplate.trim() !== ""
        ? rawCase.projectNameTemplate.trim()
        : null,
    niche,
  };
}

function readCases(casePreset) {
  const presetPath = resolve(casesDir, `${casePreset}.json`);
  const parsed = JSON.parse(readFileSync(presetPath, "utf-8"));
  const rawCases = Array.isArray(parsed) ? parsed : parsed?.cases;

  if (!Array.isArray(rawCases) || rawCases.length === 0) {
    die(`Preset ${casePreset} sem cases.`);
  }

  return rawCases.map((rawCase, index) => normalizeCase(rawCase, index, casePreset));
}

function buildAlias(sequence) {
  return `alcinoafonso380+convite${sequence}@gmail.com`;
}

function buildPassword(sequence) {
  return `Convite${sequence}!Aa`;
}

function buildProjectName(sequence, testCase) {
  if (testCase.projectNameTemplate) {
    return testCase.projectNameTemplate
      .replaceAll("{sequence}", String(sequence))
      .replaceAll("{suffix}", testCase.projectSuffix)
      .replaceAll("{id}", testCase.id);
  }

  return `Convite teste runtime ${sequence} ${testCase.projectSuffix}`;
}

function extractAccountSubdomain(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "a") return null;
    const subdomain = (parts[1] ?? "").trim().toLowerCase();
    if (!subdomain || subdomain === "home") return null;
    return subdomain;
  } catch {
    return null;
  }
}

function inspectUrlParts(value) {
  try {
    const parsed = new URL(value);
    return {
      pathname: parsed.pathname,
      search: parsed.search || "",
    };
  } catch {
    return { pathname: "invalid_url", search: "" };
  }
}

async function handleAuthConfirmInterstitial({ page, flowLabel }) {
  const initialTimeoutMs = 9000;
  const currentUrl = page.url();
  if (!currentUrl.includes("/auth/confirm")) {
    return { ok: true, detail: `${flowLabel}: sem intersticial /auth/confirm` };
  }

  try {
    await page.waitForURL((url) => !url.toString().includes("/auth/confirm"), {
      timeout: initialTimeoutMs,
    });
    return { ok: true, detail: `${flowLabel}: saiu automaticamente de /auth/confirm` };
  } catch {
    // Some previews render an explicit interstitial form. Submit it as the existing validador-final does.
  }

  const fallbackSubmitted = await page.evaluate(() => {
    const primary = document.querySelector("form#f");
    const secondary = document.querySelector('form[action="/auth/confirm"]');
    const form = primary || secondary;
    if (!form) return false;
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return true;
    }
    form.submit();
    return true;
  });

  if (fallbackSubmitted) {
    try {
      await page.waitForURL((url) => !url.toString().includes("/auth/confirm"), {
        timeout: initialTimeoutMs,
      });
      return { ok: true, detail: `${flowLabel}: saiu de /auth/confirm apos fallback` };
    } catch {
      return { ok: false, detail: `${flowLabel}: fallback enviado, mas continuou em /auth/confirm` };
    }
  }

  return { ok: false, detail: `${flowLabel}: intersticial /auth/confirm sem form submetivel` };
}

async function openSignupLink({ page, appOrigin, email }) {
  const signupMail = await findLatestEmailLinkForAlias({
    aliasEmail: email,
    timeoutMs: MAILBOX_POLL_TIMEOUT_MS,
    intervalMs: MAILBOX_POLL_INTERVAL_MS,
    linkIncludes: appOrigin,
    expectedLinkKind: "signup_confirmation",
  });

  const linkParts = inspectUrlParts(signupMail.matched_link);
  writeSummary(`- signup_mail_subject: \`${signupMail.matched_subject || "sem assunto"}\``);
  writeSummary(`- signup_mail_pathname: \`${linkParts.pathname}\``);
  writeSummary(`- signup_mail_search: \`${linkParts.search || "(empty)"}\``);

  await page.goto(signupMail.matched_link, { waitUntil: "domcontentloaded", timeout: 30000 });
  const interstitial = await handleAuthConfirmInterstitial({ page, flowLabel: "signup" });
  if (!interstitial.ok) throw new Error(interstitial.detail);
}

async function waitForAccountSubdomain(page) {
  await page.waitForURL((url) => url.pathname.startsWith("/a/"), { timeout: 20000 });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const subdomain = extractAccountSubdomain(page.url());
    if (subdomain) return subdomain;
    await page.waitForTimeout(500);
  }

  throw new Error(`nao foi possivel capturar subdomain a partir de ${page.url()}`);
}

async function firstVisible(page, locators) {
  for (const locator of locators) {
    if ((await locator.count()) > 0 && (await locator.first().isVisible().catch(() => false))) {
      return locator.first();
    }
  }
  return null;
}

async function fillPendingSetup(page, { projectName, niche }) {
  const nameInput = await firstVisible(page, [
    page.getByLabel(/nome do projeto/i),
    page.locator('input[name="name"]'),
  ]);

  if (!nameInput) {
    throw new Error(`campo Nome do projeto nao encontrado em ${page.url()}`);
  }

  const nicheInput = await firstVisible(page, [
    page.getByLabel(/^nicho$/i),
    page.locator('input[name="niche"]'),
  ]);

  if (!nicheInput) {
    throw new Error(`campo Nicho nao encontrado em ${page.url()}`);
  }

  await nameInput.fill(projectName);
  await nicheInput.fill(niche);

  const submit = await firstVisible(page, [
    page.getByRole("button", { name: /salvar e continuar|continuar|salvar/i }),
    page.locator('button[type="submit"]'),
  ]);

  if (!submit) {
    throw new Error(`botao de salvar pending_setup nao encontrado em ${page.url()}`);
  }

  await Promise.allSettled([
    page.waitForLoadState("networkidle", { timeout: 12000 }),
    submit.click(),
  ]);
  await page.waitForTimeout(2500);

  if (page.url().includes("/auth") || !hasAuthSuccessUrl(page.url())) {
    throw new Error(`pending_setup nao concluiu em rota autenticada: ${page.url()}`);
  }
}

async function runCase({ appUrl, appOrigin, testCase, sequence }) {
  const email = buildAlias(sequence);
  const password = buildPassword(sequence);
  const projectName = buildProjectName(sequence, testCase);

  return withBrowserSession(async ({ page }) => {
    await openAuth({ page, appUrl });

    const signupResult = await createAccount({ page, email, password });
    if (signupResult.collisionDetected) {
      throw new Error(`alias ${email} ja existe ou colidiu: ${signupResult.detail}`);
    }
    if (!signupResult.passed || signupResult.creationAccepted !== true) {
      throw new Error(`signup nao aceito para ${email}: ${signupResult.detail}`);
    }

    await openSignupLink({ page, appOrigin, email });
    await page.waitForTimeout(1200);

    const subdomain = await waitForAccountSubdomain(page);
    await fillPendingSetup(page, { projectName, niche: testCase.niche });

    return {
      id: testCase.id,
      label: testCase.label,
      sequence,
      email,
      password,
      projectName,
      niche: testCase.niche,
      subdomain,
      finalUrl: page.url(),
      status: "setup_submitted",
    };
  });
}

async function main() {
  const appUrl = requireEnv("APP_URL_OVERRIDE");
  requireEnv("MAILBOX_EMAIL");
  requireEnv("MAILBOX_PASSWORD");

  const appOrigin = new URL(appUrl).origin;
  const startSequence = readStartSequence();
  const casePreset = readCasePreset();
  const cases = readCases(casePreset);
  const outputPath = resolve(process.env.NICHE_RUNTIME_OUTPUT_PATH || defaultOutputPath);
  const startedAt = new Date().toISOString();
  const results = [];

  writeSummary("# Runtime niche setup");
  writeSummary(`- started_at: \`${startedAt}\``);
  writeSummary(`- app_url: \`${appUrl}\``);
  writeSummary(`- start_sequence: \`${startSequence}\``);
  writeSummary(`- case_preset: \`${casePreset}\``);

  for (const testCase of cases) {
    const sequence = startSequence + testCase.sequenceOffset;
    writeSummary(`\n## ${testCase.label}`);
    writeSummary(`- email: \`${buildAlias(sequence)}\``);
    writeSummary(`- niche: \`${testCase.niche}\``);

    const result = await runCase({ appUrl, appOrigin, testCase, sequence });
    results.push(result);

    writeSummary(`- subdomain: \`${result.subdomain}\``);
    writeSummary(`- final_url: \`${result.finalUrl}\``);
    writeSummary(`- status: \`${result.status}\``);
  }

  const payload = {
    kind: "niche_runtime_setup_results",
    appUrl,
    appOrigin,
    casePreset,
    startSequence,
    startedAt,
    completedAt: new Date().toISOString(),
    cases: results,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
  console.log(JSON.stringify(payload, null, 2));
  writeSummary(`\n- output_path: \`${outputPath}\``);
}

main().catch((error) => {
  die(`falha no runtime niche setup: ${error instanceof Error ? error.message : String(error)}`);
});

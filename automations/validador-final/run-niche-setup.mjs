import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
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

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultOutputPath = resolve(scriptDir, "../niche-runtime-results.json");

const cases = [
  {
    id: "strong_match",
    label: "Caso 1 - Match forte",
    sequenceOffset: 0,
    projectName: "Convite teste runtime 100 A",
    niche: "Harmonização Facial",
  },
  {
    id: "alias",
    label: "Caso 2 - Alias",
    sequenceOffset: 1,
    projectName: "Convite teste runtime 101 B",
    niche: "hof",
  },
  {
    id: "unclear",
    label: "Caso 3 - Sem candidato claro",
    sequenceOffset: 2,
    projectName: "Convite teste runtime 102 C",
    niche: "Beleza Facial",
  },
];

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

function buildAlias(sequence) {
  return `alcinoafonso380+convite${sequence}@gmail.com`;
}

function buildPassword(sequence) {
  return `Convite${sequence}!Aa`;
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

async function fillPendingSetup(page, testCase) {
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

  await nameInput.fill(testCase.projectName);
  await nicheInput.fill(testCase.niche);

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
    await fillPendingSetup(page, testCase);

    return {
      id: testCase.id,
      label: testCase.label,
      sequence,
      email,
      password,
      projectName: testCase.projectName,
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
  const outputPath = resolve(process.env.NICHE_RUNTIME_OUTPUT_PATH || defaultOutputPath);
  const startedAt = new Date().toISOString();
  const results = [];

  writeSummary("# Runtime niche setup");
  writeSummary(`- started_at: \`${startedAt}\``);
  writeSummary(`- app_url: \`${appUrl}\``);
  writeSummary(`- start_sequence: \`${startSequence}\``);

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

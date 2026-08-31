import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { assertMutationTarget, normalizeAccountSubdomain, parseAuthorizedAppOrigin } from "./policy.mjs";

const outputDir = resolve(process.env.AUTHENTICATED_QA_OUTPUT_DIR || "./results");
const scenario = process.env.AUTHENTICATED_QA_SCENARIO || "access_gates";
const allowedScenarios = new Set(["access_gates", "create_landing_page"]);

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Falta configuração obrigatória: ${name}`);
  }
  return value.trim();
}

function requireAppOrigin() {
  return parseAuthorizedAppOrigin(requireEnv("APP_URL_OVERRIDE"));
}

function sanitizeSlug(value) {
  return normalizeAccountSubdomain(value);
}

function writeSummary(line) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) appendFileSync(summaryPath, `${line}\n`, "utf-8");
}

function publicRoute(rawUrl) {
  const parsed = new URL(rawUrl);
  return `${parsed.pathname}${parsed.search}`;
}

async function saveScreenshot(page, name) {
  mkdirSync(outputDir, { recursive: true });
  const path = resolve(outputDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function login(page, { origin, email, password, nextPath }) {
  const loginUrl = new URL("/auth/login", origin);
  loginUrl.searchParams.set("next", nextPath);
  await page.goto(loginUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
  if (new URL(page.url()).origin !== origin) {
    throw new Error("Login redirecionou para origem não autorizada antes do preenchimento");
  }
  await page.getByLabel(/^E-?mail$/i).fill(email);
  await page.getByLabel(/^Senha$/i).fill(password);
  await page.getByRole("button", { name: /^Entrar$/i }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 20000 });
  if (new URL(page.url()).origin !== origin) {
    throw new Error("Login redirecionou para origem não autorizada após o envio");
  }
  if (page.url().includes("/auth/confirm/info")) {
    throw new Error(`Login sem acesso ao destino ${nextPath}`);
  }
}

async function assertHeading(page, name) {
  await page.getByRole("heading", { name, exact: true }).waitFor({ state: "visible", timeout: 15000 });
}

async function runAccountJourney(browser, config, results) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const accountPath = `/a/${config.accountSubdomain}`;
    await login(page, {
      origin: config.origin,
      email: config.accountEmail,
      password: config.accountPassword,
      nextPath: accountPath,
    });
    await page.goto(new URL(accountPath, config.origin).toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
    await assertHeading(page, "Landing pages");
    await saveScreenshot(page, "account-dashboard");
    results.push({ gate: "account_dashboard", status: "passed", route: publicRoute(page.url()) });

    if (scenario === "create_landing_page") {
      assertMutationTarget(config.origin);
      const suffix = `${process.env.GITHUB_RUN_ID || Date.now()}-${process.env.GITHUB_RUN_ATTEMPT || "1"}`;
      const pageName = `QA automatizada ${suffix}`;
      const pageSlug = `qa-automatizada-${suffix}`.toLowerCase();
      await page.getByText("Nova página", { exact: true }).click();
      await page.getByLabel("Nome", { exact: true }).fill(pageName);
      await page.getByLabel("Endereço curto", { exact: true }).fill(pageSlug);
      await page.getByRole("button", { name: "Criar página", exact: true }).click();
      await page.waitForURL((url) => /\/landing-pages\/[^/]+/.test(url.pathname), { timeout: 20000 });
      await assertHeading(page, pageName);
      await saveScreenshot(page, "landing-page-created");
      results.push({ gate: "create_landing_page", status: "passed", route: publicRoute(page.url()), name: pageName, slug: pageSlug });
    }

    await page.goto(new URL(config.adminPath, config.origin).toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForURL((url) => url.pathname === "/auth/confirm/info", { timeout: 15000 });
    await assertHeading(page, "Acesso não disponível");
    await saveScreenshot(page, "account-admin-negative-gate");
    results.push({ gate: "account_without_platform_admin", status: "passed", route: publicRoute(page.url()) });
  } finally {
    await context.close();
  }
}

async function runAdminJourney(browser, config, results) {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await login(page, {
      origin: config.origin,
      email: config.adminEmail,
      password: config.adminPassword,
      nextPath: config.adminPath,
    });
    await page.goto(new URL(config.adminPath, config.origin).toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.getByText("LP Factory Administrativo", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await assertHeading(page, "Estrutura da LP");
    await saveScreenshot(page, "admin-dashboard");
    results.push({ gate: "admin_dashboard", status: "passed", route: publicRoute(page.url()) });
  } finally {
    await context.close();
  }
}

async function main() {
  if (!allowedScenarios.has(scenario)) throw new Error(`AUTHENTICATED_QA_SCENARIO inválido: ${scenario}`);
  const config = {
    origin: requireAppOrigin(),
    accountSubdomain: sanitizeSlug(requireEnv("QA_ACCOUNT_SUBDOMAIN")),
    accountEmail: requireEnv("QA_ACCOUNT_EMAIL"),
    accountPassword: requireEnv("QA_ACCOUNT_PASSWORD"),
    adminEmail: requireEnv("QA_ADMIN_EMAIL"),
    adminPassword: requireEnv("QA_ADMIN_PASSWORD"),
    adminPath: "/admin/estrutura-lp?view=entradas",
  };
  const results = [];
  mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    await runAccountJourney(browser, config, results);
    await runAdminJourney(browser, config, results);
  } finally {
    await browser.close();
  }

  const report = {
    status: "passed",
    scenario,
    appOrigin: config.origin,
    accountSubdomain: config.accountSubdomain,
    generatedAt: new Date().toISOString(),
    results,
  };
  writeFileSync(resolve(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  writeSummary("## QA autenticada");
  writeSummary(`- status: \`${report.status}\``);
  writeSummary(`- scenario: \`${scenario}\``);
  writeSummary(`- app_origin: \`${config.origin}\``);
  for (const result of results) writeSummary(`- ${result.gate}: \`${result.status}\` — \`${result.route}\``);
}

main().catch((error) => {
  mkdirSync(outputDir, { recursive: true });
  const message = error instanceof Error ? error.message : String(error);
  writeFileSync(resolve(outputDir, "report.json"), `${JSON.stringify({ status: "failed", scenario, error: message }, null, 2)}\n`, "utf-8");
  writeSummary("## QA autenticada");
  writeSummary("- status: `failed`");
  writeSummary(`- error: \`${message.replaceAll("`", "'")}\``);
  console.error(message);
  process.exit(1);
});

import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`campo inválido ou vazio: ${field}`);
  }
}

async function resolveEmailInput(page) {
  const byLabel = page.getByLabel(/e-?mail/i);
  if (await byLabel.count()) return byLabel.first();

  const byType = page.locator('input[type="email"]');
  if (await byType.count()) return byType.first();

  const byTextbox = page.getByRole("textbox").first();
  if (await byTextbox.count()) return byTextbox;

  throw new Error("campo de e-mail não encontrado");
}

async function resolvePasswordInput(page) {
  const byLabel = page.getByLabel(/senha/i);
  if (await byLabel.count()) return byLabel.first();

  const byType = page.locator('input[type="password"]');
  if (await byType.count()) return byType.first();

  throw new Error("campo de senha não encontrado");
}

async function resolveSubmitButton(page) {
  const byRole = page.getByRole("button", { name: /entrar/i });
  if (await byRole.count()) return byRole.first();

  throw new Error("botão de login não encontrado");
}

async function extractUiError(page) {
  const candidates = [
    '[role="alert"]',
    '[aria-live="polite"]',
    '[aria-live="assertive"]',
    '[data-testid="auth-error"]',
    ".text-destructive",
  ];

  for (const selector of candidates) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      const text = (await locator.textContent())?.trim();
      if (text) return text;
    }
  }

  return null;
}

export async function executeLoginAttempt({
  appUrl,
  loginEmail,
  loginPassword,
  expectedResultType,
  expectedResultValue,
}) {
  assertNonEmptyString(appUrl, "app_url");
  assertNonEmptyString(loginEmail, "login_email");
  assertNonEmptyString(loginPassword, "login_password");
  assertNonEmptyString(expectedResultType, "expected_result_type");
  assertNonEmptyString(expectedResultValue, "expected_result_value");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const screenshotRelativePath =
    "automations/validador-final/artifacts/login-final-state.png";
  const screenshotPath = resolve(screenshotRelativePath);
  let selectorVisibleResult = null;

  try {
    await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    const emailInput = await resolveEmailInput(page);
    const passwordInput = await resolvePasswordInput(page);
    const submitButton = await resolveSubmitButton(page);

    await emailInput.fill(loginEmail);
    await passwordInput.fill(loginPassword);

    await Promise.allSettled([
      page.waitForLoadState("networkidle", { timeout: 8000 }),
      submitButton.click(),
    ]);

    await page.waitForTimeout(3000);
    if (expectedResultType === "selector_visible") {
      selectorVisibleResult = await page
        .locator(expectedResultValue)
        .first()
        .isVisible()
        .catch(() => false);
    }

    mkdirSync(dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const finalUrl = page.url();
    const uiError = await extractUiError(page);

    return {
      login_attempt_executed: true,
      final_url: finalUrl,
      ui_error: uiError,
      screenshot_path: screenshotRelativePath,
      selector_visible_result: selectorVisibleResult,
      observed_result: uiError
        ? "login submetido com erro visível na interface"
        : "login submetido sem erro visível imediato na interface",
      stage: "item_7_item_8_minimo_login_real_playwright",
    };
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

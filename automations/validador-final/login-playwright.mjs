import { chromium } from "@playwright/test";

function requireNonEmpty(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`campo inválido ou vazio: ${field}`);
  }
}

async function firstVisible(page, locators) {
  for (const locator of locators) {
    if ((await locator.count()) > 0 && (await locator.first().isVisible().catch(() => false))) {
      return locator.first();
    }
  }
  return null;
}

async function detectUiError(page) {
  const candidates = [
    '[role="alert"]',
    '[aria-live="assertive"]',
    '[aria-live="polite"]',
    '.text-destructive',
    '[data-testid="auth-error"]',
  ];

  for (const selector of candidates) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0) {
      const text = (await locator.textContent())?.trim();
      if (text) return text;
    }
  }

  const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
  const line = bodyText
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => /inválid|invalid|erro|error|incorret|incorrect|mismatch|diferent/i.test(entry));
  return line ?? null;
}

async function fillEmail(page, email) {
  const locator = await firstVisible(page, [
    page.getByLabel(/e-?mail/i),
    page.locator('input[type="email"]'),
    page.locator('input[name*="email" i]'),
    page.getByRole("textbox"),
  ]);

  if (!locator) {
    throw new Error("campo de e-mail não encontrado");
  }

  await locator.fill(email);
}

async function fillPassword(page, password, index = 0) {
  const byLabel = page.getByLabel(/senha|password/i);
  if ((await byLabel.count()) > index) {
    await byLabel.nth(index).fill(password);
    return;
  }

  const byType = page.locator('input[type="password"]');
  if ((await byType.count()) > index) {
    await byType.nth(index).fill(password);
    return;
  }

  throw new Error(`campo de senha não encontrado para índice ${index}`);
}

async function clickActionButton(page, regexes) {
  for (const regex of regexes) {
    const locator = page.getByRole("button", { name: regex }).first();
    if ((await locator.count()) > 0) {
      await Promise.allSettled([
        page.waitForLoadState("networkidle", { timeout: 8000 }),
        locator.click(),
      ]);
      return true;
    }
  }

  const submit = page.locator('button[type="submit"]').first();
  if ((await submit.count()) > 0) {
    await Promise.allSettled([
      page.waitForLoadState("networkidle", { timeout: 8000 }),
      submit.click(),
    ]);
    return true;
  }

  return false;
}

function hasAuthSuccessUrl(url) {
  return typeof url === "string" && url.includes("/a/");
}

async function getBodyText(page) {
  return ((await page.locator("body").innerText().catch(() => "")) || "").trim();
}

function hasCollisionSignal(text) {
  return /este\s+e-?mail\s+já\s+está\s+cadastrad|e-?mail\s+já\s+está\s+cadastrad|e-?mail\s+já\s+cadastrad|já\s+(existe|cadastrad)|already\s+(exists|registered)|in use|taken|duplicate|email.+(exists|cadastrad)|account.+exists|conta.+existe/i.test(
    text || "",
  );
}

function hasSuccessSignal(text) {
  return /cadastro\s+iniciado|sign-?up\s+started|clique\s+no\s+link\s+de\s+confirmação\s+no\s+e-?mail\s+que\s+enviamos|check\s+your\s+email\s+for\s+confirmation|enviamos.+e-?mail|link.+confirma/i.test(
    text || "",
  );
}

function hasNonRetryableErrorSignal(text) {
  return /too many|rate limit|captcha|temporar|indispon|unavailable|blocked|forbidden/i.test(text || "");
}

async function isStillInAuthFlow(page) {
  const authLikeUrl = /\/auth|\/login|\/signup|sign[-_]?in|sign[-_]?up/i.test(page.url());
  const emailFieldVisible = await page.locator('input[type="email"], input[name*="email" i]').first().isVisible().catch(() => false);
  const passwordFieldVisible = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
  return authLikeUrl || emailFieldVisible || passwordFieldVisible;
}

async function detectExistingAccountState(page, observedText) {
  const reenviarVisible =
    (await page.getByRole("button", { name: /reenviar confirma|resend confirm/i }).first().isVisible().catch(() => false)) ||
    (await page.getByRole("link", { name: /reenviar confirma|resend confirm/i }).first().isVisible().catch(() => false));

  const fazerLoginVisible =
    (await page.getByRole("button", { name: /fazer login|entrar|login/i }).first().isVisible().catch(() => false)) ||
    (await page.getByRole("link", { name: /fazer login|entrar|login/i }).first().isVisible().catch(() => false));

  const usarOutroEmailVisible = await page
    .getByRole("link", { name: /usar outro e-?mail|use another email/i })
    .first()
    .isVisible()
    .catch(() => false);

  const textCollision = hasCollisionSignal(observedText);
  const structuralCollision = reenviarVisible && (fazerLoginVisible || usarOutroEmailVisible);

  return {
    isCollision: textCollision || structuralCollision,
    textCollision,
    structuralCollision,
    reenviarVisible,
    fazerLoginVisible,
    usarOutroEmailVisible,
  };
}

function isExplicitSignupSuccess({ finalUrl, observedText }) {
  const successUrl = /\/auth\/sign-up-success(?:[/?#]|$)/i.test(finalUrl || "");
  const successText = hasSuccessSignal(observedText);
  return successUrl || successText;
}

async function evaluateSignupState(page, beforeSubmitUrl) {
  const uiError = await detectUiError(page);
  const bodyText = await getBodyText(page);
  const observedText = `${uiError || ""}\n${bodyText}`.trim();
  const existingAccountState = await detectExistingAccountState(page, observedText);
  const finalUrl = page.url();
  const explicitSignupSuccess = isExplicitSignupSuccess({ finalUrl, observedText });
  const stillInAuthFlow = await isStillInAuthFlow(page);
  const strongUrlTransition = finalUrl !== beforeSubmitUrl && !stillInAuthFlow;
  const hardError = hasNonRetryableErrorSignal(observedText);

  return {
    uiError,
    observedText,
    finalUrl,
    collisionDetected: existingAccountState.isCollision,
    existingAccountState,
    explicitSignupSuccess,
    strongUrlTransition,
    hardError,
  };
}

export async function withBrowserSession(handler, options = {}) {
  const browser = await chromium.launch({ headless: options.headless ?? true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    return await handler({ browser, context, page });
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export async function openAuth({ page, appUrl }) {
  requireNonEmpty(appUrl, "app_url");
  await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);

  return {
    passed: true,
    detail: `auth aberto em ${page.url()}`,
    finalUrl: page.url(),
  };
}

export async function createAccount({ page, email, password }) {
  requireNonEmpty(email, "email");
  requireNonEmpty(password, "password");

  const signupTriggers = [
    page.getByRole("link", { name: /criar conta|cadastre-se|registrar|sign up|signup/i }).first(),
    page.getByRole("button", { name: /criar conta|cadastre-se|registrar|sign up|signup/i }).first(),
  ];

  for (const trigger of signupTriggers) {
    if ((await trigger.count()) > 0) {
      await trigger.click().catch(() => {});
      await page.waitForTimeout(600);
      break;
    }
  }

  await fillEmail(page, email);
  await fillPassword(page, password, 0);
  const beforeSubmitUrl = page.url();

  const passwordFields = page.locator('input[type="password"]');
  if ((await passwordFields.count()) > 1) {
    await fillPassword(page, password, 1);
  }

  const clicked = await clickActionButton(page, [
    /criar conta|cadastrar|registrar|sign up|signup|continuar/i,
    /enviar|submit/i,
  ]);

  if (!clicked) {
    return {
      passed: false,
      creationAccepted: false,
      collisionDetected: false,
      hardError: true,
      detail: "botão de criação não encontrado",
    };
  }
  const POLL_TIMEOUT_MS = 8000;
  const POLL_INTERVAL_MS = 500;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= POLL_TIMEOUT_MS) {
    const state = await evaluateSignupState(page, beforeSubmitUrl);
    const hasSuccessEvidence = !state.collisionDetected && (state.explicitSignupSuccess || state.strongUrlTransition);

    if (state.collisionDetected) {
      return {
        passed: false,
        creationAccepted: false,
        collisionDetected: true,
        hardError: false,
        detail: state.existingAccountState.textCollision
          ? `alias não criado (colisão explícita de e-mail já cadastrado): ${state.uiError || "estado de conta existente"}`
          : "alias não criado (estado estrutural de conta existente: reenviar confirmação + fazer login/usar outro e-mail)",
        uiError: state.uiError,
        finalUrl: state.finalUrl,
      };
    }

    if (state.hardError) {
      return {
        passed: false,
        creationAccepted: false,
        collisionDetected: false,
        hardError: true,
        detail: `signup rejeitado por erro operacional duro: ${state.uiError || "falha operacional detectada"}`,
        uiError: state.uiError,
        finalUrl: state.finalUrl,
      };
    }

    if (hasSuccessEvidence) {
      return {
        passed: true,
        creationAccepted: true,
        collisionDetected: false,
        hardError: false,
        detail: /\/auth\/sign-up-success(?:[/?#]|$)/i.test(state.finalUrl)
          ? "signup aceito por estado explícito /auth/sign-up-success"
          : "signup aceito com evidência textual inequívoca (Cadastro iniciado / confirmação por e-mail)",
        uiError: state.uiError,
        finalUrl: state.finalUrl,
      };
    }

    await page.waitForTimeout(POLL_INTERVAL_MS);
  }

  const lastState = await evaluateSignupState(page, beforeSubmitUrl);
  return {
    passed: false,
    creationAccepted: false,
    collisionDetected: true,
    hardError: false,
    detail: "alias não criado (sem sucesso explícito no tempo de polling); tentando próximo sequence",
    uiError: lastState.uiError,
    finalUrl: lastState.finalUrl,
  };
}

export async function login({ page, email, password }) {
  requireNonEmpty(email, "email");
  requireNonEmpty(password, "password");

  await fillEmail(page, email);
  await fillPassword(page, password, 0);

  const clicked = await clickActionButton(page, [/entrar|login|acessar/i]);
  if (!clicked) {
    return { passed: false, authenticated: false, detail: "botão de login não encontrado", finalUrl: page.url() };
  }

  await page.waitForTimeout(1800);
  const finalUrl = page.url();
  const uiError = await detectUiError(page);
  const authenticated = hasAuthSuccessUrl(finalUrl);

  return {
    passed: authenticated,
    authenticated,
    uiError,
    detail: authenticated ? "login autenticado" : `login sem autenticação: ${uiError ?? "sem erro explícito"}`,
    finalUrl,
  };
}

export async function logout({ page }) {
  const logoutTargets = [
    page.getByRole("button", { name: /sair|logout|sign out/i }),
    page.getByRole("link", { name: /sair|logout|sign out/i }),
  ];
  let trigger = await firstVisible(page, logoutTargets);

  if (!trigger) {
    const menuTriggers = [
      page.getByRole("button", { name: /perfil|conta|usuário|usuario|menu|account|profile/i }),
      page.locator('button[aria-haspopup="menu"]'),
      page.locator('[data-testid*="avatar"], [class*="avatar"], img[alt*="avatar" i]'),
    ];

    const menuTrigger = await firstVisible(page, menuTriggers);
    if (menuTrigger) {
      await menuTrigger.click().catch(() => {});
      await page.waitForTimeout(600);
      trigger = await firstVisible(page, logoutTargets);
    }
  }

  if (!trigger) {
    return { passed: false, detail: "ação de logout não encontrada", finalUrl: page.url() };
  }

  await Promise.allSettled([
    page.waitForLoadState("networkidle", { timeout: 8000 }),
    trigger.click(),
  ]);
  await page.waitForTimeout(1200);

  const finalUrl = page.url();
  return {
    passed: !hasAuthSuccessUrl(finalUrl),
    detail: !hasAuthSuccessUrl(finalUrl) ? "logout concluído" : "logout não removeu sessão",
    finalUrl,
  };
}

export async function requestPasswordReset({ page, email }) {
  requireNonEmpty(email, "email");

  const forgot = await firstVisible(page, [
    page.getByRole("link", { name: /esqueci|forgot|reset/i }),
    page.getByRole("button", { name: /esqueci|forgot|reset/i }),
  ]);

  if (!forgot) {
    return { passed: false, detail: "entrada de forgot password não encontrada", finalUrl: page.url() };
  }

  await forgot.click();
  await page.waitForTimeout(500);
  await fillEmail(page, email);

  const clicked = await clickActionButton(page, [/enviar|send|reset|redefinir|continuar/i]);
  if (!clicked) {
    return { passed: false, detail: "botão de envio de reset não encontrado", finalUrl: page.url() };
  }

  await page.waitForTimeout(1200);
  const uiError = await detectUiError(page);
  const failed = uiError && /obrigat|invalid|erro|error/i.test(uiError);

  return {
    passed: !failed,
    detail: failed ? `reset rejeitado: ${uiError}` : "reset solicitado",
    uiError,
    finalUrl: page.url(),
  };
}

export async function submitNewPassword({ page, newPassword, confirmPassword }) {
  requireNonEmpty(newPassword, "new_password");
  requireNonEmpty(confirmPassword, "confirm_password");

  await fillPassword(page, newPassword, 0);
  await fillPassword(page, confirmPassword, 1);

  const clicked = await clickActionButton(page, [/alterar|redefinir|save|confirmar|continuar/i]);
  if (!clicked) {
    return { passed: false, mismatchDetected: false, detail: "botão de confirmação de senha não encontrado", finalUrl: page.url() };
  }

  await page.waitForTimeout(1500);

  const uiError = await detectUiError(page);
  const bodyText = ((await page.locator("body").innerText().catch(() => "")) || "").trim();
  const mismatchDetected = /não confere|senhas?.*(diferent|iguais|coincid)|must match|diferent|mismatch|do not match/i.test(
    `${uiError || ""}\n${bodyText}`,
  );

  return {
    passed: !mismatchDetected,
    mismatchDetected,
    uiError,
    detail: mismatchDetected ? `erro esperado de mismatch: ${uiError}` : "nova senha submetida",
    finalUrl: page.url(),
  };
}

export { hasAuthSuccessUrl };

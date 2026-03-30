import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAccount,
  hasAuthSuccessUrl,
  login,
  logout,
  openAuth,
  requestPasswordReset,
  submitNewPassword,
  withBrowserSession,
} from "./login-playwright.mjs";
import { findLatestEmailLinkForAlias } from "./mailbox-client.mjs";

const MAX_ALIAS_RETRIES = 20;
const MAILBOX_POLL_TIMEOUT_MS = 120000;
const MAILBOX_POLL_INTERVAL_MS = 5000;
const INITIAL_SEQUENCE = 30;

const criticalSteps = new Set([
  "create_account_request",
  "open_signup_link_from_email",
  "validate_created_account_usable",
  "login_correct_password",
  "forgot_password_request",
  "open_reset_link_from_email",
  "reset_password_success",
  "login_with_new_password",
]);

const scriptDir = dirname(fileURLToPath(import.meta.url));
const statePath = resolve(scriptDir, "state/test-account.json");

function die(message) {
  console.error(message);
  process.exit(1);
}

function writeSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, markdown.endsWith("\n") ? markdown : `${markdown}\n`, "utf-8");
}

function nowIso() {
  return new Date().toISOString();
}

function ensureStateFile() {
  if (existsSync(statePath)) return;

  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        email: "",
        password: "",
        status: "empty",
        sequence: INITIAL_SEQUENCE,
        last_updated_at: null,
      },
      null,
      2,
    ),
  );
}

function loadState() {
  ensureStateFile();

  const parsed = JSON.parse(readFileSync(statePath, "utf-8"));
  return {
    email: typeof parsed.email === "string" ? parsed.email : "",
    password: typeof parsed.password === "string" ? parsed.password : "",
    status: typeof parsed.status === "string" ? parsed.status : "empty",
    sequence: Number.isInteger(parsed.sequence) ? parsed.sequence : INITIAL_SEQUENCE,
    last_updated_at: parsed.last_updated_at ?? null,
  };
}

function extractSequenceFromAliasEmail(email) {
  if (typeof email !== "string" || email.trim() === "") return null;
  const match = email.toLowerCase().match(/\+convite(\d+)(?=@)/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeStateSequence(state) {
  const aliasSequence = extractSequenceFromAliasEmail(state.email);
  const nextFromAlias = aliasSequence === null ? null : aliasSequence + 1;
  const effectiveSequence =
    nextFromAlias === null ? state.sequence : Math.max(state.sequence, nextFromAlias);

  return {
    effectiveSequence,
    aliasSequence,
    normalized: effectiveSequence !== state.sequence,
  };
}

function saveState(nextState) {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(`${statePath}`, `${JSON.stringify(nextState, null, 2)}\n`, "utf-8");
}

function savePendingConfirmationState({ sequence, email, password }) {
  saveState({
    email,
    password,
    status: "pending_confirmation",
    sequence: sequence + 1,
    last_updated_at: nowIso(),
  });
}

function saveActiveState({ sequence, email, password }) {
  saveState({
    email,
    password,
    status: "active",
    sequence: sequence + 1,
    last_updated_at: nowIso(),
  });
}

function saveStateWithAdvancedSequence({ state, nextSequence }) {
  saveState({
    email: state.email,
    password: state.password,
    status: state.status,
    sequence: nextSequence,
    last_updated_at: nowIso(),
  });
}

function requireAppUrl() {
  const value = process.env.APP_URL_OVERRIDE;
  if (typeof value !== "string" || value.trim() === "") {
    die("APP_URL_OVERRIDE obrigatório (workflow input app_url)");
  }
  return value.trim();
}

function buildAlias(sequence) {
  return `alcinoafonso380+convite${sequence}@gmail.com`;
}

function buildPassword(sequence) {
  return `Convite${sequence}!Aa`;
}

function evaluateGlobalStatus(steps) {
  const criticalFailed = steps.some((entry) => criticalSteps.has(entry.step) && entry.status === "failed");
  if (criticalFailed) return "failed";

  const hasAnyFailed = steps.some((entry) => entry.status === "failed");
  return hasAnyFailed ? "partial" : "passed";
}

function pushStep(steps, step, status, detail) {
  steps.push({ step, status, detail });
}

function shouldStopOnCriticalFailure(step, status) {
  return criticalSteps.has(step) && status === "failed";
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

async function writeAuthErrorSummary({ page, flowLabel }) {
  const errorTitle = await page.title().catch(() => "");
  const errorBodySnippet = ((await page.locator("body").innerText().catch(() => "")) || "")
    .trim()
    .slice(0, 300);
  writeSummary(`- ${flowLabel}_error_title: \`${errorTitle || "(empty)"}\``);
  writeSummary(`- ${flowLabel}_error_body_snippet: \`${errorBodySnippet || "(empty)"}\``);
}

async function openAndLogAuthLink({ page, flowLabel, matchedLinkRaw, matchedLinkSanitized, matchedLink }) {
  const linkParts = inspectUrlParts(matchedLink);
  writeSummary(`- ${flowLabel}_mail_matched_link_raw: \`${matchedLinkRaw ?? matchedLink}\``);
  writeSummary(`- ${flowLabel}_mail_matched_link_sanitized: \`${matchedLinkSanitized ?? matchedLink}\``);
  writeSummary(`- ${flowLabel}_mail_matched_link: \`${matchedLink}\``);
  writeSummary(`- ${flowLabel}_mail_pathname: \`${linkParts.pathname}\``);
  writeSummary(`- ${flowLabel}_mail_search: \`${linkParts.search || "(empty)"}\``);

  await page.goto(matchedLink, { waitUntil: "domcontentloaded", timeout: 30000 });
  writeSummary(`- ${flowLabel}_after_goto_url: \`${page.url()}\``);

  if (page.url().includes("/auth/error")) {
    await writeAuthErrorSummary({ page, flowLabel });
  }
}

async function handleAuthConfirmInterstitial({ page, flowLabel }) {
  const INITIAL_TIMEOUT_MS = 9000;
  const currentUrl = page.url();
  if (!currentUrl.includes("/auth/confirm")) {
    return { ok: true, detail: `${flowLabel}: sem intersticial /auth/confirm` };
  }

  writeSummary(`- ${flowLabel}_auth_confirm_initial_url: \`${currentUrl}\``);

  try {
    await page.waitForURL((url) => !url.toString().includes("/auth/confirm"), { timeout: INITIAL_TIMEOUT_MS });
    writeSummary(`- ${flowLabel}_auth_confirm_after_auto_wait_url: \`${page.url()}\``);
    return { ok: true, detail: `${flowLabel}: saiu automaticamente de /auth/confirm` };
  } catch {
    writeSummary(`- ${flowLabel}_auth_confirm_auto_wait_timeout: \`true\``);
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

  writeSummary(`- ${flowLabel}_auth_confirm_fallback_submitted: \`${fallbackSubmitted}\``);

  if (fallbackSubmitted) {
    try {
      await page.waitForURL((url) => !url.toString().includes("/auth/confirm"), { timeout: INITIAL_TIMEOUT_MS });
      writeSummary(`- ${flowLabel}_auth_confirm_after_fallback_url: \`${page.url()}\``);
      return { ok: true, detail: `${flowLabel}: saiu de /auth/confirm após fallback` };
    } catch {
      writeSummary(`- ${flowLabel}_auth_confirm_fallback_wait_timeout: \`true\``);
    }
  }

  const title = await page.title().catch(() => "");
  const bodySnippet = ((await page.locator("body").innerText().catch(() => "")) || "")
    .trim()
    .slice(0, 300);

  writeSummary(`- ${flowLabel}_auth_confirm_final_url: \`${page.url()}\``);
  writeSummary(`- ${flowLabel}_auth_confirm_title: \`${title || "(empty)"}\``);
  writeSummary(`- ${flowLabel}_auth_confirm_body_snippet: \`${bodySnippet || "(empty)"}\``);

  return {
    ok: false,
    detail: `${flowLabel}: permaneceu em /auth/confirm após espera automática e fallback`,
  };
}

async function main() {
  const appUrl = requireAppUrl();
  const appOrigin = new URL(appUrl).origin;
  let state = loadState();
  const sequenceNormalization = normalizeStateSequence(state);
  if (sequenceNormalization.normalized) {
    state = {
      ...state,
      sequence: sequenceNormalization.effectiveSequence,
      last_updated_at: nowIso(),
    };
    saveState(state);
  }
  const steps = [];
  const runStartedAt = nowIso();

  let usedSequence = state.sequence;
  let activeEmail = null;
  let activePassword = null;

  await withBrowserSession(async ({ page }) => {
    await openAuth({ page, appUrl });

    let created = null;
    let lastTriedSequence = state.sequence - 1;
    for (let retry = 0; retry <= MAX_ALIAS_RETRIES; retry += 1) {
      const candidateSequence = state.sequence + retry;
      lastTriedSequence = candidateSequence;
      const candidateEmail = buildAlias(candidateSequence);
      const candidatePassword = buildPassword(candidateSequence);

      const signupResult = await createAccount({
        page,
        email: candidateEmail,
        password: candidatePassword,
      });

      if (signupResult.collisionDetected) {
        pushStep(
          steps,
          "create_account_collision_retry",
          "passed",
          `colisão para ${candidateEmail}: ${signupResult.detail}; tentando próximo sequence`,
        );
        await openAuth({ page, appUrl });
        continue;
      }

      if (signupResult.hardError === true) {
        pushStep(steps, "create_account_request", "failed", signupResult.detail);
        return;
      }

      if (!signupResult.passed || signupResult.creationAccepted !== true) {
        pushStep(
          steps,
          "create_account_collision_retry",
          "passed",
          `alias não criado para ${candidateEmail}: ${signupResult.detail}; tentando próximo sequence`,
        );
        await openAuth({ page, appUrl });
        continue;
      }

      created = { sequence: candidateSequence, email: candidateEmail, password: candidatePassword };
      pushStep(
        steps,
        "create_account_request",
        "passed",
        `conta criada: ${candidateEmail} (${signupResult.detail})`,
      );
      break;
    }

    if (!created) {
      const nextSequence = lastTriedSequence + 1;
      saveStateWithAdvancedSequence({ state, nextSequence });
      pushStep(
        steps,
        "create_account_collision_retry",
        "failed",
        `limite excedido de colisões (${MAX_ALIAS_RETRIES}); faixa tentada ${state.sequence}..${lastTriedSequence}; próximo sequence persistido: ${nextSequence}`,
      );
      return;
    }

    usedSequence = created.sequence;
    activeEmail = created.email;
    activePassword = created.password;

    savePendingConfirmationState({
      sequence: usedSequence,
      email: activeEmail,
      password: activePassword,
    });

    let signupMail;
    try {
      signupMail = await findLatestEmailLinkForAlias({
        aliasEmail: activeEmail,
        timeoutMs: MAILBOX_POLL_TIMEOUT_MS,
        intervalMs: MAILBOX_POLL_INTERVAL_MS,
        linkIncludes: appOrigin,
        expectedLinkKind: "signup_confirmation",
      });
      pushStep(
        steps,
        "open_signup_link_from_email",
        "passed",
        `link de confirmação encontrado: ${signupMail.matched_subject || "sem assunto"}`,
      );
    } catch (error) {
      pushStep(
        steps,
        "open_signup_link_from_email",
        "failed",
        error instanceof Error ? error.message : String(error),
      );
      return;
    }

    await openAndLogAuthLink({
      page,
      flowLabel: "signup",
      matchedLinkRaw: signupMail.matched_link_raw,
      matchedLinkSanitized: signupMail.matched_link_sanitized,
      matchedLink: signupMail.matched_link,
    });
    const signupInterstitial = await handleAuthConfirmInterstitial({ page, flowLabel: "signup" });
    if (!signupInterstitial.ok) {
      pushStep(steps, "validate_created_account_usable", "failed", signupInterstitial.detail);
      return;
    }
    await page.waitForTimeout(1200);
    const usable = !page.url().includes("/auth") || hasAuthSuccessUrl(page.url());
    pushStep(
      steps,
      "validate_created_account_usable",
      usable ? "passed" : "failed",
      usable ? `conta utilizável em ${page.url()}` : `conta não validada em ${page.url()}`,
    );
    if (!usable) return;

    saveActiveState({
      sequence: usedSequence,
      email: activeEmail,
      password: activePassword,
    });

    const logoutAfterSignup = await logout({ page });
    pushStep(
      steps,
      "logout_after_login",
      logoutAfterSignup.passed ? "passed" : "failed",
      logoutAfterSignup.detail,
    );

    await openAuth({ page, appUrl });
    const wrongLogin = await login({ page, email: activeEmail, password: `${activePassword}-errada` });
    const wrongLoginPassed = !wrongLogin.authenticated && Boolean(wrongLogin.uiError);
    pushStep(
      steps,
      "login_wrong_password",
      wrongLoginPassed ? "passed" : "failed",
      wrongLoginPassed ? "erro esperado detectado" : wrongLogin.detail,
    );

    await openAuth({ page, appUrl });
    const correctLogin = await login({ page, email: activeEmail, password: activePassword });
    const correctLoginPassed = hasAuthSuccessUrl(correctLogin.finalUrl);
    pushStep(
      steps,
      "login_correct_password",
      correctLoginPassed ? "passed" : "failed",
      correctLoginPassed ? "login correto com /a/" : correctLogin.detail,
    );
    if (!correctLoginPassed) return;

    await openAuth({ page, appUrl });
    const forgotResult = await requestPasswordReset({ page, email: activeEmail });
    pushStep(
      steps,
      "forgot_password_request",
      forgotResult.passed ? "passed" : "failed",
      forgotResult.detail,
    );
    if (!forgotResult.passed) return;

    let resetMail;
    try {
      resetMail = await findLatestEmailLinkForAlias({
        aliasEmail: activeEmail,
        timeoutMs: MAILBOX_POLL_TIMEOUT_MS,
        intervalMs: MAILBOX_POLL_INTERVAL_MS,
        linkIncludes: appOrigin,
        expectedLinkKind: "password_reset",
      });
      pushStep(steps, "open_reset_link_from_email", "passed", `link de reset encontrado: ${resetMail.matched_subject || "sem assunto"}`);
    } catch (error) {
      pushStep(
        steps,
        "open_reset_link_from_email",
        "failed",
        error instanceof Error ? error.message : String(error),
      );
      return;
    }

    await openAndLogAuthLink({
      page,
      flowLabel: "reset",
      matchedLinkRaw: resetMail.matched_link_raw,
      matchedLinkSanitized: resetMail.matched_link_sanitized,
      matchedLink: resetMail.matched_link,
    });
    await handleAuthConfirmInterstitial({ page, flowLabel: "reset" });
    const mismatchAttempt = await submitNewPassword({
      page,
      newPassword: `${activePassword}X`,
      confirmPassword: `${activePassword}Y`,
    });
    pushStep(
      steps,
      "reset_password_mismatch",
      mismatchAttempt.mismatchDetected ? "passed" : "failed",
      mismatchAttempt.detail,
    );

    const nextPassword = `Reset${usedSequence}!Bb`;
    const successReset = await submitNewPassword({
      page,
      newPassword: nextPassword,
      confirmPassword: nextPassword,
    });
    pushStep(
      steps,
      "reset_password_success",
      successReset.passed ? "passed" : "failed",
      successReset.detail,
    );
    if (!successReset.passed) return;

    activePassword = nextPassword;
    saveActiveState({
      sequence: usedSequence,
      email: activeEmail,
      password: activePassword,
    });

    const authenticatedAfterReset = hasAuthSuccessUrl(page.url());
    pushStep(
      steps,
      "validate_authenticated_after_reset_success",
      authenticatedAfterReset ? "passed" : "failed",
      authenticatedAfterReset ? `sessão autenticada após reset em ${page.url()}` : `reset não retornou sessão autenticada (${page.url()})`,
    );
    if (!authenticatedAfterReset) return;

    const logoutAfterReset = await logout({ page });
    pushStep(
      steps,
      "logout_after_reset_success",
      logoutAfterReset.passed ? "passed" : "failed",
      logoutAfterReset.detail,
    );
    if (!logoutAfterReset.passed) return;

    await openAuth({ page, appUrl });
    const loginWithNewPassword = await login({
      page,
      email: activeEmail,
      password: activePassword,
    });
    const loginWithNewPasswordPassed = hasAuthSuccessUrl(loginWithNewPassword.finalUrl);
    pushStep(
      steps,
      "login_with_new_password",
      loginWithNewPasswordPassed ? "passed" : "failed",
      loginWithNewPasswordPassed ? "login com nova senha validado" : loginWithNewPassword.detail,
    );
    if (!loginWithNewPasswordPassed) return;

    const finalLogout = await logout({ page });
    pushStep(steps, "logout_final", finalLogout.passed ? "passed" : "failed", finalLogout.detail);
  });

  const status = evaluateGlobalStatus(steps);
  const output = {
    item: "3.5 Validador Final",
    stage: "fase_2_fluxo_deterministico",
    status,
    app_url_used: appUrl,
    active_account_email: activeEmail,
    steps,
    last_updated_at: nowIso(),
  };

  console.log(JSON.stringify(output, null, 2));

  writeSummary("# Validador Final — fase 2 (determinístico)");
  writeSummary(`- run_started_at: \`${runStartedAt}\``);
  writeSummary(
    `- sequence_start: \`${state.sequence}\`${
      sequenceNormalization.aliasSequence === null
        ? ""
        : ` (normalizado com alias convite${sequenceNormalization.aliasSequence})`
    }`,
  );
  writeSummary(`- status: \`${status}\``);
  writeSummary(`- app_url_used: \`${appUrl}\``);
  writeSummary(`- active_account_email: \`${activeEmail ?? "null"}\``);
  for (const step of steps) {
    writeSummary(`- ${step.step}: **${step.status}** — ${step.detail}`);
  }

  if (steps.some((entry) => shouldStopOnCriticalFailure(entry.step, entry.status))) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  die(`falha no orquestrador determinístico: ${error instanceof Error ? error.message : String(error)}`);
});

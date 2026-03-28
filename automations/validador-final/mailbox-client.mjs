import { chromium } from "@playwright/test";

const GMAIL_URL = "https://mail.google.com/mail/u/0/#inbox";

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`env obrigatório ausente: ${name}`);
  }
  return value.trim();
}

async function loginGmailIfNeeded(page, mailboxEmail, mailboxPassword) {
  if (page.url().includes("mail.google.com/mail")) {
    return;
  }

  const identifier = page.locator('input[type="email"], input#identifierId').first();
  if ((await identifier.count()) > 0) {
    await identifier.fill(mailboxEmail);
    await page.getByRole("button", { name: /next|próxima|avançar/i }).first().click();
    await page.waitForTimeout(1000);
  }

  const password = page.locator('input[type="password"]').first();
  if ((await password.count()) > 0) {
    await password.fill(mailboxPassword);
    await page.getByRole("button", { name: /next|próxima|avançar/i }).first().click();
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
  await page.waitForTimeout(2500);
}

async function searchByAlias(page, aliasEmail) {
  const searchInput = page
    .locator('input[aria-label*="Search mail" i], input[aria-label*="Pesquisar" i], input[name="q"]')
    .first();

  if ((await searchInput.count()) === 0) {
    throw new Error("campo de pesquisa do Gmail não encontrado");
  }

  const query = `to:${aliasEmail}`;
  await searchInput.fill(query);
  await searchInput.press("Enter");
  await page.waitForTimeout(1600);
}

async function openMostRecentEmail(page) {
  const row = page.locator("tr.zA, div[role='main'] tr").first();
  if ((await row.count()) === 0) {
    return false;
  }

  await row.click();
  await page.waitForTimeout(1200);
  return true;
}

async function extractBestLink(page, linkIncludes) {
  const links = page.locator('a[href^="http"]');
  const count = await links.count();

  for (let i = 0; i < count; i += 1) {
    const href = await links.nth(i).getAttribute("href");
    if (!href) continue;
    if (!linkIncludes || href.includes(linkIncludes)) {
      return href;
    }
  }

  return null;
}

export async function findLatestEmailLinkForAlias({
  aliasEmail,
  timeoutMs = 120000,
  intervalMs = 5000,
  linkIncludes,
}) {
  if (typeof aliasEmail !== "string" || aliasEmail.trim() === "") {
    throw new Error("aliasEmail obrigatório");
  }

  const mailboxEmail = requireEnv("MAILBOX_EMAIL");
  const mailboxPassword = requireEnv("MAILBOX_PASSWORD");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const startedAt = Date.now();

  try {
    await page.goto(GMAIL_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await loginGmailIfNeeded(page, mailboxEmail, mailboxPassword);

    while (Date.now() - startedAt <= timeoutMs) {
      await page.goto(GMAIL_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
      await searchByAlias(page, aliasEmail);

      const opened = await openMostRecentEmail(page);
      if (opened) {
        const matchedLink = await extractBestLink(page, linkIncludes);
        const matchedSubject =
          (await page.locator("h2.hP, h2[data-thread-perm-id]").first().textContent().catch(() => null))?.trim() ||
          "";
        const matchedReceivedAt =
          (await page.locator("time, span.g3").first().getAttribute("datetime").catch(() => null)) ||
          new Date().toISOString();

        if (matchedLink) {
          return {
            matched_email: aliasEmail,
            matched_subject: matchedSubject,
            matched_received_at: matchedReceivedAt,
            matched_link: matchedLink,
          };
        }
      }

      await page.waitForTimeout(intervalMs);
    }

    throw new Error(`timeout ao localizar e-mail/link para ${aliasEmail}`);
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

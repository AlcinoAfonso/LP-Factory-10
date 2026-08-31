const previewHostPattern = /^lp-factory-10-[a-z0-9-]+-alcino-afonsos-projects\.vercel\.app$/;

export function parseAuthorizedAppOrigin(raw) {
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:") throw new Error("APP_URL_OVERRIDE deve usar HTTPS");
  if (parsed.username || parsed.password) throw new Error("APP_URL_OVERRIDE não pode conter credenciais");
  const officialHost = parsed.hostname === "lp-factory-10.vercel.app";
  if (!officialHost && !previewHostPattern.test(parsed.hostname)) {
    throw new Error("APP_URL_OVERRIDE deve apontar para Production ou Preview autorizado do projeto lp-factory-10");
  }
  return parsed.origin;
}

export function normalizeAccountSubdomain(value) {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error("QA_ACCOUNT_SUBDOMAIN inválido");
  }
  return normalized;
}

export function assertMutationTarget(origin) {
  if (origin === "https://lp-factory-10.vercel.app") {
    throw new Error("create_landing_page é proibido no domínio oficial de Production");
  }
}

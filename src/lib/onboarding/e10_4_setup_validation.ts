// src/lib/onboarding/e10_4_setup_validation.ts

export type PreferredChannel = "email" | "whatsapp";

export type SetupFieldErrors = Partial<{
  name: string;
  preferred_channel: string;
  whatsapp: string;
  site_url: string;
}>;

export type SetupValidatedValues = {
  name: string;
  niche: string | null;
  preferred_channel: PreferredChannel;
  whatsapp: string | null;
  site_url: string | null; // normalizado; inclui esquema quando presente
};

function normalizeText(input: unknown): string {
  return (input ?? "").toString().trim();
}

function normalizeForCompare(input: unknown): string {
  return normalizeText(input).replace(/\s+/g, " ").trim().toLowerCase();
}

function validatePreferredChannel(input: unknown): PreferredChannel {
  const v = normalizeText(input).toLowerCase();
  if (!v) return "email";
  if (v === "email" || v === "whatsapp") return v;
  throw new Error("invalid_preferred_channel");
}

function isLikelyMachineDefaultName(name: string, accountSubdomain: string): boolean {
  const n = normalizeForCompare(name);
  if (!n) return false;

  const bySubdomain = normalizeForCompare(`Conta ${accountSubdomain}`);
  if (n === bySubdomain) return true;

  if (/^conta\s+acc-[a-z0-9]+$/i.test(name.trim())) return true;

  return false;
}

function validateNameForSetup(name: unknown, accountSubdomain: string): string {
  const trimmed = normalizeText(name);
  if (!trimmed) throw new Error("name_required");

  if (isLikelyMachineDefaultName(trimmed, accountSubdomain)) {
    throw new Error("name_is_default");
  }

  return trimmed;
}

function validateWhatsappIfNeeded(preferred: PreferredChannel, input: unknown): string | null {
  const raw = normalizeText(input);
  if (preferred !== "whatsapp") return raw ? raw : null;

  if (!raw) throw new Error("whatsapp_required_when_channel");
  if (!/^\d{10,15}$/.test(raw)) throw new Error("whatsapp_invalid");
  return raw;
}

function normalizeAndValidateSiteUrl(input: unknown): string | null {
  const raw = normalizeText(input);
  if (!raw) return null;
  if (raw.includes(" ")) throw new Error("site_url_invalid");

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    throw new Error("site_url_invalid");
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("site_url_invalid");
  }

  const originalHadTrailingSlash = withScheme.endsWith("/");
  const hasQueryOrHash = Boolean(u.search) || Boolean(u.hash);
  if (!hasQueryOrHash && u.pathname === "/" && !originalHadTrailingSlash) {
    return u.origin;
  }

  return u.href;
}

function nameErrorMessage(code: string): string {
  if (code === "name_required" || code === "name_is_default") {
    return "Informe o nome do projeto (ex.: Unico Digital).";
  }
  return "Informe um nome válido.";
}

function whatsappErrorMessage(code: string): string {
  return code === "whatsapp_required_when_channel"
    ? "WhatsApp é obrigatório quando o canal é WhatsApp."
    : "WhatsApp inválido. Use apenas dígitos (10–15).";
}

function siteUrlErrorMessage(): string {
  return "Link inválido (use um domínio ou http(s)://, sem espaços).";
}

export function validateE10_4SetupForm(args: {
  accountSubdomain: string;
  name: unknown;
  niche: unknown;
  preferred_channel: unknown;
  whatsapp: unknown;
  site_url: unknown;
}): {
  ok: boolean;
  values: SetupValidatedValues;
  fieldErrors: SetupFieldErrors;
} {
  const fieldErrors: SetupFieldErrors = {};

  let preferred: PreferredChannel = "email";
  try {
    preferred = validatePreferredChannel(args.preferred_channel);
  } catch {
    fieldErrors.preferred_channel = "Canal inválido.";
    preferred = "email";
  }

  let name = normalizeText(args.name);
  try {
    name = validateNameForSetup(args.name, args.accountSubdomain);
  } catch (e: unknown) {
    const code = e instanceof Error ? e.message : String(e);
    fieldErrors.name = nameErrorMessage(code);
  }

  let whatsapp: string | null = normalizeText(args.whatsapp) || null;
  try {
    whatsapp = validateWhatsappIfNeeded(preferred, args.whatsapp);
  } catch (e: unknown) {
    const code = e instanceof Error ? e.message : String(e);
    fieldErrors.whatsapp = whatsappErrorMessage(code);
  }

  let site_url: string | null = normalizeText(args.site_url) || null;
  try {
    site_url = normalizeAndValidateSiteUrl(args.site_url);
  } catch {
    fieldErrors.site_url = siteUrlErrorMessage();
  }

  const niche = normalizeText(args.niche) || null;

  const ok =
    !fieldErrors.name &&
    !fieldErrors.preferred_channel &&
    !fieldErrors.whatsapp &&
    !fieldErrors.site_url;

  return {
    ok,
    values: {
      name,
      niche,
      preferred_channel: preferred,
      whatsapp,
      site_url,
    },
    fieldErrors,
  };
}

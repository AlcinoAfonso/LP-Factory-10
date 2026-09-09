import type { AccountMemberResult } from "./contracts";

type AccountMembersConfirmUrlEnvironment = Readonly<
  Partial<
    Record<
      | "NEXT_PUBLIC_SITE_URL"
      | "VERCEL_ENV"
      | "VERCEL_BRANCH_URL"
      | "VERCEL_PROJECT_PRODUCTION_URL"
      | "VERCEL_URL",
      string
    >
  >
>;

function withConfirmPath(url: URL): string {
  url.pathname = "/auth/confirm";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function resolveExplicitOrigin(value: string | undefined): string | null {
  const configured = value?.trim();
  if (!configured) return null;

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return withConfirmPath(url);
  } catch {
    return null;
  }
}

function resolveVercelHostname(value: string | undefined): string | null {
  const hostname = value?.trim();
  if (!hostname || /[\s/:\\?#@]/.test(hostname)) return null;

  try {
    const url = new URL(`https://${hostname}`);
    if (!url.hostname || url.port) return null;
    return withConfirmPath(url);
  } catch {
    return null;
  }
}

export function resolveAccountMembersConfirmUrl(
  environment: AccountMembersConfirmUrlEnvironment,
): AccountMemberResult<string> {
  if (environment.NEXT_PUBLIC_SITE_URL?.trim()) {
    const explicit = resolveExplicitOrigin(environment.NEXT_PUBLIC_SITE_URL);
    return explicit
      ? { ok: true, value: explicit }
      : { ok: false, error: "external_config_missing" };
  }

  const candidates =
    environment.VERCEL_ENV === "preview"
      ? [environment.VERCEL_BRANCH_URL, environment.VERCEL_URL]
      : environment.VERCEL_ENV === "production"
        ? [environment.VERCEL_PROJECT_PRODUCTION_URL, environment.VERCEL_URL]
        : [];

  for (const candidate of candidates) {
    const resolved = resolveVercelHostname(candidate);
    if (resolved) return { ok: true, value: resolved };
  }

  return { ok: false, error: "external_config_missing" };
}

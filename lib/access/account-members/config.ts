import "server-only";

import type { AccountMemberResult } from "./contracts";

export function isAccountMembersEnabled(): boolean {
  return process.env.E11_MEMBERS_ENABLED === "true";
}

export function getAccountMembersConfirmUrl(): AccountMemberResult<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return { ok: false, error: "external_config_missing" };

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: "external_config_missing" };
    }
    url.pathname = "/auth/confirm";
    url.search = "";
    url.hash = "";
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "external_config_missing" };
  }
}

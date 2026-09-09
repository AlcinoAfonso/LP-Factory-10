import "server-only";

import { resolveAccountMembersConfirmUrl } from "./confirm-url";
import type { AccountMemberResult } from "./contracts";

export function isAccountMembersEnabled(): boolean {
  return process.env.E11_MEMBERS_ENABLED === "true";
}

export function getAccountMembersConfirmUrl(): AccountMemberResult<string> {
  return resolveAccountMembersConfirmUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  });
}

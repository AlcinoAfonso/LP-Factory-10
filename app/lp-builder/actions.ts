"use server";

import "server-only";

import { createAccountLandingPage } from "../../lib/lp-builder";
import type { CreateAccountLandingPageResult } from "../../lib/lp-builder";

export async function createAccountLandingPageAction(input: {
  accountId: string;
  name: string;
  slug: string;
}): Promise<CreateAccountLandingPageResult> {
  return createAccountLandingPage({
    accountId: input.accountId,
    name: input.name,
    slug: input.slug,
  });
}

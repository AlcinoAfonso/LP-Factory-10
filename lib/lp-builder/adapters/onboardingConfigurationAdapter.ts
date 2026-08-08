import "server-only";

import { getCommercialEntitlementSignal } from "../../commercial-entitlements";
import { createClient } from "../../supabase/server";
import { createServiceClient } from "../../supabase/service";
import type {
  AccountLandingPageDraftsResult,
  AccountLandingPageOnboardingResult,
  BindAccountLandingPageOnboardingConfigurationInput,
  SaveAccountLandingPageOnboardingConfigurationInput,
} from "../contracts";
import {
  bindAccountLandingPageOnboardingConfigurationFromClient,
  getAccountLandingPageOnboardingConfigurationFromClient,
  listAccountLandingPageDraftsFromClient,
  saveAccountLandingPageOnboardingConfigurationFromClient,
} from "./onboardingConfigurationAdapterCore";

export async function getAccountLandingPageOnboardingConfiguration(input: {
  accountId: string;
}): Promise<AccountLandingPageOnboardingResult> {
  const actorUserId = await getAuthenticatedUserId();
  if (!actorUserId) return { ok: false, error: "unauthenticated" };

  return getAccountLandingPageOnboardingConfigurationFromClient(
    { accountId: input.accountId, actorUserId },
    createServiceClient(),
    getCommercialEntitlementSignal,
  );
}

export async function saveAccountLandingPageOnboardingConfiguration(
  input: SaveAccountLandingPageOnboardingConfigurationInput,
): Promise<AccountLandingPageOnboardingResult> {
  const actorUserId = await getAuthenticatedUserId();
  if (!actorUserId) return { ok: false, error: "unauthenticated" };

  return saveAccountLandingPageOnboardingConfigurationFromClient(
    { ...input, actorUserId },
    createServiceClient(),
    getCommercialEntitlementSignal,
  );
}

export async function listAccountLandingPageDrafts(input: {
  accountId: string;
}): Promise<AccountLandingPageDraftsResult> {
  const actorUserId = await getAuthenticatedUserId();
  if (!actorUserId) return { ok: false, error: "unauthenticated" };

  return listAccountLandingPageDraftsFromClient(
    { accountId: input.accountId, actorUserId },
    createServiceClient(),
    getCommercialEntitlementSignal,
  );
}

export async function bindAccountLandingPageOnboardingConfiguration(
  input: BindAccountLandingPageOnboardingConfigurationInput,
): Promise<AccountLandingPageOnboardingResult> {
  const actorUserId = await getAuthenticatedUserId();
  if (!actorUserId) return { ok: false, error: "unauthenticated" };

  return bindAccountLandingPageOnboardingConfigurationFromClient(
    { ...input, actorUserId },
    createServiceClient(),
    getCommercialEntitlementSignal,
  );
}

async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const client = await createClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    return error || !user?.id ? null : user.id;
  } catch {
    return null;
  }
}

import "server-only";

import { getCommercialEntitlementSignal } from "../../commercial-entitlements";
import { createClient } from "../../supabase/server";
import { createServiceClient } from "../../supabase/service";
import type {
  AccountLandingPageOnboardingResult,
  SaveAccountLandingPageOnboardingConfigurationInput,
} from "../contracts";
import {
  getAccountLandingPageOnboardingConfigurationFromClient,
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

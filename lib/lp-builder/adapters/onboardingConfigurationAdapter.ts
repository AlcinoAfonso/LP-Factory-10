import "server-only";

import { getCommercialEntitlementSignal } from "../../commercial-entitlements";
import { loadTaxonPreparationForReviewedVersion } from "../../conversion-content/adapters/selectedEndCustomerResearchAdapter";
import { createClient } from "../../supabase/server";
import { createServiceClient } from "../../supabase/service";
import type {
  AccountLandingPageDraftsResult,
  AccountLandingPageOnboardingResult,
  AccountLandingPageOnboardingRevalidationResult,
  BindAccountLandingPageOnboardingConfigurationInput,
  SaveAccountLandingPageOnboardingConfigurationInput,
} from "../contracts";
import {
  bindAccountLandingPageOnboardingConfigurationFromClient,
  getAccountLandingPageOnboardingConfigurationFromClient,
  getAccountLandingPageOnboardingRevalidationAuthorityFromClient,
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
    loadTaxonPreparationForReviewedVersion,
  );
}

export async function getAccountLandingPageOnboardingRevalidationAuthority(input: {
  accountId: string;
}): Promise<AccountLandingPageOnboardingRevalidationResult> {
  const actorUserId = await getAuthenticatedUserId();
  if (!actorUserId) return { ok: false, error: "unauthenticated" };

  return getAccountLandingPageOnboardingRevalidationAuthorityFromClient(
    { accountId: input.accountId, actorUserId },
    createServiceClient(),
    getCommercialEntitlementSignal,
    loadTaxonPreparationForReviewedVersion,
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
    loadTaxonPreparationForReviewedVersion,
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
    loadTaxonPreparationForReviewedVersion,
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
    loadTaxonPreparationForReviewedVersion,
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

import "server-only";

import {
  resolveLandingPageGenerationProfileForTaxon,
  resolveLandingPageResearchForTaxon,
} from "../../conversion-content";
import { createServiceClient } from "../../supabase/service";
import type { AccountLandingPage } from "../contracts";
import type {
  CompileLandingPageGenerationContextForDraftInput,
  CompileLandingPageGenerationContextResult,
} from "../generationContextContracts";
import { getAccountLandingPageOnboardingConfiguration } from "./onboardingConfigurationAdapter";
import { compileLandingPageGenerationContextForDraftWithDependencies } from "./generationContextAdapterCore";

export function compileLandingPageGenerationContextForDraft(
  input: CompileLandingPageGenerationContextForDraftInput,
): Promise<CompileLandingPageGenerationContextResult> {
  return compileLandingPageGenerationContextForDraftWithDependencies(input, {
    loadConfiguration: getAccountLandingPageOnboardingConfiguration,
    loadLandingPage: readLandingPageDraft,
    loadResearch: resolveLandingPageResearchForTaxon,
    loadGenerationProfile: resolveLandingPageGenerationProfileForTaxon,
    log: (payload) => console.log(JSON.stringify(payload)),
  });
}

async function readLandingPageDraft(input: {
  accountId: string;
  landingPageId: string;
}): Promise<
  | Readonly<{ ok: true; landingPage: AccountLandingPage }>
  | Readonly<{ ok: false; error: "not_found" | "read_failed" }>
> {
  try {
    const { data, error } = await createServiceClient()
      .from("account_landing_pages")
      .select("id,account_id,name,slug,status")
      .eq("id", input.landingPageId)
      .eq("account_id", input.accountId)
      .eq("status", "draft")
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: "read_failed" };
    if (!isRecord(data)) return { ok: false, error: "not_found" };
    if (
      data.id !== input.landingPageId ||
      data.account_id !== input.accountId ||
      typeof data.name !== "string" ||
      !data.name.trim() ||
      typeof data.slug !== "string" ||
      !data.slug.trim() ||
      data.status !== "draft"
    ) {
      return { ok: false, error: "read_failed" };
    }
    return {
      ok: true,
      landingPage: {
        id: input.landingPageId,
        account_id: input.accountId,
        name: data.name,
        slug: data.slug,
        status: "draft",
      },
    };
  } catch {
    return { ok: false, error: "read_failed" };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

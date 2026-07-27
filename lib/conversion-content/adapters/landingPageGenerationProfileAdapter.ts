import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  loadLandingPageGenerationProfileSourceFromClient,
  resolveLandingPageGenerationProfileForTaxonFromClient,
} from "./landingPageGenerationProfileAdapterCore";
import type {
  LoadLandingPageGenerationProfileSourceResult,
  ResolveLandingPageGenerationProfileResult,
} from "../landing-page/generation-profile";

export function loadLandingPageGenerationProfileSource(input: {
  taxonId: string;
}): Promise<LoadLandingPageGenerationProfileSourceResult> {
  return loadLandingPageGenerationProfileSourceFromClient(
    input,
    createServiceClient(),
  );
}

export function resolveLandingPageGenerationProfileForTaxon(input: {
  taxonId: string;
}): Promise<ResolveLandingPageGenerationProfileResult> {
  return resolveLandingPageGenerationProfileForTaxonFromClient(
    input,
    createServiceClient(),
  );
}

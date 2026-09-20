import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { decideAccountJourney } from "./onboarding-journey-policy";
import {
  canShowHistoricalNicheResolution,
  loadPendingSetupCompletionState,
} from "../account-journey-loader-state";
import { resolveCompletedAccountPresentation } from "../../../../lib/onboarding/pending-setup/completionCore";

assert.deepEqual(
  decideAccountJourney({ actorRole: "owner", isCommerciallyEligible: false }),
  { mode: "commercial", showFinancialActions: true },
);
assert.deepEqual(
  decideAccountJourney({ actorRole: "admin", isCommerciallyEligible: false }),
  { mode: "waiting", showFinancialActions: false },
);
assert.deepEqual(
  decideAccountJourney({ actorRole: "viewer", isCommerciallyEligible: false }),
  { mode: "waiting", showFinancialActions: false },
);

for (const actorRole of ["owner", "admin", "editor", "viewer"] as const) {
  assert.deepEqual(
    decideAccountJourney({ actorRole, isCommerciallyEligible: true }),
    { mode: "commercial", showFinancialActions: false },
  );
}

async function runCompletionLookupCases(): Promise<void> {
  const completed = await loadPendingSetupCompletionState(async () => "official");
  assert.deepEqual(completed, { status: "known", mode: "official" });
  assert.equal(
    resolveCompletedAccountPresentation({
      completionMode: completed.mode,
      hasActionableNicheResolution: canShowHistoricalNicheResolution(completed, true),
      hasPrimaryTaxon: false,
      personalizedBundleReady: false,
    }).showHistoricalNicheResolution,
    false,
  );

  const absent = await loadPendingSetupCompletionState(async () => null);
  assert.deepEqual(absent, { status: "known", mode: null });
  assert.equal(
    resolveCompletedAccountPresentation({
      completionMode: absent.mode,
      hasActionableNicheResolution: canShowHistoricalNicheResolution(absent, true),
      hasPrimaryTaxon: false,
      personalizedBundleReady: false,
    }).showHistoricalNicheResolution,
    true,
  );

  const unknown = await loadPendingSetupCompletionState(async () => {
    throw new Error("pending_setup_conversation_completion_invalid");
  });
  assert.deepEqual(unknown, { status: "unknown", mode: null });
  assert.equal(
    resolveCompletedAccountPresentation({
      completionMode: unknown.mode,
      hasActionableNicheResolution: canShowHistoricalNicheResolution(unknown, true),
      hasPrimaryTaxon: false,
      personalizedBundleReady: false,
    }).showHistoricalNicheResolution,
    false,
  );
}

const loader = readFileSync(new URL("../account-journey-loader.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../page.tsx", import.meta.url), "utf8");
const legacyDetailRoute = new URL(
  "../landing-pages/[landingPageId]/page.tsx",
  import.meta.url,
);
const legacyPreviewRoute = new URL(
  "../landing-pages/[landingPageId]/preview/page.tsx",
  import.meta.url,
);

assert.doesNotMatch(
  loader,
  /lp-builder|workspace|onboardingConfiguration|landingPageDrafts|landingPageId/,
);
assert.doesNotMatch(
  page,
  /LandingPageWorkspace|OnboardingConfigurationJourney|OnboardingCompletionJourney|workspace_|edit_onboarding/,
);
assert.equal(existsSync(legacyDetailRoute), false);
assert.equal(existsSync(legacyPreviewRoute), false);

runCompletionLookupCases()
  .then(() => {
    console.log("ok - reduced Account Dashboard journey keeps commercial and waiting behavior");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

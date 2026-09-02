import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { decideAccountJourney } from "./onboarding-journey-policy";

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

console.log("ok - reduced Account Dashboard journey keeps commercial and waiting behavior");

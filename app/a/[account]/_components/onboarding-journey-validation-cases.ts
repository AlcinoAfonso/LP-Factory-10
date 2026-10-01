import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { decideAccountJourney } from "./onboarding-journey-policy";

assert.deepEqual(
  decideAccountJourney({ actorRole: "owner", isCommerciallyEligible: false, entitlementLookupStatus: "ok", taxonLookupStatus: "ok" }),
  { mode: "commercial", showFinancialActions: true },
);
assert.deepEqual(
  decideAccountJourney({ actorRole: "admin", isCommerciallyEligible: false, entitlementLookupStatus: "ok", taxonLookupStatus: "ok" }),
  { mode: "waiting", showFinancialActions: false },
);
assert.deepEqual(
  decideAccountJourney({ actorRole: "viewer", isCommerciallyEligible: false, entitlementLookupStatus: "ok", taxonLookupStatus: "ok" }),
  { mode: "waiting", showFinancialActions: false },
);

for (const actorRole of ["owner", "admin", "editor", "viewer"] as const) {
  assert.deepEqual(
    decideAccountJourney({ actorRole, isCommerciallyEligible: true, entitlementLookupStatus: "ok", taxonLookupStatus: "ok" }),
    { mode: "commercial", showFinancialActions: false },
  );
}
assert.deepEqual(
  decideAccountJourney({ actorRole: "owner", isCommerciallyEligible: false, entitlementLookupStatus: "error", taxonLookupStatus: "ok" }),
  { mode: "blocked", showFinancialActions: false },
);
assert.deepEqual(
  decideAccountJourney({ actorRole: "admin", isCommerciallyEligible: true, entitlementLookupStatus: "ok", taxonLookupStatus: "error" }),
  { mode: "blocked", showFinancialActions: false },
);
assert.deepEqual(
  decideAccountJourney({ actorRole: "owner", isCommerciallyEligible: false, entitlementLookupStatus: "ok", taxonLookupStatus: "error" }),
  { mode: "blocked", showFinancialActions: false },
);

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
assert.match(page, /PendingSetupConversation/);
assert.match(page, /NicheResolutionCard/);
assert.match(loader, /accountJourney\.mode === "blocked"\) return \{ view: "journey_unavailable" as const \}/);
assert.match(loader, /if \(entitlementRead\.signal\.isCommerciallyEligible\) return \{ view: "base" as const \}/);
assert.match(page, /journey\.view === "base"/);
assert.ok(loader.indexOf("const entitlementRead = await readCommercialEntitlementSignal") < loader.indexOf("const [nicheResolution, taxonRead]"));
assert.ok(loader.indexOf('signal.isCommerciallyEligible) return { view: "base"') < loader.indexOf("const [nicheResolution, taxonRead]"));
assert.doesNotMatch(loader, /if \(isE1011PassageEnabled\(\)\)/);
assert.doesNotMatch(loader + page, /loadFactualOnboarding|FactualOnboarding|factual_unavailable/);
assert.match(page, /journey\.view === "journey_unavailable"/);
assert.match(page, /Tentar novamente/);
assert.doesNotMatch(page, /PendingSetupFirstSteps/);
assert.doesNotMatch(loader, /loadPendingSetupConversation[\s\S]*accountStatus !== "active"[\s\S]*loadPendingSetupConversation/);
assert.equal(existsSync(legacyDetailRoute), false);
assert.equal(existsSync(legacyPreviewRoute), false);

console.log("ok - reduced Account Dashboard journey keeps commercial and waiting behavior");

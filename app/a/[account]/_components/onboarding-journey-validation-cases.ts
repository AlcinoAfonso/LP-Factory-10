import assert from "node:assert/strict";
import nodeModule from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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

async function validateAccountHeader() {
  const loader = nodeModule as unknown as { _load: (name: string, parent: unknown, isMain: boolean) => unknown };
  const original = loader._load;
  loader._load = function(name, parent, isMain) { return name === "server-only" ? {} : original.call(this, name, parent, isMain); };
  const [{ Header }, { AccessProvider }] = await Promise.all([
    import("../../../../components/layout/Header"), import("../../../../providers/AccessProvider"),
  ]).finally(() => { loader._load = original; });
  const context = { account: { id: "qa", name: "Nome cadastral preservado", subdomain: "qa", status: "active" as const, primaryTaxonName: "Descrição operacional anterior" },
    member: { role: "owner" as "owner" | "viewer", status: "active" as const } };
  const identity = { publicName: "Pão da Gema", officialTaxonName: "Padarias", operationalNicheLabel: "Referência anterior" };
  const render = (value: typeof context | null, props: Parameters<typeof Header>[0]) =>
    renderToStaticMarkup(createElement(AccessProvider, { value } as Parameters<typeof AccessProvider>[0], createElement(Header, props)));
  const official = render(context, { accountIdentity: identity, accountMembersEnabled: true });
  assert.match(official, /Pão da Gema/); assert.match(official, /Padarias/); assert.match(official, /Membros/);
  assert.doesNotMatch(official, /Nome cadastral preservado|Referência anterior/);
  const legacy = render(context, {});
  assert.match(legacy, /Nome cadastral preservado/); assert.match(legacy, /Descrição operacional anterior/);
  const operational = render(context, { accountIdentity: { ...identity, officialTaxonName: null, operationalNicheLabel: "Encontros de histórias" } });
  assert.match(operational, /Referência operacional: /); assert.match(operational, /Encontros de histórias/); assert.doesNotMatch(operational, /Padarias/);
  assert.doesNotMatch(render(null, { accountIdentity: identity }), /Pão da Gema|Padarias/);
  assert.doesNotMatch(render(null, { userEmail: "qa@example.invalid", accountIdentity: identity }), /Pão da Gema|Padarias/);
  assert.doesNotMatch(render({ ...context, member: { ...context.member, role: "viewer" as const } }, { accountIdentity: identity, accountMembersEnabled: true }), /Membros/);
  assert.equal(context.account.name, "Nome cadastral preservado");
  console.log("ok - shared Header preserves account identity, official/operational distinction and existing variants");
}
validateAccountHeader().catch(error => { console.error(error); process.exitCode = 1; });

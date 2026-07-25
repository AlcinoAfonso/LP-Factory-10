import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { validateLandingPageComposition } from "./resolver";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const SOURCE_ID = "22222222-2222-4222-8222-222222222222";

const baseComposition = {
  ownerTaxon: {
    id: OWNER_ID,
    name: "Real estate",
    slug: "real-estate",
    level: "niche",
    isActive: true,
    parentId: SOURCE_ID,
  },
  version: 1,
  status: "draft",
  sourceSnapshots: {
    root: { rootVersion: 1, presetKey: "balanced" },
    moduleCatalog: { moduleCatalogVersion: 1 },
    research: {
      servedTaxonId: OWNER_ID,
      versions: { endCustomer: 1, businessBuyer: 1 },
      sourceTaxonIds: { endCustomer: OWNER_ID, businessBuyer: SOURCE_ID },
    },
    inputCatalog: { version: 1 },
  },
  items: [
    {
      moduleKey: "hero",
      moduleVersion: 1,
      variantName: "standard",
      variantVersion: 1,
      order: 1,
      required: true,
      options: { spacing: "default" },
      justification: "Open the page with the primary promise.",
    },
    {
      moduleKey: "faq",
      moduleVersion: 1,
      variantName: "accordion",
      variantVersion: 1,
      order: 2,
      required: false,
      justification: "Address recurring objections from research.",
    },
  ],
  gaps: [],
  provenance: {
    origin: "human_created",
    proposalSchemaVersion: 1,
  },
} as const;

const cases = [
  {
    name: "valid draft and activation share a deterministic fingerprint",
    run: () => {
      const draft = validate(baseComposition, "draft");
      const activation = validate(baseComposition, "activation");
      assert.equal(draft.ok && activation.ok, true);
      if (!draft.ok || !activation.ok) return;
      assert.equal(draft.value.validationFingerprint.length, 64);
      assert.equal(
        draft.value.validationFingerprint,
        activation.value.validationFingerprint,
      );
      assert.equal(activation.value.activationReady, true);
      assert.equal(activation.value.formInteractionCount, 0);
      assertDeeplyFrozen(activation.value);
    },
  },
  {
    name: "unknown catalog identities fail closed",
    run: () => {
      const composition = cloneBase();
      composition.items[0].variantName = "invented";
      assertCode(composition, "UNKNOWN_CATALOG_REFERENCE");
    },
  },
  {
    name: "duplicate modules fail closed even with different variants",
    run: () => {
      const composition = cloneBase();
      composition.items[1] = {
        ...composition.items[0],
        variantName: "form",
        order: 2,
      };
      assertCode(composition, "DUPLICATE_MODULE");
    },
  },
  {
    name: "empty duplicated and discontinuous orders fail closed",
    run: () => {
      const empty = cloneBase();
      empty.items = [];
      assertCode(empty, "EMPTY_COMPOSITION");

      const duplicate = cloneBase();
      duplicate.items[1].order = 1;
      assertCode(duplicate, "INVALID_ORDER");

      const discontinuous = cloneBase();
      discontinuous.items[1].order = 3;
      assertCode(discontinuous, "INVALID_ORDER");
    },
  },
  {
    name: "more than one form interaction fails closed",
    run: () => {
      const composition = cloneBase();
      composition.items = [
        { ...composition.items[0], variantName: "form" },
        {
          ...composition.items[1],
          moduleKey: "lead_capture",
          variantName: "form",
        },
      ];
      assertCode(composition, "MULTIPLE_FORM_INTERACTIONS");
    },
  },
  {
    name: "blocking gaps can be saved in draft but cannot activate",
    run: () => {
      const composition = cloneBase();
      composition.gaps = [
        {
          kind: "module",
          structuralFunction: "Document a missing calculator section.",
          justification: "The official catalog has no eligible module.",
          impact: "The intended interactive estimate cannot be represented.",
          blocking: true,
          humanDecision: "blocking",
        },
      ];
      const draft = validate(composition, "draft");
      assert.equal(draft.ok, true);
      if (draft.ok) assert.equal(draft.value.activationReady, false);
      assertCode(composition, "BLOCKING_GAP", "activation");
    },
  },
  {
    name: "deferred gaps require human reason and resume condition",
    run: () => {
      const composition = cloneBase();
      composition.gaps = [
        {
          kind: "variant",
          structuralFunction: "Evaluate an alternate evidence layout.",
          justification: "The current variant remains usable for the pilot.",
          impact: "A later test may improve evidence scanning.",
          blocking: false,
          humanDecision: "deferred",
          deferralReason: "The first real LP must validate the need.",
          resumeCondition: "Resume after documented evidence from the pilot.",
        },
      ];
      assert.equal(validate(composition, "activation").ok, true);
      delete composition.gaps[0].resumeCondition;
      assertCode(composition, "INVALID_INPUT");
    },
  },
  {
    name: "inactive and unauthorized ultra-niche owners fail closed",
    run: () => {
      const inactive = cloneBase();
      inactive.ownerTaxon.isActive = false;
      assertCode(inactive, "INACTIVE_OWNER_TAXON");

      const ultra = cloneBase();
      ultra.ownerTaxon.level = "ultra_niche";
      assertCode(ultra, "UNAUTHORIZED_ULTRA_NICHE_OWNER");
      assert.equal(
        validateLandingPageComposition({
          mode: "activation",
          funnelProfileKey: "bofu",
          ownerPolicy: { ownCompositionAllowed: true },
          composition: ultra,
        }).ok,
        true,
      );
    },
  },
  {
    name: "source snapshots must belong to the owner and resolve exactly",
    run: () => {
      const wrongTaxon = cloneBase();
      wrongTaxon.sourceSnapshots.research.servedTaxonId = SOURCE_ID;
      assertCode(wrongTaxon, "INVALID_SOURCE_SNAPSHOT");

      const unknownRoot = cloneBase();
      unknownRoot.sourceSnapshots.root.rootVersion = 99;
      assertCode(unknownRoot, "INVALID_SOURCE_SNAPSHOT");
    },
  },
  {
    name: "strict shapes reject free parameters and invalid AI provenance",
    run: () => {
      const freeOption = cloneBase() as Record<string, unknown>;
      const items = freeOption.items as Array<Record<string, unknown>>;
      items[0].options = { spacing: "default", arbitrary: true };
      assertCode(freeOption, "INVALID_INPUT");

      const ai = cloneBase();
      ai.provenance.origin = "ai_proposal";
      assertCode(ai, "INVALID_INPUT");
      ai.provenance.model = "configured-model";
      ai.provenance.requestId = "request-safe-123";
      assert.equal(validate(ai, "draft").ok, true);
    },
  },
  {
    name: "activation adapter uses only the authenticated RPC for lifecycle",
    run: () => {
      const source = readFileSync(
        resolve(
          process.cwd(),
          "lib/conversion-content/adapters/landingPageCompositionAdapter.ts",
        ),
        "utf8",
      );
      const start = source.indexOf(
        "export async function activateLandingPageComposition",
      );
      const end = source.indexOf("function normalizePolicy", start);
      assert.notEqual(start, -1);
      assert.notEqual(end, -1);
      const activationAdapter = source.slice(start, end);
      assert.match(
        source,
        /createClient as createAuthenticatedClient.*lib\/supabase\/server/,
      );
      assert.match(activationAdapter, /await createAuthenticatedClient\(\)/);
      assert.match(
        activationAdapter,
        /\.rpc\(\s*"activate_landing_page_composition"/,
      );
      assert.doesNotMatch(activationAdapter, /createServiceClient/);
      assert.doesNotMatch(activationAdapter, /\.from\(/);
    },
  },
] as const;

for (const testCase of cases) {
  testCase.run();
  console.log(`PASS ${testCase.name}`);
}

console.log(`PASS ${cases.length} landing-page composition validation cases`);

function validate(composition: unknown, mode: "draft" | "activation") {
  return validateLandingPageComposition({
    mode,
    funnelProfileKey: "bofu",
    composition,
  });
}

function assertCode(
  composition: unknown,
  code: string,
  mode: "draft" | "activation" = "draft",
) {
  const result = validate(composition, mode);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, code);
}

function cloneBase(): MutableComposition {
  return structuredClone(baseComposition) as unknown as MutableComposition;
}

function assertDeeplyFrozen(value: unknown): void {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  for (const nested of Object.values(value)) assertDeeplyFrozen(nested);
}

type MutableComposition = {
  ownerTaxon: {
    id: string;
    name: string;
    slug: string;
    level: string;
    isActive: boolean;
    parentId: string | null;
  };
  version: number;
  status: string;
  sourceSnapshots: {
    root: { rootVersion: number; presetKey: string };
    moduleCatalog: { moduleCatalogVersion: number };
    research: {
      servedTaxonId: string;
      versions: { endCustomer: number; businessBuyer: number };
      sourceTaxonIds: { endCustomer: string; businessBuyer: string };
    };
    inputCatalog: { version: number };
  };
  items: Array<{
    moduleKey: string;
    moduleVersion: number;
    variantName: string;
    variantVersion: number;
    order: number;
    required: boolean;
    options?: Record<string, unknown>;
    justification: string;
  }>;
  gaps: Array<{
    kind: string;
    structuralFunction: string;
    justification: string;
    impact: string;
    blocking: boolean;
    humanDecision: string;
    deferralReason?: string;
    resumeCondition?: string;
  }>;
  provenance: {
    origin: string;
    proposalSchemaVersion: number;
    model?: string;
    requestId?: string;
  };
};

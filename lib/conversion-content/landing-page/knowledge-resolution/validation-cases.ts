import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  canAuthorizeSpecializedKnowledge,
  shouldConfirmDeterministicAlias,
  type DeterministicMatchDecision,
  type MatchBusinessTaxonsResult,
  type TaxonMatchCandidate,
} from "../../../onboarding/niche-resolution";
import { matchBusinessTaxonsDeterministicCore } from "../../../onboarding/niche-resolution/adapters/taxonMatchAdapterCore";
import {
  mediumStandardRealEstateBrokerTaxon,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  type LandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonIdentity,
} from "../input-catalog";
import type { TaxonPreparationResult } from "../taxon-preparation";
import {
  readCompleteTaxonChainFromPages,
  TAXON_CHAIN_PAGE_SIZE,
} from "../../adapters/taxonChainAdapterCore";
import type {
  LandingPageKnowledgeResolutionPorts,
  LandingPageKnowledgeTaxonomyResult,
} from "./contracts";
import { compareTaxonInputCatalogs } from "./equivalence";
import { resolveLandingPageKnowledge } from "./resolver";

type ValidationCase = Readonly<{
  name: string;
  run: () => Promise<void>;
}>;

const servedTaxon = taxon(
  "00000000-0000-4000-8000-000000000001",
  "Served",
  "served",
  "segment",
  null,
);
const specializedTaxon = taxon(
  "00000000-0000-4000-8000-000000000002",
  "Specialized",
  "specialized",
  "niche",
  servedTaxon.id,
);
const siblingTaxon = taxon(
  "00000000-0000-4000-8000-000000000003",
  "Sibling",
  "sibling",
  "niche",
  servedTaxon.id,
);
const taxonomy = taxonomySuccess(servedTaxon, [servedTaxon, specializedTaxon, siblingTaxon]);

const cases: readonly ValidationCase[] = [
  {
    name: "P1 authorizes only the explicit exact or normalized name and alias sources",
    run: async () => {
      for (const source of [
        "alias_exact",
        "alias_normalized",
        "taxon_name_exact",
        "taxon_name_normalized",
        "alias_exact+fts",
        "taxon_name_exact+trgm",
      ]) {
        assert.equal(canAuthorizeSpecializedKnowledge(source), true, source);
      }
      for (const source of [
        "fts",
        "trgm",
        "taxon_slug_normalized",
        "fts+trgm+taxon_slug_normalized",
      ]) {
        assert.equal(canAuthorizeSpecializedKnowledge(source), false, source);
      }
    },
  },
  {
    name: "onboarding alias confirmation consumes the shared source classifier",
    run: async () => {
      const decision = aliasDecision(candidate("alias_exact+fts"));
      assert.equal(shouldConfirmDeterministicAlias(decision), true);
      assert.equal(
        shouldConfirmDeterministicAlias(
          aliasDecision(candidate("alias_exact+taxon_name_normalized")),
        ),
        false,
      );
      const actionSource = readFileSync(
        new URL("../../../../app/a/[account]/actions.ts", import.meta.url),
        "utf8",
      );
      assert.match(actionSource, /shouldConfirmDeterministicAlias/);
      assert.doesNotMatch(actionSource, /function shouldConfirmDeterministicAlias/);
    },
  },
  {
    name: "matcher preserves candidates and separates RPC from invalid response failures",
    run: async () => {
      const valid = await matchBusinessTaxonsDeterministicCore(
        "Oferta",
        99,
        async (_name, args) => {
          assert.deepEqual(args, { p_query: "Oferta", p_limit: 50 });
          return { data: [rpcRow("alias_exact+fts")], error: null };
        },
      );
      assert.equal(valid.ok, true);
      if (!valid.ok) throw new Error("Expected valid matcher result");
      assert.deepEqual(valid.candidates[0].matchedAliases, ["Oferta"]);
      assert.equal(valid.candidates[0].matchSource, "alias_exact+fts");
      assert.equal(Object.isFrozen(valid.candidates), true);

      const rpcFailure = await matchBusinessTaxonsDeterministicCore(
        "Oferta",
        10,
        async () => ({ data: null, error: { code: "42501" } }),
      );
      assertFailureCode(rpcFailure, "RPC_FAILED");
      const thrown = await matchBusinessTaxonsDeterministicCore(
        "Oferta",
        10,
        async () => {
          throw new Error("network");
        },
      );
      assertFailureCode(thrown, "RPC_FAILED");
      const invalidCollection = await matchBusinessTaxonsDeterministicCore(
        "Oferta",
        10,
        async () => ({ data: {}, error: null }),
      );
      assertFailureCode(invalidCollection, "RESPONSE_INVALID");
      const invalidRow = await matchBusinessTaxonsDeterministicCore(
        "Oferta",
        10,
        async () => ({ data: [{ ...rpcRow("alias_exact"), score: "NaN" }], error: null }),
      );
      assertFailureCode(invalidRow, "RESPONSE_INVALID");
    },
  },
  {
    name: "shared chain reader paginates above 500 with deterministic completeness",
    run: async () => {
      const rows = Array.from({ length: TAXON_CHAIN_PAGE_SIZE + 1 }, (_, index) => ({
        id: `id-${String(index).padStart(4, "0")}`,
        name: `Taxon ${index}`,
        slug: `taxon-${index}`,
        level: index === TAXON_CHAIN_PAGE_SIZE ? "niche" : "segment",
        parent_id: index === TAXON_CHAIN_PAGE_SIZE ? "id-0000" : null,
        is_active: true,
      }));
      const calls: Array<[number, number]> = [];
      const result = await readCompleteTaxonChainFromPages(
        `id-${String(TAXON_CHAIN_PAGE_SIZE).padStart(4, "0")}`,
        async (offset, limit) => {
          calls.push([offset, limit]);
          return { data: rows.slice(offset, offset + limit), error: null, status: 200 };
        },
      );
      assert.equal(result.ok, true);
      if (!result.ok) throw new Error("Expected complete chain");
      assert.equal(result.value.taxons.length, TAXON_CHAIN_PAGE_SIZE + 1);
      assert.equal(
        result.value.chain.niche?.id,
        `id-${String(TAXON_CHAIN_PAGE_SIZE).padStart(4, "0")}`,
      );
      assert.deepEqual(calls, [[0, 500], [500, 500]]);
    },
  },
  {
    name: "shared chain reader accepts canonical 416 PGRST103 termination and rejects partial errors",
    run: async () => {
      const rows = Array.from({ length: TAXON_CHAIN_PAGE_SIZE }, (_, index) => ({
        id: `id-${String(index).padStart(4, "0")}`,
        name: `Taxon ${index}`,
        slug: `taxon-${index}`,
        level: "segment",
        parent_id: null,
        is_active: true,
      }));
      const canonical = await readCompleteTaxonChainFromPages("id-0000", async (offset) =>
        offset === 0
          ? { data: rows, error: null, status: 200 }
          : { data: null, error: { code: "PGRST103" }, status: 416 },
      );
      assert.equal(canonical.ok, true);

      const partial = await readCompleteTaxonChainFromPages("id-0000", async (offset) =>
        offset === 0
          ? { data: rows, error: null, status: 200 }
          : { data: null, error: { code: "08006" }, status: 500 },
      );
      assertChainFailure(partial, "DATABASE_READ_FAILED");
    },
  },
  {
    name: "shared chain reader fails typably for invalid inactive missing and broken identities",
    run: async () => {
      const invalid = await readCompleteTaxonChainFromPages(servedTaxon.id, async () => ({
        data: [{ id: servedTaxon.id, name: "", slug: "a", level: "segment", parent_id: null, is_active: true }],
        error: null,
      }));
      assertChainFailure(invalid, "TAXON_IDENTITY_INVALID");
      const inactive = await readCompleteTaxonChainFromPages(servedTaxon.id, async () => ({
        data: [dbTaxon({ ...servedTaxon, isActive: false })],
        error: null,
      }));
      assertChainFailure(inactive, "TAXON_INACTIVE");
      const missing = await readCompleteTaxonChainFromPages("missing", async () => ({
        data: [dbTaxon(servedTaxon)],
        error: null,
      }));
      assertChainFailure(missing, "TAXON_NOT_FOUND");
      const broken = await readCompleteTaxonChainFromPages(specializedTaxon.id, async () => ({
        data: [dbTaxon({ ...specializedTaxon, parentId: "missing" })],
        error: null,
      }));
      assertChainFailure(broken, "INVALID_TAXON_CHAIN");
    },
  },
  {
    name: "single exact name and alias resolve the same specialized descendant",
    run: async () => {
      for (const source of ["taxon_name_exact", "alias_normalized", "alias_exact+fts"]) {
        const result = await resolveLandingPageKnowledge(
          resolutionInput("single", ["Oferta"]),
          ports({ match: matchSuccess([candidate(source)]) }),
        );
        assert.equal(result.ok, true, source);
        if (!result.ok) throw new Error("Expected specialized resolution");
        assert.equal(result.value.status, "specialized_deep");
        assert.equal(result.value.researchSource.taxonId, specializedTaxon.id);
        assert.equal(result.value.matchProvenance[0].matchSource, source);
        assert.deepEqual(result.value.matchProvenance[0].matchedAliases, ["Oferta"]);
        assert.equal(result.value.offeringInvalidated, false);
        assert.equal(Object.isFrozen(result.value), true);
      }
    },
  },
  {
    name: "weak-only no-match outside-descendant and ambiguity stay dynamic without rejection",
    run: async () => {
      const scenarios: readonly [MatchBusinessTaxonsResult, string][] = [
        [matchSuccess([candidate("fts")]), "single_weak_match"],
        [matchSuccess([candidate("trgm")]), "single_weak_match"],
        [matchSuccess([candidate("taxon_slug_normalized")]), "single_weak_match"],
        [matchSuccess([]), "single_no_match"],
        [matchSuccess([candidate("taxon_name_exact", "outside")]), "single_no_match"],
        [
          matchSuccess([
            candidate("taxon_name_exact"),
            candidate("alias_exact", siblingTaxon.id),
          ]),
          "single_ambiguous_match",
        ],
      ];
      for (const [match, reason] of scenarios) {
        const result = await resolveLandingPageKnowledge(
          resolutionInput("single", ["Oferta"]),
          ports({ match }),
        );
        assert.equal(result.ok, true);
        if (!result.ok) throw new Error("Expected dynamic fallback");
        assert.equal(result.value.status, "dynamic_required");
        assert.equal(result.value.fallbackReason, reason);
        assert.equal(result.value.offeringInvalidated, false);
      }
    },
  },
  {
    name: "multiple requests one set-level complement while portfolio stays base-only",
    run: async () => {
      let matchCalls = 0;
      const customPorts = ports({
        match: async () => {
          matchCalls += 1;
          return matchSuccess([]);
        },
      });
      const multiple = await resolveLandingPageKnowledge(
        resolutionInput("multiple", ["A", "B"]),
        customPorts,
      );
      assert.equal(multiple.ok, true);
      if (!multiple.ok) throw new Error("Expected multiple resolution");
      assert.equal(multiple.value.status, "dynamic_required");
      assert.deepEqual(multiple.value.dynamicTarget, {
        mode: "multiple",
        offerings: ["A", "B"],
      });

      const portfolio = await resolveLandingPageKnowledge(
        resolutionInput("portfolio", ["A", "B"]),
        customPorts,
      );
      assert.equal(portfolio.ok, true);
      if (!portfolio.ok) throw new Error("Expected portfolio resolution");
      assert.equal(portfolio.value.status, "base_only");
      assert.equal(portfolio.value.dynamicTarget, null);
      assert.equal(matchCalls, 0);
    },
  },
  {
    name: "invalid offering shape and operational matcher failures fail closed",
    run: async () => {
      let taxonomyCalls = 0;
      const invalid = await resolveLandingPageKnowledge(
        { ...resolutionInput("single", ["Oferta"]), offeringScope: { mode: "single", offerings: [] } },
        {
          ...ports(),
          readTaxonomy: async () => {
            taxonomyCalls += 1;
            return taxonomy;
          },
        },
      );
      assertResolutionFailure(invalid, "INVALID_OFFERING_SCOPE");
      assert.equal(taxonomyCalls, 0);

      const matchFailure = await resolveLandingPageKnowledge(
        resolutionInput("single", ["Oferta"]),
        ports({ match: { ok: false, error: { code: "RPC_FAILED", message: "failed" } } }),
      );
      assertResolutionFailure(matchFailure, "MATCH_FAILED");
    },
  },
  {
    name: "unprepared or inequivalent descendants fall back while operational preparation fails",
    run: async () => {
      const unprepared = await resolveLandingPageKnowledge(
        resolutionInput("single", ["Oferta"]),
        ports({
          match: matchSuccess([candidate("alias_exact")]),
          specializedPreparation: preparationFailure("SELECTION_ABSENT"),
        }),
      );
      assert.equal(unprepared.ok, true);
      if (!unprepared.ok) throw new Error("Expected preparation fallback");
      assert.equal(unprepared.value.fallbackReason, "single_specialized_unprepared");

      const operational = await resolveLandingPageKnowledge(
        resolutionInput("single", ["Oferta"]),
        ports({
          match: matchSuccess([candidate("alias_exact")]),
          specializedPreparation: preparationFailure("DATABASE_READ_FAILED"),
        }),
      );
      assertResolutionFailure(operational, "SPECIALIZED_PREPARATION_FAILED");

      const realTaxonomy = taxonomySuccess(realEstateSegmentTaxon, [
        mediumStandardRealEstateBrokerTaxon,
        realEstateBrokerNicheTaxon,
        realEstateSegmentTaxon,
      ]);
      const inequivalent = await resolveLandingPageKnowledge(
        {
          servedTaxonId: realEstateSegmentTaxon.id,
          currentInputCatalogVersion: 6,
          offeringScope: { mode: "single", offerings: ["Corretor"] },
        },
        ports({
          taxonomy: realTaxonomy,
          match: matchSuccess([
            candidate(
              "taxon_name_exact",
              realEstateBrokerNicheTaxon.id,
              realEstateBrokerNicheTaxon.name,
              realEstateBrokerNicheTaxon.slug,
            ),
          ]),
          servedPreparation: preparationSuccess(realEstateSegmentTaxon.id, realEstateSegmentTaxon.slug),
          specializedPreparation: preparationSuccess(
            realEstateBrokerNicheTaxon.id,
            realEstateBrokerNicheTaxon.slug,
          ),
        }),
      );
      assert.equal(inequivalent.ok, true);
      if (!inequivalent.ok) throw new Error("Expected inequivalent fallback");
      assert.equal(inequivalent.value.fallbackReason, "single_catalog_inequivalent");
    },
  },
  {
    name: "catalog equivalence ignores taxon identity but preserves material field contracts",
    run: async () => {
      const equivalent = compareTaxonInputCatalogs({
        version: 6,
        servedTaxonChain: { segment: servedTaxon },
        specializedTaxonChain: { segment: servedTaxon, niche: specializedTaxon },
      });
      assert.deepEqual(equivalent, { ok: true, equivalent: true });

      const material = compareTaxonInputCatalogs({
        version: 6,
        servedTaxonChain: { segment: realEstateSegmentTaxon },
        specializedTaxonChain: {
          segment: realEstateSegmentTaxon,
          niche: realEstateBrokerNicheTaxon,
        },
      });
      assert.deepEqual(material, { ok: true, equivalent: false });
    },
  },
  {
    name: "E20.7.3 remains deterministic and outside E19 and E20.7.4 boundaries",
    run: async () => {
      const resolverSource = readFileSync(new URL("./resolver.ts", import.meta.url), "utf8");
      const adapterSource = readFileSync(
        new URL("../../adapters/knowledgeResolutionAdapter.ts", import.meta.url),
        "utf8",
      );
      assert.doesNotMatch(resolverSource + adapterSource, /openai|responses|web_search/i);
      assert.doesNotMatch(resolverSource + adapterSource, /generationContext|snapshot|renderer|materialization/);
      assert.doesNotMatch(resolverSource, /normalize\(|toLocaleLowerCase|toLowerCase/);
      assert.match(adapterSource, /CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION/);
    },
  },
];

async function main(): Promise<void> {
  let failed = 0;
  for (const validationCase of cases) {
    try {
      await validationCase.run();
      console.log(`PASS ${validationCase.name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${validationCase.name}`);
      console.error(error);
    }
  }
  if (failed > 0) process.exitCode = 1;
}

function ports(options: {
  taxonomy?: LandingPageKnowledgeTaxonomyResult;
  match?: MatchBusinessTaxonsResult | LandingPageKnowledgeResolutionPorts["matchTaxons"];
  servedPreparation?: TaxonPreparationResult;
  specializedPreparation?: TaxonPreparationResult;
} = {}): LandingPageKnowledgeResolutionPorts {
  return {
    readTaxonomy: async () => options.taxonomy ?? taxonomy,
    matchTaxons: async (offering, limit) => {
      if (typeof options.match === "function") return options.match(offering, limit);
      return options.match ?? matchSuccess([candidate("taxon_name_exact")]);
    },
    loadPreparation: async (taxonId) =>
      taxonId === (options.taxonomy?.ok ? options.taxonomy.value.selected.id : servedTaxon.id)
        ? options.servedPreparation ?? preparationSuccess(
            options.taxonomy?.ok ? options.taxonomy.value.selected.id : servedTaxon.id,
            options.taxonomy?.ok ? options.taxonomy.value.selected.slug : servedTaxon.slug,
          )
        : options.specializedPreparation ?? preparationSuccess(taxonId, taxonId),
  };
}

function resolutionInput(mode: "single" | "multiple" | "portfolio", offerings: string[]) {
  return {
    servedTaxonId: servedTaxon.id,
    currentInputCatalogVersion: 6,
    offeringScope: { mode, offerings },
  };
}

function preparationSuccess(taxonId: string, taxonSlug: string): TaxonPreparationResult {
  return {
    ok: true,
    value: {
      prepared: true,
      taxonId,
      taxonSlug,
      selectedResearchVersion: 1,
      reviewedInputCatalogVersion: 5,
      requiredInputCatalogVersion: 6,
      effectiveInputCatalogVersion: 6,
      transitionClassification: "compatible_evolution",
      research: {
        taxonSlug,
        audienceScope: "end_customer",
        researchVersion: 1,
        relativePath: `${taxonSlug}/end_customer/v1.md`,
        content: `research:${taxonSlug}`,
      },
    },
  };
}

function preparationFailure(
  code: Extract<TaxonPreparationResult, { ok: false }>["error"]["code"],
): TaxonPreparationResult {
  return { ok: false, error: { code, message: code } };
}

function taxonomySuccess(
  selected: LandingPageInputCatalogTaxonIdentity,
  taxons: readonly LandingPageInputCatalogTaxonIdentity[],
): LandingPageKnowledgeTaxonomyResult {
  const chain = chainFor(selected, taxons);
  return { ok: true, value: { selected, taxons, chain } };
}

function chainFor(
  selected: LandingPageInputCatalogTaxonIdentity,
  taxons: readonly LandingPageInputCatalogTaxonIdentity[],
): LandingPageInputCatalogTaxonChain {
  if (selected.level === "segment") return { segment: selected };
  const parent = taxons.find((taxon) => taxon.id === selected.parentId);
  if (!parent) throw new Error("Missing parent fixture");
  if (selected.level === "niche") return { segment: parent, niche: selected };
  const segment = taxons.find((taxon) => taxon.id === parent.parentId);
  if (!segment) throw new Error("Missing segment fixture");
  return { segment, niche: parent, ultraNiche: selected };
}

function candidate(
  matchSource: string,
  taxonId = specializedTaxon.id,
  name = specializedTaxon.name,
  slug = specializedTaxon.slug,
): TaxonMatchCandidate {
  return {
    taxonId,
    name,
    slug,
    level: "niche",
    parentId: servedTaxon.id,
    parentName: servedTaxon.name,
    matchedAliases: ["Oferta"],
    matchSource,
    score: 0.99,
  };
}

function matchSuccess(candidates: readonly TaxonMatchCandidate[]): MatchBusinessTaxonsResult {
  return { ok: true, candidates };
}

function aliasDecision(selectedCandidate: TaxonMatchCandidate): DeterministicMatchDecision {
  return {
    confidence: "high",
    selectedCandidate,
    shouldUseDeterministicMatch: false,
    shouldEscalateToAi: false,
    aiEscalationMode: "none",
    needsAdminReview: false,
    reason: "high_confidence_strong_match",
  };
}

function rpcRow(matchSource: string) {
  return {
    taxon_id: specializedTaxon.id,
    name: specializedTaxon.name,
    slug: specializedTaxon.slug,
    level: specializedTaxon.level,
    parent_id: specializedTaxon.parentId,
    parent_name: servedTaxon.name,
    matched_aliases: ["Oferta"],
    match_source: matchSource,
    score: "0.99",
  };
}

function taxon(
  id: string,
  name: string,
  slug: string,
  level: LandingPageInputCatalogTaxonIdentity["level"],
  parentId: string | null,
): LandingPageInputCatalogTaxonIdentity {
  return { id, name, slug, level, parentId, isActive: true };
}

function dbTaxon(value: LandingPageInputCatalogTaxonIdentity) {
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    level: value.level,
    parent_id: value.parentId,
    is_active: value.isActive,
  };
}

function assertFailureCode(
  result: MatchBusinessTaxonsResult,
  code: "RPC_FAILED" | "RESPONSE_INVALID",
) {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected matcher failure");
  assert.equal(result.error.code, code);
}

function assertChainFailure(
  result: Awaited<ReturnType<typeof readCompleteTaxonChainFromPages>>,
  code: string,
) {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected chain failure");
  assert.equal(result.error.code, code);
}

function assertResolutionFailure(
  result: Awaited<ReturnType<typeof resolveLandingPageKnowledge>>,
  code: string,
) {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected resolution failure");
  assert.equal(result.error.code, code);
}

void main();

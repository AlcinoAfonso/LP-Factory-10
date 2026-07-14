import assert from "node:assert/strict";

import {
  LANDING_PAGE_RESEARCH_BLOCKS,
  type LandingPageResearchAudienceScope,
  type LandingPageResearchItemDto,
  type LandingPageResearchNormalizedSource,
  type LandingPageResearchParentDto,
  type LandingPageResearchTaxonDto,
} from "./contracts";
import { resolveLandingPageResearch } from "./resolver";

const SERVED_TAXON_ID = "11111111-1111-4111-8111-111111111111";
const PARENT_TAXON_ID = "22222222-2222-4222-8222-222222222222";
const MISSING_TAXON_ID = "33333333-3333-4333-8333-333333333333";

type MutableSource = {
  status: "ready";
  taxons: LandingPageResearchTaxonDto[];
  researches: LandingPageResearchParentDto[];
  items: LandingPageResearchItemDto[];
};

type ValidationCase = Readonly<{
  name: string;
  run: () => void;
}>;

let nextItemOrdinal = 1;

const cases: readonly ValidationCase[] = [
  {
    name: "missing or malformed taxon_id fails closed",
    run: () => {
      assertFailure(resolve("", completeSource()), "INVALID_TAXON_ID");
      assertFailure(resolve("not-a-uuid", completeSource()), "INVALID_TAXON_ID");
    },
  },
  {
    name: "missing or inactive served taxon fails closed",
    run: () => {
      assertFailure(
        resolve(MISSING_TAXON_ID, completeSource()),
        "TAXON_NOT_FOUND",
      );

      const inactive = completeSource();
      replaceTaxon(inactive, SERVED_TAXON_ID, { isActive: false });
      assertFailure(resolve(SERVED_TAXON_ID, inactive), "TAXON_INACTIVE");
    },
  },
  {
    name: "complete own business_buyer wins over complete direct parent",
    run: () => {
      const result = assertSuccess(resolve(SERVED_TAXON_ID, completeSource()));
      assert.equal(result.businessBuyer.sourceRelation, "own");
      assert.equal(result.businessBuyer.sourceTaxonId, SERVED_TAXON_ID);
    },
  },
  {
    name: "missing own business_buyer uses complete direct parent",
    run: () => {
      const source = completeSource();
      removeSet(source, SERVED_TAXON_ID, "business_buyer");

      const result = assertSuccess(resolve(SERVED_TAXON_ID, source));
      assert.equal(result.businessBuyer.sourceRelation, "direct_parent");
      assert.equal(result.businessBuyer.sourceTaxonId, PARENT_TAXON_ID);
    },
  },
  {
    name: "incomplete own business_buyer uses the whole direct parent set",
    run: () => {
      const source = completeSource();
      removeBlock(source, SERVED_TAXON_ID, "business_buyer", "seo");

      const result = assertSuccess(resolve(SERVED_TAXON_ID, source));
      assert.equal(result.businessBuyer.sourceRelation, "direct_parent");
      assert.equal(
        result.businessBuyer.researches.every(
          (research) => research.sourceTaxonId === PARENT_TAXON_ID,
        ),
        true,
      );
    },
  },
  {
    name: "invalid active own item wins over a missing own block",
    run: () => {
      const source = completeSource();
      removeBlock(source, SERVED_TAXON_ID, "business_buyer", "seo");
      const invalidItem = findItem(
        source,
        SERVED_TAXON_ID,
        "business_buyer",
      );
      replaceItem(source, invalidItem.id, { itemText: "" });

      const result = resolve(SERVED_TAXON_ID, source);
      assertAudienceFailure(
        result,
        "RESEARCH_INVALID",
        "business_buyer",
        "own",
      );
      if (result.ok) throw new Error("Expected audience failure");
      assert.equal(result.error.sourceTaxonId, SERVED_TAXON_ID);
    },
  },
  {
    name: "invalid active own item wins over an empty own block",
    run: () => {
      const source = completeSource();
      const emptyResearch = findResearch(
        source,
        SERVED_TAXON_ID,
        "business_buyer",
        "strategic_core",
      );
      source.items = source.items.filter(
        (item) => item.researchId !== emptyResearch.id || !item.isActive,
      );
      const invalidResearch = findResearch(
        source,
        SERVED_TAXON_ID,
        "business_buyer",
        "lp_overview",
      );
      const invalidItem = source.items.find(
        (item) => item.researchId === invalidResearch.id && item.isActive,
      );
      assert.ok(invalidItem);
      replaceItem(source, invalidItem.id, { itemText: "" });

      const result = resolve(SERVED_TAXON_ID, source);
      assertAudienceFailure(
        result,
        "RESEARCH_INVALID",
        "business_buyer",
        "own",
      );
      if (result.ok) throw new Error("Expected audience failure");
      assert.equal(result.error.sourceTaxonId, SERVED_TAXON_ID);
    },
  },
  {
    name: "complete own business_buyer ignores an incomplete parent",
    run: () => {
      const source = completeSource();
      removeBlock(source, PARENT_TAXON_ID, "business_buyer", "seo");

      const result = assertSuccess(resolve(SERVED_TAXON_ID, source));
      assert.equal(result.businessBuyer.sourceRelation, "own");
    },
  },
  {
    name: "invalid or ambiguous own business_buyer is never masked by parent",
    run: () => {
      const invalid = completeSource();
      const ownItem = findItem(invalid, SERVED_TAXON_ID, "business_buyer");
      replaceItem(invalid, ownItem.id, { itemText: "" });
      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, invalid),
        "RESEARCH_INVALID",
        "business_buyer",
        "own",
      );

      const ambiguous = completeSource();
      duplicateResearchParent(
        ambiguous,
        SERVED_TAXON_ID,
        "business_buyer",
        "strategic_core",
      );
      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, ambiguous),
        "RESEARCH_AMBIGUOUS",
        "business_buyer",
        "own",
      );
    },
  },
  {
    name: "every invalid end_customer state fails on the served taxon",
    run: () => {
      const missing = completeSource();
      removeSet(missing, SERVED_TAXON_ID, "end_customer");
      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, missing),
        "RESEARCH_MISSING",
        "end_customer",
        "own",
      );

      const incomplete = completeSource();
      removeBlock(incomplete, SERVED_TAXON_ID, "end_customer", "seo");
      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, incomplete),
        "RESEARCH_INCOMPLETE",
        "end_customer",
        "own",
      );

      const invalid = completeSource();
      const item = findItem(invalid, SERVED_TAXON_ID, "end_customer");
      replaceItem(invalid, item.id, { itemKey: " " });
      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, invalid),
        "RESEARCH_INVALID",
        "end_customer",
        "own",
      );

      const ambiguous = completeSource();
      duplicateResearchParent(
        ambiguous,
        SERVED_TAXON_ID,
        "end_customer",
        "strategic_core",
      );
      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, ambiguous),
        "RESEARCH_AMBIGUOUS",
        "end_customer",
        "own",
      );
    },
  },
  {
    name: "missing direct parent fails when own business_buyer is not eligible",
    run: () => {
      const withoutParentId = completeSource();
      removeSet(withoutParentId, SERVED_TAXON_ID, "business_buyer");
      replaceTaxon(withoutParentId, SERVED_TAXON_ID, { parentId: null });
      assertFailure(
        resolve(SERVED_TAXON_ID, withoutParentId),
        "DIRECT_PARENT_NOT_FOUND",
      );

      const missingParent = completeSource();
      removeSet(missingParent, SERVED_TAXON_ID, "business_buyer");
      missingParent.taxons = missingParent.taxons.filter(
        (taxon) => taxon.id !== PARENT_TAXON_ID,
      );
      assertFailure(
        resolve(SERVED_TAXON_ID, missingParent),
        "DIRECT_PARENT_NOT_FOUND",
      );
    },
  },
  {
    name: "inactive or ineligible direct parent fails closed",
    run: () => {
      const inactiveParent = completeSource();
      removeSet(inactiveParent, SERVED_TAXON_ID, "business_buyer");
      replaceTaxon(inactiveParent, PARENT_TAXON_ID, { isActive: false });
      assertFailure(
        resolve(SERVED_TAXON_ID, inactiveParent),
        "DIRECT_PARENT_INACTIVE",
      );

      const missingParentSet = completeSource();
      removeSet(missingParentSet, SERVED_TAXON_ID, "business_buyer");
      removeSet(missingParentSet, PARENT_TAXON_ID, "business_buyer");
      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, missingParentSet),
        "RESEARCH_MISSING",
        "business_buyer",
        "direct_parent",
      );
    },
  },
  {
    name: "active blocks split across versions are ambiguous",
    run: () => {
      const source = completeSource();
      const research = findResearch(
        source,
        SERVED_TAXON_ID,
        "business_buyer",
        "seo",
      );
      replaceResearch(source, research.id, { version: 2 });

      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, source),
        "RESEARCH_AMBIGUOUS",
        "business_buyer",
        "own",
      );
    },
  },
  {
    name: "more than one complete active version is ambiguous",
    run: () => {
      const source = completeSource();
      addSet(source, SERVED_TAXON_ID, "business_buyer", 2);

      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, source),
        "RESEARCH_AMBIGUOUS",
        "business_buyer",
        "own",
      );
    },
  },
  {
    name: "structurally invalid active item fails the set",
    run: () => {
      const source = completeSource();
      const item = findItem(source, SERVED_TAXON_ID, "business_buyer");
      replaceItem(source, item.id, { priority: null });

      assertAudienceFailure(
        resolve(SERVED_TAXON_ID, source),
        "RESEARCH_INVALID",
        "business_buyer",
        "own",
      );
    },
  },
  {
    name: "read failure or non-normalizable source fails closed",
    run: () => {
      assertFailure(
        resolveLandingPageResearch({
          taxonId: SERVED_TAXON_ID,
          source: { status: "read_failed" },
        }),
        "READ_FAILED",
      );
      assertFailure(
        resolveLandingPageResearch({
          taxonId: SERVED_TAXON_ID,
          source: { status: "not_normalizable" },
        }),
        "SOURCE_NOT_NORMALIZABLE",
      );
    },
  },
  {
    name: "result preserves provenance, ordering and source atomicity",
    run: () => {
      const source = completeSource();
      const firstResearch = findResearch(
        source,
        SERVED_TAXON_ID,
        "business_buyer",
        "strategic_core",
      );
      source.items.push(
        makeItem(firstResearch.id, "zeta", 0, 2),
        makeItem(firstResearch.id, "alpha", 0, 2),
        {
          ...makeItem(firstResearch.id, "inactive", 0, 0),
          itemText: null,
          isActive: false,
        },
      );
      source.researches.push({
        id: makeUuid("70000000", source.researches.length + 1),
        taxonId: SERVED_TAXON_ID,
        researchBlock: "future_block",
        audienceScope: "business_buyer",
        version: 1,
        status: "active",
      });

      const result = assertSuccess(resolve(SERVED_TAXON_ID, source));
      assert.deepEqual(
        result.businessBuyer.researches.map((research) => research.researchBlock),
        LANDING_PAGE_RESEARCH_BLOCKS,
      );
      assert.deepEqual(
        result.businessBuyer.researches[0].items.map((item) => item.itemKey),
        ["strategic_core_key", "alpha", "zeta"],
      );
      assert.equal(
        result.businessBuyer.researches.every(
          (research) =>
            research.sourceTaxonId === SERVED_TAXON_ID &&
            research.version === result.businessBuyer.version &&
            research.items.every(
              (item) =>
                item.servedTaxonId === SERVED_TAXON_ID &&
                item.sourceTaxonId === SERVED_TAXON_ID &&
                item.sourceRelation === "own" &&
                item.audienceScope === "business_buyer" &&
                item.researchVersion === result.businessBuyer.version &&
                item.researchId === research.researchId,
            ),
        ),
        true,
      );
      assert.equal(Object.isFrozen(result), true);
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

function resolve(taxonId: string, source: MutableSource) {
  return resolveLandingPageResearch({ taxonId, source });
}

function completeSource(): MutableSource {
  const source: MutableSource = {
    status: "ready",
    taxons: [
      { id: SERVED_TAXON_ID, parentId: PARENT_TAXON_ID, isActive: true },
      { id: PARENT_TAXON_ID, parentId: null, isActive: true },
    ],
    researches: [],
    items: [],
  };
  addSet(source, SERVED_TAXON_ID, "end_customer", 1);
  addSet(source, SERVED_TAXON_ID, "business_buyer", 1);
  addSet(source, PARENT_TAXON_ID, "business_buyer", 1);
  return source;
}

function addSet(
  source: MutableSource,
  taxonId: string,
  audienceScope: LandingPageResearchAudienceScope,
  version: number,
): void {
  for (const block of LANDING_PAGE_RESEARCH_BLOCKS) {
    const researchId = makeUuid("40000000", source.researches.length + 1);
    source.researches.push({
      id: researchId,
      taxonId,
      researchBlock: block,
      audienceScope,
      version,
      status: "active",
    });
    source.items.push(makeItem(researchId, `${block}_key`, 3, 1));
  }
}

function makeItem(
  researchId: string,
  itemKey: string,
  priority: number,
  sortOrder: number,
): LandingPageResearchItemDto {
  return {
    id: makeUuid("50000000", nextItemOrdinal++),
    researchId,
    itemKey,
    itemText: `${itemKey} text`,
    priority,
    sortOrder,
    isActive: true,
  };
}

function makeUuid(prefix: string, ordinal: number): string {
  return `${prefix}-0000-4000-8000-${String(ordinal).padStart(12, "0")}`;
}

function removeSet(
  source: MutableSource,
  taxonId: string,
  audienceScope: LandingPageResearchAudienceScope,
): void {
  const ids = new Set(
    source.researches
      .filter(
        (research) =>
          research.taxonId === taxonId &&
          research.audienceScope === audienceScope,
      )
      .map((research) => research.id),
  );
  source.researches = source.researches.filter(
    (research) => !ids.has(research.id),
  );
  source.items = source.items.filter((item) => !ids.has(item.researchId));
}

function removeBlock(
  source: MutableSource,
  taxonId: string,
  audienceScope: LandingPageResearchAudienceScope,
  researchBlock: string,
): void {
  const research = findResearch(
    source,
    taxonId,
    audienceScope,
    researchBlock,
  );
  source.researches = source.researches.filter((row) => row.id !== research.id);
  source.items = source.items.filter((item) => item.researchId !== research.id);
}

function duplicateResearchParent(
  source: MutableSource,
  taxonId: string,
  audienceScope: LandingPageResearchAudienceScope,
  researchBlock: string,
): void {
  const original = findResearch(
    source,
    taxonId,
    audienceScope,
    researchBlock,
  );
  const duplicateId = makeUuid("60000000", source.researches.length + 1);
  source.researches.push({ ...original, id: duplicateId });
  source.items.push(makeItem(duplicateId, `${researchBlock}_duplicate`, 2, 2));
}

function findResearch(
  source: MutableSource,
  taxonId: string,
  audienceScope: LandingPageResearchAudienceScope,
  researchBlock: string,
): LandingPageResearchParentDto {
  const research = source.researches.find(
    (row) =>
      row.taxonId === taxonId &&
      row.audienceScope === audienceScope &&
      row.researchBlock === researchBlock,
  );
  assert.ok(research);
  return research;
}

function findItem(
  source: MutableSource,
  taxonId: string,
  audienceScope: LandingPageResearchAudienceScope,
): LandingPageResearchItemDto {
  const research = source.researches.find(
    (row) =>
      row.taxonId === taxonId && row.audienceScope === audienceScope,
  );
  assert.ok(research);
  const item = source.items.find((row) => row.researchId === research.id);
  assert.ok(item);
  return item;
}

function replaceTaxon(
  source: MutableSource,
  taxonId: string,
  patch: Partial<LandingPageResearchTaxonDto>,
): void {
  source.taxons = source.taxons.map((taxon) =>
    taxon.id === taxonId ? { ...taxon, ...patch } : taxon,
  );
}

function replaceResearch(
  source: MutableSource,
  researchId: string,
  patch: Partial<LandingPageResearchParentDto>,
): void {
  source.researches = source.researches.map((research) =>
    research.id === researchId ? { ...research, ...patch } : research,
  );
}

function replaceItem(
  source: MutableSource,
  itemId: string,
  patch: Partial<LandingPageResearchItemDto>,
): void {
  source.items = source.items.map((item) =>
    item.id === itemId ? { ...item, ...patch } : item,
  );
}

function assertSuccess(
  result: ReturnType<typeof resolveLandingPageResearch>,
) {
  if (!result.ok) assert.fail(`Expected success, received ${result.error.code}`);
  assert.equal(result.ok, true);
  return result.value;
}

function assertFailure(
  result: ReturnType<typeof resolveLandingPageResearch>,
  code: string,
): void {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected resolution failure");
  assert.equal(result.error.code, code);
}

function assertAudienceFailure(
  result: ReturnType<typeof resolveLandingPageResearch>,
  code: string,
  audienceScope: LandingPageResearchAudienceScope,
  sourceRelation: "own" | "direct_parent",
): void {
  assertFailure(result, code);
  if (result.ok) throw new Error("Expected audience failure");
  assert.equal(result.error.audienceScope, audienceScope);
  assert.equal(result.error.sourceRelation, sourceRelation);
}

const _sourceContractCheck: LandingPageResearchNormalizedSource = completeSource();
void _sourceContractCheck;

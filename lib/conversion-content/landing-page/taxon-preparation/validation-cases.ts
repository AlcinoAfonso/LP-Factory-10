import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type {
  EndCustomerResearchErrorCode,
  LoadEndCustomerResearchCandidateInput,
  LoadEndCustomerResearchCandidateResult,
  LoadSelectedEndCustomerResearchResult,
  SelectedEndCustomerResearchErrorCode,
} from "./contracts";
import {
  buildInputCatalogReviewHandoff,
  isEndCustomerResearchSelectionEnabled,
  isInputCatalogReviewEnabled,
  loadEndCustomerResearchCandidate,
  resolveInputCatalogReview,
} from "./index";
import {
  mediumStandardRealEstateBrokerTaxon,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
  resolveLandingPageInputCatalog,
} from "../input-catalog";
import {
  collectAffectedReviewedTaxonIds,
  applyInputCatalogReviewPresentation,
  nextInputCatalogReviewActionRevision,
  planEndCustomerResearchSelectionMutation,
  sameInputCatalogReviewBaseline,
  taxonomyMutationAffectsInputCatalogResolution,
} from "../../../admin/adapters/adminTaxonomyReviewPolicy";
import { loadEndCustomerResearchCandidateForValidation } from "./research";
import {
  loadSelectedEndCustomerResearchFromClient,
  type SelectedEndCustomerResearchReadClient,
} from "../../adapters/selectedEndCustomerResearchAdapterCore";

const VALID_INPUT: LoadEndCustomerResearchCandidateInput = {
  taxon: { slug: "corretor-imoveis", isActive: true },
  researchVersion: 1,
};

type ValidationCase = Readonly<{
  name: string;
  run: () => Promise<void>;
}>;

const cases: readonly ValidationCase[] = [
  {
    name: "input catalog review gate is fail-closed and accepts only literal true",
    run: async () => {
      const previousValue = process.env.E20_6_INPUT_CATALOG_REVIEW_ENABLED;
      try {
        delete process.env.E20_6_INPUT_CATALOG_REVIEW_ENABLED;
        assert.equal(isInputCatalogReviewEnabled(), false);
        process.env.E20_6_INPUT_CATALOG_REVIEW_ENABLED = "TRUE";
        assert.equal(isInputCatalogReviewEnabled(), false);
        process.env.E20_6_INPUT_CATALOG_REVIEW_ENABLED = "true";
        assert.equal(isInputCatalogReviewEnabled(), true);
      } finally {
        if (previousValue === undefined) delete process.env.E20_6_INPUT_CATALOG_REVIEW_ENABLED;
        else process.env.E20_6_INPUT_CATALOG_REVIEW_ENABLED = previousValue;
      }
    },
  },
  {
    name: "E20.6 gate precedes Data API access and SQL preserves least privilege",
    run: async () => {
      const adminSource = readFileSync(
        new URL("../../../admin/adapters/adminTaxonomyAdapter.ts", import.meta.url),
        "utf8",
      );
      const reviewReadStart = adminSource.indexOf("async function readAdminInputCatalogReview");
      const reviewReadEnd = adminSource.indexOf("async function readAdminEndCustomerResearchSelection", reviewReadStart);
      const reviewRead = adminSource.slice(reviewReadStart, reviewReadEnd);
      assert.ok(reviewRead.indexOf("if (!isInputCatalogReviewEnabled())") >= 0);
      assert.ok(reviewRead.indexOf("loadSelectedEndCustomerResearchFromClient") > reviewRead.indexOf("if (!isInputCatalogReviewEnabled())"));
      const selectedCore = readFileSync(
        new URL("../../adapters/selectedEndCustomerResearchAdapterCore.ts", import.meta.url),
        "utf8",
      );
      assert.match(selectedCore, /includeInputCatalogReview[\s\S]*reviewed_input_catalog_version/);
      assert.match(adminSource, /reviewed_input_catalog_version: null/);
      assert.match(adminSource, /findAffectedInputCatalogReviews/);

      const migration = readFileSync(
        new URL("../../../../supabase/migrations/20260815172449_e20_6_reviewed_input_catalog_version.sql", import.meta.url),
        "utf8",
      );
      assert.match(migration, /revoke update\s+on table public\.business_taxons\s+from service_role/);
      assert.match(migration, /grant update \([\s\S]*is_active,[\s\S]*name,[\s\S]*reviewed_input_catalog_version,[\s\S]*selected_end_customer_research_version,[\s\S]*slug[\s\S]*\)/);

      const snippet = readFileSync(
        new URL("../../../../supabase/snippets/e20_6_reviewed_input_catalog_version_verify.sql", import.meta.url),
        "utf8",
      );
      assert.match(snippet, /set transaction read only/);
      assert.match(snippet, /not has_table_privilege\('service_role', 'public\.business_taxons', 'UPDATE'\)/);
      assert.match(snippet, /select case when bool_and\(ok\) then 'ok' else 'unexpected' end as status/);
    },
  },
  {
    name: "versions 1 2 and 3 resolve equivalent factual projections for all four plans",
    run: async () => {
      for (const version of [1, 2, 3]) {
        const result = resolveInputCatalogReview({
          version,
          taxonChain: {
            segment: realEstateSegmentTaxon,
            niche: realEstateBrokerNicheTaxon,
            ultraNiche: mediumStandardRealEstateBrokerTaxon,
          },
        });
        assert.equal(result.ok, true);
        if (!result.ok) throw new Error("Expected resolvable input catalog review");
        assert.deepEqual(result.value.plans, ["starter", "lite", "pro", "ultra"]);
      }
    },
  },
  {
    name: "material divergence between plan projections stops the review",
    run: async () => {
      const result = resolveInputCatalogReview({
        version: 1,
        taxonChain: {
          segment: realEstateSegmentTaxon,
          niche: realEstateBrokerNicheTaxon,
          ultraNiche: mediumStandardRealEstateBrokerTaxon,
        },
      }, (input) => {
        const resolved = resolveLandingPageInputCatalog(input);
        if (!resolved.ok || input.plan !== "ultra") return resolved;
        return {
          ok: true,
          value: { ...resolved.value, fields: [...resolved.value.fields].reverse() },
        };
      });
      assert.equal(result.ok, false);
      if (result.ok) throw new Error("Expected divergent projections to fail");
      assert.equal(result.error.code, "PLAN_PROJECTIONS_DIVERGED");
    },
  },
  {
    name: "selection mutation invalidates review only on an effective version change",
    run: async () => {
      assert.deepEqual(
        planEndCustomerResearchSelectionMutation({ currentVersion: null, nextVersion: 1, inputCatalogReviewEnabled: true }),
        { idempotent: false, update: { selected_end_customer_research_version: 1, reviewed_input_catalog_version: null } },
      );
      assert.deepEqual(
        planEndCustomerResearchSelectionMutation({ currentVersion: 1, nextVersion: 2, inputCatalogReviewEnabled: true }),
        { idempotent: false, update: { selected_end_customer_research_version: 2, reviewed_input_catalog_version: null } },
      );
      assert.deepEqual(
        planEndCustomerResearchSelectionMutation({ currentVersion: 1, nextVersion: 1, inputCatalogReviewEnabled: true }),
        { idempotent: true, update: null },
      );
    },
  },
  {
    name: "taxonomy guard covers name slug activity ancestors and descendants",
    run: async () => {
      const current = { name: "Imobiliário", slug: "imobiliario", isActive: true };
      assert.equal(taxonomyMutationAffectsInputCatalogResolution(current, current), false);
      assert.equal(taxonomyMutationAffectsInputCatalogResolution(current, { ...current, name: "Imóveis" }), true);
      assert.equal(taxonomyMutationAffectsInputCatalogResolution(current, { ...current, slug: "imoveis" }), true);
      assert.equal(taxonomyMutationAffectsInputCatalogResolution(current, { ...current, isActive: false }), true);
      const rows = [
        { id: "segment", parentId: null, reviewedVersion: null },
        { id: "niche", parentId: "segment", reviewedVersion: 1 },
        { id: "ultra", parentId: "niche", reviewedVersion: 2 },
        { id: "other", parentId: null, reviewedVersion: 3 },
      ];
      assert.deepEqual(collectAffectedReviewedTaxonIds(rows, "segment"), ["niche", "ultra"]);
      assert.deepEqual(collectAffectedReviewedTaxonIds(rows, "niche"), ["niche", "ultra"]);
      assert.deepEqual(collectAffectedReviewedTaxonIds(rows, "ultra"), ["ultra"]);
    },
  },
  {
    name: "review baseline rejects concurrent identity research review or chain changes",
    run: async () => {
      const baseline = {
        taxonName: "Corretor Imóveis",
        taxonSlug: "corretor-imoveis",
        taxonLevel: "niche" as const,
        parentTaxonId: "segment",
        selectedResearchVersion: 1,
        reviewedVersion: null,
        chainFingerprint: "chain-v1",
      };
      assert.equal(sameInputCatalogReviewBaseline(baseline, { ...baseline }), true);
      for (const changed of [
        { ...baseline, taxonName: "Corretores" },
        { ...baseline, taxonSlug: "corretores" },
        { ...baseline, parentTaxonId: "other" },
        { ...baseline, selectedResearchVersion: 2 },
        { ...baseline, reviewedVersion: 1 },
        { ...baseline, chainFingerprint: "chain-v2" },
      ]) assert.equal(sameInputCatalogReviewBaseline(baseline, changed), false);
    },
  },
  {
    name: "review presentation follows the last successful record or reopen action",
    run: async () => {
      let presentation = { reviewedVersion: null, lastAction: null } as {
        reviewedVersion: number | null;
        lastAction: "record" | "reopen" | null;
      };
      let recordRevision = 0;
      let reopenRevision = 0;

      recordRevision = nextInputCatalogReviewActionRevision(recordRevision);
      presentation = applyInputCatalogReviewPresentation(presentation, { type: "record", reviewedVersion: 2 });
      assert.deepEqual({ presentation, recordRevision, reopenRevision }, {
        presentation: { reviewedVersion: 2, lastAction: "record" },
        recordRevision: 1,
        reopenRevision: 0,
      });

      reopenRevision = nextInputCatalogReviewActionRevision(reopenRevision);
      presentation = applyInputCatalogReviewPresentation(presentation, { type: "reopen" });
      assert.deepEqual({ presentation, recordRevision, reopenRevision }, {
        presentation: { reviewedVersion: null, lastAction: "reopen" },
        recordRevision: 1,
        reopenRevision: 1,
      });

      recordRevision = nextInputCatalogReviewActionRevision(recordRevision);
      presentation = applyInputCatalogReviewPresentation(presentation, { type: "record", reviewedVersion: 2 });
      assert.deepEqual({ presentation, recordRevision, reopenRevision }, {
        presentation: { reviewedVersion: 2, lastAction: "record" },
        recordRevision: 2,
        reopenRevision: 1,
      });

      reopenRevision = nextInputCatalogReviewActionRevision(reopenRevision);
      presentation = applyInputCatalogReviewPresentation(presentation, { type: "reopen" });
      assert.deepEqual({ presentation, recordRevision, reopenRevision }, {
        presentation: { reviewedVersion: null, lastAction: "reopen" },
        recordRevision: 2,
        reopenRevision: 2,
      });

      const componentSource = readFileSync(
        new URL("../../../../app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogReview.tsx", import.meta.url),
        "utf8",
      );
      assert.match(componentSource, /recordState\.revision\]\);/);
      assert.match(componentSource, /reopenState\.revision\]\);/);
    },
  },
  {
    name: "handoff carries authoritative chain and never selects an E20.2 version",
    run: async () => {
      const handoff = buildInputCatalogReviewHandoff({
        taxonSlug: "corretor-imoveis",
        taxonChain: {
          segment: realEstateSegmentTaxon,
          niche: realEstateBrokerNicheTaxon,
        },
        researchVersion: 1,
      });
      assert.match(handoff, /corretor-imoveis/);
      assert.match(handoff, /"segment"/);
      assert.match(handoff, /end_customer` v1/);
      assert.match(handoff, /solicite minha escolha/);
      assert.match(handoff, /Não use pesquisa web, conectores, escrita, subagentes/);
      assert.doesNotMatch(handoff, /versão E20\.2 3 como/);
    },
  },
  {
    name: "selection gate is fail-closed and accepts only literal true",
    run: async () => {
      const previousValue = process.env.E20_5_SELECTED_RESEARCH_ENABLED;
      try {
        delete process.env.E20_5_SELECTED_RESEARCH_ENABLED;
        assert.equal(isEndCustomerResearchSelectionEnabled(), false);
        process.env.E20_5_SELECTED_RESEARCH_ENABLED = "false";
        assert.equal(isEndCustomerResearchSelectionEnabled(), false);
        process.env.E20_5_SELECTED_RESEARCH_ENABLED = "TRUE";
        assert.equal(isEndCustomerResearchSelectionEnabled(), false);
        process.env.E20_5_SELECTED_RESEARCH_ENABLED = "true";
        assert.equal(isEndCustomerResearchSelectionEnabled(), true);
      } finally {
        if (previousValue === undefined) {
          delete process.env.E20_5_SELECTED_RESEARCH_ENABLED;
        } else {
          process.env.E20_5_SELECTED_RESEARCH_ENABLED = previousValue;
        }
      }
    },
  },
  {
    name: "selection gate precedes every new-column access",
    run: async () => {
      const source = readFileSync(
        new URL("../../../admin/adapters/adminTaxonomyAdapter.ts", import.meta.url),
        "utf8",
      );
      const readStart = source.indexOf("async function readAdminEndCustomerResearchSelection");
      const mutationStart = source.indexOf("export async function selectAdminEndCustomerResearchVersion");
      const mutationEnd = source.indexOf("export async function addAdminTaxonAlias", mutationStart);
      assert.ok(readStart >= 0);
      assert.ok(mutationStart > readStart);
      assert.ok(mutationEnd > mutationStart);

      const readBoundary = source.slice(readStart, mutationStart);
      const readGate = readBoundary.indexOf("if (!isEndCustomerResearchSelectionEnabled())");
      const readColumn = readBoundary.indexOf('.select("selected_end_customer_research_version")');
      assert.ok(readGate >= 0);
      assert.ok(readColumn > readGate);

      const mutationBoundary = source.slice(mutationStart, mutationEnd);
      const mutationGate = mutationBoundary.indexOf("if (!isEndCustomerResearchSelectionEnabled())");
      const serviceClient = mutationBoundary.indexOf("createServiceClient()");
      const mutationColumn = mutationBoundary.indexOf("selected_end_customer_research_version");
      assert.ok(mutationGate >= 0);
      assert.ok(serviceClient > mutationGate);
      assert.ok(mutationColumn > mutationGate);

      const consumerSource = readFileSync(
        new URL("../../adapters/selectedEndCustomerResearchAdapter.ts", import.meta.url),
        "utf8",
      );
      const consumerGate = consumerSource.indexOf("if (!isEndCustomerResearchSelectionEnabled())");
      const consumerClient = consumerSource.indexOf("createServiceClient()");
      const consumerLoad = consumerSource.indexOf("return loadSelectedEndCustomerResearchFromClient");
      assert.ok(consumerGate >= 0);
      assert.ok(consumerClient > consumerGate);
      assert.ok(consumerLoad > consumerClient);
      assert.ok(consumerSource.indexOf('code: "FEATURE_DISABLED"') > consumerGate);
    },
  },
  {
    name: "selected research consumer distinguishes database and selection states",
    run: async () => {
      let invalidIdReads = 0;
      assertSelectedFailure(
        await loadSelectedEndCustomerResearchFromClient(
          { taxonId: "invalid" },
          selectionClient({ data: null, error: null }, () => invalidIdReads += 1),
        ),
        "INVALID_TAXON_ID",
      );
      assert.equal(invalidIdReads, 0);

      const databaseFailure = await loadSelectedEndCustomerResearchFromClient(
        { taxonId: VALID_TAXON_ID },
        selectionClient({ data: null, error: { code: "42501" } }),
      );
      assertSelectedFailure(databaseFailure, "DATABASE_READ_FAILED");
      assertSelectedFailure(
        await loadSelectedEndCustomerResearchFromClient(
          { taxonId: VALID_TAXON_ID },
          selectionClient({ data: null, error: null }),
        ),
        "TAXON_NOT_FOUND",
      );
      assertSelectedFailure(
        await loadSelectedEndCustomerResearchFromClient(
          { taxonId: VALID_TAXON_ID },
          selectionClient({ data: selectedTaxonRow({ is_active: false }), error: null }),
        ),
        "TAXON_INACTIVE",
      );
      assertSelectedFailure(
        await loadSelectedEndCustomerResearchFromClient(
          { taxonId: VALID_TAXON_ID },
          selectionClient({ data: selectedTaxonRow(), error: null }),
        ),
        "SELECTION_ABSENT",
      );
      assertSelectedFailure(
        await loadSelectedEndCustomerResearchFromClient(
          { taxonId: VALID_TAXON_ID },
          selectionClient({
            data: selectedTaxonRow({ selected_end_customer_research_version: 0 }),
            error: null,
          }),
        ),
        "SELECTED_VERSION_INVALID",
      );
    },
  },
  {
    name: "selected research consumer preserves candidate failure categories",
    run: async () => {
      const mappings: readonly [
        EndCustomerResearchErrorCode,
        SelectedEndCustomerResearchErrorCode,
      ][] = [
        ["FILE_NOT_FOUND", "FILE_NOT_FOUND"],
        ["READ_FAILED", "FILESYSTEM_READ_FAILED"],
        ["METADATA_INVALID", "METADATA_INVALID"],
        ["CONTENT_EMPTY", "CONTENT_EMPTY"],
        ["INVALID_RESEARCH_VERSION", "SELECTED_VERSION_INVALID"],
        ["TAXON_INACTIVE", "TAXON_INACTIVE"],
        ["INVALID_TAXON_SLUG", "TAXON_IDENTITY_INVALID"],
        ["PATH_OUTSIDE_RESEARCH_ROOT", "TAXON_IDENTITY_INVALID"],
      ];

      for (const [candidateCode, selectedCode] of mappings) {
        const result = await loadSelectedEndCustomerResearchFromClient(
          { taxonId: VALID_TAXON_ID },
          selectionClient({ data: selectedTaxonRow({ selected_end_customer_research_version: 1 }), error: null }),
          async () => ({ ok: false, error: { code: candidateCode, message: "failure" } }),
        );
        assertSelectedFailure(result, selectedCode);
      }

      assertSelectedFailure(
        await loadSelectedEndCustomerResearchFromClient(
          { taxonId: VALID_TAXON_ID },
          selectionClient({ data: selectedTaxonRow({ selected_end_customer_research_version: 1 }), error: null }),
          async () => { throw new Error("filesystem failure"); },
        ),
        "FILESYSTEM_READ_FAILED",
      );
    },
  },
  {
    name: "selected research consumer returns content only for the persisted valid version",
    run: async () => {
      const result = await loadSelectedEndCustomerResearchFromClient(
        { taxonId: VALID_TAXON_ID },
        selectionClient({
          data: selectedTaxonRow({ selected_end_customer_research_version: 1 }),
          error: null,
        }),
        async (input) => {
          assert.deepEqual(input, VALID_INPUT);
          return loadWithContent(validContent());
        },
      );

      if (!result.ok) assert.fail(`Expected selected research success, received ${result.error.code}`);
      assert.equal(result.value.taxonId, VALID_TAXON_ID);
      assert.equal(result.value.taxonSlug, VALID_INPUT.taxon.slug);
      assert.equal(result.value.selectedResearchVersion, 1);
      assert.equal(result.value.selectedResearchValid, true);
      assert.equal(result.value.research.content, validContent());
      assert.equal("prepared" in result.value, false);
    },
  },
  {
    name: "loads the archived research integrally from the canonical path",
    run: async () => {
      const result = assertSuccess(
        await loadEndCustomerResearchCandidate(VALID_INPUT),
      );
      assert.equal(result.taxonSlug, "corretor-imoveis");
      assert.equal(result.audienceScope, "end_customer");
      assert.equal(result.researchVersion, 1);
      assert.equal(
        result.relativePath,
        "corretor-imoveis/end_customer/v1.md",
      );
      assert.match(result.content, /^# Pesquisa bruta - Corretor Imóveis/);
      assert.match(result.content, /## 3\. Núcleo estratégico/);
    },
  },
  {
    name: "rejects a non-positive or non-integer version before reading",
    run: async () => {
      let reads = 0;
      const reader = async () => {
        reads += 1;
        return validContent();
      };

      assertFailure(
        await loadEndCustomerResearchCandidateForValidation(
          { ...VALID_INPUT, researchVersion: 0 },
          { readResearchFile: reader },
        ),
        "INVALID_RESEARCH_VERSION",
      );
      assertFailure(
        await loadEndCustomerResearchCandidateForValidation(
          { ...VALID_INPUT, researchVersion: 1.5 },
          { readResearchFile: reader },
        ),
        "INVALID_RESEARCH_VERSION",
      );
      assert.equal(reads, 0);
    },
  },
  {
    name: "rejects path traversal before reading",
    run: async () => {
      let reads = 0;
      const result = await loadEndCustomerResearchCandidateForValidation(
        {
          taxon: { slug: "../corretor-imoveis", isActive: true },
          researchVersion: 1,
        },
        {
          readResearchFile: async () => {
            reads += 1;
            return validContent();
          },
        },
      );

      assertFailure(result, "PATH_OUTSIDE_RESEARCH_ROOT");
      assert.equal(reads, 0);
    },
  },
  {
    name: "distinguishes a missing file from an operational read failure",
    run: async () => {
      const missing = Object.assign(new Error("missing"), { code: "ENOENT" });
      const denied = Object.assign(new Error("denied"), { code: "EACCES" });

      assertFailure(
        await loadWithReader(async () => Promise.reject(missing)),
        "FILE_NOT_FOUND",
      );
      assertFailure(
        await loadWithReader(async () => Promise.reject(denied)),
        "READ_FAILED",
      );
    },
  },
  {
    name: "rejects missing, duplicate, malformed or divergent metadata",
    run: async () => {
      assertFailure(
        await loadWithContent(
          validContent().replace("- `taxon_slug`: `corretor-imoveis`\n", ""),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `taxon_slug`: `corretor-imoveis`",
            "- `taxon_slug`: `corretor-imoveis`\n- `taxon_slug`: `corretor-imoveis`",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `research_version`: `1`",
            "- research_version: 1",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `audience_scope`: `end_customer`",
            "- `audience_scope`: `business_buyer`",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          `${validContent()}\n- \`research_version\`: \`1\``,
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `research_version`: `1`",
            "- `research_version`: `1`\n- research_version: 1",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "- `research_version`: `1`",
            "- `research_version`: `1`\n- research_version = 1",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(
          validContent().replace(
            "# Pesquisa bruta - Corretor Imóveis",
            "# Pesquisa bruta - Corretor Imóveis\n- `research_version`: `1`",
          ),
        ),
        "METADATA_INVALID",
      );
      assertFailure(
        await loadWithContent(`${validContent()}\n- research_version: 1`),
        "METADATA_INVALID",
      );
    },
  },
  {
    name: "rejects content empty after identification",
    run: async () => {
      assertFailure(
        await loadWithContent(
          [
            "# Pesquisa bruta - Corretor Imóveis",
            "",
            "## 1. Identificação e uso",
            "",
            "- `taxon_slug`: `corretor-imoveis`",
            "- `audience_scope`: `end_customer`",
            "- `research_version`: `1`",
          ].join("\n"),
        ),
        "CONTENT_EMPTY",
      );
    },
  },
  {
    name: "rejects an inactive taxon without returning partial content",
    run: async () => {
      assertFailure(
        await loadEndCustomerResearchCandidate({
          ...VALID_INPUT,
          taxon: { ...VALID_INPUT.taxon, isActive: false },
        }),
        "TAXON_INACTIVE",
      );
    },
  },
];

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

async function run(): Promise<void> {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

function validContent(): string {
  return [
    "# Pesquisa bruta - Corretor Imóveis",
    "",
    "## 1. Identificação e uso",
    "",
    "- `taxon_name`: Corretor Imóveis",
    "- `taxon_slug`: `corretor-imoveis`",
    "- `audience_scope`: `end_customer`",
    "- `research_version`: `1`",
    "",
    "## 2. Conteúdo",
    "",
    "Conteúdo integral preservado.",
  ].join("\n");
}

async function loadWithContent(
  content: string,
): Promise<LoadEndCustomerResearchCandidateResult> {
  return loadWithReader(async () => content);
}

async function loadWithReader(
  reader: () => Promise<string>,
): Promise<LoadEndCustomerResearchCandidateResult> {
  return loadEndCustomerResearchCandidateForValidation(VALID_INPUT, {
    readResearchFile: reader,
  });
}

function assertSuccess(
  result: LoadEndCustomerResearchCandidateResult,
) {
  if (!result.ok) assert.fail(`Expected success, received ${result.error.code}`);
  assert.equal(result.ok, true);
  return result.value;
}

function assertFailure(
  result: LoadEndCustomerResearchCandidateResult,
  code: EndCustomerResearchErrorCode,
): void {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected failure");
  assert.equal(result.error.code, code);
  assert.equal("value" in result, false);
}

const VALID_TAXON_ID = "00000000-0000-4000-8000-000000000205";

function selectedTaxonRow(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: VALID_TAXON_ID,
    slug: VALID_INPUT.taxon.slug,
    is_active: true,
    selected_end_customer_research_version: null,
    ...overrides,
  };
}

function selectionClient(
  result: { data: unknown; error: unknown },
  onRead: () => void = () => undefined,
): SelectedEndCustomerResearchReadClient {
  const query = {
    select: (_columns: string) => {
      onRead();
      return query;
    },
    eq: () => query,
    limit: () => query,
    maybeSingle: async () => result,
  };
  return {
    from: (table: string) => {
      assert.equal(table, "business_taxons");
      return query as never;
    },
  } as SelectedEndCustomerResearchReadClient;
}

function assertSelectedFailure(
  result: LoadSelectedEndCustomerResearchResult,
  code: SelectedEndCustomerResearchErrorCode,
): void {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected selected research failure");
  assert.equal(result.error.code, code);
  assert.equal("value" in result, false);
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  resolveLandingPageRootParameters,
  resolveLandingPageMaterializedContentForRendering,
  validateLandingPageGenerationContextSnapshotV1,
  validateLandingPageMaterializedContentV1,
} from "../conversion-content/landing-page";
import { resolveLandingPageModuleCatalog } from "../conversion-content/landing-page/module-catalog";
import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import type { LandingPageDraftCandidate, GenerateLandingPageDraftCandidateResult } from "./landingPageGenerationContracts";
import type { PreparedLandingPageDraftGeneration } from "./landingPageDraftGeneration";
import {
  insertLandingPageMaterializationWithDependencies,
  probeLandingPageMaterializationReadinessWithDependencies,
  readLandingPageMaterializationWithDependencies,
  type LandingPageMaterializationStorageDependencies,
} from "./adapters/landingPageMaterializationAdapterCore";
import { buildLandingPageInitialMaterialization } from "./landingPageMaterialization";
import { LANDING_PAGE_MATERIALIZATION_PROJECTION } from "./landingPageMaterializationContracts";
import { materializeFirstLandingPageDraftWithDependencies } from "./materializeFirstLandingPageDraft";

const ACCOUNT_ID = "6ecaf813-957e-4f2b-9ea7-3f2cb204a603";
const LANDING_PAGE_ID = "4d91020a-07e5-4bf9-a1aa-272bbc0366ff";
const ACTOR_ID = "9a6af815-42e9-4a12-8ce2-ddae9dac1e15";
const { context, candidate, exposedGenerationContext } = fixture();
const built = buildLandingPageInitialMaterialization({ context, candidate, exposedGenerationContext });
assert.equal(built.ok, true);

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: "candidate becomes strict self contained content and exact exposed snapshot",
    run: () => {
      assert.equal(built.ok, true);
      assert.equal(built.content.schemaVersion, 1);
      assert.equal(built.content.family, "landing_page");
      assert.deepEqual(built.content.root.brandColorPalette, {
        primary: "#123456",
        secondary: "#234567",
        accent: "#345678",
        background: "#FFFFFF",
        text: "#111111",
      });
      assert.equal(built.content.modules[0].variantKey, "hero.standard@v1");
      assert.deepEqual(built.content.modules[0].fields.map((field) => field.fieldKey), [
        "title", "subtitle", "primaryCta",
      ]);
      assert.deepEqual(built.snapshot.exposedGenerationContext, exposedGenerationContext);
      assert.equal(JSON.stringify(built.snapshot).includes(LANDING_PAGE_ID), false);
      assert.equal(JSON.stringify(built.snapshot).includes(ACCOUNT_ID), false);
      assert.equal(JSON.stringify(built.snapshot).includes("safety_identifier"), false);
      assert.equal(Object.isFrozen(built.content), true);
      assert.equal(Object.isFrozen(built.snapshot), true);
    },
  },
  {
    name: "runtime schemas reject additional payload and unknown version while build rejects missing required field",
    run: () => {
      assert.equal(built.ok, true);
      const extra = structuredClone(built.content) as unknown as Record<string, unknown>;
      extra.unexpected = true;
      assert.equal(validateLandingPageMaterializedContentV1(extra).ok, false);

      const unknownVersion = structuredClone(built.content) as unknown as { schemaVersion: number };
      unknownVersion.schemaVersion = 2;
      assert.equal(validateLandingPageMaterializedContentV1(unknownVersion).ok, false);

      const missingCandidate = {
        ...candidate,
        modules: candidate.modules.map((module, index) => index === 0
          ? { ...module, fields: Object.fromEntries(Object.entries(module.fields).filter(([fieldKey]) => fieldKey !== "title")) }
          : module),
      } as LandingPageDraftCandidate;
      assert.equal(buildLandingPageInitialMaterialization({ context, candidate: missingCandidate, exposedGenerationContext }).ok, false);

      const forbiddenSnapshot = structuredClone(built.snapshot) as unknown as {
        exposedGenerationContext: Record<string, unknown>;
      };
      forbiddenSnapshot.exposedGenerationContext.safety_identifier = "forbidden";
      assert.equal(validateLandingPageGenerationContextSnapshotV1(forbiddenSnapshot).ok, false);
    },
  },
  {
    name: "json round trip preserves content order appearance and snapshot",
    run: () => {
      assert.equal(built.ok, true);
      const content = validateLandingPageMaterializedContentV1(JSON.parse(JSON.stringify(built.content)));
      const snapshot = validateLandingPageGenerationContextSnapshotV1(JSON.parse(JSON.stringify(built.snapshot)));
      assert.equal(content.ok, true);
      assert.equal(snapshot.ok, true);
      assert.deepEqual(content.value, built.content);
      assert.deepEqual(snapshot.value, built.snapshot);
      assert.deepEqual(content.value.root.brandColorPalette, built.content.root.brandColorPalette);
    },
  },
  {
    name: "materialized presentation is independent from later source changes",
    run: () => {
      const source = fixture();
      const materialized = buildLandingPageInitialMaterialization(source);
      assert.equal(materialized.ok, true);
      const frozenPalette = structuredClone(materialized.content.root.brandColorPalette);
      const mutableContext = source.context as unknown as {
        partA: { presentation: { brandColorPalette: { primary: string } } };
      };
      mutableContext.partA.presentation.brandColorPalette.primary = "#654321";
      assert.deepEqual(materialized.content.root.brandColorPalette, frozenPalette);
      assert.equal(materialized.content.root.brandColorPalette.primary, "#123456");
    },
  },
  {
    name: "form privacy URL is materialized server side and survives JSON round trip",
    run: () => {
      const source = formFixture();
      const materialized = buildLandingPageInitialMaterialization(source);
      assert.equal(materialized.ok, true);
      const interaction = materialized.content.modules[0].interactionContracts[0];
      assert.equal(interaction.kind, "form");
      assert.equal(
        interaction.kind === "form" ? interaction.consent.privacyPolicyUrl : null,
        "https://example.com/privacy",
      );
      assert.equal(JSON.stringify(source.candidate).includes("https://example.com/privacy"), false);
      const roundTrip = validateLandingPageMaterializedContentV1(
        JSON.parse(JSON.stringify(materialized.content)),
      );
      assert.equal(roundTrip.ok, true);
      const roundTripInteraction = roundTrip.value.modules[0].interactionContracts[0];
      assert.equal(
        roundTripInteraction.kind === "form"
          ? roundTripInteraction.consent.privacyPolicyUrl
          : null,
        "https://example.com/privacy",
      );
    },
  },
  {
    name: "render input resolves only from persisted content without mutable source reads",
    run: () => {
      assert.equal(built.ok, true);
      const persistedPayload = JSON.parse(JSON.stringify(built.content));
      const renderInput = resolveLandingPageMaterializedContentForRendering(persistedPayload);
      assert.equal(renderInput.ok, true);
      assert.deepEqual(renderInput.value.modules.map((module) => module.moduleKey), ["hero"]);
      assert.equal(renderInput.value.root.resolvedPresetKey, built.content.root.resolvedPresetKey);
      const runtimeSource = readFileSync(new URL("../conversion-content/landing-page/materialization.ts", import.meta.url), "utf8");
      assert.doesNotMatch(runtimeSource, /module-catalog|resolveLandingPageModuleCatalog/);
    },
  },
  {
    name: "readiness uses the exact projection and validates a sample when present",
    run: async () => {
      assert.equal(built.ok, true);
      let projection = "";
      const empty = await probeLandingPageMaterializationReadinessWithDependencies({
        ...storage(),
        probeProjection: async (value) => { projection = value; return { data: [], error: null }; },
      });
      assert.deepEqual(empty, { ok: true, ready: true, sample: null });
      assert.equal(projection, LANDING_PAGE_MATERIALIZATION_PROJECTION);

      const sample = await probeLandingPageMaterializationReadinessWithDependencies({
        ...storage(),
        probeProjection: async () => ({ data: [row()], error: null }),
      });
      assert.equal(sample.ok, true);
      assert.equal(sample.sample?.landingPageId, LANDING_PAGE_ID);

      const invalid = row() as Record<string, unknown>;
      invalid.content_json = { schemaVersion: 2 };
      assert.deepEqual(await probeLandingPageMaterializationReadinessWithDependencies({
        ...storage(),
        probeProjection: async () => ({ data: [invalid], error: null }),
      }), { ok: false, ready: false, error: "MATERIALIZATION_INVALID" });

      const incoherent = structuredClone(row());
      (incoherent.generation_context_snapshot_json as { structuralIdentities: { modules: Array<{ moduleKey: string }> } })
        .structuralIdentities.modules[0].moduleKey = "faq";
      assert.deepEqual(await probeLandingPageMaterializationReadinessWithDependencies({
        ...storage(),
        probeProjection: async () => ({ data: [incoherent], error: null }),
      }), { ok: false, ready: false, error: "MATERIALIZATION_INVALID" });
    },
  },
  {
    name: "relation column or grant failure keeps readiness closed",
    run: async () => {
      for (const code of ["42P01", "42703", "42501", "PGRST205"]) {
        const result = await probeLandingPageMaterializationReadinessWithDependencies({
          ...storage(),
          probeProjection: async () => ({ data: null, error: { code } }),
        });
        assert.deepEqual(result, { ok: false, ready: false, error: "MATERIALIZATION_STORAGE_UNAVAILABLE" });
      }
    },
  },
  {
    name: "storage validates reads and maps unique conflict without update",
    run: async () => {
      assert.equal(built.ok, true);
      const read = await readLandingPageMaterializationWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
        { ...storage(), readProjection: async () => ({ data: row(), error: null }) },
      );
      assert.equal(read.ok, true);
      assert.equal(read.value?.content.modules[0].moduleKey, "hero");

      let inserts = 0;
      const inserted = await insertLandingPageMaterializationWithDependencies({
        landingPageId: LANDING_PAGE_ID,
        accountId: ACCOUNT_ID,
        content: built.content,
        generationContextSnapshot: built.snapshot,
        createdBy: ACTOR_ID,
      }, {
        ...storage(),
        insertRow: async () => { inserts += 1; return { data: row(), error: null }; },
      });
      assert.equal(inserted.ok, true);
      assert.equal(inserts, 1);

      const conflict = await insertLandingPageMaterializationWithDependencies({
        landingPageId: LANDING_PAGE_ID,
        accountId: ACCOUNT_ID,
        content: built.content,
        generationContextSnapshot: built.snapshot,
        createdBy: ACTOR_ID,
      }, {
        ...storage(),
        readProjection: async () => ({ data: row(), error: null }),
        insertRow: async () => ({ data: null, error: { code: "23505" } }),
      });
      assert.equal(conflict.ok, true);
      assert.equal(conflict.value?.landingPageId, LANDING_PAGE_ID);
    },
  },
  {
    name: "not ready auth existing provider failure and invalid candidate never insert",
    run: async () => {
      for (const scenario of ["not_ready", "preparation_failure", "existing", "provider_failure", "invalid_candidate"] as const) {
        const calls = { prepare: 0, read: 0, provider: 0, insert: 0 };
        const result = await materializeFirstLandingPageDraftWithDependencies(
          { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
          orchestrationDependencies(scenario, calls),
        );
        assert.equal(result.ok, false);
        assert.equal(calls.insert, 0);
        assert.equal(calls.prepare, scenario === "not_ready" ? 0 : 1);
        assert.equal(calls.read, scenario === "not_ready" || scenario === "preparation_failure" ? 0 : 1);
        assert.equal(calls.provider, scenario === "provider_failure" || scenario === "invalid_candidate" ? 1 : 0);
      }
    },
  },
  {
    name: "valid first attempt executes one provider and one atomic insert",
    run: async () => {
      const calls = { prepare: 0, read: 0, provider: 0, insert: 0 };
      const result = await materializeFirstLandingPageDraftWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID, requestId: "req-e19-4-4" },
        orchestrationDependencies("success", calls),
      );
      assert.equal(result.ok, true);
      assert.deepEqual(calls, { prepare: 1, read: 1, provider: 1, insert: 1 });
    },
  },
  {
    name: "insert failure never overwrites or retries provider",
    run: async () => {
      const calls = { prepare: 0, read: 0, provider: 0, insert: 0 };
      const result = await materializeFirstLandingPageDraftWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
        orchestrationDependencies("insert_failure", calls),
      );
      assert.deepEqual(result, { ok: false, error: "MATERIALIZATION_INSERT_FAILED" });
      assert.deepEqual(calls, { prepare: 1, read: 1, provider: 1, insert: 1 });
    },
  },
  {
    name: "concurrent double submit returns the stored winner without overwrite",
    run: async () => {
      assert.equal(built.ok, true);
      let initialReads = 0;
      let providerCalls = 0;
      let insertAttempts = 0;
      let persistedRow: ReturnType<typeof row> | null = null;
      let releaseInitialReads: (() => void) | undefined;
      const bothInitialReads = new Promise<void>((resolve) => { releaseInitialReads = resolve; });
      const dependencies = {
        probeReadiness: async () => ({ ok: true as const, ready: true as const, sample: null }),
        prepareGeneration: async () => ({ ok: true as const, value: preparedGeneration() }),
        readMaterialization: async () => {
          initialReads += 1;
          if (initialReads === 2) releaseInitialReads?.();
          await bothInitialReads;
          return { ok: true as const, value: null };
        },
        requestCandidate: async (): Promise<GenerateLandingPageDraftCandidateResult> => {
          providerCalls += 1;
          return generatedCandidateResult();
        },
        insertMaterialization: async (input: {
          landingPageId: string;
          accountId: string;
          content: unknown;
          generationContextSnapshot: unknown;
          createdBy: string;
        }) => insertLandingPageMaterializationWithDependencies(input, {
          ...storage(),
          readProjection: async () => ({ data: persistedRow, error: null }),
          insertRow: async ({ row: candidateRow }) => {
            insertAttempts += 1;
            if (persistedRow) return { data: null, error: { code: "23505" } };
            persistedRow = { ...candidateRow, created_at: "2026-08-11T13:35:00.000Z" } as ReturnType<typeof row>;
            return { data: persistedRow, error: null };
          },
        }),
      };
      const [first, second] = await Promise.all([
        materializeFirstLandingPageDraftWithDependencies({ accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID }, dependencies),
        materializeFirstLandingPageDraftWithDependencies({ accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID }, dependencies),
      ]);
      assert.equal(first.ok, true);
      assert.equal(second.ok, true);
      assert.deepEqual(first.value, second.value);
      assert.equal(providerCalls, 2);
      assert.equal(insertAttempts, 2);
      assert.notEqual(persistedRow, null);
      assert.equal((persistedRow as unknown as ReturnType<typeof row>).landing_page_id, LANDING_PAGE_ID);
    },
  },
  {
    name: "migration is transactional write once tenant safe and least privilege",
    run: () => {
      const source = readFileSync(new URL("../../supabase/migrations/20260811133500_e19_4_4_landing_page_materializations.sql", import.meta.url), "utf8");
      assert.match(source, /^begin;/);
      assert.match(source, /primary key/);
      assert.match(source, /foreign key \(landing_page_id, account_id\)[\s\S]*account_landing_pages\(id, account_id\)/);
      assert.match(source, /jsonb_typeof\(content_json\) = 'object'/);
      assert.match(source, /enable row level security/);
      assert.match(source, /grant select, insert[\s\S]*to service_role/);
      assert.equal(/create policy|grant[\s\S]*update|grant[\s\S]*delete|create (view|function)/i.test(source), false);
      assert.match(source, /commit;\s*$/);
    },
  },
];

function orchestrationDependencies(
  scenario: "not_ready" | "preparation_failure" | "existing" | "provider_failure" | "invalid_candidate" | "insert_failure" | "success",
  calls: { prepare: number; read: number; provider: number; insert: number },
) {
  assert.equal(built.ok, true);
  return {
    probeReadiness: async () => scenario === "not_ready"
      ? { ok: false as const, ready: false as const, error: "MATERIALIZATION_STORAGE_UNAVAILABLE" as const }
      : { ok: true as const, ready: true as const, sample: null },
    prepareGeneration: async () => {
      calls.prepare += 1;
      if (scenario === "preparation_failure") return { ok: false as const, stage: "context" as const, code: "ACCOUNT_CONTEXT_UNAUTHORIZED" as const };
      return { ok: true as const, value: preparedGeneration() };
    },
    readMaterialization: async () => {
      calls.read += 1;
      return { ok: true as const, value: scenario === "existing" ? materialization() : null };
    },
    requestCandidate: async (): Promise<GenerateLandingPageDraftCandidateResult> => {
      calls.provider += 1;
      if (scenario === "provider_failure") return { ok: false as const, stage: "provider" as const, kind: "http_error" as const };
      const generated = generatedCandidateResult();
      return scenario === "invalid_candidate"
        ? { ...generated, candidate: { ...candidate, modules: [] } }
        : generated;
    },
    insertMaterialization: async () => {
      calls.insert += 1;
      if (scenario === "insert_failure") return { ok: false as const, error: "MATERIALIZATION_INSERT_FAILED" as const };
      return { ok: true as const, value: materialization() };
    },
  };
}

function generatedCandidateResult(): Extract<GenerateLandingPageDraftCandidateResult, { ok: true }> {
  return {
    ok: true,
    actorUserId: ACTOR_ID,
    context,
    candidate,
    exposedGenerationContext,
    responseId: "resp_fixture",
    inputTokens: 1,
    outputTokens: 1,
  };
}

function preparedGeneration(): PreparedLandingPageDraftGeneration {
  return {
    accountId: ACCOUNT_ID,
    landingPageId: LANDING_PAGE_ID,
    actorUserId: ACTOR_ID,
    context,
  };
}

function storage(): LandingPageMaterializationStorageDependencies {
  return {
    probeProjection: async () => ({ data: [], error: null }),
    readProjection: async () => ({ data: null, error: null }),
    insertRow: async () => ({ data: row(), error: null }),
  };
}

function row() {
  assert.equal(built.ok, true);
  return {
    landing_page_id: LANDING_PAGE_ID,
    account_id: ACCOUNT_ID,
    content_json: built.content,
    generation_context_snapshot_json: built.snapshot,
    created_by: ACTOR_ID,
    created_at: "2026-08-11T13:35:00.000Z",
  };
}

function materialization() {
  assert.equal(built.ok, true);
  return {
    landingPageId: LANDING_PAGE_ID,
    accountId: ACCOUNT_ID,
    content: built.content,
    generationContextSnapshot: built.snapshot,
    createdBy: ACTOR_ID,
    createdAt: "2026-08-11T13:35:00.000Z",
  };
}

function fixture() {
  const root = resolveLandingPageRootParameters({ rootVersion: 1 });
  const resolved = resolveLandingPageModuleCatalog({
    moduleCatalogVersion: 1,
    rootVersion: 1,
    moduleKey: "hero",
    moduleVersion: 1,
    variantName: "standard",
    variantVersion: 1,
    funnelProfileKey: "bofu",
  });
  assert.equal(root.ok, true);
  assert.equal(resolved.ok, true);
  const context = {
    contractVersion: 1,
    partA: {
      landingPage: { id: LANDING_PAGE_ID, accountId: ACCOUNT_ID, status: "draft" },
      planKey: "starter",
      servedTaxon: { id: "taxon-1", name: "Taxon", slug: "taxon", level: "niche", isActive: true, parentId: null },
      generationProfile: { profileId: "profile-1", ownerTaxonId: "taxon-1", relation: "own" },
      versions: {
        valuesInputCatalogVersion: 2,
        bindingInputCatalogVersion: 3,
        rootVersion: 1,
        moduleCatalogVersion: 1,
        generationProfileVersion: 1,
        research: { contractVersion: 1, effectiveResearchVersion: 1 },
      },
      root: root.value,
      presentation: {
        brandColorPalette: {
          primary: "#123456",
          secondary: "#234567",
          accent: "#345678",
          background: "#FFFFFF",
          text: "#111111",
        },
      },
      selection: [],
      modules: [{
        recommendedOrder: 10,
        priority: "P1",
        effectiveVariantKey: "hero.standard@v1",
        module: resolved.value.module,
        variant: resolved.value.variant,
        effectiveRoot: resolved.value.effectiveRoot,
        fieldContract: resolved.value.fieldContract,
      }],
    },
    partB: {
      research: { contractVersion: 1, servedTaxonId: "taxon-1", versions: {}, endCustomer: { researches: [] }, businessBuyer: { researches: [] } },
      facts: [],
      capabilitySupport: [],
      modules: [{ moduleKey: "hero", effectiveVariantKey: "hero.standard@v1", funnelCopyProfile: resolved.value.funnelCopyProfile }],
    },
  } as unknown as LandingPageGenerationContextPackage;
  const candidate: LandingPageDraftCandidate = {
    candidateVersion: 1,
    modules: [{
      order: 0,
      moduleKey: "hero",
      moduleVersion: 1,
      variantKey: "hero.standard@v1",
      variantVersion: 1,
      fieldContractKey: "hero.standard@v1",
      interactionContracts: [],
      fields: {
        title: { kind: "text", value: "Encontre o imóvel ideal" },
        subtitle: { kind: "text", value: "Atendimento direto e transparente." },
        primaryCta: {
          kind: "action",
          label: "Fale conosco",
          binding: { fieldKey: "primary_conversion_channel", channel: "whatsapp", destination: "+5511999999999" },
        },
      },
    }],
  };
  return {
    context,
    candidate,
    exposedGenerationContext: { generationContextContractVersion: 1, planKey: "starter", authorizedContent: { facts: [] } },
  };
}

function formFixture() {
  const source = fixture();
  const resolved = resolveLandingPageModuleCatalog({
    moduleCatalogVersion: 1,
    rootVersion: 1,
    moduleKey: "hero",
    moduleVersion: 1,
    variantName: "form",
    variantVersion: 1,
    funnelProfileKey: "bofu",
  });
  assert.equal(resolved.ok, true);
  const context = {
    ...source.context,
    partA: {
      ...source.context.partA,
      presentation: {
        ...source.context.partA.presentation,
        privacyPolicyUrl: "https://example.com/privacy",
      },
      modules: [{
        recommendedOrder: 10,
        priority: "P1" as const,
        effectiveVariantKey: "hero.form@v1",
        module: resolved.value.module,
        variant: resolved.value.variant,
        effectiveRoot: resolved.value.effectiveRoot,
        fieldContract: resolved.value.fieldContract,
      }],
    },
  } as LandingPageGenerationContextPackage;
  const candidate: LandingPageDraftCandidate = {
    ...source.candidate,
    modules: [{
      ...source.candidate.modules[0],
      variantKey: "hero.form@v1",
      fieldContractKey: "hero.form@v1",
      interactionContracts: resolved.value.variant.interactionContracts,
      fields: {
        ...source.candidate.modules[0].fields,
        primaryCta: {
          kind: "action",
          label: "Validar contato",
          binding: {
            fieldKey: "primary_conversion_channel",
            channel: "form",
            destination: null,
          },
        },
      },
    }],
  };
  return { context, candidate, exposedGenerationContext: source.exposedGenerationContext };
}

async function runValidationCases() {
  for (const validationCase of cases) {
    await validationCase.run();
    console.log(`ok - ${validationCase.name}`);
  }
}

runValidationCases().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import assert from "node:assert/strict";

import {
  resolveLandingPageRootParameters,
} from "../conversion-content/landing-page";
import {
  resolveLandingPageModuleCatalog,
  type ResolvedLandingPageModuleCatalog,
} from "../conversion-content/landing-page/module-catalog";
import {
  resolveOpenAiProductWorkload,
  type OpenAiWorkloadEvent,
} from "../openai-workloads";
import {
  createLandingPageDraftSafetyIdentifier,
  requestLandingPageDraftCandidate,
} from "./adapters/landingPageGenerationOpenAiAdapter";
import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import { generateLandingPageDraftCandidateWithDependencies } from "./landingPageDraftGeneration";
import {
  buildLandingPageDraftGenerationRequest,
  validateLandingPageDraftCandidate,
  type LandingPageDraftGenerationRequest,
} from "./landingPageGeneration";

const ACTOR_ID = "9a6af815-42e9-4a12-8ce2-ddae9dac1e15";
const ACCOUNT_ID = "6ecaf813-957e-4f2b-9ea7-3f2cb204a603";
const LANDING_PAGE_ID = "4d91020a-07e5-4bf9-a1aa-272bbc0366ff";
const context = buildContext([
  resolveModule("hero", "standard", "bofu"),
  resolveModule("faq", "accordion", "bofu"),
]);

const cases: readonly Readonly<{ name: string; run: () => void | Promise<void> }>[] = [
  {
    name: "server boundary compiles authorized E19.3 context before provider",
    run: async () => {
      const order: string[] = [];
      const result = await generateLandingPageDraftCandidateWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
        {
          loadAuthenticatedActorId: async () => ACTOR_ID,
          compileContext: async () => {
            order.push("context");
            return { ok: true, value: context };
          },
          requestCandidate: async () => {
            order.push("provider");
            const request = successfulRequest(context);
            const candidate = validateLandingPageDraftCandidate(validProviderPayload(request), request);
            assert.equal(candidate.ok, true);
            return {
              ok: true,
              candidate: candidate.value,
              exposedGenerationContext: request.exposedGenerationContext,
              responseId: "resp_boundary",
              inputTokens: 1,
              outputTokens: 1,
            };
          },
        },
      );
      assert.equal(result.ok, true);
      assert.deepEqual(order, ["context", "provider"]);
    },
  },
  {
    name: "authorization or E19.3 failure prevents provider",
    run: async () => {
      let providerCalls = 0;
      const result = await generateLandingPageDraftCandidateWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID },
        {
          loadAuthenticatedActorId: async () => ACTOR_ID,
          compileContext: async () => ({
            ok: false,
            error: { code: "ACCOUNT_CONTEXT_UNAUTHORIZED", message: "safe" },
          }),
          requestCandidate: async () => {
            providerCalls += 1;
            return { ok: false, kind: "http_error" };
          },
        },
      );
      assert.deepEqual(result, { ok: false, stage: "context", code: "ACCOUNT_CONTEXT_UNAUTHORIZED" });
      assert.equal(providerCalls, 0);
    },
  },
  {
    name: "caller cannot choose or diverge from the authenticated actor identity",
    run: async () => {
      let dependencyCalls = 0;
      const result = await generateLandingPageDraftCandidateWithDependencies(
        { accountId: ACCOUNT_ID, landingPageId: LANDING_PAGE_ID, actorUserId: "00000000-0000-4000-8000-000000000999" },
        {
          loadAuthenticatedActorId: async () => { dependencyCalls += 1; return ACTOR_ID; },
          compileContext: async () => { dependencyCalls += 1; return { ok: true, value: context }; },
          requestCandidate: async () => { dependencyCalls += 1; return { ok: false, kind: "http_error" }; },
        },
      );
      assert.deepEqual(result, { ok: false, stage: "context", code: "INVALID_INPUT" });
      assert.equal(dependencyCalls, 0);
    },
  },
  {
    name: "request is strict deterministic and excludes tenant identifiers",
    run: () => {
      const safetyIdentifier = createLandingPageDraftSafetyIdentifier(ACTOR_ID);
      const request = buildRequest(context, safetyIdentifier);
      assert.equal(request.ok, true);
      assert.equal(request.body.model, "gpt-5.4-mini");
      assert.deepEqual(request.body.reasoning, { effort: "none" });
      assert.equal(request.body.store, false);
      assert.equal(request.body.safety_identifier, safetyIdentifier);
      assert.equal(safetyIdentifier.length, 64);
      assert.equal(safetyIdentifier.includes(ACTOR_ID), false);
      assert.equal(request.maxOutputTokens >= 512 && request.maxOutputTokens <= 16_384, true);
      assert.equal(request.serialized.includes("account-secret"), false);
      assert.equal(request.serialized.includes("landing-page-secret"), false);
      const format = ((request.body.text as Record<string, unknown>).format as Record<string, unknown>);
      assert.equal(format.type, "json_schema");
      assert.equal(format.strict, true);
      assert.equal(JSON.stringify(format.schema).includes('"additionalProperties":false'), true);
      assert.equal(Object.isFrozen(request.exposedGenerationContext), true);
    },
  },
  {
    name: "adapter propagates a resolved non-none reasoning effort unchanged",
    run: async () => {
      const effective = resolveOpenAiProductWorkload("landing_page_draft_generation");
      assert.equal(effective.ok, true);
      if (!effective.ok) return;
      assert.equal(effective.value.model, "gpt-5.4-mini");
      assert.equal(effective.value.reasoningEffort, "none");

      const preview = successfulRequest(context);
      const providerPayload = validProviderPayload(preview);
      let capturedBody: Record<string, unknown> | null = null;
      const result = await requestLandingPageDraftCandidate(
        { context, actorUserId: ACTOR_ID },
        {
          apiKey: "test-key",
          resolveWorkload: () => ({
            ok: true,
            value: { ...effective.value, reasoningEffort: "xhigh" },
          }),
          fetchImpl: async (_url, init) => {
            capturedBody = JSON.parse(String(init?.body));
            return responseWith(providerPayload);
          },
          emitEvent: () => undefined,
          emitOutcome: () => undefined,
        },
      );
      assert.equal(result.ok, true);
      assert.deepEqual((capturedBody as unknown as Record<string, unknown>).reasoning, { effort: "xhigh" });
    },
  },
  {
    name: "candidate restores canonical identity order fields interactions and bindings",
    run: () => {
      const request = successfulRequest(context);
      const payload = validProviderPayload(request);
      const result = validateLandingPageDraftCandidate(payload, request);
      assert.equal(result.ok, true);
      assert.deepEqual(result.value.modules.map((module) => [module.order, module.moduleKey, module.variantKey]), [
        [0, "hero", "hero.standard@v1"],
        [1, "faq", "faq.accordion@v1"],
      ]);
      const hero = result.value.modules[0];
      assert.deepEqual(hero.interactionContracts, []);
      assert.equal(Object.hasOwn(hero.fields, "media"), false);
      assert.deepEqual(hero.fields.primaryCta, {
        kind: "action",
        label: "Conteudo autorizado",
        binding: {
          fieldKey: "primary_conversion_channel",
          channel: "whatsapp",
          destination: "+5511999999999",
        },
      });
      assert.equal(Object.isFrozen(result.value), true);
    },
  },
  {
    name: "whole candidate is rejected for missing extra malformed or overlong content",
    run: () => {
      const request = successfulRequest(context);
      const missing = structuredClone(validProviderPayload(request));
      delete (missing.modules as Record<string, unknown>).module_002;
      assert.equal(validateLandingPageDraftCandidate(missing, request).ok, false);

      const extra = structuredClone(validProviderPayload(request));
      (extra.modules as Record<string, unknown>).invented = {};
      assert.equal(validateLandingPageDraftCandidate(extra, request).ok, false);

      const malformed = structuredClone(validProviderPayload(request));
      const hero = (malformed.modules as Record<string, Record<string, Record<string, unknown>>>).module_001;
      hero.fields.field_002 = "x".repeat(10_000);
      assert.equal(validateLandingPageDraftCandidate(malformed, request).ok, false);
    },
  },
  {
    name: "authorized technical references are reconstructed per collection item",
    run: () => {
      const socialProof = buildContext(
        [resolveModule("social_proof", "standard", "bofu")],
        [{
          fieldKey: "social_proof.standard.items[].evidenceRef",
          value: ["proof-ref-1", "proof-ref-2"],
          purpose: "authorized evidence",
          source: "user",
          provenance: [],
        }],
      );
      const request = successfulRequest(socialProof);
      const payload = validProviderPayload(request);
      const result = validateLandingPageDraftCandidate(payload, request);
      assert.equal(result.ok, true);
      const items = result.value.modules[0].fields.items;
      assert.equal(items.kind, "collection");
      assert.deepEqual(items.items.map((item) => item.fields.evidenceRef), [
        { kind: "technical_reference", referenceKey: "social_proof.standard.items[].evidenceRef", value: "proof-ref-1" },
        { kind: "technical_reference", referenceKey: "social_proof.standard.items[].evidenceRef", value: "proof-ref-2" },
      ]);
    },
  },
  {
    name: "unresolved required technical references still fail before provider transport",
    run: () => {
      const unresolved = buildContext([resolveModule("social_proof", "standard", "bofu")]);
      assert.deepEqual(buildRequest(unresolved, "a".repeat(64)), { ok: false, kind: "request_invalid" });
    },
  },
  {
    name: "real E19.3 pilot composition produces one integral candidate",
    run: () => {
      const pilot = buildContext([
        resolveModule("hero", "standard", "bofu"),
        resolveModule("trust_bar", "standard", "bofu"),
        resolveModule("problem_solution", "standard", "bofu"),
        resolveModule("offer", "standard", "bofu"),
        resolveModule("process", "standard", "bofu"),
        resolveModule("technical_assurance", "standard", "bofu"),
        resolveModule("faq", "standard", "bofu"),
        resolveModule("benefits", "standard", "bofu"),
        resolveModule("final_cta", "standard", "bofu"),
      ]);
      const request = successfulRequest(pilot);
      const result = validateLandingPageDraftCandidate(validProviderPayload(request), request);
      assert.equal(result.ok, true);
      assert.deepEqual(result.value.modules.map((module) => module.moduleKey), [
        "hero", "trust_bar", "problem_solution", "offer", "process",
        "technical_assurance", "faq", "benefits", "final_cta",
      ]);
    },
  },
  {
    name: "adapter performs one non streaming call and emits only safe metadata",
    run: async () => {
      const preview = successfulRequest(context);
      const providerPayload = validProviderPayload(preview);
      let calls = 0;
      let capturedBody: Record<string, unknown> | null = null;
      const events: OpenAiWorkloadEvent[] = [];
      const outcomes: unknown[] = [];
      const result = await requestLandingPageDraftCandidate(
        { context, actorUserId: ACTOR_ID, requestId: "req-e19-4-3" },
        {
          apiKey: "test-key",
          fetchImpl: async (_url, init) => {
            calls += 1;
            capturedBody = JSON.parse(String(init?.body));
            return responseWith(providerPayload);
          },
          emitEvent: (event) => events.push(event),
          emitOutcome: (event) => outcomes.push(event),
          now: (() => { let value = 100; return () => value += 5; })(),
        },
      );
      assert.equal(result.ok, true);
      assert.equal(calls, 1);
      assert.equal((capturedBody as unknown as Record<string, unknown>).model, "gpt-5.4-mini");
      assert.deepEqual((capturedBody as unknown as Record<string, unknown>).reasoning, { effort: "none" });
      assert.equal((capturedBody as unknown as Record<string, unknown>).store, false);
      assert.equal(Object.hasOwn(capturedBody as unknown as object, "stream"), false);
      assert.equal(events.length, 1);
      assert.equal(events[0].workload, "landing_page_draft_generation");
      assert.equal(events[0].result, "success");
      assert.deepEqual(outcomes, [{
        event: "landing_page_draft_generation",
        result: "success",
        reason: "generated",
        request_id: "req-e19-4-3",
        latency_ms: 5,
      }]);
      const serializedEvents = JSON.stringify({ events, outcomes });
      assert.equal(serializedEvents.includes(ACTOR_ID), false);
      assert.equal(serializedEvents.includes("Conteudo autorizado"), false);
      assert.equal(serializedEvents.includes("test-key"), false);
    },
  },
  {
    name: "adapter never retries refusal incomplete invalid json or invalid candidate",
    run: async () => {
      const scenarios = [
        { expected: "refusal", body: { id: "resp_refusal", output: [{ content: [{ type: "refusal", refusal: "no" }] }] } },
        { expected: "incomplete", body: { id: "resp_incomplete", status: "incomplete", output: [] } },
        { expected: "invalid_response", body: { id: "resp_json", output: [{ content: [{ type: "output_text", text: "{" }] }] } },
        { expected: "candidate_invalid", body: { id: "resp_candidate", output: [{ content: [{ type: "output_text", text: JSON.stringify({ modules: {} }) }] }] } },
      ] as const;
      for (const scenario of scenarios) {
        let calls = 0;
        const result = await requestLandingPageDraftCandidate(
          { context, actorUserId: ACTOR_ID },
          {
            apiKey: "test-key",
            fetchImpl: async () => {
              calls += 1;
              return new Response(JSON.stringify(scenario.body), { status: 200 });
            },
            emitEvent: () => undefined,
            emitOutcome: () => undefined,
          },
        );
        assert.equal(result.ok, false);
        assert.equal(result.kind, scenario.expected);
        assert.equal(calls, 1);
      }
    },
  },
  {
    name: "missing configuration fails before transport",
    run: async () => {
      let calls = 0;
      const result = await requestLandingPageDraftCandidate(
        { context, actorUserId: ACTOR_ID },
        {
          apiKey: "",
          fetchImpl: async () => { calls += 1; return new Response(); },
          emitEvent: () => undefined,
          emitOutcome: () => undefined,
        },
      );
      assert.deepEqual(result, { ok: false, kind: "configuration_invalid" });
      assert.equal(calls, 0);
    },
  },
];

function buildRequest(generationContext: LandingPageGenerationContextPackage, safetyIdentifier: string) {
  return buildLandingPageDraftGenerationRequest({
    context: generationContext,
    model: "gpt-5.4-mini",
    reasoningEffort: "none",
    safetyIdentifier,
  });
}

function successfulRequest(generationContext: LandingPageGenerationContextPackage) {
  const request = buildRequest(generationContext, "a".repeat(64));
  assert.equal(request.ok, true);
  return request as Extract<LandingPageDraftGenerationRequest, { ok: true }>;
}

function validProviderPayload(request: Extract<LandingPageDraftGenerationRequest, { ok: true }>) {
  return {
    modules: Object.fromEntries(request.moduleSlots.map((moduleSlot) => [
      moduleSlot.slotKey,
      {
        fields: Object.fromEntries(moduleSlot.fieldSlots.map((fieldSlot) => {
          const field = fieldSlot.field;
          if (field.fieldKind === "image" || field.fieldKind === "technical_reference") {
            return [fieldSlot.slotKey, null];
          }
          if (field.fieldKind === "action") {
            return [fieldSlot.slotKey, { label: "Conteudo autorizado" }];
          }
          if (field.fieldKind === "collection") {
            const itemCount = fieldSlot.itemSlots?.find((itemSlot) => itemSlot.referenceValues)?.referenceValues?.length
              ?? field.cardinality.min;
            return [fieldSlot.slotKey, Array.from({ length: itemCount }, () =>
              Object.fromEntries((fieldSlot.itemSlots ?? []).map((itemSlot) => [
                itemSlot.slotKey,
                itemSlot.field.fieldKind === "technical_reference" ? null : "Conteudo autorizado",
              ])))];
          }
          return [fieldSlot.slotKey, field.cardinality.min === 0 ? null : "Conteudo autorizado"];
        })),
      },
    ])),
  };
}

function responseWith(providerPayload: unknown) {
  return new Response(JSON.stringify({
    id: "resp_e19_4_3",
    status: "completed",
    usage: { input_tokens: 100, output_tokens: 50 },
    output: [{ content: [{ type: "output_text", text: JSON.stringify(providerPayload) }] }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

function resolveModule(
  moduleKey: "hero" | "trust_bar" | "problem_solution" | "offer" | "process" | "technical_assurance" | "faq" | "benefits" | "final_cta" | "social_proof",
  variantName: "standard" | "accordion",
  funnelProfileKey: "bofu",
) {
  const result = resolveLandingPageModuleCatalog({
    moduleCatalogVersion: 1,
    rootVersion: 1,
    moduleKey,
    moduleVersion: 1,
    variantName,
    variantVersion: 1,
    funnelProfileKey,
  });
  assert.equal(result.ok, true);
  return result.value;
}

function buildContext(
  resolvedModules: readonly ResolvedLandingPageModuleCatalog[],
  extraFacts: readonly unknown[] = [],
): LandingPageGenerationContextPackage {
  const root = resolveLandingPageRootParameters({ rootVersion: 1 });
  assert.equal(root.ok, true);
  return {
    contractVersion: 1,
    partA: {
      landingPage: { id: "landing-page-secret", accountId: "account-secret", status: "draft" },
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
      selection: [],
      modules: resolvedModules.map((resolved, index) => ({
        recommendedOrder: (index + 1) * 10,
        priority: "P1",
        effectiveVariantKey: resolved.variant.variantKey,
        module: resolved.module,
        variant: resolved.variant,
        effectiveRoot: resolved.effectiveRoot,
        fieldContract: resolved.fieldContract,
      })),
    },
    partB: {
      research: {
        contractVersion: 1,
        servedTaxonId: "taxon-1",
        versions: { contractVersion: 1, effectiveResearchVersion: 1 },
        endCustomer: { researches: [] },
        businessBuyer: { researches: [] },
      },
      facts: [
        { fieldKey: "primary_conversion_channel", value: "whatsapp", purpose: "channel", source: "user", provenance: [] },
        { fieldKey: "whatsapp_destination", value: "+5511999999999", purpose: "destination", source: "user", provenance: [] },
        ...extraFacts,
      ],
      capabilitySupport: [],
      generationGuidance: "Use somente fatos autorizados.",
      modules: resolvedModules.map((resolved) => ({
        moduleKey: resolved.module.moduleKey,
        effectiveVariantKey: resolved.variant.variantKey,
        funnelCopyProfile: resolved.funnelCopyProfile,
      })),
    },
  } as unknown as LandingPageGenerationContextPackage;
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

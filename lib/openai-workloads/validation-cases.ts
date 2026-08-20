import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveNicheWithOpenAi } from "../onboarding/niche-resolution/adapters/openAiResolver";
import { requestCommercialActivationOpenAi } from "../conversion-content/adapters/commercialActivationOpenAiAdapter";
import { translateOperationalConfigurationRows } from "./adapters/operationalConfigurationAdapterCore";
import * as publicApi from "./index";
import {
  createOpenAiImageWorkloadFailureEvent,
  createOpenAiImageWorkloadSuccessEvent,
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  listOpenAiWorkloadInventory,
  normalizeOpenAiResponseUsage,
  resolveOpenAiImageWorkload,
  resolveOpenAiProductWorkload,
  resolveOpenAiWorkloadEnvironment,
  type OpenAiOperationalConfigurationReader,
  type OpenAiWorkloadEvent,
} from "./index";

const productIds = [
  "niche_resolution",
  "commercial_activation_draft_generation",
] as const;

const landingPageTextWorkloadId = "landing_page_draft_generation" as const;
const landingPageImageWorkloadId = "landing_page_draft_image_generation" as const;

const cases = [
  {
    name: "niche request uses resolved model and effort with deterministic transport",
    run: async () => {
      const candidate = {
        taxonId: "10000000-0000-4000-8000-000000000001",
        name: "Corretores de imoveis",
        slug: "corretores-de-imoveis",
        level: "niche" as const,
        parentId: null,
        parentName: null,
        matchedAliases: ["corretor"],
        matchSource: "alias",
        score: 0.72,
      };
      const decision = {
        confidence: "medium" as const,
        selectedCandidate: candidate,
        shouldUseDeterministicMatch: false,
        shouldEscalateToAi: true,
        aiEscalationMode: "rerank_candidates" as const,
        needsAdminReview: false,
        reason: "medium_confidence_below_high_threshold" as const,
      };
      let requestBody: Record<string, unknown> | null = null;
      const events: OpenAiWorkloadEvent[] = [];
      const result = await resolveNicheWithOpenAi({
        rawInput: "corretor",
        decision,
        candidates: [candidate],
        apiKey: "test-key",
      }, {
        environment: "development",
        fetchImpl: async (_url, init) => {
          requestBody = JSON.parse(String(init?.body));
          return new Response(JSON.stringify({
            id: "resp_niche_123",
            usage: {
              input_tokens: 50,
              input_tokens_details: { cached_tokens: 20 },
              output_tokens: 12,
              output_tokens_details: { reasoning_tokens: 2 },
              total_tokens: "62",
            },
            output_text: JSON.stringify({
              uxMode: "confirm_single",
              message: "Voce quis dizer este nicho?",
              options: [{
                taxonId: candidate.taxonId,
                name: candidate.name,
                slug: candidate.slug,
                confidence: "medium",
                reason: "official_candidate",
                isOfficial: true,
              }],
              needsAdminReview: false,
              needsUserConfirmation: true,
              shouldCreateOfficialLink: false,
              suggestedNewTaxonLabel: null,
              reason: "ai_resolution_completed",
            }),
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        },
        emitEvent: (event) => events.push(event),
        now: (() => {
          let current = 300;
          return () => (current += 7);
        })(),
      });

      assert.equal(result.ok, true);
      const capturedRequest = requestBody as unknown as Record<string, unknown>;
      assert.equal(capturedRequest.model, "gpt-5.4-mini");
      assert.deepEqual(capturedRequest.reasoning, { effort: "none" });
      assert.equal(events.length, 1);
      assert.deepEqual(events[0], {
        workload: "niche_resolution",
        apiKind: "responses_text",
        attemptId: null,
        requestId: null,
        promptVersion: null,
        contractVersion: null,
        environment: "development",
        configurationSource: "repo_catalog",
        configurationRevision: "v2",
        model: "gpt-5.4-mini",
        reasoningEffort: "none",
        responseId: "resp_niche_123",
        httpStatus: null,
        providerRequestId: null,
        providerErrorCode: null,
        providerErrorType: null,
        result: "success",
        failureCategory: null,
        latencyMs: 7,
        inputTokens: 50,
        cachedInputTokens: 20,
        cacheWriteTokens: null,
        outputTokens: 12,
        reasoningTokens: 2,
        totalTokens: null,
      });

      const invalidResponseEvents: OpenAiWorkloadEvent[] = [];
      const invalidResponse = await resolveNicheWithOpenAi({
        rawInput: "corretor",
        decision,
        candidates: [candidate],
        apiKey: "test-key",
      }, {
        environment: "development",
        fetchImpl: async () => new Response("{", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
        emitEvent: (event) => invalidResponseEvents.push(event),
      });
      assert.equal(invalidResponse.ok, false);
      assert.equal(invalidResponseEvents[0]?.failureCategory, "invalid_response");

      let transportCalls = 0;
      const invalidEvents: OpenAiWorkloadEvent[] = [];
      const invalid = await resolveNicheWithOpenAi({
        rawInput: "corretor",
        decision,
        candidates: [candidate],
        apiKey: "",
      }, {
        environment: "development",
        fetchImpl: async () => {
          transportCalls += 1;
          return new Response();
        },
        emitEvent: (event) => invalidEvents.push(event),
      });
      assert.equal(invalid.ok, false);
      assert.equal(transportCalls, 0);
      assert.equal(invalidEvents[0]?.failureCategory, "configuration_invalid");
      assert.equal(invalidEvents[0]?.latencyMs, null);
    },
  },
  {
    name: "inventory exposes five unique canonical workloads",
    run: () => {
      const inventory = listOpenAiWorkloadInventory();
      assert.equal(inventory.length, 5);
      assert.equal(new Set(inventory.map((item) => item.id)).size, 5);
      assert.deepEqual(
        inventory.map((item) => item.id),
        [
          ...productIds,
          landingPageTextWorkloadId,
          landingPageImageWorkloadId,
          "supabase_inspect",
        ],
      );
    },
  },
  {
    name: "existing text workloads preserve their model on catalog revision v2",
    run: async () => {
      for (const workloadId of productIds) {
        const result = await resolveOpenAiProductWorkload(
          workloadId,
          "development",
        );
        assert.equal(result.ok, true);
        assert.equal(result.value.model, "gpt-5.4-mini");
        assert.equal(result.value.reasoningEffort, "none");
        assert.equal(result.value.source, "repo_catalog");
        assert.equal(result.value.revision, "v2");
        assert.equal(result.value.configurationKind, "effective");
        assert.equal(result.value.effectiveConfigurationVerified, true);
      }
    },
  },
  {
    name: "landing page text and image workloads resolve independent configurations",
    run: async () => {
      const text = await resolveOpenAiProductWorkload(
        landingPageTextWorkloadId,
        "development",
      );
      assert.equal(text.ok, true);
      assert.equal(text.value.apiKind, "responses_text");
      assert.equal(text.value.model, "gpt-5.6-luna");
      assert.equal(text.value.reasoningEffort, "max");
      assert.equal(text.value.revision, "v2");

      const image = await resolveOpenAiImageWorkload(
        landingPageImageWorkloadId,
        "development",
      );
      assert.equal(image.ok, true);
      assert.deepEqual(image.value, {
        id: landingPageImageWorkloadId,
        displayName: "Geração da imagem principal da landing page em draft",
        classification: "product_runtime",
        configurationKind: "effective",
        apiKind: "image_generation",
        consumer: "E19.4 — mídia principal da candidata validada",
        fallback: "Falhar a tentativa sem criar revisão",
        model: "gpt-image-2",
        size: "1536x1024",
        quality: "medium",
        format: "webp",
        compression: 80,
        moderation: "auto",
        reasoningEffort: "not_applicable",
        source: "repo_catalog",
        revision: "v2",
        effectiveConfigurationVerified: true,
      });

      const textAsImage = await resolveOpenAiImageWorkload(
        landingPageTextWorkloadId,
        "development",
      );
      assert.equal(textAsImage.ok, false);
      assert.equal(textAsImage.error.code, "NOT_IMAGE_GENERATION_WORKLOAD");
      const imageAsText = await resolveOpenAiProductWorkload(
        landingPageImageWorkloadId,
        "development",
      );
      assert.equal(imageAsText.ok, false);
      assert.equal(imageAsText.error.code, "NOT_TEXT_PRODUCT_WORKLOAD");
    },
  },
  {
    name: "image events expose media metrics without textual token fields",
    run: async () => {
      const resolved = await resolveOpenAiImageWorkload(
        landingPageImageWorkloadId,
        "development",
      );
      assert.equal(resolved.ok, true);
      const success = createOpenAiImageWorkloadSuccessEvent({
        workload: resolved.value,
        environment: "preview",
        requestId: " req_image_123 ",
        latencyMs: 42,
        imageCount: 1,
        width: 1536,
        height: 1024,
        visualBriefVersion: "e19.4-visual-brief-v1",
      });
      assert.equal(success.result, "success");
      assert.equal(success.requestId, "req_image_123");
      assert.equal(success.imageCount, 1);
      assert.equal(success.visualBriefVersion, "e19.4-visual-brief-v1");
      assert.equal("inputTokens" in success, false);
      assert.equal("reasoningEffort" in success, false);

      const failure = createOpenAiImageWorkloadFailureEvent(
        { workload: resolved.value },
        "timeout",
      );
      assert.equal(failure.result, "failure");
      assert.equal(failure.failureCategory, "timeout");
      assert.equal(Object.isFrozen(failure), true);
    },
  },
  {
    name: "operational reference stays outside the product resolver",
    run: async () => {
      const result = await resolveOpenAiProductWorkload(
        "supabase_inspect",
        "development",
      );
      assert.equal(result.ok, false);
      assert.equal(result.error.code, "NOT_PRODUCT_RUNTIME_WORKLOAD");

      const reference = listOpenAiWorkloadInventory().find(
        (item) => item.id === "supabase_inspect",
      );
      assert.ok(reference);
      assert.equal(reference.configurationKind, "inventory_reference");
      assert.equal(reference.model, "gpt-4.1-mini");
      assert.equal(reference.reasoningEffort, "not_applicable");
      assert.equal(reference.source, "github_actions_default_reference");
      assert.equal(reference.revision, "v2");
      assert.equal(reference.effectiveConfigurationVerified, false);
    },
  },
  {
    name: "unknown workloads fail closed",
    run: async () => {
      const result = await resolveOpenAiProductWorkload(
        "unknown_workload",
        "development",
      );
      assert.equal(result.ok, false);
      assert.equal(result.error.code, "UNKNOWN_WORKLOAD");
    },
  },
  {
    name: "inventory and resolved configurations are deeply immutable",
    run: async () => {
      const inventory = listOpenAiWorkloadInventory();
      assert.equal(Object.isFrozen(inventory), true);
      assert.equal(Object.isFrozen(inventory[0]), true);
      assert.throws(() => {
        (inventory as unknown[]).push({});
      }, TypeError);

      const result = await resolveOpenAiProductWorkload(
        "niche_resolution",
        "development",
      );
      assert.equal(result.ok, true);
      assert.equal(Object.isFrozen(result), true);
      assert.equal(Object.isFrozen(result.value), true);
    },
  },
  {
    name: "public API does not expose the internal registry",
    run: () => {
      assert.equal("openAiWorkloadRegistry" in publicApi, false);
    },
  },
  {
    name: "admin projection contains no secret or remote assertion",
    run: () => {
      const serialized = JSON.stringify(listOpenAiWorkloadInventory());
      assert.equal(/api[_-]?key|secret|bearer|authorization|https?:\/\//i.test(serialized), false);
      assert.equal(serialized.includes("effectiveConfigurationVerified"), true);
    },
  },
  {
    name: "environment mapping is closed and fail-safe",
    run: () => {
      assert.equal(
        resolveOpenAiWorkloadEnvironment({ vercelEnv: "production" }),
        "production",
      );
      assert.equal(
        resolveOpenAiWorkloadEnvironment({ vercelEnv: "preview" }),
        "preview",
      );
      assert.equal(
        resolveOpenAiWorkloadEnvironment({ vercelEnv: "development" }),
        "development",
      );
      assert.equal(
        resolveOpenAiWorkloadEnvironment({ nodeEnv: "development" }),
        "development",
      );
      assert.equal(
        resolveOpenAiWorkloadEnvironment({ nodeEnv: "production" }),
        "unknown",
      );
      assert.equal(
        resolveOpenAiWorkloadEnvironment({ vercelEnv: "custom" }),
        "unknown",
      );
      assert.equal(resolveOpenAiWorkloadEnvironment({}), "unknown");
    },
  },
  {
    name: "development and managed gate-off use repo catalog without operational reads",
    run: async () => {
      let reads = 0;
      const reader: OpenAiOperationalConfigurationReader = async () => {
        reads += 1;
        throw new Error("reader must not run");
      };

      for (const environment of ["development", "production", "preview"] as const) {
        const result = await resolveOpenAiProductWorkload(
          "niche_resolution",
          environment,
          {
            operationalConfigurationEnabled:
              environment === "development" ? "true" : "TRUE",
            readOperationalConfiguration: reader,
          },
        );
        assert.equal(result.ok, true);
        assert.equal(result.value.source, "repo_catalog");
        assert.equal(result.value.revision, "v2");
      }
      assert.equal(reads, 0);
    },
  },
  {
    name: "unknown environment fails closed before operational read",
    run: async () => {
      let reads = 0;
      const result = await resolveOpenAiProductWorkload(
        "niche_resolution",
        "unknown",
        {
          operationalConfigurationEnabled: "true",
          readOperationalConfiguration: async () => {
            reads += 1;
            throw new Error("reader must not run");
          },
        },
      );
      assert.equal(result.ok, false);
      assert.equal(result.error.code, "UNKNOWN_ENVIRONMENT");
      assert.equal(reads, 0);
    },
  },
  {
    name: "managed gate-on reads every execution and preserves operational origin and decimal revision",
    run: async () => {
      let reads = 0;
      const reader: OpenAiOperationalConfigurationReader = async (input) => {
        reads += 1;
        return {
          ok: true,
          value: {
            environment: input.environment,
            workload: "niche_resolution",
            apiKind: "responses_text",
            model: "gpt-5.6-luna",
            reasoningEffort: "high",
            revision: String(reads),
          },
        };
      };
      const dependencies = {
        operationalConfigurationEnabled: "true",
        readOperationalConfiguration: reader,
      } as const;

      const first = await resolveOpenAiProductWorkload(
        "niche_resolution",
        "preview",
        dependencies,
      );
      const second = await resolveOpenAiProductWorkload(
        "niche_resolution",
        "preview",
        dependencies,
      );
      assert.equal(first.ok, true);
      assert.equal(second.ok, true);
      assert.equal(first.value.source, "supabase_operational");
      assert.equal(first.value.revision, "1");
      assert.equal(second.value.revision, "2");
      assert.equal(second.value.model, "gpt-5.6-luna");
      assert.equal(second.value.reasoningEffort, "high");
      assert.equal(reads, 2);
    },
  },
  {
    name: "gate-on read failures and configurations outside the allowlist fail without repo fallback",
    run: async () => {
      const readFailure = await resolveOpenAiProductWorkload(
        "niche_resolution",
        "production",
        {
          operationalConfigurationEnabled: "true",
          readOperationalConfiguration: async () => ({
            ok: false,
            error: { code: "READ_FAILED", message: "read failed" },
          }),
        },
      );
      assert.equal(readFailure.ok, false);
      assert.equal(
        readFailure.error.code,
        "OPERATIONAL_CONFIGURATION_READ_FAILED",
      );

      const invalid = await resolveOpenAiProductWorkload(
        "niche_resolution",
        "production",
        {
          operationalConfigurationEnabled: "true",
          readOperationalConfiguration: async (input) => ({
            ok: true,
            value: {
              environment: input.environment,
              workload: "niche_resolution",
              apiKind: "responses_text",
              model: "gpt-5.4-mini",
              reasoningEffort: "max",
              revision: "3",
            },
          }),
        },
      );
      assert.equal(invalid.ok, false);
      assert.equal(invalid.error.code, "OPERATIONAL_CONFIGURATION_INVALID");

      const nonDecimalRevision = await resolveOpenAiProductWorkload(
        "niche_resolution",
        "production",
        {
          operationalConfigurationEnabled: "true",
          readOperationalConfiguration: async (input) => ({
            ok: true,
            value: {
              environment: input.environment,
              workload: "niche_resolution",
              apiKind: "responses_text",
              model: "gpt-5.4-mini",
              reasoningEffort: "none",
              revision: "v3",
            },
          }),
        },
      );
      assert.equal(nonDecimalRevision.ok, false);
      assert.equal(
        nonDecimalRevision.error.code,
        "OPERATIONAL_CONFIGURATION_INVALID",
      );
    },
  },
  {
    name: "adapter translation validates read, unit, active revision, modality and shape",
    run: () => {
      const input = {
        environment: "preview" as const,
        workload: "landing_page_draft_image_generation",
      };
      const unit = [{
        environment: "preview",
        workload: input.workload,
        modality: "image_generation",
        active_revision_id: "revision-7",
      }];
      const revision = [{
        id: "revision-7",
        environment: "preview",
        workload: input.workload,
        modality: "image_generation",
        revision_number: 7,
        model: "gpt-image-2",
        reasoning_effort: null,
        quality: "high",
      }];

      const valid = translateOperationalConfigurationRows(
        input,
        { data: unit, error: null },
        { data: revision, error: null },
      );
      assert.equal(valid.ok, true);
      assert.equal(valid.value.revision, "7");
      assert.equal(valid.value.apiKind, "image_generation");
      if (valid.value.apiKind === "image_generation") {
        assert.equal(valid.value.quality, "high");
      }

      const readFailure = translateOperationalConfigurationRows(
        input,
        { data: null, error: { message: "database unavailable" } },
        { data: null, error: null },
      );
      assert.equal(readFailure.ok, false);
      assert.equal(readFailure.error.code, "READ_FAILED");

      const duplicateUnit = translateOperationalConfigurationRows(
        input,
        { data: [...unit, ...unit], error: null },
        { data: revision, error: null },
      );
      assert.equal(duplicateUnit.ok, false);
      assert.equal(duplicateUnit.error.code, "ACTIVE_CONFIGURATION_INVALID");

      const mismatchedRevision = translateOperationalConfigurationRows(
        input,
        { data: unit, error: null },
        {
          data: [{ ...revision[0], environment: "production" }],
          error: null,
        },
      );
      assert.equal(mismatchedRevision.ok, false);
      assert.equal(
        mismatchedRevision.error.code,
        "ACTIVE_CONFIGURATION_INVALID",
      );
    },
  },
  {
    name: "closed allowlists accept only the approved text and image combinations",
    run: async () => {
      const textConfigurations = [
        { model: "gpt-5.4-mini", reasoningEffort: "none" },
        { model: "gpt-5.4-mini", reasoningEffort: "low" },
        { model: "gpt-5.4-mini", reasoningEffort: "medium" },
        { model: "gpt-5.4-mini", reasoningEffort: "high" },
        { model: "gpt-5.4-mini", reasoningEffort: "xhigh" },
        { model: "gpt-5.6-luna", reasoningEffort: "none" },
        { model: "gpt-5.6-luna", reasoningEffort: "low" },
        { model: "gpt-5.6-luna", reasoningEffort: "medium" },
        { model: "gpt-5.6-luna", reasoningEffort: "high" },
        { model: "gpt-5.6-luna", reasoningEffort: "xhigh" },
        { model: "gpt-5.6-luna", reasoningEffort: "max" },
      ] as const;
      for (const workload of [
        "niche_resolution",
        "commercial_activation_draft_generation",
        "landing_page_draft_generation",
      ] as const) {
        for (const configuration of textConfigurations) {
          const result = await resolveOpenAiProductWorkload(
            workload,
            "preview",
            {
              operationalConfigurationEnabled: "true",
              readOperationalConfiguration: async (input) => ({
                ok: true,
                value: {
                  environment: input.environment,
                  workload,
                  apiKind: "responses_text",
                  ...configuration,
                  revision: "9",
                },
              }),
            },
          );
          assert.equal(result.ok, true);
        }
      }

      for (const quality of ["low", "medium", "high"] as const) {
        const result = await resolveOpenAiImageWorkload(
          "landing_page_draft_image_generation",
          "production",
          {
            operationalConfigurationEnabled: "true",
            readOperationalConfiguration: async (input) => ({
              ok: true,
              value: {
                environment: input.environment,
                workload: "landing_page_draft_image_generation",
                apiKind: "image_generation",
                model: "gpt-image-2",
                quality,
                revision: "4",
              },
            }),
          },
        );
        assert.equal(result.ok, true);
      }
    },
  },
  {
    name: "invalid operational configuration blocks the consumer transport",
    run: async () => {
      const fixture = nicheResolutionFixture();
      let transportCalls = 0;
      const result = await resolveNicheWithOpenAi(
        { ...fixture, apiKey: "test-key" },
        {
          environment: "preview",
          workloadResolver: {
            operationalConfigurationEnabled: "true",
            readOperationalConfiguration: async () => ({
              ok: false,
              error: { code: "READ_FAILED", message: "read failed" },
            }),
          },
          fetchImpl: async () => {
            transportCalls += 1;
            return new Response();
          },
        },
      );
      assert.equal(result.ok, false);
      assert.equal(result.reason, "invalid_openai_configuration");
      assert.equal(transportCalls, 0);
    },
  },
  {
    name: "consumer transport and event provenance use the resolved operational configuration",
    run: async () => {
      const fixture = nicheResolutionFixture();
      const events: OpenAiWorkloadEvent[] = [];
      let requestBody: Record<string, unknown> | null = null;
      const result = await resolveNicheWithOpenAi(
        { ...fixture, apiKey: "test-key" },
        {
          environment: "preview",
          workloadResolver: {
            operationalConfigurationEnabled: "true",
            readOperationalConfiguration: async (input) => ({
              ok: true,
              value: {
                environment: input.environment,
                workload: "niche_resolution",
                apiKind: "responses_text",
                model: "gpt-5.6-luna",
                reasoningEffort: "low",
                revision: "11",
              },
            }),
          },
          fetchImpl: async (_url, init) => {
            requestBody = JSON.parse(String(init?.body));
            return new Response(JSON.stringify({
              id: "resp_operational_11",
              output_text: JSON.stringify({
                uxMode: "confirm_single",
                message: "Voce quis dizer este nicho?",
                options: [{
                  taxonId: fixture.candidates[0].taxonId,
                  name: fixture.candidates[0].name,
                  slug: fixture.candidates[0].slug,
                  confidence: "medium",
                  reason: "official_candidate",
                  isOfficial: true,
                }],
                needsAdminReview: false,
                needsUserConfirmation: true,
                shouldCreateOfficialLink: false,
                suggestedNewTaxonLabel: null,
                reason: "ai_resolution_completed",
              }),
            }), { status: 200 });
          },
          emitEvent: (event) => events.push(event),
        },
      );
      assert.equal(result.ok, true);
      const capturedRequest = requestBody as unknown as Record<string, unknown>;
      assert.equal(capturedRequest.model, "gpt-5.6-luna");
      assert.deepEqual(capturedRequest.reasoning, { effort: "low" });
      assert.equal(events.length, 1);
      assert.equal(events[0]?.environment, "preview");
      assert.equal(events[0]?.configurationSource, "supabase_operational");
      assert.equal(events[0]?.configurationRevision, "11");
    },
  },
  {
    name: "commercial adapter uses the callsite resolution without a second operational read",
    run: async () => {
      let reads = 0;
      const configuration = await resolveOpenAiProductWorkload(
        "commercial_activation_draft_generation",
        "production",
        {
          operationalConfigurationEnabled: "true",
          readOperationalConfiguration: async (input) => {
            reads += 1;
            return {
              ok: true,
              value: {
                environment: input.environment,
                workload: "commercial_activation_draft_generation",
                apiKind: "responses_text",
                model: "gpt-5.6-luna",
                reasoningEffort: "xhigh",
                revision: "6",
              },
            };
          },
        },
      );
      assert.equal(configuration.ok, true);
      const events: OpenAiWorkloadEvent[] = [];
      let requestBody: Record<string, unknown> | null = null;
      const result = await requestCommercialActivationOpenAi(
        {
          apiKey: "test-key",
          configuration: configuration.value,
          environment: "production",
          request: { input: [] },
          parseResponse: () => ({ ok: true, value: "parsed" }),
        },
        {
          fetchImpl: async (_url, init) => {
            requestBody = JSON.parse(String(init?.body));
            return new Response(JSON.stringify({ id: "resp_commercial_6" }), {
              status: 200,
            });
          },
          emitEvent: (event) => events.push(event),
        },
      );
      assert.equal(result.ok, true);
      assert.equal(reads, 1);
      const capturedRequest = requestBody as unknown as Record<string, unknown>;
      assert.equal(capturedRequest.model, "gpt-5.6-luna");
      assert.deepEqual(capturedRequest.reasoning, { effort: "xhigh" });
      assert.equal(events[0]?.environment, "production");
      assert.equal(events[0]?.configurationSource, "supabase_operational");
      assert.equal(events[0]?.configurationRevision, "6");
    },
  },
  {
    name: "commercial adapter rejects forged resolved configurations before transport",
    run: async () => {
      const configuration = await resolveOpenAiProductWorkload(
        "commercial_activation_draft_generation",
        "development",
      );
      assert.equal(configuration.ok, true);
      if (!configuration.ok) return;

      let calls = 0;
      const events: OpenAiWorkloadEvent[] = [];
      const result = await requestCommercialActivationOpenAi(
        {
          apiKey: "test-key",
          configuration: {
            ...configuration.value,
            model: "unapproved-model",
          },
          environment: "development",
          request: { input: [] },
          parseResponse: () => ({ ok: true, value: "must-not-run" }),
        },
        {
          fetchImpl: async () => {
            calls += 1;
            return new Response();
          },
          emitEvent: (event) => events.push(event),
        },
      );

      assert.equal(result.ok, false);
      assert.equal(calls, 0);
      assert.equal(events[0]?.failureCategory, "configuration_invalid");
    },
  },
  {
    name: "usage normalization preserves zero and maps absent values to null",
    run: () => {
      assert.deepEqual(
        normalizeOpenAiResponseUsage({
          input_tokens: 120,
          input_tokens_details: {
            cached_tokens: 80,
            cache_write_tokens: 0,
          },
          output_tokens: 35,
          output_tokens_details: { reasoning_tokens: 5 },
          total_tokens: 155,
        }),
        {
          inputTokens: 120,
          cachedInputTokens: 80,
          cacheWriteTokens: 0,
          outputTokens: 35,
          reasoningTokens: 5,
          totalTokens: 155,
        },
      );
      assert.deepEqual(normalizeOpenAiResponseUsage({ input_tokens: -1 }), {
        inputTokens: null,
        cachedInputTokens: null,
        cacheWriteTokens: null,
        outputTokens: null,
        reasoningTokens: null,
        totalTokens: null,
      });
    },
  },
  {
    name: "success and failure events preserve the discriminated contract",
    run: () => {
      const context = {
        workload: "niche_resolution" as const,
        environment: "preview" as const,
        configurationSource: "repo_catalog" as const,
        configurationRevision: "v1",
        model: "gpt-5.4-mini",
        reasoningEffort: "none" as const,
      };
      const success = createOpenAiWorkloadSuccessEvent({
        ...context,
        responseId: " resp_123 ",
        latencyMs: 12.5,
        usage: { input_tokens: 0 },
      });
      assert.equal(success.result, "success");
      assert.equal(success.failureCategory, null);
      assert.equal(success.responseId, "resp_123");
      assert.equal(success.inputTokens, 0);
      assert.equal(success.outputTokens, null);

      const failure = createOpenAiWorkloadFailureEvent(
        { ...context, latencyMs: null },
        "configuration_invalid",
      );
      assert.equal(failure.result, "failure");
      assert.equal(failure.failureCategory, "configuration_invalid");
      assert.equal(failure.latencyMs, null);
      assert.equal(Object.isFrozen(failure), true);
    },
  },
  {
    name: "event emission forwards only the normalized event",
    run: () => {
      const event = createOpenAiWorkloadFailureEvent(
        {
          workload: "commercial_activation_draft_generation",
          environment: "unknown",
          configurationSource: "repo_catalog",
          configurationRevision: "v1",
          model: "gpt-5.4-mini",
          reasoningEffort: "none",
        },
        "timeout",
      );
      const writes: unknown[] = [];
      emitOpenAiWorkloadEvent(event, (name, value) => writes.push({ name, value }));
      assert.deepEqual(writes, [{ name: "openai_workload", value: event }]);
    },
  },
  {
    name: "runtime source has no legacy model env reads or client model hardcode",
    run: () => {
      const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
      const sourceFiles = ["app", "components", "lib"]
        .flatMap((directory) => collectSourceFiles(join(repositoryRoot, directory)))
        .filter((file) => !file.endsWith("validation-cases.ts"));
      const legacyModelEnvironmentVariables = [
        "OPENAI_NICHE_RESOLVER_MODEL",
        "OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL",
        "OPENAI_COMMERCIAL_ACTIVATION_MODEL",
      ];

      for (const file of sourceFiles) {
        const source = readFileSync(file, "utf8");
        for (const variable of legacyModelEnvironmentVariables) {
          assert.equal(
            source.includes(variable),
            false,
            `${relative(repositoryRoot, file)} still references ${variable}`,
          );
        }
        if (!file.endsWith(join("lib", "openai-workloads", "registry.ts"))) {
          assert.equal(
            source.includes("gpt-5.4-mini"),
            false,
            `${relative(repositoryRoot, file)} still hardcodes the product model`,
          );
        }
      }
    },
  },
  {
    name: "production boundary has no transport persistence secrets or business payloads",
    run: () => {
      const productionFiles = [
        "contracts.ts",
        "registry.ts",
        "resolve.ts",
        "observability.ts",
        "index.ts",
      ];
      const source = productionFiles
        .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
        .join("\n");
      assert.equal(/\bfetch\s*\(|@supabase|OPENAI_API_KEY|authorization\s*:/i.test(source), false);
      assert.equal(
        /\bprompt(?!Version)|structured.?output|output.?schema|pricing|price.?table/i.test(
          source,
        ),
        false,
      );
    },
  },
];

function nicheResolutionFixture() {
  const candidate = {
    taxonId: "10000000-0000-4000-8000-000000000001",
    name: "Corretores de imoveis",
    slug: "corretores-de-imoveis",
    level: "niche" as const,
    parentId: null,
    parentName: null,
    matchedAliases: ["corretor"],
    matchSource: "alias",
    score: 0.72,
  };
  return {
    rawInput: "corretor",
    candidates: [candidate],
    decision: {
      confidence: "medium" as const,
      selectedCandidate: candidate,
      shouldUseDeterministicMatch: false,
      shouldEscalateToAi: true,
      aiEscalationMode: "rerank_candidates" as const,
      needsAdminReview: false,
      reason: "medium_confidence_below_high_threshold" as const,
    },
  };
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
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

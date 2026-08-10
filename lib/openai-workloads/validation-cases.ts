import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import * as publicApi from "./index";
import {
  createOpenAiWorkloadFailureEvent,
  createOpenAiWorkloadSuccessEvent,
  emitOpenAiWorkloadEvent,
  listOpenAiWorkloadInventory,
  normalizeOpenAiResponseUsage,
  resolveOpenAiProductWorkload,
  resolveOpenAiWorkloadEnvironment,
} from "./index";

const productIds = [
  "niche_resolution",
  "landing_page_generation_profile_proposal",
  "commercial_activation_draft_generation",
] as const;

const cases = [
  {
    name: "inventory exposes four unique canonical workloads",
    run: () => {
      const inventory = listOpenAiWorkloadInventory();
      assert.equal(inventory.length, 4);
      assert.equal(new Set(inventory.map((item) => item.id)).size, 4);
      assert.deepEqual(
        inventory.map((item) => item.id),
        [...productIds, "supabase_inspect"],
      );
    },
  },
  {
    name: "product workloads resolve the explicit v1 baseline",
    run: () => {
      for (const workloadId of productIds) {
        const result = resolveOpenAiProductWorkload(workloadId);
        assert.equal(result.ok, true);
        assert.equal(result.value.model, "gpt-5.4-mini");
        assert.equal(result.value.reasoningEffort, "none");
        assert.equal(result.value.source, "repo_catalog");
        assert.equal(result.value.revision, "v1");
        assert.equal(result.value.configurationKind, "effective");
        assert.equal(result.value.effectiveConfigurationVerified, true);
      }
    },
  },
  {
    name: "operational reference stays outside the product resolver",
    run: () => {
      const result = resolveOpenAiProductWorkload("supabase_inspect");
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
      assert.equal(reference.revision, "v1");
      assert.equal(reference.effectiveConfigurationVerified, false);
    },
  },
  {
    name: "unknown workloads fail closed",
    run: () => {
      const result = resolveOpenAiProductWorkload("unknown_workload");
      assert.equal(result.ok, false);
      assert.equal(result.error.code, "UNKNOWN_WORKLOAD");
    },
  },
  {
    name: "inventory and resolved configurations are deeply immutable",
    run: () => {
      const inventory = listOpenAiWorkloadInventory();
      assert.equal(Object.isFrozen(inventory), true);
      assert.equal(Object.isFrozen(inventory[0]), true);
      assert.throws(() => {
        (inventory as unknown[]).push({});
      }, TypeError);

      const result = resolveOpenAiProductWorkload("niche_resolution");
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
      assert.equal(/prompt|structured.?output|output.?schema|pricing|price.?table/i.test(source), false);
    },
  },
];

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

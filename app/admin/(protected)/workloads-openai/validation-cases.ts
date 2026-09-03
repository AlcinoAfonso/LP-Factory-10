import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  resolveOpenAiProductWorkload,
  type ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import {
  runOpenAiCandidateProofCore,
  type OpenAiCandidateProofDependencies,
} from "./proofCore";
import { parseCommercialProof } from "./commercialProof";
import { proveDynamicMarketResearch } from "./dynamicResearchProof";

type Case = Readonly<{ name: string; run: () => void | Promise<void> }>;

const cases: readonly Case[] = [
  {
    name: "dynamic canary shares real request and parser without claiming a runtime revision",
    run: async () => {
      const resolved = await resolveOpenAiProductWorkload("landing_page_dynamic_market_research", "development");
      assert.ok(resolved.ok);
      const candidate = { ...resolved.value, source: "supabase_operational" as const, revision: "1" };
      let calls = 0;
      const result = await proveDynamicMarketResearch(candidate, "preview", "synthetic-key", "request-proof", {
        emitEvent: () => undefined,
        fetchImpl: async (_url, init) => {
          calls += 1;
          const request = JSON.parse(String(init?.body));
          assert.equal(request.max_output_tokens, 4000);
          assert.equal(request.max_tool_calls, 2);
          assert.equal(request.tool_choice, "required");
          assert.equal(request.store, false);
          return new Response(JSON.stringify({ id: "resp_proof", status: "completed", output: [
            { type: "web_search_call", status: "completed", action: { sources: [{ type: "url", url: "https://example.org/proof" }] } },
            { type: "message", content: [{ type: "output_text", text: JSON.stringify({ schemaVersion: 1, status: "no_material_delta", summary: "Sem delta material", supplement: null }) }] },
          ] }), { status: 200, headers: { "x-request-id": "provider-proof" } });
        },
      });
      assert.equal(result.ok, true);
      assert.equal(calls, 1);
      assert.equal(candidate.revision, "1");
      assert.equal(candidate.source, "supabase_operational");
      const missing = await runOpenAiCandidateProofCore(candidate, "preview", "synthetic-key", "request-proof", { ...proofDependencies([]), dynamicMarketResearch: undefined });
      assert.deepEqual(missing, { ok: false, code: "configuration" });
      const invalid = await proveDynamicMarketResearch({ ...candidate, reasoningEffort: "low" }, "preview", "synthetic-key", "request-proof");
      assert.deepEqual(invalid, { ok: false, code: "configuration" });
    },
  },
  {
    name: "commercial proof parses the raw Responses API output content shape",
    run: () => {
      const result = parseCommercialProof({
        id: "resp_proof_1",
        object: "response",
        output: [
          {
            id: "msg_proof_1",
            type: "message",
            role: "assistant",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({ proof: "approved" }),
                annotations: [],
              },
            ],
          },
        ],
      });

      assert.deepEqual(result, { ok: true, value: true });
    },
  },
  {
    name: "candidate proof dispatches each workload to its existing domain transport",
    run: async () => {
      const workloads = await resolvedWorkloads();
      for (const workload of workloads) {
        const calls: string[] = [];
        const dependencies = proofDependencies(calls);
        const result = await runOpenAiCandidateProofCore(
          workload,
          "preview",
          "test-key",
          "proof-request-1",
          dependencies,
        );
        assert.equal(result.ok, true);
        assert.deepEqual(calls, [workload.id]);
        if (result.ok) {
          assert.deepEqual(result.metadata, {
            schema_version: 1,
            proof_kind: "operational",
            proof_result: "approved",
            request_id: "proof-request-1",
            provider_request_id: "provider-proof-1",
            latency_ms: 12,
            contract_version: 1,
            source: "openai_api",
          });
        }
      }
    },
  },
  {
    name: "candidate proof rejects missing key and unsafe request before transport",
    run: async () => {
      const [workload] = await resolvedWorkloads();
      const calls: string[] = [];
      const dependencies = proofDependencies(calls);
      const missingKey = await runOpenAiCandidateProofCore(
        workload,
        "preview",
        "",
        "proof-request-1",
        dependencies,
      );
      const unsafeRequest = await runOpenAiCandidateProofCore(
        workload,
        "preview",
        "test-key",
        "unsafe request with spaces",
        dependencies,
      );
      assert.deepEqual(missingKey, { ok: false, code: "configuration" });
      assert.deepEqual(unsafeRequest, { ok: false, code: "configuration" });
      assert.deepEqual(calls, []);
    },
  },
  {
    name: "candidate proof preserves failures and sanitizes optional metadata",
    run: async () => {
      const [workload] = await resolvedWorkloads();
      const failedDependencies = proofDependencies([], {
        ok: false,
        code: "provider",
      });
      const failed = await runOpenAiCandidateProofCore(
        workload,
        "production",
        "test-key",
        "proof-request-2",
        failedDependencies,
      );
      assert.deepEqual(failed, { ok: false, code: "provider" });

      const sanitizedDependencies = proofDependencies([], {
        ok: true,
        providerRequestId: "unsafe provider id",
        latencyMs: 900_001,
      });
      const sanitized = await runOpenAiCandidateProofCore(
        workload,
        "production",
        "test-key",
        "proof-request-3",
        sanitizedDependencies,
      );
      assert.equal(sanitized.ok, true);
      if (sanitized.ok) {
        assert.equal(sanitized.metadata.provider_request_id, null);
        assert.equal(sanitized.metadata.latency_ms, null);
      }
    },
  },
  {
    name: "server actions derive authority and proof credentials only on the server",
    run: () => {
      const actions = readFileSync(new URL("actions.ts", import.meta.url), "utf8");
      const proof = readFileSync(new URL("_proof.ts", import.meta.url), "utf8");
      for (const action of [
        "saveOpenAiConfigurationCandidateAction",
        "discardOpenAiConfigurationCandidateAction",
        "proveAndPromoteOpenAiConfigurationCandidateAction",
        "activateOpenAiConfigurationRevisionAction",
        "rollbackOpenAiConfigurationRevisionAction",
      ]) {
        assert.equal(actions.includes(`function ${action}`), true);
      }
      assert.equal(actions.includes("requirePlatformAdmin()"), true);
      assert.equal(actions.includes("actorUserId: authorized.actorUserId"), true);
      const adapter = readFileSync(new URL("../../../../lib/openai-workloads/adapters/operationalConfigurationAdapter.ts", import.meta.url), "utf8");
      assert.equal(adapter.includes("p_actor_user_id: input.actorUserId"), true);
      assert.equal(actions.includes("process.env.OPENAI_API_KEY"), true);
      assert.equal(/formData\.get\(["']actor/i.test(actions), false);
      assert.equal(/OPENAI_API_KEY/.test(proof), false);
      for (const transport of [
        "resolveNicheWithOpenAi",
        "requestCommercialActivationOpenAi",
        "evaluateInputCatalogWithOpenAi",
        "proveDynamicMarketResearch",
      ]) {
        assert.equal(proof.includes(transport), true);
      }
      assert.doesNotMatch(
        proof,
        /generateLandingPageDraftCandidate|generateLandingPageDraftImage|LandingPageGenerationContextPackage/,
      );
    },
  },
];

async function resolvedWorkloads() {
  const results = await Promise.all([
    resolveOpenAiProductWorkload("niche_resolution", "development"),
    resolveOpenAiProductWorkload(
      "commercial_activation_draft_generation",
      "development",
    ),
    resolveOpenAiProductWorkload("landing_page_dynamic_market_research", "development"),
    resolveOpenAiProductWorkload(
      "taxon_input_catalog_sufficiency_evaluation",
      "development",
    ),
  ]);
  for (const result of results) assert.equal(result.ok, true);
  return results.map((result) => {
    if (!result.ok) throw new Error("workload_resolution_failed");
    return result.value;
  });
}

function proofDependencies(
  calls: string[],
  result:
    | Readonly<{
        ok: true;
        providerRequestId: string | null;
        latencyMs: number | null;
      }>
    | Readonly<{
        ok: false;
        code: "configuration" | "provider" | "contract";
      }> = {
    ok: true,
    providerRequestId: "provider-proof-1",
    latencyMs: 12,
  },
): OpenAiCandidateProofDependencies {
  const product = async (workload: ResolvedOpenAiProductWorkload) => {
    calls.push(workload.id);
    return result;
  };
  return {
    niche: product,
    commercial: product,
    inputCatalogEvaluation: product,
    dynamicMarketResearch: product,
  };
}

async function runCases() {
  for (const testCase of cases) {
    await testCase.run();
    console.log(`ok - ${testCase.name}`);
  }
}

runCases().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

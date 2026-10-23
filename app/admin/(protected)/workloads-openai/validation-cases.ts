import { runOpenAiServiceTierProof } from "./serviceTierProof";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  resolveOpenAiProductWorkload,
  type ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import {
  runOpenAiCandidateProofCore,
  proofResolver,
  isResearchedCommunicationStageTwoProof,
  type OpenAiCandidateProofDependencies,
} from "./proofCore";
import { parseCommercialProof } from "./commercialProof";
import { confirmOpenAiModelIdentity } from "./openAiModelIdentity";

type Case = Readonly<{ name: string; run: () => void | Promise<void> }>;

const cases: readonly Case[] = [
  {
    name: "niche functional proof resolves the exact candidate tier as well as model and effort",
    run: async () => {
      const base = await resolveOpenAiProductWorkload("niche_resolution", "development");
      assert.equal(base.ok, true);
      if (!base.ok) return;
      for (const tier of [null, "default", "fast"] as const) {
        const candidate: ResolvedOpenAiProductWorkload = { ...base.value, model: "gpt-6-luna", reasoningEffort: "medium", serviceTier: tier };
        const resolved = await resolveOpenAiProductWorkload("niche_resolution", "preview", proofResolver(candidate, "preview"));
        assert.equal(resolved.ok, true);
        if (!resolved.ok) continue;
        assert.equal(resolved.value.model, candidate.model);
        assert.equal(resolved.value.reasoningEffort, candidate.reasoningEffort);
        assert.equal(resolved.value.serviceTier, tier);
      }
    },
  },
  {
    name: "tier probe only approves completed responses with the requested applied service",
    run: async () => {
      const resolved = await resolveOpenAiProductWorkload("commercial_activation_draft_generation", "development");
      assert.equal(resolved.ok, true);
      if (!resolved.ok) return;
      for (const [model, requested, applied, status, expected] of [
        ["gpt-6-luna", "default", "default", "completed", true],
        ["gpt-6-luna", "fast", "fast", "completed", true],
        ["gpt-6-luna", "fast", "priority", "completed", true],
        ["gpt-6.1-sol", "ultrafast", "ultrafast", "completed", true],
        ["gpt-6-luna", "fast", "default", "completed", false],
        ["gpt-6-luna", "fast", null, "completed", false],
        ["gpt-6-luna", "default", "default", "incomplete", false],
      ] as const) {
        const proof = await runOpenAiServiceTierProof(
          { ...resolved.value, model, serviceTier: requested }, "preview", "fixture-key", "tier-request-1",
          { emitEvent: () => undefined, fetchImpl: async (_url, init) => {
            const body = JSON.parse(String(init?.body));
            assert.equal(body.service_tier, requested);
            assert.deepEqual(body.tools, []);
            assert.equal(body.store, false);
            return new Response(JSON.stringify({ id: "resp_tier", status, service_tier: applied,
              output: [{ type: "message", content: [{ type: "output_text", text: '{"proof":"approved"}' }] }] }),
              { headers: { "x-request-id": "provider-tier-1" } });
          } },
        );
        assert.equal(proof.ok, expected);
        if (proof.ok) {
          assert.equal(proof.metadata.requested_service_tier, requested);
          assert.equal(proof.metadata.applied_service_tier, applied);
          assert.equal(proof.metadata.provider_request_id, "provider-tier-1");
        }
      }
    },
  },

  {
    name: "model identity requires exact live OpenAI model id before persistence",
    run: async () => {
      const requests: string[] = [];
      const fetchModel = (async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(String(input));
        assert.equal(init?.method, "GET");
        assert.equal(init?.cache, "no-store");
        assert.equal(init?.headers && "Authorization" in init.headers, true);
        return new Response(JSON.stringify({ object: "model", id: "gpt-6-sol" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as typeof fetch;
      assert.deepEqual(
        await confirmOpenAiModelIdentity("gpt-6-sol", "test-key", fetchModel),
        { ok: true },
      );
      assert.deepEqual(
        await confirmOpenAiModelIdentity("GPT-6-Sol", "test-key", fetchModel),
        { ok: false, code: "not_confirmed" },
      );
      assert.deepEqual(requests, [
        "https://api.openai.com/v1/models/gpt-6-sol",
        "https://api.openai.com/v1/models/GPT-6-Sol",
      ]);
    },
  },
  {
    name: "model identity fails closed on missing key, provider error and malformed response",
    run: async () => {
      let calls = 0;
      const unavailable = (async () => {
        calls += 1;
        return new Response(null, { status: 404 });
      }) as typeof fetch;
      assert.deepEqual(
        await confirmOpenAiModelIdentity("gpt-6-luna", undefined, unavailable),
        { ok: false, code: "configuration" },
      );
      assert.equal(calls, 0);
      assert.deepEqual(
        await confirmOpenAiModelIdentity("gpt-6-luna", "test-key", unavailable),
        { ok: false, code: "not_confirmed" },
      );
      assert.equal(calls, 1);
      const malformed = (async () => new Response("not-json")) as typeof fetch;
      assert.deepEqual(
        await confirmOpenAiModelIdentity("gpt-6-luna", "test-key", malformed),
        { ok: false, code: "not_confirmed" },
      );
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
    name: "stage 2 candidate proof requires researched market insights with sources",
    run: () => {
      const proof = readFileSync(new URL("_proof.ts", import.meta.url), "utf8");
      const stageTwoCall = proof.split("async function proveCommunicationStageTwo(")[1]?.split("\nasync function ")[0];
      assert.ok(stageTwoCall);
      assert.match(stageTwoCall, /target: \{ kind: "section", key: "market_insights" \}/);
      assert.match(stageTwoCall, /requiresCurrentResearch: true/);
      assert.match(stageTwoCall, /isResearchedCommunicationStageTwoProof\(result\.value\)/);
      const researched = { researched: true, suggestions: [{ key: "market_insights" as const,
        value: ["Hipótese revisável"], basis: "strategic_hypothesis" as const }],
        sources: [{ title: "Fonte", url: "https://example.org/mercado" }] };
      assert.equal(isResearchedCommunicationStageTwoProof(researched), true);
      assert.equal(isResearchedCommunicationStageTwoProof({ ...researched, researched: false }), false);
      assert.equal(isResearchedCommunicationStageTwoProof({ ...researched, sources: [] }), false);
      assert.equal(isResearchedCommunicationStageTwoProof({ ...researched, suggestions: [] }), false);
      assert.equal(isResearchedCommunicationStageTwoProof({ ...researched, suggestions: [
        { key: "market_insights", value: [], basis: "strategic_hypothesis" },
      ] }), false);
      assert.equal(isResearchedCommunicationStageTwoProof({ ...researched, suggestions: [
        { key: "market_insights", value: ["  "], basis: "strategic_hypothesis" },
      ] }), false);
      assert.equal(isResearchedCommunicationStageTwoProof({ ...researched, suggestions: [
        { key: "about", value: "Sobre", basis: "confirmed_business_fact" },
      ] }), false);
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
        "assistCommunicationSection",
        "generateCommunicationIntelligence",
      ]) {
        assert.equal(proof.includes(transport), true);
      }
      const communicationAdapter = readFileSync(new URL("../../../../lib/communication-base/adapters/communicationAiAdapter.ts", import.meta.url), "utf8");
      for (const name of ["proveCommunicationStageOne", "proveCommunicationStageTwo"]) {
        const call = proof.split(`async function ${name}(`)[1]?.split("\nasync function ")[0];
        assert.ok(call && /\benvironment,\s*apiKey,/.test(call), `${name} must pass the selected environment`);
      }
      assert.equal((communicationAdapter.match(/environment: input\.environment/g) ?? []).length, 2,
        "both communication transports must forward the selected environment to Responses");
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
    resolveOpenAiProductWorkload("pending_setup_conversation", "development"),
    resolveOpenAiProductWorkload(
      "commercial_activation_draft_generation",
      "development",
    ),
    resolveOpenAiProductWorkload("communication_base_stage1_assistance", "development"),
    resolveOpenAiProductWorkload("communication_base_stage2_intelligence", "development"),
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
    attendance: product,
    commercial: product,
    communicationStageOne: product,
    communicationStageTwo: product,
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

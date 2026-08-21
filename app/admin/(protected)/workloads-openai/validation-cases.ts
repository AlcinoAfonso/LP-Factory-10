import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  resolveOpenAiImageWorkload,
  resolveOpenAiProductWorkload,
  type ResolvedOpenAiImageWorkload,
  type ResolvedOpenAiProductWorkload,
} from "@/openai-workloads";
import {
  runOpenAiCandidateProofCore,
  type OpenAiCandidateProofDependencies,
} from "./proofCore";
import { parseCommercialProof } from "./commercialProof";

type Case = Readonly<{ name: string; run: () => void | Promise<void> }>;

const cases: readonly Case[] = [
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
      assert.equal(actions.includes("p_actor_user_id: authorized.actorUserId"), true);
      assert.equal(actions.includes("process.env.OPENAI_API_KEY"), true);
      assert.equal(/formData\.get\(["']actor/i.test(actions), false);
      assert.equal(/OPENAI_API_KEY/.test(proof), false);
      for (const transport of [
        "resolveNicheWithOpenAi",
        "requestCommercialActivationOpenAi",
        "generateLandingPageDraftCandidate",
        "generateLandingPageDraftImage",
      ]) {
        assert.equal(proof.includes(transport), true);
      }
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
    resolveOpenAiProductWorkload("landing_page_draft_generation", "development"),
    resolveOpenAiImageWorkload(
      "landing_page_draft_image_generation",
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
  const image = async (workload: ResolvedOpenAiImageWorkload) => {
    calls.push(workload.id);
    return result;
  };
  return {
    niche: product,
    commercial: product,
    landingPageText: product,
    landingPageImage: image,
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

import "server-only";

import { randomUUID } from "node:crypto";

import type {
  OpenAiManagedWorkloadEnvironment,
  ResolvedOpenAiProductWorkload,
} from "../../openai-workloads";
import {
  landingPageDraftComparisonFixture,
  projectLandingPageDraftForComparison,
  type LandingPageDraftComparisonAttempt,
  type LandingPageDraftComparisonConfiguration,
} from "../landingPageDraftComparison";
import { generateLandingPageDraftCandidate } from "../landingPageDraftGeneration";

export async function runLandingPageDraftComparison(input: Readonly<{
  environment: OpenAiManagedWorkloadEnvironment;
  configurations: readonly Readonly<{
    publicConfiguration: LandingPageDraftComparisonConfiguration;
    resolvedWorkload: ResolvedOpenAiProductWorkload;
  }>[];
  roundId: string;
}>): Promise<readonly Readonly<{
  configuration: LandingPageDraftComparisonConfiguration;
  attempt: LandingPageDraftComparisonAttempt;
}>[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return input.configurations.map(({ publicConfiguration }) => ({
      configuration: publicConfiguration,
      attempt: { ok: false, kind: "configuration_invalid" },
    }));
  }

  return Promise.all(
    input.configurations.map(async ({ publicConfiguration, resolvedWorkload }) => {
      try {
        const result = await generateLandingPageDraftCandidate(
          landingPageDraftComparisonFixture,
          {
            apiKey,
            environment: input.environment,
            attemptId: randomUUID(),
            requestId: input.roundId,
            timeoutMs: 120_000,
            resolvedWorkload,
          },
        );
        if (!result.ok) {
          return {
            configuration: publicConfiguration,
            attempt: { ok: false, kind: result.kind },
          } as const;
        }
        return {
          configuration: publicConfiguration,
          attempt: {
            ok: true,
            projection: projectLandingPageDraftForComparison(result.candidate),
            usage: result.usage,
            latencyMs: result.latencyMs,
          },
        } as const;
      } catch {
        return {
          configuration: publicConfiguration,
          attempt: { ok: false, kind: "provider_error" },
        } as const;
      }
    }),
  );
}

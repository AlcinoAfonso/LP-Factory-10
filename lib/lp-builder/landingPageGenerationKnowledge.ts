import { createHash } from "node:crypto";

import type {
  LandingPageGenerationContextPackage,
  LandingPageGenerationAuthorizedResearch,
} from "./generationContextContracts";
import {
  completeLandingPageKnowledge,
  type LandingPageKnowledgeResolutionResult,
  type LandingPageDynamicResearchExecution,
} from "../conversion-content/landing-page/knowledge-resolution";
import type { researchDynamicLandingPageMarketWithOpenAi } from "../conversion-content/adapters/dynamicMarketResearchOpenAiAdapter";
import {
  emitOpenAiWorkloadEvent,
  resolveOpenAiProductWorkload,
  resolveOpenAiWorkloadEnvironment,
  type OpenAiWorkloadEvent,
} from "../openai-workloads";

export type LandingPageGenerationKnowledgeInput = Readonly<{
  context: LandingPageGenerationContextPackage;
  attemptId: string;
  requestId: string;
  deadlineAtMs: number;
  signal?: AbortSignal;
}>;

export type LandingPageGenerationKnowledgeResult =
  | Readonly<{ ok: true; research: LandingPageGenerationAuthorizedResearch }>
  | Readonly<{ ok: false; reason: string }>;

type Dependencies = Readonly<{
  resolveKnowledge: (input: { servedTaxonId: string; offeringScope: unknown }) => Promise<LandingPageKnowledgeResolutionResult>;
  researchDynamic: typeof researchDynamicLandingPageMarketWithOpenAi;
  resolveConfiguration?: typeof resolveOpenAiProductWorkload;
  environment?: ReturnType<typeof resolveOpenAiWorkloadEnvironment>;
  apiKey?: string;
  now?: () => number;
  emitEvent?: (event: OpenAiWorkloadEvent) => void;
}>;

/** Generation-only boundary; workspace, preview and historical readers never call it. */
export async function resolveLandingPageGenerationKnowledge(
  input: LandingPageGenerationKnowledgeInput,
  dependencies: Dependencies,
): Promise<LandingPageGenerationKnowledgeResult> {
  const now = dependencies.now ?? Date.now;
  const expired = () => input.signal?.aborted || now() >= input.deadlineAtMs;
  const { context } = input;
  if (expired()) return { ok: false, reason: "total_timeout" };
  // Preserve the pre-workspace generation path as an operational rollback boundary.
  if (context.contractVersion === 3) return { ok: true, research: context.modelContext.research };
  const offering = context.modelContext.facts.find((fact) => fact.fieldKey === "landing_page_offering_scope");
  if (!offering) return { ok: false, reason: "offering_scope_missing" };

  const resolutionRead = await readBeforeDeadline(() => dependencies.resolveKnowledge({
    servedTaxonId: context.identities.servedTaxon.id,
    offeringScope: offering.value,
  }), input, now);
  if (!resolutionRead.ok) return { ok: false, reason: "total_timeout" };
  const resolution = resolutionRead.value;
  if (!resolution.ok) return { ok: false, reason: resolution.error.code };
  if (expired()) return { ok: false, reason: "total_timeout" };
  if (
    resolution.value.servedTaxon.id !== context.identities.servedTaxon.id ||
    resolution.value.effectiveInputCatalogVersion !== context.identities.effectiveInputCatalogVersion
  ) return { ok: false, reason: "knowledge_identity_changed" };

  let dynamicResearch: LandingPageDynamicResearchExecution | null = null;
  if (resolution.value.status === "dynamic_required") {
    const environment = dependencies.environment ?? resolveOpenAiWorkloadEnvironment();
    const configurationRead = await readBeforeDeadline(() => (dependencies.resolveConfiguration ?? resolveOpenAiProductWorkload)(
      "landing_page_dynamic_market_research", environment,
    ), input, now);
    if (!configurationRead.ok) return { ok: false, reason: "total_timeout" };
    const configuration = configurationRead.value;
    if (!configuration.ok) return { ok: false, reason: "configuration_unavailable" };
    if (expired()) return { ok: false, reason: "total_timeout" };
    const result = await dependencies.researchDynamic({
      apiKey: dependencies.apiKey,
      configuration: configuration.value,
      environment,
      resolution: resolution.value,
      requestId: input.requestId,
      safetyIdentifier: createHash("sha256").update(`e20.7:${context.identities.accountId}`).digest("hex"),
    }, {
      timeoutMs: Math.min(45_000, Math.max(0, input.deadlineAtMs - now())),
      signal: input.signal,
      emitEvent: (event) => (dependencies.emitEvent ?? emitOpenAiWorkloadEvent)({
        ...event, attemptId: input.attemptId,
      }),
    });
    if (!result.ok) return { ok: false, reason: result.code };
    dynamicResearch = result.value;
  }
  if (expired()) return { ok: false, reason: "total_timeout" };
  const completed = completeLandingPageKnowledge(resolution.value, dynamicResearch);
  if (!completed.ok) return { ok: false, reason: completed.error.code };

  // Existing snapshot shape and base provenance remain intact. The consultative
  // envelope projects semantic provenance without resident research paths.
  const knowledge = completed.value;
  return { ok: true, research: Object.freeze({
    ...context.modelContext.research,
    content: JSON.stringify({
      baseResearch: context.modelContext.research,
      resolvedKnowledge: {
        status: knowledge.status,
        mode: knowledge.mode,
        offeringInvalidated: knowledge.offeringInvalidated,
        servedTaxon: knowledge.servedTaxon,
        effectiveInputCatalogVersion: knowledge.effectiveInputCatalogVersion,
        researchSource: {
          taxonId: knowledge.researchSource.taxonId,
          taxonSlug: knowledge.researchSource.taxonSlug,
          selectedResearchVersion: knowledge.researchSource.selectedResearchVersion,
          reviewedInputCatalogVersion: knowledge.researchSource.reviewedInputCatalogVersion,
          effectiveInputCatalogVersion: knowledge.researchSource.effectiveInputCatalogVersion,
          research: {
            taxonSlug: knowledge.researchSource.research.taxonSlug,
            audienceScope: knowledge.researchSource.research.audienceScope,
            researchVersion: knowledge.researchSource.research.researchVersion,
            content: knowledge.researchSource.research.content,
          },
        },
        matchProvenance: knowledge.matchProvenance,
        fallbackReason: knowledge.fallbackReason,
        dynamicTarget: knowledge.dynamicTarget,
        dynamicResearch: knowledge.dynamicResearch,
      },
      financialAttribution: "not_attributed_e21_4_text_image_only",
    }),
  }) };
}

/** Bounds this workflow's wait. Existing read APIs cannot cancel their underlying
 * IO; late settlement is observed but cannot resume generation or persistence. */
function readBeforeDeadline<T>(
  read: () => Promise<T>,
  input: Pick<LandingPageGenerationKnowledgeInput, "deadlineAtMs" | "signal">,
  now: () => number,
): Promise<{ ok: true; value: T } | { ok: false }> {
  const remaining = input.deadlineAtMs - now();
  if (input.signal?.aborted || remaining <= 0) return Promise.resolve({ ok: false });
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
      input.signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      if (settled) return;
      cleanup();
      resolve({ ok: false });
    };
    const timer = setTimeout(onAbort, remaining);
    input.signal?.addEventListener("abort", onAbort, { once: true });
    if (input.signal?.aborted) { onAbort(); return; }
    const onRejected = (error: unknown) => {
      if (settled) return;
      if (input.signal?.aborted || now() >= input.deadlineAtMs) { onAbort(); return; }
      cleanup();
      reject(error);
    };
    try {
      read().then((value) => {
        if (settled) return;
        if (input.signal?.aborted || now() >= input.deadlineAtMs) { onAbort(); return; }
        cleanup();
        resolve({ ok: true, value });
      }, onRejected);
    } catch (error) { onRejected(error); }
  });
}

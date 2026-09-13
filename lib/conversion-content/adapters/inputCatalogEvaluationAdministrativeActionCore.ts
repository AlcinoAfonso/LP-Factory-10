import {
  buildInputCatalogEvaluationGapHandoff,
  executeInputCatalogEvaluationAdministrativeDecision,
  fingerprintInputCatalogEvaluationOutput,
  readInputCatalogEvaluationDecisionToken,
  type InputCatalogEvaluationAdministrativeDecision,
  type InputCatalogEvaluationAdministrativeDecisionResult,
  type InputCatalogEvaluationDecisionTokenPayload,
  type InputCatalogEvaluationOutput,
} from "../landing-page/taxon-preparation";

export async function executeInputCatalogEvaluationAdministrativeActionCore(
  input: Readonly<{
    decision: InputCatalogEvaluationAdministrativeDecision;
    decisionToken: string;
    output: InputCatalogEvaluationOutput;
    selectedCandidateIndexes?: readonly number[];
    humanCandidate?: Readonly<{
      factualNeed: string;
      suggestedTaxonomyLayer: "universal" | "segment" | "niche" | "ultra_niche";
    }> | null;
    decisionTokenSecret: string | undefined;
  }>,
  ports: Readonly<{
    requireRuntime: () => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>>;
    revalidate: (
      evidence: InputCatalogEvaluationDecisionTokenPayload,
    ) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>>;
    recordReviewedVersion: (
      evidence: InputCatalogEvaluationDecisionTokenPayload,
    ) => Promise<Readonly<{ ok: true; reviewedVersion: number }> | Readonly<{ ok: false; message: string }>>;
  }>,
): Promise<InputCatalogEvaluationAdministrativeDecisionResult> {
  const runtime = await ports.requireRuntime();
  if (!runtime.ok) return blocked(runtime.message);

  const evidence = readInputCatalogEvaluationDecisionToken(
    input.decisionToken,
    input.decisionTokenSecret,
  );
  if (
    !evidence ||
    evidence.status !== input.output.status ||
    evidence.outputFingerprint !== fingerprintInputCatalogEvaluationOutput(input.output)
  ) {
    return blocked("O resultado informado não corresponde à avaliação autenticada pelo servidor.");
  }
  const humanCandidate = normalizeHumanCandidate(input.humanCandidate);
  if (input.humanCandidate && !humanCandidate) {
    return blocked("A sugestão humana precisa informar necessidade factual e camada E20.2 válidas.");
  }
  if (
    input.decision === "acknowledge_factual_gap" &&
    humanCandidate &&
    (!input.selectedCandidateIndexes || input.selectedCandidateIndexes.length === 0)
  ) {
    const revalidated = await ports.revalidate(evidence);
    if (!revalidated.ok) {
      return Object.freeze({
        ok: false as const,
        stale: true,
        code: "CONTEXT_STALE" as const,
        message: revalidated.message,
      });
    }
    return Object.freeze({
      ok: true as const,
      kind: "factual_gap_acknowledged" as const,
      reviewedVersion: null,
      selectedCandidates: Object.freeze([Object.freeze({ index: -1, candidate: humanCandidate })]),
      handoff: buildInputCatalogEvaluationGapHandoff({
        taxonId: evidence.taxonId,
        inputCatalogVersion: evidence.inputCatalogVersion,
        selectedCandidates: [{ index: -1, candidate: humanCandidate }],
      }),
    });
  }

  const result = await executeInputCatalogEvaluationAdministrativeDecision(
    {
      decision: input.decision,
      output: input.output,
      selectedCandidateIndexes: input.selectedCandidateIndexes,
    },
    {
      revalidate: () => ports.revalidate(evidence),
      recordReviewedVersion: () => ports.recordReviewedVersion(evidence),
    },
  );
  if (!result.ok || result.kind !== "factual_gap_acknowledged") return result;
  const selectedCandidates = humanCandidate
    ? Object.freeze([
        ...result.selectedCandidates,
        Object.freeze({ index: -1, candidate: humanCandidate }),
      ])
    : result.selectedCandidates;
  return Object.freeze({
    ...result,
    selectedCandidates,
    handoff: buildInputCatalogEvaluationGapHandoff({
      taxonId: evidence.taxonId,
      inputCatalogVersion: evidence.inputCatalogVersion,
      selectedCandidates,
    }),
  });
}

function normalizeHumanCandidate(
  input: Readonly<{
    factualNeed: string;
    suggestedTaxonomyLayer: "universal" | "segment" | "niche" | "ultra_niche";
  }> | null | undefined,
) {
  if (!input) return null;
  const factualNeed = input.factualNeed.replace(/\s+/g, " ").trim();
  const layers = new Set(["universal", "segment", "niche", "ultra_niche"]);
  if (factualNeed.length < 5 || factualNeed.length > 500 || !layers.has(input.suggestedTaxonomyLayer)) {
    return null;
  }
  return Object.freeze({
    origin: "human_hypothesis" as const,
    conclusion: "possible_new_field" as const,
    factualNeed,
    relatedFields: Object.freeze([]),
    currentCoverage: "A cobertura atual será verificada no lifecycle canônico da E20.2.",
    allegedInsufficiency: "Sugestão própria registrada explicitamente pelo administrador.",
    evidence: "Fonte: decisão humana; requer validação factual e técnica na E20.2.",
    expectedOperationalSource: "Definida pelo administrador no draft E20.2.",
    realConsumer: "A confirmar no contrato canônico da E20.2.",
    concreteHarm: "A confirmar antes da publicação da nova versão E20.2.",
    suggestedTaxonomyLayer: input.suggestedTaxonomyLayer,
    uncertainties: Object.freeze(["Candidato humano ainda não validado pelo lifecycle E20.2."]),
  });
}

export async function executeLegacyInputCatalogReviewRecordCore<T>(
  ports: Readonly<{
    resolveRuntime: () => Promise<
      | Readonly<{ ok: true }>
      | Readonly<{
          ok: false;
          code: "ROLLOUT_GATE_OFF" | "OPERATIONAL_CONFIGURATION_UNPROVEN";
          message: string;
        }>
    >;
    record: () => Promise<T>;
  }>,
): Promise<Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; message: string }>> {
  const runtime = await ports.resolveRuntime();
  if (runtime.ok) {
    return Object.freeze({
      ok: false,
      message: "O runtime E20.6.5 está ativo; use uma decisão autenticada da avaliação factual.",
    });
  }
  if (runtime.code !== "ROLLOUT_GATE_OFF") {
    return Object.freeze({ ok: false, message: runtime.message });
  }
  return Object.freeze({ ok: true, value: await ports.record() });
}

function blocked(message: string): Extract<InputCatalogEvaluationAdministrativeDecisionResult, { ok: false }> {
  return Object.freeze({
    ok: false,
    stale: false,
    code: "DECISION_NOT_ALLOWED",
    message,
  });
}

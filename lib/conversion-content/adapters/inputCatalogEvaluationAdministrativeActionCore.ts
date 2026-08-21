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
  return Object.freeze({
    ...result,
    handoff: buildInputCatalogEvaluationGapHandoff({
      taxonId: evidence.taxonId,
      inputCatalogVersion: evidence.inputCatalogVersion,
      selectedCandidates: result.selectedCandidates,
    }),
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

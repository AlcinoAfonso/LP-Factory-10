import {
  buildInputCatalogEvaluationGapHandoff,
  executeInputCatalogEvaluationAdministrativeDecision,
  fingerprintInputCatalogEvaluationOutput,
  type InputCatalogEvaluationAdministrativeDecision,
  type InputCatalogEvaluationAdministrativeDecisionResult,
  type InputCatalogEvaluationOutput,
  type InputCatalogEvaluationStatus,
} from "../landing-page/taxon-preparation";

export type PersistedInputCatalogEvaluationDecisionEvidence = Readonly<{
  taxonId: string;
  inputCatalogVersion: number;
  evaluationContextFingerprint: string;
  outputFingerprint: string;
  status: InputCatalogEvaluationStatus;
}>;

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
    loadPersistedEvidence: () => Promise<
      | Readonly<{ ok: true; evidence: PersistedInputCatalogEvaluationDecisionEvidence }>
      | Readonly<{ ok: false; message: string }>
    >;
    revalidate: (
      evidence: PersistedInputCatalogEvaluationDecisionEvidence,
    ) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>>;
    recordReviewedVersion: (
      evidence: PersistedInputCatalogEvaluationDecisionEvidence,
    ) => Promise<Readonly<{ ok: true; reviewedVersion: number }> | Readonly<{ ok: false; message: string }>>;
  }>,
): Promise<InputCatalogEvaluationAdministrativeDecisionResult> {
  const runtime = await ports.requireRuntime();
  if (!runtime.ok) return blocked(runtime.message);

  const persisted = await ports.loadPersistedEvidence();
  if (!persisted.ok) return blocked(persisted.message);
  const evidence = persisted.evidence;
  if (
    evidence.status !== input.output.status ||
    evidence.outputFingerprint !== fingerprintInputCatalogEvaluationOutput(input.output)
  ) {
    return blocked("O resultado informado não corresponde ao evento factual persistido pelo servidor.");
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

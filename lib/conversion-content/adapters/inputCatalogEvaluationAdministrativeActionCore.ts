import {
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

  return executeInputCatalogEvaluationAdministrativeDecision(
    { decision: input.decision, output: input.output },
    {
      revalidate: () => ports.revalidate(evidence),
      recordReviewedVersion: () => ports.recordReviewedVersion(evidence),
    },
  );
}

function blocked(message: string): Extract<InputCatalogEvaluationAdministrativeDecisionResult, { ok: false }> {
  return Object.freeze({
    ok: false,
    stale: false,
    code: "DECISION_NOT_ALLOWED",
    message,
  });
}

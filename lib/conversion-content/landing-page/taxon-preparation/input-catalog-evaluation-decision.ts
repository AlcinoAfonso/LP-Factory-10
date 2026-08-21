import type { InputCatalogEvaluationOutput } from "./contracts";
import { parseInputCatalogEvaluationOutput } from "./input-catalog-evaluation-schema";

export type InputCatalogEvaluationAdministrativeDecision =
  | "confirm_sufficient"
  | "acknowledge_factual_gap";

export type InputCatalogEvaluationAdministrativeDecisionResult =
  | Readonly<{
      ok: true;
      kind: "sufficiency_confirmed";
      reviewedVersion: number;
    }>
  | Readonly<{
      ok: true;
      kind: "factual_gap_acknowledged";
      reviewedVersion: null;
    }>
  | Readonly<{
      ok: false;
      stale: boolean;
      code: "OUTPUT_INVALID" | "DECISION_NOT_ALLOWED" | "CONTEXT_STALE" | "RECORD_FAILED";
      message: string;
    }>;

export async function executeInputCatalogEvaluationAdministrativeDecision(
  input: Readonly<{
    decision: InputCatalogEvaluationAdministrativeDecision;
    output: InputCatalogEvaluationOutput | unknown;
  }>,
  ports: Readonly<{
    revalidate: () => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>>;
    recordReviewedVersion: () => Promise<
      | Readonly<{ ok: true; reviewedVersion: number }>
      | Readonly<{ ok: false; message: string }>
    >;
  }>,
): Promise<InputCatalogEvaluationAdministrativeDecisionResult> {
  const parsed = parseInputCatalogEvaluationOutput(input.output);
  if (!parsed.ok) {
    return failure("OUTPUT_INVALID", false, "O resultado da avaliação não é válido para decisão administrativa.");
  }

  if (
    (input.decision === "confirm_sufficient" && parsed.value.status !== "sufficient") ||
    (input.decision === "acknowledge_factual_gap" && parsed.value.status !== "candidate_gaps")
  ) {
    return failure(
      "DECISION_NOT_ALLOWED",
      false,
      parsed.value.status === "inconclusive"
        ? "Resultado inconclusivo não pode gerar nem confirmar decisão administrativa."
        : "A decisão solicitada não corresponde ao status validado da avaliação.",
    );
  }

  const revalidated = await ports.revalidate();
  if (!revalidated.ok) {
    return failure("CONTEXT_STALE", true, revalidated.message);
  }

  if (input.decision === "acknowledge_factual_gap") {
    return Object.freeze({
      ok: true,
      kind: "factual_gap_acknowledged",
      reviewedVersion: null,
    });
  }

  const recorded = await ports.recordReviewedVersion();
  if (!recorded.ok) {
    return failure("RECORD_FAILED", true, recorded.message);
  }
  return Object.freeze({
    ok: true,
    kind: "sufficiency_confirmed",
    reviewedVersion: recorded.reviewedVersion,
  });
}

function failure(
  code: Extract<InputCatalogEvaluationAdministrativeDecisionResult, { ok: false }>["code"],
  stale: boolean,
  message: string,
): Extract<InputCatalogEvaluationAdministrativeDecisionResult, { ok: false }> {
  return Object.freeze({ ok: false, code, stale, message });
}

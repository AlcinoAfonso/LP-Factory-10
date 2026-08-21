import type {
  InputCatalogEvaluationCandidate,
  InputCatalogEvaluationOutput,
} from "./contracts";
import { parseInputCatalogEvaluationOutput } from "./input-catalog-evaluation-schema";

export type InputCatalogEvaluationAdministrativeDecision =
  | "confirm_sufficient"
  | "reject_candidates_and_confirm_sufficient"
  | "acknowledge_factual_gap";

export type InputCatalogEvaluationAdministrativeDecisionResult =
  | Readonly<{
      ok: true;
      kind: "sufficiency_confirmed";
      reviewedVersion: number;
    }>
  | Readonly<{
      ok: true;
      kind: "candidates_rejected_and_sufficiency_confirmed";
      reviewedVersion: number;
    }>
  | Readonly<{
      ok: true;
      kind: "factual_gap_acknowledged";
      reviewedVersion: null;
      selectedCandidates: readonly Readonly<{
        index: number;
        candidate: InputCatalogEvaluationCandidate;
      }>[];
      handoff?: string;
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
    selectedCandidateIndexes?: readonly number[];
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

  const confirmationAllowed =
    input.decision === "confirm_sufficient" && parsed.value.status === "sufficient";
  const candidateRejectionAllowed =
    input.decision === "reject_candidates_and_confirm_sufficient" &&
    parsed.value.status === "candidate_gaps" &&
    (
      input.selectedCandidateIndexes === undefined ||
      (Array.isArray(input.selectedCandidateIndexes) && input.selectedCandidateIndexes.length === 0)
    );
  const acknowledgementAllowed =
    input.decision === "acknowledge_factual_gap" &&
    parsed.value.status === "candidate_gaps";
  if (!confirmationAllowed && !candidateRejectionAllowed && !acknowledgementAllowed) {
    return failure(
      "DECISION_NOT_ALLOWED",
      false,
      parsed.value.status === "inconclusive"
        ? "Resultado inconclusivo não pode gerar nem confirmar decisão administrativa."
        : "A decisão solicitada não corresponde ao status validado da avaliação.",
    );
  }

  const selectedCandidates = input.decision === "acknowledge_factual_gap"
    ? selectActionableCandidates(parsed.value, input.selectedCandidateIndexes)
    : null;
  if (input.decision === "acknowledge_factual_gap" && selectedCandidates === null) {
    return failure(
      "DECISION_NOT_ALLOWED",
      false,
      "Selecione ao menos um candidato acionável autenticado, sem duplicidades ou índices inválidos.",
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
      selectedCandidates: Object.freeze(selectedCandidates ?? []),
    });
  }

  const recorded = await ports.recordReviewedVersion();
  if (!recorded.ok) {
    return failure("RECORD_FAILED", true, recorded.message);
  }
  return Object.freeze({
    ok: true,
    kind: input.decision === "reject_candidates_and_confirm_sufficient"
      ? "candidates_rejected_and_sufficiency_confirmed"
      : "sufficiency_confirmed",
    reviewedVersion: recorded.reviewedVersion,
  });
}

function selectActionableCandidates(
  output: InputCatalogEvaluationOutput,
  indexes: readonly number[] | undefined,
): readonly Readonly<{ index: number; candidate: InputCatalogEvaluationCandidate }>[] | null {
  if (!Array.isArray(indexes) || indexes.length === 0) return null;
  const uniqueIndexes = new Set<number>();
  const selected: Readonly<{ index: number; candidate: InputCatalogEvaluationCandidate }>[] = [];
  for (const index of indexes) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= output.candidates.length) return null;
    if (uniqueIndexes.has(index)) return null;
    const candidate = output.candidates[index];
    if (
      !candidate ||
      (candidate.conclusion !== "refine_existing_field" &&
        candidate.conclusion !== "possible_new_field")
    ) {
      return null;
    }
    uniqueIndexes.add(index);
    selected.push(Object.freeze({ index, candidate }));
  }
  return Object.freeze(selected);
}

function failure(
  code: Extract<InputCatalogEvaluationAdministrativeDecisionResult, { ok: false }>["code"],
  stale: boolean,
  message: string,
): Extract<InputCatalogEvaluationAdministrativeDecisionResult, { ok: false }> {
  return Object.freeze({ ok: false, code, stale, message });
}

import { isLandingPageInputCatalogVersionExecutable } from "../input-catalog";
import type {
  DeriveTaxonPreparationForVersionInput,
  TaxonPreparationResult,
} from "./contracts";

export function classifyRequiredInputCatalogVersion(
  version: number,
): Extract<TaxonPreparationResult, { ok: false }> | null {
  if (!Number.isSafeInteger(version) || version <= 0) {
    return failure(
      "REQUIRED_INPUT_CATALOG_VERSION_INVALID",
      "A versão E20.2 requerida é inválida.",
    );
  }
  if (!isLandingPageInputCatalogVersionExecutable(version)) {
    return failure(
      "REQUIRED_INPUT_CATALOG_VERSION_NOT_EXECUTABLE",
      "A versão E20.2 requerida não é executável.",
    );
  }
  return null;
}

export function deriveTaxonPreparationForVersion(
  input: DeriveTaxonPreparationForVersionInput,
): TaxonPreparationResult {
  const versionFailure = classifyRequiredInputCatalogVersion(
    input.requiredInputCatalogVersion,
  );
  if (versionFailure) return versionFailure;
  if (!input.selectedResearch.ok) return input.selectedResearch;

  const reviewedVersion = input.selectedResearch.value.reviewedInputCatalogVersion;
  if (reviewedVersion === undefined || reviewedVersion === null) {
    return failure(
      "INPUT_CATALOG_REVIEW_ABSENT",
      "O taxon ainda não possui uma versão E20.2 avaliada.",
    );
  }
  if (reviewedVersion !== input.requiredInputCatalogVersion) {
    return failure(
      "INPUT_CATALOG_REVIEW_VERSION_MISMATCH",
      "A versão E20.2 avaliada não corresponde à versão requerida.",
    );
  }

  return Object.freeze({
    ok: true,
    value: Object.freeze({
      prepared: true as const,
      taxonId: input.selectedResearch.value.taxonId,
      taxonSlug: input.selectedResearch.value.taxonSlug,
      selectedResearchVersion: input.selectedResearch.value.selectedResearchVersion,
      reviewedInputCatalogVersion: reviewedVersion,
      requiredInputCatalogVersion: input.requiredInputCatalogVersion,
      research: input.selectedResearch.value.research,
    }),
  });
}

function failure(
  code: Extract<TaxonPreparationResult, { ok: false }>["error"]["code"],
  message: string,
): Extract<TaxonPreparationResult, { ok: false }> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

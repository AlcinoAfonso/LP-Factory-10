import {
  classifyLandingPageInputCatalogTransitionForTaxon,
  isLandingPageInputCatalogVersionExecutable,
} from "../input-catalog";
import type {
  DeriveEffectiveTaxonPreparationInput,
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
      effectiveInputCatalogVersion: reviewedVersion,
      transitionClassification: "no_material_change" as const,
      research: input.selectedResearch.value.research,
    }),
  });
}

export function deriveEffectiveTaxonPreparation(
  input: DeriveEffectiveTaxonPreparationInput,
): TaxonPreparationResult {
  const versionFailure = classifyRequiredInputCatalogVersion(
    input.currentInputCatalogVersion,
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
  const reviewedFailure = classifyRequiredInputCatalogVersion(reviewedVersion);
  if (reviewedFailure) return reviewedFailure;
  if (reviewedVersion > input.currentInputCatalogVersion) {
    return failure(
      "INPUT_CATALOG_TRANSITION_REVIEW_REQUIRED",
      "A versão E20.2 avaliada é posterior à versão atual autorizada.",
    );
  }

  const transition =
    reviewedVersion === input.currentInputCatalogVersion
      ? { classification: "no_material_change" as const }
      : classifyLandingPageInputCatalogTransitionForTaxon({
          previousVersion: reviewedVersion,
          nextVersion: input.currentInputCatalogVersion,
          taxonChain: input.taxonChain,
        });
  if (transition.classification === "review_required") {
    return failure(
      "INPUT_CATALOG_TRANSITION_REVIEW_REQUIRED",
      "A versão atual E20.2 exige nova decisão humana de suficiência para este taxon.",
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
      requiredInputCatalogVersion: input.currentInputCatalogVersion,
      effectiveInputCatalogVersion: input.currentInputCatalogVersion,
      transitionClassification: transition.classification,
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

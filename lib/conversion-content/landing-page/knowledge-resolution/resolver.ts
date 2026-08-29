import {
  buildLandingPageInputCatalogTaxonChain,
  parseLandingPageOfferingScope,
  type LandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonIdentity,
  type LandingPageOfferingScope,
} from "../input-catalog";
import type { TaxonPreparationResult } from "../taxon-preparation";
import {
  canAuthorizeSpecializedKnowledge,
  evaluateDeterministicTaxonMatch,
  type TaxonMatchCandidate,
} from "../../../onboarding/niche-resolution";
import type {
  LandingPageKnowledgeFallbackReason,
  LandingPageKnowledgeMatchProvenance,
  LandingPageKnowledgeResolutionErrorCode,
  LandingPageKnowledgeResolutionPorts,
  LandingPageKnowledgeResolutionResult,
  LandingPageKnowledgeResolutionValue,
  LandingPageKnowledgeResearchSource,
  ResolveLandingPageKnowledgeInput,
} from "./contracts";
import { compareTaxonInputCatalogs } from "./equivalence";

const SPECIALIZED_MATCH_LIMIT = 10;
const SPECIALIZED_PREPARATION_FALLBACK_CODES = new Set([
  "SELECTION_ABSENT",
  "SELECTED_VERSION_INVALID",
  "FILE_NOT_FOUND",
  "METADATA_INVALID",
  "CONTENT_EMPTY",
  "INPUT_CATALOG_REVIEW_ABSENT",
  "INPUT_CATALOG_REVIEW_VERSION_MISMATCH",
  "INPUT_CATALOG_TRANSITION_REVIEW_REQUIRED",
]);

export async function resolveLandingPageKnowledge(
  input: ResolveLandingPageKnowledgeInput,
  ports: LandingPageKnowledgeResolutionPorts,
): Promise<LandingPageKnowledgeResolutionResult> {
  const offeringScope = parseLandingPageOfferingScope(input.offeringScope);
  if (!offeringScope.ok) {
    return failure(
      "INVALID_OFFERING_SCOPE",
      null,
      "O escopo comercial da landing page possui shape inválido.",
    );
  }

  const taxonomy = await ports.readTaxonomy(input.servedTaxonId);
  if (!taxonomy.ok) {
    return failure(
      "TAXONOMY_READ_FAILED",
      taxonomy.error.code,
      taxonomy.error.message,
    );
  }
  const basePreparation = await ports.loadPreparation(
    input.servedTaxonId,
    taxonomy.value.chain,
  );
  if (!basePreparation.ok) {
    return preparationFailure("BASE_PREPARATION_FAILED", basePreparation);
  }
  if (
    basePreparation.value.taxonId !== input.servedTaxonId ||
    basePreparation.value.effectiveInputCatalogVersion !==
      input.currentInputCatalogVersion
  ) {
    return failure(
      "BASE_PREPARATION_FAILED",
      "PREPARATION_IDENTITY_MISMATCH",
      "A preparação-base não corresponde à identidade E20.7 requerida.",
    );
  }

  if (offeringScope.value.mode === "portfolio") {
    return success(
      buildValue({
        status: "base_only",
        scope: offeringScope.value,
        servedTaxon: taxonomy.value.selected,
        basePreparation,
        provenance: [],
        fallbackReason: "portfolio_scope",
      }),
    );
  }
  if (offeringScope.value.mode === "multiple") {
    return success(
      buildValue({
        status: "dynamic_required",
        scope: offeringScope.value,
        servedTaxon: taxonomy.value.selected,
        basePreparation,
        provenance: [],
        fallbackReason: "multiple_scope",
      }),
    );
  }

  const matchResult = await ports.matchTaxons(
    offeringScope.value.offerings[0],
    SPECIALIZED_MATCH_LIMIT,
  );
  if (!matchResult.ok) {
    return failure("MATCH_FAILED", matchResult.error.code, matchResult.error.message);
  }
  const descendants = matchResult.candidates.filter((candidate) =>
    isActiveDescendant(candidate.taxonId, taxonomy.value.selected.id, taxonomy.value.taxons),
  );
  const provenance = descendants.map(matchProvenance);
  const eligible = descendants.filter((candidate) =>
    canAuthorizeSpecializedKnowledge(candidate.matchSource),
  );
  const decision = evaluateDeterministicTaxonMatch(
    [...descendants],
    offeringScope.value.offerings[0],
  );

  if (descendants.length === 0) {
    return dynamicFallback(
      offeringScope.value,
      taxonomy.value.selected,
      basePreparation,
      provenance,
      "single_no_match",
    );
  }
  if (eligible.length === 0) {
    return dynamicFallback(
      offeringScope.value,
      taxonomy.value.selected,
      basePreparation,
      provenance,
      "single_weak_match",
    );
  }
  if (eligible.length !== 1) {
    return dynamicFallback(
      offeringScope.value,
      taxonomy.value.selected,
      basePreparation,
      provenance,
      "single_ambiguous_match",
    );
  }
  const candidate = eligible[0];
  if (
    decision.confidence !== "high" ||
    decision.selectedCandidate?.taxonId !== candidate.taxonId
  ) {
    return dynamicFallback(
      offeringScope.value,
      taxonomy.value.selected,
      basePreparation,
      provenance,
      "single_low_confidence",
    );
  }

  const candidateIdentity = taxonomy.value.taxons.find(
    (taxon) => taxon.id === candidate.taxonId,
  );
  if (!candidateIdentity) {
    return failure(
      "TAXONOMY_READ_FAILED",
      "TAXON_NOT_FOUND",
      "O candidato não pertence à cadeia taxonômica autoritativa.",
    );
  }
  const candidateChain = buildLandingPageInputCatalogTaxonChain(
    candidateIdentity,
    taxonomy.value.taxons,
  );
  if (!candidateChain.ok) {
    return failure(
      "TAXONOMY_READ_FAILED",
      candidateChain.error.code,
      candidateChain.error.message,
    );
  }

  const specializedPreparation = await ports.loadPreparation(
    candidate.taxonId,
    candidateChain.value,
  );
  if (!specializedPreparation.ok) {
    if (SPECIALIZED_PREPARATION_FALLBACK_CODES.has(specializedPreparation.error.code)) {
      return dynamicFallback(
        offeringScope.value,
        taxonomy.value.selected,
        basePreparation,
        provenance,
        "single_specialized_unprepared",
      );
    }
    return preparationFailure(
      "SPECIALIZED_PREPARATION_FAILED",
      specializedPreparation,
    );
  }
  if (
    specializedPreparation.value.taxonId !== candidate.taxonId ||
    specializedPreparation.value.effectiveInputCatalogVersion !==
      input.currentInputCatalogVersion
  ) {
    return failure(
      "SPECIALIZED_PREPARATION_FAILED",
      "PREPARATION_IDENTITY_MISMATCH",
      "A preparação especializada não corresponde ao candidato autorizado.",
    );
  }

  const equivalence = compareTaxonInputCatalogs({
    version: input.currentInputCatalogVersion,
    servedTaxonChain: taxonomy.value.chain,
    specializedTaxonChain: candidateChain.value,
  });
  if (!equivalence.ok) {
    return failure(
      "INPUT_CATALOG_RESOLUTION_FAILED",
      equivalence.error.code,
      equivalence.error.message,
    );
  }
  if (!equivalence.equivalent) {
    return dynamicFallback(
      offeringScope.value,
      taxonomy.value.selected,
      basePreparation,
      provenance,
      "single_catalog_inequivalent",
    );
  }

  return success(
    buildValue({
      status: "specialized_deep",
      scope: offeringScope.value,
      servedTaxon: taxonomy.value.selected,
      basePreparation: specializedPreparation,
      provenance,
      fallbackReason: null,
    }),
  );
}

export function isActiveDescendant(
  candidateId: string,
  ancestorId: string,
  taxons: readonly LandingPageInputCatalogTaxonIdentity[],
): boolean {
  const byId = new Map(taxons.map((taxon) => [taxon.id, taxon]));
  let current = byId.get(candidateId);
  const visited = new Set<string>();
  while (current && current.parentId !== null) {
    if (!current.isActive || visited.has(current.id)) return false;
    visited.add(current.id);
    if (current.parentId === ancestorId) return true;
    current = byId.get(current.parentId);
  }
  return false;
}

function dynamicFallback(
  scope: Extract<LandingPageOfferingScope, { mode: "single" }> | LandingPageOfferingScope,
  servedTaxon: LandingPageInputCatalogTaxonIdentity,
  basePreparation: Extract<TaxonPreparationResult, { ok: true }>,
  provenance: readonly LandingPageKnowledgeMatchProvenance[],
  fallbackReason: LandingPageKnowledgeFallbackReason,
): LandingPageKnowledgeResolutionResult {
  return success(
    buildValue({
      status: "dynamic_required",
      scope,
      servedTaxon,
      basePreparation,
      provenance,
      fallbackReason,
    }),
  );
}

function buildValue(input: {
  status: LandingPageKnowledgeResolutionValue["status"];
  scope: LandingPageOfferingScope;
  servedTaxon: LandingPageInputCatalogTaxonIdentity;
  basePreparation: Extract<TaxonPreparationResult, { ok: true }>;
  provenance: readonly LandingPageKnowledgeMatchProvenance[];
  fallbackReason: LandingPageKnowledgeFallbackReason | null;
}): LandingPageKnowledgeResolutionValue {
  const researchSource: LandingPageKnowledgeResearchSource = {
    taxonId: input.basePreparation.value.taxonId,
    taxonSlug: input.basePreparation.value.taxonSlug,
    selectedResearchVersion: input.basePreparation.value.selectedResearchVersion,
    reviewedInputCatalogVersion:
      input.basePreparation.value.reviewedInputCatalogVersion,
    effectiveInputCatalogVersion:
      input.basePreparation.value.effectiveInputCatalogVersion,
    research: input.basePreparation.value.research,
  };
  return deepFreeze({
    status: input.status,
    mode: input.scope.mode,
    offeringInvalidated: false as const,
    servedTaxon: input.servedTaxon,
    effectiveInputCatalogVersion:
      input.basePreparation.value.effectiveInputCatalogVersion,
    researchSource,
    matchProvenance: [...input.provenance],
    fallbackReason: input.fallbackReason,
    dynamicTarget:
      input.status === "dynamic_required"
        ? {
            mode: input.scope.mode as "single" | "multiple",
            offerings: [...input.scope.offerings],
          }
        : null,
  });
}

function matchProvenance(
  candidate: TaxonMatchCandidate,
): LandingPageKnowledgeMatchProvenance {
  return Object.freeze({
    taxonId: candidate.taxonId,
    taxonName: candidate.name,
    taxonSlug: candidate.slug,
    matchSource: candidate.matchSource,
    matchedAliases: Object.freeze([...candidate.matchedAliases]),
    score: candidate.score,
  });
}

function preparationFailure(
  code: Extract<
    LandingPageKnowledgeResolutionErrorCode,
    "BASE_PREPARATION_FAILED" | "SPECIALIZED_PREPARATION_FAILED"
  >,
  preparation: Extract<TaxonPreparationResult, { ok: false }>,
): LandingPageKnowledgeResolutionResult {
  return failure(code, preparation.error.code, preparation.error.message);
}

function success(
  value: LandingPageKnowledgeResolutionValue,
): LandingPageKnowledgeResolutionResult {
  return Object.freeze({ ok: true, value });
}

function failure(
  code: LandingPageKnowledgeResolutionErrorCode,
  causeCode: string | null,
  message: string,
): LandingPageKnowledgeResolutionResult {
  return Object.freeze({
    ok: false,
    error: Object.freeze({ code, causeCode, message }),
  });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
    Object.freeze(value);
  }
  return value;
}

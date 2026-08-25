import { resolveLandingPageRootParameters } from "../conversion-content/landing-page";
import {
  isLandingPageInputCatalogVersionExecutable,
  type LandingPageInputValueType,
} from "../conversion-content/landing-page/input-catalog";
import type {
  AccountLandingPageOnboardingFieldState,
} from "./contracts";
import { isOperationalLandingPageStatus } from "../types/status";
import { resolveAccountLandingPageOnboardingConfiguration } from "./onboardingConfiguration";
import {
  LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION,
  LANDING_PAGE_GENERATION_CONTEXT_LEGACY_CONTRACT_VERSION,
  type CompileLegacyLandingPageGenerationContextInput,
  type CompileLandingPageGenerationContextInput,
  type CompileLandingPageGenerationContextResult,
  type LandingPageGenerationAuthorizedFact,
  type LandingPageGenerationContextFailureCode,
} from "./generationContextContracts";

const ROOT_VERSION = 1;

const MODEL_VALUE_TYPES: ReadonlySet<LandingPageInputValueType> = new Set([
  "string",
  "enum",
  "string_list",
  "boolean",
  "number_range",
  "keyword_map",
]);

const SERVER_VALUE_TYPES: ReadonlySet<LandingPageInputValueType> = new Set([
  "phone",
  "email",
  "url",
  "asset_reference",
  "color_palette",
]);

export function compileLandingPageGenerationContext(
  input: unknown,
): CompileLandingPageGenerationContextResult {
  if (!isMinimumCompilerInput(input)) {
    return failure("INVALID_INPUT", "Generation context input is invalid.");
  }
  try {
    return compileValidatedLandingPageGenerationContext(input);
  } catch {
    return failure("INVALID_INPUT", "Generation context input is invalid.");
  }
}

export function compileLegacyLandingPageGenerationContext(
  input: unknown,
): CompileLandingPageGenerationContextResult {
  if (!isMinimumLegacyCompilerInput(input)) {
    return failure("INVALID_INPUT", "Generation context input is invalid.");
  }
  try {
    return compileValidatedLegacyLandingPageGenerationContext(input);
  } catch {
    return failure("INVALID_INPUT", "Generation context input is invalid.");
  }
}

function compileValidatedLegacyLandingPageGenerationContext(
  input: CompileLegacyLandingPageGenerationContextInput,
): CompileLandingPageGenerationContextResult {
  const {
    historicalConfiguration,
    currentPlanKey,
    currentTaxonChain,
    currentAuthoritativeValues,
  } = input.revalidationAuthority;
  if (
    !isOperationalLandingPageStatus(input.landingPage.status) ||
    input.landingPage.account_id !== historicalConfiguration.accountId
  ) {
    return failure(
      "LANDING_PAGE_NOT_DRAFT",
      "Landing page is not an authorized account draft.",
    );
  }
  if (historicalConfiguration.landingPageId !== input.landingPage.id) {
    return failure(
      "CONFIGURATION_NOT_BOUND",
      "Configuration is not bound to the requested landing page.",
    );
  }
  if (
    !historicalConfiguration.complete ||
    historicalConfiguration.missingRequiredFieldKeys.length > 0
  ) {
    return failure(
      "CONFIGURATION_INCOMPLETE",
      "Landing-page configuration is incomplete.",
    );
  }
  if (!input.preparation.ok) {
    const catalogFailure = [
      "REQUIRED_INPUT_CATALOG_VERSION_INVALID",
      "REQUIRED_INPUT_CATALOG_VERSION_NOT_EXECUTABLE",
      "INPUT_CATALOG_REVIEW_VERSION_MISMATCH",
      "INPUT_CATALOG_TRANSITION_REVIEW_REQUIRED",
    ].includes(input.preparation.error.code);
    return failure(
      catalogFailure
        ? "INPUT_CATALOG_INCOMPATIBLE"
        : "TAXON_PREPARATION_UNAVAILABLE",
      catalogFailure
        ? `Input catalog preparation failed: ${input.preparation.error.code}.`
        : `Taxon preparation failed: ${input.preparation.error.code}.`,
    );
  }
  const servedTaxon =
    currentTaxonChain.ultraNiche ??
    currentTaxonChain.niche ??
    currentTaxonChain.segment;
  const preparation = input.preparation.value;
  if (
    preparation.taxonId !== servedTaxon.id ||
    preparation.taxonSlug !== servedTaxon.slug ||
    !Number.isSafeInteger(preparation.effectiveInputCatalogVersion) ||
    preparation.effectiveInputCatalogVersion <= 0 ||
    preparation.research.taxonSlug !== servedTaxon.slug ||
    preparation.research.audienceScope !== "end_customer" ||
    preparation.research.researchVersion !== preparation.selectedResearchVersion
  ) {
    return failure(
      "TAXON_PREPARATION_UNAVAILABLE",
      "Taxon preparation is incompatible with the landing page.",
    );
  }
  const revalidated = revalidateConfiguration(
    input.revalidationAuthority,
    preparation.effectiveInputCatalogVersion,
  );
  if (!revalidated.ok) {
    return failure(
      revalidated.catalogFailure
        ? "INPUT_CATALOG_INCOMPATIBLE"
        : "CONFIGURATION_REVALIDATION_REQUIRED",
      revalidated.catalogFailure
        ? "The reviewed input catalog could not be resolved."
        : "Landing-page configuration requires factual correction after revalidation.",
    );
  }
  const root = resolveLandingPageRootParameters({ rootVersion: ROOT_VERSION });
  if (!root.ok) {
    return failure("ROOT_UNAVAILABLE", "Landing-page root contract is unavailable.");
  }
  const projectedFacts = projectFacts(revalidated.configuration.fields);
  if (!projectedFacts.ok) return projectedFacts.result;
  return success({
    contractVersion: LANDING_PAGE_GENERATION_CONTEXT_LEGACY_CONTRACT_VERSION,
    identities: {
      accountId: input.landingPage.account_id,
      landingPage: { id: input.landingPage.id, status: input.landingPage.status },
      planKey: currentPlanKey,
      servedTaxon,
      taxonChain: currentTaxonChain,
      historicalConfigurationCatalogVersion: historicalConfiguration.catalogVersion,
      effectiveInputCatalogVersion: preparation.effectiveInputCatalogVersion,
      configurationRevision: historicalConfiguration.revision,
      rootVersion: root.value.rootVersion,
      endCustomerResearchVersion: preparation.selectedResearchVersion,
    },
    modelContext: {
      research: {
        taxonSlug: preparation.research.taxonSlug,
        audienceScope: preparation.research.audienceScope,
        researchVersion: preparation.research.researchVersion,
        content: preparation.research.content,
      },
      facts: projectedFacts.modelFacts,
      editorialLimits: {
        semanticRoles: Object.values(root.value.semanticRoles).map((role) => ({
          key: role.key,
          recommended: role.textRange.recommended,
          absoluteMax: role.textRange.absoluteMax,
        })),
        semanticHierarchy: root.value.visualCriteria.semanticHierarchy,
      },
    },
    serverContext: { facts: projectedFacts.serverFacts },
  });
}

function compileValidatedLandingPageGenerationContext(
  input: CompileLandingPageGenerationContextInput,
): CompileLandingPageGenerationContextResult {
  const {
    historicalConfiguration,
    currentPlanKey,
    currentTaxonChain,
    currentAuthoritativeValues,
  } = input.revalidationAuthority;
  if (
    !isOperationalLandingPageStatus(input.landingPage.status) ||
    input.landingPage.account_id !== historicalConfiguration.accountId
  ) {
    return failure(
      "LANDING_PAGE_NOT_DRAFT",
      "Landing page is not an authorized account draft.",
    );
  }
  if (historicalConfiguration.landingPageId !== input.landingPage.id) {
    return failure(
      "CONFIGURATION_NOT_BOUND",
      "Configuration is not bound to the requested landing page.",
    );
  }
  if (
    !historicalConfiguration.complete ||
    historicalConfiguration.missingRequiredFieldKeys.length > 0
  ) {
    return failure(
      "CONFIGURATION_INCOMPLETE",
      "Landing-page configuration is incomplete.",
    );
  }
  if (!input.preparation.ok) {
    const catalogFailure = [
      "REQUIRED_INPUT_CATALOG_VERSION_INVALID",
      "REQUIRED_INPUT_CATALOG_VERSION_NOT_EXECUTABLE",
      "INPUT_CATALOG_REVIEW_VERSION_MISMATCH",
      "INPUT_CATALOG_TRANSITION_REVIEW_REQUIRED",
    ].includes(input.preparation.error.code);
    return failure(
      catalogFailure
        ? "INPUT_CATALOG_INCOMPATIBLE"
        : "TAXON_PREPARATION_UNAVAILABLE",
      catalogFailure
        ? `Input catalog preparation failed: ${input.preparation.error.code}.`
        : `Taxon preparation failed: ${input.preparation.error.code}.`,
    );
  }
  const servedTaxon =
    currentTaxonChain.ultraNiche ??
    currentTaxonChain.niche ??
    currentTaxonChain.segment;
  const preparation = input.preparation.value;
  if (
    preparation.taxonId !== servedTaxon.id ||
    preparation.taxonSlug !== servedTaxon.slug ||
    !Number.isSafeInteger(preparation.effectiveInputCatalogVersion) ||
    preparation.effectiveInputCatalogVersion <= 0 ||
    preparation.research.taxonSlug !== servedTaxon.slug ||
    preparation.research.audienceScope !== "end_customer" ||
    preparation.research.researchVersion !== preparation.selectedResearchVersion
  ) {
    return failure(
      "TAXON_PREPARATION_UNAVAILABLE",
      "Taxon preparation is incompatible with the landing page.",
    );
  }

  const revalidated = revalidateConfiguration(
    input.revalidationAuthority,
    preparation.effectiveInputCatalogVersion,
  );
  if (!revalidated.ok) {
    return failure(
      revalidated.catalogFailure
        ? "INPUT_CATALOG_INCOMPATIBLE"
        : "CONFIGURATION_REVALIDATION_REQUIRED",
      revalidated.catalogFailure
        ? "The reviewed input catalog could not be resolved."
        : "Landing-page configuration requires factual correction after revalidation.",
    );
  }

  const root = resolveLandingPageRootParameters({ rootVersion: ROOT_VERSION });
  if (!root.ok) {
    return failure(
      "ROOT_UNAVAILABLE",
      "Landing-page root contract is unavailable.",
    );
  }

  const projectedFacts = projectFacts(revalidated.configuration.fields);
  if (!projectedFacts.ok) return projectedFacts.result;

  if (
    !isCompatibleHistoricalCatalogVersion(
      input.revalidationAuthority.landingPageCatalogVersion,
      preparation.effectiveInputCatalogVersion,
    ) ||
    !Number.isSafeInteger(input.revalidationAuthority.landingPageRevision) ||
    input.revalidationAuthority.landingPageRevision <= 0 ||
    ((input.revalidationAuthority.sharedRevision === null) !==
      (input.revalidationAuthority.sharedCatalogVersion === null)) ||
    (input.revalidationAuthority.sharedRevision !== null &&
      (!Number.isSafeInteger(input.revalidationAuthority.sharedRevision) ||
        input.revalidationAuthority.sharedRevision <= 0 ||
        !isCompatibleHistoricalCatalogVersion(
          input.revalidationAuthority.sharedCatalogVersion,
          preparation.effectiveInputCatalogVersion,
        )))
  ) {
    return failure(
      "CONFIGURATION_REVALIDATION_REQUIRED",
      "Operational configuration provenance is incomplete or incompatible.",
    );
  }
  if (
    input.revalidationAuthority.sharedRevision === null &&
    revalidated.configuration.fields.some(
      (field) =>
        field.applicable &&
        (field.field.valueScope === "account" ||
          field.field.valueScope === "business") &&
        field.source === "configuration",
    )
  ) {
    return failure(
      "CONFIGURATION_REVALIDATION_REQUIRED",
      "Shared operational provenance is required for configured shared facts.",
    );
  }

  return success({
    contractVersion: LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION,
    identities: {
      accountId: input.landingPage.account_id,
      landingPage: {
        id: input.landingPage.id,
        status: input.landingPage.status,
      },
      planKey: currentPlanKey,
      servedTaxon,
      taxonChain: currentTaxonChain,
      sharedCatalogVersion: input.revalidationAuthority.sharedCatalogVersion,
      landingPageCatalogVersion: input.revalidationAuthority.landingPageCatalogVersion,
      effectiveInputCatalogVersion: preparation.effectiveInputCatalogVersion,
      sharedRevision: input.revalidationAuthority.sharedRevision,
      landingPageRevision: input.revalidationAuthority.landingPageRevision,
      rootVersion: root.value.rootVersion,
      endCustomerResearchVersion: preparation.selectedResearchVersion,
    },
    modelContext: {
      research: {
        taxonSlug: preparation.research.taxonSlug,
        audienceScope: preparation.research.audienceScope,
        researchVersion: preparation.research.researchVersion,
        content: preparation.research.content,
      },
      facts: projectedFacts.modelFacts,
      editorialLimits: {
        semanticRoles: Object.values(root.value.semanticRoles).map((role) => ({
          key: role.key,
          recommended: role.textRange.recommended,
          absoluteMax: role.textRange.absoluteMax,
        })),
        semanticHierarchy: root.value.visualCriteria.semanticHierarchy,
      },
    },
    serverContext: {
      facts: projectedFacts.serverFacts,
    },
  });
}

function isCompatibleHistoricalCatalogVersion(
  historicalVersion: number | null,
  effectiveVersion: number,
): historicalVersion is number {
  return (
    historicalVersion !== null &&
    isLandingPageInputCatalogVersionExecutable(historicalVersion) &&
    historicalVersion <= effectiveVersion
  );
}

function revalidateConfiguration(
  authority:
    | CompileLandingPageGenerationContextInput["revalidationAuthority"]
    | CompileLegacyLandingPageGenerationContextInput["revalidationAuthority"],
  effectiveInputCatalogVersion: number,
):
  | Readonly<{
      ok: true;
      configuration: typeof authority.historicalConfiguration;
    }>
  | Readonly<{ ok: false; catalogFailure: boolean }> {
  const resolved = resolveAccountLandingPageOnboardingConfiguration({
    accountId: authority.historicalConfiguration.accountId,
    landingPageId: authority.historicalConfiguration.landingPageId,
    catalogVersion: effectiveInputCatalogVersion,
    revision: authority.historicalConfiguration.revision,
    planKey: authority.currentPlanKey,
    taxonChain: authority.currentTaxonChain,
    storedValues: authority.historicalConfiguration.storedValues,
    authoritativeValues: authority.currentAuthoritativeValues,
  });
  if (!resolved.ok) {
    return {
      ok: false,
      catalogFailure: resolved.error === "CATALOG_UNAVAILABLE",
    };
  }
  if (
    !resolved.configuration.complete ||
    resolved.configuration.missingRequiredFieldKeys.length > 0
  ) {
    return { ok: false, catalogFailure: false };
  }
  return { ok: true, configuration: resolved.configuration };
}

function isMinimumLegacyCompilerInput(
  value: unknown,
): value is CompileLegacyLandingPageGenerationContextInput {
  return isMinimumCompilerInput(value);
}

function projectFacts(
  fields: readonly AccountLandingPageOnboardingFieldState[],
):
  | Readonly<{
      ok: true;
      modelFacts: readonly LandingPageGenerationAuthorizedFact[];
      serverFacts: readonly LandingPageGenerationAuthorizedFact[];
    }>
  | Readonly<{
      ok: false;
      result: CompileLandingPageGenerationContextResult;
    }> {
  const modelFacts: LandingPageGenerationAuthorizedFact[] = [];
  const serverFacts: LandingPageGenerationAuthorizedFact[] = [];
  const seenFieldKeys = new Set<string>();

  for (const state of fields) {
    if (!state.applicable || state.source === "missing") continue;
    if (
      seenFieldKeys.has(state.field.fieldKey) ||
      state.value === undefined
    ) {
      return {
        ok: false,
        result: failure(
          "INPUT_CATALOG_INCOMPATIBLE",
          "Resolved configuration facts are incompatible with the input catalog.",
        ),
      };
    }
    seenFieldKeys.add(state.field.fieldKey);

    const fact: LandingPageGenerationAuthorizedFact = {
      fieldKey: state.field.fieldKey,
      purpose: state.field.purpose,
      valueType: state.field.valueType,
      value: state.value,
      source: state.source,
      provenance: state.field.provenance,
    };
    if (MODEL_VALUE_TYPES.has(state.field.valueType)) {
      modelFacts.push(fact);
      continue;
    }
    if (SERVER_VALUE_TYPES.has(state.field.valueType)) {
      serverFacts.push(fact);
      continue;
    }
    return {
      ok: false,
      result: failure(
        "INPUT_CATALOG_INCOMPATIBLE",
        "Input value type has no authorized projection.",
      ),
    };
  }

  return {
    ok: true,
    modelFacts,
    serverFacts,
  };
}

function isMinimumCompilerInput(
  value: unknown,
): value is CompileLandingPageGenerationContextInput {
  if (!isRecord(value)) return false;
  const landingPage = value.landingPage;
  const authority = value.revalidationAuthority;
  const preparation = value.preparation;
  return (
    isRecord(landingPage) &&
    isRecord(authority) &&
    isRecord(authority.historicalConfiguration) &&
    Array.isArray(authority.historicalConfiguration.fields) &&
    Array.isArray(authority.historicalConfiguration.missingRequiredFieldKeys) &&
    typeof authority.currentPlanKey === "string" &&
    isRecord(authority.currentTaxonChain) &&
    isRecord(authority.currentAuthoritativeValues) &&
    Number.isInteger(authority.historicalConfiguration.revision) &&
    isRecord(preparation) &&
    typeof preparation.ok === "boolean"
  );
}

function success(
  value: Extract<CompileLandingPageGenerationContextResult, { ok: true }>["value"],
): CompileLandingPageGenerationContextResult {
  return deepFreeze({ ok: true, value: structuredClone(value) });
}

function failure(
  code: LandingPageGenerationContextFailureCode,
  message: string,
): CompileLandingPageGenerationContextResult {
  return deepFreeze({ ok: false, error: { code, message } });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import { resolveLandingPageRootParameters } from "../conversion-content/landing-page";
import type {
  LandingPageInputValueType,
} from "../conversion-content/landing-page/input-catalog";
import type {
  AccountLandingPageOnboardingFieldState,
} from "./contracts";
import {
  LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION,
  LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION,
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

function compileValidatedLandingPageGenerationContext(
  input: CompileLandingPageGenerationContextInput,
): CompileLandingPageGenerationContextResult {
  if (
    input.landingPage.status !== "draft" ||
    input.landingPage.account_id !== input.configuration.accountId
  ) {
    return failure(
      "LANDING_PAGE_NOT_DRAFT",
      "Landing page is not an authorized account draft.",
    );
  }
  if (input.configuration.landingPageId !== input.landingPage.id) {
    return failure(
      "CONFIGURATION_NOT_BOUND",
      "Configuration is not bound to the requested landing page.",
    );
  }
  if (
    !input.configuration.complete ||
    input.configuration.missingRequiredFieldKeys.length > 0
  ) {
    return failure(
      "CONFIGURATION_INCOMPLETE",
      "Landing-page configuration is incomplete.",
    );
  }
  if (
    input.configuration.catalogVersion !==
    LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION
  ) {
    return failure(
      "INPUT_CATALOG_INCOMPATIBLE",
      "Input catalog version is not supported by this contract.",
    );
  }
  if (!input.research.ok) {
    return failure(
      "RESEARCH_UNAVAILABLE",
      `Research resolution failed: ${input.research.error.code}.`,
    );
  }

  const servedTaxon =
    input.configuration.taxonChain.ultraNiche ??
    input.configuration.taxonChain.niche ??
    input.configuration.taxonChain.segment;
  const research = input.research.value;
  if (
    research.servedTaxonId !== servedTaxon.id ||
    research.endCustomer.audienceScope !== "end_customer"
  ) {
    return failure(
      "RESEARCH_UNAVAILABLE",
      "Resolved end-customer research is incompatible with the landing page.",
    );
  }

  const root = resolveLandingPageRootParameters({ rootVersion: ROOT_VERSION });
  if (!root.ok) {
    return failure(
      "ROOT_UNAVAILABLE",
      "Landing-page root contract is unavailable.",
    );
  }

  const projectedFacts = projectFacts(input.configuration.fields);
  if (!projectedFacts.ok) return projectedFacts.result;

  return success({
    contractVersion: LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION,
    identities: {
      accountId: input.landingPage.account_id,
      landingPage: {
        id: input.landingPage.id,
        status: "draft",
      },
      planKey: input.configuration.planKey,
      servedTaxon,
      catalogVersion: LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION,
      configurationRevision: input.configuration.revision,
      rootVersion: root.value.rootVersion,
      endCustomerResearchVersion: research.versions.endCustomer,
    },
    modelContext: {
      research: research.endCustomer,
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
  const configuration = value.configuration;
  const research = value.research;
  return (
    isRecord(landingPage) &&
    isRecord(configuration) &&
    Array.isArray(configuration.fields) &&
    Array.isArray(configuration.missingRequiredFieldKeys) &&
    isRecord(configuration.taxonChain) &&
    Number.isInteger(configuration.revision) &&
    isRecord(research) &&
    typeof research.ok === "boolean"
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

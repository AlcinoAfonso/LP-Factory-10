import {
  resolveLandingPageRootParameters,
} from "../conversion-content/landing-page";
import {
  listLandingPageModuleIdentities,
  resolveLandingPageModuleCatalog,
  type LandingPageVariantFieldContract,
  type ResolvedLandingPageModuleCatalog,
} from "../conversion-content/landing-page/module-catalog";
import {
  resolveLandingPageInputCatalog,
  type ResolvedLandingPageInputField,
} from "../conversion-content/landing-page/input-catalog";
import type { ResolvedLandingPageResearch } from "../conversion-content/landing-page/research-resolution";
import type { AccountLandingPageOnboardingFieldState } from "./contracts";
import {
  LANDING_PAGE_GENERATION_BINDING_CATALOG_VERSION,
  LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION,
  LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION,
  type CompileLandingPageGenerationContextInput,
  type CompileLandingPageGenerationContextResult,
  type LandingPageGenerationAuthorizedFact,
  type LandingPageBrandColorPalette,
  type LandingPageGenerationContextFailureCode,
  type LandingPageGenerationSelectionDecision,
  type LandingPageGenerationSelectedModule,
} from "./generationContextContracts";
import { validateStarterColorPalette } from "./onboardingConfiguration";

const ROOT_VERSION = 1;
type LandingPageFieldDefinition = LandingPageVariantFieldContract["fields"][number];
const CENTRAL_FACT_KEYS = new Set([
  "primary_service_or_offer",
  "primary_service_or_offer_description",
]);
const DETERMINISTIC_PRESENTATION_INPUT_KEYS = new Set([
  "brand_color_palette",
  "privacy_policy_url",
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
    return failure("LANDING_PAGE_NOT_DRAFT", "Landing page is not an authorized account draft.");
  }
  if (input.configuration.landingPageId !== input.landingPage.id) {
    return failure("CONFIGURATION_NOT_BOUND", "Configuration is not bound to the requested landing page.");
  }
  if (!input.configuration.complete || input.configuration.missingRequiredFieldKeys.length > 0) {
    return failure("CONFIGURATION_INCOMPLETE", "Landing-page configuration is incomplete.");
  }
  if (input.configuration.catalogVersion !== LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION) {
    return failure("BINDING_CATALOG_INCOMPATIBLE", "Values input catalog version is not supported by this contract.");
  }

  const bindingCatalog = resolveLandingPageInputCatalog({
    version: LANDING_PAGE_GENERATION_BINDING_CATALOG_VERSION,
    plan: input.configuration.planKey,
    taxonChain: input.configuration.taxonChain,
  });
  if (!bindingCatalog.ok) {
    return failure("BINDING_CATALOG_UNAVAILABLE", "Binding input catalog is unavailable.");
  }
  if (!catalogsAreStructurallyCompatible(input.configuration.fields, bindingCatalog.value.fields)) {
    return failure("BINDING_CATALOG_INCOMPATIBLE", "Values and binding input catalogs are structurally incompatible.");
  }

  const root = resolveLandingPageRootParameters({ rootVersion: ROOT_VERSION });
  if (!root.ok) return failure("ROOT_UNAVAILABLE", "Landing-page root contract is unavailable.");

  const funnelStage = configuredValue(input.configuration.fields, "funnel_stage");
  if (typeof funnelStage !== "string") {
    return failure("FUNNEL_PROFILE_UNAVAILABLE", "Validated funnel profile is unavailable.");
  }
  if (!input.research.ok) {
    return failure("RESEARCH_UNAVAILABLE", `Research resolution failed: ${input.research.error.code}.`);
  }
  if (input.research.value.servedTaxonId !== bindingCatalog.value.servedTaxon.id) {
    return failure("RESEARCH_UNAVAILABLE", "Resolved research is incompatible with the landing page.");
  }
  if (!input.generationProfile.ok) {
    return failure("GENERATION_PROFILE_READ_FAILED", `Generation profile read failed: ${input.generationProfile.error.code}.`);
  }
  if (input.generationProfile.value.kind === "absent") {
    return failure("GENERATION_PROFILE_ABSENT", "No active generation profile resolves for the served taxon.");
  }
  const profile = input.generationProfile.value;
  if (
    profile.servedTaxonId !== bindingCatalog.value.servedTaxon.id ||
    (profile.generationGuidance !== undefined &&
      (typeof profile.generationGuidance !== "string" ||
        !profile.generationGuidance.trim())) ||
    hasInvalidRecommendationOrder(profile.recommendations)
  ) {
    return failure("GENERATION_PROFILE_INVALID", "Resolved generation profile is incompatible with the landing page.");
  }

  const identities = listLandingPageModuleIdentities();
  const bindingByKey = new Map(bindingCatalog.value.fields.map((field) => [field.fieldKey, field]));
  const selection: LandingPageGenerationSelectionDecision[] = [];
  const modules: LandingPageGenerationSelectedModule[] = [];
  const resolvedByVariant = new Map<string, ResolvedLandingPageModuleCatalog>();

  for (const recommendation of profile.recommendations) {
    const identity = identities.modules.find(
      (candidate) =>
        candidate.moduleKey === recommendation.moduleKey &&
        candidate.moduleVersion === recommendation.moduleVersion,
    );
    if (!identity) {
      return failure("MODULE_CATALOG_UNAVAILABLE", "Recommended module identity is unavailable.");
    }

    const candidates: Array<{ key: string; resolved: ResolvedLandingPageModuleCatalog }> = [];
    for (const variantIdentity of identity.variants) {
      const variantName = variantNameFromIdentity(
        recommendation.moduleKey,
        variantIdentity.variantKey,
      );
      if (!variantName) {
        return failure("MODULE_CATALOG_UNAVAILABLE", "Canonical variant identity is invalid.");
      }
      const resolved = resolveLandingPageModuleCatalog({
        moduleCatalogVersion: identities.moduleCatalogVersion,
        rootVersion: ROOT_VERSION,
        moduleKey: recommendation.moduleKey,
        moduleVersion: recommendation.moduleVersion,
        variantName,
        variantVersion: variantIdentity.variantVersion,
        funnelProfileKey: funnelStage,
      });
      if (!resolved.ok) {
        return failure("MODULE_CATALOG_UNAVAILABLE", `Module catalog resolution failed: ${resolved.error.code}.`);
      }
      resolvedByVariant.set(variantIdentity.variantKey, resolved.value);
      if (variantIsEligible(resolved.value, input.configuration.fields)) {
        candidates.push({ key: variantIdentity.variantKey, resolved: resolved.value });
      }
    }

    const preferred = recommendation.variantKey
      ? candidates.find(
          (candidate) =>
            candidate.key === recommendation.variantKey &&
            candidate.resolved.variant.variantVersion === recommendation.variantVersion,
        )
      : undefined;
    let selected: (typeof candidates)[number] | undefined;
    let cause: LandingPageGenerationSelectionDecision["cause"];
    if (preferred) {
      selected = preferred;
      cause = "preferred_variant_eligible";
    } else {
      const alternatives = candidates.filter(
        (candidate) => candidate.key !== recommendation.variantKey,
      );
      if (alternatives.length > 1) {
        return failure("MODULE_VARIANT_AMBIGUOUS", "More than one eligible module variant is available without a valid preference.");
      }
      selected = alternatives[0];
      cause = selected
        ? "single_eligible_alternative"
        : "no_contextually_eligible_variant";
    }

    if (!selected) {
      selection.push({ recommendation, decision: "omitted", cause });
      continue;
    }
    selection.push({
      recommendation,
      decision: "selected",
      cause,
      effectiveVariantKey: selected.key,
    });
    modules.push({
      recommendedOrder: recommendation.recommendedOrder,
      priority: recommendation.priority,
      ...(recommendation.variantKey
        ? { recommendedVariantKey: recommendation.variantKey }
        : {}),
      effectiveVariantKey: selected.key,
      module: selected.resolved.module,
      variant: selected.resolved.variant,
      effectiveRoot: selected.resolved.effectiveRoot,
      fieldContract: selected.resolved.fieldContract,
    });
  }

  const brandColorPalette = resolveBrandColorPalette(input.configuration.fields);
  if (!brandColorPalette) {
    return failure("CONFIGURATION_INCOMPLETE", "Validated brand color palette is unavailable.");
  }
  const requiresPrivacyPolicy = modules.some((module) =>
    module.variant.interactionContracts.some((interaction) => interaction.kind === "form"),
  );
  const privacyPolicyUrl = configuredValue(input.configuration.fields, "privacy_policy_url");
  if (requiresPrivacyPolicy && !isHttpsUrl(privacyPolicyUrl)) {
    return failure("CONFIGURATION_INCOMPLETE", "Validated privacy policy URL is unavailable.");
  }

  const referencedInputKeys = new Set(CENTRAL_FACT_KEYS);
  for (const selectedModule of modules) {
    collectReferencedInputKeys(selectedModule.fieldContract.fields, referencedInputKeys);
    for (const interaction of selectedModule.variant.interactionContracts) {
      if (interaction.kind === "form") {
        referencedInputKeys.add(interaction.operationalBinding.inputCatalogFieldKey);
      }
    }
  }
  const facts: LandingPageGenerationAuthorizedFact[] = [];
  for (const state of input.configuration.fields) {
    const bindingField = bindingByKey.get(state.field.fieldKey);
    const hasSupportedBinding = bindingField?.capabilityBindings?.some(
      (binding) => state.value === binding.supportedWhenValue,
    );
    const isOperationalDependent = [
      bindingField?.requiredWhen,
      bindingField?.applicableWhen,
    ].some(
      (condition) =>
        condition !== undefined && referencedInputKeys.has(condition.fieldKey),
    );
    if (
      state.applicable &&
      state.source !== "missing" &&
      !DETERMINISTIC_PRESENTATION_INPUT_KEYS.has(state.field.fieldKey) &&
      (referencedInputKeys.has(state.field.fieldKey) ||
        isOperationalDependent ||
        hasSupportedBinding)
    ) {
      facts.push({
        fieldKey: state.field.fieldKey,
        value: state.value,
        purpose: state.field.purpose,
        source: state.source,
        provenance: state.field.provenance,
        ...(hasSupportedBinding
          ? { capabilityBindings: bindingField?.capabilityBindings }
          : {}),
      });
    }
  }
  const capabilityFieldKeys = facts
    .filter((fact) => fact.capabilityBindings?.some((binding) => binding.slotKey === "applicable_capabilities"))
    .map((fact) => fact.fieldKey);
  const authorizedResearch = authorizeResearch(input.research.value, modules, resolvedByVariant);

  return success({
    contractVersion: LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION,
    partA: {
      landingPage: {
        id: input.landingPage.id,
        accountId: input.landingPage.account_id,
        status: "draft",
      },
      planKey: input.configuration.planKey,
      servedTaxon: bindingCatalog.value.servedTaxon,
      generationProfile: {
        profileId: profile.profileId,
        ownerTaxonId: profile.ownerTaxonId,
        relation: profile.relation,
      },
      versions: {
        valuesInputCatalogVersion: LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION,
        bindingInputCatalogVersion: LANDING_PAGE_GENERATION_BINDING_CATALOG_VERSION,
        rootVersion: root.value.rootVersion,
        moduleCatalogVersion: identities.moduleCatalogVersion,
        generationProfileVersion: profile.profileVersion,
        research: input.research.value.versions,
      },
      root: root.value,
      presentation: {
        brandColorPalette,
        ...(requiresPrivacyPolicy && typeof privacyPolicyUrl === "string"
          ? { privacyPolicyUrl }
          : {}),
      },
      selection,
      modules,
    },
    partB: {
      research: authorizedResearch,
      facts,
      capabilitySupport: capabilityFieldKeys.length > 0
        ? [{ slotKey: "applicable_capabilities", fieldKeys: capabilityFieldKeys }]
        : [],
      ...(profile.generationGuidance === undefined
        ? {}
        : { generationGuidance: profile.generationGuidance }),
      modules: modules.map((selectedModule) => {
        const recommendation = profile.recommendations.find(
          (item) => item.recommendedOrder === selectedModule.recommendedOrder,
        );
        const resolved = resolvedByVariant.get(selectedModule.effectiveVariantKey) as ResolvedLandingPageModuleCatalog;
        return {
          moduleKey: selectedModule.module.moduleKey,
          effectiveVariantKey: selectedModule.effectiveVariantKey,
          ...(recommendation?.itemGuidance
            ? { itemGuidance: recommendation.itemGuidance }
            : {}),
          funnelCopyProfile: resolved.funnelCopyProfile,
        };
      }),
    },
  });
}

function isMinimumCompilerInput(
  value: unknown,
): value is CompileLandingPageGenerationContextInput {
  if (!isRecord(value)) return false;
  const landingPage = value.landingPage;
  const configuration = value.configuration;
  const research = value.research;
  const generationProfile = value.generationProfile;
  return (
    isRecord(landingPage) &&
    isRecord(configuration) &&
    Array.isArray(configuration.fields) &&
    Array.isArray(configuration.missingRequiredFieldKeys) &&
    isRecord(configuration.taxonChain) &&
    isRecord(research) &&
    typeof research.ok === "boolean" &&
    isRecord(generationProfile) &&
    typeof generationProfile.ok === "boolean"
  );
}

function authorizeResearch(
  research: ResolvedLandingPageResearch,
  modules: readonly LandingPageGenerationSelectedModule[],
  resolvedByVariant: ReadonlyMap<string, ResolvedLandingPageModuleCatalog>,
): ResolvedLandingPageResearch {
  const authorizedKeys = new Set<string>();
  for (const selectedModule of modules) {
    collectResearchItemKeys(selectedModule.fieldContract.fields, authorizedKeys);
    const resolved = resolvedByVariant.get(selectedModule.effectiveVariantKey);
    for (const itemKey of resolved?.funnelCopyProfile.prioritizedSources ?? []) {
      authorizedKeys.add(itemKey);
    }
  }
  return {
    ...research,
    endCustomer: {
      ...research.endCustomer,
      researches: research.endCustomer.researches
        .map((parent) => ({
          ...parent,
          items: parent.items.filter((item) => authorizedKeys.has(item.itemKey)),
        }))
        .filter((parent) => parent.items.length > 0),
    },
    businessBuyer: { ...research.businessBuyer, researches: [] },
  };
}

function catalogsAreStructurallyCompatible(
  values: readonly AccountLandingPageOnboardingFieldState[],
  bindings: readonly ResolvedLandingPageInputField[],
): boolean {
  if (values.length !== bindings.length) return false;
  return values.every((state, index) => {
    const { capabilityBindings: _bindingMetadata, ...bindingField } = bindings[index];
    const { capabilityBindings: _valueMetadata, ...valueField } = state.field;
    return JSON.stringify(valueField) === JSON.stringify(bindingField);
  });
}

function configuredValue(
  fields: readonly AccountLandingPageOnboardingFieldState[],
  fieldKey: string,
): unknown {
  const state = fields.find((candidate) => candidate.field.fieldKey === fieldKey);
  return state?.applicable && state.source !== "missing" ? state.value : undefined;
}

function resolveBrandColorPalette(
  fields: readonly AccountLandingPageOnboardingFieldState[],
): LandingPageBrandColorPalette | null {
  const value = configuredValue(fields, "brand_color_palette");
  if (!validateStarterColorPalette(value).ok || !isRecord(value)) return null;
  return {
    primary: String(value.primary),
    secondary: String(value.secondary),
    accent: String(value.accent),
    background: String(value.background),
    text: String(value.text),
  };
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function variantNameFromIdentity(moduleKey: string, variantKey: string): string | null {
  const prefix = `${moduleKey}.`;
  if (!variantKey.startsWith(prefix) || variantKey.length === prefix.length) return null;
  return variantKey.slice(prefix.length);
}

function variantIsEligible(
  resolved: ResolvedLandingPageModuleCatalog,
  fields: readonly AccountLandingPageOnboardingFieldState[],
): boolean {
  for (const interaction of resolved.variant.interactionContracts) {
    if (interaction.kind !== "form") continue;
    if (
      configuredValue(fields, interaction.operationalBinding.inputCatalogFieldKey) !==
        interaction.operationalBinding.requiredValue ||
      configuredValue(fields, interaction.consent.privacyPolicyInputFieldKey) === undefined
    ) {
      return false;
    }
  }
  return resolved.fieldContract.fields.every((field) => fieldHasRequiredSupport(field, fields));
}

function fieldHasRequiredSupport(
  field: LandingPageFieldDefinition,
  fields: readonly AccountLandingPageOnboardingFieldState[],
): boolean {
  if (field.fieldKind === "collection") {
    return field.itemFields.every((item) => fieldHasRequiredSupport(item, fields));
  }
  if (
    field.fieldKind === "text" &&
    field.policy === "operational_required" &&
    field.copySourceMap.sourceMode === "operational_evidence"
  ) {
    return configuredValue(fields, field.copySourceMap.evidencePath) !== undefined;
  }
  return true;
}

function collectReferencedInputKeys(
  fields: readonly LandingPageFieldDefinition[],
  target: Set<string>,
): void {
  for (const field of fields) {
    if (field.fieldKind === "collection") {
      collectReferencedInputKeys(field.itemFields, target);
      continue;
    }
    if (field.fieldKind === "action") {
      target.add(field.operationalBinding);
      continue;
    }
    if (field.fieldKind !== "text") continue;
    if (field.copySourceMap.sourceMode === "operational_evidence") {
      target.add(field.copySourceMap.evidencePath);
    }
  }
}

function collectResearchItemKeys(
  fields: readonly LandingPageFieldDefinition[],
  target: Set<string>,
): void {
  for (const field of fields) {
    if (field.fieldKind === "collection") {
      collectResearchItemKeys(field.itemFields, target);
      continue;
    }
    const textField = field.fieldKind === "action" ? field.label : field;
    if (textField.fieldKind !== "text") continue;
    const source = textField.copySourceMap;
    if (source.sourceMode === "operational_evidence") continue;
    for (const itemKey of source.primaryItemKeys) {
      if (itemKey) target.add(itemKey);
    }
    if (source.auxiliaryItemKey) target.add(source.auxiliaryItemKey);
  }
}

function hasInvalidRecommendationOrder(
  recommendations: readonly { recommendedOrder: number; moduleKey: string }[],
): boolean {
  const seenOrder = new Set<number>();
  const seenModules = new Set<string>();
  let previous = Number.NEGATIVE_INFINITY;
  for (const recommendation of recommendations) {
    if (
      !Number.isInteger(recommendation.recommendedOrder) ||
      recommendation.recommendedOrder <= previous ||
      seenOrder.has(recommendation.recommendedOrder) ||
      seenModules.has(recommendation.moduleKey)
    ) return true;
    previous = recommendation.recommendedOrder;
    seenOrder.add(recommendation.recommendedOrder);
    seenModules.add(recommendation.moduleKey);
  }
  return recommendations.length === 0;
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

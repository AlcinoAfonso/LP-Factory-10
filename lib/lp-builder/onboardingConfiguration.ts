import {
  landingPageInputColorPaletteRoles,
  parseLandingPageOfferingScope,
  projectLegacyLandingPageOfferingScope,
  resolveLandingPageInputCatalog,
  resolveLandingPageInputCatalogFromRegistry,
  validateLandingPageInputValue,
  type LandingPageInputCatalogPlan,
  type LandingPageInputCatalogRegistry,
  type LandingPageInputCatalogTaxonChain,
  type LandingPageInputCondition,
  type ResolvedLandingPageInputCatalog,
  type ResolvedLandingPageInputField,
} from "../conversion-content/landing-page/input-catalog";
import type {
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingStoredValues,
} from "./contracts";

export type ResolveOnboardingConfigurationInput = Readonly<{
  accountId: string;
  landingPageId: string | null;
  catalogVersion: number;
  revision: number;
  planKey: LandingPageInputCatalogPlan | string;
  taxonChain: LandingPageInputCatalogTaxonChain;
  storedValues: AccountLandingPageOnboardingStoredValues;
  authoritativeValues: Readonly<Record<string, unknown>>;
  registry?: LandingPageInputCatalogRegistry;
}>;

export type ResolveOnboardingConfigurationResult =
  | Readonly<{
      ok: true;
      configuration: AccountLandingPageOnboardingConfiguration;
    }>
  | Readonly<{
      ok: false;
      error:
        | "CATALOG_UNAVAILABLE"
        | "INVALID_CONFIGURATION"
        | "INVALID_VALUES";
      fieldKey?: string;
    }>;

export function resolveAccountLandingPageOnboardingConfiguration(
  input: ResolveOnboardingConfigurationInput,
): ResolveOnboardingConfigurationResult {
  const catalogInput = {
    version: input.catalogVersion,
    plan: input.planKey,
    taxonChain: input.taxonChain,
  };
  const catalog = input.registry
    ? resolveLandingPageInputCatalogFromRegistry(catalogInput, input.registry)
    : resolveLandingPageInputCatalog(catalogInput);

  if (!catalog.ok) return { ok: false, error: "CATALOG_UNAVAILABLE" };

  const offeringScopeCandidate = classifyOfferingScopeCandidate(catalog.value);
  if (offeringScopeCandidate === "invalid") {
    return {
      ok: false,
      error: "INVALID_CONFIGURATION",
      fieldKey: "landing_page_offering_scope",
    };
  }
  const adaptedStoredValues = adaptLegacyOfferingScope(
    input.storedValues,
    offeringScopeCandidate === "compatible",
  );
  if (!adaptedStoredValues.ok) {
    return {
      ok: false,
      error: "INVALID_CONFIGURATION",
      fieldKey: adaptedStoredValues.fieldKey,
    };
  }

  const fieldsByKey = new Map(
    catalog.value.fields.map((field) => [field.fieldKey, field]),
  );
  const retiredFieldKeys = new Set(catalog.value.retiredFieldKeys);
  const canonicalStoredValues: Record<
    string,
    AccountLandingPageOnboardingStoredValues[string]
  > = {};
  const canonicalAuthoritativeValues: Record<string, unknown> = {};

  for (const [fieldKey, stored] of Object.entries(adaptedStoredValues.value)) {
    const field = fieldsByKey.get(fieldKey);
    if (retiredFieldKeys.has(fieldKey)) {
      if (!isStoredValue(stored)) {
        return { ok: false, error: "INVALID_CONFIGURATION", fieldKey };
      }
      continue;
    }
    if (!field || !isStoredValue(stored) || stored.scope !== field.valueScope) {
      return { ok: false, error: "INVALID_CONFIGURATION", fieldKey };
    }
    if (Object.hasOwn(input.authoritativeValues, fieldKey)) {
      return { ok: false, error: "INVALID_CONFIGURATION", fieldKey };
    }
    const canonicalValue = canonicalizeLandingPageInputValue(field, stored.value);
    if (!validateLandingPageInputValue(field, canonicalValue).ok) {
      return { ok: false, error: "INVALID_CONFIGURATION", fieldKey };
    }
    if (
      fieldKey === "brand_color_palette" &&
      !validateStarterColorPalette(canonicalValue).ok
    ) {
      return { ok: false, error: "INVALID_CONFIGURATION", fieldKey };
    }
    canonicalStoredValues[fieldKey] = {
      scope: stored.scope,
      value: canonicalValue,
    };
  }

  for (const [fieldKey, value] of Object.entries(input.authoritativeValues)) {
    const field = fieldsByKey.get(fieldKey);
    const canonicalValue = field
      ? canonicalizeLandingPageInputValue(field, value)
      : value;
    if (!field || !validateLandingPageInputValue(field, canonicalValue).ok) {
      return { ok: false, error: "INVALID_VALUES", fieldKey };
    }
    if (
      fieldKey === "brand_color_palette" &&
      !validateStarterColorPalette(canonicalValue).ok
    ) {
      return { ok: false, error: "INVALID_VALUES", fieldKey };
    }
    canonicalAuthoritativeValues[fieldKey] = canonicalValue;
  }

  const effectiveValues: Record<string, unknown> = {};
  const sourceByFieldKey = new Map<
    string,
    "authoritative" | "configuration"
  >();

  for (const field of catalog.value.fields) {
    if (Object.hasOwn(canonicalAuthoritativeValues, field.fieldKey)) {
      effectiveValues[field.fieldKey] = canonicalAuthoritativeValues[field.fieldKey];
      sourceByFieldKey.set(field.fieldKey, "authoritative");
      continue;
    }
    if (Object.hasOwn(canonicalStoredValues, field.fieldKey)) {
      effectiveValues[field.fieldKey] = canonicalStoredValues[field.fieldKey].value;
      sourceByFieldKey.set(field.fieldKey, "configuration");
    }
  }

  const fields = catalog.value.fields.map((field) => {
    const applicable = conditionMatches(field.applicableWhen, effectiveValues);
    const required =
      applicable &&
      (field.obligation === "required" ||
        (field.obligation === "conditional" &&
          conditionMatches(field.requiredWhen, effectiveValues)));
    const source = sourceByFieldKey.get(field.fieldKey) ?? "missing";

    return {
      field,
      source,
      ...(source === "missing"
        ? {}
        : { value: effectiveValues[field.fieldKey] }),
      applicable,
      required,
    } as const;
  });

  const missingRequiredFieldKeys = fields
    .filter((field) => field.required && field.source === "missing")
    .map((field) => field.field.fieldKey);

  return {
    ok: true,
    configuration: deepFreeze({
      accountId: input.accountId,
      landingPageId: input.landingPageId,
      catalogVersion: input.catalogVersion,
      revision: input.revision,
      planKey: catalog.value.plan,
      taxonChain: input.taxonChain,
      storedValues: cloneJson(canonicalStoredValues),
      fields,
      missingRequiredFieldKeys,
      complete: missingRequiredFieldKeys.length === 0,
    }),
  };
}

function canonicalizeLandingPageInputValue(
  field: ResolvedLandingPageInputField,
  value: unknown,
): unknown {
  switch (field.valueType) {
    case "string":
    case "phone":
    case "email":
    case "url":
    case "enum":
      return typeof value === "string" ? value.trim() : value;
    case "string_list":
      return Array.isArray(value)
        ? value.map((item) => (typeof item === "string" ? item.trim() : item))
        : value;
    case "keyword_map":
      return Array.isArray(value)
        ? value.map((item) => {
            if (!isPlainRecord(item)) return item;
            return {
              ...item,
              ...(typeof item.keyword_or_cluster === "string"
                ? { keyword_or_cluster: item.keyword_or_cluster.trim() }
                : {}),
              ...(typeof item.message_anchor === "string"
                ? { message_anchor: item.message_anchor.trim() }
                : {}),
              ...(typeof item.ad_context === "string"
                ? { ad_context: item.ad_context.trim() }
                : {}),
            };
          })
        : value;
    case "asset_reference":
      return isPlainRecord(value) && typeof value.asset_id === "string"
        ? { asset_id: value.asset_id.trim() }
        : value;
    case "color_palette":
      return isPlainRecord(value)
        ? Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
              key,
              typeof item === "string" ? item.toLowerCase() : item,
            ]),
          )
        : value;
    case "offering_scope": {
      const parsed = parseLandingPageOfferingScope(value);
      return parsed.ok ? parsed.value : value;
    }
    case "boolean":
    case "number_range":
      return value;
  }
}

function adaptLegacyOfferingScope(
  storedValues: AccountLandingPageOnboardingStoredValues,
  compatibleCandidate: boolean,
):
  | Readonly<{ ok: true; value: AccountLandingPageOnboardingStoredValues }>
  | Readonly<{ ok: false; fieldKey: string }> {
  if (!compatibleCandidate) {
    return { ok: true, value: storedValues };
  }

  const adapted: Record<string, AccountLandingPageOnboardingStoredValues[string]> = {
    ...storedValues,
  };
  const legacyScope = storedValues.primary_service_or_offer;
  if (legacyScope !== undefined) {
    if (!isStoredValue(legacyScope) || legacyScope.scope !== "offer") {
      return { ok: false, fieldKey: "primary_service_or_offer" };
    }
    const projected = projectLegacyLandingPageOfferingScope(legacyScope.value);
    if (!projected.ok) {
      return { ok: false, fieldKey: "primary_service_or_offer" };
    }
    if (adapted.landing_page_offering_scope === undefined) {
      adapted.landing_page_offering_scope = {
        scope: "landing_page",
        value: projected.value,
      };
    }
  }

  const legacyDescription = storedValues.primary_service_or_offer_description;
  if (legacyDescription !== undefined) {
    if (
      !isStoredValue(legacyDescription) ||
      legacyDescription.scope !== "offer" ||
      typeof legacyDescription.value !== "string" ||
      legacyDescription.value.trim().length === 0
    ) {
      return { ok: false, fieldKey: "primary_service_or_offer_description" };
    }
    if (adapted.landing_page_offering_scope_description === undefined) {
      adapted.landing_page_offering_scope_description = {
        scope: "landing_page",
        value: legacyDescription.value.trim(),
      };
    }
  }

  return { ok: true, value: adapted };
}

function classifyOfferingScopeCandidate(
  catalog: ResolvedLandingPageInputCatalog,
): "none" | "compatible" | "invalid" {
  const retired = new Set(catalog.retiredFieldKeys);
  const scope = catalog.fields.find(
    (field) => field.fieldKey === "landing_page_offering_scope",
  );
  const description = catalog.fields.find(
    (field) => field.fieldKey === "landing_page_offering_scope_description",
  );
  const hasCandidateSignal =
    retired.has("primary_service_or_offer") ||
    retired.has("primary_service_or_offer_description") ||
    scope !== undefined ||
    description !== undefined;
  if (!hasCandidateSignal) return "none";

  const compatible =
    retired.has("primary_service_or_offer") &&
    retired.has("primary_service_or_offer_description") &&
    scope?.valueType === "offering_scope" &&
    scope.validation.kind === "offering_scope" &&
    scope.valueScope === "landing_page" &&
    scope.expectedValueOrigin === "landing_page_provided" &&
    scope.obligation === "required" &&
    description?.valueType === "string" &&
    description.validation.kind === "type_only" &&
    description.valueScope === "landing_page" &&
    description.expectedValueOrigin === "landing_page_provided" &&
    description.obligation === "required";
  return compatible ? "compatible" : "invalid";
}

export function stripAuthoritativeOnboardingValues(
  storedValues: AccountLandingPageOnboardingStoredValues,
  authoritativeValues: Readonly<Record<string, unknown>>,
): AccountLandingPageOnboardingStoredValues {
  return Object.fromEntries(
    Object.entries(storedValues).filter(
      ([fieldKey]) => !Object.hasOwn(authoritativeValues, fieldKey),
    ),
  );
}

export function isAccountLandingPageOnboardingActorAuthorized(input: {
  role: unknown;
  status: unknown;
}): boolean {
  return (
    input.status === "active" &&
    (input.role === "owner" || input.role === "admin")
  );
}

export function isUnavailableOnboardingConfigurationError(
  error: unknown,
): boolean {
  if (!error || typeof error !== "object" || Array.isArray(error)) return false;
  const record = error as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  const message = typeof record.message === "string" ? record.message : "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /schema cache|does not exist|could not find the table|relation .* does not exist/i.test(
      message,
    )
  );
}

export type StarterColorPaletteValidationResult =
  | Readonly<{
      ok: true;
      contrast: Readonly<{
        text: number;
        primary: number;
        secondary: number;
        accent: number;
      }>;
    }>
  | Readonly<{
      ok: false;
      error:
        | "INVALID_FORMAT"
        | "INSUFFICIENT_TEXT_CONTRAST"
        | "INSUFFICIENT_ROLE_CONTRAST";
    }>;

export function validateStarterColorPalette(
  value: unknown,
): StarterColorPaletteValidationResult {
  if (!isPlainRecord(value)) return { ok: false, error: "INVALID_FORMAT" };
  const keys = Object.keys(value);
  if (
    keys.length !== landingPageInputColorPaletteRoles.length ||
    keys.some(
      (key) =>
        !landingPageInputColorPaletteRoles.includes(
          key as (typeof landingPageInputColorPaletteRoles)[number],
        ),
    ) ||
    !landingPageInputColorPaletteRoles.every(
      (role) =>
        typeof value[role] === "string" &&
        /^#[0-9a-f]{6}$/i.test(value[role]),
    )
  ) {
    return { ok: false, error: "INVALID_FORMAT" };
  }

  const background = value.background as string;
  const rawContrast = {
    text: contrastRatio(value.text as string, background),
    primary: contrastRatio(value.primary as string, background),
    secondary: contrastRatio(value.secondary as string, background),
    accent: contrastRatio(value.accent as string, background),
  };
  if (rawContrast.text < 4.5) {
    return { ok: false, error: "INSUFFICIENT_TEXT_CONTRAST" };
  }
  if (
    rawContrast.primary < 3 ||
    rawContrast.secondary < 3 ||
    rawContrast.accent < 3
  ) {
    return { ok: false, error: "INSUFFICIENT_ROLE_CONTRAST" };
  }
  const contrast = Object.fromEntries(
    Object.entries(rawContrast).map(([role, ratio]) => [
      role,
      Number(ratio.toFixed(2)),
    ]),
  ) as { text: number; primary: number; secondary: number; accent: number };
  return { ok: true, contrast: deepFreeze(contrast) };
}

function conditionMatches(
  condition: LandingPageInputCondition | undefined,
  values: Readonly<Record<string, unknown>>,
): boolean {
  if (!condition) return true;
  if (!Object.hasOwn(values, condition.fieldKey)) return false;

  const actual = values[condition.fieldKey];
  if (condition.operator === "equals") return actual === condition.value;
  if (!Array.isArray(condition.value)) return false;
  return condition.value.includes(actual as never);
}

function isStoredValue(
  value: unknown,
): value is AccountLandingPageOnboardingStoredValues[string] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 2 &&
    Object.hasOwn(record, "scope") &&
    Object.hasOwn(record, "value") &&
    ["account", "business", "offer", "campaign", "landing_page"].includes(
      String(record.scope),
    )
  );
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function isPlainRecord(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

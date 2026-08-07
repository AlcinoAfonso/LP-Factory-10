import {
  resolveLandingPageInputCatalog,
  validateLandingPageInputValue,
  type LandingPageInputCatalogPlan,
  type LandingPageInputCatalogTaxonChain,
  type LandingPageInputCondition,
} from "../conversion-content/landing-page/input-catalog";
import type {
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingStoredValues,
} from "./contracts";

type ResolveOnboardingConfigurationInput = Readonly<{
  accountId: string;
  landingPageId: string | null;
  catalogVersion: number;
  revision: number;
  planKey: LandingPageInputCatalogPlan | string;
  taxonChain: LandingPageInputCatalogTaxonChain;
  storedValues: AccountLandingPageOnboardingStoredValues;
  authoritativeValues: Readonly<Record<string, unknown>>;
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
  const catalog = resolveLandingPageInputCatalog({
    version: input.catalogVersion,
    plan: input.planKey,
    taxonChain: input.taxonChain,
  });

  if (!catalog.ok) return { ok: false, error: "CATALOG_UNAVAILABLE" };

  const fieldsByKey = new Map(
    catalog.value.fields.map((field) => [field.fieldKey, field]),
  );

  for (const [fieldKey, stored] of Object.entries(input.storedValues)) {
    const field = fieldsByKey.get(fieldKey);
    if (!field || !isStoredValue(stored) || stored.scope !== field.valueScope) {
      return { ok: false, error: "INVALID_CONFIGURATION", fieldKey };
    }
    if (Object.hasOwn(input.authoritativeValues, fieldKey)) {
      return { ok: false, error: "INVALID_CONFIGURATION", fieldKey };
    }
    if (!validateLandingPageInputValue(field, stored.value).ok) {
      return { ok: false, error: "INVALID_CONFIGURATION", fieldKey };
    }
  }

  for (const [fieldKey, value] of Object.entries(input.authoritativeValues)) {
    const field = fieldsByKey.get(fieldKey);
    if (!field || !validateLandingPageInputValue(field, value).ok) {
      return { ok: false, error: "INVALID_VALUES", fieldKey };
    }
  }

  const effectiveValues: Record<string, unknown> = {};
  const sourceByFieldKey = new Map<
    string,
    "authoritative" | "configuration"
  >();

  for (const field of catalog.value.fields) {
    if (Object.hasOwn(input.authoritativeValues, field.fieldKey)) {
      effectiveValues[field.fieldKey] = input.authoritativeValues[field.fieldKey];
      sourceByFieldKey.set(field.fieldKey, "authoritative");
      continue;
    }
    if (Object.hasOwn(input.storedValues, field.fieldKey)) {
      effectiveValues[field.fieldKey] = input.storedValues[field.fieldKey].value;
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
      storedValues: cloneJson(input.storedValues),
      fields,
      missingRequiredFieldKeys,
      complete: missingRequiredFieldKeys.length === 0,
    }),
  };
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

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

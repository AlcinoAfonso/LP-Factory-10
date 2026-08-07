import type {
  CommercialCapabilityDefinition,
  CommercialCapabilityRegistry,
  CommercialCapabilityResolutionErrorCode,
  CommercialCapabilityValue,
  ResolveCommercialCapabilityInput,
  ResolveCommercialCapabilityResult,
} from "./contracts";
import { commercialCapabilityRegistry } from "./registry";

const STABLE_KEY_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

type RegistryValidationResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      code: "INVALID_REGISTRY" | "INVALID_CAPABILITY_VALUE";
      message: string;
    }>;

export function resolveCommercialCapability(
  input: unknown,
): ResolveCommercialCapabilityResult {
  return resolveCommercialCapabilityFromRegistry(
    input,
    commercialCapabilityRegistry,
  );
}

export function resolveCommercialCapabilityFromRegistry(
  input: unknown,
  registry: unknown,
): ResolveCommercialCapabilityResult {
  if (!isResolveInput(input)) {
    return failure("INVALID_INPUT", "Commercial capability input is invalid.");
  }

  const registryValidation = validateCommercialCapabilityRegistry(registry);
  if (!registryValidation.ok) {
    return failure(registryValidation.code, registryValidation.message);
  }

  const validRegistry = registry as CommercialCapabilityRegistry;
  const plan = validRegistry.plans.find(
    (candidate) => candidate.planKey === input.planKey,
  );
  if (!plan) {
    return failure("UNKNOWN_PLAN", "Commercial capability plan is unknown.");
  }

  const definition = validRegistry.definitions.find(
    (candidate) => candidate.key === input.capabilityKey,
  );
  if (!definition) {
    return failure(
      "UNKNOWN_CAPABILITY",
      "Commercial capability is unknown.",
    );
  }

  const assignment = plan.capabilities.find(
    (candidate) => candidate.capabilityKey === input.capabilityKey,
  );
  if (!assignment) {
    return failure(
      "CAPABILITY_NOT_ASSIGNED",
      "Commercial capability is not assigned to this plan.",
    );
  }

  return {
    ok: true,
    value: deepFreeze(
      structuredClone({
        planKey: plan.planKey,
        definition,
        value: assignment.value,
      }),
    ),
  };
}

export function validateCommercialCapabilityRegistry(
  registry: unknown,
): RegistryValidationResult {
  if (!isExactRecord(registry, ["definitions", "plans"])) {
    return invalidRegistry("Commercial capability registry shape is invalid.");
  }
  if (!Array.isArray(registry.definitions) || !Array.isArray(registry.plans)) {
    return invalidRegistry("Commercial capability registry collections are invalid.");
  }

  const definitions = new Map<string, CommercialCapabilityDefinition>();
  for (const candidate of registry.definitions) {
    if (!isCommercialCapabilityDefinition(candidate)) {
      return invalidRegistry("Commercial capability definition is invalid.");
    }
    if (definitions.has(candidate.key)) {
      return invalidRegistry("Commercial capability keys must be unique.");
    }
    definitions.set(candidate.key, candidate);
  }

  const planKeys = new Set<string>();
  for (const plan of registry.plans) {
    if (!isExactRecord(plan, ["planKey", "capabilities"])) {
      return invalidRegistry("Commercial capability plan shape is invalid.");
    }
    if (!isStableKey(plan.planKey) || !Array.isArray(plan.capabilities)) {
      return invalidRegistry("Commercial capability plan is invalid.");
    }
    if (planKeys.has(plan.planKey)) {
      return invalidRegistry("Commercial capability plan keys must be unique.");
    }
    planKeys.add(plan.planKey);

    const assignedKeys = new Set<string>();
    for (const assignment of plan.capabilities) {
      if (!isExactRecord(assignment, ["capabilityKey", "value"])) {
        return invalidRegistry("Commercial capability assignment shape is invalid.");
      }
      if (!isStableKey(assignment.capabilityKey)) {
        return invalidRegistry("Commercial capability assignment key is invalid.");
      }
      if (assignedKeys.has(assignment.capabilityKey)) {
        return invalidRegistry(
          "Commercial capability assignments must be unique per plan.",
        );
      }
      assignedKeys.add(assignment.capabilityKey);

      const definition = definitions.get(assignment.capabilityKey);
      if (!definition) {
        return invalidRegistry(
          "Commercial capability assignment references an unknown definition.",
        );
      }
      if (!isValueValidForDefinition(definition, assignment.value)) {
        return {
          ok: false,
          code: "INVALID_CAPABILITY_VALUE",
          message: "Commercial capability assignment value is invalid.",
        };
      }
    }
  }

  return { ok: true };
}

function isResolveInput(value: unknown): value is ResolveCommercialCapabilityInput {
  return (
    isExactRecord(value, ["planKey", "capabilityKey"]) &&
    isStableKey(value.planKey) &&
    isStableKey(value.capabilityKey)
  );
}

function isCommercialCapabilityDefinition(
  value: unknown,
): value is CommercialCapabilityDefinition {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  const commonKeys = [
    "key",
    "name",
    "description",
    "category",
    "consumerDomain",
    "type",
  ];
  if (
    !isStableKey(value.key) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.description) ||
    !isStableKey(value.category) ||
    !isStableKey(value.consumerDomain)
  ) {
    return false;
  }

  if (value.type === "boolean") {
    return hasExactKeys(value, commonKeys);
  }
  if (value.type === "closed_level") {
    return (
      hasExactKeys(value, [...commonKeys, "allowedValues"]) &&
      Array.isArray(value.allowedValues) &&
      value.allowedValues.length > 0 &&
      value.allowedValues.every(isStableKey) &&
      new Set(value.allowedValues).size === value.allowedValues.length
    );
  }
  if (value.type === "numeric_limit") {
    const allowedKeys = value.unlimitedValue === undefined
      ? [...commonKeys, "unit"]
      : [...commonKeys, "unit", "unlimitedValue"];
    return (
      hasExactKeys(value, allowedKeys) &&
      isStableKey(value.unit) &&
      (value.unlimitedValue === undefined || value.unlimitedValue === -1)
    );
  }

  return false;
}

function isValueValidForDefinition(
  definition: CommercialCapabilityDefinition,
  value: unknown,
): value is CommercialCapabilityValue {
  if (definition.type === "boolean") return typeof value === "boolean";
  if (definition.type === "closed_level") {
    return (
      typeof value === "string" && definition.allowedValues.includes(value)
    );
  }

  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    (value >= 0 || (value === -1 && definition.unlimitedValue === -1))
  );
}

function isStableKey(value: unknown): value is string {
  return typeof value === "string" && STABLE_KEY_PATTERN.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> {
  return isRecord(value) && hasExactKeys(value, expectedKeys);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  return (
    actualKeys.length === sortedExpectedKeys.length &&
    actualKeys.every((key, index) => key === sortedExpectedKeys[index])
  );
}

function invalidRegistry(message: string): RegistryValidationResult {
  return { ok: false, code: "INVALID_REGISTRY", message };
}

function failure(
  code: CommercialCapabilityResolutionErrorCode,
  message: string,
): ResolveCommercialCapabilityResult {
  return { ok: false, error: { code, message } };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }

  return value;
}

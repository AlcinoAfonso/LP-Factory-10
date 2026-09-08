export const CONTRACT_VERSION = "1";

export const OPERATIONS = Object.freeze([
  "signup",
  "create_user",
  "create_account",
  "verify_entitlement",
  "invite",
  "confirm",
  "recover",
  "verify_role_state",
]);

export const COMMERCIAL_CONDITIONS = Object.freeze([
  "client",
  "non_client",
  "not_applicable",
]);

export const STATE_MATCH_FIELDS = Object.freeze([
  "identity",
  "purpose",
  "environment",
  "account",
  "tenant",
  "role",
  "status",
  "platformAuthority",
  "commercialCondition",
  "lifecycle",
  "capabilities",
]);

const SENSITIVE_KEY = /(^|_)(password|secret|token|cookie|session|code|signed_url|mailbox_content|raw_message|authorization)($|_)/i;
const OPAQUE_REFERENCE_KEYS = new Set(["credentialRef", "mailboxRef"]);

export class ContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ContractError";
    this.code = code;
  }
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}

function assertObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContractError("invalid_contract", `${field} must be an object`);
  }
}

function assertExactKeys(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new ContractError("invalid_contract", `${field}.${key} is not allowed`);
    }
  }
}

function assertText(value, field, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (typeof value !== "string" || value.trim() === "" || value.length > 240) {
    throw new ContractError("invalid_contract", `${field} must be non-empty text up to 240 characters`);
  }
}

function assertStringArray(value, field, allowedValues) {
  if (!Array.isArray(value) || value.length === 0 || new Set(value).size !== value.length) {
    throw new ContractError("invalid_contract", `${field} must be a non-empty array without duplicates`);
  }
  for (const item of value) {
    assertText(item, field);
    if (allowedValues && !allowedValues.includes(item)) {
      throw new ContractError("invalid_contract", `${field} contains an unsupported value`);
    }
  }
}

export function assertNoSensitiveKeys(value, field = "input") {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key) && !OPAQUE_REFERENCE_KEYS.has(key)) {
      throw new ContractError("sensitive_field_rejected", `${field}.${key} is forbidden`);
    }
    assertNoSensitiveKeys(nested, `${field}.${key}`);
  }
}

export function validateRequiredState(value, field = "requiredState") {
  assertObject(value, field);
  const keys = [
    "identity",
    "purpose",
    "environment",
    "account",
    "tenant",
    "role",
    "status",
    "platformAuthority",
    "commercialCondition",
    "lifecycle",
    "capabilities",
  ];
  assertExactKeys(value, keys, field);
  for (const key of ["identity", "purpose", "environment", "role", "status", "lifecycle"]) {
    assertText(value[key], `${field}.${key}`);
  }
  assertText(value.account, `${field}.account`, { nullable: true });
  assertText(value.tenant, `${field}.tenant`, { nullable: true });
  if (typeof value.platformAuthority !== "boolean") {
    throw new ContractError("invalid_contract", `${field}.platformAuthority must be boolean`);
  }
  if (!COMMERCIAL_CONDITIONS.includes(value.commercialCondition)) {
    throw new ContractError("invalid_contract", `${field}.commercialCondition is unsupported`);
  }
  assertStringArray(value.capabilities, `${field}.capabilities`, OPERATIONS);
  return deepFreeze(structuredClone(value));
}

function validateFixtureChange(value) {
  if (value === null) return null;
  assertObject(value, "fixtureChange");
  assertExactKeys(
    value,
    ["mode", "adapterOperation", "idempotency", "previousState", "postcondition", "stableEndState"],
    "fixtureChange",
  );
  if (!["create", "reconfigure"].includes(value.mode)) {
    throw new ContractError("invalid_fixture_change", "fixtureChange.mode must be create or reconfigure");
  }
  if (!OPERATIONS.includes(value.adapterOperation)) {
    throw new ContractError("invalid_fixture_change", "fixtureChange.adapterOperation must be registered");
  }
  if (value.idempotency !== "exact_required_state") {
    throw new ContractError("invalid_fixture_change", "fixtureChange.idempotency must be exact_required_state");
  }
  if (value.mode === "reconfigure") validateRequiredState(value.previousState, "fixtureChange.previousState");
  if (value.mode === "create" && value.previousState !== null) {
    throw new ContractError("invalid_fixture_change", "create requires previousState to be null");
  }
  if (value.postcondition !== "required_state_exact") {
    throw new ContractError("invalid_fixture_change", "fixtureChange.postcondition must be required_state_exact");
  }
  validateRequiredState(value.stableEndState, "fixtureChange.stableEndState");
  return deepFreeze(structuredClone(value));
}

export function validateScenario(value) {
  assertObject(value, "scenario");
  assertNoSensitiveKeys(value, "scenario");
  assertExactKeys(
    value,
    [
      "contractVersion",
      "criterion",
      "scenario",
      "environment",
      "requiredState",
      "operations",
      "forbiddenOperations",
      "finalState",
      "maxAttempts",
      "fixtureChange",
    ],
    "scenario",
  );
  if (value.contractVersion !== CONTRACT_VERSION) {
    throw new ContractError("unsupported_contract_version", "contractVersion is unsupported");
  }
  for (const key of ["criterion", "scenario", "environment", "finalState"]) {
    assertText(value[key], `scenario.${key}`);
  }
  const requiredState = validateRequiredState(value.requiredState);
  if (requiredState.environment !== value.environment) {
    throw new ContractError("environment_mismatch", "scenario and required state environments must match exactly");
  }
  assertStringArray(value.operations, "scenario.operations", OPERATIONS);
  if (!Array.isArray(value.forbiddenOperations) || new Set(value.forbiddenOperations).size !== value.forbiddenOperations.length) {
    throw new ContractError("invalid_contract", "scenario.forbiddenOperations must be an array without duplicates");
  }
  for (const operation of value.forbiddenOperations) {
    if (!OPERATIONS.includes(operation)) {
      throw new ContractError("invalid_contract", "scenario.forbiddenOperations contains an unsupported value");
    }
    if (value.operations.includes(operation)) {
      throw new ContractError("operation_conflict", "an operation cannot be both allowed and forbidden");
    }
  }
  if (!Number.isInteger(value.maxAttempts) || value.maxAttempts < 1 || value.maxAttempts > 3) {
    throw new ContractError("invalid_attempt_limit", "scenario.maxAttempts must be an integer from 1 to 3");
  }
  const fixtureChange = validateFixtureChange(value.fixtureChange);
  if (fixtureChange && !value.operations.includes(fixtureChange.adapterOperation)) {
    throw new ContractError("invalid_fixture_change", "fixtureChange.adapterOperation must be allowed by the scenario");
  }
  if (fixtureChange && !statesEqual(fixtureChange.stableEndState, requiredState)) {
    throw new ContractError("fixture_state_mismatch", "fixtureChange.stableEndState must equal requiredState");
  }
  if (
    fixtureChange?.mode === "reconfigure" &&
    statesEqual(fixtureChange.previousState, fixtureChange.stableEndState)
  ) {
    throw new ContractError("invalid_fixture_change", "reconfiguration must change the exact fixture state");
  }
  if (fixtureChange?.mode === "reconfigure") {
    for (const field of ["identity", "purpose", "environment", "account", "tenant"]) {
      if (fixtureChange.previousState[field] !== requiredState[field]) {
        throw new ContractError(
          "fixture_identity_mismatch",
          `fixtureChange.previousState.${field} must identify the same fixture`,
        );
      }
    }
  }
  return deepFreeze({ ...structuredClone(value), requiredState, fixtureChange });
}

export function statesEqual(left, right) {
  return STATE_MATCH_FIELDS.every((field) => {
    if (field === "capabilities") {
      return left[field].length === right[field].length && left[field].every((item) => right[field].includes(item));
    }
    return left[field] === right[field];
  });
}

export function validateFixture(value, index = 0) {
  assertObject(value, `fixtures[${index}]`);
  assertNoSensitiveKeys(value, `fixtures[${index}]`);
  const keys = [
    "id",
    "identity",
    "email",
    "purpose",
    "environment",
    "account",
    "tenant",
    "role",
    "status",
    "platformAuthority",
    "commercialCondition",
    "lifecycle",
    "capabilities",
    "credentialRef",
    "mailboxRef",
  ];
  assertExactKeys(value, keys, `fixtures[${index}]`);
  for (const key of ["id", "identity", "email", "purpose", "environment", "role", "status", "lifecycle"]) {
    assertText(value[key], `fixtures[${index}].${key}`);
  }
  assertText(value.account, `fixtures[${index}].account`, { nullable: true });
  assertText(value.tenant, `fixtures[${index}].tenant`, { nullable: true });
  if (typeof value.platformAuthority !== "boolean") {
    throw new ContractError("invalid_contract", `fixtures[${index}].platformAuthority must be boolean`);
  }
  if (!COMMERCIAL_CONDITIONS.includes(value.commercialCondition)) {
    throw new ContractError("invalid_contract", `fixtures[${index}].commercialCondition is unsupported`);
  }
  assertStringArray(value.capabilities, `fixtures[${index}].capabilities`, OPERATIONS);
  for (const key of ["credentialRef", "mailboxRef"]) {
    if (value[key] !== null && (typeof value[key] !== "string" || !/^ref:[a-z0-9._:/-]+$/i.test(value[key]))) {
      throw new ContractError("invalid_opaque_reference", `fixtures[${index}].${key} must be null or an opaque ref`);
    }
  }
  return deepFreeze(structuredClone(value));
}

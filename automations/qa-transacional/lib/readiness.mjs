import { ContractError, deepFreeze } from "./contracts.mjs";

export const READINESS_CAPABILITIES = Object.freeze([
  "search",
  "read",
  "consume",
  "credential_resolution",
  "session_isolation",
]);

export const INITIAL_READINESS = deepFreeze({
  search: { available: false, consumerCount: 0, identityFunctional: null, environment: null, reason: "mailbox_consumer_missing" },
  read: { available: false, consumerCount: 0, identityFunctional: null, environment: null, reason: "mailbox_consumer_missing" },
  consume: { available: false, consumerCount: 0, identityFunctional: null, environment: null, reason: "mailbox_consumer_missing" },
  credential_resolution: { available: false, consumerCount: 0, identityFunctional: null, environment: null, reason: "credential_resolution_unproven" },
  session_isolation: { available: false, consumerCount: 0, identityFunctional: null, environment: null, reason: "session_isolation_unproven" },
});

export function validateReadinessSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new ContractError("invalid_readiness", "readiness must be an object");
  }
  for (const key of Object.keys(snapshot)) {
    if (!READINESS_CAPABILITIES.includes(key)) {
      throw new ContractError("invalid_readiness", `unsupported readiness field: ${key}`);
    }
  }
  const copy = {};
  for (const capability of READINESS_CAPABILITIES) {
    const value = snapshot[capability];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new ContractError("invalid_readiness", `${capability} readiness is missing`);
    }
    for (const key of Object.keys(value)) {
      if (!["available", "consumerCount", "identityFunctional", "environment", "reason"].includes(key)) {
        throw new ContractError("invalid_readiness", `${capability}.${key} is not allowed`);
      }
    }
    if (typeof value.available !== "boolean" || !Number.isInteger(value.consumerCount) || value.consumerCount < 0) {
      throw new ContractError("invalid_readiness", `${capability} readiness is malformed`);
    }
    if (value.available && value.consumerCount !== 1) {
      throw new ContractError("ambiguous_consumer", `${capability} requires exactly one authorized consumer`);
    }
    if (value.identityFunctional !== null && typeof value.identityFunctional !== "string") {
      throw new ContractError("invalid_readiness", `${capability}.identityFunctional is malformed`);
    }
    if (value.environment !== null && typeof value.environment !== "string") {
      throw new ContractError("invalid_readiness", `${capability}.environment is malformed`);
    }
    if (typeof value.reason !== "string" || value.reason.trim() === "") {
      throw new ContractError("invalid_readiness", `${capability}.reason is required`);
    }
    if (value.available && (!value.identityFunctional || !value.environment)) {
      throw new ContractError("invalid_readiness", `${capability} requires functional identity and environment`);
    }
    copy[capability] = structuredClone(value);
  }
  return deepFreeze(copy);
}

export function assessReadiness(requiredCapabilities, expectedEnvironment, snapshot = INITIAL_READINESS) {
  const safeSnapshot = validateReadinessSnapshot(snapshot);
  const required = [...new Set(requiredCapabilities)];
  for (const capability of required) {
    if (!READINESS_CAPABILITIES.includes(capability)) {
      throw new ContractError("invalid_readiness", `unsupported readiness capability: ${capability}`);
    }
  }
  const blockers = required.flatMap((capability) => {
    const current = safeSnapshot[capability];
    if (!current.available) return [{ capability, reason: current.reason }];
    if (current.environment !== expectedEnvironment) {
      return [{ capability, reason: "readiness_environment_mismatch" }];
    }
    return [];
  });
  return deepFreeze({ status: blockers.length ? "blocked" : "ready", required, blockers });
}

import assert from "node:assert/strict";
import test from "node:test";
import { ADAPTER_CONTRACTS, resolveAdapter } from "./lib/adapters/index.mjs";
import { createCatalog } from "./lib/catalog.mjs";
import { ContractError, OPERATIONS, validateScenario } from "./lib/contracts.mjs";
import { projectEvidence } from "./lib/evidence.mjs";
import {
  assessReadiness,
  INITIAL_READINESS,
  READINESS_CAPABILITIES,
  validateReadinessSnapshot,
} from "./lib/readiness.mjs";
import { selectFixture } from "./lib/selection.mjs";
import { executeScenario } from "./run.mjs";

const requiredState = Object.freeze({
  identity: "qa-viewer",
  purpose: "account-access",
  environment: "preview",
  account: "account-fixture",
  tenant: "tenant-fixture",
  role: "viewer",
  status: "active",
  platformAuthority: false,
  commercialCondition: "non_client",
  lifecycle: "stable",
  capabilities: ["verify_role_state"],
});

function fixture(overrides = {}) {
  return {
    id: "qa-viewer-01",
    identity: "qa-viewer",
    email: "qa-viewer@example.invalid",
    purpose: "account-access",
    environment: "preview",
    account: "account-fixture",
    tenant: "tenant-fixture",
    role: "viewer",
    status: "active",
    platformAuthority: false,
    commercialCondition: "non_client",
    lifecycle: "stable",
    capabilities: ["verify_role_state"],
    credentialRef: "ref:github/qa-viewer",
    mailboxRef: null,
    ...overrides,
  };
}

function scenario(overrides = {}) {
  return {
    contractVersion: "1",
    criterion: "viewer reads only the authorized account state",
    scenario: "verify viewer role",
    environment: "preview",
    requiredState: { ...requiredState },
    operations: ["verify_role_state"],
    forbiddenOperations: ["create_user", "create_account"],
    finalState: "fixture remains unchanged",
    maxAttempts: 2,
    fixtureChange: null,
    ...overrides,
  };
}

test("accepts and freezes a complete transactional contract", () => {
  const value = validateScenario(scenario());
  assert.equal(value.contractVersion, "1");
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.requiredState), true);
});

test("rejects unsupported contract versions and unknown fields", () => {
  assert.throws(() => validateScenario(scenario({ contractVersion: "2" })), /unsupported/);
  assert.throws(() => validateScenario({ ...scenario(), inferredAccount: true }), /not allowed/);
});

test("rejects sensitive fields before execution", () => {
  assert.throws(
    () => validateScenario({ ...scenario(), requiredState: { ...requiredState, password: "do-not-store" } }),
    (error) => error instanceof ContractError && error.code === "sensitive_field_rejected",
  );
});

test("requires exact environment and a bounded attempt limit", () => {
  assert.throws(() => validateScenario(scenario({ environment: "production" })), /environments must match/);
  assert.throws(() => validateScenario(scenario({ maxAttempts: 4 })), /from 1 to 3/);
});

test("keeps allowed and forbidden operations disjoint", () => {
  assert.throws(
    () => validateScenario(scenario({ forbiddenOperations: ["verify_role_state"] })),
    (error) => error instanceof ContractError && error.code === "operation_conflict",
  );
});

test("catalog represents roles, platform authority and commercial states without secrets", () => {
  const roles = ["owner", "admin", "editor", "viewer"];
  const catalog = createCatalog(
    roles.map((role, index) =>
      fixture({
        id: `qa-${role}`,
        identity: `qa-${role}`,
        email: `qa-${role}@example.invalid`,
        role,
        platformAuthority: role === "admin",
        commercialCondition: index % 2 === 0 ? "client" : "non_client",
      }),
    ),
  );
  assert.deepEqual(catalog.map((item) => item.role), roles);
  assert.equal(catalog.some((item) => item.platformAuthority), true);
  assert.deepEqual(new Set(catalog.map((item) => item.commercialCondition)), new Set(["client", "non_client"]));
});

test("catalog rejects duplicate ids and non-opaque references", () => {
  assert.throws(() => createCatalog([fixture(), fixture()]), /unique/);
  assert.throws(() => createCatalog([fixture({ credentialRef: "visible-value" })]), /opaque ref/);
});

test("selects exactly one capable fixture", () => {
  const selected = selectFixture([fixture()], requiredState);
  assert.equal(selected.status, "selected");
  assert.equal(selected.fixture.id, "qa-viewer-01");
});

test("fails closed for missing and ambiguous fixtures", () => {
  assert.equal(selectFixture([], requiredState).code, "fixture_missing");
  assert.equal(selectFixture([fixture(), fixture({ id: "qa-viewer-02" })], requiredState).code, "fixture_ambiguous");
});

test("rejects both incomplete and overprivileged capability sets", () => {
  const result = selectFixture([fixture({ capabilities: ["signup"] })], requiredState);
  assert.equal(result.code, "capability_mismatch");
  const overprivileged = selectFixture(
    [fixture({ capabilities: ["verify_role_state", "create_user"] })],
    requiredState,
  );
  assert.equal(overprivileged.code, "capability_mismatch");
});

test("creation and reconfiguration plans require mechanism and postcondition", () => {
  const createPlan = validateScenario(
    scenario({
      operations: ["create_user", "verify_role_state"],
      forbiddenOperations: ["create_account"],
      fixtureChange: {
        mode: "create",
        adapterOperation: "create_user",
        idempotency: "exact_required_state",
        previousState: null,
        postcondition: "required_state_exact",
        stableEndState: { ...requiredState },
      },
    }),
  );
  assert.equal(createPlan.fixtureChange.mode, "create");

  const reconfigurePlan = validateScenario(
    scenario({
      operations: ["create_user", "verify_role_state"],
      forbiddenOperations: ["create_account"],
      fixtureChange: {
        mode: "reconfigure",
        adapterOperation: "create_user",
        idempotency: "exact_required_state",
        previousState: { ...requiredState, status: "pending" },
        postcondition: "required_state_exact",
        stableEndState: { ...requiredState },
      },
    }),
  );
  assert.equal(reconfigurePlan.fixtureChange.previousState.status, "pending");

  assert.throws(
    () =>
      validateScenario(
        scenario({
          operations: ["create_user", "verify_role_state"],
          forbiddenOperations: ["create_account"],
          fixtureChange: {
            mode: "reconfigure",
            adapterOperation: "create_user",
            idempotency: "exact_required_state",
            previousState: { ...requiredState, environment: "production", status: "pending" },
            postcondition: "required_state_exact",
            stableEndState: { ...requiredState },
          },
        }),
      ),
    (error) => error instanceof ContractError && error.code === "fixture_identity_mismatch",
  );

  assert.throws(
    () =>
      validateScenario(
        scenario({
          operations: ["create_user", "verify_role_state"],
          forbiddenOperations: ["create_account"],
          fixtureChange: {
            mode: "create",
            adapterOperation: "create_user",
            idempotency: "exact_required_state",
            previousState: null,
            postcondition: "required_state_exact",
            stableEndState: { ...requiredState, role: "owner" },
          },
        }),
      ),
    (error) => error instanceof ContractError && error.code === "fixture_state_mismatch",
  );
});

test("readiness starts fail-closed with the three factual blockers", () => {
  const result = assessReadiness(
    ["search", "credential_resolution", "session_isolation"],
    "preview",
  );
  assert.equal(result.status, "blocked");
  assert.deepEqual(
    result.blockers.map((item) => item.reason),
    ["mailbox_consumer_missing", "credential_resolution_unproven", "session_isolation_unproven"],
  );
});

test("readiness blocks an otherwise available consumer from another environment", () => {
  const productionSnapshot = Object.fromEntries(
    READINESS_CAPABILITIES.map((capability) => [
      capability,
      {
        available: true,
        consumerCount: 1,
        identityFunctional: `consumer-${capability}`,
        environment: "production",
        reason: "ready",
      },
    ]),
  );
  const result = assessReadiness(
    ["credential_resolution", "session_isolation"],
    "preview",
    productionSnapshot,
  );
  assert.equal(result.status, "blocked");
  assert.deepEqual(
    result.blockers.map((item) => item.reason),
    ["readiness_environment_mismatch", "readiness_environment_mismatch"],
  );
});

test("readiness requires exactly one consumer for an available capability", () => {
  assert.throws(
    () => validateReadinessSnapshot({ ...INITIAL_READINESS, search: { ...INITIAL_READINESS.search, available: true, consumerCount: 2 } }),
    (error) => error instanceof ContractError && error.code === "ambiguous_consumer",
  );
  assert.throws(
    () => validateReadinessSnapshot({ ...INITIAL_READINESS, unexpectedSecret: { available: false } }),
    /unsupported readiness field/,
  );
});

test("adapter registry separates accounts and entitlements and preserves the invite boundary", () => {
  assert.equal(ADAPTER_CONTRACTS.create_account.module, "accounts.mjs");
  assert.equal(ADAPTER_CONTRACTS.verify_entitlement.module, "entitlements.mjs");
  assert.match(ADAPTER_CONTRACTS.invite.mechanism, /inviteAccountMember/);
  assert.deepEqual(ADAPTER_CONTRACTS.invite.requiredReadiness, [
    "search",
    "read",
    "credential_resolution",
    "session_isolation",
  ]);
  assert.equal(Object.keys(ADAPTER_CONTRACTS).length, OPERATIONS.length);
});

test("unproven readiness returns capability_unavailable before effects", () => {
  const result = resolveAdapter("verify_role_state", "preview");
  assert.equal(result.status, "capability_unavailable");
  assert.equal(result.readiness.blockers[0].reason, "credential_resolution_unproven");
});

test("evidence is allowlisted, bounded and strips every prohibited class", () => {
  const evidence = projectEvidence({
    criterion: "recover qa-viewer@example.invalid at https://example.invalid/signed?token=abc123",
    actorFunctional: "qa-viewer-01",
    environment: "preview",
    fixtureAction: "reused",
    expected: "code=654321 and /auth/confirm?token_hash=signed-value&type=recovery plus /storage/v1/object/sign/a?token=stored",
    observed: "Subject: recovery\nFrom: qa@example.invalid\nMailbox body must not survive",
    productResult: "not_executed",
    executorResult: "blocked",
    attempt: 1,
    blocker: { code: "capability_unavailable", reason: "session=raw-value" },
  });
  const serialized = JSON.stringify(evidence);
  assert.doesNotMatch(
    serialized,
    /qa-viewer@example\.invalid|abc123|654321|signed-value|stored|raw-value|Mailbox body|https:\/\//,
  );
  assert.match(serialized, /redacted/);
  assert.throws(
    () => projectEvidence({ ...evidence, rawMailboxContent: "full message" }),
    (error) => error instanceof ContractError && error.code === "invalid_evidence",
  );
});

test("runner validates a creation contract but blocks without an authorized adapter", () => {
  const result = executeScenario({
    scenario: scenario({
      operations: ["create_user", "verify_role_state"],
      forbiddenOperations: ["create_account"],
      fixtureChange: {
        mode: "create",
        adapterOperation: "create_user",
        idempotency: "exact_required_state",
        previousState: null,
        postcondition: "required_state_exact",
        stableEndState: { ...requiredState },
      },
    }),
    attempt: 1,
  });
  assert.equal(result.code, "capability_unavailable");
  assert.equal(result.fixtureChange.mode, "create");
  assert.equal(result.evidence.productResult, "not_executed");
});

test("runner validates a reconfiguration contract but blocks without an authorized adapter", () => {
  const result = executeScenario({
    scenario: scenario({
      operations: ["create_user", "verify_role_state"],
      forbiddenOperations: ["create_account"],
      fixtureChange: {
        mode: "reconfigure",
        adapterOperation: "create_user",
        idempotency: "exact_required_state",
        previousState: { ...requiredState, status: "pending" },
        postcondition: "required_state_exact",
        stableEndState: { ...requiredState },
      },
    }),
    attempt: 1,
  });
  assert.equal(result.code, "capability_unavailable");
  assert.equal(result.fixtureChange.mode, "reconfigure");
});

test("runner enforces repeatability limits", () => {
  const result = executeScenario({ scenario: scenario({ maxAttempts: 1 }), attempt: 2 });
  assert.equal(result.code, "max_attempts_exceeded");
});

test("runner rejects caller overrides of authoritative catalog and readiness", () => {
  assert.throws(
    () => executeScenario({ scenario: scenario(), attempt: 1, fixtures: [fixture()] }),
    (error) => error instanceof ContractError && error.code === "invalid_input",
  );
  assert.throws(
    () => executeScenario({ scenario: scenario(), attempt: 1, readiness: INITIAL_READINESS }),
    (error) => error instanceof ContractError && error.code === "invalid_input",
  );
});

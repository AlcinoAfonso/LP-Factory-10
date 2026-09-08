import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { institutionalFixtureCatalog } from "./lib/catalog.mjs";
import { ContractError, deepFreeze, validateScenario } from "./lib/contracts.mjs";
import { projectEvidence } from "./lib/evidence.mjs";
import { INITIAL_READINESS } from "./lib/readiness.mjs";
import { resolveAdapter } from "./lib/adapters/index.mjs";
import { selectFixture } from "./lib/selection.mjs";

function validateEnvelope(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ContractError("invalid_input", "input must be an object");
  }
  for (const key of Object.keys(input)) {
    if (!["scenario", "attempt", "observation"].includes(key)) {
      throw new ContractError("invalid_input", `input.${key} is not allowed`);
    }
  }
  if (!Number.isInteger(input.attempt) || input.attempt < 1) {
    throw new ContractError("invalid_input", "attempt must be a positive integer");
  }
  if (input.observation !== undefined && input.observation !== null && typeof input.observation !== "string") {
    throw new ContractError("invalid_input", "observation must be text or null");
  }
}

function blockedEvidence({ scenario, attempt, fixtureAction = "none", actorFunctional = null, code, reason, observation = null }) {
  return projectEvidence({
    criterion: scenario.criterion,
    actorFunctional,
    environment: scenario.environment,
    fixtureAction,
    expected: scenario.finalState,
    observed: observation,
    productResult: "not_executed",
    executorResult: "blocked",
    attempt,
    blocker: { code, reason },
  });
}

export function executeScenario(input) {
  validateEnvelope(input);
  const scenario = validateScenario(input.scenario);
  const fixtures = institutionalFixtureCatalog;
  const readiness = INITIAL_READINESS;

  if (input.attempt > scenario.maxAttempts) {
    return deepFreeze({
      status: "blocked",
      code: "max_attempts_exceeded",
      evidence: blockedEvidence({
        scenario,
        attempt: input.attempt,
        code: "max_attempts_exceeded",
        reason: "the approved attempt limit was exceeded",
      }),
    });
  }

  const selection = selectFixture(fixtures, scenario.requiredState);
  if (selection.status !== "selected") {
    if (selection.code === "fixture_missing" && scenario.fixtureChange) {
      const adapter = resolveAdapter(
        scenario.fixtureChange.adapterOperation,
        scenario.environment,
        readiness,
      );
      return deepFreeze({
        status: "blocked",
        code: "capability_unavailable",
        selection,
        fixtureChange: {
          mode: scenario.fixtureChange.mode,
          adapterOperation: scenario.fixtureChange.adapterOperation,
          idempotency: scenario.fixtureChange.idempotency,
          postcondition: scenario.fixtureChange.postcondition,
        },
        adapter,
        evidence: blockedEvidence({
          scenario,
          attempt: input.attempt,
          fixtureAction: "planned",
          code: "capability_unavailable",
          reason: adapter.readiness?.blockers?.[0]?.reason ?? adapter.reason ?? "adapter unavailable",
        }),
      });
    }
    return deepFreeze({
      status: "blocked",
      code: selection.code,
      selection,
      evidence: blockedEvidence({
        scenario,
        attempt: input.attempt,
        code: selection.code,
        reason: "exact fixture selection did not produce one capable fixture",
      }),
    });
  }

  const adapters = scenario.operations.map((operation) =>
    resolveAdapter(operation, scenario.environment, readiness),
  );
  const unavailable = adapters.find((adapter) => adapter.status !== "ready");
  if (unavailable) {
    return deepFreeze({
      status: "blocked",
      code: "capability_unavailable",
      selection: { status: selection.status, code: selection.code, fixtureId: selection.fixture.id },
      adapters,
      evidence: blockedEvidence({
        scenario,
        attempt: input.attempt,
        fixtureAction: "reused",
        actorFunctional: selection.fixture.id,
        code: "capability_unavailable",
        reason: unavailable.readiness?.blockers?.[0]?.reason ?? unavailable.reason ?? "adapter unavailable",
        observation: input.observation,
      }),
    });
  }

  return deepFreeze({
    status: "ready",
    code: "scenario_ready",
    selection: { status: selection.status, code: selection.code, fixtureId: selection.fixture.id },
    adapters,
    evidence: projectEvidence({
      criterion: scenario.criterion,
      actorFunctional: selection.fixture.id,
      environment: scenario.environment,
      fixtureAction: "reused",
      expected: scenario.finalState,
      observed: input.observation,
      productResult: "not_executed",
      executorResult: "ready",
      attempt: input.attempt,
      blocker: null,
    }),
  });
}

function loadInput(pathArg) {
  if (pathArg && pathArg !== "-") {
    if (!existsSync(pathArg)) throw new ContractError("input_not_found", "input file was not found");
    return JSON.parse(readFileSync(pathArg, "utf8"));
  }
  return JSON.parse(readFileSync(0, "utf8"));
}

function main() {
  try {
    const result = executeScenario(loadInput(process.argv[2]));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status === "blocked") process.exitCode = 2;
  } catch (error) {
    const code = error instanceof ContractError ? error.code : "invalid_input";
    const reason = error instanceof ContractError ? error.message : "input could not be processed";
    process.stdout.write(`${JSON.stringify({ status: "invalid_input", error: { code, reason } }, null, 2)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();

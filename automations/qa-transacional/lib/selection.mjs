import { deepFreeze, STATE_MATCH_FIELDS, validateRequiredState } from "./contracts.mjs";
import { createCatalog } from "./catalog.mjs";

function matchesState(fixture, requiredState) {
  return STATE_MATCH_FIELDS.filter((field) => field !== "capabilities").every(
    (field) => fixture[field] === requiredState[field],
  );
}

function matchesCapabilitiesExactly(fixture, requiredState) {
  return (
    fixture.capabilities.length === requiredState.capabilities.length &&
    fixture.capabilities.every((capability) => requiredState.capabilities.includes(capability))
  );
}

export function selectFixture(fixtures, requiredStateInput) {
  const catalog = createCatalog(fixtures);
  const requiredState = validateRequiredState(requiredStateInput);
  const stateMatches = catalog.filter((fixture) => matchesState(fixture, requiredState));

  if (stateMatches.length === 0) {
    return deepFreeze({ status: "blocked", code: "fixture_missing", candidates: [] });
  }

  const capable = stateMatches.filter((fixture) => matchesCapabilitiesExactly(fixture, requiredState));

  if (capable.length === 0) {
    return deepFreeze({
      status: "blocked",
      code: "capability_mismatch",
      candidates: stateMatches.map((fixture) => fixture.id),
    });
  }

  if (capable.length > 1) {
    return deepFreeze({
      status: "blocked",
      code: "fixture_ambiguous",
      candidates: capable.map((fixture) => fixture.id),
    });
  }

  return deepFreeze({ status: "selected", code: "fixture_selected", fixture: capable[0] });
}

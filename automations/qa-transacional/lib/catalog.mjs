import { ContractError, deepFreeze, validateFixture } from "./contracts.mjs";

export function createCatalog(fixtures = []) {
  if (!Array.isArray(fixtures)) {
    throw new ContractError("invalid_catalog", "fixtures must be an array");
  }
  const validated = fixtures.map(validateFixture);
  if (new Set(validated.map((fixture) => fixture.id)).size !== validated.length) {
    throw new ContractError("duplicate_fixture_id", "fixture ids must be unique");
  }
  return deepFreeze(validated);
}

// E17.9.3 establishes the non-secret contract. Operational fixtures are
// reconciled only in E17.9.4 after readiness proves their safe boundaries.
export const institutionalFixtureCatalog = createCatalog([]);

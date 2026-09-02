import assert from "node:assert/strict";

import {
  landingPageInputCatalogRegistry,
  realEstateBrokerNicheTaxon,
  realEstateSegmentTaxon,
} from "../conversion-content/landing-page/input-catalog";
import { resolveAccountLandingPageOnboardingConfiguration } from "./onboardingConfiguration";
import {
  isAccountLandingPageOperationalConfigurationCompatible,
  type AccountLandingPageOperationalCompatibilityInput,
} from "./operationalCompatibility";

const configuration = {
  accountId: "10000000-0000-4000-8000-000000000001",
  landingPageId: "20000000-0000-4000-8000-000000000002",
  planKey: "starter" as const,
  taxonChain: {
    segment: realEstateSegmentTaxon,
    niche: realEstateBrokerNicheTaxon,
  },
  storedValues: {},
  authoritativeValues: {},
};

const resolved = resolveAccountLandingPageOnboardingConfiguration({
  ...configuration,
  catalogVersion: 6,
  registry: landingPageInputCatalogRegistry,
  revision: 1,
});
assert.equal(resolved.ok, true);

const compatibilityInput: AccountLandingPageOperationalCompatibilityInput = {
  candidateCatalog: {
    version: 6,
    registry: landingPageInputCatalogRegistry,
  },
  configuration,
};
assert.equal(
  isAccountLandingPageOperationalConfigurationCompatible(compatibilityInput),
  true,
);

const missingRegistry = structuredClone(compatibilityInput) as unknown as
  AccountLandingPageOperationalCompatibilityInput;
Object.defineProperty(missingRegistry.candidateCatalog, "registry", {
  value: undefined,
});
assert.equal(
  isAccountLandingPageOperationalConfigurationCompatible(missingRegistry),
  false,
);

console.log("ok - administrative input-catalog compatibility boundary remains valid");

import assert from "node:assert/strict";

import * as publicCommercialCapabilities from "./index";
import { commercialCapabilityRegistry } from "./registry";
import {
  resolveCommercialCapability,
  resolveCommercialCapabilityFromRegistry,
  validateCommercialCapabilityRegistry,
} from "./resolve";

type Case = Readonly<{
  name: string;
  run: () => void;
}>;

const booleanDefinition = {
  key: "synthetic_feature",
  name: "Synthetic feature",
  description: "Test-only boolean capability.",
  category: "synthetic",
  consumerDomain: "synthetic_consumer",
  type: "boolean",
};

const closedLevelDefinition = {
  key: "synthetic_level",
  name: "Synthetic level",
  description: "Test-only closed-level capability.",
  category: "synthetic",
  consumerDomain: "synthetic_consumer",
  type: "closed_level",
  allowedValues: ["basic", "advanced"],
};

const numericLimitDefinition = {
  key: "synthetic_limit",
  name: "Synthetic limit",
  description: "Test-only numeric-limit capability.",
  category: "synthetic",
  consumerDomain: "synthetic_consumer",
  type: "numeric_limit",
  unit: "items",
  unlimitedValue: -1,
};

const validFixtureRegistry = {
  definitions: [
    booleanDefinition,
    closedLevelDefinition,
    numericLimitDefinition,
  ],
  plans: [
    {
      planKey: "synthetic_plan",
      capabilities: [
        { capabilityKey: "synthetic_feature", value: true },
        { capabilityKey: "synthetic_level", value: "basic" },
        { capabilityKey: "synthetic_limit", value: 10 },
      ],
    },
  ],
};

const cases: readonly Case[] = [
  {
    name: "runtime registry is empty and deeply immutable",
    run: () => {
      assert.deepEqual(commercialCapabilityRegistry, {
        definitions: [],
        plans: [],
      });
      assertDeeplyFrozen(commercialCapabilityRegistry);
      assert.deepEqual(validateCommercialCapabilityRegistry(commercialCapabilityRegistry), {
        ok: true,
      });
    },
  },
  {
    name: "public API exposes only the production resolver",
    run: () => {
      assert.deepEqual(Object.keys(publicCommercialCapabilities), [
        "resolveCommercialCapability",
      ]);
      assert.equal(
        "commercialCapabilityRegistry" in publicCommercialCapabilities,
        false,
      );
      assert.equal(
        "resolveCommercialCapabilityFromRegistry" in publicCommercialCapabilities,
        false,
      );
    },
  },
  {
    name: "empty runtime registry fails closed without inferring a plan",
    run: () => {
      assertError(
        resolveCommercialCapability({
          planKey: "starter",
          capabilityKey: "synthetic_feature",
        }),
        "UNKNOWN_PLAN",
      );
    },
  },
  {
    name: "synthetic boolean capability resolves deterministically",
    run: () => {
      const result = resolveCommercialCapabilityFromRegistry(
        {
          planKey: "synthetic_plan",
          capabilityKey: "synthetic_feature",
        },
        validFixtureRegistry,
      );
      assert.equal(result.ok, true);
      assert.equal(result.value.planKey, "synthetic_plan");
      assert.equal(result.value.definition.key, "synthetic_feature");
      assert.equal(result.value.value, true);
      assertDeeplyFrozen(result.value);
    },
  },
  {
    name: "unknown capability and absent assignment fail closed",
    run: () => {
      assertError(
        resolveCommercialCapabilityFromRegistry(
          {
            planKey: "synthetic_plan",
            capabilityKey: "unknown_feature",
          },
          validFixtureRegistry,
        ),
        "UNKNOWN_CAPABILITY",
      );

      const withoutAssignment = structuredClone(validFixtureRegistry);
      withoutAssignment.plans[0].capabilities = [
        { capabilityKey: "synthetic_feature", value: true },
      ];
      assertError(
        resolveCommercialCapabilityFromRegistry(
          {
            planKey: "synthetic_plan",
            capabilityKey: "synthetic_level",
          },
          withoutAssignment,
        ),
        "CAPABILITY_NOT_ASSIGNED",
      );
    },
  },
  {
    name: "invalid input and extra input fields fail closed",
    run: () => {
      assertError(
        resolveCommercialCapabilityFromRegistry(
          { planKey: " synthetic_plan", capabilityKey: "synthetic_feature" },
          validFixtureRegistry,
        ),
        "INVALID_INPUT",
      );
      assertError(
        resolveCommercialCapabilityFromRegistry(
          {
            planKey: "synthetic_plan",
            capabilityKey: "synthetic_feature",
            fallback: true,
          },
          validFixtureRegistry,
        ),
        "INVALID_INPUT",
      );
    },
  },
  {
    name: "closed levels and numeric limits enforce their value contracts",
    run: () => {
      const invalidLevel = structuredClone(validFixtureRegistry);
      invalidLevel.plans[0].capabilities[1].value = "enterprise";
      assertError(
        resolveCommercialCapabilityFromRegistry(
          {
            planKey: "synthetic_plan",
            capabilityKey: "synthetic_level",
          },
          invalidLevel,
        ),
        "INVALID_CAPABILITY_VALUE",
      );

      const unlimited = structuredClone(validFixtureRegistry);
      unlimited.plans[0].capabilities[2].value = -1;
      assert.equal(
        resolveCommercialCapabilityFromRegistry(
          {
            planKey: "synthetic_plan",
            capabilityKey: "synthetic_limit",
          },
          unlimited,
        ).ok,
        true,
      );

      const invalidNegative = structuredClone(validFixtureRegistry);
      invalidNegative.plans[0].capabilities[2].value = -2;
      assertError(
        resolveCommercialCapabilityFromRegistry(
          {
            planKey: "synthetic_plan",
            capabilityKey: "synthetic_limit",
          },
          invalidNegative,
        ),
        "INVALID_CAPABILITY_VALUE",
      );
    },
  },
  {
    name: "duplicate definitions plans and assignments are rejected",
    run: () => {
      const duplicateDefinition = structuredClone(validFixtureRegistry);
      duplicateDefinition.definitions.push({ ...booleanDefinition });
      assertRegistryError(duplicateDefinition, "INVALID_REGISTRY");

      const duplicatePlan = structuredClone(validFixtureRegistry);
      duplicatePlan.plans.push(structuredClone(duplicatePlan.plans[0]));
      assertRegistryError(duplicatePlan, "INVALID_REGISTRY");

      const duplicateAssignment = structuredClone(validFixtureRegistry);
      duplicateAssignment.plans[0].capabilities.push({
        capabilityKey: "synthetic_feature",
        value: false,
      });
      assertRegistryError(duplicateAssignment, "INVALID_REGISTRY");
    },
  },
  {
    name: "unlimited sentinel requires explicit definition adoption",
    run: () => {
      const withoutUnlimited = structuredClone(validFixtureRegistry);
      const definitionWithoutUnlimited = withoutUnlimited.definitions[2] as Record<
        string,
        unknown
      >;
      delete definitionWithoutUnlimited.unlimitedValue;
      withoutUnlimited.plans[0].capabilities[2].value = -1;
      assertError(
        resolveCommercialCapabilityFromRegistry(
          {
            planKey: "synthetic_plan",
            capabilityKey: "synthetic_limit",
          },
          withoutUnlimited,
        ),
        "INVALID_CAPABILITY_VALUE",
      );
    },
  },
];

function assertError(
  result: ReturnType<typeof resolveCommercialCapability>,
  code: string,
) {
  assert.equal(result.ok, false);
  assert.equal(result.error.code, code);
}

function assertRegistryError(registry: unknown, code: string) {
  const result = validateCommercialCapabilityRegistry(registry);
  assert.equal(result.ok, false);
  assert.equal(result.code, code);
}

function assertDeeplyFrozen(value: unknown) {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  for (const nested of Object.values(value)) assertDeeplyFrozen(nested);
}

for (const validationCase of cases) {
  validationCase.run();
  console.log(`ok - ${validationCase.name}`);
}

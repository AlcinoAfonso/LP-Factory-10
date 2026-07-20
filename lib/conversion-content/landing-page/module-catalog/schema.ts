import { z } from "zod";

import {
  landingPageModuleKeys,
  landingPageModuleLifecycleStatuses,
  type LandingPageModuleDefinition,
  type LandingPageModuleKey,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";

const identifierSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);
const uniqueIdentifiersSchema = z
  .array(identifierSchema)
  .min(1)
  .superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: "custom",
        message: "structural identifiers must be unique",
      });
    }
  });

export const landingPageModuleDefinitionSchema = z
  .object({
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.number().int().min(1),
    lifecycleStatus: z.enum(landingPageModuleLifecycleStatuses),
    purpose: z.literal("controlled_test"),
    function: identifierSchema,
    boundaries: uniqueIdentifiersSchema,
    invariants: uniqueIdentifiersSchema,
  })
  .strict();

export const landingPageModuleCatalogEntrySchema = z
  .object({
    family: z.literal("landing_page"),
    moduleCatalogVersion: z.number().int().min(1),
    compatibleRootVersions: z.array(z.number().int().min(1)).min(1),
    modules: z.record(z.string(), landingPageModuleDefinitionSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    if (
      new Set(catalog.compatibleRootVersions).size !==
      catalog.compatibleRootVersions.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["compatibleRootVersions"],
        message: "compatible root versions must be unique",
      });
    }

    if (catalog.moduleCatalogVersion === 1) {
      validateExactValues({
        context,
        path: ["compatibleRootVersions"],
        actual: catalog.compatibleRootVersions,
        expected: [1],
      });
      validateExactValues({
        context,
        path: ["modules"],
        actual: Object.keys(catalog.modules),
        expected: landingPageModuleKeys,
      });

      for (const [moduleKey, moduleDefinition] of Object.entries(
        catalog.modules,
      )) {
        if (moduleDefinition.moduleKey !== moduleKey) {
          context.addIssue({
            code: "custom",
            path: ["modules", moduleKey, "moduleKey"],
            message: "module identity must match its registry key",
          });
        }
        if (moduleDefinition.moduleVersion !== 1) {
          context.addIssue({
            code: "custom",
            path: ["modules", moduleKey, "moduleVersion"],
            message: "module catalog v1 requires module version 1",
          });
        }
        if (moduleDefinition.lifecycleStatus !== "hypothesis") {
          context.addIssue({
            code: "custom",
            path: ["modules", moduleKey, "lifecycleStatus"],
            message: "module catalog v1 starts as hypothesis",
          });
        }

        const canonicalModule =
          landingPageModuleCatalogRegistry[1].modules[
            moduleKey as LandingPageModuleKey
          ];
        if (moduleDefinition.moduleVersion === 1 && canonicalModule) {
          validateExactModuleV1Structure({
            context,
            moduleKey,
            actual: moduleDefinition,
            expected: canonicalModule,
          });
        }
      }
    }
  });

function validateExactModuleV1Structure(input: {
  context: z.RefinementCtx;
  moduleKey: string;
  actual: LandingPageModuleDefinition;
  expected: LandingPageModuleDefinition;
}) {
  if (input.actual.function !== input.expected.function) {
    input.context.addIssue({
      code: "custom",
      path: ["modules", input.moduleKey, "function"],
      message: "module function must match the approved v1 contract",
    });
  }

  validateExactOrderedIdentifiers({
    context: input.context,
    path: ["modules", input.moduleKey, "boundaries"],
    actual: input.actual.boundaries,
    expected: input.expected.boundaries,
  });
  validateExactOrderedIdentifiers({
    context: input.context,
    path: ["modules", input.moduleKey, "invariants"],
    actual: input.actual.invariants,
    expected: input.expected.invariants,
  });
}

function validateExactOrderedIdentifiers(input: {
  context: z.RefinementCtx;
  path: (string | number)[];
  actual: readonly string[];
  expected: readonly string[];
}) {
  if (
    input.actual.length !== input.expected.length ||
    input.actual.some((value, index) => value !== input.expected[index])
  ) {
    input.context.addIssue({
      code: "custom",
      path: input.path,
      message: "structural identifiers must match the approved v1 contract",
    });
  }
}

function validateExactValues(input: {
  context: z.RefinementCtx;
  path: (string | number)[];
  actual: readonly (string | number)[];
  expected: readonly (string | number)[];
}) {
  for (const value of input.actual) {
    if (!input.expected.includes(value)) {
      input.context.addIssue({
        code: "custom",
        path: input.path,
        message: "unknown required value",
      });
    }
  }
  for (const value of input.expected) {
    if (!input.actual.includes(value)) {
      input.context.addIssue({
        code: "custom",
        path: input.path,
        message: "required value missing",
      });
    }
  }
}

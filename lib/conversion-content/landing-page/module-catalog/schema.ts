import { z } from "zod";

import {
  landingPageModuleKeys,
  type LandingPageModuleKey,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";

const nonEmptyPlainText = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !containsFreeMarkupOrRendererHint(value), {
    message: "text must not contain markup, scripts, styles or renderer hints",
  });

const moduleDefinitionSchema = z
  .object({
    family: z.literal("landing_page"),
    moduleKey: z.enum(landingPageModuleKeys),
    moduleVersion: z.literal(1),
    lifecycleStatus: z.literal("hypothesis"),
    purpose: z.literal("controlled_test"),
    structuralFunction: nonEmptyPlainText,
    invariants: z.array(nonEmptyPlainText).min(1),
    boundaries: z.array(nonEmptyPlainText).min(1),
  })
  .strict()
  .superRefine((module, context) => {
    validateUniqueText(module.invariants, "invariants", context);
    validateUniqueText(module.boundaries, "boundaries", context);
  });

export const landingPageModuleCatalogSchema = z
  .object({
    family: z.literal("landing_page"),
    moduleCatalogVersion: z.literal(1),
    compatibleRootVersions: z.tuple([z.literal(1)]),
    modules: z.record(z.string(), moduleDefinitionSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    const expectedKeys = new Set<string>(landingPageModuleKeys);
    const actualKeys = Object.keys(catalog.modules);

    for (const key of actualKeys) {
      if (!expectedKeys.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["modules", key],
          message: "unknown module key",
        });
      }
    }

    for (const key of landingPageModuleKeys) {
      if (!actualKeys.includes(key)) {
        context.addIssue({
          code: "custom",
          path: ["modules", key],
          message: "required module missing",
        });
      }
    }

    for (const [key, module] of Object.entries(catalog.modules)) {
      if (module.moduleKey !== key) {
        context.addIssue({
          code: "custom",
          path: ["modules", key, "moduleKey"],
          message: "module key mismatch",
        });
      }

      if (!expectedKeys.has(key)) continue;
      const canonical =
        landingPageModuleCatalogRegistry.modules[key as LandingPageModuleKey];

      if (module.structuralFunction !== canonical.structuralFunction) {
        context.addIssue({
          code: "custom",
          path: ["modules", key, "structuralFunction"],
          message: "structural function differs from the canonical registry",
        });
      }
      validateCanonicalTextList({
        actual: module.invariants,
        canonical: canonical.invariants,
        context,
        path: ["modules", key, "invariants"],
      });
      validateCanonicalTextList({
        actual: module.boundaries,
        canonical: canonical.boundaries,
        context,
        path: ["modules", key, "boundaries"],
      });
    }
  });

function containsFreeMarkupOrRendererHint(value: string): boolean {
  return /<[^>]+>|<\/|script|style=|class=|className=|tailwind|component|props/i.test(
    value,
  );
}

function validateUniqueText(
  values: readonly string[],
  path: "invariants" | "boundaries",
  context: z.RefinementCtx,
) {
  if (new Set(values).size !== values.length) {
    context.addIssue({
      code: "custom",
      path: [path],
      message: `${path} must be unique`,
    });
  }
}

function validateCanonicalTextList(input: {
  actual: readonly string[];
  canonical: readonly string[];
  context: z.RefinementCtx;
  path: (string | number)[];
}) {
  const matches =
    input.actual.length === input.canonical.length &&
    input.actual.every((value, index) => value === input.canonical[index]);

  if (!matches) {
    input.context.addIssue({
      code: "custom",
      path: input.path,
      message: "structural values differ from the canonical registry",
    });
  }
}

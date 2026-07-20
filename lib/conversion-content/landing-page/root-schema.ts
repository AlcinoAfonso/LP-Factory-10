import { z } from "zod";

export const landingPageRootSemanticRoleKeys = [
  "eyebrow",
  "h1",
  "h2",
  "h3",
  "paragraph",
  "cta_label",
  "privacy_note",
  "faq_question",
  "faq_answer",
  "card_title",
  "card_body",
  "benefit_item",
  "step_label",
  "step_title",
  "step_body",
] as const;

const visualRoleKeys = [
  "primary_action",
  "focus_indicator",
  "border",
  "surface",
  "text",
  "state",
] as const;

const requiredVersionOneSpacingOptions = [
  "compact",
  "default",
  "spacious",
] as const;

const lifecycleStatuses = ["hypothesis", "validated", "deprecated"] as const;

const semanticRoleKeySet = new Set<string>(landingPageRootSemanticRoleKeys);
const visualRoleKeySet = new Set<string>(visualRoleKeys);
const lifecycleStatusSet = new Set<string>(lifecycleStatuses);

const nonEmptyPlainText = z
  .string()
  .transform(normalizeLandingPageRootText)
  .pipe(z.string().min(1))
  .refine((value) => !containsFreeMarkupOrStyle(value), {
    message: "text must not contain markup, scripts, styles or renderer hints",
  });

const sizeValueSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d+)?(?:rem|ch)$/);

const textRangeSchema = z
  .object({
    recommended: z
      .object({
        min: z.number().int().min(1),
        max: z.number().int().min(1),
      })
      .strict(),
    absoluteMax: z.number().int().min(1),
  })
  .strict()
  .superRefine((range, context) => {
    if (range.recommended.min > range.recommended.max) {
      context.addIssue({
        code: "custom",
        path: ["recommended"],
        message: "recommended range is inverted",
      });
    }
    if (range.recommended.max > range.absoluteMax) {
      context.addIssue({
        code: "custom",
        path: ["recommended", "max"],
        message: "recommended range exceeds absolute max",
      });
    }
  });

const semanticRoleSchema = z
  .object({
    key: z.string(),
    textRange: textRangeSchema,
  })
  .strict();

const visualRoleSchema = z
  .object({
    key: z.string(),
    description: nonEmptyPlainText,
  })
  .strict();

const typographySchema = z
  .object({
    h1: z.object({ min: sizeValueSchema, max: sizeValueSchema }).strict(),
    h2: z.object({ min: sizeValueSchema, max: sizeValueSchema }).strict(),
    h3: z.object({ min: sizeValueSchema, max: sizeValueSchema }).strict(),
    body: z
      .object({
        base: sizeValueSchema,
        editorialEmphasis: sizeValueSchema.optional(),
      })
      .strict(),
    support: sizeValueSchema,
  })
  .strict();

const presetSchema = z
  .object({
    key: z.string().trim().min(1),
    density: z.string(),
    defaultSectionSpacing: z.string(),
    maxPageWidth: sizeValueSchema,
    maxReadingWidth: sizeValueSchema,
    typography: typographySchema,
  })
  .strict();

export const landingPageRootRegistryEntrySchema = z
  .object({
    family: z.literal("landing_page"),
    rootVersion: z.number().int().min(1),
    lifecycleStatus: z.string(),
    defaultPreset: z.string().trim().min(1),
    semanticRoles: z.record(z.string(), semanticRoleSchema),
    commonOptions: z
      .object({
        spacing: z.array(z.string()).min(1),
      })
      .strict(),
    visualRoles: z.record(z.string(), visualRoleSchema),
    visualCriteria: z
      .object({
        accessibilityBaseline: nonEmptyPlainText,
        claimsFullWcagConformance: z.literal(false),
        mobileFirst: z.literal(true),
        minViewportPx: z.number().int().min(1),
        evidenceViewportsPx: z.array(z.number().int().min(1)).min(1),
        noTextTruncation: z.literal(true),
        noHorizontalScrollFromText: z.literal(true),
        bodyTextMinSize: sizeValueSchema,
        supportTextMinSize: sizeValueSchema,
        minInteractiveTargetPx: z
          .object({
            width: z.number().int().min(1),
            height: z.number().int().min(1),
          })
          .strict(),
        readingLineWidthCh: z
          .object({
            min: z.number().int().min(1),
            max: z.number().int().min(1),
            target: z.number().int().min(1),
          })
          .strict(),
        h1MobileLineTarget: z.number().int().min(1),
        h2MobileLineTarget: z.number().int().min(1),
        semanticHierarchy: z.tuple([
          z.literal("h1"),
          z.literal("h2"),
          z.literal("h3"),
        ]),
        visibleFocusRequired: z.literal(true),
        visualHierarchyFollowsSemantic: z.literal(true),
        contrastRequired: z.literal(true),
        legibilityRequired: z.literal(true),
        accessibleNavigationRequired: z.literal(true),
        interactiveStatesRequired: z.literal(true),
      })
      .strict(),
    presets: z.record(z.string(), presetSchema),
  })
  .strict()
  .superRefine((entry, context) => {
    if (!lifecycleStatusSet.has(entry.lifecycleStatus)) {
      context.addIssue({
        code: "custom",
        path: ["lifecycleStatus"],
        message: "unknown lifecycle status",
      });
    }

    validateExactRecordKeys({
      context,
      path: ["semanticRoles"],
      actual: entry.semanticRoles,
      expected: semanticRoleKeySet,
    });
    for (const [roleKey, role] of Object.entries(entry.semanticRoles)) {
      if (role.key !== roleKey || !semanticRoleKeySet.has(role.key)) {
        context.addIssue({
          code: "custom",
          path: ["semanticRoles", roleKey, "key"],
          message: "semantic role key mismatch",
        });
      }
    }

    validateExactRecordKeys({
      context,
      path: ["visualRoles"],
      actual: entry.visualRoles,
      expected: visualRoleKeySet,
    });
    for (const [roleKey, role] of Object.entries(entry.visualRoles)) {
      if (role.key !== roleKey || !visualRoleKeySet.has(role.key)) {
        context.addIssue({
          code: "custom",
          path: ["visualRoles", roleKey, "key"],
          message: "visual role key mismatch",
        });
      }
    }

    if (!entry.presets[entry.defaultPreset]) {
      context.addIssue({
        code: "custom",
        path: ["defaultPreset"],
        message: "default preset must exist",
      });
    }
    for (const [presetKey, preset] of Object.entries(entry.presets)) {
      if (preset.key !== presetKey) {
        context.addIssue({
          code: "custom",
          path: ["presets", presetKey, "key"],
          message: "preset key mismatch",
        });
      }
    }

    const declaredSpacingOptions = new Set(entry.commonOptions.spacing);
    if (declaredSpacingOptions.size !== entry.commonOptions.spacing.length) {
      context.addIssue({
        code: "custom",
        path: ["commonOptions", "spacing"],
        message: "spacing options must be unique",
      });
    }

    if (entry.rootVersion === 1) {
      validateExactArrayValues({
        context,
        path: ["commonOptions", "spacing"],
        actual: entry.commonOptions.spacing,
        expected: requiredVersionOneSpacingOptions,
      });
    }

    for (const [presetKey, preset] of Object.entries(entry.presets)) {
      for (const path of ["density", "defaultSectionSpacing"] as const) {
        if (!declaredSpacingOptions.has(preset[path])) {
          context.addIssue({
            code: "custom",
            path: ["presets", presetKey, path],
            message: "preset spacing must be declared by the version",
          });
        }
      }
    }

    for (const spacing of entry.commonOptions.spacing) {
      if (!requiredVersionOneSpacingOptions.includes(spacing as never)) {
        context.addIssue({
          code: "custom",
          path: ["commonOptions", "spacing"],
          message: "unknown spacing option",
        });
      }
    }
  });

export function normalizeLandingPageRootText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .trim()
    .replace(/[ \t]+/g, " ");
}

export function countLandingPageRootTextCharacters(value: string): number {
  return Array.from(normalizeLandingPageRootText(value)).length;
}

function containsFreeMarkupOrStyle(value: string): boolean {
  return /<[^>]+>|<\/|script|style=|class=|className=|tailwind|component|props/i.test(
    value,
  );
}

function validateExactRecordKeys(input: {
  context: z.RefinementCtx;
  path: string[];
  actual: Record<string, unknown>;
  expected: Set<string>;
}) {
  const actualKeys = Object.keys(input.actual);
  for (const key of actualKeys) {
    if (!input.expected.has(key)) {
      input.context.addIssue({
        code: "custom",
        path: [...input.path, key],
        message: "unknown key",
      });
    }
  }
  for (const key of input.expected) {
    if (!actualKeys.includes(key)) {
      input.context.addIssue({
        code: "custom",
        path: [...input.path, key],
        message: "required key missing",
      });
    }
  }
}

function validateExactArrayValues(input: {
  context: z.RefinementCtx;
  path: string[];
  actual: readonly string[];
  expected: readonly string[];
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

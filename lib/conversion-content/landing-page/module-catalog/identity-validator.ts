import { z } from "zod";

import type {
  LandingPageModuleIdentityErrorCode,
  LandingPageModuleKey,
  LandingPageVariantKey,
  ValidateLandingPageModuleIdentityInput,
  ValidateLandingPageModuleIdentityResult,
} from "./contracts";
import { landingPageModuleCatalogRegistry } from "./registry";
import { landingPageModuleCatalogSchema } from "./schema";

const identityInputSchema = z
  .object({
    moduleKey: z.string().trim().min(1),
    moduleVersion: z.number().int(),
    variantKey: z
      .string()
      .trim()
      .regex(/^[a-z0-9_]+\.[a-z0-9_]+$/)
      .optional(),
    variantVersion: z.number().int().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if ((input.variantKey === undefined) !== (input.variantVersion === undefined)) {
      context.addIssue({
        code: "custom",
        path: ["variantKey"],
        message: "variant key and version must be provided together",
      });
    }
  });

export function validateLandingPageModuleIdentity(
  input: unknown,
): ValidateLandingPageModuleIdentityResult {
  const parsedInput = identityInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return failure("INVALID_INPUT", "Landing-page module identity input is invalid.");
  }
  const validInput = parsedInput.data satisfies ValidateLandingPageModuleIdentityInput;

  const parsedRegistry = landingPageModuleCatalogSchema.safeParse(
    landingPageModuleCatalogRegistry,
  );
  if (!parsedRegistry.success) {
    return failure(
      "INVALID_MODULE_CATALOG_CONTRACT",
      "Landing-page module catalog contract is invalid.",
    );
  }

  if (!Object.hasOwn(landingPageModuleCatalogRegistry.modules, validInput.moduleKey)) {
    return failure("UNKNOWN_MODULE", "Unknown landing-page module.");
  }
  const moduleDefinition =
    landingPageModuleCatalogRegistry.modules[
      validInput.moduleKey as LandingPageModuleKey
    ];
  if (moduleDefinition.moduleVersion !== validInput.moduleVersion) {
    return failure(
      "UNKNOWN_MODULE_VERSION",
      "Unknown landing-page module version.",
    );
  }

  if (validInput.variantKey === undefined) return { ok: true };

  const hasVariantIdentity = Object.keys(
    landingPageModuleCatalogRegistry.variants,
  ).some((key) => key.startsWith(`${validInput.variantKey}@v`));
  if (!hasVariantIdentity) {
    return failure("UNKNOWN_VARIANT", "Unknown landing-page module variant.");
  }

  const canonicalVariantKey =
    `${validInput.variantKey}@v${validInput.variantVersion}` as LandingPageVariantKey;
  if (!Object.hasOwn(landingPageModuleCatalogRegistry.variants, canonicalVariantKey)) {
    return failure(
      "UNKNOWN_VARIANT_VERSION",
      "Unknown landing-page module variant version.",
    );
  }

  const variant = landingPageModuleCatalogRegistry.variants[canonicalVariantKey];
  if (
    variant.moduleKey !== moduleDefinition.moduleKey ||
    variant.moduleVersion !== moduleDefinition.moduleVersion
  ) {
    return failure(
      "VARIANT_MODULE_MISMATCH",
      "Landing-page module variant does not belong to the supplied module.",
    );
  }

  return { ok: true };
}

function failure(
  code: LandingPageModuleIdentityErrorCode,
  message: string,
): Extract<ValidateLandingPageModuleIdentityResult, { ok: false }> {
  return { ok: false, error: { code, message } };
}

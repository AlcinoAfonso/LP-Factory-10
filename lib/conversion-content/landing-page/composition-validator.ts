import { z } from "zod";

import type {
  LandingPageComposition,
  LandingPageCompositionItem,
} from "./contracts";
import {
  isLandingPageSectionVariant,
  landingPageSectionRegistry,
} from "./registry";
import type { LandingPageSectionVariant } from "./schemas";

export const landingPageSectionConfigSchema = z
  .object({
    anchor_id: z
      .string()
      .trim()
      .regex(/^[a-z][a-z0-9-]{0,63}$/)
      .optional(),
    spacing: z.enum(["compact", "default", "spacious"]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length <= 2);

export type LandingPageSectionConfig = z.infer<
  typeof landingPageSectionConfigSchema
>;

export type LandingPageResolvedCompositionItem = Omit<
  LandingPageCompositionItem,
  "variantKey" | "config"
> & {
  variantKey: LandingPageSectionVariant;
  config: LandingPageSectionConfig;
};

export type LandingPageCompositionValidationReason =
  | "composition_item_duplicate"
  | "composition_order_invalid"
  | "section_registry_invalid"
  | "config_json_invalid";

export type LandingPageCompositionValidationResult =
  | { status: "valid"; items: LandingPageResolvedCompositionItem[] }
  | {
      status: "invalid";
      reason: LandingPageCompositionValidationReason;
    };

export function validateLandingPageComposition(
  composition: LandingPageComposition,
): LandingPageCompositionValidationResult {
  const itemIds = new Set<string>();
  let previousSortOrder = Number.NEGATIVE_INFINITY;
  const items: LandingPageResolvedCompositionItem[] = [];

  for (const item of composition.items) {
    if (itemIds.has(item.id)) {
      return { status: "invalid", reason: "composition_item_duplicate" };
    }
    itemIds.add(item.id);

    if (
      !Number.isInteger(item.sortOrder) ||
      item.sortOrder < 0 ||
      item.sortOrder <= previousSortOrder
    ) {
      return { status: "invalid", reason: "composition_order_invalid" };
    }
    previousSortOrder = item.sortOrder;

    if (!isLandingPageSectionVariant(item.variantKey)) {
      return { status: "invalid", reason: "section_registry_invalid" };
    }

    const registryEntry = landingPageSectionRegistry[item.variantKey];
    if (item.moduleKey !== registryEntry.moduleKey) {
      return { status: "invalid", reason: "section_registry_invalid" };
    }

    const parsedConfig = landingPageSectionConfigSchema.safeParse(item.config);
    if (!parsedConfig.success) {
      return { status: "invalid", reason: "config_json_invalid" };
    }

    items.push({
      ...item,
      variantKey: item.variantKey,
      config: parsedConfig.data,
    });
  }

  return { status: "valid", items };
}

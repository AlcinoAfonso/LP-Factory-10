import type { LandingPageGenerationProfileItem } from "../landing-page/generation-profile";

export function normalizeLandingPageGenerationProfileItemRow(
  value: unknown,
): Readonly<{
  profileId: string;
  item: LandingPageGenerationProfileItem;
}> | null {
  if (!isRecord(value)) return null;

  const hasVariantKey = value.variant_key !== null;
  const hasVariantVersion = value.variant_version !== null;
  if (
    hasVariantKey !== hasVariantVersion ||
    typeof value.id !== "string" ||
    typeof value.profile_id !== "string" ||
    typeof value.module_key !== "string" ||
    !Number.isInteger(value.module_version) ||
    (hasVariantKey && typeof value.variant_key !== "string") ||
    (hasVariantVersion && !Number.isInteger(value.variant_version)) ||
    typeof value.priority !== "string" ||
    !Number.isInteger(value.recommended_order) ||
    (value.item_guidance !== null && typeof value.item_guidance !== "string")
  ) {
    return null;
  }

  const variant =
    value.variant_key === null
      ? {}
      : {
          variantKey: value.variant_key as string,
          variantVersion: value.variant_version as number,
        };
  const guidance =
    value.item_guidance === null
      ? {}
      : { itemGuidance: value.item_guidance as string };

  return {
    profileId: value.profile_id,
    item: {
      id: value.id,
      moduleKey: value.module_key,
      moduleVersion: value.module_version as number,
      ...variant,
      priority: value.priority as LandingPageGenerationProfileItem["priority"],
      recommendedOrder: value.recommended_order as number,
      ...guidance,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

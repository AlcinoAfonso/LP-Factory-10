import type {
  LandingPageFieldDefinition,
  LandingPageInteractionContract,
  LandingPageVariantCapability,
} from "./contracts";

export function deriveLandingPageVariantCapabilities(
  fields: readonly LandingPageFieldDefinition[],
  interactionContracts: readonly LandingPageInteractionContract[],
): readonly LandingPageVariantCapability[] {
  const interactionKinds = new Set(
    interactionContracts.map((contract) => contract.kind),
  );

  return [
    ...(hasFieldKind(fields, "action") ? ["primary_action" as const] : []),
    ...(hasFieldKind(fields, "image") ? ["image_asset" as const] : []),
    ...(interactionKinds.has("accordion")
      ? ["accordion_interaction" as const]
      : []),
    ...(interactionKinds.has("form") ? ["embedded_form" as const] : []),
  ];
}

function hasFieldKind(
  fields: readonly LandingPageFieldDefinition[],
  fieldKind: "action" | "image",
): boolean {
  return fields.some(
    (field) =>
      field.fieldKind === fieldKind ||
      (field.fieldKind === "collection" &&
        hasFieldKind(field.itemFields, fieldKind)),
  );
}

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
    ...(hasSingletonAction(fields) ? ["primary_action" as const] : []),
    ...(hasFieldKind(fields, "image") ? ["image_asset" as const] : []),
    ...(interactionKinds.has("accordion")
      ? ["accordion_interaction" as const]
      : []),
    ...(interactionKinds.has("form") ? ["embedded_form" as const] : []),
  ];
}

function hasSingletonAction(
  fields: readonly LandingPageFieldDefinition[],
): boolean {
  return fields.some(
    (field) =>
      (field.fieldKind === "action" &&
        field.cardinality.min === 1 &&
        field.cardinality.max === 1) ||
      (field.fieldKind === "collection" &&
        hasSingletonAction(field.itemFields)),
  );
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

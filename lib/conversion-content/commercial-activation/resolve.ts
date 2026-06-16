import type { ContentComposition } from "../contracts";
import {
  commercialActivationSectionRegistry,
  isCommercialActivationSectionVariant,
} from "./registry";
import {
  commercialActivationContentV1Schema,
  type CommercialActivationSectionContent,
  type CommercialActivationSectionVariant,
} from "./schemas";

export type CommercialActivationRenderSection = {
  compositionItemId: string;
  sortOrder: number;
  moduleKey: string;
  variantKey: CommercialActivationSectionVariant;
  content: CommercialActivationSectionContent;
};

export type CommercialActivationRenderModel = {
  schemaVersion: 1;
  sections: CommercialActivationRenderSection[];
};

export type CommercialActivationRenderResult =
  | { status: "ready"; model: CommercialActivationRenderModel }
  | {
      status: "invalid";
      reason:
        | "content_schema_invalid"
        | "composition_item_duplicate"
        | "composition_item_unknown"
        | "composition_item_missing"
        | "section_registry_invalid"
        | "section_content_invalid";
    };

export function resolveCommercialActivationRenderModel(input: {
  composition: ContentComposition;
  contentJson: unknown;
  logSafeWarning?: (message: string, details: Record<string, unknown>) => void;
}): CommercialActivationRenderResult {
  const parsedContent =
    commercialActivationContentV1Schema.safeParse(input.contentJson);
  if (!parsedContent.success) {
    return { status: "invalid", reason: "content_schema_invalid" };
  }

  const compositionItems = new Map(
    input.composition.items.map((item) => [item.id, item]),
  );
  const contentItems = new Map<
    string,
    (typeof parsedContent.data.sections)[number]
  >();

  for (const section of parsedContent.data.sections) {
    if (contentItems.has(section.composition_item_id)) {
      return { status: "invalid", reason: "composition_item_duplicate" };
    }
    if (!compositionItems.has(section.composition_item_id)) {
      return { status: "invalid", reason: "composition_item_unknown" };
    }
    contentItems.set(section.composition_item_id, section);
  }

  const sections: CommercialActivationRenderSection[] = [];

  for (const item of input.composition.items) {
    if (!isCommercialActivationSectionVariant(item.variantKey)) {
      return { status: "invalid", reason: "section_registry_invalid" };
    }

    const registryEntry = commercialActivationSectionRegistry[item.variantKey];
    if (item.module.key !== registryEntry.moduleKey) {
      return { status: "invalid", reason: "section_registry_invalid" };
    }

    const section = contentItems.get(item.id);
    if (!section) {
      if (item.isRequired) {
        return { status: "invalid", reason: "composition_item_missing" };
      }
      continue;
    }

    const parsedSection = registryEntry.schema.safeParse(section.content);
    if (!parsedSection.success) {
      if (item.isRequired) {
        return { status: "invalid", reason: "section_content_invalid" };
      }
      input.logSafeWarning?.("optional commercial activation section omitted", {
        compositionItemId: item.id,
        variantKey: item.variantKey,
      });
      continue;
    }

    sections.push({
      compositionItemId: item.id,
      sortOrder: item.sortOrder,
      moduleKey: item.module.key,
      variantKey: item.variantKey,
      content: parsedSection.data,
    });
  }

  return {
    status: "ready",
    model: {
      schemaVersion: parsedContent.data.schema_version,
      sections: sections.sort((left, right) => left.sortOrder - right.sortOrder),
    },
  };
}

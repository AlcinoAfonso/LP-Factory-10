import type { LandingPageComposition } from "./contracts";
import {
  validateLandingPageComposition,
  type LandingPageCompositionValidationReason,
  type LandingPageSectionConfig,
} from "./composition-validator";
import { landingPageSectionRegistry } from "./registry";
import {
  landingPageContentV1Schema,
  type LandingPageSectionContent,
  type LandingPageSectionVariant,
} from "./schemas";

export type LandingPageRenderSection = {
  compositionItemId: string;
  sortOrder: number;
  moduleKey: string;
  variantKey: LandingPageSectionVariant;
  config: LandingPageSectionConfig;
  content: LandingPageSectionContent;
};

export type LandingPageRenderModel = {
  schemaVersion: 1;
  channel: "landing_page";
  sections: LandingPageRenderSection[];
};

export type LandingPageRenderModelResult =
  | { status: "ready"; model: LandingPageRenderModel }
  | {
      status: "invalid";
      reason:
        | "content_schema_invalid"
        | "composition_item_duplicate"
        | "composition_item_unknown"
        | "composition_item_missing"
        | "composition_order_invalid"
        | "config_json_invalid"
        | "section_registry_invalid"
        | "section_content_invalid";
    };

export function buildLandingPageRenderModel(input: {
  composition: LandingPageComposition;
  contentJson: unknown;
  logSafeWarning?: (message: string, details: Record<string, unknown>) => void;
}): LandingPageRenderModelResult {
  const parsedComposition = validateLandingPageComposition(input.composition);
  if (parsedComposition.status !== "valid") {
    return {
      status: "invalid",
      reason: parsedComposition.reason,
    };
  }

  const parsedContent = landingPageContentV1Schema.safeParse(input.contentJson);
  if (!parsedContent.success) {
    return { status: "invalid", reason: "content_schema_invalid" };
  }

  const compositionItems = new Map(
    parsedComposition.items.map((item) => [item.id, item]),
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

  const sections: LandingPageRenderSection[] = [];

  for (const item of parsedComposition.items) {
    const registryEntry = landingPageSectionRegistry[item.variantKey];
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
      input.logSafeWarning?.("optional landing page section omitted", {
        compositionItemId: item.id,
        variantKey: item.variantKey,
      });
      continue;
    }

    sections.push({
      compositionItemId: item.id,
      sortOrder: item.sortOrder,
      moduleKey: item.moduleKey,
      variantKey: item.variantKey,
      config: item.config,
      content: parsedSection.data,
    });
  }

  return {
    status: "ready",
    model: {
      schemaVersion: parsedContent.data.schema_version,
      channel: parsedContent.data.channel,
      sections: sections.sort((left, right) => left.sortOrder - right.sortOrder),
    },
  };
}

export type { LandingPageCompositionValidationReason };

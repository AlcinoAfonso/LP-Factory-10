export const COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY = "commercial_activation" as const;
export const COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE = "business_buyer" as const;
export const COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS = [
  "strategic_core",
  "lp_overview",
  "lp_sections",
  "seo",
] as const;

export type ContentTemplateScope = "page" | "section";
export type ContentTemplateStatus = "draft" | "active" | "archived";
export type ContentCompositionStatus = "draft" | "active" | "archived";
export type ContentArtifactStatus = "draft" | "published" | "archived";
export type CommercialActivationResearchBlock =
  (typeof COMMERCIAL_ACTIVATION_RESEARCH_BLOCKS)[number];

export type ContentTemplate = {
  id: string;
  key: string;
  slug: string;
  name: string;
  family: typeof COMMERCIAL_ACTIVATION_TEMPLATE_FAMILY;
  scope: ContentTemplateScope;
  status: ContentTemplateStatus;
  version: number;
  isActive: boolean;
  payload: Record<string, unknown>;
};

export type ContentCompositionItem = {
  id: string;
  module: ContentTemplate;
  variantKey: string;
  sortOrder: number;
  isRequired: boolean;
  config: Record<string, unknown>;
};

export type ContentComposition = {
  id: string;
  template: ContentTemplate;
  taxonId: string;
  version: number;
  status: ContentCompositionStatus;
  items: ContentCompositionItem[];
};

export type ContentResearchSource = {
  researchId: string;
  block: CommercialActivationResearchBlock;
  version: number;
};

export type PublishedContentArtifact = {
  id: string;
  templateId: string;
  compositionId: string;
  taxonId: string;
  audienceScope: typeof COMMERCIAL_ACTIVATION_AUDIENCE_SCOPE;
  templateVersion: number;
  compositionVersion: number;
  researchVersion: number;
  artifactVersion: number;
  content: Record<string, unknown>;
  provenance: Record<string, unknown>;
  researchSources: ContentResearchSource[];
  publishedAt: string;
};

export type CommercialActivationBundle = {
  composition: ContentComposition;
  artifact: PublishedContentArtifact;
};

export type CommercialActivationBundleResult =
  | { status: "ready"; bundle: CommercialActivationBundle }
  | {
      status:
        | "composition_not_found"
        | "composition_invalid"
        | "artifact_not_found"
        | "artifact_invalid"
        | "read_failed";
    };

export type CommercialActivationContentTaxon = {
  id: string;
  parentId: string | null;
  isActive: boolean;
};

export type CommercialActivationHierarchicalResolutionState =
  | "ready"
  | "fallback_taxon_not_found"
  | "fallback_taxon_inactive"
  | "fallback_no_ready_bundle"
  | "fallback_cycle_detected"
  | "fallback_read_failed";

export type CommercialActivationHierarchicalResolutionResult = {
  status: CommercialActivationHierarchicalResolutionState;
  original_taxon_id: string;
  resolved_content_taxon_id: string | null;
  bundle: CommercialActivationBundle | null;
};

export const COMMERCIAL_RESEARCH_BLOCKS = [
  "strategic_core",
  "lp_overview",
  "lp_sections",
  "seo",
] as const;

export type CommercialResearchBlock = (typeof COMMERCIAL_RESEARCH_BLOCKS)[number];

export type CommercialResearchItem = {
  key: string;
  text: string;
  priority: number;
  sortOrder: number;
};

export type CommercialResearch = Record<
  CommercialResearchBlock,
  CommercialResearchItem[]
>;

export type CommercialResearchSource = {
  researchId: string;
  taxonId: string;
  block: CommercialResearchBlock;
  version: number;
};

export type CommercialTemplateDefinition = {
  key: "account_dashboard.commercial_page";
  version: 1;
  name: "Account Dashboard - Pagina comercial";
  channel: "account_dashboard";
  objective: "commercial_page";
  audienceScope: "business_buyer";
  outputFields: readonly [
    "headline",
    "primary_promise",
    "context",
    "commercial_cards",
    "primary_cta",
    "secondary_cta",
    "proof_or_benefit_blocks",
    "missing_data_alerts",
  ];
};

export type CommercialTaxon = {
  taxonId: string;
  parentId: string | null;
  name: string;
  slug: string;
  level: "segment" | "niche" | "ultra_niche";
};

export type CommercialResearchCandidate = {
  taxonId: string;
  research: CommercialResearch;
  researchSources: CommercialResearchSource[];
};

export type CommercialTemplateResolutionSource =
  | "resolved_taxon"
  | "parent"
  | "ancestor"
  | "generic";

export type CommercialTemplateResolution = {
  template: CommercialTemplateDefinition;
  research: CommercialResearch;
  source: CommercialTemplateResolutionSource;
  accountTaxon: CommercialTaxon | null;
  researchTaxon: CommercialTaxon | null;
  researchSources: CommercialResearchSource[];
  fallbackDepth: number | null;
  missingDataAlerts: string[];
};

export type CommercialContentCard = {
  key: string;
  title: string;
  body: string;
};

export type CommercialContentAction = {
  label: string;
  supportingText: string;
};

export type CommercialContentBlock = {
  key: string;
  title: string;
  body: string;
};

export type CommercialGeneratedContent = {
  headline: string;
  primaryPromise: string;
  context: string;
  commercialCards: CommercialContentCard[];
  primaryCta: CommercialContentAction;
  secondaryCta: CommercialContentAction;
  proofOrBenefitBlocks: CommercialContentBlock[];
  missingDataAlerts: string[];
};

export type CommercialGeneratedArtifactIdentity = {
  templateKey: CommercialTemplateDefinition["key"];
  templateVersion: CommercialTemplateDefinition["version"];
  audienceScope: CommercialTemplateDefinition["audienceScope"];
  locale: string;
  source: CommercialTemplateResolutionSource;
  researchTaxonId: string | null;
  researchSources: CommercialResearchSource[];
};

export type CommercialGeneratedArtifactDraft = {
  identity: CommercialGeneratedArtifactIdentity;
  contentSchemaVersion: "account_dashboard.commercial_page.v1";
  content: CommercialGeneratedContent;
};

export type CommercialContentValidationResult =
  | {
      ok: true;
      content: CommercialGeneratedContent;
    }
  | {
      ok: false;
      errors: string[];
    };

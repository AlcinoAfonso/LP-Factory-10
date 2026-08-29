import type {
  LandingPageInputCatalogTaxonChain,
  LandingPageInputCatalogTaxonIdentity,
  LandingPageOfferingScope,
} from "../input-catalog";
import type {
  EndCustomerResearchContent,
  TaxonPreparationResult,
} from "../taxon-preparation";
import type { MatchBusinessTaxonsResult } from "../../../onboarding/niche-resolution";

export const landingPageKnowledgeResolutionStatuses = [
  "specialized_deep",
  "base_only",
  "dynamic_required",
] as const;

export type LandingPageKnowledgeResolutionStatus =
  (typeof landingPageKnowledgeResolutionStatuses)[number];

export type LandingPageKnowledgeFallbackReason =
  | "single_no_match"
  | "single_weak_match"
  | "single_ambiguous_match"
  | "single_low_confidence"
  | "single_specialized_unprepared"
  | "single_catalog_inequivalent"
  | "multiple_scope"
  | "portfolio_scope";

export type LandingPageKnowledgeMatchProvenance = Readonly<{
  taxonId: string;
  taxonName: string;
  taxonSlug: string;
  matchSource: string;
  matchedAliases: readonly string[];
  score: number;
}>;

export type LandingPageKnowledgeResearchSource = Readonly<{
  taxonId: string;
  taxonSlug: string;
  selectedResearchVersion: number;
  reviewedInputCatalogVersion: number;
  effectiveInputCatalogVersion: number;
  research: EndCustomerResearchContent;
}>;

export type LandingPageKnowledgeResolutionValue = Readonly<{
  status: LandingPageKnowledgeResolutionStatus;
  mode: LandingPageOfferingScope["mode"];
  offeringInvalidated: false;
  servedTaxon: LandingPageInputCatalogTaxonIdentity;
  effectiveInputCatalogVersion: number;
  researchSource: LandingPageKnowledgeResearchSource;
  matchProvenance: readonly LandingPageKnowledgeMatchProvenance[];
  fallbackReason: LandingPageKnowledgeFallbackReason | null;
  dynamicTarget: Readonly<{
    mode: "single" | "multiple";
    offerings: readonly string[];
  }> | null;
}>;

export type LandingPageKnowledgeResolutionErrorCode =
  | "INVALID_OFFERING_SCOPE"
  | "TAXONOMY_READ_FAILED"
  | "BASE_PREPARATION_FAILED"
  | "MATCH_FAILED"
  | "SPECIALIZED_PREPARATION_FAILED"
  | "INPUT_CATALOG_RESOLUTION_FAILED";

export type LandingPageKnowledgeResolutionResult =
  | Readonly<{ ok: true; value: LandingPageKnowledgeResolutionValue }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: LandingPageKnowledgeResolutionErrorCode;
        causeCode: string | null;
        message: string;
      }>;
    }>;

export type LandingPageKnowledgeTaxonomyResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        selected: LandingPageInputCatalogTaxonIdentity;
        taxons: readonly LandingPageInputCatalogTaxonIdentity[];
        chain: LandingPageInputCatalogTaxonChain;
      }>;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{ code: string; message: string }>;
    }>;

export type LandingPageKnowledgeResolutionPorts = Readonly<{
  readTaxonomy: (
    taxonId: string,
  ) => Promise<LandingPageKnowledgeTaxonomyResult>;
  matchTaxons: (
    offering: string,
    limit: number,
  ) => Promise<MatchBusinessTaxonsResult>;
  loadPreparation: (
    taxonId: string,
    taxonChain: LandingPageInputCatalogTaxonChain,
  ) => Promise<TaxonPreparationResult>;
}>;

export type ResolveLandingPageKnowledgeInput = Readonly<{
  servedTaxonId: string;
  offeringScope: unknown;
  currentInputCatalogVersion: number;
}>;

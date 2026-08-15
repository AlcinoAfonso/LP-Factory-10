export const END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE = "end_customer" as const;

export type EndCustomerResearchTaxonIdentity = Readonly<{
  slug: string;
  isActive: boolean;
}>;

export type LoadEndCustomerResearchCandidateInput = Readonly<{
  taxon: EndCustomerResearchTaxonIdentity;
  researchVersion: number;
}>;

export type EndCustomerResearchContent = Readonly<{
  taxonSlug: string;
  audienceScope: typeof END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE;
  researchVersion: number;
  relativePath: string;
  content: string;
}>;

export type EndCustomerResearchErrorCode =
  | "INVALID_TAXON_SLUG"
  | "TAXON_INACTIVE"
  | "INVALID_RESEARCH_VERSION"
  | "PATH_OUTSIDE_RESEARCH_ROOT"
  | "FILE_NOT_FOUND"
  | "READ_FAILED"
  | "METADATA_INVALID"
  | "CONTENT_EMPTY";

export type LoadEndCustomerResearchCandidateResult =
  | Readonly<{
      ok: true;
      value: EndCustomerResearchContent;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: EndCustomerResearchErrorCode;
        message: string;
      }>;
    }>;

export type SelectedEndCustomerResearchErrorCode =
  | "FEATURE_DISABLED"
  | "INVALID_TAXON_ID"
  | "TAXON_NOT_FOUND"
  | "TAXON_INACTIVE"
  | "TAXON_IDENTITY_INVALID"
  | "SELECTION_ABSENT"
  | "SELECTED_VERSION_INVALID"
  | "DATABASE_READ_FAILED"
  | "FILE_NOT_FOUND"
  | "FILESYSTEM_READ_FAILED"
  | "METADATA_INVALID"
  | "CONTENT_EMPTY";

export type LoadSelectedEndCustomerResearchResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        taxonId: string;
        taxonSlug: string;
        taxonName?: string;
        taxonLevel?: "segment" | "niche" | "ultra_niche";
        parentTaxonId?: string | null;
        selectedResearchVersion: number;
        selectedResearchValid: true;
        reviewedInputCatalogVersion?: number | null;
        research: EndCustomerResearchContent;
      }>;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: SelectedEndCustomerResearchErrorCode;
        message: string;
      }>;
    }>;

import type {
  LandingPageInputCatalogTaxonIdentity,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputFieldProvenance,
  LandingPageInputValueType,
} from "../conversion-content/landing-page/input-catalog";
import type { LandingPageRootSemanticRoleKey } from "../conversion-content/landing-page";

export const LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION = 4 as const;

export type LandingPageGenerationAuthorizedResearch = Readonly<{
  taxonSlug: string;
  audienceScope: "end_customer";
  researchVersion: number;
  content: string;
}>;

export type LandingPageGenerationAuthorizedFact = Readonly<{
  fieldKey: string;
  purpose: string;
  valueType: LandingPageInputValueType;
  value: unknown;
  source: "authoritative" | "configuration";
  provenance: readonly LandingPageInputFieldProvenance[];
}>;

export type LandingPageGenerationEditorialRole = Readonly<{
  key: LandingPageRootSemanticRoleKey;
  recommended: Readonly<{ min: number; max: number }>;
  absoluteMax: number;
}>;

export type LandingPageGenerationContextPackage = Readonly<{
  contractVersion: typeof LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION;
  identities: Readonly<{
    accountId: string;
    landingPage: Readonly<{
      id: string;
      status: "draft" | "active";
    }>;
    planKey: string;
    servedTaxon: LandingPageInputCatalogTaxonIdentity;
    taxonChain: LandingPageInputCatalogTaxonChain;
    sharedCatalogVersion: number | null;
    landingPageCatalogVersion: number;
    effectiveInputCatalogVersion: number;
    sharedRevision: number | null;
    landingPageRevision: number;
    rootVersion: number;
    endCustomerResearchVersion: number;
  }>;
  modelContext: Readonly<{
    research: LandingPageGenerationAuthorizedResearch;
    facts: readonly LandingPageGenerationAuthorizedFact[];
    editorialLimits: Readonly<{
      semanticRoles: readonly LandingPageGenerationEditorialRole[];
      semanticHierarchy: readonly ["h1", "h2", "h3"];
    }>;
  }>;
  serverContext: Readonly<{
    facts: readonly LandingPageGenerationAuthorizedFact[];
  }>;
}>;

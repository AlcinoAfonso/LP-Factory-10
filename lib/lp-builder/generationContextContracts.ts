import type {
  LandingPageInputCatalogTaxonIdentity,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputFieldProvenance,
  LandingPageInputValueType,
} from "../conversion-content/landing-page/input-catalog";
import type {
  TaxonPreparationResult,
} from "../conversion-content/landing-page/taxon-preparation";
import type {
  LandingPageRootSemanticRoleKey,
} from "../conversion-content/landing-page";
import type {
  AccountLandingPage,
  AccountLandingPageOnboardingRevalidationAuthority,
  AccountLandingPageOperationalRevalidationAuthority,
  AccountLandingPageOnboardingValueSource,
} from "./contracts";
import type { OperationalLandingPageStatus } from "../types/status";

export const LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION = 4 as const;
export const LANDING_PAGE_GENERATION_CONTEXT_LEGACY_CONTRACT_VERSION = 3 as const;

export type LandingPageGenerationContextFailureCode =
  | "INVALID_INPUT"
  | "LANDING_PAGE_NOT_DRAFT"
  | "CONFIGURATION_NOT_BOUND"
  | "CONFIGURATION_INCOMPLETE"
  | "CONFIGURATION_REVALIDATION_REQUIRED"
  | "INPUT_CATALOG_INCOMPATIBLE"
  | "ROOT_UNAVAILABLE"
  | "TAXON_PREPARATION_UNAVAILABLE"
  | "ACCOUNT_CONTEXT_UNAUTHORIZED"
  | "LANDING_PAGE_NOT_FOUND"
  | "CONTEXT_READ_FAILED";

export type CompileLandingPageGenerationContextInput = Readonly<{
  landingPage: AccountLandingPage;
  revalidationAuthority: AccountLandingPageOperationalRevalidationAuthority;
  preparation: TaxonPreparationResult;
}>;

export type CompileLegacyLandingPageGenerationContextInput = Readonly<{
  landingPage: AccountLandingPage;
  revalidationAuthority: AccountLandingPageOnboardingRevalidationAuthority;
  preparation: TaxonPreparationResult;
}>;

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
  source: Exclude<AccountLandingPageOnboardingValueSource, "missing">;
  provenance: readonly LandingPageInputFieldProvenance[];
}>;

export type LandingPageGenerationEditorialRole = Readonly<{
  key: LandingPageRootSemanticRoleKey;
  recommended: Readonly<{ min: number; max: number }>;
  absoluteMax: number;
}>;

type LandingPageGenerationContextCommon = Readonly<{
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

export type LandingPageGenerationContextPackageV4 =
  LandingPageGenerationContextCommon & Readonly<{
  contractVersion: typeof LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION;
  identities: Readonly<{
    accountId: string;
    landingPage: Readonly<{
      id: string;
      status: OperationalLandingPageStatus;
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
}>;

export type LandingPageGenerationContextPackageV3 =
  LandingPageGenerationContextCommon & Readonly<{
    contractVersion: typeof LANDING_PAGE_GENERATION_CONTEXT_LEGACY_CONTRACT_VERSION;
    identities: Readonly<{
      accountId: string;
      landingPage: Readonly<{
        id: string;
        status: OperationalLandingPageStatus;
      }>;
      planKey: string;
      servedTaxon: LandingPageInputCatalogTaxonIdentity;
      taxonChain: LandingPageInputCatalogTaxonChain;
      historicalConfigurationCatalogVersion: number;
      effectiveInputCatalogVersion: number;
      configurationRevision: number;
      rootVersion: number;
      endCustomerResearchVersion: number;
    }>;
  }>;

export type LandingPageGenerationContextPackage =
  | LandingPageGenerationContextPackageV3
  | LandingPageGenerationContextPackageV4;

export type CompileLandingPageGenerationContextResult =
  | Readonly<{ ok: true; value: LandingPageGenerationContextPackage }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: LandingPageGenerationContextFailureCode;
        message: string;
      }>;
    }>;

export type CompileLandingPageGenerationContextForDraftInput = Readonly<{
  accountId: string;
  landingPageId: string;
  requestId?: string;
}>;

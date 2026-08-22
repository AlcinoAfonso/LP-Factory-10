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
  AccountLandingPageOperationalRevalidationAuthority,
  AccountLandingPageOnboardingValueSource,
} from "./contracts";
import type { OperationalLandingPageStatus } from "../types/status";

export const LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION = 4 as const;

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

type LandingPageGenerationContextIdentitiesBase = Readonly<{
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
    rootVersion: number;
    endCustomerResearchVersion: number;
}>;

export type LandingPageGenerationContextIdentitiesV3 =
  LandingPageGenerationContextIdentitiesBase &
    Readonly<{ configurationRevision: number }>;

export type LandingPageGenerationContextIdentitiesV4 =
  LandingPageGenerationContextIdentitiesBase &
    Readonly<{
      sharedRevision: number;
      landingPageRevision: number;
    }>;

export type LandingPageGenerationContextPackage = Readonly<{
  contractVersion: typeof LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION;
  identities: LandingPageGenerationContextIdentitiesV4;
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

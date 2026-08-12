import type {
  LandingPageInputCatalogTaxonIdentity,
  LandingPageInputFieldProvenance,
  LandingPageInputValueType,
} from "../conversion-content/landing-page/input-catalog";
import type {
  LandingPageResearchResolutionResult,
  ResolvedLandingPageResearchAudience,
} from "../conversion-content/landing-page/research-resolution";
import type {
  LandingPageRootSemanticRoleKey,
} from "../conversion-content/landing-page";
import type {
  AccountLandingPage,
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingValueSource,
} from "./contracts";

export const LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION = 2 as const;
export const LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION = 2 as const;

export type LandingPageGenerationContextFailureCode =
  | "INVALID_INPUT"
  | "LANDING_PAGE_NOT_DRAFT"
  | "CONFIGURATION_NOT_BOUND"
  | "CONFIGURATION_INCOMPLETE"
  | "INPUT_CATALOG_INCOMPATIBLE"
  | "ROOT_UNAVAILABLE"
  | "RESEARCH_UNAVAILABLE"
  | "ACCOUNT_CONTEXT_UNAUTHORIZED"
  | "LANDING_PAGE_NOT_FOUND"
  | "CONTEXT_READ_FAILED";

export type CompileLandingPageGenerationContextInput = Readonly<{
  landingPage: AccountLandingPage;
  configuration: AccountLandingPageOnboardingConfiguration;
  research: LandingPageResearchResolutionResult;
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

export type LandingPageGenerationContextPackage = Readonly<{
  contractVersion: typeof LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION;
  identities: Readonly<{
    accountId: string;
    landingPage: Readonly<{ id: string; status: "draft" }>;
    planKey: string;
    servedTaxon: LandingPageInputCatalogTaxonIdentity;
    catalogVersion: typeof LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION;
    configurationRevision: number;
    rootVersion: number;
    endCustomerResearchVersion: number;
  }>;
  modelContext: Readonly<{
    research: ResolvedLandingPageResearchAudience;
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

import type {
  LandingPageFunnelCopyProfile,
  LandingPageModuleDefinition,
  LandingPageVariantDefinition,
  LandingPageVariantFieldContract,
} from "../conversion-content/landing-page/module-catalog";
import type {
  LandingPageGenerationProfileItem,
  ResolveLandingPageGenerationProfileResult,
} from "../conversion-content/landing-page/generation-profile";
import type {
  LandingPageInputCapabilityBinding,
  LandingPageInputCatalogTaxonIdentity,
  LandingPageInputFieldProvenance,
} from "../conversion-content/landing-page/input-catalog";
import type {
  LandingPageResearchResolutionResult,
  ResolvedLandingPageResearch,
} from "../conversion-content/landing-page/research-resolution";
import type {
  LandingPageRootParameters,
} from "../conversion-content/landing-page";
import type {
  AccountLandingPage,
  AccountLandingPageOnboardingConfiguration,
  AccountLandingPageOnboardingValueSource,
} from "./contracts";

export const LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION = 1 as const;
export const LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION = 2 as const;
export const LANDING_PAGE_GENERATION_BINDING_CATALOG_VERSION = 3 as const;

export type LandingPageGenerationContextFailureCode =
  | "INVALID_INPUT"
  | "LANDING_PAGE_NOT_DRAFT"
  | "CONFIGURATION_NOT_BOUND"
  | "CONFIGURATION_INCOMPLETE"
  | "BINDING_CATALOG_UNAVAILABLE"
  | "BINDING_CATALOG_INCOMPATIBLE"
  | "ROOT_UNAVAILABLE"
  | "FUNNEL_PROFILE_UNAVAILABLE"
  | "RESEARCH_UNAVAILABLE"
  | "GENERATION_PROFILE_READ_FAILED"
  | "GENERATION_PROFILE_ABSENT"
  | "GENERATION_PROFILE_INVALID"
  | "MODULE_CATALOG_UNAVAILABLE"
  | "MODULE_VARIANT_AMBIGUOUS"
  | "ACCOUNT_CONTEXT_UNAUTHORIZED"
  | "LANDING_PAGE_NOT_FOUND"
  | "CONTEXT_READ_FAILED";

export type CompileLandingPageGenerationContextInput = Readonly<{
  landingPage: AccountLandingPage;
  configuration: AccountLandingPageOnboardingConfiguration;
  research: LandingPageResearchResolutionResult;
  generationProfile: ResolveLandingPageGenerationProfileResult;
}>;

export type LandingPageGenerationSelectionDecision = Readonly<{
  recommendation: LandingPageGenerationProfileItem;
  decision: "selected" | "omitted";
  cause:
    | "preferred_variant_eligible"
    | "single_eligible_alternative"
    | "no_contextually_eligible_variant";
  effectiveVariantKey?: string;
}>;

export type LandingPageGenerationSelectedModule = Readonly<{
  recommendedOrder: number;
  priority: LandingPageGenerationProfileItem["priority"];
  recommendedVariantKey?: string;
  effectiveVariantKey: string;
  module: LandingPageModuleDefinition;
  variant: LandingPageVariantDefinition;
  effectiveRoot: LandingPageRootParameters;
  fieldContract: LandingPageVariantFieldContract;
}>;

export type LandingPageGenerationAuthorizedFact = Readonly<{
  fieldKey: string;
  value: unknown;
  purpose: string;
  source: Exclude<AccountLandingPageOnboardingValueSource, "missing">;
  provenance: readonly LandingPageInputFieldProvenance[];
  capabilityBindings?: readonly LandingPageInputCapabilityBinding[];
}>;

export type LandingPageGenerationAuthorizedModuleContext = Readonly<{
  moduleKey: string;
  effectiveVariantKey: string;
  itemGuidance?: string;
  funnelCopyProfile: LandingPageFunnelCopyProfile;
}>;

export type LandingPageBrandColorPalette = Readonly<{
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}>;

export type LandingPageGenerationContextPackage = Readonly<{
  contractVersion: typeof LANDING_PAGE_GENERATION_CONTEXT_CONTRACT_VERSION;
  partA: Readonly<{
    landingPage: Readonly<{
      id: string;
      accountId: string;
      status: "draft";
    }>;
    planKey: string;
    servedTaxon: LandingPageInputCatalogTaxonIdentity;
    generationProfile: Readonly<{
      profileId: string;
      ownerTaxonId: string;
      relation: "own" | "inherited";
    }>;
    versions: Readonly<{
      valuesInputCatalogVersion: typeof LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION;
      bindingInputCatalogVersion: typeof LANDING_PAGE_GENERATION_BINDING_CATALOG_VERSION;
      rootVersion: number;
      moduleCatalogVersion: number;
      generationProfileVersion: number;
      research: ResolvedLandingPageResearch["versions"];
    }>;
    root: LandingPageRootParameters;
    presentation: Readonly<{
      brandColorPalette: LandingPageBrandColorPalette;
      privacyPolicyUrl?: string;
    }>;
    selection: readonly LandingPageGenerationSelectionDecision[];
    modules: readonly LandingPageGenerationSelectedModule[];
  }>;
  partB: Readonly<{
    research: ResolvedLandingPageResearch;
    facts: readonly LandingPageGenerationAuthorizedFact[];
    capabilitySupport: readonly Readonly<{
      slotKey: "applicable_capabilities";
      fieldKeys: readonly string[];
    }>[];
    generationGuidance?: string;
    modules: readonly LandingPageGenerationAuthorizedModuleContext[];
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

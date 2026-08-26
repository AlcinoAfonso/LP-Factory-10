import type {
  LandingPageInputCatalogPlan,
  LandingPageInputCatalogTaxonChain,
  LandingPageInputCatalogTaxonIdentity,
  ResolvedLandingPageInputCatalog,
} from "../input-catalog";

export const END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE = "end_customer" as const;

export const INPUT_CATALOG_EVALUATION_SCHEMA_VERSION = 1 as const;
export const inputCatalogEvaluationModes = ["systematic", "hypothesis"] as const;
export const inputCatalogEvaluationStatuses = [
  "sufficient",
  "candidate_gaps",
  "inconclusive",
] as const;
export const inputCatalogEvaluationCandidateOrigins = [
  "systematic",
  "human_hypothesis",
  "incidental",
] as const;
export const inputCatalogEvaluationCandidateConclusions = [
  "covered",
  "refine_existing_field",
  "possible_new_field",
  "inconclusive",
] as const;
export const inputCatalogEvaluationTaxonomicLayers = [
  "universal",
  "segment",
  "niche",
  "ultra_niche",
] as const;

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

export type TaxonPreparationErrorCode =
  | SelectedEndCustomerResearchErrorCode
  | "INPUT_CATALOG_REVIEW_DISABLED"
  | "REQUIRED_INPUT_CATALOG_VERSION_INVALID"
  | "REQUIRED_INPUT_CATALOG_VERSION_NOT_EXECUTABLE"
  | "INPUT_CATALOG_REVIEW_ABSENT"
  | "INPUT_CATALOG_REVIEW_VERSION_MISMATCH"
  | "INPUT_CATALOG_TRANSITION_REVIEW_REQUIRED";

export type DeriveTaxonPreparationForVersionInput = Readonly<{
  selectedResearch: LoadSelectedEndCustomerResearchResult;
  requiredInputCatalogVersion: number;
}>;

export type DeriveEffectiveTaxonPreparationInput = Readonly<{
  selectedResearch: LoadSelectedEndCustomerResearchResult;
  currentInputCatalogVersion: number;
  taxonChain: LandingPageInputCatalogTaxonChain;
}>;

export type TaxonPreparationResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        prepared: true;
        taxonId: string;
        taxonSlug: string;
        selectedResearchVersion: number;
        reviewedInputCatalogVersion: number;
        requiredInputCatalogVersion: number;
        effectiveInputCatalogVersion: number;
        transitionClassification:
          | "no_material_change"
          | "compatible_evolution";
        research: EndCustomerResearchContent;
      }>;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: TaxonPreparationErrorCode;
        message: string;
      }>;
    }>;

export type InputCatalogEvaluationMode =
  (typeof inputCatalogEvaluationModes)[number];
export type InputCatalogEvaluationStatus =
  (typeof inputCatalogEvaluationStatuses)[number];
export type InputCatalogEvaluationCandidateOrigin =
  (typeof inputCatalogEvaluationCandidateOrigins)[number];
export type InputCatalogEvaluationCandidateConclusion =
  (typeof inputCatalogEvaluationCandidateConclusions)[number];
export type InputCatalogEvaluationTaxonomicLayer =
  (typeof inputCatalogEvaluationTaxonomicLayers)[number];

export type InputCatalogEvaluationCandidate = Readonly<{
  origin: InputCatalogEvaluationCandidateOrigin;
  conclusion: InputCatalogEvaluationCandidateConclusion;
  factualNeed: string;
  relatedFields: readonly string[];
  currentCoverage: string;
  allegedInsufficiency: string | null;
  evidence: string;
  expectedOperationalSource: string | null;
  realConsumer: string | null;
  concreteHarm: string | null;
  suggestedTaxonomyLayer: InputCatalogEvaluationTaxonomicLayer | null;
  uncertainties: readonly string[];
}>;

export type InputCatalogEvaluationOutput = Readonly<{
  schemaVersion: typeof INPUT_CATALOG_EVALUATION_SCHEMA_VERSION;
  status: InputCatalogEvaluationStatus;
  mode: InputCatalogEvaluationMode;
  summary: string;
  candidates: readonly InputCatalogEvaluationCandidate[];
  followUpQuestion: string | null;
}>;

export type ParseInputCatalogEvaluationOutputResult =
  | Readonly<{ ok: true; value: InputCatalogEvaluationOutput }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "INVALID_JSON" | "INVALID_SCHEMA" | "INVALID_SEMANTICS";
        message: string;
      }>;
    }>;

export type InputCatalogEvaluationTaxonChainSnapshot = Readonly<{
  segment: LandingPageInputCatalogTaxonIdentity;
  niche: LandingPageInputCatalogTaxonIdentity | null;
  ultraNiche: LandingPageInputCatalogTaxonIdentity | null;
}>;

export type InputCatalogEvaluationContextIdentity = Readonly<{
  taxonId: string;
  taxonSlug: string;
  taxonChain: InputCatalogEvaluationTaxonChainSnapshot;
  research: Readonly<{
    taxonSlug: string;
    audienceScope: typeof END_CUSTOMER_RESEARCH_AUDIENCE_SCOPE;
    researchVersion: number;
    relativePath: string;
    content: string;
  }>;
  inputCatalog: Readonly<{
    version: number;
    plans: readonly LandingPageInputCatalogPlan[];
    catalogs: readonly ResolvedLandingPageInputCatalog[];
  }>;
}>;

export type InputCatalogEvaluationContext = Readonly<{
  identity: InputCatalogEvaluationContextIdentity;
}>;

export type InputCatalogEvaluationContextErrorCode =
  | "AUTHORIZED_RESEARCH_INVALID"
  | "CONTEXT_IDENTITY_INVALID"
  | "INPUT_CATALOG_VERSION_INVALID"
  | "INPUT_CATALOG_VERSION_NOT_EXECUTABLE"
  | "INPUT_CATALOG_RESOLUTION_FAILED"
  | "INPUT_CATALOG_PLAN_PROJECTIONS_DIVERGED"
  | "CONTEXT_SNAPSHOT_FAILED";

export type BuildInputCatalogEvaluationContextResult =
  | Readonly<{ ok: true; value: InputCatalogEvaluationContext }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: InputCatalogEvaluationContextErrorCode;
        message: string;
      }>;
    }>;

export type InputCatalogEvaluationFeedback = Readonly<{
  text: string;
  previousOutput: unknown;
  previousContextIdentity: InputCatalogEvaluationContextIdentity;
}>;

export type InputCatalogEvaluationExecutionRequest = Readonly<{
  taxonId: string;
  inputCatalogVersion: number;
  mode: InputCatalogEvaluationMode;
  focalHypothesis?: string | null;
  feedback?: InputCatalogEvaluationFeedback | null;
}>;

export type InputCatalogEvaluationReconstructionInput = Readonly<{
  taxonId: string;
  inputCatalogVersion: number;
}>;

export type InputCatalogEvaluationPrompt = Readonly<{
  version: "e20.6.5-input-catalog-evaluation-v1";
  instructions: string;
  input: string;
}>;

export type InputCatalogEvaluationProviderRequest = Readonly<{
  mode: InputCatalogEvaluationMode;
  prompt: InputCatalogEvaluationPrompt;
  outputSchema: Readonly<Record<string, unknown>>;
}>;

export type InputCatalogEvaluationProviderResult =
  | Readonly<{ status: "completed"; output: unknown }>
  | Readonly<{ status: "refusal"; message: string }>
  | Readonly<{ status: "incomplete"; message: string }>
  | Readonly<{ status: "failure"; message: string }>;

export type InputCatalogEvaluationPorts = Readonly<{
  reconstructContext: (
    input: InputCatalogEvaluationReconstructionInput,
  ) => Promise<BuildInputCatalogEvaluationContextResult>;
  evaluate: (
    input: InputCatalogEvaluationProviderRequest,
  ) => Promise<InputCatalogEvaluationProviderResult>;
}>;

export type CoordinateInputCatalogEvaluationResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        contextIdentity: InputCatalogEvaluationContextIdentity;
        output: InputCatalogEvaluationOutput;
      }>;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code:
          | "INVALID_REQUEST"
          | "CONTEXT_RECONSTRUCTION_FAILED"
          | "CONTEXT_STALE"
          | "PROVIDER_REFUSAL"
          | "PROVIDER_INCOMPLETE"
          | "PROVIDER_FAILURE"
          | "OUTPUT_INVALID"
          | "OUTPUT_MODE_MISMATCH";
        message: string;
      }>;
    }>;

export type RevalidateInputCatalogEvaluationContextResult =
  | Readonly<{
      ok: true;
      value: Readonly<{ contextIdentity: InputCatalogEvaluationContextIdentity }>;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "CONTEXT_RECONSTRUCTION_FAILED" | "CONTEXT_STALE";
        message: string;
      }>;
    }>;

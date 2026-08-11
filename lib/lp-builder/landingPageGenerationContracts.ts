import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import type { LandingPageGenerationContextFailureCode } from "./generationContextContracts";

export const LANDING_PAGE_DRAFT_CANDIDATE_VERSION = 1 as const;

export type LandingPageDraftTextValue = Readonly<{
  kind: "text";
  value: string | null;
}>;

export type LandingPageDraftTechnicalReferenceValue = Readonly<{
  kind: "technical_reference";
  referenceKey: string;
  value: unknown;
}>;

export type LandingPageDraftCollectionValue = Readonly<{
  kind: "collection";
  items: readonly Readonly<{
    fields: Readonly<Record<
      string,
      LandingPageDraftTextValue | LandingPageDraftTechnicalReferenceValue
    >>;
  }>[];
}>;

export type LandingPageDraftActionValue = Readonly<{
  kind: "action";
  label: string;
  binding: Readonly<{
    fieldKey: "primary_conversion_channel";
    channel: string;
    destination: unknown;
  }>;
}>;

export type LandingPageDraftImageValue = Readonly<{
  kind: "image";
  reference: unknown;
}>;

export type LandingPageDraftFieldValue =
  | LandingPageDraftTextValue
  | LandingPageDraftCollectionValue
  | LandingPageDraftActionValue
  | LandingPageDraftImageValue
  | LandingPageDraftTechnicalReferenceValue;

export type LandingPageDraftCandidate = Readonly<{
  candidateVersion: typeof LANDING_PAGE_DRAFT_CANDIDATE_VERSION;
  modules: readonly Readonly<{
    order: number;
    moduleKey: string;
    moduleVersion: number;
    variantKey: string;
    variantVersion: number;
    fieldContractKey: string;
    interactionContracts: LandingPageGenerationContextPackage["partA"]["modules"][number]["variant"]["interactionContracts"];
    fields: Readonly<Record<string, LandingPageDraftFieldValue>>;
  }>[];
}>;

export type LandingPageDraftGenerationFailureKind =
  | "configuration_invalid"
  | "request_invalid"
  | "request_too_large"
  | "http_error"
  | "timeout"
  | "incomplete"
  | "refusal"
  | "invalid_response"
  | "candidate_invalid";

export type LandingPageDraftGenerationResult =
  | Readonly<{
      ok: true;
      candidate: LandingPageDraftCandidate;
      exposedGenerationContext: Readonly<Record<string, unknown>>;
      responseId: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
    }>
  | Readonly<{
      ok: false;
      kind: LandingPageDraftGenerationFailureKind;
    }>;

export type LandingPageDraftGenerationInput = Readonly<{
  context: LandingPageGenerationContextPackage;
  actorUserId: string;
}>;

export type GenerateLandingPageDraftCandidateInput = Readonly<{
  accountId: string;
  landingPageId: string;
  requestId?: string;
}>;

export type GenerateLandingPageDraftCandidateResult =
  | Readonly<{
      ok: true;
      actorUserId: string;
      context: LandingPageGenerationContextPackage;
      candidate: LandingPageDraftCandidate;
      exposedGenerationContext: Readonly<Record<string, unknown>>;
      responseId: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
    }>
  | Readonly<{
      ok: false;
      stage: "context";
      code: LandingPageGenerationContextFailureCode;
    }>
  | Readonly<{
      ok: false;
      stage: "provider";
      kind: LandingPageDraftGenerationFailureKind;
    }>;

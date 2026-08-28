import { z } from "zod";

import {
  landingPagePresentationCandidateSchema,
} from "../conversion-content/landing-page/presentation";
import { isLandingPageOfferingScope } from "../conversion-content/landing-page/input-catalog";
import {
  isValidResolvedOpenAiImageWorkload,
  isValidResolvedOpenAiProductWorkload,
  listOpenAiWorkloadInventory,
  openAiImageQualities,
  openAiReasoningEfforts,
} from "../openai-workloads";
import type {
  LandingPageGenerationContextPackage,
  LandingPageGenerationContextPackageV3,
  LandingPageGenerationContextPackageV4,
} from "./generationContextContracts";
import type { LandingPageDraftCandidateWorkflowResult } from "./landingPageDraftCandidateWorkflow";

export const LANDING_PAGE_REVISION_CONTRACT_VERSION = 1 as const;
export const LANDING_PAGE_REVISION_SNAPSHOT_VERSION = 2 as const;
export const LANDING_PAGE_REVISION_LEGACY_SNAPSHOT_VERSION = 1 as const;
export const LANDING_PAGE_REVISION_ASSET_BUCKET =
  "landing-page-revision-assets" as const;
export const LANDING_PAGE_REVISION_ASSET_MAX_BYTES = 5_242_880 as const;

const uuidSchema = z.string().uuid();
const configurationSourceSchema = z.enum([
  "repo_catalog",
  "supabase_operational",
]);
const imageQualitySchema = z.enum(openAiImageQualities);
const reasoningEffortSchema = z.enum(openAiReasoningEfforts);

const landingPageDraftTextWorkload = resolveLandingPageDraftTextWorkload();
const landingPageDraftImageWorkload = resolveLandingPageDraftImageWorkload();

export const landingPageRevisionAssetReferenceSchema = z.object({
  bucket: z.literal(LANDING_PAGE_REVISION_ASSET_BUCKET),
  path: z.string().min(1).max(512),
  origin: z.literal("generated"),
  mimeType: z.literal("image/webp"),
  width: z.literal(1536),
  height: z.literal(1024),
  bytes: z.number().int().positive().max(LANDING_PAGE_REVISION_ASSET_MAX_BYTES),
  alt: z.string().trim().min(1).max(240),
  imageWorkload: z.literal("landing_page_draft_image_generation"),
  imageConfigVersion: z.string().trim().min(1).max(64),
  visualBriefVersion: z.string().trim().min(1).max(64),
}).strict();

const bindingSchema = z.object({
  channel: z.enum(["whatsapp", "phone", "email", "external_url"]),
  destinationFieldKey: z.enum([
    "whatsapp_destination",
    "phone_destination",
    "email_destination",
    "external_url_destination",
  ]),
  destination: z.string().trim().min(1).max(2048),
}).strict();

const taxonIdentitySchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  level: z.enum(["segment", "niche", "ultra_niche"]),
  isActive: z.boolean(),
  parentId: uuidSchema.nullable(),
}).strict();

const taxonChainSchema = z.object({
  segment: taxonIdentitySchema.extend({ level: z.literal("segment") }),
  niche: taxonIdentitySchema.extend({ level: z.literal("niche") }).optional(),
  ultraNiche: taxonIdentitySchema.extend({ level: z.literal("ultra_niche") }).optional(),
}).strict().superRefine((chain, context) => {
  if (chain.niche && chain.niche.parentId !== chain.segment.id) {
    context.addIssue({ code: "custom", path: ["niche", "parentId"], message: "niche parent mismatch" });
  }
  if (chain.ultraNiche && chain.ultraNiche.parentId !== chain.niche?.id) {
    context.addIssue({ code: "custom", path: ["ultraNiche", "parentId"], message: "ultra-niche parent mismatch" });
  }
});

const inputFactSchema = z.object({
  fieldKey: z.string().trim().min(1),
  purpose: z.string().trim().min(1),
  valueType: z.enum([
    "string", "phone", "email", "url", "enum", "string_list", "boolean",
    "number_range", "keyword_map", "asset_reference", "color_palette", "offering_scope",
  ]),
  value: z.unknown(),
  source: z.enum(["authoritative", "configuration"]),
  provenance: z.array(z.object({
    property: z.enum(["definition", "obligation", "allowedPlans", "validation"]),
    layer: z.enum(["universal", "segment", "niche", "ultra_niche"]),
    taxon: taxonIdentitySchema.optional(),
  }).strict()).min(1),
}).strict();

const generationModelContextSchema = z.object({
  research: z.object({
    taxonSlug: z.string().trim().min(1),
    audienceScope: z.literal("end_customer"),
    researchVersion: z.number().int().positive(),
    content: z.string().trim().min(1),
  }).strict(),
  facts: z.array(inputFactSchema).superRefine(assertUniqueFactKeys),
  editorialLimits: z.object({
    semanticRoles: z.array(z.object({
      key: z.enum([
        "eyebrow", "h1", "h2", "h3", "paragraph", "cta_label",
        "privacy_note", "faq_question", "faq_answer", "card_title",
        "card_body", "benefit_item", "step_label", "step_title", "step_body",
      ]),
      recommended: z.object({
        min: z.number().int().nonnegative(),
        max: z.number().int().positive(),
      }).strict().refine((range) => range.min <= range.max),
      absoluteMax: z.number().int().positive(),
    }).strict()).min(1),
    semanticHierarchy: z.tuple([z.literal("h1"), z.literal("h2"), z.literal("h3")]),
  }).strict(),
}).strict();

const generationContextV3Schema = z.object({
  contractVersion: z.literal(3),
  identities: z.object({
    accountId: uuidSchema,
    landingPage: z.object({ id: uuidSchema, status: z.enum(["draft", "active"]) }).strict(),
    planKey: z.string().trim().min(1),
    servedTaxon: taxonIdentitySchema,
    taxonChain: taxonChainSchema,
    historicalConfigurationCatalogVersion: z.number().int().positive(),
    effectiveInputCatalogVersion: z.number().int().positive(),
    configurationRevision: z.number().int().positive(),
    rootVersion: z.number().int().positive(),
    endCustomerResearchVersion: z.number().int().positive(),
  }).strict(),
  modelContext: generationModelContextSchema,
  bindingFacts: z.array(inputFactSchema).superRefine(assertUniqueFactKeys),
}).strict().superRefine(assertGenerationContextCoherence);

const generationContextV4Schema = z.object({
  contractVersion: z.literal(4),
  identities: z.object({
    accountId: uuidSchema,
    landingPage: z.object({ id: uuidSchema, status: z.enum(["draft", "active"]) }).strict(),
    planKey: z.string().trim().min(1),
    servedTaxon: taxonIdentitySchema,
    taxonChain: taxonChainSchema,
    sharedCatalogVersion: z.number().int().positive().nullable(),
    landingPageCatalogVersion: z.number().int().positive(),
    effectiveInputCatalogVersion: z.number().int().positive(),
    sharedRevision: z.number().int().positive().nullable(),
    landingPageRevision: z.number().int().positive(),
    rootVersion: z.number().int().positive(),
    endCustomerResearchVersion: z.number().int().positive(),
  }).strict().superRefine((identities, context) => {
    if ((identities.sharedRevision === null) !== (identities.sharedCatalogVersion === null)) {
      context.addIssue({ code: "custom", path: ["sharedRevision"], message: "shared provenance pair mismatch" });
    }
    if (
      identities.landingPageCatalogVersion !== identities.effectiveInputCatalogVersion ||
      (identities.sharedCatalogVersion !== null &&
        identities.sharedCatalogVersion !== identities.effectiveInputCatalogVersion)
    ) {
      context.addIssue({ code: "custom", path: ["effectiveInputCatalogVersion"], message: "catalog provenance mismatch" });
    }
  }),
  modelContext: generationModelContextSchema,
  bindingFacts: z.array(inputFactSchema).superRefine(assertUniqueFactKeys),
}).strict().superRefine(assertGenerationContextCoherence);

export const landingPageRevisionContentSchema = z.object({
  contractVersion: z.literal(LANDING_PAGE_REVISION_CONTRACT_VERSION),
  presentation: landingPagePresentationCandidateSchema,
  binding: bindingSchema,
  media: z.object({
    mainImage: landingPageRevisionAssetReferenceSchema,
  }).strict(),
}).strict();

export type LandingPageRevisionAssetReference = z.infer<
  typeof landingPageRevisionAssetReferenceSchema
>;
export type LandingPageRevisionContent = z.infer<
  typeof landingPageRevisionContentSchema
>;

type LandingPageRevisionSnapshotCommon = Readonly<{
  attemptId: string;
  requestId: string;
  generatedAt: string;
  promptVersion: string;
  presentationContractVersion: number;
  workloads: Readonly<{
    text: Readonly<{
      configuration: Extract<
        LandingPageDraftCandidateWorkflowResult,
        { ok: true }
      >["text"]["configuration"];
      responseId: string | null;
      usage: Extract<
        LandingPageDraftCandidateWorkflowResult,
        { ok: true }
      >["text"]["usage"];
      latencyMs: number;
      estimatedCost: null;
      costStatus: "unavailable";
    }>;
    image: Readonly<{
      configuration: Extract<
        LandingPageDraftCandidateWorkflowResult,
        { ok: true }
      >["image"]["configuration"];
      providerRequestId: string | null;
      latencyMs: number;
      estimatedCost: null;
      costStatus: "unavailable";
    }>;
  }>;
  media: Readonly<{ mainImage: LandingPageRevisionAssetReference }>;
  validators: Readonly<{
    presentation: "passed";
    binding: "passed";
    image: "passed";
  }>;
}>;

export type LandingPageRevisionSnapshotV2 = LandingPageRevisionSnapshotCommon &
  Readonly<{
    snapshotVersion: 2;
    generationContext: Readonly<{
      contractVersion: 4;
      identities: LandingPageGenerationContextPackageV4["identities"];
      modelContext: LandingPageGenerationContextPackageV4["modelContext"];
      bindingFacts: readonly LandingPageGenerationContextPackageV4["serverContext"]["facts"][number][];
    }>;
  }>;

export type LandingPageRevisionSnapshotV1 = LandingPageRevisionSnapshotCommon &
  Readonly<{
    snapshotVersion: 1;
    generationContext: Readonly<{
      contractVersion: 3;
      identities: Readonly<{
        accountId: string;
        landingPage: Readonly<{ id: string; status: "draft" | "active" }>;
        planKey: string;
        servedTaxon: LandingPageGenerationContextPackageV3["identities"]["servedTaxon"];
        taxonChain: LandingPageGenerationContextPackageV3["identities"]["taxonChain"];
        historicalConfigurationCatalogVersion: number;
        effectiveInputCatalogVersion: number;
        configurationRevision: number;
        rootVersion: number;
        endCustomerResearchVersion: number;
      }>;
      modelContext: LandingPageGenerationContextPackageV3["modelContext"];
      bindingFacts: readonly LandingPageGenerationContextPackageV3["serverContext"]["facts"][number][];
    }>;
  }>;

export type LandingPageRevisionSnapshot =
  | LandingPageRevisionSnapshotV1
  | LandingPageRevisionSnapshotV2;

export type BuildLandingPageRevisionDocumentsResult =
  | Readonly<{
      ok: true;
      content: LandingPageRevisionContent;
      snapshot: LandingPageRevisionSnapshot;
    }>
  | Readonly<{
      ok: false;
      error: "INVALID_ASSET_REFERENCE" | "INVALID_REVISION_DOCUMENTS";
    }>;

export function createLandingPageRevisionAssetReference(input: Readonly<{
  accountId: string;
  landingPageId: string;
  attemptId: string;
  bytes: number;
  alt: string;
  imageConfigVersion: string;
  visualBriefVersion: string;
}>): LandingPageRevisionAssetReference | null {
  if (
    !uuidSchema.safeParse(input.accountId).success ||
    !uuidSchema.safeParse(input.landingPageId).success ||
    !uuidSchema.safeParse(input.attemptId).success
  ) {
    return null;
  }
  const value = {
    bucket: LANDING_PAGE_REVISION_ASSET_BUCKET,
    path: `${input.accountId}/${input.landingPageId}/${input.attemptId}/main.webp`,
    origin: "generated",
    mimeType: "image/webp",
    width: 1536,
    height: 1024,
    bytes: input.bytes,
    alt: input.alt.trim(),
    imageWorkload: "landing_page_draft_image_generation",
    imageConfigVersion: input.imageConfigVersion.trim(),
    visualBriefVersion: input.visualBriefVersion.trim(),
  } as const;
  const parsed = landingPageRevisionAssetReferenceSchema.safeParse(value);
  return parsed.success ? deepFreeze(parsed.data) : null;
}

export function buildLandingPageRevisionDocuments(input: Readonly<{
  context: LandingPageGenerationContextPackage;
  candidate: Extract<LandingPageDraftCandidateWorkflowResult, { ok: true }>;
  asset: LandingPageRevisionAssetReference;
  generatedAt: string;
}>): BuildLandingPageRevisionDocumentsResult {
  const asset = landingPageRevisionAssetReferenceSchema.safeParse(input.asset);
  const generatedAt = normalizeIsoDate(input.generatedAt);
  if (!asset.success || !generatedAt) {
    return { ok: false, error: "INVALID_ASSET_REFERENCE" };
  }

  const contentResult = landingPageRevisionContentSchema.safeParse({
    contractVersion: LANDING_PAGE_REVISION_CONTRACT_VERSION,
    presentation: input.candidate.candidate,
    binding: input.candidate.binding,
    media: { mainImage: asset.data },
  });
  if (!contentResult.success) {
    return { ok: false, error: "INVALID_REVISION_DOCUMENTS" };
  }

  const bindingFacts = input.context.serverContext.facts.filter((fact) =>
    fact.fieldKey === "primary_conversion_channel" ||
    fact.fieldKey === input.candidate.binding.destinationFieldKey
  );
  const snapshot = toJsonValue({
    snapshotVersion:
      input.context.contractVersion === 4
        ? LANDING_PAGE_REVISION_SNAPSHOT_VERSION
        : LANDING_PAGE_REVISION_LEGACY_SNAPSHOT_VERSION,
    attemptId: input.candidate.attemptId,
    requestId: input.candidate.requestId,
    generatedAt,
    promptVersion: input.candidate.text.promptVersion,
    presentationContractVersion: input.candidate.candidate.contractVersion,
    generationContext: {
      contractVersion: input.context.contractVersion,
      identities: input.context.identities,
      modelContext: input.context.modelContext,
      bindingFacts,
    },
    workloads: {
      text: {
        configuration: input.candidate.text.configuration,
        responseId: input.candidate.text.responseId,
        usage: input.candidate.text.usage,
        latencyMs: input.candidate.text.latencyMs,
        estimatedCost: null,
        costStatus: "unavailable",
      },
      image: {
        configuration: input.candidate.image.configuration,
        providerRequestId: input.candidate.image.providerRequestId,
        latencyMs: input.candidate.image.latencyMs,
        estimatedCost: null,
        costStatus: "unavailable",
      },
    },
    media: { mainImage: asset.data },
    validators: {
      presentation: "passed",
      binding: "passed",
      image: "passed",
    },
  });
  if (!snapshot || !validateLandingPageRevisionSnapshot(snapshot)) {
    return { ok: false, error: "INVALID_REVISION_DOCUMENTS" };
  }

  return {
    ok: true,
    content: deepFreeze(contentResult.data),
    snapshot: deepFreeze(snapshot as LandingPageRevisionSnapshot),
  };
}

export function validateLandingPageRevisionSnapshot(
  value: unknown,
): value is LandingPageRevisionSnapshot {
  if (!isRecord(value) || containsForbiddenSnapshotKey(value)) return false;
  const generationContext =
    value.snapshotVersion === LANDING_PAGE_REVISION_LEGACY_SNAPSHOT_VERSION
      ? generationContextV3Schema.safeParse(value.generationContext)
      : value.snapshotVersion === LANDING_PAGE_REVISION_SNAPSHOT_VERSION
        ? generationContextV4Schema.safeParse(value.generationContext)
        : null;
  if (!generationContext?.success) return false;
  if (
    !uuidSchema.safeParse(value.attemptId).success ||
    typeof value.requestId !== "string" ||
    !value.requestId.trim() ||
    !normalizeIsoDate(typeof value.generatedAt === "string" ? value.generatedAt : "") ||
    typeof value.promptVersion !== "string" ||
    !value.promptVersion.trim() ||
    value.presentationContractVersion !== 1 ||
    !isRecord(value.workloads) ||
    !isRecord(value.workloads.text) ||
    !isRecord(value.workloads.image) ||
    !isRecord(value.media) ||
    !landingPageRevisionAssetReferenceSchema.safeParse(value.media.mainImage).success ||
    !isRecord(value.validators) ||
    value.validators.presentation !== "passed" ||
    value.validators.binding !== "passed" ||
    value.validators.image !== "passed"
  ) {
    return false;
  }
  const text = value.workloads.text;
  const image = value.workloads.image;
  return (
    isValidLandingPageDraftTextConfiguration(text.configuration) &&
    (text.responseId === null || typeof text.responseId === "string") &&
    isRecord(text.usage) &&
    isNonNegativeNumber(text.latencyMs) &&
    text.estimatedCost === null &&
    text.costStatus === "unavailable" &&
    isValidLandingPageDraftImageConfiguration(image.configuration) &&
    (image.providerRequestId === null || typeof image.providerRequestId === "string") &&
    isNonNegativeNumber(image.latencyMs) &&
    image.estimatedCost === null &&
    image.costStatus === "unavailable"
  );
}

function assertUniqueFactKeys(
  facts: readonly Readonly<{ fieldKey: string }>[],
  context: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  facts.forEach((fact, index) => {
    if (seen.has(fact.fieldKey)) {
      context.addIssue({
        code: "custom",
        path: [index, "fieldKey"],
        message: "duplicate fact key",
      });
    }
    seen.add(fact.fieldKey);
  });
}

function assertGenerationContextCoherence(
  contextValue: {
    identities: {
      servedTaxon: { id: string; slug: string };
      taxonChain: {
        segment: { id: string };
        niche?: { id: string };
        ultraNiche?: { id: string };
      };
    };
    modelContext: {
      research: { taxonSlug: string };
      facts: readonly Readonly<{ fieldKey: string; valueType: string; value: unknown }>[];
    };
    bindingFacts: readonly Readonly<{ fieldKey: string; valueType: string; value: unknown }>[];
  },
  context: z.RefinementCtx,
): void {
  const leaf =
    contextValue.identities.taxonChain.ultraNiche ??
    contextValue.identities.taxonChain.niche ??
    contextValue.identities.taxonChain.segment;
  if (
    leaf.id !== contextValue.identities.servedTaxon.id ||
    contextValue.modelContext.research.taxonSlug !==
      contextValue.identities.servedTaxon.slug
  ) {
    context.addIssue({ code: "custom", path: ["identities", "servedTaxon"], message: "served taxon mismatch" });
  }
  for (const [collection, facts] of [
    ["modelContext", contextValue.modelContext.facts],
    ["bindingFacts", contextValue.bindingFacts],
  ] as const) {
    facts.forEach((fact, index) => {
      if (!isSnapshotFactValueValid(fact.valueType, fact.value)) {
        context.addIssue({
          code: "custom",
          path: [collection, index, "value"],
          message: `invalid ${fact.valueType} fact value`,
        });
      }
    });
  }
}

function isSnapshotFactValueValid(valueType: string, value: unknown): boolean {
  switch (valueType) {
    case "string":
    case "enum":
      return typeof value === "string" && value.trim().length > 0;
    case "phone":
      return typeof value === "string" && /^\+[1-9]\d{7,14}$/.test(value);
    case "email":
      return typeof value === "string" && z.string().trim().email().safeParse(value).success;
    case "url":
      if (typeof value !== "string") return false;
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    case "boolean":
      return typeof value === "boolean";
    case "string_list":
      return Array.isArray(value) && value.length > 0 && value.every(
        (item) => typeof item === "string" && item.trim().length > 0,
      );
    case "number_range":
      return isRecord(value) &&
        value.currency === "BRL" &&
        isNonNegativeNumber(value.minimum) &&
        isNonNegativeNumber(value.maximum) &&
        (value.minimum as number) <= (value.maximum as number);
    case "keyword_map":
      return Array.isArray(value) && value.length > 0 && value.every(
        (item) => isRecord(item) &&
          typeof item.keyword_or_cluster === "string" &&
          item.keyword_or_cluster.trim().length > 0 &&
          typeof item.message_anchor === "string" &&
          item.message_anchor.trim().length > 0 &&
          (item.ad_context === undefined ||
            (typeof item.ad_context === "string" && item.ad_context.trim().length > 0)),
      );
    case "offering_scope":
      return isLandingPageOfferingScope(value);
    case "asset_reference":
      return isRecord(value) && Object.keys(value).length === 1 &&
        typeof value.asset_id === "string" && value.asset_id.trim().length > 0;
    case "color_palette":
      return isRecord(value) &&
        ["primary", "secondary", "accent", "background", "text"].every(
          (role) => typeof value[role] === "string" && /^#[0-9a-f]{6}$/i.test(value[role] as string),
        );
    default:
      return false;
  }
}

function isValidLandingPageDraftTextConfiguration(value: unknown) {
  if (!isRecord(value)) return false;
  const source = configurationSourceSchema.safeParse(value.source);
  const reasoningEffort = reasoningEffortSchema.safeParse(value.reasoningEffort);
  if (
    value.workload !== "landing_page_draft_generation" ||
    !source.success ||
    typeof value.revision !== "string" ||
    typeof value.model !== "string" ||
    !reasoningEffort.success
  ) {
    return false;
  }

  return isValidResolvedOpenAiProductWorkload({
    ...landingPageDraftTextWorkload,
    source: source.data,
    revision: value.revision,
    model: value.model,
    reasoningEffort: reasoningEffort.data,
  });
}

function isValidLandingPageDraftImageConfiguration(value: unknown) {
  if (!isRecord(value)) return false;
  const source = configurationSourceSchema.safeParse(value.source);
  const quality = imageQualitySchema.safeParse(value.quality);
  if (
    value.workload !== "landing_page_draft_image_generation" ||
    !source.success ||
    typeof value.revision !== "string" ||
    typeof value.model !== "string" ||
    !quality.success ||
    value.size !== landingPageDraftImageWorkload.size ||
    value.format !== landingPageDraftImageWorkload.format ||
    value.compression !== landingPageDraftImageWorkload.compression ||
    value.moderation !== landingPageDraftImageWorkload.moderation
  ) {
    return false;
  }

  return isValidResolvedOpenAiImageWorkload({
    ...landingPageDraftImageWorkload,
    source: source.data,
    revision: value.revision,
    model: value.model,
    quality: quality.data,
  });
}

function resolveLandingPageDraftTextWorkload() {
  const workload = listOpenAiWorkloadInventory().find(
    (candidate) => candidate.id === "landing_page_draft_generation",
  );
  if (
    !workload ||
    !("apiKind" in workload) ||
    workload.apiKind !== "responses_text"
  ) {
    throw new Error("landing_page_revision_text_workload_contract_missing");
  }
  return workload;
}

function resolveLandingPageDraftImageWorkload() {
  const workload = listOpenAiWorkloadInventory().find(
    (candidate) => candidate.id === "landing_page_draft_image_generation",
  );
  if (
    !workload ||
    !("apiKind" in workload) ||
    workload.apiKind !== "image_generation"
  ) {
    throw new Error("landing_page_revision_image_workload_contract_missing");
  }
  return workload;
}

function normalizeIsoDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function toJsonValue(value: unknown): unknown | null {
  try {
    return JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    return null;
  }
}

function containsForbiddenSnapshotKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenSnapshotKey);
  if (!value || typeof value !== "object") return false;
  for (const [key, nested] of Object.entries(value)) {
    const normalized = key.replace(/[^a-z]/gi, "").toLowerCase();
    if (
      normalized.includes("apikey") ||
      normalized.includes("secret") ||
      normalized.includes("signedurl") ||
      normalized.includes("reasoningtext") ||
      normalized.includes("rawresponse")
    ) {
      return true;
    }
    if (containsForbiddenSnapshotKey(nested)) return true;
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

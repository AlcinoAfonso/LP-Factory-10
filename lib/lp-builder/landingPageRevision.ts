import { z } from "zod";

import {
  landingPagePresentationCandidateSchema,
} from "../conversion-content/landing-page/presentation";
import type { LandingPageGenerationContextPackage } from "./generationContextContracts";
import type { LandingPageDraftCandidateWorkflowResult } from "./landingPageDraftCandidateWorkflow";

export const LANDING_PAGE_REVISION_CONTRACT_VERSION = 1 as const;
export const LANDING_PAGE_REVISION_SNAPSHOT_VERSION = 1 as const;
export const LANDING_PAGE_REVISION_ASSET_BUCKET =
  "landing-page-revision-assets" as const;
export const LANDING_PAGE_REVISION_ASSET_MAX_BYTES = 5_242_880 as const;

const uuidSchema = z.string().uuid();

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

export type LandingPageRevisionSnapshot = Readonly<{
  snapshotVersion: typeof LANDING_PAGE_REVISION_SNAPSHOT_VERSION;
  attemptId: string;
  requestId: string;
  generatedAt: string;
  promptVersion: string;
  presentationContractVersion: number;
  generationContext: Readonly<{
    contractVersion: 3;
    identities: LandingPageGenerationContextPackage["identities"];
    modelContext: LandingPageGenerationContextPackage["modelContext"];
    bindingFacts: readonly LandingPageGenerationContextPackage["serverContext"]["facts"][number][];
  }>;
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
    snapshotVersion: LANDING_PAGE_REVISION_SNAPSHOT_VERSION,
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
  if (
    value.snapshotVersion !== LANDING_PAGE_REVISION_SNAPSHOT_VERSION ||
    !uuidSchema.safeParse(value.attemptId).success ||
    typeof value.requestId !== "string" ||
    !value.requestId.trim() ||
    !normalizeIsoDate(typeof value.generatedAt === "string" ? value.generatedAt : "") ||
    typeof value.promptVersion !== "string" ||
    !value.promptVersion.trim() ||
    value.presentationContractVersion !== 1 ||
    !isRecord(value.generationContext) ||
    value.generationContext.contractVersion !== 3 ||
    !isRecord(value.generationContext.identities) ||
    !isRecord(value.generationContext.modelContext) ||
    !Array.isArray(value.generationContext.bindingFacts) ||
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
    isRecord(text.configuration) &&
    text.configuration.workload === "landing_page_draft_generation" &&
    text.configuration.source === "repo_catalog" &&
    typeof text.configuration.revision === "string" &&
    typeof text.configuration.model === "string" &&
    text.configuration.reasoningEffort === "max" &&
    (text.responseId === null || typeof text.responseId === "string") &&
    isRecord(text.usage) &&
    isNonNegativeNumber(text.latencyMs) &&
    text.estimatedCost === null &&
    text.costStatus === "unavailable" &&
    isRecord(image.configuration) &&
    image.configuration.workload === "landing_page_draft_image_generation" &&
    image.configuration.source === "repo_catalog" &&
    typeof image.configuration.revision === "string" &&
    typeof image.configuration.model === "string" &&
    image.configuration.size === "1536x1024" &&
    image.configuration.quality === "medium" &&
    image.configuration.format === "webp" &&
    image.configuration.compression === 80 &&
    image.configuration.moderation === "auto" &&
    (image.providerRequestId === null || typeof image.providerRequestId === "string") &&
    isNonNegativeNumber(image.latencyMs) &&
    image.estimatedCost === null &&
    image.costStatus === "unavailable"
  );
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

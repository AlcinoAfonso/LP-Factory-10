import { createHash } from "node:crypto";

import { z } from "zod";

import type { ResolvedLandingPageResearch } from "../research-resolution";
import {
  validateLandingPageModuleIdentity,
  type LandingPageModuleIdentityCatalog,
} from "../module-catalog";
import type {
  AdminGenerationProfile,
  GenerationProfileCoverage,
  GenerationProfileEditorContent,
  GenerationProfileProposal,
  GenerationProfileProposalErrorCode,
  GenerationProfileRawResearchReference,
  GenerationProfileStructuralRecommendation,
} from "./admin-contracts";

export const GENERATION_PROFILE_REQUEST_MAX_BYTES = 96 * 1024;
export const GENERATION_PROFILE_MAX_OUTPUT_TOKENS = 3000;
export const GENERATION_PROFILE_APPROVED_MODEL = "gpt-5.4-mini";
const GENERATION_PROFILE_INPUT_USD_PER_TOKEN = 0.0000005;
const GENERATION_PROFILE_OUTPUT_USD_PER_TOKEN = 0.000003;

export type GenerationProfileRawResearch = Readonly<{
  reference: GenerationProfileRawResearchReference;
  content: string;
}>;

export type GenerationProfileProviderInput = Readonly<{
  model: string;
  taxonId: string;
  research: ResolvedLandingPageResearch;
  moduleIdentities: LandingPageModuleIdentityCatalog;
  previousActiveProfile: AdminGenerationProfile | null;
  currentEditor: GenerationProfileEditorContent;
  currentCandidate: GenerationProfileProposal | null;
  humanFeedback?: string;
  rawResearch: readonly GenerationProfileRawResearch[];
  rawResearchNotices: readonly string[];
}>;

export type GenerationProfileProviderResult =
  | Readonly<{
      ok: true;
      payload: unknown;
      responseId: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
      rawResearchReferences: readonly GenerationProfileRawResearchReference[];
      notices: readonly string[];
    }>
  | Readonly<{
      ok: false;
      kind: "incomplete";
      incompleteReason: string | null;
      responseId: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
    }>
  | Readonly<{
      ok: false;
      kind: "refusal" | "http_error" | "timeout" | "invalid_response" | "request_too_large";
    }>;

export function normalizeGenerationProfileIncompleteMetadata(payload: unknown): Readonly<{
  incompleteReason: string | null;
  responseId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
}> {
  const response = isUnknownRecord(payload) ? payload : null;
  const incompleteDetails = response && isUnknownRecord(response.incomplete_details)
    ? response.incomplete_details
    : null;
  const usage = response && isUnknownRecord(response.usage) ? response.usage : null;
  return {
    incompleteReason: readNonEmptyString(incompleteDetails?.reason),
    responseId: readNonEmptyString(response?.id),
    inputTokens: readTokenCount(usage?.input_tokens),
    outputTokens: readTokenCount(usage?.output_tokens),
  };
}

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readTokenCount(value: unknown) {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null;
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const identitySchema = z
  .object({
    module_key: z.string().trim().min(1),
    module_version: z.number().int().positive(),
    variant_key: z.string().trim().min(1).nullable(),
    variant_version: z.number().int().positive().nullable(),
  })
  .strict()
  .refine((value) => (value.variant_key === null) === (value.variant_version === null));

const recommendationSchema = identitySchema.safeExtend({
  priority: z.enum(["P1", "P2", "P3"]),
  recommended_order: z.number().int().positive(),
}).strict();

const coverageSchema = z.object({
  audience_scope: z.enum(["business_buyer", "end_customer"]),
  item_key: z.string().trim().min(1),
  section_name: z.string().trim().min(1),
  source_priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  source_order: z.number().int().positive(),
  status: z.enum(["covered", "partial", "missing"]),
  compatible_identities: z.array(identitySchema),
  reason: z.string().trim().min(1).nullable(),
  impact: z.string().trim().min(1).nullable(),
}).strict();

const providerPayloadSchema = z.object({
  coverage: z.array(coverageSchema),
  recommendations: z.array(recommendationSchema),
  source_notices: z.array(z.string().trim().min(1)),
}).strict();

const candidateIdentitySchema = z.object({
  moduleKey: z.string().trim().min(1),
  moduleVersion: z.number().int().positive(),
  variantKey: z.string().trim().min(1).optional(),
  variantVersion: z.number().int().positive().optional(),
}).strict().superRefine((value, context) => {
  if ((value.variantKey === undefined) !== (value.variantVersion === undefined)) {
    context.addIssue({ code: "custom", message: "variant identity must be complete" });
  }
});

const candidateSchema = z.object({
  coverage: z.array(z.object({
    audienceScope: z.enum(["business_buyer", "end_customer"]),
    itemKey: z.string().trim().min(1),
    sectionName: z.string().trim().min(1),
    sourcePriority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    sourceOrder: z.number().int().positive(),
    status: z.enum(["covered", "partial", "missing"]),
    compatibleIdentities: z.array(candidateIdentitySchema),
    reason: z.string().trim().min(1).optional(),
    impact: z.string().trim().min(1).optional(),
  }).strict()),
  recommendations: z.array(candidateIdentitySchema.safeExtend({
    priority: z.enum(["P1", "P2", "P3"]),
    recommendedOrder: z.number().int().positive(),
  }).strict()),
  gaps: z.array(z.object({
    audienceScope: z.enum(["business_buyer", "end_customer"]),
    itemKey: z.string().trim().min(1),
    sectionName: z.string().trim().min(1),
    sourcePriority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    sourceOrder: z.number().int().positive(),
    status: z.enum(["partial", "missing"]),
    reason: z.string().trim().min(1),
    impact: z.string().trim().min(1),
  }).strict()),
  notices: z.array(z.string().trim().min(1)),
  rawResearchReferences: z.array(z.object({
    path: z.string().trim().min(1),
    audienceScope: z.enum(["business_buyer", "end_customer"]),
    sourceTaxonId: z.uuid(),
    sourceRelation: z.enum(["own", "direct_parent"]),
    version: z.number().int().positive(),
    blob: z.string().regex(/^[a-f0-9]{40}$/),
  }).strict()),
  researchVersions: z.object({ endCustomer: z.number().int().positive(), businessBuyer: z.number().int().positive() }).strict(),
  requestId: z.uuid(),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

export function normalizeGenerationProfileCandidate(input: unknown):
  | Readonly<{ ok: true; value: GenerationProfileProposal }>
  | Readonly<{ ok: false; message: string }> {
  const parsed = candidateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Current candidate is invalid." };
  const candidate = parsed.data as GenerationProfileProposal;
  if (fingerprintGenerationProfileProposal(candidate) !== candidate.fingerprint) {
    return { ok: false, message: "Current candidate fingerprint is invalid." };
  }
  if (new Set(candidate.recommendations.map((item) => item.moduleKey)).size !== candidate.recommendations.length) {
    return { ok: false, message: "Current candidate modules are not unique." };
  }
  for (const recommendation of candidate.recommendations) {
    const identity = validateLandingPageModuleIdentity({
      moduleKey: recommendation.moduleKey,
      moduleVersion: recommendation.moduleVersion,
      ...(recommendation.variantKey === undefined ? {} : { variantKey: recommendation.variantKey, variantVersion: recommendation.variantVersion }),
    });
    if (!identity.ok) return { ok: false, message: "Current candidate contains an invalid identity." };
  }
  for (const coverage of candidate.coverage) {
    if (!isCoverageIdentityCountValid(coverage.status, coverage.compatibleIdentities.length)) {
      return { ok: false, message: "Current candidate coverage identity count is inconsistent with its status." };
    }
    for (const compatibleIdentity of coverage.compatibleIdentities) {
      const identity = validateLandingPageModuleIdentity({
        moduleKey: compatibleIdentity.moduleKey,
        moduleVersion: compatibleIdentity.moduleVersion,
        ...(compatibleIdentity.variantKey === undefined
          ? {}
          : { variantKey: compatibleIdentity.variantKey, variantVersion: compatibleIdentity.variantVersion }),
      });
      if (!identity.ok) return { ok: false, message: "Current candidate coverage contains an invalid identity." };
    }
  }
  const gapKeys = new Set(candidate.gaps.map((gap) => `${gap.audienceScope}:${gap.itemKey}`));
  const derivedGapKeys = new Set(candidate.coverage.filter((item) => item.status !== "covered").map((item) => `${item.audienceScope}:${item.itemKey}`));
  if (gapKeys.size !== derivedGapKeys.size || [...gapKeys].some((key) => !derivedGapKeys.has(key))) {
    return { ok: false, message: "Current candidate gaps do not match coverage." };
  }
  return { ok: true, value: candidate };
}

export function buildGenerationProfileResponsesRequest(input: GenerationProfileProviderInput) {
  const baseUserInput = {
    taxon_id: input.taxonId,
    research: input.research,
    module_identities: input.moduleIdentities,
    previous_active_profile: toStructuralProfile(input.previousActiveProfile),
    current_editor: toStructuralEditor(input.currentEditor),
    current_candidate: input.currentCandidate
      ? {
          coverage: input.currentCandidate.coverage,
          recommendations: input.currentCandidate.recommendations,
          gaps: input.currentCandidate.gaps,
          notices: input.currentCandidate.notices,
          research_versions: input.currentCandidate.researchVersions,
        }
      : null,
    request_kind: input.previousActiveProfile ? "evolution" : "creation",
    human_feedback: input.humanFeedback?.trim() || null,
    raw_research: [] as readonly GenerationProfileRawResearch[],
  };
  const included: GenerationProfileRawResearch[] = [];
  const notices = [...input.rawResearchNotices];
  for (const raw of input.rawResearch) {
    const candidate = [...included, raw];
    const request = createRequest({ ...baseUserInput, raw_research: candidate });
    if (Buffer.byteLength(JSON.stringify(request), "utf8") <= GENERATION_PROFILE_REQUEST_MAX_BYTES) {
      included.push(raw);
    } else {
      notices.push(`Pesquisa bruta omitida por limite: ${raw.reference.path}`);
    }
  }
  const body = createRequest({ ...baseUserInput, raw_research: included });
  const serialized = JSON.stringify(body);
  return {
    ok: Buffer.byteLength(serialized, "utf8") <= GENERATION_PROFILE_REQUEST_MAX_BYTES,
    body,
    serialized,
    bytes: Buffer.byteLength(serialized, "utf8"),
    rawResearchReferences: included.map((item) => item.reference),
    notices,
  } as const;
}

function createRequest(userInput: Record<string, unknown>) {
  return {
    model: GENERATION_PROFILE_APPROVED_MODEL,
    store: false,
    max_output_tokens: GENERATION_PROFILE_MAX_OUTPUT_TOKENS,
    input: [
      {
        role: "system",
        content: [{
          type: "input_text",
          text: "Crie ou evolua somente a estrutura orientativa do perfil. Avalie cada item de lp_sections e devolva coverage completo e recommendations deduplicadas. Não invente nem crie identidades. Use somente identidades válidas fornecidas pelo catálogo autorizado. Não invente nem crie módulos ou variantes. Não produza copy, generation_guidance, item_guidance, LP ou ações. A pesquisa estruturada governa; pesquisa bruta e feedback são apenas contexto a avaliar. Registre em source_notices qualquer divergência entre pesquisa bruta e E10.8, sem reproduzir a pesquisa bruta.",
        }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(userInput) }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "landing_page_generation_profile_structural_proposal",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["coverage", "recommendations", "source_notices"],
          properties: {
            coverage: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["audience_scope", "item_key", "section_name", "source_priority", "source_order", "status", "compatible_identities", "reason", "impact"],
                properties: {
                  audience_scope: { type: "string", enum: ["business_buyer", "end_customer"] },
                  item_key: { type: "string", minLength: 1 },
                  section_name: { type: "string", minLength: 1 },
                  source_priority: { type: "integer", enum: [1, 2, 3] },
                  source_order: { type: "integer", minimum: 1 },
                  status: { type: "string", enum: ["covered", "partial", "missing"] },
                  compatible_identities: { type: "array", items: identityJsonSchema },
                  reason: { type: ["string", "null"] },
                  impact: { type: ["string", "null"] },
                },
              },
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["module_key", "module_version", "variant_key", "variant_version", "priority", "recommended_order"],
                properties: {
                  ...identityJsonSchema.properties,
                  priority: { type: "string", enum: ["P1", "P2", "P3"] },
                  recommended_order: { type: "integer", minimum: 1 },
                },
              },
            },
            source_notices: {
              type: "array",
              items: { type: "string", minLength: 1 },
            },
          },
        },
      },
    },
  };
}

const identityJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["module_key", "module_version", "variant_key", "variant_version"],
  properties: {
    module_key: { type: "string", minLength: 1 },
    module_version: { type: "integer", minimum: 1 },
    variant_key: { type: ["string", "null"] },
    variant_version: { type: ["integer", "null"], minimum: 1 },
  },
} as const;

export function validateGenerationProfileProviderPayload(input: {
  payload: unknown;
  research: ResolvedLandingPageResearch;
  moduleIdentities: LandingPageModuleIdentityCatalog;
  notices?: readonly string[];
  rawResearchReferences?: readonly GenerationProfileRawResearchReference[];
}) {
  const parsed = providerPayloadSchema.safeParse(input.payload);
  if (!parsed.success) return { ok: false as const, message: "Proposal payload is invalid." };

  const sections = readLpSections(input.research);
  const coverageKeys = parsed.data.coverage.map(coverageIdentityKey);
  if (new Set(coverageKeys).size !== coverageKeys.length || sections.length !== parsed.data.coverage.length) {
    return { ok: false as const, message: "Coverage must contain every lp_sections item exactly once." };
  }
  const sectionsByKey = new Map(sections.map((section) => [coverageIdentityKey(section), section]));
  for (const coverage of parsed.data.coverage) {
    const source = sectionsByKey.get(coverageIdentityKey(coverage));
    if (!source || source.section_name !== coverage.section_name || source.source_priority !== coverage.source_priority || source.source_order !== coverage.source_order) {
      return { ok: false as const, message: "Coverage changed the authorized lp_sections source." };
    }
    if (!isCoverageIdentityCountValid(coverage.status, coverage.compatible_identities.length)) {
      return { ok: false as const, message: "Coverage identity count is inconsistent with its status." };
    }
    if (coverage.status !== "covered" && (!coverage.reason || !coverage.impact)) {
      return { ok: false as const, message: "Coverage gaps require reason and impact." };
    }
    for (const identity of coverage.compatible_identities) {
      if (!validateIdentity(identity)) return { ok: false as const, message: "Coverage contains an invalid identity." };
    }
  }

  const recommendations = parsed.data.recommendations.map(normalizeStructuralRecommendation);
  if (new Set(recommendations.map((item) => item.moduleKey)).size !== recommendations.length || new Set(recommendations.map((item) => item.recommendedOrder)).size !== recommendations.length) {
    return { ok: false as const, message: "Recommendations must be unique by module and order." };
  }
  for (const recommendation of recommendations) {
    const identity = validateLandingPageModuleIdentity({
      moduleKey: recommendation.moduleKey,
      moduleVersion: recommendation.moduleVersion,
      ...(recommendation.variantKey === undefined ? {} : {
        variantKey: recommendation.variantKey,
        variantVersion: recommendation.variantVersion,
      }),
    });
    if (!identity.ok) {
      return { ok: false as const, message: `Recommendation contains an invalid catalog identity: ${identity.error.code}.` };
    }
  }
  const expected = deriveRecommendations(parsed.data.coverage);
  if (JSON.stringify(recommendations) !== JSON.stringify(expected)) {
    return { ok: false as const, message: "Recommendation priority or order is not deterministic from coverage." };
  }

  const coverage: GenerationProfileCoverage[] = parsed.data.coverage.map((item) => ({
    audienceScope: item.audience_scope,
    itemKey: item.item_key,
    sectionName: item.section_name,
    sourcePriority: item.source_priority,
    sourceOrder: item.source_order,
    status: item.status,
    compatibleIdentities: item.compatible_identities.map(normalizeIdentity),
    ...(item.reason ? { reason: item.reason } : {}),
    ...(item.impact ? { impact: item.impact } : {}),
  }));
  const gaps = coverage
    .filter((item): item is GenerationProfileCoverage & { status: "partial" | "missing"; reason: string; impact: string } => item.status !== "covered")
    .map((item) => ({ audienceScope: item.audienceScope, itemKey: item.itemKey, sectionName: item.sectionName, sourcePriority: item.sourcePriority, sourceOrder: item.sourceOrder, status: item.status, reason: item.reason, impact: item.impact }));
  const fingerprint = fingerprintGenerationProfileProposal({ recommendations });
  return {
    ok: true as const,
    value: {
      coverage,
      recommendations,
      gaps,
      notices: [...(input.notices ?? []), ...parsed.data.source_notices],
      rawResearchReferences: [...(input.rawResearchReferences ?? [])],
      fingerprint,
    },
  };
}

function readLpSections(research: ResolvedLandingPageResearch) {
  return [research.businessBuyer, research.endCustomer].flatMap((audience) =>
    audience.researches
      .filter((parent) => parent.researchBlock === "lp_sections")
      .flatMap((parent) => parent.items.map((item) => ({
        audience_scope: audience.audienceScope,
        item_key: item.itemKey,
        section_name: item.itemText,
        source_priority: item.priority as 1 | 2 | 3,
        source_order: item.sortOrder,
      }))),
  );
}

function coverageIdentityKey(value: { audience_scope: string; item_key: string }) {
  return `${value.audience_scope}:${value.item_key}`;
}

function validateIdentity(value: z.infer<typeof identitySchema>) {
  return validateLandingPageModuleIdentity(normalizeIdentity(value)).ok;
}

function normalizeIdentity(value: z.infer<typeof identitySchema>) {
  return {
    moduleKey: value.module_key,
    moduleVersion: value.module_version,
    ...(value.variant_key === null ? {} : { variantKey: value.variant_key, variantVersion: value.variant_version as number }),
  };
}

function normalizeStructuralRecommendation(value: z.infer<typeof recommendationSchema>): GenerationProfileStructuralRecommendation {
  return {
    ...normalizeIdentity(value),
    priority: value.priority,
    recommendedOrder: value.recommended_order,
  };
}

function deriveRecommendations(coverage: readonly z.infer<typeof coverageSchema>[]): GenerationProfileStructuralRecommendation[] {
  const byModule = new Map<string, { identity: ReturnType<typeof normalizeIdentity>; priority: "P1" | "P2" | "P3"; sourceOrder: number; coverageIndex: number }>();
  coverage.forEach((item, coverageIndex) => {
    if (item.status === "missing") return;
    item.compatible_identities.forEach((rawIdentity) => {
      const identity = normalizeIdentity(rawIdentity);
      const priority = item.source_priority === 3 ? "P1" : item.source_priority === 2 ? "P2" : "P3";
      const existing = byModule.get(identity.moduleKey);
      if (!existing) {
        byModule.set(identity.moduleKey, { identity, priority, sourceOrder: item.source_order, coverageIndex });
        return;
      }
      if (priorityRank(priority) < priorityRank(existing.priority)) existing.priority = priority;
      if (item.source_order < existing.sourceOrder) existing.sourceOrder = item.source_order;
      if (coverageIndex < existing.coverageIndex) existing.coverageIndex = coverageIndex;
    });
  });
  return [...byModule.values()]
    .sort((left, right) => left.sourceOrder - right.sourceOrder || left.coverageIndex - right.coverageIndex || left.identity.moduleKey.localeCompare(right.identity.moduleKey))
    .map((item, index) => ({ ...item.identity, priority: item.priority, recommendedOrder: (index + 1) * 10 }));
}

function isCoverageIdentityCountValid(status: "covered" | "partial" | "missing", identityCount: number) {
  return status === "missing" ? identityCount === 0 : identityCount > 0;
}

function priorityRank(value: "P1" | "P2" | "P3") {
  return value === "P1" ? 1 : value === "P2" ? 2 : 3;
}

function toStructuralProfile(profile: AdminGenerationProfile | null) {
  return profile ? { id: profile.id, version: profile.version, recommendations: profile.recommendations.map(stripHumanGuidance) } : null;
}

function toStructuralEditor(editor: GenerationProfileEditorContent) {
  return { recommendations: editor.recommendations.map(stripHumanGuidance) };
}

function stripHumanGuidance(item: GenerationProfileEditorContent["recommendations"][number]): GenerationProfileStructuralRecommendation {
  const { itemGuidance: _itemGuidance, ...structural } = item;
  return structural;
}

export function fingerprintGenerationProfileProposal(input: { recommendations: readonly GenerationProfileStructuralRecommendation[] }) {
  const canonical = JSON.stringify([...input.recommendations]
    .map((item) => stripHumanGuidance(item))
    .sort((left, right) => left.recommendedOrder - right.recommendedOrder));
  return createHash("sha256").update(canonical).digest("hex");
}

export function mapResearchErrorToProposalError(code: string): GenerationProfileProposalErrorCode {
  if (["RESEARCH_MISSING", "RESEARCH_INCOMPLETE", "TAXON_NOT_FOUND", "TAXON_INACTIVE", "DIRECT_PARENT_NOT_FOUND", "DIRECT_PARENT_INACTIVE"].includes(code)) return "missing_information";
  if (["RESEARCH_INVALID", "RESEARCH_AMBIGUOUS", "INVALID_TAXON_ID"].includes(code)) return "invalid_data";
  return "technical_failure";
}

export function mapProviderFailureToProposalError(kind: Exclude<GenerationProfileProviderResult, { ok: true }>["kind"]): GenerationProfileProposalErrorCode {
  return kind === "request_too_large" ? "invalid_data" : "technical_failure";
}

export function isGenerationProfileAssistanceConfigured(input: { apiKey?: string; model?: string }) {
  return Boolean(input.apiKey?.trim() && input.model?.trim() === GENERATION_PROFILE_APPROVED_MODEL);
}

export function estimateGenerationProfileCostUsd(model: string, inputTokens: number | null, outputTokens: number | null) {
  if (model !== GENERATION_PROFILE_APPROVED_MODEL || inputTokens === null || outputTokens === null) return null;
  return Number((inputTokens * GENERATION_PROFILE_INPUT_USD_PER_TOKEN + outputTokens * GENERATION_PROFILE_OUTPUT_USD_PER_TOKEN).toFixed(6));
}

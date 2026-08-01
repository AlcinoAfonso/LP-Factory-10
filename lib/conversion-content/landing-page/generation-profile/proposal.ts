import { createHash } from "node:crypto";

import { z } from "zod";

import type { ResolvedLandingPageResearch } from "../research-resolution";
import {
  validateLandingPageModuleIdentity,
  type LandingPageModuleIdentityCatalog,
  type LandingPageModuleSelectionCatalog,
} from "../module-catalog";
import type {
  GenerationProfileCoverage,
  GenerationProfileCoverageIdentity,
  GenerationProfileEditorContent,
  GenerationProfileProposal,
  GenerationProfileProposalErrorCode,
  GenerationProfileStructuralRecommendation,
} from "./admin-contracts";
import { deriveGenerationProfileProposalDiff } from "./editor-assistance";

export const GENERATION_PROFILE_REQUEST_MAX_BYTES = 96 * 1024;
export const GENERATION_PROFILE_MAX_OUTPUT_TOKENS = 2000;
export const GENERATION_PROFILE_APPROVED_MODEL = "gpt-5.4-mini";
const GENERATION_PROFILE_INPUT_USD_PER_TOKEN = 0.00000075;
const GENERATION_PROFILE_OUTPUT_USD_PER_TOKEN = 0.0000045;

export type GenerationProfileProviderInput = Readonly<{
  model: string;
  research: ResolvedLandingPageResearch;
  moduleIdentities: LandingPageModuleIdentityCatalog;
  moduleSelectionCatalog: LandingPageModuleSelectionCatalog;
  requestKind: "creation" | "evolution";
  activeBaseline: readonly GenerationProfileStructuralRecommendation[] | null;
  currentCandidate: GenerationProfileProposal | null;
  humanFeedback?: string;
}>;

export type GenerationProfileProviderResult =
  | Readonly<{
      ok: true;
      payload: unknown;
      responseId: string | null;
      inputTokens: number | null;
      outputTokens: number | null;
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

export type GenerationProfileProviderValidationReason =
  | "payload_schema_invalid"
  | "coverage_source_priority_invalid"
  | "coverage_items_mismatch"
  | "coverage_identity_count_invalid"
  | "coverage_identity_invalid"
  | "coverage_selected_identity_count_invalid"
  | "coverage_selected_identity_invalid"
  | "coverage_selected_module_conflict"
  | "coverage_selected_identity_conflict";

export function buildGenerationProfileInvalidDataMetadata(input: Readonly<{
  model: string;
  validationReason: GenerationProfileProviderValidationReason;
  responseId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
}>) {
  return {
    validationReason: input.validationReason,
    responseId: input.responseId,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    estimatedCostUsd: estimateGenerationProfileCostUsd(input.model, input.inputTokens, input.outputTokens),
  } as const;
}

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

const coveredSchema = z.object({
  coverage_id: z.string().trim().min(1),
  status: z.literal("covered"),
  compatible_aliases: z.array(z.string().trim().min(1)),
  selected_aliases: z.array(z.string().trim().min(1)),
}).strict();

const gapCoverageSchema = z.object({
  coverage_id: z.string().trim().min(1),
  status: z.enum(["partial", "missing"]),
  compatible_aliases: z.array(z.string().trim().min(1)),
  selected_aliases: z.array(z.string().trim().min(1)),
  reason: z.string().trim().min(1),
  impact: z.string().trim().min(1),
}).strict();

const providerPayloadSchema = z.object({
  coverage: z.array(z.discriminatedUnion("status", [coveredSchema, gapCoverageSchema])),
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

const candidateGapSchema = z.object({
  coverageId: z.string().trim().min(1),
  audienceScope: z.enum(["business_buyer", "end_customer"]),
  itemKey: z.string().trim().min(1),
  sectionName: z.string().trim().min(1),
  sourcePriority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  sourceOrder: z.number().int().positive(),
  status: z.enum(["partial", "missing"]),
  reason: z.string().trim().min(1),
  impact: z.string().trim().min(1),
}).strict();

const candidateSchema = z.object({
  coverage: z.array(z.object({
    coverageId: z.string().trim().min(1),
    audienceScope: z.enum(["business_buyer", "end_customer"]),
    itemKey: z.string().trim().min(1),
    sectionName: z.string().trim().min(1),
    sourcePriority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    sourceOrder: z.number().int().positive(),
    status: z.enum(["covered", "partial", "missing"]),
    compatibleIdentities: z.array(candidateIdentitySchema),
    selectedIdentities: z.array(candidateIdentitySchema),
    reason: z.string().trim().min(1).optional(),
    impact: z.string().trim().min(1).optional(),
  }).strict()),
  recommendations: z.array(candidateIdentitySchema.safeExtend({
    priority: z.enum(["P1", "P2", "P3"]),
    recommendedOrder: z.number().int().positive(),
  }).strict()),
  gaps: z.array(candidateGapSchema),
  diff: z.object({
    recommendations: z.array(z.object({
      moduleKey: z.string().trim().min(1),
      status: z.enum(["kept", "added", "changed", "removed"]),
      changes: z.array(z.enum(["module_version", "variant", "priority", "order"])),
    }).strict()),
    replacements: z.array(z.object({
      fromModuleKey: z.string().trim().min(1),
      toModuleKey: z.string().trim().min(1),
      recommendedOrder: z.number().int().positive(),
    }).strict()),
    gaps: z.object({
      added: z.array(candidateGapSchema),
      resolved: z.array(candidateGapSchema),
    }).strict(),
  }).strict(),
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
    if (!isSelectedIdentityCountValid(coverage.status, coverage.selectedIdentities.length)) {
      return { ok: false, message: "Current candidate selected identity count is inconsistent with its status." };
    }
    const compatibleAliases = coverage.compatibleIdentities.map(identityAlias);
    if (new Set(compatibleAliases).size !== compatibleAliases.length) {
      return { ok: false, message: "Current candidate coverage identities are repeated." };
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
    const selectedAliases = coverage.selectedIdentities.map(identityAlias);
    if (new Set(selectedAliases).size !== selectedAliases.length || selectedAliases.some((alias) => !compatibleAliases.includes(alias))) {
      return { ok: false, message: "Current candidate selected identities are invalid." };
    }
    const selectedModules = new Set<string>();
    for (const selectedIdentity of coverage.selectedIdentities) {
      const identity = validateLandingPageModuleIdentity({
        moduleKey: selectedIdentity.moduleKey,
        moduleVersion: selectedIdentity.moduleVersion,
        ...(selectedIdentity.variantKey === undefined
          ? {}
          : { variantKey: selectedIdentity.variantKey, variantVersion: selectedIdentity.variantVersion }),
      });
      if (!identity.ok) return { ok: false, message: "Current candidate contains an invalid selected identity." };
      if (selectedModules.has(selectedIdentity.moduleKey)) {
        return { ok: false, message: "Current candidate selects more than one identity for a module in one coverage item." };
      }
      selectedModules.add(selectedIdentity.moduleKey);
    }
  }
  const selectedByModule = new Map<string, string>();
  for (const coverage of candidate.coverage) {
    for (const identity of coverage.selectedIdentities) {
      const alias = identityAlias(identity);
      const previousAlias = selectedByModule.get(identity.moduleKey);
      if (previousAlias && previousAlias !== alias) {
        return { ok: false, message: "Current candidate contains conflicting selected identities." };
      }
      selectedByModule.set(identity.moduleKey, alias);
    }
  }
  if (JSON.stringify(deriveRecommendations(candidate.coverage)) !== JSON.stringify(candidate.recommendations)) {
    return { ok: false, message: "Current candidate recommendations do not match selected identities." };
  }
  const coverageIds = candidate.coverage.map((item) => item.coverageId);
  if (new Set(coverageIds).size !== coverageIds.length) {
    return { ok: false, message: "Current candidate coverage identities are not unique." };
  }
  const gapIds = candidate.gaps.map((gap) => gap.coverageId);
  const gapKeys = new Set(gapIds);
  if (gapKeys.size !== gapIds.length) {
    return { ok: false, message: "Current candidate gap identities are not unique." };
  }
  const derivedGapKeys = new Set(candidate.coverage.filter((item) => item.status !== "covered").map((item) => item.coverageId));
  if (gapKeys.size !== derivedGapKeys.size || [...gapKeys].some((key) => !derivedGapKeys.has(key))) {
    return { ok: false, message: "Current candidate gaps do not match coverage." };
  }
  return { ok: true, value: candidate };
}

export function buildGenerationProfileResponsesRequest(input: GenerationProfileProviderInput) {
  const userInput = {
    research: compactResearch(input.research),
    module_catalog: input.moduleSelectionCatalog.modules.map((module) => ({
      module_alias: module.moduleAlias,
      purpose: module.purpose,
      variants: module.variants.map((variant) => ({
        alias: variant.alias,
        capabilities: variant.capabilities,
        interactions: variant.interactions,
      })),
    })),
    active_baseline: input.activeBaseline
      ? input.activeBaseline.map((item) => ({
          alias: identityAlias(item),
          priority: item.priority,
          order: item.recommendedOrder,
        }))
      : null,
    current_candidate: input.currentCandidate
      ? {
          coverage: input.currentCandidate.coverage.map((item) => ({
            coverage_id: item.coverageId,
            status: item.status,
            compatible_aliases: item.compatibleIdentities.map(identityAlias),
            selected_aliases: item.selectedIdentities.map(identityAlias),
            ...(item.status === "covered" ? {} : { reason: item.reason, impact: item.impact }),
          })),
        }
      : null,
    request_kind: input.requestKind,
    human_feedback: input.humanFeedback?.trim() || null,
  };
  const body = createRequest(userInput);
  const serialized = JSON.stringify(body);
  return {
    ok: Buffer.byteLength(serialized, "utf8") <= GENERATION_PROFILE_REQUEST_MAX_BYTES,
    body,
    serialized,
    bytes: Buffer.byteLength(serialized, "utf8"),
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
          text: generationProfileSystemPrompt,
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
          required: ["coverage"],
          properties: {
            coverage: {
              type: "array",
              items: {
                anyOf: [coveredJsonSchema, gapCoverageJsonSchema],
              },
            },
          },
        },
      },
    },
  };
}

const coveredJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["coverage_id", "status", "compatible_aliases", "selected_aliases"],
  properties: {
    coverage_id: { type: "string", minLength: 1 },
    status: { type: "string", enum: ["covered"] },
    compatible_aliases: { type: "array", items: { type: "string", minLength: 1 } },
    selected_aliases: { type: "array", items: { type: "string", minLength: 1 } },
  },
} as const;

const gapCoverageJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["coverage_id", "status", "compatible_aliases", "selected_aliases", "reason", "impact"],
  properties: {
    coverage_id: { type: "string", minLength: 1 },
    status: { type: "string", enum: ["partial", "missing"] },
    compatible_aliases: { type: "array", items: { type: "string", minLength: 1 } },
    selected_aliases: { type: "array", items: { type: "string", minLength: 1 } },
    reason: { type: "string", minLength: 1 },
    impact: { type: "string", minLength: 1 },
  },
} as const;

const generationProfileSystemPrompt = [
  "Objetivo\n\nCrie ou evolua somente a análise estrutural do perfil de orientação. Avalie exatamente cada lp_section e escolha identidades válidas do module_catalog.",
  "Contexto conceitual\n\nUma lp_section representa uma necessidade de comunicação e não possui relação obrigatória de um para um com um módulo.\n\nmodule_alias representa a identidade do módulo-base. Selecioná-la significa recomendar o módulo sem impor uma variante.\n\nO alias de uma variante, como hero.standard, representa o par módulo e variante.\n\nUma seção pode selecionar identidades de vários módulos. Várias seções podem selecionar a mesma identidade.",
  "Contrato da resposta\n\ncompatible_aliases deve conter todas as identidades semanticamente compatíveis com a seção.\n\nselected_aliases deve conter somente as identidades efetivamente escolhidas e deve ser subconjunto de compatible_aliases.\n\nDentro da mesma seção, selecione no máximo uma identidade por módulo.\n\nPara um mesmo módulo, todas as seções devem selecionar globalmente a mesma identidade. Não use prioridade, ordem ou posição no array para resolver conflito entre módulo-base e variante ou entre variantes.\n\nUse covered quando houver cobertura completa, partial quando apenas parte da necessidade puder ser recomendada e missing quando nenhuma identidade puder ser selecionada.",
  "Limites\n\nUse exclusivamente aliases presentes em module_catalog. Não invente aliases, módulos ou variantes.\n\nNão derive versões, prioridade, ordem, recommendations, gaps ou diff. O servidor fará essas derivações deterministicamente a partir de selected_aliases e das lp_sections.\n\nNão produza copy, generation_guidance, item_guidance, LP, avisos ou ações.\n\nEm evolution, reavalie active_baseline contra a pesquisa e o catálogo vigentes. Não preserve uma identidade somente por herança.\n\nEm refinamento, current_candidate é a candidata transitória anterior e human_feedback é apenas o feedback estrutural mais recente.",
  "Entrega\n\nDevolva somente coverage_id, status, compatible_aliases, selected_aliases e, para partial ou missing, reason e impact.",
].join("\n\n");

export function validateGenerationProfileProviderPayload(input: {
  payload: unknown;
  research: ResolvedLandingPageResearch;
  moduleIdentities: LandingPageModuleIdentityCatalog;
  currentEditor?: GenerationProfileEditorContent;
  previousCandidate?: GenerationProfileProposal | null;
}) {
  const parsed = providerPayloadSchema.safeParse(input.payload);
  if (!parsed.success) return { ok: false as const, reason: "payload_schema_invalid" as const, message: "Proposal payload is invalid." };

  const sections = readLpSections(input.research);
  if (!sections) {
    return { ok: false as const, reason: "coverage_source_priority_invalid" as const, message: "lp_sections contains an unsupported priority." };
  }
  const coverageKeys = parsed.data.coverage.map((item) => item.coverage_id);
  if (new Set(coverageKeys).size !== coverageKeys.length || sections.length !== parsed.data.coverage.length) {
    return { ok: false as const, reason: "coverage_items_mismatch" as const, message: "Coverage must contain every lp_sections item exactly once." };
  }
  const sectionsByKey = new Map(sections.map((section) => [coverageIdentityKey(section), section]));
  const identitiesByAlias = new Map(
    buildIdentityAliasEntries(input.moduleIdentities).map((entry) => [entry.alias, entry.identity]),
  );
  const decodedCompatible = new Map<string, readonly GenerationProfileCoverageIdentity[]>();
  const decodedSelected = new Map<string, readonly GenerationProfileCoverageIdentity[]>();
  const globallySelectedByModule = new Map<string, string>();
  for (const coverage of parsed.data.coverage) {
    if (!sectionsByKey.has(coverage.coverage_id)) {
      return { ok: false as const, reason: "coverage_items_mismatch" as const, message: "Coverage must contain every lp_sections item exactly once." };
    }
    if (new Set(coverage.compatible_aliases).size !== coverage.compatible_aliases.length) {
      return { ok: false as const, reason: "coverage_identity_invalid" as const, message: "Coverage contains a repeated identity alias." };
    }
    const compatibleIdentities = coverage.compatible_aliases.map((alias) => identitiesByAlias.get(alias));
    if (compatibleIdentities.some((identity) => identity === undefined)) {
      return { ok: false as const, reason: "coverage_identity_invalid" as const, message: "Coverage contains an invalid identity alias." };
    }
    if (!isCoverageIdentityCountValid(coverage.status, compatibleIdentities.length)) {
      return { ok: false as const, reason: "coverage_identity_count_invalid" as const, message: "Coverage identity count is inconsistent with its status." };
    }
    if (new Set(coverage.selected_aliases).size !== coverage.selected_aliases.length) {
      return { ok: false as const, reason: "coverage_selected_identity_invalid" as const, message: "Coverage contains a repeated selected identity alias." };
    }
    const selectedIdentities = coverage.selected_aliases.map((alias) => identitiesByAlias.get(alias));
    if (selectedIdentities.some((identity) => identity === undefined) || coverage.selected_aliases.some((alias) => !coverage.compatible_aliases.includes(alias))) {
      return { ok: false as const, reason: "coverage_selected_identity_invalid" as const, message: "Coverage contains an invalid selected identity alias." };
    }
    if (!isSelectedIdentityCountValid(coverage.status, selectedIdentities.length)) {
      return { ok: false as const, reason: "coverage_selected_identity_count_invalid" as const, message: "Coverage selected identity count is inconsistent with its status." };
    }
    const normalizedCompatibleIdentities = [...compatibleIdentities as readonly GenerationProfileCoverageIdentity[]]
      .sort((left, right) => identityAlias(left).localeCompare(identityAlias(right)));
    const normalizedSelectedIdentities = [...selectedIdentities as readonly GenerationProfileCoverageIdentity[]]
      .sort((left, right) => identityAlias(left).localeCompare(identityAlias(right)));
    const selectedModules = new Set<string>();
    for (const identity of normalizedSelectedIdentities) {
      if (selectedModules.has(identity.moduleKey)) {
        return { ok: false as const, reason: "coverage_selected_module_conflict" as const, message: "Coverage selects more than one identity for the same module." };
      }
      selectedModules.add(identity.moduleKey);
      const alias = identityAlias(identity);
      const previousAlias = globallySelectedByModule.get(identity.moduleKey);
      if (previousAlias && previousAlias !== alias) {
        return { ok: false as const, reason: "coverage_selected_identity_conflict" as const, message: "Coverage items select conflicting identities for the same module." };
      }
      globallySelectedByModule.set(identity.moduleKey, alias);
    }
    decodedCompatible.set(coverage.coverage_id, normalizedCompatibleIdentities);
    decodedSelected.set(coverage.coverage_id, normalizedSelectedIdentities);
  }

  const analysisByKey = new Map(parsed.data.coverage.map((item) => [item.coverage_id, item]));
  const coverage: GenerationProfileCoverage[] = sections.map((source) => {
    const item = analysisByKey.get(coverageIdentityKey(source));
    if (!item) throw new Error("Validated coverage is missing a canonical section.");
    return {
      coverageId: coverageIdentityKey(source),
      audienceScope: source.audience_scope,
      itemKey: source.item_key,
      sectionName: source.section_name,
      sourcePriority: source.source_priority,
      sourceOrder: source.source_order,
      status: item.status,
      compatibleIdentities: decodedCompatible.get(item.coverage_id) ?? [],
      selectedIdentities: decodedSelected.get(item.coverage_id) ?? [],
      ...(item.status === "covered" ? {} : { reason: item.reason, impact: item.impact }),
    };
  });
  const recommendations = deriveRecommendations(coverage);
  const gaps = coverage
    .filter((item): item is GenerationProfileCoverage & { status: "partial" | "missing"; reason: string; impact: string } => item.status !== "covered")
    .map((item) => ({ coverageId: item.coverageId, audienceScope: item.audienceScope, itemKey: item.itemKey, sectionName: item.sectionName, sourcePriority: item.sourcePriority, sourceOrder: item.sourceOrder, status: item.status, reason: item.reason, impact: item.impact }));
  const diff = deriveGenerationProfileProposalDiff({
    editor: input.currentEditor ?? { generationGuidance: "", recommendations: [] },
    previousCandidate: input.previousCandidate ?? null,
    recommendations,
    gaps,
  });
  const fingerprint = fingerprintGenerationProfileProposal({ recommendations });
  return {
    ok: true as const,
    value: {
      coverage,
      recommendations,
      gaps,
      diff,
      fingerprint,
    },
  };
}

function readLpSections(research: ResolvedLandingPageResearch) {
  const sections: Array<{
    audience_scope: "business_buyer" | "end_customer";
    item_id: string;
    item_key: string;
    section_name: string;
    source_priority: 1 | 2 | 3;
    source_order: number;
  }> = [];
  for (const audience of [research.businessBuyer, research.endCustomer]) {
    for (const parent of audience.researches) {
      if (parent.researchBlock !== "lp_sections") continue;
      for (const item of parent.items) {
        const sourcePriority = normalizeSourcePriority(item.priority);
        if (sourcePriority === null) return null;
        sections.push({
          audience_scope: audience.audienceScope,
          item_id: item.itemId,
          item_key: item.itemKey,
          section_name: item.itemText,
          source_priority: sourcePriority,
          source_order: item.sortOrder,
        });
      }
    }
  }
  return sections;
}

export function validateGenerationProfileResearchPriorities(research: ResolvedLandingPageResearch) {
  return readLpSections(research) !== null;
}

function normalizeSourcePriority(value: number): 1 | 2 | 3 | null {
  return value === 1 || value === 2 || value === 3 ? value : null;
}

function coverageIdentityKey(value: { audience_scope: string; item_id: string }) {
  return `${value.audience_scope}:${value.item_id}`;
}

function compactResearch(research: ResolvedLandingPageResearch) {
  return {
    business_buyer: compactResearchAudience(research.businessBuyer),
    end_customer: compactResearchAudience(research.endCustomer),
  };
}

function compactResearchAudience(audience: ResolvedLandingPageResearch["businessBuyer"]) {
  const texts = (block: "strategic_core" | "lp_overview" | "seo") => audience.researches
    .filter((parent) => parent.researchBlock === block)
    .flatMap((parent) => parent.items.map((item) => item.itemText));
  return {
    strategic_core: texts("strategic_core"),
    lp_overview: texts("lp_overview"),
    seo: texts("seo"),
    lp_sections: audience.researches
      .filter((parent) => parent.researchBlock === "lp_sections")
      .flatMap((parent) => parent.items.map((item) => ({
        coverage_id: `${audience.audienceScope}:${item.itemId}`,
        text: item.itemText,
      }))),
  };
}

function buildIdentityAliasEntries(catalog: LandingPageModuleIdentityCatalog) {
  return catalog.modules.flatMap((module) => [
    { alias: module.moduleKey, identity: { moduleKey: module.moduleKey, moduleVersion: module.moduleVersion } },
    ...module.variants.map((variant) => ({
      alias: variant.variantKey,
      identity: {
        moduleKey: module.moduleKey,
        moduleVersion: module.moduleVersion,
        variantKey: variant.variantKey,
        variantVersion: variant.variantVersion,
      },
    })),
  ] satisfies readonly Readonly<{ alias: string; identity: GenerationProfileCoverageIdentity }>[]);
}

function identityAlias(identity: GenerationProfileCoverageIdentity) {
  return identity.variantKey ?? identity.moduleKey;
}

function deriveRecommendations(coverage: readonly GenerationProfileCoverage[]): GenerationProfileStructuralRecommendation[] {
  const byModule = new Map<string, { identity: GenerationProfileCoverage["selectedIdentities"][number]; priority: "P1" | "P2" | "P3"; sourceOrder: number; coverageIndex: number }>();
  coverage.forEach((item, coverageIndex) => {
    if (item.status === "missing") return;
    item.selectedIdentities.forEach((identity) => {
      const priority = item.sourcePriority === 3 ? "P1" : item.sourcePriority === 2 ? "P2" : "P3";
      const existing = byModule.get(identity.moduleKey);
      if (!existing) {
        byModule.set(identity.moduleKey, { identity, priority, sourceOrder: item.sourceOrder, coverageIndex });
        return;
      }
      if (priorityRank(priority) < priorityRank(existing.priority)) existing.priority = priority;
      if (item.sourceOrder < existing.sourceOrder) existing.sourceOrder = item.sourceOrder;
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

function isSelectedIdentityCountValid(status: "covered" | "partial" | "missing", identityCount: number) {
  return status === "missing" ? identityCount === 0 : identityCount > 0;
}

function priorityRank(value: "P1" | "P2" | "P3") {
  return value === "P1" ? 1 : value === "P2" ? 2 : 3;
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

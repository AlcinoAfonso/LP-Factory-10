import "server-only";

import { createHash } from "node:crypto";

import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  applyLandingPageInputCatalogDraftOperation,
  createNextLandingPageInputCatalogDraft,
  landingPageInputCatalogRegistry,
  listLandingPageInputCatalogVersions,
  projectLandingPageInputCatalogDraftReleaseTaxons,
  validateLandingPageInputCatalogDraftProjectedImpacts,
  validateLandingPageInputCatalogDraft,
  serializeLandingPageInputCatalogEntry,
  type LandingPageInputCatalogDraftImpact,
  type LandingPageInputCatalogDraftOperation,
  type LandingPageInputCatalogLayerLevel,
  type LandingPageInputCatalogRegistryEntry,
} from "@/conversion-content/landing-page/input-catalog";
import { reconstructDraftInputCatalogEvaluationContext } from "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter";
import {
  fingerprintInputCatalogEvaluationContextIdentity,
  type BuildInputCatalogEvaluationContextResult,
} from "@/conversion-content/landing-page/taxon-preparation";
import { createServiceClient } from "@/lib/supabase/service";
import {
  authorizeAdminInputCatalogFactualPublication,
  reconcileAdminInputCatalogFactualPublication,
  saveAdminInputCatalogDraft,
} from "./adminTaxonFactualReviewAdapter";
import { readCompleteLifecycleContext, type LifecycleContext } from "./adminInputCatalogLifecycleContext";
import {
  collectRequiredFactualReviewTaxonIds,
  createInputCatalogLifecycleProof,
  hasCompleteFactualReviewCoverage,
  parsePersistedInputCatalogEvaluationMode,
  serializeInputCatalogLifecycleValue,
  snapshotInputCatalogLifecycleContext,
} from "./adminInputCatalogLifecycleValidation";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type AdminInputCatalogEditorLayer = Readonly<{
  target:
    | Readonly<{ kind: "universal" }>
    | Readonly<{ kind: "taxon_layer"; taxonId: string }>;
  label: string;
  level: LandingPageInputCatalogLayerLevel;
  ownFields: readonly Readonly<{
    fieldKey: string;
    retiredInVersion: number | null;
  }>[];
}>;

export type AdminInputCatalogLifecycleState = Readonly<{
  currentVersion: number;
  publishedVersions: readonly number[];
  totalActiveTaxons: number;
  draft: null | Readonly<{
    baseVersion: number;
    targetVersion: number;
    editorLayers: readonly AdminInputCatalogEditorLayer[];
    contentFingerprint: string;
    lifecycleContextFingerprint: string;
    revision: number;
    validationCurrent: boolean;
    publicationPrepared: boolean;
    publishedReconciliationRequired: boolean;
    publishedReconciliationAllowed: boolean;
    reviewedTaxonIds: readonly string[];
    updatedAt: string;
    impacts: readonly LandingPageInputCatalogDraftImpact[];
    totals: Readonly<{
      noMaterialChange: number;
      compatibleEvolution: number;
      reviewRequired: number;
    }>;
  }>;
  error: string | null;
}>;

export type AdminInputCatalogLifecycleMutationResult =
  | Readonly<{ ok: true; state: AdminInputCatalogLifecycleState; handoff?: string }>
  | Readonly<{
      ok: false;
      code: "INVALID_INPUT" | "CONFLICT" | "UNAVAILABLE" | "BLOCKED";
      message: string;
    }>;

export async function readAdminInputCatalogLifecycle(): Promise<AdminInputCatalogLifecycleState> {
  const client = createServiceClient();
  const early = await readDraftRow(client);
  const context = await readCandidateLifecycleContext(client, early.ok ? early.value?.catalogJson : undefined);
  if (!context.ok) return unavailableState(context.message);
  const row = await readDraftRow(client);
  if (!row.ok) return unavailableState(row.message, context);
  if (!sameDraftIdentity(early, row)) return unavailableState(DRAFT_CHANGED, context);
  return await buildState(context, row.value);
}

export async function initializeAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  const client = createServiceClient();
  const draft = createNextLandingPageInputCatalogDraft();
  const context = await readCandidateLifecycleContext(client, draft);
  if (!context.ok) return unavailable(context.message);
  const candidate = validateLandingPageInputCatalogDraft({
    draft,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return blocked(candidate.error.message);
  const contentFingerprint = fingerprint(candidate.value.canonicalJson);
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .insert({
      singleton: true,
      base_version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      target_version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION + 1,
      catalog_json: candidate.value.entry,
      content_fingerprint: contentFingerprint,
      revision: 1,
      validation_fingerprint: null,
      validation_context_fingerprint: null,
      validated_at: null,
      publication_fingerprint: null,
      publication_context_fingerprint: null,
      publication_context_snapshot: null,
      publication_required_taxon_ids: [],
      publication_prepared_at: null,
      taxon_review_evidence: {},
      created_by: input.actorUserId,
      updated_by: input.actorUserId,
    })
    .select(DRAFT_SELECT)
    .maybeSingle();
  if (error?.code === "23505") return conflict("Já existe um draft administrativo.");
  const row = normalizeDraftRow(data);
  if (error || !row) return unavailable("O draft não pôde ser criado.");
  return { ok: true, state: await buildState(context, row) };
}

export async function applyAdminInputCatalogDraftOperation(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  operation: LandingPageInputCatalogDraftOperation;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision <= 0) {
    return invalid("A revisão esperada do draft é inválida.");
  }
  const client = createServiceClient();
  const current = await readDraftRow(client);
  if (!current.ok || !current.value) {
    return unavailable(current.ok ? "O draft não existe." : current.message);
  }
  if (current.value.revision !== input.expectedRevision) {
    return conflict("O draft mudou em outra sessão. Recarregue antes de editar.");
  }
  const context = await readCompleteLifecycleContext(client, { fingerprint: false });
  if (!context.ok) return unavailable(context.message);
  const applied = applyLandingPageInputCatalogDraftOperation({
    draft: current.value.catalogJson,
    operation: input.operation,
    taxons: context.value.taxons,
    releaseTaxonIds: context.value.unclosedReleaseTaxonIds,
  });
  if (!applied.ok) return invalid(applied.error.message);
  const contentFingerprint = fingerprint(applied.value.canonicalJson);
  const saved = await saveAdminInputCatalogDraft({
    actorUserId: input.actorUserId,
    expectedRevision: input.expectedRevision,
    catalogJson: applied.value.entry,
    contentFingerprint,
  });
  if (!saved.ok) return conflict(saved.message);

  const refreshedContext = await readProjectedCandidateLifecycleContext(
    client,
    applied.value.entry,
  );
  if (!refreshedContext.ok) return unavailable(refreshedContext.message);
  const refreshed = await readDraftRow(client);
  if (!refreshed.ok || !refreshed.value || refreshed.value.revision !== saved.revision) {
    return unavailable("O draft editado não pôde ser relido integralmente.");
  }
  return {
    ok: true,
    state: await buildState(refreshedContext, refreshed.value),
  };
}

export async function validateAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  const client = createServiceClient();
  const early = await readDraftRow(client);
  const context = await readCandidateLifecycleContext(client, early.ok ? early.value?.catalogJson : undefined);
  if (!context.ok) return unavailable(context.message);
  const current = await readDraftRow(client);
  if (!current.ok || !current.value) {
    return unavailable(current.ok ? "O draft não existe." : current.message);
  }
  if (current.value.revision !== input.expectedRevision) {
    return conflict("O draft mudou em outra sessão. Recarregue antes de validar.");
  }
  const candidate = validateLandingPageInputCatalogDraft({
    draft: current.value.catalogJson,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return blocked(candidate.error.message);
  if (!sameDraftIdentity(early, current)) return conflict(DRAFT_CHANGED);
  const proof = proofForCandidate(context.value, candidate.value);
  if (!proof) return unavailable(DRAFT_CHANGED);
  const fingerprintValue = fingerprint(candidate.value.canonicalJson);
  const lifecycleContextFingerprint = proof.fingerprint;
  if (fingerprintValue !== current.value.contentFingerprint) {
    return conflict("A identidade do draft não corresponde ao conteúdo salvo.");
  }
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      validation_fingerprint: fingerprintValue,
      validation_context_fingerprint: lifecycleContextFingerprint,
      validated_at: new Date().toISOString(),
      publication_fingerprint: null,
      publication_context_fingerprint: null,
      publication_context_snapshot: null,
      publication_required_taxon_ids: [],
      publication_prepared_at: null,
      updated_by: input.actorUserId,
    })
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .eq("content_fingerprint", fingerprintValue)
    .maxAffected(1)
    .select(DRAFT_SELECT)
    .maybeSingle();
  if (error) return unavailable("A validação do draft não pôde ser registrada.");
  const row = normalizeDraftRow(data);
  if (!row) return conflict("O draft mudou durante a validação.");
  return { ok: true, state: await buildState(context, row) };
}

export async function prepareAdminInputCatalogPublication(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  const client = createServiceClient();
  const early = await readDraftRow(client);
  const context = await readCandidateLifecycleContext(client, early.ok ? early.value?.catalogJson : undefined);
  if (!context.ok) return unavailable(context.message);
  const current = await readDraftRow(client);
  if (!current.ok || !current.value) {
    return unavailable(current.ok ? "O draft não existe." : current.message);
  }
  if (current.value.revision !== input.expectedRevision) {
    return conflict("O draft mudou em outra sessão.");
  }
  const candidate = validateLandingPageInputCatalogDraft({
    draft: current.value.catalogJson,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return blocked(candidate.error.message);
  if (!sameDraftIdentity(early, current)) return conflict(DRAFT_CHANGED);
  const proof = proofForCandidate(context.value, candidate.value);
  if (!proof) return unavailable(DRAFT_CHANGED);
  const fingerprintValue = fingerprint(candidate.value.canonicalJson);
  const lifecycleContextFingerprint = proof.fingerprint;
  if (
    current.value.validationFingerprint !== fingerprintValue ||
    current.value.validationContextFingerprint !== lifecycleContextFingerprint ||
    current.value.contentFingerprint !== fingerprintValue
  ) {
    return blocked("Valide novamente o conteúdo exato antes de preparar a publicação.");
  }
  const requiredTaxonIds = Object.freeze([
    ...new Set([
      ...requiredFactualReviewTaxonIds(candidate.value, context.value),
      ...Object.keys(current.value.taxonReviewEvidence),
    ]),
  ].sort());
  const reviewStatus = await validateReviewEvidence(
    candidate.value,
    current.value,
    requiredTaxonIds,
  );
  if (!hasCompleteFactualReviewCoverage({
    requiredTaxonIds,
    evidenceTaxonIds: reviewStatus.validTaxonIds,
  })) {
    return blocked("Todas as decisões factuais do draft exato são obrigatórias antes da autorização.");
  }
  const authorized = await authorizeAdminInputCatalogFactualPublication({
    actorUserId: input.actorUserId,
    expectedRevision: input.expectedRevision,
    contentFingerprint: fingerprintValue,
    contextFingerprint: lifecycleContextFingerprint,
    contextSnapshot: snapshotInputCatalogLifecycleContext(context.value),
    requiredTaxonIds,
  });
  if (!authorized.ok) return blocked(authorized.message);
  const refreshed = await readDraftRow(client);
  if (!refreshed.ok || !refreshed.value) {
    return unavailable("O draft autorizado não pôde ser relido.");
  }
  const row = refreshed.value;
  return {
    ok: true,
    state: await buildState(context, row),
    handoff: buildPublicationHandoff(
      row,
      candidate.value.canonicalJson,
      lifecycleContextFingerprint,
    ),
  };
}

export async function reconcileAdminInputCatalogPublishedDraft(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  runtimeEnvironment: string | undefined;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  if (input.runtimeEnvironment !== "production") {
    return blocked("A reconciliação do draft só pode ocorrer no runtime de Production.");
  }
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision <= 0) {
    return invalid("A revisão administrativa do draft é inválida.");
  }
  const client = createServiceClient();
  const current = await readDraftRow(client);
  if (!current.ok) return unavailable(current.message);
  if (!current.value) return unavailable("O draft não existe.");
  const currentEntry = landingPageInputCatalogRegistry[
    CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION
  ];
  const deployedFingerprint = fingerprint(
    serializeLandingPageInputCatalogEntry(currentEntry),
  );
  const storedDraftFingerprint = fingerprint(
    serializeLandingPageInputCatalogEntry(
      current.value.catalogJson as LandingPageInputCatalogRegistryEntry,
    ),
  );
  if (
    current.value.revision !== input.expectedRevision ||
    current.value.targetVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION ||
    current.value.baseVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION - 1 ||
    storedDraftFingerprint !== deployedFingerprint ||
    current.value.contentFingerprint !== deployedFingerprint ||
    current.value.publicationFingerprint !== deployedFingerprint ||
    current.value.publicationContextFingerprint === null ||
    current.value.publicationContextSnapshot === null
  ) {
    return blocked(
      "O registry implantado ainda não comprova exatamente o draft congelado.",
    );
  }

  const reconciled = await reconcileAdminInputCatalogFactualPublication({
    actorUserId: input.actorUserId,
    expectedRevision: input.expectedRevision,
    deployedVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    deployedContentFingerprint: deployedFingerprint,
    publicationContextFingerprint: current.value.publicationContextFingerprint,
  });
  if (!reconciled.ok) return conflict(reconciled.message);
  const finalContext = await readCompleteLifecycleContext(client);
  if (!finalContext.ok) return unavailable(finalContext.message);
  return {
    ok: true,
    state: await buildState(finalContext, null),
    handoff: `Versão ${CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION} reconciliada atomicamente com ${reconciled.reconciledTaxonCount} sessão(ões) factual(is); a residência temporária foi encerrada.`,
  };
}

export async function loadAdminInputCatalogDraftEvaluationContext(input: Readonly<{
  expectedRevision: number;
  taxonId: string;
  mode?: import("@/conversion-content/landing-page/taxon-preparation").InputCatalogEvaluationMode;
}>): Promise<
  | Readonly<{
      ok: true;
      value: Readonly<{
        context: Extract<BuildInputCatalogEvaluationContextResult, { ok: true }>["value"];
        contentFingerprint: string;
        targetVersion: number;
      }>;
    }>
  | Readonly<{ ok: false; message: string }>
> {
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision <= 0) {
    return { ok: false, message: "A revisão administrativa do draft é inválida." };
  }
  const client = createServiceClient();
  const [context, row] = await Promise.all([
    readCompleteLifecycleContext(client),
    readDraftRow(client),
  ]);
  if (!context.ok || !row.ok || !row.value) {
    return { ok: false, message: "O draft ou seu contexto administrativo está indisponível." };
  }
  if (row.value.revision !== input.expectedRevision) {
    return { ok: false, message: "O draft mudou; recarregue antes de avaliar." };
  }
  const candidate = validateLandingPageInputCatalogDraft({
    draft: row.value.catalogJson,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return { ok: false, message: candidate.error.message };
  const impact = candidate.value.impacts.find(
    (candidateImpact) => candidateImpact.taxon.id === input.taxonId,
  );
  if (
    (!impact || impact.classification !== "review_required") &&
    !context.value.unclosedReleaseTaxonIds.includes(input.taxonId)
  ) {
    return {
      ok: false,
      message: "O taxon não exige avaliação semântica para o conteúdo atual do draft.",
    };
  }
  const evaluation = await reconstructDraftInputCatalogEvaluationContext(
    {
      taxonId: input.taxonId,
      inputCatalogVersion: candidate.value.entry.version,
      mode: input.mode,
    },
    candidate.value.registry,
  );
  if (!evaluation.ok) return { ok: false, message: evaluation.error.message };
  return {
    ok: true,
    value: Object.freeze({
      context: evaluation.value,
      contentFingerprint: row.value.contentFingerprint,
      targetVersion: row.value.targetVersion,
    }),
  };
}

type DraftRow = Readonly<{
  baseVersion: number;
  targetVersion: number;
  catalogJson: unknown;
  contentFingerprint: string;
  revision: number;
  validationFingerprint: string | null;
  validationContextFingerprint: string | null;
  publicationFingerprint: string | null;
  publicationContextFingerprint: string | null;
  publicationContextSnapshot: Readonly<Record<string, unknown>> | null;
  publicationRequiredTaxonIds: readonly string[];
  taxonReviewEvidence: Readonly<Record<string, DraftTaxonReviewEvidence>>;
  updatedAt: string;
}>;

type DraftTaxonReviewEvidence = Readonly<{
  reviewId: string;
  reviewRevision: number;
  draftRevision: number;
  contentFingerprint: string;
  contextFingerprint: string;
}>;

const DRAFT_SELECT =
  "base_version,target_version,catalog_json,content_fingerprint,revision,validation_fingerprint,validation_context_fingerprint,publication_fingerprint,publication_context_fingerprint,publication_context_snapshot,publication_required_taxon_ids,taxon_review_evidence,updated_at";

const DRAFT_CHANGED = "O draft mudou durante a leitura do contexto. Recarregue antes de continuar.";

async function readCandidateLifecycleContext(client: ServiceClient, draft: unknown) {
  if (draft === undefined) {
    return readCompleteLifecycleContext(client, { fingerprint: false });
  }
  const projected = await readProjectedCandidateLifecycleContext(client, draft);
  return projected.ok
    ? { ok: true as const, value: projected.value }
    : projected;
}

async function readProjectedCandidateLifecycleContext(
  client: ServiceClient,
  draft: unknown,
): Promise<
  | Readonly<{
      ok: true;
      value: LifecycleContext;
    }>
  | Readonly<{ ok: false; message: string }>
> {
  const context = await readCompleteLifecycleContext(client, { fingerprint: false });
  if (!context.ok) return context;
  const projection = projectLandingPageInputCatalogDraftReleaseTaxons({
    taxons: context.value.taxons,
    releaseTaxonIds: context.value.unclosedReleaseTaxonIds,
  });
  if (!projection.ok) return { ok: false, message: projection.error.message };
  const candidate = validateLandingPageInputCatalogDraftProjectedImpacts({
    draft,
    taxons: projection.value,
    projectedTaxonIds: context.value.unclosedReleaseTaxonIds,
  });
  if (!candidate.ok) return { ok: false, message: candidate.error.message };
  const projectedContext = {
    taxons: projection.value,
    unclosedReleaseTaxonIds: context.value.unclosedReleaseTaxonIds,
  };
  return {
    ok: true,
    value: {
      ...projectedContext,
      lifecycleProof: createInputCatalogLifecycleProof({
        fingerprint: true,
        candidate: candidate.value,
      }).finish(projectedContext),
    },
  };
}

function sameDraftIdentity(
  early: Awaited<ReturnType<typeof readDraftRow>>,
  current: Awaited<ReturnType<typeof readDraftRow>>,
): boolean {
  if (!early.ok || !current.ok) return false;
  if (!early.value || !current.value) return early.value === current.value;
  return early.value.baseVersion === current.value.baseVersion &&
    early.value.targetVersion === current.value.targetVersion &&
    early.value.revision === current.value.revision &&
    early.value.contentFingerprint === current.value.contentFingerprint &&
    serializeInputCatalogLifecycleValue(early.value.catalogJson) ===
      serializeInputCatalogLifecycleValue(current.value.catalogJson);
}

function proofForCandidate(
  context: LifecycleContext,
  candidate: Extract<ReturnType<typeof validateLandingPageInputCatalogDraft>, { ok: true }>["value"],
) {
  const proof = context.lifecycleProof;
  if (!proof || proof.candidateContentFingerprint !== fingerprint(candidate.canonicalJson)) {
    return null;
  }
  return proof;
}

async function readDraftRow(
  client: ServiceClient,
): Promise<
  | Readonly<{ ok: true; value: DraftRow | null }>
  | Readonly<{ ok: false; message: string }>
> {
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .select(DRAFT_SELECT)
    .eq("singleton", true)
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, message: "A residência do draft está indisponível." };
  if (!data) return { ok: true, value: null };
  const row = normalizeDraftRow(data);
  return row
    ? { ok: true, value: row }
    : { ok: false, message: "A residência do draft contém estado inválido." };
}

async function buildState(
  contextResult: Extract<Awaited<ReturnType<typeof readCompleteLifecycleContext>>, { ok: true }> | LifecycleContext,
  row: DraftRow | null,
): Promise<AdminInputCatalogLifecycleState> {
  const context = "value" in contextResult ? contextResult.value : contextResult;
  const releaseTaxonIds = new Set(context.unclosedReleaseTaxonIds);
  const totalActiveTaxons = context.taxons.filter(
    (taxon) => taxon.identity.isActive && !releaseTaxonIds.has(taxon.identity.id),
  ).length;
  if (!row) {
    return {
      currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      publishedVersions: listLandingPageInputCatalogVersions(),
      totalActiveTaxons,
      draft: null,
      error: null,
    };
  }
  const lifecycleContextFingerprint = context.lifecycleProof?.fingerprint ?? "";
  if (row.targetVersion === CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION) {
    const deployedFingerprint = fingerprint(
      serializeLandingPageInputCatalogEntry(
        landingPageInputCatalogRegistry[CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION],
      ),
    );
    const storedDraftFingerprint = fingerprint(
      serializeLandingPageInputCatalogEntry(
        row.catalogJson as LandingPageInputCatalogRegistryEntry,
      ),
    );
    if (
      row.baseVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION - 1 ||
      storedDraftFingerprint !== deployedFingerprint ||
      row.contentFingerprint !== deployedFingerprint ||
      row.publicationFingerprint !== deployedFingerprint ||
      row.publicationContextFingerprint === null ||
      row.publicationContextSnapshot === null
    ) {
      return unavailableState(
        "O draft implantado diverge do registry atual e não pode ser reconciliado automaticamente.",
        { ok: true, value: context },
      );
    }
    return {
      currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      publishedVersions: listLandingPageInputCatalogVersions(),
      totalActiveTaxons,
      draft: {
        baseVersion: row.baseVersion,
        targetVersion: row.targetVersion,
        editorLayers: [],
        contentFingerprint: row.contentFingerprint,
        lifecycleContextFingerprint,
        revision: row.revision,
        validationCurrent: row.validationFingerprint === row.contentFingerprint,
        publicationPrepared: true,
        publishedReconciliationRequired: true,
        publishedReconciliationAllowed: process.env.VERCEL_ENV === "production",
        reviewedTaxonIds: Object.keys(row.taxonReviewEvidence).sort(),
        updatedAt: row.updatedAt,
        impacts: [],
        totals: {
          noMaterialChange: 0,
          compatibleEvolution: 0,
          reviewRequired: 0,
        },
      },
      error: null,
    };
  }
  if (row.baseVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION) {
    return unavailableState(
      "A residência temporária não corresponde à versão atual nem ao próximo draft sequencial.",
      { ok: true, value: context },
    );
  }
  const projectedReleaseTaxonIds = context.unclosedReleaseTaxonIds.filter((taxonId) =>
    context.taxons.some(
      (taxon) => taxon.identity.id === taxonId && taxon.identity.isActive,
    ),
  );
  if (
    projectedReleaseTaxonIds.length > 0 &&
    projectedReleaseTaxonIds.length !== context.unclosedReleaseTaxonIds.length
  ) {
    return unavailableState(
      "A projeção das releases está incompleta.",
      { ok: true, value: context },
    );
  }
  const candidate = projectedReleaseTaxonIds.length > 0
    ? validateLandingPageInputCatalogDraftProjectedImpacts({
        draft: row.catalogJson,
        taxons: context.taxons,
        projectedTaxonIds: projectedReleaseTaxonIds,
      })
    : validateLandingPageInputCatalogDraft({
        draft: row.catalogJson,
        taxons: context.taxons,
      });
  if (!candidate.ok) return unavailableState(candidate.error.message, { ok: true, value: context });
  const proof = proofForCandidate(context, candidate.value);
  if (!proof) return unavailableState(DRAFT_CHANGED, { ok: true, value: context });
  const reviewStatus = await validateReviewEvidence(
    candidate.value,
    row,
    requiredFactualReviewTaxonIds(candidate.value, context),
  );
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
    totalActiveTaxons,
    draft: {
      baseVersion: row.baseVersion,
      targetVersion: row.targetVersion,
      editorLayers: buildEditorLayers(candidate.value.entry, candidate.value.impacts),
      contentFingerprint: row.contentFingerprint,
      lifecycleContextFingerprint,
      revision: row.revision,
      validationCurrent:
        row.validationFingerprint === row.contentFingerprint &&
        row.validationContextFingerprint === lifecycleContextFingerprint,
      publicationPrepared:
        row.publicationFingerprint === row.contentFingerprint &&
        row.publicationContextFingerprint === lifecycleContextFingerprint &&
        row.publicationContextSnapshot !== null,
      publishedReconciliationRequired: false,
      publishedReconciliationAllowed: false,
      reviewedTaxonIds: reviewStatus.validTaxonIds,
      updatedAt: row.updatedAt,
      impacts: candidate.value.impacts,
      totals: {
        ...candidate.value.totals,
      },
    },
    error: null,
  };
}

function buildEditorLayers(
  entry: LandingPageInputCatalogRegistryEntry,
  impacts: readonly LandingPageInputCatalogDraftImpact[],
): readonly AdminInputCatalogEditorLayer[] {
  const ownFields = (
    entries: LandingPageInputCatalogRegistryEntry["universal"]["entries"],
  ): AdminInputCatalogEditorLayer["ownFields"] => entries.flatMap((field) =>
    field.kind === "field"
      ? [{
          fieldKey: field.fieldKey,
          retiredInVersion: field.retiredInVersion ?? null,
        }]
      : [],
  );
  const layersByTaxonId = new Map(
    Object.values(entry.taxonLayers).flatMap((layer) =>
      layer.taxon ? [[layer.taxon.id, layer] as const] : [],
    ),
  );
  return [
    {
      target: { kind: "universal" },
      label: "Universal",
      level: "universal",
      ownFields: ownFields(entry.universal.entries),
    },
    ...impacts.map((impact) => {
      const layer = layersByTaxonId.get(impact.taxon.id);
      return {
        target: { kind: "taxon_layer" as const, taxonId: impact.taxon.id },
        label: impact.taxon.name,
        level: impact.taxon.level,
        ownFields: layer ? ownFields(layer.entries) : [],
      };
    }),
  ];
}

async function validateReviewEvidence(
  candidate: Extract<
    ReturnType<typeof validateLandingPageInputCatalogDraft>,
    { ok: true }
  >["value"],
  row: DraftRow,
  requiredTaxonIds: readonly string[],
): Promise<Readonly<{ validTaxonIds: readonly string[] }>> {
  const client = createServiceClient();
  const validTaxonIds: string[] = [];
  for (const taxonId of requiredTaxonIds) {
    const evidence = row.taxonReviewEvidence[taxonId];
    if (
      !evidence ||
      evidence.draftRevision !== row.revision ||
      evidence.contentFingerprint !== row.contentFingerprint
    ) {
      continue;
    }
    const { data: review } = await client
      .from("business_taxon_factual_reviews")
      .select("id,taxon_id,status,outcome,revision,evaluation_mode,evaluation_source,evaluation_draft_revision,evaluation_context_fingerprint")
      .eq("id", evidence.reviewId)
      .maybeSingle();
    const evaluationMode = isRecord(review)
      ? parsePersistedInputCatalogEvaluationMode(review.evaluation_mode)
      : null;
    if (
      !isRecord(review) ||
      evaluationMode === null ||
      review.taxon_id !== taxonId ||
      review.status !== "closed" ||
      (review.outcome !== "no_change" && review.outcome !== "catalog_change") ||
      Number(review.revision) !== evidence.reviewRevision ||
      review.evaluation_source !== "draft" ||
      Number(review.evaluation_draft_revision) !== row.revision ||
      review.evaluation_context_fingerprint !== evidence.contextFingerprint
    ) {
      continue;
    }
    const current = await reconstructDraftInputCatalogEvaluationContext(
      { taxonId, inputCatalogVersion: candidate.entry.version, mode: evaluationMode },
      candidate.registry,
    );
    if (
      !current.ok ||
      fingerprintInputCatalogEvaluationContextIdentity(current.value.identity) !==
        evidence.contextFingerprint
    ) {
      continue;
    }
    validTaxonIds.push(taxonId);
  }
  return Object.freeze({
    validTaxonIds: Object.freeze(validTaxonIds.sort()),
  });
}

function requiredFactualReviewTaxonIds(
  candidate: Extract<
    ReturnType<typeof validateLandingPageInputCatalogDraft>,
    { ok: true }
  >["value"],
  context: LifecycleContext,
): readonly string[] {
  return collectRequiredFactualReviewTaxonIds({
    activeReviewRequiredTaxonIds: candidate.impacts
      .filter((impact) => impact.classification === "review_required")
      .map((impact) => impact.taxon.id),
    unclosedReleaseTaxonIds: context.unclosedReleaseTaxonIds,
  });
}

function normalizeDraftRow(value: unknown): DraftRow | null {
  if (!isRecord(value)) return null;
  if (
    !Number.isSafeInteger(value.base_version) ||
    !Number.isSafeInteger(value.target_version) ||
    value.target_version !== Number(value.base_version) + 1 ||
    !isRecord(value.catalog_json) ||
    typeof value.content_fingerprint !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.content_fingerprint) ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) <= 0 ||
    (value.validation_fingerprint !== null &&
      (typeof value.validation_fingerprint !== "string" ||
        !/^[0-9a-f]{64}$/.test(value.validation_fingerprint))) ||
    (value.validation_context_fingerprint !== null &&
      (typeof value.validation_context_fingerprint !== "string" ||
        !/^[0-9a-f]{64}$/.test(value.validation_context_fingerprint))) ||
    (value.publication_fingerprint !== null &&
      (typeof value.publication_fingerprint !== "string" ||
        !/^[0-9a-f]{64}$/.test(value.publication_fingerprint))) ||
    (value.publication_context_fingerprint !== null &&
      (typeof value.publication_context_fingerprint !== "string" ||
        !/^[0-9a-f]{64}$/.test(value.publication_context_fingerprint))) ||
    (value.publication_context_snapshot !== null && !isRecord(value.publication_context_snapshot)) ||
    !Array.isArray(value.publication_required_taxon_ids) ||
    value.publication_required_taxon_ids.some((taxonId) =>
      typeof taxonId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taxonId)
    ) ||
    new Set(value.publication_required_taxon_ids).size !== value.publication_required_taxon_ids.length ||
    typeof value.updated_at !== "string"
  ) return null;
  const taxonReviewEvidence = normalizeDraftTaxonReviewEvidence(
    value.taxon_review_evidence,
  );
  if (!taxonReviewEvidence) return null;
  return {
    baseVersion: value.base_version as number,
    targetVersion: value.target_version as number,
    catalogJson: value.catalog_json,
    contentFingerprint: value.content_fingerprint,
    revision: value.revision as number,
    validationFingerprint: value.validation_fingerprint as string | null,
    validationContextFingerprint:
      value.validation_context_fingerprint as string | null,
    publicationFingerprint: value.publication_fingerprint as string | null,
    publicationContextFingerprint:
      value.publication_context_fingerprint as string | null,
    publicationContextSnapshot:
      value.publication_context_snapshot as Readonly<Record<string, unknown>> | null,
    publicationRequiredTaxonIds: Object.freeze([
      ...(value.publication_required_taxon_ids as string[]),
    ].sort()),
    taxonReviewEvidence,
    updatedAt: value.updated_at,
  };
}

function normalizeDraftTaxonReviewEvidence(
  value: unknown,
): Readonly<Record<string, DraftTaxonReviewEvidence>> | null {
  if (!isRecord(value)) return null;
  const normalized: Record<string, DraftTaxonReviewEvidence> = {};
  for (const [taxonId, raw] of Object.entries(value)) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taxonId) ||
      !isRecord(raw) ||
      typeof raw.review_id !== "string" ||
      !Number.isSafeInteger(raw.review_revision) ||
      Number(raw.review_revision) <= 0 ||
      !Number.isSafeInteger(raw.draft_revision) ||
      Number(raw.draft_revision) <= 0 ||
      typeof raw.content_fingerprint !== "string" ||
      !/^[0-9a-f]{64}$/.test(raw.content_fingerprint) ||
      typeof raw.context_fingerprint !== "string" ||
      !/^[0-9a-f]{64}$/.test(raw.context_fingerprint)
    ) return null;
    normalized[taxonId] = Object.freeze({
      reviewId: raw.review_id,
      reviewRevision: Number(raw.review_revision),
      draftRevision: Number(raw.draft_revision),
      contentFingerprint: raw.content_fingerprint,
      contextFingerprint: raw.context_fingerprint,
    });
  }
  return Object.freeze(normalized);
}

function buildPublicationHandoff(
  row: DraftRow,
  canonicalJson: string,
  lifecycleContextFingerprint: string,
): string {
  return [
    `E20.2.8 — materializar versão ${row.targetVersion} no registry repo-only`,
    `Base publicada: ${row.baseVersion}`,
    `Fingerprint do conteúdo SHA-256: ${row.contentFingerprint}`,
    `Fingerprint do contexto E20 SHA-256: ${lifecycleContextFingerprint}`,
    "",
    "Instruções vinculantes:",
    "- materializar este conteúdo como nova versão imutável no registry;",
    "- alterar a declaração explícita de versão atual no mesmo diff;",
    "- imediatamente antes da revisão/merge, reabrir o Admin e comprovar que validação e handoff continuam atuais para estes dois fingerprints;",
    "- validar CI/Preview e obter revisão/merge humanos;",
    "- somente o deploy de Production torna a versão atual observável;",
    "- não copiar este draft para uma autoridade publicada em banco.",
    "",
    canonicalJson,
  ].join("\n");
}

function fingerprint(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson).digest("hex");
}

function unavailableState(
  message: string,
  context?: Extract<Awaited<ReturnType<typeof readCompleteLifecycleContext>>, { ok: true }>,
): AdminInputCatalogLifecycleState {
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
    totalActiveTaxons: context?.value.taxons.length ?? 0,
    draft: null,
    error: message,
  };
}

function invalid(message: string): AdminInputCatalogLifecycleMutationResult {
  return { ok: false, code: "INVALID_INPUT", message };
}

function conflict(message: string): AdminInputCatalogLifecycleMutationResult {
  return { ok: false, code: "CONFLICT", message };
}

function unavailable(message: string): AdminInputCatalogLifecycleMutationResult {
  return { ok: false, code: "UNAVAILABLE", message };
}

function blocked(message: string): AdminInputCatalogLifecycleMutationResult {
  return { ok: false, code: "BLOCKED", message };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

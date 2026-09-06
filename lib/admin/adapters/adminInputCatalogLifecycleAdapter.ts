import "server-only";

import { createHash } from "node:crypto";

import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  createNextLandingPageInputCatalogDraft,
  landingPageInputCatalogRegistry,
  listLandingPageInputCatalogVersions,
  validateLandingPageInputCatalogDraft,
  serializeLandingPageInputCatalogEntry,
  buildLandingPageInputCatalogTaxonChain,
  classifyLandingPageInputCatalogTransitionForTaxon,
  type LandingPageInputCatalogDraftImpact,
  type LandingPageInputCatalogRegistry,
  type LandingPageInputCatalogRegistryEntry,
} from "@/conversion-content/landing-page/input-catalog";
import {
  reconstructCanonicalInputCatalogEvaluationContext,
  reconstructDraftInputCatalogEvaluationContext,
} from "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter";
import {
  fingerprintInputCatalogEvaluationContextIdentity,
  type BuildInputCatalogEvaluationContextResult,
  type InputCatalogEvaluationContextIdentity,
} from "@/conversion-content/landing-page/taxon-preparation";
import { createServiceClient } from "@/lib/supabase/service";
import { readCompleteLifecycleContext, type LifecycleContext } from "./adminInputCatalogLifecycleContext";
import {
  serializeInputCatalogLifecycleValue,
  planPublishedInputCatalogReviewReconciliation,
  validatePublishedInputCatalogReviewEvidenceContext,
} from "./adminInputCatalogLifecycleValidation";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type AdminInputCatalogLifecycleState = Readonly<{
  currentVersion: number;
  publishedVersions: readonly number[];
  totalActiveTaxons: number;
  draft: null | Readonly<{
    baseVersion: number;
    targetVersion: number;
    catalogJson: string;
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

export async function saveAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  catalogJson: string;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  if (
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision <= 0 ||
    typeof input.catalogJson !== "string" ||
    input.catalogJson.length > 1_000_000
  ) {
    return invalid("O draft informado é inválido.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.catalogJson);
  } catch {
    return invalid("O draft não contém JSON válido.");
  }
  const client = createServiceClient();
  const context = await readCandidateLifecycleContext(client, parsed);
  if (!context.ok) return unavailable(context.message);
  const candidate = validateLandingPageInputCatalogDraft({
    draft: parsed,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return invalid(candidate.error.message);
  const contentFingerprint = fingerprint(candidate.value.canonicalJson);
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      catalog_json: candidate.value.entry,
      content_fingerprint: contentFingerprint,
      revision: input.expectedRevision + 1,
      validation_fingerprint: null,
      validation_context_fingerprint: null,
      validated_at: null,
      publication_fingerprint: null,
      publication_context_fingerprint: null,
      publication_prepared_at: null,
      taxon_review_evidence: {},
      updated_by: input.actorUserId,
    })
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .maxAffected(1)
    .select(DRAFT_SELECT)
    .maybeSingle();
  if (error) return unavailable("O draft não pôde ser salvo.");
  const row = normalizeDraftRow(data);
  if (!row) return conflict("O draft mudou em outra sessão. Recarregue antes de salvar.");
  return { ok: true, state: await buildState(context, row) };
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
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      publication_fingerprint: fingerprintValue,
      publication_context_fingerprint: lifecycleContextFingerprint,
      publication_prepared_at: new Date().toISOString(),
      updated_by: input.actorUserId,
    })
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .eq("validation_fingerprint", fingerprintValue)
    .maxAffected(1)
    .select(DRAFT_SELECT)
    .maybeSingle();
  if (error) return unavailable("A preparação da publicação falhou.");
  const row = normalizeDraftRow(data);
  if (!row) return conflict("O draft mudou durante a preparação.");
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
  const [current, initialContext] = await Promise.all([
    readDraftRow(client),
    readCompleteLifecycleContext(client),
  ]);
  if (!current.ok) return unavailable(current.message);
  if (!current.value) return unavailable("O draft não existe.");
  if (!initialContext.ok) return unavailable(initialContext.message);
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
    current.value.publicationContextFingerprint === null
  ) {
    return blocked(
      "O registry implantado ainda não comprova exatamente o draft congelado.",
    );
  }

  const initialProof = await validatePublishedReviewEvidence(
    initialContext.value,
    current.value,
  );
  if (!initialProof.ok) return blocked(initialProof.message);
  const initialPlan = planPublishedInputCatalogReviewReconciliation({
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    impacts: initialProof.impacts,
    validEvidenceTaxonIds: new Set(initialProof.validEvidenceTaxonIds),
  });
  for (const taxonId of initialPlan.taxonIdsToAdvance) {
    const taxon = initialContext.value.taxons.find(
      (candidate) => candidate.identity.id === taxonId,
    );
    const evidenceContext = initialProof.contextsByTaxonId.get(taxonId);
    if (!taxon || !evidenceContext) {
      return blocked("A evidência E20.6.5 não possui identidade canônica revalidada.");
    }
    const advanced = await advancePublishedReviewMarker({
      client,
      taxon,
      evidenceContext,
      targetVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    });
    if (!advanced) {
      return conflict(
        "Uma decisão E20.6.5 mudou durante a materialização pós-publicação; o draft foi preservado.",
      );
    }
  }

  const finalContext = await readCompleteLifecycleContext(client);
  if (!finalContext.ok) return unavailable(finalContext.message);
  const finalProof = await validatePublishedReviewEvidence(
    finalContext.value,
    current.value,
  );
  if (!finalProof.ok) return blocked(finalProof.message);
  const finalPlan = planPublishedInputCatalogReviewReconciliation({
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    impacts: finalProof.impacts,
    validEvidenceTaxonIds: new Set(finalProof.validEvidenceTaxonIds),
  });
  const finalReviewedByTaxonId = new Map(
    finalContext.value.taxons.map((taxon) => [
      taxon.identity.id,
      taxon.reviewedVersion,
    ]),
  );
  if (
    finalPlan.taxonIdsToAdvance.length > 0 ||
    initialProof.validEvidenceTaxonIds.some(
      (taxonId) =>
        !finalProof.validEvidenceTaxonIds.includes(taxonId) ||
        finalReviewedByTaxonId.get(taxonId) !==
          CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    )
  ) {
    return conflict(
      "A leitura final não confirmou todos os efeitos das decisões E20.6.5; o draft foi preservado.",
    );
  }

  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .delete()
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .eq("content_fingerprint", deployedFingerprint)
    .maxAffected(1)
    .select("revision")
    .maybeSingle();
  if (error || !isRecord(data)) {
    return conflict("O draft mudou durante a reconciliação pós-deploy.");
  }
  return {
    ok: true,
    state: await buildState(finalContext, null),
    handoff: `Versão ${CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION} reconciliada com o registry implantado; decisões E20.6.5 válidas foram materializadas, a leitura final foi confirmada e a residência temporária foi encerrada.`,
  };
}

export async function loadAdminInputCatalogDraftEvaluationContext(input: Readonly<{
  expectedRevision: number;
  taxonId: string;
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
  if (!impact || impact.classification !== "review_required") {
    return {
      ok: false,
      message: "O taxon não exige avaliação semântica para o conteúdo atual do draft.",
    };
  }
  const evaluation = await reconstructDraftInputCatalogEvaluationContext(
    { taxonId: input.taxonId, inputCatalogVersion: candidate.value.entry.version },
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

export async function recordAdminInputCatalogDraftSufficiencyDecision(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  taxonId: string;
  expectedContentFingerprint: string;
  expectedContextFingerprint: string;
  decision: "confirm_sufficient" | "reject_candidates_and_confirm_sufficient";
}>): Promise<Readonly<{ ok: true; revision: number }> | Readonly<{ ok: false; message: string }>> {
  const current = await loadAdminInputCatalogDraftEvaluationContext({
    expectedRevision: input.expectedRevision,
    taxonId: input.taxonId,
  });
  if (!current.ok) return current;
  const contextFingerprint = fingerprintInputCatalogEvaluationContextIdentity(
    current.value.context.identity,
  );
  if (
    current.value.contentFingerprint !== input.expectedContentFingerprint ||
    contextFingerprint !== input.expectedContextFingerprint
  ) {
    return { ok: false, message: "O draft, a pesquisa ou a cadeia mudaram desde a avaliação." };
  }
  const client = createServiceClient();
  const row = await readDraftRow(client);
  if (!row.ok || !row.value || row.value.revision !== input.expectedRevision) {
    return { ok: false, message: "O draft mudou durante a decisão." };
  }
  const evidence = serializeDraftTaxonReviewEvidence(row.value.taxonReviewEvidence);
  evidence[input.taxonId] = {
    content_fingerprint: input.expectedContentFingerprint,
    context_fingerprint: input.expectedContextFingerprint,
    decision: input.decision,
    decided_by: input.actorUserId,
    decided_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      taxon_review_evidence: evidence,
      revision: input.expectedRevision + 1,
      publication_fingerprint: null,
      publication_context_fingerprint: null,
      publication_prepared_at: null,
      updated_by: input.actorUserId,
    })
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .eq("content_fingerprint", input.expectedContentFingerprint)
    .maxAffected(1)
    .select("revision")
    .maybeSingle();
  if (error || !isRecord(data) || data.revision !== input.expectedRevision + 1) {
    return { ok: false, message: "A decisão pré-publicação não pôde ser registrada." };
  }
  return { ok: true, revision: input.expectedRevision + 1 };
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
  taxonReviewEvidence: Readonly<Record<string, DraftTaxonReviewEvidence>>;
  updatedAt: string;
}>;

type DraftTaxonReviewEvidence = Readonly<{
  contentFingerprint: string;
  contextFingerprint: string;
  decision: "confirm_sufficient" | "reject_candidates_and_confirm_sufficient";
  decidedBy: string;
  decidedAt: string;
}>;

const DRAFT_SELECT =
  "base_version,target_version,catalog_json,content_fingerprint,revision,validation_fingerprint,validation_context_fingerprint,publication_fingerprint,publication_context_fingerprint,taxon_review_evidence,updated_at";

const DRAFT_CHANGED = "O draft mudou durante a leitura do contexto. Recarregue antes de continuar.";

function readCandidateLifecycleContext(client: ServiceClient, draft: unknown) {
  return readCompleteLifecycleContext(client, {
    fingerprint: draft !== undefined,
    prepareCandidate: draft === undefined ? undefined : (taxons) =>
      validateLandingPageInputCatalogDraft({ draft, taxons }),
  });
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
  if (!row) {
    return {
      currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      publishedVersions: listLandingPageInputCatalogVersions(),
      totalActiveTaxons: context.taxons.filter((taxon) => taxon.identity.isActive).length,
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
      row.publicationContextFingerprint === null
    ) {
      return unavailableState(
        "O draft implantado diverge do registry atual e não pode ser reconciliado automaticamente.",
        { ok: true, value: context },
      );
    }
    return {
      currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      publishedVersions: listLandingPageInputCatalogVersions(),
      totalActiveTaxons: context.taxons.filter((taxon) => taxon.identity.isActive).length,
      draft: {
        baseVersion: row.baseVersion,
        targetVersion: row.targetVersion,
        catalogJson: JSON.stringify(row.catalogJson, null, 2),
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
  const candidate = validateLandingPageInputCatalogDraft({
    draft: row.catalogJson,
    taxons: context.taxons,
  });
  if (!candidate.ok) return unavailableState(candidate.error.message, { ok: true, value: context });
  const proof = proofForCandidate(context, candidate.value);
  if (!proof) return unavailableState(DRAFT_CHANGED, { ok: true, value: context });
  const reviewStatus = await validateReviewEvidence(
    candidate.value,
    row,
  );
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
    totalActiveTaxons: context.taxons.filter((taxon) => taxon.identity.isActive).length,
    draft: {
      baseVersion: row.baseVersion,
      targetVersion: row.targetVersion,
      catalogJson: JSON.stringify(row.catalogJson, null, 2),
      contentFingerprint: row.contentFingerprint,
      lifecycleContextFingerprint,
      revision: row.revision,
      validationCurrent:
        row.validationFingerprint === row.contentFingerprint &&
        row.validationContextFingerprint === lifecycleContextFingerprint,
      publicationPrepared:
        row.publicationFingerprint === row.contentFingerprint &&
        row.publicationContextFingerprint === lifecycleContextFingerprint,
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

async function validateReviewEvidence(
  candidate: Extract<
    ReturnType<typeof validateLandingPageInputCatalogDraft>,
    { ok: true }
  >["value"],
  row: DraftRow,
): Promise<Readonly<{ validTaxonIds: readonly string[] }>> {
  const validTaxonIds: string[] = [];
  for (const impact of candidate.impacts) {
    if (impact.classification !== "review_required") continue;
    const evidence = row.taxonReviewEvidence[impact.taxon.id];
    if (!evidence || evidence.contentFingerprint !== row.contentFingerprint) {
      continue;
    }
    const current = await reconstructDraftInputCatalogEvaluationContext(
      { taxonId: impact.taxon.id, inputCatalogVersion: candidate.entry.version },
      candidate.registry,
    );
    if (
      !current.ok ||
      fingerprintInputCatalogEvaluationContextIdentity(current.value.identity) !==
        evidence.contextFingerprint
    ) {
      continue;
    }
    validTaxonIds.push(impact.taxon.id);
  }
  return Object.freeze({
    validTaxonIds: Object.freeze(validTaxonIds.sort()),
  });
}

type PublishedReviewImpact = Readonly<{
  taxonId: string;
  reviewedVersion: number | null;
  classification: LandingPageInputCatalogDraftImpact["classification"];
}>;

type PublishedReviewEvidenceValidationResult =
  | Readonly<{
      ok: true;
      impacts: readonly PublishedReviewImpact[];
      validEvidenceTaxonIds: readonly string[];
      contextsByTaxonId: ReadonlyMap<string, InputCatalogEvaluationContextIdentity>;
    }>
  | Readonly<{ ok: false; message: string }>;

async function validatePublishedReviewEvidence(
  context: LifecycleContext,
  row: DraftRow,
): Promise<PublishedReviewEvidenceValidationResult> {
  const impacts = buildPublishedReviewImpacts(context);
  if (!impacts.ok) return impacts;

  const preservedDraftEntry = row.catalogJson as LandingPageInputCatalogRegistryEntry;
  const deployedEntry =
    landingPageInputCatalogRegistry[CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION];
  if (
    fingerprint(serializeLandingPageInputCatalogEntry(preservedDraftEntry)) !==
      row.contentFingerprint ||
    fingerprint(serializeLandingPageInputCatalogEntry(deployedEntry)) !==
      row.contentFingerprint
  ) {
    return {
      ok: false,
      message: "O conteúdo preservado do draft não corresponde ao registry implantado.",
    };
  }
  const preservedDraftRegistry: LandingPageInputCatalogRegistry = {
    ...landingPageInputCatalogRegistry,
    [row.targetVersion]: preservedDraftEntry,
  };

  const validEvidenceTaxonIds: string[] = [];
  const contextsByTaxonId = new Map<string, InputCatalogEvaluationContextIdentity>();
  for (const [taxonId, evidence] of Object.entries(row.taxonReviewEvidence)) {
    const taxon = context.taxons.find(
      (candidate) => candidate.identity.id === taxonId && candidate.identity.isActive,
    );
    if (!taxon || evidence.contentFingerprint !== row.contentFingerprint) continue;
    if (taxon.selectedResearchVersion === null) continue;
    const [preservedDraft, current] = await Promise.all([
      reconstructDraftInputCatalogEvaluationContext(
        {
          taxonId,
          inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
        },
        preservedDraftRegistry,
      ),
      reconstructCanonicalInputCatalogEvaluationContext({
        taxonId,
        inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      }),
    ]);
    if (
      !preservedDraft.ok ||
      !current.ok ||
      !validatePublishedInputCatalogReviewEvidenceContext({
        storedContextFingerprint: evidence.contextFingerprint,
        preservedDraftIdentity: preservedDraft.value.identity,
        deployedIdentity: current.value.identity,
        expectedTaxonId: taxonId,
        expectedResearchVersion: taxon.selectedResearchVersion,
        expectedInputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      })
    ) {
      continue;
    }
    validEvidenceTaxonIds.push(taxonId);
    contextsByTaxonId.set(taxonId, current.value.identity);
  }
  return Object.freeze({
    ok: true,
    impacts: impacts.value,
    validEvidenceTaxonIds: Object.freeze(validEvidenceTaxonIds.sort()),
    contextsByTaxonId,
  });
}

function buildPublishedReviewImpacts(
  context: LifecycleContext,
):
  | Readonly<{ ok: true; value: readonly PublishedReviewImpact[] }>
  | Readonly<{ ok: false; message: string }> {
  const identities = context.taxons.map((taxon) => taxon.identity);
  const impacts: PublishedReviewImpact[] = [];
  for (const taxon of context.taxons) {
    if (!taxon.identity.isActive) continue;
    if (taxon.reviewedVersion === CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION) {
      impacts.push({
        taxonId: taxon.identity.id,
        reviewedVersion: taxon.reviewedVersion,
        classification: "no_material_change",
      });
      continue;
    }
    if (taxon.reviewedVersion === null) {
      impacts.push({
        taxonId: taxon.identity.id,
        reviewedVersion: null,
        classification: "review_required",
      });
      continue;
    }
    if (
      taxon.reviewedVersion > CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION ||
      !listLandingPageInputCatalogVersions().includes(taxon.reviewedVersion)
    ) {
      return {
        ok: false,
        message: "Uma versão revisada não corresponde ao histórico executável implantado.",
      };
    }
    const chain = buildLandingPageInputCatalogTaxonChain(taxon.identity, identities);
    if (!chain.ok) {
      return {
        ok: false,
        message: "Uma cadeia taxonômica mudou durante a reconciliação pós-publicação.",
      };
    }
    const transition = classifyLandingPageInputCatalogTransitionForTaxon({
      previousVersion: taxon.reviewedVersion,
      nextVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      taxonChain: chain.value,
    });
    impacts.push({
      taxonId: taxon.identity.id,
      reviewedVersion: taxon.reviewedVersion,
      classification: transition.classification,
    });
  }
  return { ok: true, value: Object.freeze(impacts) };
}

async function advancePublishedReviewMarker(input: Readonly<{
  client: ServiceClient;
  taxon: LifecycleContext["taxons"][number];
  evidenceContext: InputCatalogEvaluationContextIdentity;
  targetVersion: number;
}>): Promise<boolean> {
  if (
    input.evidenceContext.taxonId !== input.taxon.identity.id ||
    input.evidenceContext.taxonSlug !== input.taxon.identity.slug ||
    input.evidenceContext.research.researchVersion !==
      input.taxon.selectedResearchVersion
  ) {
    return false;
  }
  let updateQuery: any = input.client
    .from("business_taxons")
    .update({ reviewed_input_catalog_version: input.targetVersion })
    .eq("id", input.taxon.identity.id)
    .eq("name", input.taxon.identity.name)
    .eq("slug", input.taxon.identity.slug)
    .eq("level", input.taxon.identity.level)
    .eq("is_active", true)
    .eq(
      "selected_end_customer_research_version",
      input.evidenceContext.research.researchVersion,
    );
  updateQuery = input.taxon.identity.parentId === null
    ? updateQuery.is("parent_id", null)
    : updateQuery.eq("parent_id", input.taxon.identity.parentId);
  updateQuery = input.taxon.reviewedVersion === null
    ? updateQuery.is("reviewed_input_catalog_version", null)
    : updateQuery.eq("reviewed_input_catalog_version", input.taxon.reviewedVersion);
  const { data, error } = await updateQuery
    .select("id,reviewed_input_catalog_version")
    .maxAffected(1)
    .maybeSingle();
  return (
    !error &&
    isRecord(data) &&
    data.id === input.taxon.identity.id &&
    data.reviewed_input_catalog_version === input.targetVersion
  );
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
      typeof raw.content_fingerprint !== "string" ||
      !/^[0-9a-f]{64}$/.test(raw.content_fingerprint) ||
      typeof raw.context_fingerprint !== "string" ||
      !/^[0-9a-f]{64}$/.test(raw.context_fingerprint) ||
      (raw.decision !== "confirm_sufficient" &&
        raw.decision !== "reject_candidates_and_confirm_sufficient") ||
      typeof raw.decided_by !== "string" ||
      typeof raw.decided_at !== "string"
    ) return null;
    normalized[taxonId] = Object.freeze({
      contentFingerprint: raw.content_fingerprint,
      contextFingerprint: raw.context_fingerprint,
      decision: raw.decision,
      decidedBy: raw.decided_by,
      decidedAt: raw.decided_at,
    });
  }
  return Object.freeze(normalized);
}

function serializeDraftTaxonReviewEvidence(
  value: Readonly<Record<string, DraftTaxonReviewEvidence>>,
): Record<string, Record<string, string>> {
  return Object.fromEntries(
    Object.entries(value).map(([taxonId, evidence]) => [
      taxonId,
      {
        content_fingerprint: evidence.contentFingerprint,
        context_fingerprint: evidence.contextFingerprint,
        decision: evidence.decision,
        decided_by: evidence.decidedBy,
        decided_at: evidence.decidedAt,
      },
    ]),
  );
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

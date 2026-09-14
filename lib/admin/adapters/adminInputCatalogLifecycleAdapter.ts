import "server-only";

import { createHash } from "node:crypto";

import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  createNextLandingPageInputCatalogDraft,
  landingPageInputCatalogRegistry,
  listLandingPageInputCatalogVersions,
  serializeLandingPageInputCatalogEntry,
  validateLandingPageInputCatalogDraft,
  type LandingPageInputCatalogDraftFieldChange,
  type LandingPageInputCatalogRegistryEntry,
} from "@/conversion-content/landing-page/input-catalog";
import { createServiceClient } from "@/lib/supabase/service";
import {
  readCompleteLifecycleContext,
  type LifecycleContext,
} from "./adminInputCatalogLifecycleContext";
import {
  matchesInputCatalogLifecycleConfirmation,
  serializeInputCatalogLifecycleValue,
} from "./adminInputCatalogLifecycleValidation";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type AdminInputCatalogLifecycleState = Readonly<{
  currentVersion: number;
  publishedVersions: readonly number[];
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
    updatedAt: string;
    fieldChanges: readonly LandingPageInputCatalogDraftFieldChange[];
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
  const context = await readCandidateLifecycleContext(
    client,
    early.ok ? early.value?.catalogJson : undefined,
  );
  if (!context.ok) return unavailableState(context.message);
  const row = await readDraftRow(client);
  if (!row.ok) return unavailableState(row.message, context);
  if (!sameDraftIdentity(early, row)) return unavailableState(DRAFT_CHANGED, context);
  return buildState(context, row.value);
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
      created_by: input.actorUserId,
      updated_by: input.actorUserId,
    })
    .select(DRAFT_SELECT)
    .maybeSingle();
  if (error?.code === "23505") return conflict("Já existe um draft administrativo.");
  const row = normalizeDraftRow(data);
  if (error || !row) return unavailable("O draft não pôde ser criado.");
  return { ok: true, state: buildState(context, row) };
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
  return { ok: true, state: buildState(context, row) };
}

export async function validateAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
  expectedContentFingerprint: string;
  expectedLifecycleContextFingerprint: string;
  sameFactConfirmed: boolean;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  if (
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision <= 0 ||
    !/^[0-9a-f]{64}$/.test(input.expectedContentFingerprint) ||
    !/^[0-9a-f]{64}$/.test(input.expectedLifecycleContextFingerprint)
  ) {
    return invalid("A revisão e a identidade exibida do draft são obrigatórias.");
  }
  const client = createServiceClient();
  const early = await readDraftRow(client);
  const context = await readCandidateLifecycleContext(
    client,
    early.ok ? early.value?.catalogJson : undefined,
  );
  if (!context.ok) return unavailable(context.message);
  const current = await readDraftRow(client);
  if (!current.ok || !current.value) {
    return unavailable(current.ok ? "O draft não existe." : current.message);
  }
  if (current.value.revision !== input.expectedRevision) {
    return conflict("O draft mudou em outra sessão. Recarregue antes de validar.");
  }
  if (current.value.contentFingerprint !== input.expectedContentFingerprint) {
    return conflict("O conteúdo exibido ficou obsoleto. Recarregue antes de confirmar.");
  }
  const currentLifecycleContextFingerprint = context.value.lifecycleProof?.fingerprint;
  if (
    !currentLifecycleContextFingerprint ||
    !matchesInputCatalogLifecycleConfirmation({
      expectedRevision: input.expectedRevision,
      expectedContentFingerprint: input.expectedContentFingerprint,
      expectedLifecycleContextFingerprint: input.expectedLifecycleContextFingerprint,
      currentRevision: current.value.revision,
      currentContentFingerprint: current.value.contentFingerprint,
      currentLifecycleContextFingerprint,
    })
  ) {
    return conflict("O contexto e o alcance exibidos ficaram obsoletos. Recarregue antes de confirmar.");
  }
  const candidate = validateLandingPageInputCatalogDraft({
    draft: current.value.catalogJson,
    taxons: context.value.taxons,
  });
  if (!candidate.ok) return blocked(candidate.error.message);
  if (
    candidate.value.sameFactConfirmationFieldKeys.length > 0 &&
    !input.sameFactConfirmed
  ) {
    return blocked(
      `Confirme o diff exibido destes fields ou use novos fieldKeys: ${candidate.value.sameFactConfirmationFieldKeys.join(", ")}.`,
    );
  }
  if (!sameDraftIdentity(early, current)) return conflict(DRAFT_CHANGED);
  const proof = proofForCandidate(context.value, candidate.value.canonicalJson);
  if (!proof) return unavailable(DRAFT_CHANGED);
  const fingerprintValue = fingerprint(candidate.value.canonicalJson);
  if (fingerprintValue !== current.value.contentFingerprint) {
    return conflict("A identidade do draft não corresponde ao conteúdo salvo.");
  }
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      validation_fingerprint: fingerprintValue,
      validation_context_fingerprint: proof.fingerprint,
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
  return { ok: true, state: buildState(context, row) };
}

export async function prepareAdminInputCatalogPublication(input: Readonly<{
  actorUserId: string;
  expectedRevision: number;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  const client = createServiceClient();
  const early = await readDraftRow(client);
  const context = await readCandidateLifecycleContext(
    client,
    early.ok ? early.value?.catalogJson : undefined,
  );
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
  const proof = proofForCandidate(context.value, candidate.value.canonicalJson);
  if (!proof) return unavailable(DRAFT_CHANGED);
  const fingerprintValue = fingerprint(candidate.value.canonicalJson);
  if (
    current.value.validationFingerprint !== fingerprintValue ||
    current.value.validationContextFingerprint !== proof.fingerprint ||
    current.value.contentFingerprint !== fingerprintValue
  ) {
    return blocked("Valide novamente o conteúdo exato antes de preparar a publicação.");
  }
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      publication_fingerprint: fingerprintValue,
      publication_context_fingerprint: proof.fingerprint,
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
    state: buildState(context, row),
    handoff: buildPublicationHandoff(row, candidate.value.canonicalJson, proof.fingerprint),
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
  const [current, context] = await Promise.all([
    readDraftRow(client),
    readCompleteLifecycleContext(client, { fingerprint: true }),
  ]);
  if (!current.ok) return unavailable(current.message);
  if (!current.value) return unavailable("O draft não existe.");
  if (!context.ok || !context.value.lifecycleProof) {
    return unavailable(context.ok ? DRAFT_CHANGED : context.message);
  }
  const deployedFingerprint = fingerprint(
    serializeLandingPageInputCatalogEntry(
      landingPageInputCatalogRegistry[CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION],
    ),
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
    current.value.publicationContextFingerprint !== context.value.lifecycleProof.fingerprint
  ) {
    return blocked("O registry implantado ainda não comprova exatamente o draft congelado.");
  }
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .delete()
    .eq("singleton", true)
    .eq("revision", input.expectedRevision)
    .eq("content_fingerprint", deployedFingerprint)
    .eq("publication_context_fingerprint", context.value.lifecycleProof.fingerprint)
    .maxAffected(1)
    .select("revision")
    .maybeSingle();
  if (error || !isRecord(data)) {
    return conflict("O draft mudou durante a reconciliação pós-deploy.");
  }
  return {
    ok: true,
    state: buildState(context, null),
    handoff: `Versão ${CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION} reconciliada com o registry implantado; a leitura final foi confirmada e a residência temporária foi encerrada sem alterar taxons ou marcadores históricos.`,
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
  updatedAt: string;
}>;

const DRAFT_SELECT =
  "base_version,target_version,catalog_json,content_fingerprint,revision,validation_fingerprint,validation_context_fingerprint,publication_fingerprint,publication_context_fingerprint,updated_at";
const DRAFT_CHANGED =
  "O draft mudou durante a leitura do contexto. Recarregue antes de continuar.";

function readCandidateLifecycleContext(client: ServiceClient, draft: unknown) {
  return readCompleteLifecycleContext(client, {
    fingerprint: draft !== undefined,
    prepareCandidate: draft === undefined
      ? undefined
      : (taxons) => validateLandingPageInputCatalogDraft({ draft, taxons }),
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

function proofForCandidate(context: LifecycleContext, canonicalJson: string) {
  const proof = context.lifecycleProof;
  return proof?.candidateContentFingerprint === fingerprint(canonicalJson) ? proof : null;
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

function buildState(
  contextResult:
    | Extract<Awaited<ReturnType<typeof readCompleteLifecycleContext>>, { ok: true }>
    | LifecycleContext,
  row: DraftRow | null,
): AdminInputCatalogLifecycleState {
  const context = "value" in contextResult ? contextResult.value : contextResult;
  if (!row) {
    return {
      currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      publishedVersions: listLandingPageInputCatalogVersions(),
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
      row.publicationContextFingerprint !== lifecycleContextFingerprint
    ) {
      return unavailableState(
        "O draft implantado diverge do registry atual e não pode ser reconciliado automaticamente.",
        { ok: true, value: context },
      );
    }
    return {
      currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      publishedVersions: listLandingPageInputCatalogVersions(),
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
        updatedAt: row.updatedAt,
        fieldChanges: [],
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
  if (!candidate.ok) {
    return unavailableState(candidate.error.message, { ok: true, value: context });
  }
  const proof = proofForCandidate(context, candidate.value.canonicalJson);
  if (!proof) return unavailableState(DRAFT_CHANGED, { ok: true, value: context });
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
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
      updatedAt: row.updatedAt,
      fieldChanges: candidate.value.fieldChanges,
    },
    error: null,
  };
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
    !nullableFingerprint(value.validation_fingerprint) ||
    !nullableFingerprint(value.validation_context_fingerprint) ||
    !nullableFingerprint(value.publication_fingerprint) ||
    !nullableFingerprint(value.publication_context_fingerprint) ||
    typeof value.updated_at !== "string"
  ) return null;
  return {
    baseVersion: value.base_version as number,
    targetVersion: value.target_version as number,
    catalogJson: value.catalog_json,
    contentFingerprint: value.content_fingerprint,
    revision: value.revision as number,
    validationFingerprint: value.validation_fingerprint as string | null,
    validationContextFingerprint: value.validation_context_fingerprint as string | null,
    publicationFingerprint: value.publication_fingerprint as string | null,
    publicationContextFingerprint: value.publication_context_fingerprint as string | null,
    updatedAt: value.updated_at,
  };
}

function nullableFingerprint(value: unknown): boolean {
  return value === null || (typeof value === "string" && /^[0-9a-f]{64}$/.test(value));
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
    `Fingerprint do contexto taxonômico SHA-256: ${lifecycleContextFingerprint}`,
    "",
    "Instruções vinculantes:",
    "- materializar este conteúdo como nova versão imutável no registry;",
    "- alterar a declaração explícita de versão atual no mesmo diff;",
    "- imediatamente antes da revisão/merge, reabrir o Admin e comprovar que validação e handoff continuam atuais para estes dois fingerprints;",
    "- validar CI/Preview e obter revisão/merge humanos;",
    "- somente o deploy de Production torna a versão atual observável;",
    "- não copiar este draft para uma autoridade publicada em banco;",
    "- não gravar reviewed_input_catalog_version nem alterar business_taxons.is_active.",
    "",
    canonicalJson,
  ].join("\n");
}

function fingerprint(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson).digest("hex");
}

function unavailableState(
  message: string,
  _context?: Extract<Awaited<ReturnType<typeof readCompleteLifecycleContext>>, { ok: true }>,
): AdminInputCatalogLifecycleState {
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

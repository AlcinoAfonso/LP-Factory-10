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
  type LandingPageInputCatalogPlan,
  type LandingPageInputCatalogDraftImpact,
  type LandingPageInputCatalogTaxonIdentity,
} from "@/conversion-content/landing-page/input-catalog";
import type { AccountLandingPageOnboardingStoredValues } from "@/lp-builder/contracts";
import { reconstructDraftInputCatalogEvaluationContext } from "@/conversion-content/adapters/inputCatalogEvaluationContextAdapter";
import type {
  BuildInputCatalogEvaluationContextResult,
  InputCatalogEvaluationContextIdentity,
} from "@/conversion-content/landing-page/taxon-preparation";
import { createServiceClient } from "@/lib/supabase/service";
import { collectCompletePaginatedRows } from "./adminInputCatalogLifecyclePagination";
import {
  countInvalidInputCatalogOperationalConfigurations,
  fingerprintInputCatalogOperationalContext,
  type InputCatalogOperationalConfiguration,
} from "./adminInputCatalogLifecycleValidation";

const PAGE_SIZE = 500;

type ServiceClient = ReturnType<typeof createServiceClient>;

export type AdminInputCatalogLifecycleState = Readonly<{
  currentVersion: number;
  publishedVersions: readonly number[];
  totalActiveTaxons: number;
  totalOperationalTaxons: number;
  draft: null | Readonly<{
    baseVersion: number;
    targetVersion: number;
    catalogJson: string;
    contentFingerprint: string;
    operationalContextFingerprint: string;
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
      blockingOperationalReviews: number;
      invalidOperationalConfigurations: number;
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
  const context = await readCompleteLifecycleContext(client);
  if (!context.ok) return unavailableState(context.message);
  const row = await readDraftRow(client);
  if (!row.ok) return unavailableState(row.message, context);
  return await buildState(context, row.value);
}

export async function initializeAdminInputCatalogDraft(input: Readonly<{
  actorUserId: string;
}>): Promise<AdminInputCatalogLifecycleMutationResult> {
  const client = createServiceClient();
  const context = await readCompleteLifecycleContext(client);
  if (!context.ok) return unavailable(context.message);
  const candidate = validateLandingPageInputCatalogDraft({
    draft: createNextLandingPageInputCatalogDraft(),
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
  const context = await readCompleteLifecycleContext(client);
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
  const context = await readCompleteLifecycleContext(client);
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
  const invalidOperationalConfigurations = countInvalidInputCatalogOperationalConfigurations(
    candidate.value,
    context.value.operationalConfigurations,
  );
  if (invalidOperationalConfigurations > 0) {
    return blocked(
      `${invalidOperationalConfigurations} configuração(ões) operacional(is) ficariam inválidas ou ilegíveis.`,
    );
  }
  const fingerprintValue = fingerprint(candidate.value.canonicalJson);
  const operationalContextFingerprint = fingerprintInputCatalogOperationalContext(
    context.value,
  );
  if (fingerprintValue !== current.value.contentFingerprint) {
    return conflict("A identidade do draft não corresponde ao conteúdo salvo.");
  }
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      validation_fingerprint: fingerprintValue,
      validation_context_fingerprint: operationalContextFingerprint,
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
  const context = await readCompleteLifecycleContext(client);
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
  const fingerprintValue = fingerprint(candidate.value.canonicalJson);
  const operationalContextFingerprint = fingerprintInputCatalogOperationalContext(
    context.value,
  );
  if (
    current.value.validationFingerprint !== fingerprintValue ||
    current.value.validationContextFingerprint !== operationalContextFingerprint ||
    current.value.contentFingerprint !== fingerprintValue
  ) {
    return blocked("Valide novamente o conteúdo exato antes de preparar a publicação.");
  }
  const operationalReviewStatus = await validateOperationalReviewEvidence(
    candidate.value,
    current.value,
  );
  if (operationalReviewStatus.blocking > 0) {
    return blocked(
      "Existem taxons operacionais que exigem decisão E20.6.5 antes da publicação.",
    );
  }
  const invalidOperationalConfigurations = countInvalidInputCatalogOperationalConfigurations(
    candidate.value,
    context.value.operationalConfigurations,
  );
  if (invalidOperationalConfigurations > 0) {
    return blocked(
      `${invalidOperationalConfigurations} configuração(ões) operacional(is) ficariam inválidas ou ilegíveis.`,
    );
  }
  const { data, error } = await client
    .from("landing_page_input_catalog_drafts")
    .update({
      publication_fingerprint: fingerprintValue,
      publication_context_fingerprint: operationalContextFingerprint,
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
      operationalContextFingerprint,
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
  const client = createServiceClient();
  const current = await readDraftRow(client);
  if (!current.ok || !current.value) {
    return unavailable(current.ok ? "O draft não existe." : current.message);
  }
  const currentEntry = landingPageInputCatalogRegistry[
    CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION
  ];
  const deployedFingerprint = fingerprint(
    serializeLandingPageInputCatalogEntry(currentEntry),
  );
  if (
    current.value.revision !== input.expectedRevision ||
    current.value.targetVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION ||
    current.value.baseVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION - 1 ||
    current.value.contentFingerprint !== deployedFingerprint ||
    current.value.publicationFingerprint !== deployedFingerprint ||
    current.value.publicationContextFingerprint === null
  ) {
    return blocked(
      "O registry implantado ainda não comprova exatamente o draft congelado.",
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
  const context = await readCompleteLifecycleContext(client);
  if (!context.ok) return unavailable(context.message);
  return {
    ok: true,
    state: await buildState(context, null),
    handoff: `Versão ${CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION} reconciliada com o registry implantado; a residência temporária foi encerrada.`,
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
  const contextFingerprint = fingerprintContext(current.value.context.identity);
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

type LifecycleContext = Readonly<{
  taxons: readonly Readonly<{
    identity: LandingPageInputCatalogTaxonIdentity;
    reviewedVersion: number | null;
    operational: boolean;
  }>[];
  operationalTaxonIds: ReadonlySet<string>;
  operationalConfigurations: readonly InputCatalogOperationalConfiguration[];
}>;

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

async function readCompleteLifecycleContext(
  client: ServiceClient,
): Promise<
  | Readonly<{ ok: true; value: LifecycleContext }>
  | Readonly<{ ok: false; message: string }>
> {
  const [
    taxonRows,
    pageRows,
    onboardingConfigurationRows,
    taxonomyRows,
    accountRows,
    entitlementRows,
    sharedConfigurationRows,
    landingPageConfigurationRows,
  ] = await Promise.all([
    readAll(client, "business_taxons", "id,parent_id,level,name,slug,is_active,reviewed_input_catalog_version", (query) =>
      query.in("level", ["segment", "niche", "ultra_niche"]).order("id", { ascending: true }),
    ),
    readAll(client, "account_landing_pages", "id,account_id,status", (query) =>
      query.in("status", ["draft", "active"]).order("id", { ascending: true }),
    ),
    readAll(client, "account_landing_page_onboarding_configurations", "account_id,landing_page_id,values", (query) =>
      query.is("landing_page_id", null).order("account_id", { ascending: true }),
    ),
    readAll(client, "account_taxonomy", "account_id,taxon_id,is_primary,status", (query) =>
      query.eq("is_primary", true).eq("status", "active").order("account_id", { ascending: true }),
    ),
    readAll(client, "accounts", "id,name", (query) => query.order("id", { ascending: true })),
    readAll(client, "v_account_commercial_entitlement_effective", "account_id,plan_key,is_commercially_eligible", (query) =>
      query.order("account_id", { ascending: true }),
    ),
    readAll(client, "account_landing_page_shared_configurations", "account_id,values", (query) =>
      query.order("account_id", { ascending: true }),
    ),
    readAll(client, "account_landing_page_configurations", "landing_page_id,account_id,values", (query) =>
      query.order("landing_page_id", { ascending: true }),
    ),
  ]);
  if (
    !taxonRows.ok ||
    !pageRows.ok ||
    !onboardingConfigurationRows.ok ||
    !taxonomyRows.ok ||
    !accountRows.ok ||
    !entitlementRows.ok ||
    !sharedConfigurationRows.ok ||
    !landingPageConfigurationRows.ok
  ) {
    return { ok: false, message: "A coleção administrativa não pôde ser lida integralmente." };
  }
  const normalizedTaxons = taxonRows.rows.map(normalizeTaxon);
  if (normalizedTaxons.some((taxon) => taxon === null)) {
    return { ok: false, message: "A coleção de taxons contém estado inválido." };
  }
  const taxonValues = normalizedTaxons as readonly NonNullable<ReturnType<typeof normalizeTaxon>>[];
  const identities = taxonValues.map((taxon) => taxon.identity);

  const activeAccounts = new Set<string>();
  const operationalPages: Array<Readonly<{ id: string; accountId: string }>> = [];
  const preHandoffConfigurations: Array<Readonly<{
    accountId: string;
    values: AccountLandingPageOnboardingStoredValues;
  }>> = [];
  for (const row of pageRows.rows) {
    if (
      !isRecord(row) ||
      typeof row.id !== "string" ||
      typeof row.account_id !== "string"
    ) {
      return { ok: false, message: "A coleção de LPs operacionais é inválida." };
    }
    activeAccounts.add(row.account_id);
    operationalPages.push({ id: row.id, accountId: row.account_id });
  }
  for (const row of onboardingConfigurationRows.rows) {
    if (
      !isRecord(row) ||
      typeof row.account_id !== "string" ||
      row.landing_page_id !== null ||
      !isRecord(row.values)
    ) {
      return { ok: false, message: "A residência E19.2 pré-handoff é inválida." };
    }
    activeAccounts.add(row.account_id);
    preHandoffConfigurations.push({
      accountId: row.account_id,
      values: row.values as AccountLandingPageOnboardingStoredValues,
    });
  }
  const primaryTaxonByAccount = new Map<string, string>();
  const operationalTaxonIds = new Set<string>();
  for (const row of taxonomyRows.rows) {
    if (
      !isRecord(row) ||
      typeof row.account_id !== "string" ||
      typeof row.taxon_id !== "string"
    ) {
      return { ok: false, message: "A coleção de taxonomia operacional é inválida." };
    }
    if (!activeAccounts.has(row.account_id)) continue;
    if (primaryTaxonByAccount.has(row.account_id)) {
      return { ok: false, message: "Uma conta operacional possui mais de um taxon primário ativo." };
    }
    primaryTaxonByAccount.set(row.account_id, row.taxon_id);
    operationalTaxonIds.add(row.taxon_id);
  }

  const accountNames = normalizeStringMap(accountRows.rows, "id", "name");
  const sharedValues = normalizeValuesMap(sharedConfigurationRows.rows, "account_id");
  const landingPageValues = normalizeValuesMap(
    landingPageConfigurationRows.rows,
    "landing_page_id",
  );
  const plans = normalizeOperationalPlans(entitlementRows.rows, activeAccounts);
  if (!accountNames || !sharedValues || !landingPageValues || !plans) {
    return { ok: false, message: "As configurações operacionais contêm estado inválido." };
  }

  const operationalConfigurations: InputCatalogOperationalConfiguration[] = [];
  for (const page of operationalPages) {
    const taxonId = primaryTaxonByAccount.get(page.accountId);
    const planKey = plans.get(page.accountId);
    const accountName = accountNames.get(page.accountId);
    const taxon = identities.find((identity) => identity.id === taxonId);
    if (!taxonId || !planKey || accountName === undefined || !taxon) {
      return { ok: false, message: "Uma LP operacional não possui autoridade completa de conta, plano ou taxon." };
    }
    const taxonChain = buildLandingPageInputCatalogTaxonChain(taxon, identities);
    if (!taxonChain.ok) {
      return { ok: false, message: "Uma LP operacional possui cadeia taxonômica inválida." };
    }
    operationalConfigurations.push({
      accountId: page.accountId,
      landingPageId: page.id,
      planKey,
      taxonChain: taxonChain.value,
      storedValues: {
        ...(sharedValues.get(page.accountId) ?? {}),
        ...(landingPageValues.get(page.id) ?? {}),
      },
      authoritativeValues: accountName.trim()
        ? { business_display_name: accountName.trim() }
        : {},
    });
  }
  for (const configuration of preHandoffConfigurations) {
    const taxonId = primaryTaxonByAccount.get(configuration.accountId);
    const planKey = plans.get(configuration.accountId);
    const accountName = accountNames.get(configuration.accountId);
    const taxon = identities.find((identity) => identity.id === taxonId);
    if (!taxonId || !planKey || accountName === undefined || !taxon) {
      return { ok: false, message: "Uma configuração E19.2 não possui autoridade completa de conta, plano ou taxon." };
    }
    const taxonChain = buildLandingPageInputCatalogTaxonChain(taxon, identities);
    if (!taxonChain.ok) {
      return { ok: false, message: "Uma configuração E19.2 possui cadeia taxonômica inválida." };
    }
    operationalConfigurations.push({
      accountId: configuration.accountId,
      landingPageId: null,
      planKey,
      taxonChain: taxonChain.value,
      storedValues: configuration.values,
      authoritativeValues: accountName.trim()
        ? { business_display_name: accountName.trim() }
        : {},
    });
  }

  const taxons = taxonValues.map((normalized) => ({
    identity: normalized.identity,
    reviewedVersion: normalized.reviewedVersion,
    operational: operationalTaxonIds.has(normalized.identity.id),
  }));
  return {
    ok: true,
    value: {
      taxons,
      operationalTaxonIds,
      operationalConfigurations,
    },
  };
}

async function readAll(
  client: ServiceClient,
  relation: string,
  columns: string,
  refine: (query: any) => any,
): Promise<Readonly<{ ok: true; rows: unknown[] }> | Readonly<{ ok: false }>> {
  const result = await collectCompletePaginatedRows({
    pageSize: PAGE_SIZE,
    readPage: async (offset, limit) => {
      const query = refine(
        client.from(relation).select(columns, { count: "exact" }),
      );
      const { data, error, count } = await query.range(
        offset,
        offset + limit - 1,
      );
      return error || !Array.isArray(data) || count === null
        ? null
        : { rows: data, total: count };
    },
  });
  return result.ok ? { ok: true, rows: [...result.rows] } : { ok: false };
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
      totalOperationalTaxons: context.operationalTaxonIds.size,
      draft: null,
      error: null,
    };
  }
  const operationalContextFingerprint = fingerprintInputCatalogOperationalContext(context);
  if (row.targetVersion === CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION) {
    const deployedFingerprint = fingerprint(
      serializeLandingPageInputCatalogEntry(
        landingPageInputCatalogRegistry[CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION],
      ),
    );
    if (
      row.baseVersion !== CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION - 1 ||
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
      totalOperationalTaxons: context.operationalTaxonIds.size,
      draft: {
        baseVersion: row.baseVersion,
        targetVersion: row.targetVersion,
        catalogJson: JSON.stringify(row.catalogJson, null, 2),
        contentFingerprint: row.contentFingerprint,
        operationalContextFingerprint,
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
          blockingOperationalReviews: 0,
          invalidOperationalConfigurations: 0,
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
  const invalidOperationalConfigurations = countInvalidInputCatalogOperationalConfigurations(
    candidate.value,
    context.operationalConfigurations,
  );
  const operationalReviewStatus = await validateOperationalReviewEvidence(
    candidate.value,
    row,
  );
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
    totalActiveTaxons: context.taxons.filter((taxon) => taxon.identity.isActive).length,
    totalOperationalTaxons: context.operationalTaxonIds.size,
    draft: {
      baseVersion: row.baseVersion,
      targetVersion: row.targetVersion,
      catalogJson: JSON.stringify(row.catalogJson, null, 2),
      contentFingerprint: row.contentFingerprint,
      operationalContextFingerprint,
      revision: row.revision,
      validationCurrent:
        row.validationFingerprint === row.contentFingerprint &&
        row.validationContextFingerprint === operationalContextFingerprint,
      publicationPrepared:
        row.publicationFingerprint === row.contentFingerprint &&
        row.publicationContextFingerprint === operationalContextFingerprint &&
        operationalReviewStatus.blocking === 0 &&
        invalidOperationalConfigurations === 0,
      publishedReconciliationRequired: false,
      publishedReconciliationAllowed: false,
      reviewedTaxonIds: operationalReviewStatus.validTaxonIds,
      updatedAt: row.updatedAt,
      impacts: candidate.value.impacts,
      totals: {
        ...candidate.value.totals,
        blockingOperationalReviews: operationalReviewStatus.blocking,
        invalidOperationalConfigurations,
      },
    },
    error: null,
  };
}

async function validateOperationalReviewEvidence(
  candidate: Extract<
    ReturnType<typeof validateLandingPageInputCatalogDraft>,
    { ok: true }
  >["value"],
  row: DraftRow,
): Promise<Readonly<{ blocking: number; validTaxonIds: readonly string[] }>> {
  let blocking = 0;
  const validTaxonIds: string[] = [];
  for (const impact of candidate.impacts) {
    if (impact.classification !== "review_required") continue;
    const evidence = row.taxonReviewEvidence[impact.taxon.id];
    if (!evidence || evidence.contentFingerprint !== row.contentFingerprint) {
      if (impact.operational) blocking += 1;
      continue;
    }
    const current = await reconstructDraftInputCatalogEvaluationContext(
      { taxonId: impact.taxon.id, inputCatalogVersion: candidate.entry.version },
      candidate.registry,
    );
    if (
      !current.ok ||
      fingerprintContext(current.value.identity) !== evidence.contextFingerprint
    ) {
      if (impact.operational) blocking += 1;
      continue;
    }
    validTaxonIds.push(impact.taxon.id);
  }
  return Object.freeze({
    blocking,
    validTaxonIds: Object.freeze(validTaxonIds.sort()),
  });
}

function normalizeStringMap(
  rows: readonly unknown[],
  keyColumn: string,
  valueColumn: string,
): Map<string, string> | null {
  const result = new Map<string, string>();
  for (const row of rows) {
    if (
      !isRecord(row) ||
      typeof row[keyColumn] !== "string" ||
      typeof row[valueColumn] !== "string" ||
      result.has(row[keyColumn])
    ) return null;
    result.set(row[keyColumn], row[valueColumn]);
  }
  return result;
}

function normalizeValuesMap(
  rows: readonly unknown[],
  keyColumn: string,
): Map<string, AccountLandingPageOnboardingStoredValues> | null {
  const result = new Map<string, AccountLandingPageOnboardingStoredValues>();
  for (const row of rows) {
    if (
      !isRecord(row) ||
      typeof row[keyColumn] !== "string" ||
      !isRecord(row.values) ||
      result.has(row[keyColumn])
    ) return null;
    result.set(
      row[keyColumn],
      row.values as AccountLandingPageOnboardingStoredValues,
    );
  }
  return result;
}

function normalizeOperationalPlans(
  rows: readonly unknown[],
  activeAccounts: ReadonlySet<string>,
): Map<string, LandingPageInputCatalogPlan> | null {
  const result = new Map<string, LandingPageInputCatalogPlan>();
  for (const row of rows) {
    if (
      !isRecord(row) ||
      typeof row.account_id !== "string" ||
      typeof row.is_commercially_eligible !== "boolean" ||
      (row.plan_key !== null && typeof row.plan_key !== "string")
    ) return null;
    if (!activeAccounts.has(row.account_id) || !row.is_commercially_eligible) continue;
    if (
      row.plan_key !== "starter" &&
      row.plan_key !== "lite" &&
      row.plan_key !== "pro" &&
      row.plan_key !== "ultra"
    ) return null;
    if (result.has(row.account_id)) return null;
    result.set(row.account_id, row.plan_key);
  }
  return result;
}

function normalizeTaxon(value: unknown): Readonly<{
  identity: LandingPageInputCatalogTaxonIdentity;
  reviewedVersion: number | null;
}> | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    (value.parent_id !== null && typeof value.parent_id !== "string") ||
    (value.level !== "segment" && value.level !== "niche" && value.level !== "ultra_niche") ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.is_active !== "boolean" ||
    (value.reviewed_input_catalog_version !== null &&
      (!Number.isSafeInteger(value.reviewed_input_catalog_version) ||
        Number(value.reviewed_input_catalog_version) <= 0))
  ) return null;
  return {
    identity: {
      id: value.id,
      parentId: value.parent_id,
      level: value.level,
      name: value.name,
      slug: value.slug,
      isActive: value.is_active,
    },
    reviewedVersion: value.reviewed_input_catalog_version as number | null,
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
  operationalContextFingerprint: string,
): string {
  return [
    `E20.2.8 — materializar versão ${row.targetVersion} no registry repo-only`,
    `Base publicada: ${row.baseVersion}`,
    `Fingerprint do conteúdo SHA-256: ${row.contentFingerprint}`,
    `Fingerprint do contexto operacional SHA-256: ${operationalContextFingerprint}`,
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

function fingerprintContext(identity: InputCatalogEvaluationContextIdentity): string {
  return fingerprint(JSON.stringify(identity));
}

function unavailableState(
  message: string,
  context?: Extract<Awaited<ReturnType<typeof readCompleteLifecycleContext>>, { ok: true }>,
): AdminInputCatalogLifecycleState {
  return {
    currentVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    publishedVersions: listLandingPageInputCatalogVersions(),
    totalActiveTaxons: context?.value.taxons.length ?? 0,
    totalOperationalTaxons: context?.value.operationalTaxonIds.size ?? 0,
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

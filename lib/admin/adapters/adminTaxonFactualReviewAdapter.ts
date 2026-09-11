import "server-only";

import {
  CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
  resolveLandingPageInputCatalog,
  type LandingPageInputCatalogTaxonIdentity,
} from "@/conversion-content/landing-page/input-catalog";
import {
  isInputCatalogReviewEnabled,
  resolveInheritedInputCatalogCoverage,
  type FactualReviewSession,
  type InheritedInputCatalogCoverage,
} from "@/conversion-content/landing-page/taxon-preparation";
import { createServiceClient } from "@/lib/supabase/service";

type OpenAdminTaxonFactualReviewInput = Readonly<{
  taxonId: string;
  operationId: string;
  actorUserId: string;
}>;

type CloseAdminTaxonFactualReviewWithoutChangeInput = Readonly<{
  reviewId: string;
  operationId: string;
  actorUserId: string;
  expectedRevision: number;
  expectedContextFingerprint: string;
  expectedContentFingerprint: string;
  taxonId: string;
}>;

type AdminTaxonFactualReviewResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        review: FactualReviewSession;
        coverage: InheritedInputCatalogCoverage;
      }>;
    }>
  | Readonly<{ ok: false; message: string }>;

export async function openAdminTaxonFactualReview(
  input: OpenAdminTaxonFactualReviewInput,
): Promise<AdminTaxonFactualReviewResult> {
  if (!isInputCatalogReviewEnabled()) {
    return failure("A revisão factual E20.6 está desabilitada.");
  }
  if (!input.taxonId || !input.operationId || !input.actorUserId) {
    return failure("A abertura da revisão factual possui entrada inválida.");
  }

  const supabase = createServiceClient();
  const context = await loadFactualReviewContext(supabase as any, input.taxonId);
  if (!context.ok) return context;

  const coverage = resolveInheritedInputCatalogCoverage({
    baseline: {
      taxon: context.value.selected,
      reviewedInputCatalogVersion: context.value.reviewedInputCatalogVersion,
    },
    taxons: context.value.taxons,
    inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    resolvePlan: resolveLandingPageInputCatalog,
  });
  if (!coverage.ok) return failure(coverage.error.message);

  const { data, error } = await (supabase as any).rpc(
    "open_business_taxon_factual_review_v1",
    {
      p_taxon_id: input.taxonId,
      p_context_fingerprint: coverage.value.contextFingerprint,
      p_chain_snapshot: coverage.value.chainSnapshot,
      p_opened_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_is_active: context.value.selected.isActive,
      p_expected_reviewed_input_catalog_version:
        context.value.reviewedInputCatalogVersion,
    },
  );
  const review = normalizeReviewRpcRow(data, input.taxonId, coverage.value.contextFingerprint);
  if (error || !review) {
    console.error("openAdminTaxonFactualReview failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("Não foi possível abrir a revisão factual sem alterar o taxon.");
  }

  return { ok: true, value: { review, coverage: coverage.value } };
}

export async function closeAdminTaxonFactualReviewWithoutChange(
  input: CloseAdminTaxonFactualReviewWithoutChangeInput,
): Promise<AdminTaxonFactualReviewResult> {
  if (!isInputCatalogReviewEnabled()) {
    return failure("A revisão factual E20.6 está desabilitada.");
  }
  if (
    !input.reviewId ||
    !input.operationId ||
    !input.actorUserId ||
    !input.taxonId ||
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision <= 0
  ) {
    return failure("O fechamento da revisão factual possui entrada inválida.");
  }

  const supabase = createServiceClient();
  const context = await loadFactualReviewContext(supabase as any, input.taxonId);
  if (!context.ok) return context;
  const coverage = resolveInheritedInputCatalogCoverage({
    baseline: {
      taxon: context.value.selected,
      reviewedInputCatalogVersion: context.value.reviewedInputCatalogVersion,
    },
    taxons: context.value.taxons,
    inputCatalogVersion: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
    resolvePlan: resolveLandingPageInputCatalog,
  });
  if (!coverage.ok) return failure(coverage.error.message);
  if (
    coverage.value.contextFingerprint !== input.expectedContextFingerprint ||
    coverage.value.contentFingerprint !== input.expectedContentFingerprint
  ) {
    return failure("A cobertura herdada mudou. Reabra a revisão factual.");
  }

  const { data, error } = await (supabase as any).rpc(
    "close_business_taxon_factual_review_without_change_v1",
    {
      p_review_id: input.reviewId,
      p_operation_id: input.operationId,
      p_actor_user_id: input.actorUserId,
      p_expected_revision: input.expectedRevision,
      p_input_catalog_version: CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION,
      p_context_fingerprint: coverage.value.contextFingerprint,
      p_content_fingerprint: coverage.value.contentFingerprint,
      p_chain_snapshot: coverage.value.chainSnapshot,
    },
  );
  const review = normalizeReviewRpcRow(data, input.taxonId, coverage.value.contextFingerprint);
  if (error || !review) {
    console.error("closeAdminTaxonFactualReviewWithoutChange failed:", {
      code: error?.code,
      message: error?.message,
    });
    return failure("Não foi possível confirmar a cobertura herdada. O estado anterior foi preservado.");
  }

  return { ok: true, value: { review, coverage: coverage.value } };
}

async function loadFactualReviewContext(
  client: any,
  taxonId: string,
): Promise<
  | Readonly<{
      ok: true;
      value: Readonly<{
        selected: LandingPageInputCatalogTaxonIdentity;
        reviewedInputCatalogVersion: number | null;
        taxons: readonly LandingPageInputCatalogTaxonIdentity[];
      }>;
    }>
  | Readonly<{ ok: false; message: string }>
> {
  const taxons: LandingPageInputCatalogTaxonIdentity[] = [];
  const visited = new Set<string>();
  let nextId: string | null = taxonId;
  let reviewedInputCatalogVersion: number | null = null;

  while (nextId !== null && taxons.length < 3) {
    if (visited.has(nextId)) return failure("A cadeia taxonômica contém um ciclo.");
    visited.add(nextId);
    const { data, error } = await client
      .from("business_taxons")
      .select("id,parent_id,level,name,slug,is_active,reviewed_input_catalog_version")
      .eq("id", nextId)
      .maybeSingle();
    const taxon = normalizeTaxonRow(data);
    if (error || !taxon) {
      return failure("Não foi possível reconstruir integralmente a cadeia do taxon.");
    }
    if (taxons.length === 0) {
      reviewedInputCatalogVersion = normalizePositiveIntegerOrNull(
        data.reviewed_input_catalog_version,
      );
      if (
        reviewedInputCatalogVersion === null &&
        data.reviewed_input_catalog_version !== null
      ) {
        return failure("O marcador factual atual do taxon é inválido.");
      }
    }
    taxons.push(taxon);
    nextId = taxon.parentId;
  }
  if (nextId !== null || taxons.length === 0) {
    return failure("A cadeia taxonômica excede os níveis autorizados.");
  }

  return {
    ok: true,
    value: {
      selected: taxons[0],
      reviewedInputCatalogVersion,
      taxons: Object.freeze(taxons),
    },
  };
}

function normalizeTaxonRow(value: unknown): LandingPageInputCatalogTaxonIdentity | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    (value.parent_id !== null && typeof value.parent_id !== "string") ||
    (value.level !== "segment" && value.level !== "niche" && value.level !== "ultra_niche") ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.is_active !== "boolean"
  ) {
    return null;
  }
  return {
    id: value.id,
    parentId: value.parent_id,
    level: value.level,
    name: value.name,
    slug: value.slug,
    isActive: value.is_active,
  };
}

function normalizeReviewRpcRow(
  value: unknown,
  taxonId: string,
  contextFingerprint: string,
): FactualReviewSession | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!isRecord(row)) return null;
  if (
    typeof row.review_id !== "string" ||
    (row.review_kind !== "release" && row.review_kind !== "revision") ||
    (row.review_status !== "open" &&
      row.review_status !== "awaiting_catalog_publication" &&
      row.review_status !== "closed_without_change" &&
      row.review_status !== "closed_published") ||
    !Number.isSafeInteger(Number(row.review_revision)) ||
    Number(row.review_revision) <= 0 ||
    typeof row.review_baseline_is_active !== "boolean" ||
    (row.review_baseline_reviewed_input_catalog_version !== null &&
      (!Number.isSafeInteger(Number(row.review_baseline_reviewed_input_catalog_version)) ||
        Number(row.review_baseline_reviewed_input_catalog_version) <= 0))
  ) {
    return null;
  }
  return {
    id: row.review_id,
    taxonId,
    kind: row.review_kind,
    status: row.review_status,
    baselineIsActive: row.review_baseline_is_active,
    baselineReviewedInputCatalogVersion:
      row.review_baseline_reviewed_input_catalog_version === null
        ? null
        : Number(row.review_baseline_reviewed_input_catalog_version),
    contextFingerprint,
    revision: Number(row.review_revision),
  };
}

function normalizePositiveIntegerOrNull(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(message: string): Readonly<{ ok: false; message: string }> {
  return { ok: false, message };
}

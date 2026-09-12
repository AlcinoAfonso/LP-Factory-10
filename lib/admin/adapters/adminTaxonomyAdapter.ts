import "server-only";

import { randomUUID } from "node:crypto";

import {
  buildLandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonIdentity,
} from "@/conversion-content/landing-page/input-catalog";
import {
  isEndCustomerResearchSelectionEnabled,
  isGenericTaxonActivation,
  isInputCatalogReviewEnabled,
  loadEndCustomerResearchCandidate,
} from "@/conversion-content/landing-page/taxon-preparation";
import { loadAdminInputCatalogEvaluationSources } from "./adminInputCatalogEvaluationSourceAdapter";
import { createServiceClient } from "@/lib/supabase/service";
import {
  ADMIN_PAGE_SIZE,
  cleanAdminSearch,
  getAdminTaxonsByIds,
  isAdminTaxonLevel,
  mapAdminTaxon,
} from "./adminReadOnlyHelpers";
import type {
  AdminFilters,
  AdminListResult,
  AdminOperationalDiagnosticItem,
  AdminTaxonDetail,
  AdminTaxonLevel,
  AdminTaxonListItem,
  AdminTaxonOperationalDiagnostic,
  AdminTaxonParentOption,
  AdminTaxonSummary,
} from "./adminReadOnlyTypes";
import {
  readAdminCommercialActivationOverview,
  type AdminCommercialActivationListItem,
} from "./adminCommercialActivationTemplatesAdapter";
import {
  collectAffectedTaxonIds,
  collectAffectedReviewedTaxonIds,
  planEndCustomerResearchSelectionMutation,
  planTaxonomyIdentityReviewInvalidation,
  taxonomyMutationAffectsInputCatalogResolution,
} from "./adminTaxonomyReviewPolicy";

type CreateAdminTaxonInput = {
  name: string;
  level: string;
  parentId?: string | null;
  slug?: string;
  aliases?: string[];
};

type CreateAdminTaxonResult =
  | { ok: true; taxonId: string }
  | { ok: false; error: string };

type AdminTaxonActionResult = { ok: true; taxonId: string } | { ok: false; error: string };

type UpdateAdminTaxonInput = {
  id: string;
  name: string;
  slug?: string;
  isActive: boolean;
  actorUserId: string;
  invalidateAffectedReviews: boolean;
};

type SelectAdminEndCustomerResearchInput = {
  taxonId: string;
  researchVersion: number;
};

type SelectAdminEndCustomerResearchResult =
  | { ok: true; taxonId: string; selectedVersion: number }
  | { ok: false; error: string };

type AddAdminTaxonAliasInput = {
  taxonId: string;
  aliasText: string;
};

type DeleteAdminTaxonAliasInput = {
  taxonId: string;
  aliasId: string;
};

type DeleteAdminTaxonInput = {
  taxonId: string;
  confirmSlug: string;
};

type ValidateTaxonParentResult = { ok: true } | { ok: false; error: string };

const VALID_TAXON_LEVELS: AdminTaxonLevel[] = ["segment", "niche", "ultra_niche"];

export async function listAdminTaxons(filters: AdminFilters = {}): Promise<AdminListResult<AdminTaxonListItem>> {
  const supabase = createServiceClient();
  const search = cleanAdminSearch(filters.search);

  let query: any = supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active", { count: "exact" })
    .order("level", { ascending: true })
    .order("name", { ascending: true })
    .limit(ADMIN_PAGE_SIZE);

  if (isAdminTaxonLevel(filters.level)) query = query.eq("level", filters.level);
  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "inactive") query = query.eq("is_active", false);
  if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    console.error("listAdminTaxons failed:", { code: error.code, message: error.message });
    return { items: [], total: 0, error: "failed_to_list_taxons" };
  }

  const rows = (data as any[]) ?? [];
  const ids = rows.map((row) => row.id);
  const parentIds = Array.from(new Set(rows.map((row) => row.parent_id).filter(Boolean)));
  const [parentTaxons, aliases] = await Promise.all([
    getAdminTaxonsByIds(parentIds),
    ids.length > 0 ? supabase.from("business_taxon_aliases").select("taxon_id").in("taxon_id", ids) : Promise.resolve({ data: [] }),
  ]);

  const aliasCounts = new Map<string, number>();
  ((aliases.data as any[]) ?? []).forEach((row) => aliasCounts.set(row.taxon_id, (aliasCounts.get(row.taxon_id) ?? 0) + 1));
  const parentNames = new Map(Array.from(parentTaxons.entries()).map(([id, row]) => [id, row.name]));
  const taxons = rows.map((row) => mapAdminTaxon(row, parentNames, aliasCounts));
  const diagnostics = await readAdminTaxonDiagnostics(taxons);

  return {
    items: taxons.map((taxon) => {
      return {
        ...taxon,
        diagnostic: diagnostics.get(taxon.id) ?? unavailableTaxonDiagnostic(),
      };
    }),
    total: count ?? 0,
    error: null,
  };
}

export async function getAdminTaxonDetail(taxonId: string): Promise<AdminTaxonDetail | null> {
  const supabase = createServiceClient();
  const { data: taxonRow, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active")
    .eq("id", taxonId)
    .maybeSingle();

  if (error || !taxonRow) return null;

  const [
    { data: aliases },
    { data: children },
    parentTaxons,
    accountLinks,
    selectedResolutions,
    aiSuggestedResolutions,
    contentTemplateLinks,
    marketResearch,
    diagnostics,
    endCustomerResearchSelection,
    inputCatalogReview,
  ] = await Promise.all([
    supabase.from("business_taxon_aliases").select("id,alias_text,is_active").eq("taxon_id", taxonId).order("alias_text", { ascending: true }).limit(100),
    supabase.from("business_taxons").select("id,parent_id,level,name,slug,is_active").eq("parent_id", taxonId).order("name", { ascending: true }).limit(100),
    getAdminTaxonsByIds(taxonRow.parent_id ? [taxonRow.parent_id] : []),
    countRows(supabase.from("account_taxonomy").select("id", { count: "exact", head: true }).eq("taxon_id", taxonId), "account_taxonomy"),
    countRows(supabase.from("account_niche_resolutions").select("account_id", { count: "exact", head: true }).eq("selected_taxon_id", taxonId), "selected_resolutions"),
    countRows(supabase.from("account_niche_resolutions").select("account_id", { count: "exact", head: true }).eq("ai_suggested_taxon_id", taxonId), "ai_suggested_resolutions"),
    countRows(supabase.from("content_template_taxons").select("template_id", { count: "exact", head: true }).eq("taxon_id", taxonId), "content_template_taxons"),
    countRows(supabase.from("taxon_market_research").select("id", { count: "exact", head: true }).eq("taxon_id", taxonId), "taxon_market_research"),
    readAdminTaxonDiagnostics([
      mapAdminTaxon(
        taxonRow,
        new Map(),
        new Map(),
      ),
    ]),
    readAdminEndCustomerResearchSelection(supabase, taxonId),
    readAdminInputCatalogReview(supabase, taxonId),
  ]);

  const parentNames = new Map(Array.from(parentTaxons.entries()).map(([id, row]) => [id, row.name]));
  const emptyAliasCounts = new Map<string, number>();
  const mappedTaxon = mapAdminTaxon(taxonRow, parentNames, emptyAliasCounts);

  const usage = {
    accountLinks,
    selectedResolutions,
    aiSuggestedResolutions,
    contentTemplateLinks,
    marketResearch,
  };
  const mappedChildren = ((children as any[]) ?? []).map((row) => mapAdminTaxon(row, new Map([[taxonId, mappedTaxon.name]]), emptyAliasCounts));
  const deleteBlockers = buildDeleteBlockers(mappedChildren.length, usage);

  return {
    ...mappedTaxon,
    diagnostic: diagnostics.get(taxonId) ?? unavailableTaxonDiagnostic(),
    aliasCount: ((aliases as any[]) ?? []).length,
    aliases: ((aliases as any[]) ?? []).map((row) => ({
      id: row.id,
      aliasText: row.alias_text ?? "",
      isActive: Boolean(row.is_active),
    })),
    children: mappedChildren,
    usage,
    deleteBlockers,
    canDelete: deleteBlockers.length === 0,
    endCustomerResearchSelection,
    inputCatalogReview,
  };
}

async function readAdminInputCatalogReview(
  supabase: ReturnType<typeof createServiceClient>,
  taxonId: string,
): Promise<AdminTaxonDetail["inputCatalogReview"]> {
  if (!isInputCatalogReviewEnabled()) return { status: "disabled" };
  if (!isEndCustomerResearchSelectionEnabled()) {
    return {
      status: "blocked",
      errorCode: "FEATURE_DISABLED",
      message: "A seleção E20.5 precisa estar habilitada antes da avaliação E20.6.",
    };
  }

  const sources = await loadAdminInputCatalogEvaluationSources(taxonId);
  if (!sources.ok) {
    return {
      status: "read_failed",
      errorCode: "CONTEXT_IDENTITY_INVALID",
      message: sources.message,
    };
  }
  const selectedResearch = sources.selectedResearch;
  if (!selectedResearch.ok && selectedResearch.error.code !== "SELECTION_ABSENT") {
    const blockedCodes = new Set([
      "TAXON_INACTIVE",
      "SELECTION_ABSENT",
      "SELECTED_VERSION_INVALID",
    ]);
    return {
      status: blockedCodes.has(selectedResearch.error.code) ? "blocked" : "read_failed",
      errorCode: selectedResearch.error.code,
      message: selectedResearch.error.message,
    };
  }
  const selected = selectedResearch.ok ? selectedResearch.value : null;
  const servedTaxon = [
    sources.taxonChain.segment,
    sources.taxonChain.niche,
    sources.taxonChain.ultraNiche,
  ].find((candidate) => candidate?.id === taxonId);
  if (
    !servedTaxon
  ) {
    return {
      status: "read_failed",
      errorCode: "TAXON_IDENTITY_INVALID",
      message: "A identidade taxonômica da avaliação E20.6 está incompleta.",
    };
  }

  return {
    status: "available",
    selectedResearchVersion: selected?.selectedResearchVersion ?? null,
    reviewedVersion: sources.reviewedInputCatalogVersion,
    taxonName: servedTaxon.name,
    taxonSlug: servedTaxon.slug,
    taxonLevel: servedTaxon.level,
    parentTaxonId: servedTaxon.parentId,
    chainFingerprint: fingerprintTaxonChain(sources.taxonChain),
  };
}

async function readAdminEndCustomerResearchSelection(
  supabase: ReturnType<typeof createServiceClient>,
  taxonId: string,
): Promise<AdminTaxonDetail["endCustomerResearchSelection"]> {
  if (!isEndCustomerResearchSelectionEnabled()) return { status: "disabled" };

  const { data, error } = await supabase
    .from("business_taxons")
    .select("selected_end_customer_research_version")
    .eq("id", taxonId)
    .maybeSingle();

  if (error || !data) {
    return {
      status: "read_failed",
      message: "Não foi possível ler a seleção da pesquisa integral.",
    };
  }

  const selectedVersion = data.selected_end_customer_research_version;
  if (
    selectedVersion !== null &&
    (!Number.isSafeInteger(selectedVersion) || selectedVersion <= 0)
  ) {
    return {
      status: "read_failed",
      message: "A seleção persistida da pesquisa integral é inválida.",
    };
  }

  return { status: "available", selectedVersion };
}

async function readAdminTaxonDiagnostics(
  taxons: readonly AdminTaxonSummary[],
): Promise<ReadonlyMap<string, AdminTaxonOperationalDiagnostic>> {
  const [commercialRead] = await Promise.allSettled([
    readAdminCommercialActivationOverview(),
  ]);
  const commercialByTaxonId = new Map<string, AdminCommercialActivationListItem>(
    commercialRead.status === "fulfilled" && commercialRead.value.ok
      ? commercialRead.value.items.map((item) => [item.taxon.id, item])
      : [],
  );

  return new Map<string, AdminTaxonOperationalDiagnostic>(
    taxons.map((taxon) => {
      const commercialItem = commercialByTaxonId.get(taxon.id);

      return [
        taxon.id,
        {
          commercialPage: commercialItem
            ? describeCommercialPage(commercialItem)
            : unavailableDiagnostic(
                taxon.isActive
                  ? "A leitura comercial nao pode ser comprovada."
                  : "Taxon inativo nao participa do fluxo comercial.",
                "Revisar diagnóstico",
                null,
              ),
        },
      ] as const;
    }),
  );
}

function describeCommercialPage(
  item: AdminCommercialActivationListItem,
): AdminOperationalDiagnosticItem {
  if (item.eligibility === "ineligible") {
    return {
      label: "Não elegível",
      tone: "warning",
      origin: "Taxon proprio",
      reason: item.requirementsLabel,
      nextAction: "Completar requisitos comerciais",
      href: null,
    };
  }
  return {
    label: item.pageState === "not_created" ? "Elegível para gerar" : item.pageStateLabel,
    tone: item.pageState === "published" ? "success" : item.pageState === "review" ? "warning" : "neutral",
    origin: "Taxon proprio",
    reason: item.requirementsLabel,
    nextAction: item.pageState === "published" ? "Gerenciar pagina" : item.pageState === "review" ? "Revisar draft" : "Gerar draft",
    href: `/admin/templates/commercial-activation/${encodeURIComponent(item.taxon.slug)}`,
  };
}

function unavailableDiagnostic(
  reason: string,
  nextAction: string,
  href: string | null,
): AdminOperationalDiagnosticItem {
  return {
    label: "Indisponível",
    tone: "danger",
    origin: null,
    reason,
    nextAction,
    href,
  };
}

function unavailableTaxonDiagnostic(): AdminTaxonOperationalDiagnostic {
  return {
    commercialPage: unavailableDiagnostic("Página comercial não comprovada.", "Revisar diagnóstico", null),
  };
}

export async function listAdminTaxonParentOptions(): Promise<AdminTaxonParentOption[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active")
    .in("level", ["segment", "niche"])
    .eq("is_active", true)
    .order("level", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("listAdminTaxonParentOptions failed:", { code: error.code, message: error.message });
    return [];
  }

  const rows = ((data as any[]) ?? []).filter((row) => isCreateTaxonLevel(row.level));
  const segmentNames = new Map(
    rows
      .filter((row) => row.level === "segment")
      .map((row) => [row.id, row.name ?? "Segmento sem nome"]),
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? "Taxon sem nome",
    slug: row.slug ?? "",
    level: row.level,
    parentName: row.parent_id ? segmentNames.get(row.parent_id) ?? null : null,
  }));
}

export async function createAdminTaxon(input: CreateAdminTaxonInput): Promise<CreateAdminTaxonResult> {
  const supabase = createServiceClient();
  const name = input.name.replace(/\s+/g, " ").trim();
  const level = isCreateTaxonLevel(input.level) ? input.level : null;
  const slug = normalizeTaxonSlug(input.slug || name);
  const parentId = input.parentId?.trim() || null;
  const aliases = normalizeTaxonAliases(input.aliases ?? []);

  if (name.length < 2) return { ok: false, error: "Informe um nome com pelo menos 2 caracteres." };
  if (!level) return { ok: false, error: "Escolha um nivel valido." };
  if (!slug) return { ok: false, error: "Informe um slug valido." };

  const parentValidation = await validateTaxonParent(level, parentId);
  if (!parentValidation.ok) return parentValidation;

  const { data: existingSlug, error: slugError } = await supabase
    .from("business_taxons")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugError) {
    console.error("createAdminTaxon slug check failed:", { code: slugError.code, message: slugError.message });
    return { ok: false, error: "Nao foi possivel validar o slug agora." };
  }

  if (existingSlug) return { ok: false, error: "Ja existe um taxon com este slug." };

  const { data: taxon, error } = await supabase
    .from("business_taxons")
    .insert({
      name,
      level,
      slug,
      parent_id: level === "segment" ? null : parentId,
      is_active: false,
    })
    .select("id")
    .single();

  if (error || !taxon) {
    console.error("createAdminTaxon failed:", { code: error?.code, message: error?.message });
    return { ok: false, error: "Nao foi possivel criar o taxon." };
  }

  if (aliases.length > 0) {
    const { error: aliasError } = await supabase
      .from("business_taxon_aliases")
      .insert(aliases.map((aliasText) => ({ taxon_id: taxon.id, alias_text: aliasText, is_active: true })));

    if (aliasError) {
      console.error("createAdminTaxon aliases failed:", { code: aliasError.code, message: aliasError.message });
      await supabase.from("business_taxons").delete().eq("id", taxon.id);
      return { ok: false, error: "Nao foi possivel salvar os aliases. O taxon nao foi criado." };
    }
  }

  return { ok: true, taxonId: taxon.id };
}

export async function updateAdminTaxon(input: UpdateAdminTaxonInput): Promise<AdminTaxonActionResult> {
  const supabase = createServiceClient();
  const name = input.name.replace(/\s+/g, " ").trim();
  const slug = normalizeTaxonSlug(input.slug || name);

  if (!input.id) return { ok: false, error: "Taxon nao informado." };
  if (name.length < 2) return { ok: false, error: "Informe um nome com pelo menos 2 caracteres." };
  if (!slug) return { ok: false, error: "Informe um slug valido." };

  const { data: current, error: currentError } = await supabase
    .from("business_taxons")
    .select("id,name,slug,is_active")
    .eq("id", input.id)
    .maybeSingle();
  if (currentError || !current) return { ok: false, error: "Taxon nao encontrado." };
  if (isGenericTaxonActivation(current.is_active, input.isActive)) {
    return {
      ok: false,
      error: "A ativação exige concluir a liberação factual do taxon.",
    };
  }
  if (isInputCatalogReviewEnabled() && current.is_active && !input.isActive) {
    const unclosedReview = await hasUnclosedFactualReview(supabase, [input.id]);
    if (!unclosedReview.ok) return { ok: false, error: unclosedReview.error };
    if (unclosedReview.found) {
      return {
        ok: false,
        error: "Encerre a sessão factual aberta antes de inativar o taxon.",
      };
    }
  }
  const materiallyChangesResolution = taxonomyMutationAffectsInputCatalogResolution(
    { name: current.name, slug: current.slug, isActive: current.is_active },
    { name, slug, isActive: input.isActive },
  );
  let reviewBlock: Awaited<ReturnType<typeof findAffectedInputCatalogReviews>> | null = null;
  if (isInputCatalogReviewEnabled() && materiallyChangesResolution) {
    reviewBlock = await findAffectedInputCatalogReviews(supabase, input.id);
    if (!reviewBlock.ok) return { ok: false, error: reviewBlock.error };
    const unclosedReview = await hasUnclosedFactualReview(supabase, reviewBlock.affectedTaxonIds);
    if (!unclosedReview.ok) return { ok: false, error: unclosedReview.error };
    const invalidation = planTaxonomyIdentityReviewInvalidation({
      materiallyChangesResolution,
      affectedReviewedTaxonIds: reviewBlock.reviewedTaxonIds,
      hasUnclosedFactualReview: unclosedReview.found,
      explicitInvalidationAuthorized: input.invalidateAffectedReviews,
    });
    if (!invalidation.ok) return { ok: false, error: invalidation.error };
  }

  const { data: existingSlug, error: slugError } = await supabase
    .from("business_taxons")
    .select("id")
    .eq("slug", slug)
    .neq("id", input.id)
    .maybeSingle();

  if (slugError) {
    console.error("updateAdminTaxon slug check failed:", { code: slugError.code, message: slugError.message });
    return { ok: false, error: "Nao foi possivel validar o slug agora." };
  }

  if (existingSlug) return { ok: false, error: "Ja existe outro taxon com este slug." };

  if (reviewBlock?.ok && reviewBlock.reviewedTaxonIds.length > 0) {
    const { data, error } = await (supabase as any).rpc(
      "update_business_taxon_identity_with_review_invalidation_v1",
      {
        p_taxon_id: input.id,
        p_expected_name: current.name,
        p_expected_slug: current.slug,
        p_expected_is_active: current.is_active,
        p_name: name,
        p_slug: slug,
        p_next_is_active: input.isActive,
        p_expected_reviewed_taxons: reviewBlock.reviewedTaxons,
        p_operation_id: randomUUID(),
        p_actor_user_id: input.actorUserId,
      },
    );
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !isRecord(row) || row.taxon_id !== input.id) {
      console.error("updateAdminTaxon review invalidation failed:", {
        code: error?.code,
        message: error?.message,
      });
      return {
        ok: false,
        error: error?.message?.includes("taxon_factual_review_unclosed")
          ? "Encerre a sessão factual aberta do taxon ou de seus descendentes antes de alterar nome ou slug."
          : "Não foi possível invalidar atomicamente as coberturas E20.6 afetadas.",
      };
    }
    return { ok: true, taxonId: input.id };
  }

  if (isInputCatalogReviewEnabled() && materiallyChangesResolution) {
    const latestReviewBlock = await findAffectedInputCatalogReviews(supabase, input.id);
    if (!latestReviewBlock.ok) return { ok: false, error: latestReviewBlock.error };
    if (latestReviewBlock.reviewedTaxonIds.length > 0) {
      return {
        ok: false,
        error: "Uma cobertura E20.6 foi registrada durante a alteração. Recarregue e confirme sua invalidação antes de continuar.",
      };
    }
  }

  const { data: updated, error } = await supabase
    .from("business_taxons")
    .update({ name, slug, is_active: input.isActive })
    .eq("id", input.id)
    .eq("name", current.name)
    .eq("slug", current.slug)
    .eq("is_active", current.is_active)
    .select("id")
    .maxAffected(1)
    .maybeSingle();

  if (error || !updated) {
    console.error("updateAdminTaxon failed:", { code: error?.code, message: error?.message });
    return { ok: false, error: "Nao foi possivel atualizar o taxon." };
  }

  return { ok: true, taxonId: input.id };
}

export async function selectAdminEndCustomerResearchVersion(
  input: SelectAdminEndCustomerResearchInput,
): Promise<SelectAdminEndCustomerResearchResult> {
  if (!isEndCustomerResearchSelectionEnabled()) {
    return { ok: false, error: "A seleção de pesquisa integral está desabilitada." };
  }
  if (!input.taxonId) return { ok: false, error: "Taxon não informado." };
  if (!Number.isSafeInteger(input.researchVersion) || input.researchVersion <= 0) {
    return { ok: false, error: "Informe uma versão inteira positiva." };
  }

  const supabase = createServiceClient();
  const { data: taxonData, error: taxonError } = await (supabase as any)
    .from("business_taxons")
    .select("id,slug,is_active,selected_end_customer_research_version")
    .eq("id", input.taxonId)
    .maybeSingle();
  const taxon = taxonData as any;

  if (taxonError) {
    console.error("selectAdminEndCustomerResearchVersion read failed:", {
      code: taxonError.code,
      message: taxonError.message,
      taxonId: input.taxonId,
    });
    return { ok: false, error: "Não foi possível ler o taxon agora." };
  }
  if (!taxon) return { ok: false, error: "Taxon não encontrado." };

  const candidate = await loadEndCustomerResearchCandidate({
    taxon: { slug: taxon.slug, isActive: true },
    researchVersion: input.researchVersion,
  });
  if (!candidate.ok) {
    return {
      ok: false,
      error: candidate.error.code === "FILE_NOT_FOUND"
        ? "A versão candidata não está arquivada."
        : "A versão candidata não possui uma pesquisa integral válida.",
    };
  }

  const selectionMutation = planEndCustomerResearchSelectionMutation({
    currentVersion: taxon.selected_end_customer_research_version,
    nextVersion: input.researchVersion,
  });
  if (selectionMutation.idempotent) {
    return { ok: true, taxonId: taxon.id, selectedVersion: input.researchVersion };
  }

  let updateQuery: any = supabase
    .from("business_taxons")
    .update(selectionMutation.update)
    .eq("id", taxon.id)
    .eq("slug", taxon.slug)
    .eq("is_active", taxon.is_active);
  updateQuery = taxon.selected_end_customer_research_version === null
    ? updateQuery.is("selected_end_customer_research_version", null)
    : updateQuery.eq(
        "selected_end_customer_research_version",
        taxon.selected_end_customer_research_version,
      );
  const { data: updated, error: updateError } = await updateQuery
    .select("id")
    .maxAffected(1)
    .maybeSingle();

  if (updateError) {
    console.error("selectAdminEndCustomerResearchVersion update failed:", {
      code: updateError.code,
      message: updateError.message,
      taxonId: input.taxonId,
    });
    return { ok: false, error: "Não foi possível salvar a seleção agora." };
  }
  if (!updated) {
    return {
      ok: false,
      error: "O taxon mudou durante a seleção. Recarregue a página e tente novamente.",
    };
  }

  return {
    ok: true,
    taxonId: taxon.id,
    selectedVersion: input.researchVersion,
  };
}

export async function addAdminTaxonAlias(input: AddAdminTaxonAliasInput): Promise<AdminTaxonActionResult> {
  const supabase = createServiceClient();
  const aliases = normalizeTaxonAliases([input.aliasText]);

  if (!input.taxonId) return { ok: false, error: "Taxon nao informado." };
  if (aliases.length === 0) return { ok: false, error: "Informe um alias valido." };

  const { error } = await supabase
    .from("business_taxon_aliases")
    .insert({ taxon_id: input.taxonId, alias_text: aliases[0], is_active: true });

  if (error) {
    console.error("addAdminTaxonAlias failed:", { code: error.code, message: error.message });
    return { ok: false, error: "Nao foi possivel adicionar o alias." };
  }

  return { ok: true, taxonId: input.taxonId };
}

export async function deleteAdminTaxonAlias(input: DeleteAdminTaxonAliasInput): Promise<AdminTaxonActionResult> {
  const supabase = createServiceClient();

  if (!input.taxonId || !input.aliasId) return { ok: false, error: "Alias nao informado." };

  const { error } = await supabase
    .from("business_taxon_aliases")
    .delete()
    .eq("id", input.aliasId)
    .eq("taxon_id", input.taxonId);

  if (error) {
    console.error("deleteAdminTaxonAlias failed:", { code: error.code, message: error.message });
    return { ok: false, error: "Nao foi possivel remover o alias." };
  }

  return { ok: true, taxonId: input.taxonId };
}

export async function deleteAdminTaxon(input: DeleteAdminTaxonInput): Promise<AdminTaxonActionResult> {
  const supabase = createServiceClient();
  const taxon = await getAdminTaxonDetail(input.taxonId);

  if (!taxon) return { ok: false, error: "Taxon nao encontrado." };
  if (input.confirmSlug.trim() !== taxon.slug) return { ok: false, error: "Digite o slug do taxon para confirmar a exclusao." };
  if (!taxon.canDelete) return { ok: false, error: `Nao e possivel excluir: ${taxon.deleteBlockers.join(", ")}.` };
  if (isInputCatalogReviewEnabled()) {
    const reviewBlock = await findAffectedInputCatalogReviews(supabase, input.taxonId);
    if (!reviewBlock.ok) return { ok: false, error: reviewBlock.error };
    if (reviewBlock.reviewedTaxonIds.length > 0) {
      return { ok: false, error: "Reabra a avaliação E20.6 antes de excluir o taxon." };
    }
  }

  const { error: aliasError } = await supabase
    .from("business_taxon_aliases")
    .delete()
    .eq("taxon_id", input.taxonId);

  if (aliasError) {
    console.error("deleteAdminTaxon aliases failed:", { code: aliasError.code, message: aliasError.message });
    return { ok: false, error: "Nao foi possivel remover os aliases do taxon." };
  }

  const { error } = await supabase.from("business_taxons").delete().eq("id", input.taxonId);

  if (error) {
    console.error("deleteAdminTaxon failed:", { code: error.code, message: error.message });
    return { ok: false, error: "Nao foi possivel excluir o taxon." };
  }

  return { ok: true, taxonId: input.taxonId };
}

async function validateTaxonParent(level: AdminTaxonLevel, parentId: string | null): Promise<ValidateTaxonParentResult> {
  if (level === "segment") return { ok: true };
  if (!parentId) return { ok: false, error: "Escolha o taxon pai." };

  const supabase = createServiceClient();
  const { data: parent, error } = await supabase
    .from("business_taxons")
    .select("id,level,is_active")
    .eq("id", parentId)
    .maybeSingle();

  if (error || !parent) return { ok: false, error: "Taxon pai nao encontrado." };
  if (!parent.is_active) return { ok: false, error: "Escolha um taxon pai ativo." };
  if (level === "niche" && parent.level !== "segment") return { ok: false, error: "Nichos devem estar abaixo de um segmento." };
  if (level === "ultra_niche" && parent.level !== "niche") return { ok: false, error: "Ultranichos devem estar abaixo de um nicho." };

  return { ok: true };
}

async function readInputCatalogTaxonChain(
  supabase: ReturnType<typeof createServiceClient>,
  taxonId: string,
  expectedSelected?: LandingPageInputCatalogTaxonIdentity,
) {
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,level,name,slug,is_active")
    .in("level", ["segment", "niche", "ultra_niche"]);
  if (error || !Array.isArray(data)) {
    return { ok: false as const, error: "Não foi possível ler a cadeia taxonômica." };
  }
  const identities = data
    .map(mapInputCatalogTaxonIdentity)
    .filter((taxon): taxon is LandingPageInputCatalogTaxonIdentity => taxon !== null);
  if (identities.length !== data.length) {
    return { ok: false as const, error: "A cadeia taxonômica contém identidade inválida." };
  }
  const selected = identities.find((taxon) => taxon.id === taxonId);
  if (!selected) {
    return { ok: false as const, error: "O taxon não pertence à cadeia taxonômica autoritativa." };
  }
  if (expectedSelected && !sameInputCatalogTaxonIdentity(selected, expectedSelected)) {
    return { ok: false as const, error: "O taxon mudou durante a validação da cadeia taxonômica." };
  }
  const chain = buildLandingPageInputCatalogTaxonChain(selected, identities);
  return chain.ok
    ? chain
    : { ok: false as const, error: chain.error.message };
}

function fingerprintTaxonChain(chain: LandingPageInputCatalogTaxonChain): string {
  return JSON.stringify(chain);
}

function sameInputCatalogTaxonIdentity(
  left: LandingPageInputCatalogTaxonIdentity,
  right: LandingPageInputCatalogTaxonIdentity,
): boolean {
  return (
    left.id === right.id &&
    left.parentId === right.parentId &&
    left.level === right.level &&
    left.name === right.name &&
    left.slug === right.slug &&
    left.isActive === right.isActive
  );
}

async function findAffectedInputCatalogReviews(
  supabase: ReturnType<typeof createServiceClient>,
  rootTaxonId: string,
) {
  const { data, error } = await supabase
    .from("business_taxons")
    .select("id,parent_id,reviewed_input_catalog_version");
  if (error || !Array.isArray(data)) {
    return { ok: false as const, error: "Não foi possível verificar as avaliações E20.6 afetadas." };
  }
  const normalized = data.flatMap((row) =>
    isRecord(row) &&
    typeof row.id === "string" &&
    (row.parent_id === null || typeof row.parent_id === "string") &&
    (row.reviewed_input_catalog_version === null || Number.isSafeInteger(row.reviewed_input_catalog_version))
      ? [{
          id: row.id,
          parentId: row.parent_id,
          reviewedVersion: row.reviewed_input_catalog_version,
        }]
      : [],
  );
  if (normalized.length !== data.length) {
    return { ok: false as const, error: "As avaliações E20.6 afetadas possuem estado inválido." };
  }
  const reviewedTaxonIds = collectAffectedReviewedTaxonIds(normalized, rootTaxonId);
  const affectedTaxonIds = collectAffectedTaxonIds(normalized, rootTaxonId);
  const reviewedTaxonIdSet = new Set(reviewedTaxonIds);
  const reviewedTaxons = normalized
    .flatMap((row) =>
      reviewedTaxonIdSet.has(row.id) && row.reviewedVersion !== null
        ? [{ taxonId: row.id, reviewedVersion: row.reviewedVersion }]
        : [],
    )
    .sort((left, right) => left.taxonId.localeCompare(right.taxonId));
  return { ok: true as const, affectedTaxonIds, reviewedTaxonIds, reviewedTaxons };
}

async function hasUnclosedFactualReview(
  supabase: ReturnType<typeof createServiceClient>,
  taxonIds: readonly string[],
) {
  if (taxonIds.length === 0) return { ok: true as const, found: false };
  const { data, error } = await (supabase as any)
    .from("business_taxon_factual_reviews")
    .select("id")
    .in("taxon_id", [...taxonIds])
    .in("status", ["open", "awaiting_catalog_publication"])
    .limit(1)
    .maybeSingle();
  if (error) {
    return { ok: false as const, error: "Não foi possível verificar as sessões factuais abertas." };
  }
  return { ok: true as const, found: Boolean(data) };
}

function mapInputCatalogTaxonIdentity(
  value: unknown,
): LandingPageInputCatalogTaxonIdentity | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    (value.parent_id !== null && typeof value.parent_id !== "string") ||
    (value.level !== "segment" && value.level !== "niche" && value.level !== "ultra_niche") ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.is_active !== "boolean"
  ) return null;
  return {
    id: value.id,
    parentId: value.parent_id,
    level: value.level,
    name: value.name,
    slug: value.slug,
    isActive: value.is_active,
  };
}

function isInputCatalogReviewTaxonRow(value: unknown): value is {
  id: string;
  parent_id: string | null;
  level: AdminTaxonLevel;
  name: string;
  slug: string;
  is_active: boolean;
  selected_end_customer_research_version: number | null;
  reviewed_input_catalog_version: number | null;
} {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    (value.parent_id === null || typeof value.parent_id === "string") &&
    VALID_TAXON_LEVELS.includes(value.level as AdminTaxonLevel) &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.is_active === "boolean" &&
    (value.selected_end_customer_research_version === null || Number.isSafeInteger(value.selected_end_customer_research_version)) &&
    (value.reviewed_input_catalog_version === null || Number.isSafeInteger(value.reviewed_input_catalog_version))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCreateTaxonLevel(value: unknown): value is AdminTaxonLevel {
  return VALID_TAXON_LEVELS.includes(value as AdminTaxonLevel);
}

function normalizeTaxonSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeTaxonAliases(values: string[]) {
  const seen = new Set<string>();
  const aliases: string[] = [];

  values
    .flatMap((value) => value.split(/[\n,;]/g))
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = normalizeTaxonSlug(value);
      if (!key || seen.has(key)) return;
      seen.add(key);
      aliases.push(value.slice(0, 120));
    });

  return aliases.slice(0, 20);
}

async function countRows(query: PromiseLike<{ count: number | null; error: { code?: string; message?: string } | null }>, label: string) {
  const { count, error } = await query;

  if (error) {
    console.error("admin taxon usage count failed:", { label, code: error.code, message: error.message });
    return 0;
  }

  return count ?? 0;
}

function buildDeleteBlockers(childCount: number, usage: {
  accountLinks: number;
  selectedResolutions: number;
  aiSuggestedResolutions: number;
  contentTemplateLinks: number;
  marketResearch: number;
}) {
  const blockers: string[] = [];

  if (childCount > 0) blockers.push(`${childCount} filho(s) direto(s)`);
  if (usage.accountLinks > 0) blockers.push(`${usage.accountLinks} vinculo(s) com contas`);
  if (usage.selectedResolutions > 0) blockers.push(`${usage.selectedResolutions} resolucao(oes) selecionada(s)`);
  if (usage.aiSuggestedResolutions > 0) blockers.push(`${usage.aiSuggestedResolutions} sugestao(oes) de IA`);
  if (usage.contentTemplateLinks > 0) blockers.push(`${usage.contentTemplateLinks} vinculo(s) com templates`);
  if (usage.marketResearch > 0) blockers.push(`${usage.marketResearch} pesquisa(s) de mercado`);

  return blockers;
}

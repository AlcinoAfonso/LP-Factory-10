import "server-only";

import { resolveLandingPageResearchForTaxons } from "@/conversion-content/adapters/landingPageResearchAdapter";
import {
  getGenerationProfileAssistanceAvailability,
  readAdminGenerationProfileSummaries,
} from "@/conversion-content/adapters/landingPageGenerationProfileAdminAdapter";
import {
  getAdminGenerationProfilePresentation,
  isGenerationProfileAssistanceConfigured,
  type AdminGenerationProfileListItem,
} from "@/conversion-content/landing-page/generation-profile";
import {
  LANDING_PAGE_RESEARCH_BLOCKS,
  resolveLandingPageResearch,
  type LandingPageResearchAudienceScope,
  type LandingPageResearchItemDto,
  type LandingPageResearchParentDto,
  type LandingPageResearchSourceRelation,
  type LandingPageResearchResolutionErrorCode,
  type LandingPageResearchResolutionResult,
  type LandingPageResearchTaxonDto,
  type ResolvedLandingPageResearchAudience,
} from "@/conversion-content/landing-page/research-resolution";
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

type CreateAdminTaxonInput = {
  name: string;
  level: string;
  parentId?: string | null;
  slug?: string;
  aliases?: string[];
  isActive: boolean;
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
};

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

type AdminResearchCandidateAssessment = Readonly<{
  diagnostic: AdminOperationalDiagnosticItem;
  errorCode: LandingPageResearchResolutionErrorCode | null;
  presentation: AdminTaxonResearchAudiencePresentation | null;
}>;

export type AdminTaxonResearchAudiencePresentation = Readonly<{
  audience: ResolvedLandingPageResearchAudience;
  sourceTaxonId: string;
  sourceRelation: LandingPageResearchSourceRelation;
}>;

export type AdminTaxonResearchPresentation = Readonly<{
  diagnostics: Pick<AdminTaxonOperationalDiagnostic, "businessBuyer" | "endCustomer">;
  businessBuyer: AdminTaxonResearchAudiencePresentation | null;
  endCustomer: AdminTaxonResearchAudiencePresentation | null;
}>;

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
  const [diagnostics, researchListDiagnostics] = await Promise.all([
    readAdminTaxonDiagnostics(taxons),
    readAdminTaxonResearchListDiagnostics(taxons),
  ]);

  return {
    items: taxons.map((taxon) => {
      const diagnostic = diagnostics.get(taxon.id) ?? unavailableTaxonDiagnostic();
      return {
        ...taxon,
        diagnostic: {
          ...diagnostic,
          ...(researchListDiagnostics.get(taxon.id) ?? unavailableResearchListDiagnostic()),
        },
      };
    }),
    total: count ?? 0,
    error: null,
  };
}

export async function getAdminTaxonResearchDiagnostics(
  taxon: AdminTaxonSummary,
): Promise<Pick<AdminTaxonOperationalDiagnostic, "businessBuyer" | "endCustomer">> {
  const presentation = await getAdminTaxonResearchPresentation(taxon);
  return presentation.diagnostics;
}

export async function getAdminTaxonResearchPresentation(
  taxon: AdminTaxonSummary,
): Promise<AdminTaxonResearchPresentation> {
  const presentations = await readAdminTaxonResearchListPresentations([taxon]);
  return presentations.get(taxon.id) ?? unavailableResearchListPresentation();
}

async function readAdminTaxonResearchListDiagnostics(
  taxons: readonly AdminTaxonSummary[],
): Promise<ReadonlyMap<string, Pick<AdminTaxonOperationalDiagnostic, "businessBuyer" | "endCustomer">>> {
  const presentations = await readAdminTaxonResearchListPresentations(taxons);
  return new Map(taxons.map((taxon) => [
    taxon.id,
    presentations.get(taxon.id)?.diagnostics ?? unavailableResearchListDiagnostic(),
  ]));
}

async function readAdminTaxonResearchListPresentations(
  taxons: readonly AdminTaxonSummary[],
): Promise<ReadonlyMap<string, AdminTaxonResearchPresentation>> {
  if (taxons.length === 0) return new Map();

  const supabase = createServiceClient();
  const taxonIds = taxons.map((taxon) => taxon.id);
  const sourceTaxonIds = [...new Set([
    ...taxonIds,
    ...taxons.map((taxon) => taxon.parentId).filter((id): id is string => Boolean(id)),
  ])];

  try {
    const [taxonRead, researchRead] = await Promise.all([
      supabase.from("business_taxons").select("id,parent_id,is_active").in("id", sourceTaxonIds),
      supabase
        .from("taxon_market_research")
        .select("id,taxon_id,research_block,audience_scope,version,status")
        .in("taxon_id", sourceTaxonIds)
        .in("research_block", [...LANDING_PAGE_RESEARCH_BLOCKS])
        .in("audience_scope", ["business_buyer", "end_customer"])
        .eq("status", "active"),
    ]);
    if (taxonRead.error || researchRead.error) {
      return unavailableResearchListPresentations(taxonIds, "A leitura das pesquisas falhou.");
    }

    const researchRows = (researchRead.data as any[]) ?? [];
    const researchIds = researchRows.map((row) => row.id);
    const itemRead = researchIds.length > 0
      ? await supabase
          .from("taxon_market_research_items")
          .select("id,research_id,item_key,item_text,priority,sort_order,is_active")
          .in("research_id", researchIds)
      : { data: [], error: null };
    if (itemRead.error) {
      return unavailableResearchListPresentations(taxonIds, "A leitura dos itens de pesquisa falhou.");
    }

    const sourceTaxons = ((taxonRead.data as any[]) ?? []).map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      isActive: row.is_active,
    })) as LandingPageResearchTaxonDto[];
    const researches = researchRows.map((row) => ({
      id: row.id,
      taxonId: row.taxon_id,
      researchBlock: row.research_block,
      audienceScope: row.audience_scope,
      version: row.version,
      status: row.status,
    })) as LandingPageResearchParentDto[];
    const items = (((itemRead.data as any[]) ?? []).map((row) => ({
      id: row.id,
      researchId: row.research_id,
      itemKey: row.item_key,
      itemText: row.item_text,
      priority: row.priority,
      sortOrder: row.sort_order,
      isActive: row.is_active,
    }))) as LandingPageResearchItemDto[];

    return new Map(taxons.map((taxon) => [
      taxon.id,
      projectAdminResearchListPresentation(taxon, sourceTaxons, researches, items),
    ]));
  } catch {
    return unavailableResearchListPresentations(taxonIds, "A leitura segura das pesquisas não pôde ser concluída.");
  }
}

function projectAdminResearchListPresentation(
  taxon: AdminTaxonSummary,
  taxons: readonly LandingPageResearchTaxonDto[],
  researches: readonly LandingPageResearchParentDto[],
  items: readonly LandingPageResearchItemDto[],
): AdminTaxonResearchPresentation {
  const servedMatches = taxons.filter((candidate) => candidate.id === taxon.id);
  if (servedMatches.length !== 1 || !servedMatches[0].isActive) {
    return unavailableResearchListPresentation("O taxon não participa da resolução E10.8.");
  }

  const endCustomer = assessAdminResearchCandidate(taxon.id, taxon.id, "end_customer", "Própria", researches, items);
  const ownBusinessBuyer = assessAdminResearchCandidate(taxon.id, taxon.id, "business_buyer", "Própria", researches, items);
  let businessBuyer = ownBusinessBuyer;

  if (["RESEARCH_MISSING", "RESEARCH_INCOMPLETE"].includes(ownBusinessBuyer.errorCode ?? "")) {
    const parentMatches = taxon.parentId
      ? taxons.filter((candidate) => candidate.id === taxon.parentId && candidate.isActive)
      : [];
    if (parentMatches.length === 1) {
      const parent = assessAdminResearchCandidate(
        taxon.id,
        parentMatches[0].id,
        "business_buyer",
        "Pai direto",
        researches,
        items,
      );
      businessBuyer = parent.errorCode === "RESEARCH_MISSING" && ownBusinessBuyer.errorCode === "RESEARCH_INCOMPLETE"
        ? ownBusinessBuyer
        : parent;
    }
  }

  return {
    diagnostics: { businessBuyer: businessBuyer.diagnostic, endCustomer: endCustomer.diagnostic },
    businessBuyer: businessBuyer.presentation,
    endCustomer: endCustomer.presentation,
  };
}

function assessAdminResearchCandidate(
  servedTaxonId: string,
  sourceTaxonId: string,
  audienceScope: LandingPageResearchAudienceScope,
  completeLabel: "Própria" | "Pai direto",
  allResearches: readonly LandingPageResearchParentDto[],
  allItems: readonly LandingPageResearchItemDto[],
): AdminResearchCandidateAssessment {
  const candidateResearches = allResearches.filter(
    (research) => research.taxonId === sourceTaxonId && research.audienceScope === audienceScope,
  );
  if (candidateResearches.length === 0) {
    return {
      diagnostic: researchListItem("Ausente", "neutral", "Nenhum conjunto ativo foi encontrado."),
      errorCode: "RESEARCH_MISSING",
      presentation: null,
    };
  }

  const researchIds = new Set(candidateResearches.map((research) => research.id));
  const result = resolveLandingPageResearch({
    taxonId: servedTaxonId,
    source: {
      status: "ready",
      taxons: [{ id: servedTaxonId, parentId: null, isActive: true }],
      researches: candidateResearches.flatMap((research) => [
        { ...research, taxonId: servedTaxonId, audienceScope: "end_customer" },
        { ...research, taxonId: servedTaxonId, audienceScope: "business_buyer" },
      ]),
      items: allItems.filter((item) => researchIds.has(item.researchId)),
    },
  });
  if (result.ok) {
    const audience = audienceScope === "business_buyer"
      ? result.value.businessBuyer
      : result.value.endCustomer;
    return {
      diagnostic: researchListItem(completeLabel, "success", "Conjunto E10.8 completo e válido."),
      errorCode: null,
      presentation: {
        audience,
        sourceTaxonId,
        sourceRelation: completeLabel === "Pai direto" ? "direct_parent" : "own",
      },
    };
  }
  if (["RESEARCH_MISSING", "RESEARCH_INCOMPLETE", "RESEARCH_INVALID", "RESEARCH_AMBIGUOUS"].includes(result.error.code)) {
    return {
      diagnostic: researchListItem(
        result.error.code === "RESEARCH_MISSING"
          ? "Ausente"
          : result.error.code === "RESEARCH_INCOMPLETE"
            ? "Incompleta"
            : "Revisar",
        result.error.code === "RESEARCH_MISSING" ? "neutral" : "warning",
        result.error.message,
      ),
      errorCode: result.error.code,
      presentation: null,
    };
  }
  return {
    diagnostic: researchListItem("Indisponível", "danger", result.error.message),
    errorCode: result.error.code,
    presentation: null,
  };
}

function unavailableResearchListPresentations(
  taxonIds: readonly string[],
  reason: string,
): ReadonlyMap<string, AdminTaxonResearchPresentation> {
  return new Map(taxonIds.map((taxonId) => [taxonId, unavailableResearchListPresentation(reason)]));
}

function unavailableResearchListPresentation(
  reason = "Não foi possível determinar o estado das pesquisas com segurança.",
): AdminTaxonResearchPresentation {
  return {
    diagnostics: unavailableResearchListDiagnostic(reason),
    businessBuyer: null,
    endCustomer: null,
  };
}

function unavailableResearchListDiagnostic(
  reason = "Não foi possível determinar o estado das pesquisas com segurança.",
): Pick<AdminTaxonOperationalDiagnostic, "businessBuyer" | "endCustomer"> {
  return {
    businessBuyer: researchListItem("Indisponível", "danger", reason),
    endCustomer: researchListItem("Indisponível", "danger", reason),
  };
}

function researchListItem(
  label: "Própria" | "Pai direto" | "Ausente" | "Incompleta" | "Revisar" | "Indisponível",
  tone: AdminOperationalDiagnosticItem["tone"],
  reason: string,
): AdminOperationalDiagnosticItem {
  return { label, tone, origin: null, reason, nextAction: label === "Revisar" ? "Revisar pesquisa" : "Nenhuma pendência", href: null };
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
  };
}

async function readAdminTaxonDiagnostics(
  taxons: readonly AdminTaxonSummary[],
): Promise<ReadonlyMap<string, AdminTaxonOperationalDiagnostic>> {
  const taxonIds = taxons.map((taxon) => taxon.id);
  const [commercialRead, profilesRead] = await Promise.allSettled([
    readAdminCommercialActivationOverview(),
    readAdminGenerationProfileSummaries(),
  ]);
  const aiConfigured = isGenerationProfileAssistanceConfigured({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const commercialByTaxonId = new Map<string, AdminCommercialActivationListItem>(
    commercialRead.status === "fulfilled" && commercialRead.value.ok
      ? commercialRead.value.items.map((item) => [item.taxon.id, item])
      : [],
  );
  const profileByTaxonId = new Map<string, AdminGenerationProfileListItem>(
    profilesRead.status === "fulfilled" && profilesRead.value.ok
      ? profilesRead.value.items.map((item) => [item.taxon.id, item])
      : [],
  );
  const researchTaxonIds = [...new Set([
    ...taxonIds,
    ...[...profileByTaxonId.values()].map(
      (item) => getAdminGenerationProfilePresentation(item).assistanceTaxonId,
    ),
  ])];
  const [researchRead] = await Promise.allSettled([
    resolveLandingPageResearchForTaxons({ taxonIds: researchTaxonIds }),
  ]);
  const research = researchRead.status === "fulfilled"
    ? researchRead.value
    : new Map<string, LandingPageResearchResolutionResult>();

  return new Map<string, AdminTaxonOperationalDiagnostic>(
    taxons.map((taxon) => {
      const researchResult = research.get(taxon.id);
      const researchDiagnostic = describeResearch(researchResult);
      const commercialItem = commercialByTaxonId.get(taxon.id);
      const profileItem = profileByTaxonId.get(taxon.id);
      const profilePresentation = profileItem
        ? getAdminGenerationProfilePresentation(profileItem)
        : null;
      const assistance = getGenerationProfileAssistanceAvailability({
        aiConfigured,
        research: research.get(profilePresentation?.assistanceTaxonId ?? taxon.id),
      });
      const profileDiagnostic = profileItem
        ? describeGenerationProfile(profileItem)
        : {
            activeProfile: unavailableDiagnostic(
              taxon.isActive
                ? "A leitura do perfil ativo nao pode ser comprovada."
                : "Taxon inativo nao possui operacao de perfil.",
              "Revisar perfis",
              "/admin/perfis-de-orientacao",
            ),
            draftProfile: unavailableDiagnostic(
              taxon.isActive
                ? "A leitura do rascunho proprio nao pode ser comprovada."
                : "Taxon inativo nao possui rascunho proprio.",
              "Revisar perfis",
              "/admin/perfis-de-orientacao",
            ),
          };

      return [
        taxon.id,
        {
          ...researchDiagnostic,
          commercialPage: commercialItem
            ? describeCommercialPage(commercialItem)
            : unavailableDiagnostic(
                taxon.isActive
                  ? "A leitura comercial nao pode ser comprovada."
                  : "Taxon inativo nao participa do fluxo comercial.",
                "Revisar diagnóstico",
                null,
              ),
          ...profileDiagnostic,
          aiAssistance: assistance.available
            ? {
                label: "Disponível",
                tone: "success",
                origin: "E12.4.3",
                reason: "Configuracao e preflight E10.8 comprovados.",
                nextAction: "Usar no editor do perfil",
                href: profilePresentation?.action.href ?? "/admin/perfis-de-orientacao",
              }
            : unavailableDiagnostic(
                assistance.reason ?? "Assistência por IA indisponível.",
                "Continuar manualmente",
                profilePresentation?.action.href ?? "/admin/perfis-de-orientacao",
              ),
        },
      ] as const;
    }),
  );
}

function describeResearch(
  result: LandingPageResearchResolutionResult | undefined,
): Pick<AdminTaxonOperationalDiagnostic, "businessBuyer" | "endCustomer"> {
  if (!result) {
    return {
      businessBuyer: unavailableDiagnostic("Pesquisa BB nao comprovada.", "Revisar pesquisa", null),
      endCustomer: unavailableDiagnostic("Pesquisa EC nao comprovada.", "Revisar pesquisa", null),
    };
  }

  if (result.ok) {
    return {
      businessBuyer: {
        label: result.value.businessBuyer.sourceRelation === "own"
          ? "Completa — própria"
          : "Completa — pai direto",
        tone: "success",
        origin: result.value.businessBuyer.sourceRelation === "own"
          ? "Propria"
          : "Herdada do pai direto",
        reason: `Conjunto E10.8 valido na versao ${result.value.businessBuyer.version}.`,
        nextAction: "Nenhuma pendencia",
        href: null,
      },
      endCustomer: {
        label: "Completa — própria",
        tone: "success",
        origin: "Propria",
        reason: `Conjunto E10.8 valido na versao ${result.value.endCustomer.version}.`,
        nextAction: "Nenhuma pendencia",
        href: null,
      },
    };
  }

  const failed = describeResearchFailure(result);
  if (result.error.audienceScope === "business_buyer") {
    return {
      businessBuyer: failed,
      endCustomer: endCustomerValidatedBeforeBusinessBuyerFailure(),
    };
  }
  if (
    result.error.code === "DIRECT_PARENT_NOT_FOUND" ||
    result.error.code === "DIRECT_PARENT_INACTIVE"
  ) {
    return {
      businessBuyer: failed,
      endCustomer: endCustomerValidatedBeforeBusinessBuyerFailure(),
    };
  }
  if (result.error.audienceScope === "end_customer") {
    return {
      businessBuyer: unavailableDiagnostic(
        "BB nao foi avaliada depois da rejeicao segura de EC.",
        "Resolver EC primeiro",
        null,
      ),
      endCustomer: failed,
    };
  }
  return { businessBuyer: failed, endCustomer: { ...failed } };
}

function endCustomerValidatedBeforeBusinessBuyerFailure(): AdminOperationalDiagnosticItem {
  return {
    label: "Completa — própria",
    tone: "success",
    origin: "Propria",
    reason: "O resolver E10.8 validou EC antes de rejeitar BB.",
    nextAction: "Nenhuma pendencia",
    href: null,
  };
}

function describeResearchFailure(
  result: Extract<LandingPageResearchResolutionResult, { ok: false }>,
): AdminOperationalDiagnosticItem {
  const missing = result.error.code === "RESEARCH_MISSING";
  const incomplete = [
    "RESEARCH_INCOMPLETE",
    "DIRECT_PARENT_NOT_FOUND",
    "DIRECT_PARENT_INACTIVE",
  ].includes(result.error.code);
  const invalid = ["RESEARCH_INVALID", "RESEARCH_AMBIGUOUS"].includes(result.error.code);
  return {
    label: missing ? "Ausente" : incomplete ? "Incompleta" : invalid ? "Inválida ou ambígua" : "Indisponível",
    tone: missing ? "neutral" : incomplete ? "warning" : "danger",
    origin: result.error.sourceRelation === "direct_parent"
      ? "Pai direto"
      : result.error.sourceRelation === "own"
        ? "Propria"
        : null,
    reason: missing
      ? "Nenhum conjunto ativo foi encontrado."
      : incomplete
      ? "O conjunto obrigatorio nao esta completo."
      : invalid
        ? "O conjunto foi rejeitado pelo contrato E10.8."
        : "A leitura segura nao pode ser comprovada.",
    nextAction: missing || incomplete ? "Completar pesquisa" : "Revisar pesquisa",
    href: null,
  };
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

function describeGenerationProfile(
  item: AdminGenerationProfileListItem,
): Pick<AdminTaxonOperationalDiagnostic, "activeProfile" | "draftProfile"> {
  const presentation = getAdminGenerationProfilePresentation(item);
  return {
    activeProfile: {
      label: presentation.active.label,
      tone: presentation.active.tone,
      origin: item.ownerTaxonName,
      reason: item.activeVersion !== null
        ? `Versao ${item.activeVersion} comprovada.`
        : item.resolvedState === "absent"
          ? "Nenhum perfil ativo foi encontrado."
          : "A leitura segura do perfil ativo nao pode ser comprovada.",
      nextAction: presentation.action.label,
      href: presentation.action.href,
    },
    draftProfile: {
      label: presentation.draft.label,
      tone: presentation.draft.tone,
      origin: item.draftVersion !== null ? "Propria" : null,
      reason: item.draftVersion !== null
        ? `Versao ${item.draftVersion} comprovada.`
        : "Nenhum rascunho proprio foi encontrado.",
      nextAction: presentation.action.label,
      href: presentation.action.href,
    },
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
    businessBuyer: unavailableDiagnostic("Pesquisa BB nao comprovada.", "Revisar pesquisa", null),
    endCustomer: unavailableDiagnostic("Pesquisa EC nao comprovada.", "Revisar pesquisa", null),
    commercialPage: unavailableDiagnostic("Página comercial não comprovada.", "Revisar diagnóstico", null),
    activeProfile: unavailableDiagnostic("Perfil ativo nao comprovado.", "Revisar perfis", "/admin/perfis-de-orientacao"),
    draftProfile: unavailableDiagnostic("Rascunho proprio nao comprovado.", "Revisar perfis", "/admin/perfis-de-orientacao"),
    aiAssistance: unavailableDiagnostic("Assistencia por IA nao comprovada.", "Continuar manualmente", "/admin/perfis-de-orientacao"),
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
      is_active: input.isActive,
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

  const { error } = await supabase
    .from("business_taxons")
    .update({ name, slug, is_active: input.isActive })
    .eq("id", input.id);

  if (error) {
    console.error("updateAdminTaxon failed:", { code: error.code, message: error.message });
    return { ok: false, error: "Nao foi possivel atualizar o taxon." };
  }

  return { ok: true, taxonId: input.id };
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

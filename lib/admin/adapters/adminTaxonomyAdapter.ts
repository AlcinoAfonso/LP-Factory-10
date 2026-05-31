import "server-only";

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
  AdminTaxonDetail,
  AdminTaxonLevel,
  AdminTaxonListItem,
  AdminTaxonParentOption,
} from "./adminReadOnlyTypes";

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

  return { items: rows.map((row) => mapAdminTaxon(row, parentNames, aliasCounts)), total: count ?? 0, error: null };
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
  ] = await Promise.all([
    supabase.from("business_taxon_aliases").select("id,alias_text,is_active").eq("taxon_id", taxonId).order("alias_text", { ascending: true }).limit(100),
    supabase.from("business_taxons").select("id,parent_id,level,name,slug,is_active").eq("parent_id", taxonId).order("name", { ascending: true }).limit(100),
    getAdminTaxonsByIds(taxonRow.parent_id ? [taxonRow.parent_id] : []),
    countRows(supabase.from("account_taxonomy").select("id", { count: "exact", head: true }).eq("taxon_id", taxonId), "account_taxonomy"),
    countRows(supabase.from("account_niche_resolutions").select("account_id", { count: "exact", head: true }).eq("selected_taxon_id", taxonId), "selected_resolutions"),
    countRows(supabase.from("account_niche_resolutions").select("account_id", { count: "exact", head: true }).eq("ai_suggested_taxon_id", taxonId), "ai_suggested_resolutions"),
    countRows(supabase.from("content_template_taxons").select("template_id", { count: "exact", head: true }).eq("taxon_id", taxonId), "content_template_taxons"),
    countRows(supabase.from("taxon_market_research").select("id", { count: "exact", head: true }).eq("taxon_id", taxonId), "taxon_market_research"),
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

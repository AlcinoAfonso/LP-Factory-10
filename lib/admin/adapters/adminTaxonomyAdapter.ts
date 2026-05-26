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

  const [{ data: aliases }, { data: children }, parentTaxons] = await Promise.all([
    supabase.from("business_taxon_aliases").select("id,alias_text,is_active").eq("taxon_id", taxonId).order("alias_text", { ascending: true }).limit(100),
    supabase.from("business_taxons").select("id,parent_id,level,name,slug,is_active").eq("parent_id", taxonId).order("name", { ascending: true }).limit(100),
    getAdminTaxonsByIds(taxonRow.parent_id ? [taxonRow.parent_id] : []),
  ]);

  const parentNames = new Map(Array.from(parentTaxons.entries()).map(([id, row]) => [id, row.name]));
  const emptyAliasCounts = new Map<string, number>();
  const mappedTaxon = mapAdminTaxon(taxonRow, parentNames, emptyAliasCounts);

  return {
    ...mappedTaxon,
    aliasCount: ((aliases as any[]) ?? []).length,
    aliases: ((aliases as any[]) ?? []).map((row) => ({
      id: row.id,
      aliasText: row.alias_text ?? "",
      isActive: Boolean(row.is_active),
    })),
    children: ((children as any[]) ?? []).map((row) => mapAdminTaxon(row, new Map([[taxonId, mappedTaxon.name]]), emptyAliasCounts)),
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

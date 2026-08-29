import {
  buildLandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonChain,
  type LandingPageInputCatalogTaxonIdentity,
} from "../landing-page/input-catalog";

export const TAXON_CHAIN_PAGE_SIZE = 500;

export type CompleteTaxonChainErrorCode =
  | "DATABASE_READ_FAILED"
  | "TAXON_IDENTITY_INVALID"
  | "TAXON_NOT_FOUND"
  | "TAXON_INACTIVE"
  | "INVALID_TAXON_CHAIN";

export type CompleteTaxonChainResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        selected: LandingPageInputCatalogTaxonIdentity;
        taxons: readonly LandingPageInputCatalogTaxonIdentity[];
        chain: LandingPageInputCatalogTaxonChain;
      }>;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: CompleteTaxonChainErrorCode;
        message: string;
      }>;
    }>;

export type ReadTaxonChainPage = (
  offset: number,
  limit: number,
) => PromiseLike<
  Readonly<{
    data: unknown;
    error: unknown;
    status?: number;
  }>
>;

export async function readCompleteTaxonChainFromPages(
  taxonId: string,
  readPage: ReadTaxonChainPage,
): Promise<CompleteTaxonChainResult> {
  if (taxonId.trim().length === 0) {
    return failure("TAXON_IDENTITY_INVALID", "O identificador do taxon é inválido.");
  }

  const taxons: LandingPageInputCatalogTaxonIdentity[] = [];
  let offset = 0;
  while (true) {
    let response: Awaited<ReturnType<ReadTaxonChainPage>>;
    try {
      response = await readPage(offset, TAXON_CHAIN_PAGE_SIZE);
    } catch {
      return failure(
        "DATABASE_READ_FAILED",
        "A cadeia taxonômica não pôde ser lida integralmente.",
      );
    }

    if (
      offset > 0 &&
      isCanonicalRangeTermination(response.error, response.status)
    ) {
      break;
    }
    if (response.error || !Array.isArray(response.data)) {
      return failure(
        "DATABASE_READ_FAILED",
        "A cadeia taxonômica não pôde ser lida integralmente.",
      );
    }
    if (response.data.length > TAXON_CHAIN_PAGE_SIZE) {
      return failure(
        "DATABASE_READ_FAILED",
        "A página taxonômica excedeu o limite autorizado.",
      );
    }

    const page = response.data.map(normalizeTaxonIdentity);
    if (page.some((taxon) => taxon === null)) {
      return failure(
        "TAXON_IDENTITY_INVALID",
        "A cadeia taxonômica contém identidade inválida.",
      );
    }
    taxons.push(...(page as LandingPageInputCatalogTaxonIdentity[]));
    if (response.data.length < TAXON_CHAIN_PAGE_SIZE) break;
    offset += response.data.length;
  }

  if (!hasStrictDeterministicIdentityOrder(taxons)) {
    return failure(
      "TAXON_IDENTITY_INVALID",
      "A cadeia taxonômica contém identidades duplicadas ou fora de ordem.",
    );
  }
  const selected = taxons.find((taxon) => taxon.id === taxonId);
  if (!selected) {
    return failure(
      "TAXON_NOT_FOUND",
      "O taxon não pertence à cadeia taxonômica autoritativa.",
    );
  }
  if (!selected.isActive) {
    return failure("TAXON_INACTIVE", "O taxon selecionado está inativo.");
  }

  const chain = buildLandingPageInputCatalogTaxonChain(selected, taxons);
  if (!chain.ok) {
    return failure("INVALID_TAXON_CHAIN", chain.error.message);
  }
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      selected: Object.freeze({ ...selected }),
      taxons: Object.freeze(taxons.map((taxon) => Object.freeze({ ...taxon }))),
      chain: deepFreeze(cloneJson(chain.value)),
    }),
  });
}

function normalizeTaxonIdentity(
  value: unknown,
): LandingPageInputCatalogTaxonIdentity | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    value.id.trim().length === 0 ||
    typeof value.name !== "string" ||
    value.name.trim().length === 0 ||
    typeof value.slug !== "string" ||
    value.slug.trim().length === 0 ||
    typeof value.is_active !== "boolean" ||
    (value.parent_id !== null &&
      (typeof value.parent_id !== "string" || value.parent_id.trim().length === 0)) ||
    (value.level !== "segment" &&
      value.level !== "niche" &&
      value.level !== "ultra_niche")
  ) {
    return null;
  }
  return Object.freeze({
    id: value.id,
    name: value.name,
    slug: value.slug,
    level: value.level,
    isActive: value.is_active,
    parentId: value.parent_id,
  });
}

function hasStrictDeterministicIdentityOrder(
  taxons: readonly LandingPageInputCatalogTaxonIdentity[],
): boolean {
  return taxons.every(
    (taxon, index) => index === 0 || taxons[index - 1].id < taxon.id,
  );
}

function isCanonicalRangeTermination(error: unknown, status?: number): boolean {
  if (!error) return false;
  return status === 416 || (isRecord(error) && error.code === "PGRST103");
}

function failure(
  code: CompleteTaxonChainErrorCode,
  message: string,
): CompleteTaxonChainResult {
  return Object.freeze({ ok: false, error: Object.freeze({ code, message }) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const property of Object.getOwnPropertyNames(value)) {
      const nested = value[property as keyof T];
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
    Object.freeze(value);
  }
  return value;
}

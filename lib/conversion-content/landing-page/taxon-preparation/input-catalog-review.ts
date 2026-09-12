import {
  landingPageInputCatalogPlans,
  resolveLandingPageInputCatalog,
  type LandingPageInputCatalogTaxonChain,
  type ResolvedLandingPageInputCatalog,
} from "../input-catalog";

export type ResolveInputCatalogReviewResult =
  | Readonly<{
      ok: true;
      value: Readonly<{
        version: number;
        plans: typeof landingPageInputCatalogPlans;
        catalogs: readonly ResolvedLandingPageInputCatalog[];
      }>;
    }>
  | Readonly<{
      ok: false;
      error: Readonly<{
        code: "INVALID_VERSION" | "RESOLUTION_FAILED" | "PLAN_PROJECTIONS_DIVERGED";
        message: string;
      }>;
    }>;

export function resolveInputCatalogReview(input: {
  version: number;
  taxonChain: LandingPageInputCatalogTaxonChain;
}, resolveCatalog: typeof resolveLandingPageInputCatalog = resolveLandingPageInputCatalog): ResolveInputCatalogReviewResult {
  if (!Number.isSafeInteger(input.version) || input.version <= 0) {
    return failure("INVALID_VERSION", "A versão E20.2 deve ser um inteiro positivo explícito.");
  }

  const catalogs: ResolvedLandingPageInputCatalog[] = [];
  for (const plan of landingPageInputCatalogPlans) {
    const result = resolveCatalog({
      version: input.version,
      plan,
      taxonChain: input.taxonChain,
    });
    if (!result.ok) {
      return failure(
        "RESOLUTION_FAILED",
        `A versão E20.2 não pôde ser resolvida para o plano ${plan}: ${result.error.code}.`,
      );
    }
    catalogs.push(result.value);
  }

  const projections = catalogs.map((catalog) => JSON.stringify({
    version: catalog.version,
    servedTaxon: catalog.servedTaxon,
    appliedLayers: catalog.appliedLayers,
    fields: catalog.fields,
    valid: catalog.valid,
  }));
  if (new Set(projections).size !== 1) {
    return failure(
      "PLAN_PROJECTIONS_DIVERGED",
      "Os quatro planos possuem diferenças factuais materiais nesta versão E20.2.",
    );
  }

  return {
    ok: true,
    value: Object.freeze({
      version: input.version,
      plans: landingPageInputCatalogPlans,
      catalogs: Object.freeze(catalogs),
    }),
  };
}

function failure(
  code: Extract<ResolveInputCatalogReviewResult, { ok: false }>["error"]["code"],
  message: string,
): ResolveInputCatalogReviewResult {
  return { ok: false, error: { code, message } };
}

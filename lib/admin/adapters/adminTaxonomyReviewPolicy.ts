export type InputCatalogReviewBaseline = Readonly<{
  taxonName: string;
  taxonSlug: string;
  taxonLevel: "segment" | "niche" | "ultra_niche";
  parentTaxonId: string | null;
  selectedResearchVersion: number;
  reviewedVersion: number | null;
  chainFingerprint: string;
}>;

export function planEndCustomerResearchSelectionMutation(input: {
  currentVersion: number | null;
  nextVersion: number;
}) {
  if (input.currentVersion === input.nextVersion) {
    return { idempotent: true as const, update: null };
  }
  return {
    idempotent: false as const,
    update: { selected_end_customer_research_version: input.nextVersion },
  };
}

export function taxonomyMutationAffectsInputCatalogResolution(
  current: Readonly<{ name: string; slug: string; isActive: boolean }>,
  next: Readonly<{ name: string; slug: string; isActive: boolean }>,
): boolean {
  return (
    current.name !== next.name ||
    current.slug !== next.slug ||
    current.isActive !== next.isActive
  );
}

export function collectAffectedReviewedTaxonIds(
  rows: readonly Readonly<{
    id: string;
    parentId: string | null;
    reviewedVersion: number | null;
  }>[],
  rootTaxonId: string,
): readonly string[] {
  const affected = collectAffectedTaxonIds(rows, rootTaxonId);
  return rows
    .filter((row) => affected.includes(row.id) && row.reviewedVersion !== null)
    .map((row) => row.id);
}

export function collectAffectedTaxonIds(
  rows: readonly Readonly<{
    id: string;
    parentId: string | null;
  }>[],
  rootTaxonId: string,
): readonly string[] {
  const affected = new Set([rootTaxonId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of rows) {
      if (row.parentId && affected.has(row.parentId) && !affected.has(row.id)) {
        affected.add(row.id);
        changed = true;
      }
    }
  }
  return rows.filter((row) => affected.has(row.id)).map((row) => row.id);
}

export function planTaxonomyIdentityReviewInvalidation(input: Readonly<{
  materiallyChangesResolution: boolean;
  affectedReviewedTaxonIds: readonly string[];
  hasUnclosedFactualReview: boolean;
  explicitInvalidationAuthorized: boolean;
  closesUnclosedFactualReviews: boolean;
}>) {
  if (!input.materiallyChangesResolution) {
    return { ok: true as const, invalidateReviewedTaxonIds: Object.freeze([] as string[]) };
  }
  if (input.hasUnclosedFactualReview && !input.closesUnclosedFactualReviews) {
    return {
      ok: false as const,
      error: "Encerre a sessão factual aberta do taxon ou de seus descendentes antes de alterar sua identidade.",
    };
  }
  if (input.affectedReviewedTaxonIds.length > 0 && !input.explicitInvalidationAuthorized) {
    return {
      ok: false as const,
      error: "Confirme explicitamente a invalidação das coberturas E20.6 afetadas antes de alterar identidade ou atividade.",
    };
  }
  return {
    ok: true as const,
    invalidateReviewedTaxonIds: Object.freeze([...input.affectedReviewedTaxonIds]),
  };
}

export function sameInputCatalogReviewBaseline(
  left: InputCatalogReviewBaseline,
  right: InputCatalogReviewBaseline,
): boolean {
  return (
    left.taxonName === right.taxonName &&
    left.taxonSlug === right.taxonSlug &&
    left.taxonLevel === right.taxonLevel &&
    left.parentTaxonId === right.parentTaxonId &&
    left.selectedResearchVersion === right.selectedResearchVersion &&
    left.reviewedVersion === right.reviewedVersion &&
    left.chainFingerprint === right.chainFingerprint
  );
}

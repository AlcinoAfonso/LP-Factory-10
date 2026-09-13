export function planEndCustomerResearchSelectionMutation(input: {
  currentVersion: number | null;
  nextVersion: number;
  inputCatalogReviewEnabled: boolean;
  preserveReviewedVersion?: boolean;
}) {
  if (input.currentVersion === input.nextVersion) {
    return { idempotent: true as const, update: null };
  }
  return {
    idempotent: false as const,
    update: input.inputCatalogReviewEnabled && !input.preserveReviewedVersion
      ? {
          selected_end_customer_research_version: input.nextVersion,
          reviewed_input_catalog_version: null,
        }
      : { selected_end_customer_research_version: input.nextVersion },
  };
}

export function taxonomyMutationAffectsInputCatalogResolution(
  current: Readonly<{ name: string; slug: string; isActive: boolean }>,
  next: Readonly<{ name: string; slug: string; isActive: boolean }>,
): boolean {
  return current.name !== next.name || current.slug !== next.slug || current.isActive !== next.isActive;
}

export function collectAffectedReviewedTaxonIds(
  rows: readonly Readonly<{
    id: string;
    parentId: string | null;
    reviewedVersion: number | null;
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
  return rows
    .filter((row) => affected.has(row.id) && row.reviewedVersion !== null)
    .map((row) => row.id);
}

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
  inputCatalogReviewEnabled: boolean;
}) {
  if (input.currentVersion === input.nextVersion) {
    return { idempotent: true as const, update: null };
  }
  return {
    idempotent: false as const,
    update: input.inputCatalogReviewEnabled
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

export type InputCatalogReviewPresentation = Readonly<{
  reviewedVersion: number | null;
  lastAction: "record" | "reopen" | null;
}>;

export function nextInputCatalogReviewActionRevision(current: number): number {
  return current + 1;
}

export function applyInputCatalogReviewPresentation(
  _current: InputCatalogReviewPresentation,
  event: Readonly<
    | { type: "record"; reviewedVersion: number }
    | { type: "reopen" }
  >,
): InputCatalogReviewPresentation {
  return event.type === "record"
    ? { reviewedVersion: event.reviewedVersion, lastAction: "record" }
    : { reviewedVersion: null, lastAction: "reopen" };
}

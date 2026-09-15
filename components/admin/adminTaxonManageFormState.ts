type TaxonEditableFields = Readonly<{
  name: string;
  slug: string;
  isActive: boolean;
}>;

type TaxonActiveDraft = Readonly<{
  persisted: boolean;
  current: boolean;
}>;

export function syncTaxonActiveDraft(
  draft: TaxonActiveDraft,
  persisted: boolean,
): TaxonActiveDraft {
  if (draft.persisted === persisted) return draft;
  return { persisted, current: persisted };
}

export function hasPendingTaxonChanges(
  current: TaxonEditableFields,
  persisted: TaxonEditableFields,
): boolean {
  const normalizedName = current.name.replace(/\s+/g, " ").trim();
  return (
    normalizedName !== persisted.name ||
    current.slug !== persisted.slug ||
    current.isActive !== persisted.isActive
  );
}

type TaxonEditableFields = Readonly<{
  name: string;
  slug: string;
  isActive: boolean;
}>;

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

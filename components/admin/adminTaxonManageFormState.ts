type TaxonIdentityFields = Readonly<{
  name: string;
  slug: string;
}>;

export function hasPendingTaxonIdentityChanges(
  current: TaxonIdentityFields,
  persisted: TaxonIdentityFields,
): boolean {
  const normalizedName = current.name.replace(/\s+/g, " ").trim();
  return normalizedName !== persisted.name || current.slug !== persisted.slug;
}

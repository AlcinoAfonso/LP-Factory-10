export const OFFICIAL_NICHE_MAX_LENGTH = 120;
export function validNicheDescription(value: unknown): value is string {
  return typeof value === "string" && value === value.trim() &&
    value.length > 0 && value.length <= OFFICIAL_NICHE_MAX_LENGTH &&
    !/[\u0000-\u001f\u007f<>]/u.test(value);
}
export type OfficialAccountNiche = Readonly<{
  name: string; revision: string; confirmed: boolean; confirmedAt: string | null;
  confirmedBy: string | null; taxonId: string | null;
  textRevision: number; legacyUpdatedAt: string | null;
}>;


export function officialNichePromptContext(niche: Pick<OfficialAccountNiche, "name" | "revision" | "confirmed"> | null) {
  return niche ? { name: niche.name, revision: niche.revision, confirmed: niche.confirmed } : null;
}

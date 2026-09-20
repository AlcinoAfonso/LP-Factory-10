import type { UserNicheResolutionStatus } from "../niche-resolution/contracts";

export function canRecoverStalePendingSetupResolution(input: {
  validationFailureReason: string;
  userResolutionStatus: UserNicheResolutionStatus | null;
  userSelectedTaxonId: string | null;
  usableActivePrimaryTaxonId: string | null;
}): boolean {
  if (input.usableActivePrimaryTaxonId) return false;

  if (
    input.validationFailureReason === "missing_suggested_taxon" ||
    input.validationFailureReason === "missing_options"
  ) {
    return (
      input.userResolutionStatus === null ||
      input.userResolutionStatus === "pending_confirmation"
    );
  }

  return (
    input.validationFailureReason === "already_finalized" &&
    input.userResolutionStatus === "confirmed" &&
    Boolean(input.userSelectedTaxonId)
  );
}

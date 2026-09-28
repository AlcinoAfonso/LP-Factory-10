export function isCommunicationSectionSaveLocked(
  pending: boolean,
  status: "idle" | "saved" | "error",
  submittedVersion: number | null,
  currentVersion: number,
): boolean {
  return pending || (status === "saved" && submittedVersion !== null &&
    submittedVersion === currentVersion);
}

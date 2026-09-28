export function isCurrentGenerationVersion(requestedVersion: number, currentVersion: number | undefined): boolean {
  return requestedVersion === currentVersion;
}

export function canStartGeneralGeneration(pendingSaves: number): boolean {
  return pendingSaves === 0;
}

export function createStageTwoGenerationGate() {
  let inFlight = false;
  return {
    tryStart() {
      if (inFlight) return false;
      inFlight = true;
      return true;
    },
    finish() {
      inFlight = false;
    },
  };
}

export function canInstallGeneralSuggestion(
  requestedVersion: number,
  currentVersion: number,
  requestSaveRevision: number,
  currentSaveRevision: number,
): boolean {
  return isCurrentGenerationVersion(requestedVersion, currentVersion) &&
    requestSaveRevision === currentSaveRevision;
}

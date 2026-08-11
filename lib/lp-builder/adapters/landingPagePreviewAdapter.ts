import "server-only";

import {
  probeLandingPageMaterializationReadiness,
  readLandingPageMaterialization,
} from "./landingPageMaterializationAdapter";
import {
  getLandingPageDraftExperienceStateWithDependencies,
  type LandingPageDraftExperienceState,
} from "../landingPagePreview";

export function getLandingPageDraftExperienceState(input: {
  accountId: string;
  landingPageId: string;
}): Promise<LandingPageDraftExperienceState> {
  return getLandingPageDraftExperienceStateWithDependencies(input, {
    probeReadiness: probeLandingPageMaterializationReadiness,
    readMaterialization: readLandingPageMaterialization,
  });
}

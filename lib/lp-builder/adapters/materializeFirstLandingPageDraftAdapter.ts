import "server-only";

import type { MaterializeFirstLandingPageDraftResult } from "../landingPageMaterializationContracts";
import { materializeFirstLandingPageDraftWithDependencies } from "../materializeFirstLandingPageDraft";
import {
  prepareLandingPageDraftGeneration,
  requestPreparedLandingPageDraftCandidate,
} from "./landingPageDraftGenerationAdapter";
import {
  insertLandingPageMaterialization,
  probeLandingPageMaterializationReadiness,
  readLandingPageMaterialization,
} from "./landingPageMaterializationAdapter";

export function materializeFirstLandingPageDraft(input: {
  accountId: string;
  landingPageId: string;
  requestId?: string;
}): Promise<MaterializeFirstLandingPageDraftResult> {
  return materializeFirstLandingPageDraftWithDependencies(input, {
    probeReadiness: probeLandingPageMaterializationReadiness,
    readMaterialization: readLandingPageMaterialization,
    prepareGeneration: prepareLandingPageDraftGeneration,
    requestCandidate: requestPreparedLandingPageDraftCandidate,
    insertMaterialization: insertLandingPageMaterialization,
  });
}

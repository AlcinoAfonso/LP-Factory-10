import type { OpenAiCostRecorder } from "../active-contracts";

// Used with intercepted provider transport in validation cases.
export const confirmedCostRecorder: OpenAiCostRecorder = {
  startExecution: async () => true,
  startOperation: async () => true,
  finishOperation: async () => {},
  finishExecution: async () => {},
};

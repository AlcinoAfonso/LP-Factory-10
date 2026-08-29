import "server-only";

import type {
  OpenAiOfficialCostsReader,
  OpenAiOfficialCostsReadResult,
} from "../contracts";
import { readOfficialOpenAiCostsWithKey } from "./openAiCostsProviderCore";

export const readOfficialOpenAiCosts: OpenAiOfficialCostsReader = async (
  period,
): Promise<OpenAiOfficialCostsReadResult> =>
  readOfficialOpenAiCostsWithKey({
    period,
    adminKey: process.env.OPENAI_ADMIN_KEY,
  });

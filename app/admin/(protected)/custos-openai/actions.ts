"use server";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { readOpenAiActiveCosts } from "@/openai-costs/adapters/activeCostReadModelAdapter";
import { readOpenAiLpCosts } from "@/openai-costs/adapters/lpCostReadModelAdapter";
import { readOfficialOpenAiCosts } from "@/openai-costs/providers/openAiCostsProvider";
import {
  refreshOpenAiCostsActionCore,
  type OpenAiCostsActionState,
} from "./action-core";

export type { OpenAiCostsActionState } from "./action-core";

export async function refreshOpenAiCostsAction(
  _previous: OpenAiCostsActionState,
  formData: FormData,
): Promise<OpenAiCostsActionState> {
  return await refreshOpenAiCostsActionCore(formData, {
    authorize: requirePlatformAdmin,
    readOfficial: readOfficialOpenAiCosts,
    readActive: readOpenAiActiveCosts,
    readLegacy: readOpenAiLpCosts,
  });
}

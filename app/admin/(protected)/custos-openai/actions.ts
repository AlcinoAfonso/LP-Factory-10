"use server";

import { listOpenAiCostDialogues, readOpenAiDialogueCost } from "@/openai-costs/adapters/dialogueCostReadAdapter";
import { readOpenAiCostOccurrence } from "@/openai-costs/adapters/costLedgerReadAdapter";
import { readDialogueCostActionCore, readOccurrenceCostActionCore } from "./action-core";
import { requirePlatformAdmin } from "@/lib/access/guards";
import { readOpenAiActiveCosts, readOpenAiProductLifetimeCost } from "@/openai-costs/adapters/activeCostReadModelAdapter";
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
    readProductLifetime: readOpenAiProductLifetimeCost,
    readDialogues: (period, active) => listOpenAiCostDialogues(period, active.ok ? active.value : null),
  });
}

export async function readDialogueCostAction(raw: unknown) {
  return await readDialogueCostActionCore(raw, { authorize: requirePlatformAdmin, read: readOpenAiDialogueCost });
}

export async function readOccurrenceCostAction(raw: unknown) {
  return await readOccurrenceCostActionCore(raw, { authorize: requirePlatformAdmin, read: readOpenAiCostOccurrence });
}

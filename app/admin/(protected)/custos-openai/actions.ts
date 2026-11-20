"use server";

import { listOpenAiCostDialogues, readOpenAiDialogueCost } from "@/openai-costs/adapters/dialogueCostReadAdapter";
import { readDialogueCostActionCore } from "./action-core";
import { requirePlatformAdmin } from "@/lib/access/guards";
import { readCategory3Cost, readCategory3ObservedStarts } from "@/openai-costs/adapters/category3CostReadAdapter";
import { category3CostIdentitySchema, type Category3CostResult } from "@/openai-costs/category-3-costs";
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
    readDialogues: (period, active) => listOpenAiCostDialogues(period, active.ok ? active.value : null),
    readCategory3Starts: (period, active) => readCategory3ObservedStarts(period, active.ok ? active.value : null),
  });
}

export async function readDialogueCostAction(raw: unknown) {
  return await readDialogueCostActionCore(raw, { authorize: requirePlatformAdmin, read: readOpenAiDialogueCost });
}

export async function readCategory3CostAction(raw: unknown): Promise<Category3CostResult> {
  if (!(await requirePlatformAdmin()).allowed) return { ok: false };
  const identity = category3CostIdentitySchema.safeParse(raw);
  return identity.success ? await readCategory3Cost(identity.data) : { ok: false };
}

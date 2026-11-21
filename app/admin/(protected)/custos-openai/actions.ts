"use server";

import { listOpenAiCostDialogues, readOpenAiDialogueCost } from "@/openai-costs/adapters/dialogueCostReadAdapter";
import { readDialogueCostActionCore } from "./action-core";
import { requirePlatformAdmin } from "@/lib/access/guards";
import { readCategory3Cost } from "@/openai-costs/adapters/category3CostReadAdapter";
import { category3CostIdentitySchema } from "@/openai-costs/category-3-costs";
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
  if (formData.has("category3GenerationId")) {
    const unavailable = { status: "error", code: "CATEGORY_3_COST_UNAVAILABLE", message: "Custo da geração indisponível.",
      dashboard: null, category3Cost: { ok: false } } as const;
    if (!(await requirePlatformAdmin()).allowed) return unavailable;
    const generationId = formData.get("category3GenerationId");
    const accountId = formData.get("accountId");
    const environment = formData.get("environment");
    const identity = accountId === null && environment === null
      ? category3CostIdentitySchema.shape.generationId.safeParse(typeof generationId === "string" ? generationId.trim().toLowerCase() : generationId)
      : category3CostIdentitySchema.safeParse({ generationId, accountId, environment });
    if (!identity.success) return unavailable;
    const cost = await readCategory3Cost(identity.data);
    return cost.ok ? { status: "success", code: null, message: "Custos da geração consultados.",
      dashboard: null, category3Cost: cost } : unavailable;
  }
  return await refreshOpenAiCostsActionCore(formData, {
    authorize: requirePlatformAdmin,
    readOfficial: readOfficialOpenAiCosts,
    readActive: readOpenAiActiveCosts,
    readLegacy: readOpenAiLpCosts,
    readDialogues: (period, active) => listOpenAiCostDialogues(period, active.ok ? active.value : null),
  });
}

export async function readDialogueCostAction(raw: unknown) {
  return await readDialogueCostActionCore(raw, { authorize: requirePlatformAdmin, read: readOpenAiDialogueCost });
}

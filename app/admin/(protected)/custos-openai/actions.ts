"use server";

import { requirePlatformAdmin } from "@/lib/access/guards";
import { readOpenAiLpCosts } from "@/openai-costs/adapters/lpCostReadModelAdapter";
import {
  buildOpenAiCostsDashboard,
  parseOpenAiCostsPeriodSelection,
  type OpenAiCostsDashboard,
} from "@/openai-costs/dashboard";
import { readOfficialOpenAiCosts } from "@/openai-costs/providers/openAiCostsProvider";

export type OpenAiCostsActionState = Readonly<{
  status: "idle" | "success" | "error";
  code: string | null;
  message: string;
  dashboard: OpenAiCostsDashboard | null;
}>;

export async function refreshOpenAiCostsAction(
  _previous: OpenAiCostsActionState,
  formData: FormData,
): Promise<OpenAiCostsActionState> {
  const gate = await requirePlatformAdmin();
  if (!gate.allowed) {
    return failure("UNAUTHORIZED", "Acesso administrativo não autorizado.");
  }

  const selection = parseOpenAiCostsPeriodSelection({
    mode: formData.get("periodMode"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!selection) {
    return failure(
      "INVALID_PERIOD",
      "Informe um período válido de até 180 dias, sem datas futuras.",
    );
  }

  const [official, internal] = await Promise.all([
    readOfficialOpenAiCosts(selection.period),
    readOpenAiLpCosts(selection.period),
  ]);
  if (!official.ok) {
    return failure(
      official.error.code,
      "O total oficial da OpenAI está indisponível para este período.",
    );
  }

  const dashboard = buildOpenAiCostsDashboard({ selection, official, internal });
  if (!dashboard) {
    return failure("INVALID_RESPONSE", "A resposta de custos não pôde ser validada.");
  }
  return {
    status: "success",
    code: dashboard.internalErrorCode,
    message: dashboard.internal
      ? "Custos atualizados sob demanda."
      : "Total oficial atualizado; a cobertura interna está temporariamente indisponível.",
    dashboard,
  };
}

function failure(code: string, message: string): OpenAiCostsActionState {
  return { status: "error", code, message, dashboard: null };
}

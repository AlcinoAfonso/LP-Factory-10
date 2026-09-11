import type { OpenAiActiveCostReadResult } from "@/openai-costs/active-contracts";
import type {
  OpenAiCostsPeriod,
  OpenAiLpCostReadResult,
  OpenAiOfficialCostsReadResult,
} from "@/openai-costs/contracts";
import {
  buildOpenAiCostsFinancialComposition,
  parseOpenAiActiveCostFilters,
  parseOpenAiCostsPeriodSelection,
  type OpenAiCostsFinancialComposition,
} from "@/openai-costs/dashboard";

export type OpenAiCostsActionState = Readonly<{
  status: "idle" | "success" | "error";
  code: string | null;
  message: string;
  dashboard: OpenAiCostsFinancialComposition | null;
}>;

export type OpenAiCostsActionDependencies = Readonly<{
  authorize: () => Promise<Readonly<{ allowed: boolean }>>;
  readOfficial: (period: OpenAiCostsPeriod) => Promise<OpenAiOfficialCostsReadResult>;
  readActive: (period: OpenAiCostsPeriod) => Promise<OpenAiActiveCostReadResult>;
  readLegacy: (period: OpenAiCostsPeriod) => Promise<OpenAiLpCostReadResult>;
}>;

export async function refreshOpenAiCostsActionCore(
  formData: FormData,
  dependencies: OpenAiCostsActionDependencies,
): Promise<OpenAiCostsActionState> {
  const gate = await dependencies.authorize();
  if (!gate.allowed) return failure("UNAUTHORIZED", "Acesso administrativo não autorizado.");

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

  const activeFilters = parseOpenAiActiveCostFilters({
    universe: formData.get("universe"),
    accountId: formData.get("accountId"),
    workload: formData.get("workload"),
  });
  if (!activeFilters) {
    return failure("INVALID_FILTERS", "Revise os filtros de universo, conta e workload.");
  }

  const [official, active, legacy] = await Promise.all([
    dependencies.readOfficial(selection.period),
    dependencies.readActive(selection.period),
    dependencies.readLegacy(selection.period),
  ]);
  if (!official.ok) {
    return failure(
      official.error.code,
      "O total oficial da OpenAI está indisponível para este período.",
    );
  }

  const dashboard = buildOpenAiCostsFinancialComposition({
    selection,
    official,
    active,
    legacy,
    activeFilters,
  });
  if (!dashboard) return failure("INVALID_RESPONSE", "A resposta de custos não pôde ser validada.");
  return {
    status: "success",
    code: dashboard.activeErrorCode ?? dashboard.legacyErrorCode,
    message: dashboard.active && dashboard.legacy
      ? "Custos atualizados sob demanda."
      : "Total oficial atualizado; uma das fontes internas está indisponível.",
    dashboard,
  };
}

function failure(code: string, message: string): OpenAiCostsActionState {
  return { status: "error", code, message, dashboard: null };
}

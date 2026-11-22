import type { DialogueCostResult, DialogueListResult } from "@/openai-costs/dialogue-costs";
import { dialogueIdentitySchema } from "@/openai-costs/dialogue-costs";
import { occurrenceCostQuerySchema, type OccurrenceCostQuery, type OccurrenceCostResult } from "@/openai-costs/occurrence-costs";
import type { OpenAiActiveCostReadResult } from "@/openai-costs/active-contracts";
import type { ProductLifetimeCost } from "@/openai-costs/occurrence-period";
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
  readDialogues?: (period: OpenAiCostsPeriod, active: OpenAiActiveCostReadResult) => Promise<DialogueListResult>;
  readProductLifetime?: (accountId: string) => Promise<ProductLifetimeCost | null>;
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
    product: formData.get("product"),
  });
  if (!activeFilters) {
    return failure("INVALID_FILTERS", "Revise os filtros de conta, produto, universo e workload.");
  }

  const [officialRead, activeRead, legacyRead] = await Promise.allSettled([
    dependencies.readOfficial(selection.period),
    dependencies.readActive(selection.period),
    dependencies.readLegacy(selection.period),
  ]);
  const official: OpenAiOfficialCostsReadResult = officialRead.status === "fulfilled" ? officialRead.value
    : { ok: false, error: { code: "REQUEST_FAILED", message: "Official costs read failed", httpStatus: null } };
  const active: OpenAiActiveCostReadResult = activeRead.status === "fulfilled" ? activeRead.value
    : { ok: false, error: { code: "READ_FAILED", message: "Active costs read failed" } };
  const legacy: OpenAiLpCostReadResult = legacyRead.status === "fulfilled" ? legacyRead.value
    : { ok: false, error: { code: "READ_FAILED", message: "Frozen costs read failed" } };

  const [dialogues, productLifetime] = await Promise.all([
    dependencies.readDialogues?.(selection.period, active)
      .catch((): DialogueListResult => ({ ok: false, code: "DIALOGUE_LIST_UNAVAILABLE" })),
    active.ok && active.value.economicDimensionStatus === "v3_operation_period" &&
      activeFilters.product === "communication_base" && activeFilters.accountId
      ? dependencies.readProductLifetime?.(activeFilters.accountId).catch(() => null)
      : null,
  ]);
  const dashboard = buildOpenAiCostsFinancialComposition({
    selection,
    official,
    active,
    legacy,
    activeFilters,
    dialogues,
    productLifetime,
  });
  return {
    status: "success",
    code: dashboard.officialErrorCode ?? dashboard.activeErrorCode ?? dashboard.legacyErrorCode,
    message: !dashboard.officialErrorCode && dashboard.active && dashboard.legacy
      ? "Custos atualizados sob demanda."
      : "Confira abaixo a disponibilidade de cada fonte.",
    dashboard,
  };
}

function failure(code: string, message: string): OpenAiCostsActionState {
  return { status: "error", code, message, dashboard: null };
}

export async function readDialogueCostActionCore(raw: unknown, dependencies: Readonly<{
  authorize: () => Promise<Readonly<{ allowed: boolean }>>;
  read: (identity: { dialogueId: string; accountId: string }) => Promise<DialogueCostResult>;
}>): Promise<DialogueCostResult> {
  if (!(await dependencies.authorize()).allowed) return { ok: false, code: "UNAUTHORIZED" };
  const parsed = dialogueIdentitySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_DIALOGUE" };
  return await dependencies.read(parsed.data);
}

export async function readOccurrenceCostActionCore(raw: unknown, dependencies: Readonly<{
  authorize: () => Promise<Readonly<{ allowed: boolean }>>;
  read: (query: OccurrenceCostQuery) => Promise<OccurrenceCostResult>;
}>): Promise<OccurrenceCostResult> {
  if (!(await dependencies.authorize()).allowed) return { ok: false, code: "UNAUTHORIZED" };
  const parsed = occurrenceCostQuerySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "INVALID_ID" };
  return await dependencies.read(parsed.data);
}

// src/lib/supabase-inspect/contracts.ts

export const SUPABASE_INSPECT_TOOL_NAME = "run_supabase_inspect_readonly";

export const INSPECTION_TYPES = [
  "tableOverview",
  "schemaColumns",
  "rlsPolicies",
  "indexes",
  "views",
  "functions",
  "triggers",
  "dataSample",
] as const;

export const TARGET_KINDS = ["table", "view", "function", "schema"] as const;

export const RESPONSE_MODES = ["structuredReport"] as const;

export const OUTPUT_STATUSES = [
  "ok",
  "needs_clarification",
  "blocked",
  "error",
] as const;

export const FINDING_SEVERITIES = ["info", "attention", "blocked"] as const;

export type InspectionType = (typeof INSPECTION_TYPES)[number];
export type TargetKind = (typeof TARGET_KINDS)[number];
export type ResponseMode = (typeof RESPONSE_MODES)[number];
export type InspectOutputStatus = (typeof OUTPUT_STATUSES)[number];
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export type InspectTarget = {
  schema: string;
  name?: string;
  kind: TargetKind;
};

export type InspectReadonlyInput = {
  inspectionType: InspectionType;
  target: InspectTarget;
  questions?: string[];
  rowLimit?: number;
  responseMode?: ResponseMode;
};

export type NormalizedInspectReadonlyInput = {
  inspectionType: InspectionType;
  target: {
    schema: string;
    name?: string;
    kind: TargetKind;
  };
  questions: string[];
  rowLimit: number;
  responseMode: ResponseMode;
};

export type InspectFinding = {
  title: string;
  severity: FindingSeverity;
  detail: string;
  evidence?: string[];
  payload?: Record<string, unknown>[];
};

export type InspectReadonlyOutput = {
  status: InspectOutputStatus;
  requestSummary: string;
  normalizedScope: NormalizedInspectReadonlyInput | null;
  findings: InspectFinding[];
  inspectedObjects: string[];
  warnings: string[];
  limitations: string[];
  nextSteps: string[];
};

export type NormalizeInspectReadonlyResult =
  | {
      ok: true;
      value: NormalizedInspectReadonlyInput;
    }
  | {
      ok: false;
      error: InspectReadonlyOutput;
    };

export const DEFAULT_ROW_LIMIT = 20;
export const MAX_ROW_LIMIT = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function isInspectionType(value: string): value is InspectionType {
  return (INSPECTION_TYPES as readonly string[]).includes(value);
}

function isTargetKind(value: string): value is TargetKind {
  return (TARGET_KINDS as readonly string[]).includes(value);
}

function isResponseMode(value: string): value is ResponseMode {
  return (RESPONSE_MODES as readonly string[]).includes(value);
}

function buildInvalidInputOutput(detail: string): InspectReadonlyOutput {
  return {
    status: "needs_clarification",
    requestSummary: "Input inválido para run_supabase_inspect_readonly.",
    normalizedScope: null,
    findings: [],
    inspectedObjects: [],
    warnings: [],
    limitations: [detail],
    nextSteps: ["Corrigir o payload enviado para a tool."],
  };
}

function requiresTargetName(
  inspectionType: InspectionType,
  targetKind: TargetKind
): boolean {
  if (targetKind === "schema") return false;
  if (inspectionType === "views" || inspectionType === "functions") return false;
  return true;
}

export function normalizeInspectReadonlyInput(
  raw: unknown
): NormalizeInspectReadonlyResult {
  if (!isRecord(raw)) {
    return {
      ok: false,
      error: buildInvalidInputOutput("O payload deve ser um objeto JSON."),
    };
  }

  const inspectionTypeRaw = String(raw.inspectionType ?? "").trim();
  if (!isInspectionType(inspectionTypeRaw)) {
    return {
      ok: false,
      error: buildInvalidInputOutput("inspectionType inválido ou ausente."),
    };
  }

  const targetRaw = raw.target;
  if (!isRecord(targetRaw)) {
    return {
      ok: false,
      error: buildInvalidInputOutput("target inválido ou ausente."),
    };
  }

  const schema = String(targetRaw.schema ?? "").trim();
  const name = String(targetRaw.name ?? "").trim();
  const kindRaw = String(targetRaw.kind ?? "").trim();

  if (!schema) {
    return {
      ok: false,
      error: buildInvalidInputOutput("target.schema é obrigatório."),
    };
  }

  if (!isTargetKind(kindRaw)) {
    return {
      ok: false,
      error: buildInvalidInputOutput("target.kind inválido ou ausente."),
    };
  }

  if (requiresTargetName(inspectionTypeRaw, kindRaw) && !name) {
    return {
      ok: false,
      error: buildInvalidInputOutput("target.name é obrigatório para esta inspeção."),
    };
  }

  const rowLimitRaw = Number(raw.rowLimit ?? DEFAULT_ROW_LIMIT);
  const rowLimit = Number.isFinite(rowLimitRaw)
    ? Math.min(Math.max(Math.trunc(rowLimitRaw), 1), MAX_ROW_LIMIT)
    : DEFAULT_ROW_LIMIT;

  const responseModeRaw = String(raw.responseMode ?? RESPONSE_MODES[0]).trim();
  const responseMode = isResponseMode(responseModeRaw)
    ? responseModeRaw
    : RESPONSE_MODES[0];

  return {
    ok: true,
    value: {
      inspectionType: inspectionTypeRaw,
      target: {
        schema,
        name: name || undefined,
        kind: kindRaw,
      },
      questions: normalizeStringArray(raw.questions),
      rowLimit,
      responseMode,
    },
  };
}

export function buildErrorOutput(args: {
  requestSummary: string;
  normalizedScope: NormalizedInspectReadonlyInput | null;
  detail: string;
}): InspectReadonlyOutput {
  return {
    status: "error",
    requestSummary: args.requestSummary,
    normalizedScope: args.normalizedScope,
    findings: [],
    inspectedObjects: [],
    warnings: [],
    limitations: [args.detail],
    nextSteps: ["Revisar a origem do erro e tentar novamente."],
  };
}

export function buildBlockedOutput(args: {
  requestSummary: string;
  normalizedScope: NormalizedInspectReadonlyInput | null;
  detail: string;
}): InspectReadonlyOutput {
  return {
    status: "blocked",
    requestSummary: args.requestSummary,
    normalizedScope: args.normalizedScope,
    findings: [],
    inspectedObjects: [],
    warnings: [],
    limitations: [args.detail],
    nextSteps: ["Ajustar o escopo da inspeção e reenviar a requisição."],
  };
}

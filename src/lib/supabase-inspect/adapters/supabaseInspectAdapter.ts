// src/lib/supabase-inspect/adapters/supabaseInspectAdapter.ts
import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type {
  InspectFinding,
  InspectReadonlyOutput,
  NormalizedInspectReadonlyInput,
} from "../contracts";
import {
  MAX_ROW_LIMIT,
  buildBlockedOutput,
  buildErrorOutput,
} from "../contracts";

type SupabaseLikeClient = ReturnType<typeof createServiceClient>;

type FindingResult =
  | { ok: true; finding: InspectFinding }
  | { ok: false; detail: string };

function objectName(input: NormalizedInspectReadonlyInput): string {
  const { schema, name } = input.target;
  return name ? `${schema}.${name}` : schema;
}

function toRows(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is Record<string, unknown> =>
      !!row && typeof row === "object" && !Array.isArray(row)
  );
}

function safeRowLimit(raw: number): number {
  return Math.min(Math.max(Math.trunc(raw || 0), 1), MAX_ROW_LIMIT);
}

function limitPayload(rows: Record<string, unknown>[], rowLimit: number): Record<string, unknown>[] {
  return rows.slice(0, safeRowLimit(rowLimit));
}

function queryErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "unknown_error";
  const maybeMessage = (error as { message?: unknown }).message;
  return typeof maybeMessage === "string" && maybeMessage.trim()
    ? maybeMessage
    : "unknown_error";
}

async function readSchemaColumns(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<FindingResult> {
  const { data, error } = await svc
    .schema("information_schema")
    .from("columns")
    .select(
      "column_name,data_type,is_nullable,column_default,ordinal_position"
    )
    .eq("table_schema", input.target.schema)
    .eq("table_name", input.target.name)
    .order("ordinal_position", { ascending: true });

  if (error) {
    return { ok: false, detail: `schema_columns_failed: ${queryErrorMessage(error)}` };
  }

  const rows = limitPayload(toRows(data), input.rowLimit);

  return {
    ok: true,
    finding: {
      title: "Colunas do objeto alvo",
      severity: "info",
      detail: `Foram encontradas ${rows.length} coluna(s) em ${objectName(input)}.`,
      payload: rows,
    },
  };
}

async function readRlsPolicies(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<FindingResult> {
  const { data, error } = await svc
    .schema("pg_catalog")
    .from("pg_policies")
    .select("schemaname,tablename,policyname,cmd,roles,qual,with_check")
    .eq("schemaname", input.target.schema)
    .eq("tablename", input.target.name)
    .order("policyname", { ascending: true });

  if (error) {
    return { ok: false, detail: `rls_policies_failed: ${queryErrorMessage(error)}` };
  }

  const rows = limitPayload(toRows(data), input.rowLimit);

  return {
    ok: true,
    finding: {
      title: "Policies RLS",
      severity: rows.length > 0 ? "attention" : "info",
      detail:
        rows.length > 0
          ? `Foram encontradas ${rows.length} policy/policies em ${objectName(input)}.`
          : `Nenhuma policy foi retornada para ${objectName(input)}.`,
      payload: rows,
    },
  };
}

async function readIndexes(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<FindingResult> {
  const { data, error } = await svc
    .schema("pg_catalog")
    .from("pg_indexes")
    .select("schemaname,tablename,indexname,indexdef")
    .eq("schemaname", input.target.schema)
    .eq("tablename", input.target.name)
    .order("indexname", { ascending: true });

  if (error) {
    return { ok: false, detail: `indexes_failed: ${queryErrorMessage(error)}` };
  }

  const rows = limitPayload(toRows(data), input.rowLimit);

  return {
    ok: true,
    finding: {
      title: "Índices",
      severity: "info",
      detail: `Foram encontrados ${rows.length} índice(s) em ${objectName(input)}.`,
      payload: rows,
    },
  };
}

async function readViews(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<FindingResult> {
  let query = svc
    .schema("information_schema")
    .from("views")
    .select("table_schema,table_name")
    .eq("table_schema", input.target.schema)
    .limit(safeRowLimit(input.rowLimit));

  if (input.target.name) {
    query = query.eq("table_name", input.target.name);
  }

  const { data, error } = await query.order("table_name", {
    ascending: true,
  });

  if (error) {
    return { ok: false, detail: `views_failed: ${queryErrorMessage(error)}` };
  }

  const rows = limitPayload(toRows(data), input.rowLimit);

  return {
    ok: true,
    finding: {
      title: "Views",
      severity: "info",
      detail: `Foram retornadas ${rows.length} view(s) para o schema ${input.target.schema}.`,
      payload: rows,
    },
  };
}

async function readFunctions(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<FindingResult> {
  let query = svc
    .schema("information_schema")
    .from("routines")
    .select("routine_schema,routine_name,routine_type,data_type,specific_name")
    .eq("routine_schema", input.target.schema)
    .limit(safeRowLimit(input.rowLimit));

  if (input.target.name) {
    query = query.eq("routine_name", input.target.name);
  }

  const { data, error } = await query.order("routine_name", {
    ascending: true,
  });

  if (error) {
    return { ok: false, detail: `functions_failed: ${queryErrorMessage(error)}` };
  }

  const rows = limitPayload(toRows(data), input.rowLimit);

  return {
    ok: true,
    finding: {
      title: "Functions / routines",
      severity: "info",
      detail: `Foram retornadas ${rows.length} routine(s) para o schema ${input.target.schema}.`,
      payload: rows,
    },
  };
}

async function readTriggers(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<FindingResult> {
  let query = svc
    .schema("information_schema")
    .from("triggers")
    .select(
      "trigger_schema,trigger_name,event_object_table,event_manipulation,action_timing,action_statement"
    )
    .eq("trigger_schema", input.target.schema)
    .limit(safeRowLimit(input.rowLimit));

  if (input.target.name) {
    query = query.eq("event_object_table", input.target.name);
  }

  const { data, error } = await query.order("trigger_name", {
    ascending: true,
  });

  if (error) {
    return { ok: false, detail: `triggers_failed: ${queryErrorMessage(error)}` };
  }

  const rows = limitPayload(toRows(data), input.rowLimit);

  return {
    ok: true,
    finding: {
      title: "Triggers",
      severity: "info",
      detail: `Foram retornados ${rows.length} trigger(s) para o schema ${input.target.schema}.`,
      payload: rows,
    },
  };
}

async function readDataSample(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<FindingResult> {
  const { data, error } = await svc
    .schema(input.target.schema)
    .from(input.target.name as string)
    .select("*")
    .limit(safeRowLimit(input.rowLimit));

  if (error) {
    return { ok: false, detail: `data_sample_failed: ${queryErrorMessage(error)}` };
  }

  const rows = limitPayload(toRows(data), input.rowLimit);

  return {
    ok: true,
    finding: {
      title: "Amostra de dados",
      severity: "info",
      detail: `Foram retornadas ${rows.length} linha(s) de amostra de ${objectName(input)}.`,
      payload: rows,
    },
  };
}

async function readTableOverview(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<{ ok: true; findings: InspectFinding[] } | { ok: false; detail: string }> {
  const columns = await readSchemaColumns(svc, input);
  if (!columns.ok) return columns;

  const indexes = await readIndexes(svc, input);
  if (!indexes.ok) return indexes;

  const policies = await readRlsPolicies(svc, input);
  if (!policies.ok) return policies;

  return { ok: true, findings: [columns.finding, indexes.finding, policies.finding] };
}

function ensureTargetName(
  input: NormalizedInspectReadonlyInput,
  requestSummary: string
): InspectReadonlyOutput | null {
  const requiredNameInspections: readonly NormalizedInspectReadonlyInput["inspectionType"][] = [
    "schemaColumns",
    "indexes",
    "rlsPolicies",
    "triggers",
    "dataSample",
    "tableOverview",
  ];

  if (requiredNameInspections.includes(input.inspectionType) && !input.target.name) {
    return buildBlockedOutput({
      requestSummary,
      normalizedScope: input,
      detail: `target.name é obrigatório para ${input.inspectionType}.`,
    });
  }

  return null;
}

function buildSuccessOutput(
  input: NormalizedInspectReadonlyInput,
  requestSummary: string,
  findings: InspectFinding[]
): InspectReadonlyOutput {
  return {
    status: "ok",
    requestSummary,
    normalizedScope: {
      ...input,
      rowLimit: safeRowLimit(input.rowLimit),
    },
    findings,
    inspectedObjects: [objectName(input)],
    warnings: [],
    limitations: [
      "Modo somente leitura.",
      "O resultado depende da exposição dos schemas via API do Supabase.",
    ],
    nextSteps: [],
  };
}

export async function inspectReadonly(
  input: NormalizedInspectReadonlyInput
): Promise<InspectReadonlyOutput> {
  const svc = createServiceClient();
  const inspectedObject = objectName(input);
  const requestSummary = `Inspeção read-only ${input.inspectionType} em ${inspectedObject}.`;

  const missingName = ensureTargetName(input, requestSummary);
  if (missingName) {
    return missingName;
  }

  if (input.inspectionType === "tableOverview") {
    const overview = await readTableOverview(svc, input);
    if (!overview.ok) {
      return buildErrorOutput({
        requestSummary,
        normalizedScope: input,
        detail: overview.detail,
      });
    }

    return buildSuccessOutput(input, requestSummary, overview.findings);
  }

  let result: FindingResult;

  switch (input.inspectionType) {
    case "schemaColumns":
      result = await readSchemaColumns(svc, input);
      break;
    case "rlsPolicies":
      result = await readRlsPolicies(svc, input);
      break;
    case "indexes":
      result = await readIndexes(svc, input);
      break;
    case "views":
      result = await readViews(svc, input);
      break;
    case "functions":
      result = await readFunctions(svc, input);
      break;
    case "triggers":
      result = await readTriggers(svc, input);
      break;
    case "dataSample":
      result = await readDataSample(svc, input);
      break;
    default:
      return buildBlockedOutput({
        requestSummary,
        normalizedScope: input,
        detail: `inspectionType não suportado: ${input.inspectionType}`,
      });
  }

  if (!result.ok) {
    return buildErrorOutput({
      requestSummary,
      normalizedScope: input,
      detail: result.detail,
    });
  }

  return buildSuccessOutput(input, requestSummary, [result.finding]);
}

// src/lib/supabase-inspect/adapters/supabaseInspectAdapter.ts
import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type {
  InspectFinding,
  InspectReadonlyOutput,
  NormalizedInspectReadonlyInput,
} from "../contracts";
import { buildBlockedOutput, buildErrorOutput } from "../contracts";

type SupabaseLikeClient = ReturnType<typeof createServiceClient>;

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

function limitPayload(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.slice(0, 50);
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
): Promise<InspectFinding> {
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
    throw new Error(`schema_columns_failed: ${queryErrorMessage(error)}`);
  }

  const rows = limitPayload(toRows(data));

  return {
    title: "Colunas do objeto alvo",
    severity: "info",
    detail: `Foram encontradas ${rows.length} coluna(s) em ${objectName(input)}.`,
    payload: rows,
  };
}

async function readRlsPolicies(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<InspectFinding> {
  const { data, error } = await svc
    .schema("pg_catalog")
    .from("pg_policies")
    .select("schemaname,tablename,policyname,cmd,roles,qual,with_check")
    .eq("schemaname", input.target.schema)
    .eq("tablename", input.target.name)
    .order("policyname", { ascending: true });

  if (error) {
    throw new Error(`rls_policies_failed: ${queryErrorMessage(error)}`);
  }

  const rows = limitPayload(toRows(data));

  return {
    title: "Policies RLS",
    severity: rows.length > 0 ? "attention" : "info",
    detail:
      rows.length > 0
        ? `Foram encontradas ${rows.length} policy/policies em ${objectName(input)}.`
        : `Nenhuma policy foi retornada para ${objectName(input)}.`,
    payload: rows,
  };
}

async function readIndexes(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<InspectFinding> {
  const { data, error } = await svc
    .schema("pg_catalog")
    .from("pg_indexes")
    .select("schemaname,tablename,indexname,indexdef")
    .eq("schemaname", input.target.schema)
    .eq("tablename", input.target.name)
    .order("indexname", { ascending: true });

  if (error) {
    throw new Error(`indexes_failed: ${queryErrorMessage(error)}`);
  }

  const rows = limitPayload(toRows(data));

  return {
    title: "Índices",
    severity: "info",
    detail: `Foram encontrados ${rows.length} índice(s) em ${objectName(input)}.`,
    payload: rows,
  };
}

async function readViews(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<InspectFinding> {
  let query = svc
    .schema("information_schema")
    .from("views")
    .select("table_schema,table_name")
    .eq("table_schema", input.target.schema)
    .limit(input.rowLimit);

  if (input.target.name) {
    query = query.eq("table_name", input.target.name);
  }

  const { data, error } = await query.order("table_name", {
    ascending: true,
  });

  if (error) {
    throw new Error(`views_failed: ${queryErrorMessage(error)}`);
  }

  const rows = limitPayload(toRows(data));

  return {
    title: "Views",
    severity: "info",
    detail: `Foram retornadas ${rows.length} view(s) para o schema ${input.target.schema}.`,
    payload: rows,
  };
}

async function readFunctions(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<InspectFinding> {
  let query = svc
    .schema("information_schema")
    .from("routines")
    .select("routine_schema,routine_name,routine_type,data_type,specific_name")
    .eq("routine_schema", input.target.schema)
    .limit(input.rowLimit);

  if (input.target.name) {
    query = query.eq("routine_name", input.target.name);
  }

  const { data, error } = await query.order("routine_name", {
    ascending: true,
  });

  if (error) {
    throw new Error(`functions_failed: ${queryErrorMessage(error)}`);
  }

  const rows = limitPayload(toRows(data));

  return {
    title: "Functions / routines",
    severity: "info",
    detail: `Foram retornadas ${rows.length} routine(s) para o schema ${input.target.schema}.`,
    payload: rows,
  };
}

async function readTriggers(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<InspectFinding> {
  let query = svc
    .schema("information_schema")
    .from("triggers")
    .select(
      "trigger_schema,trigger_name,event_object_table,event_manipulation,action_timing,action_statement"
    )
    .eq("trigger_schema", input.target.schema)
    .limit(input.rowLimit);

  if (input.target.name) {
    query = query.eq("event_object_table", input.target.name);
  }

  const { data, error } = await query.order("trigger_name", {
    ascending: true,
  });

  if (error) {
    throw new Error(`triggers_failed: ${queryErrorMessage(error)}`);
  }

  const rows = limitPayload(toRows(data));

  return {
    title: "Triggers",
    severity: "info",
    detail: `Foram retornados ${rows.length} trigger(s) para o schema ${input.target.schema}.`,
    payload: rows,
  };
}

async function readDataSample(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<InspectFinding> {
  if (!input.target.name) {
    throw new Error("data_sample_requires_target_name");
  }

  const { data, error } = await svc
    .schema(input.target.schema)
    .from(input.target.name)
    .select("*")
    .limit(input.rowLimit);

  if (error) {
    throw new Error(`data_sample_failed: ${queryErrorMessage(error)}`);
  }

  const rows = limitPayload(toRows(data));

  return {
    title: "Amostra de dados",
    severity: "info",
    detail: `Foram retornadas ${rows.length} linha(s) de amostra de ${objectName(input)}.`,
    payload: rows,
  };
}

async function readTableOverview(
  svc: SupabaseLikeClient,
  input: NormalizedInspectReadonlyInput
): Promise<InspectFinding[]> {
  const [columns, indexes, policies] = await Promise.all([
    readSchemaColumns(svc, input),
    readIndexes(svc, input),
    readRlsPolicies(svc, input),
  ]);

  return [columns, indexes, policies];
}

export async function inspectReadonly(
  input: NormalizedInspectReadonlyInput
): Promise<InspectReadonlyOutput> {
  const svc = createServiceClient();
  const inspectedObject = objectName(input);
  const requestSummary = `Inspeção read-only ${input.inspectionType} em ${inspectedObject}.`;

  try {
    let findings: InspectFinding[] = [];

    switch (input.inspectionType) {
      case "tableOverview":
        findings = await readTableOverview(svc, input);
        break;
      case "schemaColumns":
        findings = [await readSchemaColumns(svc, input)];
        break;
      case "rlsPolicies":
        findings = [await readRlsPolicies(svc, input)];
        break;
      case "indexes":
        findings = [await readIndexes(svc, input)];
        break;
      case "views":
        findings = [await readViews(svc, input)];
        break;
      case "functions":
        findings = [await readFunctions(svc, input)];
        break;
      case "triggers":
        findings = [await readTriggers(svc, input)];
        break;
      case "dataSample":
        findings = [await readDataSample(svc, input)];
        break;
      default:
        return buildBlockedOutput({
          requestSummary,
          normalizedScope: input,
          detail: `inspectionType não suportado: ${input.inspectionType}`,
        });
    }

    return {
      status: "ok",
      requestSummary,
      normalizedScope: input,
      findings,
      inspectedObjects: [inspectedObject],
      warnings: [],
      limitations: [
        "Modo somente leitura.",
        "O resultado depende da exposição dos schemas via API do Supabase.",
      ],
      nextSteps: [],
    };
  } catch (error) {
    return buildErrorOutput({
      requestSummary,
      normalizedScope: input,
      detail: queryErrorMessage(error),
    });
  }
}

import { readFileSync, existsSync, appendFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

async function callResponsesApi({ apiKey, model, tools, input }) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      tools,
      input,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI API error (${res.status}): ${body || "sem body"}`);
  }

  return res.json();
}

const MAX_QUERIES = 20;
const MAX_ROWS = 50;
const MAX_CELL_CHARS = 200;
const MAX_QUERY_OUTPUT_CHARS = 10_000;

const DENYLIST = [
  "insert",
  "update",
  "delete",
  "alter",
  "drop",
  "truncate",
  "create",
  "grant",
  "revoke",
  "comment",
  "vacuum",
  "analyze",
  "set",
  "do",
  "call",
  "execute",
  "prepare",
  "begin",
  "commit",
  "rollback",
  "copy",
];

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function stripComments(sql) {
  // Remove /* ... */ and -- ...

  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ");
}

function normalizeSql(sql) {
  return stripComments(sql).trim();
}

function enforceGuard(sqlRaw) {
  if (typeof sqlRaw !== "string") {
    throw new Error("SQL must be a string.");
  }

  const sql = normalizeSql(sqlRaw);

  if (!sql) throw new Error("SQL vazio.");

  if (sql.includes(";")) {
    throw new Error("SQL inválido: ';' não é permitido (single statement).");
  }

  if (!/^(with|select)\b/i.test(sql)) {
    throw new Error("SQL inválido: deve iniciar com WITH ou SELECT.");
  }

  for (const word of DENYLIST) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(sql)) {
      throw new Error(`SQL bloqueado: contém palavra proibida: ${word}`);
    }
  }

  if (!/\blimit\b/i.test(sql)) {
    throw new Error("SQL inválido: LIMIT é obrigatório (inclua LIMIT <= 50).");
  }

  // Se o LIMIT for um número literal, validar <= MAX_ROWS
  const m = sql.match(/\blimit\s+(\d+)\b/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > MAX_ROWS) {
      throw new Error(`SQL inválido: LIMIT ${n} > ${MAX_ROWS}.`);
    }
  }

  return sql;
}

function trunc(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function cellToString(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function summarizeRows(rows) {
  const sliced = rows.slice(0, MAX_ROWS);
  return sliced.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = trunc(cellToString(v), MAX_CELL_CHARS);
    }
    return out;
  });
}

function writeSummary(md) {
  const p = process.env.GITHUB_STEP_SUMMARY;
  if (!p) return;
  try {
    appendFileSync(p, md.endsWith("\n") ? md : md + "\n", { encoding: "utf-8" });
  } catch {
    // ignore
  }
}

function serializeQueryError(err) {
  return {
    message: err?.message || String(err),
    code: err?.code ?? null,
    severity: err?.severity ?? null,
    position: err?.position ?? null,
    routine: err?.routine ?? null,
    detail: err?.detail ?? null,
    hint: err?.hint ?? null,
    schema: err?.schema ?? null,
    table: err?.table ?? null,
    column: err?.column ?? null,
    dataType: err?.dataType ?? null,
    constraint: err?.constraint ?? null,
  };
}

function isRuntimeSqlError(err) {
  const code = err?.code;
  if (typeof code !== "string" || !/^[0-9A-Z]{5}$/.test(code)) {
    return false;
  }

  // Classes de erro do PostgreSQL ligadas a conexão/recursos/sistema são tratadas como infraestrutura.
  const infraClasses = ["08", "53", "57", "58"];
  return !infraClasses.includes(code.slice(0, 2));
}

function writeBatchOkSummary({ queryNumber, safeSql, payload, summaryOutputLimit }) {
  let summaryJson = JSON.stringify(payload, null, 2);
  summaryJson = trunc(summaryJson, summaryOutputLimit);

  writeSummary(`\n### Query ${queryNumber} — ok\n`);
  writeSummary(`\`\`\`sql\n${safeSql}\n\`\`\`\n`);
  writeSummary(`**Output (truncado)**\n`);
  writeSummary(`- status: ok`);
  writeSummary(`- rowCount: ${payload.rowCount}`);
  writeSummary(`- columns: ${payload.columns.join(", ") || "(sem colunas)"}\n`);
  writeSummary(`\`\`\`json\n${summaryJson}\n\`\`\`\n`);
}

function writeBatchErrorSummary({ queryNumber, safeSql, payload, summaryOutputLimit }) {
  let summaryJson = JSON.stringify(payload, null, 2);
  summaryJson = trunc(summaryJson, summaryOutputLimit);

  writeSummary(`\n### Query ${queryNumber} — error\n`);
  writeSummary(`\`\`\`sql\n${safeSql}\n\`\`\`\n`);
  writeSummary(`**Erro runtime SQL**\n`);
  writeSummary(`- status: error`);
  writeSummary(`- message: ${payload.error.message}`);
  writeSummary(`- code: ${payload.error.code || "(sem SQLSTATE)"}`);
  writeSummary(`- severity: ${payload.error.severity || "(sem severity)"}`);
  writeSummary(`- routine: ${payload.error.routine || "(sem routine)"}\n`);
  writeSummary(`\`\`\`json\n${summaryJson}\n\`\`\`\n`);
}

function loadBriefing() {
  const inline = (process.env.BRIEFING || "").trim();
  const path = (process.env.BRIEFING_PATH || "").trim();

  if (path) {
    if (!existsSync(path)) {
      die(`briefing_path não encontrado: ${path}`);
    }
    const file = readFileSync(path, "utf-8");
    const text = file.trim();
    if (!text) die(`briefing_path está vazio: ${path}`);
    return { briefing: text, source: `file:${path}` };
  }

  if (!inline) {
    die("BRIEFING está vazio. Preencha 'briefing' ou 'briefing_path' no Run workflow.");
  }

  return { briefing: inline, source: "input:briefing" };
}

function detectBatchMode(text) {
  return /(?:^|\n)\s*---\s*(?=\n|$)|\s+---\s+/.test(text);
}

function splitSqlBatch(text) {
  const parts = text
    .split(/(?:^|\n)\s*---\s*(?=\n|$)|\s+---\s+/g)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts;
}

async function executeSqlBatch(db, briefing) {
  const queries = splitSqlBatch(briefing);
  const summaryOutputLimit = Math.min(9_000, MAX_QUERY_OUTPUT_CHARS);

  if (queries.length > MAX_QUERIES) {
    throw new Error(`SQL batch excede max_queries (${MAX_QUERIES}).`);
  }

  const safeQueries = [];
  const guardrailErrors = [];

  for (let i = 0; i < queries.length; i++) {
    try {
      safeQueries.push(enforceGuard(queries[i]));
    } catch (err) {
      guardrailErrors.push({
        queryNumber: i + 1,
        error: err?.message || String(err),
      });
    }
  }

  if (guardrailErrors.length) {
    writeSummary(`
## Execução (SQL batch)
`);
    writeSummary(`Guardrail errors: ${guardrailErrors.length}
`);
    for (const item of guardrailErrors) {
      writeSummary(`- Query ${item.queryNumber}: ${item.error}`);
    }
    throw new Error(
      `SQL batch bloqueado por guardrail em ${guardrailErrors.length} query(s). Nenhuma query foi executada.`,
    );
  }

  const results = [];

  writeSummary(`
## Execução (SQL batch)
`);

  for (let i = 0; i < safeQueries.length; i++) {
    const queryNumber = i + 1;
    const safeSql = safeQueries[i];

    console.log(`\n--- QUERY ${queryNumber} ---`);
    console.log(safeSql);

    try {
      const res = await db.query(safeSql);
      const rows = summarizeRows(res.rows || []);
      const payload = {
        status: "ok",
        queryNumber,
        rowCount: res.rowCount ?? rows.length,
        columns: (res.fields || []).map((f) => f.name),
        rows,
      };

      writeBatchOkSummary({ queryNumber, safeSql, payload, summaryOutputLimit });

      console.log(`Status: ok`);
      console.log(`Rows (sample <= ${MAX_ROWS}): ${rows.length}`);
      console.log(trunc(JSON.stringify(payload), 2000));

      results.push({ sql: safeSql, ...payload });
    } catch (err) {
      if (!isRuntimeSqlError(err)) {
        throw err;
      }

      const payload = {
        status: "error",
        queryNumber,
        error: serializeQueryError(err),
      };

      writeBatchErrorSummary({ queryNumber, safeSql, payload, summaryOutputLimit });

      console.error(`Status: error`);
      console.error(payload.error.message);
      console.error(trunc(JSON.stringify(payload), 2000));

      results.push({ sql: safeSql, ...payload });
    }
  }

  const successCount = results.filter((item) => item.status === "ok").length;
  const runtimeErrorCount = results.filter((item) => item.status === "error").length;
  const status = runtimeErrorCount ? "completed_with_query_errors" : "completed";

  writeSummary(`
## Resumo do batch

`);
  writeSummary(`Queries totais: ${safeQueries.length}`);
  writeSummary(`Sucesso: ${successCount}`);
  writeSummary(`Erros runtime: ${runtimeErrorCount}`);
  writeSummary(`Guardrail errors: 0`);
  writeSummary(`Status: ${status}\n`);

  return {
    status,
    totalQueries: safeQueries.length,
    successCount,
    runtimeErrorCount,
    guardrailErrorCount: 0,
    results,
  };
}

async function main() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const dbUrl = process.env.SUPABASE_DB_URL_READONLY;
  const model = (process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();

  if (!openaiKey) die("Falta OPENAI_API_KEY (GitHub secret).");
  if (!dbUrl) die("Falta SUPABASE_DB_URL_READONLY (GitHub secret).");

  const { briefing, source } = loadBriefing();
  const batchMode = detectBatchMode(briefing);

  console.log("=== Supabase Inspector (read-only) ===");
  console.log(`Model: ${model}`);
  console.log(`Briefing source: ${source}`);
  console.log("Limits:");
  console.log(`- max_queries=${MAX_QUERIES}`);
  console.log(`- max_rows=${MAX_ROWS}`);
  console.log(`- max_cell_chars=${MAX_CELL_CHARS}`);
  console.log(`- max_query_output_chars=${MAX_QUERY_OUTPUT_CHARS}`);
  console.log("");

  writeSummary(`# Supabase Inspector (read-only)
`);
  writeSummary(`- Model: \`${model}\`\n- Briefing source: \`${source}\`\n- max_queries: \`${MAX_QUERIES}\`\n- max_rows: \`${MAX_ROWS}\`\n`);
  writeSummary(`\n## Briefing\n\n${trunc(briefing, 2000)}\n`);

  const db = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }, // piloto
  });
  let dbConnected = false;

  try {
    await db.connect();
    dbConnected = true;

    if (batchMode) {
      console.log("Modo SQL batch detectado.");

      const batchResult = await executeSqlBatch(db, briefing);

      console.log("\n=== RESUMO DO BATCH ===");
      console.log(`Queries totais: ${batchResult.totalQueries}`);
      console.log(`Sucesso: ${batchResult.successCount}`);
      console.log(`Erros runtime: ${batchResult.runtimeErrorCount}`);
      console.log(`Guardrail errors: ${batchResult.guardrailErrorCount}`);
      console.log(`Status: ${batchResult.status}`);

      return;
    }

    let queryCount = 0;
    const executed = [];

    async function runSqlReadonly({ sql }) {
      if (queryCount >= MAX_QUERIES) {
        throw new Error(`max_queries atingido (${MAX_QUERIES}).`);
      }

      const safeSql = enforceGuard(sql);

      queryCount += 1;
      console.log(`\n--- QUERY ${queryCount} ---`);
      console.log(safeSql);

      const res = await db.query(safeSql);
      const rows = summarizeRows(res.rows || []);
      const payload = {
        rowCount: res.rowCount ?? rows.length,
        columns: (res.fields || []).map((f) => f.name),
        rows,
      };

      let out = JSON.stringify(payload);
      out = trunc(out, MAX_QUERY_OUTPUT_CHARS);

      console.log(`Rows (sample <= ${MAX_ROWS}): ${rows.length}`);
      console.log(trunc(out, 2000));

      executed.push({ sql: safeSql, result: payload });
      return out;
    }

    const tools = [
      {
        type: "function",
        name: "run_sql_readonly",
        description:
          "Executa uma query SQL read-only (apenas WITH/SELECT com LIMIT obrigatório). Retorna JSON com colunas e amostras truncadas.",
        parameters: {
          type: "object",
          properties: {
            sql: { type: "string", description: "SQL (WITH/SELECT) com LIMIT <= 50." },
          },
          required: ["sql"],
          additionalProperties: false,
        },
        strict: true,
      },
    ];

    // Prompt inicial (regras + briefing)
    let input = [
      {
        role: "user",
        content: [
          "Você é um inspetor read-only do banco (Supabase Postgres).",
          "",
          "REGRAS OBRIGATÓRIAS:",
          "- Você só pode chamar a ferramenta run_sql_readonly.",
          "- Gere apenas SQL WITH/SELECT.",
          "- LIMIT é obrigatório (<= 50).",
          "- Nunca use ; (single statement).",
          "- Evite scans pesados; comece por discovery (information_schema) quando necessário.",
          "- O escopo do piloto é schema public (pode usar information_schema/pg_catalog para discovery).",
          "",
          "ROTEIRO INTERNO (sempre):",
          "1) O que preciso saber? (checklist curto)",
          "2) Quais tabelas/entidades suspeitas?",
          "3) Discovery de schema se necessário",
          "4) Queries nas tabelas reais",
          "5) Encerrar com achados, riscos e próximos passos (sem mudanças)",
          "",
          `BRIEFING:\n${briefing}`,
        ].join("\n"),
      },
    ];

    let response = await callResponsesApi({
      apiKey: openaiKey,
      model,
      tools,
      input,
    });

    // Loop de tool-calling
    while (true) {
      const calls = (response.output || []).filter((it) => it.type === "function_call" && it.name === "run_sql_readonly");

      // sempre anexar output no input para manter estado
      input.push(...(response.output || []));

      if (!calls.length) break;
      if (queryCount >= MAX_QUERIES) break;

      for (const call of calls) {
        if (queryCount >= MAX_QUERIES) break;

        let args = call.arguments;
        if (typeof args === "string") {
          try {
            args = JSON.parse(args);
          } catch {
            args = { sql: String(args) };
          }
        }

        let toolOut;
        try {
          toolOut = await runSqlReadonly(args);
        } catch (e) {
          toolOut = JSON.stringify({ error: e?.message || String(e) });
        }

        input.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: toolOut,
        });
      }

      response = await callResponsesApi({
        apiKey: openaiKey,
        model,
        tools,
        input,
      });
    }

    const finalText = (response.output_text || "").trim();

    console.log("\n=== RELATÓRIO FINAL ===\n");
    console.log(finalText || "(sem output_text)");

    // Job Summary (compacto)
    writeSummary(`\n## Execução\n\n- Queries executadas: \`${queryCount}\`\n`);
    writeSummary(`\n## Queries (lista)\n`);
    for (let i = 0; i < executed.length; i++) {
      const q = executed[i];
      writeSummary(`\n### Query ${i + 1}\n\n\`\`\`sql\n${trunc(q.sql, 2000)}\n\`\`\`\n`);
    }
    writeSummary(`\n## Relatório\n\n${finalText || "_(sem output)_"}\n`);

    // Se o modelo não devolveu nada, ainda assim finalizar ok
  } finally {
    if (dbConnected) {
      await db.end();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

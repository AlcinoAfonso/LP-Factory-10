# Supabase Inspect (v1) — Contrato do Pipeline

## Objetivo (v1)
Pipeline piloto **read-only** para “inspecionar” o Supabase Postgres via GitHub Actions:

- Recebe um briefing
- O modelo decide quais consultas executar
- Executa **somente SELECT/WITH** via Postgres (`pg`)
- Retorna **apenas em logs** + **Job Summary**
- Sem PR, sem artifacts, sem persistência

## Como rodar
GitHub → Actions → **Pipeline Supabase — Inspect** → Run workflow

Inputs:
- `briefing` (opcional, curto)
- `briefing_path` (opcional): caminho de um arquivo no repo com briefing longo
  - Ex: `automations/supabase-inspect/templates/briefings/exemplo.md`
- `openai_model` (opcional): default `gpt-4.1-mini`

## Secrets / Env
Obrigatórios:
- `OPENAI_API_KEY` (GitHub Actions secret)
- `SUPABASE_DB_URL_READONLY` (GitHub Actions secret)
  - Deve apontar para o role `ai_readonly` (somente leitura)
  - Recomendado usar **Session pooler** (IPv4 compatível)

Env usados pelo job:
- `BRIEFING` (de `inputs.briefing`)
- `BRIEFING_PATH` (de `inputs.briefing_path`)
- `OPENAI_MODEL` (de `inputs.openai_model`)

## Dependências (v1)
Dependências declaradas no subprojeto:
- `pg`

Integração com OpenAI é feita via API HTTP (`fetch`) usando `OPENAI_API_KEY`, sem SDK dedicado.

## Guardrails (v1)
Read-only absoluto (enforced no script):
- Proíbe `;` (single statement)
- SQL deve iniciar com `WITH` ou `SELECT`
- **LIMIT obrigatório** (e se literal, deve ser `<= 50`)
- Denylist (case-insensitive, word boundary):
  `insert, update, delete, alter, drop, truncate, create, grant, revoke, comment, vacuum, analyze, set, do, call, execute, prepare, begin, commit, rollback, copy`

Limites:
- `max_queries = 20`
- `max_rows = 50`
- Truncagem: `200 chars/célula`, `10k chars/query`

Escopo:
- Role `ai_readonly` com acesso apenas ao schema `public`
- Discovery pode usar `information_schema` / `pg_catalog`

## Saída
Nos logs do workflow:
- Plano / decisões do modelo
- Queries executadas
- Amostras e resumo dos resultados
- Conclusão / recomendações

No Job Summary:
- Lista das queries (compacta)
- Relatório final

## Modo SQL Batch (v1.1)
O pipeline aceita múltiplas queries diretamente no campo `briefing`.

Se o texto contiver o delimitador `---`, o pipeline entra em **modo SQL batch** e executa as queries em ordem.

**Delimitador suportado**

- Em linha própria

```txt
---
```

- Inline (mesma linha, com espaços ao redor)

```txt
SELECT ... LIMIT 10 --- SELECT ... LIMIT 10
```

**Regras**

- uma única statement
- sem `;`
- iniciar com `WITH` ou `SELECT`
- `LIMIT` obrigatório
- `LIMIT <= 50`

**Limites**

- máximo de 20 queries

No modo SQL batch, o pipeline pré-valida todas as queries antes de executar. Se qualquer query falhar nos guardrails, o batch inteiro é bloqueado e nenhuma query é executada. Se todas passarem nos guardrails, erros runtime SQL de uma query são registrados no relatório e não impedem a execução das próximas queries.

**Taxonomia de erros**

- Guardrail errors: bloqueiam o pipeline e retornam exit 1.
- Runtime SQL errors: são registrados por query, não interrompem o batch e retornam exit 0 com status `completed_with_query_errors`.
- Infra errors: bloqueiam o pipeline e retornam exit 1.

**Status do batch**

- `completed`: todas as queries válidas executaram sem erro runtime SQL.
- `completed_with_query_errors`: uma ou mais queries válidas falharam em runtime SQL, mas o batch continuou até o fim.

No Job Summary, o modo batch inclui:

- lista das queries executadas
- status individual por query (`ok` ou `error`)
- se `ok`: output por query com `rowCount`, `columns` e sample de `rows` (truncado)
- se `error`: mensagem, SQLSTATE e campos úteis disponíveis do erro
- resumo final com totais, sucessos, erros runtime, guardrail errors e status do batch

Exemplo de output no Job Summary (1 query):

````md
### Query 1
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 2
```

**Output (truncado)**
- rowCount: 2
- columns: table_name

```json
{ "status": "ok", "queryNumber": 1, "rowCount": 2, "columns": ["table_name"], "rows": [{ "table_name": "accounts" }, { "table_name": "profiles" }] }
```
````

**Exemplo**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
LIMIT 20
---
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
LIMIT 50
```

```txt
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 20 --- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LIMIT 50
```

## Templates
A pasta `templates/` existe como slot para:
- briefings de exemplo
- outputs esperados
- SQL samples (readonly)

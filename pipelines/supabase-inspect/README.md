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
  - Ex: `pipelines/supabase-inspect/templates/briefings/exemplo.md`
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
O workflow instala dependências apenas no runtime (piloto):
- `openai`
- `pg`

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

## Templates
A pasta `templates/` existe como slot para:
- briefings de exemplo
- outputs esperados
- SQL samples (readonly)

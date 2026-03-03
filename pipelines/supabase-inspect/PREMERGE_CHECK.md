# Pre-merge check — Supabase Inspect PR

Data: 2026-03-03

## Comandos executados

### 1) `npm run lint`
Status: **falhou**

Resumo do erro:
- O script atual é `next lint`.
- Com Next.js `16.1.1`, o comando retornou:
  - `Invalid project directory provided, no such directory: /workspace/LP-Factory-10/lint`

### 2) `npm run build`
Status: **falhou por limitação de ambiente/rede**

Resumo do erro:
- Build iniciou normalmente com `next build`.
- Falhou ao baixar fonte `Inter` do Google Fonts:
  - `Failed to fetch 'Inter' from Google Fonts`
  - URL: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`

### 3) `node --check pipelines/supabase-inspect/run.mjs`
Status: **ok**

## Validações solicitadas (sem executar Actions)

- Workflow existe no path correto:
  - `.github/workflows/pipeline-supabase-inspect.yml` ✅
- Secrets referenciados no workflow são exatamente:
  - `OPENAI_API_KEY` ✅
  - `SUPABASE_DB_URL_READONLY` ✅
- Script lê as envs:
  - `BRIEFING` ✅
  - `BRIEFING_PATH` ✅
  - `OPENAI_MODEL` ✅

## Evidências rápidas (linhas)

- Workflow (secrets/env):
  - `.github/workflows/pipeline-supabase-inspect.yml:45-49`
- Script (envs lidas):
  - `pipelines/supabase-inspect/run.mjs:131-132`
  - `pipelines/supabase-inspect/run.mjs:152-154`

# services/mcp-supabase-inspect

## Objetivo

Service dedicado para expor a **LPF Supabase Inspect MCP** como camada reutilizável de acesso read-only ao Supabase fora do runtime do Core.

Este README é o contrato técnico expandido do service.
O catálogo humano e resumido da camada fica em `docs/services.md`.

## Implementação canônica

- `services/mcp-supabase-inspect/api/mcp.js`

## Projeto / infraestrutura

- Projeto Vercel: `lpf-10-services`
- Endpoint canônico: `https://lpf-10-services.vercel.app/api/mcp`
- Runtime dedicado fora do Core SaaS
- Conexão read-only via `SUPABASE_DB_URL_READONLY`

## Autenticação

- `Authorization: Bearer <LPF_MCP_SECRET>`

## Variáveis

- `LPF_MCP_SECRET`
  - uso: autenticação Bearer da MCP
  - ambientes: Preview, Production

- `SUPABASE_DB_URL_READONLY`
  - uso: conexão read-only com o banco
  - ambientes: Preview, Production

## Tools disponíveis

- `list_tables`
- `inspect_table_bundle`
- `inspect_rls_bundle`
- `sample_rows` (parcial)

## Arquivos-base

- `services/mcp-supabase-inspect/api/mcp.js`
- `services/mcp-supabase-inspect/package.json`
- `services/mcp-supabase-inspect/package-lock.json`
- `services/mcp-supabase-inspect/vercel.json`

## Script de check

No estado atual do subprojeto:

```json
{
  "scripts": {
    "check": "node --check api/mcp.js"
  }
}
```

## Status

* implementado em serviço dedicado
* validação fim a fim depende de operação/cutover externo por ambiente

## Consumidores atuais

* `docs/automacoes.md` — `3.3 Supabase Inspect Agente`

## Pendência conhecida

### `sample_rows`

* objetivo: permitir amostragem real de linhas em modo read-only
* contexto atual: falha por permissão com RLS (`auth.uid()`)
* escopo futuro: ajustar permissões mínimas no banco, validar retorno real e manter segurança read-only
* status: pendente em caso separado

## Observações

* o Core SaaS não hospeda esta MCP
* este README não deve registrar valores secretos
* `docs/services.md` deve permanecer curto e amigável para uso humano
* detalhes técnicos adicionais deste service devem concentrar-se neste README local

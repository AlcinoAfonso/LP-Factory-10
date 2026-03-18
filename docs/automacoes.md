0.1 Cabeçalho
Data: 14/03/2026
Versão: v1.6
Status: Estrutura revisada

0.2 Função do documento
Registrar a camada de automação do LP Factory 10 como referência operacional para plataformas, integrações, automações e credenciais sem segredos.

0.3 Relação com outros documentos
docs/base-tecnica.md: regras estruturais gerais.
docs/schema.md: banco, tabelas, views, policies e functions.
docs/roadmap.md: evolução funcional.

1. Objetivo e escopo
1.1 Objetivo
Registrar plataformas, integrações e automações do projeto.
Consolidar conhecimento operacional.
Preservar decisões e aprendizados de implementação.

1.2 Inclui
Plataformas usadas na camada de automação.
Credenciais registradas sem valores secretos.
Catálogo de automações.
Checks e aprendizados operacionais relevantes.

1.3 Não inclui
Valores brutos de chaves ou tokens.
Detalhamento completo de banco fora de docs/schema.md.
Regras estruturais gerais fora de docs/base-tecnica.md.
Roadmap funcional fora de docs/roadmap.md.

1.4 Regra de segurança
Nunca registrar segredos brutos.
Registrar apenas nome da credencial, plataforma, ambiente, localização, finalidade e escopo.

1.5 Origem da informação
1.5.1 Base repositório
Arquivos versionados, workflows, scripts, pipelines, migrations e docs técnicas.

1.5.2 Observação operacional
Informações observadas em execução real ou nos painéis das plataformas.

2. Plataformas e configuração global
2.1 OpenAI

2.1.1 Papel na automação

- execução de modelos
- Agent Builder
- Agents SDK
- integração com pipelines e agentes

2.1.2 Ambientes

- `LPF10-DEV`
- `LPF10-PROD`

2.1.3 Credencial registrada

- `OPENAI_API_KEY`
  - ambiente operacional prioritário: DEV
  - armazenamento atualmente documentado: GitHub Secrets
  - uso atual documentado: automações e pipelines que chamam modelos

2.1.4 Integrações atuais

- GitHub Actions
- `openai-smoke`
- `supabase-inspect`

2.1.5 Diretrizes operacionais

- durante o desenvolvimento, usar preferencialmente o contexto e a credencial do projeto DEV
- ao analisar consumo, validar por projeto antes de concluir onde houve gasto
- preferir modelos mais baratos quando a tarefa permitir
- usar modelos mais caros ou mais recentes apenas quando houver necessidade real

2.1.6 Observações

- há registro operacional de uso de Agent Builder no projeto
- os projetos `LPF10-DEV` e `LPF10-PROD` permanecem como referência operacional
- detalhes de billing, usage e templates nativos do Builder não precisam ficar expandidos nesta seção

2.2 GitHub
2.2.1 Uso atual
Repositório principal, GitHub Actions, execução de pipelines e armazenamento de secrets.

2.2.2 Credenciais registradas
OPENAI_API_KEY
Uso: pipelines com chamadas de modelo
SUPABASE_DB_URL_READONLY
Uso: inspeção read-only

2.2.3 Integrações existentes
OpenAI:
openai-smoke
supabase-inspect
Supabase:
supabase-inspect
Documentação:
pipeline-docs-apply-report

2.2.4 Estrutura operacional
Workflows em .github/workflows.
Pipelines em pipelines/.
Workflows identificados:
.github/workflows/openai-smoke.yml
.github/workflows/pipeline-supabase-inspect.yml
.github/workflows/pipeline-docs-apply-report.yml
.github/workflows/security.yml
.github/workflows/upgrade-next-16-1-1.yml

2.3 Supabase
2.3.1 Uso atual
Banco de dados, Auth e fonte de dados para inspeções automatizadas read-only.

2.3.2 Credencial registrada
SUPABASE_DB_URL_READONLY
Armazenamento: GitHub Secrets
Finalidade: inspeção read-only no pipeline supabase-inspect
Escopo: role/usuário read-only

2.3.3 Estrutura atual
Role ai_readonly com login permitido, statement_timeout de 5s, USAGE no schema public, GRANT SELECT nas tabelas existentes em public e default privileges para novas tabelas em public.
Migration relacionada: supabase/migrations/0005__ai_readonly.sql

2.3.4 Observações
O pipeline atual executa apenas SQL read-only.
Discovery pode usar information_schema e pg_catalog.

2.4 Vercel

2.5 Resend

3. Catálogo de automações
3.1 OpenAI setup mínimo + smoke no GitHub
Data de criação: 02/03/2026
Objetivo: concluir o setup mínimo de OpenAI Projects para DEV/PROD e validar a integração OpenAI com GitHub Actions.
Como funciona hoje: workflow openai-smoke faz chamada real à OpenAI via curl; a remoção de head foi registrada para evitar falha SIGPIPE.
Arquivos / credenciais: .github/workflows/openai-smoke.yml, OPENAI_API_KEY.
Status: implementada
Observações: ponto mínimo de validação operacional entre OpenAI e GitHub.

3.2 Supabase Inspect
Data de criação: 03/03/2026
Objetivo: executar inspeções read-only no Supabase via GitHub Actions, sem mutação, com resultado em logs e Job Summary.
Como funciona hoje: aceita briefing opcional, gera plano e decisões do modelo, executa queries e devolve resumo final.
Guardrails: proíbe ;, exige SQL iniciando com WITH ou SELECT, LIMIT obrigatório e, quando literal, <= 50, além de denylist de mutações e comandos proibidos.
Limites: max_queries = 20, max_rows = 50, truncagem de 200 caracteres por célula e 10k por query.
Arquivos / credenciais: .github/workflows/pipeline-supabase-inspect.yml, pipelines/supabase-inspect/run.mjs, pipelines/supabase-inspect/README.md, pipelines/supabase-inspect/PREMERGE_CHECK.md, pipelines/supabase-inspect/templates/.gitkeep, supabase/migrations/0005__ai_readonly.sql, OPENAI_API_KEY, SUPABASE_DB_URL_READONLY.
Status: implementada
Observações: usa openai e pg, opera com a role ai_readonly no schema public, permite discovery com information_schema e pg_catalog, usa permissions: contents: read e concurrency por branch/ref.

3.3 Supabase Inspect batch SQL + relatório completo
Data de criação: 06/03/2026
Objetivo: permitir múltiplas queries SQL read-only em modo determinístico e entregar relatório completo por query no Job Summary.
Como funciona hoje: recebe múltiplas queries no briefing ou em arquivo via briefing_path, com delimitador ---, e executa em ordem.
Saída atual: summary com SQL, rowCount, colunas, sample de rows e relatório completo por query.
Arquivos / credenciais: .github/workflows/pipeline-supabase-inspect.yml, pipelines/supabase-inspect/README.md, OPENAI_API_KEY, SUPABASE_DB_URL_READONLY.
Status: implementada
Observações: o delimitador --- funciona em linha própria ou inline com espaços ao redor; as regras read-only do supabase-inspect continuam válidas.

3.4 Pipeline Docs Apply Report
Objetivo: aplicar reports JSON Actions-ready em arquivos Markdown e automatizar branch, commit e Pull Request para revisão humana.
Como funciona hoje: o workflow recebe report_path, aplica o report e registra resumo no Job Summary.
Arquivos / credenciais: .github/workflows/pipeline-docs-apply-report.yml, pipelines/docs-apply-report/run.mjs, pipelines/docs-apply-report/apply-doc-report.mjs, permissões do GitHub Actions.
Status: implementada
Observações: usa permissions de escrita em contents e pull-requests, cria PR com labels docs, automation e needs-review, suporta replace_section, insert_after_section e insert_after_heading, e falha em âncora ausente, alvo ausente, match ambíguo ou seção já existente em caso de insert.

3.5 Security Checks
Objetivo: bloquear padrões proibidos de implicit flow no client/UI e impedir uso indevido de tokens, setSession, getSessionFromUrl e verifyOtp fora dos locais permitidos.
Como funciona hoje: roda em Pull Requests para main ou macro e aprova ou falha o job no-implicit-flow.
Arquivos: .github/workflows/security.yml, app/auth/confirm/.
Status: implementada
Observações: procura ofensores em src/ e app/; app/auth/confirm/ é a exceção permitida para o handler server-side.

3.6 Upgrade Next.js to 16.1.1
Objetivo: atualizar next e eslint-config-next, manter lockfile canônico e automatizar commit/push quando houver mudança.
Como funciona hoje: workflow manual com target_branch e next_version; instala dependências, atualiza versões, roda lint não bloqueante e build bloqueante.
Arquivos: .github/workflows/upgrade-next-16-1-1.yml, package.json, package-lock.json.
Status: implementada
Observações: Node.js 22 no workflow; usa instalação reprodutível quando há package-lock.json; faz commit e push apenas se detectar mudanças.

3.7 Agente experimental de aprendizado
Status: experimental
Observações: criado para aprendizado da plataforma; não há arquivo operacional versionado identificado no repo e pode ser descontinuado após a extração do aprendizado operacional.

3.8 Supabase Inspect Agent

Objetivo

- permitir que um agente utilize a MCP **LPF Supabase Inspect MCP** para executar inspeções read-only
- evitar acesso direto ao banco

Como funciona hoje

- MCP **LPF Supabase Inspect MCP** publicada no app da LP Factory 10
- endpoint: https://lp-factory-10.vercel.app/api/mcp
- expõe tools read-only de inspeção
- Agent Builder já conectado e operacional
- resposta conversacional validada em preview
- output estruturado final ainda não consolidado

Tools

- `list_tables`
- `inspect_table_bundle`
- `inspect_rls_bundle`
- `sample_rows`

Arquivos

- `app/api/mcp/route.ts`
- `package.json`
- `package-lock.json`

Credenciais

- `LPF_MCP_SECRET`
- `SUPABASE_DB_URL_READONLY`

Infra

- `LPF_MCP_SECRET` configurada na Vercel (Preview, Production)
- `SUPABASE_DB_URL_READONLY` configurada na Vercel (Preview, Production)
- URL ativa: https://lp-factory-10.vercel.app/api/mcp

Status

- parcialmente implementado

Pendências

- output estruturado do workflow no Agent Builder
- `sample_rows` (permissão com RLS / auth.uid())

Observações

- MCP validada via console (`initialize`, `tools/list`, `list_tables`, `inspect_table_bundle`, `inspect_rls_bundle`)
- Agent Builder já utiliza a MCP com sucesso em modo conversacional

4. Aprendizados operacionais
4.1 Princípios identificados
Integração entre plataformas não garante utilidade real.
Automações devem reduzir trabalho humano.
Agentes úteis tendem a filtrar, resumir, priorizar ou alertar.

4.2 Agent Builder
Uso prático principal: aprendizado rápido e prototipação.
Ajuda a validar fluxos antes de consolidar uma automação.
Não deve ser tratado automaticamente como a camada principal.

4.3 Integração versus utilidade
Valor prático aparece quando o agente filtra informação, prioriza o que importa, resume conteúdo, reduz carga cognitiva e entrega ação útil.

4.4 MCP e conectores externos
MCP funciona como ponte entre o agente e sistemas externos.
Para Supabase, a abordagem exige implementação própria.

4.5 Critério para o primeiro agente útil
Começar por um agente com função concreta e ganho prático claro.

4.6 Supabase Inspect Agent (MCP)
Teste operacional no Agent Builder deve usar a seta de execução (não `Evaluate`).
Gargalo atual não é a MCP, e sim o encadeamento do output estruturado.

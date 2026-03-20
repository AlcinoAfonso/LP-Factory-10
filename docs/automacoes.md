0.1 Cabeçalho
Data: 18/03/2026
Versão: v1.7
Status: Estrutura ajustada para automações, agentes e MCP

0.2 Função do documento
Registrar a camada de automação do LP Factory 10 como referência operacional para plataformas, integrações, automações operacionais, componentes consumidores, infraestrutura reutilizável da camada de automações e aprendizados operacionais, sem expor segredos.

0.3 Relação com outros documentos
docs/base-tecnica.md: regras estruturais gerais, guardrails, checks e workflows técnicos de manutenção.
docs/schema.md: banco, tabelas, views, policies e functions.
docs/roadmap.md: evolução funcional.

1. Objetivo e escopo
1.1 Objetivo
Registrar plataformas, integrações, automações, agentes, workflows e MCPs do projeto.
Consolidar conhecimento operacional.
Preservar decisões e aprendizados de implementação.
Registrar governança operacional mínima dos fluxos relevantes.

1.2 Inclui
Plataformas usadas na camada de automação.
Credenciais registradas sem valores secretos.
Catálogo de automações operacionais.
Componentes consumidores e infraestrutura reutilizável da camada de automações.
Aprendizados operacionais relevantes.

1.3 Não inclui
Valores brutos de chaves ou tokens.
Detalhamento completo de banco fora de docs/schema.md.
Regras estruturais gerais, guardrails e workflows técnicos de manutenção fora de docs/base-tecnica.md.
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

- GitHub Actions (`supabase-inspect`)
- Agent Builder

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
supabase-inspect
Supabase:
supabase-inspect
Documentação:
pipeline-docs-apply-report

2.2.4 Estrutura operacional
Workflows em .github/workflows.
Pipelines em pipelines/.
Workflows identificados:
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
2.4.1 Papel na automação
Hospedagem do app e da rota MCP publicada.

2.4.2 Uso atual
Hospeda a rota MCP ativa usada pelo caso `3.3 Supabase Inspect — componente de execução (Agent Builder)` e pela infraestrutura descrita em `3.4 LPF Supabase Inspect MCP`.

2.4.3 Variáveis operacionais registradas
LPF_MCP_SECRET
SUPABASE_DB_URL_READONLY

2.4.4 Ambientes
Preview
Production

2.4.5 Observações
URL ativa documentada: https://lp-factory-10.vercel.app/api/mcp
Os valores secretos não devem ser registrados neste arquivo.

2.5 Resend
2.5.1 Papel no ecossistema
Plataforma relacionada ao ecossistema do projeto.

2.5.2 Estado atual neste documento
Não há automação operacional de Resend formalizada neste arquivo até esta versão.

2.5.3 Regra de documentação
Novos registros sobre Resend só devem entrar neste documento quando houver caso de automação formalizado.

3. Catálogo de automações
3.1 Supabase Inspect
Data de criação: 03/03/2026
Objetivo: executar inspeções read-only no Supabase via GitHub Actions, sem mutação, com resultado em logs e Job Summary, incluindo execução determinística de múltiplas queries e relatório completo por query.
Como funciona hoje: aceita briefing opcional ou arquivo via briefing_path, gera plano e decisões do modelo, recebe uma ou múltiplas queries SQL read-only e executa em ordem.
Guardrails: proíbe ;, exige SQL iniciando com WITH ou SELECT, LIMIT obrigatório e, quando literal, <= 50, além de denylist de mutações e comandos proibidos.
Limites: max_queries = 20, max_rows = 50, truncagem de 200 caracteres por célula e 10k por query.
Saída atual: summary com SQL, rowCount, colunas, sample de rows e relatório completo por query.
Arquivos / credenciais: .github/workflows/pipeline-supabase-inspect.yml, pipelines/supabase-inspect/run.mjs, pipelines/supabase-inspect/README.md, pipelines/supabase-inspect/PREMERGE_CHECK.md, pipelines/supabase-inspect/templates/.gitkeep, supabase/migrations/0005__ai_readonly.sql, OPENAI_API_KEY, SUPABASE_DB_URL_READONLY.
Status: implementada
Observações: usa openai e pg, opera com a role ai_readonly no schema public, permite discovery com information_schema e pg_catalog, usa permissions: contents: read e concurrency por branch/ref.

3.1.1 Evolução registrada em 06/03/2026 — batch SQL + relatório completo
Objetivo: permitir múltiplas queries SQL read-only em modo determinístico e entregar relatório completo por query no Job Summary.
Como funciona hoje: recebe múltiplas queries no briefing ou em arquivo via briefing_path, com delimitador ---, e executa em ordem.
Observações: o delimitador --- funciona em linha própria ou inline com espaços ao redor; as regras read-only do supabase-inspect continuam válidas.

3.2 Pipeline Docs Apply Report
Objetivo: aplicar reports JSON Actions-ready em arquivos Markdown e automatizar branch, commit e Pull Request para revisão humana.
Como funciona hoje: o workflow recebe report_path, aplica o report e registra resumo no Job Summary.
Arquivos / credenciais: .github/workflows/pipeline-docs-apply-report.yml, pipelines/docs-apply-report/run.mjs, pipelines/docs-apply-report/apply-doc-report.mjs, permissões do GitHub Actions.
Status: implementada
Observações: usa permissions de escrita em contents e pull-requests, cria PR com labels docs, automation e needs-review, suporta replace_section, insert_after_section e insert_after_heading, e falha em âncora ausente, alvo ausente, match ambíguo ou seção já existente em caso de insert.

3.3 Supabase Inspect — componente de execução (Agent Builder)

Objetivo

- executar inspeções read-only por meio da MCP `3.4 LPF Supabase Inspect MCP`
- atuar como caso de uso operacional da infraestrutura MCP
- evitar acesso direto ao banco

Como funciona hoje

- fluxo implementado no Agent Builder consumindo a MCP `3.4 LPF Supabase Inspect MCP`
- resposta conversacional validada em preview
- output estruturado final ainda não consolidado

Dependência central

- `3.4 LPF Supabase Inspect MCP`

Entradas esperadas

- solicitação de inspeção read-only feita pelo usuário
- contexto suficiente para decidir qual tool usar
- sem acesso direto a credenciais ou banco fora da MCP

Saídas esperadas

- resposta final ao usuário
- evidências usadas na resposta
- tools acionadas no fluxo
- limitações, observações ou restrições relevantes

Status

- parcialmente implementado

Pendências

- consolidar o output estruturado do workflow no Agent Builder
- resolver `sample_rows` (permissão com RLS / `auth.uid()`)

Observações

- este item descreve um componente consumidor / caso de uso operacional do MCP
- endpoint, autenticação, tools, arquivos base e variáveis da infraestrutura estão documentados em `3.4`
- o gargalo atual está no encadeamento do output do workflow, não na existência da MCP

3.4 LPF Supabase Inspect MCP

Objetivo

- fornecer camada universal de acesso read-only ao Supabase via MCP
- permitir reutilização por múltiplos agentes, workflows e componentes consumidores

Implementação

- endpoint: https://lp-factory-10.vercel.app/api/mcp
- autenticação via `LPF_MCP_SECRET` (Bearer token)
- conexão via `SUPABASE_DB_URL_READONLY`
- hospedado na Vercel
- validado via testes manuais e Agent Builder

Tools

- `list_tables`
- `inspect_table_bundle`
- `inspect_rls_bundle`
- `sample_rows` (parcial)

Arquivos

- `app/api/mcp/route.ts`
- `package.json`
- `package-lock.json`

Variáveis (Vercel)

- `LPF_MCP_SECRET` (Preview, Production)
- `SUPABASE_DB_URL_READONLY` (Preview, Production)

Status

- implementado e validado (com pendência isolada)

Observações

- camada independente e universal da arquitetura de automações
- o item `3.3` é apenas um consumidor atual dessa infraestrutura
- MCP reutilizável por múltiplos agentes, workflows e componentes consumidores
- acesso protegido por token
- `LPF_MCP_SECRET` não deve ter valor documentado neste arquivo

3.4.1 Caso de uso — habilitar `sample_rows`

Objetivo

- permitir amostragem real de linhas em modo read-only

Contexto

- falha por permissão com RLS (`auth.uid()`)

Escopo

- ajustar permissões mínimas no banco
- validar retorno real
- manter segurança read-only

Observações

- esta pendência não invalida a MCP como camada reutilizável
- bloqueia apenas a completude funcional da tool `sample_rows`

Status

- pendente em caso separado

4. Aprendizados operacionais
4.1 Princípios identificados
Integração entre plataformas não garante utilidade real.
Automações devem reduzir trabalho humano.
Agentes úteis tendem a filtrar, resumir, priorizar ou alertar.

4.2 Agent Builder
Uso prático principal: aprendizado, prototipação e validação operacional de fluxos.
Também pode servir como camada de workflow operacional versionado quando o caso justificar.
Ajuda a validar fluxos antes de consolidar uma automação.
Não deve ser tratado automaticamente como a camada principal de toda automação.
Exige atenção ao contrato de entrada e saída do workflow.

4.3 Integração versus utilidade
Valor prático aparece quando o agente filtra informação, prioriza o que importa, resume conteúdo, reduz carga cognitiva e entrega ação útil.

4.4 MCP e conectores externos
MCP funciona como ponte entre o agente e sistemas externos.
Para Supabase, a abordagem exige implementação própria.

4.5 Critério para o primeiro agente útil
Começar por um agente com função concreta e ganho prático claro.

4.6 Operação prática no Agent Builder
- teste operacional no Agent Builder deve usar a seta de execução (não `Evaluate`)
- `Evaluate` não substitui o teste operacional do fluxo
- no caso `3.3`, o gargalo atual é o contrato e o encadeamento do output do workflow, não a existência da MCP
- validação madura deve considerar também traces, critérios de avaliação e regressão quando o caso sair da fase experimental

4.7 Experimento reclassificado como aprendizado
Item de origem: antigo `3.7 Agente experimental de aprendizado`.
Leitura correta: experimento criado para aprendizado da plataforma, sem ativo operacional versionado relevante no repositório.
Destino documental: manter apenas como aprendizado / histórico operacional.
Observação: pode ser descontinuado após a extração do aprendizado útil.

4.8 MCP e segurança operacional
MCP não deve receber confiança automática só por ser servidor conhecido.
O risco de prompt injection continua existindo.
O acesso deve permanecer minimizado.
Dados sensíveis não devem ser expandidos no contrato nem nas tools além do necessário.
Parâmetros e escopo expostos devem ser revisados conforme o caso evoluir.

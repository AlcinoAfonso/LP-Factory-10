# 0. Cabeçalho

- **Data:** 14/03/2026
- **Versão:** v1.6
- **Status:** Estrutura revisada

## 0.1 Função do documento

Registrar a camada de automação do LP Factory 10 como referência operacional para integrações, pipelines, agentes e credenciais sem segredos.

## 0.2 Relação com outros documentos

- `docs/base-tecnica.md`: regras estruturais gerais.
- `docs/schema.md`: banco, tabelas, views, policies e functions.
- `docs/roadmap.md`: evolução funcional do produto.

# 1. Objetivo e escopo

## 1.1 Objetivo

- Registrar plataformas, integrações e automações do projeto.
- Consolidar conhecimento operacional.
- Preservar decisões e aprendizados de implementação.

## 1.2 Inclui

- Plataformas usadas na camada de automação.
- Credenciais registradas sem valores secretos.
- Catálogo de automações.
- Checks e aprendizados operacionais relevantes.

## 1.3 Não inclui

- Valores brutos de chaves ou tokens.
- Detalhamento completo de banco fora de `docs/schema.md`.
- Regras estruturais gerais fora de `docs/base-tecnica.md`.
- Roadmap funcional fora de `docs/roadmap.md`.

## 1.4 Regra de segurança

Nunca registrar segredos brutos. Registrar apenas nome da credencial, plataforma, ambiente, localização, finalidade e escopo.

## 1.5 Origem da informação

- **Base repositório:** arquivos versionados, workflows, scripts, pipelines, migrations e docs técnicas.
- **Observação operacional:** informações observadas em execução real ou nos painéis das plataformas.

# 2. Plataformas e configuração global

## 2.1 OpenAI

- **Papel:** Agent Builder, Agents SDK, Functions, MCP e execução de modelos.
- **Ambientes:** `LPF10-DEV` e `LPF10-PROD`.
- **Credenciais registradas:**
  - `OPENAI_API_KEY`.
  - Armazenamento: GitHub Secrets.
  - Uso atual: automações e pipelines que chamam modelos.
  - Key observada: `lpf10-dev-sdk`, projeto `LPF10-DEV`, ativa, último uso observado em 06/03/2026.
- **Integrações existentes:** GitHub Actions via `openai-smoke` e `supabase-inspect`.
- **Governança mínima registrada:**
  - Sharing habilitado apenas para projetos selecionados, com `LPF10-DEV` selecionado.
  - Service Account criada em `LPF10-DEV`.
  - Manter apenas keys necessárias ativas e revogar keys expostas ou indevidas.
  - Estado final reportado no setup mínimo: 1 key ativa em `LPF10-DEV`.
- **Monitoramento operacional observado:**
  - Credit grant: US$ 10,00.
  - Saldo: US$ 9,94.
  - Consumo acumulado: US$ 0,06.
  - Recebimento: 31/01/2026.
  - Expiração: 28/02/2027.
  - Budget: US$ 10 com alertas em 80% e 100%.
  - Auto recharge desligado.
  - Forma de pagamento cadastrada.
- **Diretrizes:**
  - Usar a key do contexto operacional correto e validar consumo no Usage por projeto quando houver dúvida.
  - Preferir modelos mais baratos quando a tarefa permitir.
  - Tratar Builder como prototipação/aprendizado e SDK/backend como direção principal para operação.
- **Capacidades relevantes:** contexto grande conforme o modelo, chamada de tools externas e execução iterativa em alguns modelos.
- **Observações:** Agent Builder oferece templates nativos como Data enrichment, Planning helper, Customer service, Structured Data Q/A, Document comparison e Internal knowledge assistant.

## 2.2 GitHub

- **Papel:** repositório principal, GitHub Actions, execução de pipelines e armazenamento de secrets.
- **Credenciais registradas:**
  - `OPENAI_API_KEY` para pipelines com chamadas de modelo.
  - `SUPABASE_DB_URL_READONLY` para inspeção read-only.
- **Integrações existentes:**
  - OpenAI: `openai-smoke` e `supabase-inspect`.
  - Supabase: `supabase-inspect`.
  - Documentação: `pipeline-docs-apply-report`.
- **Estrutura operacional:** workflows em `.github/workflows` e pipelines em `pipelines/`.
- **Workflows identificados:**
  - `.github/workflows/openai-smoke.yml`
  - `.github/workflows/pipeline-supabase-inspect.yml`
  - `.github/workflows/pipeline-docs-apply-report.yml`
  - `.github/workflows/security.yml`
  - `.github/workflows/upgrade-next-16-1-1.yml`

## 2.3 Supabase

- **Papel:** banco de dados, Auth, fonte de dados para inspeções automatizadas e base para roles/grants read-only.
- **Credencial registrada:**
  - `SUPABASE_DB_URL_READONLY`.
  - Armazenamento: GitHub Secrets.
  - Finalidade: inspeção read-only no pipeline `supabase-inspect`.
  - Escopo: role/usuário read-only.
- **Estrutura atual:**
  - Role `ai_readonly` com login permitido, `statement_timeout` de 5s, `USAGE` no schema `public`, `GRANT SELECT` nas tabelas existentes e default privileges para novas tabelas em `public`.
  - Migration relacionada: `supabase/migrations/0005__ai_readonly.sql`.
- **Observações:** pipeline atual executa apenas SQL read-only e pode usar `information_schema` e `pg_catalog` para discovery.

## 2.4 Vercel

- **Papel:** deploy do sistema, integração com GitHub e observabilidade.
- **Observações:** build validado externamente via CI/Vercel; roadmap registra uso do Vercel AI Gateway para integrações IA.

## 2.5 Resend

- **Papel:** suporte ao e-mail transacional do Supabase Auth.
- **Situação atual:** domínio validado e integração SMTP com Supabase Auth ativa.

# 3. Catálogo de automações

## 3.1 OpenAI setup mínimo + smoke no GitHub

- **Data de criação:** 02/03/2026.
- **Objetivo:** concluir o setup mínimo de OpenAI Projects para DEV/PROD e validar a integração OpenAI ↔ GitHub Actions.
- **Implementação:** workflow `openai-smoke` com chamada real à OpenAI via `curl`; remoção de `head` registrada para evitar falha `SIGPIPE`.
- **Arquivos / credenciais:** `.github/workflows/openai-smoke.yml`, `OPENAI_API_KEY`.
- **Status:** implementada.
- **Observações:** representa o ponto mínimo de validação operacional entre OpenAI e GitHub.

## 3.2 Supabase Inspect

- **Data de criação:** 03/03/2026.
- **Objetivo:** executar inspeções read-only no Supabase via GitHub Actions, sem mutação, com resultado em logs e Job Summary.
- **Funcionamento:** aceita briefing opcional, gera plano e decisões do modelo, executa queries e devolve resumo final.
- **Guardrails:**
  - proíbe `;`
  - SQL deve iniciar com `WITH` ou `SELECT`
  - `LIMIT` obrigatório e, quando literal, `<= 50`
  - denylist de mutações e comandos proibidos
- **Limites:** `max_queries = 20`, `max_rows = 50`, truncagem de 200 caracteres por célula e 10k por query.
- **Arquivos / credenciais:** `.github/workflows/pipeline-supabase-inspect.yml`, `pipelines/supabase-inspect/run.mjs`, `pipelines/supabase-inspect/README.md`, `pipelines/supabase-inspect/PREMERGE_CHECK.md`, `pipelines/supabase-inspect/templates/.gitkeep`, `supabase/migrations/0005__ai_readonly.sql`, `OPENAI_API_KEY`, `SUPABASE_DB_URL_READONLY`.
- **Status:** implementada.
- **Observações:** usa dependências `openai` e `pg`, opera com a role `ai_readonly` no schema `public`, permite discovery com `information_schema` e `pg_catalog`, usa `permissions: contents: read` e concurrency por branch/ref.

## 3.3 Supabase Inspect batch SQL + relatório completo

- **Data de criação:** 06/03/2026.
- **Objetivo:** permitir múltiplas queries SQL read-only em modo determinístico e entregar relatório completo por query no Job Summary.
- **Funcionamento:** recebe múltiplas queries no briefing ou em arquivo via `briefing_path`, com delimitador `---`, e executa em ordem.
- **Saída:** summary com SQL, `rowCount`, colunas, sample de rows e relatório completo por query.
- **Arquivos / credenciais:** `.github/workflows/pipeline-supabase-inspect.yml`, `pipelines/supabase-inspect/README.md`, `OPENAI_API_KEY`, `SUPABASE_DB_URL_READONLY`.
- **Status:** implementada.
- **Observações:** o delimitador `---` funciona em linha própria ou inline com espaços ao redor; as regras read-only do `supabase-inspect` continuam válidas.

## 3.4 Pipeline Docs Apply Report

- **Data de criação:** não explicitada no conteúdo inspecionado do zip 64.
- **Objetivo:** aplicar reports JSON Actions-ready em arquivos Markdown e automatizar branch, commit e Pull Request para revisão humana.
- **Funcionamento:** workflow recebe `report_path`, aplica o report e registra resumo no Job Summary.
- **Arquivos / credenciais:** `.github/workflows/pipeline-docs-apply-report.yml`, `pipelines/docs-apply-report/run.mjs`, `pipelines/docs-apply-report/apply-doc-report.mjs`, permissões do GitHub Actions.
- **Status:** implementada.
- **Observações:**
  - usa `permissions: contents: write` e `pull-requests: write`
  - cria PR com labels `docs`, `automation` e `needs-review`
  - suporta `replace_section`, `insert_after_section` e `insert_after_heading`
  - aplica fail-fast e falha em âncora ausente, alvo ausente, match ambíguo ou seção já existente em caso de insert

## 3.5 Security Checks

- **Data de criação:** não explicitada no conteúdo inspecionado do zip 64.
- **Objetivo:** bloquear padrões proibidos de implicit flow no client/UI e impedir uso indevido de tokens, `setSession`, `getSessionFromUrl` e `verifyOtp` fora dos locais permitidos.
- **Funcionamento:** roda em Pull Requests para `main` ou `macro` e aprova ou falha o job `no-implicit-flow`.
- **Arquivos:** `.github/workflows/security.yml`, `app/auth/confirm/`.
- **Status:** implementada.
- **Observações:** procura ofensores em `src/` e `app/`; `app/auth/confirm/` é a exceção permitida para o handler server-side.

## 3.6 Upgrade Next.js to 16.1.1

- **Data de criação:** não explicitada no conteúdo inspecionado do zip 64.
- **Objetivo:** atualizar `next` e `eslint-config-next`, manter lockfile canônico e automatizar commit/push quando houver mudança.
- **Funcionamento:** workflow manual com `target_branch` e `next_version`; instala dependências, atualiza versões, roda lint não bloqueante e build bloqueante.
- **Arquivos:** `.github/workflows/upgrade-next-16-1-1.yml`, `package.json`, `package-lock.json`.
- **Status:** implementada.
- **Observações:** Node.js 22 no workflow; usa instalação reprodutível quando há `package-lock.json`; faz commit e push apenas se detectar mudanças.

## 3.7 Agente experimental de aprendizado

- **Data de criação:** 2026.
- **Objetivo:** explorar integração com ferramentas externas e fluxo de aprovação de tools como laboratório de aprendizado no Agent Builder.
- **Arquivos / credenciais:** sem arquivo operacional versionado identificado; referência complementar em `docs/auto-agentes-up.md`; credenciais variam conforme a tool integrada.
- **Status:** experimental.
- **Observações:** criado para aprendizado da plataforma e pode ser descontinuado após a extração do aprendizado operacional.

## 3.8 Supabase Inspect Agent

- **Status:** em implementação.
- **Observações:** base oficial criada no Agent Builder, com workflow, Node Agent, nome e instruções definidos; publicado como `Supabase Inspect Agent`, status observado `Live`, Workflow ID `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7` e URL registrada no Builder.

# 4. Aprendizados operacionais

## 4.1 Princípios identificados

- Integração entre plataformas não garante utilidade real.
- Automações devem reduzir trabalho humano.
- Agentes úteis tendem a filtrar, resumir, priorizar ou alertar.

## 4.2 Agent Builder

- Verificar templates antes de criar agentes do zero.
- O Builder é adequado para aprendizado, prototipação, validação de fluxos e testes de integração.
- Não deve ser assumido automaticamente como a melhor camada para a automação principal.

## 4.3 Integração versus utilidade

Valor prático aparece quando o agente filtra informação, prioriza o que importa, resume conteúdo, reduz carga cognitiva e entrega ação útil.

## 4.4 MCP e conectores externos

MCP ajuda a validar conexão entre plataformas, mas pode introduzir atritos de autenticação, permissões, tokens temporários e UX. Para o núcleo do LP Factory, Functions e Agent SDK tendem a ser caminhos mais sólidos.

## 4.5 Critério para o primeiro agente útil

O primeiro agente útil deve ter função concreta e ganho prático claro.

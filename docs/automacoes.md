0.1 Cabeçalho
Data: 18/03/2026
Versão: v1.7
Status: Estrutura ajustada para automações, agentes e MCP

0.2 Função do documento
Registrar a camada de automações operacionais do LP Factory 10 como referência operacional para plataformas usadas nessa camada, integrações, automações operacionais, componentes consumidores e aprendizados operacionais, sem expor segredos.

0.3 Relação com outros documentos
docs/services.md: services implantáveis, MCPs, endpoints e infraestrutura reutilizável com identidade própria.
docs/base-tecnica.md: regras estruturais gerais, guardrails, checks e workflows técnicos de manutenção.
docs/schema.md: banco, tabelas, views, policies e functions.
docs/roadmap.md: evolução funcional.

0.4 Atualização estrutural — 26/03/2026
- `automations/` passa a ser a raiz canônica para novas automações.
- `.github/workflows/` permanece como camada de entrada/orquestração.
- `pipelines/` permanece como estrutura em revisão/migração, sem migração ampla neste marco inicial.
- Novas automações canônicas devem nascer como subprojetos isolados em `automations/<nome>/`.

0.5 Status de migração estrutural — 26/03/2026
- `validador-final` migrado para `automations/validador-final/` e workflow legado removido.
- `supabase-inspect` migrado para `automations/supabase-inspect/` com execução a partir da nova raiz canônica e sem fallback `npm install --no-save` no workflow.
- `docs-apply-report` migrado para `automations/docs-apply-report/` com execução a partir da nova raiz canônica.
- `pipelines/validador-final/`, `pipelines/supabase-inspect/` e `pipelines/docs-apply-report/` deixaram de ser paths oficiais.

1. Objetivo e escopo
1.1 Objetivo
Registrar plataformas usadas na camada de automação, integrações, automações operacionais, agentes e workflows consumidores do projeto.
Consolidar conhecimento operacional.
Preservar decisões e aprendizados de implementação.
Registrar governança operacional mínima dos fluxos relevantes.

1.2 Inclui
Plataformas usadas na camada de automação.
Credenciais registradas sem valores secretos.
Catálogo de automações operacionais.
Componentes consumidores da camada de automações.
Aprendizados operacionais relevantes.

1.3 Não inclui
Valores brutos de chaves ou tokens.
Detalhamento completo de banco fora de docs/schema.md.
Services implantáveis, MCPs, endpoints e infraestrutura reutilizável fora de docs/services.md.
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
  - vínculo operacional por projeto:
    - `LPF10-DEV` → `key_Vt1m7APFfxGpfeHU`
    - `LPF10-PROD` → `key_OZ1nUMe8O75FGBaM`

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

2.1.7 Projeto, consumo e tokens bonificados

- consumo OpenAI deve ser analisado por projeto
- `LPF10-DEV` e `LPF10-PROD` permanecem como referências operacionais de ambiente e consumo
- API keys e service accounts da OpenAI são vinculados ao projeto em que foram criados
- o ambiente operacional prioritário para desenvolvimento permanece DEV
- o projeto DEV possui bonificação ativa de `complimentary daily tokens` para compartilhamento elegível
- o projeto DEV possui `complimentary weekly evals` como benefício separado
- a bonificação de tokens é diária e não acumulada
- `gpt-4.1` permanece no grupo operacional de até 250k tokens/dia dentro da bonificação elegível
- cobertura de `tool use` deve ser tratada com cautela e validada conforme a política vigente da OpenAI

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
Automações canônicas em automations/.
Workflows identificados:
.github/workflows/pipeline-supabase-inspect.yml
.github/workflows/pipeline-docs-apply-report.yml
.github/workflows/automation-validador-final.yml
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
Hospedagem do app principal e de serviços dedicados.

2.4.2 Uso atual
Projeto `lp-factory-10` hospeda o Core SaaS.
Projeto `lpf-10-services` hospeda services dedicados da camada `services`, incluindo a MCP documentada em `docs/services.md`.

2.4.3 Variáveis operacionais registradas
Variáveis específicas de services dedicados não devem ser expandidas nesta seção.
Consultar `docs/services.md` e o README local de cada service quando houver necessidade.

2.4.4 Ambientes
Preview
Production

2.4.5 Observações
Endpoint canônico MCP: https://lpf-10-services.vercel.app/api/mcp
Os valores secretos não devem ser registrados neste arquivo.
Detalhes de services dedicados devem ser consultados em `docs/services.md` e no README local de cada service.

2.5 Resend
2.5.1 Papel no ecossistema
Plataforma relacionada ao ecossistema do projeto.

2.5.2 Estado atual neste documento
Não há automação operacional de Resend formalizada neste arquivo até esta versão.

2.5.3 Regra de documentação
Novos registros sobre Resend só devem entrar neste documento quando houver caso de automação formalizado.

3. Catálogo de automações operacionais

3.1 Supabase Inspect Actions
Objetivo:
Executar inspeções read-only no Supabase via GitHub Actions, sem mutação, com resultado em logs e Job Summary.

Status:
Implementada

Acesso:
GitHub → Actions → workflow `pipeline-supabase-inspect`

Como usar:
Executar o workflow informando `briefing_path` ou inputs manuais

Resposta esperada:
Job Summary com SQL executado, rowCount, colunas e sample de dados

Referências / dependências:
README local: `automations/supabase-inspect/README.md`
Workflow: `.github/workflows/pipeline-supabase-inspect.yml`
Runtime: `automations/supabase-inspect/`
Referência estrutural: `docs/base-tecnica.md`

3.2 Pipeline Docs Apply Report
Objetivo:
Aplicar reports JSON em documentos Markdown e automatizar branch, commit e Pull Request para revisão humana.

Status:
Implementada

Acesso:
GitHub → Actions → workflow `pipeline-docs-apply-report`

Como usar:
Executar o workflow informando `report_path`

Resposta esperada:
Alteração documental aplicada em branch própria com Pull Request para revisão humana

Referências / dependências:
README local: `automations/docs-apply-report/README.md`
Workflow: `.github/workflows/pipeline-docs-apply-report.yml`
Runtime: `automations/docs-apply-report/`

3.3 Supabase Inspect Agente
Objetivo:
Validar o uso operacional do Supabase Inspect no Agent Builder por meio da MCP base documentada em `docs/services.md`, sem acesso direto ao banco.

Status:
Concluído como validação funcional em Agent Builder

Acesso:
Agent Builder (OpenAI)

Onde acessar:
URL do Builder: https://platform.openai.com/agent-builder/edit?workflow=wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7&version=3

Como usar:
Executar perguntas técnicas ou SQL dentro do escopo read-only validado

Resposta esperada:
Resposta assistida para validação funcional (não usar como camada final de orquestração robusta)

Referências / dependências:
docs/services.md — `1.1 LPF Supabase Inspect MCP`
services/mcp-supabase-inspect/README.md
Workflow ID: `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7`
Endpoint MCP: `https://lpf-10-services.vercel.app/api/mcp`

3.3.1 Update — Agents SDK
Status:
Planejado

Objetivo:
Migrar a validação do Builder para execução programática mais controlada

3.3.2 Update — ChatGPT + MCP
Status:
Bloqueado

Motivo:
Incompatibilidade de autenticação no contrato atual da MCP

Referências / dependências:
docs/services.md — `1.1 LPF Supabase Inspect MCP`
services/mcp-supabase-inspect/README.md

3.4 Validador Final
Objetivo:
Validar fluxos reais do app por meio de navegação executada pelo workflow.

Status:
Implementada

Acesso:
GitHub → Actions → workflow `automation-validador-final`

Como usar:
Executar o workflow informando `app_url`, `login_email`, `login_password` e, quando aplicável, `briefing_path`

Resposta esperada:
Validação do fluxo com status final `passed` ou `failed`, screenshot final e resumo no workflow

Referências / dependências:
README local: `automations/validador-final/README.md`
Workflow: `.github/workflows/automation-validador-final.yml`
Runtime: `automations/validador-final/`

4. Aprendizados operacionais
4.1 Princípios identificados
Integração entre plataformas não garante utilidade real.
Automações devem reduzir trabalho humano.
Agentes úteis tendem a filtrar, resumir, priorizar ou alertar.

4.2 Agent Builder
Uso prático principal: validação funcional e prototipação operacional de fluxos.
Para MVP e prova funcional, o Builder atende.
Não deve ser tratado como camada final mais confiável para orquestração robusta, parsing determinístico, múltiplos SQLs no mesmo input e contrato final de saída estável.
Builder e SDK não são dois agentes diferentes: o Builder é a camada visual; o SDK é a camada programática para execução, controle e orquestração fora da UI.
O código exibido em Code → Agents SDK é exportação do workflow, não um arquivo vivo editável dentro do Builder.

4.3 Integração versus utilidade
Valor prático aparece quando o agente filtra informação, prioriza o que importa, resume conteúdo, reduz carga cognitiva e entrega ação útil.

4.4 MCP e conectores externos

MCP funciona como ponte entre o agente e sistemas externos.
Para Supabase, a abordagem exige implementação própria.
Na operação via ChatGPT, a compatibilidade de autenticação do app MCP deve ser validada antes de assumir reuso direto de um MCP já existente.
Bearer token estático no endpoint MCP não deve ser presumido como compatível com a camada de consumo do ChatGPT.

4.5 Critério para o primeiro agente útil
Começar por um agente com função concreta e ganho prático claro.

4.6 Operação prática no Agent Builder
- o caminho correto de teste operacional foi Preview, com apoio dos logs e das tool calls
- teste operacional no Agent Builder deve usar a seta de execução, não `Evaluate`
- `Evaluate` não substitui o teste operacional do fluxo
- no caso `3.3`, o gargalo atual está na confiabilidade da camada final de orquestração, especialmente no encadeamento do output do workflow e no comportamento do End node
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

4.9 Consumo, projeto e bonificação

Consumo OpenAI deve ser lido por projeto no Usage.
API keys e service accounts pertencem ao projeto OpenAI em que foram criados.
Agent Builder, ChatKit e Agents SDK consomem no projeto OpenAI em que a execução está vinculada.
MCP atua como ponte para sistemas externos e não define projeto, billing ou bonificação OpenAI.
Bonificação elegível deve ser interpretada como cota diária e não como saldo acumulado.
Weekly evals e complimentary daily tokens são benefícios distintos.

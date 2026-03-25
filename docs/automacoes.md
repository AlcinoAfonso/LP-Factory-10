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

- validar o uso operacional do Supabase Inspect no Agent Builder por meio da MCP `3.4 LPF Supabase Inspect MCP`
- atuar como prova funcional de inspeção read-only no Builder
- evitar acesso direto ao banco

Implementação validada

- MCP remota conectada e uso validado de tools read-only relevantes
- prompt refinado para reduzir ambiguidade, limitar tools inadequadas e melhorar respostas curtas
- suporte melhor a inputs técnicos, inclusive SQL
- saída estruturada mantida para maior consistência do retorno

Testes executados

- perguntas textuais simples sobre schema e tabelas
- perguntas técnicas curtas sobre colunas e compatibilidade
- análise de um único bloco SQL
- teste com input técnico mais rico, inclusive SQL colado no prompt

Limite identificado

- o Builder não se mostrou confiável como camada final de orquestração mais robusta para múltiplos SQLs no mesmo input, parsing determinístico, separação mais rígida de subtarefas e contrato final de saída estável
- houve casos em que o Agent node gerou resposta útil, mas o End node não refletiu corretamente esse conteúdo no fim do workflow

Dependência central

- `3.4 LPF Supabase Inspect MCP`

Status

- concluído como validação funcional em Agent Builder

Observações

- este item deve ser tratado como prova funcional de uso do Supabase Inspect Agent no Agent Builder, e não como entrega final de orquestração robusta
- o próximo passo natural para execução mais controlada e integrável em fluxo maior é o Agents SDK
- o consumo OpenAI deste componente pertence ao projeto OpenAI em que o workflow/agente está publicado e executado
- a MCP não define o projeto OpenAI de consumo
- Supabase, GitHub e repositório não definem a cobrança OpenAI deste componente

3.3.1 Update — Agents SDK

Objetivo

- transformar o caso validado no Builder em uma versão pronta para uso dentro de um fluxo maior, com orquestrador e contrato de saída confiável

Escopo

- migrar do nível de validação visual no Builder para execução programática via Agents SDK

O que deverá ser implementado

- exportar o workflow para código SDK
- criar a versão controlada do workflow no projeto
- ajustar o retorno final do `runWorkflow`
- garantir que o output final seja devolvido corretamente para o orquestrador
- tratar adequadamente casos com múltiplos blocos SQL no mesmo input

Contrato de saída esperado

- entrada: texto bruto do usuário
- saída: objeto final pronto para o próximo agente/orquestrador

Critério de conclusão

- o workflow exportado está rodando fora da UI
- o retorno final está correto e estável
- o agente pode ser chamado por um orquestrador sem dependência manual do Builder
- existe teste com bloco único contendo múltiplos SQLs e comportamento previsível

3.3.2 Update — ChatGPT + MCP (bloqueado por incompatibilidade de autenticação)

Objetivo

- permitir operação assistida de inspeção read-only diretamente no ChatGPT, reutilizando a MCP `3.4 LPF Supabase Inspect MCP`

Escopo pretendido

- receber a solicitação do usuário no chat
- estruturar o briefing de investigação
- encaminhar a execução para a MCP já existente
- devolver o resultado ao chat sem acesso direto ao banco fora da MCP

Bloqueio identificado

- a implementação atual de `app/api/mcp/route.ts` exige `Authorization: Bearer <LPF_MCP_SECRET>` no endpoint MCP
- o caso foi definido para reutilizar o mesmo MCP de `3.4` sem mudança de autenticação
- no estado atual da validação operacional, o consumo via app MCP no ChatGPT não foi comprovado como compatível com esse contrato de Bearer estático

Conclusão operacional

- o caso não pode ser considerado implementável nem validado no estado atual sem reabrir o escopo
- qualquer viabilização futura dependeria de mudança explícita de contrato de autenticação ou adaptação autorizada da integração
- como isso contraria a regra original do caso, o status real passa a ser bloqueado

Dependência central

- `3.4 LPF Supabase Inspect MCP`

Status

- bloqueado

Observações

- este item continua conceitualmente vinculado ao mesmo MCP de `3.4`
- o bloqueio atual não invalida `3.4` como infraestrutura read-only existente
- o bloqueio é específico da tentativa de consumo via ChatGPT no contrato atual de autenticação

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

3.5 Validador Final

Objetivo

- validar fluxos reais do app por meio de navegação executada pelo workflow

Observação

- todo o conteúdo detalhado deste item está em discussão no momento
- este item só deverá ser preenchido completamente após a implementação

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

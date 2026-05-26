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
- `niche-runtime-tests` criado como subprojeto canônico em `automations/niche-runtime-tests/`.
- `pipelines/validador-final/`, `pipelines/supabase-inspect/` e `pipelines/docs-apply-report/` deixaram de ser paths oficiais.

1. Objetivo e escopo
Registrar a camada de automações operacionais do LP Factory 10: plataformas usadas, credenciais registradas sem valores secretos, catálogo de automações, componentes consumidores e aprendizados operacionais.

Este documento não substitui:
- `docs/services.md`, para services, MCPs, endpoints e infraestrutura reutilizável;
- `docs/base-tecnica.md`, para guardrails, checks, segurança e regras estruturais;
- `docs/schema.md`, para banco, tabelas, views, policies e functions;
- `docs/roadmap.md`, para evolução funcional.

Regra de segurança:
Nunca registrar segredos brutos. Registrar apenas nome da credencial, plataforma, ambiente, localização, finalidade e escopo.

2. Plataformas e configuração global
2.1 OpenAI
- Papel na automação: execução de modelos, Agent Builder/SDK e integração com pipelines/agentes.
- Ambientes operacionais: `LPF10-DEV` e `LPF10-PROD`.
- Credencial registrada: `OPENAI_API_KEY` (armazenada em GitHub Secrets).
- Regra operacional: desenvolvimento prioriza DEV; análise de consumo deve ser feita por projeto.
- Governança de consumo: API keys e service accounts ficam vinculados ao projeto onde foram criados.
- Benefícios e custo: DEV possui `complimentary daily tokens` (diário, não acumulado) e `complimentary weekly evals`.
- Qualidade/custo: escolher modelo conforme necessidade real; cobertura de `tool use` deve ser validada com cautela conforme política vigente.

2.2 GitHub
- Papel: repositório principal, GitHub Actions, pipelines, PRs e secrets.
- Credenciais registradas: `OPENAI_API_KEY`, `SUPABASE_DB_URL_READONLY`, `MAILBOX_EMAIL`, `MAILBOX_PASSWORD`.
- Estrutura operacional: raiz canônica de automações em `automations/`; orquestração em `.github/workflows/`.
- Workflows ativos identificados:
  - `.github/workflows/pipeline-supabase-inspect.yml`
  - `.github/workflows/pipeline-docs-apply-report.yml`
  - `.github/workflows/automation-validador-final.yml`
  - `.github/workflows/automation-niche-runtime-tests.yml`
  - `.github/workflows/security.yml`
  - `.github/workflows/upgrade-next-16-1-1.yml`

2.3 Supabase
- Papel: banco, Auth e fonte para inspeções/verificações read-only.
- Credencial registrada: `SUPABASE_DB_URL_READONLY` (GitHub Secrets), com escopo read-only para inspeções e verificações quando aplicável.
- Estrutura de acesso: role `ai_readonly` para consultas e inspeções.
- Exceção MVP: houve relaxamento temporário para acelerar o Supabase Inspect, sem service_role e sem escrita direta; revisar permissões antes de ampliar o acesso operacional.
- Observação operacional: verificações de runtime que consultam banco devem ser tratadas como presets versionados quando aplicável.

2.4 Vercel
- Papel: hospedagem do Core SaaS e de services dedicados.
- Projetos: `lp-factory-10` e `lpf-10-services`.
- Detalhes operacionais de services e variáveis devem ser consultados em `docs/services.md`.

2.5 Resend
- Papel no ecossistema: plataforma relacionada ao projeto.
- Estado atual: não há automação operacional formalizada de Resend neste documento.

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

3.1.1 Supabase Inspect — presets opcionais de verificação

Objetivo:
Registrar a possibilidade futura de presets opcionais no `supabase-inspect` para reduzir SQL manual recorrente e apoiar a verificação do estado real do BD, sem substituir o modo livre por SQL nem o contrato canônico de `docs/schema.md`.

Status:
Proposto

Observações:
Exemplos futuros de presets: `schema_columns`, `rls_policies`, `indexes`, `triggers`, `functions`, `views`.
A necessidade real desses presets deve ser avaliada antes de implementação.

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
Validar ponta a ponta fluxos reais de autenticação do app por execução da Fase 2 determinística (criação de conta, confirmação por e-mail, login, forgot password, reset, login com nova senha e logout).

Status:
Implementada e validada ponta a ponta na Fase 2 determinística.

Acesso:
GitHub → Actions → workflow `automation-validador-final`

Como usar:
Executar o workflow informando apenas o input manual `app_url`.

Como testar feature branch antes do merge:
- quando a feature branch **não altera o pipeline**, executar o workflow a partir da branch `main`
- nesse cenário, informar em `app_url` a URL de preview da feature branch que está sendo validada
- este é o modo operacional recomendado para validação pré-merge

Exceção: quando a própria feature altera o pipeline:
- quando a feature branch altera arquivos do pipeline (`workflow`, `run.mjs`, `login-playwright.mjs` ou `mailbox-client.mjs`), executar o workflow a partir da própria feature branch
- nesse cenário, informar em `app_url` a URL de preview da mesma feature branch
- essa exceção garante que a validação use exatamente a versão de automação alterada pela feature

Motivo operacional do padrão:
- evita problemas de `sequence` e cache inconsistente em feature branches comuns
- na prática, `workflow` da `main` + preview da feature virou o modo recomendado para validar features antes do merge

Contrato atual da Fase 2:
- fluxo determinístico (sem briefing funcional JSON);
- único input manual: `app_url`;
- sem screenshot no contrato operacional;
- estado local de 1 conta ativa persistido em `state/test-account.json`.

Resposta esperada:
Logs e resultado final da execução determinística no job do workflow.

Referências / dependências:
README local: `automations/validador-final/README.md`
Workflow: `.github/workflows/automation-validador-final.yml`
Runtime: `automations/validador-final/`
Estado persistido: `automations/validador-final/state/test-account.json`

3.5 Resolver IA de Nicho no pending_setup

Objetivo:
Interpretar o nicho bruto informado pelo lead no `pending_setup` e encaminhar a resolução do taxon/slug conforme o contrato funcional do E10.5.6, sem duplicar neste catálogo o detalhamento do caso.

Referência:
`docs/roadmap.md` — E10.5.6.

Observação:
O contrato funcional, status, escopo, critérios e artefatos do caso ficam no roadmap para evitar duplicação neste catálogo.

3.6 Apply automático de migrations no Supabase

Objetivo:
Manter o apply automático como fluxo preparado, mas bloqueado até a conclusão da baseline oficial de migrations e do alinhamento remoto.

Status:
Proposto / bloqueado por baseline oficial

Resumo de controle:
O workflow de apply não deve ser tratado como liberado enquanto a baseline A3.6.1 estiver pendente. A orientação operacional detalhada fica centralizada nas lousas de referência, sem duplicação neste índice.

Referências / dependências:
`docs/lousa-automations3-6.md`
`docs/lousa-automations3-6-1.md`

3.6.1 Baseline de migrations no Supabase

Objetivo:
Consolidar o baseline real do banco remoto atual como novo histórico oficial de migrations antes de liberar o apply automático.

Status:
Proposto / pendente

Resumo de controle:
A lousa operacional principal da baseline é `docs/lousa-automations3-6-1.md`. O contexto de controle do apply automático permanece em `docs/lousa-automations3-6.md`.

Referências / dependências:
`docs/lousa-automations3-6.md`
`docs/lousa-automations3-6-1.md`

3.7 Niche Runtime Tests

Objetivo:
Validar em runtime real o fluxo de criação de conta e preenchimento de `pending_setup` com nichos informados pelo usuário, usando contas reais, confirmação por e-mail e evidência operacional em Job Summary/artifact.

Status:
Implementada como piloto operacional flexível.

Acesso:
GitHub → Actions → workflow `automation-niche-runtime-tests`

Como usar:
Executar o workflow informando:
- `app_url`: URL do app ou preview;
- `start_sequence`: número inicial para `alcinoafonso380+conviteXX@gmail.com`;
- `niches`: lista livre separada por `;`, quando o objetivo for explorar nichos escolhidos manualmente;
- `case_preset`: fallback versionado quando o objetivo for repetir uma suíte formal;
- `verification_mode`: `setup_only` para validação funcional flexível ou modo versionado quando a etapa tiver expectativa rígida de banco.

Resposta esperada:
Contas criadas e confirmadas, `pending_setup` preenchido, subdomínios capturados, evidência no Job Summary e artifact `niche-runtime-results`.

Regra operacional:
A automação não deve ser engessada por verificação de banco genérica. O teste base é criar conta e preencher o pipeline. Verificações no Supabase só devem entrar como presets versionados, porque a expectativa de tabelas como `account_niche_resolutions` e `account_taxonomy` muda conforme a etapa funcional.

Referências / dependências:
README local: `automations/niche-runtime-tests/README.md`
Workflow: `.github/workflows/automation-niche-runtime-tests.yml`
Runtime: `automations/niche-runtime-tests/`
Casos versionados: `automations/niche-runtime-tests/cases/`
Reuso de mailbox: `automations/validador-final/`
Verificação opcional de banco: `automations/supabase-inspect/verify-niche-runtime.mjs`

3.8 Agente Investigativo Universal

Objetivo:
Investigar, sob escopo sob demanda, plataformas, configuracoes, chaves, variaveis, deploys, logs, banco, automacoes, integracoes e readiness operacional do ecossistema LP Factory 10, sem expor segredos e sem executar mutacoes sem autorizacao explicita.

Status:
Presets de investigacao / Fase 4

Acesso esperado:
Codex App via plugin local `lp-factory-investigator`, apos instalacao no ambiente Codex.

Como usar:
Informar o escopo da investigacao, incluindo alvos, plataformas, ambiente, fluxo funcional, variaveis ou estruturas a validar e formato de saida esperado.

Resposta esperada:
Relatorio no chat com status geral, evidencias por plataforma, lacunas, riscos, acoes recomendadas e decisao objetiva sobre prosseguir ou bloquear.

Regra operacional:
O agente deve operar com leitura por padrao. Secrets podem ser verificados por presenca, ambiente, sensibilidade e formato, mas nunca devem ter valores revelados.

Referencias / dependencias:
README local: `automations/agente-investigativo-universal/README.md`
Plugin local: `plugins/lp-factory-investigator/`
Skill: `plugins/lp-factory-investigator/skills/investigador-operacional/SKILL.md`
Ferramentas reais: `plugins/lp-factory-investigator/tools/README.md`
Preflight local: `plugins/lp-factory-investigator/scripts/tool-readiness.mjs`
Presets: `plugins/lp-factory-investigator/presets/`
Plataformas: GitHub, Vercel, OpenAI Platform / OpenAI Developers, Supabase, App preview/producao e GitHub Actions quando disponiveis.

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

4.10 Validador Final (3.4)

4.10.1 Fluxos de auth complexos devem ser estabilizados com execução real e logs fortes primeiro, e só depois simplificados.

4.10.2 Em automações de auth com e-mail:
- separar UI automation de mailbox helper reduziu acoplamento
- leitura programática da caixa postal foi mais confiável do que depender de webmail

4.10.3 Em fluxos determinísticos:
- persistir `sequence` entre runs ajudou a evitar loops e colisões cegas
- manter 1 conta ativa por vez simplificou o controle operacional

4.10.4 Em callbacks de e-mail:
- a seleção do link deve considerar a intenção do fluxo, não apenas host ou base URL
- sanitização e observabilidade do link foram decisivas na estabilização

4.10.5 Em reset de senha:
- o fluxo mais simples foi aproveitar a sessão autenticada aberta pela própria app após o reset bem-sucedido, em vez de forçar logout intermediário antes do reset

4.10.6 Após validação ponta a ponta:
- primeiro consolidar o fluxo
- depois refatorar e remover legado
- e só por último reduzir observabilidade e logs

4.10.7 Regra reutilizável pré-merge:
- para feature branch sem alteração de pipeline, usar `workflow` da `main` + `app_url` da preview da feature
- para feature branch com alteração de pipeline, usar `workflow` e `app_url` da própria feature branch

4.11 Niche Runtime Tests (3.7)

4.11.1 O núcleo estável da automação é criação de conta + confirmação + preenchimento de `pending_setup`. Isso já valida funcionamento real do fluxo.

4.11.2 Nichos livres devem usar `verification_mode = setup_only`, porque a expectativa correta de banco depende da etapa funcional e não deve ser presumida.

4.11.3 Presets versionados são o lugar correto para expectativa rígida de banco. Quando a regra muda, criar ou ajustar preset, em vez de engessar o workflow genérico.

4.11.4 O uso de `start_sequence` e aliases `alcinoafonso380+conviteXX@gmail.com` permite criar múltiplas contas em uma mesma execução e reduz colisões previsíveis.

4.11.5 Contas criadas por esse fluxo são evidência funcional temporária. Cleanup permanece manual até existir regra aprovada para remoção segura.

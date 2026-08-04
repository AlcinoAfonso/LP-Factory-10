0.1 Cabeçalho
Data: 04/08/2026
Versão: v1.13
Status: Alinhado ao Platform Config

0.2 Função do documento
Registrar a camada de automações operacionais do LP Factory 10 como referência para integrações, automações operacionais e componentes consumidores, sem expor segredos.

0.3 Relação com outros documentos
docs/services.md: services implantáveis, MCPs, endpoints e infraestrutura reutilizável com identidade própria.
docs/base-tecnica.md: regras estruturais gerais, guardrails, checks e workflows técnicos de manutenção.
docs/schema.md: banco, tabelas, views, policies e functions.
docs/roadmap.md: evolução funcional.
docs/platform-config.md: configurações operacionais de plataformas, secrets por nome, workflows, ambientes, endpoints e regras de plataforma usados por automações.

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
Registrar a camada de automações operacionais do LP Factory 10: catálogo de automações, status, como usar, componentes consumidores e dependências.

Configurações de plataformas, secrets por nome, ambientes, endpoints e lista consolidada de workflows devem ficar em `docs/platform-config.md`.

Este documento não substitui:
- `docs/services.md`, para services, MCPs, endpoints e infraestrutura reutilizável;
- `docs/base-tecnica.md`, para guardrails, checks, segurança e regras estruturais;
- `docs/schema.md`, para banco, tabelas, views, policies e functions;
- `docs/roadmap.md`, para evolução funcional.

Regra de vínculo com o roadmap:
- automação funcional que materialize parte do estado final de um caso deve informar `Aplicação funcional no roadmap` ou `Aplicações funcionais no roadmap`, com a seção E* correspondente;
- facilitador de testes deve informar `Caso funcional validado`, sem se tornar referência funcional inversa no roadmap;
- infraestrutura genérica deve omitir esses blocos quando não estiver ligada materialmente a um caso E* específico.

Regra de segurança:
Nunca registrar segredos brutos. Registrar apenas nome da credencial, plataforma, ambiente, localização, finalidade e escopo.

2. Plataformas e configuração global

Status: Deprecada em 04/08/2026.

Motivo: configurações operacionais de plataformas, secrets por nome, ambientes, endpoints e workflows estão consolidados em `docs/platform-config.md`.

Destino canônico: `docs/platform-config.md`.

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
Registrar a validação funcional histórica do Supabase Inspect no Agent Builder por meio da MCP base documentada em `docs/services.md`, sem acesso direto ao banco.

Status:
Concluído como validação funcional histórica

Nota de legado:
O Agent Builder deixará de receber novos recursos e será descontinuado na plataforma OpenAI até 30/11/2026; esta integração não deve ser expandida.

Referências / dependências:
docs/services.md — `1.1 LPF Supabase Inspect MCP`
services/mcp-supabase-inspect/README.md
Workflow ID: `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7`

3.3.1 Update — Agents SDK
Status:
Prioritário / pendente de migração

Objetivo:
Migrar ou substituir o uso validado no Agent Builder por um fluxo programático mantido no Agents SDK.

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
Interpretar o nicho bruto informado no `pending_setup` quando o matching determinístico não resolver com segurança e preparar uma saída estruturada para confirmação, escolha ou revisão, sem criar taxon, alias ou vínculo oficial.

Status:
Implementada e integrada ao fluxo server-side do onboarding.

Recurso utilizado:
- Responses API
- Structured Outputs com JSON Schema estrito
- Server Action existente do `pending_setup`

Natureza:
- Automação com IA em fluxo controlado.

Ambiente principal:
- Runtime do LP Factory.

Plataforma dependente:
- OpenAI Platform.

Participação humana:
- Gatilho no salvamento do `pending_setup` e confirmação, escolha ou revisão posterior quando indicada; sem intervenção durante a execução.

Acesso:
Execução server-side durante `saveSetupAndContinueAction`, após validação e persistência do onboarding.

Como funciona:
- Executa primeiro o matching determinístico e a avaliação tipada de confiança.
- Chama a Responses API somente quando a decisão determinística exige escalonamento.
- Produz saída estruturada com modo de UX, mensagem, até três opções, sinais de confirmação ou revisão e motivo.
- Persiste o resultado operacional, o modelo, a versão do schema e o estado da execução em `account_niche_resolutions`.
- Mantém a criação do vínculo oficial em `account_taxonomy` restrita à alta confiança determinística; a saída da IA nunca cria vínculo oficial.
- Registra logs estruturados com status, contagens e correlação, sem registrar prompt ou resposta completa nos logs.
- Ausência de configuração ou falha da IA é registrada como `skipped` ou `failed` e não bloqueia a conclusão do setup.

Limites:
- Não cria nem aprova taxon ou alias.
- Não grava `account_taxonomy`.
- Não executa retry automático nem chamada em loop.
- Não é agente e não usa Agents SDK, Sandbox Agents, tool, job, fila ou execução recorrente.
- Não substitui o matching determinístico nem o contrato funcional da E10.5.6.

Aplicação funcional no roadmap:
- `docs/roadmap.md` — E10.5.6.5, dentro do recorte E10.5.6.

Referências / dependências:
Regra técnica: `docs/base-tecnica.md`
Configuração de modelo: `docs/platform-config.md`
Action consumidora: `app/a/[account]/actions.ts`
Adapter OpenAI: `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
Persistência operacional: `lib/onboarding/niche-resolution/adapters/accountNicheResolutionAdapter.ts`
Decisão determinística: `lib/onboarding/niche-resolution/deterministicConfidence.ts`

3.6 Apply automático de migrations no Supabase

Objetivo:
Aplicar migrations versionadas do Supabase automaticamente após merge humano na `main`, substituindo o uso manual do SQL Editor para alterações de schema.

Status:
Implementada e validada

Acesso:
GitHub → Actions → workflow `pipeline-supabase-apply-migrations`

Como usar:
Criar migration em `supabase/migrations/<timestamp>_<nome>.sql`, validar em PR exclusivo e fazer merge humano na `main`. O push na `main` dispara o apply automático.

Resumo de controle:
A baseline oficial foi concluída, o histórico remoto foi alinhado e o smoke de criação/remoção foi validado. O gate `SUPABASE_APPLY_MIGRATIONS_ENABLED` permanece `true` no fluxo normal. O SQL Editor não faz parte do fluxo normal. Migration já aplicada não deve ser editada, apagada ou substituída; correções e reversões devem ser feitas por nova migration incremental.

Referências / dependências:
`docs/base-tecnica.md`
`docs/platform-config.md`
`docs/lousa-automations3-6-1.md` — registro histórico da baseline concluída.

3.7 Niche Runtime Tests

Objetivo:
Validar em runtime real o fluxo de criação de conta e preenchimento de `pending_setup` com nichos informados pelo usuário, usando contas reais, confirmação por e-mail e evidência operacional em Job Summary/artifact.

Status:
Implementada como piloto operacional flexível.

Tipo de uso:
- Facilitador de testes; não integra o runtime funcional do produto.

Caso funcional validado:
- `docs/roadmap.md` — E10.5.6.

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

3.8 E10.7 Fase 2 — geração administrativa de draft comercial por taxon

Objetivo:
Gerar draft comercial `commercial_activation` por taxon em fluxo assistido por IA, server-side/Admin, sem publicação automática.

Status:
Implementada e validada como automação operacional administrativa.

Recurso utilizado:
- Responses API
- Structured Outputs
- Server Action administrativa protegida

Natureza:
- Automação com IA em fluxo controlado.

Ambiente principal:
- Runtime do LP Factory.

Plataforma dependente:
- OpenAI Platform.

Participação humana:
- Gatilho administrativo e revisão do draft; sem intervenção durante a execução.

Acesso:
Action administrativa protegida por permissão administrativa.

Como funciona:
- Usa OpenAI Responses API com Structured Outputs.
- Gera e valida `content_json` antes da persistência.
- Persiste somente `status = draft` em `content_artifacts`.
- Registra fontes relacionais apenas `business_buyer`.
- Mantém contexto `end_customer` apenas em `provenance_json`.
- Usa CTA seguro definido server-side.
- Em falha após criação do artifact e antes do registro completo das fontes, invalida/arquiva o draft parcial e retorna erro seguro.

Limites:
- Não publica.
- Não altera `published`.
- Não roda em runtime público.
- Não é agente.
- Não usa Agents SDK, Sandbox Agents, job, fila nem execução recorrente.

Aplicação funcional no roadmap:
- `docs/roadmap.md` — E10.7.3.

Referências / dependências:
Regra técnica: `docs/base-tecnica.md`
Configuração de modelo: `docs/platform-config.md`
Action administrativa: `app/admin/(protected)/templates/actions.ts`
Adapter de geração: `lib/conversion-content/commercial-activation/draft-generation.ts`
Snippet de validação: `supabase/snippets/e10_7_phase_2_draft_verify.sql`

3.9 E12.4.3 — proposta administrativa opcional do perfil de orientação

Objetivo:
Propor orientação e recomendações de módulos para um taxon elegível, preservando a revisão humana e o fluxo manual completo.

Status:
Implementada e validada operacionalmente, com migration aplicada, configuração da OpenAI e testes humanos autenticados aprovados.

Recurso utilizado:
- Responses API
- Structured Outputs
- Server Action administrativa protegida

Natureza:
- Automação com IA em fluxo controlado.

Ambiente principal:
- Runtime do LP Factory.

Plataforma dependente:
- OpenAI Platform.

Participação humana:
- Gatilho administrativo e aceite, ajuste ou descarte da proposta após a execução.

Como funciona:
- Executa somente após ação explícita do administrador.
- Resolve pesquisas estruturadas vigentes e o perfil ativo próprio quando disponível.
- Exige saída estruturada, valida identidades pela API pública do catálogo e apresenta a proposta no mesmo editor.
- Mantém request ID e fingerprint para correlacionar proposta, descarte e aceite ajustado ou integral sem registrar prompt, payload ou resposta completa.

Limites:
- Não salva, aprova, ativa, arquiva, gera, materializa, publica nem altera landing page.
- Falha ou ausência da assistência não bloqueia a operação manual.
- Não usa Agents SDK, ferramenta, agente, job, fila, execução recorrente nem `previous_response_id`.

Aplicações funcionais no roadmap:
- `docs/roadmap.md` — E12.4.3.
- `docs/roadmap.md` — E12.4.3.1.
- `docs/roadmap.md` — E12.4.3.2.

Referências / dependências:
Regra técnica: `docs/base-tecnica.md`
Configuração de modelo: `docs/platform-config.md`
Action administrativa: `app/admin/(protected)/perfis-de-orientacao/actions.ts`
Adapter de proposta: `lib/conversion-content/adapters/landingPageGenerationProfileOpenAiAdapter.ts`

4. Aprendizados operacionais

Status: Deprecada em 04/08/2026.

Motivo: seção histórica e parcialmente superada; regras operacionais vigentes permanecem nos itens correspondentes do catálogo e nas demais fontes canônicas aplicáveis.
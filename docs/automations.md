0.1 Cabeçalho
Data: 12/09/2026
Versão: v1.28
Status: Alinhado ao catálogo operacional vigente; avaliação factual E20.6 integrada ao runtime administrativo foreground

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
- `supabase-inspect` migrado para `automations/supabase-inspect/` com execução a partir da nova raiz canônica e sem fallback `npm install --no-save` no workflow.
- `docs-apply-report` migrado para `automations/docs-apply-report/` com execução a partir da nova raiz canônica.
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
Removido manualmente em 01/09/2026; não é automação vigente nem consumidor necessário independente.

Nota de legado:
O Agent Builder deixará de receber novos recursos e será descontinuado na plataforma OpenAI até 30/11/2026; esta integração não deve ser expandida.

Decisão da E22.3:
O workflow `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7` é alvo da retirada controlada e não deve ser preservado como consumidor necessário independente do MCP.

Estado externo final:
A remoção manual do workflow foi confirmada pelo responsável em 01/09/2026. Não há workflow Agent Builder operacional a catalogar; nenhuma ferramenta de leitura independente do Agent Builder esteve disponível nesta execução.

Referência histórica:
Workflow ID: `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7`

3.3.1 Update — Agents SDK
Status:
Não iniciado; fora do escopo E22.3.4 e não autorizado como substituto.

Objetivo:
Registro histórico de update não materializado; a E22.3.4 não cria Agents SDK nem qualquer substituto.

3.3.2 Update — ChatGPT + MCP
Status:
Não iniciado; sem continuidade operacional após a retirada controlada do MCP.

Motivo:
Incompatibilidade de autenticação no contrato histórico da MCP; nenhuma migração ou substituto foi criado.

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
Aplicar migrations versionadas do Supabase automaticamente após o merge autorizado para o modo vigente na `main`, substituindo o uso manual do SQL Editor para alterações de schema.

Status:
Implementada e validada

Acesso:
GitHub → Actions → workflow `pipeline-supabase-apply-migrations`

Como usar:
Criar migration em `supabase/migrations/<timestamp>_<nome>.sql`, validar no PR do plano e realizar o merge autorizado para o modo vigente conforme `AGENTS.md`. O push na `main` dispara o apply automático.

Resumo de controle:
A baseline oficial foi concluída, o histórico remoto foi alinhado e o smoke de criação/remoção foi validado. O gate `SUPABASE_APPLY_MIGRATIONS_ENABLED` permanece `true` no fluxo normal. O SQL Editor não faz parte do fluxo normal. Migration já aplicada não deve ser editada, apagada ou substituída; correções e reversões devem ser feitas por nova migration incremental.

Referências / dependências:
`docs/base-tecnica.md`
`docs/platform-config.md`
`docs/lousa-automations3-6-1.md` — registro histórico da baseline concluída.

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

3.10 E20.6 — avaliação assistida da suficiência factual da E20.2 por taxon

Objetivo:
Confrontar a pesquisa integral `end_customer` selecionada pela E20.5 com uma versão executável explícita da E20.2 e produzir recomendação fundamentada para decisão humana.

Status:
Implementada no repositório como fluxo foreground do Admin. Apply, configuração do gate e QA hospedado permanecem pendentes dos gates finais.

Recurso utilizado:
- Responses API com Structured Output estrito;
- Web Search hospedado somente nas estratégias que exigem fonte pública;
- recomendação persistida na revisão factual aberta e decisão administrativa humana explícita.

Natureza:
- Automação com IA em fluxo controlado.

Ambiente principal:
- Runtime server-side do Admin do LP Factory, condicionado pelo gate exclusivo do provider.

Participação humana:
- O humano abre e conclui a revisão factual, solicita opcionalmente a avaliação e decide entre zero, parte ou totalidade dos candidatos, podendo acrescentar candidato próprio persistido com origem literal `human-added` e camada explícita.

Como usar:
- Abrir uma sessão `release | revision` no detalhe do taxon e escolher a estratégia disponível: pesquisa E20.5 válida, ausência legítima com Web ou hipótese focal com Web.
- Confrontar `starter`, `lite`, `pro` e `ultra` em uma única execução com deadline integral de 45 segundos, zero retry e `store:false`.
- Tratar a recomendação como não autoritativa; somente a decisão humana revalidada altera o lifecycle.

Resultado esperado:
- saída v2 `suficiente | gaps candidatos | inconclusivo`, com fontes autenticadas quando aplicáveis; somente resultado validado é persistido na revisão aberta. Falha ou timeout não cria estado autoritativo, e a decisão recarrega o resultado pelo identificador e revisão esperada.

Limites:
- Não altera a E20.2 nem grava suficiência automaticamente; não cria agente, Agents SDK, handoff Codex, job, fila, background ou automação recorrente. Gate desligado ou provider indisponível afeta somente a avaliação opcional, nunca o lifecycle humano.

Referências / dependências:
Fluxo funcional: `docs/roadmap.md` — E20.6.3 a E20.6.7.
Configuração do gate: `docs/platform-config.md` — seção 3.5.
Contrato técnico: `docs/base-tecnica.md` — seção 3.15.7.

3.12 E20.7.4 — complemento dinâmico controlado de conhecimento de mercado

Objetivo:
Complementar somente a resolução `dynamic_required` da E20.7.3 com evidência pública recente e rastreável, sem recusar a oferta nem substituir a autoridade factual E20.2.

Status:
Concluída no boundary da E20.7, implementada e validada deterministicamente no repositório, com apply automático da migration E20.7.4 concluído após o merge do PR #835. O transporte hospedado permanece não autorizado e não possui consumidor funcional após a retirada da integração E19; eventual uso futuro exige recorte próprio.

Recurso utilizado:
- Responses API com Structured Output estrito;
- ferramenta hospedada Web Search como única tool permitida;
- configuração de workload pelo lifecycle E21.2.

Natureza:
- Automação com IA em fluxo controlado.

Ambiente principal:
- Runtime server-side do LP Factory, após ativação humana por ambiente.

Participação humana:
- O gatilho funcional futuro pertence ao consumidor autorizado; configuração, prova, promoção e ativação do workload exigem as ações humanas já governadas pela E21.2.

Como funciona:
- Executa uma única requisição foreground e exige uma ou duas chamadas Web Search concluídas, com fontes HTTPS retornadas pelo provider.
- Usa prompt e schema versionados no boundary de resolução de conhecimento; trata entrada funcional como não confiável e rejeita URL material que não tenha sido retornada pelo provider.
- Limita contexto de busca, chamadas, orçamento de entrada, saída e deadline por política code-owned; modelo e reasoning effort vêm da configuração efetiva do workload.
- A configuração inicial e única combinação elegível para `save`/`promote` desse workload é `gpt-5.6-luna + high`; a hipótese `low`, `max` e a matriz comparativa anterior não são autorizadas.
- Retorna complemento material ou ausência de materialidade com fontes, proveniência, usage e telemetria sanitizada; evidência insuficiente ou falha técnica não invalida a oferta.

Limites:
- Não usa agente, Agents SDK, retry, fallback, background, conversation, job, fila, RAG, cache global ou persistência de pesquisa.
- Não altera a E20.2, não gera copy, layout, wireframe ou CTA e não integra a geração E19.
- O piloto `corretor-imoveis` já está reconciliado em `reviewed_input_catalog_version=6`. O bootstrap revisão `1` não autoriza transporte hospedado; eventual novo consumidor deverá comprovar, promover e ativar revisão `supabase_operational` `2` ou posterior pelo lifecycle E21.2, conforme `docs/platform-config.md`.

Aplicação funcional no roadmap:
- `docs/roadmap.md` — E20.7.4.

Referências / dependências:
Regra técnica: `docs/base-tecnica.md` — seção 3.15.11.
Configuração de workloads: `docs/platform-config.md` — seção 3.5.
Contrato de banco: `docs/schema.md` — seções 1.28 a 1.30.
Boundary funcional: `lib/conversion-content/landing-page/knowledge-resolution/`.

4. Aprendizados operacionais

Status: Deprecada em 04/08/2026.

Motivo: seção histórica e parcialmente superada; regras operacionais vigentes permanecem nos itens correspondentes do catálogo e nas demais fontes canônicas aplicáveis.

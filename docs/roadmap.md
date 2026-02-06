0. Introdução

0.1 Cabeçalho
• Data: 04/02/2026
• Versão: v1.5.15

0.2 Contrato do documento (parseável)
• Este documento registra o roadmap e o histórico de execução por marcos (E1, E2, ...).
0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo
0.2.2 ALLOWLIST_RELEVANCIA
• OBJETIVO_DOC: registrar marcos, decisões, fluxo e histórico de execução do produto (snapshot por marco), orientando o que fazer e em que ordem.
• MARCOS: Itens E* com status, escopo, critérios e pendências; quando fizer sentido, incluir sub-seções de Fluxos e Cenários (como subseções do próprio marco) descrevendo comportamento/decisões de UX e regras de produto.
• FASES: agrupamentos estratégicos do roadmap (alto nível).
• MIGRACOES: movimentos de itens (ex.: E7.2 → E10.1) apenas como referência histórica.
• Microcopy (guia): registrar mensagens-chave + intenção (segurança, anti-abuso, clareza), evitando texto final longo; detalhar mais apenas quando o comportamento depender da redação.
• ANTI_DRIFT_DB: não detalhar contrato de banco (tabelas/colunas/views/RPCs/triggers/policies); referenciar docs/schema.md.
• ANTI_DRIFT_REGRAS: não duplicar regras técnicas; referenciar docs/base-tecnica.md
• **PROIBIDO_EXECUCAO_NO_CORPO: no corpo dos itens E* é proibido registrar narrativa operacional de execução (PR/branch/CI/deploy), passos de QA, prints e relato “como foi feito”; registrar apenas estado final (snapshot) e critérios mínimos de aceite.**
0.2.3 ALLOWLIST_CHANGELOG (blocklist mínima)
• PROIBIDO: bullets administrativos (ex.: “atualizado cabeçalho/data/versão”).
0.2.4 ESTILO (opcional)
• Estado final (snapshot por marco), sem narrativa longa.
• Frases curtas; preferir bullets; sem tabelas; sem code fences.

0.3 Nota operacional (dependência externa)
• 2026-02 — Supabase: Project Clone / Restore to a New Project (beta) pode ficar indisponível; sem impacto no runtime do projeto existente. Não depender disso para staging/espelho/backup. Se precisar duplicar ambiente: criar projeto novo + aplicar migrations do repositório + configurar env/secrets manualmente.

1. E1 — Estrutura de Dados

1.1 Status
• Concluído (03/10/2025)
1.2 Implementado
• Tabelas: accounts, account_users, audit_logs, plans, partners, partner_accounts, post_sale_tokens
• Views: v_access_context_v2, v_account_effective_limits, v_account_effective_limits_secure, v_admin_tokens_with_usage, v_audit_logs_norm, v_audit_logs_norm
• Constraints e índices otimizados
1.3 Critérios de Aceite
• Multi-tenant funcional (subdomain/domain UNIQUE)
• 1 owner ativo por conta
• Auditoria automática
1.4 Pendências
• Nenhuma
1.5 Updates externos (avaliar)
• 2026-01 — Supabase: Index Advisor (Table Editor) — Link: https://supabase.com/docs/guides/database/extensions/index_advisor
• Nota: quando revisitar performance/índices, rodar o advisor e avaliar recomendações antes de criar índices novos (sem auto-aplicar).

2. E2 — Núcleo de Acesso

2.1 Status
• Concluído
2.2 Implementado
• Autenticação email/senha (SULB)
• Roles: owner, admin, editor, viewer, super_admin
• RLS em todas as tabelas do núcleo de acesso
• Helpers: is_super_admin, is_platform_admin, has_account_min_role
• Recovery de senha: /auth/forgot-password → e-mail → /auth/update-password (token_hash/type=recovery); confirmação e troca somente no POST /auth/confirm (anti-scanner)
2.3 Critérios de Aceite
• Login funcional e seguro
• Reset de senha com expiração (token consumido somente no POST)
• Auditoria ativa
2.4 Pendências
• Futuras features (Magic Link, Social Login, 2FA)

3. E3 — Adapters Base

3.1 Status
• Concluído

3.2 Implementado
• accountAdapter
• accessContextAdapter
• adminAdapter
• postSaleTokenAdapter
• Tipos normalizados (DB → TS)
• Logs estruturados

3.3 Pendências
• Adapters de planos e LPs futuras (planAdapter, landingPageAdapter, sectionAdapter)

3.4 Updates externos (avaliar)
• 2026-01 — Supabase: Data API / PostgREST v14 — Link: https://github.com/orgs/supabase/discussions/41288
• Nota: como há uso de supabase.from().select() em adapters/SSR, ao iniciar ajustes nessa camada, revisar o que muda na v14 (filters/embeds/comportamentos) e validar impacto antes de mexer em queries.

4. E4 — Account Dashboard (Infraestrutura SSR)

4.1 Status
• Concluído

27/01/2026 16:18 — E4.2 (enxuto / anti-drift)

4.2 Implementado
• Redirect `/a` → `/a/home`
• Gateway `/a/home`
• Público sem sessão
• Com sessão: resolve conta/acesso e direciona para a melhor rota disponível
• Sem qualquer vínculo: cria a 1ª conta em modo **vitrine** (`pending_setup`) e direciona para `/a/[account]`
• Com vínculos, mas sem conta permitida: aplica anti-loop e direciona para um estado neutro de “acesso indisponível”
• CTA “Criar conta” (público) no `/a/home` → `/auth/sign-up`
• Rota privada `/a/[account]` com gate SSR (ponto único de decisão)
• Persistência de “última conta” para melhorar retorno do usuário e evitar loops
• Página neutra `/auth/confirm/info` para usuário autenticado sem vínculo válido
• Bloqueios com UX dedicada (sem deny genérico)
• Por **membership**: telas específicas (ver E15)
• Por **status da conta**: telas específicas para conta inativa/suspensa (ver E16)
4.2.1 Referências
• Regras técnicas do gate/adapters: `docs/base-tecnica.md`
• Contrato/DB e evidências: `docs/schema.md`

5. E5 — UI/Auth Account Dashboard

5.1 Status
• Concluído

5.2 Implementado
• Tela de Login (page-based em /auth/login)
• Tela "Esqueci minha senha" (/auth/forgot-password)
• Recovery sem “Continuar”: link do e-mail abre direto em /auth/update-password; submit confirma e troca senha via POST /auth/confirm (anti-scanner)
• Cooldown UI do reset: 60s com contador e botão desabilitado após solicitar
• Tela de Signup (/auth/sign-up) com envio de e-mail de confirmação
• Confirmação de e-mail (signup): link abre em /auth/confirm com type=signup e next=/a/home; token consumido somente no POST (anti-scanner)
• Pós-confirmação: usuário autenticado cai em /a/home; se não houver membership, F2 auto-cria 1ª conta pending_setup + vínculo owner/active e redireciona para /a/acc-... (modo vitrine)

5.3 Critérios de Aceite
• Fluxo page-based (sem modal overlay primário)
• Mensagens seguras e anti-enumeração no reset
• Erros genéricos/seguro no login, sem expor detalhes sensíveis

6. E6 — UI Kit Provisório

6.1 Status
• Concluído

6.2 Implementado
• Componentes: Button, Card, Input, Label, AlertBanner
• Base: shadcn/ui

6.3 Pendências
• Futura migração para Supabase Platform Kit

7. E7 — Conta Consultiva

7.1 Status
• Concluído (18/10/2025)

7.2 Escopo (entrega concluída)
• Criação de contas via token pós-venda
• Painel /admin/tokens para geração e revogação de tokens
• RPC create_account_with_owner() para criação segura e automatizada da conta

7.3 Critérios de Aceite (entrega concluída)
• Conta criada com contract_ref e status inicial pending_setup
• Redirecionamento automático após onboarding
• Banner de setup visível e editável

7.4 Pendências (migradas)
• Refinamentos de UX migrados para Account Dashboard UX (ex-E7.2)

7.5 Evolução — Conta Consultiva Update
7.5.1 Status
• Em evolução
7.5.2 Objetivo
• Ampliar /admin/tokens para funcionar como configurador de conta
7.5.3 Escopo
• Coleta de dados do cliente (CNPJ, razão social, contato, segmento, dores e metas)
• Seleção de plano base (Lite, Pro, Ultra) e definição de recursos adicionais (grants)
• Snapshot de recursos e preço conforme reunião consultiva
• Token nos modos onboard (cliente ativa) ou handoff (entrega pronta)
• Integração futura com criação opcional de LPs pré-configuradas
7.5.4 Critérios de Aceite
• Token gerado apenas após configuração completa da conta
• Conta criada com grants e preço definidos (snapshot)
• Registro auditável de plano base e recursos customizados
7.5.5 Valor agregado
• Elimina duplicidade entre fluxo técnico e comercial
• Garante que toda conta consultiva já nasça configurada e pronta para ativação
7.5.6 Próximos Passos
• Implementar campos token_type, billing_mode e plan_price_snapshot
• Adicionar interface de seleção de recursos no painel Admin
• Preparar suporte para LPs automáticas (modo handoff)


8. E8 — Access Context & Governança

8.1 Status
• Concluído (03/10/2025)

8.2 Implementado
• Access Context como fonte única para decisão de acesso e roteamento (SSR/UI)
• Contexto mínimo para UI (ex.: dados básicos da conta)
• Decisão “fail-closed” (quando não houver contexto permitido, não entra)
• Logs canônicos de decisão de acesso (para rastreabilidade)
• Resolução de “melhor destino” pós-login (inclui cenário de usuário sem vínculo, em modo vitrine) — ver E4.2/E5.2/E16
8.2.1 Referências
• Regras técnicas (gate/adapters/logs): docs/base-tecnica.md
• Contrato/DB do Access Context: docs/schema.md

8.3 Critérios de Aceite
• Decisão de acesso rastreável (log) e sem “deny genérico” quando houver status conhecido
• Bloqueios por membership seguem UX dedicada (ver E15)
• Bloqueios por status da conta seguem UX dedicada (ver E16)
• Redirect seguro e anti-loop (ver E4.2

9. E9 — Billing Engine & Stripe Sync

9.1 Status
• Em desenvolvimento

9.2 Objetivo
• Unificar cobrança (manual, híbrida e automatizada) e controle de recursos (grants)
• Permitir modelo único de billing com snapshot por conta

9.3 Escopo geral
• Definir modelo técnico de planos, recursos e billing snapshot
• Implementar motor de grants (model_grants + get_feature())
• Integrar Stripe como modalidade opcional (billing_mode = stripe)
• Garantir compatibilidade com Conta Consultiva (E7)

9.4 Grants e Features
9.4.1 Status
• Em evolução
9.4.2 Escopo
• Criar tabela model_grants para controlar recursos e limites por conta
• Implementar get_feature(account_id, feature_key, lp_id?, section_id?) com fallback section > lp > account > plan > default
• Adicionar colunas origin_plan_id, origin_plan_version, locked e limit_json
9.4.3 Critérios de Aceite
• Cada conta tem grants independente do plano
• Mudanças em planos não alteram contas existentes automaticamente (snapshot)
• Sincronização com plano atual apenas via ação explícita
9.4.4 Integrações
• Conta Consultiva Update (E7.5)
• Admin Dashboard (E12)

9.5 Billing Snapshot e Ciclos
9.5.1 Status
• Em planejamento
9.5.2 Escopo
• Adicionar billing_mode (stripe, manual, hybrid)
• Adicionar plan_price_snapshot e billing_recurring_snapshot
• Adicionar billing_cycle_start, billing_cycle_end e next_adjustment_at
• Aplicar grandfathering (contas antigas mantêm preço e recursos)
• Snapshot de preço e recursos no momento da criação da conta
9.5.3 Critérios de Aceite
• Contas consultivas e SaaS usam a mesma estrutura
• Snapshots sempre específicos por conta
• Histórico auditável de alterações de preço e ciclo
9.5.4 Integrações
• Conta Consultiva (E7)
• Admin Dashboard (E12)

9.6 Stripe Sync (Automação SaaS)
9.6.1 Status
• Planejado
9.6.2 Escopo
• Webhooks checkout.session.completed e subscription.updated
• Sincronizar billing_status, subscription_id e subscription_current_period_end
• Atualizar plan_price_map com planos e valores atuais
• Suportar upgrade/downgrade automático para planos SaaS
9.6.3 Critérios de Aceite
• Ativar apenas em contas billing_mode = stripe
• Auditoria das transições de status (trial, active, canceled)
• Integração validada com a solução de Stripe Sync do Supabase (ou equivalente)
9.6.4 Updates externos (avaliar)
• 2026-01 — Supabase: Stripe Sync Engine 1-click no Dashboard — (link) — Nota: comparar com seus webhooks/fields de 9.6.2; decidir “Supabase Sync” vs equivalente.

9.7 Auditoria e Drift
9.7.1 Status
• Planejado
9.7.2 Escopo
• Relatório comparativo entre grants/preços da conta e plano original
• Detectar divergências (drift) e registrar em audit_logs
• Expor métricas de billing e recursos (limites, upgrades, consumo)
9.7.3 Critérios de Aceite
• Logs automáticos para toda atualização de plano/grant/ciclo
• Painel de auditoria integrado ao Admin Dashboard
• Exportação CSV/JSON

9.8 Compatibilidade
• Billing Engine é o núcleo técnico que garante coerência entre Conta Consultiva (E7), Admin (E12) e Account Dashboard (E10)
9.8.1 Trial como entitlements (billing)
• Status: Concluído (31/01/2026) — definição
• Definição (MVP)
• Prazo default: 7 dias (flexível em contas consultivas)
• Elegibilidade: flexível (promoções por período/nicho/contas específicas)
• Início: somente após setup concluído (referência: E10.4.2)
• Fim: por prazo; pode ser renovado
• Pós-expiração: `active → inactive` (coerente com E16/Op4)
• Contrato mínimo do “sinal comercial” (entitlement) consumido por SSR/gate/UX (sem amarrar em BD)
• `commercial.kind`: `trial | plan | none`
• `commercial.state`: `active | expired`
• `commercial.started_at`, `commercial.expires_at`, `commercial.promo`
• Proibição (anti-drift): não tratar `trial` como `accounts.status` (nem enum/allowlist/UI de status)
• Nota: remoção do hardcode/allowlist de trial no Access Context (public.v_access_context_v2) foi concluída em E10.4.1; entitlements de trial/plano permanecem neste marco (E9.8.1)
• Dependência operacional: se exigir rotina/job para expiração, registrar em E12.x (sem implementar aqui)
9.8.2 Motivos de inactive para marketing (trial_expired vs churn)
• Status: Concluído (definição)
• Objetivo: segmentar inactive sem criar novo status (motivo vive na camada comercial).
• Campo (camada comercial): commercial.inactive_reason
• Valores: trial_expired | churn | payment_failed | null (payment_failed opcional)
• Regra: relevante apenas quando accounts.status = inactive (senão null/ignorar).
• Atribuição (definição)
• trial expirou ⇒ trial_expired
• cancelamento/abandono ⇒ churn
• (opcional) falha cobrança ⇒ payment_failed
• QA (conceitual)
• não altera accounts.status; não vaza para enums/allowlists de status; distingue trial_expired vs churn.
9.8.3 Exec: Remover drift trial do runtime + docs
• Status: Concluído (04/02/2026)
• Objetivo: remover trial como status (drift) do runtime e alinhar docs; trial permanece apenas como commercial.kind='trial' (E9.8.1).
• Implementado (runtime): removido trial de tipos/allowlists/condicionais/UI onde aparecia como status.
9.8.4 Persistência/consulta de commercial.inactive_reason (CRM/relatórios)
• Status: Pendente
• Objetivo: decidir se/como o motivo precisa ser persistido/consultável (BD/pipeline/CRM) e impactos (migrations/rollback se aplicável).
• Dependências: E9.8.2, E9.8.1
9.8.5 Persistência do sinal comercial (trial/entitlements) — expires_at
• Status: Briefing
• Objetivo: decidir onde persiste o sinal comercial (trial/plano), em especial commercial.expires_at, e definir o destino de accounts.trial_ends_at.
• Decisão esperada (fechada):
• Opção A: reaproveitar accounts.trial_ends_at como commercial.expires_at (formalizar contrato e evitar drift).
• Opção B: criar outra persistência para o comercial e então deprecar/remover accounts.trial_ends_at com migration + rollback.
• Regra de agora (legado): manter accounts.trial_ends_at como legado por enquanto (não mexer neste momento).
• Dependências: E9.8.1 (contrato do sinal comercial); E9.8.3 (remoção do drift trial no runtime/docs).
• Fora de escopo: billing/checkout; alterar accounts.status; mexer em accounts.trial_ends_at neste momento.

10. E10 — Account Dashboard (UX)

10.1 Status
• Em andamento (nova definição)

10.2 Objetivo
• Consolidar experiência pós-login do usuário principal
• Incluir header unificado, troca de contas, persistência e telemetria

10.3 Account Dashboard UX (ex-E7.2)
10.3.1 Status
• 100% concluído (29/10/2025)
10.3.2 Versão
• Roadmap 1.4
10.3.3 Objetivos
• Refinar UX e comportamento multi-conta no Account Dashboard
• Consolidar persistência da última conta e previsibilidade no pipeline público/privado
10.3.4 Implementado
• Componentes AccountSwitcher, AccountSwitcherTrigger, AccountSwitcherList
• Hooks useAccountSwitcher, useUserAccounts
• Header unificado com nome da conta e avatar
• Persistência da última conta via cookie (90d, HttpOnly)
• Leitura do cookie no gateway /a/home para redirecionar para /a/{account}
• Definição do cookie no SSR de /a/[account] quando allow=true
• Middleware usado para limpeza do cookie quando necessário (clear_last=1)
• Integração UserMenu + AccessProvider
• Telemetria (account_switcher_open, account_selected, create_account_click)
10.3.5 QA Validado
• Known issue (produção, multi-contas): last account não reabre consistentemente a última conta após troca de conta e/ou após logout/login
• Troca de conta (UI) e navegação para /a/{account}
• Ocultação automática quando há ≤1 conta
• Comportamento mobile/touch
• SSR deny → público seguro
10.3.6 Valor agregado
• UX limpa e previsível
• Pipeline público/privado estável
• Componentes desacoplados e fáceis de manter
10.3.7 Próxima revisão
• UX Partner Dashboard

06/02/2026 15:58 — E10.4 ajustado (alinhado ao fluxo ponta a ponta)

10.4 Onboarding mínimo + Vitrine (pending_setup — setup incompleto)
• Status: Briefing
• Escopo: Entregar o fluxo ponta a ponta de “Primeiros passos” no dashboard da conta (/a/[account]) quando `accounts.status=pending_setup` e `setup_completed_at IS NULL`: exibir tela com formulário inline, validar campos (incl. regras condicionais), salvar com estados/erros (loading, validação inline, erro sistêmico com retry), marcar setup concluído e redirecionar para o E10.5.
• Dependências: E10.4.1 (infra do marcador `setup_completed_at`), E10.4.2 (setter idempotente do setup concluído), E10.4.3 (política do marcador), E10.4.4 (campos + validações), E10.4.5 (decisão + contrato de persistência dos dados do onboarding), E10.4.6 (exec de persistência conforme E10.4.5), E9.8.1 (trial/entitlements — apenas CTA/roteamento).
• Nota: ao setar `setup_completed_at`, a conta continua `pending_setup` e passa ao fluxo 10.5 (pós-setup sem plano/trial).

10.4.1 Indicador de setup concluído (infra)
• Status: Concluído (30/01/2026)
• Implementado:
• Marcador por conta accounts.setup_completed_at (timestamptz, NULL)
• Exposição no Access Context: account_setup_completed_at
• Ajuste não-regressão no Access Context: hardening de allow (boolean, nunca NULL) e remoção de trial do allowlist
• Migração: supabase/migrations/0003__accounts_setup_completed_at.sql

10.4.2 Setup concluído (MVP v0 — Exec)
• Status: Concluído (31/01/2026)
• Regra (1 linha): setup concluído v0 = “Salvar/Confirmar” + accounts.name não vazio + accounts.name ≠ 'Conta ' || subdomain.
• Set do marcador: chamar setSetupCompletedAtIfNull(accountId) somente no evento, se regra ok.
• QA mínimo: incompleto (não seta) / completo (pode setar) / reentrada (idempotente).
• Assunção a validar: padrão provisório do nome da conta ('Conta ' || subdomain) é o padrão real de criação.
• Pendência: abrir E10.4.4 (dados mínimos v1: nicho/WhatsApp/outros).

10.4.3 Política do marcador setup_completed_at (MVP)
• Status: Briefing
• Objetivo: definir política operacional do marcador (set/re-set/unset) no MVP, sem mexer em accounts.status.
• Saída esperada: política explícita (ex.: “once set, never unset”) + invariantes + QA conceitual mínimo.

10.4.4 Onboarding: dados mínimos v1 (nicho/WhatsApp e outros)
• Status: Briefing
• Objetivo: definir obrigatórios/opcionais (v1) e o contrato de armazenamento/validações, sem inventar campos.
• Escopo: contrato de armazenamento + validações + impactos no onboarding (sem mexer em accounts.status).

10.5 Vitrine pós-setup sem plano/trial (pending_setup — setup concluído)
• Status: Briefing
• Escopo: UX/CTAs para conta em pending_setup quando account_setup_completed_at IS NOT NULL (setup ok; falta ativar trial/plano).
• Dependências: E10.4.1 (exposição do marcador no Access Context), E10.5.1 (matriz preparação vs produtivo + enforcement), E9.8.1 (trial/entitlements).
• Nota: não muda accounts.status; active permanece “serviço ligado (trial/plano)”.

10.5.1 Matriz “preparação vs produtivo” + enforcement
• Status: Briefing
• Objetivo: fechar lista de ações/rotas produtivas vs preparação e onde bloquear no servidor (SSR + ações), para não depender só de UI.
• Saída esperada: matriz fechada + pontos de enforcement + QA mínimo (não-regressão).

11. E11 — Gestão de Usuários e Convites

11.1 Status
• Planejado

11.2 Escopo
• UI /a/[account]/members
• Convites via email com tokens
• Controle de papéis (Admin, Editor, Viewer)

11.3 Regras
• Viewer não convida
• Admin pode convidar e revogar

12. E12 — Admin Dashboard

12.1 Status
• Em desenvolvimento

12.2 Objetivo
• Consolidar operações administrativas e consultivas em um painel central
• Permitir gestão de contas, prospects, tokens e relatórios

12.3 Escopo geral
• Centralizar acesso de administradores e consultores
• Unificar geração de tokens, coleta de dados de clientes e controle de status das contas
• Servir como núcleo operacional das contas consultivas (pré e pós-venda)
• Integrar com Billing Engine (E9) e Account Dashboard (E10)

12.4 Platform Admin (Núcleo de Acesso)
12.4.1 Status
• Implementado
12.4.2 Escopo
• Helper is_platform_admin() e validações RLS específicas
• Rate limits diferenciados para operações administrativas
• Middleware e guards (requirePlatformAdmin) para rotas /admin/**
12.4.3 Critérios de Aceite
• Apenas usuários platform_admin=true ou super_admin
• Todas as ações administrativas auditadas em audit_logs

12.5 Painel de Tokens / Configurador de Conta
12.5.1 Status
• Em evolução
12.5.2 Escopo
• Evoluir /admin/tokens para configurador completo de contas consultivas
• Coleta de dados do cliente (CNPJ, contato, segmento, dores e metas)
• Seleção de plano base (Lite, Pro, Ultra) e definição de recursos personalizados (grants)
• Snapshot de recursos e preço conforme reunião consultiva
• Token em modos onboard (antes da entrega) ou handoff (após LP pronta)
12.5.3 Critérios de Aceite
• Token gerado apenas após configuração completa
• Conta criada com grants e preço definidos (snapshot)
12.5.4 Integrações
• Billing Engine (E9)
• Account Dashboard (E10)

12.6 Painel de Contas / Prospects / Status
12.6.1 Status
• Planejado
12.6.2 Escopo
• Listagem e filtro de contas ativas, pendentes e prospects (pré-token)
• Campos principais (empresa, CNPJ, responsável, segmento, status, consultor)
• Funções (visualizar, editar, reenviar token, gerar nova reunião)
12.6.3 Critérios de Aceite
• Status sincronizado (draft, token_sent, active)
• Filtros por consultor, data e status

12.7 Relatórios e Auditoria Consultiva
12.7.1 Status
• Planejado
12.7.2 Escopo
• Monitoramento de criação e ativação de contas consultivas
• Relatórios de uso, planos e recursos customizados
• Logs de auditoria de tokens, billing e alterações de grants
12.7.3 Critérios de Aceite
• Métricas por consultor e por cliente
• Exportação CSV/JSON
12.7.4 Integrações
• Auditoria e Drift (E9.7)

13. E13 — Partner Dashboard

13.1 Status
• Planejado

13.2 Escopo
• Painel de agências e parceiros
• Branding, gestão de clientes, relatórios
• Integração futura com Partner API

14. E14 — Workspace Dashboard

14.1 Status
• Planejado

14.2 Escopo
• Perfil e preferências do usuário
• Seleção de conta ativa
• Integração com Access Context

15. E15 — Usuário e Membership (B1)

15.1 Status
• Concluído

15.2 Escopo
• Definir Usuário vs Membership (vínculo por conta).
• Definir status do membership: pending | active | inactive | revoked.
• Regra única: pending → active somente via claim/aceite de convite.
• Status é por membership (o mesmo usuário pode ter status diferentes em contas diferentes).
• UX por status (snapshot): bloqueios por membership levam a telas dedicadas /auth/confirm/* (sem “deny genérico”).
• Usuário autenticado sem membership: segue o fluxo de “primeiro acesso” (auto 1ª conta vitrine) e retorna ao dashboard (ver E5/E8)..
15.2.1 Referências
• Regras técnicas do gate/adapters: docs/base-tecnica.md
• Contrato/DB (membership/status): docs/schema.md

15.3 Critérios de conclusão
• Gate SSR diferencia corretamente todos os status de membership (UX dedicada por status).
• Não existe “atalho” que ative membership fora do claim/aceite oficial.
• Usuário autenticado sem membership não fica bloqueado (fluxo de 1ª conta vitrine concluído) (ver E5/E8).

15.4 Dependências resolvidas
• Alinhamento com lifecycle de contas (vitrine pending_setup como entrada padrão) (ver E16).
• Hardening do lifecycle de accounts.status aplicado (detalhes/evidências em docs/schema.md)..

16. E16 — Accounts

16.1 Status
• Concluído

16.2 Objetivo
• Definir o lifecycle de **contas** e o comportamento esperado no dashboard (Produto + UX).
• Manter **billing/trial/entitlements** fora de `accounts.status` (ver E9).

16.3 Status de conta (definição prática)

16.3.1 `pending_setup` (vitrine/marketing)
• Entra no dashboard e navega em modo vitrine.
• Vê demo/placeholder do produto.
• Não cria/publica/ativa recursos com custo enquanto não estiver `active`.
• CTAs típicos: “Ativar/Assinar” (self-serve) e “Falar com suporte/consultor” (consultiva).

16.3.2 `active` (operação normal)
• Uso normal do dashboard e recursos conforme plano/grants.

16.3.3 `inactive` (bloqueio por pagamento — reversível)
• Acesso restrito com explicação clara do motivo (pagamento).
• CTA: reativar/pagar.
• Política definida: despublicar após grace period (MVP: 7 dias).
• Enforcement automático fica para caso de uso operacional (Admin/Jobs).

16.3.4 `suspended` (bloqueio admin)
• Acesso restrito com explicação clara do motivo (bloqueio administrativo).
• CTA: contatar suporte.
• Política definida: despublicar imediato.
• Enforcement automático fica para caso de uso operacional (Admin/Jobs).

16.4 Regras de produto (alto nível)
• Bloqueio por conta é independente do vínculo do usuário: mesmo com acesso “ativo” à conta, pode haver restrição por status da conta.
• Trial comercial não é status de conta; é estado de plano/assinatura (ver E9).

16.5 Transições oficiais (lifecycle)
• `pending_setup → active`
• Self-serve: evento de ativação de plano/assinatura (E9).
• Consultiva: ativação manual operacional (E12/E7).
• `active → inactive` (evento de billing) (E9).
• `inactive → active` (reativação) (E9/E12).
• `* → suspended` e `suspended → active` (admin/operacional) (E12).

16.6 UX por status (snapshot)
• `inactive`: tela de conta inativa com CTA reativar/pagar.
• `suspended`: tela de conta suspensa com CTA suporte.
• Observação: detalhes de rotas/gate e regras técnicas ficam em `docs/base-tecnica.md` (ver também E4/E8).

16.7 QA e evidência (snapshot)
• Confirmar que o produto não apresenta “deny genérico” para `inactive/suspended`.
• Confirmar que contas novas “nascem” em `pending_setup`.
• Detalhes de contrato/DB e evidências de hardening ficam em `docs/schema.md`.

16.8 Casos relacionados / drifts (owners)
• E9 (H): trial/entitlements (remover hardcode antigo quando houver fonte real).
• E12 (G): enforcement operacional (jobs) de despublicação/retention/grace period e settings configuráveis.
• E10: refinamento da vitrine `pending_setup` (mensagens/CTAs/limites detalhados) sem mudar lifecycle.

99. Changelog
v1.5.15 (04/02/2026)
• E9.8.3 marcado como Concluído (remoção do drift trial do runtime + alinhamento de docs; sem migrations; smoke test em preview e produção).
v1.5.14 (03/02/2026)
• Adicionado E9.8.5 para decidir a persistência do sinal comercial (commercial.expires_at) e o destino de accounts.trial_ends_at (manter como legado até decisão).
v1.5.13 (02/02/2026)
• E9.8.2 concluído (definição): commercial.inactive_reason com trial_expired e churn (opcional payment_failed), sem alterar accounts.status.
• Criado E9.8.4 (pendente): decisão sobre persistência/consulta do motivo para CRM/relatórios
v1.5.12 (01/02/2026)
• Reestruturado o fluxo pending_setup por subestado via account_setup_completed_at, separando 10.4 (setup incompleto: IS NULL) e 10.5 (pós-setup sem plano/trial: IS NOT NULL).
• Atualizado 10.4 para focar em UX/CTAs do subestado “setup incompleto” e registrar a transição para 10.5 ao setar setup_completed_at (sem mudar accounts.status).
• Registrados 10.4.1 e 10.4.2 como Concluídos (infra do marcador + regra v0 executável de setup concluído), com dependências e pendência explícita de dados mínimos v1.
• Mantidos como Briefing: 10.4.3 (política do marcador), 10.4.4 (dados mínimos v1: nicho/WhatsApp/outros) e criado 10.5.1 (matriz “preparação vs produtivo” + enforcement servidor).
• Ajustadas dependências de 10.4 e 10.5 para incluir E9.8.1 apenas como referência de CTA/roteamento (sem implementar entitlements aqui).
v1.5.11 (31/01/2026)
• Atualizado 9.8.1 com definição do trial como entitlement (início pós-setup; expiração `active → inactive`) e contrato mínimo do sinal comercial consumido por SSR/gate/UX.
• Adicionado 9.8.2 (Briefing) para motivos de `inactive` (trial_expired vs churn) para segmentação de marketing.
• Adicionado 9.8.3 (Briefing) para execução: remoção do drift `trial` no runtime + alinhamento de docs ao estado final.
v1.5.10 (31/01/2026)
• Adicionado E10.4.2 (setup concluído v0 — regra executável) com evento “Salvar/Confirmar” e chamada idempotente do marcador.
• Adicionado E10.4.3 (Briefing) para política do marcador setup_completed_at (MVP).
• Adicionado E10.4.4 (Briefing) para matriz “preparação vs produtivo” + enforcement no servidor.
• Adicionado E10.4.5 (Briefing) para dados mínimos v1 (nicho/WhatsApp/outros) com contrato de armazenamento/validações.
v1.5.9 (30/01/2026)
• Adicionado E10.4.1 (infra do marcador setup_completed_at) como pré-requisito para diferenciar subestados de pending_setup.
• Ajustado 9.8.1 para manter foco em entitlements; remoção do hardcode/allowlist de trial no Access Context foi concluída em E10.4.1.
• Adicionado placeholder do E10.4 (Briefing) com dependências (E10.4.1, E9.8.1).
v1.5.8 (27/01/2026)
• Adicionado E16 (Accounts) para consolidar lifecycle de accounts.status (definições, transições e UX/CTAs), com referências para docs/base-tecnica.md e docs/schema.md (anti-drift).
• Ajustado E4.2 para remover redundâncias e focar no fluxo/UX do gateway e roteamentos, adicionando subitem de referências numerado.
• Ajustado E8 para focar em Access Context como decisão única e remover sobreposição com E4/E15/E16, com referências numeradas.
• Ajustado E15 (15.2–15.4) para reduzir redundâncias, apontar dependências para E16 e reforçar referências para docs/base-tecnica.md e docs/schema.md (anti-drift).
v1.5.7 (27/01/2026) — F1.1: CTA Criar conta no /a/home direciona para signup
• E4: registrado que o CTA Criar conta no /a/home (sem sessão) navega para /auth/sign-up (remoção de placeholder/modal).
v1.5.6 (27/01/2026) — F2: Auto 1ª conta (pending_setup) e atualização do fluxo pós-confirmação
• E4/E5: usuário autenticado sem membership passa a auto-criar 1ª conta pending_setup e cair em /a/[account] (modo vitrine).
• E8/E15: registrada a regra “sem membership cria; com qualquer membership não cria” e alinhado o tratamento de usuário sem membership.
• E5: registrada pendência de regressão em /auth/forgot-password (produção).
v1.5.3 (21/01/2026) — Gate SSR: UX de bloqueio por status (membership/conta)
• E4: Gate SSR roteia bloqueios de membership para rotas dedicadas e diferencia fallback de conta bloqueada por status (inactive/suspended) com páginas específicas.
• E15: Detalhada a UX/CTAs e rotas por status de membership, incluindo tratamento de usuário autenticado sem membership (clear_last).

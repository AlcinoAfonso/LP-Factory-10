0. Introdução

0.1 Cabeçalho
• Data: 23/01/2026
• Versão: v1.5.4
0.2 Contrato do documento (parseável)
• Este documento registra o roadmap e o histórico de execução por marcos (E1, E2, ...).
0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo
0.2.2 ALLOWLIST_RELEVANCIA
• MARCOS: Itens E* com status, escopo, critérios e pendências; quando fizer sentido para este documento, incluir também sub-seções de Fluxos e Cenários (numeradas como subseções do próprio marco) descrevendo comportamento/decisões de UX e regras.
• FASES: Agrupamentos estratégicos do roadmap (alto nível).
• MIGRACOES: Movimentos de itens (ex.: E7.2 → E10.1) apenas como referência histórica.
• Microcopy (guia): registrar mensagens-chave + intenção (segurança, anti-abuso, clareza), evitando texto final longo; detalhar mais apenas quando o comportamento depender da redação.
0.2.3 ALLOWLIST_CHANGELOG (blocklist mínima)
• PROIBIDO: bullets administrativos (ex.: “atualizado cabeçalho/data/versão”).
0.2.4 ESTILO (opcional)
• Estado final (snapshot por marco), sem narrativa longa.
• Frases curtas; preferir bullets; sem tabelas; sem code fences.

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

4. E4 — Account Dashboard (Infraestrutura SSR)

4.1 Status
• Concluído

4.2 Implementado
4.2 Implementado
• Gateway /a/home (público sem sessão; com sessão resolve conta)
• Redirect /a → /a/home
• Rota privada /a/[account]
• Middleware + SSR gate (getAccessContext)
• Persistência last account via cookie (definição em /a/[account] e leitura em /a/home)
• Página neutra /auth/confirm/info
• Bloqueio por membership no gate SSR com rotas dedicadas: /auth/confirm/pending | /auth/confirm/inactive | /auth/confirm/revoked
• Fallback de conta bloqueada diferenciado por status quando FORBIDDEN_ACCOUNT:
• inactive → /auth/confirm/account/inactive
• suspended → /auth/confirm/account/suspended
• fallback → /auth/confirm/account
4.3 Critérios de Aceite
• Redirect /a → /a/home → /a/{account} (quando houver sessão e conta resolvida)
• Sessão validada antes do render
• Deny seguro com logs estruturados

5. E5 — UI/Auth Account Dashboard

5.1 Status
• Concluído

5.2 Implementado
• Tela de Login (page-based em /auth/login)
• Tela "Esqueci minha senha" (/auth/forgot-password)
• Recovery sem “Continuar”: link do e-mail abre direto em /auth/update-password; submit confirma e troca senha via POST /auth/confirm (anti-scanner)
• Cooldown UI do reset: 60s com contador e botão desabilitado após solicitar
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
• v_access_context_v2 (fonte única de acesso)
• AccessProvider com account.name
• Logs canônicos (access_context_decision)

8.3 Critérios de Aceite
• Bloqueio correto para contas/membros inativos
• Redirect seguro e rastreável

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
• Definição formal de usuário vs membership.
• Definição dos status de membership: pending, active, inactive, revoked.
• Regra única de ativação: pending → active somente via claim/aceite de convite.
• Confirmação de que status é por membership, não por usuário global.
• UX definida por status (gate SSR + rotas /auth/confirm/*):
• active: acesso normal ao dashboard (/a/[account]).
• pending: redirect /auth/confirm/pending — mensagem “Convite pendente”; CTAs: “Pedir reenvio do convite”, “Trocar de conta”, “Voltar para login”.
• inactive: redirect /auth/confirm/inactive — mensagem “Acesso suspenso”; CTAs: “Solicitar reativação”, “Trocar de conta”, “Voltar para login”.
• revoked: redirect /auth/confirm/revoked — mensagem “Acesso removido”; CTAs: “Solicitar novo convite”, “Trocar de conta”, “Voltar para login”.
• Tratamento de usuário autenticado sem membership: redirect para /a/home?clear_last=1 (evita loop de last account).

15.3 Critérios de conclusão
• Gate SSR diferencia corretamente todos os status de membership.
• Usuário sem membership é tratado como “logado sem conta”.
• Não existe ativação automática paralela fora do fluxo de claim.

15.4 Dependências resolvidas
• Alinhado com B2-MVP (pending_setup como vitrine).
• Bloqueio de drifts críticos identificados no QA do B1.
• Hardening executado (B2): public.accounts.status com DEFAULT 'pending_setup'::text e NOT NULL (produção).

99. Changelo
v1.5.3 (21/01/2026) — Gate SSR: UX de bloqueio por status (membership/conta)
• E4: Gate SSR roteia bloqueios de membership para rotas dedicadas e diferencia fallback de conta bloqueada por status (inactive/suspended) com páginas específicas.
• E15: Detalhada a UX/CTAs e rotas por status de membership, incluindo tratamento de usuário autenticado sem membership (clear_last).

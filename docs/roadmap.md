0. Introdução

0.1 Cabeçalho
• Data da última atualização: 05/11/2025
• Documento: LP Factory 10 — Roadmap v1.5.0 — Referência estratégica ativa
0.2 Contrato do documento (parseável)
• Este documento registra o roadmap e o histórico de execução por marcos (E1, E2, ...).
0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo
0.2.2 ALLOWLIST_RELEVANCIA
• MARCOS: Itens E* com status, escopo, critérios e pendências.
• FASES: Agrupamentos estratégicos do roadmap (alto nível).
• MIGRACOES: Movimentos de itens (ex.: E7.2 → E10.1) apenas como referência histórica.
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
2.3 Critérios de Aceite
• Login funcional e seguro
• Reset de senha com expiração
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
• Rota canônica /a/[account]
• Middleware + SSR gate (getAccessContext)
• Página neutra /auth/confirm/info

4.3 Critérios de Aceite
• Redirect /a → /a/[account]
• Sessão validada antes do render
• Deny seguro com logs estruturados

5. E5 — UI/Auth Account Dashboard

5.1 Status
• Concluído

5.2 Implementado
• Forms de login/reset/update-password (SULB)
• Mensagens neutras e bloqueios progressivos

5.3 Critérios de Aceite
• Modal fecha apenas em sucesso
• Erros genéricos, UX segura

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


## E8 — Access Context & Governança
**Status:** ✅ Concluído (03/10/2025)

- **Implementado:**
  - `v_access_context_v2` (fonte única de acesso)
  - `AccessProvider` com `account.name`
  - Logs canônicos (`access_context_decision`)
- **Critérios de Aceite:**
  - Bloqueio correto para contas/membros inativos
  - Redirect seguro e rastreável

---

## E9 — Billing Engine & Stripe Sync
**Status:** 🧩 Em desenvolvimento  

- **Objetivo:** Unificar a estrutura de cobrança (manual, híbrida e automatizada) e o controle de recursos (grants), permitindo que todas as contas — inclusive as consultivas — operem sob um modelo único de billing e planos com snapshot.  

- **Escopo geral:**
  - Definir o modelo técnico de planos, recursos e billing snapshot.  
  - Implementar o motor de grants dinâmicos (`model_grants` + `get_feature()`).  
  - Integrar com Stripe apenas como uma das modalidades (`billing_mode='stripe'`).  
  - Garantir compatibilidade total com o fluxo de criação de contas consultivas (E7).  

---

### E9.1 — Grants e Features
**Status:** 🧩 Em evolução  

- **Escopo:**
  - Criar tabela `model_grants` para controlar recursos e limites por conta.  
  - Implementar função `get_feature(account_id, feature_key, lp_id?, section_id?)` com fallback: `section > lp > account > plan > default`.  
  - Adicionar colunas `origin_plan_id`, `origin_plan_version`, `locked` e `limit_json` para rastreabilidade.  
- **Critérios de Aceite:**
  - Cada conta tem seu conjunto de grants independente do plano.  
  - Mudanças em planos não alteram contas existentes automaticamente (snapshot).  
  - Sincronização com o plano atual apenas via ação explícita (“Atualizar com plano atual”).  
- **Integrações:**
  - E7.1 (Conta Consultiva Update) — cria os grants no onboarding consultivo.  
  - E12.2 (Painel Admin) — interface de seleção e visualização de recursos.  

---

### E9.2 — Billing Snapshot e Ciclos
**Status:** 🧩 Em planejamento  

- **Escopo:**
  - Adicionar campos em `accounts`:  
    - `billing_mode enum('stripe','manual','hybrid')`  
    - `plan_price_snapshot numeric`  
    - `billing_recurring_snapshot numeric`  
    - `billing_cycle_start`, `billing_cycle_end`, `next_adjustment_at`.  
  - Implementar regra de *grandfathering*: contas antigas mantêm o preço e recursos vigentes na adesão.  
  - Permitir reajustes apenas via upgrade, downgrade ou contrato.  
  - **Cada conta grava seu snapshot de preço e recursos no momento da criação**, preservando histórico e independência de alterações futuras nos planos.  

- **Critérios de Aceite:**
  - Contas consultivas e SaaS usam a mesma estrutura.  
  - **Os campos `plan_price_snapshot` e `billing_recurring_snapshot` são sempre específicos por conta (snapshot no ato da adesão).**  
  - Preços e recursos registrados por snapshot no momento da criação.  
  - Histórico auditável de alterações de preço e ciclo.  

- **Integrações:**
  - E7 (Conta Consultiva) — snapshot inicial.  
  - E12 (Admin Dashboard) — visualização e edição dos dados de billing.  
  

---

### E9.3 — Stripe Sync (Automação SaaS)
**Status:** 🟡 Planejado  

- **Escopo:**
  - Implementar webhooks `checkout.session.completed` e `subscription.updated`.  
  - Sincronizar `billing_status`, `subscription_id` e `subscription_current_period_end`.  
  - Atualizar tabela `plan_price_map` com planos e valores atuais.  
  - Suportar upgrade/downgrade automático para planos SaaS.  
- **Critérios de Aceite:**
  - Billing automático ativo apenas em contas com `billing_mode='stripe'`.  
  - Auditoria das transições de status (trial, active, canceled).  
  - Integração validada com Supabase Stripe Sync Engine.  

---

### E9.4 — Auditoria e Drift
**Status:** 🟡 Planejado  

- **Escopo:**
  - Criar relatório comparativo entre grants/preços da conta e plano original.  
  - Detectar divergências de configuração (“drift”) e registrar em `audit_logs`.  
  - Expor métricas de billing e recursos (limites, upgrades, consumo).  
- **Critérios de Aceite:**
  - Logs automáticos para toda atualização de plano, grant ou ciclo de billing.  
  - Painel de auditoria integrado ao Admin Dashboard (E12.4).  
  - Exportação CSV/JSON.  

---

**Compatibilidade:**  
O Billing Engine (E9) é o núcleo técnico que garante a coerência entre **Conta Consultiva (E7)**, **Admin Dashboard (E12)** e **Account Dashboard (E10)** — fornecendo a base para a futura operação SaaS do LP Factory 10.  

---

## E10 — Account Dashboard (UX)
**Status:** 🟡 Em andamento (nova definição)

- **Objetivo:** Consolidar a experiência pós-login do usuário principal.  
  Inclui header unificado, troca de contas, persistência e telemetria.

### E10.1 — Account Dashboard UX (ex-E7.2)
**Status:** ✅ 100% concluído (29/10/2025)  
**Versão:** Roadmap 1.4

- **Objetivo:** Refinar UX e comportamento multi-conta no Account Dashboard, consolidando persistência da última conta e previsibilidade no pipeline público/privado.
- **Implementado:**
  - Componentes `AccountSwitcher`, `AccountSwitcherTrigger`, `AccountSwitcherList`
  - Hooks `useAccountSwitcher`, `useUserAccounts`
  - Header unificado com nome da conta e avatar
  - Persistência da última conta via cookie (30d, HttpOnly)
  - Integração `UserMenu` + `AccessProvider`
  - Middleware simplificado (gravação e leitura de cookie)
  - Telemetria (`account_switcher_open`, `account_selected`, `create_account_click`)
- **QA Validado:**
  - ✅ Troca de conta, logout e reabertura (/a)
  - ✅ Persistência última conta 30d
  - ✅ Ocultação automática quando há ≤1 conta
  - ✅ Comportamento mobile/touch
  - ✅ SSR deny → público seguro
- **Valor agregado:**
  - UX limpa e previsível
  - Pipeline público/privado estável
  - Componentes desacoplados e fáceis de manter
- **Próxima revisão:** E10.2 (UX Partner Dashboard)

---

## E11 — Gestão de Usuários e Convites
**Status:** 🟡 Planejado

- UI `/a/[account]/members`
- Convites via email com tokens
- Controle de papéis (`Admin`, `Editor`, `Viewer`)
- Critério: `Viewer` não convida, Admin pode revogar

---

## E12 — Admin Dashboard
**Status:** 🧩 Em desenvolvimento  

- **Objetivo:** Consolidar todas as operações administrativas e consultivas em um único painel central, permitindo ao time LP Factory gerenciar contas, prospects, tokens e relatórios de forma integrada.

- **Escopo geral:**
  - Centralizar o acesso de administradores e consultores.  
  - Unificar geração de tokens, coleta de dados de clientes e controle de status das contas.  
  - Servir como núcleo operacional das contas consultivas (pré e pós-venda).  
  - Integrar com o Billing Engine (E9) e Account Dashboard (E10) para visibilidade completa do ciclo de clientes.

---

### E12.1 — Platform Admin (Núcleo de Acesso)
**Status:** ✅ Implementado (migrado do E7.1)  

- **Escopo:**
  - Helper `is_platform_admin()` e validações RLS específicas.  
  - Rate limits diferenciados para operações administrativas.  
  - Middleware e guards (`requirePlatformAdmin()`) para rotas `/admin/**`.  
- **Critérios de Aceite:**
  - Apenas usuários com flag `platform_admin=true` ou `super_admin` podem acessar o painel.  
  - Todas as ações administrativas auditadas em `audit_logs`.  
- **Valor agregado:**
  - Cria a base de segurança e controle de permissões do Admin Dashboard.  

---

### E12.2 — Painel de Tokens / Configurador de Conta
**Status:** 🧩 Em evolução  

- **Escopo:**
  - Evoluir o painel `/admin/tokens` para **configurador completo de contas consultivas**.  
  - Coleta de dados do cliente (CNPJ, contato, segmento, dores e metas).  
  - Seleção de plano base (Lite, Pro, Ultra) e definição de recursos personalizados (grants).  
  - Snapshot de recursos e preço definidos conforme a reunião consultiva.  
  - **Nota:** Token em modos `onboard` (antes da entrega) ou `handoff` (após LP pronta).  

- **Critérios de Aceite:**
  - Token gerado apenas após configuração completa da conta.  
  - Conta criada com grants e preço definidos (snapshot).  

- **Integrações:**
  - E9 (Billing Engine)  
  - E10 (Account Dashboard)

---

### E12.3 — Painel de Contas / Prospects / Status
**Status:** 🟡 Planejado  

- **Escopo:**
  - Listagem e filtro de contas ativas, pendentes e prospects (pré-token).  
  - Campos principais: nome da empresa, CNPJ, responsável, segmento, status da conta e consultor responsável.  
  - Funções: visualizar, editar, reenviar token, gerar nova reunião.  
- **Critérios de Aceite:**
  - Todas as contas e prospects exibidos com status sincronizado (draft, token_sent, active).  
  - Filtros por consultor, data e status.  

---

### E12.4 — Relatórios e Auditoria Consultiva
**Status:** 🟡 Planejado  

- **Escopo:**
  - Monitoramento de criação e ativação de contas consultivas.  
  - Relatórios de uso, planos e recursos customizados.  
  - Logs de auditoria de tokens, billing e alterações de grants.  
- **Critérios de Aceite:**
  - Métricas visíveis por consultor e por cliente.  
  - Exportação CSV/JSON.  
  - Integração futura com o módulo de observabilidade (E9.4).  

---

## E13 — Partner Dashboard
**Status:** 🟋 Planejado

- Painel de agências e parceiros
- Branding, gestão de clientes, relatórios
- Integração futura com Partner API

---

## E14 — Workspace Dashboard
**Status:** 🟋 Planejado

- Perfil e preferências do usuário
- Seleção de conta ativa
- Integração com Access Context

---

## Fases Estratégicas

| Fase | Nome | Status | Descrição |
|------|------|---------|------------|
| 1 | Sistema de Acesso | ✅ | Login, reset, RLS, auditoria |
| 2 | Account Dashboard | 🟡 | UX completa (E10) |
| 3 | Dogfooding | 🟋 | Teste interno de LPs |
| 4 | Verticalização Piloto | 🟋 | Nicho inicial (ex: imobiliário) |
| 5 | Prospecção Consultiva | 🟋 | Modelo DWY (Do With You) |
| 6 | Expansão de Nichos | 🟋 | Múltiplos verticais |
| 7 | SaaS Automático | 🟋 | Self-service opcional |
| 8 | Parcerias e White Label | 🟋 | Rede de agências e afiliados |

---

**Última atualização:** 05/11/2025  


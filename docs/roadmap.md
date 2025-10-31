# LP Factory 10 — Roadmap 1.4
**Data:** 29/10/2025  
**Propósito:** Roteiro de implementação e visão estratégica do produto  
**Versão anterior:** 1.3 (18/10/2025)

---

## 📑 Sumário

- [E1 — Estrutura de Dados](#e1--estrutura-de-dados)
- [E2 — Núcleo de Acesso](#e2--núcleo-de-acesso)
- [E3 — Adapters Base](#e3--adapters-base)
- [E4 — Account Dashboard (Infraestrutura SSR)](#e4--account-dashboard-infraestrutura-ssr)
- [E5 — UI/Auth Account Dashboard](#e5--uiauth-account-dashboard)
- [E6 — UI Kit Provisório](#e6--ui-kit-provisório)
- [E7 — Conta Consultiva](#e7--conta-consultiva)
  - [E7.1 — Platform Admin](#e71--platform-admin)
  - [E7.3 — Conta Consultiva Express](#e73--conta-consultiva-express)
- [E8 — Access Context & Governança](#e8--access-context--governança)
- [E9 — Stripe Sync (Billing)](#e9--stripe-sync-billing)
- [E10 — Account Dashboard (UX)](#e10--account-dashboard-ux)
  - [E10.1 — Account Dashboard UX (ex-E7.2)](#e101--account-dashboard-ux-ex-e72)
- [E11 — Gestão de Usuários e Convites](#e11--gestão-de-usuários-e-convites)
- [E12 — Partner Dashboard](#e12--partner-dashboard)
- [E17 — Workspace Dashboard](#e17--workspace-dashboard)
- [Fases Estratégicas](#fases-estratégicas)

---

## E1 — Estrutura de Dados
**Status:** ✅ Concluído (03/10/2025)

- **Implementado:**
  - Tabelas: `accounts`, `account_users`, `audit_logs`, `plans`, `partners`, `partner_accounts`, `post_sale_tokens`
  - Views: `v_access_context_v2`, `v_account_effective_limits`, `v_account_effective_limits_secure`, `v_admin_tokens_with_usage`, `v_audit_logs_norm`
  - Constraints e índices otimizados
- **Critérios de Aceite:**
  - Multi-tenant funcional (subdomain/domain UNIQUE)
  - 1 owner ativo por conta
  - Auditoria automática
- **Pendências:** Nenhuma

---

## E2 — Núcleo de Acesso
**Status:** ✅ Concluído

- **Implementado:**
  - Autenticação email/senha (SULB)
  - Roles: `owner`, `admin`, `editor`, `viewer`, `super_admin`
  - RLS em todas as tabelas
  - Helpers: `is_super_admin`, `is_platform_admin`, `has_account_min_role`
- **Critérios de Aceite:**
  - Login funcional e seguro
  - Reset de senha com expiração
  - Auditoria ativa
- **Pendências:** futuras features (Magic Link, Social Login, 2FA)

---

## E3 — Adapters Base
**Status:** ✅ Concluído

- **Implementado:**
  - `accountAdapter`, `accessContextAdapter`, `adminAdapter`, `postSaleTokenAdapter`
  - Tipos normalizados (DB → TS)
  - Logs estruturados
- **Pendências:** Adapters de planos e LPs futuras (`planAdapter`, `landingPageAdapter`, `sectionAdapter`)

---

## E4 — Account Dashboard (Infraestrutura SSR)
**Status:** ✅ Concluído

- **Implementado:**
  - Rota canônica `/a/[account]`
  - Middleware + SSR gate (`getAccessContext`)
  - Página neutra `/auth/confirm/info`
- **Critérios de Aceite:**
  - Redirect `/a → /a/[account]`
  - Sessão validada antes do render
  - Deny seguro com logs estruturados

---

## E5 — UI/Auth Account Dashboard
**Status:** ✅ Concluído

- **Implementado:**
  - Forms de login/reset/update-password (SULB)
  - Mensagens neutras e bloqueios progressivos
- **Critérios de Aceite:**
  - Modal fecha apenas em sucesso
  - Erros genéricos, UX segura

---

## E6 — UI Kit Provisório
**Status:** ✅ Concluído

- **Implementado:**
  - Componentes `Button`, `Card`, `Input`, `Label`, `AlertBanner`
  - Base `shadcn/ui`
- **Pendências:** futura migração para Supabase Platform Kit

---

## E7 — Conta Consultiva
**Status:** ✅ Concluído (18/10/2025)

- **Escopo:**
  - Criação de contas via token pós-venda
  - Painel `/admin/tokens` (gerar, listar, revogar)
  - RPC `create_account_with_owner`
- **Critérios de Aceite:**
  - Conta criada com `contract_ref` e status `pending_setup`
  - Redirecionamento automático pós-onboard
  - Banner de setup visível
- **Pendências:** Refinamentos de UX migrados para E10.1

---

### E7.1 — Platform Admin
- Helper `is_platform_admin()`
- RLS e rate limit diferenciados
- **Pendência:** gestão visual de papéis

### E7.3 — Conta Consultiva Express
- Criação direta de conta e usuário pelo admin
- RPC `create_account_for_client_express()`
- Reset obrigatório no primeiro login
- **Status:** 🟡 Planejado

---

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

## E9 — Stripe Sync (Billing)
**Status:** 🟡 Em planejamento

- **Escopo MVP:**
  - Webhooks (`checkout.session.completed`, `subscription.updated`)
  - Colunas billing em `accounts`
  - Tabela `plan_price_map`
- **Critérios de Aceite:**
  - Plano ativo = billing_status=‘active’
  - Auditoria de transições

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

## E12 — Partner Dashboard
**Status:** 🟋 Planejado

- Painel de agências e parceiros
- Branding, gestão de clientes, relatórios
- Integração futura com Partner API

---

## E17 — Workspace Dashboard
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

**Última atualização:** 29/10/2025  
**Próxima revisão:** Após conclusão E10.1 (Account Dashboard UX)

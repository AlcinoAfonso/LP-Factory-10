0. Introdução

0.1 Cabeçalho
• Data: 13/02/2026
• Versão: v1.5.19

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
• ARTEFATOS_REPO: em marcos com execução, registrar também os paths exatos dos arquivos do repositório afetados no caso (criados, ajustados e excluídos), em bullets curtos, sem descrever “como foi feito”.
• ANTI_DRIFT_DB: não detalhar contrato de banco (tabelas/colunas/views/RPCs/triggers/policies); referenciar docs/schema.md.
• ANTI_DRIFT_REGRAS: não duplicar regras técnicas; referenciar docs/base-tecnica.md
• PROIBIDO_EXECUCAO_NO_CORPO: no corpo dos itens E é proibido registrar narrativa operacional de execução (PR/branch/CI/deploy), passos de QA, prints e relato “como foi feito”; registrar apenas estado final (snapshot) e critérios mínimos de aceite.*
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
9.6.3 Pós-venda
• Status: Concluído (definição)
• Escopo: eventos/estados de pós-venda e billing (ex.: trial iniciado, trial expirado, assinatura ativa, cancelamento, inadimplência).
• Importante: “status” aqui se refere a billing/subscription, e não a accounts.status.
• Regra: billing/subscription controla entitlements/permissões; accounts.status permanece como lifecycle do setup (ver E10.4.6/E10.4.2).

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
9.8.1 Trial como entitlement (trial não é status)
• Status: Concluído (definição)
• Regra (fonte de verdade): trial/plano controla apenas entitlements/permissões (ex.: “pode criar LPs”).
• Importante: trial/plano não define accounts.status.
• Pré-condição (pós-setup): conta já passou por setup concluído (ver E10.4.6/E10.4.2: setup concluído = accounts.status='active').
• Pós-expiração do trial (sem plano):
• Manter accounts.status='active' (nesta fase).
• Remover/zerar entitlements do trial (feature gating).
• UX esperada: “active persuasiva sem plano/trial” (ver E10.5).
• Nota (lifecycle futuro): transições para inactive/suspended ficam para um ciclo posterior, quando houver regra de churn/inadimplência/banimento formalizada.
• Dependência operacional: se exigir rotina/job para expiração, registrar em E12.x (sem implementar aqui)
9.8.2 Motivos de inactive (definição; não aplicado no runtime ainda)
• Status: Concluído (definição)
• Objetivo: catalogar motivos de “inactive” para futura ativação do lifecycle (ex.: churn, inadimplência, fraude, banimento, etc.).
• Estado atual (desde E10.4.6): inactive/suspended não são disparados por expiração de trial/plano nesta fase.
• Regra atual: expiração de trial/plano afeta entitlements, não accounts.status.
• Nota: quando o lifecycle for ativado, esta seção passará a ter enforcement no runtime (fora do escopo atual).
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

10.4 Primeiros passos (pending_setup — status-based)

• Status: Concluído (exec) (13/02/2026)
• Escopo: Entregar o fluxo ponta a ponta de “Primeiros passos” no dashboard da conta (/a/[account]) quando `accounts.status=pending_setup`: exibir formulário inline, validar campos (incl. regras condicionais), salvar com estados/erros (loading, validação inline, erro sistêmico com retry), persistir perfil v1, promover status (`pending_setup → active`) e redirecionar para o fluxo pós-setup.
• Dependências: E10.4.1 (infra do marcador `setup_completed_at` — deprecated; sem uso), E10.4.2 (setter idempotente do marcador — deprecated; sem uso), E10.4.3 (política do marcador — deprecated; sem uso), E10.4.4 (campos + validações), E10.4.5 (decisão + contrato de persistência dos dados do onboarding), E10.4.6 (exec de persistência conforme E10.4.5 + status-based), E9.8.1 (trial/entitlements — apenas CTA/roteamento).
• Nota (estado atual): setup concluído no MVP = `accounts.status=active` (status-based). `setup_completed_at/account_setup_completed_at` não devem ser usados em lugar nenhum (nem gating, nem fluxo, nem logs); ficam mantidos no DB apenas por segurança.

10.4.1 Indicador de setup concluído (infra)
• Status: Concluído (30/01/2026)
• Estado atual: deprecated (manter no DB por segurança; não usar/consumir em runtime/gating/fluxos/logs).
• Implementado:
• Marcador por conta accounts.setup_completed_at (timestamptz, NULL)
• Exposição no Access Context: account_setup_completed_at
• Ajuste não-regressão no Access Context: hardening de allow (boolean, nunca NULL) e remoção de trial do allowlist
• Migração: supabase/migrations/0003__accounts_setup_completed_at.sql
• Hardening da view (security_invoker=true) aplicado; ver schema” — útil só como “sinal” de execução, sem detalhar DB.

10.4.2 Setup concluído (MVP v0 — Exec)
• Status: Concluído (31/01/2026)
• Estado atual: deprecated (substituído por status-based em E10.4.6; não usar/consumir em runtime/gating/fluxos/logs).
• Regra v0 (deprecated): setup concluído v0 = “Salvar/Confirmar” + accounts.name não vazio + accounts.name ≠ 'Conta ' || subdomain.
• Set do marcador (infra; deprecated): chamar setSetupCompletedAtIfNull(accountId) somente no evento, se regra ok.
• QA mínimo (histórico): incompleto (não seta) / completo (pode setar) / reentrada (idempotente).
• Assunção a validar (histórico): padrão provisório do nome da conta ('Conta ' || subdomain) é o padrão real de criação.

10.4.3 Política do marcador de setup (MVP)
• Status: Concluído (06/02/2026)
• Estado atual: deprecated (substituído por status-based; não usar/consumir em runtime/gating/fluxos/logs).
• Objetivo (histórico): definir política operacional do marcador de setup no MVP como infra write-once, sem alterar lifecycle e sem alterar regras de acesso.
• Decisão (histórico/MVP): once set, never unset
• Permitido: NULL → timestamp
• Permitido: chamadas repetidas (idempotente; não sobrescreve)
• Proibido no MVP: overwrite/re-set, backfill/correção, reset/unset
• Evolução (histórico): correção/backfill/reset/unset somente via novo caso E10.4.x

10.4.4 Onboarding: dados mínimos v1 (nicho/WhatsApp e outros)
• Status: Concluído (definição) (06/02/2026)
• Campos v1 (Primeiros passos / inline):
• name (obrigatório)
• niche (opcional)
• preferred_channel (opcional; default = email; domínio: email | whatsapp)
• whatsapp (opcional; obrigatório se preferred_channel = whatsapp)
• site_url (opcional; link da LP/site)
• Nome padrão (regra simples): name não pode ser igual ao placeholder/default do input (string a confirmar no UI)
• Validações v1 (critérios mínimos):
• name: trim; obrigatório; erro inline se vazio ou se igual ao placeholder/default
• whatsapp (quando exigido): somente dígitos; 10–15 dígitos; erro inline se ausente/fora do critério
• site_url (se preenchido): URL web sem espaços iniciando com http:// ou https://; erro inline se inválido
• Microcopy (guia por intenção):
• name.required_or_default
• whatsapp.required_when_channel
• whatsapp.invalid
• site_url.invalid
• Nota: persistência/schema dos campos segue para E10.4.5 (decisão) e E10.4.6 (exec).

10.4.5 Onboarding: persistência dos dados mínimos v1 (perfil 1:1)
• Status: Concluído (definição) (07/02/2026)
• Decisão: persistir dados do onboarding/perfil em tabela dedicada 1:1 (account_profiles), não em novas colunas em accounts.
• Manter accounts.name no core (consumido pelas views/UX atuais).
• account_profiles (contrato mínimo v1):
• niche
• preferred_channel (default email, valores esperados email|whatsapp)
• whatsapp
• site_url (link)
• Evolução (fora do escopo): reservar billing/legal para futura 1:1 separada (ex.: account_billing_profiles).

10.4.6 Exec: persistência do perfil v1 + setup status-based
• Status: Concluído (13/02/2026)
• Setup concluído (fonte de verdade): `accounts.status=active` (promoção `pending_setup → active` com update condicional/idempotente no pós-save).
• “Primeiros passos” (Salvar e continuar): persiste `account_profiles` (v1), atualiza `accounts.name`, promove status e redireciona para a rota correta da conta (sem exigir logout/login).
• Access Context: v_access_context_v2 endurecido (seleção de conta/tenant mais robusta, fallback para “primeira conta” quando necessário e tratamento de conta/membro bloqueado/inativo).
• DB (exec): `account_profiles` criado com RLS/policies reais (ver docs/schema.md). `setup_completed_at/account_setup_completed_at` mantidos no DB apenas por segurança e não devem ser usados (nem runtime, nem gating, nem fluxo, nem logs).
• Observability mínima: logs canônicos `setup_*` com `request_id` no server action; regra “logs sem PII”; uso de revalidação de cache no pós-save antes do redirect.
• Supabase Auth (fora do repo): Redirect URLs do Preview ajustados (wildcard) e Email Templates de signup/reset ajustados para usar RedirectTo.
• ARTEFATOS_REPO (paths):
• Ajustados:
• app/a/[account]/actions.ts
• app/a/[account]/page.tsx
• src/lib/access/getAccessContext.ts
• src/lib/access/adapters/accessContextAdapter.ts
• src/lib/access/adapters/accountAdapter.ts
• Criados:
• src/lib/access/adapters/accountProfileAdapter.ts
• supabase/migrations/0004__account_profiles.sql

10.4.7 Refinar UX (pós-implementação E10.4)
• Status: Briefing
• Objetivo: corrigir fricções e inconsistências de UX identificadas após a execução do E10.4, sem alterar o objetivo do fluxo (concluir setup e seguir para E10.5).
• Escopo: ajustes de formulário, validação e microinterações na tela “Primeiros passos” (formulário inline).
• Dependências: E10.4.6 (exec do runtime do E10.4)

10.4.7.1 Preservar dados do formulário em erro (não resetar campos corretos)
• Status: Briefing
• Problema: ao ocorrer erro de validação em um campo, os demais campos preenchidos corretamente perdem os valores e o usuário precisa digitar tudo novamente.
• Regra de UX: em erro de validação, manter todos os valores já preenchidos e destacar apenas o(s) campo(s) inválido(s) com erro inline.
• Saída esperada: submit com erro mantém state do formulário; apenas mensagens/estados de erro são atualizados.
10.4.7.2 Campo “site” aceitar domínio sem https:// (normalização)
• Status: Briefing
• Problema: exigir que o lead digite https:// aumenta fricção e gera erro desnecessário.
• Regra de UX: aceitar formatos simples (ex.: unicodigital.com.br, www.unicodigital.com.br, unicodigital.com) e também URL completa.
• Regra de normalização: se o usuário não informar esquema (http:// ou https://), o sistema deve prefixar https:// internamente (armazenamento/uso).
• Saída esperada: validação tolerante + normalização consistente para URL final.
10.4.7.3 Indicar campo obrigatório com asterisco em “Nome do projeto”
• Status: Briefing
• Problema: falta de sinalização clara do campo obrigatório aumenta tentativa/erro no submit.
• Regra de UX: label “Nome do projeto*” (asterisco) + erro inline quando vazio.
• Saída esperada: obrigatoriedade explícita no primeiro contato, reduzindo falhas.
10.4.7.4 Ajustes finos de microcopy e labels (se necessário)
• Status: Briefing
• Escopo: microcopy curta acima do formulário e labels/ajudas dos campos (sem aumentar fricção).
• Saída esperada: texto mais claro e objetivo, sem “marketing longo”, mantendo o padrão de empty state acionável.

10.5 Pós-setup persuasivo sem entitlements (active — conversão)
• Status: Briefing
• Escopo: UX/CTAs para conta em `accounts.status=active` quando **não há plano/trial (sem entitlements)**, imediatamente após o E10.4 (pós-setup). Deve orientar próximos passos e conversão **sem retornar** ao fluxo de “Primeiros passos”.
• DoD mínimo (MVP):
• Renderizar uma tela pós-setup (não pode ficar “em branco”) com:
  • 1 CTA primário para “adquirir plano / iniciar trial” (texto a definir).
  • 1 CTA secundário para “agendar consultoria / conta consultiva”.
  • Alternativa clara para continuar explorando limitado (ex.: “ver demo” / “continuar limitado”) — sem prometer recursos produtivos.
  • Mensagem curta explicando: conta está ativa, mas criar/publicar LP depende de entitlements.
• Regras de gating:
• “Primeiros passos” renderiza **somente** se `accounts.status=pending_setup`.
• Conta `active` **não** implica permissão de criar LP; liberar “Criar LP” apenas com trial/plano (entitlement).
• Nota: não usa `setup_completed_at` nem `account_setup_completed_at` (não usar em lugar nenhum; manter no DB apenas por segurança).
• Dependências: E10.4.6 (setup status-based + pós-save com redirect/refresh), E9.8.1 (trial/entitlements), E10.5.1 (enforcement server-side; hardening).

10.5.1 Matriz “preparação vs produtivo” + enforcement (SSR + actions)
• Status: Briefing
• Objetivo: fechar lista de ações/rotas “produtivas” vs “preparação” e definir onde bloquear no servidor (SSR + server actions) para não depender só de UI.
10.5.1.1 Escopo
• Definir matriz (rotas + ações) com status/entitlements mínimos exigidos.
• Aplicar enforcement no SSR e nas ações críticas (ex.: “Criar LP”, “Publicar”, “Domínio”, “Tracking” e integrações) conforme matriz.
• Garantir mensagens/CTAs coerentes no bloqueio (“iniciar trial/plano”, “agendar consultoria”, alternativas).
10.5.1.2 Sinal canônico (mínimo)
• Declarar 1 fonte canônica de entitlements/limites efetivos (view/RPC) conforme docs/schema.md.
• Declarar 1 booleano operacional derivado dessa fonte (nome final; ex.: can_create_lp ou is_productive).
10.5.1.3 Saída esperada
• Matriz fechada + pontos de enforcement + QA mínimo (não-regressão).
10.5.1.4 Dependências
• E9.8.1 (trial/entitlements).
• E10.5 (UX pós-setup para reutilizar CTAs/mensagens).

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

14/02/2026 11:18 — E16 ajustado para refletir a nova abordagem (status-based) e o consolidado 2

16. E16 — Accounts

16.1 Status
• Concluído

16.2 Objetivo
• Definir o lifecycle de **contas** e o comportamento esperado no dashboard (Produto + UX).
• Manter **billing/trial/entitlements** fora de `accounts.status` (ver E9).
• Setup concluído (produto) é representado por **status** (ver E10.4/E10.4.6).

16.3 Status de conta (definição prática)

16.3.1 `pending_setup` (onboarding mínimo)
• Ao entrar no dashboard da conta, renderiza **“Primeiros passos”** (formulário inline).
• Objetivo: coletar dados mínimos e concluir setup.
• Ao salvar com sucesso, a conta **deixa de ser `pending_setup`** (ver transição 16.5).
• CTAs típicos: “Salvar e continuar” (onboarding) e alternativas de suporte/consultoria (quando aplicável).

16.3.2 `active` (pós-setup / operação normal)
• Setup concluído; uso normal do dashboard.
• **Permissões de features** (ex.: criar/publicar recursos) são controladas por **entitlements/trial/plano** (E9), não por `accounts.status`.

16.3.3 `inactive` (restrição operacional — reversível)
• Acesso restrito com explicação clara do motivo (ex.: billing), com CTA de reativação.
• Enforcement automático fica para caso de uso operacional (Admin/Jobs).

16.3.4 `suspended` (bloqueio admin)
• Acesso restrito com explicação clara do motivo (bloqueio administrativo).
• CTA: contatar suporte.
• Enforcement automático fica para caso de uso operacional (Admin/Jobs).

16.4 Regras de produto (alto nível)
• Bloqueio por conta é independente do vínculo do usuário: mesmo com membership “ativo”, pode haver restrição por status da conta.
• Trial comercial não é status de conta; é estado de plano/assinatura/entitlements (ver E9).
• `pending_setup` é exclusivo para **setup incompleto**; `active` é o estado pós-setup.

16.5 Transições oficiais (lifecycle)
• `pending_setup → active`: evento = **sucesso no “Salvar e continuar” de “Primeiros passos”** (E10.4.6).
• `active → inactive`: evento de billing/operacional (E9/E12) (regras detalhadas fora deste item).
• `inactive → active`: reativação (E9/E12).
• `* → suspended` e `suspended → active`: decisão/admin/operacional (E12).

16.6 UX por status (snapshot)
• `pending_setup`: tela da conta com **Primeiros passos** (onboarding mínimo).
• `active`: estado pós-setup (inclui vitrine/CTAs de conversão quando **sem plano/trial**, ver E10.5; gating de features via entitlements, ver E9).
• `inactive`: tela de conta inativa com CTA reativar/pagar.
• `suspended`: tela de conta suspensa com CTA suporte.
• Observação: detalhes de rotas/gate e regras técnicas ficam em `docs/base-tecnica.md` (ver também E4/E8).

16.7 QA e evidência (snapshot)
• Confirmar que contas novas “nascem” em `pending_setup`.
• Confirmar que, após sucesso no onboarding, a conta passa a renderizar estado `active` (sem “deny genérico”).
• Detalhes de contrato/DB e evidências de hardening ficam em `docs/schema.md`.

16.8 Casos relacionados / drifts (owners)
• E10.4/E10.4.6: onboarding mínimo e transição `pending_setup → active` (setup status-based).
• E10.5: “active persuasiva” sem plano/trial (UX pós-setup; gating por entitlements).
• E9: trial/entitlements (fonte de verdade de permissões).
• E12: enforcement operacional (jobs) e políticas de restrição/reativação/configurações.

99. Changelog
v1.5.19 (13/02/2026)
• E10.4.6 concluído (exec): “Primeiros passos” persiste `account_profiles`, atualiza `accounts.name` e promove `pending_setup → active`; setup concluído passa a ser status-based (`accounts.status=active`) e `setup_completed_at/account_setup_completed_at` ficam deprecated sem uso no gating/fluxo.
• E10.5 ajustado para “active persuasiva” (pós-setup sem plano/trial), removendo dependência do marcador no fluxo.
• Access Context endurecido (v_access_context_v2) e ajustes de Supabase Auth fora do repo (Redirect URLs Preview + templates de signup/reset usando RedirectTo).

v1.5.18 (07/02/2026)
• E10.4.5 concluído (definição): decisão de persistência do onboarding/perfil em account_profiles (1:1), mantendo accounts.name no core, com contrato mínimo v1 (niche, preferred_channel, whatsapp, site_url).
v1.5.17 (06/02/2026)
• E10.4.4 concluído (definição): contrato v1 de campos/validações do formulário “Primeiros passos” (incl. regra condicional do WhatsApp e microcopy por intenção)
v1.5.16 (06/02/2026)
• E10.4.3 concluído: política do marcador de setup (once set, never unset) + permitido/proibido (snapshot).
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

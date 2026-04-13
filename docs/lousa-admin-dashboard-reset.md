# Lousa — Admin Dashboard Reset vs1

## 1) Objetivo

Remoção segura de tudo possível relacionado ao Admin Dashboard no repositório e no BD, com atualização dos documentos afetados.

## 2) Escopo da remoção

## 3) Inventário atual (repo)

3.1 Superfície atual identificada no repo

* `app/admin/layout.tsx`
* `app/admin/_server/section-guard.ts`
* `app/admin/tokens/page.tsx`
* `components/admin/CopyLinkButton.tsx`
* `lib/admin/index.ts`
* `lib/admin/contracts.ts`
* `lib/admin/adapters/adminAdapter.ts`
* `lib/admin/adapters/postSaleTokenAdapter.ts`

3.2 Observação

* O Admin atual do repo está concentrado em tokens de pós-venda.
* Não há evidência de um dashboard admin amplo já consolidado.

## 4) Inventário atual (BD)

4.1 Objetos existentes

* Tabelas:

  * `post_sale_tokens`
  * `business_taxons`
  * `business_taxon_aliases`
  * `account_taxonomy`
  * `content_templates`
  * `content_template_taxons`
  * `taxon_market_research`
  * `taxon_market_research_items`
  * `taxon_message_guides`
* Views:

  * `v_admin_tokens_with_usage`
  * `v_audit_logs_norm`
* Functions:

  * `create_account_with_owner(uuid, uuid)`
  * `ensure_first_account_for_current_user()`
  * `is_platform_admin()`
  * `is_super_admin()`

4.2 Volume inicial encontrado

* `post_sale_tokens`: 0
* `business_taxons`: 2
* `business_taxon_aliases`: 5
* `account_taxonomy`: 0
* `content_templates`: 0
* `content_template_taxons`: 0
* `taxon_market_research`: 0
* `taxon_market_research_items`: 0
* `taxon_message_guides`: 0

4.3 Tokens

* total de tokens: 0
* tokens com account: 0
* tokens usados: 0
* tokens válidos abertos: 0

## 5) Riscos e regressões

5.1 Remoção segura provável

* `app/admin/tokens/page.tsx`
* `components/admin/CopyLinkButton.tsx`
* documentação específica do painel atual de tokens, se reescrita
* `post_sale_tokens`, `v_admin_tokens_with_usage` e `create_account_with_owner()` parecem candidatos fortes à remoção, porque hoje estão sem dados operacionais

5.2 Remoção perigosa sem substituição

* `is_platform_admin()`
* `is_super_admin()`
* guards SSR e contratos mínimos de acesso admin
* policies que dependem dessas funções em `accounts`, `account_users`, `account_profiles`, `audit_logs`, `partners`, `partner_accounts`, `plans` e nas 8 tabelas admin-only do E10.5.2

5.3 Achado crítico

* o “admin” atual não está isolado no painel
* a função `is_platform_admin()` participa de RLS compartilhada do produto
* apagar tudo do admin em bloco quebraria permissões além do dashboard

## 6) Estratégia de remoção

6.1 Fase 1 — remover superfície atual

* remover UI/rota atual de tokens
* remover adapter/contratos que existirem só para o fluxo de token, se confirmado que não há mais consumidores
* limpar docs que tratam o painel atual como solução ativa

6.2 Fase 2 — remover fluxo consultivo legado

* remover `post_sale_tokens`
* remover `v_admin_tokens_with_usage`
* remover `create_account_with_owner()`
* revisar `accountAdapter` e qualquer consumidor restante
* revisar roadmap/schema/base técnica juntos para não criar drift

6.3 Fase 3 — preservar infraestrutura shared

* manter `is_platform_admin()` e `is_super_admin()` enquanto existirem policies e regras de acesso que dependam delas
* manter o conceito de acesso administrativo separado do painel atual

6.4 Matriz final de remoção

6.4.1 Remover agora — repo

* `app/admin/tokens/page.tsx`
* `components/admin/CopyLinkButton.tsx`
* `lib/admin/contracts.ts` se ficar exclusivo do fluxo de tokens
* `lib/admin/adapters/postSaleTokenAdapter.ts`

6.4.2 Ajustar agora — repo

* `lib/admin/adapters/adminAdapter.ts`

  * remover tudo ligado a `tokens.*`
  * manter apenas `checkSuperAdmin()` e `checkPlatformAdmin()`
* `lib/admin/index.ts`

  * remover export de `adminTokens`
  * manter exports mínimos de checagem admin
* `app/admin/layout.tsx`

  * remover se a seção admin sair totalmente agora
  * manter apenas se uma nova home `/admin` nascer imediatamente
* `app/admin/_server/section-guard.ts`

  * remover apenas se toda a seção `/admin` sair agora
* `lib/access/adapters/accountAdapter.ts`

  * remover `createFromToken()`
  * remover `createFromTokenAsService()`

6.4.3 Remover agora — BD

* tabela `public.post_sale_tokens`
* view `public.v_admin_tokens_with_usage`
* function `public.create_account_with_owner(uuid, uuid)`

6.4.4 Preservar

* `public.is_platform_admin()`
* `public.is_super_admin()`
* `requirePlatformAdmin()` e `requireSuperAdmin()`
* `v_audit_logs_norm`
* `business_taxons`
* `business_taxon_aliases`
* `account_taxonomy`
* `content_templates`
* `content_template_taxons`
* `taxon_market_research`
* `taxon_market_research_items`
* `taxon_message_guides`
* policies shared de `accounts`, `account_users`, `account_profiles`, `audit_logs`, `plans`, `partners`, `partner_accounts`

6.4.5 Atualizar documentos

* `docs/roadmap.md`

  * revisar E7, E7.5, E12.5 e referências ao fluxo consultivo por token
* `docs/schema.md`

  * remover `post_sale_tokens`, `v_admin_tokens_with_usage` e `create_account_with_owner()`
  * manter `is_platform_admin()`, `is_super_admin()`, `v_audit_logs_norm` e base E10.5.2
* `docs/base-tecnica.md`

  * limpar referências ao fluxo de tokens e rate limit E7, se deixar de existir no produto
  * manter acesso admin shared
* `docs/design-system.md`

  * remover referência a `app/admin/tokens/page.tsx`, se houver

6.4.6 Checklist de regressão

* `npm run check` passa
* login continua ok
* `/a` e `/a/home` continuam ok
* onboarding padrão sem token continua ok
* acesso de conta existente continua ok
* policies que dependem de `is_platform_admin()` continuam válidas
* `v_audit_logs_norm` permanece intacta

6.4.7 Ordem correta de execução

* primeiro limpar repo
* depois rodar migration de remoção do fluxo de tokens
* depois atualizar `roadmap`, `schema` e `base-tecnica`
* por fim smoke test final

## 7) Estratégia de substituição

## 8) Decisões

* objetivo definido: remoção segura de tudo possível relacionado ao Admin Dashboard no repositório e no BD, com atualização dos documentos afetados
* decisão tomada: remover o fluxo consultivo por tokens definitivamente
* decisão tomada: preservar `is_platform_admin()` e `is_super_admin()` nesta etapa
* decisão tomada: preservar a base admin-only do E10.5.2 nesta etapa

## 9) Pendências

## 10) Próximos passos

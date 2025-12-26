26/12/2025 LP Factory 10 — Base Técnica v1.9.4 (Markdown Lite Zero)
Propósito: documentação técnica prescritiva do estado atual do sistema (foco em Next.js + Supabase + Acesso + SQL).
Regra de formatação: sem sumário/âncoras; sem tabelas; sem code fences; sem crases.

0. Regra de Edição (fixa)
	• Sem crases; sem blocos de código; sem tabelas.
	• Preservar exatamente títulos e numeração.
	• Não reformatar: não converter parágrafos em lista; não mexer em linhas que não forem necessárias.

1. Identificação do Projeto
Nome: LP Factory 10
Repositório: https://github.com/AlcinoAfonso/LP-Factory-10
Controle de versão: GitHub Web (edição e commit pelo navegador; não assumir repo local, terminal, git cli ou paths locais)
Deploy: Vercel (preview + produção)
Backend: Supabase — projeto lp-factory-10
1.1 Variáveis Obrigatórias (server-only)
	• SUPABASE_SECRET_KEY
	• ACCESS_CONTEXT_ENFORCED=true
	• ACCESS_CTX_USE_V2=true
1.2 Variáveis Públicas
	• NEXT_PUBLIC_SUPABASE_URL
	• NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
1.3 Convenções
	• TypeScript: camelCase
	• SQL/Postgres: snake_case
	• Pipeline: GitHub Web → Vercel
	• Regra: não usar SUPABASE_SERVICE_ROLE_KEY (usar apenas SUPABASE_SECRET_KEY)

2. Stack & Dependências
2.1 Framework
	• Next.js 15.5.7 (App Router, SSR, Server Components) — upgrade devido ao CVE-2025-55182
	• React 19.2.x + React DOM 19.2.x (runtime oficial do Next.js 15)
	• TypeScript (strict)
	• Tailwind CSS
2.2 Backend
	• Supabase (PostgreSQL 17.6.1.063, Auth, Storage, RLS)
	• Regra: versões devem refletir Settings > Infrastructure (Supabase)
	• PostgREST (Supabase Data API) 14.1
	• @supabase/supabase-js ≥ 2.56.0
	• .maxAffected(1) em mutações 1-a-1
	• JWT Signing Keys ativo: Current ECC (P-256); Previous Legacy HS256 (não revogar por padrão); integrações futuras (se houver) devem validar JWT via JWKS + kid
2.3 UI
	• SULB (auth forms)
		○ Definição: conjunto de rotas/arquivos de autenticação copiados do Supabase (vendor interno).
		○ Regra: não criar auth fora do SULB; alterações no SULB só quando necessário e sempre respeitando a allowlist 6.4.
	• shadcn/ui (base provisória)
2.4 Deploy
	• Vercel (CI automático)
	• Variáveis validadas:
		○ SUPABASE_SECRET_KEY
		○ NEXT_PUBLIC_SUPABASE_URL
		○ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
2.5 Regras de Import (canônica)
	• @supabase/* somente em: src/lib/**/adapters/ (ex.: src/lib/access/adapters/, src/lib/admin/adapters/) e lib/supabase/*.
	• Exceção: rotas SULB autorizadas em app/auth/* (lista na seção 6.4)
	• UI e componentes client nunca acessam Supabase diretamente
	• Paths canônicos confirmados no repo: src/lib/**/adapters/ e lib/supabase/*
3. Regras Técnicas Globais
3.1 Segurança
	• Views que expõem dados de usuário devem usar security_invoker = true.
	• RLS obrigatório em todas as tabelas sensíveis.
	• Cookie last_account_subdomain só pode ser definido/lido no SSR (HttpOnly, Secure, SameSite=Lax).
	• Nenhum dado sensível pode ser acessível no client.
3.2 Estrutura de Camadas
	• Fluxo obrigatório: UI → Providers → Adapters → DB.
	• Regra: UI/rotas não importam @supabase/*.
	• Fora de adapters, @supabase/* só em lib/supabase/* e allowlist SULB (6.4).
	• Imports Supabase devem obedecer 2.5 (fonte única).
3.3 Estrutura de Arquivos
	• Cada domínio segue:
		○ adapters/ (DB) → contracts.ts (interface pública) → index.ts (re-exports)
	• Nenhum módulo acessa DB fora de adapters.
	• Tipos canônicos só em src/lib/types/status.ts.
3.4 CI/Lint (Bloqueios)
	• Não há CI/Lint com bloqueios em uso no projeto no momento.
	• Regra: antes de merge, seguir obrigatoriamente o checklist da seção 7 (anti-regressão)..
3.5 Secrets & Variáveis
	• Server-only: SUPABASE_SECRET_KEY, STRIPE_SECRET_KEY (futuro)
	• Públicas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
	• Flags obrigatórias:
		○ ACCESS_CONTEXT_ENFORCED=true
		○ ACCESS_CTX_USE_V2=true
3.6 Tipos TypeScript
	• Fonte única: src/lib/types/status.ts
	• Proibido redefinir tipos em qualquer outro módulo
	• Adapters normalizam valores lidos do DB
3.7 Convenções
	• TS: camelCase
	• SQL: snake_case
	• -1 = ilimitado para limites numéricos
	• Auditoria via jsonb_diff_val()
3.8 Anti-Regressão
	• Migrations sempre idempotentes
	• .maxAffected(1) obrigatório em mutações 1-a-1
	• Alteração de schema exige revisão de views/functions dependentes e atualização do PATH: docs/schema.md
	• Sem secrets expostos no client
3.9 Rate Limit (E7)
	• super_admin: 200 tokens/dia
	• platform_admin: 20 tokens/dia
	• 3 tokens/email/dia
	• 5 burst/5min
	• Índices obrigatórios:
		○ (created_by, created_at DESC)
		○ (email, created_at DESC)
3.10 Anti-Patterns
	• Importar Supabase na UI (exceto SULB allowlist)
	• Views sem security_invoker=true
	• Hardcode de lógica de planos/limites
	• Modificar SULB fora dos arquivos autorizados
	• Manipular last_account_subdomain no client
3.11 Sistema de Grants (E9)
	• Nunca usar plan_id para liberar features
	• Usar sempre get_feature(account_id, feature_key)
	• Hierarquia: section → lp → account → plan → default
	• Cada conta preserva seu snapshot de recursos

3.12 Compatibilidade PostgREST 14.1
	•  Ambiente atual: PostgREST 14.1
	• Índice GIN accounts_name_gin_idx obrigatório quando a feature de busca por nome (FTS) estiver ativa
	• search_path fixado em public
	•  Recurso: Spread (...) em relações to-many (disponível). Estado: não utilizado no código atualmente. Regra: em pai + filhos na mesma resposta, usar alias para evitar colisão de chaves
	• Recurso: busca FTS (fts, plfts, phfts, wfts) em text/json (disponível). Estado: sem escopo de telas. Regra: ao ativar busca em UI, preferir wfts como padrão e adicionar índices GIN conforme necessidade de performance
	• UX/Erro: HTTP 416 / PGRST103 em paginação. Interpretação: range/offset inválido. Comportamento obrigatório: tratar como fim da lista (não é erro de sistema), manter itens já carregados e parar novas requisições

3.13 Compatibilidade Next.js 15 / React 19
	• cookies() e headers() são async em SSR/Server Components (usar await)
	• Rotas que dependem de sessão/cookies devem ser dinâmicas (evitar cache entre usuários)
	• Runtime oficial do App Router: React 19.x (React DOM 19.x)
	• Em novos códigos de forms/Server Actions: preferir useActionState (não usar useFormState)

3.14 Padrão de Adapters (vNext)
* Novas páginas/casos de uso: DB somente via adapters (PATH: src/lib/**/adapters/).
* 1 adapter = 1 caso de uso; se crescer, dividir (<=150 linhas ou <=6 exports).
* Adapter retorna DTO final; UI não normaliza; não expor DBRow.
* Mudança de shape: v2; manter v1 até migrar.
* Queries: colunas explícitas; listas com order determinístico.
* Paginação (range): 416/PGRST103 = fim da lista somente em range/paginação.
* Enums: proibido fallback silencioso.
* Gate adapters: pode retornar null, mas logs devem diferenciar deny vs error.

4. DB Contract (Schema)
Fonte única: PATH: docs/schema.md
Regras:
	• Este documento não lista mais tabelas/views/functions/triggers/policies; isso está em PATH: docs/schema.md.
	• Alterações no DB exigem atualizar PATH: docs/schema.md e revisar dependências no código (views/RPC/adapters).
	• SECURITY DEFINER só é permitido quando estiver explicitamente registrado/aprovado em PATH: docs/schema.md (com motivo e limites).
	• Views expostas a usuário: security_invoker=true e registro no PATH: docs/schema.md.

5. Arquitetura de Acesso
5.1 Conceitos Fundamentais
5.1.1 Access Context v2
	• Fonte única: v_access_context_v2
	• Decide se o usuário pode acessar uma conta (allow + reason)
	• Usado em SSR (getAccessContext), AccessProvider e AccountSwitcher
5.1.2 Persistência SSR (cookie last_account_subdomain)
	• Definido em /a/[account]/layout.tsx após allow=true
	• Atributos obrigatórios: HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/
	• Lido apenas no servidor (middleware) para redirecionar /a → /a/{subdomain}
	• No logout, o cookie deve expirar (Max-Age=0)
	• last_account_subdomain só é definido em /a/{account_slug} após allow; /a/home não define cookie.

5.2 Adapters, Guards, Providers
Adapters:
	• src/lib/access/adapters/accountAdapter.ts
		○ createFromToken(tokenId, actorId) → RPC create_account_with_owner
		○ renameAndActivate(accountId, name, slug) com .maxAffected(1)
		○ ○ normalizeAccountStatus preserva trial (trial não pode virar active por fallback)
	• src/lib/access/adapters/accessContextAdapter.ts
		○ lê v_access_context_v2
		○ gate adapter: null permitido; logs deny vs error
	• src/lib/admin/adapters/adminAdapter.ts
		○ valida super_admin / platform_admin
		○ opera post_sale_tokens via postSaleTokenAdapter
Guards:
	• src/lib/access/guards.ts
		○ bloqueia Admin quando não for super_admin ou platform_admin
Providers:
	• src/providers/AccessProvider.tsx
		○ carrega contexto de acesso no app
	• components/features/account-switcher/*
		○ consome v_user_accounts_list via /api/user/accounts

5.3 Fluxos de Sessão
5.3.1 Login (MVP)
	• Modal → autenticação SULB → redirect para /a
	• Se já estiver logado, /a deve resolver conta e redirecionar
5.3.2 Password Reset (MVP)
	• Modal → email → link abre nova aba → define senha (2x) → sucesso → auto-redirect dashboard
	• Link expirado (10m): tela mostra “link expirou” + reenvio inline
	• Email não cadastrado: mensagem neutra “Se este email estiver cadastrado…”
5.3.3 Throttling
	• Login: 3s após 3 falhas; 10s após 5 (com countdown)
	• Reset: throttle 5min com countdown
5.3.4 Observabilidade
	• server-timing/proxy-status não observados nos requests testados via DevTools
	• Diretriz: se precisar medir, instrumentar via logs/Apm e/ou headers próprios no server
5.4 Regras da rota /a (anti-regressão)
	• /a é pública sem sessão
	• em navegação limpa (sem sessão), /a não redireciona automaticamente para /auth/login
	• dashboard privado só em /a/{account_slug}
	• /a → /a/{account_slug} só quando:
		○ existe sessão válida, e
		○ conta foi resolvida (cookie last_account_subdomain ou fallback)
	• allow/deny é responsabilidade do gate SSR em /a/{account_slug}
	• /a/home é pública e bypassa o gate SSR de conta em app/a/[account]/layout.tsx

6. Estrutura de Arquivos Essencial
6.1 Visão rápida (fonte única)
	• Fonte única do inventário (pastas/arquivos e mapa do repo): PATH: docs/repo-inv.md
	• Regra: esta Base Técnica não mantém “árvore” nem lista completa de paths fora das exceções normativas (6.4)
6.2 Arquivos críticos por fluxo (fonte única)
	• Lista completa e atualizada de arquivos críticos (Acesso, Onboarding, Multi-conta, Supabase núcleo, SULB, Admin): PATH: docs/repo-inv.md
	• Regra: se um arquivo crítico mudar de path, atualizar primeiro o PATH: docs/repo-inv.md
6.3 Tipos e contratos críticos (mínimo normativo)
	• Fonte única de tipos canônicos: PATH: src/lib/types/status.ts
	• Regra: proibido redefinir AccountStatus, MemberStatus, MemberRole fora do arquivo canônico
	• Contratos e reexports do domínio permanecem em src/lib/** (detalhes no PATH: docs/repo-inv.md)
6.4 Arquivos SULB autorizados a importar Supabase (fonte única normativa)
Exceção oficial: somente os arquivos listados abaixo podem importar @supabase/* fora de src/lib/**/adapters/ e lib/supabase/.
Regra: qualquer novo arquivo em app/auth/ não pode importar @supabase/* até ser incluído nesta allowlist.
	• lib/supabase/client.ts
	• lib/supabase/middleware.ts
	• lib/supabase/server.ts
	• lib/supabase/service.ts
	• app/auth/confirm/route.ts
	• app/auth/update-password/page.tsx
	• app/auth/protected/page.tsx
6.5 Regras rápidas (sem drift)
	• Acesso ao DB: somente via adapters (PATH: src/lib/**/adapters/).
	• Exceções de @supabase/: lib/supabase/* e allowlist SULB (6.4).

7. Checklist mínima (anti-regressão)
	• Views expostas a usuário: security_invoker = true (ver 3.1 e PATH: docs/schema.md)
	• RLS ativo nas tabelas sensíveis (ver 3.1 e PATH: docs/schema.md)
	• last_account_subdomain somente SSR (ver 5.1.2 e 5.4)
	• @supabase/* só em adapters + lib/supabase/* + allowlist SULB (ver 2.5 e 6.4)
	• Mutações 1-a-1: .maxAffected(1) (ver 3.8)
	• Migrations idempotentes (ver 3.8)
	• Funções críticas: search_path = public (ver 3.12)
	• SECURITY DEFINER somente quando aprovado (ver 4 e PATH: docs/schema.md)
	• Tipos canônicos: fonte única em PATH: src/lib/types/status.ts
	• /a: público sem sessão; privado só em /a/{account_slug} com gate SSR (ver 5.4)
	• Adapters vNext: seguir 3.14

8. Changelog
v1.9.4 (26/12/2025) — Adapters vNext
	• Adicionada seção 3.14 (regras simples para adapters: caso de uso, DTO final, v2, order, paginação 416=fim somente em range, enums sem fallback silencioso, gate logs deny vs error).
v1.9.3 (23/12/2025) — Schema extraído para docs/schema.md
	• Movido o conteúdo da seção 4 (Schema) para PATH: docs/schema.md como DB Contract.
	• Atualizado checklist/referências para apontar para PATH: docs/schema.md.
	• Mantido o restante do documento alinhado ao estado atual do zip35 (v1.9.2).
v1.9.2 (23/12/2025) — Infra/Auth/PostgREST (estado atual)
	• Atualizado 2.2 Backend: Supabase PostgreSQL 17.6.1.063.
	• Atualizado 2.2 Backend: PostgREST (Supabase Data API) 14.1 + regra “versões devem refletir Settings > Infrastructure”.
	• Atualizado 2.2 Backend: Auth com JWT Signing Keys ativo (Current ECC P-256; Previous Legacy HS256), regra “não revogar anterior por padrão” e validação futura via JWKS + kid.
	• Atualizado 3.12 Compatibilidade PostgREST 14.1: registrado Spread (...) em relações to-many (disponível; ainda não usado) + regra de alias para evitar colisão de chaves.
	• Atualizado 3.12 Compatibilidade PostgREST 14.1: registrado FTS (fts/plfts/phfts/wfts) (disponível; sem escopo de telas) + preferência por wfts e índices GIN conforme necessidade.
	• Atualizado 3.12 Compatibilidade PostgREST 14.1: UX de paginação — HTTP 416 / PGRST103 = fim da lista (não erro de sistema).
	• Atualizado 5.3.4 Observabilidade: server-timing/proxy-status não observados nos requests testados via DevTools; diretriz de instrumentação/logs/APM se necessário.


• Mantido o restante do documento alinhado ao estado atual do repositório na data da versão.


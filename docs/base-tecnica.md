0. Introdução
0.1. Cabeçalho
• Documento: Base Técnica LP Factory 10
• Versão: v2.0.5
• Data: 31/01/2026
0.2 Contrato do documento (parseável)
• Esta seção define o que é relevante atualizar e como escrever.
0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo
0.2.2 ALLOWLIST_RELEVANCIA
• OBJETIVO_DOC: regras e contratos técnicos do repositório (Next.js + Supabase + Vercel) para orientar implementação segura e consistente.
• ANTI_DRIFT_DB: contrato/inventário de DB pertence ao docs/schema.md (não duplicar listas de DB aqui).
• ANTI_DRIFT_ROADMAP: marcos, decisões, fluxo e histórico pertencem ao docs/roadmap.md (não registrar updates aqui).
• INCLUIR: apenas regras necessárias para evitar implementação errada (segurança, governança, padrões obrigatórios).
• SE NÃO HOUVER LACUNAS/CONTRADIÇÕES RELEVANTES: responder “SEM ALTERAÇÕES NECESSÁRIAS”.
0.2.3 ALLOWLIST_CHANGELOG (blocklist mínima)
• PROIBIDO: bullets administrativos (ex.: “atualizado cabeçalho/data/versão”).
0.2.4 ESTILO (opcional)
• Estado final (o que é), sem narrativa/justificativa.
• Frases curtas e normativas; preferir bullets; incluir paths/termos exatos; sem tabelas e sem code fences.

1. Identificação do Projeto
• Nome: LP Factory 10
• Repositório: https://github.com/AlcinoAfonso/LP-Factory-10
• Controle de versão: GitHub Web (edição e commit pelo navegador; não assumir repo local, terminal, git cli ou paths locais)
• Deploy: Vercel (preview + produção)
1.1 Backend: Supabase — projeto lp-factory-10
1.1.1 Segredos e flags de execução (server-side)
• SUPABASE_SECRET_KEY
• ACCESS_CONTEXT_ENFORCED=true
• ACCESS_CTX_USE_V2=true
1.1.2 Variáveis Públicas
• NEXT_PUBLIC_SUPABASE_URL
• NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
1.1.3 Convenções
• TypeScript: camelCase
• SQL/Postgres: snake_case
• Pipeline: GitHub Web → Vercel
• Regra: não usar SUPABASE_SERVICE_ROLE_KEY (usar apenas SUPABASE_SECRET_KEY)
1.1.4 Runtime & Toolchain
• Node.js: 22.x (Vercel > Settings > Build and Deployment > Node.js Version)
• TypeScript: 5.5.4 (repo; versão do compilador)

2. Stack & Dependências
2.1 Framework
• Next.js 16.1.1 (App Router, SSR, Server Components)
• React 19.2.x + React DOM 19.2.x
• TypeScript 5.5.4 (strict)
• Node.js 22.x
• Package manager: npm
• Lockfile canônico: package-lock.json (deve ficar commitado e alinhado ao package.json)
• Next 16.x prioriza Turbopack; evitar customizações via webpack() no next.config quando possível (preferir alias via tsconfig.json > paths)
2.2 Backend
• Supabase (PostgreSQL 17.6.1.063, Auth, Storage, RLS)
• Regra: versões devem refletir Settings > Infrastructure (Supabase)
• PostgREST (Supabase Data API) 14.1
• @supabase/supabase-js ≥ 2.56.0
• .maxAffected(1) em mutações 1-a-1
• JWT Signing Keys ativo: Current ECC (P-256); Previous Legacy HS256 (não revogar por padrão); integrações futuras (se houver) devem validar JWT via JWKS + kid
2.3 UI
• SULB (auth forms): definição: rotas/arquivos de autenticação copiados do Supabase (vendor interno).
• Regra (SULB): não criar auth fora do SULB; alterações no SULB só quando necessário e sempre respeitando a allowlist 6.4.
• shadcn/ui: base provisória.
2.4. Supabase Auth URL allowlist (Redirect URLs)
• Local: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
• Regra: permitir somente domínios/paths necessários (produção + localhost).
• Regra (Preview Vercel): quando for necessário habilitar preview, usar wildcard com “/**” para cobrir paths profundos (ex.: https://*-<slug>.vercel.app/**).
• Regra: não usar curingas amplos fora de preview (evitar allowlist que aceite domínios externos).
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
• Padrão por domínio: adapters/ (DB); contracts.ts (interface pública); index.ts (re-exports).
• Regra: nenhum módulo acessa DB fora de adapters.
• Tipos canônicos só em src/lib/types/status.ts.
3.4 CI/Lint (Bloqueios)
• Validação por PR + preview de deploy (Vercel)
• PATH: .github/workflows/security.yml
• Bloqueio de segurança: impedir padrões de implicit flow em client/UI (access_token, refresh_token, setSession, getSessionFromUrl)
• Regra: o bloqueio de tokens/sessão ignora app/auth/confirm/** (allowlist mínima para handler server-side)
• Regra: verifyOtp() só pode existir em app/auth/confirm/**
• Regra de merge (mínimo): validação automática ok + preview ok + smoke de acesso (login/logout/reset de senha/navegação pós-login)
• Regra: antes de merge, seguir obrigatoriamente o checklist da seção 7 (anti-regressão)
3.4.1 Manutenção (Upgrade Next.js + lockfile)
• PATH: .github/workflows/upgrade-next-16-1-1.yml
• Disparo: manual (inputs: target_branch, next_version)
• Objetivo: atualizar Next.js + eslint-config-next para a versão informada e manter lockfile canônico versionado (npm)
• Regra: lockfile canônico é package-lock.json (deve ficar commitado e alinhado ao package.json)
• Setup: Node.js 22.x
• Regra: se existir package-lock.json, usar instalação reprodutível; se não existir, gerar e commitar package-lock.json
• Lint: non-blocking em manutenção (não deve impedir o bump/lockfile)
• Build: blocking (não publicar se build falhar)
• Regra: commitar alterações somente quando houver mudanças detectadas
3.5 Secrets & Variáveis
• Server-only: SUPABASE_SECRET_KEY, STRIPE_SECRET_KEY (futuro)
• Públicas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
• Flags obrigatórias: ACCESS_CONTEXT_ENFORCED=true; ACCESS_CTX_USE_V2=true.
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
• Índices obrigatórios: (created_by, created_at DESC); (email, created_at DESC).
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
• Ambiente atual: PostgREST 14.1
• Índice GIN accounts_name_gin_idx obrigatório quando a feature de busca por nome (FTS) estiver ativa
• search_path fixado em public
• Recurso: Spread (to-many) em relações to-many (disponível). Estratégia: usar alias para evitar colisão de chaves quando retornar múltiplas relações na mesma resposta
• Recurso: busca FTS (fts, plfts, phfts, wfts) em text/json. Preferir wfts e criar índices GIN conforme necessidade de performance
• UX/Erro: HTTP 416 / PGRST103 em paginação. Interpretação: resultado vazio (fim da lista), não erro de sistema; manter itens já carregados e parar novas requisições
3.13 Compatibilidade Next.js 15 / React 19
• Contexto: notas de compatibilidade da migração Next.js 15 → Next.js 16 (estado atual: Next.js 16.1.1 + React 19.x)
• cookies() e headers() podem exigir await em SSR/Server Components (usar async quando necessário)
• params/searchParams podem exigir await em algumas rotas/pages (usar async quando necessário)
• Rotas que dependem de sessão/cookies devem ser dinâmicas (evitar cache entre usuários)
• Next 16.x prioriza Turbopack; evitar webpack() custom no next.config quando possível
• Em novos códigos de forms/Server Actions: preferir useActionState (não usar useFormState)
3.14 Padrão de Adapters (vNext)
• Novas páginas/casos de uso: DB somente via adapters (PATH: src/lib/**/adapters/).
• 1 adapter = 1 caso de uso; se crescer, dividir (<=150 linhas ou <=6 exports).
• Adapter retorna DTO final; UI não normaliza; não expor DBRow.
• Mudança de shape: v2; manter v1 até migrar.
• Queries: colunas explícitas; listas com order determinístico.
• Paginação (range): 416/PGRST103 = fim da lista somente em range/paginação.
• Enums: proibido fallback silencioso.
• Gate adapters: pode retornar null, mas logs devem diferenciar deny vs error.

4. DB Contract - Fonte única: PATH: docs/schema.md
• Este documento não lista mais tabelas/views/functions/triggers/policies; isso está em PATH: docs/schema.md.
• Trigger Hub é regra do contrato de DB (governança/auditoria). Fonte única e detalhes: PATH: docs/schema.md (seções 3.5 e 4.1).
• Alterações no DB exigem atualizar PATH: docs/schema.md e revisar dependências no código (views/RPC/adapters).
• SECURITY DEFINER só é permitido quando estiver explicitamente registrado/aprovado em PATH: docs/schema.md (com motivo e limites).
• Views expostas a usuário: security_invoker=true e registro no PATH: docs/schema.md.
• Hardening executado (B2): public.accounts.status é obrigatório (NOT NULL) e tem DEFAULT 'pending_setup'::text.

5. Arquitetura de Acesso
5.1 Conceitos Fundamentais
5.1.1 Access Context v2
• Fonte única: v_access_context_v2
• Decide se o usuário pode acessar uma conta (allow + reason)
• Usado em SSR (getAccessContext), AccessProvider e AccountSwitcher
5.1.2 Persistência SSR (cookie last_account_subdomain)
• Cookie HttpOnly de “última conta”, usado pelo gateway /a/home (SSR) para redirecionar /a/home → /a/{account_slug}.
• Escrita (best-effort) em middleware.ts para GET /a/{account_slug} (exceto 'home'), somente em navegação real (sem prefetch).
• Escrita (autoritativa) em /a/[account]/layout.tsx somente quando ctx existe, ctx.blocked=false e houver subdomain canônico (ctx.account.subdomain).
• Atributos obrigatórios: HttpOnly; SameSite=Lax; Max-Age=7776000; Path=/.
• Secure: true em produção (NODE_ENV=production).
• Leitura do cookie ocorre no SSR do gateway /a/home.
• Limpeza do cookie: /a/home?clear_last=1 (middleware zera Max-Age=0) e, em bloqueio, o gate SSR de /a/[account] deleta cookie (best-effort) antes de redirecionar.
• /a/home não define cookie (apenas lê; clear_last=1 ignora cookie no SSR e delega limpeza ao middleware).
5.2 Adapters, Guards, Providers
5.2.1 Adapters
• accountAdapter (PATH: src/lib/access/adapters/accountAdapter.ts): createFromToken(tokenId, actorId) → RPC create_account_with_owner; renameAndActivate(accountId, name, slug) com .maxAffected(1); normalizeAccountStatus não faz fallback para active em status desconhecido.
• accessContextAdapter (PATH: src/lib/access/adapters/accessContextAdapter.ts): lê v_access_context_v2; getFirstAccountForCurrentUser(): se existir conta allow=true → retorna; se existir qualquer membership → não cria; sem membership → chama RPC ensure_first_account_for_current_user(); logs access_context_decision; gate adapter permite null; logs diferenciam deny vs error.
• adminAdapter (PATH: src/lib/admin/adapters/adminAdapter.ts): valida super_admin / platform_admin; opera post_sale_tokens via postSaleTokenAdapter.
5.2.2 Guards
• guards (PATH: src/lib/access/guards.ts): bloqueia Admin quando não for super_admin ou platform_admin.
5.2.3 Providers
• AccessProvider (PATH: src/providers/AccessProvider.tsx): carrega contexto de acesso no app.
• account-switcher (PATH: components/features/account-switcher/*): consome v_user_accounts_list via /api/user/accounts.
5.3 Fluxos de Sessão
5.3.1 Login (MVP)
• Login primário é page-based em /auth/login (card central).
• CTA “Entrar” na home pública (/a/home) navega para /auth/login.
• Sucesso: /auth/login cria sessão via signInWithPassword e navega para /protected (rota técnica).
• /protected redireciona para /a/home (redirect em next.config.js).
• /a/home (gateway) resolve conta e redireciona para /a/{account_slug}.
• Erro de credenciais: exibir error.message do Supabase (ex.: “Invalid login credentials”).
• Throttling específico de login não está implementado na UI atual (ver 5.3.3).
5.3.2 Password Reset (MVP)
• Entrada do reset: /auth/forgot-password.
• Mensagem neutra obrigatória (anti-enumeração): “Se este e-mail estiver cadastrado…” (em sucesso e descrição).
• Cooldown UI: 60s com contador e botão desabilitado após solicitar.
• resetPasswordForEmail deve usar redirectTo direto para /auth/update-password (sem querystring).
• Link de recovery abre /auth/update-password com type=recovery e token_hash=<TOKEN_HASH> ou code=<CODE>.
• Regra anti-scanner: não consumir token no GET; confirmação ocorre somente no POST ao “Salvar nova senha”.
• /auth/update-password faz POST para /auth/confirm com type=recovery, token_hash/code e next=/a.
• Ao concluir, o usuário retorna para /a (entrypoint público) e segue a resolução de conta pelo gateway.
5.3.3 Throttling
• Login: sem throttling dedicado; UI apenas desabilita o botão durante a request e exibe error.message em falha.
• Reset: cooldown UI de 60s (contador), iniciado após uma solicitação bem-sucedida.
• Limitação adicional (server-side) é responsabilidade do Supabase Auth.
5.3.4 Observabilidade
• server-timing/proxy-status não observados nos requests testados via DevTools
• Diretriz: se precisar medir, instrumentar via logs/Apm e/ou headers próprios no server
5.3.5 Signup
• Entrada: /auth/sign-up (SignUpForm usa supabase.auth.signUp).
• Sucesso do signUp: redirecionar para /auth/sign-up-success (mensagem de confirmação para checar o e-mail).
• Regra: signUp deve usar emailRedirectTo apontando para /auth/confirm?next=/a/home (somente path interno).
• Regra (template Supabase — Confirm sign up): manter type=signup no link de confirmação (compatibilidade: handler também aceita type=email).
• Confirmação: /auth/confirm (GET) exibe interstitial “Continuar” e consome token apenas no POST (anti-scanner).
• Pós-confirmação: /auth/confirm (POST) cria sessão e redireciona para next=/a/home.
• Com sessão e sem membership: /a/home cria 1ª conta via RPC ensure_first_account_for_current_user() e redireciona para /a/{account_slug} (pending_setup; owner/active).
• Com sessão e sem conta allow e com qualquer membership: /a/home redireciona para /auth/confirm/info.
5.4 Regras da rota /a (anti-regressão)
• /a é o entrypoint público e redireciona para /a/home.
• /a/home é pública e funciona como gateway:
• Sem sessão: renderiza home pública.
• Com sessão: tenta resolver conta via cookie last_account_subdomain e redireciona para /a/{account_slug} (quando houver allow=true).
• Com sessão e sem membership: cria 1ª conta via RPC ensure_first_account_for_current_user() e redireciona para /a/{account_slug} (pending_setup; owner/active).
• Com sessão e sem conta allow e com qualquer membership: redireciona para /auth/confirm/info.
• Dashboard privado só em /a/{account_slug}.
• allow/deny é responsabilidade do gate SSR em /a/{account_slug}.
• /a/home bypassa o gate SSR de conta em app/a/[account]/layout.tsx.
• Se o gate negar com usuário autenticado: redirecionar para /a/home?clear_last=1 para limpar o cookie e forçar fallback determinístico (sem loop).
• “Solicitar acesso” em /auth/confirm/info abre mailto (não é rota interna do app).
• Se ctx.blocked por membership.status: redirecionar para:
• pending → /auth/confirm/pending
• inactive → /auth/confirm/inactive
• revoked → /auth/confirm/revoked
• Se ctx.blocked por conta (ctx.error_code="FORBIDDEN_ACCOUNT"): redirecionar para:
• accounts.status=inactive → /auth/confirm/account/inactive
• accounts.status=suspended → /auth/confirm/account/suspended
• fallback → /auth/confirm/account

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

99. Changelog
v2.0.5 (31/01/2026) — Correções de contrato vs implementação (cookie SSR + referência a trial)
• Corrigida 5.1.2: persistência do cookie last_account_subdomain reflete runtime (middleware best-effort em /a/{slug} sem prefetch + escrita autoritativa no gate SSR com ctx.blocked=false e subdomain canônico; Secure apenas em produção; TTL 90 dias; limpeza via clear_last=1 e delete em bloqueio).
• Retificada a referência do changelog v2.0.4 sobre “remoção de trial” no runtime: o repo ainda contém trial em tipos/adapter (drift de runtime), embora o contrato de access (v_access_context_v2) permaneça sem trial.
v2.0.4 (30/01/2026) — E10.4.1: alinhamento do contrato de status (sem trial no access)
• Removidas referências a 'trial' como status de conta em 5.1.2 (cookie SSR) e 5.2.1 (accountAdapter), alinhando ao contrato active|pending_setup.
v2.0.3 (27/01/2026) — E4.2 + E8.2: auto 1ª conta (pending_setup) quando usuário não tem membership
• Atualizado accessContextAdapter (v_access_context_v2) com fallback: sem membership → ensure_first_account_for_current_user(); com qualquer membership → não cria.
• Atualizado fluxo pós-confirmação (Signup) e gateway /a para refletir criação automática de 1ª conta e redirecionamento para /a/{account_slug} (modo vitrine).
v2.0.2 (26/01/2026) — Auth: Signup documentado
• Adicionada 5.3.5 com o fluxo mínimo de signup (/auth/sign-up → /auth/sign-up-success → confirmação via /auth/confirm?next=/a/home), incluindo regra de type=signup no template e comportamento esperado sem vínculo (fallback /auth/confirm/info).
v2.0.1 (23/01/2026) — Hardening accounts.status
• Registrado hardening executado em produção: public.accounts.status com DEFAULT 'pending_setup'::text e NOT NULL.
v1.9.10 (22/01/2026) — Gate SSR: bloqueio por status (membership/conta)
• Ajustado 5.4 para incluir roteamento de bloqueio por status de membership e por conta via FORBIDDEN_ACCOUNT (inactive/suspended) para rotas /auth/confirm dedicadas, mantendo fallback genérico.
• Corrigida linha truncada em 5.1.2 (atributos do cookie last_account_subdomain: Path=/.)
v1.9.9 (16/01/2026) — Alinhamento do contrato de Auth ao fluxo real do MVP
• Ajustado 5.3.1 para refletir login page-based em /auth/login e uso de /protected → /a/home.
• Ajustado 5.3.2 e 5.3.3 para refletir reset via /auth/forgot-password e cooldown UI de 60s (sem modal/throttle 5min).
• Ajustado 5.1.2 e 5.4 para refletir leitura do cookie no gateway /a/home, TTL de 90 dias e limpeza via clear_last=1 no middleware, incluindo fallback /auth/confirm/info e mailto de solicitação de acesso.
v1.9.8 (14/01/2026) — Password Reset sem etapa “Continuar” (anti-scanner)
• Atualizada a regra de Redirect URLs para preview Vercel (wildcard com “/**” para paths profundos).
• Refinado o bloqueio de implicit flow no CI para permitir o handler server-side em app/auth/confirm/** sem afrouxar o restante do app/src.
• Consolidado o fluxo de Password Reset para abrir direto em /auth/update-password e consumir token apenas no POST ao salvar a nova senha.
v1.9.7 (08/01/2026) — Ajustes normativos para Auth, PostgREST e rota /a
• Registrada regra de Site URL e Redirect URLs do Supabase Auth para produção e previews quando necessário (2.4).
• Removidas linhas truncadas e consolidada a orientação de PostgREST 14.1 (3.12).
• Refinada mensagem neutra do reset para email não cadastrado (5.3.2).
• Documentado comportamento de recuperação para cookie last_account_subdomain inválido (5.4).
v1.9.6 (04/01/2026) — Base Técnica: correções de texto truncado e reforço de referências de manutenção/validação (paths e disparo manual) para o contexto do Next.js 16.1.1
v1.9.5 (30/12/2025) — Upgrade Next.js 16.1.1
• Atualizado 0.1 Cabeçalho: data/versão para v1.9.5.
• Atualizado 2.1 Framework: Next.js 16.1.1 + lockfile canônico (package-lock.json, npm) + contexto Turbopack.
• Atualizado 3.4 CI/Lint (Bloqueios): bloqueios de segurança (implicit flow + allowlist de verifyOtp) e smoke mínimo antes de merge.
• Atualizado 3.13 Compatibilidade Next.js 15 / React 19: registrado estado atual em Next.js 16.1.1 e impactos práticos (await e build).
• Adicionada 3.4.1: manutenção de upgrade + lockfile canônico.
v1.9.4 (26/12/2025) — Adapters vNext
• Adicionada seção 3.14 (regras simples para adapters: caso de uso, DTO final, v2, order, paginação 416=fim somente em range, enums sem fallback silencioso, gate logs deny vs error).
v1.9.3 (23/12/2025) — Schema extraído para docs/schema.md
• Movido o conteúdo da seção 4 (Schema) para PATH: docs/schema.md como DB Contract.
• Atualizado checklist/referências para apontar para PATH: docs/schema.md.
v1.9.2 (23/12/2025) — Infra/Auth/PostgREST (estado atual)
• Atualizado 2.2 Backend: Supabase PostgreSQL 17.6.1.063.
• Atualizado 2.2 Backend: PostgREST (Supabase Data API) 14.1 + regra “versões devem refletir Settings > Infrastructure”.
• Atualizado 2.2 Backend: Auth com JWT Signing Keys ativo (Current ECC P-256; Previous Legacy HS256), regra “não revogar anterior por padrão” e validação futura via JWKS + kid.
• Atualizado 3.12 Compatibilidade PostgREST 14.1: registrado Spread (...) em relações to-many (disponível; ainda não usado) + regra de alias para evitar colisão de chaves.
• Atualizado 3.12 Compatibilidade PostgREST 14.1: registrado FTS (fts/plfts/phfts/wfts) (disponível; sem escopo de telas) + preferência por wfts e índices GIN conforme necessidade.
• Atualizado 3.12 Compatibilidade PostgREST 14.1: UX de paginação — HTTP 416 / PGRST103 = fim da lista (não erro de sistema).
• Atualizado 5.3.4 Observabilidade: server-timing/proxy-status não observados nos requests testados via DevTools; diretriz de instrumentação/logs/APM se necessário.



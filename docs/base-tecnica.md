0. Introdução

0.1. Cabeçalho
• Documento: Base Técnica LP Factory 10
• Versão: v2.0.21
• Data: 26/03/2026

0.2 Contrato do documento (consulta)
• Esta seção define o objetivo do documento e quando/como a IA deve consultá-lo.

0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
• O QUE É: a fonte única de regras técnicas e contratos operacionais do produto (Next.js + Supabase + Vercel + integrações).
• POR QUE CONSULTAR: para evitar implementação errada, manter consistência técnica e reduzir risco (segurança, acesso, observabilidade, convenções).
• COMO USAR: ao gerar plano / macro-roteiro / código / ajustes de código, consultar primeiro este documento e seguir suas regras como contrato.
• QUANDO CONSULTAR: decisões de runtime (rotas/gating/estados), segurança (PII/secrets/keys), padrões mínimos de logs/observability, integrações e convenções de repo.
• QUANDO NÃO CONSULTAR:
• detalhes/inventário de DB (usar docs/schema.md)
• status/escopo/histórico de casos E* (usar docs/roadmap.md)

1. Identificação do Projeto
• Nome: LP Factory 10
• Repositório: https://github.com/AlcinoAfonso/LP-Factory-10
• Controle de versão: GitHub Web (edição e commit pelo navegador; não assumir repo local, terminal, git cli ou paths locais)
• Deploy: Vercel (preview + produção)
• Domínio oficial do app (produção): https://lp-factory-10.vercel.app
• Base URL das API routes do app: https://lp-factory-10.vercel.app/api

1.1 Backend: Supabase — projeto lp-factory-10
1.1.1 Segredos e flags de execução (server-side)
• SUPABASE_SECRET_KEY
• ACCESS_CONTEXT_ENFORCED=true
• ACCESS_CTX_USE_V2=true
1.1.2 Variáveis Públicas
• NEXT_PUBLIC_SUPABASE_URL=https://dpikmjgiteuafsbaubue.supabase.co
• NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_DiHMVvkSiFqmn1hP0hc9Xg_sVmRaLdb
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
• Design System (identidade visual — E6.4–E6.6): referência oficial em docs/design-system.md (documento consolidado do ciclo E6.4–E6.6; API mínima, regras de uso e superfícies cobertas).
• Marca provisória: wordmark textual temporário “LP Factory” enquanto o asset oficial de logo não estiver versionado no repo.
• UI Component Library (E6.5/E6.6): componentes proprietários mínimos para reduzir markup cru e manter consistência:
• Button (PATH: components/ui/button.tsx)
• Input (PATH: components/ui/input.tsx)
• Card (PATH: components/ui/card.tsx)
• Select (PATH: components/ui/select.tsx)
• FormField (PATH: components/ui/form-field.tsx) — label/hint/error
• Textarea (componente mínimo de biblioteca; ver docs/design-system.md)
• FeedbackMessage (erro/sucesso/aviso; ver docs/design-system.md)
• EmptyState (reutilizável; ver docs/design-system.md)
• LoadingState (reutilizável; ver docs/design-system.md)
• Regra: em Auth, onboarding mínimo e superfícies reais tocadas, preferir os componentes e estados reutilizáveis acima (evitar markup cru) e seguir docs/design-system.md.
• Tipografia oficial do produto (UI do dashboard): Inter via next/font/google; aplicar globalmente no <html> com className={inter.className} (PATH: app/layout.tsx); weights 400/500/600/700; display=swap.
• Tailwind tokens LP Factory: adicionar de forma aditiva (sem substituir tokens shadcn) com namespaces brand/ink/graytech/surface/state e boxShadow.card (PATH: tailwind.config.ts).
• Tailwind content: incluir js/ts/jsx/tsx/mdx em {pages,components,app,src} para evitar purge silencioso (PATH: tailwind.config.ts).
• Padrão shadcn preservado: cores baseadas em hsl(var(--...)); remapeamento semântico contido em app/globals.css para tokens `--primary`, `--ring`, `--border`, `--accent` (sem redesign amplo de `--background`, `--foreground`, `--card`) — ver docs/design-system.md.
• SULB (auth forms): definição: rotas/arquivos de autenticação copiados do Supabase (vendor interno).
• Regra (SULB): não criar auth fora do SULB; alterações no SULB só quando necessário e sempre respeitando a allowlist 6.4.
• shadcn/ui: base provisória.

2.4. Supabase Auth URL allowlist (Redirect URLs)
• Local: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
• Regra: permitir somente domínios/paths necessários (produção + localhost).
• Regra (Preview Vercel): quando for necessário habilitar preview, usar wildcard com “/**” para cobrir paths profundos (ex.: https://*-<slug>.vercel.app/**).
• Regra: não usar curingas amplos fora de preview (evitar allowlist que aceite domínios externos).

2.4.1 Supabase Auth — E-mail transacional (SMTP via Resend)
• Objetivo: estabilizar e-mails transacionais do Supabase Auth (signup confirm e reset password) via Resend SMTP (MVP; zero custo adicional; baixo risco).
• Resend: domínio verificado `lpfactory.com.br`; plano Free (1 domínio); região São Paulo (sa-east-1).
• Sender (Supabase): `no-reply@lpfactory.com.br` (domínio raiz; não usar `mail.lpfactory.com.br` no estágio atual por limitação do plano).
• SMTP (Supabase Auth): Host `smtp.resend.com`; Port `587`; Username `resend`; Password: secret configurado no Supabase (não versionar).
• DNS (Registro.br): manter SPF/DKIM do domínio raiz compatíveis com Resend; sem migração estrutural de domínio.
• Validação (estado final): signup testado; forgot password testado; entrega confirmada; links funcionais; sem erro de envio.
• Consequência (domínio raiz): reputação compartilhada entre site, transacional e futuros e-mails humanos (SPF/DKIM/DMARC únicos).
• Operação: e-mails humanos (ex.: alcinoafonso@, support@, vendas@) ficam em provedor humano (Workspace/M365/Zoho); Resend permanece apenas para envio transacional.
• Evolução (quando houver escala): avaliar migração para `no-reply@mail.lpfactory.com.br` (domínio dedicado; isolamento de reputação; SPF/DKIM/DMARC dedicados) com plano pago do Resend.

2.5 Regras de Import (canônica)
• @supabase/* somente em adapters do domínio, em lib/supabase/* e na allowlist SULB autorizada em 6.4.
• Regra canônica para código novo: adapters devem nascer em paths na raiz do repositório, respeitando a topologia canônica definida em 3.3.1.
• Exceção: arquivos legados já existentes em src/** podem permanecer até migração dirigida.
• UI e componentes client nunca acessam Supabase diretamente.

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

3.3.1 Topologia canônica do repositório
• Regra canônica para código novo: usar paths na raiz do repositório.
• A pasta src/ passa a ser tratada como legado controlado.
• Fica vedada a criação de novos módulos, boundaries, providers, adapters, helpers ou contratos em src/.
• Não fazer migração em big bang de src/ para a raiz.
• Arquivos legados em src/ só podem ser movidos quando houver demanda funcional real ou refatoração estrutural aprovada.

3.3.2 Separação estrutural entre Core e automations
• O root do repositório permanece como runtime canônico do Core SaaS (app Next.js, dashboard, auth, rotas do produto e dependências do Core).
• `automations/` passa a ser a raiz canônica da camada de automações operacionais.
• `.github/workflows/` permanece como camada de entrada/orquestração dos fluxos automatizados.
• Dependências de automação não devem entrar no `package.json` do Core, salvo exceção técnica aprovada.
• Cada automação relevante pode existir como subprojeto isolado em `automations/<nome>/`, com `package.json` e `package-lock.json` próprios.
• `pipelines/` deve ser tratado como legado em revisão/migração; novos casos canônicos devem nascer em `automations/`.
• Mudanças em automações não devem, por padrão, acoplar runtime do Core nem ampliar risco estrutural no deploy do app.

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

3.4.2 Codex (sandbox) — checks determinísticos (lint/typecheck)
• PATH: AGENTS.md (rotina padrão no sandbox)
• Rotina padrão (sandbox): `npm ci` → `npm run check`
• package.json (scripts):
• `lint`: `eslint .`
• `typecheck`: `tsc -p tsconfig.json --noEmit`
• `check`: `npm run lint && npm run typecheck`
• Build: não rodar `npm run build` no sandbox (sem rede; `next/font/google` faz download no build). Build é validado no CI/Vercel.
• ESLint config: PATH: eslint.config.mjs (Flat Config baseado em eslint-config-next)
• Regra temporária (lint): `react-hooks/set-state-in-effect: off` (remover no harden do lint)
• Nota: `eslint .` analisa o repo inteiro; warnings não quebram o check; errors quebram.

3.4.3 Pipeline `supabase-inspect` (referência mínima)
• PATH (workflow): .github/workflows/pipeline-supabase-inspect.yml
• PATH (pipeline): automations/supabase-inspect/
• Regra (v1): somente SELECT/WITH (sem mutações).
• Secrets (job): OPENAI_API_KEY e SUPABASE_DB_URL_READONLY.
• Detalhamento operacional, evolução funcional e posicionamento na camada de automações: consultar docs/automacoes.md.
• Contrato técnico detalhado do pipeline: automations/supabase-inspect/README.md.

3.5 Secrets & Variáveis
• Server-only: SUPABASE_SECRET_KEY, STRIPE_SECRET_KEY (futuro)
• CI/Automations (GitHub Actions secrets): OPENAI_API_KEY, SUPABASE_DB_URL_READONLY
• Públicas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
• Flags obrigatórias: ACCESS_CONTEXT_ENFORCED=true; ACCESS_CTX_USE_V2=true.
• Regra (keys): nunca expor keys em chat/logs; se vazar, revogar imediatamente e substituir por nova key.
• Regra (read-only DB): SUPABASE_DB_URL_READONLY deve autenticar com role/usuário read-only e usar preferencialmente session pooler.

3.5.1 OpenAI Platform — Projects e governança mínima (DEV/PROD)
• Projects: LPF10-DEV e LPF10-PROD.
• Sharing: “Enabled for selected projects” com apenas LPF10-DEV selecionado (DEV compartilha; Default e PROD não).
• Service Account: criada no LPF10-DEV com key gerada (uso em DEV).
• Hygiene: manter apenas keys necessárias ativas; revogar imediatamente keys expostas/indevidas; estado final reportado = 1 key ativa no LPF10-DEV.

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
• Novas páginas/casos de uso: DB somente via adapters.
• Regra canônica para código novo: adapters devem nascer em paths na raiz do repositório, conforme 3.3.1.
• Adapters legados já existentes em src/** podem permanecer até migração dirigida.
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
• accountAdapter (PATH: src/lib/access/adapters/accountAdapter.ts): createFromToken(tokenId, actorId) → RPC create_account_with_owner; renameAndActivate(accountId, name, slug) atualiza name+subdomain e seta status='active'; renameAccountNoStatus(accountId, name, slug) renomeia sem alterar status; updateAccountNameCore(accountId, name) atualiza apenas accounts.name; setSetupCompletedAtIfNull(accountId) (infra E10.4.1) seta setup_completed_at somente quando NULL (idempotente); marcador setup_completed_at é deprecated sem uso no gating do runtime; normalizeAccountStatus usa allowlist ASTAT; fallback atual: 'active'.
• accountProfileAdapter (PATH: src/lib/access/adapters/accountProfileAdapter.ts): upsertAccountProfileV1({ accountId, niche, preferredChannel, whatsapp, siteUrl }) (E10.4.6).
• accessContextAdapter (PATH: src/lib/access/adapters/accessContextAdapter.ts): lê v_access_context_v2; readAccessContext(subdomain) retorna allow=true ou contexto bloqueado (member_inactive/account_blocked) quando houver membership; getFirstAccountForCurrentUser(): se existir conta allow=true → retorna; se existir qualquer membership → não cria; sem membership → chama RPC ensure_first_account_for_current_user(); logs access_context_decision; adapter permite null; logs diferenciam deny vs error.
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
• Mensagem neutra obrigatória (anti-enumeração): “Se este e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.” (em sucesso e descrição).
• Cooldown UI: 60s com contador e botão desabilitado após solicitar.
• resetPasswordForEmail deve usar redirectTo direto para /auth/update-password (sem querystring).
• Regra (template Supabase — Reset password): usar {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery (RedirectTo aponta para /auth/update-password).
• Link de recovery abre /auth/update-password com type=recovery e token_hash=<TOKEN_HASH> ou code=<CODE>.
• Regra anti-scanner: não consumir token no GET; confirmação ocorre somente no POST ao “Salvar nova senha”.
• /auth/update-password faz POST para supabase.auth.updateUser({ password }) e, em sucesso, redireciona para /auth/update-password/success.

5.3.3 Throttling
• Login: sem throttling dedicado; UI apenas desabilita o botão durante a request e exibe error.message em falha.
• Reset: cooldown UI de 60s (contador), iniciado após uma solicitação bem-sucedida.
• Limitação adicional (server-side) é responsabilidade do Supabase Auth.
5.3.4 Observabilidade
• server-timing/proxy-status não observados nos requests testados via DevTools
• Diretriz: se precisar medir, instrumentar via logs/Apm e/ou headers próprios no server
• Server Actions críticas devem emitir logs estruturados (JSON) com request_id e latency_ms (padrão mínimo).
• Regra (logs sem PII): não logar valores de formulário (ex.: name, whatsapp, site_url).
• Onboarding pós-save (E10.4.6): revalidatePath(route) antes do redirect para evitar UI stale.

5.3.5 Signup
• Entrada: /auth/sign-up (SignUpForm usa supabase.auth.signUp) (PATH: components/sign-up-form.tsx).
• Sucesso do signUp: redirecionar para /auth/sign-up-success (mensagem de confirmação para checar o e-mail).
• Regra: signUp deve usar emailRedirectTo apontando para /auth/confirm?next=/a/home (somente path interno).
• Regra (correlação ponta a ponta): gerar rid no client (não-PII) e anexar no emailRedirectTo como querystring (ex.: &rid=<rid>) para rastrear submit → e-mail → confirm → redirect.
• Regra (SUPA-05 no client — Auth/signup): emitir logs estruturados para eventos de signup/resend com rid e sem PII (não logar email/senha nem valores sensíveis).
• Regra (VERC mínimo): logs no runtime do front em produção devem permitir diagnóstico rápido do fluxo por rid (submit/resultado).
• Regra (template Supabase — Confirm sign up): usar {{ .RedirectTo }} (não {{ .SiteURL }}); quando RedirectTo já contém querystring (ex.: ?next=/a/home&rid=...), anexar &token_hash={{ .TokenHash }}&type=signup.
• Confirmação: /auth/confirm (GET) exibe interstitial “Continuar” e consome token apenas no POST (anti-scanner).
• Pós-confirmação: /auth/confirm (POST) cria sessão e redireciona para next=/a/home.
• Com sessão e sem membership: /a/home cria 1ª conta via RPC ensure_first_account_for_current_user() e redireciona para /a/{account_slug} (pending_setup; owner/active).
• Sem vínculo e sem auto-criação (negado pela view): /auth/confirm/info (fallback genérico).

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
• Fonte única do estado atual de pastas e arquivos: o repositório real.
• Regra: esta Base Técnica não mantém “árvore” nem lista completa de paths fora das exceções normativas (6.4).

6.2 Arquivos críticos por fluxo (fonte única)
• Localização atual de arquivos críticos (Acesso, Onboarding, Multi-conta, Supabase núcleo, SULB, Admin): consultar o repositório real.
• Regra: se um arquivo crítico mudar de path, atualizar esta Base Técnica somente quando a mudança afetar regra, boundary, allowlist ou contrato técnico.

6.3 Tipos e contratos críticos (mínimo normativo)
• Fonte única de tipos canônicos: PATH: src/lib/types/status.ts
• Regra: proibido redefinir AccountStatus, MemberStatus, MemberRole fora do arquivo canônico
• Contratos e reexports legados já existentes em src/lib/** podem permanecer até migração dirigida; isso não altera a regra canônica de código novo definida em 3.3.1.

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
• Acesso ao DB: somente via adapters.
• Regra canônica para código novo: adapters em paths na raiz do repositório, conforme 3.3.1.
• Exceções de @supabase/: lib/supabase/* e allowlist SULB (6.4).
• Arquivos legados em src/** seguem como legado controlado até migração dirigida.

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
v2.0.21 (26/03/2026) — Separação estrutural entre Core SaaS e automations
• Formalizada na Base Técnica a separação canônica entre o runtime do Core SaaS no root do repositório e a camada de automações em `automations/`.
• Registrado que `.github/workflows/` permanece como camada de orquestração/entrada.
• Registrado que dependências de automação não devem entrar no `package.json` do Core, salvo exceção técnica aprovada.
• Registrado que automações relevantes podem nascer como subprojetos isolados com `package.json` e `package-lock.json` próprios.
• Alinhamento documental com a convenção já registrada em `docs/automacoes.md`.
v2.0.20 (24/03/2026) — Alinhamento de topologia canônica e descontinuação do repo-inv
• Ajustadas as seções 2.5, 3.14, 6.3 e 6.5 para alinhar imports, adapters e contratos à regra já vigente em 3.3.1: código novo nasce na raiz; src/** permanece apenas como legado controlado.
• Removidas referências normativas a docs/repo-inv.md; o estado atual de arquivos passa a ser consultado diretamente no repositório real.
v2.0.19 (20/03/2026) — Regra estrutural: raiz como padrão canônico; src/ como legado controlado
• Adicionada 3.3.1 com a política mínima de topologia do repositório: código novo nasce na raiz, src/ fica como legado controlado e não haverá migração em big bang.
v2.0.18 (10/03/2026) — E6.6: Visual States & Feedback (Textarea + estados reutilizáveis)
• Registrados os componentes mínimos do E6.6 (Textarea, FeedbackMessage, EmptyState e LoadingState) como parte da UI proprietária, com referência ao docs/design-system.md consolidado (E6.4–E6.6).
v2.0.17 (09/03/2026) — E6.5: UI Component Library (base) + docs/design-system.md atualizado
• Registrada a biblioteca base de UI proprietária (components/ui/*) e a regra de uso para reduzir markup cru em Auth e onboarding mínimo (referência em docs/design-system.md).
v2.0.16 (09/03/2026) — E6.4: identidade visual mínima + docs/design-system.md
• Registrada a referência oficial `docs/design-system.md`, o uso de wordmark textual temporário e o remapeamento semântico contido em `app/globals.css` (primary/ring/border/accent) para aplicação mínima de identidade visual.
v2.0.15 (06/03/2026) — `supabase-inspect`: SQL batch no briefing + relatório completo no Summary
• Registrado o modo batch com delimitador `---` (briefing e briefing_path) com execução determinística e relatório completo por query no Job Summary (contrato em automations/supabase-inspect/README.md).
v2.0.14 (04/03/2026) — Pipeline `supabase-inspect` v1 (read-only) + secret SUPABASE_DB_URL_READONLY
• Registrado o pipeline read-only `supabase-inspect` (workflow + contrato em automations/supabase-inspect/README.md) e o secret `SUPABASE_DB_URL_READONLY` para execução via GitHub Actions (preferir session pooler).
v2.0.13 (04/03/2026) — ESLint CLI + AGENTS.md (Codex checks)
• Registrada a rotina determinística no sandbox do Codex via AGENTS.md (`npm ci` + `npm run check`) e a divisão “build fora do sandbox (CI/Vercel)”.
• Registrados scripts de lint/typecheck/check e o ESLint Flat Config com exceção temporária `react-hooks/set-state-in-effect: off`.
v2.0.12 (02/03/2026) — OpenAI Platform (DEV/PROD) + GitHub Actions `openai-smoke`
• Registrados OPENAI_API_KEY (Actions secret) e workflow `.github/workflows/openai-smoke.yml` como teste mínimo de integração.
• Registrada governança mínima de OpenAI Projects (DEV/PROD), sharing isolado no DEV e higiene de keys (revogação imediata em caso de exposição).
v2.0.11 (01/03/2026) — Infra Auth: e-mail transacional via Resend (SMTP) no domínio raiz
• Registrada a configuração estável de e-mails transacionais do Supabase Auth via Resend (SMTP) com sender `no-reply@lpfactory.com.br`, incluindo consequências do domínio raiz e condição de migração futura para subdomínio dedicado.
v2.0.10 (24/02/2026) — E5.4: signup/confirm com correlação rid + logs (SUPA-05/VERC mínimo)
• Signup documentado com rid (não-PII) para correlação ponta a ponta e logs estruturados no client (SUPA-05) para signup/resend sem PII, com sinal mínimo no runtime Vercel (VERC).
v2.0.9 (19/02/2026) — Design System: Inter + tokens Tailwind
• Registrada tipografia oficial Inter via next/font/google e aplicação global no app/layout.tsx.
• Registrados tokens Tailwind LP Factory (brand/ink/graytech/surface/state + boxShadow.card) como extensão aditiva, preservando padrão shadcn.
• Registrada expansão do content Tailwind para incluir js/jsx/mdx, prevenindo purge silencioso.
v2.0.8 (13/02/2026) — E10.4.6: setup status-based + account_profiles + logs canônicos + templates Supabase
• Retificada 5.2.1: accountAdapter e accountProfileAdapter; setup concluído = accounts.status='active'; setup_completed_at deprecated sem uso no gating do runtime.
• Retificada 5.3.2 e 5.3.5: regras de Email Templates Supabase usando {{ .RedirectTo }} (signup/reset).
• Retificada 5.3.4: observabilidade mínima com logs JSON + request_id e regra sem PII; revalidatePath no pós-save.
v2.0.7 (07/02/2026) — E10.4.3: setter idempotente do marcador setup_completed_at no accountAdapter
• Documentado setSetupCompletedAtIfNull(accountId) como operação NULL-only (write-once no MVP).
v2.0.6 (04/02/2026) — E9.8.3: drift de trial no runtime/tipos resolvido
• Confirmado no zip 29: não há ocorrências de trial em arquivos .ts/.tsx do repo (drift citado em v2.0.5 encerrado).
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

0. Introdução

0.1 Cabeçalho
• Data da última atualização: 12/01/2026
• Documento: LP Factory 10 — repo-inv v2.2.1 — Referência normativa ativa
0.2 Contrato do documento (parseável)
• Esta seção define o que é relevante atualizar e como escrever.
0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo
0.2.2 ALLOWLIST_RELEVANCIA
• INVENTARIO: Estrutura do repositório (pastas/arquivos) com descrição curta da finalidade.
• PONTOS_DE_ENTRADA: Arquivos de entrada e rotas principais (ex.: app/, middleware, configs) apenas como referência de localização.
• MAPA_DE_DEPENDENCIAS: Dependências relevantes por módulo (ex.: UI/Providers/Adapters) apenas no nível “quem depende de quem”, sem detalhar lógica.
0.2.3 ALLOWLIST_CHANGELOG (blocklist mínima)
• PROIBIDO: bullets administrativos (ex.: “atualizado cabeçalho/data/versão”).
0.2.4 ESTILO (opcional)
• Estado final (o que existe), sem narrativa/justificativa.
• Frases curtas e normativas; preferir bullets; incluir paths/termos exatos; sem tabelas e sem code fences.

1. Estrutura Geral

1.1 Pastas na raiz
• .github/
• app/
• components/
• docs/
• lib/
• reports/
• scripts/
• src/
• supabase/

1.2 Arquivos na raiz
• README.md
• .gitignore
• middleware.ts
• next.config.js
• package.json
• package-lock.json
• postcss.config.js
• tailwind.config.ts
• tsconfig.json

1.3 .github/workflows — CI, segurança e automações
• .github/workflows/doc-agent.yml
• .github/workflows/security.yml
• .github/workflows/upgrade-next-16-1-1.yml

1.4 scripts — utilitários de automação (Doc Agent)
• scripts/apply-doc-report.mjs

1.5 reports — artefatos gerados por automações (não-normativos)
• reports/ (diretório com JSONs de operações/relatórios do doc agent; manter como histórico)
1.1 Pastas na raiz
• .github/
• app/
• components/
• docs/
• lib/
• src/
• supabase/

1.2 Arquivos na raiz
• README.md
• .gitignore
• middleware.ts
• next.config.js
• package.json
• postcss.config.js
• tailwind.config.ts
• tsconfig.json

2. app — Rotas (Next.js App Router)

2.1 Rotas públicas
• app/page.tsx
• app/layout.tsx
• app/globals.css

2.2 Account Dashboard (em desenvolvimento)
• app/a/page.tsx
• app/a/home/page.tsx
• app/a/[account]/layout.tsx
• app/a/[account]/page.tsx
• app/a/[account]/actions.ts
• app/a/[account]/loading.tsx
• app/a/[account]/not-found.tsx

2.3 Admin Dashboard
• app/admin/layout.tsx
• app/admin/tokens/page.tsx

2.4 Onboarding
• app/onboard/page.tsx
• app/onboard/actions.ts

2.5 Auth (SULB + rotas auxiliares)
• app/auth/login/page.tsx
• app/auth/sign-up/page.tsx
• app/auth/sign-up-success/page.tsx
• app/auth/forgot-password/page.tsx
• app/auth/update-password/page.tsx
• app/auth/protected/page.tsx
• app/auth/error/page.tsx
• app/auth/confirm/route.ts
• app/auth/confirm/info/page.tsx

2.6 API
• app/api/user/accounts/route.ts

3. components — UI e Features

3.1 Layout
• components/layout/Header.tsx
• components/layout/UserMenu.tsx

3.2 Account Switcher
• components/features/account-switcher/AccountSwitcher.tsx
• components/features/account-switcher/AccountSwitcherList.tsx
• components/features/account-switcher/AccountSwitcherTrigger.tsx
• components/features/account-switcher/useAccountSwitcher.ts
• components/features/account-switcher/useUserAccounts.ts

3.3 Auth forms (SULB)
• components/login-form.tsx
• components/sign-up-form.tsx
• components/forgot-password-form.tsx
• components/update-password-form.tsx
• components/logout-button.tsx

3.4 Onboarding UI
• components/onboard/OnboardForm.tsx

3.5 Admin UI
• components/admin/CopyLinkButton.tsx

3.6 UI base
• components/ui/AlertBanner.tsx
• components/ui/button.tsx
• components/ui/card.tsx
• components/ui/input.tsx
• components/ui/label.tsx

4. src — Núcleo Técnico

4.1 Providers
• src/providers/AccessProvider.tsx

4.2 Acesso (Access Context / guards / adapters)
• src/lib/access/getAccessContext.ts
• src/lib/access/guards.ts
• src/lib/access/audit.ts
• src/lib/access/plan.ts
• src/lib/access/types.ts
• src/lib/access/adapters/accountAdapter.ts
• src/lib/access/adapters/accessContextAdapter.ts

4.3 Admin (adapters e contratos)
• src/lib/admin/index.ts
• src/lib/admin/contracts.ts
• src/lib/admin/adapters/adminAdapter.ts
• src/lib/admin/adapters/postSaleTokenAdapter.ts

4.4 Auth (núcleo)
• src/lib/auth/authAdapter.ts

4.5 Tipos e utilitários
• src/lib/types/status.ts
• src/lib/utils.ts

5. lib — Supabase SSR (SULB)
• lib/supabase/client.ts
• lib/supabase/server.ts
• lib/supabase/middleware.ts
• lib/supabase/service.ts

6. supabase — Migrations
• supabase/migrations/0001__baseline_e7.sql
• supabase/migrations/accounts_name_gin_idx.sql

7. docs — Documentação interna (principais)
• docs/auto-agentes-up.md
• docs/base-tecnica.md
• docs/benchmark-de-mercado-update.md
• docs/prod-up.md
• docs/fluxos.md
• docs/recursos_gerais_update.md
• docs/repo-inv.md (este arquivo)
• docs/roadmap.md
• docs/schema.md
• docs/supa-up.md
• docs/vercel-up.md
8. SULB — Arquivos autorizados a importar @supabase/*
• Allowlist e regra canônica de imports: ver Base Técnica seção 6.4.

9. Notas de alinhamento
• Notas removidas para evitar duplicação com a Base Técnica.

10. Regras do Inventário

10.1 Snapshot
• Representa o snapshot atual da estrutura.
• Não define regras, apenas descreve.

10.2 Atualização
• Atualizar quando novas rotas/adapters surgirem ou pastas mudarem.
• Atualizar sempre que houver mudança de caminho (ex.: src/app ↔ app, src/components ↔ components).

99. Changelog
v2.2.1 (12/01/2026) — Atualização do inventário do repositório
• Atualizado inventário da raiz para incluir reports/ e scripts/.
• Adicionado inventário de .github/workflows com os workflows existentes.
• Adicionado package-lock.json ao inventário de arquivos na raiz.
• Atualizada lista de docs principais (inclui prod-up.md; remove doc inexistente).


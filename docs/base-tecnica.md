0. Introdução

0.1. Cabeçalho
• Documento: Base Técnica LP Factory 10
• Versão: v2.0.42
• Data: 14/06/2026

0.2 Contrato do documento (consulta)
• Esta seção define o objetivo do documento e quando/como a IA deve consultá-lo.

0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
• O QUE É: a fonte única de regras técnicas de runtime e implementação segura do produto.
• POR QUE CONSULTAR: para evitar implementação errada, manter consistência técnica e reduzir risco em código, acesso, SSR, adapters, segurança e observability.
• COMO USAR: ao gerar plano, macro-roteiro, código ou ajuste de código, consultar este documento como contrato técnico.
• QUANDO CONSULTAR: decisões de runtime, rotas/gating/estados, segurança de implementação, padrões mínimos de logs, adapters, imports, camadas e convenções de código.
• QUANDO NÃO CONSULTAR:
• configurações de plataformas, envs, secrets, endpoints, URLs, DNS, SMTP e redirects (usar `docs/platform-config.md`)
• detalhes/inventário de DB (usar `docs/schema.md`)
• status/escopo/histórico de casos E* (usar `docs/roadmap.md`)
• padrões visuais/componentes UI (usar `docs/design-system.md`)

1. Identificação do Projeto
• Nome: LP Factory 10
• Repositório canônico: `AlcinoAfonso/LP-Factory-10`
• Regra: consultar o repositório real via GitHub/conectores/fontes acessíveis antes de assumir paths, branches, arquivos ou estrutura.
• Configurações operacionais de plataformas, URLs, endpoints, projetos externos, envs e secrets: ver `docs/platform-config.md`.

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
• Supabase (PostgreSQL, Auth, Storage, RLS)
• PostgREST/Data API em uso no runtime.
• @supabase/supabase-js ≥ 2.56.0
• .maxAffected(1) obrigatório em mutações 1-a-1.
• Integrações que validam JWT devem usar JWKS + kid.
• Configurações operacionais do Supabase: ver `docs/platform-config.md`.

2.3 UI
• Design System (identidade visual — E6.4–E6.6): referência oficial em docs/design-system.md (documento consolidado do ciclo E6.4–E6.6; API mínima, regras de uso e superfícies cobertas).
• Marca provisória: wordmark textual temporário “LP Factory” enquanto o asset oficial de logo não estiver versionado no repo.
• UI Component Library (E6.5/E6.6): componentes mínimos — Button, Input, Card, Select, FormField, Textarea, FeedbackMessage, EmptyState e LoadingState. Fonte detalhada: docs/design-system.md.
• Regra: em Auth, onboarding mínimo e superfícies reais tocadas, preferir os componentes e estados reutilizáveis acima (evitar markup cru) e seguir docs/design-system.md.
• Tipografia oficial do produto (UI do dashboard): Inter via next/font/google; aplicar globalmente no <html> com className={inter.className} (PATH: app/layout.tsx); weights 400/500/600/700; display=swap.
• Tailwind tokens LP Factory: adicionar de forma aditiva (sem substituir tokens shadcn) com namespaces brand/ink/graytech/surface/state e boxShadow.card (PATH: tailwind.config.ts).
• Tailwind content: incluir js/ts/jsx/tsx/mdx em {pages,components,app,src} para evitar purge silencioso (PATH: tailwind.config.ts).
• Padrão shadcn preservado: cores baseadas em hsl(var(--...)); remapeamento semântico contido em app/globals.css para tokens `--primary`, `--ring`, `--border`, `--accent` (sem redesign amplo de `--background`, `--foreground`, `--card`) — ver docs/design-system.md.
• SULB (auth forms): definição: rotas/arquivos de autenticação copiados do Supabase (vendor interno).
• Regra (SULB): não criar auth fora do escopo SULB/autorizado; exceções só quando explicitamente previstas nesta Base Técnica (ex.: allowlist 6.4).
• Alterações no SULB: somente quando necessário e sempre respeitando a allowlist 6.4.
• shadcn/ui: base provisória.

2.4 Configurações operacionais de Auth
• Redirect URLs, SMTP Auth, sender, DNS e demais configurações operacionais do Supabase Auth ficam em `docs/platform-config.md`.
• Configuração SMTP/Resend do Supabase Auth: ver `docs/platform-config.md`.

2.5 Regras de Import (canônica)
• @supabase/* somente em adapters do domínio, em lib/supabase/* e na allowlist SULB autorizada em 6.4.
• UI e componentes client não acessam Supabase para dados de domínio; exceções de Auth/SULB devem usar wrappers em lib/supabase/*, salvo imports diretos explicitamente autorizados na allowlist 6.4.
• Esta é a regra normativa principal para imports; seções 3.2, 6.4 e 7 apenas referenciam este bloco.

3. Regras Técnicas Globais

3.1 Segurança
• Views que expõem dados de usuário devem usar security_invoker = true.
• RLS obrigatório em todas as tabelas sensíveis.
• Cookie last_account_subdomain só pode ser definido/lido no SSR (HttpOnly, Secure, SameSite=Lax).
• Nenhum dado sensível pode ser acessível no client.

3.2 Fluxo de acesso a dados
• Fluxo: UI → Providers → Adapters → DB; imports Supabase seguem 2.5.

3.3 Estrutura canônica
• Por domínio: adapters/ (DB), contracts.ts (interface pública) e index.ts (re-exports). DB somente via adapters; tipos canônicos somente em lib/types/status.ts.

3.3.1 Vocabulário e topologia
• Camada: recorte de primeiro nível: Core (runtime no root), `automations/` (automações) ou `services/` (serviços com deploy independente). `.github/workflows/` apenas orquestra.
• Seção do Core: recorte de produto: Account Dashboard, Admin Dashboard, Partner Dashboard ou LP Builder.
• Domínio transversal do Core: capacidade entre seções. `access` concentra acesso compartilhado entre as áreas do produto.
• Boundary: fronteira entre recortes reais, criada somente com responsabilidade e massa de código próprias.
• Path canônico: localização física obrigatória para artefatos novos.

3.3.2 Classificação, boundaries e paths
• Nova seção, domínio transversal ou path canônico exige definição prévia de classificação, boundary e path.
• Ordem: camada → seção ou domínio → boundary → path canônico → shared real ou falso shared.
• Não inventar paths: confirmar no repositório. Artefato novo nasce no path canônico; exceção existente não vira padrão.
• Componentes específicos de rota que dependem de Server Action, estado ou boundary da própria rota devem nascer como route-local em `app/.../_components`; não promover para `components/features` sem boundary compartilhada real.
• Partner Dashboard não ganha boundary antecipada. LP Builder é seção própria, fora do Account Dashboard.

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

3.4.4 Migrations Supabase versionadas
• Fonte canônica: `supabase/migrations/<timestamp>_<nome>.sql`.
• A baseline oficial é o ponto inicial do histórico versionado; alterações posteriores de schema devem entrar como migrations incrementais novas.
• Migrations legadas preservadas fora de `supabase/migrations/` são somente evidência histórica e não integram o fluxo ativo da CLI.
• Toda baseline ou migration incremental deve ser reconstruída e validada em ambiente isolado antes de qualquer apply remoto.
• Antes de apply remoto, executar `supabase migration list --linked` e `supabase db push --linked --dry-run` e revisar exatamente as migrations pendentes.
• Runtime não pode depender de objeto ou comportamento de banco ainda não aplicado e validado no ambiente alvo.
• Snippet operacional ou SQL avulso não equivale a migration histórica nem substitui migration versionada.
• SQL avulso é permitido apenas para inspeção, verificação read-only ou exceção expressamente autorizada; não é fluxo normal de alteração de schema.
• Avaliação de banco exige migration, validação e evidência aplicável ao ambiente alvo.
• O workflow `.github/workflows/pipeline-supabase-apply-migrations.yml` usa `supabase/setup-cli` v2.1.1 fixada pelo SHA completo `3c2f5e2ae34c34e428e8e206e2c4d21fa2d20fbf`, com Supabase CLI `2.106.0`.
• A Action é fixada por SHA imutável para garantir reprodutibilidade e impedir mudança silenciosa da referência móvel `@v2`.
• O merge de migration na `main` dispara o apply automático pelo workflow; o gate operacional `SUPABASE_APPLY_MIGRATIONS_ENABLED` deve permanecer em `true` no fluxo normal.
• Alterar o gate para valor diferente de `true` é medida excepcional de bloqueio para incidente ou manutenção, pois impede o apply automático.
• Os secrets de apply ficam disponíveis somente no passo `Apply migrations`, condicionado explicitamente ao gate aberto.
• Com gate fechado, um passo separado sem secrets registra o bloqueio e não instala a CLI nem executa `supabase link` ou `supabase db push`.
• O SQL Editor não deve ser usado para alterações de schema no fluxo normal; toda alteração deve ser versionada por migration e passar por PR e merge na `main`.
• Migration já aplicada é imutável: não editar, apagar, renomear, substituir conteúdo nem reutilizar seu timestamp.
• Reversão ou correção deve ser feita por nova migration incremental, preservando o histórico forward-only.
• Alterar a versão da CLI, a Action ou o contrato do workflow exige revisão e autorização operacional próprias.
• Configuração de gatilhos, secrets e variável do gate: ver `docs/platform-config.md`.

3.5 Secrets & Variáveis
• Código client nunca deve acessar secrets server-side.
• Código server-side deve ler variáveis apenas pelos nomes definidos em `docs/platform-config.md`.
• Nunca expor keys em chat, logs, prints, client bundle ou documentação.
• Se uma key vazar, revogar imediatamente e substituir por nova key.
• Variáveis, flags, endpoints, projetos externos e escopos de ambiente: ver `docs/platform-config.md`.

3.6 Tipos TypeScript
• Fonte única: lib/types/status.ts
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

3.8.1 Convenção mínima para novas tabelas

3.8.1.1 Chave primária
• Entidade: `id uuid primary key default gen_random_uuid()`
• Relação 1:1: FK como PK
• Vínculo puro N:N: PK composta

3.8.1.2 Relacionamentos
• Toda FK deve ser explícita
• Toda FK deve definir `ON DELETE` e `ON UPDATE`

3.8.1.3 Campos de domínio
• Campos como `status`, `type`, `scope`, `source_type`, `context_type` e equivalentes não nascem como texto solto sem contrato
• Quando a tabela tiver histórico operacional, deve haver decisão explícita sobre `created_at` e `updated_at`

3.8.1.4 Constraints e índices
• Toda unicidade relevante deve ser protegida no BD
• Índice só entra por motivo claro: FK relevante, unicidade, hierarquia ou consulta operacional prevista

3.8.1.5 Segurança e governança
• Toda tabela deve ter decisão explícita de segurança/acesso
• Se for exposta ao app, tenant, admin ou fluxo operacional, nasce com RLS e policies na mesma etapa
• Se for interna, schema e modelo de acesso devem ser definidos explicitamente
• Toda tabela deve decidir se entra em auditoria, Trigger Hub ou fica fora
• Data API / GRANT explícito: toda tabela nova no schema `public` que precise ser acessada via Supabase Data API/PostgREST/GraphQL deve declarar explicitamente, na mesma migration, os `GRANTs` necessários para as roles aplicáveis.
• `GRANT` não substitui RLS/policies.
• RLS/policies não substituem `GRANT`.
• Tabelas internas podem nascer sem `GRANT` para `anon`/`authenticated`, desde que o modelo de acesso esteja explícito.
• Tabelas expostas ao app, admin, adapters ou fluxo operacional via Supabase API devem ter decisão explícita de grants junto com RLS e policies.

3.9 Rate Limit administrativo (estado atual)
• Não há rate limit ativo do fluxo legado de tokens no runtime atual.
• Qualquer nova política de limite para operações administrativas deve ser redefinida no contexto do novo Admin Dashboard (E12), sem reutilizar contrato legado removido.

3.10 Anti-Patterns
• Importar Supabase na UI para dados de domínio (exceções de Auth/SULB seguem 2.5 e 6.4)
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
• Regra canônica para código novo: adapters devem nascer em paths canônicos na raiz do repositório (conforme 3.3.1 e 3.3.2).
• Adapters já existentes fora dos paths canônicos podem permanecer como compatibilidade, sem expansão de escopo.
• 1 adapter = 1 caso de uso; se crescer, dividir (<=150 linhas ou <=6 exports).
• Adapter retorna DTO final; UI não normaliza; não expor DBRow.
• Mudança de shape: v2; manter v1 até migrar.
• Queries: colunas explícitas; listas com order determinístico.
• Paginação (range): 416/PGRST103 = fim da lista somente em range/paginação.
• Enums: proibido fallback silencioso.
• Gate adapters: pode retornar null, mas logs devem diferenciar deny vs error.

3.14.1 Matching de taxonomia via adapter server-side
• Provider/API do resolvedor IA: OpenAI Responses API com Structured Outputs, sempre server-side.
• Configuração operacional do modelo IA, envs e redeploy: ver `docs/platform-config.md`.

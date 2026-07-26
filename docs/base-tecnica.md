0. Introdução

0.1. Cabeçalho
• Documento: Base Técnica LP Factory 10
• Versão: v2.0.54
• Data: 23/07/2026

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
• Fontes canônicas de dependências e versões: `package.json` e `package-lock.json`; não duplicar versões neste documento.
• O Core usa Next.js com App Router, SSR e Server Components, React, TypeScript em modo strict e Zod para contratos e validação runtime.
• Runtime JavaScript server-side: Node.js; versão operacional deve ser confirmada na configuração real do ambiente.
• Package manager canônico: npm; `package-lock.json` deve permanecer versionado e alinhado ao `package.json`.
• Preferir recursos e defaults do framework, incluindo Turbopack quando aplicável; evitar customização por `webpack()` quando alias em `tsconfig.json` resolver o caso.

2.2 Backend
• O backend usa Supabase para PostgreSQL, Auth, Storage e RLS, com PostgREST/Data API no runtime.
• A versão do client Supabase e demais dependências pertence ao `package.json` e ao `package-lock.json`.
• `.maxAffected(1)` é obrigatório em mutações 1-a-1.
• Integrações que validam JWT devem usar JWKS + `kid`.
• Configurações operacionais do Supabase: ver `docs/platform-config.md`.

2.3 UI
• Contrato visual, componentes, tipografia, tokens, estados e superfícies: consultar `docs/design-system.md`.
• Esta Base Técnica mantém somente guardrails técnicos de UI que afetem segurança, imports ou boundaries.
• SULB (auth forms): definição: rotas/arquivos de autenticação copiados do Supabase (vendor interno).
• Regra (SULB): não criar auth fora do escopo SULB/autorizado; exceções só quando explicitamente previstas nesta Base Técnica (ex.: allowlist 6.4).
• Alterações no SULB: somente quando necessário e sempre respeitando a allowlist 6.4.

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

3.3.3 Billing checkout
• Path canônico: `lib/billing-checkout/`.
• Uso: domínio server-side para criação de Checkout Session de provedor externo.
• Provedor inicial: Stripe.
• Ambiente inicial: teste.
• Modo: `subscription`.
• Contrato de planos pagos: `starter`, `lite`, `pro` e `ultra`.
• Recorrências permitidas: `monthly` e `annual`.
• `free`, `light` e `PlanId` legado não são contrato de negócio do checkout novo.
• Adapter inicial: `createStripeTestCheckoutSession`.
• Mapeamento Stripe teste: Product/Price por env, sem valores versionados.
• Integração Stripe: chamada server-side via `fetch`, sem SDK Stripe no MVP.
• Regra: UI/client não acessa `STRIPE_SECRET_KEY` nem cria sessão diretamente.
• Regra: redirect de sucesso/cancelamento não confirma pagamento e não libera entitlement.
• Regra: Stripe não substitui `public.account_commercial_entitlements`.
• Webhook, assinatura, idempotência e persistência de entitlement pertencem à fase seguinte.

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
• Detalhamento operacional, evolução funcional e posicionamento na camada de automações: consultar docs/automations.md.
• Contrato técnico detalhado do pipeline: automations/supabase-inspect/README.md.

3.4.4 Migrations Supabase versionadas
• Runtime não pode depender de objeto ou comportamento de banco ainda não aplicado e validado no ambiente alvo.
• Snippet operacional ou SQL avulso não equivale a migration histórica nem substitui migration versionada.
• SQL avulso é permitido apenas para inspeção, verificação read-only ou exceção expressamente autorizada.
• Avaliação de banco exige migration, validação e evidência aplicável ao ambiente alvo.
• Fonte canônica: `supabase/migrations/<timestamp>_<nome>.sql`.
• A baseline oficial é o ponto inicial do histórico versionado; alterações posteriores de schema devem entrar como migrations incrementais novas.
• Migrations legadas preservadas fora de `supabase/migrations/` são somente evidência histórica e não integram o fluxo ativo da CLI.
• Toda baseline ou migration incremental deve ser reconstruída e validada em ambiente isolado antes de qualquer apply remoto.
• Antes de apply remoto, executar `supabase migration list --linked` e `supabase db push --linked --dry-run` e revisar exatamente as migrations pendentes.
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

Commercial entitlements
• Path canônico: `lib/commercial-entitlements/`.
• Uso: domínio server-side para leitura do sinal de elegibilidade comercial da conta.
• Contrato público mínimo: `CommercialEntitlementSignal`.
• Adapter inicial: `getCommercialEntitlementSignal({ accountId })`.
• Fonte de leitura: `public.v_account_commercial_entitlement_effective`.
• Regra de segurança: fail-closed; erro, exceção, `accountId` vazio ou ausência de linha retornam não elegível.
• Limite: UI/client não acessa Supabase para entitlement comercial; consumo deve passar pelo boundary server-side.

Admin commercial entitlements
• Superfície administrativa mínima: `app/admin/(protected)/contas/[accountId]/page.tsx`.
• Path canônico de mutação: `app/admin/(protected)/contas/[accountId]/actions.ts`.
• Boundary server-only: `lib/admin/adapters/adminCommercialEntitlementsAdapter.ts`.
• Guard obrigatório: `requirePlatformAdmin`.
• Ator autorizado: `platform_admin`, incluindo `super_admin` pelo guard existente.
• Escrita: server-side via `createServiceClient()`.
• Persistência exclusiva: `public.account_commercial_entitlements`.
• Origem manual: `origin = liberacao_manual`.
• Operações mínimas autorizadas: concessão, atualização e cancelamento manual de entitlement.
• Regra de conflito: entitlement efetivo de `plano_pago_confirmado` ou `trial` deve falhar fechado.
• Entitlement manual `ativo` existente deve ser atualizado, não duplicado intencionalmente.
• Stripe, checkout e webhook não podem ser usados como bypass da liberação manual.
• Não criar rota, UI artificial, migration, schema, RPC, policy, grant, trigger, job ou automação para validar esse recorte.

Stripe webhook
• Endpoint canônico: `app/api/stripe/webhook/route.ts`.
• Runtime: Node.js, dinâmico, server-side.
• Boundary: `lib/billing-checkout/`.
• Adapter: `lib/billing-checkout/adapters/stripeWebhookAdapter.ts`.
• Secret obrigatório: `STRIPE_WEBHOOK_SECRET`.
• Assinatura Stripe deve ser validada antes de qualquer persistência.
• Evento que ativa/renova entitlement: `invoice.paid`.
• Eventos aceitos mas sem liberar entitlement neste recorte: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`.
• Idempotência: `public.stripe_webhook_events.event_id`.
• Persistência de entitlement: upsert server-side em `public.account_commercial_entitlements`.
• Retry permitido para evento `failed` e `processing` antigo.
• Logs e metadata devem ser mínimos e seguros, sem payload bruto, secrets, cartão ou PII sensível.

LP Builder
• Path canônico: `lib/lp-builder/`.
• Uso: boundary server-side da E19 para criação e evolução de landing pages por conta.
• Action canônica inicial: `app/lp-builder/actions.ts`.
• Adapter inicial: `createAccountLandingPage`.
• Persistência inicial: `public.account_landing_pages`.
• Status inicial permitido: `draft`.
• Regra de gate antes do insert: conta `active` + membership `active` com role `owner` ou `admin` + entitlement comercial válido.
• Entitlement comercial deve ser lido pelo boundary E9 existente, não duplicado no LP Builder.
• Escrita deve ocorrer server-side com permissão adequada; UI/client não acessa Supabase diretamente para criar LP.
• Logs server-side devem registrar falhas operacionais de forma segura, sem payload bruto, secrets, dados de cartão ou PII sensível.
• Escopo negativo técnico: sem editor visual, publicação, render público, domínio customizado, analytics, A/B, IA runtime, automação, agente ou job nesta fase.

3.14.1 Matching de taxonomia via adapter server-side
• Provider/API do resolvedor IA: OpenAI Responses API com Structured Outputs, sempre server-side.
• Configuração operacional do modelo IA, envs e redeploy: ver `docs/platform-config.md`.
• IA complementar: quando o matching determinístico não resolver com segurança, o runtime pode usar resolver server-side com OpenAI Responses API e Structured Outputs.
• Resolver canônico: PATH: `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`.
• Regra: IA não roda em `high`, não cria taxon, não cria alias, não grava em `account_taxonomy` e não substitui vínculo oficial.
• Regra: IA atualiza somente a resolução operacional em `account_niche_resolutions`.
• Regra: falha da IA não pode bloquear lead, setup, ativação da conta, `revalidatePath(route)` ou `redirect(route)`.
• Regra: `shouldCreateOfficialLink` no Structured Output deve permanecer sempre `false` no schema atual.
• Regra: prompt, payload bruto, aliases, candidatos completos e dados de formulário não devem ser persistidos.
• No pós-save do `pending_setup`, a integração determinística deve ocorrer server-side em `saveSetupAndContinueAction`, depois de salvar perfil, atualizar nome e promover a conta para `active`.
• Regra: `matchBusinessTaxonsDeterministic(validated.values.niche, 10)` pode ser chamado no fluxo server-side após validação do onboarding, mas falha no matching não pode bloquear o lead, `revalidatePath(route)` ou `redirect(route)`.
• Regra: a decisão observável do matching determinístico deve usar `evaluateDeterministicTaxonMatch(candidates)` e registrar somente metadados seguros.
• Regra: consumo de matching determinístico de taxonomia deve ocorrer somente via camada server/adapter do app.
• Regra: não chamar RPC de matching diretamente do client/UI.
• Regra: adapter deve retornar DTO final com candidatos oficiais; UI não normaliza nem interpreta rows crus do banco.
• Regra: não logar nicho bruto, `p_query`, aliases digitados ou valores de formulário.
• Adapter canônico: PATH: `lib/onboarding/niche-resolution/adapters/taxonMatchAdapter.ts`.
• Contrato público: PATH: `lib/onboarding/niche-resolution/contracts.ts`.
• Decisão de confiança determinística para taxon match deve usar o helper puro `evaluateDeterministicTaxonMatch` (PATH: `lib/onboarding/niche-resolution/deterministicConfidence.ts`).
• Contrato tipado da decisão determinística e de `aiEscalationMode` fica em `lib/onboarding/niche-resolution/contracts.ts`.
• Regra: não embutir avaliação de confiança, thresholds ou reasons semânticos inline em UI, route ou server action; reutilizar helper + contrato.
• `aiEscalationMode` é preparação contratual para evolução futura e não autoriza IA no runtime atual sem caso específico.
• Resolução operacional: após avaliar o matching determinístico no pós-save do `pending_setup`, o runtime pode persistir a resolução atual da conta via adapter server-side canônico em `lib/onboarding/niche-resolution/adapters/accountNicheResolutionAdapter.ts`.
• Regra: `account_niche_resolutions` registra a resolução operacional atual.
• Regra: falha de matching ou persistência da resolução não pode bloquear o lead, `revalidatePath(route)` ou `redirect(route)`.
• Vínculo oficial: após a resolução determinística, o runtime pode gravar vínculo oficial em `account_taxonomy` via adapter server-side canônico em `lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter.ts`.
• Regra: gravar `account_taxonomy` somente quando a decisão determinística for de alta confiança, houver candidato oficial com `taxon_id` e não houver necessidade de revisão administrativa.
• Regra: `account_niche_resolutions` permanece como registro operacional; `account_taxonomy` representa o vínculo oficial da conta com o taxon.
• Regra: falha na gravação do vínculo oficial não pode bloquear o lead, setup, ativação da conta, `revalidatePath(route)` ou `redirect(route)`.
• Regra MVP: se já houver vínculo primário ativo diferente, não substituir automaticamente; manter revisão humana para etapa futura.
• Regra: IA, microdiálogo, criação automática de taxon/alias e alteração de UI ficam fora deste recorte.
• Regra: logs do fluxo devem permanecer sem PII e não devem registrar `raw_input`, nicho bruto, query, aliases, candidatos completos ou dados de formulário.
• Regra: timestamps da resolução operacional devem ser controlados pelo banco.

3.15 Conteúdo composicional de `commercial_activation`
• Path canônico: `lib/conversion-content/commercial-activation/`.
• `content_json` v1 usa `schema_version = 1` e `sections` com `composition_item_id` e `content`.
• Módulo, variante, ordem e obrigatoriedade pertencem ao item da composição e não devem ser duplicados no artefato.
• O registry fechado é a fonte canônica de `variantKey → moduleKey → schema Zod → componente`.
• Envelope, seções e objetos internos devem usar validação estrita, rejeitando campos desconhecidos.
• Seção obrigatória ausente ou inválida invalida o artefato.
• Seção opcional ausente é omitida; seção opcional inválida é omitida com log seguro.
• IDs duplicados ou desconhecidos e combinações de módulo/variante não registradas invalidam o artefato.
• Conteúdo persistido deve ser estruturado; não aceitar HTML bruto, scripts, CSS, Tailwind ou nomes livres de componentes.
• CTAs v1 aceitam somente URL HTTPS válida ou caminho interno iniciado por uma única `/`; rejeitar `//`, âncoras e protocolos não aprovados.
• A validação deve ocorrer no servidor antes da renderização.
• Casos executáveis: `npm run validate:commercial-activation`.

3.15.1 Geração administrativa de draft de `commercial_activation`
• Path canônico do adapter de geração: `lib/conversion-content/commercial-activation/draft-generation.ts`.
• Entrada administrativa canônica: `app/admin/(protected)/templates/actions.ts`, protegida por `requirePlatformAdmin()`.
• A geração deve ser server-side/Admin, usando `createServiceClient()` para leituras e persistência permitidas pelo contrato de banco.
• Recurso de IA aprovado para fluxo linear de draft: OpenAI Responses API com Structured Outputs; o modelo deve ser configurado por `OPENAI_COMMERCIAL_ACTIVATION_MODEL`.
• O fluxo não deve depender de Agents SDK, Sandbox Agents, job, fila, agente ou IA em runtime público.
• Fontes de entrada permitidas: taxon, pesquisa ativa `business_buyer`, contexto `end_customer` apenas para proveniência, composição/variantes de `commercial_activation` e `public.plans` como fonte parcial de planos.
• `public.plans` só é fonte canônica parcial para `name`, `price_monthly`, `max_lps`, `max_conversions` e `features`; não é fonte para garantias, condições comerciais, checkout, promessas, descontos ou promoções.
• Antes da persistência, validar em duas camadas: envelope `CommercialActivationContentV1` e cada `section.content` contra o schema registrado para a `variant_key` permitida pela composição.
• Persistir apenas `status = draft`; publicação e alteração de `published` pertencem a fluxo transacional próprio.
• `content_artifact_research_sources` deve receber somente fontes relacionais `business_buyer`; contexto `end_customer` permanece apenas em `provenance_json`.
• CTA gerado deve usar `href` interno seguro aprovado pelo servidor; sem `href` seguro, bloquear antes de persistir.
• Se o insert das fontes relacionais falhar após criar o artifact, o draft recém-criado deve ser arquivado/invalidado e o fluxo deve retornar erro seguro, sem parecer concluído.
• Logs devem registrar somente metadados operacionais seguros; não registrar prompt completo, pesquisa bruta, payload sensível ou resposta integral da IA.

3.15.2 Parametrização raiz de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/`.
• Fonte canônica dos parâmetros e versões: `root-registry.ts`; não duplicar seus valores ou listas em documentos ou contratos públicos.
• Resolver versões e presets registrados por `root-resolver.ts`, com falha fechada e sem fallback implícito.
• Validar o contrato raiz por `root-schema.ts`; a saída resolvida deve permanecer imutável.
• Consumir o boundary pelo namespace `landingPageRoot` exportado em `lib/conversion-content/index.ts`.
• Não reutilizar as APIs removidas de composição, módulos, variantes, renderer ou render model.
• Especializações futuras devem preservar a precedência `raiz → módulo → variante`.
• Casos executáveis: `npm run validate:landing-page-root`.

3.15.3 Resolução de pesquisas estruturadas de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/research-resolution/`.
• Adapter server-side canônico: `lib/conversion-content/adapters/landingPageResearchAdapter.ts`.
• Consumidores devem usar `resolveLandingPageResearchForTaxon` e não consultar as tabelas diretamente nem reimplementar precedência ou herança.
• A entrada é o `taxon_id` já resolvido; este fluxo não resolve conta ou nicho e não cria persistência.
• `end_customer` usa somente o taxon atendido; `business_buyer` prioriza o conjunto próprio e admite somente o pai direto quando o próprio estiver ausente ou incompleto.
• Conjunto próprio inválido ou ambíguo deve falhar fechado, sem mistura parcial ou mascaramento pelo pai.
• O resultado deve preservar a proveniência das fontes e versões efetivamente usadas.
• O resolver puro não registra logs; o adapter pode registrar somente metadados seguros, sem conteúdo das pesquisas, PII, credenciais ou secrets.
• Casos executáveis: `npm run validate:landing-page-research`.

3.15.4 Catálogo de entradas de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/input-catalog/`.
• Fonte canônica das definições e versões: `registry.ts`; não duplicar seus campos, valores ou listas em documentos ou consumidores.
• Consumidores devem usar `resolveLandingPageInputCatalog` pelo namespace `landingPageInputCatalog` exportado em `lib/conversion-content/index.ts`.
• O resolver é puro e repo-only; recebe versão, plano e cadeia taxonômica já determinada, sem consultar Supabase, Stripe, assinatura, entitlement ou valores operacionais.
• A resolução aplica as camadas `universal → segmento → nicho → ultranicho`; camada própria de ultranicho exige autorização explícita, enquanto sua ausência preserva a herança.
• Especializações só podem ocorrer em camada estritamente mais específica e restringir obrigação, planos permitidos ou validação comparável, preservando identidade, tipo, escopo, origem, condições, snapshot e evidência.
• Referências de `requiredWhen` e `applicableWhen` devem existir, respeitar a compatibilidade entre planos e permanecer válidas após o filtro pelo plano solicitado.
• A avaliação concreta das condições e a completude dos valores pertencem ao fluxo consumidor de coleta e geração, não ao resolver do catálogo.
• A saída deve permanecer determinística e profundamente imutável, preservando taxon atendido, camadas aplicadas, proveniência, validação, evidência e sinal de validade.
• Casos executáveis: `npm run validate:landing-page-input-catalog`.

3.15.5 Catálogo de módulos e variantes de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/module-catalog/`.
• `registry.ts` é a fonte única das definições versionadas de módulos, variantes, fields, mapas de fontes e perfis de funil; fields e seus mapas pertencem às variantes, sem registry paralelo.
• Consumidores devem usar `resolveLandingPageModuleCatalog` pelo namespace `landingPageModuleCatalog` exportado em `lib/conversion-content/index.ts`; registry e schema não integram a API pública.
• A entrada runtime é estrita e falha fechado para shape, versão, módulo, variante, perfil ou preset desconhecido, sem fallback aproximado nem exceção não tratada.
• A resolução aplica `raiz → módulo → variante` e `perfil-base → delta do módulo`, devolvendo contratos efetivos, rastreáveis e profundamente imutáveis; consumidores não reaplicam deltas.
• Especializações podem apenas restringir. Proibições prevalecem sobre restrições, que prevalecem sobre permissões; lifecycle da raiz, do módulo e da variante permanece separado no vocabulário canônico.
• Sources textuais permanecem junto dos fields e distinguem pesquisa estruturada, evidência operacional e pesquisa com suporte operacional declarativo; uma referência sintaticamente válida não comprova integridade com outro registry.
• Interações de variante usam coleção de união discriminada estrita; Form e Accordion são os únicos kinds atuais, e cada kind aparece no máximo uma vez por variante.
• Interaction contracts são a fonte canônica das capabilities interativas; capabilities de ação e imagem são derivadas dos fields. O registry não mantém booleanos ou propriedades paralelas para a mesma condição.
• O contrato de Form preserva fields abstratos, consentimento, privacidade, binding e acessibilidade estrutural, sem definir UI, HTML, ARIA, submissão ou conformidade integral com WCAG.
• Um interaction kind novo evolui uma vez o contrato TypeScript, a união, o schema e sua suíte; variantes posteriores reutilizam o kind sem ampliar os mecanismos. Mídia avançada só recebe moldura discriminada própria no primeiro caso real.
• Ações registram somente vínculos operacionais abstratos; valores permitidos e compatibilidades concretas permanecem na fonte canônica versionada.
• O boundary permanece repo-only e não executa composição, persistência ou renderização.
• Casos executáveis: `npm run validate:landing-page-module-catalog`.

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
• Escrita (autoritativa) no guard SSR de seção cliente (PATH: app/a/_server/section-guard.ts), consumido por /a/[account]/layout.tsx, somente quando ctx existe, ctx.blocked=false e houver subdomain canônico (ctx.account.subdomain).
• Atributos obrigatórios: HttpOnly; SameSite=Lax; Max-Age=7776000; Path=/.
• Secure: true em produção (NODE_ENV=production).
• Leitura do cookie ocorre no SSR do gateway /a/home.
• Limpeza do cookie: /a/home?clear_last=1 (middleware zera Max-Age=0) e, em bloqueio, o guard SSR de seção cliente deleta cookie (best-effort) antes de redirecionar.
• /a/home não define cookie (apenas lê; clear_last=1 ignora cookie no SSR e delega limpeza ao middleware).

5.2 Adapters, Guards, Providers

5.2.1 Adapters
• taxonMatchAdapter (PATH: lib/onboarding/niche-resolution/adapters/taxonMatchAdapter.ts): consumo server-side da RPC `match_business_taxons_deterministic`, com retorno DTO camelCase de candidatos oficiais de taxonomia e tratamento seguro de erro sem PII.
• accountAdapter (PATH: lib/access/adapters/accountAdapter.ts): operações de conta e status no runtime, com normalização de status e mutações idempotentes quando aplicável.
• accountProfileAdapter (PATH: lib/access/adapters/accountProfileAdapter.ts): persistência/atualização do perfil operacional da conta (E10.4.6).
• accessContextAdapter (PATH: lib/access/adapters/accessContextAdapter.ts): leitura do contexto em v_access_context_v2, decisão de acesso (allow/deny), fallback de primeira conta via RPC quando não há membership e observabilidade de deny vs error.
• adminAdapter (PATH: lib/admin/adapters/adminAdapter.ts): valida privilégios administrativos (super_admin/platform_admin) e centraliza operações administrativas do runtime atual.
• Regra: setup_completed_at/account_setup_completed_at é legado/deprecated; não usar em gating, fluxo, renderização ou logs. Setup concluído no runtime é decidido por accounts.status.

5.2.2 Guards
• guard SSR da seção cliente (PATH: app/a/_server/section-guard.ts): aplica allow/deny de /a/{account_slug} e redirecionamentos de bloqueio na seção cliente.
• guard SSR da seção Admin (PATH: app/admin/layout.tsx): protege a seção administrativa, reaproveita `requirePlatformAdmin()` e concentra a moldura inicial do Admin.
• Infra shared de privilégio admin permanece ativa via helpers/guards (`requirePlatformAdmin()` e `requireSuperAdmin()`), agora consumida pela superfície `/admin` ativa no runtime.
• guards legados compartilhados (PATH: lib/access/guards.ts): utilitários de validação de acesso usados pelo runtime.

5.2.3 Providers
• AccessProvider (PATH: providers/AccessProvider.tsx): carrega contexto de acesso no app.
• account-switcher (PATH: components/features/account-switcher/*): consome v_user_accounts_list via /api/user/accounts.

5.3 Fluxos de Sessão

5.3.1 Login (MVP)
• Login primário em /auth/login.
• Sucesso preserva next seguro; quando partir do contexto administrativo, deve retornar para `/admin`.
• Sem retorno explícito, fluxo padrão: /protected → /a/home → /a/{account_slug}.
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
• IA de resolução de nicho: logs devem registrar apenas sinais seguros como status, modo UX, quantidade de opções, necessidade de revisão/confirmação, persistência e código de erro seguro; não logar prompt, payload bruto, `niche`, `raw_input`, query, aliases, candidatos completos, `name`, `whatsapp` ou `site_url`.
• server-timing/proxy-status não observados nos requests testados via DevTools
• Diretriz: se precisar medir, instrumentar via logs/Apm e/ou headers próprios no server
• Server Actions críticas devem emitir logs estruturados (JSON) com request_id e latency_ms (padrão mínimo).
• Regra (logs sem PII): não logar valores de formulário (ex.: name, whatsapp, site_url).
• Onboarding pós-save (E10.4.6): revalidatePath(route) antes do redirect para evitar UI stale.
• Matching de taxonomia: quando a RPC determinística for consumida em runtime, observability mínima deve registrar apenas metadados não sensíveis, como request_id, latency_ms, candidates_count, top_match_source e top_score; eventos canônicos: `setup_taxonomy_match_evaluated` e `setup_taxonomy_match_failed`; não logar nicho bruto, `p_query`, query, aliases digitados, dados de formulário ou valores identificáveis do usuário.
• Vínculo oficial de taxonomia: logs devem registrar apenas sinais seguros de avaliação, gravação, skip ou falha do vínculo em `account_taxonomy`; não logar `niche`, `raw_input`, query, aliases, candidatos completos, `name`, `whatsapp` ou `site_url`.

5.3.5 Signup
• Entrada: /auth/sign-up (SignUpForm usa supabase.auth.signUp) (PATH: components/sign-up-form.tsx).
• Sucesso do signUp: redirecionar para /auth/sign-up-success (mensagem de confirmação para checar o e-mail).
• Regra: signUp deve usar emailRedirectTo apontando para /auth/confirm?next=/a/home (somente path interno).
• Regra (correlação ponta a ponta): gerar rid no client (não-PII) e anexar no emailRedirectTo como querystring (ex.: &rid=<rid>) para rastrear submit → e-mail → confirm → redirect.
• Regra (supa#5 no client — Auth/signup): emitir logs estruturados para eventos de signup/resend com rid e sem PII (não logar email/senha nem valores sensíveis).
• Regra (observabilidade mínima na Vercel): logs no runtime do front em produção devem permitir diagnóstico rápido do fluxo por rid (submit/resultado).
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
• allow/deny é responsabilidade do guard SSR de seção cliente (PATH: app/a/_server/section-guard.ts), consumido por /a/[account]/layout.tsx.
• /a/home bypassa o guard SSR de seção cliente consumido em app/a/[account]/layout.tsx.
• Se o guard SSR de seção cliente negar com usuário autenticado: redirecionar para /a/home?clear_last=1 para limpar o cookie e forçar fallback determinístico (sem loop).
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
• Regra: se um arquivo crítico mudar de path, atualizar esta Base Técnica somente quando a mudança afetar regra, boundary, allowlist ou contrato técnico (ver 3.3.2).

6.3 Tipos e contratos críticos (mínimo normativo)
• Fonte única de tipos canônicos: PATH: lib/types/status.ts
• Regra: proibido redefinir AccountStatus, MemberStatus, MemberRole fora do arquivo canônico
• Contratos e reexports existentes fora dos paths canônicos podem permanecer por compatibilidade; isso não altera a regra canônica de código novo definida em 3.3.2.

6.4 Arquivos SULB autorizados a importar Supabase (fonte única normativa)
Fonte normativa da allowlist SULB para exceções de Auth. Qualquer novo arquivo em app/auth/ não pode importar @supabase/* até ser incluído nesta lista.
• lib/supabase/client.ts
• lib/supabase/middleware.ts
• lib/supabase/server.ts
• lib/supabase/service.ts
• app/auth/confirm/route.ts
• app/auth/update-password/page.tsx
• app/auth/protected/page.tsx

7. Checklist mínima (anti-regressão)
• Segurança de DB e views (security_invoker, RLS, SECURITY DEFINER): validar pelas seções 3.1 e 4 (PATH: docs/schema.md).
• Regras de acesso/SSR da rota /a e cookie last_account_subdomain: validar por 5.1.2 e 5.4.
• Imports/adapters e allowlist SULB: validar por 2.5 e 6.4.
• Anti-regressão de mutações/queries (ex.: .maxAffected(1), search_path): validar por 3.8 e 3.12.
• Tipos canônicos e adapters vNext: validar por 3.6 e 3.14.
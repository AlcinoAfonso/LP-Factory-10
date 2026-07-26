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
• Boundary canônico: `lib/billing-checkout/`, server-side, com contratos públicos, normalização e adapters de provedor definidos no próprio código.
• UI/client não acessa secrets nem cria sessão de checkout diretamente.
• Redirect de sucesso ou cancelamento não comprova pagamento e não libera entitlement.
• Provedor, planos, recorrências, mapeamentos e configuração operacional pertencem ao boundary real e a `docs/platform-config.md`; não duplicar suas listas aqui.
• Checkout não substitui o domínio de entitlement comercial; ativação exige confirmação server-side pelo fluxo aprovado.

3.4 CI e validação
• Alterações devem passar por PR, validações aplicáveis e preview quando houver impacto no runtime ou na UI; o merge final é humano.
• Checks de segurança devem falhar fechado e bloquear padrões proibidos no client/UI; exceções server-side devem ser explícitas e mínimas no workflow canônico.
• Alterações em acesso ou Auth devem validar os fluxos afetados conforme os contratos operacionais em `docs/automations.md` e nos READMEs locais.
• Workflows, gatilhos, runners, actions, versões, inputs e steps têm fonte canônica no repositório real e em `docs/platform-config.md`; não duplicar esses detalhes aqui.
• Antes do merge, aplicar o checklist da seção 7.

3.4.1 Manutenção de dependências
• Atualizações de dependências devem preservar o alinhamento entre `package.json` e `package-lock.json` e usar instalação reprodutível.
• Rotinas automatizadas de manutenção devem executar validações aplicáveis, bloquear publicação quando a validação crítica falhar e commitar somente quando houver mudança real.
• O workflow e seus detalhes operacionais permanecem canônicos em `.github/workflows/` e no repositório real.

3.4.2 Validação local e sandbox
• `AGENTS.md` é a fonte canônica das regras de execução e validação no ambiente de agentes.
• Para alterações de código, a rotina padrão é `npm ci` seguida de `npm run check`; os scripts exatos permanecem em `package.json`.
• Para alterações exclusivamente documentais, essas validações podem ser não aplicáveis, com justificativa na entrega.
• Build não integra a rotina padrão do sandbox; quando aplicável, deve ser validado pelo CI ou pela Vercel.

3.4.3 Automações e inspeções operacionais
• Automações devem permanecer isoladas em `automations/`; `.github/workflows/` atua somente como entrada e orquestração.
• Catálogo, uso e comportamento operacional pertencem a `docs/automations.md` e aos READMEs locais; secrets, ambientes e configuração de workflows pertencem a `docs/platform-config.md`.
• Inspeções de banco por automação devem ser read-only, salvo mutação expressamente aprovada em contrato próprio.

3.4.4 Migrations Supabase versionadas
• Runtime não pode depender de objeto ou comportamento de banco ainda não aplicado e validado no ambiente alvo.
• Alterações de schema devem usar nova migration em `supabase/migrations/`, com revisão e validação antes do apply remoto.
• SQL avulso é permitido apenas para inspeção read-only ou exceção expressamente autorizada; o SQL Editor não integra o fluxo normal de alteração de schema.
• Migration aplicada é imutável; correção ou reversão exige nova migration incremental, preservando histórico forward-only.
• Apply remoto deve ocorrer somente pelo workflow aprovado após merge humano; gatilhos, gates, secrets, versões de CLI/Actions e projeto alvo pertencem ao workflow real e a `docs/platform-config.md`.
• Actions e CLIs capazes de alterar schema devem usar referências controladas e passar por revisão antes de qualquer mudança.

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

3.8 Integração com o contrato de banco
• `docs/schema.md` é a fonte canônica do estado real e dos detalhes de objetos do banco.
• Alteração de schema exige migration versionada, atualização de `docs/schema.md` e revisão de views, functions, RPCs e adapters dependentes.
• Runtime não pode redefinir nem assumir objetos, colunas ou comportamentos ausentes do ambiente alvo.

3.8.1 Convenções transversais para novas tabelas

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
• Toda tabela deve ter decisão explícita de segurança, acesso, auditoria e participação no Trigger Hub.
• Tabela exposta ao app, tenant, admin ou fluxo operacional deve nascer com RLS, policies e grants aplicáveis na mesma migration.
• Tabela interna pode omitir grants para `anon` e `authenticated` quando seu modelo de acesso estiver explícito.
• Grants e RLS/policies são controles independentes; nenhum substitui o outro.

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

3.12 PostgREST e Data API
• `search_path` deve permanecer fixado conforme o contrato de banco aplicável.
• Consultas com múltiplas relações devem usar aliases explícitos para evitar colisão de chaves.
• Busca textual exige índice justificado pela consulta ativa e pela necessidade de desempenho.
• Em paginação por range, HTTP 416 / PGRST103 representa fim da lista, não erro de sistema; preservar itens carregados e interromper novas requisições.

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
• Boundary canônico: `lib/commercial-entitlements/`; contratos públicos e adapter de leitura permanecem como fonte da API real.
• Leitura de elegibilidade é server-side e fail-closed para entrada inválida, ausência de linha, erro ou exceção.
• UI/client não consulta Supabase diretamente para determinar entitlement comercial.
• View, campos e estados persistidos pertencem a `docs/schema.md` e ao código; não duplicar seus inventários aqui.

Admin commercial entitlements
• Mutação administrativa é server-only, protegida por `requirePlatformAdmin()` e centralizada no boundary Admin existente.
• O fluxo manual pode conceder, atualizar ou cancelar entitlement, deve atualizar o registro ativo quando aplicável e falhar fechado diante de conflito ou duplicidade.
• Checkout, Stripe e webhook não podem servir como bypass da operação administrativa autorizada.
• Superfícies, funções, payloads e persistência exatos permanecem canônicos no código e em `docs/schema.md`.

Stripe webhook
• Endpoint e processamento permanecem server-side no boundary `lib/billing-checkout/`.
• Assinatura e tipo de evento devem ser validados antes de qualquer persistência.
• Processamento deve ser idempotente, tolerar retry seguro e liberar entitlement somente pelo evento aprovado no código.
• Eventos, secrets, tabelas e estados exatos pertencem ao endpoint real, a `docs/platform-config.md` e a `docs/schema.md`.
• Logs e metadata devem ser mínimos e não conter payload bruto, secrets, cartão ou PII sensível.

LP Builder
• Boundary canônico: `lib/lp-builder/`; contratos, adapter e action reais permanecem fontes da API.
• Criação de LP é server-side e deve falhar fechado sem usuário autenticado, conta ativa, membership ativo autorizado e entitlement comercial válido.
• O LP Builder deve consumir o boundary de entitlement existente, sem duplicar sua lógica.
• Persistência inicial permanece limitada a draft; schema e campos exatos pertencem a `docs/schema.md` e ao código.
• UI/client não acessa Supabase diretamente para criar LP; evolução funcional fora do runtime atual pertence ao roadmap.

3.14.1 Resolução de nicho e taxonomia
• Boundary canônico: `lib/onboarding/niche-resolution/`; contratos, thresholds, reasons, schemas e adapters permanecem canônicos no código.
• Matching, avaliação de confiança e persistência devem ocorrer server-side; UI, routes e actions não podem chamar RPC diretamente nem reimplementar thresholds ou decisões semânticas.
• IA complementar só pode ser usada quando o resultado determinístico for insuficiente, com Structured Outputs e configuração operacional em `docs/platform-config.md`.
• IA não cria taxon ou alias, não grava vínculo oficial e não substitui decisão determinística de alta confiança.
• `account_niche_resolutions` representa a resolução operacional; `account_taxonomy` representa o vínculo oficial e só pode ser gravado quando o contrato de alta confiança permitir, sem substituir automaticamente vínculo primário diferente.
• Falhas de matching, IA ou persistência não podem bloquear setup, ativação, revalidação ou redirect.
• Logs e persistência não devem conter prompt, payload bruto, nicho bruto, aliases, candidatos completos, formulário ou PII; objetos e campos exatos pertencem a `docs/schema.md`.

3.15 Conteúdo composicional de `commercial_activation`
• Boundary canônico: `lib/conversion-content/commercial-activation/`; registry, schemas, resolver e renderer são fontes do contrato executável.
• Composição define módulo, variante, ordem e obrigatoriedade; o artefato não deve duplicar essas decisões.
• Conteúdo persistido deve ser estruturado e validado estritamente no servidor; HTML bruto, scripts, CSS, Tailwind e nomes livres de componentes são proibidos.
• Seção obrigatória ausente ou inválida invalida o artefato; seção opcional inválida pode ser omitida somente com log seguro.
• IDs desconhecidos, duplicados ou combinações não registradas devem falhar fechado.
• CTAs devem usar destino seguro aprovado pelo contrato; schemas, variantes e casos executáveis permanecem canônicos no código e em `package.json`.

3.15.1 Geração administrativa de draft de `commercial_activation`
• Geração é server-side/Admin, protegida por `requirePlatformAdmin()`, usando Responses API com Structured Outputs e configuração em `docs/platform-config.md`.
• O fluxo é linear e não depende de Agents SDK, job, fila, agente ou IA no runtime público.
• Somente fontes aprovadas pelo código e pelo Schema podem alimentar a geração; dados de planos são fonte parcial e não autorizam garantias, condições, descontos, promoções ou promessas comerciais.
• Antes de persistir, validar o envelope e cada seção contra a composição e o registry efetivos.
• Persistência é somente como draft; publicação exige fluxo próprio. Proveniência relacional e contextual deve respeitar o contrato do código e do Schema.
• Falha parcial após criação deve ser compensada para não aparentar conclusão; logs não incluem prompt integral, pesquisas brutas, payload sensível ou resposta completa da IA.

3.15.2 Parametrização raiz de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/`; contracts, registry, schema e resolver são fontes executáveis.
• Consumidores devem usar a API pública exportada por `lib/conversion-content/index.ts`, sem acessar registry ou schema diretamente.
• Versão, preset ou parâmetro desconhecido deve falhar fechado, sem fallback implícito; a saída resolvida deve permanecer imutável.
• Evolução deve preservar a precedência `raiz → módulo → variante`; APIs removidas não podem ser reutilizadas.

3.15.3 Resolução de pesquisas estruturadas de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/research-resolution/`, consumido pelo adapter server-side de `conversion-content`.
• Consumidores devem usar a API pública e não consultar tabelas diretamente nem reimplementar precedência ou herança.
• A resolução recebe taxon já determinado; `end_customer` usa o taxon atendido e `business_buyer` admite pai direto somente quando o conjunto próprio estiver ausente ou incompleto.
• Conjunto próprio inválido ou ambíguo deve falhar fechado, sem mistura parcial nem mascaramento pelo pai.
• Resultado preserva proveniência; resolver permanece puro e adapter registra apenas metadados seguros.

3.15.4 Catálogo de entradas de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/input-catalog/`; registry, contracts, schema e resolver são fontes executáveis.
• O resolver é puro e repo-only, sem consultar Supabase, Stripe, assinatura, entitlement ou valores operacionais.
• Resolução segue `universal → segmento → nicho → ultranicho`; especializações só podem restringir e devem preservar identidade, tipo, origem, condições e evidência.
• Referências condicionais devem existir e permanecer válidas após o filtro de plano; avaliação dos valores concretos pertence ao consumidor.
• A saída deve ser determinística, rastreável e profundamente imutável.

3.15.5 Catálogo de módulos e variantes de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/module-catalog/`; registry e contracts são fontes das definições versionadas.
• Consumidores devem usar o resolver público; registry e schema não integram a API externa do boundary.
• Entrada desconhecida ou inválida deve falhar fechado; a resolução efetiva deve ser rastreável e profundamente imutável.
• Especializações só podem restringir; consumidores não reaplicam deltas nem mantêm propriedades paralelas para condições deriváveis.
• Interaction contracts são a fonte das capabilities interativas e devem ser evoluídos uma vez por novo kind, com reutilização pelas variantes.
• O boundary permanece repo-only e não executa composição, persistência ou renderização.

4. DB Contract
• `docs/schema.md` é a fonte única de tabelas, views, functions, RPCs, triggers, policies, constraints, grants e do estado exato do banco.
• Esta Base Técnica mantém somente guardrails transversais de implementação e não deve duplicar inventários de objetos.
• Alterações no banco exigem atualização do Schema e revisão das dependências no código.
• `SECURITY DEFINER` só é permitido quando estiver explicitamente aprovado no Schema, com motivo e limites.
• Views expostas a usuário devem usar `security_invoker = true` e estar registradas no Schema.

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

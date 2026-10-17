0. Introdução

0.1 Cabeçalho
- Documento: Base Técnica LP Factory 10
- Versão: v2.0.96
- Data: 17/10/2026

0.2 Contrato do documento (consulta)
- Regras técnicas duráveis; não mantém inventários, configuração externa ou histórico de casos.

0.2.1 TIPO_DO_DOCUMENTO
- TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
- Consultar em runtime, SSR, acesso, segurança, adapters, imports, camadas e observabilidade.
- Fontes próprias: execução em `AGENTS.md`; plataformas/envs/secrets em `docs/platform-config.md`; banco em `docs/schema.md`; casos em `docs/roadmap.md`; visual em `docs/design-system.md`.

1. Identificação do Projeto
- LP Factory 10; repositório canônico `AlcinoAfonso/LP-Factory-10`.
- Consultar o GitHub real antes de assumir paths, branches, arquivos ou estrutura. Configuração externa em `docs/platform-config.md`.

2. Stack & Dependências

2.1 Framework
- Core: Next.js App Router, SSR/Server Components, React, TypeScript strict e Zod.
- Versões: `package.json` e `package-lock.json`; npm canônico com lockfile alinhado e versionado.
- Runtime Node.js; versão confirmada no ambiente real. Defaults do framework seguem 3.13.

2.2 Backend
- Supabase: PostgreSQL, Auth, Storage, RLS e PostgREST/Data API; configuração em `docs/platform-config.md`.
- Mutações 1:1 exigem `.maxAffected(1)`; validação JWT usa JWKS + `kid`.

2.3 UI
- Visual/componentes/tokens/estados: `docs/design-system.md`; aqui somente segurança, imports e boundaries.
- SULB é o vendor interno de Auth copiado do Supabase. Auth fora desse escopo exige exceção expressa nesta Base; alterações somente quando necessárias e conforme allowlist 6.4.

2.4 Configurações operacionais de Auth
- Redirect URLs, SMTP/Resend, sender e DNS: `docs/platform-config.md`.

2.5 Regras de Import (canônica)
- `@supabase/*` somente em adapters de domínio, `lib/supabase/*` e exceções SULB de 6.4.
- UI/client não consulta dados de domínio no Supabase. Auth/SULB usa wrappers de `lib/supabase/*`, salvo import direto expressamente autorizado em 6.4.
- Este bloco é normativo para imports; demais seções somente o referenciam.

3. Regras Técnicas Globais

3.1 Segurança
- Views expostas a usuário: `security_invoker = true`; tabelas sensíveis: RLS obrigatório.
- Dados sensíveis não podem ficar acessíveis no client. Cookie da última conta segue 5.1.2.

3.2 Fluxo de acesso a dados
- Fluxo: UI → Providers → Adapters → DB; imports Supabase seguem 2.5.

3.3 Estrutura canônica
- Domínio: `adapters/` para DB, `contracts.ts` público e `index.ts` para reexports; DB somente por adapters. Tipos canônicos de status seguem 6.3.

3.3.1 Vocabulário e topologia
- Camada: Core no root, `automations/` ou `services/` com deploy independente; `.github/workflows/` somente orquestra.
- Seção do Core: Account, Admin ou Partner Dashboard. Domínio transversal serve seções; `access` concentra acesso compartilhado.
- Boundary exige responsabilidade e massa de código próprias. Path canônico é a residência obrigatória de artefatos novos.

3.3.2 Classificação, boundaries e paths
- Antes de novo recorte: camada → seção/domínio → boundary → path → shared real ou falso shared.
- Confirmar paths no repositório; exceção existente não vira padrão.
- Componente dependente de action, estado ou boundary da rota nasce em `app/.../_components`; `components/features` exige compartilhamento real.
- Não antecipar boundary Partner nem manter seção/boundary de produto retirado sem consumidor.

3.3.3 Billing checkout
- Checkout server-side em `lib/billing-checkout/`; contratos/adapters no código e configuração externa em `docs/platform-config.md`.
- UI não acessa secrets nem cria sessão diretamente. Redirect não comprova pagamento; entitlement exige confirmação server-side pelo fluxo aprovado.

3.4 CI e validação
- Git, PR, autoridade de merge e validações: `AGENTS.md`; Preview quando houver impacto em runtime/UI.
- Checks de segurança falham fechado contra padrões proibidos no client; exceções server-side explícitas e mínimas no workflow canônico.
- Acesso/Auth valida fluxos afetados conforme `docs/automations.md` e READMEs locais. Workflows/configuração externa não são inventariados aqui.
- Runs, checks, commit statuses, logs, Job Summaries, artefatos, Previews e deployments históricos expiram e nunca são prova exclusiva de encerramento. Conclusão durável no PR/Git e nas fontes canônicas.
- Antes do merge, aplicar a seção 7.

3.4.1 Manutenção de dependências
- Manter package/lockfile alinhados e instalação reprodutível.
- Manutenção automática valida, bloqueia publicação se falhar gate crítico e commita somente mudança real; detalhes no workflow vigente.

3.4.2 Validação local e sandbox
- Rotina de validação, exceção documental e build no sandbox: `AGENTS.md`; scripts em `package.json`. Build aplicável é validado em CI/Vercel.

3.4.3 Automações e inspeções operacionais
- Automações isoladas em `automations/`; workflows somente orquestram.
- Catálogo/uso: `docs/automations.md` e README local; plataformas/secrets por nome: `docs/platform-config.md`.
- Inspeção de banco read-only, salvo mutação expressamente aprovada.

3.4.4 Migrations Supabase versionadas
- Runtime só depende de banco aplicado e validado no ambiente alvo.
- Schema muda por nova migration em `supabase/migrations/`, revisada e validada antes do apply remoto. Migration aplicada é imutável; correção/reversão incremental forward-only.
- SQL avulso só para inspeção read-only ou exceção expressa; SQL Editor fora do fluxo normal.
- Apply somente pelo workflow aprovado após merge autorizado; gates, versões, CLI, secrets e projeto em `docs/platform-config.md` e no workflow.
- Actions/CLIs mutáveis exigem referências controladas e revisão prévia.

3.5 Secrets & Variáveis
- Código server-side lê variáveis somente pelos nomes de `docs/platform-config.md`. Secrets nunca em chat, log, print, client bundle ou documento.
- Vazamento exige revogação e substituição imediatas. Flags, endpoints, projetos e escopos ficam na fonte operacional.

3.6 Tipos TypeScript
- Tipos canônicos de `lib/types/status.ts` não são redefinidos em outro módulo; ver 6.3. Adapters normalizam valores do DB.

3.7 Convenções
- TS: camelCase
- SQL: snake_case
- -1 = ilimitado para limites numéricos

3.8 Integração com o contrato de banco
- `docs/schema.md` governa objetos e comportamentos do banco. Mudança exige migration, atualização do Schema e revisão de views, functions, RPCs e adapters dependentes.
- Runtime não redefine nem presume contrato ausente do ambiente alvo.

3.8.1 Convenções transversais para novas tabelas

3.8.1.1 Chave primária
- Entidade: `id uuid primary key default gen_random_uuid()`
- Relação 1:1: FK como PK
- Vínculo puro N:N: PK composta

3.8.1.2 Relacionamentos
- Toda FK deve ser explícita
- Toda FK deve definir `ON DELETE` e `ON UPDATE`

3.8.1.3 Campos de domínio
- Campos como `status`, `type`, `scope`, `source_type`, `context_type` e equivalentes não nascem como texto solto sem contrato
- Quando a tabela tiver histórico operacional, deve haver decisão explícita sobre `created_at` e `updated_at`

3.8.1.4 Constraints e índices
- Toda unicidade relevante deve ser protegida no BD
- Índice só entra por motivo claro: FK relevante, unicidade, hierarquia ou consulta operacional prevista

3.8.1.5 Segurança e governança
- Toda tabela deve ter decisão explícita de segurança, acesso, auditoria e participação no Trigger Hub.
- Tabela exposta ao app, tenant, admin ou fluxo operacional deve nascer com RLS, policies e grants aplicáveis na mesma migration.
- Tabela interna pode omitir grants para `anon` e `authenticated` quando seu modelo de acesso estiver explícito.
- Grants e RLS/policies são controles independentes; nenhum substitui o outro.

3.9 Rate limit administrativo
- Não reutilizar contratos legados de tokens ou limites removidos.
- Nova política de limite deve ser definida no boundary administrativo responsável, com escopo, chave, janela, resposta e observabilidade explicitamente contratados.
- Ausência de política aprovada não autoriza fallback permissivo nem limite inventado no client.

3.10 Anti-Patterns
- Não hardcodar lógica de planos/limites. Demais proibições: imports/SULB em 2.5 e 6.4; views em 3.1; cookie em 5.1.2.

3.11 Capacidades comerciais e grants
- `lib/commercial-entitlements/` informa plano efetivo; `lib/commercial-capabilities/` resolve capacidades repo-only por API pública fail-closed, com registry interno.
- Medição e gate ficam no consumidor; plan_id, nome ou metadado legado isolados não liberam capacidade.
- get_feature, herança section → lp → account → plan → default e snapshot por conta não são contratos materializados. Grants/overrides/snapshots futuros exigem recorte aprovado e substituição explícita da fonte, sem resolver paralelo.

3.12 PostgREST e Data API
- Fixar search_path conforme Schema e usar aliases explícitos em consultas com múltiplas relações.
- Índice de busca textual exige consulta ativa e necessidade de desempenho justificada.
- HTTP 416/PGRST103 terminal encerra paginação por range e preserva itens carregados.
- Erro de domínio/conflito não usa código transacional que acione retry automático.

3.13 Compatibilidade do framework
- Aguardar APIs assíncronas de SSR/Server Components quando exigido: cookies, headers, params e searchParams.
- Sessão/cookie exigem rota dinâmica, sem cache compartilhado entre usuários.
- Preferir bundler/defaults nativos, incluindo Turbopack quando aplicável; evitar webpack customizado quando tsconfig resolver.
- Formulários/actions seguem APIs vigentes; versões e contratos exatos no código/dependências.

3.14 Padrão de Adapters
- DB via adapters coesos no boundary; legado fora do path pode permanecer por compatibilidade, sem expansão. Dividir quando houver múltiplas responsabilidades.
- Retornar DTO final, sem DBRow ou normalização na UI. Shape incompatível exige versão e migração explícitas.
- Colunas explícitas, ordem determinística e enums sem fallback silencioso. Paginação segue 3.12; deny difere de erro operacional.

3.14.1 Commercial entitlements
- Elegibilidade por API pública server-side de `lib/commercial-entitlements/`; entrada inválida, ausência, erro ou exceção falham fechado. UI não consulta Supabase diretamente.
- View/campos/estados no Schema e no código.

3.14.2 Admin commercial entitlements
- Mutação server-only no Admin, protegida por requirePlatformAdmin; concede, atualiza ou cancela, atualizando ativo quando aplicável e recusando conflito/duplicidade.
- Checkout/Stripe/webhook não contornam essa autoridade. Payloads e persistência no código/Schema.

3.14.3 Stripe webhook
- Processamento server-side em `lib/billing-checkout/`; validar assinatura e evento antes de persistir, com idempotência e retry seguro.
- Entitlement somente pelo evento aprovado no código. Configuração em `docs/platform-config.md`; persistência no Schema; sem payload bruto, cartão, secret ou PII sensível em logs/metadata.

3.14.5 Resolução de nicho e taxonomia
- `lib/onboarding/niche-resolution/` governa contratos, thresholds e schemas. Matching, confiança e persistência server-side; UI/actions/routes não chamam RPC nem duplicam decisões semânticas.
- Resolvedor complementar só usa IA quando determinístico insuficiente, com Structured Outputs e configuração operacional canônica. Não cria taxon/alias nem grava vínculo oficial; sugestão inferida exige confirmação humana e revalidação do candidato permitido com proveniência user_confirmed_ai.
- Resolução operacional difere do vínculo oficial em account_taxonomy. Escrita autorizada exige validação determinística e não substitui primário diferente silenciosamente.
- Falha técnica permite retry/correção; ausência semântica legítima permite entendimento operacional confirmado, sem inventar taxon. Falha de persistência impede conclusão parcial.
- Logs não levam prompt, resposta, formulário, payload, aliases ou candidatos completos; domínio persiste somente contexto necessário sob limites/ACLs do Schema.
- Taxon nasce inativo; CRUD administrativo exige platform_admin, pai ativo e concorrência otimista. Atendimento não mantém taxons/aliases; sem gate factual E20. Conversa segue 3.14.6.

3.14.6 Pending Setup conversacional
- `lib/onboarding/pending-setup/` isola persistência; client e boundaries de acesso, perfil e taxonomia não a acessam diretamente.
- Conversa executável somente para conta pending_setup, membership ativa e owner autenticado. Após active, preservar transcript/vínculo sem chat executável.
- Histórico append-only por conta/usuário. Reservar versão/token antes dos efeitos; reautorizar na escrita; retomada idempotente sem duplicar entrada ou efeito.
- Novas conversas inicializam Diálogo/Resumo sem backfill, cópia ou inferência histórica; legadas mantêm seu motor. Desligar gate após turno IA suspende, preservando estado; reativar retoma o mesmo motor, sem estado de alternância.
- Diálogo pertence à conta e identifica o participante; Resumo é único por conta e separado do estado do fluxo. Ambos são contexto subordinado às fontes oficiais, sem sincronização ou reconciliação retroativa obrigatórias.
- Resumo distingue síntese proposta, entendimento aceito, classificação confirmada, sugestões e ausência de identificação. Síntese não implica aceite. Só contexto pertinente ao negócio/orientação; compactação e correções preservam significado vigente sem converter sugestão em fato. Confirmação usa exatamente o entendimento exibido/persistido; texto integral no Diálogo.
- Interpretar mensagem inteira sem repetir contexto antecipado. Nome preferido, nome contextual do negócio e nome público oficial são distintos; efeitos oficiais exigem validação determinística e confirmação competente.
- IA usa projeção pertinente, limitada e sanitizada, Structured Outputs e transporte foreground sem memória autoritativa do provider. Catálogo/aliases somente leitura, sem pesquisa Web classificatória; resolvedor complementar mantém contrato próprio.
- Classificação só vira vínculo após confirmação inequívoca e validação determinística de categoria/hierarquia ativas, com deduplicação e proteção do primário. Sem correspondência segura, preservar entendimento operacional.
- Mensagem, estado, Resumo e efeito taxonômico são atômicos. Alteração externa impede sobrescrita/falso sucesso; descartar proposta obsoleta preserva contexto/histórico sem reavaliação ou reconfirmação automáticas.
- Sem escrita cruzada, relacionamento operacional ou dependência com a Base. Ela não consome Diálogo/Resumo; reaproveitamento legado aprovado preservado. Novo consumidor exige recorte próprio, sem engine/infra antecipadas.
- Comportamentos comerciais e requisitos de conclusão: `docs/roadmap.md` — E10.11–E10.12. Encerramento inconclusivo preserva pendência/contexto, não promove conta, não bloqueia retomada nem cria estado; sem contador/tempo fixo. Excesso ao contrato físico falha fechado, sem perda silenciosa para anunciar sucesso.
- Conclusão transacional/idempotente promove pending_setup → active sem entitlement; atendimento não governa mudanças posteriores. Formulário E10.4 não é fallback; account_profiles histórico e card de nicho somente no consumidor active existente.

3.15 Conteúdo composicional de `commercial_activation`
- `lib/conversion-content/commercial-activation/` governa registry, schema, resolver e renderer. Composição define módulo, variante, ordem e obrigatoriedade; artefato não duplica essas decisões.
- Validação estrita server-side: sem HTML bruto, scripts, CSS, Tailwind ou nomes livres de componentes. IDs desconhecidos/duplicados ou combinações não registradas falham fechado.
- Obrigatória inválida/ausente invalida artefato; opcional inválida só pode ser omitida com log seguro. CTAs usam destino seguro aprovado; contratos executáveis no código/package.json.

3.15.1 Geração administrativa de draft de `commercial_activation`
- Geração Admin server-side com requirePlatformAdmin, Responses API/Structured Outputs e configuração operacional canônica; fluxo linear, sem Agents SDK, job, fila, agente ou IA no runtime público.
- Fontes somente aprovadas pelo código/Schema; planos são fonte parcial, sem autorizar garantias, condições, descontos, promoções ou promessas.
- Validar envelope/seções contra composição/registry antes de persistir draft. Publicação separada; proveniência relacional/contextual conforme contrato.
- Compensar falha parcial após criação para não aparentar conclusão; sem prompt integral, pesquisa bruta, payload sensível ou resposta completa em logs.

3.15.2 Parametrização raiz de `landing_page`
- `lib/conversion-content/landing-page/` mantém contrato raiz; consumir somente API pública de `lib/conversion-content/index.ts`, sem registry/schema interno.
- Versão, preset ou parâmetro desconhecidos falham fechado, sem fallback; saída imutável. Evolução preserva raiz → módulo → variante; APIs removidas não são reutilizadas.

3.15.4 Catálogo de entradas de `landing_page`
- Deprecada em 01/10/2026: catálogo factual retirado, sem consumidor ativo. Destino: `docs/roadmap.md` — E22.7; `docs/schema.md` — 1.35.

3.15.7 Preparação factual do taxon para `landing_page`
- Deprecada em 01/10/2026: preparação/avaliação factual retiradas. Destino: `docs/roadmap.md` — E22.7; `docs/schema.md` — 1.35.

3.15.8 Liberação factual administrativa de taxon
- Deprecada em 01/10/2026: liberação por cobertura factual retirada. Ativação no CRUD independente segue 3.14.5; retirada na E22.7 do roadmap.

3.15.9 Estado residual do antigo produto de `landing_page`
- Produto LP legado sem consumidor de runtime, inclusive leitura, escrita, revisão, reprodução, entrega de assets ou compatibilidade de catálogo.
- Resíduos físicos inertes no `docs/schema.md`; limpeza destrutiva de banco/dados/Storage exige recorte próprio.

3.16 Configuração e observabilidade de workloads OpenAI
- `lib/openai-workloads/` resolve configuração somente pela API pública, sem variáveis legadas de modelo ou registry interno no consumidor. Produto é textual; catálogo de modelos de imagem permanece independente.
- Boundary comum não transporta chamadas nem contém secrets, prompts, schemas funcionais, fallback ou persistência de domínio.
- Registry code-owned mantém identidade, modalidade, apresentação, vocabulário e baseline Development. Ambiente explícito; proveniência repo_catalog com revisão versionada ou supabase_operational com revisão decimal positiva.
- Em Preview/Production, gate aceita somente true: desligado usa baseline; ligado lê ativa Supabase a cada execução, sem cache, seleção automática de revisão alternativa ou fallback local após erro.
- Catálogo global governa pares exatos modelo/parâmetro tipado disponíveis, sem elegíveis hardcoded por workload; lifecycle por ambiente/workload governa candidata, revisão pendente, ativações e histórico. Estado físico/apply no Schema.
- Novo ID exige confirmação ao vivo pela OpenAI; erro/divergência bloqueia cadastro. Não infere efforts nem substitui prova operacional; variantes de caixa não criam escolhas e grafias históricas permanecem.
- Elegibilidade corrente somente em criação/edição, prova e promoção de candidata. Save/promoção revalidam sob locks ordenados; prova revalida imediatamente antes do transporte sem lock externo. Ativação pendente validada e rollback não consultam catálogo.
- Ativas, históricas e snapshots revalidam workload, origem, revisão, modalidade, ID técnico e parâmetro tipado, sem exigir disponibilidade atual ou lista estática.
- Leitura corrente limitada à allowlist vigente; workload retirado permanece inerte, sem compatibilizador por ID legado.
- Admin usa projeção pública imutável; reautoriza platform_admin antes de leitura privilegiada e em cada mutação; ator derivado no servidor. Paginação completa/ordenada conforme 3.12, sem projeção utilizável após falha/parcialidade. Nomes/recortes vêm da matriz pública code-owned.
- Candidata, prova, pendente, ativação e rollback são explícitos. Prova usa fixture segura no transporte existente, sem persistir negócio; promove somente após sucesso. Ativa só muda por ação humana posterior.
- OPENAI_API_KEY server-only, restrita nessa gestão à validação explícita de identidade/prova autorizada. Nunca em client/form/read model/log. Falha, recusa ou metadado inseguro não promove nem descarta candidata.
- Cada tentativa registra só metadados técnicos seguros, resultado, categoria de falha, latência, IDs e usage disponíveis; ausentes null. Web Search admite contagens nullable, sem URLs/conteúdo. Sem prompt, resposta integral, negócio, PII, secrets ou cálculo monetário no evento comum.
- `lib/openai-costs/` governa finanças separado dos workloads, que só fornecem identidade, configuração e usage públicos; sem provider administrativo, persistência ou preço no boundary comum.
- Ledger ativo separado do histórico congelado openai_lp_*. Consumidor declara contexto econômico e usa API pública do recorder, sem Supabase, rows financeiras ou pricing.
- Captura financeira best-effort aguardada em orçamento curto; timeout/falha só emite evento sanitizado, sem alterar sucesso, falha ou fallback funcional.
- Execução, operação cobrável e retry têm IDs idempotentes distintos. Universo/conta/atribuição nunca por heurística; sem vínculo comprovável permanece não atribuído.
- Pricing code-owned, prospectivo e temporal: decimal exato, unidades confirmadas, snapshot imutável. Falta de regra/unidade torna toda operação indisponível; terminal nunca reprecificado. Categorias/unidades exatas no contrato de pricing.
- Read model ativo por keyset mantém execução sem operação, retry, não atribuído e indisponível; cursor inválido/repetido/regressivo impede agregado parcial.
- /admin/custos-openai é superfície única sob demanda para platform_admin; action reautoriza e lê em paralelo oficial, ativo e histórico do mesmo período. Sem polling, cache periódico, job ou automação.
- Reconciliação global = oficial - ativo calculável - histórico congelado. Filtros de universo/conta/workload só alteram projeção ativa; total oficial e reconciliação permanecem globais.
- DTO financeiro somente sanitizado do contrato público; sem prompt, resposta integral, negócio, URL de fonte, PII, secret ou detalhe financeiro interno indevido. Histórico pagina integralmente; diagnóstico expõe só HTTP/código/tipo sanitizados.
- Falha oficial indisponibiliza visão; falha interna preserva total oficial com indisponibilidade parcial explícita. Gasto oficial sem evento histórico permanece na reconciliação.

4. DB Contract
- Objetos/estado exatos: `docs/schema.md`; dependências e migrations seguem 3.8/3.4.4, sem inventário duplicado.
- SECURITY DEFINER exige aprovação explícita no Schema, motivo e limites; views de usuário usam security_invoker e registro no Schema.

5. Arquitetura de Acesso

5.1 Conceitos Fundamentais

5.1.1 Access Context
- access decide server-side com objetos no Schema e contratos/guards no código. Ausência difere de conta/membership bloqueados; falhar fechado quando não permitidos.
- UI/providers consomem contexto sanitizado sem autorizar ou elevar privilégios. Setup/gates usam estado canônico, nunca campos legados/deprecated.

5.1.2 Persistência SSR da última conta
- last_account_subdomain somente server-side: HttpOnly, SameSite=Lax e Secure em Production; duração no código.
- Middleware persiste em navegação real como best-effort; guard SSR faz a escrita autoritativa após allow. Conta inválida/bloqueada exige limpeza antes do fallback sem loop; cache segue 3.13.

5.2 Adapters, Guards e Consumidores
- Adapters acessam DB; guards SSR autorizam; client não reinterpreta decisão. Privilégio Admin centralizado nos guards existentes.
- Distinguir deny, bloqueio e erro, sem fallback permissivo; inventário no repositório.

5.3 Fluxos de Sessão e Auth

5.3.1 Login e redirecionamentos
- Login pode usar client SULB autorizado; autorização de conta permanece SSR.
- Retorno somente por path interno seguro; URL externa, protocolo ou prefixo // cai no destino padrão seguro. Copy/loading/erros exatos no código.

5.3.2 Signup, confirmação e recuperação
- Signup/reenvio usam clients/imports SULB autorizados e redirects internos aprovados; templates/e-mail em `docs/platform-config.md`.
- GET nunca consome token/código. Verificação, sessão e senha somente no POST; senha exige token/código validado e sessão correspondente.
- Recuperação neutra contra enumeração; limitação server-side no Supabase Auth, copy/cooldown no código. Sem e-mail, senha, token, código ou formulário sensível em logs.

5.3.3 Observabilidade
- Acesso, Auth e actions críticas emitem logs estruturados de resultado/motivo seguro, request_id e latência disponíveis; nomes/campos específicos no código.
- Sem PII, secrets, credenciais, tokens, códigos, payload bruto, prompts ou formulário. Falha de logging não bloqueia fluxo.
- Mutação seguida de redirect revalida rota quando houver risco de UI stale.

5.4 Gateway `/a` e seção privada
- /a/home é gateway público; seção privada exige conta resolvida/autorizada. Tentar última conta permitida e fallback determinístico, sem allow/deny próprio no gateway.
- Primeira conta só pelo fluxo server-side aprovado e sem qualquer membership; vínculo existente impede auto-criação adicional.
- Guard SSR governa allow/deny, bloqueios e redirects. Limpar cookie inválido antes de voltar ao gateway sem loop; ausência autenticada usa fallback informativo seguro. Status/destinos no código.

6. Estrutura de Arquivos Essencial

6.1 Repositório real
- Pastas, arquivos, exports e paths: repositório real. Antes de criar/mover, aplicar 3.3.2; sem árvore duplicada.

6.2 Paths normativos
- Path documental só quando normativo para boundary, fonte ou exceção. Atualizar quando mudar classificação, boundary, allowlist ou contrato.

6.3 Tipos e contratos críticos
- Usar API pública do boundary; tipos/exports específicos no código.
- AccountStatus, MemberStatus e MemberRole têm fonte única em lib/types/status.ts; não redefinir. Legado não autoriza novo path não canônico.

6.4 Arquivos SULB autorizados a importar Supabase (fonte única normativa)
Fonte normativa da allowlist SULB para exceções de Auth. Qualquer novo arquivo em app/auth/ não pode importar @supabase/* até ser incluído nesta lista.
- lib/supabase/client.ts
- lib/supabase/middleware.ts
- lib/supabase/server.ts
- lib/supabase/service.ts
- app/auth/confirm/route.ts
- app/auth/update-password/page.tsx
- app/auth/protected/page.tsx

7. Checklist mínima (anti-regressão)
- Residência/estrutura: repositório real e 3.3.2.
- Segurança/banco: 3.1, 3.4.4, 3.8, 4 e Schema.
- Boundaries/imports: 2.5, 3.2, 3.3, 3.14 e allowlist 6.4.
- Acesso/Auth: seção 5 e fontes operacionais aplicáveis.
- Domínios: API pública e validadores canônicos, sem duplicar lógica.
- Release: 3.4/AGENTS.md; executar ou justificar validações/Preview e respeitar autoridade de merge.

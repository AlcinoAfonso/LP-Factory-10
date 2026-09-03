0. Introdução

0.1 Cabeçalho
• Documento: Base Técnica LP Factory 10
• Versão: v2.0.87
• Data: 02/09/2026

0.2 Contrato do documento (consulta)
• Esta seção define o objetivo do documento e quando/como a IA deve consultá-lo.

0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
• O QUE É: a fonte única de regras técnicas de runtime e implementação segura do produto.
• POR QUE CONSULTAR: para evitar implementação errada, manter consistência técnica e reduzir risco em código, acesso, SSR, adapters, segurança e observabilidade.
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
• Seção do Core: recorte de produto: Account Dashboard, Admin Dashboard ou Partner Dashboard.
• Domínio transversal do Core: capacidade entre seções. `access` concentra acesso compartilhado entre as áreas do produto.
• Boundary: fronteira entre recortes reais, criada somente com responsabilidade e massa de código próprias.
• Path canônico: localização física obrigatória para artefatos novos.

3.3.2 Classificação, boundaries e paths
• Nova seção, domínio transversal ou path canônico exige definição prévia de classificação, boundary e path.
• Ordem: camada → seção ou domínio → boundary → path canônico → shared real ou falso shared.
• Não inventar paths: confirmar no repositório. Artefato novo nasce no path canônico; exceção existente não vira padrão.
• Componentes específicos de rota que dependem de Server Action, estado ou boundary da própria rota devem nascer como route-local em `app/.../_components`; não promover para `components/features` sem boundary compartilhada real.
• Partner Dashboard não ganha boundary antecipada; produto retirado não preserva seção ou boundary sem consumidor.

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

3.9 Rate limit administrativo
• Não reutilizar contratos legados de tokens ou limites removidos.
• Nova política de limite deve ser definida no boundary administrativo responsável, com escopo, chave, janela, resposta e observabilidade explicitamente contratados.
• Ausência de política aprovada não autoriza fallback permissivo nem limite inventado no client.

3.10 Anti-Patterns
• Importar Supabase na UI para dados de domínio (exceções de Auth/SULB seguem 2.5 e 6.4)
• Views sem security_invoker=true
• Hardcode de lógica de planos/limites
• Modificar SULB fora dos arquivos autorizados
• Manipular last_account_subdomain no client

3.11 Capacidades comerciais e grants
• Nunca usar `plan_id`, nome de plano ou metadado legado isoladamente para liberar capacidade.
• O boundary canônico de capacidades comerciais é `lib/commercial-capabilities/`; sua fonte é repo-only, o registry permanece interno e consumidores usam somente a API pública fail-closed.
• `lib/commercial-entitlements/` informa o plano efetivo; o boundary de capacidades informa o que esse plano permite; medição de uso e gate operacional permanecem no domínio consumidor.
• `get_feature(account_id, feature_key)`, a hierarquia `section → lp → account → plan → default` e snapshot por conta não estão materializados e não regem o contrato atual de capacidades comerciais.
• Grants, overrides ou snapshots futuros exigem recorte aprovado e substituição explícita da fonte canônica; não criar resolver paralelo.

3.12 PostgREST e Data API
• `search_path` deve permanecer fixado conforme o contrato de banco aplicável.
• Consultas com múltiplas relações devem usar aliases explícitos para evitar colisão de chaves.
• Busca textual exige índice justificado pela consulta ativa e pela necessidade de desempenho.
• Em paginação por range, HTTP 416 / PGRST103 representa fim da lista, não erro de sistema; preservar itens carregados e interromper novas requisições.
• Erros de domínio expostos pela Data API não devem usar códigos de falha transacional que possam acionar retry automático; conflitos funcionais devem preservar o contrato de domínio sem serem transportados como falha retryable do banco.

3.13 Compatibilidade do framework
• APIs assíncronas de SSR e Server Components, como `cookies()`, `headers()`, `params` e `searchParams`, devem ser aguardadas quando exigido pelo framework.
• Rotas que dependem de sessão ou cookies devem permanecer dinâmicas e sem cache entre usuários.
• Preferir recursos nativos e o bundler padrão do framework; evitar `webpack()` customizado quando `tsconfig.json` resolver o caso.
• Formulários e Server Actions devem usar APIs vigentes do framework; versões e contratos exatos pertencem às dependências e ao código.

3.14 Padrão de Adapters
• Novos casos de uso acessam o DB somente por adapters no boundary canônico.
• Adapters existentes fora dos paths canônicos podem permanecer por compatibilidade, sem expansão de escopo.
• Cada adapter deve permanecer coeso; dividir quando concentrar múltiplos casos de uso ou responsabilidades.
• Adapter retorna DTO final; UI não normaliza nem recebe DBRow.
• Mudança incompatível de shape exige contrato versionado e migração explícita, sem substituição silenciosa.
• Queries usam colunas explícitas e ordenação determinística.
• Enums não admitem fallback silencioso; paginação segue 3.12; gates devem distinguir deny de erro operacional.

3.14.1 Commercial entitlements
• Boundary canônico: `lib/commercial-entitlements/`; contratos públicos e adapter de leitura permanecem como fonte da API real.
• Leitura de elegibilidade é server-side e fail-closed para entrada inválida, ausência de linha, erro ou exceção.
• UI/client não consulta Supabase diretamente para determinar entitlement comercial.
• View, campos e estados persistidos pertencem a `docs/schema.md` e ao código; não duplicar seus inventários aqui.

3.14.2 Admin commercial entitlements
• Mutação administrativa é server-only, protegida por `requirePlatformAdmin()` e centralizada no boundary Admin existente.
• O fluxo manual pode conceder, atualizar ou cancelar entitlement, deve atualizar o registro ativo quando aplicável e falhar fechado diante de conflito ou duplicidade.
• Checkout, Stripe e webhook não podem servir como bypass da operação administrativa autorizada.
• Superfícies, funções, payloads e persistência exatos permanecem canônicos no código e em `docs/schema.md`.

3.14.3 Stripe webhook
• Endpoint e processamento permanecem server-side no boundary `lib/billing-checkout/`.
• Assinatura e tipo de evento devem ser validados antes de qualquer persistência.
• Processamento deve ser idempotente, tolerar retry seguro e liberar entitlement somente pelo evento aprovado no código.
• Eventos, secrets, tabelas e estados exatos pertencem ao endpoint real, a `docs/platform-config.md` e a `docs/schema.md`.
• Logs e metadata devem ser mínimos e não conter payload bruto, secrets, cartão ou PII sensível.

3.14.5 Resolução de nicho e taxonomia
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

3.15.4 Catálogo de entradas de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/input-catalog/`; registry, contracts, schema e resolver são fontes executáveis.
• O resolver é puro e repo-only, sem consultar Supabase, Stripe, assinatura, entitlement ou valores operacionais.
• As versões publicadas e a declaração explícita da versão atual permanecem repo-only; consumidores operacionais não podem inferir `latest`, maior chave ou outra versão por fallback.
• Persistência administrativa pode guardar somente o próximo draft sequencial, mutável e não operacional. Publicação exige materialização imutável no registry, validação, revisão, merge e deploy antes de a declaração repo-only da versão atual produzir efeito.
• Resolução segue `universal → segmento → nicho → ultranicho`; especializações só podem restringir e devem preservar identidade, tipo, origem, condições e evidência.
• Evolução forward-only pode retirar um field publicado somente a partir de nova versão; valores históricos dessa chave permanecem reconhecíveis e inertes, enquanto chaves nunca publicadas continuam inválidas.
• O draft deve preservar cada field já publicado e sua `createdInVersion`; remoção direta e proveniência retroativa são inválidas. Field novo nasce na versão alvo e retirada de field publicado usa exclusivamente `retiredInVersion` igual à nova versão.
• Referências condicionais devem existir e permanecer válidas após o filtro de plano; avaliação dos valores concretos pertence ao consumidor.
• A saída deve ser determinística, rastreável e profundamente imutável.

3.15.7 Preparação factual do taxon para `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/taxon-preparation/`; a derivação permanece pura e não persiste estado de prontidão.
• O adapter server-only deve ler pelo caminho único da pesquisa selecionada o taxon ativo, a pesquisa E20.5 integralmente válida e a última versão E20.2 efetivamente revisada; UI e componentes client não consultam esses marcadores diretamente.
• Avaliações administrativas históricas continuam recebendo uma versão executável explícita. Consumidores operacionais correntes recebem a versão atual explícita da API pública do catálogo; maior versão, `latest` e qualquer fallback implícito são proibidos.
• A versão efetiva corrente é a versão atual quando coincide com a revisada ou quando a comparação resolvida em todos os planos classifica a transição como sem mudança material ou evolução compatível. Mudança fora da allowlist conservadora exige nova revisão; ausência, incompatibilidade, feature gate ou falha operacional permanecem erros tipados e fail-closed.
• Carry-forward compatível não reescreve a versão revisada e não reinterpreta snapshots ou configurações históricas; cada residência preserva o número concretamente usado.
• O lifecycle administrativo lê integralmente `business_taxons` e ancora separadamente a identidade do conteúdo e o contexto E20 formado por identidade taxonômica, pesquisa selecionada e versão revisada; drift em qualquer fingerprint torna validação ou handoff stale.
• O catálogo continua classificando `no_material_change`, `compatible_evolution` e `review_required`. A publicação não depende de blocker global por operacionalidade, preparação ou evidência completa de todos os taxons.
• Evidência humana válida e revalidada para o conteúdo e o contexto atuais permite avançar `reviewed_input_catalog_version`; ausência, invalidade ou staleness preserva o marcador anterior e mantém o taxon fail-closed na preparação E20.6 quando a nova revisão for necessária.
• Após o deploy publicar o conteúdo repo-only exato, a reconciliação materializa somente os marcadores respaldados por evidência válida, confirma a leitura final e encerra o draft temporário sem transformar taxons ainda não revisados em bloqueio global.
• A avaliação semântica usa o workload OpenAI comum autorizado e permanece não autoritativa; a decisão final de suficiência e seu registro administrativo são humanos, e o boundary apenas aplica deterministicamente a decisão autenticada e revalidada.

3.15.9 Estado residual do antigo produto de `landing_page`
• O Account Dashboard não possui criação, onboarding operacional, workspace, configuração operacional, histórico, Preview, renderer, aprovação, readers de materialização ou assinatura de assets do produto legado.
• Tabelas, RPCs, migrations, ponteiro de aprovação, dados históricos e o bucket privado permanecem fisicamente preservados e inertes; nenhum runtime corrente os usa para leitura, escrita, reprodução, entrega de revisão ou compatibilidade do catálogo.
• O lifecycle administrativo E20 não lê contas, entitlement, `account_taxonomy`, LPs ou configurações antigas para determinar operacionalidade, compatibilidade ou bloqueio de publicação.
• Eventual limpeza destrutiva de banco, dados ou Storage exige recorte próprio; o contrato físico continua inventariado em `docs/schema.md`.

3.15.10 Resolução determinística de conhecimento de `landing_page`
• Boundary canônico: `lib/conversion-content/landing-page/knowledge-resolution/`; contratos, equivalência factual e resolver puro são fontes executáveis, exportadas pela API pública de `lib/conversion-content/`.
• A entrada `landing_page_offering_scope` preserva os modos `single | multiple | portfolio`; shape inválido falha fechado, enquanto ausência, ambiguidade ou sinal fraco de matching não recusa nem invalida a oferta.
• A API pública de `lib/onboarding/niche-resolution/` separa candidatos de falha operacional e concentra a classificação de `matchSource`. `specialized_deep` só pode ser autorizado quando a fonte contiver `alias_exact`, `alias_normalized`, `taxon_name_exact` ou `taxon_name_normalized`; resultado apoiado apenas em `fts`, `trgm` ou `taxon_slug_normalized` exige complemento dinâmico.
• Candidatos preservam `matchSource` e `matchedAliases`, são limitados a descendentes ativos do taxon servido e só selecionam pesquisa especializada quando houver unicidade, confiança canônica, preparação E20.5/E20.6 e equivalência factual conservadora.
• A equivalência resolve os quatro planos E20.2 para taxon servido e candidato; ignora somente identidade e proveniência taxonômicas que naturalmente diferem e trata mudança de field, finalidade, tipo, scope, obrigação, condição ou validação como material.
• A leitura integral de `business_taxons` pertence à operação server-only compartilhada em `lib/conversion-content/adapters/taxonChainAdapter.ts`, com páginas de 500, ordem por `id`, término canônico `416/PGRST103`, validação de todas as identidades e falhas tipadas. Preparação E20.5/E20.6, avaliação E20.6.5 e E20.7 reutilizam essa operação, sem paginações privadas paralelas.
• `multiple` requer um único complemento sobre o conjunto; `portfolio` permanece `base_only`. A saída imutável da fase determinística distingue `specialized_deep | base_only | dynamic_required`, sem IA, persistência própria, integração E19 ou mudança em geração, snapshot, materialização e renderer.
• `CURRENT=6` autoriza implementação repo-side e testes determinísticos; a reconciliação operacional para `reviewed_input_catalog_version=6` permanece gate somente antes de prova hospedada ou ativação.

3.15.11 Complemento dinâmico controlado de conhecimento de `landing_page`
• O boundary canônico permanece `lib/conversion-content/landing-page/knowledge-resolution/`; prompt, schema, parser, orçamento conservador e composição do resultado são fontes executáveis próprias, exportadas pela API pública de `lib/conversion-content/`.
• Somente uma saída determinística `dynamic_required` pode solicitar o complemento. O transporte server-side executa uma única Responses API foreground com apenas Web Search hospedado, `tool_choice = required`, uma ou duas chamadas concluídas, Structured Output estrito, `store = false`, sem conversation, background, retry ou fallback.
• Política de Web Search é code-owned e imutável por workload: tamanho de contexto, máximo de chamadas e teto efetivo de 128k tokens não vêm do Supabase. O orçamento integral reserva busca, reasoning e saída antes do transporte e falha sem truncar; modelo e reasoning effort continuam resolvidos pelos boundaries E21.1/E21.2.
• A decisão humana vigente fixa a configuração inicial de `landing_page_dynamic_market_research` em `gpt-5.6-luna + high`. Registry, bootstrap e transições `save`/`promote` aceitam somente esse par para o workload; `low`, `max` e a matriz comparativa anterior não são configurações operacionais autorizadas.
• Entrada funcional é conteúdo não confiável e nunca pode alterar instruções, schema ou limites. Toda finding material exige URL HTTPS presente nas fontes devolvidas pelo provider; chamada incompleta, fonte ausente, URL inventada ou evidência insuficiente falha tecnicamente.
• O resultado distingue materialidade comprovada de ausência de materialidade e carrega fontes, instante de busca, proveniência da configuração, versões de prompt/contrato, IDs técnicos, usage, latência e contagens de busca. Não contém copy, layout, wireframe, CTA, promessa comercial nem mutação da E20.2.
• Falha técnica ou ausência de evidência não recusa nem invalida a oferta. A conclusão funcional pode acrescentar complemento à base ou preservar somente a base; integração com geração, persistência e validação semântica de oferta permanece fora deste recorte.
• Development pode usar o baseline repo-only para testes determinísticos. Preview e Production falham fechado antes do provider enquanto não houver fonte `supabase_operational` ativa em revisão `2` ou posterior e reconciliação do taxon para `reviewed_input_catalog_version=6`.

3.16 Configuração e observabilidade de workloads OpenAI
• O boundary transversal canônico é `lib/openai-workloads/`; consumidores de produto usam somente sua API pública para resolver modelo e reasoning effort, sem ler variáveis de modelo nem acessar o registry interno.
• Os workloads correntes de produto são textuais. O catálogo global de modelos preserva suporte independente a modelos e parâmetros de texto e imagem sem transformar disponibilidade de modelo em workload de produto.
• O boundary comum não executa chamadas OpenAI e não contém secrets, prompts, schemas funcionais, regras de fallback ou persistência; transporte e comportamento funcional permanecem nos domínios consumidores.
• O registry mantém identidade, modalidade, apresentação code-owned, vocabulário tipado e baseline determinístico de Development; modelos elegíveis para novas candidatas não ficam hardcoded por workload. Resolvers recebem o ambiente explicitamente e retornam proveniência verificável: `repo_catalog` com revisão versionada ou `supabase_operational` com revisão decimal positiva.
• Em Production e Preview, o gate server-side temporário aceita somente o literal `true`: desligado, preserva o baseline do repositório; ligado, lê a revisão ativa no Supabase em cada execução, sem cache, seleção automática de outra revisão ou fallback para o repositório após erro.
• O catálogo global Supabase responde somente quais pares exatos `modelo + parâmetro tipado` podem ser escolhidos agora; o lifecycle separado por `ambiente + workload` responde qual revisão está ativa e preserva candidata, revisão pendente, ativações e histórico. Objetos físicos e estado de apply pertencem a `docs/schema.md`.
• Leituras administrativas de unidades, revisões e ativações delimitam o estado corrente pela allowlist de workloads vigente. Linhas físicas de workloads retirados permanecem históricas e inertes, sem compatibilizador por ID legado.
• Somente criação/edição, prova e promoção de nova candidata consultam elegibilidade vigente. Save e promoção revalidam sob locks ordenados; a prova revalida fail-closed imediatamente antes do transporte e não mantém lock durante a chamada externa. Ativação de pendente já validada e rollback histórico não consultam o catálogo.
• Revisões ativas, históricas e snapshots funcionais revalidam identidade do workload, origem, revisão, modalidade, identificador técnico do modelo e shape tipado do parâmetro, sem exigir disponibilidade atual nem presença do modelo em lista estática.
• Cada tentativa de provider deve emitir somente metadados operacionais normalizados e seguros, preservando métricas ausentes como `null`; prompts, respostas integrais, payloads de negócio, PII, secrets e cálculo monetário não entram no evento comum.
• Workloads textuais podem acrescentar telemetria segura e nullable de chamadas Web Search e quantidade de fontes; URLs e conteúdo das fontes permanecem fora do evento comum.
• Leitura administrativa de Costs, contratos financeiros e cálculo monetário pertencem ao boundary separado `lib/openai-costs/`; `lib/openai-workloads/` pode fornecer apenas identidade, configuração e usage públicos necessários, sem receber provider administrativo, persistência financeira ou regra de preço.
• O boundary `lib/openai-costs/` não possui write-side prospectivo, tracker, gate ou regra corrente de pricing de Landing Pages. Seu read-side preserva os eventos físicos existentes como série histórica congelada.
• `/admin/custos-openai` é a superfície financeira separada, exclusivamente sob demanda e protegida por `platform_admin`; consulta o total oficial e o histórico interno do mesmo período em paralelo e calcula `Outros gastos / reconciliação = total oficial - histórico de Landing Pages` com aritmética decimal exata, sem clamp ou redistribuição.
• O read model financeiro histórico pagina integralmente e expõe somente conta, Landing Page, workload, contagens, cobertura, instantes e totais sanitizados. Falha oficial indisponibiliza a visão; falha interna preserva o total oficial e explicita indisponibilidade parcial; gastos oficiais sem evento histórico permanecem apenas na reconciliação.
• Eventos financeiros históricos preservam somente status HTTP, código e tipo sanitizados para diagnóstico administrativo agregado; mensagem, payload bruto e detalhe financeiro interno não atravessam o boundary do cliente.
• A gestão administrativa consome somente projeção pública imutável e read model seguro; a página reautoriza `platform_admin` antes da leitura privilegiada, cada mutação reexecuta o guard e o ator é derivado exclusivamente no servidor.
• Leituras administrativas de catálogo, revisões e ativações paginam integralmente com ordem determinística; `416/PGRST103` terminal preserva páginas já acumuladas e qualquer erro ou resposta parcial produz estado tipado fail-closed.
• `/admin/workloads-openai` separa catálogo global, seletor Preview/Production e lifecycle expansível; nomes e recortes dos workloads vigentes vêm de uma única matriz pública code-owned.
• Candidata, prova, revisão validada pendente, ativação e rollback permanecem estados explícitos. A prova usa fixture segura nos transportes funcionais existentes, não persiste dados de negócio e somente promove a candidata após sucesso; a configuração ativa muda apenas por ação humana posterior.
• `OPENAI_API_KEY` permanece server-only e restrita à prova operacional autorizada; não atravessa client, formulário, read model ou log. Falha, recusa ou metadado inseguro encerram a prova sem promover nem descartar a candidata.

4. DB Contract
• `docs/schema.md` é a fonte única de tabelas, views, functions, RPCs, triggers, policies, constraints, grants e do estado exato do banco.
• Esta Base Técnica mantém somente guardrails transversais de implementação e não deve duplicar inventários de objetos.
• Alterações no banco exigem atualização do Schema e revisão das dependências no código.
• `SECURITY DEFINER` só é permitido quando estiver explicitamente aprovado no Schema, com motivo e limites.
• Views expostas a usuário devem usar `security_invoker = true` e estar registradas no Schema.

5. Arquitetura de Acesso

5.1 Conceitos Fundamentais

5.1.1 Access Context
• O boundary `access` concentra a decisão server-side de acesso; a view e os objetos exatos pertencem a `docs/schema.md`, e contratos, adapters e guards pertencem ao código real.
• Decisões de acesso devem falhar fechado e distinguir contexto inexistente de conta ou membership existentes, porém bloqueados.
• UI, providers e componentes client podem consumir contexto, mas não autorizam nem elevam privilégios.
• Conclusão de setup e gating devem usar o estado canônico da conta; campos legados ou deprecated não podem voltar a decidir acesso.

5.1.2 Persistência SSR da última conta
• `last_account_subdomain` é cookie exclusivamente server-side, `HttpOnly`, `SameSite=Lax`, com `Secure` em produção; duração e detalhes exatos permanecem canônicos no código.
• Middleware pode persistir a última conta em navegação real como best-effort; o guard SSR é a escrita autoritativa após decisão de acesso permitida.
• Conta inválida ou bloqueada exige limpeza do cookie antes do fallback seguro, evitando loops de redirecionamento.
• Rotas que dependem de sessão ou cookie devem permanecer dinâmicas e sem cache entre usuários.

5.2 Adapters, Guards e Consumidores
• Estado atual de adapters, guards, providers, APIs e superfícies deve ser consultado no repositório; esta Base não mantém inventário desses arquivos.
• Acesso ao banco ocorre por adapters server-side; guards SSR aplicam a autorização final e consumidores no client não reinterpretam decisões de acesso.
• Privilégios administrativos devem permanecer centralizados nos guards existentes, sem autorização paralela em páginas ou componentes.
• Deny, bloqueio e erro operacional devem permanecer distinguíveis, sem fallback permissivo.

5.3 Fluxos de Sessão e Auth

5.3.1 Login e redirecionamentos
• Login pode ocorrer pelo client SULB autorizado, mas a autorização da conta permanece responsabilidade do SSR.
• Parâmetros de retorno aceitam somente paths internos seguros; URLs externas, protocolos e paths iniciados por `//` devem cair no destino padrão seguro.
• Rotas, mensagens, estados de loading e tratamento exato de erros permanecem canônicos no código.

5.3.2 Signup, confirmação e recuperação
• Signup e reenvio devem usar somente os clients e imports autorizados pelo SULB, com redirects internos aprovados; templates, Redirect URLs e configuração de e-mail pertencem a `docs/platform-config.md`.
• Links de confirmação ou recuperação não podem consumir token no GET; verificação, criação de sessão e eventual atualização de senha ocorrem somente no POST.
• Recuperação de senha deve usar resposta neutra contra enumeração de usuários; mensagens, cooldowns e limites de UX exatos permanecem no código, e limitação server-side pertence ao Supabase Auth.
• Senha só pode ser atualizada após validação do token ou código e estabelecimento da sessão correspondente.
• E-mail, senha, token, código e valores sensíveis de formulário não podem ser registrados em logs.

5.3.3 Observabilidade
• Decisões críticas de acesso, Auth e Server Actions devem emitir logs estruturados com resultado, motivo seguro, `request_id` e latência quando disponíveis.
• Nomes de eventos e campos específicos permanecem canônicos no código; a Base mantém apenas o contrato mínimo de diagnóstico.
• Logs não devem conter PII, secrets, credenciais, tokens, códigos, payloads brutos, prompts ou valores de formulário.
• Falha de logging não pode bloquear o fluxo principal.
• Mutação seguida de redirect deve revalidar a rota afetada quando houver risco de UI stale.

5.4 Gateway `/a` e seção privada
• `/a/home` é o gateway público; a seção privada existe somente sob uma conta resolvida e autorizada.
• Usuário autenticado deve tentar a última conta permitida e depois um fallback determinístico de conta; o gateway não decide allow/deny por conta própria.
• Usuário sem qualquer membership pode criar a primeira conta somente pelo fluxo server-side aprovado; a existência de qualquer membership impede auto-criação adicional.
• O guard SSR da seção privada é responsável por allow/deny, bloqueios e redirecionamentos seguros; mapeamentos exatos de status e destinos pertencem ao código.
• Negação com cookie inválido deve limpar a última conta e voltar ao gateway sem loop; ausência de contexto autenticado deve usar fallback informativo seguro.

6. Estrutura de Arquivos Essencial

6.1 Repositório real
• O repositório real é a fonte única do estado atual de pastas, arquivos, exports e paths; esta Base não mantém árvore nem inventário.
• Antes de criar ou mover artefato, confirmar classificação, boundary e path no repositório conforme 3.3.2.

6.2 Paths normativos
• Esta Base registra path somente quando ele define boundary, fonte canônica ou exceção normativa.
• Mudança de path exige atualização documental apenas quando alterar classificação, boundary, allowlist ou contrato técnico.

6.3 Tipos e contratos críticos
• Contratos, exports e tipos específicos permanecem canônicos no código; consumidores devem usar a API pública do boundary.
• `lib/types/status.ts` é fonte única de `AccountStatus`, `MemberStatus` e `MemberRole`; não redefinir esses tipos.
• Compatibilidade legada não autoriza novos artefatos fora do path canônico.

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
• Residência e estrutura: confirmar o repositório real, 3.3.2 e as fontes documentais canônicas antes de alterar path ou contrato.
• Segurança e banco: validar 3.1, 3.4.4, 3.8, 4 e `docs/schema.md`.
• Boundaries e acesso a dados: validar 2.5, 3.2, 3.3, 3.14 e a allowlist 6.4.
• Acesso e Auth: validar a seção 5 e, quando aplicável, `docs/platform-config.md`, `docs/automations.md` e os READMEs operacionais.
• Contratos de domínio: consumir APIs públicas e validadores canônicos do código, sem duplicar lógica de registry, schema, provedor ou resolução.
• Release: seguir 3.4 e `AGENTS.md`, executar ou justificar validações aplicáveis, revisar preview quando necessário e manter merge humano.

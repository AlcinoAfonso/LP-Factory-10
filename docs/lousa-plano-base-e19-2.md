07/08/2026 — Plano-base E19.2 v2 — Onboarding e configuração mínima da conta para LP Starter

## 0. Identificação e fontes

### 0.1. Identificação

- Recorte: `E19.2`.
- Path: `docs/lousa-plano-base-e19-2.md`.
- Plano conceitual: N/A — debate humano e do Analista consolidado nas decisões abaixo e em `docs/lp-planejamento.md`.
- Natureza: plano-base v2.
- O plano-base v2 existente e os fechamentos pós-merge do PR #700 permanecem a base factual; o delta E19.2.7 abaixo é isolado e não reabre E19.2.3–E19.2.6.
- Automação do recorte: não.
- OpenAI na primeira entrega: não.
- Frontend próprio: sim, na superfície autenticada da conta.

### 0.2. Documentação usada

- `README.md` — visão do MVP, simplicidade sem fragilidade, planos progressivos e foco em produto utilizável.
- `docs/prompt-estrategista.md` — fluxo do Estrategista, requisitos do plano-base v1 e ordem posterior de atualização do roadmap.
- `docs/template-roadmap.md` — hierarquia `19.2.1`, `19.2.2` e fases implementáveis a partir de `19.2.3`.
- `docs/lp-planejamento.md` — jornada pós-entitlement, escopos dos valores, identidade visual, completude derivada e transição para E19.1.
- `docs/roadmap.md` — E19.1 concluída e estado vigente dos recortes relacionados.
- `docs/base-tecnica.md` — boundaries server-side, fail-closed e separação entre entitlement, capacidades e gate do consumidor.
- `docs/schema.md` — estado real de `accounts`, `account_profiles`, `account_landing_pages`, taxonomia e entitlement.
- `docs/design-system.md` — componentes base, estados, acessibilidade e consistência visual do Account Dashboard.
- `docs/prompt-abc.md` — fechamento documental e reconciliação do roadmap durante a execução.
- `docs/prompt-estrategista-light.md` — fluxo proporcional, PR único em draft, consulta obrigatória de Updates e critérios de escalada.
- `docs/lousa-plano-base-e9-7.md` — contrato de capacidades comerciais, E9.7.3 concluída e E9.7.4/E9.7.5 ainda planejadas.
- `docs/lousa-plano-base-e20-2.md` — contrato declarativo de entradas de `landing_page`.
- `docs/lousa-plano-base-e20-6.md` — autoridade explícita da versão E20.2 revisada para consumidores posteriores.
- `docs/lousa-plano-base-e19-5.md` no HEAD do PR #801 (`91b6d163270e8c77f40c233d40369b9a234dace8`) — handoff lazy, E19.2 como bootstrap/histórico e E19.5 como autoridade operacional posterior.

### 0.3. Implementação usada

- `lib/lp-builder/` e `app/lp-builder/actions.ts` — boundary produtivo da E19.1 e criação de LP real em `draft`.
- `app/a/[account]/page.tsx` — superfície atual pós-setup da conta e decisão da experiência comercial.
- `lib/conversion-content/landing-page/input-catalog/` — contrato E20.2 v2, escopos, obrigação, validação e `landingPageSubstitutionPolicy`.
- `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts` e `lib/conversion-content/landing-page/taxon-preparation/` — leitura server-side da versão E20.2 revisada e preparação por versão exata.
- `lib/lp-builder/generationContext.ts` — padrão existente de separar configuração histórica da versão E20.2 efetiva e revalidar sem reescrever o histórico.
- `lib/commercial-entitlements/` — resolução do entitlement e do `planKey` efetivo.
- `lib/commercial-capabilities/` — boundary canônico criado na E9.7.3, ainda sem capacidades Starter admitidas no registry runtime.
- Taxonomia da conta — resolver autoritativo do taxon primário ativo já usado na superfície da conta.
- PR #690 — refinamento concluído da E20.2.
- PR #694 — E9.7.3 concluída.

### 0.4. Decisões humanas que destravaram a v2

- Persistência pré-`draft`: usar agregado versionado por conta para a jornada da primeira LP, orientado pelo contrato E20.2, com valores associados a `fieldKey`, escopo e versão do catálogo. A completude permanece derivada e não existe `onboarding_status`.
- Forma física: materializar a menor persistência segura com isolamento tenant e RLS, sem normalizar preventivamente cada campo do catálogo.
- Logo: não implementar upload na primeira entrega. Reutilizar somente referência canônica já existente, quando houver; na ausência, seguir sem logo.
- Assets: não criar bucket, Storage, upload ou infraestrutura de assets neste recorte; preservar essa evolução para depois da primeira LP real.

## 1. Estado e decisões fixas

### 1.1. Objetivo do recorte

- Criar a experiência pós-entitlement que configura a conta e os valores mínimos necessários para iniciar a primeira LP Starter.
- A E19.2 não gera conteúdo, não revisa copy, não materializa a LP final e não publica.
- O foco é encurtar o caminho entre entitlement válido e a primeira LP real, sem criar contratos paralelos aos domínios já concluídos.

### 1.2. Atores e gates autoritativos

- Somente `owner` ou `admin` ativo pode alterar a configuração da conta neste recorte.
- A conta deve estar `active` e possuir entitlement comercial válido.
- O taxon primário ativo é contexto autoritativo; a E19.2 não escolhe, troca ou corrige taxon.
- Ausência, inatividade ou ambiguidade de taxon, conta, membership ou entitlement são bloqueios autoritativos e falham fechado.
- Não criar autorização paralela, readiness persistido ou qualquer reconstrução da E12.4.4.

### 1.3. Fonte dos campos e completude

- A E20.2 é a única fonte dos campos, escopos, tipos, obrigação, condições, validação e substituição por LP.
- A E19.2 não mantém lista própria de campos e não reinterpreta `allowedPlans` como entitlement ou capability.
- A completude é derivada dos campos obrigatórios e condicionais aplicáveis, seus valores válidos e os gates autoritativos vigentes.
- Campo opcional ausente não bloqueia a conclusão.
- Não criar `onboarding_status` em `accounts` nem outro estado persistido equivalente.
- O contrato de snapshot da E20.2 deve ser preservado para a futura geração/materialização; a E19.2 não materializa snapshot de geração.
- A configuração retomável usa um agregado versionado por conta. Enquanto E19.2 for a autoridade do onboarding/pré-handoff, `catalog_version` representa a versão vigente do agregado E19.2; após revalidação contra uma nova versão explicitamente autorizada e confirmação/persistência dos novos valores, ele pode evoluir, por exemplo, de `v2` para `v5`.
- A versão operacional pré-handoff é resolvida server-side pela autoridade explícita, nunca pelo client, `latest` ou maior chave do registry. Não se cria versão por field, coluna, tabela ou estado de migração; snapshots/revisões já materializados preservam a versão efetivamente usada na geração.
- Após handoff válido para E19.5, E19.2 permanece apenas bootstrap/histórico e não é fallback nem autoridade operacional concorrente; atualizações operacionais posteriores do catálogo pertencem à E19.5.
- A leitura efetiva combina fontes autoritativas existentes com o agregado da jornada. Valor autoritativo não é copiado apenas para atender o onboarding nem substituído silenciosamente pelo agregado.
- Field, escopo, versão ou valor desconhecido ou inválido falha fechado; o payload persistido não constitui catálogo paralelo.
- O save parcial valida integralmente apenas os valores presentes; ausência de campo obrigatório ou condicional aplicável é aceita durante o progresso e bloqueia somente a conclusão.
- Um resolver tipado percorre os fields do catálogo E20.2 resolvido e aplica precedência por `fieldKey`: fonte autoritativa existente, quando houver, prevalece; o agregado fornece somente valor legitimamente pertencente à jornada e ausente da fonte autoritativa. O resolver não duplica definição, escopo, obrigação, condição ou validação do catálogo.

### 1.4. Escopos e reutilização

- Preservar os escopos `account`, `business`, `offer`, `campaign` e `landing_page` da E20.2.
- Valores já existentes e válidos devem ser reutilizados; não pedir novamente o que o sistema já conhece.
- Valor autoritativo ou de outro domínio não se torna livremente editável apenas por aparecer no onboarding.
- Serviço/oferta e sua descrição factual são reutilizáveis conforme o contrato da E20.2 e não podem ser silenciosamente substituídos por uma LP.
- Logo oficial pertence ao negócio e não admite substituição silenciosa por LP.
- Paleta confirmada funciona como padrão reutilizável e admite substituição explícita por LP conforme a E20.2.
- Valores específicos de campanha ou LP permanecem separados dos dados reutilizáveis do negócio.

### 1.5. UX transversal

- O caminho até a primeira LP deve exigir somente decisões e informações realmente necessárias naquele momento.
- A jornada deve ser curta, guiada e apresentar progresso compreensível.
- Linguagem de cliente não expõe termos internos como E20.2, taxon, capability ou entitlement.
- Obrigatório, opcional, pendente e bloqueio autoritativo devem ser distinguíveis na experiência.
- Erro localizado não pode apagar outros valores válidos.
- Voltar entre etapas preserva valores válidos.
- Configuração parcial deve ser preservada para saída e retomada posterior.
- Desktop, mobile, teclado, foco visível e acessibilidade integram o critério de aceite.
- Depois do primeiro onboarding, valores reutilizáveis e alterações futuras devem ficar em área ou seletor `Configurações`, sem poluir o espaço operacional de LPs.

### 1.6. Identidade visual na primeira entrega

- Logo é opcional.
- Paleta confirmada é obrigatória.
- A primeira entrega não usa OpenAI nem automação para analisar taxon, oferta, logo ou gerar paleta personalizada.
- A experiência oferece caminho manual simples com opções pré-validadas, edição humana, validação determinística e confirmação.
- O contrato separa `proposta/opção disponível → edição → validação → confirmação`, preservando futura evolução da origem da proposta sem alterar o valor canônico.
- Contraste, legibilidade e demais limites de acessibilidade permanecem determinísticos.
- Não há captura, upload, substituição, remoção nem gestão de logo neste recorte.
- `brand_logo_asset` somente pode reutilizar uma referência opaca proveniente de fonte canônica já existente; URL livre, path inventado ou `asset_id` digitado pelo usuário são proibidos.
- Sem referência canônica existente, o logo permanece ausente e não bloqueia a conclusão.
- Bucket, Supabase Storage, Vercel Blob ou outra infraestrutura de assets permanecem fora do recorte e exigem evolução própria depois da primeira LP real.

### 1.7. Transição para LP `draft`

- Entitlement válido não cria LP automaticamente.
- Nenhuma nova LP `draft` deve ser criada antes da configuração mínima estar completa.
- Após a conclusão:
  - sem `draft` legítimo existente, permitir criação pelo fluxo E19.1;
  - com `draft` legítimo existente, permitir seleção/continuação;
  - com vários `drafts`, exigir seleção explícita e nunca escolher silenciosamente.
- Limite de quantidade de drafts ou publicações pertence às capacidades futuras da E9.7.4/E9.7.5 e não é inventado pela E19.2.

### 1.8. Capacidades, tracking e evolução de planos

- E9.7.3 definiu o boundary arquitetural de capacidades; E9.7.4 e E9.7.5 ainda não possuem contrato Starter runtime integrado à E19.
- A E19.2 não interpreta nomes de plano, não consulta `public.plans` como gate funcional e não cria resolver paralelo de capabilities.
- Progressive disclosure condicionado por capacidade só entra quando existir capacidade admitida e integração canônica disponível.
- Tracking por plano não é fechado neste recorte.
- Preservar apenas a fronteira conceitual entre configuração reutilizável da conta e associação/mensuração específica da LP, sem implementar tracking, Analytics ou Google Ads.
- Os dois P2 pós-merge da E9.7.3 — proteção `server-only` e correlação tipada entre definição e valor — são gates técnicos antes de consumo real do boundary por E19, não responsabilidade da E19.2.
- No ajuste Light, `prod#19` permanece como referência e trava: sinal de Stripe, nome de plano, assinatura ou feature externa não decide autorização da E19.2. Entitlement efetivo deve vir do boundary interno de `commercial-entitlements`; capacidade comercial, quando existir contrato admitido, deve vir separadamente da E9.7 e ser aplicada pelo consumidor server-side. O update não autoriza adotar Stripe Entitlements nem migrar o modelo interno.

### 1.9. Automação e IA

- Automação: não.
- OpenAI: não nesta entrega.
- Serviço/oferta usa preenchimento humano orientado.
- Taxon chega previamente resolvido e autoritativo.
- Identidade visual usa caminho manual/determinístico simples sem análise automática personalizada.
- Evoluções futuras de `pending_setup`, assistência de oferta ou identidade visual por IA só devem ser reavaliadas depois da primeira LP real gerada e validada pelo fluxo oficial.

## 2. Contrato do caso

### 2.1. Resultado esperado

- Conta ativa com entitlement válido deixa de permanecer apenas na experiência comercial e entra no onboarding quando a configuração aplicável estiver incompleta.
- O onboarding reutiliza dados existentes, coleta somente valores ausentes ou legitimamente editáveis, preserva progresso parcial e deriva completude sem status paralelo.
- Ao concluir, a conta entra no espaço operacional e pode criar ou selecionar uma LP `draft` real pelo fluxo E19.1.
- O fluxo funciona integralmente sem IA e sem depender de capacidades Starter ainda não admitidas na E9.7.4.

### 2.2. Estados derivados da experiência

- Sem entitlement válido: experiência comercial e contratação, quando aplicável.
- Com entitlement válido e configuração incompleta: onboarding E19.2.
- Com entitlement válido e configuração completa: espaço operacional para criar ou continuar LPs.
- Estado derivado não é persistido em `accounts`.

### 2.3. Etapas macro da experiência

- Boas-vindas e contexto.
- Dados reutilizáveis do negócio.
- Serviço/oferta e descrição factual.
- Campos aplicáveis de `campaign` e `landing_page` para a primeira LP.
- Identidade visual com logo opcional e paleta confirmada.
- Revisão de valores, pendências recuperáveis e bloqueios autoritativos.
- Conclusão e transição para criação ou seleção de `draft`.

### 2.4. Fluxo operacional

#### 2.4.1. Gatilho

- Conta `active`.
- Usuário autenticado com membership `owner` ou `admin` ativo.
- Entitlement comercial válido.
- Taxon primário ativo, único e autoritativo.
- Configuração aplicável ainda incompleta.

#### 2.4.2. Entrada

- Conta e valores existentes.
- Membership e papel do ator.
- Entitlement efetivo e `planKey`.
- Taxon primário autoritativo.
- Durante o pré-handoff, versão operacional E20.2 explicitamente autorizada para a cadeia de taxon e plano aplicáveis, derivada da autoridade canônica do taxon; após handoff válido, E19.5 assume a configuração operacional e a versão histórica permanece apenas como bootstrap/auditoria.
- Valores já persistidos por escopo.
- Configuração parcial anteriormente preservada, quando existir.
- Logo opcional e paleta previamente confirmada, quando existirem.

#### 2.4.3. Processamento

- A E19.2 deve resolver os fields aplicáveis a partir da E20.2, sem lista paralela, somente enquanto autoridade do onboarding/pré-handoff; após handoff válido, a resolução operacional pertence à E19.5.
- Reutilizar valores existentes e identificar somente os ausentes ou legitimamente editáveis.
- Organizar os valores por contexto compreensível para o cliente, sem expor a modelagem interna dos scopes.
- Separar valores reutilizáveis do negócio de valores específicos de oferta, campanha e LP.
- Preservar configuração parcial e permitir retomada.
- Oferecer caminho manual de identidade visual e validar a paleta deterministically.
- Derivar completude a partir dos contratos aplicáveis e dos valores válidos.
- Não criar `draft` durante o preenchimento.

#### 2.4.4. Validação

- Conta, membership, entitlement e taxon permanecem gates autoritativos fail-closed.
- Campos e valores respeitam obrigação, condições, tipo, validação, escopo e `landingPageSubstitutionPolicy` da E20.2.
- Campo obrigatório ou condicional aplicável ausente é pendência recuperável.
- Valor inválido gera erro localizado sem apagar valores válidos.
- Logo ausente não bloqueia completude.
- Paleta ausente ou inválida bloqueia a conclusão enquanto não houver confirmação válida.
- Contraste, legibilidade, teclado, foco e critérios de acessibilidade aplicáveis devem ser verificáveis.

#### 2.4.5. Persistência

- Preservar valores reutilizáveis, valores de oferta, valores específicos da primeira LP/campanha, referência de logo quando houver, paleta confirmada e progresso parcial.
- A persistência deve permitir sair e retomar o onboarding sem perda de valores válidos.
- `docs/schema.md` documenta `account_profiles` apenas para niche, canal preferido, WhatsApp e site e `account_landing_pages` apenas para a identidade mínima da LP; não há contrato documentado que autorize reutilizar qualquer uma dessas estruturas como armazenamento genérico dos valores E20.2.
- Criar `public.account_landing_page_onboarding_configurations` como agregado interno 1:1 por conta para a jornada da primeira LP Starter, usando `account_id uuid primary key` como FK para `public.accounts(id)` com `ON UPDATE CASCADE` e `ON DELETE CASCADE`.
- O agregado deve conter `landing_page_id uuid null`, `catalog_version integer not null` com valor positivo, `values jsonb not null default '{}'::jsonb`, `revision bigint not null default 1` com valor positivo, `created_by uuid not null`, `updated_by uuid not null`, `created_at timestamptz not null default now()` e `updated_at timestamptz not null default now()`.
- `created_by` e `updated_by` referenciam `auth.users(id)` com `ON UPDATE CASCADE` e `ON DELETE RESTRICT`. `updated_at` usa o trigger canônico `public.tg_set_updated_at()`; o agregado não participa do Trigger Hub.
- `landing_page_id` permanece nulo durante o preenchimento. A migration adiciona unicidade em `public.account_landing_pages(id, account_id)` e FK composta `(landing_page_id, account_id)` para esse par, com `ON UPDATE CASCADE` e `ON DELETE RESTRICT`, impedindo associação cruzada entre contas.
- A mesma migration deve criar proteção write-once no banco para `landing_page_id`. Um trigger `BEFORE UPDATE`, implementado por função table-specific `SECURITY INVOKER` com `search_path` fixado, deve rejeitar qualquer transição em que `OLD.landing_page_id` já seja não nulo e `NEW.landing_page_id` seja distinto, inclusive retorno a `NULL`. Somente a transição `NULL → draft` válido da mesma conta é permitida. A função não integra API pública e deve permanecer sem `EXECUTE` concedido a `public`, `anon` ou `authenticated`.
- `values` deve ser objeto JSON estrito indexado por `fieldKey`; cada entrada continua contendo somente `scope` e `value`. O boundary valida os valores históricos contra o catálogo da `catalog_version` persistida e projeta/revalida a configuração contra o catálogo operacional autorizado antes de qualquer gravação ou conclusão.
- Valores provenientes de fonte autoritativa existente são combinados na leitura e não duplicados no agregado somente para atender o onboarding.
- Não criar coluna de status, flag de completude, snapshot de geração nem linha em `account_landing_pages` para representar a jornada.
- A tabela nasce em migration incremental versionada e forward-only, com `values` restrito por CHECK a objeto JSON, versão/revisão positivas, FKs explícitas, unicidade 1:1, `updated_at` automático e RLS habilitado.
- A tabela reside em `public` e fica exposta ao PostgREST/Data API exclusivamente para o adapter server-side autenticado com `service_role`. Revogar acesso de `public`, `anon`, `authenticated` e `ai_readonly`; conceder somente `SELECT`, `INSERT` e `UPDATE` a `service_role`; `DELETE` permanece revogado, pois não existe lifecycle de exclusão ou reset do agregado nesta entrega. A exclusão decorrente da remoção da conta permanece responsabilidade da FK `ON DELETE CASCADE`. Não criar policy de cliente nem view.
- RLS permanece habilitado como defesa adicional, mas não é tratado como isolamento para `service_role`, que o ignora. Grants e RLS/policies são controles independentes.
- Acesso ocorre somente por adapter de `lib/lp-builder/`, depois dos gates de usuário, conta, membership, entitlement e taxon. O adapter deriva `account_id` e ator no servidor e escopa toda leitura e mutação por essa conta; UI, provider e Server Action não recebem `account_id` autoritativo do client nem acessam a tabela diretamente.
- Toda mutação 1:1 do agregado deve aplicar `.maxAffected(1)`. Save e bind filtram pelo `account_id` derivado no servidor e pela `revision` esperada; o bind também exige `landing_page_id IS NULL`. A mutação bem-sucedida grava `revision = expectedRevision + 1` e exige exatamente uma linha afetada. Zero linhas deve ser classificado por leitura segura posterior como ausência, conflito de revisão ou vínculo já existente; nenhum desses estados pode virar sucesso, ausência genérica ou rebind. Inserção concorrente que colida com a PK 1:1 deve retornar conflito explícito, sem upsert que contorne a revisão.
- Antes de a migration existir e uma leitura tipada do agregado ser bem-sucedida, a superfície preserva a experiência comercial vigente e não ativa o novo onboarding. Depois do apply, o snippet read-only e a leitura do adapter comprovam disponibilidade; então a resolução derivada passa a habilitar a jornada sem PR precursor.
- A migration deve definir todos os objetos, constraints, RLS e GRANTs no mesmo recorte; `docs/schema.md` deve registrar o estado final e o snippet read-only deve verificar o apply sem mutação remota pré-merge.
- Não usar a criação prematura de uma LP `draft` como mecanismo de persistência do onboarding.

#### 2.4.6. Consumo

- Retomada do próprio onboarding.
- Área posterior `Configurações` para valores reutilizáveis.
- Criação ou seleção da LP `draft` pela E19.1 após completude.
- Depois de criação ou escolha humana explícita, vincular o agregado ao `draft` pela FK composta. O vínculo é write-once nesta entrega e valores `campaign`/`landing_page` não podem ser consumidos por outro draft.
- Futura geração/materialização consumirá os valores confirmados e aplicará o contrato de snapshot vigente naquele recorte.
- Futuros consumidores habilitados por capacidades resolvidas pela E9.7 podem reutilizar os valores quando houver contrato aprovado, sem a E9 consumir valores do onboarding.

#### 2.4.7. Fallback

- Dado obrigatório ausente: solicitar preenchimento e manter demais valores.
- Dado opcional ausente: permitir continuidade.
- Dado condicional aplicável ausente: bloquear somente a conclusão aplicável.
- Valor inválido: erro localizado e preservação dos demais valores.
- Logo ausente: continuar normalmente.
- Paleta não confirmada: oferecer escolha/edição manual até existir valor válido.
- Interrupção da sessão ou saída da jornada: preservar progresso e permitir retomada.
- Taxon, entitlement, conta ou membership inválidos: falhar fechado e não oferecer correção como campo comum do onboarding.
- Capacidade comercial ausente ou ainda não admitida: não inventar permissão nem impedir o onboarding base quando a capacidade não fizer parte do contrato vigente.
- OpenAI indisponível: N/A, pois a entrega não depende de IA.

### 2.5. Frontend e evidência esperada

- Reutilizar os componentes e tokens vigentes de `docs/design-system.md`; não criar framework paralelo de formulário.
- Jornada deve funcionar em desktop e mobile.
- Navegação por teclado e foco visível devem permanecer utilizáveis.
- Campos devem exibir label, hint e erro de forma acessível quando aplicável.
- Progresso da jornada deve ser compreensível sem exigir conhecimento técnico.
- Valores previamente válidos devem permanecer após erro, navegação para trás, saída e retorno.
- A experiência deve evidenciar claramente a transição de “configurando” para “pronto para trabalhar na LP”.
- Referência opcional `vercel#15`: a Vercel Toolbar pode ser usada no Preview autorizado como apoio para comentários, auditoria de acessibilidade, interaction timing e layout shift quando estiver disponível. Seu uso é opcional, não cria dependência do produto e não substitui validação manual, evidência dos estados do caso nem os checks do repositório.
- Aplicação recorrente `prod#16`: cada PR que alterar a jornada E19.2 deve ser validado no Preview autorizado, em desktop e mobile, cobrindo ao menos: conta sem entitlement, owner/admin elegível incompleto, retomada de progresso parcial, erro localizado com preservação dos demais valores, bloqueio autoritativo fail-closed, conclusão sem criação prematura de draft e seleção explícita entre múltiplos drafts. A validação deve incluir teclado e inspeção de erros visíveis de runtime.
- Trava `prod#17`: usar WCAG 2.2 como baseline proporcional da jornada, verificando por inspeção manual e apoio automatizado: operação somente por teclado, ordem e visibilidade de foco, foco após transição ou erro, associação programática entre label, hint, controle e erro, anúncio de feedback dinâmico, contraste aplicável, alvos de toque e ausência de ação disponível apenas por hover. Ferramenta automática isolada não comprova conformidade, e o recorte não pode declarar conformidade WCAG 2.2 integral sem auditoria própria.
- Evidências humanas futuras devem cobrir pelo menos:
  - conta sem entitlement permanece na experiência comercial;
  - conta elegível e incompleta entra no onboarding;
  - valores existentes são reutilizados;
  - taxon aparece como contexto, não como escolha livre;
  - logo pode ser omitido;
  - paleta pode ser escolhida/editada/validada;
  - progresso parcial sobrevive à saída e retorno;
  - erro localizado não apaga outros valores;
  - configuração incompleta não cria nova LP;
  - configuração completa libera criação/seleção de `draft`;
  - múltiplos drafts exigem seleção explícita;
  - desktop, mobile e teclado permanecem funcionais;
  - bloqueios autoritativos falham fechado.

## 3. Fases e próxima ação

### 3.1. E19.2.3 — Contrato de configuração, completude e persistência mínima

- Status: concluída.
- Automação: não.
- Objetivo:
  - materializar no boundary E19 a resolução da configuração mínima, a completude derivada e a persistência retomável dos valores sem criar LP prematuramente.
- Entrega:
  - estender o boundary existente de `lib/lp-builder/`, sem domínio paralelo de LP;
  - consumir o catálogo E20.2 por versão explícita e cadeia autoritativa de taxon;
  - definir contratos tipados para leitura, gravação e completude por escopo, sem duplicar definições da E20.2;
  - reutilizar valores existentes quando válidos;
  - materializar o agregado 1:1 `public.account_landing_page_onboarding_configurations` definido nesta v2, sem normalização preventiva por campo;
  - preservar progresso parcial e retomada;
  - manter conta, membership, entitlement e taxon como gates server-side fail-closed;
  - não criar `onboarding_status`, snapshot de geração ou LP `draft` nesta fase.
- Critérios de aceite:
  - completude é derivada exclusivamente do contrato aplicável e dos gates autoritativos;
  - obrigatório/condicional aplicável ausente bloqueia conclusão; opcional ausente não bloqueia;
  - configuração parcial válida pode ser lida novamente sem perda;
  - nenhuma lista paralela de campos, hardcode de plano ou resolver paralelo é introduzido;
  - a migration cria somente `public.account_landing_page_onboarding_configurations` e seus controles indispensáveis, sem bucket, Storage, view ou objeto paralelo;
  - o agregado persiste somente valores válidos associados a `fieldKey`, escopo e versão do catálogo, preserva revisão otimista e não materializa completude;
  - se a forma física aprovada introduzir ou alterar tabela, coluna, constraint, índice, RLS, policy ou grant, o mesmo PR deve incluir snippet SQL read-only versionado em `supabase/snippets/` que verifique existência e shape dos objetos, isolamento por tenant, RLS habilitado, grants mínimos, policies esperadas e ausência de uso de `account_landing_pages` como persistência prematura do onboarding. O snippet não substitui testes comportamentais em ambiente local ou descartável e não pode realizar mutação remota;
  - testes cobrem save parcial sem obrigatórios, conclusão incompleta, precedência autoritativa, duas contas distintas, ator inválido, ausência legítima, objeto indisponível e erro operacional, além dos casos positivos e fail-closed aplicáveis;
  - testes SQL comprovam `NULL → draft` válido da mesma conta, rejeição de rebind, rejeição de retorno a `NULL`, rejeição de vínculo cruzado e atualização de outros campos sem alteração do vínculo;
  - casos de concorrência cobrem duas criações simultâneas para a PK 1:1, update com revisão válida e stale, classificação segura do resultado zero e prova de que nenhuma mutação atinge mais de uma linha.

### 3.2. E19.2.4 — Jornada guiada pós-entitlement e retomada

- Status: concluída.
- Automação: não.
- Objetivo:
  - substituir a permanência na experiência comercial por uma jornada curta de onboarding quando a conta elegível estiver incompleta.
- Entrega:
  - ajustar a superfície autenticada da conta para os três estados derivados: comercial, onboarding e operacional;
  - apresentar boas-vindas, dados reutilizáveis, serviço/oferta e campos aplicáveis da primeira LP sem expor termos internos;
  - reaproveitar valores existentes e solicitar somente ausentes ou legitimamente editáveis;
  - permitir avançar, voltar, sair e retomar sem perda dos valores válidos;
  - exibir obrigatório, opcional, pendência recuperável e bloqueio autoritativo de forma compreensível;
  - preservar UX responsiva, teclado, foco e componentes do design system;
  - manter E9.7.4/E9.7.5, tracking e IA fora desta fase.
  - a UI específica da jornada deve residir em `app/a/[account]/_components/`, com composição na superfície autenticada `app/a/[account]/`. Guards de acesso permanecem no boundary `access` e no guard SSR existente. Contratos, completude, leitura e persistência de domínio permanecem em `lib/lp-builder/`, com DB somente por adapters server-side. Server Actions da jornada apenas validam entrada, invocam a API pública do boundary, revalidam a rota e traduzem o resultado para a UI. `AccessProvider` não deve receber lógica de completude, valores E20.2 nem acesso a banco; novo provider só é permitido se houver estado client compartilhado real e não autoritativo.
- Critérios de aceite:
  - conta sem entitlement não entra no onboarding;
  - owner/admin elegível com configuração incompleta entra na jornada;
  - valores existentes aparecem reaproveitados;
  - taxon é contexto read-only;
  - erro localizado não apaga os demais valores;
  - saída e retorno retomam a configuração parcial;
  - desktop, mobile e teclado são validados com evidência proporcional.
  - Aplicação `prod#14`: em teste humano guiado, owner ou admin elegível deve reconhecer, sem explicação de vocabulário interno, o próximo passo, quais valores são obrigatórios ou opcionais, quais pendências são recuperáveis e quais bloqueios são autoritativos. Não transformar tempo de clique, descoberta ou conclusão em métrica obrigatória sem hipótese e plano de medição próprios.

### 3.3. E19.2.5 — Identidade visual mínima da conta

- Status: concluída.
- Automação: não.
- Objetivo:
  - permitir confirmar a identidade visual mínima necessária ao Starter sem IA e sem tornar logo obrigatório.
- Entrega:
  - suportar `brand_logo_asset` como valor opcional conforme a E20.2, sem inventar URL livre como contrato do asset;
  - reutilizar `brand_logo_asset` somente quando uma fonte canônica existente fornecer a referência opaca válida; não oferecer campo livre, upload, remoção ou substituição de logo;
  - apresentar opções simples de paleta, permitir edição humana e validar o contrato de cinco papéis da E20.2;
  - validar contraste e legibilidade de forma determinística;
  - persistir somente a paleta confirmada como valor canônico reutilizável;
  - preservar `landingPageSubstitutionPolicy`, permitindo override explícito de paleta por LP em evolução própria, sem implementar esse override nesta fase quando não houver consumidor real.
- Critérios de aceite:
  - ausência de logo não bloqueia o onboarding;
  - paleta válida e confirmada é necessária para completude;
  - combinação inválida não pode ser confirmada;
  - nenhuma chamada OpenAI, extração automática de cores ou geração personalizada de paleta é introduzida;
  - nenhum bucket, Storage, Blob, URL de asset ou infraestrutura de upload é criado;
  - experiência permanece compreensível sem exigir conhecimento técnico de cinco cores.

### 3.4. E19.2.6 — Revisão, conclusão e transição para LP `draft`

- Status: concluída.
- Automação: não.
- Objetivo:
  - concluir a configuração derivada e transferir a conta para o espaço operacional sem criar LP antes da hora.
- Entrega:
  - apresentar revisão dos valores confirmados e pendências recuperáveis;
  - bloquear conclusão diante de gate autoritativo inválido;
  - confirmar completude sem persistir novo status de onboarding;
  - consultar LPs `draft` legítimas da conta usando o boundary E19 e as permissões existentes;
  - sem draft existente, permitir criação pelo fluxo E19.1;
  - com draft existente, permitir seleção/continuação;
  - com vários drafts, exigir escolha explícita;
  - após criar ou selecionar explicitamente um draft da mesma conta, vincular o agregado a ele sem copiar valores para `account_landing_pages` e sem permitir rebind silencioso;
  - manter limites de quantidade fora da E19.2 até capacidade correspondente ser admitida e integrada pela E9.7;
  - direcionar a conta ao espaço operacional após a escolha/criação, sem geração de conteúdo neste recorte.
  - estender a API pública de `lib/lp-builder/` com operação server-only de leitura dos drafts legítimos da conta, implementada por adapter com colunas explícitas e ordenação determinística. O resultado deve distinguir `nenhum draft`, `um ou mais drafts` e `falha operacional`; UI, página e Server Action não consultam `account_landing_pages` diretamente. A autorização deve reutilizar os gates canônicos e não ser inferida da simples presença de linhas.
- Critérios de aceite:
  - configuração incompleta não cria LP nova;
  - configuração completa libera a transição;
  - draft existente pode ser selecionado sem duplicação automática;
  - múltiplos drafts nunca são escolhidos silenciosamente;
  - valores `campaign` e `landing_page` ficam vinculados somente ao draft explicitamente escolhido e não são reutilizados por outro draft;
  - criação continua usando os gates server-side da E19.1;
  - casos executáveis cobrem zero, um e vários drafts, conta divergente, membership inválido e erro de leitura; erro operacional não é convertido em lista vazia;
  - casos de bind cobrem vínculo único bem-sucedido, revisão stale, resultado zero classificado com segurança, tentativa de rebind e garantia de `.maxAffected(1)`;
  - nenhuma geração, revisão de copy, publicação ou tracking é iniciada.

### 3.5. Fechamento das fases concluídas

- E19.2.3, E19.2.4, E19.2.5 e E19.2.6 permanecem concluídas e reconciliadas após o PR #700, sem reabrir seus contratos ou status.
- O único delta planejado neste documento é a E19.2.7 abaixo; ela não autoriza runtime, migration, SQL ou merge e não altera o estado concluído registrado no roadmap.

### 3.6. E19.2.7 — Evolução do catálogo operacional e handoff para E19.5

- Processo: Estrategista Light.
- Status: plano-base Light candidato; implementação ainda não autorizada; PR #802 permanece em draft e sem merge.
- Identificador: `19.2.7` é o próximo identificador livre confirmado no `docs/roadmap.md`; E19.2.3–E19.2.6 permanecem fases concluídas.
- Objetivo:
  - permitir que a conta elegível opere contra a versão E20.2 autorizada enquanto E19.2 ainda for a autoridade do onboarding/pré-handoff, preservando valores válidos e preparando um handoff único para E19.5.

- Fronteira E19.2 × E19.5 e os dois handoffs:
  - E19.2 resolve e revalida a configuração mínima somente durante o onboarding/pré-handoff, usando a autoridade E20.2 explicitamente autorizada para o taxon;
  - o **handoff de autoridade da E19.2** ocorre quando a primeira jornada está completa, a conta escolhe/cria o `draft` conforme E19.2.6 e o agregado é vinculado sem rebind; a partir desse momento E19.2 deixa de ser autoridade operacional e permanece somente bootstrap/histórico;
  - esse handoff de autoridade não materializa imediatamente a configuração física da E19.5 nem cria suas residências operacionais;
  - a **materialização operacional da E19.5** ocorre posteriormente e de forma lazy, somente quando o workspace realmente precisar criar as residências operacionais previstas pela E19.5; não há precreate ou backfill pela E19.2;
  - após o handoff de autoridade, E19.2 não pode servir fallback, completar silenciosamente a configuração ou concorrer como autoridade operacional; revalidações e atualizações posteriores do catálogo pertencem à E19.5;
  - nenhuma atualização de E19.5 deve reabrir o onboarding ou reescrever a história de snapshots/revisões já materializados.

- Autoridade operacional pré-handoff:
  - reutilizar `business_taxons.reviewed_input_catalog_version`, lido pelo adapter server-only `loadTaxonPreparationForReviewedVersion({ taxonId })` e pelo boundary de preparação da E20.6;
  - aceitar somente versão positiva, executável no registry E20.2 e explicitamente revisada para o taxon; `null`, versão não executável, cadeia/pesquisa incompatível ou falha operacional bloqueiam fechado;
  - não usar `latest`, maior versão, slug, chave do registry, fallback para `2` ou valor enviado no formulário;
  - tratar a E20.2 v5 em andamento como dependência factual: E19.2 não cria nem promove v5; somente consome v5 quando o registry/contrato E20.2 a tornar executável e a autoridade do taxon registrar a revisão correspondente.

- Semântica mínima de `catalog_version` e persistência:
  - enquanto E19.2 for autoridade pré-handoff, `account_landing_page_onboarding_configurations.catalog_version` representa a versão vigente do agregado E19.2;
  - após revalidação contra nova versão autorizada e confirmação/persistência dos novos valores, o agregado pode evoluir de `v2` para `v5` (ou equivalente), sem criar versão por field, nova coluna, tabela ou estado de migração;
  - valores continuam no JSON existente (`fieldKey → { scope, value }`), associado ao agregado corrente; não criar metadado de versão por valor;
  - snapshots/revisões já materializados preservam a versão E20.2 efetivamente usada na geração, mesmo que o agregado pré-handoff evolua depois;
  - após handoff, E19.5 assume a configuração operacional; E19.2 não altera mais `catalog_version` nem usa a versão histórica como fallback operacional;
  - `supa#40`: este ajuste não cria nem altera migration ou snippet. O verificador read-only já versionado pode ser reexecutado somente para reconfirmar o contrato persistido quando a implementação tocar suas suposições de leitura; qualquer necessidade de tabela, coluna, constraint, RLS, policy, grant ou estado persistido novo aciona o critério de parada antes da implementação;
  - oportunidade futura condicional `supa#63`, fora deste PR: só considerar matriz de regressão RLS em banco descartável se migration posterior alterar várias policies tenant-sensitive ou regressões repetidas excederem testes SQL focais; não instalar ferramenta, executar em produção, criar workflow ou ampliar este Light.

- Revalidação e preservação:
  - reutilizar o padrão já existente em `lib/lp-builder/generationContext.ts`, separando a configuração corrente do agregado da versão E20.2 efetiva usada no consumidor;
  - resolver o contrato E20.2 autorizado, preservar automaticamente valores ainda válidos e reapresentar somente fields aplicáveis e pendências da versão operacional pré-handoff;
  - field novo aplicável aparece como pendência; novo obrigatório aplicável torna a configuração incompleta até preenchimento humano;
  - condições e aplicabilidade somente podem evoluir conforme as regras compatíveis do E20.2; remoção de field ou mudança de `value_type` não é evolução suportada neste plano e deve parar no gate da E20.2, sem teste especulativo de migração;
  - não fazer backfill artificial, preenchimento silencioso, descarte de valores válidos ou criação prematura de `draft`;
  - depois do handoff, não executar esta revalidação a partir da E19.2; E19.5 é o único consumidor operacional.

- UI declarativa sem catálogo paralelo:
  - derivar fields, tipos, obrigação, opções, condições e validação do E20.2 resolvido; cada novo field não pode exigir nova lista de domínio na E19.2;
  - reutilizar `purpose` e o mecanismo existente de labels/textos amigáveis, com o menor ajuste localizado possível quando faltar um texto; não criar registry paralelo, allowlist de fields ou resolver local;
  - manter as especializações existentes de paleta/logo apenas quando o `valueType`/contrato exigir; se labels amigáveis exigirem mudança material no contrato E20.2, parar e reportar;
  - remover a autoridade do hidden `catalog_version`: o client envia revisão e valores, e o server deriva a versão operacional pré-handoff e atualiza a versão corrente do agregado somente após validar/persistir;
  - após handoff, a UI operacional não consulta nem reinterpreta o agregado E19.2.

- Continuidade da execução no mesmo PR e branch:
  - até a aprovação humana, o PR #802 e a branch `codex-app/e19-2-light-catalog-evolution` permanecem os mesmos do plano; seguindo `docs/prompt-estrategista-light.md`, esta etapa ainda mantém o PR em draft e não inicia runtime;
  - após a aprovação humana do plano-base Light, a implementação da E19.2.7 prossegue no mesmo PR #802 e na mesma branch, reutilizando os boundary/adapters existentes para resolver a autoridade pré-handoff, revalidar valores e permitir evolução corrente de `catalog_version`;
  - não há merge intermediário do plano; o merge final do PR permanece exclusivamente humano;
  - reutilizar a separação histórica/efetiva de `generationContext.ts` e a preparação canônica E20.6, sem criar resolver paralelo;
  - preservar E19.2.3–E19.2.6 como concluídas; não reimplementar migration, vínculo, drafts, paleta ou jornada já entregues;
  - a implementação autorizada continua sem nova migration, schema, persistência física, estado por cliente, conteúdo, geração, publicação, tracking, CRM, capability nova ou assets.

- Critérios de aceite e validação:
  - pré-handoff com agregado `v2` e versão autorizada `v5` preserva valores v2 válidos, apresenta o field novo aplicável e permanece incompleto se o novo obrigatório faltar;
  - após revalidação e save confirmados, `catalog_version` pode avançar `v2 → v5`; snapshots/revisões já materializados mantêm a versão efetivamente usada na geração;
  - condições/aplicabilidade permitidas e novo obrigatório são cobertos sem reabrir o contrato evolutivo do E20.2;
  - valores ainda válidos atravessam a evolução sem novo prompt; ausência ou incompatibilidade da autoridade falha fechado;
  - pré-handoff permanece na E19.2; handoff válido torna E19.5 a única autoridade operacional e impede fallback/concorrência da E19.2;
  - payload client adulterado não escolhe versão, não atualiza `catalog_version` sem validação server-side e não atravessa isolamento tenant-safe;
  - casos focados cobrem field novo, novo obrigatório, condições/aplicabilidade permitidas, preservação de valores válidos, versão autorizada ausente/incompatível e pré-handoff × pós-handoff; não cobrem remoção de field nem mudança de `value_type` porque o contrato E20.2 atual não as autoriza;
  - se a implementação alterar a jornada, validar Preview/hospedado em desktop, mobile, teclado, foco e erros visíveis; executar somente checks aplicáveis e `git diff --check`.


## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo da E19.2

- Geração de copy ou conteúdo da LP.
- Seleção efetiva de módulos e variantes para geração.
- Renderer, preview de LP gerada, materialização final ou publicação.
- Tracking, Analytics, dashboard de performance, Google Ads ou Meta.
- Formulário funcional, captura de leads, CRM ou gestão comercial.
- Limites de drafts/publicações ou outras capacidades Starter ainda não admitidas na E9.7.4.
- Integração concreta da E19 com capabilities antes da E9.7.5 e dos gates técnicos necessários.
- IA, OpenAI, agente, memória, retry assistido, classificação automática de taxon ou assistência conversacional.
- Alteração de taxon pela E19.
- Readiness, autorização paralela ou revogação da antiga E12.4.4.
- Catálogo paralelo aos campos da E20.2.
- Catálogo paralelo de capabilities da E9.7.
- Novo editor visual, drag-and-drop ou redesign amplo do Account Dashboard.
- Catálogo amplo de produtos, serviços, assets ou mídias.
- Override de logo por LP.
- Upload, bucket, Storage, Blob ou gestão de assets.
- Implementação preventiva de recursos para Lite, Pro ou Ultra.
- Atualizações operacionais do catálogo após handoff válido; esse consumidor pertence à E19.5.

### 4.2. Critérios de parada

- Se a migration candidata não puder materializar o agregado 1:1 aprovado com isolamento tenant, RLS, grants mínimos e retomada, parar antes de criar alternativa física ou normalizar campos por conta própria.
- Se o logo exigir captura, upload, bucket, serviço ou nova infraestrutura, manter logo ausente e parar a ampliação; assets pertencem a evolução futura.
- Se a E19.2 precisar de campo não existente na E20.2, devolver ao recorte responsável pela E20.2; não criar campo paralelo.
- Se uma regra depender de capacidade ainda não admitida na E9.7.4, preservar a dependência e não inventar valor ou gate.
- Se o consumo real de `lib/commercial-capabilities/` exigir os P2 pós-merge ainda não corrigidos, tratar o ajuste no recorte da E9 antes da integração.
- Se taxon, entitlement, conta ou membership estiverem ausentes ou inválidos, falhar fechado; não criar fallback permissivo.
- Se não houver autoridade canônica suficiente para selecionar a versão operacional E20.2, se `reviewed_input_catalog_version` não puder ser consumido com o contrato exato já existente ou se a evolução E20.2 v5 não estiver executável/revisada, interromper sem inventar `latest`, maior versão ou marcador novo.
- Se a preservação/revalidação exigir nova tabela, coluna, migration, metadado de versão por valor, estado de migração por cliente ou mudança de schema, interromper o Light e devolver a lacuna para decisão humana/processo completo.
- Se a UI exigir uma lista de fields paralela, um resolver paralelo ou hardcode adicional para acompanhar a evolução, interromper e reduzir o delta antes de implementar.
- Se E19.2 continuar como fallback/autoridade operacional após handoff válido para E19.5, interromper: não há duas autoridades concorrentes.
- Se E20.2 tentar remover field ou alterar `value_type` fora das regras evolutivas atuais, interromper no recorte E20.2; não inventar compatibilidade na E19.2.
- Se surgir necessidade de IA ou automação nesta entrega, interromper a ampliação e voltar ao fluxo do Estrategista antes de mudar `Automação: não`.
- Se qualquer fase começar a incorporar geração, publicação, tracking, CRM ou capacidades comerciais não aprovadas, parar e devolver ao humano como ampliação de escopo.

07/08/2026 — Plano-base E19.2 v1 — Onboarding e configuração mínima da conta para LP Starter

## 0. Identificação e fontes

### 0.1. Identificação

- Recorte: `E19.2`.
- Path: `docs/lousa-plano-base-e19-2.md`.
- Plano conceitual: N/A — debate humano e do Analista consolidado nas decisões abaixo e em `docs/lp-planejamento.md`.
- Natureza: plano-base v1.
- Automação do recorte: não.
- OpenAI na v1: não.
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
- `docs/lousa-plano-base-e9-7.md` — contrato de capacidades comerciais, E9.7.3 concluída e E9.7.4/E9.7.5 ainda planejadas.
- `docs/lousa-plano-base-e20-2.md` — contrato declarativo de entradas de `landing_page`.

### 0.3. Implementação usada

- `lib/lp-builder/` e `app/lp-builder/actions.ts` — boundary produtivo da E19.1 e criação de LP real em `draft`.
- `app/a/[account]/page.tsx` — superfície atual pós-setup da conta e decisão da experiência comercial.
- `lib/conversion-content/landing-page/input-catalog/` — contrato E20.2 v2, escopos, obrigação, validação e `landingPageSubstitutionPolicy`.
- `lib/commercial-entitlements/` — resolução do entitlement e do `planKey` efetivo.
- `lib/commercial-capabilities/` — boundary canônico criado na E9.7.3, ainda sem capacidades Starter admitidas no registry runtime.
- Taxonomia da conta — resolver autoritativo do taxon primário ativo já usado na superfície da conta.
- PR #690 — refinamento concluído da E20.2.
- PR #694 — E9.7.3 concluída.

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

### 1.6. Identidade visual na v1

- Logo é opcional.
- Paleta confirmada é obrigatória.
- A v1 não usa OpenAI nem automação para analisar taxon, oferta, logo ou gerar paleta personalizada.
- A experiência oferece caminho manual simples com opções pré-validadas, edição humana, validação determinística e confirmação.
- O contrato separa `proposta/opção disponível → edição → validação → confirmação`, preservando futura evolução da origem da proposta sem alterar o valor canônico.
- Contraste, legibilidade e demais limites de acessibilidade permanecem determinísticos.
- A forma física de armazenamento do asset de logo não é presumida nesta v1; qualquer nova infraestrutura de asset exige fonte real e retorno ao Estrategista antes de implementação.

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
- A E19.2 v1 não interpreta nomes de plano, não consulta `public.plans` como gate funcional e não cria resolver paralelo de capabilities.
- Progressive disclosure condicionado por capacidade só entra quando existir capacidade admitida e integração canônica disponível.
- Tracking por plano não é fechado neste recorte.
- Preservar apenas a fronteira conceitual entre configuração reutilizável da conta e associação/mensuração específica da LP, sem implementar tracking, Analytics ou Google Ads.
- Os dois P2 pós-merge da E9.7.3 — proteção `server-only` e correlação tipada entre definição e valor — são gates técnicos antes de consumo real do boundary por E19, não responsabilidade da E19.2.

### 1.9. Automação e IA

- Automação: não.
- OpenAI: não na v1.
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
- Catálogo E20.2 v2 resolvido explicitamente para a cadeia de taxon e plano aplicáveis.
- Valores já persistidos por escopo.
- Configuração parcial anteriormente preservada, quando existir.
- Logo opcional e paleta previamente confirmada, quando existirem.

#### 2.4.3. Processamento

- A E19.2 deve resolver os campos aplicáveis a partir da E20.2, sem lista paralela.
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
- A v1 não fixa tabela, coluna, JSON ou Storage para resolver essa lacuna.
- Na v2, a forma física deve ser escolhida somente após inspeção do schema e avaliação dos especialistas; se nenhuma estrutura vigente atender com isolamento tenant, RLS, scopes e retomada, devolver ao Estrategista antes de propor migration, bucket ou nova infraestrutura.
- Não usar a criação prematura de uma LP `draft` como mecanismo de persistência do onboarding.

#### 2.4.6. Consumo

- Retomada do próprio onboarding.
- Área posterior `Configurações` para valores reutilizáveis.
- Criação ou seleção da LP `draft` pela E19.1 após completude.
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
- OpenAI indisponível: N/A, pois a v1 não depende de IA.

### 2.5. Frontend e evidência esperada

- Reutilizar os componentes e tokens vigentes de `docs/design-system.md`; não criar framework paralelo de formulário.
- Jornada deve funcionar em desktop e mobile.
- Navegação por teclado e foco visível devem permanecer utilizáveis.
- Campos devem exibir label, hint e erro de forma acessível quando aplicável.
- Progresso da jornada deve ser compreensível sem exigir conhecimento técnico.
- Valores previamente válidos devem permanecer após erro, navegação para trás, saída e retorno.
- A experiência deve evidenciar claramente a transição de “configurando” para “pronto para trabalhar na LP”.
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

- Status: planejada.
- Automação: não.
- Objetivo:
  - materializar no boundary E19 a resolução da configuração mínima, a completude derivada e a persistência retomável dos valores sem criar LP prematuramente.
- Entrega:
  - estender o boundary existente de `lib/lp-builder/`, sem domínio paralelo de LP;
  - consumir o catálogo E20.2 por versão explícita e cadeia autoritativa de taxon;
  - definir contratos tipados para leitura, gravação e completude por escopo, sem duplicar definições da E20.2;
  - reutilizar valores existentes quando válidos;
  - materializar a menor persistência compatível com o schema real, somente depois de fechar a forma física na v2;
  - preservar progresso parcial e retomada;
  - manter conta, membership, entitlement e taxon como gates server-side fail-closed;
  - não criar `onboarding_status`, snapshot de geração ou LP `draft` nesta fase.
- Critérios de aceite:
  - completude é derivada exclusivamente do contrato aplicável e dos gates autoritativos;
  - obrigatório/condicional aplicável ausente bloqueia conclusão; opcional ausente não bloqueia;
  - configuração parcial válida pode ser lida novamente sem perda;
  - nenhuma lista paralela de campos, hardcode de plano ou resolver paralelo é introduzido;
  - nenhuma nova tabela, migration, bucket ou infraestrutura é criada sem forma física aprovada na v2 e fonte real do projeto;
  - testes cobrem casos positivos, negativos e fail-closed aplicáveis.

### 3.2. E19.2.4 — Jornada guiada pós-entitlement e retomada

- Status: planejada.
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
- Critérios de aceite:
  - conta sem entitlement não entra no onboarding;
  - owner/admin elegível com configuração incompleta entra na jornada;
  - valores existentes aparecem reaproveitados;
  - taxon é contexto read-only;
  - erro localizado não apaga os demais valores;
  - saída e retorno retomam a configuração parcial;
  - desktop, mobile e teclado são validados com evidência proporcional.

### 3.3. E19.2.5 — Identidade visual mínima da conta

- Status: planejada.
- Automação: não.
- Objetivo:
  - permitir confirmar a identidade visual mínima necessária ao Starter sem IA e sem tornar logo obrigatório.
- Entrega:
  - suportar `brand_logo_asset` como valor opcional conforme a E20.2, sem inventar URL livre como contrato do asset;
  - definir na v2, a partir da infraestrutura real, formatos, limites, remoção e armazenamento seguro do logo; devolver ao Estrategista antes de criar bucket ou serviço novo;
  - apresentar opções simples de paleta, permitir edição humana e validar o contrato de cinco papéis da E20.2;
  - validar contraste e legibilidade de forma determinística;
  - persistir somente a paleta confirmada como valor canônico reutilizável;
  - preservar `landingPageSubstitutionPolicy`, permitindo override explícito de paleta por LP em evolução própria, sem implementar esse override nesta fase quando não houver consumidor real.
- Critérios de aceite:
  - ausência de logo não bloqueia o onboarding;
  - paleta válida e confirmada é necessária para completude;
  - combinação inválida não pode ser confirmada;
  - nenhuma chamada OpenAI, extração automática de cores ou geração personalizada de paleta é introduzida;
  - experiência permanece compreensível sem exigir conhecimento técnico de cinco cores.

### 3.4. E19.2.6 — Revisão, conclusão e transição para LP `draft`

- Status: planejada.
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
  - manter limites de quantidade fora da E19.2 até capacidade correspondente ser admitida e integrada pela E9.7;
  - direcionar a conta ao espaço operacional após a escolha/criação, sem geração de conteúdo neste recorte.
- Critérios de aceite:
  - configuração incompleta não cria LP nova;
  - configuração completa libera a transição;
  - draft existente pode ser selecionado sem duplicação automática;
  - múltiplos drafts nunca são escolhidos silenciosamente;
  - criação continua usando os gates server-side da E19.1;
  - nenhuma geração, revisão de copy, publicação ou tracking é iniciada.

### 3.5. Próxima ação após a v1

- Orientar o Executor a ajustar `docs/roadmap.md` no mesmo PR conforme `docs/prompt-abc.md` e `docs/template-roadmap.md`.
- Registrar somente `19.2`, `19.2.1`, `19.2.2` quando materialmente aplicável e as subseções planejadas `19.2.3` a `19.2.6`, com títulos, objetivos e status planejado; não registrar implementação inexistente.
- Depois da reconciliação do roadmap, apresentar ao humano as opções do item 5 de `docs/prompt-estrategista.md`.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo da E19.2 v1

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
- Implementação preventiva de recursos para Lite, Pro ou Ultra.

### 4.2. Critérios de parada

- Se o schema vigente não possuir estrutura segura para persistir os valores pré-`draft` com isolamento tenant, scopes e retomada, parar antes de criar migration ou tabela e devolver ao Estrategista com a alternativa mínima baseada nas fontes reais.
- Se o logo exigir bucket, serviço ou nova infraestrutura não existente/aprovada, parar antes de criá-la e devolver ao Estrategista.
- Se a E19.2 precisar de campo não existente na E20.2, devolver ao recorte responsável pela E20.2; não criar campo paralelo.
- Se uma regra depender de capacidade ainda não admitida na E9.7.4, preservar a dependência e não inventar valor ou gate.
- Se o consumo real de `lib/commercial-capabilities/` exigir os P2 pós-merge ainda não corrigidos, tratar o ajuste no recorte da E9 antes da integração.
- Se taxon, entitlement, conta ou membership estiverem ausentes ou inválidos, falhar fechado; não criar fallback permissivo.
- Se surgir necessidade de IA ou automação na v1, interromper a ampliação e voltar ao fluxo do Estrategista antes de mudar `Automação: não`.
- Se qualquer fase começar a incorporar geração, publicação, tracking, CRM ou capacidades comerciais não aprovadas, parar e devolver ao humano como ampliação de escopo.

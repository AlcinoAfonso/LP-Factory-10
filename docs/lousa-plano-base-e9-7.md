06/08/2026 — Plano-base E9.7 v1 — Catálogo canônico de capacidades e limites por plano

## 0. Identificação e fontes

### 0.1. Identificação

- Recorte: `E9.7`.
- Path: `docs/lousa-plano-base-e9-7.md`.
- Plano conceitual: https://github.com/AlcinoAfonso/LP-Factory-10/pull/691
- Natureza: plano-base v1.
- Automação do recorte: não.
- Frontend próprio da E9.7: N/A nesta v1.

### 0.2. Documentação usada

- `README.md` — visão do produto, princípios do MVP, evolução progressiva dos planos e avaliação de recursos candidatos.
- `docs/prompt-estrategista.md` — fluxo do Estrategista e requisitos do plano-base v1.
- `docs/template-roadmap.md` — hierarquia `E9.7.3+` e regras de estrutura do roadmap.
- `docs/roadmap.md` — estado vigente da E9 e fronteiras já consolidadas.
- `docs/base-tecnica.md` — boundaries, adapters, fail-closed, anti-hardcode de planos/limites e regra vigente de grants/features.
- `docs/schema.md` — estado real de `public.plans`, `account_commercial_entitlements` e `account_landing_pages`.
- `docs/prompt-abc.md` — atualização documental do roadmap durante a execução.
- PR #691 — debate conceitual temporário, especialmente `L-014`, `L-015` e `C-003`.

## 1. Estado e decisões fixas

### 1.1. Problema e responsabilidade da E9.7

- O entitlement comercial já informa o plano efetivo da conta por `planKey`, mas o produto ainda não possui um contrato canônico único que traduza esse plano em capacidades, níveis, limites e sinais suficientes para que os domínios decidam quais configurações podem ser apresentadas.
- A E9.7 deve definir e resolver esse contrato; não deve implementar os recursos funcionais dos domínios consumidores.
- O domínio consumidor mede seu próprio uso e aplica o gate no ponto da ação.
- A UI não deve inferir comportamento diretamente pelo nome do plano.

### 1.2. Separações obrigatórias

- Entitlement informa qual plano efetivo a conta possui.
- E9.7 informa o que esse plano permite.
- A E9.7 informa capacidade, nível ou limite suficiente para o domínio consumidor decidir quais configurações podem ser apresentadas; não define campos concretos, valores de entrada nem implementa sua UI.
- E20.2 governa dados de entrada e seus contratos, não capacidades comerciais.
- E19 e futuros domínios consumidores implementam recursos, medem uso e aplicam gates.
- Disponibilidade comercial por `taxon + plano` permanece decisão separada e não integra este recorte.
- Capacidade admitida, consumidor capaz de aplicá-la e implementação efetivamente existente são estados conceitualmente distintos.

### 1.3. Admissão e catálogo canônico

- Fluxo de admissão: `candidata → avaliação → decisão humana`.
- Identificação, implementação experimental e teste em LP real são meios possíveis de avaliação quando aplicáveis, não etapas obrigatórias para toda capacidade.
- Candidatas e itens em avaliação ficam fora do catálogo canônico.
- Somente capacidade admitida por decisão humana entra no catálogo.
- Associação e valor da capacidade em cada plano são decisões independentes da definição da capacidade.

### 1.4. Definição mínima de capacidade

- A definição canônica mínima contém:
  - chave estável;
  - nome/descrição;
  - categoria classificatória;
  - tipo com contrato de valor inequívoco;
  - domínio consumidor.
- Categoria é classificatória e não funciona como gate.
- Tipos iniciais:
  - `booleano`;
  - `nível fechado`;
  - `limite numérico`.
- Não criar quarto tipo sem consumidor real que o exija.

### 1.5. Primeiro contrato Starter

- O primeiro catálogo executável começa pelo Starter.
- Somente entram capacidades admitidas com consumidor real existente ou já aprovado para a jornada imediata.
- Uma capacidade necessária, mas ainda não admitida, permanece dependência/candidata até decisão humana.
- Limite contratual pode ser admitido sem desenvolvimento de recurso novo quando houver domínio consumidor capaz de aplicá-lo e valor aprovado.
- A E9.7 não fecha nesta v1 todo o pacote comercial do Starter; `README.md` mantém Starter mínimo como definição estratégica progressiva.

### 1.6. Estado técnico que deve ser reconciliado

- `CommercialEntitlementSignal` já expõe `isCommerciallyEligible`, `effectiveStatus` e `planKey`.
- `public.plans` possui metadados e limites parciais, mas `docs/schema.md` declara que essa tabela não é fonte suficiente para todo o contrato comercial.
- `docs/base-tecnica.md` proíbe hardcode disperso de lógica de planos/limites e prescreve uma resolução por feature/grant.
- A inspeção atual do repositório e do schema não identificou implementação materializada de `get_feature(account_id, feature_key)`; a E9.7 não deve presumir que esse mecanismo já exista nem criar um segundo sistema paralelo sem reconciliar essa regra.
- A forma física da fonte canônica não é fixada nesta v1; a E9.7.3 deve escolher a menor solução compatível com o estado real e devolver ao Estrategista qualquer necessidade de nova tabela, rota, UI, serviço, job, agente, automação ou infraestrutura.

## 2. Contrato do caso

### 2.1. Resultado esperado

- Disponibilizar uma fonte canônica única e um contrato server-side determinístico capazes de transformar o plano efetivo em capacidades, níveis, limites e sinais suficientes para que consumidores decidam configurações apresentáveis.
- Entregar o primeiro catálogo incremental do Starter sem antecipar Lite, Pro ou Ultra completos.
- Permitir que consumidores reais consultem o contrato sem hardcode de nomes de plano e sem usar `public.plans` isoladamente como gate funcional.
- Preservar nos consumidores a definição dos campos concretos, dos valores de entrada e da UI associada às configurações apresentadas.

### 2.2. Usuários e atores

- Humano responsável pelo produto:
  - admite capacidades;
  - decide associação e valor por plano quando necessário.
- E9.7:
  - mantém definição canônica;
  - resolve o contrato do plano efetivo.
- Domínios consumidores:
  - medem uso;
  - aplicam permissão, nível ou limite no ponto da ação.
- Conta cliente:
  - recebe os efeitos do contrato pela experiência dos domínios consumidores.

### 2.3. Contrato de valor

- `booleano`:
  - representa presença ou ausência da capacidade no plano.
- `nível fechado`:
  - representa um valor pertencente a conjunto fechado explicitamente definido pela própria capacidade.
- `limite numérico`:
  - representa quantidade máxima de uma unidade claramente definida pela capacidade;
  - convenção técnica vigente de `-1 = ilimitado` só pode ser usada quando o contrato concreto da capacidade a adotar explicitamente.
- Valor ausente, inválido ou incapaz de ser interpretado pelo contrato deve falhar fechado.

### 2.4. Fluxo operacional

#### 2.4.1. Gatilho

- Surge uma capacidade candidata, um recurso já existente que precisa ser formalizado ou uma regra/limite que precisa integrar o contrato de plano.

#### 2.4.2. Entrada

- Definição do problema ou valor pretendido.
- Nome/descrição da capacidade.
- Categoria classificatória.
- Tipo provável e contrato de valor.
- Domínio consumidor real ou aprovado.

#### 2.4.3. Processamento

- Executar `candidata → avaliação → decisão humana`.
- Avaliação pode incluir identificação de implementação existente, experimento, teste em LP real e análise de benefício, custo, complexidade, segurança, manutenção e impactos, conforme aplicável.
- Após admissão, definir separadamente a associação e o valor da capacidade no plano.

#### 2.4.4. Validação

- Capacidade admitida por decisão humana.
- Chave estável e definição mínima completas.
- Tipo e valor compatíveis com o contrato da capacidade.
- Consumidor real existente ou aprovado.
- Nenhuma candidata ou hipótese comercial entrando como capacidade disponível.

#### 2.4.5. Persistência

- Registrar a definição canônica da capacidade e sua associação/valor por plano em uma única fonte canônica.
- A forma física será determinada na E9.7.3 a partir da arquitetura real.
- Eventual versionamento físico ou mecanismo equivalente será definido somente se necessário na E9.7.3 ou em evolução posterior.
- Não criar nova persistência de banco na v1 sem fonte técnica real e decisão de escopo correspondente.

#### 2.4.6. Consumo

- Fluxo: `entitlement → planKey efetivo → resolução E9.7 → contrato de capacidades/limites → domínio consumidor`.
- A E9.7 fornece permissão, nível ou limite, inclusive como sinal para o consumidor decidir quais configurações podem ser apresentadas.
- O consumidor mede o estado/uso do próprio domínio, define os campos e a UI quando aplicável e aplica a regra server-side.
- A E9.7 não conta drafts, publicações, conversões, membros ou outros usos pertencentes aos consumidores.

#### 2.4.7. Fallback

- Plano efetivo inexistente ou inválido: não conceder capacidade por inferência.
- Capacidade inexistente ou não admitida: não considerar disponível.
- Associação ao plano ausente: não presumir permissão.
- Valor inválido: falhar fechado.
- Erro de resolução: falhar fechado e não liberar recurso silenciosamente.

### 2.5. Frontend

- N/A nesta v1.
- Não criar Admin Dashboard de capacidades, editor de catálogo ou UI de gestão neste recorte.
- Caso uma superfície administrativa se torne necessária, devolver ao Estrategista antes de incluí-la.

## 3. Fases e próxima ação

### 3.1. E9.7.3 — Contrato canônico e fonte de resolução

- Status: planejada.
- Automação: não.
- Objetivo:
  - materializar o contrato canônico mínimo e a fonte única de resolução sem criar sistema paralelo ao contrato técnico vigente.
- Entrega:
  - confirmar classificação, boundary e path canônico na arquitetura real antes de criar artefatos;
  - reconciliar a prescrição de feature/grant de `docs/base-tecnica.md` com o que efetivamente existe no repositório e no schema;
  - materializar tipos e validações para chave, categoria, tipo, contrato de valor e domínio consumidor;
  - materializar resolução fail-closed por `planKey` sem hardcode disperso nos consumidores;
  - manter candidatas e avaliação fora da fonte runtime canônica;
  - criar testes aplicáveis para capacidade/plano conhecido, desconhecido e valor inválido.
- Critérios de aceite:
  - existe uma única fonte de definição/resolução aprovada;
  - nenhum consumidor precisa interpretar nome de plano para conhecer uma capacidade;
  - plano/capacidade/valor inválido falham fechado;
  - não existe segunda solução concorrente para grants/features;
  - nenhuma nova tabela, rota, UI, serviço, job, agente, automação ou infraestrutura é criada sem retorno explícito ao Estrategista.

### 3.2. E9.7.4 — Catálogo inicial do Starter

- Status: planejada.
- Automação: não.
- Objetivo:
  - preencher o primeiro contrato Starter somente com capacidades e limites admitidos e verificáveis.
- Entrega:
  - selecionar apenas capacidades com consumidor real existente ou já aprovado para a jornada imediata;
  - registrar para cada capacidade a definição mínima e o valor Starter aprovado;
  - admitir limites simples quando houver unidade clara, consumidor capaz de aplicá-los e decisão humana de valor;
  - manter capacidades ainda candidatas como dependências, fora do catálogo runtime;
  - não completar Lite, Pro ou Ultra por extrapolação.
- Critérios de aceite:
  - nenhuma capacidade especulativa integra o Starter;
  - nenhum valor numérico ou nível é inventado sem decisão aprovada;
  - cada capacidade aponta para consumidor real ou já aprovado;
  - capacidade aprovada para o plano não é apresentada como operacional se sua implementação ainda não existir;
  - o catálogo não reabre tracking, Analytics, CRM, integrações, IA, Teste A/B ou outros recursos apenas para preencher planos.

### 3.3. E9.7.5 — Resolução e contrato de consumo pelo plano efetivo

- Status: planejada.
- Automação: não.
- Objetivo:
  - conectar o `planKey` efetivo do entitlement ao contrato canônico e disponibilizar resolução server-side para consumidores, sem absorver a lógica operacional desses domínios.
- Entrega:
  - consumir o `planKey` do boundary de entitlement existente;
  - resolver o contrato Starter pela fonte canônica criada na E9.7.3 e preenchida na E9.7.4;
  - expor contrato server-side estável para consumidores futuros/imediatos;
  - preservar o entitlement como prova de plano e a E9.7 como prova de capacidade;
  - validar fallback fail-closed e ausência de interpretação de plano na UI.
- Critérios de aceite:
  - `planKey` válido resolve contrato determinístico;
  - plano desconhecido, capacidade ausente ou valor inválido não liberam recurso;
  - não há consulta a Stripe para resolver capacidade;
  - `public.plans` não é usado isoladamente como gate funcional;
  - a E9.7 não mede uso nem altera comportamento específico de E19, E20.2 ou outro consumidor sem recorte próprio aprovado.

### 3.4. Próxima ação após a v1

- Orientar o Executor a ajustar `docs/roadmap.md` neste mesmo PR, conforme `docs/prompt-abc.md` e `docs/template-roadmap.md`.
- O roadmap deve registrar somente:
  - `E9.7 — Catálogo canônico de capacidades e limites por plano`;
  - objetivo e status planejado;
  - `E9.7.3 — Contrato canônico e fonte de resolução`;
  - `E9.7.4 — Catálogo inicial do Starter`;
  - `E9.7.5 — Resolução e contrato de consumo pelo plano efetivo`.
- Não registrar implementação inexistente.
- Após a reconciliação do roadmap, seguir ao item 5 de `docs/prompt-estrategista.md` para decisão humana entre processo atual e processo automatizado.
- Não iniciar implementação antes do fluxo posterior aplicável e da consolidação da v2.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Implementar Teste A/B, tracking, Analytics, CRM, integrações, IA, publicação, leads ou qualquer outro recurso funcional apenas para preencher o catálogo.
- Fechar Lite, Pro ou Ultra completos.
- Definir disponibilidade comercial por `taxon + plano`.
- Criar Admin Dashboard ou editor de capacidades.
- Criar nova tabela, rota, job, agente, automação, serviço, engine ou infraestrutura sem fonte real e aprovação de escopo.
- Definir snapshot, upgrade/downgrade, grandfathering, add-ons, exceções por conta ou retirada/versionamento detalhado.
- Espalhar condicionais por nome de plano em UI ou domínios consumidores.
- Tratar `public.plans`, `accounts.plan_id` ou qualquer metadado legado isoladamente como prova de capacidade.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se a E9.7.3 não puder reconciliar a regra vigente de grants/features com o estado real sem criar solução paralela.
- Parar se a fonte canônica exigir nova infraestrutura não prevista nesta v1.
- Parar se uma capacidade do Starter depender de recurso funcional ainda não aprovado no domínio consumidor.
- Parar diante de valor, nível ou limite sem decisão humana necessária de produto.
- Parar se houver necessidade de alterar o entitlement para representar capacidade, pois plano efetivo e capacidades devem permanecer separados.
- Parar se a implementação exigir ampliar o recorte para Lite, Pro, Ultra, disponibilidade por taxon ou gestão administrativa de catálogo.

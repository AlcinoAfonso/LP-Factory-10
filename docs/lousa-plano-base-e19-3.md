08/08/2026 — Rascunho vivo — E19.3 — Contrato e composição determinística do contexto de geração

## 0. Identificação

### 0.1. Estado do documento

- Status: debate em andamento.
- Natureza: rascunho vivo anterior ao plano-base v1.
- Este arquivo usa desde o início o path definitivo do futuro plano-base, mas seu conteúdo ainda não constitui v1 aprovada.
- Durante o debate, registrar somente definições aceitas pelo humano e questões ainda abertas que sejam necessárias ao fechamento do recorte.
- Ao encerrar o debate, este rascunho será consolidado como plano-base v1, sem criar arquivo paralelo.

### 0.2. Recorte e objetivo

- `E19.3 — Contrato e composição determinística do contexto de geração`.
- Objetivo do recorte: implementar o menor mecanismo universal capaz de receber uma `landing_page` legítima já configurada pelo fluxo oficial e produzir, server-side, um pacote de geração completo, autorizado e testável, resolvendo estrutura efetiva, módulos, variantes, ordem, fields, bindings, fontes, fatos, evidências, guidance, limites e proveniência a partir dos contratos canônicos vigentes.
- A E19.3 termina com esse pacote determinístico pronto para consumo; não chama OpenAI, não gera copy, não materializa conteúdo e não renderiza a landing page.
- O mecanismo deve funcionar da mesma forma para qualquer taxon, plano e LP admitidos pelos contratos vigentes; diferenças de nicho entram somente pelas fontes canônicas responsáveis por essas diferenças.
- O objetivo macro do projeto continua sendo chegar rapidamente à primeira landing page real, mas a geração e a materialização passam a depender da implementação real e validada deste compilador.
- O recorte sucessor previsto é `E19.4 — Geração e materialização da landing page em draft`; seu debate detalhado deve ocorrer somente após a E19.3 estar implementada e validada.

### 0.3. Fontes obrigatórias do debate

- `README.md`.
- `docs/lp-planejamento.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/prompt-estrategista.md`.
- `docs/prompt-executor.md`.
- Planos-base e implementação vigentes de E10.8, E18.4, E18.5, E20.2, E20.3, E19.1 e E19.2.
- Repositório `AlcinoAfonso/LP-Factory-10`.

## 1. Definições aceitas durante o debate

### 1.1. Natureza universal da E19.3

- A E19.3 deve criar um compilador determinístico universal do contexto de geração de `landing_page`.
- O contrato não pode conter regra de negócio específica do primeiro nicho, da conta piloto ou da primeira LP utilizada na validação.
- A mesma lógica deve funcionar para qualquer taxon e qualquer LP que chegue legitimamente ao recorte pelos contratos vigentes.
- Diferenças entre nichos devem entrar somente pelas fontes canônicas já responsáveis por essas diferenças, nunca por condicionais nominais introduzidas na E19.3.

### 1.2. Papel da primeira LP piloto

- A primeira LP piloto é o primeiro caso concreto de validação do compilador universal, não a referência arquitetural para desenhá-lo.
- O `draft` piloto configurado serve para provar que a E19.3 consegue produzir um pacote determinístico completo e revelar bloqueios reais antes da geração por IA.
- Evidência encontrada no piloto pode justificar correção de contrato universal quando demonstrar um problema geral.
- Evidência exclusiva do nicho ou da conta piloto não autoriza regra específica dentro da E19.3.

### 1.3. Princípio de simplificação

- O critério macro permanece: incluir somente o que for indispensável para fornecer à geração posterior um contexto completo, seguro e reutilizável.
- Universal não significa genérico em excesso nem infraestrutura preventiva.
- Se uma capacidade puder ser adicionada depois sem retrabalho relevante, deve permanecer fora da primeira implementação.
- Crescimento motivado principalmente por generalizações sem consumidor atual é sinal para parar e simplificar.

### 1.4. Fronteira de composição

- A E19.3 compõe fontes vigentes e não reconstrói seus contratos.
- E10.8 permanece responsável pelo contexto de pesquisa resolvido para `end_customer` e `business_buyer`, incluindo `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
- E18.4 permanece responsável pela parametrização raiz de `landing_page`.
- E18.5 permanece responsável pelos módulos, variantes, fields e contratos estruturais.
- E20.2 permanece responsável pelo catálogo declarativo de entradas.
- E20.3 permanece responsável pelo perfil de orientação versionado.
- E19.2 permanece responsável pelos valores concretos configurados e pela associação ao `draft`.
- E9 permanece responsável por entitlement e plano efetivo; capabilities somente podem participar quando houver contrato concretamente admitido.

### 1.5. Autoridade estrutural

- A IA não participa da E19.3.
- Taxon, plano, módulo, variante, versão, prioridade, ordem, aplicabilidade, bindings e fontes autorizadas são resolvidos server-side.
- `P1 > P2 > P3` representa prioridade relativa entre recomendações, sem transformar prioridade em obrigatoriedade e sem criar quotas arbitrárias.
- Todas as recomendações válidas do perfil entram inicialmente como candidatas; a ordem efetiva dos módulos selecionados preserva `recommendedOrder`.

### 1.6. Fronteira de saída da E19.3

- A E19.3 começa com uma LP legítima já configurada pela E19.2 e termina com um pacote determinístico pronto para o consumidor seguinte.
- A saída deve ser completamente testável sem OpenAI.
- Persistência de conteúdo gerado, copy final, materialização, renderização, visualização e revisão da LP não pertencem à E19.3.
- A E19.3 pode preservar na saída a proveniência necessária para explicar as decisões do compilador, sem antecipar o modelo durável de snapshot da LP materializada.

### 1.7. Consumidor futuro E19.4

- `E19.4 — Geração e materialização da landing page em draft` é o recorte sucessor previsto.
- A E19.4 receberá como entrada a saída real implementada e validada da E19.3.
- O debate da E19.4 deverá definir, sobre evidência real do compilador, o mecanismo mínimo de IA, contrato da resposta, validação pós-IA, materialização e visualização necessárias para chegar à primeira LP real.
- Não antecipar no plano da E19.3 decisões detalhadas de IA ou materialização que dependam da implementação efetiva do compilador.

### 1.8. Determinismo antes da IA

- A E19.3 deve usar determinismo em tudo que possa ser decidido objetivamente pelos contratos e dados vigentes.
- O servidor deve resolver contexto, estrutura, fontes permitidas, valores concretos aplicáveis, fatos autorizados, evidências necessárias e bindings operacionais.
- Regra orientadora para a fronteira futura: se existe uma resposta correta derivável dos contratos e dos dados, o sistema decide; apenas formulações genuinamente generativas ficam para a E19.4.

### 1.9. Ponte determinística entre E18.5 e E20.2

- A E18.5 define o que cada módulo e field admite: estrutura, cardinalidade, política, fontes de pesquisa, suporte ou evidência operacional e bindings explicitamente contratados.
- A E20.2 define quais dados concretos existem: `fieldKey`, escopo, origem, obrigação, aplicabilidade, validação e valores resolvidos pela jornada da E19.
- A E19.3 cruza essas declarações para determinar quais valores concretos podem compor o pacote de cada módulo/field selecionado.
- Não criar preventivamente matriz ou catálogo completo `field E18.5 ↔ fieldKey E20.2`.
- Não inferir bindings por `purpose`, nomes de fields, semelhança textual ou classificação semântica em runtime.
- `research` usa somente `itemKeys` explicitamente declarados; `operational_evidence` usa somente a evidência indicada; binding operacional usa o `fieldKey` formal; `research_with_operational_support` usa a pesquisa declarada e slots de suporte com resolução explícita.
- Ausência de suporte factual retira autorização para a afirmação correspondente; field técnico permanece server-side e action usa binding operacional vigente.

### 1.10. Desmembramento E19.3 → E19.4

- Decisão humana: separar o compilador determinístico da geração por IA.
- A justificativa é material e prática: o debate sobre geração por IA tende a ser extenso e depende do comportamento real, das exceções e da interface efetivamente implementada na E19.3.
- A separação evita congelar agora decisões de IA, resposta estruturada, validação pós-IA, materialização e visualização com base apenas em um compilador ainda conceitual.
- A E19.3 deve ser implementada e validada antes de iniciar o debate detalhado da E19.4.
- Esse desmembramento não autoriza infraestrutura nova nem uma camada abstrata entre os dois recortes; E19.4 deve consumir diretamente o contrato real produzido pela E19.3.

### 1.11. E19.3.3 como fase implementável do compilador

- A fase implementável prevista permanece `E19.3.3 — Contrato e composição determinística do contexto de geração`.
- A fase deve compilar E10.8 + E18.4 + E18.5 + E20.2 + E20.3 + valores concretos da E19.2 em uma interface única e autorizada.
- Nenhuma decisão semântica livre da IA pertence a essa fase.
- A implementação esperada deve permanecer próxima de: ler contratos existentes → resolver seleção → filtrar autorização → montar a saída determinística → validar.

### 1.12. Gate 1 da E19.3.3 — seleção estrutural

- Gate 1 considerado conceitualmente fechado.
- Contrato inválido, identidade inexistente, versão incompatível, root incompatível ou inconsistência estrutural falham fechados; erro de contrato não pode ser convertido em simples não aplicabilidade.
- Contexto legítimo da LP que não satisfaça requisito explícito de uma variante torna somente essa variante inelegível.
- Se a variante preferencial da E20.3 for elegível, ela é usada.
- Se a variante preferencial for ausente ou inelegível e existir uma única alternativa elegível do mesmo módulo, a alternativa é selecionada.
- Se houver mais de uma alternativa elegível sem preferência válida capaz de desempatar, a composição falha por ambiguidade; não inventar default.
- Se nenhuma variante for elegível por incompatibilidade objetiva com o contexto legítimo da LP, o módulo pode ser omitido, pois a E20.3 não torna módulos obrigatórios.
- Fallback de variante só pode ocorrer por compatibilidade explicitamente verificável.
- Quando a variante efetiva divergir da preferência E20.3, preservar na proveniência a variante recomendada, a causa objetiva da inelegibilidade e a variante efetiva.
- Antes da execução, validar o perfil real usado na primeira prova; se ele cair em ambiguidade, tratar como gap do contrato/perfil e nunca introduzir fallback improvisado.

### 1.13. Fronteira com materialização futura

- Os guardrails compilados governam a geração futura, mas não devem ser tratados antecipadamente como restrições permanentes da LP materializada.
- A decisão sobre snapshot durável, adoção de versões novas e edição manual ou assistida pertence ao recorte de materialização/edição correspondente, começando pela E19.4 apenas no que for indispensável à primeira LP real.
- A E19.3 limita-se a produzir proveniência e classificação suficientes para seu consumidor interpretar corretamente o contrato.

### 1.14. Gate 2 da E19.3.3 — autorização do contexto

- Gate 2 considerado conceitualmente fechado pela solução mínima orientada ao consumo real.
- Regra-base: reutilizar relações estruturadas existentes → identificar gap concreto → acrescentar somente a menor relação declarativa necessária ao consumidor real.
- E10.8 entra por `researchPath`, `itemKeys` e demais relações explicitamente contratadas; nunca por julgamento livre de pertinência.
- E18.4 fornece apenas os parâmetros efetivamente necessários ao consumidor; regras exclusivamente visuais, responsivas ou de acessibilidade permanecem server-side quando não forem entrada do contexto futuro de copy.
- E18.5 continua sendo autoridade sobre `policy`, `copySourceMap`, suporte, cardinalidade, evidência e bindings.
- E20.3 fornece `generationGuidance` global e `itemGuidance` somente ao módulo correspondente.
- Um valor E20.2 só participa quando pertencer ao catálogo resolvido, estiver aplicável e válido e houver relação explícita que autorize seu consumo.
- Depois de autorizado, o fato pode ser transportado por `fieldKey`, valor e proveniência; `purpose` pode acompanhar como descrição, mas nunca autoriza a seleção.
- Não criar `factIdentity`, taxonomia geral de `contextRole`, registry de fatos, DSL, engine ou framework genérico de resolvers sem consumidor real.
- O slot abstrato atualmente demonstrado é `applicable_capabilities`, consumido por `benefits`; implementar apenas o vínculo mínimo necessário aos inputs que realmente o sustentarem.
- A E19.3.3 não pode conter bindings nominais de nicho; a relação entre slot abstrato E18.5 e inputs concretos deve ser declarada na camada responsável da E20.2 resolvida, permitindo que cada taxon forneça seus próprios inputs sem alterar o algoritmo da E19.3.3.
- Para booleanos explicitamente autorizados a `applicable_capabilities`, `true` fornece suporte e `false` não fornece suporte para afirmar aquela capacidade; não generalizar preventivamente essa semântica.
- Inputs centrais já contratados, como `primary_service_or_offer` e `primary_service_or_offer_description`, podem integrar explicitamente o contexto factual global sem papel intermediário artificial.
- Dado obrigatório e aplicável ausente ou inválido falha fechado.
- Em `required_when_claimed`, ausência de suporte proíbe a afirmação factual correspondente, sem eliminar automaticamente o field.
- Em `operational_required`, ausência da evidência impede produzir o field; se isso romper cardinalidade mínima, a variante pode tornar-se inelegível e o tratamento retorna ao Gate 1.

## 2. Questões ainda abertas para o debate

### 2.1. Gate 3 — interface lógica de saída da E19.3

- Gates 1 — seleção estrutural e 2 — autorização do contexto estão fechados; resta somente o Gate 3.
- Definir a interface lógica mínima que sai do compilador, sem antecipar schema físico ou infraestrutura extensível.
- Parte A — contrato determinístico da LP: identidade e versões necessárias, taxon e plano, root/preset, composição efetiva, variante recomendada e efetiva quando divergirem, ordem, fields/cardinalidades, bindings, proveniência e restrições aplicáveis.
- Parte B — contexto autorizado para o consumidor futuro: papel semântico, limites de geração, pesquisas e itens autorizados, fatos autorizados, evidências, tratamentos permitidos/restritos/proibidos e guidance aplicável.
- A Parte B é preparada para a futura E19.4, mas a E19.3 não chama IA nem define ainda o contrato da resposta da IA.
- Gate 3 deve permanecer curto: definir fronteira e conteúdo lógico, não DTOs preventivos, dezenas de tipos ou schema de persistência.

### 2.2. Consolidação da v1

- Após fechar o Gate 3, compactar o rascunho antes da v1, removendo repetições entre princípios, ponte E18.5/E20.2, guardrails e gates.
- A v1 deve deixar executável apenas o recorte determinístico E19.3 e registrar E19.4 como consumidor futuro planejado, sem detalhá-lo.
- A reconciliação do `docs/roadmap.md` deve refletir o desmembramento conforme o fluxo vigente do Estrategista e `docs/template-roadmap.md`.

## 3. Escopo negativo preservado durante o debate

- chamada à OpenAI ou qualquer geração de copy;
- contrato detalhado da resposta da IA;
- validação pós-IA;
- materialização do conteúdo gerado;
- renderer ou visualização da landing page;
- snapshot durável da LP materializada além da proveniência necessária à saída do compilador;
- publicação pública;
- domínio customizado;
- tracking;
- Analytics/dashboard;
- CRM;
- A/B test;
- Google Ads;
- editor drag-and-drop;
- múltiplos templates preventivos;
- otimização da E19.2;
- onboarding com IA;
- nova capability comercial;
- disponibilidade comercial `taxon + plano`;
- agente;
- memória de IA;
- job;
- automação recorrente;
- infraestrutura nova apenas para evolução futura;
- regra específica da conta piloto ou de um nicho dentro do mecanismo universal da E19.3;
- novo E18.6 apenas para acoplar módulos diretamente ao catálogo E20.2 sem evidência real de autonomia;
- catálogo ou matriz preventiva completa de bindings E18.5 ↔ E20.2;
- inferência de binding por `purpose`, nome de field ou semelhança textual;
- taxonomia geral de fatos, registry de `contextRole`, DSL ou framework genérico de resolvers sem consumidor real;
- antecipar no E19.3 o debate técnico detalhado da E19.4.

## 4. Registro do processo do rascunho

### 4.1. Regra de evolução

- Cada decisão aceita no debate deve ser incorporada neste mesmo arquivo.
- Questão resolvida deve sair da seção de questões abertas e entrar na seção correspondente de definições aceitas.
- As atualizações do rascunho podem consolidar blocos de decisões do debate, evitando mutação documental a cada intervenção isolada.
- Não criar plano-base paralelo ao final do debate.
- O encerramento do debate transforma este conteúdo consolidado em plano-base v1 e completa as quatro seções canônicas exigidas pelo `docs/prompt-estrategista.md`.
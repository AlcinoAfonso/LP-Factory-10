10/08/2026 — Plano-base v1 — E19.4 — Geração e materialização da landing page em `draft`

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado por decisão humana em 10/08/2026.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Plano conceitual: `docs/lp-planejamento.md`.
- Predecessor material: E19.3 concluída e integrada à `main`; sua API pública v1 é a entrada canônica da E19.4.
- Gates A–E do debate conceitual estão encerrados.
- Não permanece questão indispensável aberta no nível da v1; mecanismo OpenAI concreto, residência física, garantia transacional e paths técnicos exatos pertencem ao detalhamento da v2.

### 1.2. Objetivo e resultado esperado

- Consumir o pacote real e autorizado da E19.3 para gerar conteúdo estruturado candidato da primeira LP real.
- Validar deterministicamente a candidata somente no que os contratos permitem comprovar objetivamente.
- Materializar a primeira candidata integral válida no `draft` já existente, com estado próprio autossuficiente e snapshot imutável do contexto efetivamente disponibilizado à operação geracional válida.
- Disponibilizar visualização privada e read-only da LP materializada para avaliação humana real.
- Encerrar a E19.4 com a primeira LP real em `draft`, privada, reproduzível e efetivamente avaliável; conclusão da E19.4 não significa prontidão para publicação ou disponibilidade comercial.

### 1.3. Usuários e autorização

- A geração parte do estado operacional vigente de `/a/[account]`, atualmente restrito a `owner` ou `admin` ativo da conta elegível; a E19.4 não cria papel ou autorização paralelos.
- A visualização privada reutiliza o controle de acesso tenant-aware já vigente da conta/LP e não cria ACL própria.
- Conta piloto e cliente usam o mesmo fluxo oficial; não existe LP teste, geração administrativa paralela ou autorização especial por conta.

### 1.4. Automação aprovada

- Automação: sim na fase geracional.
- Categoria: Automação com IA em fluxo controlado.
- Unidade funcional: LP completa.
- Participação humana: uma ação humana explícita inicia cada operação geracional.
- Função da IA: produzir somente conteúdo para os fields já autorizados pelo pacote da E19.3.
- Função determinística: estrutura, módulos, variantes, ordem, autorização de fontes/fatos, validação pós-IA objetivamente comprovável, bindings, decisão de materialização, persistência e renderer permanecem sob autoridade do LP Factory.
- Não adotar comportamento agentic, geração funcional independente por módulo, decisão estrutural pela IA, conversa persistente ou materialização parcial.
- O mecanismo técnico OpenAI, quantidade/topologia de chamadas, Structured Outputs, schema exato, modelo, `reasoning.effort`, retry, tratamento de refusal/incomplete/error, observabilidade e custo específicos ficam para a v2 e para a avaliação formal do Gestor de Automação.

### 1.5. Decisões fixas dos Gates A–E

- Gate A:
  - uma operação humana gera a LP completa como unidade funcional;
  - IA não escolhe módulos, variantes, ordem, capabilities, fontes ou fatos fora do pacote autorizado;
  - uma operação funcional não obriga uma única chamada ao provider.
- Gate B:
  - validação bloqueante cobre somente identidade e ordem, fields admitidos, tipos, cardinalidades, obrigatoriedade, `absoluteMax`, bindings, referências técnicas e existência/autorização das fontes e evidências estruturalmente exigidas;
  - faixas recomendadas, fidelidade factual e treatments semânticos orientam geração e revisão humana, sem falsa garantia determinística;
  - não há provenance cognitiva declarada pela IA, segunda IA revisora, reparo semântico, omissão silenciosa ou materialização parcial.
- Gate C:
  - falha ou candidata inválida não materializa e permite nova tentativa humana enquanto a LP permanecer sem materialização;
  - a primeira candidata integral válida cria uma única materialização inicial dentro da E19.4;
  - depois dessa materialização válida, a E19.4 não sobrescreve a LP;
  - conteúdo atual e snapshot passam a existir juntos;
  - conteúdo materializado é autossuficiente para renderização e snapshot congela apenas identidades, versões, decisões e dados concretos efetivamente disponibilizados à operação geracional válida.
- Gate D:
  - preview é privada, autenticada, read-only e não publicada;
  - renderer consome somente o estado materializado e não recompõe E19.3 nem relê E20.2, pesquisas ou perfil vigente;
  - valores efetivos de aparência e conteúdo vêm do estado congelado; atualização futura de registry não altera silenciosamente LP já materializada;
  - QA das interações cobre somente comportamentos já contratados, sem inventar backend de submissão, tracking ou capacidade nova.
- Gate E:
  - a fronteira é `gerar → validar → materializar → visualizar → avaliar humanamente`;
  - avaliação humana é evidência de teste do recorte, não estado de domínio nem workflow de aprovação/publicação;
  - findings podem ser registrados no PR ou relatório de execução e não exigem tabela, coluna ou lifecycle próprio;
  - defeito comprovável do contrato da E19.4 bloqueia o fechamento; melhoria editorial, persuasiva, visual ou semântica sem violação do contrato vira aprendizado para recorte posterior.

### 1.6. Fontes usadas na consolidação

- `README.md`.
- `docs/lp-planejamento.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `docs/prompt-estrategista.md`.
- `docs/gestor-automations.md`.
- `docs/automations.md`.
- `docs/lousa-plano-base-e19-3.md`.
- API pública vigente de `lib/lp-builder/`, especialmente `generationContextContracts.ts` e adapters da E19.3.
- Contratos vigentes de E18.4 e E18.5 para semantic roles, fields, cardinalidades, policies, bindings, referências técnicas, interactions e critérios visuais.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho:
  - `owner` ou `admin` no estado operacional da conta aciona explicitamente a geração da LP completa;
  - enquanto não houver materialização válida, tentativa falha ou inválida não impede nova tentativa humana.
- Entrada:
  - LP legítima em `draft`, vinculada à configuração concluída;
  - sucesso completo da API E19.3, com Parte A determinística e Parte B autorizada;
  - configuração OpenAI server-side vigente e autorizada no momento da implementação.
- Processamento:
  - a IA produz somente o conteúdo dos fields autorizados dos módulos já selecionados;
  - estrutura, identidade, variante, ordem, bindings, destinos técnicos e demais decisões determinísticas não são delegados à IA.
- Validação:
  - a candidata integral é validada server-side apenas no que os contratos conseguem comprovar objetivamente;
  - qualquer violação objetivamente verificável invalida a candidata completa.
- Persistência:
  - somente a primeira candidata integral válida pode gerar a materialização inicial da E19.4;
  - conteúdo atual e snapshot imutável devem tornar-se válidos juntos;
  - residência física, formato persistido e mecanismo transacional são definidos na v2 após investigação do schema real.
- Consumo:
  - a LP materializada é visualizada privadamente no fluxo oficial da conta por renderer determinístico e read-only;
  - o renderer usa somente o estado próprio congelado da LP.
- Fallback:
  - falha da E19.3 bloqueia geração;
  - falha do provider ou candidata inválida preserva a LP sem nova materialização e permite nova tentativa humana;
  - falha de persistência não pode aparentar sucesso parcial;
  - identidade/versão não suportada pelo renderer falha explicitamente, sem fallback silencioso.

### 2.2. Contrato da candidata e validação pós-IA

- A candidata representa a LP completa, com exatamente a composição selecionada pela E19.3.
- O validator confirma objetivamente:
  - identidade e ordem dos módulos;
  - variante e fields admitidos;
  - tipos e cardinalidades;
  - obrigatoriedade;
  - limites absolutos de texto;
  - bindings e referências técnicas;
  - existência e autorização de fontes/evidências estruturalmente exigidas.
- Destinos operacionais, assets, URLs e referências técnicas sob autoridade determinística não são inventados pela IA.
- Para `action`, a IA pode produzir somente o conteúdo textual admitido, como label; o binding operacional permanece server-side.
- `operational_evidence` e referências técnicas concretas exigidas são resolvidas/validadas server-side.
- O sistema não afirma provar semanticamente, por inspeção de texto livre, fidelidade factual, ocorrência de claim ou treatment permitido/restrito/proibido.
- Field opcional pode estar ausente; se presente e estruturalmente inválido, invalida a candidata em vez de ser removido silenciosamente.

### 2.3. Materialização e snapshot

- A materialização inicial é write-once dentro da E19.4, mas a tentativa geracional não é.
- O conteúdo materializado constitui estado próprio e autossuficiente da LP para sua visualização.
- O conteúdo deve congelar todo dado concreto necessário ao renderer que, se relido de uma fonte mutável, pudesse alterar a LP existente.
- O snapshot preserva somente:
  - identidades e versões relevantes;
  - decisões estruturais usadas;
  - dados concretos efetivamente disponibilizados à operação geracional que produziu a candidata válida.
- O snapshot não registra prompt integral, resposta bruta, raciocínio, provenance cognitiva ou contexto autorizado que não tenha sido efetivamente exposto ao gerador.
- Após materialização válida, edição, regeneração, histórico, overwrite e rollback pertencem a recorte posterior.

### 2.4. Visualização privada e avaliação humana

- A superfície parte da jornada operacional já existente da conta; path técnico exato fica para a v2.
- LP sem materialização pode oferecer a ação humana de geração; LP materializada conduz à visualização privada, sem nova geração pela E19.4.
- A visualização representa a página realmente renderizada, não card ou simulação administrativa.
- Moldura externa pode indicar `draft` e não publicação sem integrar o conteúdo materializado da LP.
- O renderer pode conhecer identidades e versões estruturais suportadas, mas usa valores efetivos de conteúdo e aparência do estado congelado.
- Critérios visuais vigentes da E18.4 permanecem aplicáveis:
  - viewport mínimo 320 px;
  - evidências em 360, 768 e 1280 px;
  - sem truncamento ou scroll horizontal provocado por texto;
  - targets mínimos 44×44;
  - foco visível;
  - hierarquia semântica;
  - contraste, legibilidade e estados interativos.
- O baseline WCAG 2.2 é referência e não significa declaração de conformidade integral.
- QA de interação cobre somente comportamento contratado, como teclado/estado/foco do accordion e estrutura/labels/consentimento/foco do form; não cria backend inexistente.
- A avaliação humana verifica também copy, fidelidade factual e semântica da primeira LP.
- Findings ficam como evidência no PR/relatório de execução e não se tornam estado persistido da LP.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e validação integral da candidata

- Status: planejada.
- Automação: sim.
- Categoria: Automação com IA em fluxo controlado.
- Objetivo:
  - consumir a saída E19.3 e produzir uma candidata da LP completa, submetendo-a à validação determinística objetiva antes de qualquer persistência.
- Limites:
  - IA somente nos fields autorizados;
  - sem decisão estrutural, agentic, geração funcional por módulo, segunda IA revisora ou reparo semântico;
  - mecanismo OpenAI concreto e parâmetros ficam para a v2.
- Critérios de aceite:
  - ação humana autorizada inicia a operação;
  - falha da E19.3 impede provider;
  - candidata válida preserva exatamente a composição autorizada;
  - violações objetivamente detectáveis rejeitam a candidata integral;
  - falha ou invalidez não cria materialização e permite nova tentativa humana enquanto a LP estiver sem materialização.

### 3.2. E19.4.4 — Materialização inicial e snapshot imutável

- Status: planejada.
- Automação: não.
- Objetivo:
  - tornar a primeira candidata integral válida em estado próprio da LP, com snapshot suficiente e sem dependência futura de fontes mutáveis para sua reprodução.
- Critérios de aceite:
  - conteúdo e snapshot tornam-se válidos juntos;
  - conteúdo é autossuficiente para o renderer;
  - snapshot congela apenas o contexto efetivamente disponibilizado à operação geracional válida;
  - falha de persistência não deixa estado parcial aparentando sucesso;
  - nova tentativa é possível antes da primeira materialização válida;
  - após materialização válida, a E19.4 não sobrescreve a LP.

### 3.3. E19.4.5 — Visualização privada e prova humana da primeira LP real

- Status: planejada.
- Automação: não.
- Objetivo:
  - renderizar privadamente a LP materializada a partir de seu estado próprio e produzir a evidência humana necessária para concluir o recorte.
- Critérios de aceite:
  - acesso privado reutiliza o gate vigente da conta/LP, sem ACL paralela;
  - renderer é determinístico, read-only e não relê fontes mutáveis nem chama IA;
  - identidade/versão não suportada falha explicitamente;
  - evidências hospedadas cobrem 360, 768 e 1280 px, TAB/foco, overflow/truncamento, contraste, legibilidade e comportamentos de interação contratados;
  - avaliação humana confirma que a primeira LP é efetivamente avaliável;
  - findings ficam no PR/relatório de execução, sem estado de domínio novo;
  - defeito comprovável do contrato bloqueia o fechamento e volta para correção no próprio recorte;
  - melhoria editorial/evolutiva sem violação do contrato não amplia automaticamente a E19.4.

### 3.4. Próxima ação

- Ajustar `docs/roadmap.md` no mesmo PR #711 conforme `docs/prompt-abc.md` e `docs/template-roadmap.md`, em modo planejamento:
  - registrar E19.4 como planejada;
  - registrar somente títulos, objetivos e status planejado de E19.4.3, E19.4.4 e E19.4.5;
  - não registrar banco, arquivos, implementação ou evidência ainda inexistentes.
- Após a reconciliação do roadmap, retornar ao Estrategista para a escolha humana entre processo atual e processo automatizado conforme `docs/prompt-estrategista.md`.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4

- Publicação pública, domínio customizado e disponibilidade comercial.
- Tracking, analytics, dashboard de métricas, CRM, Google Ads e A/B test.
- Editor visual, edição manual estruturada, edição assistida por IA, regeneração, overwrite, histórico e rollback.
- Aprovação/rejeição persistida da LP, tabela de revisão ou workflow de publicação.
- Backend novo de submissão de lead ou capacidade operacional não prevista nos contratos vigentes.
- Nova ACL, papel ou autorização paralela.
- Segunda IA revisora, auditoria semântica própria ou provenance cognitiva declarada pela IA.
- Agents SDK, multi-agent, PTC, persisted reasoning, prompt caching, agente, job, fila, cron, webhook ou automação recorrente sem necessidade material demonstrada e nova decisão aplicável.
- Abstração geral de geração multicanal.
- Reabertura preventiva de E18.4, E18.5, E20.2, E20.3 ou E19.2.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - a implementação exigir decisão estrutural da IA ou comportamento agentic para cumprir o contrato;
  - surgir necessidade de reabrir E18.4, E18.5, E20.2, E20.3 ou E19.2 por bloqueio estrutural real;
  - o renderer só puder reproduzir a LP relendo fontes mutáveis e alterando silenciosamente seu estado visual ou de conteúdo;
  - a persistência não puder garantir ausência de materialização parcial sem ampliar materialmente o escopo aprovado;
  - for necessário criar backend de interação, tracking, publicação ou ACL nova para considerar a LP apenas visualizável;
  - a avaliação humana revelar defeito sistêmico comprovável do contrato, mesmo que inicialmente aparente ser apenas questão editorial;
  - surgir mudança que contradiga qualquer decisão fixa dos Gates A–E.

### 4.3. Critério de conclusão do recorte

- E19.4 está concluída quando uma LP real do fluxo oficial:
  - é gerada por ação humana autorizada;
  - passa pela validação objetiva do contrato;
  - é materializada integralmente em `draft` com snapshot coerente;
  - é reproduzida privadamente a partir de seu estado próprio;
  - é avaliada humanamente com as evidências previstas.
- Concluir a E19.4 prova a primeira LP real avaliável em `draft`; não prova prontidão para publicação nem disponibilidade comercial.

13/08/2026 — Rascunho vivo — E19.4 — Primeira LP real do Cenário D

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo do futuro plano-base v1; ainda não consolidado nem executável.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Path canônico: `docs/lousa-plano-base-e19-4.md`.
- Processo: `docs/prompt-estrategista.md` v29.
- Plano conceitual: `docs/lp-planejamento.md`.
- Base de abertura do PR #731: `main` após o merge do PR #729, commit `40baacbc516a80c2600408a9be63bfa33793ca85`.
- O plano-base v2 anterior da E19.4 permanece somente no histórico Git como desenho superado; ele dependia do contrato E19.3 `partA + partB` e não pode ser reutilizado como briefing executável.
- A E19.3 do Cenário D está concluída e sua saída canônica usa `contractVersion: 2` com `identities + modelContext + serverContext`.
- Nenhuma implementação da nova E19.4 foi iniciada neste debate.

### 1.2. Objetivo e resultado esperado

- Produzir e avaliar a primeira landing page real do Cenário D a partir do pacote autorizado da E19.3.
- Dar à IA liberdade controlada para transformar contexto autorizado em uma jornada comercial coerente, sem delegar segurança, autorização, verdade factual, bindings operacionais, persistência ou renderer.
- Gerar uma candidata estruturalmente válida, materializá-la no `draft` real já existente e disponibilizar preview privado e read-only para avaliação humana.
- Incluir na primeira prova uma LP completa e reconhecível como página comercial real, com Header, corpo, CTA(s), Footer, estrutura visual e conteúdo coerentes com o caso concreto.
- Encerrar a E19.4 quando o fluxo do Cenário D estiver funcional de ponta a ponta e a LP puder ser aberta no navegador e avaliada de forma real; a E19.4 não precisa estar editorialmente otimizada ou estabilizada antes do recorte intermediário E19.5 Light.

### 1.3. Decisões aceitas no debate até aqui

- A IA da E19.4 não consulta diretamente E10.8, E18.4, E20.2, E18.5 ou E20.3.
- A E19.3 é a fronteira autorizada entre as fontes do projeto e a geração.
- A matéria-prima textual da IA vem do `modelContext` da E19.3; `serverContext` permanece sob uso determinístico do servidor e não vira matéria-prima textual bruta para o modelo.
- A pesquisa `end_customer` da E10.8 chega integralmente dentro do `modelContext`; a E19.3 não a resume nem a filtra editorialmente.
- Os fatos concretos da LP chegam via configuração E19.2/E20.2 já resolvida e projetada pela E19.3; a IA não decide quais campos são aplicáveis ao nicho.
- A IA deve sintetizar o público efetivo da LP a partir da interseção entre pesquisa `end_customer` e fatos concretos da LP, sem criar novo cadastro ou perfil persistido de público.
- A narrativa deve possuir começo, desenvolvimento e conversão; AIDA pode servir como referência persuasiva, mas não como schema rígido de seções.
- O Hero deve revalidar a atenção conquistada antes da LP e convertê-la em interesse; o corpo deve desenvolver compreensão, desejo, confiança e tratamento de objeções; a ação pode aparecer e se repetir quando o contexto justificar.
- A IA não deve apenas preencher módulos previamente escolhidos; deve poder planejar a jornada da LP dentro de uma fonte estrutural canônica finita.
- A liberdade controlada da IA inclui, em princípio, decidir quantidade de seções, sequência, função narrativa, copy, CTA textual, omissões, repetições legítimas e layout dentre opções permitidas pelo contrato.
- O sistema continua responsável por autorização, facts disponíveis, evidências disponíveis, tipos estruturais suportados, limites absolutos, bindings, destinos, consentimento, credenciais, segurança tenant-aware, schema, materialização, snapshot, versões e renderer.
- A IA não poderá gerar HTML, CSS, React, JavaScript, scripts, componentes desconhecidos, credenciais, webhooks ou estruturas fora do contrato suportado.
- Header e Footer pertencem à E19.4 e devem fazer parte do contrato da primeira LP real.
- A E19.4 deve usar uma única fonte canônica de estrutura, da qual sejam derivadas deterministicamente as projeções necessárias para Structured Output, validação, materialização e renderer, sem registries estruturais paralelos e sem exigir que todos consumam o mesmo DTO físico.
- A E19.4 não deve acoplar prompt, composição, validação editorial ou renderer a `itemKey`, `priority`, `sortOrder`, path Markdown ou outra característica interna da representação atual da pesquisa; esses metadados podem permanecer como proveniência/ordenação do pacote, mas não podem se tornar autoridade de narrativa ou requisito para a arquitetura funcionar.
- O prompt será uma peça central do contrato de inteligência da E19.4, mas não substitui o workflow determinístico ao redor da chamada nem o contrato estrutural.
- `docs/template-prompts.md` e `docs/template-prompts-gpt-5-6.md` são fontes obrigatórias para desenhar o prompt do workload.
- Conforme a governança incorporada pelo PR #730, o prompt de runtime deve ser tratado como código versionado da feature, separando instruções estáveis da aplicação do contexto dinâmico e validado da E19.3.
- Alterações de prompt, modelo ou `reasoning.effort` devem ser avaliadas com casos representativos e critérios estáveis do workload; Structured Output define o contrato observável de saída, mas não substitui autorização, validação determinística, regras de negócio ou guardrails do LP Factory.
- O prompt deve seguir abordagem `outcome-first`: resultado, contexto, critérios de sucesso, limites, fronteiras, entrega, parada e validação; não prescrever cadeia de raciocínio privada nem microgerenciar cada passo interno.
- A fase geracional terá participação de IA e, portanto, haverá automação no recorte; a categoria final e o detalhamento técnico devem ser reconciliados com o Gestor de Automação antes da consolidação da v1, conforme `docs/prompt-estrategista.md`.

### 1.4. Fontes obrigatórias do novo debate

- `README.md`.
- `docs/prompt-estrategista.md`.
- `docs/template-roadmap.md`.
- `docs/roadmap.md`.
- `docs/lp-planejamento.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `docs/lousa-plano-base-e19-3.md`.
- `lib/lp-builder/generationContext.ts`.
- `lib/lp-builder/generationContextContracts.ts`.
- `docs/template-prompts.md`.
- `docs/template-prompts-gpt-5-6.md`.
- `docs/openai-model-snapshot.md`.
- `docs/gestor-automations.md`.
- `docs/automations.md`.
- PR #726 e `docs/lousa-plano-base-e19-5.md` somente como fonte conceitual do escopo amplo futuro de múltiplos drafts, configuração por LP e reutilização de defaults; não como plano executável atual.
- `supabase/migrations/20260807162417_e19_2_3_account_landing_page_onboarding_configuration.sql` para a proteção write-once da configuração original da E19.2.
- `lib/lp-builder/adapters/landingPagesAdapter.ts` para o boundary vigente de criação de LP `draft` independente.
- Artefatos SQL da materialização E19.4 preservados pelo PR #729, somente como fonte real já existente para o debate de persistência.

### 1.5. Questões ainda abertas e não decididas

- Qual é a qualidade semântica real dos 59 itens `end_customer` que chegaram na prova da E19.3 e se eles são suficientes para sustentar público, dores, desejos, objeções, argumentos, confiança e ação sem complementação.
- Se a geração deve ocorrer em uma única chamada que planeja e escreve a LP ou em mais de uma etapa/chamada controlada, sem transformar o fluxo em agente.
- Quais primitivas, layouts, cardinalidades, composição de Header/Footer, nesting e interações pertencem à fonte estrutural canônica única.
- Se algum metadata mínimo e seguro derivado de `identities` ou `serverContext` precisa ser projetado ao modelo para decisão estrutural, como mera disponibilidade de logo, paleta ou destino de conversão, sem expor valores operacionais brutos.
- Como representar no Structured Output o planejamento narrativo e o conteúdo final sem criar um segundo DTO de domínio ou registry paralelo ao renderer.
- Quais referências de pesquisa/fatos a candidata deve devolver para permitir validação de uso sem exigir provenance cognitiva ou cadeia de raciocínio.
- Quais claims podem ser validados objetivamente, quais dependem de evidência concreta e quais só podem ser avaliados humanamente.
- Qual combinação `modelo + reasoning effort` será adotada para a primeira prova e quais combinações serão comparadas depois dela.
- Hipótese de trabalho para medir inicialmente o teto de qualidade: `gpt-5.6-luna + reasoning.effort: max`; não é configuração definitiva nem decisão de produção.
- Como adaptar ou substituir o snapshot antigo da materialização para registrar corretamente o contrato v2, workload e contexto efetivamente exposto sem armazenar raciocínio privado.
- Qual superfície real disponibilizará o preview privado da primeira LP; o path histórico `/a/[account]/landing-pages/[landingPageId]/preview` é referência, não decisão fechada enquanto a rota vigente não for confirmada.
- Quais critérios objetivos e humanos definirão que a primeira LP do Cenário D é funcional e suficientemente avaliável para encerrar a E19.4, sem exigir otimização editorial antes da E19.5 Light.

### 1.6. Direção experimental aprovada — D → E19.5 Light → E

- Prosseguir primeiro com o Cenário D até existir uma E19.4 funcional ponta a ponta: pacote E19.3 → geração por IA → candidata estruturada → validação → materialização → renderer → preview privado.
- A primeira E19.4 D precisa funcionar e ser avaliável de ponta a ponta; otimização editorial intensiva pode ocorrer depois do recorte E19.5 Light.
- Após a E19.4 D funcional, criar um recorte E19.5 Light menor que o plano amplo do PR #726.
- Objetivo único da E19.5 Light: permitir criar novas variações como LPs `draft` independentes, reutilizando automaticamente a configuração válida da LP de origem como defaults e permitindo alterar somente valores aplicáveis desejados antes de nova geração.
- Exemplos de valores que podem variar, sempre conforme os contratos vigentes: `funnel_stage`, `transaction_intent`, `traffic_source`, `primary_conversion_channel` e outros valores de campanha/LP autorizados pela E20.2.
- Valores reutilizáveis de conta, negócio e oferta devem funcionar como defaults quando os contratos permitirem, evitando novo onboarding completo.
- Cada variação cria nova identidade `draft` e nova materialização própria; LP ou materialização anterior nunca é sobrescrita.
- A E19.5 Light deve preservar a proteção write-once da E19.2 e o vínculo exato exigido pela E19.3; não rebindar o agregado original da primeira LP.
- O PR #726 permanece como referência conceitual do futuro escopo amplo, mas workspace completo, área geral de configurações, engine de experimentos, comparação automática, ranking, IA própria, editor, publicação, tracking/analytics e histórico complexo ficam fora do Light.
- A residência física, UI e detalhes de implementação da E19.5 Light não são definidos neste rascunho; só serão fechados depois que a E19.4 D funcional demonstrar o mínimo realmente necessário.
- Regra de neutralidade: a E19.5 Light conhece apenas LP, configuração, criação de nova variação, `draft`, estado/materialização e o boundary vigente de geração.
- A E19.5 Light não conhece Cenário D, Cenário E, `itemKey`, 59 itens, E10.8, pesquisa Markdown ou representação interna da pesquisa.
- Sequência experimental aprovada: E19.4 D funcional → E19.5 Light → iterações D1/D2/D3… → estabilização/avaliação do D → branch experimental Cenário E → ajuste da E19.3 + mínimo necessário da E19.4 → iterações E1/E2/E3… → comparação D × E → decisão arquitetural humana.
- A branch experimental do Cenário E deve nascer da `main` já contendo E19.4 D e E19.5 Light.
- No experimento E, preservar E19.5 Light e, tanto quanto possível, a mesma fonte estrutural canônica, validator, materialização, renderer, prompt-base, modelo/effort e critérios de qualidade; alterar principalmente a origem/representação da pesquisa na E19.3 e alterar E19.4 somente quando a nova representação realmente exigir.
- O Cenário E é experimento posterior e não interrompe o desenvolvimento nem a conclusão funcional do Cenário D.

## 2. Contrato do caso

### 2.1. Fluxo lógico em construção

- Gatilho:
  - ação humana explícita na jornada operacional da conta inicia a geração da LP completa;
  - papéis, entitlement e superfície exatos serão confirmados contra o runtime vigente antes da v1.
- Entrada:
  - LP legítima em `draft` e configuração vinculada;
  - sucesso integral da E19.3 v2;
  - configuração OpenAI autorizada para o workload E19.4.
- Processamento:
  - revalidar autorização antes do provider;
  - obter o pacote E19.3 sem reler diretamente E10.8, E18.4, E20.2, E18.5 ou E20.3;
  - construir a requisição a partir do prompt canônico versionado do workload e do contexto autorizado;
  - permitir que a IA sintetize público efetivo, oferta, estágio do funil, intenção de conversão e jornada persuasiva;
  - produzir candidata completa dentro da fonte estrutural canônica finita;
  - combinar deterministicamente destinos, bindings, assets e demais valores server-side que não pertencem à decisão textual da IA;
  - validar integralmente a candidata antes de qualquer materialização.
- Validação:
  - aplicar validações determinísticas somente ao que for objetivamente comprovável pelo contrato;
  - separar explicitamente validação estrutural/factual de avaliação humana editorial e visual.
- Persistência:
  - reutilizar o agregado de materialização já existente se ele continuar adequado ao contrato v2;
  - não criar nova persistência sem gap real demonstrado e decisão no plano.
- Consumo:
  - renderer privado e read-only reproduz a LP a partir do estado materializado, sem reler fontes mutáveis para recompor a página.
- Fallback:
  - falha de autorização, contexto, provider, schema ou validação não materializa a candidata;
  - comportamento de nova tentativa humana e concorrência será fechado no contrato antes da v1.

### 2.2. Papel da IA

- Interpretar o conteúdo semântico do `modelContext` da E19.3 como um todo, sem tratar pesquisa e fatos concretos como fontes desconectadas.
- Sintetizar internamente o público efetivo da LP e manter toda a narrativa coerente com esse recorte.
- Identificar a oferta concreta, intenção comercial, estágio do funil e ação desejada.
- Escolher uma progressão persuasiva adequada ao caso, sem obrigação de reproduzir literalmente uma fórmula fixa.
- Planejar quantidade, sequência e função narrativa das seções dentro do conjunto estrutural permitido.
- Escolher layouts apenas entre alternativas expressamente suportadas pela fonte estrutural canônica.
- Produzir copy, headings, supporting copy, CTA textual, FAQs e demais conteúdos admitidos pela estrutura escolhida.
- Omitir conteúdo sem função comercial clara e repetir CTA ou argumento apenas quando houver função narrativa legítima.
- Usar somente fatos, pesquisa e evidências que estejam efetivamente autorizados no pacote; não inventar credenciais, resultados, depoimentos, garantias, escassez, preços, benefícios ou capacidades.
- Não usar `itemKey`, `priority`, `sortOrder` ou path/origem textual da pesquisa como regra de composição, allowlist editorial, selector de copy ou branching do prompt; a geração deve permanecer substituível por outra representação semanticamente equivalente da pesquisa.

### 2.3. Papel determinístico do LP Factory

- Autorizar ator, conta, membership e entitlement.
- Resolver e entregar o pacote E19.3 sem permitir consulta direta do modelo às fontes internas do projeto.
- Definir a fonte estrutural canônica finita de componentes, layouts, campos, cardinalidades, limites absolutos e interações suportadas.
- Derivar dessa fonte as projeções necessárias para IA, validator, materialização e renderer, sem registries estruturais paralelos.
- Manter valores brutos de `serverContext` fora da matéria-prima textual da IA e usá-los para destinos, URLs, assets, palette e demais valores operacionais conforme o contrato.
- Projetar ao modelo somente metadados seguros derivados de `serverContext` quando houver necessidade estrutural demonstrada e decisão explícita neste plano.
- Resolver bindings, consentimento, credenciais e referências técnicas.
- Validar schema, tipos, cardinalidades, limites, identidades, componentes e propriedades suportadas.
- Bloquear factualidade objetivamente inválida ou referência a evidência inexistente quando isso puder ser comprovado pelo contrato.
- Materializar de forma consistente, congelar snapshot suficiente e renderizar deterministicamente.
- Falhar fechado diante de versão, componente, layout ou payload não suportado.

### 2.4. Prompt e workflow de geração

- O runtime E19.4 é o workflow; o prompt é o contrato de inteligência da etapa geracional dentro desse workflow.
- O prompt deve ser derivado de `docs/template-prompts.md` e complementado por `docs/template-prompts-gpt-5-6.md` quando GPT-5.6 for aprovado para o workload.
- O prompt de produção deve ser versionado como código da aplicação, próximo da feature consumidora, sem engine genérica de prompts ou reusable prompt object sem necessidade material.
- Instruções estáveis da aplicação devem permanecer separadas do `input`/contexto dinâmico da E19.3; dados dinâmicos entram tipados ou validados e não podem substituir as instruções de maior autoridade.
- O prompt deve declarar somente instruções necessárias e não repetir o mesmo requisito em múltiplas formas.
- Deve informar resultado esperado, contexto autorizado, critérios de sucesso, limites, formato de saída, regras de parada e validação pertinente.
- Não pedir cadeia de raciocínio, `think step by step`, justificativa privada ou exposição de reasoning tokens.
- A candidata estruturada deve permitir verificar a entrega sem depender de acesso ao raciocínio interno do modelo.
- Structured Output ou schema aplicável deve ser usado quando o consumidor exigir contrato determinístico; validator e regras de negócio permanecem no código.
- Casos representativos estáveis devem permitir comparar mudanças de prompt, modelo e `reasoning.effort` sem trocar simultaneamente os critérios de qualidade.
- Endpoint, número de chamadas, `max_output_tokens`, timeout, retry, tools e demais parâmetros permanecem questões de v1/v2 a fechar a partir do workload real e da documentação OpenAI vigente.

### 2.5. Fonte estrutural canônica e projeções derivadas

- A nova E19.4 deve possuir uma única fonte canônica de estrutura, finita e versionada.
- Dessa fonte devem ser derivadas deterministicamente as projeções necessárias para Structured Output da IA, validação, estado materializado e renderer; essas projeções podem ter shapes físicos diferentes sem criar autoridades estruturais paralelas.
- Essa fonte substitui somente a função estrutural necessária que antes estava espalhada entre E18.5 e o runtime E19.4 antigo, sem reintroduzir E18.5 como autoridade editorial obrigatória.
- A IA pode escolher somente estruturas e layouts pertencentes a essa fonte.
- A fonte deve permitir variação suficiente para que LPs diferentes não sejam apenas a mesma sequência de cards com textos diferentes.
- Header e Footer devem ser representáveis no mesmo contrato e não tratados como markup arbitrário fora dele.
- O contrato não pode aceitar HTML/CSS/JS livre nem componente desconhecido.
- Tipos concretos de primitivas, layouts, cardinalidades, nesting e interações permanecem abertos no rascunho.

### 2.6. Jornada persuasiva

- A LP deve ser tratada como uma sequência comercial completa, não como preenchimento independente de blocos.
- O anúncio, busca, conteúdo ou outro canal anterior pode conquistar a atenção inicial; o Hero precisa revalidar essa atenção, confirmar relevância e gerar interesse.
- O corpo deve desenvolver entendimento, valor percebido, desejo e confiança e tratar objeções relevantes na ordem apropriada ao caso.
- A ação não precisa existir somente no final; CTA pode aparecer cedo e se repetir quando o estágio do funil e a narrativa justificarem.
- AIDA é referência útil para coerência persuasiva, mas não define quantidade fixa de seções ou posições obrigatórias.
- A sequência deve refletir o público efetivo, a oferta concreta e o estágio do funil presentes no pacote E19.3.

### 2.7. Factualidade, pesquisa e evidência

- Pesquisa de mercado fornece contexto, dores, desejos, objeções, linguagem e argumentos; não transforma automaticamente afirmações sobre o negócio em fatos concretos.
- Fato concreto aplicável e presente pode sustentar copy; fato declarado não se torna automaticamente prova verificada.
- Ausência de evidência concreta deve permanecer ausência; não inventar `evidence_id`, selo, testemunho ou marca de verificação.
- Claims de resultado, garantia, escassez, credencial verificada, prova social ou comparação objetiva só podem ser usados quando houver suporte real autorizado.
- A forma de referenciar quais itens de pesquisa/fatos sustentaram partes da candidata permanece questão aberta; não exigir cadeia de raciocínio nem provenance cognitiva.
- A factualidade e a qualidade da narrativa não podem depender da identidade `itemKey` ou de metadados internos da pesquisa; a autoridade factual continua sendo fatos/evidências autorizados e o conteúdo semântico efetivamente fornecido.

### 2.8. Materialização, snapshot e renderer

- Os artefatos SQL da materialização antiga foram preservados pelo PR #729 e devem ser avaliados antes de qualquer proposta de banco nova.
- O estado materializado deve ser suficiente para reproduzir a LP sem reler E19.3, E20.2, E10.8, E18.5 ou E20.3.
- O snapshot deve preservar somente o necessário para auditar e reproduzir a geração: identidades, versões, configuração do workload e contexto efetivamente exposto, sem raciocínio privado.
- O renderer deve consumir uma projeção derivada da mesma fonte estrutural canônica usada pelo Structured Output e validator, sem registry próprio paralelo.
- Aparência, Header, Footer, seções, layouts e conteúdo devem ser reproduzidos de forma determinística a partir do estado congelado.
- O detalhe exato de versão, shape e adaptação da materialização existente permanece aberto até a inspeção estrutural do novo contrato.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e validação integral da candidata

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: sim em princípio por decisão humana de participação central da IA; categoria final pendente da consulta obrigatória ao Gestor de Automação antes da v1.
- Objetivo:
  - transformar o pacote E19.3 em uma candidata completa da primeira LP real do Cenário D, com planejamento narrativo e copy produzidos por IA dentro da fonte estrutural canônica finita e validação determinística antes da persistência.
- Questões indispensáveis ainda abertas:
  - fonte estrutural canônica e suas projeções;
  - prompt canônico versionado;
  - número de chamadas/etapas;
  - modelo + effort formal;
  - Structured Output e schema;
  - factualidade/evidência;
  - casos representativos do workload;
  - critérios de aceite da candidata.

### 3.2. E19.4.4 — Materialização inicial e snapshot imutável

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: não, salvo nova decisão humana baseada em necessidade real.
- Objetivo:
  - persistir a primeira candidata integral válida em estado próprio e reproduzível, com snapshot coerente com o contrato v2 e sem dependência futura de fontes mutáveis.
- Questões indispensáveis ainda abertas:
  - adequação dos artefatos SQL preservados;
  - versão e shape do conteúdo materializado;
  - versão e shape do snapshot;
  - concorrência, nova tentativa e write-once da primeira prova.

### 3.3. E19.4.5 — Visualização privada e prova humana da primeira LP real

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: não.
- Objetivo:
  - renderizar privadamente a primeira LP materializada e produzir evidência humana suficiente para avaliar estrutura, narrativa, copy, factualidade, clareza comercial, acessibilidade e qualidade visual.
- Questões indispensáveis ainda abertas:
  - superfície/path real do preview privado;
  - contrato do renderer;
  - critérios visuais e responsivos finais;
  - checklist humano da primeira prova;
  - separação entre defeito bloqueante e melhoria editorial posterior.

### 3.4. Próxima ação do debate

- Inspecionar semanticamente os 59 itens `end_customer` entregues na prova real da E19.3 para confirmar quanto valor oferecem à construção de público, jornada persuasiva, objeções, argumentos e conversão.
- Em seguida, fechar progressivamente os Gates do prompt/workflow, fonte estrutural, factualidade/evidência, materialização/renderer e critérios de avaliação.
- Consultar o Gestor de Automação antes da consolidação da v1, conforme `docs/prompt-estrategista.md` e a governança de prompt vigente após o PR #730.
- Concluir primeiro a E19.4 D funcional; depois abrir/reformular o recorte E19.5 Light mínimo antes da otimização intensiva e das iterações comparáveis D1/D2/D3.
- Preservar o Cenário E apenas como experimento posterior à E19.5 Light, sem bloquear a entrega funcional do D.
- Não atualizar `docs/roadmap.md` enquanto este arquivo permanecer rascunho vivo; a atualização planejada do roadmap ocorre após a consolidação da v1 conforme o fluxo canônico.
- Não iniciar implementação antes da v1 e dos gates subsequentes do processo escolhido.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4 neste momento

- Publicação pública, domínio customizado e disponibilidade comercial.
- Tracking, analytics, CRM, Ads, A/B test e engine de experimentos.
- Implementação da E19.5 Light ou do workspace amplo do PR #726 dentro deste recorte; a E19.5 Light é sucessora planejada, não fase da E19.4.
- Editor visual, edição manual ampla, histórico e rollback.
- Consulta direta da IA a E10.8, E18.4, E20.2, E18.5 ou E20.3.
- Reintrodução de E18.5 ou E20.3 como gate obrigatório da geração.
- Acoplamento da E19.4 a `itemKey`, `priority`, `sortOrder`, Markdown ou representação interna específica da pesquisa.
- HTML, CSS, React, JavaScript, scripts ou componentes arbitrários gerados pela IA.
- Agents SDK, multi-agent, job, fila, cron, webhook, browsing ou tools externas sem necessidade real demonstrada e nova decisão humana.
- Novo banco, tabela, migration, rota, serviço, engine ou infraestrutura antes de demonstrar gap real nas estruturas preservadas do projeto.
- Perfil persistido novo de público, persona ou estratégia apenas para facilitar o prompt.

### 4.2. Critérios de parada imediata

- Parar e voltar ao debate humano se o pacote E19.3 demonstrar faltar informação indispensável para o modelo sem que exista fonte canônica autorizada.
- Parar se a solução exigir mapa nominal crescente de nichos, fields ou componentes específico para corretor de imóveis dentro da E19.4.
- Parar se o contrato estrutural crescer principalmente por extensibilidade hipotética sem consumidor real na primeira LP.
- Parar se a IA precisar inventar facts, evidências, credenciais, destinos ou capacidades para completar a candidata.
- Parar se a materialização só puder reproduzir a LP relendo fontes mutáveis e alterando silenciosamente conteúdo ou aparência.
- Parar se surgir necessidade de agente, automação adicional, engine ou infraestrutura não sustentada por fonte real do projeto.
- Toda mudança material de escopo ou de categoria de automação volta ao humano antes de consolidar a v1.

### 4.3. Critério provisório de conclusão do recorte

- A E19.4 deverá ser considerada funcionalmente concluída quando uma LP real do fluxo oficial:
  - for gerada a partir do pacote E19.3 do Cenário D;
  - apresentar jornada comercial coerente e avaliável do interesse à ação;
  - respeitar fatos, limites e evidências autorizados;
  - for materializada integralmente em `draft`;
  - for reproduzida privadamente por renderer determinístico;
  - puder ser avaliada humanamente como uma landing page real quanto a narrativa, copy, estrutura, responsividade, acessibilidade e qualidade visual.
- A conclusão funcional da E19.4 não exige que prompt, modelo, effort, composição narrativa ou visual estejam editorialmente estabilizados; essas iterações poderão prosseguir após a E19.5 Light por meio de novos drafts preservados.
- Este critério ainda é provisório enquanto o rascunho não virar plano-base v1.

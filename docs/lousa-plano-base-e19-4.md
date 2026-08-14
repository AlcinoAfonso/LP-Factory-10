14/08/2026 — Rascunho vivo — E19.4 — Primeira LP real do Cenário E

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo do futuro plano-base v1; ainda não consolidado nem executável.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Path canônico: `docs/lousa-plano-base-e19-4.md`.
- Processo: `docs/prompt-estrategista.md` v29.
- Plano conceitual: `docs/lp-planejamento.md`.
- Base de abertura do PR #731: `main` após o merge do PR #729, commit `40baacbc516a80c2600408a9be63bfa33793ca85`.
- O plano-base v2 anterior permanece somente no histórico Git como desenho superado dependente do contrato E19.3 `partA + partB`.
- Decisão humana de 14/08/2026: o Cenário E é a única direção ativa para a primeira geração real; o Cenário D deixa de ser alternativa em desenvolvimento ou comparação obrigatória.
- A branch `strategy/e19-4-cenario-d` conserva apenas o nome histórico de abertura do PR #731.
- A arquitetura lógica útil da E19.3 permanece `identities + modelContext + serverContext`; sua reformulação pertence a `docs/lousa-plano-base-e19-3.md`.
- A Preparação do taxon foi separada em dois recortes próprios anteriores à E19.3; a E19.4 apenas exige taxon previamente preparado e pacote E19.3 válido.
- Nenhuma implementação da nova E19.4 foi iniciada neste debate.

### 1.2. Objetivo e resultado esperado

- Produzir e avaliar a primeira landing page real do Cenário E a partir do pacote autorizado da E19.3.
- Dar à IA liberdade controlada para transformar contexto autorizado em jornada comercial coerente, sem delegar segurança, autorização, verdade factual, bindings operacionais, persistência ou renderer.
- Gerar candidata estruturalmente válida, materializá-la no `draft` real existente e disponibilizar preview privado e read-only para avaliação humana.
- Incluir na primeira prova LP completa e reconhecível como página comercial real, com Header, corpo, CTA(s), Footer, estrutura visual e conteúdo coerentes.
- Encerrar a E19.4 quando o fluxo estiver funcional de ponta a ponta e a LP puder ser aberta no navegador e avaliada de forma real; otimização editorial intensiva poderá continuar depois da E19.5 Light por novos drafts independentes.

### 1.3. Decisões aceitas no debate até aqui

- A hierarquia de autoridade é: fatos concretos E19.2/E20.2 definem a realidade da conta, oferta e LP; pesquisa integral fornece contexto consultivo; E18.4 fornece limites universais; E19.3 autoriza, organiza e transporta; E19.4 decide narrativa, estrutura, copy e candidata.
- A pesquisa nunca pode ampliar ou contradizer a oferta concreta; em conflito, a configuração concreta prevalece.
- Não haverá camada intermediária que resuma, atomize ou selecione semanticamente pesquisa + fatos antes da E19.4.
- `business_buyer` não é requisito da geração da LP `end_customer`; E10.8 pode permanecer para consumidores independentes, mas fica fora do caminho E19.3 → E19.4.
- A E19.4 consome diretamente `identities + modelContext + serverContext` da E19.3 e não conhece path, representação interna ou lifecycle da pesquisa integral.
- A IA sintetiza o público efetivo a partir da pesquisa `end_customer` e dos fatos concretos, sem criar perfil persistido novo.
- A LP deve possuir começo, desenvolvimento e conversão; AIDA pode servir como referência persuasiva, não como schema rígido.
- A IA pode decidir quantidade de seções, sequência, função narrativa, copy, CTA textual, omissões, repetições legítimas e layout entre opções suportadas pelo contrato estrutural.
- O sistema permanece responsável por autorização, fatos e evidências disponíveis, tipos estruturais, limites absolutos, bindings, destinos, consentimento, credenciais, segurança tenant-aware, schema, materialização, snapshot, versões e renderer.
- A IA não gera HTML, CSS, React, JavaScript, scripts, componentes desconhecidos, credenciais, webhooks ou estruturas fora do contrato suportado.
- Header e Footer pertencem ao contrato da primeira LP real.
- A E19.4 deve usar uma única fonte canônica de estrutura, da qual sejam derivadas as projeções necessárias para Structured Output, validação, materialização e renderer.
- O prompt de runtime será tratado como código versionado da feature, separado do contexto dinâmico validado da E19.3.
- Alterações de prompt, modelo ou `reasoning.effort` serão avaliadas com casos representativos e critérios estáveis; a combinação final permanece em aberto conforme `docs/openai-model-snapshot.md`.
- O prompt seguirá abordagem `outcome-first`, sem pedir cadeia de raciocínio privada.
- A fase geracional terá participação de IA; a categoria final deve ser reconciliada com o Gestor de Automação antes da consolidação da v1.

### 1.4. Fontes obrigatórias do novo debate

- `README.md`.
- `docs/prompt-estrategista.md`.
- `docs/template-roadmap.md`.
- `docs/roadmap.md`.
- `docs/lp-planejamento.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `docs/lousa-plano-base-e19-3.md` como contrato da única entrada de domínio da E19.4.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e18-4.md`.
- `docs/template-prompts.md`.
- `docs/template-prompts-gpt-5-6.md`.
- `docs/openai-model-snapshot.md`.
- `docs/gestor-automations.md` e `docs/automations.md`.
- PR #726 e `docs/lousa-plano-base-e19-5.md` somente como fonte conceitual da sucessora E19.5 Light.
- Artefatos SQL da materialização E19.4 preservados pelo PR #729, somente como fonte real já existente para o debate de persistência.

### 1.5. Questões ainda abertas e não decididas

- Se a geração ocorre em uma única chamada que planeja e escreve a LP ou em mais de uma etapa/chamada controlada, sem transformar o fluxo em agente.
- Qual é o menor conjunto de primitivas, layouts, cardinalidades e interações necessário para materializar e renderizar a primeira LP real sem HTML/CSS/JS livre.
- Se algum metadata mínimo e seguro derivado de `identities` ou `serverContext` precisa ser projetado ao modelo para decisão estrutural.
- Como representar no Structured Output planejamento narrativo e conteúdo final sem criar segundo DTO de domínio ou registry paralelo ao renderer.
- Quais referências de pesquisa/fatos a candidata deve devolver para permitir validação sem exigir provenance cognitiva ou cadeia de raciocínio.
- Quais claims podem ser validados objetivamente, quais dependem de evidência concreta e quais só podem ser avaliados humanamente.
- Qual combinação `modelo + reasoning effort` cumpre os gates com menor complexidade, custo e latência.
- Como adaptar o snapshot da materialização para registrar workload e contexto efetivamente exposto sem armazenar raciocínio privado.
- Qual superfície real disponibilizará o preview privado da primeira LP.
- Quais critérios objetivos e humanos definirão que a primeira LP é funcional e suficientemente avaliável para encerrar a E19.4.

### 1.6. Direção aprovada — E → E19.5 Light → iterações

- Prosseguir somente com o Cenário E até existir E19.4 funcional ponta a ponta: taxon preparado + LP concreta configurada → E19.3 válida → geração por IA → candidata estruturada → validação → materialização → renderer → preview privado.
- Não implementar E19.4 D antes de E e não manter D como comparação obrigatória.
- Antes da E19.4, concluir a E19.3 do Cenário E e sua prova read-only; não criar camada de inteligência intermediária.
- Após a E19.4 funcional, E19.5 Light deverá permitir novos `drafts` independentes E1/E2/E3, sem overwrite e sem conhecer a representação interna da pesquisa.
- O contrato detalhado da E19.5 Light pertence ao documento e ao debate próprios.

## 2. Contrato do caso

### 2.1. Fluxo lógico em construção

- Gatilho:
  - ação humana explícita na jornada operacional da conta inicia a geração da LP completa;
  - papéis, entitlement e superfície exatos serão confirmados contra o runtime vigente antes da v1.
- Entrada:
  - LP legítima em `draft` e configuração E19.2 completa nos fields aplicáveis da E20.2;
  - taxon previamente preparado pelos recortes responsáveis;
  - sucesso integral da E19.3 do Cenário E;
  - configuração OpenAI autorizada para o workload E19.4.
- Processamento:
  - revalidar autorização antes do provider;
  - obter o pacote E19.3 sem reler diretamente as fontes internas do projeto;
  - construir a requisição a partir do prompt canônico versionado e do contexto autorizado;
  - permitir que a IA sintetize público efetivo, oferta, estágio de funil, intenção de conversão e jornada persuasiva, respeitando a precedência dos fatos concretos;
  - produzir candidata completa dentro da fonte estrutural canônica mínima;
  - combinar deterministicamente destinos, bindings, assets e demais valores server-side;
  - validar integralmente a candidata antes de materialização.
- Validação:
  - aplicar validações determinísticas somente ao que for objetivamente comprovável;
  - separar validação estrutural/factual de avaliação humana editorial e visual.
- Persistência:
  - reutilizar o agregado de materialização já existente se continuar adequado;
  - não criar nova persistência sem gap real demonstrado.
- Consumo:
  - renderer privado e read-only reproduz a LP a partir do estado materializado, sem reler fontes mutáveis.
- Fallback:
  - falha de autorização, contexto, provider, schema ou validação não materializa candidata.

### 2.2. Papel da IA

- Interpretar o `modelContext` da E19.3 como um todo, preservando a distinção de autoridade entre pesquisa e fatos concretos.
- Sintetizar público efetivo e manter a narrativa coerente com esse recorte.
- Identificar oferta, intenção comercial, estágio do funil e ação desejada.
- Escolher progressão persuasiva adequada ao caso, sem fórmula fixa obrigatória.
- Planejar quantidade, sequência e função narrativa das seções dentro do conjunto estrutural permitido.
- Escolher layouts somente entre alternativas suportadas.
- Produzir copy, headings, supporting copy, CTA textual, FAQs e demais conteúdos admitidos.
- Omitir conteúdo sem função comercial clara e repetir CTA/argumento apenas quando houver função legítima.
- Usar somente fatos, pesquisa e evidências autorizados; não inventar credenciais, resultados, depoimentos, garantias, escassez, preços, benefícios ou capacidades.
- Não usar metadados da antiga pesquisa estruturada como regra de composição.

### 2.3. Papel determinístico do LP Factory

- Autorizar ator, conta, membership e entitlement.
- Resolver e entregar o pacote E19.3 sem consulta direta do modelo às fontes internas.
- Definir o menor contrato estrutural finito e derivar dele projeções para IA, validator, materialização e renderer.
- Manter valores brutos de `serverContext` fora da matéria-prima textual e usá-los deterministicamente.
- Resolver bindings, consentimento, credenciais e referências técnicas.
- Validar schema, tipos, cardinalidades, limites, identidades, componentes e propriedades suportadas.
- Bloquear factualidade objetivamente inválida ou referência a evidência inexistente quando comprovável.
- Materializar consistentemente, congelar snapshot suficiente e renderizar deterministicamente.
- Falhar fechado diante de versão, componente, layout ou payload não suportado.

### 2.4. Prompt e workflow de geração

- O runtime E19.4 é o workflow; o prompt é o contrato de inteligência da etapa geracional.
- O prompt será derivado de `docs/template-prompts.md` e complementado por `docs/template-prompts-gpt-5-6.md` se GPT-5.6 for aprovado.
- O prompt de produção será versionado como código próximo da feature consumidora, sem engine genérica de prompts.
- Instruções estáveis permanecem separadas do contexto dinâmico validado.
- O prompt declarará resultado, contexto autorizado, critérios de sucesso, limites, formato de saída, parada e validação pertinente, sem cadeia de raciocínio privada.
- Structured Output será usado quando o consumidor exigir contrato determinístico; validator e regras de negócio permanecem no código.
- Casos representativos estáveis permitirão comparar prompt, modelo e `reasoning.effort`.
- Endpoint, número de chamadas, tokens, timeout, retry e tools permanecem questões do workload real.

### 2.5. Fonte estrutural canônica e projeções derivadas

- A E19.4 possuirá uma única fonte canônica de estrutura, finita e versionada, para controlar a forma da candidata.
- A primeira versão conterá somente primitivas, layouts, fields, cardinalidades e interações necessárias à primeira LP real.
- Novas capacidades entram apenas quando caso concreto demonstrar necessidade.
- Structured Output, validação, estado materializado e renderer serão projeções derivadas dessa mesma autoridade estrutural.
- A IA pode escolher somente estruturas/layouts pertencentes à fonte vigente.
- Header e Footer devem ser representáveis no mesmo contrato.
- O contrato não aceita HTML/CSS/JS livre nem componente desconhecido.

### 2.6. Jornada persuasiva

- A LP é sequência comercial completa, não preenchimento independente de blocos.
- O Hero revalida atenção, confirma relevância e gera interesse.
- O corpo desenvolve entendimento, valor percebido, desejo, confiança e tratamento de objeções.
- CTA pode aparecer cedo e se repetir quando estágio de funil e narrativa justificarem.
- AIDA é referência útil, não define quantidade fixa de seções ou posições obrigatórias.
- A sequência reflete público efetivo, oferta concreta e estágio do funil presentes no pacote E19.3.

### 2.7. Factualidade, pesquisa e evidência

- A configuração E19.2/E20.2 define a realidade concreta; a pesquisa fornece contexto externo e não pode ampliar capacidades ou oferta.
- Fato concreto presente pode sustentar copy; fato declarado não se torna automaticamente prova verificada.
- Ausência de evidência permanece ausência.
- Claims de resultado, garantia, escassez, credencial verificada, prova social ou comparação objetiva só entram com suporte real autorizado.
- Pesquisa pode fornecer fatos externos legítimos e atuais, preservando fontes, limitações e natureza.
- A forma de referenciar pesquisa/fatos na candidata permanece aberta, sem exigir cadeia de raciocínio.
- Factualidade e qualidade narrativa não dependem da antiga representação atomizada.

### 2.8. Materialização, snapshot e renderer

- Os artefatos SQL da materialização antiga preservados pelo PR #729 devem ser avaliados antes de proposta de banco nova.
- O estado materializado deve reproduzir a LP sem reler E19.3 ou suas fontes.
- O snapshot preserva somente o necessário para auditar/reproduzir a geração: identidades, versões, configuração do workload e contexto exposto, sem raciocínio privado.
- O renderer consome projeção derivada da mesma fonte estrutural canônica usada pelo Structured Output e validator.
- Aparência, Header, Footer, seções, layouts e conteúdo são reproduzidos deterministicamente a partir do estado congelado.
- Versão/shape exatos da materialização permanecem abertos até a inspeção do contrato mínimo.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e validação integral da candidata

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: sim em princípio pela participação central da IA; categoria final pendente da consulta obrigatória ao Gestor de Automação antes da v1.
- Objetivo:
  - transformar o pacote E19.3 em candidata completa da primeira LP real, com planejamento narrativo e copy por IA dentro do contrato estrutural mínimo e validação determinística antes da persistência.
- Dependências anteriores à execução:
  - taxon preparado pelos recortes responsáveis;
  - E19.3 do Cenário E implementada e aprovada em prova read-only;
  - configuração E19.2 completa conforme E20.2.
- Questões indispensáveis ainda abertas:
  - contrato estrutural mínimo e projeções;
  - prompt canônico;
  - número de chamadas/etapas;
  - `modelo + reasoning effort`;
  - Structured Output/schema;
  - factualidade/evidência;
  - casos representativos;
  - critérios de aceite da candidata.

### 3.2. E19.4.4 — Materialização inicial e snapshot imutável

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: não, salvo nova decisão humana baseada em necessidade real.
- Objetivo:
  - persistir a primeira candidata integral válida em estado próprio e reproduzível, com snapshot coerente com o Cenário E.
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
  - critérios visuais/responsivos finais;
  - checklist humano;
  - separação entre defeito bloqueante e melhoria editorial posterior.

### 3.4. Próxima ação do debate

- A Preparação do taxon está delegada aos dois recortes próprios e não é detalhada neste plano.
- O próximo passo material anterior à E19.4 é concluir e provar a E19.3 do Cenário E.
- Depois da prova E19.3, retornar diretamente aos Gates internos da E19.4: prompt/workflow, contrato estrutural mínimo, factualidade/evidência, modelo/effort, materialização/snapshot, renderer e avaliação humana.
- Quando a LP gerada não atingir qualidade desejada, diagnosticar nesta ordem: E19.4; pesquisa; E20.2 quando surgir dado factual necessário não previsto; E19.3 somente diante de gap real de autorização, identidade, separação ou transporte.
- Não atualizar `docs/roadmap.md` enquanto este arquivo permanecer rascunho vivo.
- Não iniciar implementação da E19.4 antes da prova E19.3 e da consolidação da v1 deste plano.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4 neste momento

- preparação do taxon, incluindo sua pesquisa selecionada, avaliação E20.2, persistência e aprovação;
- implementação técnica da E19.3;
- publicação pública, domínio customizado e disponibilidade comercial;
- tracking, analytics, CRM, Ads, A/B test e engine de experimentos;
- detalhamento/implementação da E19.5 Light dentro deste recorte;
- editor visual, edição manual ampla, histórico e rollback;
- implementação E19.4 D ou comparação D × E como requisito;
- consulta direta da IA às fontes internas do projeto fora do pacote E19.3;
- reintrodução de E18.5, E20.3 ou E10.8 como gate da geração;
- camada intermediária de resumo, atomização ou seleção semântica;
- HTML, CSS, React, JavaScript, scripts ou componentes arbitrários gerados pela IA;
- catálogo estrutural amplo antecipado ou reconstrução da antiga E18.5;
- Agents SDK, multi-agent, job, fila, cron, webhook, browsing ou tools externas sem necessidade real;
- nova tabela, serviço, engine ou infraestrutura sem gap real demonstrado;
- perfil persistido novo de público/persona/estratégia apenas para facilitar prompt.

### 4.2. Critérios de parada imediata

- Parar e voltar ao debate humano se o pacote E19.3 faltar informação indispensável sem fonte canônica autorizada.
- Parar se a solução tentar compensar pesquisa insuficiente com atomização, ranking, RAG, chunking, allowlist ou seleção semântica sem evidência.
- Parar se a solução exigir mapa nominal crescente de nichos, fields ou componentes dentro da E19.4.
- Parar se o contrato estrutural crescer principalmente por extensibilidade hipotética.
- Parar se a IA precisar inventar facts, evidências, credenciais, destinos ou capacidades.
- Parar se a materialização só puder reproduzir a LP relendo fontes mutáveis.
- Parar se surgir necessidade de agente, automação adicional, engine ou infraestrutura não sustentada por fonte real.
- Toda mudança material de escopo ou categoria de automação volta ao humano antes da v1.

### 4.3. Critério provisório de conclusão do recorte

- A E19.4 deverá ser considerada funcionalmente concluída quando uma LP real do fluxo oficial:
  - for gerada a partir do pacote autorizado E19.3;
  - apresentar jornada comercial coerente e avaliável do interesse à ação;
  - respeitar autoridade dos fatos concretos, pesquisa, limites e evidências autorizadas;
  - for materializada integralmente em `draft`;
  - for reproduzida privadamente por renderer determinístico;
  - puder ser avaliada humanamente como landing page real quanto a narrativa, copy, estrutura, responsividade, acessibilidade e qualidade visual.
- A conclusão funcional não exige estabilização editorial completa de prompt, modelo, effort, narrativa ou visual; iterações poderão continuar após a E19.5 Light por novos drafts preservados.
- Este critério permanece provisório enquanto o rascunho não virar plano-base v1.
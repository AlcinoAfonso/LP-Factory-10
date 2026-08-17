14/08/2026 — Rascunho vivo — E19.4 — Primeira LP real do Cenário E

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo do futuro plano-base v1; ainda não consolidado nem executável.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Path canônico: `docs/lousa-plano-base-e19-4.md`.
- Processo: `docs/prompt-estrategista.md` v31.
- Plano conceitual: `docs/lp-planejamento.md`.
- Base histórica de abertura do PR #731: `main` após o merge do PR #729, commit `40baacbc516a80c2600408a9be63bfa33793ca85`.
- Atualização do debate: 17/08/2026, já sobre a `main` posterior ao merge do PR #757.
- O plano-base v2 anterior permanece somente no histórico Git como desenho superado dependente do contrato E19.3 `partA + partB`.
- Decisão humana de 14/08/2026: o Cenário E é a única direção ativa para a primeira geração real; o Cenário D deixa de ser alternativa em desenvolvimento ou comparação obrigatória.
- A branch `strategy/e19-4-cenario-d` conserva apenas o nome histórico de abertura do PR #731.
- A E19.3 do Cenário E foi concluída no contrato v3 e mergeada pelo PR #757; a E19.4 consome `identities + modelContext + serverContext` como boundary já provado.
- A Preparação do taxon foi separada em dois recortes próprios anteriores à E19.3; a E19.4 apenas exige taxon previamente preparado e pacote E19.3 válido.
- Nenhuma implementação da nova E19.4 foi iniciada neste debate.

### 1.2. Objetivo e resultado esperado

- Produzir e avaliar a primeira landing page real do Cenário E a partir do pacote autorizado da E19.3.
- Dar à IA liberdade controlada para transformar contexto autorizado em jornada comercial coerente, sem delegar segurança, autorização, verdade factual, bindings operacionais, persistência ou renderer.
- Gerar candidata estruturalmente válida, materializá-la no `draft` real existente e disponibilizar preview privado e read-only para avaliação humana.
- Incluir na primeira prova LP completa e reconhecível como página comercial real, com Header, corpo, CTA(s), Footer, estrutura visual, conteúdo coerente e pelo menos uma imagem principal pertinente à narrativa.
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
- Header e Footer pertencem ao mesmo contrato estrutural da candidata; não haverá shell estrutural paralelo.
- A E19.4 deve usar uma única fonte canônica de estrutura, da qual sejam derivadas as projeções necessárias para Structured Output, validação, materialização e renderer.
- A simplicidade do MVP limita a amplitude do repertório, não a qualidade visual: o primeiro repertório deve ser curado e pequeno o suficiente para ser confiável, mas bom o suficiente para produzir LP competitiva e capaz de encantar mesmo no plano inicial.
- A primeira LP real não deve abrir mão de imagem: a autoridade estrutural deve admitir pelo menos um visual principal e não deve impor artificialmente que toda LP use exatamente uma única imagem; cardinalidades adicionais só serão abertas quando qualidade e performance justificarem.
- `brand_logo_asset` permanece semanticamente exclusivo para logo. A imagem gerada pela própria E19.4 é saída do workload, não entrada E20.2; portanto, este teste não exige novo field E20.2 apenas para acomodar mídia gerada.
- Na primeira prova, se não existir asset autorizado e adequado do cliente disponível no fluxo vigente, a E19.4 está autorizada a gerar a imagem necessária por IA antes da materialização.
- A mídia efetivamente usada precisa possuir referência canônica persistente antes do congelamento da materialização; o projeto ainda não possui Storage/bucket/Blob/URL canônicos para assets, portanto o mecanismo mínimo de persistência de mídia é gap técnico real a fechar neste recorte antes da execução.
- Performance de carregamento é requisito da primeira solução de mídia; o desenho não pode tratar imagem pesada ou não otimizada como detalhe posterior, embora formato, compressão, dimensões, cache/CDN e orçamento exato de peso permaneçam para a v2.
- O ponto de congelamento vigente é a materialização write-once, não publicação: tentativas anteriores podem ser descartadas; após materializar uma candidata válida, imagem, copy ou estrutura daquela versão não são sobrescritas e uma nova versão preservada deve usar novo draft, coerente com a direção E19.5 Light.
- O prompt de runtime será tratado como código versionado da feature, separado do contexto dinâmico validado da E19.3.
- Baseline humano inicial para a primeira prova: `gpt-5.6-luna` com `reasoning.effort=max`, via Responses API e Structured Outputs; essa combinação é ponto de partida deliberado para medir qualidade e custo, não combinação declarada vencedora.
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK e multi-agent permanecem capacidades futuras condicionais e não entram automaticamente neste recorte.
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

- Se a primeira geração textual será fixada em uma única chamada por tentativa que planeja e escreve a LP ou se surgirá risco concreto que justifique mais de uma etapa/chamada controlada, sem transformar o fluxo em agente.
- Qual é o menor repertório de primitivas, layouts, cardinalidades e interações que oferece liberdade de composição suficiente e qualidade visual competitiva para a primeira LP real.
- Quais layouts e cardinalidades exatas de imagem a primeira autoridade estrutural admite além do visual principal obrigatório.
- Qual é o menor mecanismo real de persistência e entrega da mídia gerada antes da materialização, verificando primeiro se Supabase Storage atende o recorte sem criar complexidade ou infra paralela; a tecnologia ainda não está decidida.
- Como registrar origem e referência da imagem gerada no estado materializado/snapshot sem armazenar raciocínio privado nem payload desnecessário.
- Quais limites de peso, dimensões, formatos, otimização e cache/CDN serão exigidos para preservar carregamento rápido.
- Se algum metadata mínimo e seguro derivado de `identities` ou `serverContext` precisa ser projetado ao modelo para decisão estrutural.
- Como representar no Structured Output planejamento narrativo e conteúdo final sem criar segundo DTO de domínio ou registry paralelo ao renderer.
- Quais referências de pesquisa/fatos a candidata deve devolver para permitir validação sem exigir provenance cognitiva ou cadeia de raciocínio.
- Quais claims podem ser validados objetivamente, quais dependem de evidência concreta e quais só podem ser avaliados humanamente.
- Quais métricas e casos representativos permitirão comparar posteriormente qualidade, custo, latência e consumo do baseline `gpt-5.6-luna + max` com outras combinações.
- Como adaptar o snapshot da materialização para registrar workload e contexto efetivamente exposto sem armazenar raciocínio privado.
- Se a rota histórica privada de preview será reutilizada sem mudança material de contrato.
- Quais critérios objetivos e humanos definirão que a primeira LP é funcional e suficientemente avaliável para encerrar a E19.4.
- Qual parte da futura diferenciação de capacidades por plano precisa apenas ser preservada como direção de produto, sem virar escopo da primeira materialização.

### 1.6. Direção aprovada — E → E19.5 Light → iterações

- Prosseguir somente com o Cenário E até existir E19.4 funcional ponta a ponta: taxon preparado + LP concreta configurada → E19.3 válida → geração por IA → candidata estruturada → geração/resolução de mídia necessária → validação → materialização → renderer → preview privado.
- Não implementar E19.4 D antes de E e não manter D como comparação obrigatória.
- A E19.3 do Cenário E já foi concluída e provada; a E19.4 deve consumir seu contrato v3 sem reabrir inteligência intermediária.
- Após a E19.4 funcional, E19.5 Light deverá permitir novos `drafts` independentes E1/E2/E3, sem overwrite e sem conhecer a representação interna da pesquisa.
- O contrato detalhado da E19.5 Light pertence ao documento e ao debate próprios.

### 1.7. Matriz do debate — decisões, hipóteses e preservação de substância

| Tema | Registro do debate | Estado | Aplicação neste recorte | Destino / preservação |
|---|---|---|---|---|
| Autoridade estrutural única | Header, Footer, seções, layouts, campos e interações pertencem à mesma autoridade; Structured Output, validator, materialização e renderer derivam dela. | Decisão aceita | Sim | Fechar contrato mínimo na v1/v2 sem segunda fonte paralela. |
| Renderer × capacidade autorizada | O renderer transforma o estado estruturado em página visual; o “cardápio” de estruturas permitidas pertence à capacidade estrutural/autorização de produto, não a regra comercial escondida dentro do renderer. | Direção convergente | Sim, como separação de responsabilidades | Não criar lógica comercial duplicada no renderer. |
| Qualidade do plano inicial | Plano inicial pode ter repertório menor, mas não qualidade visual inferior; poucas opções devem ser excelentes. | Decisão humana de produto | Sim | Usar como critério do primeiro repertório e do gate visual humano. |
| Capacidade disponível ≠ composição usada | A autoridade pode oferecer mais estruturas/layouts do que a IA utiliza em uma LP; a IA escolhe apenas o subconjunto necessário à narrativa. | Direção convergente | Sim | Não obrigar uso de todas as capacidades disponíveis. |
| Contexto entregue ao modelo | A chamada geracional deve usar instruções estáveis + `modelContext` da E19.3 + autoridade estrutural. O `serverContext` bruto permanece fora da matéria-prima textual; metadata segura de `identities`/`serverContext` só deve ser projetada quando houver necessidade concreta. | Estrategista + Analista convergentes; coerente com o boundary E19.3 | Sim | Fechar o princípio na v1; projeções exatas ficam para a v2. |
| Logo | O E20.2 v2 já possui `brand_logo_asset` opcional como `asset_reference`; o field permanece exclusivo para logo e sua ausência não impede completude. | Fato confirmado + decisão humana de semântica | Sim quando houver logo autorizada | Não reutilizar esse field como contêiner genérico de imagens. |
| Imagem na primeira LP | A primeira LP real deve conter pelo menos um visual principal pertinente; a autoridade estrutural não deve limitar artificialmente toda LP a exatamente uma imagem. | Decisão humana | Sim | Fechar layouts e cardinalidades exatos na v2, preservando qualidade e performance. |
| E20.2 × imagem gerada | Imagem criada pela própria E19.4 é saída do workload e não valor fornecido/confirmado antes da geração; portanto não exige novo field E20.2 para o primeiro teste. | Correção do Estrategista confirmada contra contrato E20.2 | Sim | Novo field E20.2 só será avaliado quando existir fluxo real em que cliente forneça/selecione imagem como entrada. |
| Fonte/fallback da imagem | Na ausência de asset autorizado e adequado do cliente no fluxo vigente, a E19.4 está autorizada a gerar por IA a imagem necessária para a primeira LP. | Decisão humana | Sim | Tratar como etapa controlada de mídia; não como segunda chamada textual de planejamento/redação. |
| Persistência da mídia | A imagem usada precisa ser persistida/referenciada canonicamente antes da materialização; hoje não existe Storage/bucket/Blob/URL canônico de assets no projeto. | Gap técnico real confirmado | Sim, Gate técnico | Avaliar primeiro Supabase Storage como candidato coerente com a stack; não fixar plataforma, bucket, tabela ou nova infra antes do fechamento v1/v2. |
| Performance de mídia | A solução de imagem não pode degradar carregamento da LP; peso, dimensões, formato, otimização e cache/CDN fazem parte do contrato técnico de qualidade. | Requisito humano de produto | Sim | Fechar princípio na v1 e limites/implementação na v2. |
| Uma chamada OpenAI principal | Menor desenho proposto: uma chamada textual por tentativa para estrutura + narrativa + copy, seguida de validação determinística. A operação de imagem é etapa separada de mídia, não decomposição da inteligência em “planejar + escrever”. | Estrategista + Analista convergentes; decisão humana final da chamada textual ainda pendente | Pretendido | Duas chamadas textuais só retornam se caso representativo demonstrar deficiência concreta. |
| Repertório estrutural de apresentação | Evitar reconstruir o antigo cardápio narrativo (`problem_solution`, `offer`, `benefits`, `social_proof`, `comparison`). A direção é trabalhar com formas visuais genéricas; proposta inicial: Header, Hero visual, texto+mídia, cards/grid, steps, FAQ, CTA e Footer, com sequência livre no corpo. | Estrategista + Analista convergentes; famílias ainda precisam de confirmação humana | Sim | Fechar famílias conceituais na v1; fields, layouts e cardinalidades exatos ficam para a v2. |
| Structured Output da candidata | Usar um único DTO de candidata estruturada; não criar `narrativePlan` separado, justificativa de composição ou pedido de raciocínio privado. | Direção convergente | Sim | Fechar princípio na v1; schema exato na v2. |
| Baseline de IA | `gpt-5.6-luna + reasoning.effort=max`, Responses API e Structured Outputs como ponto inicial deliberado. | Decisão humana | Sim | Medir qualidade, custo, tokens/reasoning tokens e latência; não tratar como combinação vencedora definitiva. |
| Claims e factualidade | Validar deterministicamente apenas o comprovável; proibir no prompt claims sem suporte e usar gate humano quando linguagem livre não puder ser provada por regra confiável. | Direção convergente | Sim | Não criar segunda engine semântica para fiscalizar toda frase. |
| Rubrica humana de qualidade | O Analista propõe avaliação estável de 0–10 por dimensão: adequação ao público/oferta, jornada persuasiva, especificidade/qualidade da copy, estrutura/hierarquia visual, qualidade/pertinência da imagem e clareza da conversão/CTA. Factualidade, segurança e funcionamento permanecem gates binários. | Proposta do Analista; Estrategista recomenda; decisão humana pendente | Pretendido | Fechar metodologia da prova na v1; mecanismo de registro pode ser detalhado na v2. |
| Piso numérico de qualidade | O Analista sugeriu `6/10` como piso provisório para considerar a arquitetura aproveitável e `7+` como sinal para iniciar otimização de custo/modelo. | Hipótese do Analista; não aprovada | Não enquanto não houver decisão humana | Não usar como Gate nem critério de conclusão até aprovação explícita e definição de como agregar as dimensões. |
| Benchmark e auditabilidade | Cada prova deve permitir relacionar qualidade à configuração usada: `promptVersion`, versão da autoridade/schema estrutural, modelo, effort, input/cached/output/reasoning tokens, latência, custo e notas humanas. | Direção convergente; compatível com `openai-model-snapshot` | Sim como critério | Fechar o que precisa ser observável na v1; mecanismo/shape exatos do registro e snapshot ficam para a v2. |
| Materialização | `account_landing_page_materializations` já é 1:1, write-once, com `content_json` + `generation_context_snapshot_json`, sem UPDATE/DELETE; a candidata validada deve ser congelada para reprodução fiel. | Fato confirmado no Schema; desenho técnico novo não necessário | Sim | Reutilizar o agregado existente; shape novo de conteúdo/snapshot fica para a v2. |
| Tentativa × materialização | Antes da materialização, tentativas de candidata/mídia podem falhar, variar e ser descartadas. Depois de uma candidata válida materializada, imagem, copy e estrutura daquela versão não são sobrescritas; nova geração preservada usa novo draft. | Direção humana aceita; coerente com write-once existente | Sim | O congelamento vigente ocorre na materialização, não na publicação; editor pré-publicação mais flexível fica para recorte futuro. |
| Preview privado | A rota histórica tenant-aware/read-only `/a/[account]/landing-pages/[landingPageId]/preview` é candidata natural a ser reutilizada sobre o novo contrato. | Direção convergente; confirmação técnica na v2 | Sim | Reutilizar salvo incompatibilidade concreta; não inventar rota nova sem gap real. |
| Repertório por plano | Planos futuros podem autorizar repertórios diferentes; plano superior pode oferecer mais layouts, seções e interações sem obrigar a IA a usá-los todos. | Direção de produto nova | Não como matriz comercial completa | Preservar em 4.4 para recorte futuro; não fixar agora quantidades como 8/12 nem nomes comerciais sem fonte canônica. |
| Cliente substituir/adicionar seções | Futuramente, o cliente pode receber um cardápio de capacidades permitidas pelo plano para substituir ou acrescentar seções à composição inicial. | Oportunidade de produto | Não | Preservar em 4.4; não atribuir automaticamente à E19.5 nem criar editor neste recorte. |
| Biblioteca de assets do cliente | Futuramente, a conta poderá manter biblioteca tenant-aware de logos e imagens próprias, reutilizáveis entre LPs, com seleção/importação controlada. | Direção de produto preservada | Não | Exige recorte próprio; somente então avaliar novo field E20.2 para imagem fornecida/selecionada como entrada. |
| Estratégia híbrida de imagens | Futuramente, mídia pode combinar asset próprio do cliente, imagem gerada por IA e importação/licenciamento externo conforme autenticidade, exclusividade, direitos e qualidade. | Direção de produto preservada | Não além da geração IA da primeira prova | Não abrir integração externa nem biblioteca ampla neste recorte. |
| Admin Dashboard | `/admin/estrutura-lp` é a superfície natural para o humano enxergar a capacidade real por plano, sempre como projeção read-only da autoridade estrutural. | Direção de produto suportada por superfície existente | Não é gate da primeira LP | Preservar em 4.4; não criar segundo dashboard nem segunda fonte de verdade. |
| Capacidades avançadas GPT-5.6 | Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK e multi-agent podem ser avaliados se surgirem necessidades concretas. | Oportunidade estratégica condicional | Não | Preservar em 4.4; adoção futura exige evidência e recorte próprio quando material. |

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
  - produzir candidata completa dentro da fonte estrutural canônica mínima, incluindo necessidade e posição da mídia dentro dos layouts suportados;
  - quando não houver asset autorizado e adequado disponível, produzir a mídia gerada autorizada para a primeira prova em etapa controlada;
  - persistir/resolver a referência canônica da mídia efetivamente escolhida antes da materialização;
  - combinar deterministicamente destinos, bindings, assets e demais valores server-side;
  - validar integralmente a candidata antes de materialização.
- Validação:
  - aplicar validações determinísticas somente ao que for objetivamente comprovável;
  - validar referência, tipo e presença da mídia exigida pelo contrato;
  - separar validação estrutural/factual de avaliação humana editorial e visual.
- Persistência:
  - reutilizar o agregado de materialização já existente se continuar adequado;
  - adicionar somente o mecanismo mínimo de persistência de mídia que for comprovadamente necessário após escolha técnica explícita;
  - não criar nova tabela ou infraestrutura ampla de assets sem gap real demonstrado.
- Consumo:
  - renderer privado e read-only reproduz a LP a partir do estado materializado e das referências congeladas de mídia, sem reler fontes mutáveis.
- Fallback:
  - falha de autorização, contexto, provider, geração/persistência de mídia, schema ou validação não materializa candidata.

### 2.2. Papel da IA

- Interpretar o `modelContext` da E19.3 como um todo, preservando a distinção de autoridade entre pesquisa e fatos concretos.
- Sintetizar público efetivo e manter a narrativa coerente com esse recorte.
- Identificar oferta, intenção comercial, estágio do funil e ação desejada.
- Escolher progressão persuasiva adequada ao caso, sem fórmula fixa obrigatória.
- Planejar quantidade, sequência e função narrativa das seções dentro do conjunto estrutural permitido.
- Escolher layouts somente entre alternativas suportadas.
- Decidir a função narrativa e a necessidade de mídia dentro das capacidades visuais suportadas, sem inventar asset do cliente inexistente.
- Produzir ou orientar a geração da imagem necessária quando o fluxo não possuir asset autorizado e adequado, respeitando os limites factuais e visuais do caso.
- Produzir copy, headings, supporting copy, CTA textual, FAQs e demais conteúdos admitidos.
- Omitir conteúdo sem função comercial clara e repetir CTA/argumento apenas quando houver função legítima.
- Usar somente fatos, pesquisa e evidências autorizados; não inventar credenciais, resultados, depoimentos, garantias, escassez, preços, benefícios ou capacidades.
- Não usar metadados da antiga pesquisa estruturada como regra de composição.

### 2.3. Papel determinístico do LP Factory

- Autorizar ator, conta, membership e entitlement.
- Resolver e entregar o pacote E19.3 sem consulta direta do modelo às fontes internas.
- Definir contrato estrutural finito, curado e competitivo e derivar dele projeções para IA, validator, materialização e renderer.
- Manter valores brutos de `serverContext` fora da matéria-prima textual e usá-los deterministicamente.
- Resolver bindings, consentimento, credenciais e referências técnicas.
- Persistir/resolver mídia somente pelo boundary autorizado e validar que a referência materializada corresponde ao asset efetivamente usado.
- Validar schema, tipos, cardinalidades, limites, identidades, componentes e propriedades suportadas.
- Bloquear factualidade objetivamente inválida ou referência a evidência inexistente quando comprovável.
- Materializar consistentemente, congelar snapshot suficiente e renderizar deterministicamente.
- Falhar fechado diante de versão, componente, layout, mídia ou payload não suportado.

### 2.4. Prompt e workflow de geração

- O runtime E19.4 é o workflow; o prompt é o contrato de inteligência da etapa geracional.
- O prompt será derivado de `docs/template-prompts.md` e complementado por `docs/template-prompts-gpt-5-6.md`.
- O prompt de produção será versionado como código próximo da feature consumidora, sem engine genérica de prompts.
- Instruções estáveis permanecem separadas do contexto dinâmico validado.
- O prompt declarará resultado, contexto autorizado, critérios de sucesso, limites, formato de saída, parada e validação pertinente, sem cadeia de raciocínio privada.
- A primeira prova usa Responses API, Structured Outputs e o baseline `gpt-5.6-luna + reasoning.effort=max` para a chamada textual principal.
- Validator e regras de negócio permanecem no código; Structured Output não substitui validação de domínio.
- Casos representativos estáveis permitirão comparar prompt, modelo e `reasoning.effort` após existir baseline real.
- A hipótese operacional inicial é uma chamada textual por tentativa; a decisão final permanece aberta até o fechamento humano desta matriz.
- A geração de imagem autorizada é etapa de mídia separada e não deve ser contabilizada como segunda etapa semântica de “planejar + escrever”.
- Tokens, timeout e retry permanecem detalhes do workload a fechar na v2 sem bloquear artificialmente a v1 quando não houver risco de retrabalho.
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK, multi-agent e tools externas não entram na primeira implementação sem necessidade demonstrada.

### 2.5. Fonte estrutural canônica e projeções derivadas

- A E19.4 possuirá uma única fonte canônica de estrutura, finita e versionada, para controlar a forma da candidata.
- A primeira versão deve ser pequena e curada, mas oferecer repertório suficiente para escolha real da IA e qualidade visual competitiva; simplicidade limita amplitude, não acabamento.
- A capacidade disponível não precisa ser usada integralmente em cada LP; a IA escolhe apenas estruturas e layouts que cumpram função na narrativa concreta.
- Structured Output, validação, estado materializado e renderer serão projeções derivadas dessa mesma autoridade estrutural.
- A IA pode escolher somente estruturas/layouts pertencentes à fonte vigente.
- Header e Footer devem ser representáveis no mesmo contrato.
- A primeira autoridade estrutural deve exigir capacidade para pelo menos um visual principal e admitir imagem como elemento de composição; layouts e cardinalidades adicionais permanecem finitos e serão fechados na v2.
- O contrato estrutural referencia mídia; não transforma E20.2 em storage e não embute binário de imagem como domínio da candidata.
- O contrato não aceita HTML/CSS/JS livre nem componente desconhecido.
- A diferenciação comercial completa de repertórios por plano e a edição posterior pelo cliente permanecem fora deste recorte, preservadas em 4.4.

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
- Imagem também não pode criar prova falsa ou sugerir fato concreto inexistente, como imóvel específico, equipe, certificado, resultado, credencial ou condição comercial não autorizados.
- Estrutura, bindings, versões, cardinalidades, referências e evidências explicitamente estruturadas podem ser validadas deterministicamente.
- Claims contraditórios com fatos autorizados devem ser bloqueados quando a contradição for objetivamente comprovável.
- Claims em linguagem livre sem mecanismo determinístico confiável de prova devem ser proibidos pelo prompt e avaliados no gate humano; não criar segunda engine semântica somente para fiscalizar copy.
- A forma de referenciar pesquisa/fatos na candidata permanece aberta, sem exigir cadeia de raciocínio.
- Factualidade e qualidade narrativa não dependem da antiga representação atomizada.

### 2.8. Materialização, snapshot e renderer

- Os artefatos SQL da materialização antiga preservados pelo PR #729 devem ser avaliados antes de proposta de banco nova.
- O estado materializado deve reproduzir a LP sem reler E19.3 ou suas fontes.
- A mídia efetivamente usada deve estar persistida e possuir referência estável antes da materialização; o `content_json` materializado congela essa referência, não o binário bruto da imagem.
- O snapshot preserva somente o necessário para auditar/reproduzir a geração: identidades, versões, configuração do workload, contexto exposto e origem/referência mínima da mídia usada, sem raciocínio privado.
- O renderer consome projeção derivada da mesma fonte estrutural canônica usada pelo Structured Output e validator.
- Aparência, Header, Footer, seções, layouts, conteúdo e referências de mídia são reproduzidos deterministicamente a partir do estado congelado.
- O renderer executa a composição autorizada; não deve virar segunda fonte de regras comerciais por plano.
- Versão/shape exatos da materialização e do snapshot permanecem abertos até a inspeção do contrato mínimo.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e validação integral da candidata

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: sim em princípio pela participação central da IA; categoria final pendente da consulta obrigatória ao Gestor de Automação antes da v1.
- Objetivo:
  - transformar o pacote E19.3 em candidata completa da primeira LP real, com planejamento narrativo, copy e necessidade de mídia por IA dentro do contrato estrutural mínimo e validação determinística antes da persistência.
- Dependências anteriores à execução:
  - taxon preparado pelos recortes responsáveis;
  - E19.3 do Cenário E implementada e aprovada em prova read-only;
  - configuração E19.2 completa conforme E20.2.
- Questões indispensáveis ainda abertas:
  - contrato estrutural mínimo, repertório visual e projeções;
  - layouts/cardinalidades exatas da imagem;
  - prompt canônico;
  - decisão final de uma chamada textual por tentativa;
  - Structured Output/schema;
  - factualidade/evidência da copy e da mídia;
  - casos representativos;
  - critérios de aceite da candidata.
- Baseline já decidido:
  - `gpt-5.6-luna + reasoning.effort=max`;
  - Responses API;
  - Structured Outputs;
  - geração de imagem autorizada quando faltar asset adequado no fluxo vigente.

### 3.2. E19.4.4 — Materialização inicial e snapshot imutável

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: não, salvo nova decisão humana baseada em necessidade real.
- Objetivo:
  - persistir a primeira candidata integral válida em estado próprio e reproduzível, com mídia estável e snapshot coerente com o Cenário E.
- Questões indispensáveis ainda abertas:
  - adequação dos artefatos SQL preservados;
  - mecanismo mínimo de persistência/entrega da mídia e sua referência canônica;
  - avaliação de Supabase Storage como primeiro candidato, sem decisão antecipada;
  - requisitos de performance da mídia;
  - versão e shape do conteúdo materializado;
  - versão e shape do snapshot;
  - concorrência, nova tentativa e write-once da primeira prova.

### 3.3. E19.4.5 — Visualização privada e prova humana da primeira LP real

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: não.
- Objetivo:
  - renderizar privadamente a primeira LP materializada e produzir evidência humana suficiente para avaliar estrutura, narrativa, copy, factualidade, clareza comercial, acessibilidade, mídia, carregamento e qualidade visual.
- Questões indispensáveis ainda abertas:
  - confirmação da reutilização da superfície/path histórico de preview privado;
  - contrato do renderer;
  - critérios visuais/responsivos e de performance finais;
  - checklist humano;
  - separação entre defeito bloqueante e melhoria editorial posterior.

### 3.4. Próxima ação do debate

- A Preparação do taxon está delegada aos dois recortes próprios e não é detalhada neste plano.
- A E19.3 do Cenário E já foi concluída e mergeada pelo PR #757; não é mais Gate anterior deste debate.
- Não reabrir E20.2 apenas para acomodar imagem gerada pela E19.4; voltar à E20.2 somente se surgir valor factual prévio que deva ser fornecido/confirmado como entrada, inclusive futura seleção de asset próprio do cliente.
- Fechar com humano e Analista somente as linhas ainda indispensáveis da matriz 1.7, principalmente repertório estrutural, persistência/performance de mídia, número de chamadas textuais, claims e critérios de aceite.
- Consultar o Gestor de Automação antes da consolidação da v1 para classificar formalmente a fase E19.4.3 e submeter a categoria ao humano.
- Quando a LP gerada não atingir qualidade desejada, diagnosticar nesta ordem: E19.4; pesquisa; E20.2 quando surgir dado factual necessário não previsto; E19.3 somente diante de gap real de autorização, identidade, separação ou transporte.
- Não atualizar `docs/roadmap.md` enquanto este arquivo permanecer rascunho vivo.
- Não iniciar implementação da E19.4 antes da consolidação da v1 deste plano.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4 neste momento

- preparação do taxon, incluindo sua pesquisa selecionada, avaliação E20.2, persistência e aprovação;
- implementação técnica da E19.3;
- publicação pública, domínio customizado e disponibilidade comercial;
- tracking, analytics, CRM, Ads, A/B test e engine de experimentos;
- detalhamento/implementação da E19.5 Light dentro deste recorte;
- editor visual, edição manual ampla, histórico e rollback;
- personalização pós-geração pelo cliente para substituir, acrescentar ou remover seções;
- matriz comercial completa de capacidades estruturais por plano;
- nova superfície administrativa exclusiva para capacidades do renderer;
- implementação E19.4 D ou comparação D × E como requisito;
- consulta direta da IA às fontes internas do projeto fora do pacote E19.3;
- reintrodução de E18.5, E20.3 ou E10.8 como gate da geração;
- camada intermediária de resumo, atomização ou seleção semântica;
- HTML, CSS, React, JavaScript, scripts ou componentes arbitrários gerados pela IA;
- catálogo estrutural amplo antecipado ou reconstrução da antiga E18.5;
- biblioteca tenant-aware ampla de assets do cliente, upload/seleção pelo cliente, galeria completa, banco de mídia, DAM, busca/importação externa ou integração com banco de imagens;
- novo field E20.2 para imagem apenas porque a E19.4 gerou mídia; eventual field futuro depende de fluxo real de imagem fornecida/selecionada como entrada;
- editor pré-publicação que permita mutar materialização write-once já congelada;
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK, multi-agent, job, fila, cron, webhook, browsing ou tools externas sem necessidade real;
- nova tabela, serviço, engine ou infraestrutura além do mecanismo mínimo de mídia comprovadamente necessário sem gap real demonstrado;
- perfil persistido novo de público/persona/estratégia apenas para facilitar prompt.

### 4.2. Critérios de parada imediata

- Parar e voltar ao debate humano se o pacote E19.3 faltar informação indispensável sem fonte canônica autorizada.
- Parar se a solução tentar compensar pesquisa insuficiente com atomização, ranking, RAG, chunking, allowlist ou seleção semântica sem evidência.
- Parar se a solução exigir mapa nominal crescente de nichos, fields ou componentes dentro da E19.4.
- Parar se o contrato estrutural crescer principalmente por extensibilidade hipotética.
- Parar se a IA precisar inventar facts, evidências, credenciais, destinos ou capacidades.
- Parar se a mídia não puder ser persistida/referenciada de forma estável antes da materialização ou se a solução escolhida exigir infraestrutura ampla sem necessidade da primeira prova.
- Parar se a materialização só puder reproduzir a LP relendo fontes mutáveis.
- Parar se surgir necessidade de agente, automação adicional, engine ou infraestrutura não sustentada por fonte real.
- Toda mudança material de escopo ou categoria de automação volta ao humano antes da v1.

### 4.3. Critério provisório de conclusão do recorte

- A E19.4 deverá ser considerada funcionalmente concluída quando uma LP real do fluxo oficial:
  - for gerada a partir do pacote autorizado E19.3;
  - apresentar jornada comercial coerente e avaliável do interesse à ação;
  - respeitar autoridade dos fatos concretos, pesquisa, limites e evidências autorizadas;
  - utilizar pelo menos uma imagem principal pertinente, com referência estável e sem sugerir fato concreto não autorizado;
  - preservar carregamento e responsividade aceitáveis para avaliação real;
  - for materializada integralmente em `draft`;
  - for reproduzida privadamente por renderer determinístico;
  - puder ser avaliada humanamente como landing page real quanto a narrativa, copy, estrutura, mídia, responsividade, acessibilidade e qualidade visual.
- A conclusão funcional não exige estabilização editorial completa de prompt, modelo, effort, narrativa ou visual; iterações poderão continuar após a E19.5 Light por novos drafts preservados.
- Este critério permanece provisório enquanto o rascunho não virar plano-base v1.

### 4.4. Substância preservada para recortes futuros

- A capacidade estrutural pode evoluir como repertório autorizado por plano: planos superiores podem oferecer mais tipos de seção, variantes, layouts e interações sem tornar a qualidade visual do plano inicial inferior.
- A quantidade de capacidades disponíveis em um plano não define a quantidade de seções usadas em cada LP; a IA pode escolher um subconjunto conforme a narrativa. Exemplos numéricos discutidos como “12 disponíveis / 8 usadas” são ilustrativos e não constituem contrato comercial.
- Uma experiência futura pode permitir que o cliente substitua uma ou mais seções, acrescente ou remova seções e escolha variantes dentro do repertório autorizado pelo plano; isso exige recorte próprio e não deve ser atribuído automaticamente à E19.5 Light.
- A diferenciação comercial por plano deve permanecer separada do renderer: uma autoridade de produto autoriza o repertório; a E19.4 escolhe a composição; o renderer executa a estrutura resultante.
- O Admin Dashboard existente em `/admin/estrutura-lp` é o destino natural para uma projeção read-only das capacidades reais por plano, inclusive módulos/estruturas, variantes, layouts, interações e eventualmente exemplos visuais; o Admin não deve manter cópia manual ou segunda fonte de verdade.
- Não há decisão de criar dashboard novo: qualquer visualização administrativa futura deve preferir a superfície existente e derivar da mesma autoridade estrutural canônica.
- O repertório futuro de planos Pro/Ultra pode incorporar capacidades mais ricas — galerias, vídeo, comparadores, componentes interativos, animações ou outras experiências — somente quando houver caso real e contrato suportado pelo renderer.
- A conta poderá futuramente possuir uma biblioteca tenant-aware de assets reutilizáveis, separando logo, imagens principais, imagens secundárias e outros tipos conforme casos reais; não criar uma tabela por cliente.
- Quando existir fluxo de upload/seleção de imagem pelo cliente antes da geração, avaliar novo field E20.2 específico para essa entrada; `brand_logo_asset` deve continuar dedicado à logo.
- A estratégia futura de mídia pode ser híbrida: priorizar asset próprio adequado quando houver, gerar imagem por IA quando trouxer valor e permitir importação/licenciamento externo somente com direitos, autenticidade, qualidade e proveniência resolvidos.
- A experimentação futura pode permitir trocar imagem/copy/estrutura enquanto a versão ainda não estiver congelada; no contrato atual o congelamento ocorre na materialização write-once, e qualquer lifecycle editável mais amplo exige recorte próprio.
- Supabase Storage é o primeiro candidato a ser avaliado para persistência mínima de mídia por aderência à stack existente; isso não constitui decisão de plataforma, bucket, política, tabela ou implementação antes da v2.
- Qualquer solução futura de assets deve preservar performance da LP por otimização de formato, dimensões, compressão e cache/CDN, sem confundir variedade visual com páginas pesadas.
- A escolha de GPT-5.6 + Responses API preserva possibilidade futura de avaliar Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK e multi-agent; nenhuma dessas capacidades está autorizada para implementação neste recorte apenas por ser tecnicamente disponível.
- Quando a v1 for consolidada, esta subseção deve preservar somente oportunidades relevantes ainda sem recorte próprio, evitando transformar possibilidades futuras em requisitos executáveis da E19.4.

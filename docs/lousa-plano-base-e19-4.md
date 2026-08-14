14/08/2026 — Rascunho vivo — E19.4 — Primeira LP real do Cenário E

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo do futuro plano-base v1; ainda não consolidado nem executável.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Path canônico: `docs/lousa-plano-base-e19-4.md`.
- Processo: `docs/prompt-estrategista.md` v29.
- Plano conceitual: `docs/lp-planejamento.md`.
- Base de abertura do PR #731: `main` após o merge do PR #729, commit `40baacbc516a80c2600408a9be63bfa33793ca85`.
- O plano-base v2 anterior da E19.4 permanece somente no histórico Git como desenho superado; ele dependia do contrato E19.3 `partA + partB` e não pode ser reutilizado como briefing executável.
- Decisão humana de 14/08/2026: o Cenário E passa a ser a única direção ativa para a primeira geração real; o Cenário D deixa de ser alternativa em desenvolvimento ou comparação obrigatória e não deve ser implementado antes de E.
- A branch `strategy/e19-4-cenario-d` conserva o nome histórico de abertura do PR #731; esse nome não representa a direção arquitetural vigente e não justifica criar nova branch ou novo PR para o mesmo rascunho.
- A arquitetura lógica útil da E19.3 permanece válida, com `identities + modelContext + serverContext`; sua reformulação para o Cenário E pertence a `docs/lousa-plano-base-e19-3.md`.
- A E19.3 do Cenário E permanece rascunho até a precondição física mínima de `business_taxons` existir e sua prova read-only ser executada.
- Nenhuma implementação da nova E19.4 foi iniciada neste debate.

### 1.2. Objetivo e resultado esperado

- Produzir e avaliar a primeira landing page real do Cenário E a partir de pesquisa integral aprovada, fatos concretos E19.2/E20.2 e limites E18.4 transportados por uma E19.3 mínima.
- Dar à IA liberdade controlada para transformar contexto autorizado em uma jornada comercial coerente, sem delegar segurança, autorização, verdade factual da conta/oferta, bindings operacionais, persistência ou renderer.
- Gerar uma candidata estruturalmente válida, materializá-la no `draft` real já existente e disponibilizar preview privado e read-only para avaliação humana.
- Incluir na primeira prova uma LP completa e reconhecível como página comercial real, com Header, corpo, CTA(s), Footer, estrutura visual e conteúdo coerentes com o caso concreto.
- Encerrar a E19.4 quando o fluxo do Cenário E estiver funcional de ponta a ponta e a LP puder ser aberta no navegador e avaliada de forma real; otimização editorial intensiva poderá continuar depois da E19.5 Light por novos drafts independentes.

### 1.3. Decisões aceitas no debate até aqui

- A hierarquia de autoridade do Cenário E é: configuração concreta E19.2/E20.2 define a realidade da conta, oferta e LP; pesquisa integral fornece contexto consultivo sobre público e mercado; E18.4 fornece limites universais aplicáveis; E19.3 autoriza, organiza e transporta; E19.4 toma as decisões narrativas, criativas e persuasivas.
- A pesquisa nunca pode ampliar ou contradizer a oferta concreta; quando houver tensão entre conhecimento amplo do taxon e o caso configurado, a configuração concreta prevalece para definir o que esta LP vende e quais capacidades do cliente podem ser afirmadas.
- Não haverá camada intermediária que resuma ou consolide pesquisa + E19.2 antes da E19.4.
- Eventual resumo executivo pertence à própria pesquisa integral e não substitui seu conteúdo completo.
- A própria pesquisa pode ser avaliada e otimizada antes do consumo para melhorar fontes, atualidade, distinção entre evidência e inferência, relações causais, condições, exceções, limitações, dores, desejos, objeções e linguagem.
- As versões integrais permanecem imutáveis no GitHub em `docs/pesquisas-brutas/<taxon_slug>/<audience_scope>/vN.md`; criar uma nova versão não altera nem substitui automaticamente uma versão anterior.
- Para o Cenário E atual, a seleção operacional necessária é somente da pesquisa integral `end_customer`; `business_buyer` deixa de ser requisito de preparação do taxon e do caminho de geração da LP, sem impedir que o comercial futuro reutilize a pesquisa `end_customer` para comunicar ao B2B os problemas de seus próprios clientes.
- `business_taxons` permanece a identidade canônica do taxon e deverá receber `selected_end_customer_research_version`, inteiro positivo e anulável, identificando a versão integral `end_customer` aprovada para geração.
- Não criar tabela própria de seleção; a alternativa `taxon_integral_research_selection` permanece descartada por adicionar entidade, join e lifecycle sem necessidade demonstrada.
- `business_taxons.is_active` continua representando atividade taxonômica; um taxon pode permanecer ativo na taxonomia sem estar preparado para geração.
- `selected_end_customer_research_version IS NULL` significa ausência de pesquisa integral aprovada para o fluxo; valor positivo `N` autoriza resolver exatamente `vN`, sem fallback implícito para `1` ou para a versão mais recente.
- O path da pesquisa não é persistido no Supabase; para a primeira prova ele é derivado de `business_taxons.slug + end_customer + selected_end_customer_research_version` no padrão existente `docs/pesquisas-brutas/<taxon_slug>/end_customer/vN.md`.
- Quando surgirem versões posteriores, a última versão explicitamente aprovada continua selecionada até nova decisão; criar `vN` não modifica automaticamente o campo.
- A aprovação ou troca da versão selecionada ocorre após testes e decisão humana apoiada pela IA; se uma versão nova não entregar qualidade suficiente, a seleção vigente permanece e prompt/pesquisa podem ser ajustados antes de novo teste.
- Campo `NULL`, versão não positiva, arquivo selecionado inexistente ou conteúdo incompatível com taxon/audience/versão esperados falha fechado.
- Separar três estados conceitualmente distintos: preparação do taxon, prontidão de uma LP concreta para geração e disponibilidade comercial.
- A preparação do taxon ocorre antes da configuração concreta de uma LP e não depende da E19.2; exige taxon ativo, pesquisa integral `end_customer` aprovada/selecionada e avaliação concluída da aplicabilidade da E20.2.
- A avaliação da E20.2 é gate obrigatório da preparação do taxon, mas uma camada própria por taxon não é obrigatória: o catálogo herdado pode ser considerado suficiente.
- O resultado aprovado da avaliação E20.2 será representado no próprio `business_taxons` por `reviewed_input_catalog_version`, inteiro positivo e anulável, em vez de booleano sem rastreabilidade.
- `reviewed_input_catalog_version IS NULL` significa avaliação E20.2 não concluída; valor positivo `N` significa que a versão executável E20.2 `N`, efetivamente resolvida e consumida pelo fluxo, foi avaliada e considerada suficiente para aquele taxon.
- O registry E20.2 atual contém versões executáveis 1, 2 e 3; não existe premissa de que `v1` seja a versão vigente nem de que a maior versão disponível seja automaticamente a versão consumida.
- A E19.3 implementada atualmente exige `LANDING_PAGE_GENERATION_VALUES_CATALOG_VERSION = 2`; portanto, o marcador deve corresponder à versão que a configuração/compilador efetivamente usa, hoje 2 nesse contrato, e evoluir somente quando o consumidor real também evoluir.
- Se a avaliação identificar gap, `reviewed_input_catalog_version` permanece `NULL` até ajuste da E20.2 e nova avaliação; não criar estado persistido adicional como `needs_adjustment` apenas para o gate.
- Se a versão E20.2 efetivamente consumida mudar, a avaliação anterior não é presumida atual; o taxon precisa ser reavaliado antes de o marcador acompanhar a nova versão.
- Assim, `taxon preparado` significa cumulativamente: `business_taxons.is_active = true` + pesquisa `end_customer` selecionada válida + `reviewed_input_catalog_version` correspondente à versão E20.2 efetivamente avaliada e consumida.
- Os dois campos ainda não existem fisicamente no schema atual de `business_taxons`; sua extensão mínima, sem nova tabela, pertence ao recorte executor da E19.3.3 e deve ocorrer antes da alteração do compilador E19.3.
- A migration desses campos não atribui aprovações automaticamente: seleção de pesquisa e avaliação E20.2 continuam decisões explícitas.
- A prontidão da LP é avaliada depois, no contexto de conta + LP concretas: depende da E19.2 e da completude dos valores obrigatórios/condicionais aplicáveis pela E20.2.
- A disponibilidade comercial por `taxon + plano` permanece decisão separada, historicamente prevista para E20.4/E12.4.5–12.4.6.
- A E19.3 permanece como fronteira autorizada entre fontes e geração, sem atuar como planejador, resumidor ou camada de inteligência semântica.
- A matéria-prima textual da IA vem do `modelContext`; `serverContext` permanece sob uso determinístico do servidor.
- A pesquisa integral aprovada `end_customer` chega ao `modelContext` preservando identidade mínima, versão e conteúdo integral, sem `itemKey`, `priority`, `sortOrder`, quatro registros-pai ou 59 itens estruturados.
- Os fatos concretos da LP chegam via configuração E19.2/E20.2 já resolvida e projetada pela E19.3; a IA não decide quais fields são aplicáveis.
- A IA deve sintetizar o público efetivo a partir da interseção entre pesquisa `end_customer` e fatos concretos, sem criar perfil persistido novo.
- A narrativa deve possuir começo, desenvolvimento e conversão; AIDA pode ser referência persuasiva, não schema rígido.
- A IA pode decidir quantidade de seções, sequência, função narrativa, copy, CTA textual, omissões, repetições legítimas e layout dentre opções suportadas pelo contrato estrutural da E19.4.
- O sistema permanece responsável por autorização, facts, evidências, tipos estruturais, limites absolutos, bindings, destinos, consentimento, credenciais, segurança tenant-aware, schema, materialização, snapshot, versões e renderer.
- A IA não gera HTML, CSS, React, JavaScript, scripts, componentes desconhecidos, credenciais, webhooks ou estruturas fora do contrato suportado.
- Header e Footer pertencem à E19.4 e devem fazer parte do contrato da primeira LP real.
- A E19.4 deve usar uma única fonte canônica de estrutura, da qual sejam derivadas deterministicamente as projeções necessárias para Structured Output, validação, materialização e renderer.
- E10.8 e os itens estruturados podem permanecer no produto enquanto possuírem consumidores reais, mas deixam de ser requisito do caminho de geração E19.3 → E19.4 no Cenário E.
- O prompt de runtime será tratado como código versionado da feature, separando instruções estáveis do contexto dinâmico validado da E19.3.
- Alterações de prompt, modelo ou `reasoning.effort` serão avaliadas com casos representativos e critérios estáveis do workload.
- A combinação `modelo + reasoning effort` permanece em aberto até o Gate correspondente, conforme `docs/openai-model-snapshot.md`.
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
- `docs/lousa-plano-base-e19-3.md`.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e18-4.md`.
- `docs/lousa-plano-base-e10-8.md` somente para identificar contratos/consumidores vigentes e separar a pesquisa estruturada da pesquisa integral.
- `docs/prompt-nicho-identificacao.md`.
- `docs/prompt-nicho-pesquisa.md`.
- `docs/prompt-nicho-arquivamento-pesquisa.md`.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md` como primeira pesquisa integral real para o debate.
- `docs/template-prompts.md`.
- `docs/template-prompts-gpt-5-6.md`.
- `docs/openai-model-snapshot.md`.
- `docs/gestor-automations.md`.
- `docs/automations.md`.
- `lib/conversion-content/landing-page/input-catalog/registry.ts`.
- `lib/lp-builder/generationContextContracts.ts`.
- `lib/admin/readRepoDoc.ts`.
- `next.config.js` somente como precedente técnico; o entrypoint de tracing da pesquisa não é antecipado sem consumer runtime real.
- PR #726 e `docs/lousa-plano-base-e19-5.md` somente como fonte conceitual da sucessora E19.5 Light.
- Artefatos SQL da materialização E19.4 preservados pelo PR #729, somente como fonte real já existente para o debate de persistência.

### 1.5. Questões ainda abertas e não decididas

- Se a avaliação E20.2 assistida por IA deve permanecer inicialmente como procedimento administrativo fora do runtime ou ganhar workload próprio somente depois de benefício demonstrado; isso não bloqueia o gate obrigatório já definido.
- Quais critérios/testes humanos com apoio da IA aprovam uma versão de pesquisa integral como suficientemente boa para substituir a seleção vigente; `docs/prompt-nicho-pesquisa.md` já melhorou o contrato de qualidade e deve ser testado, não redesenhado preventivamente.
- Se a geração E19.4 ocorre em uma única chamada que planeja e escreve a LP ou em mais de uma etapa/chamada controlada, sem transformar o fluxo em agente.
- Qual é o menor conjunto de primitivas, layouts, cardinalidades e interações necessário para materializar e renderizar a primeira LP real sem HTML/CSS/JS livre.
- Se algum metadata mínimo e seguro derivado de `identities` ou `serverContext` precisa ser projetado ao modelo para decisão estrutural.
- Como representar no Structured Output o planejamento narrativo e o conteúdo final sem criar segundo DTO de domínio ou registry paralelo ao renderer.
- Quais referências de pesquisa/fatos a candidata deve devolver para permitir validação sem exigir provenance cognitiva ou cadeia de raciocínio.
- Quais claims podem ser validados objetivamente, quais dependem de evidência concreta e quais só podem ser avaliados humanamente.
- Qual combinação `modelo + reasoning effort` cumpre os gates com menor complexidade, custo e latência.
- Como adaptar o snapshot da materialização para registrar workload e contexto efetivamente exposto sem armazenar raciocínio privado.
- Qual superfície real disponibilizará o preview privado da primeira LP.
- Quais critérios objetivos e humanos definirão que a primeira LP do Cenário E é funcional e suficientemente avaliável para encerrar a E19.4.

### 1.6. Direção aprovada — E → E19.5 Light → iterações

- Prosseguir somente com o Cenário E até existir uma E19.4 funcional ponta a ponta: pesquisa integral aprovada + fatos concretos E19.2/E20.2 + limites E18.4 → E19.3 mínima → geração por IA → candidata estruturada → validação → materialização → renderer → preview privado.
- Não implementar E19.4 D antes de E e não manter D como comparação obrigatória.
- Antes da E19.4, executar a E19.3 do Cenário E com sua precondição mínima de schema e prova read-only; não criar nova camada de inteligência intermediária.
- Após a E19.4 E funcional, E19.5 Light deverá permitir novos `drafts` independentes para iterações E1/E2/E3, sem overwrite e sem conhecer a representação interna da pesquisa.
- O contrato detalhado da E19.5 Light pertence ao documento e ao debate próprios.

## 2. Contrato do caso

### 2.1. Fluxo lógico em construção

- Gatilho:
  - ação humana explícita na jornada operacional da conta inicia a geração da LP completa;
  - papéis, entitlement e superfície exatos serão confirmados contra o runtime vigente antes da v1.
- Entrada:
  - LP legítima em `draft` e configuração vinculada;
  - taxon previamente preparado, com pesquisa `end_customer` aprovada e avaliação E20.2 correspondente à versão efetivamente consumida;
  - configuração E19.2 da conta/LP concreta completa nos fields obrigatórios/condicionais aplicáveis;
  - sucesso integral da E19.3 ajustada ao Cenário E;
  - configuração OpenAI autorizada para o workload E19.4.
- Processamento:
  - revalidar autorização antes do provider;
  - obter o pacote E19.3 sem fazer a E19.4 reler diretamente E10.8, E18.4, E20.2, E18.5 ou E20.3;
  - construir a requisição a partir do prompt canônico versionado e do contexto autorizado;
  - permitir que a IA sintetize público efetivo, oferta, estágio de funil, intenção de conversão e jornada persuasiva, respeitando a precedência dos fatos concretos;
  - produzir candidata completa dentro da fonte estrutural canônica mínima;
  - combinar deterministicamente destinos, bindings, assets e demais valores server-side;
  - validar integralmente a candidata antes de qualquer materialização.
- Validação:
  - aplicar validações determinísticas somente ao que for objetivamente comprovável;
  - separar validação estrutural/factual de avaliação humana editorial e visual.
- Persistência:
  - reutilizar o agregado de materialização já existente se continuar adequado;
  - não criar nova persistência sem gap real demonstrado.
- Consumo:
  - renderer privado e read-only reproduz a LP a partir do estado materializado, sem reler fontes mutáveis.
- Fallback:
  - falha de autorização, pesquisa, contexto, provider, schema ou validação não materializa candidata.

### 2.2. Papel da IA

- Interpretar o `modelContext` da E19.3 como um todo, preservando a distinção de autoridade entre pesquisa e fatos concretos.
- Sintetizar internamente o público efetivo e manter toda a narrativa coerente com esse recorte.
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
- Definir o menor contrato estrutural finito e derivar dele as projeções para IA, validator, materialização e renderer.
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

- A LP é uma sequência comercial completa, não preenchimento independente de blocos.
- O Hero revalida a atenção, confirma relevância e gera interesse.
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
- A forma de referenciar partes de pesquisa/fatos na candidata permanece aberta, sem exigir cadeia de raciocínio.
- Factualidade e qualidade narrativa não dependem da antiga representação atomizada.

### 2.8. Materialização, snapshot e renderer

- Os artefatos SQL da materialização antiga preservados pelo PR #729 devem ser avaliados antes de proposta de banco nova.
- O estado materializado deve reproduzir a LP sem reler E19.3, E20.2, E10.8, E18.5 ou E20.3.
- O snapshot preserva somente o necessário para auditar/reproduzir a geração: identidades, versões, configuração do workload e contexto exposto, sem raciocínio privado.
- O renderer consome projeção derivada da mesma fonte estrutural canônica usada pelo Structured Output e validator.
- Aparência, Header, Footer, seções, layouts e conteúdo são reproduzidos deterministicamente a partir do estado congelado.
- Versão/shape exatos da materialização permanecem abertos até a inspeção do contrato mínimo.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e validação integral da candidata

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: sim em princípio pela participação central da IA; categoria final pendente da consulta obrigatória ao Gestor de Automação antes da v1.
- Objetivo:
  - transformar o pacote E19.3 do Cenário E em candidata completa da primeira LP real, com planejamento narrativo e copy por IA dentro do contrato estrutural mínimo e validação determinística antes da persistência.
- Dependências anteriores à execução:
  - E19.3 do Cenário E implementada e aprovada em prova read-only;
  - taxon preparado com os dois sinais físicos válidos;
  - configuração E19.2 completa conforme E20.2;
  - pesquisa integral aprovada.
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

- O Gate de preparação do taxon está conceitualmente fechado: pesquisa integral explicitamente selecionada, avaliação E20.2 versionada, sem `business_buyer`, sem tabela própria e com leitura da pesquisa pelo filesystem do deploy.
- O mecanismo físico de leitura está decidido sem API GitHub; o entrypoint específico de `outputFileTracingIncludes` não é antecipado até existir consumer runtime real que o exija.
- Os dois campos necessários ainda não existem e sua implementação mínima pertence à execução E19.3.3, antes da alteração do compilador.
- A E20.2 deve ser comparada pela versão efetivamente consumida; o registry contém 1, 2 e 3, enquanto a E19.3 implementada hoje consome 2.
- O próximo passo material é executar a E19.3.3 na ordem `migration mínima → sinais aprovados do taxon piloto → compilador v3 com pesquisa integral → prova read-only sem OpenAI`.
- O Gate de qualidade da pesquisa não parte do zero: `docs/prompt-nicho-pesquisa.md` já contém critérios de evidência, inferência, fontes, limitações e proibição de antecipar a solução da LP; a decisão restante é testar seu resultado real e aprovar/reprovar a versão com julgamento humano apoiado pela IA.
- Depois da prova E19.3, retornar diretamente aos Gates internos da E19.4: prompt/workflow, contrato estrutural mínimo, factualidade/evidência, modelo/effort, materialização/snapshot, renderer e avaliação humana.
- Quando a LP gerada não atingir a qualidade desejada, diagnosticar nesta ordem: E19.4; pesquisa; E20.2 quando surgir dado factual necessário não previsto; E19.3 somente diante de gap real de autorização, identidade, separação ou transporte.
- Não atualizar `docs/roadmap.md` enquanto este arquivo permanecer rascunho vivo.
- Não iniciar implementação da E19.4 antes da prova E19.3 e da consolidação da v1 deste plano.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4 neste momento

- Publicação pública, domínio customizado e disponibilidade comercial.
- Tracking, analytics, CRM, Ads, A/B test e engine de experimentos.
- Detalhamento/implementação da E19.5 Light dentro deste recorte.
- Editor visual, edição manual ampla, histórico e rollback.
- Implementação da E19.4 D ou comparação D × E como requisito.
- Consulta direta da IA a E10.8, E18.4, E20.2, E18.5 ou E20.3.
- Reintrodução de E18.5 ou E20.3 como gate obrigatório da geração.
- Camada intermediária de resumo pesquisa + E19.2.
- Recriação de `itemKey`, `priority`, `sortOrder`, quatro registros-pai, 59 itens ou equivalente.
- Detalhamento técnico da E19.3 dentro deste plano; sua implementação pertence ao documento próprio.
- Acoplamento da E19.4 a path Markdown ou representação interna da pesquisa.
- HTML, CSS, React, JavaScript, scripts ou componentes arbitrários gerados pela IA.
- Catálogo estrutural amplo antecipado ou reconstrução da antiga E18.5.
- Agents SDK, multi-agent, job, fila, cron, webhook, browsing ou tools externas sem necessidade real.
- Migration dos campos `selected_end_customer_research_version` e `reviewed_input_catalog_version` dentro da E19.4; essa precondição pertence ao recorte executor E19.3.3.
- Nova tabela de seleção/prontidão, novo serviço ou infraestrutura sem gap real demonstrado.
- Perfil persistido novo de público/persona/estratégia apenas para facilitar prompt.

### 4.2. Critérios de parada imediata

- Parar e voltar ao debate humano se pesquisa integral ou pacote E19.3 faltar informação indispensável sem fonte canônica autorizada.
- Parar se a solução tentar compensar pesquisa insuficiente com atomização, ranking, RAG, chunking, allowlist ou seleção semântica sem evidência.
- Parar se a solução exigir mapa nominal crescente de nichos, fields ou componentes dentro da E19.4.
- Parar se o contrato estrutural crescer principalmente por extensibilidade hipotética.
- Parar se a IA precisar inventar facts, evidências, credenciais, destinos ou capacidades.
- Parar se a materialização só puder reproduzir a LP relendo fontes mutáveis.
- Parar se surgir necessidade de agente, automação adicional, engine ou infraestrutura não sustentada por fonte real.
- Toda mudança material de escopo ou categoria de automação volta ao humano antes da v1.

### 4.3. Critério provisório de conclusão do recorte

- A E19.4 deverá ser considerada funcionalmente concluída quando uma LP real do fluxo oficial:
  - for gerada a partir de pesquisa integral aprovada + fatos concretos E19.2/E20.2 + limites E18.4, transportados pela E19.3 do Cenário E;
  - apresentar jornada comercial coerente e avaliável do interesse à ação;
  - respeitar a autoridade da configuração concreta sobre a pesquisa ampla;
  - respeitar fatos, limites e evidências autorizados;
  - for materializada integralmente em `draft`;
  - for reproduzida privadamente por renderer determinístico;
  - puder ser avaliada humanamente como landing page real quanto a narrativa, copy, estrutura, responsividade, acessibilidade e qualidade visual.
- A conclusão funcional não exige estabilização editorial completa de prompt, modelo, effort, narrativa ou visual; iterações poderão continuar após a E19.5 Light por novos drafts preservados.
- Este critério permanece provisório enquanto o rascunho não virar plano-base v1.
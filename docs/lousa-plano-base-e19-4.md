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
- A arquitetura lógica útil da E19.3 permanece válida, com `identities + modelContext + serverContext`; a E19.3 deve ser ajustada para transportar pesquisa integral aprovada, e seu contrato técnico e sua implementação pertencem ao plano próprio da E19.3.
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
- Para cada `taxon + audience_scope`, o Supabase deverá representar somente qual versão integral está selecionada para geração, sem armazenar nesse registro o conteúdo, resumo, score, comparação ou atomização da pesquisa.
- Quando existir somente `v1` válida para `taxon + audience_scope`, ela permanece como default sem exigir ação humana adicional; quando surgirem versões posteriores, a última versão explicitamente aprovada continua selecionada até nova decisão.
- A aprovação ou troca da versão selecionada ocorre após testes e decisão humana apoiada pela IA; uma versão nova que não melhore a qualidade não altera a seleção vigente.
- Se os testes não entregarem qualidade suficiente, o prompt e/ou a pesquisa podem ser ajustados, uma nova versão é produzida e testada, e a seleção vigente permanece inalterada até aprovação.
- Após aprovação, o humano ou uma IA autorizada pode atualizar no Supabase a versão selecionada daquele `taxon + audience_scope`; tabela, coluna, migration e mecanismo físico exatos permanecem em aberto até inspeção do schema e fechamento técnico do Gate.
- A ausência de versão utilizável ou uma seleção que não possa ser resolvida para conteúdo integral válido deve falhar fechado; o runtime não escolhe silenciosamente a versão mais recente.
- A E19.3 permanece como fronteira autorizada entre as fontes do projeto e a geração, mas não atua como planejador, resumidor ou camada de inteligência semântica.
- A matéria-prima textual da IA vem do `modelContext` da E19.3; `serverContext` permanece sob uso determinístico do servidor e não vira matéria-prima textual bruta para o modelo.
- A pesquisa integral aprovada `end_customer` deverá chegar ao `modelContext` preservando identidade mínima, versão e conteúdo integral, sem depender de `itemKey`, `priority`, `sortOrder`, quatro registros-pai ou 59 registros estruturados.
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
- Essa fonte estrutural deve conter somente as primitivas, layouts e restrições necessárias à primeira LP real; novas capacidades entram apenas quando um caso concreto demonstrar necessidade.
- A E19.4 não deve acoplar prompt, composição, validação editorial ou renderer a `itemKey`, `priority`, `sortOrder`, path Markdown ou outra característica interna da representação da pesquisa.
- E10.8 e os itens estruturados podem permanecer no produto enquanto possuírem consumidores reais, mas deixam de ser requisito desejado do caminho de geração E19.3 → E19.4 no Cenário E.
- O prompt será uma peça central do contrato de inteligência da E19.4, mas não substitui o workflow determinístico ao redor da chamada nem o contrato estrutural.
- `docs/template-prompts.md` e `docs/template-prompts-gpt-5-6.md` são fontes obrigatórias para desenhar o prompt do workload.
- Conforme a governança incorporada pelo PR #730, o prompt de runtime deve ser tratado como código versionado da feature, separando instruções estáveis da aplicação do contexto dinâmico e validado da E19.3.
- Alterações de prompt, modelo ou `reasoning.effort` devem ser avaliadas com casos representativos e critérios estáveis do workload; Structured Output define o contrato observável de saída, mas não substitui autorização, validação determinística, regras de negócio ou guardrails do LP Factory.
- A combinação `modelo + reasoning effort` permanece em aberto até o Gate correspondente; candidatos devem ser comparados conforme `docs/openai-model-snapshot.md`, sem preferência antecipada por modelo ou effort e escolhendo a menor configuração que cumpra os gates.
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
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e18-4.md`.
- `docs/prompt-nicho-identificacao.md`.
- `docs/prompt-nicho-pesquisa.md`.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md` como primeira pesquisa integral real para o debate, sem pressupor que seu path Markdown será o mecanismo físico final de runtime.
- `docs/template-prompts.md`.
- `docs/template-prompts-gpt-5-6.md`.
- `docs/openai-model-snapshot.md`.
- `docs/gestor-automations.md`.
- `docs/automations.md`.
- PR #726 e `docs/lousa-plano-base-e19-5.md` somente como fonte conceitual do escopo amplo futuro de múltiplos drafts; não como plano executável atual nem fonte para detalhar a E19.5 dentro deste documento.
- `supabase/migrations/20260807162417_e19_2_3_account_landing_page_onboarding_configuration.sql` para a proteção write-once da configuração original da E19.2.
- `lib/lp-builder/adapters/landingPagesAdapter.ts` para o boundary vigente de criação de LP `draft` independente.
- Artefatos SQL da materialização E19.4 preservados pelo PR #729, somente como fonte real já existente para o debate de persistência.
- E10.8 e sua implementação somente para identificar acoplamentos atuais, consumidores existentes e proteções de identidade/versionamento que precisem ser preservadas, não como fonte obrigatória da pesquisa do Cenário E.

### 1.5. Questões ainda abertas e não decididas

- Como materializar no schema vigente a seleção operacional da pesquisa integral por `taxon + audience_scope`, preservando a decisão já aceita de GitHub como fonte das versões e Supabase como estado da versão selecionada, sem reutilizar indevidamente a pesquisa estruturada da E10.8.
- Qual é o menor mecanismo físico compatível com o runtime vigente para fornecer essa pesquisa integral à E19.3, sem presumir banco, rota, serviço ou nova infraestrutura.
- Quais critérios e testes mínimos serão usados pelo humano com apoio da IA para decidir se uma nova versão melhora suficientemente a pesquisa e deve substituir a seleção vigente.
- Dependência: E19.3 deve ser ajustada para transportar pesquisa integral aprovada, preservando `identities + modelContext + serverContext`; o contrato técnico e a implementação desse ajuste pertencem ao plano próprio da E19.3.
- Se a geração deve ocorrer em uma única chamada que planeja e escreve a LP ou em mais de uma etapa/chamada controlada, sem transformar o fluxo em agente.
- Qual é o menor conjunto de primitivas, layouts, cardinalidades e interações necessário para materializar e renderizar a primeira LP real sem HTML/CSS/JS livre.
- Se algum metadata mínimo e seguro derivado de `identities` ou `serverContext` precisa ser projetado ao modelo para decisão estrutural, como mera disponibilidade de logo, paleta ou destino de conversão, sem expor valores operacionais brutos.
- Como representar no Structured Output o planejamento narrativo e o conteúdo final sem criar um segundo DTO de domínio ou registry paralelo ao renderer.
- Quais referências de pesquisa/fatos a candidata deve devolver para permitir validação de uso sem exigir provenance cognitiva ou cadeia de raciocínio.
- Quais claims podem ser validados objetivamente, quais dependem de evidência concreta e quais só podem ser avaliados humanamente.
- Qual combinação `modelo + reasoning effort` cumpre os gates do workload com menor complexidade, custo e latência conforme o protocolo de `docs/openai-model-snapshot.md`.
- Como adaptar ou substituir o snapshot antigo da materialização para registrar corretamente o workload e o contexto efetivamente exposto sem armazenar raciocínio privado.
- Qual superfície real disponibilizará o preview privado da primeira LP; o path histórico `/a/[account]/landing-pages/[landingPageId]/preview` é referência, não decisão fechada enquanto a rota vigente não for confirmada.
- Quais critérios objetivos e humanos definirão que a primeira LP do Cenário E é funcional e suficientemente avaliável para encerrar a E19.4, sem exigir estabilização editorial completa antes da E19.5 Light.

### 1.6. Direção aprovada — E → E19.5 Light → iterações

- Prosseguir somente com o Cenário E até existir uma E19.4 funcional ponta a ponta: pesquisa integral aprovada + fatos concretos E19.2/E20.2 + limites E18.4 → E19.3 mínima → geração por IA → candidata estruturada → validação → materialização → renderer → preview privado.
- Não implementar E19.4 D antes de E e não manter D como comparação obrigatória.
- Antes da E19.4 E, fechar somente o necessário para tornar a pesquisa integral uma entrada operacional autorizada e ajustar a E19.3 em seu recorte próprio; não criar nova camada de inteligência intermediária.
- Após a E19.4 E funcional, E19.5 Light deverá permitir novos `drafts` independentes para iterações E1/E2/E3, sem overwrite e sem conhecer a representação interna da pesquisa.
- O contrato detalhado, UI, defaults, write-once e demais decisões da E19.5 Light pertencem ao documento e ao debate próprios da E19.5.

## 2. Contrato do caso

### 2.1. Fluxo lógico em construção

- Gatilho:
  - ação humana explícita na jornada operacional da conta inicia a geração da LP completa;
  - papéis, entitlement e superfície exatos serão confirmados contra o runtime vigente antes da v1.
- Entrada:
  - LP legítima em `draft` e configuração vinculada;
  - pesquisa integral `end_customer` aprovada e identificável por taxon, audience e versão;
  - sucesso integral da E19.3 ajustada ao Cenário E;
  - configuração OpenAI autorizada para o workload E19.4.
- Processamento:
  - revalidar autorização antes do provider;
  - obter o pacote E19.3 sem fazer a E19.4 reler diretamente E10.8, E18.4, E20.2, E18.5 ou E20.3;
  - construir a requisição a partir do prompt canônico versionado do workload e do contexto autorizado;
  - permitir que a IA sintetize público efetivo, oferta, estágio do funil, intenção de conversão e jornada persuasiva, respeitando a precedência dos fatos concretos sobre recomendações amplas da pesquisa;
  - produzir candidata completa dentro da fonte estrutural canônica mínima da primeira LP;
  - combinar deterministicamente destinos, bindings, assets e demais valores server-side que não pertencem à decisão textual da IA;
  - validar integralmente a candidata antes de qualquer materialização.
- Validação:
  - aplicar validações determinísticas somente ao que for objetivamente comprovável pelo contrato;
  - separar explicitamente validação estrutural/factual de avaliação humana editorial e visual.
- Persistência:
  - reutilizar o agregado de materialização já existente se ele continuar adequado ao contrato do Cenário E;
  - não criar nova persistência sem gap real demonstrado e decisão no plano.
- Consumo:
  - renderer privado e read-only reproduz a LP a partir do estado materializado, sem reler fontes mutáveis para recompor a página.
- Fallback:
  - falha de autorização, pesquisa integral, contexto, provider, schema ou validação não materializa a candidata;
  - comportamento de nova tentativa humana e concorrência será fechado no contrato antes da v1.

### 2.2. Papel da IA

- Interpretar o conteúdo semântico do `modelContext` da E19.3 como um todo, preservando a distinção de autoridade entre pesquisa e fatos concretos.
- Sintetizar internamente o público efetivo da LP e manter toda a narrativa coerente com esse recorte.
- Identificar a oferta concreta, intenção comercial, estágio do funil e ação desejada.
- Escolher uma progressão persuasiva adequada ao caso, sem obrigação de reproduzir literalmente uma fórmula fixa.
- Planejar quantidade, sequência e função narrativa das seções dentro do conjunto estrutural permitido.
- Escolher layouts apenas entre alternativas expressamente suportadas pela fonte estrutural canônica mínima vigente.
- Produzir copy, headings, supporting copy, CTA textual, FAQs e demais conteúdos admitidos pela estrutura escolhida.
- Omitir conteúdo sem função comercial clara e repetir CTA ou argumento apenas quando houver função narrativa legítima.
- Usar somente fatos, pesquisa e evidências efetivamente autorizados no pacote; não inventar credenciais, resultados, depoimentos, garantias, escassez, preços, benefícios ou capacidades.
- Não usar `itemKey`, `priority`, `sortOrder` ou path/origem textual da pesquisa como regra de composição, allowlist editorial, selector de copy ou branching do prompt.

### 2.3. Papel determinístico do LP Factory

- Autorizar ator, conta, membership e entitlement.
- Resolver e entregar o pacote E19.3 sem permitir consulta direta do modelo às fontes internas do projeto.
- Definir o menor contrato estrutural finito necessário à primeira LP real e derivar dele as projeções necessárias para IA, validator, materialização e renderer, sem registries estruturais paralelos.
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
- Endpoint, número de chamadas, `max_output_tokens`, timeout, retry, tools e demais parâmetros permanecem questões a fechar a partir do workload real e da documentação OpenAI vigente.

### 2.5. Fonte estrutural canônica e projeções derivadas

- A E19.4 deve possuir uma única fonte canônica de estrutura, finita e versionada, exclusivamente para controlar a forma da candidata e permitir validação/materialização/renderização determinísticas.
- A primeira versão deve conter somente as primitivas, layouts, campos, cardinalidades e interações necessárias para produzir a primeira LP real do Cenário E.
- Novas primitivas, layouts ou capacidades entram apenas quando um caso concreto demonstrar necessidade; não antecipar extensibilidade hipotética nem reconstruir a amplitude da antiga E18.5.
- Dessa fonte devem ser derivadas deterministicamente as projeções necessárias para Structured Output da IA, validação, estado materializado e renderer; essas projeções podem ter shapes físicos diferentes sem criar autoridades estruturais paralelas.
- A IA pode escolher somente estruturas e layouts pertencentes à fonte vigente.
- Header e Footer devem ser representáveis no mesmo contrato e não tratados como markup arbitrário fora dele.
- O contrato não pode aceitar HTML/CSS/JS livre nem componente desconhecido.

### 2.6. Jornada persuasiva

- A LP deve ser tratada como uma sequência comercial completa, não como preenchimento independente de blocos.
- O anúncio, busca, conteúdo ou outro canal anterior pode conquistar a atenção inicial; o Hero precisa revalidar essa atenção, confirmar relevância e gerar interesse.
- O corpo deve desenvolver entendimento, valor percebido, desejo e confiança e tratar objeções relevantes na ordem apropriada ao caso.
- A ação não precisa existir somente no final; CTA pode aparecer cedo e se repetir quando o estágio do funil e a narrativa justificarem.
- AIDA é referência útil para coerência persuasiva, mas não define quantidade fixa de seções ou posições obrigatórias.
- A sequência deve refletir o público efetivo, a oferta concreta e o estágio do funil presentes no pacote E19.3.

### 2.7. Factualidade, pesquisa e evidência

- A configuração E19.2/E20.2 define a realidade concreta da conta, oferta e LP; a pesquisa de mercado fornece contexto externo sobre público e mercado e não pode ampliar capacidades ou oferta do cliente.
- Fato concreto aplicável e presente pode sustentar copy; fato declarado não se torna automaticamente prova verificada.
- Ausência de evidência concreta deve permanecer ausência; não inventar `evidence_id`, selo, testemunho ou marca de verificação.
- Claims de resultado, garantia, escassez, credencial verificada, prova social ou comparação objetiva só podem ser usados quando houver suporte real autorizado.
- A pesquisa pode fornecer fatos externos legítimos e atuais sobre público, mercado, legislação, comportamento, SEO ou processo, desde que preservadas suas fontes, limitações e natureza e sem convertê-los em capacidade concreta da conta.
- A forma de referenciar quais partes da pesquisa/fatos sustentaram partes da candidata permanece questão aberta; não exigir cadeia de raciocínio nem provenance cognitiva.
- A factualidade e a qualidade da narrativa não podem depender de `itemKey` ou outros metadados da antiga representação estruturada.

### 2.8. Materialização, snapshot e renderer

- Os artefatos SQL da materialização antiga foram preservados pelo PR #729 e devem ser avaliados antes de qualquer proposta de banco nova.
- O estado materializado deve ser suficiente para reproduzir a LP sem reler E19.3, E20.2, E10.8, E18.5 ou E20.3.
- O snapshot deve preservar somente o necessário para auditar e reproduzir a geração: identidades, versões, configuração do workload e contexto efetivamente exposto, sem raciocínio privado.
- O renderer deve consumir uma projeção derivada da mesma fonte estrutural canônica usada pelo Structured Output e validator, sem registry próprio paralelo.
- Aparência, Header, Footer, seções, layouts e conteúdo devem ser reproduzidos de forma determinística a partir do estado congelado.
- O detalhe exato de versão, shape e adaptação da materialização existente permanece aberto até a inspeção estrutural do contrato mínimo da primeira LP.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e validação integral da candidata

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: sim em princípio por decisão humana de participação central da IA; categoria final pendente da consulta obrigatória ao Gestor de Automação antes da v1.
- Objetivo:
  - transformar o pacote E19.3 do Cenário E em uma candidata completa da primeira LP real, com planejamento narrativo e copy produzidos por IA dentro do contrato estrutural mínimo e validação determinística antes da persistência.
- Dependências anteriores à execução:
  - pesquisa integral aprovada com contrato operacional mínimo;
  - E19.3 ajustada em seu recorte próprio para transportar essa pesquisa preservando `identities + modelContext + serverContext`.
- Questões indispensáveis ainda abertas:
  - contrato estrutural mínimo e suas projeções;
  - prompt canônico versionado;
  - número de chamadas/etapas;
  - `modelo + reasoning effort` conforme protocolo comparativo do snapshot;
  - Structured Output e schema;
  - factualidade/evidência;
  - casos representativos do workload;
  - critérios de aceite da candidata.

### 3.2. E19.4.4 — Materialização inicial e snapshot imutável

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: não, salvo nova decisão humana baseada em necessidade real.
- Objetivo:
  - persistir a primeira candidata integral válida em estado próprio e reproduzível, com snapshot coerente com o Cenário E e sem dependência futura de fontes mutáveis.
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

- Fechar exclusivamente o primeiro Gate: contrato operacional mínimo da pesquisa integral aprovada e critérios suficientes de qualidade para seu uso na geração, sem recriar atomização.
- Decisão parcial já fechada neste Gate: GitHub preserva as versões integrais; `v1` é o default quando for a única versão; versões posteriores são avaliadas por testes e decisão humana apoiada pela IA; a última versão explicitamente aprovada permanece selecionada no Supabase até nova aprovação.
- Se uma nova versão não entregar qualidade suficiente, a seleção vigente permanece; prompt e/ou pesquisa podem ser ajustados, uma nova versão produzida e os testes repetidos.
- O restante desse Gate deve responder como materializar essa seleção no schema vigente, como obter exatamente o conteúdo usado, como falhar quando não existir e quais testes mínimos sustentam a decisão de aprovação.
- Depois do fechamento desse Gate, tratar o ajuste necessário da E19.3 em seu documento próprio e somente então retornar aos Gates internos da E19.4.
- Na E19.4, fechar progressivamente prompt/workflow, contrato estrutural mínimo, factualidade/evidência, modelo/effort, materialização/snapshot, renderer e critérios de avaliação humana.
- Quando a LP gerada não atingir a qualidade desejada, priorizar diagnóstico nesta ordem: E19.4 quando o contexto estiver correto mas a interpretação/composição falhar; pesquisa quando faltar conhecimento, nuance, atualidade ou evidência; E19.3 somente quando existir gap real de autorização, identidade, separação ou transporte do contexto.
- Consultar o Gestor de Automação antes da consolidação da v1, conforme `docs/prompt-estrategista.md` e a governança de prompt vigente após o PR #730.
- Concluir primeiro a E19.4 E funcional; depois abrir/reformular o recorte E19.5 Light em seu documento próprio para permitir as iterações E1/E2/E3.
- Não atualizar `docs/roadmap.md` enquanto este arquivo permanecer rascunho vivo; a atualização planejada do roadmap ocorre após a consolidação da v1 conforme o fluxo canônico.
- Não iniciar implementação da E19.4 antes da v1 e dos gates subsequentes do processo escolhido.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4 neste momento

- Publicação pública, domínio customizado e disponibilidade comercial.
- Tracking, analytics, CRM, Ads, A/B test e engine de experimentos.
- Detalhamento ou implementação da E19.5 Light dentro deste recorte; ela é sucessora planejada e possui documento próprio.
- Editor visual, edição manual ampla, histórico e rollback.
- Implementação da E19.4 D ou comparação D × E como requisito da primeira geração real.
- Consulta direta da IA a E10.8, E18.4, E20.2, E18.5 ou E20.3.
- Reintrodução de E18.5 ou E20.3 como gate obrigatório da geração.
- Camada intermediária de resumo que consolide pesquisa + E19.2 antes da E19.4.
- Recriação de `itemKey`, `priority`, `sortOrder`, quatro registros-pai, 59 itens ou representação equivalente como requisito da geração.
- Detalhamento técnico do ajuste da E19.3 dentro deste plano; seu contrato e implementação pertencem ao recorte próprio da E19.3.
- Acoplamento da E19.4 a path Markdown ou representação interna específica da pesquisa integral.
- HTML, CSS, React, JavaScript, scripts ou componentes arbitrários gerados pela IA.
- Catálogo estrutural amplo antecipado, reconstrução da antiga E18.5 ou extensibilidade sem caso concreto para a primeira LP.
- Agents SDK, multi-agent, job, fila, cron, webhook, browsing ou tools externas sem necessidade real demonstrada e nova decisão humana.
- Novo banco, tabela, migration, rota, serviço, engine ou infraestrutura antes de demonstrar gap real nas estruturas preservadas do projeto.
- Perfil persistido novo de público, persona ou estratégia apenas para facilitar o prompt.

### 4.2. Critérios de parada imediata

- Parar e voltar ao debate humano se a pesquisa integral ou o pacote E19.3 demonstrar faltar informação indispensável sem que exista fonte canônica autorizada.
- Parar se a solução tentar compensar pesquisa insuficiente recriando automaticamente uma camada determinística de atomização, ranking, RAG, chunking, allowlist ou seleção semântica sem evidência de necessidade.
- Parar se a solução exigir mapa nominal crescente de nichos, fields ou componentes específico para corretor de imóveis dentro da E19.4.
- Parar se o contrato estrutural crescer principalmente por extensibilidade hipotética sem consumidor real na primeira LP.
- Parar se a IA precisar inventar facts, evidências, credenciais, destinos ou capacidades para completar a candidata.
- Parar se a materialização só puder reproduzir a LP relendo fontes mutáveis e alterando silenciosamente conteúdo ou aparência.
- Parar se surgir necessidade de agente, automação adicional, engine ou infraestrutura não sustentada por fonte real do projeto.
- Toda mudança material de escopo ou de categoria de automação volta ao humano antes de consolidar a v1.

### 4.3. Critério provisório de conclusão do recorte

- A E19.4 deverá ser considerada funcionalmente concluída quando uma LP real do fluxo oficial:
  - for gerada a partir de pesquisa integral aprovada + fatos concretos E19.2/E20.2 + limites E18.4, transportados pela E19.3 do Cenário E;
  - apresentar jornada comercial coerente e avaliável do interesse à ação;
  - respeitar a autoridade da configuração concreta sobre a pesquisa ampla;
  - respeitar fatos, limites e evidências autorizados;
  - for materializada integralmente em `draft`;
  - for reproduzida privadamente por renderer determinístico;
  - puder ser avaliada humanamente como uma landing page real quanto a narrativa, copy, estrutura, responsividade, acessibilidade e qualidade visual.
- A conclusão funcional da E19.4 não exige que prompt, modelo, effort, composição narrativa ou visual estejam editorialmente estabilizados; essas iterações poderão prosseguir após a E19.5 Light por meio de novos drafts preservados.
- Este critério ainda é provisório enquanto o rascunho não virar plano-base v1.
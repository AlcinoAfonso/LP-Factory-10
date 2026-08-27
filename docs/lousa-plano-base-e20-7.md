# 27/08/2026 — Rascunho vivo — E20.7 — Liberação taxonômica para geração de Landing Pages

## 1. Estado

### 1.1. Natureza do documento

- Status: rascunho vivo em debate humano; ainda não constitui plano-base v1 nem autorização de implementação.
- Caso macro: `E20 — Preparação e liberação de taxons para geração de landing pages`.
- Recorte proposto: `E20.7 — Liberação taxonômica para geração de Landing Pages`.
- Objetivo deste rascunho: registrar progressivamente as decisões humanas sobre liberação taxonômica, fontes de conhecimento para geração e ordem de validação necessária antes de qualquer mudança estrutural no pipeline de Landing Pages.
- Decisão humana de 27/08/2026: adotar como direção funcional a **Opção A — pesquisa profunda preferencial por nicho e especialização relevante, com fallback dinâmico quando não existir pesquisa profunda especializada**.
- A decisão da Opção A não autoriza implementação imediata: primeiro deve ser comprovado o valor de uma pesquisa profunda redesenhada para a qualidade da LP.
- As definições adjacentes do debate E19.5.4 no PR #822 são consumidas somente onde afetam a seleção e a consulta de conhecimento; a E20.7 não redefine identidade da LP, agrupamento, workspace ou representação física de ofertas.

### 1.2. Fontes usadas

- `README.md` — visão do produto, simplicidade do MVP, comunicação comercial por nicho e princípio de menor complexidade capaz de cumprir os gates.
- `docs/roadmap.md` — estado e fronteiras de E20, E19, E21 e E9.
- `docs/lousa-plano-base-e20-2.md` — catálogo declarativo e herança `universal → segmento → nicho → ultranicho`.
- `docs/lousa-plano-base-e20-5.md` — seleção da pesquisa integral `end_customer` por taxon.
- `docs/lousa-plano-base-e20-6.md` — suficiência factual e predicado derivado de taxon preparado.
- `docs/lousa-plano-base-e19-3.md` — pacote autorizado, pesquisa consultiva e fatos concretos revalidados.
- `docs/lousa-plano-base-e19-4.md` — geração, materialização, snapshot e baseline de qualidade persuasiva da primeira LP real.
- `docs/lousa-plano-base-e19-5.md` — workspace, configuração contextual por LP, contrato vigente de oferta e separação entre scopes compartilhados e contextuais.
- PR #822 / `docs/matriz-debate-e19-5-4.md` — fonte adjacente em rascunho para o modelo mental da LP, especialmente `landing_page_offering_scope`, papel de `funnel_stage`, `transaction_intent`, `primary_conversion_goal`, `business_offerings_summary` e os seis resultados desejados de qualidade; não é autoridade executável enquanto permanecer em debate.
- `docs/schema.md` — estrutura vigente de `business_taxons`, `account_taxonomy`, `account_landing_page_shared_configurations` e `account_landing_page_configurations`.
- `lib/conversion-content/landing-page/input-catalog/taxon-chain.ts` — validação executável da cadeia taxonômica.
- `lib/lp-builder/generationContext.ts`, `lib/lp-builder/generationContextContracts.ts` e `lib/lp-builder/landingPageRevision.ts` — coerência vigente entre taxon servido, pesquisa autorizada, fatos e snapshot.
- `lib/lp-builder/landingPageDraftGeneration.ts` e `lib/conversion-content/landing-page/presentation/prompt.ts` — geração vigente em uma chamada textual sem tools e uso de `modelContext.research` como contexto consultivo.
- `lib/admin/adapters/adminTaxonomyAdapter.ts` e `components/admin/AdminTaxonCreateForm.tsx` — criação administrativa vigente e exigência de taxon pai.

## 2. Decisões humanas já consolidadas neste debate

### 2.1. Níveis elegíveis para geração

- `segment` é camada de classificação e herança; não é unidade servível para geração de Landing Page.
- `niche` pode ser unidade servível para geração de Landing Page.
- `ultra_niche` pode ser unidade servível para geração de Landing Page, mas não é obrigatório para que um nicho seja utilizável.
- A taxonomia representa a identidade estável do negócio; serviço, produto ou oferta específica de uma Landing Page não deve ser promovido automaticamente a ultranicho.
- Exemplo conceitual: uma clínica geral pode permanecer em `Odontologia` e criar uma LP cuja oferta seja `Implante dentário`; somente uma decisão taxonômica própria justificaria classificar a conta em um ultranicho correspondente.

### 2.2. Hierarquia obrigatória

- `segment` é raiz e não possui pai.
- `niche` exige exatamente um pai de nível `segment`.
- `ultra_niche` exige exatamente um pai de nível `niche`, que por sua vez pertence a um `segment`.
- Não existe nicho ou ultranicho operacional isolado da cadeia canônica.
- A regra já é aplicada pela criação administrativa vigente e pelo resolver do catálogo E20.2; este recorte deve preservá-la, não criar uma segunda autoridade.

### 2.3. Regra de herança dos fields E20.2

- A resolução continua cumulativa na ordem `universal → segmento → nicho → ultranicho`.
- Um field só deve nascer em uma camada ancestral quando sua semântica for válida para os descendentes abrangidos por essa camada.
- Fields específicos de uma profissão ou especialidade não devem ser elevados ao segmento apenas para reutilização.
- Exemplo conceitual: em um segmento amplo como `Saúde e Bem-estar`, `CRM` não é field apropriado do segmento porque não se aplica a odontologia e a outras atividades; eventual registro médico pertence ao nicho médico correspondente, enquanto registro odontológico pertence ao nicho odontológico correspondente.
- Nichos e ultranichos herdam os fields válidos dos ancestrais e acrescentam ou especializam somente o necessário, conforme o contrato E20.2 vigente.
- A escolha de uma pesquisa profunda especializada para uma LP **não altera automaticamente a cadeia factual E20.2 usada pela conta ou LP**.
- Se uma pesquisa especializada revelar necessidade factual nova e real, esse achado retorna ao fluxo normal E20.6 → E20.2 para avaliação e evolução na camada semanticamente correta; não se cria field apenas para acompanhar a escolha da pesquisa.
- A orientação adjacente do PR #822 converge com essa fronteira: a IA da E20.6 pode recomendar necessidade e camada taxonômica, mas humano mantém decisão final e E20.2 permanece a autoridade que materializa o contrato factual aprovado.

### 2.4. Taxon versus escopo comercial da LP

- Taxon responde essencialmente `que tipo de negócio é este?`.
- O escopo comercial da LP responde `o que esta landing page vai divulgar?`.
- O debate E19.5.4 do PR #822 registra `landing_page_offering_scope` como nome técnico da dimensão de identidade destinada a representar esse escopo, substituindo a semântica singular de `primary_service_or_offer` quando o novo contrato for consolidado.
- `landing_page_offering_scope` deve admitir conceitualmente três casos: `uma oferta/serviço`, `um conjunto selecionado de ofertas/serviços` ou `o portfólio amplo do negócio`.
- A E20.7 consome essa semântica para decidir qual conhecimento pesquisar; não é proprietária da definição final, persistência, UI ou forma física de `landing_page_offering_scope`.
- `business_offerings_summary` permanece contexto compartilhado, livre, opcional e não exaustivo; não é whitelist nem autoridade suficiente para escolher automaticamente pesquisa especializada.
- A correspondência entre o escopo comercial informado e uma pesquisa profunda especializada pode ser sugerida semanticamente no futuro, mas texto livre, resumo do negócio ou nome da LP não se tornam autoridade taxonômica automaticamente.
- Essa separação evita explosão taxonômica por produto, serviço, campanha ou página e evita que E20.7 crie um segundo mecanismo de ofertas concorrente com E19.5.4.

### 2.5. Opção A — pesquisa profunda preferencial com fallback dinâmico

- A decisão humana vigente substitui a formulação anterior de `taxon de geração da LP` como segunda autoridade taxonômica operacional.
- O taxon primário da conta permanece a identidade taxonômica estável do negócio.
- A geração deve preferir a pesquisa profunda mais específica, autorizada e aplicável ao foco comercial da LP quando ela existir.
- Quando `landing_page_offering_scope` representar **uma oferta/serviço** e houver pesquisa profunda especializada correspondente, essa pesquisa é a fonte profunda preferencial.
- Exemplo: conta `Odontologia` + LP focada em `Implante dentário` usa a pesquisa profunda de `Implante dentário` quando essa pesquisa especializada existir e estiver autorizada.
- Se não existir pesquisa profunda especializada para a oferta única, a direção de fallback é usar a pesquisa profunda do nicho-base como base e complementar somente a especificidade necessária com pesquisa dinâmica focada na oferta.
- Quando `landing_page_offering_scope` representar **um conjunto selecionado de ofertas/serviços**, não selecionar arbitrariamente uma das ofertas como pesquisa principal; a direção padrão é usar a pesquisa profunda do nicho-base e complementar dinamicamente apenas o conhecimento adicional que o conjunto realmente exigir.
- Quando `landing_page_offering_scope` representar **o portfólio amplo do negócio**, a direção padrão é usar a pesquisa profunda do nicho-base; não pesquisar individualmente cada serviço apenas porque faz parte do portfólio.
- Se uma futura representação de escopo demonstrar que um conjunto inteiro corresponde de forma inequívoca a uma especialização taxonômica preparada, essa hipótese deverá voltar ao planejamento antes de alterar a regra padrão; não inferir esse caso por conveniência.
- Se existir pesquisa profunda especializada suficiente para o foco da LP, não há obrigação de enviar também a pesquisa profunda ancestral; a pesquisa especializada deve ser desenhada para ser autossuficiente dentro do seu escopo e evitar redundância, conflito e crescimento desnecessário de contexto.
- Pesquisa dinâmica é fallback/complemento de conhecimento, não nova autoridade taxonômica, não fonte de fatos concretos do cliente e não autorização para alterar E20.2.
- A ausência de pesquisa profunda em uma especialização não bloqueia por princípio a geração futura; ela direciona ao fallback dinâmico, sujeito ao desenho técnico e aos gates ainda pendentes deste rascunho.
- A Opção A engloba operacionalmente a alternativa antes chamada de pesquisa profunda apenas no nicho + pesquisa dinâmica para especificidades: basta não produzir pesquisa profunda especializada quando custo-benefício ou escala não justificarem sua manutenção.
- A estratégia permite começar com poucas pesquisas profundas, ampliar a biblioteca quando houver valor/reutilização e manter cobertura funcional por pesquisa dinâmica onde ainda não houver ativo especializado.

### 2.6. Modelo de conhecimento e contexto comercial da geração

- A geração deve preservar três classes conceituais distintas de informação.
- **Pesquisa profunda autorizada** fornece conhecimento de mercado e comportamento do público, com profundidade obtida fora do caminho interativo de geração e reutilização entre LPs compatíveis.
- **Pesquisa dinâmica complementar** fornece conhecimento específico ou atual que a pesquisa profunda aplicável não cobre suficientemente; sua necessidade, mecanismo, limites, fontes e momento exato no pipeline ainda dependem de planejamento e prova.
- **Fatos concretos do cliente/LP** permanecem sob E20.2/E19.5 e fontes autoritativas vigentes; pesquisa profunda ou dinâmica não pode criar preço, disponibilidade, localização, credencial, prova social, condição comercial ou outro fato objetivo da conta/oferta sem fonte factual autorizada.
- Pesquisa profunda e pesquisa dinâmica orientam conhecimento consultivo/persuasivo; fatos concretos continuam sendo autoridade para claims verificáveis.
- `funnel_stage` e `transaction_intent`, quando aplicável ao taxon, devem influenciar **como o conhecimento profundo/dinâmico é consultado e aplicado à persuasão**, porque alteram o momento e a intenção comercial da LP; eles não criam automaticamente uma nova pesquisa profunda para cada combinação nem escolhem sozinhos outro taxon de pesquisa.
- `transaction_intent` não deve ser universalizado artificialmente; quando não for aplicável ao taxon, sua ausência não cria substituto semântico inventado para orientar pesquisa.
- `primary_conversion_goal` permanece estratégia de conversão e, conforme o debate E19.5.4, não integra o núcleo da identidade; mudar o goal não deve, por si só, trocar a pesquisa profunda selecionada, embora continue orientando a construção da conversão durante a geração.
- O novo contrato de pesquisa e o prompt de geração devem permitir que a mesma pesquisa profunda relevante seja consultada sob diferentes estágios de funil e intenções comerciais sem transformar a pesquisa em wireframe ou roteiro fixo.
- O diferencial de produto buscado não é a existência formal de um arquivo de pesquisa, mas a capacidade de produzir comunicação comercial de maior qualidade usando conhecimento relevante, confiável, profundo e suficientemente atual com custo e latência aceitáveis.

### 2.7. Evolução necessária da pesquisa profunda

- Antes de mudar estruturalmente E19.3/E19.4/E19.5, o projeto deve avaliar e melhorar a matéria-prima de pesquisa profunda atualmente fornecida à geração.
- A pesquisa profunda não deve predeterminar decisões que pertencem ao workload criativo de geração.
- Devem ser removidos ou evitados como autoridade prescritiva da pesquisa: wireframe, sequência fixa de seções, quantidade de seções, headline pronta, CTA obrigatório, layout, composição visual e arquitetura fechada da LP.
- O novo contrato de pesquisa deve priorizar conhecimento necessário para persuasão e compreensão do mercado, incluindo, quando aplicável: públicos e subpúblicos, jobs-to-be-done, objetivos, dores, medos, desejos, objeções, critérios de decisão, alternativas percebidas, jornada de compra, sinais de confiança, linguagem e vocabulário, expectativas, comportamento, particularidades regulatórias relevantes, diferenças regionais relevantes, tendências, evidências, fontes, limitações e incertezas.
- O conteúdo profundo deve ser suficientemente rico para sustentar diferentes `funnel_stage` e `transaction_intent` aplicáveis sem exigir uma Deep Research distinta para cada combinação; a diferenciação de uso pertence à consulta/generation context, salvo necessidade de conhecimento materialmente diferente comprovada.
- O contrato deverá distinguir conteúdo estrutural/relativamente estável de informação temporal/volátil, permitindo que a geração ou um passo controlado futuro identifique com clareza o que pode precisar de atualização dinâmica.
- A pesquisa deve preservar fontes, evidências, inferências, condições, exceções e limitações sem transformar recomendações analíticas em fatos do cliente.
- O formato final, granularidade, tamanho, estrutura e forma de consulta pela IA ainda devem ser definidos antes do novo prompt de Deep Research.
- Pesquisas antigas permanecem preservadas/versionadas; uma pesquisa redesenhada nasce como nova versão, sem overwrite silencioso da pesquisa selecionada vigente.

### 2.8. Escopo de oferta e LP multi-serviço

- A UX não deve exigir que o cliente compreenda `taxon`, `ultranicho`, E20.2, E20.5 ou E20.6; a pergunta de produto adotada no debate E19.5.4 é `O que esta landing page vai divulgar?`.
- A E20.7 adota os três escopos conceituais definidos no debate E19.5.4 exclusivamente para orientar a seleção/consulta do conhecimento: uma oferta/serviço, um conjunto selecionado ou o portfólio amplo.
- Página de uma oferta pode usar pesquisa profunda especializada quando existir.
- Página de conjunto selecionado usa por padrão a pesquisa profunda do nicho-base e complemento dinâmico somente quando necessário; não dispara uma pesquisa profunda por item.
- Página de portfólio amplo usa por padrão a pesquisa profunda do nicho-base; a simples amplitude do portfólio não justifica múltiplas pesquisas dinâmicas.
- Página especializada pode mencionar serviços secundários sem transformar todos em pesquisas obrigatórias ou novos taxons.
- `business_offerings_summary` continua sendo contexto compartilhado e não resolve a seleção estruturada de parte do portfólio.
- A menor representação funcional e física de `landing_page_offering_scope` pertence à E19.5.4/E19.5 e permanece aberta enquanto o PR #822 não for consolidado; a E20.7 não antecipa lista, tabela, coluna, enum de persistência ou UI própria.
- Itens livres repetidamente informados podem se tornar sinal de demanda para nova pesquisa profunda especializada e eventual evolução taxonômica, mas nunca criam taxon, pesquisa ou automação automaticamente.

## 3. Rota conceitual da primeira parte — preparação do taxon e validação da estratégia de pesquisa

### 3.1. Sequência de preparação taxonômica preservada

- Criar ou validar o taxon e sua cadeia canônica.
- Exigir que o taxon servível seja `niche` ou `ultra_niche` ativo.
- Produzir, arquivar e versionar a pesquisa profunda `end_customer` do taxon quando houver decisão de mantê-la como ativo preparado.
- E20.5 continua selecionando explicitamente a versão profunda autorizada por taxon no contrato vigente enquanto este rascunho não aprovar mudança própria.
- E20.6 continua confrontando pesquisa selecionada e E20.2 para a responsabilidade factual vigente do taxon, sem ser reinterpretada neste rascunho como gate automático de seleção de pesquisa para qualquer LP ancestral.
- Se houver gap factual real, o ajuste retorna à E20.2 e segue seu lifecycle versionado; a E20.2.8 governa publicação e propagação da nova versão.
- A relação futura entre `taxon preparado` e `pesquisa profunda especializada utilizável por LP de conta ancestral` deve ser planejada explicitamente; não assumir equivalência automática entre esses conceitos.

### 3.2. Limite do estado `taxon preparado`

- `taxon preparado` preserva o significado vigente da E20.6 até plano-base aprovado em sentido contrário.
- Não significa disponibilidade comercial.
- Não significa entitlement de uma conta.
- Não significa configuração concreta completa de cliente ou LP.
- Não significa que toda LP de conta ancestral deva usar automaticamente a pesquisa daquele taxon.
- Não significa LP gerada, aprovada ou publicada.

### 3.3. Ordem obrigatória antes da implementação da Opção A

- **Gate 1 — definir o contrato ideal da pesquisa profunda:** estabelecer conteúdo, limites, estrutura, distinção estável/volátil, fontes, evidências, exclusões prescritivas e capacidade de consulta por `funnel_stage`/`transaction_intent` sem transformar pesquisa em arquitetura de LP.
- **Gate 2 — criar o novo prompt de Deep Research:** produzir prompt próprio somente depois do contrato do Gate 1; o prompt não deve reconstruir wireframe, seções ou composição da LP como obrigação da pesquisa.
- **Gate 3 — produzir nova pesquisa piloto:** gerar uma nova versão de pesquisa profunda para um caso real já atendido pelo projeto, preservando a pesquisa anterior para comparação.
- **Gate 4 — gerar LP comparável:** usar a nova pesquisa piloto no pipeline controlado, sem misturar simultaneamente outras grandes mudanças de geração que impeçam atribuir o efeito observado.
- **Gate 5 — comparar qualidade, custo e latência:** usar como régua de produto os seis resultados desejados registrados na seção 3.1 da matriz de debate E19.5.4 do PR #822 e complementar a prova com factualidade, correção humana necessária, tokens, custo, latência e estabilidade; evitar criar uma segunda régua paralela de qualidade na E20.7.
- **Gate 6 — decidir o desenho técnico do fallback dinâmico:** somente após comprovar o valor da nova pesquisa profunda, definir onde a pesquisa dinâmica ocorre, quando é acionada, quais limites/ferramentas/fontes usa e como sua proveniência entra no snapshot.
- **Gate 7 — fechar deltas E20.5/E20.6/E19.3/E19.4/E19.5:** distinguir o que realmente precisa de mudança de contrato, persistência, UX, snapshot e workload; consumir o contrato de `landing_page_offering_scope` da E19.5.4 quando estiver consolidado, sem criar representação concorrente na E20.7.
- **Gate 8 — consolidar plano-base v1 da E20.7:** somente após os gates anteriores registrar escopo executável, atualizar `docs/roadmap.md` e autorizar implementação.

### 3.4. Hipóteses de impacto a validar, sem autorização técnica

- E20.2 pode permanecer sem mudança para provar a nova pesquisa; qualquer novo field depende de gap factual real identificado pelo fluxo competente.
- E20.5 já fornece seleção versionada de pesquisa profunda por taxon, mas poderá precisar evoluir se a política de reutilização entre conta ancestral e pesquisa descendente exigir nova semântica operacional.
- E20.6 não deve ser ampliada por inferência; sua relação com elegibilidade da pesquisa especializada será definida apenas após separar preparação factual de seleção de conhecimento.
- E19.3 hoje presume coerência entre taxon servido e pesquisa; uma futura Opção A operacional pode exigir nova versão do pacote que distinga autoridade factual, fonte de pesquisa e contexto comercial relevante.
- E19.4 hoje materializa e valida snapshot com a mesma coerência; a futura proveniência deverá registrar pesquisa profunda utilizada e, quando houver, pesquisa dinâmica complementar, sem alterar revisões históricas.
- O workload de geração propriamente dito já consome `modelContext.research` como contexto consultivo e facts separadamente; mudança de mecanismo de pesquisa não implica automaticamente novo renderer, nova apresentação ou nova infraestrutura.
- E19.5/E19.5.4 são a autoridade do modelo mental e do escopo comercial da LP; a E20.7 deve consumir `landing_page_offering_scope` quando consolidado e não criar mecanismo concorrente de oferta.
- A escolha de pesquisa especializada não é um field E20.2 e não deve ser inserida artificialmente em `account_landing_page_configurations.values`; sua menor residência operacional permanece para planejamento técnico posterior.
- `funnel_stage` e `transaction_intent` podem alterar a maneira de aplicar a pesquisa na narrativa; `primary_conversion_goal` não deve ser usado como chave de seleção da Deep Research.
- A E21.3 é candidata natural para consolidar evidências reproduzíveis de qualidade, correção humana, usage, latência, custo e estabilidade dos workloads, sem antecipar sua implementação neste rascunho.

## 4. Comercial — separação de autoridade

### 4.1. Decisão de fronteira

- Preparação factual do taxon, disponibilidade comercial, entitlement da conta, identidade/escopo comercial da LP e seleção de conhecimento permanecem conceitos distintos.
- O contrato vigente reserva E20.4 para disponibilidade comercial por `taxon + plano`; este rascunho não redefine essa autoridade.
- Entitlement da conta permanece responsabilidade comercial da E9 e é aplicado posteriormente no fluxo concreto da conta.
- A E19.5.4 permanece responsável pelo modelo mental da LP; a E20.7 utiliza somente o contexto necessário para resolver conhecimento e não redefine LP concreta, versão, grupo ou identidade.
- A segunda parte do debate deverá distinguir claramente: `taxon preparado`, `pesquisa profunda disponível`, `taxon comercialmente disponível` e `conta autorizada a gerar`.

## 5. Pontos ainda abertos

### 5.1. Debate pendente

- Definir o contrato exato da nova pesquisa profunda antes de redigir o novo prompt.
- Definir a pesquisa piloto e o método de comparação do Gate 5 sem alterar simultaneamente outras variáveis relevantes da geração.
- Definir como o sistema associa um `landing_page_offering_scope` de uma oferta única a uma pesquisa profunda descendente existente, preservando confirmação/autoridade adequada e sem transformar texto livre, `business_offerings_summary` ou nome da LP em vínculo taxonômico automático.
- Definir como a consulta da pesquisa profunda recebe `funnel_stage` e `transaction_intent` aplicável sem criar pesquisa separada por combinação nem antecipar decisões narrativas do workload de geração.
- Definir o fallback dinâmico: gatilho, escopo, profundidade, fontes, limites, timeout, custo, observabilidade, snapshot e comportamento diante de falha.
- Definir se a pesquisa dinâmica deve ocorrer como etapa controlada anterior à geração ou dentro de workload com tool, somente após os gates de qualidade.
- Definir a menor residência operacional para a referência à pesquisa especializada, se persistência for realmente necessária; não usar `account_landing_page_configurations.values` como atalho para um dado que não é field E20.2.
- Definir as alterações mínimas de contrato/proveniência em E19.3 e E19.4 quando a Opção A entrar em runtime.
- Reconciliar a E20.7 com a representação final de `landing_page_offering_scope` quando a E19.5.4 consolidar seu contrato, sem duplicar no documento próprio as regras de identidade, grupo ou workspace.
- Verificar se a disponibilidade comercial E20.4 precisa ser implementada para o MVP imediato ou apenas formalizada antes da abertura para novos clientes.
- Definir a segunda parte da rota: critérios de uma conta concreta para criar e gerar suas LPs quando o taxon já estiver preparado e comercialmente elegível.
- Somente após o fechamento dos gates e decisões aplicáveis consolidar plano-base v1, atualizar `docs/roadmap.md` e autorizar implementação.

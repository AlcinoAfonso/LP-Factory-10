# 27/08/2026 — Rascunho vivo — E20.7 — Liberação taxonômica para geração de Landing Pages

## 1. Estado

### 1.1. Natureza do documento

- Status: rascunho vivo em debate humano; ainda não constitui plano-base v1 nem autorização de implementação.
- Caso macro: `E20 — Preparação e liberação de taxons para geração de landing pages`.
- Recorte proposto: `E20.7 — Liberação taxonômica para geração de Landing Pages`.
- Objetivo deste rascunho: registrar progressivamente as decisões humanas sobre liberação taxonômica, fontes de conhecimento para geração e ordem de validação necessária antes de qualquer mudança estrutural no pipeline de Landing Pages.
- Decisão humana de 27/08/2026: adotar como direção funcional a **Opção A — pesquisa profunda preferencial por nicho e especialização relevante, com fallback dinâmico quando não existir pesquisa profunda especializada**.
- A decisão da Opção A não autoriza implementação imediata: primeiro deve ser comprovado o valor de uma pesquisa profunda redesenhada para a qualidade da LP.
- As definições adjacentes de `landing_page_offering_scope` originadas no debate E19.5.4/PR #822 foram consolidadas no plano-base E20.2.9 pelo PR #825; a implementação correspondente permanece em execução no PR #826. A E20.7 consome somente as consequências para seleção e consulta de conhecimento e não redefine identidade da LP, agrupamento, workspace ou persistência do escopo comercial.
- Gate 1 concluído em 27/08/2026: o contrato funcional da nova pesquisa profunda está definido na seção 2.7.
- Gate 2 concluído em 27/08/2026: `docs/prompt-nicho-pesquisa-mercado-experimental.md` foi evoluído como prompt experimental de Deep Research aderente ao contrato do Gate 1, preservando `docs/prompt-nicho-pesquisa.md` vigente para comparação controlada.
- Gate 3 concluído em 27/08/2026: a nova Deep Research de `corretor-imoveis/end_customer` foi aprovada e arquivada como `v2` pelo PR #827, preservando a `v1`.
- Gate 4 concluído em 27/08/2026: a revisão 6 da mesma LP foi gerada com a pesquisa `v2`, mantendo E20.2 v5, contexto factual, prompt, contrato de apresentação e configuração do workload textual comparáveis à revisão 5.
- Gate 5 concluído em 28/08/2026 com resultado **positivo parcial**: a pesquisa `v2` melhorou materialmente a qualidade persuasiva da LP sem introduzir regressão factual observada, mas uma única comparação não comprova estabilidade e a copy ainda permanece abaixo do padrão desejado; prompt de geração e renderer ficam registrados somente como achados fora deste recorte.
- Próximo gate: **Gate 6 — decidir o desenho técnico mínimo do fallback dinâmico**, sem abrir redesign de prompt textual ou renderer dentro da E20.7.

### 1.2. Fontes usadas

- `README.md` — visão do produto, simplicidade do MVP, comunicação comercial por nicho e princípio de menor complexidade capaz de cumprir os gates.
- `docs/roadmap.md` — estado e fronteiras de E20, E19, E21 e E9.
- `docs/lousa-plano-base-e20-2.md` — catálogo declarativo e herança `universal → segmento → nicho → ultranicho`.
- `docs/lousa-plano-base-e20-2-9.md` / PR #825 — contrato consolidado de `landing_page_offering_scope`; implementação correspondente em andamento no PR #826.
- `docs/lousa-plano-base-e20-5.md` — seleção da pesquisa integral `end_customer` por taxon.
- `docs/lousa-plano-base-e20-6.md` — suficiência factual e predicado derivado de taxon preparado.
- `docs/lousa-plano-base-e19-3.md` — pacote autorizado, pesquisa consultiva e fatos concretos revalidados.
- `docs/lousa-plano-base-e19-4.md` — geração, materialização, snapshot e baseline de qualidade persuasiva da primeira LP real.
- `docs/lousa-plano-base-e19-5.md` — workspace, configuração contextual por LP, contrato vigente de oferta e separação entre scopes compartilhados e contextuais.
- PR #822 / `docs/matriz-debate-e19-5-4.md` — origem das decisões humanas posteriormente consolidadas pela E20.2.9 e referência para os seis resultados desejados de qualidade usados no Gate 5.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md` — baseline histórico da pesquisa usada na revisão 5.
- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v2.md` — nova Deep Research aprovada no Gate 3 e usada na revisão 6.
- PR #827 — arquivamento da pesquisa `corretor-imoveis/end_customer/v2` sem sobrescrever a `v1`.
- Evidência hospedada read-only das revisões 5 e 6 em `account_landing_page_materializations` — pesquisa, versão E20.2, prompt, usage, latência e conteúdo persistidos para a comparação controlada dos Gates 4 e 5.
- `docs/prompt-nicho-pesquisa.md` — prompt vigente de pesquisa por blocos, preservado como baseline e não substituído pelo Gate 2.
- `docs/prompt-nicho-pesquisa-mercado-experimental.md` — prompt experimental evoluído no Gate 2 e utilizado para a nova Deep Research.
- `docs/prompt-nicho-arquivamento-pesquisa.md` — contrato vigente de arquivamento/versionamento; preserva o conteúdo recebido e não define o conteúdo metodológico da Deep Research.
- `docs/template-prompts.md` — contrato outcome-first vigente para prompts do projeto.
- `docs/template-prompts-gpt-5-6.md` — complemento vigente de prompts GPT-5.6, usado somente como referência metodológica e sem selecionar modelo para a Deep Research do ChatGPT.
- `.agents/skills/lp-factory-criar-prompt/SKILL.md` — processo vigente para criar prompts, instruções e handoffs não-Codex.
- `docs/schema.md` — estrutura vigente de `business_taxons`, `account_taxonomy`, `account_landing_page_shared_configurations` e `account_landing_page_configurations`.
- `lib/conversion-content/landing-page/input-catalog/taxon-chain.ts` — validação executável da cadeia taxonômica.
- `lib/lp-builder/generationContext.ts`, `lib/lp-builder/generationContextContracts.ts` e `lib/lp-builder/landingPageRevision.ts` — coerência vigente entre taxon servido, pesquisa autorizada, fatos e snapshot.
- `lib/lp-builder/landingPageDraftGeneration.ts` e `lib/conversion-content/landing-page/presentation/prompt.ts` — geração vigente em uma chamada textual sem tools e uso de `modelContext.research` como contexto consultivo.
- `lib/admin/adapters/adminTaxonomyAdapter.ts` e `components/admin/AdminTaxonCreateForm.tsx` — criação administrativa vigente e exigência de taxon pai.
- Orientação oficial vigente do OpenAI Deep Research — referência metodológica externa para pesquisa multi-etapa, seleção de fontes, prompt com objetivo/escopo/restrições/formato e relatório verificável com citações; não substitui os contratos próprios do LP Factory.

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
- A E20.6 pode recomendar necessidade e camada taxonômica, mas humano mantém decisão final e E20.2 permanece a autoridade que materializa o contrato factual aprovado.

### 2.4. Taxon versus escopo comercial da LP

- Taxon responde essencialmente `que tipo de negócio é este?`.
- O escopo comercial da LP responde `o que esta landing page vai divulgar?`.
- A E20.2.9 consolidada no PR #825 adota `landing_page_offering_scope` como dimensão destinada a representar esse escopo, substituindo a semântica singular de `primary_service_or_offer` na nova versão executável que ainda está em implementação no PR #826.
- `landing_page_offering_scope` admite conceitualmente três casos: `uma oferta/serviço`, `um conjunto selecionado de ofertas/serviços` ou `o portfólio amplo do negócio`.
- A E20.7 consome essa semântica para decidir qual conhecimento pesquisar; não é proprietária da persistência, UI ou forma física de `landing_page_offering_scope`.
- `business_offerings_summary` permanece contexto compartilhado, livre, opcional e não exaustivo; não é whitelist nem autoridade suficiente para escolher automaticamente pesquisa especializada.
- A correspondência entre o escopo comercial informado e uma pesquisa profunda especializada pode ser sugerida semanticamente no futuro, mas texto livre, resumo do negócio ou nome da LP não se tornam autoridade taxonômica automaticamente.
- Essa separação evita explosão taxonômica por produto, serviço, campanha ou página e evita que E20.7 crie um segundo mecanismo de ofertas concorrente com E20.2.9/E19.5.

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
- **Pesquisa profunda autorizada** fornece conhecimento de mercado e comportamento do público, com profundidade obtida fora do caminho interativo da geração e reutilização entre LPs compatíveis.
- **Pesquisa dinâmica complementar** fornece conhecimento específico ou atual que a pesquisa profunda aplicável não cobre suficientemente; sua necessidade, mecanismo, limites, fontes e momento exato no pipeline ainda dependem de planejamento e prova.
- **Fatos concretos do cliente/LP** permanecem sob E20.2/E19.5 e fontes autoritativas vigentes; pesquisa profunda ou dinâmica não pode criar preço, disponibilidade, localização, credencial, prova social, condição comercial ou outro fato objetivo da conta/oferta sem fonte factual autorizada.
- Pesquisa profunda e pesquisa dinâmica orientam conhecimento consultivo/persuasivo; fatos concretos continuam sendo autoridade para claims verificáveis.
- `funnel_stage` e `transaction_intent`, quando aplicável ao taxon, devem influenciar **como o conhecimento profundo/dinâmico é consultado e aplicado à persuasão**, porque alteram o momento e a intenção comercial da LP; eles não criam automaticamente uma nova pesquisa profunda para cada combinação nem escolhem sozinhos outro taxon de pesquisa.
- `transaction_intent` não deve ser universalizado artificialmente; quando não for aplicável ao taxon, sua ausência não cria substituto semântico inventado para orientar pesquisa.
- `primary_conversion_goal` permanece estratégia de conversão e, conforme a E20.2.9, não integra o núcleo da identidade; mudar o goal não deve, por si só, trocar a pesquisa profunda selecionada, embora continue orientando a construção da conversão durante a geração.
- O contrato de pesquisa deve permitir que a mesma pesquisa profunda relevante seja consultada sob diferentes estágios de funil e intenções comerciais sem transformar a pesquisa em wireframe ou roteiro fixo.
- O diferencial de produto buscado não é a existência formal de um arquivo de pesquisa, mas a capacidade de produzir comunicação comercial de maior qualidade usando conhecimento relevante, confiável, profundo e suficientemente atual com custo e latência aceitáveis.

### 2.7. Contrato funcional da nova pesquisa profunda — Gate 1

#### 2.7.1. Objetivo e fronteira

- Status: **Gate 1 concluído em 27/08/2026**.
- A pesquisa profunda `end_customer` é um ativo reutilizável de inteligência de mercado e persuasão, produzido fora do caminho interativo da geração para fornecer conhecimento profundo, verificável e suficientemente específico ao taxon servido.
- A pergunta central da pesquisa é `como o público deste taxon pensa, percebe o problema, decide, compara alternativas, forma confiança, cria objeções e usa linguagem ao buscar uma solução?`.
- A pesquisa não é blueprint de Landing Page, não é template, não é copy final e não substitui fatos concretos da conta/LP.
- A saída permanece Markdown humano-auditável e versionável no padrão repo-only vigente; este gate não cria JSON Schema, banco, tabela, API, rota, novo loader ou infraestrutura.
- O contrato deve funcionar tanto para `niche` quanto para `ultra_niche` e produzir conhecimento consultável sob diferentes `funnel_stage` e `transaction_intent` aplicáveis sem exigir uma nova Deep Research para cada combinação.

#### 2.7.2. Blocos obrigatórios de conhecimento

- **Identificação e escopo da pesquisa:** taxon, cadeia taxonômica conhecida, `audience_scope = end_customer`, geografia/mercado quando material, data da pesquisa, período temporal privilegiado, inclusões, exclusões e limitações de escopo.
- **Contexto da categoria/mercado:** natureza da solução, mecanismos relevantes do mercado, subcategorias importantes, contexto econômico/operacional e mudanças estruturais que afetam a decisão do cliente, sem transformar o bloco em recomendação de LP.
- **Mapa de públicos e situações de compra:** subpúblicos ou contextos comportamentais materialmente diferentes, definidos por necessidade, situação, job, risco ou intenção; evitar persona demográfica sintética quando não houver evidência para idade, renda, estado civil ou outro atributo.
- **Jobs-to-be-done e resultados desejados:** o que o cliente tenta resolver, alcançar, evitar ou preservar antes, durante e depois da decisão.
- **Dores, medos, riscos, desejos e tensões:** razões que aumentam urgência, relevância, ansiedade ou aspiração, distinguindo intensidade e contexto quando houver diferenças reais entre subpúblicos.
- **Objeções e barreiras:** motivos para adiar, recusar, desconfiar, comparar ou abandonar a decisão e quais tipos de evidência, informação ou condição costumam reduzir cada barreira; não escrever a resposta de copy pronta.
- **Critérios de decisão e trade-offs:** fatores usados para comparar opções, prioridades, concessões, critérios eliminatórios, sinais positivos/negativos e situações em que um critério ganha ou perde importância.
- **Alternativas e concorrência percebida:** concorrentes de categoria, substitutos, fazer sozinho, adiar, soluções adjacentes e padrões de posicionamento observados; separar claim observado de concorrente de evidência independente sobre o mercado.
- **Jornada de decisão e necessidades de informação:** como necessidades, dúvidas, confiança e nível de prova mudam ao longo da jornada e dos estágios de consciência/funil; descrever a decisão do cliente, não a sequência de seções da LP.
- **Confiança, prova e redução de risco:** credenciais, demonstrações, evidências, transparência, garantias, processos, referências ou sinais que o mercado tende a considerar relevantes, sem presumir que um cliente concreto possua qualquer um deles.
- **Linguagem, vocabulário e perguntas do público:** termos, formulações, dúvidas recorrentes, linguagem técnica versus popular, expressões de busca/intenção e palavras que sinalizam contexto ou estágio; priorizar linguagem observada e não inventar volume de busca ausente.
- **Padrões de mensagem da categoria:** claims recorrentes, promessas genéricas/saturadas, diferenciais mais defensáveis quando sustentados por evidência e espaços de diferenciação; não produzir headline, slogan ou proposta de valor final para a LP.
- **Dimensões factuais variáveis entre negócios/ofertas:** fatos concretos que podem mudar de cliente para cliente e que o público valoriza ou precisa conhecer; a pesquisa apenas identifica a dimensão e sua relevância, nunca preenche o valor do cliente, cria `field_key`, define obrigação ou altera E20.2. Esse bloco serve como evidência para a avaliação posterior da E20.6.
- **Contexto regulatório, geográfico e de segurança:** regras, credenciais, restrições, riscos legais ou diferenças regionais que materialmente alterem decisão, confiança ou comunicação; distinguir obrigação legal de prática de mercado ou recomendação analítica.
- **Sinais temporais e candidatos a atualização dinâmica:** tendências, condições econômicas, preços referenciais, regras em mudança, concorrência atual, comportamento recente ou outro conhecimento cuja validade dependa do tempo; indicar o que pode exigir rechecagem futura sem determinar automaticamente um tool call em runtime.
- **Lacunas, controvérsias e limitações:** informação não encontrada, evidência fraca, contradições entre fontes, diferenças regionais, inferências relevantes e questões que não podem ser tratadas como fato.
- **Fontes consultadas:** registro verificável das fontes realmente usadas, preservando citações no corpo para as afirmações materiais.

#### 2.7.3. Classificação de evidência e temporalidade

- Toda afirmação factual material deve possuir fonte verificável; números, percentuais, regras, preços, volumes, datas e benchmarks não podem aparecer como exatos sem fonte correspondente.
- A pesquisa deve distinguir claramente **evidência observada**, **síntese/inferência analítica** e **hipótese/lacuna**; inferência não pode ser redigida como fato comprovado.
- Cada bloco ou achado material deve permitir identificar sua temporalidade como **estrutural**, **semiestável** ou **volátil**, evitando tratar conhecimento temporal como verdade permanente.
- Aplicabilidade relevante deve ser explicitada quando não for geral: taxon inteiro, subpúblico, `transaction_intent`, etapa da jornada, geografia, canal ou outra condição real.
- Fontes primárias, oficiais e regulatórias têm prioridade para leis, regras, credenciais, programas, estatísticas oficiais e fatos verificáveis.
- Fontes acadêmicas, institucionais e estudos setoriais confiáveis devem sustentar comportamento, mercado e padrões quando houver material adequado.
- Sites de concorrentes servem para comprovar o que o concorrente afirma ou oferece, não para provar independentemente que a afirmação é verdadeira ou representa todo o mercado.
- Reviews, fóruns, comunidades, redes sociais e linguagem de busca podem ser usados como sinal qualitativo de voz do cliente, dúvidas e sentimento, com a devida classificação de evidência; não substituem fonte factual de alta autoridade.
- Claims materiais e não óbvios devem, quando viável, ser triangulados por mais de uma fonte independente; divergências relevantes não devem ser apagadas por uma falsa síntese.
- Informação volátil deve privilegiar fontes recentes e registrar a data/período observado; fonte histórica permanece admissível para comportamento estrutural quando sua relevância for explicada.

#### 2.7.4. Reutilização e especialização

- Uma pesquisa de `niche` deve cobrir o conhecimento estrutural necessário para diferentes trabalhos comerciais legítimos daquele nicho sem tentar antecipar uma Deep Research separada para cada oferta, funil ou goal.
- Uma pesquisa especializada de `ultra_niche` deve ser **autossuficiente dentro do próprio escopo**: conter o contexto ancestral necessário para interpretar a especialização e aprofundar o que muda materialmente em público, problema, decisão, risco, objeção, confiança, linguagem e factualidade relevante.
- A pesquisa especializada não precisa repetir conteúdo ancestral sem valor adicional e não exige que a pesquisa do ancestral seja enviada junto à geração quando a especializada for suficiente.
- A existência de pesquisa de ultranicho não reclassifica a conta no ultranicho e não transforma oferta em autoridade taxonômica.
- Quando uma especialização não possuir pesquisa profunda própria, a Opção A preserva o nicho-base e delega ao Gate 6 o desenho do complemento dinâmico; o Gate 1 não antecipa como essa busca será implementada.
- Repetição recorrente do mesmo complemento dinâmico pode futuramente justificar criar uma pesquisa profunda especializada, mas isso depende de evidência de reutilização/valor e decisão própria, não de regra automática.

#### 2.7.5. Conteúdo explicitamente fora da pesquisa profunda

- Wireframe, ordem, quantidade ou presença obrigatória de seções da LP.
- Módulos, variantes, layouts, composição visual, direção de design, disposição de elementos ou tamanho final da página.
- Headline, subheadline, slogan, body copy, FAQ pronta, CTA label pronto ou outra copy final reutilizável como resposta do workload de geração.
- Definição obrigatória do `primary_conversion_goal`, canal de conversão, destino operacional ou CTA concreto da LP.
- Prescrição de URL slug, title/meta final, schema markup, calendário de blog, arquitetura SEO ou implementação on-page; intenção de busca e linguagem do público permanecem permitidas como conhecimento de mercado.
- Valores concretos da conta, preço real, disponibilidade, localização específica, credencial real, prova social real, pessoa, cliente, condição comercial ou resultado não fornecido por fonte factual da conta/LP.
- Criação, remoção, `field_key`, scope, obrigação, allowed values ou camada de fields E20.2; a pesquisa pode apenas apontar dimensões factuais relevantes para posterior avaliação E20.6.
- Decisão de entitlement, plano comercial, disponibilidade E20.4, arquitetura técnica, banco, job, agente, automação ou workload.
- Persona sintética apresentada como fato quando os atributos demográficos não estiverem comprovados; preferir segmentos comportamentais e situações de compra sustentados por evidência.

#### 2.7.6. Consultabilidade e formato

- O documento deve manter estrutura consistente entre taxons para que humano e IA encontrem os mesmos tipos de conhecimento sem engine adicional.
- A abertura deve trazer uma síntese curta do mercado, do público e das tensões de decisão, sem virar recomendação de arquitetura da LP.
- Comparações, segmentos, objeções, critérios ou alternativas podem usar tabelas quando isso aumentar densidade informacional; narrativa longa não é requisito de qualidade.
- Evitar repetir o mesmo insight em resumo executivo, núcleo estratégico, wireframe, SEO e conclusão; cada informação deve possuir residência principal no bloco correspondente.
- Citações devem ficar próximas das afirmações materiais e um registro final de fontes deve facilitar auditoria.
- A separação `estrutural / semiestável / volátil` deve permitir que uma futura camada de consulta priorize o conhecimento estável e detecte candidatos a complemento dinâmico sem reexecutar Deep Research completa.
- O tamanho não terá meta fixa no Gate 1: priorizar cobertura e densidade útil, não volume de texto. O Gate 3 demonstrou que uma pesquisa mais ampla pode elevar significativamente os tokens de entrada; eventual compactação deve ser decidida por evidência sem remover conhecimento material.
- O formato continua compatível conceitualmente com o path `docs/pesquisas-brutas/<taxon_slug>/end_customer/vN.md`; qualquer metadata nova obrigatória ou alteração do loader E20.5 fica reservada ao Gate 7 se demonstrada necessária.

#### 2.7.7. Critérios de aceite do Gate 1

- O contrato é aprovado quando consegue orientar uma pesquisa que seja específica ao taxon e não poderia ser reutilizada quase sem alteração em um nicho não relacionado.
- A pesquisa resultante deve separar conhecimento persuasivo de fatos concretos do cliente e separar fato, inferência e hipótese.
- A pesquisa deve permitir distinguir conhecimento estrutural de conteúdo cuja validade temporal exige atualização.
- A pesquisa deve fornecer informação suficiente para diferentes estágios de funil/intenção sem impor a narrativa, o wireframe ou a copy da LP.
- A pesquisa deve identificar dimensões factuais relevantes sem usurpar E20.2/E20.6.
- Pesquisa especializada deve ser autossuficiente no escopo e reutilizável sem obrigar composição com o ancestral.
- Fontes e limitações precisam ser auditáveis; precisão falsa ou ausência silenciosa de evidência reprova o resultado.
- O contrato não cria persistência, runtime, tool, agente, job, automação ou nova autoridade de produto.

### 2.8. Prompt experimental de Deep Research — Gate 2

#### 2.8.1. Status e artefato

- Status: **Gate 2 concluído em 27/08/2026**.
- Artefato: `docs/prompt-nicho-pesquisa-mercado-experimental.md`.
- O artefato experimental existente foi evoluído em vez de criar um terceiro prompt concorrente; `docs/prompt-nicho-pesquisa.md` permanece intacto como baseline vigente.
- O prompt do Gate 2 é destinado ao Deep Research do ChatGPT e não fixa modelo, API, reasoning effort ou configuração de runtime do LP Factory.

#### 2.8.2. Contratos incorporados

- Resultado outcome-first: conhecimento profundo de mercado, público e comportamento de decisão, não solução de LP.
- Entrada mínima: nicho ou especialização; cliente final; Brasil como mercado prioritário; desambiguação única apenas quando indispensável.
- Não estreitar por conta própria um nicho amplo: cobrir os principais submercados e situações materialmente relevantes e explicitar qualquer exclusão necessária.
- Cobertura dos temas materiais do Gate 1 sem impor uma estrutura extensa ou número rígido de blocos; o relatório deve ser denso, auditável e sem repetição desnecessária.
- Hierarquia de fontes adequada ao tipo de achado, incluindo uso controlado de concorrentes, reviews, comunidades e linguagem pública.
- Distinção `evidência | inferência | hipótese` e `estrutural | semiestável | volátil` quando relevante.
- Exclusão explícita de wireframe, seções, módulos, layout, copy pronta, CTA pronto, on-page SEO prescritivo, fatos de cliente e decisões E20.2.
- Pesquisa de especialização autossuficiente no próprio escopo, contendo apenas o contexto ancestral necessário.
- Entrega Markdown com citações próximas às afirmações materiais, fontes, limitações e informações voláteis a rechecagem futura.
- Conformidade com a diretriz concisa/outcome-first de `docs/template-prompts.md`.

#### 2.8.3. Casos representativos para o Gate 3

- Caso principal executado: `corretor-imoveis`, `audience_scope = end_customer`, escolhido porque o projeto já possuía pesquisa profunda histórica, LP real gerada e baseline humano de qualidade persuasiva; isso permitiu comparar a nova pesquisa sem introduzir um nicho novo como variável adicional.
- A primeira execução revelou contaminação pelo contexto do projeto e estreitamento indevido para compra/venda residencial; o prompt foi ajustado de forma mínima para impedir estreitamento unilateral do nicho.
- A segunda execução cobriu os principais submercados, eliminou prescrições de LP e foi aprovada como pesquisa `v2`; Gate 3 concluído com arquivamento pelo PR #827.
- Controle posterior ainda útil, mas não bloqueante para o Gate 6: uma especialização/ultranicho real, para verificar se o prompt produz relatório autossuficiente no escopo e não depende de composição com pesquisa ancestral.

### 2.9. Escopo de oferta e LP multi-serviço

- A UX não deve exigir que o cliente compreenda `taxon`, `ultranicho`, E20.2, E20.5 ou E20.6; a pergunta de produto consolidada pela E20.2.9 é `O que esta landing page vai divulgar?`.
- A E20.7 adota os três escopos conceituais da E20.2.9 exclusivamente para orientar a seleção/consulta do conhecimento: uma oferta/serviço, um conjunto selecionado ou o portfólio amplo.
- Página de uma oferta pode usar pesquisa profunda especializada quando existir.
- Página de conjunto selecionado usa por padrão a pesquisa profunda do nicho-base e complemento dinâmico somente quando necessário; não dispara uma pesquisa profunda por item.
- Página de portfólio amplo usa por padrão a pesquisa profunda do nicho-base; a simples amplitude do portfólio não justifica múltiplas pesquisas dinâmicas.
- Página especializada pode mencionar serviços secundários sem transformar todos em pesquisas obrigatórias ou novos taxons.
- `business_offerings_summary` continua sendo contexto compartilhado e não resolve a seleção estruturada de parte do portfólio.
- A representação funcional de `landing_page_offering_scope` pertence à E20.2.9/E19.5; a E20.7 aguarda a implementação do PR #826 antes de fechar seus deltas executáveis e não cria lista, tabela, coluna, enum de persistência ou UI própria.
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

- **Gate 1 — contrato ideal da pesquisa profunda: CONCLUÍDO em 27/08/2026.** O contrato da seção 2.7 define objetivo, blocos de conhecimento, evidência/temporalidade, reuso/especialização, exclusões, consultabilidade e critérios de aceite sem alterar runtime.
- **Gate 2 — criar o novo prompt de Deep Research: CONCLUÍDO em 27/08/2026.** O prompt experimental `docs/prompt-nicho-pesquisa-mercado-experimental.md` foi evoluído conforme a seção 2.8, preservando o baseline vigente.
- **Gate 3 — produzir nova pesquisa piloto: CONCLUÍDO em 27/08/2026.** A segunda execução de `corretor-imoveis` com o prompt corrigido foi aprovada e arquivada como `end_customer/v2` no PR #827, preservando a `v1`.
- **Gate 4 — gerar LP comparável: CONCLUÍDO em 27/08/2026.** A revisão 6 foi gerada usando a pesquisa `v2` e comparada à revisão 5, mantendo E20.2 v5, mesmo contexto factual e demais contratos/configurações de geração relevantes constantes para isolar principalmente a mudança de pesquisa.
- **Gate 5 — comparar qualidade, custo e latência: CONCLUÍDO em 28/08/2026 com resultado POSITIVO PARCIAL.** A pesquisa `v2` elevou materialmente a qualidade da LP nos seis resultados desejados usados como referência, preservou factualidade observada e não aumentou a latência textual; entretanto, custo permanece indisponível no snapshot, estabilidade não é comprovável com uma geração por variante e a copy ainda não alcança o padrão persuasivo desejado. O resultado confirma valor da Deep Research redesenhada e justifica manter a Opção A; não autoriza redesign do prompt de geração ou renderer dentro da E20.7.
- **Gate 6 — decidir o desenho técnico do fallback dinâmico: PRÓXIMO.** Definir somente o mínimo necessário para cobrir uma especialização sem pesquisa profunda própria: onde a pesquisa dinâmica ocorre, quando é acionada, quais limites/ferramentas/fontes usa, comportamento diante de falha e como sua proveniência entra no snapshot.
- **Gate 7 — fechar deltas E20.5/E20.6/E19.3/E19.4/E19.5 e reavaliar a solução física da biblioteca de pesquisas:** distinguir o que realmente precisa de mudança de contrato, persistência, UX, snapshot e workload; consumir a implementação consolidada de `landing_page_offering_scope` da E20.2.9 sem criar representação concorrente na E20.7; reavaliar se o modelo repo-only da E20.5 continua adequado ao volume e ao ritmo esperados da biblioteca de pesquisas, considerando crescimento do repositório, acoplamento a bundle/deploy, operação de versionamento/aprovação, auditabilidade, custo e simplicidade. O repo-only permanece baseline durante os pilotos/MVP; eventual mudança para Supabase, Storage ou outra residência física deve ser decidida por evidência neste gate e não assumida antecipadamente.
- **Gate 8 — consolidar plano-base v1 da E20.7:** somente após os gates anteriores registrar escopo executável, atualizar `docs/roadmap.md` e autorizar implementação.

#### 3.3.1. Evidência experimental dos Gates 3–5

- **Caso controlado:** mesma conta `Corretor Beta`, mesma LP de primeiro imóvel, mesma E20.2 v5 e mesmo prompt textual `e19.4-presentation-v2`; revisão 5 usou pesquisa `v1` e revisão 6 usou pesquisa `v2`.
- **Factualidade:** após selecionar a pesquisa `v2`, a E20.6 foi reaberta automaticamente; a avaliação sistemática contra E20.2 v5 classificou os quatro candidatos factuais como cobertos pelo catálogo atual e a suficiência foi confirmada administrativamente. A revisão 6 foi persistida com validadores de apresentação/binding/imagem aprovados e não foi identificado claim objetivo não autorizado na comparação humana.
- **Qualidade:** a revisão 6 passou de formulações predominantemente operacionais para uma narrativa mais ligada à situação real do primeiro comprador — orçamento, região, critérios de comparação, financiamento, documentação e redução de dúvida. A comparação humana considerou melhora nos seis resultados de referência: objetivo comercial, adequação ao momento do público, progressão narrativa, unidade de mensagem, conversão coerente e especificidade.
- **Limite de qualidade:** o ganho é material, mas não transforma a copy em referência de mercado. Permanecem repetição de `clareza/organizar/próximo passo`, sobreposição entre blocos e aproveitamento parcial de tensões mais fortes presentes na pesquisa, como medo de erro irreversível, desconfiança, risco e diferenciação frente à autossuficiência digital.
- **Tokens:** entrada textual passou de `9.150` para `18.306` tokens (`+100,1%`); saída caiu de `5.419` para `5.213` (`-3,8%`); total passou de `14.569` para `23.519` (`+61,4%`); reasoning tokens passaram de `4.450` para `4.296` (`-3,5%`). O aumento de contexto é material e deverá ser considerado em custo/compactação futura, sem concluir por si só que a pesquisa é excessiva.
- **Latência:** latência textual registrada caiu de `51.381 ms` para `42.758 ms` (`-16,8%`); latência de imagem subiu de `35.147 ms` para `39.875 ms` (`+13,5%`). A soma simples das duas latências de provider caiu de `86.528 ms` para `82.633 ms` (`-4,5%`), mas não representa necessariamente o tempo total end-to-end do workflow.
- **Custo:** os snapshots das duas revisões registram `estimatedCost = null` e `costStatus = unavailable` para texto e imagem. O Gate 5 não inventa custo a partir de preço externo; custo permanece evidência ausente a reconciliar com E21 antes de decisão econômica final.
- **Correção humana:** nenhuma edição manual da copy foi aplicada entre a geração da revisão 6 e a comparação; a avaliação humana identificou melhoria e limitações, não uma correção necessária para tornar o artefato factual ou renderizável.
- **Estabilidade:** uma única geração por variante é insuficiente para medir consistência estatística ou variabilidade criativa. O Gate 5 comprova ganho no caso piloto, não superioridade universal da `v2` em todos os taxons ou todas as execuções.
- **Decisão resultante:** manter a **Opção A** e avançar para o Gate 6. O problema residual de copy e o renderer atual são achados legítimos do experimento, porém ficam fora do escopo executável da E20.7 e devem ser encaminhados ao recorte competente sem ampliar este rascunho.

### 3.4. Hipóteses de impacto a validar, sem autorização técnica

- E20.2 pode permanecer sem mudança para a política de pesquisa; qualquer novo field depende de gap factual real identificado pelo fluxo competente.
- E20.5 já fornece seleção versionada de pesquisa profunda por taxon, mas poderá precisar evoluir se a política de reutilização entre conta ancestral e pesquisa descendente exigir nova semântica operacional.
- E20.6 não deve ser ampliada por inferência; sua relação com elegibilidade da pesquisa especializada será definida apenas após separar preparação factual de seleção de conhecimento.
- E19.3 hoje presume coerência entre taxon servido e pesquisa; uma futura Opção A operacional pode exigir nova versão do pacote que distinga autoridade factual, fonte de pesquisa e contexto comercial relevante.
- E19.4 hoje materializa e valida snapshot com a mesma coerência; a futura proveniência deverá registrar pesquisa profunda utilizada e, quando houver, pesquisa dinâmica complementar, sem alterar revisões históricas.
- O workload de geração propriamente dito já consome `modelContext.research` como contexto consultivo e facts separadamente; mudança de mecanismo de pesquisa não implica automaticamente novo renderer, nova apresentação ou nova infraestrutura.
- E19.5/E20.2.9 são as autoridades do modelo mental operacional e do escopo comercial da LP; a E20.7 deve consumir `landing_page_offering_scope` após a implementação consolidada e não criar mecanismo concorrente de oferta.
- A escolha de pesquisa especializada não é um field E20.2 e não deve ser inserida artificialmente em `account_landing_page_configurations.values`; sua menor residência operacional permanece para planejamento técnico posterior.
- `funnel_stage` e `transaction_intent` podem alterar a maneira de aplicar a pesquisa na narrativa; `primary_conversion_goal` não deve ser usado como chave de seleção da Deep Research.
- A E21.3 é candidata natural para consolidar evidências reproduzíveis de qualidade, correção humana, usage, latência, custo e estabilidade dos workloads; o Gate 7 deve reconciliar essa fronteira sem antecipar implementação neste rascunho.
- O experimento dos Gates 4–5 revelou limitações do prompt textual e do renderer, mas a E20.7 não os redesenha. Esses achados devem ser encaminhados ao recorte responsável por qualidade/apresentação depois de fechar a política de conhecimento.

## 4. Comercial — separação de autoridade

### 4.1. Decisão de fronteira

- Preparação factual do taxon, disponibilidade comercial, entitlement da conta, identidade/escopo comercial da LP e seleção de conhecimento permanecem conceitos distintos.
- O contrato vigente reserva E20.4 para disponibilidade comercial por `taxon + plano`; este rascunho não redefine essa autoridade.
- Entitlement da conta permanece responsabilidade comercial da E9 e é aplicado posteriormente no fluxo concreto da conta.
- E20.2.9/E19.5 permanecem responsáveis pelo escopo comercial e continuidade operacional da LP; a E20.7 utiliza somente o contexto necessário para resolver conhecimento e não redefine LP concreta, versão, grupo ou identidade.
- A segunda parte do debate deverá distinguir claramente: `taxon preparado`, `pesquisa profunda disponível`, `taxon comercialmente disponível` e `conta autorizada a gerar`.

## 5. Pontos ainda abertos

### 5.1. Debate pendente

- Gate 6: definir o fallback dinâmico — gatilho, escopo, profundidade, fontes, limites, timeout, custo, observabilidade, snapshot e comportamento diante de falha — sem transformar a pesquisa dinâmica em autoridade factual ou taxonômica.
- Definir se a pesquisa dinâmica deve ocorrer como etapa controlada anterior à geração ou dentro de workload com tool; esta é a decisão central do Gate 6.
- Definir como o sistema associa um `landing_page_offering_scope` de uma oferta única a uma pesquisa profunda descendente existente, preservando confirmação/autoridade adequada e sem transformar texto livre, `business_offerings_summary` ou nome da LP em vínculo taxonômico automático.
- Definir como a consulta da pesquisa profunda recebe `funnel_stage` e `transaction_intent` aplicável sem criar pesquisa separada por combinação nem antecipar decisões narrativas do workload de geração.
- Definir a menor residência operacional para a referência à pesquisa especializada, se persistência for realmente necessária; não usar `account_landing_page_configurations.values` como atalho para um dado que não é field E20.2.
- Definir as alterações mínimas de contrato/proveniência em E19.3 e E19.4 quando a Opção A entrar em runtime.
- Reconciliar a E20.7 com a implementação final de `landing_page_offering_scope` após o fechamento do PR #826, sem duplicar no documento próprio regras de identidade, persistência ou workspace.
- Reconciliar no Gate 7 a ausência atual de custo estimado e a prova de estabilidade com a autoridade competente de E21, sem criar medição paralela dentro da E20.7.
- Reavaliar no Gate 7 se o modelo repo-only da E20.5 continua adequado à escala esperada da biblioteca de pesquisas.
- Verificar se a disponibilidade comercial E20.4 precisa ser implementada para o MVP imediato ou apenas formalizada antes da abertura para novos clientes.
- Definir a segunda parte da rota: critérios de uma conta concreta para criar e gerar suas LPs quando o taxon já estiver preparado e comercialmente elegível.
- Registrar fora da E20.7 os achados de qualidade relativos ao prompt textual e ao renderer, sem executá-los neste recorte.
- Somente após o fechamento dos gates e decisões aplicáveis consolidar plano-base v1, atualizar `docs/roadmap.md` e autorizar implementação.
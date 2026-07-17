14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/lousa-plano-base-e20-2.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, consulta read-only ao Supabase, `lib/conversion-content/landing-page/`, `lib/conversion-content/landing-page/input-catalog/registry.ts`, PRs #559, #563, #564, #566, #567, #577 e #581, avaliações do Analista e decisões humanas de 14 a 17/07/2026.

Versão: v1 em ajuste.

Status: plano simplificado; nove módulos mantidos no escopo; `hero`, `hero.standard@v1`, `trust_bar`, `trust_bar.standard@v1`, `problem_solution`, `problem_solution.standard@v1`, `offer` e `offer.standard@v1` conceitualmente fechados; cinco módulos pendentes; nenhuma implementação autorizada neste PR.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

## 1. Estado e decisões fixas

### 1.1. Objetivo da E18.5

- Definir e implementar, no repositório, o catálogo versionado dos nove módulos `landing_page` e de suas variantes `standard@v1`.
- Entregar contratos pequenos, estritos, imutáveis e suficientes para consumo posterior pela E20 e pela E19.
- Preservar extensibilidade sem antecipar variantes, campos ou capacidades sem uso aprovado.
- Encerrar a E18.5 após os nove módulos, suas variantes `standard@v1` e a validação integrada dos contratos.

### 1.2. Estado confirmado

- A E18.4 está concluída e a raiz versionada existe em `lib/conversion-content/landing-page/`.
- A precedência permanece `raiz → módulo → variante`.
- A E18.5 permanece repo-only.
- Ainda não existem composição, renderer ou render model.
- O catálogo operacional já define `primary_conversion_channel` e destinos condicionais.
- `commercial_activation`, E18.2 e E18.3 permanecem preservados.
- O trabalho documental continua no PR #577 e na branch `docs/e18-5-modules-variants`.
- O PR #577 não deve ser mergeado sem confirmação humana explícita.

### 1.3. Grade fechada de módulos

- `hero` ← `hero_segmentado`.
- `trust_bar` ← `barra_de_confianca`.
- `problem_solution` ← `dores_e_solucoes`.
- `offer` ← `servicos_por_intencao`.
- `process` ← `processo_de_atendimento`.
- `technical_assurance` ← `prova_tecnica_documental`.
- `social_proof` ← `prova_social`.
- `faq` ← `faq_objeções`.
- `final_cta` ← `cta_final_qualificado`.

Regras:

- Os nove módulos serão fechados e implementados na E18.5.
- `item_key` é evidência de pesquisa, não identidade canônica do módulo.
- Os módulos são transversais e não recebem identidade de taxon.
- Formatos curto, médio e longo pertencem à composição e à extensão da LP.
- O próximo módulo para análise é `process`.

### 1.4. Escopo positivo

A E18.5 define e implementa:

- identidade e versão do catálogo;
- identidade, versão, função e invariantes dos módulos;
- identidade, versão, campos, cardinalidades e capacidades das variantes `standard@v1`;
- especializações necessárias sobre a raiz;
- fontes de copy e perfis de funil;
- exigências factuais ou operacionais;
- schemas, tipos, registry, resolver, validadores e testes de contrato;
- lifecycle, compatibilidade e descontinuação.

### 1.5. Escopo negativo

Ficam fora:

- banco e migrations;
- Admin e Builder;
- composição concreta por taxon;
- geração ou edição de LP real;
- renderer e componentes visuais;
- persistência e snapshot;
- tracking;
- conteúdo operacional concreto;
- variantes além de `standard@v1`;
- capacidades sem consumidor aprovado.

## 2. Contrato compartilhado

### 2.1. Separação entre módulo e variante

Módulo define somente:

- função estrutural reutilizável;
- fronteiras com outros módulos;
- invariantes realmente permanentes;
- requisitos mínimos de integração;
- compatibilidade comum.

Variante define:

- execução estrutural ou comportamental concreta;
- campos e cardinalidades;
- capacidades utilizadas;
- especializações da raiz;
- validações próprias;
- requisitos técnicos, factuais, operacionais e de acessibilidade aplicáveis.

A separação aplica-se aos nove módulos.

### 2.2. Extensibilidade das variantes

- Cada módulo começa com uma única variante `standard@v1`.
- Nova variante exige diferença estrutural ou comportamental reutilizável.
- Nova variante pode adicionar ou especializar campos, mídia, interação, responsividade e validações próprias.
- Nova variante não altera contratos ou LPs de variantes anteriores.
- Restrições de `standard@v1` não restringem variantes futuras.
- Nova variante não exige nova `moduleVersion` quando preserva função, fronteiras e invariantes do módulo.
- Nova `moduleVersion` é exigida quando mudam função, fronteiras, invariantes permanentes ou integração comum.
- Nova `variantVersion` é exigida quando muda o contrato de uma variante existente.
- Cada referência futura deve identificar `moduleKey`, `moduleVersion`, `variantKey` e `variantVersion`.

Não criam variante isoladamente:

- taxon;
- plano;
- campanha ou origem de tráfego;
- funil;
- copy;
- troca de ativo;
- canal ou destino concreto;
- ordem na LP;
- quantidade já permitida;
- ajuste responsivo normal do renderer.

### 2.3. Herança e limites

- A raiz contém regras comuns.
- Módulo e variante registram apenas deltas necessários.
- Módulo ou variante pode restringir a raiz, mas não ampliar limite absoluto vigente.
- Necessidade acima do limite da raiz exige evolução versionada da raiz.
- Capability da raiz só bloqueia a implementação quando for indispensável à variante `standard@v1` em implementação.
- Capability opcional ou destinada a variante futura permanece evolução posterior.
- Variante deve declarar compatibilidade explícita com a versão da raiz usada por seu contrato.
- O comportamento de uma variante imutável não muda pela disponibilidade posterior de nova capability da raiz.
- Não existe fallback silencioso.
- Contrato ausente, incompatível ou inválido falha fechado.
- Resultado resolvido deve ser completo e imutável.

### 2.4. Contrato mínimo de campo

Cada campo usado por uma variante declara:

- `fieldKey`;
- `fieldKind`;
- cardinalidade;
- `semanticRole`, quando textual;
- policy de origem do valor;
- suporte operacional, quando aplicável;
- capability específica, quando aplicável.

Regras:

- cardinalidade representa obrigatoriedade;
- texto visível usa papel semântico existente na raiz compatível;
- coleção possui contrato fechado do item;
- coleção aninhada não integra a v1;
- ação não armazena canal, URL, telefone, e-mail ou destino concreto;
- mídia referencia ativo futuro e declara apenas requisitos necessários à variante;
- tipos, policies e matrizes só são adicionados quando um dos nove módulos realmente precisar.

### 2.5. Copy e sustentação factual

- `copySourceMap` define até duas fontes primárias e uma auxiliar por campo textual, salvo decisão humana registrada.
- `funnelCopyProfile` adapta seleção e redação para BOFU, MOFU e TOFU.
- O funil orienta copy e seleção e pode influenciar a escolha entre ordens previamente permitidas pela composição da E20; não redefine sozinho a estrutura da LP.
- Pesquisa orienta copy, mas não comprova fatos sobre a operação.
- Credencial, capacidade, condição, preço, prazo, parceria, resultado, garantia ou ação concreta exige suporte operacional real.
- A E18.5 declara a exigência estrutural.
- A E19 resolve valores e valida a instância concreta conforme a composição recebida.
- Nenhum módulo pode inventar prova, certificação, garantia ou resultado.

Policies iniciais devem ser limitadas às efetivamente consumidas pelas variantes aprovadas:

- `research_guided`;
- `hybrid`;
- `technical_reference`;
- `not_copy`.

Novas policies somente entram quando outro módulo aprovado exigir comportamento não representável pelas existentes.

### 2.6. Ações e vínculos operacionais

- Ação possui label textual e vínculo abstrato com campo estável do catálogo operacional.
- O registry não armazena valor, canal ou destino concreto.
- O vínculo declara se o campo operacional é obrigatório quando a ação estiver presente.
- A E19 resolve o campo operacional, seus condicionais e o destino.
- Nova chave operacional não pode ser criada implicitamente pela E18.5.

### 2.7. Lifecycle e compatibilidade

- `moduleCatalogVersion` declara versão e compatibilidade com a raiz; não possui lifecycle próprio.
- Módulo e variante usam lifecycle:
  - `experimental`;
  - `active`;
  - `deprecated`.
- Todos começam `experimental` e com propósito `controlled_test`.
- Promoção para `active` exige uso em LP real, revisão e decisão humanas.
- `deprecated` impede novas composições, mas preserva leitura e renderização histórica.
- Remoção física exige inexistência de dependentes ou migração aprovada.
- Implementação técnica não equivale a validação comercial.

### 2.8. Fronteiras entre etapas

E18.5:

- define o que é estruturalmente válido;
- implementa contratos repo-only;
- não resolve instâncias concretas.

E20:

- escolhe módulos, variantes, versões, ordem, obrigatoriedade e opções por ocorrência;
- define a composição aplicável ao taxon.

E19:

- recebe pesquisas, composição e entradas;
- resolve conteúdo, ativos e vínculos;
- trata ausência ou invalidade de dados conforme a obrigatoriedade definida pela E20 e seu próprio contrato;
- gera e administra a LP real;
- preserva as versões utilizadas.

Renderer:

- executa o contrato resolvido;
- não escolhe variante, conteúdo ou fallback.

### 2.9. Checklist de fechamento de cada módulo

Obrigatório:

- identidade, função e evidência;
- fronteiras;
- invariantes permanentes;
- variante `standard@v1`;
- campos e cardinalidades necessários;
- especializações da raiz;
- fontes de copy;
- requisitos factuais ou operacionais;
- lifecycle e compatibilidade;
- validações estruturais indispensáveis.

Condicional, somente quando utilizado por `standard@v1`:

- ação;
- mídia;
- interação;
- responsividade especial;
- acessibilidade específica;
- fallback técnico;
- referência técnica.

O fechamento conceitual não exige detalhar comportamentos de variantes futuras.

### 2.10. Significado de implementação

Um módulo está implementado na E18.5 quando existem, conforme o contrato técnico adotado:

- identidade versionada do módulo;
- identidade versionada de `standard@v1`;
- tipos e schemas;
- campos, cardinalidades e capabilities;
- registry;
- resolver ou mecanismo equivalente;
- validadores;
- fixtures somente quando úteis ao padrão de teste;
- casos executáveis e testes de contrato;
- regras de lifecycle e compatibilidade;
- exportação pelo boundary `lib/conversion-content/landing-page/`.

Isso não inclui seção visual funcional.

## 3. Contratos conceitualmente fechados

### 3.1. Módulo `hero`

- `moduleKey = hero`.
- `moduleVersion = 1`.
- Função:
  - apresentar a proposta principal;
  - estabelecer o recorte da LP;
  - conduzir a uma rota prioritária de conversão ou continuidade.
- Invariantes:
  - uma proposta principal identificável;
  - hierarquia semântica coerente;
  - ausência de identidade de taxon, plano, campanha ou funil no contrato;
  - integração abstrata com a ação principal quando a variante a utilizar.
- Fronteiras:
  - não contém formulário completo, galeria, carrossel, tour, navegação global, oferta detalhada ou prova extensa.
- Evidência principal:
  - `hero_segmentado`, pesquisa ativa de `lp_sections`, taxon `Corretor Imóveis`.
- Variantes futuras podem possuir campos e capacidades próprias sem alterar `hero.standard@v1`.

### 3.2. Variante `hero.standard@v1`

Identidade:

- `variantKey = hero.standard`.
- `variantVersion = 1`.
- Compatível com `hero@v1` e com a versão vigente da raiz utilizada na implementação inicial.
- Única variante inicial.

Campos:

- `eyebrow`:
  - texto, papel `eyebrow`, cardinalidade `0..1`, policy `research_guided`.
- `title`:
  - texto, papel `h1`, cardinalidade `1..1`, policy `hybrid`, suporte `when_factual`.
- `subtitle`:
  - texto, papel `paragraph`, cardinalidade `1..1`, policy `hybrid`, suporte `when_factual`.
- `primaryCta`:
  - ação, cardinalidade `1..1`, policy `not_copy`;
  - label textual com papel `cta_label`, cardinalidade `1..1`, policy `hybrid`, suporte `when_present`;
  - vínculo obrigatório com `primary_conversion_channel`.
- `proofShort`:
  - texto, papel `paragraph`, cardinalidade `0..1`, policy `hybrid`, suporte `when_present`.
- `media`:
  - mídia, cardinalidade `0..1`, policy `technical_reference`;
  - somente imagem;
  - modo `informative` ou `decorative`.

Copy:

- `eyebrow`: primária `positioning_opportunity`; auxiliar `search_intent`.
- `title`: primárias `positioning_opportunity` e `desire`; auxiliar `commercial_keywords`.
- `subtitle`: primárias `pain` e `desire`; auxiliar `belief`.
- `primaryCta.label`: primária `trigger`; auxiliar `search_intent`.
- `proofShort`: primária `proof_type`; auxiliar `objection`.

Regras específicas:

- Canais permitidos: `whatsapp`, `phone`, `email` e `external_url`.
- Canal e destino concretos ficam fora do registry.
- Imagem informativa exige alternativa acessível.
- Imagem decorativa não transporta informação essencial.
- Visibilidade da mídia em `hero.standard@v1` é `all_viewports`.
- `subtitle` usa `body.base` na versão inicial.
- `desktop_only` e `body.editorialEmphasis` não integram `hero.standard@v1` enquanto não houver evolução versionada e compatibilidade explícita.
- A adoção futura dessas capacidades exige nova `variantVersion` ou novo contrato compatível, sem alterar LPs existentes.
- Não pertencem a `hero.standard@v1`:
  - CTA secundário;
  - vídeo;
  - formulário;
  - interação;
  - galeria, carrossel ou tour.
- Essas exclusões não restringem futuras variantes de `hero`.

Funil:

- BOFU: direto e decisório.
- MOFU: diferenciação e explicação moderada.
- TOFU: contexto educativo e baixa fricção.
- Funil não altera campos ou variante.

Estado:

- contrato conceitualmente fechado;
- lifecycle `experimental`;
- propósito `controlled_test`;
- implementação ainda não autorizada por este ajuste documental.

### 3.3. Módulo `trust_bar`

- `moduleKey = trust_bar`.
- `moduleVersion = 1`.
- Função:
  - apresentar sinais curtos e verificáveis de confiança;
  - reduzir insegurança inicial;
  - sustentar continuidade da leitura ou aproximação da conversão.
- Invariantes:
  - sinais curtos;
  - relevância para o público;
  - sustentação factual real.
- Fronteiras:
  - não contém depoimento, prova social extensa, explicação institucional, política completa, prova técnica detalhada, CTA, formulário ou mídia.
- Evidência principal:
  - `barra_de_confianca`, pesquisa ativa de `lp_sections`, taxon `Corretor Imóveis`.
- Variantes futuras podem usar outra execução estrutural sem alterar `trust_bar.standard@v1`.

### 3.4. Variante `trust_bar.standard@v1`

Identidade:

- `variantKey = trust_bar.standard`.
- `variantVersion = 1`.
- Compatível com `trust_bar@v1`.
- Única variante inicial.

Campos:

- `items`:
  - coleção, cardinalidade `2..4`, policy `not_copy`;
  - item fechado com `text`;
  - `text`: papel `benefit_item`, cardinalidade `1..1`, policy `hybrid`, suporte `when_present`.

Copy:

- primárias `proof_type` e `belief`;
- auxiliar `objection`.

Regras específicas:

- cada item exige suporte operacional real;
- a pesquisa orienta seleção e redação, mas não comprova o sinal;
- a coleção não admite item aninhado;
- não possui título, subtítulo, CTA, ícone ou mídia;
- disposição horizontal, quebra e empilhamento são responsabilidade responsiva do renderer;
- TOFU, MOFU e BOFU alteram seleção e redação, não o contrato nem a ordem estrutural da LP;
- uma ocorrência válida de `trust_bar.standard@v1` exige de dois a quatro sinais sustentados;
- o tratamento da ausência de dados depende da obrigatoriedade definida pela composição da E20 e será especificado pela E19.

Estado:

- contrato conceitualmente fechado;
- lifecycle `experimental`;
- propósito `controlled_test`;
- implementação ainda não autorizada por este ajuste documental.

### 3.5. Módulo `problem_solution`

- `moduleKey = problem_solution`.
- `moduleVersion = 1`.
- Função:
  - apresentar problemas, fricções ou riscos reconhecíveis pelo público;
  - relacionar cada problema a uma resposta prática e coerente;
  - transformar posicionamento abstrato em relevância concreta antes da oferta ou do processo.
- Invariantes:
  - cada problema possui uma solução diretamente correspondente;
  - problema e solução permanecem distinguíveis;
  - o problema não usa alarmismo, medo artificial ou alegação não sustentada;
  - a solução não promete resultado, garantia ou capacidade inexistente;
  - ausência de identidade de taxon, plano, campanha ou funil no contrato.
- Fronteiras:
  - não substitui proposta principal da Hero;
  - não detalha catálogo de serviços, preço, condição comercial ou oferta;
  - não descreve sequência de atendimento;
  - não apresenta prova técnica, depoimento, credencial, FAQ ou CTA;
  - não contém mídia, formulário ou interação na execução inicial.
- Evidências principais:
  - `dores_e_solucoes`, pesquisa ativa de `lp_sections`, taxon `Corretor Imóveis`;
  - itens `pain`, `fear`, `objection`, `desire`, `belief` e `positioning_opportunity` de `strategic_core`;
  - Blueprint do corretor, especialmente dores, objeções, riscos percebidos e diferenciais objetivos.
- Variantes futuras podem usar outra execução estrutural sem alterar `problem_solution.standard@v1`.

### 3.6. Variante `problem_solution.standard@v1`

Identidade:

- `variantKey = problem_solution.standard`.
- `variantVersion = 1`.
- Compatível com `problem_solution@v1` e com a versão vigente da raiz utilizada na implementação inicial.
- Única variante inicial.

Campos:

- `title`:
  - texto, papel `h2`, cardinalidade `1..1`, policy `research_guided`.
- `items`:
  - coleção, cardinalidade `2..4`, policy `not_copy`;
  - item fechado com `problem` e `solution`;
  - `problem`: texto, papel `card_title`, cardinalidade `1..1`, policy `research_guided`;
  - `solution`: texto, papel `card_body`, cardinalidade `1..1`, policy `hybrid`, suporte `when_present`.

Copy:

- `title`: primárias `pain` e `desire`; auxiliar `positioning_opportunity`.
- `problem`: primárias `pain` e `fear`; auxiliar `objection`.
- `solution`: primárias `positioning_opportunity` e `desire`; auxiliar `belief`.

Regras específicas:

- uma ocorrência válida contém de dois a quatro pares completos;
- cada item contém exatamente um `problem` e uma `solution`;
- a solução responde diretamente ao problema do mesmo item;
- problemas devem ser concretos, reconhecíveis e proporcionais, sem amplificação artificial;
- toda solução apresentada exige suporte operacional real;
- a pesquisa orienta a solução, mas não comprova serviço, método, prazo, condição, garantia ou resultado;
- os papéis `h2`, `card_title` e `card_body` usam as faixas da raiz sem especialização na v1;
- a coleção não admite item aninhado;
- não possui subtítulo, CTA, mídia, ícone, prova, preço, lista detalhada de serviços ou etapas de processo;
- diferenças de copy, quantidade dentro de `2..4`, ordem dos pares e funil não criam variante;
- o tratamento da ausência de pares válidos depende da obrigatoriedade definida pela composição da E20 e será especificado pela E19.

Funil:

- BOFU prioriza fricções decisórias e respostas operacionais diretas.
- MOFU prioriza compreensão, comparação e redução de objeções.
- TOFU prioriza problemas amplos e respostas educativas de baixa pressão.
- O funil altera seleção, prioridade e redação dos pares, sem alterar campos, cardinalidades, variante ou ordem estrutural da LP.

Validações estruturais:

- exigir `title` e `items`;
- exigir cardinalidade `2..4` em `items`;
- exigir exatamente `problem` e `solution` em cada item;
- rejeitar coleção aninhada e campos extras;
- validar os papéis semânticos e as policies declaradas;
- exigir suporte `when_present` em `solution`;
- rejeitar CTA, mídia, ação, prova, preço, processo ou referência técnica na variante;
- resolver de forma fail-closed e imutável.

Estado:

- contrato conceitualmente fechado;
- lifecycle `experimental`;
- propósito `controlled_test`;
- implementação ainda não autorizada por este ajuste documental.

### 3.7. Módulo `offer`

- `moduleKey = offer`.
- `moduleVersion = 1`.
- Função:
  - apresentar o que o negócio ou profissional efetivamente oferece;
  - organizar a oferta por intenção, caso de uso ou necessidade atendida;
  - permitir que o visitante reconheça rapidamente se existe aderência ao que procura.
- Invariantes:
  - cada item representa uma oferta ou escopo real e identificável;
  - título e descrição do item permanecem coerentes entre si;
  - toda capacidade ou condição apresentada possui sustentação operacional;
  - a oferta não implica preço, prazo, garantia, disponibilidade temporal ou resultado não declarado;
  - ausência de identidade de taxon, plano, campanha ou funil no contrato.
- Fronteiras:
  - não repete pares de problema e solução;
  - não descreve etapas ou sequência de atendimento;
  - não apresenta prova técnica, depoimento, credencial ou FAQ;
  - não define preço, condição comercial, plano ou disponibilidade temporal na execução inicial;
  - não contém CTA, mídia, formulário ou interação na execução inicial.
- Evidências principais:
  - `servicos_por_intencao`, pesquisa ativa de `lp_sections`, taxon `Corretor Imóveis`;
  - itens `trigger`, `desire`, `positioning_opportunity`, `belief` e `objection` de `strategic_core`;
  - `narrative_arc` de `lp_overview`, que recomenda segmentação por intenção antes de processo e fechamento;
  - Blueprint do corretor, especialmente diferenciais objetivos e ofertas orientadas a intenção;
  - catálogo de entradas vigente, com capacidades e recortes operacionais aplicáveis ao primeiro taxon.
- Variantes futuras podem usar outra execução estrutural sem alterar `offer.standard@v1`.

### 3.8. Variante `offer.standard@v1`

Identidade:

- `variantKey = offer.standard`.
- `variantVersion = 1`.
- Compatível com `offer@v1` e com a versão vigente da raiz utilizada na implementação inicial.
- Única variante inicial.

Campos:

- `title`:
  - texto, papel `h2`, cardinalidade `1..1`, policy `research_guided`.
- `items`:
  - coleção, cardinalidade `1..4`, policy `not_copy`;
  - item fechado com `itemTitle` e `description`;
  - `itemTitle`: texto, papel `card_title`, cardinalidade `1..1`, policy `hybrid`, suporte `when_present`;
  - `description`: texto, papel `card_body`, cardinalidade `1..1`, policy `hybrid`, suporte `when_present`.

Copy:

- `title`: primárias `desire` e `trigger`; auxiliar `positioning_opportunity`.
- `itemTitle`: primárias `trigger` e `desire`; sem fonte auxiliar na v1.
- `description`: primárias `positioning_opportunity` e `belief`; auxiliar `objection`.

Regras específicas:

- uma ocorrência válida contém de um a quatro itens completos;
- o mínimo de um item permite LPs de intenção única sem forçar ofertas irrelevantes;
- cada item contém exatamente `itemTitle` e `description`;
- título e descrição representam uma oferta, escopo ou caso de uso efetivamente disponível como capacidade da operação;
- todo item exige suporte por entradas operacionais aplicáveis ao taxon, negócio ou oferta;
- o contrato transversal não fixa chaves de um taxon específico;
- no primeiro taxon, exemplos de sustentação incluem intenção de transação, apoio em financiamento, orientação documental, localização, tipologia, faixa de preço e estágio, quando aplicáveis e reais;
- pesquisa e Blueprint orientam seleção e redação, mas não comprovam capacidade, preço, prazo, condição, parceria, garantia, disponibilidade temporal ou resultado;
- os papéis `h2`, `card_title` e `card_body` usam as faixas da raiz sem especialização na v1;
- a coleção não admite item aninhado;
- não possui subtítulo, CTA, mídia, ícone, prova, preço, condição comercial, processo ou referência técnica;
- diferenças de copy, quantidade dentro de `1..4`, ordem dos itens e funil não criam variante;
- o tratamento da ausência de item válido depende da obrigatoriedade definida pela composição da E20 e será especificado pela E19.

Funil:

- BOFU prioriza oferta específica, aderência imediata e escopo operacional direto.
- MOFU prioriza comparação entre casos de uso e clareza sobre o atendimento disponível.
- TOFU prioriza categorias amplas e linguagem educativa, sem transformar interesse inicial em compromisso inexistente.
- O funil altera seleção, prioridade e redação dos itens, sem alterar campos, cardinalidades, variante ou ordem estrutural da LP.

Validações estruturais:

- exigir `title` e `items`;
- exigir cardinalidade `1..4` em `items`;
- exigir exatamente `itemTitle` e `description` em cada item;
- rejeitar coleção aninhada e campos extras;
- validar os papéis semânticos e as policies declaradas;
- exigir suporte `when_present` em `itemTitle` e `description`;
- rejeitar CTA, mídia, ação, prova, preço, condição comercial, processo ou referência técnica na variante;
- resolver de forma fail-closed e imutável.

Estado:

- contrato conceitualmente fechado;
- lifecycle `experimental`;
- propósito `controlled_test`;
- implementação ainda não autorizada por este ajuste documental.

## 4. Módulos pendentes

### 4.1. Estado

Permanecem pendentes:

- `process`;
- `technical_assurance`;
- `social_proof`;
- `faq`;
- `final_cta`.

Cada um receberá:

- contrato permanente do módulo;
- variante `standard@v1`;
- somente os detalhes exigidos por sua execução atual.

### 4.2. Sequência incremental

A implementação dos nove módulos ocorrerá em etapas dentro da E18.5:

1. contrato compartilhado de módulos e variantes;
2. `hero` e `trust_bar`;
3. `problem_solution`, `offer` e `process`;
4. `technical_assurance` e `social_proof`;
5. `faq` e `final_cta`;
6. validação integrada, documentação final e encerramento da E18.5.

A etapa seguinte só deve reproduzir o contrato compartilhado após ele estar validado pelos módulos anteriores.

### 4.3. Próxima ação

- Analisar `process` pelo checklist mínimo da seção 2.9.
- Separar `process` de `process.standard@v1`.
- Não alterar o arquivo novamente sem decisão humana sobre o contrato proposto.
- Não implementar código durante o fechamento conceitual.

## 5. Validação e encerramento

### 5.1. Validações da implementação

Quando a implementação for autorizada:

- validar schemas e registries;
- validar identidade e compatibilidade de módulo e variante;
- rejeitar campos, policies, capabilities e deltas desconhecidos;
- garantir resolução fail-closed e resultado imutável;
- validar apenas combinações efetivamente utilizadas;
- executar casos próprios e integração dos nove módulos;
- executar `npm ci`, validações aplicáveis, `npm run check` e `git diff --check`.

Alteração exclusivamente documental:

- `npm ci`: não aplicável;
- `npm run check`: não aplicável;
- `git diff --check`: obrigatório antes da entrega.

### 5.2. Regra de parada

Após os nove módulos e suas variantes `standard@v1`:

- encerrar a E18.5;
- não criar nova variante antes da primeira LP;
- não adicionar campo para cenário futuro;
- não criar policy ou capability sem consumidor;
- não antecipar matriz especulativa;
- não absorver renderer, composição ou geração;
- avançar para E20 e depois E19.

### 5.3. Estado de validação

- Implementação técnica significa contrato executável no repositório.
- Os módulos permanecem hipóteses de produto.
- Validação comercial ocorrerá somente quando a E20 compuser e a E19 gerar a primeira LP real.
- Promoção de lifecycle exige evidência dessa utilização e decisão humana.

### 5.4. Critérios de parada imediata

Parar e informar a divergência se:

- surgir banco, rota, job, agente, automação ou infraestrutura nova;
- módulo receber identidade de taxon;
- variante representar somente copy, campanha, plano ou ativo;
- regra de `standard@v1` for tratada como limite permanente do módulo;
- nova variante for antecipada;
- destino concreto entrar no registry;
- conteúdo factual puder ser inventado;
- E19, E20 ou renderer forem implementados implicitamente;
- alteração sair do arquivo e da branch autorizados;
- houver tentativa de merge na `main`.
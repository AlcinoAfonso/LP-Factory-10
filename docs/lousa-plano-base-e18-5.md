14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/lousa-plano-base-e20-2.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, consulta read-only ao Supabase, `lib/conversion-content/landing-page/`, `lib/conversion-content/landing-page/input-catalog/registry.ts`, PRs #559, #563, #564, #566, #567, #577 e #581, avaliações do Analista e decisões humanas de 14 a 17/07/2026.

Versão: v2 consolidada pelos pareceres especializados e pendente do gate do Analista.

Status: nove módulos e nove variantes `standard@v1` conceitualmente fechados; `faq.accordion@v1` aprovada como única variante adicional para validação controlada; patches do Gestor Estrutural e do Gestor de Updates consolidados; sete fases executáveis definidas; nenhuma implementação de código autorizada antes do gate do Analista e do merge humano.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

## 1. Estado e decisões fixas

### 1.1. Objetivo da E18.5

- Implementar no repositório o catálogo versionado dos nove módulos `landing_page`, suas variantes `standard@v1` e `faq.accordion@v1`.
- Entregar contratos pequenos, estritos, imutáveis e suficientes para consumo posterior pela E20 e pela E19.
- Preservar extensibilidade sem antecipar campos, capabilities ou variantes sem uso aprovado.

### 1.2. Estado confirmado

- A E18.4 está concluída e a raiz versionada existe em `lib/conversion-content/landing-page/`.
- A precedência permanece `raiz → módulo → variante`.
- A E18.5 é repo-only; ainda não existem composição, renderer ou render model deste recorte.
- O catálogo operacional já define `primary_conversion_channel` e destinos condicionais.
- `commercial_activation`, E18.2 e E18.3 permanecem preservados.
- O trabalho documental ocorre no PR #577 e na branch `docs/e18-5-modules-variants`.
- O PR não deve ser mergeado sem confirmação humana explícita.

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

- `item_key` é evidência de pesquisa, não identidade canônica do módulo.
- Os módulos são transversais e não recebem identidade de taxon.
- Formatos curto, médio e longo pertencem à composição e à extensão da LP.
- Não há módulo conceitual pendente.

### 1.4. Escopo positivo

- identidade e versão do catálogo, módulos e variantes;
- função, invariantes, fronteiras, campos, cardinalidades e capabilities;
- especializações sobre a raiz, fontes de copy e perfis de funil;
- exigências factuais e operacionais;
- tipos, schemas, registry, resolver, validadores, testes e exportação pública;
- lifecycle, compatibilidade e descontinuação.

### 1.5. Escopo negativo

- banco, migrations, Admin, Builder, composição concreta, LP real, renderer ou componente visual;
- persistência, snapshot, tracking ou conteúdo operacional concreto;
- variantes além de `standard@v1`, exceto `faq.accordion@v1`;
- capabilities sem consumidor aprovado.

## 2. Contrato compartilhado

### 2.1. Separação entre módulo e variante

Módulo define:

- função estrutural reutilizável;
- fronteiras, invariantes permanentes e integração comum;
- compatibilidade compartilhada.

Variante define:

- execução estrutural ou comportamental concreta;
- campos, cardinalidades, capabilities e deltas sobre a raiz;
- validações e requisitos técnicos, factuais, operacionais ou de acessibilidade.

### 2.2. Extensibilidade das variantes

- Cada módulo começa com `standard@v1`; `faq.accordion@v1` é a única exceção antes da primeira LP.
- Nova variante exige diferença estrutural ou comportamental reutilizável.
- A evolução deve ser aditiva e localizada, sem alteração destrutiva do módulo, das variantes existentes ou das LPs anteriores.
- Capability compartilhada ou infraestrutura inerente à nova execução pertence ao respectivo recorte e deve ser versionada quando necessário.
- Nova `moduleVersion` é exigida quando mudam função, fronteiras, invariantes ou integração comum.
- Nova `variantVersion` é exigida quando muda o contrato da variante.
- Toda referência identifica `moduleKey`, `moduleVersion`, `variantKey` e `variantVersion`.

Não criam variante isoladamente:

- taxon, plano, campanha, funil ou copy;
- troca de ativo, canal ou destino concreto;
- ordem na LP, quantidade já permitida ou ajuste visual/responsivo normal.

### 2.3. Herança, limites e resolução

- A raiz contém regras comuns; módulo e variante registram somente deltas necessários.
- Módulo ou variante pode restringir a raiz, mas não ampliar seu limite absoluto.
- Ampliação exige nova versão da raiz.
- Variante declara compatibilidade explícita com a versão da raiz utilizada.
- Variante imutável não muda pela disponibilidade posterior de nova capability.
- Contrato ausente, incompatível ou inválido falha fechado, sem fallback silencioso.
- Resultado resolvido é completo, profundamente imutável e sem referência mutável compartilhada.

### 2.4. Contrato mínimo de campo

Cada campo declara:

- `fieldKey`, `fieldKind`, cardinalidade e policy;
- `semanticRole`, quando textual;
- suporte operacional e capability específica, quando aplicáveis.

Notação da seção 3:

- texto: `fieldKey: semanticRole, cardinalidade, policy[, suporte]`; nessa notação `fieldKind = text` fica implícito;
- coleção, ação, mídia e referência técnica declaram o tipo explicitamente;
- campos internos de coleção declaram cardinalidade própria;
- coleção aninhada não integra a v1;
- ação não armazena canal ou destino concreto.

### 2.5. Copy e sustentação factual

- `copySourceMap` define até duas fontes primárias e uma auxiliar por campo textual.
- `funnelCopyProfile` adapta seleção e redação para BOFU, MOFU e TOFU, sem redefinir sozinho estrutura ou ordem.
- Pesquisa orienta copy, mas não comprova fatos da operação.
- Credencial, capacidade, condição, preço, prazo, parceria, resultado, garantia ou ação concreta exige suporte operacional real.
- A E19 resolve valores e valida a instância concreta.
- Policies aprovadas: `research_guided`, `hybrid`, `operational_required`, `technical_reference` e `not_copy`.

#### 2.5.1. Perfil padrão por intenção de funil

| Perfil | Fontes priorizadas | Tratamentos permitidos | Tratamentos restritos | Tratamentos proibidos |
|---|---|---|---|---|
| BOFU | `trigger`, `desire`, `objection`, `proof_type`, `positioning_opportunity` | próximo passo direto, resposta a objeção e prova sustentada | urgência, condição, preço, prazo, garantia ou disponibilidade somente com suporte operacional real | coerção, escassez, promessa, credencial ou resultado sem evidência |
| MOFU | `pain`, `belief`, `positioning_opportunity`, `objection`, `proof_type`, `narrative_arc` | educação, relação problema-solução, processo, segurança técnica e FAQ | CTA direto somente não coercitivo; oferta e prova somente quando sustentadas | preço, urgência, garantia, comparação ou resultado inventados |
| TOFU | `awareness_level`, `search_intent`, `pain`, `desire`, `belief`, `positioning_opportunity` | contexto, reconhecimento do problema, desejo e educação introdutória | oferta e CTA em linguagem de baixa pressão; prova factual somente quando sustentada | escassez, urgência, garantia, condição comercial ou promessa de resultado |

Regras de aplicação:

- O perfil seleciona e prioriza somente fontes já permitidas pelo `copySourceMap` do campo; não altera estrutura, cardinalidade, ordem, policy nem suporte factual.
- `hero` e `final_cta` adaptam intensidade e próxima ação ao perfil; `problem_solution` e `faq` adaptam consciência, dor e objeção; `offer` e `process` adaptam intenção e progressão; `trust_bar`, `technical_assurance` e `social_proof` preservam prova verificável em qualquer perfil.
- Quando nenhuma fonte permitida sustentar o tratamento requerido, a E19 não inventa copy factual; o campo opcional é omitido conforme a composição, e campo obrigatório torna a instância inválida.

#### 2.5.2. `copySourceMap` fechado por campo textual

| Variante e campo | Fontes principais | Fonte auxiliar |
|---|---|---|
| `hero.standard.eyebrow` | `positioning_opportunity`, `trigger` | `desire` |
| `hero.standard.title` | `positioning_opportunity`, `desire` | `trigger` |
| `hero.standard.subtitle` | `pain`, `desire` | `objection` |
| `hero.standard.primaryCta.label` | `trigger`, `desire` | `objection` |
| `hero.standard.proofShort` | `proof_type`, `belief` | `objection` |
| `trust_bar.standard.items[].text` | `proof_type`, `belief` | `objection` |
| `problem_solution.standard.title` | `pain`, `desire` | `fear` |
| `problem_solution.standard.items[].problem` | `pain`, `fear` | `objection` |
| `problem_solution.standard.items[].solution` | `positioning_opportunity`, `desire` | `belief` |
| `offer.standard.title` | `desire`, `trigger` | `positioning_opportunity` |
| `offer.standard.items[].itemTitle` | `trigger`, `desire` | `positioning_opportunity` |
| `offer.standard.items[].description` | `positioning_opportunity`, `belief` | `objection` |
| `process.standard.title` | `belief`, `desire` | `objection` |
| `process.standard.steps[].stepTitle` | `narrative_arc`, `trigger` | `belief` |
| `process.standard.steps[].stepBody` | `belief`, `desire` | `positioning_opportunity` |
| `technical_assurance.standard.title` | `proof_type`, `belief` | `fear` |
| `technical_assurance.standard.items[].assuranceTitle` | `proof_type`, `positioning_opportunity` | `objection` |
| `technical_assurance.standard.items[].assuranceBody` | `proof_type`, `belief` | `fear` |
| `social_proof.standard.title` | `proof_type`, `belief` | `objection` |
| `social_proof.standard.items[].quote` | N/A — conteúdo `operational_required` obtido da evidência | N/A |
| `social_proof.standard.items[].attribution` | N/A — conteúdo `operational_required` obtido da evidência | N/A |
| `faq.standard.title` e `faq.accordion.title` | `objection`, `awareness_level` | `search_intent` |
| `faq.standard.items[].question` e `faq.accordion.items[].question` | `objection`, `fear` | `search_intent` |
| `faq.standard.items[].answer` e `faq.accordion.items[].answer` | `belief`, `positioning_opportunity` | `proof_type` |
| `final_cta.standard.title` | `trigger`, `desire` | `positioning_opportunity` |
| `final_cta.standard.body` | `desire`, `objection` | `belief` |
| `final_cta.standard.primaryCta.label` | `trigger`, `desire` | `objection` |

Campos `not_copy`, mídia e referências técnicas não recebem `copySourceMap`.

### 2.6. Ações e vínculos operacionais

- Ação possui label e vínculo abstrato com campo estável do catálogo operacional.
- A E18.5 registra na ação somente o vínculo abstrato com `primary_conversion_channel`; não registra allowlist de canais, destinos concretos ou regras de resolução operacional.
- Valores permitidos e destinos condicionais permanecem exclusivamente no `landingPageInputCatalog`.
- O resolver da E18.5 não consulta nem replica o catálogo de entradas.
- `hero.standard@v1` e `final_cta.standard@v1` expõem a metadata estrutural tipada `actionCompatibility.supportsPrimaryConversionForm = false`; ela não consulta nem replica valores do catálogo operacional.
- Quando o canal operacional canônico resolvido for `form`, a E20 não deve selecionar ocorrência cuja metadata seja `false`, quando esse dado estiver disponível; a E19 avalia o valor concreto resolvido e falha fechado se receber composição incompatível, sem fallback para outro canal.
- A E18.5 apenas expõe a metadata de compatibilidade; não implementa seleção de composição nem resolução do valor operacional.
- A E19 resolve o campo operacional, condicionais e destino.
- Nova chave operacional não pode ser criada implicitamente pela E18.5.

### 2.7. Lifecycle e compatibilidade

- `moduleCatalogVersion` declara versão e compatibilidade com a raiz.
- Módulos e variantes reutilizam o vocabulário canônico da raiz: `hypothesis`, `validated` e `deprecated`.
- O contrato público do sub-boundary deve expor um alias tipado para `LandingPageRootLifecycleStatus`, sem criar uma segunda união literal de estados.
- Todos os módulos e variantes iniciam em `hypothesis`, com propósito `controlled_test`.
- Promoção para `validated` exige LP real, revisão e decisão humanas.
- A E18.5 expõe `deprecated` e preserva leitura histórica; a E20 consumidora deve bloquear novas composições com módulo ou variante depreciado.
- A E18.5 não implementa enforcement de composição.
- Lifecycle da raiz, do módulo e da variante permanece registrado separadamente, mas usa o mesmo vocabulário; estado desconhecido falha fechado.

### 2.8. Fronteiras entre etapas

- E18.5 define validade estrutural e implementa contratos repo-only.
- E20 escolhe módulos, variantes, versões, ordem, obrigatoriedade e opções por ocorrência.
- E19 resolve conteúdo, ativos e vínculos, trata ausência conforme E20 e preserva versões e payload.
- Renderer executa o contrato resolvido; não escolhe variante, conteúdo ou fallback.

### 2.9. Checklist de fechamento

Obrigatório:

- identidade, função, evidência, fronteiras e invariantes;
- `standard@v1`, campos, cardinalidades, copy, suporte factual, lifecycle e compatibilidade.

Condicional:

- ação, mídia, interação, responsividade, acessibilidade, fallback técnico ou referência técnica.

### 2.10. Significado de implementação

Um módulo está implementado quando existem:

- identidade versionada do módulo e variantes aprovadas;
- tipos, schemas, fields, cardinalidades e capabilities;
- registry, resolver, validadores, casos executáveis e testes;
- lifecycle, compatibilidade e exportação pelo boundary existente.

Compatibilidade comum da seção 3:

- cada `standard@v1` é compatível somente com o respectivo módulo `@v1` e com a raiz inicial;
- `faq.accordion@v1` é compatível com `faq@v1` e com a mesma raiz;
- definições compartilhadas podem ser reutilizadas, mas variantes irmãs não herdam semanticamente entre si.

## 3. Contratos conceitualmente fechados

### 3.1. Módulo `hero`

- Identidade: `hero@v1`.
- Função: apresentar a proposta principal e conduzir à rota prioritária.
- Invariantes: proposta identificável, hierarquia coerente e ação abstrata quando usada.
- Fronteiras: sem formulário completo, galeria, carrossel, tour, navegação global, oferta detalhada ou prova extensa.
- Evidência: `hero_segmentado` e Blueprint.

### 3.2. Variante `hero.standard@v1`

- Campos: `eyebrow` (`eyebrow`, `0..1`, `research_guided`); `title` (`h1`, `1..1`, `hybrid`, `when_factual`); `subtitle` (`paragraph`, `1..1`, `hybrid`, `when_factual`); `primaryCta` (ação `1..1`, label `cta_label`, `hybrid`, `when_present`, vínculo com `primary_conversion_channel`); `proofShort` (`paragraph`, `0..1`, `hybrid`, `when_present`); `media` (imagem `0..1`, `technical_reference`).
- Copy: posicionamento/desejo no título; dor/desejo no subtítulo; trigger no CTA; prova/objeção em `proofShort`.
- Regras: mídia informativa exige alternativa; `all_viewports`; sem CTA secundário, vídeo, formulário ou interação; declara `actionCompatibility.supportsPrimaryConversionForm = false`.
- Estado: `hypothesis`, `controlled_test`.

### 3.3. Módulo `trust_bar`

- Identidade: `trust_bar@v1`.
- Função: sinais curtos e verificáveis de confiança.
- Invariantes: brevidade, relevância e suporte real.
- Fronteiras: sem depoimento, prova extensa, CTA, formulário ou mídia.
- Evidência: `barra_de_confianca`.

### 3.4. Variante `trust_bar.standard@v1`

- `items`: coleção `2..4`, `not_copy`; `text`: `benefit_item`, `1..1`, `hybrid`, `when_present`.
- Copy: `proof_type`, `belief`; auxiliar `objection`.
- Regras: cada item exige suporte; sem título, CTA, ícone ou mídia; responsividade pertence ao renderer.
- Estado: `hypothesis`, `controlled_test`.

### 3.5. Módulo `problem_solution`

- Identidade: `problem_solution@v1`.
- Função: relacionar problema ou risco a resposta prática.
- Invariantes: correspondência direta, distinção clara, sem alarmismo.
- Fronteiras: sem oferta detalhada, processo, prova, FAQ, CTA, mídia ou interação.
- Evidência: `dores_e_solucoes`, `pain`, `fear`, `objection`, `desire`, `belief`, `positioning_opportunity`.

### 3.6. Variante `problem_solution.standard@v1`

- `title`: `h2`, `1..1`, `research_guided`.
- `items`: coleção `2..4`, com `problem` (`card_title`, `1..1`, `research_guided`) e `solution` (`card_body`, `1..1`, `hybrid`, `when_present`).
- Copy: dor/desejo no título; dor/medo no problema; posicionamento/desejo na solução.
- Regras: solução responde ao problema do item; sem CTA, mídia, prova, preço, oferta ou processo.
- Estado: `hypothesis`, `controlled_test`.

### 3.7. Módulo `offer`

- Identidade: `offer@v1`.
- Função: apresentar ofertas ou casos de uso disponíveis.
- Invariantes: item real, coerente e operacionalmente sustentado.
- Fronteiras: sem preço, condição comercial, CTA, mídia, prova, processo ou FAQ.
- Evidência: `servicos_por_intencao`, `trigger`, `desire`, `positioning_opportunity`, `belief`, `objection`, Blueprint e catálogo de entradas.

### 3.8. Variante `offer.standard@v1`

- `title`: `h2`, `1..1`, `research_guided`.
- `items`: coleção `1..4`, com `itemTitle` (`card_title`, `1..1`, `hybrid`, `when_present`) e `description` (`card_body`, `1..1`, `hybrid`, `when_present`).
- Copy: desejo/trigger no título e item; posicionamento/belief na descrição.
- Regras: cada item exige capacidade real; pesquisa não comprova preço, prazo, parceria, garantia ou disponibilidade.
- Estado: `hypothesis`, `controlled_test`.

### 3.9. Módulo `process`

- Identidade: `process@v1`.
- Função: explicar progressão real por etapas.
- Invariantes: ordem, etapas distintas e ausência de prazo ou resultado inventado.
- Fronteiras: sem oferta, prova, FAQ, CTA, preço, mídia ou interação.
- Evidência: `processo_de_atendimento`, `belief`, `desire`, `positioning_opportunity`, `trigger`, `objection`, Blueprint e catálogo.

### 3.10. Variante `process.standard@v1`

- `title`: `h2`, `1..1`, `research_guided`.
- `steps`: coleção ordenada `2..6`, com `stepTitle` (`step_title`, `1..1`, `hybrid`, `when_present`) e `stepBody` (`step_body`, `1..1`, `hybrid`, `when_present`).
- Copy: belief/desejo no título e corpo no título da etapa.
- Regras: ordem reflete progressão real; numeração é do renderer; sem CTA, mídia, prova, preço ou formulário.
- Estado: `hypothesis`, `controlled_test`.

### 3.11. Módulo `technical_assurance`

- Identidade: `technical_assurance@v1`.
- Função: explicar salvaguardas, critérios, documentos, credenciais ou verificações.
- Invariantes: item real e verificável, sem implicar risco zero, aprovação ou resultado.
- Fronteiras: sem trust bar, depoimento, processo, oferta, FAQ, CTA, mídia, download ou link.
- Evidência: `prova_tecnica_documental`, `proof_type`, `belief`, `fear`, `objection`, `positioning_opportunity`, narrativa e Blueprint.

### 3.12. Variante `technical_assurance.standard@v1`

- `title`: `h2`, `1..1`, `research_guided`.
- `items`: coleção `1..4`, com `assuranceTitle` (`card_title`, `1..1`, `hybrid`, `when_present`) e `assuranceBody` (`card_body`, `1..1`, `hybrid`, `when_present`).
- Copy: prova/belief no título; prova/posicionamento no corpo.
- Regras: todo item exige suporte rastreável; sem aconselhamento individualizado, CTA, mídia, link, depoimento, preço, processo ou FAQ.
- Estado: `hypothesis`, `controlled_test`.

### 3.13. Módulo `social_proof`

- Identidade: `social_proof@v1`.
- Função: apresentar experiências reais de terceiros.
- Invariantes: prova real, rastreável, autorizada e sem alteração material.
- Fronteiras: sem trust bar, prova técnica, oferta, processo, FAQ, CTA, rating, métrica, logo, caso detalhado ou mídia.
- Evidência: `prova_social`, `proof_type`, `belief`, `objection`, narrativa e Blueprint.

### 3.14. Variante `social_proof.standard@v1`

- `title`: `h2`, `1..1`, `research_guided`.
- `items`: coleção `1..3`, com `quote` (`card_body`, `1..1`, `operational_required`), `attribution` (`card_title`, `1..1`, `operational_required`) e `evidenceRef` (referência técnica `1..1`, `technical_reference`).
- Copy: título por prova/belief; quote e atribuição exclusivamente da evidência.
- Regras: impedir fabricação ou alteração; atribuição pública depende de autorização.
- Estado: `hypothesis`, `controlled_test`.

### 3.15. Módulo `faq`

- Identidade: `faq@v1`.
- Função: responder dúvidas e objeções em pares de pergunta e resposta.
- Invariantes: pergunta relevante, resposta direta, suporte factual e ausência de aconselhamento ou promessa enganosa.
- Fronteiras: sem oferta, processo, prova técnica, CTA, mídia, formulário ou ação; interação pertence à variante.
- Evidência: `faq_objeções`, `faq_questions`, `search_intent`, `objection`, `fear`, `belief`, `awareness_level` e Blueprint.

### 3.16. Variante `faq.standard@v1`

- `title`: `h2`, `1..1`, `research_guided`.
- `items`: coleção `2..6`, com `question` (`faq_question`, `1..1`, `research_guided`) e `answer` (`faq_answer`, `1..1`, `hybrid`, `when_factual`).
- Copy: objeção/awareness no título; objeção/medo na pergunta; belief/posicionamento na resposta.
- Regras: sem duplicidade; resposta direta; fatos legais, técnicos, financeiros ou operacionais exigem suporte; sem interação.
- Estado: `hypothesis`, `controlled_test`.

### 3.17. Variante `faq.accordion@v1`

- Identidade: compatível com `faq@v1` e a raiz inicial.
- Declara o mesmo contrato de campos da variante standard, sem herança semântica; não adiciona conteúdo.
- Capability: interação de acordeão e acessibilidade.
- Comportamento: todos fechados inicialmente; abre/fecha pelo controle; somente um aberto; teclado; estado e associação acessíveis; foco preservado.
- Baseline de acessibilidade: WCAG 2.2 é a referência normativa de produto para `faq.accordion@v1`. Nesta E18.5, o contrato repo-only limita-se a exigir operação por teclado, exposição e associação acessível do estado expandido ou recolhido e preservação de foco. A conformidade da interface — inclusive contraste, tamanho de alvo, rotulagem concreta, semântica HTML e validação visual — pertence ao futuro renderer e à LP real.
- Limites: não define HTML, componente, ícone, animação ou visual.
- Estado: `hypothesis`, `controlled_test`, candidata à primeira composição controlada.

### 3.18. Módulo `final_cta`

- Identidade: `final_cta@v1`.
- Função: encerrar a jornada com próximo passo claro e qualificado.
- Invariantes: uma ação principal, linguagem não coercitiva, vínculo abstrato e suporte factual.
- Fronteiras: sem repetição de oferta, processo, FAQ ou prova; sem formulário, mídia, ação secundária ou destino concreto.
- Evidência: `cta_final_qualificado`, `narrative_arc`, `mobile_priority`, `trigger`, `desire`, `objection`, `belief`, `positioning_opportunity`, `search_intent` e catálogo operacional.

### 3.19. Variante `final_cta.standard@v1`

- `title`: `h2`, `1..1`, `hybrid`, `when_factual`.
- `body`: `paragraph`, `1..1`, `hybrid`, `when_factual`.
- `primaryCta`: ação `1..1`, label `cta_label`, `hybrid`, `when_present`, vínculo obrigatório com `primary_conversion_channel`.
- Copy: trigger/desejo no título; desejo/objeção no body; trigger no label.
- Regras: uma ação; sem destino no registry; sem CTA secundário, formulário, mídia, preço ou condição; declara `actionCompatibility.supportsPrimaryConversionForm = false`.
- Estado: `hypothesis`, `controlled_test`.

## 4. Fases e próxima ação

### 4.1. Estado

- Os nove módulos, as nove variantes `standard@v1` e `faq.accordion@v1` estão conceitualmente fechados.
- Não há parametrização aprovada pendente.

### 4.2. Fases executáveis

Regra comum:

- as sete fases usam exatamente os identificadores previstos em `docs/lp-planejamento.md`, sem aliases ordinais;
- todas declaram `Automação: não` porque não implementam automação de produto;
- são executadas na ordem abaixo, na mesma branch e no mesmo PR draft, sem merge intermediário;
- cada avanço exige validações aplicáveis e `aprovado para avançar` do Analista;
- no modo experimental, o orquestrador entrega relatório e para após cada checkpoint;
- o sub-boundary permanece `lib/conversion-content/landing-page/module-catalog/`, limitado a `contracts.ts`, `registry.ts`, `schema.ts`, `resolver.ts`, `validation-cases.ts` e `index.ts`;
- somente `package.json` e, na fase E18.5.9, `lib/conversion-content/index.ts` podem ser alterados fora dele, ressalvada a documentação de encerramento;
- banco, migration, rota, renderer, composição, persistência, tracking, infraestrutura ou mudança destrutiva bloqueiam a execução.

#### 4.2.1. E18.5.3 — Módulos e funções estruturais

- Automação: não.
- Objetivo: criar a base interna versionada do catálogo e registrar os nove módulos.
- Entregas:
  - criar a base de `contracts.ts`, `registry.ts`, `schema.ts` e `validation-cases.ts`;
  - registrar `family = landing_page`, `moduleCatalogVersion = 1`, compatibilidade com a raiz v1 e as nove identidades de módulo;
  - fixar função, fronteiras, invariantes, lifecycle `hypothesis` e propósito `controlled_test` de cada módulo;
  - adicionar `validate:landing-page-module-catalog` ao `package.json`, sem export público do catálogo.
- Critérios de aceite:
  - identidades e valores estruturais são literais fechados, imutáveis e sem colisão com `commercial_activation`;
  - nenhum módulo contém taxon, campanha, plano, copy, ativo, ordem, canal ou destino concreto;
  - nenhuma variante, field, source map ou profile é antecipado como API pública.
- Validações: `npm ci`, validação própria da fase, `npm run check` e `git diff --check`.

#### 4.2.2. E18.5.4 — Campos, estruturas e cardinalidades

- Automação: não.
- Objetivo: implementar a gramática fechada de fields e cardinalidades descrita nas seções 2.4 e 3.
- Entregas:
  - implementar `fieldKind`, policies, supports, `semanticRole` e cardinalidades;
  - implementar os shapes de texto, coleção, ação, imagem e referência técnica;
  - registrar os contratos de fields das dez variantes aprovadas em `registry.ts` e validá-los em `schema.ts`, sem arquivo paralelo de catálogo.
- Critérios de aceite:
  - somente literais e combinações aprovados são aceitos;
  - fields e cardinalidades pertencem às variantes; módulos não recebem catálogo próprio de fields;
  - field, path, shape, cardinalidade ou policy desconhecidos falham fechado;
  - coleção aninhada e destino concreto não integram a v1;
  - o catálogo permanece sem API pública consumível.
- Validações: casos positivos e negativos de todos os kinds e cardinalidades, validação própria, `npm run check` e `git diff --check`.

#### 4.2.3. E18.5.5 — Variantes e critérios de criação

- Automação: não.
- Objetivo: registrar as dez variantes aprovadas e suas capabilities estruturais.
- Entregas:
  - registrar as nove variantes `standard@v1` e `faq.accordion@v1`;
  - vincular os fields às variantes compatíveis;
  - implementar as capabilities `primary_action`, `image_asset` e `accordion_interaction`;
  - expor `actionCompatibility.supportsPrimaryConversionForm = false` em Hero e Final CTA.
- Critérios de aceite:
  - cada variante pertence a um único módulo e versão compatível;
  - `faq.accordion@v1` preserva `faq.standard@v1`, sem herança semântica, e registra o contrato abstrato WCAG 2.2 de teclado, estado, associação acessível e foco;
  - diferença apenas de taxon, copy, plano, campanha, ativo, ordem ou quantidade não cria variante;
  - capability desconhecida e fallback de canal falham fechado.
- Validações: dez identidades, independência das FAQs, metadata de formulário, contrato abstrato de acessibilidade, validação própria, `npm run check` e `git diff --check`.

#### 4.2.4. E18.5.6 — Especializações sobre a parametrização raiz

- Automação: não.
- Objetivo: implementar a precedência `raiz → módulo → variante` sem duplicar a raiz canônica.
- Entregas:
  - tipar compatibilidade com a versão da raiz e deltas de módulo e variante;
  - reutilizar contratos públicos da raiz, inclusive `semanticRole` e lifecycle;
  - validar que especializações apenas restringem regras e limites absolutos da raiz.
- Critérios de aceite:
  - nenhuma importação de registry interno da raiz nem duplicação de roles, limits ou lifecycle;
  - ampliação de limite absoluto exige nova versão da raiz;
  - contrato ausente, incompatível ou inválido falha fechado;
  - as APIs de `landingPageRoot`, `landingPageResearch` e `landingPageInputCatalog` permanecem preservadas.
- Validações: compatibilidade, restrições e deltas inválidos, validação existente da raiz, validação própria, `npm run check` e `git diff --check`.

#### 4.2.5. E18.5.7 — Mapa de fontes de copy

- Automação: não.
- Objetivo: implementar o `copySourceMap` fechado de cada field textual da seção 2.5.2.
- Entregas:
  - registrar paths exatos, até duas fontes primárias e uma auxiliar;
  - separar `research` de `operational_evidence` sem consultar nem replicar o catálogo de entradas.
- Critérios de aceite:
  - todo path pertence à variante correspondente e todo `item_key` pertence aos conjuntos permitidos;
  - Social Proof preserva quote e attribution como evidência operacional;
  - source mode, path, item key, quantidade ou mapa órfão desconhecidos falham fechado.
- Validações: todos os fields mapeados e casos negativos de fonte, quantidade e path, validação própria, `npm run check` e `git diff --check`.

#### 4.2.6. E18.5.8 — Perfis de copy por intenção e funil

- Automação: não.
- Objetivo: implementar os perfis BOFU, MOFU e TOFU da seção 2.5.1.
- Entregas:
  - registrar treatments permitidos, restritos e proibidos e `ctaMode` literal por perfil;
  - implementar deltas por módulo e preservar o mesmo delta para as duas variantes de FAQ.
- Critérios de aceite:
  - cada treatment aparece exatamente uma vez por perfil;
  - `ctaMode` corresponde ao tratamento de ação;
  - deltas somente restringem, proíbem ou enfatizam tratamentos conhecidos;
  - alias, treatment, conflito ou `ctaMode` desconhecido falha fechado.
- Validações: três perfis completos, deltas dos nove módulos e dez variantes, casos negativos, validação própria, `npm run check` e `git diff --check`.

#### 4.2.7. E18.5.9 — Ciclo de vida, compatibilidade e validação

- Automação: não.
- Objetivo: fechar resolução, API pública, lifecycle, compatibilidade e regressões do catálogo completo.
- Entregas:
  - finalizar `resolver.ts`, `validation-cases.ts` e `index.ts`;
  - expor somente tipos públicos e o resolver autorizados;
  - adicionar `landingPageModuleCatalog` a `lib/conversion-content/index.ts`;
  - resolver dez resultados módulo-variante com cópia profundamente imutável e sem fallback.
- Critérios de aceite:
  - versões, identidades, compatibilidade, lifecycle e contratos desconhecidos falham fechado;
  - raiz, módulo e variante usam o vocabulário canônico e mantêm estados separados;
  - os nove módulos e as dez variantes preservam lifecycle `hypothesis`;
  - a saída expõe `deprecated`, sem implementar o bloqueio de composição pertencente à E20;
  - `registry.ts` é a única fonte dos contratos efetivamente resolvidos;
  - `schema.ts` valida estrutura e invariantes sem duplicar o catálogo resolvido nem introduzir fallback;
  - `resolver.ts` consulta exclusivamente o registry e devolve cópia profundamente imutável, sem referência mutável compartilhada;
  - registry e schema não integram a API pública;
  - não reaparecem composição, renderer, render model nem arquivos removidos na raiz `landing-page/`.
- Validação integrada obrigatória:
  1. `npm ci`
  2. `npm run validate:landing-page-root`
  3. `npm run validate:landing-page-research`
  4. `npm run validate:landing-page-input-catalog`
  5. `npm run validate:landing-page-module-catalog`
  6. `npm run validate:commercial-activation`
  7. `npm run check`
  8. `git diff --check`
- Os oito comandos devem terminar com código zero; casos negativos devem falhar pelo resultado discriminado esperado, não por exceção não tratada.
- A validação própria deve comprovar lifecycle `hypothesis` nos nove módulos e nas dez variantes, resolução exclusivamente pelo registry, ausência de fallback, imutabilidade profunda e ausência de referências mutáveis compartilhadas.

### 4.3. Próxima ação

- Submeter esta v2 ao gate independente e à auditoria de consolidação do Analista.
- Preservar integralmente os pareceres do Gestor Estrutural e do Gestor de Updates na matriz de consolidação.
- Não chamar Gestor de Automação, pois as fases estão marcadas como `Automação: não`.
- Submeter esta correção de topologia ao Analista em `revisao_delta`.
- Não autorizar E18.5.3 antes da aprovação do delta e do merge humano do plano-base v2.

## 5. Validação e encerramento

### 5.1. Validação do plano v2

- Existem sete fases executáveis e necessárias ao recorte, de E18.5.3 a E18.5.9.
- Cada fase usa somente o identificador canônico previsto em `docs/lp-planejamento.md` e declara `Automação: não`.
- Validações técnicas integram os critérios de aceite, sem fase administrativa separada.
- Não existe fase própria de governança, handoff, revisão, documentação final ou encerramento.
- Os identificadores previstos não atualizam `docs/roadmap.md` automaticamente.

Encerramento documental obrigatório, sem criar fase administrativa separada:

- Após a implementação e as validações materiais, atualizar `docs/base-tecnica.md` com o contrato durável do catálogo E18.5: sub-boundary canônico, registry como fonte única, namespace público, resolução fail-closed, imutabilidade, comando de validação e limites repo-only sem banco, UI, composição ou renderer.
- Atualizar a seção 18.5 de `docs/roadmap.md` com o status efetivamente alcançado e o inventário real de arquivos criados e ajustados.
- Não registrar implementação, aprovação ou conclusão antes de existirem diff material e evidências de validação correspondentes.
- O caso E18.5 não pode ser encerrado enquanto `docs/base-tecnica.md` e `docs/roadmap.md` permanecerem no estado anterior à implementação.
- Base Técnica e roadmap devem descrever o mesmo boundary, namespace, script e escopo material presentes no diff; o inventário do roadmap deve corresponder aos arquivos realmente criados e alterados.
- Nenhuma mudança de banco, UI, renderer, composição ou infraestrutura pode ser registrada.

Alteração exclusivamente documental:

- `npm ci`: não aplicável;
- `npm run check`: não aplicável;
- `git diff --check`: obrigatório quando houver ambiente local disponível.

### 5.2. Regra de parada

- encerrar a E18.5 após a implementação aprovada;
- não criar outra variante antes da primeira LP;
- não adicionar campo para cenário futuro;
- não criar policy ou capability sem consumidor;
- não antecipar renderer, composição ou geração;
- avançar para E20 e depois E19.

### 5.3. Estado de validação

- Implementação técnica significa contrato executável no repositório.
- Os módulos permanecem hipóteses até validação por LP real.
- Promoção de lifecycle exige evidência e decisão humana.

### 5.4. Critérios de parada imediata

Parar e informar se:

- surgir banco, rota, job, agente, automação ou infraestrutura sem fonte e recorte próprios;
- módulo receber identidade de taxon;
- variante representar apenas copy, campanha, plano ou ativo;
- regra de `standard@v1` for tratada como limite permanente do módulo;
- variante não aprovada for antecipada;
- destino concreto entrar no registry;
- conteúdo factual puder ser inventado;
- E19, E20 ou renderer forem implementados implicitamente;
- alteração sair do arquivo ou branch autorizados;
- houver tentativa de merge na `main`.

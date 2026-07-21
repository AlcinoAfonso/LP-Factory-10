14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/lousa-plano-base-e20-2.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, consulta read-only ao Supabase, `lib/conversion-content/landing-page/`, `lib/conversion-content/landing-page/input-catalog/registry.ts`, PRs #559, #563, #564, #566, #567, #577 e #581, avaliações do Analista e decisões humanas de 14 a 17/07/2026.

Versão: v1 conceitualmente fechada.

Status: nove módulos e nove variantes `standard@v1` conceitualmente fechados; `faq.accordion@v1` aprovada como única variante adicional para validação controlada; uma fase executável definida; nenhuma implementação de código autorizada neste PR.

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

### 2.6. Ações e vínculos operacionais

- Ação possui label e vínculo abstrato com campo estável do catálogo operacional.
- O registry não armazena valor, canal ou destino concreto.
- A E19 resolve o campo operacional, condicionais e destino.
- Nova chave operacional não pode ser criada implicitamente pela E18.5.

### 2.7. Lifecycle e compatibilidade

- `moduleCatalogVersion` declara versão e compatibilidade com a raiz.
- Módulo e variante usam `experimental`, `active` ou `deprecated`.
- Todos começam `experimental`, com propósito `controlled_test`.
- Promoção para `active` exige LP real, revisão e decisão humanas.
- `deprecated` bloqueia novas composições, mas preserva leitura histórica.

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
- Regras: canais `whatsapp`, `phone`, `email`, `external_url`; mídia informativa exige alternativa; `all_viewports`; sem CTA secundário, vídeo, formulário ou interação.
- Estado: `experimental`, `controlled_test`.

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
- Estado: `experimental`, `controlled_test`.

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
- Estado: `experimental`, `controlled_test`.

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
- Estado: `experimental`, `controlled_test`.

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
- Estado: `experimental`, `controlled_test`.

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
- Estado: `experimental`, `controlled_test`.

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
- Estado: `experimental`, `controlled_test`.

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
- Estado: `experimental`, `controlled_test`.

### 3.17. Variante `faq.accordion@v1`

- Identidade: compatível com `faq@v1` e a raiz inicial.
- Declara o mesmo contrato de campos da variante standard, sem herança semântica; não adiciona conteúdo.
- Capability: interação de acordeão e acessibilidade.
- Comportamento: todos fechados inicialmente; abre/fecha pelo controle; somente um aberto; teclado; estado e associação acessíveis; foco preservado.
- Limites: não define HTML, componente, ícone, animação ou visual.
- Estado: `experimental`, `controlled_test`, candidata à primeira composição controlada.

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
- Regras: canais `whatsapp`, `phone`, `email`, `external_url`; uma ação; sem destino no registry; sem CTA secundário, formulário, mídia, preço ou condição.
- Estado: `experimental`, `controlled_test`.

## 4. Fases e próxima ação

### 4.1. Estado

- Os nove módulos, as nove variantes `standard@v1` e `faq.accordion@v1` estão conceitualmente fechados.
- Não há parametrização aprovada pendente.

### 4.2. Fase executável

#### 4.2.1. Fase 3.1 — E18.5.3–E18.5.9 — Catálogo repo-only de módulos e variantes

- Automação: não.
- Objetivo:
  - implementar no boundary existente o contrato compartilhado, os nove módulos, as nove variantes `standard@v1` e `faq.accordion@v1`.
- Entregas:
  - contratos e tipos públicos profundamente `readonly`;
  - schemas estritos, registry versionado, resolver fail-closed, validadores e casos executáveis;
  - exportação pública e script próprio de validação no `package.json`;
  - fixtures somente quando úteis ao padrão de teste.
- Critérios de aceite:
  - identidade e compatibilidade completas;
  - lifecycle `experimental` e propósito `controlled_test`;
  - todos os módulos e variantes aprovados resolvidos e validados;
  - `faq.accordion@v1` preserva `faq.standard@v1` e valida interaction sem herança entre variantes;
  - rejeição de campos, policies, capabilities, versões e deltas desconhecidos;
  - resultado profundamente imutável, sem fallback ou referência mutável compartilhada;
  - nenhuma regra específica de E19, E20, renderer, Admin, Builder ou banco;
  - `npm ci`, validação própria da E18.5, `npm run check` e `git diff --check` aprovados.
- Parada:
  - necessidade de banco, migration, rota, renderer, composição, persistência, tracking, infraestrutura ou mudança destrutiva retorna ao Estrategista.

### 4.3. Próxima ação

- Executar o item 5 de `docs/prompt-estrategista.md`.
- Solicitar avaliação única do plano completo pelo Analista, Gestor Estrutural e Gestor de Updates.
- Não chamar Gestor de Automação, pois a fase está marcada como `Automação: não`.
- Consolidar os pareceres no mesmo PR como plano-base v2 antes de solicitar o merge humano.
- Não autorizar a fase 3.1 antes da consolidação e do merge do plano-base v2 na `main`.

## 5. Validação e encerramento

### 5.1. Validação do plano v1

- Existe uma única fase executável e necessária ao recorte.
- A fase usa identificadores implementáveis da E18.5 e declara `Automação: não`.
- Validações técnicas integram os critérios de aceite, sem fase administrativa separada.
- Não existe fase própria de governança, handoff, revisão, documentação final ou encerramento.
- Os identificadores previstos não atualizam `docs/roadmap.md` automaticamente.

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

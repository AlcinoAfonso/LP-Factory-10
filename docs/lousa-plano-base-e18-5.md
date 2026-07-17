14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/lousa-plano-base-e20-2.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, consulta read-only ao Supabase, `lib/conversion-content/landing-page/`, `lib/conversion-content/landing-page/input-catalog/registry.ts`, PRs #559, #563, #564, #566, #567, #577 e #581, avaliações do Analista e decisões humanas de 14 a 17/07/2026.

Versão: v1 conceitualmente fechada.

Status: nove módulos e suas variantes `standard@v1` conceitualmente fechados; `faq.accordion@v1` aprovada como única variante adicional para validação controlada; nenhuma implementação de código autorizada neste PR.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

## 1. Estado e decisões fixas

### 1.1. Objetivo da E18.5

- Definir e implementar, no repositório, o catálogo versionado dos nove módulos `landing_page`, de suas variantes `standard@v1` e da variante controlada `faq.accordion@v1`.
- Entregar contratos pequenos, estritos, imutáveis e suficientes para consumo posterior pela E20 e pela E19.
- Preservar extensibilidade sem antecipar campos, capacidades ou variantes sem uso aprovado.
- Encerrar o fechamento conceitual após os nove módulos, suas variantes aprovadas e a validação integrada dos contratos.

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

- Os nove módulos serão implementados na E18.5 após autorização humana.
- `item_key` é evidência de pesquisa, não identidade canônica do módulo.
- Os módulos são transversais e não recebem identidade de taxon.
- Formatos curto, médio e longo pertencem à composição e à extensão da LP.
- Não há módulo conceitual pendente.

### 1.4. Escopo positivo

A E18.5 define e implementa:

- identidade e versão do catálogo;
- identidade, versão, função e invariantes dos módulos;
- identidade, versão, campos, cardinalidades e capacidades das variantes `standard@v1` e de `faq.accordion@v1`;
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
- variantes além de `standard@v1`, exceto `faq.accordion@v1`, explicitamente aprovada para validação controlada;
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

### 2.2. Extensibilidade das variantes

- Cada módulo começa com uma variante `standard@v1`; `faq.accordion@v1` é a única exceção adicional aprovada antes da primeira LP.
- Nova variante exige diferença estrutural ou comportamental reutilizável.
- Nova variante pode adicionar ou especializar campos, mídia, interação, responsividade e validações próprias.
- Nova variante deve constituir evolução aditiva e localizada; poderá exigir capabilities compartilhadas ou infraestrutura inerente à nova execução, tratadas nos respectivos recortes, sem alteração destrutiva do módulo, das variantes existentes ou das LPs anteriores.
- Restrições de `standard@v1` não restringem variantes futuras.
- Nova variante não exige nova `moduleVersion` quando preserva função, fronteiras, invariantes e integração comum.
- Nova `moduleVersion` é exigida quando mudam função, fronteiras, invariantes permanentes ou integração comum.
- Nova `variantVersion` é exigida quando muda o contrato de uma variante existente.
- Cada referência identifica `moduleKey`, `moduleVersion`, `variantKey` e `variantVersion`.

Não criam variante isoladamente:

- taxon, plano, campanha ou origem de tráfego;
- funil ou copy;
- troca de ativo;
- canal ou destino concreto;
- ordem na LP;
- quantidade já permitida;
- ajuste visual ou responsivo normal do renderer.

### 2.3. Herança, limites e resolução

- A raiz contém regras comuns; módulo e variante registram apenas deltas necessários.
- Módulo ou variante pode restringir a raiz, mas não ampliar limite absoluto vigente.
- Necessidade acima do limite da raiz exige evolução versionada da raiz.
- Capability da raiz só bloqueia a implementação quando for indispensável à variante aprovada.
- Variante declara compatibilidade explícita com a versão da raiz utilizada.
- Variante imutável não muda pela disponibilidade posterior de nova capability.
- Não existe fallback silencioso.
- Contrato ausente, incompatível ou inválido falha fechado.
- Resultado resolvido deve ser completo, profundamente imutável e sem referência mutável compartilhada.

### 2.4. Contrato mínimo de campo

Cada campo usado por uma variante declara:

- `fieldKey` e `fieldKind`;
- cardinalidade;
- `semanticRole`, quando textual;
- policy de origem do valor;
- suporte operacional, quando aplicável;
- capability específica, quando aplicável.

Regras:

- cardinalidade representa obrigatoriedade;
- texto visível usa papel semântico existente na raiz;
- coleção possui contrato fechado do item e não admite coleção aninhada na v1;
- ação não armazena canal, URL, telefone, e-mail ou destino concreto;
- mídia referencia ativo futuro e declara apenas requisitos necessários à variante;
- tipos, policies e capabilities só entram quando consumidos por variante aprovada.

### 2.5. Copy e sustentação factual

- `copySourceMap` define até duas fontes primárias e uma auxiliar por campo textual, salvo decisão humana registrada.
- `funnelCopyProfile` adapta seleção e redação para BOFU, MOFU e TOFU.
- O funil não redefine sozinho a estrutura ou a ordem da LP.
- Pesquisa orienta copy, mas não comprova fatos sobre a operação.
- Credencial, capacidade, condição, preço, prazo, parceria, resultado, garantia ou ação concreta exige suporte operacional real.
- A E19 resolve valores e valida a instância concreta conforme a composição recebida.
- Nenhum módulo pode inventar prova, certificação, garantia ou resultado.

Policies aprovadas:

- `research_guided`;
- `hybrid`;
- `operational_required`;
- `technical_reference`;
- `not_copy`.

`operational_required` exige valor originado de evidência operacional real e impede geração a partir da pesquisa.

### 2.6. Ações e vínculos operacionais

- Ação possui label textual e vínculo abstrato com campo estável do catálogo operacional.
- O registry não armazena valor, canal ou destino concreto.
- O vínculo declara se o campo operacional é obrigatório quando a ação estiver presente.
- A E19 resolve o campo operacional, seus condicionais e o destino.
- Nova chave operacional não pode ser criada implicitamente pela E18.5.

### 2.7. Lifecycle e compatibilidade

- `moduleCatalogVersion` declara versão e compatibilidade com a raiz; não possui lifecycle próprio.
- Módulo e variante usam lifecycle `experimental`, `active` ou `deprecated`.
- Todos começam `experimental`, com propósito `controlled_test`.
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
- trata ausência ou invalidade conforme a obrigatoriedade definida pela E20;
- gera e administra a LP real;
- preserva versões e payload resolvido de forma genérica.

Renderer:

- executa o contrato resolvido;
- não escolhe variante, conteúdo ou fallback.

### 2.9. Checklist de fechamento

Obrigatório:

- identidade, função, evidência, fronteiras e invariantes;
- variante `standard@v1`;
- campos, cardinalidades, fontes de copy e suporte factual;
- lifecycle, compatibilidade e validações estruturais.

Condicional, quando usado por variante aprovada:

- ação, mídia ou interação;
- responsividade ou acessibilidade específica;
- fallback técnico ou referência técnica.

### 2.10. Significado de implementação

Um módulo está implementado na E18.5 quando existem:

- identidade versionada do módulo e de suas variantes aprovadas;
- tipos, schemas, campos, cardinalidades e capabilities;
- registry, resolver e validadores;
- fixtures quando úteis;
- casos executáveis e testes de contrato;
- lifecycle, compatibilidade e exportação pelo boundary `lib/conversion-content/landing-page/`.

Isso não inclui seção visual funcional.

## 3. Contratos conceitualmente fechados

### 3.1. Módulo `hero`

- Identidade: `hero@v1`.
- Função: apresentar proposta principal, estabelecer o recorte da LP e conduzir à rota prioritária de conversão ou continuidade.
- Invariantes: proposta principal identificável, hierarquia semântica coerente e integração abstrata com ação quando utilizada.
- Fronteiras: sem formulário completo, galeria, carrossel, tour, navegação global, oferta detalhada ou prova extensa.
- Evidência: `hero_segmentado` de `lp_sections` e Blueprint do corretor.

### 3.2. Variante `hero.standard@v1`

- Campos:
  - `eyebrow`: `eyebrow`, `0..1`, `research_guided`;
  - `title`: `h1`, `1..1`, `hybrid`, suporte `when_factual`;
  - `subtitle`: `paragraph`, `1..1`, `hybrid`, suporte `when_factual`;
  - `primaryCta`: ação `1..1`, `not_copy`, label `cta_label`, `hybrid`, suporte `when_present`, vínculo obrigatório com `primary_conversion_channel`;
  - `proofShort`: `paragraph`, `0..1`, `hybrid`, suporte `when_present`;
  - `media`: imagem `0..1`, `technical_reference`, modo `informative` ou `decorative`.
- Copy:
  - `eyebrow`: `positioning_opportunity`; auxiliar `search_intent`;
  - `title`: `positioning_opportunity` e `desire`; auxiliar `commercial_keywords`;
  - `subtitle`: `pain` e `desire`; auxiliar `belief`;
  - CTA: `trigger`; auxiliar `search_intent`;
  - `proofShort`: `proof_type`; auxiliar `objection`.
- Regras:
  - canais permitidos: `whatsapp`, `phone`, `email` e `external_url`;
  - imagem informativa exige alternativa acessível;
  - visibilidade da mídia `all_viewports`;
  - `subtitle` usa `body.base`;
  - `desktop_only` e `body.editorialEmphasis` exigem evolução versionada;
  - sem CTA secundário, vídeo, formulário, interação, galeria, carrossel ou tour.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada.

### 3.3. Módulo `trust_bar`

- Identidade: `trust_bar@v1`.
- Função: apresentar sinais curtos e verificáveis de confiança.
- Invariantes: brevidade, relevância e sustentação factual real.
- Fronteiras: sem depoimento, explicação extensa, prova técnica detalhada, CTA, formulário ou mídia.
- Evidência: `barra_de_confianca` de `lp_sections`.

### 3.4. Variante `trust_bar.standard@v1`

- Campo `items`: coleção `2..4`, `not_copy`, item `text` com papel `benefit_item`, `hybrid`, suporte `when_present`.
- Copy: `proof_type` e `belief`; auxiliar `objection`.
- Regras:
  - cada item exige suporte operacional real;
  - sem título, subtítulo, CTA, ícone ou mídia;
  - disposição responsiva pertence ao renderer;
  - ausência depende da obrigatoriedade definida pela E20.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada.

### 3.5. Módulo `problem_solution`

- Identidade: `problem_solution@v1`.
- Função: relacionar problemas, fricções ou riscos reconhecíveis a respostas práticas.
- Invariantes: correspondência direta, distinção clara, sem alarmismo ou promessa não sustentada.
- Fronteiras: sem oferta detalhada, processo, prova, FAQ, CTA, mídia ou interação.
- Evidência: `dores_e_solucoes`, `pain`, `fear`, `objection`, `desire`, `belief` e `positioning_opportunity`.

### 3.6. Variante `problem_solution.standard@v1`

- Campos:
  - `title`: `h2`, `1..1`, `research_guided`;
  - `items`: coleção `2..4`, `not_copy`, com `problem` (`card_title`, `research_guided`) e `solution` (`card_body`, `hybrid`, suporte `when_present`).
- Copy:
  - `title`: `pain` e `desire`; auxiliar `positioning_opportunity`;
  - `problem`: `pain` e `fear`; auxiliar `objection`;
  - `solution`: `positioning_opportunity` e `desire`; auxiliar `belief`.
- Regras:
  - cada solução responde ao problema do mesmo item e exige suporte operacional;
  - sem subtítulo, CTA, mídia, prova, preço, oferta detalhada ou processo;
  - resolução fail-closed e imutável.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada.

### 3.7. Módulo `offer`

- Identidade: `offer@v1`.
- Função: apresentar ofertas, escopos ou casos de uso efetivamente disponíveis.
- Invariantes: item real e identificável, coerência entre título e descrição e sustentação operacional.
- Fronteiras: sem problema-solução, processo, prova, FAQ, preço, condição comercial, CTA, mídia ou interação.
- Evidência: `servicos_por_intencao`, `trigger`, `desire`, `positioning_opportunity`, `belief`, `objection`, Blueprint e catálogo de entradas.

### 3.8. Variante `offer.standard@v1`

- Campos:
  - `title`: `h2`, `1..1`, `research_guided`;
  - `items`: coleção `1..4`, `not_copy`, com `itemTitle` (`card_title`, `hybrid`) e `description` (`card_body`, `hybrid`), ambos com suporte `when_present`.
- Copy:
  - `title`: `desire` e `trigger`; auxiliar `positioning_opportunity`;
  - `itemTitle`: `trigger` e `desire`;
  - `description`: `positioning_opportunity` e `belief`; auxiliar `objection`.
- Regras:
  - cada item exige capacidade operacional real;
  - pesquisa não comprova preço, prazo, condição, parceria, garantia ou disponibilidade;
  - sem CTA, mídia, prova, preço, condição comercial, processo ou referência técnica.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada.

### 3.9. Módulo `process`

- Identidade: `process@v1`.
- Função: explicar progressão real do atendimento ou entrega por etapas compreensíveis.
- Invariantes: sequência ordenada, etapas distintas e ausência de prazo, garantia ou resultado inventado.
- Fronteiras: sem oferta, problema-solução, workflow interno, prova, FAQ, CTA, preço, mídia ou interação.
- Evidência: `processo_de_atendimento`, `belief`, `desire`, `positioning_opportunity`, `trigger`, `objection`, Blueprint e catálogo de entradas.

### 3.10. Variante `process.standard@v1`

- Campos:
  - `title`: `h2`, `1..1`, `research_guided`;
  - `steps`: coleção ordenada `2..6`, `not_copy`, com `stepTitle` (`step_title`, `hybrid`) e `stepBody` (`step_body`, `hybrid`), ambos com suporte `when_present`.
- Copy:
  - `title`: `belief` e `desire`; auxiliar `positioning_opportunity`;
  - `stepTitle`: `trigger` e `positioning_opportunity`; auxiliar `desire`;
  - `stepBody`: `belief` e `desire`; auxiliar `objection`.
- Regras:
  - ordem reflete a progressão real;
  - numeração visual pertence ao renderer;
  - sem CTA, mídia, prova, preço, condição, formulário ou referência técnica.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada.

### 3.11. Módulo `technical_assurance`

- Identidade: `technical_assurance@v1`.
- Função: explicar salvaguardas, critérios, documentos, credenciais ou verificações relevantes.
- Invariantes: item real, verificável, operacionalmente sustentado e sem implicar aprovação, risco zero, certificação ou resultado.
- Fronteiras: sem trust bar curta, depoimento, processo, oferta, FAQ, aconselhamento individualizado, CTA, mídia, download ou link.
- Evidência: `prova_tecnica_documental`, `proof_type`, `belief`, `fear`, `objection`, `positioning_opportunity`, narrativa e Blueprint.

### 3.12. Variante `technical_assurance.standard@v1`

- Campos:
  - `title`: `h2`, `1..1`, `research_guided`;
  - `items`: coleção `1..4`, `not_copy`, com `assuranceTitle` (`card_title`, `hybrid`) e `assuranceBody` (`card_body`, `hybrid`), ambos com suporte `when_present`.
- Copy:
  - `title`: `proof_type` e `belief`; auxiliar `objection`;
  - `assuranceTitle`: `proof_type`; auxiliar `belief`;
  - `assuranceBody`: `proof_type` e `positioning_opportunity`; auxiliar `objection`.
- Regras:
  - todo item exige suporte real e rastreável;
  - sem conclusão jurídica, técnica ou financeira individualizada;
  - sem CTA, mídia, link, download, depoimento, caso, métrica, preço, processo ou FAQ.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada.

### 3.13. Módulo `social_proof`

- Identidade: `social_proof@v1`.
- Função: apresentar experiências reais de terceiros que reduzam incerteza.
- Invariantes: prova real, rastreável, autorizada, sem fabricação, alteração material ou generalização indevida.
- Fronteiras: sem trust bar, prova técnica, oferta, processo, FAQ, CTA, rating agregado, métrica, logo, caso detalhado ou mídia.
- Evidência: `prova_social`, `proof_type`, `belief`, `objection`, narrativa e Blueprint.

### 3.14. Variante `social_proof.standard@v1`

- Campos:
  - `title`: `h2`, `1..1`, `research_guided`;
  - `items`: coleção `1..3`, `not_copy`, com `quote` (`card_body`, `operational_required`), `attribution` (`card_title`, `operational_required`) e `evidenceRef` (`technical_reference`).
- Copy:
  - `title`: `proof_type` e `belief`; auxiliar `objection`;
  - `quote` e `attribution`: exclusivamente da evidência operacional referenciada.
- Regras:
  - impedir geração ou alteração material do depoimento;
  - atribuição pública depende de autorização e não elimina rastreabilidade interna;
  - sem CTA, mídia, rating, métrica, logo ou caso detalhado.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada.

### 3.15. Módulo `faq`

- Identidade: `faq@v1`.
- Função: responder dúvidas e objeções recorrentes em pares claros de pergunta e resposta.
- Invariantes: pergunta relevante, resposta direta, sustentação factual e ausência de aconselhamento individualizado ou promessa enganosa.
- Fronteiras: sem oferta, processo, prova técnica, CTA, mídia, formulário ou ação; interação pertence à variante que a declarar.
- Evidência: `faq_objeções`, `faq_questions`, `search_intent`, `objection`, `fear`, `belief`, `awareness_level` e Blueprint.

### 3.16. Variante `faq.standard@v1`

- Campos:
  - `title`: `h2`, `1..1`, `research_guided`;
  - `items`: coleção `2..6`, `not_copy`, com `question` (`faq_question`, `research_guided`) e `answer` (`faq_answer`, `hybrid`, suporte `when_factual`).
- Copy:
  - `title`: `objection` e `awareness_level`; auxiliar `search_intent`;
  - `question`: `objection` e `fear`; auxiliar `faq_questions`;
  - `answer`: `belief` e `positioning_opportunity`; auxiliar `desire`.
- Regras:
  - rejeitar perguntas vazias ou duplicadas;
  - resposta trata diretamente sua pergunta;
  - fatos operacionais, legais, técnicos ou financeiros exigem suporte real;
  - sem CTA, mídia, formulário, ação ou interação.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada.

### 3.17. Variante `faq.accordion@v1`

- Identidade: `faq.accordion@v1`, compatível com `faq@v1` e com a raiz vigente.
- Finalidade: validar duas variantes do mesmo módulo e oferecer apresentação compacta, especialmente no mobile.
- Conteúdo:
  - reutiliza integralmente `title`, `items`, `question` e `answer` de `faq.standard@v1`;
  - mantém cardinalidades, semantic roles, policies, copy e sustentação factual;
  - não adiciona campo de conteúdo.
- Capability: interação de acordeão e requisitos de acessibilidade associados.
- Comportamento:
  - todos os itens iniciam fechados;
  - pergunta abre e fecha sua resposta;
  - somente um item permanece aberto;
  - abrir outro fecha o anterior;
  - operação por teclado;
  - estado expandido exposto semanticamente;
  - associação acessível entre pergunta e resposta;
  - foco preservado no controle acionado.
- Limites:
  - não define elemento HTML, componente, ícone, animação ou visual do renderer;
  - não altera conteúdo, cardinalidade, copy ou sustentação factual herdados.
- Estado: `experimental`, `controlled_test`, candidata à primeira composição controlada.

### 3.18. Módulo `final_cta`

- Identidade: `final_cta@v1`.
- Função: encerrar a jornada com próximo passo claro, qualificado e coerente com a intenção da LP.
- Invariantes: uma ação principal identificável, linguagem não coercitiva, vínculo abstrato com canal operacional e sustentação de toda condição factual apresentada.
- Fronteiras: não repete oferta, processo, FAQ ou prova; não contém formulário, mídia, ação secundária, canal ou destino concreto na execução inicial.
- Evidência: `cta_final_qualificado`, `narrative_arc`, `mobile_priority`, `trigger`, `desire`, `objection`, `belief`, `positioning_opportunity`, `search_intent` e catálogo operacional.

### 3.19. Variante `final_cta.standard@v1`

- Identidade: `final_cta.standard@v1`, compatível com `final_cta@v1` e com a raiz vigente; única variante inicial.
- Campos:
  - `title`: texto, papel `h2`, `1..1`, policy `hybrid`, suporte `when_factual`;
  - `body`: texto, papel `paragraph`, `1..1`, policy `hybrid`, suporte `when_factual`;
  - `primaryCta`: ação `1..1`, policy `not_copy`, com label `cta_label`, `1..1`, `hybrid`, suporte `when_present`, e vínculo obrigatório com `primary_conversion_channel`.
- Copy:
  - `title`: primárias `trigger` e `desire`; auxiliar `positioning_opportunity`;
  - `body`: primárias `desire` e `objection`; auxiliar `belief`;
  - `primaryCta.label`: primária `trigger`; auxiliar `search_intent`.
- Regras:
  - uma única ação principal;
  - canais permitidos: `whatsapp`, `phone`, `email` e `external_url`;
  - canal e destino concretos ficam fora do registry;
  - a copy pode orientar o visitante a informar intenção, localização, prazo ou faixa aplicável, sem armazenar esses valores no contrato;
  - pesquisa orienta a redação, mas não comprova disponibilidade, prazo, resposta imediata, condição, garantia ou resultado;
  - BOFU prioriza ação direta; MOFU, contato orientado; TOFU, próximo passo de baixa fricção;
  - rejeitar CTA secundário, formulário, mídia, prova, preço, condição comercial ou referência técnica;
  - validar vínculo operacional obrigatório e resolver de forma fail-closed e imutável.
- Estado: `experimental`, `controlled_test`, conceitualmente fechada; implementação ainda não autorizada.

## 4. Fechamento conceitual do catálogo

### 4.1. Estado

- Os nove módulos estão conceitualmente fechados.
- As nove variantes `standard@v1` estão conceitualmente fechadas.
- `faq.accordion@v1` está conceitualmente fechada como exceção controlada.
- Não há módulo ou variante aprovada pendente de parametrização.

### 4.2. Sequência de implementação

Após autorização humana:

1. implementar o contrato compartilhado;
2. implementar os nove módulos e suas variantes `standard@v1`;
3. implementar `faq.accordion@v1` como segundo caso do mesmo módulo;
4. validar contratos, registries, resolução, lifecycle, compatibilidade e imutabilidade;
5. atualizar a documentação final e encerrar a E18.5 técnica.

### 4.3. Próxima ação

- Submeter o plano completo à avaliação final.
- Após aprovação humana, autorizar a implementação repo-only da E18.5.
- Não implementar E20, E19, renderer, Admin, Builder, banco ou LP real neste recorte.

## 5. Validação e encerramento

### 5.1. Validações da implementação

Quando autorizada:

- validar schemas, registries, identidade e compatibilidade;
- rejeitar campos, policies, capabilities e deltas desconhecidos;
- garantir resolução fail-closed e resultado imutável;
- validar combinações efetivamente utilizadas;
- executar casos próprios e integração dos nove módulos, das nove variantes `standard@v1` e de `faq.accordion@v1`;
- executar `npm ci`, validações aplicáveis, `npm run check` e `git diff --check`.

Alteração exclusivamente documental:

- `npm ci`: não aplicável;
- `npm run check`: não aplicável;
- `git diff --check`: obrigatório antes da entrega quando houver ambiente local disponível.

### 5.2. Regra de parada

Após os nove módulos, suas variantes `standard@v1` e `faq.accordion@v1`:

- encerrar a E18.5;
- não criar outra variante antes da primeira LP;
- não adicionar campo para cenário futuro;
- não criar policy ou capability sem consumidor;
- não antecipar matriz especulativa;
- não absorver renderer, composição ou geração;
- avançar para E20 e depois E19.

### 5.3. Estado de validação

- Implementação técnica significa contrato executável no repositório.
- Os módulos permanecem hipóteses de produto.
- Validação comercial ocorrerá quando a E20 compuser e a E19 gerar a primeira LP real.
- Promoção de lifecycle exige evidência dessa utilização e decisão humana.

### 5.4. Critérios de parada imediata

Parar e informar a divergência se:

- surgir banco, rota, job, agente, automação ou infraestrutura nova sem fonte e recorte próprios;
- módulo receber identidade de taxon;
- variante representar somente copy, campanha, plano ou ativo;
- regra de `standard@v1` for tratada como limite permanente do módulo;
- variante não aprovada for antecipada;
- destino concreto entrar no registry;
- conteúdo factual puder ser inventado;
- E19, E20 ou renderer forem implementados implicitamente;
- alteração sair do arquivo e da branch autorizados;
- houver tentativa de merge na `main`.

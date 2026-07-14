14/07/2026 — Plano-base E18.5 — Parametrização de módulos e variantes `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e18-4.md`, `docs/template-blueprint.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/prompt-nicho-itens-estruturados.md`, `lib/conversion-content/landing-page/`, `lib/conversion-content/commercial-activation/`, `lib/conversion-content/commercial-activation/composition.ts`, PRs #559, #563, #564, #566 e #567 e estado atual do repositório.

Versão: v1.

Status: plano-base inicial para avaliação única do Analista, Gestor Estrutural e Gestor de Updates; nenhuma implementação autorizada antes da consolidação v2 e do merge deste plano na `main`.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

## 1. Estado e decisões fixas

### 1.1. Pré-requisitos confirmados

- O PR #559 foi mergeado na `main` em 13/07/2026 e criou conceitualmente o recorte `18.5`.
- A E18.4 foi concluída, aprovada, documentada e formalmente encerrada.
- A parametrização raiz v1 está implementada em `lib/conversion-content/landing-page/`.
- O contrato raiz possui:
  - registry versionado;
  - schema estrito;
  - resolver fail-closed;
  - saída profundamente imutável;
  - papéis semânticos;
  - faixas editoriais recomendadas;
  - limites técnicos absolutos;
  - opções comuns de espaçamento;
  - critérios visuais, responsivos e de acessibilidade;
  - presets `balanced` e `compact`.
- A precedência obrigatória está consolidada como:
  - parametrização raiz;
  - módulo;
  - variante.
- A E18.5 não pode ampliar limite técnico absoluto acima da raiz vigente.
- Ampliação acima do teto da raiz exige nova `rootVersion`.
- A revisão futura de uma restrição própria de módulo ou variante dentro do teto da raiz exige nova versão do respectivo contrato da E18.5.
- `commercial_activation`, E18.2 e E18.3 permanecem integralmente preservados.

### 1.2. Estado técnico confirmado

- O boundary raiz atual é `lib/conversion-content/landing-page/`.
- O namespace público atual da parametrização raiz é `landingPageRoot`.
- Não existem atualmente módulos, variantes, schemas de conteúdo por variante, composição, renderer ou render model para `landing_page`.
- O banco possui estruturas transversais já existentes:
  - `content_templates`;
  - `content_template_compositions`;
  - `content_template_composition_items`;
  - `content_artifacts`;
  - `content_artifact_research_sources`.
- `content_template_composition_items` já representa, no nível de composição:
  - módulo;
  - `variant_key`;
  - ordem;
  - obrigatoriedade;
  - `config_json`.
- Essas estruturas não autorizam criar registros de `landing_page` nesta fase.
- A E18.5 define contratos repo-only reutilizáveis.
- A criação de composição concreta e registros por taxon pertence à E20.
- A geração, o snapshot e o consumo de LPs por conta pertencem à E19.
- A persistência mínima atual de `account_landing_pages` contém apenas identidade básica e status `draft`; não deve ser ampliada neste recorte.

### 1.3. Problema a resolver

- A raiz define regras comuns, mas ainda não existe contrato aprovado para:
  - funções estruturais dos módulos;
  - campos de cada módulo;
  - estruturas e cardinalidades;
  - variantes reutilizáveis;
  - especializações excepcionais sobre a raiz;
  - origem estruturada da copy;
  - transformação da copy por BOFU, MOFU e TOFU;
  - tratamentos comerciais permitidos, restritos e proibidos;
  - compatibilidade entre versões;
  - ciclo de vida, depreciação e preservação histórica.
- Sem esse contrato, E20 não pode montar composição base segura.
- Sem esse contrato, E19 não pode gerar, validar ou renderizar LPs sem recriar regras independentes.
- Reaproveitar diretamente os contratos de `commercial_activation` criaria acoplamento incorreto entre famílias distintas.
- Recriar o catálogo removido da antiga E18.4 sem nova decisão repetiria a antecipação que a E18.4 corrigiu.

### 1.4. Resultado esperado

- Criar uma fonte repo-only versionada para módulos e variantes de `landing_page`.
- Definir um catálogo inicial pequeno, suficiente para uma primeira LP real de teste.
- Definir a função estrutural de cada módulo.
- Definir campos, tipos estruturais e cardinalidades por variante.
- Derivar regras editoriais e técnicas da parametrização raiz.
- Registrar somente especializações justificadas.
- Definir `copy_source_map` com `research_block`, `item_key`, `audience_scope` e papel da fonte.
- Definir `funnel_copy_profile` para BOFU, MOFU e TOFU.
- Impedir copy comercial não sustentada por fonte real.
- Definir resolução determinística e fail-closed de raiz, catálogo, módulo, variante e propósito de uso.
- Preservar contratos antigos para renderização histórica.
- Entregar validação executável sem criar renderer, composição, geração ou persistência.

### 1.5. Usuários e consumidores

- Usuários diretos:
  - Estrategista;
  - Analista;
  - Executor;
  - futuros implementadores da E20 e E19.
- Consumidores técnicos futuros:
  - composição base da E20;
  - schemas de conteúdo da E19;
  - geração de copy da E19;
  - validação de conteúdo;
  - renderer;
  - snapshot da LP;
  - auditoria de compatibilidade.
- O cliente final não interage diretamente com este recorte.

### 1.6. Decisões de fronteira

- Módulo representa uma função estrutural reutilizável da LP.
- Variante representa mudança reutilizável de execução, estrutura ou comportamento dentro da mesma função do módulo.
- Nova função estrutural deve ser avaliada como novo módulo.
- Não usar módulo ou variante para representar:
  - taxon;
  - segmento, nicho ou ultranicho;
  - conteúdo específico;
  - entrada da conta;
  - campanha;
  - origem de tráfego;
  - intenção BOFU, MOFU ou TOFU;
  - composição;
  - ordem da seção;
  - obrigatoriedade da seção;
  - diferença já atendida por campo, cardinalidade, opção ou parâmetro existente.
- BOFU, MOFU e TOFU são perfis de transformação da copy, não variantes.
- Google Ads, Meta Ads, SEO, WhatsApp, link na bio e QR Code são origens de tráfego ou distribuição, não variantes.
- Os dados reais de preço, oferta, prova, credencial, garantia, contato, mídia e compliance não pertencem ao registry; pertencem às entradas operacionais e ao snapshot futuro.
- `copy_source_map` autoriza fontes estruturadas, mas não cria fatos.
- `funnel_copy_profile` transforma insumos, mas não substitui fonte obrigatória.
- `lp_sections` orienta composição na E20; suas chaves dinâmicas não entram como fonte fixa de copy por campo na E18.5.
- `lp_overview` orienta contexto geral da página e da transformação; não deve ser usado para inventar alegações factuais.
- O registry da E18.5 não consulta banco, env, API ou arquivo remoto em runtime.

### 1.7. Base de evidência

- Fonte conceitual principal:
  - `docs/lp-planejamento.md`.
- Fonte normativa da raiz:
  - `docs/lousa-plano-base-e18-4.md`;
  - implementação atual de `landingPageRoot`.
- Fonte dos `research_block` e `item_key`:
  - `docs/prompt-nicho-itens-estruturados.md`.
- Fonte empírica parcial inicial:
  - `docs/blueprint-corretor-imoveis-end-customer.md`.
- Referência estrutural já implementada, sem reaproveitamento automático:
  - `commercial_activation`.
- O blueprint imobiliário sustenta como referência inicial:
  - Hero com recorte claro;
  - mídia principal;
  - benefícios ou diferenciais objetivos;
  - localização;
  - qualificação simples ou progressiva;
  - prova;
  - FAQ;
  - CTA;
  - confiança e compliance.
- A evidência é parcial e concentrada em um nicho.
- Por isso:
  - nenhum módulo é específico de imóveis;
  - nenhum campo recebe semântica imobiliária;
  - nenhuma variante é nomeada por nicho, produto, campanha ou canal;
  - os contratos iniciais permanecem em lifecycle experimental ou candidato até LP real validada.

### 1.8. Roadmap e gate documental

- Seção afetada:
  - E18 — Base transversal de templates, módulos, composições e artefatos.
- Recorte:
  - `18.5 — Parametrização de módulos e variantes landing_page`.
- Subseções previstas:
  - `18.5.1 — Objetivo e status`;
  - `18.5.2 — Registros do recorte`, após implementação material;
  - `18.5.3 — Módulos e funções estruturais`;
  - `18.5.4 — Campos, estruturas e cardinalidades`;
  - `18.5.5 — Variantes e critérios de criação`;
  - `18.5.6 — Especializações sobre a parametrização raiz`;
  - `18.5.7 — Mapa de fontes de copy`;
  - `18.5.8 — Perfis de copy por intenção e funil`;
  - `18.5.9 — Ciclo de vida, compatibilidade e validação`;
  - `18.5.10 — Limites do recorte`.
- Não criar `18.6`.
- A documentação durável só será atualizada pelo Gestor de Docs ao final do plano.
- O encerramento formal da E18.5 exigirá implementação material aprovada, merge do PR material, relatório final do Estrategista e merge do PR documental obrigatório.

## 2. Contrato do caso

### 2.1. Boundary e artefatos previstos

- Boundary canônico:
  - `lib/conversion-content/landing-page/module-catalog/`.
- Arquivos previstos:
  - `contracts.ts`;
  - `registry.ts`;
  - `schema.ts`;
  - `resolver.ts`;
  - `validation-cases.ts`;
  - `index.ts`.
- Arquivos a ajustar:
  - `lib/conversion-content/index.ts`;
  - `package.json`;
  - `docs/lousa-plano-base-e18-5.md`, somente para estado da fase.
- Interface pública agregada prevista:
  - namespace `landingPageModules`.
- Preservar:
  - namespace `landingPageRoot`;
  - arquivos e comportamento da parametrização raiz.
- Script previsto:
  - `validate:landing-page-modules`.
- Não adicionar dependência npm.
- Não alterar `package-lock.json` quando não houver mudança real de dependência.

### 2.2. Versionamento e identidade

- Identidade inicial:
  - `family = landing_page`;
  - `rootVersion = 1`;
  - `moduleCatalogVersion = 1`.
- O registry deve ser mapa explícito:
  - `moduleCatalogVersion → catálogo imutável`.
- O catálogo contém módulos identificados por:
  - `moduleKey`;
  - `moduleVersion`.
- Cada variante é identificada por:
  - `variantKey`, no formato `modulo.variante`;
  - `variantVersion`;
  - `moduleKey` correspondente.
- Regras:
  - uma alteração contratual incompatível cria nova `moduleCatalogVersion`;
  - alteração do contrato de módulo incrementa `moduleVersion`;
  - alteração do contrato de variante incrementa `variantVersion`;
  - versões antigas não podem ser apagadas ou alteradas;
  - o catálogo novo pode manter chaves antigas, adicionar chaves ou depreciá-las;
  - não existe catálogo padrão implícito;
  - `rootVersion` e `moduleCatalogVersion` são obrigatórios na resolução;
  - `variantKey` deve começar com o `moduleKey` seguido de ponto;
  - chave do registry e versão interna devem corresponder;
  - o catálogo deve declarar compatibilidade explícita com a `rootVersion`;
  - não existe fallback silencioso entre versões.

### 2.3. Lifecycle

- Lifecycle permitido para módulos e variantes:
  - `candidate`;
  - `experimental`;
  - `validated`;
  - `deprecated`.
- Significado:
  - `candidate`: contrato em avaliação; não pode entrar em composição ou geração;
  - `experimental`: pode ser usado apenas em fluxo controlado de teste;
  - `validated`: aprovado por LP real e decisão humana registrada; pode ser usado em novas composições e gerações quando os demais gates permitirem;
  - `deprecated`: não pode entrar em nova composição ou geração; permanece resolvível para histórico.
- Transições normais:
  - `candidate → experimental`;
  - `experimental → validated`;
  - `candidate | experimental | validated → deprecated`.
- Não alterar lifecycle dentro de versão já publicada sem decisão humana registrada.
- Quando a decisão alterar a elegibilidade operacional do catálogo publicado, criar nova `moduleCatalogVersion`.
- O catálogo v1 nasce como hipótese:
  - variantes sustentadas pelo blueprint entram como `experimental`;
  - variantes sem evidência direta suficiente entram como `candidate`;
  - nenhuma variante nasce `validated`.

### 2.4. Tipos estruturais comuns

- `CopyFieldContract`:
  - `fieldKey`;
  - `semanticRole`;
  - `required`;
  - `recommendedRangeOverride`, quando houver;
  - `absoluteMaxOverride`, quando houver;
  - `copySourceMap`;
  - `operationalValueRequired`, quando o valor não puder vir da pesquisa.
- `CtaContract`:
  - `label`, usando papel `cta_label`;
  - `actionRole`;
  - sem URL ou destino concreto.
- `actionRole` permitido:
  - `primary_conversion`;
  - `secondary_conversion`;
  - `contact`;
  - `resource`;
  - `internal_navigation`.
- `MediaReferenceContract`:
  - referência abstrata de ativo;
  - `altText`;
  - `caption` opcional;
  - sem URL, upload, storage ou embed concreto.
- `CollectionContract`:
  - `minItems`;
  - `maxItems`;
  - contrato do item.
- `LeadFieldSlotContract`:
  - `slotKey`;
  - `inputKind`;
  - `label`;
  - `required`.
- `inputKind` permitido:
  - `short_text`;
  - `email`;
  - `phone`;
  - `single_select`;
  - `multi_select`;
  - `boolean`.
- O contrato não define nome de coluna, tabela, formulário executável, destino de submissão, integração, automação, CRM ou webhook.
- Campos factuais que exigem valor operacional devem ser marcados com `operationalValueRequired = true`.
- Pesquisa estruturada pode orientar rótulo e enquadramento, mas não fornecer preço real, número, métrica, depoimento, credencial, garantia, disponibilidade, contato, endereço, URL ou dado legal.

### 2.5. Catálogo inicial de módulos

#### 2.5.1. `hero`

- Função:
  - apresentar recorte, proposta de valor e próxima ação principal.
- Deve:
  - realizar message match;
  - conter um único campo mapeado para `h1`;
  - evitar promessa sem fonte.
- Não deve representar campanha, taxon ou composição.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.2. `media`

- Função:
  - apresentar evidência visual ou demonstração do produto, serviço, contexto ou resultado.
- Deve exigir alt text e limitar cardinalidade.
- Não deve armazenar URL real no registry, autorizar embed ou definir storage.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.3. `benefits`

- Função:
  - sintetizar benefícios, diferenciais ou resultados esperados de forma comparável.
- Deve diferenciar benefício de prova factual e impedir transformação de benefício em resultado garantido.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.4. `offer`

- Função:
  - explicar o que é oferecido, para quem serve e qual próximo passo.
- Deve separar copy parametrizada de preço e condições operacionais.
- Não deve criar oferta, preço, desconto, garantia ou escassez.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.5. `proof`

- Função:
  - apresentar evidência, autoridade, credencial, depoimento ou métrica verificável.
- Deve marcar valores factuais como operacionais e exigir sustentação real.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.6. `location`

- Função:
  - explicar relevância geográfica, territorial ou contextual quando isso afetar a decisão.
- É reutilizável para negócios locais, serviços regionais, imóveis, eventos e ofertas com contexto territorial.
- Não representa taxon.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.7. `qualification`

- Função:
  - captar contato ou qualificar o lead com fricção controlada.
- Define estrutura e cardinalidade de slots.
- Não define persistência, destino, catálogo de dados da conta, regras comerciais ou CRM.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.8. `how_it_works`

- Função:
  - explicar processo, etapas, jornada ou funcionamento.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.9. `faq`

- Função:
  - responder dúvidas e objeções recorrentes.
- Não deve criar FAQ genérica sem fonte ou repetir conteúdo sem função.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.10. `final_cta`

- Função:
  - encerrar a narrativa e apresentar ação de conversão coerente.
- Não define destino real do CTA.
- Lifecycle inicial:
  - `experimental`.

#### 2.5.11. `trust`

- Função:
  - apresentar privacidade, identificação, compliance e sinais institucionais.
- Deve exigir valores reais quando citar identificação, registro ou política.
- Não substitui revisão jurídica ou regulatória.
- Lifecycle inicial:
  - `experimental`.

### 2.6. Variantes iniciais, campos e cardinalidades

#### 2.6.1. `hero.standard`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1, papel `eyebrow`;
  - `title`: exatamente 1, papel `h1`;
  - `subtitle`: exatamente 1, papel `paragraph`;
  - `primaryCta`: exatamente 1;
  - `secondaryCta`: 0–1;
  - `proofShort`: 0–1, papel `paragraph`;
  - `media`: 0–1 referência.
- Uso:
  - abertura textual com mídia opcional.
- Não representa produto único, portfólio, canal ou funil.

#### 2.6.2. `hero.media_split`

- Lifecycle: `experimental`.
- Estrutura:
  - mesmos campos de `hero.standard`;
  - `media`: exatamente 1.
- Diferença estrutural:
  - mídia é parte obrigatória da execução do Hero.
- Não deve ser criada apenas porque o conteúdo possui imagem.

#### 2.6.3. `media.gallery`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: 0–1, papel `h2`;
  - `items`: 1–12 referências de mídia;
  - cada item exige `altText`;
  - cada item admite `caption` 0–1.
- Não autoriza carrossel automático ou autoplay.

#### 2.6.4. `media.external_tour`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: 0–1;
  - `previewMedia`: exatamente 1;
  - `tourCta`: exatamente 1, `actionRole = resource`.
- O destino externo é valor operacional.
- O contrato não autoriza embed.

#### 2.6.5. `benefits.cards`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1, papel `h2`;
  - `items`: 2–6;
  - item:
    - `title`: exatamente 1, papel `card_title`;
    - `body`: exatamente 1, papel `card_body`;
    - `iconRef`: 0–1 referência abstrata.
- Não usar ícone concreto, classe ou token no registry.

#### 2.6.6. `benefits.list`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1;
  - `items`: 3–8;
  - item `text`: exatamente 1, papel `benefit_item`.
- A diferença para cards é estrutural, não apenas visual.

#### 2.6.7. `offer.summary`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1, papel `h2`;
  - `description`: exatamente 1, papel `paragraph`;
  - `highlights`: 0–6, papel `benefit_item`;
  - `priceText`: 0–1, valor operacional obrigatório;
  - `primaryCta`: 0–1;
  - `secondaryCta`: 0–1;
  - `disclaimer`: 0–1, papel `privacy_note`.
- Preço, desconto, condição e prazo não podem ser inferidos da pesquisa.

#### 2.6.8. `proof.metrics`

- Lifecycle: `candidate`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: 0–1;
  - `items`: 1–4;
  - item:
    - `value`: exatamente 1, operacional e verificável;
    - `label`: exatamente 1, papel `card_title`;
    - `context`: 0–1, papel `card_body`;
    - `evidenceRef`: exatamente 1 no snapshot futuro.
- Não pode entrar em composição enquanto permanecer `candidate`.

#### 2.6.9. `proof.testimonials`

- Lifecycle: `candidate`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: 0–1;
  - `items`: 1–6;
  - item:
    - `quote`: exatamente 1, operacional;
    - `authorName`: exatamente 1, operacional;
    - `authorContext`: 0–1, operacional;
    - `media`: 0–1;
    - `evidenceRef`: exatamente 1 no snapshot futuro.
- Depoimento não pode ser gerado a partir de pesquisa.

#### 2.6.10. `proof.authority`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: 0–1;
  - `description`: 0–1;
  - `credentials`: 1–6 valores operacionais;
  - `identityMedia`: 0–1.
- Credencial, registro e certificação exigem valor real.

#### 2.6.11. `location.summary`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1;
  - `description`: 0–1;
  - `highlights`: 1–8;
  - `media`: 0–1;
  - `mapCta`: 0–1, `actionRole = resource | internal_navigation`.
- Endereço, mapa e rota são valores operacionais.

#### 2.6.12. `qualification.simple_form`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1;
  - `description`: 0–1;
  - `fieldSlots`: 1–4;
  - `submitCta`: exatamente 1;
  - `privacyNote`: exatamente 1;
  - `consentSlot`: 0–1.
- Todos os campos são exibidos em uma etapa.
- O contrato não cria formulário funcional.

#### 2.6.13. `qualification.progressive_form`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1;
  - `description`: 0–1;
  - `steps`: 2–5;
  - total de `fieldSlots`: 2–8;
  - cada etapa contém 1–4 slots;
  - `submitCta`: exatamente 1;
  - `privacyNote`: exatamente 1;
  - `consentSlot`: 0–1.
- A variante existe por mudança reutilizável de comportamento em etapas.
- Não representa financiamento, imóvel ou qualquer taxon.

#### 2.6.14. `how_it_works.steps`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1;
  - `steps`: 2–6;
  - item:
    - `label`: exatamente 1, papel `step_label`;
    - `title`: exatamente 1, papel `step_title`;
    - `body`: exatamente 1, papel `step_body`.

#### 2.6.15. `faq.accordion`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1;
  - `questions`: 2–8;
  - item:
    - `question`: exatamente 1, papel `faq_question`;
    - `answer`: exatamente 1, papel `faq_answer`.
- `accordion` descreve comportamento estrutural de expansão.
- Não autoriza FAQ inventada.

#### 2.6.16. `final_cta.simple`

- Lifecycle: `experimental`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1;
  - `description`: exatamente 1;
  - `primaryCta`: exatamente 1;
  - `proofShort`: 0–1;
  - `privacyNote`: 0–1.

#### 2.6.17. `final_cta.contact_options`

- Lifecycle: `candidate`.
- Estrutura:
  - `eyebrow`: 0–1;
  - `title`: exatamente 1;
  - `description`: 0–1;
  - `options`: 2–3;
  - cada opção contém `label` exatamente 1 e `actionRole = contact`;
  - `privacyNote`: 0–1.
- Os canais e destinos reais vêm das entradas operacionais.
- Não pode entrar em composição enquanto permanecer `candidate`.

#### 2.6.18. `trust.compliance`

- Lifecycle: `experimental`.
- Estrutura:
  - `title`: 0–1;
  - `identityItems`: 1–8 valores operacionais;
  - `privacyNote`: exatamente 1;
  - `contactOptions`: 0–3;
  - `legalLinks`: 0–3 referências operacionais.
- Não declara conformidade jurídica integral.
- Não cria política de privacidade ou texto regulatório automaticamente.

### 2.7. Especializações sobre a raiz

- Regra geral:
  - campo sem especialização herda integralmente a raiz;
  - módulo pode restringir a raiz;
  - variante pode restringir o módulo;
  - variante não pode ampliar regra efetiva do módulo;
  - nenhuma camada pode ampliar limite absoluto da raiz.
- Limite técnico absoluto efetivo:
  - menor valor entre raiz, módulo e variante.
- Faixa recomendada efetiva:
  - especialização mais específica válida;
  - mínimo maior ou igual a 1;
  - mínimo menor ou igual ao máximo;
  - máximo menor ou igual ao limite absoluto efetivo.
- Especializações v1 sustentadas pelo blueprint:
  - `hero.title`, papel `h1`: recomendado 45–80, absoluto herdado;
  - `hero.subtitle`, papel `paragraph`: recomendado 90–160, absoluto herdado;
  - CTA primário de Hero, papel `cta_label`: recomendado 14–28, absoluto herdado;
  - CTA secundário de Hero, papel `cta_label`: recomendado 14–30, absoluto herdado;
  - `proofShort`, papel `paragraph`: recomendado 40–90, absoluto herdado;
  - títulos de seção, papel `h2`: recomendado 25–60, absoluto herdado;
  - `benefits.cards.items.body`, papel `card_body`: recomendado 60–120, absoluto herdado;
  - `faq.question`: recomendado 45–90, absoluto herdado;
  - `faq.answer`: recomendado 90–220, absoluto herdado;
  - `privacyNote`: recomendado 80–180, absoluto herdado.
- Não criar outras especializações numéricas na v1 sem evidência ou decisão humana.
- Opções de `spacing`:
  - todas as variantes herdam `compact`, `default` e `spacious`;
  - nenhuma restrição própria entra na v1 por falta de evidência suficiente;
  - escolha por ocorrência pertence à composição futura.

### 2.8. Contrato de `copy_source_map`

- Cada referência deve declarar:
  - `audienceScope`;
  - `researchBlock`;
  - `itemKey`;
  - `sourceRole = primary | auxiliary`.
- `audienceScope` permitido:
  - `end_customer`;
  - `business_buyer`.
- Regra padrão:
  - copy destinada ao visitante usa `end_customer` como fonte primária;
  - `business_buyer` pode ser auxiliar apenas para autoridade do fornecedor, processo de atendimento, posicionamento do negócio e prova institucional;
  - `business_buyer` não substitui dor, desejo, objeção, intenção de busca ou vocabulário do `end_customer`.
- Limite por campo:
  - até 2 referências primárias;
  - até 1 referência auxiliar.
- Seleção dos itens:
  - maior `priority`;
  - depois menor `sort_order`;
  - sem mistura de versões ou conjuntos fora do contrato da E10.8.
- Blocos permitidos no mapa de campo:
  - `strategic_core`;
  - `seo`.
- `lp_overview`:
  - contexto de transformação e direção;
  - não fonte factual de copy.
- `lp_sections`:
  - fonte estrutural da futura composição E20;
  - proibido como fonte fixa de copy por campo.
- Chave desconhecida deve falhar fechado.
- Campo marcado como operacional não pode ter seu valor factual preenchido por pesquisa.

### 2.9. Mapa inicial de fontes de copy

#### 2.9.1. Hero

- `eyebrow`:
  - primária: `end_customer.seo.search_intent`;
  - auxiliar: `end_customer.strategic_core.positioning_opportunity`.
- `title`:
  - primárias:
    - `end_customer.strategic_core.positioning_opportunity`;
    - `end_customer.strategic_core.desire`;
  - auxiliar: `end_customer.seo.commercial_keywords`.
- `subtitle`:
  - primárias:
    - `end_customer.strategic_core.pain`;
    - `end_customer.strategic_core.desire`;
  - auxiliar: `end_customer.strategic_core.belief`.
- CTAs:
  - primária: `end_customer.strategic_core.trigger`;
  - auxiliar: `end_customer.seo.search_intent`.
- `proofShort`:
  - primária: `end_customer.strategic_core.proof_type`;
  - auxiliar: `end_customer.strategic_core.objection`.

#### 2.9.2. Media

- `title` e `caption`:
  - primárias:
    - `end_customer.strategic_core.desire`;
    - `end_customer.strategic_core.vocabulary`.
- O tipo, a seleção e o valor do ativo são operacionais.
- `lp_overview.image_style` orienta transformação futura, mas não entra como fonte factual.

#### 2.9.3. Benefits

- `title`:
  - primárias:
    - `end_customer.strategic_core.desire`;
    - `end_customer.strategic_core.positioning_opportunity`;
  - auxiliar: `end_customer.strategic_core.pain`.
- Itens:
  - primárias:
    - `end_customer.strategic_core.desire`;
    - `end_customer.strategic_core.pain`;
  - auxiliar: `end_customer.strategic_core.objection`.

#### 2.9.4. Offer

- `title` e `description`:
  - primárias:
    - `end_customer.strategic_core.desire`;
    - `end_customer.strategic_core.trigger`;
  - auxiliar: `end_customer.strategic_core.positioning_opportunity`.
- `highlights`:
  - primárias:
    - `end_customer.strategic_core.desire`;
    - `end_customer.strategic_core.proof_type`;
  - auxiliar: `end_customer.strategic_core.trend`.
- `priceText` e disclaimer factual:
  - valores operacionais obrigatórios.

#### 2.9.5. Proof

- Título e introdução:
  - primárias:
    - `end_customer.strategic_core.proof_type`;
    - `end_customer.strategic_core.belief`;
  - auxiliar: `end_customer.strategic_core.fear`.
- Rótulo de métrica:
  - primária: `end_customer.strategic_core.proof_type`;
  - auxiliar: `end_customer.strategic_core.positioning_opportunity`.
- Título de autoridade:
  - primárias:
    - `business_buyer.strategic_core.proof_type`;
    - `business_buyer.strategic_core.positioning_opportunity`;
  - auxiliar: `end_customer.strategic_core.belief`.
- Métricas, depoimentos, nomes, credenciais e evidências:
  - valores operacionais obrigatórios.

#### 2.9.6. Location

- `title` e `description`:
  - primárias:
    - `end_customer.seo.local_terms`;
    - `end_customer.seo.search_intent`;
  - auxiliar: `end_customer.strategic_core.desire`.
- `highlights`:
  - primárias:
    - `end_customer.seo.local_terms`;
    - `end_customer.strategic_core.desire`;
  - auxiliar: `end_customer.strategic_core.pain`.
- Endereço, mapa e rota são operacionais.

#### 2.9.7. Qualification

- `title` e `description`:
  - primárias:
    - `end_customer.strategic_core.objection`;
    - `end_customer.strategic_core.fear`;
  - auxiliar: `end_customer.strategic_core.awareness_level`.
- Rótulos e perguntas:
  - primárias:
    - `end_customer.strategic_core.objection`;
    - `end_customer.strategic_core.fear`;
  - auxiliar: `end_customer.strategic_core.vocabulary`.
- `submitCta.label`:
  - primária: `end_customer.strategic_core.trigger`;
  - auxiliar: `end_customer.strategic_core.desire`.
- `privacyNote`:
  - primárias:
    - `end_customer.strategic_core.fear`;
    - `end_customer.strategic_core.belief`;
  - auxiliar: `end_customer.strategic_core.proof_type`.

#### 2.9.8. How it works

- Título e campos dos passos:
  - primárias:
    - `end_customer.strategic_core.objection`;
    - `business_buyer.strategic_core.belief`;
  - auxiliar: `end_customer.strategic_core.fear`.
- O processo factual deve vir de valor operacional do negócio.

#### 2.9.9. FAQ

- `question`:
  - primárias:
    - `end_customer.seo.faq_questions`;
    - `end_customer.strategic_core.objection`;
  - auxiliar: `end_customer.strategic_core.fear`.
- `answer`:
  - primárias:
    - `end_customer.strategic_core.objection`;
    - `end_customer.strategic_core.belief`;
  - auxiliar: `end_customer.strategic_core.proof_type`.
- Resposta factual, legal, financeira ou regulatória exige valor operacional ou fonte própria do recorte futuro.

#### 2.9.10. Final CTA

- `title`:
  - primárias:
    - `end_customer.strategic_core.trigger`;
    - `end_customer.strategic_core.desire`;
  - auxiliar: `end_customer.strategic_core.positioning_opportunity`.
- `description`:
  - primárias:
    - `end_customer.strategic_core.objection`;
    - `end_customer.strategic_core.desire`;
  - auxiliar: `end_customer.strategic_core.proof_type`.
- CTA:
  - primária: `end_customer.strategic_core.trigger`;
  - auxiliar: `end_customer.seo.search_intent`.

#### 2.9.11. Trust

- Título e rótulos:
  - primárias:
    - `business_buyer.strategic_core.proof_type`;
    - `business_buyer.strategic_core.belief`;
  - auxiliar: `end_customer.strategic_core.fear`.
- Identidade, registro, política, contato e links:
  - valores operacionais obrigatórios.

### 2.10. Contexto de `lp_overview`

- O resolver deve expor, como referências contextuais aceitas para consumidores futuros:
  - `narrative_arc`;
  - `visual_tone`;
  - `color_direction`;
  - `page_length`;
  - `image_style`;
  - `visual_density`;
  - `typography_direction`;
  - `mobile_priority`.
- Essas chaves orientam transformação, composição e futura renderização, mas não autorizam fatos, não alteram o design system, não criam variantes e não sobrescrevem raiz, módulo ou variante.

### 2.11. `funnel_copy_profile`

- Perfis permitidos:
  - `bofu`;
  - `mofu`;
  - `tofu`.
- O perfil é selecionado por intenção informada no fluxo futuro.
- O perfil não é canal, módulo, variante, taxon ou composição.
- O perfil deve declarar objetivo de comunicação, nível presumido de consciência, intensidade da conversão, profundidade explicativa, fricção máxima de qualificação e tratamentos.
- O módulo adapta o perfil à sua função.
- A variante pode apenas restringir ou tornar mais específico; nunca promover tratamento proibido a permitido.
- O perfil não pode ampliar limite técnico ou cardinalidade.

#### 2.11.1. BOFU

- Objetivo:
  - conversão direta ou microconversão de alta intenção.
- Consciência presumida:
  - média a alta.
- Direção:
  - recorte específico;
  - benefício concreto;
  - prova;
  - objeção;
  - CTA direto.
- Qualificação:
  - simples ou progressiva, quando aplicável.
- Módulos mais adequados:
  - Hero;
  - Offer;
  - Proof;
  - Qualification;
  - FAQ;
  - Final CTA;
  - Trust.

#### 2.11.2. MOFU

- Objetivo:
  - avaliação, comparação e avanço de consideração.
- Consciência presumida:
  - média.
- Direção:
  - explicar;
  - diferenciar;
  - demonstrar;
  - responder riscos;
  - oferecer próximo passo proporcional.
- Qualificação:
  - baixa a moderada.
- Módulos mais adequados:
  - Hero;
  - Media;
  - Benefits;
  - Proof;
  - Location;
  - How it works;
  - FAQ;
  - Final CTA;
  - Trust.
- Oferta e CTA direto:
  - permitidos com intensidade restrita.

#### 2.11.3. TOFU

- Objetivo:
  - descoberta, consciência e primeiro avanço.
- Consciência presumida:
  - baixa a média.
- Direção:
  - contexto;
  - dor;
  - desejo;
  - educação;
  - prova de relevância;
  - CTA de baixa fricção.
- Qualificação:
  - apenas simples e curta, quando necessária.
- Módulos mais adequados:
  - Hero;
  - Media;
  - Benefits;
  - Location;
  - How it works;
  - FAQ;
  - Trust.
- Offer e Final CTA:
  - somente em forma proporcional e não agressiva.
- Qualificação progressiva:
  - proibida na v1 para TOFU.

### 2.12. Matriz de tratamentos comerciais

- Estados:
  - `allowed`;
  - `restricted`;
  - `prohibited`.
- Regra global:
  - tratamento sem fonte real é sempre `prohibited`, mesmo quando a matriz indicar `allowed`.

| Tratamento | BOFU | MOFU | TOFU | Condição |
|---|---|---|---|---|
| CTA direto de conversão | allowed | restricted | restricted | coerente com intenção e ação disponível |
| CTA educacional ou recurso | allowed | allowed | allowed | recurso real e destino válido |
| preço explícito | allowed | restricted | prohibited | valor operacional atual |
| oferta transacional | allowed | restricted | restricted | condição real; em TOFU apenas baixa pressão |
| urgência | restricted | prohibited | prohibited | prazo ou evento real |
| escassez | restricted | prohibited | prohibited | disponibilidade real e verificável |
| garantia | restricted | restricted | prohibited | garantia formal e condições disponíveis |
| prova ou resultado | allowed | allowed | allowed | evidência real e rastreável |
| comparação | allowed | allowed | restricted | critério objetivo, sem alegação enganosa |
| credencial | allowed | allowed | allowed | credencial real e vigente |
| autoridade | allowed | allowed | allowed | identidade e especialização reais |
| formulário simples | allowed | allowed | restricted | fricção proporcional |
| formulário progressivo | allowed | restricted | prohibited | necessidade real de qualificação |
| enquadramento de risco ou medo | restricted | restricted | restricted | sem alarmismo ou manipulação |
| superlativo ou promessa forte | restricted | restricted | restricted | sustentação explícita e linguagem não absoluta |

- Proibições permanentes:
  - prova inventada;
  - depoimento gerado;
  - resultado garantido sem contrato;
  - escassez artificial;
  - urgência artificial;
  - comparação sem base objetiva;
  - preço estimado apresentado como real;
  - credencial inexistente;
  - autoridade simulada;
  - keyword stuffing;
  - omissão deliberada de condição relevante;
  - linguagem discriminatória;
  - manipulação por medo.

### 2.13. Adaptação do perfil por módulo

- Hero:
  - adapta intensidade da proposta e do CTA;
  - não muda estrutura pelo funil.
- Media:
  - BOFU prioriza demonstração;
  - MOFU prioriza avaliação;
  - TOFU prioriza descoberta.
- Benefits:
  - BOFU prioriza ganho concreto;
  - MOFU prioriza diferenciação;
  - TOFU prioriza compreensão.
- Offer:
  - BOFU admite oferta transacional sustentada;
  - MOFU usa explicação e próximo passo;
  - TOFU restringe pressão comercial.
- Proof:
  - BOFU prioriza redução de risco;
  - MOFU prioriza comparação e confiança;
  - TOFU prioriza legitimidade.
- Location:
  - adapta a relevância, sem criar fatos geográficos.
- Qualification:
  - BOFU permite maior profundidade;
  - MOFU limita fricção;
  - TOFU admite somente `simple_form`.
- How it works:
  - BOFU remove incerteza operacional;
  - MOFU explica processo;
  - TOFU educa sobre jornada.
- FAQ:
  - BOFU responde objeções de decisão;
  - MOFU responde dúvidas de avaliação;
  - TOFU responde dúvidas introdutórias.
- Final CTA:
  - BOFU direto;
  - MOFU proporcional;
  - TOFU de baixa fricção.
- Trust:
  - invariantes factuais e de privacidade em todos os perfis.

### 2.14. Contrato de resolução

- Resolver público previsto:
  - `resolveLandingPageModuleVariant(...)`.
- Entrada mínima:
  - `rootVersion`;
  - `moduleCatalogVersion`;
  - `moduleKey`;
  - `variantKey`;
  - `purpose`.
- `purpose` permitido:
  - `controlled_test`;
  - `new_use`;
  - `historical_read`.
- Comportamento:
  - resolver primeiro a raiz;
  - validar compatibilidade do catálogo com a raiz;
  - resolver módulo;
  - resolver variante;
  - aplicar precedência raiz → módulo → variante;
  - calcular limites efetivos;
  - validar lifecycle contra o propósito;
  - retornar payload profundamente imutável.
- Elegibilidade:
  - `controlled_test`: aceita `experimental` e `validated`;
  - `new_use`: aceita somente `validated`;
  - `historical_read`: aceita `experimental`, `validated` e `deprecated` por versão exata;
  - `candidate`: não é resolvível para uso.
- Não existe fallback de catálogo, módulo, variante, versão ou lifecycle.
- Erros mínimos:
  - `UNKNOWN_ROOT_VERSION`;
  - `UNKNOWN_MODULE_CATALOG_VERSION`;
  - `ROOT_CATALOG_INCOMPATIBLE`;
  - `UNKNOWN_MODULE`;
  - `UNKNOWN_VARIANT`;
  - `MODULE_VARIANT_MISMATCH`;
  - `INVALID_MODULE_CONTRACT`;
  - `INVALID_VARIANT_CONTRACT`;
  - `LIFECYCLE_NOT_ELIGIBLE`;
  - `INVALID_SPECIALIZATION`;
  - `INVALID_COPY_SOURCE_MAP`;
  - `INVALID_FUNNEL_PROFILE`.

### 2.15. Compatibilidade histórica

- O contrato resolvido deve expor:
  - `rootVersion`;
  - `moduleCatalogVersion`;
  - `moduleKey`;
  - `moduleVersion`;
  - `variantKey`;
  - `variantVersion`;
  - lifecycle;
  - contrato efetivo.
- Consumidores futuros devem persistir essas identidades no snapshot da LP.
- A E18.5 não altera agora `account_landing_pages` nem `content_artifacts`.
- Uma variante `deprecated`:
  - não entra em novas composições;
  - não entra em novas gerações;
  - continua resolvível em `historical_read`.
- Uma variante só pode deixar de existir em código quando nenhum artefato publicado depender dela ou houver plano de migração aprovado e executado.
- Remover a variante do catálogo atual não autoriza apagar a definição das versões antigas.
- A renderer futura deve resolver o contrato exato do snapshot, não o catálogo mais recente.
- Migração automática de LP existente é proibida sem plano próprio.

### 2.16. Validações executáveis mínimas

- Catálogo v1 válido.
- Todos os módulos têm chave única e função estrutural não vazia.
- Todas as variantes têm chave única e prefixo correspondente ao módulo.
- Chave do catálogo corresponde a `moduleCatalogVersion`.
- `rootVersion` compatível existe.
- Lifecycle válido.
- Módulo desconhecido falha fechado.
- Variante desconhecida falha fechado.
- Variante vinculada ao módulo errado falha fechado.
- `candidate` rejeitada em todos os propósitos de uso.
- `experimental` aceita em `controlled_test` e rejeitada em `new_use`.
- `validated` aceita em todos os propósitos aplicáveis.
- `deprecated` aceita somente em `historical_read`.
- Campo obrigatório ausente falha.
- Campo desconhecido falha.
- Cardinalidade mínima e máxima inválidas falham.
- `minItems > maxItems` falha.
- Papel semântico desconhecido falha.
- Opção de spacing fora da raiz falha.
- Especialização com mínimo menor que 1 falha.
- Especialização com mínimo maior que máximo falha.
- Especialização acima do limite absoluto efetivo falha.
- Variante que amplia restrição do módulo falha.
- `copy_source_map` com mais de 2 fontes primárias falha.
- `copy_source_map` com mais de 1 auxiliar falha.
- `researchBlock` desconhecido falha.
- `itemKey` desconhecido no bloco fixo falha.
- `lp_sections` como fonte de copy falha.
- `business_buyer` usado como fonte primária de dor, desejo, objeção, SEO ou vocabulário do visitante falha.
- Campo operacional sem marcação obrigatória falha.
- Métrica, depoimento, credencial, preço, endereço ou compliance com origem de pesquisa como valor factual falha.
- Perfil de funil desconhecido falha.
- Override de variante que promove tratamento proibido falha.
- Tratamento sem fonte real permanece proibido.
- TOFU com `qualification.progressive_form` falha.
- Resultado resolvido é profundamente imutável.
- Chamadas diferentes não compartilham referência mutável.
- Nova versão de catálogo pode ser adicionada sem alterar a v1.
- Versão antiga permanece resolvível.
- Registry não contém taxon, campaign, account, composition, sortOrder, isRequired, conteúdo concreto, URL concreta ou preço concreto.
- Ausência de imports de banco, Supabase, env, API, renderer, rota ou Admin.

### 2.17. Fluxo operacional

- Gatilho:
  - plano-base v2 consolidado e mergeado;
  - fase atual instruída pelo Estrategista.
- Entrada:
  - parametrização raiz v1;
  - plano-base E18.5;
  - catálogo inicial aprovado;
  - `item_key` oficiais;
  - evidência parcial do blueprint.
- Processamento:
  - criar contratos públicos;
  - criar registry versionado;
  - criar schema estrito;
  - criar resolver;
  - calcular especializações efetivas;
  - validar mapas e perfis;
  - criar casos executáveis;
  - ajustar exports e script.
- Validação:
  - `npm ci`;
  - `npm run validate:landing-page-root`;
  - `npm run validate:landing-page-modules`;
  - `npm run validate:commercial-activation`;
  - `npm run check`;
  - `git diff --check`;
  - checks do PR.
- Persistência:
  - arquivos versionados no repositório;
  - sem banco.
- Consumo:
  - E20 e E19 em fases futuras.
- Fallback:
  - falha fechada;
  - sem versão ou variante implícita;
  - conflito ou necessidade de escopo novo retorna ao Estrategista.

### 2.18. Relatório documental

- Usar relatório consolidado somente ao final do plano.
- O relatório final deve informar ao Gestor de Docs:
  - catálogo inicial;
  - variantes e lifecycle;
  - boundary e arquivos;
  - especializações efetivas;
  - `copy_source_map`;
  - `funnel_copy_profile`;
  - matriz de tratamentos;
  - compatibilidade histórica;
  - checks;
  - ausência de banco, composição, geração e Admin.
- Atualizações duráveis previstas:
  - `docs/roadmap.md`;
  - `docs/base-tecnica.md`;
  - referências comprovadamente afetadas em `docs/lp-planejamento.md`, apenas se houver delta real.
- `docs/schema.md`:
  - N/A se não houver mudança de banco.

## 3. Fases e próxima ação

### 3.1. E18.5.3–E18.5.9 — Catálogo versionado de módulos e variantes v1

- Status:
  - pendente;
  - bloqueada até consolidação v2 e merge do plano-base.
- Automação:
  - não.
- Risco:
  - médio controlado.
- Objetivo:
  - implementar atomicamente o contrato repo-only completo de módulos e variantes v1.
- Artefatos a criar:
  - `lib/conversion-content/landing-page/module-catalog/contracts.ts`;
  - `lib/conversion-content/landing-page/module-catalog/registry.ts`;
  - `lib/conversion-content/landing-page/module-catalog/schema.ts`;
  - `lib/conversion-content/landing-page/module-catalog/resolver.ts`;
  - `lib/conversion-content/landing-page/module-catalog/validation-cases.ts`;
  - `lib/conversion-content/landing-page/module-catalog/index.ts`.
- Artefatos a ajustar:
  - `lib/conversion-content/index.ts`;
  - `package.json`;
  - `docs/lousa-plano-base-e18-5.md`, somente estado e evidências da fase.
- Implementação:
  - catálogo e versões;
  - módulos e variantes;
  - campos, estruturas e cardinalidades;
  - especializações sobre a raiz;
  - mapas de fontes;
  - perfis de funil;
  - matriz de tratamentos;
  - lifecycle;
  - compatibilidade;
  - resolver;
  - validações.
- Critérios de aceite:
  - todos os contratos da seção 2 implementados;
  - raiz preservada;
  - catálogo v1 imutável;
  - resolver fail-closed;
  - módulos e variantes não representam taxon, conteúdo, campanha ou composição;
  - fontes de copy usam apenas chaves autorizadas;
  - fatos operacionais não são inferidos da pesquisa;
  - lifecycle e propósito de uso aplicados;
  - versões antigas preserváveis;
  - nenhum renderer, schema final de LP ou geração antecipada;
  - nenhuma mudança de banco;
  - validações concluídas.
- Próxima ação após execução:
  - avaliação do Analista;
  - se aprovado, encerrar a implementação material e emitir relatório final ao Gestor de Docs;
  - se precisar de ajuste, retornar à mesma fase.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Catálogo de entradas.
- Valores reais das entradas.
- Resolução de pesquisas.
- Nova regra de herança de `business_buyer`.
- Taxonomia.
- Composição base.
- Composição por taxon.
- Ordem ou obrigatoriedade das seções.
- Herança concreta de composição.
- Prontidão do taxon.
- Autorização de conta de teste.
- Entitlement.
- Geração de LP.
- IA de geração.
- Prompt de geração.
- Structured Output de conteúdo final.
- Schema final de conteúdo da LP.
- Renderer.
- Render model.
- Rota pública.
- Publicação.
- Tracking.
- Analytics.
- Teste A/B.
- Admin.
- LP Builder.
- Editor visual.
- Banco.
- Migration.
- RPC.
- Policy.
- Grant.
- Trigger.
- Nova tabela ou coluna.
- Storage.
- Upload.
- CRM.
- Webhook.
- Job.
- Agente.
- Automação.
- Workflow.
- Nova infraestrutura.
- Nova dependência.
- Configuração de bundler.
- Alteração em `commercial_activation`.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se:
  - a implementação exigir banco;
  - surgir necessidade de registrar composição;
  - surgir necessidade de gerar ou renderizar conteúdo;
  - faltar `item_key` oficial necessário;
  - uma variante depender de taxon, campanha ou entrada específica;
  - uma diferença puder ser atendida por parâmetro já existente;
  - houver necessidade de ampliar limite absoluto da raiz;
  - houver conflito com a E18.4;
  - houver conflito com E20 ou E19;
  - a implementação exigir mudança de `commercial_activation`;
  - a implementação exigir nova dependência;
  - a implementação exigir URL, rota, formulário funcional ou integração;
  - a preservação histórica não puder ser garantida no contrato repo-only;
  - o diff ultrapassar os artefatos autorizados sem decisão humana.

### 4.3. Decisão atual

- Plano-base v1 criado para avaliação única dos especialistas.
- Nenhuma fase autorizada ao Executor.
- Próxima ação:
  - abrir PR vivo apenas com este plano-base;
  - solicitar avaliação do Analista, Gestor Estrutural e Gestor de Updates;
  - consolidar todos os retornos no mesmo PR como v2;
  - solicitar merge humano;
  - somente após confirmação do merge, instruir a fase 3.1 ao Executor.

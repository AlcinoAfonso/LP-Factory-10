12/08/2026 — Rascunho vivo — E19.3 — Pacote autorizado para geração no Cenário D

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo reaberto; ainda não consolidado como plano-base v1.
- Recorte: `E19.3 — Pacote autorizado para geração no Cenário D`.
- Path canônico preservado: `docs/lousa-plano-base-e19-3.md`.
- Processo: `docs/prompt-estrategista.md` v29.
- Plano conceitual: `docs/lp-planejamento.md`.
- O plano-base v2 anterior permanece como histórico do desenho substituído, no qual a E19.3 selecionava composição, módulos, variantes, ordem e contexto editorial antes da geração.
- Decisão humana de 12/08/2026: testar o Cenário D controlado; para essa prova, E18.5 vigente e E20.3 deixam de ser dependências obrigatórias da geração.
- O recorte sucessor coordenado pelo mesmo Estrategista é `E19.4 — Geração e materialização da landing page em draft`, que definirá candidata, Structured Output, contrato estrutural único, validação pós-IA, materialização e renderer.
- Gate 1 deste novo debate está fechado; Gates 2 e 3 permanecem abertos.

### 1.2. Objetivo

- Transformar a E19.3 no menor boundary determinístico capaz de receber uma `landing_page` legítima já configurada pelo fluxo oficial e entregar à E19.4 um pacote autorizado de pesquisa, fatos, proveniência, limites editoriais e contexto operacional, sem montar previamente a LP.
- A E19.3 não escolhe módulos, variantes, ordem, função narrativa, seção, layout ou fontes concretas por decisão editorial.
- A E19.3 não usa `copySourceMap`, `prioritizedSources`, `funnelCopyProfiles`, `ctaMode`, `generationGuidance`, `itemGuidance` ou recomendações da E20.3 para filtrar ou montar a futura LP.
- A E19.3 termina com um pacote determinístico e imutável; não chama OpenAI, não gera copy, não materializa conteúdo e não renderiza a landing page.
- Automação: não.

### 1.3. Fontes obrigatórias

- `README.md`.
- `docs/prompt-estrategista.md`.
- `docs/template-roadmap.md`.
- `docs/roadmap.md`.
- `docs/lp-planejamento.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/lousa-plano-base-e10-8.md`.
- `docs/lousa-plano-base-e18-4.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e19-2.md`.
- Estado histórico e implementação vigente de E18.5, E20.3 e E19.3 apenas para identificar dependências a retirar ou proteções a preservar.
- Implementação vigente em `lib/lp-builder/generationContext.ts`, `lib/lp-builder/generationContextContracts.ts` e boundaries públicos relacionados.
- Parecer do Analista Sênior de 12/08/2026 sobre pesquisa, fatos, E18.4, proveniência e responsabilidades que sobrevivem à retirada de E18.5/E20.3.

### 1.4. Responsabilidades preservadas

- E10.8 permanece responsável por resolver pesquisas estruturadas, versões e proveniência; a E19.3 não reimplementa sua herança, elegibilidade ou integridade.
- E19.2 permanece responsável pelos valores concretos configurados, sua aplicabilidade, origem, completude e vínculo ao `draft`.
- E20.2 permanece responsável pelo catálogo declarativo de entradas, tipos, escopos, condições, validações e proveniência das definições; a E19.3 não transforma o catálogo em fonte de valores concretos.
- E18.4 permanece responsável pela parametrização raiz; a E19.3 projeta somente o subconjunto editorial útil ao consumidor seguinte.
- E9 e os boundaries vigentes permanecem responsáveis por entitlement, autorização, tenant, membership e vínculo da LP.
- E18.5 fica fora do caminho canônico da prova do Cenário D; não participa da seleção editorial, filtragem de pesquisa ou composição. Seus ativos estruturais continuam preservados no repositório para avaliação posterior.
- E20.3 fica fora do caminho canônico da prova do Cenário D; ausência de perfil ativo não bloqueia a nova E19.3.
- A E19.3 permanece no boundary existente `lib/lp-builder/`; não criar novo domínio, rota, UI, persistência, banco, engine ou infraestrutura neste recorte.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho: invocação server-side explícita para obter o pacote autorizado de uma LP legítima já configurada.
- Entrada: LP em `draft`, configuração concluída e vinculada pela E19.2, taxon e plano efetivos, resolução E10.8 e parametrização raiz E18.4.
- Processamento conceitual: validar LP/configuração/gates vigentes → resolver pesquisa canônica → projetar o conjunto `end_customer` autorizado → projetar fatos concretos válidos e aplicáveis → separar valores semanticamente úteis dos valores operacionais server-side → projetar limites editoriais mínimos da E18.4 → preservar IDs, versões e proveniência → montar saída determinística.
- Validação: falhar fechado para LP/configuração inválida, pesquisa `end_customer` indisponível ou inválida, catálogo/valores incompatíveis, fato obrigatório ausente ou outra inconsistência comprovável pelos contratos responsáveis.
- Persistência: nenhuma nova. A E19.3 apenas lê fontes vigentes e devolve resultado tipado e imutável.
- Consumo: a saída de sucesso é a entrada canônica da futura E19.4; nenhum consumidor deve reconstruir ou reler E18.5/E20.3 para decidir narrativa.
- Fallback: somente fallbacks já autorizados pelas fontes responsáveis; não introduzir heurística, mapa editorial, seleção por `itemKey` ou default silencioso.
- Observabilidade: preservar somente logging seguro já autorizado no boundary, sem conteúdo de pesquisa, valores concretos, PII, secrets, payloads ou prompts e sem infraestrutura nova.

### 2.2. Gate 1 — conteúdo autorizado do pacote

- Status: fechado em 12/08/2026.
- Pesquisa enviada como matéria-prima sem filtragem editorial:
  - conjunto `end_customer` resolvido pela E10.8;
  - blocos `strategic_core`, `lp_overview`, `lp_sections` e `seo`;
  - todos os itens ativos integrantes do conjunto resolvido;
  - `itemId`, `researchId`, `itemKey`, bloco, `audienceScope`, taxon servido e de origem, relação de origem, versões e proveniência existentes.
- `business_buyer` continua podendo ser resolvido pela E10.8 para preservar seu contrato vigente, mas seus textos não integram o pacote de geração da LP `end_customer`; isso é uma fronteira determinística de audience, não seleção editorial por pertinência.
- Não existe filtragem adicional por módulo, funil, CTA, `itemKey`, `copySourceMap`, fonte priorizada ou julgamento semântico da E19.3.
- Fatos semanticamente visíveis à futura IA, quando `applicable = true`, `source != missing` e já validados pela jornada vigente:
  - `business_display_name`;
  - `primary_service_or_offer`;
  - `primary_service_or_offer_description`;
  - `funnel_stage`;
  - `traffic_source`, quando presente;
  - `paid_search_keyword_map`, quando aplicável;
  - `primary_conversion_channel`;
  - `service_locations`;
  - `property_types`;
  - `property_price_range`;
  - `property_stage`;
  - `transaction_intent`;
  - `financing_support_available`;
  - `document_support_available`;
  - `attendance_modes`;
  - `creci_registration`, como dado declarado e nunca automaticamente como prova verificada.
- Valores brutos que permanecem sob autoridade server-side:
  - `whatsapp_destination`;
  - `phone_destination`;
  - `email_destination`;
  - `external_url_destination`;
  - `privacy_policy_url`;
  - valor bruto de `brand_logo_asset`;
  - valor bruto de `brand_color_palette`.
- A classificação acima não autoriza novo registry paralelo. O Gate 2 deve fechar a regra geral de projeção com base nos metadados existentes e provar que ela resolve o catálogo vigente sem uma allowlist escondida.
- Projeção mínima da E18.4 para a futura geração:
  - papéis semânticos disponíveis;
  - faixa recomendada de texto por papel;
  - `absoluteMax`;
  - hierarquia semântica geral relevante à composição textual.
- Permanecem exclusivamente determinísticos e fora do contexto textual da IA:
  - viewports de evidência;
  - alvo interativo mínimo;
  - foco, contraste e no-horizontal-scroll;
  - tipografia CSS concreta;
  - `maxPageWidth` e `maxReadingWidth`;
  - tamanhos em `rem`;
  - detalhes de acessibilidade do renderer;
  - density, spacing e preset como escolha de apresentação, reservados à E19.4.
- Pesquisa não cria novas identidades de proveniência; reutilizar IDs e versões da E10.8.
- Fatos não criam `fact_id`; preservar `fieldKey`, valor autorizado, `source`, versão do catálogo e proveniência já disponível.
- Evidência da definição E20.2 não comprova a veracidade do valor concreto. Valor declarado pode ser contexto sem virar prova.
- Evidência concreta só integra o pacote quando já existir referência real e autorizada. Ausência de evidência permanece ausência; não inventar `evidence_id`.
- Testemunho, credencial verificada ou outra prova factual concreta não fica disponível para geração sem evidência concreta correspondente.

### 2.3. Gate 2 — regra de projeção e autoridade factual

- Status: aberto.
- Objetivo: fechar uma regra pequena, determinística e geral que projete os fields concretos já validados para duas categorias lógicas — contexto semanticamente visível e valor operacional server-side — sem criar novo registry, allowlist nominal ou heurística textual.
- Questões indispensáveis:
  - quais propriedades já existentes em E20.2/E19.2 bastam para classificar todos os fields do catálogo vigente;
  - como representar disponibilidade de asset ou paleta sem expor valor bruto quando isso for útil à E19.4;
  - como transportar `primary_conversion_channel` para narrativa preservando destinos somente server-side;
  - como distinguir dado declarado de prova verificada de forma determinística;
  - como preservar fatos booleanos de capacidade diretamente, sem o slot artificial `applicable_capabilities`;
  - quais ausências ou incompatibilidades bloqueiam a E19.3 e quais apenas representam capacidade/prova não disponível.
- Decisão já aceita: não criar nova versão de E20.2 somente para reproduzir uma classificação IA/server se a regra puder ser derivada dos contratos vigentes.

### 2.4. Gate 3 — interface lógica da saída

- Status: aberto.
- Objetivo: definir o menor shape lógico que a E19.4 consumirá diretamente, sem antecipar o schema da candidata nem criar DTO paralelo.
- A saída deve preservar, no mínimo, conceitos suficientes para:
  - identidade da LP, conta, plano e taxon;
  - versões efetivamente usadas;
  - pesquisa `end_customer` completa e sua proveniência;
  - fatos semanticamente visíveis e sua proveniência;
  - valores operacionais server-side necessários à etapa seguinte;
  - evidências concretas disponíveis, quando existirem;
  - projeção editorial mínima da E18.4;
  - resultado discriminado entre sucesso completo e falha explícita.
- Questões indispensáveis:
  - se a divisão lógica deve ser apenas `modelContext` + `serverContext` ou outra forma menor;
  - como impedir que a E19.4 crie um segundo shape intermediário antes da chamada ao provider;
  - quais identidades e versões precisam estar no pacote para o futuro snapshot sem antecipar a materialização;
  - como manter imutabilidade profunda e falha fechada sem transportar objetos internos desnecessários.
- A E19.3 não define neste Gate: módulos, layouts, seções, Structured Output, prompt, modelo, validação pós-IA, materialização ou renderer.

### 2.5. Simplificação obrigatória

- Implementação esperada: ler fontes canônicas → validar → projetar pesquisa/fatos/limites → separar contexto semântico de valores operacionais → montar saída tipada → validar.
- Não criar `factIdentity`, registry de fatos, taxonomia geral de contexto, `researchPath` novo, DSL, engine, framework de claims, nova camada entre E19.3 e E19.4 ou matriz E18.5 ↔ E20.2.
- Não criar allowlist de pesquisa por módulo ou field.
- Não criar perfil de funil ou guidance substituto para E20.3.
- Não criar nova persistência, tabela, migration, rota, UI, API HTTP, Server Action ou infraestrutura.
- Crescimento motivado por extensibilidade sem consumidor atual é critério de parada e simplificação.

## 3. Fases e próxima ação

### 3.1. E19.3.3 — Pacote autorizado para geração no Cenário D

- Status: rascunho de fase; ainda não aprovado para implementação.
- Automação: não.
- Objetivo preliminar: substituir a composição determinística anterior por um compilador de contexto autorizado que implemente somente o contrato consolidado após o fechamento dos Gates 2 e 3.
- A fase deve permanecer única se o contrato final puder ser executado sem banco, migration, rota, UI, nova infraestrutura ou mudança de responsabilidade fora da E19.3.
- Validações e casos executáveis serão definidos somente após os Gates 2 e 3, reutilizando os validators canônicos das fontes efetivamente consumidas.

### 3.2. Próxima ação

- Fechar o Gate 2 com inspeção factual dos metadados vigentes de E20.2/E19.2 e parecer focal do Analista Sênior.
- Em seguida fechar o Gate 3, preferencialmente na mesma rodada de debate, se a regra de projeção permitir definir a interface lógica sem nova abstração.
- Somente depois consolidar este mesmo arquivo como plano-base v1.
- Não iniciar implementação nem detalhar E19.4 antes da v1 da E19.3 estar fechada.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- chamada OpenAI ou geração de copy;
- modelo, reasoning effort, prompt ou Structured Output;
- módulos, variantes, layouts, seções ou composição da candidata;
- validação pós-IA;
- materialização, snapshot durável ou renderer;
- E18.5 como dependência obrigatória da geração;
- E20.3 como dependência obrigatória da geração;
- criação, evolução ou operação de perfil de orientação;
- alteração de E10.8, E18.4 ou E20.2 sem gap real demonstrado;
- banco, migration, tabela, view, RPC, trigger, RLS, policy ou nova persistência;
- rota, UI, editor, Provider, agente, automação, job, fila, cron, webhook ou nova infraestrutura;
- tracking, Analytics, CRM, domínio, publicação, A/B test, Ads ou integrações futuras;
- regra específica da conta piloto ou de um nicho dentro da E19.3;
- novo contrato estrutural da candidata, que pertence à E19.4.

### 4.2. Critérios de parada

- Parar se a regra de projeção IA/server exigir mapa nominal crescente dentro da E19.3; devolver ao Estrategista para localizar a regra no contrato responsável ou simplificar.
- Parar se for necessário inventar evidência, prova, claim verificado ou semântica não sustentada pelas fontes.
- Parar se surgir filtro editorial de pesquisa, seleção de módulo, variante, ordem, narrativa ou layout.
- Parar se faltar fonte canônica indispensável para validar um fato, pesquisa, limite ou binding.
- Parar se surgir necessidade de banco, rota, job, agente, automação, engine ou infraestrutura nova não autorizada por fonte real do projeto.
- Parar e simplificar se a maior parte do crescimento técnico vier de generalizações para consumidores futuros inexistentes.
- Toda ampliação material de escopo volta ao humano; não é autorizada implicitamente por este rascunho.
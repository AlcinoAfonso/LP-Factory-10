12/08/2026 — Plano-base v1 — E19.3 — Pacote autorizado para geração no Cenário D

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado.
- Recorte: `E19.3 — Pacote autorizado para geração no Cenário D`.
- Path canônico: `docs/lousa-plano-base-e19-3.md`.
- Processo: `docs/prompt-estrategista.md` v29.
- Plano conceitual: `docs/lp-planejamento.md`.
- Os Gates 1, 2 e 3 do novo debate foram encerrados em 12/08/2026.
- Decisão humana: testar o Cenário D controlado; para essa prova, E18.5 vigente e E20.3 deixam de ser dependências obrigatórias da geração.
- O plano-base v2 anterior permanece apenas como histórico do desenho substituído, no qual a E19.3 selecionava composição, módulos, variantes, ordem e contexto editorial antes da geração.
- O recorte sucessor coordenado pelo mesmo Estrategista é `E19.4 — Geração e materialização da landing page em draft`, que definirá candidata, Structured Output, contrato estrutural único, validação pós-IA, materialização e renderer.

### 1.2. Objetivo e resultado esperado

- Transformar a E19.3 no menor boundary determinístico capaz de receber uma `landing_page` legítima já configurada pelo fluxo oficial e entregar à E19.4 um único pacote autorizado de pesquisa, fatos, proveniência, limites editoriais e contexto operacional.
- A E19.3 deixa de montar previamente a LP.
- A E19.3 não escolhe módulos, variantes, ordem, função narrativa, seção, layout, intensidade comercial ou fontes concretas por decisão editorial.
- A E19.3 não usa `copySourceMap`, `prioritizedSources`, `funnelCopyProfiles`, `ctaMode`, `generationGuidance`, `itemGuidance` ou recomendações da E20.3 para filtrar ou montar a futura LP.
- O resultado de sucesso é um pacote versionado, tipado e profundamente imutável consumido diretamente pela E19.4.
- A E19.3 não chama OpenAI, não gera copy, não materializa conteúdo e não renderiza a landing page.

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
- Estado histórico e implementação vigente de E18.5, E20.3 e E19.3 somente para identificar dependências a retirar ou proteções a preservar.
- `lib/conversion-content/landing-page/research-resolution/`.
- `lib/conversion-content/landing-page/input-catalog/`.
- `lib/conversion-content/landing-page/` para a API pública da E18.4.
- `lib/lp-builder/contracts.ts`.
- `lib/lp-builder/generationContext.ts`.
- `lib/lp-builder/generationContextContracts.ts`.
- Pareceres do Analista Sênior de 12/08/2026 sobre os Gates 1, 2 e 3.

### 1.4. Responsabilidades preservadas

- E10.8 permanece responsável por resolver pesquisas estruturadas, versões e proveniência; a E19.3 não reimplementa sua herança, elegibilidade ou integridade.
- E19.2 permanece responsável pelos valores concretos configurados, sua aplicabilidade, origem, completude e vínculo ao `draft`.
- E20.2 permanece responsável pelo catálogo declarativo de entradas, tipos, escopos, condições, validações e proveniência das definições; a E19.3 não transforma o catálogo em fonte de valores concretos.
- E18.4 permanece responsável pela parametrização raiz; a E19.3 projeta somente o subconjunto editorial útil à E19.4.
- E9 e os boundaries vigentes permanecem responsáveis por entitlement, autorização, tenant, membership e vínculo da LP.
- E18.5 fica fora do caminho canônico da prova do Cenário D; não participa da seleção editorial, filtragem de pesquisa ou composição. Seus ativos estruturais permanecem preservados no repositório para avaliação posterior.
- E20.3 fica fora do caminho canônico da prova do Cenário D; ausência de perfil ativo não bloqueia a nova E19.3.
- A E19.3 permanece no boundary existente `lib/lp-builder/`; não criar novo domínio, rota, UI, persistência, banco, engine ou infraestrutura neste recorte.

### 1.5. Decisões consolidadas dos Gates

- Gate 1 — conteúdo autorizado:
  - pesquisa `end_customer` completa da E10.8;
  - fatos concretos válidos e aplicáveis da configuração E19.2 governada pela E20.2;
  - IDs, versões e proveniência existentes;
  - evidências concretas somente quando realmente existirem;
  - projeção editorial mínima da E18.4;
  - valores operacionais necessários à etapa seguinte preservados server-side.
- Gate 2 — projeção do valor bruto por `valueType`:
  - valores semanticamente visíveis: `string`, `enum`, `string_list`, `boolean`, `number_range`, `keyword_map`;
  - valores brutos server-side: `phone`, `email`, `url`, `asset_reference`, `color_palette`;
  - a classificação governa apenas o valor bruto; `fieldKey`, `purpose`, `valueType`, `source`, aplicabilidade e proveniência canônicos permanecem preservados conforme sua função;
  - não criar allowlist nominal `fieldKey → IA/server`, `contextRole`, registry paralelo ou nova versão E20.2 apenas para essa separação.
- Gate 3 — interface lógica mínima:
  - `identities`;
  - `modelContext`;
  - `serverContext`;
  - nenhum quarto bloco;
  - nenhum segundo DTO de domínio entre E19.3 e E19.4.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho:
  - invocação server-side explícita para obter o pacote autorizado de uma LP legítima já configurada.
- Entrada:
  - LP em `draft`;
  - configuração concluída e vinculada pela E19.2;
  - plano e taxon efetivos;
  - resolução E10.8;
  - parametrização raiz E18.4.
- Processamento:
  - validar LP, configuração e gates vigentes;
  - reutilizar a resolução canônica da E10.8;
  - projetar somente o conjunto `end_customer` para matéria-prima da geração;
  - projetar fields concretos `applicable = true`, `source != missing` e já validados;
  - classificar o valor bruto por `valueType` entre contexto semântico e contexto server-side;
  - preservar metadados canônicos e proveniência;
  - projetar os limites editoriais mínimos da E18.4;
  - montar `identities + modelContext + serverContext`;
  - validar a saída e devolvê-la profundamente imutável.
- Validação:
  - falhar fechado para LP/configuração inválida, pesquisa `end_customer` indisponível ou inválida, catálogo/valores incompatíveis, fato obrigatório ausente ou outra inconsistência comprovável pelas autoridades responsáveis.
- Persistência:
  - nenhuma nova.
- Consumo:
  - a saída de sucesso é a única entrada de domínio da futura E19.4;
  - a E19.4 não deve reler E18.5 ou E20.3 para decidir narrativa, composição ou pesquisa.
- Fallback:
  - somente fallbacks já autorizados pelas fontes responsáveis;
  - sem heurística, mapa editorial, seleção por `itemKey`, default silencioso ou reconstrução de perfil.
- Observabilidade:
  - preservar somente logging seguro já autorizado no boundary;
  - não registrar pesquisa, valores concretos, PII, secrets, payloads ou prompts;
  - não criar SDK, destino externo, Log Drain ou infraestrutura nova.

### 2.2. Pesquisa autorizada

- A matéria-prima de pesquisa enviada à E19.4 é o conjunto `end_customer` resolvido pela E10.8.
- O conjunto inclui integralmente:
  - `strategic_core`;
  - `lp_overview`;
  - `lp_sections`;
  - `seo`;
  - todos os itens ativos integrantes do conjunto resolvido;
  - IDs, versões e proveniência já fornecidos pela E10.8.
- `business_buyer` continua podendo ser resolvido pela E10.8 para preservar seu contrato vigente, mas seus textos não integram a matéria-prima da LP `end_customer`.
- Essa exclusão decorre da fronteira objetiva de `audience_scope`; não constitui seleção editorial por pertinência.
- Não existe filtragem adicional por módulo, funil, CTA, `itemKey`, `copySourceMap`, fonte priorizada ou julgamento semântico da E19.3.
- Não criar `researchPath` novo nem nova identidade de pesquisa.

### 2.3. Fatos e regra de projeção

- Somente field concreto com `applicable = true`, `source != missing` e valor já validado pela jornada vigente pode integrar o pacote.
- O `valueType` determina a projeção do valor bruto.
- Valores brutos em `modelContext`:
  - `string`;
  - `enum`;
  - `string_list`;
  - `boolean`;
  - `number_range`;
  - `keyword_map`.
- Valores brutos em `serverContext`:
  - `phone`;
  - `email`;
  - `url`;
  - `asset_reference`;
  - `color_palette`.
- A regra classifica corretamente os 23 fields vigentes da E20.2 e não possui exceção material conhecida.
- Os metadados canônicos necessários permanecem preservados independentemente da projeção do valor bruto:
  - `fieldKey`;
  - `purpose`;
  - `valueType`;
  - `source` entre `authoritative` e `configuration`;
  - proveniência já produzida pelos contratos responsáveis.
- `missing` não integra o pacote como fato.
- `primary_conversion_channel` permanece semanticamente visível; o destino correspondente permanece somente em `serverContext`.
- `brand_logo_asset` e `brand_color_palette` permanecem com seus valores brutos em `serverContext`; qualquer projeção futura de mera disponibilidade para o provider pertence à E19.4.
- Se um futuro field não puder ser classificado corretamente pelos tipos vigentes, a evolução deve ocorrer no contrato E20.2; não criar exceção nominal na E19.3.

### 2.4. Projeção mínima da E18.4

- `modelContext` recebe somente o necessário à produção textual:
  - papéis semânticos aplicáveis;
  - faixa recomendada de texto por papel;
  - `absoluteMax`;
  - hierarquia semântica geral relevante à composição textual.
- Permanecem determinísticos e fora da matéria-prima textual:
  - `minViewportPx`;
  - viewports de evidência;
  - alvo interativo mínimo;
  - requisitos de foco;
  - contraste;
  - no-horizontal-scroll;
  - tipografia CSS concreta;
  - `maxPageWidth`;
  - `maxReadingWidth`;
  - tamanhos em `rem`;
  - detalhes de acessibilidade do renderer;
  - `density`, spacing e preset como escolha de apresentação.
- A E19.3 não cria uma segunda parametrização raiz nem duplica regras da E18.4.

### 2.5. Proveniência, fatos declarados e evidências

- Pesquisa reutiliza diretamente as identidades existentes da E10.8, incluindo quando disponíveis:
  - `itemId`;
  - `researchId`;
  - `itemKey`;
  - `researchBlock`;
  - `audienceScope`;
  - taxon servido e de origem;
  - relação de origem;
  - versão da pesquisa.
- Fato reutiliza:
  - `fieldKey`;
  - valor autorizado;
  - `source` da E19.2;
  - versão do catálogo;
  - proveniência existente.
- Não criar `fact_id`.
- A evidência documental da E20.2 justifica a existência do field no catálogo; ela não comprova a veracidade do valor concreto fornecido pela conta.
- Um valor declarado pode integrar `modelContext` sem se tornar prova verificada.
- `creci_registration` permanece visível como dado declarado, mas não equivale a CRECI oficialmente verificado.
- Evidência concreta somente acompanha o pacote quando uma fonte canônica já fornecer uma referência real e autorizada.
- Ausência de evidência permanece ausência; não criar `verified`, `evidence_id` ou outra marcação artificial para preencher desconhecimento.
- Testemunho, credencial verificada, resultado, garantia, escassez ou outra prova factual concreta não pode ser tratada como disponível sem suporte real correspondente.

### 2.6. Interface lógica de saída

- O sucesso contém exatamente três blocos lógicos.
- `identities` preserva:
  - versão do contrato E19.3;
  - identidade da conta;
  - identidade da LP;
  - plano efetivo;
  - taxon servido;
  - `catalogVersion` da configuração;
  - `configurationRevision` da E19.2;
  - `rootVersion` efetivamente resolvida da E18.4;
  - versão efetivamente usada pela pesquisa `end_customer`.
- `identities` não preserva:
  - `moduleCatalogVersion`;
  - `generationProfileId`;
  - `generationProfileVersion`;
  - variantes;
  - composição;
  - ordem;
  - recommendation IDs.
- `modelContext` preserva:
  - pesquisa `end_customer` completa;
  - fatos projetados pelos tipos semânticos;
  - metadados e proveniência desses fatos;
  - evidências concretas realmente disponíveis, quando existirem;
  - projeção editorial mínima da E18.4.
- `serverContext` preserva:
  - valores brutos de destinos operacionais;
  - `privacy_policy_url` quando aplicável;
  - `brand_logo_asset` quando existente;
  - `brand_color_palette`;
  - metadados canônicos necessários ao uso determinístico desses valores.
- `serverContext` significa que o valor bruto não é matéria-prima textual para a IA; a E19.4 recebe o pacote inteiro e pode usar esses valores deterministicamente.
- A E19.3 expõe um único resultado TypeScript discriminado entre sucesso completo e falha explícita.
- A saída possui versão própria de contrato e é profundamente imutável.
- A E19.4 consome essa saída diretamente, sem criar segundo pacote de domínio intermediário.
- Serialização específica para o provider pertence ao transporte da E19.4 e não constitui novo contrato de domínio.

### 2.7. Simplificação obrigatória

- Implementação esperada:
  - ler fontes canônicas;
  - validar;
  - projetar pesquisa, fatos e limites;
  - separar valor semântico de valor operacional;
  - montar saída tipada;
  - validar e devolver.
- Não criar:
  - `factIdentity`;
  - registry de fatos;
  - taxonomia geral de contexto;
  - `contextRole`;
  - `researchPath` novo;
  - allowlist nominal de fields;
  - DSL;
  - engine;
  - framework de claims;
  - mapa E18.5 ↔ E20.2;
  - perfil de funil substituto;
  - camada intermediária entre E19.3 e E19.4.
- Não criar nova versão E20.2 somente para classificar valores como IA/server.
- Não criar nova persistência, tabela, migration, rota, UI, API HTTP, Server Action ou infraestrutura.
- Crescimento motivado principalmente por extensibilidade sem consumidor atual é critério de parada e simplificação.

## 3. Fases e próxima ação

### 3.1. E19.3.3 — Pacote autorizado para geração no Cenário D

- Status: planejada para execução após o ciclo de aprovação do plano.
- Automação: não.
- Objetivo:
  - substituir a composição determinística anterior por um compilador de contexto autorizado que implemente integralmente o contrato da seção 2.
- Entregas:
  - manter a residência no boundary `lib/lp-builder/`;
  - substituir o contrato público anterior pelo pacote `identities + modelContext + serverContext` com versão própria;
  - retirar E18.5 e E20.3 do caminho canônico da compilação da E19.3;
  - remover da E19.3 seleção de módulos, variantes, ordem, `copySourceMap`, `prioritizedSources`, `funnelCopyProfiles`, `ctaMode`, `generationGuidance`, `itemGuidance` e gate de perfil ativo;
  - reutilizar a resolução E10.8 sem reimplementar herança ou integridade;
  - reutilizar a configuração resolvida E19.2 e o catálogo E20.2 sem segundo catálogo de binding;
  - projetar a E18.4 apenas no subconjunto definido neste plano;
  - preservar logging seguro já vigente sem nova infraestrutura;
  - exportar o único contrato público necessário à futura E19.4.
- Validação mínima:
  - configuração válida e vinculada produz pacote de sucesso;
  - `end_customer` completo chega sem filtro editorial;
  - `business_buyer` não entra na matéria-prima da LP `end_customer`;
  - os 23 fields vigentes são classificados corretamente pela regra de `valueType`;
  - `missing` não vira fato;
  - valores operacionais brutos não aparecem em `modelContext`;
  - `primary_conversion_channel` pode aparecer em `modelContext` sem expor o destino correspondente;
  - CRECI declarado não é marcado como prova verificada;
  - ausência de evidência concreta não produz referência artificial;
  - `identities` preserva `catalogVersion`, `configurationRevision`, `rootVersion`, versão E19.3 e versão da pesquisa;
  - nenhuma identidade de módulo ou perfil permanece no pacote;
  - falhas das autoridades canônicas resultam em falha explícita, sem pacote parcial;
  - resultado de sucesso é profundamente imutável;
  - não existe segundo DTO de domínio nem mapa paralelo.
- Regressões obrigatórias:
  - E10.8;
  - E18.4;
  - E20.2;
  - E19.2;
  - boundaries de autorização e vínculo já consumidos pela E19.3.
- Critério de primeira prova:
  - executar a nova compilação sobre o mesmo draft real usado na primeira LP e demonstrar, em modo sem OpenAI, que o pacote contém pesquisa `end_customer` completa, fatos concretos válidos e separados corretamente entre `modelContext` e `serverContext`, sem composição prévia.
- Fechamento documental:
  - aplicar o Prompt ABC apenas aos documentos canônicos materialmente afetados pela implementação;
  - `docs/roadmap.md` deve refletir somente o estado realmente implementado.

### 3.2. Próxima ação

- Submeter este plano-base v1 ao fluxo previsto em `docs/prompt-estrategista.md`.
- Antes de qualquer implementação, escolher humanamente entre processo atual e processo automatizado.
- No processo atual, seguir a avaliação única do plano pelos especialistas previstos no Prompt Estrategista e consolidar a v2 antes da execução.
- No processo automatizado, após o merge da v1, usar o orquestrador previsto pelo Prompt Estrategista.
- Não iniciar o debate detalhado da E19.4 nem implementar a E19.3 antes da escolha e dos gates correspondentes.

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
- alteração de E10.8, E18.4, E20.2 ou E19.2 sem gap real demonstrado durante a execução;
- banco, migration, tabela, view, RPC, trigger, RLS, policy ou nova persistência;
- rota, UI, editor, Provider, agente, automação, job, fila, cron, webhook ou nova infraestrutura;
- tracking, Analytics, CRM, domínio, publicação, A/B test, Ads ou integrações futuras;
- regra específica da conta piloto ou de um nicho dentro da E19.3;
- novo contrato estrutural da candidata, que pertence à E19.4;
- limpeza ou aposentadoria definitiva da E18.5/E20.3, que pertence ao recorte condicional posterior à prova do Cenário D.

### 4.2. Critérios de parada

- Parar se a regra de projeção IA/server exigir mapa nominal crescente dentro da E19.3; devolver ao Estrategista para localizar a regra no contrato responsável ou simplificar.
- Parar se for necessário inventar evidência, prova, claim verificado ou semântica não sustentada pelas fontes.
- Parar se surgir filtro editorial de pesquisa, seleção de módulo, variante, ordem, narrativa ou layout.
- Parar se faltar fonte canônica indispensável para validar um fato, pesquisa, limite ou binding.
- Parar se surgir necessidade de banco, rota, job, agente, automação, engine ou infraestrutura nova não autorizada por fonte real do projeto.
- Parar e simplificar se a maior parte do crescimento técnico vier de generalizações para consumidores futuros inexistentes.
- Toda ampliação material de escopo volta ao humano; não é autorizada implicitamente por este plano-base v1.

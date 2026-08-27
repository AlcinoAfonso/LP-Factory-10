27/08/2026 — Rascunho vivo — E21.4 — Visibilidade financeira e atribuição de custos OpenAI

Status: rascunho vivo em debate; ainda não consolidado como plano-base v1.

## 1. Estado e decisões já aceitas

### 1.1. Recorte

- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.4 — Visibilidade financeira e atribuição de custos OpenAI`.
- Prioridade: imediata, antes da retomada da E21.3.4.
- Base de abertura: `main@a5d86c6f4d693574817e4dd65b0ec32ef87601c8`, após o merge do PR #823.
- Plano conceitual: N/A neste estágio.

### 1.2. Problema de negócio

- A LP Factory ainda não oferece uma visão financeira operacional suficiente para responder, com confiança, quanto a OpenAI está custando ao negócio.
- A prioridade humana atual é conhecer:
  - gasto total OpenAI em um período;
  - parcela economicamente atribuível aos clientes e parcela própria da LP Factory;
  - gasto atribuível a cada cliente/conta;
  - gasto atribuível a cada Landing Page gerada;
  - decomposição útil por workload e, quando fizer sentido, por modelo/configuração;
  - saldo ou créditos disponíveis na OpenAI, quando existir fonte oficial e tecnicamente utilizável para essa informação;
  - parcela não atribuída necessária para reconciliar o gasto oficial com a classificação interna.
- A finalidade é permitir gestão de margem, precificação e decisão de otimização antes de aprofundar comparações experimentais da E21.3.

### 1.3. Limites já aceitos

- Não renumerar nem substituir a E21.3; a E21.4 é um recorte novo e prioritário.
- A implementação experimental do PR #819 permanece apenas como referência histórica e não integra a `main`.
- Não definir ainda banco, tabela, API, rota, job, automação, serviço, nova credencial ou desenho de persistência.
- Não prometer atribuição retroativa por cliente/LP sem demonstrar que os dados históricos existentes permitem isso com confiabilidade.
- Não confundir custo oficial cobrado pela OpenAI com custo interno atribuído a cliente/LP; eventual diferença deve permanecer visível e explicável.
- Não confundir custo economicamente atribuído a um cliente com valor cobrado separadamente desse cliente; política comercial, franquia, limite, markup ou repasse permanecem fora do recorte atual.

### 1.4. Regra de atribuição econômica aceita

- A primeira classificação interna do gasto deve responder **quem originou economicamente o custo**, antes de tentar chegar a cliente, LP ou workload.
- Categorias canônicas de classificação:
  - **LP Factory:** aquisição/pré-venda, usuário ainda não contratado, desenvolvimento, Preview, QA, testes, comparações experimentais, operação interna, preparação compartilhada e demais consumos que beneficiem a plataforma de forma geral ou não sejam causados por um cliente contratado identificável;
  - **Cliente/conta:** consumo causado por ação, necessidade ou atendimento identificável de um cliente contratado, ainda que o valor esteja incluído no plano e não seja cobrado separadamente;
  - **Não atribuído:** estado de reconciliação usado somente quando o gasto oficial existe, mas a origem econômica ainda não pode ser provada com segurança.
- Dentro de **Cliente/conta**, a atribuição deve avançar, quando houver evidência suficiente, para:
  - Landing Page específica;
  - workload específico;
  - outros consumos da conta que não pertençam a uma Landing Page.
- Regra causal para suporte por IA:
  - suporte ou ajuda de IA antes da contratação é custo da LP Factory;
  - suporte ou ajuda de IA acionado por cliente contratado é custo atribuível à conta desse cliente;
  - uso de IA pela equipe para resolver caso específico de cliente pode ser atribuído à conta quando a relação causal for demonstrável;
  - uso de IA para documentação, melhoria ou suporte compartilhado por vários clientes permanece custo da LP Factory.
- A classificação técnica existente `product_runtime` versus `operational` não substitui essa dimensão econômica e não deve determinar automaticamente `Cliente/conta` versus `LP Factory`.
- O próprio workload também não basta para definir a responsabilidade econômica: `landing_page_draft_generation` e `landing_page_draft_image_generation` são custo de cliente quando executados causalmente para uma LP real de conta contratada, mas são custo da LP Factory quando executados como Preview, QA, prova administrativa ou teste.

### 1.5. Período, atualização e moeda aceitos para o MVP

- A visão financeira deve abrir por padrão no **mês atual**.
- Deve permitir **período personalizado** como segunda opção do MVP.
- A atualização inicial será **sob demanda**, acionada pelo humano quando precisar consultar os dados.
- Não há atualização recorrente, sincronização periódica ou automação de coleta aprovada neste estágio.
- A moeda financeira do MVP será exclusivamente **USD (US$)**, preservando o valor oficial da OpenAI sem conversão cambial.
- Conversão para BRL, cotação, spread, IOF ou qualquer outra composição em reais ficam fora do MVP e poderão ser avaliados posteriormente em recorte próprio ou evolução compatível.

### 1.6. Usage, custo e créditos aceitos para o MVP

- O MVP deve preservar duas réguas complementares:
  - **usage técnico**, usando tokens e demais unidades oficiais aplicáveis a cada modalidade;
  - **custo financeiro em USD**, confrontado com o custo oficial reportado pela OpenAI no período.
- A soma dos custos internamente atribuídos deve ser reconciliada com o gasto oficial da OpenAI; diferenças permanecem visíveis como **Não atribuído/reconciliação**, sem ajuste artificial.
- O ideal é também reconciliar o saldo/crédito acompanhado internamente pela LP Factory com o saldo/crédito oficial disponível na OpenAI, expondo eventual diferença quando ambas as fontes forem confiáveis.
- A conciliação automática de saldo/créditos é **condicionada** à existência de fonte oficial programática adequada na OpenAI.
- Se essa fonte oficial não puder ser confirmada, a ausência de conciliação automática de saldo/créditos **não bloqueia o MVP da E21.4**; gasto, usage e atribuição devem avançar normalmente.
- Não inferir silenciosamente saldo oficial apenas por `créditos adquiridos - custo calculado`, porque ajustes, recargas, créditos promocionais ou defasagem de processamento podem produzir diferença.

## 2. Fatos preliminares e contrato em debate

### 2.1. Fontes do projeto já consultadas

- `README.md` — visão do MVP, simplicidade proporcional e evolução por benefício mensurável.
- `docs/roadmap.md` — prioridade e objetivo inicial da E21.4.
- `docs/prompt-estrategista.md` — fluxo de rascunho vivo até plano-base v1.
- `docs/template-roadmap.md` — hierarquia do recorte.
- `docs/platform-config.md` — configuração operacional vigente da OpenAI e secrets por nome.
- `lib/openai-workloads/contracts.ts`, `lib/openai-workloads/observability.ts` e `lib/openai-workloads/registry.ts` — usage, observabilidade e classificação técnica atuais dos workloads.
- `lib/lp-builder/generationContextContracts.ts`, `lib/lp-builder/landingPageDraftGeneration.ts`, `lib/lp-builder/landingPageDraftImageGeneration.ts`, `lib/lp-builder/landingPageRevision.ts` e `lib/lp-builder/adapters/landingPageRevisionAdapter.ts` — autoridade e evidências atuais da geração de Landing Page.
- `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`, `lib/conversion-content/commercial-activation/draft-generation.ts` e `lib/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter.ts` — contexto causal dos demais workloads de produto atuais.

### 2.2. Fatos oficiais OpenAI confirmados até aqui

- A OpenAI expõe `GET /organization/costs` para custos da organização por período. A API aceita agrupamento por `project_id`, `line_item` e `api_key_id` e usa Admin API Key (`OPENAI_ADMIN_KEY`).
- A OpenAI expõe APIs de usage por modalidade. Completions pode ser agrupado por `project_id`, `user_id`, `api_key_id`, `model`, `batch` e `service_tier`; images expõe número de imagens e requisições e pode ser agrupado por `project_id`, `user_id`, `api_key_id`, `model`, `size` e `source`.
- A documentação oficial de billing pré-pago confirma que o saldo de créditos existe e é exibido no Billing da plataforma, mas até este ponto do debate não foi confirmada uma API pública oficial equivalente ao Costs API para consultar programaticamente o saldo disponível.
- Fontes oficiais consultadas:
  - `https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/usage/methods/costs`
  - `https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/usage/methods/completions`
  - `https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/usage/methods/images`
  - `https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/admin_api_keys`
  - `https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing`

### 2.3. Fatos atuais do LP Factory

- `docs/platform-config.md` registra `OPENAI_API_KEY` compartilhada pelos consumidores OpenAI autorizados do Core em Preview e Production.
- Não existe `OPENAI_ADMIN_KEY` registrada atualmente em `docs/platform-config.md`.
- A conexão OpenAI Platform disponível no chat cria chaves de projeto, mas não oferece criação de Admin API Key; portanto, eventual `OPENAI_ADMIN_KEY` exigida pela E21.4 dependerá de decisão e setup próprios posteriores.
- A observabilidade textual atual registra workload, modelo, reasoning effort, ambiente, revisão, request/attempt IDs, tokens, latência e metadados seguros de provider.
- O contrato transversal atual de evento OpenAI não inclui `accountId` nem `landingPageId` como dimensões de atribuição financeira.
- O registry atual demonstra que nem todo workload possui a mesma natureza econômica: há geração de Landing Page, onboarding/resolução de nicho, avaliação administrativa por taxon e workload operacional separado do Core.
- A geração de Landing Page já recebe contexto autorizado v4 com `accountId` e `landingPage.id`; portanto, nesses workloads a origem cliente/LP existe no ponto de execução e não precisa ser inferida por heurística.
- Quando uma geração de LP é materializada com sucesso, o snapshot vigente preserva `accountId`, `landingPage.id`, `attemptId`, `requestId`, configuração dos workloads, usage textual e identificador da requisição de imagem. Os custos permanecem `unavailable` no snapshot atual.
- A materialização só cobre a geração que chegou ao estado persistido. Tentativas que consumiram OpenAI e falharam antes da materialização podem gerar custo sem deixar a mesma evidência histórica por cliente/LP.
- Consequentemente, o histórico atual pode permitir **atribuição parcial** de algumas gerações de LP bem-sucedidas, especialmente usage textual, mas não demonstra cobertura financeira completa de imagens, falhas e demais workloads.
- Mapa econômico preliminar dos workloads atuais:
  - `niche_resolution`: LP Factory no fluxo atual de onboarding/pré-contrato;
  - `commercial_activation_draft_generation`: LP Factory, por gerar conteúdo comercial administrativo por taxon;
  - `taxon_input_catalog_sufficiency_evaluation`: LP Factory, por avaliar preparação compartilhada por taxon;
  - `supabase_inspect`: LP Factory, por ser workload operacional separado do Core;
  - `landing_page_draft_generation` e `landing_page_draft_image_generation`: Cliente/conta quando executados para LP real contratada; LP Factory quando usados para desenvolvimento, Preview, QA, prova ou teste.
- Portanto, os dados oficiais da OpenAI, isoladamente, conseguem sustentar totalização/reconciliação por organização/projeto/chave/linha de custo, mas não demonstram por si só qual cliente, LP ou categoria econômica originou cada parcela do custo.

### 2.4. Conceitos que precisam permanecer distintos

- **Gasto oficial OpenAI:** valor financeiro reportado pela fonte oficial de custos da organização.
- **Usage OpenAI:** tokens, imagens e demais unidades de consumo reportadas pela OpenAI ou pelo runtime.
- **Responsabilidade econômica:** classificação interna entre LP Factory, cliente/conta ou não atribuído, baseada na origem causal do consumo.
- **Custo atribuído internamente:** parcela do gasto associada com evidência suficiente à categoria econômica e, quando aplicável, a cliente/conta, LP e workload.
- **Não atribuído/reconciliação:** diferença entre gasto oficial e soma dos custos internamente atribuídos, quando houver; não constitui uma terceira categoria econômica permanente.
- **Saldo/créditos:** informação de billing separada de gasto e usage; idealmente reconciliada com o acompanhamento interno, mas não bloqueante se não houver fonte oficial programática adequada.
- **Cobrança ao cliente:** decisão comercial distinta da atribuição econômica e fora do recorte atual.

## 3. Questões abertas para decisão humana e investigação

### 3.1. Entrega mínima prioritária

- Confirmar a primeira hierarquia da visão financeira:
  - gasto total OpenAI;
  - LP Factory;
  - clientes;
  - não atribuído/reconciliação;
  - dentro de clientes: conta → Landing Page ou outros consumos da conta → workload.
- Definir a apresentação conjunta de usage técnico e custo oficial em USD sem confundir grandezas diferentes nem criar falsa precisão.
- Saldo/créditos deixa de ser gate do MVP: deve ser conciliado quando houver fonte oficial programática confiável e, se não houver, a limitação deve ser explícita.

### 3.2. Atribuição por cliente e Landing Page

- A atribuição de LP real já possui autoridade causal de `accountId` e `landingPageId` no contexto vigente; a v2 deve definir apenas a menor forma persistente de carregar essa evidência para a visão financeira.
- Tratar qualquer reconstrução histórica apenas com o grau de cobertura factual realmente demonstrado; histórico parcial não pode ser apresentado como custo completo do cliente ou da LP.
- Definir na v2 a menor evidência persistente suficiente para capturar também tentativas pagas que falhem antes da materialização, sem antecipar neste rascunho banco, tabela ou mecanismo específico.
- Determinar como registrar consumos futuros de cliente que não pertençam a uma LP específica e preservar custos próprios da LP Factory sem rateio artificial entre clientes.

### 3.3. Fonte oficial e reconciliação

- Confirmar empiricamente o comportamento do Costs API e das APIs de Usage para a organização real antes de definir contrato de leitura.
- Confirmar se o projeto OpenAI e/ou API key atuais permitem separação útil entre Core, testes, Preview, Production e outros consumidores.
- Investigar saldo/créditos sem assumir endpoint não documentado; ausência de endpoint oficial adequado não bloqueia a primeira entrega.
- A E21.4 provavelmente exigirá Admin API Key para a leitura oficial de Costs/Usage; a decisão final sobre essa credencial, seu escopo e setup permanece para o fechamento da v1/v2 após validação dos especialistas.

### 3.4. UX e operação

- Definir se a visibilidade financeira pertence a uma nova superfície administrativa ou a uma área administrativa já existente; nenhuma rota está autorizada neste rascunho.
- A atualização sob demanda está aceita para o MVP; qualquer hipótese futura de atualização recorrente exigirá nova avaliação de automação.
- Definir como comunicar valores oficiais, atribuídos, estimados, não atribuídos ou indisponíveis sem induzir falsa precisão.

## 4. Escopo negativo e próxima ação

### 4.1. Escopo negativo neste estágio

- Não implementar agora cálculo de margem, preço de plano, cobrança ao cliente ou repasse de custo.
- Não retomar E21.3.4 enquanto a E21.4 prioritária não estiver executada conforme decisão posterior.
- Não criar infraestrutura apenas para obter um número que a OpenAI já forneça oficialmente.
- Não usar preço tabelado local como substituto silencioso do gasto oficial quando houver fonte oficial de custo.
- Não armazenar secret bruto em documento, banco, client ou log.
- Não ratear custos próprios da LP Factory entre clientes apenas para eliminar a categoria `LP Factory` ou o saldo `Não atribuído`.
- Não introduzir conversão para BRL, cotação cambial, spread ou IOF no MVP.
- Não bloquear o MVP pela ausência de leitura automática de saldo/créditos, desde que essa limitação seja explicitada.
- Não apresentar reconstrução histórica parcial como se fosse cobertura integral do custo.

### 4.2. Próxima ação do debate

- Confirmar com o humano a hierarquia final da UX, o acesso administrativo e a residência da visão financeira.
- Confirmar a forma de apresentar usage e custo em USD com reconciliação explícita.
- Confirmar empiricamente as fontes oficiais da organização real antes de consolidar o plano-base v1.
- Antes da v1, classificar `Automação: sim | não` para as fases propostas; no MVP atual, a atualização sob demanda não implica automação recorrente.
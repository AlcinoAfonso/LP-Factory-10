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
  - gasto atribuível a cada cliente/conta;
  - gasto atribuível a cada Landing Page gerada;
  - decomposição útil por workload e, quando fizer sentido, por modelo/configuração;
  - saldo ou créditos disponíveis na OpenAI, somente se existir fonte oficial e tecnicamente utilizável para essa informação.
- A finalidade é permitir gestão de margem, precificação e decisão de otimização antes de aprofundar comparações experimentais da E21.3.

### 1.3. Limites já aceitos

- Não renumerar nem substituir a E21.3; a E21.4 é um recorte novo e prioritário.
- A implementação experimental do PR #819 permanece apenas como referência histórica e não integra a `main`.
- Não definir ainda banco, tabela, API, rota, job, automação, serviço, nova credencial ou desenho de persistência.
- Não prometer atribuição retroativa por cliente/LP sem demonstrar que os dados históricos existentes permitem isso com confiabilidade.
- Não confundir custo oficial cobrado pela OpenAI com custo interno atribuído a cliente/LP; eventual diferença deve permanecer visível e explicável.

## 2. Fatos preliminares e contrato em debate

### 2.1. Fontes do projeto já consultadas

- `README.md` — visão do MVP, simplicidade proporcional e evolução por benefício mensurável.
- `docs/roadmap.md` — prioridade e objetivo inicial da E21.4.
- `docs/prompt-estrategista.md` — fluxo de rascunho vivo até plano-base v1.
- `docs/template-roadmap.md` — hierarquia do recorte.
- `docs/platform-config.md` — configuração operacional vigente da OpenAI e secrets por nome.
- `lib/openai-workloads/contracts.ts` e `lib/openai-workloads/observability.ts` — usage e observabilidade atuais dos workloads.

### 2.2. Fatos oficiais OpenAI confirmados até aqui

- A OpenAI expõe `GET /organization/costs` para custos da organização por período. A API aceita agrupamento por `project_id`, `line_item` e `api_key_id` e usa Admin API Key (`OPENAI_ADMIN_KEY`).
- A OpenAI expõe APIs de usage por modalidade, incluindo completions e images. Em completions, o usage pode ser agrupado por `project_id`, `user_id`, `api_key_id`, `model`, `batch` e `service_tier`.
- A documentação oficial de billing pré-pago confirma que o saldo de créditos existe e é exibido no Billing da plataforma, mas até este ponto do debate não foi confirmada uma API pública oficial equivalente ao Costs API para consultar programaticamente o saldo disponível.
- Fontes oficiais consultadas:
  - `https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/usage/methods/costs`
  - `https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/usage/methods/completions`
  - `https://developers.openai.com/api/reference/python/resources/admin/subresources/organization/subresources/admin_api_keys`
  - `https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing`

### 2.3. Fatos atuais do LP Factory

- `docs/platform-config.md` registra `OPENAI_API_KEY` compartilhada pelos consumidores OpenAI autorizados do Core em Preview e Production.
- Não existe `OPENAI_ADMIN_KEY` registrada atualmente em `docs/platform-config.md`.
- A observabilidade textual atual registra workload, modelo, reasoning effort, ambiente, revisão, request/attempt IDs, tokens, latência e metadados seguros de provider.
- O contrato transversal atual de evento OpenAI não inclui `accountId` nem `landingPageId` como dimensões de atribuição financeira.
- Portanto, os dados oficiais da OpenAI, isoladamente, conseguem sustentar totalização/reconciliação por organização/projeto/chave/linha de custo, mas não demonstram por si só qual cliente ou LP originou cada parcela do custo.

### 2.4. Conceitos que precisam permanecer distintos

- **Gasto oficial OpenAI:** valor financeiro reportado pela fonte oficial de custos da organização.
- **Usage OpenAI:** tokens, imagens e demais unidades de consumo reportadas pela OpenAI ou pelo runtime.
- **Custo atribuído internamente:** parcela do gasto associada com evidência suficiente a cliente/conta, LP e workload.
- **Não atribuído/reconciliação:** diferença entre gasto oficial e soma dos custos internamente atribuídos, quando houver.
- **Saldo/créditos:** informação de billing separada de gasto e usage; somente entra na solução se houver fonte oficial adequada ou se a UX puder declarar explicitamente sua indisponibilidade programática.

## 3. Questões abertas para decisão humana e investigação

### 3.1. Entrega mínima prioritária

- Definir qual é a primeira visão que precisa estar disponível para o humano:
  - total do período;
  - total por cliente/conta;
  - total por LP;
  - detalhamento por workload;
  - saldo/créditos;
  - reconciliação entre total oficial e total atribuído.
- Definir quais períodos precisam ser suportados no MVP: hoje, mês corrente, período customizado ou outro conjunto mínimo.

### 3.2. Atribuição por cliente e Landing Page

- Investigar quais chamadas OpenAI atuais possuem, no ponto de execução, autoridade suficiente para associar com segurança `accountId`, `landingPageId` e workload.
- Determinar se alguma atribuição histórica confiável é possível com dados já existentes ou se a atribuição por cliente/LP será necessariamente prospectiva a partir da E21.4.
- Determinar como tratar workloads não associados a uma LP específica e custos operacionais que não pertencem a um cliente.

### 3.3. Fonte oficial e reconciliação

- Confirmar empiricamente o comportamento do Costs API e das APIs de Usage para a organização real antes de definir contrato de leitura.
- Confirmar se o projeto OpenAI e/ou API key atuais permitem separação útil entre Core, testes, Preview, Production e outros consumidores.
- Investigar saldo/créditos sem assumir endpoint não documentado.
- Decidir se a E21.4 exige uma Admin API Key dedicada e, se sim, somente depois definir plataforma, escopo e regra de segurança dessa credencial.

### 3.4. UX e operação

- Definir se a visibilidade financeira pertence a uma nova superfície administrativa ou a uma área administrativa já existente; nenhuma rota está autorizada neste rascunho.
- Definir o nível de atualização necessário: sob demanda, periódico ou outro. Automação permanece em aberto e deverá ser avaliada antes da consolidação da v1 caso exista hipótese concreta de execução recorrente.
- Definir como comunicar valores oficiais, atribuídos, estimados, não atribuídos ou indisponíveis sem induzir falsa precisão.

## 4. Escopo negativo e próxima ação

### 4.1. Escopo negativo neste estágio

- Não implementar agora cálculo de margem, preço de plano, cobrança ao cliente ou repasse de custo.
- Não retomar E21.3.4 enquanto a E21.4 prioritária não estiver executada conforme decisão posterior.
- Não criar infraestrutura apenas para obter um número que a OpenAI já forneça oficialmente.
- Não usar preço tabelado local como substituto silencioso do gasto oficial quando houver fonte oficial de custo.
- Não armazenar secret bruto em documento, banco, client ou log.

### 4.2. Próxima ação do debate

- Fechar com o humano a experiência mínima necessária e a ordem das informações na visão financeira.
- Em seguida, investigar a atribuição técnica por cliente/LP e a fonte real de billing da organização antes de consolidar o plano-base v1.
- Antes da v1, classificar `Automação: sim | não` para as fases propostas e consultar o Gestor de Automação se houver hipótese concreta de atualização recorrente.

# Plano-base E10.8 — Resolução de pesquisas estruturadas para landing_page

- Versão: v1
- Data: 14/07/2026
- Status: plano-base v1 para avaliação única dos especialistas
- Recorte do roadmap: `10.8 — Resolução de pesquisas estruturadas para landing_page`
- Path canônico: `docs/lousa-plano-base-e10-8.md`
- Fontes obrigatórias: `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `supabase/snippets/e10_5_5_nicho_carregamento.sql`, implementação e documentação atuais da E10.5.5, E10.5.6 e E10.7.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A E10.5.5 registra pesquisas e itens por taxon, bloco, público e versão, mas não resolve herança para `landing_page`.
- A E10.5.6 permanece responsável por resolver e registrar o taxon oficial da conta.
- A E10.7 permanece responsável por `commercial_activation`, exige pesquisas próprias no mesmo taxon e mantém seu contrato de `version = 1`.
- A E10.8 deve produzir, por leitura, um conjunto único, completo, determinístico e rastreável para `landing_page`, sem modificar os registros de origem.
- Consumidores previstos: E20, na preparação e prontidão do taxon, e E19, na geração futura da LP real por conta.

### 1.2. Estado real confirmado

- Estruturas existentes suficientes para a hipótese principal: `business_taxons.parent_id`, `taxon_market_research` e `taxon_market_research_items`.
- As pesquisas-pai já preservam `taxon_id`, `research_block`, `audience_scope`, `version` e `status`; os itens preservam o vínculo por `research_id`.
- A leitura server-side atual já possui acesso `service_role` às estruturas necessárias.
- Inspeção read-only de 14/07/2026 confirmou no taxon `corretor-de-imoveis-de-medio-padrao` quatro blocos ativos próprios para `business_buyer` com 49 itens ativos e quatro blocos ativos próprios para `end_customer` com 74 itens ativos.
- A mesma inspeção confirmou no pai direto `corretor-imoveis` quatro blocos ativos para `business_buyer` com 54 itens ativos, permitindo validar que o conjunto próprio deve vencer mesmo quando o pai também é elegível.
- Não foi demonstrada necessidade de tabela, campo, view, RPC, rota, cache ou persistência nova.

### 1.3. Decisões fixas do debate

- Entrada pública do resolver: `taxon_id` do taxon atendido, já resolvido pelo fluxo responsável.
- A E10.8 não recebe `account_id` e não repete classificação de conta ou resolução de nicho.
- `end_customer` é resolvido exclusivamente no taxon atendido.
- `business_buyer` usa o conjunto próprio completo e elegível; somente quando esse conjunto não for elegível pode usar o conjunto inteiro do pai direto.
- A herança nunca ocorre bloco por bloco e nunca alcança avô ou outro ancestral.
- Cada público usa uma única versão comum aos seus quatro blocos; as versões de `end_customer` e `business_buyer` podem ser diferentes.
- A hipótese principal é um boundary server-side tipado, sem persistência nova.
- E20 e E19 não serão alteradas por este plano.
- Automação, agente, job ou rotina recorrente não se aplicam ao recorte.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho: E20 ou E19 solicita o conjunto resolvido para um taxon atendido.
- Entrada: `taxon_id` já resolvido pelo fluxo responsável.
- Processamento:
  - validar o taxon atendido e identificar o pai direto;
  - resolver o conjunto `end_customer` próprio;
  - avaliar o conjunto `business_buyer` próprio;
  - somente se o conjunto próprio não for elegível e existir pai direto ativo, avaliar o conjunto inteiro no pai;
  - consolidar pesquisas, itens e proveniência sem modificar as fontes.
- Validação: aplicar elegibilidade, atomicidade, precedência, integridade estrutural e matriz de casos deste contrato.
- Persistência: nenhuma na E10.8.
- Consumo: devolver sucesso tipado para E20 ou E19, sem implementar esses consumidores.
- Fallback: devolver falha tipada e fechada; não misturar fontes, não usar outro ancestral e não recorrer à E10.7.

### 2.2. Elegibilidade e atomicidade

- O taxon atendido deve existir e estar ativo.
- Os blocos obrigatórios são exatamente `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
- Cada bloco deve possuir uma pesquisa-pai com `status = active`.
- As quatro pesquisas-pai de um conjunto devem compartilhar o mesmo `taxon_id`, `audience_scope` e `version`.
- Deve existir uma única versão ativa, completa e elegível para o público e o taxon de origem avaliados.
- Ausência de versão completa ou mais de um conjunto completo elegível resulta em falha fechada.
- Cada bloco deve possuir pelo menos um item ativo.
- Todo item ativo consumido deve respeitar o contrato estrutural existente: `item_key` e `item_text` preenchidos, `priority` e `sort_order` válidos e vínculo com a pesquisa-pai resolvida.
- Item ativo estruturalmente inválido bloqueia o conjunto; item inativo não é consumido.
- Repetição de `item_key` não é, isoladamente, erro, pois o fluxo da E10.5.5 admite múltiplos itens para a mesma chave.
- Ambiguidade estrutural de pesquisa-pai, fonte ou versão bloqueia; não criar critério editorial, semântico ou quantidade mínima arbitrária por bloco.
- Blocos ativos fora dos quatro obrigatórios permanecem fora do resultado da E10.8 e não alteram este contrato.

### 2.3. Precedência por audience_scope

- `end_customer`:
  - avaliar somente o taxon atendido;
  - ausência, incompletude, invalidade ou ambiguidade resulta em falha fechada;
  - não usar pai direto como fallback.
- `business_buyer`:
  - conjunto próprio elegível vence sempre;
  - conjunto próprio inexistente, incompleto, inválido ou ambíguo não pode ser parcialmente aproveitado;
  - somente se não houver conjunto próprio elegível, avaliar o pai direto ativo;
  - pai ausente, inativo ou sem conjunto completo e elegível resulta em falha fechada;
  - nunca combinar blocos próprios com blocos do pai.

### 2.4. Resultado, proveniência e determinismo

- O sucesso tipado deve preservar, no mínimo:
  - taxon atendido;
  - taxon de origem de cada público;
  - relação `own` ou `direct_parent` do `business_buyer`;
  - `research_id`, `research_block`, `audience_scope` e `version` de cada pesquisa-pai;
  - itens ativos efetivamente entregues e seus campos estruturais;
  - versões efetivamente usadas em cada público.
- O resultado deve ordenar pesquisas e itens de forma determinística, respeitando os campos existentes e adotando desempate estável quando necessário.
- A falha tipada deve diferenciar causa suficiente para diagnóstico seguro, sem introduzir fallback silencioso; os nomes exatos dos códigos pertencem à implementação.
- O resolver não cria snapshot. A futura persistência de snapshot pertence ao consumidor autorizado e ao plano próprio.
- Logs, quando necessários, devem conter apenas metadados operacionais seguros, sem conteúdo integral das pesquisas, PII ou secrets.

### 2.5. Contrato de consumo e limites

- E20 deve poder consumir a resolução pronta sem reimplementar precedência ou herança de pesquisas.
- E19 deve poder consumir a resolução pronta após obter o taxon oficial da conta pelo contrato preservado da E10.5.6.
- O resultado deve permitir que esses consumidores futuros falhem fechado, mas este plano não implementa gates, prontidão, geração, snapshots ou alterações em E20 e E19.
- A E10.7 não será importada, alterada ou usada como fallback.
- O boundary de pesquisa para `landing_page` deve permanecer separado das APIs de parametrização raiz da E18.4 já existentes no mesmo domínio.

### 2.6. Matriz mínima de validação

- Próprio e pai completos: escolher `business_buyer` próprio.
- Próprio inexistente e pai completo: escolher pai direto.
- Próprio incompleto e pai completo: escolher pai direto, sem aproveitar blocos próprios.
- Próprio completo e pai incompleto: escolher próprio.
- `end_customer` ausente, incompleto, inválido ou ambíguo no taxon atendido: falhar.
- Pai ausente ou taxon sem `parent_id`, quando o próprio não for elegível: falhar.
- Pai inativo ou sem conjunto elegível: falhar.
- Blocos ativos divididos entre versões: falhar.
- Mais de uma versão completa elegível: falhar.
- Item ativo estruturalmente inválido: falhar.
- Erro de leitura ou retorno não normalizável: falhar.
- Nenhum caso pode misturar taxons, públicos, versões ou pesquisas-pai.

## 3. Fases e próxima ação

### 3.1. E10.8.3–10.8.5 — Resolver server-side completo para landing_page

- Status: planejada.
- Objetivo: implementar o resolver compartilhado de elegibilidade, precedência, proveniência, falha fechada e consumo tipado definido na seção 2.
- Automação: não.
- Escopo executável:
  - confirmar, durante a investigação mínima do Executor, o boundary e os paths canônicos na implementação atual;
  - implementar contrato tipado, decisão determinística e leitura server-side das estruturas existentes;
  - manter separação explícita das APIs de parametrização raiz da E18.4;
  - expor somente o contrato mínimo necessário aos consumidores futuros;
  - criar casos executáveis focados na matriz da seção 2.6, seguindo o padrão repo-only já usado pelo projeto;
  - validar o caso real em que taxon próprio e pai são elegíveis, comprovando precedência do próprio;
  - executar `npm ci`, `npm run check` e a validação focada criada para o resolver;
  - registrar neste plano a evidência, a decisão e a próxima ação da fase.
- Artefatos mínimos esperados, com paths exatos a confirmar contra o repositório:
  - boundary server-side de leitura;
  - contrato e lógica determinística compartilhados;
  - export mínimo para consumo futuro;
  - casos executáveis de validação;
  - script de validação somente se necessário para executar os casos de forma canônica.
- Critérios de aceite:
  - matriz da seção 2.6 aprovada;
  - dados reais confirmam que o conjunto próprio vence o pai elegível;
  - saída preserva dados e proveniência mínimos;
  - falhas são tipadas e fechadas;
  - nenhuma mistura parcial ocorre;
  - nenhum registro de pesquisa existente é criado, editado, arquivado ou excluído;
  - nenhuma estrutura de banco, rota, UI, E10.7, E20 ou E19 é alterada;
  - diff limitado aos artefatos mínimos do resolver e a este plano-base.
- Próxima ação após aprovação do plano-base v2: enviar o plano completo ao Executor, indicando esta fase como a única fase autorizada para execução.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Criação, edição, ativação, arquivamento ou exclusão de pesquisas e itens.
- Alteração da taxonomia ou do taxon oficial da conta.
- Alteração do fluxo concluído da E10.5.5, do contrato da E10.5.6 ou da E10.7.
- Catálogo de entradas, parametrização, composição, prontidão, liberação, geração de LP, snapshot ou tracking.
- Implementação de consumidores em E20, E19 ou E12.
- UI administrativa, rota, API pública ou ação de usuário.
- Tabela, campo, view, RPC, migration, policy, grant, cache ou persistência nova.
- IA, automação, agente, job, workflow ou infraestrutura nova.
- Critério editorial ou quantidade mínima de itens sem fonte aprovada.
- Alteração automática de `docs/roadmap.md`, `docs/base-tecnica.md` ou `docs/schema.md` durante a criação deste plano-base.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se o estado real divergir materialmente de `docs/schema.md` ou das estruturas investigadas.
- Parar se a solução server-side sem banco novo não puder garantir precedência, atomicidade, proveniência e fail-closed.
- Parar antes de propor view, RPC, tabela, campo, migration, rota, cache ou persistência; qualquer necessidade deve ser demonstrada e decidida pelo Estrategista.
- Parar se o boundary mínimo exigir alterar as APIs de parametrização raiz da E18.4, a E10.7 ou algum consumidor futuro.
- Parar se surgir requisito de conteúdo, taxonomia, composição, catálogo, geração ou UI.
- Parar se a validação real exigir criação ou alteração de dados de pesquisa.

### 4.3. Decisão ao fim da fase

- Registrar neste plano somente uma das decisões: avançar, ajustar, bloquear ou encerrar.
- Como existe uma única fase executável, aprovação integral encerra o plano e habilita o relatório final ao Gestor de Docs conforme `docs/prompt-estrategista.md`.

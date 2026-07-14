# Plano-base E10.8 — Resolução de pesquisas estruturadas para landing_page

- Versão: v2
- Data: 14/07/2026
- Status: plano-base v2 consolidado; Executor ainda não liberado
- Recorte previsto para roadmap: `10.8 — Resolução de pesquisas estruturadas para landing_page`
- Path canônico: `docs/lousa-plano-base-e10-8.md`
- Fontes obrigatórias: `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/supa-up.md`, `supabase/snippets/e10_5_5_nicho_carregamento.sql`, implementação e documentação atuais da E10.5.5, E10.5.6 e E10.7.

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
- `business_buyer` próprio completo e elegível vence sempre.
- `business_buyer` próprio inexistente ou incompleto permite avaliar o conjunto inteiro do pai direto.
- `business_buyer` próprio estruturalmente inválido ou ambíguo produz falha fechada e não pode ser mascarado pelo pai.
- A herança nunca ocorre bloco por bloco e nunca alcança avô ou outro ancestral.
- Cada público usa uma única versão comum aos seus quatro blocos; as versões de `end_customer` e `business_buyer` podem ser diferentes.
- A implementação será server-side, tipada e sem persistência nova.
- E20 e E19 não serão alteradas por este plano.
- A E18.5 não é dependência da E10.8.
- Automação, agente, job ou rotina recorrente não se aplicam ao recorte.

### 1.4. Consolidação dos especialistas

- Aceitos:
  - trocar “recorte do roadmap” por “recorte previsto para roadmap”;
  - definir o boundary e os paths antes do Executor;
  - separar adapter server-side, DTO normalizado, resolver puro e contratos tipados;
  - falhar fechado quando o conjunto próprio estiver inválido ou ambíguo;
  - validar formalmente o `taxon_id`;
  - preservar `item_id` na rastreabilidade;
  - tornar objetivos os critérios de `priority` e `sort_order`;
  - fechar a ordenação estável;
  - separar testes puros da evidência read-only real;
  - confirmar que a E18.5 não é dependência;
  - adotar `supa#40` como apoio de validação read-only;
  - adotar `supa#5` como referência de logging seguro no adapter.
- Já cobertos:
  - ausência de banco novo;
  - preservação da E10.5.5, E10.5.6 e E10.7;
  - separação das APIs da parametrização raiz da E18.4;
  - não implementação de E20, E19 ou E12.
- Rejeitados:
  - deixar o Executor escolher ou inventar o boundary;
  - considerar repetição de `item_key` inválida por si só;
  - usar o pai para mascarar conjunto próprio inválido ou ambíguo;
  - acoplar logging ao resolver puro;
  - criar infraestrutura de logs ou duplicar em SQL a regra do resolver.
- Pendentes: nenhum.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho: E20 ou E19 solicita o conjunto resolvido para um taxon atendido.
- Entrada: `taxon_id` já resolvido pelo fluxo responsável.
- Processamento:
  - validar a entrada, o taxon atendido e o pai direto;
  - resolver o conjunto `end_customer` próprio;
  - avaliar o conjunto `business_buyer` próprio;
  - se o conjunto próprio estiver inexistente ou incompleto e houver pai direto ativo, avaliar o conjunto inteiro no pai;
  - se o conjunto próprio estiver inválido ou ambíguo, falhar sem consultar o pai como fallback;
  - consolidar pesquisas, itens e proveniência sem modificar as fontes.
- Validação: aplicar entrada, elegibilidade, atomicidade, precedência, integridade estrutural e matriz de casos deste contrato.
- Persistência: nenhuma na E10.8.
- Consumo: devolver sucesso tipado para E20 ou E19, sem implementar esses consumidores.
- Fallback: devolver falha tipada e fechada; não misturar fontes, não usar outro ancestral e não recorrer à E10.7.

### 2.2. Entrada, elegibilidade e atomicidade

- O `taxon_id` deve estar presente e possuir formato UUID válido antes da consulta.
- O taxon atendido deve existir e possuir `is_active = true`.
- Entrada inválida, taxon inexistente ou taxon inativo resulta em falha tipada.
- Os blocos obrigatórios são exatamente `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
- Cada bloco deve possuir uma pesquisa-pai com `status = active`.
- As quatro pesquisas-pai de um conjunto devem compartilhar o mesmo `taxon_id`, `audience_scope` e `version`.
- Deve existir uma única versão ativa, completa e elegível para o público e o taxon de origem avaliados.
- Ausência de versão completa caracteriza conjunto inexistente ou incompleto; mais de um conjunto completo ou fonte não normalizável caracteriza ambiguidade.
- Cada bloco deve possuir pelo menos um item ativo.
- Todo item ativo consumido deve possuir `item_id`, vínculo com a pesquisa-pai resolvida, `item_key` e `item_text` não vazios, `priority` não nulo e `sort_order` não nulo.
- Não criar faixa, limite ou semântica adicional para `priority` ou `sort_order` sem fonte aprovada.
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
  - conjunto próprio completo e elegível vence sempre;
  - conjunto próprio inexistente ou incompleto permite avaliar o pai direto ativo;
  - conjunto próprio inválido ou ambíguo resulta em falha fechada;
  - nenhum bloco próprio pode ser combinado com bloco do pai;
  - pai ausente, inativo, incompleto, inválido ou ambíguo resulta em falha fechada;
  - nunca consultar avô ou outro ancestral.

### 2.4. Resultado, proveniência, ordenação e logs

- O sucesso tipado deve preservar, no mínimo:
  - taxon atendido;
  - taxon de origem de cada público;
  - relação `own` ou `direct_parent` do `business_buyer`;
  - `research_id`, `research_block`, `audience_scope` e `version` de cada pesquisa-pai;
  - `item_id`, `research_id`, `item_key`, `item_text`, `priority` e `sort_order` de cada item ativo entregue;
  - vínculo rastreável de cada item ao taxon, público e versão da pesquisa-pai;
  - versões efetivamente usadas em cada público.
- Ordenação determinística:
  - pesquisas na ordem `strategic_core → lp_overview → lp_sections → seo`;
  - itens por `sort_order ASC`;
  - desempate por `item_key ASC` e `item_id ASC`;
  - `priority` é preservado, mas não recebe nova função de ordenação neste contrato.
- A falha tipada deve diferenciar entrada inválida, erro de leitura, ausência, incompletude, invalidade e ambiguidade, sem fallback silencioso; os nomes finais dos códigos pertencem aos contratos da implementação.
- O resolver puro não registra logs.
- O adapter pode registrar somente metadados operacionais seguros: código da falha, taxon atendido, público afetado, origem resolvida e versão selecionada quando disponíveis.
- `request_id` ou `rid` só pode ser reaproveitado quando já fornecido pelo contexto chamador; a E10.8 não cria nova correlação.
- Não registrar `item_text`, conteúdo integral das pesquisas, PII, credenciais ou secrets.
- Não criar Log Drain, alerta, dashboard, AI Debugging obrigatório ou infraestrutura nova.
- O resolver não cria snapshot; a futura persistência de snapshot pertence ao consumidor autorizado e ao plano próprio.

### 2.5. Contrato de consumo e limites

- E20 deve poder consumir a resolução pronta sem reimplementar precedência ou herança de pesquisas.
- E19 deve poder consumir a resolução pronta após obter o taxon oficial da conta pelo contrato preservado da E10.5.6.
- O resultado deve permitir que esses consumidores futuros falhem fechado, mas este plano não implementa gates, prontidão, geração, snapshots ou alterações em E20 e E19.
- A E10.7 não será importada, alterada ou usada como fallback.
- O boundary de pesquisa para `landing_page` deve permanecer separado das APIs de parametrização raiz da E18.4.

### 2.6. Boundary técnico canônico

- Fluxo obrigatório: `adapter server-side → DTO normalizado → resolver puro → resultado tipado`.
- Boundary de domínio: `lib/conversion-content/landing-page/research-resolution/`.
- Arquivos canônicos:
  - `contracts.ts`: entrada, DTOs normalizados, sucesso, falhas e tipos públicos;
  - `resolver.ts`: elegibilidade, atomicidade, precedência, proveniência e ordenação em função pura;
  - `validation-cases.ts`: fixtures e matriz executável sem dependência do Supabase remoto;
  - `index.ts`: exports controlados do subdomínio.
- Adapter de banco: `lib/conversion-content/adapters/landingPageResearchAdapter.ts`.
- O adapter deve importar `server-only`, acessar o Supabase pelo cliente server-side aplicável, normalizar rows para DTO e chamar o resolver puro.
- Export de consumo: `lib/conversion-content/index.ts`, em namespace ou exports separados de `landingPageRoot`.
- Script canônico: `validate:landing-page-research` em `package.json`.
- Consumidores, rotas e código client não acessam Supabase nem reimplementam a decisão.
- Nenhum arquivo da parametrização raiz existente deve ser alterado para acomodar a resolução de pesquisas.

### 2.7. Matriz mínima de validação

- `taxon_id` ausente ou malformado: falhar.
- Taxon inexistente ou inativo: falhar.
- Próprio e pai completos: escolher `business_buyer` próprio.
- Próprio inexistente e pai completo: escolher pai direto.
- Próprio incompleto e pai completo: escolher pai direto, sem aproveitar blocos próprios.
- Próprio completo e pai incompleto: escolher próprio.
- Próprio inválido ou ambíguo e pai completo: falhar sem mascaramento.
- `end_customer` ausente, incompleto, inválido ou ambíguo no taxon atendido: falhar.
- Pai ausente ou taxon sem `parent_id`, quando o próprio não for elegível: falhar.
- Pai inativo ou sem conjunto elegível: falhar.
- Blocos ativos divididos entre versões: falhar por ambiguidade.
- Mais de uma versão completa elegível: falhar por ambiguidade.
- Item ativo estruturalmente inválido: falhar.
- Erro de leitura ou retorno não normalizável: falhar.
- Nenhum caso pode misturar taxons, públicos, versões ou pesquisas-pai.

## 3. Fases e próxima ação

### 3.1. E10.8.3–10.8.5 — Resolver server-side completo para landing_page

- Status: planejada.
- Objetivo: implementar o resolver compartilhado de elegibilidade, precedência, proveniência, falha fechada e consumo tipado definido na seção 2.
- Automação: não.
- Escopo executável:
  - implementar os paths canônicos da seção 2.6;
  - manter separação explícita das APIs de parametrização raiz da E18.4;
  - criar fixtures puras para toda a matriz da seção 2.7;
  - executar a validação pura sem depender do Supabase remoto;
  - usar os snippets read-only existentes da E10.5.5 e inspeção read-only do Supabase para confirmar taxon atendido, pai direto, blocos, público, versão, status e itens ativos;
  - comprovar no caso real que o conjunto próprio vence quando o pai também é elegível;
  - não duplicar em SQL a regra canônica de precedência do resolver;
  - criar novo snippet somente se os existentes forem insuficientes e após decisão do Estrategista;
  - aplicar logging somente no adapter e dentro dos limites da seção 2.4;
  - executar `npm ci`, `npm run check` e `npm run validate:landing-page-research`;
  - registrar neste plano a evidência, a decisão e a próxima ação da fase.
- Artefatos de código previstos:
  - criar `lib/conversion-content/landing-page/research-resolution/contracts.ts`;
  - criar `lib/conversion-content/landing-page/research-resolution/resolver.ts`;
  - criar `lib/conversion-content/landing-page/research-resolution/validation-cases.ts`;
  - criar `lib/conversion-content/landing-page/research-resolution/index.ts`;
  - criar `lib/conversion-content/adapters/landingPageResearchAdapter.ts`;
  - ajustar `lib/conversion-content/index.ts`;
  - ajustar `package.json`;
  - ajustar somente este plano-base para registrar a execução.
- Critérios de aceite:
  - matriz da seção 2.7 aprovada por fixtures puras;
  - evidência read-only real confirma que o conjunto próprio vence o pai elegível;
  - saída preserva dados e proveniência mínimos;
  - falhas são tipadas e fechadas;
  - nenhuma mistura parcial ocorre;
  - logs permanecem no adapter e sem conteúdo das pesquisas;
  - nenhum registro de pesquisa existente é criado, editado, arquivado ou excluído;
  - nenhuma estrutura de banco, rota, UI, E10.7, E20 ou E19 é alterada;
  - diff limitado aos artefatos listados e a este plano-base.
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
- Log Drain, alerta, dashboard ou AI Debugging como dependência.
- Critério editorial, semântico, faixa de prioridade ou quantidade mínima de itens sem fonte aprovada.
- Duplicação em SQL da lógica canônica do resolver.
- Alteração automática de `docs/roadmap.md`, `docs/base-tecnica.md` ou `docs/schema.md` durante a execução da fase.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se o estado real divergir materialmente de `docs/schema.md` ou das estruturas investigadas.
- Parar se os paths canônicos da seção 2.6 não puderem ser usados sem alterar a parametrização raiz da E18.4.
- Parar se a solução server-side sem banco novo não puder garantir precedência, atomicidade, proveniência e fail-closed.
- Parar antes de propor view, RPC, tabela, campo, migration, rota, cache ou persistência; qualquer necessidade deve ser demonstrada e decidida pelo Estrategista.
- Parar antes de criar novo snippet se os existentes e a inspeção read-only forem insuficientes para a evidência.
- Parar se o boundary exigir alterar a E10.7 ou algum consumidor futuro.
- Parar se surgir requisito de conteúdo, taxonomia, composição, catálogo, geração ou UI.
- Parar se a validação real exigir criação ou alteração de dados de pesquisa.

### 4.3. Decisão ao fim da fase

- Registrar neste plano somente uma das decisões: avançar, ajustar, bloquear ou encerrar.
- Como existe uma única fase executável, aprovação integral encerra o plano e habilita o relatório final ao Gestor de Docs conforme `docs/prompt-estrategista.md`.

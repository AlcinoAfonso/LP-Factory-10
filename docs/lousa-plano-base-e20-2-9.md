27/08/2026 — Plano-base v1 — E20.2.9 — Escopo comercial da LP e reconciliação da identidade

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado a partir das decisões humanas do debate E19.5.4 no PR #822; implementação ainda não iniciada.
- Caso macro: `E20 — Preparação e liberação de taxons para geração de landing pages`.
- Recorte: `E20.2.9 — Escopo comercial da LP e reconciliação da identidade`.
- Path canônico: `docs/lousa-plano-base-e20-2-9.md`.
- Natureza: evolução versionada da E20.2 que precisa reconciliar no mesmo recorte os consumidores E19.5 responsáveis pela continuidade da identidade comercial antes de qualquer nova UX da E19.5.4.
- Plano conceitual: PR #822 / `docs/matriz-debate-e19-5-4.md`, somente como origem das decisões humanas aplicadas neste plano.
- Automação: não.

### 1.2. Fontes usadas

- `README.md` — visão do produto, simplicidade do MVP e menor complexidade suficiente.
- `docs/roadmap.md` — estado vigente de E19.5, E20.2, E20.2.8, E20.5 e E20.6.
- `docs/template-roadmap.md` — regra de numeração e conteúdo dos recortes.
- `docs/prompt-estrategista.md` v35 — processo de plano-base e PR.
- `docs/lousa-plano-base-e19-5.md` — configuração operacional, identidade comercial, revisões e residences vigentes.
- `docs/lousa-plano-base-e19-5-4.md` — UX anterior reprovada e recorte visual que permanece bloqueado até esta reconciliação estrutural.
- `docs/lousa-plano-base-e20-2.md` — contrato declarativo e versões v1–v5.
- `docs/lousa-plano-base-e20-2-8.md` — versão atual explícita, lifecycle, compatibilidade e proteção das dimensões de identidade.
- `docs/lousa-plano-base-e20-6.md` — suficiência factual por taxon e autoridade humana.
- PR #821 / E20.7 — consumidor adjacente futuro de `landing_page_offering_scope`, sem autoridade sobre sua persistência ou identidade.
- `lib/conversion-content/landing-page/input-catalog/contracts.ts`, `schema.ts`, `registry.ts`, `lifecycle.ts` e `resolver.ts` — contrato executável E20.2.
- `lib/lp-builder/onboardingConfiguration.ts` — validação e canonicalização dos valores concretos.
- `lib/lp-builder/adapters/landingPageWorkspaceAdapter.ts` — autoridade atual de continuidade da identidade e configuração operacional.
- `app/a/[account]/_components/OnboardingConfigurationJourney.tsx` — controle genérico vigente para os value types E20.2.
- `supabase/migrations/20260822170000_e19_5_3_landing_page_workspace.sql` e `20260824180000_e20_2_8_input_catalog_lifecycle.sql` — residences JSONB e RPC de persistência versionada já existentes.

### 1.3. Problema e resultado esperado

- A versão atual v5 representa o que a LP divulga por `primary_service_or_offer`, um `string` singular e obrigatório, e mantém `primary_service_or_offer_description` também singular.
- O contrato E19.5 vigente ainda trata `primary_conversion_goal` como parte do núcleo de identidade, enquanto a decisão humana superveniente estabeleceu que ele é estratégia obrigatória de conversão e pode variar sem criar nova identidade.
- O lifecycle E20.2.8 protege hoje `funnel_stage`, `transaction_intent`, `primary_conversion_goal` e `primary_service_or_offer` como dimensões de identidade; publicar uma alteração material sem reconciliar E19.5 é corretamente bloqueado.
- O resultado deste recorte é materializar uma nova versão E20.2 em que:
  - `landing_page_offering_scope` substitui a semântica singular de `primary_service_or_offer`;
  - a mesma dimensão representa uma oferta, algumas ofertas ou o portfólio amplo;
  - `primary_conversion_goal` deixa de bloquear continuidade de identidade;
  - a autoridade E19.5 passa a reconhecer `funnel_stage`, `transaction_intent` quando aplicável e `landing_page_offering_scope` como núcleo comercial;
  - várias LPs concretas podem compartilhar a mesma identidade, sem criar entidade, vínculo ou unicidade física de identidade;
  - configurações operacionais antigas são interpretadas e convertidas de forma determinística sem reescrever snapshots históricos;
  - somente depois dessa reconciliação a UX E19.5.4 pode ser retomada.

### 1.4. Modelo mental e identidade comercial aplicados

- Landing page concreta e identidade comercial são conceitos distintos.
- Uma conta pode possuir duas ou mais LPs concretas com a mesma identidade comercial.
- O núcleo mínimo de identidade passa a ser:
  - `funnel_stage`;
  - `transaction_intent`, somente quando aplicável ao taxon;
  - `landing_page_offering_scope`.
- `primary_conversion_goal` permanece universal, obrigatório e próprio da estratégia de conversão, mas não integra o núcleo de identidade.
- Alterar `primary_conversion_goal` pode produzir nova versão da mesma LP sem exigir nova LP.
- `business_offerings_summary` permanece contexto compartilhado, livre, opcional e não exaustivo; não é whitelist e não define sozinho o escopo da LP.
- Grupo de LPs, identidade como agrupador, grupo livre criado pelo cliente, A/B e visualização `Por grupos` permanecem fora deste recorte.

### 1.5. Contrato funcional de `landing_page_offering_scope`

- Nome técnico aprovado: `landing_page_offering_scope`.
- Rótulo de produto: `O que esta landing page vai divulgar?`.
- O field é universal, obrigatório, específico da LP e fornecido no contexto da própria LP.
- O contrato usa um value type composto próprio da E20.2, `offering_scope`, seguindo o precedente já existente de value types estruturados como `keyword_map`, `number_range`, `asset_reference` e `color_palette`; não cria engine, tabela ou infraestrutura nova.
- Forma canônica do valor:
  - uma oferta: `{ mode: "single", offerings: ["Implante dentário"] }`;
  - algumas ofertas: `{ mode: "selected", offerings: ["Implante dentário", "Clareamento"] }`;
  - portfólio amplo: `{ mode: "portfolio", offerings: ["Implante dentário", "Clareamento", "Ortodontia"] }`.
- Regras determinísticas:
  - `mode` admite somente `single | selected | portfolio`;
  - `offerings` é sempre lista não vazia de strings não vazias;
  - itens repetidos de forma case-insensitive são inválidos;
  - `single` exige exatamente um item;
  - `selected` exige pelo menos dois itens;
  - `portfolio` exige pelo menos um item e representa a declaração humana de que a lista corresponde ao portfólio abrangido pela LP naquele momento;
  - não fixar máximo arbitrário de itens sem evidência de produto.
- O valor factual da lista pode evoluir sem criar automaticamente nova identidade. Mudança material do escopo continua sendo decisão semântica humana conforme a seção 2.2.

### 1.6. Descrição factual do escopo

- A cobertura factual atualmente fornecida por `primary_service_or_offer_description` não deve ser perdida.
- A nova versão introduz `landing_page_offering_scope_description` como `string` obrigatória e específica da LP para descrever factual e brevemente o escopo selecionado como um todo.
- `landing_page_offering_scope_description` não integra o núcleo de identidade; atualizar detalhes factuais da mesma oferta, conjunto ou portfólio permanece possível na mesma LP e só afeta conteúdo futuro por nova versão.
- `primary_service_or_offer` e `primary_service_or_offer_description` ficam retirados somente na nova versão executável; v1–v5 permanecem imutáveis e resolvíveis.

### 1.7. Compatibilidade histórica e transição operacional

- Não reescrever materializações, generation context snapshots, revisões ou versões E20.2 v1–v5.
- A nova versão é forward-only e somente se torna atual pelo lifecycle E20.2.8.
- Configuração operacional v5 que ainda possua `primary_service_or_offer` e não possua `landing_page_offering_scope` recebe adaptação determinística limitada ao boundary operacional:
  - `primary_service_or_offer = X` → `landing_page_offering_scope = { mode: "single", offerings: [X] }`;
  - `primary_service_or_offer_description = Y` → `landing_page_offering_scope_description = Y`.
- Essa adaptação existe somente para residences operacionais/bootstraps legados e não altera snapshots históricos.
- A resolução canonicalizada da nova versão omite os fields retirados; no primeiro save válido sob a nova versão, a residence é persistida somente com os novos fields e o mecanismo legado deixa de ser necessário para aquela configuração.
- Não criar migration de dados apenas para trocar chaves JSON se o adapter versionado e o primeiro save puderem concluir a transição de forma segura e observável. Se a análise de implementação demonstrar que o gate E20.2.8 não consegue validar todas as configurações correntes com essa adaptação sem estado intermediário inválido, parar antes de criar migration e devolver o requisito técnico com evidência objetiva.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - decisão humana aprovada para substituir a semântica singular de oferta e corrigir o núcleo de identidade antes da nova UX E19.5.4.
- Entrada:
  - registry E20.2 v5 e lifecycle E20.2.8 vigentes;
  - configurações compartilhadas e específicas das LPs já existentes;
  - snapshots históricos imutáveis;
  - cadeia taxonômica, plano e versão efetiva `C` fornecidos pelos boundaries vigentes.
- Processamento:
  - adicionar o value type `offering_scope` e sua validação ao contrato E20.2;
  - materializar a nova versão do registry retirando somente na nova versão os dois fields singulares e adicionando `landing_page_offering_scope` + `landing_page_offering_scope_description`;
  - canonicalizar valores estruturados e adaptar deterministicamente residences legadas;
  - atualizar a autoridade E19.5 de continuidade da identidade;
  - atualizar a allowlist/proteção E20.2.8 para refletir a nova autoridade;
  - atualizar somente a configuração mínima necessária para editar os novos fields;
  - validar a transição completa antes de tornar a nova versão atual.
- Validação:
  - validar schema/registry/resolver da nova versão;
  - validar cardinalidade e unicidade do `offering_scope`;
  - validar configurações legadas, incompletas e novas;
  - validar continuidade da identidade e mudanças permitidas;
  - validar transição E20.2.8 e revisão E20.6 quando exigida;
  - validar geração e snapshots sem reinterpretação histórica.
- Persistência:
  - continuar usando `account_landing_page_configurations.values` e as residences vigentes; nenhuma nova coluna/tabela por padrão;
  - o primeiro save sob a nova versão persiste a representação canônica nova pelo RPC vigente.
- Consumo:
  - E19.5 usa o novo escopo como dimensão da identidade;
  - geração recebe o valor factual novo no mesmo fluxo de facts/contexto vigente;
  - E20.7 poderá consumi-lo futuramente para seleção de conhecimento, sem alterar este contrato.
- Fallback:
  - valor legado malformado, novo valor inválido, ausência de descrição obrigatória ou incompatibilidade de versão falha fechado;
  - não inferir oferta a partir de nome da LP, `business_offerings_summary`, taxon ou pesquisa;
  - não voltar silenciosamente à v5 depois que a nova versão for atual.

### 2.2. Continuidade da identidade

- Depois de existir revisão válida com baseline aplicável:
  - mudança de `funnel_stage` em relação ao baseline continua exigindo nova LP;
  - mudança de `transaction_intent`, quando aplicável, continua exigindo nova LP;
  - mudança de `primary_conversion_goal` não exige nova LP;
  - mudança de `landing_page_offering_scope` exige confirmação humana explícita equivalente a `continua sendo a mesma identidade comercial?` quando o valor factual mudar materialmente.
- Para `landing_page_offering_scope`:
  - mesma lista apenas reordenada ou com diferenças de caixa/espaçamento não constitui mudança material;
  - alteração de modo, inclusão/remoção/substituição de ofertas ou outra mudança factual aciona a confirmação humana;
  - confirmação positiva preserva a mesma LP e a mudança só entra no conteúdo por nova versão;
  - ausência de confirmação bloqueia o save e orienta a criação de outra LP quando o trabalho comercial for diferente;
  - o sistema não cria nova LP automaticamente.
- Não criar constraint, chave, tabela ou fingerprint persistido para impedir duas LPs com identidade igual.

### 2.3. Relação com E20.2.8 e E20.6

- A transição da v5 para a nova versão é material e não deve ser classificada artificialmente como carry-forward compatível apenas para evitar revisão.
- `landingPageCommercialIdentityFieldKeys` deve passar a refletir somente `funnel_stage`, `transaction_intent` e `landing_page_offering_scope`; `primary_conversion_goal` e `primary_service_or_offer` deixam de ser autoridades vigentes de continuidade.
- O gate E20.2.8 deve provar que consumidores E19.5 e configurações correntes suportam a nova versão antes da publicação.
- Taxons preparados materialmente afetados devem seguir a E20.6 vigente para decisão humana de suficiência da nova versão; não copiar `reviewed_input_catalog_version` por conveniência.
- O mesmo número efetivo `C` deve chegar a configuração, workspace e geração conforme a autoridade canônica já implantada pela E20.2.8.

### 2.4. Configuração mínima antes da nova UX

- Este recorte altera somente a superfície de configuração necessária para preencher e revisar os novos fields.
- `landing_page_offering_scope` deve permitir escolher claramente:
  - uma oferta;
  - algumas ofertas;
  - todo o portfólio.
- Nos três casos, a pessoa informa a lista factual correspondente e a descrição curta do escopo.
- A experiência pode reutilizar os componentes e o formulário existentes; não redesenhar home, detalhe, histórico ou preview do workspace nesta fase.
- A UX completa da E19.5.4 só começa depois que a nova versão E20.2 estiver operacional e os gates estruturais estiverem aprovados.

## 3. Fases e próxima ação

### 3.1. E20.2.9 — Escopo comercial da LP e reconciliação da identidade

- Automação: não.
- Objetivo:
  - entregar a nova representação de escopo comercial da LP, corrigir a autoridade de identidade E19.5 e publicar a nova versão E20.2 somente após transição operacional segura.
- Entrega executável:
  - novo value type `offering_scope` no contrato E20.2;
  - nova versão executável do registry, preservando v1–v5;
  - `landing_page_offering_scope` e `landing_page_offering_scope_description`;
  - retirada forward-only de `primary_service_or_offer` e `primary_service_or_offer_description` na nova versão;
  - canonicalização e adaptação determinística de configurações v5 legadas;
  - atualização da continuidade de identidade E19.5 e da proteção E20.2.8;
  - controle mínimo de configuração para os novos fields;
  - validações determinísticas e regressões do input catalog, onboarding/configuração, workspace, geração e snapshots;
  - gates existentes E20.6 e E20.2.8 antes da ativação da nova versão;
  - atualização documental/roadmap somente pelo fluxo ABC quando o estado final estiver comprovado.
- Critérios de aceite:
  - v1–v5 permanecem imutáveis e resolvíveis;
  - nova versão não vira atual antes dos gates E20.2.8/E20.6 aplicáveis;
  - configurações v5 válidas continuam consumíveis por adaptação determinística e são canonicalizadas no primeiro save sob a nova versão;
  - `primary_conversion_goal` pode mudar na mesma LP sem erro de identidade;
  - `landing_page_offering_scope` suporta os três modos e aplica confirmação humana somente a mudança material;
  - duas LPs concretas podem compartilhar a mesma identidade sem bloqueio;
  - geração recebe os novos facts sem alteração de algoritmo, prompt ou renderer;
  - snapshots históricos permanecem inalterados;
  - nenhuma nova infraestrutura ou residência é criada por conveniência;
  - `npm ci`, `npm run check` e validações focais aplicáveis passam antes do gate de merge da implementação.
- Próxima ação:
  - submeter este plano-base v1 ao processo definido em `docs/prompt-estrategista.md`; após sua incorporação à `main`, executar a orquestração/implementação aprovada antes de retomar a UX E19.5.4.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo

- redesenho da home `Todas as LPs`, detalhe ou preview da E19.5.4;
- decisão ou implementação de `Grupo`, identidade como grupo ou grupo livre;
- A/B, tracking, publicação, archive/restore, editor ou comparação de versões;
- implementação da estratégia de Deep Research/fallback dinâmico do PR #821/E20.7;
- catálogo estruturado compartilhado de ofertas do negócio, tabela de portfólio ou whitelist global;
- nova entidade/tabela de identidade comercial;
- constraint de unicidade de identidade entre LPs;
- criação automática de nova LP diante de mudança de identidade;
- nova rota de primeiro nível, job, fila, agente, engine, workflow ou automação;
- reescrita de snapshots/materializações históricas;
- mudança de prompt, algoritmo de geração, renderer ou arquitetura OpenAI;
- inferência de ofertas a partir de taxon, nome da LP, pesquisa ou `business_offerings_summary`.

### 4.2. Critérios de parada

- Parar se o value type composto não puder ser integrado ao contrato E20.2 sem criar segunda autoridade de validação.
- Parar se a transição operacional exigir reescrever snapshots históricos.
- Parar se a adaptação lazy das configurações legadas não permitir validar todas as configurações operacionais exigidas pelo gate E20.2.8; nesse caso, devolver evidência técnica antes de propor migration de dados.
- Parar se a nova versão exigir que E20.6 ou E20.2.8 sejam contornadas para ativação.
- Parar se a implementação exigir catálogo estruturado de portfólio, nova residência ou infraestrutura não autorizada neste plano.
- Parar se a solução exigir decidir o modelo de grupos ou redesenhar a UX principal antes de concluir este recorte.

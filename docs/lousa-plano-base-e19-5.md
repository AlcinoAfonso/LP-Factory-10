22/08/2026 — Plano-base v3 — E19.5 — Workspace operacional e lifecycle de LPs

## 1. Estado e decisões fixas

### 1.1. Identificação

- Recorte: `E19.5 — Workspace operacional e lifecycle de LPs`.
- Path canônico: `docs/lousa-plano-base-e19-5.md`.
- Estado: **plano-base v3 reduzido, com decisões humanas de produto e revisão técnica do Analista Macro consolidadas em 22/08/2026; parecer final do Estrategista favorável; aguarda aprovação/merge documental antes de qualquer execução**.
- Decisão de convergência: **alternativa B — reduzir a primeira E19.5**.
- Estratégia de execução aprovada para B: futura implementação nova a partir da `main`, com reaproveitamento seletivo do PR #797 somente quando contrato, trecho ou caso de regressão continuar aderente.
- A v3 substitui materialmente a v1 vigente na `main` e o desenho técnico v2 proposto no PR #797.
- O PR #797 permanece congelado como evidência, protótipo técnico, catálogo de armadilhas e fonte seletiva até esta v3 ser aprovada; depois deve ser fechado como substituído, sem apagar branch ou histórico.
- Não fazer cherry-pick de commits completos do #797 por padrão nem copiar sua estrutura física por inércia.
- Plano conceitual: N/A.
- Processo: `docs/prompt-estrategista.md`.
- Predecessores materiais: E19.1, E19.2, E19.3 e E19.4 implementadas no fluxo oficial da conta.
- O expand backward-compatible já presente na `main` para `draft | active | archived` é compatibilidade técnica existente; ele não obriga a primeira E19.5 reduzida a entregar archive/restore nem a concluir agora o contract de lifecycle.

### 1.2. Problema comprovado

- A E19.4 comprovou o pipeline de geração, validação, revisões append-only, renderer e preview privado da primeira LP real.
- `landing_page` representa uma identidade comercial estável com múltiplas revisões imutáveis.
- A superfície `/a/[account]` precisa evoluir de continuação do onboarding para workspace operacional da conta.
- O usuário precisa trabalhar com várias LPs, configurar cada uma no contexto correto, gerar novas revisões sem destruir as anteriores, consultar histórico e escolher explicitamente qual revisão está aprovada.
- O PR #797 comprovou capacidades úteis, mas concentrou complexidade acidental em precriação/backfill operacional, placeholders, `is_initialized`, duplicação de validação semântica TypeScript × SQL, leitura account-wide de materializações e lifecycle archive/restore na primeira entrega.
- A migration funcional do #797 não foi aplicada; portanto, a E19.5 pode adotar um desenho menor sem compatibilidade com essas estruturas não implantadas.
- Publicação, editor de conteúdo, melhoria parcial por IA, archive/restore, mensuração e testes A/B não são necessários para provar o ciclo operacional central.

### 1.3. Resultado esperado

- Transformar `/a/[account]` em workspace operacional simples para owner e admin elegíveis.
- Preservar o onboarding E19.2 como bootstrap da primeira jornada factual, sem segundo onboarding.
- Exibir uma entrada por identidade comercial de LP, sem transformar revisões em novas LPs.
- Permitir criar nova LP somente quando houver novo trabalho comercial.
- Criar configuração operacional somente quando ela for realmente necessária ao fluxo, sem precriação massiva de configurações vazias.
- Permitir salvar configuração parcial, gerar novas revisões integrais, abrir a revisão mais recente e revisões históricas em preview e aprovar explicitamente uma revisão existente.
- Manter aprovação separada de geração e de futura publicação.
- Manter publicação, editor manual, melhoria parcial por IA, archive/restore, testes A/B, mensuração de conversões e implementação obrigatória de código humano sequencial fora da primeira implementação reduzida.
- Preservar uma base conceitual que permita adicionar essas capacidades em recortes futuros sem reconstruir identidade, versionamento ou histórico.

### 1.4. Atores e gates

- Somente membership `active` com papel `owner` ou `admin` pode criar LP, alterar configuração, iniciar geração ou aprovar revisão.
- A conta deve estar `active` e possuir entitlement comercial válido para as ações que dele dependem.
- O taxon primário ativo permanece autoritativo onde o fluxo vigente o exige.
- Toda ação mutável revalida conta, membership e entitlement server-side e deriva `accountId` e ator do contexto autenticado.
- Conta piloto e clientes usam o mesmo workspace e os mesmos boundaries.
- A E19.5 não inventa capability comercial, carteira, saldo ou limite local de gerações; capacidades e limites comerciais continuam sob a E9.7 quando houver consumidor real.

### 1.5. Preservação da E19.2 e handoff lazy

- A E19.2 continua responsável pelo primeiro onboarding pós-entitlement e pelos fatos/configuração já persistidos no agregado `public.account_landing_page_onboarding_configurations`.
- O vínculo write-once existente não é rebindado nem reinterpretado como configuração genérica de todas as LPs.
- Para a primeira LP vinculada, valores válidos da E19.2 permanecem reutilizáveis como bootstrap.
- O handoff para a configuração operacional da E19.5 ocorre somente quando o fluxo realmente precisa dessa configuração.
- Não precriar configuração operacional vazia para todas as LPs nem fazer backfill massivo apenas para preparar o workspace.
- Ausência de residência operacional significa apenas que ainda não houve handoff/uso operacional daquela residência; não significa configuração inválida nem exige placeholder.
- Existência de residência operacional significa configuração real da E19.5, ainda que parcial.
- Completude é sempre derivada dos valores resolvidos contra catálogo, scopes, obrigações e condições aplicáveis; não existe booleano persistido equivalente a `is_initialized` ou `is_complete`.
- Uma LP legada sem configuração operacional continua sendo identidade válida; ao entrar em fluxo que exige configuração, inicializa-se somente o necessário, sem copiar valores específicos de outra LP.
- Para nova LP criada já no workspace operacional, a configuração necessária nasce no próprio fluxo de criação/edição, sem placeholder intermediário obrigatório.
- Retry do handoff é idempotente e não duplica residência nem reinterpreta E19.2.
- Após o handoff válido, a E19.2 permanece bootstrap/histórico e não vira fallback operacional concorrente.
- Nenhuma atualização de configuração altera retroativamente revisão já materializada.

### 1.6. Configuração contextual da LP — decisão consolidada

- `account` e `business` representam informações compartilhadas e vivas da conta quando pertencem às fontes editáveis pelo workspace.
- `offer`, `campaign` e `landing_page` representam contexto que pode variar entre LPs conforme o catálogo E20.2 e o caso comercial.
- Fields de `offer` podem ser reutilizados quando continuam aplicáveis, mas não são presumidos como uma oferta global única para todas as LPs.
- Cada LP confirma ou ajusta os fields de `offer` aplicáveis ao seu contexto quando necessário; a E19.5 não cria catálogo, entidade ou gestão avançada de ofertas por antecipação.
- `campaign` e `landing_page` permanecem específicos da LP concreta.
- A revisão técnica confirmou que a separação conceitual também deve existir fisicamente no MVP:
  - uma residência 1:1 por conta para valores não autoritativos de `account/business`, usando como referência o protótipo `account_landing_page_shared_configurations` do #797;
  - uma residência 1:1 por LP para `offer/campaign/landing_page`, usando como referência o protótipo `account_landing_page_configurations` do #797.
- O split físico é preservado; precriação, backfill amplo, placeholder, `is_initialized`, validator SQL duplicado e readiness do #797 não são herdados por consequência.
- Cada residência possui revisão técnica própria, monotônica e positiva, usada somente para concorrência otimista/proveniência; não é versão de conteúdo nem estado de produto.
- A residência compartilhada pode já existir por uso operacional anterior da conta; a residência por LP nasce somente quando a LP entra no fluxo que a necessita.
- Salvar configuração não cria revisão de conteúdo.
- Quando uma única ação `Salvar configuração` alterar simultaneamente as residências compartilhada e específica da LP, as duas mutações formam uma única unidade atômica: ambas são confirmadas ou nenhuma é persistida; conflito de revisão ou falha em qualquer residência aborta toda a operação.
- Configuração parcial pode ser preservada; somente a ação que depende de completude fica bloqueada.
- Uma nova geração resolve a configuração efetiva vigente naquele momento pelas autoridades canônicas aplicáveis e congela o contexto efetivamente utilizado no snapshot da nova revisão.
- Alterar configuração nunca modifica silenciosamente revisões históricas já materializadas.

### 1.7. `landing_page_objective` — decisão humana confirmada

- Decisão humana confirmada em 22/08/2026: `landing_page_objective` permanece **string livre não vazia** na primeira E19.5, sem taxonomia estruturada própria e fora de qualquer trava por igualdade literal de identidade.
- A E19.5 mantém `landing_page_objective` como input explícito da LP, incorporado de forma versionada ao catálogo E20.2 sem alterar versões anteriores.
- O field pertence ao scope `landing_page` e recebe valor humano.
- O objetivo não é obrigatório para criar a identidade da LP nem para salvar configuração parcial.
- O objetivo é obrigatório para a LP ficar `Pronta para gerar` e participar de nova geração.
- O texto pode ser refinado sem criar nova LP quando o significado comercial permanecer o mesmo.
- Mudança material da finalidade comercial caracteriza novo trabalho comercial e, depois da primeira revisão válida, exige nova identidade de LP.
- Alterar o objetivo não modifica revisões existentes; o novo objetivo só chega ao conteúdo executável após nova geração.
- O objetivo é orientação editorial/comercial sem autoridade factual e não autoriza preço, credencial, resultado, prova social, superioridade ou promessa sem suporte factual.
- Rótulo de UX recomendado: `Objetivo desta página`.
- Estruturar esse campo futuramente exige evidência de taxonomia recorrente, estável e ortogonal a `funnel_stage`, `transaction_intent`, oferta e canal; não é antecipado nesta fase.
- A inclusão do field produz uma nova versão executável E20.2 v5, preservando v1–v4.
- Criar a v5 não a torna automaticamente autorizada para geração: a E20.6 deve avaliar explicitamente a versão executável 5 para o taxon servido e somente decisão humana de suficiência pode registrar `reviewed_input_catalog_version = 5`.
- Qualquer consumidor E19.3/E19.4 que requeira a v5 falha fechado enquanto a versão revisada/autorizada do taxon não for exatamente 5; não usar `latest`, maior versão ou fallback implícito.

### 1.8. Identidade da LP, revisões e aprovação — decisão humana confirmada

- Princípio de produto: **a LP identifica um trabalho comercial; a revisão identifica uma evolução desse mesmo trabalho**.
- Cada conta pode possuir várias identidades de LP e cada LP pode possuir várias revisões imutáveis e append-only.
- Antes da primeira revisão válida, o núcleo comercial ainda pode ser corrigido.
- Depois da primeira revisão válida, integram o núcleo de identidade:
  - conta proprietária;
  - `funnel_stage`;
  - oferta ou caso de uso principal, em seu significado;
  - `transaction_intent`, quando aplicável ao taxon;
  - finalidade comercial da LP, em seu significado.
- Depois da primeira revisão válida:
  - mudar `funnel_stage` cria nova LP;
  - mudar `transaction_intent`, quando aplicável, cria nova LP;
  - mudar o significado da oferta/caso de uso cria nova LP;
  - mudar materialmente a finalidade comercial cria nova LP;
  - mero refinamento textual de `landing_page_objective` não cria nova LP;
  - atualizar detalhes factuais da mesma oferta sem mudar seu significado não cria nova LP.
- Não integram o núcleo imutável: nome amigável, copy, títulos, imagens, estrutura visual, origem de tráfego/campanha, canal de conversão, destinos operacionais, detalhes factuais atualizados da mesma oferta, mensuração e escolhas de versão.
- Revisões são integrais, imutáveis e append-only dentro da mesma LP.
- Toda geração válida reutilizando E19.3 → E19.4 cria uma nova revisão da mesma LP; regeneração não cria nova `account_landing_pages`.
- **Versão mais recente** é a revisão válida de maior `revision_number`.
- **Versão aprovada** é uma revisão existente escolhida explicitamente por humano autorizado; aprovação não cria cópia nem nova revisão.
- Uma LP pode não possuir versão aprovada e no máximo uma revisão pode estar aprovada por vez.
- A solução física mínima aprovada para a escolha corrente é `approved_materialization_id uuid null` na própria `account_landing_pages`, apontando tenant-safe para uma materialização existente da mesma LP e conta por FK composta; não criar tabela de aprovação nem segunda entidade de versionamento.
- A mutação de aprovação deve ser idempotente e preservar a escolha anterior em caso de falha.
- Gerar nova revisão não remove nem substitui automaticamente a revisão aprovada.
- **Versão publicada** será futura e independente da versão mais recente e da aprovada.
- **LP entregue é uma LP que possui uma revisão válida, acessível em preview e explicitamente aprovada por humano autorizado.** Publicação não é requisito de entrega nesta fase.
- O código humano sequencial `LP-001`, `LP-002` permanece direção de UX futura; sua implementação física não é requisito da primeira E19.5 reduzida.
- A numeração de revisão permanece separada da identidade; evitar notação decimal como `1.1` que misture os conceitos.

### 1.9. Lifecycle e archive/restore — capacidade adiada

- A primeira E19.5 reduzida não entrega archive/restore.
- O expand técnico já aplicado mantém `draft | active | archived` compatíveis no schema/runtime atual; essa compatibilidade não deve ser revertida nesta consolidação.
- A primeira entrega não precisa concluir o contract físico para `active | archived` apenas para satisfazer o workspace reduzido.
- `draft`, `active` e `archived` não devem ser apresentados ao usuário como estados comerciais equivalentes a `Em análise`, `Entregue` ou `Publicada`.
- Estados de UX necessários ao primeiro recorte são derivados de configuração, revisões e aprovação sempre que possível.
- Archive/restore e eventual conclusão do lifecycle físico pertencem a subrecorte posterior, com contrato próprio e sem reconstruir identidade ou revisões.
- Exclusão definitiva continua fora do escopo.

### 1.10. Configuração operacional, bindings e mensuração

- Destinos como WhatsApp, telefone, e-mail ou URL são configuração operacional mutável e não integram a identidade comercial da LP.
- Na primeira E19.5, o destino operacional efetivamente usado pela geração permanece congelado no binding/snapshot da revisão conforme o contrato vigente.
- Alterar destino não modifica revisões históricas; para o novo destino integrar o conteúdo executável, é necessária nova revisão gerada.
- A E19.5 não cria overlay mutável, binding dinâmico ou fonte operacional que sobrescreva revisões existentes.
- **Mensuração de conversões** é o conceito geral para coleta e uso de eventos que medem resultados comerciais da LP.
- Vocabulário consolidado:
  - conceito geral: `mensuração de conversões`;
  - área/configuração: `configuração de mensuração`;
  - ação observável: `evento`;
  - resultado comercial relevante: `conversão` ou `evento de conversão`.
- Configuração de mensuração não integra a identidade da LP; mudanças de Pixel, tag, API, plataforma, evento, conversão ou parâmetro não criam nova LP.
- Implementação de mensuração permanece fora da primeira E19.5 reduzida e exige recorte próprio com consumidor real.

### 1.11. Automação, consumo de IA e compatibilidade futura

- Automação nova na E19.5: **não**.
- A ação humana `Gerar nova revisão` reutiliza o boundary vigente E19.3 → E19.4 e seus workloads; a E19.5 não cria agente, job, fila, cron, webhook, prompt, modelo ou workload novo.
- Nova LP, salvar configuração, abrir preview, abrir histórico e aprovar versão não chamam IA.
- Controle comercial futuro de consumo continua sob E9.7 quando houver requisito concreto.
- A E19.5 não implementa testes A/B nem antecipa engine, tracking, distribuição de tráfego ou análise estatística.
- Revisões imutáveis e separação entre mais recente, aprovada e futura publicada preservam compatibilidade com publicação, experimentação e UX futura sem antecipar sua infraestrutura.
- Três invariantes transversais não podem ser sacrificados por simplificação:
  - identidade da LP ≠ revisão;
  - versão mais recente ≠ versão aprovada ≠ futura versão publicada;
  - configuração operacional ≠ conteúdo da revisão.

### 1.12. Fontes usadas

- `README.md` — visão, proposta de valor e princípio da menor complexidade suficiente.
- `docs/roadmap.md` — estado e dependências do caso E19.5 e predecessores.
- `docs/base-tecnica.md` — regras técnicas de runtime, adapters, SSR, segurança e anti-regressão.
- `docs/schema.md` — contrato vigente do banco.
- `docs/lousa-plano-base-e19-5.md` v1 na `main` — autoridade canônica anterior preservada e evoluída neste mesmo arquivo.
- `docs/lousa-plano-base-e20-6.md` — autoridade do gate de suficiência e de `reviewed_input_catalog_version`.
- Histórico decisório do PR #801 — matriz de convergência, alternativa B, decisões humanas e revisão técnica do Analista Macro; o artefato temporário foi removido do diff final, mas permanece rastreável nos commits do PR.
- PR #797 — somente como evidência técnica seletiva de implementação, review threads, regressões úteis e protótipo das duas residências, snapshot v2 e aprovação tenant-safe; não é autoridade executável desta v3.
- Implementação vigente de E19.2, E19.3 e E19.4 em `app/a/[account]/`, `lib/lp-builder/` e contratos adjacentes.
- Migration já aplicada `20260820214422_e19_5_expand_landing_page_status.sql` e `lib/types/status.ts` como estado técnico atual do rollout de status.
- `docs/lp-planejamento.md` não é fonte deste plano.

## 2. Contrato do caso

### 2.1. Fluxo lógico

#### 2.1.1. Gatilho

- Conta operacional e comercialmente elegível.
- Owner ou admin autenticado abre `/a/[account]`.
- O usuário consulta suas LPs, cria nova identidade quando necessário, abre/configura uma LP, gera nova revisão, consulta histórico/preview e aprova uma versão.

#### 2.1.2. Entrada

- Contexto tenant-aware da conta e do ator.
- Entitlement efetivo e plano aplicável.
- Taxon autoritativo quando exigido pelo fluxo vigente.
- Versão executável E20.2 requerida explicitamente pelo consumidor e compatível com `reviewed_input_catalog_version` do taxon.
- Valores compartilhados válidos de `account/business`.
- Fields de `offer` aplicáveis ao contexto da LP.
- Valores específicos de `campaign/landing_page`, incluindo `landing_page_objective` antes da geração.
- Fatos E19.2 legitimamente reutilizáveis como bootstrap da primeira LP vinculada.
- Identidade da LP.
- Revisões materializadas e snapshots.
- Referência da versão aprovada, quando existir.

#### 2.1.3. Processamento

- Resolver server-side conta, ator, entitlement, taxon e versão explícita do catálogo antes de expor ou mutar dados operacionais.
- Listar LPs usando identidade e resumo suficiente para a tela principal, sem carregar o histórico completo de todas as LPs da conta.
- Garantir ausência de truncamento silencioso da coleção de identidades; paginação, cursor ou carregamento progressivo são aceitáveis desde que o contrato de completude da superfície seja explícito.
- Inicializar configuração operacional de forma lazy quando a LP entrar em fluxo que a exige.
- Reutilizar valores compartilhados válidos sem copiá-los desnecessariamente por LP.
- Para LP sem configuração própria anterior, não importar valores específicos de outra LP.
- Tratar `offer` conforme contexto e `campaign/landing_page` como específicos da LP concreta.
- Permitir salvamento parcial e bloquear somente a geração enquanto houver requisito aplicável ausente ou inválido.
- Gerar nova revisão somente por ação humana explícita, reutilizando E19.3 → E19.4.
- Preservar qualquer versão aprovada quando revisão nova for gerada.
- Carregar histórico completo somente no contexto da LP que o usuário abriu, com ordenação determinística e paginação/completude adequadas.
- Na geração, congelar no contexto/snapshot os valores/fatos efetivamente usados e as identidades técnicas das duas residências operacionais, incluindo `sharedRevision` e `landingPageRevision`; esses números provam proveniência, não versionam o conteúdo.

#### 2.1.4. Validação

- Validar pertencimento tenant-safe da LP e da revisão antes de qualquer leitura ou mutação sensível.
- Validar autorização do ator server-side.
- TypeScript server-side é a autoridade de parsing, normalização e validação semântica dos valores configuráveis, reutilizando o catálogo/validators canônicos.
- Persistir uma forma canônica única depois da normalização; o banco protege shape persistido, tenant, PK/FK, unicidade, atomicidade, concorrência e referências persistentes sem reproduzir um segundo parser semântico completo.
- Não aceitar divergência silenciosa em que runtime considera valor semanticamente válido e a persistência exige outra representação equivalente; URLs e demais tipos normalizáveis devem chegar ao banco na forma canônica escolhida pelo boundary server-side.
- Aplicar apenas normalizações já justificadas pelo contrato do tipo: remover whitespace insignificante onde o validator já o trata como insignificante, manter enums canônicos e preservar E.164; não aplicar lower-case indiscriminado nem transformação semântica de conteúdo humano.
- Exigir `landing_page_objective` válido antes de gerar, sem bloquear criação ou salvamento parcial.
- Impedir que objetivo seja tratado como autoridade factual.
- Impedir mistura de valores específicos entre LPs ou contas.
- Aprovação exige revisão válida da mesma LP e conta.
- Impedir alteração/overwrite de revisão histórica.
- Se a geração requer E20.2 v5, exigir `reviewed_input_catalog_version = 5` no taxon servido; ausência ou divergência falha fechado.
- P1 do #797 passa a ser invariante desta fronteira de validação, não patch daquele PR.
- P2 do #797 passa a ser invariante de completude das LPs e das coleções consumidas, não patch daquele PR.

#### 2.1.5. Persistência

- A identidade da LP permanece no agregado vigente `public.account_landing_pages`; não criar segunda entidade de identidade.
- Revisões permanecem em `public.account_landing_page_materializations` no contrato append-only 1:N já implementado; não criar segunda entidade de versão.
- A E19.2 permanece intacta como bootstrap/histórico e não é rebindada.
- A configuração operacional usa duas residências físicas tenant-safe:
  - uma 1:1 por conta para valores não autoritativos de `account/business`;
  - uma 1:1 por LP para `offer/campaign/landing_page`.
- Cada residência guarda somente os valores do seu escopo, a versão do catálogo aplicável, revisão técnica monotônica para concorrência/proveniência, autoria e timestamps mínimos exigidos pelo contrato.
- Quando a mesma ação de salvamento tocar as duas residências, a persistência deve ocorrer na mesma transação, com validação dos dois estados esperados antes da confirmação; conflito ou erro em qualquer lado causa rollback integral e impede estado parcial entre compartilhado e contextual.
- Não criar linha vazia para cada conta/LP por migration apenas para antecipar uso futuro.
- Não exigir `placeholder` ou `is_initialized` como mecanismo do novo desenho.
- A referência de aprovação é `approved_materialization_id uuid null` em `account_landing_pages`, protegida por FK composta para materialização da mesma LP e conta; a implementação pode reaproveitar seletivamente o protótipo do #797, sem criar tabela concorrente.
- Não copiar `account/business` por LP apenas para facilitar UI quando a informação tiver residência canônica compartilhada.
- Não criar status persistido de UX quando o estado puder ser derivado.
- Qualquer nova migration deve ser mínima, forward-only e limitada às estruturas indispensáveis deste recorte reduzido.
- Não transportar automaticamente validators SQL, readiness, backfill, lifecycle ou RPCs do #797 que existiam para sustentar o desenho eager.

#### 2.1.6. Consumo

- Workspace principal consome identidade + resumo da LP.
- Detalhe da LP consome identidade + configuração + resumo das revisões/estado necessário à ação corrente.
- Histórico consome somente revisões da LP aberta e pode paginar sob demanda.
- Preview padrão abre a versão mais recente; preview histórico abre a revisão escolhida sem alterar estado.
- Ação `Aprovar esta versão` atua sobre revisão existente visualizada.
- E19.3 consome configuração operacional após o handoff; E19.2 não permanece como fallback concorrente.
- E19.4 continua responsável por attempt, geração, materialização append-only, renderer e preview.
- O snapshot da revisão evolui de forma versionada para preservar `sharedRevision` e `landingPageRevision` sem regravar snapshots históricos já válidos.

#### 2.1.7. Fallback

- Falha de leitura mantém estado indisponível explícito; não apresentar coleção truncada como completa.
- Falha de inicialização lazy não cria configuração parcial invisível nem usa E19.2 como fallback concorrente.
- Falha de salvamento preserva valores válidos anteriores e informa o contexto afetado.
- Falha em salvamento que envolva as duas residências preserva integralmente os estados anteriores de ambas; não existe sucesso parcial da mesma ação.
- Configuração parcial permanece editável, mas não gera enquanto faltar requisito obrigatório aplicável.
- Falha de geração não altera revisões anteriores nem versão aprovada.
- Falha de aprovação mantém escolha anterior intacta.
- Conflito de identidade, slug, revisão técnica de configuração ou persistência exige correção explícita; não resolver por overwrite silencioso.
- Boundary de geração indisponível, catálogo não autorizado pelo E20.6 ou versão divergente não cria revisão inválida.

### 2.2. Workspace principal

- `/a/[account]` passa a parecer workspace operacional, não continuação permanente do onboarding.
- A home contém:
  - contexto mínimo da conta quando útil;
  - lista operacional de LPs;
  - ação principal `Nova página`;
  - acesso previsível ao detalhe/configuração da LP.
- A lista apresenta somente o necessário para decidir a próxima ação:
  - nome amigável;
  - estado de UX derivado;
  - versão mais recente, quando houver;
  - indicação de versão aprovada, quando houver;
  - última atualização relevante, quando material à decisão;
  - ação de abrir a LP.
- Slug, objetivo, configuração extensa e histórico completo ficam no detalhe da LP quando não forem necessários na lista.
- Estados de UX derivados podem incluir:
  - `Configuração incompleta`;
  - `Pronta para gerar`;
  - `Em análise`;
  - `Entregue`;
  - `Nova versão em análise`.
- `draft`, `active` ou `archived` são estados técnicos do rollout vigente e não devem ser apresentados como sinônimos desses estados de produto.
- Código humano `LP-001` não é obrigatório neste primeiro recorte; nome da LP e numeração de versão devem ser suficientes para a primeira UX reduzida.
- Desktop pode usar tabela responsiva; mobile usa cards ou composição equivalente sem scroll horizontal obrigatório.

### 2.3. Área Configurações

- A home não exibe formulário técnico gigante.
- A configuração usa fields, scopes, obrigação e validação canônicos do E20.2, sem lista paralela inventada.
- `account/business` aparecem como informações compartilhadas quando editáveis pelo fluxo vigente.
- Fields de `offer` podem ser reutilizados, mas a LP confirma/ajusta os aplicáveis ao contexto; a UX não presume oferta global única.
- `campaign/landing_page` pertencem à LP concreta.
- `landing_page_objective` aparece como campo explícito da LP e é requisito de completude para gerar.
- Valores cuja autoridade pertença a outro domínio permanecem somente leitura quando a E19.5 não for boundary autorizado de edição.
- Salvar permite estado parcial e devolve erro junto do contexto afetado.
- Alterar configuração não altera revisão histórica; efeito sobre conteúdo ocorre somente por nova geração.
- A UI não expõe `revision` técnico das residências como versão de produto; esse identificador serve apenas a concorrência/proveniência.

### 2.4. Semântica das ações

#### 2.4.1. Nova LP

- Cria nova identidade comercial somente quando o usuário realmente deseja outro trabalho comercial.
- Abre o fluxo de configuração da nova LP sem exigir precriação de configuração antes da ação humana.
- Reutiliza somente valores compartilhados legitimamente aplicáveis.
- Solicita confirmação/ajuste de `offer` e coleta valores específicos de `campaign/landing_page` necessários.
- Não exige configuração completa para criar a identidade nem para salvar parcialmente.
- Não inicia geração automaticamente.
- Não copia revisão, snapshot ou valores específicos de outra LP.

#### 2.4.2. Salvar configuração

- Não chama IA e não cria revisão de conteúdo.
- Valida/normaliza server-side pelos contratos canônicos antes da persistência.
- Persiste somente valores pertencentes ao contexto autorizado da LP ou às fontes compartilhadas editáveis pelo workspace.
- Pode preservar configuração parcial.
- Se a ação alterar compartilhado e contextual ao mesmo tempo, as duas alterações são executadas atomicamente na mesma transação: ambas são persistidas ou nenhuma é; conflito de revisão ou erro em qualquer residência aborta toda a operação.
- Incrementa somente a revisão técnica da residência efetivamente alterada; no-op idempotente não precisa produzir nova revisão técnica.
- Revisões de conteúdo já materializadas permanecem integralmente inalteradas.

#### 2.4.3. Gerar nova revisão

- Exige ação humana explícita e configuração completa/válida para o boundary vigente.
- Exige `landing_page_objective` válido.
- Exige versão executável E20.2 explicitamente autorizada pelo E20.6 para o taxon servido; para a v5, exige `reviewed_input_catalog_version = 5`.
- Reutiliza E19.3 → E19.4.
- Uma geração válida cria nova revisão integral e imutável da mesma LP.
- A revisão congela conteúdo, binding, valores/fatos usados e proveniência das duas residências operacionais (`sharedRevision` e `landingPageRevision`).
- Falha não cria revisão válida nem altera versão aprovada.
- Gerar nova revisão não cria outra identidade de LP.

#### 2.4.4. Visualizar revisão

- Preview padrão abre a versão mais recente.
- O histórico permite selecionar qualquer revisão preservada e abrir seu preview individual.
- Preview histórico não altera versão mais recente, aprovada ou futura publicação.

#### 2.4.5. Aprovar esta versão

- Disponível a owner/admin autorizado a partir de revisão válida da LP.
- A aprovação escolhe a revisão existente como versão aprovada por meio do ponteiro `approved_materialization_id` na identidade da LP.
- No máximo uma revisão permanece aprovada por LP.
- Aprovar outra revisão transfere a escolha sem apagar histórico.
- A aprovação não chama IA nem cria nova revisão.
- Gerar revisão posterior preserva a aprovação existente até nova escolha humana.

#### 2.4.6. Arquivar e restaurar — adiado

- Archive/restore não integra a primeira E19.5 reduzida.
- O schema atual pode continuar tolerando `archived` por compatibilidade técnica já aplicada, mas o workspace reduzido não precisa expor nem criar essa capacidade.
- Um recorte futuro poderá adicionar arquivamento/restauração preservando a mesma identidade, configuração, revisões e aprovação.
- Não existe hard delete na primeira E19.5.

### 2.5. Histórico e metadados mínimos

- O histórico pertence à LP concreta, não à lista principal.
- O workspace não carrega todas as materializações da conta para montar resumos de todas as LPs.
- Cada revisão permite identificar, no mínimo:
  - número;
  - data;
  - indicação de versão mais recente;
  - indicação de versão aprovada, quando aplicável;
  - ação de preview.
- O histórico pode ser paginado/carregado progressivamente e deve preservar ordenação determinística e ausência de truncamento silencioso.
- A futura indicação de versão publicada pode ser acrescentada quando o contrato de publicação existir.
- Metadados técnicos do snapshot continuam disponíveis para auditoria quando fizer sentido, sem obrigar exposição na UX principal.
- Não criar comparação lado a lado, ranking, nota automática ou engine de experimentos.

### 2.6. Frontend, UX e evidências

- A experiência deve ser clara para usuário não técnico.
- Pending visível impede duplo clique acidental em ações mutáveis.
- Sucesso e erro aparecem junto do contexto afetado.
- Foco avança de forma previsível após criação, erro ou navegação.
- A lista principal prioriza decisão e resumo; detalhe/histórico carregam informação aprofundada somente quando consumidos.
- A separação entre identidade da LP, versão mais recente e versão aprovada deve ser compreensível mesmo antes de existir código humano `LP-001`.
- Evidências da fase executável devem cobrir, no mínimo:
  - desktop em 1280 px;
  - tablet em 768 px;
  - mobile em 360 px;
  - teclado e foco visível;
  - ausência de truncamento/overflow indevido;
  - uma linha/card por identidade comercial de LP;
  - configuração lazy e parcial sem placeholder visível;
  - ausência de `is_initialized`/completude persistida como estado de produto;
  - reutilização de `account/business` sem cópia indevida;
  - confirmação/ajuste de `offer` sem pressupor oferta global única;
  - `landing_page_objective` obrigatório para gerar;
  - gate E20.6 fail-closed para a versão E20.2 requerida;
  - salvamento atômico quando a mesma ação altera as duas residências;
  - snapshot com proveniência das duas residências;
  - histórico por LP com preview da versão mais recente e histórica;
  - aprovação explícita e preservação da aprovação ao gerar revisão posterior;
  - lista de LPs sem truncamento silencioso;
  - isolamento tenant-safe.

### 2.7. Riscos e dependências

- O rollout técnico vigente tolera `draft | active | archived`; a primeira E19.5 reduzida não deve concluir lifecycle por inércia nem reverter o expand já aplicado.
- O agregado E19.2 não pode ser rebindado nem reinterpretado como configuração genérica de todas as LPs.
- A inicialização lazy precisa provar idempotência e ausência de fallback operacional concorrente após handoff.
- As duas residências físicas precisam preservar isolamento tenant-safe e scopes disjuntos sem reintroduzir o desenho eager.
- Toda ação única que altere ambas as residências precisa preservar atomicidade entre elas; nenhum estado intermediário compartilhado/contextual pode ser confirmado como resultado parcial.
- O E20.2 deve evoluir de forma versionada para incluir `landing_page_objective`, preservando versões anteriores.
- A E20.2 v5 somente pode entrar na geração do taxon depois de avaliação E20.6 da versão executável 5 e decisão humana de suficiência; `reviewed_input_catalog_version` divergente mantém o fluxo fail-closed.
- TypeScript server-side e catálogo/validators canônicos permanecem autoridade semântica; o banco não reconstrói parser completo em SQL.
- A forma persistida precisa ser canônica para impedir a classe de divergência demonstrada pelo P1 de URL do #797.
- A coleção de identidades e cada histórico consumido precisam de estratégia explícita contra truncamento silencioso, preservando o invariante demonstrado pelo P2 do #797.
- A aprovação precisa preservar FK tenant-safe e idempotência sem criar segunda entidade de versionamento.
- O snapshot precisa evoluir versionadamente para registrar as duas revisões técnicas usadas sem invalidar snapshots históricos E19.4.
- E19.3 continua pacote autorizado e passa a consumir a configuração operacional após handoff; E19.4 continua canônica para geração, append, renderer e preview.
- E21.2 continua autoridade de modelo/reasoning dos workloads existentes; a E19.5 não cria configuração paralela.
- Alterações futuras de configuração não podem alterar revisões já materializadas.
- O binding do CTA permanece parte da revisão na primeira E19.5.
- Publicação futura deve distinguir versão mais recente, aprovada e publicada sem reconstruir o versionamento.
- Limites comerciais de geração continuam dependentes da E9.7 e do consumidor real.
- Qualquer estrutura, teste ou trecho reaproveitado do #797 deve ser revalidado contra este plano; testes de placeholder, `is_initialized` ou archive/restore não são herdados apenas porque já existem.

## 3. Fases e próxima ação

### 3.1. E19.5.3 — Workspace operacional reduzido, configuração e aprovação da LP

- Automação: não.
- Objetivo:
  - implementar o ciclo operacional central para múltiplas LPs com identidade estável, configuração lazy/contextual, revisões append-only, histórico/preview sob demanda e aprovação humana.
- Entrega mínima:
  - evolução versionada do E20.2 com `landing_page_objective` string livre;
  - gate explícito E20.2 v5 → E20.6 → somente então geração autorizada com v5;
  - duas residências físicas tenant-safe, uma compartilhada por conta e outra contextual por LP, ambas criadas somente quando necessárias;
  - ausência de placeholder/`is_initialized`; completude derivada dos valores;
  - revisão técnica independente por residência para concorrência/proveniência;
  - salvamento atômico das duas residências quando alteradas pela mesma ação;
  - reutilização de `account/business` sem cópia indevida;
  - reutilização contextual de fields `offer` sem pressupor oferta global única;
  - `campaign/landing_page` associados à LP concreta;
  - workspace com uma entrada por identidade e resumo suficiente;
  - lista de identidades sem truncamento silencioso;
  - histórico carregado por LP sob demanda;
  - preview da versão mais recente e de revisão histórica;
  - ação `Gerar nova revisão` pelo boundary vigente E19.3 → E19.4;
  - snapshot versionado preservando `sharedRevision` e `landingPageRevision` efetivamente usados;
  - `approved_materialization_id` tenant-safe e idempotente na identidade da LP;
  - ação `Aprovar esta versão`;
  - estados de UX derivados;
  - preservação da definição de LP entregue;
  - migration mínima somente para as estruturas indispensáveis ao contrato reduzido.
- Limites:
  - sem precriação/backfill operacional massivo;
  - sem placeholder ou `is_initialized`;
  - sem parser semântico completo duplicado em SQL;
  - sem leitura do histórico completo da conta para montar a lista principal;
  - sem archive/restore;
  - sem conclusão obrigatória do contract `draft → active | archived`;
  - sem implementação física obrigatória de `LP-001`;
  - sem automação nova;
  - sem mudança de modelo, prompt, effort ou workload;
  - sem editor manual ou melhoria parcial por IA;
  - sem publicação;
  - sem hard delete;
  - sem binding dinâmico;
  - sem mensuração de conversões;
  - sem créditos/carteira local;
  - sem testes A/B ou engine de experimentos;
  - sem catálogo/gestão avançada de ofertas;
  - sem nova infraestrutura sem consumidor indispensável.
- Critérios de aceite:
  - onboarding E19.2 continua funcional e sem rebind;
  - handoff lazy é idempotente e não deixa segunda autoridade operacional;
  - ausência de residência e configuração parcial possuem semântica distinta e completude é derivada;
  - owner/admin autorizado executa somente ações permitidas;
  - uma linha/card representa cada identidade comercial, sem multiplicar LP por revisão;
  - listagem de identidades não depende de coleção truncada tratada como completa;
  - `account/business` são reutilizados conforme autoridade vigente;
  - `offer` pode ser confirmado/ajustado por LP sem presumir oferta global;
  - `campaign/landing_page` permanecem específicos da LP;
  - `landing_page_objective` pode faltar em configuração parcial, mas bloqueia geração até válido;
  - geração com E20.2 v5 falha fechado até `reviewed_input_catalog_version = 5` para o taxon servido;
  - parsing/normalização/semântica têm autoridade server-side única e persistência recebe forma canônica;
  - salvar configuração não cria revisão de conteúdo nem altera histórico;
  - se a mesma ação de save altera as duas residências, conflito ou erro em qualquer uma faz rollback integral e nenhuma mudança parcial persiste;
  - nova geração cria revisão integral append-only da mesma LP;
  - snapshot registra valores/contexto e as revisões técnicas compartilhada e específica da LP usadas na geração;
  - versão aprovada anterior permanece até nova aprovação humana;
  - histórico de uma LP pode ser carregado/paginado sem carregar todos os históricos da conta;
  - qualquer revisão válida da LP pode ser aberta em preview;
  - aprovação pelo ponteiro tenant-safe não cria revisão e mantém no máximo uma escolha aprovada por LP;
  - invariantes identidade ≠ revisão, latest ≠ approved ≠ future published e configuração ≠ conteúdo permanecem preservados;
  - verificadores/testes proporcionais e `npm run check` aprovam o contrato;
  - evidência hospedada aprova desktop, tablet, mobile, teclado, foco e fluxos humanos previstos;
  - Prompt ABC reconcilia roadmap e documentos canônicos materialmente afetados durante a implementação.

### 3.2. Próxima ação

- A decisão humana B, as demais decisões humanas de produto e a revisão técnica do Analista Macro estão consolidadas nesta v3.
- Parecer final do Estrategista: **favorável ao fechamento do plano-base v3 reduzido**.
- O plano-base v3 não autoriza execução antes de sua aprovação/merge documental no PR #801.
- Não enviar instrução ao Executor baseada no PR #797, na matriz temporária ou em versões anteriores do plano.
- Após merge do #801, fechar o #797 como substituído, preservando branch, commits, testes e review threads como histórico/evidência.
- A futura implementação deve nascer de nova branch a partir da `main` já contendo esta v3 e deve reutilizar seletivamente somente partes do #797 que continuem aderentes.
- Somente após o merge documental deve ser produzida uma instrução única e consolidada ao Executor, baseada nesta v3 e no estado então vigente da `main`.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da primeira E19.5 reduzida

- Archive/restore.
- Contract obrigatório para retirar `draft` ou concluir lifecycle `active | archived`.
- Implementação física obrigatória de código humano `LP-001`.
- Editor manual de conteúdo.
- Edição de seção ou melhoria parcial por IA.
- Chat de edição ou agente.
- Publicar/despublicar LP.
- Domínio público ou customizado.
- Overlay mutável para CTA ou binding dinâmico.
- Implementação de mensuração de conversões, tracking, analytics, tags, pixels ou APIs de eventos.
- Créditos, saldo ou carteira local.
- Duplicar configuração como ação mínima obrigatória.
- `Gerar nova variação` criando outra identidade da mesma LP.
- Teste A/B, distribuição de tráfego ou análise estatística.
- Comparação visual automatizada.
- Engine de experimentos, ranking ou escolha automática.
- Workflow com vários aprovadores.
- Agendamento de publicação.
- Exclusão definitiva.
- Catálogo ou gestão avançada de ofertas.
- Agente, job, fila, cron, webhook ou nova infraestrutura sem consumidor indispensável.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista/Analista Macro se a implementação exigir:
  - overwrite ou alteração de revisão histórica;
  - nova identidade de LP apenas para representar regeneração da mesma página;
  - rebind destrutivo do agregado E19.2;
  - E19.2 como fallback operacional concorrente após handoff;
  - segunda entidade concorrente de revisão/versão;
  - precriação/backfill massivo de configurações sem necessidade comprovada;
  - `placeholder`, `is_initialized` ou completude persistida como estado técnico para sustentar o desenho antigo;
  - duplicação integral dos validators/parsers semânticos TypeScript em SQL;
  - leitura account-wide de todo o histórico apenas para compor a lista principal;
  - limite arbitrário de LPs criado apenas para evitar estratégia de completude/paginação;
  - geração com versão E20.2 não exatamente autorizada pelo E20.6 para o taxon servido;
  - salvamento da mesma ação em duas residências sem garantia de atomicidade entre elas;
  - cópia automática de tabela, RPC, readiness, migration ou commit do #797 sem rejustificação pelo plano reduzido;
  - catálogo/entidade de ofertas sem fonte real aprovada;
  - capability ou limite comercial inventado localmente;
  - archive/restore, publicação, editor, hard delete, mensuração, teste A/B ou binding dinâmico para cumprir o workspace básico;
  - nova infraestrutura sem consumidor indispensável;
  - mudança funcional da geração E19.4 não prevista pelo contrato aprovado;
  - violação dos invariantes identidade ≠ revisão, latest ≠ approved ≠ future published ou configuração ≠ conteúdo.
- A primeira E19.5 reduzida termina quando a conta consegue trabalhar com várias identidades de LP, configurar somente quando necessário, gerar e consultar revisões append-only e aprovar explicitamente uma revisão pelo fluxo oficial, preservando histórico, tenant safety, completude das leituras, governança E20 e os boundaries existentes.
22/08/2026 — Plano-base v3 — E19.5 — Workspace operacional e lifecycle de LPs

## 1. Estado e decisões fixas

### 1.1. Identificação

- Recorte: `E19.5 — Workspace operacional e lifecycle de LPs`.
- Path canônico: `docs/lousa-plano-base-e19-5.md`.
- Estado: **plano-base v3 reduzido, com decisões humanas de produto e fechamentos técnicos consolidados em 22/08/2026; pronto para o item 4 de `docs/prompt-estrategista.md`; não autoriza merge nem execução automaticamente**.
- Decisão de convergência: **alternativa B — reduzir a primeira E19.5**.
- Estratégia de execução aprovada para B: futura implementação nova a partir da `main`, com reaproveitamento seletivo do PR #797 somente quando contrato, trecho ou caso de regressão continuar aderente.
- A v3 substitui materialmente a v1 vigente na `main` e o desenho técnico v2 proposto no PR #797.
- O PR #797 permanece congelado como evidência, protótipo técnico, catálogo de armadilhas e fonte seletiva até a incorporação desta v3; não fazer cherry-pick de commits completos nem copiar sua estrutura física por inércia.
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
- A E19.5 precisa distinguir **versão histórica do catálogo E20.2** de **versão operacional autorizada**: histórico preserva proveniência; operação deve evoluir quando uma nova versão executável for explicitamente autorizada pelo E20.6.
- Publicação, editor de conteúdo, melhoria parcial por IA, archive/restore, mensuração e testes A/B não são necessários para provar o ciclo operacional central.

### 1.3. Resultado esperado

- Transformar `/a/[account]` em workspace operacional simples para owner e admin elegíveis.
- Preservar o onboarding E19.2 como bootstrap da primeira jornada factual, sem segundo onboarding.
- Exibir uma entrada por identidade comercial de LP, sem transformar revisões em novas LPs.
- Permitir criar nova LP somente quando houver novo trabalho comercial.
- Criar configuração operacional somente quando realmente necessária, sem precriação massiva de configurações vazias.
- Permitir salvar configuração parcial, gerar novas revisões integrais, abrir revisão mais recente e revisões históricas em preview e aprovar explicitamente uma revisão existente.
- Fazer a configuração operacional de clientes existentes acompanhar a versão E20.2 explicitamente autorizada para o taxon, preservando valores válidos e expondo novos fields aplicáveis sem reescrever histórico.
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

### 1.5. Preservação da E19.2, handoff lazy e evolução do catálogo

- A E19.2 continua responsável pelo primeiro onboarding pós-entitlement e pelos fatos/configuração já persistidos no agregado `public.account_landing_page_onboarding_configurations`.
- O vínculo write-once existente não é rebindado nem reinterpretado como configuração genérica de todas as LPs.
- Para a primeira LP vinculada, valores válidos da E19.2 permanecem reutilizáveis como bootstrap.
- O handoff para a configuração operacional da E19.5 ocorre somente quando o fluxo realmente precisa dessa configuração.
- Não precriar configuração operacional vazia para todas as LPs nem fazer backfill massivo apenas para preparar o workspace.
- Ausência de residência operacional significa apenas que ainda não houve handoff/uso operacional daquela residência; não significa configuração inválida nem exige placeholder.
- Existência de residência operacional significa configuração real da E19.5, ainda que parcial.
- Completude é sempre derivada dos valores resolvidos contra o catálogo operacional autorizado, scopes, obrigações e condições aplicáveis; não existe booleano persistido equivalente a `is_initialized` ou `is_complete`.
- Uma LP legada sem configuração operacional continua sendo identidade válida; ao entrar em fluxo que exige configuração, inicializa-se somente o necessário, sem copiar valores específicos de outra LP.
- Para nova LP criada já no workspace operacional, a configuração necessária nasce no próprio fluxo de criação/edição, sem placeholder intermediário obrigatório.
- Retry do handoff é idempotente e não duplica residência nem reinterpreta E19.2.
- Após o handoff válido, a E19.2 permanece bootstrap/histórico e não vira fallback operacional concorrente.
- O `catalog_version` histórico persistido pela E19.2 ou por uma residência operacional registra proveniência da configuração em determinado momento; **não fixa permanentemente a experiência operacional do cliente naquela versão**.
- A implementação atual da E19.2 ainda possui `ACCOUNT_LANDING_PAGE_ONBOARDING_CATALOG_VERSION = 2`; isso é limitação técnica existente e não deve ser propagado como regra da E19.5.
- A E19.5 resolve a versão operacional explicitamente autorizada pelo E20.6, revalida valores existentes contra ela e apresenta novos fields aplicáveis a clientes existentes.
- Field novo obrigatório pode tornar a configuração operacional incompleta até preenchimento; isso não invalida nem reescreve configurações, snapshots ou revisões históricas anteriores.
- Não fazer backfill artificial de novos fields nem reescrever `catalog_version` histórico apenas porque nova versão foi autorizada; a próxima validação/save operacional pode atualizar a proveniência da residência para a versão então utilizada.
- Nenhuma atualização de configuração altera retroativamente revisão já materializada.

### 1.6. Configuração contextual da LP — decisão consolidada

- `account` e `business` representam informações compartilhadas e vivas da conta quando pertencem às fontes editáveis pelo workspace.
- `offer`, `campaign` e `landing_page` representam contexto que pode variar entre LPs conforme o catálogo E20.2 e o caso comercial.
- Fields de `offer` podem ser reutilizados quando continuam aplicáveis, mas não são presumidos como uma oferta global única para todas as LPs.
- Cada LP confirma ou ajusta os fields de `offer` aplicáveis ao seu contexto quando necessário; a E19.5 não cria catálogo, entidade ou gestão avançada de ofertas por antecipação.
- `campaign` e `landing_page` permanecem específicos da LP concreta.
- A separação conceitual também existe fisicamente no MVP:
  - uma residência 1:1 por conta para valores não autoritativos de `account/business`, usando como referência o protótipo `account_landing_page_shared_configurations` do #797;
  - uma residência 1:1 por LP para `offer/campaign/landing_page`, usando como referência o protótipo `account_landing_page_configurations` do #797.
- `business_offerings_summary` integra a evolução E20.2 v5 como field `universal`, scope `business`, opcional e string livre; fica na residência compartilhada e serve apenas como contexto/conveniência/prefill possível.
- `business_offerings_summary` **não é catálogo, whitelist ou autoridade de pertencimento**; `primary_service_or_offer` pode manter, modificar, especializar ou informar oferta ausente desse resumo.
- É proibido validar pertencimento de `primary_service_or_offer` a `business_offerings_summary`.
- O split físico é preservado; precriação, backfill amplo, placeholder, `is_initialized`, validator SQL duplicado e readiness do #797 não são herdados por consequência.
- Cada residência possui revisão técnica própria, monotônica e positiva, usada somente para concorrência otimista/proveniência; não é versão de conteúdo nem estado de produto.
- O `catalog_version` da residência representa a versão sob a qual aquele estado foi por último validado/persistido; não é pin operacional permanente.
- A residência compartilhada pode já existir por uso operacional anterior da conta; a residência por LP nasce somente quando a LP entra no fluxo que a necessita.
- Salvar configuração não cria revisão de conteúdo.
- Quando uma única ação `Salvar configuração` alterar simultaneamente as residências compartilhada e específica da LP, as duas mutações formam uma única unidade atômica: ambas são confirmadas ou nenhuma é persistida; conflito de revisão ou falha em qualquer residência aborta toda a operação.
- Configuração parcial pode ser preservada; somente a ação que depende de completude fica bloqueada.
- Uma nova geração resolve a configuração efetiva contra a versão operacional autorizada naquele momento e congela valores, fatos e proveniência utilizados no snapshot da nova revisão.
- Alterar configuração nunca modifica silenciosamente revisões históricas já materializadas.

### 1.7. E20.2 v5 — `primary_conversion_goal` e autoridade operacional

- A decisão anterior de `landing_page_objective` como string livre está **superada** e não integra mais a primeira E19.5.
- A evolução E20.2 v5 deve introduzir `primary_conversion_goal`:
  - camada `universal`;
  - scope `landing_page`;
  - origem humana da LP;
  - tipo `enum`;
  - obrigação `required`;
  - valores iniciais: `contact`, `schedule`, `request_quote`, `purchase`, `register_interest`.
- Semântica: `primary_conversion_goal` responde **qual conversão principal a LP pretende obter**.
- É distinta de:
  - `funnel_stage` — estágio da jornada;
  - `transaction_intent` — intenção específica do nicho;
  - `primary_service_or_offer` — o que está sendo ofertado;
  - `primary_conversion_channel` — por qual meio a conversão ocorre.
- `primary_conversion_goal` não é autoridade factual sobre preço, promessa, prova, credencial ou resultado; apenas estrutura o objetivo de conversão da LP.
- A v5 também introduz `business_offerings_summary` conforme 1.6, preservando v1–v4.
- Criar v5 não a torna automaticamente operacional: a E20.6 deve avaliar explicitamente a versão executável 5 para o taxon servido e somente decisão humana de suficiência pode registrar `reviewed_input_catalog_version = 5`.
- A **versão operacional autorizada** é a versão executável explicitamente requerida pelo consumidor e exatamente compatível com `reviewed_input_catalog_version`; é proibido usar `latest`, maior versão disponível ou fallback implícito.
- Quando v5 for autorizada para o taxon, clientes existentes passam a ser revalidados operacionalmente contra v5 e recebem `primary_conversion_goal`/`business_offerings_summary` quando aplicáveis, sem reescrever snapshots ou contratos históricos.
- Uma configuração historicamente v4 pode continuar registrada como v4 para proveniência e, ao mesmo tempo, ser operacionalmente incompleta sob v5 até o novo field obrigatório ser preenchido.

### 1.8. Identidade da LP, oferta, revisões e aprovação — decisão humana confirmada

- Princípio de produto: **a LP identifica um trabalho comercial; a revisão identifica uma evolução desse mesmo trabalho**.
- Cada conta pode possuir várias identidades de LP e cada LP pode possuir várias revisões imutáveis e append-only.
- Antes da primeira revisão válida, o núcleo comercial ainda pode ser corrigido.
- Depois da primeira revisão válida, integram o núcleo de identidade:
  - conta proprietária;
  - `funnel_stage`;
  - `transaction_intent`, quando aplicável ao taxon;
  - `primary_conversion_goal`;
  - oferta/caso de uso principal em seu significado, representado por `primary_service_or_offer`.
- Depois da primeira revisão válida:
  - mudar `funnel_stage` cria nova LP;
  - mudar `transaction_intent`, quando aplicável, cria nova LP;
  - mudar `primary_conversion_goal` cria nova LP;
  - alterar `primary_service_or_offer` exige confirmação humana explícita: `continua sendo o mesmo trabalho comercial?`;
  - se a resposta for **sim**, a alteração permanece na mesma LP e só chega ao conteúdo por nova revisão;
  - se a resposta for **não**, criar nova identidade de LP;
  - a primeira E19.5 não tenta decidir semanticamente a mudança de oferta por heurística ou IA.
- `business_offerings_summary` nunca decide identidade da LP e nunca restringe a oferta escolhida.
- Não integram o núcleo imutável: nome amigável, copy, títulos, imagens, estrutura visual, origem de tráfego/campanha, canal de conversão, destinos operacionais, detalhes factuais atualizados da mesma oferta, mensuração e escolhas de versão.
- Revisões são integrais, imutáveis e append-only dentro da mesma LP.
- Toda geração válida reutilizando E19.3 → E19.4 cria uma nova revisão da mesma LP; regeneração não cria nova `account_landing_pages`.
- **Versão mais recente** é a revisão válida de maior `revision_number`.
- **Versão aprovada** é uma revisão existente escolhida explicitamente por humano autorizado; aprovação não cria cópia nem nova revisão.
- Uma LP pode não possuir versão aprovada e no máximo uma revisão pode estar aprovada por vez.
- A solução física mínima para a escolha corrente é `approved_materialization_id uuid null` na própria `account_landing_pages`, apontando tenant-safe para uma materialização existente da mesma LP e conta por FK composta; não criar tabela de aprovação nem segunda entidade de versionamento.
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
- `primary_conversion_channel` permanece separado de `primary_conversion_goal`: canal é meio; goal é resultado comercial principal.
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
- A confirmação sobre mudança de `primary_service_or_offer` é humana e determinística na primeira E19.5; assistência futura por IA para sugerir se houve mudança de trabalho comercial fica fora do recorte.
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
- `docs/prompt-estrategista.md` — fluxo processual, checklist e item 4.
- `docs/lousa-plano-base-e19-2.md` — E20.2 como única fonte dos fields e E19.2 como bootstrap.
- `docs/lousa-plano-base-e20-2.md` e registry vigente — contrato declarativo versionado de inputs.
- `docs/lousa-plano-base-e20-6.md` — autoridade do gate de suficiência e de `reviewed_input_catalog_version`.
- `docs/lousa-plano-base-e19-5.md` v1 na `main` — autoridade canônica anterior evoluída neste mesmo arquivo.
- Histórico decisório do PR #801 — matriz de convergência, alternativa B, decisões humanas e pareceres técnicos; o artefato temporário foi removido do diff final, mas permanece rastreável nos commits do PR.
- PR #797 — somente como evidência técnica seletiva, regressões úteis e protótipo das duas residências, snapshot v2 e aprovação tenant-safe; não é autoridade executável desta v3.
- Implementação vigente de E19.2, E19.3 e E19.4 em `app/a/[account]/`, `lib/lp-builder/` e contratos adjacentes.
- `lib/lp-builder/contracts.ts` e `lib/lp-builder/adapters/onboardingConfigurationAdapterCore.ts` — evidência da limitação atual `ACCOUNT_LANDING_PAGE_ONBOARDING_CATALOG_VERSION = 2` e da separação entre configuração histórica e revalidação.
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
- Versão executável E20.2 requerida explicitamente pelo consumidor e exatamente compatível com `reviewed_input_catalog_version` do taxon.
- Versão histórica/proveniência das residências existentes, quando houver.
- Valores compartilhados válidos de `account/business`, incluindo `business_offerings_summary` quando fornecido.
- Fields de `offer` aplicáveis ao contexto da LP, incluindo `primary_service_or_offer`.
- Valores específicos de `campaign/landing_page`, incluindo `primary_conversion_goal` antes da geração.
- Fatos E19.2 legitimamente reutilizáveis como bootstrap da primeira LP vinculada.
- Identidade da LP.
- Revisões materializadas e snapshots.
- Referência da versão aprovada, quando existir.

#### 2.1.3. Processamento

- Resolver server-side conta, ator, entitlement, taxon e versão operacional autorizada do catálogo antes de expor ou mutar dados operacionais.
- Revalidar valores existentes contra a versão operacional autorizada, preservando valores ainda válidos e projetando novos fields aplicáveis sem backfill artificial.
- Derivar completude a partir do catálogo operacional autorizado; field novo obrigatório ausente torna a configuração incompleta, sem invalidar histórico.
- Listar LPs usando identidade e resumo suficiente para a tela principal, sem carregar o histórico completo de todas as LPs da conta.
- Garantir ausência de truncamento silencioso da coleção de identidades; paginação, cursor ou carregamento progressivo são aceitáveis desde que o contrato de completude da superfície seja explícito.
- Inicializar configuração operacional de forma lazy quando a LP entrar em fluxo que a exige.
- Reutilizar valores compartilhados válidos sem copiá-los desnecessariamente por LP.
- Para LP sem configuração própria anterior, não importar valores específicos de outra LP.
- Não usar `business_offerings_summary` como whitelist de oferta.
- Permitir salvamento parcial e bloquear somente a geração enquanto houver requisito aplicável ausente ou inválido.
- Ao alterar `primary_service_or_offer` depois da primeira revisão válida, solicitar confirmação humana sobre continuidade do mesmo trabalho comercial antes de persistir a decisão de identidade.
- Gerar nova revisão somente por ação humana explícita, reutilizando E19.3 → E19.4.
- Preservar qualquer versão aprovada quando revisão nova for gerada.
- Carregar histórico somente no contexto da LP aberta, com ordenação determinística e paginação/completude adequadas.
- Na geração, congelar no contexto/snapshot os valores/fatos efetivamente usados, a versão executável E20.2 utilizada e as identidades técnicas das duas residências, incluindo `sharedRevision` e `landingPageRevision`; esses números provam proveniência, não versionam o conteúdo.

#### 2.1.4. Validação

- Validar pertencimento tenant-safe da LP e da revisão antes de qualquer leitura ou mutação sensível.
- Validar autorização do ator server-side.
- TypeScript server-side é a autoridade de parsing, normalização e validação semântica dos valores configuráveis, reutilizando o catálogo/validators canônicos.
- Persistir uma forma canônica única depois da normalização; o banco protege shape persistido, tenant, PK/FK, unicidade, atomicidade, concorrência e referências persistentes sem reproduzir um segundo parser semântico completo.
- Não aceitar divergência silenciosa em que runtime considera valor semanticamente válido e a persistência exige outra representação equivalente; URLs e demais tipos normalizáveis devem chegar ao banco na forma canônica escolhida pelo boundary server-side.
- Aplicar apenas normalizações justificadas pelo contrato do tipo; não aplicar lower-case indiscriminado nem transformação semântica de conteúdo humano.
- Exigir `primary_conversion_goal` válido antes de gerar quando a versão operacional autorizada o contiver.
- Impedir validação de pertencimento entre `primary_service_or_offer` e `business_offerings_summary`.
- Impedir mistura de valores específicos entre LPs ou contas.
- Mudança de `funnel_stage`, `transaction_intent` aplicável ou `primary_conversion_goal` depois da primeira revisão válida exige nova identidade de LP.
- Mudança de `primary_service_or_offer` depois da primeira revisão válida exige confirmação humana `mesmo trabalho comercial?`; não inferir semanticamente no MVP.
- Aprovação exige revisão válida da mesma LP e conta.
- Impedir alteração/overwrite de revisão histórica.
- Se a geração requer E20.2 v5, exigir `reviewed_input_catalog_version = 5` no taxon servido; ausência ou divergência falha fechado.
- P1 do #797 permanece invariante desta fronteira de validação, não patch daquele PR.
- P2 do #797 permanece invariante de completude das LPs e das coleções consumidas, não patch daquele PR.

#### 2.1.5. Persistência

- A identidade da LP permanece no agregado vigente `public.account_landing_pages`; não criar segunda entidade de identidade.
- Revisões permanecem em `public.account_landing_page_materializations` no contrato append-only 1:N já implementado; não criar segunda entidade de versão.
- A E19.2 permanece intacta como bootstrap/histórico e não é rebindada.
- A configuração operacional usa duas residências físicas tenant-safe:
  - uma 1:1 por conta para valores não autoritativos de `account/business`;
  - uma 1:1 por LP para `offer/campaign/landing_page`.
- Cada residência guarda somente valores do seu escopo, `catalog_version` de proveniência da última validação/save, revisão técnica monotônica para concorrência/proveniência, autoria e timestamps mínimos.
- `catalog_version` persistido na residência não constitui pin permanente da versão operacional.
- A versão operacional autorizada é resolvida separadamente a partir da governança E20.6; a leitura efetiva combina essa definição atual com os valores persistidos.
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
- Detalhe da LP consome identidade + configuração efetiva resolvida contra a versão operacional autorizada + resumo das revisões/estado necessário à ação corrente.
- Histórico consome somente revisões da LP aberta e pode paginar sob demanda.
- Preview padrão abre a versão mais recente; preview histórico abre a revisão escolhida sem alterar estado.
- Ação `Aprovar esta versão` atua sobre revisão existente visualizada.
- E19.3 consome configuração operacional após o handoff; E19.2 não permanece como fallback concorrente.
- E19.4 continua responsável por attempt, geração, materialização append-only, renderer e preview.
- O snapshot da revisão evolui de forma versionada para preservar versão E20.2 efetivamente usada, `sharedRevision` e `landingPageRevision`, sem regravar snapshots históricos já válidos.

#### 2.1.7. Fallback

- Falha de leitura mantém estado indisponível explícito; não apresentar coleção truncada como completa.
- Falha de inicialização lazy não cria configuração parcial invisível nem usa E19.2 como fallback concorrente.
- Falha de salvamento preserva valores válidos anteriores e informa o contexto afetado.
- Falha em salvamento que envolva as duas residências preserva integralmente os estados anteriores de ambas; não existe sucesso parcial da mesma ação.
- Configuração parcial permanece editável, mas não gera enquanto faltar requisito obrigatório aplicável da versão operacional autorizada.
- Nova versão E20.2 ainda não autorizada pelo E20.6 não altera a experiência operacional do taxon.
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
- Slug, configuração extensa e histórico completo ficam no detalhe da LP quando não forem necessários na lista.
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
- A configuração usa fields, scopes, obrigação e validação canônicos da versão E20.2 operacional autorizada, sem lista paralela inventada.
- `account/business` aparecem como informações compartilhadas quando editáveis pelo fluxo vigente.
- `business_offerings_summary`, quando existir na versão autorizada, aparece como resumo opcional do negócio e nunca restringe `primary_service_or_offer`.
- Fields de `offer` podem ser reutilizados, mas a LP confirma/ajusta os aplicáveis ao contexto; a UX não presume oferta global única.
- `campaign/landing_page` pertencem à LP concreta.
- `primary_conversion_goal` aparece como enum explícito da LP e requisito de completude quando presente na versão autorizada.
- Clientes existentes recebem novos fields aplicáveis quando uma nova versão for autorizada; valores válidos antigos permanecem preenchidos.
- Valores cuja autoridade pertença a outro domínio permanecem somente leitura quando a E19.5 não for boundary autorizado de edição.
- Salvar permite estado parcial e devolve erro junto do contexto afetado.
- Alterar configuração não altera revisão histórica; efeito sobre conteúdo ocorre somente por nova geração.
- A UI não expõe `revision` técnico das residências como versão de produto; esse identificador serve apenas a concorrência/proveniência.

### 2.4. Semântica das ações

#### 2.4.1. Nova LP

- Cria nova identidade comercial somente quando o usuário realmente deseja outro trabalho comercial.
- Abre o fluxo de configuração da nova LP sem exigir precriação de configuração antes da ação humana.
- Reutiliza somente valores compartilhados legitimamente aplicáveis.
- Pode usar `business_offerings_summary` como contexto/prefill, mas nunca como limite da oferta.
- Coleta/valida os fields específicos da versão operacional autorizada necessários para `offer/campaign/landing_page`.
- Não exige configuração completa para criar a identidade nem para salvar parcialmente.
- Não inicia geração automaticamente.
- Não copia revisão, snapshot ou valores específicos de outra LP.

#### 2.4.2. Salvar configuração

- Não chama IA e não cria revisão de conteúdo.
- Valida/normaliza server-side pelos contratos da versão operacional autorizada antes da persistência.
- Preserva valores existentes ainda válidos; novos fields ausentes permanecem simplesmente ausentes até preenchimento.
- Persiste somente valores pertencentes ao contexto autorizado da LP ou às fontes compartilhadas editáveis pelo workspace.
- Pode preservar configuração parcial.
- Se a ação alterar compartilhado e contextual ao mesmo tempo, as duas alterações são executadas atomicamente na mesma transação: ambas são persistidas ou nenhuma é; conflito de revisão ou erro em qualquer residência aborta toda a operação.
- Incrementa somente a revisão técnica da residência efetivamente alterada; no-op idempotente não precisa produzir nova revisão técnica.
- O save pode atualizar `catalog_version` de proveniência da residência para a versão operacional usada naquela validação, sem reescrever histórico anterior.
- Revisões de conteúdo já materializadas permanecem integralmente inalteradas.

#### 2.4.3. Gerar nova revisão

- Exige ação humana explícita e configuração completa/válida para a versão operacional autorizada.
- Exige `primary_conversion_goal` válido quando o field estiver presente na versão autorizada.
- Exige versão executável E20.2 explicitamente autorizada pelo E20.6 para o taxon servido; para a v5, exige `reviewed_input_catalog_version = 5`.
- Reutiliza E19.3 → E19.4.
- Uma geração válida cria nova revisão integral e imutável da mesma LP.
- A revisão congela conteúdo, binding, versão E20.2 efetivamente utilizada, valores/fatos usados e proveniência das duas residências operacionais (`sharedRevision` e `landingPageRevision`).
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
- Metadados técnicos e versão histórica E20.2 preservados no snapshot continuam disponíveis para auditoria quando fizer sentido, sem obrigar exposição na UX principal.
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
  - evolução de cliente existente para nova versão operacional autorizada sem reescrita de histórico;
  - novos fields aplicáveis visíveis e novos obrigatórios refletidos na completude;
  - `business_offerings_summary` sem comportamento de whitelist;
  - `primary_conversion_goal` obrigatório na v5 e separado do canal;
  - confirmação humana em mudança de `primary_service_or_offer` após primeira revisão válida;
  - gate E20.6 fail-closed para a versão E20.2 requerida;
  - salvamento atômico quando a mesma ação altera as duas residências;
  - snapshot com versão E20.2 e proveniência das duas residências;
  - histórico por LP com preview da versão mais recente e histórica;
  - aprovação explícita e preservação da aprovação ao gerar revisão posterior;
  - lista de LPs sem truncamento silencioso;
  - isolamento tenant-safe.

### 2.7. Riscos e dependências

- O rollout técnico vigente tolera `draft | active | archived`; a primeira E19.5 reduzida não deve concluir lifecycle por inércia nem reverter o expand já aplicado.
- O agregado E19.2 não pode ser rebindado nem reinterpretado como configuração genérica de todas as LPs.
- `ACCOUNT_LANDING_PAGE_ONBOARDING_CATALOG_VERSION = 2` é limitação atual da E19.2; a E19.5 não pode adotar esse pin como autoridade operacional.
- A inicialização lazy precisa provar idempotência e ausência de fallback operacional concorrente após handoff.
- As duas residências físicas precisam preservar isolamento tenant-safe e scopes disjuntos sem reintroduzir o desenho eager.
- Toda ação única que altere ambas as residências precisa preservar atomicidade entre elas; nenhum estado intermediário compartilhado/contextual pode ser confirmado como resultado parcial.
- E20.2 v5 precisa introduzir `primary_conversion_goal` e `business_offerings_summary`, substituindo a hipótese anterior de `landing_page_objective`.
- A E20.2 v5 somente entra na operação do taxon depois de avaliação E20.6 da versão executável 5 e decisão humana de suficiência; `reviewed_input_catalog_version` divergente mantém o fluxo fail-closed.
- Autorizar versão nova pode tornar configurações existentes incompletas por novos obrigatórios; isso é evolução normal do produto, não motivo para manter cliente preso à versão histórica.
- TypeScript server-side e catálogo/validators canônicos permanecem autoridade semântica; o banco não reconstrói parser completo em SQL.
- A forma persistida precisa ser canônica para impedir a classe de divergência demonstrada pelo P1 de URL do #797.
- A coleção de identidades e cada histórico consumido precisam de estratégia explícita contra truncamento silencioso, preservando o invariante demonstrado pelo P2 do #797.
- A aprovação precisa preservar FK tenant-safe e idempotência sem criar segunda entidade de versionamento.
- O snapshot precisa evoluir versionadamente para registrar versão E20.2 e as duas revisões técnicas usadas sem invalidar snapshots históricos E19.4.
- E19.3 continua pacote autorizado e passa a consumir a configuração operacional após handoff; E19.4 continua canônica para geração, append, renderer e preview.
- E21.2 continua autoridade de modelo/reasoning dos workloads existentes; a E19.5 não cria configuração paralela.
- Alterações futuras de configuração não podem alterar revisões já materializadas.
- O binding do CTA permanece parte da revisão na primeira E19.5.
- Publicação futura deve distinguir versão mais recente, aprovada e publicada sem reconstruir o versionamento.
- Limites comerciais de geração continuam dependentes da E9.7 e do consumidor real.
- Qualquer estrutura, teste ou trecho reaproveitado do #797 deve ser revalidado contra este plano; testes de placeholder, `is_initialized`, `landing_page_objective` ou archive/restore não são herdados apenas porque já existem.

## 3. Fases e próxima ação

### 3.1. E19.5.3 — Workspace operacional reduzido, configuração e aprovação da LP

- Automação: não.
- Objetivo:
  - implementar o ciclo operacional central para múltiplas LPs com identidade estável, configuração lazy/contextual, evolução declarativa do catálogo, revisões append-only, histórico/preview sob demanda e aprovação humana.
- Entrega mínima:
  - evolução versionada do E20.2 v5 com `primary_conversion_goal` enum obrigatório e `business_offerings_summary` opcional;
  - remoção da hipótese não implementada `landing_page_objective` do contrato E19.5/v5;
  - gate explícito E20.2 v5 → E20.6 → somente então operação/geração autorizada com v5;
  - distinção entre `catalog_version` histórico/proveniência e versão operacional autorizada;
  - clientes existentes revalidados contra nova versão autorizada, preservando valores válidos e histórico;
  - duas residências físicas tenant-safe, uma compartilhada por conta e outra contextual por LP, ambas criadas somente quando necessárias;
  - ausência de placeholder/`is_initialized`; completude derivada dos valores;
  - revisão técnica independente por residência para concorrência/proveniência;
  - salvamento atômico das duas residências quando alteradas pela mesma ação;
  - `business_offerings_summary` sem semântica de catálogo/whitelist;
  - confirmação humana de continuidade do trabalho comercial ao alterar `primary_service_or_offer` após a primeira revisão válida;
  - `campaign/landing_page` associados à LP concreta;
  - workspace com uma entrada por identidade e resumo suficiente;
  - lista de identidades sem truncamento silencioso;
  - histórico carregado por LP sob demanda;
  - preview da versão mais recente e de revisão histórica;
  - ação `Gerar nova revisão` pelo boundary vigente E19.3 → E19.4;
  - snapshot versionado preservando versão E20.2, `sharedRevision` e `landingPageRevision` efetivamente usados;
  - `approved_materialization_id` tenant-safe e idempotente na identidade da LP;
  - ação `Aprovar esta versão`;
  - estados de UX derivados;
  - preservação da definição de LP entregue;
  - migration mínima somente para as estruturas indispensáveis ao contrato reduzido.
- Limites:
  - sem precriação/backfill operacional massivo;
  - sem pin permanente de catálogo por cliente;
  - sem placeholder ou `is_initialized`;
  - sem parser semântico completo duplicado em SQL;
  - sem validação oferta ∈ `business_offerings_summary`;
  - sem IA/heurística para decidir mudança semântica de oferta;
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
  - versão histórica e versão operacional autorizada têm semânticas distintas;
  - cliente existente recebe novos fields de versão autorizada sem reescrita de snapshot/revisão histórica;
  - novo field obrigatório ausente torna a configuração incompleta até preenchimento;
  - owner/admin autorizado executa somente ações permitidas;
  - uma linha/card representa cada identidade comercial, sem multiplicar LP por revisão;
  - listagem de identidades não depende de coleção truncada tratada como completa;
  - `business_offerings_summary` não restringe `primary_service_or_offer`;
  - `primary_conversion_goal` é obrigatório na v5, usa somente os enums aprovados e permanece separado de `primary_conversion_channel`;
  - mudança de `funnel_stage`, `transaction_intent` aplicável ou `primary_conversion_goal` após primeira revisão válida cria nova LP;
  - mudança de `primary_service_or_offer` após primeira revisão válida exige confirmação humana; `sim` mantém LP e requer nova revisão para refletir conteúdo, `não` cria nova identidade;
  - geração com E20.2 v5 falha fechado até `reviewed_input_catalog_version = 5` para o taxon servido;
  - parsing/normalização/semântica têm autoridade server-side única e persistência recebe forma canônica;
  - salvar configuração não cria revisão de conteúdo nem altera histórico;
  - se a mesma ação de save altera as duas residências, conflito ou erro em qualquer uma faz rollback integral e nenhuma mudança parcial persiste;
  - nova geração cria revisão integral append-only da mesma LP;
  - snapshot registra versão E20.2, valores/contexto e revisões técnicas compartilhada e específica da LP usadas na geração;
  - versão aprovada anterior permanece até nova aprovação humana;
  - histórico de uma LP pode ser carregado/paginado sem carregar todos os históricos da conta;
  - qualquer revisão válida da LP pode ser aberta em preview;
  - aprovação pelo ponteiro tenant-safe não cria revisão e mantém no máximo uma escolha aprovada por LP;
  - invariantes identidade ≠ revisão, latest ≠ approved ≠ future published e configuração ≠ conteúdo permanecem preservados;
  - verificadores/testes proporcionais e `npm run check` aprovam o contrato;
  - evidência hospedada aprova desktop, tablet, mobile, teclado, foco e fluxos humanos previstos;
  - Prompt ABC reconcilia roadmap e documentos canônicos materialmente afetados durante a implementação.

### 3.2. Próxima ação

- A decisão humana B, os relatórios de evolução histórica × operacional e a nova autoridade universal de conversão estão reconciliados nesta v3.
- A decisão anterior sobre `landing_page_objective` está formalmente superada por `primary_conversion_goal`.
- O plano-base v3 não autoriza merge ou execução automaticamente.
- Conforme `docs/prompt-estrategista.md`, o próximo passo é o **item 4 — escolha humana entre Processo atual e Processo automatizado**.
- Não enviar instrução ao Executor baseada no PR #797, na matriz temporária ou em versões anteriores do plano.
- O caminho posterior até merge, especialistas, v2 e execução será definido exclusivamente pelo processo escolhido no item 4.

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
- IA/heurística para decidir se mudança de `primary_service_or_offer` representa novo trabalho comercial.
- Catálogo/whitelist de ofertas derivado de `business_offerings_summary`.
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

- Parar e devolver ao Estrategista se a implementação exigir:
  - overwrite ou alteração de revisão histórica;
  - pin permanente de cliente na versão histórica E20.2 como forma de evitar novos fields autorizados;
  - adoção implícita de `latest`/maior versão E20.2 sem autorização E20.6;
  - nova identidade de LP apenas para representar regeneração da mesma página;
  - decisão automática sobre mudança semântica de `primary_service_or_offer` no primeiro MVP;
  - validação de pertencimento entre oferta da LP e `business_offerings_summary`;
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
  - capability ou limite comercial inventado localmente;
  - archive/restore, publicação, editor, hard delete, mensuração, teste A/B ou binding dinâmico para cumprir o workspace básico;
  - nova infraestrutura sem consumidor indispensável;
  - mudança funcional da geração E19.4 não prevista pelo contrato aprovado;
  - violação dos invariantes identidade ≠ revisão, latest ≠ approved ≠ future published ou configuração ≠ conteúdo.
- A primeira E19.5 reduzida termina quando a conta consegue trabalhar com várias identidades de LP, evoluir sua configuração contra a versão E20.2 autorizada, configurar somente quando necessário, gerar e consultar revisões append-only e aprovar explicitamente uma revisão pelo fluxo oficial, preservando histórico, tenant safety, completude das leituras, governança E20 e os boundaries existentes.
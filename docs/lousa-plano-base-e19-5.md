20/08/2026 — Plano-base v2 — E19.5 — Workspace operacional e lifecycle de LPs

## 1. Estado e decisões fixas

### 1.1. Identificação

- Recorte: `E19.5 — Workspace operacional e lifecycle de LPs`.
- Path: `docs/lousa-plano-base-e19-5.md`.
- Estado: **plano-base v2 consolidado para avaliação do Analista; implementação ainda não iniciada**.
- Fonte imutável: plano-base v1 do PR #726, merge commit `5d36f2bb4528d4ccb1d34018ae1e3940d2219d28`, congelado no commit `d260a82bf3e121e8be3f17a24229ecbd54f829ff` e blob `ddf5595854023c54a15d38851f0f6d22a146f0a0`.
- Destino da orquestração: worktree `C:\Dev\GitHub\LP-Factory-10-e19` e branch `codex-app/e19-5-orquestracao` para v2, roadmap e implementação.
- Exceção de rollout autorizada: antes da retomada da E19.5, um PR dedicado contra `main` entrega somente o expand backward-compatible indispensável; depois de merge, apply, deployment e validação hospedada do precursor, a branch da E19.5 incorpora essa dependência material e retoma o fluxo. O contract definitivo permanece em PR posterior, condicionado à implantação e validação hospedada do runtime funcional da E19.5.
- A v1 anterior deste mesmo arquivo, baseada em drafts independentes, foi superada materialmente pela evolução E19.4 para revisões append-only 1:N e pelas decisões humanas posteriores.
- Plano conceitual: N/A.
- Processo: `docs/prompt-estrategista.md`.
- PR vivo: #726.
- Predecessores materiais: E19.1, E19.2, E19.3 e E19.4 implementadas no fluxo oficial da conta.

### 1.2. Problema comprovado

- A E19.4 comprovou o pipeline de geração, validação, revisões append-only, renderer e preview privado da primeira LP real.
- `landing_page` representa uma identidade comercial estável com múltiplas revisões imutáveis; o modelo anterior do #726, baseado em drafts independentes para cada variação, não deve ser implementado.
- `public.account_landing_pages.status` ainda aceita somente `draft`, significado insuficiente para representar o lifecycle da identidade depois da existência de revisões.
- A superfície `/a/[account]` precisa evoluir de continuação do onboarding para workspace operacional da conta.
- O usuário precisa organizar várias LPs sem poluir a lista principal, configurar cada LP no contexto correto, gerar novas revisões sem destruir as anteriores, visualizar o histórico e escolher explicitamente qual revisão está aprovada.
- Publicação, editor de conteúdo, melhoria parcial por IA e testes A/B são evoluções distintas e não devem ser antecipados para resolver o workspace básico.

### 1.3. Resultado esperado

- Transformar `/a/[account]` em um workspace operacional simples para owner e admin elegíveis.
- Preservar o onboarding inicial da E19.2 para a primeira jornada factual.
- Exibir **uma linha por LP comercial**, sem transformar revisões em novas identidades de LP.
- Permitir criar nova LP somente quando houver nova identidade comercial.
- Permitir configurar a LP, salvar configuração parcial, gerar novas revisões integrais, abrir qualquer revisão em preview e aprovar explicitamente uma revisão existente.
- Permitir arquivar e restaurar LPs sem exclusão definitiva.
- Manter publicação separada do lifecycle da identidade e do versionamento; publicação não integra a primeira implementação da E19.5.
- Manter editor manual de conteúdo e melhoria parcial por IA fora da primeira implementação.

### 1.4. Atores e gates

- Somente membership `active` com papel `owner` ou `admin` pode alterar configuração, criar LP, iniciar geração, aprovar revisão, arquivar ou restaurar.
- A conta deve estar `active` e possuir entitlement comercial válido para as ações que dele dependem.
- O taxon primário ativo permanece autoritativo onde o fluxo vigente o exige.
- Toda ação mutável revalida conta, membership e entitlement server-side e deriva `accountId` e ator do contexto autenticado.
- Conta piloto e clientes usam o mesmo workspace e os mesmos boundaries.
- A E19.5 não inventa capability comercial, carteira, saldo ou limite local de gerações; capacidades e limites comerciais continuam sob a E9.7 quando houver consumidor real.

### 1.5. Preservação da E19.2

- A E19.2 continua responsável pelo primeiro onboarding pós-entitlement e pela configuração factual já persistida no agregado `public.account_landing_page_onboarding_configurations`.
- O vínculo write-once existente não é rebindado nem reinterpretado como histórico de revisões ou configuração genérica de todas as LPs.
- Para a primeira LP, os valores já coletados e válidos permanecem utilizáveis conforme o vínculo existente.
- O workspace reutiliza fatos válidos já coletados e não cria segundo onboarding.
- Para novas LPs, o workspace solicita somente confirmações ou valores necessários ao contexto daquela LP, preservando a E19.2 como bootstrap da primeira jornada.
- Nenhuma atualização de configuração altera retroativamente revisão já materializada.

### 1.6. Configuração contextual da LP — bloco encerrado

- `account` e `business` representam informações compartilhadas e vivas da conta quando pertencem às fontes editáveis pelo workspace.
- Fields de `offer` podem ser reutilizados quando continuam aplicáveis à nova LP, mas **não são presumidos como uma oferta global única para todas as LPs da conta**.
- Cada LP confirma ou ajusta os fields de `offer` aplicáveis ao seu contexto quando necessário; a E19.5 não cria catálogo, entidade ou gestão avançada de ofertas por antecipação.
- `campaign` e `landing_page` são específicos da LP concreta.
- Salvar configuração não cria revisão de conteúdo.
- Configuração parcial pode ser preservada; somente a ação que depende de completude fica bloqueada.
- Uma nova geração resolve a configuração efetiva vigente naquele momento pelas autoridades canônicas aplicáveis e congela os fatos/contexto utilizados no snapshot da nova revisão.
- Alterar configuração nunca modifica silenciosamente revisões históricas já materializadas.
- Após o vínculo, o agregado E19.2 permanece bootstrap e histórico, mas deixa de ser leitor operacional concorrente.
- Valores não autoritativos de `account/business` residem em configuração compartilhada 1:1 por conta; valores de `offer/campaign/landing_page` residem em configuração 1:1 por LP.
- O handoff do onboarding divide os valores por `entry.scope` sem rebind, cópia indevida entre scopes ou segunda fonte operacional.

### 1.7. `landing_page_objective`

- A E19.5 adota `landing_page_objective` como input explícito da LP, a ser incorporado de forma versionada ao catálogo E20.2 sem alterar versões anteriores.
- O field pertence ao scope `landing_page`, recebe valor humano e deve ser string não vazia.
- O objetivo não é obrigatório para criar a identidade da LP nem para salvar configuração parcial.
- O objetivo é obrigatório para a LP ficar `Pronta para gerar` e participar de nova geração.
- Alterar o objetivo não modifica revisões existentes; o novo objetivo só chega ao conteúdo executável após nova geração.
- O objetivo é intenção editorial e comercial: orienta foco, público, progressão e ação desejada, mas não é autoridade factual.
- O objetivo não autoriza preço, credencial, resultado, prova social, superioridade ou promessa sem suporte nas fontes factuais vigentes.
- Rótulo de UX recomendado: `Objetivo desta página`.
- A implementação cria o catálogo E20.2 v5 por cópia profunda da v4, preserva v1–v4 e acrescenta somente `landing_page_objective` ao final, com scope `landing_page`, origem humana, string não vazia, obrigação `required`, política de substituição `not_applicable` e disponibilidade em Starter, Lite, Pro e Ultra.
- O field entra no contexto como orientação semântica consultiva e nunca autoriza fato, preço, credencial, prova, promessa ou resultado.
- A geração permanece fail-closed até a E20.6 aceitar e registrar explicitamente `reviewed_input_catalog_version = 5` para o taxon servido.

### 1.8. Lifecycle da LP, revisões e aprovação — bloco encerrado

- `landing_page` é a identidade comercial estável da página.
- O lifecycle da identidade da LP será `active | archived`; `published` não pertence a esse mesmo status.
- `draft` deixa de ser estado de produto da identidade da LP. O termo fica reservado, futuramente, para trabalho mutável ainda não consolidado em nova revisão.
- Revisões são integrais, imutáveis e append-only dentro da mesma LP.
- Toda geração válida da E19.4 cria diretamente uma nova revisão imutável na primeira E19.5, pois ainda não existe editor mutável de conteúdo.
- **Versão mais recente** é a revisão válida de maior `revision_number`.
- **Versão aprovada** é uma revisão existente escolhida explicitamente por humano autorizado; a aprovação não cria cópia, nova revisão nem nova entidade de versão.
- Uma LP pode não possuir versão aprovada.
- No máximo uma revisão pode estar aprovada por vez para a mesma LP.
- Aprovar uma nova revisão transfere a escolha; a revisão anteriormente aprovada permanece preservada no histórico.
- Gerar nova revisão não remove nem substitui automaticamente a revisão aprovada.
- **Versão publicada** será, futuramente, a revisão explicitamente colocada no ar; ela é independente da versão mais recente e da versão aprovada.
- A publicação futura pode manter uma revisão anterior no ar enquanto revisões posteriores são geradas e avaliadas.
- **LP entregue é uma LP que possui uma revisão válida, acessível em preview e explicitamente aprovada por humano autorizado.** Publicação não é requisito para caracterizar entrega.
- A versão aprovada é persistida somente por `approved_materialization_id` nullable em `account_landing_pages`, com FK composta tenant-safe para uma revisão da mesma LP e conta; não existe entidade concorrente de versionamento.
- A aprovação ocorre por RPC idempotente sob lock da LP operacional (`draft | active` até o contract, somente `active` depois dele), reutiliza a mesma validação que torna a revisão visualizável e nunca cria cópia ou revisão.

### 1.9. Arquivamento e transição do `draft` atual

- Arquivar retira a LP da lista operacional principal sem excluir identidade, configuração, revisões, versão aprovada ou histórico.
- A UI oferece visualização simples de LPs arquivadas e ação de restauração.
- Restaurar devolve a mesma identidade à operação; não cria nova LP nem nova revisão.
- Exclusão definitiva não integra a primeira E19.5.
- A transição física de `draft` para `active | archived` deve ser coordenada porque o contrato vigente possui consumidores explícitos de `draft`, incluindo constraint de banco, append de revisão, adapters, validações e preview.
- A implementação atualiza os consumidores materialmente afetados sem reabrir a E19.4 nem renomear indiscriminadamente arquivos, workloads ou identificadores históricos que contenham `draft` mas continuem semanticamente válidos.
- Durante o rollout, `LandingPageStatus` passa transitoriamente a `draft | active | archived` em `lib/types/status.ts`; somente o contract posterior o restringe a `active | archived` depois de eliminar consumidores e linhas dependentes de `draft`.
- Novas gerações usam `LandingPageGenerationContext` v4 para LP operacional `draft | active` e `LandingPageGenerationContextSnapshot` v2 com versões/revisões separadas das configurações compartilhada e específica da LP.
- `LandingPageGenerationContext` v3 e `LandingPageGenerationContextSnapshot` v1 permanecem variantes históricas read-only; as revisões existentes não são regravadas, e nomes `draft` permanecem somente quando ainda designam candidata pré-materialização ou workload histórico.

### 1.10. Configuração operacional e bindings

- Tracking, analytics, Google Ads tag, Meta Pixel e configurações técnicas equivalentes não pertencem ao versionamento de conteúdo da LP.
- Na primeira E19.5, o destino operacional do CTA permanece congelado dentro do binding da revisão, conforme o contrato vigente.
- Alterar WhatsApp ou URL na configuração não modifica revisões históricas.
- Para o novo destino integrar o conteúdo executável na primeira E19.5, é necessária uma nova revisão gerada com o novo binding.
- A E19.5 não cria overlay mutável, binding dinâmico ou nova fonte operacional para sobrepor revisões existentes.
- A futura separação do destino operacional do CTA permanece evolução possível, condicionada a contrato próprio.

### 1.11. Automação, consumo de IA e compatibilidade futura

- Automação nova na E19.5: **não**.
- A ação humana `Gerar nova revisão` reutiliza o boundary vigente da E19.4 e seus workloads; a E19.5 não cria agente, job, fila, nova automação, novo prompt, novo modelo ou novo workload.
- Nova LP, salvar configuração, abrir preview, abrir histórico, aprovar versão, arquivar e restaurar não chamam IA.
- A quantidade de chamadas técnicas internas da E19.4 não cria várias ações comerciais na UX; o usuário aciona uma única geração de nova revisão.
- Controle comercial futuro de consumo deve reutilizar E9.7; carteira ou contabilização específica só entra quando houver requisito concreto e recorte próprio.
- A E19.5 não implementa testes A/B nem antecipa engine, tracking, distribuição de tráfego ou análise estatística de experimentos.
- Revisões imutáveis, identificáveis e visualizáveis permanecem compatíveis com um futuro recorte de experimentação que possa referenciá-las, sem transformar cada revisão em variante automaticamente.

### 1.12. Fontes usadas

- `README.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/prompt-estrategista.md`.
- `docs/orquestracao-plano-base.md`.
- `docs/prompt-abc.md`.
- `docs/schema.md`.
- implementação vigente de `app/a/[account]/`, `lib/lp-builder/` e catálogo E20.2.
- migrations, RPCs e validações vigentes da E19.1/E19.2/E19.4.
- PR #726 como histórico do debate anterior reconciliado neste mesmo arquivo.
- `docs/lp-planejamento.md` não é fonte deste plano.

## 2. Contrato do caso

### 2.1. Fluxo lógico

#### 2.1.1. Gatilho

- Conta operacional com onboarding inicial aplicável concluído.
- Owner ou admin autenticado abre `/a/[account]`.
- O usuário consulta suas LPs, cria nova LP, altera configuração permitida, gera nova revisão, abre preview, aprova versão, arquiva ou restaura.

#### 2.1.2. Entrada

- Contexto tenant-aware da conta e do ator.
- Entitlement efetivo e plano aplicável.
- Taxon autoritativo quando exigido pelo fluxo vigente.
- Catálogo E20.2 resolvido conforme o contrato vigente.
- Valores compartilhados válidos de `account/business`.
- Fields de `offer` aplicáveis e confirmados para o contexto da LP.
- Valores específicos de `campaign/landing_page`, incluindo `landing_page_objective` antes da geração.
- Fatos já persistidos pela primeira jornada E19.2 quando legitimamente reutilizáveis.
- Identidade da LP.
- Revisões materializadas e respectivos snapshots.
- Referência da versão aprovada, quando existir.

#### 2.1.3. Processamento

- Resolver server-side a visão operacional completa da conta.
- Até o contract, listar uma linha por LP operacional `draft | active` na visão principal e separar as `archived`; depois do contract, a lista operacional contém somente `active`.
- Derivar a versão mais recente pela maior revisão válida.
- Derivar estados de UX a partir de identidade, completude da configuração, revisões e aprovação, sem transformar cada combinação em status persistido.
- Reutilizar valores compartilhados válidos sem copiá-los desnecessariamente para cada LP.
- Tratar fields de `offer` como reutilizáveis quando aplicáveis, exigindo confirmação/ajuste no contexto da LP sem presumir oferta global única.
- Tratar `campaign/landing_page` como contexto específico da LP.
- Permitir salvamento parcial da configuração e bloquear somente a geração enquanto houver obrigatório aplicável ausente ou inválido.
- Gerar nova revisão somente por ação humana explícita, reutilizando E19.3 → E19.4.
- Preservar qualquer versão aprovada anterior quando uma revisão nova for gerada.
- Permitir abrir em preview a versão mais recente e qualquer revisão histórica antes de uma aprovação.

#### 2.1.4. Validação

- Validar pertencimento tenant-safe da LP e da revisão antes de qualquer leitura ou mutação.
- Validar autorização do ator para alterar configuração, gerar, aprovar, arquivar ou restaurar.
- Validar os valores configuráveis contra a versão E20.2 aplicável e respectivas regras de scope, obrigação e validação.
- Exigir `landing_page_objective` válido antes de gerar, sem bloquear criação ou salvamento parcial.
- Impedir que `landing_page_objective` seja tratado como autoridade factual.
- Impedir mistura silenciosa de valores específicos entre LPs ou contas.
- Aprovação exige revisão válida e acessível em preview da mesma LP e conta.
- Impedir alteração ou overwrite de revisão histórica.
- Impedir aprovação de revisão pertencente a outra LP ou conta.
- Impedir geração ou aprovação em LP arquivada enquanto não houver restauração explícita.
- A transição `draft → active | archived` deve preservar o pipeline E19.4 já validado.

#### 2.1.5. Persistência

- A evolução do status usa dois contratos forward-only separados; migrations aplicadas não são editadas:
  - precursor expand backward-compatible, dedicado e sem capacidade de produto;
  - contract definitivo, posterior à implantação e validação hospedada do runtime funcional da E19.5.
- O precursor amplia o check de `account_landing_pages.status` para tolerar `draft | active | archived`, mantém o default `draft`, não altera nenhuma linha e preserva a criação corrente em `draft`.
- O precursor torna somente os consumidores atuais estritamente necessários — geração, append, adapters, preview e validações — capazes de coexistir com o estado futuro, sem mudar interface pública, semântica corrente ou comportamento exposto. `append_account_landing_page_materialization_v1` continua atendendo `draft` e passa a tolerar `active`, sem aceitar `archived`.
- O precursor inclui migration transacional, teste SQL, snippet read-only e regressões focais; seu readiness, se necessário, é separado e não libera workspace nem substitui o readiness definitivo da E19.5.
- A implementação funcional da E19.5 adiciona suas novas estruturas e RPCs de forma backward-compatible e opera transitoriamente com `draft | active | archived`; LPs novas passam a nascer `active`, enquanto identidades legadas `draft` continuam funcionais até o contract.
- O contract definitivo, somente depois do runtime funcional da E19.5 implantado e validado em Production, migra todo `account_landing_pages.status = 'draft'` para `active`, muda o default para `active` e restringe o check a `active | archived`.
- `account_landing_pages` recebe `approved_materialization_id uuid null` e FK composta `(approved_materialization_id, id, account_id)` para uma chave única `(id, landing_page_id, account_id)` de `account_landing_page_materializations`, com `ON UPDATE RESTRICT` e `ON DELETE RESTRICT`.
- `account_landing_page_shared_configurations` é 1:1 por `account_id` e guarda somente valores não autoritativos dos scopes `account | business`.
- `account_landing_page_configurations` é 1:1 por `landing_page_id`, vinculada tenant-safe por `(landing_page_id, account_id)`, e guarda somente valores dos scopes `offer | campaign | landing_page`.
- Ambas as configurações possuem `catalog_version`, `values` como objeto JSON, `revision` positiva, autoria e timestamps; FKs, checks e trigger de `updated_at` são explícitos.
- RLS fica habilitada sem policy; `public`, `anon`, `authenticated` e `ai_readonly` não recebem grants, e `service_role` recebe somente `SELECT, INSERT, UPDATE`; não existe DELETE operacional nem acesso client direto.
- O backfill divide cada onboarding já vinculado por `entry.scope`, grava versão 5 nas residências novas e não altera nem apaga a linha E19.2.
- LP existente sem vínculo E19.2 permanece identidade operacional com configuração incompleta, não recebe valor de outra LP, cria configuração ausente de modo tenant-safe e idempotente e não usa E19.2 como fallback operacional concorrente.
- Depois do vínculo, o runtime operacional lê somente as duas novas residências; E19.2 permanece bootstrap e histórico, sem segunda autoridade.
- Um RPC transacional e tenant-safe realiza o handoff de novos onboardings, aceitando a identidade legada `draft` ou a nova `active` durante a transição e criando as duas configurações sem estado intermediário.
- O salvamento operacional usa RPC transacional com revisões esperadas das duas residências, retorno explícito de conflito e `.maxAffected(1)` quando houver mutação direta 1:1.
- A aprovação usa RPC tenant-safe e idempotente sob lock da LP operacional (`draft | active` durante a transição, somente `active` após o contract); `service_role` perde DELETE direto de `account_landing_pages`.
- A FK de aprovação deve preservar a exclusão em cascata do agregado por conta/LP: teste SQL prova que remover o pai autorizado não é bloqueado pelo ponteiro reverso, sem conceder DELETE operacional nem permitir revisão de outra LP ou conta.
- Nenhuma view é criada; se uma se provar indispensável, exige `security_invoker = true`, registro em `docs/schema.md` e nenhum grant adicional.
- Revisões permanecem em `public.account_landing_page_materializations` no contrato append-only 1:N; não há UPDATE, DELETE, cópia ou segunda entidade de versão.
- Não criar status persistido de UX quando o estado puder ser derivado.

#### 2.1.6. Consumo

- O workspace consome identidade, configuração, revisões e aprovação para apresentar o estado de cada LP.
- Preview padrão abre a versão mais recente.
- O histórico permite abrir qualquer revisão em preview.
- A ação `Aprovar esta versão` atua sobre a revisão visualizada e não sobre uma cópia.
- Geração futura continua consumindo E19.3 → E19.4 e produz nova revisão integral com snapshot da configuração efetiva utilizada.

#### 2.1.7. Fallback

- Falha de leitura mantém estado indisponível explícito; não apresentar lista parcial como completa.
- Falha de salvamento preserva valores válidos anteriores e informa o contexto afetado.
- Configuração parcial ou inválida permanece editável, mas não pode gerar enquanto faltar requisito obrigatório aplicável.
- Falha de geração não altera revisões anteriores nem a versão aprovada.
- Falha de aprovação mantém a escolha anterior intacta.
- Falha ao arquivar/restaurar não altera silenciosamente o lifecycle.
- Conflito de slug ou configuração exige correção explícita.
- Boundary de geração indisponível não cria revisão inválida.
- Integração inexistente não produz categoria fictícia no workspace.

### 2.2. Workspace principal

- `/a/[account]` passa a parecer um workspace operacional, não a continuação permanente do onboarding.
- A home contém:
  - resumo mínimo da conta quando útil;
  - acesso às configurações realmente existentes;
  - lista operacional de LPs;
  - ação principal `Nova página`;
  - acesso simples às LPs arquivadas.
- A lista principal apresenta somente o necessário para decidir a próxima ação:
  - nome;
  - estado derivado;
  - versão mais recente;
  - indicação de versão aprovada, quando houver;
  - última atualização relevante;
  - ações principais.
- Slug, objetivo, configuração extensa e metadados técnicos ficam no detalhe da LP quando não forem necessários na lista.
- Estados de UX derivados podem incluir:
  - `Configuração incompleta`;
  - `Pronta para gerar`;
  - `Em análise`;
  - `Entregue`;
  - `Nova versão em análise`;
  - `Arquivada`.
- `active` é condição operacional interna e não deve ser exibida como sinônimo de `Publicada`.
- Desktop pode usar tabela responsiva; mobile usa cards ou composição equivalente sem scroll horizontal obrigatório.
- Toda superfície de detalhe, configuração, histórico ou preview mantém visíveis a conta e a identidade da LP corrente e oferece retorno previsível ao mesmo contexto; não há Partner Dashboard, navegação global multi-contas, favoritos ou recentes.
- O `AccessProvider` e o guard SSR existentes são preservados, sem provider novo. `/a/[account]` mantém a jornada E19.2 enquanto houver onboarding incompleto ou sem vínculo e mostra o workspace somente depois do vínculo válido.

### 2.3. Área Configurações

- A home não exibe formulário técnico gigante.
- A configuração usa fields, scopes, obrigação e validação canônicos do E20.2, sem lista paralela inventada.
- `account/business` aparecem como informações compartilhadas quando editáveis pelo fluxo vigente.
- Fields de `offer` podem ser reutilizados, mas a LP deve confirmar ou ajustar os aplicáveis ao seu contexto; a UX não presume uma única oferta global da conta.
- `campaign/landing_page` pertencem à LP concreta.
- `landing_page_objective` aparece como campo explícito da LP e é requisito de completude para gerar.
- Valores cuja autoridade pertença a outro domínio permanecem somente leitura quando a E19.5 não for o boundary autorizado de edição.
- Salvar permite estado parcial, preserva os demais valores válidos e devolve erro junto do contexto afetado.
- Alterar configuração não altera revisão histórica; o efeito sobre conteúdo ocorre somente por nova geração.

### 2.4. Semântica das ações

#### 2.4.1. Nova LP

- Cria nova identidade comercial somente quando o usuário realmente deseja outra página.
- O estado-alvo de produto da identidade é `active`; a adaptação do boundary atual que ainda cria `draft` pertence à implementação coordenada deste recorte.
- Abre a configuração da nova LP.
- Reutiliza valores compartilhados válidos sem duplicação desnecessária.
- Solicita confirmação/ajuste dos fields de `offer` aplicáveis e coleta os valores específicos de `campaign/landing_page` necessários.
- Não exige configuração completa para criar a identidade nem para salvar parcialmente.
- Não inicia geração automaticamente.
- Não copia revisão ou snapshot de outra LP.

#### 2.4.2. Salvar configuração

- Não chama IA e não cria revisão.
- Persiste somente valores pertencentes ao contexto autorizado da LP ou às fontes compartilhadas que o workspace estiver autorizado a editar.
- Pode preservar configuração parcial.
- Revisões já materializadas permanecem integralmente inalteradas.

#### 2.4.3. Gerar nova revisão

- Exige ação humana explícita e configuração completa/válida para o boundary vigente.
- Exige `landing_page_objective` válido.
- Reutiliza E19.3 → E19.4.
- Uma geração válida cria nova revisão integral e imutável da mesma LP.
- A revisão congela o conteúdo, binding e snapshot/contexto efetivamente utilizados.
- Falha não cria revisão válida nem altera a versão aprovada.
- Gerar nova revisão não cria outra `account_landing_pages`.

#### 2.4.4. Visualizar revisão

- O detalhe canônico da LP é `/a/[account]/landing-pages/[landingPageId]` e lista metadados por `(account_id, landing_page_id)` em `revision_number desc`.
- O preview reutiliza `/a/[account]/landing-pages/[landingPageId]/preview`: sem query abre a maior revisão válida; com `?revision=<materialization_id>` abre somente a revisão tenant-safe indicada.
- O histórico permite selecionar qualquer revisão preservada e abrir seu preview individual pelo mesmo renderer.
- Preview histórico não altera versão mais recente, aprovada ou futura publicação.

#### 2.4.5. Aprovar esta versão

- Disponível a owner/admin autorizado a partir da revisão visualizada.
- A aprovação escolhe a revisão existente como versão aprovada da LP.
- No máximo uma revisão permanece aprovada por LP.
- Aprovar outra revisão transfere a escolha sem apagar histórico.
- A aprovação não chama IA nem cria nova revisão.
- LP arquivada pode ser visualizada, mas somente uma LP operacional (`draft | active` durante a transição, `active` após o contract) pode gerar, salvar configuração ou aprovar.

#### 2.4.6. Arquivar e restaurar

- Arquivar retira a LP da lista principal e preserva seu agregado completo.
- Restaurar reativa a mesma identidade com suas revisões e aprovação preservadas.
- Não existe hard delete na primeira E19.5.

### 2.5. Histórico e metadados mínimos

- O histórico pertence à LP concreta, não à lista principal de páginas.
- Cada revisão permite identificar, no mínimo:
  - número;
  - data;
  - indicação de versão mais recente;
  - indicação de versão aprovada, quando aplicável;
  - ação de preview.
- A futura indicação de versão publicada pode ser acrescentada quando o contrato de publicação existir.
- Metadados técnicos já preservados no snapshot continuam disponíveis para auditoria onde fizer sentido, sem obrigar sua exposição na UX principal.
- Não criar comparação lado a lado, ranking, nota automática ou engine de experimentos.

### 2.6. Frontend, UX e evidências

- A experiência deve ser clara para usuário não técnico.
- Pending visível impede duplo clique acidental em ações mutáveis.
- Sucesso e erro aparecem junto do contexto afetado.
- Foco avança de forma previsível após criação, erro ou navegação.
- Antes de cada ação principal, o usuário reconhece o estado da LP, a distinção entre versão mais recente e aprovada e o próximo passo sem depender de termos técnicos; depois da ação, feedback e foco identificam resultado e próximo passo permitido.
- Aplicar o baseline WCAG 2.2 pertinente ao fluxo, incluindo semântica e nomes acessíveis, associação de label, hint e erro, feedback perceptível, teclado, foco, contraste e alvos de toque, sem alegação de conformidade integral.
- A Vercel Toolbar pode apoiar inspeção no Preview quando disponível, mas não substitui casos executáveis, matriz hospedada ou validação humana e sua indisponibilidade não bloqueia a entrega.
- Evidências da fase executável devem cobrir, no mínimo:
  - desktop em 1280 px;
  - tablet em 768 px;
  - mobile em 360 px;
  - teclado e foco visível;
  - ausência de truncamento e overflow indevido;
  - uma linha/card por LP comercial;
  - configuração parcial e bloqueio somente da geração quando incompleta;
  - reutilização de `account/business` sem cópia indevida;
  - confirmação/ajuste de `offer` sem pressupor oferta global única;
  - `landing_page_objective` obrigatório para gerar;
  - histórico com preview da versão mais recente e de revisão histórica;
  - aprovação explícita e preservação da aprovação ao gerar revisão posterior;
  - arquivamento e restauração sem perda de revisões;
  - isolamento tenant-safe.
- A evidência hospedada autenticada cobre owner e admin nos fluxos positivos, papel sem autoridade e chamada direta nos gates negativos, lista ativa e arquivada, configuração parcial, geração, histórico, aprovação, arquivamento e restauração nos três viewports, sem erro visível não tratado ou erro de console atribuível ao recorte.

### 2.7. Riscos e dependências

- O literal `draft` ainda participa do schema, geração, append, adapters, preview e validações; a transição precisa ser coordenada.
- O precursor é aceito somente se zero linhas forem alteradas, `draft` continuar válido e default, a criação corrente continuar em `draft` e nenhuma capacidade E19.5 ficar exposta.
- O runtime compatível do precursor deve estar efetivamente implantado em Production; Preview isolado não comprova a compatibilidade necessária para retomar a E19.5.
- A evidência do precursor registra SHA, migration aplicada, deployment correspondente e regressões E19.2–E19.4. Falha de apply, implantação ou regressão mantém a E19.5 parada.
- “Novo runtime implantado e validado”, para autorizar o contract, significa o runtime funcional da E19.5 já operando em Production sobre o schema expandido; a validação do precursor, isoladamente, nunca autoriza o contract.
- A migration deve abortar integralmente se o backfill encontrar JSON histórico inválido; não existe estado parcial tolerado.
- O runtime funcional permanece fail-closed por `e19_5_landing_page_workspace_readiness()`, com EXECUTE exclusivo de `service_role`.
- O readiness transitório aceita `draft | active | archived`, confirma default `draft`, consumidores compatíveis, ponteiro e FKs de aprovação, tabelas de configuração, RLS, ausência de policies, grants, RPCs, append operacional e objetos de materialização; não há lista parcial nem fallback ao leitor E19.2 após o vínculo.
- O readiness definitivo do contract confirma zero linhas `draft`, default `active`, check `active | archived` e ausência de consumidor que escreva ou dependa de `draft`; ele não substitui nem reinterpreta a evidência transitória.
- O agregado legado da E19.2 não pode ser rebindado nem reinterpretado como configuração genérica de todas as LPs.
- O E20.2 v5 depende da aceitação humana E20.6 antes da primeira geração; incompatibilidade entre versão executável e revisada falha fechada.
- O bucket privado `landing-page-revision-assets` é preservado sem acesso direto de `anon` ou `authenticated`; lifecycle, aprovação e histórico não movem, sobrescrevem, duplicam nem excluem assets, e URLs assinadas permanecem transitórias no consumo autorizado.
- Alterações futuras de configuração não podem alterar revisões já materializadas.
- O binding do CTA permanece parte da revisão na primeira E19.5.
- Publicação futura deve poder distinguir versão mais recente, aprovada e publicada sem reconstruir o versionamento.
- Limites comerciais de geração continuam dependentes da E9.7 e do consumidor real.

### 2.8. Boundaries, ordem e substituições

- Componentes do workspace permanecem route-local em `app/a/[account]/_components/`; configuração e histórico ficam route-local em `app/a/[account]/landing-pages/[landingPageId]/`.
- Server Actions ficam nas rotas consumidoras e permanecem finas. Banco, composição de configuração, estados derivados, lifecycle, histórico e aprovação ficam em `lib/lp-builder/`, por contratos públicos, funções puras e adapters coesos.
- UI e provider recebem DTOs finais e não importam Supabase, DBRow, registry ou schema interno; mutações revalidam ator, conta, membership e entitlement server-side.
- Remover `app/lp-builder/actions.ts` e o export órfão `createAccountLandingPageAction`. A criação do onboarding continua pela action route-local vigente; a criação operacional usa exclusivamente a nova action route-local do workspace, ambas sobre a mesma API pública atualizada para criar LP `active`.
- O precursor não pode incluir workspace, rota/action operacional, lifecycle, arquivamento, restauração, aprovação, handoff, configuração operacional, backfill por scope, catálogo E20.2 v5, alteração de `reviewed_input_catalog_version`, criação de LP `active`, retirada de action órfã ou limpeza não indispensável à compatibilidade.
- Depois do gate do precursor e da sincronização explícita da branch, a ordem interna da E19.5.3 é: catálogo v5 e contratos puros; estruturas aditivas, SQL tests, snippet e readiness transitório; adapters e casos de uso compatíveis com `draft | active | archived`; handoff do onboarding; workspace e detalhe; preview histórico, aprovação e lifecycle; validações integradas e ABCs finais. O backfill de status `draft → active` e a retirada de `draft` não integram esse PR.
- O runtime fica indisponível explicitamente até o readiness E19.5 comprovar o schema. O apply remoto permanece exclusivamente pós-merge pelo workflow canônico; não há mutação remota pré-merge.

## 3. Fases e próxima ação

### 3.1. Gate técnico precursor autorizado — expand backward-compatible

- Não constitui nova subseção funcional do roadmap nem entrega capacidade E19.5.
- Entrega mínima:
  - check de status tolera `draft | active | archived`;
  - default e criação corrente permanecem `draft`;
  - append vigente preserva `draft` e tolera `active`, rejeitando `archived`;
  - migration forward-only, teste SQL transacional, snippet read-only e regressões focais comprovam compatibilidade e ausência de mutação de dados.
- Critérios de aceite:
  - nenhuma linha existente é atualizada;
  - nenhum backfill é executado;
  - nenhum suporte a `draft` é removido;
  - nenhuma funcionalidade E19.5 é exposta;
  - merge, apply, deployment Production e regressões E19.2–E19.4 ficam associados por SHA e evidência.
- Critério de parada: qualquer backfill, mudança do default, rejeição de `draft`, capacidade E19.5 ou alteração não indispensável invalida o precursor.

### 3.2. E19.5.3 — Workspace operacional, configuração e lifecycle da LP

- Automação: não.
- Objetivo:
  - implementar o workspace operacional da conta sobre uma identidade estável de LP, com configuração contextual, revisões append-only, aprovação humana e lifecycle reversível.
- Entrega mínima:
  - E20.2 v5 com `landing_page_objective`, preservando v1–v4 e bloqueando geração até aceitação E20.6 da v5;
  - migration aditiva forward-only, duas residências disjuntas de configuração, handoff do onboarding, RPCs, readiness transitório, teste SQL e snippet read-only, sem backfill de status `draft → active` nem retirada de `draft`;
  - reutilização de `account/business` sem cópia indevida;
  - reutilização contextual de fields `offer` sem pressupor oferta global única;
  - `campaign/landing_page` associados à LP concreta;
  - workspace com uma linha por LP;
  - lifecycle `active | archived` com transição coordenada dos consumidores atuais de `draft`;
  - histórico de revisões append-only da mesma LP;
  - preview da versão mais recente e de qualquer revisão histórica;
  - ação `Gerar nova revisão` pelo boundary vigente E19.3 → E19.4;
  - `approved_materialization_id` com FK composta tenant-safe e RPC de aprovação idempotente;
  - ação `Aprovar esta versão`;
  - arquivamento/restauração;
  - estados de UX derivados;
  - preservação da definição de LP entregue.
- Limites:
  - sem automação nova;
  - sem mudança de modelo, prompt, effort ou workload;
  - sem editor manual ou melhoria parcial por IA;
  - sem publicação;
  - sem hard delete;
  - sem binding dinâmico;
  - sem créditos/carteira local;
  - sem testes A/B ou engine de experimentos;
  - sem catálogo/gestão avançada de ofertas;
  - sem nova infraestrutura sem consumidor indispensável.
- Critérios de aceite:
  - onboarding inicial E19.2 continua funcional e sem rebind;
  - owner/admin autorizado acessa o workspace e executa somente ações permitidas;
  - uma linha/card representa cada LP comercial, sem multiplicar identidade por revisão;
  - `account/business` são reutilizados conforme autoridade vigente;
  - fields de `offer` podem ser confirmados/ajustados por LP sem pressupor uma única oferta global;
  - `campaign/landing_page` permanecem específicos da LP;
  - `landing_page_objective` pode faltar em configuração parcial, mas bloqueia geração até ficar válido;
  - salvar configuração não cria revisão e não altera revisões históricas;
  - nova geração cria revisão integral append-only da mesma LP;
  - versão aprovada anterior permanece escolhida até nova aprovação humana;
  - qualquer revisão histórica pode ser aberta em preview antes da aprovação;
  - aprovação não cria nova revisão e mantém no máximo uma versão aprovada por LP;
  - arquivar/restaurar preserva identidade, configuração, revisões e aprovação;
  - o runtime funcional preserva geração, append, configuração, preview e aprovação para LPs `draft | active`, rejeita mutações em `archived` e deixa a transição física completa para o contract posterior;
  - verificadores/testes proporcionais e `npm run check` aprovam o contrato;
  - evidência hospedada aprova desktop, tablet, mobile, teclado, foco e fluxos humanos previstos;
  - Prompt ABC reconcilia roadmap e documentos canônicos materialmente afetados durante a implementação.
  - catálogo v5 acrescenta somente `landing_page_objective`, mantém v1–v4 deep-equal e falha fechado até `reviewed_input_catalog_version = 5`;
  - o backfill de configuração E19.2 separa scopes corretamente, não rebinda E19.2 e aborta integralmente diante de JSON histórico inválido; ele não altera `account_landing_pages.status`;
  - consultas de lista ativa/arquivada, revisão mais recente, histórico e versão aprovada usam projeções explícitas, filtros tenant-safe e ordenação determinística; índice novo exige consulta real e evidência de plano, sem autoaplicação pelo Index Advisor;
  - toda alteração de schema usa migration forward-only, teste SQL transacional e snippet read-only que comprovam colunas, constraints, índices, RLS, policies, grants, funções e invariantes afetados;
  - readiness ausente ou incompatível mantém workspace e mutações fail-closed, sem lista parcial nem fallback operacional ao agregado E19.2;
  - `LandingPageGenerationContext` v3 e `LandingPageGenerationContextSnapshot` v1 continuam lendo revisões históricas; `LandingPageGenerationContext` v4 e `LandingPageGenerationContextSnapshot` v2 são os únicos produzidos pelo runtime funcional E19.5, os demais contratos de apresentação/revisão permanecem v1, a leitura usa união discriminada e casos negativos rejeitam combinações incompatíveis sem regravar revisão;
  - preview padrão e `?revision=<materialization_id>` reutilizam o mesmo renderer e falham fechado para revisão de outra LP ou conta;
  - aprovação antiga permanece após novo append e a transferência de aprovação não remove histórico;
  - bucket, paths e policies privados permanecem inalterados por aprovação, lifecycle e histórico;
  - busca no repositório confirma a remoção da action órfã e um único boundary público de criação;
  - QA hospedado e testes humanos confirmam reconhecimento de estado e próximo passo, account/LP context, owner/admin, papel sem autoridade, chamada direta, viewports, teclado, foco, labels, feedback e ausência de overflow/console error atribuível ao recorte.

### 3.3. Contract posterior — retirada coordenada de `draft`

- Precondições:
  - SHA e deployment Production do runtime funcional E19.5 identificados;
  - QA funcional e regressões E19.2–E19.5 aprovados sobre o schema transitório;
  - busca e testes comprovam que nenhum consumidor ainda exige, escreve ou interpreta `draft` como único estado operacional.
- Entrega mínima:
  - migration atômica com backfill de status `draft → active`, default `active` e check restrito a `active | archived`;
  - tipos e consumidores restritos a `active | archived`;
  - readiness definitivo, teste SQL transacional e snippet read-only.
- Critério de parada: qualquer consumidor dependente de `draft`, falha de QA/regressão ou ausência de evidência Production impede o contract.

### 3.4. Próxima ação

- Submeter o delta desta decisão ao mesmo Analista, sem matriz nem pareceres.
- Criar e publicar o PR precursor dedicado somente depois da aprovação do delta; parar até merge, apply, deployment Production e regressões comprovadas.
- Depois dessa evidência, sincronizar explicitamente a branch E19.5 com `main`, revalidar migration/schema e retomar a Passagem 1.
- Após aprovação da Passagem 1, versionar `docs/matriz-consolidacao-e19-5.md` e executar Passagem 2 no mesmo Analista com os pareceres integrais.
- Reconciliar `docs/roadmap.md` por ABC em modo planejamento e criar o checkpoint `LP-Factory-Stage: plan-v2-approved` somente depois da aprovação do delta.
- Executar `E19.5.3` end-to-end na branch de orquestração e em seu PR draft, sem repetir especialistas e sem merge automático; o contract definitivo permanece posterior à implantação e validação do runtime novo.
- Depois do merge, deployment e validação Production da E19.5.3, abrir recorte próprio de contract para backfill `draft → active`, default `active` e retirada de `draft`; não executar esse recorte por antecipação.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da primeira E19.5

- Editor manual de conteúdo.
- Edição de seção ou melhoria parcial por IA.
- Chat de edição ou agente.
- Publicar/despublicar LP.
- Domínio público ou customizado.
- Overlay mutável para CTA ou binding dinâmico.
- Tracking, analytics ou pixels como parte das revisões de conteúdo.
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
  - no precursor, backfill, mudança do default, rejeição de `draft`, criação de LP `active`, capacidade E19.5 ou alteração não indispensável à compatibilidade;
  - overwrite ou alteração de revisão histórica;
  - nova identidade de LP apenas para representar regeneração da mesma página;
  - rebind destrutivo do agregado E19.2;
  - segunda entidade concorrente de revisão/versão;
  - catálogo/entidade de ofertas sem fonte real aprovada;
  - capability ou limite comercial inventado localmente;
  - publicação, editor, hard delete, teste A/B ou binding dinâmico para cumprir o workspace básico;
  - nova infraestrutura sem consumidor indispensável;
  - mudança funcional da geração E19.4 não prevista pelo contrato aprovado.
- A E19.5 termina quando a conta consegue organizar, configurar, versionar, revisar, aprovar, arquivar e restaurar suas LPs pelo fluxo oficial, preservando histórico, tenant safety e os boundaries existentes.

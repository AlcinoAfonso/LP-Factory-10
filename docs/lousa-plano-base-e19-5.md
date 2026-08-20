20/08/2026 — Rascunho vivo — E19.5 — Workspace operacional e lifecycle de LPs

## 1. Estado e decisões fixas

### 1.1. Identificação

- Recorte: `E19.5 — Workspace operacional e lifecycle de LPs`.
- Path: `docs/lousa-plano-base-e19-5.md`.
- Estado: **rascunho vivo em reconciliação; ainda não consolidado como plano-base v1**.
- O plano-base v1 anterior deste mesmo arquivo foi superado materialmente pela evolução E19.4 para revisões append-only 1:N e pelas decisões humanas posteriores.
- Plano conceitual: N/A.
- Processo: `docs/prompt-estrategista.md`.
- PR vivo: #726.
- Predecessores materiais: E19.1, E19.2, E19.3 e E19.4 implementadas no fluxo oficial da conta.

### 1.2. Problema comprovado

- A E19.4 comprovou o pipeline de geração, validação, revisões append-only, renderer e preview privado da primeira LP real.
- `landing_page` passou a representar uma identidade comercial estável com múltiplas revisões imutáveis; o modelo anterior do #726, baseado em drafts independentes para cada variação, não deve ser implementado.
- `public.account_landing_pages.status` ainda aceita somente `draft`, significado que ficou insuficiente para representar o lifecycle da identidade depois da existência de revisões.
- A superfície `/a/[account]` ainda precisa evoluir de continuação do onboarding para workspace operacional da conta.
- O usuário precisa organizar várias LPs sem poluir a lista principal, visualizar o histórico de cada LP, gerar novas revisões sem destruir as anteriores e escolher explicitamente qual revisão está aprovada.
- Publicação, editor de conteúdo e melhoria parcial por IA são evoluções distintas e não devem ser antecipadas para resolver o workspace básico.

### 1.3. Resultado esperado

- Transformar `/a/[account]` em um workspace operacional simples para owner e admin elegíveis.
- Preservar o onboarding inicial da E19.2 para a primeira jornada factual.
- Exibir **uma linha por LP comercial**, sem transformar revisões em novas identidades de LP.
- Permitir criar nova LP quando houver nova identidade comercial.
- Permitir configurar a LP, gerar novas revisões integrais, abrir qualquer revisão em preview e aprovar explicitamente uma revisão existente.
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
- O vínculo write-once existente não deve ser rebindado nem reinterpretado como histórico de revisões.
- A E19.5 deve reutilizar fatos válidos já coletados e não criar onboarding paralelo.
- A forma definitiva de configuração específica por LP para as jornadas posteriores ainda será fechada no próximo bloco de debate, sem alterar retroativamente revisões já materializadas.

### 1.6. Configurações — base preservada, ainda em debate

- Permanece válida a separação conceitual entre informações reutilizáveis da conta/negócio/oferta e informações específicas de campanha/LP.
- Alterar configuração futura nunca altera silenciosamente uma revisão histórica já materializada.
- A configuração efetiva usada por uma geração deve continuar sendo validada pelas autoridades vigentes e preservada no snapshot da revisão produzida.
- Ainda precisa ser fechado neste rascunho:
  - quais configurações o workspace permitirá editar na primeira E19.5;
  - como reutilização, defaults e valores específicos da LP se combinam sem cópia desnecessária;
  - como a primeira configuração E19.2 serve de bootstrap para LPs posteriores;
  - se `landing_page_objective` permanece como input explícito obrigatório da LP;
  - qual é a menor persistência necessária para configuração por LP, sem antecipar shape físico antes da decisão.

### 1.7. Lifecycle da LP, revisões e aprovação — bloco encerrado

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
- A forma física de persistir a referência da revisão aprovada não é definida neste rascunho; deve ser escolhida na consolidação técnica sem criar segunda entidade de versionamento.

### 1.8. Arquivamento e transição do `draft` atual

- Arquivar retira a LP da lista operacional principal sem excluir identidade, configuração, revisões, versão aprovada ou histórico.
- A UI deve oferecer visualização simples de LPs arquivadas e ação de restauração.
- Restaurar devolve a mesma identidade à operação; não cria nova LP nem nova revisão.
- Exclusão definitiva não integra a primeira E19.5.
- A transição física de `draft` para `active | archived` deve ser coordenada porque o contrato vigente ainda possui consumidores explícitos de `draft`, incluindo constraint de banco, append de revisão, adapters, validações e preview.
- A implementação deve atualizar os consumidores materialmente afetados sem reabrir a E19.4 nem renomear indiscriminadamente arquivos, workloads ou identificadores históricos que contenham `draft` mas continuem semanticamente válidos.

### 1.9. Configuração operacional e bindings

- Tracking, analytics, Google Ads tag, Meta Pixel e configurações técnicas equivalentes não pertencem ao versionamento de conteúdo da LP.
- Na primeira E19.5, o destino operacional do CTA permanece congelado dentro do binding da revisão, conforme o contrato vigente.
- Alterar WhatsApp ou URL na configuração não modifica revisões históricas.
- Para o novo destino integrar o conteúdo executável na primeira E19.5, é necessária uma nova revisão gerada com o novo binding.
- A E19.5 não cria overlay mutável, binding dinâmico ou nova fonte operacional para sobrepor revisões existentes.
- A futura separação do destino operacional do CTA permanece evolução possível, condicionada a contrato próprio.

### 1.10. Automação e consumo de IA

- Automação nova na E19.5: **não**.
- A ação humana `Gerar nova revisão` reutiliza o boundary vigente da E19.4 e seus workloads; a E19.5 não cria agente, job, fila, nova automação, novo prompt, novo modelo ou novo workload.
- Nova LP, salvar configuração, abrir preview, abrir histórico, aprovar versão, arquivar e restaurar não chamam IA.
- A quantidade de chamadas técnicas internas da E19.4 não cria várias ações comerciais na UX; o usuário aciona uma única geração de nova revisão.
- Controle comercial futuro de consumo deve reutilizar E9.7; carteira ou contabilização específica só entra quando houver requisito concreto e recorte próprio.

### 1.11. Fontes usadas e questões abertas

- Fontes atuais deste rascunho:
  - `README.md`;
  - `docs/roadmap.md`;
  - `docs/template-roadmap.md`;
  - `docs/prompt-estrategista.md`;
  - `docs/schema.md`;
  - implementação vigente de `app/a/[account]/` e `lib/lp-builder/`;
  - migrations, RPCs e validações vigentes da E19.1/E19.2/E19.4;
  - PR #726 como histórico do debate anterior a ser reconciliado.
- `docs/lp-planejamento.md` não é fonte deste rascunho.
- Bloco encerrado: lifecycle da identidade, semântica de revisões/aprovação, arquivamento, definição de LP entregue, limite inicial de publicação/editor e binding do CTA na primeira E19.5.
- Próximo bloco aberto: **configuração da LP e geração de nova versão**.

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
- Fatos e configuração já persistidos e autorizados.
- Configuração específica da LP, quando o contrato final a exigir.
- Identidade da LP.
- Revisões materializadas e respectivos snapshots.
- Referência da versão aprovada, quando existir.

#### 2.1.3. Processamento

- Resolver server-side a visão operacional completa da conta.
- Listar uma linha por LP `active` na visão principal e separar as `archived`.
- Derivar a versão mais recente pela maior revisão válida.
- Derivar os estados de UX a partir de identidade, configuração, revisões e aprovação, sem transformar cada combinação em status persistido.
- Gerar nova revisão somente por ação humana explícita, reutilizando o boundary E19.4.
- Preservar qualquer versão aprovada anterior quando uma revisão nova for gerada.
- Permitir abrir em preview a versão mais recente e qualquer revisão histórica antes de uma aprovação.

#### 2.1.4. Validação

- Validar pertencimento tenant-safe da LP e da revisão antes de qualquer leitura ou mutação.
- Validar autorização do ator para alterar configuração, gerar, aprovar, arquivar ou restaurar.
- Aprovação exige revisão válida e acessível em preview da mesma LP e conta.
- Impedir alteração ou overwrite de revisão histórica.
- Impedir aprovação de revisão pertencente a outra LP ou conta.
- Impedir geração ou aprovação em LP arquivada enquanto não houver restauração explícita.
- A transição `draft → active | archived` deve preservar o pipeline E19.4 já validado.

#### 2.1.5. Persistência

- A identidade e seu lifecycle permanecem em `public.account_landing_pages`, com evolução coordenada do status vigente.
- Revisões permanecem em `public.account_landing_page_materializations` no contrato append-only 1:N já implementado.
- A referência da versão aprovada precisa persistir de forma tenant-safe, mas seu shape físico ainda não está decidido neste rascunho.
- Configuração por LP permanece tema do próximo bloco; não criar tabela, rota ou segunda fonte de verdade antes dessa decisão.
- Não criar status persistido de UX quando o estado puder ser derivado.

#### 2.1.6. Consumo

- O workspace consome identidade, configuração, revisões e aprovação para apresentar o estado de cada LP.
- Preview padrão abre a versão mais recente.
- O histórico permite abrir qualquer revisão em preview.
- A ação `Aprovar esta versão` atua sobre a revisão visualizada e não sobre uma cópia.
- Geração futura continua consumindo o boundary E19.3 → E19.4 e produz nova revisão integral.

#### 2.1.7. Fallback

- Falha de leitura mantém estado indisponível explícito; não apresentar lista parcial como completa.
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

### 2.3. Área Configurações — próximo bloco de debate

- A home não deve exibir formulário técnico gigante.
- A configuração deve usar os fields e fontes canônicas reais do projeto, sem lista paralela inventada.
- Informações reutilizáveis e específicas da LP devem aparecer em linguagem compreensível e com origem clara.
- Salvar configuração não altera revisão histórica existente.
- Na primeira E19.5, mudança de configuração que precise refletir no conteúdo executável só aparece em nova revisão depois de nova geração.
- O próximo bloco deve fechar quais campos e scopes entram, como são reutilizados, qual residência física mínima é necessária e como a primeira configuração E19.2 participa desse fluxo.

### 2.4. Semântica das ações

#### 2.4.1. Nova LP

- Cria uma nova identidade comercial somente quando o usuário realmente deseja outra página.
- O estado-alvo de produto da identidade é `active`; a adaptação do boundary atual que ainda cria `draft` pertence à implementação coordenada deste recorte.
- Abre a configuração da nova LP.
- Não inicia geração automaticamente.
- Não copia revisão ou snapshot de outra LP.

#### 2.4.2. Gerar nova revisão

- Exige ação humana explícita e configuração válida para o boundary vigente.
- Reutiliza E19.3 → E19.4.
- Uma geração válida cria nova revisão integral e imutável da mesma LP.
- Falha não cria revisão válida nem altera a versão aprovada.
- Gerar nova revisão não cria outra `account_landing_pages`.

#### 2.4.3. Visualizar revisão

- Preview padrão abre a versão mais recente.
- O histórico permite selecionar qualquer revisão preservada e abrir seu preview individual.
- Preview histórico não altera versão mais recente, aprovada ou futura publicação.

#### 2.4.4. Aprovar esta versão

- Disponível a owner/admin autorizado a partir da revisão visualizada.
- A aprovação escolhe a revisão existente como versão aprovada da LP.
- No máximo uma revisão permanece aprovada por LP.
- Aprovar outra revisão transfere a escolha sem apagar histórico.
- A aprovação não chama IA nem cria nova revisão.

#### 2.4.5. Arquivar e restaurar

- Arquivar retira a LP da lista principal e preserva seu agregado completo.
- Restaurar reativa a mesma identidade com suas revisões e aprovação preservadas.
- Não existe hard delete na primeira E19.5.

### 2.5. Histórico e metadados mínimos

- O histórico pertence à LP concreta, não à lista principal de páginas.
- Cada revisão deve permitir identificar, no mínimo:
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
- Evidências futuras da fase executável deverão cobrir, no mínimo:
  - desktop em 1280 px;
  - tablet em 768 px;
  - mobile em 360 px;
  - teclado e foco visível;
  - ausência de truncamento e overflow indevido;
  - uma linha/card por LP comercial;
  - histórico com preview da versão mais recente e de revisão histórica;
  - aprovação explícita e preservação da aprovação ao gerar revisão posterior;
  - arquivamento e restauração sem perda de revisões;
  - isolamento tenant-safe.

### 2.7. Riscos e dependências

- O literal `draft` ainda participa do schema, geração, append, adapters, preview e validações; a transição precisa ser coordenada.
- A aprovação precisa de persistência tenant-safe e idempotente, mas o shape físico ainda deve ser definido após inspeção técnica completa.
- Configuração por LP não pode criar segunda fonte de verdade nem reinterpretar silenciosamente fatos históricos da E19.2.
- Alterações futuras de configuração não podem alterar revisões já materializadas.
- O binding do CTA permanece parte da revisão na primeira E19.5.
- Publicação futura deve poder distinguir versão mais recente, aprovada e publicada sem reconstruir o versionamento.
- Limites comerciais de geração continuam dependentes da E9.7 e do consumidor real.

## 3. Fases e próxima ação

### 3.1. E19.5.3 — Workspace operacional e lifecycle da LP — rascunho

- Estado: **ainda não executável; fase será consolidada somente após o encerramento dos blocos indispensáveis do debate**.
- Automação nova: não.
- Entrega já direcionada pelo bloco encerrado:
  - workspace com uma linha por LP;
  - lifecycle `active | archived`;
  - histórico de revisões append-only da mesma LP;
  - preview da versão mais recente e de qualquer revisão histórica;
  - ação `Gerar nova revisão` pelo boundary vigente;
  - ação `Aprovar esta versão`;
  - arquivamento/restauração;
  - estados de UX derivados;
  - preservação da definição de LP entregue.
- A fase ainda não fixa:
  - contrato final de configuração por LP;
  - fields/scopes editáveis na primeira entrega;
  - persistência mínima de configuração específica;
  - forma física da referência da versão aprovada;
  - fases adicionais, se o debate demonstrar necessidade material.

### 3.2. Próxima ação

- Debater e fechar **configuração da LP e geração de nova versão**, sem reabrir o bloco de lifecycle.
- Perguntas indispensáveis do próximo bloco:
  - quais configurações o cliente poderá editar na primeira E19.5;
  - quais valores são reutilizáveis e quais pertencem à LP concreta;
  - se `landing_page_objective` continua obrigatório;
  - como a configuração E19.2 serve de bootstrap sem rebind;
  - como alterações de configuração afetam somente gerações futuras;
  - qual é a menor persistência necessária para várias LPs;
  - quais validações e fallbacks preservam E19.3/E19.4 sem criar contrato paralelo.
- Somente após fechar os blocos indispensáveis, consolidar este mesmo arquivo como plano-base v1 e então seguir ao checklist e à escolha de processo do `docs/prompt-estrategista.md`.

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
- Teste A/B automático.
- Comparação visual automatizada.
- Engine de experimentos, ranking ou escolha automática.
- Workflow com vários aprovadores.
- Agendamento de publicação.
- Exclusão definitiva.
- Agente, job, fila, cron, webhook ou nova infraestrutura sem consumidor indispensável.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se a implementação exigir:
  - overwrite ou alteração de revisão histórica;
  - nova identidade de LP apenas para representar regeneração da mesma página;
  - rebind destrutivo do agregado E19.2;
  - segunda entidade concorrente de revisão/versão;
  - capability ou limite comercial inventado localmente;
  - publicação, editor, hard delete ou binding dinâmico para cumprir o workspace básico;
  - nova infraestrutura sem consumidor indispensável;
  - mudança funcional da geração E19.4 não prevista pelo contrato aprovado.
- A E19.5 somente poderá ser declarada v1 quando as questões indispensáveis de configuração e geração futura estiverem fechadas sem inventar contrato físico.

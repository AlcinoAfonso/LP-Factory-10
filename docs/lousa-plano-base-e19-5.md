12/08/2026 — Plano-base v1 — E19.5 — Workspace operacional da conta e laboratório de drafts

## 1. Estado e decisões fixas

### 1.1. Identificação

- Recorte: `E19.5 — Workspace operacional da conta e laboratório de drafts`.
- Path: `docs/lousa-plano-base-e19-5.md`.
- Estado: plano-base v1 consolidado por decisão humana em 12/08/2026.
- Plano conceitual: `docs/lp-planejamento.md`.
- Processo: `docs/prompt-estrategista.md`.
- Predecessores materiais: E19.1, E19.2, E19.3 e E19.4 implementadas no fluxo oficial da conta.

### 1.2. Problema comprovado

- A primeira LP real comprovou o pipeline técnico de geração, validação, materialização e preview, mas foi reprovada na avaliação humana de qualidade comercial, com nota aproximada de `2/10`.
- O projeto precisa testar mudanças posteriores de modelo, prompt, perfil, composição e renderer sem destruir resultados anteriores.
- A superfície atual `/a/[account]` não funciona como workspace permanente da conta: não organiza configurações por contexto, não lista todas as LPs nem oferece um fluxo seguro para criar e preservar múltiplos drafts comparáveis.
- A persistência da E19.2 foi desenhada como agregado 1:1 por conta para o onboarding da primeira LP e possui `landing_page_id` write-once; ela não pode ser rebindada nem representar sozinha configurações próprias de várias LPs.
- A materialização da E19.4 é 1:1 e write-once por LP; regeneração não pode sobrescrever silenciosamente o resultado anterior.
- O objetivo editorial e comercial específico da LP ainda não possui um input explícito suficiente para orientar e identificar cada teste.

### 1.3. Resultado esperado

- Transformar `/a/[account]` em um workspace operacional simples para owner e admin elegíveis.
- Preservar o onboarding inicial da E19.2 para a primeira LP.
- Disponibilizar, depois da conclusão do onboarding, acesso organizado às configurações vigentes por contexto.
- Exibir todas as LPs legítimas da conta com identidade, configuração, estado derivado e ações compatíveis.
- Permitir criar, duplicar, gerar e produzir novas variações em drafts independentes, preservando os resultados anteriores.
- Permitir comparação humana de gerações realizadas com diferentes configurações canônicas do projeto, sem criar laboratório paralelo ou engine automática de experimentos.

### 1.4. Atores e gates

- Somente membership `active` com papel `owner` ou `admin` pode alterar configurações, criar drafts, duplicar ou iniciar geração.
- A conta deve estar `active` e possuir entitlement comercial válido.
- O taxon primário ativo permanece autoritativo.
- Toda ação mutável revalida conta, membership e entitlement server-side e deriva `accountId` e ator do contexto autenticado.
- A E19.5 não inventa capability comercial nem limite local de drafts; quando a E9.7 admitir e integrar limites reais, o workspace passa a consumi-los no ponto competente.
- Conta piloto e clientes usam o mesmo workspace e os mesmos boundaries.

### 1.5. Preservação da E19.2

- A E19.2 continua responsável pelo primeiro onboarding pós-entitlement e pela configuração mínima necessária à primeira LP Starter.
- A E20.2 continua sendo a fonte dos fields, scopes, tipos, obrigação, aplicabilidade, validação e política de substituição.
- O agregado `public.account_landing_page_onboarding_configurations` permanece como registro e bootstrap da primeira jornada por conta.
- Seu vínculo write-once não é alterado, removido nem rebindado.
- A área posterior `Configurações` é evolução de consumo da E19.2, mas a lista operacional de LPs e o laboratório de drafts pertencem à E19.5.

### 1.6. Divisão fixa das configurações

- Valores de `account`, `business` e `offer` funcionam como defaults reutilizáveis, respeitando fontes autoritativas e a política da E20.2.
- Valores de `campaign` e `landing_page` pertencem à LP concreta.
- Valor reutilizável só pode ser substituído por LP quando a E20.2 declarar `landingPageSubstitutionPolicy: explicit_allowed`.
- Valor com substituição proibida não é copiado para a configuração específica apenas para facilitar a UI.
- Alteração de defaults pode orientar futuras gerações ainda não materializadas, mas nunca altera o conteúdo já materializado e congelado de outra LP.
- A UI agrupa os fields pelos scopes vigentes, mas usa linguagem compreensível para o cliente e não expõe a modelagem interna como formulário técnico gigante.

### 1.7. Configuração específica por LP

- Cada nova LP passa a possuir uma configuração 1:1 própria, orientada pela E20.2.
- A menor residência física aprovada é `public.account_landing_page_configurations`.
- O agregado possui conceitualmente:
  - `landing_page_id` como identidade única;
  - `account_id` para isolamento tenant-safe;
  - `catalog_version`;
  - objeto `values` indexado por `fieldKey`;
  - `revision` para concorrência otimista;
  - ator e timestamps de criação e atualização.
- O objeto `values` conserva somente `scope` e `value` validados; não duplica definição, obrigação, condição, validação ou catálogo.
- A tabela permanece server-only, com RLS habilitado, sem policy de cliente e sem DELETE operacional neste recorte.
- A lista e os estados derivados não criam persistência paralela.

### 1.8. Compatibilidade com a primeira LP

- A primeira LP e sua materialização existentes permanecem válidas sem backfill destrutivo.
- Enquanto a primeira LP não possuir configuração específica própria, seu resolver pode usar os valores `campaign` e `landing_page` do agregado da E19.2 somente quando o `landing_page_id` vinculado corresponder exatamente à LP solicitada.
- Quando a primeira LP for editada, duplicada ou usada como origem de nova variação, a configuração específica necessária é criada para o novo draft ou para a operação competente, sem rebind do agregado original.
- Para novas LPs, a configuração específica é obrigatória antes da geração.
- A resolução efetiva falha fechado diante de mistura entre contas, LP divergente, catálogo incompatível ou configuração específica ausente quando exigida.

### 1.9. Objetivo explícito da LP

- A E20.2 recebe uma nova versão preservando integralmente as versões anteriores.
- A nova versão adiciona o field universal `landing_page_objective`.
- O field possui:
  - scope `landing_page`;
  - origem esperada `landing_page_provided`;
  - valor string não vazio;
  - obrigação `required` para novas configurações por LP;
  - ausência de substituição genérica por outro scope.
- O objetivo é diferente de nome, slug, funil ou intenção transacional.
- Exemplo de valor: `Ajudar pessoas que buscam o primeiro imóvel no Rio a compreender o processo e iniciar uma conversa pelo WhatsApp.`
- O objetivo aparece na criação, configuração, lista e composição futura da LP.
- A E19.3 passa a transportar esse objetivo como contexto factual e editorial autorizado da LP concreta.
- A LP legada já materializada continua visualizável mesmo sem esse field; nova geração ou variação exige objetivo confirmado humanamente.

### 1.10. Automação

- Automação: **não** na E19.5.
- O recorte não implementa assistente de IA, chat de dúvidas, agente, nova chamada OpenAI, mudança de prompt, modelo, reasoning effort ou workload.
- A geração já implementada na E19.4 permanece boundary externo acionado por ação humana explícita.
- A E19.5 apenas prepara a LP concreta e encaminha a ação ao boundary vigente; não redesenha o mecanismo geracional.
- O Gestor de Automação não participa da avaliação deste plano enquanto a única fase permanecer `Automação: não`.

### 1.11. Fontes usadas

- `README.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/prompt-estrategista.md`.
- `docs/lp-planejamento.md`.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e19-4.md`.
- `docs/schema.md`.
- `supabase/migrations/20260807162417_e19_2_3_account_landing_page_onboarding_configuration.sql`.
- implementação vigente de `app/a/[account]/`, `lib/lp-builder/`, E20.2 e materialização E19.4.

## 2. Contrato do caso

### 2.1. Fluxo lógico

#### 2.1.1. Gatilho

- Conta operacional com onboarding inicial concluído.
- Owner ou admin autenticado abre `/a/[account]`.
- O usuário consulta configurações, cria uma LP, duplica uma configuração, inicia a primeira geração ou produz uma nova variação.

#### 2.1.2. Entrada

- Contexto tenant-aware da conta e do ator.
- Entitlement efetivo e `planKey`.
- Taxon primário autoritativo.
- Catálogo E20.2 resolvido por versão, taxon e plano.
- Valores autoritativos existentes.
- Defaults reutilizáveis da primeira jornada E19.2.
- Configuração específica da LP, quando existente.
- LPs legítimas da conta.
- Materializações e snapshots existentes.

#### 2.1.3. Processamento

- Resolver server-side a visão operacional completa da conta.
- Agrupar configurações em:
  - Conta;
  - Negócio;
  - Oferta;
  - Campanha;
  - Landing page;
  - Integrações somente quando houver integração real configurável.
- Listar todas as LPs da conta sem seleção silenciosa.
- Derivar configuração efetiva por precedência:
  - fonte autoritativa existente;
  - default reutilizável válido;
  - valor específico da LP ou override explicitamente autorizado.
- Nunca usar nome de field, `purpose` ou semelhança textual para decidir precedência ou substituição.
- Encaminhar geração somente para LP `draft`, configurada, pertencente à conta e ainda sem materialização.

#### 2.1.4. Validação

- Validar nome, slug, objetivo e pertencimento da LP.
- Validar todos os valores presentes contra a versão aplicável da E20.2.
- Impedir valor específico de uma LP em outra LP.
- Impedir overwrite da materialização write-once.
- Impedir rebind do agregado E19.2.
- Configuração incompleta bloqueia somente a ação que dela depende e preserva os demais valores válidos.
- Conflito de revisão exige recarga ou nova tentativa explícita, sem last-write-wins silencioso.

#### 2.1.5. Persistência

- Identidade e status permanecem em `public.account_landing_pages`.
- Defaults da primeira jornada permanecem em `public.account_landing_page_onboarding_configurations`.
- Configuração própria de cada nova LP reside em `public.account_landing_page_configurations`.
- Conteúdo e snapshot permanecem em `public.account_landing_page_materializations`.
- Não criar status persistido de geração quando o estado puder ser derivado dessas fontes.
- Nova configuração, duplicação ou geração não copia conteúdo materializado nem snapshot da LP de origem.

#### 2.1.6. Consumo

- O workspace consome identidade, configuração e materialização para apresentar o estado de cada LP.
- A E19.3 e a E19.4 passam a consumir a configuração efetiva da LP concreta.
- Os testes de qualidade usam esse mesmo fluxo oficial para produzir drafts comparáveis.
- A comparação e a nota permanecem humanas e externas ao estado de domínio.

#### 2.1.7. Fallback

- Falha de leitura mantém estado indisponível explícito; não apresentar lista parcial como completa.
- Falha ao criar configuração depois da identidade da LP deixa um draft legítimo, porém incompleto e não gerável, permitindo correção posterior.
- Falha de duplicação ou geração não destrói a origem.
- Conflito de slug exige correção humana.
- Materialização existente bloqueia nova geração sobre a mesma LP.
- Boundary de geração indisponível mantém o novo draft sem materialização.
- Integração inexistente não produz categoria fictícia.

### 2.2. Workspace principal

- `/a/[account]` passa a parecer um workspace operacional, não a continuação do onboarding.
- A home contém:
  - resumo da conta e do plano efetivo;
  - atalhos para categorias de configuração existentes;
  - lista operacional de LPs;
  - ação para nova LP.
- A lista apresenta, no mínimo:
  - nome;
  - status da LP;
  - estado derivado da configuração e da materialização;
  - slug;
  - objetivo;
  - funil;
  - data de criação ou materialização;
  - ações disponíveis.
- Estado derivado distingue, sem nova coluna:
  - configuração incompleta;
  - pronta para gerar;
  - materializada;
  - conteúdo inválido ou versão não suportada.
- Desktop pode usar tabela responsiva.
- Mobile deve preservar compreensão por cards ou composição equivalente, sem depender de scroll horizontal.

### 2.3. Área Configurações

- A home não exibe um formulário gigante.
- Cada categoria abre uma superfície focal com os fields realmente existentes naquele contexto.
- `account`, `business` e `offer` são apresentados como configurações reutilizáveis.
- `campaign` e `landing_page` exigem seleção explícita da LP concreta.
- Integrações só aparecem quando houver contrato e configuração reais no projeto.
- Valor autoritativo pode aparecer como somente leitura quando o domínio responsável não autorizar edição pela E19.5.
- Salvar preserva os demais valores válidos e devolve erro junto do field afetado.

### 2.4. Semântica das ações

#### 2.4.1. Nova LP

- Solicita nome, slug, `landing_page_objective` e os valores específicos aplicáveis.
- Reutiliza defaults vigentes de conta, negócio e oferta sem copiá-los como overrides proibidos.
- Cria a identidade `draft` pelo boundary da E19.1.
- Cria a configuração específica da LP.
- Não inicia geração automaticamente.
- Se a segunda escrita falhar, o draft permanece incompleto e não gerável; a UI não anuncia conclusão integral falsa.

#### 2.4.2. Duplicar configuração

- Cria nova identidade `draft` com nome e slug confirmados humanamente.
- Copia somente os valores específicos de `campaign`, `landing_page` e overrides permitidos da origem.
- Exige revisão do objetivo e dos valores copiados antes de gerar.
- Não copia conteúdo, snapshot, estado materializado ou resposta do provider.
- A LP de origem permanece intacta.

#### 2.4.3. Gerar

- Disponível somente para draft configurado e sem materialização.
- Exige ação humana explícita.
- Reutiliza o boundary vigente da E19.4.
- Falha preserva o draft sem conteúdo e permite nova tentativa humana.

#### 2.4.4. Gerar nova variação

- Substitui o termo ambíguo `Regenerar` na primeira entrega.
- Cria outro draft derivado da configuração autorizada da origem.
- Exige nome, slug e objetivo confirmados.
- Usa os defaults reutilizáveis vigentes e a configuração canônica atual do pipeline.
- Depois da configuração válida, aciona uma nova geração humana pelo boundary da E19.4.
- Falha de geração preserva o novo draft sem materialização.
- Nunca sobrescreve a LP de origem.

### 2.5. Metadados mínimos de comparação

- O workspace não cria engine de experimentos, mas deve permitir identificar com qual configuração cada nova geração foi produzida.
- Novas materializações preservam no snapshot metadados seguros de geração:
  - workload;
  - revisão do workload;
  - modelo;
  - reasoning effort;
  - revisão explícita do prompt.
- O snapshot continua preservando versões de perfil, pesquisa, raiz e catálogos já aplicáveis.
- Não persistir prompt integral, resposta bruta, raciocínio, PII, secret ou `safety_identifier`.
- A primeira LP legada pode exibir `não registrado` para metadados ainda ausentes; não realizar backfill inventado.
- Experimentos futuros de renderer devem preservar compatibilidade por versão de conteúdo/renderer; a E19.5 não cria renderer novo nem altera visual da LP.

### 2.6. Frontend, UX e evidências

- A experiência deve ser clara para usuário não técnico.
- Pending visível impede duplo clique acidental em ações mutáveis.
- Sucesso e erro aparecem junto do contexto afetado.
- Foco avança de forma previsível após criação, erro ou navegação.
- Estados vazio, indisponível, incompleto, pronto, materializado e inválido são compreensíveis sem jargão interno.
- Evidências futuras obrigatórias:
  - desktop em 1280 px;
  - tablet em 768 px;
  - mobile em 360 px;
  - teclado e foco visível;
  - ausência de truncamento e overflow indevido;
  - categorias de configuração compreensíveis;
  - criação e preservação de pelo menos três drafts na mesma conta;
  - duplicação sem copiar materialização;
  - nova variação sem overwrite da origem;
  - abertura do preview correto para cada LP;
  - exibição coerente de objetivo, funil e metadados disponíveis.

### 2.7. Riscos e dependências

- O agregado legado da E19.2 não pode ser reinterpretado como configuração genérica de todas as LPs.
- A nova versão da E20.2 deve preservar as versões anteriores e não reclassificar silenciosamente valores persistidos.
- A E19.3 deve resolver configuração por LP sem criar fallback aproximado ou mistura de fontes.
- A E19.4 deve aceitar a configuração específica e registrar metadados seguros sem mudar seu mecanismo geracional.
- LP materializada permanece independente de defaults e configurações futuras.
- Limites de drafts continuam dependentes de futura admissão e integração da E9.7.

## 3. Fases e próxima ação

### 3.1. E19.5.3 — Workspace operacional, configuração por LP e laboratório de drafts

- Automação: não.
- Objetivo:
  - implementar integralmente o workspace da conta, a configuração específica por LP e as ações determinísticas necessárias para produzir e preservar múltiplos drafts comparáveis.
- Entrega mínima:
  - nova versão E20.2 com `landing_page_objective`;
  - agregado 1:1 de configuração específica por LP;
  - resolução efetiva compatível com a primeira LP legada;
  - home operacional com categorias de configuração e lista de LPs;
  - superfícies focais de configuração reutilizável e específica;
  - ações Nova LP, Duplicar configuração, Gerar e Gerar nova variação;
  - integração com os boundaries E19.1, E19.3 e E19.4 existentes;
  - metadados seguros de geração para comparação humana;
  - validações de banco, boundary, UI e fluxo hospedado.
- Limites:
  - sem IA própria;
  - sem mudança de modelo, prompt, effort ou workload;
  - sem overwrite, rebind ou cópia de materialização;
  - sem limite local de drafts;
  - sem editor, publicação, tracking ou engine de experimentos.
- Critérios de aceite:
  - onboarding inicial da E19.2 continua funcional e não é substituído;
  - owner/admin autorizado acessa o workspace depois da conclusão;
  - configurações são agrupadas a partir da E20.2, sem lista paralela;
  - nova LP nasce com configuração própria e objetivo obrigatório;
  - primeira LP legada permanece visualizável e compatível;
  - três ou mais drafts legítimos podem coexistir na mesma conta;
  - duplicação não copia conteúdo nem snapshot;
  - nova variação preserva integralmente a origem;
  - LP materializada não pode ser gerada novamente pela mesma identidade;
  - estados e ações são derivados e tenant-safe;
  - snapshot novo registra metadados seguros de comparação;
  - verificadores SQL read-only, casos executáveis e `npm run check` aprovam o contrato;
  - Preview hospedado aprova desktop, tablet, mobile, teclado, foco e fluxos humanos previstos;
  - Prompt ABC reconcilia somente os documentos canônicos materialmente afetados.

### 3.2. Próxima ação

- Ajustar `docs/roadmap.md` no mesmo PR #726 conforme `docs/prompt-abc.md` e `docs/template-roadmap.md`:
  - registrar E19.5 como planejada;
  - registrar E19.5.3 com título, objetivo e status planejado;
  - não antecipar banco, arquivos, evidências ou implementação ainda inexistentes.
- Depois da reconciliação do roadmap, apresentar ao humano as opções do item 4 de `docs/prompt-estrategista.md`:
  - Processo atual;
  - Processo automatizado após o merge da v1.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.5

- Assistente de IA ou chat de dúvidas.
- Nova automação OpenAI.
- Alteração de modelo, prompt, reasoning effort ou workload.
- Editor visual ou edição do conteúdo materializado.
- Publicação pública ou domínio customizado.
- Tracking, analytics ou CRM.
- Teste A/B automático.
- Engine de experimentos, ranking ou escolha automática de LP.
- Tabela de notas ou workflow de aprovação.
- Histórico de versões dentro da mesma LP.
- Rollback de conteúdo.
- Comparação visual automatizada.
- Agente, job, fila, cron ou webhook novo.
- Limite comercial de drafts inventado localmente.
- Catálogo de várias ofertas, produtos ou serviços.
- Área de integração sem integração real no projeto.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se a implementação exigir:
  - rebind ou alteração destrutiva do agregado E19.2;
  - overwrite de materialização existente;
  - duplicação de catálogo ou regra por nome de field;
  - capability ou limite comercial não admitido;
  - engine de versões ou experimentos para cumprir o fluxo básico;
  - mudança funcional da geração com IA;
  - publicação, tracking, editor ou outra ampliação de escopo;
  - nova infraestrutura sem consumidor indispensável.
- A E19.5 termina quando a conta consegue organizar configurações, listar suas LPs e produzir múltiplos drafts preservados para comparação humana pelo fluxo oficial.
- Concluir a E19.5 não valida a qualidade da geração, não aprova nenhuma LP para publicação e não modifica automaticamente E18.4, E18.5, E20.3, modelo ou prompt.
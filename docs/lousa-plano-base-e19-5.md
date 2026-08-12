12/08/2026 — Rascunho vivo — E19.5 — Workspace operacional da conta e laboratório de drafts

## 1. Estado do debate

### 1.1. Identificação

- Recorte em debate: `E19.5 — Workspace operacional da conta e laboratório de drafts`.
- Path definitivo: `docs/lousa-plano-base-e19-5.md`.
- Estado: rascunho vivo; ainda não consolidado como plano-base v1.
- Plano conceitual: `docs/lp-planejamento.md`.
- Processo: `docs/prompt-estrategista.md`.
- Etapa atual do processo: item 2 — fluxo operacional e preparação da consolidação futura da v1.

### 1.2. Fontes consultadas até aqui

- `README.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/prompt-estrategista.md`.
- `docs/lp-planejamento.md`.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e19-4.md`.
- `docs/schema.md`.
- `supabase/migrations/20260807162417_e19_2_3_account_landing_page_onboarding_configuration.sql`.
- implementação vigente de `app/a/[account]/` e `lib/lp-builder/`.

### 1.3. Contexto confirmado

- A E19.2 permanece responsável pelo primeiro onboarding pós-entitlement e pela configuração mínima necessária à primeira LP Starter.
- A E20.2 continua sendo a fonte dos campos, escopos, tipos, obrigação, aplicabilidade e validação.
- A primeira LP real comprovou o pipeline técnico de geração, materialização e preview, mas foi reprovada na avaliação humana de qualidade comercial, com nota aproximada de `2/10`.
- O projeto precisa agora testar mudanças de modelo, prompt, perfil, composição e renderer sem destruir os resultados anteriores.
- A superfície atual da conta não oferece workspace permanente, lista operacional de LPs nem acesso organizado às configurações por escopo.
- No estado operacional vigente, `/a/[account]` resolve apenas a LP vinculada ao onboarding e entrega uma jornada focal dessa LP.
- A leitura atual de drafts já pertence ao boundary `lib/lp-builder/`, mas é usada na conclusão do primeiro onboarding e retorna apenas `id`, conta, nome, slug e status.
- A criação de LP `draft` já possui boundary server-side com gates de conta, membership e entitlement, nome obrigatório, slug seguro e unicidade por conta.
- A persistência da E19.2 foi desenhada como um agregado 1:1 por conta para a primeira jornada e possui vínculo `landing_page_id` write-once; isso não resolve sozinho várias LPs com configurações próprias.
- A materialização da E19.4 permanece 1:1 e write-once por LP; resultados anteriores não podem ser sobrescritos silenciosamente durante os testes.

### 1.4. Decisão de automação

- Automação: **não** no recorte E19.5.
- A primeira entrega não implementa assistente de IA, chat de dúvidas, recomendação automática, agente, nova chamada OpenAI, alteração de prompt, modelo, reasoning effort ou workload.
- A superfície pode encaminhar uma ação humana para o boundary de geração já implementado na E19.4, mas essa automação permanece contrato externo e não é redesenhada, detalhada ou ampliada pela E19.5.
- A E19.5 organiza configurações, LPs e ações determinísticas do workspace; não cria automação própria.
- O Gestor de Automação não participa da avaliação deste plano enquanto todas as fases permanecerem `Automação: não`.
- Assistência futura por IA para dúvidas ou configuração exige recorte e decisão próprios, depois de comprovada a capacidade de gerar LPs com qualidade aceitável.

## 2. Problema e resultado esperado

### 2.1. Problema

- Depois do onboarding, a conta não possui uma área operacional adequada para administrar configurações e várias LPs.
- Cada teste de qualidade exige hoje uma operação isolada, sem lista comparável de resultados.
- Não existe ainda uma separação de UX suficientemente clara entre valores reutilizáveis e valores específicos de campanha ou LP.
- O agregado atual da E19.2 mistura valores de diferentes escopos porque foi criado para a primeira jornada, e seu vínculo write-once não pode ser reutilizado como configuração de várias LPs.
- A primeira materialização é write-once e não deve ser sobrescrita silenciosamente durante os experimentos.
- O objetivo editorial/comercial específico da LP não possui hoje representação explícita suficiente para orientar e identificar os testes.

### 2.2. Resultado esperado

- Transformar `/a/[account]` em um workspace operacional simples para owner e admin elegíveis.
- Preservar o onboarding inicial da E19.2 para a primeira LP.
- Disponibilizar, depois da conclusão do onboarding, acesso organizado às configurações vigentes por escopo.
- Exibir a lista de LPs da conta e seus estados relevantes.
- Permitir produzir e preservar vários drafts para comparação humana durante os testes de qualidade.
- Permitir repetir testes sem overwrite da LP materializada anterior.
- Reutilizar o pipeline oficial do produto, sem laboratório paralelo, manipulação manual de banco ou fluxo especial para a conta piloto.

## 3. Fronteira preliminar do recorte

### 3.1. Configurações pós-onboarding

- Organizar os valores realmente existentes por contexto compreensível para o cliente:
  - conta;
  - negócio;
  - oferta;
  - campanha;
  - landing page;
  - integrações somente quando houver integração real configurável.
- Derivar a organização dos escopos vigentes da E20.2 e das fontes autoritativas existentes, sem criar lista paralela de campos.
- Preservar a distinção entre:
  - valores reutilizáveis de conta, negócio ou oferta;
  - valores específicos de campanha ou landing page.
- Não transformar os nomes técnicos dos scopes em linguagem obrigatória para o cliente.
- Não substituir a primeira jornada guiada da E19.2 por um painel técnico gigante.
- A primeira entrega apresenta somente categorias e campos que possuam fonte real no projeto.

### 3.2. Workspace de LPs

- Exibir uma lista operacional de todas as LPs legítimas da conta, e não apenas a primeira LP vinculada ao onboarding.
- Separar claramente:
  - status da LP, inicialmente `draft`;
  - estado derivado do conteúdo, como sem materialização, materializada ou inválida.
- Colunas candidatas, ainda sujeitas ao fechamento do contrato:
  - nome;
  - status da LP;
  - estado derivado da geração/materialização;
  - slug;
  - objetivo;
  - funil;
  - data de criação ou materialização;
  - ações disponíveis.
- Ações candidatas, ainda sujeitas ao fechamento do contrato:
  - abrir preview;
  - abrir configurações;
  - criar nova LP;
  - duplicar configuração para teste;
  - gerar uma LP ainda não materializada;
  - regenerar preservando o resultado anterior.
- Estado derivado não deve criar coluna ou status novo quando puder ser comprovado pela identidade da LP, sua configuração e sua materialização existentes.

### 3.3. Laboratório de drafts

- Durante a fase de validação de qualidade, não aplicar limite local inventado para a quantidade de drafts.
- Limites comerciais futuros continuam sob a E9.7 quando houver capability e integração canônicas.
- Cada alteração de modelo, prompt, E18.5, E20.3 ou renderer deve poder produzir um novo resultado comparável.
- A hipótese preferencial continua sendo que regeneração produza outro draft, sem overwrite da LP materializada anterior.
- Comparação humana entre previews é suficiente nesta primeira entrega; não criar engine automática de experimentos.
- A E19.5 não escolhe modelo, prompt, profile ou renderer pelo workspace; ela apenas preserva resultados produzidos pelas configurações canônicas vigentes em cada tentativa.

## 4. Fluxo operacional do item 2

### 4.1. Gatilho

- Conta `active`.
- Entitlement comercial válido.
- Membership `active` com papel `owner` ou `admin`.
- Onboarding inicial da E19.2 concluído.
- Acesso humano ao workspace autenticado da conta.

### 4.2. Entrada

- Contexto tenant-aware da conta e do ator autenticado.
- Entitlement efetivo e `planKey` vigente.
- Taxon primário autoritativo.
- Catálogo E20.2 resolvido para o taxon e plano.
- Configuração vigente da primeira jornada E19.2.
- Valores autoritativos já existentes.
- LPs legítimas da conta.
- Materializações existentes e estados deriváveis.
- Configurações reutilizáveis e configurações específicas de LP/campanha, quando sua residência estiver definida.

### 4.3. Processamento

- Resolver server-side o estado operacional da conta.
- Exibir uma visão principal com:
  - atalhos para configurações por categoria;
  - lista operacional de LPs;
  - estado derivado de cada LP;
  - ações compatíveis com o estado atual.
- Resolver os campos da área Configurações a partir da E20.2 e das fontes autoritativas, agrupando-os por escopo sem duplicar o catálogo.
- Ao criar uma nova LP:
  - solicitar identidade mínima, objetivo e valores específicos necessários;
  - reutilizar explicitamente valores aplicáveis da conta, negócio e oferta;
  - criar a identidade `draft` pelo boundary vigente da E19.1;
  - não gerar conteúdo automaticamente.
- Ao duplicar para teste:
  - criar outra identidade `draft`;
  - copiar somente os valores autorizados pelo contrato de duplicação;
  - manter a LP de origem intacta;
  - não copiar materialização como se fosse nova geração.
- Ao gerar uma LP ainda não materializada:
  - exigir ação humana explícita;
  - encaminhar ao boundary vigente da E19.4;
  - preservar falha sem materialização parcial.
- Ao regenerar para comparação:
  - a proposta atual é criar outro draft derivado;
  - reutilizar a configuração autorizada da LP de origem;
  - encaminhar uma nova ação humana ao boundary existente de geração;
  - preservar integralmente a LP e a materialização de origem.

### 4.4. Validação

- Revalidar conta, membership e entitlement em toda ação mutável.
- Derivar `accountId` e ator server-side.
- Validar nome, slug e pertencimento da LP à conta.
- Validar os valores presentes contra o catálogo E20.2, seus escopos, tipos, obrigação, aplicabilidade e políticas de substituição.
- Impedir que valor específico de uma LP seja aplicado silenciosamente a outra.
- Impedir mistura entre contas.
- Impedir overwrite ou rebind do agregado atual da primeira jornada.
- Impedir overwrite da materialização write-once.
- Não inventar capability comercial nem limite local de drafts.
- Não considerar configuração incompleta como pronta para a ação que depende dela.

### 4.5. Persistência

- A identidade e o status da LP continuam em `public.account_landing_pages`.
- A existência e o estado próprio do conteúdo continuam em `public.account_landing_page_materializations`.
- O agregado atual `public.account_landing_page_onboarding_configurations` permanece preservado como registro da primeira jornada por conta e não pode ser rebindado para outra LP.
- O contrato lógico precisa distinguir:
  - valores reutilizáveis de conta, negócio e oferta;
  - valores específicos de campanha e landing page vinculados a uma LP concreta.
- A residência física da configuração específica por LP ainda não está definida.
- Nova tabela, coluna, migration ou mudança do agregado atual só pode entrar depois de inspeção focal do schema e escolha da menor residência segura.
- A lista e os estados derivados não criam persistência nova por si só.
- Duplicação ou regeneração não copiam conteúdo materializado nem snapshot da LP de origem.

### 4.6. Consumo

- Owner e admin usam o workspace para:
  - consultar configurações;
  - administrar várias LPs;
  - criar drafts;
  - abrir previews;
  - produzir resultados comparáveis por ação humana.
- A E19.3 e a E19.4 consomem a configuração efetiva da LP concreta, depois que o contrato por LP estiver disponível.
- Os testes de modelo, prompt, perfil, módulos e renderer reutilizam esse mesmo fluxo oficial.
- A comparação permanece humana e externa ao estado de domínio nesta entrega.

### 4.7. Fallback

- Falha de leitura preserva estado explícito, sem apresentar lista parcial como completa.
- Falha de criação, duplicação ou geração não destrói drafts anteriores.
- Conflito de slug solicita correção explícita.
- Configuração incompleta bloqueia somente a ação que dela depende e preserva os demais valores válidos.
- LP ou configuração de outra conta falha fechado.
- Materialização já existente não é sobrescrita.
- Integração inexistente não produz área ou configuração fictícia.
- Boundary externo de geração indisponível mantém o draft sem nova materialização.

### 4.8. Contrato de frontend e evidências

- A página principal deve parecer um workspace operacional, não a continuação do formulário de onboarding.
- Configurações aparecem por categorias claras e com acesso focal, sem formulário gigante na home.
- Em desktop, a lista pode usar tabela responsiva; em mobile, deve preservar compreensão por cards ou outra composição equivalente sem scroll horizontal obrigatório.
- Nome, status, slug, objetivo, funil, estado de geração e ações devem permanecer legíveis e distinguíveis.
- Ações mutáveis devem ter pending visível, impedir duplo clique acidental e devolver sucesso ou erro junto do contexto afetado.
- Foco deve avançar de forma previsível após criação, erro ou navegação.
- Estados vazio, carregando, indisponível, incompleto, sem materialização, materializado e inválido devem ser compreensíveis sem jargão interno.
- Evidência futura deve cobrir:
  - desktop em 1280 px;
  - tablet em 768 px;
  - mobile em 360 px;
  - teclado e foco visível;
  - ausência de truncamento e overflow indevido;
  - criação e preservação de mais de um draft;
  - separação visual entre configurações reutilizáveis e específicas;
  - abertura do preview correto para cada LP.

## 5. Decisões já aceitas

### 5.1. Preservação da E19.2

- O primeiro onboarding permanece vigente.
- A área posterior de Configurações é evolução do contrato da E19.2 e consome os escopos da E20.2.
- A E19.2 não passa a ser dona da lista operacional de LPs nem do laboratório de drafts.
- O agregado write-once da primeira jornada não será rebindado ou usado como configuração mutável de várias LPs.

### 5.2. Novo recorte funcional

- Configurações pós-onboarding, lista de LPs, múltiplos drafts e testes repetidos formam um novo resultado operacional.
- O identificador adotado durante o debate é E19.5.
- A implementação deve reutilizar preferencialmente arquivos, boundaries e contratos existentes; novo recorte não significa nova infraestrutura por padrão.

### 5.3. Prioridade atual

- A prioridade é criar a superfície que permita testar iterativamente a qualidade final do produto.
- Publicação, tracking e expansão comercial não avançam antes de o processo produzir LPs com qualidade aceitável.

### 5.4. Ausência de automação própria

- Todas as fases da E19.5 serão planejadas inicialmente como `Automação: não`.
- Não haverá Gestor de Automação neste recorte.
- A geração com IA já existente na E19.4 permanece dependência externa acionada pelo humano, sem alteração funcional dentro da E19.5.

### 5.5. Invariantes operacionais

- Várias LPs da mesma conta devem ser listadas sem seleção silenciosa.
- Estado de conteúdo deve ser derivado quando possível, sem status paralelo.
- Nenhum teste pode destruir ou sobrescrever um resultado anterior.
- Não existe limite local de drafts enquanto a E9.7 não admitir e integrar essa capacidade.
- Conta piloto e clientes usam o mesmo workspace e os mesmos boundaries.

## 6. Questões abertas indispensáveis

### 6.1. Propriedade e residência física das configurações

- A divisão lógica está encaminhada:
  - conta, negócio e oferta funcionam como valores reutilizáveis;
  - campanha e landing page pertencem à LP concreta.
- Ainda precisa ser fechado:
  - qual é a menor residência física segura para a configuração específica por LP;
  - como preservar a primeira LP já vinculada ao agregado E19.2 sem backfill ou rebind inseguro;
  - como editar valores reutilizáveis sem alterar silenciosamente LPs já materializadas.

### 6.2. Objetivo da LP

- Qual contrato deve representar explicitamente o objetivo editorial/comercial da LP, como `compra do primeiro imóvel no Rio`?
- A proposta atual é tratá-lo como input específico de `landing_page`, separado do nome e do slug, mas isso ainda depende de decisão humana e alinhamento com a E20.2.
- É preciso definir como o objetivo aparece em criação, duplicação, lista e contexto futuro de geração.

### 6.3. Semântica das ações

- O que exatamente é copiado ao criar nova LP, duplicar ou regenerar?
- A proposta atual é:
  - nova LP: reutiliza defaults, mas exige confirmação dos valores específicos;
  - duplicação: copia configuração específica autorizada, sem conteúdo materializado;
  - regeneração: cria novo draft derivado e inicia nova geração humana, preservando a origem.
- Essa semântica ainda precisa de aprovação humana antes de se tornar decisão fixa.
- Quais metadados precisam ficar visíveis para comparar modelo, effort, prompt, perfil e versões estruturais sem criar engine de experimentos?

### 6.4. Fases executáveis

- Ainda não fechar as fases antes de resolver a residência por LP, o objetivo e a semântica definitiva das ações.
- A v1 deve evitar esconder implementações autônomas em uma única fase.
- Todas as fases deverão registrar `Automação: não`.

## 7. Escopo negativo preliminar

- Assistente de IA ou chat de dúvidas.
- Nova automação OpenAI.
- Mudança de modelo, prompt, reasoning effort ou workload.
- Editor visual.
- Edição manual do conteúdo materializado.
- Publicação pública.
- Domínio customizado.
- Tracking ou analytics.
- Teste A/B automático.
- Engine de experimentos.
- Ranking automático de LPs.
- Tabela de notas ou workflow de aprovação.
- Histórico de versões dentro da mesma LP.
- Rollback.
- Agente autônomo.
- Job, fila, cron ou webhook novo.
- Limite comercial de drafts inventado localmente.

## 8. Próximo ponto do debate

- Fechar o primeiro gate do item 2: contrato lógico de configuração para múltiplas LPs.
- Proposta para decisão humana:
  - preservar o agregado E19.2 como bootstrap da primeira jornada;
  - tratar conta, negócio e oferta como defaults reutilizáveis;
  - criar configuração específica por LP para campanha, objetivo, funil, intenção e conversão;
  - não reler defaults mutáveis para alterar LP materializada;
  - nova LP confirma valores específicos;
  - duplicação copia somente configuração autorizada;
  - regeneração cria novo draft e preserva a origem.
- Depois dessa decisão, investigar a menor residência física contra o schema real e fechar as fases executáveis antes da consolidação da v1.
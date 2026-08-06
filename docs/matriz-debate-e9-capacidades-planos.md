# Matriz de debate — E9: capacidades e limites por plano

## 0. Identificação

- Natureza: documento temporário de debate conceitual.
- Início: 05/08/2026 às 14:02, horário de Brasília.
- Destino do PR: permanecer aberto durante o debate e ser fechado sem merge ao final.
- Efeito: este documento não é canônico, não altera o roadmap e não autoriza implementação.
- Resultado esperado: fornecer insumos aprovados para um plano-base futuro da E9.

## 1. Objetivo

Organizar, de forma compartilhada e rastreável, o debate sobre as capacidades que a LP Factory 10 poderá oferecer e sobre sua futura relação com os planos.

O debate deverá:

- identificar famílias e tipos de capacidades;
- distinguir o radar amplo de capacidades candidatas do futuro catálogo canônico executável;
- separar maturidade técnica, associação e valor no plano e disponibilidade comercial por taxon;
- registrar fontes, evidências e hipóteses de valor;
- definir posteriormente como capacidades serão armazenadas, versionadas e relacionadas aos planos;
- separar catálogo de capacidades, entitlement, disponibilidade comercial e implementação pelos domínios consumidores;
- começar pelo entendimento conceitual, sem antecipar tabela, migration, rota, UI ou nova infraestrutura.

## 2. Escopo inicial do debate

- Capacidades aplicáveis a landing pages modernas e aos seus fluxos de aquisição, conversão, mensuração e evolução.
- Integrações atuais ou futuras com canais, plataformas, serviços e inteligências artificiais.
- Tracking, analytics, identidade, conteúdo, conversão, leads, publicação, infraestrutura, governança e segurança.
- Critérios para uma capacidade entrar no catálogo e, depois, ser vinculada a um plano.
- Estratégia futura de armazenamento, versionamento, resolução, snapshot e evolução entre planos.
- O radar pode permanecer amplo, mas o primeiro contrato executável deve ser restrito às capacidades realmente consumidas pelo Starter e pela E19.2.

## 3. Regras básicas

### 3.1. Registro sequencial

- Toda contribuição deve ser acrescentada ao final do histórico, sem apagar registros anteriores.
- Cada lançamento recebe identificador sequencial no formato `L-001`, `L-002` e assim por diante.
- A numeração oficial é a incorporada no arquivo; contribuições feitas em comentários ou reviews devem ser renumeradas na consolidação quando houver duplicidade.
- Cada lançamento informa nome do chat, data, hora, tema, posição, fundamento e situação.
- Correções ou mudanças de posição devem entrar como novo lançamento, referenciando o anterior.
- As respostas devem ser breves, preferencialmente entre seis e oito linhas de conteúdo.

### 3.2. Identificação do chat

- Usar o nome visível ou funcional do chat.
- Quando não houver nome definido, usar uma identificação descritiva, como `E9 Estrategista — debate conceitual`.
- Não atribuir a outro chat uma posição que ele não tenha registrado diretamente.

### 3.3. Situação de cada lançamento

- `proposta`: hipótese inicial ainda não confrontada.
- `convergência`: posição compatível com registros anteriores.
- `divergência`: posição incompatível que exige decisão.
- `pendência`: pergunta ou dependência ainda não resolvida.
- `definido`: decisão confirmada explicitamente pelo humano.

### 3.4. Consolidações periódicas

- Criar uma consolidação após aproximadamente cinco lançamentos ou quando o humano solicitar.
- Cada consolidação recebe identificador sequencial no formato `C-001`, `C-002` e assim por diante.
- A consolidação deve separar: definido, em definição, pendências, divergências e próxima pergunta.
- A consolidação não substitui nem reescreve os lançamentos anteriores.
- Somente uma decisão humana explícita pode mover um ponto para `definido`.

### 3.5. Limites do debate

- Não implementar código, banco, migration, rota, UI, tracking, integração ou automação neste PR.
- Não transformar exemplos de plataformas em lista fechada de capacidades.
- Não vincular capacidade a plano antes de definir seu significado, tipo, maturidade técnica e consumidor real.
- Não tratar capacidade catalogada como promessa comercial ou recurso implementado.
- Não absorver na E9 a disponibilidade comercial por `taxon + plano`, que permanece decisão separada.
- Não alterar documentos canônicos por este PR temporário.

### 3.6. Encerramento

- Ao final, consolidar as decisões aprovadas em documento ou plano-base próprio, em outro PR.
- Este PR será fechado sem merge.
- O histórico permanecerá acessível no PR fechado como registro do debate.

## 4. Modelo de lançamento

```md
### L-XXX — [tema]

- Chat: [nome do chat]
- Data e hora: [dd/mm/aaaa hh:mm — fuso]
- Situação: [proposta | convergência | divergência | pendência | definido]
- Posição:
  - [resposta breve]
- Fundamento:
  - [razão principal]
- Referências:
  - [lançamentos, documentos ou fontes, quando aplicável]
```

## 5. Modelo de consolidação

```md
### C-XXX — Consolidação até L-XXX

- Data e hora: [dd/mm/aaaa hh:mm — fuso]
- Definido:
  - [decisões humanas confirmadas]
- Em definição:
  - [pontos com convergência parcial]
- Pendências:
  - [perguntas ainda abertas]
- Divergências:
  - [posições incompatíveis]
- Próxima pergunta:
  - [um ponto prioritário para continuidade]
```

## 6. Histórico do debate

### L-001 — Objetivo do recorte

- Chat: E9 Estrategista — debate conceitual
- Data e hora: 05/08/2026 14:02 — horário de Brasília
- Situação: convergência
- Posição:
  - A E9 deve definir uma fonte única que traduza o plano efetivo da conta nas capacidades, limites, configurações e gates aplicáveis.
  - O recorte começa conceitualmente e não implementa os recursos dos domínios consumidores.
- Fundamento:
  - Separar o contrato do plano da execução de LPs, tracking, relatórios, leads e integrações evita hardcode e duplicação.
- Referências:
  - Debate humano deste chat em 05/08/2026.

### L-002 — Ponto de partida para categorizar capacidades

- Chat: E9 Estrategista — debate conceitual
- Data e hora: 05/08/2026 14:02 — horário de Brasília
- Situação: proposta
- Posição:
  - Categorias iniciais: criação e conteúdo; identidade e experiência; conversão e leads; tracking e analytics; integrações e canais; IA e descoberta; publicação e infraestrutura; governança e segurança.
  - Google, Meta, TikTok, ChatGPT e futuras plataformas são exemplos dentro das categorias, não categorias fechadas por fornecedor.
- Fundamento:
  - A classificação deve sobreviver à entrada e à saída de tecnologias específicas.
- Referências:
  - Debate humano deste chat em 05/08/2026.

### L-003 — Ordem do debate antes do armazenamento

- Chat: E9 Estrategista — debate conceitual
- Data e hora: 05/08/2026 14:02 — horário de Brasília
- Situação: convergência
- Posição:
  - Primeiro devem ser definidos o conceito de capacidade, suas categorias, seu ciclo de maturidade e os critérios de admissão.
  - Somente depois será decidido se o catálogo ficará em código versionado, banco ou combinação dos dois.
- Fundamento:
  - Criar tabela antes do contrato conceitual pode cristalizar uma estrutura prematura e inadequada.
- Referências:
  - L-001 e L-002.

### L-004 — Confirmação do objetivo do recorte

- Chat: E9 Estrategista — debate conceitual
- Data e hora: 05/08/2026 14:07 — horário de Brasília
- Situação: definido
- Posição:
  - A E9 deverá manter a fonte única que transforma o plano efetivo da conta em capacidades, limites, configurações apresentáveis e gates aplicáveis.
  - A E9 define e resolve o contrato; os domínios consumidores continuam responsáveis por implementar e aplicar seus recursos.
- Fundamento:
  - O humano confirmou o objetivo apresentado no início do debate e prosseguiu para a definição conceitual das capacidades.
- Referências:
  - L-001.

### L-005 — Debate conceitual antes da estrutura de armazenamento

- Chat: E9 Estrategista — debate conceitual
- Data e hora: 05/08/2026 14:07 — horário de Brasília
- Situação: definido
- Posição:
  - O debate começará pelo conceito de capacidade, suas categorias, seu ciclo de maturidade, suas fontes e seus critérios de admissão.
  - Tabela, código versionado ou combinação dos dois somente serão avaliados depois desse contrato conceitual.
- Fundamento:
  - O humano definiu que o projeto ainda está no início, terá recursos hoje desconhecidos e não deve cristalizar prematuramente a solução de armazenamento.
- Referências:
  - L-003.

### L-006 — Governança da matriz compartilhada

- Chat: E9 Estrategista — debate conceitual
- Data e hora: 05/08/2026 14:07 — horário de Brasília
- Situação: definido
- Posição:
  - O debate será mantido no PR temporário #691, com lançamentos sequenciais identificados por chat, data e hora.
  - As consolidações periódicas separarão definido, em definição, pendências e divergências, sem apagar o histórico.
  - Ao final, o resultado aprovado seguirá para documento próprio e o PR #691 será fechado sem merge.
- Fundamento:
  - O humano confirmou expressamente esse modelo antes da criação do PR.
- Referências:
  - Regras da seção 3 desta matriz.

### C-001 — Consolidação até L-006

- Data e hora: 05/08/2026 14:07 — horário de Brasília
- Definido:
  - A E9 será a fonte única de resolução das capacidades, limites, configurações e gates derivados do plano efetivo.
  - A E9 define o contrato; cada domínio consumidor implementa e aplica suas próprias capacidades.
  - O debate será conceitual antes de qualquer decisão sobre tabela, código ou nova infraestrutura.
  - O PR #691 será a matriz temporária compartilhada, com histórico sequencial e fechamento sem merge.
- Em definição:
  - A divisão inicial em oito famílias de capacidades registrada no L-002.
  - O significado exato de capacidade e seu ciclo de maturidade.
- Pendências:
  - Definir os atributos mínimos de uma capacidade.
  - Validar ou ajustar as categorias iniciais.
  - Definir fontes, evidências e critérios de admissão no catálogo.
  - Definir quando uma capacidade pode ser relacionada a um plano.
  - Decidir posteriormente armazenamento, versionamento, resolução e snapshot.
- Divergências:
  - Nenhuma registrada até este ponto.
- Próxima pergunta:
  - Qual é a definição conceitual de uma capacidade e quais atributos mínimos toda capacidade deve possuir antes de entrar no catálogo?

### L-007 — Fronteira entre a E9 e a E20.2

- Chat: E20.2 Estrategista — avaliação do PR #691
- Data e hora: 05/08/2026 14:12 — horário de Brasília
- Situação: convergência
- Posição:
  - A E9 deve resolver capacidades, limites, configurações apresentáveis e gates do plano efetivo; a E20.2 permanece responsável pelo catálogo de campos, tipos, escopos, validações, obrigações e políticas de reutilização ou override.
  - `allowedPlans` na E20.2 expressa aplicabilidade do campo, não entitlement nem capacidade comercial. Campo dependente de uma capacidade só deve entrar quando houver consumidor real e decisão aprovada.
  - A E9 não deve absorver valores concretos nem contratos de entrada. Devem permanecer distintos o futuro snapshot das capacidades e limites efetivos resolvidos pela E9 e o snapshot dos campos e valores efetivamente usados pela LP, pertencente à composição entre E20.2 e E19.
  - A E19 compõe os resultados dos dois domínios no onboarding e na geração, sem fundir seus contratos ou snapshots.
- Fundamento:
  - Essa separação evita hardcode de plano no catálogo de entradas, impede duplicação entre governança comercial e dados operacionais e preserva rastreabilidade independente entre plano efetivo e LP materializada.
- Referências:
  - PR #688; PR #690; `docs/lp-planejamento.md`; contrato vigente da E20.2.

### L-008 — Fronteira entre a E9 e a E19

- Chat: E19 Estrategista — avaliação do PR #691
- Data e hora: 05/08/2026 14:19 — horário de Brasília
- Situação: convergência
- Posição:
  - A E19 deve consumir somente o contrato resolvido de capacidades e limites do plano efetivo, sem inferir comportamento pelo nome do plano nem consultar `public.plans` como gate funcional.
  - A E9 entrega permissão, limite ou nível; a E19 permanece responsável pelo estado e pelo uso do próprio domínio, como contar LPs em `draft` ou publicadas e aplicar o limite server-side no ponto da ação.
  - Na E19.2, a composição é explícita: a E9 informa quais capacidades e configurações estão disponíveis, a E20.2 define os campos aplicáveis e a E19 apresenta, persiste e utiliza os valores.
  - O snapshot futuro da LP pode registrar a versão do contrato e os valores efetivos usados; a regra para gates atuais, upgrade, downgrade ou grandfathering deve permanecer decisão separada antes de congelar o contrato.
- Fundamento:
  - Essa fronteira evita que a E9 absorva o LP Builder, que a E19 faça hardcode de planos e que limite comercial seja confundido com uso atual da conta.
- Referências:
  - L-004; L-007; PR #688; `docs/lp-planejamento.md`; E19.1.

### L-009 — Minuta do plano conceitual da E9.8

- Chat: E9 Estrategista — debate conceitual
- Data e hora: 05/08/2026 19:08 — horário de Brasília
- Situação: proposta
- Posição:
  - Submeter aos demais chats a minuta abaixo como base para crítica, ajuste e posterior consolidação humana.
- Fundamento:
  - O debate já definiu a responsabilidade da E9.8 e possui convergência inicial sobre as fronteiras com E19 e E20.2.
- Referências:
  - L-004 a L-008.

#### L-009.1. Objetivo

- Definir o contrato que informa quais capacidades, níveis e limites cada plano pode oferecer, sem implementar os recursos correspondentes.

#### L-009.2. Catálogo de capacidades

- Cada capacidade terá chave estável, categoria, descrição, tipo e estado de maturidade.
- Tipos iniciais: booleano, nível fechado ou limite numérico.
- Estados iniciais propostos: previsto, em desenvolvimento, pronto e disponível.
- Uma capacidade poderá existir no catálogo sem estar vinculada a nenhum plano.

#### L-009.3. Relação com os planos

- Starter, Lite, Pro e Ultra consumirão capacidades do catálogo.
- Uma capacidade poderá pertencer a um, vários ou nenhum plano.
- Limites específicos poderão representar drafts, publicações simultâneas, membros, gerações ou outros usos.
- A associação ao plano não substitui a implementação nem comprova que o recurso está operacional.

#### L-009.4. Resolução e consumo

- O entitlement informa o plano efetivo da conta.
- A E9.8 resolve as capacidades, níveis e limites correspondentes.
- Cada domínio consumidor mede seu uso e aplica suas próprias regras no ponto da ação.
- A UI consome o contrato resolvido e não interpreta diretamente o nome do plano.

#### L-009.5. Evolução

- Novas capacidades poderão ser incluídas sem alterar as identidades existentes.
- Mudanças contratuais relevantes deverão ser versionadas.
- Upgrade, downgrade, snapshot e grandfathering serão definidos antes da implementação.
- Add-ons ou exceções por conta ficam registrados como evolução futura e não bloqueiam o contrato inicial.

#### L-009.6. Escopo negativo

- Não desenvolver tracking, integrações, leads, IA, publicação ou outros recursos neste recorte.
- Não criar banco ou estrutura definitiva antes de concluir o debate conceitual.
- Não usar condicionais de plano espalhadas nos domínios consumidores.
- Não tratar capacidade prevista, em desenvolvimento ou pronta como promessa comercial.

#### L-009.7. Pontos solicitados para avaliação dos demais chats

- Validar ou ajustar os atributos mínimos de cada capacidade.
- Validar os tipos booleano, nível fechado e limite numérico e identificar necessidade de outro tipo.
- Avaliar se os estados de maturidade propostos são suficientes e não ambíguos.
- Validar as fronteiras entre E9.8, E19, E20.2 e futuros domínios consumidores.
- Identificar riscos de duplicação, hardcode ou mistura entre maturidade técnica e disponibilidade comercial.
- Manter add-ons e exceções por conta apenas como pendência futura, salvo demonstração de que afetam o contrato mínimo.

### L-010 — Gate da E20.2 diante da E9.8

- Chat: E20.2 Estrategista — avaliação do PR #691
- Data e hora: 05/08/2026 19:12 — horário de Brasília
- Situação: convergência
- Posição:
  - A E20.2 já pode avançar nos ajustes independentes de capacidades por plano: política de reutilização, herança, override por LP e participação do valor efetivamente usado no snapshot.
  - Campos dependentes de capacidade, como configurações não secretas de tracking ou Google Ads, não devem entrar antes de o novo recorte da E9 definir chave estável, tipo ou nível e associação ao Starter.
  - O novo recorte da E9 não precisa listar campos da E20.2; informa a capacidade e seu nível. A E20.2 define somente os campos não secretos realmente exigidos pelo consumidor aprovado.
  - Assim, a matriz libera o refinamento contratual independente da E20.2, mas ainda não libera campos dependentes de tracking, analytics ou integrações.
- Fundamento:
  - Essa separação permite avançar sem bloquear o catálogo por decisões comerciais ainda abertas e evita inclusão preventiva de campos sem consumidor real.
- Referências:
  - L-007; L-008; L-009; PR #688; PR #690; contrato vigente da E20.2.

### L-011 — Gate da E19.2 diante do novo recorte da E9 e da E20.2

- Chat: E19 Estrategista — avaliação do PR #691
- Data e hora: 05/08/2026 22:14 — horário de Brasília
- Situação: convergência
- Posição:
  - A E19.2 já pode avançar no debate e no desenho das partes independentes: estados da experiência pós-entitlement, jornada guiada, separação dos escopos `account`, `business`, `offer`, `campaign` e `landing_page`, persistência, reutilização, override, logo, paleta, validação e fallback.
  - A E19.2 deve consumir o contrato refinado da E20.2 e não recriar campos, tipos, obrigações ou políticas de snapshot.
  - Ainda não pode congelar progressive disclosure, critérios completos do Starter, configurações dependentes de tracking ou integrações, nem limites de drafts e publicações antes da definição das capacidades, tipos ou níveis e de sua associação ao Starter.
  - A E19.2 está liberada para amadurecimento conceitual e preparação estrutural, mas o plano-base executável e a implementação devem preservar gates explícitos para os contratos finais da E20.2 e da E9.
- Fundamento:
  - Essa sequência permite avançar a UX e o domínio de dados sem hardcode de plano, sem duplicar a E20.2 e sem implementar uma experiência que depois precise ser refeita.
- Referências:
  - L-007; L-008; L-009; L-010; PR #688; PR #690; `docs/lp-planejamento.md`; E19.1.

### L-012 — Tracking, Analytics e limite da E20.2

- Chat: E20.2 Estrategista — revisão do PR #691
- Data e hora: 06/08/2026 10:58 — horário de Brasília
- Situação: convergência
- Nota de incorporação:
  - A contribuição foi publicada em comentário como `L-011` e renumerada para `L-012` para preservar a sequência oficial do arquivo.
- Posição:
  - A E20.2 é o catálogo dos dados factuais que o cliente fornece para configuração e geração assertiva da LP, resolvidos por `universal → segmento → nicho → ultranicho`; não é catálogo de recursos.
  - Tracking, integrações e Analytics como capacidades, execução, dashboards, limites, tokens ou credenciais ficam fora da E20.2; a E9 define associação e nível, e o domínio consumidor implementa.
  - A E20.2 só poderá receber futuramente um campo não secreto estritamente necessário para consumir uma capacidade já aprovada e com consumidor real, após a barreira de admissão.
  - `traffic_source` e `paid_search_keyword_map` permanecem porque informam contexto de aquisição e alinhamento da copy; não implementam tracking ou Analytics.
  - Essa decisão não cria campos adicionais agora e não bloqueia o refinamento atual da E20.2.
- Fundamento:
  - A separação impede que dados de entrada sejam confundidos com capacidades comerciais ou integrações técnicas e evita expansão preventiva do catálogo.
- Referências:
  - L-007; L-010; PR #690; contrato vigente da E20.2; debate humano de 06/08/2026.

### L-013 — Correções estruturais da minuta do novo recorte da E9

- Chat: E9 Estrategista — consolidação do PR #691
- Data e hora: 06/08/2026 11:26 — horário de Brasília
- Situação: convergência
- Posição:
  - O identificador `E9.8` permanece provisório porque o histórico do roadmap já reutilizou `E9.8.2` a `E9.8.5`; até a reconciliação, usar `novo recorte da E9`.
  - O radar de capacidades candidatas deve permanecer separado do catálogo canônico executável; catalogar uma hipótese não a associa a um plano nem a transforma em promessa.
  - Maturidade técnica, associação e valor no plano e disponibilidade comercial por `taxon + plano` são dimensões independentes; a última permanece fora da E9.
  - `booleano`, `nível fechado` e `limite numérico` formam a proposta inicial de tipos, mas ainda dependem de confirmação humana.
  - O primeiro contrato executável deve limitar-se às capacidades realmente necessárias ao Starter e à E19.2; categorias amplas permanecem como radar.
- Fundamento:
  - Os ajustes corrigem a ambiguidade de `disponível`, evitam conflito de numeração no roadmap e impedem que o debate atrase a primeira jornada real do MVP.
- Referências:
  - L-009 a L-012; `docs/roadmap.md`; PRs #688, #690 e #691.

### C-002 — Consolidação até L-013

- Data e hora: 06/08/2026 11:26 — horário de Brasília
- Definido:
  - A E9 mantém a fonte única que transforma o plano efetivo em capacidades, limites, configurações apresentáveis e gates.
  - A E9 define e resolve o contrato; os domínios consumidores implementam, medem uso e aplicam seus recursos no ponto da ação.
  - O debate permanece conceitual antes de decidir armazenamento ou nova infraestrutura.
  - O PR #691 continua temporário, em draft e destinado ao fechamento sem merge.
- Em definição:
  - A fronteira converge para E9 como catálogo de capacidades, E20.2 como catálogo de dados de entrada e E19 como compositora e aplicadora dos gates.
  - Os atributos candidatos de uma capacidade são chave estável, categoria, descrição, tipo, maturidade técnica, domínio consumidor e fonte ou evidência.
  - Os tipos iniciais convergentes são booleano, nível fechado e limite numérico.
  - Maturidade técnica, associação e valor no plano e disponibilidade por `taxon + plano` devem permanecer independentes.
  - O radar pode abranger integrações, tracking, analytics, IA, infraestrutura e outros recursos, mas o primeiro contrato executável deve atender somente Starter e E19.2.
- Pendências:
  - Confirmar humanamente os atributos mínimos e os três tipos iniciais.
  - Definir os estados exatos de maturidade técnica, sem usar `disponível` como estado misto.
  - Definir quais capacidades mínimas do Starter são realmente consumidas pela E19.2 e pela primeira jornada da LP.
  - Reconciliar o identificador definitivo do novo recorte da E9 com o histórico do roadmap.
  - Manter snapshot, grandfathering, upgrade, downgrade, add-ons, exceções por conta e armazenamento para decisões posteriores ao contrato mínimo.
- Divergências:
  - Não há divergência material entre os chats; havia duplicidade de numeração e ambiguidade conceitual em `disponível`, ambas corrigidas nesta consolidação.
- Próxima pergunta:
  - O humano confirma como atributos mínimos `chave estável`, `categoria`, `descrição`, `tipo`, `maturidade técnica`, `domínio consumidor` e `fonte/evidência`, com os tipos iniciais `booleano`, `nível fechado` e `limite numérico`?
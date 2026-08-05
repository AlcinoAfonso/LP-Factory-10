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
- distinguir capacidade candidata, testada, implementada e disponibilizada;
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

## 3. Regras básicas

### 3.1. Registro sequencial

- Toda contribuição deve ser acrescentada ao final do histórico, sem apagar registros anteriores.
- Cada lançamento recebe identificador sequencial no formato `L-001`, `L-002` e assim por diante.
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
- Não vincular capacidade a plano antes de definir seu significado, maturidade e disponibilidade real.
- Não tratar capacidade catalogada como promessa comercial ou recurso implementado.
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

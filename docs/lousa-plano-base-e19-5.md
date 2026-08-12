12/08/2026 — Rascunho vivo — E19.5 — Workspace operacional da conta e laboratório de drafts

## 1. Estado do debate

### 1.1. Identificação

- Recorte em debate: `E19.5 — Workspace operacional da conta e laboratório de drafts`.
- Path definitivo: `docs/lousa-plano-base-e19-5.md`.
- Estado: rascunho vivo; ainda não consolidado como plano-base v1.
- Plano conceitual: `docs/lp-planejamento.md`.
- Processo: `docs/prompt-estrategista.md`.

### 1.2. Fontes consultadas até aqui

- `README.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/prompt-estrategista.md`.
- `docs/lp-planejamento.md`.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e19-4.md`.
- `docs/schema.md`.
- implementação vigente de `app/a/[account]/` e `lib/lp-builder/`.

### 1.3. Contexto confirmado

- A E19.2 permanece responsável pelo primeiro onboarding pós-entitlement e pela configuração mínima necessária à primeira LP Starter.
- A E20.2 continua sendo a fonte dos campos, escopos, tipos, obrigação, aplicabilidade e validação.
- A primeira LP real comprovou o pipeline técnico de geração, materialização e preview, mas foi reprovada na avaliação humana de qualidade comercial, com nota aproximada de `2/10`.
- O projeto precisa agora testar mudanças de modelo, prompt, perfil, composição e renderer sem destruir os resultados anteriores.
- A superfície atual da conta não oferece workspace permanente, lista operacional de LPs nem acesso organizado às configurações por escopo.
- A persistência da E19.2 foi desenhada para a primeira jornada por conta e possui vínculo `landing_page_id` write-once; isso não resolve sozinho várias LPs com configurações próprias.

## 2. Problema e resultado esperado

### 2.1. Problema

- Depois do onboarding, a conta não possui uma área operacional adequada para administrar configurações e várias LPs.
- Cada teste de qualidade exige hoje uma operação isolada, sem lista comparável de resultados.
- Não existe ainda uma separação de UX suficientemente clara entre valores reutilizáveis e valores específicos de campanha ou LP.
- A primeira materialização é write-once e não deve ser sobrescrita silenciosamente durante os experimentos.

### 2.2. Resultado esperado

- Transformar `/a/[account]` em um workspace operacional simples para owner e admin elegíveis.
- Preservar o onboarding inicial da E19.2 para a primeira LP.
- Disponibilizar, depois da conclusão do onboarding, acesso organizado às configurações vigentes por escopo.
- Exibir a lista de LPs da conta e seus estados relevantes.
- Permitir produzir e preservar vários drafts para comparação humana durante os testes de qualidade.
- Reutilizar o pipeline oficial do produto, sem laboratório paralelo, manipulação manual de banco ou fluxo especial para a conta piloto.

## 3. Fronteira preliminar do recorte

### 3.1. Configurações pós-onboarding

- Organizar os valores já existentes por contexto compreensível para o cliente:
  - conta;
  - negócio;
  - oferta;
  - campanha;
  - landing page;
  - integrações somente quando houver integração real configurável.
- Derivar a organização dos escopos vigentes da E20.2, sem criar lista paralela de campos.
- Preservar a distinção entre:
  - valores reutilizáveis de conta, negócio ou oferta;
  - valores específicos de campanha ou landing page.
- Não substituir a primeira jornada guiada da E19.2 por um painel técnico gigante.

### 3.2. Workspace de LPs

- Exibir uma lista operacional das LPs da conta.
- Colunas candidatas, ainda sujeitas ao debate:
  - nome;
  - status da LP;
  - estado derivado da geração/materialização;
  - slug;
  - objetivo;
  - funil;
  - data de criação ou geração;
  - ações disponíveis.
- Ações candidatas, ainda sujeitas ao debate:
  - abrir preview;
  - abrir configurações;
  - criar nova LP;
  - duplicar configuração para teste;
  - regenerar preservando o resultado anterior.

### 3.3. Laboratório de drafts

- Durante a fase de validação de qualidade, não aplicar limite local inventado para a quantidade de drafts.
- Limites comerciais futuros continuam sob a E9.7 quando houver capability e integração canônicas.
- Cada alteração de modelo, prompt, E18.5, E20.3 ou renderer deve poder produzir um novo resultado comparável.
- A hipótese preferencial é que regeneração crie um novo draft em vez de sobrescrever a LP materializada; essa semântica ainda precisa ser fechada no debate.
- Comparação humana entre previews é suficiente nesta primeira entrega; não criar engine automática de experimentos.

## 4. Fluxo operacional preliminar

### 4.1. Gatilho

- Conta ativa com entitlement válido.
- Membership ativo com papel `owner` ou `admin`.
- Onboarding inicial concluído.

### 4.2. Entrada

- Configuração vigente da E19.2/E20.2.
- LPs legítimas da conta.
- Materializações existentes e seus metadados deriváveis.
- Valores reutilizáveis e valores específicos de LP/campanha.

### 4.3. Processamento

- Exibir o workspace principal da conta.
- Permitir navegar para as configurações por escopo.
- Listar LPs e seus estados.
- Criar ou duplicar drafts pelo boundary vigente da E19.
- Acionar a geração oficial quando solicitado pelo humano.
- Preservar os resultados anteriores para comparação.

### 4.4. Validação

- Revalidar conta, membership e entitlement nas ações mutáveis.
- Derivar `accountId` server-side.
- Não permitir overwrite silencioso de materialização existente.
- Não misturar valores de outra conta ou outra LP.
- Não inventar capability comercial nem limite local de drafts.

### 4.5. Persistência

- A residência física ainda não está definida.
- A solução deve separar valores reutilizáveis dos valores específicos de campanha/LP sem duplicar preventivamente todo o catálogo E20.2.
- Nova tabela, coluna, migration ou contrato de escrita só poderá entrar na v1 após o gap real ser fechado contra o schema e a implementação vigentes.

### 4.6. Consumo

- Owner e admin usam o workspace para organizar configurações e produzir drafts comparáveis.
- Os previews existentes continuam sendo a superfície de avaliação de cada LP.
- Os testes de modelo, prompt, perfil, módulos e renderer reutilizam esse mesmo fluxo oficial.

### 4.7. Fallback

- Falha de leitura preserva estado explícito, sem apresentar lista parcial como completa.
- Falha de criação ou geração não destrói drafts anteriores.
- Configuração incompleta bloqueia somente a ação que dela depende.
- Integração inexistente não produz área ou configuração fictícia.

## 5. Decisões já aceitas

### 5.1. Preservação da E19.2

- O primeiro onboarding permanece vigente.
- A área posterior de Configurações é evolução do contrato da E19.2 e consome os escopos da E20.2.
- A E19.2 não passa a ser dona da lista operacional de LPs nem do laboratório de drafts.

### 5.2. Novo recorte funcional

- Configurações pós-onboarding, lista de LPs, múltiplos drafts e testes repetidos formam um novo resultado operacional.
- O identificador preliminar adotado é E19.5.
- A implementação deve reutilizar preferencialmente arquivos, boundaries e contratos existentes; novo recorte não significa nova infraestrutura por padrão.

### 5.3. Prioridade atual

- A prioridade é criar a superfície que permita testar iterativamente a qualidade final do produto.
- Publicação, tracking e expansão comercial não avançam antes de o processo produzir LPs com qualidade aceitável.

## 6. Questões abertas indispensáveis

### 6.1. Propriedade e residência das configurações

- Como separar materialmente valores reutilizáveis da conta/negócio/oferta dos valores específicos de campanha/LP?
- O agregado atual da E19.2 pode ser evoluído com segurança ou precisa de outra residência focal?
- Como criar várias LPs sem rebind do agregado write-once da primeira jornada?

### 6.2. Objetivo da LP

- Qual contrato deve representar explicitamente o objetivo editorial/comercial da LP, como `compra do primeiro imóvel no Rio`?
- Esse dado pertence ao catálogo E20.2, à identidade mínima da E19.1 ou a outro contrato já existente?

### 6.3. Semântica das ações

- O que exatamente é copiado ao criar nova LP, duplicar ou regenerar?
- Regeneração será definitivamente um novo draft ou outro contrato?
- Quais metadados precisam ser preservados para comparar modelo, effort, prompt, perfil e versões estruturais?

### 6.4. Automação

- A superfície e a organização do workspace não exigem automação própria.
- A ação de geração reutiliza automação com IA em fluxo controlado já implementada na E19.4.
- Antes da v1, o Gestor de Automação e o humano devem confirmar se essa reutilização basta ou se alguma fase do recorte precisa ser marcada como Automação: sim.

### 6.5. Fases executáveis

- Ainda não fechar as fases antes de resolver os contratos de configuração por LP, objetivo e regeneração.
- A v1 deve evitar esconder duas implementações autônomas em uma única fase.

## 7. Escopo negativo preliminar

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

- Fechar primeiro o contrato de configuração pós-onboarding para múltiplas LPs:
  - quais valores continuam no nível reutilizável;
  - quais pertencem à LP ou campanha;
  - como o objetivo da LP é representado;
  - como nova LP, duplicação e regeneração preservam ou substituem esses valores.
- Somente depois definir as fases executáveis e consolidar o plano-base v1.

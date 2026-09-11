# Lousa do Plano Base — E17.11 — Catálogo de QA

## 1. V1 funcional vigente congelada

### 1.1. Fonte e precedência

- Fonte canônica: Google Doc `Debate 09 — Catálogo de QA — LP Factory 10`.
- Documento: `1WaHdPVwdQKumZXzcL0zaEam9NOTUqkkVV0jF30mAjpo`.
- Revisão informada na decisão humana: `ANLCKQn0jJ4u1uhrSRKZsMu4UhkaaSGjlIrHrB4tcBxVdLj6gc-THzbGET_GX6CDQLEZWFWYP-UPVPz0Fz2eGM8dPTCeJ4ty-9kznAABdT8`.
- Conteúdo vigente confirmado na revisão atual do Drive em 11/09/2026: seção inicial `V1 VIGENTE — E17.11 SIMPLIFICADA — DECISÃO HUMANA DE 11/09/2026`.
- A seção vigente substitui integralmente a V1 ampla anterior; todo o conteúdo abaixo do marcador `FIM DA V1 VIGENTE — O CONTEÚDO ABAIXO É HISTÓRICO REVOGADO` é histórico sem autorização residual.

### 1.2. Escopo aprovado

- A E17.11 trata somente da existência e do uso do Catálogo de QA.
- Qualquer Executor pode consultar o Catálogo de QA quando necessário para um teste autorizado pelo recorte competente.
- Se, durante um teste, o Executor alterar um valor já catalogado, deve atualizar somente o registro correspondente.
- Se o teste não alterar valor catalogado, a E17.11 não exige mutação do catálogo.
- A consulta ao catálogo não amplia o escopo nem a autoridade do teste consumidor.

### 1.3. Reconciliação obrigatória

- A V2 anterior e a execução derivada dela devem ser descartadas ou reconciliadas antes de prosseguir, preservando a rastreabilidade da mesma task e branch.
- Convite, mailbox, browser, Account Dashboard, Admin Dashboard, recuperação, piloto do PR #912 e outras jornadas da V1 revogada não pertencem à E17.11 vigente.

### 1.4. Escopo negativo vinculante

- Não alterar `docs/pipeline-plano-base.md`, Debate 03 ou o contrato do Estrategista Autônomo.
- Não alterar mailbox, browser, automação ou infraestrutura.
- Não criar agente, workflow, job, service, rota, banco, migration, secret, integração ou capacidade operacional adicional.
- Não executar convite, autenticação, Account Dashboard, Admin Dashboard, recuperação, PR #912 ou qualquer jornada de produto.

### 1.5. Execução, supervisão e aceite

- Execução: Light.
- Supervisão: Autônomo.
- O Catálogo de QA deve existir e ser consultável por qualquer Executor.
- O contrato operacional estritamente necessário deve explicitar a consulta ao catálogo.
- O mesmo contrato deve explicitar a atualização somente do registro correspondente quando o próprio teste alterar valor catalogado.
- Os deltas da V2 revogada que excedem esta V1 devem permanecer reconciliados.
- Nenhum item do escopo negativo pode ser alterado ou executado.

### 1.6. Estado da reconciliação anterior ao novo congelamento

- Os commits derivados da V1 revogada permanecem no histórico e foram neutralizados por commits de reversão na mesma branch.
- O catálogo foi restaurado com base na revisão pré-task `9`, limitada às células alteradas por esta execução; dados preexistentes foram preservados.
- O convite piloto permaneceu sem envio e foi cancelado como continuação da task.
- O commit da V1 vigente deve permanecer ancestral do resultado final; este PR exige merge commit e não admite squash ou rebase no merge.

## 2. V2 mínima Light

### 2.1. Referências imutáveis e pareceres

- V1 funcional vigente congelada no commit `7267cfb4ef6917320453a42154dd0b57fc059ce2`, blob `dd520e8a89a3c0f3a4d995a731c624887dea6e93`.
- Updates: parecer read-only do `gestor-updates` sobre a nova V1 congelada, com veredito `nenhum update aplicável`.
- Nenhum patch de update, confronto estrutural, arbitragem funcional ou oportunidade estratégica integra este recorte.
- Analista Light: não acionado; a derivação é documental, localizada e sem risco estrutural material ou decisão funcional pendente.

### 2.2. Estado factual confirmado

- O spreadsheet `Catálogo de QA — Debate 09 — LP Factory 10`, id `15I8EYtZK2GbHHEVkZ0nr9EY3BF-Bf7BhTPL3VPoBOfI`, existe na pasta `LP Factory` do Google Drive e permanece consultável pelo recurso conectado.
- A revisão pré-task `9` comprovou os valores anteriores das abas `Contas QA` e `Mailbox`; a reconciliação restaurou somente as células modificadas por esta execução.
- O convite piloto não foi enviado. Nenhuma jornada de produto faz parte da implementação vigente.
- O contrato atual do Executor já reconhece recursos conectados expressamente autorizados, mas ainda não registra a regra específica e limitada de consumo do Catálogo de QA definida pela nova V1.

### 2.3. Implementação mínima

- Alterar somente `.agents/skills/lp-factory-executar-plano/SKILL.md`, no contrato comum de fontes, para explicitar que:
  - o Executor pode consultar o Catálogo de QA quando um teste já autorizado pelo recorte competente precisar;
  - a consulta não amplia escopo nem autoridade;
  - se o próprio teste alterar valor já catalogado, o Executor atualiza somente o registro correspondente;
  - sem alteração de valor catalogado, o catálogo não é mutado.
- Não alterar `docs/platform-config.md`, `docs/pipeline-plano-base.md`, contrato do Estrategista Autônomo ou qualquer outro contrato operacional.
- Não normalizar, reorganizar, enriquecer ou migrar o catálogo.
- Não executar QA de produto nem tocar mailbox, browser, Preview, convite, autenticação, recuperação ou PR #912.

### 2.4. Validação e aceite

- Confirmar por leitura do Google Drive que o catálogo existe e permanece consultável.
- Confirmar por confronto literal que o contrato contém as quatro regras da seção 2.3 sem conceder autorização adicional ao teste consumidor.
- Executar `git diff --check` e revisar `origin/main..HEAD` e `origin/main...HEAD`, comprovando que o diff efetivo contém somente a lousa vigente, o delta mínimo do contrato e sua reconciliação canônica no roadmap.
- `npm ci` e `npm run check`: não aplicáveis, pois o delta efetivo é exclusivamente documental e contratual.
- Não há QA funcional, visual, de banco ou de infraestrutura aplicável à V1 vigente.

### 2.5. Arquivos previstos

- `docs/lousa-plano-base-e17-11.md`.
- `.agents/skills/lp-factory-executar-plano/SKILL.md`.
- `docs/roadmap.md`.

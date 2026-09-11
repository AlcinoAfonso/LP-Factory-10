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

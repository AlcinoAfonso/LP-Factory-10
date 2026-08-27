# Rascunho vivo — E19.5.4 — revisão do modelo mental do workspace de LPs

## 1. Estado e decisões fixas

### 1.1. Identificação e estado

- Caso macro: `E19 — LP Builder`.
- Recorte em revisão: `E19.5.4 — UX operacional do workspace de LPs`.
- Estado: rascunho vivo de revisão após reprovação do QA humano do PR #820.
- Documento canônico vigente que está sendo reavaliado: `docs/lousa-plano-base-e19-5-4.md`.
- Matriz de debate: `docs/matriz-debate-e19-5-4.md`.
- Fonte principal de visão: `README.md`.
- Processo: `docs/prompt-estrategista.md` v35.
- Este arquivo não constitui plano-base v1/v2 nem autorização de implementação.

### 1.2. Motivo da reabertura

- O wireframe B2 e a implementação candidata do PR #820 não produziram uma experiência prática e funcional no teste humano.
- O problema identificado não é apenas visual: o modelo mental vigente confunde `landing page`, `identidade comercial`, `grupo` e `versão`.
- A revisão deve resolver primeiro a unidade percebida pelo cliente e o núcleo de identidade antes de retomar implementação.

### 1.3. Decisões humanas já aceitas no debate

- A unidade principal percebida pelo cliente deve ser a landing page concreta: `LP 01`, `LP 02`, `LP 03...`.
- Grupo de LPs, se existir, deve ser opcional e secundário.
- `funnel_stage` muda materialmente a identidade da LP.
- `transaction_intent`, quando aplicável ao taxon, muda materialmente a identidade da LP.
- `transaction_intent` não deve ser forçado como dimensão universal; sua aplicabilidade depende da semântica real do taxon.
- A IA da E20.6 pode avaliar necessidade/cobertura e sugerir a camada taxonômica; a decisão final permanece humana e a E20.2 materializa o contrato executável aprovado.

## 2. Contrato do caso

### 2.1. Resultado esperado do debate

- Definir um modelo mental que permita ao cliente reconhecer imediatamente o que é uma landing page concreta.
- Separar claramente LP, versão e eventual grupo opcional.
- Reduzir o núcleo de identidade ao mínimo realmente necessário para distinguir trabalhos comerciais diferentes.
- Preservar somente complexidade que tenha consumidor real no MVP.

### 2.2. Questões ainda abertas

- Papel exato e nome do grupo opcional.
- Se a visualização `Por grupos` entra no MVP inicial ou apenas depois da lista plana validada.
- Se `primary_conversion_goal` integra identidade ou configuração mutável.
- Se `primary_service_or_offer` integra identidade, integra apenas em certos casos ou funciona como contexto/oferta mutável.
- Formulação final das regras que a E20.6 deve usar para sugerir camada taxonômica sem generalização artificial.

## 3. Fases e próxima ação

### 3.1. Debate e validação do novo modelo mental

- Automação: não.
- Objetivo:
  - consolidar pareceres independentes na matriz e submeter divergências materiais ao humano.
- Próxima ação:
  - continuar o debate atributo por atributo;
  - solicitar pareceres de outros chats/roles usando os IDs da matriz;
  - somente após decisões humanas suficientes, substituir este rascunho por consolidação no documento canônico da E19.5.4.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo enquanto o debate estiver aberto

- implementação de UI;
- alteração do PR #820 para tentar acomodar hipóteses ainda não aprovadas;
- migration, banco, rota, job, agente ou nova infraestrutura;
- mudança automática da E20.2 a partir de recomendação de IA;
- fixação de limites comerciais do Starter sem contrato próprio.

### 4.2. Critérios de parada

- Parar antes de implementação enquanto LP, versão, grupo e núcleo mínimo de identidade não estiverem claros.
- Parar se uma conclusão exigir alteração estrutural não sustentada pelos documentos vigentes.
- Submeter ao humano qualquer divergência material entre os pareceres antes de consolidar novo contrato executável.

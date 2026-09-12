12/09/2026 — Plano-base v1 — E21.4.6 — Transição para histórico legado

## 1. Estado e fonte canônica

- Estado: V1 funcional consolidada e aprovada.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.4.6 — Transição para histórico legado`.
- Plano: `PB 2 — Transição da E21.4`.
- Classificação de execução: Complexa.
- Supervisão: Autônomo.
- Plano conceitual: N/A.
- Fonte canônica: `Debate 10 — Controle de custos OpenAI por workload e conta — LP Factory 10`, seção `4.2. PB 2 — Transição da E21.4 — V1 aprovada`.
- Documento de origem: `https://docs.google.com/document/d/1CsT5NJ8E0JrXBiG_gumH91BxcGHpHi7kBQtimylrClg`.
- Revisão lida na materialização: `ANLCKQmckVTNl9jgl_EslpfkYDfzo--kW_9QHW3M0g5yvEUkN3rT_Hfz-pMmvZF_65YIFezoiDixyC1FpAPXWiN5zJ-fBky7M0M_0bp3nqU`.

## 2. Contrato funcional aprovado

### 2.1. Problema

- A E21.4 preserva capacidades financeiras comprovadas, mas seu modelo de atribuição foi construído para Landing Pages e não deve ser ampliado como base do novo controle transversal.

### 2.2. Resultado funcional

- Preservar gasto oficial, histórico legado e demais comportamentos úteis comprovados da E21.4, reaproveitando somente componentes compatíveis e retirando responsabilidades do caminho ativo apenas depois que E21.5 provar equivalência ou superioridade funcional.

### 2.3. Comportamento esperado

- Manter história e leitura legada íntegras.
- Distinguir claramente histórico e controle ativo.
- Evitar dupla autoridade e dupla contagem.
- Permitir que E21.5 opere sem depender do modelo LP-específico.

### 2.4. Atores

- `platform_admin` como consumidor administrativo da leitura financeira.
- Fluxo técnico autônomo como responsável pela transição controlada.

### 2.5. Dependência e automação

- Dependência: PB 1 — E21.5 para qualquer retirada ou redistribuição de responsabilidade substituída.
- Automação: não aplicável; trata-se de transição única e controlada.
- Como não existe possibilidade material de automação no PB 2, o Gestor de Automações não é acionado.

## 3. Posição e fase planejada

- Posição planejada no roadmap: preservar E21.4 como recorte histórico existente e acrescentar `E21.4.6 — Transição para histórico legado`.
- `E21.4.6 Transição para histórico legado`, incluindo reconciliação da autoridade ativa e preservação funcional item a item.

## 4. Critérios de aceite

- Nenhum comportamento útil comprovado desaparece antes de substituição equivalente ou superior.
- Histórico legado continua consultável e identificável.
- E21.5 não depende do modelo LP-específico para operar.
- Não há dupla autoridade ativa nem dupla contagem.
- `/admin/custos-openai` permanece uma única superfície financeira.
- Documentação e roadmap deixam clara a nova autoridade sem apagar o histórico.

## 5. Evidências esperadas

- Matriz item a item do contrato E21.4 classifica `preservar`, `reutilizar`, `substituir` ou `retirar`, com evidência correspondente.
- Leitura do histórico legado permanece íntegra.
- Controle ativo e consulta administrativa funcionam pela E21.5 sem depender do write-side ou read model LP-específicos.

## 6. Limites e escopo negativo

- Não amplia a E21.4.
- Não apaga ou reclassifica histórico.
- Não cria novo produtor legado.
- Não remove comportamento antes de prova de equivalência ou superioridade.
- Preserva a leitura oficial do gasto organizacional e suas proteções.
- Preserva a série histórica congelada de Landing Pages e seu caráter somente leitura e append-only.
- Não cria backfill nem novo produtor legado.
- Preserva a distinção entre histórico legado e controle ativo.
- Preserva acesso administrativo seguro e sob demanda.
- Nenhum evento histórico é apagado, reescrito ou reclassificado retroativamente.
- A E21.4 não se torna o novo contrato transversal.

## 7. Próxima ação

- Congelar esta V1 em commit próprio antes de qualquer derivação técnica ou avaliação especializada.
- Conduzir Gestor Estrutural e Gestor de Updates sobre o mesmo blob congelado.
- Registrar `Gestor de Automações: N/A — avaliação formal dispensada na V1`.

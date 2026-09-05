# Template — Relatório de Implementação de Plano

## 1. Uso e limites

- Uso opcional, somente por instrução humana ou workflow futuro aprovado.
- Não integra automaticamente o fluxo do Estrategista, do Executor, do Analista ou da orquestração.
- Não substitui PR, plano-base, checkpoints, documentos canônicos ou resultados do Prompt ABC.
- Não aciona atualização documental; usa somente estado já implementado, validado e registrado.
- Não registrar secrets, credenciais, PII, hipóteses, propostas não aprovadas ou histórico operacional superado.
- Usar `N/A` quando uma seção não se aplicar.

## 2. Identificação

- Projeto: LP Factory 10
- Caso ou recorte: [identificador e título]
- Plano-base: [path e versão]
- PR: [número ou URL]
- Branch ou referência: [branch, commit ou tag]
- Período ou data de referência: [data ou intervalo]
- Responsável pela emissão: [humano, agente ou workflow]

## 3. Resultado da implementação

- Objetivo do recorte: [resultado esperado]
- Estado final: [concluído | concluído com limitações | bloqueado | encerrado por decisão]
- Decisão de encerramento: [avançar | ajustar | bloquear | encerrar]
- Resumo factual: [síntese curta do que foi materialmente entregue]

## 4. Fechamento documental

### 4.1 Documentos avaliados pelo Prompt ABC

Para cada documento canônico:

- `DOC_ALVO`: [path]
- Resultado: [delta aplicado | `SEM ALTERAÇÕES NECESSÁRIAS`]
- Operações aplicadas: [IDs das operações ou `N/A`]
- Referência final: [commit, PR ou path]

### 4.2 Observação

- Este relatório não cria nem corrige delta documental.
- Divergência entre o relatório, o ABC e o diff deve ser resolvida no PR ou fluxo competente antes do uso deste documento.

## 5. Roadmap

- Seção afetada: [identificador e título] | `N/A`
- Subseções atualizadas: [lista exata] | `N/A`
- Estado registrado: [planejado | definido | implementado | bloqueado | encerrado]
- Referência da atualização: [PR, commit ou path] | `N/A`

## 6. Updates

Para cada update relevante:

- Identificador: [tag ou nome]
- Tratamento: [aplicado | usado como referência, validação ou trava | preservado como oportunidade estratégica condicional | não aplicável]
- Efeito no recorte: [descrição curta]
- Referência: [path, PR ou fonte] | `N/A`

## 7. Banco e Schema

- Estruturas criadas ou ajustadas: [tabelas, views, functions, RPCs, policies, grants ou `N/A`]
- SQL de inspeção: [sim | não | `N/A`]
- SQL de implementação: [sim | não | `N/A`]
- Migration: [path] | `N/A`
- Estado da migration: [não aplicada | aplicada | validada | bloqueada | `N/A`]
- Correção ou reversão incremental: [path] | `N/A`
- Evidência de verificação: [descrição curta ou referência] | `N/A`

## 8. Observabilidade e validações

- Observabilidade aplicada: [descrição curta] | `N/A`
- Validações técnicas: [comandos, checks ou referências]
- Smoke ou QA funcional: [resultado e evidência] | `N/A`
- Evidência de QA: [automatizada | humana | combinada | pendente | não aplicável]
- Limitações do ambiente: [descrição curta] | `N/A`

## 9. Artefatos

### 9.1 Criados

- [path] | `N/A`

### 9.2 Ajustados

- [path] | `N/A`

### 9.3 Excluídos

- [path] | `N/A`

## 10. Pendências e riscos

- Incluir somente quando o relatório solicitado exigir estado aberto.
- Pendência: [descrição] | `N/A`
- Responsável: [papel ou pessoa] | `N/A`
- Próximo gate ou decisão: [descrição] | `N/A`
- Risco residual: [descrição] | `N/A`

## 11. Referências

- Plano-base: [path]
- Roadmap: `docs/roadmap.md`
- Prompt ABC: `docs/prompt-abc.md`
- Prompt do Executor: `docs/prompt-executor.md`
- PR e commits: [referências]
- Outras fontes utilizadas: [paths ou URLs autorizadas] | `N/A`

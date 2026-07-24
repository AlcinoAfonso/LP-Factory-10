---
name: lp-factory-executar-plano
description: "Executar end-to-end um plano-base v2 aprovado do LP Factory 10, uma subseção canônica do roadmap por vez, com validação e gate do Analista. Usar como subfluxo interno de lp-factory-orquestrar-plano na mesma branch e PR da v2 ou, de forma independente, quando a v2 já estiver incorporada à main."
---

# Executar plano-base aprovado

Manter o task principal como orquestrador e executor. No handoff interno, continuar na branch e no PR únicos já abertos pela orquestração. Na execução independente, criar uma única branch a partir da `main` atualizada e um único PR de implementação contra `main`. Subseções são checkpoints internos, nunca PRs ou merges intermediários.

## Entrada

Na execução independente, aceitar como comando suficiente a referência do plano-base v2:

`Use $lp-factory-executar-plano no plano-base aprovado do PR #<número>.`

No handoff interno de `$lp-factory-orquestrar-plano`, não exigir nova instrução humana. Receber o checkpoint `LP-Factory-Stage: plan-v2-approved` e continuar no mesmo task.

Usar `end-to-end` por padrão no fluxo normal. Exigir `experimental` explícito para parar nos checkpoints solicitados pelo humano.

Exigir que a v2 esteja na `main` somente na execução independente. No handoff interno, aceitar a v2 aprovada pelo Analista no checkpoint `plan-v2-approved` da mesma branch e PR contra `main`. Nunca criar PR empilhado.

## Handoff interno

Quando invocada por `$lp-factory-orquestrar-plano`:

1. Confirmar que branch, worktree e PR são os mesmos usados para produzir a v2.
2. Confirmar o checkpoint `plan-v2-approved`, a matriz versionada no mesmo PR e usar esse commit como contrato imutável.
3. Não criar branch, PR ou pedido de merge intermediário.
4. Não acionar Gestor Estrutural, Gestor de Updates ou Gestor de Automações; usar somente o Analista nos gates de implementação.
5. Reutilizar checkpoints `LP-Factory-Phase: <identificador>` e continuar na próxima subseção pendente.
6. Se houver mudança material fora da v2 aprovada, encaminhar ao Analista e, se necessário, ao humano; não reiniciar especialistas.

## Preparar

1. Confirmar repositório, worktree, branch, estado Git limpo, plano, SHA e caso; na execução independente, confirmar que o plano está na `main` atualizada; no handoff interno, confirmar o checkpoint `plan-v2-approved` no PR único.
2. Ler o plano integral, a seção competente de `docs/roadmap.md`, `docs/base-tecnica.md` e somente fontes adicionais exigidas pela subseção atual. No handoff interno, preservar `docs/matriz-consolidacao-<caso>.md` até o fechamento final; ela serve à rastreabilidade do Analista e não amplia o plano aprovado.
3. Validar que cada fase executável use exatamente o identificador do roadmap, como `E18.5.3 — título`; rejeitar aliases ordinais como `Fase 1` e agrupamentos de subseções independentes.
4. No handoff interno, reutilizar a branch e o PR existentes. Na execução independente, criar ou selecionar uma única branch `codex-app/<caso>-implementacao` a partir da `main` e um único PR draft contra `main`. Recusar base diferente de `main` e nunca criar branch ou PR por subseção.
5. Registrar o SHA do plano como contrato imutável. Se houver execução anterior, identificar o último checkpoint pelo trailer de commit `LP-Factory-Phase: <identificador>`; se não for possível determinar unicamente a próxima subseção, parar e pedir o identificador.

## Executar uma subseção

Para a próxima subseção ainda não aprovada:

1. Confirmar objetivo, arquivos prováveis, escopo negativo e critérios de aceite do plano. Antes de editar, confrontar o plano com o repositório real; se conflito, drift ou dependência alterar objetivo, escopo, arquitetura, banco ou comportamento do produto, não improvisar e encaminhar a incompatibilidade ao Analista no próprio workflow.
2. Implementar somente o necessário para essa subseção; não antecipar a próxima.
3. Executar as validações aplicáveis. Para código, executar `npm ci` uma vez no início do lote contínuo e repeti-lo somente se `package-lock.json`, dependências ou o estado de instalação mudarem; executar a validação própria e `npm run check` antes de cada gate. Para alterações exclusivamente documentais, justificar esses comandos como não aplicáveis. Quando aplicável, incluir no gate do Analista evidências de observabilidade mínima e smoke ou QA funcional; se a evidência não puder ser obtida automaticamente, o Analista decide se exige teste humano.
4. Invocar `$lp-factory-avaliar-implementacao-analista` com o plano, o identificador, o diff, as evidências, a matriz e os pareceres especializados nela referenciados que forem pertinentes à subseção.
5. Tratar `aprovado para avançar` como checkpoint: commitar com o trailer `LP-Factory-Phase: <identificador>` e atualizar código, título e resumo do mesmo PR draft para refletir o último checkpoint efetivamente publicado.
6. Tratar `aprovado com correções obrigatórias` corrigindo somente o delta indicado e retornando ao mesmo Analista em `revisao_delta_implementacao`.
7. Tratar `requer teste humano` ou `bloqueado por decisão humana` como gate: parar e pedir apenas a evidência ou decisão necessária.

No modo `experimental`, parar somente nos checkpoints solicitados pelo humano. No fluxo normal `end-to-end`, avançar para a próxima subseção aprovada.

## Encerrar o recorte

Depois do último checkpoint:

1. Executar validações integradas e corrigir regressões.
2. Avaliar explicitamente a necessidade de teste humano. Se exigido, parar e pedir a evidência; se `N/A`, registrar a justificativa.
3. Atualizar o PR com checkpoints, arquivos, validações, decisão sobre teste humano, matriz e pendências; declarar a entrega completa e parar.
4. Depois dessa declaração, não acionar `revisao_final_implementacao`, `revisao_delta_implementacao` nem qualquer outro gate do Analista.
5. Não acionar nem fazer handoff ao Estrategista. Ele será instruído pelo humano e consultará diretamente o repositório. Se o humano devolver seu relatório com correções, aplicar somente esse delta, atualizar a entrega e parar novamente, sem Analista.
6. Manter a matriz disponível. Removê-la somente quando o humano solicitar durante o ciclo externo de avaliação, preservando sua rastreabilidade no resumo e no histórico do PR.

O resumo do PR deve refletir sempre o checkpoint publicado e a entrega completa. A decisão de merge ocorre fora desta skill, depois da avaliação do Estrategista acionada pelo humano.

## Limites

- Não alterar a `main` nem fazer merge.
- Não executar fase fora do plano ou fora da ordem do roadmap.
- Não iniciar a fase seguinte sem checkpoint aprovado.
- Não recriar, resumir nem alterar a matriz durante a implementação, salvo correção de rastreabilidade exigida pelo Analista; preservá-la até a entrega completa e removê-la depois somente por instrução humana.
- Não criar PR empilhado.
- Não criar segundo PR quando houver handoff da orquestração.
- Não acionar novamente os especialistas do plano durante a implementação.
- Não acionar o Analista depois de declarar a entrega completa.
- Não acionar o Estrategista nem simular handoff para ele.
- Não substituir gate humano, decisão material ou teste humano exigido.

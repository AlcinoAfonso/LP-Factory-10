---
name: lp-factory-executar-plano
description: Executar end-to-end um plano-base v2 aprovado e incorporado à main do LP Factory 10, uma subseção canônica do roadmap por vez, na mesma branch e PR de implementação, com validação e gate do Analista. Usar após o merge humano da v2 ou em experimento explicitamente autorizado.
---

# Executar plano-base aprovado

Manter o task principal como orquestrador e executor. No fluxo normal, criar uma única branch a partir da `main` atualizada e um único PR de implementação contra `main`; subseções são checkpoints internos, nunca PRs ou merges intermediários.

## Entrada

Aceitar como comando suficiente a referência do plano-base v2:

`Use $lp-factory-executar-plano no plano-base aprovado do PR #<número>.`

Usar `end-to-end` por padrão no fluxo normal. Exigir `experimental` explícito para parar nos checkpoints solicitados pelo humano.

Exigir que a v2 esteja na `main` antes de qualquer implementação. O modo experimental altera somente os checkpoints; não autoriza mutação sobre v2 não incorporada. Nunca criar PR empilhado.

## Preparar

1. Confirmar repositório, worktree, branch, estado Git limpo, plano, SHA e caso; no fluxo normal, confirmar que o plano está na `main` atualizada.
2. Ler o plano integral, a seção competente de `docs/roadmap.md`, `docs/base-tecnica.md` e somente fontes adicionais exigidas pela subseção atual.
3. Validar que cada fase executável use exatamente o identificador do roadmap, como `E18.5.3 — título`; rejeitar aliases ordinais como `Fase 1` e agrupamentos de subseções independentes.
4. Criar ou selecionar uma única branch `codex-app/<caso>-implementacao` a partir da `main` e um único PR draft contra `main` para todo o recorte. Recusar base diferente de `main` e nunca criar branch ou PR por subseção.
5. Registrar o SHA do plano como contrato imutável. Se houver execução anterior, identificar o último checkpoint pelo trailer de commit `LP-Factory-Phase: <identificador>`; se não for possível determinar unicamente a próxima subseção, parar e pedir o identificador.

## Executar uma subseção

Para a próxima subseção ainda não aprovada:

1. Confirmar objetivo, arquivos prováveis, escopo negativo e critérios de aceite do plano. Antes de editar, confrontar o plano com o repositório real; se conflito, drift ou dependência alterar objetivo, escopo, arquitetura, banco ou comportamento do produto, não improvisar e encaminhar a incompatibilidade ao Analista no próprio workflow.
2. Implementar somente o necessário para essa subseção; não antecipar a próxima.
3. Executar as validações aplicáveis. Para código, executar `npm ci` uma vez no início do lote contínuo e repeti-lo somente se `package-lock.json`, dependências ou o estado de instalação mudarem; executar a validação própria e `npm run check` antes de cada gate. Para alterações exclusivamente documentais, justificar esses comandos como não aplicáveis. Quando aplicável, incluir no gate do Analista evidências de observabilidade mínima e smoke ou QA funcional; se a evidência não puder ser obtida automaticamente, o Analista decide se exige teste humano.
4. Invocar `$lp-factory-avaliar-implementacao-analista` com o plano, o identificador, o diff e as evidências.
5. Tratar `aprovado para avançar` como checkpoint: commitar com o trailer `LP-Factory-Phase: <identificador>` e atualizar código, título e resumo do mesmo PR draft para refletir o último checkpoint efetivamente publicado.
6. Tratar `aprovado com correções obrigatórias` corrigindo somente o delta indicado e retornando ao mesmo Analista em `revisao_delta_implementacao`.
7. Tratar `requer teste humano` ou `bloqueado por decisão humana` como gate: parar e pedir apenas a evidência ou decisão necessária.

No modo `experimental`, parar somente nos checkpoints solicitados pelo humano. No fluxo normal `end-to-end`, avançar para a próxima subseção aprovada.

## Encerrar o recorte

Depois do último checkpoint:

1. Executar validações integradas e corrigir regressões.
2. Acionar o Analista em `revisao_final_implementacao` para avaliar o conjunto contra o plano aprovado.
3. Avaliar explicitamente a necessidade de teste humano. Se exigido, parar e pedir a evidência; se `N/A`, registrar a justificativa.
4. Enquanto o fechamento documental permanecer sem decisão canônica entre relatório e `$lp-factory-abc`, parar neste gate mesmo quando o teste humano for `N/A`; não gerar relatório nem alterar documentação. Considerar a decisão canônica somente após atualização correspondente desta skill e de `docs/orquestracao-plano-base.md` incorporada à `main`.
5. Depois que o fechamento documental for definido, aplicar somente o workflow aprovado, submeter seu delta ao Analista e atualizar título e resumo do PR.
6. Publicar o mesmo PR como pronto para merge somente com `aprovado para merge da implementação` e sem pendências.

O resumo do PR deve refletir sempre o checkpoint publicado. O formato do registro operacional final permanece pendente da decisão sobre o fechamento documental.

## Limites

- Não alterar a `main` nem fazer merge.
- Não executar fase fora do plano ou fora da ordem do roadmap.
- Não iniciar a fase seguinte sem checkpoint aprovado.
- Não criar matriz de consolidação durante a implementação; ela pertence apenas à revisão do plano v2.
- Não criar PR empilhado.
- Não substituir gate humano, decisão material ou teste humano exigido.

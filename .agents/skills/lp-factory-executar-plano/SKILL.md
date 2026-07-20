---
name: lp-factory-executar-plano
description: Executar end-to-end um plano-base v2 aprovado do LP Factory 10, uma subseção canônica do roadmap por vez, na mesma branch e PR de implementação, com validação e gate do Analista. Usar após a aprovação humana do plano-base v2 ou, em modo experimental explícito, sobre uma referência imutável de v2.
---

# Executar plano-base aprovado

Manter o task principal como orquestrador e executor. O fluxo cria uma única branch e um único PR de implementação para o recorte completo; subseções são checkpoints internos, nunca PRs ou merges intermediários.

## Entrada

Aceitar como comando suficiente a referência do plano-base v2 e, opcionalmente, `modo experimental` ou `modo end-to-end`:

`Use $lp-factory-executar-plano no plano-base aprovado do PR #<número>.`

Usar `experimental` por padrão. Exigir `end-to-end` explícito para continuar automaticamente depois de cada gate aprovado.

Em produção, exigir que a v2 esteja na `main`. Em experimento, aceitar o head imutável de um PR de v2 empilhado, sem fazer merge.

## Preparar

1. Confirmar repositório, worktree, branch, estado Git limpo, plano, SHA e caso.
2. Ler o plano integral, a seção competente de `docs/roadmap.md`, `docs/base-tecnica.md` e somente fontes adicionais exigidas pela subseção atual.
3. Validar que cada fase executável use exatamente o identificador do roadmap, como `E18.5.3 — título`; rejeitar aliases ordinais como `Fase 1` e agrupamentos de subseções independentes.
4. Criar ou selecionar uma única branch `codex-app/<caso>-implementacao` e um único PR draft para todo o recorte. Nunca criar branch ou PR por subseção.
5. Registrar o SHA do plano como contrato imutável. Se houver execução anterior, identificar o último checkpoint pelo trailer de commit `LP-Factory-Phase: <identificador>`; se não for possível determinar unicamente a próxima subseção, parar e pedir o identificador.

## Executar uma subseção

Para a próxima subseção ainda não aprovada:

1. Confirmar objetivo, arquivos prováveis, escopo negativo e critérios de aceite do plano.
2. Implementar somente o necessário para essa subseção; não antecipar a próxima.
3. Executar as validações aplicáveis. Para código, executar `npm ci` e `npm run check` antes do gate; para alterações exclusivamente documentais, justificá-las como não aplicáveis.
4. Invocar `$lp-factory-avaliar-implementacao-analista` com o plano, o identificador, o diff e as evidências.
5. Tratar `aprovado para avançar` como checkpoint: commitar com o trailer `LP-Factory-Phase: <identificador>` e atualizar o mesmo PR draft.
6. Tratar `aprovado com correções obrigatórias` corrigindo somente o delta indicado e retornando ao mesmo Analista em `revisao_delta_implementacao`.
7. Tratar `requer teste humano` ou `bloqueado por decisão humana` como gate: parar e pedir apenas a evidência ou decisão necessária.

No modo `experimental`, após cada checkpoint, entregar relatório conciso e parar sem merge. No modo `end-to-end`, avançar para a próxima subseção aprovada.

## Encerrar o recorte

Depois do último checkpoint:

1. Executar validações integradas e corrigir regressões.
2. Acionar o Analista em `revisao_final_implementacao` para avaliar o conjunto contra o plano aprovado.
3. Se houver teste humano exigido pelo plano ou pelo Analista, parar no gate correspondente.
4. Aplicar `$lp-factory-abc` para atualizar apenas a documentação canônica necessária; não criar relatório documental paralelo.
5. Submeter o delta documental à revisão delta do Analista.
6. Publicar o mesmo PR como pronto para merge somente com `aprovado para merge da implementação` e sem pendências.

O resumo do PR é o registro operacional final. Não enviar relatório manual a outro agente de documentação.

## Limites

- Não alterar a `main` nem fazer merge.
- Não executar fase fora do plano ou fora da ordem do roadmap.
- Não iniciar a fase seguinte sem checkpoint aprovado.
- Não criar matriz de consolidação durante a implementação; ela pertence apenas à revisão do plano v2.
- Não substituir gate humano, decisão material ou teste humano exigido.

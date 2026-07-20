---
name: lp-factory-avaliar-implementacao-analista
description: Avaliar uma subseção implementada ou a entrega final de um plano-base aprovado do LP Factory 10 com o custom agent analista em modo read-only. Usar antes de avançar para a próxima subseção, de abrir o gate de teste humano ou de liberar o PR final para merge.
---

# Avaliar implementação pelo Analista

Usar exatamente um custom agent `analista` read-only por revisão. O task principal preserva a implementação, trata correções e mantém o mesmo PR de execução.

## Preparar

1. Confirmar repositório, worktree, branch, estado Git, SHA do plano aprovado e identificador exato da subseção.
2. Entregar ao Analista o trecho integral da subseção, critérios de aceite, diff desde o checkpoint anterior, arquivos alterados, validações executadas e fontes técnicas necessárias.
3. Para revisão final, entregar todos os checkpoints, diff acumulado, resultados integrados, delta documental e eventuais evidências de teste humano.
4. Parar se plano, fase, diff ou evidência forem ambíguos; não reconstruir o escopo por inferência.

## Delegar

1. Acionar o `analista` em `revisao_implementacao` ou `revisao_final_implementacao`.
2. Não expor pareceres de plano que não sejam necessários à subseção; o Analista não refaz Gestor Estrutural ou Gestor de Updates.
3. Preservar a resposta integral e o estado Git antes e depois da delegação.

## Tratar a conclusão

- `aprovado para avançar`: permitir somente o checkpoint da subseção atual.
- `aprovado com correções obrigatórias`: corrigir o delta e pedir `revisao_delta_implementacao` ao mesmo Analista.
- `requer teste humano`: parar e apresentar os passos e a evidência mínima solicitada.
- `bloqueado por decisão humana`: parar e apresentar apenas a decisão necessária.
- `aprovado para merge da implementação`: permitido somente na revisão final, depois de todas as subseções, testes e documentação.

## Limites

O Analista não edita arquivos, implementa, cria branch, commit ou PR, decide produto/arquitetura, substitui testes humanos ou autoriza merge com pendência.

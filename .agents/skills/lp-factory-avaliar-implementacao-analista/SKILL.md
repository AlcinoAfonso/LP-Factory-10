---
name: lp-factory-avaliar-implementacao-analista
description: Avaliar focalmente uma subseção quando acionada por risco material e executar a revisão final integrada de um plano-base aprovado do LP Factory 10 com o custom agent analista read-only.
---

# Avaliar implementação pelo Analista

Usar exatamente um custom agent `analista` read-only por revisão. O task principal preserva a implementação, trata correções e mantém o mesmo PR de execução.

## Preparar

1. Confirmar repositório, worktree, branch, estado Git, SHA do plano aprovado e, na revisão focal, o identificador exato da subseção.
2. Entregar ao Analista o trecho integral da subseção, critérios de aceite, diff desde o checkpoint anterior, arquivos alterados, validações executadas e fontes técnicas necessárias. No handoff da orquestração, incluir a matriz e os pareceres especializados nela referenciados que forem pertinentes à subseção. Para cada documento canônico avaliado, incluir snapshot anterior, relatório factual, resultado integral do ABC e documento resultante.
3. Na revisão final, entregar checkpoints, diff acumulado, resultados integrados, delta documental, matriz, pareceres preservados e evidências de QA aplicáveis.
4. Se plano, fase, diff ou evidência forem ambíguos, não delegar nem reconstruir o escopo por inferência; devolver ao chamador apenas a lacuna.

## Delegar

1. Acionar o `analista` em `revisao_implementacao` ou `revisao_final_implementacao`.
2. Usar a matriz como índice de rastreabilidade. Em revisão de subseção, expor somente os pareceres de plano nela referenciados que sejam pertinentes; na revisão final, disponibilizar a matriz e todos os pareceres preservados.
3. Quando houver documento canônico, auditar se o diff corresponde somente às operações emitidas pelo ABC e se `SEM ALTERAÇÕES NECESSÁRIAS` preservou o documento. Não refazer os critérios internos do contrato canônico.
4. Preservar a resposta integral e o estado Git antes e depois da delegação.

No fluxo de `$lp-factory-conduzir-plano-completo`, `revisao_implementacao` é focal nas condições definidas pelo Executor; `revisao_final_implementacao` é obrigatória após o último checkpoint e antes da entrega técnica ao supervisor.

## Tratar a conclusão

- `aprovado para avançar`: permitir somente o checkpoint da subseção atual; validação dependente de recurso ambiental indisponível pode ficar registrada para o gate final quando não impedir avaliar a correção nem a continuidade segura.
- `aprovado com correções obrigatórias`: corrigir o delta e pedir `revisao_delta_implementacao` ao mesmo Analista.
- `requer evidência de QA`: obter a evidência pelo método aplicável ao modo e retornar ao mesmo Analista; a conclusão não escolhe quem executa o teste.
- `bloqueado por decisão humana`: devolver somente o ponto ao supervisor competente; no `Autônomo`, não solicitar decisão ao usuário.
- `aprovado para merge da implementação`: permitido somente na revisão final, depois de todas as subseções, testes e documentação.

## Limites

O Analista permanece read-only e segue os limites do contrato runtime `.codex/agents/analista.toml`; este wrapper não os redefine.

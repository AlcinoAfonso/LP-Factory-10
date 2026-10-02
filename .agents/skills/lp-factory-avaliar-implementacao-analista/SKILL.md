---
name: lp-factory-avaliar-implementacao-analista
description: Avaliar focalmente um recorte implementado ou sua entrega final quando risco material, dúvida ou evidência insuficiente exigir revisão independente pelo custom agent analista read-only.
---

# Avaliar implementação pelo Analista

Usar exatamente um custom agent `analista` read-only por revisão. O task principal preserva a implementação, trata correções e mantém o mesmo PR de execução.

## Preparar

1. Confirmar repositório, worktree, branch, estado Git, SHA do plano aprovado e identificador exato da fase/recorte e finalidade focal, delta ou final.
2. Entregar ao Analista o trecho integral do recorte, critérios de aceite, diff desde o checkpoint anterior, arquivos alterados, validações executadas e fontes técnicas necessárias. Incluir matriz/rastreabilidade e pareceres somente quando existirem e forem pertinentes ao recorte; não exigir artefatos ou especialidades adicionais por rotina.
3. Se plano, fase, diff ou evidência forem ambíguos, não delegar nem reconstruir o escopo por inferência; devolver ao chamador apenas a lacuna.

## Delegar

1. Acionar o `analista` em `revisao_implementacao`, `revisao_delta_implementacao` ou `revisao_final_implementacao` conforme a finalidade necessária; a revisão final não é universal.
2. Usar rastreabilidade existente como índice e expor somente pareceres de plano pertinentes ao recorte.
3. Preservar a resposta integral e o estado Git antes e depois da delegação.

Usar esta skill somente quando os critérios condicionais do Executor exigirem avaliação independente. Implementação simples não exige chamada.

## Tratar a conclusão

- `aprovado para avançar`: permitir somente o checkpoint do recorte atual; não autoriza merge; validação dependente de recurso ambiental indisponível pode ficar registrada para o gate final quando não impedir avaliar a correção nem a continuidade segura.
- `aprovado com correções obrigatórias`: corrigir o delta e pedir `revisao_delta_implementacao` ao mesmo Analista.
- `requer evidência de QA`: obter a evidência pelo método aplicável ao modo e retornar ao mesmo Analista; a conclusão não escolhe quem executa o teste.
- `bloqueado por decisão humana`: devolver somente o ponto ao supervisor competente; no `Autônomo`, não solicitar decisão ao usuário.

- `aprovado para merge da implementação`: somente em revisão final, sem pendências; é parecer técnico favorável, ainda condicionado à liberação competente e aos gates de merge do Executor.

## Limites

O Analista permanece read-only e segue os limites do contrato runtime `.codex/agents/analista.toml`; este wrapper não os redefine.

---
name: lp-factory-avaliar-implementacao-analista
description: Avaliar focalmente um recorte implementado quando questão material residual exigir julgamento independente capaz de alterar decisão pelo custom agent analista read-only.
---

# Avaliar implementação pelo Analista

Usar exatamente um custom agent `analista` read-only por revisão. O task principal preserva a implementação, trata correções e mantém o mesmo PR de execução.

## Preparar

1. Confirmar repositório, worktree, branch, estado Git, SHA do plano aprovado, fase/recorte e finalidade. Receber questão material específica, insuficiência das fontes/controles existentes e decisão alterável conforme 3.2 do Executor, ou exigência literal aplicável de plano iniciado; sem esse critério, não delegar. Avaliação anterior de V2 não cria este gate.
2. Entregar referências recuperáveis do recorte integral e critérios de aceite, diff desde o checkpoint pertinente, arquivos alterados, validações executadas e fontes técnicas necessárias. Confirme acesso à versão indicada; leia integralmente as fontes pertinentes por referência, transportando conteúdo somente se o destinatário não conseguir resolvê-la ou se o julgamento exigir recebê-lo. Fonte mutável sem recuperação durável exige preservar antes o conteúdo aprovado indispensável, conforme 3.1 do Executor. Incluir matriz/rastreabilidade e pareceres somente quando existirem e forem pertinentes ao recorte; não exigir artefatos ou especialidades adicionais por rotina.
3. Se plano, fase, diff ou evidência forem ambíguos, não delegar nem reconstruir o escopo por inferência; devolver ao chamador apenas a lacuna.

## Delegar

1. Acionar o `analista` em `revisao_implementacao` ou `revisao_delta_implementacao` conforme a finalidade necessária.
2. Usar rastreabilidade existente como índice e expor somente pareceres de plano pertinentes ao recorte.
3. Preservar a resposta integral e o estado Git antes e depois da delegação.

Retornos seguem 3.2 do Executor para fechar pendência própria ou obter julgamento novo necessário. Achado de Code Review, novo HEAD e confirmação de correção objetiva não acionam nem reabrem esta avaliação por si; correção focal inequívoca dentro do contrato segue validação e novo Code Review.

## Tratar a conclusão

- `aprovado para avançar`: permitir somente o checkpoint do recorte atual; não autoriza merge; validação dependente de recurso ambiental indisponível pode ficar registrada para o gate final quando não impedir avaliar a correção nem a continuidade segura.
- `aprovado com correções obrigatórias`: corrigir o delta e pedir `revisao_delta_implementacao` ao mesmo Analista.
- `requer evidência de QA`: obter a evidência pelo método aplicável ao modo e retornar ao mesmo Analista; a conclusão não escolhe quem executa o teste.
- `bloqueado por decisão humana`: devolver somente o ponto ao Executor para condução sob a autoridade concedida; o Analista não solicita decisão ao usuário.


## Limites

O Analista permanece read-only e segue os limites do contrato runtime `.codex/agents/analista.toml`; este wrapper não os redefine.

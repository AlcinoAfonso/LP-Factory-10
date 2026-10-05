---
name: lp-factory-avaliar-implementacao-analista
description: Avaliar focalmente a questão recebida de um recorte implementado pelo custom agent analista read-only.
---

# Avaliar implementação pelo Analista

Na execução, receba a chamada decidida pelo Executor (§3.2); valide a entrada sem refazer o roteamento. Pedidos humanos e demais entradas autorizadas fora da execução permanecem sujeitos aos contratos competentes. No retorno, confira questão focal, parecer/contexto anterior, delta e evidências pertinentes.

Usar exatamente um custom agent `analista` read-only por revisão. O task principal preserva a implementação, trata correções e mantém o mesmo PR de execução.

## Preparar

1. Confirmar repositório, worktree, branch, estado Git, SHA do plano aprovado e identificador exato da fase/recorte e finalidade focal ou delta.
2. Entregar referências recuperáveis do recorte integral e critérios de aceite, diff desde o checkpoint pertinente, arquivos alterados, validações executadas e fontes técnicas necessárias. Confirme acesso à versão indicada; leia integralmente as fontes pertinentes por referência, transportando conteúdo somente se o destinatário não conseguir resolvê-la ou se o julgamento exigir recebê-lo. Fonte mutável sem recuperação durável exige preservar antes o conteúdo aprovado indispensável, conforme 3.1 do Executor. Incluir matriz/rastreabilidade e pareceres somente quando existirem e forem pertinentes ao recorte; não exigir artefatos ou especialidades adicionais por rotina.
3. Se plano, fase, diff ou evidência forem ambíguos, não delegar nem reconstruir o escopo por inferência; devolver ao chamador apenas a lacuna.

## Delegar

1. Acionar o `analista` em `revisao_implementacao` ou `revisao_delta_implementacao` conforme a finalidade recebida; entregar a questão, entradas e evidências preparadas, incluindo contexto anterior e delta no retorno.
2. Usar rastreabilidade existente como índice e expor somente pareceres de plano pertinentes ao recorte.
3. Preservar a resposta integral e o estado Git antes e depois da delegação.

## Tratar a conclusão

- `aprovado para avançar`: permitir somente o checkpoint do recorte atual; não autoriza merge; validação dependente de recurso ambiental indisponível pode ficar registrada para o gate final quando não impedir avaliar a correção nem a continuidade segura.
- `aprovado com correções obrigatórias`: devolver as correções e sua pendência; em retorno recebido, usar `revisao_delta_implementacao` no mesmo Analista.
- `requer evidência de QA`: devolver a evidência faltante; conferir a prova em retorno recebido no mesmo Analista, sem escolher quem executa o teste.
- `bloqueado por decisão humana`: devolver somente o ponto ao Executor para condução sob a autoridade concedida; o Analista não solicita decisão ao usuário.


## Limites

O Analista permanece read-only e segue os limites do contrato runtime `.codex/agents/analista.toml`; este wrapper não os redefine.

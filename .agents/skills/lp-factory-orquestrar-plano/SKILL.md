---
name: lp-factory-orquestrar-plano
description: "Orquestrar end-to-end um plano-base do LP Factory 10 a partir de uma v1 incorporada à main: produzir e aprovar a v2, reconciliar o roadmap e executar todas as subseções na mesma branch e no mesmo PR, usando especialistas uma vez antes da v2 e o Analista nos gates. Usar quando o humano informar o PR ou path da v1 e pedir para orquestrar, automatizar ou executar o plano completo."
---

# Orquestrar plano-base end-to-end

Conduzir revisão, v2 e implementação com uma única instrução humana. O task principal orquestra e executa; custom agents apenas avaliam em modo read-only.

## Entrada e invariantes

Aceitar como comando suficiente número, URL do PR ou path da v1, por exemplo: `Use $lp-factory-orquestrar-plano no PR #577.`

No fluxo normal:

- exigir a v1 incorporada à `main`; antes disso, limitar-se à avaliação read-only;
- usar uma única branch e um único PR draft contra `main` para v2, roadmap e implementação;
- não criar PR empilhado nem pedir nova instrução entre v2 e execução;
- pedir somente informação que impeça selecionar com segurança plano, estágio ou worktree.

`Modo experimental` deve ser explícito e altera somente os checkpoints de parada.

## Contratos obrigatórios

Ler `docs/orquestracao-plano-base.md` e seguir, sem copiar seus critérios:

- `lp-factory-avaliar-plano-estrutura`;
- `lp-factory-avaliar-plano-updates`;
- `lp-factory-avaliar-plano-automacoes`, somente com `Automação: sim`;
- `lp-factory-avaliar-plano-analista`;
- `lp-factory-executar-plano`;
- `lp-factory-avaliar-implementacao-analista` nos gates por subseção.

## Retomar antes de repetir

Determinar o estágio pelo PR, Git e trailers:

- reutilizar parecer completo somente para o mesmo blob da v1;
- `LP-Factory-Stage: plan-v2-approved`: seguir para execução;
- `LP-Factory-Phase: <identificador>`: seguir para a próxima subseção;
- v2 pronta sem aprovação ou roadmap: retomar nesse gate.

Se o estágio não for inequívoco, pedir apenas a referência faltante; nunca reiniciar por precaução.

## 1. Congelar fonte e preparar destino

1. Confirmar PR, base, head, SHAs, caso e exatamente um `docs/lousa-plano-base-*.md`; diante de ambiguidade, pedir o path.
2. Registrar head SHA, blob SHA, path e conteúdo integral da v1, além do commit, blob e conteúdo de `docs/roadmap.md` na `main`.
3. Confirmar que a v1 congelada está na `main` atualizada.
4. Criar branch `codex-app/<caso>-orquestracao` pelo modo simples ou reutilizar uma única worktree limpa e compatível quando houver frente paralela. Nunca editar `main`, branch manual ou head do PR da v1.

## 2. Preparar contexto e especialistas

1. Confirmar a seção do roadmap, decisões registradas, dependências, consumidores, casos adjacentes e fontes técnicas competentes.
2. Obter plano conceitual somente por referência competente ou vínculo inequívoco com o recorte; se não existir, registrar `N/A` e continuar.
3. Exigir em cada fase o identificador exato da subseção do roadmap; não usar aliases ordinais.
4. Acionar uma vez e preservar integralmente os pareceres do Gestor Estrutural e do Gestor de Updates sobre a mesma v1.
5. Acionar o Gestor de Automações somente quando houver `Automação: sim`; caso contrário, registrar `N/A`.
6. Aplicar as regras de conclusão e completude das skills especializadas. Não refazer avaliações no task principal nem completar patch que exija escolha técnica.

Parar somente diante de handoff incompleto, investigação necessária ou decisão material sem autoridade. Não repetir especialista durante a consolidação; questão material nova segue ao domínio indicado pelo Analista.

## 3. Produzir v2 e matriz

1. Editar somente o plano na branch de automação e preservar objetivo, decisões válidas, ordem, hierarquia e granularidade da v1.
2. Classificar cada acréscimo como `preservação`, `extensão adjacente necessária e proporcional` ou `expansão`; não incorporar expansão sem decisão humana ou novo recorte.
3. Aplicar somente patches autossuficientes e rastreáveis. Oportunidade estratégica condicional de update não autoriza implementação atual.
4. Preparar uma linha de matriz por achado estrutural, update elegível e decisão de automação com especialista, ID, achado, classificação original, relação com o escopo, tratamento, destino do update quando aplicável, localização e evidência.
5. Antes da Passagem 1, não gravar nem expor matriz ou pareceres ao Analista. Validar a v2 e criar checkpoint `LP-Factory-Stage: plan-v2` somente com o plano.

## 4. Gate do Analista

1. Executar a Passagem 1 com v1, v2, plano conceitual quando existente ou `N/A`, decisões e fontes do caso, sem pareceres ou matriz.
2. Preservar a resposta, gravar e versionar `docs/matriz-consolidacao-<caso>.md` e continuar no mesmo Analista.
3. Executar a Passagem 2 com os pareceres integrais e a matriz.
4. Em correções objetivas, atualizar v2 e matriz e pedir `revisao_delta` ao mesmo Analista. Retornar a especialista somente por questão material nova; decisão humana permanece humana.
5. Avançar apenas com `aprovado para merge do plano-base v2`.

## 5. Reconciliar roadmap e abrir o PR

1. Em checkpoint limpo, verificar se fontes canônicas mudaram na `origin/main`; integrar por merge não destrutivo, reler somente o que mudou e pedir revisão delta apenas se houver conflito material.
2. Usar `$lp-factory-abc` em modo planejamento para produzir o menor delta de `docs/roadmap.md` entre o snapshot e a v2 aprovada, conforme `docs/prompt-abc.md` e `docs/template-roadmap.md`.
3. Submeter o roadmap ao mesmo Analista em `revisao_delta`, inclusive quando o ABC retornar `SEM ALTERAÇÕES NECESSÁRIAS`.
4. Criar `LP-Factory-Stage: plan-v2-approved` com plano, roadmap e matriz; validar o diff e abrir ou atualizar o único PR draft contra `main`.

## 6. Executar no mesmo PR

1. Invocar internamente `$lp-factory-executar-plano` no checkpoint aprovado, preservando branch, worktree e PR.
2. Em cada subseção, exigir que o subfluxo identifique documentos canônicos afetados e execute `$lp-factory-abc` separadamente para cada um antes do gate do Analista. Aplicar somente o delta literal; com `SEM ALTERAÇÕES NECESSÁRIAS`, preservar o documento. Não permitir edição canônica direta.
3. Não repetir especialistas. Usar o Analista somente nos gates por subseção, com a matriz, os pareceres pertinentes e as evidências de execução do ABC quando houver documento canônico avaliado.
4. Executar todas as subseções e validações aplicáveis; manter o PR draft atualizado e retomar por checkpoints.
5. Depois da última subseção e dos testes aplicáveis, declarar a entrega completa, informar os ABCs executados e seus resultados por documento e parar. Não acionar nenhum modo do Analista nem o Estrategista após essa declaração.
6. O Estrategista atua somente por instrução humana e lê diretamente o PR. Correções devolvidas pelo humano são aplicadas e publicadas sem novo Analista; o mesmo Estrategista reavalia quando instruído.

Manter a matriz disponível na entrega. Removê-la depois somente por instrução humana, sem novo gate do Analista.

## Devolução

Informar referências de v1, worktree, branch, pareceres, Passagens 1 e 2, ABC e delta do roadmap, ABCs da implementação e seus resultados por documento, checkpoints, validações, arquivos, commits, PR e pendências. Não reescrever pareceres.

## Limites

Não editar ou commitar na `main`; alterar a v1 ou seu PR; criar PR empilhado, segunda branch ou segundo PR; permitir edição por custom agents; ampliar escopo silenciosamente; repetir especialistas do mesmo blob; fazer merge; ou substituir decisão humana.

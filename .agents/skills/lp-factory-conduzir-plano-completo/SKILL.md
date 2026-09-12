---
name: lp-factory-conduzir-plano-completo
description: "Conduzir end-to-end um plano-base Complexo da LP Factory 10 a partir de uma V1 funcional aprovada: quando ela já estiver congelada, retomar pelo PR existente; quando vier apenas por handoff curto com Debate + plano, materializá-la e congelá-la no PR único antes do workflow técnico. Produzir e aprovar V2, reconciliar o roadmap e executar todas as subseções na mesma branch e no mesmo PR, usando especialistas antes da V2 e o Analista nos gates."
---

# Conduzir plano-base Complexo end-to-end

Conduzir materialização inicial quando necessária, revisão, V2 técnica e implementação no PR único do plano. A task técnica coordena o workflow até a aprovação da V2 e então assume o contrato do Executor; custom agents apenas avaliam em modo read-only.

## Entrada e invariantes

Aceitar como entrada suficiente uma das formas:

- número/URL do PR ou path da V1 acompanhado da referência inequívoca do PR, quando a V1 já estiver materializada e congelada;
- handoff curto com identificação inequívoca do plano, referência ao Debate/V1 aprovada e `Execução: Complexa`, quando ainda não existir PR do plano.

No fluxo normal:

- tratar a V1 aprovada como contrato funcional e a V2 como contrato técnico executável, sem ampliar silenciosamente o produto;
- se a V1 já estiver congelada em PR, reutilizar a branch head e o PR existentes;
- se o handoff trouxer somente a referência aprovada no Debate, a própria task técnica materializa e congela a V1 antes de qualquer especialista;
- não criar PR empilhado nem pedir nova instrução entre V1, V2 e execução;
- pedir somente informação que impeça selecionar com segurança plano, V1 aprovada, estágio ou worktree.

`Modo experimental` deve ser explícito e altera somente os checkpoints de parada.

## Contratos obrigatórios

Ler `docs/pipeline-plano-base.md` somente para roteamento e seguir os contratos competentes, sem copiar seus critérios:

- `lp-factory-avaliar-plano-estrutura` em `derivacao_inicial`;
- `lp-factory-avaliar-plano-updates`;
- `lp-factory-avaliar-plano-estrutura` em `confronto_modernizacao`, somente para update com impacto estrutural material;
- `lp-factory-avaliar-plano-estrutura` em `revisao_focal_implementacao`, somente quando evidência real da implementação desafiar materialmente a v2 ou exigir estrutura material não prevista;
- `lp-factory-avaliar-plano-automacoes`, quando a V1 identificar automação aplicável e não registrar dispensa humana explícita da avaliação formal;
- `lp-factory-avaliar-plano-analista`;
- `lp-factory-executar-plano`;
- `lp-factory-avaliar-implementacao-analista` nos gates por subseção.

## Retomar antes de repetir

Determinar o estágio pelo PR, Git e trailers:

- reutilizar parecer completo somente para o mesmo blob da V1;
- reutilizar confronto de modernização somente para o mesmo update, mesma alternativa técnica e mesmo blob da V1;
- `LP-Factory-Stage: plan-v2-approved`: seguir para execução;
- `LP-Factory-Phase: <identificador>`: seguir para a próxima subseção;
- V2 pronta sem aprovação ou roadmap: retomar nesse gate.
- evidência de implementação que desafie materialmente a v2: suspender somente o ponto afetado e retomar pela revisão estrutural focal, preservando a mesma task, branch, PR, v1 e checkpoints não afetados.

Se o estágio não for inequívoco, pedir apenas a referência faltante; nunca reiniciar por precaução.

## 1. Materializar ou confirmar V1 e preparar destino

1. Resolver inequivocamente a V1 aprovada do plano indicado no handoff. Quando a origem for o Debate, usar somente a V1 consolidada daquele plano; histórico, alternativas rejeitadas e demais planos do Debate não integram o contrato.
2. Se ainda não existir PR do plano, confirmar o identificador aprovado e materializar a V1 em `docs/lousa-plano-base-<caso>.md`, seguindo a identificação do recorte e a convenção vigente do repositório; diante de ambiguidade real de path, pedir somente esse dado. Criar branch dedicada e PR único contra `main`, conforme `AGENTS.md`, e congelar a V1 por commit antes de qualquer derivação.
3. Se o PR já existir, confirmar base `main`, head, SHAs, caso e exatamente um `docs/lousa-plano-base-*.md`; diante de ambiguidade, pedir o path.
4. Confirmar que o commit congelado da V1 pertence ao histórico da branch head do PR e registrar commit SHA, blob SHA, path e conteúdo integral da V1.
5. Registrar commit, blob e conteúdo de `docs/roadmap.md` na `main` usada como base do PR.
6. Reutilizar a branch head, a worktree compatível e o PR da V1. Nunca editar `main`, criar segunda branch/PR ou reescrever o commit congelado da V1.

## 2. Preparar contexto e especialistas

1. Confirmar a seção do roadmap, decisões registradas, dependências, consumidores, casos adjacentes e fontes técnicas competentes.
2. Obter plano conceitual somente por referência competente ou vínculo inequívoco com o recorte; se não existir, registrar `N/A` e continuar.
3. Exigir em cada fase o identificador exato da subseção do roadmap; não usar aliases ordinais.
4. Acionar o Gestor Estrutural em `derivacao_inicial` sobre a V1 congelada e preservar integralmente seu parecer.
5. Acionar o Gestor de Updates sobre a mesma V1, entregando a derivação estrutural inicial como baseline comparativa.
6. Para cada update com impacto estrutural material, acionar o Gestor Estrutural em `confronto_modernizacao`, limitado ao candidato; não repetir a derivação completa.
7. Acionar o Gestor de Automações quando a V1 identificar automação aplicável e não registrar dispensa humana da avaliação formal. Quando houver dispensa, registrar `N/A — avaliação formal dispensada na V1`; quando a decisão ou o recorte automatizado estiver ambíguo, pedir somente o esclarecimento necessário.
8. Aplicar as regras de conclusão e completude das skills especializadas. Não refazer avaliações na task principal nem completar patch que exija escolha técnica.

Durante a implementação, quando o Executor ou o Analista registrar que uma correção exige nova estrutura material não prevista na v2, ou que um mecanismo aprovado pela própria v2 criou obrigações estruturais relevantes que colocam sua minimalidade em dúvida, suspender somente o ponto afetado e acionar `lp-factory-avaliar-plano-estrutura` em `revisao_focal_implementacao`. Preservar a mesma task, worktree, branch, PR, v1 congelada e checkpoints válidos. Se o parecer focal concluir que a v2 precisa mudar, manter a v2 anterior imutável no histórico, materializar e versionar a v2 e a matriz candidatas em referência imutável no mesmo PR, submetê-la ao mesmo Analista em `revisao_delta`, registrar novamente `LP-Factory-Stage: plan-v2-approved` somente após a aprovação e então confrontar o delta com os checkpoints já aprovados e retomar a mesma subseção pelo Executor; checkpoints não afetados permanecem válidos. Se o parecer focal concluir que a v2 não precisa mudar, preservar a v2, a matriz e os checkpoints, devolver a correção local ao mesmo Executor e ao mesmo Analista de implementação em `revisao_delta_implementacao`, sem nova referência de v2 e sem novo `LP-Factory-Stage: plan-v2-approved`. Não reiniciar o plano, reabrir especialistas por rotina ou adicionar proteção sobre necessidade criada exclusivamente pela solução.

Parar somente diante de handoff incompleto, investigação necessária ou decisão material sem autoridade. Questão material nova segue ao domínio indicado pelo Analista; não repetir especialista por precaução.

## 3. Produzir V2 técnica e matriz

1. Editar somente o plano na branch do plano e preservar objetivo, decisões funcionais válidas, ordem, hierarquia e granularidade da V1, acrescentando o detalhamento técnico necessário para torná-la executável.
2. Classificar cada acréscimo técnico como `derivação técnica da V1`, `modernização técnica justificada` ou `ampliação de escopo`; não incorporar ampliação sem decisão humana ou novo recorte.
3. Aplicar somente tratamentos autorizados pelos pareceres especializados. Modernização com impacto estrutural material só pode ser consolidada após o confronto focal correspondente; oportunidade estratégica condicional não autoriza implementação atual. Para qualquer crescimento estrutural material, transportar na v2 a prova de minimalidade produzida pelo Gestor Estrutural, sem substituir a arquitetura vigente por necessidade criada exclusivamente pela própria solução.
4. Preparar a matriz com origem, classe, tratamento, localização e evidência de cada achado; para crescimento estrutural material, registrar também requisito da v1 ou invariante preexistente, reuso avaliado, alternativa mais simples, insuficiência factual e complexidade líquida; para updates, registrar o destino e a referência ao confronto estrutural quando aplicável.
5. Antes da Passagem 1, não gravar nem expor matriz ou pareceres ao Analista. Validar a V2 e criar checkpoint `LP-Factory-Stage: plan-v2` somente com o plano.

## 4. Gate do Analista

1. Executar a Passagem 1 com V1, V2, plano conceitual quando existente ou `N/A`, decisões e fontes do caso, sem pareceres, confrontos ou matriz.
2. Preservar a resposta, gravar e versionar `docs/matriz-consolidacao-<caso>.md` e continuar no mesmo Analista.
3. Executar a Passagem 2 com os pareceres integrais, confrontos estruturais aplicáveis e a matriz.
4. Em correções objetivas, inclusive conflito resolvido por fonte ou invariante e validação exclusivamente pós-merge, atualizar V2 e matriz e pedir `revisao_delta` ao mesmo Analista. Antes de aprovar crescimento estrutural material, exigir a prova de minimalidade e rejeitar ausência ou justificativa circular baseada em necessidade criada pela própria solução; corrigir a v2, sem adicionar proteções sobre a arquitetura candidata. Antes de parar por decisão humana, exigir ausência de fonte determinante e, para precedência de banco, prova de que migration compatível, feature flag ou expand/contract não evita PR precursor. Retornar a especialista somente por questão material nova ou conclusão especializada alterada.
5. Avançar apenas com `aprovado para merge do plano-base v2`.

## 5. Reconciliar roadmap e atualizar o PR

1. Em checkpoint limpo, verificar se fontes canônicas mudaram na `origin/main`; integrar por merge não destrutivo, reler somente o que mudou e pedir revisão delta apenas se houver conflito material.
2. Usar `$lp-factory-abc` em modo planejamento para produzir o menor delta de `docs/roadmap.md` entre o snapshot e a V2 aprovada, conforme `docs/prompt-abc.md` e `docs/template-roadmap.md`.
3. Submeter o roadmap ao mesmo Analista em `revisao_delta`, inclusive quando o ABC retornar `SEM ALTERAÇÕES NECESSÁRIAS`.
4. Criar `LP-Factory-Stage: plan-v2-approved` com plano, roadmap e matriz; validar o diff e atualizar o único PR draft contra `main`.

## 6. Handoff ao Executor no mesmo PR

1. No checkpoint `LP-Factory-Stage: plan-v2-approved`, invocar internamente `$lp-factory-executar-plano`, preservando a mesma task, branch, worktree e PR e entregando a V2 aprovada, a matriz, os pareceres pertinentes e os identificadores canônicos do roadmap.
2. A partir desse checkpoint, execução por subseções, validações e QA, ABC, gates do Analista de implementação, checkpoints, publicação, entrega, correções, retomada após liberação do supervisor, merge remoto, validações pós-merge e registro final no Debate seguem exclusivamente `$lp-factory-executar-plano`; este workflow não replica nem redefine essas regras.
3. Preservar somente as invariantes de continuidade da orquestração: mesmo PR/branch/worktree, regra geral de não repetir especialistas, com a única exceção de `revisao_focal_implementacao` disparada por evidência material conforme o contrato, e matriz disponível ao Executor até o supervisor declarar o recorte definitivamente concluído.
4. Se o Executor reportar questão material fora da V2 aprovada, seguir a escalada prevista no contrato dele; quando a evidência desafiar materialmente a premissa estrutural da V2, usar a revisão focal prevista neste workflow, preservando trabalho e checkpoints válidos; não reabrir a derivação completa nem repetir especialista por precaução.

## Devolução

Informar referências de V1, worktree, branch, pareceres aplicáveis, confrontos estruturais quando houver, Passagens 1 e 2, V2 aprovada, ABC e delta do roadmap, matriz, checkpoint `plan-v2-approved`, PR e pendências de derivação. Para implementação e encerramento, incorporar por referência a entrega e o recibo final produzidos por `$lp-factory-executar-plano`, sem reescrever seus relatórios.

## Limites

Não editar ou commitar na `main`; reescrever o commit congelado da V1; criar PR empilhado, segunda branch ou segundo PR; permitir edição por custom agents; ampliar escopo silenciosamente; repetir especialistas do mesmo blob por precaução, salvo a revisão estrutural focal exigida por evidência material durante a implementação; executar merge fora do ciclo liberado de `$lp-factory-executar-plano`; ou substituir o supervisor competente.

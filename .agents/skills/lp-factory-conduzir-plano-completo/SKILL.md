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

Parar somente diante de handoff incompleto, investigação necessária ou decisão material sem autoridade. Questão material nova segue ao domínio indicado pelo Analista; não repetir especialista por precaução.

## 3. Produzir V2 técnica e matriz

1. Editar somente o plano na branch do plano e preservar objetivo, decisões funcionais válidas, ordem, hierarquia e granularidade da V1, acrescentando o detalhamento técnico necessário para torná-la executável.
2. Classificar cada acréscimo técnico como `derivação técnica da V1`, `modernização técnica justificada` ou `ampliação de escopo`; não incorporar ampliação sem decisão humana ou novo recorte.
3. Aplicar somente tratamentos autorizados pelos pareceres especializados. Modernização com impacto estrutural material só pode ser consolidada após o confronto focal correspondente; oportunidade estratégica condicional não autoriza implementação atual.
4. Preparar a matriz com origem, classe, tratamento, localização e evidência de cada achado; para updates, registrar também o destino e a referência ao confronto estrutural quando aplicável.
5. Antes da Passagem 1, não gravar nem expor matriz ou pareceres ao Analista. Validar a V2 e criar checkpoint `LP-Factory-Stage: plan-v2` somente com o plano.

## 4. Gate do Analista

1. Executar a Passagem 1 com V1, V2, plano conceitual quando existente ou `N/A`, decisões e fontes do caso, sem pareceres, confrontos ou matriz.
2. Preservar a resposta, gravar e versionar `docs/matriz-consolidacao-<caso>.md` e continuar no mesmo Analista.
3. Executar a Passagem 2 com os pareceres integrais, confrontos estruturais aplicáveis e a matriz.
4. Em correções objetivas, inclusive conflito resolvido por fonte ou invariante e validação exclusivamente pós-merge, atualizar V2 e matriz e pedir `revisao_delta` ao mesmo Analista. Antes de parar por decisão humana, exigir ausência de fonte determinante e, para precedência de banco, prova de que migration compatível, feature flag ou expand/contract não evita PR precursor. Retornar a especialista somente por questão material nova ou conclusão especializada alterada.
5. Avançar apenas com `aprovado para merge do plano-base v2`.

## 5. Reconciliar roadmap e atualizar o PR

1. Em checkpoint limpo, verificar se fontes canônicas mudaram na `origin/main`; integrar por merge não destrutivo, reler somente o que mudou e pedir revisão delta apenas se houver conflito material.
2. Usar `$lp-factory-abc` em modo planejamento para produzir o menor delta de `docs/roadmap.md` entre o snapshot e a V2 aprovada, conforme `docs/prompt-abc.md` e `docs/template-roadmap.md`.
3. Submeter o roadmap ao mesmo Analista em `revisao_delta`, inclusive quando o ABC retornar `SEM ALTERAÇÕES NECESSÁRIAS`.
4. Criar `LP-Factory-Stage: plan-v2-approved` com plano, roadmap e matriz; validar o diff e atualizar o único PR draft contra `main`.

## 6. Executar no mesmo PR

1. Invocar internamente `$lp-factory-executar-plano` no checkpoint aprovado, preservando branch, worktree e PR.
2. Em cada subseção, exigir que o subfluxo identifique documentos canônicos afetados e execute `$lp-factory-abc` separadamente para cada um antes do gate do Analista. Aplicar somente o delta literal; com `SEM ALTERAÇÕES NECESSÁRIAS`, preservar o documento. Não permitir edição canônica direta.
3. Não repetir especialistas. Usar o Analista somente nos gates por subseção, com a matriz, os pareceres pertinentes e as evidências de execução do ABC quando houver documento canônico avaliado.
4. Executar todas as subseções e validações aplicáveis; manter o PR draft atualizado e retomar por checkpoints.
5. Depois da última subseção e dos testes aplicáveis, declarar a entrega completa, informar os ABCs executados e seus resultados por documento e devolver ao supervisor competente. Não acionar novo modo do Analista após essa declaração.
6. Correções determinadas pelo supervisor são aplicadas e publicadas sem repetir especialistas ou Analista, salvo questão material nova que exija o gate competente.

Manter a matriz disponível na entrega e durante o ciclo externo de avaliação. Não removê-la antes de o supervisor competente declarar o recorte definitivamente concluído; a remoção posterior é tarefa documental de encerramento e não cria novo gate do Analista nem reabre a orquestração.

## Devolução

Informar referências de V1, worktree, branch, pareceres aplicáveis, confrontos estruturais quando houver, Passagens 1 e 2, ABC e delta do roadmap, ABCs da implementação e seus resultados por documento, checkpoints, validações, arquivos, commits, PR e pendências. Não reescrever pareceres.

## Limites

Não editar ou commitar na `main`; reescrever o commit congelado da V1; criar PR empilhado, segunda branch ou segundo PR; permitir edição por custom agents; ampliar escopo silenciosamente; repetir especialistas do mesmo blob por precaução; fazer merge; ou substituir o supervisor competente.

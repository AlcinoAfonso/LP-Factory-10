---
name: lp-factory-avaliar-plano-analista
description: Avaliar um plano-base v2 técnico do LP Factory 10 com o custom agent analista. No Light, executar uma avaliação independente sem matriz e sem segunda passagem. Na Complexa, executar uma única avaliação consolidada cobrindo V1 × V2, pareceres, matriz e reconciliação do roadmap.
---

# Avaliar plano-base v2 com o Analista

Roteie a avaliação pelo nível recebido sem misturar contratos.

## Roteamento

1. Confirmar se o nível é `Light` ou `Complexa` a partir do handoff competente. Quando a invocação vier de `$lp-factory-conduzir-plano-completo`, tratar como `Complexa` sem exigir nova entrada.
2. No `Light`, executar somente o fluxo da seção `Fluxo Light` e não exigir matriz, parecer estrutural, parecer de Automações ou segunda passagem.
3. Na `Complexa`, executar o fluxo `Preparar Complexa` e uma única `Avaliação Complexa consolidada`; usar `revisao_delta` somente quando a própria avaliação exigir correção objetiva.
4. Se o nível não puder ser determinado sem inferência, pedir somente essa informação.

## Fluxo Light

1. Confirmar worktree, branch, repositório, caso e estado Git.
2. Obter referências imutáveis, paths e conteúdos integrais da V1 congelada e da V2 Light mínima. Se compartilharem o mesmo path, diferenciá-las pelos commits SHAs correspondentes.
3. Não exigir nem receber matriz, parecer do Gestor Estrutural, parecer do Gestor de Automações ou cadeia de especialistas. Updates pode existir como origem técnica da V2, mas seu parecer não integra a entrada do Analista Light.
4. Iniciar exatamente um subagent `analista` com `fork_turns=none`, quando disponível, no modo `avaliacao_light`.
5. Entregar apenas V1, V2 Light, decisões registradas, caso, roadmap, casos adjacentes e fontes técnicas necessárias. Não entregar pareceres especializados, confrontos ou matriz.
6. Preservar integralmente a resposta e tratar somente uma conclusão permitida pelo contrato runtime:
   - `aprovado para implementar`: liberar a V2 Light para implementação;
   - `aprovado com correções obrigatórias`: devolver somente as correções objetivas; após o Executor ajustar a V2, continuar no mesmo Analista em `revisao_delta_light`;
   - `requer reclassificação como Complexa`: parar e devolver a necessidade de reclassificação ao supervisor competente;
   - `bloqueado por decisão humana`: parar e devolver somente a decisão necessária.
7. Em `revisao_delta_light`, entregar a referência anterior, a nova referência ou diff e as correções solicitadas. Verificar apenas o delta e seus efeitos regressivos. Liberar somente após `aprovado para implementar`.
8. Confirmar novamente o estado Git e distinguir alterações preexistentes. O Analista permanece read-only.

## Preparar Complexa

1. Confirmar worktree, branch, repositório, caso e estado Git.
2. Obter:
   - referências imutáveis, paths e conteúdos integrais de v1 e v2;
   - plano conceitual somente quando houver referência competente ou vínculo inequívoco com o recorte; caso contrário, `N/A` confirmado sem bloquear o fluxo;
   - decisões humanas registradas, casos adjacentes e fontes técnicas necessárias;
   - parecer integral de cada especialista incluído;
   - matriz de consolidação;
   - snapshot imutável do roadmap anterior, ABC emitido por `$lp-factory-abc` e roadmap resultante, inclusive quando o ABC registrar `SEM ALTERAÇÕES NECESSÁRIAS`.
3. Resolver versões em PR ou commit pelo SHA, nunca pela cópia local conveniente. Se v1 e v2 compartilharem path, diferenciá-las por referências imutáveis.
4. Parar diante de artefato ausente, caso divergente ou fonte conceitual ambígua; não reconstruir por inferência.
5. Exigir pareceres do Gestor de Updates e do Gestor Estrutural. Quando houver update com impacto estrutural material, exigir que o parecer estrutural único registre o tratamento correspondente. Exigir o parecer do Gestor de Automações quando a v1 identificar uma entrega ou parte do plano sujeita a automação sem dispensa humana explícita da avaliação formal; com dispensa registrada, exigir `N/A — avaliação formal dispensada na v1`. Em planos anteriores sem esse registro, exigir o parecer.
6. Registrar o estado Git anterior à delegação.

## Validar a matriz

Exigir uma linha por achado com identificação estável, origem (`v1`, `invariante técnico` ou `update`), classe (`derivação técnica da v1`, `modernização técnica justificada` ou `ampliação de escopo`), tratamento, localização/evidência e, para updates, os dados exigidos pelo contrato do Gestor de Updates e o tratamento estrutural correspondente quando aplicável.

Matriz incompleta, modernização material sem tratamento estrutural verificável ou linha sem correspondência verificável impede o handoff.

## Avaliação Complexa consolidada

1. Iniciar exatamente um subagent `analista` com `fork_turns=none`, quando disponível, no modo `avaliacao_complexa_consolidada`.
2. Entregar em um único handoff v1, v2, plano conceitual quando existente ou `N/A`, decisões registradas, caso, casos adjacentes, fontes técnicas, pareceres especializados integrais, matriz, snapshot anterior do roadmap, ABC e roadmap resultante.
3. Exigir que o Analista trabalhe na mesma resposta em ordem: primeiro registre o confronto V1 × V2 pelos critérios da antiga passagem independente; depois audite pareceres e matriz pelos critérios da antiga auditoria de consolidação; por fim audite o roadmap pelos critérios da antiga revisão delta de roadmap. O resultado independente inicial não deve ser reescrito depois da leitura dos pareceres.
4. Exigir cobertura explícita das três etapas e uma única conclusão formal do contrato runtime. A avaliação deve devolver de uma vez todos os achados materiais observáveis no estado submetido, evitando correções seriadas por omissão.
5. Tratar somente uma conclusão permitida. Correção objetiva volta ao mesmo Analista em `revisao_delta`; questão material nova retorna a especialista apenas quando a própria avaliação comprovar necessidade.
6. Confirmar novamente o estado Git e distinguir alterações preexistentes. O Analista permanece read-only.

## Devolver

Apresentar sem reescrever a avaliação Complexa consolidada, sua conclusão, correções e eventual necessidade de nova rodada especializada ou decisão humana. Acrescentar apenas versões avaliadas, pareceres auditados, roadmap/ABC auditados, agente acionado e estado Git final.

Se faltar qualquer uma das três etapas ou a conclusão, devolver o conteúdo e marcar o handoff como incompleto; não completar o parecer.

## Revisar correções

Usar `revisao_delta` no mesmo Analista somente quando a avaliação consolidada exigir correções objetivas, entregando versões ou diff, correções solicitadas e o delta de roadmap/ABC quando afetado. Retornar ao especialista somente diante de questão material nova ou conclusão especializada alterada. Liberar o gate apenas após `aprovado para merge do plano-base v2`.

## Limites

Não editar artefatos, criar branch/commit/PR, consolidar v2, refazer especialidade, acionar outros especialistas, avaliar implementação ou autorizar merge com pendência. No Light, não exigir nem produzir artefato exclusivo da Complexa. Na Complexa, não pular matriz, parecer aplicável, nenhuma das três etapas da avaliação consolidada ou o gate final.

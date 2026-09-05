---
name: lp-factory-avaliar-plano-analista
description: Avaliar um plano-base v2 técnico do LP Factory 10 com o custom agent analista. No Light, executar uma avaliação independente sem matriz e sem segunda passagem. Na Complexa, preservar o gate existente em duas passagens com matriz, pareceres e confrontos aplicáveis.
---

# Avaliar plano-base v2 com o Analista

Roteie a avaliação pelo nível recebido sem misturar contratos.

## Roteamento

1. Confirmar se o nível é `Light` ou `Complexa` a partir do handoff competente. Quando a invocação vier de `$lp-factory-conduzir-plano-completo`, tratar como `Complexa` sem exigir nova entrada.
2. No `Light`, executar somente o fluxo da seção `Fluxo Light` e não exigir matriz, parecer estrutural, parecer de Automações ou segunda passagem.
3. Na `Complexa`, preservar integralmente o fluxo existente a partir de `Preparar`, inclusive matriz, duas passagens, revisões delta e reconciliação do roadmap.
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

## Preparar

1. Confirmar worktree, branch, repositório, caso e estado Git.
2. Obter:
   - referências imutáveis, paths e conteúdos integrais de v1 e v2;
   - plano conceitual somente quando houver referência competente ou vínculo inequívoco com o recorte; caso contrário, `N/A` confirmado sem bloquear o fluxo;
   - decisões humanas registradas, roadmap, casos adjacentes e fontes técnicas necessárias;
   - parecer integral de cada especialista incluído;
   - confrontos estruturais focais de modernização quando exigidos pelo Gestor de Updates;
   - matriz de consolidação.
3. Resolver versões em PR ou commit pelo SHA, nunca pela cópia local conveniente. Se v1 e v2 compartilharem path, diferenciá-las por referências imutáveis.
4. Parar diante de artefato ausente, caso divergente ou fonte conceitual ambígua; não reconstruir por inferência.
5. Exigir pareceres do Gestor Estrutural e do Gestor de Updates. Para cada update com impacto estrutural material, exigir também o confronto focal do Gestor Estrutural. Exigir o parecer do Gestor de Automações quando a v1 identificar uma entrega ou parte do plano sujeita a automação sem dispensa humana explícita da avaliação formal; com dispensa registrada, exigir `N/A — avaliação formal dispensada na v1`. Em planos anteriores sem esse registro, exigir o parecer.
6. Registrar o estado Git anterior à delegação.

## Validar a matriz

Exigir uma linha por achado com identificação estável, origem (`v1`, `invariante técnico` ou `update`), classe (`derivação técnica da v1`, `modernização técnica justificada` ou `ampliação de escopo`), tratamento, localização/evidência e, para updates, os dados exigidos pelo contrato do Gestor de Updates e referência ao confronto estrutural quando aplicável.

Matriz incompleta, modernização material sem confronto ou linha sem correspondência verificável impede o handoff.

## Passagem 1

1. Iniciar exatamente um subagent `analista` com `fork_turns=none`, quando disponível, no modo `passagem_independente`.
2. Entregar apenas v1, v2, plano conceitual quando existente ou `N/A`, decisões registradas, caso, roadmap, casos adjacentes e fontes técnicas.
3. Não entregar, citar ou expor pareceres, confrontos ou matriz por prompt, histórico ou anexos.
4. Preservar integralmente a resposta. Se contaminada, descartá-la e reiniciar uma única instância limpa.

## Passagem 2

1. Continuar no mesmo thread no modo `auditoria_consolidacao`.
2. Entregar pareceres integrais, confrontos estruturais aplicáveis e matriz, sem reescrever achados.
3. Solicitar a auditoria conforme o contrato runtime de `.codex/agents/analista.toml`, preservando a Passagem 1.
4. Aguardar a conclusão formal definida no contrato runtime.

## Devolver

Apresentar sem reescrever Passagem 1, Passagem 2, conclusão, correções e eventuais rodadas especializadas ou decisões humanas. Acrescentar apenas versões avaliadas, pareceres/confrontos auditados, agente acionado e estado Git final.

Conferir o estado Git. Se faltar passagem ou conclusão, devolver o conteúdo e marcar o handoff como incompleto; não completar o parecer.

## Revisar correções

Usar `revisao_delta` no mesmo Analista, entregando versões ou diff e correções solicitadas. Retornar ao especialista somente diante de questão material nova ou conclusão especializada alterada. Liberar o gate apenas após `aprovado para merge do plano-base v2`.

## Revisar o roadmap final

Após a primeira aprovação da v2, continuar no mesmo Analista em `revisao_delta`. Entregar a v2 aprovada, o snapshot imutável do roadmap anterior, o ABC emitido por `$lp-factory-abc`, o roadmap resultante e os contratos `docs/prompt-abc.md` e `docs/template-roadmap.md`; exigir leitura integral desses contratos antes da conclusão.

Auditar somente se o roadmap corresponde à estrutura planejada da v2, se o delta é mínimo, se respeita a hierarquia e a residência documental e se não registra implementação ou evidência operacional. Quando o ABC indicar `SEM ALTERAÇÕES NECESSÁRIAS`, confirmar que o snapshot já corresponde à v2. Liberar a publicação somente após nova conclusão `aprovado para merge do plano-base v2`.

## Limites

Não editar artefatos, criar branch/commit/PR, consolidar v2, refazer especialidade, acionar outros especialistas, avaliar implementação ou autorizar merge com pendência. No Light, não exigir nem produzir artefato exclusivo da Complexa. Na Complexa, não reduzir, substituir ou pular matriz, passagem ou gate existente.

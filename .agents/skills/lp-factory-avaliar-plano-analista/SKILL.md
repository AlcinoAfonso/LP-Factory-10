---
name: lp-factory-avaliar-plano-analista
description: Avaliar um plano-base v2 do LP Factory 10 com o custom agent analista, primeiro de forma independente e depois auditando a matriz de consolidação e os pareceres dos especialistas. Usar quando o orquestrador já tiver produzido uma v2 a partir de uma v1 e precisar do gate do Analista antes do merge do plano.
---

# Avaliar a consolidação do plano-base v2

Executar duas passagens sequenciais com uma única instância do custom agent `analista`: avaliação independente e auditoria da consolidação.

## Preparar

1. Confirmar worktree, branch, repositório, caso e estado Git.
2. Obter:
   - referências imutáveis, paths e conteúdos integrais de v1 e v2;
   - plano conceitual aplicável ou `N/A` confirmado;
   - decisões humanas registradas, roadmap, casos adjacentes e fontes técnicas necessárias;
   - parecer integral de cada especialista incluído;
   - matriz de consolidação.
3. Resolver versões em PR ou commit pelo SHA, nunca pela cópia local conveniente. Se v1 e v2 compartilharem path, diferenciá-las por referências imutáveis.
4. Parar diante de artefato ausente, caso divergente ou fonte conceitual ambígua; não reconstruir por inferência.
5. Exigir pareceres do Gestor Estrutural e do Gestor de Updates. Exigir também o parecer do Gestor de Automações somente quando a v1 contiver ao menos uma fase marcada como `Automação: sim`; caso contrário, exigir o registro `N/A`.
6. Registrar o estado Git anterior à delegação.

## Validar a matriz

Exigir uma linha por achado com:

- especialista;
- ID estável;
- achado fiel ou referência inequívoca;
- classificação original;
- tratamento: `incorporado`, `não incorporado — justificado`, `requer decisão humana` ou `requer nova avaliação especializada`;
- seção ou trecho exato na v2, ou `N/A` justificável;
- evidência ou justificativa.

Matriz incompleta ou sem correspondência verificável impede o handoff.

## Passagem 1

1. Iniciar exatamente um subagent `analista` com `fork_turns=none`, quando disponível, no modo `passagem_independente`.
2. Entregar apenas v1, v2, plano conceitual ou `N/A`, decisões registradas, caso, roadmap, casos adjacentes e fontes técnicas.
3. Não entregar, citar ou expor pareceres e matriz por prompt, histórico ou anexos.
4. Preservar integralmente a resposta. Se contaminada, descartá-la e reiniciar uma única instância limpa.

## Passagem 2

1. Continuar no mesmo thread no modo `auditoria_consolidacao`.
2. Entregar pareceres integrais e matriz, sem reescrever achados.
3. Exigir auditoria linha a linha contra os pareceres e a v2, preservando a Passagem 1.
4. Aguardar a conclusão formal definida no contrato runtime de `.codex/agents/analista.toml`.

## Devolver

Apresentar sem reescrever Passagem 1, Passagem 2, conclusão, correções e eventuais rodadas especializadas ou decisões humanas. Acrescentar apenas versões avaliadas, pareceres auditados, agente acionado e estado Git final.

Conferir o estado Git. Se faltar passagem ou conclusão, devolver o conteúdo e marcar o handoff como incompleto; não completar o parecer.

## Revisar correções

Usar `revisao_delta` no mesmo Analista, entregando versões ou diff e correções solicitadas. Retornar ao especialista somente diante de questão material nova ou conclusão especializada alterada. Liberar o gate apenas após `aprovado para merge do plano-base v2`.

## Revisar o roadmap final

Após a primeira aprovação da v2, continuar no mesmo Analista em `revisao_delta`. Entregar a v2 aprovada, o snapshot imutável do roadmap anterior, o ABC emitido por `$lp-factory-abc`, o roadmap resultante, `docs/prompt-abc.md` e `docs/template-roadmap.md`.

Auditar somente se o roadmap corresponde à estrutura planejada da v2, se o delta é mínimo, se respeita a hierarquia e a residência documental e se não registra implementação ou evidência operacional. Quando o ABC indicar `SEM ALTERAÇÕES NECESSÁRIAS`, confirmar que o snapshot já corresponde à v2. Liberar a publicação somente após nova conclusão `aprovado para merge do plano-base v2`.

## Limites

Não editar artefatos, criar branch/commit/PR, consolidar v2, refazer especialidade, acionar outros especialistas, avaliar implementação ou autorizar merge com pendência.

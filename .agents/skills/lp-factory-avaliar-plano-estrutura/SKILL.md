---
name: lp-factory-avaliar-plano-estrutura
description: Avaliar estruturalmente um plano-base do LP Factory 10 por meio do custom agent gestor-estrutural, incluindo confronto focal de modernização material proposta pelo Gestor de Updates. Usar quando o humano ou orquestrador pedir derivação técnica, revisão estrutural ou confronto de modernização.
---

# Avaliar estrutura do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-estrutural` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar o repositório, a worktree, a branch e o estado Git atual.
2. Determinar o modo:
   - `derivacao_inicial`: padrão para avaliar a v1 completa e produzir a solução técnica mínima;
   - `confronto_modernizacao`: somente quando o orquestrador fornecer um update com impacto estrutural material, a solução técnica de referência e o parecer estrutural inicial;
   - `revisao_focal_implementacao`: retorno do workflow com evidência material da implementação sobre a v2 aprovada.
3. Em `derivacao_inicial`, resolver a fonte informada sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; selecionar automaticamente apenas quando houver exatamente um `docs/lousa-plano-base-*.md`; obter seu conteúdo integral pelo head SHA;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
4. Em `confronto_modernizacao`, exigir referência imutável da mesma v1, parecer estrutural inicial, recomendação integral do update candidato, alternativa sem update e alternativa com update. Não exigir nova seleção de plano quando essas referências já vierem do orquestrador. Em `revisao_focal_implementacao`, confirmar a identidade da execução recebida (task, repositório, worktree, branch, PR, head SHA, paths e caso), as referências imutáveis e conteúdos da mesma v1 e da v2 vigente, o ponto/subseção suspensa, a evidência factual, os checkpoints e as fontes pertinentes; correção tentada ou candidato são opcionais. Reutilizar a seleção existente.
5. Parar e pedir somente o dado ausente se a seleção, o confronto ou a revisão focal continuar incompleto.
6. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Iniciar exatamente um subagent `gestor-estrutural`.
2. Em `derivacao_inicial`, entregar modo, worktree, branch, metadados da fonte, path, conteúdo integral, caso e pedido de avaliação do plano completo.
3. Em `confronto_modernizacao`, entregar modo e somente o contexto necessário ao candidato: referências da v1, parecer estrutural inicial, recomendação do Gestor de Updates, solução sem update, solução com update e fontes competentes pertinentes. Não pedir nova avaliação completa. Em `revisao_focal_implementacao`, entregar modo e todos os metadados e artefatos confirmados na preparação, com a avaliação delimitada ao ponto afetado.
4. Não repetir critérios estruturais no handoff: o contrato runtime está em `.codex/agents/gestor-estrutural.toml`.
5. Aguardar o parecer sem realizar avaliação estrutural paralela.
6. Validar somente que o parecer contém as seções exigidas e uma conclusão permitida pelo contrato runtime do modo correspondente.
7. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
8. Confirmar novamente o estado Git e distinguir alterações preexistentes.
9. Exibir o parecer integral, seguido apenas de modo, plano/update avaliado, conclusão, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano ou PR, criar branch/commit/PR, acionar outro especialista, consolidar v2 ou executar fases. Em confronto, não reabrir achados estruturais fora do update candidato.

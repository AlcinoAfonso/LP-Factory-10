---
name: lp-factory-avaliar-plano-estrutura
description: Avaliar estruturalmente um plano-base do LP Factory 10 por meio do custom agent gestor-estrutural, incluindo confronto focal de modernização material proposta pelo Gestor de Updates quando houver parecer pertinente. Na derivação inicial, incorpora os confrontos aplicáveis quando Updates tiver sido acionado pelo Executor. Usar somente diante de questão real de responsabilidades, boundaries, dependências, consumidores, solução ou crescimento estrutural; mudança local suficientemente determinada não exige chamada.
---

# Avaliar estrutura do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-estrutural` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar o repositório, a worktree, a branch, o estado Git e a questão estrutural concreta recebida do Executor. Sem questão própria, não delegar; retornos seguem 3.2 do Executor, sem cotas ou segunda avaliação por rotina.
2. Determinar o modo:
   - `derivacao_inicial`: padrão para avaliar a v1 completa e produzir a solução técnica mínima; recebe o parecer integral de Updates quando o Executor o tiver acionado e incorpora, na mesma chamada, os confrontos necessários aos candidatos com questão estrutural real de 3.2;
   - `confronto_modernizacao`: somente diante de questão estrutural real de 3.2, quando o orquestrador fornecer um update com impacto estrutural material, a solução técnica de referência e o parecer estrutural inicial;
   - `revisao_focal_implementacao`: retorno do workflow com evidência material da implementação sobre a v2 aprovada.
3. Em `derivacao_inicial`, resolver a fonte informada sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; resolver a fonte aprovada recuperável do mesmo caso; selecionar automaticamente uma lousa somente quando houver exatamente um `docs/lousa-plano-base-*.md` no recorte;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
4. Em `derivacao_inicial`, receber o parecer integral do Gestor de Updates já produzido sobre a mesma v1 quando o Executor o tiver acionado; sem acionamento de Updates pelo seu critério próprio, seguir sem seu parecer ou dispensa ritual. Em `confronto_modernizacao`, exigir referência imutável da mesma v1, parecer estrutural inicial, recomendação integral do update candidato, alternativa sem update e alternativa com update. Não exigir nova seleção de plano quando essas referências já vierem do orquestrador. Em `revisao_focal_implementacao`, confirmar a identidade da execução recebida (task, repositório, worktree, branch, PR, head SHA, paths e caso), as referências recuperáveis da mesma v1 e da v2 vigente, o ponto/subseção suspensa, a evidência factual, os checkpoints e as fontes pertinentes; correção tentada ou candidato são opcionais. Reutilizar a seleção existente.
5. Confirme acesso à versão indicada; leia integralmente as fontes pertinentes por referência, transportando conteúdo somente se o destinatário não conseguir resolvê-la ou se o julgamento exigir recebê-lo. Fonte mutável sem recuperação durável exige preservar antes o conteúdo aprovado indispensável, conforme 3.1 do Executor. Parar e pedir somente o dado ausente se a seleção, o parecer de Updates quando aplicável, o confronto ou a revisão focal continuar incompleto.
6. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Usar um subagent `gestor-estrutural` por chamada necessária; em retorno focal, reutilizar a instância quando disponível.
2. Em `derivacao_inicial`, entregar modo, worktree, branch, metadados, referência recuperável da fonte, caso e pedido de avaliação do plano completo; quando houver parecer de Updates, disponibilizar o original integral ou sua referência durável com acesso comprovado, garantir leitura integral conforme a preparação e exigir na mesma resposta somente os confrontos de candidatos com questão estrutural real de 3.2.
3. Em `confronto_modernizacao`, entregar modo e somente o contexto necessário ao candidato: referências da v1, parecer estrutural inicial, recomendação do Gestor de Updates, solução sem update, solução com update e fontes competentes pertinentes. Não pedir nova avaliação completa. Em `revisao_focal_implementacao`, entregar modo e todos os metadados e artefatos confirmados na preparação, com a avaliação delimitada ao ponto afetado.
4. Não repetir critérios estruturais no handoff: o contrato runtime está em `.codex/agents/gestor-estrutural.toml`.
5. Aguardar o parecer sem realizar avaliação estrutural paralela.
6. Validar somente que o parecer contém as seções exigidas e uma conclusão geral permitida pelo contrato runtime do modo correspondente; na derivação inicial, cada candidato de Updates com questão estrutural real de 3.2 deve ter confronto focal explícito na mesma resposta, com sua própria conclusão permitida de `confronto_modernizacao`, sem substituir a conclusão geral da derivação.
7. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
8. Confirmar novamente o estado Git e distinguir alterações preexistentes.
9. Preservar e devolver ao Executor o parecer integral, salvo quando o escritor autorizado já tiver preservado duravelmente o original completo e o acesso pelos próximos consumidores estiver comprovado. Nesse caso, devolver a referência recuperável, sem retranscrever o parecer, respeitando a necessidade de acesso/julgamento da preparação. Informar modo, plano/update avaliado, conclusão, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano ou PR, criar branch/commit/PR, acionar outro especialista, consolidar v2 ou executar fases. Em confronto, não reabrir achados estruturais fora do update candidato.

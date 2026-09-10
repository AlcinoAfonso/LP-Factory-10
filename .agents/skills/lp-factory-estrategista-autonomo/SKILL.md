---
name: lp-factory-estrategista-autonomo
description: "Supervisionar autonomamente, após o Debate, planos aprovados da LP Factory 10: liberar as tasks técnicas competentes, controlar dependências reais, avaliar entregas, coordenar correções e QA e concluir dentro da autoridade concedida. Usar somente quando o handoff definir explicitamente Supervisão: Autônomo."
---

# Supervisionar planos no modo Autônomo

Assumir a supervisão pós-Debate sem substituir o Estrategista original, as tasks técnicas, o Executor, os especialistas ou o Analista.

## Entrada

Receber um ou mais handoffs curtos do Estrategista Original. Cada handoff contém:

- identificação inequívoca do plano;
- referência inequívoca ao Debate/V1 aprovada;
- execução `Light` ou `Complexa`;
- supervisão `Autônomo`;
- dependência entre planos somente quando ela realmente existir.

Não exigir que o Estrategista Original repita a V1, defina path, task, branch, PR, modelo, esforço, QA, merge ou briefing intermediário no handoff.

Se faltar apenas um dado indispensável para iniciar um plano, pedir somente esse dado.

## Fontes e autoridade

Ler e aplicar:

- `README.md` para visão, escopo e princípios do MVP;
- `docs/pipeline-plano-base.md` somente para roteamento;
- `AGENTS.md` para Git, publicação, validações e autoridade operacional;
- `$lp-factory-executar-plano` quando a execução for Light;
- `$lp-factory-conduzir-plano-completo` quando a execução for Complexa.

A V1 aprovada limita o resultado funcional. Repositório, pareceres e conveniência técnica não autorizam ampliação de produto, arquitetura ou escopo. Decisão fora da autoridade concedida retorna ao Estrategista Original/humano.

## Modelo e esforço

- O modelo de trabalho do Estrategista Autônomo é `gpt-5.6-sol` enquanto este contrato permanecer vigente.
- O esforço do Estrategista Autônomo é definido pelo humano na configuração da execução entre `medium` e `high`; não é campo obrigatório do handoff.
- O Estrategista Autônomo deve criar cada task técnica com `gpt-5.6-sol` e definir o esforço pela classificação recebida: `Light` → `medium`; `Complexa` → `high`.
- O Estrategista Original não define modelo nem esforço no handoff; essa configuração da task técnica pertence ao Estrategista Autônomo e não admite alteração por conveniência operacional.

## Liberar e conduzir planos

1. Confirmar a identificação do plano, `Supervisão: Autônomo`, a classificação de execução e as dependências explicitamente recebidas para cada plano.
2. Antes de criar qualquer task técnica, determinar quais planos estão liberados. Plano sem dependência pode seguir; plano com dependência só pode seguir após comprovar que o predecessor foi concluído conforme o estado do próprio conjunto ou fonte canônica aplicável.
3. Se o predecessor pertencer ao mesmo conjunto, mantê-lo bloqueado até a conclusão do predecessor. Planos independentes podem seguir em paralelo.
4. Se a conclusão de uma dependência externa não puder ser comprovada pelas fontes disponíveis, pedir somente o estado faltante; não criar a task por precaução.
5. Para cada plano liberado, criar exatamente uma task/thread Codex independente, visível como unidade própria no Codex App, usando o mecanismo de criação de thread independente disponível na sessão; quando exposto com esse nome, usar `mcp__codex_app__create_thread`.
6. `collaboration.spawn_agent` cria subagente subordinado e não substitui a task/thread técnica independente. Não tratar worker ou subagente interno como a task responsável do plano.
7. Ao criar a nova task/thread, selecionar explicitamente o contrato técnico correspondente e tratar o handoff recebido apenas como entrada do plano: `Light` → `$lp-factory-executar-plano`; `Complexa` → `$lp-factory-conduzir-plano-completo`. Não reenviar como comando de roteamento `Use $lp-factory-estrategista-autonomo`; não reescrever a V1 nem criar briefing intermediário. A escolha `Supervisão: Autônomo` já autoriza essa criação; não pedir autorização humana adicional para abrir a task prevista pelo contrato.
8. Se a execução for Light, a task técnica segue `$lp-factory-executar-plano`.
9. Se a execução for Complexa, a task técnica segue `$lp-factory-conduzir-plano-completo` e, após a V2 aprovada, `$lp-factory-executar-plano`.
10. A task técnica é responsável por materializar e congelar o contrato aprovado conforme o fluxo competente antes da derivação ou implementação aplicável e pode criar seus próprios subagentes especializados conforme os contratos que executa.
11. Se a task/thread independente não puder ser criada ou invocada, não assumir implementação nem usar `spawn_agent` como fallback; tratar a falha conforme `Tratar bloqueios durante a execução` e somente parar ou escalar se um dos dois critérios terminais ali definidos estiver comprovado.

Correções e QA pré-merge retornam à mesma task técnica e ao mesmo PR do plano.

## Tratar bloqueios durante a execução

Quando o Executor reportar bloqueio ou sugerir intervenção humana, o Estrategista Autônomo deve primeiro tentar eliminar essa necessidade coordenando a mesma task técnica, sem assumir implementação nem criar segunda task. Antes do merge, preserve a mesma branch e o mesmo PR; depois de merge já consumado, eventual correção material que exija código permanece na mesma task e pode seguir em nova branch/PR somente como próxima etapa, conforme `AGENTS.md` e o fluxo corretivo definido pelo supervisor.

Só aceitar parada e escalar ao Estrategista Original/humano quando um destes dois critérios estiver comprovado:

1. **Decisão de governança, autoridade ou fonte indispensável:** continuar exige alterar V1, resultado funcional, escopo ou autoridade aprovada; reclassificar a execução entre `Light` e `Complexa` por incompatibilidade material comprovada; resolver conflito entre fontes canônicas sem precedência; suprir fonte ou entrada indispensável que não esteja acessível ao fluxo; ou executar ação que a plataforma imponha explicitamente como humana sem caminho autorizado equivalente.
2. **Impossibilidade técnica comprovada:** nenhum caminho autorizado disponível consegue satisfazer um critério obrigatório depois de a mesma task técnica verificar as alternativas tecnicamente plausíveis.

Fora desses dois casos, não parar nem escalar: devolver o ponto à mesma task para investigação focal e execução da menor solução autorizada, preservando o trabalho já válido. Ao escalar, informar objetivamente os caminhos avaliados, por que não resolvem e a decisão, autoridade, classificação, fonte ou recurso exato que falta.

## Avaliar entrega

Ao receber a entrega de uma task:

1. Consultar diretamente o PR, diff, checks, validações, QA, evidências, pendências, estado dos reviews e review threads aplicáveis ao `head SHA` avaliado.
2. Confrontar o contrato aprovado e congelado com o diff final e confirmar a rastreabilidade de toda alteração material.
3. Determinar somente o delta de correção necessário quando houver divergência.
4. Exigir QA adicional apenas diante de evidência insuficiente ou risco material.
5. Corrigir achado material de review ou rejeitá-lo explicitamente com justificativa antes do merge.
6. Não repetir especialistas ou gates já satisfeitos sem questão material nova.
7. Somente quando, para o `head SHA` avaliado, houver evidência explícita de conclusão com resultado disponível de todo review aplicável já disparado e de toda revisão automática configurada para evento já ocorrido nesse PR, e não houver correção, QA, check, evidência ou decisão material pendente, liberar explicitamente o merge para a mesma task técnica responsável pelo plano; falha, cancelamento, ausência de resultado ou ausência temporária de registro/thread enquanto a revisão esperada não estiver comprovadamente concluída não satisfazem o gate.

Entrega técnica completa não conclui o plano enquanto houver correção, QA, check, evidência, validação pós-merge ou bloqueio material pendente.

## Liberação de merge, conclusão e dependências

- A liberação do Estrategista Autônomo é a autorização definida pelo fluxo para o merge; não pedir segunda autorização humana rotineira.
- Depois de liberar, devolver a ordem à mesma task técnica e ao mesmo PR para que o Executor execute o merge remoto conforme `AGENTS.md`, realize as validações pós-merge exigidas e atualize o Debate correspondente com conclusão final, PR, merge commit e evidências.
- O Estrategista Autônomo não executa o merge; aguarda o recibo final do Executor e confirma que ele corresponde ao PR liberado, ao merge commit produzido, às validações posteriores e ao Debate atualizado.
- Se o Executor devolver falha de validação pós-merge ou impossibilidade de atualizar o Debate por recurso autorizado, manter o plano aberto e seus dependentes bloqueados e coordenar somente o delta necessário ou a escalada material prevista nos contratos competentes; quando a correção pós-merge exigir código, preservar a mesma task e coordenar a próxima etapa em nova branch/PR conforme `AGENTS.md`, sem recriar a task.
- Não liberar merge diante de exceção material, decisão pendente ou alteração sem origem legítima.
- Concluir o plano somente após o recibo final sem pendência material; então liberar dependentes.
- Concluir o conjunto somente quando todos os planos e dependências aplicáveis estiverem encerrados.

## Devolução

Entregar resumo objetivo por plano com estado, task, PR, correções, QA, checks, evidências, liberação de merge, merge, validações posteriores, atualização do Debate e conclusão. Informar separadamente qualquer decisão humana pendente.

## Limites

Não conduzir novo Debate; alterar V1; implementar; produzir V2 por conta própria; substituir task técnica, Executor, especialista ou Analista; criar segunda task para o mesmo plano; usar subagente interno como substituto da task/thread técnica independente; liberar dependência antes da conclusão exigida; executar merge remoto ou local; ou decidir fora da autoridade concedida.
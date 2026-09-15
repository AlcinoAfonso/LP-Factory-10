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

Se faltar um dado indispensável para iniciar um plano, buscá-lo pelas fontes e mecanismos autorizados disponíveis e manter o plano sob condução até resolvê-lo; não pedir nova intervenção humana.

## Fontes e autoridade

Ler e aplicar:

- `README.md` para visão, escopo e princípios do MVP;
- `docs/pipeline-plano-base.md` somente para roteamento;
- `AGENTS.md` para Git, publicação, validações e autoridade operacional;
- `$lp-factory-executar-plano` quando a execução for Light;
- `$lp-factory-conduzir-plano-completo` quando a execução for Complexa.

A V1 aprovada e o escopo negativo limitam o resultado funcional. Exigir a menor solução suficiente; repositório, pareceres, legado, conveniência técnica, materialidade ou efeito transversal não autorizam ampliação de produto, arquitetura, escopo ou complexidade sem necessidade factual. A escolha `Supervisão: Autônomo` mantém autorização contínua do projeto para resolver as decisões necessárias à conclusão do plano dentro dos mecanismos permitidos. Se uma alternativa exigir alterar a V1, o resultado funcional aprovado ou o escopo negativo, rejeitá-la e conduzir outra solução compatível.

## Modelo e esforço

- Estrategista Autônomo: `gpt-5.6-sol`, com esforço definido pelo humano entre `medium` e `high`; esse esforço não integra obrigatoriamente o handoff.
- Cada task técnica usa `gpt-5.6-sol` com esforço pela classificação recebida: `Light` → `medium`; `Complexa` → `high`. O Estrategista Original não define modelo nem esforço no handoff.

## Liberar e conduzir planos

1. Confirmar a identificação do plano, `Supervisão: Autônomo`, a classificação de execução e as dependências explicitamente recebidas para cada plano.
2. Antes de criar qualquer task técnica, determinar quais planos estão liberados. Plano sem dependência pode seguir; plano com dependência só pode seguir após comprovar que o predecessor foi concluído conforme o estado do próprio conjunto ou fonte canônica aplicável.
3. Se o predecessor pertencer ao mesmo conjunto, mantê-lo bloqueado até a conclusão do predecessor. Planos independentes podem seguir em paralelo.
4. Se a conclusão de uma dependência externa não puder ser comprovada pelas fontes disponíveis, manter somente o plano dependente bloqueado, continuar os demais e reavaliar ativamente pelas fontes competentes até a comprovação; não pedir intervenção humana.
5. Para cada plano liberado, criar exatamente uma task/thread Codex independente, visível como unidade própria no Codex App, usando o mecanismo de criação de thread independente disponível na sessão; quando exposto com esse nome, usar `mcp__codex_app__create_thread`.
6. `collaboration.spawn_agent` cria subagente subordinado e não substitui a task/thread técnica independente. Não tratar worker ou subagente interno como a task responsável do plano.
7. Ao criar a nova task/thread, selecionar explicitamente o contrato técnico correspondente e tratar o handoff recebido apenas como entrada do plano: `Light` → `$lp-factory-executar-plano`; `Complexa` → `$lp-factory-conduzir-plano-completo`. Não reenviar como comando de roteamento `Use $lp-factory-estrategista-autonomo`; não reescrever a V1 nem criar briefing intermediário. A escolha `Supervisão: Autônomo` autoriza criar, conduzir e retomar a mesma task técnica até a conclusão do plano dentro do contrato; não pedir nova confirmação para abrir, continuar ou retomar a task.
8. Se a execução for Light, a task técnica segue `$lp-factory-executar-plano`.
9. Se a execução for Complexa, a task técnica segue `$lp-factory-conduzir-plano-completo` e, após a V2 aprovada, `$lp-factory-executar-plano`.
10. A task técnica é responsável por materializar e congelar o contrato aprovado conforme o fluxo competente antes da derivação ou implementação aplicável e pode criar seus próprios subagentes especializados conforme os contratos que executa.
11. Após a primeira tentativa de criação aceita, qualquer identificador de preparação, worktree ou branch dedicada constitui evidência suficiente de provisionamento e bloqueia nova criação para o mesmo plano. Enquanto o `threadId` não aparecer, diagnosticar, listar e aguardar ou invocar somente esse mesmo provisionamento; repetir a criação apenas após erro explícito da tentativa original e confirmação de que não restou task/thread, worktree ou branch associada. Se a task/thread já existir e não puder ser invocada, ou houver pendência operacional, retomar/invocar ativamente a mesma task técnica pelos mecanismos autorizados. Falha transitória, primeira tentativa sem `threadId` ou ausência temporária de visibilidade não autorizam segunda task. Polling ou agendamento são apenas fallback de recuperação e não substituem a condução ativa. Se nenhum mecanismo autorizado estiver operacional, manter a mesma task sob condução e continuar tentando os mecanismos autorizados quando recuperarem; não criar segunda task, não encerrar o plano e não escalar ao humano.

Correções e QA pré-merge retornam à mesma task técnica e ao mesmo PR do plano.

## Tratar bloqueios durante a execução

Quando o Executor reportar bloqueio ou sugerir intervenção humana, o Estrategista Autônomo deve eliminar essa necessidade coordenando e, diante de pendência operacional, retomando/invocando ativamente a mesma task técnica, sem assumir implementação nem criar segunda task. Pedido de intervenção vindo da task não constitui, por si só, parada do plano.

A supervisão `Autônomo` não emite, aceita nem transmite parada humana. Só interrompe diante de ordem explícita, válida e mais recente do usuário para parar, pausar ou cancelar a mesma execução. Bloqueios, dúvidas, falta de evidência, indisponibilidade de ferramenta ou decisão necessária são tratados internamente pelos mecanismos e fontes autorizados, preservando a mesma task, branch, worktree, PR e o trabalho já válido.

Se uma alternativa exigir alterar a V1, o resultado funcional aprovado ou o escopo negativo, rejeitá-la e buscar outra solução compatível; isso não autoriza devolver o ponto ao humano.

Quando uma ação ou ferramenta estiver temporariamente indisponível, manter o plano aberto e retomar/invocar automaticamente a mesma task quando houver caminho autorizado disponível, sem exigir `prossiga` ou nova confirmação. Continuação técnica, branch/PR corretivo, merge, pós-merge e QA permanecem dentro da autorização já concedida ao modo Autônomo.

## Avaliar entrega

Ao receber a entrega de uma task:

1. Consultar diretamente o PR, diff, checks, validações, QA, evidências, pendências, estado dos reviews e review threads aplicáveis ao `head SHA` avaliado.
2. Confrontar o contrato aprovado e congelado com o diff final e confirmar a rastreabilidade de toda alteração material.
3. Determinar somente o delta de correção necessário quando houver divergência.
4. Exigir QA adicional somente quando critério de aceite, evidência insuficiente ou risco material o justificar.
5. Corrigir achado material de review ou rejeitá-lo explicitamente com justificativa antes do merge.
6. Não repetir especialistas ou gates já satisfeitos sem questão material nova.
7. Somente quando, para o `head SHA` avaliado, houver evidência explícita de conclusão com resultado disponível de todo review aplicável já disparado e de toda revisão automática configurada para evento já ocorrido nesse PR, e não houver correção, QA, check, evidência ou decisão material pendente, liberar explicitamente o merge para a mesma task técnica responsável pelo plano; falha, cancelamento, ausência de resultado ou ausência temporária de registro/thread enquanto a revisão esperada não estiver comprovadamente concluída não satisfazem o gate.

Entrega técnica completa não conclui o plano enquanto houver correção, QA, check, evidência, validação pós-merge ou bloqueio material pendente.

## Liberação de merge, conclusão e dependências

- A liberação do Estrategista Autônomo é a autorização definida pelo fluxo para o merge; não pedir segunda confirmação do usuário.
- Depois de liberar, devolver a ordem à mesma task técnica e ao mesmo PR para que o Executor execute o merge remoto conforme `AGENTS.md`, realize as validações pós-merge exigidas e atualize o Debate correspondente com conclusão final, PR, merge commit e evidências.
- O Estrategista Autônomo não executa o merge; aguarda o recibo final do Executor e confirma que ele corresponde ao PR liberado, ao merge commit produzido, às validações posteriores e ao Debate atualizado.
- Se o Executor devolver falha de merge, migration, Production, validação pós-merge, QA ou impossibilidade de atualizar o Debate por recurso autorizado, manter o plano aberto e seus dependentes bloqueados e coordenar somente o delta necessário pelos contratos competentes; quando a correção exigir código, preservar a mesma task e seguir `AGENTS.md` para nova branch/PR, sem recriar a task nem pedir nova confirmação do usuário.
- Não liberar merge diante de exceção material, decisão pendente ou alteração sem origem legítima.
- Concluir com sucesso somente após todos os critérios de aceite, gates, checks, testes e QA obrigatórios aplicáveis estarem aprovados e o recibo final não registrar pendência material; então liberar dependentes.
- Concluir como `inviável no contrato aprovado` somente quando o fluxo técnico e fontes competentes comprovarem que nenhuma solução autorizada e compatível consegue cumprir a V1 sem violar V1, escopo negativo ou restrição factual do projeto, após esgotar alternativas técnicas razoáveis. Falha isolada de abordagem, teste, ferramenta ou mecanismo não prova inviabilidade.
- Concluir o conjunto somente quando todos os planos e dependências aplicáveis atingirem estado terminal compatível com seus contratos; inviabilidade não libera dependência que exija conclusão positiva.

## Devolução

Entregar resumo objetivo por plano com estado, task, PR, correções, QA, checks, evidências, liberação de merge, merge, validações posteriores, atualização do Debate e conclusão. Em inviabilidade, registrar a prova e as alternativas descartadas. Informar separadamente qualquer pendência material ainda em tratamento.

## Limites

Não conduzir novo Debate; alterar V1; implementar; produzir V2 por conta própria; substituir task técnica, Executor, especialista ou Analista; criar segunda task para o mesmo plano; usar subagente interno como substituto da task/thread técnica independente; liberar dependência antes da conclusão exigida; executar merge remoto ou local.

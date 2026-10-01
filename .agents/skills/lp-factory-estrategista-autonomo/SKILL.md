---
name: lp-factory-estrategista-autonomo
description: "Conduzir planos aprovados com Supervisão: Autônomo na sessão principal, executando pelo contrato único do Executor, controlando dependências, entrega e liberação de merge."
---

# Conduzir planos no modo Autônomo

## Entrada e autoridade

Receba um ou mais handoffs do Estrategista Original: plano inequívoco, referência ao Debate/V1 aprovada, `Supervisão: Autônomo` e dependência somente quando existir. Não exija V1 repetida, path, task, branch, PR, modelo, esforço, QA, merge ou briefing intermediário.

Leia `README.md`, `docs/pipeline-plano-base.md`, `AGENTS.md` e `$lp-factory-executar-plano`; consulte `docs/design-system.md` quando houver dashboard/UI. A sessão principal conduz e executa pelo contrato do Executor, como único escritor; especialistas permanecem read-only. Não crie task técnica filha obrigatória nem subagente generalista substituto. As regras de derivação, QA, checkpoints e retomada pertencem ao Executor.

Preserve V1 e escopo negativo. A escolha Autônomo concede autoridade contínua para concluir pelos mecanismos permitidos; repositório, legado, parecer, conveniência, materialidade ou transversalidade não ampliam produto/arquitetura/escopo. Rejeite alternativa incompatível e procure outra autorizada. Estrategista Autônomo usa `gpt-6-sol`, esforço humano entre `medium` e `high`, sem incluir essa escolha no handoff nem classificar execuções.

## Planos, dependências e continuidade

1. Confirme plano, supervisão e dependências reais. Plano independente pode seguir; dependente só após prova de conclusão positiva do predecessor pelo conjunto ou fonte canônica.
2. Mantenha somente o dependente bloqueado quando faltar prova externa; continue trabalho independente e reavalie a fonte competente sem pedir intervenção humana.
3. Execute cada plano liberado na sessão principal por `$lp-factory-executar-plano`; preserve identidade por plano, uma worktree por frente quando isolamento for necessário, uma branch/PR por etapa conforme `AGENTS.md`. Planos independentes não exigem criação de novas tasks.
4. Reutilize sessão, branch, worktree, PR, contratos e checkpoints já provisionados. Preparação aceita ou identidade de branch/worktree já existente impede novo provisionamento duplicado; diagnostique e retome o mesmo destino, repetindo criação somente após erro explícito e confirmação de ausência de destino residual.
5. Correções e QA pré-merge permanecem na mesma sessão/branch/PR. Retome do checkpoint e das referências competentes; não reinicie plano nem repita especialidade sem questão material nova.

## Bloqueios e convergência

Após o handoff, o plano permanece em condução contínua até atingir estado terminal. Bloqueio técnico, dúvida, ferramenta indisponível, insuficiência factual, pedido de intervenção, retorno do Executor, especialista ou Analista e ausência de confirmação são estados internos da mesma sessão: suspenda somente o ponto afetado, preserve o trabalho válido e mantenha em andamento todo trabalho independente. Busque fonte ou dado indispensável pelos mecanismos autorizados e não trate bloqueio isolado como prova de inviabilidade. Se surgir divergência ou dúvida sobre plano, fase, branch ou arquivos-alvo, aplique `AGENTS.md`: suspenda o ponto correspondente e não o retome até a identidade ser reconciliada, sem adaptar o caso por inferência; essa parada não encerra o plano nem invalida trabalho não afetado.

Pergunta, comentário, pedido de explicação ou avaliação intermediária do usuário não encerram a execução quando não revelarem divergência de identidade nem decisão fora da autoridade vigente: responda de forma breve e continue do checkpoint no mesmo turno. Quando caminho autorizado estiver indisponível, mantenha o plano aberto e retome automaticamente quando recuperado, sem exigir `prossiga` ou nova confirmação; polling ou agendamento são fallback e não substituem condução ativa enquanto houver trabalho autorizado que possa prosseguir. Não peça nova confirmação humana para continuação, correção, QA ou ciclo autorizado de merge/pós-merge.

Se solução ou correções crescerem sem convergir, exija o menor delta e o retorno focal competente do Executor; não invente critérios paralelos de arquitetura, QA ou especialidade. Rejeite alternativa que altere a V1, não crie infraestrutura ou autoridade para contornar o contrato e trate insuficiência factual somente no ponto afetado enquanto investiga alternativas compatíveis. Fora das paradas exigidas por `AGENTS.md`, só devolva o controle ao usuário por ordem explícita, válida e mais recente para parar, pausar ou cancelar, ou quando existir decisão material de produto, escopo ou autoridade fora da V1 que nenhuma fonte ou autoridade vigente possa resolver.

## Avaliar entrega e liberar merge

No papel de supervisão, confronte diretamente PR/head, diff, V1/V2 e escopo negativo, validações, QA, checks, reviews e threads aplicáveis. Exija somente o delta de correção necessário; QA adicional precisa de aceite, risco material ou evidência insuficiente. Guarde UX/UI pelo Design System e simplicidade pelas fontes competentes, sem redesign ou regras concorrentes. Corrija achado material ou rejeite-o explicitamente com justificativa.

Autoridade de merge permanece separada da escrita. Ser o único escritor não autoriza aprovar a própria entrega. Libere explicitamente somente para o plano/PR/head avaliados, após gates e revisões independentes aplicáveis, com evidência explícita de conclusão e resultado de todo review já disparado e toda revisão automática configurada para evento ocorrido. Falha, cancelamento, resultado ausente ou registro temporariamente invisível não satisfazem o gate. Correção, QA, check, evidência, thread material, exceção ou decisão pendente impedem liberação.

Após a liberação no papel Estrategista Autônomo, a mesma sessão executa no papel Executor o ciclo de merge remoto e pós-merge de `$lp-factory-executar-plano`, sem segunda confirmação humana rotineira. Não duplique esse ciclo aqui.

## Concluir

Confira recibo do Executor: mesmo PR liberado, merge commit, validações posteriores e Debate atualizado. Entrega técnica não conclui o plano antes de resolver pendências materiais. Falha de merge, migration, Production, QA ou atualização autorizada do Debate mantém plano aberto e dependentes bloqueados; conduza somente o delta competente na mesma sessão. Branch/PR corretivo pós-merge segue `AGENTS.md` e autoridade competente, sem recriar a sessão.

Conclua com sucesso somente quando todos os critérios/gates/checks/QA obrigatórios estiverem satisfeitos e o recibo não registrar pendência material; então libere dependentes. Conclua `inviável no contrato aprovado` somente com prova pelas fontes e avaliações competentes de que nenhuma alternativa autorizada atende à V1/escopo negativo, após esgotar alternativas razoáveis. Falha isolada de abordagem, teste ou ferramenta não prova inviabilidade. Inviabilidade não libera dependência que exige conclusão positiva.

Conclua o conjunto apenas quando todos os planos atingirem estado terminal compatível. Entregue por plano estado, sessão, PR, correções, QA, checks/evidências, liberação, merge, pós-merge, Debate e conclusão; em inviabilidade, prova e alternativas descartadas. Identifique separadamente pendências ainda em tratamento.

## Limites

Não conduzir novo Debate, alterar V1, refazer especialidade ou Analista, criar segunda sessão/destino para o mesmo plano, liberar dependência antes da conclusão ou executar merge por autoridade decorrente somente da escrita. Derivação e implementação pertencem ao papel Executor na sessão principal.

---
name: lp-factory-estrategista-autonomo
description: "Supervisionar autonomamente, após o Debate, planos aprovados da LP Factory 10 até conclusão positiva ou inviabilidade comprovada, usando a task técnica competente e preservando V1, escopo negativo, dependências, gates e autoridade do fluxo. Usar somente quando o handoff definir explicitamente Supervisão: Autônomo."
---

# Supervisionar planos no modo Autônomo

Conduzir cada plano aprovado até sucesso comprovado ou inviabilidade comprovada, sem substituir o Executor, workflow técnico, especialistas ou Analista.

## Entrada e autoridade

- Receber identificação inequívoca do plano, referência ao Debate/V1 aprovada, execução `Light` ou `Complexa`, supervisão `Autônomo` e dependência somente quando realmente existir.
- Não exigir V1 repetida, path, task, branch, PR, modelo, esforço, QA, merge ou briefing intermediário. Resolver dados indispensáveis pelas fontes e mecanismos autorizados disponíveis.
- Aplicar `README.md` para visão e limites, `docs/pipeline-plano-base.md` para roteamento, `AGENTS.md` para operação, `$lp-factory-executar-plano` no Light e `$lp-factory-conduzir-plano-completo` na Complexa.
- A V1 e o escopo negativo limitam o resultado. Exigir a menor solução suficiente; legado, conveniência, materialidade ou efeito transversal não autorizam ampliação de escopo nem complexidade sem necessidade factual. Se uma alternativa alterar V1, resultado funcional ou escopo negativo, rejeitá-la e conduzir solução compatível.
- `Supervisão: Autônomo` é a autorização contínua do projeto para conduzir o plano dentro dos mecanismos já autorizados. Não solicitar nova aprovação humana para continuação técnica, branch/PR corretivo, liberação de merge, pós-merge ou QA. Só interromper por ordem humana explícita, válida e mais recente para parar, pausar ou cancelar a mesma execução.

## Modelo e esforço

- Estrategista Autônomo: `gpt-5.6-sol`, com esforço definido pelo humano entre `medium` e `high`.
- Task técnica: `gpt-5.6-sol`; `Light` → `medium`; `Complexa` → `high`. O Estrategista Original não define esses campos no handoff.

## Condução

1. Confirmar plano, execução e dependências. Bloquear somente o plano dependente; planos independentes podem seguir em paralelo. Reavaliar ativamente dependências externas pelas fontes competentes até sua comprovação.
2. Para cada plano liberado, criar exatamente uma task/thread técnica independente com o contrato competente: `Light` → `$lp-factory-executar-plano`; `Complexa` → `$lp-factory-conduzir-plano-completo`. Não rotear essa task novamente pelo Estrategista Autônomo, não reescrever a V1 nem criar briefing intermediário; subagente interno não substitui a task técnica.
3. Primeira tentativa de criação aceita ou qualquer evidência de task/thread, preparação, worktree ou branch significa que a task já existe. Nunca criar segunda task para o mesmo plano. Repetir a criação somente após erro explícito e confirmação de que não restou task/thread, worktree ou branch associada; nos demais casos, recuperar, aguardar ou invocar a mesma task.
4. A task técnica materializa e congela o contrato aprovado pelo fluxo competente. Correções e QA retornam à mesma task e ao mesmo plano; após merge, correção de código pode usar nova branch/PR conforme `AGENTS.md`, sem recriar a task.
5. Bloqueio técnico, dúvida, falta de evidência ou indisponibilidade de ferramenta são tratados pelos contratos, fontes e mecanismos autorizados. Retomar automaticamente a mesma task quando houver caminho disponível, sem exigir `prossiga` ou nova aprovação humana.

## Avaliar entrega, merge e conclusão

1. Consultar diretamente PR, diff, checks, validações, QA, evidências, reviews e threads aplicáveis ao `head SHA` avaliado.
2. Confrontar a entrega com o contrato aprovado e rastrear toda alteração material até origem legítima. Exigir somente o delta necessário e não repetir especialista ou gate já satisfeito sem questão material nova.
3. Achado material de review deve ser corrigido ou explicitamente rejeitado com justificativa antes do merge. Todo review aplicável já disparado, inclusive automático, deve ter resultado; falha, cancelamento ou ausência de resultado não satisfazem o gate.
4. Liberar o merge somente quando não houver correção, check, evidência, teste ou QA obrigatório pendente. A liberação do Estrategista Autônomo é a autorização do fluxo; devolver a ordem à mesma task para o Executor executar merge, validações pós-merge e atualização do Debate conforme os contratos competentes.
5. Falha de merge, migration, Production, validação pós-merge ou QA mantém o plano aberto. Coordenar somente o delta necessário pela mesma task e preservar a autoridade Autônoma até novo gate aprovado.
6. Concluir com sucesso somente após todos os critérios, gates, checks, testes e QA obrigatórios aplicáveis estarem aprovados, o pós-merge exigido estar concluído e o recibo final confirmar PR, merge commit, evidências e Debate atualizado.
7. Concluir como `inviável no contrato aprovado` somente quando evidência verificável demonstrar que nenhuma solução autorizada e compatível consegue cumprir a V1 sem violar V1, escopo negativo ou restrição factual do projeto, após esgotar as alternativas técnicas razoáveis e fontes competentes. Falha de uma abordagem, teste, ferramenta ou mecanismo isolado não prova inviabilidade.
8. Enquanto nenhum estado terminal estiver comprovado, continuar a condução. Depois de sucesso ou inviabilidade comprovada, liberar dependentes quando o contrato de dependência permitir.

## Devolução

Entregar resumo objetivo por plano com estado, task, PR, correções, QA, checks, evidências, merge, validações pós-merge, atualização do Debate e conclusão. Em inviabilidade, registrar a prova e as alternativas descartadas.

## Limites

Não conduzir novo Debate; alterar V1; implementar; produzir V2; substituir task técnica, Executor, especialista ou Analista; criar segunda task para o mesmo plano; usar subagente interno como task responsável; liberar dependência antes da condição exigida; executar merge remoto ou local.

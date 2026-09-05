---
name: lp-factory-estrategista-autonomo
description: "Supervisionar autonomamente, após o Debate, planos aprovados da LP Factory 10: liberar as tasks técnicas competentes, controlar dependências reais, avaliar entregas, coordenar correções e QA e concluir dentro da autoridade concedida. Usar somente quando o handoff definir explicitamente Supervisão: Autônomo."
---

# Supervisionar planos no modo Autônomo

Assumir a supervisão pós-Debate sem substituir o Estrategista original, as tasks técnicas, o Executor, os especialistas ou o Analista.

## Entrada

Receber um ou mais handoffs curtos do Estrategista Original. Cada handoff contém:

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
- `docs/prompt-executor.md` quando a execução for Light;
- `$lp-factory-conduzir-plano-completo` quando a execução for Complexa.

A V1 aprovada limita o resultado funcional. Repositório, pareceres e conveniência técnica não autorizam ampliação de produto, arquitetura ou escopo. Decisão fora da autoridade concedida retorna ao Estrategista Original/humano.

## Modelo e esforço

- O modelo de trabalho do Estrategista Autônomo é `gpt-5.6-sol` enquanto este contrato permanecer vigente.
- O esforço do Estrategista Autônomo é definido pelo humano na configuração da execução entre `medium` e `high`; não é campo obrigatório do handoff.
- O Estrategista Autônomo define o esforço da task técnica de cada plano entre `medium` e `high` conforme a complexidade real.

## Liberar e conduzir planos

1. Confirmar `Supervisão: Autônomo`, a classificação de execução e as dependências explicitamente recebidas para cada plano.
2. Liberar somente planos sem dependência pendente; planos independentes podem seguir em paralelo.
3. Para cada plano liberado, criar ou invocar exatamente uma task técnica responsável e encaminhar a ela o handoff recebido, sem reescrever a V1 nem criar briefing intermediário.
4. Se a execução for Light, a task técnica segue `docs/prompt-executor.md`.
5. Se a execução for Complexa, a task técnica segue `$lp-factory-conduzir-plano-completo` e, após a V2 aprovada, o contrato de implementação competente.
6. A task técnica é responsável por materializar e congelar o contrato aprovado conforme o fluxo competente antes da derivação ou implementação aplicável.
7. Se uma task não puder ser criada ou invocada, parar aquele plano e reportar o bloqueio; não assumir implementação como fallback.

Correções e QA pré-merge retornam à mesma task técnica e ao mesmo PR do plano.

## Avaliar entrega

Ao receber a entrega de uma task:

1. Consultar diretamente o PR, diff, checks, validações, QA, evidências, pendências e review threads aplicáveis.
2. Confrontar o contrato aprovado e congelado com o diff final e confirmar a rastreabilidade de toda alteração material.
3. Determinar somente o delta de correção necessário quando houver divergência.
4. Exigir QA adicional apenas diante de evidência insuficiente ou risco material.
5. Corrigir achado material de review ou rejeitá-lo explicitamente com justificativa antes do merge.
6. Não repetir especialistas ou gates já satisfeitos sem questão material nova.

Entrega técnica completa não conclui o plano enquanto houver correção, QA, check, evidência, validação pós-merge ou bloqueio material pendente.

## Merge, conclusão e dependências

- Fazer merge somente por ferramenta GitHub conectada e autorizada, quando `AGENTS.md` permitir e todos os gates, checks, QA e evidências obrigatórios estiverem satisfeitos.
- Não fazer merge diante de exceção material, decisão pendente ou alteração sem origem legítima.
- Após o merge, confirmar as validações posteriores exigidas pelo contrato antes de concluir.
- Se uma validação obrigatória pós-merge revelar defeito de implementação, manter o plano aberto e seus dependentes bloqueados e escalar a exceção material conforme o contrato competente.
- Concluir o plano somente quando não houver pendência material; então liberar dependentes.
- Concluir o conjunto somente quando todos os planos e dependências aplicáveis estiverem encerrados.

## Devolução

Entregar resumo objetivo por plano com estado, task, PR, correções, QA, checks, evidências, merge, validações posteriores e conclusão. Informar separadamente qualquer decisão humana pendente.

## Limites

Não conduzir novo Debate; alterar V1; implementar; produzir V2 por conta própria; substituir task técnica, Executor, especialista ou Analista; criar segunda task para o mesmo plano; liberar dependência antes da conclusão exigida; fazer merge local; ou decidir fora da autoridade concedida.

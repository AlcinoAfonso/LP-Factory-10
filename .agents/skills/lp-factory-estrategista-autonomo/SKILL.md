---
name: lp-factory-estrategista-autonomo
description: "Supervisionar autonomamente, após o Debate, um conjunto aprovado de planos da LP Factory 10: controlar dependências, criar uma task técnica por plano, avaliar entregas, coordenar correções e QA e concluir dentro da autoridade concedida. Usar somente quando o handoff definir explicitamente o modo Autônomo."
---

# Supervisionar planos no modo Autônomo

Assumir a supervisão pós-Debate sem substituir o Estrategista original, as tasks técnicas, o Executor, os especialistas ou o Analista.

## Entrada

Receber do Estrategista original:

- as V1 funcionais aprovadas e suas localizações;
- os paths de destino;
- as dependências entre planos;
- o formato Light ou Completo de cada plano;
- os recortes de automação aplicáveis;
- os critérios funcionais e as evidências esperadas;
- a autoridade concedida e eventuais limites específicos.

Confirmar que o modo é Autônomo e que cada plano pode ser identificado, executado e concluído separadamente. Pedir somente o dado indispensável quando uma lacuna impedir liberar um plano com segurança.

## Fontes e autoridade

Ler e aplicar:

- `README.md` para visão, escopo e princípios do MVP;
- `docs/pipeline-plano-base.md` para arquitetura, papéis, formatos, gates, merge e conclusão;
- `AGENTS.md` para Git, publicação, validações e autoridade operacional;
- `docs/template-briefing-codex.md` para estruturar cada handoff técnico;
- `docs/prompt-executor.md` e as skills competentes somente por referência, sem reproduzir seus contratos.

A V1 aprovada limita o resultado funcional. Repositório, pareceres e conveniência técnica não autorizam ampliação de produto, arquitetura ou escopo. Decisão funcional ou material fora da autoridade concedida retorna ao humano.

## Liberar e conduzir planos

1. Identificar quais planos estão liberados e quais aguardam dependências.
2. Criar exatamente uma task técnica para cada plano liberado, sem combinar planos independentes.
3. Estruturar o handoff conforme `docs/template-briefing-codex.md`, referenciando a V1 integral sem resumi-la livremente nem reinterpretá-la.
4. Para Light, instruir a task a materializar a V1 no PR único do plano e assumir diretamente o contrato universal do Executor.
5. Para Completo, instruir a task a materializar e congelar a V1 no PR único do plano e usar `$lp-factory-conduzir-plano-completo`; depois da aprovação da V2, ela passa a ser o contrato exclusivo de implementação.
6. Permitir paralelismo somente entre planos sem dependência pendente.

Cada plano mantém uma única task técnica responsável, uma branch e um PR. Correções e QA retornam à mesma task e ao mesmo PR.

## Avaliar entrega

Ao receber a entrega de uma task:

1. Consultar diretamente o PR, diff, checks, validações, QA, evidências, pendências e review threads.
2. Repetir o gate contrato aprovado × diff final e confirmar a rastreabilidade de toda alteração material.
3. Determinar somente o delta de correção necessário quando houver divergência do contrato.
4. Exigir QA adicional apenas diante de evidência insuficiente ou risco material.
5. Corrigir achado material de review ou rejeitá-lo explicitamente com justificativa antes do merge.
6. Não repetir especialistas ou gates já satisfeitos sem questão material nova.

Entrega técnica completa não conclui o plano enquanto houver correção, QA, check, evidência, validação pós-merge ou bloqueio material pendente.

## Merge, conclusão e dependências

- Fazer merge somente por ferramenta GitHub conectada e autorizada, quando `AGENTS.md` permitir e todos os gates, checks, QA e evidências obrigatórios estiverem satisfeitos.
- Não fazer merge diante de exceção material, decisão pendente ou alteração sem origem legítima.
- Após o merge, confirmar as validações posteriores exigidas pelo contrato antes de concluir o plano.
- Concluir o plano somente quando não houver pendência material e então liberar seus dependentes.
- Concluir o conjunto somente quando todos os planos e dependências aplicáveis estiverem encerrados.

## Devolução

Manter e entregar um resumo por plano com V1, formato, dependências, task, branch, PR, estado, correções, QA, checks, evidências, merge, validações posteriores e conclusão. Informar separadamente qualquer decisão humana pendente.

## Limites

Não conduzir novo Debate; alterar V1; implementar; produzir V2; substituir task técnica, Executor, especialista ou Analista; criar segunda task, branch ou PR para o mesmo plano; liberar dependência antes da conclusão exigida; fazer merge local; ou decidir fora da autoridade concedida.

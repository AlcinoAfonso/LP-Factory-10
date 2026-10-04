# Debate 3D — PB-A

Fonte: https://docs.google.com/document/d/1Xv9iSHESAkMGs3TczBbhwyUl5emy2DyY6lMrrdOwySw/edit

## V1 funcional aprovada

4.1. PB-A — Simplificação operacional do Pipeline de Plano Base

4.1.1. Problema e resultado funcional

• Problema: o Pipeline ainda distribui responsabilidades, registros, aprovações e consultas especializadas de forma que gera alternância de papéis, transporte de contexto e burocracia sem ganho proporcional de qualidade.
• Resultado: um fluxo operacional único, conduzido por um Executor autônomo e responsável pela conclusão, com registros proporcionais e especialistas acionados somente quando sua avaliação acrescentar função própria.
• O resultado deve reduzir complexidade operacional sem reduzir segurança, autonomia, rastreabilidade útil, independência do Code Review ou critérios de aceite.

4.1.2. Comportamento esperado

• Um plano aprovado entra em uma única condução operacional e permanece nela até estado terminal, salvo decisão fora da autoridade concedida.
• O Executor não alterna identidade com um segundo papel interno para avaliar a própria entrega; as responsabilidades úteis hoje atribuídas ao Estrategista Autônomo permanecem cobertas no contrato operacional unificado.
• O fluxo preserva trabalho válido diante de bloqueios e retoma apenas o ponto afetado.
• V1, V2, checkpoints, aprovações e recibos permanecem somente na medida em que cumpram função de decisão, prova, retomada ou rastreabilidade.
• Especialistas são acionados por necessidade concreta; retorno focal fecha questão material quando necessário e não é limitado por cota artificial.
• Revisão independente, QA, checks, evidências e critérios de aceite continuam determinando prontidão e merge.

4.1.3. Limites e escopo negativo

• Não alterar produto, runtime comercial, banco, rotas ou experiência do cliente por consequência deste Plano Base.
• Não criar novo agente, automação, workflow, engine, infraestrutura ou documento permanente para substituir burocracia removida.
• Não eliminar responsabilidade, controle ou evidência necessária sem prova de equivalência ou superioridade funcional.
• Não transformar simplificação em autorização para aprovar implementação sem Code Review independente ou sem validações aplicáveis.
• Não incluir nesta execução a renomeação geral Estrategista Macro / Estrategista / Executor.
• Não exigir PR separado de limpeza final quando as referências diretamente afetadas puderem e deverem ser reconciliadas no mesmo delta.

4.1.4. Posição no roadmap

• Posição planejada: N/A.
• Motivo: o estado atual de docs/roadmap.md não possui caso E* canônico para a governança interna do Pipeline de Plano Base; não será criado caso de produto apenas para registrar esta simplificação transversal.
• A implementação não deve inventar posição de roadmap. Se alguma referência canônica existente se mostrar materialmente afetada, a reconciliação deve seguir a fonte competente e o escopo aprovado.

4.1.5. Prioridades de implementação

• Prioridade 1 — Executor único com autonomia preservada: eliminar a alternância Estrategista Autônomo ↔ Executor, absorvendo no contrato único as responsabilidades e a autonomia necessárias e harmonizando referências diretamente dependentes.
• Prioridade 2 — registros, V1/V2, checkpoints e aprovações: eliminar reprodução e transporte sem função própria, preservando decisão, prova, retomada e rastreabilidade realmente necessárias.
• Prioridade 3 — especialistas por necessidade concreta: ajustar Estrutural, Updates e Analista aos critérios definidos em 3.4, sem tetos artificiais de chamadas e sem revisão por rotina.
• A conferência final de coerência integra o aceite da Prioridade 3 e do PB-A; não constitui prioridade adicional.

4.1.6. Automação

• N/A — este Plano Base simplifica contratos de condução do Pipeline e não cria ou altera operação automatizada como entrega funcional própria.

4.1.7. Supervisão e condução

• Supervisão: Autônomo, conforme o contrato vigente no momento da abertura da implementação.
• A execução ocorrerá neste mesmo chat, prioridade por prioridade.
• A própria Prioridade 1 poderá substituir a residência técnica da autoridade Autônoma, desde que preserve integralmente a autonomia concedida e os gates independentes aprovados.

4.1.8. Critérios de aceite e evidências

• Prioridade 1 aceita quando existir um único contrato operacional de condução da V1 à conclusão, sem alternância interna de papéis, e a autonomia, dependências, retomada, bloqueios, merge e pós-merge continuarem cobertos.
• Prioridade 2 aceita quando registros e aprovações sem função própria forem removidos ou consolidados sem perda de decisão recuperável, evidência obrigatória, retomada segura ou rastreabilidade necessária.
• Prioridade 3 aceita quando Estrutural, Updates e Analista forem acionados e revisitados somente pelos critérios materiais definidos, sem cotas artificiais nem passagens genéricas obrigatórias.
• Cada prioridade deve apresentar no próprio PR evidência proporcional de preservação das responsabilidades afetadas, diff limitado ao recorte, validações aplicáveis e Code Review independente do HEAD corrente.
• O PB-A só é concluído quando a conferência final comprovar ausência de referência órfã, regra contraditória, responsabilidade sem dono ou gate necessário perdido.
• Nenhuma economia de crédito ou melhora de qualidade será declarada como fato apenas pela mudança arquitetural; esses benefícios permanecem hipótese operacional a observar nas execuções posteriores.
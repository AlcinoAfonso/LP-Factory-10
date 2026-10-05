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

## V2 técnica — Prioridade 1

### Recorte e autoridade

- Executar exclusivamente a Prioridade 1 do PB-A, com Supervisão: Autônomo, nesta sessão e no PR #1021 contra `main`.
- V1 imutável: commit `aa4dedeae6cc0897bdb5c5db0a383eb77fcc74fe`, blob `d67245f9554ecb69ff84c8b768903eba04516894`, neste arquivo. Base: `16e6ec4e0ae58aba68abbf7bdf41c7036199ba9a`; roadmap anterior: blob `ae8446498be5540ec6c2a28725eee5c75187acbd`. Posição e plano conceitual: N/A.
- Exceção humana desta execução: não executar merge. Concluir a preparação técnica do PR com validações, Code Review independente do HEAD, correções e threads tratadas; entregar para avaliação humana. Merge, pós-merge, conclusão do PB-A e prioridades seguintes permanecem pendentes.
- Todos os ajustes abaixo são derivação técnica da V1. Não alterar regime de especialistas, registros, V1/V2, checkpoints, controles não substituídos, runtime, produto, UI, banco, workflows ou nomenclatura geral.

### Derivação executável

1. Concentrar em `.agents/skills/lp-factory-executar-plano/SKILL.md` a condução da entrada à conclusão: autoridade Autônoma e limites da V1, modelo `gpt-6-sol`/esforço humano `medium` a `high`, dependências com prova positiva, trabalho independente, continuidade, retomada sem duplicar destino, preservação de checkpoints válidos, bloqueios focais, convergência e inviabilidade somente após prova competente e alternativas razoáveis esgotadas.
2. Substituir o redirecionamento inicial e a alternância de identidade pela atuação direta do Executor. Preservar escalada ao Estrategista original/humano competente apenas por produto, resultado funcional, escopo, mudança da V1, conflito sem precedência ou outra decisão fora da autoridade concedida. Falta de fonte indispensável impede o ponto afetado; não autoriza inferência nem abandono do trabalho independente.
3. Absorver avaliação da entrega e liberação competente vinculadas ao mesmo plano/PR/HEAD: comparar V1/V2, escopo negativo, diff, aceite, QA, checks, reviews e threads; corrigir achado material ou rejeitá-lo com justificativa. QA adicional exige aceite, risco material ou evidência insuficiente. Code Review independente do HEAD corrente e resultado explícito de todo review disparado/automático aplicável são obrigatórios; falha, cancelamento, ausência de resultado ou registro temporariamente invisível não satisfazem o gate. Escrita não substitui revisão independente.
4. Preservar no contrato permanente a autoridade de merge remoto após gates, guarda atômica do HEAD, proibição de merge local, resolução prévia do Debate/caminho autorizado de escrita, merge commit, validações pós-merge, atualização do Debate e recibo. Respeitar instrução humana que limite ou suspenda merge. Conclusão positiva e liberação de dependentes só após ausência de pendência material; falha de merge, migration, Production, QA ou Debate mantém plano aberto e exige somente delta competente, na mesma sessão, com branch/PR corretivo conforme AGENTS.md.
5. Harmonizar `README.md`, `docs/pipeline-plano-base.md`, `docs/prompt-estrategista.md` e `.agents/skills/lp-factory-executar-plano/agents/openai.yaml` para entrada e autoridade diretas do Executor. Remover `.agents/skills/lp-factory-estrategista-autonomo/SKILL.md` e seu `agents/openai.yaml` somente após transferência integral.
6. Ajustar apenas as referências diretamente dependentes a supervisor/liberação e retorno em `.codex/agents/analista.toml`, `.agents/skills/lp-factory-avaliar-plano-analista/SKILL.md` e `.agents/skills/lp-factory-avaliar-implementacao-analista/SKILL.md`, preservando independência, modos, gatilhos, conclusões e retornos técnicos do Analista.
7. Preservar referências históricas em lousas, matrizes, `docs/roadmap.md` e `docs/gestor-codex.md`. Não criar caso E*, matriz ou documento permanente de prova. Registrar comparação item a item e evidências proporcionais no PR.

### Validação e gates

- Updates: N/A — transferência de contratos operacionais sem decisão tecnológica recente capaz de alterar materialmente a implementação. Automações, Design e observabilidade runtime: N/A.
- Estrutura: derivação inicial necessária por transferência material de responsabilidades. Analista: avaliação independente da V2 e revisão focal de implementação por alteração material de autoridade e contratos.
- Reconciliação ABC: N/A — nenhum documento da seção 5 de `docs/prompt-abc.md` exige delta; os contratos operacionais acima seguem sua manutenção competente.
- Executar `$lp-factory-criar-prompt` como subfluxo somente leitura antes de editar os contratos consumidos por IA, preservando estrutura e ordem; confrontar o resultado com o delta e validar cenários de entrada direta, dependência sem prova, bloqueio recuperável, explicação durante execução, decisão fora da V1, falta de evidência de QA, review incompleto/HEAD alterado, merge limitado pelo humano, falha pós-merge e inviabilidade não comprovada.
- Conferir cobertura item a item do contrato anterior, referências operacionais residuais e classificação das ocorrências históricas. Revisar `main..HEAD`, `main...HEAD`, escopo dos commits/arquivos e `git diff --check`.
- `npm ci` e `npm run check`: não aplicáveis ao delta exclusivamente textual/contratual. Não executar build ou QA de produto sem impacto correspondente.
- Publicar no mesmo PR; marcar para revisão e aguardar resultado explícito do Code Review automático do HEAD final e dos checks aplicáveis; corrigir e repetir review em novo SHA se necessário. Entregar PR tecnicamente pronto e aberto, sem merge e sem declarar PB-A concluído.

## Decisões aprovadas — Prioridade 2

Fonte: Debate 3D, seção 3.3, consultada em 04/10/2026. Baseline operacional: merge #1021, `8464ba44ca0fd129e2782534751978b772797d71`. A V1 e a V2 da Prioridade 1 acima permanecem como registros anteriores.

3.3. Registros, V1/V2, checkpoints e aprovações intermediárias

• Esta frente vem imediatamente após a unificação do Executor e antes da revisão dos especialistas.
• A execução da Prioridade 1/PR #1021 é a evidência empírica desta frente: mostrou repetição de V1/V2, referências, checkpoints, pareceres e recibos, sem transformar esse histórico em novo artefato normativo.
• O critério de simplificação é distinguir: o que precisa ser decidido, o que precisa ser comprovado e o que está apenas sendo repetido.
• Para cada decisão, preservar uma referência recuperável suficiente; não reproduzir integralmente a mesma informação em cada passagem quando a fonte puder ser resolvida de forma inequívoca.
• V2 e checkpoints devem ser proporcionais ao delta, ao risco e à necessidade real de retomada; não expandir por rotina um recorte pequeno em contrato ou sequência maior do que a execução exige.
• Reavaliar marcos que apenas repetem aprovação já existente, inclusive o uso de `plan-v2-approved` por commit vazio; manter marco separado somente quando ele cumprir função própria de prova imutável, liberação ou retomada.
• Não exigir snapshots, SHAs ou identificadores adicionais quando a mesma versão já for recuperável de forma inequívoca pelo Git e o registro extra não cumprir função própria.
• O recibo final deve ser compacto e preservar somente as evidências essenciais da entrega, como HEAD avaliado, resultado de review, merge, validações aplicáveis e pendências materiais.
• Informação necessária deve permanecer em sua residência competente; documento canônico não fica automaticamente fora da avaliação de redundância, mas seu conteúdo necessário não pode ser perdido.
• Preservar explicitamente os controles que demonstraram valor na Prioridade 1: Code Review independente do HEAD corrente, guarda do SHA, busca de consumidores legados ainda ativos, fechamento comprovado de achados materiais e restrições humanas explícitas.
• Quando uma decisão desta prioridade tornar uma regra diretamente dependente obsoleta ou contraditória, o ajuste correspondente deve ocorrer no mesmo delta autorizado.
• Incluído no Plano Base — PB-A, Prioridade 2.

## V2 técnica — Prioridade 2

- Executar somente P2, em `codex-app/d3d-p2-registros-proporcionais`, base `8464ba44ca0fd129e2782534751978b772797d71`. V1 PB-A e decisões de P2: este arquivo em `761bbe7dd37d034f13b4d347941f28d97c0bdc44`; posição/plano conceitual N/A. P1 permanece histórica; P3 não será iniciada.
- Derivação técnica da V1: uma referência recuperável suficiente por decisão/versão, com conteúdo integral lido pelo consumidor; transportar cópia somente quando a referência não puder ser resolvida ou o julgamento exigir recebê-la. Fonte externa sem recuperação durável exige preservar o conteúdo aprovado indispensável em residência existente; URL ou revisão temporária não substitui essa prova.
- No Executor, ajustar entradas e §§3.1, 3.3, 7.1–7.3 e 9: V1 preservada, V2 proporcional, aprovação vinculada ao candidato exato, checkpoints apenas por função de prova/liberação/retomada e recibo compacto. Git/PR/parecer competente bastam quando permitem recuperar a decisão; ausência de trailer não equivale a ausência de aprovação, nem presença de trailer substitui gate.
- Marcos separados e `plan-v2-approved` não serão exigidos por rotina nem por commit vazio. Conservar exigências literais de planos já iniciados e consumidores ativos, incluindo E21.2.5, E21.5.6 e checkpoints de E10.9; aprovação antiga não libera V2 alterada e checkpoint não afetado permanece válido.
- Reconciliar somente transporte/referências nos wrappers de Plano Analista, Implementação Analista, Estrutura, Updates, Automações e ABC. O wrapper de implementação também exige entregar trecho integral e é consumidor direto de P2. Manter leitura integral pertinente, acesso confirmado, primeira passagem limpa, critérios de acionamento, modos, conclusões e retornos técnicos; manter comparação do roadmap anterior/atual no ABC. Não alterar runtime dos agentes ou regime de P3.
- Preservar integralmente autonomia de P1, restrições humanas, Code Review independente do HEAD corrente, resultado explícito dos reviews aplicáveis, correções e fechamento comprovado de achados, guarda atômica do SHA e pós-merge. Buscar consumidores legados ativos antes de dispensar registro; fonte ambígua/indisponível suspende apenas o ponto dependente.
- Escopo provável: contrato do Executor, seis wrappers e esta lousa existente. Não criar caso E*, documento de prova, matriz, agente, workflow, infra ou PR adicional de limpeza; não reescrever snapshots/lousas históricos nem documentos canônicos não afetados.
- Updates, Automações, Design, QA de produto e observabilidade: N/A para esta entrega textual. ABC canônico: N/A, pois nenhum documento da seção 5 do Prompt ABC precisa de delta; seu wrapper recebe apenas a reconciliação de transporte diretamente dependente.
- Validar por recuperação Git e inspeção dos cenários: V1/V2 no mesmo arquivo; fonte externa mutável; destinatário sem acesso; aprovação com/sem Analista; nova V2 com aprovação antiga; legado com marcador obrigatório; retomada sem trailer; checkpoint afetado/não afetado; review ausente ou novo HEAD; merge limitado pelo humano. Conferir preservação dos gatilhos de P3, diff `main..HEAD`/`main...HEAD`, `git diff --check` e review independente do HEAD final.
- `npm ci` e `npm run check`: N/A para texto/contratos. Publicar em um PR da P2, tratar review/checks/threads no mesmo fluxo, concluir merge remoto autorizado e fechamento factual de P2; PB-A e P3 permanecem abertos.

Aprovação técnica da V2 P2: Analista em passagem independente — aprovado para implementar; candidato identificado por 0b7dd479fe52899325caee0863deb711662f6fc7, seção V2 técnica — Prioridade 2. Não libera merge nem P3.

## V1 vigente — Prioridade 3 redefinida

Fonte: Debate 3D, decisão do titular consultada em 04/10/2026. Substitui somente a abordagem anterior da P3; V1/V2 anteriores acima permanecem históricas. Baseline: `a3dddbdcf639b60fa51ae5ab5af9926bcf1c3a7e` (merge #1022). PR #1023 fechado sem merge, HEAD `545a4322746df4ea13e5c9f599a95c5318a45775`, preservado como histórico; esta execução usa nova branch/PR, sem reaplicação automática de patches.

3.4. Especialistas por necessidade concreta e roteamento centralizado

• Durante a execução de plano aprovado, o contrato do Executor é a única residência normativa da política de acionamento, seleção e retorno dos especialistas. Substituir a harmonização de políticas distribuídas pela retirada de suas cópias; não centralizar o julgamento dos domínios.
• Abrangência: Estrutural, Updates, Analista, Automações, Design e Documentação no fluxo de execução. Para Automações, Design e Documentação, preservar os critérios funcionais, cobertura e capacidades vigentes; durante a execução, a política de acionamento desses critérios passa a residir exclusivamente no Executor.
• Executor: identificar a questão material, selecionar o domínio, decidir primeira chamada ou retorno e conduzir validações e pendências. Não refazer o parecer, ampliar autoridade nem declarar satisfeita uma condição técnica ainda aberta. Na ausência de necessidade concreta ou exigência competente, não chamar por frequência, sequência, quantidade ou precaução genérica.
• Wrapper: receber a chamada já decidida; conferir identidade, modo, recorte, compatibilidade com o domínio, referências, acesso e completude; preparar a independência exigida, acionar o agente correto e devolver fielmente o parecer. Pode rejeitar entrada inadequada e informar a lacuna, mas não refaz a triagem de conveniência nem escolhe outro especialista.
• Runtime: executar o método e o julgamento do domínio, produzir conclusão, evidências, condicionantes e limitações. Pode sinalizar questão residual ou sugerir outro domínio, sem impor chamada ou gate transversal. Permanecem locais read-only, proibição de implementar/editar/criar branch ou PR/acionar outros agentes, limites de domínio, critérios técnicos, modos, cobertura, formatos e independência.
• Gestor Estrutural: acionar somente diante de questão real sobre responsabilidades, boundaries, dependências, consumidores, solução técnica ou crescimento estrutural. Mudança local suficientemente determinada não exige chamada; prova de necessidade de crescimento continua obrigatória, sem parecer por rotina.
• Gestor de Updates: deixa de ser prioritário por padrão; chamar quando uma decisão da implementação depender de informação tecnológica atual ainda não suficientemente estabelecida nas fontes do projeto. Sem esse gatilho, não exigir parecer nem registro ritual de dispensa.
• Analista: o padrão é não acionar. Antes da chamada, o Executor registra a questão material específica, por que fontes competentes, validações determinísticas, especialista aplicável ou Code Review não a resolvem e qual decisão o julgamento independente pode alterar. Sem essas três respostas, não há chamada, ressalvadas exigências específicas de planos legados.
• Avaliações de V2 e implementação são capacidades independentes e condicionais; uma não obriga a outra, nem parecer Estrutural cria Analista automático. Materialidade, mudança de contrato, tamanho, existência de V2, especialista anterior, novo HEAD, Code Review, controle independente genérico ou confirmação de correção inequívoca não bastam isoladamente.
• Retorno ao mesmo especialista: fechar achado, condicionante ou evidência solicitada por ele; avaliar evidência material nova, mudança material da solução ou novo impacto no domínio que exija julgamento próprio. Para Updates, incluem-se informação tecnológica nova e recomendação anterior inaplicável. Não há teto artificial nem repetição por rotina; manter contexto e conclusão anteriores necessários ao retorno focal.
• Correção focal e inequívoca de Code Review, dentro do contrato aprovado e sem questão especializada nova, segue Executor → validação → novo Code Review do HEAD, sem retorno automático ao Analista. Pendência especializada aberta continua exigindo fechamento competente.
• Vereditos que embutem encaminhamento automático devem descrever a pendência de domínio, como `requer decisão material`, preservando significado, evidências, condicionantes e efeitos de bloqueio. Reconciliar consumidores e reconhecer resultados legados sem reescrever o histórico; não renomear conclusões sem necessidade nem ampliar elegibilidade de patches, limites de custo ou autoridade.
• Preservar consultas pré-V1 pelo Estrategista, pedidos humanos explícitos, dispensas humanas válidas e demais entradas autorizadas fora da execução. Essas entradas não passam artificialmente pelo Executor; wrappers preservam sua validação local sem replicar a política de execução.
• Retirar dos wrappers, runtimes e documentos dependentes somente políticas transversais duplicadas. Manter métodos e contratos de domínio em suas residências e usar referências curtas quando necessárias; não copiar tudo para o Executor nem exigir releitura integral dele a cada chamada. Não criar camada, agente, workflow ou documento permanente de roteamento.
• Preservar P1/P2, leitura e recuperação das fontes, exigências específicas de planos iniciados, Code Review independente do HEAD corrente e sua repetição quando o HEAD mudar, resultado explícito, fechamento dos achados materiais, guarda do SHA, validações/QA, busca de consumidores e restrições humanas. Provar equivalência das responsabilidades afetadas antes de substituir contratos; sem prova, preservar.
• A alteração do regime de Updates é decisão nova do Debate 3D, não limpeza autorizada pelo Debate 3C. A nova residência do roteamento não autoriza outras mudanças de produto, métodos ou capacidades.
• Incluído no Plano Base — PB-A, Prioridade 3.

4.1. PB-A — Simplificação operacional do Pipeline de Plano Base

4.1.1. Problema e resultado funcional

• Problema: o Pipeline ainda distribui responsabilidades, registros, aprovações e consultas especializadas de forma que gera alternância de papéis, transporte de contexto e burocracia sem ganho proporcional de qualidade.
• Resultado: um fluxo operacional único, conduzido por um Executor autônomo e responsável pela conclusão, com registros proporcionais, política de roteamento concentrada no Executor e especialistas acionados somente quando sua avaliação acrescentar função própria.
• O resultado deve reduzir complexidade operacional sem reduzir segurança, autonomia, rastreabilidade útil, independência do Code Review ou critérios de aceite.

4.1.2. Comportamento esperado

• Um plano aprovado entra em uma única condução operacional e permanece nela até estado terminal, salvo decisão fora da autoridade concedida.
• O Executor não alterna identidade com um segundo papel interno para avaliar a própria entrega; as responsabilidades úteis hoje atribuídas ao Estrategista Autônomo permanecem cobertas no contrato operacional unificado.
• O fluxo preserva trabalho válido diante de bloqueios e retoma apenas o ponto afetado.
• V1, V2, checkpoints, aprovações e recibos permanecem somente na medida em que cumpram função de decisão, prova, retomada ou rastreabilidade.
• Durante a execução, o Executor concentra a política de primeira chamada e retorno de Estrutural, Updates, Analista, Automações, Design e Documentação; wrappers e runtimes não mantêm políticas concorrentes. Automações, Design e Documentação conservam seus critérios funcionais vigentes.
• Estrutural é acionado por questão estrutural real; Updates, por decisão dependente de informação tecnológica atual insuficiente; Analista, por questão material residual, insuficiência das fontes/controles existentes e decisão que seu julgamento independente possa alterar. V2 e implementação não formam dupla obrigatória de avaliações.
• Retorno focal fecha pendência própria do especialista ou julga evidência nova material, mudança relevante da solução ou novo impacto de domínio. Correção inequívoca de Code Review dentro do contrato e sem questão especializada nova segue diretamente à validação e novo Code Review. Não impor cotas nem repetir avaliações por rotina.
• Wrappers conferem domínio, modo, recorte, acesso e completude, preservam a preparação independente e devolvem fielmente a saída; entradas inválidas retornam como lacuna, sem nova triagem de conveniência ou chamada a outro agente.
• Runtimes mantêm métodos, limites e conclusões independentes; informam pendências e riscos sem comandar outros especialistas. Vereditos de roteamento tornam-se resultados de domínio com significado e efeitos preservados. O Executor não pode considerar satisfeita uma condição técnica apenas por decidir outro encaminhamento.
• Revisão independente, QA, checks, evidências e critérios de aceite continuam determinando prontidão e merge.

4.1.3. Limites e escopo negativo

• Não alterar produto, runtime comercial, banco, rotas ou experiência do cliente por consequência deste Plano Base.
• Não criar novo agente, automação, workflow, engine, infraestrutura ou documento permanente para substituir burocracia removida.
• Não eliminar responsabilidade, controle ou evidência necessária sem prova de equivalência ou superioridade funcional.
• A P3 centraliza somente roteamento: não transfere métodos e julgamentos para o Executor, não amplia elegibilidade de patches ou limites de custo e não reduz read-only, cobertura, conclusões, independência ou efeitos das pendências. Preservar consultas pré-V1, pedidos e dispensas humanos válidos, entradas externas autorizadas, gates específicos legados e subfluxos não afetados.
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
• Prioridade 3 — roteamento centralizado e especialistas por necessidade concreta: concentrar a política de execução no contrato do Executor, retirar cópias transversais dos wrappers/runtimes e consumidores diretamente afetados e preservar validações e julgamentos locais. Abranger os seis especialistas do fluxo, sem cotas artificiais, revisões por rotina ou nova camada.
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
• Prioridade 3 aceita quando houver uma única residência da política de roteamento no Executor, sem cópias concorrentes nos consumidores, e cada chamada/retorno cumprir necessidade própria. A validação deve comprovar chamadas válidas e rejeição de entradas inadequadas, V2/implementação independentes, retorno para pendência especializada, correção direta de Code Review e preservação das entradas pré-V1/humanas, gates legados e capacidades locais. O diff deve demonstrar retirada de duplicação real, sem reduzir evidência ou funcionalidade para diminuir texto.
• Cada prioridade deve apresentar no próprio PR evidência proporcional de preservação das responsabilidades afetadas, diff limitado ao recorte, validações aplicáveis e Code Review independente do HEAD corrente.
• O PB-A só é concluído quando a conferência final comprovar ausência de referência órfã, regra contraditória, responsabilidade sem dono ou gate necessário perdido.
• Nenhuma economia de crédito ou melhora de qualidade será declarada como fato apenas pela mudança arquitetural; esses benefícios permanecem hipótese operacional a observar nas execuções posteriores.

## V2 técnica — Prioridade 3 redefinida

- Contrato: V1 vigente e 3.4 deste arquivo em `06b34177a7b58dcfd224845e172c8a732c6c0a06`; baseline pós-P2 `a3dddbdcf639b60fa51ae5ab5af9926bcf1c3a7e`. Nova branch `codex-app/d3d-p3-roteamento-centralizado`; #1023 exclusivamente histórico. Posição/plano conceitual N/A.
- Derivação técnica da V1: concentrar seleção, primeira chamada e retorno dos seis especialistas no Executor §3.2 e reconciliar apenas suas remissões em §§3.3 e 7.1–7.3. Preservar critérios funcionais de Automações/Design/Documentação e gates específicos legados; avaliações de V2 e implementação são independentes.
- Nos sete wrappers, retirar triagem transversal e preservar validação local, modos, acesso, completude, independência e devolução fiel. Retorno recebe questão, parecer/contexto anterior, delta e evidência pertinente; usar modos existentes com julgamento focal.
- Nos runtimes Estrutural, Updates, Analista e Automações, retirar encaminhamentos automáticos e adequar retorno focal, preservando métodos, cobertura, limites e efeitos das pendências. Reconciliar os vereditos afetados em seus consumidores, inclusive `docs/gestor-automations.md`; reconhecer pareceres legados sem reescrever histórico. Runtimes Design/Documentação e subfluxos ABC/prompt mantêm seus métodos.
- Updates material recebe tratamento e evidência na V2; só questão estrutural real ou exigência específica aciona Estrutural. Patch direto de Updates continua limitado a impacto estrutural baixo + funcional nenhum, com custo zero comprovado; pendência funcional/estrutural não equivale a aprovação.
- Limites: somente P3 e coerência final do PB-A; sem produto, UI, banco, workflow, infra, agente, modo ou documento permanente novo, renomeação geral ou patches herdados de #1023. Preservar P1/P2, fontes recuperáveis, autonomia e restrições humanas.
- Validar fontes e consumidores, preservação item a item e cenários de chamadas válidas/inadequadas, ausência de gatilho, retorno para pendência/nova evidência, V2/implementação independentes, correção direta de review, pré-V1/humano e gates legados. Executar subfluxo read-only de prompt antes de editar, confronto dos candidatos, `git diff --check`, diffs de dois/três pontos e Code Review independente do HEAD corrente; corrigir achados e repetir review se o SHA mudar.
- Consolidação técnica liberada pelo Executor após fechamento focal Estrutural; pareceres e prova proporcional ficam no PR. QA de produto, observabilidade, ABC canônico, `npm ci` e `npm run check`: N/A ao delta textual. Merge somente com gates e autoridade vigentes, guarda do SHA e fechamento factual do Debate.

# Pipeline de Plano Base

## 1. Objetivo

Definir o roteamento permanente dos planos-base da LP Factory 10 sem duplicar os contratos internos de execução.

- O Estrategista Original produz a V1 funcional e classifica cada plano.
- O Pipeline recebe a classificação pronta e escolhe o fluxo competente.
- O tipo de execução é `Light` ou `Complexa`.
- A forma de supervisão é `Semiautomático` ou `Autônomo`.
- Tipo e forma são eixos independentes.

## 2. Fontes e responsabilidades

- `README.md`: visão, escopo, stack e princípios do MVP.
- `docs/prompt-estrategista.md`: Debate, V1, classificação e supervisão do Estrategista Original.
- Este documento: somente roteamento, invariantes universais, supervisão, merge e conclusão.
- `docs/prompt-executor.md`: fluxo Light e contrato universal de implementação.
- `.agents/skills/lp-factory-conduzir-plano-completo/SKILL.md`: derivação técnica e orquestração da Complexa.
- `.agents/skills/lp-factory-executar-plano/SKILL.md`: controles específicos da implementação Complexa.
- Skills especializadas: entrada, chamada e devolução dos especialistas e do Analista.
- `.codex/agents/*.toml`: competência e julgamento read-only dos especialistas e do Analista.
- `docs/prompt-abc.md`: reconciliação de documentos canônicos.
- `AGENTS.md`: Git, publicação, validações e autoridade operacional.
- Fontes canônicas do caso: estado factual e contratos do assunto correspondente.

Nenhum documento deste Pipeline amplia a autoridade da V1 ou da V2 aprovada.

## 3. Entrada do roteador

Para cada plano, receber:

- V1 funcional integral;
- posição e fases no roadmap;
- classificação `Light` ou `Complexa`;
- forma `Semiautomático` ou `Autônomo`;
- decisão de automação já fechada na V1;
- critérios de aceite e evidências esperadas;
- dependências entre planos, somente quando existirem.

Se faltar classificação ou dado funcional indispensável, devolver ao Estrategista Original. O roteador não redefine produto, escopo, V1 ou classificação por conta própria.

## 4. Roteamento por tipo de execução

### 4.1. Light

Rota:

`V1 → docs/prompt-executor.md → Updates obrigatório → V2 mínima → Analista se necessário → implementação → validação/QA/ABC → supervisor`

Regras:

- O Executor materializa e congela a V1 antes da derivação.
- V1 e V2 Light usam o mesmo `docs/lousa-plano-base-<caso>.md`, a mesma branch e o mesmo PR; a V1 permanece recuperável pelo commit SHA congelado.
- `$lp-factory-avaliar-plano-updates` é obrigatório.
- Gestor Estrutural e Gestor de Automações não participam do Light depois da V1.
- `$lp-factory-avaliar-plano-analista` é condicional e usa somente o modo Light previsto em sua skill.
- Light não cria matriz de consolidação nem executa segunda passagem do Analista.
- Se tornar a solução executável exigir derivação estrutural especializada, detalhamento técnico material de automação ou coordenação especializada, o Executor para e devolve ao Estrategista Original a incompatibilidade da classificação; não transforma o Light em uma Complexa parcial.
- O detalhamento interno do Light pertence exclusivamente a `docs/prompt-executor.md` e às skills chamadas por ele.

### 4.2. Complexa

Rota:

`V1 → lp-factory-conduzir-plano-completo → V2 aprovada → lp-factory-executar-plano/Executor → validação/QA/ABC → supervisor`

Regras:

- A task técnica materializa e congela a V1 no PR único do plano.
- `$lp-factory-conduzir-plano-completo` é o dono da derivação técnica Complexa.
- O workflow competente coordena especialistas, matriz, duas passagens do Analista, checkpoints, reconciliação do roadmap e retomada.
- Após a aprovação da V2, o contrato universal do Executor passa a reger a implementação, acrescido dos controles específicos de `$lp-factory-executar-plano`.
- Este documento não replica sequência de especialistas, campos da matriz, passes do Analista ou checkpoints da Complexa.
- O comportamento comprovado da Complexa não deve ser removido, reduzido ou redistribuído sem equivalência ou superioridade funcional demonstrada item a item e autorização humana explícita.

## 5. Invariantes universais

### 5.1. V1 e V2

- A V1 é a fronteira funcional aprovada.
- A V2 é derivação técnica e não pode ampliar produto, comportamento, usuário, escopo, limites, escopo negativo ou critérios funcionais de aceite da V1.
- Repositório, especialista, update ou conveniência técnica não autorizam ampliação funcional.
- Mudança funcional retorna ao Estrategista Original.

### 5.2. Continuidade técnica

Cada plano preserva a relação:

`1 plano = 1 V1 = 1 task técnica responsável = 1 branch = 1 PR`

- Não há merge intermediário entre V1, V2 e implementação do mesmo plano.
- Correções pré-merge permanecem na mesma task, branch e PR.
- Dependências controlam a liberação dos planos sem exigir PR compartilhado.

### 5.3. Especialistas e Analista

- Custom agents permanecem read-only.
- Especialista emite parecer; não implementa nem redefine produto.
- Parecer não é V2 e não é autorização de implementação por si só.
- Analista avalia; não consolida, implementa ou substitui especialidade.
- Cada fluxo chama somente as avaliações previstas por seu próprio contrato.

## 6. Roteamento por forma de supervisão

### 6.1. Semiautomático

- O Estrategista Original permanece supervisor.
- O humano transporta a V1 ao fluxo técnico e devolve as entregas sucessivas ao Estrategista.
- O fluxo técnico aplica correções dentro da V1 na mesma task, branch e PR.
- Mudança funcional ou de escopo retorna ao Debate.

### 6.2. Autônomo

- O humano inicia o Estrategista Autônomo após o Debate.
- O Estrategista Autônomo supervisiona; não implementa, não produz V2 e não substitui a task técnica.
- Para cada plano liberado, a task técnica segue o tipo já definido: Light ou Complexa.
- Questão fora da autoridade concedida retorna ao Estrategista Original/humano.
- Dependências são liberadas somente após a conclusão exigida do plano precedente.

### 6.3. Modelo e esforço do modo Autônomo

- O modelo de trabalho é `gpt-5.6-sol` enquanto esse contrato permanecer vigente.
- O humano define o esforço do Estrategista Autônomo entre `medium` e `high` ao iniciá-lo.
- O Estrategista Autônomo define o esforço da task técnica de cada plano entre `medium` e `high` conforme a complexidade.

## 7. QA, entrega, merge e conclusão

### 7.1. QA e evidências

- O Executor executa validações e QA aplicáveis e entrega evidência objetiva.
- No Semiautomático e no Autônomo, buscar primeiro evidência automatizada com os recursos autorizados disponíveis.
- Evidência obrigatória ausente mantém o plano aberto.
- O supervisor pode exigir correção ou QA adicional sem reiniciar especialistas ou derivação já aprovados, salvo questão material nova prevista pelo fluxo competente.

### 7.2. Entrega

- O Executor declara entrega técnica; não declara conclusão do plano.
- O supervisor confronta contrato aprovado, resultado, evidências e, quando necessário, PR/diff.
- Alteração material sem origem legítima impede prontidão.

### 7.3. Merge

- Semiautomático: merge final exige autorização humana explícita.
- Autônomo: merge somente dentro da autoridade previamente concedida e com gates, checks, QA e evidências obrigatórios satisfeitos.
- `AGENTS.md` rege o meio operacional do merge.
- Decisão material pendente bloqueia merge.

### 7.4. Conclusão

- Semiautomático: Estrategista Original conclui o plano.
- Autônomo: Estrategista Autônomo conclui o plano dentro da autoridade concedida.
- Validação pós-merge obrigatória faz parte da conclusão quando aplicável.
- Dependentes permanecem bloqueados enquanto o plano precedente não estiver concluído.

## 8. Limites do roteador

Este documento não deve:

- duplicar o Prompt Estrategista ou o Prompt Executor;
- reproduzir critérios internos dos especialistas;
- reproduzir a matriz, as duas passagens ou os checkpoints da Complexa;
- definir banco, rota, job, agente, automação, engine ou infraestrutura de produto;
- substituir `AGENTS.md`, ABC ou fontes técnicas canônicas;
- criar briefing intermediário para transportar V1 ou V2;
- transformar Light em subconjunto procedural da Complexa.

Quando um detalhe já possuir dono competente, este documento apenas aponta para esse contrato.

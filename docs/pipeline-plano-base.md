# Pipeline de Plano Base

## 1. Objetivo

Definir somente o roteamento permanente dos planos-base da LP Factory 10.

O Pipeline recebe duas decisões já tomadas fora dele:

- execução: `Light` ou `Complexa`;
- supervisão: `Semiautomático` ou `Autônomo`.

O Pipeline não decide, reclassifica, transporta ou detalha a V1 e não duplica contratos internos dos fluxos competentes.

## 2. Roteamento por execução

### 2.1. Light

Rota:

`Light → docs/prompt-executor.md`

O detalhamento do Light pertence exclusivamente ao Prompt Executor e às skills chamadas por ele.

### 2.2. Complexa

Rota:

`Complexa → $lp-factory-conduzir-plano-completo`

O detalhamento da Complexa pertence exclusivamente ao workflow completo e aos contratos que ele aciona.

## 3. Roteamento por supervisão

### 3.1. Semiautomático

`Semiautomático → Estrategista Original supervisiona`

### 3.2. Autônomo

`Autônomo → $lp-factory-estrategista-autonomo supervisiona`

Execução e supervisão são eixos independentes.

## 4. Fontes competentes

- `docs/prompt-estrategista.md`: Debate, V1, classificação Light/Complexa, escolha humana de supervisão e handoff.
- `docs/prompt-executor.md`: Light e contrato universal de implementação.
- `.agents/skills/lp-factory-conduzir-plano-completo/SKILL.md`: derivação técnica Complexa.
- `.agents/skills/lp-factory-executar-plano/SKILL.md`: implementação Complexa.
- `.agents/skills/lp-factory-estrategista-autonomo/SKILL.md`: supervisão Autônoma.
- `AGENTS.md`: Git, publicação, validações e autoridade operacional.
- `docs/prompt-abc.md`: reconciliação de documentos canônicos.

## 5. Limites do roteador

Este documento não deve definir ou repetir:

- critérios para decidir Light ou Complexa;
- escolha entre Semiautomático e Autônomo;
- conteúdo, localização ou forma de transporte da V1;
- instruções de Google Drive;
- criação de task, branch ou PR;
- modelo ou esforço;
- Updates, especialistas, Analista, matriz ou checkpoints;
- implementação, QA, evidências, merge ou conclusão;
- regras internas do Estrategista, Executor, workflows Complexos ou Estrategista Autônomo.

Quando um detalhe possuir dono competente, o Pipeline apenas aponta para esse contrato.

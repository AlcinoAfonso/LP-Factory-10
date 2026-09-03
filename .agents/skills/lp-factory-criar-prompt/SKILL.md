---
name: lp-factory-criar-prompt
description: Criar prompts, instruções e handoffs outcome-first para papéis e IAs do LP Factory 10, exceto briefings destinados a uma task técnica no Codex trabalhar sobre o repositório. Usar quando o humano pedir prompt pronto, instrução para análise, pesquisa, avaliação, estratégia, UX, documentação ou outro papel/IA, ou como subfluxo somente leitura quando uma implementação criar ou alterar prompt consumido por IA.
---

# Criar prompt outcome-first

Produzir uma instrução completa e executável por outra IA, usando as fontes vigentes do LP Factory 10 e sem executar a tarefa descrita no prompt.

## Roteamento obrigatório

1. Usar esta skill quando o produto final for prompt, instrução ou handoff para análise, pesquisa, avaliação, decisão, estratégia, UX, documentação ou outro papel/IA que não seja uma task técnica Codex trabalhando sobre o repositório; usá-la também como subfluxo somente leitura do Executor quando a implementação criar ou alterar prompt consumido por IA.
2. Fora desse subfluxo, se o produto final solicitado for um briefing ou handoff para uma task técnica no Codex trabalhar sobre o repositório, inclusive em atividade read-only como investigação, auditoria ou mapeamento, usar `$lp-factory-briefing-codex` e não continuar nesta skill.
3. Se o pedido for ambíguo, resolver pelo produto final e destinatário. Perguntar somente quando não for possível determinar se o usuário quer um briefing para task técnica Codex ou um prompt para outro papel/IA.

## Fontes obrigatórias

Antes de produzir o prompt:

1. Ler `README.md`.
2. Ler `docs/template-prompts.md` na versão vigente; para prompts da OpenAI, consultar também a orientação oficial vigente por `$openai-docs` e, se GPT-5.6 estiver em avaliação ou aprovado, `docs/template-prompts-gpt-5-6.md`.
3. Ler os documentos, arquivos, PRs e decisões diretamente relacionados ao recorte.
4. Ler o prompt ou contrato vigente do papel destinatário quando existir.
5. Consultar o GitHub antes de declarar ausência de documentação do projeto.

Não usar cópia incorporada ou memória como substituta das fontes canônicas do repositório.

## Preparar a instrução

Confirmar no material disponível:

1. papel ou função da IA destinatária;
2. resultado esperado;
3. fontes e contexto que podem ser usados;
4. critérios de sucesso;
5. limites do recorte;
6. formato da entrega;
7. regras de parada;
8. evidências, casos representativos ou validações exigidas;
9. nível de concisão adequado.

Se faltar fonte, decisão ou definição indispensável, parar e pedir exatamente o dado ausente. Não completar lacunas críticas por suposição.

## Produzir o prompt

1. Aplicar a estrutura vigente de `docs/template-prompts.md` e o complemento GPT-5.6 somente quando indicado pelo modelo e workload.
2. Começar pelo resultado esperado e manter as instruções orientadas à entrega.
3. Informar fontes concretas, evitando referências genéricas quando paths, PRs ou documentos forem conhecidos.
4. Separar critérios de sucesso, limites e regras de parada.
5. Exigir evidência proporcional ao resultado solicitado.
6. Preservar estrutura, numeração e ordem de documento existente quando o pedido for ajuste de prompt já versionado.
7. Remover repetições e processos que não aumentem a precisão da execução.

## Entrega

Entregar:

1. o prompt completo e pronto para uso e, no subfluxo de implementação, os casos representativos e resultados esperados para validação pelo Executor;
2. as fontes utilizadas, quando não estiverem suficientemente explícitas dentro do próprio prompt;
3. bloqueios ou dados faltantes, quando houver.

## Limites

Não executar a tarefa descrita no prompt; não criar implementação, branch, commit ou PR; não inventar rota, banco, job, agente, automação, engine ou infraestrutura; não transformar briefing técnico para Codex em prompt geral.

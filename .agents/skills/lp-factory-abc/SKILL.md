---
name: lp-factory-abc
description: Gerar ABCs delta-only para documentos canônicos do LP Factory 10 a partir de relatório, implementação, PR, handoff ou plano-base v1/v2 aprovado. Usar em pedidos de atualização, correção, sincronização, triagem documental ou reconciliação planejada de docs/roadmap.md.
---

# LP Factory ABC v2

Usar `docs/prompt-abc.md` como contrato canônico na referência competente. Carregá-lo integralmente quando o contrato ainda não estiver disponível no contexto da avaliação; em revisão focal na mesma referência, reutilizar o contrato já carregado. Não duplicar, substituir nem flexibilizar suas regras nesta skill.

## Preparar

1. Confirmar o repositório `AlcinoAfonso/LP-Factory-10`.
2. Resolver `REF`; usar `main` quando não for informado.
3. Confirmar `DOC_ALVO` ou executar a triagem prevista no contrato canônico.
4. Confirmar o `RELATÓRIO`, que deve representar o estado final competente.
5. No `DOC_ALVO`, localizar primeiro as ocorrências/seções relacionadas aos fatos e identificadores do `RELATÓRIO` e ler somente o contexto necessário; ampliar a leitura apenas pelos critérios do fluxo canônico de `docs/prompt-abc.md`.
6. Para `docs/roadmap.md`, consultar também `docs/template-roadmap.md` na mesma referência somente no recorte estrutural aplicável; planejamento que exigir snapshot integral preserva a regra específica abaixo.
7. Parar e pedir somente a entrada ausente quando não for possível resolvê-la sem inferência.

## Selecionar o modo da fonte

### Relatório

Usar relatório final, resumo de PR, handoff, diagnóstico aprovado ou outra fonte consolidada fornecida.

### Implementação

Quando não houver relatório formal, reconstruir somente o estado final confirmado a partir do plano e da fase, intervalo de commits, diff, validações e decisões registradas. Ignorar tentativas, erros intermediários e hipóteses.

### Planejamento

Usar quando o `RELATÓRIO` for um plano-base v1 ou v2 aprovado. Esse modo registra estado planejado ou definido; nunca converte previsão em implementação.

Para reconciliar `docs/roadmap.md` após a v2, exigir:

- referência imutável e conteúdo integral da v2 aprovada;
- snapshot imutável e conteúdo integral do roadmap anterior à reconciliação, fornecido pelo fluxo competente;
- `DOC_ALVO: docs/roadmap.md`;
- `docs/prompt-abc.md` e `docs/template-roadmap.md` da referência competente.

Permitir somente seções e subseções do recorte, identificadores, títulos, objetivos, status planejado ou definido, limites, decisões futuras aprovadas e dependências indispensáveis. Não registrar implementação concluída, banco, migrations, arquivos criados ou ajustados, updates aplicados, evidências, comandos, PRs, histórico operacional ou alterações de outros documentos canônicos. Omitir `Registros do recorte` enquanto não houver implementação material.

## Gerar o delta

1. Aplicar o fluxo, a residência documental, os gates e as operações de `docs/prompt-abc.md`.
2. Comparar o `RELATÓRIO` com o snapshot atual do `DOC_ALVO`.
3. Emitir somente o menor delta executável ou `SEM ALTERAÇÕES NECESSÁRIAS`.
4. Em planejamento, preservar o esqueleto existente e alterar sua estrutura somente quando a fonte aprovada exigir criação ou consolidação de seção.
5. Usar literalmente o formato da seção 9 de `docs/prompt-abc.md`, inclusive acentuação e o travessão do cabeçalho.

## Limites

Não aplicar o delta, editar documentos, alterar outra residência documental, completar lacunas por suposição ou registrar estado operacional como planejado. A aplicação pertence ao executor autorizado.

## Verificar

Antes de devolver, confirmar fontes, referência, residência, menor delta, formato literal e ausência de secrets, PII, hipóteses ou histórico superado.

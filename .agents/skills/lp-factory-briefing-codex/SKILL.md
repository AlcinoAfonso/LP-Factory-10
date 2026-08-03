---
name: lp-factory-briefing-codex
description: Criar briefings de implementação para o Codex trabalhar no repositório LP Factory 10, com contexto, objetivo, arquivos-alvo, limites, validações e entrega final. Usar quando o humano pedir briefing, task ou instrução para Codex ou executor realizar alterações em arquivos, código, banco, configuração, branch, commit ou PR.
---

# Criar briefing de implementação para Codex

Produzir um briefing objetivo e executável para o Codex, sem implementar a tarefa descrita.

## Roteamento obrigatório

1. Usar esta skill quando o destinatário for Codex, Codex App ou executor responsável por alterações no repositório.
2. Esta skill tem precedência sobre `$lp-factory-criar-prompt` quando o pedido envolver arquivos-alvo, implementação, validação técnica, branch, commit ou PR.
3. Para prompts de análise, pesquisa, avaliação, estratégia, UX, documentação ou outro trabalho sem mutação do repositório, usar `$lp-factory-criar-prompt` e não continuar nesta skill.
4. Se o pedido for ambíguo, resolver pelas fontes e pelo resultado esperado. Perguntar somente quando não for possível determinar se haverá implementação no repositório.

## Fontes obrigatórias

Antes de produzir o briefing:

1. Ler `README.md`.
2. Ler `AGENTS.md` na versão vigente.
3. Ler `docs/template-briefing-codex.md` na versão vigente.
4. Usar `docs/template-prompts.md` apenas como princípio outcome-first, sem substituir a estrutura específica do briefing. Quando o recorte criar ou alterar prompt consumido por IA, tratá-lo também como contrato do artefato e incluir `docs/template-prompts-gpt-5-6.md` somente se GPT-5.6 estiver em avaliação ou aprovado.
5. Ler os documentos, arquivos, código, PRs e decisões diretamente relacionados ao recorte.
6. Consultar o GitHub antes de declarar ausência de documentação do projeto.

Não usar cópia incorporada ou memória como substituta das fontes canônicas do repositório.

## Preparar o briefing

Confirmar no material disponível:

1. fonte ou estado atual;
2. problema ou necessidade;
3. resultado esperado;
4. critérios de sucesso;
5. arquivos a criar ou alterar;
6. arquivos, áreas e comportamentos que não podem ser alterados;
7. impacto visual ou frontend, somente quando aplicável;
8. limites e regras de parada;
9. validações aplicáveis;
10. evidências exigidas na entrega final.

Confirmar que o briefing pertence ao caso, fase, branch e arquivos-alvo corretos. Não adaptar briefing de outro caso por inferência.

Se faltar fonte, permissão, decisão ou contexto indispensável, parar e pedir exatamente o dado ausente.

## Produzir o briefing

1. Aplicar a estrutura vigente de `docs/template-briefing-codex.md`.
2. Descrever o resultado esperado, sem prescrever implementação não sustentada pelas fontes.
3. Informar paths concretos quando forem conhecidos.
4. Preencher a seção visual somente quando houver impacto visual ou frontend.
5. Referenciar `AGENTS.md` para regras operacionais, Git e publicação; não duplicar seu conteúdo no briefing.
6. Exigir apenas validações aplicáveis ao recorte e justificar as não aplicáveis; quando houver prompt consumido por IA, exigir `$lp-factory-criar-prompt` como subfluxo somente leitura antes da edição do artefato e validar seus casos representativos.
7. Incluir regras de parada específicas quando a tarefa depender de fonte, permissão ou decisão ainda ausente.
8. Preservar estrutura, numeração e ordem de documentos existentes quando o briefing determinar sua alteração.
9. Não inventar branch, rota, banco, job, agente, automação, engine ou infraestrutura.

## Entrega

Entregar:

1. o briefing completo e pronto para ser enviado ao Codex;
2. as fontes utilizadas, quando não estiverem suficientemente explícitas dentro do briefing;
3. bloqueios ou dados faltantes, quando houver.

## Limites

Não executar a implementação; não criar ou alterar arquivos, branch, commit ou PR; não substituir `AGENTS.md`; não produzir prompt conceitual para outro papel; não ampliar o escopo além das fontes e decisões aprovadas.

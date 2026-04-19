Título:

1) Objetivo

Esta lousa se baseia no repositório, mas não o espelha.
Ela registra o caso de uso atual, suas decisões, ambiguidades, propostas, fluxo e esboço de execução.

1.1 Estrutura da lousa

usar bullets no último nível de cada seção

evitar excesso de numeração para reduzir poluição visual

cada esboço deve ter no título o subitem correspondente que já está ou estará no roadmap, iniciado por E

cada esboço deve ser refinado até virar um plano base pronto para envio ao Executor

2) Fontes

2.1 Docs alvos

docs/roadmap.md

docs/base-tecnica.md

docs/schema.md

docs/design-system.md

2.2 Docs de apoio e watchlist

docs/prompt-executor.md

docs/prompt-abc.md

docs/template-briefing-codex.md

docs/supa-up.md

docs/vercel-up.md

docs/auto-agentes-up.md

2.3 Fontes operacionais validadas

2.3.1 Repositório GitHub

acesso confirmado ao repositório AlcinoAfonso/LP-Factory-10

nível validado no repositório: leitura e inspeção do repositório real

inclui: buscar arquivos, abrir arquivos, ler conteúdo, confirmar paths e artefatos versionados

não assumir capacidade mutável no repositório sem teste explícito no caso

2.3.2 Vercel

acesso confirmado ao workspace e aos projetos da Vercel do LP Factory 10

projetos já validados: lp-factory-10 e lpf-10-services

nível validado na Vercel até aqui: inspeção operacional

inclui: listar team, listar projetos, ler metadados de projeto, listar deploys, ler deployment por ID e ler build logs

não assumir aqui capacidade de alterar settings, variáveis, domínios ou disparar deploy sem teste explícito no caso

3) Regras

3.1 Regra dos planos base dos casos

3.1.1 Como gerar o plano base do caso

o plano base do caso deve ser gerado em cima do esboço já definido na lousa

deve recortar apenas a etapa correspondente

deve apontar os documentos canônicos da etapa

deve trazer um objetivo bem traçado, deixando claro o que a etapa entrega e o que fica fora dela

pode incluir insights do que pode precisar ser investigado no repositório, quando isso ajudar a preparar melhor a execução

não deve reescrever o fluxo operacional do docs/prompt-executor.md

3.1.2 Instruções ao Executor

você é o executor deste caso

você tem acesso direto, via conectores já configurados, ao GitHub AlcinoAfonso/LP-Factory-10, branch main, onde estão os docs deste caso

acessar docs/prompt-executor.md

usar como plano base: o item 6.x correspondente em: docs/lousa-estrategista-E12.md

usar esta lousa também como visão geral do caso, se necessário

3.1.3 Após receber o relatório do executor

3.1.3.1 Etapa 1

ajustar a lousa com base no relatório recebido do executor

após concluir a etapa 1, a IA deve parar e aguardar comando do proprietário do produto para seguir

3.1.3.2 Etapa 2

debater com o proprietário do produto os casos de uso propostos pelo executor

após concluir a etapa 2, a IA deve parar e aguardar comando do proprietário do produto para seguir

3.1.3.3 Etapa 3

a IA deve gerar o ABC de cada doc coberto por docs/prompt-abc.md, com base no relatório do executor, na lousa já ajustada, na definição sobre novo caso de uso e em docs/prompt-abc.md

para os docs cobertos por docs/prompt-abc.md, a IA deve seguir esse documento e entregar um ABC por vez

após concluir cada ABC, a IA deve parar e aguardar comando do proprietário do produto para seguir

3.1.3.4 Etapa 4

avaliar se docs/design-system.md precisa de ajuste documental próprio

se precisar, entregar o ajuste correspondente

após concluir a etapa 4, a IA deve parar e aguardar comando do proprietário do produto para seguir

4) Caso de uso atual — E12 Admin Dashboard

4.1 Objetivo do caso de uso

4.2 Definido, mas ainda não registrado/implementado

4.3 Ambiguidades / aperfeiçoamento

4.4 Propostas abertas

4.5 Adjacências

5) Fluxo do caso

6) Esboços / planos base do caso



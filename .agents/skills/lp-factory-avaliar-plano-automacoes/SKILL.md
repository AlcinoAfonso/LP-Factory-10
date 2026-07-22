---
name: lp-factory-avaliar-plano-automacoes
description: Avaliar automações, fluxos com IA, agentes, workflows, jobs, rotinas recorrentes, integrações e services previstos em um plano-base do LP Factory 10 por meio do custom agent gestor-automacoes. Usar quando o plano contiver ao menos uma fase marcada como `Automação: sim` ou quando o humano pedir o parecer desse especialista.
---

# Avaliar automações do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-automacoes` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar repositório, worktree, branch e estado Git.
2. Resolver a fonte sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; selecionar automaticamente somente quando houver exatamente um `docs/lousa-plano-base-*.md`; obter seu conteúdo integral pelo head SHA;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
3. Ler o plano completo e identificar as fases marcadas exatamente como `Automação: sim`.
4. Se nenhuma fase estiver marcada assim, devolver `Gestor de Automações: N/A — nenhuma fase com Automação: sim`, sem iniciar o agente.
5. Para cada fase aplicável, registrar identificador canônico, objetivo, escopo, limites, critérios de aceite e automações, integrações ou services mencionados.
6. Confirmar `docs/gestor-automations.md`; deixar ao agente a seleção das demais fontes competentes.
7. Parar e pedir somente o dado ausente se a seleção do plano ou das fases continuar ambígua.
8. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Iniciar exatamente um subagent `gestor-automacoes`.
2. Entregar worktree, branch, metadados da fonte, path, conteúdo integral, caso e fases aplicáveis.
3. Não repetir critérios de automação no handoff: o contrato runtime está em `.codex/agents/gestor-automacoes.toml` e a governança em `docs/gestor-automations.md`.
4. Aguardar o parecer sem realizar avaliação paralela.
5. Validar identificação, fontes, um veredito permitido, classificação, ambiente, necessidade de OpenAI, decisão, patches e próximo passo.
6. Em `automação aplicável com patches autossuficientes`, exigir patch completo para cada decisão aprovada. Em `requer investigação factual`, exigir evidência faltante e forma de obtê-la. Em `requer validação material pelo Analista`, exigir decisão material e alternativas verificáveis, sem abrir gate humano neste estágio.
7. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
8. Confirmar novamente o estado Git e distinguir alterações preexistentes.
9. Exibir o parecer integral, seguido apenas de plano e fases avaliados, veredito, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano, fontes ou PR; criar branch, commit ou PR; pesquisar recursos sem caso concreto; implementar; consolidar v2; acionar outro especialista; decidir pelo Analista ou executar fases.

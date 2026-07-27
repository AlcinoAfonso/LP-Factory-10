---
name: lp-factory-avaliar-plano-updates
description: Avaliar updates aplicáveis a um plano-base, fase ou recorte do LP Factory 10 por meio do custom agent gestor-updates. Usar quando o humano ou o orquestrador informar um PR ou path e pedir avaliação pelo Gestor de Updates, seleção de updates para o recorte ou teste desse especialista.
---

# Avaliar updates do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-updates` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar repositório, worktree, branch e estado Git.
2. Resolver a fonte sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; selecionar automaticamente somente quando houver exatamente um `docs/lousa-plano-base-*.md`; obter seu conteúdo integral pelo head SHA;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
3. Confirmar o plano completo como recorte padrão; aceitar fase ou recorte parcial somente quando informado explicitamente.
4. Confirmar a existência dos quatro catálogos obrigatórios: `docs/supa-up.md`, `docs/vercel-up.md`, `docs/github-up.md` e `docs/prod-up.md`.
5. Parar e pedir somente o dado ausente se a seleção continuar ambígua ou faltar fonte obrigatória.
6. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Iniciar exatamente um subagent `gestor-updates`.
2. Entregar worktree, branch, metadados da fonte, path, conteúdo integral, caso e recorte.
3. Não repetir critérios de updates no handoff: o contrato runtime está em `.codex/agents/gestor-updates.toml`.
4. Aguardar o parecer sem realizar avaliação de updates paralela.
5. Validar identificação, fontes, aderência ao `README.md`, veredito, próximo passo e, para cada elegível, relação com a stack, horizonte e um destino permitido pelo contrato runtime. Exigir hipótese, complexidade líquida, gatilho e limite de não implementação para cada oportunidade estratégica condicional; não aceitar descarte baseado apenas em estar fora do MVP ou em complexidade genérica.
6. Exigir patch completo para cada aprovado, evidência faltante e forma de obtê-la em `requer investigação` e, em bloqueio, a falta exata de autoridade, definição indispensável ou ampliação de escopo. Materialidade, alternativas técnicas ou tecnologia futura, isoladamente, não completam um bloqueio.
7. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
8. Confirmar novamente o estado Git e distinguir alterações preexistentes.
9. Exibir o parecer integral, seguido apenas de plano avaliado, veredito, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano, catálogos ou PR; criar branch, commit ou PR; manter catálogos; produzir briefing ao Executor; acionar outro especialista; consolidar v2; ou executar fases.

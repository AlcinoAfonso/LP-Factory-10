---
name: lp-factory-avaliar-plano-updates
description: Avaliar updates aplicáveis a um plano-base, fase ou recorte do LP Factory 10 por meio do custom agent gestor-updates, incluindo modernizações não previstas na v1 quando melhorarem tecnicamente o mesmo resultado funcional. Usar quando o humano ou o orquestrador pedir avaliação pelo Gestor de Updates.
---

# Avaliar updates do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-updates` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar repositório, worktree, branch e estado Git.
2. Resolver a fonte sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; selecionar automaticamente somente quando houver exatamente um `docs/lousa-plano-base-*.md`; obter seu conteúdo integral pelo head SHA;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
3. Confirmar o plano completo como recorte padrão; aceitar fase ou recorte parcial somente quando informado explicitamente.
4. Confirmar a existência dos quatro catálogos obrigatórios — `docs/supa-up.md`, `docs/vercel-up.md`, `docs/github-up.md` e `docs/prod-up.md` — e registrar um único `source_repository_sha` imutável do estado do repositório usado para todas as fontes versionadas consultadas pelo Gestor de Updates. Toda fonte versionada deve ser lida nesse SHA; se alguma fonte for deliberadamente fornecida por outra referência, registrar essa exceção explicitamente.
5. Parar e pedir somente o dado ausente se a seleção continuar ambígua ou faltar fonte obrigatória.
6. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Iniciar exatamente um subagent `gestor-updates`.
2. Entregar worktree, branch, metadados da fonte, path, conteúdo integral, caso, recorte e `source_repository_sha`; incluir referência própria somente para eventual fonte versionada deliberadamente fora desse SHA. Quando a especialidade Estrutural for necessária, Updates a precede e seu parecer é entregue como entrada pertinente; não exige baseline estrutural prévio.
3. Não repetir critérios de updates no handoff: o contrato runtime está em `.codex/agents/gestor-updates.toml`.
4. Aguardar o parecer sem realizar avaliação de updates paralela.
5. Validar que o parecer contém identificação, fontes, um veredito permitido, as seções exigidas pelo contrato runtime e próximo passo. Quando o parecer indicar candidato a confronto estrutural, confirmar apenas que a seção correspondente está presente.
6. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
7. Confirmar novamente o estado Git e distinguir alterações preexistentes.
8. Exibir o parecer integral, seguido apenas de plano avaliado, veredito, `source_repository_sha`, eventuais referências excepcionais, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano, catálogos ou PR; criar branch, commit ou PR; manter catálogos; produzir briefing ao Executor; acionar outro especialista; consolidar v2; ou executar fases.

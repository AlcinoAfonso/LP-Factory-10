---
name: lp-factory-avaliar-plano-updates
description: Avaliar updates aplicáveis a um plano-base, fase ou recorte do LP Factory 10 por meio do custom agent gestor-updates, incluindo modernizações não previstas na v1 quando melhorarem tecnicamente o mesmo resultado funcional. Usar quando uma decisão concreta da implementação depender de informação tecnológica atual ainda insuficientemente estabelecida nas fontes do projeto.
---

# Avaliar updates do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-updates` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar repositório, worktree, branch, estado Git e a decisão dependente de informação tecnológica atual não suficientemente estabelecida. Sem esse gatilho, não delegar; não há prioridade padrão. Retorno focal pelos critérios gerais de 3.2 do Executor, incluindo informação nova material, recomendação anterior inaplicável, fechamento de pendência própria, mudança material da solução ou novo impacto no domínio que exija julgamento próprio, sem teto numérico.
2. Resolver a fonte sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; resolver a fonte aprovada recuperável do mesmo caso; selecionar automaticamente uma lousa somente quando houver exatamente um `docs/lousa-plano-base-*.md` no recorte;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
3. Confirmar o plano completo como recorte padrão; aceitar fase ou recorte parcial somente quando informado explicitamente. Confirme acesso à versão indicada; leia integralmente as fontes pertinentes por referência, transportando conteúdo somente se o destinatário não conseguir resolvê-la ou se o julgamento exigir recebê-lo. Fonte mutável sem recuperação durável exige preservar antes o conteúdo aprovado indispensável, conforme 3.1 do Executor.
4. Confirmar a existência dos quatro catálogos obrigatórios — `docs/supa-up.md`, `docs/vercel-up.md`, `docs/github-up.md` e `docs/prod-up.md` — e registrar um único `source_repository_sha` imutável do estado do repositório usado para todas as fontes versionadas consultadas pelo Gestor de Updates. Toda fonte versionada deve ser lida nesse SHA; se alguma fonte for deliberadamente fornecida por outra referência, registrar essa exceção explicitamente.
5. Parar e pedir somente o dado ausente se a seleção continuar ambígua ou faltar fonte obrigatória.
6. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Usar um subagent `gestor-updates` por chamada necessária; em retorno focal, reutilizar a instância quando disponível.
2. Entregar worktree, branch, metadados, referência recuperável da fonte, caso, recorte e `source_repository_sha`, garantindo leitura integral conforme a preparação; incluir referência própria somente para eventual fonte versionada deliberadamente fora desse SHA. Quando a especialidade Estrutural for necessária, Updates a precede e seu parecer original é disponibilizado como entrada pertinente; não exige baseline estrutural prévio.
3. Não repetir critérios de updates no handoff: o contrato runtime está em `.codex/agents/gestor-updates.toml`.
4. Aguardar o parecer sem realizar avaliação de updates paralela.
5. Validar que o parecer contém identificação, fontes, um veredito permitido, as seções exigidas pelo contrato runtime e próximo passo. Quando o parecer indicar candidato a confronto estrutural, confirmar apenas que a seção correspondente está presente.
6. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
7. Confirmar novamente o estado Git e distinguir alterações preexistentes.
8. Preservar e devolver ao Executor o parecer integral, salvo quando o escritor autorizado já tiver preservado duravelmente o original completo e o acesso pelos próximos consumidores estiver comprovado. Nesse caso, devolver a referência recuperável, sem retranscrever o parecer, respeitando a necessidade de acesso/julgamento da preparação. Informar plano avaliado, veredito, `source_repository_sha`, eventuais referências excepcionais, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano, catálogos ou PR; criar branch, commit ou PR; manter catálogos; produzir briefing ao Executor; acionar outro especialista; consolidar v2; ou executar fases.

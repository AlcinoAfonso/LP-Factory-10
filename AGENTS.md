# AGENTS.md

## Referências

* Para execução no Codex App, usar `docs/prompt-codex-app-executor.md`.
* Para estado, decisões e aprendizados sobre Codex, usar `docs/gestor-codex.md`.
* Ao consolidar conteúdo canônico dos documentos cobertos pelo `DOC_ALVO`, usar `docs/prompt-abc.md` para definir residência, escopo e conteúdo permitido.
* Para atualizar casos em `docs/roadmap.md`, aplicar a regra de atualização do roadmap definida em `docs/prompt-abc.md`.

## Regra geral de execução

Antes de executar, identificar:

1. resultado esperado;
2. contexto/fonte;
3. critérios de sucesso;
4. limites e regras de parada;
5. validação esperada.

Não completar lacunas críticas por suposição. Se faltar fonte, arquivo, rota, schema, regra ou contexto necessário para executar com segurança, parar e pedir exatamente o que falta.

## Ambientes Codex

Este repositório pode ser usado por Codex App local e Codex Web/Cloud.

* Codex App local no Windows pode usar o Fluxo Codex App Local descrito em `docs/gestor-codex.md`.
* Codex Web/Cloud não deve usar o Fluxo Codex App Local; deve trabalhar pelo fluxo remoto próprio, PRs e ferramentas disponíveis no ambiente remoto.
* Se o ambiente não estiver claro, perguntar antes de executar operações Git de publicação.

## Regras operacionais

* Não editar nem commitar na `main`. Se estiver na `main` limpa, criar branch dedicada antes de alterar arquivos.
* Usar branch dedicada por tarefa, preferencialmente com prefixo `codex/`.
* Antes de alterar, confirmar branch atual, `git status` e remote correto.
* Quando a `main` local for usada como fonte/base, executar `git pull --ff-only` antes de leitura, comparação ou criação de branch; se houver mudanças locais que impeçam a atualização segura, parar e reportar.
* Não misturar tarefas ou etapas diferentes na mesma branch.
* Não fazer merge local; o merge final deve acontecer somente pelo GitHub Web.
* GitHub Web é a fonte de verdade para PRs, Actions, preview remoto e merge.
* Se houver branch ou mudança local já resolvida por PR mergeado, tratar como resíduo operacional: não commitar, não publicar e orientar limpeza antes de continuar.

## Publicação no Codex App local

* No Codex App local, usar Personalizado (`config.toml`) como modo preferido para tarefas com Git.
* A publicação esperada é `git push`.
* Não configurar `core.sshCommand` durante a tarefa; se o push falhar por SSH, parar e reportar o erro exato.
* Não mexer em `C:\Users\alcin\.ssh`.
* Não usar `StrictHostKeyChecking=no`.
* Não usar GitHub Desktop nem GitHub Connector para publicar, salvo pedido explícito.
* Se GitHub CLI estiver indisponível, entregar link de PR/compare.

## Modo simples

Usar quando a tarefa for isolada e não exigir worktree próprio.

Processo:

1. Verificar branch ativa, `git status` e remote.
2. Criar ou usar branch dedicada a partir da base correta.
3. Editar somente o necessário.
4. Rodar validações aplicáveis.
5. Fazer `git add`, `commit` e publicar conforme o ambiente; no Codex App local, usar `git push`.
6. Entregar PR ou link de PR/compare, quando aplicável.

## Modo robusto

Usar quando a tarefa exigir isolamento, execução em etapas, validação local recorrente, preview ou frente paralela.

Regra-base:

```txt
1 frente robusta = 1 worktree local
1 etapa = 1 branch ativa
1 branch = 1 PR
```

Processo:

1. Abrir no worktree correto.
2. Confirmar worktree, branch ativa, `git status` e remote.
3. Criar branch dedicada para a etapa.
4. Implementar somente a etapa atual.
5. Validar localmente.
6. Fazer `git add`, `commit` e publicar conforme o ambiente; no Codex App local, usar `git push`.
7. Entregar PR ou link de PR/compare, quando aplicável.
8. Após merge, atualizar a base antes da próxima branch.

## Gate pré-PR

Antes de publicar ou abrir PR, validar que:

* a branch contém apenas commits do escopo atual;
* o diff contém apenas arquivos do escopo atual;
* não há alterações acidentais em `.env`, secrets, banco, workflows ou arquivos fora do pedido;
* validações aplicáveis foram executadas ou marcadas como não aplicáveis;
* quando a base local permitir, validar `main..HEAD` para commits e `main...HEAD` para arquivos.

## Preview local

Para impacto visual/frontend:

1. Rodar `npm run dev`.
2. Abrir a URL indicada pelo terminal.
3. Validar tela, comportamento e ausência de erros visíveis.
4. Se `localhost:3000` recusar conexão, verificar se o servidor dev está rodando ou se iniciou em outra porta.

## Sandbox checks

Para tarefas com impacto em código, rodar nesta ordem:

1. `npm ci`
2. `npm run check`

No sandbox do Codex, não incluir `npm run build` na rotina de check.

Para alterações exclusivamente documentais ou de texto, `npm ci` e `npm run check` podem ser considerados não aplicáveis.

## Entrega

A resposta final deve informar:

* arquivos alterados;
* branch usada;
* PR ou link de PR/compare, quando aplicável;
* `npm ci`: executado, não executado ou não aplicável;
* `npm run check`: executado, não executado ou não aplicável;
* observações de bloqueio, fallback ou risco, quando houver.

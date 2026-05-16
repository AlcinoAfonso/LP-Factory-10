# AGENTS.md

## Referências

- Para estruturar pedidos incompletos em padrão outcome-first, usar `docs/template-prompts.md`.
- Para briefings gerais, usar `docs/template-briefing-codex.md`.
- Para execução no Codex App, usar `docs/prompt-codex-app-executor.md`.
- Para impacto visual/frontend, usar também `docs/template-briefing-codex-frontend.md`.

## Modelo operacional Codex App

O Codex App opera em dois modos: **simples** e **robusto**.

Antes de executar, identificar:

1. resultado esperado;
2. contexto/fonte;
3. critérios de sucesso;
4. limites e regras de parada;
5. validação esperada.

### Modo simples

Usar quando a tarefa for isolada e não exigir worktree próprio.

Processo:

1. Criar ou usar branch dedicada com prefixo `codex/`, salvo instrução explícita em contrário.
2. Verificar branch ativa e `git status`.
3. Parar se estiver na `main`, em branch de outro caso ou com mudanças locais não relacionadas.
4. Editar somente o necessário.
5. Publicar PR quando a alteração estiver pronta, salvo instrução explícita em contrário.

### Modo robusto

Usar quando a tarefa exigir isolamento, execução em etapas, validação local recorrente ou preview.

Regra-base:

```txt
1 frente robusta = 1 worktree
1 etapa = 1 branch
1 branch = 1 PR
```

Processo:

1. Abrir o Codex App no worktree da frente.
2. Criar ou usar branch dedicada para a etapa.
3. Verificar worktree, branch ativa e `git status`.
4. Parar se estiver na `main`, em branch de outro caso ou com mudanças locais não relacionadas.
5. Implementar somente a etapa atual.
6. Validar localmente.
7. Publicar PR da etapa quando estiver pronta.
8. Após merge, iniciar a próxima etapa em nova branch baseada na `main` atualizada.

## Git / limites operacionais

- Nunca editar diretamente na `main`.
- Nunca misturar tarefas ou etapas diferentes na mesma branch.
- O merge final deve acontecer somente pelo GitHub Web.
- GitHub Web é a fonte de verdade para PRs, Actions, preview remoto e merge.
- GitHub Desktop é apoio/fallback, não etapa obrigatória.

### Permitido localmente

```txt
git status
git diff
git branch --show-current
git switch
git checkout
git add
git commit
```

Commits locais só são permitidos em branch dedicada, nunca na `main`.

### Proibido no sandbox do Codex App

```txt
git ls-remote
git fetch
git pull
git push
ssh -T git@github.com
```

Motivo: esses comandos foram instáveis no sandbox Windows/Git for Windows.

### Operações remotas

Para operações remotas, usar:

- GitHub Connector do Codex, quando adequado;
- GitHub Web;
- GitHub Desktop ou PowerShell normal fora do sandbox, quando necessário.

Operações remotas incluem publicar branch, abrir/atualizar PR, acompanhar checks e mergear.

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

- arquivos alterados;
- PR criado, quando aplicável;
- `npm ci`: executado, não executado ou não aplicável;
- `npm run check`: executado, não executado ou não aplicável.

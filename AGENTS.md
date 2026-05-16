# AGENTS.md

## Referências de briefing e execução

- Para estruturar pedidos incompletos em padrão outcome-first, usar `docs/template-prompts.md`.
- Para preparar briefings gerais para Codex, usar `docs/template-briefing-codex.md`.
- Para execução de plano-base no Codex App, usar `docs/prompt-codex-app-executor.md`.
- Para tarefas com impacto visual/frontend, usar também `docs/template-briefing-codex-frontend.md`.

## Modelo operacional Codex App

A operação do Codex App deve seguir uma lógica outcome-first:

1. definir o resultado esperado;
2. identificar fontes/contexto;
3. declarar critérios de sucesso;
4. respeitar limites e regras de parada;
5. informar evidência/validação na entrega.

O Codex App tem dois modos de operação: **modo simples** e **modo robusto**.

### Modo simples

Usar para alterações pequenas, documentais ou isoladas.

Exemplos:

- atualizar documentação;
- ajustar prompts;
- alterar arquivos `.md`;
- pequenas correções sem impacto visual;
- mudanças que não exigem preview local.

Regras:

- Toda tarefa simples deve usar uma branch dedicada, com prefixo `codex/`, salvo instrução explícita em contrário.
- Nunca aplicar tarefa simples em branch de tarefa robusta ou de outro caso.
- Antes de editar, verificar branch ativa e `git status`.
- Se estiver na `main`, em branch de outro caso ou com mudanças locais não relacionadas, parar e reportar bloqueio.
- Editar somente os arquivos necessários para o resultado pedido.
- Manter o estilo existente dos arquivos alterados.

Validação:

- Para alterações exclusivamente documentais ou de texto, `npm ci` e `npm run check` podem ser considerados não aplicáveis.
- Se houver impacto em código, seguir a rotina padrão de validação.

### Modo robusto

Usar para frontend, Admin Dashboard, E10.4/E10.5, refatorações, bugs difíceis ou mudanças com múltiplos arquivos.

Regra-base:

```txt
1 frente robusta = 1 worktree
1 etapa = 1 branch
1 branch = 1 PR
```

O worktree isola a frente de trabalho. A branch/PR isola cada etapa aprovada.

Regras:

- Abrir o Codex App no worktree da frente robusta correspondente.
- Cada etapa deve usar uma branch dedicada, com prefixo `codex/`.
- Não misturar etapas diferentes na mesma branch.
- Não manter um PR único por muitos dias quando houver etapas aprováveis separadamente.
- Após merge de uma etapa, a próxima etapa deve começar em nova branch baseada na `main` atualizada.

Validação:

- Rodar a rotina padrão para mudanças com impacto em código.
- Para impacto visual/frontend, rodar preview local e validar a tela antes de publicar PR.

## Git / fluxo operacional

### Regras gerais

- Nunca editar diretamente na `main`.
- Cada tarefa simples ou etapa robusta deve usar uma branch dedicada, com prefixo `codex/`.
- Nunca reutilizar branch de outro chat/caso.
- Não misturar mudanças de tarefas ou etapas diferentes na mesma branch.
- O merge final deve acontecer somente pelo GitHub Web.
- GitHub Web é a fonte de verdade para PRs, GitHub Actions, preview remoto e merge.
- GitHub Desktop não faz parte obrigatória do fluxo operacional; se usado, é apoio visual ou fallback.

### Gate obrigatório antes de editar

Antes de qualquer edição local, verificar:

1. pasta/worktree atual;
2. branch ativa;
3. `git status`;
4. se a branch não é `main`;
5. se a branch corresponde à tarefa/etapa atual;
6. se não há mudanças locais não relacionadas.

Se estiver na `main`, em branch de outro caso ou com mudanças locais não relacionadas, parar e reportar bloqueio antes de editar.

### Edição local no Codex App

O Codex pode editar arquivos localmente quando:

- o usuário estiver usando o Codex App;
- a tarefa estiver em uma branch dedicada;
- o gate pré-edição tiver passado;
- não houver mudanças locais não relacionadas.

Para tarefas robustas, preferir abrir o Codex App diretamente no worktree da frente correspondente.

### Comandos Git locais permitidos

Permitidos para inspeção e trabalho local:

```txt
git status
git diff
git branch --show-current
git switch
git checkout
git add
git commit
```

Commits locais são permitidos apenas em branch dedicada da tarefa/etapa, nunca na `main`.

### Comandos remotos locais proibidos no sandbox

Não usar dentro do sandbox do Codex App:

```txt
git ls-remote
git fetch
git pull
git push
ssh -T git@github.com
```

Motivo: esses comandos foram instáveis no sandbox Windows/Git for Windows.

### Operações remotas

Para operações remotas, usar preferencialmente:

- GitHub Connector do Codex, quando adequado;
- GitHub Web;
- GitHub Desktop ou PowerShell normal fora do sandbox, quando necessário para publicar branch local.

Operações remotas incluem:

- publicar branch;
- abrir PR;
- atualizar PR;
- acompanhar checks;
- mergear PR.

## Preview local

Para tarefas com impacto visual/frontend:

1. Rodar `npm run dev`.
2. Abrir a URL local indicada pelo terminal.
3. Validar tela, comportamento e ausência de erros visíveis.
4. Se `localhost:3000` recusar conexão, verificar se o servidor dev está rodando ou se iniciou em outra porta.

Não assumir que `localhost:3000` está ativo sem iniciar o servidor.

## Sandbox checks (rotina padrão)

Para tarefas com impacto em código, rodar nesta ordem:

1. `npm ci`
2. `npm run check`

No sandbox do Codex, não incluir `npm run build` na rotina de `check`.

## Entrega / validação

A resposta final deve informar o status da validação:

- `npm ci`: executado, não executado ou não aplicável, com motivo quando não passar ou não for executado;
- `npm run check`: executado, não executado ou não aplicável, com motivo quando não passar ou não for executado.

Se a rotina padrão não for rodada, informar explicitamente na entrega final.

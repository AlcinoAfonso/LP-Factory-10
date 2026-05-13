# AGENTS.md

## Sandbox checks (rotina padrão)
Rodar, nesta ordem:

1. `npm ci`
2. `npm run check`

## Observação
- No sandbox do Codex, não incluir `npm run build` na rotina de `check`.

## Referências de briefing e execução

- Para estruturar pedidos incompletos em padrão outcome-first, usar `docs/template-prompts.md`.
- Para preparar briefings gerais para Codex, usar `docs/template-briefing-codex.md`.
- Para execução de plano-base no Codex App, usar `docs/prompt-codex-app-executor.md`.
- Para tarefas com impacto visual/frontend, usar também `docs/template-briefing-codex-frontend.md`.

## GitHub / fluxo remoto

- Não usar Git remoto local dentro do sandbox do Codex:
  - `git ls-remote`
  - `git fetch`
  - `git pull`
  - `git push`
  - `ssh -T git@github.com`

- Para operações remotas, usar o conector GitHub do Codex:
  - criar branch;
  - criar/alterar/remover arquivos em branch de trabalho;
  - criar commit/push via conector;
  - abrir PR contra `main`;
  - entregar link do PR.

- Nunca aplicar alterações diretamente na `main`.

### Fluxo operacional Codex / GitHub Desktop

- Para alterações feitas pelo Codex, o fluxo padrão é remoto:
  - criar branch via conector GitHub;
  - criar/alterar/remover arquivos na branch remota;
  - abrir PR contra `main`;
  - validar via GitHub Actions;
  - mergear pelo GitHub Web.

- O workspace local e o GitHub Desktop devem ser tratados como espelho limpo da `main`:
  - não criar commits locais pelo Codex;
  - não publicar branches locais criadas incidentalmente;
  - não levar alterações locais antigas para `main`;
  - após merge de PR remoto, manter o Desktop em `main`, com `0 changed files`, usando apenas Fetch/Pull.

- O Codex só deve editar arquivos diretamente no workspace local se o usuário pedir explicitamente um fluxo local.

- Se houver mudanças locais no Desktop que já foram resolvidas por PR remoto mergeado, tratá-las como resíduo operacional e orientar descarte, sem commit e sem publish.

### Gate pré-edição no Codex App

Antes de editar arquivos no workspace local, verificar a branch ativa.

- Se estiver em `main`, parar imediatamente.
- Não editar arquivos diretamente na working tree da `main`.
- Usar o conector GitHub para criar uma branch de trabalho e aplicar as alterações.
- Se o conector GitHub não estiver disponível, reportar bloqueio antes de editar.

- Se o conector GitHub não estiver disponível ou falhar, parar e informar o bloqueio. Não tentar substituir por Git remoto local dentro do sandbox.

- Comandos Git locais continuam permitidos quando úteis:
  - `git status`
  - `git diff`
  - inspeção de arquivos locais

- Motivo: Git/SSH local pode falhar dentro do sandbox no Windows, enquanto o fluxo pelo conector GitHub foi validado e é o fluxo operacional desejado para branch, commit, push e PR.

## Entrega / validação

- A resposta final deve informar o status da validação:
  - `npm ci`: executado, não executado ou não aplicável, com motivo quando não passar ou não for executado;
  - `npm run check`: executado, não executado ou não aplicável, com motivo quando não passar ou não for executado.

- Se a rotina padrão não for rodada, informar explicitamente na entrega final.

# AGENTS.md

## Sandbox checks (rotina padrão)
Rodar, nesta ordem:

1. `npm ci`
2. `npm run check`

## Observação
- No sandbox do Codex, não incluir `npm run build` na rotina de `check`.

## Referências de briefing

- Para estruturar pedidos incompletos em padrão outcome-first, usar `docs/template-prompts.md`.
- Para tarefas gerais do Codex, usar `docs/template-briefing-codex.md`.
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

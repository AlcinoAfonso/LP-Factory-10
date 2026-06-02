# Gestor Codex — LP Factory 10

Este documento registra, de forma curta, o estado atual do uso do Codex neste repositório. Ele explica o processo vigente e evita duplicar as regras operacionais de `AGENTS.md`.

## Fluxo Codex App Local

O Fluxo Codex App Local é o modo operacional vigente para tarefas executadas no Codex App local no Windows.

### Estado validado

* Acesso completo ativado destrava escrita em `.git`.
* `git add`, `commit` e `push` funcionaram no clone local.
* O repositório usa `core.sshCommand` local para apontar para `known_hosts` externo.
* O `known_hosts` externo validado fica em `C:/Dev/CodexGitSandboxProbe/github_known_hosts`.
* Não é necessário mexer em `C:\Users\alcin\.ssh`.
* GitHub CLI está indisponível; quando necessário, o Codex entrega link de PR/compare.

### Uso

* Tarefas simples podem usar o clone local principal.
* Frentes paralelas ou duradouras devem usar worktree local dedicada.
* Worktrees podem ser reaproveitadas depois do merge, desde que estejam limpas e atualizadas antes da nova branch.
* O Codex App deve preferir bloco único de PowerShell para reduzir diálogos.
* O humano continua responsável por revisar e fazer merge do PR.

## Outros recursos em acompanhamento

* Worktrees.
* Revisões de código.
* Chrome Plugin / Browser Use.
* Skills.
* Automações.

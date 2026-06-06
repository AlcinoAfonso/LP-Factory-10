# Gestor Codex — LP Factory 10

## 1. Objetivo

Este documento registra o estado de gestão do uso do Codex no LP Factory 10: decisões vigentes, recursos em acompanhamento e próximos testes.

Ele não substitui `AGENTS.md`, que é a fonte oficial das regras operacionais do Codex no repositório.

## 2. Referências operacionais

* Regras operacionais do Codex no repositório: `AGENTS.md`.
* Briefings gerais para Codex: `docs/template-briefing-codex.md`.
* Execução no Codex App: `docs/prompt-codex-app-executor.md`.
* Briefings com impacto visual/frontend: `docs/template-briefing-codex-frontend.md`.
* Template geral de prompts: `docs/template-prompts.md`.

## 3. Superfícies de uso

### Codex App local

* Modo Personalizado (`config.toml`) validado para trabalho Git no Windows.
* Fluxo local com `git push` validado com sucesso.
* Validação completa executada com branch, alteração documental controlada, `npm ci`, `npm run check`, commit, push e link de PR/compare.
* Fluxo principal para tarefas que exigem execução local, preview, validação recorrente ou trabalho em worktree.

### Codex Web/Cloud

* Indicado para tarefas remotas e PRs diretos que não dependem do ambiente local.
* Deve seguir o fluxo remoto próprio, separado do Fluxo Codex App Local.

### GitHub Web

* Fonte de verdade para PRs, Actions, preview remoto e merge.
* O humano continua responsável por revisar e fazer merge.

### GitHub Desktop e GitHub Connector

* GitHub Connector permanece como fallback, não como fluxo principal de publicação do Codex App local.
* GitHub Desktop também não integra o fluxo principal.
* Usar quando houver bloqueio no fluxo local, necessidade específica ou pedido explícito.

## 4. Configurações atuais

* Modo Personalizado (`config.toml`): adotado para tarefas Git no Codex App local.
* GitHub CLI: indisponível ou pendente de adoção.
* Publicação local: segue as regras operacionais de `AGENTS.md`.

## 5. Recursos em acompanhamento

* Worktrees: em acompanhamento para frentes paralelas ou duradouras.
* Revisões de código: acompanhamento como camada adicional de análise, sem substituir revisão humana.
* Chrome Plugin / Browser Use: acompanhamento para validações visuais simples e controladas.
* Computer Use: em avaliação e teste, ainda não aprovado para o fluxo principal.
* Skills: acompanhamento para procedimentos recorrentes e padronizáveis.
* Configurações e Automações: continuam em teste na lousa e ainda não devem ser tratadas como regra definitiva.

## 6. Limitações e decisões vigentes

* O Fluxo Codex App Local em modo Personalizado é o fluxo validado para trabalho Git local neste repositório.
* Git remoto local por `git push` está validado dentro desse fluxo.
* GitHub Connector permanece como fallback para publicação local, não como caminho principal.
* Operações sensíveis, merges e decisões finais continuam sob responsabilidade humana.
* Regras operacionais obrigatórias ficam concentradas exclusivamente em `AGENTS.md`.

## 7. Matriz de uso recomendada

| Situação | Superfície recomendada |
| --- | --- |
| Tarefa simples com execução local | Codex App local em modo Personalizado no clone principal |
| Frente paralela ou duradoura | Codex App local em modo Personalizado e worktree dedicada |
| Tarefa remota sem dependência local | Codex Web/Cloud |
| Revisão, Actions, preview remoto e merge | GitHub Web |
| Bloqueio ou pedido explícito de fallback | GitHub Desktop ou GitHub Connector |

## 8. Pendências e próximos testes

* Validar uso de worktrees em frentes paralelas reais.
* Acompanhar qualidade das revisões de código em PRs relevantes.
* Reavaliar Chrome Plugin / Browser Use em cenários visuais simples.
* Continuar a avaliação do Computer Use antes de qualquer adoção no fluxo principal.
* Identificar candidatos práticos para Skills.
* Manter Configurações e Automações na lousa até que os testes sustentem uma decisão definitiva.
* Avaliar futura adoção do GitHub CLI para criação de PR.

## 9. Modelo para novo registro

```md
### Nome do recurso ou decisão

* Estado atual:
* Quando usar:
* Quando evitar:
* Próximo teste:
* Observações:
```

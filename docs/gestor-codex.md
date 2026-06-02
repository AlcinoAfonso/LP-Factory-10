# Gestor Codex — LP Factory 10

## 1. Objetivo

Este documento registra o estado de gestão do uso do Codex no LP Factory 10: decisões vigentes, recursos em acompanhamento e próximos testes.

Ele não substitui `AGENTS.md`, que é a fonte das regras operacionais do repositório.

## 2. Referências operacionais

* Regras operacionais do Codex no repositório: `AGENTS.md`.
* Briefings gerais para Codex: `docs/template-briefing-codex.md`.
* Execução no Codex App: `docs/prompt-codex-app-executor.md`.
* Briefings com impacto visual/frontend: `docs/template-briefing-codex-frontend.md`.
* Template geral de prompts: `docs/template-prompts.md`.

## 3. Superfícies de uso

### Codex App local

* Uso validado no Windows com Acesso completo ativado e `core.sshCommand` configurado.
* Git remoto local funciona dentro do Fluxo Codex App Local.
* Fluxo principal para tarefas que exigem execução local, preview, validação recorrente ou trabalho em worktree.

### Codex Web/Cloud

* Indicado para tarefas remotas e PRs diretos que não dependem do ambiente local.
* Deve seguir o fluxo remoto próprio, separado do Fluxo Codex App Local.

### GitHub Web

* Fonte de verdade para PRs, Actions, preview remoto e merge.
* O humano continua responsável por revisar e fazer merge.

### GitHub Desktop e GitHub Connector

* Fallbacks, não fluxo principal do Codex App local.
* Usar quando houver bloqueio no fluxo local, necessidade específica ou pedido explícito.

## 4. Configurações atuais

* Full access: adotado para Codex App local neste repositório, com escopo controlado.
* `core.sshCommand`: validado como configuração local necessária para o fluxo do Codex App local.
* GitHub CLI: indisponível; quando necessário, o Codex entrega link de PR/compare.
* Publicação local: segue as regras operacionais de `AGENTS.md`.

## 5. Recursos em acompanhamento

* Worktrees: em acompanhamento para frentes paralelas ou duradouras.
* Revisões de código: acompanhamento como camada adicional de análise, sem substituir revisão humana.
* Chrome Plugin / Browser Use: acompanhamento para validações visuais simples e controladas.
* Skills: acompanhamento para procedimentos recorrentes e padronizáveis.
* Automações: acompanhamento futuro, após estabilização dos fluxos manuais.

## 6. Limitações e decisões vigentes

* O Fluxo Codex App Local é o fluxo principal para execução local neste repositório.
* Git remoto local no Codex App está validado dentro desse fluxo.
* GitHub Desktop e GitHub Connector permanecem como fallback para publicação local, não como caminho principal.
* Operações sensíveis, merges e decisões finais continuam sob responsabilidade humana.
* Regras detalhadas de segurança e publicação ficam concentradas em `AGENTS.md`.

## 7. Matriz de uso recomendada

| Situação | Superfície recomendada |
| --- | --- |
| Tarefa simples com execução local | Codex App local no clone principal |
| Frente paralela ou duradoura | Codex App local em worktree dedicada |
| Tarefa remota sem dependência local | Codex Web/Cloud |
| Revisão, Actions, preview remoto e merge | GitHub Web |
| Bloqueio ou pedido explícito de fallback | GitHub Desktop ou GitHub Connector |

## 8. Pendências e próximos testes

* Validar uso de worktrees em frentes paralelas reais.
* Acompanhar qualidade das revisões de código em PRs relevantes.
* Reavaliar Chrome Plugin / Browser Use em cenários visuais simples.
* Identificar candidatos práticos para Skills.
* Avaliar Automações apenas após estabilização dos fluxos atuais.

## 9. Modelo para novo registro

```md
### Nome do recurso ou decisão

* Estado atual:
* Quando usar:
* Quando evitar:
* Próximo teste:
* Observações:
```

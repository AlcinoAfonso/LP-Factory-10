# Gestor Codex — LP Factory 10

## 1. Objetivo

Este painel resume os recursos do Codex App relevantes para o LP Factory 10, sem repetir as regras operacionais do repositório.

## 2. Referências

Estas fontes concentram regras, execução e detalhes que não precisam ser duplicados aqui.

* `AGENTS.md` — regras operacionais.
* `docs/prompt-codex-app-executor.md` — execução no Codex App.
* `docs/automations.md` — automações.
* `docs/platform-config.md` — configuração da plataforma.

## 3. Configurações

Configurações sustentam o fluxo local adotado para editar, validar e publicar trabalho.

### Modo Personalizado (`config.toml`)

**Aptidão:** trabalho Git local.
**Estado:** adotado.
**Valor:** oferece ambiente controlado para execução e validação.
**Limite:** não substitui `AGENTS.md`.

### Git local e `git push`

**Aptidão:** versionar e publicar branches.
**Estado:** validado.
**Valor:** conclui o fluxo local sem interface gráfica.
**Limite:** requer remote e autenticação válidos.

**Outras configurações:** GitHub Web é a fonte de verdade para PRs, Actions, preview e merge; GitHub Desktop está fora do fluxo principal; não há hooks, conexões ou worktrees ativos.

## 4. Plugins

Plugins aproximam serviços externos das tarefas de investigação e execução.

### Supabase Plugin

**Aptidão:** leitura e escrita no Supabase.
**Estado:** em teste; leitura aprovada.
**Valor:** acelera a investigação de schema, tabelas, RLS, policies, views, functions, índices, extensões e migrations.
**Limite:** escrita não testada nem aprovada.

### GitHub Plugin

**Aptidão:** acessar repositórios, branches remotas, PRs, issues, checks e Actions no GitHub.
**Estado:** em teste.
**Valor:** permite investigar branches/PRs e falhas de CI diretamente no GitHub remoto, inclusive quando a branch não está disponível no clone local.
**Limite:** não substitui o fluxo Git local para implementar código nem o GitHub Web como referência final para PR, Actions, preview e merge.

### Vercel Plugin

**Aptidão:** leitura e possível operação/configuração na Vercel.
**Estado:** em teste; leitura aprovada.
**Valor:** acelera diagnóstico de deploys, previews, build logs, runtime, endpoints e configurações Vercel.
**Limite:** escrita, deploy manual, variáveis de ambiente, domínios, settings e ações em produção não testados nem aprovados.

**Disponíveis não adotados:** Slack.

## 5. Skills

Skills podem transformar procedimentos recorrentes em capacidades reutilizáveis.

Nenhuma skill foi adotada formalmente após a reinstalação. Skills do Supabase permanecem no registro do Supabase Plugin para evitar duplicação.

**Disponíveis não adotadas:** Spreadsheets e Presentations.

## 6. Automações

Automações podem reduzir o acionamento manual de rotinas recorrentes.

Nenhuma automação do Codex App foi criada; novos casos devem seguir `docs/automations.md`.

## 7. Uso do computador e navegador

Esses recursos podem ampliar validações visuais e interações fora do terminal.

**Disponíveis não adotados:** Computer Use e Chrome. O navegador integrado está disponível, mas ainda não tem adoção final.

## 8. Agents SDK / Workspace Agents

Agentes podem coordenar fluxos especializados quando a complexidade justificar essa camada.

### Agents SDK / Workspace Agents

**Aptidão:** desenvolver e organizar agentes especializados.
**Estado:** pendentes de avaliação.
**Valor:** poderão coordenar responsabilidades e fluxos complexos.
**Limite:** ainda não há caso de uso aprovado.

**Legado:** Agent Builder; manter apenas como referência e não expandir.

## 9. Próximos testes

Os testes devem gerar evidência suficiente para adotar, limitar ou descartar recursos.

1. Validar uma worktree em uma frente paralela real.
2. Ampliar testes de leitura do Supabase Plugin, sem escrita.
3. Selecionar um procedimento candidato a skill ou automação.
4. Comparar Chrome e navegador integrado em uma validação visual.
5. Avaliar um caso concreto para Agents SDK ou Workspace Agents.

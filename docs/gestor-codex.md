# Gestor Codex — LP Factory 10

## 1. Objetivo

Este documento registra o estado atual de uso do Codex no LP Factory 10.

O foco é manter uma referência enxuta sobre:

- recursos do Codex em uso ou avaliação;
- configurações atuais;
- limitações conhecidas;
- decisões vigentes;
- próximos testes.

Este documento não substitui:

- `AGENTS.md`, que concentra regras operacionais permanentes do repositório;
- `docs/template-briefing-codex.md`, que concentra padrões de briefing;
- documentação oficial da OpenAI;
- revisão humana antes de merge.

## 2. Referências operacionais

- Regras permanentes do Codex no repositório: `AGENTS.md`.
- Briefings gerais para Codex: `docs/template-briefing-codex.md`.
- Execução no Codex App: `docs/prompt-codex-app-executor.md`.
- Briefings com impacto visual/frontend: `docs/template-briefing-codex-frontend.md`.
- Template geral de prompts: `docs/template-prompts.md`.

Este documento deve evitar duplicar essas fontes.

## 3. Superfícies de uso

### 3.1 Codex Web

- Melhor para tarefas paralelas, PRs diretos e alterações que não exigem preview local.
- Reduz atrito com clone local, GitHub Desktop e worktrees.
- Status: `validado`.

### 3.2 Codex App

- Melhor para modo robusto, preview local, validação local recorrente e uso de worktrees quando necessário.
- Ainda não fecha sozinho o ciclo remoto completo dentro do sandbox.
- Status: `em teste`.

### 3.3 GitHub Web

- Fonte de verdade para PRs, Actions, Preview remoto e merge.
- Status: `adotado`.

### 3.4 GitHub Desktop

- Painel local para modo robusto quando necessário.
- Usado para confirmar estado local, revisar diff, publicar branch dedicada e limpar resíduo operacional.
- Não deve implementar, decidir escopo ou virar rotina para separar mudanças misturadas.
- Status: `apoio/fallback`.

## 4. Configurações atuais

### 4.1 GitHub Connector

- Usado para operações remotas quando adequado.
- Preferido quando não há necessidade de execução local.
- Status: `validado`.

### 4.2 Revisões de código

- Revisão automática: ligada.
- Acionador: ao abrir PR.
- Revisão exaustiva: desligada.
- Uso de créditos: desligado.
- Uso atual: camada extra de análise, sem substituir Actions, Preview ou revisão humana.
- Status: `validado como configuração inicial`.

### 4.3 Chrome Plugin / Browser Use

- Instalado e parcialmente funcional no Windows.
- Uso experimental apenas em páginas públicas ou previews simples.
- Não usar com login, credenciais, dados reais ou ações sensíveis.
- Não substitui QA visual completo.
- Status: `em teste`.

### 4.4 Full access

- Não adotado por padrão.
- Avaliar apenas com necessidade explícita e risco controlado.
- Status: `não adotado agora`.

## 5. Recursos do Codex

### 5.1 Worktrees

- Worktree é isolamento local para frentes paralelas no Codex App.
- Não é a multitarefa em si; é o mecanismo que torna a multitarefa local mais segura.
- Relação prática:
  - worktree = área local isolada;
  - branch = linha de trabalho;
  - PR = unidade de revisão, validação e merge.
- Usar quando houver frentes robustas simultâneas ou comparação de alternativas.
- Evitar quando um PR direto via Codex Web/Connector resolver com menos atrito.
- Status: `em teste`.

### 5.2 Plugins

- Conectam o Codex a ferramentas externas ou capacidades adicionais.
- Exemplos relevantes hoje: GitHub Connector e Chrome Plugin.
- Devem começar com escopo claro, supervisão humana e baixo risco.
- Status: `em avaliação`.

### 5.3 Skills

- Procedimentos reutilizáveis para tarefas recorrentes.
- Não substituem `AGENTS.md` nem briefings específicos.
- Candidatos futuros:
  - avaliar entrega do Codex;
  - revisar PR;
  - montar checklist de QA;
  - preparar briefing a partir de intenção inicial.
- Status: `disponível / ainda não adotado`.

### 5.4 Automações

- Execuções recorrentes ou condicionais.
- Ainda não adotadas como fluxo principal.
- Só considerar após estabilizar o processo manual e reduzir risco operacional.
- Status: `não adotado agora`.

## 6. Limitações conhecidas

### 6.1 Git remoto no sandbox do Codex App

A limitação atual não é acesso geral ao computador. O Codex App consegue editar e validar arquivos no workspace local.

O problema está nas operações Git remotas locais dentro do sandbox, como:

- `git fetch`
- `git pull`
- `git push`
- `git ls-remote`
- `ssh -T git@github.com`

Mesmo com rede habilitada, essas operações podem exigir escrita em áreas internas do Git, como `.git`, `FETCH_HEAD`, refs remotas e arquivos de lock. Por isso, o Codex App ainda não fecha sozinho o ciclo remoto completo de atualizar base, publicar branch e abrir fluxo de PR sem apoio externo.

Decisão vigente:

- não usar Git remoto local dentro do sandbox;
- usar GitHub Connector, GitHub Web, GitHub Desktop ou PowerShell normal fora do sandbox, conforme o caso;
- investigar se existe configuração oficial segura para permitir Git remoto local completo sem usar modo inseguro/full access.

### 6.2 Mistura de alterações locais

- Risco principal do Codex App quando várias tarefas usam o mesmo workspace sem isolamento.
- Prevenção principal: seguir `AGENTS.md`, usar branch dedicada e worktree quando houver frentes paralelas reais.

### 6.3 Resíduo pós-merge

- Branch ou mudança local já resolvida por PR mergeado deve ser tratada como resíduo operacional.
- Não commitar nem publicar; limpar antes de nova tarefa.

### 6.4 Commit local no modo robusto

- Commit local é checkpoint opcional, não requisito obrigatório.
- PR é a unidade real de publicação e validação.

## 7. Decisões vigentes

### 7.1 Adotado

- GitHub Web como fonte de verdade para merge.
- PR como unidade de validação.
- Codex Web para tarefas paralelas simples.
- Codex App para modo robusto quando houver ganho real.
- Revisão automática ao abrir PR.

### 7.2 Em teste

- Worktrees no Codex App.
- Chrome Plugin / Browser Use.
- GitHub Desktop como painel local no modo robusto.
- Skills para procedimentos recorrentes.

### 7.3 Não adotado agora

- Full access por padrão.
- Revisão exaustiva por padrão.
- Uso de créditos extras por padrão.
- Automações como fluxo principal.

## 8. Matriz de uso recomendada

### 8.1 Usar Codex Web quando

- houver várias tarefas paralelas;
- a tarefa puder virar PR direto;
- não houver dependência de preview local.

### 8.2 Usar Codex App quando

- precisar validar localmente;
- precisar de preview local;
- precisar de modo robusto;
- worktree trouxer ganho real de isolamento.

### 8.3 Usar GitHub Desktop quando

- precisar confirmar estado local;
- precisar revisar diff local;
- precisar publicar branch dedicada no modo robusto;
- precisar limpar resíduo operacional.

### 8.4 Usar Worktree quando

- houver duas ou mais frentes robustas simultâneas;
- for necessário comparar alternativas;
- uma tarefa não puder contaminar outra.

### 8.5 Evitar automação quando

- o fluxo ainda exige julgamento humano;
- há risco de alterar produção;
- há credenciais ou dados sensíveis;
- o processo ainda não foi testado manualmente.

## 9. Pendências e próximos testes

- Validar fluxo robusto com GitHub Desktop como painel local.
- Validar worktree em duas frentes reais sem mistura de arquivos.
- Testar revisão automática em PR sensível.
- Reavaliar Chrome Plugin após novos testes de estabilidade.
- Avaliar Skills antes de Automações.

## 10. Modelo para novo registro

```md
### Nome do recurso

- O que é:
  - 
- Uso atual:
  - 
- Quando usar:
  - 
- Quando evitar:
  - 
- Status:
  - 
- Observações:
  - 
```

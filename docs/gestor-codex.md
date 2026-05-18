# Recursos do Codex — LP Factory 10

## 1. Objetivo

Este documento registra, de forma incremental e prática, os recursos do Codex aprendidos/testados no LP Factory 10.

Ele deve crescer conforme novos recursos forem avaliados, testados e compreendidos no contexto real do projeto.

Este documento não substitui:

- `AGENTS.md`;
- briefings de tarefa;
- lousas operacionais;
- documentação oficial da OpenAI.

## 2. Como usar este documento

Use este documento para registrar:

- o que o recurso faz;
- onde ele aparece;
- quando usar;
- quando evitar;
- status no LP Factory 10;
- evidência ou teste realizado;
- observações práticas aprendidas.

Não use este documento para definir regras obrigatórias permanentes do repositório. Regras permanentes devem ficar no `AGENTS.md`.

## 3. Critério para registrar um recurso

Registre um recurso apenas quando houver pelo menos uma destas condições:

- foi visto no Codex App, Codex Web/Cloud ou documentação oficial;
- foi testado no LP Factory 10;
- tem potencial claro de uso no projeto;
- gerou dúvida operacional relevante;
- precisa ser acompanhado antes de adoção.

## 4. Status possíveis

Use um dos status abaixo:

- `validado`: testado e útil no fluxo atual;
- `em teste`: ainda em avaliação;
- `disponível`: conhecido, mas ainda não testado;
- `não adotado`: conhecido, mas não recomendado agora;
- `bloqueado`: depende de correção, acesso ou condição externa.

## 5. Recursos validados

### 5.1 GitHub Connector

- O que é:
  - Conector usado pelo Codex para operar no GitHub sem depender de Git remoto local dentro do sandbox.
- Onde fica:
  - Codex / ChatGPT Connectors.
- Como usamos:
  - criar branch;
  - criar/alterar/remover arquivos em branch de trabalho;
  - criar commit/push via conector;
  - abrir PR contra `main`.
- Quando usar:
  - tarefas que precisam gerar PR;
  - alterações documentais;
  - alterações controladas em arquivos do repositório.
- Quando evitar:
  - alterações sem briefing claro;
  - alterações diretas na `main`;
  - ações sensíveis fora do escopo autorizado.
- Status:
  - `validado`.
- Evidência/teste feito:
  - PR temporário criado via conector com branch, arquivo, commit/push e PR.
- Observações:
  - regras permanentes do fluxo remoto estão em `AGENTS.md`.

## 6. Recursos em teste

### 6.1 Codex App

- O que é:
  - Aplicativo local do Codex para trabalhar com repositório, agentes, execução supervisionada e tarefas locais.
- Onde fica:
  - Codex App no ambiente local.
- Como usamos:
  - análise técnica;
  - edição controlada;
  - checks locais;
  - execução supervisionada;
  - testes multiagente.
- Quando usar:
  - tarefas que se beneficiam de inspeção local;
  - execução com acompanhamento;
  - avaliação de recursos novos do Codex.
- Quando evitar:
  - quando o fluxo via Codex Web/Cloud for mais simples;
  - quando a tarefa puder ser resolvida com PR rápido via conector;
  - quando exigir Git remoto local dentro do sandbox.
- Status:
  - `em teste`.
- Evidência/teste feito:
  - ambiente local configurado e checks locais validados.
- Observações:
  - fluxo remoto GitHub segue `AGENTS.md`.

### 6.2 Worktrees

- O que é:
  - Recurso de isolamento local para permitir que diferentes tarefas trabalhem em áreas de trabalho separadas dentro do Codex App.
  - Worktree não é a multitarefa em si; é o mecanismo que torna a multitarefa local mais segura.
- Onde fica:
  - Codex App / execução local com múltiplos agentes ou tarefas paralelas.
- Como usamos:
  - ainda em avaliação no LP Factory 10;
  - deve ser usado apenas quando cada tarefa tiver área isolada, branch própria e PR próprio;
  - o objetivo é evitar que alterações de tarefas diferentes apareçam misturadas no mesmo clone local ou no GitHub Desktop.
- Diferença entre worktree, branch e PR:
  - branch: linha de trabalho/versionamento no Git;
  - PR: revisão e validação no GitHub Web antes do merge;
  - worktree: área local isolada associada a uma tarefa/branch para evitar mistura de arquivos antes do PR.
- Exemplo prático:
  - Opção A para E10.5 → worktree A → branch A → PR A;
  - Opção B para E10.5 → worktree B → branch B → PR B;
  - Opção C para E10.5 → worktree C → branch C → PR C.
- Quando usar:
  - quando houver duas ou mais tarefas paralelas no Codex App;
  - quando quisermos comparar alternativas para o mesmo caso de uso;
  - quando uma tarefa local não deve contaminar outra;
  - quando cada alternativa precisa gerar seu próprio diff e PR.
- Quando evitar:
  - quando houver apenas uma tarefa simples;
  - quando branch + PR via Codex Web/Cloud ou conector GitHub já resolver com menos risco;
  - quando o Codex App não conseguir garantir isolamento real;
  - quando o processo exigir separação manual de arquivos pelo GitHub Desktop.
- Status:
  - `em teste`.
- Evidência/teste feito:
  - duas tarefas locais no Codex App geraram alterações que apareceram juntas no GitHub Desktop;
  - o problema foi corrigido manualmente separando os arquivos em PRs diferentes;
  - isso mostrou a necessidade de validar worktrees isoladas antes de adotar multitarefa local como padrão.
- Observações:
  - para o LP Factory 10, multitarefa paralela no Codex App só será considerada segura quando cada tarefa gerar branch e PR próprios sem depender do GitHub Desktop para separar arquivos;
  - GitHub Desktop pode ser usado para inspeção ou fallback, mas não deve ser etapa normal para separar alterações misturadas;
  - regras obrigatórias de branch, PR e gate pré-edição continuam centralizadas em `AGENTS.md`.

## 7. Recursos disponíveis, mas ainda não adotados

### 7.1 Revisão automática de PR

- O que é:
  - Recurso de revisão automática de código em PRs.
- Onde fica:
  - Configurações do Codex Web/Cloud.
- Como usamos:
  - ainda não adotado como padrão.
- Quando usar:
  - PRs sensíveis;
  - mudanças com risco maior;
  - segunda camada de revisão antes da revisão humana.
- Quando evitar:
  - PRs simples;
  - alterações documentais pequenas;
  - quando gerar ruído maior que benefício.
- Status:
  - `disponível`.
- Evidência/teste feito:
  - recurso identificado, mas não ativado como padrão.
- Observações:
  - uso recomendado como experimento seletivo.

### 7.2 Browser Use

- O que é:
  - Recurso do Codex/App para uso de navegador em tarefas específicas.
- Onde fica:
  - Configurações/execução do Codex App.
- Como usamos:
  - manter com aprovação.
- Quando usar:
  - apenas quando a tarefa exigir navegação.
- Quando evitar:
  - quando o repositório ou documentação local forem suficientes.
- Status:
  - `disponível`.
- Evidência/teste feito:
  - recurso identificado nas configurações.
- Observações:
  - manter aprovação humana.

## 8. Recursos conhecidos, mas não adotados agora

### 8.1 Full access

- O que é:
  - Modo de acesso mais amplo no Codex App.
- Onde fica:
  - Configurações operacionais do Codex App.
- Como usamos:
  - não adotado no fluxo atual.
- Quando usar:
  - apenas se houver necessidade explícita e risco controlado.
- Quando evitar:
  - por padrão;
  - tarefas documentais;
  - alterações simples;
  - qualquer tarefa sem justificativa técnica clara.
- Status:
  - `não adotado`.
- Evidência/teste feito:
  - decisão operacional atual é manter desativado.
- Observações:
  - avaliar caso a caso.

## 9. Modelo para novo registro

Use este modelo ao adicionar novo recurso:

```md
### X.X Nome do recurso

- O que é:
  - 
- Onde fica:
  - 
- Como usamos:
  - 
- Quando usar:
  - 
- Quando evitar:
  - 
- Status:
  - 
- Evidência/teste feito:
  - 
- Observações:
  - 
```

## 10. Changelog de aprendizagem

- 06/05/2026 — Criação do documento inicial de recursos do Codex.

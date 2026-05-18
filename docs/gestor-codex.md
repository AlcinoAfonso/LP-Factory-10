# Gestor Codex — LP Factory 10

## 1. Objetivo

Este documento registra o estado atual de uso do Codex no LP Factory 10.

O foco é manter uma referência operacional enxuta para:

- recursos disponíveis;
- configurações adotadas;
- fluxos de uso;
- limitações conhecidas;
- aprendizados práticos;
- próximos testes.

Este documento não substitui:

- `AGENTS.md`;
- briefings de tarefa;
- documentação oficial da OpenAI;
- revisão humana antes de merge.

Regras permanentes do repositório devem ficar no `AGENTS.md`.

## 2. Visão geral

O LP Factory 10 usa Codex em duas superfícies principais:

- Codex Web/Cloud: melhor para tarefas paralelas, PRs diretos e alterações que não exigem preview local;
- Codex App: melhor para trabalho local supervisionado, preview local, validação recorrente e uso de worktrees quando necessário.

A decisão vigente é evitar overengineering: usar o caminho mais simples que entregue branch, PR, validação e segurança operacional.

## 3. Configurações atuais

### 3.1 Codex Web

- Uso recomendado:
  - tarefas paralelas;
  - alterações documentais;
  - PRs simples;
  - revisões de código;
  - tarefas que não dependem do clone local.
- Status:
  - `validado`.

### 3.2 Codex App

- Uso recomendado:
  - modo robusto;
  - preview local;
  - validações locais;
  - tarefas com necessidade de inspeção local;
  - uso de worktree quando houver frentes paralelas.
- Limite atual:
  - não usar Git remoto local dentro do sandbox.
- Status:
  - `em teste`.

### 3.3 GitHub Connector

- Uso recomendado:
  - criar branch;
  - alterar arquivos em branch de trabalho;
  - criar commit/push via conector;
  - abrir PR contra `main`.
- Status:
  - `validado`.
- Observação:
  - é o caminho preferencial quando não há necessidade de execução local.

### 3.4 GitHub Desktop

- Uso recomendado:
  - painel local no modo robusto;
  - confirmar branch ativa;
  - confirmar `0 changed files`;
  - revisar diff local;
  - commitar/publicar branch dedicada quando o fluxo local exigir.
- Limites:
  - não deve implementar;
  - não decide escopo;
  - não substitui GitHub Web;
  - não deve virar rotina para separar mudanças misturadas.
- Status:
  - `apoio/fallback`.

### 3.5 Chrome Plugin / Browser Use

- Uso atual:
  - instalado e parcialmente funcional no Windows;
  - uso experimental apenas para páginas públicas/previews simples;
  - sem login, credenciais ou ações sensíveis.
- Limite atual:
  - não substitui QA visual completo.
- Status:
  - `em teste`.

### 3.6 Revisões de código

- Configuração atual:
  - revisão automática ligada;
  - acionador: ao abrir um PR;
  - revisão exaustiva desligada;
  - uso de créditos desligado.
- Uso recomendado:
  - camada extra de análise antes do merge;
  - apoio para PRs com código, auth, Supabase, dashboards e fluxos sensíveis.
- Status:
  - `validado como configuração inicial`.

## 4. Recursos do Codex

### 4.1 Worktrees

- O que é:
  - isolamento local para permitir frentes paralelas no Codex App.
- Relação correta:
  - worktree = área local isolada;
  - branch = linha de trabalho/versionamento;
  - PR = unidade real de revisão, validação e merge.
- Quando usar:
  - duas ou mais frentes robustas simultâneas;
  - comparação de alternativas para o mesmo caso de uso;
  - tarefas que exigem isolamento local.
- Quando evitar:
  - tarefa simples;
  - PR direto via Codex Web/Connector resolve com menos atrito;
  - o processo exige separação manual no GitHub Desktop.
- Status:
  - `em teste`.
- Decisão atual:
  - worktree é viável, mas não deve depender de commit local obrigatório.

### 4.2 Plugins

- O que são:
  - conexões do Codex com ferramentas externas ou capacidades adicionais.
- Exemplos relevantes:
  - GitHub;
  - Chrome / Browser Use;
  - conectores externos disponíveis no ambiente.
- Quando usar:
  - quando reduzem cópia manual;
  - quando fornecem contexto útil;
  - quando permitem ação supervisionada com escopo claro.
- Quando evitar:
  - acesso sensível sem necessidade;
  - ações destrutivas;
  - automação prematura.
- Status:
  - `em avaliação`.

### 4.3 Skills

- O que são:
  - procedimentos reutilizáveis para orientar tarefas recorrentes.
- Diferença prática:
  - `AGENTS.md` define regras permanentes;
  - briefing define a tarefa específica;
  - skill padroniza um procedimento repetível.
- Possíveis usos:
  - avaliar entrega do Codex;
  - criar briefing para Codex;
  - revisar PR;
  - montar checklist de QA;
  - validar aderência ao `AGENTS.md`.
- Status:
  - `disponível / ainda não adotado`.

### 4.4 Automações

- O que são:
  - execuções recorrentes ou acionadas por condição.
- Uso atual:
  - ainda não adotadas como fluxo principal.
- Quando considerar:
  - depois que o processo manual estiver estável;
  - tarefas de baixo risco;
  - rotinas com resultado verificável.
- Quando evitar:
  - operações sensíveis;
  - fluxo Git ainda instável;
  - tarefas que exigem julgamento humano.
- Status:
  - `não adotado agora`.

### 4.5 Revisões de código

- O que é:
  - revisão automática ou acionada pelo Codex em PRs.
- Uso recomendado:
  - apoio antes do merge;
  - triagem de bugs, riscos e inconsistências.
- Limite:
  - não substitui GitHub Actions, Preview Vercel nem decisão humana.
- Status:
  - `validado como apoio`.

### 4.6 Browser Use / Chrome Plugin

- O que é:
  - recurso para o Codex observar/interagir com o Chrome.
- Uso recomendado agora:
  - páginas públicas;
  - previews simples;
  - leitura básica de conteúdo;
  - testes sem login.
- Quando evitar:
  - Supabase;
  - GitHub;
  - Vercel;
  - áreas logadas;
  - ações destrutivas;
  - dados reais.
- Status:
  - `em teste`.

## 5. Fluxos operacionais

### 5.1 Modo simples

Usar quando a tarefa for isolada e não exigir worktree próprio.

Fluxo recomendado:

- Codex Web ou GitHub Connector;
- branch dedicada;
- alteração controlada;
- PR contra `main`;
- validação via GitHub Web.

### 5.2 Modo robusto

Usar quando a tarefa exigir isolamento, validação local recorrente ou preview.

Fluxo recomendado:

- GitHub Desktop prepara estado limpo quando necessário;
- Codex App implementa e valida localmente;
- GitHub Desktop pode revisar diff, commitar e publicar branch dedicada;
- GitHub Web revisa, roda Actions/Preview e faz merge.

Regra operacional:

- 1 frente robusta = 1 worktree;
- 1 etapa = 1 branch;
- 1 branch = 1 PR.

### 5.3 Fluxo com Codex Web

Usar para:

- tarefas paralelas;
- PRs rápidos;
- documentos;
- mudanças sem necessidade de preview local.

Evitar quando:

- precisa rodar app localmente;
- precisa inspeção local recorrente;
- precisa validação visual manual durante implementação.

### 5.4 Fluxo com Codex App + GitHub Desktop

Usar para:

- implementação local supervisionada;
- preview local;
- frentes robustas;
- testes com worktree.

Limites:

- não usar Git remoto local no sandbox;
- não editar `main`;
- não misturar tarefas;
- não usar Desktop como separador manual de mudanças misturadas.

### 5.5 Fluxo com Worktree

Usar quando houver frentes paralelas reais.

Exemplo:

- alternativa A para E10.5 → worktree A → branch A → PR A;
- alternativa B para E10.5 → worktree B → branch B → PR B;
- alternativa C para E10.5 → worktree C → branch C → PR C.

## 6. Problemas e limitações atuais

### 6.1 Git remoto no sandbox do Codex App

- Situação:
  - `git fetch`, `git pull`, `git push`, `git ls-remote` e SSH remoto não devem ser usados dentro do sandbox.
- Impacto:
  - Codex App não fecha sozinho o ciclo remoto completo.
- Contorno atual:
  - usar GitHub Connector, GitHub Web, GitHub Desktop ou PowerShell fora do sandbox conforme o caso.

### 6.2 Mistura de alterações locais

- Situação:
  - tarefas diferentes podem se misturar se usarem o mesmo workspace sem isolamento.
- Prevenção:
  - branch dedicada;
  - worktree quando houver frente paralela;
  - `git status` antes de editar;
  - parar se houver mudança local não relacionada.

### 6.3 Resíduo pós-merge

- Situação:
  - branch ou mudança local já resolvida por PR mergeado pode continuar aparecendo no ambiente local.
- Decisão:
  - tratar como resíduo operacional;
  - não commitar;
  - não publicar;
  - limpar antes de nova tarefa.

### 6.4 Instabilidade do Chrome Plugin

- Situação:
  - leitura básica funcionou;
  - inspeção visual direta ainda ficou instável.
- Decisão:
  - manter experimental;
  - restringir a páginas públicas e testes simples.

### 6.5 Commit local no modo robusto

- Situação:
  - commit local pode falhar ou exigir execução fora do sandbox.
- Decisão:
  - commit local é checkpoint opcional;
  - PR é a unidade real de publicação e validação.

## 7. Aprendizados práticos

### 7.1 O que funciona melhor hoje

- Codex Web para paralelismo e PRs diretos.
- Codex App para implementação local supervisionada.
- GitHub Connector para alterações remotas controladas.
- GitHub Desktop como painel local no modo robusto.
- GitHub Web como fonte de verdade para PR, Actions, Preview e merge.

### 7.2 O que evitar

- Editar `main` diretamente.
- Misturar tarefas na mesma branch.
- Usar Git remoto local dentro do sandbox do Codex App.
- Usar GitHub Desktop para separar mudanças misturadas como rotina.
- Usar Chrome Plugin em áreas logadas ou sensíveis.
- Automatizar fluxos ainda instáveis.

### 7.3 Regra prática atual

Escolher sempre o menor fluxo seguro:

- simples e remoto quando possível;
- robusto/local apenas quando necessário;
- worktree somente quando houver frentes paralelas reais.

## 8. Decisões vigentes

### 8.1 Adotado

- GitHub Web como fonte de verdade para merge.
- PR como unidade de validação.
- Codex Web para tarefas paralelas simples.
- Codex App para modo robusto.
- Revisão de código automática ao abrir PR.

### 8.2 Em teste

- Worktrees no Codex App.
- Chrome Plugin / Browser Use.
- GitHub Desktop como painel local no modo robusto.

### 8.3 Não adotado agora

- Full access por padrão.
- Revisão exaustiva de código por padrão.
- Uso de créditos extras por padrão.
- Automações como fluxo principal.

## 9. Matriz de uso recomendada

### 9.1 Usar Codex Web quando

- houver várias tarefas paralelas;
- a tarefa puder virar PR direto;
- não houver dependência de preview local.

### 9.2 Usar Codex App quando

- precisar validar localmente;
- precisar de preview local;
- precisar trabalhar em modo robusto;
- precisar avaliar comportamento antes do PR.

### 9.3 Usar GitHub Desktop quando

- precisar confirmar branch/local limpo;
- precisar revisar diff local;
- precisar commitar/publicar branch dedicada no modo robusto;
- precisar limpar resíduo operacional.

### 9.4 Usar Worktree quando

- houver duas ou mais frentes robustas simultâneas;
- for necessário comparar alternativas;
- uma tarefa não puder contaminar outra.

### 9.5 Evitar automação quando

- o fluxo ainda exige julgamento humano;
- há risco de alterar produção;
- há credenciais ou dados sensíveis;
- o processo ainda não foi testado manualmente.

## 10. Padrões de briefing

### 10.1 Codex Web

O briefing deve indicar:

- objetivo;
- arquivos permitidos;
- fontes obrigatórias;
- critérios de sucesso;
- validações esperadas;
- entrega com PR.

### 10.2 Codex App

O briefing deve indicar:

- seguir `AGENTS.md`;
- modo simples ou robusto;
- branch/worktree esperada;
- limites de edição;
- validações locais;
- quando parar.

### 10.3 Revisão de PR

O briefing deve pedir avaliação de:

- escopo;
- arquivos alterados;
- risco;
- checks;
- aderência ao `AGENTS.md`;
- decisão: pronto, depende ajuste ou bloqueado.

### 10.4 Documentação

O briefing deve pedir:

- alterar apenas o documento alvo;
- manter estado atual;
- evitar histórico longo;
- não duplicar regras do `AGENTS.md`;
- informar validações não aplicáveis.

## 11. Pendências e próximos testes

- Validar fluxo robusto com GitHub Desktop como painel local.
- Validar worktree em duas frentes reais sem mistura de arquivos.
- Testar revisão de código automática em PR sensível.
- Reavaliar Chrome Plugin após novos testes de estabilidade.
- Avaliar Skills antes de Automações.

## 12. Modelo para novo registro

```md
### Nome do recurso

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
- Observações:
  - 
```

# AGENTS.md

## Referências

* Para estruturar pedidos incompletos em padrão outcome-first, usar `docs/template-prompts.md`.
* Para briefings gerais, usar `docs/template-briefing-codex.md`.
* Para execução no Codex App, usar `docs/prompt-codex-app-executor.md`.
* Para impacto visual/frontend, usar também `docs/template-briefing-codex-frontend.md`.
* Para estado, decisões e aprendizados sobre Codex, usar `docs/gestor-codex.md`.

## Regra geral de execução

Antes de executar, identificar:

1. resultado esperado;
2. contexto/fonte;
3. critérios de sucesso;
4. limites e regras de parada;
5. validação esperada.

Nunca completar lacunas técnicas por suposição. Se faltar fonte, arquivo, trecho, rota, schema, regra ou contexto necessário, parar e pedir exatamente o que falta.

## Ambientes Codex

Este repositório pode ser usado por Codex App local e Codex Web/Cloud.

Regras:

* Codex App local no Windows pode usar o Fluxo Codex App Local.
* Codex Web/Cloud não deve usar o Fluxo Codex App Local.
* Codex Web/Cloud deve trabalhar pelo fluxo remoto próprio, PRs e ferramentas disponíveis no ambiente remoto.
* Se o ambiente não estiver claro, perguntar antes de executar operações Git de publicação.

## Fluxo Codex App Local

Este fluxo vale apenas para Codex App local no Windows com Acesso completo ativado.

Objetivo:

```txt
branch dedicada → alterações → validações aplicáveis → git add → commit → push → link de PR/compare
```

Regras:

* Não editar diretamente na `main`.
* Usar sempre branch dedicada por tarefa, preferencialmente com prefixo `codex/`.
* Antes de alterar, confirmar branch atual, `git status` e remote correto.
* Parar se estiver na `main`, em branch de outro caso ou com mudanças locais não relacionadas.
* Não misturar tarefas ou etapas diferentes na mesma branch.
* Não fazer merge local.
* O merge final deve acontecer somente pelo GitHub Web.
* GitHub Web é a fonte de verdade para PRs, Actions, preview remoto e merge.

Publicação no Codex App local:

* Usar Git local do próprio Codex App para `git add`, `git commit` e `git push`.
* Usar `core.sshCommand` local já configurado no clone ou worktree.
* Não recriar `known_hosts` em cada tarefa.
* Não mexer em `C:\Users\alcin\.ssh`.
* Não usar `StrictHostKeyChecking=no`.
* Não usar GitHub Desktop nem GitHub Connector para publicar, salvo pedido explícito.
* Se GitHub CLI estiver indisponível, entregar link de PR/compare.

Para reduzir diálogos:

* Agrupar comandos Git em bloco único de PowerShell quando possível.
* Separar comandos apenas quando houver erro, risco ou necessidade de inspeção.

Comando de conferência recomendado:

```powershell
git config --show-origin --get core.sshCommand
```

Se `core.sshCommand` não estiver configurado, parar e reportar. Não tentar recriar `known_hosts` sem pedido explícito.

## Modo simples

Usar quando a tarefa for isolada e não exigir worktree próprio.

Processo:

1. Verificar branch ativa, `git status` e remote.
2. Criar branch dedicada a partir da base correta.
3. Editar somente o necessário.
4. Rodar validações aplicáveis.
5. Fazer `git add`, `commit` e `push`.
6. Entregar link de PR/compare.

## Modo robusto

Usar quando a tarefa exigir isolamento, execução em etapas, validação local recorrente, preview ou frente paralela.

Regra-base:

```txt
1 frente robusta = 1 worktree local
1 etapa = 1 branch ativa
1 branch = 1 PR
```

Regras:

* Worktree pode ser duradoura.
* Cada worktree deve ter apenas uma branch ativa por vez.
* Uma worktree pode ser reaproveitada em novas branches após merge, desde que volte para base limpa e atualizada.
* Não misturar etapas diferentes na mesma branch.
* Não continuar em branch já resolvida por PR mergeado.

Processo:

1. Abrir o Codex App no worktree correto.
2. Confirmar worktree, branch ativa, `git status` e remote.
3. Criar branch dedicada para a etapa.
4. Implementar somente a etapa atual.
5. Validar localmente.
6. Fazer `git add`, `commit` e `push`.
7. Entregar link de PR/compare.
8. Após merge, atualizar a base antes da próxima branch.

## Fallbacks

GitHub Desktop, GitHub Connector, GitHub Web ou PowerShell externo são fallback, não fluxo principal do Codex App local.

Usar fallback quando:

* Acesso completo não estiver ativado.
* `core.sshCommand` local não estiver configurado.
* `git push` falhar por autenticação ou permissão.
* O usuário pedir explicitamente.
* Houver risco de alterar estado local indevido.

Se usar fallback, informar claramente o motivo.

## Resíduos operacionais

Se houver branch ou mudança local já resolvida por PR mergeado, tratar como resíduo operacional:

* não commitar;
* não publicar;
* não misturar com nova tarefa;
* orientar limpeza antes de continuar.

Antes de novo escopo, confirmar:

```txt
branch correta
status limpo
base atualizada
nenhuma mudança local não relacionada
```

## Gate pré-PR

Antes de publicar ou abrir PR, validar que:

* a branch contém apenas commits do escopo atual;
* o diff contém apenas arquivos do escopo atual;
* não há alterações acidentais em `.env`, secrets, banco, workflows ou arquivos fora do pedido;
* validações aplicáveis foram executadas ou marcadas como não aplicáveis.

## Preview local

Para impacto visual/frontend:

1. Rodar `npm run dev`.
2. Abrir a URL indicada pelo terminal.
3. Validar tela, comportamento e ausência de erros visíveis.
4. Se `localhost:3000` recusar conexão, verificar se o servidor dev está rodando ou se iniciou em outra porta.

## Sandbox checks

Para tarefas com impacto em código, rodar nesta ordem:

1. `npm ci`
2. `npm run check`

No sandbox do Codex, não incluir `npm run build` na rotina de check.

Para alterações exclusivamente documentais ou de texto, `npm ci` e `npm run check` podem ser considerados não aplicáveis.

## Entrega

A resposta final deve informar:

* arquivos alterados;
* branch usada;
* PR ou link de PR/compare, quando aplicável;
* `npm ci`: executado, não executado ou não aplicável;
* `npm run check`: executado, não executado ou não aplicável;
* observações de bloqueio, fallback ou risco, quando houver.
# AGENTS.md

## Referências

* Para estruturar pedidos incompletos em padrão outcome-first, usar `docs/template-prompts.md`.
* Para briefings gerais, usar `docs/template-briefing-codex.md`.
* Para execução no Codex App, usar `docs/prompt-codex-app-executor.md`.
* Para impacto visual/frontend, usar também `docs/template-briefing-codex-frontend.md`.
* Para estado, decisões e aprendizados sobre Codex, usar `docs/gestor-codex.md`.

## Regra geral de execução

Antes de executar, identificar:

1. resultado esperado;
2. contexto/fonte;
3. critérios de sucesso;
4. limites e regras de parada;
5. validação esperada.

Nunca completar lacunas técnicas por suposição. Se faltar fonte, arquivo, trecho, rota, schema, regra ou contexto necessário, parar e pedir exatamente o que falta.

## Ambientes Codex

Este repositório pode ser usado por Codex App local e Codex Web/Cloud.

Regras:

* Codex App local no Windows pode usar o Fluxo Codex App Local.
* Codex Web/Cloud não deve usar o Fluxo Codex App Local.
* Codex Web/Cloud deve trabalhar pelo fluxo remoto próprio, PRs e ferramentas disponíveis no ambiente remoto.
* Se o ambiente não estiver claro, perguntar antes de executar operações Git de publicação.

## Fluxo Codex App Local

Este fluxo vale apenas para Codex App local no Windows com Acesso completo ativado.

Objetivo:

```txt
branch dedicada → alterações → validações aplicáveis → git add → commit → push → link de PR/compare
```

Regras:

* Não editar diretamente na `main`.
* Usar sempre branch dedicada por tarefa, preferencialmente com prefixo `codex/`.
* Antes de alterar, confirmar branch atual, `git status` e remote correto.
* Parar se estiver na `main`, em branch de outro caso ou com mudanças locais não relacionadas.
* Não misturar tarefas ou etapas diferentes na mesma branch.
* Não fazer merge local.
* O merge final deve acontecer somente pelo GitHub Web.
* GitHub Web é a fonte de verdade para PRs, Actions, preview remoto e merge.

Publicação no Codex App local:

* Usar Git local do próprio Codex App para `git add`, `git commit` e `git push`.
* Usar `core.sshCommand` local já configurado no clone ou worktree.
* Não recriar `known_hosts` em cada tarefa.
* Não mexer em `C:\Users\alcin\.ssh`.
* Não usar `StrictHostKeyChecking=no`.
* Não usar GitHub Desktop nem GitHub Connector para publicar, salvo pedido explícito.
* Se GitHub CLI estiver indisponível, entregar link de PR/compare.

Para reduzir diálogos:

* Agrupar comandos Git em bloco único de PowerShell quando possível.
* Separar comandos apenas quando houver erro, risco ou necessidade de inspeção.

Comando de conferência recomendado:

```powershell
git config --show-origin --get core.sshCommand
```

Se `core.sshCommand` não estiver configurado, parar e reportar. Não tentar recriar `known_hosts` sem pedido explícito.

## Modo simples

Usar quando a tarefa for isolada e não exigir worktree próprio.

Processo:

1. Verificar branch ativa, `git status` e remote.
2. Criar branch dedicada a partir da base correta.
3. Editar somente o necessário.
4. Rodar validações aplicáveis.
5. Fazer `git add`, `commit` e `push`.
6. Entregar link de PR/compare.

## Modo robusto

Usar quando a tarefa exigir isolamento, execução em etapas, validação local recorrente, preview ou frente paralela.

Regra-base:

```txt
1 frente robusta = 1 worktree local
1 etapa = 1 branch ativa
1 branch = 1 PR
```

Regras:

* Worktree pode ser duradoura.
* Cada worktree deve ter apenas uma branch ativa por vez.
* Uma worktree pode ser reaproveitada em novas branches após merge, desde que volte para base limpa e atualizada.
* Não misturar etapas diferentes na mesma branch.
* Não continuar em branch já resolvida por PR mergeado.

Processo:

1. Abrir o Codex App no worktree correto.
2. Confirmar worktree, branch ativa, `git status` e remote.
3. Criar branch dedicada para a etapa.
4. Implementar somente a etapa atual.
5. Validar localmente.
6. Fazer `git add`, `commit` e `push`.
7. Entregar link de PR/compare.
8. Após merge, atualizar a base antes da próxima branch.

## Fallbacks

GitHub Desktop, GitHub Connector, GitHub Web ou PowerShell externo são fallback, não fluxo principal do Codex App local.

Usar fallback quando:

* Acesso completo não estiver ativado.
* `core.sshCommand` local não estiver configurado.
* `git push` falhar por autenticação ou permissão.
* O usuário pedir explicitamente.
* Houver risco de alterar estado local indevido.

Se usar fallback, informar claramente o motivo.

## Resíduos operacionais

Se houver branch ou mudança local já resolvida por PR mergeado, tratar como resíduo operacional:

* não commitar;
* não publicar;
* não misturar com nova tarefa;
* orientar limpeza antes de continuar.

Antes de novo escopo, confirmar:

```txt
branch correta
status limpo
base atualizada
nenhuma mudança local não relacionada
```

## Gate pré-PR

Antes de publicar ou abrir PR, validar que:

* a branch contém apenas commits do escopo atual;
* o diff contém apenas arquivos do escopo atual;
* não há alterações acidentais em `.env`, secrets, banco, workflows ou arquivos fora do pedido;
* validações aplicáveis foram executadas ou marcadas como não aplicáveis.

## Preview local

Para impacto visual/frontend:

1. Rodar `npm run dev`.
2. Abrir a URL indicada pelo terminal.
3. Validar tela, comportamento e ausência de erros visíveis.
4. Se `localhost:3000` recusar conexão, verificar se o servidor dev está rodando ou se iniciou em outra porta.

## Sandbox checks

Para tarefas com impacto em código, rodar nesta ordem:

1. `npm ci`
2. `npm run check`

No sandbox do Codex, não incluir `npm run build` na rotina de check.

Para alterações exclusivamente documentais ou de texto, `npm ci` e `npm run check` podem ser considerados não aplicáveis.

## Entrega

A resposta final deve informar:

* arquivos alterados;
* branch usada;
* PR ou link de PR/compare, quando aplicável;
* `npm ci`: executado, não executado ou não aplicável;
* `npm run check`: executado, não executado ou não aplicável;
* observações de bloqueio, fallback ou risco, quando houver.

# AGENTS.md

## Regra geral de execução

Antes de executar, confirmar objetivo, fontes, limites e validação esperada.

Não completar lacunas críticas por suposição; se faltar informação necessária para executar com segurança, parar e pedir exatamente o que falta.

## Regras operacionais

Não editar nem commitar na `main`; usar branch dedicada por tarefa ou etapa. Ao usar a `main` local como base, atualizar com `git pull --ff-only`. O merge final deve ocorrer somente pelo GitHub Web. Se o ambiente não estiver claro, perguntar antes de publicar.

## Publicação no Codex App local

Publicar com `git push`. Não alterar configurações SSH durante a tarefa; se o push falhar, parar e informar o erro exato. Se a GitHub CLI estiver indisponível, entregar o link de criação do PR.

## Modo simples

Usar por padrão quando não houver necessidade real de worktree.

Processo:

1. Confirmar branch, `git status` e remote.
2. Atualizar a base e criar branch dedicada.
3. Implementar somente o escopo atual.
4. Executar as validações aplicáveis.
5. Revisar o diff, fazer commit e publicar.
6. Entregar PR ou link de criação do PR.

## Modo robusto

Usar somente quando houver frente paralela ou necessidade real de isolamento.

Regra-base:

```txt
1 frente = 1 worktree
1 etapa = 1 branch
1 branch = 1 PR
```

Após o merge, atualizar a base e criar nova branch na mesma worktree. Não criar outra worktree para continuar a mesma frente.

## Gate pré-PR

Antes de publicar:

* confirmar que commits e arquivos pertencem somente ao escopo atual;
* verificar alterações acidentais, secrets, `.env`, banco e workflows;
* executar ou justificar as validações aplicáveis;
* revisar `main..HEAD` e `main...HEAD`, quando disponíveis.

## Preview local

Em alterações visuais/frontend, executar `npm run dev`, abrir a URL indicada e validar tela, comportamento e erros visíveis. Se a conexão falhar, confirmar se o servidor iniciou e em qual porta.

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

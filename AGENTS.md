# AGENTS.md

## Execução

Antes de executar, confirmar objetivo, fontes, limites e validação esperada.

Não completar lacunas críticas por suposição; se faltar informação necessária, parar e pedir exatamente o que falta.

Antes de executar briefing recebido por chat, confirmar se ele pertence ao caso, fase, branch e arquivos-alvo atuais. Diante de divergência ou dúvida, parar e reportar a incompatibilidade; não adaptar briefing de outro caso por inferência.

Fluxos auxiliares de GitHub devem respeitar estas regras. Em caso de divergência, seguir este documento e informar a incompatibilidade.

## Branch, worktree e publicação

Não editar nem commitar na `main`; usar branch dedicada por tarefa ou etapa. Ao usar a `main` local como base, atualizar com `git pull --ff-only`. Não executar merge sem a autorização definida pelo fluxo responsável. Quando autorizado, usar GitHub Web ou ferramenta GitHub conectada e autorizada. Merge local pela `main` permanece proibido.

Branches e PRs já abertos não precisam ser sincronizados, rebaseados ou atualizados com a `main` apenas porque ela avançou. Em frentes paralelas, essa divergência é normal. Sincronizar somente quando houver conflito apontado pelo GitHub, quando a tarefa depender materialmente de contrato, arquivo ou dependência alterado na `main`, ou por solicitação humana explícita. Não fazer sincronização preventiva por rotina.

Commits internos podem permanecer granulares. Não executar `git push` em cada checkpoint por rotina; agrupar a publicação até um gate que dependa de estado remoto, como review remoto, Preview/QA hospedado ou entrega.

O prefixo de branch `docs/**` é reservado exclusivamente a branches e PRs cujo escopo integral permanecerá documental. Branch que terá código, runtime, migration ou configuração executável não pode usar `docs/**`, mesmo que comece apenas com documentação.

Ao usar worktree, a ausência de secret ou configuração local ignorada pelo Git não comprova indisponibilidade. Quando uma etapa realmente exigir esse recurso, consultar `docs/platform-config.md`; se o mesmo recurso existir no checkout ou projeto-base autorizado e o compartilhamento estiver permitido para o consumidor e ambiente atuais, reutilizá-lo na worktree somente por arquivo local ignorado pelo Git ou mecanismo equivalente já autorizado, materializando apenas o recurso necessário e sem copiar por rotina o arquivo de ambiente inteiro, imprimir, registrar ou versionar o valor. Não buscar nem criar nova credencial por rotina. Parar e pedir decisão apenas se não houver recurso reutilizável aprovado, houver conflito de ambiente ou boundary, ou a fonte exigir isolamento.

Se o ambiente não estiver claro, perguntar antes de publicar.

### Modo simples

Usar por padrão quando não houver necessidade real de isolamento:

1. Confirmar branch, `git status` e remote.
2. Atualizar a base e criar branch dedicada.
3. Implementar somente o escopo atual.
4. Executar as validações aplicáveis.
5. Revisar o diff, fazer commit e publicar.
6. Entregar PR ou link de criação do PR.

### Modo robusto

Usar somente quando houver frente paralela ou necessidade real de isolamento:

```txt
1 frente = 1 worktree
1 etapa = 1 branch
1 branch = 1 PR
```

Após o merge, ao iniciar a próxima etapa, atualizar a base e criar nova branch na mesma worktree. Não criar outra worktree para continuar a mesma frente.

Publicar com `git push`. Não alterar configurações SSH durante a tarefa; se o push falhar, parar e informar o erro exato.

## Edição segura e gate pré-PR

Ao alterar arquivo existente:

1. Ler a versão atual no branch-alvo imediatamente antes da edição e usar seu `sha` quando a ferramenta exigir substituição integral.
2. Preservar estrutura, ordem e conteúdo fora do trecho autorizado.
3. Fazer uma única gravação por arquivo sempre que possível.
4. Revisar imediatamente o diff e confirmar que contém apenas as alterações autorizadas.
5. Antes de uma segunda gravação, reler o arquivo e identificar objetivamente o ajuste ainda necessário.
6. Diante de alteração inesperada, restaurar a versão correta ou parar e informar o problema; não fazer correções sucessivas nem reescrever a branch para ocultá-las.

Antes de publicar:

* confirmar que commits, arquivos e diffs pertencem somente ao escopo atual;
* verificar alterações acidentais, secrets, `.env`, banco e workflows;
* executar ou justificar as validações aplicáveis;
* revisar `main..HEAD` e `main...HEAD`, quando disponíveis.

## GitHub CLI e fallbacks

Para PRs, reviews, comentários, checks, Actions e diffs, usar primeiro os comandos nativos da GitHub CLI (`gh`), preferindo `gh pr`, `gh run`, `gh api`, JSON, `--jq` ou `--template`.

Falha ou indisponibilidade do `gh` não deve interromper criação da branch, implementação, validações, revisão do diff, commit local ou tentativa de `git push`. Verificar autenticação somente quando uma operação remota realmente exigir o `gh`.

Não usar Python, instalar runtimes, alterar `PATH`, aliases, página de código ou configurações do Windows apenas para processar resultados do GitHub. Se um script auxiliar falhar, abandonar o script e usar recursos nativos do `gh`.

Não testar runtimes ou caminhos alternativos sucessivamente sem necessidade explícita do caso.

Se o `gh` não concluir a operação, usar GitHub Plugin ou GitHub Web como fallback. Se a criação do PR não estiver disponível, entregar o link de criação. Parar somente quando nenhum caminho aprovado permitir concluir a operação remota, informando o erro exato.

## Validações

Para tarefas com impacto em código, rodar nesta ordem:

1. `npm ci`
2. `npm run check`

No sandbox do Codex, não incluir `npm run build` na rotina de check.

Para alterações exclusivamente documentais ou de texto, `npm ci` e `npm run check` podem ser considerados não aplicáveis.

Em alterações visuais/frontend, executar `npm run dev`, abrir a URL indicada e validar tela, comportamento e erros visíveis. Se a conexão falhar, confirmar se o servidor iniciou e em qual porta.

## Entrega

A resposta final deve informar:

* arquivos alterados;
* branch usada;
* PR ou link de PR/compare, quando aplicável;
* `npm ci`: executado, não executado ou não aplicável;
* `npm run check`: executado, não executado ou não aplicável;
* bloqueios, fallbacks ou riscos, quando houver.

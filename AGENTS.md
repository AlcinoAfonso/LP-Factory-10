# AGENTS.md

## Execução

Antes de executar, confirmar objetivo, fontes, limites, validação esperada e aderência de qualquer briefing ao caso, fase, branch e arquivos-alvo.

Não preencher lacunas críticas nem adaptar briefing de outro caso por inferência; se faltar dado necessário ou houver divergência/dúvida, parar, pedir exatamente o dado ausente ou reportar a incompatibilidade.

Fluxos auxiliares de GitHub obedecem este documento; divergências devem ser informadas.

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

1. Ler a versão atual no branch-alvo imediatamente antes da edição, usar seu `sha` quando a ferramenta exigir substituição integral, preservar estrutura/ordem/conteúdo fora do trecho autorizado e preferir uma única gravação.
2. Revisar imediatamente o diff e confirmar apenas alterações autorizadas; antes de segunda gravação, reler e identificar o ajuste restante. Diante de alteração inesperada, restaurar ou parar e informar; não fazer correções sucessivas nem reescrever a branch para ocultá-las.
3. Ao alterar regra, contrato ou responsabilidade, reconciliar no mesmo delta apenas os contratos operacionais vigentes afetados e no escopo autorizado: ajustar, consolidar ou remover regra incompatível, redundante, defasada ou sem função; preservar registros/snapshots históricos, não sobrepor regra nova nem reduzir capacidade funcional sem autorização humana explícita.
4. Em contratos e documentação operacional, preferir substituição/consolidação e buscar delta textual líquido neutro ou negativo; crescimento exige necessidade atual demonstrável.

Antes de publicar:

* confirmar que commits/arquivos/diffs pertencem somente ao escopo atual; buscar referências à regra substituída e confirmar autoridade única, sem caminho concorrente ou defasado;
* verificar alterações acidentais, secrets, `.env`, banco e workflows; executar ou justificar validações; revisar `main..HEAD` e `main...HEAD`, quando disponíveis.

## GitHub CLI e fallbacks

Para PRs, reviews, comentários, checks, Actions e diffs, usar primeiro comandos nativos `gh`, preferindo `gh pr`, `gh run`, `gh api`, JSON, `--jq` ou `--template`.

Falha do `gh` não interrompe branch, implementação, validações, diff, commit ou tentativa de `git push`; verificar autenticação só quando a operação remota exigir. Não usar Python, instalar runtimes, alterar `PATH`, aliases, página de código ou configurações do Windows apenas para processar GitHub, nem testar runtimes/caminhos sucessivos sem necessidade explícita; se auxiliar falhar, abandonar e usar `gh`.

Se o `gh` não concluir, usar GitHub Plugin ou Web; se não for possível criar o PR, entregar o link de criação. Parar somente quando nenhum caminho aprovado concluir a operação remota, informando o erro exato.

## Validações

Para tarefas com impacto em código, rodar `npm ci` e depois `npm run check`; no sandbox do Codex, não incluir `npm run build` na rotina de check. Em alterações exclusivamente documentais/texto, os dois checks podem ser não aplicáveis.

Em alterações visuais/frontend, executar `npm run dev`, abrir a URL indicada e validar tela, comportamento e erros visíveis. Se a conexão falhar, confirmar se o servidor iniciou e em qual porta.

Qualquer implementação, revisão ou QA que crie ou altere página/UI de dashboard deve consultar o `docs/design-system.md` vigente e comprovar aderência aos padrões aplicáveis ou exceção funcional já autorizada pelo contrato do plano antes de concluir.

## Entrega

A resposta final deve informar arquivos alterados, branch, PR/link de PR ou compare quando aplicável, estado de `npm ci` e `npm run check` (executado, não executado ou não aplicável) e bloqueios/fallbacks/riscos quando houver.

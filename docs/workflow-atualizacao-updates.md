20/07/2026 — Workflow de Atualização dos Catálogos de Updates

Fontes: chat, repositório e documentos indicados nos itens 2 e 3

## 1. Papel e objetivo

- Manter os catálogos de updates atuais, úteis e baseados em fontes oficiais.
- Entregar, em uma única execução, um draft PR independente para cada catálogo, sem aprovação humana intermediária.

## 2. Documentos-alvo e ordem

1. `docs/supa-up.md`
2. `docs/vercel-up.md`
3. `docs/github-up.md`
4. `docs/prod-up.md`

Cada catálogo deve usar branch própria criada a partir do mesmo SHA inicial de `main`. Somente o documento-alvo pode ser alterado; os demais são referências de leitura para detectar duplicações.

## 3. Fontes

Consultar:

- o documento-alvo no SHA inicial;
- o repositório e os documentos técnicos relacionados aos itens avaliados;
- fontes oficiais externas correspondentes.

Para Supabase, usar documentação, changelog e blog oficiais. Para Vercel, usar fontes oficiais da Vercel, Next.js e React. Para GitHub e produto, seguir as fontes prioritárias definidas nos próprios catálogos.

Fontes secundárias podem apoiar, mas não substituir a fonte oficial.

## 4. Execução

1. Congelar o SHA inicial de `main` e confirmar os quatro documentos-alvo.
2. Para cada catálogo, na ordem do item 2:
   - ler o documento e suas regras de catálogo ativo e IDs; preservar IDs e lacunas históricas, sem renumerar ou reutilizar ID, e atribuir novo ID somente acima do maior ID histórico identificado;
   - verificar no repositório o estado real dos itens e possíveis duplicações, incluindo o uso global e seu registro na Base Técnica;
   - considerar os relatórios e diffs já produzidos nesta execução;
   - pesquisar recursos novos, alterados, deprecados ou superados;
   - classificar itens existentes como manter, ajustar ou remover; remover item globalmente usado somente quando esse uso estiver registrado na Base Técnica; se houver uso real sem registro, classificá-lo como lacuna documental e mantê-lo no catálogo;
   - classificar recursos pesquisados como adicionar ou não adicionar;
   - produzir o relatório obrigatório;
   - criar branch independente, ajustar somente o documento-alvo e validar o diff;
   - abrir um draft PR com o relatório no corpo.
3. Seguir automaticamente ao próximo catálogo, sem aguardar aprovação ou merge.
4. Ao final, entregar os quatro PRs e um resumo de bloqueios ou exceções.

## 5. Relatório obrigatório

1. Veredito.
2. Fontes consultadas.
3. Itens mantidos:
   - IDs.
4. Itens ajustados:
   - ID;
   - ajuste;
   - motivo;
   - fonte.
5. Itens removidos:
   - ID;
   - motivo;
   - evidência.
6. Itens adicionados:
   - ID;
   - título;
   - valor para o projeto;
   - fonte;
   - limite.
7. Itens avaliados e não adicionados:
   - recurso;
   - motivo.
8. Pontos não validados ou lacunas documentais.
9. Validação do diff:
   - confirmar que não houve renumeração, reutilização de ID ou remoção sem evidência documental suficiente.

## 6. Limites e parada

- Não alterar código, roadmap, Base Técnica, schema, configuração ou outro catálogo.
- Não transformar update pesquisado em implementação ou novo escopo do MVP.
- Não adicionar item sem fonte oficial e valor concreto para o LP Factory 10.
- Não realizar merge dos PRs.
- Não criar alteração artificial quando o catálogo não exigir ajuste; registrar a exceção no resumo final.
- Quando faltar fonte obrigatória, houver conflito material ou faltar permissão, informar exatamente o bloqueio e parar.

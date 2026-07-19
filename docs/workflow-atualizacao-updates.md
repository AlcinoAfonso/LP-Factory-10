19/07/2026 — Workflow de Atualização dos Catálogos de Updates

Fontes: chat, `README.md`, `docs/template-prompts.md` e documentos indicados no item 2

## 1. Papel e objetivo

- Manter os catálogos de updates atuais, úteis e baseados em fontes oficiais.
- Concluir um catálogo por vez: avaliar, entregar relatório, ajustar após aprovação e aguardar o merge antes do próximo.

## 2. Documentos-alvo e ordem

1. `docs/supa-up.md`
2. `docs/vercel-up.md`
3. `docs/github-up.md`
4. `docs/prod-up.md`

Durante cada ciclo:

- somente o documento-alvo pode ser alterado;
- os outros catálogos são consultados apenas para detectar duplicações;
- o próximo ciclo começa somente após o merge do anterior.

## 3. Fontes

Consultar:

- o documento-alvo em `main`;
- o repositório e os documentos técnicos relacionados ao conteúdo avaliado;
- fontes oficiais externas correspondentes.

Para Supabase, usar documentação, changelog e blog oficiais. Para Vercel, usar fontes oficiais da Vercel, Next.js e React. Para GitHub e produto, seguir as fontes prioritárias definidas nos próprios catálogos.

Fontes secundárias podem apoiar, mas não substituir a fonte oficial.

## 4. Ciclo por catálogo

1. Ler o documento-alvo e suas regras de catálogo ativo e IDs.
2. Verificar no repositório o estado real dos itens existentes.
3. Pesquisar nas fontes oficiais recursos novos, alterados, deprecados ou superados.
4. Classificar os itens existentes como manter, ajustar ou remover.
5. Classificar os recursos pesquisados como adicionar ou não adicionar.
6. Entregar o relatório e aguardar aprovação humana.
7. Após aprovação, alterar somente o documento-alvo e abrir um draft PR.
8. Conferir o diff, as fontes e o cumprimento das regras do próprio catálogo.
9. Aguardar o merge antes de iniciar o próximo documento.

## 5. Relatório obrigatório

1. Veredito.
2. Fontes consultadas.
3. Itens mantidos:
   - IDs.
4. Itens a ajustar:
   - ID;
   - ajuste;
   - motivo;
   - fonte.
5. Itens a remover:
   - ID;
   - motivo;
   - evidência.
6. Itens a adicionar:
   - ID proposto;
   - título;
   - valor para o projeto;
   - fonte;
   - limite.
7. Itens avaliados e não adicionados:
   - recurso;
   - motivo.
8. Pontos não validados.
9. Próximo passo.

## 6. Limites e parada

- Aplicar as regras de catálogo ativo e IDs do próprio documento-alvo.
- Não alterar código, roadmap, Base Técnica, schema, configuração ou outro catálogo.
- Não transformar update pesquisado em implementação ou novo escopo do MVP.
- Não adicionar item sem fonte oficial e valor concreto para o LP Factory 10.
- Quando faltar fonte, houver conflito documental ou o estado do projeto não puder ser confirmado, declarar o limite e parar.

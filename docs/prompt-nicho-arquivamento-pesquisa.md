# Prompt — Arquivamento de pesquisa bruta por nicho/taxon

## 1. Papel / função

Atue como arquivador de pesquisas brutas do LP Factory 10.

## 2. Objetivo

Arquivar no repositório `AlcinoAfonso/LP-Factory-10` todas as pesquisas brutas fornecidas nesta execução, preservando integralmente o conteúdo e seguindo o padrão de versionamento já adotado em `docs/pesquisas-brutas/`.

## 3. Fonte de verdade

Use como referência de padrão:

- `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md`

Considere como entrada somente as pesquisas fornecidas nesta execução e os metadados confirmados associados a elas.

## 4. Padrão obrigatório de path

Arquive cada pesquisa em:

`docs/pesquisas-brutas/<taxon_slug>/<audience_scope>/vN.md`

Regras:

- `<taxon_slug>` deve corresponder ao slug confirmado do taxon.
- `<audience_scope>` deve ser `business_buyer` ou `end_customer`, conforme a pesquisa.
- `vN.md` representa a versão da pesquisa, não a ordem de upload: preserve versão confirmada; se não houver versão atribuída e for uma nova pesquisa, use a próxima versão disponível no mesmo `taxon_slug + audience_scope`.
- Se o path correspondente a uma versão confirmada já existir, verifique se é a mesma pesquisa; se não for possível confirmar igualdade ou se o conteúdo for distinto, pare e peça decisão humana. Não sobrescreva nem renumere automaticamente.
- Pesquisas distintas devem permanecer em arquivos distintos.

## 5. Tratamento do conteúdo

Para cada pesquisa:

- registre no Markdown arquivado `taxon_slug`, `audience_scope`, `research_version` e a origem;
- se a origem for PDF ou outro formato, converta o conteúdo integral para Markdown;
- preserve conteúdo, fontes, conclusões, limitações, tabelas e estrutura informacional relevante;
- não resumir, reinterpretar, corrigir ou complementar a pesquisa;
- não transformar a pesquisa em itens estruturados, SQL, copy final ou template;
- não inventar conteúdo ausente.

Se algum dado indispensável para determinar o path ou a versão não puder ser confirmado, pare e peça exatamente o dado faltante.

## 6. Git e Pull Request

- Consulte o estado atual do repositório antes de escrever.
- Crie uma branch exclusiva para o arquivamento.
- Adicione somente os arquivos necessários em `docs/pesquisas-brutas/`.
- Crie um PR para `main`.
- Não faça merge.
- Não sincronize ou rebase a branch apenas porque `main` avançou; faça isso somente se houver necessidade material para concluir ou validar o PR.

## 7. Validação final

Antes de concluir, valide no diff:

- todos os arquivos esperados foram adicionados;
- todos os paths seguem `docs/pesquisas-brutas/<taxon_slug>/<audience_scope>/vN.md`;
- cada versão está em arquivo separado;
- nenhuma alteração fora do escopo foi incluída.

## 8. Entrega esperada

Informe somente:

- paths criados;
- número do PR;
- documentação usada como referência;
- qualquer bloqueio real, se existir.

22/07/2026 — Workflow de Atualização dos Catálogos de Updates

Fontes: chat, repositório e documentos indicados nos itens 2 e 3

Referência de estrutura: `docs/template-prompts.md`, com abordagem outcome-first

## 1. Resultado obrigatório e papel

### 1.1. Resultado obrigatório

Ao final de uma única execução, o estado esperado é:

- quatro análises completas, realizadas na ordem do item 2;
- cada catálogo concluído como ciclo fechado antes do início da análise do seguinte;
- um draft PR independente para cada catálogo que exigir ajuste real;
- uma exceção registrada no resumo final para cada catálogo que não exigir ajuste, sem criar alteração artificial;
- todas as branches criadas a partir do mesmo SHA inicial de `main`;
- somente o documento-alvo alterado em cada branch;
- IDs e lacunas históricas preservados, sem renumeração ou reutilização;
- nenhum PR mergeado e nenhuma catalogação transformada em implementação.

A execução somente pode ser declarada integralmente aderente quando a auditoria final confirmar que a sequência realmente executada corresponde a este workflow.

### 1.2. Papel

- Manter os catálogos de updates atuais, úteis e baseados em fontes oficiais.
- Executar o workflow sem aprovação humana intermediária entre os catálogos, respeitando a unidade e a ordem obrigatórias.

### 1.3. Critérios de conclusão

- Os quatro catálogos foram analisados do início ao fim, um de cada vez.
- Cada catálogo possui checkpoint concluído antes do início do seguinte.
- Cada ajuste real possui diff validado e draft PR próprio.
- Cada ausência de ajuste está justificada no resumo final.
- A auditoria final da base, arquivos, IDs, PRs e sequência não encontrou divergência.
- Bloqueios ou exceções estão identificados de forma exata.

## 2. Documentos-alvo, ordem e unidade de execução

### 2.1. Ordem obrigatória

1. `docs/supa-up.md`
2. `docs/vercel-up.md`
3. `docs/github-up.md`
4. `docs/prod-up.md`

### 2.2. Unidade indivisível

Para cada catálogo, a unidade de execução é o ciclo completo:

- leitura;
- verificação dos IDs e das lacunas históricas;
- verificação do repositório e de possíveis duplicações;
- pesquisa;
- avaliação e classificação;
- relatório;
- criação da branch;
- alteração do documento, quando necessária;
- validação do diff;
- abertura do draft PR, quando houver ajuste;
- checkpoint do catálogo.

O ciclo deve ser concluído antes de iniciar leitura analítica, pesquisa, classificação, edição, branch ou PR do catálogo seguinte.

Não é permitido agrupar, paralelizar ou reorganizar etapas entre catálogos. O mesmo SHA inicial serve apenas como base comum das branches e não autoriza processamento em lote.

A consulta pontual aos outros catálogos para detectar duplicações não inicia a análise deles. A análise completa de cada um continua restrita à sua posição na ordem obrigatória.

### 2.3. Isolamento das branches

Cada catálogo deve usar branch própria criada a partir do mesmo SHA inicial de `main`. Somente o documento-alvo pode ser alterado; os demais são referências de leitura para detectar duplicações.

## 3. Fontes

Consultar, dentro do ciclo do catálogo atual:

- o `README.md`, como política geral de avaliação tecnológica;
- o documento-alvo no SHA inicial;
- o repositório e os documentos técnicos relacionados aos itens avaliados;
- os relatórios e diffs dos catálogos anteriores já concluídos nesta execução;
- fontes oficiais externas correspondentes.

Para Supabase, usar documentação, changelog e blog oficiais. Para Vercel, usar fontes oficiais da Vercel, Next.js e React. Para GitHub e produto, seguir as fontes prioritárias definidas nos próprios catálogos.

Fontes secundárias podem apoiar, mas não substituir a fonte oficial.

## 4. Execução

### 4.1. Preparação única

- Congelar o SHA inicial de `main`.
- Confirmar o `README.md` e a existência dos quatro documentos-alvo.
- Registrar a ordem obrigatória.
- Não iniciar leitura analítica ou pesquisa de nenhum catálogo nesta preparação.

### 4.2. Ciclo obrigatório por catálogo

Para cada catálogo, na ordem do item 2:

- ler o `README.md`, o documento-alvo e suas regras de catálogo ativo e IDs;
- identificar o maior ID histórico e todas as lacunas antes de decidir qualquer novo ID;
- preservar IDs e lacunas históricas, sem renumerar ou reutilizar ID, e atribuir novo ID somente acima do maior ID histórico identificado;
- verificar no repositório o estado real dos itens e possíveis duplicações, incluindo o uso global e seu registro na Base Técnica;
- considerar somente os relatórios e diffs dos catálogos anteriores já concluídos nesta execução;
- pesquisar recursos novos, alterados, deprecados ou superados;
- para cada item existente ou recurso pesquisado, identificar:
  - função no projeto e natureza de uso: produto, operação ou desenvolvimento;
  - relação com a stack e a arquitetura: complementar, sobreposto, substituto ou incompatível;
  - caso de uso e valor concreto;
  - maturidade e qualidade das fontes;
  - custo, complexidade, segurança, manutenção, dependências e riscos;
  - horizonte plausível: atual, futuro ou condicional;
  - hipótese de superioridade e gatilho objetivo de comparação ou adoção, quando sobreposto ou substituto;
- classificar itens existentes como manter, ajustar ou remover;
- remover item globalmente usado somente quando esse uso estiver registrado na Base Técnica;
- quando houver uso real sem registro, classificar como lacuna documental e manter o item no catálogo;
- classificar recursos pesquisados como adicionar, não adicionar ou não validado;
- adicionar somente recurso compatível com a política do `README.md`, com fonte oficial, valor concreto e horizonte plausível;
- permitir que recurso futuro ou condicional entre no catálogo mesmo fora do MVP, sem autorizar implementação;
- não adicionar, ou remover quando aplicável, recurso incompatível, duplicado, absorvido, deprecado, superado, sem caso de uso ou valor concreto, com custo ou risco desproporcional sem horizonte plausível, ou sobreposto/substituto sem hipótese concreta de superioridade e gatilho objetivo;
- classificar como não validado quando a fonte oficial ou a evidência necessária para a decisão do item for insuficiente, sem presumir adoção ou descarte;
- produzir o relatório obrigatório;
- criar branch independente a partir do SHA inicial;
- ajustar somente o documento-alvo, quando houver alteração real;
- validar o diff;
- abrir um draft PR com o relatório no corpo, quando houver ajuste;
- concluir o checkpoint do catálogo.

### 4.3. Checkpoint obrigatório por catálogo

Antes de iniciar o catálogo seguinte, registrar:

- catálogo e documento analisados;
- SHA inicial comum;
- maior ID histórico e lacunas preservadas;
- itens mantidos, ajustados, removidos, adicionados, não adicionados e não validados;
- branch criada, quando houver ajuste;
- confirmação de que somente o documento-alvo foi alterado;
- resultado da validação do diff;
- URL do draft PR ou justificativa para ausência de alteração;
- confirmação de que nenhuma etapa analítica do catálogo seguinte foi iniciada.

Somente depois de concluir esse checkpoint, seguir automaticamente ao próximo catálogo, sem aguardar aprovação ou merge.

### 4.4. Auditoria final

Ao final dos quatro ciclos:

- comparar a sequência realmente executada com a ordem e a unidade definidas no item 2;
- confirmar que as quatro análises partiram do mesmo SHA inicial;
- confirmar que cada branch altera somente seu documento-alvo;
- confirmar que os IDs e as lacunas históricas foram preservados;
- confirmar que os PRs permanecem em draft e não foram mergeados;
- confirmar que não houve implementação, mudança de stack, nova infraestrutura ou ampliação de escopo;
- entregar os PRs e um resumo de bloqueios ou exceções.

Se a sequência executada divergir do workflow, não declarar execução integralmente aderente. Informar a divergência e refazer de forma sequencial os ciclos afetados antes da conclusão.

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
   - natureza de uso;
   - relação com a stack e a arquitetura;
   - horizonte;
   - valor para o projeto;
   - gatilho, quando aplicável;
   - fonte;
   - dependências, riscos e limite;
   - confirmação de que o registro não autoriza implementação.
7. Itens avaliados e não adicionados:
   - recurso;
   - motivo objetivo;
   - confirmação de que não foi rejeitado somente por estar fora do MVP.
8. Pontos não validados ou lacunas documentais:
   - item;
   - evidência faltante;
   - forma de validação.
9. Validação do diff:
   - confirmar que não houve renumeração, reutilização de ID ou remoção sem evidência documental suficiente;
   - confirmar aderência à política de avaliação tecnológica do `README.md`;
   - confirmar que nenhum item foi adicionado apenas por ser novo ou moderno;
   - confirmar que nenhum recurso foi descartado somente por estar fora do MVP.
10. Checkpoint de execução:
    - confirmar que o catálogo foi concluído antes do início da análise do seguinte;
    - informar branch e draft PR ou justificar a ausência de alteração.

## 6. Limites e parada

- Não alterar código, roadmap, Base Técnica, schema, configuração ou outro catálogo.
- Não transformar update pesquisado em implementação, mudança de stack, nova infraestrutura ou novo escopo do MVP.
- Não tratar catalogação como decisão de aplicação a um plano-base, fase ou recorte; essa aplicabilidade será recomendada pelo Gestor de Updates e consolidada pelo Estrategista no fluxo competente.
- Não adicionar item sem fonte oficial, valor concreto e compatibilidade com a política tecnológica do `README.md`.
- Não rejeitar item somente por estar fora do MVP; novidade ou modernidade, isoladamente, também não justificam sua entrada.
- Não renumerar IDs nem reutilizar lacunas deixadas por itens excluídos.
- Não pesquisar, analisar, editar ou publicar catálogos em lote ou em paralelo.
- Não realizar merge dos PRs.
- Não criar alteração artificial quando o catálogo não exigir ajuste; registrar a exceção no resumo final.
- Quando faltar fonte obrigatória do workflow, houver conflito material ou faltar permissão, informar exatamente o bloqueio e parar.

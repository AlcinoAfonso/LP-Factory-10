22/07/2026 — Workflow de Atualização dos Catálogos de Updates

Fontes: chat, repositório e documentos indicados nos itens 2 e 3

Referência de estrutura: `docs/template-prompts.md`, com abordagem outcome-first

## 1. Resultado esperado e papel

### 1.1. Resultado esperado

Ao final de uma única execução:

- os quatro catálogos foram analisados na ordem do item 2;
- cada catálogo foi concluído da leitura ao relatório e ao draft PR ou à justificativa antes do início da análise do seguinte, sem processamento em lote ou paralelo;
- cada ajuste real está em branch própria criada do mesmo SHA inicial de `main`, alterando somente o documento-alvo;
- IDs e lacunas históricas foram preservados, sem renumeração ou reutilização;
- ausências de ajuste, bloqueios e exceções foram registradas;
- nenhum PR foi mergeado nem a catalogação transformada em implementação.

### 1.2. Papel

- Manter os catálogos de updates atuais, úteis e baseados em fontes oficiais, sem aprovação humana intermediária entre eles.

## 2. Documentos-alvo e ordem

1. `docs/supa-up.md`
2. `docs/vercel-up.md`
3. `docs/github-up.md`
4. `docs/prod-up.md`

Os demais catálogos podem ser consultados apenas para detectar duplicações. Isso não inicia sua análise.

## 3. Fontes

Consultar, para o catálogo em execução:

- o `README.md`, como política geral de avaliação tecnológica;
- o documento-alvo no SHA inicial;
- o repositório e os documentos técnicos relacionados aos itens avaliados;
- os relatórios e diffs dos catálogos anteriores já concluídos nesta execução;
- fontes oficiais externas correspondentes.

Para Supabase, usar documentação, changelog e blog oficiais. Para Vercel, usar fontes oficiais da Vercel, Next.js e React. Para GitHub e produto, seguir as fontes prioritárias definidas nos próprios catálogos.

Fontes secundárias podem apoiar, mas não substituir a fonte oficial.

## 4. Execução

1. Congelar o SHA inicial de `main` e confirmar o `README.md` e os quatro documentos-alvo.
2. Para cada catálogo, na ordem do item 2, concluir todo o ciclo antes de iniciar a análise do seguinte:
   - ler as fontes aplicáveis e as regras do catálogo;
   - identificar o maior ID histórico e preservar todos os IDs e lacunas, atribuindo novo ID somente acima do maior já utilizado;
   - verificar no repositório o estado real dos itens, duplicações, uso global e registro na Base Técnica;
   - pesquisar recursos novos, alterados, deprecados ou superados;
   - avaliar função, natureza de uso, relação com a stack, caso de uso, valor, maturidade das fontes, custo, complexidade, segurança, manutenção, dependências, riscos e horizonte;
   - exigir hipótese de superioridade e gatilho objetivo para recurso sobreposto ou substituto;
   - classificar itens existentes como manter, ajustar ou remover, e recursos pesquisados como adicionar, não adicionar ou não validado;
   - manter item com uso real sem registro na Base Técnica como lacuna documental; remover item usado globalmente somente quando esse uso estiver documentado;
   - adicionar somente recurso compatível com o `README.md`, com fonte oficial, valor concreto e horizonte plausível; recurso futuro ou condicional pode entrar sem autorizar implementação;
   - não adicionar ou remover, conforme aplicável, recurso incompatível, duplicado, absorvido, deprecado, superado, sem valor concreto ou com custo ou risco desproporcional;
   - classificar como não validado quando faltar fonte oficial ou evidência suficiente;
   - produzir o relatório obrigatório;
   - quando houver ajuste, criar branch do SHA inicial, alterar somente o documento-alvo, validar o diff e abrir draft PR com o relatório;
   - quando não houver ajuste, registrar a justificativa sem criar alteração artificial;
   - confirmar documento, IDs e lacunas, resultado do diff e URL do PR ou justificativa antes de seguir.
3. Seguir automaticamente ao próximo catálogo, sem aguardar aprovação ou merge.
4. Ao final, conferir a sequência executada, a base comum, os arquivos alterados, os IDs e o estado dos PRs. Se houver divergência, informá-la e não declarar execução integralmente aderente.

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
9. Validação:
   - confirmar que o catálogo foi concluído antes do início da análise do seguinte;
   - informar branch e draft PR ou justificar a ausência de alteração;
   - confirmar que não houve renumeração, reutilização de ID ou remoção sem evidência suficiente;
   - confirmar aderência ao `README.md`;
   - confirmar que novidade, modernidade ou distância do MVP não determinaram isoladamente a decisão.

## 6. Limites e parada

- Não alterar código, roadmap, Base Técnica, schema, configuração ou outro catálogo.
- Não transformar catalogação em implementação, mudança de stack, nova infraestrutura ou novo escopo do MVP.
- Não decidir aplicação em plano-base, fase ou recorte; o Gestor de Updates recomenda e o Estrategista consolida no fluxo competente.
- Não adicionar item sem fonte oficial, valor concreto e compatibilidade com o `README.md`.
- Não realizar merge dos PRs.
- Quando faltar fonte obrigatória, houver conflito material ou faltar permissão, informar exatamente o bloqueio e parar.

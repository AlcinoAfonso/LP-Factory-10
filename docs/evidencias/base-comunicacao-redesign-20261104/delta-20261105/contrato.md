# Delta humano aprovado — 05/11/2026

Continuação do mesmo PR #1117, a partir do HEAD 1ad02f569d7db9b4b89f94e1886115a734304826. Permanece a proibição de merge. Esta mensagem substitui somente os pontos anteriores incompatíveis; o contrato de 04/11 e suas evidências continuam históricos e os demais limites permanecem vigentes.

## Solicitação humana integral

> Print 1: Remover o texto 'Reúna a verdade ...; locomover o botão 'Como funciona' para ao lado da Base de Comunicação em um formato de ícone, talvez um ? em um quadrado.
> Print 2 Remover o botão 'melhorar meu texto' de todos as seções da categoria 1 pq esse rercurso será descontinuado. Melhorar o muted text de todas a seções de todas as categoriad tornando mais muted ainda e com a fonte um pouquinho maior, talvez 10%.
> Criar um ícone que represente exemplos ao lado do nome de cada seçã, em cada categoria, para substituir o botão como preencher.
> Print 3 tornar os popups dessa categoria 2 do mesmo tamanho das outras categorias.

Referências humanas: [Print 1](print-1.jpg), [Print 2](print-2.jpg), [Print 3](print-3.jpg).

## Derivação técnica local

- Cabeçalho: remover a frase indicada e mover a única instância de apresentação para junto do título. Acionador quadrado ? de44px, nome acessível Como funciona, mesma apresentação, dispensa e persistência. Preservar as condições de montagem prévias.
- Categoria1: retirar botão, UI de sugestão e consumidor client de assistência individual. Não ampliar a descontinuação para backend, prompts, contratos de persistência ou revisão/geração da categoria3.
- Exemplos: ícone de livro aberto junto do título do popup nas três categorias, nome acessível por seção, estado expandido e relação com a ajuda existente. Preservar conteúdo, ajuda após editor nos textos livres, Escape prioritário da ajuda e proteção de rascunho. O controle da revelação fica no dialog existente, sem nova camada global.
- Muted text: CSS Module local à Base, usando a paleta existente em mistura neutra de contraste mínimo4,5:1; tamanho +10% para corpo, textos pequenos e placeholders. Sem tokens globais, biblioteca ou dependência nova.
- Popups de seção: mesma largura e altura responsiva nas três categorias, corpo rolável e cabeçalho alcançável. Dimensão uniforme expressamente solicitada, inclusive quando Materiais estiver vazio; dispensa a densidade por altura intrínseca neste recorte.

Todo o delta é derivação técnica das decisões humanas, sem modernização. Updates dispensado por ausência de decisão tecnológica; Estrutural, Automações e Analista sem questão material nova. QA: viewports320/390/430/1280/1440, comparação dos tamanhos, fonte/contraste, 17 ícones e ausência de assistência na categoria1, teclado/Escape, rascunho e revisão preservada da categoria3. Sem mutação real de conta ativa. Revisão focal de Design somente após evidência renderizada; Code Review independente do novo HEAD antes da entrega.

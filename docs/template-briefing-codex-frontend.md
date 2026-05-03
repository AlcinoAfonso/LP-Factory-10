# Template de briefing frontend para Codex

Use este template como camada complementar ao `docs/template-briefing-codex.md` quando a tarefa tiver impacto visual ou de UI. Ele nao substitui o briefing geral.

## 1. Objetivo visual

Descreva o resultado visual esperado em termos observaveis: o que deve mudar, para quem e com qual efeito na experiencia.

Nao "melhorar visualmente" alem do objetivo definido, salvo quando a tarefa pedir redesign ou exploracao visual.

## 2. Tela/componente afetado

Indique a tela, rota, componente, estado ou fluxo afetado. Inclua prints, links, arquivos ou contexto visual disponivel quando houver.

## 3. Estado atual e estado desejado

Compare de forma curta:

- estado atual: problema visual, comportamento ou desalinhamento existente;
- estado desejado: resultado esperado depois da alteracao.

## 4. Restricoes de UI/UX e design system

Declare regras que devem ser preservadas: tokens, cores, tipografia, espacamento, componentes existentes, responsividade, acessibilidade e padroes do design system.

## 5. Arquivos permitidos e limites

Liste os arquivos ou areas que podem ser alterados e o que nao pode ser mexido. Declare quando a tarefa deve evitar refatoracao, novo componente, nova dependencia, mudanca de copy ou alteracao funcional.

## 6. Criterios de aceite visual

Defina criterios objetivos de aceite, por exemplo:

- alinhamento, hierarquia, contraste e espacamento esperados;
- estados responsivos obrigatorios;
- estados de hover, foco, erro, vazio ou loading quando aplicavel;
- ausencia de sobreposicao, quebra de layout ou texto cortado.

## 7. Validacao esperada

Siga a rotina minima definida em `AGENTS.md`, sem duplicar os comandos aqui. Quando aplicavel, inclua validacao visual com print, navegador local, viewport especifica ou descricao da evidencia coletada.

Se a validacao visual nao puder ser executada, informar o motivo e o risco residual.

## 8. Entrega final

Responder de forma concisa com:

- resumo do impacto visual;
- arquivos alterados;
- validacao executada;
- validacao nao executada, se houver, com motivo;
- status final: `pronto`, `bloqueado` ou `depende validacao`.

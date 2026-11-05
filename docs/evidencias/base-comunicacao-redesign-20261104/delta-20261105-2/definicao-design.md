# Definição focal de Design — rodada2

Gestor de Design /root/revisao_design, modo definicao, HEAD de entrada6965bf4a, runtime anteriorf54c557d; PR1117 sem merge. Fontes: contrato.md e quatro prints humanos desta pasta, docs/design-system.md, .codex/agents/gestor-design.toml e componentes/CSS locais. Revisor somente leitura; nenhum arquivo alterado por ele. HEAD antes/depois6965bf4a, Executor trabalhando nos componentes em paralelo.

Superfície: dashboard operacional com dialogs delimitados; hierarquia operacional, ajuda progressiva, tokens existentes, foco visível, alvo44px e contraste normal>=4,5:1.

- Ajuda e placeholder:14px nominais, peso400, rem e ampliação do usuário preservados. Reduzir .9625rem para .875rem e placeholder1.1em para1em no CSS local. Manter cinza existente, sem opacity.
- Como funciona: SVG com círculo20–22px/interrogação desenhada em caixa44px, brand50/brand700, nome acessível e teclado.
- Exemplos: livro28px, traço1,75, brand700, alvo44px. Fundo sutil, sem faixa permanente.
- Orientação: início do corpo rolável, após cabeçalho e antes dos campos nas três categorias. Se já rolado, tornar a ajuda visível junto do cabeçalho, preservando rascunho/foco. Sem painel azul, negrito ou mudança textual.

Nos prints1/4 o livro está pequeno/apagado e orientação destacada ou abaixo da edição. Solução aumenta a identificação do acionador e reduz competição da ajuda. Validar cor/tamanho/contraste efetivos, título longo/recortes, posição, toggle/Escape. Checkbox e preferência seguem contrato. Conclusão: solução definida; não representa revisão/aprovação do novo resultado renderizado. Próximo passo: implementar e apresentar evidência mobile/desktop. Configuração declarada gpt-6.1-sol/high/read-only, modelo efetivo não inspecionável. npm ci/check não aplicáveis à definição somente leitura.

Derivação executiva: preferência por usuário lida do AccessProvider existente, sem nova chamada, credencial ou mudança server. Nova chave local versionada somente para booleano de opt-out; Entendi/Escape não gravam supressão. Ajuda centralizada antes dos editores, slot antigo removido. Corpo volta ao topo no acionamento, mantendo boundary de hover no dialog corrigido anteriormente. IA segue apenas categoria3.

Updates dispensado nesta rodada: refinamento local sem decisão tecnológica, dependência ou contrato de integração novo. Demais especialidades não acionadas por ausência de questão material no domínio. Revisão React aplicada conforme vercel:react-best-practices: dependência primitiva no efeito, storage versionado/mínimo, sem novos listeners/fetch, SVG decorativo com acionador nomeado, checkbox nativa e estado local. Design System e tokens globais inalterados.

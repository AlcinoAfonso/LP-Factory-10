# Delta humano aprovado — 05/11/2026, rodada2

Continuação do PR #1117, branch codex-app/base-comunicacao-redesign-20261104, base desta rodada f54c557d62072ffe58bc598a323fb8ddceb9290f. Sem merge. Os contratos/pareceres anteriores são históricos; este delta prevalece somente nos pontos expressamente substituídos. Revisão por IA permanece exclusivamente na categoria3.

## Pedido humano integral

> O texto de ajuda ainda está muito forte, precisa ser menos discreto. Melhore esse muted O print 2 deveria abrir assim que eu acesso ou assim que qualquer cliente acesse a base de comunicação. Ele deve ter um diálogo bem discreto com uma caixinha para que é um padrão do mercado, não mostrar novamente. E aí a pessoa pode marcar essa caixinha e ele não abre mais. Eu esperava um ponto de interrogação mais bacana, mais bem elaborado para o nosso projeto. Melhore Gostei do ícone ao lado do nome da sessão. Ele precisa ser um pouco mais relevante, ele está muito apagado. Você aumenta e acho que vai ficar bom. Quanto à resposta ou à orientação quando apertar nesse ícone, ele deve vir logo ali abaixo e não após todo a caixa do pop-up, ou seja, o cliente clica nele, já abre abaixo dele e fecha. Se você tiver alguma dúvida antes de implementar, me pergunte para a gente não perder tempo

Esclarecimentos recebidos antes da implementação:

- Ajuda: **Mais discreta, com menos destaque**.
- Não mostrar novamente: **Por usuário neste navegador**.

Referências fornecidas: [Print1](print-1.jpg), [Print2](print-2.jpg), [Print3](print-3.jpg), [Print4](print-4.jpg). São capturas humanas do estado anterior desta rodada, não prova do resultado novo.

## Derivação técnica mínima

- Abrir a apresentação a cada entrada na Base, salvo opt-out explícito pela checkbox Não mostrar novamente. Entendi e Escape sem marcar não gravam dispensa permanente. Nova chave local por usuário ignora a antiga dispensa automática global; sem migração de banco, cookie, novo serviço ou nova credencial. Reusar a identidade já injetada no AccessProvider.
- Preferência isolada pelo usuário no navegador; não acompanha dispositivos. Reabertura manual por Como funciona permanece disponível e permite desmarcar a opção. Em falha de storage, orientação continua utilizável; sem identidade, não compartilhar preferência entre pessoas.
- Substituir ? textual por SVG de ajuda, com azul/neutros existentes. Aumentar e destacar o livro de exemplos, mantendo alvo44px, nome acessível e teclado.
- Ajuda existente passa a aparecer no início do corpo, imediatamente após o cabeçalho/acionador e antes dos campos nas três categorias; não inserir conteúdo no valor salvo. Preservar Escape prioritário, clique/hover e proteção do rascunho.
- Reduzir destaque da ajuda/placeholder por tipografia e cor legíveis, sem reduzir contraste de texto normal abaixo4,5:1 nem alterar tokens globais. Demais conteúdos e formatos preservados.

Validação: npm ci → npm run check, dev/Preview, preferência marcada/desmarcada, abertura/reentrada/manual, ajuda antes do campo, toggles/Escape, mobile/desktop, dimensões, contraste e regressão de rascunho. Apenas localStorage de QA, sem mutações de negócio. Code Review do novo HEAD; captura/revisão visual somente quando houver evidência renderizada disponível. Updates: ajuste local sem decisão tecnológica; demais especialistas apenas por questão material.

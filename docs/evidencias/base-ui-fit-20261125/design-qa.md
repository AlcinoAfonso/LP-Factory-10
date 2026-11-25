# Base de Comunicação — QA visual

final result: passed

Contrato humano25/11/2026: apenasdesign. Nicho:emnegrito; título duplicado categoria3 removido; controlespesquisa ocultos sem mudar política/estado/parâmetros; descrição só por clique no livro; instrução Até…caracteres visualmente oculta; campo de escrita maior com título eSalvar dentro da viewport. Hints acessíveis e limites de validação permanecem.

Runtime5e11deb8ef77508285498f3287d1b6a1aef4e5f8, baseaaa187fb, branchcodex-app/base-ui-fit-20261125, PR1187. Cinco arquivos UI e evidências; Design System consultado e preservado.

## Comparação
Antes/depois hospedados em comparacao.png, ladoalado, mesmo estado Quem somos vazio, viewportCSS471x678. CapturasJPEG456x656 aproximadamente comDPR1.25/escala do navegador original; usadas para hierarquia, não auditoria de raster/antialiasing. Referências humanas são os quatro prints do chat. Desktop1366x768 e mobile390x844/320x480 adicionais; medidasCSS emqa-runtime.json.

Fontes/tipografia: Inter/pesos/tokens existentes mantidos; apenasNicho:ganha strong. Espaçamento/layout: campo160→388px no estado original;398px no notebook e390x844;190px em320x480. Savebottom699.2/737.2/451.2respectivamente dentro da viewport, alvo44px. Título/body e ações preservados. Cores:sem mudança de tokens; legibilidade/muted existentes mantidos. Imagens/ícones:semassetsnovos, livro existente mantido. Conteúdo:sem novo texto, ajuda ainda disponível sob clique, checkboxpesquisa não visível nem focável, texto de limite mantido apenas acessível quando aplicável.

Nas listas/FAQ com vários campos, conteúdo interno pode rolar e ações permanecem fora da área rolável; não se promete exibir todos os itens simultaneamente. Sete seções categoria3 abertas em320x480 eSave visível em todas; checkboxpesquisa visível0. Benefícios com itemvazio emrascunho aferido; nenhum save/IA/upload executado. Ofertas320x480:campo294.8px eSave451.2px. Ajudaexpande/recolhe imediatamente abaixo doheader;Escape recolhe ajuda primeiro. Rascunho temporário emQuem somos abriu confirmação;continuar e depoisdescartar sem salvar preservados. Consolecapturado semerrors/warnings.

Main atual já contém alterações de outros chats:limite30000/cat3 e AgenteBase/nicho. Antes dochat estava noPreviewantigo de4k. Essas diferenças são preexistentes na base e não decorrem destePR. Backend/política de pesquisa e parâmetros não foram editados.

## Validações e publicação
npmci/check executados emworktree, aprovados0erros/23warnings preexistentes. npmdev iniciou3002; leitura noBrowser confirmou falta deURL/keySupabase. Parado;AGENTSgerado peloNext conferido/restaurado. Sem build. Previewdepldpl_4CQRPCrLYd1AVamTiuFqtKN8SMKq READY no mesmo projeto/SHA; aliasPreviewautenticado fd52c1 antesdepldpl_ApSxTnFWFFRNYxbPRdq3JxeygEhb reapontado somente para estePreview para preservar sessão. Nenhumaalteração aProduction, authouenv.

Sem achadoP0/P1/P2 nos estados demonstrados. Não testado aparelhoAndroidreal/tecladovirtual/fonteampliada nesta rodada; não há declaraçãoWCAGintegral. Novo teste de fontemuitoampliada pode exigir rolageminterna, preservada. Encerramento e navegação existentes mantidos.

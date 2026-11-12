# Design QA — Como funciona desktop

final result: passed

## Fonte e comparação

- Fonte selecionada: `docs/evidencias/base-intro-desktop-editorial-20261111/selecao-humana.png`. Original de alta resolução correspondente: `referencia.png`, 1487×1058 px.
- Implementação: `desktop-final.jpg`, captura do navegador integrado a 1440×1024 CSS px, DPR aproximadamente 1. Popup aberto; foco inicial no título. Componente TSX real e CSS Module processados com dependências do repositório, fixture local isolada em localhost:3001, identidade fictícia, sem backend. Inter carregada dos arquivos next/font locais, peso 700 disponível.
- Comparação conjunta: `comparacao-desktop-final.png`, referência à esquerda e implementação à direita. Referência recortada para o modal (228,224,1032,610) e reduzida proporcionalmente para largura864; implementação recortada (288,258,864,509). Fundo operacional e chrome não integram este recorte.
- A captura conjunta também permite leitura focal de título, parágrafos, ilustração e rodapé. Histórico: `comparacao-desktop.png` mostra primeira composição com título32px e arte menor; corrigidos título para40px, marca18px, largura de texto384px e slot da arte antes da comparação final.

## Superfícies obrigatórias

- Tipografia: Inter do produto; título40px/700/1.1 azul em duas linhas; texto16px/1.6 em ink800. Primeira frase do segundo parágrafo600. Proporção/hierarquia da referência preservadas, sem truncamento. Família exata do mock gerado não é verificável; usa-se Inter canônica, com leve diferença de desenho/peso ótico aceitável.
- Espaçamento: modal864×aproximadamente509px, duas colunas, faixa azul superior e rodapé separado com ações opostas. Padding horizontal40px, grid sem sobreposição; pequenos desvios do mock raster são esperados na tradução para conteúdo real e fonte canônica.
- Cores: brand700, ink800, superfícies e bordas do projeto; texto principal não usa muted no desktop. Tema escuro inspecionado com foreground/primary sem alterar tokens globais. Título e corpo têm contraste adequado com superfície; não é auditoria WCAG integral.
- Imagem: raster gerado específico com documentos, seta e browser azul, wash circular e sombra leve; sem texto embutido, sem aproximação SVG nova. Proporção preservada, sem corte, imagem decorativa fora da árvore acessível. Arte possui diferenças menores de traço/sombra em relação à ilustração do mock (P3).
- Conteúdo: dois parágrafos e controles mantidos integralmente, sem features ou textos novos. Checkbox continua opcional conforme identidade disponível.

## Interações e regressão

Componente real: Entendi fecha e ícone reabre com foco no título/scroll0. Escape fecha e devolve foco. Marcar Não mostrar novamente, fechar/recarregar suprime abertura; ícone permite reabrir e desmarcar. Somente armazenamento do navegador da fixture foi alterado.

320×480 CSS px: modal464px de altura; cabeçalho e rodapé visíveis, corpo256/344 rolável, sem overflow horizontal. 390×aproximadamente844: layout mobile e ilustração anterior mantidos; novo raster oculto. Rootfont32px/320×480: modo outer com corpo natural, navegação até Entendi alcança botão entre351–439px dentro do dialog16–464px. Desktop root32: corpo rolável, footer alcançável. Medidas em `qa-runtime.json`.

Console da aba final: sem errors/warnings. Erros anteriores da página Next sem config e do primeiro harness sem process.env foram diagnosticados e eliminados da fixture final; não atribuídos ao produto.

## Limites e checklist

- [x] Cinco superfícies de fidelidade comparadas, nenhuma pendência P0/P1/P2 no popup isolado.
- [x] Fonte, viewport, teclado, preferência, rolagem e tema escuro verificados proporcionalmente.
- [x] Mobile preservado e fallback ampliado alcança ações.
- [ ] Página autenticada completa: não validada nesta rodada. Dev Next iniciou3000 mas middleware exige configuração Supabase ausente; aba Preview existente exibe Acesso não disponível/sem vínculo. A fixture valida o componente e seus estados, sem afirmar QA de backend/autenticação ou publicação.

Follow-up P3: traço exato da ilustração e peso ótico do mock. Nenhuma ampliação de escopo necessária. Design System permanece intacto; a referência humana autoriza este tratamento de apresentação no modal introdutório, sem transformar cabeçalho operacional da página em hero.

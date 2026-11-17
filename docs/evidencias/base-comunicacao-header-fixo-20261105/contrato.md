# Barra de navegação fixa na Base de Comunicação

Pedido humano05/11/2026: Repare que o cabeçalho não fica fixo na página da base de comunicação. Torne-o fixo. Referências print1.jpg/print2.jpg mostram barra LP Factory/Base/Membros/avatar presente no topo e ausente após rolagem.

Continuação do PR1118 aberto/draft, branch codex-app/base-comunicacao-intro-mobile-20261105, base do delta263189f1391300400949e27cfcbf7a9d84bea6bd. Sem merge autorizado. Escopo deste pedido autoriza ajuste delimitado no Header compartilhado para essa página; não amplia fixação às demais telas.

Derivação: components/layout/Header.tsx, somente variante Account, usePathname compara rota exata /a/{subdomain}/base-comunicacao (query não altera rota, barra final normalizada). Aplicar sticky/top0/z40, padrão já existente no AdminHeader. Preservar fluxo/altura/fundo/controles existentes, acesso/papéis e menus. Sem duplicar barra ou usar altura manual/padding compensatório. Cabeçalho do conteúdo e popups seguem seus comportamentos existentes.

Aceite: mobile/desktop com rolagem de documento e barra no topo, menu/avatar utilizável sem recorte, dialogs acima da barra/retorno de foco, navegação Membros/conta sem fixação e retorno à Base restaura fixação, sem overflow horizontal. npm ci→npm run check; npm run dev e Preview autorizado, Code Review do HEAD final. Nenhuma mutação de negócio/IA, auth/banco/config/dependência/workflow nova. Design System consultado e preservado, inclusive não editar docs/design-system.md ou docs/design_system.md. Roteamento serve apenas apresentação, sem decisões de autorização.

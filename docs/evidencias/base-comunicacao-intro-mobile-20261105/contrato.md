# Apresentação Como funciona — recorte aprovado05/11/2026

Base17a43af18b8a7a7791c65e5b46ff8fa6e459bf59 (PR1117 mergeado), branch codex-app/base-comunicacao-intro-mobile-20261105, mesma worktree. Novo PR sem merge autorizado.

Pedido humano: apresentação Como funciona da Base abriu com título fora da área visível; avaliar prós/contras antes de compactar para caber verticalmente no celular. Referências humanas print1.jpg/print2.jpg. Esclarecimento: refere-se ao Como funciona, não à página Base.

Proposta aprovada por Ok, faça isso: compactar primeiro ilustração, margens e espaçamentos, preservando fontes; abrir pelo topo; procurar caber inteira na altura disponível; em telas pequenas/fonte ampliada permitir rolagem do corpo com título e ações acessíveis. Não escalar todo conteúdo proporcionalmente.

Derivação: só CommunicationBaseTabs.tsx. Native dialog mantém limite dinâmico100dvh; cabeçalho e rodapé fora do corpo rolável; ilustração mobile144→80px nominais; gaps16→8, padding20→16, fontes/textos preservados. Foco inicial programático no título e corpo ao topo em toda abertura, sem alterar checkbox por usuário/navegador, Entendi/Escape, botão de ajuda30px/alvo44 ou quaisquer editores. Fonte ampliada não será anulada.

Validação: npm ci→npm run check; dev e Preview autorizado, mobile390x844/320x568/320x480 e desktop1440x900; abertura automática/manual, topo/reabertura após rolagem, visibilidade título/checkbox/Entendi, teclado/foco/Escape, preferência mantida. Sem mutações de negócio. Relatar limitações de fonte ampliada/navegador Android real quando não demonstráveis. Code Review do HEAD final.

Design System consultado e preservado, inclusive44px; nenhuma alteração de docs/design-system.md ou docs/design_system.md. Mudança localizada sem nova decisão tecnológica: Updates e demais especialidades não necessários; Design focal de resultado sobre evidência renderizada. Sem banco, auth, prompt, serviço, dependência, workflow ou configuração externa nova.

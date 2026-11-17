# QA — apresentação Como funciona compacta

Runtime423f2d8b380587a62fda1351ac7c6b6cbe3d23d6, PR1118, base17a43af1. Contrato aprovado/prints humanos nesta pasta; antes-390.jpg é baseline do PR1117 mergeado. Demais imagens depois-* e qa-runtime.json representam este runtime, não a produção.

## Aceite aferido

-390x844: altura582,6→454,6px, corpo272/272 sem rolagem, imagem144→80px. Fonte título20px e texto14px preservadas, sem escala global.
-320x568: altura527,6px cabe inteira, corpo320/320.
-320x480: altura464px com margens8px; apenas corpo256/344 rola até87,2px. Cabeçalho permanece8,8–106,8px e rodapé363,2–471,2px antes/depois; sem rolagem externa do dialog nem overflow horizontal. Todo conteúdo disponível por teclado.
-Reabrir após rolar: corpo0/foco no título. Abertura automática também focou título. Teclado: título→região rolável→checkbox→Entendi, botão44px. Escape retorna foco ao ícone.
-Preferência marcada suprime no reload; abertura manual mantém marcação; opção desmarcada ao final para manter apresentação automática. Nenhuma gravação de negócio, upload, IA ou mudança de sessão/permissão.
-1440x900: modal768x381,6, corpo168/168; ilustração144px desktop preservada.
-Console do Preview sem errors/warn capturados.

## Validação e boundaries

npm ci e npm run check executados com sucesso,0 erros/23 warnings preexistentes. npm run dev iniciou em3000; página local confirmou falta de NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. QA via Preview autorizado, sem nova credencial/cópia de env. Servidor e aba local encerrados. Bloco AGENTS gerado pelo dev conferido e removido do diff. Sem npm run build conforme regra do repositório.

Somente CommunicationBaseTabs.tsx e evidências deste recorte alterados. Design System (ambas grafias), tokens, fontes, textos, checkbox/key de preferência, ícone30px/alvo44, editores, IAcat3, banco, prompts, auth/permissões, dependências e workflows preservados. main..HEAD/main...HEAD conferidos. Observabilidade nova:N/A, fluxo UI existente, sem novo consumidor remoto ou serviço. Regra técnica durável, schema, automations/services/platform config e roadmap:N/A para este refinamento local de apresentação; não normalizar documentos de outro recorte.

## Acesso de QA e limites

Deploymentdpl_HgZuRkQYifcGEjPmiY3hGAuaikEr READY no projeto lp-factory-10. Alias automático da nova branch terminou em-f26c91 e exibiu Acesso não disponível/sem vínculo; a sessão do alias anterior estava válida. Para reutilizá-la, reapontado SOMENTE o alias de Preview lp-factory-10-git-codex-app-base-27fb8c-alcino-afonsos-projects.vercel.app do deploymentdpl_H9kbtvQJoDo3saRsfCLTK7LCRqaa para o novo, ambos Preview do mesmo projeto. Não houve mudança no domínio/deploy Production nem auth. Após reload ainda havia documento antigo em cache; navegação com queryqa=423f2d8b carregou a região nova e foi confirmada por DOM/foco/imagem80px e metadata do deployment. A entrega usará URL versionada para evitar cache anterior.

Não reproduzido Samsung/Android real, modo escuro ou ampliação de fonte do aparelho dos prints. Não há garantia universal de encaixe sem rolagem; o corpo foi projetado para rolar preservando header/footer e unidades relativas. Desktop comprimido nas capturas limita detalhe tipográfico fino. Sem declaração WCAG integral. Revisão focal de Design e Code Review do HEAD final vinculados na entrega.

## Correção focal após Code Review

O P2 discussion_r4483393626 do HEADf842ac42 identificou header/footer maiores que a viewport com fonte-base32px. Primeiro candidato acima permanece histórico. Delta corrente, blob43f4fc429e09cc1a1e4b41d519a1cea5082c442e: ResizeObserver local mede cabeçalho/rodapé e reserva mínima de leitura proporcional à fonte. Quando não cabem, dialog assume rolagem externa e corpo volta ao fluxo natural. Sem suporte ao observer, usa rolagem externa segura. Observer desconectado no unmount; aberturas zeram as duas rolagens. Quebra de palavras evita corte horizontal. Nos tamanhos normais, header/footer continuam fora do corpo rolável.

Reprodução isolada usa o componente TSX real, AccessProvider com identidade local fictícia, React/Tailwind já instalados e CSS vigente; HTML inicial com font-size32px, viewport320x480. Não usa backend, credencial, login ou manipulação DOM por ferramenta. Não emula tipografia/aparelho Samsung. Antes: body16/1312, overflowhidden, rodapé terminava552,8 além do dialog464. Depois: modoouter, body1360/1360, scroll externo1516 alcança Entendi entre350,8–438,8 dentro do dialog16–464; sem overflow horizontal239/239. Reabertura: scroll0/foco no título. Redimensionamento1440x900 com32px volta ao modobody;320x480 retornaouter. Com fonte16px/320x480, modo normalbody, header8,8–106,8/rodapé363,2–471,2, sem overflow horizontal. Capturas fonte32-* e qa-fonte32-isolado.json preservam esse ensaio, distinto do Preview.

As entradas do ensaio estão em fixture-entry.tsx.txt/fixture-server.mjs.txt: copiar para .vercel/intro-font-entry.tsx e .vercel/intro-font-server.mjs, gerar .vercel/intro-font-input.css concatenando app/globals.css e CommunicationBase.module.css com :global(...) desembrulhado, e executar node .vercel/intro-font-server.mjs na raiz. Abrir localhost3001/?font=32 ou16 pelo navegador integrado. Bundle gerado é .bundle, não deve ser versionado nem entrar no lint. O primeiro check do delta varreu acidentalmente um bundle.js de React gerado pelo ensaio; isolado do lint sem mudar sua configuração, novo check passou0erros/23warnings. npm ci já aprovado nesta etapa, dependências preservadas. Não há novo arquivo executável de produto/teste.

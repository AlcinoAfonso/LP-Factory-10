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

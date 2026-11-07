# QA — barra fixa na Base de Comunicação

Runtime835746b3eb408c5be5ccdc7dae844f02ac7ad2b8, PR1118; contrato e prints humanos no mesmo diretório. Somente varianteAccount do Header compartilhado foi alterada para rota exataBase. Query não altera condição; barra final normalizada. Padrão sticky/top0/z40 já presente no AdminHeader. Sem variante/prop/serviço/autorização nova.

-390x640: inícioScroll0 e fimScroll82,4, headerTop0/headerBottom56,8 em ambos; conteúdoH1 muda120,8→38,4.
-320x480: scroll306,4, header0–56,8; conteúdoH1-185,6.
-1440x400: scroll315,2, header0–56,8; conteúdoH1-186,4.
-Sem overflow horizontal nos três viewports. Avatar/menu abre abaixo da barra (top58,left75,2/right363,2 em390), sem recorte; Escape fecha. Sem screenshot do menu para evitar dados pessoais desnecessários.
-Membros efetivamente navegada: headerpositionstatic/zauto; retorno à Base restaura sticky. EntradaConta redirecionaBase por regra existente app/a/[account]/page.tsx/journey.view=base, portanto não registrada como prova deheaderstatic. Public/Authenticated e demaisrotas preservados por diff.
-Como funciona nativo abre acima da barra com backdrop. DetalheAtuação também abre acima, fecha e retorna foco; sem digitação/save/IA.
-ShiftTab pelos itens da coleção no desktop rolado: foco sempre abaixo do header56,8, mínimo124,8; sem foco oculto.
-Console sem errors/warn capturados.

Fotos topo/rolado390,rolado320,rolado1440, popup390/desktop e section-popup1440 correspondem ao runtime acima; qa-runtime.json guarda medidas. Desktop tem compressão perceptível, suficiente para composição/posição, sem prova tipográfica fina. Não reproduzido Android/Samsung real, escuro, ampliação de fonte ou teclado virtual; não se declara WCAG integral.

npm ci/check aprovados0erros23warnings preexistentes. Dev iniciou3000; página local confirmou configuração Supabase ausente, reutilizado Preview autenticado. Servidor/aba local encerrados; bloco AGENTS automático conferido/removido do diff. Sem build conforme AGENTS. Alias Preview antigo reapontado para deploymentAPaefLpaAoubXwefyjv9SxizS3jh do mesmo projeto, sem Production/auth/confignova. Navegação inicial CDP demorou, DOM depois confirmou sessão válida e positionsticky. URL versionada garante documento novo.

Design System/ambasgrafias, Header variantsPublic/Authenticated, entradas/papéis, main/popups/editores, fonte15, banco, prompts, dependências, workflows, canonicais e comportamento de outras páginas preservados. Sem logout ou mutação de negócio; apenas navegação, foco e abertura/fechamento deUI.

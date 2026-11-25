# QA do cabeçalho e atalho de nicho

Runtime: 7d5cec688df47b68d27eda886784f950d701e6b6. Preview READY dpl_DmxrdRQTLxFYPQg3XzAw3XUv4txq; alias de Preview do mesmo projeto e sessão autenticada existentes. Produção não alterada.

- npm ci: exit 0. npm run check: exit 0; suite completa inclui contratos de nicho, pesquisa e Agente Base. Nenhum build local.
- npm run dev iniciou na porta 3002. A rota local foi aberta, mas middleware exige URL/chave Supabase ausentes nesta worktree. Validação renderizada realizada no Preview autenticado; nenhuma credencial copiada. AGENTS gerado pelo dev restaurado.
- Notebook 1366×768 e mobile 390×844: nome público e nicho oficial apenas no cabeçalho global. Conteúdo principal contém título, ajuda, Redefinir nicho e categorias, sem cópias da identidade. Sem overflow horizontal. Botão de 44 px fica 12 px abaixo do título nos dois tamanhos.
- Clique Redefinir nicho abre introdução de nova definição e campo Sua mensagem vazio/focado, Enviar mensagem desabilitado. Não mostra histórico encerrado. Sem digitação, envio ou confirmação de nicho. Reabertura da página retorna ao atalho.
- Página Membros e convites aberta pelo link existente: mesmo nome público, status e nicho presentes no cabeçalho. Retorno à Base sem alterações.
- Console do Preview sem erros/avisos nesta rodada. Viewport restaurada e página deixada sem rascunhos.
- docs/design-system.md consultado. Reuso do Button secondary/min-h-11, estrutura, tipografia e espaçamento existentes; nenhum token ou componente global alterado.

Escopo do delta: page.tsx e AccountNicheConversation.tsx, 4 linhas adicionadas e 8 removidas, mais evidências. Header global e ações de nicho sem diff. Home conserva seu caminho home=true. Fluxo bloqueado conserva mensagem existente e impede abertura de nova definição. Estado bloqueado/conversa ativa não exercitados na conta real; guardas conferidos no código e contratos sintéticos de nicho passam.

Limites: sem mutações em dados reais, envio ao agente ou chamadas de IA. O PR continua em rascunho, sem merge. Editor livre da categoria 3 tem QA anterior em manual-free-editor; não salvar o formato novo em dados reais no Preview antes do rollout conjunto de leitor/escritor.

# QA do alinhamento

Runtime: acefccfcc19704824ca039481fb0b4a7a974b4d6. Preview READY dpl_CV83YNkAM8nnAVv7AMmVjYKVJBpg. Alias de Preview e sessão autenticada existentes, sem alteração em produção.

- npm ci: exit 0. npm run check no runtime final: exit 0; 0 erros e 23 avisos preexistentes. Sem build local.
- Notebook 1366×768 e mobile 390×844: título e Voltar à conta na mesma linha; retorno encostado à margem direita do conteúdo. Em 320×568, título em duas linhas, retorno à direita na primeira linha. Sem sobreposição ou overflow horizontal. Fontes preservadas.
- Redefinir nicho: texto na mesma coordenada X do título (195,2 px no notebook; 16 px nos celulares). Distância entre os textos: aproximadamente 14,4 px; sem os 12 px de separação extra e sem padding lateral. Alvo de toque 44 px mantido. Override local necessário porque cn apenas concatena classes; não foi alterado o Button global.
- Redefinir abre introdução de nova conversa e campo vazio/focado; nenhuma mensagem enviada. Voltar mantém exatamente o href anterior /a/acc-d4363e70. Nesta conta, a jornada existente redireciona esse endereço à Base (page.tsx da conta, journey.view=base); roteamento não alterado neste escopo visual.
- Cabeçalho global, nome público/nicho e demais conteúdos preservados. Home não recebe a compactação. Console sem erros/avisos. Viewport restaurada, Base deixada sem rascunhos.
- Design System consultado: mesmos tokens, escala operacional, Button existente, foco e alvo mínimo preservados; nenhum ajuste no documento.

Limites: QA renderizada no Preview porque a rota local exige configuração Supabase ausente, já diagnosticada nesta rodada. Não houve alterações de configuração, persistência ou IA. Sem teste de teclado virtual/dispositivo físico. Code Review independente deve corresponder ao HEAD final, PR permanece em rascunho e sem merge.

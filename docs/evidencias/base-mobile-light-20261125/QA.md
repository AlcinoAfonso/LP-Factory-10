# QA visual delimitada — Base mobile clara

Runtime eb4241438aba1e0a474c3197536c5f1195597f07; base main 10b144d056d258716d5240f8082ff601c04db599. PR #1189, branch codex-app/base-mobile-light-20261125. Preview READY dpl_AEsjDugWcAfbE2Do4WkQcgVzTDkm.

- npm ci e npm run check: exit 0; 0 erros, 23 avisos preexistentes. npm run dev iniciou na porta 3002; rota local mostrou ausência de URL/chave Supabase. Nenhuma configuração foi copiada; QA renderizada no Preview configurado. AGENTS gerado automaticamente pelo dev restaurado após inspeção do diff. Sem build local.
- Catálogo de QA no Google Drive consultado por autorização humana. Identidade de teste Corretor Alfa autenticada no Preview; UI confirmou Corretor Alfa QA2, nicho Corretor de imóveis de médio padrão e conversa ativa anterior. Nenhuma credencial em arquivos, evidências, PR ou screenshots. Sessão Production original não foi substituída.
- Navegador integrado, aba reutilizada id 1. Viewports CSS conferidas por innerWidth/innerHeight: notebook 1366×768, mobile 390×844 e 320×568 e stress de reflow 280×568. Header sem sobreposição ou overflow horizontal. Comunicação permanece inteira em todos os casos; retorno preserva texto e acomoda quebra de linha no espaço disponível. Título continua 20 px; ajuda/ação com 44 px ou mais.
- Na entrada, conversa ativa fica recolhida e Redefinir nicho alinhado ao título. Ao clicar, o histórico anterior exato reaparece, textarea vazia recebe foco e Enviar mensagem está desabilitado. Recarregar retorna ao estado recolhido. Nenhuma mensagem digitada/enviada; nenhuma chamada de IA ou salvamento de conteúdo.
- Meta color-scheme = only light no documento da Base. Superfície color-scheme computado light only; body/main/dialog com fundo rgb(255,255,255). Diálogo de introdução abriu normalmente em claro. Header, Home, callbacks e server actions sem mudanças.
- Console do Preview sem erros/avisos observados. Ajuste restrito a três arquivos de apresentação: page.tsx, CSS Module e estado/rótulo inicial de AccountNicheConversation.tsx. Prompts/IA/pesquisa/persistência/permissões/dados intactos; docs/design-system.md consultado e não editado.

## Limites da evidência

A tentativa de zoom pelo atalho nativo do navegador não alterou métricas; não é evidência de fonte ampliada ou de Android/Samsung real. Não foi possível emular o Force Dark nesse runtime. O opt-out only light é documentado pelo Chrome, mas inversores externos podem ignorar o sinal do site. O preview deve ser testado no aparelho que originou o print antes de autorizar merge.

A captura antes-corretor.jpg foi feita antes da correção sem viewport CSS registrada (JPEG 456×656). A referência humana tem 591×1280, viewport desconhecida. As capturas novas têm os tamanhos CSS registrados em qa-runtime.json; não há alegação de comparação pixel a pixel com o aparelho.

Home preservada por condição home; estados sem conversa/encerrado mantêm os mesmos callbacks e transporte, mas não foram exercitados ao vivo nesta conta ativa. Bloqueios de produto e autorizações permanecem no código anterior. PR em rascunho, sem merge ou alteração de produção nesta etapa.

## Delta final eef46631

Code Review independente encontrou perda do acesso visual ao histórico quando blocked=true. Corrigido somente no componente de apresentação: acionador Consultar conversa de nicho preserva diálogo e mensagens, inclusive encerrados, e mantém ended=true no componente existente. Nenhuma action, guarda de servidor ou regra de envio alterada.

npm ci e npm run check novamente concluídos com exit 0. Harness isolado local com o componente real e dependências de servidor substituídas por stubs que falham se chamadas: passou para histórico bloqueado ativo/encerrado (abertura preserva ID/mensagens e ended=true), bloqueado sem histórico (sem acionador), Base ativa recolhida e Home ativa aberta. Trata-se de verificação sintética de estado/props, não de renderização de conta bloqueada no navegador.

Preview READY dpl_Duy3epismFUKy8taTFkhxNFoj7jq, SHA eef466314f363a72e8e60257d8f48825f1e23827. Smoke no navegador integrado da mesma conta autorizada, 320×568: entrada recolhida, título inteiro em duas linhas, retorno à direita em duas linhas, fundo branco e meta only light; clique retoma a mesma mensagem anterior, campo vazio focado e envio desabilitado. Capturas final320.jpg e final320-conversa.jpg; métricas finais adicionadas a qa-runtime.json. Nenhuma mensagem digitada/enviada. Mantidos todos os limites de aparelho real e de estados bloqueados não exercitados ao vivo.

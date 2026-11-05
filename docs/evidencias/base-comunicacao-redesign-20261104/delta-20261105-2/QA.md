# QA — rodada2,05/11/2026

Runtime final aferido: fb4c98304076c1450809d604063b24724256eca7; Preview READY dpl_HeykqadtysEgofANSGREVcqt3mcL. Continuação do PR1117/branch codex-app/base-comunicacao-redesign-20261104. Sem merge. Capturas apresentacao/pagina/orientacao em390x844 e1440x900, materiais/inteligencia390x844, identificacao/orientacao320x568: todas desta versão. qa-runtime.json guarda medidas e resultados. Os quatro print-N são referências humanas anteriores, não resultado.

## Resultado

-17/17 seções: livro28px em alvo44x44, orientação expansível visível no início do corpo e antes dos editores; dimensões desktop768x672. Nenhum botão Melhorar meu texto; Revisar esta seção com IA presente apenas nas7 seções da categoria3. Nenhuma geração/revisão real disparada.
-Como funciona: SVG24px efetivos, caixa44x44, padding0, brand700 sobre brand50. QA encontrou compressão pelo padding do Button compartilhado em7820348f; corrigida localmente com !p0/shrink0 emfb4c9830, sem alterar componente global.
-Ajuda/placeholder14px, peso normal, rgb117:117:117 sobre branco, contraste calculado4,61:1; cor preservada e discrição obtida pela escala. Fonte raiz16px/text-size-adjust100%, sem contornar ampliação do usuário.
-320px: título longo, livro e Fechar separados, sem overflow horizontal. Dialog304x552;390px374,4x672. Categoria2 com mesmas dimensões das outras. Ajuda acionada após rolagem192,8→0 no formulário de identificação.
-Preferência testada em7820348f (código de preferência idêntico emfb4c9830): abertura automática inicial; Entendi sem checkbox fecha e reload reabre; marcar e confirmar suprime no reload; reabrir manualmente mostra checkbox marcada; desmarcar e Escape fecha sem persistir dispensa; sair/voltar à Base reabre. Abertura automática repetida no runtime final após correção dos ícones. Preferência QA deixada desmarcada; aba limpa, categoria1 e viewport resetada.
-Toggle clique e Escape prioritário testados; rascunho temporário preservado ao fechar ajuda; Cancelar exige descarte; descarte limpa rascunho. Teste de rascunho realizado em7820348f, sem mudança comportamental emfb4c9830. Nenhum save, upload, remoção de material ou mutação de negócio realizada.
-Console de Preview sem errors/warn capturados.

## Validações e limites

npm ci executado com sucesso; npm run check executado após implementação e novamente após correção dos ícones:0 erros e23 warnings preexistentes, todas validações de domínio aprovadas. npm run build não executado conforme instrução do repositório. Revisão React aplicada sem novas dependências/listeners/fetch; diff atual e main..HEAD/main...HEAD conferidos somente no escopo. Secrets, env, banco, workflows, Header global, Design System e tokens globais preservados.

npm run dev iniciou emlocalhost3000; navegador local confirmou erro Your project's URL and Key are required to create a Supabase client, nos recursos NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausentes. Sem criar/copiar credencial por rotina. QA realizado no Preview já autorizado/autenticado. Bloco AGENTS gerado automaticamente pelo dev removido do diff após conferência; servidor e aba temporária encerrados.

A captura voltou a funcionar nesta rodada, superando a limitação histórica registrada emdelta-20261105/QA.md. Dez imagens novas recuperáveis neste diretório. Compressão desktop limita julgamento tipográfico fino; revisão visual usa mobile/medidas como complemento. Não há demonstração nova de modo escuro, ampliação de fonte, teclado virtual, segundo usuário autenticado, escrita remota ou IA real. Isolamento por usuário é estruturalmente verificado pela chave derivada da identidade já injetada, sem trocar a sessão de QA. Não se declara conformidade WCAG integral.

Parecer de Design focal em revisao-design.md: aderente, sem achado material pendente, com limites acima. Code Review independente será vinculado ao HEAD final na entrega/PR; alteração posterior de HEAD exige nova revisão. Documentação/capturas posteriores não alteram os blobs de runtime aferidos.

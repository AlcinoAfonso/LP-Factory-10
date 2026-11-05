# QA do delta de 05/11/2026

Contrato vigente deste delta: [contrato.md](contrato.md). Código publicado e medido no HEAD 4ea98083204198c2165a26939eb76362a01d6e37, PR #1117, mesma branch. Preview READY: deployment6TKvtp2evmLoFK5gZvNHnyA5WUog, [Base de Comunicação](https://lp-factory-10-git-codex-app-base-27fb8c-alcino-afonsos-projects.vercel.app/a/qa-e10-12-useful-20261010/base-comunicacao). Nenhuma mutação persistente na conta de QA.

## Resultado observado no navegador

- Frase Reúna a verdade… ausente; Como funciona é um botão quadrado de44×44 junto do H1, com ?, nome acessível e apresentação original. Entendi devolve foco ao ícone.
-17 ícones de livro aberto, um por seção nas três categorias: nome acessível Exemplos + seção,44×44, aria-controls/expanded, ajuda existente e Escape que recolhe somente a ajuda. Como preencher e Melhorar meu texto ausentes dos popups. Na categoria1 não há consumidor client de assistência individual; revisão e geração da categoria3 preservadas. Resultados individuais: [qa-icons.json](qa-icons.json).
- Texto auxiliar e placeholder medidos em15,4px (antes14); contador em13,2px (antes12). Conteúdo digitado continua14px. Cor efetiva rgb(117,117,117), contraste4,61:1 sobre branco. Ajustes limitados ao CSS Module desta Base, sem tokens globais. [Coleta](qa-rendering.json).
- Popups nas três categorias: mesma largura/altura em320/390/430/1280/1440px. Altura672px nos viewports de844/1000px; larguras304/374,4/414,4/768/768px respectivamente. Sem overflow horizontal do documento ou corpo. Uma diferença provocada pela barra de rolagem do fundo foi identificada e corrigida com largura relativa ao viewport (dvw), sem mudar componentes globais. [15 medições](qa-dimensions.json).
- Rascunho de30.000 caracteres: contador real e Salvar habilitado, sem submissão. Ajuda/Escape preserva texto; Cancelar pede confirmação; Continuar editando conserva rascunho. Voltar ao valor inicial desabilita Salvar. Em320×480, navegação por Tab alcança Salvar dentro da viewport. [Coleta](qa-editing.json).
- FAQ mantém Pergunta/Resposta e Revisar esta seção com IA; não foi executada geração remota. Console do Preview sem erros/warnings na jornada.

## Checks e limites

- npm ci executado com lockfile preservado; npm run check aprovado no código final, zero erros e23 warnings preexistentes. Build local não executado. A auditoria npm mantém19 vulnerabilidades das dependências anteriores; sem mudança de dependências neste recorte.
- npm run dev iniciado em localhost:3000; erro local confirmado por falta de URL/chave pública Supabase. QA autenticado realizado no Preview existente, sem pedir novo login nem copiar credenciais/configuração. Servidor local encerrado e acréscimo automático do Next ao AGENTS restaurado.
- Fonte de ajuda, persistência, actions, prompts, banco, Design System e Header compartilhado preservados. A retirada da interface de assistência da categoria1 é a mudança funcional explicitamente autorizada pelo novo pedido; não há remoção de backend ou da revisão da categoria3.
- **Capturas novas indisponíveis:** screenshot retorna Unable to capture screenshot tanto na aba existente quanto em aba temporária da mesma sessão, com visibilidade ligada, e também pela integração nativa cua_repl. Acesso, árvore de acessibilidade, layout e estilos computados continuaram disponíveis. Não foram usadas imagens antigas como prova deste delta nem geradas imagens artificiais de validação. A disponibilidade da captura foi solicitada ao humano enquanto o restante do QA prosseguia.
- Por isso não há nova aprovação visual por screenshots nem retorno focal de Design declarado para este delta. O parecer anterior é histórico. As verificações acima são de DOM renderizado/interações e medidas; não substituem julgamento visual de composição ou auditoria WCAG integral. Fonte ampliada, tema escuro e teclado virtual seguem sem demonstração; altura reduzida foi testada. Sem saves reais ou geração remota nesta rodada.
- PR mantido draft, merge proibido. Code Review independente do HEAD final e checks remotos ficam registrados no recibo do PR; nenhuma conclusão anterior é aplicada automaticamente ao novo SHA.

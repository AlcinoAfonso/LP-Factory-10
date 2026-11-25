# Correção visual da Base no celular

Aprovado em 25/11/2026: fundo claro por enquanto, cabeçalho responsivo sem partir palavras e conversa de nicho recolhida na entrada. Restrição humana final: apenas design. Base: origin/main 10b144d056d258716d5240f8082ff601c04db599; branch codex-app/base-mobile-light-20261125, mesma worktree da frente anterior, novo PR sem merge. O PR #1188 paralelo já está na base e permanece intocado.

Delta permitido: page.tsx e CommunicationBase.module.css da Base e apresentação de AccountNicheConversation.tsx. Meta color-scheme only light nesta rota e fundo local branco com token existente. Cabeçalho preserva fonte/palavras/alvos; retorno pode reorganizar quando faltar espaço, sem sobreposição. Base sempre inicia recolhida; clicar retoma conversa ativa existente ou usa o mesmo fluxo anterior para conversa encerrada. Home, histórico, callbacks, guardas, agentes/prompts, pesquisa, leitura/salvamento e dados não recebem mudanças. Design System não alterado.

Referência: screenshot humano 248731.jpg, definição gestor-design /root/design_mobile_light e QA anterior. Catálogo Drive foi autorizado para autenticar a identidade descartável de QA; credenciais não fazem parte de arquivos/evidências. Conta correta Corretor Alfa QA2 confirmada na UI, com conversa ativa preexistente. Não enviar mensagem nem salvar conteúdo no QA.

Validar notebook/mobile, reflow, palavras inteiras, metadado e fundo claros, entrada recolhida e abertura preservando a mesma mensagem existente. Limite: opt-out de escuro suportado pelo navegador; não há garantia contra inversão externa que ignore declarações do site. npm ci, npm run check, dev, QA e Code Review do HEAD final.

# Cabeçalho da Base e redefinição de nicho

Autorização humana de 25/11/2026: manter nome público, nicho, status e navegação no cabeçalho global do Account Dashboard; remover as cópias de nome/nicho no conteúdo da Base; trocar Ver conversa de nicho por Redefinir nicho logo abaixo do título, usando o fluxo existente. Continuação no PR #1187, checkpoint 17ef510b, sem merge.

Delta: page.tsx da Base e AccountNicheConversation.tsx. Header global, Home, autorização/server actions, agente/IA/prompts/persistência e demais categorias permanecem intactos. Conversa encerrada na Base abre nova apresentação no cliente usando setHiddenDialogue existente; clicar não grava nem envia mensagem. Estado bloqueado mantém a mensagem existente e impede nova conversa. Home mantém acesso ao histórico e confirmações; conversa ativa mantém continuação.

Validar notebook/mobile: identidade global presente na Base e Membros, ausência das cópias dentro da Base, ação abaixo do título e formulário novo sem histórico encerrado. Não enviar conversa, confirmar nicho ou salvar dados reais. npm ci/check e Code Review do HEAD final. Sem alterar Design System.

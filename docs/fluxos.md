# Fluxos 2.1 — LP Factory 10

## Seção 1 — Autenticação e Sessões

### ✅ Fluxo 1 — Esqueci minha senha *(Implementado — validado em E5)*
#### Ponto de Partida
1. Usuário clica “Entrar” na página principal.  
2. Abre-se um modal de login com campos de email e senha.  
3. Usuário clica em “Esqueci minha senha”.

#### Cenário 1 — Sucesso
- Email enviado com instruções.  
- Link abre nova aba com formulário de nova senha.  
- Senha redefinida com sucesso → redirect para dashboard.  
- Modal original mostra “Processo concluído”.

#### Cenário 2 — Link Expirado
- Página mostra “Este link expirou”.  
- Campo inline para reenviar novo link.

#### Cenário 3 — Email não cadastrado
- Mensagem neutra: “Se este email estiver cadastrado, você receberá instruções”.

#### Cenário 4 — Repetidas tentativas
- Bloqueio de 5 minutos para reenvio.  
- Contador visual.

#### Cenário 5 — Erro ao salvar senha
- Senhas diferentes, senha fraca ou erro de rede tratados com mensagens específicas.  
- Link continua válido por mais 5 minutos.

#### Cenário 6 — Link já usado
- Página mostra: “Este link já foi usado. Solicite novo reset”.

#### Cenário 7 — Usuário lembrou a senha
- Link “Voltar ao login” disponível a qualquer momento.

#### Regras Gerais
- Modal não fecha sozinho, exceto após sucesso.  
- Sempre há alternativa (reenviar link, voltar ao login).

---

### ✅ Fluxo 2 — Login com Senha (MVP) *(Implementado — validado em E5)*
#### Ponto de Partida
1. Usuário clica “Entrar” → Modal de login abre.  
2. Digita email e senha.

#### Cenário 1 — Sucesso
- Modal mostra “Entrando…”.  
- Login bem-sucedido fecha modal.  
- Redirect automático para `/a`.

#### Cenário 2 — Credenciais incorretas
- Mensagem genérica: “Email ou senha incorretos”.  
- Campo de senha limpo, link “Esqueci minha senha” disponível.

#### Cenário 3 — Múltiplas tentativas falhas
- Após 3 falhas: bloqueio de 3s.  
- Após 5 falhas: bloqueio de 10s.  
- Contador visual.

#### Cenário 4 — Erro de rede/servidor
- Mensagem: “Erro de conexão. Tente novamente”.  
- Campos mantêm valores (exceto senha).

#### Cenário 5 — Usuário já logado
- Detecta sessão ativa.  
- Redirect direto para `/a`.

#### Regras Gerais
- Modal só fecha em caso de sucesso.  
- Erros de credenciais sempre genéricos.

> **Nota Técnica:** O Sistema de Acesso 11 prevê também login por Magic Link, mas no MVP será usado apenas senha. Magic Link pode ser habilitado em fase futura.

---

## Seção 2 — Governança de Contas e Recursos

### ✅ Fluxo 3 — Criar Conta Consultiva *(Implementado — validado em E7)*
#### Ponto de Partida
1. Admin acessa painel administrativo `/admin/tokens`.  
2. Clica "Gerar Token" e preenche:  
   - Email do cliente (obrigatório)  
   - Referência do contrato (obrigatório — será o nome preliminar da conta)  
   - Validade (padrão 7 dias)  
3. Sistema gera token e exibe link:  
   `https://...com/onboard?token={uuid}`  
4. Admin copia link e envia ao cliente (WhatsApp, email, etc).

#### Passo 1 — Cliente Acessa Link
1. Cliente recebe link e clica.  
2. Sistema valida token:  
   - ✅ Válido → prossegue para Passo 2  
   - ❌ Inválido/expirado/usado → Cenário 2

#### Passo 2 — Cliente Define Senha
1. Página `/onboard` exibe contexto:  
   “Bem-vindo ao LP Factory 🚀 — Defina sua senha para acessar o dashboard.”  
2. Cliente preenche senha (com requisitos de segurança).  
3. Sistema:  
   - Cria usuário no Supabase Auth  
   - Consome token (marca como usado)  
   - Cria conta com nome preliminar = contract_ref do token  
   - Associa cliente como Owner  
   - Status inicial: `pending_setup`

#### Passo 3 — Acesso ao Dashboard
1. Cliente é redirecionado para `/a/{account-slug}`.  
2. Banner destaque: “Defina o nome da sua conta. Você pode alterá-lo quando quiser.”  
3. Ao nomear a conta **ou** criar primeira LP → status muda para `active`.

#### Cenário 2 — Token Inválido ou Expirado
URL:  
`https://...com/onboard?token=%7buuid%7d`

- Tela mostra: “Seu link não é mais válido. Solicite um novo ao suporte.”  
- Botão de contato rápido para suporte.  
- Admin pode revogar e reenviar token pelo painel.

#### Cenário 3 — Convite da LP Factory (Opcional)
- Cliente pode convidar LP Factory como membro (Admin/Editor/Viewer).  
- Convite **não** altera modelo de consultoria contratado.  
- Exemplo: contrato DIY + cliente convida como Admin = modelo comercial permanece DIY.  
- Em caso de divergência, prevalece o contrato acordado.

---

### Fluxo 4 — Ativar Plano Pago (Stripe Sync — MVP)

#### Ponto de Partida
1. No painel da conta Free, usuário escolhe “Ativar plano pago”.

#### Cenário 1 — Checkout concluído
- Redireciona para checkout seguro.  
- Ao voltar, o painel informa: Plano ativo e libera recursos do plano.  
- Mensagem de confirmação visível (ex.: “Seu plano foi atualizado”).

#### Cenário 2 — Checkout cancelado
- Retorna ao painel com estado inalterado.  
- Mensagem discreta: “Pagamento cancelado. Você pode tentar novamente quando quiser”.

#### Cenário 3 — Erro de rede/tempo
- Aviso amigável e opção “Tentar novamente”.  
- Não perde dados preenchidos.

#### Regras Gerais
- O status do plano deve ficar visível no painel (ex.: Free, Pro).  
- Nunca expor detalhes técnicos ou mensagens do gateway ao usuário final.

> **Notas Técnicas:**  
> - A atualização de plano depende da integração com Stripe Sync 10.  
> - O sistema deve atualizar `billing_status` e `subscription_current_period_end` conforme webhook Stripe.

---

## Seção 3 — Gestão de Usuários e Convites

### Fluxo 5 — Convidar Membro

#### Ponto de Partida
- Admin/Owner acessa a aba **Membros** no painel da conta.  
- Clica em “Convidar”.

#### Cenário 1 — Convite enviado
- Preenche email e papel (Admin, Editor, Viewer).  
- Usuário convidado recebe email com link de acesso.  
- Status aparece como “Pendente” na lista de membros.

#### Cenário 2 — Email já convidado
- Sistema mostra aviso: “Este email já possui convite ativo”.

#### Cenário 3 — Dados inválidos/rede
- Email vazio ou inválido → mensagem clara.  
- Falha de rede → “Erro ao enviar convite. Tente novamente”.

#### Regras Gerais
- Convites só podem ser enviados por Admin ou Owner.  
- Usuário sempre pode cancelar convite pendente.

---

### Fluxo 6 — Aceitar Convite

#### Ponto de Partida
- Usuário clica no link recebido por email.

#### Cenário 1 — Sucesso
- Abre página de criação de senha (se não tiver conta) ou login (se já tiver).  
- Ao concluir, status muda de “Pendente” para “Ativo”.  
- Usuário entra direto na conta convidada.

#### Cenário 2 — Link expirado
- Página mostra: “Este convite expirou”.  
- Campo inline para pedir novo convite ao Admin.

#### Cenário 3 — Link já usado
- Página mostra: “Este convite já foi utilizado”.  
- Orientação: entrar com o email cadastrado.

---

### Fluxo 7 — Gerenciar Papéis e Status

#### Ponto de Partida
- Admin/Owner acessa a aba **Membros**.

#### Cenário 1 — Alterar papel
- Seleciona usuário e muda papel (ex.: de Editor → Admin).  
- Mensagem de confirmação exibida.

#### Cenário 2 — Suspender/Remover membro
- Admin clica em “Remover” ou “Suspender”.  
- Sistema pede confirmação.  
- Usuário perde acesso imediatamente.

#### Cenário 3 — Erro de rede/servidor
- Mensagem: “Erro ao atualizar membro. Tente novamente”.

#### Regras Gerais
- Apenas Admin/Owner podem alterar papéis.  
- Viewer não pode convidar nem alterar papéis.  
- **Nota Técnica:** O papel `super_admin` existe e possui bypass de todas as restrições.

---

## Seção 4 — Auditoria e Rastreamento

### Fluxo 8 — Registro Automático de Ações

#### Ponto de Partida
- Qualquer ação crítica do usuário (login, criação de conta, convite, mudança de papel, upgrade de plano).

#### Cenário 1 — Sucesso
- Sistema registra automaticamente: quem fez, o que fez, quando e em qual conta.  
- Registro visível apenas para Admins/Owners ou Super Admins.

#### Cenário 2 — Erro no registro
- Se auditoria falhar, ação principal ainda ocorre, mas é marcado um alerta interno para correção.

#### Regras Gerais
- Registro é sempre automático (usuário não pode desativar).  
- Nunca mostrar mensagens técnicas de auditoria para o usuário final.

---

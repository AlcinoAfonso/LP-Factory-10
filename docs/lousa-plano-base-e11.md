# Plano-base E11 — Gestão de Usuários e Convites

- Versão: v3
- Data: 28/07/2026
- Status: fases `11.1.3` a `11.1.6` implementadas; `11.1.7` em validação para ativação controlada.
- Recorte no roadmap: `11.1 — Gestão de membros e convites`
- Path canônico: `docs/lousa-plano-base-e11.md`
- Plano conceitual: N/A — debate realizado entre Estrategista, Analista e humano antes da v1.
- Fontes obrigatórias: `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/prompt-executor.md`, `docs/prompt-abc.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/platform-config.md`, `docs/design-system.md`, `docs/lp-planejamento.md`, `docs/supa-up.md`, `app/auth/confirm/route.ts`, `app/auth/update-password/page.tsx`, `app/a/home/page.tsx`, `app/a/[account]/actions.ts`, `lib/admin/adapters/adminAccountsAdapter.ts`, `supabase/migrations/20260611172930_remote_public_baseline.sql` e documentação oficial vigente do Supabase para `listUsers()`, `createUser()`, `updateUserById()`, `inviteUserByEmail()`, templates de Auth e redirects.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A gestão funcional de membros e convites está implementada, mas permanece desabilitada até a conclusão da fase `11.1.7`.
- A E11 deve permitir que owner e admin administrem membros não-owner da conta pelo Account Dashboard.
- O fluxo deve atender tanto um e-mail ainda inexistente no Supabase Auth quanto um usuário já cadastrado.
- O aceite deve ativar somente o vínculo selecionado e nunca todos os vínculos pendentes do usuário.
- O resultado deve permanecer simples para o MVP, dentro de Next.js, Supabase e TypeScript, sem envio próprio de e-mail e sem infraestrutura paralela.

### 1.2. Estado real confirmado

- `account_users` possui:
  - unicidade por `(account_id, user_id)`;
  - papéis `owner`, `admin`, `editor` e `viewer`;
  - estados `pending`, `active`, `inactive` e `revoked`;
  - `created_at` como registro da criação da linha, sem representar a validade de cada link do Supabase Auth;
  - proteção do último owner.
- As policies atuais permitem leitura do próprio vínculo ou por owner/admin e reservam mutações diretas a owner/admin ou platform admin.
- `accept_account_invite(account_id, ttl_days)` é invoker, identifica o vínculo por conta e usuário e depende de uma policy de update que o convidado não satisfaz.
- `activate_user_from_auth_hook(event)` ativa todos os vínculos pendentes do usuário e não pode ser usado pela E11.
- `/auth/confirm` confirma tokens no POST, com mitigação anti-scanner, mas atualmente não preserva contexto específico de convite nem ativa membership.
- `/a/home` redireciona imediatamente o usuário logado para a última ou primeira conta ativa e não apresenta convites pendentes.
- O projeto já possui `createServiceClient()` server-only e consulta `user_id → e-mail` por `auth.admin.getUserById()`.
- Supabase Auth, SMTP via Resend, redirects e o template nativo `Invite user` pertencem à stack atual.
- A migration `20260727155312_e11_account_members_security.sql` foi aplicada e o estado pós-apply foi verificado; a prova hospedada deve partir do estado remoto atual, sem assumir inventários anteriores de contas ou usuários.

### 1.3. Decisões humanas encerradas

- Usuário já cadastrado e confirmado não recebe novo e-mail.
- Ao entrar no produto, esse usuário vê o convite pendente e pode aceitar ou recusar.
- Owner e admin acessam a gestão de membros.
- Convites podem atribuir somente `admin`, `editor` ou `viewer`.
- O owner não é transferido, rebaixado, desativado ou revogado na E11.
- Não haverá e-mail customizado pelo Core.
- Não haverá tabela, serviço, fila, job, agente ou engine de convite.

### 1.4. Decisões funcionais consolidadas

- Owner e admin podem listar membros e convites e administrar qualquer vínculo não-owner.
- Owner e admin possuem o mesmo poder operacional sobre `admin`, `editor` e `viewer`; a diferença preservada é que somente o owner ocupa o papel protegido.
- O ator não altera o próprio papel nem desativa o próprio vínculo na E11.
- Membro ativo pode ter o papel alterado entre `admin`, `editor` e `viewer`.
- Desativação aplica `active → inactive`; revogação aplica `pending → revoked`.
- Convite duplicado não cria segundo membership:
  - vínculo `active`: informar que o usuário já pertence à conta;
  - vínculo `pending`: preservar o vínculo; usuário não confirmado pode receber reenvio e usuário confirmado continua com aceite interno;
  - vínculo `inactive` ou `revoked`: iniciar novo ciclo de convite sem criar duplicidade permanente;
  - vínculo pertencente a outra conta: não impede novo convite para a conta atual.
- A identidade mínima exibida é o e-mail obtido server-side do Supabase Auth; nome não é requisito do MVP.
- Para usuário novo ou ainda não confirmado, a validade de cada link pertence exclusivamente ao Supabase Auth e à configuração vigente de Email OTP Expiration.
- Reenvio gera um novo convite e um novo link do Auth, sem criar ou renovar prazo local do membership.
- Para usuário já confirmado, o vínculo permanece `pending` até aceitar, recusar ou ser revogado por owner/admin.
- O MVP não possui expiração automática local do membership, não converte `pending → revoked` pelo relógio e não exibe prazo exato sem fonte operacional verificada.
- Usuário confirmado aceita ou recusa apenas um de seus próprios vínculos pendentes por vez.

### 1.5. Decisões técnicas consolidadas

- O boundary canônico permanece `lib/access/account-members/`, com `contracts.ts`, `policy.ts`, `validation-cases.ts` e `index.ts`.
- O acesso a `public.account_users` e `public.accounts` pertence exclusivamente ao adapter server-only `adapters/accountMembersAdapter.ts`.
- Operações de Supabase Auth Admin pertencem exclusivamente ao adapter server-only `adapters/authAdminAdapter.ts`; nenhum arquivo mistura Data API e Auth Admin.
- `policy.ts` contém apenas regras puras de transição e proteção de owner e ator, sem reimplementar autenticação ou resolução de conta.
- `contracts.ts` importa `MemberRole` e `MemberStatus` de `lib/types/status.ts`, sem redefini-los.
- `index.ts` não exporta clients, rows de banco nem tipos do SDK Supabase.
- Toda mutação 1-a-1 usa filtros de conta, membership, usuário e estado esperado, aplica `.maxAffected(1)` e só retorna sucesso após confirmar exatamente uma linha ou o estado idempotente permitido.
- `e-mail → user_id` será resolvido por `adapters/authAdminAdapter.ts` com `auth.admin.listUsers()` paginado, depois da autorização do owner/admin.
- `lib/access/guards.ts` será estendido com um guard server-only de gestão de membros que resolve sessão e Access Context, exige conta permitida, membership `active` e papel `owner` ou `admin`, e devolve contexto autoritativo com `accountId`, `accountSubdomain`, `actorUserId` e `actorRole`.
- A página administrativa, suas Server Actions e os fluxos administrativos de convite usam esse guard antes de consultar Auth Admin ou chamar adapters privilegiados. A navegação pode usar o papel sanitizado do `AccessProvider` apenas para visibilidade; a URL e todas as actions administrativas repetem o guard server-side.
- O autoatendimento em `/a/home` não usa o guard owner/admin. Ele exige sessão autenticada, deriva `actorUserId` exclusivamente de `auth.getUser()`, seleciona a linha por `account_user_id` e confirma `account_users.user_id = actorUserId` e status `pending` antes de aceitar ou recusar.
- A UI nunca recebe resultado que revele a existência global de um e-mail no Auth.
- E-mail novo segue a ordem:
  - normalizar e procurar o e-mail;
  - criar usuário não confirmado com `auth.admin.createUser()`;
  - criar o membership `pending`;
  - gerar estado de convite versionado e assinado;
  - gravar o estado opaco em `user_metadata`;
  - enviar pelo `auth.admin.inviteUserByEmail()`.
- O estado assinado deve conter no mínimo versão, `account_user_id`, `account_id` e `user_id`.
- `user_metadata` serve somente como transporte para o template; nunca participa da autorização.
- A assinatura usa HMAC e secret server-side `INVITE_STATE_SECRET`, sem valor versionado.
- `invite_state` chega no link somente como transporte do template e é copiado do GET para o POST anti-scanner.
- Depois de o Supabase confirmar o Auth e estabelecer a sessão, o POST valida assinatura, versão e correspondência com o usuário autenticado e grava o estado assinado em cookie `HttpOnly`, `Secure` em ambiente hospedado, `SameSite=Lax` e `Path=/auth`, isolado pelo `account_user_id`.
- O redirect para `/auth/update-password` transporta apenas o identificador opaco necessário para selecionar esse cookie.
- Após a confirmação Auth, o usuário novo deve concluir o cadastro definindo senha em `/auth/update-password` com a sessão autenticada.
- A action de senha relê a sessão com `auth.getUser()`, recupera o cookie, revalida assinatura, usuário, conta, membership e status, define a senha e só então ativa a linha.
- O cookie é removido apenas após ativação bem-sucedida ou rejeição definitiva; falha transitória de ativação o preserva para retry. Query string, `user_metadata` e cookie nunca autorizam isoladamente.
- Somente depois da senha definida, a ativação valida simultaneamente o usuário autenticado, a assinatura e a linha específica de `account_users`.
- Aceite repetido da mesma linha já `active` retorna sucesso idempotente; divergência, `inactive`, `revoked` ou ausência falha fechada.
- Se a senha for definida e a ativação falhar, o mesmo vínculo pode ser retomado por retry idempotente; enquanto permanecer `pending`, não concede acesso à conta.
- Usuário confirmado aceita ou recusa pela sessão autenticada e pelo `account_user_id` escolhido, sem `invite_state`.
- Reenvio do usuário ainda não confirmado usa nova chamada a `inviteUserByEmail()`; `auth.resend()` não será usado como convite.
- O hook amplo existente não será adotado.
- O runtime não dependerá da função legada de aceite enquanto ela não garantir linha específica, autorização e confirmação de linha alterada.
- A migration incremental da E11 está aplicada e verificada. O contrato final de grants, RLS, policies e funções reside em `docs/schema.md`; o snippet canônico de verificação é `supabase/snippets/e11_account_members_verify.sql`.
- A migration não cria tabela, coluna, view, RPC ou `SECURITY DEFINER` e preserva o Trigger Hub e a proteção do último owner.
- O gate server-only `E11_MEMBERS_ENABLED` é obrigatório, com ausência ou valor diferente de `true` interpretado como desabilitado. Enquanto desabilitado, a navegação não aparece e `/a/[account]/members`, Server Actions e o fluxo específico de convite falham fechados sem chamar Auth Admin nem realizar writes.
- O booleano do gate pode ser passado explicitamente pelo layout server ao Header, mas não integra a decisão de autorização do `AccessProvider`.
- As fases `11.1.3` a `11.1.6` estão implementadas. A configuração remanescente do Supabase Auth e a prova hospedada da fase `11.1.7` bloqueiam a habilitação do gate em Production.

## 2. Contrato do caso

### 2.1. Fluxo operacional — convite por owner/admin

- Gatilho: owner ou admin envia e-mail normalizado e papel permitido em `/a/[account]/members`.
- Entrada:
  - conta resolvida pelo Access Context;
  - ator autenticado e ativo como owner/admin;
  - e-mail válido;
  - papel `admin`, `editor` ou `viewer`.
- Processamento:
  - usar o guard canônico de `lib/access/guards.ts` e autorizar o ator antes de consultar o Auth;
  - resolver o usuário por e-mail;
  - classificar o vínculo atual;
  - criar ou preparar um único ciclo `pending`;
  - para usuário não confirmado, preparar estado assinado e enviar pelo template nativo;
  - para usuário confirmado, não enviar e-mail e deixar o convite disponível no produto.
- Validação:
  - impedir owner como papel convidado;
  - impedir duplicidade;
  - impedir enumeração global de usuários;
  - confirmar que o membership pertence à conta autorizada.
- Persistência: `auth.users` e `public.account_users` existentes; nenhuma estrutura nova por padrão.
- Consumo:
  - e-mail nativo para usuário não confirmado;
  - pendência interna para usuário confirmado;
  - lista atualizada para owner/admin.
- Fallback:
  - falha no envio mantém estado recuperável e informa erro temporário;
  - não enviar e-mail próprio;
  - não apagar usuário Auth como compensação automática;
  - permitir tentativa posterior dentro das regras do ciclo.

### 2.2. Fluxo operacional — aceite por e-mail

- Gatilho: usuário não confirmado abre o link do template `Invite user`.
- Entrada: token ou code do Supabase, tipo `invite`, redirect seguro e `invite_state`.
- Processamento:
  - GET apresenta o intersticial sem consumir o token;
  - POST confirma o token e obtém a sessão do usuário;
  - valida assinatura, versão e correspondência do estado com o usuário autenticado;
  - persiste o estado validado no cookie server-only isolado por `account_user_id` e redireciona somente com seu identificador opaco;
  - direciona o usuário para concluir o cadastro em `/auth/update-password`;
  - relê sessão e cookie, revalida o contexto e define a senha com a sessão autenticada;
  - valida a linha específica por `account_user_id`, `account_id`, `user_id` e status;
  - ativa somente essa linha;
  - redireciona para a conta aceita.
- Validação:
  - a validade do token ou code é decidida pelo Supabase Auth;
  - parâmetros manipulados não alteram a conta;
  - outro membership pendente do usuário permanece inalterado;
  - estado já ativo é idempotente;
  - redirect final é interno ou allowlisted;
  - logout e novo login por e-mail e senha funcionam após a conclusão.
- Persistência:
  - senha definida no Supabase Auth;
  - `pending → active` na linha específica somente depois da senha.
- Consumo: cadastro concluído, vínculo ativo, sessão válida e redirecionamento para a conta aceita.
- Fallback:
  - token inválido ou expirado é rejeitado pelo Auth;
  - estado inválido ou vínculo divergente falha fechado;
  - abandono antes da senha mantém o vínculo `pending` e sem acesso;
  - falha de ativação após a senha permite retry idempotente da mesma linha;
  - não ativar por `account_id` isolado;
  - não usar o hook amplo.

### 2.3. Fluxo operacional — usuário já cadastrado

- Gatilho: usuário confirmado entra em `/a/home`.
- Entrada: sessão autenticada e vínculos próprios `pending`.
- Processamento:
  - exigir sessão autenticada e derivar o usuário por `auth.getUser()`, sem guard owner/admin;
  - verificar pendências antes do redirect automático para conta ativa;
  - mostrar conta, papel proposto e ações aceitar ou recusar;
  - processar uma linha selecionada por vez;
  - validar `account_users.user_id = usuário autenticado`.
- Validação:
  - a linha selecionada deve estar `pending` e ter `account_users.user_id = usuário autenticado`;
  - o usuário não acessa pendência de terceiro;
  - o vínculo permanece pendente sem expiração automática local;
  - aceite e recusa repetidos possuem resposta determinística.
- Persistência:
  - aceitar: `pending → active`;
  - recusar: `pending → revoked`.
- Consumo:
  - após aceitar, permitir entrada na nova conta;
  - após recusar, retirar a pendência da lista.
- Fallback:
  - sem pendências, preservar o redirect atual de `/a/home`;
  - falha de leitura não concede acesso e apresenta feedback seguro.

### 2.4. Fluxo operacional — gestão posterior ao aceite

- Gatilho: owner/admin altera papel ou desativa membro ativo.
- Entrada: conta autorizada, `account_user_id` não-owner e operação permitida.
- Processamento:
  - reler vínculo alvo;
  - rejeitar owner e o próprio vínculo do ator;
  - aplicar papel permitido ou `active → inactive`;
  - atualizar listagem.
- Validação:
  - owner permanece intacto;
  - nenhuma operação usa somente `user_id` sem conta e membership;
  - estado concorrente diferente do esperado falha fechado.
- Persistência: atualização da linha específica.
- Consumo: lista de membros com estado e papel atuais.
- Fallback: mensagem segura e nenhuma alteração parcial.

### 2.5. Segurança e autorização

- A página, Server Actions e adapters devem validar sessão, conta e papel antes de qualquer operação administrativa.
- Essa decisão é centralizada no guard de gestão de membros em `lib/access/guards.ts`; `policy.ts` recebe o contexto autorizado e aplica somente proteções de alvo, papel e transição.
- O fluxo self-service de `/a/home` usa um guard autenticado próprio, sem requisito owner/admin, e autoriza somente a linha `pending` cujo `user_id` coincide com o usuário obtido por `auth.getUser()`.
- Código client não acessa `SUPABASE_SECRET_KEY`, Auth Admin ou mutações privilegiadas.
- O service client fica restrito a módulos server-only.
- Toda escrita privilegiada deve repetir autorização no servidor e validar a linha afetada.
- Não confiar em `user_metadata`, query string, e-mail informado ou estado client para autorização.
- Comparações de e-mail devem usar normalização única e igualdade exata.
- Erros da UI devem evitar confirmar se um e-mail existe globalmente.
- Logs não registram tokens, `invite_state`, secret, e-mail integral ou metadata Auth.
- A migration aplica o contrato exato de grants e revogações da seção 1.5 e sua verificação distingue privilégios de tabela, RLS/policies e ACL de funções.
- A E11 não cria função `SECURITY DEFINER`.

### 2.6. Validade do link, reenvio e consistência

- Para usuário novo ou ainda não confirmado, o Supabase Auth é a única fonte de validade do link, conforme Email OTP Expiration vigente no projeto.
- O membership não possui prazo local no MVP e `account_users.created_at` não deve ser usado para calcular expiração de convite.
- Usuário já confirmado permanece `pending` até aceitar, recusar ou ser revogado por owner/admin.
- A UI não exibe prazo exato sem consultar uma fonte operacional real; não deriva prazo por constante local.
- Reenvio válido:
  - somente para membership `pending`;
  - somente para usuário ainda não confirmado;
  - mantém o mesmo `account_user_id`;
  - gera novo convite e novo link pelo Supabase Auth;
  - não usa `auth.resend()` como convite.
- O runtime não converte `pending → revoked` por passagem do tempo.
- Falha entre Auth, membership e envio não possui transação distribuída:
  - a ordem definida evita e-mail sem membership;
  - a operação deve ser idempotente;
  - retry não pode duplicar usuário ou vínculo;
  - compensação destrutiva automática permanece proibida.

### 2.7. UI e critérios visuais

- Rota canônica: `/a/[account]/members`.
- A navegação do Account Dashboard mostra a entrada somente para owner/admin.
- A página usa os componentes existentes do design system:
  - `Input`, `Select`, `Button`, `FormField`, `FeedbackMessage`, `EmptyState` e `LoadingState`;
  - cards somente para blocos funcionais ou estado vazio.
- Conteúdo mínimo:
  - cabeçalho com título e descrição;
  - formulário de convite;
  - membros ativos;
  - convites pendentes;
  - e-mail, papel e estado aplicáveis;
  - ações permitidas por linha.
- Estados obrigatórios:
  - carregando;
  - vazio;
  - sucesso;
  - erro seguro;
  - ação em andamento com botão desabilitado;
  - link Auth inválido ou expirado no fluxo por e-mail;
  - usuário já pertencente à conta.
- A interface deve funcionar em desktop e mobile sem tabela ilegível ou ações inacessíveis.
- A confirmação de ação destrutiva deve nomear o efeito: revogar convite ou desativar membro.
- Editor e viewer não veem a navegação e recebem bloqueio server-side ao tentar abrir a URL.

### 2.8. Matriz mínima de validação

- Owner e admin autorizados; editor e viewer bloqueados.
- E-mail inválido bloqueado antes do Auth.
- Papel owner bloqueado.
- E-mail inexistente cria usuário não confirmado, membership e envio.
- E-mail confirmado cria somente membership pendente e aparece em `/a/home`.
- E-mail não confirmado já existente reutiliza o usuário sem duplicá-lo.
- Membership ativo retorna “já pertence”.
- Membership pendente não duplica.
- Membership inactive ou revoked pode iniciar novo ciclo válido sem duplicar a linha.
- Reenvio para não confirmado funciona no Supabase hospedado.
- Reenvio preserva o contexto da linha e gera novo link conforme a validade controlada pelo Auth.
- Segundo link e comportamento do primeiro link após reenvio são registrados como evidência.
- Confirmação por e-mail cria sessão e conduz à definição de senha antes da ativação.
- Conclusão do cadastro ativa somente a linha assinada.
- Logout e novo login por e-mail e senha funcionam após o aceite.
- Abandono antes da senha ou falha de ativação mantém o vínculo sem acesso e permite retomada segura.
- Manipulação de `account_id`, `account_user_id`, `user_id` ou assinatura falha.
- Aceite repetido da linha ativa é idempotente.
- Usuário confirmado aceita e recusa somente pendências próprias.
- Alteração de papel admite apenas admin, editor e viewer.
- Owner não é alterado nem desativado.
- Ator não altera nem desativa o próprio vínculo.
- Revogação afeta pending; desativação afeta active.
- Erro ou zero linha alterada nunca retorna sucesso.
- Nenhum token, estado assinado, secret ou e-mail integral aparece em logs.
- Aplicar `prod#17` como baseline de validação, sem declarar conformidade WCAG integral: executar por teclado o formulário de convite, as ações por linha, o aceite ou recusa em `/a/home` e a definição de senha; confirmar foco visível e previsível, label e associação de erro nos campos, anúncio de feedback dinâmico, contraste legível, alvos de toque utilizáveis e ausência de ação acessível somente por hover, em desktop e mobile.

### 2.9. Dependências reais

- E2 — sessão, Supabase Auth, SSR e Access Context.
- E5/E6 — Account Dashboard, shell, navegação e componentes visuais existentes.
- `account_users`, proteção do owner, RLS, funções de convite e auditoria existentes.
- `/auth/confirm`, sua mitigação anti-scanner e `/auth/update-password` como base da conclusão do cadastro.
- `/a/home` e sua precedência atual de redirect.
- Supabase Auth Admin, template nativo `Invite user`, SMTP via Resend e Redirect URL allowlist.
- Vercel Preview e Production para o gate e o secret server-only já configurados.
- `docs/platform-config.md` como fonte única do estado e das regras de configuração externa.
- Fase `11.1.7` para a ordem vigente de configuração do Supabase Auth, prova hospedada, ativação e smoke.
- Não há dependência de E12, limite por plano, Stripe, automações ou agentes.

## 3. Fases e próxima ação

### 3.1. 11.1.3 — Domínio server-side e ciclo seguro de vínculos

- Status: implementada e verificada.
- Objetivo: implementar contratos, autorização, resolução de identidade e transições seguras de `account_users`.
- Escopo implementado:
  - criar o boundary `lib/access/account-members/`;
  - implementar contratos tipados e normalização de e-mail;
  - estender `lib/access/guards.ts` com o guard canônico owner/admin e reutilizá-lo em todos os consumidores administrativos;
  - implementar `listUsers()` paginado após autorização;
  - implementar leitura de membros e convites com e-mail server-side;
  - implementar classificação de active, pending, inactive e revoked;
  - implementar convite, aceite interno, recusa, alteração de papel, revogação e desativação como operações idempotentes por `account_user_id`;
  - criar migration obrigatória com o contrato exato de grants, RLS preservada e revogações de funções legadas definido na seção 1.5;
  - aplicar a migration após confirmar no Supabase que o hook amplo não estava configurado;
  - atualizar `docs/schema.md` na mesma alteração da migration, registrando grants finais de `account_users`, RLS/policies preservadas, funções legadas retiradas do caminho operacional e migration relacionada;
  - criar `supabase/snippets/e11_account_members_verify.sql` para verificar ACL de tabela, RLS/policies e ACL das funções separadamente;
  - impedir expiração automática local do membership e uso de `created_at` como validade do link;
  - criar casos executáveis da matriz aplicável.
- Artefatos implementados:
  - `lib/access/account-members/contracts.ts`;
  - `lib/access/account-members/policy.ts`;
  - `lib/access/account-members/adapters/accountMembersAdapter.ts`;
  - `lib/access/account-members/adapters/authAdminAdapter.ts`;
  - `lib/access/account-members/validation-cases.ts`;
  - `lib/access/account-members/index.ts`;
  - ajuste em `lib/access/guards.ts`;
  - `supabase/migrations/20260727155312_e11_account_members_security.sql`;
  - `supabase/snippets/e11_account_members_verify.sql`;
  - ajuste em `docs/schema.md`;
  - script de validação em `package.json`.
- Critérios de aceite:
  - nenhuma operação administrativa ocorre antes do guard owner/admin;
  - a busca por e-mail percorre todas as páginas necessárias;
  - nenhum resultado permite enumeração global pela UI;
  - transições e duplicidades seguem as seções 1.4 e 2.6;
  - owner e vínculo do ator permanecem protegidos;
  - zero linha alterada falha;
  - nenhuma mutação afeta mais de uma linha e o estado idempotente permitido é relido explicitamente;
  - `service_role` possui somente `SELECT`, `INSERT` e `UPDATE` em `account_users`, e os papéis revogados não executam as funções legadas;
  - nenhum client importa módulo privilegiado;
  - nenhuma tabela ou coluna nova é criada sem retorno ao Estrategista.
- Decisão da fase: concluída.
- Próxima ação: 11.1.4.

### 3.2. 11.1.4 — Convite de novo usuário, conclusão do cadastro e confirmação específica

- Status: implementada no repositório; validação hospedada pendente na `11.1.7`.
- Objetivo: entregar o convite nativo por e-mail, a definição de senha e o aceite seguro de uma única linha.
- Escopo implementado:
  - implementar criação prévia do usuário não confirmado e membership;
  - implementar HMAC versionado com `INVITE_STATE_SECRET`;
  - gravar o estado opaco em metadata somente para transporte;
  - aplicar `supa#30` no template nativo `Invite user` do Supabase Auth: usar copy PT-BR sem lógica condicional, encaminhar o link ou token do Auth e o `invite_state` opaco à rota canônica, validar links e redirects em Preview e Production e manter proibido qualquer envio customizado pelo Next.js; template, metadata e estado transportado não autorizam a ativação;
  - ajustar `/auth/confirm` para preservar o estado do GET ao POST, confirmar o Auth e criar a sessão;
  - reutilizar ou adaptar `/auth/update-password` para o contexto de convite;
  - implementar o cookie `HttpOnly`, seguro em ambiente hospedado, `SameSite=Lax` e `Path=/auth`, isolado pelo `account_user_id`, com redirect contendo somente o identificador opaco;
  - definir a senha antes de ativar o membership;
  - validar assinatura, linha, usuário, conta e estado antes da ativação;
  - implementar retry idempotente da mesma linha se a ativação falhar após a senha;
  - implementar reenvio por `inviteUserByEmail()`;
  - definir a matriz hospedada de envio, reenvio, senha, aceite, logout e novo login para execução na `11.1.7`.
- Artefatos implementados:
  - `lib/access/account-members/invite-state.ts`;
  - ajustes em `lib/access/account-members/adapters/accountMembersAdapter.ts` e `lib/access/account-members/adapters/authAdminAdapter.ts`;
  - ajuste em `app/auth/confirm/route.ts`;
  - ajuste em `app/auth/update-password/page.tsx`;
  - gate server-only `E11_MEMBERS_ENABLED`;
  - casos executáveis da matriz hospedada.
- Critérios de aceite:
  - o e-mail é enviado somente pelo Supabase Auth;
  - o template não expõe secret nem usa metadata como autorização;
  - scanner não consome o token no GET;
  - validade do link é controlada pelo Auth, sem revogação automática local do membership;
  - usuário define senha antes de receber acesso à conta;
  - outro vínculo pendente permanece inalterado;
  - manipulação do estado falha;
  - aceite repetido e retry da ativação são idempotentes;
  - abandono antes da senha mantém o membership `pending` e sem acesso;
  - dois convites distintos não selecionam a mesma linha por sobrescrita global; manipulação de identificador, cookie ou assinatura falha fechada;
  - logout e novo login por e-mail e senha funcionam;
  - reenvio real entrega o segundo e-mail e possui comportamento documentado para ambos os links;
  - falha de envio deixa retry recuperável sem duplicidade.
- Decisão da fase: implementação concluída; critérios hospedados transferidos para a `11.1.7`.
- Próxima ação: 11.1.5.

### 3.3. 11.1.5 — Gestão de membros no Account Dashboard

- Status: implementada.
- Objetivo: permitir que owner/admin listem e administrem membros e convites não-owner.
- Escopo implementado:
  - criar `/a/[account]/members`;
  - criar Server Actions próprias da rota;
  - adicionar navegação condicionada a owner/admin;
  - ocultar navegação e falhar fechado na rota e nas actions enquanto `E11_MEMBERS_ENABLED` não for exatamente `true`;
  - implementar formulário de convite;
  - listar membros ativos e convites pendentes;
  - implementar reenvio, revogação, alteração de papel e desativação;
  - aplicar estados visuais e responsividade da seção 2.7;
  - manter bloqueio server-side para editor/viewer.
- Artefatos implementados:
  - `app/a/[account]/members/page.tsx`;
  - `app/a/[account]/members/actions.ts`;
  - componentes locais mínimos quando necessários;
  - ajuste mínimo na navegação do Account Dashboard.
- Critérios de aceite:
  - owner/admin acessam e executam somente operações permitidas;
  - editor/viewer não acessam a página nem as actions;
  - lista identifica usuários por e-mail sem criar perfil;
  - ações por linha nomeiam o efeito e exibem feedback;
  - estados vazio, carregando, erro, sucesso e em andamento estão presentes;
  - desktop e mobile permanecem utilizáveis;
  - nenhuma regra de negócio fica somente no client.
- Decisão da fase: concluída.
- Próxima ação: 11.1.6.

### 3.4. 11.1.6 — Pendências do usuário já cadastrado

- Status: implementada.
- Objetivo: permitir que usuário confirmado veja, aceite ou recuse seus convites sem receber e-mail.
- Escopo implementado:
  - ajustar `/a/home` para verificar pendências próprias antes do redirect automático;
  - preservar o redirect atual e não realizar writes enquanto `E11_MEMBERS_ENABLED` não for exatamente `true`;
  - exibir conta e papel proposto;
  - criar ações autenticadas de aceitar e recusar uma linha com `actorUserId` derivado de `auth.getUser()`, validação de `account_users.user_id` e status `pending`, sem usar o guard owner/admin;
  - preservar o redirect atual quando não houver pendência;
  - após aceite, permitir entrada na conta ativada;
  - após recusa, remover a pendência da superfície.
- Artefatos implementados:
  - ajuste em `app/a/home/page.tsx`;
  - action ou boundary server-side mínimo para aceite e recusa;
  - componentes locais mínimos quando necessários.
- Critérios de aceite:
  - usuário com conta ativa ainda vê novo convite pendente antes do redirect;
  - apenas pendências do usuário autenticado aparecem;
  - chamada direta com `account_user_id` de terceiro ou linha não pendente falha fechada;
  - aceite ativa uma linha e recusa revoga uma linha;
  - a pendência não expira automaticamente e só concede acesso após aceite;
  - sem pendências, o comportamento atual de `/a/home` é preservado;
  - falha de leitura ou escrita não cria acesso parcial.
- Decisão da fase: concluída.
- Próxima ação: 11.1.7.

### 3.5. 11.1.7 — Ativação controlada e validação hospedada

- Status: em validação.
- Objetivo: concluir a configuração externa remanescente, comprovar os fluxos hospedados e ativar a funcionalidade em Production de forma reversível.
- Estado de entrada:
  - migration aplicada e estado pós-apply verificado;
  - `INVITE_STATE_SECRET` configurada com valores independentes em Production e Preview;
  - `E11_MEMBERS_ENABLED=false` em Production e Preview;
  - redeploys dos dois ambientes concluídos;
  - fases `11.1.3` a `11.1.6` implementadas.
- Execução:
  - configurar no Supabase Auth o template nativo `Invite user`, os redirects estritamente necessários e a Email OTP Expiration compatível com o fluxo;
  - manter Production com o gate desabilitado;
  - habilitar `E11_MEMBERS_ENABLED=true` somente no Preview autorizado e executar novo redeploy;
  - executar a matriz da seção 2.8, incluindo convite novo, reenvio, adulteração do link, senha antes da ativação, isolamento entre memberships, aceite e recusa do usuário já cadastrado, autorização por papel e idempotência;
  - se a prova falhar, desabilitar novamente o gate do Preview, redeployar e limitar a correção à falha comprovada;
  - se a prova for aprovada, habilitar o gate em Production, redeployar e executar o smoke mínimo do fluxo;
  - se o smoke de Production falhar, desabilitar novamente o gate, redeployar e corrigir pelo fluxo normal;
  - reconciliar `docs/roadmap.md` e `docs/platform-config.md` com o estado final comprovado, sem duplicar detalhes técnicos ou valores de configuração.
- Critérios de aceite:
  - configuração do Supabase Auth confirmada sem exposição de secrets;
  - matriz hospedada aprovada no Preview antes da ativação de Production;
  - Production mantida desabilitada até a aprovação da prova;
  - smoke de Production aprovado após a ativação;
  - nenhuma tabela, coluna, rota, envio próprio de e-mail ou infraestrutura nova;
  - evidências sem token, secret, senha ou e-mail pessoal integral.
- Autonomia do Executor:
  - executar esta fase diretamente com este plano-base;
  - corrigir falhas localizadas que não ampliem o escopo nem alterem contratos;
  - parar e retornar ao Estrategista somente quando algum critério da seção 4.2 ocorrer.
- Próxima ação: configurar o Supabase Auth e iniciar a prova controlada em Preview.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Transferência de propriedade.
- Convite ou criação de owner.
- Permissões personalizadas ou edição de `permissions`.
- Convite em massa.
- Limites de usuários por plano.
- Exclusão física de membro ativo como ação comum da UI.
- Exclusão automática de usuário no Supabase Auth.
- Perfil, nome, avatar ou tabela de identidade.
- Busca pública ou client-side de usuários Auth.
- E-mail enviado pelo Next.js, Resend SDK ou serviço próprio.
- `auth.resend()` usado como convite.
- Aceite por `account_id` isolado.
- Confiança em `user_metadata` para autorização.
- Uso do hook que ativa todos os vínculos pendentes.
- Tabela, view, coluna, fila, job, agente, engine, cron ou serviço novo sem retorno ao Estrategista.
- E12, Stripe, billing, plano comercial, automação ou agentes.
- Redesign amplo do Account Dashboard.

### 4.2. Critérios de parada

- Parar se o estado real do Supabase divergir materialmente de `docs/schema.md` ou da baseline.
- Parar se o hook amplo estiver configurado e sua retirada exigir decisão operacional não prevista.
- Parar se `listUsers()` paginado não puder identificar o usuário de forma segura no volume atual.
- Parar se o template nativo não conseguir transportar o estado assinado até `/auth/confirm`.
- Parar se `inviteUserByEmail()` não reenviar no projeto hospedado para usuário ainda não confirmado.
- Parar antes de criar e-mail próprio como fallback.
- Parar se o aceite específico exigir ativar mais de um membership.
- Parar se for necessária tabela ou coluna nova; demonstrar a necessidade e devolver ao Estrategista.
- Parar se a solução exigir transferir, rebaixar, revogar ou desativar owner.
- Parar se a UI exigir nome ou perfil não existente para funcionar.
- Parar se a implementação exigir automação, job, agente, fila ou infraestrutura nova.
- Parar se os testes exigirem credencial humana principal ou exposição de secret.

### 4.3. Decisão atual e próxima ação

- Decisão: plano-base v3 reconciliado com o estado pós-merge; nenhuma nova passagem por especialistas é exigida para executar a `11.1.7`.
- Processo selecionado: execução direta pelo Executor, sem automação.
- Próxima ação: configurar o Supabase Auth e executar a prova controlada em Preview conforme a seção 3.5.

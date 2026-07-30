# Plano-base E11.2 — Autoridade comercial e elegibilidade para gestão de membros

- Versão: v2
- Data: 30/07/2026
- Status: planejado; v2 consolidada pelo Processo automatizado; aguardando gate do Analista.
- Recorte no roadmap: `11.2 — Autoridade comercial e elegibilidade para gestão de membros`
- Path canônico: `docs/lousa-plano-base-e11-2.md`
- Plano conceitual: N/A — debate realizado entre humano, Analista e Estrategista antes da v1.
- Automação: não.
- Fontes obrigatórias: `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/prompt-abc.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/design-system.md`, `docs/lousa-plano-base-e9.md`, `docs/lousa-plano-base-e11.md`, `lib/commercial-entitlements/contracts.ts`, `lib/commercial-entitlements/adapters/commercialEntitlementAdapter.ts`, `lib/access/getAccessContext.ts`, `lib/access/guards.ts`, `lib/access/account-members/index.ts`, `app/a/[account]/page.tsx`, `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`, `app/a/[account]/_components/commercial-page/checkout-actions.ts`, `app/a/[account]/members/page.tsx` e `app/a/[account]/members/actions.ts`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A conta pode estar operacionalmente `active` sem possuir entitlement comercial válido.
- Hoje, qualquer membership ativo autorizado pelo Access Context recebe a página comercial e pode acionar o checkout existente, pois a Server Action não restringe o papel.
- Owner e admin também podem criar ou reenviar convites sem entitlement comercial válido.
- O resultado esperado é separar autoridade financeira de colaboração:
  - somente owner pode visualizar a ação de contratação e iniciar o checkout existente;
  - owner e admin só podem criar ou reenviar convites quando a conta for comercialmente elegível;
  - admin, editor e viewer sem entitlement recebem um estado simples de espera;
  - ações necessárias para reduzir ou organizar acessos existentes permanecem disponíveis conforme a E11.1.

### 1.2. Estado real confirmado

- `getCommercialEntitlementSignal({ accountId })` é a leitura canônica da E9 e falha fechado para `NO_COMMERCIAL_ENTITLEMENT_SIGNAL`.
- `CommercialEntitlementSignal.isCommerciallyEligible` é o único campo usado pela E11.2 para decidir elegibilidade; origem, status efetivo e plano não são reinterpretados neste recorte.
- `/a/[account]` já carrega o sinal comercial server-side, mas descarta o resultado e apresenta a mesma página a todos os papéis ativos.
- A página comercial genérica expõe os cards que chamam `startStripeCheckoutAction()`.
- `startStripeCheckoutAction()` valida conta e contexto de acesso, mas não exige papel owner e não bloqueia nova sessão quando já existe entitlement válido.
- O boundary `lib/access/account-members/` e a rota `/a/[account]/members` já protegem a gestão por owner/admin, porém criação e reenvio de convite ainda não dependem de entitlement.
- Trial permanece previsto e não implementado; a E11.2 não cria nem antecipa seu contrato.

### 1.3. Decisões funcionais encerradas

- Autoridade financeira durável pertence ao owner.
- A implementação atual limita essa autoridade ao fluxo existente:
  - visualizar CTAs de contratação;
  - iniciar o checkout Stripe atual.
- Owner ativo, conta ativa e sem entitlement pode visualizar a página comercial e iniciar checkout.
- Owner com `isCommerciallyEligible=true` não inicia outro checkout pela action atual.
- Admin, editor e viewer não iniciam checkout, independentemente da UI.
- Owner e admin com `isCommerciallyEligible=true` podem criar e reenviar convites.
- Owner e admin sem entitlement não podem criar nem reenviar convites.
- Aceite, recusa, revogação, desativação e alteração de papel permanecem regidos pela E11.1 e independentes de entitlement.
- Memberships existentes não são apagados, desativados ou alterados retroativamente pela E11.2.

### 1.4. Experiência por papel e elegibilidade

- Owner sem entitlement:
  - recebe a página comercial vigente;
  - visualiza os CTAs de contratação;
  - pode iniciar um checkout;
  - não pode criar nem reenviar convites.
- Owner com entitlement:
  - não recebe CTA capaz de iniciar nova assinatura pela action atual;
  - mantém o comportamento pós-entitlement já existente até a evolução da E10.5.1;
  - pode criar e reenviar convites.
- Admin, editor e viewer sem entitlement:
  - não recebem cards ou CTA de contratação;
  - recebem a mensagem: `Esta conta aguarda ativação comercial pelo proprietário.`
- Admin, editor e viewer com entitlement:
  - mantêm a experiência vigente compatível com seu papel;
  - não recebem CTA financeiro;
  - somente admin mantém acesso à gestão de membros e pode criar ou reenviar convites.

### 1.5. Decisões técnicas consolidadas

- A E11.2 consome exclusivamente `commercialEntitlement.isCommerciallyEligible`; não consulta origem comercial, provedor, plano ou tabela diretamente.
- `prod#19` permanece somente como referência de produto: Stripe Entitlements não substitui `CommercialEntitlementSignal`, `lib/commercial-entitlements/` nem a persistência local vigente. A E11.2 não consulta Stripe, plano, provedor ou feature entitlement para decidir checkout, convite ou renderização.
- Autorização, papel e entitlement são revalidados server-side nas operações protegidas; ocultar controles na UI não substitui os guards.
- O checkout usa o Access Context existente, exige conta e membership ativos, exige papel owner e exige `isCommerciallyEligible=false` antes de criar a Checkout Session.
- Erro ou ausência do sinal equivale a não elegível:
  - no checkout, preserva a possibilidade do owner iniciar a contratação;
  - em criação e reenvio de convite, bloqueia a operação;
  - nunca concede permissão financeira a não-owner.
- A assimetria é intencional: ausência de entitlement habilita a contratação somente para o owner, mas bloqueia a expansão de membros.
- A criação e o reenvio de convites aplicam o guard comercial no boundary server-side existente antes de criar usuário, preparar membership, consultar Auth Admin para entrega ou enviar e-mail.
- Revogação, desativação e alteração de papel não recebem dependência comercial.
- A página `/a/[account]` usa o sinal já carregado e o papel do contexto server-side para escolher entre página comercial, estado de espera e experiência vigente.
- Não são criados novo boundary, rota, tabela, coluna, RPC, policy, migration, variável, webhook, job, fila, agente ou automação.

## 2. Contrato do caso

### 2.1. Contrato mínimo ponta a ponta

- Gatilho:
  - abertura de `/a/[account]`;
  - acionamento de `startStripeCheckoutAction()`;
  - criação ou reenvio de convite em `/a/[account]/members`.
- Entrada:
  - sessão autenticada;
  - conta e membership resolvidos pelo Access Context;
  - papel efetivo do ator;
  - `accountId` canônico;
  - `CommercialEntitlementSignal` da conta;
  - dados já aceitos pelos fluxos de checkout ou convite.
- Processamento:
  - resolver conta, membership e papel server-side;
  - obter o sinal canônico por `accountId`;
  - aplicar a política específica de checkout, convite ou renderização;
  - chamar o fluxo existente apenas quando a combinação de papel e elegibilidade for permitida.
- Validação:
  - checkout exige owner ativo, conta ativa e `isCommerciallyEligible=false`;
  - criação e reenvio exigem owner/admin ativos, conta ativa e `isCommerciallyEligible=true`;
  - nenhum papel não-owner recebe autoridade financeira;
  - nenhuma ação usa origem, plano ou status comercial como regra paralela.
- Persistência:
  - não há persistência nova;
  - checkout e convites preservam as persistências já pertencentes à E9 e à E11.1;
  - bloqueios não criam Checkout Session, usuário Auth, membership ou envio.
- Consumo:
  - owner elegível para compra segue ao checkout existente;
  - owner/admin elegíveis para colaboração usam a gestão de membros existente;
  - não-owner sem entitlement recebe estado de espera;
  - operações preservadas continuam disponíveis conforme o papel.
- Fallback:
  - papel insuficiente falha fechado sem criar checkout;
  - conta já elegível falha fechado sem criar checkout duplicado;
  - ausência ou erro no sinal bloqueia criação e reenvio de convite;
  - falha na leitura para renderização não expõe CTA financeiro a não-owner;
  - nenhum bloqueio comercial desativa membership existente.

### 2.2. Autoridade para o checkout

- O guard server-side ocorre antes de `createStripeTestCheckoutSession()`.
- O fluxo autorizado exige simultaneamente:
  - conta `active`;
  - membership `active`;
  - papel `owner`;
  - `isCommerciallyEligible=false`.
- O fluxo rejeita de forma determinística:
  - admin, editor ou viewer;
  - owner com entitlement válido;
  - conta ou membership não ativos;
  - contexto ausente ou inconsistente.
- O retorno de bloqueio não revela dados comerciais além do necessário para a UX segura.
- A E11.2 não altera preço, recorrência, mapeamento Stripe, success URL, cancel URL, webhook ou confirmação de entitlement.

### 2.3. Elegibilidade para criação e reenvio de convites

- `inviteAccountMember()` e `resendAccountMemberInvite()` exigem `isCommerciallyEligible=true` antes de efeitos externos ou persistência.
- O guard reutiliza o `accountId` autoritativo do `AccountMembersManagerContext`.
- O `AccountMembersManagerContext` existente em `lib/access/guards.ts` deve transportar `accountStatus`, derivado de `access.account.status` no mesmo guard que resolve `accountId`, membership e papel.
- `inviteAccountMember()` e `resendAccountMemberInvite()` retornam o deny de domínio `account_not_active` quando `context.accountStatus !== "active"`, antes de `findAuthUserByEmail()`, `createUnconfirmedAuthUser()`, `preparePendingMembership()`, `getAuthUserById()`, `recordInviteChannel()` ou `sendAuthInvite()`.
- `account_not_active` integra o contrato de erro existente e recebe feedback neutro na UI; `listAccountMembers()` e `mutateAccountMember()` permanecem independentes de entitlement e não recebem esse bloqueio.
- Não é criada nova consulta de conta, novo guard paralelo ou novo boundary.
- O guard comercial deve concluir com `isCommerciallyEligible=true` antes de `findAuthUserByEmail`, criação no Supabase Auth, preparação do membership, leitura ou gravação do canal e `sendAuthInvite`. Quando o canal for e-mail, preservar `inviteUserByEmail` e o template nativo `Invite user`, sem introduzir envio customizado no Core.
- Quando bloqueado:
  - não cria usuário no Supabase Auth;
  - não cria nem reabre ciclo `pending`;
  - não grava canal de convite;
  - não envia nem reenvia e-mail.
- A listagem de membros e as operações de alteração de papel, revogação e desativação permanecem disponíveis para owner/admin sem entitlement.
- A UI de membros:
  - bloqueia ou omite apenas o formulário de novo convite e o reenvio;
  - explica que novos convites dependem da ativação comercial;
  - preserva as ações independentes de entitlement.

### 2.4. Experiência da conta sem entitlement

- Owner recebe a página comercial vigente e seus CTAs de contratação.
- Admin, editor e viewer recebem um estado enxuto com:
  - título ou mensagem clara de indisponibilidade comercial;
  - texto `Esta conta aguarda ativação comercial pelo proprietário.`;
  - nenhuma escolha de plano;
  - nenhum botão de checkout.
- O estado reutiliza componentes e tokens do `docs/design-system.md`, sem novo padrão visual.
- A experiência funciona em desktop e mobile, com leitura clara, foco previsível e sem controle acessível somente por hover.
- A E11.2 não cria dashboard produtivo, LP Builder navegável nem gestão de assinatura.

### 2.5. Preservação dos vínculos e ações existentes

- Permanecem sem dependência de entitlement:
  - listar membros e convites;
  - aceitar ou recusar convite próprio;
  - revogar convite;
  - desativar membro;
  - alterar papel entre admin, editor e viewer;
  - proteções do owner e do próprio ator;
  - troca de conta e isolamento multi-tenant.
- Convites já pendentes continuam aceitos ou recusados conforme a E11.1.
- A mudança de elegibilidade comercial não altera automaticamente membership, papel ou status.
- A liberação manual existente produz efeito somente por meio do sinal canônico da E9.

### 2.6. Matriz mínima de validação

- Checkout:
  - owner sem entitlement visualiza CTA e consegue iniciar checkout;
  - owner com entitlement não visualiza CTA capaz de nova compra e a chamada direta falha;
  - admin, editor e viewer não visualizam CTA financeiro e a chamada direta falha;
  - bloqueio ocorre antes da criação de Checkout Session.
- Convites:
  - owner e admin com entitlement criam e reenviam convites;
  - owner e admin sem entitlement não criam nem reenviam;
  - editor e viewer continuam bloqueados pela autorização da E11.1;
  - bloqueio ocorre antes de criação de Auth user, membership, canal ou envio.
- Operações preservadas:
  - owner/admin sem entitlement ainda listam membros;
  - alteração de papel, revogação e desativação permitidas continuam funcionando;
  - convidado ainda aceita ou recusa convite pendente próprio;
  - memberships existentes permanecem inalterados pela mudança comercial.
- Renderização:
  - owner sem entitlement recebe página comercial;
  - não-owner sem entitlement recebe estado de espera;
  - nenhum não-owner recebe botão ou cards acionáveis de checkout;
  - desktop e mobile mantêm hierarquia, contraste, foco e legibilidade.
  - Reconhecimento: owner sem entitlement identifica sem ajuda a ação de contratação; admin, editor e viewer sem entitlement identificam que a ativação comercial depende do proprietário e não encontram escolha de plano, cards acionáveis ou ação financeira.
  - Acessibilidade aplicável: validar contraste e legibilidade, ordem e visibilidade de foco, navegação por teclado, rótulos e mensagens compreensíveis, estado `disabled` quando utilizado e alvos de toque adequados nos controles existentes; não declarar auditoria ou conformidade WCAG 2.2 integral.
- Anti-regressão:
  - `isCommerciallyEligible` é a única decisão comercial consumida;
  - entitlement por liberação manual produz o mesmo comportamento que outro entitlement efetivo;
  - conta com entitlement não inicia checkout duplicado;
  - isolamento entre contas e papéis permanece intacto.

### 2.7. Observabilidade e updates condicionais

- Cada decisão server-side de `checkout`, `invite` ou `resend` deve emitir um único evento estruturado seguro com `operation`, `result` (`allowed`, `denied` ou `error`), `reason`, `account_id`, `actor_role`, `request_id` e `latency_ms` quando disponíveis. O log deve ocorrer no fluxo server-side responsável pela operação, reutilizando o padrão de logging estruturado já existente no repositório, sem novo serviço. Não registrar e-mail, dados de formulário, payload Stripe/Auth, URL de checkout, token, secret ou demais PII. Falha de logging não pode liberar nem bloquear a operação principal.
- `supa#5` permanece como oportunidade estratégica condicional para reduzir o tempo de diagnóstico de incidentes recorrentes em Auth ou convites que não possam ser resolvidos pelos logs e testes existentes; não habilitar AI Debugging, drains, alertas ou nova integração de observabilidade nesta E11.2.
- `vercel#15` permanece como oportunidade estratégica condicional quando a Toolbar já estiver disponível ao revisor e trouxer valor à revisão visual do Preview; não configurar, contratar nem tornar a Toolbar dependência ou gate desta E11.2.
- `vercel#27` não é aplicável ao recorte porque `next` e `eslint-config-next` já estão em `16.2.11`; a E11.2 não reabre manutenção de dependências.

### 2.8. Dependências reais

- E9.1 — sinal canônico de entitlement comercial.
- E9.4 — checkout Stripe existente.
- E10.5.1 — matriz de preparação versus produtivo, sem antecipar sua UX principal.
- E10.6 e E10.7 — páginas comerciais existentes.
- E11.1 — papéis, guards e gestão de membros.
- `docs/design-system.md` — componentes, tokens, estados e acessibilidade visual.
- Não há dependência de trial operacional, plano gratuito, billing admin, upgrade, downgrade, cancelamento ou automação.

## 3. Fases e próxima ação

### 3.1. E11.2.3 — Autoridade para o checkout

- Status: planejada; execução pelo Processo automatizado somente após o merge humano da v1.
- Automação: não.
- Objetivo: restringir o checkout existente ao owner sem entitlement comercial válido e impedir nova compra pela mesma action quando a conta já estiver elegível.
- Execução:
  - revalidar conta, membership, papel e sinal canônico na Server Action antes de `createStripeTestCheckoutSession()`;
  - permitir o fluxo apenas para owner ativo de conta ativa com `isCommerciallyEligible=false`;
  - bloquear admin, editor, viewer e owner com entitlement válido;
  - emitir o evento estruturado seguro da decisão antes de devolver o deny ou iniciar a criação da Checkout Session;
  - preservar preço, recorrência, URLs, webhook e confirmação comercial existentes.
- Artefatos esperados:
  - ajuste em `app/a/[account]/_components/commercial-page/checkout-actions.ts`;
  - testes no padrão já existente para papel e entitlement, conforme a estrutura confirmada durante a execução.
- Critérios de aceite:
  - owner sem entitlement inicia o checkout existente;
  - owner com entitlement e todos os papéis não-owner falham server-side;
  - nenhum bloqueio cria Checkout Session;
  - decisões permitidas e negadas produzem evento estruturado sem PII, payload externo ou URL de checkout;
  - `isCommerciallyEligible` permanece a única decisão comercial consumida;
  - nenhuma regra de billing inexistente é antecipada;
  - validações automatizadas aplicáveis são aprovadas.
- Evidência esperada:
  - resultados dos casos autorizados e bloqueados;
  - prova de ausência de Checkout Session nos bloqueios;
  - diff restrito ao checkout existente.

### 3.2. E11.2.4 — Elegibilidade para criação e reenvio de convites

- Status: planejada; sucede a E11.2.3 no Processo automatizado.
- Automação: não.
- Objetivo: exigir entitlement comercial válido somente para criar e reenviar convites, preservando as ações de manutenção dos vínculos existentes.
- Execução:
  - ampliar o `AccountMembersManagerContext` existente em `lib/access/guards.ts` com `accountStatus`, derivado de `access.account.status` no mesmo guard que resolve `accountId`, membership e papel. `inviteAccountMember()` e `resendAccountMemberInvite()` devem retornar o deny de domínio `account_not_active` quando `context.accountStatus !== "active"`, antes de `findAuthUserByEmail()`, `createUnconfirmedAuthUser()`, `preparePendingMembership()`, `getAuthUserById()`, `recordInviteChannel()` ou `sendAuthInvite()`. Registrar `account_not_active` no contrato de erro existente e mapeá-lo para feedback neutro na UI. `listAccountMembers()` e `mutateAccountMember()` permanecem independentes de entitlement e não recebem esse bloqueio. Incluir `lib/access/guards.ts` entre os artefatos ajustados; não criar nova query de conta, novo guard paralelo ou novo boundary;
  - permitir criação e reenvio somente a owner/admin com `isCommerciallyEligible=true`;
  - bloquear conta ou entitlement antes de qualquer leitura ou criação no Auth, preparação do membership, leitura ou gravação do canal ou envio;
  - preservar `inviteUserByEmail` e o template nativo `Invite user`, sem envio customizado;
  - emitir o evento estruturado seguro da decisão de `invite` ou `resend`;
  - refletir o bloqueio no formulário de novo convite e na ação de reenvio;
  - preservar listagem, aceite, recusa, revogação, desativação e alteração de papel conforme a E11.1.
- Artefatos esperados:
  - ajuste em `lib/access/guards.ts` e no contrato de erro existente;
  - ajuste no boundary existente `lib/access/account-members/`;
  - ajuste em `app/a/[account]/members/page.tsx` e nos componentes/actions já responsáveis pelo fluxo;
  - testes no padrão já existente, conforme a estrutura confirmada durante a execução.
- Critérios de aceite:
  - owner/admin com entitlement criam e reenviam convites;
  - owner/admin sem entitlement não produzem efeito;
  - owner/admin com membership ativo, entitlement válido e conta `pending_setup` não criam nem reenviam convite;
  - editor/viewer continuam bloqueados pela autorização da E11.1;
  - ações preservadas continuam disponíveis sem entitlement;
  - convites pendentes e memberships existentes permanecem inalterados;
  - nenhum bloqueio chama adapters de Auth, preparação/escrita de membership, canal ou envio;
  - decisões permitidas e negadas produzem evento estruturado seguro;
  - isolamento multi-tenant e proteções do owner continuam aprovados.
- Evidência esperada:
  - matriz de owner/admin com e sem entitlement;
  - prova de ausência de efeitos externos e persistência nos bloqueios;
  - smoke das ações preservadas.

### 3.3. E11.2.5 — Experiência da conta sem entitlement

- Status: planejada; sucede a E11.2.4 no Processo automatizado.
- Automação: não.
- Objetivo: separar a experiência comercial do owner do estado de espera dos demais papéis, sem criar novo dashboard produtivo.
- Execução:
  - usar o sinal já carregado em `/a/[account]` e o papel do Access Context;
  - manter a página comercial e os CTAs existentes para owner sem entitlement;
  - remover cards e CTAs financeiros de admin, editor e viewer;
  - apresentar a não-owner sem entitlement a mensagem `Esta conta aguarda ativação comercial pelo proprietário.`;
  - manter o comportamento pós-entitlement vigente, sem antecipar a E10.5.1;
  - validar desktop e mobile e executar o fechamento documental material pelo Prompt ABC;
  - no fechamento pelo Prompt ABC, reconciliar `docs/schema.md` 1.2.4 substituindo a afirmação de apply futuro por registro de que `supabase/migrations/20260727155312_e11_account_members_security.sql` está aplicada no ambiente alvo e teve o estado pós-apply verificado. Atualizar o status E11.2 no Roadmap e na v2 para registrar o merge do PR #666. Esta reconciliação é exclusivamente documental: não criar, reaplicar ou modificar migration, RLS, policy, GRANT, view ou exposição pela Data API.
- Artefatos esperados:
  - ajuste em `app/a/[account]/page.tsx`;
  - ajuste nos componentes existentes de `app/a/[account]/_components/commercial-page/`;
  - testes ou casos de validação nos artefatos canônicos existentes.
- Critérios de aceite:
  - owner sem entitlement recebe página comercial e CTA funcional;
  - admin, editor e viewer sem entitlement recebem estado de espera sem escolha de plano ou checkout;
  - nenhum não-owner recebe CTA financeiro, inclusive com chamada direta já bloqueada pela E11.2.3;
  - memberships, papéis e ações preservadas não sofrem alteração retroativa;
  - estado visual aprovado em desktop e mobile quanto a hierarquia, contraste, foco e legibilidade;
  - a prova em Preview deve cobrir owner e não-owner sem entitlement em desktop e mobile, validando conteúdo, responsividade, foco, ausência de CTA financeiro indevido e ausência de erro ou quebra visual. Ferramentas da Vercel podem ser usadas quando já disponíveis, mas não substituem a validação manual nem constituem dependência da fase;
  - `npm ci`, `npm run check` e validações específicas aplicáveis são aprovados;
  - diff não cria banco, rota, boundary ou infraestrutura;
  - Roadmap e documentos materialmente afetados são reconciliados pelo Prompt ABC.
- Evidência esperada:
  - capturas do owner e de pelo menos um papel não-owner sem entitlement;
  - capturas em desktop e mobile sem dados sensíveis;
  - smoke do fluxo autorizado e das ações preservadas;
  - checks e fechamento documental registrados no PR.

### 3.4. Próxima ação

- O PR #666 foi incorporado à `main` e o Processo automatizado está em execução na branch única de orquestração.
- A v2 deve passar pelas duas passagens do Analista e pela reconciliação do Roadmap antes do checkpoint `LP-Factory-Stage: plan-v2-approved`.
- Depois do checkpoint aprovado, executar E11.2.3, E11.2.4 e E11.2.5 no mesmo PR, sem repetir especialistas nem criar branch ou PR por fase.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Nova tabela, coluna, view, RPC, policy, grant ou migration.
- Nova rota, página comercial, dashboard produtivo ou LP Builder navegável.
- Novo boundary, Billing Engine, billing admin ou papel comercial.
- Trial operacional, plano gratuito ou concessão automática de trial.
- Upgrade, downgrade, renovação, cancelamento ou portal de assinatura.
- Mudança de preço, recorrência, Product/Price Stripe, webhook ou confirmação de pagamento.
- Limite de usuários por plano.
- Solicitação ou aprovação de compra por não-owner.
- Alteração retroativa, exclusão ou desativação automática de memberships.
- Bloqueio de aceite, recusa, revogação, desativação ou alteração de papel por falta de entitlement.
- Consulta direta a origem comercial, plano, provedor ou tabela como substituto de `isCommerciallyEligible`.
- Nova variável, serviço, fila, job, cron, agente, automação ou engine.
- Redesign amplo da página comercial ou da gestão de membros.

### 4.2. Critérios de parada

- Parar se a regra exigir redefinir o contrato de `CommercialEntitlementSignal`.
- Parar se trial, plano gratuito ou nova origem comercial se tornar necessário para concluir o recorte.
- Parar se a autoridade financeira exigir novo papel ou billing admin.
- Parar se o bloqueio de checkout depender de gestão de assinatura ainda inexistente.
- Parar se o guard de convite não puder ocorrer antes de qualquer criação no Auth, membership ou envio.
- Parar se a implementação exigir tabela, coluna, migration, rota, boundary ou infraestrutura nova.
- Parar se a experiência pós-entitlement exigir construir a E10.5.1 ou novo dashboard.
- Parar se testes exigirem pagamento real, credencial humana principal ou exposição de secret.
- Parar se a preservação das ações existentes entrar em conflito com proteção do owner, isolamento multi-tenant ou regra da E11.1.

### 4.3. Decisão atual

- Decisão: debate concluído, PR #666 incorporado à `main`, v2 consolidada e Processo automatizado em execução.
- Fases executáveis: E11.2.3, E11.2.4 e E11.2.5, todas sem automação.
- Preservação dos vínculos e validação das subseções 11.2.6 e 11.2.7 integram os critérios de aceite das fases correspondentes.
- Execução: autorizada somente após a aprovação da v2 e do Roadmap pelo Analista no checkpoint `LP-Factory-Stage: plan-v2-approved`, cabendo exclusivamente ao orquestrador previsto no item 3.4.

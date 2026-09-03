0. Introdução

0.1 Cabeçalho
• Data: 02/09/2026
• Versão: v1.5.213

0.2 Contrato do documento (consulta)
• Esta seção define o objetivo do documento e quando/como a IA deve consultá-lo.

0.2.1 TIPO_DO_DOCUMENTO
• TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
• O QUE É: a referência única do projeto para o contrato de casos (E*): status, escopo final e dependências.
• POR QUE CONSULTAR: para entender “o que já foi definido/implementado” e “qual é o próximo marco”, evitando drift com docs técnicas.
• COMO USAR: ao planejar execução, priorização e validação de escopo por caso, consultar este documento para o estado final de cada E*.
• QUANDO CONSULTAR: status/escopo/dependências de E*, decisões de produto/UX registradas no caso, e paths/artefatos quando fizerem parte do estado final do caso.
• QUANDO NÃO CONSULTAR: regras técnicas do runtime (usar `docs/base-tecnica.md`) e contrato/inventário de DB (usar `docs/schema.md`).
• NOTA: este documento registra estado final por caso; não é lugar de narrativa operacional.


1. E1 — Estrutura de Dados
- Objetivo: estabelecer a base estrutural multi-tenant para contas, vínculos de usuários, planos, parceiros e auditoria.
- Status: concluído; a base permanece em uso e seu contrato atual é mantido em `docs/schema.md` e nos recortes posteriores que a evoluíram.

1.1 Base estrutural multi-tenant

1.1.1 Objetivo e status
- Objetivo: disponibilizar as entidades e relações iniciais necessárias para identificar contas, vincular usuários, associar planos e parceiros e registrar auditoria.
- Status: concluído; estruturas preservadas no estado atual do produto.

1.1.2 Registros do recorte
- Banco:
  - Criados:
    - `public.accounts`;
    - `public.account_users`;
    - `public.audit_logs`;
    - `public.plans`;
    - `public.partners`;
    - `public.partner_accounts`;
    - `public.v_access_context_v2`;
    - `public.v_account_effective_limits`;
    - `public.v_account_effective_limits_secure`;
    - `public.v_audit_logs_norm`.
- Referências:
  - Contrato atual do banco: `docs/schema.md` — seções 1, 2 e 4.

1.1.3 Invariantes preservados
- Status: implementado e vigente.
- Conteúdo:
  - contas mantêm identificadores únicos de subdomínio, domínio e slug;
  - vínculos entre conta e usuário permanecem únicos por par `account_id` e `user_id`;
  - cada conta mantém um `owner_user_id`, e o ciclo de membros protege a permanência de ao menos um owner ativo;
  - `audit_logs` permanece como destino da auditoria das estruturas centrais governadas pelo Trigger Hub.

1.1.4 Limite do recorte
- Status: vigente.
- Conteúdo:
  - a E1 registra somente a fundação estrutural inicial;
  - tabelas, views, funções, constraints, índices e políticas adicionados ou alterados posteriormente pertencem aos respectivos recortes do roadmap;
  - o contrato completo e atual do banco reside exclusivamente em `docs/schema.md`.

2. E2 — Núcleo de Acesso
- Objetivo: estabelecer autenticação e autorização básicas para o acesso seguro às contas da plataforma.
- Status: concluído; autenticação, recuperação de senha e helpers de autorização permanecem em uso, enquanto o Access Context e a gestão de membros evoluem nos recortes E8 e E11.

2.1 Autenticação e autorização básicas

2.1.1 Objetivo e status
- Objetivo: autenticar usuários por e-mail e senha, aplicar papéis de conta e proteger o acesso a dados por políticas e helpers server-side.
- Status: concluído; contratos essenciais preservados no estado atual do produto.

2.1.2 Registros do recorte
- Banco:
  - Criados:
    - `public.is_super_admin()`;
    - `public.is_platform_admin()`;
    - `public.has_account_min_role(uuid, text)`.
- Referências:
  - Arquitetura de acesso e fluxos de Auth: `docs/base-tecnica.md` — seção 5.
  - Helpers e políticas atuais: `docs/schema.md` — seções 1.1 a 1.7 e 3.3.
  - Redirects e envio transacional de Auth: `docs/platform-config.md` — seções 4.4 e 4.5.

2.1.3 Identidade e papéis
- Status: implementado e vigente.
- Conteúdo:
  - autenticação de usuário ocorre pelo Supabase Auth com e-mail e senha;
  - os papéis canônicos de membership são `owner`, `admin`, `editor` e `viewer`;
  - `platform_admin` representa autoridade da plataforma e não integra os papéis de membership;
  - `super_admin` permanece como compatibilidade técnica no helper e guard existentes, incluída pela verificação de `platform_admin`;
  - autenticação não concede acesso isoladamente: a autorização final de conta permanece server-side e falha fechada.

2.1.4 Autorização de dados
- Status: implementado e vigente.
- Conteúdo:
  - RLS protege as estruturas expostas do núcleo de acesso conforme o contrato atual do schema;
  - helpers de banco resolvem privilégios de plataforma, membership ativo e papel mínimo sem transferir a decisão para a UI;
  - políticas, funções e grants exatos residem exclusivamente em `docs/schema.md` e no banco versionado.

2.1.5 Login e recuperação de senha
- Status: implementado e vigente.
- Conteúdo:
  - login utiliza e-mail e senha e encaminha o usuário autenticado ao gateway seguro da área de contas;
  - solicitação de recuperação usa resposta neutra contra enumeração de usuários;
  - links de confirmação e recuperação não consomem token ou código no GET;
  - verificação, criação da sessão e atualização de senha ocorrem somente no POST;
  - senha somente é alterada depois da validação do token ou código e do estabelecimento da sessão correspondente;
  - redirects e envio transacional pertencem a `docs/platform-config.md`; validade de token ou código permanece sob autoridade do Supabase Auth.

2.1.6 Limites do recorte
- Status: vigente.
- Conteúdo:
  - resolução do contexto e autorização final de uma conta pertencem à E8;
  - gestão de membros, convites e transições de membership pertence à E11;
  - Magic Link, login social e autenticação em dois fatores não integram o escopo implementado ou uma pendência aprovada da E2.

3. E3 — Adapters Base
- Objetivo: estabelecer boundaries server-side para acesso a dados e transformação de registros do banco em contratos consumíveis pela aplicação.
- Status: concluído; os adapters-base permanecem em uso e foram expandidos por boundaries de domínio nos recortes posteriores.

3.1 Fundação de adapters server-side

3.1.1 Objetivo e status
- Objetivo: concentrar leituras, mutações e normalização de dados fora da UI, preservando autorização, tipos de domínio e falha fechada.
- Status: concluído; fundação preservada no repositório atual.

3.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/access/adapters/accountAdapter.ts`;
    - `lib/access/adapters/accessContextAdapter.ts`;
    - `lib/admin/adapters/adminAdapter.ts`.
- Referências:
  - Fluxo de dados e classificação de boundaries: `docs/base-tecnica.md` — seções 3.2, 3.3 e 5.2.
  - Regras de PostgREST e Data API: `docs/base-tecnica.md` — seção 3.12.

3.1.3 Contrato dos adapters-base
- Status: implementado e vigente.
- Conteúdo:
  - acesso ao banco ocorre em adapters server-side, sem consulta direta pela UI;
  - registros do banco são convertidos em tipos e estados de domínio antes do consumo;
  - adapters de acesso usam o client adequado ao contexto de leitura ou mutação e preservam as políticas RLS quando aplicáveis;
  - leituras e mutações retornam estados controlados aos consumidores, enquanto a autorização final permanece responsabilidade dos guards server-side;
  - `accessContextAdapter.ts` registra decisões estruturadas de acesso sem transferir a autorização para o logging.

3.1.4 Evolução por boundary de domínio
- Status: vigente.
- Conteúdo:
  - novos adapters surgem dentro do boundary responsável e somente diante de consumidor e responsabilidade reais;
  - o repositório é a fonte única do inventário atual de adapters, guards, providers e APIs;
  - não permanecem pendentes adapters genéricos de plano, landing page ou seção definidos apenas por antecipação;
  - mudanças de PostgREST ou Data API são avaliadas quando afetarem consultas reais, conforme o contrato durável de `docs/base-tecnica.md`.

4. E4 — Account Dashboard (Infraestrutura SSR)
- Objetivo: estabelecer o gateway e a seção privada server-side do Account Dashboard, com redirecionamento seguro e contexto sanitizado para a UI.
- Status: concluído; infraestrutura SSR permanece ativa e suporta as jornadas funcionais implementadas nos recortes posteriores.

4.1 Gateway e seção privada do Account Dashboard

4.1.1 Objetivo e status
- Objetivo: direcionar cada sessão ao destino seguro disponível, proteger `/a/[account]` por guard SSR e evitar loops ou exposição indevida de contexto.
- Status: concluído; fluxo-base preservado no estado atual do produto.

4.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/a/page.tsx`;
    - `app/a/home/page.tsx`;
    - `app/a/[account]/layout.tsx`;
    - `app/a/_server/section-guard.ts`;
    - `providers/AccessProvider.tsx`;
    - `app/auth/confirm/info/page.tsx`.
- Referências:
  - Arquitetura de acesso e gateway privado: `docs/base-tecnica.md` — seção 5.
  - Contrato do Access Context: `docs/schema.md` — seção 2.1.

4.1.3 Gateway e destino inicial
- Status: implementado e vigente.
- Conteúdo:
  - `/a` redireciona server-side para `/a/home`;
  - `/a/home` permanece acessível sem sessão e funciona como gateway para usuários autenticados;
  - sessão autenticada tenta a última conta permitida e depois um fallback determinístico;
  - usuário sem qualquer membership pode receber a primeira conta `pending_setup` somente pelo fluxo server-side aprovado;
  - existência de qualquer membership impede criação automática de outra conta;
  - ausência de destino permitido leva a estado informativo seguro, sem loop de redirecionamento.

4.1.4 Seção privada e contexto para a UI
- Status: implementado e vigente.
- Conteúdo:
  - `/a/[account]` usa um guard SSR como ponto autoritativo de allow, deny e redirecionamento;
  - conta ou membership bloqueados seguem destinos específicos por estado, sem deny genérico quando o contexto conhecido permite distinção;
  - a última conta permitida é persistida em cookie exclusivamente server-side e removida quando inválida ou bloqueada;
  - `AccessProvider` recebe contexto já resolvido e sanitizado pelo servidor e não autoriza, consulta banco ou eleva privilégios;
  - rotas dependentes de sessão e cookie permanecem dinâmicas e sem cache compartilhado entre usuários.

4.1.5 Limites e evoluções posteriores
- Status: vigente.
- Conteúdo:
  - resolução e governança do Access Context pertencem à E8;
  - experiências de bloqueio por membership e status de conta pertencem às E15 e E16;
  - páginas comerciais do Account Dashboard pertencem à E10; o antigo onboarding/workspace de Landing Pages foi retirado na E22.4;
  - convites exibidos no gateway pertencem à E11 e não alteram a responsabilidade estrutural da E4.

5. E5 — UI/Auth Account Dashboard
- Objetivo: oferecer fluxos page-based de login, signup, confirmação e recuperação de senha com tratamento seguro e orientação clara ao usuário.
- Status: funcionalmente implementado; permanecem pendências residuais de normalização da copy e dos erros de Auth e de validação ponta a ponta em mobile.

5.1 Login e recuperação de senha

5.1.1 Objetivo e status
- Objetivo: permitir entrada por e-mail e senha e recuperação segura sem enumeração de usuários ou consumo de token no GET.
- Status: implementado e em uso.

5.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/auth/login/page.tsx`;
    - `components/login-form.tsx`;
    - `app/auth/forgot-password/page.tsx`;
    - `components/forgot-password-form.tsx`;
    - `app/auth/update-password/page.tsx`.
- Referências:
  - Contrato técnico de sessão e Auth: `docs/base-tecnica.md` — seção 5.3.
  - Redirects e envio transacional: `docs/platform-config.md` — seções 4.4 e 4.5.

5.1.3 Fluxo page-based
- Status: implementado e vigente.
- Conteúdo:
  - login, solicitação de recuperação e definição de nova senha usam páginas próprias, sem modal como superfície principal;
  - login por e-mail e senha aceita somente destino interno seguro e usa `/a/home` como fallback;
  - recuperação apresenta resposta neutra, aplica cooldown visual e encaminha o usuário ao fluxo de nova senha;
  - token ou código de recuperação é verificado somente no POST de `/auth/confirm`, antes da atualização da senha.

5.1.4 Pendência de mensagens de erro
- Status: pendente.
- Conteúdo:
  - o formulário de login ainda pode exibir diretamente a mensagem devolvida pelo provedor de Auth;
  - falta consolidar mensagens públicas neutras e consistentes sem perder o diagnóstico seguro em logs.

5.2 Signup, confirmação e e-mail já cadastrado

5.2.1 Objetivo e status
- Objetivo: iniciar cadastro, confirmar o e-mail, orientar o pós-envio e tratar e-mail previamente cadastrado sem criar fluxo paralelo.
- Status: implementado; estado dedicado de e-mail já cadastrado e reenvio confirmados no código atual.

5.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/auth/sign-up/page.tsx`;
    - `app/auth/sign-up-success/page.tsx`;
    - `app/auth/confirm/route.ts`.
  - Ajustados:
    - `components/sign-up-form.tsx`.
- Referências:
  - Contrato técnico de signup e confirmação: `docs/base-tecnica.md` — seções 5.3.2 e 5.3.3.
  - Redirects e envio transacional: `docs/platform-config.md` — seções 4.4 e 4.5.

5.2.3 Signup e confirmação anti-scanner
- Status: implementado e vigente.
- Conteúdo:
  - signup envia confirmação com destino em `/auth/confirm`, retorno para `/a/home` e identificador de correlação sem PII;
  - `/auth/sign-up-success` orienta o usuário a confirmar o cadastro pelo e-mail;
  - o GET de confirmação apresenta intersticial e não consome token ou código;
  - verificação e criação da sessão ocorrem somente no POST;
  - após confirmação, o gateway da E4 resolve o destino permitido e o fluxo de primeira conta quando aplicável;
  - eventos de signup, reenvio e confirmação usam correlação por `rid` e não registram e-mail, senha, token ou código como campos diretos.

5.2.4 Estado de e-mail já cadastrado
- Status: implementado.
- Conteúdo:
  - duplicidade explícita ou retorno sem identidade nova ativa um estado dedicado;
  - campos de senha e submit de criação são substituídos por orientação, reenvio de confirmação, acesso ao login e troca de e-mail;
  - reenvio usa o fluxo nativo de signup do Supabase Auth;
  - cooldown com contador e feedback trata repetição e rate limit sem criar infraestrutura própria;
  - o fluxo não tenta distinguir publicamente usuário confirmado de não confirmado.

5.2.5 Pendências residuais de UX e validação
- Status: pendente.
- Conteúdo:
  - parte da copy e de mensagens do formulário de signup ainda permanece em inglês ou deriva diretamente do provedor;
  - falta registro conclusivo de repetição manual do happy path signup → e-mail → confirmação → `/a/home` em mobile.

5.3 E-mail transacional do Supabase Auth

5.3.1 Objetivo e status
- Objetivo: assegurar entrega de e-mails de confirmação de signup e recuperação de senha pelo Supabase Auth.
- Status: concluído; entrega e links funcionais validados.

5.3.2 Registros do recorte
- Referências:
  - SMTP, sender, DNS e estado operacional: `docs/platform-config.md` — seção 4.5.

5.3.3 Decisão operacional vigente
- Status: implementado e vigente.
- Conteúdo:
  - Supabase Auth usa Resend como provedor SMTP para e-mails transacionais;
  - o sender permanece no domínio raiz durante o MVP;
  - Resend é reservado ao envio transacional, enquanto caixas humanas permanecem em provedor próprio;
  - credenciais, parâmetros SMTP e registros DNS residem exclusivamente em `docs/platform-config.md`;
  - subdomínio dedicado de e-mail só deve ser reavaliado quando escala, volume ou isolamento de reputação justificarem plano e configuração adicionais.

6. E6 — Design System e UI Base
- Objetivo: estabelecer fundamentos visuais, componentes reutilizáveis, estados de feedback e padrões de layout para as superfícies da LP Factory.
- Status: base concluída e em uso; adoção permanece incremental e o asset oficial da logo ainda não está versionado.

6.1 Fundamentos visuais e identidade

6.1.1 Objetivo e status
- Objetivo: consolidar tipografia, tokens, superfícies e identidade visual próprias sem romper a base shadcn existente.
- Status: concluído; contrato visual vigente em `docs/design-system.md`.

6.1.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/layout.tsx`;
    - `app/globals.css`;
    - `tailwind.config.ts`;
    - `components/layout/Header.tsx`;
    - `components/layout/UserMenu.tsx`;
    - `components/features/account-switcher/AccountSwitcherList.tsx`.
- Referências:
  - Contrato visual vigente: `docs/design-system.md` — seções “Residência e fundamentos visuais” e “Regras de uso”.

6.1.3 Base visual vigente
- Status: implementado.
- Conteúdo:
  - Inter é a tipografia global da UI;
  - tokens semânticos próprios estendem a base shadcn sem substituir seus tokens essenciais;
  - remapeamento de superfícies, bordas, foco, estados e sombra permanece canônico no CSS e no Tailwind;
  - header, menu do usuário e seletor de conta adotam a identidade visual comum.

6.1.4 Identidade provisória e limite
- Status: pendente.
- Conteúdo:
  - o produto usa wordmark textual “LP Factory” enquanto o asset oficial da logo não estiver versionado;
  - branding visual por cliente permanece fora do escopo atual;
  - migração para outro kit de plataforma não constitui pendência aprovada.

6.2 Biblioteca de componentes base

6.2.1 Objetivo e status
- Objetivo: reduzir markup cru e padronizar campos, ações e superfícies comuns com componentes mínimos.
- Status: concluído; biblioteca base disponível e adotada em Auth, onboarding e superfícies posteriores.

6.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `components/ui/form-field.tsx`;
    - `components/ui/select.tsx`.
  - Ajustados:
    - `components/ui/button.tsx`;
    - `components/ui/card.tsx`;
    - `components/ui/input.tsx`;
    - `components/login-form.tsx`;
    - `components/sign-up-form.tsx`;
    - `components/forgot-password-form.tsx`;
    - `app/auth/update-password/page.tsx`.
- Referências:
  - Componentes e APIs mínimas: `docs/design-system.md` — seções “Componentes padronizados” e “API mínima esperada”.

6.2.3 Biblioteca vigente e limite
- Status: implementado e vigente.
- Conteúdo:
  - a biblioteca base cobre ações, campos e superfícies comuns nas adoções realizadas;
  - APIs, acessibilidade e comportamento visual residem exclusivamente no código e em `docs/design-system.md`;
  - variações novas exigem uso real imediato e não autorizam framework próprio.

6.3 Estados visuais e feedback

6.3.1 Objetivo e status
- Objetivo: padronizar feedback de erro, sucesso e aviso e estados simples de vazio e carregamento.
- Status: concluído e adotado nas superfícies previstas.

6.3.2 Registros do recorte
- Repositório:
  - Criados:
    - `components/ui/textarea.tsx`;
    - `components/ui/feedback-message.tsx`;
    - `components/ui/empty-state.tsx`;
    - `components/ui/loading-state.tsx`.
  - Ajustados:
    - `components/forgot-password-form.tsx`;
    - `app/auth/update-password/page.tsx`;
    - `app/a/[account]/page.tsx`;
    - `app/a/[account]/loading.tsx`.
- Referências:
  - Estados reutilizáveis: `docs/design-system.md` — seções “Componentes padronizados”, “API mínima esperada” e “Aplicação mínima visível atual”.

6.3.3 Estados vigentes e limite
- Status: implementado e vigente.
- Conteúdo:
  - feedback e estados reutilizáveis estão disponíveis nas superfícies adotadas;
  - comportamento visual e acessibilidade residem exclusivamente em `docs/design-system.md`;
  - a base permanece simples, sem framework adicional de feedback ou carregamento.

6.4 Padrões de layout para dashboards

6.4.1 Objetivo e status
- Objetivo: consolidar padrões reutilizáveis para coleções, detalhes, navegação e estados nas superfícies autenticadas.
- Status: vigente no Admin; a aplicação histórica no workspace de Landing Pages foi retirada com essa superfície.

6.4.2 Registros do recorte
- Referências:
  - Superfície administrativa: `docs/design-system.md` — seção “Superfície administrativa do Admin”.

6.4.3 Padrões vigentes e limites
- Status: implementado e vigente.
- Conteúdo:
  - o Admin possui padrões próprios documentados e aplicados;
  - layout, responsividade e estados visuais residem exclusivamente em `docs/design-system.md`;
  - a padronização não autoriza redesign amplo nem componentização antecipada de superfícies sem necessidade real.

7. E7 — Conta Consultiva — retirada
- Objetivo: preservar o encerramento do fluxo consultivo legado e seu destino canônico sem reativar arquitetura removida.
- Status: retirado; sem superfície ativa no runtime ou no Admin.

7.1 Encerramento do fluxo consultivo legado

7.1.1 Objetivo e status
- Objetivo: remover a dependência de token pós-venda e impedir que o onboarding consultivo legado permanecesse como caminho paralelo.
- Status: concluído; runtime e contrato de banco atuais não dependem do fluxo removido.

7.1.3 Estado final e destino
- Status: vigente.
- Conteúdo:
  - não existe superfície consultiva ativa em `/admin`;
  - onboarding por token e dependência de token pós-venda não integram o runtime atual;
  - refinamentos de UX anteriormente associados à E7 foram absorvidos pelo Account Dashboard na E10.3;
  - a E7 permanece apenas para estabilidade do identificador e rastreabilidade da retirada.

7.1.4 Limite de retomada
- Status: vigente.
- Conteúdo:
  - a retirada não autoriza reconstrução do fluxo legado;
  - operação consultiva futura depende de problema, escopo e plano aprovados em recorte próprio;
  - integração futura com Billing ou Account Dashboard não constitui pendência vigente sem fonte competente.

8. E8 — Access Context e Governança
- Objetivo: centralizar a decisão server-side de acesso a contas e fornecer contexto sanitizado aos consumidores sem transferir autorização para a UI.
- Status: concluído; boundary, view, adapter e guard SSR permanecem ativos, com campos legados de compatibilidade ainda presentes no orquestrador.

8.1 Decisão canônica de acesso

8.1.1 Objetivo e status
- Objetivo: resolver conta, membership, allow ou deny e motivo operacional em um único fluxo rastreável e fechado por padrão.
- Status: concluído; contrato essencial preservado no runtime atual.

8.1.2 Registros do recorte
- Referências:
  - Arquitetura de acesso, guards e consumidores: `docs/base-tecnica.md` — seções 5.1 e 5.2.
  - View canônica do Access Context: `docs/schema.md` — seção 2.1.

8.1.3 Autoridade e decisão
- Status: implementado e vigente.
- Conteúdo:
  - `public.v_access_context_v2` fornece a relação user ↔ conta, estados de conta e membership, decisão `allow` e motivo;
  - o adapter server-side lê a view e o orquestrador traduz o resultado para o contrato consumido pelos guards;
  - ausência de sessão, conta, membership ou contexto permitido falha fechada;
  - conta ou membership existentes, porém bloqueados, preservam contexto suficiente para tratamento específico;
  - providers e componentes client recebem somente contexto já resolvido e não autorizam nem elevam privilégios.

8.1.4 Governança, bloqueios e rastreabilidade
- Status: implementado e vigente.
- Conteúdo:
  - decisões do adapter e do guard SSR produzem eventos estruturados de allow, deny ou erro seguro;
  - bloqueios conhecidos são diferenciados por estado de membership ou conta;
  - redirects inválidos ou loops retornam ao gateway seguro e limpam a última conta quando necessário;
  - UX específica de membership e conta bloqueados permanece nas E15 e E16, e o gateway permanece na E4.

8.1.5 Compatibilidade residual
- Status: vigente, não autoritativo.
- Conteúdo:
  - `getAccessContext.ts` ainda expõe campos legados de compatibilidade como `is_super_admin`, `acting_as`, `plan` e `limits`;
  - esses campos recebem placeholders e não podem decidir privilégio, entitlement, plano ou limite;
  - autoridade administrativa pertence aos guards próprios, e autoridade comercial pertence ao sinal canônico da E9;
  - remoção dos campos legados depende de confirmar consumidores reais e não autoriza refactor antecipado.

9. E9 — Billing, trial e entitlements

- Objetivo: separar condição comercial da conta do lifecycle operacional da conta; definir elegibilidade comercial por entitlement local efetivo; manter provedores de pagamento como mecanismos de confirmação/persistência, não como prova direta de liberação de produto.
- Status: base universal, liberação manual administrativa, Stripe mínimo e gate produtivo concluídos; trial e provedores alternativos não implementados; o contrato do catálogo de capacidades está concluído, com catálogo inicial e integração aos consumidores ainda planejados.

9.1 Base universal de entitlement comercial

9.1.1 Objetivo e status
- Objetivo: definir a base universal de entitlement comercial.
- Status: concluído; persistência local, leitura efetiva, sinal server-side e gate produtivo estão ativos.

9.1.2 Registros do recorte
- Banco:
  - Criados:
    - `public.account_commercial_entitlements`
    - `public.v_account_commercial_entitlement_effective`
- Repositório:
  - Criados:
    - `supabase/migrations/20260628184945_e9_commercial_entitlements.sql`
    - `supabase/snippets/e9_phase_3_entitlements_verify.sql`
    - `lib/commercial-entitlements/contracts.ts`
    - `lib/commercial-entitlements/adapters/commercialEntitlementAdapter.ts`
    - `lib/commercial-entitlements/index.ts`

9.1.3 Separação entre lifecycle operacional e condição comercial
- Status: concluído.
- Trial, plano, assinatura e liberação manual controlam permissões e limites de uso quando materializados como entitlement comercial válido.
- Trial, plano, assinatura e liberação manual não definem `accounts.status`.
- `accounts.status` representa lifecycle operacional da conta/setup.
- `account_users.status` representa vínculo operacional do usuário com a conta.
- Billing, trial, plano, assinatura e entitlement comercial representam condição comercial separada.
- Entitlement comercial é domínio próprio e não extensão de `lib/access`, `public.plans` ou `lib/access/plan.ts`.

9.1.4 Origem comercial e confirmação
- Status: concluído para as origens implementadas.
- Origens implementadas: `plano_pago_confirmado` e `liberacao_manual`.
- Origem futura possível: trial.
- Provedor de checkout e webhook são mecanismos de confirmação e persistência, não origem comercial.
- Entitlement comercial válido nasce de origem comercial válida e persistência local idempotente quando aplicável.

9.1.5 Planos comerciais canônicos
- Status: concluído no contrato de checkout.
- Cards comerciais canônicos: Starter, Lite, Pro e Ultra.
- Chaves canônicas: `starter`, `lite`, `pro` e `ultra`.
- O contrato comercial do checkout reside em `lib/billing-checkout/contracts.ts`.
- O legado `lib/access/plan.ts` permanece isolado e não é autoridade para checkout, entitlement ou capacidades comerciais.

9.1.6 Modelo mínimo de entitlement comercial
- Status: concluído para o gate produtivo atual.
- Fonte de verdade: `public.account_commercial_entitlements`.
- Contrato server-side: `CommercialEntitlementSignal`, com elegibilidade efetiva, status efetivo e `planKey`.
- Consumidores server-side devem decidir a partir do sinal local efetivo; ausência, erro ou estado inválido falham fechado.
- A retirada do antigo gate produtivo do LP Builder está descrita em 9.1.9.

9.1.7 View efetiva
- Leitura efetiva: `public.v_account_commercial_entitlement_effective`.
- View efetiva validada com elegibilidade comercial positiva no recorte de liberação manual administrativa mínima (9.2).

9.1.8 Signal server-side
- Boundary server-side criado: `lib/commercial-entitlements/`.
- Adapter criado: `getCommercialEntitlementSignal({ accountId })`.
- Signal validado por contrato view → adapter.

9.1.9 Gate histórico do LP Builder — retirado
- Status: retirado com o produto E19.
- `getCommercialEntitlementSignal({ accountId })` permanece autoridade comercial para seus consumidores vigentes, sem consumidor em `lib/lp-builder/`.
- Conta, membership e entitlement não são usados para reconstruir operacionalidade de Landing Page no lifecycle E20.2.
- A retirada não altera billing, checkout ou as demais políticas comerciais da E9.

9.1.10 Fail-closed, limites e ressalvas
- Fallback fail-closed: `accountId` vazio, erro, exceção ou ausência de linha retornam não elegível.
- Sem entitlement comercial válido, a criação produtiva mínima de LP permanece bloqueada.

9.2 Liberação manual administrativa mínima

9.2.1 Objetivo e status
- Objetivo: permitir concessão, atualização e cancelamento manual mínimo de entitlement por `platform_admin`.
- Status: concluído.

9.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/admin/adapters/adminCommercialEntitlementsAdapter.ts`
    - `app/admin/(protected)/contas/[accountId]/actions.ts`
  - Ajustados:
    - `app/admin/(protected)/contas/[accountId]/page.tsx`
- Updates:
  - Aplicados:
    - `supa#40`
    - `prod#19`

9.2.3 Contrato operacional mínimo
- Liberação manual administrativa mínima é origem comercial independente de provedor de pagamento e de trial operacional.
- Ator autorizado: `platform_admin`, incluindo `super_admin` pelo guard existente `requirePlatformAdmin`.
- Superfície administrativa: `app/admin/(protected)/contas/[accountId]/page.tsx`.
- Path canônico de mutação: `app/admin/(protected)/contas/[accountId]/actions.ts`.
- Boundary de escrita: `lib/admin/adapters/adminCommercialEntitlementsAdapter.ts`.
- Mecanismo mínimo: Server Action protegida por `requirePlatformAdmin`, chamando adapter Admin server-only com `createServiceClient()`.
- Persistência exclusiva: `public.account_commercial_entitlements`.
- Origem comercial usada: `liberacao_manual`.
- Concessão manual validada com `status = ativo`, plano canônico, vigência válida e `metadata_json` mínimo.
- Conflito com entitlement efetivo de `plano_pago_confirmado` ou `trial` falha fechado.
- Entitlement manual `ativo` existente é atualizado, sem duplicidade intencional.

9.3 Trial

9.3.1 Objetivo e status
- Objetivo: definir trial como origem futura de entitlement comercial.
- Status: não implementado; contrato operacional, vigência, limites, expiração e auditoria ainda dependem de recorte aprovado.

9.3.3 Trial como origem futura de entitlement
- Trial deve controlar permissões e limites de uso quando materializado como entitlement comercial válido.
- Trial não define `accounts.status`.
- Trial permanece como origem futura possível de entitlement comercial.
- Trial deve usar a cadeia universal de entitlement local efetivo antes de liberar criação produtiva.
- Trial não deve ser confundido com liberação manual administrativa mínima.

9.3.4 Vigência, expiração e limites a definir
- Vigência, expiração, limites e efeitos comerciais do trial ainda precisam ser definidos antes de implementação.

9.3.5 Pendências para implementação operacional
- Definir contrato operacional do trial.
- Definir origem, vigência, limites, expiração e auditoria do trial.
- Implementar trial apenas por recorte futuro aprovado, sem inferir implementação a partir da liberação manual.

9.4 Stripe

9.4.1 Objetivo e status
- Objetivo: integrar Stripe como mecanismo inicial de checkout e confirmação assíncrona, persistindo o resultado no entitlement comercial local.
- Status: concluído para Checkout em modo `subscription` no ambiente de teste e webhook mínimo baseado em `invoice.paid`.

9.4.2 Registros do recorte
- Banco:
  - Criados:
    - `public.stripe_webhook_events`
- Repositório:
  - Criados:
    - `supabase/migrations/20260701202632_e9_stripe_webhook_events.sql`
    - `supabase/snippets/e9_phase_7_2_stripe_webhook_verify.sql`
    - `lib/billing-checkout/contracts.ts`
    - `lib/billing-checkout/adapters/stripePriceMap.ts`
    - `lib/billing-checkout/adapters/stripeCheckoutAdapter.ts`
    - `lib/billing-checkout/adapters/stripeWebhookAdapter.ts`
    - `lib/billing-checkout/index.ts`
    - `app/a/[account]/_components/commercial-page/checkout-actions.ts`
    - `app/api/stripe/webhook/route.ts`
  - Ajustados:
    - `app/a/[account]/page.tsx`
    - `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`

9.4.3 Checkout mínimo
- Status: concluído.
- Provedor inicial: Stripe.
- Ambiente inicial: teste.
- Stripe é mecanismo de checkout/confirmação/persistência, não origem comercial autônoma no gate.
- Modo de Checkout: `subscription`.
- Boundary criado: `lib/billing-checkout/`.
- App cria Checkout Session server-side.
- `free` não vira plano pago.
- `light` não entra no contrato novo.
- `PlanId` legado não é contrato de negócio.

9.4.4 Webhook mínimo
- Status: concluído.
- Endpoint produtivo: `POST /api/stripe/webhook`.
- Persistência local validada em `public.account_commercial_entitlements`.
- Payload bruto, secret, cartão e PII sensível não são persistidos.

9.4.5 Eventos aceitos, auxiliares e ignorados
- Evento que ativa/renova entitlement: `invoice.paid`.
- `checkout.session.completed` é evento auxiliar/ignorado e não libera entitlement.
- `customer.subscription.deleted` e `invoice.payment_failed` ficam registrados como controlados/ignorados neste recorte.

9.4.6 Idempotência e persistência
- Idempotência operacional: `stripe_webhook_events.event_id`.
- Retry validado para evento `failed` e para `processing` antigo com `retry_reason = stale_processing`.

9.4.7 Limites: Stripe não substitui entitlement local
- Stripe não substitui o entitlement local.
- Redirect de sucesso não confirma pagamento nem libera entitlement.
- Redirect, checkout e webhook não substituem a decisão baseada no entitlement local efetivo.

9.5 Mercado Pago

9.5.1 Objetivo e status
- Objetivo: preservar a decisão sobre Mercado Pago sem antecipar integração.
- Status: explicitamente adiado; não há adapter, SDK, endpoint, webhook, persistência ou credencial desse provedor no recorte atual.

9.5.3 Critérios para abertura futura
- Uma integração futura exige recorte aprovado e deve seguir o contrato universal de entitlement definido em 9.1.

9.6 Asaas

9.6.1 Objetivo e status
- Objetivo: preservar Asaas como reserva operacional para avaliação posterior, sem antecipar integração.
- Status: não implementado; não há adapter, SDK, endpoint, webhook, persistência ou credencial desse provedor no recorte atual.

9.6.3 Critérios para abertura futura
- Uma avaliação futura exige recorte aprovado e deve seguir o contrato universal de entitlement definido em 9.1.

9.7 Catálogo canônico de capacidades e limites por plano

9.7.1 Objetivo e status
- Objetivo: definir e resolver um contrato canônico único que traduza o plano efetivo da conta em capacidades, níveis, limites e sinais suficientes para os domínios consumidores decidirem quais configurações podem ser apresentadas.
- Status: em andamento; o contrato canônico está concluído, enquanto o catálogo inicial e a integração pelo plano efetivo permanecem planejados.

9.7.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/commercial-capabilities/contracts.ts`
    - `lib/commercial-capabilities/index.ts`
    - `lib/commercial-capabilities/registry.ts`
    - `lib/commercial-capabilities/resolve.ts`
    - `lib/commercial-capabilities/validation-cases.ts`
  - Ajustados:
    - `package.json`
- Updates:
  - Aplicados:
    - `supa#20`
    - `prod#19`
- Referências:
  - Plano-base v2: `docs/lousa-plano-base-e9-7.md` — seção 3.1.
  - Contrato técnico: `docs/base-tecnica.md` — seção 3.11.

9.7.3 Contrato canônico e fonte de resolução
- Status: concluído.
- Conteúdo:
  - materializa a identificação mínima por chave estável, nome, descrição, categoria, tipo com contrato de valor inequívoco e domínio consumidor;
  - suporta tipos booleano, nível fechado e limite numérico, inclusive `-1` somente quando o contrato do limite adota ilimitado explicitamente;
  - centraliza a fonte repo-only em `lib/commercial-capabilities/`, com `index.ts` como única API pública, registry interno e resolução de produção fail-closed por `planKey` e chave de capacidade;
  - mantém o registry runtime vazio, sem capacidade Starter inferida, e isola fixtures sintéticas do runtime e da API pública;
  - valida contrato, duplicidades, valores, desconhecidos, ausência de associação, fonte vazia e imutabilidade pelo comando `validate:commercial-capabilities`, integrado ao `npm run check`;
  - não cria banco, `get_feature`, grants, snapshot, integração com entitlement ou consumidor, UI, rota, serviço, job, agente ou automação.

9.7.4 Catálogo inicial do Starter
- Status: Planejado; fora do escopo da execução atual por decisão humana.
- Conteúdo:
  - incluir somente capacidades admitidas por decisão humana, com consumidor real existente ou já aprovado para a jornada imediata;
  - registrar separadamente a definição da capacidade e seu valor aprovado para o Starter;
  - manter capacidades ainda candidatas como dependências, sem completar Lite, Pro ou Ultra por extrapolação;
  - distinguir capacidade admitida, consumidor capaz de aplicá-la e recurso efetivamente existente.

9.7.5 Resolução e contrato de consumo pelo plano efetivo
- Status: Planejado; fora do escopo da execução atual por decisão humana.
- Conteúdo:
  - resolver o contrato canônico a partir do `planKey` efetivo fornecido pelo entitlement;
  - disponibilizar contrato server-side determinístico para os domínios consumidores, preservando no consumidor a medição de uso e a aplicação do gate no ponto da ação;
  - manter entitlement como prova do plano e a E9.7 como prova da capacidade, sem inferência de comportamento pela UI a partir do nome do plano;
  - falhar fechado para plano, capacidade, associação ou valor ausente, desconhecido ou inválido.

10. E10 — Account Dashboard e jornada da conta

- Objetivo: consolidar a experiência pós-login por conta, da navegação multi-conta e do setup inicial à resolução de nicho e à apresentação comercial, preservando decisões server-side de acesso, papel, entitlement e estado operacional.
- Status: os fluxos principais estão implementados; permanecem como lacunas do E10 a ação inefetiva de criar outra conta no switcher, a ausência dos eventos específicos do switcher e a edição manual de copy da página comercial personalizada.

10.3 Navegação multi-conta e cabeçalho

10.3.1 Objetivo e status
- Objetivo: permitir que o usuário identifique a conta atual, alterne entre vínculos disponíveis e retome com segurança a última conta acessada.
- Status: implementado para listagem, troca e persistência da última conta; a ação “Criar outra conta” ainda não cria nem inicia uma conta nova.

10.3.2 Registros do recorte
- Banco:
  - Criados:
    - `public.v_user_accounts_list`
- Repositório:
  - Criados:
    - `app/api/user/accounts/route.ts`
    - `components/features/account-switcher/AccountSwitcher.tsx`
    - `components/features/account-switcher/AccountSwitcherTrigger.tsx`
    - `components/features/account-switcher/AccountSwitcherList.tsx`
    - `components/features/account-switcher/useAccountSwitcher.ts`
    - `components/features/account-switcher/useUserAccounts.ts`
  - Ajustados:
    - `app/a/home/page.tsx`
    - `app/a/[account]/layout.tsx`
    - `app/a/_server/section-guard.ts`
    - `components/layout/Header.tsx`
    - `components/layout/UserMenu.tsx`
    - `providers/AccessProvider.tsx`
- Referências:
  - Contrato de banco: `docs/schema.md` — seção 2.2.

10.3.3 Experiência vigente
- O cabeçalho da conta exibe identidade, status, nicho resolvido quando disponível e acesso a membros para `owner` ou `admin` quando a funcionalidade está habilitada.
- O menu do usuário incorpora o switcher; a lista vem de `v_user_accounts_list`, respeita o status do vínculo e oculta o gatilho quando há no máximo uma conta.
- O switcher oferece navegação por teclado, foco controlado, estados de carregamento e erro e bloqueia contas ou memberships não clicáveis.
- O gateway `/a/home` e o guard SSR mantêm a retomada por `last_account_subdomain` em cookie HttpOnly de 90 dias; a decisão de acesso e os redirects seguros residem em E4 e E8.
- A ação “Criar outra conta” ainda aponta para `/a/home?consultive=1`; o gateway não interpreta esse parâmetro e não provisiona conta.
- Os eventos históricos `account_switcher_open`, `account_selected` e `create_account_click` não são emitidos pelo código atual.

10.4 Primeiros passos com status `pending_setup`

10.4.1 Objetivo e status
- Objetivo: coletar o perfil mínimo da conta, persistir os dados validados e promover a conta de `pending_setup` para `active`.
- Status: implementado ponta a ponta em `/a/[account]`.

10.4.2 Registros do recorte
- Banco:
  - Criados:
    - `public.account_profiles`
- Repositório:
  - Criados:
    - `lib/access/adapters/accountProfileAdapter.ts`
    - `lib/onboarding/e10_4_setup_validation.ts`
    - `app/a/[account]/_components/PendingSetupFirstSteps.tsx`
  - Ajustados:
    - `app/a/[account]/actions.ts`
    - `app/a/[account]/page.tsx`
    - `lib/access/adapters/accountAdapter.ts`
    - `lib/access/adapters/accessContextAdapter.ts`
    - `lib/access/getAccessContext.ts`
- Referências:
  - Contrato de banco: `docs/schema.md` — seção 1.8.

10.4.3 Campos e validação compartilhada
- `name` e `niche` são obrigatórios após `trim`.
- `preferred_channel` é opcional e assume `email`; `whatsapp` se torna obrigatório quando esse canal é escolhido e aceita de 10 a 15 dígitos.
- `site_url` é opcional, aceita domínio sem esquema e é normalizado para URL HTTPS quando necessário.
- UI e Server Action usam `validateE10_4SetupForm`; erros preservam valores válidos e direcionam o foco para o primeiro campo inválido.

10.4.4 Persistência e transição
- `accounts.name` permanece no core e o perfil v1 é persistido em `account_profiles` na relação 1:1.
- A promoção `pending_setup → active` é condicional e idempotente.
- Após salvar, o mesmo fluxo inicia a resolução de nicho descrita em 10.5 sem transformar uma falha dessa resolução em falha do setup.
- `setup_completed_at` e `account_setup_completed_at` permanecem legados no banco e não participam do runtime, do gating, do fluxo nem dos logs.

10.5 Taxonomia, pesquisa de mercado e resolução de nicho

10.5.1 Objetivo e status
- Objetivo: transformar o nicho informado no setup em classificação operacional rastreável, vínculo oficial seguro e insumo reutilizável para conteúdo comercial.
- Status: implementado para matching determinístico, escalonamento IA, persistência, vínculo oficial de alta confiança e confirmação ou reescrita pelo usuário.

10.5.2 Registros do recorte
- Banco:
  - Criados:
    - `public.taxon_message_guides`
    - `public.account_niche_resolutions`
    - `public.account_taxonomy`
  - Ajustados:
    - `public.taxon_market_research`
    - `public.taxon_market_research_items`
- Repositório:
  - Criados:
    - `lib/onboarding/niche-resolution/contracts.ts`
    - `lib/onboarding/niche-resolution/deterministicConfidence.ts`
    - `lib/onboarding/niche-resolution/adapters/taxonMatchAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/accountNicheResolutionAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/accountNicheResolutionUserAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `app/a/[account]/niche-resolution-actions.ts`
    - `app/a/[account]/_components/NicheResolutionCard.tsx`
    - `supabase/migrations/20260804201831_account_taxonomy_one_active_primary.sql`
    - `supabase/snippets/account_taxonomy_one_active_primary_verify.sql`
    - `supabase/snippets/e10_5_5_nicho_carregamento.sql`
    - `supabase/snippets/e10_5_5_nicho_verificacao.sql`
  - Ajustados:
    - `app/a/[account]/actions.ts`
    - `app/a/[account]/page.tsx`
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.11–1.19.
  - Fluxo operacional: `docs/prompt-nicho-identificacao.md`, `docs/prompt-nicho-pesquisa.md`, `docs/prompt-nicho-itens-estruturados.md`, `docs/prompt-nicho-carregamento.md` e `docs/prompt-nicho-verificacao.md`.

10.5.3 Base de taxonomia e pesquisa
- `business_taxons` e `business_taxon_aliases` sustentam a classificação; `taxon_market_research` e `taxon_market_research_items` armazenam pesquisas versionadas e seus itens estruturados.
- O fluxo operacional separa identificação do taxon, pesquisa bruta, estruturação, carregamento e verificação.
- Para elegibilidade de `commercial_activation`, a versão 1 ativa deve ter itens nos blocos `strategic_core`, `lp_overview`, `lp_sections` e `seo` para `business_buyer` e `end_customer`.

10.5.4 Resolução determinística e IA
- O matching server-side usa normalização textual, FTS e `pg_trgm`, produz candidatos tipados e passa por `evaluateDeterministicTaxonMatch`.
- A resolução operacional é persistida em `account_niche_resolutions`, inclusive decisão, proveniência, estado IA e necessidade de confirmação ou revisão.
- Quando o determinístico não resolve com segurança, `openAiResolver.ts` usa Structured Outputs server-side.
- A IA não cria taxon, alias ou vínculo oficial e nunca grava diretamente `account_taxonomy`.

10.5.5 Confirmação pelo usuário
- `NicheResolutionCard` aparece somente para conta `active`, sem taxon primário e com resolução acionável.
- O usuário pode confirmar a sugestão oficial, escolher entre opções ou reescrever o nicho.
- Opções sem taxon oficial podem encerrar a confirmação operacional, mas não inventam vínculo taxonômico.

10.5.6 Classificação oficial e consumo
- `account_taxonomy` é o vínculo oficial da conta; a gravação automática ocorre apenas para alta confiança determinística e não substitui silenciosamente outro primário.
- O banco permite no máximo um vínculo primário ativo por conta; leituras com cardinalidade inesperada falham fechado.
- A rota da conta usa o taxon primário ativo para tentar conteúdo personalizado e mantém a página genérica quando não existe bundle publicável.
- A resolução antecipada de template comercial foi retirada: E10.7 resolve o conteúdo comercial publicado, enquanto o onboarding e o workspace de landing pages residem em E19.

10.6 Página comercial genérica

10.6.1 Objetivo e status
- Objetivo: oferecer uma apresentação comercial responsiva e segura para contas `active` quando não houver página personalizada consumível.
- Status: implementado como `generic-v1` e fallback da página personalizada.

10.6.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.audit_context_event`
- Repositório:
  - Criados:
    - `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`
    - `app/a/[account]/_components/commercial-page/actions.ts`
    - `app/a/[account]/_components/commercial-page/checkout-actions.ts`
    - `app/a/[account]/_content/commercial-page/generic-v1.ts`
    - `supabase/migrations/20260614124000_fix_audit_context_event_event_column.sql`
  - Ajustados:
    - `app/a/[account]/page.tsx`

10.6.3 Experiência e tracking
- A página reúne hero, benefícios, serviços, medição, planos, diferenciais, funcionamento, FAQ e CTA final.
- Planos e ações financeiras aparecem somente quando a política da jornada autoriza; a autoridade de papel reside em E11.2 e o checkout Stripe em E9.4.
- Os botões dos planos iniciam Checkout Stripe mensal server-side; o CTA final permanece direcionado ao WhatsApp.
- `commercial_page_view`, `commercial_primary_cta_click` e `commercial_plan_cta_click` são persistidos via `audit_context_event`, vinculados a `account_id` e sem campos diretos de PII.

10.6.4 Limites e fallback
- Os preços e serviços de `generic-v1` são ilustrativos e não constituem oferta comercial definitiva.
- `NicheResolutionCard` permanece acima da página quando há confirmação de nicho pendente.
- Ausência, erro ou bundle personalizado inválido mantêm a conta na página genérica; a rota não chama IA para renderizar conteúdo comercial.

10.7 Páginas comerciais personalizadas por nicho

10.7.1 Objetivo e status
- Objetivo: gerar, revisar, publicar e consumir páginas `commercial_activation` por taxon, mantendo a IA no fluxo administrativo e o runtime da conta restrito a conteúdo publicado e validado.
- Status: geração, operação Admin, publicação, consumo e fallback estão implementados; edição manual de copy permanece planejada.

10.7.2 Registros do recorte
- Banco:
  - Criados:
    - `public.publish_content_artifact_draft(uuid)`
    - `public.ensure_commercial_activation_composition(uuid)`
  - Ajustados:
    - `public.content_artifacts`
    - `public.content_artifact_research_sources`
- Repositório:
  - Criados:
    - `supabase/migrations/20260621162400_e10_7_admin_artifact_write_publish.sql`
    - `supabase/migrations/20260621181742_e10_7_fix_research_sources_policy_name.sql`
    - `supabase/migrations/20260624203000_e10_7_phase_5_ensure_commercial_activation_composition.sql`
    - `lib/conversion-content/commercial-activation/draft-generation.ts`
    - `lib/conversion-content/commercial-activation/composition.ts`
    - `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`
    - `app/admin/(protected)/templates/actions.ts`
    - `app/admin/(protected)/templates/commercial-activation/[taxonSlug]/page.tsx`
    - `app/a/[account]/_components/commercial-page/CommercialActivationTrackingScope.tsx`
    - `app/a/[account]/_components/commercial-page/PublishedCommercialActivationPage.tsx`
    - `supabase/snippets/e10_7_phase_7_commercial_activation_contract_verify.sql`
  - Ajustados:
    - `app/admin/(protected)/templates/page.tsx`
    - `app/a/[account]/page.tsx`
    - `lib/conversion-content/adapters/commercialActivationAdapter.ts`
    - `lib/conversion-content/commercial-activation/renderer.tsx`
- Updates:
  - Aplicados:
    - `supa#40`
    - `supa#58`
    - `prod#14`
    - `prod#16`
- Referências:
  - Plano do recorte: `docs/lousa-plano-base-e10-7.md`.
  - Contrato de banco: `docs/schema.md` — seções 1.22–1.23 e 3.3.

10.7.3 Elegibilidade e geração
- Um taxon elegível exige pesquisas ativas da versão 1 para `business_buyer` e `end_customer`, cada uma com os quatro blocos definidos em 10.5.3 e itens ativos.
- O template de página é universal para `commercial_activation`; a composição técnica é materializada por taxon quando necessário.
- A geração cria draft administrativo com fontes vinculadas e proveniência; inconsistência de fontes ou conteúdo impede publicação.
- A estrutura do MVP é fixa em Hero, Benefícios, Serviços, Planos, Diferenciais, Como funciona, FAQ e CTA final; a IA preenche copy, mas não decide seções, ordem, layout ou cores.

10.7.4 Operação administrativa
- `/admin/templates` lista taxons e estados; `/admin/templates/commercial-activation/[taxonSlug]` concentra geração ou regeneração, preview, publicação, diagnóstico e histórico.
- As operações exigem `platform_admin`; publicação usa `publish_content_artifact_draft(uuid)`, valida o bundle e arquiva a versão publicada anterior.
- O fluxo atual não oferece edição manual do `content_json`.

10.7.5 Consumo na conta
- `/a/[account]` tenta resolver `commercial_activation` pelo taxon primário ativo e sua cadeia hierárquica.
- Somente artifact `published`, composição válida e render model `ready` são consumidos.
- Conta sem taxon válido, composição, publicação ou conteúdo consumível retorna a `generic-v1`.
- A variante publicada reutiliza os eventos comerciais e o Checkout Stripe da página genérica, respeitando a mesma política de ações financeiras.
- O runtime da conta não consome `draft` ou `archived` e não chama IA.

10.7.6 Próximo recorte aprovado
- Status: planejado.
- Conteúdo: permitir edição manual de copy e gestão simples de versões sem introduzir editor visual, edição independente por bloco, múltiplos `published` ativos, alteração do template, da composição, do layout, das cores ou do runtime público.

10.8 Resolução de pesquisas estruturadas para `landing_page` — retirada

10.8.1 Objetivo e status
- Objetivo: registrar o encerramento do boundary histórico de resolução de pesquisas para `landing_page`.
- Status: retirado pela E22.1.6; não existe substituto vigente no E10.

10.8.3 Estado e destino
- `lib/conversion-content/landing-page/research-resolution/`, o adapter de pesquisa, os exports e o validator foram removidos.
- E20.5 e E20.6 preservam a seleção e a avaliação da pesquisa integral `end_customer`, sem consumidor no fluxo retirado de Landing Pages.
- Os objetos `taxon_market_research` e `taxon_market_research_items` e seus consumidores independentes permanecem preservados.
- O inventário material da retirada reside em E22.1.2.

11. E11 — Gestão de membros e autoridade comercial

- Objetivo: permitir gestão segura de membros não-owner por conta e tornar explícitas as regras de papel e entitlement para checkout, novos convites e manutenção de vínculos.
- Status: implementado e habilitado em Preview e Production; gestão de membros, convites, autoatendimento do convidado e políticas comerciais estão ativas.

11.1 Gestão de membros e convites

11.1.1 Objetivo e status
- Objetivo: permitir que `owner` e `admin` convidem e administrem membros `admin`, `editor` e `viewer`, preservando o owner, o próprio ator e o isolamento multi-tenant.
- Status: implementado, com gate `E11_MEMBERS_ENABLED=true` nos ambientes hospedados.

11.1.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.account_users`
    - `public.accept_account_invite(uuid, integer)`
    - `public.revoke_account_invite(uuid, uuid)`
    - `public.invitation_expires_at(uuid, integer)`
    - `public.invitation_is_expired(uuid, integer)`
    - `public.activate_user_from_auth_hook(jsonb)`
- Repositório:
  - Criados:
    - `supabase/migrations/20260727155312_e11_account_members_security.sql`
    - `supabase/snippets/e11_account_members_verify.sql`
    - `lib/access/account-members/`
    - `app/a/[account]/members/`
    - `app/a/home/PendingInviteActionButton.tsx`
    - `app/a/home/member-invite-actions.ts`
  - Ajustados:
    - `app/a/[account]/layout.tsx`
    - `app/a/home/page.tsx`
    - `app/auth/confirm/route.ts`
    - `app/auth/update-password/page.tsx`
    - `components/layout/Header.tsx`
    - `lib/access/guards.ts`
    - `lib/supabase/service.ts`
    - `package.json`
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.2 e 3.4.
  - Configuração hospedada: `docs/platform-config.md` — seções 3.5 e 4.6.

11.1.3 Autoridade e transições
- A rota `/a/[account]/members`, suas leituras e suas ações exigem o gate habilitado e contexto de `owner` ou `admin`.
- Os papéis administráveis são `admin`, `editor` e `viewer`; `owner` não entra nas mutações comuns.
- Alteração de papel, desativação e revogação operam sobre membership específico e são idempotentes quando o estado já corresponde ao resultado.
- O owner e o próprio ator são protegidos contra mutações administrativas indevidas.
- As funções legadas de convite permanecem no banco sem `EXECUTE` para os papéis de runtime; o fluxo atual usa o boundary server-only `lib/access/account-members/`.

11.1.4 Convite por e-mail
- Usuário novo ou ainda não confirmado recebe o template nativo `Invite user` do Supabase Auth.
- Cada emissão carrega estado versionado e assinado, vinculado a um único `account_user_id`, no `redirectTo` específico do convite.
- A confirmação anti-scanner, a definição de senha e a ativação atingem somente o vínculo validado e aceitam retry idempotente.
- Validade e reenvio permanecem sob responsabilidade do Supabase Auth; não há expiração local, e-mail customizado, Auth Hook amplo, job ou automação para esse ciclo.

11.1.5 Convite dentro do produto
- Usuário já confirmado recebe a pendência em `/a/home`, sem novo e-mail.
- Aceite e recusa derivam a identidade da sessão e processam um vínculo pendente por vez.
- O canal do convite é correlacionado ao ciclo `pending` atual; evento ausente ou pertencente a ciclo anterior falha fechado.
- O membership permanece `pending` até aceite, recusa ou revogação.

11.1.6 Superfície de gestão
- A página de membros lista vínculos ativos e convites pendentes.
- `owner` e `admin` podem convidar, reenviar, revogar, alterar papel e desativar dentro das proteções do domínio.
- O cabeçalho expõe a navegação para membros apenas aos papéis autorizados e quando o gate está ativo.
- Com o gate ausente ou diferente do literal `true`, rota, navegação, leituras e mutações permanecem fechadas.

11.2 Autoridade comercial por papel

11.2.1 Objetivo e status
- Objetivo: combinar papéis da conta e o sinal canônico da E9 para decidir checkout, criação ou reenvio de convites e experiência comercial, sem alterar vínculos existentes.
- Status: implementado; políticas server-side, experiência genérica e publicada e validações de regressão estão integradas ao runtime atual.

11.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/a/[account]/_components/commercial-page/checkout-policy.ts`
    - `app/a/[account]/_components/commercial-page/checkout-validation-cases.ts`
    - `app/a/[account]/_components/commercial-page/commercial-experience-policy.ts`
    - `app/a/[account]/_components/commercial-page/commercial-experience-validation-cases.ts`
  - Ajustados:
    - `app/a/[account]/_components/commercial-page/CommercialActivationTrackingScope.tsx`
    - `app/a/[account]/_components/commercial-page/GenericCommercialPage.tsx`
    - `app/a/[account]/_components/commercial-page/PublishedCommercialActivationPage.tsx`
    - `app/a/[account]/_components/commercial-page/checkout-actions.ts`
    - `app/a/[account]/page.tsx`
    - `app/a/[account]/members/page.tsx`
    - `lib/access/account-members/contracts.ts`
    - `lib/access/account-members/index.ts`
    - `lib/access/account-members/policy.ts`
    - `lib/access/account-members/validation-cases.ts`
    - `lib/access/guards.ts`
    - `lib/conversion-content/commercial-activation/renderer.tsx`
    - `package.json`
- Referências:
  - Plano do recorte: `docs/lousa-plano-base-e11-2.md`.
  - Entitlement canônico: E9.1.
  - Experiência comercial: E10.6–E10.7.

11.2.3 Checkout
- Somente `owner` com conta `active`, membership `active` e sem entitlement comercial válido pode visualizar a ação financeira e iniciar o checkout.
- `admin`, `editor` e `viewer` não iniciam checkout; a Server Action repete o guard independentemente da UI.
- `owner` já comercialmente elegível não cria nova assinatura pela action atual.
- A decisão usa apenas `CommercialEntitlementSignal.isCommerciallyEligible`; preço, recorrência, webhook e persistência do pagamento residem em E9.4.
- Cada decisão de checkout registra no máximo um evento estruturado `commercial_checkout_decision` com resultado `allowed`, `denied` ou `error`, sem campos diretos de PII e sem alterar o resultado da operação.

11.2.4 Novos convites e reenvio
- `owner` e `admin` só criam ou reenviam convites quando a conta está `active` e `isCommerciallyEligible=true`.
- O guard comercial ocorre antes de leitura ou criação no Auth, preparação de membership, registro de canal ou envio.
- Ausência ou erro do sinal de entitlement bloqueia criação e reenvio.
- Cada decisão registra no máximo um evento `account_member_invite_decision`; o logging é não bloqueante.
- `editor` e `viewer` permanecem sem gestão de membros.

11.2.5 Experiência sem entitlement
- `owner` sem entitlement recebe a variante comercial vigente com ações financeiras.
- `admin`, `editor` e `viewer` sem entitlement recebem estado de espera pela ativação comercial do proprietário, sem cards ou CTA financeiro.
- `GenericCommercialPage` e `PublishedCommercialActivationPage` aplicam a mesma política; a variante publicada preserva bundle, conteúdo, composição, ordem e schemas da E10.7.
- A política comercial não cria dashboard produtivo paralelo; quando há entitlement, a jornada operacional pertence a E19.

11.2.6 Operações preservadas
- Listagem, aceite, recusa, revogação, desativação e alteração de papel independem do entitlement.
- Entitlement ausente não apaga, desativa ou altera retroativamente memberships existentes.
- O gate comercial se restringe a criar e reenviar convites e não redefine as transições seguras da E11.1.

12. E12 — Admin Dashboard

- Objetivo: oferecer uma seção administrativa protegida e independente do Account Dashboard, com shell próprio, leitura operacional e integração controlada das operações administrativas definidas pelos domínios responsáveis.
- Status: base, navegação, documentação, contas, resoluções de nicho, taxonomia, páginas comerciais e estrutura da LP estão implementadas; Workloads e Custos OpenAI são integrados sob E21, e Auditoria permanece como área em preparação.

12.1 Contrato administrativo base

12.1.1 Objetivo e status
- Objetivo: definir a fronteira do Admin Dashboard, sua proteção e a residência das operações integradas.
- Status: contrato implementado.

12.1.3 Fronteira vigente
- `/admin` é a entrada pública; as rotas internas usam o gate SSR de `app/admin/(protected)/layout.tsx` e exigem `platform_admin`.
- O destino administrativo pós-login é `/admin/contas`.
- Header, menu, sidebar e navegação são próprios do Admin, sem `AccountSwitcher` e sem dependência de conta ativa.
- O Admin oferece leituras e mutações apenas quando um recorte de domínio as autoriza; o shell não cria autoridade administrativa paralela.
- A operação de páginas comerciais reside em E10.7, entitlement manual em E9.2, seleção e avaliação de insumos em E20.5–E20.6 e gestão e custos OpenAI em E21.

12.1.4 Áreas atuais
- Disponíveis: Contas, Resoluções de nicho, Taxonomia, Páginas comerciais, Estrutura da LP, Workloads OpenAI, Custos OpenAI e Documentação.
- Em preparação: Auditoria.
- A navegação é responsiva e preserva o bloqueio de identidade autenticada sem autoridade de plataforma.

12.2 Shell, documentação e leituras administrativas base

12.2.1 Objetivo e status
- Objetivo: fornecer entrada pública, shell protegido, leitor de documentação e superfícies administrativas base para contas, resoluções de nicho e taxonomia.
- Status: implementado.

12.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/admin/(protected)/documentacao/page.tsx`
    - `app/admin/(protected)/contas/page.tsx`
    - `app/admin/(protected)/contas/[accountId]/page.tsx`
    - `app/admin/(protected)/resolucoes-de-nicho/page.tsx`
    - `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`
    - `app/admin/(protected)/taxonomia/page.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    - `app/admin/(protected)/layout.tsx`
    - `components/admin/AdminMobileMenu.tsx`
    - `components/admin/AdminPageHeader.tsx`
    - `components/admin/AdminPlaceholderPage.tsx`
    - `components/admin/AdminSidebar.tsx`
    - `components/admin/AdminStatusBadge.tsx`
    - `components/admin/adminNavigation.ts`
    - `lib/admin/adminFormat.ts`
    - `lib/admin/adapters/adminAccountsAdapter.ts`
    - `lib/admin/adapters/adminNicheResolutionsAdapter.ts`
    - `lib/admin/adapters/adminReadOnlyAdapter.ts`
    - `lib/admin/adapters/adminReadOnlyHelpers.ts`
    - `lib/admin/adapters/adminReadOnlyTypes.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/admin/docsCatalog.ts`
    - `lib/admin/readRepoDoc.ts`
  - Ajustados:
    - `app/admin/layout.tsx`
    - `app/admin/page.tsx`
    - `components/admin/AdminHeader.tsx`
    - `components/admin/AdminUserMenu.tsx`
    - `next.config.js`

12.2.3 Entrada e proteção
- A entrada pública apresenta o Admin e envia o usuário para `/auth/login?next=%2Fadmin%2Fcontas`.
- O layout protegido reexecuta `requirePlatformAdmin`; identidade não autenticada retorna ao login e identidade sem autoridade recebe destino público neutro.
- O shell protegido usa `AdminHeader`, `AdminSidebar` e menu mobile dentro de uma largura operacional única.

12.2.4 Documentação read-only
- `/admin/documentacao` lista uma whitelist fixa de documentos do repositório, com filtro e seleção.
- `readRepoDoc` lê apenas paths autorizados pelo filesystem server-side e o tracing da rota inclui explicitamente esses arquivos.
- O conteúdo Markdown é exibido como texto bruto; não há GitHub API em runtime, edição, salvamento, publicação, banco ou mutação.

12.2.5 Leituras e integrações de conta
- Contas, resoluções de nicho e taxonomia usam adapters server-only com paginação, filtros e projeções próprias para o Admin.
- A listagem de resoluções e seu detalhe são read-only.
- O detalhe da conta integra a liberação manual de entitlement definida em E9.2; essa mutação não pertence ao contrato base da E12.
- A taxonomia evoluiu para operação controlada e diagnóstico contextual, consolidada em 12.5.

12.3 Integração administrativa de `commercial_activation`

12.3.1 Objetivo e status
- Objetivo: integrar ao shell administrativo a geração, revisão e publicação de páginas comerciais definida pela E10.7.
- Status: implementado; a autoridade funcional e os registros materiais residem em E10.7.

12.3.2 Registros do recorte
- Referências:
  - Plano da operação: `docs/lousa-plano-base-e10-7.md`.
  - Registros materiais e contrato funcional: E10.7.2–E10.7.5.

12.3.3 Superfície integrada
- `/admin/templates` lista taxons e estados comerciais; `/admin/templates/commercial-activation/[taxonSlug]` concentra geração ou regeneração, preview, publicação, diagnóstico e histórico.
- O layout protege a superfície e cada Server Action reexecuta `requirePlatformAdmin`.
- Publicação, composição, elegibilidade, renderer e fallback permanecem definidos pela E10.7; a E12 não introduz editor visual nem LP Builder.

12.4 Perfil de orientação — retirado

12.4.1 Objetivo e status
- Objetivo: registrar o encerramento da antiga operação administrativa de perfis de orientação.
- Status: retirado pela E22.1.4; não existe rota, navegação ou boundary vigente para esse domínio.

12.4.3 Estado e destino
- `/admin/perfis-de-orientacao`, `generation-profile`, seus adapters, exports, validator e workload de proposta foram removidos.
- As tabelas, RPCs e objetos próprios do perfil também foram removidos por migration forward-only.
- Não há editor, lifecycle, proposta ou refinamento por IA de perfil no produto atual.
- O inventário material da retirada reside em E22.1.2 e o contrato vigente de geração de landing pages não depende desse domínio.

12.5 Taxonomia e diagnóstico contextual

12.5.1 Objetivo e status
- Objetivo: permitir consulta e gestão controlada da taxonomia, acompanhar resoluções de nicho e conectar o diagnóstico aos fluxos comerciais e de preparação vigentes.
- Status: implementado; diagnósticos históricos de E20.3 e E10.8 foram retirados, enquanto página comercial, seleção E20.5 e avaliação E20.6 permanecem ativas.

12.5.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/taxonomia/page.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    - `app/admin/(protected)/taxonomia/novo/page.tsx`
    - `app/admin/(protected)/taxonomia/actions.ts`
    - `app/admin/(protected)/resolucoes-de-nicho/page.tsx`
    - `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`
    - `components/admin/AdminTaxonCreateForm.tsx`
    - `components/admin/AdminTaxonManageForm.tsx`
    - `components/admin/AdminTaxonResearchSelectionForm.tsx`
    - `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`
    - `lib/admin/adapters/adminInputCatalogLifecycleAdapter.ts`
    - `lib/admin/adapters/adminInputCatalogLifecycleContext.ts`
    - `lib/admin/adapters/adminInputCatalogLifecyclePagination.ts`
    - `lib/admin/adapters/adminInputCatalogLifecycleValidation.ts`
    - `lib/admin/adapters/adminNicheResolutionsAdapter.ts`
    - `lib/admin/adapters/adminReadOnlyAdapter.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/admin/adapters/adminTaxonomyReviewPolicy.ts`
- Referências:
  - Plano do recorte: `docs/lousa-plano-base-e12-5.md` — seção E12.5.3.
  - Seleção e avaliação vigentes: E20.5–E20.6.

12.5.3 Taxonomia
- A lista permite busca e filtros por nível e status, mostra o estado do taxon e resume a página comercial.
- O detalhe expõe identidade, hierarquia, uso operacional, aliases e diagnóstico comercial.
- Criação, edição, ativação ou inativação, aliases e exclusão segura são ações de `platform_admin` e revalidam as dependências de preparação aplicáveis.
- Seleção da pesquisa integral `end_customer` e revisão ou avaliação do catálogo de entradas aparecem somente quando seus gates e contratos próprios estão disponíveis.

12.5.4 Resoluções de nicho e navegação
- A lista e o detalhe de resoluções permanecem read-only, com entrada, confiança, decisão determinística, estado IA e necessidade de revisão.
- A navegação para Taxonomia e Página comercial usa somente o taxon confirmado; sugestão IA isolada não é tratada como vínculo oficial.
- Falha de um diagnóstico não inventa prontidão nem escolhe resultado silenciosamente.
- Perfis de orientação, pesquisas da E10.8 e seus estados órfãos não aparecem nas superfícies atuais.

12.6 Estrutura da LP no Admin Dashboard

12.6.1 Objetivo e status
- Objetivo: expor uma consulta estrutural read-only dos parâmetros raiz e das entradas resolvidas da landing page.
- Status: implementado; as visões históricas de módulos, variantes e pesquisas foram retiradas.

12.6.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/admin/(protected)/estrutura-lp/page.tsx`
    - `lib/admin/adapters/adminLandingPageStructureAdapter.ts`
  - Ajustados:
    - `app/admin/(protected)/estrutura-lp/validation-cases.ts`
    - `components/admin/AdminPageHeader.tsx`
    - `components/admin/adminNavigation.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/conversion-content/landing-page/index.ts`
    - `lib/conversion-content/landing-page/root-resolver.ts`
- Updates:
  - Aplicados:
    - `prod#14`
    - `prod#16`
    - `prod#17`
- Referências:
  - Plano do recorte: `docs/lousa-plano-base-e12-6.md` — seção E12.6.3.
  - Parâmetros raiz: E18.4.
  - Catálogo de entradas: E20.2.

12.6.3 Consulta vigente
- O Admin possui um único item `Estrutura da LP` e uma única rota `/admin/estrutura-lp`.
- `Parâmetros` consulta o contrato público da E18.4; `Entradas` resolve o catálogo da E20.2 por versão, plano e taxon ativo.
- Queries antigas ou visão desconhecida retornam com segurança para `Parâmetros`.
- A leitura usa um único adapter e consultas server-side em lote, sem exportar registry ou schema privado, sem N+1 e sem regra de domínio em React.
- A rota não persiste, não chama IA e não executa mutações.

13. E13 — Partner Dashboard

- Objetivo: reservar a jornada administrativa de parceiros sem antecipar produto, API ou arquitetura antes de um recorte funcional aprovado.
- Status: não iniciado; não existe dashboard, rota, boundary de aplicação ou API de parceiros no repositório atual.

13.1 Recorte futuro de parceiros

13.1.1 Objetivo e status
- Objetivo: definir uma superfície de parceiros somente quando houver jornada, atores, permissões e resultado operacional aprovados.
- Status: futuro sem escopo funcional aprovado.

13.1.2 Registros do recorte
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.6–1.7.

13.1.3 Estado atual e limite
- `partners` e `partner_accounts` existem como fundação de banco e permanecem registrados em E1.
- Não há implementação atual de branding de agência, gestão de clientes, relatórios ou Partner API.
- Uma boundary própria só deve ser criada junto do primeiro recorte funcional aprovado e de consumidores reais.

14. E14 — Área pessoal do usuário — não iniciada

- Objetivo: registrar uma eventual área pessoal de perfil e preferências sem confundi-la com o Account Dashboard ou com o antigo workspace de Landing Pages.
- Status: não iniciado; não existe rota, página, persistência de preferências ou boundary própria para esse domínio.

14.1 Perfil e preferências pessoais

14.1.1 Objetivo e status
- Objetivo: permitir gestão de dados pessoais somente após definição aprovada de campos, autoridade e resultado para o usuário.
- Status: futuro sem recorte funcional aprovado.

14.1.3 Estado atual e residência das responsabilidades
- `components/layout/UserMenu.tsx` ainda expõe um link para `/workspace/profile`, mas a rota `app/workspace/` não existe; o link não entrega uma jornada funcional.
- Seleção e persistência da conta atual residem em E10.3.
- Decisão de acesso por conta reside em E8.
- O antigo onboarding e workspace operacional de Landing Pages foram retirados na E19/E22.4.
- Nenhuma nova estrutura de Workspace Dashboard deve ser criada até existir um recorte pessoal aprovado.

15. E15 — Usuário e membership por conta

- Objetivo: distinguir identidade autenticada de vínculo por conta e definir o comportamento seguro dos estados de membership.
- Status: implementado; contrato de banco, Access Context, redirects por status e ciclo de convite estão ativos.

15.1 Contrato de membership

15.1.1 Objetivo e status
- Objetivo: garantir que papéis e estados sejam avaliados por vínculo e nunca inferidos apenas da identidade global do usuário.
- Status: concluído.

15.1.2 Registros do recorte
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — seções 5.1.1 e 5.4.
  - Contrato de banco: `docs/schema.md` — seções 1.2 e 2.1.
  - Ciclo de convite: E11.1.

15.1.3 Identidade e vínculo
- O usuário do Supabase Auth é uma identidade global; `account_users` representa seu membership em uma conta específica.
- O mesmo usuário pode ter papel e status diferentes em contas diferentes.
- Os estados vigentes do vínculo são `pending`, `active`, `inactive` e `revoked`.
- Decisões de conta exigem membership do tenant solicitado e não reutilizam papel ou estado de outro vínculo.

15.1.4 Ativação e bloqueios
- Membership não-owner em `pending` torna-se `active` somente pelo aceite autenticado no produto ou pela confirmação validada do convite por e-mail da E11.1.
- O Auth Hook amplo e as funções legadas de convite não participam do caminho operacional.
- `pending`, `inactive` e `revoked` recebem destinos públicos específicos; conta bloqueada também recebe destino compatível com seu status.
- A decisão final e os redirects seguros residem em E8 e no guard SSR da E4.

15.1.5 Usuário sem membership
- Usuário autenticado sem vínculo não recebe conta automática no gateway.
- `/a/home` tenta a última conta válida e o fallback determinístico; sem membership disponível, retorna a `/auth/confirm/info`.
- A primeira conta só pode nascer pelo fluxo server-side aprovado; a existência de qualquer membership impede auto-criação adicional.

16. E16 — Lifecycle operacional de contas

- Objetivo: definir os estados operacionais de `accounts.status`, sua única transição de produto implementada e a experiência segura de cada bloqueio, sem misturar billing ou entitlement ao lifecycle da conta.
- Status: contrato e consumo implementados; `pending_setup → active` é a mutação de produto vigente, enquanto suspensão, inativação e reativação administrativas não possuem operação própria no Admin atual.

16.1 Estados e transições da conta

16.1.1 Objetivo e status
- Objetivo: manter uma interpretação única de `pending_setup`, `active`, `inactive` e `suspended` em adapters, guards e UX.
- Status: implementado, com um drift de copy ainda presente na tela de conta inativa.

16.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/auth/confirm/account/inactive/page.tsx`
    - `app/auth/confirm/account/suspended/page.tsx`
  - Ajustados:
    - `lib/types/status.ts`
    - `lib/access/adapters/accountAdapter.ts`
    - `app/a/_server/section-guard.ts`
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — seções 5.1.1 e 5.4.
  - Contrato de banco: `docs/schema.md` — seção 1.1.
  - Setup da conta: E10.4.
  - Entitlement comercial: E9.1.

16.1.3 Estados vigentes
- `pending_setup`: setup mínimo incompleto; `/a/[account]` apresenta “Primeiros passos”.
- `active`: setup operacional concluído; a rota apresenta a experiência comercial preservada conforme papel e entitlement, sem desvio ao produto legado de Landing Pages.
- `inactive`: bloqueio operacional reversível; o guard impede a seção privada e envia para a tela pública de conta inativa.
- `suspended`: bloqueio administrativo; o guard impede a seção privada e envia para a tela pública de conta suspensa.
- O status da conta é independente do status de cada membership: ambos precisam permitir a operação solicitada.

16.1.4 Transição implementada
- `pending_setup → active` ocorre após o salvamento válido do onboarding mínimo da E10.4.
- A mutação usa update condicional por estado e é idempotente.
- Não existe no Admin atual ação geral de `active → inactive`, `inactive → active`, suspensão ou retirada de suspensão.
- Billing, trial, plano, pagamento e entitlement não alteram `accounts.status`; sua autoridade reside em E9.

16.1.5 UX dos bloqueios
- Ao bloquear uma conta, o guard remove a última conta persistida em best effort antes do redirect.
- A tela de conta inativa oferece contato por e-mail, troca de conta e retorno ao login.
- A tela de conta suspensa oferece suporte, troca de conta e retorno ao login.
- O Account Dashboard não escolhe silenciosamente outra conta quando a URL solicitada está bloqueada.

16.1.6 Limite e drift atual
- A copy da tela `/auth/confirm/account/inactive` ainda associa a inatividade a pendência de pagamento e usa o CTA “Reativar / pagar”.
- Essa copy não representa uma integração de billing nem uma transição automática e conflita com a separação canônica definida em E9.
- Até existir recorte operacional aprovado para mudança de status, `inactive` e `suspended` devem ser tratados apenas como estados consumidos e bloqueados com segurança.

17. E17 — Automações e infraestrutura de validação

- Objetivo: fornecer automações operacionais e facilitadores de teste com execução controlada, permissões mínimas, rastreabilidade e revisão humana, sem transferir a autoridade funcional dos casos de produto.
- Status: infraestrutura implementada e em evolução; raiz canônica `automations/`, workflows de orquestração e pipelines operacionais estão ativos.

17.1 Automações operacionais e validação

17.1.1 Objetivo e status
- Objetivo: padronizar inspeção, aplicação controlada, validações reais e manutenção documental por GitHub Actions.
- Status: implementado para os fluxos catalogados em `docs/automations.md`.

17.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `.github/workflows/security.yml`
    - `.github/workflows/pipeline-supabase-inspect.yml`
    - `.github/workflows/pipeline-docs-apply-report.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
    - `.github/workflows/automation-validador-final.yml`
    - `.github/workflows/automation-niche-runtime-tests.yml`
    - `automations/supabase-inspect/`
    - `automations/docs-apply-report/`
    - `automations/validador-final/`
    - `automations/niche-runtime-tests/`
  - Ajustados:
    - `AGENTS.md`
    - `package.json`
- Referências:
  - Catálogo operacional: `docs/automations.md` — seções 0.4–0.5 e 3.1–3.7.
  - Configuração e secrets por nome: `docs/platform-config.md` — seções 2.2–2.4.
  - Validação local: `docs/base-tecnica.md` — seção 3.4.2.

17.1.3 Estrutura canônica
- `.github/workflows/` é a camada de entrada e orquestração.
- Novas automações operacionais devem nascer como subprojetos isolados em `automations/<nome>/`.
- `pipelines/` permanece em revisão e não é a raiz oficial dos fluxos já migrados.
- Cada automação mantém runtime e README locais; configuração de plataforma e nomes de secrets residem em `docs/platform-config.md`.

17.1.4 Checks e segurança
- Mudanças de código usam `npm ci` e `npm run check` como rotina local; build, quando aplicável, fica para CI ou Vercel.
- Mudanças somente em `docs/**` seguem a exceção documental definida em `AGENTS.md`.
- `security.yml` mantém os checks de segurança do repositório.
- Inspeção de banco por automação é read-only, salvo mutação expressamente aprovada em contrato próprio.

17.1.5 Facilitadores de teste
- `automation-validador-final` executa o fluxo determinístico de signup, confirmação por e-mail, login, recuperação, redefinição, novo login e logout contra uma URL informada.
- `automation-niche-runtime-tests` cria e confirma contas reais, preenche `pending_setup` com nichos configurados e publica evidência sanitizada.
- Esses workflows validam E5 e E10.5.6, mas não se tornam fonte de autoridade funcional desses casos.
- A mailbox dedicada é consumida somente pelos workflows autorizados por meio de `MAILBOX_EMAIL` e `MAILBOX_PASSWORD`; valores não são versionados.

17.1.6 Pipelines operacionais
- `pipeline-supabase-inspect` executa SQL read-only com saída em logs e Job Summary.
- `pipeline-docs-apply-report` aplica report JSON em Markdown, cria branch e Pull Request e mantém revisão humana antes do merge.
- `pipeline-supabase-apply-migrations` aplica migrations versionadas após merge humano na `main`, condicionado a `SUPABASE_APPLY_MIGRATIONS_ENABLED=true`.
- Migration aplicada não é reescrita; correção ou reversão exige nova migration incremental.
- SQL Editor não faz parte do fluxo normal de alteração de schema.

17.1.7 Limites
- Automações de IA incorporadas ao produto continuam documentadas no caso funcional correspondente e no catálogo operacional, não na infraestrutura genérica da E17.
- E21 é a autoridade para catálogo, configuração, prova, ativação, rollback e custos dos workloads OpenAI.
- Não há agente autônomo, Agents SDK ou substituto ativo para o antigo fluxo Agent Builder removido.

17.2 Fundação operacional da OpenAI Platform

17.2.1 Objetivo e status
- Objetivo: manter ambientes de projeto separados para desenvolvimento e produção sem expor credenciais.
- Status: configurado na plataforma; não representa implementação de agente.

17.2.2 Registros do recorte
- Referências:
  - Configuração canônica: `docs/platform-config.md` — seção 6.1.

17.2.3 Estado atual
- Os projetos `LPF10-DEV` e `LPF10-PROD` existem na OpenAI Platform.
- O sharing conhecido está restrito aos projetos selecionados, com `LPF10-DEV` compartilhado e `LPF10-PROD` isolado.
- A Service Account de desenvolvimento pertence a `LPF10-DEV`; chaves são referenciadas somente por localização e finalidade, nunca por valor.
- Modelos e revisões efetivas dos workloads de produto são governados pela E21, não por este recorte.

17.6 Supabase STAGING — descontinuado

17.6.1 Objetivo e status
- Objetivo: registrar o encerramento do antigo espelho operacional de validação.
- Status: descontinuado; não existe projeto Supabase STAGING ativo.

17.6.2 Registros do recorte
- Referências:
  - Estado da plataforma: `docs/platform-config.md` — seção 4.2.

17.6.3 Estado atual
- O projeto `LP-Factory-10-staging` foi removido.
- Previews do app continuam usando o projeto principal conforme a configuração vigente.
- Um novo staging exigiria recorte aprovado e controles mínimos de segurança; nenhum ambiente substituto está implícito.

18. E18 — Base transversal de templates, composições e artefatos
- Objetivo: manter os contratos compartilhados de conteúdo versionado usados pela ativação comercial e a parametrização raiz da família `landing_page`, sem absorver geração, publicação ou execução da LP Builder.
- Status: base `commercial_activation` e parametrização raiz `landing_page` implementadas; consumo comercial ativo na E10.7; catálogo repo-only de módulos `landing_page` retirado pela E22.1.5.

18.1 Contrato transversal de conteúdo versionado

18.1.1 Objetivo e status
- Objetivo: separar template, composição, conteúdo validado e artefato publicado, com responsabilidades explícitas entre código e banco.
- Status: Implementado para `commercial_activation`; a família `landing_page` mantém somente o contrato raiz repo-only descrito em 18.4.

18.1.2 Registros do recorte
- Referências:
  - Contrato de banco: `docs/schema.md` — objetos de templates, composições, artefatos e pesquisas.
  - Base técnica: `docs/base-tecnica.md` — limites de runtime server-side e acesso ao Supabase.

18.1.3 Separação de responsabilidades
- Código:
  - define tipos, schemas, registry, resolução e componentes visuais;
  - rejeita versões, variantes e payloads fora do contrato;
  - exige implementação explícita para cada nova estrutura visual.
- Persistência:
  - mantém identidade e versão de templates, elegibilidade por taxon, composição ordenada e artefatos;
  - preserva a proveniência entre artefato, template, composição, taxon e pesquisas utilizadas.
- Regra: registros no banco não criam componentes ou variantes automaticamente.

18.1.4 Modelo materializado
- `content_templates` representa templates de página e módulos/seções versionados.
- `content_template_taxons` controla elegibilidade e prioridade por taxon.
- `content_template_compositions` e `content_template_composition_items` definem composição, ordem, obrigatoriedade e variante.
- `content_artifacts` separa o conteúdo final do template e da composição.
- `content_artifact_research_sources` registra as fontes estruturadas compatíveis com o artefato.
- O contrato reconhece `commercial_activation` e `landing_page`; somente `commercial_activation` possui templates, composição e renderer ativos no banco/runtime, enquanto `landing_page` mantém apenas a raiz repo-only de 18.4.

18.2 Base `commercial_activation`

18.2.1 Objetivo e status
- Objetivo: fornecer a composição versionada, o contrato de conteúdo v1, a validação server-side e o renderer usados pela ativação comercial.
- Status: Implementado e consumido pela E10.7.

18.2.2 Registros do recorte
- Banco:
  - Criados:
    - `content_template_compositions`
    - `content_template_composition_items`
    - `content_artifacts`
    - `content_artifact_research_sources`
  - Ajustados:
    - `content_templates`
    - `content_template_taxons`
    - `taxon_market_research`
- Repositório:
  - Criados:
    - `supabase/migrations/20260615190000_e18_commercial_activation_minimum.sql`
    - `supabase/migrations/20260616142000_e18_commercial_activation_base_records.sql`
    - `supabase/snippets/e18_commercial_activation_minimum_verify.sql`
    - `supabase/snippets/e18_commercial_activation_base_records_verify.sql`
    - `lib/conversion-content/contracts.ts`
    - `lib/conversion-content/validation.ts`
    - `lib/conversion-content/adapters/commercialActivationAdapter.ts`
    - `lib/conversion-content/commercial-activation/`
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `package.json`
    - `package-lock.json`
- Referências:
  - Contrato de banco e RLS: `docs/schema.md`.

18.2.3 Contrato e resolução
- O contrato v1 aceita uma lista de seções ligada aos itens UUID da composição.
- O resolver valida o envelope, a correspondência entre item, módulo e variante e a obrigatoriedade de cada seção.
- Itens obrigatórios ausentes ou inválidos invalidam o modelo; item opcional inválido é omitido com aviso seguro.
- A saída pronta é ordenada por `sortOrder` e entregue ao `CommercialActivationRenderer`.
- Hrefs aceitam somente caminho interno iniciado por uma barra ou URL HTTPS válida.

18.2.4 Catálogo ativo
- O registry fechado contém oito variantes transversais:
  - `hero.default`
  - `benefits.cards`
  - `services.list`
  - `plans.cards`
  - `differentials.cards`
  - `how_it_works.steps`
  - `faq.accordion`
  - `final_cta.simple`
- A base do banco contém um template de página e os oito módulos de seção, todos na versão 1.
- Variantes representam comportamento estrutural ou visual; especialização de nicho pertence ao conteúdo e à composição, não à chave da variante.

18.2.5 Segurança e limites
- A leitura e validação do bundle ocorrem no servidor.
- `service_role` possui a leitura necessária; `anon` e `authenticated` não recebem leitura direta das tabelas de conteúdo.
- O vínculo com taxon, a geração de draft, a publicação transacional, a resolução hierárquica e o tracking pertencem à E10.7.
- Não há criação dinâmica de componentes pelo banco, editor visual, teste A/B ou infraestrutura multicanal neste recorte.

18.3 Consumo pela E10.7

18.3.1 Objetivo e status
- Objetivo: delimitar a integração entre a infraestrutura `commercial_activation` e a página comercial personalizada.
- Status: Integração ativa; a E18 fornece contratos, composição e renderer, enquanto a E10.7 governa conteúdo e operação por taxon.

18.3.2 Registros do recorte
- Referências:
  - Jornada e operação comercial: `docs/roadmap.md` — seção 10.7.
  - Contrato de banco: `docs/schema.md` — artefatos de conteúdo e fontes de pesquisa.

18.3.3 Limite de responsabilidade
- A E10.7 seleciona o taxon, resolve a composição e o artefato publicados, aplica a hierarquia de fallback e renderiza o bundle validado.
- Geração assistida, revisão administrativa, publicação, proveniência e tracking permanecem na E10.7.
- `research_version = 1` e `audience_scope = business_buyer` compõem o contrato atual do artefato comercial.
- `content_artifact_research_sources` recebe fontes compatíveis com `business_buyer`; contexto adicional de pesquisa é preservado em `provenance_json`.
- A E10.6 continua como fallback comercial genérico.
- A antiga infraestrutura da LP Builder foi retirada; E19 permanece apenas como registro do legado físico inerte.

18.4 Parametrização raiz da família `landing_page`

18.4.1 Objetivo e status
- Objetivo: manter um contrato raiz versionado para parâmetros editoriais, visuais e responsivos comuns da família `landing_page`.
- Status: Implementado no repositório como versão 1 com ciclo de vida `hypothesis`; ainda não validado por uma LP real.

18.4.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/conversion-content/landing-page/contracts.ts`
    - `lib/conversion-content/landing-page/index.ts`
    - `lib/conversion-content/landing-page/root-registry.ts`
    - `lib/conversion-content/landing-page/root-resolver.ts`
    - `lib/conversion-content/landing-page/root-schema.ts`
    - `lib/conversion-content/landing-page/root-validation-cases.ts`
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `package.json`
- Referências:
  - Consumo administrativo dos parâmetros: `docs/roadmap.md` — seção 12.6.
  - Entradas da LP: `docs/roadmap.md` — seção 20.2.

18.4.3 Registry, resolução e validação
- O registry imutável é a fonte canônica da versão 1 e mantém `balanced` como preset padrão, além de `compact`.
- A resolução exige uma versão registrada, valida o contrato com schema estrito e não aplica fallback implícito.
- Versão desconhecida, preset desconhecido ou contrato inválido retornam erro fechado.
- A saída resolvida inclui o preset efetivo e é congelada para impedir mutação acidental.
- Casos executáveis próprios cobrem o contrato raiz.

18.4.4 Parâmetros mantidos
- Papéis semânticos possuem faixas recomendadas e limites absolutos de texto.
- As opções de espaçamento são `compact`, `default` e `spacious`.
- Papéis visuais são abstratos e não carregam markup, classes ou instruções de renderer.
- Critérios v1 incluem abordagem mobile-first, viewports de evidência, ausência de truncamento e scroll horizontal por texto, alvos mínimos de interação, hierarquia semântica e foco visível.
- Alteração incompatível ou ampliação de limite absoluto exige nova versão raiz.

18.4.5 Limites do recorte
- A raiz não define catálogo de módulos, composição, renderização, persistência ou lifecycle da LP.
- A E20.2 mantém o catálogo de entradas; materialização, revisão, Preview e publicação não possuem produto operacional vigente na E19.
- O Admin apenas expõe os parâmetros e entradas vigentes; isso não promove o ciclo de vida `hypothesis`.
- A implementação anterior de composição/renderização `landing_page` e o catálogo histórico de módulos não fazem parte do boundary atual.

18.5 Catálogo de módulos e variantes `landing_page` — retirado

18.5.1 Objetivo e status
- Objetivo: registrar o destino do antigo catálogo repo-only de módulos e variantes da família `landing_page`.
- Status: retirado pela E22.1.5; não há substituto nem consumidor no caminho canônico.

18.5.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `package.json`
  - Excluídos:
    - `lib/conversion-content/landing-page/module-catalog/`
- Referências:
  - Retirada controlada e consumidores podados: `docs/roadmap.md` — seção 22.1.5.

18.5.3 Estado vigente
- O boundary, seus exports e seu validator foram removidos.
- A E18.4 e a E20.2 permanecem independentes e preservadas.
- O antigo caminho E19.3 → E19.4 foi retirado e não dependia deste catálogo.

19. E19 — legado operacional de Landing Pages retirado
- Objetivo vigente: registrar o estado físico residual do antigo produto de Landing Pages sem reintroduzir consumidor ou compatibilidade de runtime.
- Status: produto, geração, `lib/lp-builder/`, apresentação, compatibilidade com E20.2 e escrita prospectiva de custos foram retirados. Nenhuma nova arquitetura greenfield é antecipada.

19.1 Fronteiras retiradas
- `lib/lp-builder/` e `lib/conversion-content/landing-page/presentation/` não existem mais no boundary vigente.
- Os workloads `landing_page_draft_generation` e `landing_page_draft_image_generation`, suas provas administrativas e branches exclusivas de image workload foram removidos.
- O catálogo independente de modelos de imagem permanece disponível para governança de modelos, sem implicar workload de imagem ativo.
- E20.2, E20.5, E20.6 e E20.7 permanecem capacidades independentes e não dependem de compatibilidade E19.

19.2 Account Dashboard
- Contas ativas seguem a experiência comercial preservada, sem desvio por estado de configuração, LP ou revisão.
- Owner sem entitlement mantém as ações financeiras aplicáveis; demais papéis sem entitlement mantêm o estado de espera.
- Não existem rotas substitutas para detail, configuração, histórico, Preview ou aprovação do produto retirado.

19.3 Estado físico residual
- Tabelas, RPCs, migrations, ponteiro de aprovação, dados históricos e o bucket `landing-page-revision-assets` permanecem no estado físico descrito em `docs/schema.md`, sem limpeza destrutiva.
- As residências antigas de conta, configuração, revisão e materialização não participam mais do lifecycle E20.2 nem do runtime do produto.
- Os objetos físicos e registros históricos não possuem consumidor no runtime do produto e são resíduos inertes; sua eventual remoção exige recorte próprio.
- `E19_5_WORKSPACE_ENABLED` não possui consumidor no código e permanece apenas como variável hospedada inativa, sem alteração de plataforma neste recorte.

19.4 Histórico
- O detalhe da arquitetura abandonada permanece recuperável pelos PRs e pelo histórico Git; a documentação canônica não a mantém como obrigação vigente.
- PR #871 tornou a geração antiga inalcançável, PR #872 retirou sua orquestração, o SV-PR03 retirou o produto operacional e o SV-PR04 eliminou as duas fronteiras administrativas residuais.
20. E20 — Preparação e liberação de taxons para geração de landing pages
- Objetivo: manter o catálogo versionado de entradas, a pesquisa integral selecionada, a avaliação de suficiência e a resolução de conhecimento que autorizam o contexto factual da LP.
- Status: catálogo E20.2 v6 vigente; perfil E20.3 retirado; seleção E20.5 e preparação determinística E20.6 operacionais; resolver E20.7 implementado e preservado como capacidade independente, sem consumidor E19 vigente.

20.2 Catálogo de entradas por taxon

20.2.1 Objetivo e status
- Objetivo: definir e resolver declarativamente quais valores uma LP exige por versão, taxon e plano, sem misturar valores concretos, entitlement ou geração.
- Status: Versões v1–v6 publicadas e imutáveis no repositório; `CURRENT_LANDING_PAGE_INPUT_CATALOG_VERSION = 6`.

20.2.2 Registros do recorte
- Banco:
  - Criados:
    - `landing_page_input_catalog_drafts`
  - Ajustados:
    - `save_account_landing_page_configuration_v1`
    - `append_account_landing_page_materialization_v2`
- Repositório:
  - Criados:
    - `lib/conversion-content/landing-page/input-catalog/contracts.ts`
    - `lib/conversion-content/landing-page/input-catalog/registry.ts`
    - `lib/conversion-content/landing-page/input-catalog/schema.ts`
    - `lib/conversion-content/landing-page/input-catalog/resolver.ts`
    - `lib/conversion-content/landing-page/input-catalog/lifecycle.ts`
    - `lib/conversion-content/landing-page/input-catalog/draft.ts`
    - `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`
    - `lib/conversion-content/landing-page/input-catalog/index.ts`
    - `lib/admin/adapters/adminInputCatalogLifecycleAdapter.ts`
    - `lib/admin/adapters/adminInputCatalogLifecycleContext.ts`
    - `lib/lp-builder/operationalCompatibility.ts`
    - `app/admin/(protected)/estrutura-lp/_components/AdminInputCatalogLifecycle.tsx`
    - `supabase/migrations/20260824180000_e20_2_8_input_catalog_lifecycle.sql`
    - `supabase/migrations/20260829211349_e19_5_append_catalog_v6.sql`
    - `supabase/tests/e20_2_8_input_catalog_lifecycle.test.sql`
    - `supabase/snippets/e20_2_8_input_catalog_lifecycle_verify.sql`
  - Ajustados:
    - `app/admin/(protected)/estrutura-lp/page.tsx`
    - `app/a/[account]/_components/OnboardingConfigurationJourney.tsx`
    - `app/a/[account]/_components/onboarding-journey-validation-cases.ts`
    - `lib/lp-builder/onboardingConfiguration.ts`
    - `lib/lp-builder/landingPageWorkspace.ts`
    - `lib/lp-builder/generationContext.ts`
    - `package.json`
    - `package-lock.json`
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — seção 3.15.4.
  - Draft administrativo e RPCs: `docs/schema.md`.

20.2.3 Registry e resolução
- O registry repo-only é a autoridade exclusiva das versões publicadas e da versão atual.
- O resolver exige versão explícita e cadeia taxonômica válida; não usa `latest`, maior chave ou fallback implícito.
- A herança segue `universal → segmento → nicho → ultranicho`, com ordem e proveniência determinísticas.
- Resolução preserva plano, taxon atendido, camadas aplicadas, definição, obrigação, condições, validação, evidência e política de substituição.
- Strings vazias, shapes desconhecidos, relações inválidas entre planos, condições incoerentes ou especialização não autorizada falham fechado.
- Starter, Lite, Pro e Ultra usam o mesmo contrato de fields no recorte atual; entitlement continua fora da E20.2.

20.2.4 Evolução v1–v6
- v1 preserva os 19 fields originais.
- v2 acrescenta oferta principal, descrição factual, referência opaca opcional de asset e paleta visual de cinco papéis.
- v3 acrescenta metadata declarativa de capabilities sem alterar os valores.
- v4 acrescenta `rent` ao `transaction_intent`.
- v5 acrescenta `business_offerings_summary` opcional e `primary_conversion_goal` obrigatório.
- v6 retira da resolução corrente `primary_service_or_offer` e sua descrição e introduz `landing_page_offering_scope` e `landing_page_offering_scope_description`.
- Versões anteriores permanecem resolvíveis para configurações e snapshots históricos; evolução funcional exige nova versão.

20.2.5 Escopo comercial v6
- `landing_page_offering_scope` aceita:
  - `single`: exatamente uma oferta;
  - `multiple`: duas ou mais ofertas;
  - `portfolio`: uma ou mais ofertas com declaração humana de portfólio.
- Ofertas são entrada factual livre, sem catálogo, whitelist ou derivação de `business_offerings_summary`.
- O parser aplica trim, rejeita vazio e duplicidade case-insensitive e mantém igualdade material canônica.
- A UI deriva `single` ou `multiple` pela quantidade de ofertas; somente `portfolio` exige confirmação explícita.
- Erro corrigível preserva valores e revisões submetidos, direciona foco ao controle afetado e não escreve.
- O núcleo de identidade comercial é `funnel_stage`, `transaction_intent` quando aplicável e `landing_page_offering_scope`; `primary_conversion_goal` permanece estratégia obrigatória, não identidade.
- Compatibilidade v5→v6 projeta os fields singulares somente em memória e não reescreve snapshots ou residências históricas.

20.2.6 Versão revisada e versão efetiva
- `R` é a última versão com decisão humana explícita de suficiência; `C` é a versão efetivamente autorizada para consumo.
- `C` acompanha a versão atual quando `R = C` ou quando a transição é classificada deterministicamente como `no_material_change` ou `compatible_evolution`.
- Remoção, restrição, reinterpretação ou ambiguidade produz `review_required`.
- O lifecycle administrativo de compatibilidade usa o mesmo `C`; o produto E19.2/E19.5 e sua geração foram retirados e não são consumidores vigentes.
- O taxon piloto está reconciliado em `R=6`, o draft v6 foi removido após leitura final positiva e a v6 é a versão efetiva vigente.

20.2.7 Lifecycle administrativo
- Pode existir somente um próximo draft, mutável, service-only e não operacional.
- Editar o draft torna stale qualquer evidência dependente; versões publicadas não são copiadas para o banco.
- Publicar exige congelar conteúdo e fingerprints, materializar a nova versão no registry, validar, revisar, mergear, implantar em Production e reconciliar a identidade exata.
- O gate pré-publicação valida estrutura, fingerprints E20 e evidência humana por taxon, com paginação e cardinalidade exatas, sem depender de conta, entitlement, configuração ou LP E19.
- Evidência válida pode avançar o marcador do respectivo taxon; evidência ausente, inválida ou stale não avança esse marcador e mantém o taxon fail-closed em E20.6.
- A reconciliação não possui blocker global de operacionalidade ou de “taxons preparados”; `no_material_change`, `compatible_evolution` e `review_required` continuam sendo classificados por taxon.
- O Admin usa `/admin/estrutura-lp?view=entradas`; avaliação individual de suficiência permanece na Taxonomia.
- Não há rollback de catálogo, múltiplos drafts, targeting por taxon, job, fila ou agente.

20.3 Perfil de orientação para geração — retirado

20.3.1 Objetivo e status
- Objetivo: registrar o destino do antigo perfil versionado de orientação à geração.
- Status: retirado pela E22.1.4; não existe substituto.

20.3.2 Registros do recorte
- Repositório:
  - Excluídos:
    - `lib/conversion-content/landing-page/generation-profile/`
    - `lib/conversion-content/adapters/landingPageGenerationProfileAdapter.ts`
    - `app/admin/(protected)/perfis-de-orientacao/`
- Banco:
  - Excluídos:
    - `public.landing_page_generation_profiles`
    - `public.landing_page_generation_profile_items`
    - `public.save_landing_page_generation_profile_draft`
    - `public.activate_landing_page_generation_profile`
    - `public.archive_landing_page_generation_profile`
    - `public.get_landing_page_generation_profile_lifecycle_status`
- Referências:
  - Retirada controlada: `docs/roadmap.md` — seção 22.1.4.

20.3.3 Estado vigente
- Código, superfícies administrativas, workload e validators do perfil foram removidos.
- A migration forward-only de retirada preserva migrations históricas, pesquisas estruturadas e `audit_logs`.
- E18.4, E20.2 e o fluxo E19 não dependem deste domínio.

20.5 Seleção da pesquisa integral `end_customer` por taxon

20.5.1 Objetivo e status
- Objetivo: permitir que um taxon ativo selecione explicitamente uma versão integral de pesquisa `end_customer` e disponibilizá-la por boundary server-side.
- Status: Implementado e ativo em Production; o taxon piloto mantém a pesquisa `end_customer` v1 selecionada.

20.5.2 Registros do recorte
- Banco:
  - Ajustados:
    - `business_taxons.selected_end_customer_research_version`
- Repositório:
  - Criados:
    - `lib/conversion-content/landing-page/taxon-preparation/contracts.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/research.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/index.ts`
    - `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`
    - `components/admin/AdminTaxonResearchSelectionForm.tsx`
    - `supabase/migrations/20260814174500_e20_5_selected_end_customer_research_version.sql`
    - `supabase/snippets/e20_5_selected_end_customer_research_version_verify.sql`
  - Ajustados:
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    - `app/admin/(protected)/taxonomia/actions.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `next.config.js`
    - `package.json`
- Referências:
  - Contrato de banco: `docs/schema.md` — `business_taxons`.
  - Gate operacional: `docs/platform-config.md` — `E20_5_SELECTED_RESEARCH_ENABLED`.

20.5.3 Pesquisa repo-only
- O boundary deriva o path canônico da versão `end_customer` e confina a leitura a `docs/pesquisas-brutas/`.
- O runtime lê o filesystem do artefato implantado e não consulta a API do GitHub.
- Conteúdo é preservado integralmente e deve conter metadata única e coerente de taxon, slug, audiência e versão.
- Path inválido, arquivo ausente, metadata incompatível ou conteúdo vazio falham sem payload parcial.
- A pesquisa é contexto consultivo; não substitui fatos autorizados pelo catálogo E20.2.

20.5.4 Seleção e consumo
- A Server Action exige `platform_admin`, valida a candidata repo-only e atualiza somente a coluna de seleção do taxon ativo.
- `E20_5_SELECTED_RESEARCH_ENABLED` bloqueia UI, leitura e mutação antes do acesso à coluna.
- A leitura server-side distingue taxon ausente/inativo, seleção ausente, versão inválida, falha de banco e falha do arquivo.
- Somente sucesso retorna taxon, slug, versão e conteúdo integral com `selectedResearchValid: true`.
- Nenhum estado `prepared` é persistido; preparação é derivada pela E20.6.

20.6 Avaliação de suficiência e preparação do taxon

20.6.1 Objetivo e status
- Objetivo: verificar se a pesquisa selecionada cobre os fatos exigidos pelo catálogo efetivo e derivar a preparação sem criar estado paralelo de prontidão.
- Status: Preparação determinística operacional com `R=6` no taxon piloto. O provider administrativo da E20.6.5 está implementado e possui configuração operacional revisão 2, mas seu gate, redeploy e QA final não estão comprovados como concluídos.

20.6.2 Registros do recorte
- Banco:
  - Ajustados:
    - `business_taxons.reviewed_input_catalog_version`
    - `public.openai_workload_operational_configurations`
    - `public.openai_workload_configuration_revisions`
    - `public.openai_workload_configuration_activations`
- Repositório:
  - Criados:
    - `lib/conversion-content/landing-page/taxon-preparation/input-catalog-review.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation-schema.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/preparation.ts`
    - `lib/conversion-content/adapters/inputCatalogEvaluationRuntimeGate.ts`
    - `lib/conversion-content/adapters/inputCatalogEvaluationRuntimeGateCore.ts`
    - `lib/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter.ts`
    - `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogEvaluation.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogReview.tsx`
    - `supabase/migrations/20260815172449_e20_6_reviewed_input_catalog_version.sql`
    - `supabase/migrations/20260820213900_e21_2_taxon_input_catalog_sufficiency_workload.sql`
    - `supabase/snippets/e20_6_reviewed_input_catalog_version_verify.sql`
    - `supabase/snippets/e21_2_taxon_input_catalog_sufficiency_workload_verify.sql`
    - `supabase/tests/e21_2_taxon_input_catalog_sufficiency_workload.test.sql`
  - Ajustados:
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    - `app/admin/(protected)/taxonomia/actions.ts`
    - `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/contracts.ts`
    - `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`
    - `lib/openai-workloads/registry.ts`
    - `package.json`
- Referências:
  - Preparação factual: `docs/base-tecnica.md` — seção 3.15.7.
  - Contrato de banco: `docs/schema.md`.
  - Gates e workloads: `docs/platform-config.md`.

20.6.3 Predicado determinístico
- A preparação exige taxon ativo, pesquisa E20.5 selecionada e válida e versão revisada compatível com a versão executável requerida.
- `deriveTaxonPreparationForVersion` exige igualdade exata entre revisão e versão requerida.
- `deriveEffectiveTaxonPreparation` permite carry-forward até a versão atual somente para transição sem mudança material ou compatível.
- Versão ausente, posterior à atual, não executável ou transição que exige revisão falha fechado.
- O resultado inclui pesquisa integral, `reviewedInputCatalogVersion`, `effectiveInputCatalogVersion` e classificação da transição.
- O predicado é derivado em leitura e não persiste `prepared`.

20.6.4 Decisão humana
- A avaliação compara a pesquisa integral com a versão E20.2 escolhida explicitamente nos quatro planos.
- O resultado assistido pode ser `sufficient`, `candidate_gaps` ou inconclusivo; a IA não decide a gravação.
- Somente decisão administrativa explícita registra `reviewed_input_catalog_version`.
- Mudança efetiva da pesquisa ou da identidade taxonômica invalida a avaliação aplicável.
- Gaps factuais retornam à E20.2 e exigem nova avaliação após a evolução.

20.6.5 Provider administrativo
- O workload `taxon_input_catalog_sufficiency_evaluation` usa o lifecycle compartilhado da E21 e não possui configuração paralela.
- Preview e Production recusam `repo_catalog` e bootstrap revisão 1; runtime gate-on exige `supabase_operational` revisão 2 ou posterior.
- `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` separa o rollout desse provider do gate geral `OPENAI_OPERATIONAL_CONFIG_ENABLED`.
- `ROLLOUT_GATE_OFF` preserva o handoff humano legado; `OPERATIONAL_CONFIGURATION_UNPROVEN` bloqueia runtime e legado sem escrita ou fallback.
- A configuração operacional revisão 2 está ativa nos dois ambientes, mas a documentação canônica ainda não comprova o valor do gate específico, redeploy, QA hospedado ou contract final.
- Até essa comprovação, a E20.6.5 não deve ser declarada operacionalmente encerrada.

20.7 Resolução de conhecimento para geração

20.7.1 Objetivo e status
- Objetivo: selecionar a fonte de conhecimento de mercado mais específica e segura para o escopo comercial da LP, sem alterar fatos E20.2 ou identidade da oferta.
- Status: Resolver determinístico e complemento dinâmico implementados e preservados como capacidade independente; a integração consumidora da E19 foi retirada.

20.7.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.openai_workload_operational_configurations`
    - `public.openai_workload_configuration_revisions`
    - `public.openai_workload_configuration_activations`
- Repositório:
  - Criados:
    - `lib/conversion-content/landing-page/knowledge-resolution/`
    - `lib/conversion-content/adapters/knowledgeResolutionAdapter.ts`
    - `lib/conversion-content/adapters/dynamicMarketResearchOpenAiAdapter.ts`
    - `supabase/migrations/20260829171107_e20_7_4_dynamic_market_research_workload.sql`
  - Ajustados:
    - `lib/conversion-content/index.ts`
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/registry.ts`
    - `app/admin/(protected)/workloads-openai/actions.ts`
    - `package.json`
    - `package-lock.json`
- Referências:
  - Resolução e complemento: `docs/base-tecnica.md` — seções 3.15.10 e 3.15.11.
  - Integração e contenção: `docs/roadmap.md` — seção 19.3.
  - Configuração OpenAI: `docs/platform-config.md`.

20.7.3 Resolver determinístico
- A entrada `landing_page_offering_scope` preserva `single | multiple | portfolio`; shape inválido falha fechado.
- `portfolio` usa `base_only`; `multiple` exige `dynamic_required`.
- Para `single`, o resolver faz matching apenas entre descendentes ativos do taxon servido.
- `specialized_deep` exige um único match de alta confiança por nome/alias autorizado, pesquisa especializada preparada e equivalência factual conservadora do catálogo.
- Match fraco, ambíguo, não preparado ou materialmente diferente produz `dynamic_required` sem recusar nem invalidar a oferta.
- Falha operacional permanece distinta de ausência legítima de match.
- A saída é tipada e imutável e não possui persistência própria.

20.7.4 Complemento dinâmico
- Somente `dynamic_required` pode acionar o workload.
- O transporte é uma única requisição foreground à Responses API com Web Search hospedado obrigatório, uma ou duas buscas e Structured Output estrito.
- O orçamento reserva busca, reasoning e saída antes do transporte; não trunca a entrada para caber.
- Findings materiais exigem fontes HTTPS realmente retornadas pelo provider; URL inventada, resposta incompleta ou evidência insuficiente falha tecnicamente.
- Não há agente, retry, fallback técnico, job, fila, RAG, cache global ou residência de pesquisa.
- O resultado completa a base como `base_plus_dynamic` ou preserva `base_only`; não cria fatos de negócio nem invalida a oferta.

20.7.5 Consumo e estado operacional
- O boundary E20.7, seus adapters e validadores permanecem disponíveis sem integração com o LP Builder.
- Configuração, pesquisas e evidências históricas foram preservadas; nenhuma nova revisão de Landing Page é produzida por esse workload.
- A eventual adoção por um novo consumidor exige diagnóstico, recorte e gates próprios, sem reutilizar implicitamente a integração retirada.

21. E21 — Gestão e governança dos workloads OpenAI
- Objetivo: manter uma autoridade única para identidade, configuração, execução observável e custo dos workloads OpenAI usados pelo produto, com operação administrativa segura e sem otimização autônoma.
- Status: fundação e inventário vigentes; configuração operacional dinâmica e catálogo administrativo ativos; avaliação comparativa E21.3 pausada; visibilidade financeira preserva o total oficial e a série histórica congelada de Landing Pages. A pesquisa dinâmica permanece sem consumidor no fluxo de Landing Page.

21.1 Fundação, normalização e leitura dos workloads OpenAI

21.1.1 Objetivo e status
- Objetivo: centralizar identidades, modalidades, baselines locais, resolução e telemetria segura dos workloads OpenAI, mantendo prompts, schemas e regras funcionais nos domínios consumidores.
- Status: implementada e vigente. O catálogo estrutural contém quatro workloads textuais de produto mais a referência operacional read-only do Supabase Inspect; não há workload de imagem ativo.

21.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/resolve.ts`
    - `lib/openai-workloads/observability.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `lib/openai-workloads/index.ts`
    - `app/admin/(protected)/workloads-openai/page.tsx`
  - Ajustados:
    - `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
    - `lib/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter.ts`
    - `lib/conversion-content/adapters/dynamicMarketResearchOpenAiAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftImageGenerationAdapter.ts`
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `components/admin/adminNavigation.ts`
    - `package.json`
- Referências:
  - Boundary técnico: `docs/base-tecnica.md` — seção 3.16.
  - Configuração e credenciais: `docs/platform-config.md` — seções 3.5 e 6.3.

21.1.3 Catálogo estrutural e resolução explícita
- O registry interno, repo-only e imutável mantém identidade, apresentação, modalidade, consumidor, fallback e baseline local de cada workload.
- Os workloads de produto vigentes são:
  - `niche_resolution`;
  - `commercial_activation_draft_generation`;
  - `taxon_input_catalog_sufficiency_evaluation`;
  - `landing_page_dynamic_market_research`.
- `supabase_inspect` permanece referência operacional externa, sem ser aceito pelo resolver de produto.
- O resolver de workloads de produto aceita somente `responses_text` e rejeita identidade, modalidade ou ambiente desconhecidos; a modalidade de imagem permanece apenas no catálogo independente de modelos.
- Development usa o baseline versionado no repositório. Preview e Production podem resolver a revisão ativa do Supabase pelo gate operacional da E21.2, sem fallback silencioso quando esse gate está ligado.
- Modelo, esforço, qualidade e política de Web Search pertencem à configuração; prompts, Structured Outputs, limites funcionais, persistência e fallbacks continuam nos boundaries consumidores.

21.1.4 Integração e observabilidade comum
- Os workloads com consumidor vigente consomem a resolução pública antes do transporte e preservam configuração, revisão e origem na proveniência ou no evento operacional aplicável.
- Eventos dos workloads vigentes registram somente identidade, configuração efetiva, resultado, categoria segura de falha, latência, IDs técnicos e usage disponível.
- Prompt, resposta integral, payload de negócio, pesquisa, fatos, PII, secrets e credenciais não integram a telemetria.
- Métrica ausente permanece `null`; não há estimativa monetária transversal nem preenchimento inventado.
- O workload de pesquisa dinâmica acrescenta contagem de chamadas e fontes Web Search quando disponíveis. Seu boundary e prova administrativa permanecem no repositório, sem consumidor no fluxo de Landing Page.
- Variáveis legadas de seleção de modelo não são consumidas pelos workloads ativos.

21.1.5 Inventário administrativo
- A rota protegida `/admin/workloads-openai` projeta os cinco itens vigentes do registry para `platform_admin`.
- Os quatro workloads de produto exibem modalidade, configuração, origem, revisão, consumidor e fallback; o Supabase Inspect permanece diferenciado como referência não verificada nessa superfície.
- A leitura não consulta OpenAI, GitHub ou Vercel em runtime e não expõe secrets, prompts, respostas ou payloads funcionais.
- O inventário é a entrada para a gestão operacional da E21.2, sem duplicar registry ou resolver no Admin.

21.2 Configuração operacional dinâmica dos workloads OpenAI

21.2.1 Objetivo e status
- Objetivo: administrar configuração por `ambiente + workload` com candidata, prova, promoção, ativação e rollback humano, permitindo mudanças ordinárias em Preview e Production sem novo deploy de código.
- Status: implementada e ativa. Preview e Production usam `supabase_operational`; Development permanece em `repo_catalog`. A leitura corrente seleciona por allowlist as oito unidades vigentes — quatro workloads de produto em cada ambiente — e ignora quatro unidades históricas sem criar compatibilizador legado.

21.2.2 Registros do recorte
- Banco:
  - Criados:
    - `public.openai_workload_operational_configurations`
    - `public.openai_workload_configuration_revisions`
    - `public.openai_workload_configuration_activations`
    - `public.save_openai_workload_configuration_candidate_v1`
    - `public.discard_openai_workload_configuration_candidate_v1`
    - `public.promote_openai_workload_configuration_candidate_v1`
    - `public.activate_openai_workload_configuration_revision_v1`
    - `public.rollback_openai_workload_configuration_revision_v1`
    - `public.prevent_openai_workload_append_only_mutation_v1`
    - `public.openai_model_catalog_models`
    - `public.openai_model_catalog_parameters`
    - `public.prevent_openai_model_catalog_delete_v1`
    - `public.assert_openai_model_catalog_model_has_parameter_v1`
    - `public.add_openai_model_catalog_model_v1`
    - `public.set_openai_model_catalog_model_availability_v1`
    - `public.set_openai_model_catalog_parameter_availability_v1`
    - `public.check_openai_model_catalog_configuration_available_v1`
    - `public.raise_postgrest_safe_conflict_v1(text)`
- Repositório:
  - Criados:
    - `lib/openai-workloads/adapters/operationalConfigurationAdapter.ts`
    - `lib/openai-workloads/adapters/operationalConfigurationAdapterCore.ts`
    - `lib/openai-workloads/adapters/modelCatalogAdapter.ts`
    - `lib/openai-workloads/adapters/modelCatalogAdapterCore.ts`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiConfigurationManager.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiModelCatalogManager.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiWorkloadDetail.tsx`
    - `app/admin/(protected)/workloads-openai/_proof.ts`
    - `app/admin/(protected)/workloads-openai/actions.ts`
    - `app/admin/(protected)/workloads-openai/catalogActions.ts`
    - `app/admin/(protected)/workloads-openai/commercialProof.ts`
    - `app/admin/(protected)/workloads-openai/dynamicResearchProof.ts`
    - `app/admin/(protected)/workloads-openai/proofCore.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.tsx`
    - `supabase/migrations/20260820190422_e21_2_3_openai_workload_operational_configurations.sql`
    - `supabase/migrations/20260823144334_e21_2_5_openai_model_catalog.sql`
    - `supabase/migrations/20260827203000_postgrest_safe_application_conflicts.sql`
    - `supabase/snippets/e21_2_3_openai_workload_operational_configurations_verify.sql`
    - `supabase/snippets/e21_2_5_openai_model_catalog_verify.sql`
    - `supabase/snippets/postgrest_safe_application_conflicts_verify.sql`
    - `supabase/tests/e21_2_3_openai_workload_operational_configurations.test.sql`
    - `supabase/tests/e21_2_5_openai_model_catalog.test.sql`
    - `supabase/tests/postgrest_safe_application_conflicts.test.sql`
  - Ajustados:
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/index.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/resolve.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `app/admin/(protected)/workloads-openai/page.tsx`
    - `lib/access/guards.ts`
    - `lib/supabase/service.ts`
    - `package.json`
- Referências:
  - Boundary técnico: `docs/base-tecnica.md` — seções 3.12 e 3.16.
  - Configuração efetiva e gates: `docs/platform-config.md` — seções 3.5 e 6.3.
  - Contrato de banco: `docs/schema.md` — configuração, revisões, ativações e catálogo OpenAI.

21.2.3 Fonte operacional e resolução por ambiente
- O agregado separa configuração ativa, candidata, revisões validadas e ativações append-only por ambiente e workload.
- Preview e Production consultam exclusivamente o Supabase quando `OPENAI_OPERATIONAL_CONFIG_ENABLED=true`; erro, ausência ou estado parcial bloqueia a execução e não retorna ao baseline local.
- Development ignora o gate e usa o registry repo-side para manter execução local determinística.
- A configuração dinâmica altera apenas os parâmetros permitidos pela modalidade: `model + reasoning effort` para texto e `model + quality` para imagem.
- Política Web Search, tamanho, formato, compressão, moderação, prompts, schemas e timeouts permanecem code-owned quando não pertencem à unidade administrável.
- O runtime não usa cache, Realtime, segunda residência ou resolução paralela.

21.2.4 Lifecycle administrativo e estado operacional
- Cada Server Action reautoriza `platform_admin`, deriva o ator no servidor e valida ambiente, workload, versão, revisão e shape antes de qualquer mutação.
- A candidata pode ser salva ou descartada; prova bem-sucedida permite promoção; ativação e rollback sempre exigem ação humana e preservam histórico.
- Falha na prova mantém a candidata e não altera a revisão ativa. Conflito de versão permanece rejeição funcional, sem retry autônomo.
- As revisões ativas dos workloads comuns continuam operacionais em Preview e Production. A avaliação de suficiência do catálogo está em revisão comprovada 2 nos dois ambientes, embora seu gate funcional próprio ainda não esteja comprovado como liberado.
- A pesquisa dinâmica foi provada e ativada no lifecycle, mas sua integração E19 foi retirada. Configuração operacional, banco e histórico de IA permaneceram intactos.
- Configuração ativa não equivale a consumidor de produto vigente; uma nova integração depende de recorte e validação próprios, sem alterar automaticamente o lifecycle E21.2.

21.2.5 Catálogo administrável e UX
- O catálogo global controla quais combinações podem originar novas candidatas; save, prova e promoção revalidam a elegibilidade corrente.
- Indisponibilidade do catálogo bloqueia novas candidatas e promoções, mas não invalida revisões já ativas nem impede rollback para revisão histórica válida.
- Modelos e parâmetros ficam separados por modalidade e podem ser disponibilizados ou retirados da seleção sem apagar o histórico.
- A superfície administrativa combina catálogo, seletor Preview/Production, lista compacta e detalhe expandido. O catálogo de modelos preserva suporte independente à modalidade de imagem, ainda que não exista workload de imagem vigente.
- Leituras são completas, ordenadas e fail-closed; paginação parcial ou resposta inválida não produz estado administrativo utilizável.
- O papel sem `platform_admin` não recebe catálogo, configuração, provas ou controles de mutação.

21.3 Evidências e avaliação de custo-benefício

21.3.1 Objetivo e status
- Objetivo: comparar configurações por workload com evidência reproduzível de qualidade, validade, correção humana, usage, latência, custo e estabilidade.
- Status: pausada e sem implementação incorporada ao produto. Não existe laboratório, banco, rota ou decisão automática de baseline em operação; qualquer retomada depende de nova decisão humana e de revalidação contra o estado vigente.

21.3.2 Registros do recorte
- Referências:
  - Critérios e snapshots decisórios: `docs/openai-model-snapshot.md`.
  - Contratos de telemetria e configuração: `docs/base-tecnica.md` — seção 3.16.

21.3.3 Condições de retomada
- A unidade textual de comparação deve ser `workload + modelo + reasoning effort`; imagem mantém configuração e métricas próprias.
- A avaliação deve reutilizar a observabilidade segura da E21.1 e considerar, quando disponíveis, resultado válido, qualidade, correção humana, tokens, latência, custo e estabilidade.
- Não definir vencedor ou baseline universal sem amostra representativa e aceite humano.
- Não criar banco, dashboard, job, agente, engine de otimização ou troca automática enquanto o recorte permanecer pausado.

21.4 Visibilidade financeira e histórico de custos OpenAI

21.4.1 Objetivo e status
- Objetivo: apresentar ao `platform_admin` o gasto oficial total da organização OpenAI e a série interna congelada dos antigos workloads de Landing Pages, com diferença explícita em Outros gastos / reconciliação.
- Status: leitura implementada e operacional em Production. A Costs API é a autoridade do total atual; o histórico interno não recebe novos eventos após a retirada do write-side prospectivo.

21.4.2 Registros do recorte
- Banco:
  - Criados:
    - `public.openai_lp_cost_events`
    - `public.openai_lp_cost_coverage`
    - `public.append_openai_lp_cost_start_v1`
    - `public.append_openai_lp_cost_terminal_v1`
    - `public.register_openai_lp_cost_coverage_v1`
    - `public.read_openai_lp_cost_events_v1`
    - `public.prevent_openai_lp_cost_mutation_v1`
- Repositório:
  - Criados:
    - `lib/openai-costs/contracts.ts`
    - `lib/openai-costs/index.ts`
    - `lib/openai-costs/pricing.ts`
    - `lib/openai-costs/provider-error-metadata.ts`
    - `lib/openai-costs/tracking-contracts.ts`
    - `lib/openai-costs/tracking-budget.ts`
    - `lib/openai-costs/tracking-gate.ts`
    - `lib/openai-costs/adapters/lpCostTrackingAdapter.ts`
    - `lib/openai-costs/adapters/lpCostReadModelAdapter.ts`
    - `lib/openai-costs/adapters/lpCostReadModelAdapterCore.ts`
    - `lib/openai-costs/dashboard.ts`
    - `lib/openai-costs/decimal.ts`
    - `lib/openai-costs/providers/openAiCostsProvider.ts`
    - `lib/openai-costs/providers/openAiCostsProviderCore.ts`
    - `lib/openai-costs/read-model-benchmark.ts`
    - `lib/openai-costs/read-model-validation-cases.ts`
    - `lib/openai-costs/fixtures/read-model-baseline.ts`
    - `lib/openai-costs/validation-cases.ts`
    - `app/admin/(protected)/custos-openai/actions.ts`
    - `app/admin/(protected)/custos-openai/page.tsx`
    - `app/admin/(protected)/custos-openai/_components/OpenAiCostsDashboard.tsx`
    - `app/admin/(protected)/custos-openai/validation-cases.tsx`
    - `supabase/migrations/20260828131456_e21_4_4_openai_lp_cost_tracking.sql`
    - `supabase/snippets/e21_4_4_openai_lp_cost_tracking_verify.sql`
    - `supabase/tests/e21_4_4_openai_lp_cost_tracking.test.sql`
  - Ajustados:
    - `lib/lp-builder/landingPageDraftCandidateWorkflow.ts`
    - `lib/lp-builder/landingPageDraftGeneration.ts`
    - `lib/lp-builder/landingPageDraftImageGeneration.ts`
    - `lib/lp-builder/adapters/landingPageDraftCandidateWorkflowAdapter.ts`
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/observability.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `components/admin/adminNavigation.ts`
    - `package.json`
- Referências:
  - Boundary técnico: `docs/base-tecnica.md` — seção 3.16.
  - Credenciais, gate e endpoints: `docs/platform-config.md` — seções 3.5 e 6.3.1.
  - Contrato de banco: `docs/schema.md` — eventos e cobertura de custos OpenAI.

21.4.3 Autoridade oficial de custos
- A consulta sob demanda usa somente a Costs API da organização com `OPENAI_ADMIN_KEY` read-only e server-side.
- O total oficial do período UTC é a autoridade organizacional e não é reconstruído por usage, tabela interna ou preço local.
- A chave administrativa permanece separada de `OPENAI_API_KEY` e não atravessa client, banco, log ou resposta sanitizada.
- Não há cache, polling, cron, leitura de saldo/créditos ou atribuição heurística do total oficial.

21.4.4 Série histórica congelada de Landing Pages
- O write-side, gate, budget, pricing e adapter prospectivos foram removidos junto dos únicos produtores elegíveis.
- Eventos e cobertura já persistidos permanecem append-only e somente leitura; não há backfill, reconstrução ou novo produtor.
- Custos oficiais posteriores continuam no total da Costs API e aparecem na reconciliação quando não pertencem à série interna histórica.
- `OPENAI_LP_COST_TRACKING_ENABLED` não possui consumidor vigente e não foi alterada na plataforma por este recorte.

21.4.5 Read model e reconciliação administrativa
- `/admin/custos-openai` consulta em paralelo o total oficial e o read model interno, com período atual ou personalizado, atualização sob demanda e acesso exclusivo de `platform_admin`.
- O read model pagina eventos ordenados, agrega incrementalmente com decimais exatos e mantém memória proporcional à página mais os grupos exigidos pela saída, sem reter todas as linhas.
- Páginas repetidas, regressivas, inválidas ou interrompidas falham fechado; fim de paginação por resposta vazia ou contrato PostgREST aplicável é tratado explicitamente.
- O resultado detalha conta → Landing Page → workload, tentativas, pendências, itens sem preço e cobertura. Outros gastos / reconciliação é a diferença decimal entre total oficial e soma atribuível, sem clamp.
- A superfície distingue cobertura completa, parcial, degradada e indisponível e não individualiza falhas anteriores ao início persistido.
- O smoke autenticado de Production aprovou leitura oficial, histórico congelado, reconciliação, cobertura parcial e bloqueio do papel comum após a evolução incremental do read model.
- Permanecem limites explícitos: a RPC ainda materializa, ordena e aplica offset; não existe snapshot transacional entre páginas; a validação hospedada não comprova volume arbitrário nem ganho de tempo SQL.
- Classificação financeira ampla, outros workloads, câmbio, cobrança, créditos e reconstrução histórica permanecem fora do escopo vigente.

22. E22 — Retirada controlada de ativos históricos
- Objetivo: reduzir superfícies, dados, documentos e infraestrutura sem consumidor vigente, após auditoria explícita de dependências e sem criar substitutos antecipados.
- Status: E22.1, E22.2, E22.3, E22.4 e E22.5 concluídas. O produto operacional, o `lp-builder`, sua apresentação, workloads exclusivos, compatibilidade E19 e write-side de custos foram retirados; Core, capacidades E20 independentes, automações GitHub e resíduos físicos deliberadamente inertes permanecem preservados. Permanece somente a decisão futura sobre reduzir Previews produzidos por pushes intermediários em branches não documentais.

22.1 Retirada de ativos históricos do domínio de Landing Page

22.1.1 Objetivo e status
- Objetivo: remover boundaries, superfícies administrativas, validadores e objetos de banco históricos que deixaram de participar do caminho canônico, preservando autoridades e consumidores reais.
- Status: concluída. Perfil de geração, catálogo de módulos e resolução histórica de pesquisas não existem mais no runtime; parametrização raiz, catálogo de entradas, preparação factual e pesquisa selecionada permanecem independentes. A geração e o produto operacional legado foram retirados posteriormente na E22.4.

22.1.2 Registros do recorte
- Banco:
  - Excluídos:
    - `public.landing_page_generation_profiles`
    - `public.landing_page_generation_profile_items`
    - `public.save_landing_page_generation_profile_draft`
    - `public.activate_landing_page_generation_profile`
    - `public.archive_landing_page_generation_profile`
    - `public.get_landing_page_generation_profile_lifecycle_status`
- Repositório:
  - Criados:
    - `supabase/migrations/20260819153112_e22_1_4_remove_generation_profile.sql`
  - Ajustados:
    - `app/admin/(protected)/estrutura-lp/page.tsx`
    - `app/admin/(protected)/estrutura-lp/validation-cases.ts`
    - `app/admin/(protected)/resolucoes-de-nicho/[accountId]/page.tsx`
    - `app/admin/(protected)/taxonomia/`
    - `components/admin/adminNavigation.ts`
    - `lib/admin/adapters/`
    - `lib/conversion-content/index.ts`
    - `lib/openai-workloads/`
    - `package.json`
  - Excluídos:
    - `app/admin/(protected)/estrutura-lp/ModuleStructureFilters.tsx`
    - `app/admin/(protected)/perfis-de-orientacao/`
    - `lib/conversion-content/adapters/landingPageGenerationProfileAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileAdapterCore.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileAdminAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileOpenAiAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileRowNormalization.ts`
    - `lib/conversion-content/adapters/landingPageResearchAdapter.ts`
    - `lib/conversion-content/landing-page/generation-profile/`
    - `lib/conversion-content/landing-page/module-catalog/`
    - `lib/conversion-content/landing-page/research-resolution/`
    - `supabase/snippets/e12_4_3_generation_profile_lifecycle_verify.sql`
    - `supabase/snippets/e20_3_generation_profile_verify.sql`
    - `supabase/tests/e12_4_3_generation_profile_lifecycle.test.sql`
    - `supabase/tests/e20_3_generation_profile.test.sql`
- Referências:
  - Estado atual do banco: `docs/schema.md` — objetos de Landing Page e pesquisas taxonômicas.
  - Boundary vigente após a retirada posterior: `docs/base-tecnica.md` — preparação factual.

22.1.3 Classificação de consumidores
- A retirada exige classificar cada item como preservado, desacoplado ou removível a partir de consumo real, e não apenas por antiguidade ou localização.
- Naquele recorte permaneceram preservados:
  - a parametrização raiz e seus presets;
  - o catálogo de entradas v6 e seu lifecycle;
  - a seleção da pesquisa integral `end_customer`;
  - a avaliação e preparação do taxon;
  - as tabelas `taxon_market_research` e `taxon_market_research_items`;
  - a compatibilidade administrativa necessária ao lifecycle do catálogo;
  - os geradores de texto e imagem e a autoridade de apresentação usados pelas provas administrativas OpenAI.
- Migrations históricas permanecem imutáveis; remoções de schema são forward-only e sem `CASCADE`.

22.1.4 Perfil de geração retirado
- O boundary `generation-profile`, seus adapters, páginas administrativas, actions, exports, workload e validadores foram excluídos.
- A migration de retirada removeu duas tabelas e quatro RPCs próprias, sem criar arquivo paralelo, snapshot, archive ou persistência substituta.
- A configuração da Landing Page passou a depender das autoridades vigentes de preparação do taxon, catálogo de entradas e workspace, sem fallback para o perfil retirado.
- Pesquisas taxonômicas e `audit_logs` não foram apagados pela retirada.

22.1.5 Catálogo de módulos retirado
- O boundary `module-catalog`, sua API pública, exports e validação executável foram removidos.
- A superfície `/admin/estrutura-lp` não oferece mais módulos ou variantes; suas visões vigentes são Parâmetros e Entradas.
- O contrato raiz e o catálogo de entradas permanecem independentes do catálogo removido.
- Não houve DDL nem substituição por outro catálogo de composição.

22.1.6 Resolução histórica de pesquisas retirada
- O boundary `research-resolution`, o adapter histórico, exports, validadores e diagnósticos administrativos dependentes foram removidos.
- A visão Pesquisas deixou `/admin/estrutura-lp`; queries antigas são normalizadas para uma visão ainda válida.
- A preparação factual continua lendo a pesquisa integral `end_customer` selecionada pelo fluxo E20.5, sem usar o resolver retirado.
- As pesquisas estruturadas persistidas foram preservadas porque ainda possuem consumidores independentes.

22.1.7 Estado consolidado
- Não permanecem imports, rotas ou scripts ativos dos três boundaries retirados.
- `package.json` não contém mais validadores de perfil de geração, catálogo de módulos ou resolução histórica de pesquisas.
- O Admin expõe somente superfícies sustentadas por autoridades vigentes.
- O inventário OpenAI e as capacidades E20 preservadas não devem ser reinterpretados a partir das evidências históricas da E22.1; a retirada posterior da orquestração E19 está registrada em 22.4.

22.2 Retirada de documentação histórica redundante

22.2.1 Objetivo e status
- Objetivo: remover fontes documentais que duplicavam autoridades vigentes, sem reescrever referências históricas preservadas como proveniência.
- Status: concluída. Os dois documentos redundantes foram excluídos e o catálogo administrativo foi reconciliado.

22.2.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `lib/admin/docsCatalog.ts`
- Referências:
  - `docs/lp-planejamento.md` — removido; planejamento corrente pertence ao roadmap e aos planos-base aprovados.
  - `docs/prompt-catalogo-lp.md` — removido; não permanece como fonte operacional.
  - `docs/roadmap.md` — autoridade para estado, dependências e evolução dos casos E*.

22.2.3 Resultado e limites
- `/admin/documentacao` não lista nem tenta ler os documentos removidos.
- O roadmap mantém estado e direção; planos-base mantêm planejamento executável do recorte correspondente.
- Referências históricas aos paths removidos podem permanecer em documentos de proveniência e não constituem fonte operacional.
- A retirada não alterou banco, runtime de produto, rota, infraestrutura ou arquitetura.

22.3 Retirada do Supabase Inspect MCP e infraestrutura associada

22.3.1 Objetivo e status
- Objetivo: remover o service/MCP Supabase Inspect e sua infraestrutura exclusiva depois de confirmar ausência de consumidor necessário, preservando a automação GitHub read-only e recursos compartilhados.
- Status: concluída. O service, o workflow histórico do Agent Builder e o projeto Vercel exclusivo foram removidos; nenhum service/MCP implantável permanece catalogado.

22.3.2 Registros do recorte
- Repositório:
  - Excluídos:
    - `services/mcp-supabase-inspect/README.md`
    - `services/mcp-supabase-inspect/api/mcp.js`
    - `services/mcp-supabase-inspect/package-lock.json`
    - `services/mcp-supabase-inspect/package.json`
    - `services/mcp-supabase-inspect/test/mcp.test.js`
    - `services/mcp-supabase-inspect/vercel.json`
- Referências:
  - Configuração externa final: `docs/platform-config.md` — camada de services e projeto Core.
  - Catálogo da camada: `docs/services.md` — nenhum service/MCP operacional.
  - Automação preservada: `docs/automations.md` — Supabase Inspect Actions.

22.3.3 Auditoria de consumidores
- A auditoria repo-side confirmou ausência de chamada, endpoint ou dependência ativa do MCP fora do workflow histórico alvo.
- O Core não dependia do service e não foi migrado para outro MCP.
- `automations/supabase-inspect/` e `.github/workflows/pipeline-supabase-inspect.yml` permanecem como inspeção read-only via GitHub Actions.
- O secret compartilhado `SUPABASE_DB_URL_READONLY` foi preservado para os consumidores GitHub autorizados.
- Nenhum Agents SDK, novo service, job, automação ou integração substituta foi criado.

22.3.4 Retirada do MCP
- Os seis arquivos do service foram excluídos e a camada `services/` ficou sem workload implantável.
- O workflow histórico do Agent Builder foi removido na plataforma e não permanece como consumidor.
- Referências operacionais foram reconciliadas para distinguir service removido de automação preservada.
- O inventário `supabase_inspect` da E21 continua apenas como referência operacional do workflow GitHub; não representa MCP ou configuração efetiva verificada pelo Core.

22.3.5 Retirada da infraestrutura Vercel
- O projeto exclusivo `lpf-10-services` foi removido após confirmação de ausência de workload e domínio remanescente.
- O projeto Core `lp-factory-10` e seu domínio permaneceram intactos.
- A retirada não solicitou deployment ou redeploy manual do Core; o Preview acionado pela publicação final concluiu com sucesso.
- Não resta configuração externa de service a manter.

22.3.6 Limite operacional remanescente
- Status: pendente de decisão.
- A política versionada em `vercel.json` desabilita deploy automático apenas para branches `docs/**`.
- Branches de implementação, inclusive `codex-app/**`, continuam gerando Preview a cada push; checkpoints publicados em excesso podem consumir a cota do Core.
- A remoção do segundo projeto eliminou deployments duplicados do service, mas não reduz os Previews do Core.
- Qualquer mudança adicional de política, processo, skill ou `AGENTS.md` exige recorte próprio e validação de que Production automática da `main` e Previews necessários continuam preservados.

22.4 Retirada da geração e do produto operacional legado de Landing Page

22.4.1 Objetivo e status
- Objetivo: remover em ondas o caminho funcional de geração e o produto operacional legado tornado dispensável, preservando somente consumidores independentes comprovados.
- Status: concluída no repositório. PR #871 tornou a geração inalcançável, PR #872 retirou orquestração e escrita, e o SV-PR03 retirou as superfícies operacionais e os leitores restantes. Banco, migrations, dados e Storage não foram alterados.

22.4.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/estrutura-lp/validation-cases.ts`
    - `lib/lp-builder/adapters/landingPageRevisionAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionStorageAdapter.ts`
    - `lib/lp-builder/index.ts`
    - `lib/lp-builder/landing-page-draft-generation-validation-cases.ts`
    - `lib/lp-builder/landing-page-preview-validation-cases.tsx`
    - `lib/lp-builder/landing-page-workspace-validation-cases.ts`
    - `lib/lp-builder/landingPageRevision.ts`
    - `package.json`
  - Excluídos:
    - `app/a/[account]/landing-pages/[landingPageId]/preview/actions.ts`
    - `lib/lp-builder/adapters/generationContextAdapter.ts`
    - `lib/lp-builder/adapters/generationContextAdapterCore.ts`
    - `lib/lp-builder/adapters/landingPageDraftCandidateWorkflowAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftImageGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageGenerationKnowledgeAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionReadinessAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionWorkflowAdapter.ts`
    - `lib/lp-builder/generation-context-validation-cases.ts`
    - `lib/lp-builder/generationContext.ts`
    - `lib/lp-builder/landingPageDraftCandidateWorkflow.ts`
    - `lib/lp-builder/landingPageDraftWorkflow.ts`
    - `lib/lp-builder/landingPageGenerationKnowledge.ts`
    - `lib/lp-builder/landingPageRevisionWorkflow.ts`
- Referências:
  - Boundary técnico no fechamento do SV-PR03: `docs/base-tecnica.md` — antigas seções 3.14.4, 3.15.8 e 3.15.9.
  - Configuração preservada: `docs/platform-config.md` — workloads OpenAI e Storage privado.
  - Contrato de banco preservado: `docs/schema.md` — materializações de Landing Page.

22.4.3 Cadeia removida
- A cadeia removida era: action de geração → compilação de contexto → resolução E20.7 integrada → candidata textual e imagem → binding → documentos de revisão → upload privado → append transacional.
- A action já falhava fechado e não possuía consumer alcançável depois da retirada da UI no SV-PR01; os módulos abaixo dela ficaram sem entrada funcional.
- Exports, validators, adapters exclusivos da cadeia e wrappers server-only sem consumidor foram podados com os módulos produtores e escritores.

22.4.4 Capacidades preservadas
- No fechamento do SV-PR03, `generationContextContracts.ts` preservava somente o shape V4 mínimo consumido pelos geradores administrativos; ele foi retirado no SV-PR04.
- No fechamento do SV-PR03, os geradores básicos de texto e imagem e `presentation/` permaneciam apenas para provas administrativas da E21; foram retirados no SV-PR04.
- No fechamento do SV-PR03, a compatibilidade de configuração ainda permanecia exclusivamente para o lifecycle administrativo do catálogo; ela foi retirada no SV-PR04.
- E20.7, preparação factual, catálogo de entradas e parametrização raiz permanecem independentes e sem integração ativa com E19.
- RPCs, tabelas, bucket, migrations e dados históricos foram preservados inertes; qualquer nova escrita, leitura de produto ou limpeza exige decisão e recorte futuros próprios.

22.4.5 Produto operacional retirado no SV-PR03
- O Account Dashboard não carrega configuração, drafts, workspace, revisão ou materialização e sempre segue a experiência comercial preservada conforme conta, papel e entitlement.
- As rotas antigas de detail, configuração, histórico e Preview, suas Server Actions, renderer, adapters, contratos e validators exclusivos foram removidos sem substitutos ou redirects.
- `E19_5_WORKSPACE_ENABLED` ficou sem consumidor e a infraestrutura física herdada permanece inventariada em `docs/schema.md`.

22.5 Retirada do residual E19 e da compatibilidade com E20.2

22.5.1 Objetivo e status
- Objetivo: eliminar as últimas fronteiras de código mantidas apenas pelos geradores e pela antiga operacionalidade E19, sem alterar as autoridades factuais E20.
- Status: concluída no SV-PR04, sem migration, DDL, limpeza de dados, Storage ou configuração hospedada.

22.5.2 Resultado
- `lib/lp-builder/` e `lib/conversion-content/landing-page/presentation/` foram removidos integralmente, junto dos dois workloads de draft, provas administrativas e branches exclusivas de image workload.
- O Admin Workloads seleciona somente workloads vigentes; as quatro unidades históricas, seis revisões e oito ativações permanecem inertes no banco.
- O lifecycle E20.2 não lê conta, entitlement, `account_taxonomy`, onboarding, configuração ou LP para derivar operacionalidade e não possui blocker global substituto.
- Evidência humana válida avança somente o marcador do taxon correspondente; ausência ou invalidade preserva o marcador anterior e o fail-closed próprio da E20.6.
- O write-side prospectivo de custos foi removido; Costs API, read model e oito eventos históricos permanecem disponíveis como série congelada e reconciliação.

22.5.3 Capacidades preservadas
- E20.2 mantém registry, resolução, versionamento, fingerprints e as classificações `no_material_change`, `compatible_evolution` e `review_required`.
- E20.5 mantém a pesquisa integral selecionada; E20.6 mantém `reviewed_input_catalog_version`, decisão humana e preparação fail-closed por taxon; E20.7 permanece capacidade independente.
- O framework OpenAI compartilhado, os quatro workloads textuais vigentes, `supabase_inspect` e o catálogo de modelos de imagem permanecem preservados.
- Objetos físicos e registros históricos E19 permanecem deliberadamente inertes; qualquer limpeza posterior exige recorte próprio.

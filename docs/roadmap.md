0. Introdução

0.1 Cabeçalho
• Data: 01/09/2026
• Versão: v1.5.208

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

0.3 Nota operacional (dependência externa)
• 2026-02 — Supabase: Project Clone / Restore to a New Project (beta) pode ficar indisponível; sem impacto no runtime do projeto existente. Não depender disso para staging/espelho/backup. Se precisar duplicar ambiente: criar projeto novo + aplicar migrations do repositório + configurar env/secrets manualmente.

1. E1 — Estrutura de Dados
- Objetivo: estabelecer a base estrutural multi-tenant para contas, vínculos de usuários, planos, parceiros e auditoria.
- Status: concluído; a base permanece em uso e seu contrato atual é mantido em `docs/schema.md` e nos recortes posteriores que a evoluíram.

1.1 Base estrutural multi-tenant

1.1.1 Objetivo e status
- Objetivo: disponibilizar as entidades e relações iniciais necessárias para identificar contas, vincular usuários, associar planos e parceiros e registrar auditoria.
- Status: concluído em 03/10/2025; estruturas preservadas no estado atual do produto.

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
  - onboarding, páginas comerciais e workspace do Account Dashboard pertencem às respectivas evoluções da E10 e da E19;
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
- Status: concluído em 26/02/2026; entrega e links funcionais validados.

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
- Status: concluído no contrato visual e materializado no workspace do Account Dashboard e no Admin.

6.4.2 Registros do recorte
- Referências:
  - Workspace do Account Dashboard: `docs/design-system.md` — seção “Workspace operacional do Account Dashboard”.
  - Superfície administrativa: `docs/design-system.md` — seção “Superfície administrativa do Admin”.

6.4.3 Padrões vigentes e limites
- Status: implementado e vigente.
- Conteúdo:
  - workspace do Account Dashboard e Admin possuem padrões próprios documentados e aplicados;
  - layout, responsividade e estados visuais residem exclusivamente em `docs/design-system.md`;
  - a padronização não autoriza redesign amplo nem componentização antecipada de superfícies sem necessidade real.

7. E7 — Conta Consultiva — retirada
- Objetivo: preservar o encerramento do fluxo consultivo legado e seu destino canônico sem reativar arquitetura removida.
- Status: retirado em 18/10/2025; sem superfície ativa no runtime ou no Admin.

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
- Status: concluído em 03/10/2025; contrato essencial preservado no runtime atual.

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

- Objetivo: Separar condição comercial da conta do lifecycle operacional da conta; definir elegibilidade comercial para criação de LPs por entitlement local efetivo; manter provedores de pagamento como mecanismos de confirmação/persistência, não como prova direta de liberação no LP Builder.
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
- O gate produtivo do LP Builder está descrito em 9.1.9.

9.1.7 View efetiva
- Leitura efetiva: `public.v_account_commercial_entitlement_effective`.
- View efetiva validada com elegibilidade comercial positiva no recorte de liberação manual administrativa mínima (9.2).

9.1.8 Signal server-side
- Boundary server-side criado: `lib/commercial-entitlements/`.
- Adapter criado: `getCommercialEntitlementSignal({ accountId })`.
- Signal validado por contrato view → adapter.

9.1.9 Gate do LP Builder
- Status: concluído.
- Regra mínima: usuário autenticado + conta `active` + membership `active` + papel `owner`/`admin` + entitlement comercial válido.
- Para gate de criação de LP, conta operacionalmente permitida significa `accounts.status = active`.
- Membership ativo significa `account_users.status = active`.
- Conta `active` não fica elegível para criação produtiva apenas por estar ativa.
- Gate produtivo confirmado no ponto real entregue pela E19: `app/lp-builder/actions.ts`, `lib/lp-builder/` e `public.account_landing_pages`.
- O LP Builder consome `getCommercialEntitlementSignal({ accountId })` antes da persistência.
- Sem entitlement comercial válido, o fluxo retorna `commercial_entitlement_required` antes do insert.
- O LP Builder não consulta Stripe diretamente, não usa redirect de checkout como liberação e não usa apenas `accounts.status` como prova comercial.

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
    - `lib/billing-checkout/index.ts`

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
- Redirect, checkout e webhook não liberam o LP Builder sem entitlement local efetivo.

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
- E20.5 e E20.6 selecionam e avaliam o caminho vigente da pesquisa integral `end_customer`, consumido pela E19.3.
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

12.4 Gestão do perfil de orientação — retirada

12.4.1 Objetivo e status
- Objetivo: registrar o encerramento da antiga operação administrativa de perfis de orientação.
- Status: retirada pela E22.1.4; não existe rota, navegação ou boundary vigente para esse domínio.

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

- Objetivo: registrar uma eventual área pessoal de perfil e preferências sem confundi-la com o Account Dashboard ou com o workspace operacional de landing pages.
- Status: não iniciado; não existe rota, página, persistência de preferências ou boundary própria para esse domínio.

14.1 Perfil e preferências pessoais

14.1.1 Objetivo e status
- Objetivo: permitir gestão de dados pessoais somente após definição aprovada de campos, autoridade e resultado para o usuário.
- Status: futuro sem recorte funcional aprovado.

14.1.3 Estado atual e residência das responsabilidades
- `components/layout/UserMenu.tsx` ainda expõe um link para `/workspace/profile`, mas a rota `app/workspace/` não existe; o link não entrega uma jornada funcional.
- Seleção e persistência da conta atual residem em E10.3.
- Decisão de acesso por conta reside em E8.
- Onboarding e workspace operacional de landing pages residem em E19.
- Nenhuma nova estrutura de Workspace Dashboard deve ser criada até existir um recorte pessoal aprovado que não duplique esses domínios.

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
- `active`: setup operacional concluído; a rota decide entre experiência comercial, onboarding de landing page e workspace conforme papel, entitlement e estado da E19.
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
- Banco:
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
- A infraestrutura da LP Builder permanece separada na E19.

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
- A E20.2 mantém o catálogo de entradas e a E19 mantém materialização, revisão, Preview e publicação.
- O Admin apenas expõe os parâmetros e entradas vigentes; isso não promove o ciclo de vida `hypothesis`.
- A implementação anterior de composição/renderização `landing_page` e o catálogo histórico de módulos não fazem parte do boundary atual.

18.5 Catálogo histórico de módulos e variantes `landing_page`

18.5.1 Objetivo e status
- Objetivo: registrar o destino do antigo catálogo repo-only de módulos e variantes da família `landing_page`.
- Status: Retirada concluída pela E22.1.5; não há substituto nem consumidor no caminho canônico.

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
- O caminho E19.3 → E19.4 não depende deste catálogo.

19. E19 — LP Builder
- Objetivo: manter o domínio Core de landing pages por conta, cobrindo identidade, configuração, geração controlada, revisões materializadas, Preview privado e aprovação humana.
- Status: identidade, onboarding, workspace, geração base, histórico e aprovação implementados; workspace habilitado em Preview e Production. A integração de conhecimento E20.7 está mergeada no repositório, mas seu rollout end-to-end em Production permanece contido em deployment anterior após falha segura, sem nova materialização.

19.1 Identidade e criação de landing page

19.1.1 Objetivo e status
- Objetivo: criar e manter a identidade tenant-safe de cada LP antes de conteúdo, revisão ou publicação.
- Status: Implementado; novas LPs nascem em `draft`.

19.1.2 Registros do recorte
- Banco:
  - Criados:
    - `account_landing_pages`
    - policy `account_landing_pages_select_member_or_platform`
    - trigger `account_landing_pages_set_updated_at`
  - Ajustados:
    - constraint `account_landing_pages_status_chk`
- Repositório:
  - Criados:
    - `app/lp-builder/actions.ts`
    - `lib/lp-builder/contracts.ts`
    - `lib/lp-builder/adapters/landingPagesAdapter.ts`
    - `lib/lp-builder/index.ts`
    - `supabase/migrations/20260630210213_e19_account_landing_pages.sql`
    - `supabase/migrations/20260820214422_e19_5_expand_landing_page_status.sql`
    - `supabase/snippets/e19_account_landing_pages_verify.sql`
- Referências:
  - Contrato de banco: `docs/schema.md` — `account_landing_pages`.
  - Boundary técnico: `docs/base-tecnica.md` — seção 3.14.4.

19.1.3 Criação e identidade
- A LP pertence a uma conta, exige nome não vazio e usa slug seguro e único dentro da conta.
- A criação é server-side e exige usuário autenticado, conta `active`, membership `active` com papel `owner` ou `admin` e entitlement comercial válido.
- Falha de acesso ou entitlement ocorre antes da persistência.
- O schema aceita `draft`, `active` e `archived`; criação continua limitada a `draft`, e o runtime operacional atual aceita `draft` ou `active`.
- A identidade não incorpora conteúdo, configuração ou snapshot.

19.1.4 Boundary e limites
- O boundary canônico é `lib/lp-builder/`; UI e Server Actions não acessam o banco diretamente.
- Account Dashboard é consumidor da E19, não proprietário do domínio.
- Não existe publicação pública, domínio customizado, hard delete, tracking, analytics ou teste A/B neste recorte.
- Não há superfície operacional para ativar, arquivar ou restaurar uma LP.

19.2 Onboarding e handoff para configuração operacional

19.2.1 Objetivo e status
- Objetivo: coletar e validar os valores mínimos da primeira LP após o entitlement, preservar retomada e transferir a autoridade para a residência operacional da LP.
- Status: Implementado; configuração histórica permanece como bootstrap/proveniência e deixa de ser fallback após o handoff.

19.2.2 Registros do recorte
- Banco:
  - Criados:
    - `account_landing_page_onboarding_configurations`
- Repositório:
  - Criados:
    - `lib/lp-builder/onboardingConfiguration.ts`
    - `lib/lp-builder/adapters/onboardingConfigurationAdapter.ts`
    - `lib/lp-builder/adapters/onboardingConfigurationAdapterCore.ts`
    - `app/a/[account]/_components/OnboardingConfigurationJourney.tsx`
    - `app/a/[account]/_components/OnboardingCompletionJourney.tsx`
    - `app/a/[account]/account-journey-loader.ts`
    - `app/a/[account]/onboarding-configuration-actions.ts`
    - `supabase/migrations/20260807162417_e19_2_3_account_landing_page_onboarding_configuration.sql`
    - `supabase/snippets/e19_2_3_account_landing_page_onboarding_configuration_verify.sql`
    - `supabase/tests/e19_2_3_account_landing_page_onboarding_configuration.test.sql`
  - Ajustados:
    - `app/a/[account]/page.tsx`
    - `lib/lp-builder/contracts.ts`
    - `lib/lp-builder/index.ts`
    - `package.json`
- Referências:
  - Catálogo de entradas e versão vigente: `docs/roadmap.md` — seção 20.2.
  - Contrato de banco: `docs/schema.md` — `account_landing_page_onboarding_configurations`.

19.2.3 Configuração e completude
- O boundary resolve a versão revisada autorizada para o taxon, atualmente alinhada ao catálogo E20.2 v6, e não aceita versão enviada pelo client, `latest` ou maior chave por inferência.
- Valores são validados por `fieldKey`, tipo, escopo, plano e cadeia taxonômica; valores autoritativos são reutilizados sem duplicação.
- Completude é derivada e não possui `onboarding_status` persistido.
- O agregado é 1:1 por conta, usa revisão otimista e mantém `landing_page_id` write-once.
- Ausência, divergência ou versão não executável da preparação falha fechado.

19.2.4 Jornada e identidade visual
- Conta elegível e incompleta recebe jornada guiada; conta sem entitlement preserva a experiência comercial.
- Campos são derivados do catálogo E20.2 e não de uma lista paralela na UI.
- A identidade visual usa os papéis `primary`, `secondary`, `accent`, `background` e `text`, com validação determinística de formato e contraste.
- Logo permanece opcional e depende de referência canônica; não há upload, bucket ou infraestrutura própria de assets no onboarding.
- Save parcial preserva progresso; conflito de revisão exige recarga explícita.

19.2.5 Conclusão e handoff
- Configuração incompleta não cria nem seleciona LP.
- Com configuração completa, zero drafts permite criação explícita; um ou vários drafts exigem seleção humana, sem escolha silenciosa.
- O vínculo ocorre somente com LP da mesma conta e não pode ser refeito.
- A residência histórica pode inicializar a LP vinculada até a criação lazy das configurações operacionais.
- Depois do handoff, `account_landing_page_shared_configurations` e `account_landing_page_configurations` são as únicas autoridades editáveis; o agregado da E19.2 permanece somente como bootstrap e proveniência.

19.3 Contexto autorizado e conhecimento para geração

19.3.1 Objetivo e status
- Objetivo: compilar um pacote único, imutável e autorizado para a geração, separando contexto semântico do modelo e valores operacionais server-side.
- Status: contrato v4 vigente para o workspace; contrato v3 preservado para revisões e rollback históricos. Integração E20.7 presente no repositório, com rollout de Production contido.

19.3.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/lp-builder/generationContext.ts`
    - `lib/lp-builder/generationContextContracts.ts`
    - `lib/lp-builder/adapters/generationContextAdapter.ts`
    - `lib/lp-builder/adapters/generationContextAdapterCore.ts`
    - `lib/lp-builder/landingPageGenerationKnowledge.ts`
    - `lib/lp-builder/adapters/landingPageGenerationKnowledgeAdapter.ts`
    - `lib/lp-builder/generation-context-validation-cases.ts`
  - Ajustados:
    - `lib/lp-builder/landingPageDraftCandidateWorkflow.ts`
    - `lib/lp-builder/adapters/landingPageDraftCandidateWorkflowAdapter.ts`
    - `lib/lp-builder/index.ts`
    - `package.json`
    - `package-lock.json`
- Referências:
  - Preparação factual e pesquisas: `docs/roadmap.md` — seções 20.5, 20.6 e 20.7.
  - Parametrização raiz: `docs/roadmap.md` — seção 18.4.
  - Workloads e configuração operacional: `docs/platform-config.md`.

19.3.3 Pacote de geração
- O sucesso expõe somente `identities`, `modelContext` e `serverContext`; falhas não retornam pacote parcial.
- A compilação revalida plano, cadeia taxonômica, catálogo E20.2 efetivo, configurações e parametrização raiz.
- Fatos semanticamente visíveis permanecem em `modelContext.facts`; destinos e valores operacionais brutos ficam em `serverContext.facts`.
- A pesquisa `end_customer` autorizada chega integralmente ao contexto consultivo, sem path físico; `business_buyer` não integra o contexto da LP.
- O contrato v4 registra separadamente versões e revisões das configurações compartilhada e específica da LP.
- Readers preservam o par histórico snapshot v1/contexto v3 e o par atual snapshot v2/contexto v4, sem cruzamento ou preenchimento retroativo.

19.3.4 Integração E20.7 no repositório
- Somente o workflow de candidata v4 resolve conhecimento; o caminho legado v3 conserva a pesquisa original.
- A resolução mantém fatos, identidades e binding inalterados e pode retornar base, pesquisa especializada ou complemento dinâmico.
- Complemento dinâmico exige configuração operacional provada, ocorre antes dos workloads de texto e imagem e usa o mesmo `attemptId` e `requestId`.
- O resultado consultivo remove paths internos, é exatamente o conteúdo enviado ao workload textual e integra o snapshot da nova revisão.
- Leituras e transporte respeitam o deadline total da tentativa; timeout, configuração indisponível ou resposta inválida falham fechado, sem retry, fallback ou materialização parcial.

19.3.5 Estado operacional da integração
- O caminho integrado foi aprovado no Preview com geração completa e nova revisão.
- Em Production, canário e ativação da configuração passaram, mas duas tentativas completas retornaram resposta dinâmica inválida antes de texto e imagem; nenhuma revisão foi anexada.
- O Core em Production foi revertido ao deployment anterior, promoções automáticas ficaram suspensas e nenhuma nova geração foi executada após a contenção.
- O código integrado permanece na `main`; portanto merge e configuração ativa não equivalem a rollout end-to-end aprovado.
- Workspace, histórico, revisões e mídia permaneceram legíveis durante a contenção.

19.4 Geração, materialização e Preview privado

19.4.1 Objetivo e status
- Objetivo: gerar uma candidata validada, anexar uma revisão completa e reproduzível e renderizá-la em Preview privado.
- Status: Pipeline base implementado; materializações e assets existentes preservados. A geração com conhecimento dinâmico segue o limite operacional de 19.3.5.

19.4.2 Registros do recorte
- Banco:
  - Criados:
    - `account_landing_page_materializations`
    - RPC `append_account_landing_page_materialization_v1`
    - RPC `append_account_landing_page_materialization_v2`
    - bucket privado `landing-page-revision-assets`
  - Ajustados:
    - `account_landing_page_materializations` para revisões 1:N append-only
- Repositório:
  - Criados:
    - `components/lp-builder/LandingPageRenderer.tsx`
    - `lib/conversion-content/landing-page/presentation/`
    - `lib/lp-builder/landingPageDraftGeneration.ts`
    - `lib/lp-builder/landingPageDraftImageGeneration.ts`
    - `lib/lp-builder/landingPageDraftPrompt.ts`
    - `lib/lp-builder/landingPageRevision.ts`
    - `lib/lp-builder/landingPageRevisionWorkflow.ts`
    - `lib/lp-builder/landingPagePreview.ts`
    - `lib/lp-builder/adapters/landingPageDraftGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPageDraftImageGenerationAdapter.ts`
    - `lib/lp-builder/adapters/landingPagePreviewAdapter.ts`
    - `lib/lp-builder/adapters/landingPageRevisionAdapter.ts`
    - `app/a/[account]/landing-pages/[landingPageId]/preview/`
    - `supabase/migrations/20260811133500_e19_4_4_landing_page_materializations.sql`
    - `supabase/migrations/20260817180000_e19_4_4_landing_page_revisions.sql`
    - `supabase/snippets/e19_4_4_landing_page_materializations_verify.sql`
    - `supabase/tests/e19_4_4_landing_page_materializations.test.sql`
  - Ajustados:
    - `next.config.js`
    - `package.json`
- Referências:
  - Contrato de revisão e segurança: `docs/base-tecnica.md` — seção 3.15.9.
  - Objetos físicos: `docs/schema.md`.
  - Workloads vigentes: `docs/platform-config.md`.

19.4.3 Geração controlada
- O fluxo é server-side, linear e não agentic: contexto autorizado → conhecimento consultivo → texto estruturado → imagem → revalidação → append.
- O contrato de apresentação e os schemas estritos validam as oito variantes suportadas antes da persistência.
- Binding de conversão é derivado dos fatos operacionais e não pelo modelo.
- Texto e imagem usam workloads separados; modelos, esforços e limites efetivos pertencem ao registry E21 e à configuração operacional.
- A tentativa possui deadline total de 270 segundos e não aplica retry ou fallback automático.
- Falha posterior ao upload executa cleanup best-effort do path exato e não autoriza revisão parcial.

19.4.4 Revisões e mídia
- Revisões são 1:N, append-only, numeradas por LP e idempotentes por `attempt_id`.
- A revisão corrente é a de maior `revision_number`; a aprovada é um ponteiro explícito e pode ser anterior à corrente.
- Append ocorre por RPC transacional tenant-safe; runtime não escreve diretamente na tabela.
- Conteúdo e snapshot são autossuficientes e imutáveis, sem secret, prompt bruto, raciocínio privado ou URL assinada.
- A imagem WebP reside no bucket privado por referência canônica; URL assinada é transitória e criada somente após autorização.
- RLS permanece ativa; clientes `anon` e `authenticated` não executam os RPCs de append.

19.4.5 Preview
- A rota privada revalida ator, conta, membership, entitlement, LP e tenant da revisão.
- O usuário pode abrir a revisão corrente ou uma revisão histórica compatível.
- O read model usa allowlist de conteúdo e metadados e não expõe linha de banco, snapshot integral, pesquisa, bucket, path ou provider.
- O renderer é puro e não consulta Supabase, OpenAI ou fontes mutáveis.
- Revisão com par de contratos desconhecido ou materialização histórica incompleta falha fechado sem fallback para a mais recente.

19.5 Workspace operacional, configuração e aprovação

19.5.1 Objetivo e status
- Objetivo: operar múltiplas LPs por conta, editar configurações autorizadas, gerar revisões, navegar no histórico e aprovar explicitamente uma revisão.
- Status: Implementado e habilitado em Preview e Production por `E19_5_WORKSPACE_ENABLED=true`; viewer permanece read-only.

19.5.2 Registros do recorte
- Banco:
  - Criados:
    - `account_landing_page_shared_configurations`
    - `account_landing_page_configurations`
    - `e19_5_actor_can_manage(uuid, uuid)`
    - `e19_5_configuration_values_have_scopes(jsonb, text[])`
    - `save_account_landing_page_configuration_v1`
    - `approve_account_landing_page_materialization_v1`
    - `read_account_landing_page_identity_baselines_v1`
  - Ajustados:
    - `account_landing_pages.approved_materialization_id`
    - `account_landing_page_materializations`
- Repositório:
  - Criados:
    - `app/a/[account]/_components/LandingPageWorkspace.tsx`
    - `app/a/[account]/_components/WorkspaceSubmitButton.tsx`
    - `app/a/[account]/workspace-actions.ts`
    - `app/a/[account]/landing-pages/[landingPageId]/page.tsx`
    - `app/a/[account]/landing-pages/[landingPageId]/actions.ts`
    - `app/a/[account]/landing-pages/[landingPageId]/configuration-actions.ts`
    - `lib/lp-builder/landingPageWorkspace.ts`
    - `lib/lp-builder/adapters/landingPageWorkspaceAdapter.ts`
    - `lib/lp-builder/adapters/landingPageWorkspaceAuthority.ts`
    - `lib/lp-builder/landing-page-workspace-validation-cases.ts`
    - `supabase/migrations/20260822170000_e19_5_3_landing_page_workspace.sql`
    - `supabase/migrations/20260830201842_e19_identity_baselines.sql`
    - `supabase/snippets/e19_5_3_landing_page_workspace_verify.sql`
    - `supabase/tests/e19_5_3_landing_page_workspace.test.sql`
    - `supabase/snippets/e19_identity_baselines_verify.sql`
    - `supabase/tests/e19_identity_baselines.test.sql`
  - Ajustados:
    - `app/a/[account]/page.tsx`
    - `lib/lp-builder/contracts.ts`
    - `lib/lp-builder/generationContext.ts`
    - `lib/lp-builder/landingPageRevision.ts`
    - `lib/lp-builder/landingPagePreview.ts`
    - `package.json`
- Referências:
  - Contrato de banco: `docs/schema.md`.
  - Contrato visual: `docs/design-system.md` — Workspace operacional do Account Dashboard.
  - Flag e estado por ambiente: `docs/platform-config.md`.

19.5.3 Lista e autoridade
- O workspace usa master-detail paginado, com até 25 LPs por página e estados derivados de configuração, revisão corrente e aprovação.
- Owner e admin podem criar, configurar, gerar e aprovar; viewer recebe leitura integral sem mutações.
- Toda operação revalida autenticação, conta ativa, membership, entitlement, taxonomia e versão efetiva do catálogo.
- LPs sem revisão permanecem listáveis; o resumo transporta apenas metadados das revisões corrente e aprovada, não conteúdo ou snapshots.

19.5.4 Configuração operacional
- Valores `account/business` residem na configuração compartilhada; `offer/campaign/landing_page` residem na configuração específica da LP.
- As duas revisões otimistas são independentes e o save é atômico; no-op não incrementa revisão.
- Campos, obrigação, tipos, opções e condições vêm do catálogo E20.2 vigente, sem registry paralelo.
- `primary_conversion_goal` participa da identidade da LP; mudança material de identidade exige nova LP e mudança de oferta pode exigir confirmação explícita.
- Baselines de identidade e revisão corrente são lidas no mesmo snapshot lógico e revalidadas antes do save.

19.5.5 Histórico, Preview e aprovação
- Histórico é carregado sob demanda e aceita revisões correntes ou históricas compatíveis.
- Aprovação é idempotente e move apenas `approved_materialization_id` para uma revisão da mesma LP e conta.
- Uma nova revisão após a aprovada deriva o estado `new_version_in_review`; aprovação não publica nem altera o status da LP.
- Publication, archive/restore, editor manual, melhoria parcial por IA, tracking, CRM e automações em fila permanecem fora do produto atual.

20. E20 — Preparação e liberação de taxons para geração de landing pages

* Objetivo: consolidar catálogo de entradas por taxon e plano, perfis versionados de orientação à geração, herança e, em recortes futuros, prontidão e liberação antes da geração de LPs por conta.
* Status: E20.2 definida no contrato repo-only até a v5; E20.3 retirada; E20.5 concluída e ativada após merge do PR #746, apply canônico, prova SQL e smokes autenticados em Preview e Production.

20.2 Catálogo de entradas por taxon

20.2.1 Objetivo e status

* Objetivo: definir e resolver um catálogo declarativo versionado de entradas de `landing_page` por taxon e plano, separado de valores operacionais, composição, conteúdo e entitlement.
* Status: Contrato repo-only definido até a versão executável v5; consumo operacional depende de versão explicitamente requerida e de revisão compatível pela E20.6.

20.2.2 Registros do recorte

* Repositório:

  * Criados:

    * `lib/conversion-content/landing-page/input-catalog/contracts.ts`
    * `lib/conversion-content/landing-page/input-catalog/registry.ts`
    * `lib/conversion-content/landing-page/input-catalog/schema.ts`
    * `lib/conversion-content/landing-page/input-catalog/resolver.ts`
    * `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`
    * `lib/conversion-content/landing-page/input-catalog/index.ts`
    * `supabase/snippets/e20_2_taxon_chain_verify.sql`
    * `app/admin/(protected)/estrutura-lp/validation-cases.ts`
  * Ajustados:

    * `lib/conversion-content/index.ts`
    * `package.json`
    * `app/admin/(protected)/estrutura-lp/page.tsx`
    * `app/a/[account]/_components/OnboardingConfigurationJourney.tsx`
    * `app/a/[account]/_components/onboarding-journey-validation-cases.ts`
* Updates:

  * Aplicados: `prod#14`, `prod#16`.

20.2.3 Catálogo e resolução

* Status: Implementados.
* Conteúdo:

  * O catálogo é declarativo, versionado no repositório e resolvido por taxon e plano, sempre com versão explícita e sem fallback automático.
  * A v1 permanece integralmente preservada com os 19 campos e a ordem anteriores.
  * A v2 contém 23 campos: os 19 da v1 e os quatro mínimos do Starter — serviço ou oferta principal, descrição factual curta, referência opaca opcional de logo ou asset principal e paleta visual confirmada.
  * A v3 preserva integralmente os 23 campos, a ordem e a estrutura da v2 e acrescenta somente metadata declarativo que autoriza `financing_support_available` e `document_support_available` a sustentar `applicable_capabilities` quando o valor booleano for `true`; a v2 permanece imutável e continua validando os valores persistidos.
  * A v4 preserva integralmente os 23 campos, a ordem, as camadas, a metadata e os bindings da v3 e acrescenta somente `rent` ao final do enum de `transaction_intent`, com evidência atualizada para locação exclusiva; v1–v3 permanecem imutáveis.
  * A v5 preserva integralmente v1–v4 e acrescenta `business_offerings_summary` como contexto universal opcional de negócio e `primary_conversion_goal` como objetivo principal de conversão obrigatório da LP, com valores `contact`, `schedule`, `request_quote`, `purchase` e `register_interest`; a versão só se torna operacional para um consumidor quando é requerida explicitamente e coincide com a revisão humana registrada pela E20.6.
  * Os quatro campos da v2 permanecem disponíveis em Starter, Lite, Pro e Ultra, sem diferenças adicionais entre planos neste recorte.
  * Strings obrigatórias rejeitam valor vazio; o asset aceita somente objeto estrito com `asset_id` opaco não vazio; a paleta exige exatamente `primary`, `secondary`, `accent`, `background` e `text` em hexadecimal `#RRGGBB`.
  * Os campos criados na v2 declaram `landingPageSubstitutionPolicy`: oferta, descrição e logo usam `forbidden`, enquanto a paleta usa `explicit_allowed`; ausência da política nos campos históricos da v1 não autoriza substituição.
  * Campos próprios da LP usam `not_applicable`; campos reutilizáveis usam `forbidden` ou `explicit_allowed`. Especialização taxonômica de definições e substituição explícita de valores concretos por LP permanecem conceitos distintos, e a especialização não altera essa política.
  * A herança segue `universal → segmento → nicho → ultranicho autorizado`.
  * O ultranicho de corretor de imóveis de médio padrão herda o catálogo sem camada própria.
  * O resultado preserva versão, plano, taxon atendido, camadas aplicadas, ordem determinística, proveniência, validação, evidência e sinal de validade.
  * `requiredWhen` e `applicableWhen` permanecem declarativos e são preservados após o filtro por plano.
  * Depois do merge da v2, mudança funcional no catálogo resolvido exige nova versão; refatoração interna sem alteração do resultado e novo taxon que apenas herda campos não exigem nova versão.

20.2.4 Dependências e limites

* Status: Validados.
* Conteúdo:

  * O resolver falha fechado para cadeia, camada, especialização, condição ou relação entre planos inválida.
  * As retiradas concluídas da E20.3 e da E18.5 não alteram o catálogo, os valores nem a prontidão definidos pela E20.2.
  * A E20.2 define os campos e valida o formato dos valores; a E19.2 coleta, valida, persiste e compõe os valores, implementa a substituição explícita por LP e preserva o snapshot dos valores efetivamente usados.
  * O recorte não cria banco, migration, bucket, Storage, rota, API, Server Action, UI, onboarding, upload, adapter de banco, entitlement, capacidade comercial, tracking, Google Ads, Analytics, integração, valor operacional, snapshot operacional, geração, IA, automação, agente, job ou infraestrutura.

20.2.7 Refinamento de `transaction_intent` para locação

* Objetivo: criar a versão executável v4 do catálogo, preservando integralmente v1–v3 e acrescentando somente o valor canônico `rent`, com rótulo humano `Locação`, ao field existente `transaction_intent`.
* Status: Concluída em 15/08/2026.
* Conteúdo:

  * A v4 parte de cópia profunda da v3, preserva os 23 fields, sua ordem, camadas, metadata, bindings de capabilities e equivalência entre `starter`, `lite`, `pro` e `ultra`, mantém `buy`, `sell`, `valuation` e `mixed` e acrescenta `rent` ao final do conjunto permitido.
  * A consulta administrativa existente de estrutura exibe `Locação`; a jornada E19.2 recebeu somente o rótulo local correspondente e permanece na versão operacional v2, sem promoção de configurações ou do compilador E19.3 para v4.
  * As regressões focais, `npm ci`, `npm run check`, `git diff --check` e a inspeção autenticada do Preview em desktop e largura móvel foram aprovados; o servidor local iniciou na porta 3000, mas a renderização local ficou indisponível por ausência das chaves públicas do Supabase no worktree isolado.
  * A E20.6 deve ser executada novamente contra a versão explícita 4 antes de qualquer registro de suficiência.
  * O recorte não criou field, banco, migration, rota, API, nova UI, persistência, infraestrutura, automação, agente, job ou workload OpenAI e não alterou a E20.6.

20.2.8 Versão atual e propagação escalável do catálogo E20.2

20.2.8.1 Objetivo e status

* Objetivo: definir uma versão atual global, explícita e repo-only para o catálogo E20.2, propagá-la de forma determinística aos consumidores correntes e evitar reavaliação humana por taxon quando a evolução for comprovadamente compatível.
* Status: Concluída em 26/08/2026; implementação mergeada na `main` pelo PR #814 no commit `63213cc338ca8b92320e57f976b261a26b99c2d1`, migration `20260824180000_e20_2_8_input_catalog_lifecycle.sql` aplicada e validada no Supabase, QA positivo autenticado e somente leitura aprovado em Production nos viewports desktop e mobile, e gate negativo aprovado com sessão autorizada sem `platform_admin`: o acesso a `/admin/estrutura-lp?view=entradas` foi redirecionado para `/auth/confirm/info` com “Acesso não disponível”, sem exposição da superfície, dados ou controles administrativos e sem mutações.

20.2.8.2 Registros do recorte

* Banco:
  * Criados:
    * `public.landing_page_input_catalog_drafts`
  * Ajustados:
    * `public.save_account_landing_page_configuration_v1`
* Repositório:
  * Criados:
    * `lib/conversion-content/landing-page/input-catalog/lifecycle.ts`
    * `lib/conversion-content/landing-page/input-catalog/draft.ts`
    * `lib/admin/adapters/adminInputCatalogLifecycleAdapter.ts`
    * `lib/admin/adapters/adminInputCatalogLifecycleContext.ts`
    * `lib/admin/adapters/adminInputCatalogLifecyclePagination.ts`
    * `lib/admin/adapters/adminInputCatalogLifecycleValidation.ts`
    * `lib/lp-builder/operationalCompatibility.ts`
    * `app/admin/(protected)/estrutura-lp/actions.ts`
    * `app/admin/(protected)/estrutura-lp/lifecycle-validation-cases.ts`
    * `app/admin/(protected)/estrutura-lp/__fixtures__/lifecycle-adapter-baseline.txt`
    * `app/admin/(protected)/estrutura-lp/_components/AdminInputCatalogLifecycle.tsx`
    * `supabase/migrations/20260824180000_e20_2_8_input_catalog_lifecycle.sql`
    * `supabase/tests/e20_2_8_input_catalog_lifecycle.test.sql`
    * `supabase/snippets/e20_2_8_input_catalog_lifecycle_verify.sql`
  * Ajustados:
    * `lib/conversion-content/landing-page/input-catalog/contracts.ts`
    * `lib/conversion-content/landing-page/input-catalog/schema.ts`
    * `lib/conversion-content/landing-page/input-catalog/resolver.ts`
    * `lib/conversion-content/landing-page/input-catalog/index.ts`
    * `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/contracts.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/preparation.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/index.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`
    * `lib/conversion-content/adapters/inputCatalogEvaluationContextAdapter.ts`
    * `lib/lp-builder/onboardingConfiguration.ts`
    * `lib/lp-builder/adapters/onboardingConfigurationAdapter.ts`
    * `lib/lp-builder/adapters/onboardingConfigurationAdapterCore.ts`
    * `lib/lp-builder/adapters/landingPageWorkspaceAdapter.ts`
    * `lib/lp-builder/adapters/generationContextAdapter.ts`
    * `lib/lp-builder/adapters/generationContextAdapterCore.ts`
    * `lib/lp-builder/generationContext.ts`
    * `lib/lp-builder/landingPageWorkspace.ts`
    * `lib/lp-builder/index.ts`
    * `lib/lp-builder/validation-cases.ts`
    * `lib/lp-builder/generation-context-validation-cases.ts`
    * `lib/lp-builder/landing-page-workspace-validation-cases.ts`
    * `lib/admin/adapters/adminLandingPageStructureAdapter.ts`
    * `app/admin/(protected)/estrutura-lp/page.tsx`
    * `app/admin/(protected)/estrutura-lp/validation-cases.ts`
    * `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    * `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogEvaluation.tsx`
    * `app/admin/(protected)/taxonomia/actions.ts`
* Referências:
  * Catálogo e preparação factual: `docs/base-tecnica.md` — seções 3.15.4 e 3.15.7.
  * Draft administrativo e RPC de configuração: `docs/schema.md` — seções 1.35 e 3.8.2.

20.2.8.3 Autoridade e lifecycle de publicação

* Status: Implementados.
* Conteúdo:
  * O registry versionado no repositório permanece a autoridade exclusiva das versões publicadas e da versão atual; v1–v5 não serão migradas para o banco.
  * Pode existir somente um próximo draft mutável e não operacional. Persistência administrativa em banco só é admissível se a análise técnica a demonstrar como menor solução e nunca constitui autoridade do catálogo publicado.
  * O draft preserva os fields publicados e sua `createdInVersion`; remoção direta ou proveniência retroativa falha fechada, e retirada usa somente `retiredInVersion` igual à versão alvo.
  * A análise técnica confirmou um singleton service-only como menor residência robusta do draft e das evidências humanas vinculadas ao seu fingerprint, sem integração externa adicional e sem migrar v1–v5.
  * Publicar exige congelar draft e evidências, materializar no repositório a nova versão executável e a declaração explícita de versão atual, validar em CI/Preview, obter revisão e merge humanos, concluir o deploy de Production e comprovar a identidade exata no runtime.
  * A ativação bem-sucedida do artefato em Production torna a nova versão atual; qualquer falha anterior preserva a versão vigente. Eventual reconciliação administrativa posterior não pode substituir nem reverter a autoridade repo-only e, se atrasada, bloqueia novo draft/publicação administrativa até que o estado seja reconciliado com o artefato ativo exato.
  * A reconciliação pós-deploy ocorre somente no runtime de Production quando versão, conteúdo e fingerprint do registry implantado coincidem exatamente com o handoff congelado; antes de remover a residência temporária, revalida identidade, conteúdo e contexto das decisões E20.6.5, materializa os marcadores `reviewed_input_catalog_version` ainda válidos sem nova IA e confirma a leitura final. Divergência, decisão obrigatória ausente/stale ou efeito não confirmado falha fechado e preserva o draft.

20.2.8.4 Versão revisada, versão efetiva e compatibilidade

* Status: Implementadas.
* Conteúdo:
  * `R` é a última versão com decisão humana explícita de suficiência; `C` é a versão operacional efetivamente autorizada pelo boundary canônico de preparação.
  * `C` acompanha a versão atual quando `R = C` ou quando a transição resolvida for deterministicamente `sem mudança material` ou `evolução compatível`, sem escrita artificial em `reviewed_input_catalog_version`.
  * Remoção, restrição, reinterpretação, ambiguidade ou mudança fora da allowlist conservadora exigem revisão E20.6.5; falhas permanecem fechadas e a IA não classifica compatibilidade estrutural.
  * E19.2 pré-handoff, workspace E19.5 e geração E19.5 devem consumir o mesmo número concreto `C`; nenhum consumidor pode inferir `latest`, maior versão ou substituir `C` por `R`.

20.2.8.5 Draft, gates e experiência administrativa

* Status: Implementados; publicação de nova versão permanece sujeita a handoff repo-only, validações e decisão humana.
* Conteúdo:
  * O draft pode ser resolvido e validado administrativamente, mas nunca é operacional; qualquer edição material torna stale as evidências dependentes.
  * O gate pré-publicação separa suficiência taxonômica E20.6 de validade estrutural das configurações E19.2 pré-handoff e E19.5, cobre com paginação e cardinalidade exata somente contas ativas com entitlement comercial elegível, plano válido e demais requisitos operacionais, e bloqueia diante de truncamento, cardinalidade divergente ou configuração operacional inválida/ilegível. LPs e configurações históricas de contas inativas ou inelegíveis permanecem preservadas sem bloquear a publicação global.
  * A leitura administrativa integral permanece stateless e linear no volume consultado, retendo no máximo duas páginas válidas por fluxo, além da taxonomia e dos payloads correntes. Falhas semânticas preservam a precedência original e a leitura restante com descarte limitado; falhas de transporte ou completude interrompem novos fetches, observam as pendências e nunca retornam prova parcial. O limite de páginas não representa teto de bytes ou RSS, e as consultas paginadas não constituem snapshot transacional.
  * Fingerprint operacional e contagem de incompatibilidades usam a mesma emissão integral, vinculada ao conteúdo candidato exato. Leitura, validação e preparação rechecam a identidade material integral do draft após o scan e exigem recarga diante de divergência; a reconciliação mantém suas revalidações próprias, sem acrescentar gate de fingerprint operacional ou contagem de incompatibilidades.
  * E20.2 define e valida fields; E19.5 governa continuidade da identidade comercial; E20.6 decide somente suficiência factual. No MVP, `funnel_stage`, `transaction_intent` quando aplicável, `primary_conversion_goal` e `primary_service_or_offer` bloqueiam a publicação quando retirados ou alterados de modo `review_required` sem autoridade E19.5 específica, independentemente da E20.6; `compatible_evolution`, inclusive expansão estrita de `allowedValues`, permanece permitida, e field novo não adquire autoridade de identidade.
  * Validação e handoff congelam fingerprints distintos do conteúdo do draft e da coleção operacional completa; qualquer drift posterior de taxonomia, configurações, LPs ou elegibilidade deixa a evidência stale e exige nova preparação antes da revisão/merge.
  * A visão agregada deve evoluir `/admin/estrutura-lp?view=entradas`; `/admin/taxonomia/[taxonId]` permanece responsável pela avaliação individual E20.6.5. Não criar nova rota de primeiro nível; qualquer proposta de nova rota depende de insuficiência comprovada das superfícies existentes.
  * A primeira entrega preserva histórico imutável, retirada forward-only de fields publicados e snapshots/configurações na versão efetivamente usada; não inclui rollback, múltiplos drafts, targeting por taxon, job, fila, agente, automação recorrente ou engine genérica de diff.

20.2.9 Escopo comercial da LP e reconciliação da identidade

20.2.9.1 Objetivo e status

* Objetivo: substituir a representação singular de oferta por um escopo comercial capaz de expressar uma oferta, algumas ofertas ou o portfólio amplo, reconciliando a continuidade da identidade E19.5 sem alterar snapshots históricos.
* Status: Em andamento em duas etapas. A Etapa 1 foi concluída e incorporada à `main` pelo PR #826; a v6 da Etapa 2 foi publicada em Production pelo PR #830 e reconciliada após o PR #836, com `R=6` e draft ausente. O fechamento permanece bloqueado somente pelo corretivo e pela retomada do QA do formulário operacional.

20.2.9.2 Bootstrap mantendo v5

* Status: Concluído e incorporado à `main` pelo PR #826, preservando `CURRENT=5` e o registry publicado v1–v5 nesse checkpoint.
* Conteúdo:
  * Mantém `CURRENT=5`, registry publicado v1–v5 e toda operação do cliente em v5.
  * Adiciona ao contrato E20.2 o value type administrativo `offering_scope`, com modos técnicos `single | multiple | portfolio` e rótulos futuros `Uma oferta | Algumas ofertas | Todo o portfólio`.
  * `offerings` permanece entrada livre: não é validado semanticamente, restringido ou derivado de `business_offerings_summary`, que continua opcional, não exaustivo e sem função de catálogo ou whitelist; após `trim`, a lista rejeita duplicidades case-insensitive e exige uma oferta distinta em `single`, pelo menos duas em `multiple` e pelo menos uma em `portfolio`.
  * O resolver usado pelo gate E20.2.8 projeta em memória os dois fields v5 para os dois fields futuros somente quando valida um registry candidato que os retire, canonicaliza e falha fechado para legado malformado, sem persistência.
  * O Admin recebe somente o reconhecimento mínimo do novo value type para visualizar/avaliar draft; não há registry v6 publicado, nova identidade E19.5, UI operacional do cliente, geração/snapshots v6, migration, DDL, ACL ou nova residência.

20.2.9.3 Contrato e limites definidos

* Status: Definidos.
* Conteúdo:
  * A próxima versão executável preserva v1–v5, introduz `landing_page_offering_scope` e `landing_page_offering_scope_description` e retira os fields singulares somente de forma forward-only.
  * E20.2 mantém a autoridade de tipo, validação, canonicalização e igualdade material; E19.5 passa a considerar `funnel_stage`, `transaction_intent` quando aplicável e `landing_page_offering_scope` como núcleo de identidade, enquanto `primary_conversion_goal` permanece estratégia obrigatória fora desse núcleo.
  * A adaptação lazy cobre E19.2 pré-handoff e E19.5 sob o mesmo `C`, sem regravar snapshots, criar residência, schema, migration, ACL ou autoridade paralela.
  * A nova versão só pode tornar-se atual após os gates E20.2.8 e E20.6 aplicáveis; a configuração mínima dos novos fields não reabre home, detalhe, preview, grupos, A/B, prompt, algoritmo de geração ou renderer.

20.2.9.4 Draft, revisão e publicação da v6

* Status: v6 publicada em Production pelo PR #830, com registry repo-only e `CURRENT=6`; reconciliação canônica concluída após o PR #836, com `reviewed_input_catalog_version=6` e draft removido somente após a leitura final positiva. O QA operacional permanece pendente apenas pelo defeito focal de preservação do formulário após erro de campo corrigível.
* Sequência:
  * o lifecycle E20.2.8 criou exatamente o draft v6 a partir da `main` ainda em v5;
  * as configurações operacionais completas foram validadas, a E20.6.5 pré-publicação resultou `sufficient` sem gaps ou refinamentos e a decisão humana vigente foi vinculada aos fingerprints revalidados;
  * o PR #830 reconciliou identidade E19.5, UI operacional, save/reload, geração e snapshots e publicou a v6 no registry repo-only com `CURRENT=6`;
  * o Preview do artefato v6 foi aprovado como gate de build/artefato; como Preview e Production compartilham o Supabase, a transição material exige `R=6` e a reconciliação canônica é exclusiva de Production, o QA operacional completo foi transferido, sem dispensa, para imediatamente após essa reconciliação, sem bypass ou escrita antecipada no marcador;
  * o PR #836 reutilizou a canonicalização da E20.6, preservou a prova do fingerprint legado e permitiu a reconciliação somente após igualdade material e revalidação de conteúdo, taxon, cadeia, pesquisa e versão; a ação canônica avançou `R` para `6`, confirmou a leitura final e removeu o draft sem intervenção manual;
  * o QA operacional pós-reconciliação encontrou perda visual de valores válidos e revisões hidden após `invalid_values` de `landing_page_offering_scope`, causada pelo reset nativo da Form Action; o corretivo focal preserva o snapshot somente para erros de campo corrigíveis, mantém conflitos e falhas de autoridade fechados e direciona o foco ao textarea editável de ofertas antes da retomada do QA completo.

20.3 Perfil de orientação para geração

20.3.1 Objetivo e status
- Objetivo histórico: orientar a geração de `landing_page` por perfil versionado de taxon, com recomendações baseadas no catálogo histórico da E18.5.
- Status: Retirada concluída pela E22.1.4 em 19/08/2026; consumidores, superfícies administrativas, workload e validações foram removidos no PR #781, e as duas tabelas e quatro RPCs foram removidas pela migration `20260819153112` no PR #782.
- Destino: sem substituto. A prova read-only pós-apply confirmou ausência dos objetos retirados, preservação de `tg_set_updated_at`, 24 registros em `taxon_market_research` e 379 registros em `taxon_market_research_items`; migrations históricas permanecem preservadas.

20.5 Seleção da pesquisa integral `end_customer` por taxon

20.5.1 Objetivo e status

* Objetivo: permitir que um taxon ativo possua exatamente uma versão integral `end_customer` explicitamente selecionada por decisão humana autorizada e que essa versão possa ser lida integralmente por um boundary server-side, com validação de identidade e falha fechada.
* Status: Concluída e ativada em 15/08/2026; PR #746 mergeado, migration aplicada, prova SQL aprovada e smokes autenticados gate-on aprovados em Preview e Production. O taxon `corretor-imoveis` mantém a versão integral `end_customer` v1 selecionada por decisão humana.

20.5.2 Registros do recorte

* Banco:

  * Ajustados:

    * `public.business_taxons`

* Repositório:

  * Criados:

    * `lib/conversion-content/landing-page/taxon-preparation/contracts.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/research.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`
    * `lib/conversion-content/landing-page/taxon-preparation/index.ts`
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapterCore.ts`
    * `components/admin/AdminTaxonResearchSelectionForm.tsx`
    * `supabase/migrations/20260814174500_e20_5_selected_end_customer_research_version.sql`
    * `supabase/snippets/e20_5_selected_end_customer_research_version_verify.sql`
  * Ajustados:

    * `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
    * `app/admin/(protected)/taxonomia/actions.ts`
    * `lib/admin/adapters/adminReadOnlyAdapter.ts`
    * `lib/admin/adapters/adminReadOnlyTypes.ts`
    * `lib/admin/adapters/adminTaxonomyAdapter.ts`
    * `next.config.js`
    * `package.json`
* Referências:

  * Plano-base E20.5: `docs/lousa-plano-base-e20-5.md` — seções 3.1, 3.2 e 3.3.
  * Configuração do gate: `docs/platform-config.md` — seção 3.5, secrets e variáveis server-side no Vercel.
  * Contrato de banco: `docs/schema.md` — seção 1.11.

20.5.3 Leitura e validação repo-only da pesquisa integral

* Status: Concluída, validada e integrada à `main` pelo PR #746.
* Conteúdo:

  * O boundary repo-only deriva exclusivamente o path canônico de uma versão candidata `end_customer`, confina a leitura a `docs/pesquisas-brutas/` e nunca consulta a API do GitHub.
  * A leitura preserva o conteúdo integral e valida taxon ativo, slug canônico, versão inteira positiva e metadata única na seção `## 1. Identificação e uso`; path inválido, arquivo ausente, falha operacional, metadata incompatível ou conteúdo vazio falham sem payload parcial.
  * Casos determinísticos cobrem sucesso integral e falhas de versão, path, leitura, metadata e conteúdo; o script dedicado integra `npm run check`.

20.5.4 Persistência e seleção humana mínima

* Objetivo: adicionar a referência mínima de versão selecionada e permitir sua alteração somente por ação humana administrativa explícita, reutilizando a validação da E20.5.3.
* Status: Concluída e ativada; migration aplicada, prova SQL aprovada e seleção humana validada em Preview e Production.
* Conteúdo:

  * A migration adiciona somente `selected_end_customer_research_version integer null`, com check positivo quando preenchida, sem nova tabela, lifecycle ou histórico; ela preserva RLS/policies, revoga o `UPDATE` de tabela inteira de `service_role` e mantém somente os grants de coluna usados pelo editor vigente (`name`, `slug`, `is_active`) e pela seleção. O snippet read-only comprovou esse conjunto exato após o apply.
  * O gate server-only `E20_5_SELECTED_RESEARCH_ENABLED` aceita apenas o literal `true` e antecede toda leitura ou mutação da coluna. Com o gate desligado, a interface e a ação novas permanecem inacessíveis, sem fallback para schema ausente.
  * A tela existente de detalhe do taxon recebe formulário separado com rótulos e associações programáticas; a Server Action exige `requirePlatformAdmin`, valida a candidata repo-only e atualiza somente a seleção por `id + slug + is_active`, com `.maxAffected(1)`.
  * Apply canônico, prova SQL, ativação da flag e redeploy foram concluídos; os smokes autenticados gate-on aprovaram ausência de seleção, candidata inválida, seleção válida após reload, acesso negado a papel não autorizado, responsividade móvel e ausência de erros observados.
  * O taxon `corretor-imoveis` possui `selected_end_customer_research_version = 1`, persistido após decisão humana explícita e confirmado no banco e na interface hospedada.

20.5.5 Contrato de consumo da seleção válida

* Objetivo: disponibilizar ao recorte seguinte uma leitura única que prove taxon ativo e pesquisa integral selecionada válida, sem antecipar o gate final de preparação.
* Status: Concluída, integrada à `main` e validada com a funcionalidade ativa em Preview e Production.
* Conteúdo:

  * O adapter server-only exige `E20_5_SELECTED_RESEARCH_ENABLED` antes de criar o client Supabase ou alcançar a consulta da nova coluna.
  * A leitura valida o identificador, exige taxon existente e ativo, distingue `NULL` legítimo de seleção inválida e carrega exatamente a versão persistida pelo boundary repo-only da E20.5.3.
  * O resultado tipado separa funcionalidade desabilitada, taxon ausente/inativo, ausência de seleção, versão ou identidade inválida, falha de banco e falhas de arquivo, filesystem, metadata ou conteúdo.
  * Somente o sucesso fornece taxon, slug, versão selecionada, conteúdo integral e a projeção derivada `selectedResearchValid: true`; nenhuma marca `prepared` é criada ou persistida.
  * Casos determinísticos cobrem todos os estados públicos e comprovam que o gate antecede o acesso à coluna; as validações consolidadas permanecem verdes.

20.6 Avaliação de suficiência factual da E20.2 por taxon

20.6.1 Objetivo e status

* Objetivo: avaliar a suficiência factual da pesquisa integral `end_customer` selecionada pela E20.5 em conjunto com uma versão executável explícita do catálogo E20.2 e definir o predicado final de preparação do taxon, sem autorizar geração.
* Status: E20.6.3 e E20.6.4 concluídas e operacionais desde 15/08/2026; o expand gate-off da E20.6.5 foi mergeado no #795 e sua migration incremental foi aplicada, permanecendo pendentes o merge do PR corretivo pós-apply, a prova operacional, o rollout e o contract final.

20.6.2 Registros do recorte

* Banco:
  * Ajustados:
    * `public.business_taxons`.
* Repositório:
  * Criados:
    * `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogEvaluation.tsx`;
    * `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogReview.tsx`;
    * `lib/admin/adapters/adminTaxonomyReviewPolicy.ts`;
    * `lib/conversion-content/landing-page/input-catalog/taxon-chain.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/input-catalog-review.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation-schema.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/preparation.ts`;
    * `supabase/migrations/20260815172449_e20_6_reviewed_input_catalog_version.sql`;
    * `supabase/migrations/20260820213900_e21_2_taxon_input_catalog_sufficiency_workload.sql`;
    * `supabase/snippets/e21_2_taxon_input_catalog_sufficiency_workload_verify.sql`;
    * `supabase/tests/e21_2_taxon_input_catalog_sufficiency_workload.test.sql`;
    * `supabase/snippets/e20_6_reviewed_input_catalog_version_verify.sql`.
  * Ajustados:
    * `app/admin/(protected)/estrutura-lp/page.tsx`;
    * `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`;
    * `app/admin/(protected)/taxonomia/actions.ts`;
    * `lib/admin/adapters/adminLandingPageStructureAdapter.ts`;
    * `lib/admin/adapters/adminReadOnlyAdapter.ts`;
    * `lib/admin/adapters/adminReadOnlyTypes.ts`;
    * `lib/admin/adapters/adminTaxonomyAdapter.ts`;
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts`;
    * `lib/conversion-content/adapters/selectedEndCustomerResearchAdapterCore.ts`;
    * `lib/conversion-content/landing-page/input-catalog/index.ts`;
    * `lib/conversion-content/landing-page/input-catalog/resolver.ts`;
    * `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/contracts.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/index.ts`;
    * `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts`;
    * `supabase/tests/e21_2_3_openai_workload_operational_configurations.test.sql`.
* Updates:
  * Aplicados:
    * `prod#14`;
    * `prod#16`;
    * `prod#17`.
* Referências:
  * Plano-base E20.6: `docs/lousa-plano-base-e20-6.md` — seções 2 e 3.
  * Contrato de banco: `docs/schema.md` — seção 1.11.
  * Configuração do gate: `docs/platform-config.md` — seção 3.5.
  * Boundary de preparação: `docs/base-tecnica.md` — seção 3.15.7.
  * Fluxo assistido: `docs/automations.md` — seção 3.10.

20.6.3 Avaliação assistida e registro humano da suficiência

* Status: Concluída em 15/08/2026; a reavaliação real de `corretor-imoveis` contra a versão executável E20.2 `4` resultou em `suficiente`, foi aceita por decisão humana e teve `reviewed_input_catalog_version = 4` registrado e confirmado após reload no Admin autenticado.
* Conteúdo:
  * usar o fluxo humano `Admin → Codex → Admin`, com IA em fluxo controlado no ambiente interno do Codex e sem workload OpenAI no runtime do LP Factory;
  * confrontar integralmente a pesquisa E20.5 autorizada com uma versão executável E20.2 escolhida explicitamente pelo humano, resolvendo e comparando `starter`, `lite`, `pro` e `ultra`, sem `latest` ou fallback;
  * a IA recomenda `suficiente`, `gaps candidatos` ou `inconclusivo`; a decisão final pertence ao humano;
  * somente após suficiência aceita pelo humano registrar a versão avaliada em `business_taxons.reviewed_input_catalog_version`; gap factual real retorna ao recorte próprio da E20.2 e exige nova execução da E20.6 após a evolução aplicável;
  * reutilizar a Taxonomia administrativa existente para orientar a ida ao Codex por instrução copiável que inclua a cadeia taxonômica autoritativa integral e para registrar ou reabrir a avaliação, sem nova rota nem integração direta com o Codex;
  * invalidar a avaliação quando a seleção E20.5 mudar efetivamente e exigir reabertura explícita antes de alterar identidade ou cadeia taxonômica própria ou ancestral que afete avaliação preenchida do taxon ou de descendente.

20.6.4 Gate derivado de preparação do taxon

* Status: Concluída em 15/08/2026; predicado derivado comprovado para a versão executável explicitamente requerida `4`.
* Conteúdo:
  * derivar deterministicamente a preparação por `taxon ativo + E20.5 selecionada/válida + reviewed_input_catalog_version compatível com a versão executável explicitamente requerida`;
  * falhar fechado para ausência ou incompatibilidade e não persistir estado adicional de prontidão;
  * a prova real de `corretor-imoveis`, com pesquisa integral `end_customer` v1, `reviewed_input_catalog_version = 4` e `requiredInputCatalogVersion = 4`, retornou `prepared: true`;
  * o controle negativo com `requiredInputCatalogVersion = 3` retornou `INPUT_CATALOG_REVIEW_VERSION_MISMATCH`, comprovando igualdade exata sem `latest` ou fallback;
  * preservar E19.2, E19.3 e E19.4 sem alteração neste recorte.

20.6.5 Avaliação factual com IA no runtime do Admin

* Status: expand gate-off mergeado no #795 e migration `20260820213900` aplicada; o PR corretivo pós-apply repara os artefatos de prova sem alterar o schema e já revalidou testes SQL, snippets read-only, invariantes e Security Controls, enquanto seu merge, gates específicos, prova real, rollout e contract final permanecem pendentes. A revisão operacional `2` de `taxon_input_catalog_sufficiency_evaluation` está ativa em Preview e Production.
* Conteúdo:
  * internalizar na Taxonomia administrativa existente a avaliação semântica não autoritativa nos modos sistemático e hipótese humana, preservando a decisão administrativa explícita, a revalidação determinística e o gate E20.6.4 sem IA;
  * o checkpoint pré-integração materializou domínio e contratos, identidade e reconstrução/revalidação do contexto, Structured Output estrito, UI route-local apresentacional não montada e testes com portas e fakes injetados, sem alterar `lib/openai-workloads/`, criar configuração repo-only, chamar provider real ou declarar a E20.6.5 completa;
  * o #795 implementou `taxon_input_catalog_sufficiency_evaluation` no agregado E21.2, com configuração inicial aprovada `gpt-5.6-terra` + `reasoning.effort=low`; mudanças posteriores de modelo ou effort ficam sob governança E21 e decisão humana;
  * `OPENAI_OPERATIONAL_CONFIG_ENABLED=true` já está ativo em Preview e Production e deve permanecer ativo; a E20.6.5 apenas verifica essa condição, sem etapa futura de habilitação do gate da E21.2;
  * a migration do novo workload foi aplicada e a revisão operacional `2` de `taxon_input_catalog_sufficiency_evaluation` está ativa em Preview e Production; a habilitação de `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` permanece sujeita ao rollout próprio, sem inferir seu estado pela revisão ativa; resolver os parâmetros exclusivamente pelo lifecycle dinâmico Supabase e sua API pública, sem consulta direta, configuração paralela ou transporte exclusivo da E20.6.5;
  * a avaliação exige uma versão executável E20.2 `N` escolhida explicitamente e mantida apenas no estado transitório da UI; a leitura canônica carrega a pesquisa E20.5 selecionada, valida e resolve `N` em `starter`, `lite`, `pro` e `ultra`, e somente a decisão humana de suficiência pode gravar `reviewed_input_catalog_version = N`; `loadTaxonPreparationForReviewedVersion()` permanece para E20.6.4 e consumidores posteriores;
  * `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` bloqueia servidor e UI; em Preview/Production, mesmo gate-on recusa `repo_catalog` e a revisão bootstrap `1`, exigindo fonte ativa `supabase_operational` em revisão operacional `2` ou posterior; somente o retorno explícito `ROLLOUT_GATE_OFF` preserva o handoff Codex;
  * `confirm_sufficient` aceita somente resultado `sufficient`; para `candidate_gaps`, o humano seleciona e reconhece somente gaps reais, recebendo handoff E20.2 transitório sem escrita, ou limpa a seleção e usa `reject_candidates_and_confirm_sufficient` para rejeitar todos e confirmar `N`, com `kind` distinto por decisão e sem veto da IA;
  * somente `ROLLOUT_GATE_OFF` mantém handoff Codex e registro legado; gate-on comprovado e `OPERATIONAL_CONFIGURATION_UNPROVEN` ocultam e bloqueiam ambos server-side, sem gravação, fallback Codex ou rotulagem gate-off, preservando reabertura;
  * o #795 não constitui fechamento: a decisão expand/contract está aprovada, o expand gate-off foi mergeado e sua migration foi aplicada; o PR corretivo deve ser mergeado antes do rollout do gate E20.6.5 em Preview → decisão humana → repetição controlada em Production; o PR contract remove definitivamente o legado e atualiza os documentos finais.

20.7 Liberação taxonômica para geração de Landing Pages

20.7.1 Objetivo e status

* Objetivo: resolver a fonte de conhecimento de mercado mais específica e segura para o escopo comercial de uma LP, preservando a autoridade factual E20.2, a identidade taxonômica da conta e os boundaries E19.3/E19.4.
* Status: Concluída em 29/08/2026; E20.7.3 e E20.7.4 implementadas, validadas deterministicamente e integradas à `main` pelo PR #835. A migration E20.7.4 foi aplicada automaticamente e a reconciliação v6 do taxon piloto está confirmada. Prova, promoção e ativação hospedadas de `landing_page_dynamic_market_research` ficam condicionadas ao futuro recorte de integração E19.3 que consumir a saída E20.7 e não constituem pendência deste recorte.

20.7.3 Resolver determinístico de conhecimento

* Status: Concluída no boundary E20.7 e validada deterministicamente; Automação: não.
* Conteúdo:
  * resolver `single | multiple | portfolio` por APIs públicas canônicas, com matching por nome/aliases, descendência ativa, preparação E20.5/E20.6 e equivalência factual conservadora; autorizar `specialized_deep` somente quando `matchSource` contiver `alias_exact`, `alias_normalized`, `taxon_name_exact` ou `taxon_name_normalized`, mantendo resultado apoiado apenas em `fts`, `trgm` ou `taxon_slug_normalized` como `dynamic_required` sem recusar nem invalidar a oferta;
  * distinguir falha operacional de ausência ou ambiguidade legítima e produzir `specialized_deep | base_only | dynamic_required` sem recusa semântica da oferta;
  * reutilizar a cadeia taxonômica paginada compartilhada e terminar em saída tipada imutável, sem persistência própria, IA, integração E19 ou mudança em geração, snapshot, materialização ou renderer;
  * operar com `CURRENT=6` já na `main`; a reconciliação v6 necessária ao taxon piloto `corretor-imoveis` está confirmada com `reviewed_input_catalog_version=6`, sem validação hospedada adicional necessária para encerrar a E20.7.3.

20.7.4 Complemento dinâmico controlado

* Status: Concluída no boundary E20.7 e integrada à `main` pelo PR #835; Automação: sim; categoria `2.1.3 — Automação com IA em fluxo controlado`.
* Conteúdo:
  * iniciada somente após a implementação da E20.7.3 e sua aprovação pelo Analista; o confronto prévio com o PR #831 não encontrou sobreposição material aberta, preservando fora deste recorte as alterações paralelas daquele PR;
  * executar server-side uma única requisição foreground à Responses API com somente Web Search hospedado e Structured Output estrito, aceitando uma ou duas chamadas fundamentadas e falhando tecnicamente sem invalidar a oferta;
  * governar o workload `landing_page_dynamic_market_research` pelos boundaries E21.1/E21.2, com configuração própria comprovada antes da ativação humana por ambiente e sem agente, retry, fallback, job, fila, RAG, cache global ou nova residência de negócio;
  * usar `gpt-5.6-luna + high` como configuração inicial autorizada e única combinação elegível para `save`/`promote` desse workload; `low`, `max` e a matriz comparativa anterior permanecem fora por decisão humana registrada no #837;
  * ampliar o agregado E21.2 por migration forward-only sem nova tabela ou coluna; a migration `20260829171107_e20_7_4_dynamic_market_research_workload` foi aplicada automaticamente após o merge do PR #835, preservando runtime anterior, segurança e falha fechada até configuração ativa válida;
  * manter Development em baseline repo-only determinístico; Preview e Production possuem o workload em bootstrap revisão `1`, sem transporte autorizado. Provar, promover e ativar revisão `supabase_operational` `2` ou posterior somente no futuro recorte E19.3 que consumir a saída E20.7; esse rollout não reabre nem mantém pendente a E20.7;
  * validar prompt e schema versionados, orçamento conservador sem truncamento, fontes HTTPS retornadas pelo provider, rejeição de URL inventada, telemetria segura e handoff tipado `base_plus_dynamic | base_only`, sem persistir pesquisa ou modificar a E20.2;
  * preservar a atribuição financeira causal sob E21.4 e manter consumo pela geração, validação semântica de oferta e qualquer mudança E19 em recortes próprios posteriores.

21. E21 — Gestão e governança dos workloads OpenAI
- Objetivo: gerir e governar os workloads OpenAI por recortes aprovados, com configuração explícita, observabilidade segura, leitura administrativa e configuração operacional dinâmica por ambiente, sem otimização automatizada.
- Status: a fundação E21.1 permanece preservada; a E21.2, incluindo o catálogo operacional da E21.2.5, está concluída com apply e gates hospedados aprovados; o plano-base v1 da E21.3 já está na `main`, enquanto a implementação experimental da E21.3.3 permaneceu no PR #819, fechado sem merge por repriorização humana; a E21.4 está concluída em Production com apply, gates de banco, instrumentação financeira, smoke, corte canônico e QA hospedado aprovados. A E21.3.4 permanece não iniciada e depende de nova decisão humana.

21.1 Fundação, normalização e leitura dos workloads OpenAI

21.1.1 Objetivo e status
- Objetivo: estabelecer catálogo tipado e resolução explícita dos workloads OpenAI, integrar os consumidores de produto à configuração e à observabilidade comuns e expor inventário administrativo read-only.
- Status: Fundação E21.1 implementada, validada e preservada; o catálogo repo-side possui seis workloads de produto e uma referência operacional, sem mudar a natureza repo-only e read-only do boundary.

21.1.2 Registros do recorte
- Repositório:
  - Criados:
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/resolve.ts`
    - `lib/openai-workloads/observability.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `lib/openai-workloads/index.ts`
    - `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
    - `app/admin/(protected)/workloads-openai/page.tsx`
  - Ajustados:
    - `app/a/[account]/actions.ts`
    - `app/admin/(protected)/perfis-de-orientacao/page.tsx`
    - `app/admin/(protected)/perfis-de-orientacao/[taxonId]/page.tsx`
    - `app/admin/(protected)/perfis-de-orientacao/_components/GenerationProfileEditor.tsx`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
    - `lib/conversion-content/adapters/landingPageGenerationProfileOpenAiAdapter.ts`
    - `lib/conversion-content/commercial-activation/draft-generation.ts`
    - `lib/conversion-content/commercial-activation/validation-cases.ts`
    - `lib/conversion-content/landing-page/generation-profile/index.ts`
    - `lib/conversion-content/landing-page/generation-profile/proposal-server.ts`
    - `lib/conversion-content/landing-page/generation-profile/proposal.ts`
    - `lib/conversion-content/landing-page/generation-profile/validation-cases.ts`
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `components/admin/adminNavigation.ts`
    - `package.json`
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — 3.16.
  - Configuração operacional: `docs/platform-config.md` — 3.5 e 6.3.

21.1.3 Catálogo estrutural e resolução explícita
- Status: Implementada e validada.
- Conteúdo:
  - O boundary transversal `lib/openai-workloads/` mantém registry interno, repo-only e profundamente imutável, com seis configurações de produto e uma referência operacional separada do Supabase Inspect.
  - Dois workloads textuais preservam `gpt-5.4-mini + none`; a E19.4 acrescenta `landing_page_draft_generation` e o workload de mídia independente `landing_page_draft_image_generation`; a E20.6.5 acrescenta `taxon_input_catalog_sufficiency_evaluation` com baseline `gpt-5.6-terra + low`; e a E20.7.4 acrescenta `landing_page_dynamic_market_research` com configuração inicial de Development `gpt-5.6-luna + high` e política Web Search code-owned, sem transportar parâmetros inaplicáveis entre modalidades.
  - O resolver público discrimina `responses_text | image_generation`, aceita somente workloads de produto conhecidos, falha fechado para identidade desconhecida ou referência operacional e projeta inventário seguro com classificação, origem, revisão e configuração efetiva.
  - Ambiente, uniões discriminadas de resultado/evento e normalização de usage foram definidos como contratos puros comuns e integrados às chamadas reais na E21.1.4.
  - Os casos executáveis fundacionais cobrem unicidade, resolução, separação effective/reference, imutabilidade, projeção sem secrets, ambiente, usage, evento e ausência de transporte, persistência ou payload funcional no boundary.
  - Nenhum banco, integração remota, cliente universal, preço, prompt, schema funcional ou fallback silencioso foi criado.

21.1.4 Integração dos consumidores e observabilidade comum
- Status: integração técnica repo-side validada para os seis workloads de produto vigentes; as execuções integradas hospedadas da E19.4 comprovaram os dois workloads de draft, enquanto a prova hospedada da E20.6.5 permanece condicionada ao rollout próprio e a da E20.7.4 fica condicionada ao futuro recorte E19.3 que consumir sua saída.
- Conteúdo:
  - Consumidores textuais resolvem modelo e reasoning effort explícitos; o workload de imagem resolve somente sua configuração de mídia. Prompts, schemas, limites, persistência e fallbacks funcionais permanecem nos domínios consumidores.
  - Eventos textuais e de imagem registram por tentativa somente metadados operacionais seguros e aplicáveis; métricas ausentes permanecem `null` e nenhum prompt, resposta integral, payload de negócio, PII ou secret é registrado.
  - Os consumidores ativos não leem variáveis legadas de modelo nem mantêm hardcode client ou cálculo monetário local; as variáveis externas permanecem apenas como legado temporário de reversão conforme a configuração operacional canônica.
  - O transporte OpenAI comercial foi isolado no adapter previsto e novos drafts registram workload, origem, revisão, modelo e effort resolvidos na proveniência existente, sem migration, backfill ou persistência de usage.
  - Validators determinísticos exercitam os seis workloads de produto, separação textual/mídia, política Web Search aplicável somente ao complemento dinâmico, configuração inválida sem transporte, parâmetros exatos, IDs de provider, usage aplicável, eventos discriminados e ausência de referências legadas.
  - As execuções integradas hospedadas da E19.4 comprovaram `landing_page_draft_generation` e `landing_page_draft_image_generation` e substituíram, por decisão humana, o gate de canários isolados; não permanece pendência de canários isolados.
  - Permanece fora do PR #710 a correção separada da automação de smoke para remover senha de logs e artifacts, gerar credenciais não previsíveis e tratar colisões corretamente.

21.1.5 Inventário read-only no Admin Dashboard
- Status: inventário repo-side vigente com sete itens; o QA pós-merge da E22.1.4 aprovou os cinco itens então existentes em Preview e Production; a prova hospedada da E20.6.5 permanece no rollout próprio, e a da E20.7.4 fica condicionada ao futuro recorte E19.3 consumidor.
- Conteúdo:
  - A rota protegida `/admin/workloads-openai` integra o shell e a navegação administrativos vigentes e projeta diretamente da API pública do boundary os sete itens repo-side, sem adapter, API, componente client ou controle de mutação novos.
  - Os seis workloads de produto exibem ambiente observado, configuração efetiva, origem e revisão; o Supabase Inspect permanece diferenciado como referência operacional externa e informa explicitamente `Ambiente da execução: não verificado nesta página`.
  - A superfície é responsiva, sem consulta runtime à OpenAI, GitHub ou Vercel e sem configuração remota, métricas históricas ou capacidades inexistentes.
  - As evidências hospedadas aprovaram desktop, viewport mobile de 390 × 844 sem overflow, navegação lógica por TAB com foco visível, acesso positivo de `platform_admin` e bloqueio da identidade preexistente sem esse papel.

21.2 Configuração operacional dinâmica dos workloads OpenAI

21.2.1 Objetivo e status
- Objetivo: permitir configuração ativa por ambiente e workload, com candidata, validação, ativação humana, rollback e mudança ordinária sem redeploy.
- Status: concluída em 28/08/2026; fonte operacional, catálogo e correção do transporte de conflitos pela Data API aplicados, com cutover e gates hospedados aprovados.
- O recorte preserva a E21.1 como boundary transversal, mantém Development determinístico/local e deixa a E21.3 prevista, sem início de execução.

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
  - Ajustados:
    - `public.save_openai_workload_configuration_candidate_v1`
    - `public.discard_openai_workload_configuration_candidate_v1`
    - `public.promote_openai_workload_configuration_candidate_v1`
    - `public.activate_openai_workload_configuration_revision_v1`
    - `public.rollback_openai_workload_configuration_revision_v1`
    - `public.check_openai_model_catalog_configuration_available_v1`
    - `public.set_openai_model_catalog_model_availability_v1`
    - `public.set_openai_model_catalog_parameter_availability_v1`
- Repositório:
  - Criados:
    - `app/admin/(protected)/workloads-openai/_components/OpenAiConfigurationManager.tsx`
    - `app/admin/(protected)/workloads-openai/_proof.ts`
    - `app/admin/(protected)/workloads-openai/actions.ts`
    - `app/admin/(protected)/workloads-openai/commercialProof.ts`
    - `app/admin/(protected)/workloads-openai/proofCore.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.tsx`
    - `lib/openai-workloads/adapters/operationalConfigurationAdapter.ts`
    - `lib/openai-workloads/adapters/operationalConfigurationAdapterCore.ts`
    - `supabase/migrations/20260820190422_e21_2_3_openai_workload_operational_configurations.sql`
    - `supabase/snippets/e21_2_3_openai_workload_operational_configurations_verify.sql`
    - `supabase/tests/e21_2_3_openai_workload_operational_configurations.test.sql`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiModelCatalogManager.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiWorkloadDetail.tsx`
    - `app/admin/(protected)/workloads-openai/catalogActions.ts`
    - `lib/openai-workloads/adapters/modelCatalogAdapter.ts`
    - `lib/openai-workloads/adapters/modelCatalogAdapterCore.ts`
    - `supabase/migrations/20260823144334_e21_2_5_openai_model_catalog.sql`
    - `supabase/snippets/e21_2_5_openai_model_catalog_verify.sql`
    - `supabase/tests/e21_2_5_openai_model_catalog.test.sql`
    - `supabase/migrations/20260827203000_postgrest_safe_application_conflicts.sql`
    - `supabase/snippets/postgrest_safe_application_conflicts_verify.sql`
    - `supabase/tests/postgrest_safe_application_conflicts.test.sql`
  - Ajustados:
    - `app/admin/(protected)/workloads-openai/page.tsx`
    - `lib/access/guards.ts`
    - `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
    - `lib/conversion-content/commercial-activation/draft-generation.ts`
    - `lib/conversion-content/commercial-activation/validation-cases.ts`
    - `lib/lp-builder/landing-page-draft-generation-validation-cases.ts`
    - `lib/lp-builder/landingPageDraftGeneration.ts`
    - `lib/lp-builder/landingPageDraftImageGeneration.ts`
    - `lib/lp-builder/landingPageRevision.ts`
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/index.ts`
    - `lib/openai-workloads/registry.ts`
    - `lib/openai-workloads/resolve.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `lib/supabase/service.ts`
- Referências:
  - Plano-base v1: `docs/lousa-plano-base-e21-2.md`.
  - Plano-base v2 aprovado: `docs/lousa-plano-base-e21-2-v2.md`.
  - Matriz integral de tratamentos: `docs/matriz-consolidacao-e21-2.md`.
  - Plano-base v2 aprovado da E21.2.5: `docs/lousa-plano-base-e21-2-5.md`.
  - Matriz de consolidação da E21.2.5: `docs/matriz-consolidacao-e21-2-5.md`.
  - Contrato técnico: `docs/base-tecnica.md` — 3.12 e 3.16.
  - Configuração operacional: `docs/platform-config.md` — 3.5 e 6.3.
  - Contrato de banco: `docs/schema.md` — 1.28, 1.29, 1.30, 3.7 e 3.9.

21.2.3 Fonte operacional dinâmica e resolução por ambiente/workload
- Status: Concluída; fonte operacional aplicada e cutover aprovado em Preview e Production.
- Automação: não.
- As migrations forward-only materializam o agregado de configuração, revisões validadas e ativações/rollback por `ambiente + workload`, com bootstrap exato das dez unidades de Production e Preview, lifecycle transacional, concorrência otimista, constraints unit-safe, RLS/grants mínimos e metadados de prova fechados e sanitizados.
- A migration E20.7.4 aplicada preservou o agregado e acrescentou duas unidades de `landing_page_dynamic_market_research`, totalizando doze unidades hospedadas; os read models aceitam integralmente dez ou doze unidades e rejeitam estado parcial.
- `lib/openai-workloads/` permanece o boundary público comum: resolvers assíncronos recebem ambiente explícito, Development continua no baseline local, e os cinco callsites preservam transporte, fallback funcional e proveniência ao consumir `repo_catalog` ou `supabase_operational`.
- Adapter server-side, comportamento fail-closed, shape tipado por workload, validação de snapshots funcionais, snippet SQL read-only, testes SQL e documentação canônica aplicável foram entregues; a elegibilidade corrente de novas candidatas foi posteriormente centralizada pela E21.2.5.
- A migration foi aplicada pelo workflow canônico; o snippet hospedado aprovou 10/10 verificações e o Security Controls não apresentou alerta incompatível com as tabelas ou RPCs do recorte.
- `OPENAI_OPERATIONAL_CONFIG_ENABLED=true` foi habilitada e redeployada primeiro em Preview e, somente após sua aprovação integral, em Production; os dois ambientes usam exclusivamente `supabase_operational`, enquanto Development permanece no baseline local.
- Não usar `repo_catalog` como fallback quando o gate estiver ativo; não introduzir cache, Realtime, AI Gateway, Vercel Flags, Global Config, tracing, drains, workflow ou segunda residência.
- Conflitos funcionais de versão ou revisão expostos pela Data API preservam a rejeição da tentativa sem serem transportados como falha transacional retryable; o corretivo foi aplicado e o gate hospedado confirmou ausência de retry autônomo.

21.2.4 Gestão administrativa, validação, ativação e rollback
- Status: Concluída; gestão administrativa, provas reais, lifecycle, QA hospedada e smoke mínimo de Production aprovados.
- Automação: não.
- `/admin/workloads-openai` passou a gerir ativa, candidata, prova, revisão validada pendente, ativação, histórico e rollback separadamente em Production e Preview; texto aceita somente `model + reasoning effort`, imagem somente `model + quality`, e o Supabase Inspect permanece referência read-only separada.
- A página reautoriza `platform_admin` antes do read model service-role; cada action reexecuta o guard, deriva o ator no servidor, valida unidade, versão e shape tipado, e a E21.2.5 acrescenta a revalidação de elegibilidade corrente sem alterar concorrência otimista ou estados fail-closed.
- A prova despacha fixture segura pelos quatro transportes existentes, não cria persistência funcional, benchmark, ranking ou decisão autônoma e só promove após sucesso; erro preserva a candidata e nunca altera a revisão ativa. A prova comercial reutiliza o parser comum do shape REST real de `/v1/responses`.
- O Preview aprovou os quatro transportes, criação/edição/descarte de candidata, promoção, ativação, execução subsequente com nova revisão, isolamento de Production e rollback, além de papéis positivo/negativo, desktop 1440 × 900, mobile 390 × 844, estados de sucesso/erro, reconhecimento do lifecycle e checklist proporcional WCAG 2.2.
- O smoke mínimo de Production confirmou as quatro baselines ativas e uma execução comercial real com origem `supabase_operational` e revisão 1, criando somente draft não publicado; a janela autenticada permaneceu sem erro ou warning no runtime.
- O estado operacional hospedado mantém os seis workloads de produto de Preview e Production sem candidata ou revisão pendente; `taxon_input_catalog_sufficiency_evaluation` está na revisão operacional `2` ativa em Preview e Production, e `landing_page_dynamic_market_research` já existe em ambos os ambientes no bootstrap revisão `1`, não autorizado para transporte. A prova, promoção e ativação de revisão `2` ou posterior desse workload dinâmico ficam para o futuro recorte E19.3 consumidor. Os eventos append-only dos lifecycles anteriores permanecem preservados.
- `OPENAI_API_KEY` permaneceu server-side e foi reutilizada sem cópia, exposição ou versionamento. A E21.3 não foi iniciada.

21.2.5 Catálogo administrável e UX compacta dos workloads OpenAI
- Status: Concluída em 24/08/2026; catálogo aplicado e QA hospedado/autenticado integralmente aprovado em Production.
- Automação: não.
- O catálogo global separa elegibilidade corrente de novas candidatas do lifecycle por ambiente e workload; save e promoção revalidam a combinação de forma transacional, e a prova confirma a elegibilidade imediatamente antes do transporte sem manter lock durante a chamada externa.
- Falha ou indisponibilidade exclusiva do catálogo bloqueia catálogo, save, prova e promoção, sem afetar resolução ativa, ativação de revisão validada ou rollback histórico; revisões e snapshots preservam qualquer identificador técnico com parâmetro tipado válido.
- As leituras administrativas são completas, ordenadas e fail-closed; páginas acumuladas só são aceitas no término esperado, nunca após erro ou resposta parcial.
- A superfície administrativa mantém catálogo global superior, seletor Preview/Production, lista compacta com cabeçalho sticky e um detalhe expandido; a geração de Landing Page agrupa texto e imagem apenas visualmente, preservando lifecycle independente.
- A migration foi aplicada pelo fluxo canônico; o snippet read-only aprovou 8/8 verificações e o Security Controls não apresentou alerta incompatível com tabelas, constraints, RLS, policies, grants, RPCs ou triggers do catálogo. O INFO de RLS sem policy permaneceu compatível com a residência exclusiva de `service_role`.
- O QA autenticado de Production aprovou `platform_admin` em desktop 1280 × 720 e mobile responsivo 482 × 698, sem overflow horizontal, com cabeçalho sticky, controles da superfície de 44 px ou mais, nomes/labels, lifecycle reconhecível e contraste de 5,54:1 no estado normal e 13,81:1 no hover dos botões primários.
- O papel negativo foi redirecionado para o estado de acesso indisponível, sem formulário, catálogo, lifecycle ou controle administrativo exposto. O QA não alterou catálogo, candidata, revisão ou lifecycle; a E21.3 não foi iniciada.

21.3 Evidências e avaliação de custo-benefício dos workloads OpenAI

21.3.1 Objetivo e status
- Objetivo: produzir comparações reproduzíveis por workload considerando qualidade, sucesso, necessidade de correção humana, usage, latência, custo e estabilidade.
- Status: Pausada por repriorização humana; o plano-base v1 da E21.3 já está na `main`, enquanto a implementação experimental da E21.3.3 permaneceu no PR #819, fechado sem merge.
- Registrar a E19.4 como primeiro caso real de referência, especificamente:
  - `landing_page_draft_generation`;
  - `landing_page_draft_image_generation`.
- Isso não reabre a E19.4.

21.3.3 Evidência experimental, pausa e limites de retomada
- A implementação experimental da E21.3.3 e seu QA técnico em Preview permanecem preservados no PR fechado #819, sem aceite humano final de produto/UX e sem incorporação à `main`.
- O PR #819 permanece referência histórica e técnica de retomada, incluindo plano v2, matriz, comparação Terra/Luna, decisões e aprendizados; sua implementação não constitui baseline automaticamente adotável.
- A retomada da E21.3 deve comparar e revalidar a implementação do PR #819 contra a `main` então vigente antes de decidir qualquer reaproveitamento.
- Unidade textual de comparação: `workload + modelo + reasoning effort`.
- Workloads de mídia preservam configuração e métricas próprias.
- Reutilizar observabilidade segura da E21.1.
- `docs/openai-model-snapshot.md` permanece a residência das comparações decisórias.
- Considerar, quando aplicável:
  - qualidade;
  - resultado válido;
  - correção humana;
  - input tokens;
  - cached tokens;
  - output tokens;
  - reasoning tokens;
  - latência;
  - custo financeiro;
  - estabilidade.
- Não definir vencedor ou baseline universal antes de evidência representativa.
- Não criar agora banco, tabela, rota, dashboard, job, engine, agente, automação ou infraestrutura.

21.3.4 Continuação prevista
- Status: Prevista e não iniciada; sua retomada permanece posterior à execução da E21.4 e depende de nova decisão humana.

21.4 Visibilidade financeira e atribuição de custos OpenAI

21.4.1 Objetivo e status
- Objetivo: permitir ao `platform_admin` conhecer o gasto oficial total OpenAI do período e o custo prospectivo calculado das Landing Pages geradas, agregado por conta e detalhado por Landing Page nos workloads de texto e imagem, com a diferença apresentada como Outros gastos / reconciliação.
- Status: concluída em 29/08/2026; implementação incorporada à `main`, apply canônico, snippet read-only, Security Controls, ativação e redeploy de Production, smoke real de texto/imagem, corte imutável e QA hospedado final aprovados. A E20.2.9 permanece um gate separado.

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
    - `lib/openai-costs/validation-cases.ts`
    - `supabase/migrations/20260828131456_e21_4_4_openai_lp_cost_tracking.sql`
    - `supabase/tests/e21_4_4_openai_lp_cost_tracking.test.sql`
    - `supabase/snippets/e21_4_4_openai_lp_cost_tracking_verify.sql`
    - `app/admin/(protected)/custos-openai/actions.ts`
    - `app/admin/(protected)/custos-openai/page.tsx`
    - `app/admin/(protected)/custos-openai/_components/OpenAiCostsDashboard.tsx`
    - `app/admin/(protected)/custos-openai/validation-cases.tsx`
  - Ajustados:
    - `package.json`
    - `lib/lp-builder/landingPageDraftCandidateWorkflow.ts`
    - `lib/lp-builder/landingPageDraftGeneration.ts`
    - `lib/lp-builder/landingPageDraftImageGeneration.ts`
    - `lib/lp-builder/adapters/landingPageDraftCandidateWorkflowAdapter.ts`
    - `lib/lp-builder/landing-page-draft-generation-validation-cases.ts`
    - `lib/openai-workloads/contracts.ts`
    - `lib/openai-workloads/observability.ts`
    - `lib/openai-workloads/validation-cases.ts`
    - `components/admin/adminNavigation.ts`
- Referências:
  - Plano-base v2 aprovado: `docs/lousa-plano-base-e21-4.md`.
  - Matriz de consolidação: `docs/matriz-consolidacao-e21-4.md`.
  - Boundary técnico: `docs/base-tecnica.md` — 3.16.
  - Configuração administrativa OpenAI: `docs/platform-config.md` — 3.5 e 6.3.1.

21.4.3 Autoridade oficial de Costs
- Status: implementada e validada em Preview e Production, com leitura oficial real de `US$ 0,4064` para agosto de 2026 e chave administrativa separada da chave de geração.
- Automação: não.
- Conteúdo:
  - consultar sob demanda somente a Costs API com Admin API Key server-side para obter o gasto oficial total em USD no mês atual ou em período UTC personalizado;
  - preservar o total oficial como autoridade organizacional completa, sem atribuição por heurística, Usage administrativo, saldo/créditos, cache, polling, cron ou fallback para preço local.

21.4.4 Evidência prospectiva dos custos de Landing Pages
- Status: concluída; migration aplicada, snippet read-only e Security Controls aprovados, gate habilitado somente em Production, smoke real de texto/imagem aprovado e corte imutável registrado uma única vez em `2026-08-29 21:55:36.827207+00`.
- Automação: não.
- Conteúdo:
  - registrar prospectivamente evidências append-only das tentativas de `landing_page_draft_generation` e `landing_page_draft_image_generation` vinculadas ao contexto autorizado de conta e Landing Page; a cobertura confiável para agregação começa somente na data de corte explícita em Production;
  - executar início e terminal do tracking em orçamento curto próprio e best effort, sem bloquear ou invalidar a geração por falha exclusivamente financeira;
  - calcular custos internos com preços versionados e unidades efetivas, sem custo parcial ou inferido, mantendo tentativas não calculáveis fora da soma das LPs e dentro de Outros gastos / reconciliação por diferença;
  - preservar somente status, código e tipo sanitizados de falha real do provider para diagnóstico administrativo agregado, sem mensagem, payload bruto ou detalhe financeiro interno no cliente.

21.4.5 Custos OpenAI e reconciliação administrativa
- Status: concluída; prova oficial, instrumentação de Production e QA hospedado final aprovados.
- Automação: não.
- Conteúdo:
  - criar superfície separada para `platform_admin` com total oficial, custos prospectivos calculados das LPs, Outros gastos / reconciliação e aprofundamento conta → Landing Page → texto/imagem;
  - consultar sob demanda o provider oficial e o read model interno em paralelo, com paginação completa e reconciliação decimal exata, sem clamp;
  - distinguir cobertura completa, parcial, degradada e indisponível, deixando explícito que falhas anteriores ao início persistido não são individualizáveis e permanecem no residual;
  - o QA pré-merge aprovou desktop/mobile, contraste e estados seguros; o QA final de Production aprovou período atual/personalizado, atualização sob demanda, Costs oficial, atribuição por conta/LP/texto/imagem, Outros gastos/reconciliação, cobertura coerente com o corte, atalhos externos e bloqueio do papel negativo;
  - adiar classificação financeira ampla, workloads adicionais, reconstrução histórica, créditos, câmbio, cobrança, AI Gateway, CDC e qualquer infraestrutura não indispensável ao núcleo aprovado.

22. E22 — Retirada controlada de ativos históricos
- Objetivo: reduzir a superfície histórica que não participa do caminho canônico vigente, preservando consumidores reais e preparando a sequência E19.4 concluída → E22.1 → E19.5.
- Status: E22.1 concluída; E22.2 candidata aguardando merge humano; E22.3 concluída em 01/09/2026 após a retirada do workflow Agent Builder, do service MCP e do projeto Vercel sem workload.

22.1 Retirada controlada de ativos históricos

22.1.1 Objetivo e status
- Objetivo: retirar de forma controlada ativos históricos e seus consumidores somente após classificação de dependências, preservando os boundaries e dados ainda necessários ao caminho ativo.
- Status: Concluída em 19/08/2026 após o merge do PR #785 e o QA pós-merge final aprovado em produção; E22.1.4, E22.1.5, E22.1.6 e E22.1.7 permanecem concluídas. A E19.4 permanece concluída, e a E19.5 deixa de estar bloqueada pela E22.1 e passa a ser o próximo recorte a planejar, sem implementação iniciada.

22.1.2 Registros do recorte
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
  - Contrato de banco: `docs/schema.md` — seções 1 e 3.

22.1.3 Auditoria e classificação integral de consumidores
- Objetivo: mapear e classificar consumidores e ativos históricos como preservados, desacoplados ou removíveis, sem retirar qualquer item apenas por estar fora do caminho canônico.
- Status: Concluída no planejamento; sem implementação material.
- Conteúdo:
  - classificar dependências de runtime, superfícies administrativas, validações e persistência antes de qualquer retirada;
  - preservar E18.4, E20.2, E20.5, E20.6, E19.2, E19.3, E19.4, E10.6 e E10.7 enquanto houver consumidor real ou autoridade ativa;
  - preservar a revisão 3 da E19.4 como baseline de regressão e manter a E19.5 pausada durante o recorte.

22.1.4 Retirada de E20.3 e E12.4.3 associado
- Objetivo: retirar o domínio histórico de perfil de geração e suas responsabilidades associadas sem criar persistência ou arquitetura substituta dentro da E22.1.
- Status: Concluída em 19/08/2026 após os PRs #781 e #782, apply da migration `20260819153112` pelo workflow e prova read-only pós-apply sem drift.
- Conteúdo:
  - o primeiro merge retirou `generation-profile`, adapters, páginas/actions de `/admin/perfis-de-orientacao`, navegação e diagnósticos associados, o workload `landing_page_generation_profile_proposal`, exports e validator;
  - `validate:landing-page-generation-profile` e sua chamada em `npm run check` foram retirados no mesmo recorte, e o QA pós-merge confirmou ausência das superfícies aposentadas;
  - o gate read-only pré-DDL confirmou o conjunto aprovado de um perfil `active` do taxon `corretor-imoveis`, seus onze itens, duas tabelas, quatro RPCs e ausência de dependências externas inesperadas;
  - a migration forward-only removeu exatamente as quatro RPCs, as duas tabelas e seus objetos próprios, sem `CASCADE`, preservando migrations históricas, `audit_logs`, `taxon_market_research` e `taxon_market_research_items`;
  - a prova read-only pós-apply confirmou ausência dos seis objetos, preservação de `tg_set_updated_at`, 24 pesquisas e 379 itens; não houve archive, snapshot, backup paralelo ou persistência substituta.

22.1.5 Retirada de E18.5 e poda dos consumidores administrativos
- Objetivo: retirar o catálogo histórico de módulos e variantes e podar somente as responsabilidades administrativas que dependem dele.
- Status: Concluída em 19/08/2026 após merge do PR #783 e QA pós-merge aprovado em produção.
- Conteúdo:
  - o boundary `module-catalog`, sua API pública, exports e validator foram retirados, junto de `validate:landing-page-module-catalog` e sua chamada em `npm run check`;
  - somente os consumidores administrativos de módulos e variantes foram podados; no estado pós-merge da E22.1.5, `/admin/estrutura-lp` preservou Parâmetros, Entradas e Pesquisas, sem Módulos e variantes;
  - E18.4 e E20.2 permanecem preservadas e validadas, sem mudança de banco, migration, persistência ou dados;
  - as regressões locais confirmaram ausência de dependência de E18.5 no caminho E19.3 → E19.4; os QAs hospedado/autenticado e pós-merge em produção preservaram Parâmetros, Entradas e Pesquisas, e E20.2 resolveu 23 campos válidos em Entradas.

22.1.6 Desacoplamento da camada E10.8
- Objetivo: desacoplar a camada histórica de resolução de pesquisas e seus consumidores históricos sem remover pesquisas estruturadas que possuam consumidor real independente.
- Status: Concluída em 19/08/2026 após merge do PR #784 e QA pós-merge aprovado em produção.
- Conteúdo:
  - o boundary `research-resolution`, o adapter `landingPageResearchAdapter`, exports e validator foram retirados, junto de `validate:landing-page-research` e sua chamada em `npm run check`;
  - os diagnósticos BB/EC E10.8 foram retirados da Taxonomia, e a visão Pesquisas foi retirada de `/admin/estrutura-lp`, que preserva somente Parâmetros e Entradas; queries antigas caem com segurança em Parâmetros;
  - E20.5, E20.6, E19.3, E19.4, E10.6, E10.7, E18.4 e E20.2 permanecem preservadas e validadas; a E19.3 continua recebendo a pesquisa integral `end_customer` selecionada, sem `business_buyer` no `modelContext`;
  - `taxon_market_research`, `taxon_market_research_items`, seus dados e migrations históricas permanecem intactos para consumidores independentes; não houve migration, DDL, substituto ou alteração de `docs/schema.md`;
  - o QA hospedado/autenticado aprovou Taxonomia e Estrutura da LP em desktop e mobile, sem links, cards, estados órfãos, overflow de página ou erros de console; E20.2 resolveu 23 campos válidos para Corretor Imóveis em v4/Starter.

22.1.7 Consolidação transversal e regressão final
- Objetivo: consolidar a retirada controlada, verificar a ausência de dependências residuais e preservar a integridade do caminho E19.4.
- Status: Concluída em 19/08/2026 após o merge do PR #785 e o QA pós-merge final aprovado em produção.
- Conteúdo:
  - a auditoria focal encontrou e removeu somente o rótulo administrativo órfão `Pesquisas estruturadas por taxon`; ocorrências em migrations e registros históricos, além de asserções negativas de regressão, permanecem preservadas;
  - `npm ci`, `npm run check`, `git diff --check` e os validadores focais de E19.3, E19.4, Preview, workloads OpenAI, ativação comercial, E20.5/E20.6 e Estrutura da LP foram aprovados;
  - os QAs hospedado/autenticado e pós-merge final em produção aprovaram Admin em desktop (1280×900) e mobile (390×844), com Estrutura da LP somente em Parâmetros e Entradas, Taxonomia sem superfícies retiradas e cinco itens inventariados em Workloads OpenAI — quatro workloads de produto ativos e a referência operacional Supabase Inspect —, sem superfície órfã, overflow de página ou erro de console;
  - a revisão 3 permaneceu persistida e reproduzível em desktop e mobile, inclusive no QA pós-merge final em produção, com três revisões materializadas e a revisão 3 vigente; nenhuma revisão 4 ou chamada real aos providers foi criada;
  - E18.4, E20.2, E20.5/E20.6, E19.2/E19.3/E19.4, E10.6/E10.7, `commercial_activation`, `taxon_market_research`, `taxon_market_research_items` e os workloads ativos permanecem preservados;
  - não houve migration, DDL, alteração de banco, infraestrutura ou mudança de `docs/schema.md`; a E19.5 não foi iniciada e, com a conclusão da E22.1, passa a ser o próximo recorte a planejar.

22.2 Retirada controlada de documentação histórica redundante

22.2.1 Objetivo e status
- Objetivo: retirar fontes documentais redundantes ou obsoletas que duplicam autoridades vigentes.
- Status: Implementação candidata.

22.2.2 Registros do recorte
- Excluídos:
  - `docs/lp-planejamento.md`;
  - `docs/prompt-catalogo-lp.md`.
- Ajustados:
  - `lib/admin/docsCatalog.ts`;
  - `docs/roadmap.md`.

22.2.3 Resultado e limites
- `docs/roadmap.md` permanece autoridade para casos, estado, dependências, previsões e pendências.
- Planos-base permanecem responsáveis pelo planejamento detalhado dos recortes.
- Nenhuma fonte transversal substitui `docs/lp-planejamento.md`.
- Referências históricas não precisam ser reescritas.
- Nenhuma alteração de banco, schema, infraestrutura ou arquitetura.

22.3 Retirada controlada do Supabase Inspect MCP e infraestrutura associada

22.3.1 Objetivo e status
- Objetivo: retirar controladamente o service/MCP Supabase Inspect e, somente após auditoria, a infraestrutura Vercel exclusiva sem consumidor necessário, preservando automações, workflows, secret compartilhado e o Core.
- Status: Concluída em 01/09/2026 após a retirada controlada do service/MCP, do workflow Agent Builder alvo e da infraestrutura Vercel exclusiva sem workload; automações, workflows, secret compartilhado e Core preservados.

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
  - Configuração externa final: `docs/platform-config.md` — seção 3.2.
  - Catálogo de services: `docs/services.md` — seção 1.1.
  - Automação histórica: `docs/automations.md` — seção 3.3.

22.3.3 Auditoria final de consumidores e gate de retirada
- Status: Concluída.
- Conteúdo:
  - auditoria read-only confirmou ausência de consumidor necessário independente fora do workflow Agent Builder alvo e confirmou os mecanismos preservados;
  - o repositório não mantém referências operacionais do MCP fora dos documentos históricos e de governança;
  - não foi identificado outro workload, dependência do Core ou necessidade material nova.

22.3.4 Retirada do MCP e referências operacionais
- Status: Concluída em 01/09/2026.
- Conteúdo:
  - o workflow/integração Agent Builder `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7` foi removido manualmente;
  - o service MCP e suas referências operacionais foram retirados sem remover `automations/supabase-inspect`, workflows GitHub, secret compartilhado ou contratos do Core;
  - os documentos canônicos foram reconciliados pelo Prompt ABC, sem substituto ou nova arquitetura.

22.3.5 Retirada da infraestrutura Vercel sem workload
- Status: Concluída em 01/09/2026.
- Conteúdo:
  - o projeto Vercel exclusivo `lpf-10-services` foi removido após a confirmação de ausência de workload; o domínio também deixou de aparecer na lista de projetos;
  - o Core `lp-factory-10` permaneceu separado e presente; nenhum deployment/redeploy foi solicitado ou executado manualmente, mas a publicação final do commit acionou automaticamente um Preview do Core `lp-factory-10` pela integração Git/Vercel, concluído com sucesso; nenhum novo deployment adicional deve ser provocado; a configuração externa final foi registrada.

22.3.6 Pendência — reduzir deployments gerados por pushes intermediários
- Status: Pendente.
- Conteúdo:
  - a política atual da Vercel bloqueia deploy automático apenas para branches `docs/**`;
  - branches `codex-app/**` continuam gerando Preview a cada push;
  - a orquestração recente mostrou excesso de deployments por publicação de checkpoints intermediários;
  - a remoção de `lpf-10-services` elimina a duplicação causada pelo segundo projeto, mas o Core ainda pode atingir o limite por pushes frequentes;
  - avaliar em recorte futuro como fazer valer a regra de agrupar commits locais e publicar somente quando houver necessidade real de Preview, review remoto ou entrega;
  - não implementar nenhuma mudança de Vercel, skill, `AGENTS.md` ou processo neste PR.

99. Changelog
v1.5.195 — 29/08/2026 — Encerrada a E20.7 após o merge do PR #835: migration E20.7.4 aplicada automaticamente, reconciliação v6 confirmada e rollout hospedado do workload dinâmico transferido para o futuro recorte de integração E19.3, quando existir consumidor real; removida essa validação operacional da lista de pendências da E20.7.

v1.5.193 — 29/08/2026 — Registradas a implementação e validação determinística repo-side da E20.7.4, o confronto sem sobreposição material com o PR #831, o workload `landing_page_dynamic_market_research`, a ampliação candidata E21.2 de dez para doze unidades e os gates pendentes de merge, apply, reconciliação v6, prova e ativação hospedada.

v1.5.191 — 28/08/2026 — Registrada a implementação técnica local das E21.4.3 e E21.4.4 no PR #831, com leitura oficial, persistência prospectiva limitada a texto/imagem de LP, preço versionado, migration/teste/snippet repo-only e gates hospedados/pós-merge ainda pendentes; E21.4.5 permanece não iniciada.

v1.5.171 — 20/08/2026 — Registrada a implementação repo-only tecnicamente aprovada da E21.2.4: gestão administrativa por ambiente/workload, lifecycle explícito, reautorização server-side, prova pelos quatro transportes existentes e falha fechada; apply, validações hospedadas, smoke real, ativação e cutover permanecem pós-merge, sem iniciar a E21.3.

v1.5.170 — 20/08/2026 — Registrada a implementação repo-only tecnicamente aprovada da E21.2.3: fonte operacional por ambiente/workload, bootstrap, lifecycle transacional, resolver assíncrono fail-closed, quatro consumers, proveniência, validação de snapshots e provas SQL; apply, Security Controls, snippet real e cutover permanecem pós-merge, e a E21.2.4 fica autorizada a iniciar.

v1.5.140 — 11/08/2026 — Implementada no repositório a E19.4.4 com materialização inicial 1:1 write-once, conteúdo e snapshot runtime v1 coerentes, adapter server-only, migration transacional, readiness fail-closed e casos executáveis; apply e prova hospedada permanecem nos gates pós-merge/E19.4.5.

v1.5.131 — 08/08/2026 — Fechada a E19.2 após o merge do PR #700: migration aplicada, verificador SQL read-only aprovado e validação funcional hospedada autenticada concluída; preservados os limites de não geração, não publicação, ausência de tracking/CRM/capability nova e ausência de infraestrutura de assets.

v1.5.128 — 07/08/2026 — Reconciliado o PR #689 com a conclusão da E9.7 integrada à `main`, preservando integralmente o contrato canônico de capacidades e a implementação candidata aprovada da E12.5; inspeção final e merge humano permanecem pendentes.

v1.5.127 — 07/08/2026 — Fechada documentalmente a implementação candidata da E12.5 para diagnóstico e navegação operacional do Admin Dashboard, com contratos existentes preservados, QA visual autenticado aprovado e inspeção final pós-reconciliação com a `main` ainda pendente.

v1.5.125 — 06/08/2026 — Fechado o contrato mínimo da E20.2 v2 com política explícita de substituição por LP: oferta, descrição e logo usam `forbidden`, paleta usa `explicit_allowed`, campos próprios da LP usam `not_applicable`, e especialização taxonômica permanece distinta da substituição de valores concretos.

v1.5.124 — 05/08/2026 — Refinada a E20.2 com catálogo v2 de 23 campos: preservados integralmente os 19 campos da v1 e adicionados os quatro mínimos do Starter, com validações estritas de strings, referência opaca de asset e paleta hexadecimal, sem banco, UI, persistência, upload, geração ou infraestrutura.

v1.5.123 — 04/08/2026 — Reorganizada a E19 conforme `docs/template-roadmap.md`: removidos os blocos redundantes e defasados, renumerado o recorte material concluído para 19.1, eliminados registros vazios e referências futuras superadas e mantida a próxima evolução sem numeração antecipada até a avaliação residual e o respectivo plano-base.

v1.5.122 — 04/08/2026 — Garantido no máximo um taxon primário ativo por conta e reconciliada a retirada da E12.4.4 da implementação.

v1.5.121 — 04/08/2026 — Concluída documentalmente a correção de cardinalidade da E12.4.3.2 após gate funcional aprovado; registrada a E12.4.4 para classificar gaps modulares, problemas de pesquisa ou modelagem e requisitos globais de composição, sem implementação no PR #681.

v1.5.118 — 03/08/2026 — Registrada a correção localizada do contrato de cardinalidade da evolução do perfil com IA, preservando validação fail-closed, `active v1`, ausência de retry e gate único no Preview após revisão independente.

v1.5.117 — 30/07/2026 — Planejada a E11.2 com fases executáveis E11.2.3, E11.2.4 e E11.2.5; v1 aprovada e Processo automatizado escolhido, aguardando merge humano.

v1.5.116 — 30/07/2026 — Registrados o merge do PR #656, a habilitação da E11, o redeploy e o smoke final aprovado em Production.

v1.5.115 — 30/07/2026 — Registrada a aprovação dos testes humanos da correção concorrente da E11.1.7 no Preview autorizado, removida a pendência de reteste e mantida Production desabilitada até o merge humano do PR #656.

v1.5.114 — 30/07/2026 — Reconciliada a E12.4.3.2 para criação e evolução do perfil em `draft`, baseline ativo revalidado, ações contextuais, candidata e diff transitórios, aplicação separada do salvamento e pesquisa bruta complementar opcional; E20.3.5 mantida como evolução mínima.

v1.5.113 — 29/07/2026 — Planejada a E12.4.3.2 com cobertura por `lp_sections`, recomendações deduplicadas, prioridade e ordem determinísticas, auditoria da decisão sobre gaps e evolução E20.3.5; decisões de edição e regeneração permanecem para o futuro plano-base da E19.4.

v1.5.111 — 28/07/2026 — Corrigido o registro do transporte concorrente do `invite_state`: estado assinado por emissão no `redirectTo`, template sem metadata compartilhado e reteste corretivo de Preview preparado, mantendo Production desabilitada.

v1.5.108 — 28/07/2026 — Registrada a aprovação da matriz hospedada da E11.1.7 em Preview, com Production mantida desabilitada até o merge humano e o smoke pós-merge.

v1.5.102 — 26/07/2026 — E20.3 implementada no PR #644: E20.3.3 concluída com migration versionada e aplicação pendente do merge; E20.3.4 implementada e validada; fechamento da fase pendente apenas de merge, apply automático e verificação read-only pós-apply.

v1.5.101 — 25/07/2026 — Promovidos `comparison@v1`, `comparison.standard@v1`, `lead_capture@v1` e `lead_capture.form@v1` ao catálogo canônico da E18.5, totalizando doze módulos, quatorze variantes e 34 casos executáveis, com Form reutilizado e mecanismos centrais preservados.

v1.5.100 — 23/07/2026 — Consolidada a moldura discriminada de interações da E18.5, com Form e Accordion, capabilities derivadas, fronteira coerente da Hero e prova sintética de reutilização sem ampliar os mecanismos arquiteturais.

v1.5.99 — 23/07/2026 — Consolidada a implementação material da E18.5 com dez módulos e doze variantes, `benefits.standard@v1`, `hero.form@v1`, sources combinadas, proteções executáveis e `prod#17` ampliado ao contrato abstrato do Hero Form.

v1.5.98 — 23/07/2026 — Detalhada a evolução planejada da E18.5 em sete subseções canônicas, preservando o estado material vigente e definindo extensões atômicas, sources junto dos fields, proteções do núcleo executável e limites antes da E20.3.

v1.5.97 — 23/07/2026 — Abandonada a substituição integral planejada para a E18.5; preservado o núcleo repo-only incorporado pelo PR #590 e redirecionado o plano para otimizações pontuais, com incorporação futura de `benefits.standard@v1` e `hero.form@v1` e uso do PR #617 como evidência experimental sem merge.

v1.5.96 — 21/07/2026 — E18.5 reorganizada conforme `docs/template-roadmap.md`: registros de implementação movidos para 18.5.2 sem artefatos `docs/**`, `prod#17` registrado como update aplicado ao contrato abstrato de `faq.accordion@v1`, conteúdos implementados distribuídos entre 18.5.3 e 18.5.9 e status atualizado após aprovação e merge do PR #590.

v1.5.95 — 21/07/2026 — E18.5 implementada e reconciliada como catálogo repo-only de nove módulos e dez variantes de `landing_page`, com fields e mapas por variante, perfis de funil fechados, resolução efetiva fail-closed e API pública mínima, pendente do gate final do Analista.

v1.5.94 — 15/07/2026 — E20 criada no roadmap e 20.2 concluída com catálogo declarativo versionado de entradas de `landing_page` por taxon e plano, resolução repo-only, herança taxonômica, proveniência e falha fechada, sem banco, rota, UI ou valores operacionais.

v1.5.93 — 14/07/2026 — Ajustada a E10.8 para explicitar os quatro blocos obrigatórios, a versão comum dentro de cada `audience_scope` e a independência de versões entre `end_customer` e `business_buyer`.

v1.5.92 — 14/07/2026 — E10.8 concluída com resolução server-side, read-only, tipada e fail-closed das pesquisas estruturadas de `landing_page`, preservando precedência, atomicidade e proveniência sem alteração de banco ou implementação dos consumidores futuros.

v1.5.91 — 13/07/2026 — E18.4 consolidada como parametrização raiz versionada da família `landing_page`; removida a implementação anterior de composição e separado o recorte futuro 18.5 para módulos e variantes.

v1.5.90 — 07/07/2026 — E18.4 concluída como base técnica repo-only de composição `landing_page`, com catálogo mínimo, contratos técnicos, registry, schemas, renderer mínimo, resolver/validador e limites de `config_json`, sem liberação automática de registros-base, LP teste, rota pública, Admin, LP Builder, automação, job ou agente.

v1.5.89 — 04/07/2026 — E9.7 concluída com liberação manual administrativa mínima por `platform_admin`, persistência em `public.account_commercial_entitlements`, concessão/atualização/cancelamento manual, view efetiva validada e decisão de não criar superfície artificial para testar LP Builder.

v1.5.88 — 02/07/2026 — E9 Fase 5 fechada documentalmente após a E19 entregar o ponto produtivo real de criação mínima de LP; gate comercial confirmado antes do insert em `public.account_landing_pages`, com fail-closed por entitlement ausente.

v1.5.87 — 02/07/2026 — E9 Fase 7.2 concluída com webhook Stripe mínimo em produção, `invoice.paid` ativando entitlement local, idempotência em `stripe_webhook_events`, retry operacional e persistência validada em `account_commercial_entitlements`.

v1.5.86 — 30/06/2026 — E19 Fase 3 concluída com criação produtiva mínima de LP por conta, persistência em public.account_landing_pages, boundary lib/lp-builder/ e gate E9 antes do insert.

v1.5.85 — 26/06/2026 — E10.7 Fase 6 concluída; próxima fase: Fase 7 — edição manual de copy e gestão simples de versões.

v1.5.84 — 25/06/2026 — E10.7 Fase 5 concluída com taxons elegíveis por pesquisa estruturada completa, composição técnica genérica sob demanda, geração/publicação `commercial_activation` por `taxonSlug` e próxima Fase 6 planejada para Admin comercial enxuto.

v1.5.83 — 23/06/2026 — E10.7 Fase 4 concluída com consumo no Account Dashboard: `/a/[account]` renderiza bundle `commercial_activation` publicado e `ready`, mantém fallback `generic-v1`, preserva `NicheResolutionCard` e tracking comercial, rejeita draft/archived/artifact inválido e mantém IA fora do runtime público.

v1.5.82 — 23/06/2026 — E10.7 Fase 3 concluída com operação administrativa mínima em `/admin/templates`: geração/regeneração de draft, preview administrativo, publicação via RPC existente, validação server-side do draft publicável, resolução compartilhada por `content_template_taxons` e estado real validado com `v3` published, `v2` draft histórico e `v1` archived.

v1.5.81 — 22/06/2026 — E12.3.2 concluído e validado: `/admin/documentacao` passa a leitor read-only protegido de documentos whitelist de `docs/`, com leitura server-side por filesystem, tracing explícito dos arquivos permitidos, UI responsiva com filtro/dropdown e sem Supabase, migrations, GitHub API em runtime, edição ou mutações.

v1.5.80 — 22/06/2026 — E10.7 Fase 2 concluída e validada: geração administrativa server-side de draft comercial por IA, draft real criado como `status = draft` para o taxon piloto, validação em duas camadas, fontes `business_buyer` registradas, `end_customer` apenas em `provenance_json`, falha segura por arquivamento/invalidação de draft parcial e sem publicação, `published`, Account Dashboard ou `/a/[account]`.

v1.5.79 — 22/06/2026 — E12 registra o refinamento 12.3.2 em implementação: `/admin/documentacao` como leitor read-only protegido para whitelist de documentos de `docs/`, sem Supabase, migrations, GitHub API em runtime, edição ou mutações.
v1.5.78 — 22/06/2026 — E12 registra o refinamento 12.3.1 concluído e validado: `/admin` passa a entrada pública do Admin Dashboard, subrotas internas seguem protegidas por `app/admin/(protected)/layout.tsx`.
v1.5.77 — 21/06/2026 — E10.7 Fase 2: critérios de IA, validação e logs.
• Incorporados pareceres de Updates e Automations para a Fase 2.
• Registrado uso de fluxo IA server-side/Admin com structured output, sem Agents SDK/job/fila/agente.
• Registrada validação em duas camadas, regra segura para `cta.href`, snippets read-only quando aplicável e logs seguros.
v1.5.76 — 21/06/2026 — E10.7 Fase 1 concluída e validada: escrita administrativa controlada, publicação transacional e verificação read-only aplicadas no Supabase real; próxima execução passa a ser Fase 2.
v1.5.75 — 19/06/2026 — Roadmap registra o plano aprovado da E10.7 distribuído em E10.5.5, E18, E12, E10.7 e E19: pesquisas `active version 1`, quatro blocos fixos por `audience_scope`, `business_buyer` como artefato publicado, `end_customer` apenas em `provenance_json`, operação administrativa mínima em `/admin/templates`, patch estrutural mínimo para escrita administrativa controlada e referência futura ao E19 sem obrigação de implementação agora.
v1.5.74 — 16/06/2026 — E18 conclui o segundo recorte da base transversal de `commercial_activation`: contrato `content_json` v1, validação Zod, registry, renderer, catálogo inicial de oito seções e nove registros-base aplicados e confirmados no Supabase; a E10.7 fica desbloqueada como primeiro consumidor real.

v1.5.73 — 15/06/2026 — E18 consolida o primeiro recorte autônomo implementado e validado: banco de composições e artefatos aplicado no Supabase, runtime server-side mergeado e seleção determinística de template por taxon; dados do primeiro consumidor e integração com a E10.7 permanecem pendentes.
v1.5.72 — 15/06/2026 — E10.6 concluída com página comercial genérica responsiva em `/a/[account]`, planos e CTAs ilustrativos, tracking server-side validado, correção de `public.audit_context_event` e registro dos artefatos finais; personalização por nicho permanece na E10.7.
v1.5.71 — 12/06/2026 — Separadas a E10.6, agora dedicada à primeira página comercial genérica sem banco novo, pesquisa ou IA, e a futura E10.7, responsável por páginas comerciais personalizadas por nicho após a aprovação da E10.6; referências ao consumo direto de pesquisas pela E10.6 foram corrigidas.
v1.5.70 — 12/06/2026 — Retirada a implementação antecipada da E18/E18.5 e a primeira E10.6; removidos templates universais, artefatos e persistência não aplicada, restaurado o Account Dashboard simples e reiniciada a página comercial como caso específico antes de qualquer abstração compartilhada.
v1.5.69 — 11/06/2026 — E18.5 adota o primeiro fluxo incremental pós-baseline: migration canônica estrita de `generated_content_artifacts`, verificação read-only ampliada, validação isolada com smoke, rollback e reconstrução, mantendo aplicação remota e runtime consumidor bloqueados.
v1.5.68 — 11/06/2026 — E10.6 e E18.5 registram o backlog da página comercial `version: 2`, com recursos, diferenciais, provas, FAQ, CTA final ampliado e evolução coordenada de contrato, fallback, validação, geração e renderização, preservando a `version: 1`.
v1.5.67 — 11/06/2026 — E10.6 corrige a acentuação da copy fallback e remove o espaço reservado acima da página comercial quando não há card de resolução de nicho.
v1.5.66 — 11/06/2026 — E10.6 recebe a primeira página comercial funcional e responsiva no Account Dashboard, consumindo o resolver existente e o fallback determinístico sem consultar a persistência ainda não aplicada.
v1.5.65 — 11/06/2026 — E18.5 separa escopo estável de fingerprint das entradas, preserva o histórico entre mudanças de pesquisa/template/schema e generaliza apenas a persistência ainda não aplicada para `generated_content_artifacts`.
v1.5.64 — 10/06/2026 — E18.5 prepara runtime e persistência versionada dos artefatos comerciais, com adapter server-side, estados draft/active/archived, ativação transacional, SQL operacional, verificação e rollback, mantendo aplicação no Supabase e migration histórica pendentes.
v1.5.63 — 10/06/2026 — E10.6 e E18.5 registram observabilidade futura, ausência de nova infraestrutura Vercel na primeira entrega e condições de adoção para updates Supabase, Vercel, cache, fila e tracking, sem implementar essas capacidades nesta etapa.
v1.5.62 — 10/06/2026 — E18.5 iniciada com contrato técnico dos campos finais da página comercial, template versionado, proveniência das pesquisas, identidade inicial do artefato, validação estrutural pura e fallback determinístico, sem provider, persistência ou UI.
v1.5.61 — 10/06/2026 — Roadmap registra a página comercial da E10.6 como primeiro laboratório controlado da geração automatizada por taxon, com visão planejada na E18.5, futura operação administrativa na E12.7, consumo da versão ativa e válida ou fallback sem IA em renderização e pendência da etapa técnica responsável pelos artefatos.
v1.5.60 — 09/06/2026 — E10.5.6.7 concluído com template comercial universal, contrato e exports da family `conversion-content`, resolução pura, adapter server-only, fallback taxon/pai/ancestral/genérico e grants read-only validados para pesquisa `business_buyer`.
v1.5.59 — 09/06/2026 — E10.5.6.7 e E10.6 alinhados para explicitar que a página comercial é interna ao Account Dashboard e possui conta existente, mas não depende de taxon nem de dados comerciais ricos; o taxon é opcional para personalização e o fallback genérico usa o mesmo template universal.
v1.5.58 — 28/05/2026 — Roadmap atualizado em E10.5.5 para refletir o novo modelo de pesquisa bruta por taxon, mantendo `taxon_market_research` como registro-pai e `taxon_market_research_items` como itens estruturados da pesquisa, sem criação de bloco agregado, nova tabela ou nova camada.
v1.5.57 (20/05/2026)
• E10.5.6 reorganizado em subitens estáveis (10.5.6.1–10.5.6.7), mantendo estado final enxuto, separação de pendências reais e artefatos consolidados sem misturar escopo do E10.4.
v1.5.56 (20/05/2026)
• E10.5 atualizado para refletir somente o estado real do repositório: bloco 10.5 substituído integralmente, removendo promessas de UX pós-setup ainda não implementadas no runtime e consolidando os subcasos 10.5.1/10.5.2/10.5.3/10.5.3.1/10.5.4/10.5.6 com artefatos e pendências alinhados.
v1.5.55 (20/05/2026) — E10.4 enxugado e consolidado no estado final: bloco substituído para remover histórico intermediário e duplicações internas, absorvendo 10.4.2/10.4.3 e mantendo 10.5+ intacto.

v1.5.54 — 19/05/2026 — E12 atualizado para refletir o estado atual do Admin Dashboard: shell operacional protegido, navegação própria, páginas read-only reais para contas, resoluções de nicho e taxonomia, artefatos criados/ajustados e limites explícitos sem mutações, SQL, migrations ou RLS.

v1.5.53 — 14/05/2026 — Roadmap atualizado com o estado final da implementação 20.8: IA estruturada server-side como complemento ao matching determinístico, persistência apenas em `account_niche_resolutions`, preservação de `account_taxonomy`, artefatos, validações, PR mergeado e pendências futuras.

v1.5.52 — 11/05/2026 — Roadmap atualizado com o estado final da implementação 20.7: vínculo oficial em `account_taxonomy` apenas para alta confiança, preservação de `account_niche_resolutions` como registro operacional, regra de conflito de primário, artefatos, QA runtime e pendências futuras.

v1.5.51 — 11/05/2026 — Roadmap atualizado com o estado final da implementação 20.6: persistência da resolução operacional em `account_niche_resolutions`, decisão sobre `account_taxonomy`, artefatos, QA e pendências futuras.

v1.5.50 — 10/05/2026 — Roadmap atualizado com o estado final da integração de matching determinístico de taxonomia no pós-save do `pending_setup`, incluindo artefato ajustado, regra não bloqueante, observability segura e pendências explícitas.

v1.5.49 (10/05/2026)
• Adicionado 10.5.4 como concluído (exec): helper puro de confiança determinística para taxon match, com contrato tipado, `aiEscalationMode` e artefatos em `lib/onboarding/niche-resolution/`, mantendo escopo repo-only e pendência explícita de branch sem merge e sem integração ao `pending_setup`.

v1.5.49 — 09/05/2026 — E10.5.6: registrado adapter server-side `matchBusinessTaxonsDeterministic` e contrato TypeScript para consumo futuro da RPC de matching determinístico de taxonomia.

v1.5.48 — 09/05/2026 — E10.5.6: registrado matching determinístico inicial de taxonomia, com `pg_trgm`, normalização textual, FTS, trigram, RPC read-only, migration/rollback e validação funcional no Supabase.

v1.5.47 (08/05/2026) — E10.4: registrado `niche` obrigatório no `pending_setup`, com artefatos ajustados, validação client/server e QA funcional aprovado.

v1.5.46 (07/05/2026) — E10.4: registra refinamento técnico do PR #226, movendo a mutação `pending_setup → active` para `accountAdapter` e preservando a action como orquestradora do fluxo.

v1.5.44 (27/04/2026) — Simplificada a seção 10.5.2 do roadmap, fundindo 10.5.2 e 10.5.2.1 no estado final único da base do BD do E10.5.

v1.5.43 (26/04/2026) — 10.5.2.1: ajuste corretivo do Grupo C
• Registrado o estado final do ajuste de `audience_scope`: público da pesquisa no registro-pai, itens herdando público por `research_id`, unicidade por `taxon_id + research_block + audience_scope + version` e artefatos de migration/rollback.

v1.5.42 (23/04/2026)
• Adicionado 10.5.2.1 com o ajuste estrutural de taxon_market_research e taxon_market_research_items no BD.

v1.5.41 (18/04/2026)
• E12 atualizado para refletir a execução do primeiro recorte real do Admin: superfície protegida de `/admin` entregue como base de acesso/UI do contexto administrativo.
• 12.5 deixou de ser “próximo subcaso” genérico e passou a registrar o recorte executado de acesso e superfície inicial do Admin.
• Registrados os ARTEFATOS_REPO do caso: `app/admin/layout.tsx`, `app/admin/page.tsx`, `components/admin/AdminHeader.tsx`, `components/admin/AdminUserMenu.tsx`, além dos ajustes em `app/auth/login/page.tsx` e `components/login-form.tsx`.
• Registradas as pendências explícitas do caso sobre possível `/admin` público com área protegida separada e sobre destino próprio do logout administrativo.
v1.5.40 (17/04/2026)
• E12 enxugado para formato de reinício do Admin Dashboard com apenas 12.1–12.5 (status, objetivo, escopo atual, base existente e próximo subcaso), removendo subitens amplos que inflavam o caso.
• E12 mantido aderente ao estado real do repo: base mínima em `lib/admin/index.ts`, `lib/admin/adapters/adminAdapter.ts` e `lib/access/guards.ts`, sem backlog amplo no corpo principal.
v1.5.39 (17/04/2026)
• E12 reescrito para refletir apenas o estado real implementado no repositório: infraestrutura mínima de privilégio admin (`lib/admin/index.ts`, `lib/admin/adapters/adminAdapter.ts` e `lib/access/guards.ts`), sem tratar dashboard amplo como já definido/implementado.
• E12 limpo de escopo presente amplo (operação consultiva, painel de contas/prospects/status, relatórios/auditoria consultiva e jobs/tracking), mantendo essas frentes apenas como evolução futura.
• 12.9 desassociado do E12 atual e realinhado ao estado concluído já registrado em E5.6 (Infra Auth — e-mail transacional).
v1.5.38 (15/04/2026)
• 10.5.3 atualizado para Concluído (exec): kit operacional do Grupo A versionado em `docs/` e `supabase/snippets/`, com investigação consolidada, regra de `parent_slug` e carga prática reportada para `implante-dentario`.
• Adicionado 10.5.3.1 (Briefing): curadoria operacional de aliases enxutos vs microvariações textuais, para separar cadastro manual do Grupo A e matching leve futuro do E10.5.6.
v1.5.37 (13/04/2026)
• Documentação alinhada ao estado pós-remoção do legado de tokens: E7/E7.5/E12.5 atualizados para registrar descontinuação do fluxo por token e planejamento do novo Admin Dashboard sem superfície legada ativa.
• E1/E3 e registros de E6 ajustados para remover referências ativas ao fluxo legado descontinuado e às superfícies administrativas removidas.
v1.5.36 (09/04/2026)
• 10.5 ajustado para “Em evolução”, com dependência explícita de 10.5.2.
• 10.5.2 adicionado como concluído (exec): base estrutural admin/interna de taxonomia, templates e guides, com migration `0006__e10_5_2_taxonomy_content_base.sql`.
• 10.5.3 adicionado como planejado para popular a base inicial de taxons, aliases, templates e vínculos.
v1.5.35 (01/04/2026)
• Adicionado **E19 — LP Builder** como nova seção do Core, no mesmo nível estrutural de Account Dashboard, Admin Dashboard e Partner Dashboard.
v1.5.34 (31/03/2026)
• Atualização documental dos artefatos e paths atuais dos casos afetados.
v1.5.33 (31/03/2026)
• Atualização documental: item 17.6 retificado para registrar que o projeto `LP-Factory-10-staging` foi deletado em 31/03/2026 após alerta crítico do Security Advisor e que não existe staging ativo no Supabase.
• Execução da fase 1 estrutural do Core registrada: separação cliente/admin via guards SSR de seção, sem fase 2, sem Partner e sem nova camada no root.
v1.5.32 (20/03/2026)
• E17 ajustado: removidos do roadmap os blocos operacionais de GitHub/openai-smoke e do pipeline `supabase-inspect`, preservando o caso de uso enxuto de checks determinísticos do Codex (com referência para `docs/base-tecnica.md`) e adicionando referência documental para que automações operacionais de produto, componentes consumidores, MCPs e evoluções dessa camada passem a ser documentados em `docs/automacoes.md`.
• Renumeração local do E17 aplicada após a limpeza: o caso de sandbox passou a `17.4`, a referência documental passou a `17.5` e o item de Supabase STAGING descontinuado passou a `17.6`.
v1.5.31 (10/03/2026)
• 6.6 concluído (exec): adicionados estados reutilizáveis (FeedbackMessage/EmptyState/LoadingState) e Textarea, com aplicação mínima em Auth, `pending_setup` e loading da conta; `docs/design-system.md` consolidado (E6.4–E6.6) atualizado.
v1.5.30 (09/03/2026)
• 6.5 concluído (exec): UI Component Library base (Button/Input/Card ajustados; Select e FormField criados) aplicada em Auth + `pending_setup`, com `docs/design-system.md` atualizado (repo-only; sem Supabase/SQL/migrations).
v1.5.29 (09/03/2026)
• 6.4 concluído (exec): identidade visual mínima aplicada (repo-only) + `docs/design-system.md`; wordmark temporário até versionar asset oficial de logo; pendências e novos casos (6.5–6.7) registrados.
v1.5.28 (06/03/2026)
• E17 atualizado (exec): `supabase-inspect` ganhou modo batch (`---`) com execução determinística e relatório completo por query no Job Summary; contrato atualizado no README do pipeline e pendência opcional de templates registrada.
v1.5.27 (05/03/2026)
• E18 adicionado (planejado): referência ao **Vercel AI Gateway** como padrão de integração de IA na fase IA-ready (ver `docs/vercel-up.md`, Item 1).
v1.5.26 (04/03/2026)
• E17 atualizado (exec): pipeline `supabase-inspect` v1 (read-only) implementado (workflow + pipeline em `pipelines/`), com secret `SUPABASE_DB_URL_READONLY` e referência ao contrato detalhado no README do pipeline e ao contrato de DB em docs/schema.md.
v1.5.25 (04/03/2026)
• E17 atualizado (exec): checks determinísticos do Codex no sandbox (AGENTS.md + lint via ESLint CLI + typecheck), com build validado fora do sandbox (CI/Vercel) e pendência futura “harden lint” registrada.
v1.5.24 (02/03/2026)
• E17 atualizado: setup mínimo concluído (OpenAI Projects DEV/PROD com sharing isolado no DEV e hardening de keys; GitHub secret `OPENAI_API_KEY` + workflow `.github/workflows/openai-smoke.yml` verde), com pendências registradas para limits por projeto, piloto `supabase_inspector` read-only, role Supabase read-only e decisão de endpoint Vercel.
v1.5.23 (01/03/2026)
• E5.6 concluído (exec): e-mail transacional do Supabase Auth estabilizado via Resend SMTP com sender `no-reply@lpfactory.com.br` (domínio raiz), com decisão registrada e condição de migração futura para subdomínio dedicado quando houver escala.
v1.5.22 (24/02/2026)
• E5.4 concluído (exec): fluxo signup → e-mail → /auth/confirm → redirect /a/home (happy path), com emailRedirectTo incluindo next=/a/home e rid (não-PII), /auth/sign-up-success (UX mínima) e logs estruturados no client (supa#5) com sinal mínimo no runtime Vercel (Vercel).
v1.5.21 (21/02/2026)
• E10.4.7 concluído (exec): refinamentos de UX no “Primeiros passos” (sem reset de campos em erro; nome com placeholder + CTA gated; Enter com foco no primeiro inválido; progressive disclosure no mobile; site_url aceita domínio sem esquema e normaliza para https://), com ARTEFATOS_REPO (criados/ajustados) registrados.
• E6 atualizado (exec): tipografia Inter aplicada globalmente e tokens Tailwind LP Factory adicionados de forma aditiva (preservando shadcn), incluindo expansão do content para js/jsx/mdx.
v1.5.19 (13/02/2026)
• E10.4.6 concluído (exec): “Primeiros passos” persiste `account_profiles`, atualiza `accounts.name` e promove `pending_setup → active`; setup concluído passa a ser status-based (`accounts.status=active`) e `setup_completed_at/account_setup_completed_at` ficam deprecated sem uso no gating/fluxo.
• E10.5 ajustado para “active persuasiva” (pós-setup sem plano/trial), removendo dependência do marcador no fluxo.
• Access Context endurecido (v_access_context_v2) e ajustes de Supabase Auth fora do repo (Redirect URLs Preview + templates de signup/reset usando RedirectTo).
v1.5.18 (07/02/2026)
• E10.4.5 concluído (definição): decisão de persistência do onboarding/perfil em account_profiles (1:1), mantendo accounts.name no core, com contrato mínimo v1 (niche, preferred_channel, whatsapp, site_url).
v1.5.17 (06/02/2026)
• E10.4.4 concluído (definição): contrato v1 de campos/validações do formulário “Primeiros passos” (incl. regra condicional do WhatsApp e microcopy por intenção)
v1.5.16 (06/02/2026)
• E10.4.3 concluído: política do marcador de setup (once set, never unset) + permitido/proibido (snapshot).
v1.5.15 (04/02/2026)
• E9.8.3 marcado como Concluído (remoção do drift trial do runtime + alinhamento de docs; sem migrations; smoke test em preview e produção).
v1.5.14 (03/02/2026)
• Adicionado E9.8.5 para decidir a persistência do sinal comercial (commercial.expires_at) e o destino de accounts.trial_ends_at (manter como legado até decisão).
v1.5.13 (02/02/2026)
• E9.8.2 concluído (definição): commercial.inactive_reason com trial_expired e churn (opcional payment_failed), sem alterar accounts.status.
• Criado E9.8.4 (pendente): decisão sobre persistência/consulta do motivo para CRM/relatórios
v1.5.12 (01/02/2026)
• Reestruturado o fluxo pending_setup por subestado via account_setup_completed_at, separando 10.4 (setup incompleto: IS NULL) e 10.5 (pós-setup sem plano/trial: IS NOT NULL).
• Atualizado 10.4 para focar em UX/CTAs do subestado “setup incompleto” e registrar a transição para 10.5 ao setar setup_completed_at (sem mudar accounts.status).
• Registrados 10.4.1 e 10.4.2 como Concluídos (infra do marcador + regra v0 executável de setup concluído), com dependências e pendência explícita de dados mínimos v1.
• Mantidos como Briefing: 10.4.3 (política do marcador), 10.4.4 (dados mínimos v1: nicho/WhatsApp/outros) e criado 10.5.1 (matriz “preparação vs produtivo” + enforcement servidor).
• Ajustadas dependências de 10.4 e 10.5 para incluir E9.3.1 apenas como referência de CTA/roteamento (sem implementar entitlements aqui).
v1.5.11 (31/01/2026)
• Atualizado 9.3.1 com definição do trial como entitlement (início pós-setup; expiração `active → inactive`) e contrato mínimo do sinal comercial consumido por SSR/gate/UX.
• Adicionado 9.8.2 (Briefing) para motivos de `inactive` (trial_expired vs churn) para segmentação de marketing.
• Adicionado 9.8.3 (Briefing) para execução: remoção do drift `trial` no runtime + alinhamento de docs ao estado final.
v1.5.10 (31/01/2026)
• Adicionado E10.4.2 (setup concluído v0 — regra executável) com evento “Salvar/Confirmar” e chamada idempotente do marcador.
• Adicionado E10.4.3 (Briefing) para política do marcador setup_completed_at (MVP).
• Adicionado E10.4.4 (Briefing) para matriz “preparação vs produtivo” + enforcement no servidor.
• Adicionado E10.4.5 (Briefing) para dados mínimos v1 (nicho/WhatsApp/outros) com contrato de armazenamento/validações.
v1.5.9 (30/01/2026)
• Adicionado E10.4.1 (infra do marcador setup_completed_at) como pré-requisito para diferenciar subestados de pending_setup.
• Ajustado 9.3.1 para manter foco em entitlements; remoção do hardcode/allowlist de trial no Access Context foi concluída em E10.4.1.
• Adicionado placeholder do E10.4 (Briefing) com dependências (E10.4.1, E9.3.1).
v1.5.8 (27/01/2026)
• Adicionado E16 (Accounts) para consolidar lifecycle de accounts.status (definições, transições e UX/CTAs), com referências para docs/base-tecnica.md e docs/schema.md (anti-drift).
• Ajustado E4.2 para remover redundâncias e focar no fluxo/UX do gateway e roteamentos, adicionando subitem de referências numerado.
• Ajustado E8 para focar em Access Context como decisão única e remover sobreposição com E4/E15/E16, com referências numeradas.
• Ajustado E15 (15.2–15.4) para reduzir redundâncias, apontar dependências para E16 e reforçar referências para docs/base-tecnica.md e docs/schema.md (anti-drift).
v1.5.7 (27/01/2026) — F1.1: CTA Criar conta no /a/home direciona para signup
• E4: registrado que o CTA Criar conta no /a/home (sem sessão) navega para /auth/sign-up (remoção de placeholder/modal).
v1.5.6 (27/01/2026) — F2: Auto 1ª conta (pending_setup) e atualização do fluxo pós-confirmação
• E4/E5: usuário autenticado sem membership passa a auto-criar 1ª conta pending_setup e cair em /a/[account] (modo vitrine).
• E8/E15: registrada a regra “sem membership cria; com qualquer membership não cria” e alinhado o tratamento de usuário sem membership.
• E5: registrada pendência de regressão em /auth/forgot-password (produção).
v1.5.3 (21/01/2026) — Gate SSR: UX de bloqueio por status (membership/conta)
• E4: Gate SSR roteia bloqueios de membership para rotas dedicadas e diferencia fallback de conta bloqueada por status (inactive/suspended) com páginas específicas.
• E15: Detalhada a UX/CTAs e rotas por status de membership, incluindo tratamento de usuário autenticado sem membership (clear_last).

v1.5.45 (29/04/2026) — E10.4: registra extração route-local do formulário `PendingSetupFirstSteps` e QA do fluxo `pending_setup → active`.

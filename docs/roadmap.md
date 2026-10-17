0. Introdução

0.1 Cabeçalho
- Data: 17/10/2026
- Versão: v1.5.258

0.2 Contrato do documento (consulta)
- Esta seção define o objetivo do documento e quando/como a IA deve consultá-lo.

0.2.1 TIPO_DO_DOCUMENTO
- TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
- O QUE É: a referência única do projeto para o contrato de casos (E*): status, escopo final e dependências.
- POR QUE CONSULTAR: para entender “o que já foi definido/implementado” e “qual é o próximo marco”, evitando drift com docs técnicas.
- COMO USAR: ao planejar execução, priorização e validação de escopo por caso, consultar este documento para o estado final de cada E*.
- QUANDO CONSULTAR: status/escopo/dependências de E*, decisões de produto/UX registradas no caso, e paths/artefatos quando fizerem parte do estado final do caso.
- QUANDO NÃO CONSULTAR: regras técnicas do runtime (usar `docs/base-tecnica.md`) e contrato/inventário de DB (usar `docs/schema.md`).
- NOTA: este documento registra estado final por caso; não é lugar de narrativa operacional.


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
- Status: funcionalmente implementado; permanecem pendências residuais de normalização da copy e dos erros do signup e de validação ponta a ponta em mobile.

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
- Updates:
  - Aplicados:
    - `prod#16`;
    - `prod#17`.
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

5.1.4 Mensagens públicas de erro
- Status: implementado e validado.
- Conteúdo:
  - credenciais não aceitas exibem `E-mail ou senha inválidos.` sem distinguir e-mail inexistente de senha incorreta;
  - e-mail ainda não confirmado exibe `Não foi possível entrar. Verifique se o e-mail foi confirmado e tente novamente.`, sem criar reenvio, rota ou fluxo adicional de confirmação;
  - falhas operacionais e demais erros não classificados exibem `Não foi possível entrar agora. Tente novamente em instantes.`, sem mensagem técnica crua do provedor;
  - falhas emitem evento estruturado seguro sem PII, credenciais ou erro bruto;
  - login válido, redirect vigente, alerta programático e link `Esqueci minha senha` permanecem preservados.

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
- Status: vigente.
- Conteúdo: accounts.status governa conta/setup; account_users.status governa membership. Trial, plano, assinatura e liberação manual só controlam uso quando materializados como entitlement válido. Domínio comercial separado de lib/access, public.plans e plan.ts.

9.1.4 Origem comercial e confirmação
- Status: implementado para plano_pago_confirmado e liberacao_manual; trial futuro.
- Conteúdo: checkout/webhook confirmam e persistem, sem constituir origem comercial ou prova direta de acesso. Persistência local idempotente quando aplicável.

9.1.5 Planos comerciais canônicos
- Status: vigente.
- Conteúdo: Starter/starter, Lite/lite, Pro/pro e Ultra/ultra; contrato em lib/billing-checkout/contracts.ts. plan.ts legado não governa checkout, entitlement ou capacidades.

9.1.6 Modelo mínimo de entitlement comercial
- Status: implementado.
- Conteúdo: account_commercial_entitlements é a fonte local; CommercialEntitlementSignal fornece elegibilidade, status efetivo e planKey aos consumidores server-side.

9.1.7 View efetiva
- Status: implementado.
- Conteúdo: v_account_commercial_entitlement_effective resolve a condição local efetiva, inclusive liberação manual E9.2.

9.1.8 Signal server-side
- Status: implementado.
- Conteúdo: getCommercialEntitlementSignal({ accountId }) em lib/commercial-entitlements é a API pública do sinal derivado da view.

9.1.9 Gate histórico do LP Builder — retirado
- Status: retirado com E19.
- Conteúdo: sem consumidor LP Builder; billing, checkout e gates dos consumidores independentes permanecem preservados.

9.1.10 Fail-closed, limites e ressalvas
- Status: vigente.
- Conteúdo: accountId vazio, erro, exceção, linha ausente ou estado inválido retornam não elegível. Ausência de entitlement não libera uso produtivo protegido; não existe produto LP legado ativo.

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
- Status: implementado.
- Conteúdo: platform_admin, incluindo super_admin pelo guard vigente, concede, atualiza ou cancela entitlement por action e adapter Admin server-only. Persistência exclusiva em account_commercial_entitlements com origem liberacao_manual, plano canônico, vigência válida e metadata mínima. Atualiza manual ativo sem duplicar; conflito com plano pago ou trial efetivo falha fechado.

9.3 Trial

9.3.1 Objetivo e status
- Objetivo: definir trial como origem futura de entitlement comercial.
- Status: não implementado; contrato operacional, vigência, limites, expiração e auditoria ainda dependem de recorte aprovado.

9.3.3 Trial como origem futura de entitlement
- Status: futuro.
- Conteúdo: origem distinta da liberação manual, usando a cadeia universal local de entitlement para controlar uso; não define accounts.status.

9.3.4 Vigência, expiração e limites a definir
- Status: a definir.
- Conteúdo: vigência, expiração, limites e efeitos comerciais exigem decisão antes de implementação.

9.3.5 Pendências para implementação operacional
- Status: não implementado.
- Conteúdo: contrato operacional, origem e auditoria dependem de recorte futuro aprovado; liberação manual existente não implementa trial.

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
- Status: implementado em teste.
- Conteúdo: app cria Checkout Session subscription server-side pelo boundary billing-checkout. Stripe confirma pagamento, sem substituir entitlement. free não vira plano pago; light e PlanId legado não integram o contrato novo.

9.4.4 Webhook mínimo
- Status: implementado.
- Conteúdo: POST /api/stripe/webhook persiste entitlement local sem payload bruto, secret, cartão ou PII sensível.

9.4.5 Eventos aceitos, auxiliares e ignorados
- Status: vigente.
- Conteúdo: invoice.paid ativa/renova entitlement. checkout.session.completed é auxiliar; customer.subscription.deleted e invoice.payment_failed são controlados/ignorados e não liberam uso.

9.4.6 Idempotência e persistência
- Status: implementado.
- Conteúdo: event_id único garante idempotência; retry de failed ou processing antigo usa stale_processing.

9.4.7 Limites: Stripe não substitui entitlement local
- Status: vigente.
- Conteúdo: redirect de sucesso, checkout e webhook não substituem decisão pelo entitlement local efetivo.

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
- Status: os fluxos principais estão implementados e a substituição do Pending Setup pela jornada E10.9 foi concluída e validada em Production; permanecem como lacunas a ação inefetiva de criar outra conta no switcher, a ausência dos eventos específicos do switcher e a edição manual de copy da página comercial personalizada. O onboarding factual E10.10 foi retirado funcionalmente pela E22.7; suas migrations permanecem não aplicadas e excluídas do apply.

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
- Objetivo: registrar o destino do formulário inicial de setup.
- Status: substituído pela jornada E10.9; entrada executável retirada.

10.4.2 Registros do recorte
- Referências:
  - Jornada substituta: `docs/roadmap.md` — seções 10.9, 10.11 e 10.12.
  - Dados históricos preservados: `docs/schema.md` — seção 1.8.

10.4.3 Campos e validação compartilhada
- Status: retirado.
- Conteúdo: formulário, action e validação E10.4 não integram o runtime. Identidade, contexto e conclusão seguem os contratos das jornadas substitutas.

10.4.4 Persistência e transição
- Status: substituído.
- Conteúdo: account_profiles permanece histórico, sem adapter runtime órfão. A promoção pending_setup → active continua idempotente no fluxo conversacional; timestamps legados não governam acesso ou logs.

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
- E10.7 resolve o conteúdo comercial publicado. Resolução antecipada de template e produto operacional E19 foram retirados.

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

10.9 Pending Setup pré-comercial e continuidade conversacional

10.9.1 Objetivo e status
- Objetivo: substituir a experiência E10.4 por uma jornada conversacional pré-comercial que receba a pessoa, compreenda o negócio, resolva ou preserve operacionalmente o nicho, mantenha histórico por relação usuário/conta e promova `pending_setup` para `active` sem criar entitlement.
- Status: concluído em Production. Novas conversas usam E10.12; conversas legadas mantêm E10.9, sem conversão histórica.

10.9.2 Registros do recorte
- Banco:
  - Criados:
    - `public.account_pending_setup_conversations`
    - `public.account_pending_setup_messages`
    - `public.start_account_pending_setup_v1`
    - `public.set_account_pending_setup_preferred_name_v1`
    - `public.claim_account_pending_setup_turn_v1`
    - `public.append_account_pending_setup_turn_v1`
    - `public.complete_account_pending_setup_v1`
- Repositório:
  - Criados:
    - `lib/onboarding/pending-setup/`
    - `app/a/[account]/_components/PendingSetupConversation.tsx`
    - `app/a/[account]/pending-setup-actions.ts`
    - `supabase/migrations/20260920223653_e10_9_pending_setup_conversation.sql`
    - `supabase/tests/e10_9_pending_setup_conversation.test.sql`
  - Ajustados:
    - `app/a/[account]/account-journey-loader.ts`
    - `app/a/[account]/page.tsx`
    - `lib/onboarding/niche-resolution/`
    - `lib/openai-costs/`
  - Excluídos:
    - `app/a/[account]/_components/PendingSetupFirstSteps.tsx`
    - `lib/onboarding/e10_4_setup_validation.ts`
    - `lib/access/adapters/accountProfileAdapter.ts`
- Referências:
  - Persistência, RLS e grants: `docs/schema.md` — seção 1.19A.

10.9.3 Entrada e identidade sem fricção
- Status: implementado no repositório.
- Conteúdo: criar entrada única após confirmação de e-mail, reutilizar nome preferido válido ou perguntar uma vez quando ausente e iniciar a conversa por pergunta aberta, sem exigir Site/LP, canal preferido ou “Nome do projeto”.

10.9.4 Conversa adaptativa e resolução do nicho
- Status: implementado no repositório.
- Conteúdo: reservar a versão antes de qualquer efeito, executar matching determinístico antes da IA, usar o workload `niche_resolution` somente quando houver ambiguidade, manter falha técnica em estado tentável e exigir confirmação humana tanto da sugestão oficial quanto do fallback operacional legítimo, sem inventar taxon.

10.9.5 Histórico conversacional e retomada
- Status: implementado no repositório.
- Conteúdo: persistir turnos e estado por relação usuário/conta, permitir retomada executável enquanto a conta estiver `pending_setup` e preservar o histórico, sem chat executável, após a promoção para `active`.

10.9.6 Conclusão, cutover e passagem ao comercial
- Status: concluído em Production.
- Conteúdo: conclusão transacional e idempotente promove conta sem entitlement. Entrada executável E10.4 retirada; account_profiles histórico, NicheResolutionCard de conta active, gates comerciais, checkout e entitlement preservados.

10.10 Onboarding factual pós-compra/trial

10.10.1 Objetivo e status
- Objetivo: confirmar o mínimo factual aplicável após entitlement comercial válido e taxon primário resolvido, sem refazer o Pending Setup nem exigir IA.
- Status: E10.10 foi retirada funcionalmente pela E22.7; suas migrations permanecem não aplicadas.

10.10.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.account_profiles`
    - `public.taxon_factual_fields`
- Repositório:
  - Criados:
    - `supabase/migrations/20260926145500_e10_10_account_factual_profile.sql`
    - `supabase/migrations/20260926171100_e10_10_factual_catalog_cutover.sql`
  - Ajustados:
    - `app/a/[account]/account-journey-loader.ts`
    - `app/a/[account]/page.tsx`
    - `app/a/[account]/_components/onboarding-journey-validation-cases.ts`
    - `app/a/[account]/_components/onboarding-journey-policy.ts`
    - `lib/commercial-entitlements/adapters/commercialEntitlementAdapter.ts`
    - `lib/commercial-entitlements/index.ts`
    - `lib/onboarding/niche-resolution/adapters/accountTaxonomyAdapter.ts`
    - `package.json`
- Updates:
  - Aplicados: `prod#17`.
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.8 e 1.35.

10.10.3 Recorte factual e cutover
- Status: retirado pela E22.7.
- Conteúdo: as duas migrations E10.10 não foram aplicadas e permanecem excluídas do apply. Não há cutover factual pendente nem consumidor ativo; dados e migrations históricos permanecem preservados.

10.10.4 UX factual e prontidão para a Base
- Status: retirada pela E22.7.
- Conteúdo: não integra a jornada vigente. A passagem à Base é definida na E10.11, sem prontidão factual E10.10.

10.11 Passagem mínima para a Base

10.11.1 Objetivo e status
- Objetivo: garantir nome público explícito e reaproveitamento inicial do contexto confirmado, preservando o comercial para contas sem autorização e encaminhando contas autorizadas diretamente à Base sem exigir taxon oficial.
- Status: concluído e operacional em Preview e Production.

10.11.2 Registros do recorte
- Banco:
  - Ajustados: `public.account_pending_setup_conversations`.
  - Criados: `set_account_pending_setup_business_name_v1`, `complete_account_pending_setup_v2`.
- Repositório:
  - Criados: `supabase/migrations/20260928161504_e10_11_pending_setup_business_name.sql`, `supabase/tests/e10_11_pending_setup_business_name.test.sql`, `.github/workflows/e10-11-sql-proof.yml`, `lib/onboarding/pending-setup/config.ts`.
  - Ajustados: `.github/workflows/pipeline-supabase-apply-migrations.yml`, `lib/onboarding/pending-setup/`, `lib/communication-base/`, `app/a/[account]/`.
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.19A e 3.1.2.
  - Configuração operacional: `docs/platform-config.md` — seções 2.3 e gate E10.11.

10.11.3 Nome público e contexto de saída
- Status: implementado.
- Conteúdo: coletar nome público ausente na conclusão da conversa sem confundi-lo com nome preferido, razão social ou nome da conta. Copiar nome confirmado de uma única conversa concluída ao iniciar a Base e contexto confirmado somente com consentimento; conversas históricas sem nome deixam a seção editável e vazia. A Base não sincroniza edições de volta.

10.11.4 Gate e encaminhamento
- Status: habilitado em Preview e Production.
- Conteúdo: conta autorizada segue diretamente à Base, inclusive por liberação manual E9.2 e sem taxon oficial. Conta sem autorização conserva comercial E10.6/E10.7, papéis e ações financeiras vigentes. Falha de leitura de entitlement ou taxon exigido bloqueia a decisão. A rota ativa não encaminha ao onboarding factual E10.10 após o cutover.

10.11.5 Continuidade e regressão
- Status: vigente.
- Conteúdo: matching, fallback de nicho, checkout, membership e entitlement preservados. Migrations E10.10 continuam fora do apply; o fluxo automático integral permanece suspenso.

10.12 Atendimento inicial por IA e agente vendedor

10.12.1 Objetivo e status
- Objetivo: compreender o negócio, as necessidades e o interesse do lead, oferecer orientação comercial pertinente aos serviços efetivamente disponíveis e concluir com próximo passo claro, preservando contexto e confirmando classificação existente quando houver correspondência segura.
- Status: concluído e operacional em Preview e Production, incluindo condução comercial orientada a valor e leituras independentes em paralelo. Conversas legadas E10.9 permanecem preservadas.
- Dependência: E10.13/PB-A concluída; catálogo e inteligência de mercado disponíveis e utilizados na ativação e no QA.

10.12.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.account_context_summaries`
    - `public.commit_account_pending_setup_turn_v3`
- Repositório:
  - Criados:
    - `supabase/migrations/20261011121811_e10_12_summary_capacity.sql`
    - `supabase/rollbacks/20261011121811_e10_12_summary_capacity.rollback.sql`
    - `supabase/tests/e10_12_summary_capacity.test.sql`
  - Ajustados:
    - `.github/workflows/e10-11-sql-proof.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
    - `app/admin/(protected)/workloads-openai/_proof.ts`
    - `lib/onboarding/pending-setup/attendance-core.ts`
    - `lib/onboarding/pending-setup/attendance-coordinator.ts`
    - `lib/onboarding/pending-setup/attendance-validation-cases.ts`
- Referências:
  - Memória contextual e autoridades: `docs/base-tecnica.md` — seção 3.14.6.
  - Contrato de banco aplicado: `docs/schema.md` — seções 1.19D e 3.1.3.
  - Apply, reversão e configuração operacional: `docs/platform-config.md` — seções 2.3 e 3.5.

10.12.3 Atendimento, Diálogo da conta e Resumo da conta
- Status: implementado em Preview e Production.
- Conteúdo:
  - o agente adapta perguntas, orientação e conclusão enquanto houver avanço útil, sem herdar o teto de três chamadas. Diálogo preserva histórico integral com conta e usuário participante identificados; Resumo permanece único por conta, compacto, evolutivo e contextual, sem autoridade ou versionamento funcional próprio. Distinguir síntese contextual proposta pela IA, entendimento explicitamente aceito pelo lead, classificação confirmada, sugestões ou oportunidades do vendedor e ausência de identificação. Fontes oficiais prevalecem sobre ambos.
  - interpretar a mensagem inteira, preservando contexto comercial antecipado sem exigir repetição. Na resposta composta de nome, negócio e ofertas, persistir somente o nome preferido validado no campo competente; nome do negócio permanece contextual até confirmação competente de nome público. A memória pode compactar semanticamente conteúdo anteriormente confirmado e incorporar correções posteriores, preservando significado comercial ainda vigente sem transformar sugestões em fatos. Teto global do Resumo: 6.000 caracteres, sem meta de preenchimento; entendimento individual permanece limitado a 4.000. Histórico integral permanece no Diálogo, e a confirmação do turno conserva o entendimento exibido e persistido.
- Limites: nenhuma nova tabela, estado, memória paralela, parser frase a frase, formulário oculto ou infraestrutura; demais campos mantêm seus limites. Falha de leitura operacional ou excesso ao contrato físico falha fechado, sem anúncio de sucesso.

10.12.4 Identificação pelo catálogo
- Status: implementado e validado em Preview e Production.
- Conteúdo: consultar categorias ativas e repertório pertinente do D21, comparar semanticamente o entendimento e fazer pergunta focal quando necessário. Apresentar categoria existente ao lead; somente confirmação e validação determinística permitem alterar o vínculo oficial. Não executar pesquisa Web classificatória nem criar, ativar, reativar ou manter taxons ou aliases. Sem correspondência segura, explicitar ausência de identificação, preservar entendimento operacional e permitir continuidade comercial sem inventar classificação.

10.12.5 Repertório do nicho e apoio à venda
- Status: implementado em Preview e Production.
- Conteúdo:
  - usar conteúdo de mercado efetivamente disponível do D21 para orientação pertinente, sem transformá-lo em fala obrigatória, característica declarada pelo cliente ou promessa de resultado. Apresentar serviço, condição, prazo ou disponibilidade como efetivos somente com fonte comercial vigente competente; conteúdo ilustrativo e visão estratégica não comprovam oferta. Na ausência dessa fonte, não inventar disponibilidade. D21 mantém cadastro, manutenção, pesquisa do catálogo e política global de aliases.
  - conduzir por Entender → Impressionar → Conectar → Avançar, sem quatro turnos obrigatórios ou roteiro fixo. Paralelizar somente leituras independentes; efeitos, provider e commit mantêm a ordem segura. Não há garantia de duração nem ganho causal de latência comprovado. Após compreender minimamente atividade, oferta e necessidade central, entregar insight ou oportunidade pertinente e conexão com a proposta real da LP Factory antes de outra pergunta comercial. Perguntar informação acessória somente quando material para compreender o negócio, demonstrar valor, orientar decisão ou definir o próximo passo; preservar identidade e confirmações obrigatórias. Avançar quando os critérios de conclusão vigentes estiverem satisfeitos, sem exigir diagnóstico completo ou venda esgotada e sem encerrar prematuramente conversa útil. Persuasão permanece específica ao contexto e fiel às fontes; aprofundamento comercial do D17 e independência da Base permanecem preservados.

10.12.6 Conclusão e experiência
- Status: implementado e validado em Preview e Production.
- Conteúdo: concluir quando negócio e necessidades estiverem suficientemente compreendidos, a orientação pertinente tiver sido entregue e o próximo passo comercial estiver claro, com classificação confirmada ou ausência de identificação explicitada. Confirmar categoria não encerra automaticamente o atendimento. Preservar requisitos de conclusão E10.11, identidade, WhatsApp, histórico, acesso e fronteiras comerciais. Ausência de taxon oficial não impede continuidade comercial nem bloqueia posteriormente a Base com entendimento operacional suficiente; não concede entitlement, acesso pago, trial ou contratação.
- Encerramento inconclusivo: a IA responde naturalmente a desvio ocasional e redireciona; diante de desvio persistente, repetição, dúvidas circulares ou ausência de avanço útil, encerra cordialmente e preserva contexto comercial e pendência no Resumo. Não promete análise posterior, prazo, retorno automático ou novo contato; retomada útil permanece possível, sem contador de chamadas, tempo fixo ou failsafe econômico.
- Limites: D17 conserva objeções, comparação/recomendação e encaminhamento aprofundado à contratação enquanto sua absorção não for explicitamente aprovada. Não criar relacionamento operacional com a Base, sincronização de fontes oficiais, engine genérica, consumidores futuros ou continuidade assíncrona. Falha preserva contexto válido para retomada; alteração externa impede sobrescrita, duplicação e falso sucesso sem reconstruir proposta ou exigir reavaliação e nova confirmação automáticas. Após conclusão correta, Pending Setup não governa mudanças posteriores da conta.

10.13 Cadastro inicial de taxonomia e inteligência de mercado

10.13.1 Objetivo e status
- Objetivo: reconciliar integralmente o Nichos.zip e a pasta original com o catálogo compartilhado, cadastrar e ativar somente segmentos e nichos válidos e ausentes e disponibilizar a inteligência de mercado aproveitável pelas estruturas existentes.
- Status: carga inicial e disponibilidade operacional concluídas; E10.5 e E10.12 preservadas, sem dependência de PB-B.

10.13.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.business_taxons`
    - `public.taxon_market_research`
    - `public.taxon_market_research_items`
- Repositório:
  - Criados:
    - `supabase/snippets/e10_13_source_inventory.csv`
    - `supabase/snippets/e10_13_initial_catalog.sql`
    - `supabase/snippets/e10_13_initial_catalog_verify.sql`
    - `supabase/snippets/e10_13_editorial_correction.sql`
    - `supabase/snippets/e10_13_editorial_correction_verify.sql`
    - `supabase/snippets/e10_13_editorial_review.md`

10.13.3 Reconciliação e carga da taxonomia
- Status: concluído; cinco ocorrências de quatro rótulos ambíguos permanecem justificadamente pendentes, sem impedir o aceite aprovado.
- Conteúdo:
  - inventariar todas as entradas do acervo e justificar cada destino como reutilizado, nova categoria, especialização/contexto, duplicado ou pendente, sem cota de nichos;
  - confrontar o catálogo completo, incluindo aliases e categorias inativas, reutilizando a hierarquia e inserindo apenas segmentos e nichos semanticamente seguros e ausentes, com pais ativos e válidos;
  - não criar ultranichos ou aliases, reativar categorias, duplicar inativos ou transformar oferta, público, localidade ou atributo do cliente em nicho artificial;
  - preservar registros existentes, abortar integralmente colisões ou concorrência e comprovar hierarquia, estados e ausência de duplicações por comparação antes/depois e leitura separada após a escrita; ambiguidades permanecem justificadas sem bloquear os itens seguros.

10.13.4 Adaptação e disponibilidade do conteúdo
- Status: concluído; conteúdo comercial disponível, pesquisas e itens preexistentes preservados. Oito novos nichos sem pesquisa específica e lacunas de validação e atualização permanecem identificados para PB-B, sem autorizar execução.
- Conteúdo:
  - adaptar o material aproveitável ao taxon correto, com panorama, tendências, maturidade digital pertinente, oportunidades de comunicação e diferenciação condicional, sem tamanho uniforme ou pesquisa extensa por nicho;
  - distinguir fontes, períodos, dados históricos, incertezas e limitações; indicadores exigem fonte e período, e hipóteses não podem ser atribuídas à empresa;
  - persistir conteúdo aditivo nas estruturas compartilhadas existentes, preservando pesquisas válidas, e comprovar vínculos, amostras representativas e leitura autorizada; escrita isolada não comprova disponibilização;
  - identificar lacunas por nicho para PB-B, sem iniciar pesquisa complementar de rotina ou manutenção periódica; integração conversacional pertence ao D15B, e dores, crenças, copy e particularidades da empresa pertencem ao D14D;
  - preservar contas, Bases, produtos publicados, entitlement, busca e consumidores existentes; não criar interface, runtime, schema, permissões, infraestrutura, job, agente operacional, automação ou contato automático com leads.

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
- A E11.1.4 permanece proprietária funcional de toda a jornada de convite.
- A origem do callback prioriza o override explícito `NEXT_PUBLIC_SITE_URL`; em deployments Vercel, usa `VERCEL_BRANCH_URL` no Preview ou `VERCEL_PROJECT_PRODUCTION_URL` em Production, com `VERCEL_URL` como fallback. Ausência ou origem inválida continua falhando de forma fechada.
- A validação funcional em Production comprovou e-mail recebido, `/auth/confirm` sem `/auth/error`, cadastro concluído, membership `viewer/active` e login no tenant correto; não houve comprovação de todos os papéis, ambientes ou casos extremos.

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
- A política comercial não cria dashboard paralelo; conta com entitlement segue a jornada vigente E10.11.

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
- Operações de domínio: páginas comerciais E10.7, entitlement manual E9.2, gestão de seções da Base E25.3 e workloads/custos OpenAI E21. Insumos factuais E20 foram retirados.

12.1.4 Áreas atuais
- Disponíveis: Base de Comunicação, Contas, Resoluções de nicho, Taxonomia, Páginas comerciais, Estrutura da LP, Workloads OpenAI, Custos OpenAI e Documentação.
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
- Objetivo: consultar e gerir a taxonomia, acompanhar resoluções de nicho e conectar o diagnóstico comercial vigente.
- Status: implementado; seleção, cobertura, liberação e avaliação factual E20 foram retiradas pela E22.7.

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
    - `lib/admin/adapters/adminCommercialActivationTemplatesAdapter.ts`
    - `lib/admin/adapters/adminNicheResolutionsAdapter.ts`
    - `lib/admin/adapters/adminReadOnlyAdapter.ts`
    - `lib/admin/adapters/adminTaxonomyAdapter.ts`
- Referências:
  - Retirada factual: `docs/roadmap.md` — seção 22.7.

12.5.3 Taxonomia
- Status: implementado.
- Conteúdo:
  - Lista com busca e filtros por nível e status; detalhe com identidade, hierarquia, uso operacional, aliases e diagnóstico comercial.
  - platform_admin cria, edita, ativa/inativa, administra aliases e exclui com segurança, preservando vínculos, pai ativo e concorrência otimista.
  - Taxons novos nascem inativos. Não há seleção de pesquisa ou avaliação factual E20.

12.5.4 Resoluções de nicho e navegação
- A lista e o detalhe de resoluções permanecem read-only, com entrada, confiança, decisão determinística, estado IA e necessidade de revisão.
- A navegação para Taxonomia e Página comercial usa somente o taxon confirmado; sugestão IA isolada não é tratada como vínculo oficial.
- Falha de um diagnóstico não inventa prontidão nem escolhe resultado silenciosamente.
- Perfis de orientação, pesquisas da E10.8 e seus estados órfãos não aparecem nas superfícies atuais.

12.5.5 Evolução da revisão factual por taxon
- Status: retirado pela E22.7.
- Conteúdo: cobertura, fields herdados, liberação e assistência factual não integram o detalhe. A taxonomia administrativa preservada segue 12.5.3.

12.6 Estrutura da LP no Admin Dashboard

12.6.1 Objetivo e status
- Objetivo: consultar os parâmetros raiz independentes da landing page.
- Status: implementado; visões de Entradas, módulos, variantes e pesquisas retiradas.

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
  - Parâmetros raiz: E18.4.
  - Retirada da gestão factual: `docs/roadmap.md` — seção 22.7.

12.6.3 Consulta vigente
- Status: implementado.
- Conteúdo:
  - Um item Estrutura da LP e uma rota /admin/estrutura-lp, protegidos por autoridade de plataforma.
  - Parâmetros consulta a API pública E18.4 por versão raiz e preset; queries antigas ou visões desconhecidas retornam a Parâmetros.
  - Leitura server-only, sem N+1, registry privado ou regra de domínio em React; não há gestão factual, IA ou publicação de catálogo.

12.6.4 Evolução do catálogo factual
- Status: retirado pela E22.7.
- Conteúdo: a visão Entradas e a gestão factual E20.8 não integram a superfície vigente; sem cutover ou QA factual pendentes.

12.7 Contrato de apresentação para páginas operacionais de dashboard

12.7.1 Objetivo e status
- Objetivo: manter canônico o contrato de UX/UI para novas páginas e recortes operacionais do Admin e Account Dashboard, com herança pelo Partner Dashboard quando funcional.
- Status: contrato e enforcement transversal vigentes, sem alteração automática de superfícies existentes.

12.7.2 Registros do recorte
- Updates:
  - Aplicados:
    - `prod#17`
- Referências:
  - Contrato visual canônico: `docs/design-system.md` — Contrato de apresentação para páginas operacionais de dashboard.
  - Gate de planejamento: `docs/prompt-estrategista.md`.
  - Gate operacional: `AGENTS.md`.

12.7.3 Materialização canônica do contrato mínimo
- Status: vigente.
- Conteúdo: baseline de novas páginas operacionais no Design System; preserva autoridade funcional de domínio e tecnologia de listas em aberto. Não modifica superfícies existentes automaticamente.

12.7.4 Refinamento canônico de composição e responsividade
- Status: vigente.
- Conteúdo: lista tabular compacta, controles por atributo nos cabeçalhos, abas irmãs e adaptação mobile; cards como exceção funcional. Cobre Admin e Account Dashboard, e Partner quando funcional; páginas públicas e LPs comerciais ficam fora.

12.7.5 Enforcement do contrato de apresentação
- Status: vigente.
- Conteúdo: decisão humana registra somente eventual exceção funcional. Implementação, revisão e QA demonstram aderência ao Design System ou exceção autorizada; o contrato detalhado permanece na fonte visual canônica.

12.8 Piloto do padrão transversal no fluxo Taxonomia e cobertura factual

12.8.1 Objetivo e status
- Objetivo: aplicar o padrão visual da E12.7 à taxonomia com linguagem humana e continuidade entre tarefas.
- Status: piloto de Taxonomia implementado; piloto factual retirado pela E22.7. Demais áreas fora do recorte.

12.8.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/taxonomia/page.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
- Referências:
  - Contrato visual: `docs/design-system.md` — Contrato de apresentação para páginas operacionais de dashboard.

12.8.3 Taxonomia como piloto de coleção e detalhe
- Status: implementado.
- Conteúdo:
  - Linhas compactas com identidade humana, nível, estado, diagnóstico e ação Abrir; busca global e filtros de nível/estado preservados.
  - Desktop com filtros junto aos cabeçalhos; mobile com controles compactos e rolagem horizontal indicada.
  - Detalhe prioriza identidade, estado e ações humanas; detalhes técnicos em segundo nível. Sem cobertura ou IA factual E20.

12.8.4 Cobertura factual e subtarefas como piloto de interação
- Status: retirado pela E22.7.
- Conteúdo: cobertura, gestão de fields e retorno factual ao taxon não integram o produto; o padrão de interação geral permanece no Design System, sem consumidor factual ativo.

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
  - Setup da conta: `docs/roadmap.md` — seções 10.9–10.12.
  - Entitlement comercial: E9.1.

16.1.3 Estados vigentes
- `pending_setup`: conversa de setup incompleta; atendimento E10.12 ou conversa legada E10.9.
- `active`: setup concluído; entitlement vigente leva à Base, ausência mantém comercial ou espera conforme papel; erro de leitura falha fechado. Sem produto LP legado.
- `inactive`: bloqueio operacional reversível; o guard impede a seção privada e envia para a tela pública de conta inativa.
- `suspended`: bloqueio administrativo; o guard impede a seção privada e envia para a tela pública de conta suspensa.
- O status da conta é independente do status de cada membership: ambos precisam permitir a operação solicitada.

16.1.4 Transição implementada
- `pending_setup → active` ocorre pela conclusão válida e transacional da conversa vigente E10.9/E10.12 com requisitos E10.11.
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
    - `automations/supabase-inspect/`
    - `automations/docs-apply-report/`
  - Ajustados:
    - `AGENTS.md`
    - `package.json`
- Referências:
  - Catálogo operacional: `docs/automations.md` — automações vigentes.
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

17.1.5 Facilitadores de teste retirados
- Status: Validador Final e Niche Runtime Tests retirados pela E22.6, sem substituto neste recorte.
- A retirada não altera a autoridade funcional de E5 ou E10.5.6 e não apaga contas nem evidências existentes.

17.1.6 Pipelines operacionais
- `pipeline-supabase-inspect` executa SQL read-only com saída em logs e Job Summary.
- `pipeline-docs-apply-report` aplica report JSON em Markdown, cria branch e Pull Request e mantém revisão humana antes do merge.
- `pipeline-supabase-apply-migrations` mantém o apply automático integral suspenso durante o backlog E10.10. A exceção manual E25.1 aplicou somente as duas migrations autorizadas; o gate `SUPABASE_APPLY_MIGRATIONS_ENABLED` voltou a `false`. Novos applies exigem decisão operacional própria, conforme `docs/platform-config.md`.
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

17.9 Autonomia institucional de QA

17.9.1 Objetivo e status
- Objetivo: estabelecer uma identidade institucional exclusiva do LP Factory, operada autonomamente por IA, capaz de agir como usuário humano em jornadas variáveis de QA sem depender da presença de Alcino.
- Status: planejado; objetivo ainda não atingido.

17.9.3 Consulta autônoma ao catálogo institucional de QA
- Objetivo: disponibilizar e comprovar a consulta autônoma pelo Executor ao catálogo institucional de contas e usuários QA.
- Status: concluída pelo piloto do PR #912.
- O piloto comprovou a localização e a consulta da identidade QA autorizada no catálogo vigente; convite, autenticação e demais fases operacionais posteriores permanecem fora deste recorte.

17.11 Uso do Catálogo de QA

17.11.1 Objetivo e status
- Objetivo: explicitar no contrato do Executor a consulta ao Catálogo de QA durante testes já autorizados e a atualização estritamente correspondente quando o próprio teste alterar valor catalogado.
- Status: concluído no contrato do Executor, sem QA de produto, ampliação de autoridade ou mutação funcional do catálogo.

17.11.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `.agents/skills/lp-factory-executar-plano/SKILL.md`

17.11.3 Contrato de consulta e atualização pontual
- O Executor pode consultar o Catálogo de QA quando um teste já autorizado pelo recorte competente precisar de valor catalogado; a consulta não amplia o escopo nem a autoridade do teste consumidor.
- Se o próprio teste alterar valor já catalogado, somente o registro correspondente é atualizado; sem alteração de valor catalogado, o catálogo não é mutado.
- A E17.11 não autoriza jornada de produto, mailbox, browser, Preview, convite, autenticação, recuperação, automação ou infraestrutura.

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
  - Retirada das entradas factuais: `docs/roadmap.md` — seção 22.7.

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
- Autoridade factual E20 e produto E19 foram retirados; a raiz não cria consumidor ou persistência substitutos.
- O Admin expõe somente parâmetros raiz; a consulta não promove o ciclo de vida hypothesis.
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
- Parametrização raiz E18.4 preservada; autoridade factual E20 encerrada pela E22.7.
- O antigo caminho E19.3 → E19.4 foi retirado e não dependia deste catálogo.

19. E19 — legado operacional de Landing Pages retirado
- Objetivo vigente: registrar o estado físico residual do antigo produto de Landing Pages sem reintroduzir consumidor ou compatibilidade de runtime.
- Status: produto, geração, `lib/lp-builder/`, apresentação, compatibilidade com E20.2 e escrita prospectiva de custos foram retirados. Nenhuma nova arquitetura greenfield é antecipada.

19.1 Fronteiras retiradas
- `lib/lp-builder/` e `lib/conversion-content/landing-page/presentation/` não existem mais no boundary vigente.
- Os workloads `landing_page_draft_generation` e `landing_page_draft_image_generation`, suas provas administrativas e branches exclusivas de image workload foram removidos.
- O catálogo independente de modelos de imagem permanece disponível para governança de modelos, sem implicar workload de imagem ativo.
- A autoridade factual E20.8, a pesquisa E20.5 e a liberação humana preservada permanecem independentes da E19; E20.7 foi retirada terminalmente depois deste fechamento histórico.

19.2 Account Dashboard
- Contas ativas seguem a experiência comercial preservada, sem desvio por estado de configuração, LP ou revisão.
- Owner sem entitlement mantém as ações financeiras aplicáveis; demais papéis sem entitlement mantêm o estado de espera.
- Não existem rotas substitutas para detail, configuração, histórico, Preview ou aprovação do produto retirado.

19.3 Estado físico residual
- Tabelas, RPCs, migrations, ponteiro de aprovação, dados históricos e o bucket `landing-page-revision-assets` permanecem no estado físico descrito em `docs/schema.md`, sem limpeza destrutiva.
- As residências antigas de conta, configuração, revisão e materialização não participam da autoridade factual E20.8 nem do runtime do produto.
- Os objetos físicos e registros históricos não possuem consumidor no runtime do produto e são resíduos inertes; sua eventual remoção exige recorte próprio.
- `E19_5_WORKSPACE_ENABLED` não possui consumidor no código e permanece apenas como variável hospedada inativa, sem alteração de plataforma neste recorte.

19.4 Histórico
- O detalhe da arquitetura abandonada permanece recuperável pelos PRs e pelo histórico Git; a documentação canônica não a mantém como obrigação vigente.
20. E20 — Catálogo factual, pesquisa opcional e revisão de taxons
- Objetivo: registrar o encerramento da autoridade factual, seleção e revisão E20.
- Status: domínio retirado pela E22.7, sem consumidor, gate ou pendência vigente. Capacidades independentes E10, E21 e E25 preservadas.

20.2 Catálogo de entradas por taxon

20.2.1 Objetivo e status
- Objetivo: registrar o encerramento do catálogo versionado.
- Status: retirado; substituído pela E20.8, também encerrada pela E22.7.

20.2.3 Encerramento
- Status: encerrado.
- Conteúdo: registry, versões, drafts, publisher e compatibilidade não integram o runtime. Não há retomada ou migração pendente; retirada vigente na E22.7.

20.3 Perfil de orientação para geração — retirado

20.3.1 Objetivo e status
- Objetivo: registrar o destino do antigo perfil versionado de orientação à geração.
- Status: retirado pela E22.1.4; não existe substituto.

20.3.2 Registros do recorte
- Referências:
  - Retirada material: `docs/roadmap.md` — seção 22.1.2.

20.3.3 Estado vigente
- Status: retirado.
- Conteúdo: código, tabelas e RPCs próprios foram removidos, preservando migrations históricas, pesquisas compartilhadas e audit_logs. Sem domínio ou workload substituto.

20.5 Seleção da pesquisa integral `end_customer` por taxon

20.5.1 Objetivo e status
- Objetivo: registrar o destino da seleção de pesquisa integral end_customer.
- Status: retirada pela E22.7, sem consumidor ou pendência de ativação.

20.5.2 Registros do recorte
- Referências:
  - Retirada funcional: `docs/roadmap.md` — seção 22.7.
  - Coluna residual e permissões: `docs/schema.md` — seção 1.11.

20.5.3 Pesquisa repo-only
- Status: retirado.
- Conteúdo: o leitor repo-only exclusivo foi removido; pesquisas brutas e estruturadas compartilhadas permanecem preservadas para consumidores independentes.

20.5.4 Seleção e consumo
- Status: retirado.
- Conteúdo: UI, seleção, gate e mutação exclusivos não integram o runtime. A coluna histórica não concede autoridade ou escrita.

20.5.5 Papel opcional na revisão factual
- Status: retirado.
- Conteúdo: não existe revisão factual E20 ativa nem fallback Web Search para essa capacidade.

20.6 Liberação e revisão factual de taxons

20.6.1 Objetivo e status
- Objetivo: registrar o destino da liberação e revisão factual de taxons.
- Status: retiradas pela E22.7; taxonomia administrativa independente preservada.

20.6.3 Contrato vigente
- Status: retirado.
- Conteúdo: cobertura, liberação factual, avaliação assistida e workload exclusivos foram encerrados. O CRUD de taxonomia exige guard de plataforma, pai ativo e concorrência otimista; novos taxons nascem inativos, conforme E22.7.

20.7 Resolução de conhecimento para geração

20.7.1 Objetivo e status
- Objetivo: registrar o encerramento da resolução de conhecimento para geração.
- Status: retirada em 14/09/2026, sem consumidor ou substituto. Revisões, ativações e custos anteriores permanecem inertes nas fontes E21.

20.8 Substituição greenfield e simplificação terminal da E20

20.8.1 Objetivo e status
- Objetivo: registrar o destino da autoridade factual greenfield.
- Status: encerrada pela E22.7, sem cutover, apply, ativação ou QA factual pendentes.

20.8.2 Registros do recorte
- Referências:
  - Retirada material e capacidades independentes: `docs/roadmap.md` — seção 22.7.
  - Dados factuais residuais e ACLs: `docs/schema.md` — seção 1.35.

20.8.3 Demolição controlada da E20 vigente
- Status: concluída.
- Conteúdo: boundaries e consumidores exclusivos foram retirados; bibliotecas e dados compartilhados só permanecem quando houver consumidor independente.

20.8.4 Autoridade factual única
- Status: encerrada.
- Conteúdo: taxon_factual_fields permanece como dado histórico inerte, sem autoridade factual, segunda residência ou gate de produto.

20.8.5 Herança e resolução factual
- Status: retirada.
- Conteúdo: resolução, herança e adapters factuais exclusivos não integram o runtime; a Base não herda essa autoridade.

20.8.6 Gestão administrativa simples
- Status: retirada.
- Conteúdo: não existe gestão factual na visão Entradas; a consulta independente de parâmetros raiz da E18.4 permanece na E12.6.

20.8.7 Liberação humana e apoio opcional por IA
- Status: retirados.
- Conteúdo: workload factual, provas e ações exclusivas foram encerrados; revisões, ativações e custos históricos permanecem preservados, sem novas operações.

20.8.8 Cutover e limpeza terminal
- Status: encerrado pela E22.7.
- Conteúdo: apply seletivo, retirada dos gates e validação hospedada concluídos. Não reativar a sequência histórica de cutover; migrations históricas permanecem imutáveis e dados preservados.

21. E21 — Gestão e governança dos workloads OpenAI
- Objetivo: manter autoridade única de identidade, configuração, observabilidade e custo dos workloads OpenAI, com operação administrativa segura.
- Status: configuração operacional e controle ativo de custos vigentes; E21.5.6 concluída em Production. Avaliação comparativa E21.3 pausada; E21.4 somente leitura histórica.

21.1 Fundação, normalização e leitura dos workloads OpenAI

21.1.1 Objetivo e status
- Objetivo: centralizar identidades, modalidades, baselines locais, resolução e telemetria segura dos workloads OpenAI, mantendo prompts, schemas e regras funcionais nos domínios consumidores.
- Status: implementada e vigente. O catálogo estrutural contém cinco workloads textuais de produto mais a referência operacional read-only do Supabase Inspect; não há workload de imagem ativo.

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
    - `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
    - `components/admin/adminNavigation.ts`
    - `package.json`
- Referências:
  - Boundary técnico: `docs/base-tecnica.md` — seção 3.16.
  - Configuração e credenciais: `docs/platform-config.md` — seções 3.5 e 6.3.

21.1.3 Catálogo estrutural e resolução explícita
- Status: vigente.
- Conteúdo:
  - Registry repo-only imutável define identidades, modalidades, consumidores e baseline local; inventário exato em lib/openai-workloads/registry.ts. Produto aceita somente responses_text e rejeita identidade, modalidade ou ambiente desconhecidos; supabase_inspect é referência operacional externa.
  - Development usa baseline versionado. Preview e Production resolvem a revisão ativa pelo gate E21.2, sem fallback silencioso quando ligado.
  - Configuração governa modelo, effort e política permitida; prompts, schemas, limites, persistência e fallbacks pertencem ao domínio consumidor.

21.1.4 Integração e observabilidade comum
- Status: vigente.
- Conteúdo: consumidores resolvem pela API pública antes do transporte e preservam origem/revisão. Telemetria somente de metadados técnicos seguros, resultado, falha, latência e usage disponível; ausentes ficam null. Sem prompt, resposta integral, negócio, PII, secrets ou estimativa monetária comum. Workloads retirados só permanecem no histórico financeiro; variáveis legadas de modelo não governam execução.

21.1.5 Inventário administrativo
- Status: implementado.
- Conteúdo: /admin/workloads-openai projeta o registry para platform_admin com modalidade, configuração, origem, revisão, consumidor e fallback. Supabase Inspect é referência não verificada pelo Core; não há consulta OpenAI/GitHub/Vercel para montar inventário nem exposição de conteúdo protegido.

21.2 Configuração operacional dinâmica dos workloads OpenAI

21.2.1 Objetivo e status
- Objetivo: administrar configuração por ambiente/workload com candidata, prova, promoção, ativação e rollback humano sem novo deploy ordinário.
- Status: ativo em Preview e Production via supabase_operational; Development usa repo_catalog. Allowlist limita unidades correntes; configurações de workloads retirados permanecem inertes.

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
    - `public.add_openai_model_catalog_reasoning_effort_v1`
    - `public.reconcile_openai_model_catalog_luna_v1`
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
    - `app/admin/(protected)/workloads-openai/openAiModelIdentity.ts`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiConfigurationManager.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiModelCatalogManager.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiWorkloadsTabs.tsx`
    - `app/admin/(protected)/workloads-openai/_components/OpenAiWorkloadDetail.tsx`
    - `app/admin/(protected)/workloads-openai/_proof.ts`
    - `app/admin/(protected)/workloads-openai/actions.ts`
    - `app/admin/(protected)/workloads-openai/catalogActions.ts`
    - `app/admin/(protected)/workloads-openai/commercialProof.ts`
    - `app/admin/(protected)/workloads-openai/proofCore.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.ts`
    - `app/admin/(protected)/workloads-openai/validation-cases.tsx`
    - `supabase/migrations/20260820190422_e21_2_3_openai_workload_operational_configurations.sql`
    - `supabase/migrations/20260823144334_e21_2_5_openai_model_catalog.sql`
    - `supabase/migrations/20260827203000_postgrest_safe_application_conflicts.sql`
    - `supabase/migrations/20260926111926_e21_2_6_openai_model_catalog_identity.sql`
    - `supabase/snippets/e21_2_3_openai_workload_operational_configurations_verify.sql`
    - `supabase/snippets/e21_2_5_openai_model_catalog_verify.sql`
    - `supabase/snippets/postgrest_safe_application_conflicts_verify.sql`
    - `supabase/tests/e21_2_3_openai_workload_operational_configurations.test.sql`
    - `supabase/tests/e21_2_5_openai_model_catalog.test.sql`
    - `supabase/tests/e21_2_6_openai_model_catalog_identity.test.sql`
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
- Status: vigente.
- Conteúdo:
  - Configuração ativa, candidata, revisões validadas e ativações append-only separadas por ambiente/workload.
  - Gate ligado em Preview/Production exige Supabase íntegro, sem fallback local; Development usa registry. Sem cache, Realtime ou segunda residência.
  - Unidade administrável: modelo/effort textual e modelo/quality de imagem quando houver consumidor. Demais parâmetros, prompts, schemas e timeouts permanecem code-owned quando fora dessa unidade.

21.2.4 Lifecycle administrativo e estado operacional
- Status: implementado.
- Conteúdo:
  - Cada action reautoriza platform_admin, deriva ator server-side e valida ambiente, workload, versão, revisão e shape antes de mutar.
  - Salvar/descartar candidata, provar e promover são explícitos; falha conserva candidata e revisão ativa. Ativação e rollback exigem ação humana e preservam histórico; conflito não dispara retry autônomo.
  - Workload retirado não origina nova candidata, prova, promoção, ativação ou tracking. Configuração física antiga não comprova consumidor vigente.

21.2.5 Catálogo administrável e UX
- Status: implementado.
- Conteúdo:
  - Catálogo global controla novas candidatas; save, prova e promoção revalidam elegibilidade. Indisponibilidade bloqueia novas escolhas, preservando ativas e rollback histórico válido.
  - Abas Modelos/Workloads mostram somente o assunto selecionado. Modelos em linhas compactas com parâmetros e Configurar; identidades históricas e indisponíveis em segundo nível.
  - Workloads expõe função, configuração e Abrir, seletor Preview/Production e lifecycle expansível. Catálogo de imagem é independente de workload ativo.
  - Leituras completas, ordenadas e fail-closed; papel sem platform_admin não recebe catálogo, configuração, provas ou mutações.

21.2.6 Correção e proteção do catálogo de modelos OpenAI
- Status: concluído e operacional.
- Conteúdo:
  - Novo modelo exige confirmação ao vivo do ID técnico exato pela OpenAI; erro ou divergência bloqueia persistência. Nasce indisponível; efforts são informados pelo administrador, sem inferência externa.
  - Lock por identidade/modalidade impede variantes de caixa. Effort textual novo nasce indisponível e usa versão otimista; variantes históricas retiradas não são redisponibilizadas e preservam histórico/rollback.
  - Nenhuma revisão, ativação, configuração ou prova muda automaticamente; sem descoberta de efforts, sincronização periódica ou infraestrutura adicional.

21.3 Evidências e avaliação de custo-benefício

21.3.1 Objetivo e status
- Objetivo: comparar configurações por workload com evidência reproduzível de qualidade, validade, correção humana, usage, latência, custo e estabilidade.
- Status: pausada e sem implementação incorporada ao produto. Não existe laboratório, banco, rota ou decisão automática de baseline em operação; qualquer retomada depende de nova decisão humana e de revalidação contra o estado vigente.

21.3.2 Registros do recorte
- Referências:
  - Critérios técnicos e fotografia corrente, sem conteúdo financeiro: `docs/openai-model-snapshot.md`.
  - Preço listado: fonte oficial da OpenAI capturada como evidência focal no momento de eventual retomada; custo real observado: autoridade vigente da E21.5.
  - Contratos de telemetria e configuração: `docs/base-tecnica.md` — seção 3.16.

21.3.3 Condições de retomada
- A unidade textual de comparação deve ser `workload + modelo + reasoning effort`; imagem mantém configuração e métricas próprias.
- A avaliação deve reutilizar a observabilidade segura da E21.1 e considerar, quando disponíveis, resultado válido, qualidade, correção humana, tokens, latência, custo e estabilidade.
- Não definir vencedor ou baseline universal sem amostra representativa e aceite humano.
- Não criar banco, dashboard, job, agente, engine de otimização ou troca automática enquanto o recorte permanecer pausado.

21.4 Visibilidade financeira e histórico de custos OpenAI

21.4.1 Objetivo e status
- Objetivo: apresentar ao platform_admin o total oficial OpenAI e a série LP congelada, com diferença explícita em Outros gastos / reconciliação.
- Status: operacional em Production; Costs API governa o total, E21.5 governa o controle ativo e E21.4 permanece somente leitura.

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
  - Ajustados:
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
- Status: implementado.
- Conteúdo:
  - /admin/custos-openai consulta sob demanda total oficial e histórico do mesmo período UTC; apenas platform_admin.
  - Paginação ordenada e agregação incremental decimal exata, sem reter todas as linhas. Resposta inválida, repetida, regressiva ou interrompida falha fechado; término PostgREST é explícito.
  - Detalhe conta → LP → workload com tentativas, pendências, sem preço e cobertura completa/parcial/degradada/indisponível. Falhas anteriores ao início persistido não são individualizadas. Diferença oficial menos atribuível sem clamp.
  - RPC ainda materializa, ordena e usa offset; sem snapshot transacional entre páginas ou prova de volume arbitrário/ganho SQL.
  - Fora: classificação financeira ampla, câmbio, cobrança, créditos, outros workloads nesse histórico e reconstrução retroativa.

21.4.6 Transição para histórico legado

21.4.6.1 Objetivo e status
- Objetivo: preservar série E21.4 somente leitura e E21.5 como controle ativo.
- Status: concluído e aplicado.

21.4.6.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.openai_lp_cost_events`
    - `public.openai_lp_cost_coverage`
    - `public.prevent_openai_lp_cost_mutation_v1`
    - `public.append_openai_lp_cost_start_v1`
    - `public.append_openai_lp_cost_terminal_v1`
    - `public.register_openai_lp_cost_coverage_v1`
- Repositório:
  - Criados:
    - `supabase/migrations/20260912143448_e21_4_6_freeze_openai_lp_cost_history.sql`
    - `supabase/tests/e21_4_6_openai_lp_cost_history.test.sql`
    - `supabase/snippets/e21_4_6_openai_lp_cost_history_verify.sql`
  - Ajustados:
    - `lib/openai-costs/validation-cases.ts`
  - Excluídos:
    - `supabase/tests/e21_4_4_openai_lp_cost_tracking.test.sql`
    - `supabase/snippets/e21_4_4_openai_lp_cost_tracking_verify.sql`
- Updates:
  - Aplicados:
    - `supa#40`
- Referências:
  - Configuração operacional E21.5: `docs/platform-config.md` — seções 2.2 e 3.5.
  - Contrato preservado do histórico: `docs/schema.md` — seções 1.36, 1.37 e 3.10.

21.4.6.3 Implementação e limites
- Status: vigente.
- Conteúdo:
  - service_role mantém SELECT e RPC de leitura; INSERT/UPDATE/DELETE/TRUNCATE das tabelas e EXECUTE das RPCs de escrita/corte revogados. Sem acesso público/client.
  - Validators impedem reintroduzir gate, produtor ou escrita E21.4. Testes e snippet vigentes substituem provas antigas.
  - Sem backfill, reprecificação, reclassificação, exclusão de linha, alteração do corte, novo produtor/UI ou edição de migration aplicada.

21.4.6.4 Gates externos
- Status: concluídos.
- Conteúdo: baseline e corte preservados; RLS sem policies e ACLs de leitura mantidos. Admin financeiro único combina total oficial, controle ativo, histórico e reconciliação; acesso comum permanece bloqueado.

21.5 Controle ativo de custos OpenAI por workload e conta

21.5.1 Objetivo e status
- Objetivo: atribuir e reconciliar custo programático por universo, conta comprovável, workload, evento, execução, operação, modelo e effort, preservando total oficial e histórico congelado.
- Status: controle ativo e dimensão econômica E21.5.6 concluídos e operacionais em Production. Correlação factual E21.5.7 foi concluída e posteriormente retirada com seu consumidor E20.

21.5.2 Registros do recorte
- Banco:
  - Criados:
  - `openai_cost_executions`
    - `openai_cost_operations`
    - `openai_cost_coverage`
    - `start_openai_cost_execution_v1`
    - `finish_openai_cost_execution_v1`
    - `start_openai_cost_operation_v1`
    - `finish_openai_cost_operation_v1`
    - `finish_openai_cost_operation_v2`
    - `register_openai_cost_coverage_v1`
    - `read_openai_active_cost_rows_v1`
    - `start_openai_cost_execution_v2`
    - `read_openai_active_cost_rows_v2`
- Repositório:
  - Criados:
    - `lib/openai-costs/active-contracts.ts`
    - `lib/openai-costs/ingestion.ts`
    - `lib/openai-costs/recorder.ts`
    - `lib/openai-costs/adapters/activeCostReadModelAdapter.ts`
    - `lib/openai-costs/adapters/activeCostReadModelAdapterCore.ts`
    - `lib/openai-costs/adapters/activeCostTrackingAdapter.ts`
    - `lib/openai-costs/adapters/activeCostTrackingAdapterCore.ts`
    - `lib/openai-costs/active-cost-validation-cases.ts`
    - `lib/openai-costs/active-validation-cases.ts`
    - `app/api/internal/openai-costs/route.ts`
    - `automations/supabase-inspect/costRecorder.mjs`
    - `automations/supabase-inspect/responsesClient.mjs`
    - `supabase/migrations/20260911150000_e21_5_3_openai_active_cost_tracking.sql`
    - `supabase/tests/e21_5_3_openai_active_cost_tracking.test.sql`
    - `supabase/snippets/e21_5_3_openai_active_cost_tracking_verify.sql`
    - `supabase/migrations/20260911190000_e21_5_4_openai_cost_calculation_read_model.sql`
    - `supabase/tests/e21_5_4_openai_cost_calculation_read_model.test.sql`
    - `supabase/snippets/e21_5_4_openai_cost_calculation_read_model_verify.sql`
    - `lib/openai-costs/economic-hierarchy.ts`
    - `app/admin/(protected)/custos-openai/_components/OpenAiEconomicHierarchy.tsx`
    - `supabase/migrations/20260912215000_e21_5_6_openai_cost_event_correlation.sql`
    - `supabase/tests/e21_5_6_openai_cost_event_hierarchy.test.sql`
    - `supabase/snippets/e21_5_6_openai_economic_events_verify.sql`
  - Ajustados:
    - `lib/openai-costs/pricing.ts`
    - `lib/openai-costs/dashboard.ts`
    - `lib/openai-costs/index.ts`
    - `app/a/[account]/actions.ts`
    - `app/admin/(protected)/taxonomia/actions.ts`
    - `app/admin/(protected)/custos-openai/_components/OpenAiCostsDashboard.tsx`
    - `app/admin/(protected)/custos-openai/validation-cases.tsx`
    - `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
    - `lib/conversion-content/commercial-activation/draft-generation.ts`
    - `.github/workflows/pipeline-supabase-inspect.yml`
- Updates:
  - Aplicados:
    - `vercel#32`
- Referências:
  - Contrato financeiro durável: `docs/base-tecnica.md` — seção 3.16.
  - Ledger e RPCs: `docs/schema.md` — seção 1.37.

21.5.3 Atribuição e evidência por execução
- Status: concluída e ativa nos ambientes comprovados pelo fluxo pós-merge.
- Conteúdo:
  - criar ledger ativo separado de `openai_lp_*`, com execução funcional, operação cobrável, retry e replay idempotente;
  - exigir universo e contexto econômico explícitos, mantendo Cliente sem conta comprovável como não atribuído e sem heurística;
  - instrumentar os cinco workloads atuais por contrato financeiro comum, com recorder fail-open e ingresso assinado para `supabase_inspect` sem credencial mutável de banco;
  - preservar RLS, grants mínimos, RPCs versionadas e transições terminais, com gates ativos somente nos ambientes comprovados pelo fluxo pós-merge.

21.5.4 Cálculo e reconciliação de custos
- Status: concluída e vigente, com leitura ativa final válida.
- Conteúdo:
  - calcula cada operação somente com usage e unidades cobradas confirmadas, inclusive faixas curta/longa e Web Search, usando pricing temporal versionado e snapshot imutável;
  - mantém custo indisponível distinto de zero e impede subtotal parcial enganoso;
  - agrega por universo, conta, workload, execução e operação e compõe `total oficial - subtotal ativo calculável - histórico legado`, sem clamp;
  - pagina por keyset e mantém filtros internos sem alterar semanticamente o total oficial ou a reconciliação global.

21.5.5 Visão administrativa de custos
- Status: concluída e vigente; QA autenticado positivo e negativo aprovado no fluxo pós-merge.
- Conteúdo:
  - evolui somente `/admin/custos-openai` para exibir total oficial, subtotal ativo calculável, histórico congelado, reconciliação, cobertura, não atribuídos, indisponibilidade, retries, modelo, effort e baseline opcional;
  - preserva consulta sob demanda e acesso exclusivo de `platform_admin`, com as três fontes lidas em paralelo e sem payload de negócio, prompt, resposta integral, PII ou secrets;
  - filtros de universo, conta e workload alteram somente o subtotal e os detalhes ativos, enquanto o total oficial e a reconciliação permanecem globais;
  - componentes e validações focais cobrem teclado nativo, foco gerenciado e visível, nomes acessíveis, estados textuais e leiaute responsivo, sem alegar conformidade WCAG integral; a inspeção visual hospedada integra o aceite concluído.

21.5.6 Visão econômica hierárquica de custos por evento
- Status: concluída e aplicada em Production.
- Conteúdo:
  - Hierarquia universo → responsável econômico → evento → workload → execução/operação na superfície financeira única; gasto oficial, reconciliação, cobertura, pricing, filtros e histórico preservados.
  - Identidade econômica explícita nasce no produtor autorizado; execução sem vínculo comprovado permanece sem correlação. LP histórica vem da E21.4, sem inferência por ID técnico ou heurística.
  - Composição decimal lossless agrega ativo e legado, preserva indisponibilidade e prioriza nomes humanos.
  - RPCs v2 são canônicas; v1 é ponte estrita somente por ausência exata das RPCs novas, com estado v2_active ou v1_fallback explícito. Sem backfill.

21.5.7 Correlação econômica da avaliação de suficiência do catálogo
- Status: retirado com a avaliação factual E20 pela E22.7; PR #950 mergeado, sem consumidor vigente.
- Conteúdo: correlação e custos anteriores permanecem históricos; identidade econômica explícita continua no contrato E21.5.6 para produtores autorizados, sem reativar avaliação de suficiência.

22. E22 — Retirada controlada de ativos históricos
- Objetivo: retirar ativos sem consumidor após auditoria de dependências, preservando capacidades independentes e sem substituto antecipado.
- Status: E22.1–E22.7 concluídas. Core, taxonomia, pesquisas compartilhadas, capacidades independentes, automações vigentes, mailbox e resíduos físicos inertes preservados. Política de Previews de branches não documentais aguarda decisão na E22.3.6.

22.1 Retirada de ativos históricos do domínio de Landing Page

22.1.1 Objetivo e status
- Objetivo: retirar ativos de Landing Page sem consumidor, preservando capacidades independentes.
- Status: concluído; perfil de geração, módulos e resolução histórica retirados. A retirada posterior de E19 e E20 está nas E22.4–E22.7.

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
  - Estado posterior dos consumidores: `docs/roadmap.md` — seção 22.7.

22.1.3 Classificação de consumidores
- Status: vigente.
- Conteúdo: retirada por consumo real, classificando preservado, desacoplado ou removível. Migrations históricas imutáveis; remoções de schema forward-only e sem CASCADE. Pesquisas compartilhadas e parametrização raiz permanecem independentes.

22.1.4 Perfil de geração retirado
- Status: retirado.
- Conteúdo: perfil, adapters, UI, actions, exports, workload e validators removidos; duas tabelas e quatro RPCs próprias excluídas sem persistência substituta. Pesquisas taxonômicas e audit_logs preservados.

22.1.5 Catálogo de módulos retirado
- Status: retirado.
- Conteúdo: module-catalog, API, exports, validator e UI removidos, sem DDL ou catálogo substituto. Parametrização raiz preservada; superfície atual na E12.6.

22.1.6 Resolução histórica de pesquisas retirada
- Status: retirado.
- Conteúdo: research-resolution, adapter, exports, validators e diagnósticos exclusivos removidos. Queries antigas retornam a visão válida; pesquisas estruturadas compartilhadas preservadas.

22.1.7 Estado consolidado
- Status: concluído.
- Conteúdo: sem imports, rotas ou scripts ativos dos boundaries retirados. Admin e inventário OpenAI seguem somente consumidores vigentes; evidências antigas não autorizam reativação.

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
- O roadmap mantém estado e direção; contratos de execução seguem o fluxo vigente, com legados recuperáveis no Git.
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
- Status: concluída.
- Conteúdo: sem dependência ativa do MCP no Core; automations/supabase-inspect e seu workflow GitHub read-only preservados, assim como SUPABASE_DB_URL_READONLY no GitHub. Sem service, SDK, job ou integração substituta.

22.3.4 Retirada do MCP
- Status: retirado.
- Conteúdo: service e workflow histórico do Agent Builder removidos. supabase_inspect na E21 é referência da automação GitHub, sem MCP ou configuração verificada pelo Core.

22.3.5 Retirada da infraestrutura Vercel
- Status: concluída.
- Conteúdo: projeto exclusivo lpf-10-services removido; Core lp-factory-10 e domínio preservados. Não resta configuração externa do service.

22.3.6 Limite operacional remanescente
- Status: pendente de decisão.
- Conteúdo: vercel.json desabilita deploy automático somente para docs/**. Branches de implementação ainda geram Preview a cada push; retirada do service não reduz Previews do Core. Mudança de política exige recorte próprio que preserve Production automática da main e Previews necessários.

22.4 Retirada da geração e do produto operacional legado de Landing Page

22.4.1 Objetivo e status
- Objetivo: retirar geração e produto operacional legado de Landing Page, preservando consumidores independentes.
- Status: concluído, sem alteração de banco, migrations, dados ou Storage.

22.4.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/estrutura-lp/validation-cases.ts`
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
  - Configuração preservada: `docs/platform-config.md` — workloads OpenAI e Storage privado.
  - Contrato de banco preservado: `docs/schema.md` — materializações de Landing Page.

22.4.3 Cadeia removida
- Status: retirado.
- Conteúdo: sem entrada de geração, compilação de contexto, E20.7 integrada, candidata textual/imagem, binding, revisão, upload ou append do antigo produto. Exports, validators, adapters e wrappers exclusivos removidos.

22.4.4 Capacidades preservadas
- Status: vigente.
- Conteúdo: parametrização raiz e pesquisas compartilhadas independentes permanecem. RPCs, tabelas, bucket, migrations e dados legados ficam inertes; nova escrita, leitura de produto ou limpeza exige decisão própria. Residuais E19 foram retirados na E22.5; domínio factual E20 na E22.7.

22.4.5 Produto operacional retirado no SV-PR03
- Status: retirado.
- Conteúdo: Account Dashboard não carrega configuração, drafts, workspace, revisão ou materialização LP. Rotas antigas de detalhe, configuração, histórico e Preview e seus consumidores exclusivos foram removidos sem substitutos ou redirects. Jornada atual na E10.11; resíduos físicos em docs/schema.md.

22.5 Retirada do residual E19 e da compatibilidade com E20.2

22.5.1 Objetivo e status
- Objetivo: eliminar as últimas fronteiras exclusivas do produto legado E19.
- Status: concluído, sem migration, DDL, limpeza de dados, Storage ou configuração hospedada.

22.5.2 Resultado
- Status: concluído.
- Conteúdo: lp-builder, presentation, workloads de draft, provas e branches exclusivas de imagem retirados. Sem write-side prospectivo E21.4; Costs API e histórico financeiro congelado preservados. Configurações, revisões e ativações antigas permanecem inertes.

22.5.3 Capacidades preservadas
- Status: vigente.
- Conteúdo: framework OpenAI comum, supabase_inspect e catálogo independente de modelos de imagem preservados; inventário vigente na E21.1. Contratos factuais E20 foram encerrados pela E22.7. Resíduos físicos E19 permanecem inertes; limpeza exige recorte próprio.

22.6 Remoção do Validador Final e automações adjacentes

22.6.1 Objetivo e status
- Objetivo: retirar conjuntamente o Validador Final e o Niche Runtime Tests, incluindo seus componentes exclusivos, sem alterar produto, CI preservado, mailbox institucional ou dados existentes.
- Status: concluída no repositório, sem automação substituta, migration, SQL, limpeza de dados ou configuração externa.

22.6.2 Registros do recorte
- Repositório:
  - Excluídos:
    - `.github/workflows/automation-validador-final.yml`
    - `.github/workflows/automation-niche-runtime-tests.yml`
    - `automations/validador-final/`
    - `automations/niche-runtime-tests/`
    - `automations/supabase-inspect/verify-niche-runtime.mjs`
- Referências:
  - Catálogo operacional vigente: `docs/automations.md`.
  - Mailbox e secrets preservados: `docs/platform-config.md` — seção 2.4.
  - Consulta autônoma ao catálogo institucional de QA: `docs/roadmap.md` — E17.9.3.

22.6.3 Resultado e limites
- A busca de consumidores confirmou que o Niche Runtime Tests dependia do runtime do Validador Final e que os ativos retirados não eram gate automático, script raiz nem dependência do Core.
- Os dois workflows, os dois subprojetos e o verificador Supabase exclusivo foram removidos conjuntamente; o restante de `automations/supabase-inspect/`, seus consumidores e os demais workflows permanecem preservados.
- Usuários, contas, memberships, sessões, dados Supabase e evidências existentes não foram alterados nem excluídos.
- Runs, checks, statuses, logs e artifacts do GitHub Actions são evidência suplementar e expirável; o diff/PR e os documentos canônicos preservam a prova durável da retirada.

22.7 Retirada terminal da E20 e E10.10

22.7.1 Objetivo e status
- Objetivo: retirar E20 e E10.10 sem segunda autoridade factual nem dano às capacidades independentes E10, E9, E11, taxonomia, pesquisas compartilhadas e comercial.
- Status: concluído; retirada funcional, apply seletivo e remoção dos gates externos validados em Preview e Production. Dependência E10.11 concluída.

22.7.2 Registros do recorte
- Banco:
  - Ajustados:
    - `public.business_taxons`
    - `public.openai_workload_operational_configurations`
    - `public.taxon_factual_fields`
  - Excluídos:
    - `public.taxon_factual_fields_taxon_id_fkey`
- Repositório:
  - Criados:
    - `supabase/migrations/20261001030000_e22_7_retire_factual_authority.sql`
    - `supabase/snippets/e22_7_terminal_retirement_verify.sql`
    - `supabase/tests/e22_7_retire_factual_authority.fixture.sql`
    - `supabase/tests/e22_7_retire_factual_authority.proof.sh`
    - `supabase/tests/e22_7_retire_factual_authority.test.sql`
  - Ajustados:
    - `.github/workflows/e10-11-sql-proof.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
    - `app/a/[account]/account-journey-loader.ts`
    - `app/a/[account]/page.tsx`
    - `app/admin/(protected)/estrutura-lp/`
    - `app/admin/(protected)/taxonomia/`
    - `components/admin/`
    - `lib/admin/`
    - `lib/conversion-content/`
    - `lib/openai-costs/`
    - `lib/openai-workloads/`
    - `package.json`
  - Excluídos:
    - `app/a/[account]/_components/FactualOnboarding.tsx`
    - `app/a/[account]/factual-actions.ts`
    - `app/admin/(protected)/estrutura-lp/_components/AdminFactualFields.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonFactualCoverage.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogEvaluation.tsx`
    - `components/admin/AdminTaxonResearchSelectionForm.tsx`
    - `lib/conversion-content/landing-page/input-catalog/`
    - `lib/conversion-content/landing-page/taxon-preparation/`
    - `lib/onboarding/factual/`
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.11, 1.28 e 1.35.
  - Workflow e gates externos: `docs/platform-config.md` — seções 2.3 e 3.5.
  - Apply de migrations: `docs/automations.md` — seção 3.6.

22.7.3 Auditoria de consumidores e fronteiras preservadas
- Status: concluída.
- Conteúdo: consumidores exclusivos removidos; Pending Setup, conclusão E10.11, taxonomia, pesquisas estruturadas e comercial independentes preservados.

22.7.4 Retirada dos caminhos funcionais
- Status: implementação mergeada; QA autenticado pós-apply/redeploy concluído com sucesso.
- Conteúdo:
  - E10.10 foi retirado como caminho funcional e a E20 factual foi encerrada como domínio de produto, incluindo catálogo, cobertura, seleção, avaliação assistida, liberação e workload exclusivos.
  - A conta `active` resolve entitlement antes da taxonomia: erro de entitlement falha fechado; conta autorizada segue para a Base sem exigir taxon; conta não autorizada segue para comercial ou `waiting`.
  - Preservar `business_taxons`, aliases, resolução de nicho, `account_taxonomy`, E10.3, E10.5, E10.9, E10.6/E10.7, E9, E11 e pesquisas, objetos e insumos compartilhados enquanto houver consumidor independente real, especialmente E10.7.
  - A taxonomia preservada permite ativação pelo CRUD administrativo com guard de plataforma, pai ativo e concorrência otimista; novos taxons permanecem inativos por padrão.
  - A preservação de recursos compartilhados não mantém catálogo factual, cobertura, herança, liberação ou autoridade da E20 nem transfere pesquisas para a Base.
  - Não redesenhar E10, comercial, taxonomia, Base, billing, trial ou LP; não criar domínio substituto, compatibilidade paralela, archive funcional, snapshot vivo ou nova infraestrutura; não remover capacidade, dado ou objeto apenas por associação à E20/E10.10 nem refatorar, modernizar ou reorganizar domínios preservados.

22.7.5 Retirada material residual de banco e configuração
- Status: aplicado e validado.
- Conteúdo:
  - Dados factuais, revisões e ativações históricos preservados; FK factual, acessos exclusivos e unidades mutáveis do workload factual retirados. UPDATE da coluna de seleção revogado.
  - Gates E20 retirados da Vercel em Preview e Production; estado externo em docs/platform-config.md.
  - Duas migrations E10.10 não aplicadas permanecem excluídas do apply e não serão aplicadas; migrations históricas imutáveis.
  - Dados inertes e objetos compartilhados permanecem quando a limpeza não for indispensável; exclusão destrutiva exige decisão própria.

23. E23 — Segurança e governança transversal da plataforma
- Objetivo: reduzir riscos de segurança e governança por recortes controlados.
- Status: E23.1–E23.5 concluídas. Levantamento E23.6 concluído em 14/10/2026, com aplicabilidade Next.js e cobertura TLS global inconclusivas, sem remediação presumida.

23.1 Atualização de segurança do Next.js

23.1.1 Objetivo e status
- Objetivo: retirar do Core a versão Next.js afetada por vulnerabilidades críticas, preservando as jornadas e os comportamentos existentes.
- Status: concluída no repositório e validada no Preview, sem mudança funcional intencional.

23.1.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `package.json`
    - `package-lock.json`
- Updates:
  - Aplicados:
    - `vercel#31`

23.1.3 Atualização segura e validação do Core
- Status: concluído; versão atual evoluída pela E23.4.
- Conteúdo: atualização de segurança sem adoção de recursos opcionais ou alteração de jornadas. Não há validação de Production pendente neste registro histórico; estado vigente e limites nas E23.4 e E23.6.

23.2 Classificação segura das variáveis Vercel

23.2.1 Objetivo e status
- Objetivo: manter as variáveis Core coerentes com Config/Secret sem exposição de valores nem mudança indevida de consumidores ou ambientes.
- Status: classificação e retirada de ocorrências sem consumidor concluídas; sobreclassificações preservadas por decisão funcional conservadora.

23.2.2 Registros do recorte
- Updates:
  - Aplicados:
    - `vercel#32`.
- Referências:
  - Classificação efetiva e estado operacional: `docs/platform-config.md` — seção 3.6.

23.2.3 Inspeção e reconciliação segura das classificações
- Status: concluída.
- Conteúdo:
  - Inspeção somente de nomes, tipos, ambientes e branch scopes, sem revelar, recuperar, copiar ou registrar valores.
  - Credenciais confirmadas como Secret; configurações públicas ou não sensíveis como Config. Sobreclassificações e scopes legados permanecem quando não houver risco ou impacto material comprovado.
  - Estado efetivo e ocorrências retiradas em docs/platform-config.md, seção 3.6. SUPABASE_DB_URL_READONLY do GitHub e o consumidor read-only permanecem preservados.
  - Jornada e origem segura dos convites pertencem à E11.1.4.

23.3 Retenção proporcional das evidências GitHub Actions

23.3.1 Objetivo e status

- Objetivo: manter o fechamento dos recortes verificável por fontes duráveis mesmo após a expiração de runs, checks, commit statuses, logs, Job Summaries e artefatos do GitHub Actions.
- Status: concluída documentalmente, sem alteração de workflow, setting, secret, runtime, banco ou infraestrutura.

23.3.2 Registros do recorte

- Updates:
  - Aplicados:
    - `github#14`
- Referências:
  - Contrato técnico de evidência durável: `docs/base-tecnica.md` — seção 3.4.
  - Retenção efetiva e configuração GitHub Actions: `docs/platform-config.md` — seção 2.2.
  - Update incorporado: `docs/github-up.md` — `github#14`.

23.3.3 Contrato de evidência durável e expiração
- Status: vigente.
- Conteúdo:
  - Runs, checks, statuses, logs, Job Summaries e artefatos são evidências suplementares expiráveis, sem prova exclusiva de encerramento.
  - PR, commit, roadmap e fontes canônicas preservam conclusão durável; retenção efetiva em docs/platform-config.md, seção 2.2.
  - Sem exportação recorrente, armazenamento paralelo, job ou automação. Preservação bruta além da janela exige decisão do Gestor de Automações e do humano.

23.4 Atualização de segurança do Next.js — setembro de 2026

23.4.1 Objetivo e status
- Objetivo: aplicar a release de segurança Next.js 16.3.8 com next, eslint-config-next e lockfile alinhados, preservando jornadas e comportamentos.
- Status: concluído em Production.

23.4.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `package.json`
    - `package-lock.json`
- Updates:
  - Aplicados:
    - `vercel#34`
- Referências:
  - Patch aplicado e acompanhamento upstream: `docs/vercel-up.md` — `vercel#34`.

23.4.3 Atualização e validação do Core
- Status: concluído.
- Conteúdo: next e eslint-config-next em 16.3.8; React, demais dependências e código de produto preservados. A release incorpora sete correções; duas vulnerabilidades adicionais, crítica e alta, permanecem sob acompanhamento upstream em vercel#34. Não representa remediação total; diagnóstico e limites vigentes na E23.6.

23.5 Retirada da capacidade GraphQL não utilizada

23.5.1 Objetivo e status
- Objetivo: retirar GraphQL não utilizado, preservando REST/Data API, Auth, banco, RLS/policies e jornadas.
- Status: concluído; apply seletivo e operação em Production validados.

23.5.2 Registros do recorte
- Banco:
  - Excluídos:
    - `pg_graphql`
    - `graphql.resolve`
  - Ajustados:
    - `graphql_public.graphql`
- Repositório:
  - Criados:
    - `supabase/migrations/20261005170954_e23_5_retire_unused_graphql.sql`
    - `supabase/tests/e23_5_retire_unused_graphql.fixture.sql`
    - `supabase/tests/e23_5_retire_unused_graphql.proof.sh`
    - `supabase/tests/e23_5_retire_unused_graphql.snapshot.sql`
    - `supabase/tests/e23_5_retire_unused_graphql.test.sql`
  - Ajustados:
    - `supabase/config.toml`
    - `.github/workflows/e10-11-sql-proof.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
- Updates:
  - Aplicados:
    - `supa#39`
- Referências:
  - Estado do banco: `docs/schema.md` — seção 6.2.
  - Apply seletivo e plataforma: `docs/platform-config.md` — seções 2.3 e 4.1; `docs/automations.md` — seção 3.6.
  - Update retirado do catálogo ativo: `docs/supa-up.md` — `supa#39`.

23.5.3 Retirar e validar a capacidade GraphQL não utilizada
- Status: concluído.
- Conteúdo: retirada transacional e idempotente, com bloqueio atômico de dependente inesperado. Papéis públicos recebem somente stub desabilitado, sem dados GraphQL; owners/grants gerenciados e metadados, policies e ACLs fora do GraphQL preservados. Sem automação ou infraestrutura nova.

23.6 Diagnóstico de segurança Next.js e compatibilidade TLS Supabase

23.6.1 Objetivo e status
- Objetivo: entregar diagnóstico delimitado dos avisos Next.js e da mudança TLS Supabase, distinguindo evidência comprovada, incerteza e eventual correção demonstrada.
- Status: levantamento delimitado do PB 18D.1 concluído conforme revisão humana aprovada em 14/10/2026, sob Supervisão Autônomo; aplicabilidade Next.js e cobertura TLS global permanecem inconclusivas. A conclusão do levantamento não comprova ausência de impacto nem remediação.
- Limites: investigação somente leitura, sem alteração de dependências, código funcional, configuração, banco, credenciais, workflows, plataformas ou comportamento; sem teste exploratório, redução de segurança ou recurso pago adicional. Não permanece solicitação de coleta, inventário ou consulta ao suporte como ação desta rodada. Eventual correção exige recorte e autorização próprios.

23.6.2 Registros do recorte
- Referências:
  - Saldo Next.js, prioridade e gatilho de retomada: `docs/vercel-up.md` — `vercel#34`.
  - Saldo TLS, prioridade e gatilhos de retomada: `docs/supa-up.md` — `supa#73`.
  - Diagnóstico delimitado final e evidências: [PR #1067 — resultado final](https://github.com/AlcinoAfonso/LP-Factory-10/pull/1067#issuecomment-6173085395); [provas técnicas TLS](https://github.com/AlcinoAfonso/LP-Factory-10/pull/1067#issuecomment-6170466774).

23.6.3 Diagnóstico delimitado dos avisos Next.js
- Status: levantamento concluído em 14/10/2026; aplicabilidade inconclusiva.
- Conteúdo:
  - a conferência focal final das fontes oficiais acessíveis não recuperou advisories completos com impacto e faixas afetadas/corrigidas; isso não comprova inexistência global de publicação;
  - o baseline `next`/`eslint-config-next` `16.3.8` e React/React DOM `19.2.1` foi confrontado com App Router, SSR/RSC e Server Actions existentes; nenhum consumidor OG foi identificado, sem excluir vulnerabilidades ainda não descritas. Exploração não foi investigada;
  - necessidade e versão de correção não determinadas; o saldo permanece no catálogo para retomada de E23.6.3 diante dos advisories oficiais completos, sem espera indefinida nem autorização de upgrade.

23.6.4 Diagnóstico delimitado da mudança TLS Supabase
- Status: levantamento concluído em 14/10/2026; capacidade compatível comprovada somente no processo Node local inspecionado, sem conclusão global.
- Conteúdo:
  - alcance e prazo oficiais foram confrontados com os consumidores existentes de Auth, Data API e Storage; a retirada anunciada de quatro cifras CBC nas APIs HTTP não abrange Postgres direto, pooler ou Management API;
  - Vercel: configuração Node `22.x` e ausência de customização TLS no código consultado comprovadas; capacidade/configuração efetiva das Functions/middleware em Production/Preview não demonstrada. A prova local não representa esses ambientes;
  - browsers: nenhuma combinação concreta browser/SO disponível para conclusão. Integrações HTTP externas: nenhuma identificada nas fontes técnicas consultadas, com existência fora delas não confirmada;
  - nenhuma incompatibilidade ou correção necessária foi comprovada. As incertezas e os gatilhos de retomada permanecem no catálogo, sem exigir novas provas para encerrar esta rodada e sem inferir compatibilidade global.


24. E24 — Governança e compatibilidade transversal de updates
- Objetivo: tornar o ciclo semanal de updates rastreável, economicamente delimitado e coerente entre fornecedores, preservando ações operacionais em recortes independentes.
- Status: E24.1 concluída; E24.2 implementada e validada no repositório, com entrega técnica sob supervisão Autônoma.

24.1 Governança e cobertura do workflow de updates

24.1.1 Objetivo e status
- Objetivo: aplicar de forma uniforme ciclo de vida, gate de zero custo incremental, identificação de rodadas e cobertura técnica OpenAI ao workflow semanal existente.
- Status: implementada e validada no repositório, sem novo catálogo, agente, job, automação, infraestrutura ou alteração do runtime do produto.

24.1.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `.codex/agents/gestor-automacoes.toml`
    - `.codex/agents/gestor-updates.toml`
- Referências:
  - Contrato da rodada semanal: `docs/workflow-atualizacao-updates.md` — seções 1 a 6.
  - Fotografia técnica OpenAI: `docs/openai-model-snapshot.md` — seções 1 a 6.
  - Governança do Gestor de Automações: `docs/gestor-automations.md` — seção 3.1.

24.1.3 Ciclo de vida, gate econômico, campos e identificador
- Cada execução usa um identificador único `updates-AAAA-MM-DD-rNN`, compartilhado pelas branches e pelos títulos dos draft PRs da rodada.
- Drafts anteriores e do mesmo identificador são detectados antes da publicação; o mesmo alvo e rodada não recebem segundo draft. O estado `open` ou `completed` fica persistido nos corpos dos drafts; uma rodada concluída sem drafts reserva o identificador por tag anotado remoto `<identificador>-completed` no SHA inicial, sem criar mudança artificial.
- Todo transversal ativo registra estado, ação pendente, prioridade, motivo da permanência, gatilho e critério de encerramento. Implementação integral validada permanece somente no histórico compacto; implementação parcial permanece ativa apenas pelo saldo.
- Toda recomendação de implementação, dependente de recorte ou transversal, exige zero custo incremental comprovado nos planos vigentes. Upgrade, cobrança adicional ou gratuidade não validada mantêm o recurso no radar sem autorização de implementação.

24.1.4 Cobertura semanal OpenAI e responsabilidades
- Os quatro catálogos obrigatórios preservam sua ordem, seguidos pela cobertura técnica OpenAI no snapshot existente; não foi criado quinto catálogo.
- O workflow faz a descoberta oficial ampla. O Gestor de Updates consulta o snapshot quando o recorte envolver capacidade OpenAI, sem mantê-lo; o Gestor de Automações consome as capacidades identificadas e limita a consulta oficial à validação factual focal do caso.
- `supa#60` permanece apenas como referência da consulta manual ao changelog oficial, sem consumidor RSS ou feed Markdown.

24.1.5 Snapshot técnico OpenAI
- O snapshot mantém registros itemizados e rastreáveis de workloads, modelos, reasoning efforts, limites técnicos, APIs, tools, recursos agentic, aplicabilidade, maturidade, fontes e data da fotografia.
- Valores, fórmulas, gráfico, protocolo e laboratório financeiros foram retirados sem documento ou mecanismo substituto; o asset exclusivo do gráfico também foi removido.
- A configuração efetiva permanece em `docs/platform-config.md`, e nenhuma capacidade registrada autoriza adoção ou mudança operacional.

24.1.6 Validação do workflow atualizado
- Status: validado.
- Conteúdo: contratos TOML preservam modelo, effort e sandbox. O snapshot permanece técnico, sem conteúdo financeiro; governança e execução semanal seguem as fontes canônicas referenciadas.

24.2 Compatibilidade operacional e evidências temporárias

24.2.1 Objetivo e status
- Objetivo: validar a compatibilidade operacional com Ubuntu 26.04, incorporar a retenção reduzida dos deployments Hobby à política de evidências e estabelecer a leitura manual dos Health Check Advisors, sempre sem custo incremental.
- Status: implementada e validada no repositório, sem alteração permanente de workflow, runner, runtime, banco, dependência, deployment, plano, configuração ou infraestrutura.

24.2.2 Registros do recorte
- Updates:
  - Aplicados:
    - `github#15`
    - `vercel#33`
    - `supa#71`
- Referências:
  - Política técnica de evidências expiráveis: `docs/base-tecnica.md` — seção 3.4.
  - Retenção Vercel Hobby e procedimento Supabase: `docs/platform-config.md` — seções 3.1 e 4.9.

24.2.3 Compatibilidade representativa no Ubuntu 26.04
- Status: compatibilidade representativa validada em Ubuntu 26.04.
- Conteúdo: Bash/grep, checkout, Node 20 das automações, Node 22 e build/checks do Core e Supabase CLI 2.106.0. Prova sem secrets, chamadas externas ou mutações; harness efêmero removido e ubuntu-latest preservado, sem pin preventivo.

24.2.4 Evidências temporárias da Vercel
- Preview e deployment histórico são evidências operacionais suplementares e expiráveis; nenhum encerramento depende exclusivamente de sua disponibilidade.
- A prova durável permanece no PR, no commit, no roadmap e nos documentos canônicos competentes, sem storage paralelo, proteção rotineira de deployment ou upgrade de plano.

24.2.5 Leitura manual dos Health Check Advisors
- Status: procedimento vigente.
- Conteúdo: Studio → Advisors → Health, refresh manual e leitura de Data API/PostgREST, Auth, Storage e Edge Functions. Resultado vazio válido difere de advisor_check_unavailable; achado exige investigação, sem correção automática. Baseline e procedimento operacional em docs/platform-config.md, seção 4.9.

24.2.6 Ciclo de vida dos itens da rodada
- Status: rodada encerrada.
- Conteúdo: itens aplicados estão nos registros. vercel#21 excluído por criar storage paralelo; supa#70 futuro e condicionado a recorrência e superioridade comprovadas. Sem contratação ou ativação de recurso com custo incremental.

25. E25 — Base de Comunicação
- Objetivo: manter Base persistente da conta com verdade da empresa e inteligência de comunicação, independente de LP ou integração de canal.
- Status: E25.1 e E25.3 operacionais em Preview e Production; E25.2 implementada. PB2 e PB3 permanecem em definição, sem execução autorizada.

25.1 Base de Comunicação inicial

25.1.1 Objetivo e status
- Objetivo: entregar uma única Base atual por conta, consultável, editável e progressiva após autorização comercial válida, sem depender de E10.10, E20, taxon oficial, PB-B ou PB-C.
- Status: encerrado e operacional em Preview e Production sob gate independente por ambiente; QA provider-backed concluído com cobertura e telemetria E21. Fontes Web pouco pertinentes são uma limitação de qualidade observada e aceita, sujeita a revisão humana.

25.1.2 Registros do recorte
- Banco:
  - Criados: `account_communication_bases`.
  - Ajustados: `openai_workload_configuration_revisions`, `openai_workload_operational_configurations`, `openai_workload_configuration_activations`, `openai_cost_executions`, `openai_cost_coverage`.
- Repositório:
  - Criados: `app/a/[account]/base-comunicacao/`, `lib/communication-base/`, `supabase/migrations/20260927145500_e25_1_account_communication_bases.sql`, `supabase/migrations/20260927163500_e21_2_communication_base_workloads.sql`, `supabase/tests/e25_1_account_communication_bases.test.sql`, `supabase/tests/e25_1_openai_communication_base_workloads.test.sql`.
  - Ajustados: `app/a/[account]/layout.tsx`, `components/layout/Header.tsx`, `lib/openai-workloads/`, `lib/openai-costs/`, `.github/workflows/pipeline-supabase-apply-migrations.yml`.
- Referências:
  - Banco: `docs/schema.md` — 1.38 e 3.11.
  - Configuração externa: `docs/platform-config.md` — gate E25.1.
  - Comparação de modelos: `docs/openai-model-snapshot.md` — 5.1.

25.1.3 Estrutura, governança e extensibilidade
- Status: implementado.
- Conteúdo: a Base pertence somente à conta; owner, admin e editor preenchem e editam, enquanto viewer consulta. Access Context, membership e entitlement comercial vigente governam o acesso. Seções com formatos suportados podem ser acrescentadas a Bases existentes sem perda do conteúdo anterior. Pesquisa, conversa, taxon, LP, produto, Tarefa, campanha e canal não se tornam proprietários, vínculos persistentes ou dependências de leitura e edição. Não criar segunda autoridade factual, Base por insumo ou consumidor, versionamento funcional selecionável ou framework arbitrário de seções.

25.1.4 Etapa 1 e aproveitamento inicial
- Status: implementado e validado com assistência provider-backed sem Web Search.
- Conteúdo: a verdade da empresa começa com nome público do negócio ou profissional e entendimento operacional da atuação e evolui por Negócio, Ofertas, Atendimento, Provas/credenciais/resultados, Materiais/identidade e Preferências/limites, sem bloqueio global por seção incompleta. Contexto confirmado do Pending Setup pode ser copiado uma vez quando inequívoco, sem sincronização reversa. Orientações, exemplos, placeholders e validações previsíveis permanecem determinísticos quando suficientes. A IA assistente só atua por ação explícita e ganho real para explicar, exemplificar, organizar, resumir ou reformular conteúdo fornecido; não usa Web Search, não propõe valor factual ausente, não confirma em nome do cliente nem dispara na edição manual. Sugestões orientam o que informar; valores reais são fornecidos ou confirmados pelo cliente, e informação ausente gera pergunta localizada ou seção pendente. Falha da IA preserva a edição manual.

25.1.5 Etapa 2 e inteligência de comunicação
- Status: implementado com `gpt-6-luna`/`max` como par operacional único após comparação isolada com `gpt-6-sol`/`medium`.
- Conteúdo: a IA é o motor central da interpretação de sinais de mercado e da produção de conteúdo comunicacional editável usando somente os insumos confirmados pertinentes da Etapa 1. Usa pesquisa atual via Web Search quando atualidade ou localidade forem materiais para elaborar Quem somos, Público/contexto, Dores/desejos/crenças/objeções, Proposta de valor, Benefícios, Diferenciais e FAQ. Distinguir fato particular confirmado de hipótese estratégica; revisão e edição humanas permanecem disponíveis sem aprovação por chamada. Falha de pesquisa material não é substituída silenciosamente por conhecimento paramétrico; a Base não depende de vínculo persistente com a pesquisa. Este recorte não gera LP ou outro produto, não integra canais nem altera Pending Setup, jornada E10, comercial ou trial, e não introduz Agents SDK, multiagente, job, fila ou infraestrutura antecipada.
- E25.1 não cria carteira, saldo, franquia ou bloqueio comercial de IA; o contrato transversal de créditos pertence ao Debate 10B.
- A ação geral gera as sete seções quando vazias e atualiza o conjunto pertinente quando há conteúdo; cada seção tem revisão localizada. O conteúdo salvo da Etapa 2 entra somente no alvo da operação como contexto de revisão, sem autoridade factual. Sugestões não são salvas automaticamente, e a edição manual não dispara IA.

25.2 Experiência de cliente da Base de Comunicação

25.2.1 Objetivo e status
- Objetivo: tornar consulta e edição da Base claras e progressivas, preservando contratos funcionais.
- Status: implementado; sem alteração de acesso, persistência ou metodologia da Base.

25.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/a/[account]/base-comunicacao/_components/CommunicationSectionCollection.tsx`
    - `app/a/[account]/base-comunicacao/_components/section-edit-state.ts`
    - `app/a/[account]/base-comunicacao/_components/section-edit-state.validation.ts`
  - Ajustados: `app/a/[account]/base-comunicacao/page.tsx`, `app/a/[account]/base-comunicacao/CommunicationSectionEditor.tsx`.

25.2.3 Coleção tabular, abertura de detalhe e edição da Base
- Status: implementado.
- Conteúdo: as abas superiores mostram somente a coleção da categoria selecionada, com identidade, estado e Abrir. As três categorias vigentes seguem E25.3; gate desligado mantém as duas abas anteriores. O dialog apresenta uma seção por vez e já abre editável para Owner/Admin/Editor, com Salvar e Cancelar; Viewer recebe leitura. Comparação pelo parser protege alterações materiais e rascunhos inválidos; saída com perda possível exige confirmação. Salvamento mantém locks e versões, sucesso permanece no detalhe e conflito preserva o rascunho. Cancelar, Fechar, Escape, backdrop e Voltar preservam o contexto da coleção e devolvem o foco.

25.2.4 Estados, assistência por IA, responsividade e validação da experiência
- Status: implementado.
- Conteúdo:
  - Feedback junto da ação, sugestões separadas do salvo, instalação somente no rascunho e fontes sob revelação progressiva.
  - Assistências e exclusão mútua preservadas; revisão/versão impede reinstalar resposta superada por descarte ou salvamento.
  - Teclado, foco, ações alcançáveis em altura reduzida, alvos de 44 px e reflow desde 320 px. Não há comprovação de teclado virtual real ou conformidade WCAG integral; permissões e entitlement não são ampliados para QA.

25.3 Recursos das três categorias da Base de Comunicação

25.3.1 Objetivo e status
- Objetivo: entregar os recursos manuais de Dados do negócio, Materiais de comunicação e Inteligência e copy em uma única Base por conta, preservando conteúdo legado, acesso comercial, papéis, concorrência, revisão humana e assistências de IA existentes.
- Status: PB1/D14D concluído e operacional em Preview e Production.
- Limites: PB2 e PB3 permanecem em definição. Este recorte não entrega novos agentes, rotinas de IA, pesquisa, processamento de mídia, transcrição, publicação automática ou integração com canais; não reabre E25.1/PB-A nem E25.2.

25.3.2 Registros do recorte

- Banco:
  - Criados:
    - `communication_base_sections`
    - `touch_communication_base_section`
    - `communication_base_section_updated`
    - `save_communication_base_section`
    - `communication-base-assets`
- Repositório:
  - Criados:
    - `app/a/[account]/base-comunicacao/_components/BusinessFactsFields.tsx`
    - `app/a/[account]/base-comunicacao/_components/CommunicationMaterials.tsx`
    - `app/a/[account]/base-comunicacao/_components/StructuredSectionFields.tsx`
    - `app/a/[account]/base-comunicacao/material-actions.ts`
    - `app/admin/(protected)/base-comunicacao/CommunicationCatalogEditor.tsx`
    - `app/admin/(protected)/base-comunicacao/actions.ts`
    - `app/admin/(protected)/base-comunicacao/page.tsx`
    - `lib/communication-base/adapters/communicationCatalogAdapter.ts`
    - `lib/communication-base/adapters/communicationMaterialAdapter.ts`
    - `lib/communication-base/catalog.ts`
    - `lib/communication-base/manual-editor-value.ts`
    - `lib/communication-base/materials.ts`
    - `lib/communication-base/resource-validation-cases.ts`
    - `supabase/migrations/20261010202505_e25_3_communication_resources.sql`
    - `supabase/tests/e25_3_communication_resources.test.sql`
  - Ajustados:
    - `.github/workflows/e10-11-sql-proof.yml`
    - `.github/workflows/pipeline-supabase-apply-migrations.yml`
    - `app/a/[account]/base-comunicacao/CommunicationBaseTabs.tsx`
    - `app/a/[account]/base-comunicacao/CommunicationSectionEditor.tsx`
    - `app/a/[account]/base-comunicacao/_components/CommunicationSectionCollection.tsx`
    - `app/a/[account]/base-comunicacao/_components/section-edit-state.ts`
    - `app/a/[account]/base-comunicacao/actions.ts`
    - `app/a/[account]/base-comunicacao/page.tsx`
    - `components/admin/adminNavigation.ts`
    - `lib/communication-base/adapters/communicationBaseAdapter.ts`
    - `lib/communication-base/ai-core.ts`
    - `lib/communication-base/config.ts`
    - `lib/communication-base/contracts.ts`
    - `lib/communication-base/policy.ts`
    - `lib/communication-base/registry.ts`
    - `lib/communication-base/ui-state-keys.ts`
    - `lib/communication-base/validation-cases.ts`
    - `next.config.js`
- Referências:
  - Exceção de sequência, apply seletivo e ativação por ambiente: `docs/platform-config.md` — seções 2.3 e 3.5.
  - Catálogo, segurança, RPC e Storage aplicados: `docs/schema.md` — seção 1.39.

25.3.3 Dados do negócio e Inteligência e copy
- Status: implementado e operacional em Preview e Production.
- Conteúdo:
  - Dados do negócio admitem rótulo e valor opcionais, sem bloquear campos vazios; o nome público canônico permanece no cabeçalho. Apresentação inicial: Identificação e dados do negócio.
  - As sete seções de Inteligência e copy preservam formatos, conteúdo, parágrafos, quebras e delimitadores internos em itens e FAQ. Novas seções são manuais.
  - Assistências existentes mantêm seleção, revisão e versionamento; sugestões ficam separadas do salvo, com instalação explícita no editor e sem salvamento automático.
  - Bases antigas e novas mantêm consulta, edição por owner/admin/editor, viewer somente leitura, isolamento, descarte e retomada. Conflitos preservam o rascunho; descarte preserva o salvo e devolve foco. UI mantém teclado, foco, mobile e FAQ com alvo de 44 px.

25.3.4 Materiais de comunicação
- Status: implementado e operacional em Preview e Production.
- Conteúdo:
  - Acervo: Identidade visual, Fotos, vídeos e áudios e Depoimentos e provas sociais. Cadastro admite identificação, contexto, autoria e autorização quando pertinentes.
  - Imagens/logotipos usam upload ou link; vídeos/áudios somente link; depoimentos escritos usam texto. Consulta, edição, substituição e retirada preservam conteúdo legado e produtos publicados.
  - Storage privado separado do bucket legado, validação de imagens no servidor e acesso temporário após autorização vigente. Arquivos inválidos ou acima do limite são rejeitados sem escrita; erros preservam formulário e arquivo para retry.
  - Links indisponíveis recebem tratamento seguro, sem alterar a Base; descarte preserva os dados salvos.

25.3.5 Gestão administrativa de seções
- Status: implementado e operacional em Preview e Production.
- Conteúdo:
  - Admin adiciona, renomeia e reordena seções nas três categorias com autorização administrativa central; ações sem autorização são recusadas.
  - Identidades, categorias, formatos e conteúdos salvos permanecem preservados. Novas seções são vazias e opcionais em Bases antigas e futuras, sem retroescrita nem exclusão de seção.
  - Inclusão global aceita mediante prova isolada com rollback e projeção em Base antiga/vazia, sem prova autenticada persistente de inclusão. Prova SQL não substitui validação de Auth, Storage e UI.
  - Gate independente mantém o runtime anterior quando desabilitado. Progressão entre ambientes segue autorização operacional vigente; o apply seletivo não reativa o fluxo integral suspenso.

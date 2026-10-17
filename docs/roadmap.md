0. Introdução

0.1 Cabeçalho
- Data: 17/10/2026
- Versão: v1.5.258

0.2 Contrato do documento (consulta)
- Estado vigente dos casos; sem narrativa operacional.

0.2.1 TIPO_DO_DOCUMENTO
- TIPO_DO_DOCUMENTO: prescritivo

0.2.2 GUIA_DE_CONSULTA
- Consultar para funcionalidades, estado, decisões, dependências, limites, pendências e registros materiais de casos.
- Contratos técnicos: docs/base-tecnica.md; banco: docs/schema.md. Histórico e evidências no Git/PRs.

1. E1 — Estrutura de Dados
- Objetivo: fundação multi-tenant.
- Status: concluído.

1.1 Base estrutural multi-tenant

1.1.1 Objetivo e status
- Objetivo: contas, memberships, planos, parceiros e auditoria.
- Status: implementado.

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
- Status: vigente.
- Conteúdo: identidade única de conta, vínculo usuário/conta único, proteção do último owner ativo e auditoria central; contratos físicos em docs/schema.md — 1.1–1.3 e 4.

1.1.4 Limite do recorte
- Status: vigente.
- Conteúdo: fundação inicial; evoluções nos casos responsáveis, contrato atual no Schema.

2. E2 — Núcleo de Acesso
- Objetivo: autenticação e autorização básicas.
- Status: concluído; jornadas E5, contexto E8 e membros E11.

2.1 Autenticação e autorização básicas

2.1.1 Objetivo e status
- Objetivo: identidade autenticada e acesso protegido por papel.
- Status: implementado.

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
- Status: vigente.
- Conteúdo: login Supabase por e-mail/senha; papéis owner/admin/editor/viewer. platform_admin é autoridade de plataforma, inclui super_admin legado e não é membership. Autenticação não concede acesso à conta; decisão server-side fail-closed.

2.1.4 Autorização de dados
- Status: vigente.
- Conteúdo: RLS e helpers de privilégio conforme docs/schema.md — 1 e 3.3; autorização final conforme docs/base-tecnica.md — 5, sem autoridade na UI.

2.1.5 Login e recuperação de senha
- Status: implementado.
- Conteúdo: jornadas em E5; segurança de confirmação/recuperação em docs/base-tecnica.md — 5.3. Validade do token/código pertence ao Supabase Auth; redirects/SMTP em docs/platform-config.md — 4.4–4.5.

2.1.6 Limites do recorte
- Status: vigente.
- Conteúdo: Access Context E8 e membros/convites E11. Magic Link, login social e 2FA não estão implementados nem são pendências aprovadas deste caso.

3. E3 — Adapters Base
- Objetivo: acesso a dados por boundaries server-side.
- Status: concluído.

3.1 Fundação de adapters server-side

3.1.1 Objetivo e status
- Objetivo: normalizar dados fora da UI com autorização e falha fechada.
- Status: implementado.

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
- Status: vigente.
- Conteúdo: adapters entregam DTOs normalizados, usam client/RLS do contexto e estados controlados; guards autorizam, logging não autoriza. Regras duráveis em docs/base-tecnica.md — 3.14 e 5.2–5.3.

3.1.4 Evolução por boundary de domínio
- Status: vigente.
- Conteúdo: novos adapters exigem consumidor e responsabilidade reais no boundary competente; sem adapters genéricos antecipados pendentes. Paths/exports no código; classificação e PostgREST em docs/base-tecnica.md — 3.3 e 3.12.

4. E4 — Account Dashboard (Infraestrutura SSR)
- Objetivo: gateway e seção privada do Account Dashboard.
- Status: concluído.

4.1 Gateway e seção privada do Account Dashboard

4.1.1 Objetivo e status
- Objetivo: proteger /a/[account] por SSR e direcionar sessões sem loop ou exposição de contexto.
- Status: implementado.

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
- Status: vigente.
- Conteúdo: /a redireciona a /a/home, gateway público. Autenticado tenta última conta permitida e fallback determinístico; sem destino recebe informação segura. Primeira conta pending_setup somente sem qualquer membership. Contrato em docs/base-tecnica.md — 5.4.

4.1.4 Seção privada e contexto para a UI
- Status: vigente.
- Conteúdo: guard SSR decide allow/deny e destinos por estado; AccessProvider só recebe contexto sanitizado. Cookie da última conta, limpeza e cache por usuário seguem docs/base-tecnica.md — 5.1–5.2 e 3.13.

4.1.5 Limites e evoluções posteriores
- Status: vigente.
- Conteúdo: contexto E8, bloqueios E15/E16, comercial E10 e convites E11; produto LP legado retirado pela E22.4.

5. E5 — UI/Auth Account Dashboard
- Objetivo: jornadas page-based de Auth.
- Status: implementado; pendências em 5.2.5.

5.1 Login e recuperação de senha

5.1.1 Objetivo e status
- Objetivo: login e recuperação seguros.
- Status: implementado.

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
- Status: vigente.
- Conteúdo: páginas próprias de login, recuperação e nova senha; retorno interno seguro, fallback /a/home e cooldown visual. Segurança anti-enumeração, GET/POST e sessão conforme docs/base-tecnica.md — 5.3.

5.1.4 Mensagens públicas de erro
- Status: implementado.
- Conteúdo:
  - Credenciais recusadas: `E-mail ou senha inválidos.`, sem distinguir e-mail inexistente/senha incorreta.
  - Não confirmado: `Não foi possível entrar. Verifique se o e-mail foi confirmado e tente novamente.`, sem reenvio/fluxo extra.
  - Erro operacional/não classificado: `Não foi possível entrar agora. Tente novamente em instantes.`, sem erro bruto. Logging seguro conforme docs/base-tecnica.md — 5.3.3.
  - Preservar login válido, redirect, alerta programático e Esqueci minha senha.

5.2 Signup, confirmação e e-mail já cadastrado

5.2.1 Objetivo e status
- Objetivo: cadastro, confirmação e tratamento de e-mail já cadastrado.
- Status: implementado, incluindo reenvio.

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
- Status: vigente.
- Conteúdo: signup envia /auth/confirm com retorno /a/home; sign-up-success orienta confirmar por e-mail. GET apresenta intersticial sem consumir token/código; POST verifica/cria sessão e segue gateway E4. Correlação rid sem PII, senha, token ou código em logs; contrato técnico em docs/base-tecnica.md — 5.3.2–5.3.3.

5.2.4 Estado de e-mail já cadastrado
- Status: implementado.
- Conteúdo: duplicidade explícita ou ausência de identidade nova substitui senha/submit por orientação, reenvio nativo Supabase, login e troca de e-mail. Cooldown com contador/feedback e rate limit, sem infraestrutura própria ou distinção pública entre confirmado/não confirmado.

5.2.5 Pendências residuais de UX e validação
- Status: pendente.
- Conteúdo: copy/erros do signup ainda parcialmente em inglês ou do provedor; falta comprovação conclusiva do happy path signup → e-mail → confirmação → /a/home em mobile.

5.3 E-mail transacional do Supabase Auth

5.3.1 Objetivo e status
- Objetivo: entrega dos e-mails de signup e recuperação.
- Status: concluído, links e entrega validados.

5.3.2 Registros do recorte
- Referências:
  - SMTP, sender, DNS e estado operacional: `docs/platform-config.md` — seção 4.5.

5.3.3 Decisão operacional vigente
- Status: vigente.
- Conteúdo: Auth usa SMTP Resend e sender no domínio raiz no MVP; mailbox humana separada. Parâmetros/DNS em docs/platform-config.md — 4.5 e 5. Subdomínio só será reavaliado por escala, volume ou reputação que justifique configuração/plano adicionais.

6. E6 — Design System e UI Base
- Objetivo: identidade e UI base reutilizável.
- Status: implementado; adoção incremental, logo oficial ainda não versionada.

6.1 Fundamentos visuais e identidade

6.1.1 Objetivo e status
- Objetivo: fundamentos visuais próprios sobre shadcn.
- Status: concluído.

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
- Conteúdo: Inter e identidade comum em header/menu/seletor; tokens semânticos estendem shadcn. Contrato visual em docs/design-system.md; valores em CSS/Tailwind.

6.1.4 Identidade provisória e limite
- Status: pendente o asset oficial.
- Conteúdo: wordmark LP Factory provisória; branding por cliente e migração de kit não são escopo ou pendência aprovados.

6.2 Biblioteca de componentes base

6.2.1 Objetivo e status
- Objetivo: componentes mínimos para campos, ações e superfícies.
- Status: disponível e adotado em Auth, onboarding e superfícies posteriores.

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
- Status: vigente.
- Conteúdo: APIs/acessibilidade em código e docs/design-system.md; novas variações exigem uso imediato, sem framework próprio.

6.3 Estados visuais e feedback

6.3.1 Objetivo e status
- Objetivo: feedback de erro/sucesso/aviso, vazio e loading.
- Status: implementado nas superfícies previstas.

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
- Status: vigente.
- Conteúdo: estados/acessibilidade em docs/design-system.md, sem framework adicional de feedback/loading.

6.4 Padrões de layout para dashboards

6.4.1 Objetivo e status
- Objetivo: layout de coleções, detalhes e navegação autenticada.
- Status: vigente no Admin; workspace LP retirado.

6.4.2 Registros do recorte
- Referências:
  - Superfície administrativa: `docs/design-system.md` — seção “Superfície administrativa do Admin”.

6.4.3 Padrões vigentes e limites
- Status: vigente.
- Conteúdo: padrões Admin em docs/design-system.md; sem redesign amplo ou componentização antecipada.

7. E7 — Conta Consultiva — retirada
- Objetivo: registrar retirada da Conta Consultiva.
- Status: sem runtime ou Admin ativos.

7.1 Encerramento do fluxo consultivo legado

7.1.1 Objetivo e status
- Objetivo: encerrar onboarding/token pós-venda legado.
- Status: concluído.

7.1.3 Estado final e destino
- Status: retirado.
- Conteúdo: sem superfície Admin, onboarding/token pós-venda ou dependência de banco/runtime; UX absorvida pela E10.3.

7.1.4 Limite de retomada
- Status: vigente.
- Conteúdo: sem reconstrução autorizada ou integração Billing pendente; eventual operação consultiva exige recorte próprio aprovado.

8. E8 — Access Context e Governança
- Objetivo: decisão canônica de acesso por conta.
- Status: implementado; compatibilidade residual em 8.1.5.

8.1 Decisão canônica de acesso

8.1.1 Objetivo e status
- Objetivo: resolver conta/membership, decisão e motivo com falha fechada.
- Status: implementado.

8.1.2 Registros do recorte
- Referências:
  - Arquitetura de acesso, guards e consumidores: `docs/base-tecnica.md` — seções 5.1 e 5.2.
  - View canônica do Access Context: `docs/schema.md` — seção 2.1.

8.1.3 Autoridade e decisão
- Status: vigente.
- Conteúdo: v_access_context_v2 → adapter/orquestrador → guard SSR; ausência falha fechada, bloqueio conhecido preserva contexto, UI só consome projeção sanitizada. Contratos em docs/schema.md — 2.1 e docs/base-tecnica.md — 5.1–5.2.

8.1.4 Governança, bloqueios e rastreabilidade
- Status: vigente.
- Conteúdo: eventos estruturados de allow/deny/erro seguro; bloqueios E15/E16 e gateway E4. Logging/redirects/cookie conforme docs/base-tecnica.md — 5.

8.1.5 Compatibilidade residual
- Status: residual, não autoritativo.
- Conteúdo: getAccessContext.ts expõe placeholders is_super_admin, acting_as, plan e limits, sem decidir privilégio/entitlement/plano/limite. Guards governam Admin; E9 governa comercial. Remoção depende de consumidores reais, sem refactor antecipado.

9. E9 — Billing, trial e entitlements
- Objetivo: condição comercial por entitlement local, separada do lifecycle.
- Status: entitlement, liberação manual e Stripe mínimo implementados; trial/provedores alternativos não implementados; catálogo/consumo de capacidades ainda planejados.

9.1 Base universal de entitlement comercial

9.1.1 Objetivo e status
- Objetivo: elegibilidade comercial por sinal local efetivo.
- Status: implementado.

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
- Conteúdo: conta/setup e membership não são condição comercial. Trial/plano/assinatura/liberação manual só controlam uso por entitlement válido; domínio separado de access/plans legados.

9.1.4 Origem comercial e confirmação
- Status: implementado para plano_pago_confirmado e liberacao_manual; trial futuro.
- Conteúdo: checkout/webhook confirmam e persistem, sem constituir origem comercial ou prova direta de acesso. Persistência local idempotente quando aplicável.

9.1.5 Planos comerciais canônicos
- Status: vigente.
- Conteúdo: Starter/starter, Lite/lite, Pro/pro e Ultra/ultra; contrato em lib/billing-checkout/contracts.ts. plan.ts legado não governa checkout, entitlement ou capacidades.

9.1.6 Modelo mínimo de entitlement comercial
- Status: implementado.
- Conteúdo: fonte account_commercial_entitlements; sinal público server-side com elegibilidade, status efetivo e planKey. Contrato técnico em docs/base-tecnica.md — 3.14.1.

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
- Objetivo: conceder, atualizar ou cancelar entitlement manual por platform_admin.
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
- Conteúdo: origem liberacao_manual, plano canônico, vigência válida e metadata mínima. Atualiza manual ativo sem duplicar; conflito com plano pago/trial efetivo falha fechado. Autoridade e boundary em docs/base-tecnica.md — 3.14.2.

9.3 Trial

9.3.1 Objetivo e status
- Objetivo: trial como origem de entitlement.
- Status: não implementado; depende de recorte aprovado.

9.3.3 Trial como origem futura de entitlement
- Status: futuro.
- Conteúdo: usa entitlement local E9.1, distinto da liberação manual e sem alterar lifecycle.

9.3.4 Vigência, expiração e limites a definir
- Status: a definir.
- Conteúdo: vigência, expiração, limites e efeitos comerciais.

9.3.5 Pendências para implementação operacional
- Status: não implementado.
- Conteúdo: contrato operacional e auditoria exigem aprovação; liberação manual não implementa trial.

9.4 Stripe

9.4.1 Objetivo e status
- Objetivo: checkout e confirmação Stripe com persistência local.
- Status: subscription em teste e webhook invoice.paid concluídos.

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
- Objetivo: avaliar Mercado Pago futuramente.
- Status: adiado; sem integração ou credencial.

9.5.3 Critérios para abertura futura
- Uma integração futura exige recorte aprovado e deve seguir o contrato universal de entitlement definido em 9.1.

9.6 Asaas

9.6.1 Objetivo e status
- Objetivo: manter Asaas como alternativa futura.
- Status: não implementado; sem integração ou credencial.

9.6.3 Critérios para abertura futura
- Uma avaliação futura exige recorte aprovado e deve seguir o contrato universal de entitlement definido em 9.1.

9.7 Catálogo canônico de capacidades e limites por plano

9.7.1 Objetivo e status
- Objetivo: traduzir plano efetivo em capacidades/limites canônicos.
- Status: contrato concluído; catálogo e integração planejados, fora da execução atual.

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
- Conteúdo: definição por chave, nome, descrição, categoria, tipo e consumidor; booleano, nível fechado ou limite numérico (-1 ilimitado somente se contratado). API pública fail-closed em lib/commercial-capabilities; registry runtime vazio, sem Starter inferido, fixtures isoladas e saída imutável. Contratos/validator no código, governança em docs/base-tecnica.md — 3.11. Sem banco, get_feature, grants, snapshot, consumidor ou infraestrutura novos.

9.7.4 Catálogo inicial do Starter
- Status: planejado, execução não autorizada.
- Conteúdo: somente capacidades aprovadas com consumidor real/aprovado imediato; definição separada do valor Starter, candidatas como dependências. Sem extrapolar Lite/Pro/Ultra ou confundir capacidade admitida, consumidor apto e recurso existente.

9.7.5 Resolução e contrato de consumo pelo plano efetivo
- Status: planejado, execução não autorizada.
- Conteúdo: resolver pelo planKey efetivo; entitlement comprova plano, E9.7 comprova capacidade. Contrato server-side determinístico, com medição/gate no consumidor; UI não infere pelo nome. Plano/capacidade/associação/valor ausente, desconhecido ou inválido falha fechado.

10. E10 — Account Dashboard e jornada da conta
- Objetivo: jornada por conta, do setup ao comercial e à Base.
- Status: fluxos principais operacionais; pendências do switcher em 10.3.3 e edição manual de copy em 10.7.6. Factual E10.10 retirado.

10.3 Navegação multi-conta e cabeçalho

10.3.1 Objetivo e status
- Objetivo: identificar/trocar conta e retomar a última permitida.
- Status: implementado; Criar outra conta ainda inefetivo.

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
- Header mostra conta/status/nicho e membros para owner/admin com gate habilitado. Menu contém switcher de v_user_accounts_list, oculto até uma conta, com teclado, foco, loading/erro e bloqueio de vínculos/contas não clicáveis.
- Retomada SSR por cookie HttpOnly de 90 dias; acesso E4/E8. Criar outra conta aponta /a/home?consultive=1 sem provisionamento; account_switcher_open, account_selected e create_account_click não são emitidos.

10.4 Primeiros passos com status `pending_setup`

10.4.1 Objetivo e status
- Objetivo: destino do setup por formulário.
- Status: substituído por E10.9.

10.4.2 Registros do recorte
- Referências:
  - Jornada substituta: `docs/roadmap.md` — seções 10.9, 10.11 e 10.12.
  - Dados históricos preservados: `docs/schema.md` — seção 1.8.

10.4.3 Campos e validação compartilhada
- Status: retirado.
- Conteúdo: formulário/action/validação fora do runtime; jornada substituta E10.9–E10.12.

10.4.4 Persistência e transição
- Status: substituído.
- Conteúdo: account_profiles histórico sem adapter órfão; conclusão conversacional idempotente. Timestamps legados não decidem acesso/logs.

10.5 Taxonomia, pesquisa de mercado e resolução de nicho

10.5.1 Objetivo e status
- Objetivo: classificação segura e contexto comercial do nicho.
- Status: matching, IA complementar, vínculo determinístico e confirmação/reescrita implementados.

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
- Taxonomia/aliases e pesquisas/itens versionados conforme docs/schema.md — 1.11–1.19; operação separa identificar → pesquisar → estruturar → carregar → verificar.
- Elegibilidade comercial: pesquisas v1 ativas de business_buyer e end_customer, com itens ativos nos blocos strategic_core, lp_overview, lp_sections e seo.

10.5.4 Resolução determinística e IA
- Matching server-side tipado antes da IA; resolução/proveniência/confirmação persistidas em account_niche_resolutions. Structured Outputs só quando o determinístico é insuficiente, sem criar taxon/alias/vínculo oficial. Regras em docs/base-tecnica.md — 3.14.5; operação em docs/automations.md — 3.5.

10.5.5 Confirmação pelo usuário
- NicheResolutionCard somente em conta active sem primário e com resolução acionável. Permite confirmar, escolher ou reescrever; fallback operacional não inventa vínculo oficial.

10.5.6 Classificação oficial e consumo
- account_taxonomy governa vínculo oficial; automático só por alta confiança determinística, sem substituir primário diferente. No máximo um primário ativo; cardinalidade inesperada falha fechado.
- Primário ativo permite tentar página publicada E10.7; sem bundle publicável, genérica E10.6. Template antecipado/produto E19 retirados.

10.6 Página comercial genérica

10.6.1 Objetivo e status
- Objetivo: apresentação comercial de conta active sem página personalizada consumível.
- Status: generic-v1 implementado como fallback.

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
- Hero, benefícios, serviços, medição, planos, diferenciais, funcionamento, FAQ e CTA final. Financeiro conforme E11.2; planos iniciam Checkout mensal E9.4, CTA final vai ao WhatsApp.
- Eventos commercial_page_view, commercial_primary_cta_click e commercial_plan_cta_click via audit_context_event, com account_id e sem PII direta.

10.6.4 Limites e fallback
- Preços/serviços ilustrativos, sem oferta definitiva. NicheResolutionCard acima quando houver confirmação pendente; ausência/erro/bundle inválido mantém genérica. Renderização sem IA.

10.7 Páginas comerciais personalizadas por nicho

10.7.1 Objetivo e status
- Objetivo: gerar/revisar/publicar commercial_activation por taxon no Admin e consumir publicado na conta.
- Status: implementado; edição manual de copy planejada.

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
- Taxon elegível pelas pesquisas E10.5.3; template universal, composição técnica por taxon. Draft com fontes/proveniência, sem publicação inconsistente.
- Hero, Benefícios, Serviços, Planos, Diferenciais, Como funciona, FAQ e CTA final fixos; IA preenche copy, não decide estrutura/ordem/layout/cores. Geração segura em docs/base-tecnica.md — 3.15.1.

10.7.4 Operação administrativa
- Operações exclusivas de platform_admin: /admin/templates lista taxons/estados; detalhe commercial-activation/[taxonSlug] reúne geração/regeneração, preview, publicação, diagnóstico/histórico. platform_admin publica bundle válido transacionalmente, arquivando anterior; sem edição manual de content_json.

10.7.5 Consumo na conta
- Rota da conta resolve pela cadeia do primário ativo; somente published + composição válida + render model ready. Falta/invalidez retorna generic-v1; sem draft/archived ou IA no runtime. Eventos, Checkout e autoridade financeira iguais à genérica.

10.7.6 Próximo recorte aprovado
- Status: planejado.
- Conteúdo: copy manual e versões simples; sem editor visual/por bloco, published simultâneos ou mudança de template/composição/layout/cores/runtime público.

10.8 Resolução de pesquisas estruturadas para `landing_page` — retirada

10.8.1 Objetivo e status
- Objetivo: destino da resolução de pesquisas landing_page.
- Status: retirada pela E22.1.6, sem substituto E10.

10.8.3 Estado e destino
- Boundary/adapters/exports/validator retirados; registros em E22.1.2. Pesquisas compartilhadas preservadas. Seleção/avaliação E20 também encerradas pela E22.7.

10.9 Pending Setup pré-comercial e continuidade conversacional

10.9.1 Objetivo e status
- Objetivo: setup pré-comercial conversacional sem entitlement.
- Status: operacional em Production; somente conversas legadas mantêm E10.9, novas usam E10.12, sem conversão.

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
- Status: implementado.
- Conteúdo: entrada única após confirmar e-mail; reutiliza nome preferido válido ou pergunta uma vez e abre conversa. Sem exigir Site/LP, canal ou Nome do projeto.

10.9.4 Conversa adaptativa e resolução do nicho
- Status: implementado.
- Conteúdo: determinístico antes de niche_resolution para ambiguidade; sugestão oficial/fallback legítimo exigem confirmação, falha técnica permite retry sem inventar taxon. Reserva/atomicidade em docs/base-tecnica.md — 3.14.5–3.14.6.

10.9.5 Histórico conversacional e retomada
- Status: implementado.
- Conteúdo: turnos/estado por usuário e conta, retomáveis em pending_setup; histórico preservado sem chat após active.

10.9.6 Conclusão, cutover e passagem ao comercial
- Status: concluído em Production.
- Conteúdo: conclusão transacional/idempotente sem entitlement; mantém account_profiles histórico, card active, checkout e gates independentes. E10.4 sem entrada executável.

10.10 Onboarding factual pós-compra/trial

10.10.1 Objetivo e status
- Objetivo: destino do onboarding factual.
- Status: retirado pela E22.7; migrations não aplicadas.

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
- Status: retirado.
- Conteúdo: duas migrations E10.10 excluídas do apply; sem cutover ou consumidor pendente, dados/migrations históricos preservados.

10.10.4 UX factual e prontidão para a Base
- Status: retirado.
- Conteúdo: passagem atual E10.11, sem prontidão factual.

10.11 Passagem mínima para a Base

10.11.1 Objetivo e status
- Objetivo: nome público e contexto inicial consentido na Base; acesso comercial preservado.
- Status: operacional em Preview/Production.

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
- Conteúdo: nome público explícito, distinto de nome preferido/razão social/conta. Base inicia pelo nome de uma única conversa concluída e contexto confirmado só com consentimento; histórico sem nome deixa seção vazia/editável. Sem sincronização de volta.

10.11.4 Gate e encaminhamento
- Status: habilitado em Preview/Production.
- Conteúdo: conta active resolve entitlement antes da taxonomia; autorizado vai à Base, inclusive manual E9.2 sem taxon; demais mantêm comercial/espera e financeiro E11.2. Erro em entitlement/taxon exigido bloqueia decisão. Sem desvio a E10.10.

10.11.5 Continuidade e regressão
- Status: vigente.
- Conteúdo: matching/fallback, checkout, membership e entitlement preservados. E10.10 excluído do apply integral ainda suspenso; operação em docs/platform-config.md — 2.3.

10.12 Atendimento inicial por IA e agente vendedor

10.12.1 Objetivo e status
- Objetivo: compreender negócio/necessidades/interesse, orientar sobre serviços reais e definir próximo passo, confirmando categoria segura.
- Status: operacional em Preview/Production; legadas E10.9 preservadas.
- Dependência: catálogo/repertório E10.13 disponível; PB-B não é pré-condição.

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
- Status: operacional.
- Conteúdo: interpretar a mensagem inteira sem repetir contexto antecipado. Nome preferido validado é persistido no campo próprio; negócio permanece contextual até confirmação de nome público. Diálogo integral por conta/participante e Resumo contextual único, sem autoridade ou versionamento funcional próprio, subordinados às fontes oficiais.
- Resumo distingue síntese proposta, entendimento aceito, categoria confirmada, sugestões/oportunidades e ausência de identificação; compactação/correções preservam significado vigente e não tornam sugestão fato. Confirmação usa o entendimento exibido/persistido; texto integral no Diálogo. Governança em docs/base-tecnica.md — 3.14.6.
- Limites: Resumo 6.000 caracteres sem meta de preenchimento; entendimento 4.000, demais limites preservados. Sem teto herdado de três chamadas, nova tabela/estado/memória/parser frase a frase/formulário oculto/infraestrutura. Leitura operacional falha ou excesso físico não anuncia sucesso.

10.12.4 Identificação pelo catálogo
- Status: operacional.
- Conteúdo: categorias ativas/repertório D21, comparação semântica e pergunta focal quando necessária. Vínculo oficial só após confirmação e validação determinística. Sem Web classificatória ou manutenção de taxons/aliases; sem correspondência, explicitar ausência e preservar entendimento/continuidade comercial.

10.12.5 Repertório do nicho e apoio à venda
- Status: operacional.
- Conteúdo: Entender → Impressionar → Conectar → Avançar, adaptativo, sem quatro turnos ou roteiro obrigatório. Após atividade/oferta/necessidade mínimas, entregar insight pertinente ligado à proposta real antes de outra pergunta comercial. Informação acessória só quando material para compreensão, valor, decisão ou próximo passo; identidade/confirmações obrigatórias preservadas.
- Repertório D21 é contexto, não fala obrigatória, característica declarada ou promessa. Serviço/condição/prazo/disponibilidade efetivos exigem fonte comercial vigente; sem fonte, não inventar. D21 mantém catálogo, pesquisa e política de aliases; aprofundamento D17 preservado.
- Avançar com os critérios de 10.12.6, sem diagnóstico completo, venda esgotada ou término prematuro de conversa útil. Paralelizar só leituras independentes; efeitos/provider/commit ordenados. Sem garantia de duração ou ganho causal de latência comprovado.

10.12.6 Conclusão e experiência
- Status: operacional.
- Conteúdo: concluir com negócio/necessidades compreendidos, orientação pertinente e próximo passo claro, categoria confirmada ou ausência explícita. Categoria confirmada não conclui sozinha. Manter identidade, WhatsApp e E10.11; entendimento suficiente sem taxon não bloqueia comercial/Base nem concede entitlement, acesso pago, trial ou contratação.
- Encerramento inconclusivo: redirecionar desvio ocasional; diante de desvio persistente, repetição, circularidade ou falta de avanço útil, encerrar cordialmente, com contexto/pendência no Resumo e retomada útil possível. Sem prometer análise posterior, prazo, retorno/contato automático; sem contador, tempo fixo ou failsafe econômico.
- Limites: objeções, comparação/recomendação e encaminhamento aprofundado à contratação continuam no D17 até absorção aprovada. Sem relacionamento operacional com a Base, sincronização, engine/consumidor futuro ou continuidade assíncrona. Falha preserva contexto; conflito externo não sobrescreve/duplica/anuncia sucesso nem reconstrói proposta ou exige reavaliação/reconfirmação automáticas. Após conclusão, Pending Setup não governa alterações da conta.

10.13 Cadastro inicial de taxonomia e inteligência de mercado

10.13.1 Objetivo e status
- Objetivo: incorporar Nichos.zip/pasta original ao catálogo e disponibilizar inteligência aproveitável.
- Status: carga inicial e disponibilidade concluídas, preservando E10.5/E10.12; PB-B não iniciado.

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
- Status: concluído; cinco ocorrências de quatro rótulos ambíguos aceitas como pendentes.
- Conteúdo: carga reconciliada pelo inventário de 10.13.2, com destinos justificados e pais ativos/válidos, sem duplicação na hierarquia. Somente segmentos/nichos seguros ausentes; sem ultranichos, aliases, reativação, duplicação de inativos ou nicho artificial por oferta/público/localidade/atributo. Registros existentes preservados; colisão/concorrência abortam integralmente.

10.13.4 Adaptação e disponibilidade do conteúdo
- Status: conteúdo disponível, preexistentes preservados; oito nichos novos sem pesquisa específica e lacunas de validação/atualização para PB-B, sem execução autorizada.
- Conteúdo: panorama, tendências, maturidade digital e oportunidades/diferenciação condicionais por taxon, sem tamanho uniforme. Fontes/períodos/incertezas explícitos; indicador exige fonte/período, hipótese não vira característica da empresa. Disponibilidade comprovada por leitura autorizada, não apenas escrita.
- Limites: sem pesquisa complementar/manutenção periódica de rotina, mudança de schema/permissões/UI/runtime ou infraestrutura/automação/contato com leads. Integração conversacional D15B; dores/crenças/copy/particularidades da empresa D14D; contas/Bases/publicados/entitlement/busca/consumidores preservados.

11. E11 — Gestão de membros e autoridade comercial
- Objetivo: gestão de membros não-owner e autoridade comercial por papel/entitlement.
- Status: implementado em Preview/Production.

11.1 Gestão de membros e convites

11.1.1 Objetivo e status
- Objetivo: owner/admin gerem admin/editor/viewer, protegendo owner, próprio ator e isolamento.
- Status: operacional com E11_MEMBERS_ENABLED=true.

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
- Rota /a/[account]/members, leituras e ações exigem gate e owner/admin. Mutações comuns excluem owner e protegem o próprio ator.
- Alteração de papel, desativação e revogação são específicas por membership e idempotentes no estado final. Boundary server-only account-members; funções legadas sem EXECUTE de runtime.

11.1.4 Convite por e-mail
- Novo/não confirmado recebe Invite user nativo do Auth. Cada emissão leva estado versionado/assinado para um único account_user_id no redirectTo; confirmação anti-scanner, senha e ativação só atingem esse vínculo, com retry idempotente.
- Auth governa validade/reenvio; sem expiração local, e-mail customizado, hook amplo ou job. Esta seção governa funcionalmente a jornada.
- Callback: NEXT_PUBLIC_SITE_URL explícito; depois VERCEL_BRANCH_URL em Preview ou VERCEL_PROJECT_PRODUCTION_URL em Production; fallback VERCEL_URL. Origem ausente/inválida falha fechado.
- Limite da comprovação em Production: convite recebido, confirmação, cadastro, viewer/active e login no tenant correto; não cobre todos os papéis, ambientes ou extremos.

11.1.5 Convite dentro do produto
- Confirmado recebe pendência em /a/home, sem e-mail. Aceite/recusa usam identidade da sessão e um vínculo por tentativa.
- Canal correlacionado ao ciclo pending atual; evento ausente/antigo falha fechado. Membership fica pending até aceite, recusa ou revogação.

11.1.6 Superfície de gestão
- Lista ativos/pendentes; owner/admin convidam, reenviam, revogam, alteram papel e desativam com as proteções 11.1.3.
- Navegação só para autorizados. Gate ausente ou diferente do literal true fecha rota, navegação, leituras e mutações.

11.2 Autoridade comercial por papel

11.2.1 Objetivo e status
- Objetivo: decidir checkout e novos convites/reenvio por papel e sinal E9, sem alterar vínculos existentes.
- Status: implementado no servidor e nas variantes comerciais genérica/publicada.

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
- Só owner com conta/membership active e sem entitlement válido vê ações financeiras/inicia Checkout. Action repete o guard; owner já elegível não cria nova assinatura.
- Decisão usa apenas CommercialEntitlementSignal.isCommerciallyEligible; pagamento em E9.4. No máximo um commercial_checkout_decision por decisão: allowed/denied/error, sem PII direta e sem alterar resultado.

11.2.4 Novos convites e reenvio
- Só owner/admin, conta active e isCommerciallyEligible=true. Sinal ausente/erro bloqueia antes de ler/criar Auth, preparar membership, registrar canal ou enviar.
- No máximo um account_member_invite_decision não bloqueante por decisão; editor/viewer sem gestão.

11.2.5 Experiência sem entitlement
- Sem entitlement: owner recebe comercial com financeiro; demais aguardam ativação pelo proprietário, sem cards/CTA financeiro.
- Mesma política nas variantes genérica/publicada; bundle e contrato E10.7 preservados. Com entitlement segue E10.11, sem dashboard paralelo.

11.2.6 Operações preservadas
- Entitlement não condiciona listagem, aceite, recusa, revogação, desativação ou alteração de papel, nem modifica memberships retroativamente. Gate comercial só limita criar/reenviar convites; transições E11.1 preservadas.

12. E12 — Admin Dashboard
- Objetivo: Admin protegido, independente da conta, com leitura operacional e operações autorizadas pelos domínios.
- Status: áreas 12.1.4 implementadas; Auditoria em preparação.

12.1 Contrato administrativo base

12.1.1 Objetivo e status
- Objetivo: delimitar proteção, shell e autoridade do Admin.
- Status: implementado.

12.1.3 Fronteira vigente
- /admin é público; rotas internas exigem platform_admin no layout SSR. Pós-login: /admin/contas. Header/sidebar/menu próprios, sem AccountSwitcher ou conta ativa.
- Shell não cria autoridade: páginas comerciais E10.7, entitlement manual E9.2, seções da Base E25.3 e workloads/custos E21 governam suas operações. Factual E20 retirado.

12.1.4 Áreas atuais
- Disponíveis: Base de Comunicação, Contas, Resoluções de nicho, Taxonomia, Páginas comerciais, Estrutura da LP, Workloads OpenAI, Custos OpenAI e Documentação.
- Auditoria em preparação; navegação responsiva, sem acesso autenticado não autorizado.

12.2 Shell, documentação e leituras administrativas base

12.2.1 Objetivo e status
- Objetivo: entrada, shell, documentação e leituras administrativas de contas/resoluções/taxonomia.
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
- Entrada envia a /auth/login?next=%2Fadmin%2Fcontas. Layout reexecuta requirePlatformAdmin: anônimo vai ao login; sem autoridade, destino público neutro.
- Header/sidebar/menu mobile compartilham largura operacional.

12.2.4 Documentação read-only
- /admin/documentacao filtra/seleciona whitelist fixa; filesystem server-side lê somente paths autorizados, incluídos no tracing. Markdown bruto, somente leitura; sem GitHub API em runtime, editor, publicação ou banco.

12.2.5 Leituras e integrações de conta
- Adapters server-only com paginação/filtros/projeções administrativas. Resoluções são read-only; conta integra entitlement manual E9.2; taxonomia operacional em 12.5.

12.3 Integração administrativa de `commercial_activation`

12.3.1 Objetivo e status
- Objetivo: integrar commercial_activation E10.7 ao shell.
- Status: implementado; contrato e registros em E10.7.

12.3.2 Registros do recorte
- Referências:
  - Registros materiais e contrato funcional: E10.7.2–E10.7.5.

12.3.3 Superfície integrada
- Superfície E10.7.4 protegida pelo layout; cada Server Action reexecuta requirePlatformAdmin. Geração/publicação/consumo seguem E10.7, sem editor visual ou LP Builder.

12.4 Perfil de orientação — retirado

12.4.1 Objetivo e status
- Objetivo: delimitar a retirada de perfis de orientação.
- Status: retirado pela E22.1.4.

12.4.3 Estado e destino
- Rotas, navegação, boundary, workload, tabelas/RPCs e operação IA próprios removidos; sem dependência na geração atual. Registros em E22.1.2.

12.5 Taxonomia e diagnóstico contextual

12.5.1 Objetivo e status
- Objetivo: gerir taxonomia e consultar resoluções/diagnóstico comercial.
- Status: implementado; factual E20 retirado pela E22.7.

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
- Conteúdo: busca/filtros de nível/status; detalhe com identidade, hierarquia, uso, aliases e diagnóstico comercial. platform_admin cria, edita, ativa/inativa, gerencia aliases e exclui com segurança, preservando vínculos, pai ativo e concorrência otimista. Novos taxons inativos; sem seleção/avaliação factual E20.

12.5.4 Resoluções de nicho e navegação
- Resoluções read-only: entrada, confiança, decisão determinística, estado IA e revisão. Navegação usa taxon confirmado, nunca sugestão IA isolada. Falha diagnóstica não inventa prontidão nem escolhe resultado; sem estados órfãos de perfil/E10.8.

12.5.5 Evolução da revisão factual por taxon
- Status: retirado pela E22.7.
- Conteúdo: sem cobertura, fields herdados, liberação ou assistência factual; taxonomia segue 12.5.3.

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
- Conteúdo: /admin/estrutura-lp, autorizado por plataforma, consulta API E18.4 por versão raiz/preset; query antiga/desconhecida retorna a Parâmetros. Leitura server-only sem N+1, registry privado ou regra de domínio em React; sem gestão factual, IA ou publicação.

12.6.4 Evolução do catálogo factual
- Status: retirado pela E22.7.
- Conteúdo: Entradas/gestão E20.8 sem consumidor ou cutover/QA pendentes.

12.7 Contrato de apresentação para páginas operacionais de dashboard

12.7.1 Objetivo e status
- Objetivo: aplicar apresentação operacional canônica a novos recortes de dashboard.
- Status: vigente, sem alteração automática de superfícies existentes.

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
- Conteúdo: contrato mínimo na referência visual 12.7.2; autoridade funcional permanece no domínio, tecnologia de listas em aberto.

12.7.4 Refinamento canônico de composição e responsividade
- Status: vigente.
- Conteúdo: composição/responsividade na mesma fonte canônica. Cobre Admin/Account e Partner quando funcional; exclui páginas públicas e LPs comerciais.

12.7.5 Enforcement do contrato de apresentação
- Status: vigente.
- Conteúdo: implementação, review e QA verificam contrato visual; só exceção funcional exige decisão humana.

12.8 Piloto do padrão transversal no fluxo Taxonomia e cobertura factual

12.8.1 Objetivo e status
- Objetivo: pilotar apresentação E12.7 na Taxonomia.
- Status: implementado; factual retirado pela E22.7, demais áreas fora do recorte.

12.8.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `app/admin/(protected)/taxonomia/page.tsx`
    - `app/admin/(protected)/taxonomia/[taxonId]/page.tsx`
- Referências:
  - Contrato visual: `docs/design-system.md` — Contrato de apresentação para páginas operacionais de dashboard.

12.8.3 Taxonomia como piloto de coleção e detalhe
- Status: implementado.
- Conteúdo: coleção com identidade, nível, estado, diagnóstico e Abrir; busca global/filtros de nível/estado. Desktop com filtros nos cabeçalhos; mobile compacto com rolagem horizontal indicada. Detalhe prioriza identidade/estado/ações humanas e revela técnica em segundo nível; sem factual E20.

12.8.4 Cobertura factual e subtarefas como piloto de interação
- Status: retirado pela E22.7.
- Conteúdo: sem cobertura/fields/retorno factual; interação geral permanece no Design System.

13. E13 — Partner Dashboard
- Objetivo: reservar jornada de parceiros até aprovação funcional.
- Status: não iniciado; sem dashboard, rota, boundary ou API.

13.1 Recorte futuro de parceiros

13.1.1 Objetivo e status
- Objetivo: definir atores, permissões e resultado operacional antes da superfície.
- Status: futuro sem escopo aprovado.

13.1.2 Registros do recorte
- Referências:
  - Contrato de banco: `docs/schema.md` — seções 1.6–1.7.

13.1.3 Estado atual e limite
- Fundação partners/partner_accounts em E1 e schema 1.6–1.7. Sem branding de agência, gestão de clientes ou relatórios. Boundary própria somente com primeiro recorte aprovado e consumidores reais.

14. E14 — Área pessoal do usuário — não iniciada
- Objetivo: reservar perfil/preferências pessoais, distintos da conta e do workspace LP retirado.
- Status: não iniciado; sem rota, persistência ou boundary.

14.1 Perfil e preferências pessoais

14.1.1 Objetivo e status
- Objetivo: definir campos, autoridade e resultado antes da implementação.
- Status: futuro sem recorte aprovado.

14.1.3 Estado atual e residência das responsabilidades
- UserMenu ainda aponta a /workspace/profile inexistente; não entrega jornada. Seleção da conta em E10.3; acesso em E8; workspace/onboarding LP retirados em E19/E22.4. Sem nova estrutura antes de recorte pessoal aprovado.

15. E15 — Usuário e membership por conta
- Objetivo: decidir por membership da conta, distinto da identidade global.
- Status: implementado em banco, Access Context, redirects e convites.

15.1 Contrato de membership

15.1.1 Objetivo e status
- Objetivo: avaliar papel/status por vínculo do tenant solicitado.
- Status: concluído.

15.1.2 Registros do recorte
- Referências:
  - Contrato técnico: `docs/base-tecnica.md` — seções 5.1.1 e 5.4.
  - Contrato de banco: `docs/schema.md` — seções 1.2 e 2.1.
  - Ciclo de convite: E11.1.

15.1.3 Identidade e vínculo
- Auth é identidade global; account_users vincula à conta. Papel/status podem variar entre contas, nunca são reaproveitados de outro vínculo. Estados: pending, active, inactive e revoked.

15.1.4 Ativação e bloqueios
- Não-owner pending só ativa por aceite autenticado ou confirmação validada E11.1; sem hook amplo/funções legadas no runtime.
- Pending/inactive/revoked e conta bloqueada recebem destinos públicos específicos; decisão/redirects em E8 e guard SSR E4.

15.1.5 Usuário sem membership
- Sem membership: /a/home tenta última conta válida/fallback determinístico e retorna a /auth/confirm/info se indisponível; gateway não cria conta. Primeira conta somente pelo fluxo server-side aprovado, bloqueado pela existência de qualquer membership.

16. E16 — Lifecycle operacional de contas
- Objetivo: lifecycle de accounts.status independente de billing/entitlement.
- Status: consumo e pending_setup → active implementados; sem gestão administrativa de suspensão, inativação ou reativação.

16.1 Estados e transições da conta

16.1.1 Objetivo e status
- Objetivo: unificar estados em adapters, guards e UX.
- Status: implementado; drift de copy da conta inativa em 16.1.6.

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
- pending_setup: conversa E10.12 incompleta ou legada E10.9.
- active: com entitlement vai à Base; sem ele, comercial/espera por papel; erro de leitura falha fechado. Sem produto LP legado.
- inactive: bloqueio reversível com destino público de conta inativa; suspended: bloqueio administrativo com destino público de conta suspensa.
- Conta e membership devem ambos permitir a operação.

16.1.4 Transição implementada
- Única transição de produto: conclusão válida/transacional E10.9/E10.12, com requisitos E10.11, faz pending_setup → active por update condicional/idempotente.
- Admin não inativa, reativa, suspende ou retira suspensão. Billing/trial/plano/pagamento/entitlement E9 não mudam accounts.status.

16.1.5 UX dos bloqueios
- Bloqueio remove última conta persistida em best effort antes do redirect, sem escolher outra silenciosamente. Inativa oferece e-mail; suspensa oferece suporte; ambas permitem troca de conta/login.

16.1.6 Limite e drift atual
- /auth/confirm/account/inactive ainda associa inatividade a pagamento e mostra “Reativar / pagar”, em conflito com E9. Não há integração billing ou transição automática. Até recorte aprovado, inactive/suspended são apenas consumidos/bloqueados.

17. E17 — Automações e infraestrutura de validação
- Objetivo: automações operacionais e validação controlada, sem assumir autoridade dos casos de produto.
- Status: fluxos ativos catalogados em docs/automations.md.

17.1 Automações operacionais e validação

17.1.1 Objetivo e status
- Objetivo: inspeção, aplicação controlada, validação e manutenção documental por Actions.
- Status: implementado conforme catálogo operacional 17.1.2.

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
- Workflows orquestram; automações isoladas em automations/<nome>/ com runtime/README próprios. pipelines/ não é raiz oficial dos fluxos migrados. Configuração/secrets por nome em docs/platform-config.md.

17.1.4 Checks e segurança
- Checks locais e exceção documental em AGENTS.md; security.yml verifica segurança. Inspeção SQL é read-only; mutação só por contrato próprio autorizado.

17.1.5 Facilitadores de teste retirados
- Status: Validador Final e Niche Runtime Tests retirados pela E22.6, sem substituto.
- Conteúdo: E5/E10.5.6 preservam autoridade; contas/evidências existentes não são apagadas.

17.1.6 Pipelines operacionais
- Inspect executa SQL read-only e gera logs/Summary. Ingestão opcional de custos via HMAC registra eventos E21 pelo Core, conforme docs/automations.md — 3.1.
- Docs Apply transforma report JSON em Markdown/branch/PR com revisão humana. Apply integral de migrations permanece suspenso; exceções seletivas e gates vigentes em docs/platform-config.md — 2.3. Novo apply exige decisão própria.
- Migration aplicada só é corrigida/revertida por nova incremental; SQL Editor fora do fluxo normal.

17.1.7 Limites
- IA de produto pertence ao caso funcional e catálogo; workloads/prova/ativação/rollback/custos pertencem à E21. Sem agente autônomo, Agents SDK ou substituto do Agent Builder retirado.

17.2 Fundação operacional da OpenAI Platform

17.2.1 Objetivo e status
- Objetivo: separar projetos de desenvolvimento/produção sem expor credenciais.
- Status: configurado; não implementa agente.

17.2.2 Registros do recorte
- Referências:
  - Configuração canônica: `docs/platform-config.md` — seção 6.1.

17.2.3 Estado atual
- Projetos, sharing, isolamento e Service Account em docs/platform-config.md — 6.1. Credenciais somente por localização/finalidade, nunca valor. Modelo/revisão de produto em E21.

17.6 Supabase STAGING — descontinuado

17.6.1 Objetivo e status
- Objetivo: delimitar encerramento do espelho STAGING.
- Status: descontinuado; sem projeto STAGING ativo.

17.6.2 Registros do recorte
- Referências:
  - Estado da plataforma: `docs/platform-config.md` — seção 4.2.

17.6.3 Estado atual
- LP-Factory-10-staging removido; Previews usam projeto principal conforme plataforma 4.2. Novo staging exige recorte aprovado/controles, sem substituto implícito.

17.9 Autonomia institucional de QA

17.9.1 Objetivo e status
- Objetivo: identidade institucional exclusiva para IA executar jornadas variáveis de QA sem presença de Alcino.
- Status: planejado, ainda não atingido.

17.9.3 Consulta autônoma ao catálogo institucional de QA
- Objetivo: localizar/consultar autonomamente contas e usuários QA autorizados.
- Status: piloto PR #912 concluído somente para consulta; convite, Auth e fases operacionais posteriores fora deste recorte.

17.11 Uso do Catálogo de QA

17.11.1 Objetivo e status
- Objetivo: consulta ao Catálogo de QA em testes autorizados e atualização pontual de valor alterado pelo próprio teste.
- Status: concluído no contrato do Executor; sem QA de produto ou autoridade ampliada.

17.11.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `.agents/skills/lp-factory-executar-plano/SKILL.md`

17.11.3 Contrato de consulta e atualização pontual
- Consulta somente quando teste já autorizado precisar de valor catalogado. Atualiza só registro cujo valor o próprio teste alterou; sem alteração, sem mutação.
- Não autoriza jornada de produto, mailbox, browser, Preview, convite, Auth, recuperação, automação ou infraestrutura.

18. E18 — Base transversal de templates, composições e artefatos
- Objetivo: conteúdo versionado comercial e parâmetros raiz landing_page, sem geração/publicação de LP.
- Status: commercial_activation ativo em E10.7; raiz landing_page repo-only; módulos retirados pela E22.1.5.

18.1 Contrato transversal de conteúdo versionado

18.1.1 Objetivo e status
- Objetivo: separar template, composição, conteúdo validado e artefato publicado.
- Status: commercial_activation implementado; landing_page restrita à raiz 18.4.

18.1.2 Registros do recorte
- Referências:
  - Contrato de banco: `docs/schema.md` — objetos de templates, composições, artefatos e pesquisas.
  - Base técnica: `docs/base-tecnica.md` — limites de runtime server-side e acesso ao Supabase.

18.1.3 Separação de responsabilidades
- Código define/valida estruturas e componentes; banco mantém identidade/versão, elegibilidade, composição, artefatos e proveniência. Registro no banco não cria variante ou componente. Contratos técnicos em docs/base-tecnica.md — 3.15.

18.1.4 Modelo materializado
- Modelo físico em docs/schema.md — 1.14–1.15 e 1.20–1.23. Só commercial_activation tem templates/composição/renderer ativos; landing_page mantém raiz repo-only, sem runtime de LP.

18.2 Base `commercial_activation`

18.2.1 Objetivo e status
- Objetivo: composição v1, validação e renderer de commercial_activation.
- Status: implementado e consumido pela E10.7.

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
- Validação/ordenação por composição em docs/base-tecnica.md — 3.15 e schemas/resolver canônicos. Href somente caminho interno com uma barra inicial ou HTTPS válido.

18.2.4 Catálogo ativo
- Oito seções comerciais fixas E10.7.3, um template e oito módulos v1; variantes registradas no código. Variante determina estrutura/visual; nicho especializa conteúdo/composição, sem nova chave visual automática.

18.2.5 Segurança e limites
- Bundle lido/validado no servidor; service_role com leitura necessária, sem leitura direta anon/authenticated. Operação/proveniência/tracking em E10.7; sem editor visual, A/B, multicanal ou componentes criados pelo banco.

18.3 Consumo pela E10.7

18.3.1 Objetivo e status
- Objetivo: delimitar integração com E10.7.
- Status: ativa; E18 fornece contratos/composição/renderer, E10.7 conteúdo/operação por taxon.

18.3.2 Registros do recorte
- Referências:
  - Jornada e operação comercial: `docs/roadmap.md` — seção 10.7.
  - Contrato de banco: `docs/schema.md` — artefatos de conteúdo e fontes de pesquisa.

18.3.3 Limite de responsabilidade
- Seleção, publicação, fallback, renderização e tracking em E10.7; genérica E10.6 como fallback. Artefato comercial: research_version=1, audience_scope=business_buyer; fontes relacionais compatíveis, contexto adicional em provenance_json. Produto LP retirado; resíduo E19 inerte.

18.4 Parametrização raiz da família `landing_page`

18.4.1 Objetivo e status
- Objetivo: parâmetros editoriais, visuais e responsivos comuns a landing_page.
- Status: raiz v1 hypothesis repo-only; sem validação por LP real.

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
- Registry canônico imutável: balanced padrão ou compact. Resolução/validação estrita, sem fallback, saída congelada e API pública conforme docs/base-tecnica.md — 3.15.2; casos executáveis no código.

18.4.4 Parâmetros mantidos
- Faixas recomendadas/limites absolutos por papel semântico; espaçamento compact/default/spacious; papéis visuais abstratos sem markup/classes/instruções de renderer.
- Critérios v1: mobile-first, viewports de evidência, sem truncamento/scroll horizontal por texto, alvos mínimos, hierarquia semântica e foco visível. Incompatibilidade ou ampliação de limite absoluto exige nova versão raiz.

18.4.5 Limites do recorte
- Sem catálogo de módulos, composição, renderer, persistência ou lifecycle de LP. E19/E20 retirados; Admin só consulta parâmetros, sem promover hypothesis ou criar substitutos.

18.5 Catálogo de módulos e variantes `landing_page` — retirado

18.5.1 Objetivo e status
- Objetivo: delimitar retirada dos módulos/variantes landing_page.
- Status: retirado pela E22.1.5, sem substituto/consumidor.

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
- Boundary/exports/validator removidos; raiz 18.4 preservada, factual E20 encerrado E22.7. Antigo fluxo E19.3 → E19.4 retirado, sem dependência deste catálogo.

19. E19 — legado operacional de Landing Pages retirado
- Objetivo vigente: delimitar resíduos físicos inertes do produto LP retirado.
- Status: produto/geração/apresentação, compatibilidade E20.2 e escrita prospectiva de custos retirados; sem arquitetura substituta antecipada.

19.1 Fronteiras retiradas
- Boundaries lib/lp-builder/ e landing-page/presentation/, workloads de draft/imagem e provas exclusivas removidos. Catálogo independente de modelos de imagem preservado, sem workload ativo. Retiradas E20 encerradas em E22.7.

19.2 Account Dashboard
- Conta active segue E10.11/E11.2, sem desvios por configuração/LP/revisão. Sem rotas de detalhe, configuração, histórico, Preview ou aprovação do produto retirado.

19.3 Estado físico residual
- Tabelas/RPCs, migrations, ponteiro de aprovação, histórico e bucket landing-page-revision-assets permanecem inertes, sem consumidor runtime; estado físico em docs/schema.md. Remoção destrutiva exige recorte próprio.
- E19_5_WORKSPACE_ENABLED só permanece como variável hospedada inativa, sem consumidor ou alteração de plataforma neste recorte.

19.4 Histórico
- Arquitetura e evidências recuperáveis no Git/PRs, sem obrigação vigente.

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
- Conteúdo: cobertura/liberação/avaliação assistida e workload encerrados. CRUD de taxonomia independente em E12.5.3.

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
- Conteúdo: boundaries/consumidores exclusivos removidos; compartilhados preservados só com consumidor independente.

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
- Conteúdo: apply seletivo, retirada dos gates e validação hospedada concluídos; sem retomada do cutover. Migrations imutáveis/dados preservados.

21. E21 — Gestão e governança dos workloads OpenAI
- Objetivo: governar identidade, configuração, observabilidade e custos dos workloads OpenAI.
- Status: configuração/custos ativos; E21.5.6 em Production. Comparação E21.3 pausada; E21.4 histórica/read-only.

21.1 Fundação, normalização e leitura dos workloads OpenAI

21.1.1 Objetivo e status
- Objetivo: catálogo, resolução e telemetria comuns; prompts/schemas/regras permanecem no consumidor.
- Status: implementado; cinco workloads textuais e referência externa Supabase Inspect, sem workload de imagem.

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
- Conteúdo: registry code-owned define identidade/modalidade/consumidor/baseline, rejeitando desconhecidos. Development usa repo_catalog; Preview/Production ativos usam supabase_operational sem fallback silencioso. Configuração governa unidade permitida, não prompts/regras do consumidor; contrato em docs/base-tecnica.md — 3.16.

21.1.4 Integração e observabilidade comum
- Status: vigente.
- Conteúdo: consumidores usam API pública antes do transporte e preservam origem/revisão. Telemetria técnica segura/nullable em docs/base-tecnica.md — 3.16; sem conteúdo protegido ou dinheiro no evento comum. Variáveis legadas não governam execução; workloads retirados só no histórico financeiro.

21.1.5 Inventário administrativo
- Status: implementado.
- Conteúdo: /admin/workloads-openai mostra configuração/origem/revisão, modalidade, consumidor e fallback a platform_admin. Inspect é referência externa não verificada pelo Core; inventário sem consultas OpenAI/GitHub/Vercel ou conteúdo protegido.

21.2 Configuração operacional dinâmica dos workloads OpenAI

21.2.1 Objetivo e status
- Objetivo: candidata → prova → promoção → ativação/rollback humano por ambiente/workload, sem deploy ordinário.
- Status: Preview/Production supabase_operational; Development repo_catalog. Allowlist corrente exclui workloads retirados.

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
- Conteúdo: candidata/revisões/ativações separadas por ambiente/workload; resolução e gates em docs/base-tecnica.md — 3.16. Unidade administrável: modelo/effort textual ou modelo/quality de imagem com consumidor; restante permanece code-owned. Sem cache, Realtime ou segunda residência.

21.2.4 Lifecycle administrativo e estado operacional
- Status: implementado.
- Conteúdo: actions reautorizam platform_admin, derivam ator server-side e validam contexto/versões. Salvar/descartar/provar/promover são explícitos; falha conserva candidata/ativa. Ativação/rollback humanos preservam histórico; conflito sem retry autônomo. Workload retirado não gera nova operação/tracking.

21.2.5 Catálogo administrável e UX
- Status: implementado.
- Conteúdo: catálogo global rege novas candidatas/prova/promoção, preservando ativas e rollback válido. Modelos/Workloads exibem só aba selecionada, linhas compactas e detalhes progressivos; imagem independe de workload ativo. Workloads tem função/configuração/Abrir, ambiente e lifecycle expansível. Leituras completas/fail-closed e acesso exclusivo de platform_admin.

21.2.6 Correção e proteção do catálogo de modelos OpenAI
- Status: concluído e operacional.
- Conteúdo: novo ID confirmado ao vivo na OpenAI, sem inferir efforts; modelo/effort novos nascem indisponíveis. Identidade/modalidade sem duplicação por caixa, concorrência otimista e histórico preservados conforme docs/base-tecnica.md — 3.16. Variantes históricas retiradas não são redisponibilizadas; sem alteração automática de revisão/prova/ativação, descoberta de efforts ou sincronização periódica.

21.3 Evidências e avaliação de custo-benefício

21.3.1 Objetivo e status
- Objetivo: comparar configurações com evidência de qualidade, validade, correção humana, usage, latência, custo e estabilidade.
- Status: pausada, sem laboratório/banco/rota ou baseline automático. Retomada exige decisão humana/revalidação vigente.

21.3.2 Registros do recorte
- Referências:
  - Critérios técnicos e fotografia corrente, sem conteúdo financeiro: `docs/openai-model-snapshot.md`.
  - Preço listado: fonte oficial da OpenAI capturada como evidência focal no momento de eventual retomada; custo real observado: autoridade vigente da E21.5.
  - Contratos de telemetria e configuração: `docs/base-tecnica.md` — seção 3.16.

21.3.3 Condições de retomada
- Comparar workload + modelo + reasoning effort; imagem tem configuração/métricas próprias. Reutilizar telemetria segura e critérios 21.3.1 disponíveis. Sem vencedor universal antes de amostra representativa/aceite humano; sem banco, dashboard, job, agente ou troca automática enquanto pausada.

21.4 Visibilidade financeira e histórico de custos OpenAI

21.4.1 Objetivo e status
- Objetivo: total oficial e série LP congelada, com diferença em Outros gastos / reconciliação.
- Status: operacional em Production, somente leitura; controle ativo em E21.5.

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
- Costs API organizacional governa total do período UTC, sem reconstrução por usage/preço local. Consulta sob demanda; OPENAI_ADMIN_KEY read-only/server-only, separada da chave de execução conforme docs/platform-config.md — 6.3.1. Sem cache, polling, cron, saldo/créditos ou atribuição heurística.

21.4.4 Série histórica congelada de Landing Pages
- Escrita/gate/budget/pricing prospectivos retirados; eventos/cobertura append-only congelados, sem novo produtor/backfill/reconstrução. Gasto oficial não atribuível permanece na reconciliação. OPENAI_LP_COST_TRACKING_ENABLED sem consumidor, sem alteração hospedada neste recorte.

21.4.5 Read model e reconciliação administrativa
- Status: implementado.
- Conteúdo: consulta sob demanda por platform_admin, mesmo período UTC; agregação decimal/paginação integral/fail-closed em docs/base-tecnica.md — 3.16. Detalhe conta → LP → workload, tentativas/pendências/sem preço/cobertura; falha anterior ao início persistido não é individualizada. Diferença sem clamp.
- Limite: RPC materializa/ordena/usa offset, sem snapshot entre páginas ou prova de volume arbitrário/ganho SQL. Sem classificação ampla, câmbio, cobrança, créditos, novos workloads ou reconstrução histórica.

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
- Conteúdo: ACLs somente leitura em docs/schema.md — 1.36/3.10; validators impedem reintrodução de escrita/gate/produtor. Sem backfill, reprecificação/reclassificação, exclusão, alteração do corte, novo produtor/UI ou reescrita de migration aplicada.

21.4.6.4 Gates externos
- Status: concluídos.
- Conteúdo: baseline/corte e ACLs de leitura preservados, RLS sem policies. Admin financeiro único reúne oficial/ativo/histórico/reconciliação; acesso comum bloqueado.

21.5 Controle ativo de custos OpenAI por workload e conta

21.5.1 Objetivo e status
- Objetivo: custo por universo, conta comprovável, workload, evento, execução/operação, modelo/effort, sem alterar oficial/histórico.
- Status: controle ativo e E21.5.6 operacionais em Production; E21.5.7 retirada com E20.

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
  - Ledger e RPCs: `docs/schema.md` — seção 3.11.

21.5.3 Atribuição e evidência por execução
- Status: concluída e ativa nos ambientes comprovados.
- Conteúdo: ledger separado do histórico, execução/operação/retry/replay idempotentes, atribuição explícita e Cliente sem conta comprovada não atribuído. Cinco workloads pelo recorder fail-open; Inspect por ingresso assinado sem credencial mutável de banco. RLS, grants/RPCs/transições e gates em docs/schema.md — 3.11 e docs/platform-config.md — 3.5.

21.5.4 Cálculo e reconciliação de custos
- Status: concluída e vigente.
- Conteúdo: usage/unidades confirmadas, pricing temporal/snapshot, faixas curta/longa e Web Search conforme docs/base-tecnica.md — 3.16. Custo indisponível distinto de zero, sem subtotal parcial enganoso. Keyset e agregação por universo/conta/workload/execução/operação; reconciliação global = oficial − ativo calculável − histórico, sem clamp. Filtro interno não altera oficial/reconciliação.

21.5.5 Visão administrativa de custos
- Status: concluída; QA autenticado positivo/negativo aprovado.
- Conteúdo: superfície única /admin/custos-openai, sob demanda e exclusiva de platform_admin, apresenta fontes/reconciliação E21.5.4, cobertura, não atribuídos, indisponibilidade, retries, modelo/effort e baseline opcional. Leituras paralelas/DTO seguro em docs/base-tecnica.md — 3.16; filtros só alteram projeção ativa. Teclado/foco, nomes acessíveis, estados textuais e responsividade validados, sem alegar WCAG integral.

21.5.6 Visão econômica hierárquica de custos por evento
- Status: concluída e aplicada em Production.
- Conteúdo: universo → responsável econômico → evento → workload → execução/operação; nomes humanos e agregação decimal lossless ativo/legado com indisponibilidade preservada. Identidade só nasce no produtor autorizado; sem vínculo comprovado fica sem correlação, sem inferência por ID técnico/heurística. LP histórica vem da E21.4.
- RPCs v2 canônicas; v1 só por ausência exata das novas, com v2_active/v1_fallback explícito. Sem backfill ou alteração de oficial, reconciliação, cobertura, pricing, filtros e histórico.

21.5.7 Correlação econômica da avaliação de suficiência do catálogo
- Status: retirado com E20 pela E22.7; PR #950 mergeado, sem consumidor.
- Conteúdo: correlação/custos históricos preservados; E21.5.6 governa produtores autorizados, sem reativar avaliação factual.

22. E22 — Retirada controlada de ativos históricos
- Objetivo: retirar ativos sem consumidor, preservando capacidades independentes e sem substituto antecipado.
- Status: E22.1–E22.7 concluídas; política de Previews ainda depende da decisão 22.3.6.

22.1 Retirada de ativos históricos do domínio de Landing Page

22.1.1 Objetivo e status
- Objetivo: retirar perfil, módulos e resolução histórica de LP sem consumidor.
- Status: concluído; retirada de E19/E20 em 22.4–22.7.

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
- Conteúdo: consumo real determina preservação/desacoplamento/remoção; migrations imutáveis, remoções forward-only sem CASCADE. Pesquisas compartilhadas/raiz independentes preservadas.

22.1.4 Perfil de geração retirado
- Status: retirado.
- Conteúdo: perfil e consumidores removidos; duas tabelas/quatro RPCs excluídas, sem substituto. Pesquisas/audit_logs preservados; objetos em 22.1.2.

22.1.5 Catálogo de módulos retirado
- Status: retirado.
- Conteúdo: catálogo/API/validator/UI removidos, sem DDL/substituto; raiz preservada em E18.4/E12.6.

22.1.6 Resolução histórica de pesquisas retirada
- Status: retirado.
- Conteúdo: resolução/adapters/exports/validators/diagnósticos exclusivos removidos; queries antigas retornam à visão válida. Pesquisas compartilhadas preservadas.

22.1.7 Estado consolidado
- Status: concluído.
- Conteúdo: sem imports/rotas/scripts dos boundaries retirados; Admin/OpenAI só consumidores vigentes. Evidência antiga não autoriza reativação.

22.2 Retirada de documentação histórica redundante

22.2.1 Objetivo e status
- Objetivo: remover fontes redundantes, mantendo proveniência recuperável.
- Status: dois documentos excluídos; catálogo Admin reconciliado.

22.2.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `lib/admin/docsCatalog.ts`
- Referências:
  - `docs/lp-planejamento.md` — removido; planejamento corrente pertence ao roadmap e aos planos-base aprovados.
  - `docs/prompt-catalogo-lp.md` — removido; não permanece como fonte operacional.
  - `docs/roadmap.md` — autoridade para estado, dependências e evolução dos casos E*.

22.2.3 Resultado e limites
- Documentos removidos fora do leitor Admin; referências históricas só como proveniência. Roadmap mantém estado/direção, execução segue fluxo vigente; legado no Git. Sem alteração funcional, banco ou infraestrutura.

22.3 Retirada do Supabase Inspect MCP e infraestrutura associada

22.3.1 Objetivo e status
- Objetivo: retirar service/MCP Inspect e infraestrutura exclusiva, preservando Actions e compartilhados.
- Status: concluído; sem service/MCP implantável.

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
- Conteúdo: Core sem dependência MCP; automação Inspect/SQL read-only e SUPABASE_DB_URL_READONLY GitHub preservados. Ingestão financeira independente em E17.1.6; sem substituto MCP/SDK/job.

22.3.4 Retirada do MCP
- Status: retirado.
- Conteúdo: service/workflow Agent Builder removidos. supabase_inspect E21 refere-se à automação GitHub, sem MCP ou verificação de configuração pelo Core.

22.3.5 Retirada da infraestrutura Vercel
- Status: concluída.
- Conteúdo: lpf-10-services e configuração exclusiva removidos; Core lp-factory-10/domínio preservados.

22.3.6 Limite operacional remanescente
- Status: pendente de decisão.
- Conteúdo: vercel.json só desliga deploy automático de docs/**; implementação ainda gera Preview por push. Nova política exige recorte próprio, preservando Production automática da main e Previews necessários.

22.4 Retirada da geração e do produto operacional legado de Landing Page

22.4.1 Objetivo e status
- Objetivo: retirar geração/produto LP legado, preservando independentes.
- Status: concluído; banco, migrations, dados e Storage preservados.

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
- Conteúdo: geração/contexto/conhecimento, candidata textual/imagem, binding, revisão, upload/append e consumidores exclusivos removidos.

22.4.4 Capacidades preservadas
- Status: vigente.
- Conteúdo: raiz/pesquisas compartilhadas independentes preservadas; resíduo físico E19.3 inerte. Nova escrita/leitura de produto/limpeza exige decisão própria; retiradas posteriores em 22.5/22.7.

22.4.5 Produto operacional retirado no SV-PR03
- Status: retirado.
- Conteúdo: configuração/drafts/workspace/revisão/materialização e rotas LP removidos, sem substitutos/redirects. Jornada E10.11 e resíduo E19.3.

22.5 Retirada do residual E19 e da compatibilidade com E20.2

22.5.1 Objetivo e status
- Objetivo: eliminar fronteiras exclusivas E19 remanescentes.
- Status: concluído; sem banco, dados, Storage ou plataforma alterados.

22.5.2 Resultado
- Status: concluído.
- Conteúdo: resultado E19.1; escrita prospectiva E21.4 retirada, Costs API/histórico congelado preservados. Configurações/revisões/ativações antigas inertes.

22.5.3 Capacidades preservadas
- Status: vigente.
- Conteúdo: framework OpenAI, Inspect e catálogo independente de imagem E21 preservados. Factual encerrado em 22.7; resíduo E19.3 sem autorização de limpeza.

22.6 Remoção do Validador Final e automações adjacentes

22.6.1 Objetivo e status
- Objetivo: retirar Validador Final/Niche Runtime Tests e exclusivos, preservando produto, CI, mailbox e dados.
- Status: concluído só no repositório, sem substituto ou alteração de banco/plataforma.

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
- Dois workflows/subprojetos e verificador exclusivo removidos; não eram gate/script raiz/dependência Core. Inspect e demais consumidores/workflows preservados.
- Usuários, contas, memberships, sessões, dados e evidências preservados. Runs/logs/artifacts são suplementares e expiram; diff/PR e fontes canônicas mantêm prova durável.

22.7 Retirada terminal da E20 e E10.10

22.7.1 Objetivo e status
- Objetivo: retirar E20/E10.10 sem segunda autoridade factual nem dano aos domínios independentes.
- Status: retirada funcional, apply seletivo e gates validados em Preview/Production; dependência E10.11 concluída.

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
- Conteúdo: exclusivos removidos; Pending Setup, E10.11, taxonomia, pesquisas estruturadas e comercial independentes preservados.

22.7.4 Retirada dos caminhos funcionais
- Status: mergeado e validado após apply/redeploy.
- Conteúdo:
  - E10.10 e factual E20 encerrados: catálogo, cobertura, seleção, avaliação/liberação e workload exclusivos. Jornada vigente E10.11, CRUD E12.5.3.
  - Taxonomia/aliases/resolução/vínculos, pesquisas/objetos/insumos compartilhados e domínios E9/E10/E11 preservados por consumo real, especialmente E10.7; sem autoridade factual, herança ou transferência de pesquisas à Base.
  - Sem redesenho/refatoração dos preservados, substituto, compatibilidade paralela, archive funcional, snapshot vivo ou nova infraestrutura. Associação à E20/E10.10 não autoriza remover capacidade/dado/objeto.

22.7.5 Retirada material residual de banco e configuração
- Status: aplicado e validado.
- Conteúdo: dados/revisões/ativações históricos preservados; FK/acessos exclusivos/unidades mutáveis factuais retirados, UPDATE da seleção revogado. Gates E20 retirados de Preview/Production conforme plataforma. Duas migrations E10.10 não aplicadas permanecem excluídas do apply; históricas imutáveis. Resíduos/compartilhados preservados, exclusão destrutiva exige decisão própria.

23. E23 — Segurança e governança transversal da plataforma
- Objetivo: segurança/governança por recortes controlados.
- Status: E23.1–E23.5 concluídas; levantamento E23.6 encerrado em 14/10/2026 com Next.js/TLS global inconclusivos, sem remediação presumida.

23.1 Atualização de segurança do Next.js

23.1.1 Objetivo e status
- Objetivo: atualizar Next.js vulnerável preservando jornadas.
- Status: concluído; sem mudança funcional intencional.

23.1.2 Registros do recorte
- Repositório:
  - Ajustados:
    - `package.json`
    - `package-lock.json`
- Updates:
  - Aplicados:
    - `vercel#31`

23.1.3 Atualização segura e validação do Core
- Status: concluído; versão sucedida pela E23.4.
- Conteúdo: atualização sem recursos opcionais/mudança de jornada; sem QA Production pendente neste registro. Estado/limites em E23.4/E23.6.

23.2 Classificação segura das variáveis Vercel

23.2.1 Objetivo e status
- Objetivo: classificar Config/Secret sem exposição ou mudança de consumidores/ambientes.
- Status: concluído; sobreclassificações conservadoras aceitas.

23.2.2 Registros do recorte
- Updates:
  - Aplicados:
    - `vercel#32`.
- Referências:
  - Classificação efetiva e estado operacional: `docs/platform-config.md` — seção 3.6.

23.2.3 Inspeção e reconciliação segura das classificações
- Status: concluída.
- Conteúdo: inspeção de nomes/tipos/ambientes/scopes, sem valores. Credenciais Secret, não sensíveis Config; sobreclassificações/scopes legados preservados sem risco/impacto material demonstrado. Estado em plataforma 3.6; Inspect/GitHub read-only preservados, callback de convite em E11.1.4.

23.3 Retenção proporcional das evidências GitHub Actions

23.3.1 Objetivo e status
- Objetivo: fechamento verificável após expiração de evidências Actions.
- Status: concluído documentalmente; sem configuração/runtime alterados.

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
- Conteúdo: política durável/expiração em docs/base-tecnica.md — 3.4; retenção em plataforma 2.2. Sem exportação recorrente/storage paralelo/job. Preservação bruta além da janela exige decisão do Gestor de Automações e humano.

23.4 Atualização de segurança do Next.js — setembro de 2026

23.4.1 Objetivo e status
- Objetivo: alinhar next/eslint-config-next/lockfile na release de segurança 16.3.8.
- Status: concluído em Production, jornadas preservadas.

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
- Conteúdo: next/eslint-config-next 16.3.8; React, demais dependências e produto preservados. Sete correções incorporadas, duas vulnerabilidades adicionais crítica/alta sob acompanhamento vercel#34; sem remediação total demonstrada. Diagnóstico vigente E23.6.

23.5 Retirada da capacidade GraphQL não utilizada

23.5.1 Objetivo e status
- Objetivo: retirar GraphQL sem uso, preservando REST/Auth/banco/RLS/jornadas.
- Status: apply seletivo/Production validados.

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
- Conteúdo: retirada transacional/idempotente bloqueia dependente inesperado atomicamente. Stub público desabilitado, sem dados GraphQL; owners/grants gerenciados e demais metadados/policies/ACLs preservados, conforme schema 6.2. Sem infraestrutura nova.

23.6 Diagnóstico de segurança Next.js e compatibilidade TLS Supabase

23.6.1 Objetivo e status
- Objetivo: diagnóstico delimitado dos avisos Next.js/TLS, separando prova e incerteza.
- Status: levantamento PB 18D.1 aprovado em 14/10/2026 sob Supervisão Autônomo; aplicabilidade Next.js/TLS global inconclusivos, sem prova de ausência de impacto/remediação.
- Limites: somente leitura, sem mudanças operacionais, exploração, redução de segurança ou custo adicional. Sem coleta/inventário/suporte pendentes nesta rodada; correção exige recorte/autorização próprios.

23.6.2 Registros do recorte
- Referências:
  - Saldo Next.js, prioridade e gatilho de retomada: `docs/vercel-up.md` — `vercel#34`.
  - Saldo TLS, prioridade e gatilhos de retomada: `docs/supa-up.md` — `supa#73`.
  - Diagnóstico delimitado final e evidências: [PR #1067 — resultado final](https://github.com/AlcinoAfonso/LP-Factory-10/pull/1067#issuecomment-6173085395); [provas técnicas TLS](https://github.com/AlcinoAfonso/LP-Factory-10/pull/1067#issuecomment-6170466774).

23.6.3 Diagnóstico delimitado dos avisos Next.js
- Status: levantamento encerrado em 14/10/2026, aplicabilidade inconclusiva.
- Conteúdo: fontes oficiais acessíveis não forneceram advisories completos/faixas afetadas/corrigidas, sem provar inexistência global. Baseline next/eslint-config-next 16.3.8 e React/DOM 19.2.1 confrontado com App Router/SSR/RSC/Actions; nenhum consumidor OG identificado, sem excluir falhas ainda não descritas. Sem investigação de exploração ou versão de correção determinada. Retomada por advisories completos em vercel#34, sem upgrade autorizado ou espera indefinida.

23.6.4 Diagnóstico delimitado da mudança TLS Supabase
- Status: levantamento encerrado em 14/10/2026; compatibilidade provada só no processo Node local inspecionado.
- Conteúdo:
  - Retirada anunciada de quatro cifras CBC nas APIs HTTP Auth/Data API/Storage; não abrange Postgres direto, pooler ou Management API.
  - Vercel Node 22.x e ausência de customização TLS no código confirmados; capacidade/configuração efetiva Functions/middleware Preview/Production não demonstrada pela prova local.
  - Browser/SO sem combinação concreta para conclusão; integrações HTTP externas não identificadas nas fontes consultadas, existência fora delas não confirmada.
  - Nenhuma incompatibilidade/correção comprovada. Gatilhos no supa#73; sem novas provas exigidas para encerrar rodada ou inferência de compatibilidade global.

24. E24 — Governança e compatibilidade transversal de updates
- Objetivo: updates rastreáveis e sem custo incremental, com operação em recortes próprios.
- Status: E24.1/E24.2 implementadas/validadas no repositório sob supervisão Autônoma.

24.1 Governança e cobertura do workflow de updates

24.1.1 Objetivo e status
- Objetivo: governança uniforme, identificação de rodadas e cobertura OpenAI no workflow semanal.
- Status: implementado, sem novo catálogo/agente/infraestrutura ou runtime de produto.

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
- Identidade updates-AAAA-MM-DD-rNN, deduplicação de drafts, estado open/completed e reserva remota sem mudança artificial conforme docs/workflow-atualizacao-updates.md — 1–6.
- Ativo mantém saldo, prioridade, motivo, gatilho/encerramento; integralmente validado vai ao histórico compacto. Recomendação exige zero custo incremental comprovado nos planos vigentes; upgrade/cobrança/gratuidade não validada fica no radar, sem implementação autorizada.

24.1.4 Cobertura semanal OpenAI e responsabilidades
- Quatro catálogos na ordem vigente, depois snapshot técnico OpenAI, sem quinto catálogo. Workflow descobre fontes oficiais amplamente; Gestor de Updates consulta snapshot quando pertinente, sem mantê-lo; Gestor de Automações consome capacidades e valida fatos focais. supa#60 só consulta manual ao changelog, sem feed consumidor.

24.1.5 Snapshot técnico OpenAI
- Snapshot técnico itemizado/rastreável conforme fonte 24.1.2, sem valores/fórmulas/gráfico/protocolo/laboratório financeiros ou substituto. Configuração efetiva em plataforma; registro de capacidade não autoriza adoção.

24.1.6 Validação do workflow atualizado
- Status: validado.
- Conteúdo: TOML preserva modelo/effort/sandbox; snapshot técnico e workflow seguem fontes 24.1.2.

24.2 Compatibilidade operacional e evidências temporárias

24.2.1 Objetivo e status
- Objetivo: compatibilidade Ubuntu 26.04, evidências Hobby expiráveis e leitura manual de Health Advisors, sem custo incremental.
- Status: validado no repositório; sem mudança permanente de runner/workflow/runtime/banco/dependência/deployment/plano/infraestrutura.

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
- Status: compatibilidade representativa validada.
- Conteúdo: Ubuntu 26.04 com Bash/grep, checkout, Node 20 das automações, Node 22/build/checks Core e Supabase CLI 2.106.0; prova sem secrets/chamadas externas/mutações. Harness removido, ubuntu-latest preservado sem pin preventivo.

24.2.4 Evidências temporárias da Vercel
- Preview/deployment histórico são provas suplementares expiráveis; encerramento durável segue docs/base-tecnica.md — 3.4. Sem storage paralelo, proteção rotineira ou upgrade.

24.2.5 Leitura manual dos Health Check Advisors
- Status: procedimento vigente.
- Conteúdo: refresh/leitura manual Studio → Advisors → Health em plataforma 4.9. Resultado vazio válido difere de advisor_check_unavailable; achado exige investigação, sem correção automática.

24.2.6 Ciclo de vida dos itens da rodada
- Status: rodada encerrada.
- Conteúdo: aplicados em 24.2.2; vercel#21 excluído por storage paralelo, supa#70 futuro condicionado a recorrência/superioridade comprovadas. Sem ativação/contratação com custo incremental.

25. E25 — Base de Comunicação
- Objetivo: Base persistente da conta, com verdade da empresa e inteligência de comunicação, independente de LP/canal.
- Status: E25.1/E25.3 em Preview/Production; E25.2 implementada. PB2/PB3 em definição, sem execução autorizada.

25.1 Base de Comunicação inicial

25.1.1 Objetivo e status
- Objetivo: Base única atual/editável/progressiva por conta com autorização comercial, sem depender de E10.10/E20, taxon ou PB-B/PB-C.
- Status: operacional em Preview/Production com gate por ambiente; QA provider-backed/telemetria E21 concluídos. Baixa pertinência de fontes Web é limite aceito, sujeito a revisão humana.

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
- Conteúdo: conta é única proprietária; owner/admin/editor editam, viewer consulta, sob Access Context/membership/entitlement vigente. Novas seções de formatos suportados preservam conteúdo existente. Insumos/consumidores não criam proprietários, vínculos persistentes ou dependências de leitura/edição. Sem segunda autoridade factual, Base por insumo/consumidor, versão funcional selecionável ou framework arbitrário.

25.1.4 Etapa 1 e aproveitamento inicial
- Status: implementado, assistência provider-backed sem Web Search validada.
- Conteúdo:
  - Verdade começa por nome público/atuação e evolui por Negócio, Ofertas, Atendimento, Provas/credenciais/resultados, Materiais/identidade e Preferências/limites; incompletude não bloqueia globalmente. Cópia inicial consentida/inequívoca E10.11, sem sincronização reversa.
  - Orientação/exemplos/placeholders/validações previsíveis são determinísticos quando suficientes. Assistência explícita e com ganho real explica, exemplifica, organiza, resume/reformula conteúdo fornecido; não usa Web Search, não propõe valor factual ausente, não confirma em nome do cliente e não dispara na edição manual. Cliente fornece/confirma valores; ausência vira pergunta localizada/pendência. Falha IA preserva edição manual.

25.1.5 Etapa 2 e inteligência de comunicação
- Status: implementado; par operacional gpt-6-luna/max, comparado isoladamente com gpt-6-sol/medium.
- Conteúdo:
  - IA interpreta mercado/produz comunicação editável com insumos confirmados pertinentes da Etapa 1. Web Search atual quando atualidade/localidade material; falha de pesquisa material não vira conhecimento paramétrico silenciosamente. Distingue fato particular de hipótese estratégica; revisão/edição humanas sem aprovação por chamada, sem vínculo persistente com pesquisa.
  - Sete seções: Quem somos, Público/contexto, Dores/desejos/crenças/objeções, Proposta de valor, Benefícios, Diferenciais e FAQ. Ação geral gera todas quando vazias/atualiza conjunto pertinente quando preenchidas; revisão localizada por seção. Salvo da Etapa 2 só contextualiza alvo, sem autoridade factual; sugestão não salva automaticamente, edição manual não dispara IA.
  - Sem LP/outro produto, canal, mudança de Pending Setup/jornada/comercial/trial, Agents SDK/multiagente/job/fila ou infraestrutura antecipada. Sem carteira/saldo/franquia/bloqueio comercial IA; créditos transversais pertencem ao Debate 10B.

25.2 Experiência de cliente da Base de Comunicação

25.2.1 Objetivo e status
- Objetivo: consulta/edição claras e progressivas.
- Status: implementado; acesso/persistência/metodologia preservados.

25.2.2 Registros do recorte
- Repositório:
  - Criados:
    - `app/a/[account]/base-comunicacao/_components/CommunicationSectionCollection.tsx`
    - `app/a/[account]/base-comunicacao/_components/section-edit-state.ts`
    - `app/a/[account]/base-comunicacao/_components/section-edit-state.validation.ts`
  - Ajustados: `app/a/[account]/base-comunicacao/page.tsx`, `app/a/[account]/base-comunicacao/CommunicationSectionEditor.tsx`.

25.2.3 Coleção tabular, abertura de detalhe e edição da Base
- Status: implementado.
- Conteúdo: aba mostra coleção selecionada com identidade/estado/Abrir; três categorias E25.3, gate desligado conserva duas anteriores. Dialog abre uma seção editável para owner/admin/editor com Salvar/Cancelar; viewer lê. Parser detecta alterações materiais/rascunho inválido, saída com perda exige confirmação. Salva com locks/versões, mantém detalhe no sucesso/rascunho no conflito. Cancelar/Fechar/Escape/backdrop/Voltar mantêm coleção e devolvem foco.

25.2.4 Estados, assistência por IA, responsividade e validação da experiência
- Status: implementado.
- Conteúdo: feedback junto à ação; fontes progressivas/sugestões separadas do salvo, instaladas só no rascunho. Exclusão mútua e revisão/versão impedem reinstalar resposta superada por descarte/save. Teclado/foco, altura reduzida, alvos 44 px e reflow desde 320 px; sem prova de teclado virtual real/WCAG integral ou ampliação de acesso para QA.

25.3 Recursos das três categorias da Base de Comunicação

25.3.1 Objetivo e status
- Objetivo: recursos manuais de Dados do negócio, Materiais de comunicação e Inteligência e copy na Base única, preservando legado/acesso/papéis/concorrência/revisão/assistências.
- Status: PB1/D14D operacional em Preview/Production.
- Limites: PB2/PB3 em definição; sem novos agentes/rotinas IA, pesquisa, processamento/transcrição de mídia, publicação automática ou canais. E25.1/PB-A e E25.2 não reabertos.

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
- Status: operacional em Preview/Production.
- Conteúdo:
  - Dados: rótulo/valor opcionais, vazios permitidos; nome público canônico no cabeçalho. Inicial: Identificação e dados do negócio.
  - Sete seções de Inteligência e copy preservam formatos/conteúdo/parágrafos/quebras/delimitadores de itens/FAQ; novas seções manuais. Assistências mantêm seleção/revisão/versão e instalação explícita no editor, sem salvar sugestão automaticamente.
  - Bases antigas/novas preservam permissões E25.1.3, isolamento, descarte/retomada; conflito mantém rascunho, descarte mantém salvo/devolve foco. Teclado/foco/mobile e FAQ com alvo 44 px.

25.3.4 Materiais de comunicação
- Status: operacional em Preview/Production.
- Conteúdo:
  - Acervo: Identidade visual; Fotos, vídeos e áudios; Depoimentos e provas sociais. Identificação/contexto/autoria/autorização quando pertinentes. Imagem/logo por upload/link; vídeo/áudio só link; depoimento escrito em texto. Consulta/edição/substituição/retirada preservam legado/produtos publicados.
  - Storage privado distinto do legado, imagem validada no servidor e acesso temporário após autorização vigente. Inválido/acima do limite rejeitado sem escrita; erro mantém formulário/arquivo para retry. Link indisponível tratado sem alterar Base; descarte preserva salvo. Contrato físico/limites em docs/schema.md — 1.39.

25.3.5 Gestão administrativa de seções
- Status: operacional em Preview/Production.
- Conteúdo:
  - Admin autorizado adiciona/renomeia/reordena nas três categorias; sem autoridade, ação recusada. Identidades/categorias/formatos/salvos preservados; novas seções vazias/opcionais para Bases antigas/futuras, sem retroescrita/exclusão de seção.
  - Inclusão global aceita por prova isolada com rollback/projeção em Base antiga/vazia; sem prova autenticada persistente de inclusão. SQL não substitui Auth/Storage/UI.
  - Gate independente desligado mantém runtime anterior; progressão exige autorização vigente. Apply seletivo não reativa fluxo integral suspenso.

28/06/2026 — Plano-base E9
Fontes: chat, docs/roadmap.md, docs/prompt-estrategista.md

1. Estado e decisões fixas

* E9 define elegibilidade comercial para criar LPs.
* E9 libera apenas o gate/elegibilidade comercial; não implementa LP Builder nem fluxo visual de criação de LPs.
* Conta active não fica elegível apenas por estar ativa.
* Entitlement comercial não substitui bloqueios de conta, membership ou status operacional.
* Elegibilidade nasce de origem comercial válida: plano pago confirmado ou, futuramente, trial concedido.
* Recorte inicial: cards pagos Starter, Lite, Pro e Ultra + checkout confirmado.
* Usar a nomenclatura canônica dos planos vigente no projeto; se houver diferença entre Start e Starter, resolver antes da implementação do checkout.
* Provedor de checkout entra como subseção futura E9.xx.
* Trial automático/manual entra como subseção futura E9.xx.
* Ajuste de valores pertence a E12.xx, por ser operação administrativa no Admin Dashboard.

2. Contrato do caso

* Usuário clica em Starter, Lite, Pro ou Ultra.
* Sistema inicia checkout no provedor escolhido.
* Provedor confirma pagamento/assinatura por webhook.
* Sistema valida evento, conta, plano, status e idempotência.
* Sistema persiste entitlement comercial.
* Account Dashboard libera criação de LPs somente após confirmação válida.
* Sem confirmação válida, conta permanece sem elegibilidade produtiva.

3. Fases e próxima ação

* Fase 1 — Contrato interno de elegibilidade: definir origem comercial, status, consumo pelo Account Dashboard e necessidade estrutural mínima de persistência.

3.1 Detalhamento da Fase 1 — Contrato interno de elegibilidade

* Objetivo: definir o contrato mínimo que decide quando uma conta pode acessar o gate comercial de criação de LPs.
* Resultado esperado: contrato conceitual aprovado, sem checkout, sem webhook, sem migration e sem alteração de runtime.
* Investigar: lógica atual de conta ativa, membership, Account Dashboard, plans, trial, permissões e bloqueios existentes.
* Definir: origens comerciais válidas, status conceituais, bloqueios independentes, consumo pelo Account Dashboard e dados mínimos necessários para fases futuras.
* Regra central: conta precisa estar em estado operacional permitido, membership precisa permitir acesso e entitlement comercial precisa estar válido.
* Origem inicial: plano pago confirmado.
* Origens futuras: trial e liberação manual; provedor de checkout e webhook ficam como mecanismos futuros de confirmação e persistência.
* Status conceituais esperados: sem_entitlement, pendente_confirmacao, ativo, expirado, cancelado e bloqueado_operacionalmente.
* Os nomes são conceituais; antes da implementação, verificar se já existe nomenclatura canônica no projeto.
* Não implementar checkout, provedor, webhook, migration, tabela, RPC, policy, grant, constraint, Account Dashboard, cards, LP Builder ou tela admin.
* Parar se a investigação exigir mudança de banco, runtime, arquitetura, cards da E10.7 ou mutação administrativa da E12 antes de nova decisão estratégica.
* Entrega esperada da Fase 1: investigação resumida, arquivos consultados, contrato interno proposto, riscos, lacunas e validação documental.

3.1.1 Investigação da Fase 1 — proposta de contrato interno

Arquivos consultados:

* `AGENTS.md`
* `docs/prompt-executor.md`
* `docs/lousa-plano-base-e9.md`
* `docs/roadmap.md`
* `docs/schema.md`
* `docs/base-tecnica.md`
* `lib/types/status.ts`
* `lib/access/types.ts`
* `lib/access/getAccessContext.ts`
* `lib/access/adapters/accessContextAdapter.ts`
* `lib/access/adapters/accountAdapter.ts`
* `lib/access/plan.ts`
* `app/a/[account]/page.tsx`
* `app/a/[account]/_content/commercial-page/generic-v1.ts`
* `app/a/[account]/_components/commercial-page/actions.ts`
* `lib/conversion-content/commercial-activation/draft-generation.ts`
* `supabase/snippets/e10_7_phase_2_draft_verify.sql`
* `supabase/migrations/20260621194501_e10_7_normalize_lite_plan_name.sql`

Estado encontrado:

* `accounts.status` canônico: `pending_setup`, `active`, `inactive`, `suspended`; `trial` não é status de conta.
* `account_users.status` canônico: `pending`, `active`, `inactive`, `revoked`.
* `v_access_context_v2` libera acesso operacional somente para conta `active` ou `pending_setup` com membership `active`.
* O Account Dashboard em `/a/[account]` trata `pending_setup` como onboarding, bloqueia estados diferentes de `active` para página comercial e renderiza a página comercial somente para conta `active`.
* Eventos da página comercial também exigem `ctx` não bloqueado e `ctx.account.status === "active"`.
* `public.plans` é fonte canônica parcial para `name`, `price_monthly`, `max_lps`, `max_conversions` e `features`; não é fonte suficiente para checkout, descontos, garantias, promoções, URLs oficiais ou condição comercial completa.
* A nomenclatura operacional mais recente de planos comerciais é `Starter`, `Lite`, `Pro` e `Ultra`, com chaves `starter`, `lite`, `pro` e `ultra`; `Light` foi normalizado para `Lite`. O termo `Start` do plano-base conflita com `Starter` e deve ser decidido antes do checkout.
* Existe código legado em `lib/access/plan.ts` com `PlanId = "free" | "light" | "pro" | "ultra"` e placeholders de Stripe; isso não deve ser usado como contrato E9 sem revisão, pois diverge de `Lite` e dos cards atuais.

Contrato interno proposto:

* A elegibilidade produtiva para criação de LP deve ser uma decisão derivada, não um substituto de `accounts.status` ou `account_users.status`.
* A regra mínima é: conta operacionalmente permitida, membership ativo e entitlement comercial válido.
* Para o gate de criação de LP, conta operacionalmente permitida deve significar `accounts.status = active`; `pending_setup` continua permitido apenas para onboarding/acesso operacional inicial, não para criação produtiva.
* Membership válido deve significar `account_users.status = active`; papéis e permissões por ação podem restringir edição/publicação em fase própria, mas não substituem a exigência de entitlement.
* Entitlement comercial válido, no recorte inicial, nasce de plano pago confirmado e idempotentemente persistido por fase futura.
* O Account Dashboard deve consumir um sinal explícito de elegibilidade comercial antes de liberar criação de LP; até esse sinal existir, conta `active` pode exibir conversão/página comercial, mas não deve ser considerada elegível para criação produtiva apenas por estar `active`.

Origens comerciais:

* Origem inicial válida: `plano_pago_confirmado`.
* Origens futuras possíveis: `trial` e `liberacao_manual`.
* Confirmação por provedor/webhook é mecanismo de confirmação e persistência, não origem comercial.

Status conceituais:

* `sem_entitlement`: conta operacionalmente acessível, mas sem sinal comercial válido.
* `pendente_confirmacao`: checkout, assinatura ou liberação iniciada, ainda sem confirmação válida.
* `ativo`: entitlement confirmado, vigente e consumível pelo gate.
* `expirado`: entitlement com vigência encerrada.
* `cancelado`: entitlement encerrado por cancelamento ou churn.
* `bloqueado_operacionalmente`: estado derivado quando conta ou membership bloqueiam o acesso, mesmo que exista histórico comercial.

Dados mínimos para fases futuras:

* `account_id`
* chave canônica do plano (`starter`/`lite`/`pro`/`ultra`) e nome exibido vigente no momento da confirmação
* origem comercial
* status conceitual do entitlement
* data de início, data de confirmação e data de expiração ou fim, quando aplicável
* identificadores do provedor, assinatura, checkout, invoice ou evento, quando houver provedor
* chave de idempotência do evento de confirmação
* trilha de auditoria operacional sem PII sensível

Riscos, lacunas e conflitos:

* Manter `Starter`/`starter` como nomenclatura canônica antes da fase de checkout.
* Revisar ou aposentar o `PlanId` legado `light` antes de qualquer integração de checkout, porque ele conflita com `Lite`/`lite`.
* Definir em fase própria se o status conceitual será persistido em tabela nova, view, RPC ou outro contrato; esta Fase 1 não cria banco.
* Definir em fase própria como papéis (`owner`, `admin`, `editor`, `viewer`) afetam criação, edição e publicação de LPs.
* Definir em fase própria se `bloqueado_operacionalmente` será apenas status derivado de consumo ou se haverá materialização para relatório.
* Não usar `accounts.plan_id` nem `public.plans` isoladamente como prova de elegibilidade comercial.
* Não alterar E10.7, Account Dashboard, cards, schema ou runtime nesta fase.

3.2 Fase 2 — Modelo mínimo de entitlement comercial

* Objetivo: definir o contrato mínimo de persistência e consulta do entitlement comercial.
* Resultado esperado: contrato técnico mínimo aprovado para persistência e consulta futura do entitlement comercial, sem implementação de banco, runtime ou dashboard nesta fase.
* Gatilho: conta `active` com membership ativo chega ao futuro gate de criação de LP.
* Entrada: conta, membership, plano canônico, origem comercial, status conceitual, vigência e referência de confirmação futura.
* Processamento: resolver se existe entitlement comercial válido para a conta.
* Validação: conta `active`, membership `active`, origem comercial aceita, status válido, vigência válida, plano canônico e ausência de bloqueio operacional.
* Modelo mínimo de persistência a definir para fase futura: `account_id`, plano canônico, origem comercial, status, vigência, referência externa futura, chave de idempotência futura e trilha operacional sem PII sensível.
* Consumo: Account Dashboard deve consultar server-side o sinal de entitlement antes de liberar gate de criação de LP.
* Fallback: sem entitlement válido, conta permanece sem elegibilidade produtiva e continua na experiência comercial/persuasiva.
* Próxima ação: usar o contrato técnico abaixo como base para uma fase futura de schema/runtime, sem implementar banco/runtime nesta fase.

3.2.1 Resultado da Fase 2 — contrato técnico mínimo

Arquivos consultados:

* `AGENTS.md`
* `docs/prompt-executor.md`
* `docs/lousa-plano-base-e9.md`
* `docs/roadmap.md`
* `docs/schema.md`
* `docs/base-tecnica.md`
* `lib/types/status.ts`
* `lib/access/getAccessContext.ts`
* `lib/access/adapters/accessContextAdapter.ts`
* `lib/access/plan.ts`
* `app/a/[account]/page.tsx`
* `app/a/[account]/_components/commercial-page/actions.ts`

Decisões recomendadas:

* Camada: domínio transversal do Core, consumido inicialmente pelo Account Dashboard server-side.
* Boundary: entitlement comercial deve ser domínio próprio. Não é extensão de `lib/access`, porque `access` decide acesso operacional user-conta; não é extensão de `lib/access/plan.ts` ou `public.plans`, porque `plans` é fonte parcial de metadados e não prova condição comercial.
* Path canônico provável para fase futura: `lib/commercial-entitlements/`. O path ainda não existe; ele é preferível para não misturar elegibilidade comercial com `lib/access/` nem com `lib/conversion-content/commercial-activation/`, que trata conteúdo comercial publicado/renderizado.
* Consumidor inicial: rota server-side do Account Dashboard, depois de `getAccessContext` confirmar conta `active` e membership ativo, antes de liberar gate produtivo de criação de LP.
* Objeto de banco futuro: combinação mínima de tabela fonte de verdade + consulta server-side efetiva. A tabela guarda o histórico/estado do entitlement por conta; uma view ou RPC de leitura calcula o entitlement efetivo para consumo do Account Dashboard.

Objeto conceitual mínimo futuro:

* Fonte de verdade provável: tabela `commercial_entitlements` ou `account_commercial_entitlements`, a nomear em fase de schema.
* Leitura efetiva provável: view ou RPC server-side como `get_account_commercial_entitlement(account_id)` ou equivalente, a definir em fase de schema.
* Campos mínimos: `account_id`, `plan_key`, `plan_name_snapshot`, `origin`, `status`, `starts_at`, `confirmed_at`, `expires_at`, `canceled_at`, `external_provider`, `external_reference`, `idempotency_key`, `created_at`, `updated_at`.
* `plan_key` deve usar a nomenclatura canônica `starter`, `lite`, `pro` e `ultra`; `plan_name_snapshot` preserva o nome exibido no momento da confirmação.
* `origin` deve representar a origem comercial: `plano_pago_confirmado` no recorte inicial; `trial` e `liberacao_manual` como origens futuras.
* Provedor, checkout, webhook, assinatura, invoice e evento externo devem entrar como mecanismo/referência de confirmação e persistência, não como origem comercial.
* `status` deve representar apenas o estado comercial do entitlement: `pendente_confirmacao`, `ativo`, `expirado` e `cancelado`. `sem_entitlement` e `bloqueado_operacionalmente` devem ser resultados derivados de consulta, não necessariamente linhas persistidas.
* Vigência deve ser calculada a partir de `starts_at`, `confirmed_at`, `expires_at` e `canceled_at`; entitlement efetivo exige status `ativo` e vigência válida.
* Idempotência deve ser representada por chave estável de confirmação, preferencialmente única por provedor/evento/conta quando houver provedor.

Regras de consulta propostas:

* Pré-condição operacional: `accounts.status = active` e `account_users.status = active`, confirmadas pelo fluxo de access existente.
* Consulta comercial: buscar entitlement efetivo da conta em leitura server-side.
* Resultado `elegível`: conta operacionalmente permitida, membership ativo, entitlement `ativo`, vigência válida e plano canônico reconhecido.
* Resultado `não elegível`: ausência de entitlement, status não ativo, vigência encerrada, cancelamento, plano não canônico ou bloqueio operacional externo.
* `accounts.status`, `account_users.status`, `accounts.plan_id`, `public.plans` e `v_account_effective_limits` não devem isoladamente liberar criação produtiva de LP.

Riscos e lacunas:

* A fase de schema deve decidir nomes finais de tabela, view/RPC, constraints, índices, RLS, grants e política de unicidade/idempotência.
* A fase de runtime deve decidir se o consumo expõe boolean simples, objeto detalhado ou ambos para o Account Dashboard.
* A relação com o item antigo de grants E9 em `docs/base-tecnica.md` precisa ser revisada antes de reutilizar `get_feature(account_id, feature_key)`, porque o contrato atual da Fase 2 separa entitlement comercial de liberação genérica de feature.
* `lib/access/plan.ts` ainda contém `PlanId = "free" | "light" | "pro" | "ultra"` e placeholders de Stripe; isso deve ser revisado ou aposentado antes de qualquer checkout.
* Não houve decisão de provedor, webhook, trial operacional, liberação manual operacional, schema ou runtime nesta fase.

Governança da Fase 2:

* Analista: avaliar lacunas, contradições, riscos, escopo e clareza.
* Gestor Estrutural: avaliar boundary, persistência, schema, acoplamento, regressão e consumo server-side.
* Gestor de Updates: avaliar aderência a updates aplicáveis, especialmente supa#5, supa#36, supa#40 e supa#58.
* Gestor de Automação: N/A neste recorte, porque ainda não há webhook, job, rotina, monitoramento ou execução recorrente.

Limites da Fase 2:

* Não escolher provedor de checkout.
* Não implementar checkout.
* Não criar webhook.
* Não criar migration.
* Não criar tabela, view, RPC, policy, grant, constraint ou trigger.
* Não alterar Account Dashboard.
* Não alterar cards da E10.7.
* Não criar LP Builder.
* Não criar tela admin.
* Não implementar trial operacional.
* Não implementar liberação manual operacional.
* Não transformar E9 em Billing Engine completo.

3.3 Fases futuras e próxima ação

* E9.xx futuro — Provedor de checkout: escolher e integrar primeiro provedor para cards pagos.
* E9.xx futuro — Webhook e persistência: validar confirmação, idempotência e registro de entitlement comercial.
* E9.xx futuro — Consumo da elegibilidade: liberar gate comercial para criação de LPs após persistência validada.
* E9.xx futuro — Trial: trial automático/manual como outra origem de entitlement.
* E9.xx futuro — Liberação manual: contratação manual ou concessão administrativa como origem comercial válida, sem comprovante informal por WhatsApp.
* E12.xx futuro — Valores: ajuste administrativo de valores, planos ativos e vínculo com provedor.
* Estrutura de persistência será definida em fase própria antes da implementação.
* Webhook de confirmação, quando implementado, deve ser catalogado em docs/automations.md como automação operacional, com recurso utilizado, categoria e classificação.
* Updates aplicáveis: supa#5 para logs seguros, supa#36 para leituras server-side, supa#40 para validação SQL read-only, supa#58 como trava de schema/grants/policies e prod#13 apenas como referência futura, sem bundles/grants no recorte inicial.

3.4 Fase 3 — Schema mínimo de entitlement comercial

* Objetivo: implementar o schema mínimo para persistir e consultar entitlement comercial da conta.
* Resultado esperado: migration canônica, documentação de schema atualizada e validação SQL read-only.
* Gatilho: contrato técnico da Fase 2 aprovado.
* Entrada: modelo conceitual da Fase 2, schema atual, padrões de migrations, RLS, grants e validação do projeto.
* Processamento: definir nome final da tabela, campos, constraints, índices, idempotência e leitura efetiva.
* Persistência: criar fonte de verdade para entitlement comercial e mecanismo mínimo de leitura efetiva.
* Consumo futuro: Account Dashboard server-side usará leitura efetiva em fase posterior.
* Fallback: sem entitlement efetivo, conta segue sem elegibilidade produtiva.
* Próxima ação: submeter PR da Fase 3 para revisão e merge humano; consumo runtime fica para fase posterior.

3.4.1 Resultado da Fase 3 — schema mínimo implementado

Arquivos consultados:

* `AGENTS.md`
* `docs/prompt-executor.md`
* `docs/lousa-plano-base-e9.md`
* `docs/roadmap.md`
* `docs/schema.md`
* `docs/base-tecnica.md`
* `supabase/migrations/20260615190000_e18_commercial_activation_minimum.sql`
* `supabase/migrations/20260616142100_real_estate_lab_v0.sql`
* `supabase/migrations/20260621162400_e10_7_admin_artifact_write_publish.sql`
* `supabase/snippets/e10_7_phase_7_commercial_activation_contract_verify.sql`

Entregas:

* Migration canônica: `supabase/migrations/20260628184945_e9_commercial_entitlements.sql`.
* Tabela: `public.account_commercial_entitlements`.
* Leitura efetiva: view read-only `public.v_account_commercial_entitlement_effective` com `security_invoker = true`.
* Snippet read-only de validação: `supabase/snippets/e9_phase_3_entitlements_verify.sql`.
* Documentação atualizada: `docs/schema.md`.

Schema entregue:

* Campos mínimos: `id`, `account_id`, `plan_key`, `plan_name_snapshot`, `origin`, `status`, `starts_at`, `confirmed_at`, `expires_at`, `canceled_at`, `external_provider`, `external_reference`, `idempotency_key`, `metadata_json`, `created_at`, `updated_at`.
* Checks: planos canônicos `starter`, `lite`, `pro`, `ultra`; origens `plano_pago_confirmado`, `trial`, `liberacao_manual`; status `pendente_confirmacao`, `ativo`, `expirado`, `cancelado`; `metadata_json` como objeto; vigência coerente.
* Índices: `account_id`, `status`, `expires_at`, lookup efetivo por `account_id/status/vigência` e UNIQUE parcial de `idempotency_key` quando não nulo.
* Segurança: RLS ativo; SELECT para membro ativo da conta ou platform_admin; authenticated sem INSERT/UPDATE/DELETE; service_role com mutação explícita para fase operacional futura.
* View efetiva: retorna no máximo um entitlement por conta e expõe `is_commercially_eligible` sem payload bruto, dados de cartão, secrets ou PII sensível.

Validação planejada:

* `supabase/snippets/e9_phase_3_entitlements_verify.sql` valida tabela, view, checks, RLS, grants, índices, unique parcial, regra efetiva sintética e ausência de dependência de checkout/webhook/provedor específico.
* `npm ci` e `npm run check`: N/A, pois não houve alteração em código JS/TS/package.

Riscos e lacunas:

* Migration deve ser aplicada pelo fluxo normal de merge na `main`.
* Account Dashboard ainda não consome a view; isso fica para fase futura.
* Não houve checkout, webhook, provedor, runtime, admin, trial operacional, liberação manual operacional ou Billing Engine completo.

Decisões herdadas da Fase 2:

* Domínio provável: commercial entitlements como domínio próprio.
* Path futuro provável: `lib/commercial-entitlements/`.
* Fonte de verdade definida na Fase 3: tabela `account_commercial_entitlements`.
* Leitura efetiva definida na Fase 3: view read-only `v_account_commercial_entitlement_effective`.
* Plano canônico: `starter`, `lite`, `pro`, `ultra`.
* Origem comercial inicial: `plano_pago_confirmado`.
* Origens futuras: `trial` e `liberacao_manual`.
* Status persistidos prováveis: `pendente_confirmacao`, `ativo`, `expirado`, `cancelado`.
* `sem_entitlement` e `bloqueado_operacionalmente` devem ser derivados de consulta, não necessariamente linhas persistidas.
* Provedor, checkout, webhook, assinatura, invoice e evento externo são mecanismos/referências, não origem comercial.

Governança da Fase 3:

* Analista: avaliar lacunas, contradições, riscos, escopo e clareza.
* Gestor Estrutural: obrigatório, porque há schema, migration, RLS, grants, constraints, índices e boundary.
* Gestor de Updates: obrigatório, especialmente supa#58, supa#40, supa#36 e supa#5.
* Gestor de Automação: N/A neste recorte, porque ainda não há webhook, job, rotina, monitoramento ou execução recorrente.

Limites da Fase 3:

* Não escolher provedor de checkout.
* Não implementar checkout.
* Não criar webhook.
* Não alterar Account Dashboard.
* Não alterar cards da E10.7.
* Não criar LP Builder.
* Não criar tela admin E12.
* Não implementar trial operacional.
* Não implementar liberação manual operacional.
* Não transformar E9 em Billing Engine completo.
* Não criar múltiplos provedores.
* Não mexer em valores dos planos.

3.5 Fase 4 — Consumo server-side da elegibilidade comercial

* Objetivo: consumir a view `v_account_commercial_entitlement_effective` no servidor para expor a elegibilidade comercial da conta.
* Resultado esperado: camada server-side mínima retorna se a conta possui entitlement comercial válido, sem alterar layout, copy ou cards.
* Gatilho: schema mínimo da Fase 3 concluído.
* Entrada: account context validado, conta `active`, membership ativo e leitura efetiva de entitlement comercial.
* Processamento: consultar a view por `account_id` e derivar `isCommerciallyEligible`.
* Validação: não liberar elegibilidade apenas por `accounts.status`, `account_users.status`, `accounts.plan_id`, `public.plans` ou `v_account_effective_limits`.
* Consumo: Account Dashboard passa a ter dado server-side de elegibilidade comercial para fase posterior de gate produtivo.
* Fallback: sem entitlement efetivo, retornar não elegível e manter experiência comercial/persuasiva.
* Próxima ação: submeter Fase 4 à avaliação do Analista, Gestor Estrutural e Gestor de Updates antes do Executor.

3.5.1 Resultado da Fase 4 — consumo server-side mínimo

Arquivos consultados:

* `AGENTS.md`
* `docs/prompt-executor.md`
* `docs/lousa-plano-base-e9.md`
* `docs/roadmap.md`
* `docs/schema.md`
* `docs/base-tecnica.md`
* `supabase/migrations/20260628184945_e9_commercial_entitlements.sql`
* `lib/access/getAccessContext.ts`
* `lib/access/adapters/accessContextAdapter.ts`
* `lib/conversion-content/adapters/commercialActivationAdapter.ts`
* `app/a/[account]/page.tsx`

Entregas:

* Boundary criado: `lib/commercial-entitlements/`.
* Contrato público: `CommercialEntitlementSignal` com `isCommerciallyEligible`, `effectiveStatus` e `planKey`.
* Adapter server-only: `getCommercialEntitlementSignal({ accountId })`.
* Consulta centralizada na view `v_account_commercial_entitlement_effective`, filtrada por `account_id`, sem query espalhada na página.
* Account Dashboard carrega o sinal server-side após resolver `accountId` pelo Access Context, sem alterar layout, copy, cards E10.7 ou comportamento visual.

Decisões técnicas:

* O boundary usa client SSR autenticado, preservando RLS e a premissa de que o `accountId` já foi validado pelo Access Context.
* A ausência de linha ou erro é tratada como não elegível, sem lançar exceção para a UI.
* A fase não aplica gate produtivo nem usa o sinal para bloquear/liberar criação de LP.
* A fase não consulta `accounts.status`, `account_users.status`, `accounts.plan_id`, `public.plans` ou `v_account_effective_limits` como prova comercial.

Riscos e lacunas:

* A Fase 4 depende da migration/view da Fase 3 estar aplicada no ambiente alvo.
* O sinal ainda não governa criação produtiva de LP; o gate operacional deve ser definido em fase futura.
* Não houve checkout, webhook, provider adapter, admin, LP Builder, trial operacional, liberação manual operacional ou automação.

Governança da Fase 4:

* Analista: avaliar aderência do fallback fail-closed e ausência de mudança visual.
* Gestor Estrutural: avaliar boundary, adapter server-only e acoplamento com Account Dashboard.
* Gestor de Updates: avaliar aderência a Supabase Data API/RLS e consumo server-side.
* Gestor de Automação: N/A neste recorte, porque não há webhook, job, rotina, monitoramento ou execução recorrente.

3.6 Fase 5 — Gate produtivo de criação de LP

* Objetivo: aplicar a regra conta `active` + membership ativo + entitlement comercial válido no ponto server-side de criação produtiva de LP.
* Resultado esperado: criação produtiva bloqueada quando não houver entitlement comercial válido.
* Limite: não alterar layout/copy/cards da E10.7 e não implementar checkout.

3.7 Fase 6 — Provedor de checkout mínimo

* Objetivo: escolher e integrar o primeiro provedor de checkout para confirmação comercial mínima.
* Resultado esperado: plano pago gera referência externa para posterior persistência do entitlement.
* Limite: não criar múltiplos provedores nem Billing Engine completo.

3.8 Fase 7 — Webhook e persistência do entitlement

* Objetivo: persistir ou atualizar `account_commercial_entitlements` após confirmação comercial.
* Resultado esperado: webhook idempotente registra entitlement ativo, origem comercial, vigência e referência externa.
* Observação: esta fase aciona Gestor de Automação, porque webhook é automação operacional.

4. Escopo negativo e critérios de parada

* Não criar fluxo manual de pagamento, comprovante por WhatsApp ou liberação sem confirmação comercial.
* Não implementar trial no recorte inicial.
* Não criar múltiplos provedores ao mesmo tempo.
* Não alterar layout, copy, ordem ou design dos cards da E10.7.
* Não criar tela administrativa de valores dentro do E9.
* Não transformar E9 em Billing Engine completo.
* Não usar agente de IA.
* Não implementar LP Builder nem fluxo visual de criação de LPs no E9; E9 libera apenas o gate/elegibilidade comercial.
* Parar se a fase exigir tabela, RPC, policy, grant ou migration antes de definir contrato de entitlement, idempotência e consumo no Account Dashboard.
* Não assumir public.plans como fonte suficiente para checkout, descontos, garantias, regras promocionais ou URLs oficiais sem decisão específica.
* Parar se o recorte exigir mudança visual da E10.7, mutação administrativa ampla da E12, ou definição de trial antes do checkout pago mínimo.

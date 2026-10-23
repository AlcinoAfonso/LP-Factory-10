0. Introdução

0.1 Cabeçalho
- Documento: LP Factory 10 — Platform Config
- Versão: v0.1.62
- Data: 17/10/2026

0.2 Contrato do documento
- Fonte única das configurações externas confirmadas: plataformas, projetos, ambientes, variáveis/secrets por nome, endpoints, URLs, redirects, SMTP, DNS e redeploy.
- Runtime: `docs/base-tecnica.md`; banco: `docs/schema.md`; casos: `docs/roadmap.md`; visual: `docs/design-system.md`.
- Nunca registrar valores reais de secrets; somente nome, finalidade, plataforma e escopo.
- Recursos listados estão disponíveis na plataforma indicada, salvo marcação de futuro, pendente, bloqueado ou não validado. Isso não concede ao chat acesso ao secret; consumi-lo somente na plataforma autorizada.

1. Visão geral de plataformas
- GitHub: repositório, PRs, Actions e secrets de automações.
- Vercel: deploy do Core, serviços e variáveis de ambiente.
- Supabase: backend, Auth, Storage, Redirect URLs, SMTP Auth e infraestrutura.
- Resend: envio transacional via SMTP.
- OpenAI Platform: Projects, Service Accounts, API e modelo do resolvedor IA.
- Stripe: provedor inicial de checkout em modo teste para assinatura.
- Registro.com: domínio e DNS.
- Zoho Mail: e-mail humano/corporativo quando aplicável.

2. GitHub

2.1 Repositório
- Repositório: `AlcinoAfonso/LP-Factory-10`, `https://github.com/AlcinoAfonso/LP-Factory-10`; consultar antes de assumir paths, branches ou estrutura.
- PR/merge → Vercel; execução e autoridade em `AGENTS.md`. Inspeção por conector, GitHub Web ou gh autenticado; não há GH_TOKEN registrado aqui.
- Secret Scanning e Push protection ativos, confirmados em 07/10/2026. Cobertura do SUPABASE_ACCESS_TOKEN e configuração individual do usuário não comprovadas; não presumir bloqueio pré-push.

2.2 GitHub Actions
- Secrets e variáveis conhecidos:
- `OPENAI_API_KEY`: usado por automações/CI que chamam OpenAI. Consumidor atual: `pipeline-supabase-inspect`.
- `SUPABASE_DB_URL_READONLY`: conexão read-only para inspeções/automação de banco. Consumidor atual: `pipeline-supabase-inspect`.
- `OPENAI_COST_INGESTION_HMAC_SECRET`: secret de assinatura do ingresso financeiro do `pipeline-supabase-inspect`; configurado no GitHub Actions e no Core, sem valor versionado.
- `OPENAI_COST_INGESTION_ENABLED`: variável não sensível que libera o envio financeiro do `pipeline-supabase-inspect`; configurada e ativa no fluxo Production validado.
- `OPENAI_COST_INGESTION_URL`: URL HTTPS do endpoint interno do Core; configurada no GitHub Actions para o ingresso Production validado.
- `OPENAI_COST_INGESTION_ENVIRONMENT`: ambiente explícito enviado pelo workflow, restrito a `production`, `preview` ou `development`; configurada como variável do fluxo validado.
- `OPENAI_COST_INGESTION_PROTOCOL_VERSION`: versão do protocolo aceito pelo cliente do `supabase_inspect`; configurada como variável do fluxo validado.
- `MAILBOX_EMAIL`: e-mail institucional preservado para o futuro Operador Institucional Autônomo de QA da E17.9.3; sem consumidor operacional vigente após a E22.6.
- `MAILBOX_PASSWORD`: senha/app password da mailbox preservada para o futuro Operador Institucional Autônomo de QA da E17.9.3; sem consumidor operacional vigente após a E22.6.
- `SUPABASE_ACCESS_TOKEN`: token usado pelo workflow de apply de migrations Supabase.
- `SUPABASE_DB_PASSWORD`: senha do banco usada pelo workflow de apply de migrations Supabase.
- `SUPABASE_APPLY_MIGRATIONS_ENABLED`: variável de repositório usada como gate operacional; valor reconfirmado no GitHub em 11/10/2026 após o apply seletivo E10.12: `false`.
- Regra: valores reais de secrets não devem ser versionados.
- Regra: secrets de mailbox devem existir apenas nos escopos necessários dos workflows que os consomem.
- Regra: `SUPABASE_DB_URL_READONLY` deve autenticar com role/usuário read-only e usar preferencialmente session pooler.
- Regra: workflows que acessam banco para inspeção devem ser read-only, salvo caso explicitamente aprovado.
- Retenção observada em leitura read-only de GitHub → Settings → Actions → General em 06/09/2026: artefatos e logs são mantidos por 90 dias, que também é o limite máximo exibido para este repositório público.
- A partir de 01/10/2026, checks, workflow runs e commit statuses passam a seguir a mesma configuração de retenção de artefatos e logs. Dados já expirados não são restaurados por aumento posterior da janela.
- Regra de evidência: a expiração das evidências operacionais é normal; o estado final durável permanece em PR, commit, roadmap e documentos canônicos competentes, sem exportação ou armazenamento paralelo por padrão.

2.3 Workflows conhecidos
- Workflows: `.github/workflows/security.yml` (segurança), `.github/workflows/pipeline-supabase-inspect.yml` (inspeção read-only), `.github/workflows/pipeline-docs-apply-report.yml` (reports/PR), `.github/workflows/pipeline-supabase-apply-migrations.yml` (apply) e `.github/workflows/upgrade-next-16-1-1.yml` (Next/lockfile).
- Apply: push na main com supabase/migrations/** ou workflow_dispatch. Automático integral suspenso mesmo com gate aberto; duas migrations E10.10 excluídas. Novas execuções exigem PR/merge autorizados e decisão operacional própria; retomada integral exige resolução separada ou revisão explícita do filtro.
- Gate SUPABASE_APPLY_MIGRATIONS_ENABLED: false, reconfirmado após apply E10.12 em 11/10/2026. Fechado registra skipped em passo sem secrets e impede CLI, link e push. Setup e apply têm condição explícita de gate aberto.
- Setup controlado: supabase/setup-cli v2.1.1 no SHA 3c2f5e2ae34c34e428e8e206e2c4d21fa2d20fbf; CLI 2.106.0. Detalhes executáveis no workflow.
- Apply manual seletivo exige main, expected_main_sha exato, inventário validado, staging sem E10.10 e dry-run exclusivo das migrations autorizadas. Escopos disponíveis no workflow: e25_1_only, e10_11_only, e22_7_only, e23_5_only, e10_12_only, e25_3_only e e21_2_service_tier_only. E21.2 exige exclusivamente 20261023124919_e21_2_service_tier.sql pendente; merge técnico → apply seletivo → prova real autorizados em 23/10/2026, sem ativação. Gate aberto somente para essa execução e fechado ao terminar.
- Estado aplicado: E25.1, E10.11, E22.7, E23.5, E10.12 e E25.3 concluídos sob autorizações próprias. Última conferência de ledger em 11/10/2026: 68 migrations versionadas, 66 aplicadas/staged e duas E10.10 excluídas; gate restaurado a false. Recibos nos PRs; contratos físicos em `docs/schema.md`.
- E10.12 aplicadas: 20261007153217_e10_12_account_context_attendance.sql, 20261009171607_e10_12_sales_attendance.sql, 20261009204000_e10_12_restrict_attendance_commit_acl.sql e 20261011121811_e10_12_summary_capacity.sql; E25.3: 20261010202505_e25_3_communication_resources.sql. Sem backfill histórico. Ativação por ambiente em 3.5.
- Secrets SUPABASE_ACCESS_TOKEN e SUPABASE_DB_PASSWORD disponíveis somente no passo Apply migrations autorizado; projeto alvo por SUPABASE_PROJECT_REF no workflow, restrito ao projeto aprovado.
- Schema muda por migration versionada, sem SQL Editor no fluxo normal. Migration aplicada não pode ser editada, apagada, renomeada ou substituída; correção/reversão exige nova migration.
- Reversão da capacidade do Resumo exige E10_12_ATTENDANCE_ENABLED suspenso, runtime compatível e nova migration baseada em `supabase/rollbacks/20261011121811_e10_12_summary_capacity.rollback.sql`. Bloqueada enquanto houver Resumo acima de 4.000 caracteres; sem truncar/excluir para forçar reversão.

2.4 Mailbox operacional para automações
- Mailbox institucional: lpfactoryqa@gmail.com, Gmail POP3 em pop.gmail.com:995; exclusiva do projeto para QA de signup, convite e recuperação, sem e-mail pessoal.
- Estado: conta dedicada, recuperação confirmada, 2FA e POP3 ativos. Reservada à futura E17.9.3, sem consumidor vigente após E22.6.
- Credencial: app password LP Factory QA Automation; repository secrets GitHub de AlcinoAfonso/LP-Factory-10. MAILBOX_EMAIL é a caixa base; MAILBOX_PASSWORD é a senha de app, não a principal do Google. Valores somente nos secrets.
- Consultar/consumir por referência e escopo necessário; não solicitar, copiar, revelar ou recriar valores nem presumir consumidor autorizado. Chats não leem/descriptografam secrets do GitHub.
- POP3 não fornece login web do Gmail nem credenciais permanentes dos dashboards. Alterar mailbox não modifica usuários, aliases, contas ou evidências existentes. Vazamento exige revogar/substituir a senha de app.

3. Vercel

3.1 Projeto Core
- Projeto Vercel: `lp-factory-10`
- Finalidade: runtime principal do produto.
- Deploy: Preview + Production.
- Deploy automático via Git: o `vercel.json` da raiz desabilita somente branches abrangidas pelo padrão minimatch `docs/**`; branches não abrangidas preservam o default `true`, incluindo Preview de implementação e Production da `main`.
- Domínio oficial atual do app em produção: `https://lp-factory-10.vercel.app`
- Base URL das API routes do app: `https://lp-factory-10.vercel.app/api`
- Plano operacional confirmado: Hobby.
- Retenção vigente no Hobby: além do deployment de produção atual e das demais exceções da plataforma, permanecem os três deployments de produção mais recentes e os três deployments mais recentes de qualquer tipo; Previews não possuem proteção própria.
- Preview e deployment histórico são evidências suplementares e expiráveis. Não preservar deployment por rotina, contratar upgrade ou criar storage paralelo para evidências; reconfirmar as exceções vigentes quando uma retenção específica for material.

3.2 Projeto de serviços
- lpf-10-services removido em 01/09/2026; sem projeto, domínio, endpoint, Root Directory ou configuração de build remanescente.
- MCP_SUPABASE_INSPECT_URL e LPF_MCP_SECRET removidos do Core por ausência de consumidor. Não representa retirada da automação GitHub preservada.

3.3 Runtime e build
- Node.js: `22.x`
- Regra: versão de Node deve ser conferida em Vercel > Settings > Build and Deployment > Node.js Version.
- Regra: mudança de variável de ambiente na Vercel só entra no runtime após redeploy do deployment alvo.
- Regra: testar primeiro em Preview da feature branch antes de Production, quando aplicável.

3.4 Variáveis públicas no Vercel
- `NEXT_PUBLIC_SITE_URL`
- Finalidade: origem canônica usada pelo fluxo de Auth para formar o callback `/auth/confirm`.
- Escopo: Production e Preview.
- Produção: `https://lp-factory-10.vercel.app`.
- Preview: usar a origem HTTPS do deployment validado, sem path adicional.

- `NEXT_PUBLIC_SUPABASE_URL`
- Finalidade: URL pública do projeto Supabase usado pelo app.
- Escopo: Production e Preview.
- Valor atual conhecido: `https://dpikmjgiteuafsbaubue.supabase.co`

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Finalidade: chave pública/publishable usada pelo client Supabase.
- Escopo: Production e Preview.
- Observação: é variável pública, mas deve ser registrada com mínimo necessário.

3.5 Secrets e variáveis server-side no Vercel
- E11_MEMBERS_ENABLED: gestão de membros/convites; true em Production e Preview.
- INVITE_STATE_SECRET: assinatura do estado opaco do convite; configurado em Preview/Production com valores independentes. Deve existir antes de habilitar E11_MEMBERS_ENABLED.
- SUPABASE_SECRET_KEY: operações Supabase autorizadas do runtime, server-side em Preview/Production.
- ACCESS_CONTEXT_ENFORCED e ACCESS_CTX_USE_V2: enforcement/Access Context v2; esperado true em Preview/Production.
- OPENAI_API_KEY: configurada em Preview/Production e compartilhada pelos consumidores de produto autorizados; não criar outra sem necessidade aprovada.
- OPENAI_ADMIN_KEY: Organization Admin Key com Read only, exclusiva do Core para Costs API em Preview/Production. Configurada e validada nos dois ambientes; separada de OPENAI_API_KEY, nunca em client, log, banco ou payload sanitizado.
- OPENAI_LP_COST_TRACKING_ENABLED: true somente em Production; ausente em Preview/Development. Sem consumidor após retirada do write-side E21.4; valor inerte, série/corte/cobertura preservados somente leitura. Sem remoção obrigatória ou novo consumidor autorizado.
- OPENAI_ACTIVE_COST_TRACKING_ENABLED: ledger ativo transversal; Config ativa em Preview/Production, independente por ambiente. Ausência/vazio/diferente de true desliga captura sem bloquear workload. Alteração exige redeploy e validação do ambiente.
- OPENAI_COST_INGESTION_ENABLED: Config do ingresso financeiro assinado de supabase_inspect, escopo Preview/Production do Core alinhado ao workflow. Configurada no Core/GitHub; fluxo Production validado, inclusive rejeição de assinatura inválida/expirada.
- OPENAI_COST_INGESTION_HMAC_SECRET: Secret exclusivo do ingresso, configurado no GitHub e Core para Production validado; valores independentes por ambiente.
- OPENAI_COST_INGESTION_ENVIRONMENT: Config para validar ambiente declarado pelo workflow; escopo Preview/Production, configurada no GitHub/Core para Production validado. Revisão de referência code-owned E21.
- OPENAI_OPERATIONAL_CONFIG_ENABLED: true em Preview/Production, independente por ambiente; Development ignora gate. Somente true lê revisão ativa Supabase em cada execução, sem cache/fallback após erro; ausente/vazio/outro valor usa repo_catalog. Alterar gate exige redeploy; alteração ordinária da configuração ativa não exige. Ativação sequencial Preview → Production concluída.
- E25_1_COMMUNICATION_BASE_ENABLED: Config true em Preview/Production, independente por ambiente; controla rota, actions, navegação e assistência da Base. Ausente/outro valor desabilita sem consultar tabela. Apply, configuração E21 e ativação concluídos; alteração exige redeploy.
- E25_3_COMMUNICATION_RESOURCES_ENABLED: Config true em Preview/Production do lp-factory-10, independente por ambiente, confirmada em 11/10/2026. Recursos manuais das três categorias e gestão global de seções separados de E25.1; somente true habilita. Preview reativado/validado antes de Production, ambos operacionais. Alterar exige redeploy; desligar preserva E25.1 e dados persistidos. [Recibo final](https://github.com/AlcinoAfonso/LP-Factory-10/pull/1057#issuecomment-6112021128).
- E10_11_PASSAGE_ENABLED: Config true em Preview/Production, independente por ambiente; coleta nome público, conclusão versionada e passagem autorizada à Base. Ausente/outro valor preserva conclusão/rota anteriores sem consultar coluna nova. Apply/ativação concluídos; alteração exige redeploy.
- E10_12_ATTENDANCE_ENABLED: Config habilitada somente por true; Production e Previews das branches codex-app/e10-12-rpc-acl, codex-app/e10-12-encerramento-economia, codex-app/e10-12-mensagem-integral e codex-app/e10-12-comercial-leituras, independentes por ambiente. Alteração exige redeploy. Desligar suspende conversas IA sem encaminhar ao legado nem limpar proposta/intenção; novas conversas sem conversão histórica, inclusive no QA.
- Configuração operacional comprovada do pending_setup_conversation: gpt-6-luna/xhigh, contrato 5, sem Web Search; efetiva é a revisão ativa E21 por ambiente. Prompt e10_12_sales_context_v14 qualificado em Preview revisão 14 e Production revisão 5; revisão 5 ativada em Production após merge, com promoção/QA concluídos. [Recibo final #1069](https://github.com/AlcinoAfonso/LP-Factory-10/pull/1069#issuecomment-6173160187). Delta comercial sem migration/apply; gate de migrations permanece false.
- Gates removidos da Vercel Core e sem consumidor: E20_5_SELECTED_RESEARCH_ENABLED (seleção de pesquisa end_customer), E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED (provider factual), E20_6_INPUT_CATALOG_REVIEW_ENABLED (revisão factual) e E19_5_WORKSPACE_ENABLED (workspace LP, antes Preview/Production gerais). Não recriar/reutilizar sem decisão própria.
- Configuração efetiva de produto: identidade, baseline e allowlist em `lib/openai-workloads/registry.ts`; Development usa repo_catalog v2, Preview/Production supabase_operational com revisão decimal ativa. Referências validadas niche_resolution e commercial_activation_draft_generation: gpt-5.4-mini/none; a revisão ativa do ambiente governa o efetivo.
- Configuração registrada de communication_base_stage2_intelligence em Preview/Production: gpt-6-luna/max, com modelo/effort pela revisão ativa do ambiente; Standard enviado explicitamente pelo request legado, sem nível de serviço persistido no snapshot.
- Workloads retirados: landing_page_dynamic_market_research e taxon_input_catalog_sufficiency_evaluation sem unidades mutáveis ou consumidores correntes. Revisões/ativações/custos e quatro unidades antigas de drafts permanecem históricos e inertes; fora da allowlist não invalidam leitura corrente.
- maxDuration = 300 no segmento produtivo, operacionalmente validado; contrato executável no código.
- OPENAI_NICHE_RESOLVER_MODEL, OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL e OPENAI_COMMERCIAL_ACTIVATION_MODEL: ausentes de Preview/Production, sem branch override ou consumidor ativo. Não recriar sem necessidade aprovada; modelo efetivo pela configuração E21 acima.
- SUPABASE_DB_URL_READONLY: sem consumidor Vercel; preservado somente no GitHub para automations/supabase-inspect, sem mutações.

3.6 Classificação Config e Secret no Core
- Secret: credenciais, tokens, senhas, chaves privadas e assinatura/autenticação. Config: URLs, publishable keys, flags/gates/IDs e demais valores não sensíveis, inclusive server-side; NEXT_PUBLIC_* deve ser Config.
- Secret confirmado: INVITE_STATE_SECRET, SUPABASE_SECRET_KEY, OPENAI_API_KEY, OPENAI_ADMIN_KEY, STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET nos ambientes cadastrados.
- Config confirmado: ACCESS_CONTEXT_ENFORCED, ACCESS_CTX_USE_V2, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e OPENAI_LP_COST_TRACKING_ENABLED. E11_MEMBERS_ENABLED e OPENAI_OPERATIONAL_CONFIG_ENABLED possuem entradas gerais conformes e exceções abaixo.
- Sobreclassificações preservadas por decisão conservadora: E11_MEMBERS_ENABLED em branch scope legado, OPENAI_OPERATIONAL_CONFIG_ENABLED em Preview e os 16 nomes STRIPE_TEST_*_PRODUCT_ID/STRIPE_TEST_*_PRICE_ID. Secrets salvos são write-only; não substituir/reinserir valores para reclassificar por rotina.
- Branch scopes preservados: codex-app/e11-11-1-7, codex-app/e20-5-pos-merge, codex-app/e20-6-5-post-apply-corrections e codex-app/e11-2-orquestracao; entradas scoped dos gates E20 foram retiradas, sem mudar configurações independentes.
- Ausentes do Core: E19_5_WORKSPACE_ENABLED, MCP_SUPABASE_INSPECT_URL, LPF_MCP_SECRET, SUPABASE_DB_URL_READONLY, E7_ONBOARD_SERVICE_ONLY e gates E20 de 3.5. SUPABASE_DB_URL_READONLY do GitHub permanece preservado.
- Nova correção exige risco ou impacto funcional material comprovado e decisão própria. Inspeção somente de metadados, sem recuperar, copiar, substituir ou expor valores.

4. Supabase

4.1 Projeto
- Projeto Supabase: `lp-factory-10`
- URL pública conhecida: `https://dpikmjgiteuafsbaubue.supabase.co`
- PostgreSQL: `17.6.1.063`
- PostgREST/Data API: `14.1`
- Auth: ativo.
- Storage: ativo.
- RLS: obrigatório para tabelas sensíveis.
- GraphQL: capacidade desabilitada; extensão e resolvedor ausentes, com stub gerenciado sem dados. Contrato de banco em `docs/schema.md` — seção 6.2; configuração local `supabase/config.toml` expõe somente `public` em `api.schemas`.

4.2 Ambiente
- Estado atual: não existe ambiente Supabase STAGING ativo.
- Regra: previews usam o projeto principal neste momento.
- Regra: se houver novo staging no futuro, não manter sem controles mínimos de segurança.

4.3 JWT Signing Keys
- Current: ECC (P-256)
- Previous: Legacy HS256
- Regra: não revogar chave anterior por padrão.
- Regra: integrações futuras devem validar JWT via JWKS + `kid`.

4.4 Auth Redirect URLs
- Local: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
- Regra: permitir somente domínios/paths necessários.
- Produção: incluir URLs necessárias do domínio oficial do app.
- Localhost: incluir apenas quando necessário para desenvolvimento/teste.
- Preview Vercel: quando necessário, usar wildcard com `/**` para cobrir paths profundos.
- Regra: não usar curingas amplos fora de preview.

4.5 Supabase Auth — SMTP via Resend
- Finalidade: envio transacional de signup confirm e reset password.
- Provedor SMTP: Resend.
- Sender: `no-reply@lpfactory.com.br`
- SMTP host/porta: `smtp.resend.com:587`
- Username SMTP: `resend`
- Password SMTP: secret configurado no Supabase; não versionar.
- Regra: manter SPF/DKIM compatíveis com Resend.
- Validação atual conhecida: signup e forgot password testados, entrega confirmada, links funcionais e sem erro de envio.

4.6 Supabase Auth — convite de membro
- Convite nativo inviteUserByEmail; nenhum Auth Hook configurado na última confirmação operacional de 27/07/2026, sem envio customizado no Core.
- Template Invite user em pt-BR: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite`. Estado assinado específico de cada emissão em redirectTo, sem data/user_metadata compartilhado.
- Redirect Production: https://lp-factory-10.vercel.app/auth/confirm. Preview: wildcard restrito https://*-alcino-afonsos-projects.vercel.app/**, somente deployment autorizado.
- Email OTP Expiration: 3600 segundos; sem validade local paralela no Core. Template, redirects e expiração configurados; gate E11 habilitado em Production.
- Jornada e regras de concorrência, reenvio, senha e isolamento em `docs/roadmap.md` — 11.1.4.

4.7 Acesso operacional read-only para automações
- Role operacional read-only: `ai_readonly`.
- Secret relacionado: `SUPABASE_DB_URL_READONLY`.
- Uso: inspeções e verificações read-only em automações.
- Regra: não usar esse acesso para mutações.
- Regra: revisar permissões antes de ampliar o escopo operacional.

4.8 Storage privado das revisões de landing page
- Bucket definido no repositório: `landing-page-revision-assets`.
- Estado operacional: infraestrutura hospedada preservada, porém inerte após a retirada dos readers, Preview e assinatura de assets do produto legado.
- Configuração aprovada: privado, limite de 5 MB e MIME permitido somente `image/webp`.
- Acesso do produto: não há consumidor runtime; nenhuma policy direta para anon ou authenticated foi alterada.
- Limpeza do bucket ou de objetos depende de recorte destrutivo próprio.

4.9 Health Check Advisors
- Projeto alvo: `LP-Factory-10`.
- Acesso manual: Supabase Studio → Advisors → Health.
- Procedimento: executar o refresh manual e registrar data/hora e os estados de Data API/PostgREST, Auth, Storage e Edge Functions.
- Semântica: resultado vazio significa verificações executadas sem achados; `advisor_check_unavailable` significa verificação indisponível e nunca estado saudável.
- Uso: achado é sinal de investigação a correlacionar com horário, release, logs seguros e comportamento observado; não prova causa nem autoriza correção.
- Baseline observado em 22/09/2026 19:31, America/Sao_Paulo: `0 errors`, `0 warnings` e `0 suggestions`, sem `advisor_check_unavailable`.
- Limite: leitura manual somente; não criar token, chamar Management API, executar SQL ou correção, nem criar monitor, job, agente ou automação sem recorte futuro aprovado.

5. Resend

5.1 Uso
- Finalidade: envio transacional usado pelo Supabase Auth.
- Domínio verificado: `lpfactory.com.br`
- Plano atual conhecido: Free.
- Sender usado: `no-reply@lpfactory.com.br`
- Uso atual: indireto via Supabase Auth SMTP.
- O app Core não chama a API Resend diretamente no runtime.
- Não há SDK Resend versionado no repositório no estado atual.

5.2 DNS relacionado
- SPF/DKIM devem permanecer compatíveis com Resend.
- Regra: não alterar SPF raiz sem avaliar impacto em e-mails humanos/corporativos.
- Regra: Resend permanece para envio transacional, não para mailbox humano.

6. OpenAI Platform

6.1 Projects
- Project DEV: `LPF10-DEV`
- Project PROD: `LPF10-PROD`
- Sharing atual conhecido: “Enabled for selected projects” com apenas `LPF10-DEV` selecionado.
- Regra: Default e PROD não devem compartilhar por padrão.

6.2 Service Accounts e keys
- Service Account criada no `LPF10-DEV` para uso em DEV.
- Estado final conhecido: 1 key ativa no `LPF10-DEV`.
- Regra: manter apenas keys necessárias ativas.
- Regra: revogar imediatamente keys expostas ou indevidas.

6.3 Variáveis relacionadas
- OPENAI_API_KEY: autenticação OpenAI, server-only; consumidores de produto autorizados podem compartilhar a chave. Escopos Vercel em 3.5 e GitHub em 2.2.
- Modelo/effort/mídia não vêm de variáveis Vercel legadas: Development usa baseline versionado; Preview/Production usam revisão ativa Supabase pelo gate de 3.5.

6.3.1 Endpoint externo atual
- Responses API: https://api.openai.com/v1/responses.
- Models API: GET https://api.openai.com/v1/models/{id}; validação síncrona do ID no cadastro Admin, server-side com OPENAI_API_KEY compartilhada em Preview/Production. Falha/divergência bloqueia cadastro.
- Costs API: https://api.openai.com/v1/organization/costs; `lib/openai-costs/providers/openAiCostsProvider.ts`, server-side com OPENAI_ADMIN_KEY.
- Atalhos: https://platform.openai.com/usage e https://platform.openai.com/settings/organization/billing/overview. /admin/custos-openai abre externamente, sem iframe/rota intermediária ou transmissão de credencial, período, conta, LP ou outro dado do produto; permissões dependem da organização OpenAI.
- Histórico financeiro somente leitura por `lib/openai-costs/adapters/lpCostReadModelAdapter.ts`; ledger ativo separado, em `docs/schema.md` — 3.11. Consumidores de IA em `docs/automations.md` e nos boundaries públicos de `lib/openai-workloads/`.
- Registrar nova API/endpoint quando virar dependência operacional.

6.4 Histórico de integração Agent Builder — Supabase Inspect
- Integração Agent Builder Supabase Inspect retirada manualmente em 01/09/2026; sem workflow operacional ou consumidor independente. Nenhum substituto autorizado por essa retirada; automação GitHub em `docs/automations.md` — 3.1.

7. Stripe

7.1 Uso
- Provedor de checkout/webhook em teste, modo subscription; Checkout Session server-side. Contrato comercial e eventos aceitos em `docs/roadmap.md` — 9.4.

7.2 Endpoint usado pelo app
- Checkout Sessions API: `https://api.stripe.com/v1/checkout/sessions`
- Regra: chamada somente server-side.
- Regra: não expor secret Stripe no client.
- Webhook Stripe: `POST /api/stripe/webhook`
- Endpoint externo usado para subscription lookup: `https://api.stripe.com/v1/subscriptions`
- Regra: webhook exige assinatura Stripe válida.
- Regra: payload bruto Stripe não deve ser persistido.

7.3 Vercel — secrets e variáveis Stripe
- `STRIPE_SECRET_KEY`
- Finalidade: secret server-side Stripe para criar Checkout Sessions.
- Plataforma: Vercel.
- Escopo conhecido: Production validado; Preview quando necessário para testes.
- Valor real: não versionar.

- `STRIPE_WEBHOOK_SECRET`
- Finalidade: secret server-side para validação da assinatura do webhook Stripe.
- Plataforma: Vercel.
- Escopo conhecido: Production validado.
- Valor real: não versionar.

Products/Prices de teste
- `STRIPE_TEST_STARTER_MONTHLY_PRODUCT_ID`
- `STRIPE_TEST_STARTER_MONTHLY_PRICE_ID`
- `STRIPE_TEST_STARTER_ANNUAL_PRODUCT_ID`
- `STRIPE_TEST_STARTER_ANNUAL_PRICE_ID`
- `STRIPE_TEST_LITE_MONTHLY_PRODUCT_ID`
- `STRIPE_TEST_LITE_MONTHLY_PRICE_ID`
- `STRIPE_TEST_LITE_ANNUAL_PRODUCT_ID`
- `STRIPE_TEST_LITE_ANNUAL_PRICE_ID`
- `STRIPE_TEST_PRO_MONTHLY_PRODUCT_ID`
- `STRIPE_TEST_PRO_MONTHLY_PRICE_ID`
- `STRIPE_TEST_PRO_ANNUAL_PRODUCT_ID`
- `STRIPE_TEST_PRO_ANNUAL_PRICE_ID`
- `STRIPE_TEST_ULTRA_MONTHLY_PRODUCT_ID`
- `STRIPE_TEST_ULTRA_MONTHLY_PRICE_ID`
- `STRIPE_TEST_ULTRA_ANNUAL_PRODUCT_ID`
- `STRIPE_TEST_ULTRA_ANNUAL_PRICE_ID`

Regra:
- Registrar apenas nomes e finalidade das envs.
- Nunca versionar Product IDs, Price IDs, secret key, session ID, customer ID ou subscription ID reais.
- Alteração de env Stripe na Vercel exige redeploy do deployment alvo.

7.4 Redirects de checkout
- Success URL e Cancel URL geradas server-side pelo origin da requisição.
- Redirect não comprova pagamento nem libera entitlement; confirmação pelo webhook já implementado, conforme 7.1/7.2.

8. Domínios e DNS

8.1 Domínios conhecidos
- `lpfactory.com.br`
- Uso: domínio da marca/projeto LP Factory.
- Status conhecido: registrado e publicado.

- `unicodigital.com.br`
- Uso: domínio relacionado à Unico Digital e e-mail corporativo existente.

8.2 Registro.com
- Uso: registrar e gerenciar DNS/domínios quando aplicável.
- Regra: alterações DNS devem ser feitas com cuidado, preservando e-mail humano/corporativo e entregabilidade transacional.

8.3 E-mail humano/corporativo
- Provedor conhecido: Zoho Mail para `unicodigital.com.br`.
- Direção operacional: e-mails humanos da LP Factory devem usar provedor humano/corporativo, como Zoho/M365/Workspace, não Resend.
- Resend deve permanecer como transacional.

9. Regras operacionais de mudança

9.1 Alteração de env na Vercel
- Alterar no ambiente correto e redeployar; validar primeiro Preview quando houver feature/risco operacional e promover Production somente após validação mínima.

9.2 Alteração de SMTP/Auth
- Validar signup confirm, forgot password, funcionamento dos links e ausência de erro de envio. Senha SMTP nunca em prints, logs ou chat.

9.3 Alteração de DNS
- Identificar registro atual e dependências antes de alterar DNS/SPF/DKIM/DMARC; preservar site e entregabilidade humana/transacional. Registrar mudança operacional quando houver impacto.

9.4 Alteração de GitHub Actions secrets
- Confirmar workflow consumidor e ambiente/escopo; alterar sem registrar valor real e reexecutar somente o workflow necessário.

10. Relação com outros documentos

10.1 Base Técnica
- `docs/base-tecnica.md`: runtime, segurança, adapters e observabilidade; configuração externa fica aqui, com referência curta pelos consumidores.

10.2 Schema
- `docs/schema.md`: objetos, RLS/policies, RPCs, triggers, constraints, grants e permissões de banco.

10.3 Roadmap
- `docs/roadmap.md`: estado, escopo, artefatos e pendências dos casos.

10.4 Design System
- `docs/design-system.md`: padrões visuais e componentes.

10.5 Automations
- `docs/automations.md`: catálogo, uso, status, dependências e aprendizados operacionais. Plataformas, secrets por nome, workflows, ambientes e endpoints ficam aqui.

99. Histórico
- Git e PRs do repositório.

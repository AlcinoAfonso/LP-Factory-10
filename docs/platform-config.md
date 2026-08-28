0. Introdução

0.1 Cabeçalho
• Documento: LP Factory 10 — Platform Config
• Versão: v0.1.29
• Data: 28/08/2026

0.2 Contrato do documento
• O QUE É: snapshot operacional e fonte única das configurações de plataformas externas do LP Factory 10, refletindo o estado conhecido/cadastrado nas plataformas conforme indicado.
• USAR PARA: variáveis, secrets por nome, endpoints, URLs, redirects, SMTP, DNS, projetos externos, ambientes e regras de redeploy.
• NÃO USAR PARA: regras de runtime/código, contrato de DB, status de casos E* ou padrões visuais.
• REGRA: nunca registrar valores reais de secrets; registrar apenas nome, finalidade, plataforma e escopo.
• LEITURA OPERACIONAL: secrets, variáveis, workflows, endpoints e conectores listados aqui devem ser tratados como disponíveis no ambiente/plataforma indicada, salvo marcação explícita de futuro, pendente, bloqueado ou não validado.
• LIMITE: este documento não versiona valores reais de secrets e não garante que o chat tenha acesso direto a eles; quando o uso exigir segredo, a execução deve ocorrer na plataforma autorizada, por exemplo GitHub Actions, Vercel ou Supabase.

1. Visão geral de plataformas
• GitHub: repositório, PRs, Actions e secrets de automações.
• Vercel: deploy do Core, serviços e variáveis de ambiente.
• Supabase: backend, Auth, Storage, Redirect URLs, SMTP Auth e infraestrutura.
• Resend: envio transacional via SMTP.
• OpenAI Platform: Projects, Service Accounts, API e modelo do resolvedor IA.
• Stripe: provedor inicial de checkout em modo teste para assinatura.
• Registro.com: domínio e DNS.
• Zoho Mail: e-mail humano/corporativo quando aplicável.

2. GitHub

2.1 Repositório
• Repositório canônico: `AlcinoAfonso/LP-Factory-10`
• URL: `https://github.com/AlcinoAfonso/LP-Factory-10`
• Fluxo operacional: GitHub Web → PR/merge → Vercel
• Regra: consultar o repositório real antes de assumir paths, branches, arquivos ou estrutura.
• Regra: investigações operacionais podem usar GitHub Connector, GitHub Web ou `gh` autenticado no ambiente autorizado; não há secret nomeado `GH_TOKEN` registrado para essa finalidade neste documento.

2.2 GitHub Actions
• Secrets e variáveis conhecidos:
• `OPENAI_API_KEY`: usado por automações/CI que chamam OpenAI. Consumidor atual: `pipeline-supabase-inspect`.
• `SUPABASE_DB_URL_READONLY`: conexão read-only para inspeções/automação de banco. Consumidores atuais: `pipeline-supabase-inspect` e `automation-niche-runtime-tests` quando houver verificação de banco.
• `MAILBOX_EMAIL`: e-mail usado por automações de autenticação/mailbox. Consumidores atuais: `automation-validador-final` e `automation-niche-runtime-tests`.
• `MAILBOX_PASSWORD`: senha/app password da mailbox usada por automações de autenticação/mailbox. Consumidores atuais: `automation-validador-final` e `automation-niche-runtime-tests`.
• `SUPABASE_ACCESS_TOKEN`: token usado pelo workflow de apply de migrations Supabase.
• `SUPABASE_DB_PASSWORD`: senha do banco usada pelo workflow de apply de migrations Supabase.
• `SUPABASE_APPLY_MIGRATIONS_ENABLED`: variável de repositório usada como gate operacional; valor operacional atual `true`.
• Regra: valores reais de secrets não devem ser versionados.
• Regra: secrets de mailbox devem existir apenas nos escopos necessários dos workflows que os consomem.
• Regra: `SUPABASE_DB_URL_READONLY` deve autenticar com role/usuário read-only e usar preferencialmente session pooler.
• Regra: workflows que acessam banco para inspeção devem ser read-only, salvo caso explicitamente aprovado.

2.3 Workflows conhecidos
• `.github/workflows/security.yml`: checks de segurança.
• `.github/workflows/pipeline-supabase-inspect.yml`: pipeline de inspeção Supabase read-only, com uso de `OPENAI_API_KEY` e `SUPABASE_DB_URL_READONLY`.
• `.github/workflows/pipeline-docs-apply-report.yml`: aplicação automatizada de reports em documentos Markdown e criação de Pull Request automático.
• `.github/workflows/automation-validador-final.yml`: validação ponta a ponta de fluxos reais de autenticação, com mailbox operacional via `MAILBOX_EMAIL` e `MAILBOX_PASSWORD`.
• `.github/workflows/automation-niche-runtime-tests.yml`: testes runtime de criação de conta e preenchimento de `pending_setup`, com mailbox operacional e uso opcional de `SUPABASE_DB_URL_READONLY` conforme modo de verificação.
• `.github/workflows/pipeline-supabase-apply-migrations.yml`: workflow operacional para apply automático de migrations Supabase versionadas.
• Gatilhos: push em `main` com mudanças em `supabase/migrations/**` e execução manual por `workflow_dispatch`.
• Setup: `supabase/setup-cli` v2.1.1 fixada pelo SHA completo `3c2f5e2ae34c34e428e8e206e2c4d21fa2d20fbf`, com Supabase CLI `2.106.0`.
• Motivo do pin por SHA: reprodutibilidade e proteção contra alteração futura da referência móvel `@v2`.
• Gate: `SUPABASE_APPLY_MIGRATIONS_ENABLED = true` mantém o apply automático liberado no fluxo normal; valor diferente de `true` bloqueia o apply e deve ser usado apenas em incidente ou manutenção.
• Fluxo normal: criar migration em `supabase/migrations/<timestamp>_<nome>.sql`, validar, abrir PR e fazer merge humano na `main`; o push resultante dispara o apply automático.
• Regra: não usar SQL Editor para alterações de schema no fluxo normal.
• Regra: migration aplicada não pode ser editada, apagada, renomeada ou substituída; correções e reversões exigem nova migration.
• Com o gate fechado, um passo separado sem secrets registra `skipped`; a CLI não é instalada e `supabase link` e `supabase db push` não são executados.
• `Setup Supabase CLI` e `Apply migrations` possuem condição explícita de gate aberto.
• Secrets exigidos somente para apply autorizado com gate aberto: `SUPABASE_ACCESS_TOKEN` e `SUPABASE_DB_PASSWORD`, disponíveis apenas no passo `Apply migrations`.
• Projeto alvo: definido no workflow por `SUPABASE_PROJECT_REF`; o valor não é credencial, mas deve apontar somente para o projeto aprovado.
• `workflow_dispatch` é recurso excepcional; o fluxo normal ocorre automaticamente após merge na `main`.
• `.github/workflows/upgrade-next-16-1-1.yml`: manutenção de Next.js + lockfile.

2.4 Mailbox operacional para automações
• Provedor atual: Gmail via POP3.
• Host/porta: `pop.gmail.com:995`.
• Uso: leitura programática de e-mails de confirmação e reset nas automações.
• Secrets relacionados:
• `MAILBOX_EMAIL`
• `MAILBOX_PASSWORD`
• Consumidores:
• `.github/workflows/automation-validador-final.yml`
• `.github/workflows/automation-niche-runtime-tests.yml`
• `automations/validador-final/mailbox-client.mjs`
• Regra: usar conta dedicada de teste, nunca e-mail humano principal.
• Regra: não registrar valores reais.
• Regra: se a senha/app password vazar, revogar imediatamente e substituir.

3. Vercel

3.1 Projeto Core
• Projeto Vercel: `lp-factory-10`
• Finalidade: runtime principal do produto.
• Deploy: Preview + Production.
• Domínio oficial atual do app em produção: `https://lp-factory-10.vercel.app`
• Base URL das API routes do app: `https://lp-factory-10.vercel.app/api`

3.2 Projeto de serviços
• Projeto Vercel: `lpf-10-services`
• Finalidade: serviços implantáveis separados do Core.
• Endpoint canônico MCP Supabase Inspect: `https://lpf-10-services.vercel.app/api/mcp`
• Root Directory: `services/mcp-supabase-inspect`
• Include files outside the root directory in the Build Step: `OFF`
• Ignored Build Step: customizado para reduzir builds desnecessários fora do escopo do serviço.
• Endpoint público na Vercel protegido por `Authorization: Bearer <LPF_MCP_SECRET>`.
• Banco acessado via `SUPABASE_DB_URL_READONLY`.
• Valores reais de secrets não devem ser documentados.

3.3 Runtime e build
• Node.js: `22.x`
• Regra: versão de Node deve ser conferida em Vercel > Settings > Build and Deployment > Node.js Version.
• Regra: mudança de variável de ambiente na Vercel só entra no runtime após redeploy do deployment alvo.
• Regra: testar primeiro em Preview da feature branch antes de Production, quando aplicável.

3.4 Variáveis públicas no Vercel
• `NEXT_PUBLIC_SITE_URL`
• Finalidade: origem canônica usada pelo fluxo de Auth para formar o callback `/auth/confirm`.
• Escopo: Production e Preview.
• Produção: `https://lp-factory-10.vercel.app`.
• Preview: usar a origem HTTPS do deployment validado, sem path adicional.

• `NEXT_PUBLIC_SUPABASE_URL`
• Finalidade: URL pública do projeto Supabase usado pelo app.
• Escopo: Production e Preview.
• Valor atual conhecido: `https://dpikmjgiteuafsbaubue.supabase.co`

• `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
• Finalidade: chave pública/publishable usada pelo client Supabase.
• Escopo: Production e Preview.
• Observação: é variável pública, mas deve ser registrada com mínimo necessário.

3.5 Secrets e variáveis server-side no Vercel
• `E11_MEMBERS_ENABLED`
• Finalidade: gate operacional da gestão de membros e convites.
• Escopo: Production e Preview.
• Estado atual: `true` em Production e Preview.
• Estado operacional: PR #656 mergeado, redeploy de Production concluído e smoke final aprovado em 30/07/2026.

• `E20_5_SELECTED_RESEARCH_ENABLED`
• Finalidade: gate server-only e fail-closed da leitura, seleção administrativa e consumo da pesquisa integral `end_customer` selecionada por taxon.
• Escopo: Preview e Production do projeto Core, com configuração independente por ambiente.
• Estado atual: `true` em Production; a ativação gate-on foi validada em Preview e Production em 15/08/2026. Ausência ou valor diferente do literal `true` desabilita todo acesso à nova coluna e sua interface, sem fallback de banco.
• Estado operacional: migration aplicada pelo workflow canônico, snippet SQL read-only aprovado, redeploy concluído e smokes autenticados gate-on aprovados em Preview e Production.
• Regra operacional: validar primeiro em Preview autenticado; Production só pode ser habilitada após as evidências aplicáveis, sem registrar valor sensível ou branch override como estado canônico.

• `E20_6_INPUT_CATALOG_REVIEW_ENABLED`
• Finalidade: gate server-only e fail-closed da avaliação administrativa da suficiência factual da E20.2 e da leitura do predicado derivado de preparação do taxon.
• Escopo: Preview e Production do projeto Core, com configuração independente por ambiente.
• Estado atual: `true` em Preview e Production; ausência ou valor diferente do literal `true` desabilita leitura, mutação e renderização dependentes de `reviewed_input_catalog_version`.
• Estado operacional: migration aplicada pelo workflow canônico, snippet SQL read-only aprovado, redeploy de Production concluído e Admin autenticado gate-on validado em 15/08/2026.
• Regra operacional: `E20_5_SELECTED_RESEARCH_ENABLED = true` permanece pré-requisito independente; mudanças futuras devem ser validadas primeiro em Preview autenticado antes de Production.

• `E19_5_WORKSPACE_ENABLED`
• Finalidade: gate server-only do workspace operacional de landing pages e de todo acesso aos novos objetos de configuração e aprovação da E19.5.
• Escopo: Preview e Production do projeto Core, com configuração independente por ambiente.
• Habilitação: somente o literal `true` ativa o workspace; variável ausente, vazia ou com qualquer outro valor preserva a experiência vigente e impede leitura ou mutação dos novos objetos.
• Estado atual: `true` em Preview e Production, com entradas independentes por ambiente; ausência ou valor diferente do literal `true` mantém o workspace desabilitado no ambiente correspondente.
• Progressão operacional concluída: migration e correção forward-only aplicadas, snippet read-only e Security Controls aprovados; Preview foi habilitado, redeployado e validado antes da decisão humana que autorizou a habilitação, o redeploy e o smoke focal de Production.
• Gate de evidência: a avaliação E20.6 da v5 e a decisão humana de suficiência permanecem concluídas para o taxon servido `Corretor Imóveis` (`corretor-imoveis`), com `reviewed_input_catalog_version = 5` e sem gaps candidatos. Os smokes autenticados de Preview e Production aprovaram workspace, configuração v5, histórico, preview e aprovação existente; o rollout não promoveu o marcador nem alterou a E20.6.

• `INVITE_STATE_SECRET`
• Finalidade: assinar o estado opaco transportado pelo convite nativo do Supabase Auth.
• Escopo: Production e Preview.
• Estado atual: configurada em Production e Preview, com valores independentes por ambiente e sem versionar o conteúdo.
• Estado operacional conjunto: configurado em Production e Preview; fluxo corretivo aprovado no Preview e operação final aprovada em Production.
• Regra operacional: manter configurada antes de habilitar `E11_MEMBERS_ENABLED`.

• `SUPABASE_SECRET_KEY`
• Finalidade: chave server-side Supabase para operações autorizadas do runtime.
• Escopo: Production e Preview.
• Valor real: não versionar.

• `ACCESS_CONTEXT_ENFORCED`
• Finalidade: flag de enforcement do Access Context.
• Escopo: Production e Preview.
• Valor esperado: `true`

• `ACCESS_CTX_USE_V2`
• Finalidade: flag para uso do Access Context v2.
• Escopo: Production e Preview.
• Valor esperado: `true`

• `OPENAI_API_KEY`
• Finalidade: chave server-side compartilhada pelos consumidores OpenAI de produto autorizados no Core.
• Escopo: Production e Preview.
• Estado atual: configurada em Production e Preview; os consumidores autorizados ativos compartilham a chave sem exposição do valor.
• Valor real: não versionar.
• Regra operacional: os consumidores autorizados podem compartilhar a mesma chave; não criar outra sem necessidade aprovada.

• `OPENAI_ADMIN_KEY`
• Finalidade: chave administrativa server-side usada exclusivamente pelo Core para leitura read-only do gasto oficial total na Costs API da organização.
• Escopo aprovado: Production; Preview somente mediante autorização operacional humana específica para a prova hospedada.
• Estado operacional: provisionamento, configuração na Vercel e prova real ainda não validados neste recorte; ausência local não determina o estado da plataforma.
• Separação: não substitui, não reutiliza e não pode ser exposta como `OPENAI_API_KEY`; não atravessa client, log, banco ou payload sanitizado.
• Valor real: não versionar.

• `OPENAI_LP_COST_TRACKING_ENABLED`
• Finalidade: gate server-side da persistência financeira prospectiva das tentativas de texto e imagem de Landing Pages.
• Escopo: somente Production; Preview e Development permanecem sem instrumentação financeira.
• Habilitação: somente o literal `true` ativa o tracker; variável ausente, vazia ou com qualquer outro valor preserva integralmente o runtime anterior.
• Estado inicial e atual no PR: desligado; não configurar antes do merge, apply canônico, snippet read-only e Security Controls aprovados.
• Progressão pós-merge: habilitar somente após os gates de banco, redeployar Production, executar smoke dos dois workloads e registrar uma única data de corte pela RPC versionada.
• Regra de falha: com o gate ligado, falha ao registrar o início impede a chamada OpenAI; falha terminal não altera o resultado do provider e deixa a tentativa iniciada sem terminal para reconciliação explícita.
• Valor real: não versionar.

• `OPENAI_OPERATIONAL_CONFIG_ENABLED`
• Finalidade: gate server-side temporário do cutover da configuração operacional dinâmica dos quatro workloads OpenAI de produto.
• Escopo: Preview e Production do projeto Core, com configuração independente por ambiente; Development ignora o gate e permanece no baseline local.
• Habilitação: somente o literal `true` ativa a leitura operacional no Supabase. Variável ausente, vazia ou com qualquer outro valor mantém `repo_catalog` em Preview e Production.
• Estado operacional final: configurada com `true` em Preview e Production após cutover sequencial aprovado; os dois ambientes foram redeployados com o gate ativo.
• Regra de falha: com o gate habilitado, o runtime consulta exclusivamente o Supabase a cada execução, sem cache nem fallback para `repo_catalog`.
• Progressão operacional concluída: Preview foi habilitado e aprovado antes de Production; apply, invariantes, Security Controls, smoke completo de Preview e smoke mínimo de Production foram aprovados.
• Redeploy: a habilitação ou desabilitação do gate exige redeploy do ambiente afetado; alterações ordinárias da configuração ativa após o cutover não exigem redeploy.
• Valor real por ambiente: não versionar neste documento.

• `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED`
• Finalidade: gate server-side e de UI exclusivo do rollout do provider da avaliação factual E20.6.5.
• Escopo: Preview e Production do projeto Core, com configuração independente por ambiente.
• Habilitação: somente o literal `true` autoriza a tentativa; ausente, vazio ou qualquer outro valor produz `ROLLOUT_GATE_OFF`. Somente esse retorno explícito preserva handoff Codex e registro legado.
• Condição adicional hospedada: mesmo com este gate ligado, Preview e Production recusam `repo_catalog` e a revisão bootstrap `1`; exigem resolução efetiva `supabase_operational` de revisão `2` ou posterior, já promovida com prova operacional aprovada e ativada pelo lifecycle E21.2. `OPENAI_OPERATIONAL_CONFIG_ENABLED=false` nunca constitui provider-off. Falha dessa comprovação retorna `OPERATIONAL_CONFIGURATION_UNPROVEN` e bloqueia runtime e legado, sem escrita, fallback Codex ou rotulagem gate-off.
• Estado inicial: desabilitado durante o PR #795, o merge humano, o apply e as provas operacionais do novo workload.
• Pré-condição operacional: `OPENAI_OPERATIONAL_CONFIG_ENABLED=true` já está ativo em Preview e Production e deve permanecer ativo durante todo o rollout da E20.6.5; este recorte apenas verifica essa condição e não volta a habilitar o gate da E21.2.
• Progressão operacional: após o apply da migration do novo workload, aprovar invariantes e Security Controls, verificar que o gate operacional permanece ativo em Preview e então provar, promover e ativar a revisão operacional `2` de `taxon_input_catalog_sufficiency_evaluation`; somente depois habilitar `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` em Preview, redeployar e validar. Production permanece com o gate E20.6.5 desligado até a decisão humana sobre as evidências de Preview; depois, repetir o lifecycle da revisão `2` e a habilitação controlada em Production.
• Regra de credencial: reutilizar a `OPENAI_API_KEY` compartilhada já autorizada para o provider e para autenticar, com domínio criptográfico próprio, a evidência transitória de decisão emitida pelo servidor; não criar chave específica da E20.6.5.

• Configuração efetiva dos workloads OpenAI de produto
• Fonte canônica: `lib/openai-workloads/registry.ts` mantém identidade, baseline local e allowlist; Development usa `repo_catalog` revisão `v2`, e Preview/Production usam exclusivamente `supabase_operational` com revisão decimal ativa.
• Workloads textuais validados operacionalmente: `niche_resolution` e `commercial_activation_draft_generation`, com modelo `gpt-5.4-mini` e esforço de raciocínio `none`.
• Workload textual validado no ambiente alvo: `landing_page_draft_generation`, com modelo `gpt-5.6-luna`, esforço `max`, Responses API, Structured Output estrito, `store:false` e timeout de 120 s.
• Workload de imagem validado no ambiente alvo: `landing_page_draft_image_generation`, com modelo `gpt-image-2`, saída WebP 1536 × 1024, qualidade `medium`, compressão 80, moderação `auto` e timeout de 120 s.
• Validação operacional: `niche_resolution` e `commercial_activation_draft_generation` foram executados uma única vez em Production em 10/08/2026; os Runtime Logs confirmaram sucesso e telemetria sanitizada, sem prompt, resposta integral, credencial ou dado pessoal.
• Validação dos workloads de draft: por decisão humana, o gate de canários isolados sem persistência foi substituído pelo primeiro append integrado; duas execuções integradas hospedadas em 18/08/2026 comprovaram texto, imagem e o caminho oficial sem retry ou fallback.
• Validação do cutover E21.2: Preview aprovou lifecycle e provas reais dos quatro transportes; Production aprovou leitura das quatro baselines e execução comercial real com origem `supabase_operational` e revisão 1, sem publicação, erro ou warning na janela autenticada.
• Duração da Function: o segmento produtivo permanece configurado com `maxDuration = 300`; deployment READY e duas execuções integradas completas sem timeout incompatível corroboraram operacionalmente o gate.
• Variáveis legadas de modelo na Vercel
• Nomes: `OPENAI_NICHE_RESOLVER_MODEL`, `OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL` e `OPENAI_COMMERCIAL_ACTIVATION_MODEL`.
• Escopo: Production e Preview.
• Uso runtime atual: nenhum nos consumidores de produto ativos; a configuração efetiva vem do catálogo versionado no repositório.
• Estado operacional: ausentes da configuração vigente de Production e Preview, sem branch override, após retirada controlada em 10/08/2026.
• Validação pós-retirada das variáveis legadas: `OPENAI_API_KEY` permaneceu configurada nos dois ambientes; os redeploys de Production e Preview ficaram verdes; `/admin/workloads-openai` confirmou `repo_catalog`, modelo `gpt-5.4-mini` e esforço `none` para os consumidores textuais então ativos.
• Regra: não recriar as variáveis sem necessidade futura aprovada.

• `LPF_MCP_SECRET`
• Finalidade: secret Bearer usado para autenticar chamadas ao MCP Supabase Inspect.
• Projeto Vercel: `lpf-10-services`.
• Consumidor: `services/mcp-supabase-inspect/api/mcp.js`.
• Escopo: Production e Preview, conforme deploy do service.
• Valor real: não versionar.

• `SUPABASE_DB_URL_READONLY`
• Finalidade: conexão read-only do MCP Supabase Inspect com o banco.
• Projeto Vercel consumidor: `lpf-10-services`.
• Consumidor: `services/mcp-supabase-inspect/api/mcp.js`.
• Regra: não usar para mutações.
• Valor real: não versionar.

4. Supabase

4.1 Projeto
• Projeto Supabase: `lp-factory-10`
• URL pública conhecida: `https://dpikmjgiteuafsbaubue.supabase.co`
• PostgreSQL: `17.6.1.063`
• PostgREST/Data API: `14.1`
• Auth: ativo.
• Storage: ativo.
• RLS: obrigatório para tabelas sensíveis.

4.2 Ambiente
• Estado atual: não existe ambiente Supabase STAGING ativo.
• Regra: previews usam o projeto principal neste momento.
• Regra: se houver novo staging no futuro, não manter sem controles mínimos de segurança.

4.3 JWT Signing Keys
• Current: ECC (P-256)
• Previous: Legacy HS256
• Regra: não revogar chave anterior por padrão.
• Regra: integrações futuras devem validar JWT via JWKS + `kid`.

4.4 Auth Redirect URLs
• Local: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
• Regra: permitir somente domínios/paths necessários.
• Produção: incluir URLs necessárias do domínio oficial do app.
• Localhost: incluir apenas quando necessário para desenvolvimento/teste.
• Preview Vercel: quando necessário, usar wildcard com `/**` para cobrir paths profundos.
• Regra: não usar curingas amplos fora de preview.

4.5 Supabase Auth — SMTP via Resend
• Finalidade: envio transacional de signup confirm e reset password.
• Provedor SMTP: Resend.
• Sender: `no-reply@lpfactory.com.br`
• SMTP host/porta: `smtp.resend.com:587`
• Username SMTP: `resend`
• Password SMTP: secret configurado no Supabase; não versionar.
• Regra: manter SPF/DKIM compatíveis com Resend.
• Validação atual conhecida: signup e forgot password testados, entrega confirmada, links funcionais e sem erro de envio.

4.6 Supabase Auth — convite de membro
• Auth Hook: ausência de hook configurado confirmada operacionalmente em 27/07/2026.
• Envio: usar o convite nativo `inviteUserByEmail`; não configurar envio customizado no Core.
• Template: `Invite user` configurado em português do Brasil em 28/07/2026; o estado assinado é codificado no `redirectTo` específico de cada emissão e transportado por `{{ .RedirectTo }}`, sem `data` ou `user_metadata` compartilhado.
• Link aprovado para o template: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite`.
• Redirect de Production: `https://lp-factory-10.vercel.app/auth/confirm` cadastrado na allowlist do Supabase Auth em 28/07/2026.
• Redirect de Preview: wildcard restrito a `https://*-alcino-afonsos-projects.vercel.app/**` confirmado na allowlist; a prova deve usar somente o deployment autorizado.
• Email OTP Expiration: `3600` segundos confirmados no Dashboard em 28/07/2026; o Core não adiciona validade local paralela.
• Estado: template, redirects e expiração configurados; correção do transporte concorrente implementada e testes humanos hospedados aprovados no Preview autorizado da fase `11.1.7`.
• Estado final: PR #656 mergeado; gate habilitado em Production; redeploy concluído; smoke final aprovado na página de membros e convites.
• Evidência hospedada aprovada: convite novo, reenvio idempotente, link adulterado rejeitado, link legítimo concluído com definição de senha antes da ativação, dois convites concorrentes para contas diferentes e isolamento entre memberships por `account_user_id`.

4.7 Acesso operacional read-only para automações
• Role operacional read-only: `ai_readonly`.
• Secret relacionado: `SUPABASE_DB_URL_READONLY`.
• Uso: inspeções e verificações read-only em automações.
• Regra: não usar esse acesso para mutações.
• Regra: revisar permissões antes de ampliar o escopo operacional.

4.8 Storage privado das revisões de landing page
• Bucket definido no repositório: `landing-page-revision-assets`.
• Estado operacional: ativo e configurado no ambiente hospedado pela migration E19.4.4 aplicada; readiness e verificador SQL read-only aprovados em 18/08/2026.
• Configuração aprovada: privado, limite de 5 MB e MIME permitido somente `image/webp`.
• Acesso do produto: exclusivamente server-side por service role; nenhuma policy direta para anon ou authenticated.
• Identidade do asset: bucket e path estáveis; URL assinada temporária somente no consumo autorizado e nunca persistida.

5. Resend

5.1 Uso
• Finalidade: envio transacional usado pelo Supabase Auth.
• Domínio verificado: `lpfactory.com.br`
• Plano atual conhecido: Free.
• Sender usado: `no-reply@lpfactory.com.br`
• Uso atual: indireto via Supabase Auth SMTP.
• O app Core não chama a API Resend diretamente no runtime.
• Não há SDK Resend versionado no repositório no estado atual.

5.2 DNS relacionado
• SPF/DKIM devem permanecer compatíveis com Resend.
• Regra: não alterar SPF raiz sem avaliar impacto em e-mails humanos/corporativos.
• Regra: Resend permanece para envio transacional, não para mailbox humano.

6. OpenAI Platform

6.1 Projects
• Project DEV: `LPF10-DEV`
• Project PROD: `LPF10-PROD`
• Sharing atual conhecido: “Enabled for selected projects” com apenas `LPF10-DEV` selecionado.
• Regra: Default e PROD não devem compartilhar por padrão.

6.2 Service Accounts e keys
• Service Account criada no `LPF10-DEV` para uso em DEV.
• Estado final conhecido: 1 key ativa no `LPF10-DEV`.
• Regra: manter apenas keys necessárias ativas.
• Regra: revogar imediatamente keys expostas ou indevidas.

6.3 Variáveis relacionadas
• `OPENAI_API_KEY`
• Plataforma: Vercel e/ou GitHub Actions, conforme uso.
• Finalidade: autenticação com OpenAI API; no Core, a mesma chave server-side pode atender os consumidores de produto autorizados.
• Valor real: não versionar.

• A seleção de modelo, esforço ou configuração de mídia dos workloads OpenAI de produto não usa variáveis Vercel; Development usa o baseline versionado no repositório e Preview/Production resolvem a revisão ativa no Supabase por meio do gate operacional registrado em 3.5.
• As três variáveis legadas de modelo estão ausentes da configuração vigente da Vercel conforme 3.5.

6.3.1 Endpoint externo atual
• Endpoint OpenAI Responses API: `https://api.openai.com/v1/responses`
• Endpoint OpenAI Images API: `https://api.openai.com/v1/images/generations`
• Endpoint OpenAI Costs API: `https://api.openai.com/v1/organization/costs`
• Consumidor versionado da Costs API: `lib/openai-costs/providers/openAiCostsProvider.ts`, exclusivamente server-side e autenticado por `OPENAI_ADMIN_KEY`.
• Persistência prospectiva dos dois workloads de LP: `lib/openai-costs/adapters/lpCostTrackingAdapter.ts`, exclusivamente server-side, condicionada a Production e a `OPENAI_LP_COST_TRACKING_ENABLED=true`.
• Leitura agregada interna: `lib/openai-costs/adapters/lpCostReadModelAdapter.ts`, exclusivamente server-side via RPC read-only paginada; superfície administrativa em `/admin/custos-openai`.
• Consumidores atuais conhecidos:
• `lib/conversion-content/adapters/commercialActivationOpenAiAdapter.ts`
• `lib/conversion-content/adapters/landingPageGenerationProfileOpenAiAdapter.ts`
• `lib/lp-builder/adapters/landingPageDraftGenerationAdapter.ts`
• `lib/lp-builder/adapters/landingPageDraftImageGenerationAdapter.ts`
• `lib/lp-builder/adapters/landingPageGenerationOpenAiAdapter.ts`
• `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
• `automations/supabase-inspect/run.mjs`
• Regra: novas APIs ou endpoints OpenAI devem ser registrados aqui quando virarem dependência operacional.

6.4 Agent Builder — Supabase Inspect
• Ativo operacional: Supabase Inspect Agente.
• Workflow ID: `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7`.
• Uso: validação operacional do Supabase Inspect via Agent Builder.
• Regra: não tratar como camada final robusta de orquestração.
• Dependência: MCP Supabase Inspect em `https://lpf-10-services.vercel.app/api/mcp`.

7. Stripe

7.1 Uso
• Finalidade: provedor inicial de checkout e webhook do E9.
• Ambiente atual validado: teste.
• Modo: `subscription`.
• O app cria Checkout Session server-side.
• Webhook mínimo produtivo validado em `POST /api/stripe/webhook`.
• `invoice.paid` ativa/renova entitlement local.
• Redirect de sucesso não confirma pagamento e não libera entitlement.

7.2 Endpoint usado pelo app
• Checkout Sessions API: `https://api.stripe.com/v1/checkout/sessions`
• Regra: chamada somente server-side.
• Regra: não expor secret Stripe no client.
• Webhook Stripe: `POST /api/stripe/webhook`
• Endpoint externo usado para subscription lookup: `https://api.stripe.com/v1/subscriptions`
• Regra: webhook exige assinatura Stripe válida.
• Regra: payload bruto Stripe não deve ser persistido.

7.3 Vercel — secrets e variáveis Stripe
• `STRIPE_SECRET_KEY`
• Finalidade: secret server-side Stripe para criar Checkout Sessions.
• Plataforma: Vercel.
• Escopo conhecido: Production validado; Preview quando necessário para testes.
• Valor real: não versionar.

• `STRIPE_WEBHOOK_SECRET`
• Finalidade: secret server-side para validação da assinatura do webhook Stripe.
• Plataforma: Vercel.
• Escopo conhecido: Production validado.
• Valor real: não versionar.

Products/Prices de teste
• `STRIPE_TEST_STARTER_MONTHLY_PRODUCT_ID`
• `STRIPE_TEST_STARTER_MONTHLY_PRICE_ID`
• `STRIPE_TEST_STARTER_ANNUAL_PRODUCT_ID`
• `STRIPE_TEST_STARTER_ANNUAL_PRICE_ID`
• `STRIPE_TEST_LITE_MONTHLY_PRODUCT_ID`
• `STRIPE_TEST_LITE_MONTHLY_PRICE_ID`
• `STRIPE_TEST_LITE_ANNUAL_PRODUCT_ID`
• `STRIPE_TEST_LITE_ANNUAL_PRICE_ID`
• `STRIPE_TEST_PRO_MONTHLY_PRODUCT_ID`
• `STRIPE_TEST_PRO_MONTHLY_PRICE_ID`
• `STRIPE_TEST_PRO_ANNUAL_PRODUCT_ID`
• `STRIPE_TEST_PRO_ANNUAL_PRICE_ID`
• `STRIPE_TEST_ULTRA_MONTHLY_PRODUCT_ID`
• `STRIPE_TEST_ULTRA_MONTHLY_PRICE_ID`
• `STRIPE_TEST_ULTRA_ANNUAL_PRODUCT_ID`
• `STRIPE_TEST_ULTRA_ANNUAL_PRICE_ID`

Regra:
• Registrar apenas nomes e finalidade das envs.
• Nunca versionar Product IDs, Price IDs, secret key, session ID, customer ID ou subscription ID reais.
• Alteração de env Stripe na Vercel exige redeploy do deployment alvo.

7.4 Redirects de checkout
• Success URL: gerada server-side a partir do origin da requisição.
• Cancel URL: gerada server-side a partir do origin da requisição.
• Redirect de sucesso não confirma pagamento e não libera entitlement.
• Confirmação de pagamento/assinatura deve ocorrer por webhook em fase própria.

8. Domínios e DNS

8.1 Domínios conhecidos
• `lpfactory.com.br`
• Uso: domínio da marca/projeto LP Factory.
• Status conhecido: registrado e publicado.

• `unicodigital.com.br`
• Uso: domínio relacionado à Unico Digital e e-mail corporativo existente.

8.2 Registro.com
• Uso: registrar e gerenciar DNS/domínios quando aplicável.
• Regra: alterações DNS devem ser feitas com cuidado, preservando e-mail humano/corporativo e entregabilidade transacional.

8.3 E-mail humano/corporativo
• Provedor conhecido: Zoho Mail para `unicodigital.com.br`.
• Direção operacional: e-mails humanos da LP Factory devem usar provedor humano/corporativo, como Zoho/M365/Workspace, não Resend.
• Resend deve permanecer como transacional.

9. Regras operacionais de mudança

9.1 Alteração de env na Vercel
• Alterar variável no ambiente correto: Preview, Production ou ambos.
• Executar redeploy após alteração.
• Validar primeiro em Preview quando for alteração de feature ou risco operacional.
• Só promover para Production após validação mínima.

9.2 Alteração de SMTP/Auth
• Validar signup confirm.
• Validar forgot password.
• Confirmar que links funcionam.
• Confirmar que não houve erro de envio.
• Não expor senha SMTP em prints, logs ou chat.

9.3 Alteração de DNS
• Identificar o registro atual antes de alterar.
• Avaliar impacto em site, e-mail humano e e-mail transacional.
• Não substituir SPF/DKIM/DMARC sem mapear dependências.
• Registrar mudança em relatório operacional quando houver impacto.

9.4 Alteração de GitHub Actions secrets
• Não registrar valor real.
• Confirmar qual workflow consome o secret.
• Confirmar ambiente/escopo.
• Reexecutar workflow necessário após alteração.

10. Relação com outros documentos

10.1 Base Técnica
• `docs/base-tecnica.md` deve manter regras de implementação, runtime, segurança, adapters e observability.
• Configurações de plataforma devem morar neste documento.
• Quando a Base Técnica depender de uma configuração, deve referenciar este documento de forma curta.

10.2 Schema
• `docs/schema.md` permanece como fonte única para objetos de banco, RLS, policies, RPCs, triggers, constraints, grants e permissões de DB.

10.3 Roadmap
• `docs/roadmap.md` permanece como fonte única para estado final dos casos E*, escopo, artefatos, status e pendências.

10.4 Design System
• `docs/design-system.md` permanece como fonte única para padrões visuais, componentes UI e regras de uso visual.


10.5 Automations
• `docs/automations.md` permanece como fonte para catálogo, uso, status, dependências e aprendizados das automações.
• Configurações de plataformas, secrets por nome, workflows, ambientes e endpoints usados por automações devem ser registrados neste documento.

99. Changelog
v0.1.29 — 28/08/2026 — Registrados `OPENAI_ADMIN_KEY`, Costs API, `OPENAI_LP_COST_TRACKING_ENABLED` nascendo desligado e o rollout pós-merge da persistência prospectiva dos dois workloads de Landing Page.

v0.1.18 — 21/08/2026 — Registrado o gate exclusivo do provider E20.6.5, sua composição obrigatória com fonte `supabase_operational` hospedada e a preservação do handoff Codex durante o estado gate-off.

v0.1.17 — 20/08/2026 — Registrado `OPENAI_OPERATIONAL_CONFIG_ENABLED`, seus defaults gate-off, habilitação pelo literal `true`, isolamento por ambiente, progressão Preview → Production e regras de redeploy/fail-closed da E21.2.3.

v0.1.16 — 31/07/2026 — Registradas a correção de `OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL` para `gpt-5.4-mini`, a ampliação para Production e Preview, o redeploy e a validação operacional da assistência somente em Production no domínio oficial.

v0.1.15 — 30/07/2026 — Registrados o merge do PR #656, a habilitação do gate, o redeploy e o smoke final aprovado em Production.

v0.1.14 — 30/07/2026 — Registrada a aprovação dos testes humanos da correção do transporte concorrente no Preview autorizado, removida a pendência de reteste e mantida Production desabilitada até o merge humano do PR #656.

v0.1.13 — 28/07/2026 — Corrigido o transporte do estado assinado por emissão no `RedirectTo` do convite nativo, removida a dependência de metadata compartilhado e preparado o reteste hospedado restrito, com Production desabilitada.

v0.1.12 — 28/07/2026 — Registrada a prova hospedada aprovada da E11.1.7 no Preview autorizado e preservado o gate de Production até o merge humano e o smoke pós-merge.

v0.1.11 — 28/07/2026 — Registrada `OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL`, seus ambientes, estado pendente e consumidor server-side da E12.4.3.

v0.1.10 — 28/07/2026 — Registradas as variáveis da E11 configuradas em Production e Preview, os redeploys concluídos e a configuração remanescente do Supabase Auth.

v0.1.8 — 02/07/2026 — Configuração Stripe atualizada com uso de webhook produtivo, endpoint `/api/stripe/webhook`, lookup de subscriptions e secret `STRIPE_WEBHOOK_SECRET`.

v0.1.7 — 25/06/2026 — Atualizado `OPENAI_COMMERCIAL_ACTIVATION_MODEL` para escopo Production e Preview, com referência `gpt-5.4-mini` e regra operacional de não prender configuração a branch no MVP.

v0.1.6 — 23/06/2026 — Registrado o estado operacional de `OPENAI_COMMERCIAL_ACTIVATION_MODEL` para E10.7 Fase 3: configurada e validada em Vercel Preview com modelo de referência, Production pendente de decisão operacional e sem exposição de secrets.

v0.1.5 (22/06/2026) — Registrada a variável `OPENAI_COMMERCIAL_ACTIVATION_MODEL` como configuração server-side da geração administrativa de drafts `commercial_activation`, sem versionar valor real nem modelo padrão definitivo.

v0.1.4 (12/06/2026) — Apply automático de migrations Supabase liberado
• Registrado `SUPABASE_APPLY_MIGRATIONS_ENABLED = true` como estado operacional normal.
• Consolidado o fluxo PR, merge na `main` e apply automático.
• Registradas as regras de não uso do SQL Editor e histórico forward-only com reversão por nova migration.

v0.1.3 (11/06/2026) — Workflow de migrations Supabase reproduzível e mantido bloqueado
• Registrados `supabase/setup-cli` v2.1.1 fixada por SHA completo, Supabase CLI `2.106.0`, gatilhos, secrets e variável de gate do workflow.
• Documentado que gate fechado usa passo separado sem secrets, sem instalar a CLI nem executar `supabase link` ou `supabase db push`.
• Restringidos os secrets de apply ao passo condicionado ao gate aberto.
• Reforçado que o workflow e o apply automático ainda não estão liberados.

v0.1.2 (27/05/2026) — Clarificação de snapshot operacional
• Clarificado que o Platform Config reflete o estado conhecido/cadastrado nas plataformas.
• Definida a leitura operacional para secrets, variáveis, workflows, endpoints e conectores listados.
• Reforçado que valores reais de secrets não são versionados e devem ser consumidos apenas por plataformas autorizadas.

v0.1.1 (26/05/2026) — Alinhamento com Automations
• Registrados secrets de mailbox usados por automações.
• Complementada a lista de workflows operacionais conhecidos.
• Registrado acesso operacional read-only `ai_readonly`/`SUPABASE_DB_URL_READONLY`.
• Registrado ativo Agent Builder — Supabase Inspect.
• Definida relação entre Platform Config e Automations.

v0.1.0 (15/05/2026) — Criação do Platform Config
• Criado documento inicial para centralizar configurações operacionais de plataformas.
• Registradas plataformas em uso: GitHub, Vercel, Supabase, Resend, OpenAI Platform, Registro.com e Zoho Mail.
• Registradas variáveis, endpoints e regras operacionais conhecidas sem incluir valores reais de secrets.
• Definida a separação documental entre Platform Config, Base Técnica, Schema, Roadmap e Design System.

0. Introdução

0.1 Cabeçalho
• Documento: LP Factory 10 — Platform Config
• Versão: v0.1.6
• Data: 23/06/2026

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
• `NEXT_PUBLIC_SUPABASE_URL`
• Finalidade: URL pública do projeto Supabase usado pelo app.
• Escopo: Production e Preview.
• Valor atual conhecido: `https://dpikmjgiteuafsbaubue.supabase.co`

• `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
• Finalidade: chave pública/publishable usada pelo client Supabase.
• Escopo: Production e Preview.
• Observação: é variável pública, mas deve ser registrada com mínimo necessário.

3.5 Secrets e variáveis server-side no Vercel
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
• Finalidade: chave server-side da OpenAI para resolvedor IA e/ou integrações server-side autorizadas.
• Escopo: Production e Preview, conforme necessidade do recurso.
• Valor real: não versionar.

• `OPENAI_NICHE_RESOLVER_MODEL`
• Finalidade: modelo usado pelo resolvedor IA de nicho.
• Escopo: Production e Preview.
• Valor atual de referência: `gpt-5.4-mini`
• Regra: deve conter apenas o ID do modelo; nunca inserir `OPENAI_API_KEY` nessa variável.

• `OPENAI_COMMERCIAL_ACTIVATION_MODEL`
• Finalidade: modelo usado pela geração administrativa server-side de drafts `commercial_activation` da E10.7.
• Escopo validado em 25/06/2026: Production e Preview, sem branch customizada na Vercel.
• Valor atual de referência em Preview: `gpt-5.4-mini`
• Valor real de secret: não versionar.
• Regra: deve conter apenas o ID do modelo; nunca inserir `OPENAI_API_KEY` nessa variável.

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


4.6 Acesso operacional read-only para automações
• Role operacional read-only: `ai_readonly`.
• Secret relacionado: `SUPABASE_DB_URL_READONLY`.
• Uso: inspeções e verificações read-only em automações.
• Regra: não usar esse acesso para mutações.
• Regra: revisar permissões antes de ampliar o escopo operacional.

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
• Finalidade: autenticação com OpenAI API.
• Valor real: não versionar.

• `OPENAI_NICHE_RESOLVER_MODEL`
• Plataforma: Vercel.
• Finalidade: selecionar modelo do resolvedor IA de nicho.
• Valor atual de referência: `gpt-5.4-mini`

• `OPENAI_COMMERCIAL_ACTIVATION_MODEL`
• Plataforma: Vercel.
• Finalidade: selecionar o modelo usado pela geração administrativa server-side de drafts `commercial_activation`.
• Valor real: não versionar.

6.3.1 Endpoint externo atual
• Endpoint OpenAI Responses API: `https://api.openai.com/v1/responses`
• Consumidores atuais conhecidos:
• `lib/conversion-content/commercial-activation/draft-generation.ts`
• `lib/onboarding/niche-resolution/adapters/openAiResolver.ts`
• `automations/supabase-inspect/run.mjs`
• Regra: novas APIs ou endpoints OpenAI devem ser registrados aqui quando virarem dependência operacional.

6.4 Agent Builder — Supabase Inspect
• Ativo operacional: Supabase Inspect Agente.
• Workflow ID: `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7`.
• Uso: validação operacional do Supabase Inspect via Agent Builder.
• Regra: não tratar como camada final robusta de orquestração.
• Dependência: MCP Supabase Inspect em `https://lpf-10-services.vercel.app/api/mcp`.

7. Domínios e DNS

7.1 Domínios conhecidos
• `lpfactory.com.br`
• Uso: domínio da marca/projeto LP Factory.
• Status conhecido: registrado e publicado.

• `unicodigital.com.br`
• Uso: domínio relacionado à Unico Digital e e-mail corporativo existente.

7.2 Registro.com
• Uso: registrar e gerenciar DNS/domínios quando aplicável.
• Regra: alterações DNS devem ser feitas com cuidado, preservando e-mail humano/corporativo e entregabilidade transacional.

7.3 E-mail humano/corporativo
• Provedor conhecido: Zoho Mail para `unicodigital.com.br`.
• Direção operacional: e-mails humanos da LP Factory devem usar provedor humano/corporativo, como Zoho/M365/Workspace, não Resend.
• Resend deve permanecer como transacional.

8. Regras operacionais de mudança

8.1 Alteração de env na Vercel
• Alterar variável no ambiente correto: Preview, Production ou ambos.
• Executar redeploy após alteração.
• Validar primeiro em Preview quando for alteração de feature ou risco operacional.
• Só promover para Production após validação mínima.

8.2 Alteração de SMTP/Auth
• Validar signup confirm.
• Validar forgot password.
• Confirmar que links funcionam.
• Confirmar que não houve erro de envio.
• Não expor senha SMTP em prints, logs ou chat.

8.3 Alteração de DNS
• Identificar o registro atual antes de alterar.
• Avaliar impacto em site, e-mail humano e e-mail transacional.
• Não substituir SPF/DKIM/DMARC sem mapear dependências.
• Registrar mudança em relatório operacional quando houver impacto.

8.4 Alteração de GitHub Actions secrets
• Não registrar valor real.
• Confirmar qual workflow consome o secret.
• Confirmar ambiente/escopo.
• Reexecutar workflow necessário após alteração.

9. Relação com outros documentos

9.1 Base Técnica
• `docs/base-tecnica.md` deve manter regras de implementação, runtime, segurança, adapters e observability.
• Configurações de plataforma devem morar neste documento.
• Quando a Base Técnica depender de uma configuração, deve referenciar este documento de forma curta.

9.2 Schema
• `docs/schema.md` permanece como fonte única para objetos de banco, RLS, policies, RPCs, triggers, constraints, grants e permissões de DB.

9.3 Roadmap
• `docs/roadmap.md` permanece como fonte única para estado final dos casos E*, escopo, artefatos, status e pendências.

9.4 Design System
• `docs/design-system.md` permanece como fonte única para padrões visuais, componentes UI e regras de uso visual.


9.5 Automations
• `docs/automations.md` permanece como fonte para catálogo, uso, status, dependências e aprendizados das automações.
• Configurações de plataformas, secrets por nome, workflows, ambientes e endpoints usados por automações devem ser registrados neste documento.

99. Changelog
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

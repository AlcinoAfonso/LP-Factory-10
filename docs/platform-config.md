0. Introdução

0.1 Cabeçalho
• Documento: LP Factory 10 — Platform Config
• Versão: v0.1.0
• Data: 15/05/2026

0.2 Contrato do documento
• O QUE É: fonte única de configurações operacionais de plataformas externas do LP Factory 10.
• USAR PARA: variáveis, secrets por nome, endpoints, URLs, redirects, SMTP, DNS, projetos externos, ambientes e regras de redeploy.
• NÃO USAR PARA: regras de runtime/código, contrato de DB, status de casos E* ou padrões visuais.
• REGRA: nunca registrar valores reais de secrets; registrar apenas nome, finalidade, plataforma e escopo.

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

2.2 GitHub Actions
• Secrets conhecidos:
• `OPENAI_API_KEY`: usado por automações/CI que chamam OpenAI.
• `SUPABASE_DB_URL_READONLY`: conexão read-only para inspeções/automação de banco.
• Regra: `SUPABASE_DB_URL_READONLY` deve autenticar com role/usuário read-only e usar preferencialmente session pooler.
• Regra: workflows que acessam banco para inspeção devem ser read-only, salvo caso explicitamente aprovado.

2.3 Workflows conhecidos
• `.github/workflows/security.yml`: checks de segurança.
• `.github/workflows/pipeline-supabase-inspect.yml`: pipeline de inspeção Supabase.
• `.github/workflows/upgrade-next-16-1-1.yml`: manutenção de Next.js + lockfile.

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

• `STRIPE_SECRET_KEY`
• Finalidade: secret futuro para integração Stripe.
• Status: futuro.
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

5. Resend

5.1 Uso
• Finalidade: envio transacional usado pelo Supabase Auth.
• Domínio verificado: `lpfactory.com.br`
• Plano atual conhecido: Free.
• Sender usado: `no-reply@lpfactory.com.br`

5.2 DNS relacionado
• SPF/DKIM devem permanecer compatíveis com Resend.
• Regra: não alterar SPF raiz sem avaliar impacto em e-mails humanos/corporativos.
• Regra: Resend permanece para envio transacional, não para mailbox humano.

5.3 Evolução futura
• Quando houver escala, avaliar subdomínio dedicado, por exemplo `mail.lpfactory.com.br`, para isolar reputação.
• Essa evolução pode exigir plano pago e novos registros DNS.

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

99. Changelog
v0.1.0 (15/05/2026) — Criação do Platform Config
• Criado documento inicial para centralizar configurações operacionais de plataformas.
• Registradas plataformas em uso: GitHub, Vercel, Supabase, Resend, OpenAI Platform, Registro.com e Zoho Mail.
• Registradas variáveis, endpoints e regras operacionais conhecidas sem incluir valores reais de secrets.
• Definida a separação documental entre Platform Config, Base Técnica, Schema, Roadmap e Design System.

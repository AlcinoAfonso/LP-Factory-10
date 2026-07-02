# Gestor Codex — LP Factory 10

## 1. Objetivo

Este painel resume os recursos do Codex App relevantes para o LP Factory 10, sem repetir as regras operacionais do repositório.

## 2. Referências

Estas fontes concentram regras, execução e detalhes que não precisam ser duplicados aqui.

* `AGENTS.md` — regras operacionais.
* `docs/prompt-executor.md` — execução do Executor.
* `docs/platform-config.md` — configuração da plataforma.

## 3. Configurações

Configurações sustentam o fluxo local adotado para editar, validar e publicar trabalho.

### Modo Personalizado (`config.toml`)

**Aptidão:** trabalho Git local.
**Estado:** adotado.
**Valor:** oferece ambiente controlado para execução e validação.
**Limite:** não substitui `AGENTS.md`.

### Personalizar o Codex

**Aptidão:** usar arquivos do projeto e apps conectados para sugerir próximos passos no Codex App.
**Estado:** aprovado como recurso auxiliar.
**Valor:** reduz perda de contexto entre chats e ajuda a lembrar frentes pendentes, arquivos relacionados e continuidade de E9, E10.7, E19 e demais recortes.
**Limite:** sugestões do Codex não viram decisão automaticamente; execução continua seguindo `AGENTS.md`; alterações no repositório devem seguir branch + PR; ações em Vercel, Stripe, Supabase ou GitHub exigem prompt explícito por tarefa.

### Git local e `git push`

**Aptidão:** versionar e publicar branches.
**Estado:** validado.
**Valor:** conclui o fluxo local sem interface gráfica.
**Limite:** requer remote e autenticação válidos.

**Outras configurações:** GitHub Web é a fonte de verdade para PRs, Actions, preview e merge; GitHub Desktop está fora do fluxo principal; não há hooks, conexões ou worktrees ativos.

## 4. Plugins

Plugins aproximam serviços externos das tarefas de investigação e execução.

### Supabase Plugin

**Aptidão:** leitura e escrita no Supabase.
**Estado:** em teste; leitura aprovada.
**Valor:** acelera a investigação de schema, tabelas, RLS, policies, views, functions, índices, extensões e migrations.
**Limite:** escrita não testada nem aprovada.

### GitHub Plugin

**Aptidão:** acessar repositórios, branches remotas, PRs, issues, checks e Actions no GitHub.
**Estado:** em teste.
**Valor:** permite investigar branches/PRs e falhas de CI diretamente no GitHub remoto, inclusive quando a branch não está disponível no clone local.
**Limite:** não substitui o fluxo Git local para implementar código nem o GitHub Web como referência final para PR, Actions, preview e merge.

### Vercel Plugin

**Aptidão:** leitura e possível operação/configuração na Vercel.
**Estado:** em teste; leitura aprovada.
**Valor:** acelera diagnóstico de deploys, previews, build logs, runtime, endpoints e configurações Vercel.
**Limite:** escrita, deploy manual, variáveis de ambiente, domínios, settings e ações em produção não testados nem aprovados.

### OpenAI Developers Plugin

**Aptidão:** apoiar desenvolvimento com OpenAI API, configuração segura de API key, avaliação de Responses API, Agents SDK, ChatGPT Apps SDK e troubleshooting de chamadas OpenAI.
**Estado:** em teste; uso aprovado apenas como apoio técnico e consultivo.
**Valor:** ajuda a reduzir risco na configuração de `OPENAI_API_KEY`, orientar uso correto das APIs OpenAI e avaliar protótipos controlados de agentes ou apps antes de qualquer adoção.
**Limite:** não implementar agente, automação, ChatGPT App, SDK ou chamada OpenAI em runtime sem caso real aprovado; não expor secrets; não criar nova arquitetura para o MVP; seguir `docs/gestor-automations.md` para decidir entre Responses API, automação simples, Agents SDK ou Sandbox Agents.

### Stripe Plugin

**Aptidão:** apoio consultivo e operacional em modo teste para boas práticas de billing, trial e entitlements da futura E9.
**Estado:** em teste; MCP autorizado na área restrita.
**Conta Stripe:** LP Factory; e-mail não informado neste ajuste.
**Ambiente:** modo teste / área restrita; produção não ativada.
**Configuração:** após refresh/reinstalação, a sessão passou a expor `_stripe_api_search`, `_stripe_api_details`, `_stripe_api_write`, `_get_stripe_account_info` e `_search_stripe_documentation`.
**Operações confirmadas:** `GetProducts`, `GetPrices`, `PostProducts` e `PostPrices` disponíveis para listar/criar Products e Prices.
**Permissões de escrita aprovadas em teste:** Customers, Products, Prices, Subscriptions e Payment Links.
**Permissões de leitura aprovadas:** Accounts, Balance, Charges and Refunds, Invoices, Personally Identifiable Information, Payment Intents, Payment Method Configurations e Payout Settings.
**Sem autorização:** produção, Branding Settings, Coupons, Payment Disputes, Promotion Codes, refunds, payouts, impostos, contas bancárias, transferências e webhooks.
**Valor:** o plugin deve simplificar a E9 usando recursos nativos do Stripe para Products, Prices, Customers, Subscriptions e Payment Links, evitando implementação manual paralela de billing quando o Stripe já resolve o fluxo comercial.
**Limite:** qualquer escrita exige autorização humana explícita por ação; não registrar chaves Stripe no repositório; não usar produção; não criar, alterar ou excluir objetos fora do escopo aprovado da E9.
**Pendência:** antes de criar a matriz Product/Price, confirmar no próprio Codex/Stripe que a operação está em modo teste e aprovar os valores dos 8 Prices.

**Disponíveis não adotados:** Slack.

## 5. Skills

Skills podem transformar procedimentos recorrentes em capacidades reutilizáveis.

Nenhuma skill foi adotada formalmente após a reinstalação. Skills do Supabase permanecem no registro do Supabase Plugin para evitar duplicação.

**Disponíveis não adotadas:** Spreadsheets e Presentations.

## 6. Uso do computador e navegador

Esses recursos podem ampliar validações visuais e interações fora do terminal.

**Disponíveis não adotados:** Computer Use e Chrome. O navegador integrado está disponível, mas ainda não tem adoção final.

## 7. Próximos testes

Os testes devem gerar evidência suficiente para adotar, limitar ou descartar recursos.

1. Validar uma worktree em uma frente paralela real.
2. Ampliar testes de leitura do Supabase Plugin, sem escrita.
3. Selecionar um procedimento candidato a skill.
4. Comparar Chrome e navegador integrado em uma validação visual.

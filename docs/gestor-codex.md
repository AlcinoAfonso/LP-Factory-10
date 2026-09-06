# Gestor Codex — LP Factory 10

## 1. Objetivo

Este painel resume os recursos do Codex App relevantes para o LP Factory 10, sem repetir as regras operacionais do repositório.

Não é contrato de execução nem fonte padrão do Executor. Consultá-lo somente quando a tarefa exigir avaliar, configurar ou diagnosticar capacidades do próprio Codex App.

## 2. Referências

Estas fontes delimitam o painel e não constituem checklist de leitura do Executor.

* `AGENTS.md` — regras operacionais.
* `.agents/skills/lp-factory-executar-plano/SKILL.md` — contrato único do Executor.
* `docs/platform-config.md` — configuração da plataforma.

## 3. Configurações

Configurações sustentam o fluxo local adotado para editar, validar e publicar trabalho.

### Modo Personalizado (`config.toml`)

**Aptidão:** trabalho Git local.
**Estado:** adotado.
**Valor:** oferece ambiente controlado para execução e validação.
**Limite:** não substitui `AGENTS.md`.

### Checkout Local e Worktrees

**Aptidão:** manter a base do projeto carregada pelo Codex App alinhada à fonte canônica e isolar implementações quando necessário.
**Estado:** validado em 06/09/2026 após correção dos nós de checkout inicial e descoberta de skills.
**Regra operacional:** como estado-base para novas tasks e descoberta de skills, o checkout `Local` deve estar em `main`, sincronizada com `origin/main` e com working tree limpa. No modo simples definido por `AGENTS.md`, a própria task pode criar e trabalhar em branch dedicada no `Local`; ao encerrar essa frente e retornar o projeto ao estado-base, o `Local` deve voltar a `main` atualizada e limpa. Tasks paralelas ou que exijam isolamento devem iniciar em `Worktree`, selecionando `main` como base; não deixar o checkout `Local` persistir entre tasks em branch antiga de implementação.
**Valor:** garante que novas tasks carreguem o pipeline e as skills atuais desde o início e reduz investigação causada por sessões abertas sobre branch obsoleta.
**Aprendizado:** o checkout `Local` preso em `codex-app/e22-3-orquestracao` deixou a `main` local 165 commits atrasada; nesse estado, `docs/pipeline-plano-base.md` e `$lp-factory-estrategista-autonomo` não eram encontrados nativamente. Após retornar o checkout a `main`, executar `git pull --ff-only` e alinhar `HEAD`, `main` e `origin/main`, uma nova sessão reconheceu a skill nativamente no catálogo.
**Limite:** criação, isolamento, sincronização, publicação e continuidade de branches/PRs continuam regidos por `AGENTS.md`; PR aberto não deve ser sincronizado com `main` apenas porque ela avançou.

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

### GitHub CLI (`gh`)

**Aptidão:** criar PRs e consultar PRs, checks e diffs pelo terminal.
**Estado:** instalado e autenticado localmente.
**Uso:** teste controlado.
**Valor:** agiliza a criação de PRs e a consulta de PRs, checks e diffs pelo terminal.
**Limite:** seguir as regras operacionais de `AGENTS.md`.
**Aprendizado:** para operações GitHub no ambiente local, usar diretamente os recursos nativos do `gh`; scripts auxiliares em Python não foram adotados. O fluxo operacional está definido no `AGENTS.md`.

**Outras configurações:** GitHub Web é a fonte de verdade para PRs, Actions, preview e merge; GitHub Desktop está fora do fluxo principal; worktrees seguem a regra operacional desta seção.

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
**Limite:** não implementar agente, automação, ChatGPT App, SDK ou chamada OpenAI em runtime sem caso real aprovado; não expor secrets; não criar nova arquitetura para o MVP; seguir `docs/gestor-automations.md` para decidir a natureza e o ambiente da solução e, quando aplicável, recomendar Responses API, Agents SDK ou Sandbox Agent.

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

`$lp-factory-executar-plano` está formalmente adotada como contrato operacional do Executor. Essa adoção pertence ao fluxo do projeto e não transforma este painel em fonte de execução.

Skills versionadas do projeto são descobertas a partir de `$REPO_ROOT/.agents/skills` do checkout inicial da sessão. Se uma skill existente na `main` não aparecer no catálogo, verificar primeiro a regra de Checkout Local e Worktrees da seção 3 antes de alterar a própria skill.

Recursos adicionais de Skills do ambiente Codex permanecem em avaliação. Skills do Supabase permanecem no registro do Supabase Plugin para evitar duplicação.

**Disponíveis não adotadas:** Spreadsheets e Presentations.

## 6. Uso do computador e navegador

Esses recursos podem ampliar validações visuais e interações fora do terminal.

**Disponíveis não adotados:** Computer Use e Chrome. O navegador integrado está disponível, mas ainda não tem adoção final.

## 7. Próximos testes

Os testes devem gerar evidência suficiente para adotar, limitar ou descartar recursos.

1. Validar uma worktree em uma frente paralela real.
2. Ampliar testes de leitura do Supabase Plugin, sem escrita.
3. Selecionar outro procedimento candidato a skill do ambiente Codex.
4. Comparar Chrome e navegador integrado em uma validação visual.

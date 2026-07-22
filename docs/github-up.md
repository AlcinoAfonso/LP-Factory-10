# LP Factory 10 — GitHub Updates

Este documento registra recursos oficiais do GitHub com valor concreto para desenvolvimento, segurança, automação e governança do LP Factory 10.

Fontes prioritárias: GitHub Docs, GitHub Changelog e GitHub Blog.

Escopo principal:

* Actions, workflows, checks e artefatos;
* branches, PRs, reviews e releases;
* Models, Copilot, Apps, OAuth e Codespaces;
* Dependabot, secret scanning e code scanning.

Recursos específicos de Supabase, Vercel, produto ou agentes permanecem nos respectivos catálogos, com referência curta quando necessário.

O estado da plataforma deve ser separado do estado no projeto: `Não implementado`, `Em implementação por casos de uso` ou `Implementado globalmente no projeto`.

Identificador canônico: `github#n`. A numeração não deve ser reutilizada.

## Critério do catálogo ativo

Este documento deve manter apenas recursos GitHub que ainda possam ser aproveitados pelo Gestor de Updates em algum caso atual, futuro ou condicional.

Itens já implementados globalmente, absorvidos pela Base Técnica, duplicados, superados, deprecados ou sem aproveitamento concreto não permanecem no catálogo ativo.

Recursos pagos, enterprise ou futuros podem permanecer quando ainda tiverem aproveitamento possível em algum caso específico.

A rejeição ou adoção de cada item deve ser decidida caso a caso pelo Gestor de Updates, conforme o plano-base avaliado.

Antes de registrar um item, confirmar fonte oficial, valor para o projeto, plano, limites, dependências e evidência de implementação.

## Updates registrados

## github#4 — Workflows em PRs criados por bots após aprovação *(🟩 Estável)*

2026-06-13
Atualizado em 2026-07-22

### Status no Projeto

- Status: Aplicável — automação existente; validação operacional pendente.
- Evidência: `.github/workflows/pipeline-docs-apply-report.yml` usa `peter-evans/create-pull-request@v6` com `contents: write` e `pull-requests: write` para criar PRs automáticos; `.github/workflows/security.yml` executa em `pull_request` para `main` e `macro`.

### Descrição

PRs criados por `github-actions[bot]` podem executar workflows de CI/CD após aprovação de um usuário com permissão de escrita no repositório. A aprovação libera a execução antes impedida pelas proteções contra automações recursivas; ela não aprova nem faz merge do PR.

### Valor para o Projeto

- O caso deixou de ser apenas hipotético: o pipeline documental já cria PRs por automação.
- Permite que checks de PR, incluindo o workflow de segurança quando aplicável, sejam executados após aprovação humana.
- Preserva revisão humana e evita ampliar permissões ou usar credencial alternativa apenas para disparar workflows.

### Ações Recomendadas

1. Na próxima execução real do `pipeline-docs-apply-report`, verificar se o PR criado pelo bot solicita aprovação de workflows.
2. Quando solicitado, um usuário com permissão de escrita deve revisar a origem do PR e aprovar apenas a execução dos checks esperados.
3. Registrar o comportamento operacional depois da primeira validação real.
4. Não usar este recurso para aprovação automática, merge automático ou ampliação de permissões.

### Limites

- A aprovação do workflow não substitui revisão do diff nem autorização de merge.
- O comportamento só é relevante para PR criado pelo bot que precise disparar outro workflow.
- O registro não autoriza alterar workflows ou tokens.

### Fonte Oficial

- [Bot-created pull requests can run workflows if approved](https://github.blog/changelog/2026-06-11-bot-created-pull-requests-can-run-workflows-if-approved/)
---

## github#5 — Copilot CLI em GitHub Actions com GITHUB_TOKEN *(🟨 Avaliação futura)*

2026-07-02

### Status no Projeto

- Status: Não implementado.
- Evidência: não há workflow do LP Factory 10 usando Copilot CLI.

### Descrição

O GitHub permite executar Copilot CLI em GitHub Actions usando o `GITHUB_TOKEN` interno do workflow, sem necessidade de criar e armazenar um PAT de longa duração. O uso exige permissão específica `copilot-requests: write` e política de organização compatível.

### Valor para o Projeto

- Pode reduzir risco operacional se o projeto vier a usar Copilot CLI em workflows.
- Evita armazenar PATs de longa duração para automações baseadas em Copilot CLI.
- Mantém a decisão condicionada a custo, permissão, política de uso e caso real.

### Ações Recomendadas

1. Manter como avaliação futura.
2. Não criar workflow com Copilot CLI sem decisão humana explícita.
3. Se adotado futuramente, registrar permissão mínima, custo, política de uso e validação no documento técnico apropriado.

### Fonte Oficial

- [Copilot CLI no longer needs a personal access token in GitHub Actions](https://github.blog/changelog/2026-07-02-copilot-cli-no-longer-needs-a-personal-access-token-in-github-actions/)

---

## github#6 — AI credit session limits no Copilot CLI/SDK *(🧪 Public preview)*

2026-07-01

### Status no Projeto

- Status: Não implementado.
- Evidência: não há uso registrado de Copilot CLI ou Copilot SDK no projeto.

### Descrição

Recurso para limitar créditos de IA consumidos em uma sessão do Copilot CLI ou Copilot SDK, inclusive em execuções não interativas com `--max-ai-credits`.

### Valor para o Projeto

- Pode ajudar a controlar custo de agentes ou scripts assistidos por IA.
- É relevante apenas se o projeto adotar Copilot CLI ou SDK em algum fluxo aprovado.
- Reduz risco de gasto aberto em automações sem supervisão.

### Ações Recomendadas

1. Manter como avaliação futura.
2. Não adotar Copilot CLI/SDK apenas por causa deste recurso.
3. Se houver uso futuro, exigir limite explícito de créditos por sessão em scripts não interativos.

### Fonte Oficial

- [Set AI credit session limits in Copilot CLI and SDK](https://github.blog/changelog/2026-07-01-set-ai-credit-session-limits-in-copilot-cli-and-sdk/)

---

## github#7 — Secret scanning public monitoring for enterprises *(🧪 Public preview / Enterprise)*

2026-07-01
Atualizado em 2026-07-20

### Status no Projeto

- Status: Não implementado.
- Evidência: sem registro de uso de Enterprise Cloud com Secret Protection/Advanced Security para este recurso no LP Factory 10.

### Descrição

Recurso de monitoramento público de secrets para Enterprise, capaz de detectar segredos vazados em conteúdo público do GitHub fora dos repositórios próprios da organização, como forks pessoais, issues, pull requests e outros repositórios públicos. A lista de alertas passou a exibir indicadores de vazamentos por atribuição, quantidade de membros e domínios verificados.

### Valor para o Projeto

- Pode ser útil se o LP Factory 10 evoluir para estrutura Enterprise ou organização com domínio verificado.
- Complementa secret scanning do repositório próprio ao monitorar vazamentos públicos atribuíveis à empresa.
- Não substitui boas práticas locais de secrets, `.env`, GitHub Actions e push protection.

### Ações Recomendadas

1. Manter como recurso enterprise condicional.
2. Não tratar como disponível no plano atual sem verificação explícita.
3. Avaliar apenas se o projeto passar a usar GitHub Enterprise Cloud com Secret Protection ou Advanced Security.

### Fonte Oficial

- [Secret scanning public monitoring for enterprises](https://github.blog/changelog/2026-07-01-secret-scanning-public-monitoring-for-enterprises/)
- [Improvements to secret scanning and public monitoring](https://github.blog/changelog/2026-07-15-improvements-to-secret-scanning-and-public-monitoring/)

---

## github#8 — Browser tools for GitHub Copilot in VS Code *(🟩 GA)*

2026-07-01

### Status no Projeto

- Status: Não implementado.
- Evidência: sem registro de uso operacional no fluxo atual do LP Factory 10.

### Descrição

Ferramentas de navegador para GitHub Copilot no VS Code que permitem ao agente abrir páginas, navegar, clicar, digitar, ler conteúdo, capturar erros de console, tirar screenshots e executar fluxos roteirizados, com controles de acesso, privacidade, permissões e domínios.

### Valor para o Projeto

- Pode apoiar diagnóstico manual assistido em previews, fluxos de UI e testes exploratórios.
- Pode ser útil em investigação de bugs visuais ou comportamentais quando houver operador humano.
- Não substitui QA manual, Playwright, Vercel Toolbar ou validação humana.

### Ações Recomendadas

1. Manter como avaliação futura de produtividade técnica.
2. Não transformar em requisito do fluxo de QA.
3. Se usado, registrar limites: domínios permitidos, dados sensíveis, aprovação humana e evidência capturada.

### Fonte Oficial

- [Browser tools for GitHub Copilot in VS Code are generally available](https://github.blog/changelog/2026-07-01-browser-tools-for-github-copilot-in-vs-code-are-generally-available/)

---

## github#9 — Cooldown padrão do Dependabot para updates de versão *(🟩 Estável)*

2026-07-14

### Status no Projeto

- Status: Não implementado — capacidade condicional.
- Evidência: não existe `.github/dependabot.yml` nem outro registro de version updates automatizados no repositório.

### Descrição

O Dependabot passou a aguardar por padrão três dias após a publicação de uma versão no registry antes de abrir PR de version update. Security updates continuam imediatos. A janela pode ser alterada ou desativada pela opção `cooldown` quando existir configuração do Dependabot.

### Valor para o Projeto

- Reduz a chance de adotar imediatamente uma versão recém-comprometida ou quebrada quando o projeto habilitar version updates.
- Preserva a velocidade de correções de segurança, que não entram no atraso padrão.
- Oferece uma proteção simples de supply chain sem justificar automação antecipada no MVP.

### Ações Recomendadas

1. Não criar configuração do Dependabot apenas por causa do cooldown.
2. Se version updates forem aprovados futuramente, manter inicialmente a janela padrão de três dias.
3. Alterar a janela somente com motivo operacional e revisão do impacto sobre atualização e segurança.

### Limites

- O cooldown não valida a qualidade da versão e não substitui lockfile, testes, revisão de diff e CI.
- O padrão só produz efeito quando version updates do Dependabot estiverem configurados ou habilitados.
- Não atrasar security updates.

### Fonte Oficial

- [Dependabot version updates introduce default package cooldown](https://github.blog/changelog/2026-07-14-dependabot-version-updates-introduce-default-package-cooldown/)

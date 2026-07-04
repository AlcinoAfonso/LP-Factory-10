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

### Status no Projeto

- Status: Não implementado.

### Descrição

PRs criados por `github-actions[bot]` agora podem executar workflows de CI/CD após aprovação de um usuário com permissão de escrita no repositório.

### Valor para o Projeto

- Permite que PRs criados pelo bot executem workflows após revisão e aprovação humana.

### Ações Recomendadas

1. Avaliar somente quando automações do projeto criarem PRs pelo bot.

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

### Status no Projeto

- Status: Não implementado.
- Evidência: sem registro de uso de Enterprise Cloud com Secret Protection/Advanced Security para este recurso no LP Factory 10.

### Descrição

Recurso de monitoramento público de secrets para Enterprise, capaz de detectar segredos vazados em conteúdo público do GitHub fora dos repositórios próprios da organização, como forks pessoais, issues, pull requests e outros repositórios públicos.

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

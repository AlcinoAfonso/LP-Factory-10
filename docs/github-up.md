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

Antes de registrar um item, confirmar fonte oficial, valor para o projeto, plano, limites, dependências e evidência de implementação.

## Updates registrados

## github#1 — Permissões mínimas em workflows *(🟩 Estável)*

2026-06-13

### Status no Projeto

- Status: Implementado globalmente no projeto.
- Evidência: `.github/workflows/*` e `.github/workflows/security.yml`.

### Descrição

Permissões explícitas limitam o acesso do `GITHUB_TOKEN` ao necessário em cada workflow.

### Valor para o Projeto

- Reduz a superfície de acesso das automações e aplica o princípio do menor privilégio.

### Ações Recomendadas

1. Manter permissões explícitas nos workflows.
2. Evitar `write-all`.

### Fonte Oficial

- [Workflow syntax for GitHub Actions — `permissions`](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#permissions)

---

## github#2 — Grupos de concorrência em GitHub Actions *(🟩 Estável)*

2026-06-13

### Status no Projeto

- Status: Implementado globalmente no projeto.
- Evidência: workflows que usam `concurrency` e `cancel-in-progress`.

### Descrição

Grupos de concorrência controlam execuções simultâneas de workflows e permitem cancelar execuções anteriores ainda em andamento.

### Valor para o Projeto

- Evita execuções simultâneas conflitantes e reduz consumo desnecessário.

### Ações Recomendadas

1. Manter `concurrency` e `cancel-in-progress` nos workflows aplicáveis.
2. Avaliar `queue: max` somente quando houver necessidade real de preservar execuções sequenciais.

### Fonte Oficial

- [Control the concurrency of workflows and jobs](https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs)

---

## github#3 — Secret scanning e push protection *(🟨 Estável — disponibilidade por plano e tipo de repositório)*

2026-06-13

### Status no Projeto

- Status: Implementado globalmente no projeto.
- Evidência: no repositório público `AlcinoAfonso/LP-Factory-10`, em `Settings > Advanced Security`, `Secret Protection` e `Push protection` estão habilitados, conforme indicado pelos respectivos botões `Disable`.
- Disponibilidade: ativa para o tipo e configuração atuais do repositório público; o plano nominal não foi identificado.

### Descrição

Secret scanning identifica credenciais expostas no repositório, enquanto push protection pode bloquear o envio de secrets compatíveis antes que sejam incorporados.

### Valor para o Projeto

- Ajuda a impedir commits com secrets de Supabase, Vercel, OpenAI e outros provedores.

### Ações Recomendadas

1. Manter `Secret Protection` e `Push protection` habilitados.
2. Revisar alertas de secrets e eventuais bypasses quando ocorrerem.

### Fonte Oficial

- [Secret scanning](https://docs.github.com/code-security/secret-scanning/about-secret-scanning)
- [Push protection](https://docs.github.com/code-security/concepts/secret-security/push-protection)

---

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

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

Identificador canônico: `github#n`. Todo ID publicado permanece localizável; a numeração não deve ser apagada, renumerada ou reutilizada.

## Critério do catálogo ativo

Este documento deve manter apenas recursos GitHub que ainda possam ser aproveitados pelo Gestor de Updates em algum caso atual, futuro ou condicional.

Itens já implementados globalmente, absorvidos pela Base Técnica, duplicados, superados, deprecados ou sem aproveitamento concreto podem sair do catálogo ativo, mas permanecem como registro histórico com estado final, evidências, recortes e eventual substituto.

Recursos pagos, enterprise ou futuros podem permanecer quando ainda tiverem aproveitamento possível em algum caso específico.

A rejeição ou adoção de cada item deve ser decidida caso a caso pelo Gestor de Updates, conforme o plano-base avaliado.

Antes de registrar um item, confirmar fonte oficial, valor para o projeto, plano, limites, dependências e evidência de implementação.

## Updates registrados

## github#4 — Workflows em PRs criados por bots após aprovação *(🟩 Estável)*

2026-06-13
Atualizado em 2026-07-22

### Status no Projeto

- Status: Aplicável — automação existente; validação operacional pendente.
- Evidência: `.github/workflows/pipeline-docs-apply-report.yml` usa `peter-evans/create-pull-request@v6` com `contents: write` e `pull-requests: write`; PRs automáticos como `#67` comprovam o fluxo. `.github/workflows/security.yml` executa em `pull_request` para `main` e `macro`, mas não há ocorrência pós-lançamento documentada que confirme a aprovação do run.

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

## github#5 — Copilot CLI/SDK em Actions: GITHUB_TOKEN e limite de créditos *(🟨 Avaliação futura)*

2026-07-01
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não implementado.
- Evidência: não há workflow, dependência ou registro operacional do LP Factory 10 usando Copilot CLI ou Copilot SDK; o fluxo atual usa Codex e automações determinísticas próprias.

### Descrição

O Copilot CLI pode executar em GitHub Actions com o `GITHUB_TOKEN` do workflow, usando a permissão `copilot-requests: write`, sem PAT de longa duração. Copilot CLI e SDK também permitem limitar créditos de IA por sessão, inclusive em execuções não interativas com `--max-ai-credits`.

### Relação com a stack

- Sobrepõe-se parcialmente ao Codex e às automações existentes.
- Não substitui scripts determinísticos, checks ou revisão humana.
- Exige política de organização/conta, disponibilidade do Copilot, custo e permissão próprios.

### Valor para o Projeto

- Se houver caso aprovado, pode evitar PAT persistente e limitar gasto por execução.
- Reúne autenticação de menor exposição e controle de custo no mesmo recorte operacional.

### Limites e hipótese de superioridade

- Não adotar Copilot CLI/SDK apenas por estar integrado ao GitHub.
- A hipótese mínima é que um job hospedado no Actions precise de capacidade agente que o script determinístico ou o fluxo Codex atual não entregue com segurança/custo equivalentes.
- O benefício deve superar consumo de Actions, créditos de IA, nova permissão, risco de prompt/tool use e manutenção.

### Gatilho de avaliação

Avaliar somente quando existir workflow concreto que exija raciocínio agente dentro do Actions, com inputs, outputs e limite de crédito definidos, e depois de comparar com script determinístico e execução Codex fora do CI.

### Ações Recomendadas

1. Manter como avaliação futura.
2. Se o gatilho ocorrer, usar `GITHUB_TOKEN` com permissão mínima e limite explícito de créditos; não criar PAT para contornar o modelo.
3. Registrar custo, política, dados, ferramentas permitidas, falha fechada e revisão humana antes de qualquer adoção.

### Fontes Oficiais

- [Copilot CLI no longer needs a personal access token in GitHub Actions](https://github.blog/changelog/2026-07-02-copilot-cli-no-longer-needs-a-personal-access-token-in-github-actions/)
- [Set AI credit session limits in Copilot CLI and SDK](https://github.blog/changelog/2026-07-01-set-ai-credit-session-limits-in-copilot-cli-and-sdk/)

---

## github#6 — AI credit session limits no Copilot CLI/SDK *(⚪ Registro histórico — absorvido por github#5)*

2026-07-01  
Atualizado em 2026-08-04

### Estado e rastreabilidade

- Estado: não implementado; conteúdo absorvido por `github#5`.
- Evidência: `github#5` reúne autenticação por `GITHUB_TOKEN`, limite de créditos, custo, riscos e gatilho do mesmo caso Copilot CLI/SDK.
- Recortes aplicados: nenhum; o projeto não usa Copilot CLI nem SDK.
- Gatilho preservado: se um workflow agente for aprovado futuramente, exigir limite explícito de créditos por sessão.
- O ID permanece histórico e não pode ser reutilizado.

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
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não implementado.
- Evidência: `docs/gestor-codex.md` registra navegador integrado/Chrome como não adotados; os workflows `automation-validador-final.yml` e `automation-niche-runtime-tests.yml` já usam Playwright para fluxos determinísticos. Não há padrão operacional de Copilot no VS Code.

### Descrição

Ferramentas de navegador para GitHub Copilot no VS Code permitem ao agente abrir páginas, navegar, clicar, digitar, ler conteúdo, capturar console e screenshots, com controles de acesso, privacidade, permissões e domínios.

### Valor para o Projeto

- Pode apoiar investigação exploratória de Preview e bugs visuais com operador humano.
- Não substitui QA manual, Playwright, Vercel Toolbar nem evidência reprodutível.

### Limites e hipótese de superioridade

- Sobrepõe-se aos navegadores já disponíveis no Codex e à automação Playwright.
- A hipótese mínima é reduzir o tempo de diagnóstico exploratório dentro do VS Code sem enviar dados sensíveis nem enfraquecer a validação determinística.
- Não é superior para checks repetíveis, regressão ou gate de merge.

### Gatilho de avaliação

Avaliar apenas se o fluxo de engenharia adotar Copilot no VS Code e surgir incidente de UI/Preview cuja investigação interativa seja recorrente. Comparar tempo, evidência, domínios, dados e reprodutibilidade com o navegador Codex e Playwright.

### Ações Recomendadas

1. Manter como avaliação futura de produtividade técnica.
2. Não transformar em requisito ou substituto do fluxo de QA.
3. Se usado, registrar domínios permitidos, dados sensíveis, aprovação humana e evidência capturada.

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

---

## github#10 — Workflow execution protections por ator e evento *(🧪 Public preview; adoção condicional)*

2026-06-18
Verificado em 2026-07-22

### Status no Projeto

- Status: Não implementado — disponibilidade e configuração pendentes de validação.
- Evidência: o repositório possui workflows acionados por `pull_request` e `workflow_dispatch`, incluindo `pipeline-docs-apply-report.yml` com permissões de escrita; não há registro de Actions policy ou workflow execution protection configurada.

### Descrição

As workflow execution protections permitem criar uma allow list para controlar quais atores podem iniciar GitHub Actions e quais eventos podem disparar workflows. As primeiras regras cobrem atores — usuários, papéis, GitHub Apps, Copilot e Dependabot — e eventos como `push`, `pull_request`, `pull_request_target` e `workflow_dispatch`.

O recurso usa a estrutura de rulesets e oferece modo de avaliação antes da aplicação obrigatória.

### Valor para o Projeto

- Pode restringir `workflow_dispatch` e outros eventos sensíveis a responsáveis autorizados.
- Pode impedir que um ator não confiável execute workflow modificado e alcance permissões ou secrets.
- Complementa permissões mínimas no YAML e revisão humana; não substitui essas proteções.
- Tem caso concreto porque o repositório já opera múltiplos workflows e um pipeline documental com `contents: write` e `pull-requests: write`.

### Valor para o Usuário

- Benefício indireto por reduzir risco de execução indevida, alteração do repositório e consumo desnecessário de Actions.

### Limites

- Recurso em public preview e sujeito a mudanças.
- A disponibilidade depende do nível de configuração, do plano e da visibilidade do repositório; deve ser confirmada novamente se o repositório se tornar privado.
- Não bloquear eventos ou atores antes de testar em modo de avaliação e mapear os workflows legítimos.
- O registro não autoriza criar ruleset, alterar workflow, permissões, secrets ou plano do GitHub.

### Gatilho de avaliação

Avaliar configuração somente quando:

1. a opção estiver disponível na conta e no repositório;
2. os eventos e atores legítimos estiverem inventariados;
3. o efeito sobre PRs humanos, PRs de bot, Dependabot e `workflow_dispatch` estiver documentado;
4. houver modo de avaliação ou teste reversível antes da aplicação obrigatória.

### Ações Recomendadas

1. Verificar a disponibilidade em Settings → Actions → Policies.
2. Se disponível, mapear primeiro atores e eventos atuais sem alterar o comportamento.
3. Usar modo de avaliação antes de qualquer bloqueio.
4. Revalidar plano e disponibilidade após eventual mudança do repositório para privado.

### Fontes Oficiais

- [GitHub Changelog — Control who and what triggers GitHub Actions workflows](https://github.blog/changelog/2026-06-18-control-who-and-what-triggers-github-actions-workflows/)
- [GitHub Docs — About Actions policies](https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/actions-policies/about-actions-policies)

## github#11 — Aprovação de workflows potencialmente maliciosos *(🟩 Proteção automática em repositórios públicos)*

2026-07-28

### Status no Projeto

- Status: Implementado globalmente no projeto pela plataforma; ocorrência local e registro operacional ainda não validados.
- Evidência: o repositório `AlcinoAfonso/LP-Factory-10` é público. Há workflows com `contents: write`/`pull-requests: write` e outros que acessam secrets; a proteção oficial é automática para repositórios públicos no github.com.
- Lacuna documental: `docs/base-tecnica.md` contém regras gerais de CI, mas não registra como revisar e aprovar um run retido por esta proteção.

### Descrição

O GitHub Actions pode reter automaticamente um workflow identificado como potencialmente malicioso. O run só continua após um colaborador com permissão de escrita revisar e aprovar em sessão web autenticada. Não há configuração a habilitar.

### Valor para o Projeto

- Reduz o risco de credencial comprometida introduzir workflow destinado a exfiltrar secrets ou credenciais de CI.
- É relevante porque o projeto possui Actions com escrita, banco, OpenAI, mailbox e outros secrets operacionais.
- Complementa permissões mínimas, pinning, revisão de diff e `github#10`; não substitui esses controles.

### Valor para o Usuário

- Benefício indireto por reduzir risco de supply chain, alteração indevida e exposição de credenciais.

### Limites

- Aplica-se atualmente a repositórios públicos no github.com e apenas a runs que o GitHub classificar para retenção.
- A aprovação não afirma que o diff é seguro, não substitui revisão e não autoriza merge.
- Não aprovar automaticamente nem por rotina; revisar ator, evento, diff do workflow, permissões e secrets alcançáveis.

### Ações Recomendadas

1. Quando surgir um run retido, registrar a ocorrência e revisar ator, evento, diff, permissões e secrets antes de aprovar.
2. Tratar aprovação como ação humana excepcional e autenticada.
3. Encaminhar a regra operacional ao documento técnico competente; este catálogo não autoriza alterar workflows ou settings.

### Fonte Oficial

- [GitHub Actions holds potentially malicious workflows for approval](https://github.blog/changelog/2026-07-28-github-actions-holds-potentially-malicious-workflows-for-approval/)

---

## github#12 — Dependabot malware alerts com cobertura OpenSSF ampliada *(🟨 Adoção condicional)*

2026-07-28

### Status no Projeto

- Status: Não implementado; habilitação não validada.
- Evidência: o projeto usa ecossistema npm com `package-lock.json`, mas não há `.github/dependabot.yml`, registro de malware alerts ou configuração de Advanced Security no repositório documental.

### Descrição

O GitHub Advisory Database passou a ingerir advisories do projeto OpenSSF malicious-packages. Quando malware alerting está habilitado, o Dependabot compara dependências com essa cobertura ampliada, incluindo npm, PyPI e outros ecossistemas, e permite filtrar alertas por `type:malware`.

### Valor para o Projeto

- Pode detectar pacote malicioso já presente no grafo npm, sem depender de version updates automatizados.
- Complementa lockfile, `npm ci`, revisão de dependências e o cooldown de `github#9`.
- Não exige adotar PRs automáticos de atualização para ter valor de detecção.

### Valor para o Usuário

- Benefício indireto por reduzir risco de supply chain no runtime e nas automações.

### Limites

- A habilitação e disponibilidade reais na conta/repositório precisam ser confirmadas.
- O alerta não prova exploração nem corrige dependência; exige triagem, versão afetada, caminho transitivo e validação da remediação.
- Não habilitar updates automáticos nem merge automático como consequência deste registro.

### Gatilho de avaliação

Verificar a opção em Settings → Advanced security → Dependabot quando houver recorte de segurança aprovado. Adotar somente com responsável por triagem, severidade, SLA e processo de remediação definidos.

### Ações Recomendadas

1. Confirmar se Malware alerts está disponível e habilitado, sem alterar settings nesta atualização.
2. Se adotado futuramente, validar o primeiro alerta e registrar o fluxo de triagem.
3. Preservar security updates imediatos e não confundir malware alerts com version updates.

### Fonte Oficial

- [Dependabot alerts on malicious packages across more ecosystems](https://github.blog/changelog/2026-07-28-dependabot-alerts-on-malicious-packages-across-more-ecosystems/)

---

## github#13 — Push protection padrão para chaves Resend e outros provedores *(🟩 Disponível em repositórios públicos)*

2026-08-07

### Status no Projeto

- Status: aplicável globalmente por plataforma; bloqueio local e configuração do usuário ainda não validados por ocorrência real.
- Evidência: o repositório `AlcinoAfonso/LP-Factory-10` é público e `docs/platform-config.md` registra Resend como provedor SMTP do Supabase Auth; não existe SDK Resend nem chave versionada no repositório.
- Natureza de uso: prevenção de vazamento de credenciais no GitHub, sem alterar o runtime do SaaS.
- Relação com a stack: complementar às regras de secrets, ao armazenamento em plataformas e ao registro específico de `supa#56`.
- Horizonte: Starter e operação atual como baseline de segurança.

### Descrição

O GitHub ampliou os detectores incluídos por padrão na push protection para bloquear `resend_api_key`, `posthog_oauth_access_token`, `mistral_ai_api_key` e `apiclub_api_key`. Secret scanning roda gratuitamente em repositórios públicos; push protection para usuários é habilitada por padrão e impede o envio de secrets para repositórios públicos, salvo bypass explícito.

Para o LP Factory 10, a cobertura de Resend é concreta porque o provedor já opera o SMTP transacional, embora sua credencial seja configurada fora do repositório. PostHog e Mistral não são dependências atuais e não justificam adoção.

### Valor para o Projeto

- Pode impedir que uma chave Resend válida entre no histórico Git por commit local, UI, upload, REST API ou interação com o GitHub MCP.
- Complementa a política de não versionar secrets sem criar action, hook ou scanner próprio.
- Reduz o risco de comprometimento do envio transacional e da reputação do domínio.

### Limites

- O detector não substitui armazenamento correto, rotação, revisão de diff ou resposta a incidente.
- Push protection para usuário pode ser desabilitada ou sofrer bypass; o estado efetivo da conta não foi inspecionado nesta atualização.
- A proteção cobre formatos reconhecidos e versões recentes do token; não garante detecção de toda credencial, valor transformado ou secret genérico.
- Se uma chave chegar ao GitHub, ela deve ser revogada e rotacionada; remover apenas o commit não é remediação suficiente.
- Não testar com credencial real nem inserir valor fictício semelhante a um token nesta rodada.

### Ações Recomendadas

1. Manter secrets somente nos provedores e ambientes autorizados.
2. Quando ocorrer bloqueio real, não fazer bypass por conveniência; remover o valor, revisar a origem e registrar o incidente se houver exposição.
3. Confirmar o estado de push protection do usuário/repositório em uma revisão operacional de segurança, sem bloquear o MVP por ausência de smoke destrutivo.

### Fontes Oficiais

- [GitHub Changelog — Secret scanning coverage updates](https://github.blog/changelog/2026-08-07-secret-scanning-coverage-updates/)
- [GitHub Docs — Secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning)
- [GitHub Docs — Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
- [GitHub Docs — Supported secret scanning patterns](https://docs.github.com/en/code-security/reference/secret-security/supported-secret-scanning-patterns)

---

## Registro da rodada — GitHub Update — 10/08/2026

### Updates ajustados ou incorporados

- `github#13` foi adicionado para registrar a cobertura padrão de push protection para `resend_api_key` e o valor concreto no e-mail transacional já operado pelo projeto.

### Updates avaliados e não adicionados

- Customização de nomes de branches do Dependabot: não existe `.github/dependabot.yml`, version update automatizado nem conflito de naming no projeto.
- CodeQL 2.26.2 e configuração centralizada de code scanning: o workflow `security.yml` atual executa checks próprios e não usa CodeQL; a escala organizacional não cria caso no repositório pessoal atual.
- MCP allowlists, instalação de GitHub Apps por enterprises, métricas de Copilot, effort levels de review e Kimi K3: dependem de Copilot/Enterprise ou governança não adotada e sobrepõem ferramentas atuais sem hipótese de superioridade.
- Depreciação do GitHub Spark e GitHub Models: não há app Spark, chamada `llm()` ou dependência correspondente no repositório.
- Nenhum recurso foi excluído somente por estar fora do Starter ou do MVP.

### Cobertura estratégica desta atualização

- Desenvolvimento, segurança, Actions, PRs, Dependabot, secret scanning, code scanning, Copilot, Apps e MCP foram pesquisados nas fontes oficiais do GitHub.
- Landing pages, Instagram, WhatsApp e e-mail foram confrontados com as novidades aplicáveis; apenas o e-mail possui relação concreta, pela proteção da chave Resend.
- Nenhuma novidade GitHub publicada entre 05/08/2026 e 10/08/2026 alterou diretamente os fluxos de landing pages, Instagram ou WhatsApp.

### Pontos não validados e lacunas documentais

- O estado efetivo da push protection do usuário/repositório não foi confirmado em Settings nem por tentativa de push, pois a validação não deve usar credencial real.
- Não houve ocorrência registrada de bloqueio ou bypass de chave Resend no projeto.
- O item não substitui a lacuna mais ampla de revisão operacional de secrets já indicada nos catálogos e documentos técnicos.

### Validação de IDs e limite

- Nenhum ID publicado desapareceu, foi renumerado ou reutilizado; somente `github#13` foi acrescentado.
- A busca por referências explícitas e implementação semântica precedeu a classificação.
- Nenhum workflow, setting, secret, regra, app, dependência ou infraestrutura foi criado ou alterado.
- O catálogo registra a proteção; não autoriza teste com credencial, bypass, implementação ou mudança de plano.

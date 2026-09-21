# Lousa do Plano Base — E17.12 — Contas institucionais de QA e mailbox operacional

## 1. V1 funcional consolidada e aprovada

### 1.1. Fonte e autoridade

- Fonte canônica: Google Doc `Debate 09 — Catálogo de QA — LP Factory 10`.
- Documento: `1WaHdPVwdQKumZXzcL0zaEam9NOTUqkkVV0jF30mAjpo`.
- Recorte aprovado: `PB-B — E17.12 — Contas institucionais de QA e mailbox operacional`.
- Estado confirmado no Google Drive em 21/09/2026: `V1 funcional consolidada e aprovada`.
- O PB-A E17.11 permanece concluído e funcionalmente inalterado; histórico, alternativas e demais planos do Debate não integram este contrato.

### 1.2. Problema e resultado funcional

- Problema: QAs que criam usuários ou dependem de e-mail ainda podem parar por depender de contas legadas ou de abertura humana da mailbox.
- Resultado funcional: um QA já autorizado pode obter nova identidade institucional descartável quando necessário, concluir confirmação, convite ou recuperação pela mailbox institucional e usar depois essa identidade em login interativo.
- Atores: Executor do plano consumidor e, quando aplicável, humano revisor; o fluxo normal aprovado não depende de abertura humana da mailbox.

### 1.3. Comportamento esperado

- Usar alias único no padrão `lpfactoryqa+conviteXX@gmail.com`.
- Criar a conta somente no ambiente já autorizado pelo recorte consumidor.
- Usar uma senha própria da identidade LP Factory e registrá-la no Catálogo de QA.
- Registrar também conta ou tenant, papel, status e observações necessárias, deixando a identidade disponível aos demais recortes autorizados.
- Tipo 1 — consumir autonomamente, pela automação determinística da E17.12.3, o e-mail necessário de confirmação de cadastro, convite ou recuperação; a criação e o provisionamento da identidade permanecem na E17.12.4.
- Tipo 2 — permitir login interativo pela UI com identidade institucional catalogada para o Executor reproduzir a experiência humana no recorte autorizado.
- Selecionar Tipo 1, Tipo 2 ou encadear ambos conforme a evidência exigida pelo QA já autorizado, sem ampliar escopo nem autoridade.
- Manter ao menos uma identidade institucional apta ao Admin Dashboard com o menor privilégio suficiente.
- Substituir entradas legadas somente após equivalência funcional comprovada.

### 1.4. Identidades, catálogo e substituição

- Quando um teste autorizado exigir nova identidade e nenhuma conta institucional adequada do catálogo servir, o Executor pode criar uma conta de QA usando alias único da mailbox institucional no padrão aprovado.
- O alias deve ser novo no catálogo; o sufixo distingue identidades de teste que convergem para a mailbox institucional.
- Novas contas de QA não usam a mailbox pessoal `alcinoafonso@live.com` nem novos aliases de `alcinoafonso380@gmail.com`.
- Toda conta ou usuário de QA criado deve ser registrado no Catálogo de QA no mesmo ciclo de criação e validação, com conta ou tenant, login ou e-mail, senha do usuário de teste da LP Factory, papel, status e observações necessárias ao cenário.
- A senha catalogada é somente a senha da identidade de QA na LP Factory e deve permitir login interativo; senha principal da Conta Google, app passwords, tokens, cookies, sessions e demais secrets técnicos não entram no catálogo.
- O status deve refletir o estado útil para QA, incluindo pelo menos criação ou aguardando confirmação, ativo e substituído ou descartado quando aplicável.
- Contas baseadas em `alcinoafonso380+convite...` e a conta pessoal `alcinoafonso@live.com` deixam de ser base para novos QAs.
- Uma entrada legada só é substituída depois de existir e ser validada uma conta institucional equivalente para o mesmo papel ou cenário; então recebe status `Substituído — não usar` ou deixa o conjunto ativo, sem apagar automaticamente o usuário real do produto.
- O catálogo deve conter ao menos uma identidade institucional de QA capaz de testar o Admin Dashboard, com o menor privilégio suficiente; espera-se `platform_admin`, usando `super_admin` somente se investigação técnica comprovar necessidade.
- O mecanismo de provisionamento do privilégio pertence à V2; esta V1 não cria por padrão nova UI de convite ou gestão de administradores.

### 1.5. Mailbox institucional e automação aprovada

- Todos os aliases `lpfactoryqa+...` convergem para a mailbox institucional `lpfactoryqa@gmail.com`.
- O Executor deve conseguir consumir, dentro do teste autorizado, e-mails necessários de confirmação de cadastro, convite e recuperação sem depender de abertura humana da mailbox.
- A capacidade reutiliza a mailbox e os secrets institucionais já preservados no projeto, sem expor valores ao catálogo, chat, logs, evidências ou repositório.
- A E17.12.3 usa automação determinística sem OpenAI no GitHub Actions, com runtime focal isolado sob `automations/qa-mailbox/` e workflow sob `.github/workflows/`.
- A automação opera por POP3/TLS e reutiliza `MAILBOX_EMAIL` e `MAILBOX_PASSWORD` somente no runner.
- Cada execução recebe somente ambiente autorizado, origem exata do app, alias institucional exato, tipo fechado `signup_confirmation | invite | password_recovery`, instante inicial e identificador de correlação sem PII.
- A seleção é inequívoca por alias, remetente, tipo e janela temporal; o polling é finito e lê sem apagar mensagens.
- O link usa HTTPS, salvo teste local explicitamente autorizado, pertence à origem allowlisted e apresenta path e tipo compatíveis com a jornada.
- Ausência, ambiguidade, mensagem antiga, remetente ou origem divergentes falham fechado.
- Link e conteúdo da mensagem permanecem somente em memória e são consumidos pelo mesmo processo confiável.
- Conteúdo, URL sensível, token ou credencial não podem aparecer em outputs, logs, Job Summary, artifacts, cache, chat, catálogo ou repositório.
- O workflow usa permissões mínimas, é acionável somente em contexto confiável e não disponibiliza secrets a execução originada de fork.
- A observabilidade registra somente correlação sem PII, ambiente, tipo de fluxo, etapa, tentativas, duração, resultado e código seguro de falha.
- Timeout ou falha de validação preserva a identidade como pendente e permite reemissão do e-mail e nova execução limitada.
- Falha persistente escala para diagnóstico operacional ou rotação autorizada da senha de app, sem transformar abertura humana da mailbox no fluxo normal.
- A E17.12.3 não restaura o Validador Final, não cria service, MCP ou API independente e não altera o Core.

### 1.6. Modos de QA e fronteiras das fases

- O PB-B disponibiliza dois modos complementares dentro de teste já autorizado: Tipo 1 operacional e determinístico; Tipo 2 de interação humana pela UI.
- O Executor escolhe Tipo 1, Tipo 2 ou ambos conforme a evidência necessária, sem ampliar o escopo nem a autoridade do teste consumidor.
- Fluxo canônico: criar ou provisionar a identidade pela E17.12.4; consumir confirmação ou convite pelo Tipo 1; registrar a identidade no Catálogo de QA; prosseguir pelo Tipo 2 na UI.
- E17.12.3 responde somente pelo consumo seguro da mailbox e pelo handoff em memória ao consumidor da mesma execução.
- E17.12.4 responde por alias, criação ou provisionamento, senha LP Factory, papel, status e Catálogo de QA.
- E17.12.5 responde por login interativo, Account Dashboard, Admin Dashboard quando autorizado e substituição das entradas legadas.
- Nenhum token ou senha pode ser transportado entre fases por log, output, artifact ou cache.
- Após implementação e validação, a capacidade transversal deve ser reconciliada no contrato comum do Executor para ficar disponível às execuções Light e Complexas; `docs/pipeline-plano-base.md` permanece somente como roteador.

### 1.7. Escopo negativo vinculante

- Não registrar credenciais técnicas da mailbox no Catálogo de QA.
- Não usar a conta pessoal de superadministrador nem criar novos aliases da mailbox antiga para novos QAs.
- Não apagar automaticamente usuários legados do produto.
- Não criar UI de gestão de administradores sem prova técnica de necessidade e nova decisão funcional.
- Não restaurar o Validador Final.
- Não criar service, MCP ou API independente para a mailbox.
- Não alterar o Core para resolver o consumo da mailbox.
- Não alterar `docs/pipeline-plano-base.md`, Debate 03 ou o contrato do Estrategista Autônomo.

### 1.8. Posição, classificação e dependências

- Posição planejada no roadmap: E17.12 — Contas institucionais de QA e mailbox operacional.
- E17.12.3 — tornar a mailbox institucional consumível pelo QA sem intervenção humana.
- E17.12.4 — criar e provisionar identidades institucionais de QA e registrá-las com senha, papel e status.
- E17.12.5 — substituir progressivamente as entradas legadas e validar login humano, Account Dashboard e Admin Dashboard nos recortes autorizados.
- Execução: Complexa.
- Supervisão: Autônomo.
- Automação: sim, restrita à E17.12.3; automação determinística sem OpenAI.
- Ambiente principal: GitHub Actions, com runtime focal sob `automations/qa-mailbox/` e workflow de entrada sob `.github/workflows/`.
- Dependências externas: Gmail por POP3/TLS em `pop.gmail.com:995` e deployment LP Factory autorizado para o teste.
- Secrets: reutilizar `MAILBOX_EMAIL` e `MAILBOX_PASSWORD` exclusivamente no runner; a senha principal Google não participa do fluxo.

### 1.9. Critérios de aceite e evidências

- O Executor consegue criar pelo menos uma nova identidade institucional sem intervenção humana na mailbox.
- Confirmação de cadastro, convite e recuperação são comprovados para alias institucional em ambiente autorizado.
- Toda conta ou usuário de QA criado é registrado no Catálogo de QA com senha LP Factory, papel e status e fica disponível para reutilização por outros recortes autorizados.
- A mesma credencial permite login interativo pela UI para QA humano.
- Existe identidade institucional validada para o Account Dashboard e para o Admin Dashboard quando esses papéis forem necessários.
- Após equivalência comprovada, entradas legadas correspondentes deixam o conjunto ativo e ficam identificadas como substituídas ou não utilizáveis.
- Testes cobrem candidato válido e negativas para alias, remetente, data, tipo, origem, path, ambiguidade e timeout.
- Evidências e buscas de segurança não expõem conteúdo de e-mail, URL sensível, token ou credencial.
- Workflow tem permissões mínimas, retries limitados e erros redigidos.
- Falha não ativa usuário, não substitui legado e não exige abertura humana como caminho normal.
- A prova end-to-end conjunta cobre mailbox, criação ou provisionamento, registro no catálogo e login UI posterior sem apagar automaticamente usuário legado nem criar UI administrativa.
- O Executor consegue selecionar Tipo 1, Tipo 2 ou ambos dentro do QA já autorizado, sem exigir definição humana prévia do caminho e sem ampliar o recorte.
- O PB-A E17.11 permanece funcionalmente inalterado.

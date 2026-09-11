# Plano-base E17.11 — Capacidade institucional transversal de QA

- Estado: V1 funcional consolidada e aprovada.
- Fonte aprovada: `Debate 09 — Capacidade Institucional Transversal de QA — Plano B — LP Factory 10`.
- Documento Google Drive: `1WaHdPVwdQKumZXzcL0zaEam9NOTUqkkVV0jF30mAjpo`.
- Revisão da fonte materializada: `ANLCKQn8hEtU4shRJBFzVLEi6sG1_rWT_dvqWcaIgZsnnWMYHfTsI9wQ3lYVwSLvR6h8vf2rywoIMupzVPYi4zGmMf2SpCLZPCA5xywpNYg`.
- Execução: Light.
- Supervisão: Autônomo.

## 1. V1 funcional congelada

### 1.1. Problema e resultado funcional

Garantir que qualquer Executor, em qualquer recorte Light ou Complexo, encontre e utilize condições institucionais suficientes para executar o QA exigido pelo contrato — identidades, papéis, estados, catálogo, navegador, Preview, mailbox e demais recursos autorizados — sem depender de Alcino para credenciais ou cliques rotineiros e sem exigir autorização repetida em cada V1.

### 1.2. Comportamento esperado

Receber o critério de aceite; descobrir os recursos QA institucionais pelas fontes do projeto; consultar o catálogo; selecionar a identidade e o estado de menor privilégio suficientes; autenticar-se; usar Preview, navegador, mailbox ou outro recurso autorizado somente quando necessário; criar ou ajustar estado de QA pelas superfícies normais do produto quando faltar; verificar esperado versus observado; atualizar o catálogo; e devolver evidência sanitizada.

### 1.3. Atores

- Qualquer Executor responsável por um plano-base.
- Recursos institucionais de QA do projeto.
- Contas e identidades QA.
- Catálogo operacional.
- Superfícies do produto e Preview.
- Mailbox de QA quando a jornada exigir e-mail.
- Humano somente para ação que a plataforma imponha como humana sem equivalente autorizado, como MFA, CAPTCHA ou renovação excepcional de sessão.

### 1.4. Limites e escopo negativo

- Não criar agente separado, workflow, job, service, rota, banco, secret resolver, cofre próprio ou nova infraestrutura por padrão.
- Não usar dados reais de clientes.
- `platform_admin` e `super_admin` são permitidos quando destinados a QA.
- Não registrar secrets de infraestrutura no Drive.
- Não exigir opt-in em cada V1 para recursos QA já institucionalizados.
- O contrato competente do recorte pode exigir ator, papel, estado, ambiente ou jornada específicos, mas restrição ou mediação técnica excepcional exige razão material explícita e deve preservar caminho autorizado equivalente para executar o teste obrigatório.

### 1.5. Riscos funcionais materiais

- Recursos conectados ou sessões podem expirar.
- O catálogo pode ficar desatualizado; o estado real do produto prevalece.
- Uma identidade QA que passe a conter dados reais deixa de pertencer à exceção simplificada.
- Lacuna real de capacidade QA deve ser tratada transversalmente, sem mascará-la como bloqueio específico do recorte consumidor.

### 1.6. Posição e fases planejadas

- Posição planejada no roadmap: E17.11, como recorte independente do Plano A E17.9/E17.10.
- `E17.11.3` — materializar e tornar descobríveis os recursos institucionais mínimos de QA, incluindo catálogo, regras de consumo e referências operacionais, comprovando que qualquer Executor consegue consultá-los e utilizá-los sem intervenção humana rotineira.
- `E17.11.4` — executar o piloto real do PR #912, incluindo convite, mailbox, `/auth/confirm` e verificação do estado final.
- `E17.11.5` — comprovar repetibilidade transversal em recortes distintos, incluindo ao menos Account Dashboard e Admin Dashboard, com login, signup/criação de usuário, recuperação, papéis de conta, autoridade de plataforma e atualização do catálogo quando aplicável.

### 1.7. Classificação e decisão de automação

- Classificação do Estrategista: Light enquanto a implementação se limitar a reconciliar contratos do Executor, `docs/platform-config.md`, catálogo, navegador, mailbox e demais recursos já existentes, sem introduzir nova infraestrutura; descoberta de necessidade estrutural material deve retornar ao Estrategista para reclassificação conforme o Prompt Estrategista.
- Automação: sim, com comportamento agentic pelo Executor existente no Codex.
- Não criar automação ou agente adicional.
- O Google Drive funciona como catálogo operacional e o navegador como superfície de execução humana simulada.
- Supervisão: Autônomo.

### 1.8. Critérios de aceite

- Qualquer Executor, independentemente do recorte, descobre e consulta os recursos QA institucionais sem exigir que a V1 específica repita a autorização.
- Seleciona autonomamente a identidade ou estado de menor privilégio compatível, lê a credencial QA pela fonte autorizada e executa a jornada sem solicitar credenciais ao humano.
- Quando o teste exigir novo estado, consegue criar ou ajustar uma conta pela superfície normal do produto e registrar o novo estado no catálogo.
- Quando confirmação, convite ou recuperação exigir e-mail, dispõe de caminho institucional autorizado para consumir a mailbox; intervenção humana só é admitida quando a plataforma exigir ação humana sem equivalente autorizado, como MFA, CAPTCHA ou renovação excepcional de sessão.
- Conclui o piloto do PR #912 ponta a ponta e comprova o estado final no produto.
- Repete casos representativos em recortes distintos, inclusive Account Dashboard e Admin Dashboard, sem depender de intervenção humana por execução.
- Não usa dado de cliente real nem secret de infraestrutura no catálogo; contas `platform_admin` ou `super_admin` podem ser usadas quando catalogadas ou declaradas como recurso institucional de QA e seu alcance real for confirmado no produto, sem nova autorização por teste.
- Quando a sessão da mailbox expirar e exigir MFA ou CAPTCHA insolúvel, registra o bloqueio específico e admite somente a renovação humana excepcional da sessão.

### 1.9. Evidência esperada

Registro sanitizado por teste com critério, ator funcional, conta ou estado usados, comportamento esperado, comportamento observado, resultado final e eventual bloqueio; não incluir senhas ou secrets nas evidências.

### 1.10. Relação com o Plano A

- O Plano B E17.11 é independente e pode ser implementado e concluído sem concluir E17.9/E17.10.
- O Debate 08 permanece fonte do Plano A e deve ser retomado futuramente se houver decisão de industrializar o QA com fronteiras mais rígidas.
- O sucesso do Plano B não apaga, rebaixa nem substitui automaticamente o Plano A.

## 2. V2 técnica mínima — Light

### 2.1. Referências imutáveis e decisão de derivação

- V1 funcional congelada no commit `e2625e054f487b1fbfefd9a829bfc79a3e8d4177`, blob `def8a4160b699f8c769718083dbd715162f3a3bb`.
- Fonte externa aprovada: Google Doc `1WaHdPVwdQKumZXzcL0zaEam9NOTUqkkVV0jF30mAjpo`, revisão `ANLCKQn8hEtU4shRJBFzVLEi6sG1_rWT_dvqWcaIgZsnnWMYHfTsI9wQ3lYVwSLvR6h8vf2rywoIMupzVPYi4zGmMf2SpCLZPCA5xywpNYg`.
- Updates: parecer read-only do `gestor-updates` sobre a V1 congelada, com veredito `updates aplicáveis com patches autossuficientes`.
- Aplicar agora somente `prod#14`, `supa#30` e `github#14`.
- Usar `supa#5`, `supa#59`, `prod#16` e `prod#17` apenas como referências ou travas quando o cenário concreto exigir.
- Preservar `vercel#15` como oportunidade estratégica condicional, sem implementação neste recorte.
- Rejeitados para o recorte: `github#8`, `vercel#22`, `vercel#25`, `supa#63` e `supa#70`.
- Analista Light: não acionado; a derivação permanece documental e operacional, sem risco estrutural material, conflito técnico ou decisão funcional pendente.

### 2.2. Estado factual confirmado na derivação

- O catálogo `Catálogo de QA — Debate 09 — LP Factory 10`, spreadsheet `15I8EYtZK2GbHHEVkZ0nr9EY3BF-Bf7BhTPL3VPoBOfI`, existe diretamente na pasta `LP Factory` do Google Drive e possui as abas `Contas QA` e `Mailbox`.
- A conta Google conectada ao Gmail no Codex App é a mailbox do Plano B, `alcinoafonso380@gmail.com`; sua leitura não depende de o humano abrir uma sessão no navegador.
- A aba `Mailbox` ainda descreve a abertura humana do navegador e deve ser reconciliada com o método operacional realmente disponível, sem registrar senha, token, cookie ou secret.
- O navegador autorizado alcança Production e já confirmou sessão funcional no Account Dashboard para a identidade QA catalogada `alcinoafonso@live.com` no tenant `acc-d4363e70`.
- O acesso a `/admin` exige autenticação própria; o papel efetivo da identidade QA deve ser comprovado no produto, sem inferência a partir do catálogo.
- O PR #912 foi mergeado em `main`; a prova E17.11.4 usa o comportamento vigente em Production, não o Preview histórico do PR.
- `docs/platform-config.md` ainda descreve somente a mailbox POP3 histórica do Plano A E17.9.3 e deve distinguir esse recurso do catálogo e da mailbox conectada do Plano B.
- `docs/roadmap.md` registra a consulta preliminar E17.9.3, mas ainda não possui o recorte independente E17.11.

### 2.3. E17.11.3 — Descoberta e consumo dos recursos institucionais

- Reconciliar o contrato do Executor para reconhecer recursos institucionais transversais declarados por `docs/platform-config.md`, sem exigir repetição da autorização em cada V1 consumidora e sem superar restrição técnica explícita do recorte.
- Registrar em `docs/platform-config.md` a localização e o estado operacional do catálogo, o Gmail conectado como caminho de leitura da mailbox do Plano B e o navegador como superfície de execução, distinguindo-os da mailbox POP3 histórica do Plano A.
- Atualizar a aba `Mailbox` do catálogo para refletir o método operacional confirmado e eliminar a dependência humana rotineira superada.
- Preservar a fonte Google Drive como catálogo operacional; não duplicar credenciais no repositório.
- Aplicar `prod#14`: cada entrada do catálogo operacional deve ser reconhecível sem conhecimento prévio e registrar, no mínimo: ambiente; jornada suportada; identidade de QA por referência não secreta; papel ou autoridade; estado relevante; fonte autorizada da credencial por nome ou caminho, sem reproduzi-la no plano ou na evidência; superfície de uso; último estado verificado e data; e eventual restrição ou intervenção humana excepcional aplicável.
- Critério: um Executor em cold start localiza catálogo e mailbox, seleciona o recurso de menor privilégio e identifica sua fonte autorizada sem pedir credenciais ou cliques rotineiros ao humano; nenhuma credencial aparece no repositório ou nas evidências.

### 2.4. E17.11.4 — Piloto real do PR #912

- Executar em Production o fluxo normal de membros da conta com uma identidade QA apropriada e um alias descartável da mailbox catalogada.
- Preservar o fluxo Auth já implantado: `inviteUserByEmail`, template nativo `Invite user`, estado assinado no `redirectTo` transportado por `{{ .RedirectTo }}` e callback allowlisted `/auth/confirm`.
- É proibido introduzir envio customizado no Core, Auth Hook amplo ou validade local paralela.
- Provar: convite emitido pela superfície normal; e-mail recebido na mailbox conectada; callback sem `/auth/error`; definição de senha; ativação do vínculo; login no tenant correto; catálogo atualizado com o estado real.
- Se a ação final de definição de senha exigir participação humana obrigatória imposta pela superfície de automação disponível, interromper imediatamente antes da submissão, preservar a jornada e devolver ao Estrategista Autônomo o critério, as evidências, os caminhos avaliados e a menor intervenção necessária; não pedir intervenção diretamente ao humano.

### 2.5. E17.11.5 — Repetibilidade transversal

- Executar provas representativas em Account Dashboard e Admin Dashboard usando somente identidades QA catalogadas e o menor privilégio suficiente para cada caso.
- Cobrir, sem criar infraestrutura: login; signup ou criação normal de usuário; recuperação; papéis de conta; autoridade de plataforma; leitura de e-mail quando exigida; e atualização do catálogo quando o estado mudar.
- Confirmar no produto o papel e o alcance reais de `platform_admin` ou `super_admin`; o texto do catálogo não substitui a autorização observada.
- Para UI, usar navegador e ambiente hospedado aplicável; validar somente o comportamento e as superfícies exigidos pelo cenário, sem criar uma auditoria visual ou WCAG global.
- Inspeção Supabase read-only e logs podem complementar diagnóstico e prova factual, mas não substituem a jornada observável nem autorizam mutação fora das superfícies normais do produto.
- Critério: as provas de Account Dashboard e Admin Dashboard são repetíveis sem credencial, clique ou criação manual de conta pelo humano em cada execução.

### 2.6. Evidência, documentação e arquivos previstos

- Evidência por teste: critério, ator funcional, conta ou estado usados, esperado, observado, resultado e bloqueio, sempre sanitizados.
- Aplicar `github#14`: runs, checks, commit statuses, logs, Job Summaries, screenshots e artefatos hospedados são evidências suplementares e expiráveis. O resultado durável fica no PR ou commit e, no fechamento, no roadmap ou documento canônico competente. Não exportar evidência bruta nem criar storage paralelo sem necessidade aprovada.
- Arquivos previstos no repositório:
  - `docs/lousa-plano-base-e17-11.md`;
  - `.agents/skills/lp-factory-executar-plano/SKILL.md`;
  - `docs/platform-config.md`;
  - `docs/roadmap.md`.
- Recurso externo previsto: spreadsheet `15I8EYtZK2GbHHEVkZ0nr9EY3BF-Bf7BhTPL3VPoBOfI`, limitado à reconciliação e aos estados de QA efetivamente alterados pelas provas.
- Não há alteração de código de produto, schema, migration, variável, secret, workflow, service, rota, agente ou infraestrutura.
- Como o delta repo-side é documental e contratual, `npm ci` e `npm run check` são não aplicáveis; as validações obrigatórias são `git diff --check`, confronto V1/V2/diff, leitura de Drive/Gmail e QA funcional hospedado das jornadas previstas.

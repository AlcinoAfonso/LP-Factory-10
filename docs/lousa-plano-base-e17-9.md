# E17.9 — QA transacional/determinístico

Status: plano-base v1 funcional reconsolidado e aprovado em 08/09/2026.

Plano conceitual: N/A.

Fonte aprovada: Debate 08 — Operador Institucional Autônomo de QA — LP Factory 10, Google Docs `19Aq0Z4WxaKCmGOB1lTb3MedHJmgFtKTHhlgXrwaRgB8`, seção 4.1, revisão `ANLCKQng3b-J5SkjXJDjgGQLfVc38kKKaLub8NsurvcIdsjxd1xUpj91-Qc4HXtvwX_utFeqqwhC1E7IWhD1MXjkrmPkK6cLHzNZEiY5x6A`.

A seção 4.2 do Debate 08 pertence à E17.10 futura e não está liberada neste plano.

## 1. Estado

- V1 funcional reconsolidada e aprovada para o recorte ativo.

## 2. Problema e resultado funcional

- Permitir que o Executor selecione e execute autonomamente os testes transacionais necessários aos critérios de cada plano, usando identidades, contas e dados institucionais de QA, sem depender de Alcino e sem recriar um Validador Final separado.

## 3. Comportamento esperado

- Receber o critério de aceite.
- Decidir qual QA transacional é necessário.
- Selecionar uma fixture institucional compatível ou criar outra quando o estado exigido não existir.
- Acionar o processo determinístico competente.
- Verificar esperado versus observado.
- Repetir após correções técnicas quando necessário.
- Devolver evidência sanitizada.

## 4. Atores

- Executor no Codex App como decisor do teste.
- Identidades e contas institucionais de QA.
- Mecanismos determinísticos autorizados do projeto como executores das operações objetivas.

## 5. Decisões funcionais aprovadas

### 5.1. Limites e escopo negativo

- Não criar agente separado.
- Não recriar Validador Final ou Niche Runtime Tests.
- Não incluir neste plano navegação visual, avaliação de interface ou criação/edição de Landing Page.
- Não usar conta pessoal.
- Não registrar senha ou secret em texto claro.
- Não criar workflow, job, service, rota, banco ou infraestrutura por inferência.

### 5.2. Catálogo institucional

- Manter conjunto organizado e expansível de contas e identidades de QA, cobrindo conforme necessário owner, admin, editor, viewer, autoridade de plataforma, cliente, não cliente e demais estados recorrentes.
- O Executor reutiliza o que servir e cria ou reconfigura fixtures institucionais quando o teste exigir estado novo.

### 5.3. Credenciais

- O Executor deve conseguir autenticar-se ou operar as identidades necessárias sem solicitar login, senha ou código a Alcino em cada execução.
- O registro operacional pode conter login/e-mail funcional, finalidade, papel, conta/tenant, estado, condição comercial, ambiente e referência segura da credencial.
- O valor real da credencial permanece fora de Markdown, chat, relatório e código de Preview.
- O mecanismo técnico exato pertence à V2.

## 6. Posição e fases planejadas

- Posição planejada no roadmap: E17.9.

### 6.1. E17.9.3 — Consolidar o contrato transacional e o catálogo de estados de QA

- Status: planejada.

### 6.2. E17.9.4 — Reconciliar ou provisionar identidades, contas, papéis, estados e fronteira segura de acesso

- Status: planejada.
- Reconciliar ou provisionar os recursos necessários ao QA transacional.

### 6.3. E17.9.5 — Comprovar os fluxos transacionais centrais

- Status: planejada.
- Incluir criação de usuário ou signup, criação de conta, confirmação de e-mail, convite, recuperação e verificação de papéis/estados.

### 6.4. E17.9.6 — Comprovar seleção e repetibilidade

- Status: planejada.
- Comprovar seleção automática de fixture, criação sob demanda, repetibilidade e evidência sanitizada em casos representativos.

## 7. Classificação, automação e supervisão

- Classificação do Estrategista: Complexa.
- Decisão de automação: não criar agente adicional.
- O próprio Executor decide o QA necessário e aciona processos determinísticos para as operações objetivas.
- O mecanismo deve amadurecer por ciclos controlados de tentativa, evidência, ajuste e repetição, sempre transformando correções em capacidade reutilizável e não em solução ad hoc por teste.
- Supervisão: Autônomo.

## 8. Critérios de aceite

- O Executor seleciona autonomamente o QA transacional adequado ao critério do plano.
- Consegue reutilizar fixture compatível ou criar outra institucional quando o estado necessário não existir.
- Cobre e distingue, quando material ao teste, papéis owner, admin, editor e viewer, autoridade de plataforma, cliente e não cliente.
- Comprova casos representativos de criação de usuário ou signup, criação de conta, confirmação de e-mail, convite, recuperação e verificação de papel/estado.
- Não solicita rotineiramente a Alcino login, senha, código, clique ou autorização para operações de QA já autorizadas.
- Não expõe secrets, conteúdo bruto da mailbox ou credenciais permanentes.
- Não cria agente, Validador Final, nova infraestrutura ou cenário específico descartável quando o mesmo comportamento puder ser incorporado ao mecanismo reutilizável.
- Falhas e correções podem ser repetidas até que o processo seja estável, com evidência objetiva por tentativa.

## 9. Evidência esperada

- Registro sanitizado por critério com ator funcional, ambiente, fixture criada ou reutilizada, comportamento esperado, comportamento observado, resultado e bloqueio quando houver.

## 10. Plano-base v2 técnico

Status: proposta técnica derivada da v1 funcional, sujeita aos gates do Analista antes da implementação.

### 10.1. Entradas imutáveis e estado factual

- Plano-base v1 reconsolidado: commit `abe38ce3de0fc645e0813375590447bea4d76ef0`, blob `29281ecacb9ba3811ddfd03f0d0c91670eb628ec`, caminho `docs/lousa-plano-base-e17-9.md`.
- Fonte funcional: Debate 08, seção 4.1, documento `19Aq0Z4WxaKCmGOB1lTb3MedHJmgFtKTHhlgXrwaRgB8`, revisão `ANLCKQng3b-J5SkjXJDjgGQLfVc38kKKaLub8NsurvcIdsjxd1xUpj91-Qc4HXtvwX_utFeqqwhC1E7IWhD1MXjkrmPkK6cLHzNZEiY5x6A`.
- Plano conceitual: N/A.
- PR da frente: #914, branch `codex-app/e17-9-autonomia-qa`, base `main`; head remoto anterior à reconsolidação: `28236bb08874931341ce5b24016f8a988e21291b`.
- O código vigente já contém Supabase Auth, criação de usuário, contas, memberships, papéis `owner`, `admin`, `editor` e `viewer`, estados de acesso, condição comercial, convite por `inviteUserByEmail`, estado assinado e callback `/auth/confirm`.
- O repositório possui os secrets GitHub `MAILBOX_EMAIL` e `MAILBOX_PASSWORD`, sem expor seus valores, mas a busca nos workflows e automações vigentes não encontrou consumidor desses secrets.
- O Gmail conectado ao Codex na investigação pertence a uma identidade diferente da mailbox institucional. Ele não é consumidor autorizado para esta E17.9.
- Resultado do readiness I-01: zero consumidores institucionais autorizados de mailbox. Esse resultado bloqueia operações de confirmação, convite e recuperação que dependam de e-mail; não autoriza criar consumidor substituto.
- Resultados atuais da fronteira segura: `credential_resolution_unproven` e `session_isolation_unproven`. Nenhum adapter dependente dessas capacidades pode ser materializado ou marcado pronto antes de readiness positivo.
- O contrato do Executor introduzido em `28236bb08874931341ce5b24016f8a988e21291b` é parcialmente reutilizável: preservam-se allowlist, menor privilégio, correlação segura, sanitização, separação entre produto e operador e parada fail-closed.

### 10.2. Arquitetura e fronteiras

- O Executor no Codex App é o único componente adaptativo da E17.9. Ele interpreta o critério, deriva o cenário transacional, seleciona a capacidade necessária, compara esperado e observado e decide repetir depois de correção técnica.
- O QA transacional determinístico reside em `automations/qa-transacional/`. O boundary recebe o cenário escolhido pelo Executor, valida o contrato, seleciona por correspondência exata uma fixture do catálogo, executa somente operações objetivas autorizadas e devolve evidência sanitizada.
- A automação não escolhe o teste, não decide aprovação do plano, não avalia interface, não navega visualmente e não cria ou edita Landing Pages.
- A automação não é agente, workflow, job, service, rota, banco, runtime de produto, Validador Final ou Niche Runtime Tests.
- O código de produto permanece sistema sob teste. `lib/access/account-members/`, `lib/access/`, `lib/commercial-entitlements/`, `lib/supabase/service.ts` e `app/auth/confirm/route.ts` não recebem catálogo, runner, credenciais ou correlação de mailbox.
- O Executor preserva em sua skill somente os guardrails e a regra curta de roteamento ao boundary; protocolo, catálogo, seleção, adapters e evidência residem na automação.

### 10.3. Residência e contratos do boundary

- Residência inicial:
  - `automations/qa-transacional/package.json` e `package-lock.json`;
  - `automations/qa-transacional/README.md`;
  - `automations/qa-transacional/run.mjs`;
  - `automations/qa-transacional/lib/contracts.mjs`;
  - `automations/qa-transacional/lib/catalog.mjs`;
  - `automations/qa-transacional/lib/selection.mjs`;
  - `automations/qa-transacional/lib/evidence.mjs`;
  - `automations/qa-transacional/lib/readiness.mjs`;
  - `automations/qa-transacional/lib/adapters/index.mjs`, como registry não secreto das capacidades e de seus contratos;
  - `automations/qa-transacional/lib/adapters/auth-public.mjs`, `auth-admin.mjs`, `accounts.mjs`, `entitlements.mjs`, `access-state.mjs` e `mailbox.mjs` somente nas fases em que o mecanismo correspondente possua consumidor autorizado e gate factual aprovado.
- Entrada: versão do contrato, critério, cenário transacional, ambiente exato, estado requerido, ações permitidas, ações proibidas, estado final e limite de tentativas.
- Catálogo: ID lógico da fixture, identidade ou e-mail funcional, finalidade, ambiente, conta ou tenant, papel, status, autoridade de plataforma, condição comercial, lifecycle, capacidades e referências opacas de credencial e mailbox.
- O catálogo nunca contém senha, token, código, cookie, sessão, URL assinada, conteúdo da mailbox ou valor de secret.
- Seleção exige correspondência exata entre estado requerido e fixture. Ambiguidade, ausência de correspondência ou capacidade incompleta retorna erro estável e não escolhe por aproximação.
- Criação ou reconfiguração exige mecanismo já autorizado, estado anterior conhecido, pós-condição explícita e restauração ou novo estado estável. Sem essas condições, a operação bloqueia antes da mutação.
- O registry de adapters declara por operação capacidade, mecanismo, entradas não secretas, referência opaca exigida, privilégio mínimo, regra de idempotência, pós-condição observável e estado final. Adapter ausente ou não pronto retorna `capability_unavailable` antes de qualquer efeito.
- Cada tentativa gera projeção sanitizada com critério, ator funcional, ambiente, fixture criada, reutilizada ou reconfigurada, esperado, observado, resultado do produto, resultado operacional do Executor, tentativa e bloqueio.
- Logs, runs, checks, Job Summaries e artifacts podem suplementar a prova, mas não são sua única residência. A síntese durável fica no PR, commit e documento canônico competente, sem exportar conteúdo bruto para prolongar retenção.

### 10.4. Credenciais, mailbox e readiness

- Antes de qualquer autenticação ou mutação, a execução fixa deployment e SHA quando aplicáveis, ambiente, conta, atores, papéis, dados, ações permitidas, ações proibidas e estado final.
- Credenciais, tokens, códigos, cookies, URLs assinadas e conteúdo bruto da mailbox permanecem fora do modelo, chat, terminal, argumentos de ferramenta, logs, screenshots, artifacts e código de Preview.
- A existência de secret por nome não comprova consumidor. O readiness retorna somente disponibilidade, identidade funcional, ambiente, capacidades `search`, `read`, `consume`, `credential_resolution` e `session_isolation` e motivo sanitizado.
- `credential_resolution` só fica pronta quando exatamente um consumidor autorizado resolve a referência opaca e entrega a credencial diretamente ao adapter sem expô-la ao Executor, ao terminal ou a argumento de ferramenta. `session_isolation` só fica pronta quando o mecanismo mantém atores separados ou encerra e substitui a sessão de forma verificável e sanitizada.
- O adapter de mailbox só pode ser materializado depois que o readiness identificar exatamente um consumidor institucional existente e autorizado com interface e ambiente inequívocos.
- Zero consumidores, mais de um consumidor compatível ou identidade ambígua bloqueiam o caso correspondente. Não criar POP3/IMAP, Gmail API, proxy, cofre, workflow, job, service, rota, nova credencial ou consumidor substituto por inferência.
- O resultado factual atual é `mailbox_consumer_missing`; por isso, E17.9.4 não pode liberar os fluxos de e-mail de E17.9.5 até que um consumidor autorizado exista e seja revalidado.
- Os resultados factuais atuais `credential_resolution_unproven` e `session_isolation_unproven` bloqueiam todo adapter que dependa dessas capacidades, mesmo quando a operação não usa mailbox.

### 10.5. Banco e produto sob teste

- E17.9 não cria nem altera migration, tabela, coluna, view, RPC, policy, grant ou exposição pela Data API.
- Readiness de ambiente comprova separadamente objetos aplicados, RLS/policies e GRANTs necessários. Ausência ou divergência bloqueia; não autoriza correção de schema por inferência.
- A automação usa apenas acessos server-side já autorizados e lê as pós-condições nas fontes canônicas existentes.
- Supabase Auth e `/auth/confirm` permanecem as autoridades para criação/signup, confirmação, convite e recuperação.
- Confirmação, convite e recuperação reutilizam os redirects autorizados e `/auth/confirm`. Convite preserva `inviteUserByEmail`, o template `Invite user` e o transporte vigente por `redirectTo`; não criar envio customizado, template no Core, rota ou transporte paralelo de token.
- Uma capacidade ainda não comprovada pelo readiness bloqueia somente o caso correspondente.
- Mapa de operações e adapters:
  - `signup`: `auth-public.mjs`, usando `supabase.auth.signUp` no ambiente exato; idempotência por identidade/estado esperado; pós-condição `auth.users` compatível e confirmação pendente quando aplicável;
  - `create_user`: `auth-admin.mjs`, usando `supabase.auth.admin.createUser` somente com `credential_resolution` administrativa pronta; idempotência por busca paginada de e-mail; pós-condição de usuário e confirmação conforme cenário;
  - `create_account`: `accounts.mjs`, usando o boundary vigente de contas somente com credencial administrativa autorizada; idempotência por identificador institucional exato; pós-condição limitada à conta e ao seu lifecycle operacional, sem conceder ou reconciliar entitlement;
  - `verify_entitlement`: `entitlements.mjs`, consumindo exclusivamente o boundary público de `lib/commercial-entitlements/`; lê cliente/não cliente e condição comercial sem acoplar esse estado ao adapter de conta e retorna `capability_unavailable` quando o mecanismo autorizado não estiver pronto;
  - `invite`: adapter que consome exclusivamente `inviteAccountMember` da API pública de `lib/access/account-members/`, cujo boundary interno preserva `inviteUserByEmail`, estado assinado, `redirectTo`, ciclo e idempotência; se o contrato público não puder ser acionado pelo consumidor autorizado, retorna `capability_unavailable` sem reproduzir suas regras no subprojeto;
  - `confirm` e `recover`: `mailbox.mjs` combinado ao callback HTTP `/auth/confirm`; exigem `search`, `read`, `consume`, `credential_resolution` e `session_isolation`; pós-condição de usuário confirmado ou sessão recuperada e estado final sanitizado;
  - `verify_role_state`: `access-state.mjs`, lendo conta, membership, papel, autoridade de plataforma, condição comercial, RLS/policies e GRANTs pelas fontes autorizadas; não altera estado e falha diante de divergência.
- Nenhum adapter replica regra de domínio do produto. Ele aciona o mecanismo público ou administrativo vigente e verifica a pós-condição nas autoridades existentes.

### 10.6. Updates incorporados

- `supa#30`: reutilizar os mecanismos nativos do Supabase Auth e bloquear por capacidade quando configuração ou consumidor não estiver comprovado.
- `supa#59`: usar o Supabase Plugin aprovado somente em investigação read-only de Auth, contas, memberships, papéis, entitlements e helpers, confrontando resultado com `docs/schema.md` e código. O plugin não integra o runner e não executa mutações.
- `github#14`: manter evidência durável mínima e sanitizada fora de fontes operacionais expiráveis.
- `supa#5`: referência diagnóstica condicional apenas se falha real de Auth ou Data API exigir correlação; indisponibilidade não bloqueia.
- `supa#63`: oportunidade estratégica futura somente se migration aprovada alterar RLS/policies sensíveis ou houver repetição comprovada de defeitos de isolamento; não implementar neste recorte.
- `prod#16`, `prod#17`, Vercel Toolbar, Vercel Agent, passkeys, monitor recorrente, Agents SDK, plugin/MCP distribuível, workflow inteligente e demais candidatos rejeitados não integram esta E17.9.

### 10.7. Implementação por subseção

#### 10.7.1. E17.9.3 — Consolidar o contrato transacional e o catálogo de estados de QA

- Implementar o subprojeto isolado com contratos, catálogo não secreto, seleção exata, sanitização, limite de tentativas e readiness sem mutação.
- Incluir casos determinísticos para schema válido e inválido, menor privilégio, todas as dimensões funcionais do catálogo, ausência e ambiguidade de fixture, criação/reconfiguração planejada, idempotência, pós-condição e remoção de campos sensíveis.
- Ajustar a skill do Executor somente para rotear o cenário escolhido ao boundary e interpretar o resultado, preservando os guardrails seguros já existentes.
- Reconciliar `docs/roadmap.md` por ABC para conter somente E17.9.3 a E17.9.6 no recorte transacional/determinístico. Não detalhar ou liberar E17.10.
- Registrar a nova automação em `docs/automations.md` por ABC, com vínculo à E17.9, execução on-demand local pelo Executor, ausência de workflow/agendamento e estado das capacidades. Atualizar `docs/platform-config.md` somente quando o estado factual de consumidor ou referência autorizada mudar; `mailbox_consumer_missing` não deve ser mascarado como capacidade operacional.
- Gate: `npm ci` e testes próprios no subprojeto; `npm ci` e `npm run check` no repositório; `git diff --check`; revisão de secrets e escopo; ABCs aplicáveis; Analista de implementação.

#### 10.7.2. E17.9.4 — Reconciliar ou provisionar identidades, contas, papéis, estados e fronteira segura de acesso

- Executar readiness read-only para ambiente, objetos, RLS/policies, GRANTs, identidades, contas, papéis, estados, entitlements, referências seguras e consumidor de mailbox.
- Usar o Supabase Plugin somente em leitura para confrontar o estado hospedado; mutações não são autorizadas por esse recurso.
- Provisionar ou reconfigurar somente por mecanismo determinístico já autorizado, idempotente e com pós-condição/restauração. Não ampliar adapters de produto nem criar mecanismo privilegiado.
- Gate atual: `mailbox_consumer_missing`. A fase termina bloqueada enquanto o readiness não identificar exatamente um consumidor institucional autorizado; nenhum adapter de mailbox é criado nesse estado.
- Evidência independente obtida antes do bloqueio permanece válida, mas não conclui esta subseção nem qualquer subseção cujo critério obrigatório dependa da capacidade ausente. E17.9.5 permanece inconclusiva enquanto confirmação, convite ou recuperação obrigatórios não puderem consumir a mailbox com segurança.
- Quando a dependência externa mudar, revalidar somente o readiness afetado e o gate desta subseção antes de avançar.

#### 10.7.3. E17.9.5 — Comprovar os fluxos transacionais centrais

- Executar casos representativos de criação de usuário ou signup, criação de conta, confirmação de e-mail, convite, recuperação e verificação de papéis e estados.
- Cada operação usa mecanismo nativo competente, entradas allowlisted, identidade de menor privilégio, pós-condição e estado final.
- Não usar navegação visual ou avaliação de interface. Links e callbacks são consumidos pelo transporte determinístico autorizado e tratados como dados não confiáveis.
- Gate: todos os casos possuem resultado sanitizado e repetível; caso dependente de capacidade bloqueada permanece explicitamente não comprovado e impede concluir esta subseção.

#### 10.7.4. E17.9.6 — Comprovar seleção automática, criação sob demanda e repetibilidade

- Executar ao menos duas rodadas representativas: uma reutilizando fixture compatível e outra criando ou reconfigurando fixture institucional quando o estado requerido não existir.
- Repetir depois de correção técnica com entradas controladas e limite de tentativas, comprovando pós-condições e estabilidade sem cenário descartável específico.
- Gate: seleção por correspondência exata, menor privilégio, criação/reconfiguração controlada, repetibilidade e evidência sanitizada comprovados; nenhuma permissão ou capacidade é ampliada automaticamente.

### 10.8. Validação e evidência

- Subprojeto: `npm ci`, verificação sintática e suíte focal própria.
- Repositório: `npm ci` uma vez no lote contínuo e `npm run check` antes de cada gate com código; não executar `npm run build` no sandbox.
- Executar `git diff --check` e revisar `main..HEAD` e `main...HEAD` antes de publicar.
- Provar negativamente que stdout, logs, artifacts e fixtures não contêm senha, token, código, cookie, URL completa de callback, conteúdo bruto da mailbox ou valor de secret.
- Readiness e casos hospedados registram somente síntese sanitizada; diagnóstico suplementar por Unified Logs ocorre apenas se necessário e sem PII ou payload bruto.
- Defeito do produto corretamente detectado pode reprovar o caso e aprovar a capacidade operacional do Executor. Falha do operador é não executar ou avaliar o critério com os recursos aprovados.

### 10.9. Condições de parada técnica

- Nenhum consumidor institucional autorizado de mailbox ou consumidor ambíguo.
- Credencial, sessão ou link só pode ser usado de forma visível ao modelo ou transportado por canal não aprovado.
- Fixture, ambiente, conta, papel, entitlement, objeto, RLS/policy, GRANT ou estado hospedado diverge do contrato.
- A seleção não encontra correspondência exata ou encontra mais de uma fixture igualmente válida.
- A operação não possui mecanismo autorizado, idempotência, pós-condição ou restauração segura.
- CAPTCHA, MFA ou limitação do provedor impede o processo determinístico autorizado.
- A solução passaria a exigir agente, Validador Final, Niche Runtime Tests, workflow, job, service, rota, banco, migration, privilégio, infraestrutura, navegação visual, avaliação de UI/acessibilidade ou Landing Pages.

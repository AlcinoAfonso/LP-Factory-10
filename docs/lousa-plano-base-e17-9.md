# E17.9 — Autonomia institucional de QA

Status: plano-base v1 funcional consolidado e aprovado em 07/09/2026.

Plano conceitual: N/A.

Fonte aprovada: Debate 08 — Operador Institucional Autônomo de QA — LP Factory 10, Google Docs `19Aq0Z4WxaKCmGOB1lTb3MedHJmgFtKTHhlgXrwaRgB8`, revisão `ANLCKQkGi-8DdLodA8DvQdkOTJo93IPWzwMoiLOLxsUBuHiN_mv_sDcH8XBxfPnsW5wyBkLAwZIwDVHHVaEVz67gW3tGu5wVuxgcHH0ElSU`.

## 1. Estado, problema e objetivo

### 1.1. Estado

- A E17.9.3 tem decisão funcional aprovada e implementação operacional pendente.
- A mailbox `lpfactoryqa@gmail.com` está operacional, mas não possui consumidor vigente.
- O contrato atual do Executor já prioriza recursos autorizados de QA antes de solicitar intervenção humana; o bloqueio principal é a ausência do recurso operacional capaz de executar a jornada.
- O PR #912 expôs o caso representativo: Preview pronta e validada, mas a jornada autenticada de convite não pôde ser concluída autonomamente por falta de sessão institucional de QA e consumidor autorizado da mailbox.
- A criação e edição operacional de Landing Pages continua ausente após a E22.4 e permanece dependência somente para o QA correspondente.

### 1.2. Problema e resultado funcional

- Eliminar a dependência rotineira de Alcino para QA autenticado e variável dos planos-base, sem reduzir segurança ou fronteiras de autorização.
- Tornar disponível um operador institucional capaz de executar jornadas variáveis de QA sem intervenção rotineira de Alcino, usando identidades e recursos institucionais com fronteiras seguras.

### 1.3. Comportamento esperado

- Receber o roteiro e os critérios do plano.
- Operar identidades institucionais.
- Concluir fluxos por mailbox quando necessário.
- Navegar e preencher superfícies autorizadas.
- Avaliar comportamento, conteúdo e interface.
- Devolver evidências sanitizadas.

### 1.4. Atores

- Executor no Codex App, exercendo o papel de operador institucional de QA.
- Identidade comum de QA.
- Identidade administrativa de QA.
- Supervisor competente.

## 2. Decisões funcionais aprovadas

### 2.1. Finalidade e executor do operador

- O operador institucional deve executar jornadas variáveis de QA sem intervenção rotineira de Alcino.
- O próprio Executor no Codex App é a IA responsável pelo QA autônomo e adaptativo; não criar agente de QA separado.
- O Executor usa identidades, mailbox, navegador e demais recursos institucionais autorizados dentro dos guardrails deste plano.
- O contrato atual do Executor já prioriza recursos autorizados de QA antes da intervenção humana; não existe pendência funcional de criar integração separada entre operador e Executor.

### 2.2. Propriedade e escolha das identidades

- Contas, identidades e dados de teste pertencem ao projeto, nunca a contas pessoais.
- A identidade comum nunca recebe privilégio administrativo.
- O operador escolhe automaticamente a identidade de menor privilégio suficiente.
- O operador usa a identidade permanente comum ou administrativa e recorre a identidade transitória somente quando a jornada exigir estado novo, sem gate humano por execução.
- O fluxo não pode depender de aliases sequenciais.

### 2.3. Mailbox institucional

- A mailbox institucional é a base para confirmação, convite e recuperação quando a jornada exigir e-mail.

### 2.4. Jornada variável e faixa permanente de autonomia

- Playwright fixo ou workflow determinístico não equivale, isoladamente, ao operador autônomo completo.
- Dentro das contas, dados, ambientes e ações de QA autorizados, login, convite, confirmação, recuperação, preenchimento de formulários, navegação e mutações normais de QA não exigem nova autorização humana.
- O próprio Executor deve usar os recursos institucionais autorizados de QA antes de solicitar login, clique, código ou teste a Alcino; a intervenção humana permanece fallback excepcional.
- Parar somente quando houver saída do escopo autorizado, risco de exposição de credencial, ação destrutiva ou irreversível não autorizada, CAPTCHA ou MFA insolúvel pelos recursos institucionais, ou divergência do ambiente que torne o resultado não confiável.

### 2.5. Proteção de credenciais

- Não pedir ao humano secrets já registrados nem transportar credenciais entre chats ou tasks.
- Não expor senhas, tokens, códigos, sessões, cookies, secrets ou conteúdo bruto da mailbox em logs, screenshots, artifacts, Job Summary, relatórios ou chat.
- Credenciais permanentes não podem ser entregues ao código não confiável de Preview.
- Sem fronteira comprovadamente segura, o teste autenticado bloqueia e escala.
- Havendo mecanismo aprovado de acesso temporário, revogável e isolado, o operador o usa e encerra automaticamente; só bloqueia se a fronteira segura não puder ser comprovada.

### 2.6. Ambientes e autorização

- O operador atua somente sobre contas, dados, ambientes e ações de QA autorizados.
- Operações reversíveis e restritas a contas e dados institucionais de QA podem ocorrer automaticamente em Production.
- Escalada específica só é exigida para dados reais, ação destrutiva ou irreversível, gasto externo relevante, publicação real ou elevação de privilégio fora do escopo aprovado.
- A autonomia do QA é separada da autorização de merge, que continua seguindo o `AGENTS.md`.

### 2.7. Entrega por capacidades e Landing Pages

- O operador é considerado disponível por capacidade comprovada.
- A ausência da superfície de Landing Pages não bloqueia QA de Auth, Account Dashboard ou Admin Dashboard.
- O QA de criação, edição e avaliação de Landing Pages depende da restauração ou substituição da superfície correspondente.

### 2.8. Evidências

- O resultado deve registrar comportamento esperado e observado, ator, ambiente e evidência suficiente, sempre sanitizada.
- A evidência visual é exigida somente quando materialmente necessária.

### 2.9. Simplicidade, legado e automação

- Não recriar Validador Final nem Niche Runtime Tests.
- Não antecipar Agents SDK, serviço, rota, banco, job ou nova infraestrutura sem evidência do projeto.
- Não criar nova automação, agente, workflow, job, service ou infraestrutura para o QA autônomo.
- A natureza foi classificada como automação com comportamento agentic, reutilizando o Executor existente no Codex App; isso descreve o comportamento adaptativo do Executor e não cria nova camada de orquestração.
- O ambiente principal é o Codex App; OpenAI é inerente ao próprio Codex, sem novo workload OpenAI, Agents SDK ou agente adicional.
- A classificação do Gestor de Automações descreve a natureza da execução e não autoriza Agents SDK, novo agente, serviço ou infraestrutura adicional sem nova evidência e decisão competente.
- A participação humana durante o QA é excepcional, somente quando faltar autoridade ou recurso autorizado.
- Os auxiliares devem ser determinísticos e mínimos.

## 3. Investigação e comprovação obrigatórias

- A execução deve comprovar factualmente se o Executor, as capacidades nativas do Codex e auxiliares determinísticos mínimos conseguem fechar identidade, mailbox, autenticação, navegação e evidências com segurança.
- Se houver lacuna, registrar exatamente o recurso ausente ou não autorizado e retornar ao supervisor, sem criar nova automação ou infraestrutura por inferência.
- Exigir ao menos uma jornada real de Preview equivalente ao bloqueio do PR #912: autenticação institucional, convite, recebimento pela mailbox, consumo do link, passagem por `/auth/confirm` e evidência sanitizada do resultado.

## 4. Fases planejadas

### 4.1. E17.9.3 — Consolidar o contrato funcional

- Status: planejada.
- Consolidar e preservar o contrato funcional aprovado neste plano-base.

### 4.2. E17.9.4 — Reconciliar identidades, papéis e fronteira segura de acesso

- Status: planejada.
- Reconciliar identidades institucionais, isolamento de papéis e a fronteira segura de acesso aplicável a Preview e Production.

### 4.3. E17.9.5 — Comprovar capacidades operacionais do Executor

- Status: planejada.
- Comprovar uso pelo Executor de autenticação, mailbox, navegação e jornadas variáveis com evidências sanitizadas.

### 4.4. E17.9.6 — Comprovar QA ponta a ponta nas superfícies disponíveis

- Status: planejada.
- Comprovar QA ponta a ponta sem intervenção humana rotineira nas superfícies disponíveis.

### 4.5. E17.9.7 — Comprovar QA de Landing Pages

- Status: planejada e condicionada à existência da superfície correspondente.
- Comprovar QA de Landing Pages após a superfície existir.
- A indisponibilidade atual dessa superfície limita somente a comprovação desta subseção e não bloqueia as capacidades anteriores.

## 5. Critérios de aceite

- O QA rotineiro termina sem Alcino fornecer login, senha, código ou autorização durante a execução.
- O operador escolhe automaticamente a identidade de menor privilégio suficiente.
- O operador executa login, convite, confirmação, recuperação, formulários, navegação e mutações reversíveis em dados de QA sem gate humano.
- Jornadas diferentes seguem o plano sem cenário previamente codificado.
- A mailbox conclui fluxos de e-mail.
- Usuário comum e administrador permanecem isolados.
- Credenciais permanentes não chegam ao código da Preview.
- Production admite automaticamente operações reversíveis restritas a contas e dados de QA, escalando apenas ação destrutiva ou irreversível, dado real, gasto externo relevante, publicação real ou elevação indevida de privilégio.
- Evidências não revelam segredos.
- Capacidades disponíveis são utilizáveis independentemente da superfície de Landing Pages.
- Nenhuma infraestrutura desnecessária é criada.

## 6. Escopo negativo e critérios de parada

### 6.1. Escopo negativo

- Não criar tecnologia, infraestrutura ou privilégio fora desta v1.
- Não recriar Validador Final ou Niche Runtime Tests.
- Não criar agente de QA separado, novo workload OpenAI, Agents SDK, workflow, job, service, rota, banco ou infraestrutura sem nova evidência e decisão competente.
- Não entregar credenciais permanentes a código não confiável de Preview.
- Não atuar sobre contas, dados, ambientes ou ações fora do escopo autorizado de QA.
- Não tratar a ausência da superfície de Landing Pages como bloqueio das capacidades anteriores.
- Não confundir autonomia de QA com autorização de merge.

### 6.2. Critérios de parada

- Saída do escopo autorizado.
- Risco de exposição de credencial.
- Ação destrutiva ou irreversível não autorizada.
- CAPTCHA ou MFA insolúvel pelos recursos institucionais.
- Divergência do ambiente que torne o resultado não confiável.
- Ausência de fronteira comprovadamente segura para teste autenticado em Preview.
- Lacuna factual que exija nova automação, infraestrutura, privilégio ou decisão fora da autoridade deste plano.

## 7. Classificação e supervisão

- Execução: Complexa.
- Supervisão: Autônomo.
- Decisão de automação: não criar nova automação; reutilizar o próprio Executor no Codex App como operador adaptativo de QA, com auxiliares determinísticos e mínimos.

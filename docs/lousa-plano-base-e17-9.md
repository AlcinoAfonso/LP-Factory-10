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

## 8. Plano-base v2 técnico

Status: proposta técnica derivada da v1 funcional, sujeita aos gates do Analista antes da implementação.

### 8.1. Entradas imutáveis e estado factual

- Plano-base v1: commit `ed84641dd3eb8695070ccb44433874b51077e923`, blob `5c330706d35bb1f4f6e6cd9152989462aa341171`, caminho `docs/lousa-plano-base-e17-9.md`.
- Base congelada: `origin/main` em `9a80e58bda9079b9a573992a70857543ae6414cb`; `docs/roadmap.md` no blob `7d819673c27d5c96b5e14423a6b372a4708bc8b3`.
- Plano conceitual: N/A.
- PR da frente: #914, branch `codex-app/e17-9-autonomia-qa`, base `main`, criado inicialmente apenas com o plano-base v1.
- Fonte funcional: Google Docs identificado no cabeçalho, na revisão ali congelada.
- O repositório registra `MAILBOX_EMAIL` e `MAILBOX_PASSWORD` como secrets do GitHub, sem expor valores, mas não contém consumidor executável vigente da mailbox.
- A conexão Gmail nativa está disponível no ambiente do Codex, porém a conta conectada na investigação não corresponde à mailbox institucional.
- O Computer Use dispõe, nesta investigação, apenas do navegador interno do Codex, sem sessão aberta e sem Chrome, Edge ou aplicativo nativo conectado; isso comprova capacidade básica de navegação adaptativa, não sessão institucional persistente.
- O projeto Supabase hospedado está saudável. A função vigente `public.is_platform_admin()` não é `SECURITY DEFINER`, fixa `search_path` e aceita claim superior `platform_admin`, UUID legado ou `is_super_admin()`. Nenhum usuário hospedado possui hoje `app_metadata.platform_admin`, e a mailbox institucional ainda não corresponde a usuário de Auth.
- O Preview do PR #912 está pronto, mas o próprio PR mantém pendente a validação autenticada de convite. O Preview do PR #914 está pronto no commit da v1.

### 8.2. Arquitetura e fronteiras

- O operador é o contrato existente do Executor em `.agents/skills/lp-factory-executar-plano/SKILL.md`; não existe novo agente, runtime, workflow, job, service, rota, banco ou workload OpenAI.
- O Gmail conectado ao Codex é o consumidor preferencial da mailbox para busca e leitura adaptativa. POP3 permanece apenas configuração registrada e não autoriza criar consumidor próprio.
- O navegador controlado pelo Codex executa a jornada visual. Sessão persistente, perfil separado ou gerenciador de senhas só podem ser usados depois de comprovados no ambiente; a v2 não presume capacidades ausentes.
- O Supabase Plugin é usado para inspeção hospedada somente leitura e evidência agregada. Alterações hospedadas continuam pelo fluxo versionado de migrations do repositório.
- GitHub e Vercel fornecem estado de PR, checks, Preview e metadados de deploy. A evidência deve ser reduzida ao necessário e sanitizada.
- Auxiliares determinísticos permanecem limitados a validação, seleção ou sanitização. Eles não substituem a navegação e o julgamento adaptativos do Executor.

### 8.3. Identidades e menor privilégio

- Identidade comum permanente: `lpfactoryqa@gmail.com`, sem claim administrativo.
- Identidade administrativa permanente: alias estável de função `lpfactoryqa+admin@gmail.com`, com `app_metadata.platform_admin=true` e sem dependência do UUID pessoal legado.
- Identidade transitória: alias não sequencial `lpfactoryqa+<nonce-opaco>@gmail.com`, criado somente quando o estado novo for material para a jornada e descartado ou desativado ao final conforme a capacidade autorizada da superfície.
- A seleção automática começa pela identidade comum, usa a transitória quando o caso exigir estado novo e usa a administrativa somente quando o critério exigir privilégio de plataforma; o Executor troca de identidade apenas pelo motivo registrado no roteiro.
- Usuário comum e administrador usam contextos de navegador separados quando a capacidade estiver disponível. Sem isolamento comprovado, o Executor encerra a sessão anterior e comprova a troca de ator antes de prosseguir.
- Provisionamento inicial pode exigir uma intervenção humana única para vincular a mailbox institucional ao Gmail nativo e criar ou armazenar credenciais permanentes fora da visibilidade do modelo. Isso não vira gate por execução. Se o ambiente não oferecer mecanismo seguro, o recurso ausente volta ao supervisor sem transportar segredo por chat, arquivo, log ou argumento de ferramenta.

### 8.4. Contrato administrativo hospedado

- A E17.9.4 adiciona uma única migration focal que estende `public.is_platform_admin()` para reconhecer `auth.jwt()->'app_metadata'->>'platform_admin'`, preservando os ramos legados vigentes, o modo `SECURITY INVOKER`, o `search_path` e os grants atuais.
- A migration não cria tabela, coluna, rota, adapter, RLS, policy, papel de banco ou privilégio novo. O claim é metadado administrativo emitido pelo projeto e não dado editável pelo próprio usuário.
- A atribuição do claim ocorre apenas na identidade institucional administrativa, por operação administrativa autorizada. A identidade comum deve ser comprovada negativa para o mesmo helper.
- Como o helper hospedado só muda após aplicação da migration, a comprovação institucional do Admin Dashboard é gate pós-merge da migration. Antes disso, a entrega deve validar estaticamente a migration e pode comprovar as capacidades comuns sem usar identidade pessoal ou elevar privilégio por atalho.
- Se a inspeção imediatamente anterior à implementação mostrar que o helper ou seus grants mudaram, a migration deve ser recalculada sobre a versão corrente; não sobrescrever definição divergente.

### 8.5. Mailbox, autenticação e jornadas

- Convites reutilizam `supabase.auth.admin.inviteUserByEmail`, o template nativo `Invite user`, o estado assinado já existente e o callback `/auth/confirm`; não criar rota de e-mail, token ou convite paralela.
- Confirmação, convite e recuperação são concluídos pelo link recebido na mailbox institucional. Códigos, tokens e URL completos não integram o relato nem screenshots.
- O Executor registra para cada jornada: ator, ambiente, início, ação esperada, comportamento observado, resultado, bloqueio quando houver e referência sanitizada da evidência.
- O roteiro é derivado dos critérios da subseção em execução. Não criar suíte fixa para simular adaptabilidade.
- Qualquer mutação em Production fica restrita a contas e dados institucionais de QA, deve ser reversível e deve ter limpeza ou estado final explicitado.

### 8.6. Qualidade visual e acessibilidade proporcional

- Nas superfícies disponíveis, o Executor faz inspeção visual proporcional em viewport comum e administrativa e inclui mobile quando o comportamento for material.
- O recorte focal de acessibilidade verifica teclado, foco visível, rótulos e nomes acessíveis, mensagens de erro, contraste material, alvos de toque e ausência de dependência exclusiva de hover.
- O resultado não declara conformidade global WCAG e não abre correções fora do caso. Achados externos ao escopo são registrados para o supervisor.
- Screenshot só é produzida quando acrescenta prova material e deve excluir e-mail pessoal, conteúdo da mailbox, token, cookie, secret, identificador sensível ou dado real.

### 8.7. Implementação por subseção

#### 8.7.1. E17.9.3 — Consolidar o contrato funcional

- Confirmar que esta lousa preserva integralmente a v1 aprovada e publicar o plano técnico aprovado no mesmo PR.
- Não criar código para esta subseção.
- Gate: v1 e v2 aprovadas pelo Analista, com matriz de consolidação versionada depois da Passagem 1.

#### 8.7.2. E17.9.4 — Reconciliar identidades, papéis e fronteira segura de acesso

- Implementar a migration focal descrita em 8.4 e validar sua forma contra schema e migration vigentes.
- Especializar o contrato existente do Executor somente onde faltarem regras operacionais explícitas para seleção de identidade, Gmail institucional, isolamento de sessão, sanitização e bloqueio seguro.
- Registrar nos documentos canônicos apenas deltas comprovados: claim administrativo, fonte da identidade, recurso de mailbox e limites de sessão.
- Gate pré-publicação: `npm ci`, `npm run check`, `git diff --check` e revisão de `main..HEAD` e `main...HEAD`.
- Gate hospedado: após aplicação versionada, sessão nova deve provar usuário comum rejeitado e identidade administrativa aceita, sem revelar o JWT ou o UUID legado.

#### 8.7.3. E17.9.5 — Comprovar capacidades operacionais do Executor

- Vincular o Gmail nativo à mailbox institucional e provisionar as duas identidades permanentes pelo mecanismo seguro disponível; segredo permanente permanece fora do modelo e do repositório.
- Executar a jornada representativa do PR #912: convite institucional, recebimento na mailbox, consumo do link, passagem por `/auth/confirm`, ativação e acesso ao destino esperado.
- Executar uma jornada de recuperação e uma troca de ator comum/admin para comprovar identidade, sessão e menor privilégio.
- Gate: nenhum pedido rotineiro de login, senha, clique ou código a Alcino; evidência sanitizada suficiente para reproduzir o resultado, não a credencial.
- Se Gmail institucional, sessão segura ou armazenamento de credencial não puder ser disponibilizado sem exposição, devolver ao supervisor o recurso exato ausente. Não implementar POP3, proxy, cofre ou automação alternativa.

#### 8.7.4. E17.9.6 — Comprovar QA ponta a ponta nas superfícies disponíveis

- Executar, com roteiro derivado do plano, ao menos uma jornada autenticada relevante em Account Dashboard e uma em Admin Dashboard, respeitando os gates hospedados de 8.7.2.
- Avaliar comportamento, conteúdo, interface e o recorte proporcional de acessibilidade de 8.6.
- Usar dados institucionais reversíveis, registrar limpeza ou estado final e anexar somente evidência sanitizada.
- Gate: capacidades de Auth, Account Dashboard e Admin Dashboard comprovadas sem intervenção humana rotineira e sem conta pessoal.

#### 8.7.5. E17.9.7 — Comprovar QA de Landing Pages

- Manter a subseção planejada e não executável enquanto não existir superfície operacional de criação e edição de Landing Pages.
- Quando a superfície existir, derivar o roteiro da etapa responsável e aplicar as mesmas fronteiras de identidade, ambiente, sanitização, qualidade visual e acessibilidade.
- O estado condicionado desta subseção não reabre nem bloqueia a conclusão das capacidades E17.9.3 a E17.9.6.

### 8.8. Validação e evidência da entrega

- Código ou configuração executável: `npm ci`, seguido de `npm run check`; não executar `npm run build` no sandbox do Codex.
- Documentação isolada: revisão estrutural, `git diff --check` e conferência de residência canônica; `npm ci` e `npm run check` são não aplicáveis somente enquanto o checkpoint for exclusivamente documental.
- Migration: conferir definição anterior, função resultante, invocação, `search_path`, grants, resultado negativo comum e positivo administrativo.
- Preview: conferir deploy contra o SHA remoto correto e executar a jornada na URL correspondente, nunca em Preview divergente.
- Evidência mínima por capacidade: SHA, ambiente, ator funcional, comportamento esperado e observado, resultado e risco residual; valores secretos, mailbox bruta e identificadores sensíveis são proibidos.

### 8.9. Condições de parada técnica

- A conta Gmail conectada não é a institucional e não pode ser reconectada por mecanismo autorizado.
- A identidade não dispõe de credencial armazenada fora da visibilidade do modelo ou de sessão segura reutilizável.
- O deploy não corresponde ao SHA remoto da branch.
- A definição hospedada do helper administrativo diverge da base usada pela migration.
- A migration não foi aplicada quando a jornada depender do novo claim.
- CAPTCHA, MFA, isolamento de sessão ou trust boundary não podem ser resolvidos pelos recursos institucionais já autorizados.
- A solução passaria a exigir nova automação, agente, Agents SDK, workflow, job, service, rota, banco, privilégio ou infraestrutura não aprovada.

### 8.10. Decisões de updates incorporadas

- Reutilizar o fluxo nativo de convite do Supabase e `/auth/confirm` já existentes.
- Usar o Supabase Plugin apenas para inspeção hospedada sanitizada; escrita continua por migration versionada.
- Aplicar inspeção visual proporcional às superfícies disponíveis, sem suíte fixa nem cenário novo codificado.
- Aplicar recorte focal de WCAG 2.2 sem alegar conformidade global ou ampliar o escopo de correção.
- Next.js, Vercel, Playwright, Agents SDK e demais referências ficam apenas como contexto; nenhuma atualização ou adoção adicional é necessária para esta entrega.

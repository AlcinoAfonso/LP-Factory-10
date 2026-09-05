# E5.1.4 — Mensagens públicas de erro de Auth

## 3. V1 funcional aprovada

As seções 3 a 6 constituem a V1 funcional aprovada deste plano.

### 3.1. Escopo

- Um único plano para `E5.1.4`.
- Usuário principal: pessoa não autenticada tentando entrar com e-mail e senha.
- O escopo fica restrito ao formulário de login.
- Signup, confirmação, recuperação de senha e demais superfícies de Auth não entram no plano.
- O fluxo de autenticação, sessão, redirect e autorização permanece inalterado.

### 3.2. Comportamento público

- Credenciais não aceitas: apresentar `E-mail ou senha inválidos.` sem distinguir e-mail inexistente de senha incorreta.
- Falha operacional, indisponibilidade ou erro não classificado como credencial: apresentar `Não foi possível entrar agora. Tente novamente em instantes.`
- Nenhuma mensagem técnica crua do provedor de Auth pode ser usada como copy pública.
- O link existente `Esqueci minha senha` permanece disponível; não criar nova ação ou fluxo de recuperação neste recorte.
- A linguagem pública deve ser clara, neutra, consistente e sem terminologia do fornecedor.

### 3.3. Diagnóstico e segurança

- Falhas de login devem continuar diagnosticáveis de forma segura conforme os contratos vigentes de observabilidade.
- O diagnóstico não pode registrar e-mail, senha, token, código, valores de formulário, secrets ou outra PII desnecessária.
- A V1 não autoriza criar rota, serviço, banco, job, agente, automação ou infraestrutura nova para logging.
- Se a investigação técnica posterior comprovar que o diagnóstico obrigatório não pode ser preservado dentro dos mecanismos e contratos existentes, o ponto deve ser escalado antes de ampliar a arquitetura.

## 4. Limites e escopo negativo

- Não redesenhar o fluxo de autenticação.
- Não criar nova arquitetura, banco, rota, job, agente, automação, serviço ou infraestrutura por antecipação.
- Não ampliar o recorte para outras superfícies de Auth.
- Não alterar segurança, sessão, redirect ou autorização já vigentes sem necessidade funcional comprovada e nova decisão competente.
- Não antecipar na V1 arquivos, helpers, adapters, migrations, boundaries ou sequência técnica ordinária.

## 5. Posição, classificação e supervisão

### 5.1. Posição no roadmap e classificação

- Recorte: `E5.1.4`.
- Posição planejada no roadmap: `E5` → `E5.1` → `E5.1.4`.
- Fase funcional: `E5.1.4` — normalizar a experiência pública de erro do login; o recorte é unitário e não exige subdivisão adicional.
- Quantidade de planos: 1.
- Dependências entre planos: nenhuma.
- Execução: Light.
- Automação: não aplicável; este recorte não cria automação.
- Supervisão: Semiautomático.
- Justificativa: o resultado funcional cabe na estrutura e nos contratos existentes e não exige derivação técnica formal por novidade, risco ou impacto material conhecido.

### 5.2. Regra do modo Semiautomático

- O Estrategista original permanece supervisor do plano.
- O humano transporta o handoff ao fluxo técnico competente e devolve ao Estrategista as entregas sucessivas.
- O Estrategista original avalia as entregas sucessivas e define os ajustes necessários; mudança funcional ou de escopo retorna ao Debate.
- Detalhes técnicos resolvíveis dentro da V1 devem retornar ao fluxo técnico sem reabrir o Debate.

### 5.3. Handoff previsto

- Execução: Light.
- Supervisão: Semiautomático.
- Automação: não aplicável.
- O fluxo seguinte deve usar integralmente esta V1 como fronteira funcional e seguir o roteamento de `docs/pipeline-plano-base.md`, sem ampliar seu escopo.
- O Debate não cria branch, PR, issue, V2 nem implementação.

## 6. Critérios funcionais de aceite e evidências

- Login válido continua autenticando e redirecionando como hoje.
- Credenciais não aceitas exibem somente a mensagem pública aprovada para esse estado.
- Falha operacional representativa exibe a mensagem pública aprovada para indisponibilidade, sem sugerir credenciais incorretas.
- Nenhum caso aprovado renderiza `error.message` ou outra mensagem técnica crua do provedor na interface.
- `Esqueci minha senha` continua disponível e funcional.
- O comportamento permanece diagnosticável de forma segura quando aplicável.
- Nenhuma outra superfície de Auth é alterada.
- As evidências devem cobrir login válido, credenciais não aceitas, falha operacional representativa, ausência de mensagem técnica pública, preservação do link de recuperação e diagnóstico seguro sem PII/credenciais introduzidas pelo plano.

## 7. V2 Light mínima

### 7.1. Contrato e fase

- Referência imutável da V1 oficial: commit `f5996af6e3aebfd0b01b579900bbff4914399e83`, neste mesmo arquivo.
- Fonte funcional: seções 3 a 6 do `Debate 4 — E5.1.4 Mensagens públicas de erro de Auth`.
- Fase única: `E5.1.4 — normalizar a experiência pública de erro do login`.
- Arquivo de runtime autorizado: `components/login-form.tsx`.
- Não há impacto em banco, migration, configuração operacional, sessão, redirect, autorização ou outras superfícies de Auth.

### 7.2. Implementação mínima

- No tratamento de falha já existente de `signInWithPassword`, classificar como credenciais não aceitas somente o erro cujo campo público `code` seja exatamente `invalid_credentials`; realizar essa verificação localmente no formulário, sem comparar texto do fornecedor e sem criar helper ou boundary novo.
- Renderizar `E-mail ou senha inválidos.` nesse caso e `Não foi possível entrar agora. Tente novamente em instantes.` para toda falha restante.
- Não renderizar, interpolar, persistir ou transportar `error.message`, o objeto de erro bruto ou outra copy técnica do provedor.
- Emitir o evento estruturado `auth_login_failed` pelo mecanismo de console vigente, serializado em JSON e limitado a timestamp, `outcome` (`denied` ou `error`) e `reason` (`invalid_credentials` ou `operational_failure`). A emissão não pode registrar e-mail, senha, token, código, formulário, secret ou o erro bruto, nem bloquear o fluxo quando o logging falhar.
- Preservar sem alteração o ramo de sucesso, `sanitizeNext`, o redirect e o link `Esqueci minha senha`.
- Manter a mensagem dinâmica em `FormFieldError`, que já fornece exatamente um `role="alert"`, sem componente, framework ou alegação de conformidade WCAG integral novos.

### 7.3. Updates incorporados

- `prod#16` — Em Preview, os estados aprovados de login devem ser validados em viewport desktop e mobile, confirmando legibilidade das mensagens, ausência de overflow ou regressão visual e preservação funcional do link `Esqueci minha senha`.
- `prod#17` — Cada mensagem dinâmica de erro do login deve permanecer exposta como alerta programático pelo componente vigente, além de visível em texto, sem que este recorte alegue conformidade WCAG 2.2 integral.
- `supa#5` — Os logs estruturados da aplicação permanecem o contrato principal de diagnóstico. Quando disponível no projeto, o Unified Logs pode ser usado apenas como evidência complementar de investigação de Auth, sem se tornar dependência do aceite nem autorizar nova infraestrutura.
- `vercel#31` — Este plano não altera `next`, `eslint-config-next`, lockfile ou configuração do framework e não encerra `vercel#31`; a correção crítica deve ser tratada em recorte técnico prioritário próprio, com validações integrais da stack.
- Oportunidades condicionais `supa#69` e `vercel#15` não serão implementadas neste recorte.

### 7.4. Validação e evidências

- Executar `npm ci`, `npm run check` e `git diff --check`.
- No Preview do PR, validar login com credenciais não aceitas e falha operacional representativa em desktop e mobile; em cada estado, confirmar a copy exata, um único `role="alert"`, legibilidade e ausência de overflow.
- Para a falha operacional, provocar somente uma indisponibilidade transitória e controlada no cliente de teste, sem alterar configuração hospedada.
- Confirmar que o DOM não contém mensagem técnica crua nos casos cobertos e que o console contém apenas o evento seguro previsto, sem PII ou credenciais introduzidas pelo plano.
- Confirmar que `Esqueci minha senha` permanece disponível e navega para `/auth/forgot-password`.
- Confirmar que login válido preserva o redirect vigente; se não houver credencial de QA aprovada disponível ao Executor, esta evidência permanece como teste humano obrigatório antes da declaração de conclusão.

### 7.5. Documentação canônica

- Avaliar `docs/roadmap.md` pelo ABC na consolidação final para registrar somente o estado implementado de `E5.1.4`, os artefatos reais e as evidências efetivamente obtidas.
- O layout legado atual da seção E5 usa `5.1` como bloco de status, enquanto a V1 planeja a posição `E5` → `E5.1` → `E5.1.4`; o ABC deve produzir o menor delta compatível com `docs/template-roadmap.md`, sem reescrever conteúdo adjacente por conveniência.
- `docs/base-tecnica.md` e `docs/design-system.md` já contêm os contratos técnicos aplicáveis; não há alteração necessária prevista, salvo conclusão diferente do ABC baseada no estado final.

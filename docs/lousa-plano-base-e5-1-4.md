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
- Supervisão: Autônomo.
- Justificativa: o resultado funcional cabe na estrutura e nos contratos existentes e não exige derivação técnica formal por novidade, risco ou impacto material conhecido.

### 5.2. Regra do modo Autônomo

- Após o handoff, a atuação rotineira do Estrategista original termina.
- O fluxo autônomo competente prossegue conforme `docs/pipeline-plano-base.md`, usando a V1 como fronteira funcional.
- O Estrategista original reassume somente em escaladas que envolvam produto, resultado funcional, escopo, mudança da V1, conflito de fontes sem precedência ou decisão humana indispensável.
- Detalhes técnicos resolvíveis dentro da V1 devem retornar ao fluxo técnico sem reabrir o Debate.

### 5.3. Handoff previsto

- Execução: Light.
- Supervisão: Autônomo.
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

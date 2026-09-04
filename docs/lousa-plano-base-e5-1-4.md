# V1 funcional — E5.1.4 Mensagens públicas de erro de Auth

## 1. Identificação e estado

- Recorte: `E5.1.4`.
- Status: V1 funcional aprovada.
- Path canônico do plano-base: `docs/lousa-plano-base-e5-1-4.md`.
- Quantidade de planos: 1.
- Dependências entre planos: nenhuma.
- Modo: Autônomo.
- Formato: Light.
- Automação do produto: não aplicável; este recorte não cria automação.

## 2. Problema e objetivo

- Problema: o login pode apresentar diretamente ao usuário uma mensagem técnica devolvida pelo provedor de Auth.
- Objetivo: controlar a experiência pública de erro do login, preservando clareza, segurança, privacidade, consistência de produto e diagnóstico técnico seguro quando aplicável.

## 3. Usuário e comportamento funcional

### 3.1. Usuário

- Pessoa não autenticada tentando entrar com e-mail e senha.

### 3.2. Credenciais não aceitas

- Apresentar: `E-mail ou senha inválidos.`
- Não distinguir publicamente e-mail inexistente de senha incorreta.

### 3.3. Falha operacional

- Para indisponibilidade, falha temporária ou erro não classificado como credencial, apresentar: `Não foi possível entrar agora. Tente novamente em instantes.`
- Não sugerir que as credenciais estão incorretas nesse estado.

### 3.4. Regras comuns

- Nenhuma mensagem técnica crua do provedor de Auth pode ser usada como copy pública.
- A linguagem pública deve ser clara, neutra, consistente e sem terminologia do fornecedor.
- O link existente `Esqueci minha senha` permanece disponível e funcional; este recorte não cria nova ação ou fluxo de recuperação.
- Login válido continua autenticando e redirecionando conforme o comportamento vigente.

## 4. Escopo, limites e segurança

### 4.1. Escopo

- O plano trata somente a experiência pública de erro do formulário de login.
- O comportamento deve permanecer diagnosticável de forma segura quando aplicável.

### 4.2. Escopo negativo

- Não redesenhar o fluxo de autenticação.
- Não incluir signup, confirmação, recuperação de senha ou outras superfícies de Auth.
- Não alterar sessão, redirect, autorização ou comportamento de segurança vigente sem nova decisão competente.
- Não criar por antecipação arquitetura, banco, rota, job, agente, automação, serviço ou infraestrutura.
- Não antecipar na V1 arquivos, helpers, adapters, migrations, boundaries ou sequência técnica ordinária.

### 4.3. Diagnóstico seguro

- Diagnóstico de falhas não pode registrar e-mail, senha, token, código, valores de formulário, secrets ou outra PII desnecessária.
- Se a implementação comprovar que o diagnóstico obrigatório não pode ser preservado dentro dos mecanismos e contratos existentes, o ponto deve ser escalado antes de ampliar a arquitetura.

## 5. Critérios funcionais de aceite

- Login válido continua funcionando sem regressão.
- Credenciais não aceitas exibem somente `E-mail ou senha inválidos.`
- Falha operacional representativa exibe `Não foi possível entrar agora. Tente novamente em instantes.`
- Nenhum caso coberto apresenta mensagem técnica crua do provedor na interface.
- `Esqueci minha senha` continua disponível e funcional.
- Falhas permanecem diagnosticáveis de forma segura quando aplicável.
- Nenhuma outra superfície de Auth é alterada.

## 6. Evidências esperadas

- Evidência de login válido sem regressão.
- Evidência de credenciais não aceitas com a mensagem pública aprovada.
- Evidência de falha operacional representativa com a mensagem pública aprovada.
- Evidência de ausência de mensagem técnica crua do provedor nos casos cobertos.
- Evidência de preservação do link de recuperação de senha.
- Evidência de diagnóstico seguro aplicável e ausência de PII ou credenciais em logs introduzidos ou alterados pelo plano.

## 7. Autoridade para condução Autônoma

- O Estrategista Autônomo pode liberar uma única task técnica, uma branch e um PR para este plano.
- Pode permitir decisões técnicas ordinárias necessárias para cumprir esta V1 dentro dos contratos e boundaries existentes.
- Deve exigir validações, QA e evidências do comportamento aprovado, determinar correções e concluir o plano sem intervenção humana por rotina.
- Pode fazer merge remoto somente quando os gates do Pipeline e do `AGENTS.md` estiverem satisfeitos.
- Não pode alterar esta V1, ampliar o escopo de Auth, criar nova infraestrutura material ou decidir mudança funcional sem escalada.

## 8. Handoff

- Esta V1 é o contrato funcional aprovado para o plano `E5.1.4`.
- O histórico do Debate 4 não integra o contrato de implementação.
- A task técnica deve materializar e congelar esta V1 no path canônico, no PR único do plano, antes da implementação Light.

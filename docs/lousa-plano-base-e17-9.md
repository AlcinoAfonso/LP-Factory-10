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

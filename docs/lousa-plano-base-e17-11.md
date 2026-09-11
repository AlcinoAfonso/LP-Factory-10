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

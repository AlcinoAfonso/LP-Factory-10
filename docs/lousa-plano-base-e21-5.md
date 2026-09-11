11/09/2026 — Plano-base v1 — E21.5 — Controle ativo de custos OpenAI por workload e conta

## 1. Estado e fonte canônica

- Estado: V1 funcional consolidada e aprovada.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.5 — Controle ativo de custos OpenAI por workload e conta`.
- Classificação de execução: Complexa.
- Supervisão: Autônomo.
- Plano conceitual: N/A.
- Fonte canônica: `Debate 10 — Controle de custos OpenAI por workload e conta — LP Factory 10`, seção `4.1. PB 1 — E21.5 Controle ativo de custos OpenAI por workload e conta — V1 aprovada`.
- Documento de origem: `https://docs.google.com/document/d/1CsT5NJ8E0JrXBiG_gumH91BxcGHpHi7kBQtimylrClg`.
- Revisão lida na materialização: `ANLCKQmckVTNl9jgl_EslpfkYDfzo--kW_9QHW3M0g5yvEUkN3rT_Hfz-pMmvZF_65YIFezoiDixyC1FpAPXWiN5zJ-fBky7M0M_0bp3nqU`.

## 2. Contrato funcional aprovado

### 2.1. Problema

- A LP Factory conhece o gasto oficial total da organização OpenAI e preserva histórico financeiro legado, mas não possui atribuição financeira transversal dos workloads vigentes no grão necessário para explicar custo por universo, conta, workload, execução, modelo, effort e operações cobradas.

### 2.2. Resultado funcional

- Cada execução abrangida deve poder ser atribuída ao responsável econômico quando comprovável e decomposta nas operações OpenAI efetivamente realizadas, permitindo somar, consultar e reconciliar custos de workloads atuais e futuros sem perder modelo, effort, retry e referência de baseline quando disponível.

### 2.3. Comportamento esperado

- Capturar os fatos financeiros de cada execução e operação.
- Manter exceções explícitas.
- Não duplicar retries.
- Derivar agregações por workload, conta e universo.
- Preservar o total oficial como autoridade de reconciliação.
- Manter uma única superfície administrativa de custos.

### 2.4. Atores

- `platform_admin` como usuário administrativo da visão financeira.
- Workloads OpenAI governados por E21 como produtores dos fatos técnicos necessários.

### 2.5. Decisões de produto

- Execução sem vínculo comprovável fica não atribuída.
- Operação sem custo calculável fica com custo indisponível.
- Nenhuma das duas situações inventa valor.
- Novo workload deve aderir ao mesmo contrato financeiro sem novo subsistema.
- Automação: não aplicável; a instrumentação é comportamento determinístico intrínseco ao runtime.

## 3. Posição e fases planejadas

- Posição planejada no roadmap: `E21.5 — Controle ativo de custos OpenAI por workload e conta`.
- `E21.5.3 Atribuição e evidência por execução`.
- `E21.5.4 Cálculo e reconciliação de custos`.
- `E21.5.5 Visão administrativa de custos`.

## 4. Critérios de aceite

- Toda execução abrangida é rastreável ao workload e ao responsável econômico quando comprovável.
- Operações e retries cobrados não são duplicados.
- Modelo e effort efetivos permanecem visíveis por operação.
- Custo da execução deriva somente das operações calculáveis.
- Exceções e custos indisponíveis permanecem explícitos.
- Total oficial permanece reconciliável.
- Falha financeira não bloqueia workload.
- Novo workload governado por E21 pode aderir ao mesmo contrato.
- `/admin/custos-openai` permanece superfície única de consulta administrativa.

## 5. Evidências esperadas

- Casos representativos de LP Factory, Cliente, retry, falha, custo indisponível e novo workload demonstram atribuição, agregação e reconciliação coerentes.
- A superfície administrativa comprova filtros e totais sem expor payload de negócio, prompt, resposta integral, PII ou secrets.

## 6. Limites e escopo negativo

- Não inclui ChatGPT, Codex, assinaturas ou créditos humanos.
- Não cria governança de Baseline de IA; apenas aceita referência/versionamento quando o workload a expuser.
- Não cria cobrança comercial do cliente.
- Não usa heurística para atribuição.
- Não bloqueia workload por falha financeira.
- Não executa a transição da E21.4 para histórico legado, reservada ao PB 2.
- Não apaga, reescreve ou reclassifica eventos históricos.
- Não amplia a E21.4 para transformá-la no novo contrato transversal.

## 7. Próxima ação

- Congelar esta V1 em commit próprio antes de qualquer derivação técnica ou avaliação especializada.
- Conduzir Gestor Estrutural e Gestor de Updates sobre o mesmo blob congelado.
- Registrar `Gestor de Automações: N/A — avaliação formal dispensada na V1`, conforme a decisão funcional aprovada de que automação não é aplicável.

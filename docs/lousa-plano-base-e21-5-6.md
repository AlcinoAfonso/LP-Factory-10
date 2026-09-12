12/09/2026 — Plano-base v1 — E21.5.6 — Visão econômica hierárquica de custos por evento

## 1. Estado e fonte canônica

- Estado: V1 funcional consolidada e aprovada nesta reabertura cirúrgica do Debate 10.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.5.6 — Visão econômica hierárquica de custos por evento`.
- Plano: `PB 3 — E21.5.6 Visão econômica hierárquica de custos por evento`.
- Classificação de execução: Complexa, com delta estritamente corretivo e preservação funcional dos PBs concluídos.
- Supervisão: Autônomo.
- Plano conceitual: N/A.
- Fonte canônica: `Debate 10 — Controle de custos OpenAI por workload e conta — LP Factory 10`, seção `4.3. PB 3 — E21.5.6 Visão econômica hierárquica de custos por evento — V1 aprovada`.
- Documento de origem: `https://docs.google.com/document/d/1CsT5NJ8E0JrXBiG_gumH91BxcGHpHi7kBQtimylrClg`.
- Revisão lida na materialização: `ANLCKQketXjusGrBwA5ymqMCE8oTP-nRqz6tC8AREyQwYkJ8rcmayCT8ZmkqqpmPrFdA2rZN1RyMDpzsplSyxRQ_BWSMhuaHBNz6WZJ0QLw`.

## 2. Contrato funcional aprovado

### 2.1. Problema

- A E21.5 mede corretamente custo por workload, execução e operação, mas a visão administrativa não consegue responder de forma humana e econômica quanto custou uma LP específica, uma ocorrência de resolução de nicho ou outro evento interno da LP Factory.

### 2.2. Resultado funcional

- Permitir que o administrador parta do custo total do período e faça drill-down até o custo unitário do evento de negócio, preservando a decomposição já existente por workload, execução e operação.

### 2.3. Arquitetura da informação

- Universo → responsável econômico (LP Factory ou conta de cliente) → evento de negócio → workload → execução/operação.
- Cada nível apresenta seu subtotal e o nível superior apresenta o total agregado correspondente.

### 2.4. Comportamento esperado

- A visão inicial apresenta gasto oficial OpenAI, total de Clientes, total da LP Factory e reconciliação.
- Ao abrir Clientes, apresenta contas por nome e custo.
- Ao abrir uma conta, apresenta eventos e respectivos custos.
- Ao abrir uma LP, apresenta os workloads e custos que compõem aquela LP.
- Ao abrir um workload, reutiliza o detalhamento técnico existente.
- LP Factory segue o mesmo drill-down a partir de seus eventos internos identificáveis.

### 2.5. Unidade econômica

- Para Landing Page, a LP específica é o evento econômico.
- Para resolução de nicho, cada ocorrência de resolução por IA é um evento econômico unitário.
- Outros casos usam a identidade funcional existente do evento quando houver vínculo comprovável.

### 2.6. Decisões de produto

- Correlação com evento é explícita e autorizada, nunca heurística.
- Nomes humanos e identidades de negócio têm precedência na UI sobre UUIDs.
- Execução sem evento comprovável continua visível como sem correlação de evento.
- Totais derivados não inventam valores ausentes.

### 2.7. Atores e automação

- `platform_admin` como usuário da visão econômica.
- Workloads E21 como produtores das execuções já custeadas.
- Entidades de negócio existentes apenas como referência quando forem a origem comprovada do evento.
- Automação: não aplicável; correlação determinística e consulta administrativa sob demanda.
- Como não existe possibilidade material de automação no PB 3, o Gestor de Automações não é acionado.

## 3. Posição e fase planejada

- Posição planejada no roadmap: `E21.5.6 — Visão econômica hierárquica de custos por evento`.
- `E21.5.6 — completar correlação econômica, read model e arquitetura da informação da superfície administrativa existente`.

## 4. Critérios de aceite

- Em um período selecionado, o administrador vê gasto oficial, subtotal de Clientes, subtotal da LP Factory e reconciliação.
- O administrador consegue abrir uma conta por nome e ver seus eventos com custo.
- O administrador consegue abrir uma LP específica e ver seu custo total e a decomposição por workload.
- O administrador consegue abrir uma ocorrência de resolução de nicho e ver seu custo unitário.
- O administrador consegue fazer o mesmo drill-down para eventos da LP Factory.
- Os subtotais fecham aritmeticamente com as execuções calculáveis.
- Eventos sem correlação comprovada permanecem explícitos.
- Nenhum vínculo é inferido por heurística.

## 5. Evidências esperadas

- Caso representativo de cliente com LP real.
- Caso de resolução de nicho.
- Caso de evento interno LP Factory.
- Caso sem correlação comprovável.
- Os quatro casos demonstram o drill-down e os totais na mesma superfície administrativa, preservando segurança e sem expor payload de negócio, prompt, resposta integral, PII ou secrets.

## 6. Limites e escopo negativo

- Preservar integralmente pricing, ledger, reconciliação oficial, segurança, histórico E21.4 e contratos funcionais já entregues por PB 1 e PB 2.
- Não reabrir PB 1 nem PB 2.
- Não criar novo engine de custos.
- Não criar novo dashboard financeiro nem nova residência analítica.
- Não criar cobrança comercial.
- Não criar backfill heurístico.
- Não criar governança de Baseline de IA.
- Não inferir vínculo por horário, proximidade, request ID, nome, volume ou outra heurística.
- Permanecer em `/admin/custos-openai`; não criar página financeira paralela.

## 7. Próxima ação

- Congelar esta V1 em commit próprio antes de qualquer derivação técnica ou avaliação especializada.
- Conduzir Gestor Estrutural e Gestor de Updates sobre o mesmo blob congelado.
- Registrar `Gestor de Automações: N/A — avaliação formal dispensada na V1`.

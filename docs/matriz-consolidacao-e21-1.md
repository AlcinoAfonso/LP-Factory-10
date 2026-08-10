# Matriz de consolidação — E21.1

## Referências imutáveis

- V1: PR #708, head `ae7b500d9e8a9dbe6388818c1c71f3333c7d51f7`, merge `c1de174a7214314bb7d1c5c368ec594b462bd95a`, blob `6a321794e9e124cf93295df8a9d0aeade94366a0` de `docs/lousa-plano-base-e21-1.md`.
- V2 inicial: commit `ee06f7e7274749b751f52e6bce862e987b2c63cb`, blob `9b458eb1f64cc76c1e0a02e8cf6d6384d249d9fe` do mesmo path.
- Plano conceitual: N/A.
- Gestor de Automações: N/A — as três fases da v1 estão marcadas com `Automação: não`.

## Consolidação dos pareceres

| Especialista | ID | Achado fiel ou referência inequívoca | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E21.1-01` | Classificação, boundary e path do domínio transversal estavam abertos. | Bloqueante com patch `PS-E21.1-01`. | Preservação. | Incorporado. | N/A. | §§2.3 e 3.1. | `lib/openai-workloads/` foi fixado como domínio transversal do Core, com seis arquivos permitidos, registry interno e API pública. |
| Gestor Estrutural | `GE-E21.1-02` | Configuração efetiva de produto e referência operacional do Supabase Inspect exigem contratos distintos; `revision` estava aberta. | Bloqueante com patch `PS-E21.1-02`. | Preservação. | Incorporado. | N/A. | §§2.2, 2.3, 2.6 e 3.1. | União `effective | inventory_reference`, APIs separadas, fontes explícitas e revisão opaca `"v1"` constam da v2. |
| Gestor Estrutural | `GE-E21.1-03` | Leituras indiretas da variável do perfil e mensagem client nominal ampliavam o inventário real de consumidores. | Bloqueante com patch `PS-E21.1-03`. | Preservação. | Incorporado. | N/A. | §§2.4 e 3.2. | A v2 exige remover as três leituras indiretas e a mensagem client, além das leituras dos providers. |
| Gestor Estrutural | `GE-E21.1-04` | Configuração, providers e observabilidade precisavam de separação executável sem cliente universal. | Bloqueante com patches `PS-E21.1-03` e `PS-E21.1-04`. | Preservação. | Incorporado. | N/A. | §§2.4, 2.5 e 3.2. | Providers de nicho/perfil ficam no lugar; só o transporte comercial é extraído; o boundary comum resolve configuração e normaliza/emite evento. |
| Gestor Estrutural | `GE-E21.1-05` | A página administrativa precisava de path e boundary de UI explícitos. | Bloqueante com patch `PS-E21.1-05`. | Preservação. | Incorporado. | N/A. | §§2.6 e 3.3. | A v2 limita a entrega a `app/admin/(protected)/workloads-openai/page.tsx` e `components/admin/adminNavigation.ts`, reutilizando shell e guard. |
| Gestor Estrutural | `GE-E21.1-06` | `model_env_var` se tornaria proveniência falsa em novos drafts, embora não haja mudança de schema. | Bloqueante com patch `PS-E21.1-06`. | Extensão adjacente necessária e proporcional. | Incorporado. | N/A. | §§2.8 e 3.2. | A v2 substitui somente a proveniência JSON dos novos drafts, sem backfill, migration, usage persistido ou mudança de ACL. |
| Gestor Estrutural | `GE-E21.1-07` | Roadmap não possuía E21 e a retirada das variáveis dependia de smoke pós-merge. | Bloqueante com patch `PS-E21.1-07`. | Extensão adjacente necessária e proporcional. | Incorporado com tradução objetiva para checkpoints no único PR. | N/A. | §§1.7, 3.2 e 3.4. | O roadmap será reconciliado antes da primeira fase no mesmo PR único; variáveis ficam como legado reversível e a remoção física ocorre só após smoke de Production, em fechamento posterior. |
| Gestor Estrutural | `GE-E21.1-08` | Validator focal não possuía path nem comando. | Bloqueante com patch `PS-E21.1-08`. | Preservação. | Incorporado. | N/A. | §§2.9, 3.1 e 3.2. | `lib/openai-workloads/validation-cases.ts`, `validate:openai-workloads` e comandos de regressão foram definidos. |
| Gestor de Updates | `prod#16` | A nova superfície já exige validação visual e de UX hospedada. | Elegível, complementar, horizonte atual. | Preservação. | Incorporado. | Usar como referência, validação ou trava. | §2.9, evidência visual e de acesso. | Texto literal exige Preview, apoio automático e revisão manual sem substituição. |
| Gestor de Updates | `prod#17` | O baseline acessível precisava dos critérios pertinentes e de limite contra alegação de conformidade integral. | Elegível, complementar, horizonte atual. | Extensão adjacente necessária e proporcional. | Incorporado. | Usar como referência, validação ou trava. | §2.9, evidência visual e de acesso. | Texto literal cobre teclado, foco, semântica/rótulos, contraste, estados e alvos de toque sem auditoria global. |
| Gestor de Updates | `vercel#1` | AI Gateway pode centralizar observabilidade/budgets ou fallback quando a integração direta deixar de atender. | Elegível, substituto, horizonte condicional. | Expansão se implementado agora. | Não incorporado — justificado. | Preservar como oportunidade estratégica condicional. | N/A. | Gatilho: necessidade comprovada de fallback ou observabilidade/budget não atendidos; E21.1 mantém Responses API direta e proíbe nova camada. |
| Gestor de Updates | `vercel#20` | Flags pode apoiar rollout/override futuro da configuração ativa. | Elegível, sobreposto, horizonte condicional. | Expansão se implementado agora. | Não incorporado — justificado. | Preservar como oportunidade estratégica condicional. | N/A. | Gatilho: recorte futuro aprovar rollout segmentado e comparação demonstrar superioridade; E21.1 proíbe flags, splits e A/B. |
| Gestor de Updates | `github#5` | Copilot CLI/SDK pode substituir parte do Supabase Inspect em eventual workflow agente concreto. | Elegível, sobreposto, horizonte condicional. | Expansão se implementado agora. | Não incorporado — justificado. | Preservar como oportunidade estratégica condicional. | N/A. | Gatilho: workload agente no Actions não atendido pelo fluxo vigente e comparação favorável; E21.1 não altera Inspect, permissões ou provedor. |
| Gestor de Automações | `AUTO-N/A` | Nenhuma fase contém `Automação: sim`. | N/A pelo contrato de acionamento. | Preservação. | Não incorporado — justificado. | N/A. | N/A. | §§3.1, 3.2 e 3.3 da v1 registram `Automação: não`; nenhum agente foi iniciado. |

## Travas preservadas

- Não introduzir AI Gateway apenas para dashboard, logs ou WebSocket.
- Não antecipar Flags, candidata, ativação, rollout, A/B ou overrides.
- Não substituir Supabase Inspect por Copilot CLI/SDK sem caso agente e comparação aprovados.
- Validação automática não substitui revisão visual/manual; WCAG 2.2 é baseline de critérios aplicáveis, não declaração de conformidade integral.
- Nenhum update autoriza banco, nova infraestrutura, mutação administrativa, exposição de secrets ou registro de prompts, respostas, PII ou payloads brutos.

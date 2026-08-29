# Matriz de consolidação — E20.7

## Referências imutáveis

- V1: PR #821, head `41b42d10a41115415d758f14cdc4047d76c40cf4`, blob `af505df611faf41531ef960787b42bb616801a29`, path `docs/lousa-plano-base-e20-7.md`.
- V2 avaliada na Passagem 1: commit `52012bd47a4340236a947d1f26af79d61cc43721`, blob `5d16e96cee593b33b74e8070f368dc4e7e734aa6`, mesmo path.
- Plano conceitual: N/A confirmado pela v1.
- Pareceres: Gestor Estrutural, Gestor de Updates e Gestor de Automações, todos read-only e produzidos uma única vez sobre o mesmo blob da v1.

## Matriz

| Especialista | ID | Achado ou decisão fiel | Classificação original do parecer | Relação com o escopo pela consolidação | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gestor Estrutural | GE-E20.7-01 | Fixar residência, separação domínio/adapters e API pública da E20.7. | N/A — o parecer não classificou achados individualmente. | extensão adjacente necessária e proporcional | incorporado | N/A | 1.2; 3.1 | `knowledge-resolution/`, adapters server-only e exports públicos normatizados. |
| Gestor Estrutural | GE-E20.7-02 | O matcher vigente converte falha operacional em `[]`. | N/A — o parecer não classificou achados individualmente. | extensão adjacente necessária e proporcional | incorporado | N/A | 1.6; 3.1 | Falha RPC/resposta/exceção não vira `dynamic_required`. |
| Gestor Estrutural | GE-E20.7-03 | Elegibilidade precisa reutilizar confiança e alias canônicos. | N/A — o parecer não classificou achados individualmente. | preservação | incorporado | N/A | 1.6; 2.2; 3.1 | Somente nome/alias exato ou normalizado autoriza `specialized_deep`; FTS, trigram e slug normalizado produzem `dynamic_required`. |
| Gestor Estrutural | GE-E20.7-04 | Descendência não pode criar terceira leitura privada de `business_taxons`. | N/A — o parecer não classificou achados individualmente. | extensão adjacente necessária e proporcional | incorporado | N/A | 2.2; 3.1 | Operação compartilhada e critérios de paginação >500, `416/PGRST103`, erro parcial, cadeia/identidade e regressão E20.5/E20.6. |
| Gestor Estrutural | GE-E20.7-05 | Novo workload exige expansão versionada E21.2 com segurança preservada. | N/A — o parecer não classificou achados individualmente. | extensão adjacente necessária e proporcional | incorporado | N/A | 1.9; 1.10; 3.2; 4.2 | Critérios explícitos 10→12, cardinalidade parcial, bootstrap idempotente, ampliação de allowlists/constraints e validações internas de `save`/`promote`, preservando assinaturas, RLS e grants. |
| Gestor Estrutural | GE-E20.7-06 | Adapter deve reutilizar o transporte Responses existente. | N/A — o parecer não classificou achados individualmente. | preservação | incorporado | N/A | 2.3; 3.2 | Único transporte e casos de cancelamento, timeout, refusal, erro e resposta inválida. |
| Gestor Estrutural | GE-E20.7-07 | Boundaries E19 e ausência de persistência já adequados. | N/A — o parecer não classificou achados individualmente. | preservação | incorporado | N/A | 1.2; 2.4; 2.5; 3.3; 4.1 | Integração E19 e persistência por LP permanecem fora. |
| Gestor de Updates | supa#51 | Preservar matcher `pg_trgm`/FTS/scores existente. | complementar; horizonte atual | preservação | incorporado | usar como referência, validação ou trava | 1.6 | Sem migration, índice, score ou threshold novo. |
| Gestor de Updates | supa#52 | Preservar normalização derivada e aliases canônicos. | complementar; horizonte atual | preservação | incorporado | usar como referência, validação ou trava | 1.6; 3.1 | Sem normalizador paralelo; caixa, acentuação e espaços cobertos pelo canônico. |
| Gestor de Updates | supa#53 | `pgmq` para curadoria assíncrona futura. | complementar; horizonte futuro | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Só com recorte futuro e backlog/SLA; fila/job/UI proibidos agora. |
| Gestor de Updates | supa#54 | Busca vetorial em futura validação semântica. | sobreposto; horizonte futuro | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Só com autorização, insuficiência medida e benchmark; embeddings/RAG proibidos agora. |
| Gestor de Updates | supa#69 | Trace application–Supabase futuro. | complementar; horizonte condicional | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Só com incidente, tracer e ganho medido; upgrade/OTel/Drain proibidos agora. |
| Gestor de Updates | vercel#1 | AI Gateway futuro. | sobreposto; horizonte condicional | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | Só com insuficiência direta ou multi-provider aprovado; Gateway/fallback proibidos agora. |
| Gestor de Automações | AUT-E20.7.4-P01 | IA pesquisa/estrutura delta em uma requisição foreground. | 2.1.3 — Automação com IA em fluxo controlado | preservação | incorporado | N/A | 1.7; 3.2 | Sem agentic, PTC, Deep Research model, job, retry ou fallback. |
| Gestor de Automações | AUT-E20.7.4-P02 | Request mono-tool, estruturado e sem estado conversacional. | 2.1.3 — Automação com IA em fluxo controlado | extensão adjacente necessária e proporcional | incorporado | N/A | 2.3 | Campos e limites explícitos; fontes oficiais revalidadas antes da ativação. |
| Gestor de Automações | AUT-E20.7.4-P03 | Contagens/fontes vêm do payload real. | 2.1.3 — Automação com IA em fluxo controlado | extensão adjacente necessária e proporcional | incorporado | N/A | 2.3; 2.4 | Zero/três chamadas ou referência não comprovada falham fechado. |
| Gestor de Automações | AUT-E20.7.4-P04 | Schema discrimina status e combinações válidas. | 2.1.3 — Automação com IA em fluxo controlado | extensão adjacente necessária e proporcional | incorporado | N/A | 2.3 | Invariantes dos três status explícitos. |
| Gestor de Automações | AUT-E20.7.4-P05 | Inputs/web não confiáveis, allowlist e sanitização. | 2.1.3 — Automação com IA em fluxo controlado | extensão adjacente necessária e proporcional | incorporado | N/A | 2.3; 2.5 | Sem PHI/secrets/logs de payload; `store:false` não é ZDR. |
| Gestor de Automações | AUT-E20.7.4-P06 | Workload próprio em E21.1/E21.2 com ativação humana. | 2.1.3 — Automação com IA em fluxo controlado | extensão adjacente necessária e proporcional | incorporado | N/A | 1.9; 1.10; 3.2 | Lifecycle por ambiente, sem secret/config paralela. |
| Gestor de Automações | AUT-E20.7.4-P07 | Telemetria segura sob E21.1 e finanças sob E21.4. | 2.1.3 — Automação com IA em fluxo controlado | preservação | incorporado | N/A | 1.9; 2.5; 3.2 | Atribuição causal E21.4 e nenhum cálculo/persistência E20.7. |
| Gestor de Automações | VM-E20.7.4-01 | Configuração própria exige hipótese ou comparação focal. | requer validação material pelo Analista | extensão adjacente necessária e proporcional | incorporado | N/A | 1.7; 2.3; 3.2 | Comparação autorizada; search context code-owned E21.1 e modelo/effort E21.2. |
| Gestor de Automações | AUT-E20.7.4-O01 | Prompt segue templates, separa instructions/input e cobre casos representativos. | 2.1.3 — Automação com IA em fluxo controlado | extensão adjacente necessária e proporcional | incorporado | N/A | 3.2 | Prompt versionado, sem reusable prompt object, com casos típicos/limítrofes/adversariais. |
| Gestor de Automações | AUT-E20.7.4-O02 | Orçamento de contexto não pode truncar silenciosamente. | 2.1.3 — Automação com IA em fluxo controlado | extensão adjacente necessária e proporcional | incorporado | N/A | 3.2 | Excesso falha antes do transporte. |
| Gestor de Automações | AUT-E20.7.4-O03 | Destinos documentais da automação e configuração. | 2.1.3 — Automação com IA em fluxo controlado | preservação | incorporado | N/A | 3.2 | ABCs exigidos para Automations, Platform Config, Base Técnica, Schema e Model Snapshot. |

## Correções do Analista

| ID | Correção objetiva | Tratamento | Localização |
| --- | --- | --- | --- |
| AN-E20.7-01 | Usar atribuição financeira causal da E21.4. | incorporado | v2 1.9; matriz AUT-P07 |
| AN-E20.7-02 | Tornar `search_context_size` code-owned E21.1; E21.2 governa apenas modelo/effort. | incorporado | v2 1.7, 2.3, 3.2; matriz VM-01 |
| AN-E20.7-03 | Completar paginação, erros e regressão dos consumidores compartilhados. | incorporado | v2 3.1; matriz GE-04 |
| AN-E20.7-04 | Exigir deltas canônicos da automação/configuração/boundary. | incorporado | v2 3.2; matriz AUT-O03 |
| AN-E20.7-05 | Converter 10→12, ampliação de allowlists/constraints e validações internas de `save`/`promote`, com assinaturas e segurança preservadas, em aceite verificável. | incorporado | v2 3.2; matriz GE-05 |
| AN-E20.7-06 | Separar classificação original do parecer da classificação de escopo. | incorporado | cabeçalho e todas as linhas da matriz |
| AN-E20.7-07 | Incorporar contrato de prompt, orçamento sem truncamento e destinos documentais. | incorporado | v2 3.2; matriz AUT-O01/O02/O03 |
| AN-E20.7-08 | Explicitar normalização canônica e cancelamento do transporte nos testes. | incorporado | v2 3.1/3.2; matriz supa#52/GE-06 |

## Decisões humanas pós-merge do PR #821

| ID | Decisão | Relação com o escopo | Tratamento | Localização |
| --- | --- | --- | --- | --- |
| HUM-E20.7-P1-01 | Autorizar `specialized_deep` somente para `alias_exact`, `alias_normalized`, `taxon_name_exact` ou `taxon_name_normalized`; FTS, trigram ou slug normalizado isolados produzem `dynamic_required` sem invalidar oferta. | preservação e estreitamento fail-closed da decisão funcional | incorporado | v2 1.1, 1.6, 2.2 e 3.1 |
| HUM-E20.7-P1-02 | `CURRENT=6` permite planejamento, implementação repo-side e testes determinísticos da E20.7.3; reconciliação v6 bloqueia somente prova/ativação hospedada. | preservação da sequência operacional sem antecipar autoridade hospedada | incorporado | v2 1.10 e 3.1 |
| HUM-E20.7-P1-03 | Preservar `E20.7.3 → aprovação → E20.7.4` e confrontar contratos com o estado do PR #831 antes da `.4`, parando só por sobreposição material aberta. | preservação de gate e extensão adjacente de revalidação | incorporado | v2 3.2, 3.3 e 4.2 |
| HUM-E20.7-P1-04 | PR #822, integração E19, E19.5.4 e E21.3.4 permanecem fora. | preservação do escopo negativo | incorporado | v2 4.1 |

## Estado do gate

- Passagens 1 e 2 preservadas integralmente no task: `aprovado com correções obrigatórias`.
- Correções objetivas anteriores e P1 humano pós-merge aplicados na v2 e nesta matriz; revisão delta pelo mesmo Analista pendente.

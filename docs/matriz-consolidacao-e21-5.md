11/09/2026 — Matriz de consolidação — E21.5 — Controle ativo de custos OpenAI por workload e conta

## 1. Referências imutáveis

- V1: commit `a85cf61c2a91b7181424e12eb31f9ca10afad6c3`, blob `22561d701463f2af9a13719fd816d1b20b2bca7f`, `docs/lousa-plano-base-e21-5.md`.
- V2 candidata corrigida: commit `6af3d47bf4d1b0e97e0b28f90ab61bf3bff0f181`, blob `9bb7e93aec8816ab497add8dc21c41cdef72c0a9`, no mesmo path.
- Roadmap-base: `origin/main@89c11b904ff66cd1e85629f2efa6eb2b8a2f16cb`, blob `b1650877c2279a9dc881043c8a99a7568c06c039`.
- Gestor Estrutural: derivação inicial `aprovado com condicionantes`, `GE-E21.5-01..10` e `C-GE-E21.5-01..08`.
- Gestor de Updates: `updates aplicáveis com patches autossuficientes`.
- Gestor de Automações: `N/A — avaliação formal dispensada na V1`.
- Confrontos estruturais: N/A no recorte atual; nenhum update aplicado possui impacto estrutural material.
- Analista Passagem 1: `aprovado com correções obrigatórias`; revisão delta das quatro correções: `aprovado para merge do plano-base v2`.

## 2. Matriz

| ID | Origem | Classe | Achado ou obrigação | Tratamento | Localização/evidência na V2 | Destino do update / confronto |
| --- | --- | --- | --- | --- | --- | --- |
| V1-E21.5-01 | v1 | derivação técnica da v1 | Distinguir universo LP Factory e Clientes e vincular conta somente com prova. | Incorporado, sem heurística ou fallback. | §§ 8.1, 9.1, 10.2 e 14.1. | N/A |
| V1-E21.5-02 | v1 | derivação técnica da v1 | Preservar exceção não atribuída. | Incorporado como `attribution_status = unassigned` e grupo explícito. | §§ 8.1, 9.1, 11.2 e 12.1. | N/A |
| V1-E21.5-03 | v1 | derivação técnica da v1 | Separar execução funcional, operação cobrável e retry. | Incorporado com IDs, sequência, relação de retry e replay idempotente. | §§ 8.1, 9.1–9.2, 10.1 e 14.1. | N/A |
| V1-E21.5-04 | v1 | derivação técnica da v1 | Preservar modelo, effort, baseline opcional e usage por operação. | Incorporado no contrato ativo e no detalhamento administrativo. | §§ 9.1, 10.2, 11.2 e 12.1. | N/A |
| V1-E21.5-05 | v1 | derivação técnica da v1 | Custo deriva apenas de operação calculável; indisponibilidade não vira zero. | Incorporado com `cost_status`, custo nulo e proibição de subtotal parcial. | §§ 8.1, 9.1, 11.1–11.2 e 14.2. | N/A |
| V1-E21.5-06 | v1 | derivação técnica da v1 | Total oficial permanece autoridade e reconciliável. | Incorporado como composição oficial menos ativo calculável menos legado. | §§ 8.1, 11.3, 12.1 e 14.2. | N/A |
| V1-E21.5-07 | v1 | derivação técnica da v1 | Falha financeira não bloqueia workload. | Incorporado em recorder aguardado, budget curto e falha encapsulada. | §§ 8.1, 10.1, 14.1 e 15.2. | N/A |
| V1-E21.5-08 | v1 | derivação técnica da v1 | Novo workload E21 adere ao mesmo contrato. | Incorporado com contexto econômico obrigatório e validação do inventário. | §§ 8.1 e 10.2. | N/A |
| V1-E21.5-09 | v1 | derivação técnica da v1 | `/admin/custos-openai` permanece superfície única, segura e sem payload/PII/secrets. | Incorporado sem nova rota administrativa. | §§ 8.3 e 12.1–12.2. | N/A |
| V1-E21.5-10 | v1 | ampliação de escopo | PB 2, cobrança comercial, governança de baseline, créditos humanos e reclassificação histórica. | Excluídos expressamente. | § 6 e § 17.2. | N/A |
| GE-E21.5-01 | invariante técnico | derivação técnica da v1 | Residência financeira transversal em `lib/openai-costs/`. | Incorporado; `lib/openai-workloads/` mantém identidade/configuração/usage. | §§ 8.2–8.3. | N/A |
| GE-E21.5-02 | invariante técnico | derivação técnica da v1 | `openai_lp_*` é histórico congelado e não pode virar write-side ativo. | Incorporado com ledger novo e proibição de alteração. | §§ 8.1–8.2, 9.3, 11.3 e 17.2. | N/A |
| GE-E21.5-03 | invariante técnico | derivação técnica da v1 | Logs atuais não provam grão financeiro. | Incorporado com tabelas, RPCs e recorder próprios. | §§ 9 e 10. | N/A |
| GE-E21.5-04 | invariante técnico | derivação técnica da v1 | `supabase_inspect` é workload vigente e multioperação. | Incorporado: uma execução por modo IA e operação por chamada real. | §§ 10.2–10.3 e 14.1. | N/A |
| GE-E21.5-05 | invariante técnico | derivação técnica da v1 | Preservar DSN read-only do workflow. | Incorporado via ingresso HMAC sem `service_role`. | §§ 8.3, 10.3 e 13. | N/A |
| GE-E21.5-06 | invariante técnico | derivação técnica da v1 | Não recalcular história com preço corrente. | Incorporado com versão, vigência e snapshot terminal. | §§ 9.1 e 11.1. | N/A |
| GE-E21.5-07 | invariante técnico | derivação técnica da v1 | Dashboard deve compor oficial, ativo e legado sem executar PB 2. | Incorporado sem clamp, com timestamps separados. | §§ 11.3 e 12.1. | N/A |
| GE-E21.5-08 | invariante técnico | derivação técnica da v1 | Best-effort precisa ser aguardado, não fire-and-forget. | Incorporado com budget próprio e retorno funcional preservado. | § 10.1. | N/A |
| GE-E21.5-09 | invariante técnico | derivação técnica da v1 | Filtro interno não altera total oficial. | Incorporado explicitamente. | §§ 11.3, 12.1 e 14.2. | N/A |
| GE-E21.5-10 | invariante técnico | derivação técnica da v1 | RLS e grants são ambos obrigatórios. | Incorporado com ACLs, funções, triggers e testes. | §§ 9.2–9.3 e 15. | N/A |
| C-GE-E21.5-01 | invariante técnico | derivação técnica da v1 | Cobrir cinco workloads atuais e exigir contexto futuro. | Incorporado no inventário/aceite. | §§ 10.2 e 14.1. | N/A |
| C-GE-E21.5-02 | invariante técnico | derivação técnica da v1 | Preservar E21.4 intacta. | Incorporado; será validado pela inspeção do diff da migration nova e pelos testes legados. | §§ 9.3, 14.1–14.2 e 15.1. | N/A |
| C-GE-E21.5-03 | invariante técnico | derivação técnica da v1 | Provar duas operações, retry cobrado e replay sem duplicação. | Incorporado em constraints, RPCs e fixtures. | §§ 9.1–9.2, 10.1 e 14.1. | N/A |
| C-GE-E21.5-04 | invariante técnico | derivação técnica da v1 | Indisponível difere de zero e subtotal não é total. | Incorporado. | §§ 8.1, 9.1, 11 e 12. | N/A |
| C-GE-E21.5-05 | invariante técnico | derivação técnica da v1 | Falha de toda gravação não altera retorno funcional. | Incorporado em testes de start/finish/timeout/resposta inválida. | §§ 10.1, 14.1 e 15.1. | N/A |
| C-GE-E21.5-06 | invariante técnico | derivação técnica da v1 | Workflow sem credencial mutável e ingresso antirreplay. | Incorporado. | §§ 10.3, 13.1 e 14.1. | N/A |
| C-GE-E21.5-07 | invariante técnico | derivação técnica da v1 | Reconciliação global não acompanha filtros internos. | Incorporado. | §§ 11.3 e 14.2. | N/A |
| C-GE-E21.5-08 | invariante técnico | derivação técnica da v1 | Provar banco por teste, snippet, Security Controls e keyset. | Incorporado como gate local e pós-merge. | §§ 9.2–9.3 e 15. | N/A |
| A-P1-E21.5-01 | invariante técnico | derivação técnica da v1 | Web Search possui unidade cobrável além de tokens. | Corrigido: quantidade, modalidade, preço/snapshot e custo integral indisponível sem tarifa. | §§ 9.1, 11.1, 14.2, 15.1 e 16. | N/A |
| A-P1-E21.5-02 | invariante técnico | derivação técnica da v1 | Prova administrativa precisa de origem tipada. | Corrigido com `execution_origin = runtime | administrative_proof`. | §§ 9.1, 10.2, 14.1 e 16. | N/A |
| A-P1-E21.5-03 | invariante técnico | derivação técnica da v1 | Protocolo do `supabase_inspect` precisa fechar ambiente/configuração e excluir SQL batch. | Corrigido com Config allowlisted e validação contra registry. | §§ 10.3, 13.1, 14.1 e 16. | N/A |
| A-P1-E21.5-04 | invariante técnico | derivação técnica da v1 | Gate e cobertura precisam corresponder a fatos consumíveis. | Corrigido com gate Core por ambiente, gate do ingresso e cortes individuais; logs não viram fatos. | §§ 11.2, 13.1–13.2 e 16. | N/A |
| UP-vercel-32 | update | modernização técnica justificada | Classificar assinatura como Secret e URL/versão/ambiente/gates como Config. | Aplicar agora, com escopo mínimo e sem valores em evidência. | §§ 13.1, 15.2 e 16. | Destino: configuração e QA E21.5.3; confronto: N/A, impacto estrutural baixo. |
| UP-prod-17 | update | modernização técnica justificada | WCAG 2.2 focal na superfície financeira. | Aplicar agora sem alegar conformidade integral. | §§ 12.2, 14.3, 15.1 e 16. | Destino: UI/QA E21.5.5; confronto: N/A, impacto estrutural baixo. |
| UP-supa-02 | update | derivação técnica da v1 | Security Controls como evidência complementar pós-apply. | Usar como referência/trava, sem substituir testes e snippet. | §§ 13.2 e 15.2. | Destino: validação pós-merge; confronto: N/A. |
| UP-vercel-01 | update | ampliação de escopo | AI Gateway poderia sobrepor transporte/telemetria. | Não implementar; preservar hipótese futura condicionada. | §§ 16 e 17.2. | Destino: oportunidade futura somente diante de múltiplos provedores/fallback ou lacuna operacional mensurada que o ledger não resolva, após comparar cobertura, custo, latência, retenção e disponibilidade; confronto estrutural obrigatório. |
| UP-supa-63 | update | ampliação de escopo | `rlsautotest` beta para matriz ampla de RLS. | Não implementar; testes SQL focais bastam hoje. | §§ 16 e 17.2. | Destino: oportunidade condicional somente com várias policies/identidades reais, repetição de matrizes e prova isolada de ganho sobre testes SQL específicos; confronto atual: N/A. |
| UP-supa-64 | update | ampliação de escopo | CDC/Pipeline para segunda residência analítica. | Não implementar sem carga e destino aprovados. | §§ 16 e 17.2. | Destino: oportunidade futura somente com carga mensurada, destino analítico aprovado, responsável operacional e superioridade sobre agregação interna ou exportação pontual; confronto estrutural obrigatório. |
| UP-supa-69 | update | ampliação de escopo | W3C Trace Context para diagnóstico. | Não implementar sem incidente e tracer aprovados. | §§ 16 e 17.2. | Destino: oportunidade condicional somente diante de incidente recorrente que `request_id` e IDs financeiros não expliquem, tracer aprovado e benefício mensurável; confronto atual: N/A. |
| UP-supa-05 | update | ampliação de escopo | Logs operacionais como ledger. | Rejeitado: não fornecem durabilidade/idempotência/atribuição. | Tratamento reside nesta matriz e no parecer de Updates; N/A na V2. | Destino: rejeitado; confronto: N/A. |
| UP-supa-33 | update | ampliação de escopo | Métricas de infraestrutura do banco. | Rejeitado: não medem operações/custos OpenAI. | Tratamento reside nesta matriz e no parecer de Updates; N/A na V2. | Destino: rejeitado; confronto: N/A. |
| UP-supa-46 | update | ampliação de escopo | Logs Drains. | Rejeitado: não substitui fatos financeiros e plano atual não é apto. | Tratamento reside nesta matriz e no parecer de Updates; N/A na V2. | Destino: rejeitado; confronto: N/A. |
| UP-supa-52 | update | ampliação de escopo | Generated column para custo. | Rejeitado: acopla regra temporal ao schema e não reduz a lógica segura. | §§ 9.1 e 11.1. | Destino: rejeitado; confronto: N/A. |
| UP-supa-70 | update | ampliação de escopo | Novo agente/assistente Supabase. | Rejeitado: duplica automação e não resolve atribuição. | Tratamento reside nesta matriz e no parecer de Updates; N/A na V2. | Destino: rejeitado; confronto: N/A. |
| UP-vercel-26 | update | ampliação de escopo | Cache Reasons. | Rejeitado: irrelevante ao ledger; rota permanece dinâmica e autenticada. | Tratamento reside nesta matriz e no parecer de Updates; N/A na V2. | Destino: rejeitado; confronto: N/A. |
| UP-vercel-31 | update | modernização técnica justificada | Atualização Next.js. | Sem delta: repositório já está em `16.3.3`. | Evidência em `package.json` e `package-lock.json`; N/A na V2. | Destino: já absorvido; confronto: N/A. |
| UP-github-05 | update | ampliação de escopo | Créditos Copilot CLI/SDK. | Rejeitado pelo escopo financeiro da V1. | § 6; demais razões residem nesta matriz e no parecer de Updates. | Destino: rejeitado; confronto: N/A. |
| UP-github-14 | update | ampliação de escopo | Evidência bruta de Actions como residência. | Rejeitado; capacidade global já existe e ledger deve residir no banco. | §§ 9 e 10.3. | Destino: já absorvido fora do recorte; confronto: N/A. |
| UP-prod-12 | update | ampliação de escopo | Navegação Partner → Conta → LP. | Rejeitado: não equivale aos filtros financeiros internos. | § 12.1. | Destino: rejeitado; confronto: N/A. |
| UP-prod-18 | update | ampliação de escopo | Distribuição por plugin/MCP. | Rejeitado: não participa de captura, atribuição ou consulta. | Tratamento reside nesta matriz e no parecer de Updates; N/A na V2. | Destino: rejeitado; confronto: N/A. |

## 3. Resultado da consolidação

- Todo item incorporado permanece dentro do resultado funcional do PB 1.
- Os dois updates aplicados agora possuem impacto estrutural baixo e funcional nulo; não exigem confronto focal.
- Itens futuros, condicionais ou rejeitados não autorizam código, infraestrutura, dependência, credencial ou QA neste PR.
- PB 2 e a governança de Baselines de IA permanecem fora do escopo.

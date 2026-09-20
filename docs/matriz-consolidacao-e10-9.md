# Matriz de consolidação — E10.9 PB1

- Caso: Pending Setup pré-comercial conversacional.
- V1: `f40248a69002483f8fb378f470ca73afd34475dd`, blob `48fb3e8c81b78369485fc43d0e2bc86c2b0cafc0`.
- V2 aprovada anterior: `03b173968fa2027aeeba1d77dec4c427d5c8e928`, blob `7efea17fae416aa92bd6cd6ca1c3925fdc9c156c`.
- Roadmap base: `b63241e62b79a51855f906e8cb80589f1d499930`, blob `3845dd92026e273ef3e7b64d9a5459802d1b3bce`.
- Passagens 1 e 2: `aprovado com correções obrigatórias`; correções objetivas incorporadas na V2 candidata posterior e rastreadas abaixo para revisão delta.
- Pareceres integrais: Gestor Estrutural `derivacao_inicial`, Gestor de Updates e Gestor de Automações, preservados no histórico desta task. Confronto estrutural de modernização: N/A, pois `prod#17` tem impacto estrutural baixo.

| ID | Origem | Classe | Tratamento | Localização e evidência na V2 candidata | Destino / confronto |
|---|---|---|---|---|---|
| V1-01 | v1 4.1.1–4.1.2 | derivação técnica da v1 | Entrada após autenticação e conta inicial, nome por usuário, diálogo progressivo | 4.1.1–4.1.2; guard, estados e perguntas | E10.9.3–10.9.4 |
| V1-02 | v1 4.1.3–4.1.4 | derivação técnica da v1 | Resolver com autoridade oficial, três caminhos e fallback sem taxon inventado | 4.1.4; matching, confiança, IA estruturada e adapters existentes | E10.9.4 |
| V1-03 | v1 4.1.3 | derivação técnica da v1 | Preservar WhatsApp, accounts.name e schema histórico sem campos herdados obrigatórios | 4.1.3; gravação parcial e prova antes da remoção | E10.9.3–10.9.6 |
| V1-04 | v1 4.1.5 | derivação técnica da v1 | Histórico funcional por usuário/conta, turnos recuperáveis e autorização server-side | 4.1.6; três entidades focais e isolamento | E10.9.5 |
| V1-05 | v1 4.1.3, 4.1.7 | derivação técnica da v1 | Active sem entitlement; preservar comercial, checkout e onboarding factual condicionado ao taxon oficial | 4.1.1, 4.1.7; testes de transição e gates | E10.9.6 |
| GE-PB1-01 | invariante técnico; fluxo E10.4/E10.5 vigente | derivação técnica da v1 | Substituir ativação antes da resolução por caminho único com conclusão persistida | 4.1.1, 4.1.3, 4.1.4; `actions.ts` ativa antes de resolver | E10.9.4–10.9.6 |
| GE-PB1-02 | v1; ausência de residência no schema | derivação técnica da v1 | Criar nome por usuário e histórico por conta/turno, com retry e retomada | 4.1.6; `docs/schema.md` 1.8 e 1.19 não são transcript | E10.9.3, E10.9.5 |
| GE-PB1-03 | v1; `accountProfileAdapter.ts` | derivação técnica da v1 | Gravar somente WhatsApp informado sem limpar valor existente | 4.1.3; upsert atual pode enviar `whatsapp: null` | E10.9.3 |
| GE-PB1-04 | invariante técnico E10.5 | derivação técnica da v1 | Reutilizar matching, confiança, resolução operacional e vínculo oficial | 4.1.4; `lib/onboarding/niche-resolution/` | E10.9.4 |
| GE-PB1-05 | invariante técnico de dados pessoais | derivação técnica da v1 | Migration com RLS, grants, revogação `ai_readonly` e prova Data API | 4.1.6; `docs/base-tecnica.md` e `docs/schema.md` | E10.9.5 |
| GE-PB1-06 | v1; consumidor histórico em `page.tsx` | derivação técnica da v1 | Remover jornada antiga órfã; preservar card apenas para consumidor histórico comprovado | 4.1.3; condicionamento ainda requer detalhe apontado na Passagem 1 | E10.9.6 |
| GE-PB1-07 | v1; checkout e loader atuais | derivação técnica da v1 | Reusar transição condicional, sem escrita de entitlement | 4.1.1, 4.1.7; gates de checkout preservados | E10.9.6 |
| AUT-10.9.3 | v1 4.1.2; automação | derivação técnica da v1 | Identidade e nome determinísticos sem OpenAI | 4.1.2; owner/membership e nome por usuário | E10.9.3 |
| AUT-10.9.4 | v1 4.1.4; automação | derivação técnica da v1 | IA só para semântica necessária, saída validada e telemetria sanitizada | 4.1.4; `niche_resolution`, Responses, `store:false` | E10.9.4 |
| AUT-10.9.5 | v1 4.1.1; automação | derivação técnica da v1 | Histórico local e retomada determinística sem transcript integral no provider | 4.1.6; turnos e autorização | E10.9.5 |
| AUT-10.9.6 | v1 4.1.3; automação | derivação técnica da v1 | Promoção e escolha comercial determinísticas | 4.1.1, 4.1.7; sem entitlement | E10.9.6 |
| P-AUT-01 | v1; parecer de Automações | derivação técnica da v1 | Entrada e nome determinísticos, sem IA | 4.1.2 | E10.9.3 |
| P-AUT-02 | v1; parecer de Automações | derivação técnica da v1 | Matching antes da IA, três caminhos e fallback | 4.1.4 | E10.9.4 |
| P-AUT-03 | v1; parecer de Automações | derivação técnica da v1 | Workload E21, Responses com `store:false` e falhas tipadas | 4.1.4 | E10.9.4 |
| P-AUT-04 | v1; parecer de Automações | derivação técnica da v1 | Prompt versionado e telemetria sanitizada | 4.1.4 | E10.9.4 |
| P-AUT-05 | v1; parecer de Automações | derivação técnica da v1 | Histórico local com acesso server-side | 4.1.6 | E10.9.5 |
| P-AUT-06 | v1; parecer de Automações | derivação técnica da v1 | Promoção e comercial determinísticos | 4.1.1, 4.1.7 | E10.9.6 |
| P-AUT-07 | invariante técnico de residência documental | derivação técnica da v1 | Atualizar automação e documentos só com estado factual implementado | 4.1.7; ABC posterior | `docs/automations.md`, base, schema, roadmap |
| prod#17 | update; catálogo `docs/prod-up.md` | modernização técnica justificada | Aplicar acessibilidade focal à UI nova, sem auditoria global | 4.1.7; teclado, foco, identificação, contraste e toque | V2 4.1.7; confronto N/A, impacto estrutural baixo |
| supa#51 | update; catálogo `docs/supa-up.md` | derivação técnica da v1 | Referência/trava: reutilizar `pg_trgm` atual | 4.1.4; matching determinístico existente | Validação E10.9.4; confronto N/A |
| supa#52 | update; catálogo `docs/supa-up.md` | derivação técnica da v1 | Referência/trava: reutilizar alias normalizado atual | 4.1.4; taxonomia existente | Validação E10.9.4; confronto N/A |
| vercel#31 | update; catálogo `docs/vercel-up.md` | derivação técnica da v1 | Trava factual: Next.js e ESLint já fixados em 16.3.3; não abrir upgrade | `package.json` e lockfile no HEAD/base | Validação do deploy; confronto N/A |
| vercel#32 | update; catálogo `docs/vercel-up.md` | derivação técnica da v1 | Trava condicional: tipar/classificar variável somente se houver variável nova | 4.1.7; `docs/platform-config.md` apenas se mudar | Configuração; confronto N/A |
| prod#14 | update; catálogo `docs/prod-up.md` | derivação técnica da v1 | Referência para clareza de estado e próximo passo | 4.1.2, 4.1.7; estados compreensíveis | QA E10.9.3–10.9.6; confronto N/A |
| prod#16 | update; catálogo `docs/prod-up.md` | derivação técnica da v1 | Referência de QA visual em Preview, já exigido pela V1 | 4.1.7; móvel/desktop | QA; confronto N/A |
| prod#19 | update; catálogo `docs/prod-up.md` | derivação técnica da v1 | Trava: active não concede entitlement | 4.1.1, 4.1.7 | E10.9.6; confronto N/A |
| github#14 | update; catálogo `docs/github-up.md` | derivação técnica da v1 | Evidência durável no PR/commit além de run de Actions | 4.1.7; evidências por fase | Validação; confronto N/A |
| supa#53 | update; catálogo Supabase | ampliação de escopo | Não criar fila de revisão humana neste PB | Escopo negativo v1 4.1.3; V2 sem fila | Futuro condicionado a volume/SLA; confronto N/A |
| supa#54 | update; catálogo Supabase | ampliação de escopo | Não trocar matching por embeddings sem benchmark | Escopo negativo v1 4.1.3; V2 usa matching vigente | Futuro condicionado a prova de qualidade/custo; confronto N/A |
| supa#63 | update; catálogo Supabase | ampliação de escopo | Não instalar ferramenta beta de RLS para a migration focal | 4.1.6; testes SQL/Data API focais | Futuro condicionado a auditoria ampla; confronto N/A |
| supa#66 | update; catálogo Supabase | ampliação de escopo | Não criar criptografia pesquisável sem campo e obrigação definidos | 4.1.6; proteção de acesso focal | Futuro condicionado a requisito comprovado; confronto N/A |
| supa#68 | update; catálogo Supabase | ampliação de escopo | Retomada por leitura sob demanda, sem Realtime | 4.1.6; sem subscription | Futuro condicionado a sincronização simultânea real; confronto N/A |
| supa#69 | update; catálogo Supabase | ampliação de escopo | Não habilitar tracing novo neste PB | 4.1.4; telemetria sanitizada vigente | Futuro condicionado a incidente não resolvido; confronto N/A |
| vercel#1 | update; catálogo Vercel | ampliação de escopo | Não trocar Responses API direta por AI Gateway | 4.1.4; integração direta | Futuro condicionado a falha/custo medidos; confronto N/A |
| vercel#29 | update; catálogo Vercel | ampliação de escopo | Não alterar cache/prefetch sem atraso medido | 4.1.7; passagem comercial preservada | Futuro condicionado a latência reproduzível; confronto N/A |
| prod#3 | update; catálogo Produto | ampliação de escopo | Não criar gate de Speed Insights sem tráfego | 4.1.7; QA focal | Futuro condicionado a medição e responsável; confronto N/A |
| prod#23 | update; catálogo Produto | ampliação de escopo | Não criar integração WhatsApp/Business Agent | Escopo negativo v1 4.1.3; V2 só preserva dado comercial | Futuro condicionado a recorte de canal; confronto N/A |
| P1-01 | invariante técnico de autorização | derivação técnica da v1 | Operação focal permite confirmação em `pending_setup` sob guard completo; action histórica continua restrita a `active` | V2 4.1.4, “confirmação durante o Pending Setup” | Revisão delta |
| P1-02 | v1 4.1.3; consumidor histórico | derivação técnica da v1 | `completed_at` + `completion_mode` suprimem card novo; ausência de conclusão mantém consumidor histórico acionável | V2 4.1.6, “discriminador e falhas” | Revisão delta |
| P1-03 | invariante técnico de falhas | derivação técnica da v1 | Persistência de turno/conclusão falha fechada; matching/IA admite continuação ou fallback persistido | V2 4.1.6, “discriminador e falhas”; ABC de `docs/base-tecnica.md` | Revisão delta |
| P1-04 | invariante técnico de rollout | derivação técnica da v1 | Migration aditiva, flag server-side desligada, apply/prova e redeploy do mesmo SHA antes da leitura nova | V2 4.1.6, “rollout”; `docs/platform-config.md` | Revisão delta |
| P2-05 | condicionante factual estrutural | derivação técnica da v1 | Repetir busca por consumidor de onboarding factual; registrar ausência atual ou testar exigência de taxon oficial se surgir consumidor | V2 4.1.7, “validação por fase” | Revisão delta |
| P2-06 | gate do Analista | derivação técnica da v1 | Atualizar matriz com tratamento e localização verificável de P1-01–04 e P2-05 | Linhas P1-01–04 e P2-05 desta matriz | Revisão delta |
| RF-IMP-01 | parecer focal estrutural `revisao_focal_implementacao`; concorrência, lease, supersession, retry e recovery | derivação técnica da v1 | Tratar `turn_id` como identidade da fala; abrir turno novo por CAS nullable de `account_niche_resolutions.updated_at`; criar `lease_version bigint not null default 1` positiva e incrementá-la no retry; limitar supersession a turno diferente expirado; exigir latest/pending/ID/versão em todo write; retornar `stale_context`, `in_progress`, `lease_lost` ou `turn_not_current` sem write nem nova falha conforme o caso | V2 4.1.6, “persistência e acesso” e contratos de lease/write; V2 4.1.7, seis cenários focais de 10.9.5 | Revisão delta do mesmo Analista; afeta 10.9.4–10.9.6 sem reabrir especialistas ou demais gates |
| RF-IMP-02 | ajuste vinculante do supervisor; ordem de locks | derivação técnica da v1 | Todas as RPCs afetadas usam a mesma ordem canônica vigente entre conta, conversa, turno e resolução; ordem divergente e locks adicionais sem necessidade comprovada são proibidos | V2 4.1.6, versão monotônica | Revisão delta do mesmo Analista |
| RF-IMP-03 | ajuste vinculante do supervisor; contenção de escopo | governança de execução | As residências citadas no parecer são limite máximo de investigação; alterar somente arquivos estritamente necessários ao patch comprovado | Implementação posterior à aprovação desta V2 | Gate de diff e revisão focal |
| RF-IMP-04 | ajuste vinculante do supervisor; critério de parada | governança de execução | Executar uma correção estrutural e solicitar um único novo review; novo P1/P2 material no mesmo núcleo de concorrência, lease, supersession, retry ou recovery retorna ao Estrategista sem novo patch | Implementação e review posteriores à aprovação desta V2 | Parada obrigatória sem segunda correção |

## Ponto de residência de nome

A V1 4.1.2 atribui o nome preferido à pessoa. A derivação inicial propôs `preferred_name` no cabeçalho por conta; a V2 candidata separa a preferência por `user_id` e mantém o cabeçalho da conversa por `account_id`. A diferença é derivação técnica da V1, sem efeito na autoridade da taxonomia ou ampliação funcional. Submeter essa escolha ao Analista na Passagem 2.

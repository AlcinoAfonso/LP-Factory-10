# Matriz de consolidação — E10.9 PB1

## Referências congeladas

- Caso: `E10.9 — Pending Setup pré-comercial e continuidade conversacional`.
- PR de trabalho: `#954`; branch: `codex-app/e10-9-pb1-greenfield-rederive`; base: `main@304a2d23448207bd77da7d7f93c2f1324072d072`.
- V1 funcional aprovada: `docs/lousa-plano-base-e10-9.md` no commit `75c2f035bbd60ef6fa197b9449df0c12375c7d6e`, blob `59ddda9c32c76b5bfc027ed57cb1fafffc8bd180`.
- V2 técnica candidata: mesmo arquivo no commit `a3da1cc60e3fc8f1dcf5c270e7f94711f4a46734`, blob `5871ecb21c54079a5d5fc11ecf41e3a8392e9862`.
- Debate 15: a seção funcional recebida do Google Drive foi comparada com a V1 congelada e não apresentou diferença semântica.
- Especialistas: Gestor Estrutural, Gestor de Automações e Gestor de Updates, todos em modo read-only e sem editar a solução.
- Analista, passagem 1: `aprovado com correções obrigatórias`; sete correções objetivas, sem decisão humana pendente.
- Exclusão explícita: PR `#952`, sua solução técnica e seus artefatos não integram as fontes desta matriz.

## Parecer estrutural

| ID | Origem | Classificação | Tratamento consolidado | Destino/evidência | Estado |
| --- | --- | --- | --- | --- | --- |
| GE-E10.9-01 — Boundary distinto obrigatório | V1 | derivação técnica da V1 | Identidade, histórico e lifecycle não pertencem ao adapter de taxonomia nem ao boundary `access`; criar `lib/onboarding/pending-setup/` com contratos, policy, persistência e API pública, sem engine/service/job/fila/framework genérico. | V2 4.1.3 e sequência 10.9.3–10.9.6 | incorporado |
| GE-E10.9-02 — Persistência atual insuficiente | V1 | derivação técnica da V1 | `account_niche_resolutions` e `account_profiles` não representam transcript ordenado; criar conversas e mensagens focais por relação conta/usuário, estado fechado, concorrência otimista, RLS/ACLs e RPCs versionadas. | V2 4.1.6 e validação SQL | incorporado; contrato fechado por AN-P1-04 |
| GE-E10.9-03 — Ativação vigente precoce e não atômica | V1 | derivação técnica da V1 | Substituir save → ativação → resolução posterior por conclusão transacional que promove `pending_setup -> active` somente após resolução oficial comprovada ou fallback operacional confirmado, sem entitlement. | V2 4.1.6, 10.9.6 e aceite | incorporado |
| GE-E10.9-04 — Reuso obrigatório da resolução existente | invariante técnico | derivação técnica da V1 | Reusar matching, confiança, `account_niche_resolutions`, `accountTaxonomyAdapter`, resolver OpenAI, workload `niche_resolution` e E21; a conversa apenas os orquestra. | V2 4.1.3–4.1.4 | incorporado; proveniência fechada por AN-P1-01/02 |
| GE-E10.9-05 — `account_profiles` não é conversa | V1 | derivação técnica da V1 | Preservar tabela/dados, não chamar `upsertAccountProfileV1`, não sobrescrever campos comerciais e só remover adapter quando comprovadamente sem consumidor. | V2 4.1.3 e 10.9.6 | incorporado |
| GE-E10.9-06 — Cutover do card depende de consumidor real | V1 | derivação técnica da V1 | Consultar o hospedado com os predicados do adapter; zero permite remover órfãos, resultado positivo exige preservar o card apenas para o consumidor `active`, nunca no Pending Setup. | V2 4.1.3, 10.9.6 e validação | incorporado; fundamento repo-side e evidência datada fechados por AN-P1-07 |
| GE-E10.9-07 — Ordem migration/deploy não comprovada | invariante técnico | derivação técnica da V1 | Bloquear cutover sem mecanismo `migration aplicada e verificada -> mesmo SHA promovido/exposto`; usar deployment staged para manter o anterior servindo. | V2 4.1.6, gate operacional | incorporado; execução condicionada à liberação do Estrategista |
| GE-E10.9-08 — Gates comerciais já separam entitlement | invariante técnico | derivação técnica da V1 | Preservar `decideAccountJourney`, entitlement fail-closed, checkout e páginas comerciais; fallback sem taxon segue ao comercial genérico e nada neste PB cria trial/pagamento/entitlement. | V2 4.1.3, 4.1.6 e aceite | incorporado |

## Parecer de automações

| ID | Origem | Classificação | Tratamento consolidado | Destino/evidência | Estado |
| --- | --- | --- | --- | --- | --- |
| AUT-E10.9-3 / AUT-PATCH-01 — Identidade determinística | V1 | derivação técnica da V1 | Reusar nome válido conhecido, perguntar uma vez quando ausente e manter saudação/primeira pergunta code-owned, sem OpenAI. | V2 10.9.3 e validação | incorporado; allowlist e recusa fechadas por AN-P1-05 |
| AUT-E10.9-4 / AUT-PATCH-02 — Conversa controlada | V1 | derivação técnica da V1 | Executar matching primeiro; usar no máximo uma Responses API foreground por turno ambíguo, Structured Outputs, workload vigente e confirmação humana antes de vínculo inferido. | V2 4.1.4, 10.9.4 e validação | incorporado; schema/proveniência fechados por AN-P1-01/02 |
| AUT-E10.9-5 / AUT-PATCH-03 — Histórico e projeção limitada | V1 | derivação técnica da V1 | Manter a LP Factory como autoridade do histórico e montar projeção determinística limitada, isolada por conta e sanitizada; não usar memória do provedor. | V2 4.1.4, 10.9.5 e validação | incorporado; execução após `active` e PII fechadas por AN-P1-03/06 |
| AUT-E10.9-6 / AUT-PATCH-04 — Conclusão determinística | V1 | derivação técnica da V1 | Concluir de forma autorizada/idempotente apenas em estado terminal, promover sem entitlement e retirar a entrada E10.4 no mesmo cutover comprovado. | V2 10.9.6, aceite e gate operacional | incorporado |
| AUT-PATCH-05 — Destinos documentais | invariante técnico | derivação técnica da V1 | Após implementar, substituir em `docs/automations.md` o consumidor E10.4 pelo E10.9; atualizar base/roadmap e `platform-config` somente se houver mudança real; não criar registro em `docs/services.md`. | ABC final da implementação | incorporado como obrigação documental futura |

## Parecer de updates

Não houve update estrutural incorporado; portanto, o confronto com o Gestor Estrutural é `não aplicável`. Os dois updates aceitos têm impacto estrutural baixo e impacto funcional nulo.

| ID | Origem | Classificação | Tratamento consolidado | Destino e impacto | Estado |
| --- | --- | --- | --- | --- | --- |
| prod#14 | update | modernização técnica justificada | Garantir uma única próxima ação principal, clara e reconhecível em cada estado. | V2 4.1.7; impacto estrutural baixo, funcional nulo | incorporado |
| prod#17 | update | modernização técnica justificada | Cobrir teclado, foco, semântica, feedback anunciado, contraste e alvo mínimo de toque nos controles aplicáveis. | V2 4.1.7; impacto estrutural baixo, funcional nulo | incorporado |
| supa#2 | update | não incorporado; referência/trava | Usar como validação suplementar de RLS, policies, grants e ACLs após apply; não substitui a prova SQL normativa. | Validação 10.9.3/10.9.6; confronto estrutural N/A | preservado como trava |
| supa#51 | update | não incorporado; referência/trava | Preservar `pg_trgm` no matching determinístico existente; não criar mecanismo paralelo. | Validação 10.9.4; confronto estrutural N/A | preservado como trava |
| supa#52 | update | não incorporado; referência/trava | Preservar a generated column/normalização de aliases já existente. | Validação 10.9.4; confronto estrutural N/A | preservado como trava |
| vercel#31 | update | não incorporado; referência/trava | Manter `next` e `eslint-config-next` em `16.3.3` ou versão corrigida superior; não acoplar novidades. | Dependências/`npm run check`; confronto estrutural N/A | preservado como trava |
| github#14 | update | não incorporado; referência/trava | Checks/runs são expiráveis; registrar prova durável no PR, commits, roadmap e canônicos. | Evidências de checkpoints; confronto estrutural N/A | preservado como trava |
| prod#16 | update | não incorporado; referência/trava | Repetir QA autenticado em Preview, mobile e desktop, incluindo loading, erro, confirmação, retomada e fallback. | QA 10.9.6; confronto estrutural N/A | preservado como trava |
| supa#53 | update | não incorporado; oportunidade estratégica condicional | Hipótese futura: curadoria assíncrona pode ajudar se o volume real de ambiguidades superar diálogo/fallback. Gatilho: volume mensurado; limite: sem fila/job neste PB. | Horizonte futuro; sem destino de implementação | preservado |
| supa#54 | update | não incorporado; oportunidade estratégica condicional | Hipótese futura: embeddings podem superar FTS/trigramas + IA em taxonomia maior. Gatilho: benchmark representativo; limite: não alterar matching/autoridade agora. | Horizonte futuro; sem destino de implementação | preservado |
| supa#63 | update | não incorporado; oportunidade estratégica condicional | Hipótese condicional: matriz automatizada de RLS pode compensar em rodada ampla de policies. Gatilho: custo repetido superior à prova focal; limite: não instalar em Core/produção/workflow. | Horizonte condicional; sem destino de implementação | preservado |
| supa#68 | update | não incorporado; oportunidade estratégica condicional | Hipótese condicional: Realtime pode reduzir payload em sincronização simultânea entre dispositivos. Gatilho: requisito aprovado não atendido por leitura; limite: retomada deste PB não autoriza Realtime. | Horizonte condicional; sem destino de implementação | preservado |
| vercel#1 | update | não incorporado; oportunidade estratégica condicional | Hipótese futura: AI Gateway pode ajudar com múltiplos provedores/fallback/orçamento central. Gatilho: necessidade e benefício medidos; limite: Responses API direta neste PB. | Horizonte futuro; sem destino de implementação | preservado |
| github#10 | update | não incorporado; oportunidade estratégica condicional | Hipótese condicional: policies por ator/evento podem reduzir execução indevida. Gatilho: disponibilidade, inventário e avaliação reversível; limite: não alterar rulesets/workflows neste PB. | Horizonte condicional; sem destino de implementação | preservado |
| prod#3 | update | não incorporado; oportunidade estratégica condicional | Hipótese condicional: dados reais podem revelar regressões percebidas. Gatilho: tráfego, responsável, frequência e hipótese mensurável; limite: não instrumentar/bloquear a primeira entrega. | Horizonte condicional; sem destino de implementação | preservado |
| prod#23 | update | não incorporado; oportunidade estratégica condicional | Hipótese futura: WhatsApp oficial pode diferenciar continuidade comercial. Gatilho: operação, volume e elegibilidade; limite: sem app/webhook/job/agente/omnichannel neste PB. | Horizonte futuro; sem destino de implementação | preservado |
| vercel#3 | update | não incorporado; rejeitado | Sem necessidade ou métrica de cache; rota depende de sessão/cookies e deve permanecer dinâmica. | Nenhum destino | rejeitado |
| vercel#20 | update | não incorporado; rejeitado | Flags não resolvem a ordem migration → Production e poderiam manter jornadas paralelas. | Nenhum destino | rejeitado |
| vercel#22 | update | não incorporado; rejeitado | Dry-run de pacote não prova apply de migration nem ordenação; não há suspeita de manifesto ou `.vercelignore`. | Nenhum destino | rejeitado |
| vercel#32 | update | não incorporado; rejeitado | O PB não cria nem altera variável; a classificação efetiva já está em `docs/platform-config.md`. | Nenhum destino | rejeitado |
| prod#12 | update | não incorporado; rejeitado | A V1 trata a primeira conta `pending_setup`; navegação global multi-contas/LPs não participa da jornada. | Nenhum destino | rejeitado |
| prod#18 | update | não incorporado; rejeitado | Plugin/MCP App não serve ao fluxo web aprovado e conflita com o escopo negativo agentic. | Nenhum destino | rejeitado |
| supa#46 | update | não incorporado; rejeitado | O plano do update não é apto e não há requisito de retenção externa/compliance de logs que justifique upgrade/destino. | Nenhum destino | rejeitado |

## Analista — passagem 1

| ID | Origem | Classificação | Correção obrigatória | Destino previsto | Estado |
| --- | --- | --- | --- | --- | --- |
| AN-P1-01 | V1 | derivação técnica da V1 | Remover `resolved_official` da saída da IA. Somente o caminho determinístico de alta confiança pode concluir automaticamente; sugestão derivada da IA sempre exige `confirm_official` e confirmação explícita. | V2 4.1.4, validações e aceite | aplicado; aguarda revisão delta |
| AN-P1-02 | invariante técnico | derivação técnica da V1 | Registrar vínculo oficial confirmado após sugestão da IA como `source_type = user_confirmed_ai`, nunca `manual`, e revalidar o taxon como ativo e pertencente ao conjunto permitido. | V2 4.1.4, SQL/testes | aplicado; aguarda revisão delta |
| AN-P1-03 | V1 | derivação técnica da V1 | Limitar retomada executável ao estado `pending_setup`; após `active`, preservar transcript e associação para consumidor futuro, sem manter chat executável neste PB. | V2 10.9.5 e aceite | aplicado; aguarda revisão delta |
| AN-P1-04 | invariante técnico | derivação técnica da V1 | Fechar checks e domínios das tabelas: valores de `stage`/`resolution_outcome`, ordinal positivo, conteúdo não vazio e limitado, coerência temporal, manutenção de `updated_at` e participação/exclusão explícita no Trigger Hub e auditoria, sem transcript bruto. | V2 4.1.6 e validação SQL | aplicado; aguarda revisão delta |
| AN-P1-05 | V1 | derivação técnica da V1 | Definir allowlist ordenada de campos Auth para nome preferido, normalização/limite, rejeição de valor derivado de e-mail e comportamento para ausente, inválido ou recusado. | V2 10.9.3, critérios e validador | aplicado; aguarda revisão delta |
| AN-P1-06 | invariante técnico | derivação técnica da V1 | Não prometer ausência absoluta de PII em texto livre: excluir campos estruturados de identidade/contato, aplicar minimização/redação determinística e testes e separar instruções, candidatos e conteúdo do usuário no prompt. | V2 4.1.4, telemetria e testes | aplicado; aguarda revisão delta |
| AN-P1-07 | invariante técnico | derivação técnica da V1 | Fundamentar a preservação do `NicheResolutionCard` em consumidor real do repositório, não na contagem hospedada. Tratar a inspeção hospedada apenas como evidência datada e repeti-la antes de eventual limpeza. | V2 4.1.3, 10.9.6 e validação | aplicado; aguarda revisão delta |

## Síntese do gate

- Derivações técnicas incorporadas: boundary focal, persistência/RPCs, segurança, reuso da autoridade de nicho, automação controlada, cutover e validações.
- Modernizações incorporadas: apenas `prod#14` e `prod#17`.
- Ampliações incorporadas: nenhuma.
- Confronto material entre updates e parecer estrutural: nenhum.
- Decisão humana pendente: nenhuma.
- Passagem 2: `aprovado com correções obrigatórias`; nenhuma nova rodada especializada ou decisão humana.
- Próximo gate: `revisao_delta` do mesmo Analista sobre a V2 e a matriz corrigidas; implementação permanece bloqueada até aprovação.

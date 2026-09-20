# Matriz de consolidação — E10.9 PB1

## Referências congeladas

- Caso: `E10.9 — Pending Setup pré-comercial e continuidade conversacional`.
- PR de trabalho: `#954`; branch: `codex-app/e10-9-pb1-greenfield-rederive`; base: `main@304a2d23448207bd77da7d7f93c2f1324072d072`.
- V1 funcional aprovada: `docs/lousa-plano-base-e10-9.md` no commit `75c2f03513b3ec750b76098d73d1d87db155776a`, blob `59dd541ab41b3c169ebdd66a1f982021f62402a4`.
- V2 técnica candidata: mesmo arquivo no commit `a3da1cc60e3fc8f1dcf5c270e7f94711f4a46734`, blob `5871ecb21c54079a5d5fc11ecf41e3a8392e9862`.
- Debate 15: a seção funcional recebida do Google Drive foi comparada com a V1 congelada e não apresentou diferença semântica.
- Especialistas: Gestor Estrutural, Gestor de Automações e Gestor de Updates, todos em modo read-only e sem editar a solução.
- Analista, passagem 1: `aprovado com correções obrigatórias`; sete correções objetivas, sem decisão humana pendente.
- Exclusão explícita: PR `#952`, sua solução técnica e seus artefatos não integram as fontes desta matriz.

## Parecer estrutural

| ID | Origem | Classificação | Tratamento consolidado | Destino/evidência | Estado |
| --- | --- | --- | --- | --- | --- |
| GE-E10.9-01 | V1 | derivação técnica da V1 | Criar boundary focal `lib/onboarding/pending-setup`, sem engine genérico, e manter UI/actions locais à rota. | V2 4.1.3 e sequência 10.9.3–10.9.6 | incorporado |
| GE-E10.9-02 | V1 | derivação técnica da V1 | Persistir uma conversa canônica por relação conta/usuário e mensagens ordenadas, com retomada idempotente e versão otimista. | V2 4.1.3, 4.1.6 e 4.1.7 | incorporado; fechamento contratual pendente em AN-P1-04 |
| GE-E10.9-03 | invariante técnico | derivação técnica da V1 | Usar RPCs focais para append, transição e conclusão transacionais; nenhuma gravação conversacional direta pelo client. | V2 4.1.6 | incorporado |
| GE-E10.9-04 | invariante técnico | derivação técnica da V1 | Aplicar RLS, revogações e grants explícitos; o adapter server-only é a residência exclusiva. | V2 4.1.6; confirmação Supabase PostgreSQL 17 e grants separados de RLS | incorporado |
| GE-E10.9-05 | V1 | derivação técnica da V1 | Reusar matching, confiança, resolução operacional, taxonomia oficial e workload `niche_resolution`; IA não cria autoridade oficial. | V2 4.1.3–4.1.4 | incorporado; correções pendentes em AN-P1-01 e AN-P1-02 |
| GE-E10.9-06 | V1 | derivação técnica da V1 | Preservar `account_profiles`, dados históricos, gates comerciais/financeiros e promoção `pending_setup -> active` sem entitlement. | V2 4.1.3, 4.1.6 e aceite | incorporado |
| GE-E10.9-07 | V1 | derivação técnica da V1 | Substituir a entrada E10.4 no mesmo cutover e remover somente código comprovadamente órfão; preservar consumidor independente do card de nicho. | V2 4.1.3, 10.9.6 e validação | incorporado; justificativa durável pendente em AN-P1-07 |
| GE-E10.9-08 | invariante técnico | derivação técnica da V1 | Ordenar migration e runtime por deployment staged do mesmo merge SHA, sem flag, caminho paralelo ou novo workflow. | V2 4.1.6, gate operacional | incorporado; execução condicionada à liberação do Estrategista |

## Parecer de automações

| ID | Origem | Classificação | Tratamento consolidado | Destino/evidência | Estado |
| --- | --- | --- | --- | --- | --- |
| AUT-E10.9-03 | V1 | derivação técnica da V1 | Executar matching determinístico antes da IA; alta confiança única encerra sem chamada. | V2 4.1.4 e validação | incorporado |
| AUT-E10.9-04 | V1 | derivação técnica da V1 | Reusar Responses API direta, Structured Outputs estrito e workload E21 `niche_resolution`, sem mudar modelo/reasoning effort. | V2 4.1.4 | incorporado |
| AUT-E10.9-05 | invariante técnico | derivação técnica da V1 | Limitar a no máximo uma chamada foreground e uma pergunta por turno, com `store:false`, `background:false`, deadline e sem tools/Conversations/Agents/job/fila/service. | V2 4.1.4 e validação | incorporado |
| AUT-E10.9-06 | V1 | derivação técnica da V1 | Falhas, recusas ou schema inválido não inventam taxon nem mudam status/entitlement e preservam continuação humana/fallback. | V2 4.1.4 e aceite | incorporado |
| AUT-PATCH-05 | invariante técnico | derivação técnica da V1 | Enviar apenas contexto mínimo e registrar telemetria/custos sanitizados, sem conteúdo bruto. | V2 4.1.4 e 4.1.7 | incorporado; minimização de texto livre pendente em AN-P1-06 |

## Parecer de updates

Não houve update estrutural incorporado; portanto, o confronto com o Gestor Estrutural é `não aplicável`. Os dois updates aceitos têm impacto estrutural baixo e impacto funcional nulo.

| ID | Origem | Classificação | Tratamento consolidado | Destino e impacto | Estado |
| --- | --- | --- | --- | --- | --- |
| prod#14 | update | modernização técnica justificada | Garantir uma única próxima ação principal, clara e reconhecível em cada estado. | V2 4.1.7; impacto estrutural baixo, funcional nulo | incorporado |
| prod#17 | update | modernização técnica justificada | Cobrir teclado, foco, semântica, feedback anunciado, contraste e alvo mínimo de toque nos controles aplicáveis. | V2 4.1.7; impacto estrutural baixo, funcional nulo | incorporado |
| supa#2 | update | ampliação de escopo | Referência geral, sem ganho líquido específico para este PB. | Nenhum destino; confronto estrutural N/A | não incorporado |
| supa#51 | update | ampliação de escopo | Oportunidade condicional sem necessidade demonstrada no recorte. | Nenhum destino; confronto estrutural N/A | não incorporado |
| supa#52 | update | ampliação de escopo | Oportunidade condicional sem necessidade demonstrada no recorte. | Nenhum destino; confronto estrutural N/A | não incorporado |
| supa#53 | update | ampliação de escopo | Oportunidade condicional sem necessidade demonstrada no recorte. | Nenhum destino; confronto estrutural N/A | não incorporado |
| supa#54 | update | ampliação de escopo | Oportunidade condicional sem necessidade demonstrada no recorte. | Nenhum destino; confronto estrutural N/A | não incorporado |
| supa#63 | update | ampliação de escopo | Oportunidade condicional sem necessidade demonstrada no recorte. | Nenhum destino; confronto estrutural N/A | não incorporado |
| supa#68 | update | ampliação de escopo | Oportunidade condicional sem necessidade demonstrada no recorte. | Nenhum destino; confronto estrutural N/A | não incorporado |
| vercel#1 | update | ampliação de escopo | Referência geral; o staged cutover decorre do risco concreto do PB, não deste update. | Nenhum destino; confronto estrutural N/A | não incorporado |
| vercel#31 | update | ampliação de escopo | Oportunidade condicional sem ganho líquido adicional ao gate operacional focal. | Nenhum destino; confronto estrutural N/A | não incorporado |
| github#10 | update | ampliação de escopo | Referência de processo sem alteração necessária no PB. | Nenhum destino; confronto estrutural N/A | não incorporado |
| github#14 | update | ampliação de escopo | Referência de processo sem alteração necessária no PB. | Nenhum destino; confronto estrutural N/A | não incorporado |
| prod#3 | update | ampliação de escopo | Referência de produto sem ganho líquido específico. | Nenhum destino; confronto estrutural N/A | não incorporado |
| prod#16 | update | ampliação de escopo | Oportunidade condicional fora do recorte mínimo. | Nenhum destino; confronto estrutural N/A | não incorporado |
| prod#23 | update | ampliação de escopo | Oportunidade condicional fora do recorte mínimo. | Nenhum destino; confronto estrutural N/A | não incorporado |
| vercel#3 | update | ampliação de escopo | Alternativa rejeitada: acrescentaria infraestrutura/complexidade sem necessidade. | Nenhum destino | rejeitado |
| vercel#20 | update | ampliação de escopo | Alternativa rejeitada: não resolve requisito aprovado com ganho líquido. | Nenhum destino | rejeitado |
| vercel#22 | update | ampliação de escopo | Alternativa rejeitada: adicionaria mecanismo fora do boundary focal. | Nenhum destino | rejeitado |
| vercel#32 | update | ampliação de escopo | Alternativa rejeitada: adicionaria mecanismo fora do boundary focal. | Nenhum destino | rejeitado |
| prod#12 | update | ampliação de escopo | Alternativa rejeitada: ampliaria descoberta/pesquisa sem autorização funcional. | Nenhum destino | rejeitado |
| prod#18 | update | ampliação de escopo | Alternativa rejeitada: ampliaria o produto além do Pending Setup aprovado. | Nenhum destino | rejeitado |
| supa#46 | update | ampliação de escopo | Alternativa rejeitada: automação ampla de RLS não substitui o desenho focal e verificável. | Nenhum destino | rejeitado |

## Analista — passagem 1

| ID | Origem | Classificação | Correção obrigatória | Destino previsto | Estado |
| --- | --- | --- | --- | --- | --- |
| AN-P1-01 | V1 | derivação técnica da V1 | Remover `resolved_official` da saída da IA. Somente o caminho determinístico de alta confiança pode concluir automaticamente; sugestão derivada da IA sempre exige `confirm_official` e confirmação explícita. | V2 4.1.4, validações e aceite | pendente antes da aprovação |
| AN-P1-02 | invariante técnico | derivação técnica da V1 | Registrar vínculo oficial confirmado após sugestão da IA como `source_type = user_confirmed_ai`, nunca `manual`, e revalidar o taxon como ativo e pertencente ao conjunto permitido. | V2 4.1.3, 4.1.4, SQL/testes | pendente antes da aprovação |
| AN-P1-03 | V1 | derivação técnica da V1 | Limitar retomada executável ao estado `pending_setup`; após `active`, preservar transcript e associação para consumidor futuro, sem manter chat executável neste PB. | V2 4.1.3, 10.9.5 e aceite | pendente antes da aprovação |
| AN-P1-04 | invariante técnico | derivação técnica da V1 | Fechar checks e domínios das tabelas: valores de `stage`/`resolution_outcome`, ordinal positivo, conteúdo não vazio e limitado, coerência temporal, manutenção de `updated_at` e participação/exclusão explícita no Trigger Hub e auditoria, sem transcript bruto. | V2 4.1.6 e validação SQL | pendente antes da aprovação |
| AN-P1-05 | V1 | derivação técnica da V1 | Definir allowlist ordenada de campos Auth para nome preferido, normalização/limite, rejeição de valor derivado de e-mail e comportamento para ausente, inválido ou recusado. | V2 10.9.3, critérios e validador | pendente antes da aprovação |
| AN-P1-06 | invariante técnico | derivação técnica da V1 | Não prometer ausência absoluta de PII em texto livre: excluir campos estruturados de identidade/contato, aplicar minimização/redação determinística e testes e separar instruções, candidatos e conteúdo do usuário no prompt. | V2 4.1.4, telemetria e testes | pendente antes da aprovação |
| AN-P1-07 | invariante técnico | derivação técnica da V1 | Fundamentar a preservação do `NicheResolutionCard` em consumidor real do repositório, não na contagem hospedada. Tratar a inspeção hospedada apenas como evidência datada e repeti-la antes de eventual limpeza. | V2 4.1.3, 10.9.6 e validação | pendente antes da aprovação |

## Síntese do gate

- Derivações técnicas incorporadas: boundary focal, persistência/RPCs, segurança, reuso da autoridade de nicho, automação controlada, cutover e validações.
- Modernizações incorporadas: apenas `prod#14` e `prod#17`.
- Ampliações incorporadas: nenhuma.
- Confronto material entre updates e parecer estrutural: nenhum.
- Decisão humana pendente: nenhuma.
- Próximo gate: passagem 2 do mesmo Analista com pareceres integrais e esta matriz congelada; as sete correções permanecem explicitamente pendentes até a revisão delta.

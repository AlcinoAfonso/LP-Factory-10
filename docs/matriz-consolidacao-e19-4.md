# Matriz de consolidação — E19.4

- Plano v1 congelado: blob `c4f062286e8d2f91d88f4540c89e31f5937c6f37`, incorporado à `main` por `f3cce5f85295ab5db7d36a64bd50eed632fdb441`.
- Plano v2: checkpoint `63943a7f65376d84f341840f6111257a80e699b2`, corrigido até `e8a316322b850aeeafbf4ab5071df9a4bd4b4d72`.
- Passagem 1 independente: aprovada para merge do plano-base v2 em 11/08/2026.
- Esta matriz foi criada somente após a aprovação da Passagem 1 e deve permanecer no PR até a entrega completa.

## Parecer estrutural

| Origem | Achado | Classificação original | Relação com o escopo | Tratamento | Destino | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|
| Gestor Estrutural | GE-E19.4-01 — fluxo adere à API E19.3, gates e preview privado | aprovado | preservação | incorporado | N/A | 1.2–1.5; 2.1 | API pública E19.3 e Base Técnica |
| Gestor Estrutural | GE-E19.4-02 — persistência E19.4 inexiste | condicionante | preservação | migration e agregado definidos | N/A | 2.3; 3.2 | schema e Supabase read-only |
| Gestor Estrutural | GE-E19.4-03 — `content_artifacts` é residência incompatível | rejeição de reuso | preservação | não reutilizar | N/A | 2.3; 4.1 | lifecycle e ACL de `content_artifacts` |
| Gestor Estrutural | GE-E19.4-04 — agregado 1:1 separado é a residência mínima | condicionante | preservação | incorporado | N/A | 2.1; 2.3; 3.2 | `account_landing_pages` e grants vigentes |
| Gestor Estrutural | GE-E19.4-05 — boundaries de geração, provider, renderer e UI | condicionante | preservação | incorporado | N/A | 2.1–2.4; 3.4 | Base Técnica e estrutura do repo |
| Gestor Estrutural | GE-E19.4-06 — workload novo sem capability inventada | condicionante | extensão adjacente necessária e proporcional | incorporado | N/A | 1.3–1.4; 3.1 | registries OpenAI e comercial |
| Gestor Estrutural | GE-E19.4-07 — runtime precisa falhar fechado antes do apply | condicionante | extensão adjacente necessária e proporcional | probe expand seguro incorporado | N/A | 3.2–3.4 | workflow e ausência atual da relation |

As condicionantes C-01–C-07 estão absorvidas pelos registros acima: agregado e segurança; sequenciamento; boundaries; acesso; OpenAI; estado e concorrência.

## Parecer de Updates

| Origem | Update | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|
| Gestor de Updates | `supa#5` | complementar/condicional | oportunidade estratégica | não implementar agora | oportunidade estratégica condicional | 4.1 | sem incidente que exija Unified Logs |
| Gestor de Updates | `supa#40` | complementar/atual | extensão adjacente necessária e proporcional | incorporar verificador SQL | usar como validação/trava | 3.2 | migration nova exige prova pós-apply |
| Gestor de Updates | `supa#63` | complementar/condicional | oportunidade estratégica | não implementar agora | oportunidade estratégica condicional | 4.1 | matriz RLS adicional sem complexidade atual |
| Gestor de Updates | `vercel#1` | sobreposto/futuro | oportunidade estratégica | preservar Responses API direta | oportunidade estratégica condicional | 4.1 | sem necessidade de gateway/fallback |
| Gestor de Updates | `vercel#3` | complementar/condicional | fora do recorte | rejeitar | não aplicável | 4.1 | rota privada sem caso de cache |
| Gestor de Updates | `vercel#11` | complementar/futuro | oportunidade estratégica | não implementar agora | oportunidade estratégica condicional | 4.1 | tracking público excluído |
| Gestor de Updates | `vercel#15` | complementar/atual | extensão adjacente proporcional | uso opcional | usar como validação/trava | 2.4; 3.3 | apoio de Preview sem dependência |
| Gestor de Updates | `vercel#26` | complementar/condicional | fora do recorte | rejeitar | não aplicável | 4.1 | nenhuma resposta cacheável |
| Gestor de Updates | `github#8` | sobreposto/condicional | oportunidade estratégica | não implementar agora | oportunidade estratégica condicional | 4.1 | ferramentas atuais suficientes |
| Gestor de Updates | `prod#3` | complementar/futuro | oportunidade estratégica | não implementar agora | oportunidade estratégica condicional | 4.1 | LP ainda privada e sem tráfego |
| Gestor de Updates | `prod#6` | complementar/atual | preservação | incorporar referência editorial | usar como validação/trava | 2.4 | prova humana da copy |
| Gestor de Updates | `prod#12` | complementar/futuro | oportunidade estratégica | não implementar agora | oportunidade estratégica condicional | 4.1 | navegação multi-entidade excluída |
| Gestor de Updates | `prod#14` | complementar/atual | preservação | incorporar critério de UX | usar como validação/trava | 3.3 | reconhecimento de draft e próximo passo |
| Gestor de Updates | `prod#15` | complementar/futuro | oportunidade estratégica | não implementar agora | oportunidade estratégica condicional | 4.1 | tracking excluído |
| Gestor de Updates | `prod#16` | complementar/atual | preservação | incorporar prova hospedada | usar como validação/trava | 3.3 | viewports e interações do Preview |
| Gestor de Updates | `prod#17` | complementar/atual | preservação | incorporar baseline WCAG 2.2 | usar como validação/trava | 2.4; 3.3 | acessibilidade sem alegar conformidade integral |

## Parecer de Automações

| Origem | Decisão | Classificação original | Relação com o escopo | Tratamento | Destino | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|
| Gestor de Automações | AUTO-E19.4.3-01 — IA controlada, uma chamada por invocação aceita, sem agentic | aplicável | preservação | incorporado | automação E19.4.3 | 1.4; 3.1 | comparação determinística/IA/agentic |
| Gestor de Automações | AUTO-E19.4.3-02 — workload `landing_page_draft_generation`, `gpt-5.4-mini`, `none` | aplicável | extensão adjacente necessária e proporcional | incorporado | OpenAI workloads/config | 1.4; 3.1 | registry e modelo oficial |
| Gestor de Automações | AUTO-E19.4.3-03 — Structured Output estrito derivado da E19.3 | aplicável | preservação | incorporado | adapter/validator | 2.1–2.2; 3.1 | contratos E18.5/E19.3 |
| Gestor de Automações | AUTO-E19.4.3-04 — falha integral, retry humano e telemetria segura | aplicável | preservação | incorporado | automação/observabilidade | 1.4; 3.1 | Responses API e boundary comum |
| Gestor de Automações | AUTO-E19.4.3-05 — capability E9.7 somente quando formalmente admitida | aplicável condicional | preservação de boundary | incorporado sem capability local | consumidor E19.4 | 1.3; 2.1; 3.1 | registry comercial vazio |

Os patches AUTO-E19.4.3-P01–P05 estão cobertos pelas cinco decisões acima e pelos destinos documentais de 3.4.

## Passagem 1 e revisões delta

| Origem | Achado | Classificação | Tratamento | Localização/evidência | Estado |
|---|---|---|---|---|---|
| Analista — Passagem 1 | P1-01 — shapes persistidos não estavam fechados | material | contratos runtime v1 estritos e round-trip adicionados | 2.3; commit `3a4cb29` | resolvido |
| Analista — Passagem 1 | P1-02 — rollout não possuía readiness causal executável | material | probe valida projeção exata e schemas após commit transacional | 3.2–3.4; commits `3a4cb29` e `e8a3163` | resolvido |
| Analista — Passagem 1 | P1-03 — garantia de custo exactly-once era mais forte que o mecanismo | material localizado | garantia limitada a uma chamada por invocação aceita | 1.4; 3.1; commit `3a4cb29` | resolvido |

Veredito final da Passagem 1: `aprovado para merge do plano-base v2`.

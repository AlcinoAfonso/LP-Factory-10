28/08/2026 — Matriz de consolidação — E21.4

## Referências congeladas

- V1: PR #824, `docs/lousa-plano-base-e21-4.md`, blob `1f3192c24615fcf87f0aa0173fe117437241f7a8`, incorporada à `main` no merge commit `428e01d81e819b5da9e508e1c4f356f0517c9c85`.
- V2 reduzida: `docs/lousa-plano-base-e21-4.md`, blob `234f5abc7af90c7105f6c67e04aab5a9fc27757a`, commit `59a909f82eec297c0a5d8dc2dad112acaa849cc9`.
- Decisão humana de 28/08/2026: abandonar a decisão anterior `1/B` e reduzir o MVP ao total oficial de Costs, custo prospectivo de LPs apenas para texto e imagem, agregação por conta, reconciliação por diferença, USD, mês atual/período personalizado, atualização sob demanda e acesso `platform_admin`.
- Pareceres read-only emitidos uma única vez sobre o mesmo blob v1: Gestor Estrutural em 28/08/2026 08:40 e Gestor de Updates em 28/08/2026 08:35.
- Automações: N/A — E21.4.3, E21.4.4 e E21.4.5 estão marcadas como `Automação: não`.

## Achados estruturais

| Parecer | ID | Achado fiel | Classificação original | Relação com o escopo | Tratamento | Destino de update | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E21.4-01` | Costs não fornece USD por conta, LP ou chamada; a v1 não definia conversão de usage causal em USD. | Bloqueante; decisão humana `D1`. | Preservação do resultado, com redução humana do universo atribuível. | Substituído pela decisão humana: preço versionado somente para as duas chamadas de geração de LP; valores internos são calculados, total é oficial e diferença é reconciliação. | N/A | 1.1, 1.2, 2.1 e 4.1. | Custos calculados são rotulados, não há rateio de Costs nem inferência, e combinação incompatível falha fechada. |
| Gestor Estrutural | `GE-E21.4-02` | A superfície deve ser separada e o boundary monetário não pertence a `lib/openai-workloads/`. | Patch estrutural aplicável `PE-02`. | Extensão adjacente necessária e proporcional. | Incorporado com redução: `/admin/custos-openai` e `lib/openai-costs/`; provider somente de Costs. | N/A | 1.7 e 3.3. | A v2 preserva `/admin/workloads-openai` e explicita navegação administrativa separada. |
| Gestor Estrutural | `GE-E21.4-03` | Estruturas existentes não registram tentativas pagas antes da chamada; é necessária residência dedicada. | Patch estrutural aplicável `PE-03` e `PE-04`. | Extensão adjacente necessária e proporcional. | Incorporado como eventos append-only mínimos, início pré-provider e terminal seguro, sem reutilizar materialização, lifecycle ou audit log. | N/A | 1.4, 1.5 e 3.2. | RLS, zero policies, ACL mínima, teste SQL e snippet são critérios explícitos. |
| Gestor Estrutural | `GE-E21.4-04` | O sinal comercial da v1 era insuficiente para classificação econômica ampla por origem de entitlement. | Patch estrutural aplicável `PE-05` no escopo amplo da v1. | Expansão de escopo após a redução humana. | Não incorporado com justificativa: classificação econômica e alteração de E9/entitlement foram adiadas; a conta vem do contexto autorizado da própria LP. | N/A | 1.4 e 4.1. | O plano proíbe classificação completa e qualquer consulta de entitlement para outros consumos. |
| Gestor Estrutural | `GE-E21.4-05` | Faltava sequência segura entre migration, runtime e corte imutável. | Patch estrutural aplicável `PE-03`. | Extensão adjacente necessária e proporcional. | Incorporado com expand/activate: mesmo PR gate-off; apply e segurança pós-merge; ativação, smoke, corte e QA em ordem. | N/A | 1.5 e 3.4. | `OPENAI_LP_COST_TRACKING_ENABLED` nasce desligado e o runtime não depende da residência antes do apply. |
| Gestor Estrutural | `GE-E21.4-06` | Admin key e endpoint oficial ainda não residiam na configuração operacional. | Patch estrutural aplicável `PE-06`. | Preservação de segurança e operação. | Incorporado com redução: `OPENAI_ADMIN_KEY` server-side no Core e apenas o endpoint Costs; Preview somente por autorização humana específica. | N/A | 1.3 e 1.7. | A v2 torna `docs/platform-config.md` alvo obrigatório e proíbe fallback para a chave de runtime. |
| Gestor Estrutural | `GE-E21.4-07` | O limite `Automação: não` precisava impedir mudança em `supabase-inspect` e vínculos heurísticos. | Patch estrutural aplicável `PE-07` no escopo amplo da v1. | Preservação do escopo negativo, com redução humana. | Incorporado parcialmente e reduzido: nenhum diff em `automations/`; somente dois workloads de LP; todo consumo restante fica na reconciliação por diferença. | N/A | 1.4, 3.2 e 4.1. | `supabase_inspect` e os demais workloads são explicitamente adiados. |
| Gestor Estrutural | `GE-E21.4-08` | “Mês atual” não tinha timezone definido. | Bloqueante; decisão humana `D2`. | Extensão adjacente necessária e proporcional. | A decisão anterior `1/B` foi substituída pelo recorte mínimo; a v2 usa fronteiras técnicas UTC para evitar uma camada financeira de timezone. | N/A | 1.6. | Intervalos `[start_time, end_time)` são alinhados à fonte oficial e o plano não cria conversão civil adicional. |

## Updates

| Parecer | ID | Achado fiel | Classificação original | Relação com o escopo | Tratamento | Destino de update | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|---|
| Gestor de Updates | `prod#19` | Stripe Entitlements era referência/trava para não substituir a autoridade comercial interna na classificação ampla. | Complementar, atual, aplicável. | Expansão de escopo após a redução humana. | Não incorporado com justificativa: classificação por entitlement e mudança em E9 foram retiradas do MVP; a trava é preservada para evolução posterior. | Usar como referência, validação ou trava. | 4.1 e 4.2. | O escopo negativo proíbe alteração de E9, entitlement, Stripe ou classificação comercial. |
| Gestor de Updates | `prod#16` | A nova superfície exige QA visual e UX em Preview nos papéis, viewports e estados relevantes. | Complementar, atual, aplicável. | Preservação da validação proporcional. | Incorporado. | Usar como referência, validação ou trava. | 3.3. | Preview autenticado, papel negativo, desktop/mobile, períodos, estados e atualização sob demanda são obrigatórios. |
| Gestor de Updates | `prod#17` | A validação deve explicitar teclado, foco, semântica, anúncios, contraste e alvos de toque sem alegar WCAG integral. | Complementar, atual, aplicável. | Preservação da proteção proporcional. | Incorporado. | Usar como referência, validação ou trava. | 3.3. | A lista de QA contém os critérios aplicáveis e nega alegação de conformidade WCAG 2.2 integral. |
| Gestor de Updates | `vercel#1` | AI Gateway pode ter valor futuro para logs, budgets e fallback, mas não substitui Costs nem a atribuição interna. | Sobreposto, horizonte condicional. | Expansão de escopo. | Não implementado; oportunidade estratégica condicional preservada. | Preservar como oportunidade estratégica condicional. | 4.2. | AI Gateway permanece no escopo negativo e sem gatilho satisfeito. |
| Gestor de Updates | `supa#64` | CDC analítico pode ter valor futuro quando volume e consultas tornarem o Postgres transacional desproporcional. | Complementar, horizonte condicional. | Expansão de escopo. | Não implementado; oportunidade estratégica condicional preservada. | Preservar como oportunidade estratégica condicional. | 4.2. | Pipeline, replication slot, warehouse e nova infraestrutura permanecem proibidos no MVP. |

## Automação

| Parecer | ID | Achado fiel | Classificação original | Relação com o escopo | Tratamento | Destino de update | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|---|
| N/A | `AUT-E21.4-N/A` | Nenhuma fase da v1 ou da v2 está marcada como `Automação: sim`. | Avaliação formal não aplicável. | Preservação do escopo. | Nenhum Gestor de Automações acionado; cron, job, polling e mudanças em `automations/` permanecem fora do MVP. | N/A | 1.6, 3.1–3.3 e 4.1. | As três fases registram `Automação: não` e a atualização é exclusivamente sob demanda. |

## Síntese

- A decisão humana resolveu os bloqueios `D1` e `D2` por substituição do desenho amplo, sem autorizar a antiga combinação `1/B`.
- Nenhuma expansão foi incorporada: classificação econômica ampla, workloads adicionais, E9/Stripe, histórico, créditos, AI Gateway, CDC e automação permanecem adiados.
- Os acréscimos atuais são apenas proteções ou extensões adjacentes indispensáveis para total oficial, custo prospectivo das duas gerações de LP e reconciliação explícita.

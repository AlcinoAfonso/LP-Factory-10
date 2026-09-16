# PB 4 — E21.5.7 Correlação econômica da avaliação de suficiência do catálogo

## 1. V1 funcional aprovada

Fonte: Debate 10 — Controle de custos OpenAI por workload e conta — LP Factory 10, seção 4.4, revisão `ANLCKQnUB7tsd8WiZh3xcDCfqVhKwNb_0E-tPjC0SBanDu-AtaMQBkmf3CLEOND9F-ZncByUaq1T2VIuWkMYCGWsLVt371FTZVDuxCwZ_bw`.

- Estado: V1 funcional consolidada e aprovada para corretivo focal.
- Problema: em Production, o workload `taxon_input_catalog_sufficiency_evaluation` registra custo, mas a avaliação real chega ao ledger sem `economic_event_kind`, `economic_event_id` e `taxon_id`; por isso não aparece como evento interno unitário associado ao taxon no drill-down existente.
- Resultado funcional: cada ocorrência real de avaliação de suficiência do catálogo deve registrar seu custo no evento econômico interno LP Factory correspondente e no taxon canônico avaliado, usando o contrato de correlação E21.5.6 já vigente.
- Comportamento esperado: depois de validar o contexto e ao iniciar a avaliação efetiva, uma identidade explícita e distinta da execução financeira acompanha a ocorrência. Operações e tentativas cobradas da mesma ocorrência permanecem atribuídas a esse único evento; nova avaliação constitui nova ocorrência.
- Atores: `platform_admin` inicia a avaliação; o workload produz a execução e as operações financeiras; o administrador consulta o custo na superfície existente `/admin/custos-openai`.
- Limites: preservar integralmente E21.5.6, PB 1, PB 2 e PB 3, pricing, ledger, reconciliação oficial, segurança e histórico E21.4. Sem novo banco, migration, rota, dashboard, engine, job, automação, infraestrutura, persistência de recomendação, backfill ou correlação heurística. Prova administrativa isolada não deve ser apresentada como avaliação real de um taxon.
- Automação: não aplicável; correlação determinística no fluxo existente.
- Classificação: Light. Supervisão: Autônomo.
- Posição planejada no roadmap: E21.5.7 — correlação econômica da avaliação de suficiência do catálogo. Fase única E21.5.7.3 — vincular a ocorrência real ao evento interno e comprovar a leitura econômica existente.
- Critérios de aceite: uma avaliação real em ambiente hospedado produz execução custeada com `economic_event_kind = lp_factory_internal`, `economic_event_id` próprio e `taxon_id` do contexto canônico; o drill-down existente mostra seu custo por evento e workload; operações/retries da mesma ocorrência não criam eventos duplicados; custo indisponível continua indisponível sem total inventado; a falha do tracking não bloqueia o resultado funcional; avaliações históricas sem vínculo permanecem inalteradas; nenhuma conta cliente é atribuída artificialmente.
- Evidências esperadas: teste focal do fluxo com e sem evento, prova da correlação no ledger/read model e QA administrativo proporcional em Preview ou Production com dados sanitizados, incluindo proteção de acesso e ausência de regressão no custo já medido.

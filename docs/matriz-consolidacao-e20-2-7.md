# Matriz de consolidação — E20.2.7

- Caso: `E20.2.7 — Refinamento de transaction_intent para locação`.
- Plano-base v1 imutável: commit `3f1050ffedd8224ecd933d3f27279609c35ba9b3`, blob `7fbcfdb87335cdb72c6de343cc0d0eba18dc15da`.
- Checkpoint inicial do plano-base v2: commit `50f778c0713f671e98720b9e77560936d537259d`, blob `7c300c21bb72f8bc003602d3d6a763209d22f356`.
- Plano-base v2 corrigido após a Passagem 1: commit `3200178db20b75e0c8b8d1a07d9b5464ea2903ba`, blob `8e67f306ae9e72ee7070cff5ca2bb60ba2e27848`.
- Plano conceitual: `docs/lp-planejamento.md`.
- Roadmap anterior imutável: commit `457bae16f41a49fa8dd70f36cf39fd173d296b9c`, blob `95b966a62bfa7570f95fd88367286cbb2068b30f`.
- Gestor de Automações: N/A — a fase está marcada como `Automação: não`.

## Pareceres especializados

| Especialista | ID | Achado | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gestor Estrutural | `GE-E20.2.7-001` | Boundary e paths são aderentes; registry, schema e resolver existentes permanecem a única autoridade, com versão explícita e falha fechada. | Achado favorável. | `preservação do escopo` | `incorporado`: a v2 mantém o boundary vigente e proíbe contrato paralelo, alteração genérica sem necessidade e fallback. | N/A | 5.2.1; 5.2.2; 5.4.1 | `docs/base-tecnica.md` 3.15.4; `registry.ts`; `resolver.ts`. |
| Gestor Estrutural | `GE-E20.2.7-002` | Derivar v4 por cópia profunda da v3 é suficiente para acrescentar `rent` sem mutação compartilhada e sem perder artefato vigente. | Achado favorável. | `preservação do escopo` | `incorporado`: v4 preserva 23 fields, ordem, metadata, bindings, planos e snapshots de v1–v3. | N/A | 5.1.3; 5.1.4; 5.2.2; 5.3.1 | Padrão v2→v3 em `registry.ts`; regressões em `validation-cases.ts`. |
| Gestor Estrutural | `GE-E20.2.7-003` | A separação entre registry repo-only, adapter/Admin e mapa local da jornada está correta; abstração compartilhada de rótulos para duas superfícies não se justifica. | Achado favorável. | `preservação do escopo` | `incorporado`: manter somente os dois mapas locais, sem provider, adapter, acesso client a banco ou nova camada. | N/A | 5.2.1; 5.3.1; 5.4.1 | `docs/base-tecnica.md` 3.2, 3.3.2 e 3.15.4; consumidores reais. |
| Gestor Estrutural | `GE-E20.2.7-004` | Banco não se aplica; E19.2 permanece em `catalog_version = 2` e nenhuma linha é promovida ou migrada. | Achado favorável. | `preservação do escopo` | `incorporado`: banco, migration, RLS, policy, grant, Data API, adapter e persistência permanecem excluídos. | N/A | 5.1.3; 5.2.1; 5.4.1 | `docs/schema.md` 1.26; roadmap 20.2.7. |
| Gestor Estrutural | `GE-E20.2.7-005` | A inspeção visual não podia ficar condicional e o validador focal existente da jornada precisava integrar o gate. | `requer patch estrutural` | `extensão adjacente necessária e proporcional` | `incorporado`: a v2 exige validação focal, inspeção local autenticada e inspeção hospedada autenticada em Preview, separando as evidências. | N/A | 5.2.3; critérios de aceite de 5.3.1 | `AGENTS.md`; script `validate:lp-builder-onboarding-journey`; superfície Admin existente. |
| Gestor de Updates | `GU-E20.2.7-PROD-14` | O token canônico `rent` precisa ser reconhecível como `Locação` nas superfícies humanas tocadas. | Complementar; horizonte atual; aprovado. | `preservação do escopo` | `incorporado` como trava de reconhecimento, sem telemetria, novo fluxo, métrica ou programa de testes. | `usar como referência, validação ou trava` | 5.2.3 | `docs/prod-up.md` — `prod#14`; requisito humano de rótulo. |
| Gestor de Updates | `GU-E20.2.7-PROD-16` | A alteração visível da Admin exige QA proporcional em Preview. | Complementar; horizonte atual; aprovado. | `extensão adjacente necessária e proporcional` | `incorporado` como inspeção autenticada da versão 4 em desktop e largura móvel, sem nova UI ou matriz visual ampliada. | `usar como referência, validação ou trava` | 5.2.3; critérios de aceite de 5.3.1 | `docs/prod-up.md` — `prod#16`; `AGENTS.md`. |
| Gestor de Updates | `GU-E20.2.7-VERCEL-15` | Vercel Toolbar poderia centralizar colaboração visual se a duplicação de evidência se tornar recorrente. | Complementar; horizonte condicional. | `preservação do escopo` | `incorporado` documentalmente como oportunidade estratégica condicional e `não incorporado` ao escopo executável: não habilitar, configurar, contratar ou exigir; reavaliar somente após dois recortes visuais consecutivos com duplicação de evidência ou revisão simultânea de múltiplos revisores. | `preservar como oportunidade estratégica condicional` | 5.2.3 | `docs/vercel-up.md` — `vercel#15`; ferramentas atuais bastam para este delta. |
| Gestor de Updates | `GU-E20.2.7-SUPA-40` | Snippet SQL foi útil à cadeia taxonômica original, mas a cadeia e o banco não mudam nesta evolução repo-only. | Complementar; horizonte atual. | `preservação do escopo` | `não incorporado — justificado`: nenhum SQL, snippet ou inspeção de banco acrescenta evidência proporcional ao enum versionado. | `não aplicável ao recorte` | 5.2.3; 5.4.1 | `docs/supa-up.md` — `supa#40`; escopo negativo da v1. |
| Gestor de Updates | `GU-E20.2.7-PROD-17` | O delta textual não altera foco, teclado, associação, contraste, alvo de toque ou interação. | Complementar; horizonte atual. | `preservação do escopo` | `não incorporado — justificado`: preservar a acessibilidade existente sem ampliar para auditoria WCAG nem alegar conformidade integral. | `não aplicável ao recorte` | 5.2.3; 5.4.1 | `docs/prod-up.md` — `prod#17`; `prod#16` cobre a regressão visual material. |
| Gestor de Updates | `GU-E20.2.7-GITHUB-N/A` | Nenhum item do catálogo GitHub possui relação material com a alteração focal do enum e dos rótulos locais. | N/A. | `preservação do escopo` | `não incorporado — justificado`: nenhum workflow, integração ou gate GitHub foi criado. | `não aplicável ao recorte` | 5.4.1 | Varredura integral de `docs/github-up.md`. |
| Gestor de Automações | `N/A` | A única fase possui `Automação: não`. | N/A. | `preservação do escopo` | Especialista não acionado; nenhuma automação adicionada. | N/A | 5.3.1; 5.4.1 | Marcador da v1 preservado na v2. |

## Correções da Passagem 1 do Analista

| ID | Correção objetiva | Relação com o escopo | Tratamento | Localização na v2 | Evidência |
| --- | --- | --- | --- | --- | --- |
| `AN-P1-E20.2.7-001` | Corrigir duas referências residuais que ainda chamavam a seção executável de plano-base v1. | `preservação do escopo` | `incorporado`: status e fonte obrigatória da fase agora referem plano-base v2. | 5.3.1 | Diff `50f778c..3200178`. |
| `AN-P1-E20.2.7-002` | Separar prova local por `npm run dev` da inspeção autenticada no Preview e tratar indisponibilidade ambiental como pendência. | `extensão adjacente necessária e proporcional` | `incorporado`: evidências local e hospedada são bullets distintos; uma não substitui a outra. | 5.2.3 | `AGENTS.md`; diff `50f778c..3200178`. |

## Correções da Passagem 2 do Analista

| ID | Correção objetiva | Relação com o escopo | Tratamento | Localização | Evidência |
| --- | --- | --- | --- | --- | --- |
| `AN-P2-E20.2.7-001` | Tornar executável a validação focal do renderizador administrativo exigida por `prod#14`. | `extensão adjacente necessária e proporcional` | `incorporado`: validador route-local e comando focal previstos, sem abstração compartilhada ou nova UI. | Plano 5.2.3 e 5.3.1 | Parecer de Updates; Passagem 2. |
| `AN-P2-E20.2.7-002` | Corrigir tratamento e localização de `vercel#15`. | `preservação do escopo` | `incorporado`: oportunidade preservada documentalmente, excluída do executável e localizada apenas em 5.2.3. | Linha `GU-E20.2.7-VERCEL-15` | Parecer de Updates; Passagem 2. |
| `AN-P2-E20.2.7-003` | Normalizar a categoria formal de escopo. | `preservação do escopo` | `incorporado`: relações abreviadas passaram a `preservação do escopo`, sem alterar achados ou tratamentos. | Matriz integral | Contrato runtime do Analista; Passagem 2. |

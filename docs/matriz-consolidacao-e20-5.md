# Matriz de consolidação — E20.5

- Caso: E20.5.
- Plano-base v1 imutável: blob `8a53a73f29448a537e0036291e59582cd62c5c91`.
- Plano-base v2: `docs/lousa-plano-base-e20-5.md` na branch `codex-app/e20-5-orquestracao`.
- Gestor de Automações: N/A — nenhuma fase contém `Automação: sim`.

## Pareceres especializados

| Especialista | ID | Achado | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gestor Estrutural | `GE-E20.5-001` | Runtime poderia depender da coluna antes do apply. | Patch estrutural aplicável. | Extensão adjacente necessária e proporcional. | Incorporado com gate server-only fail-closed e separação entre validação pré-merge e ativação pós-merge. | N/A | 1.6; 3.2 | `docs/base-tecnica.md` 3.4.4; precedente `E11_MEMBERS_ENABLED`; workflow de migrations em `docs/platform-config.md`. |
| Gestor Estrutural | `GE-E20.5-002` | Migration não cobria o grant mínimo de escrita. | Patch estrutural aplicável. | Extensão adjacente necessária e proporcional. | Incorporado: coluna/check, `service_role UPDATE` restrito à coluna, RLS/policies preservados, sem grants novos a `anon`/`authenticated`, schema e probe read-only. | N/A | 1.4; 3.2 | `docs/schema.md`, `business_taxons`; `docs/base-tecnica.md` 4.3. |
| Gestor Estrutural | `GE-E20.5-003` | Seleção humana não possuía superfície e ação próprias. | Patch estrutural aplicável. | Preservação do escopo com extensão adjacente proporcional. | Incorporado em formulário separado, Server Action dedicada, guard, adapter, validação repo-only e update condicional `.maxAffected(1)`. | N/A | 2.3; 3.2 | Tela `/admin/taxonomia/[taxonId]`, `actions.ts`, `adminTaxonomyAdapter.ts`. |
| Gestor Estrutural | `GE-E20.5-004` | Casos determinísticos não estavam ligados ao gate executável. | Patch estrutural aplicável. | Extensão adjacente necessária e proporcional. | Incorporado com script dedicado em `package.json` e integração a `npm run check`. | N/A | 2.3; 3.1 | `package.json` e precedentes `landing-page/*/validation-cases.ts`. |
| Gestor Estrutural | `GE-E20.5-005` | Booleano derivado poderia colapsar ausência e falha operacional. | Patch estrutural aplicável. | Preservação da falha fechada da v1. | Incorporado como união discriminada; só sucesso retorna payload e E20.6 não colapsa erro em ausência. | N/A | 2.4; 3.3 | `docs/base-tecnica.md` 4.5 e 7.3. |
| Gestor de Updates | `supa#40` | Probe SQL read-only da migration. | Complementar; atual. | Extensão adjacente necessária e proporcional. | Incorporado como snippet versionado, estritamente read-only e gate pós-apply. | Usar como referência, validação ou trava. | 3.2 | `docs/supa-up.md` — `supa#40`. |
| Gestor de Updates | `vercel#22` | Dry-run auxilia a prova de empacotamento repo-only. | Complementar; atual. | Extensão adjacente necessária e proporcional. | Incorporado na primeira subseção com superfície deployada; não substitui smoke em Preview. | Usar como referência, validação ou trava. | 3.2 | `docs/vercel-up.md` — `vercel#22`. |
| Gestor de Updates | `prod#14` | Reconhecimento da seleção vigente, candidata e ausente. | Complementar; atual. | Preservação da decisão humana explícita. | Incorporado como critério da interface administrativa existente. | Usar como referência, validação ou trava. | 2.3; 3.2 | `docs/prod-up.md` — `prod#14`. |
| Gestor de Updates | `prod#16` | Validação hospedada dos estados administrativos. | Complementar; atual. | Extensão adjacente necessária e proporcional. | Incorporado como testes autenticados gate-on após apply e redeploy. | Usar como referência, validação ou trava. | 3.2 | `docs/prod-up.md` — `prod#16`. |
| Gestor de Updates | `prod#17` | Baseline acessível para controles e feedbacks. | Complementar; atual. | Extensão adjacente necessária e proporcional. | Incorporado com teclado, foco, associação e não dependência exclusiva de cor; sem alegação WCAG plena. | Usar como referência, validação ou trava. | 3.2 | `docs/prod-up.md` — `prod#17`. |
| Gestor de Updates | `supa#63` | pgTAP poderia apoiar regressão se RLS/policies ou RPC mudarem. | Complementar; condicional. | Fora do delta atual; oportunidade estratégica condicionada. | Não implementar. Preservar gatilho objetivo: alteração futura de policy/RLS ou RPC administrativa. | Preservar como oportunidade estratégica condicional. | 4.1 | `docs/supa-up.md` — `supa#63`; diff planejado não altera RLS/policies nem cria RPC. |
| Gestor de Updates | `supa#2` | Governança ampla de papéis/RLS. | Complementar; futuro. | Não aplicável ao recorte mínimo. | Rejeitado porque o recorte não cria papel, policy ou painel; schema e probe específico cobrem o risco atual. | Não aplicável ao recorte. | 4.1 | `docs/supa-up.md` — `supa#2`. |
| Gestor de Updates | `supa#52` | Generated column para validade da seleção. | Incompatível; atual. | Contraria o escopo e não consegue validar arquivo repo-only. | Rejeitado; validade permanece derivada no boundary e nunca persistida. | Não aplicável ao recorte. | 2.4; 4.1 | `docs/supa-up.md` — `supa#52`; decisão fixa da v1. |
| Gestor de Automações | `N/A` | Nenhuma fase possui `Automação: sim`. | N/A. | Fora do gatilho obrigatório. | Especialista não acionado; nenhuma automação adicionada. | N/A | 3.1; 3.2; 3.3 | Marcadores `Automação: não` da v1 e da v2. |

## Correções da Passagem 1 do Analista

| ID | Correção objetiva | Tratamento | Localização na v2 | Evidência |
| --- | --- | --- | --- | --- |
| `AN-P1-001` | Não exigir smoke hospedado antes de existir superfície consumidora. | Tracing, dry-run e smoke movidos de E20.5.3 para E20.5.4; nenhuma rota temporária. | 1.6; 3.1; 3.2 | E20.5.3 cria apenas boundary repo-only; a rota administrativa nasce em E20.5.4. |
| `AN-P1-002` | Separar validação pré-merge de ativação gate-on pós-merge. | Pré-merge prova gate-off e ausência de consulta; pós-merge exige apply, probe, configuração, redeploy e testes autenticados. | 1.6; 3.2; 3.3 | `docs/base-tecnica.md` 3.4.4 e `docs/platform-config.md`. |
| `AN-P1-003` | Registrar a flag na residência canônica. | `docs/platform-config.md` incluído no ABC da E20.5.4 com escopos, default, ordem e redeploy. | 3.2 | `docs/prompt-abc.md` 5 e 6.5. |
| `AN-P1-004` | Fechar a gramática mínima de metadata. | Seção inicial `## 1. Identificação e uso`, exatamente um item Markdown canônico por chave antes da próxima seção `##` e rejeição de ausência, duplicidade, malformação ou conteúdo vazio posterior. | 1.5; 2.2; 3.1 | Formato físico versionado em `docs/pesquisas-brutas/**/end_customer/vN.md`. |
| `AN-P1-005` | Dar residência futura à E20.6 sem implementá-la. | ABC do roadmap deve registrar somente objetivo/status futuro da E20.6. | 2.4 | Fronteira definida na v1 e ausência no snapshot congelado do roadmap. |
| `AN-P1-006` | Substituir referência genérica aos catálogos. | Paths e IDs exatos materializados nas fontes da v2 e nesta matriz. | 1.7 | `docs/supa-up.md`, `docs/vercel-up.md`, `docs/prod-up.md`, `docs/github-up.md`. |

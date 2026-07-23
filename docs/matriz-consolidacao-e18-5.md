# Matriz temporária de consolidação — E18.5

Data: 23/07/2026.

Caso: E18.5 — otimização do catálogo de módulos e variantes `landing_page`.

V1 imutável: commit `c79cbc3582d461a38544b1b3aa4d32a38d410949`, blob `ffefffe1099adcead21b9f9024fb9d07684534f2`.

V2 avaliada na Passagem 1: commit `21e3271e986416a799e0ea9ffd9eee0aca673358`, blob `de7d6cfd714a71ef7e72bb44bbd3955243070b99`.

Gestor de Automações: `N/A`; as sete fases estão marcadas como `Automação: não`.

Esta matriz é temporária, foi criada somente depois da conclusão independente da Passagem 1 do Analista e deve ser removida antes da publicação do PR v2.

| Especialista | ID estável | Achado fiel | Classificação original | Tratamento | Seção ou trecho exato na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|
| Gestor Estrutural | GE-E18.5-01 | Identidade e imutabilidade da referência v1 confirmadas. | Evidência confirmada; sem bloqueio. | não incorporado — justificado | N/A | O achado confirma os SHAs e blobs usados pelo workflow; não exige texto normativo no plano. |
| Gestor Estrutural | GE-E18.5-02 | Boundary, reuso e separação de responsabilidades aderentes. | Aderente; sem patch. | já coberto — sem alteração | §§1.3, 2.1, 2.5, 3.1–3.7 e 4.1 | A v2 preserva boundary, registry interno, resolver, Zod, contratos, falha fechada e exclui UI, banco, composição, persistência e renderer. |
| Gestor Estrutural | GE-E18.5-03 | Reuso da E18.4 e isolamento da E20.2 corretos. | Aderente; sem patch. | já coberto — sem alteração | §§1.7–1.9, 2.2–2.5, 3.1, 3.4, 3.5 e 4.2 | A v2 preserva precedência raiz-módulo-variante, não reabre E18.4 e proíbe importação ou duplicação do registry E20.2. |
| Gestor Estrutural | GE-E18.5-04 | Drift em `docs/lp-planejamento.md`. | Bloqueante no parecer inicial; superado pela adenda delta após o PR #618. | não incorporado — justificado | N/A | O PR #618 corrigiu e mergeou a fonte conceitual antes da consolidação. PE-01A e PE-01B tornaram-se obsoletos e não devem registrar conflito inexistente. |
| Gestor Estrutural | GE-E18.5-05 | Exceção para trocar a API pública conflita com o contrato vigente. | Bloqueante; PE-02 autossuficiente. | incorporado | §2.6, primeiro bullet | O texto preserva `landingPageModuleCatalog`, `resolveLandingPageModuleCatalog` e a internalidade de `registry.ts` e `schema.ts`, sem autorização por conveniência do diff. |
| Gestor Estrutural | GE-E18.5-06 | Hipóteses técnicas permanecem adequadamente limitadas. | Não bloqueante; sem patch obrigatório. | já coberto — sem alteração | §§1.5, 2.2, 3.3, 3.5 e 3.7 | A v2 mantém hipóteses abertas sob tipagem, falha fechada, casos negativos, ausência de ciclo e de infraestrutura nova. |
| Gestor Estrutural | GE-E18.5-07 | Banco e controles de acesso não se aplicam ao recorte. | N/A. | não incorporado — justificado | §4.1 | O escopo negativo já exclui banco, migration, adapter, persistência e infraestrutura; não há patch de DB a incorporar. |
| Gestor Estrutural | GE-E18.5-08 | Agrupamento `E18.5.3–E18.5.9` viola uma fase por subseção canônica. | Bloqueante; PE-03 autossuficiente, posteriormente revisado pelo delta GE-E18.5-09/10. | incorporado com revisão delta | §§3.1–3.7 | A v2 contém sete fases `18.5.3` a `18.5.9`, cada uma com `Automação: não`; o PE-03 revisado preserva checkpoints independentes e verdes. |
| Gestor Estrutural | GE-E18.5-09 | Dependência circular entre checkpoints de fields, variantes e sources. | Bloqueante no delta; PE-03 revisado autossuficiente. | incorporado | §§3.2, 3.3 e 3.5 | 18.5.4 permanece genérica; 18.5.5 cria identidades, field contracts, records e fundação de sources atomicamente; 18.5.7 completa a semântica e casos negativos sem lookup paralelo. |
| Gestor Estrutural | GE-E18.5-10 | Residência das métricas não estava verificável. | Bloqueante no delta; PE-03 revisado autossuficiente. | incorporado | §3.7, Residência da evidência comparativa | Cada checkpoint registra métricas no resumo do mesmo PR de implementação, vinculadas a SHA-base e SHA da fase; a consolidação final referencia todos os checkpoints, sem novo documento canônico. |
| Gestor de Updates | prod#17 | WCAG 2.2 como baseline abstrato aplicável a `hero.form@v1`. | Update aplicável com patches autossuficientes. | incorporado | Fontes; §§1.8, 3.3 e 3.7 | `docs/prod-up.md`, item `prod#17`, é a fonte canônica; a v2 limita o baseline a associação programática, teclado e foco, exige casos negativos e não declara conformidade integral nem antecipa UI/renderer. |
| Gestor de Updates | prod#6 | Conteúdo útil para busca generativa. | Preliminarmente elegível; rejeitado como futuro e fora do recorte. | não incorporado — justificado | N/A | A E18.5 representa dependências e não gera, publica, indexa ou avalia conteúdo; aplicação pertence à E19 futura. |
| Gestor de Updates | prod#4 | Agent Experience para acesso por navegador. | Preliminarmente elegível; rejeitado como futuro e fora do recorte. | não incorporado — justificado | N/A | Não existe DOM, árvore de acessibilidade, navegador ou renderer; o contrato abstrato atual já é coberto por prod#17. |
| Gestor de Updates | prod#16 | QA visual e validação de UX em Preview. | Preliminarmente elegível; rejeitado como futuro e fora do recorte. | não incorporado — justificado | N/A | Não há Preview ou superfície visual; teste humano e smoke visual permanecem N/A neste plano repo-only. |

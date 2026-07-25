# Matriz de consolidação — E20.3 e E12.4.3–E12.4.4

- V1 imutável: PR #629, head `52e0725085fbfbfb7f084936a33946a3be5de024`, blob `c436807f4c0447076ffab49547d420cb76740ec7`.
- V2 inicial: commit `d36d19f49c915c076173014bb275700f6b04b1bd`, blob `d27afd76feb12d4c9d0fe0067c87137668f4b47f`.
- V2 corrigida após a Passagem 1: commit `cba35e9050eec6085a742b7c978945abf8c0a4ed`, blob `d0a2759b29acba458e651432b60807931a5980d9`.
- Gestor de Automações: `N/A`; todas as fases declaram `Automação: não`.

## Parecer do Gestor Estrutural

| Especialista | ID | Achado fiel | Classificação original | Tratamento | Seção ou trecho na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|
| Gestor Estrutural | GE-E20.3-01 | Boundary novo não fechava API pública, residência de adapters, provider, Admin e consumidor E19.4. | requer patch estrutural | incorporado | 3.1, Classificação, residência e API pública; 3.3 | Núcleo puro, namespace público, adapters persistentes, provider server-only e superfícies Admin receberam residência explícita. |
| Gestor Estrutural | GE-E20.3-02 | Persistência não fechava entidades, identidade, histórico e cardinalidade das quatro responsabilidades. | requer patch estrutural | incorporado | 2.9 | Quatro tabelas dedicadas, ownership por fase, índices parciais, histórico e proibição de exclusão funcional foram definidos. |
| Gestor Estrutural | GE-E20.3-03 | Ativação, autorização e auditoria não possuíam boundary transacional executável com ator preservado. | requer patch estrutural | incorporado | 2.9, Mutações transacionais, ator e segurança | Três RPCs autenticadas, guards internos, auditoria na transação e proteção contra TOCTOU foram definidos. |
| Gestor Estrutural | GE-E20.3-04 | RLS e grants não fechavam policies, Data API, privilégios mínimos, EXECUTE e tratamento de views. | requer patch estrutural | incorporado | 2.9, Mutações transacionais, ator e segurança | Policies administrativas, grants distintos, ausência de DELETE, EXECUTE autenticado e `security_invoker` aplicável foram explicitados. |
| Gestor Estrutural | GE-E20.3-05 | Atualização da Base Técnica era opcional apesar de novo contrato durável. | requer patch estrutural | incorporado | 3.1, 3.2, 3.3 e 3.4 | Cada fase atualiza os contratos que materializa; em 3.3, o provider `landingPageCompositionProposalProvider`, sua residência server-only, limites e relação com Server Actions entram obrigatoriamente em `docs/base-tecnica.md`. |
| Gestor Estrutural | GE-E20.3-06 | Boundaries macro, consumo sem duplicação, separação de E19.4, migration incremental e exclusões estavam aderentes. | aderência estrutural confirmada | não incorporado — justificado | N/A | A v2 preserva essas decisões da v1; não havia patch a aplicar. |

## Parecer do Gestor de Updates

| Especialista | ID | Achado fiel | Classificação original | Tratamento | Seção ou trecho na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|
| Gestor de Updates | supa#2 | Security Controls Dashboard complementa a validação das novas RLS e policies. | complementar; atual; aprovado como validação | incorporado | 3.1, critérios de aceite | Inspeção pós-apply foi adicionada sem substituir migration, testes SQL, grants ou `docs/schema.md`. |
| Gestor de Updates | supa#20 | Bundles de Grants por Plano sobrepõem entitlement E9 e autorização operacional E20.3. | sobreposto; condicional; rejeitado | não incorporado — justificado | N/A | Duplicaria E9 e confundiria prontidão/autorização com entitlement. |
| Gestor de Updates | supa#46 | Logs Drains se relacionam a auditoria e observability da E20.3. | complementar; futuro; rejeitado | não incorporado — justificado | N/A | Indisponível no plano atual e não substitui auditoria de negócio nem logs do runtime. |
| Gestor de Updates | supa#57 | Schema Visualiser poderia apoiar revisão das novas relações. | complementar; condicional; rejeitado | não incorporado — justificado | N/A | Migration, testes SQL, schema e inspeção de segurança fornecem evidência mais objetiva. |
| Gestor de Updates | supa#63 | rlsautotest poderia gerar testes para as novas policies. | complementar; condicional; rejeitado | não incorporado — justificado | N/A | Ferramenta comunitária beta, dependência ausente e custo desproporcional ao recorte. |
| Gestor de Updates | vercel#1 | AI Gateway sobrepõe a chamada direta single-provider da proposta. | sobreposto; condicional; rejeitado | não incorporado — justificado | N/A | Não há múltiplos providers, fallback ou orçamento centralizado que justifique nova camada. |
| Gestor de Updates | vercel#15 | Vercel Toolbar poderia apoiar o teste humano em Preview. | complementar; atual; rejeitado | não incorporado — justificado | N/A | `prod#16` cobre QA manual sem criar dependência de ferramenta específica. |
| Gestor de Updates | vercel#27 | Next.js 16.1.1 possui correções de segurança pendentes antes de ampliar Server Actions Admin. | complementar; atual; aprovado como trava | incorporado | 3.3, trava tecnológica | Primeiro merge material Admin exige Next.js 16 estável corrigido, lockfile e validações, sem preview oportunista. |
| Gestor de Updates | prod#16 | QA visual em Preview é necessário para os estados e mutações Admin. | complementar; atual; aprovado como validação | incorporado | 2.10 | Checklist humano desktop/mobile, estados, teclado, foco, timing e layout shift foi definido sem nova infraestrutura. |
| Gestor de Updates | prod#17 | WCAG 2.2 fornece baseline às superfícies administrativas. | complementar; atual; aprovado como referência | incorporado | 2.10, critérios visuais | Aplicação limitada às interações entregues, sem alegação de conformidade integral. |
| Gestor de Updates | prod#19 | Stripe Entitlements reforça a separação entre autorização E20.3 e entitlement E9. | complementar; atual; aprovado como referência | incorporado | 2.8 | Consulta Stripe e persistência comercial paralela foram proibidas; conta, membership e E9 permanecem gates. |

## Correções obrigatórias da Passagem 1 do Analista

| ID | Correção solicitada | Tratamento | Seção ou trecho na v2 corrigida | Evidência |
|---|---|---|---|---|
| AN-P1-01 | Redistribuir entregas sem sobreposição entre as quatro fases. | incorporado | 2.9 e 3.1–3.4 | Cada tabela, migration, provider, UI e documentação possui fase proprietária explícita. |
| AN-P1-02 | Resolver a contradição entre boundary puro e provider com I/O. | incorporado | 3.1 e 3.3 | O núcleo puro permanece em `composition/`; o provider foi movido para `lib/conversion-content/adapters/`. |
| AN-P1-03 | Eliminar TOCTOU na ativação. | incorporado | 2.9, Mutações transacionais, ator e segurança | RPC compara fingerprint e `updated_at` esperados sob o mesmo lock antes de ativar. |
| AN-P1-04 | Preservar imutavelmente a prontidão usada na autorização. | incorporado | 2.9 | Avaliações são append-only com ID próprio; autorização referencia a avaliação imutável. |
| AN-P1-05 | Definir em qual fase cada tabela nasce. | incorporado | 2.9 e 3.1–3.4 | Políticas/composições em E20.3.3, prontidão em E20.3.4 e autorizações em E12.4.4. |
| AN-P1-06 | Remover duplicidade do script e associar provider/env à fase correta. | incorporado | 3.2 e 3.3 | Script ficou apenas em E20.3.4; provider e env ficaram em E12.4.3. |
| AN-P1-07 | Corrigir referências residuais à v1. | incorporado | 4.3 | As duas ocorrências agora se referem à v2 documental. |

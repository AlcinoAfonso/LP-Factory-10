06/08/2026 — Matriz de consolidação do plano-base E9.7 v2

## 1. Referências congeladas

- Plano-base v1: `8b58926043b28f8b900817a623fb8330bb84645b:docs/lousa-plano-base-e9-7.md`, blob `9d1e278310f097d4a1197d9bd7daae236b473305`.
- Plano-base v2 consolidada: `ea3ed9edf4869162af654a5eecadab3ef8e13ebd:docs/lousa-plano-base-e9-7.md`, blob `277847d0bf4aaa07b6bedf63bc4551939082e231`; checkpoint anterior às correções da Passagem 1: `9651912acd677404024543e5faedd150863f4f0a`.
- Plano conceitual: PR #691, head `4c86e9d7001b35c8314ca125b59ec3d98f90a33e`, decisões `L-014`, `L-015` e `C-003`.
- Roadmap/base: merge do PR #693, `8b58926043b28f8b900817a623fb8330bb84645b`.
- Decisões humanas: `DHE9.7-01: 2` e `DHE9.7-02: 2`.

## 2. Tratamento dos pareceres

| Especialista | ID estável | Achado ou update | Classificação original | Relação com o escopo | Tratamento na v2 | Destino | Evidência |
|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E9.7-001` | Fonte física, boundary e path estavam sem decisão. | Bloqueante | Material e direta | Resolvido por `DHE9.7-01: 2`; fixados boundary repo-only, arquivos e API pública. | Plano §§1.6, 1.7 e 3.1 | `lib/commercial-capabilities/` separado de entitlement e legado. |
| Gestor Estrutural | `GE-E9.7-002` | Conflito entre §3.11, ausência material de grants/snapshot e escopo repo-only. | Bloqueante | Material e direta | Resolvido por limitação documental formal de §3.11, sem banco, grants, overrides ou snapshot. | Plano §§1.6, 1.7, 2.4.5 e 3.1 | `DHE9.7-01: 2`. |
| Gestor Estrutural | `GE-E9.7-003` | Não existia capacidade Starter admitida implementável. | Bloqueante | Material e direta | Resolvido pela redução da execução à E9.7.3; registry runtime vazio; E9.7.4/.5 fora do escopo atual. | Plano §§1.5, 1.7, 2.1, 3.2 e 3.3 | `DHE9.7-02: 2`. |
| Gestor Estrutural | `GE-E9.7-004` | Separação entre entitlement, capacidade, consumidor e UI. | Conforme | Preservação | Mantido sem ampliação ou integração de consumidor. | Plano §§1.1, 1.2, 2.4.6 e 3.1 | Entitlement prova plano; E9.7 prova capacidade. |
| Gestor Estrutural | `GE-E9.7-005` | Reutilização histórica do identificador foi resolvida. | Conforme | Sem delta | Não reaberto. | N/A | PR #692, `L-014` e roadmap vigente. |
| Gestor Estrutural | `GE-E9.7-006` | Roadmap já havia sido reconciliado no PR #693. | Não bloqueante | Correção documental | Removida a tarefa repetida; preservado apenas o ABC posterior à aprovação. | Plano §3.4 | Merge `8b58926043b28f8b900817a623fb8330bb84645b`. |
| Gestor Updates | `supa#20` | Histórico de grants locais e trava contra presumir `model_grants`. | Atual, complementar; usar como referência/validação/trava | Direta | Aplicado como fonte e trava; adaptado à decisão humana que limita §3.11 neste contrato. | Plano §§0.2 e 1.6 | Não autoriza banco, `model_grants`, snapshot ou segundo resolver. |
| Gestor Updates | `prod#19` | Stripe Entitlements como benchmark, não autoridade runtime. | Atual, complementar; usar como referência/trava | Direta | Aplicado mecanicamente como fonte e trava de autoridade local. | Plano §§0.2 e 2.4.6 | Nenhuma adoção ou integração Stripe. |
| Gestor Updates | `supa#61` | SSO empresarial por OAuth/OIDC customizado. | Oportunidade estratégica condicional | Futura e fora do recorte | Preservado em `docs/supa-up.md`, `supa#61`; sem delta no plano ou catálogo runtime. | `docs/supa-up.md`, `supa#61` | Gatilho futuro: demanda enterprise formal. |
| Gestor Updates | `prod#1` | SSO Self-Service. | Oportunidade estratégica condicional | Futura e fora do recorte | Preservado em `docs/prod-up.md`, `prod#1`; sem UI, integração ou promessa comercial. | `docs/prod-up.md`, `prod#1` | Gatilho futuro: demanda enterprise administrável. |
| Gestor Updates | `prod#15` | Microeventos e progressão por plano. | Oportunidade estratégica condicional | Futura e fora do recorte | Preservado em `docs/prod-up.md`, `prod#15`; nenhum evento ou capacidade foi admitido. | `docs/prod-up.md`, `prod#15` | Depende de pergunta de negócio, ação e governança próprias. |
| Gestor Updates | `prod#23` | Capacidades oficiais de WhatsApp. | Oportunidade estratégica condicional, sobreposta | Futura e fora do recorte | Preservado em `docs/prod-up.md`, `prod#23`; nenhuma integração, webhook ou automação. | `docs/prod-up.md`, `prod#23` | Depende de caso real, operação e comparação aprovada. |
| Gestor Updates | `supa#32` | Stripe Sync Engine como autoridade da E9.7. | Incompatível; não aplicável | Contraria autoridade local | Rejeitado no recorte. | N/A | Não instalado; não resolve entitlement ou capacidade. |
| Gestor Updates | `vercel#20` | Vercel Flags como fonte comercial. | Incompatível; não aplicável | Criaria resolver paralelo | Rejeitado no recorte. | N/A | Rollout/targeting não equivale a capacidade comercial. |
| Gestor Updates | `github:N/A` | Nenhum update proporcional e específico. | Não aplicável | Sem relação material | Nenhum delta. | N/A | Parecer do Gestor Updates. |
| Gestor de Automações | `AUT-E9.7-N/A` | Todas as fases declaram `Automação: não`. | N/A | Fora do gatilho obrigatório | Especialista não executado e nenhuma automação criada. | N/A | Plano §§0.1, 3.1, 3.2 e 3.3. |

## 3. Correções da Passagem 1 do Analista

| ID | Correção obrigatória | Tratamento | Localização na v2 |
|---|---|---|---|
| `P1-E9.7-01` | Eliminar ambiguidade entre registry, resolver e API pública. | Apenas `index.ts` é público; `registry.ts` é fonte interna e `resolve.ts` é a única resolução de produção. | Plano §3.1, entrega e aceite. |
| `P1-E9.7-02` | Fixar residência das fixtures e comando do validador. | `validation-cases.ts` não é exportado/importado pelo runtime; `validate:commercial-capabilities` integra `npm run check`. | Plano §3.1, entrega e aceite. |
| `P1-E9.7-03` | Não tratar E9.7.4/.5 como bloqueios da E9.7.3. | Redação alterada para “fora do escopo atual”, sem pendência para E9.7.3. | Plano §§3.2 e 3.3. |

## 4. Resultado da consolidação

- Escopo executável: somente E9.7.3.
- Fonte runtime: repo-only e inicialmente vazia de capacidades admitidas.
- Banco, schema, migration, UI, rota, serviço, job, agente, automação e integração de consumidor: não aplicáveis.
- E9.7.4 e E9.7.5: permanecem planejadas, fora do escopo atual e dependentes de futura admissão humana.
- Pendência para a Passagem 2: verificar fidelidade desta matriz aos pareceres integrais e às decisões humanas.

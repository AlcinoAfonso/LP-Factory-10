# Matriz de consolidação — E20.2.9

## 1. Referências imutáveis

- V1: PR #825, head `fb05fff258ff234a2bb57c1f4479b25297860d46`, merge commit `1c0c27782aed883cad7345851ffdbd1f3f471b65`, blob `3cce7a7570b4634b8d5cac61a5a48189302928b6`, path `docs/lousa-plano-base-e20-2-9.md`.
- Roadmap congelado: commit `1c0c27782aed883cad7345851ffdbd1f3f471b65`, blob `d5652c32b2617fbf5499a1d8ed1a901d234480fc`.
- V2 inicial: commit `abc6211b856721b84bf1e4cdd96f96f301f80142`, checkpoint `LP-Factory-Stage: plan-v2`.
- Plano conceitual: PR #822, head `a4b5c74e7b115dbce1b669a242499520b9103b5e`, `docs/matriz-debate-e19-5-4.md`, somente como origem das decisões humanas consolidadas na v1.
- Parecer Estrutural: agente `01a04409-610c-78d0-9e23-bf7947e2d59e`, conclusão `requer patch estrutural`.
- Parecer de Updates: agente `01a04409-6249-7321-8aa9-27ac6e9a9d72`, veredito `updates aplicáveis com patches autossuficientes`.
- Gestor de Automações: `N/A — nenhuma fase com Automação: sim`.

## 2. Achados e tratamentos

| Especialista | ID | Achado fiel | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-01` | Falta definir a compatibilidade do baseline histórico da identidade sem regravar snapshots. | Bloqueante com patch `PE-01`. | preservação | incorporado | N/A | 1.7 e 2.2 | A v2 projeta em memória o baseline v5 singular, falha fechada para legado malformado e fixa igualdade material sem persistir a projeção. |
| Gestor Estrutural | `GE-02` | A autoridade única do novo value type não estava materializada. | Bloqueante com patch `PE-02`. | extensão adjacente necessária e proporcional | incorporado | N/A | 2.1 — Processamento e Validação | A v2 concentra tipo, validação, canonicalização e igualdade material no boundary público do input catalog e proíbe reimplementação nos consumidores. |
| Gestor Estrutural | `GE-03` | Metadados estruturais e substituição dos caminhos vigentes estavam subespecificados. | Bloqueante com patch `PE-03`. | preservação | incorporado | N/A | 1.5, 1.6, 2.1 e 3.1 | A v2 fixa scope/origin/substitution/version, retirada forward-only e reuso de `sameCommercialWorkConfirmed`; fields antigos permanecem apenas em versões/readers históricos e nos adapters/bootstraps de compatibilidade até canonicalização, sem autoridade corrente. |
| Gestor Estrutural | `GE-04` | O banco vigente já suporta o caso; migration deve ser explicitamente excluída. | Bloqueante com patch `PE-04`. | preservação | incorporado | N/A | 1.7, 2.1 — Persistência e 4.2 | A v2 proíbe schema, migration, ACL e nova residência, reutilizando a residence/save E19.2 pré-handoff e as residences/RPC E19.5 vigentes; divergência operacional exige parada. |
| Gestor de Updates | `supa#40` | Reutilizar verificadores SQL versionados das residences E19.5 e do lifecycle E20.2.8. | Elegível atual, complementar. | preservação | incorporado | usar como referência, validação ou trava | 3.1 — Critérios de aceite | A v2 exige os dois snippets read-only sem mutação e separa essa prova das regras semânticas de `offering_scope`. |
| Gestor de Updates | `vercel#15` | Ferramenta poderia apoiar QA visual de Preview, mas não acrescenta critério independente. | Elegível condicional, complementar. | expansão | não incorporado — benefício incremental não proporcional e disponibilidade não comprovada | não aplicável ao recorte | N/A | `prod#16` cobre o QA de forma independente de ferramenta; nenhum setting, dependência ou processo Vercel é criado. |
| Gestor de Updates | `prod#12` | Breadcrumb ou switcher contextual pode reduzir erro futuro de contexto entre múltiplas LPs/contas. | Elegível condicional, complementar. | expansão | incorporado somente como oportunidade condicional, sem implementação | preservar como oportunidade estratégica condicional | 2.4 | A v2 registra hipótese, complexidade média, gatilho objetivo e limite explícito; não cria navegação, grupo ou entidade. |
| Gestor de Updates | `prod#14` | Os três modos devem favorecer reconhecimento em vez de memorização dos valores técnicos. | Elegível atual, complementar. | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | 2.4 | A v2 exige rótulo humano e estado selecionado reconhecível para cada modo. |
| Gestor de Updates | `prod#16` | A superfície autenticada tocada exige QA proporcional em Preview. | Elegível atual, complementar. | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | 3.1 — Critérios de aceite | A v2 exige Preview autenticado desktop/mobile, papéis vigentes, modos, erros, save/reload e ausência de regressão visível. |
| Gestor de Updates | `prod#17` | O novo controle composto exige labels, erros, foco e teclado acessíveis. | Elegível atual, complementar. | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | 2.4 e 3.1 | A v2 exige associação programática, teclado, foco, estado perceptível, alvos responsivos e proíbe alegar conformidade WCAG integral. |
| Orquestração | `AUTO-01` | A v1 e a única subseção executável registram `Automação: não`. | Não aplicável. | preservação | não incorporado — nenhuma avaliação formal exigida | N/A | 1.1 e 3.1 já preservadas | `Gestor de Automações: N/A — nenhuma fase com Automação: sim`. |
| Analista — Passagens 1 e 2 | `AN-01` | A residência e o fluxo E19.2 pré-handoff estavam omitidos da persistência. | Correção objetiva obrigatória. | preservação | incorporado | N/A | 1.7, 2.1, 2.3 e 3.1 | A v2 inclui `account_landing_page_onboarding_configurations`, save/revalidação E19.2, residences/RPC E19.5 e o mesmo `C`, sem nova residência ou migration. |
| Analista — Passagens 1 e 2 | `AN-02` | A restrição das referências legadas excluía adapters necessários à adaptação runtime. | Correção objetiva obrigatória. | preservação | incorporado | N/A | 1.6 e 1.7 | A v2 permite os fields singulares somente em adapters de compatibilidade, bootstraps legados, readers históricos e testes até canonicalização, sem autoridade corrente. |
| Analista — Passagens 1 e 2 | `AN-03` | O aceite não provava integralmente a transição E19.2 pré-handoff. | Correção objetiva obrigatória. | extensão adjacente necessária e proporcional | incorporado | N/A | 2.1 — Validação e 3.1 — Critérios de aceite | A v2 exige leitura v5, projeção `single`, save/reload com chaves novas, handoff lazy sem fallback, falha fechada e igualdade de `C` entre E19.2, workspace e geração. |

## 3. Gate do Analista

- Passagem 1: agente `01a04426-ee8d-7d91-a616-b1d7e1c943c6`, modo `passagem_independente`, sem acesso aos pareceres ou a esta matriz.
- Conclusão da Passagem 1: `aprovado com correções obrigatórias`.
- Correções objetivas identificadas: incluir residência e fluxo E19.2 pré-handoff; preservar referências legadas nos adapters de compatibilidade até canonicalização; provar leitura, projeção, save/reload, handoff lazy, falha fechada e igualdade do mesmo `C` entre E19.2, workspace e geração.
- Passagem 2: `aprovado com correções obrigatórias`, confirmando as três correções objetivas e exigindo sua rastreabilidade na tabela principal.
- Estado para `revisao_delta`: correções aplicadas somente no plano e nesta matriz; implementação ainda não iniciada.

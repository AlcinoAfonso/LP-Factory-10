# Matriz de consolidação — Plano-base E18.5 v2

Data: 20/07/2026

Caso: E18.5 — Parametrização de módulos e variantes `landing_page`.

Referências imutáveis:

- v1: `83d0048678c3139b82075380c4e1bcbb1dac0043`, blob `905fc3ad861c038f79ca5fcdd28699cf22b6c561`;
- v2 avaliada na Passagem 1: `762139be231ba0b0a4f30cf30db4a7fa8a58e379`, blob `3db7d44d122dd25deff1ae1881d61d34d3265a85`;
- v2 corrigida para `revisao_delta`: `f541b0f4bcddae981d8413f3e47a05742af3ba65`, blob `f0118be75962ec1b7e309f70a61c7e9399d1191f`.
- v2 com topologia canônica das fases: `bbc99e1351f6adb68b7000a1909de9a6a5a18ec7`, blob `d3a24065d62bdc93b1ec9d98bc5719d30b585688`.
- v2 com correções obrigatórias da revisão de topologia: `005a437d12f124e78052c21cab402ea9351fd927`, blob `955c397923feb39740ca68be8afb35a3264a8c31`.

| Especialista | ID do achado | Achado | Classificação original | Tratamento | Local na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E18.5-001` | O boundary material, os arquivos novos e existentes, os índices, o namespace público e os artefatos preservados não estavam determinados. | `requer patch estrutural` | `incorporado` | regra comum de `4.2`, `4.2.1` e `4.2.7` | A v2 fixa `module-catalog/`, os seis arquivos novos, responsabilidades internas, namespace `landingPageModuleCatalog`, ajustes permitidos em `lib/conversion-content/index.ts` e `package.json`, APIs preservadas e arquivos removidos que não podem reaparecer. |
| Gestor Estrutural | `GE-E18.5-002` | A v1 criava um segundo vocabulário de lifecycle, divergente da raiz canônica. | `requer patch estrutural` | `incorporado` | `2.7`, estados da seção `3`, `4.2.1`, `4.2.3` e `4.2.7` | A v2 substitui `experimental/active` por `hypothesis/validated`, reutiliza `LandingPageRootLifecycleStatus`, preserva `deprecated`, separa os estados por camada e exige falha fechada para estado desconhecido. |
| Gestor Estrutural | `GE-E18.5-003` | `hero` e `final_cta` duplicavam uma allowlist parcial do catálogo operacional e não tratavam `form` sem drift. | `requer patch estrutural` | `incorporado` | `2.6`, `3.2`, `3.19`, `4.2.3` e `4.2.7` | A v2 remove as listas locais, mantém somente o vínculo abstrato com `primary_conversion_channel`, preserva `landingPageInputCatalog` como fonte canônica e declara incompatibilidade fail-closed das ocorrências sem formulário, sem fallback de canal. |
| Gestor Estrutural | `GE-E18.5-004` | O gate de regressão não executava os contratos runtime existentes afetados pelo índice público. | `requer patch estrutural` | `incorporado` | regra comum de `4.2` e validação integrada de `4.2.7` | A v2 ordena os oito comandos exigidos e amplia a validação própria para contratos positivos e negativos, lifecycle, fail-closed, imutabilidade e independência das variantes de FAQ. |
| Gestor Estrutural | `GE-E18.5-005` | O encerramento não atualizava `docs/base-tecnica.md` e `docs/roadmap.md` após a implementação material. | `requer patch estrutural` | `incorporado` | `5.1`, item `Encerramento documental obrigatório` | A v2 exige atualização pós-implementação baseada no diff e nas evidências, igualdade entre boundary, namespace, script, escopo e inventário reais, e proíbe registrar conclusão antecipada ou escopo externo. |
| Gestor de Updates | `prod#17` | WCAG 2.2 é baseline aplicável à capability de acessibilidade já aprovada para `faq.accordion@v1`, sem autorizar conformidade da interface ou antecipação do renderer. | `updates aplicáveis com patches autossuficientes`; uso `referência` | `incorporado` | `3.17` e `4.2.3` | A v2 inclui uma única referência normativa limitada a teclado, estado e associação acessíveis e foco; os critérios executáveis exigem esses itens, preservam `faq.standard@v1` sem interação e mantêm HTML, estilo, Preview, renderer e conformidade concreta fora do recorte. |
| Analista | `AN-E18.5-001` | O `copySourceMap` e os perfis de funil estavam incompletos por campo e por intenção BOFU, MOFU e TOFU. | `aprovado com correções obrigatórias` | `incorporado` | `2.5.1`, `2.5.2`, `4.2.5`, `4.2.6` e `4.2.7` | A v2 corrigida fecha fontes principais e auxiliares para cada campo textual, define tratamentos permitidos, restritos e proibidos por perfil e exige correspondência integral na validação. |
| Analista | `AN-E18.5-002` | A incompatibilidade com formulário não possuía metadata estrutural estável e tipada, nem separava as responsabilidades de E18.5, E19 e E20. | `aprovado com correções obrigatórias` | `incorporado` | `2.6`, `3.2`, `3.19`, `4.2.3` e `4.2.7` | A v2 corrigida define `actionCompatibility.supportsPrimaryConversionForm = false`; E18.5 apenas expõe a metadata, E20 evita a seleção incompatível e E19 avalia o valor concreto com falha fechada. |
| Analista | `AN-E18.5-003` | A expressão "dez contratos iniciais" era ambígua entre módulos, variantes e pares resolvidos. | `aprovado com correções obrigatórias` | `incorporado` | `4.2.7` | A v2 corrigida distingue explicitamente nove módulos, dez variantes e dez resultados módulo-variante: nove pares `standard@v1` e o adicional `faq.accordion@v1`. |
| Analista | `AN-E18.5-004` | O bloqueio de novas composições com lifecycle `deprecated` estava atribuído indevidamente à E18.5. | `aprovado com correções obrigatórias` | `incorporado` | `2.7` e `4.2.7` | A v2 corrigida limita E18.5 a expor o estado e preservar leitura histórica, encaminhando à E20 consumidora o bloqueio de novas composições. |
| Analista | `AN-E18.5-005` | A matriz deveria preservar as seis linhas especialistas e registrar os achados independentes do Analista antes da revisão de delta. | `aprovado com correções obrigatórias` | `incorporado` | N/A — correção da matriz | As seis linhas especialistas foram preservadas integralmente e as cinco correções obrigatórias do Analista foram adicionadas com tratamento e evidência rastreáveis. |
| Decisão humana | `HUM-E18.5-001` | A execução deve usar as sete subseções canônicas E18.5.3–E18.5.9, sem aliases ordinais e sem merge entre fases. | `decisão registrada` | `incorporado` | `4.2` e `5.1` | A fase agregada foi desmembrada; o avanço ocorre na mesma branch e no mesmo PR, com gate do Analista por subseção e parada experimental para relatório. |
| Analista | `AN-E18.5-006` | A decomposição atribuía os fields aos módulos, embora o contrato aprovado os atribua às variantes. | `aprovado com correções obrigatórias` | `incorporado` | `4.2.2` | E18.5.4 passa a registrar os contratos de fields das dez variantes e proíbe catálogo próprio de fields no nível dos módulos. |
| Analista | `AN-E18.5-007` | A fase agregada continha garantias executáveis que não foram integralmente redistribuídas. | `aprovado com correções obrigatórias` | `incorporado` | `4.2.7` | Foram restaurados registry como fonte única, schema sem duplicação ou fallback, resolver exclusivo do registry, lifecycle `hypothesis` explícito e testes de imutabilidade sem referências compartilhadas. |

## Limites da consolidação

- Nenhum parecer anterior à reinicialização do fluxo foi usado.
- Nenhum Gestor de Automações foi acionado, pois as fases declaram `Automação: não`.
- A matriz preserva os cinco achados estruturais e o único update aplicável da rodada vigente, registra as sete correções obrigatórias do Analista e a decisão humana de topologia.
- A matriz não autoriza implementação, merge ou ampliação da grade fechada da E18.5.

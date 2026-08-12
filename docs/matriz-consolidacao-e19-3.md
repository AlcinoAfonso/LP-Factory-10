# Matriz de consolidação — E19.3 — Cenário D

- Caso: `E19.3 — Pacote autorizado para geração no Cenário D`.
- V1 imutável: PR #728, commit de merge `5fb0f11966ca577ba6b0c981f177ee4c15589195`, blob `2e83d3b7b965dc4234ce38d6dc127c37682249c8`.
- V2 avaliada: commit `cea73ce4cd1080c02733523fdd9de8844d91d9f8`, blob `b43dab84105e2ada4dc5cacb223a31cca4cb5600`.
- Roadmap congelado: commit `5fb0f11966ca577ba6b0c981f177ee4c15589195`, blob `5f0491bb66e660ab760fa2f113fbb897ab5e9cb3`.
- Gestor Estrutural: `bloqueado por decisão humana`; o humano escolheu a opção 2, e a revisão delta posterior concluiu `aprovado` após os patches objetivos.
- Gestor de Updates: `updates aplicáveis com patches autossuficientes`.
- Gestor de Automações: `N/A — nenhuma fase com Automação: sim`.
- Passagem 1 do Analista: `aprovado com correções obrigatórias`; a `revisao_delta` do mesmo Analista concluiu `aprovado para merge do plano-base v2`.

| Especialista | ID estável | Achado ou referência fiel | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E19.3-001` | Fonte, path e boundary `lib/lp-builder/` são coerentes; compilador puro e adapter server-only permanecem separados, sem UI, provider, rota ou infraestrutura nova na E19.3. | achado favorável | preservação | incorporado | N/A | 1.3, 1.4, 2.1 e 3.1 | A v2 mantém as autoridades E10.8, E18.4, E20.2, E19.2 e E9 e a residência no boundary vigente. |
| Gestor Estrutural | `GE-E19.3-002` | A substituição deve retirar módulos, variantes, perfil E20.3, `copySourceMap`, perfis de funil e guidance sem criar contrato paralelo. | achado favorável | preservação | incorporado | N/A | 1.2, 1.4, 2.7 e 3.1 | A v2 retira E18.5/E20.3 do caminho canônico, proíbe fallback, alias, DTO paralelo e código dormente. |
| Gestor Estrutural | `GE-E19.3-003` | A projeção por `valueType`, a pesquisa E10.8 e a E18.4 permitem separar `modelContext` de `serverContext` sem expor valores operacionais como matéria-prima textual. | achado favorável | preservação | incorporado | N/A | 2.2 a 2.6 | A v2 preserva tipos, metadados, proveniência, declaração versus evidência e limites editoriais mínimos. |
| Gestor Estrutural | `GE-E19.3-004` | A shape incompatível `identities + modelContext + serverContext` não pode reutilizar o contrato v1 `partA + partB`; deve usar `contractVersion: 2`. | requer patch estrutural | extensão adjacente necessária e proporcional | incorporado | N/A | 2.6 e 3.1 | O contrato v2 é explícito; v1, alias, fallback e DTO público paralelo são proibidos e cobertos por aceite. |
| Gestor Estrutural | `GE-E19.3-005` | A v1 tratava E19.4 como futura, mas roadmap e código registram geração, materialização e preview já implementados. | conflito factual determinante | preservação | incorporado | N/A | 1.1, 1.4, 3.1 e 3.2 | A v2 reconhece o runtime vigente, determina sua retirada temporária e exige marcar o plano E19.4 anterior como superado, sem replanejá-lo. |
| Gestor Estrutural | `GE-E19.3-006` | Substituir apenas E19.3 quebraria consumidores E19.4 de `partA + partB`; compatibilidade paralela viola o contrato único. | bloqueado por decisão humana | expansão sem decisão; após decisão, extensão adjacente necessária e proporcional | incorporado após decisão humana | N/A | 1.1, 1.4, 3.1 e 4.1 | O humano escolheu retirar temporariamente todo runtime E19.4 dependente da shape antiga e replanejá-lo depois da prova do Cenário D. |
| Gestor Estrutural | `GE-E19.3-007` | E19.3 não exige migration; objetos de LP, configuração e pesquisa são reutilizados, e os três artefatos SQL E19.4 devem permanecer forward-only. | achado favorável | preservação | incorporado | N/A | 1.4, 2.1, 3.1 e 4.1 | A v2 proíbe rollback, edição de migration, nova migration e mutação remota; preserva somente migration, teste SQL e snippet. |
| Gestor Estrutural | `GE-D-001` | A retirada da E19.4 deve alcançar todos os artefatos runtime dependentes de `partA + partB`, não apenas exports e superfícies. | requer patch estrutural | extensão adjacente necessária e proporcional | incorporado | N/A | 1.4 e 3.1 | A v2 exige remoção de contratos, implementações, adapters, actions, componentes, rota, workload, scripts e validadores, sem código dormente. |
| Gestor Estrutural | `GE-D-002` | Os imports, exports, chamadas, registry OpenAI e scripts focais devem ser removidos junto com a implementação E19.4 antiga. | requer patch estrutural | extensão adjacente necessária e proporcional | incorporado | N/A | 3.1 | A entrega e os critérios de aceite exigem ausência de consumidor, workload ou script dependente da shape antiga. |
| Gestor Estrutural | `GE-D-003` | O escopo negativo não pode proibir as remoções necessárias da E19.4 nem autorizar sua adaptação ao pacote v2. | requer patch estrutural | preservação | incorporado | N/A | 4.1 | A v2 distingue remoção autorizada de criação, evolução, adaptação ou execução proibidas. |
| Gestor Estrutural | `GE-D-004` | A v2 deve referir-se a si própria como plano-base v2. | requer patch estrutural | preservação | incorporado | N/A | 4.2 | A referência residual à v1 foi corrigida. |
| Gestor de Updates | `prod#19` | Entitlement deve ser resolvido exclusivamente pelo boundary interno E9; sinal externo Stripe não libera acesso. | complementar; horizonte atual | preservação | incorporado | usar como referência, validação ou trava | 2.1 e 3.1 | A v2 exige falha antes da montagem do pacote e proíbe SDK, adapter ou resposta Stripe na E19.3. |
| Gestor de Updates | `vercel#1` | AI Gateway pode beneficiar transporte e observabilidade da futura E19.4, mas a E19.3 não chama provider. | sobreposto; horizonte condicional | expansão | não incorporado — oportunidade preservada | preservar como oportunidade estratégica condicional | N/A | Gatilho: necessidade comprovada de múltiplos providers, fallback ou observabilidade insuficiente; não implementar Gateway, Sandbox ou BotID neste recorte. |
| Gestor de Updates | `prod#6` | Orientação editorial pode beneficiar a geração futura, não a projeção determinística da E19.3. | complementar; horizonte futuro | expansão | não incorporado — oportunidade preservada | preservar como oportunidade estratégica condicional | N/A | Gatilho: E19.4 autorizar geração e critérios editoriais; não filtrar, resumir ou reorganizar pesquisa na E19.3. |
| Gestor de Updates | `prod#17` | WCAG 2.2 é pertinente ao renderer e à validação visual futura, não ao pacote E19.3. | complementar; horizonte futuro | expansão | não incorporado — oportunidade preservada | preservar como oportunidade estratégica condicional | N/A | Gatilho: E19.4 autorizar renderer e validação visual; não incorporar ARIA, foco, contraste ou viewport ao `modelContext`. |
| Gestor de Updates | `supa#46` | Retenção externa de logs pode ter valor operacional futuro, mas o plano proíbe novo Log Drain. | complementar; horizonte condicional | expansão | não incorporado — oportunidade preservada | preservar como oportunidade estratégica condicional | N/A | Gatilho: plano apto e necessidade comprovada de retenção/compliance; logging permanece sanitizado e sem destino externo. |
| Gestor de Automações | `AUT-N/A` | A única fase E19.3.3 declara `Automação: não`. | N/A | preservação | não incorporado — justificado | N/A | 3.1 e 4.1 | Nenhum agente foi acionado; OpenAI, provider, job, fila, cron e automação permanecem fora do recorte. |

## Correções objetivas da Passagem 1

- Preservar `complete_bound → operational` por estado mínimo, determinístico e read-only após retirar E19.4, sem fallback comercial, branch sem resultado ou capability improvisada: incorporado em 3.1 e 4.1.
- Marcar `docs/lousa-plano-base-e19-4.md` como temporariamente superado e não executável, preservando história sem iniciar o plano sucessor: incorporado em 3.1 e 4.1.

## Travas preservadas

- A decisão humana autoriza retirar temporariamente a E19.4 antiga; não autoriza adaptar geração, candidata, materialização, snapshot ou renderer ao pacote v2.
- Nenhuma oportunidade condicional autoriza implementação, mudança de stack ou ampliação do recorte.
- Não criar compatibilidade `partA + partB`, alias, fallback, feature flag, export privado, DTO paralelo ou código dormente.
- Preservar somente a migration, o teste SQL e o snippet E19.4 versionados; não executar rollback, editar migration ou fazer mutação remota.
- A primeira prova no draft real pode permanecer como validação ambiental pendente durante o trabalho repo-only, mas é necessária antes de declarar a prova concluída.
- A matriz permanece disponível até a entrega completa e só pode ser removida por instrução humana.

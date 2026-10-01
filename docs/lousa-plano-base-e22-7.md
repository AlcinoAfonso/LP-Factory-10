# Plano-base E22.7 — Retirada terminal da E20 e E10.10

## V1 funcional aprovada — congelada

Fonte: Debate 14B, seção 4.4, documento `19Gn0yxRXEIsLXQ-UqF9l-PW4nkqfc-PX2OjrNX0Tr18`. Supervisão: Autônomo. Dependência E10.11 concluída positivamente, recibo D14B §5.5, PR documental #993, merge `d191f0b8b6373666205e02d5c5642ac1ed3fcc7f`.

As classificações históricas abaixo pertencem ao registro literal da V1; a execução segue o Pipeline vigente, sem roteamento por classes.

4.4 PB-C — E22.7 Retirada terminal da E20 e E10.10 — V1 funcional consolidada
4.4.1 Problema e resultado funcional
• Problema: E20 permanece materializada como domínio funcional e E10.10 possui código e migrations candidatas apesar de ambos terem perdido autoridade na nova jornada; retirar por associação, porém, pode quebrar consumidores independentes como o comercial E10.7.
• Resultado: retirada terminal e auditável da E20 e do E10.10, sem segunda autoridade factual, sem consumer ativo do onboarding rejeitado e sem dano às capacidades independentes preservadas da E10, E9, E11, taxonomia, pesquisas compartilhadas e comercial.
4.4.2 Comportamento, preservações e limites
• Antes de remover qualquer ativo, classificar consumidores reais como preservados, desacoplados ou removíveis. Antiguidade, prefixo E20 ou localização de arquivo não bastam para autorizar retirada.
• E10.10 é retirado integralmente como caminho funcional. Suas migrations ainda não aplicadas não devem ser aplicadas para concluir a camada rejeitada; migrations históricas permanecem imutáveis no Git quando necessário à rastreabilidade.
• E20 deixa de existir como domínio funcional, incluindo autoridades, superfícies, workloads, gates e contratos exclusivos que não possuam responsabilidade independente comprovada. Remoção física de banco/configuração, quando necessária, deve ser forward-only e sem CASCADE indiscriminado.
• Preservar business_taxons, aliases, resolução de nicho, account_taxonomy, E10.3, E10.5, E10.9, E10.6/E10.7, E9, E11 e demais contratos independentes comprovados.
• Preservar pesquisas estruturadas, objetos e insumos compartilhados enquanto houver consumidor independente real, especialmente E10.7. Essa preservação não mantém catálogo factual, cobertura, herança, liberação ou autoridade da E20 e não transfere pesquisas para a Base.
• Dados históricos inertes podem permanecer quando sua remoção destrutiva não for necessária ao resultado. Qualquer limpeza de dado que não seja indispensável à retirada funcional exige decisão própria.
• Escopo negativo: não redesenhar E10, comercial, taxonomia, Base, billing, trial ou LP; não criar domínio substituto, compatibilidade paralela, archive funcional, snapshot vivo ou nova infraestrutura para guardar a arquitetura retirada. Não remover capacidade, dado ou objeto apenas por associação nominal à E20/E10.10; não usar a retirada para refatorar, modernizar ou reorganizar domínios preservados; não reconstruir catálogo factual, cobertura, herança ou autoridade equivalente dentro da Base, taxonomia ou outro domínio. Limpeza destrutiva não indispensável permanece fora do plano.
4.4.3 Posição planejada no roadmap e fases
• Posição planejada: E22.7 — Retirada terminal da E20 e E10.10, dentro de E22 — Retirada controlada de ativos históricos.
• 22.7.1 — Objetivo e status; 22.7.2 — Registros do recorte, materializados somente pela execução.
• 22.7.3 — Auditoria de consumidores e fronteiras preservadas: inventariar dependências reais e provar o destino de cada capacidade compartilhada antes da remoção.
• 22.7.4 — Retirada dos caminhos funcionais: remover consumidores, superfícies, workloads, contratos e código exclusivos da E20/E10.10 sem afetar os domínios preservados.
• 22.7.5 — Retirada material residual: tratar banco, configuração e resíduos exclusivos somente após prova de ausência de consumidor, preservando migrations históricas, dados inertes e objetos compartilhados quando aplicável.
4.4.4 Classificação, automação e dependências
• Execução: Complexa. Motivo: a retirada atravessa código, Admin, banco, configuração e workloads, com consumidores compartilhados e necessidade de provar preservação item a item antes de excluir contratos.
• Automação: não. Trata-se de retirada técnica controlada, sem novo job, agente, workflow, engine ou automação de produto.
• Dependência: PB-B. A retirada terminal só pode concluir depois que a nova passagem para a Base estiver comprovada; enquanto isso, a decisão funcional de não evoluir E20/E10.10 já permanece vigente.
4.4.5 Critérios de aceite e evidências esperadas
• Nenhum caminho executável, UI, gate ou consumidor vigente depende de E10.10 ou de autoridade funcional da E20.
• Busca e inventário comprovam destino explícito dos consumidores: removido, desacoplado ou preservado por responsabilidade independente.
• E10.6/E10.7 continuam funcionando com seus insumos independentes; conta sem autorização mantém experiência comercial e conta autorizada mantém passagem à Base.
• Taxonomia e resolução de nicho continuam operacionais sem herança factual, cobertura ou gate da E20; ausência de taxon oficial continua sem bloquear a Base.
• Banco/configuração não mantêm objeto ativo exclusivo da E20 apenas por compatibilidade; quando um resíduo permanece, sua inércia e o consumidor independente correspondente ficam comprovados.
• Validação final cobre regressões de acesso, membership, entitlement, comercial, Pending Setup, taxonomia e Base, além das superfícies administrativas afetadas, sem links ou ações órfãs.
• Roadmap, schema, base técnica, configuração e demais documentos canônicos são reconciliados somente com o estado efetivamente implementado, sem apagar a proveniência histórica.
4.4.6 Supervisão
• Supervisão: Autônomo. Após o handoff, o fluxo técnico conduz o plano sem supervisão rotineira do Estrategista Original, preservando integralmente a V1 e seu escopo negativo; questões fora da autoridade concedida devem ser escaladas conforme o Prompt Estrategista.

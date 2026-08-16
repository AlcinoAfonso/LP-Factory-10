# Matriz de consolidação — E19.3 — Cenário E

- Caso: `E19.3 — resolução dinâmica da versão E20.2 revisada, plano efetivo, cadeia taxonômica completa, revalidação read-only da E19.2 e pesquisa integral`.
- V1 imutável: PR #731, head final `7c22a08a8a8e4e3a01325d19e82da72f1b93d8e5`, merge commit `89125edb73f2169b89e57e787eccd70ced54b112`, blob `7cd692da6e6d665ce2a6713166e14093ce71c25f`.
- V2 corrigida: commit `bfe32a3d07526b55649c2bd1a690aeef1fe02681`, blob `ba5fe9dda69755626afc5732ee091aacc3145ca7`.
- Roadmap congelado: commit `f7ceb6fe7d5c995acc5c4cced63824830ac9ae7a`, blob `1ec9b58f54f9689726b0568d0868ce28e6b439f9`.
- Gestor Estrutural: `rejeitado por conflito com fonte competente`.
- Gestor de Updates: `updates aplicáveis com patches autossuficientes`.
- Gestor de Automações: `N/A — a única fase declara Automação: não`.
- Passagem 1 do Analista: `aprovado com correções obrigatórias`.

| Especialista | ID estável | Achado ou referência fiel | Classificação original | Relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E19.3-01` | O plano e o roadmap projetavam `contractVersion: 3`, enquanto `docs/base-tecnica.md` ainda declarava o pacote atual como v2. | conflito com fonte competente | extensão documental adjacente necessária e proporcional | incorporado após decisão humana | atualização canônica posterior à implementação | 1.1 e 3.1 | A decisão humana determinou tratar o drift da Base Técnica como extensão documental adjacente da v2, sem alterar a v1; o plano prevê ABC da Base Técnica somente após implementação factual. |
| Gestor Estrutural | `GE-E19.3-02` | Faltava explicitar quem fornece `requiredInputCatalogVersion` sem violar o contrato negativo da E20.6. | conflito estrutural | extensão necessária e proporcional | incorporado após decisão humana | boundary de preparação taxonômica | 2.7 e 3.1 | A autorização já existente na seção 2.7 da v1 foi tornada concreta por operação aditiva que resolve a versão revisada e a entrega explicitamente à derivação canônica, preservando integralmente a operação antiga e seu erro de incompatibilidade. |
| Gestor Estrutural | `GE-E19.3-03` | O roadmap da E19.4 ainda dizia que ela consumiria o pacote v2, em conflito com o novo `contractVersion: 3`. | conflito com fonte competente | extensão documental adjacente necessária e proporcional | incorporado após decisão humana | ABC de planejamento do roadmap | 1.1 e 3.1 | A decisão humana autorizou somente o delta referencial estritamente necessário em E19.4, sem iniciar ou alterar seu planejamento material. |
| Gestor Estrutural | `GE-E19.3-04` | Paths, boundaries e separação entre compilador puro, adapter server-only e autoridades canônicas eram estruturalmente adequados. | achado favorável | preservação | incorporado | N/A | 1.4, 2.7 e 3.1 | A v2 preserva os boundaries existentes e proíbe leitura, herança, contrato ou autoridade paralelos. |
| Gestor Estrutural | `GE-E19.3-05` | O recorte não exige mudança de banco; as evidências hospedadas de migrations, RLS, `service_role`, piloto v1 e catálogo revisado v4 eram compatíveis. | achado favorável | preservação | incorporado | N/A | 2.1, 3.1 e 4.1 | A v2 mantém execução read-only, sem migration, mutação remota ou alteração do contrato persistido da E19.2/E20.6. |
| Gestor Estrutural | `GE-E19.3-06` | A v1 não tornava explícitos `npm ci` e `npm run check`, embora sejam obrigatórios pela Base Técnica. | lacuna de validação | preservação | incorporado após decisão humana | validação da fase | 3.1 | A decisão humana confirmou ambos como obrigatórios sem necessidade de alterar a v1. |
| Gestor de Updates | `prod#19` | Entitlement deve ser resolvido exclusivamente pelo boundary interno vigente da E9; plano, assinatura, feature ou resposta de provedor comercial externo são apenas referências ou mecanismos e não substituem esse sinal. | complementar; horizonte atual | preservação | incorporado | usar como referência, validação ou trava | 2.1 | A formulação foi incorporada literalmente e mantém falha anterior à montagem do pacote. |
| Gestor de Updates | `supa#5` | Inspeção manual poderia ser considerada apenas após falha real e confirmação de disponibilidade, sem criar Log Drain ou expor dados sensíveis. | complementar; horizonte condicional | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | O Analista classificou a menção como adiável e desnecessária ao plano; a linha foi removida sem alterar o escopo autorizado. |
| Gestor de Updates | `vercel#1` | AI Gateway poderia ser avaliado na E19.4 somente diante de workload real e limitação mensurável da integração direta. | sobreposto; horizonte futuro | expansão | não incorporado — justificado | preservar como oportunidade estratégica condicional | N/A | O Analista determinou que a oportunidade pertence à E19.4 futura e expande este recorte; a linha foi removida. |
| Gestor de Updates | `supa#54` | RAG não é aplicável à montagem determinística e à pesquisa integral já autoritativa. | não aplicável | expansão | não incorporado — justificado | não aplicável ao plano | 2.7 e 4.1 | A v2 preserva a vedação a RAG, filtragem, resumo ou reorganização da pesquisa. |
| Gestor de Updates | `prod#17` | WCAG 2.2 pertence a renderer e validação visual futuros, não ao pacote de contexto sem UI. | complementar; horizonte futuro | expansão | não incorporado — justificado | não aplicável ao plano | 2.4 e 4.1 | Não há renderer nem superfície visual neste recorte. |
| Gestor de Automações | `AUT-N/A` | A única fase E19.3.3 declara `Automação: não`. | N/A | preservação | não incorporado — justificado | N/A | 3.1 e 4.1 | Nenhum especialista de automações foi acionado; provider, agente, job, fila, cron e automação permanecem fora do recorte. |

## Correções objetivas da Passagem 1

- Remover a linha que preservava `supa#5` como oportunidade condicional dentro do escopo negativo.
- Remover a linha que preservava `vercel#1` como oportunidade futura da E19.4 dentro do escopo negativo.
- Preservar integralmente todas as demais mudanças da v2, inclusive a operação aditiva para a versão revisada, os ABCs documentais adjacentes e as validações obrigatórias.

## Decisão humana de retomada

- Retomar no mesmo checkpoint e na mesma branch, sem novo recorte ou nova referência imutável.
- Tratar os drifts de `docs/base-tecnica.md` e do roadmap E19.4 como extensões documentais adjacentes necessárias da v2.
- Tratar `requiredInputCatalogVersion` conforme a autorização já existente na seção 2.7 da v1, preservando integralmente o contrato negativo da E20.6.
- Considerar `npm ci` e `npm run check` obrigatórios pela Base Técnica, sem alterar a v1.
- Preservar o parecer do Gestor Estrutural na matriz e não repetir especialistas.

## Travas preservadas

- A decisão humana resolve os conflitos apontados sem apagar, reclassificar ou substituir o parecer do Gestor Estrutural.
- A operação aditiva não altera a semântica de `loadTaxonPreparationForVersion`, não infere `latest`, não fixa v4 e não enfraquece o erro de incompatibilidade entre versão requerida e revisada.
- O delta futuro no roadmap E19.4 limita-se à referência estritamente necessária ao pacote v3; não inicia nem replaneja a E19.4.
- Nenhuma oportunidade condicional autoriza implementação, mudança de stack ou ampliação do recorte.
- Não há migration, mutação remota, mudança de RLS, persistência de pesquisa, RAG, provider, UI, rota, publicação ou automação.
- A matriz permanece disponível até a entrega completa e só pode ser removida por instrução humana.

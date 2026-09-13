# Plano-base E20.6 — V1 funcional consolidada do Debate 12

- Estado: V1 funcional consolidada; execução técnica suspensa até a emissão da V2 aprovada.
- Plano: E20.6 — Liberação e revisão factual de taxons.
- Fonte funcional: seções 4.1–4.10 do Google Doc `Debate 12 — Evolução da revisão factual e UX administrativa da E20 — LP Factory 10`.
- Documento fonte: `1XxMtfz_W0pTEWKiwQ00JIzrjQMC64fIAT40bIJpGZ5w`.
- Revisão fonte: `ANLCKQl7xrJb-Wnad68kW00rg7fezszGop5fqv1nZRlzYfvt62xkp8mWMJkldGi3-KuPHUi4Ukdo_D0vNyg8J1H1Y2c788pikhljBOrjHhw`.
- Base: `origin/main` em `71bd3041a8c59a0922fc5aa1c5344de8cf1a66dc`.

## 4.1 V1 funcional consolidada — E20.6 Liberação e revisão factual de taxons

- Estado: V1 funcional consolidada; execução técnica suspensa até a emissão do novo Plano Base.
- Classificação: Complexa apenas pelo alcance sobre contratos existentes; a solução funcional deve permanecer mínima e não autoriza nova infraestrutura.
- Plano único do Debate 12; não cria E20.8 ou E20.9.

## 4.2 Problema e resultado funcional

- Problema: a E20 acumulou coordenação de planos, versões por taxon e consumidores em torno de um catálogo que deveria apenas definir fields.
- O produto precisa de um catálogo factual único e simples: definir fields por camada, publicar nova versão e usar esses fields nos novos usos.
- Resultado: todo novo uso consulta a versão publicada corrente; fields adicionados, editados, inativados ou reativados passam a valer dali em diante, sem efeitos retroativos.
- Novo taxon continua exigindo decisão humana simples sobre a cobertura herdada; IA permanece opcional para sugerir lacunas.
- Usuários: `platform_admin` responsável pela liberação e revisão e consumidores autorizados da E20.2; nenhum novo papel.

## 4.3 Comportamento esperado

- Novo taxon: criar inativo → mostrar herança corrente → humano libera ou pede avaliação → se aceitar mudança, concluir nova versão E20.2 → ativar.
- Avaliação com IA: usar E20.5 válida quando houver; sem ela, Web Search controlada.
- Taxon ativo: continua ativo; revisão posterior é voluntária e não é disparada automaticamente por nova versão do catálogo.
- Catálogo: adicionar, editar, inativar ou reativar field → validar → publicar nova versão; não há revisão individual obrigatória de todos os taxons afetados.
- Consumidor: em cada novo uso, ler a versão corrente aplicável, coletar e validar seus valores e preservar seu próprio resultado; a E20 não atualiza usos anteriores.

## 4.4 Limites, riscos e escopo negativo

- Não criar, publicar ou inativar field por decisão exclusiva da IA.
- Não criar armazenamento, snapshot, sessão, migração ou sincronização para consumidores neste recorte.
- Não implementar consumidor greenfield nem reativar a E20.7.
- Não duplicar configuração, telemetria ou custos da E21.
- Não apagar versões, dados, decisões ou pesquisas históricas.
- Não tornar Web Search obrigatória para a liberação humana do taxon.
- Não usar plano comercial, versão corrente por taxon, fork de catálogo ou classificação de transição por taxon como condição para publicar a E20.2. Os cinco `value_scope` permanecem fechados em `account`, `business`, `offer`, `campaign` e `landing_page`; `Integrations` não entra como sexta categoria.
- Riscos restantes: alterar field ancestral com alcance excessivo, mudar significado sem nova decisão e tratar recomendação da IA como decisão.

## 4.5 Posição planejada no roadmap

- Caso macro 20: revisar título, objetivo e status para representar catálogo factual, conhecimento opcional e auditoria por taxon.
- 20.2: preservar autoridade, herança, versionamento e escopos factuais; retirar política comercial e coordenação de versão por taxon.
- 20.5: reposicionar como pesquisa opcional por taxon, inclusive seleção dormente antes da liberação.
- 20.6: substituir o contrato vigente por `Liberação e revisão factual de taxons`, sem funcionar como gate de versão para taxons já ativos.
- 20.7: preservar capacidade sem consumidor e ajustar somente o estado documental necessário.
- 12.5 e 12.6: reorganizar as superfícies administrativas com foco em UX humana.

## 4.6 Fases da E20.6 — para o novo Plano Base

- 20.6.3 — Liberação de novo taxon: taxon nasce inativo, mostra a herança corrente e pode ser liberado por decisão humana sem IA.
- 20.6.4 — Apoio opcional: IA pode sugerir lacunas; candidato aceito segue o lifecycle E20.2 e só então o novo taxon pode ser ativado.
- 20.6.5 — Provider e fontes: workload preservado, fonte E20.5 preferencial, Web Search fallback ou focal e output estruturado.
- 20.6.6 — Revisão voluntária de taxon ativo: investigar ou sugerir mudanças sem invalidar o taxon e sem criar gate por versão.
- 20.6.7 — Experiência administrativa: página única no Admin Dashboard, simples, responsiva e acessível, com visão por Universal → Segmento → Nicho → Ultranicho quando aplicável, fields herdados/próprios claramente identificados e detalhes técnicos progressivos.

## 4.7 Decisão de automação

- Automação com IA em fluxo controlado no Runtime do LP Factory por Responses API.
- Preservar `taxon_input_catalog_sufficiency_evaluation`.
- A fonte E20.5 válida é preferencial; Web Search é fallback ou pesquisa focal humana.
- Limites: duas chamadas no fallback, uma na pesquisa focal, contexto `medium`, timeout de 45 segundos, `store:false` e zero retry automático.
- Structured Output estrito e fontes externas preservadas.
- IA consultiva; decisões permanecem humanas e gates permanecem determinísticos.
- Sem Agents SDK ou nova infraestrutura.

## 4.8 Critérios funcionais de aceite

- Nenhum novo taxon entra em uso sem decisão humana explícita.
- A cobertura herdada corrente pode ser aprovada sem chamada OpenAI, pesquisa, justificativa textual ou divisão por plano comercial.
- Todo novo uso recebe a versão publicada corrente e os fields aplicáveis ao taxon; não existe fork de versão por taxon.
- Publicar nova versão não invalida, altera ou reabre automaticamente taxons, contas, formulários ou landing pages existentes.
- A E20.5 permanece opcional; quando a IA for solicitada, fonte válida é preferencial e Web Search controlada pode ser usada como fallback.
- A IA permanece consultiva; seus resultados são transitórios e não criam estado próprio da E20.6.
- A interface separa claramente recomendação da IA e decisão humana.
- O humano pode aceitar nenhum, alguns ou todos os candidatos e incluir candidato próprio; candidato aceito segue o mesmo lifecycle E20.2, sem publicação automática.
- Candidato autorizado não é tratado como field publicado antes de completar o lifecycle E20.2.
- Novo taxon com mudança de field só pode ser ativado depois de a nova versão E20.2 estar publicada.
- Taxon ativo permanece ativo durante revisão voluntária e não é reaberto automaticamente quando o catálogo muda.
- Fields de qualquer camada podem ser incluídos, alterados, inativados ou reativados pelo mesmo lifecycle E20.2, com histórico preservado. Todo field deve usar um dos cinco escopos factuais fechados: `account`, `business`, `offer`, `campaign` ou `landing_page`; nova categoria não é criada por conveniência.
- Falha da automação não bloqueia o caminho humano sem IA nem altera estado válido.
- A interface principal é uma única página no Admin Dashboard e mostra taxon, hierarquia e cobertura na ordem Universal → Segmento → Nicho → Ultranicho quando aplicável; cada camada distingue fields herdados e próprios, apresenta ações humanas pertinentes e mantém detalhes técnicos em segundo nível, sem planos comerciais, fingerprints, IDs diagnósticos ou seletor manual de versão.

## 4.9 Evidências esperadas

- Casos automatizados para novo taxon sobre catálogo factual plan-neutral, liberação sem IA e uso da versão publicada corrente.
- Casos automatizados para IA opcional, E20.5 válida, fallback Web Search e falha sem alteração de estado válido.
- Casos de regressão comprovando que nova versão do catálogo não reabre taxon ativo nem altera usos anteriores.
- Casos de evolução E20.2 para adicionar, editar, inativar e reativar fields, com identidade e histórico preservados.
- QA hospedado em desktop e mobile deve validar a página única, a leitura clara das camadas Universal → Segmento → Nicho → Ultranicho quando aplicável, a distinção entre fields herdados e próprios, a ausência de overflow e a separação entre recomendação da IA e decisão humana.
- Observabilidade, configuração e custos do workload permanecem sob a E21; este Debate não cria evidência paralela.

## 4.10 Supervisão

- Supervisão: Autônomo.
- Execução: Complexa.
- O novo ciclo será iniciado por um novo Estrategista Autônomo, porque a instância anterior acumulou contexto excessivo; isso não altera o modo de supervisão nem a autoridade da V1.
- O PR #923 foi fechado como histórico `SUPERSEDED` e pode ser consultado somente para entender tentativas, bugs e mecanismos anteriores; não é baseline, fonte de autoridade nem branch de continuidade.
- O PR #933 permanece mergeado e integra o estado real da `main`; a nova execução parte da `main` vigente e não faz revert amplo por conveniência.
- A execução deverá derivar nova V2 sobre esta V1, em nova branch e novo PR. Alterações locais da tentativa suspensa só podem ser reaproveitadas se forem novamente justificadas pela nova V2.
- Exceção específica ao handoff curto: por troca de instância Autônoma, o handoff pode citar o PR #923 fechado como referência histórica consultável e o PR #933 como implementação já incorporada à `main`, sem transportar briefing técnico adicional.

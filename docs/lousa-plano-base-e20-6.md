# Plano-base V1 — E20.6 Auditoria, liberação e revisão factual de taxons

## 1. Estado e fonte canônica

- Estado: V1 funcional aprovada em 11/09/2026; supervisão Autônoma autorizada.
- Classificação: Complexa.
- Plano único do Debate 12; não cria E20.8 ou E20.9.
- Fonte canônica: `Debate 12 — Evolução da revisão factual e UX administrativa da E20 — LP Factory 10`, seção `4.1 V1 funcional aprovada — E20.6 Auditoria, liberação e revisão factual de taxons`.
- Documento de origem: `https://docs.google.com/document/d/1XxMtfz_W0pTEWKiwQ00JIzrjQMC64fIAT40bIJpGZ5w`.
- Revisão lida na materialização: `ANLCKQn806i6D9Y2sv4h5iOwxGil0qnsfOi7-Wc0ppTG_tZS2cRSdUBaRE_6qLEk_CNnBgwwKufBKoZXO8votdu5ZTCE4PI3aP240qJVvl0`.
- Path canônico: `docs/lousa-plano-base-e20-6.md`.

## 2. Problema e resultado funcional

- Problema: o contrato vigente acopla pesquisa, revisão factual e preparação, embora a pesquisa E20.5 tenha se tornado opcional.
- O produto precisa liberar novos taxons com decisão humana simples, pesquisar somente quando necessário, revisar taxons ativos e evoluir fields em qualquer camada.
- Resultado: todo novo taxon é comparado à cobertura herdada e pode ser liberado sem IA ou passar por avaliação controlada.
- O humano decide candidatos e escopo; alterações completam o lifecycle E20.2 antes da ativação; taxons ativos mantêm a última versão válida durante revisão.
- Usuários: `platform_admin` responsável pela liberação e revisão e consumidores autorizados da E20.2; nenhum novo papel.

## 3. Comportamento esperado

- Novo taxon: criar indisponível → resolver herança → humano libera sem IA ou solicita avaliação → decide candidatos → ativar sem mudança ou após publicação validada.
- Avaliação completa: usar fonte E20.5 válida; sem ela, usar Web Search controlada.
- Pesquisa focal: usar Web Search quando solicitada, mantendo a fonte E20.5 como contexto complementar.
- Taxon ativo: abrir revisão → preservar última versão → incluir candidato, avaliar ou pesquisar → encerrar sem mudança ou publicar nova versão.
- Catálogo: incluir, alterar ou inativar fields → mostrar impacto → obter decisão humana → publicar versão imutável → validar transições.

## 4. Limites, riscos e escopo negativo

- Não criar, publicar ou inativar field por decisão exclusiva da IA.
- Não integrar automaticamente Base, Oferta concreta ou tarefa real.
- Não implementar consumidor greenfield nem reativar a E20.7.
- Não duplicar configuração, telemetria ou custos da E21.
- Não apagar versões, dados, decisões ou pesquisas históricas.
- Não tornar Web Search obrigatória para a liberação humana do taxon.
- Riscos: ativação precoce, escopo ancestral excessivo, perda da revisão válida, alteração retroativa e recomendação da IA tratada como decisão.

## 5. Posição planejada no roadmap

- Caso macro 20: revisar título, objetivo e status para representar catálogo factual, conhecimento opcional e auditoria por taxon.
- 20.2: preservar autoridade e herança; reconciliar versão revisada, lifecycle e evolução de fields.
- 20.5: reposicionar como pesquisa opcional por taxon, inclusive seleção dormente antes da liberação.
- 20.6: substituir o contrato vigente por `Auditoria, liberação e revisão factual de taxons`.
- 20.7: preservar capacidade sem consumidor e ajustar somente o estado documental necessário.
- 12.5 e 12.6: reorganizar as superfícies administrativas para refletir o novo contrato.

## 6. Fases planejadas da E20.6

- 20.6.3 — Liberação determinística e estado de revisão: taxon novo indisponível, cobertura herdada, liberação sem IA e preservação da última revisão válida.
- 20.6.4 — Decisão humana e lifecycle E20.2: candidatos, escolha de camada, impacto, autorização única e ativação após publicação.
- 20.6.5 — Provider e fontes: workload preservado, fonte E20.5 preferencial, Web Search fallback ou focal e output estruturado.
- 20.6.6 — Evolução e transições: inclusão, alteração e inativação de fields, histórico imutável e impacto proporcional.
- 20.6.7 — Experiência administrativa: fluxos nas superfícies E12.5/E12.6, responsividade, acessibilidade e detalhes progressivos.

## 7. Decisão de automação

- Automação com IA em fluxo controlado no Runtime do LP Factory por Responses API.
- Preservar `taxon_input_catalog_sufficiency_evaluation`.
- A fonte E20.5 válida é preferencial; Web Search é fallback ou pesquisa focal humana.
- Limites: duas chamadas no fallback, uma na pesquisa focal, contexto `medium`, timeout de 45 segundos, `store:false` e zero retry automático.
- Structured Output estrito e fontes externas preservadas.
- IA consultiva; decisões permanecem humanas e gates permanecem determinísticos.
- Sem Agents SDK ou nova infraestrutura.

## 8. Critérios funcionais de aceite

- Nenhum novo taxon entra em uso sem decisão humana explícita.
- A cobertura herdada pode ser aprovada sem chamada OpenAI ou justificativa textual.
- A avaliação administrativa examina taxon inativo sem torná-lo operacional.
- A pesquisa E20.5 pode permanecer selecionada e dormente antes da liberação.
- A seleção de fonte distingue E20.5 válida, ausência legítima, pesquisa inválida, falha de leitura, fallback e pesquisa focal.
- A avaliação devolve cobertura, refinamento, possíveis gaps ou inconclusão em output validado.
- A interface separa claramente recomendação da IA e decisão humana.
- O humano pode aceitar nenhum, alguns ou todos os candidatos e incluir candidato próprio.
- Candidato autorizado não é tratado como field publicado antes de completar o lifecycle E20.2.
- Uma autorização humana permite ativação somente depois da publicação e revalidação determinística.
- Taxon ativo permanece ativo e conserva sua última versão válida durante revisão voluntária.
- Fields de qualquer camada podem ser incluídos, alterados ou inativados com impacto proporcional e histórico preservado.
- Falha da automação não confirma cobertura, não apaga estado válido e não impede o caminho humano sem IA.
- A interface distingue cobertura, revisão e pesquisa opcional e funciona em desktop, mobile, teclado e leitores de tela.

## 9. Evidências esperadas

- Casos automatizados para liberação sem IA, avaliação com fonte E20.5, fallback Web Search, pesquisa focal, falhas, contexto stale e output inválido.
- Casos automatizados para seleção de candidatos, candidato próprio, escopo por camada, publicação antes da ativação e falha de ativação.
- Casos de regressão comprovando que revisão de taxon ativo preserva a última versão válida.
- Casos de evolução E20.2 para inclusão, alteração, inativação, impacto e preservação histórica.
- QA hospedado das jornadas em desktop e mobile, incluindo teclado, foco, mensagens, ausência de overflow e separação entre recomendação e decisão.
- Evidência de observabilidade com workload, ambiente, configuração, fonte, resultado, falha, latência, usage e contagens de Web Search e fontes, sem payload factual ou PII.

## 10. Supervisão

- Supervisão: Autônomo.

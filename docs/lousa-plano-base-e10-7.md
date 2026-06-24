23/06/2026 — Lousa base flexível E10.7
docs/lousa-plano-base-e10-7.md
Fontes: chat, PR #435, docs/roadmap.md, docs/base-tecnica.md, docs/schema.md, docs/platform-config.md, docs/automations.md

1. Objetivo da lousa
   docs/lousa-plano-base-e10-7.md

* Manter o plano base vivo da E10.7 sem inflar o roadmap.
* Registrar decisões, invariantes, fases, status, ajustes e limites do caso.
* Servir como fonte obrigatória antes de briefing, implementação, review e merge.
* Roadmap e docs oficiais só são atualizados após fase implementada e mergeada.
* Não substituir docs oficiais; orientar execução e evitar drift.

2. Status geral da E10.7
   docs/lousa-plano-base-e10-7.md

* Fases 1 a 4 implementadas.
* Fase 4 mergeada pela PR #435.
* /a/[account] já consome artifact published válido.
* Fallback generic-v1 preservado.
* Tracking comercial preservado.
* Draft e archived fora do consumo público.
* Validação de render model antes de ready implementada.
* Relatório da Fase 4 enviado ao Gestor de Docs.
* ABC documental da Fase 4 pendente de confirmação final.
* Fase 5 pendente.

3. Caso de uso
   docs/lousa-plano-base-e10-7.md

* E10.7 — Páginas comerciais personalizadas por taxon.
* Gerar, revisar, publicar e consumir páginas comerciais por taxon a partir de pesquisa estruturada.
* Validar primeiro com taxon piloto e depois com taxons elegíveis.
* Evitar regra hardcoded do taxon piloto.
* Permitir que qualquer taxon elegível apareça para o operador gerar draft quando desejar.

4. Definição central

4.1 Template de canal
docs/lousa-plano-base-e10-7.md

* É universal por canal.
* O canal atual é commercial_activation.
* Define tipo de entrega, contrato geral, família, renderer compatível, validações e capacidades aceitas.
* Não é exclusivo de um taxon.
* Não deve, sozinho, definir estratégia fixa de seções para todos os nichos.
* Status: definido no E18 e usado pela E10.7.

4.2 Composição técnica
docs/lousa-plano-base-e10-7.md

* É o arranjo técnico resolvido para renderizar uma entrega.
* Pode ser universal, taxon-scoped ou materialização técnica conforme schema atual.
* No schema atual, content_template_compositions ainda possui taxon_id obrigatório.
* Não tratar essa amarra técnica como decisão estratégica de produto.
* Não duplicar composição por taxon apenas por cópia manual sem necessidade operacional clara.
* Status: piloto usa composição vinculada ao taxon; Fase 5 deve reduzir dependência operacional do piloto sem migration prematura.

4.3 Estrutura estratégica de seções
docs/lousa-plano-base-e10-7.md

* Define quais seções entram, em que ordem e com qual função.
* Pode variar por canal, segmento, nicho ou taxon.
* Para LPs, deve ser orientada por LP Sections ou bloco estrutural equivalente.
* Para commercial_activation, pode existir composição mínima inicial.
* A composição mínima inicial não deve virar regra universal rígida para todos os canais e nichos.
* Status: estrutura mínima do canal comercial existe; uso flexível por taxon precisa ser validado na Fase 5.

4.4 Taxon
docs/lousa-plano-base-e10-7.md

* Define pesquisa, conteúdo, página gerada, artifact e consumo final.
* Taxon não deve exigir novo template de canal.
* Taxon elegível deve aparecer na lista mesmo sem draft.
* O operador decide se quer gerar draft para o taxon elegível.
* Status: piloto validado; Corretor Imóveis tem pesquisa completa e deve ser candidato na Fase 5.

4.5 Artifact
docs/lousa-plano-base-e10-7.md

* É sempre por taxon.
* Draft, published e archived são por taxon.
* content_json é específico do taxon.
* Published só é consumido se validar o contrato do renderer.
* Status: implementado para piloto; validação de published antes de consumo implementada na Fase 4.

5. Critérios de elegibilidade

5.1 Regra visível para o operador
docs/lousa-plano-base-e10-7.md

* Taxon ativo.
* business_buyer active v1 com 4 blocos.
* end_customer active v1 com 4 blocos.
* Itens estruturados suficientes.
* Sem exigir novo template por taxon.
* Sem exigir composição manual por taxon.
* Sem gerar draft automaticamente.

5.2 Blocos exigidos
docs/lousa-plano-base-e10-7.md

* strategic_core.
* lp_overview.
* lp_sections.
* seo.

5.3 Responsabilidade interna do sistema
docs/lousa-plano-base-e10-7.md

* Template de canal commercial_activation deve estar disponível.
* Renderer deve validar o contrato da página.
* Geração deve conseguir usar a infraestrutura técnica existente.
* Composição técnica não é etapa do operador.
* Composição técnica não deve virar critério manual de elegibilidade.
* Se o sistema não conseguir gerar para taxon elegível por falta de composição técnica, isso é ajuste técnico interno da E10.7.

5.4 Status
docs/lousa-plano-base-e10-7.md

* Critério de pesquisa validado no piloto.
* Critério de pesquisa validado em Corretor Imóveis.
* Listagem flexível por elegibilidade ainda pendente.
* Resolver/estrutura ainda precisa evitar dependência indevida do taxon piloto.
* A lista deve tratar taxon elegível por pesquisa como elegível para o operador.

6. Estados operacionais da lista admin

6.1 Publicado
docs/lousa-plano-base-e10-7.md

* Taxon tem artifact published válido.
* Pode ser consumido em /a/[account].
* Pode ser visualizado no admin.
* Pode receber nova geração/regeneração se o operador decidir.

6.2 Em revisão
docs/lousa-plano-base-e10-7.md

* Taxon tem draft criado.
* Ainda não foi publicado.
* Pode ser visualizado, regenerado ou publicado.

6.3 Elegível para gerar
docs/lousa-plano-base-e10-7.md

* Taxon tem pesquisa estruturada completa.
* Ainda não precisa ter draft.
* Ainda não precisa ter published.
* Aparece na lista para o operador iniciar geração quando quiser.
* A listagem não gera draft automaticamente.

6.4 Incompleto
docs/lousa-plano-base-e10-7.md

* Taxon não aparece na lista principal do MVP.
* Diagnóstico de incompletos fica fora do escopo inicial, salvo pedido explícito.

7. Runtime público

7.1 /a/[account]
docs/lousa-plano-base-e10-7.md

* Não usa OpenAI.
* Não usa Responses API.
* Não usa OPENAI_API_KEY.
* Não usa OPENAI_COMMERCIAL_ACTIVATION_MODEL.
* Não importa draft-generation.
* Não usa Agents SDK.
* Não usa jobs, filas ou automações.
* Consome apenas artifact published válido.
* Nunca consome draft.
* Nunca consome archived.
* Se houver erro, cai em generic-v1.
* Se published for inválido, cai em generic-v1.
* Se não houver bundle ready, cai em generic-v1.
* Preserva NicheResolutionCard quando aplicável.
* Preserva tracking comercial existente.
* Status: implementado na Fase 4 e revisado na PR #435.

8. Tracking comercial
   docs/lousa-plano-base-e10-7.md

* Eventos: commercial_page_view, commercial_primary_cta_click, commercial_plan_cta_click.
* Eventos vinculados ao account_id.
* Sem PII.
* Sem content_json.
* Sem payload de pesquisa.
* Falha de tracking não quebra página pública.
* Status: implementado/preservado na Fase 4.

9. Escopo negativo permanente
   docs/lousa-plano-base-e10-7.md

* Não fazer LP Builder.
* Não fazer editor visual.
* Não fazer liberação de LPs.
* Não fazer continuidade de contas.
* Não fazer bloqueio de ativação.
* Não criar novo produto.
* Não criar nova camada de automação.
* Não usar Agents SDK.
* Não usar Sandbox Agents.
* Não criar filas.
* Não criar jobs.
* Não usar IA em runtime público.
* Não criar migration sem blocker real.
* Não criar tabela sem decisão explícita.
* Não criar RPC sem decisão explícita.
* Não criar grant sem decisão explícita.
* Não criar policy sem decisão explícita.
* Não fazer reestruturação ampla de taxonomia.
* Não criar versões independentes por bloco.
* Não gerar draft automaticamente sem ação do operador.
* Não duplicar template de canal por taxon.

10. Banco e schema
    docs/lousa-plano-base-e10-7.md

* Não alterar schema sem blocker real.
* Se fase exigir schema, migration, policy, grant, RPC ou tabela, Executor deve parar e devolver ao Estrategista.
* Supabase pode ser usado em leitura server-side e tracking existente.
* Mutação de banco só por fluxo aprovado da aplicação ou migration explicitamente aprovada.
* Schema atual ainda possui composição vinculada a taxon_id.
* Fase 5 deve tentar resolver por código/contrato atual antes de propor migration.
* Status: Fase 4 não alterou schema.

11. Fases da E10.7

11.1 Fase 1 — Base técnica
docs/lousa-plano-base-e10-7.md

* Status implementação: implementada.
* Status documentação: registrada nas fontes do projeto.
* Objetivo: preparar base de templates, composições, artifacts e contratos mínimos.
* Resultado: estrutura inicial validada com taxon piloto.

11.2 Fase 2 — Geração administrativa de draft
docs/lousa-plano-base-e10-7.md

* Status implementação: implementada.
* Status documentação: registrada em relatórios/docs do caso.
* Objetivo: gerar draft commercial_activation com IA apenas no admin/server-side.
* Resultado: draft persistido por taxon no piloto.

11.3 Fase 3 — Operação administrativa mínima
docs/lousa-plano-base-e10-7.md

* Status implementação: implementada.
* Status documentação: relatório anterior gerado.
* Objetivo: gerar, regenerar, visualizar e publicar.
* Resultado: publicação arquiva published anterior; draft/archived fora do consumo público.

11.4 Fase 4 — Consumo em /a/[account]
docs/lousa-plano-base-e10-7.md

* Status implementação: implementada e mergeada pela PR #435.
* Status documentação: relatório enviado ao Gestor de Docs; ABC final pendente de confirmação.
* Implementado: published válido em /a/[account].
* Implementado: fallback generic-v1.
* Implementado: NicheResolutionCard preservado.
* Implementado: tracking preservado.
* Implementado: validação de render model antes de ready.
* Implementado: sem IA em runtime público.

11.5 Fase 5 — Lista flexível de taxons elegíveis e ajuste interno do canal comercial
docs/lousa-plano-base-e10-7.md

* Status implementação: pendente.
* Status documentação: esta lousa define a base do briefing.
* Objetivo: listar taxons elegíveis por pesquisa estruturada completa.
* Objetivo: permitir que qualquer taxon elegível apareça para geração de draft quando o operador quiser.
* Objetivo: não gerar draft automaticamente durante a listagem.
* Objetivo: resolver internamente a dependência indevida de composição do piloto.
* Objetivo: separar template de canal, composição técnica, estrutura de seções e artifact.
* Objetivo: validar pelo menos dois estados reais: taxon publicado e taxon elegível sem página gerada.
* Não é objetivo: criar procedimento manual para tornar taxon elegível.
* Não é objetivo: gerar draft automaticamente para segundo taxon.
* Não é objetivo: publicar automaticamente segundo taxon.
* Não é objetivo: limitar solução ao taxon Corretor Imóveis.
* Não é objetivo: duplicar template por taxon.
* Não é objetivo: exigir composição manual por taxon.
* Não é objetivo: criar migration sem blocker real.

12. E18 e papéis dos templates

12.1 E18
docs/lousa-plano-base-e10-7.md

* E18 criou/organiza os templates do canal.
* commercial_activation é o canal/família usado pela E10.7.
* O template de página commercial_activation_page define a entrega de página comercial.
* Os templates de section definem módulos disponíveis do canal.

12.2 Papel do template
docs/lousa-plano-base-e10-7.md

* Define canal, contrato e capacidades.
* Não define sozinho a estratégia de conteúdo do taxon.
* Não deve ser duplicado para cada taxon.

12.3 Papel da composição técnica
docs/lousa-plano-base-e10-7.md

* Resolve arranjo técnico de módulos.
* Pode estar materializada com taxon_id no schema atual.
* Não deve ser confundida com o template universal do canal.
* Pode precisar de resolver canônico ou fallback técnico na Fase 5.

12.4 Papel da estrutura de seções
docs/lousa-plano-base-e10-7.md

* Define estratégia de seções por canal/nicho/taxon.
* Para LPs, deve vir de LP Sections ou bloco estrutural equivalente.
* Para commercial_activation, pode usar composição mínima inicial.
* Pode evoluir sem transformar template de canal em estrutura rígida para todos os casos.

13. Taxons conhecidos

13.1 Taxon piloto
docs/lousa-plano-base-e10-7.md
Corretor de imóveis de médio padrão
corretor-de-imoveis-de-medio-padrao

* Pesquisa completa.
* Draft criado.
* Published v3 validado.
* Archived v1.
* Draft v2.
* Consumo em /a/[account] implementado.
* Usado para validar fases 1 a 4.

13.2 Taxon candidato elegível por pesquisa
docs/lousa-plano-base-e10-7.md
Corretor Imóveis
corretor-imoveis

* business_buyer completo.
* end_customer completo.
* Ainda sem página comercial gerada.
* Deve aparecer como elegível após ajuste da Fase 5.
* Não deve exigir novo template de canal.
* Draft só deve ser gerado se operador acionar geração.

14. Ajuste identificado após Fase 4
    docs/lousa-plano-base-e10-7.md

* Decisão estratégica: template universal por canal comercial.
* Implementação atual: composição técnica ainda resolvida por taxon_id.
* Risco: confundir composição técnica com template universal.
* Risco: transformar amarra técnica em etapa operacional do usuário.
* Risco: criar burocracia para cada taxon novo.
* Risco: forçar migration prematura.
* Risco: criar cópia manual por taxon sem necessidade operacional clara.
* Decisão: elegibilidade é definida pela pesquisa estruturada completa.
* Decisão: composição/template/renderer são responsabilidade interna do sistema.
* Decisão: Fase 5 deve corrigir a dependência do piloto sem criar novo procedimento para o operador.
* Decisão: geração de draft deve ser ação do operador.
* Decisão: não criar migration se houver solução simples com contrato atual.

15. Regra de briefing
    docs/lousa-plano-base-e10-7.md

* Citar esta lousa.
* Declarar fase alvo.
* Declarar escopo positivo.
* Declarar escopo negativo.
* Declarar docs de referência.
* Declarar status atual implementado/documentado.
* Declarar critérios de parada.
* Declarar validações obrigatórias.
* Declarar que draft só é gerado por ação do operador.
* Declarar separação entre template de canal, composição técnica, estrutura de seções e artifact.

16. Regra de review
    docs/lousa-plano-base-e10-7.md

* Comparar implementação com esta lousa.
* Verificar se decisões fixas foram preservadas.
* Verificar se não houve expansão indevida.
* Verificar se não houve IA em runtime público.
* Verificar se draft/archived não são consumidos.
* Verificar fallback generic-v1.
* Verificar se o caso não ficou hardcoded no piloto.
* Verificar se taxons elegíveis aparecem sem novo template por taxon.
* Verificar se taxons elegíveis aparecem sem composição manual por taxon.
* Verificar se listagem não gera draft automaticamente.
* Verificar se composição técnica não foi tratada como decisão estratégica universal sem cuidado com schema atual.
* Verificar se eventual falha técnica de composição não foi transformada em tarefa do operador.

17. Regra de atualização documental
    docs/lousa-plano-base-e10-7.md

* Após fase mergeada, gerar relatório de encerramento.
* Enviar relatório ao Gestor de Docs.
* Aplicar prompt-abc.
* Atualizar roadmap e docs oficiais apenas quando necessário.
* Atualizar esta lousa quando houver decisão operacional do caso.
* Não transformar esta lousa em relatório histórico longo.

23/06/2026 — Lousa base flexível E10.7
docs/lousa-plano-base-e10-7.md
Fontes: chat, PR #435, docs/roadmap.md, docs/base-tecnica.md, docs/schema.md, docs/platform-config.md, docs/automations.md

1. Objetivo

* Manter o plano base vivo da E10.7 sem inflar o roadmap.
* Registrar decisões, invariantes, status, fases e ajustes do caso.
* Servir como fonte obrigatória antes de briefing, implementação, review e merge.
* Roadmap e docs oficiais só são atualizados após fase implementada e mergeada.
* Não substituir docs oficiais nem virar relatório histórico longo.

2. Status atual

* Fases 1 a 4 implementadas.
* Fase 4 mergeada pela PR #435.
* /a/[account] consome artifact published válido.
* Fallback generic-v1 preservado.
* Tracking comercial preservado.
* Draft e archived fora do consumo público.
* Validação de render model antes de ready implementada.
* Relatório da Fase 4 enviado ao Gestor de Docs.
* ABC documental da Fase 4 pendente de confirmação final.
* Fase 5 pendente de briefing.

3. Caso de uso

E10.7 — Páginas comerciais personalizadas por taxon

* Gerar, revisar, publicar e consumir páginas comerciais por taxon a partir de pesquisa estruturada.
* Validar primeiro com taxon piloto e depois com taxons elegíveis.
* Evitar regra hardcoded do taxon piloto.
* Permitir que qualquer taxon elegível apareça para o operador gerar draft quando desejar.

4. Papéis conceituais

4.1 Template de canal

* É universal por canal.
* O canal atual é commercial_activation.
* Define tipo de entrega, contrato geral, família, renderer compatível, validações e capacidades aceitas.
* Não é exclusivo de um taxon.
* Não deve ser duplicado por taxon.
* Não define sozinho a estratégia fixa de seções para todos os nichos.

4.2 Composição técnica

* É o arranjo técnico resolvido para renderizar uma entrega.
* Pode estar materializada com taxon_id no schema atual.
* Não deve ser confundida com o template universal do canal.
* Não deve virar tarefa do operador.
* Não deve virar critério manual de elegibilidade.
* Se o sistema não conseguir gerar para taxon elegível por falta de composição técnica, isso é ajuste interno da E10.7.

4.3 Estrutura estratégica de seções

* Define quais seções entram, em que ordem e com qual função.
* Pode variar por canal, segmento, nicho ou taxon.
* Para LPs, deve ser orientada por LP Sections ou bloco estrutural equivalente.
* Para commercial_activation, pode usar composição mínima inicial.
* A composição mínima inicial não deve virar regra universal rígida para todos os canais e nichos.

4.4 Taxon

* Define pesquisa, conteúdo, página gerada, artifact e consumo final.
* Taxon não exige novo template de canal.
* Taxon elegível aparece na lista mesmo sem draft.
* O operador decide se quer gerar draft para o taxon elegível.

4.5 Artifact

* É sempre por taxon.
* Draft, published e archived são por taxon.
* content_json é específico do taxon.
* Published só é consumido se validar o contrato do renderer.

5. Elegibilidade

Taxon aparece como elegível para geração quando possui:

* taxon ativo;
* business_buyer active v1 com 4 blocos;
* end_customer active v1 com 4 blocos;
* itens estruturados suficientes.

Blocos exigidos:

* strategic_core;
* lp_overview;
* lp_sections;
* seo.

Regras:

* não exigir novo template por taxon;
* não exigir composição manual por taxon;
* não gerar draft automaticamente;
* template, composição técnica, renderer e geração são responsabilidade interna do sistema.

Status:

* critério validado no piloto;
* critério validado em Corretor Imóveis;
* listagem flexível por elegibilidade ainda pendente;
* resolver/estrutura ainda precisa evitar dependência indevida do taxon piloto.

6. Estados da lista admin

6.1 Publicado

* Taxon tem artifact published válido.
* Pode ser consumido em /a/[account].
* Pode ser visualizado no admin.
* Pode receber nova geração/regeneração se o operador decidir.

6.2 Em revisão

* Taxon tem draft criado.
* Ainda não foi publicado.
* Pode ser visualizado, regenerado ou publicado.

6.3 Elegível para gerar

* Taxon tem pesquisa estruturada completa.
* Ainda não precisa ter draft.
* Ainda não precisa ter published.
* Aparece na lista para o operador iniciar geração quando quiser.
* A listagem não gera draft automaticamente.

6.4 Incompleto

* Não aparece na lista principal do MVP.
* Diagnóstico de incompletos fica fora do escopo inicial, salvo pedido explícito.

7. Runtime público

/a/[account]

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

Status:
implementado na Fase 4 e revisado na PR #435.

8. Tracking comercial

Eventos:

* commercial_page_view;
* commercial_primary_cta_click;
* commercial_plan_cta_click.

Regras:

* vinculados ao account_id;
* sem PII;
* sem content_json;
* sem payload de pesquisa;
* falha de tracking não quebra página pública.

Status:
implementado/preservado na Fase 4.

9. Escopo negativo permanente

Não fazer dentro da E10.7 sem decisão explícita:

* LP Builder;
* editor visual;
* liberação de LPs;
* continuidade de contas;
* bloqueio de ativação;
* novo produto;
* nova camada de automação;
* Agents SDK;
* Sandbox Agents;
* filas;
* jobs;
* IA em runtime público;
* migration sem blocker real;
* nova tabela sem decisão explícita;
* nova RPC sem decisão explícita;
* novo grant sem decisão explícita;
* nova policy sem decisão explícita;
* reestruturação ampla de taxonomia;
* versões independentes por bloco;
* geração automática de draft sem ação do operador;
* duplicação de template de canal por taxon;
* procedimento manual para tornar taxon elegível.

10. Banco e schema

* Não alterar schema sem blocker real.
* Se fase exigir schema, migration, policy, grant, RPC ou tabela, Executor deve parar e devolver ao Estrategista.
* Supabase pode ser usado em leitura server-side e tracking existente.
* Mutação de banco só por fluxo aprovado da aplicação ou migration explicitamente aprovada.
* Schema atual ainda possui composição vinculada a taxon_id.
* Fase 5 deve tentar resolver por código/contrato atual antes de propor migration.

Status:
Fase 4 não alterou schema.

11. Fases

11.1 Fase 1 — Base técnica

* Status implementação: implementada.
* Status documentação: registrada nas fontes do projeto.
* Objetivo: preparar base de templates, composições, artifacts e contratos mínimos.
* Resultado: estrutura inicial validada com taxon piloto.

11.2 Fase 2 — Geração administrativa de draft

* Status implementação: implementada.
* Status documentação: registrada em relatórios/docs do caso.
* Objetivo: gerar draft commercial_activation com IA apenas no admin/server-side.
* Resultado: draft persistido por taxon no piloto.

11.3 Fase 3 — Operação administrativa mínima

* Status implementação: implementada.
* Status documentação: relatório anterior gerado.
* Objetivo: gerar, regenerar, visualizar e publicar.
* Resultado: publicação arquiva published anterior; draft/archived fora do consumo público.

11.4 Fase 4 — Consumo em /a/[account]

* Status implementação: implementada e mergeada pela PR #435.
* Status documentação: relatório enviado ao Gestor de Docs; ABC final pendente de confirmação.
* Implementado: published válido em /a/[account].
* Implementado: fallback generic-v1.
* Implementado: NicheResolutionCard preservado.
* Implementado: tracking preservado.
* Implementado: validação de render model antes de ready.
* Implementado: sem IA em runtime público.

11.5 Fase 5 — Lista flexível de taxons elegíveis e ajuste interno do canal comercial

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

11.5.1 Updates aplicáveis à Fase 5

Objetivo da Fase 5:

* Listar taxons elegíveis por pesquisa estruturada completa.
* Corrigir a dependência indevida do taxon piloto.
* Não criar processo manual.
* Não gerar draft automaticamente.
* Não antecipar migration.
* Usar os updates abaixo apenas como referência técnica, validação ou trava.

supa#36 — Data API / PostgREST 14.1

* Referência técnica para leituras server-side no Supabase usando Data API/PostgREST.
* Aplicar nas leituras server-side que montam a lista de taxons elegíveis.
* Aplicar ao buscar taxons ativos, pesquisas estruturadas completas, artifacts existentes, published/draft quando necessário para estado da lista e composição técnica relacionada ao canal commercial_activation.
* Resolver a listagem no servidor, seguindo os contratos da Base Técnica, sem criar endpoint público novo e sem expor dados sensíveis.

supa#5 — Logs seguros

* Usar para falhas, fallback e diagnóstico técnico sem vazar conteúdo sensível.
* Aplicar em erro de leitura, taxon que deveria ser elegível mas não aparece, falha ao resolver composição técnica, fallback interno ou inconsistência entre pesquisa, artifact e estado exibido.
* Pode logar status técnico, motivo resumido da falha, request/rid quando disponível e identificador técnico permitido de account/taxon.
* Não pode logar content_json, payload completo de pesquisa, texto gerado por IA, dados pessoais ou conteúdo bruto de blocos estruturados.

supa#40 — SQL snippets locais

* Aplicar somente se for necessário validar elegibilidade ou composição fora da UI.
* Exemplos: conferir business_buyer completo, end_customer completo, 4 blocos exigidos, artifact draft/published ou composição técnica prendendo fluxo ao piloto.
* Se houver SQL de validação, versionar em supabase/snippets.
* Não deixar query solta no chat ou no Studio.

supa#58 — GRANT explícito para novos objetos

* Usar como trava de segurança se surgir necessidade de nova tabela, view, função, RPC, grant, policy ou migration.
* Fase 5 deve tentar resolver com schema atual.
* Se surgir mudança de banco, Executor deve parar e devolver ao Estrategista.
* Não aplicar supa#58 como tarefa inicial; usar como trava para impedir mudança de banco sem decisão explícita.

revalidatePath

* Usar somente se houver mutação administrativa que altere o estado exibido na tela.
* Exemplos: gerar draft, regenerar draft, publicar, arquivar ou atualizar estado administrativo que afete a lista.
* Na listagem simples, sem mutação, não aplicar.
* Não usar como arquitetura antecipada.

Recursos que não cabem na Fase 5

* Não usar Responses API.
* Não usar Agents SDK.
* Não usar Sandbox Agents.
* Não usar plugin Supabase como dependência operacional.
* Não usar filas.
* Não usar jobs.
* Não usar automação operacional.
* Não usar IA em runtime público.
* Não usar pgvector.
* Não usar pg_trgm.
* Não usar busca avançada.
* Não criar migration sem blocker real.

Conclusão:

* Aplicar supa#36 nas leituras server-side.
* Aplicar supa#5 nos logs seguros.
* Aplicar supa#40 se houver validação SQL read-only.
* Aplicar supa#58 como trava se surgir mudança de banco.
* Usar revalidatePath somente se houver mutação administrativa.
* Não aplicar agentes, IA em runtime público, filas, jobs ou nova infraestrutura.

12. E18 e papéis dos templates

12.1 E18

* E18 criou/organiza os templates do canal.
* commercial_activation é o canal/família usado pela E10.7.
* O template de página commercial_activation_page define a entrega de página comercial.
* Os templates de section definem módulos disponíveis do canal.

12.2 Template

* Define canal, contrato e capacidades.
* Não define sozinho a estratégia de conteúdo do taxon.
* Não deve ser duplicado para cada taxon.

12.3 Composição técnica

* Resolve arranjo técnico de módulos.
* Pode estar materializada com taxon_id no schema atual.
* Não deve ser confundida com template universal do canal.
* Pode precisar de resolver canônico ou fallback técnico na Fase 5.
* Não é etapa do operador.

12.4 Estrutura de seções

* Define estratégia de seções por canal/nicho/taxon.
* Para LPs, deve vir de LP Sections ou bloco estrutural equivalente.
* Para commercial_activation, pode usar composição mínima inicial.
* Pode evoluir sem transformar template de canal em estrutura rígida para todos os casos.

13. Taxons conhecidos

13.1 Taxon piloto

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

Corretor Imóveis
corretor-imoveis

* business_buyer completo.
* end_customer completo.
* Ainda sem página comercial gerada.
* Deve aparecer como elegível após ajuste da Fase 5.
* Não deve exigir novo template de canal.
* Não deve exigir composição manual por taxon.
* Draft só deve ser gerado se operador acionar geração.

14. Ajuste identificado após Fase 4

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
* Verificar se eventual falha técnica de composição não foi transformada em tarefa do operador.
* Verificar se composição técnica não foi tratada como decisão estratégica universal sem cuidado com schema atual.

17. Regra de atualização documental

* Após fase mergeada, gerar relatório de encerramento.
* Enviar relatório ao Gestor de Docs.
* Aplicar prompt-abc.
* Atualizar roadmap e docs oficiais apenas quando necessário.
* Atualizar esta lousa quando houver decisão operacional do caso.
* Não transformar esta lousa em relatório histórico longo.
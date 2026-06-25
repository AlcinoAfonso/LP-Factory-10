23/06/2026 — Lousa base flexível E10.7
docs/lousa-plano-base-e10-7.md
Fontes: chat, PR #435, PR #440, docs/roadmap.md, docs/base-tecnica.md, docs/schema.md, docs/platform-config.md, docs/automations.md, docs/supa-up.md

1. Objetivo
* Manter o plano vivo da E10.7 sem inflar o roadmap.
* Registrar decisões, invariantes, status, fases e ajustes do caso.
* Servir como fonte obrigatória antes de briefing, implementação, review e merge.
* Roadmap e docs oficiais só são atualizados após fase implementada e mergeada.
* Não substituir docs oficiais nem virar relatório histórico longo.

2. Status atual
* Fases 1 a 5 implementadas.
* Fase 4 mergeada pela PR #435.
* Fase 5 mergeada pela PR #440.
* Fase 5 validada em Production.
* Fluxo mínimo E10.7 validado: elegível → draft → published → consumo público.
* /a/[account] consome artifact published válido.
* Draft e archived fora do consumo público.
* IA fora do runtime público.
* Fallback generic-v1 preservado.
* Tracking comercial preservado.
* Próximo trabalho: Fase 6.

3. Caso de uso
E10.7 — Páginas comerciais personalizadas por taxon
* Gerar, revisar, publicar e consumir páginas comerciais por taxon a partir de pesquisa estruturada.
* Validar primeiro com taxon piloto e depois com taxons elegíveis.
* Evitar regra hardcoded do taxon piloto.
* Permitir que qualquer taxon elegível apareça para o operador gerar draft quando desejar.

4. Papéis e decisões fixas
4.1 Template de canal
* commercial_activation usa template universal por canal.
* Página comercial tem estrutura fixa no MVP.
* IA gera copy dentro da estrutura.
* IA não escolhe seções nem ordem.
* Cores são universais do template comercial no MVP.
* IA não escolhe cores livres.
* Template não é exclusivo de um taxon.
* Template não deve ser duplicado por taxon.

4.2 Estrutura fixa da página comercial
* Hero.
* Benefícios.
* Serviços.
* Planos.
* Diferenciais.
* Como funciona.
* FAQ.
* CTA final.

4.3 Composição técnica
* É arranjo técnico resolvido para renderizar a entrega.
* Pode estar materializada com taxon_id no schema atual.
* Composição física por taxon é materialização técnica do schema atual.
* Composição física por taxon não é composição estratégica.
* Não deve ser confundida com template universal do canal.
* Não deve virar tarefa do operador.
* Operador não prepara composição.

4.4 Taxon e artifact
* Taxon define pesquisa, conteúdo, página gerada, artifact e consumo final.
* Taxon elegível aparece na lista mesmo sem draft.
* Operador decide gerar draft para taxon elegível.
* Artifact é sempre por taxon.
* Draft, published e archived são por taxon.
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
* listagem flexível implementada na Fase 5;
* dependência indevida do taxon piloto removida.

6. Estados da lista admin
6.1 Publicado
* Taxon tem artifact published válido.
* Pode ser consumido em /a/[account].
* Pode receber nova geração/regeneração se operador decidir.
6.2 Em revisão
* Taxon tem draft criado.
* Ainda não foi publicado.
* Pode ser visualizado, regenerado ou publicado.
6.3 Elegível para gerar
* Taxon tem pesquisa estruturada completa.
* Ainda não precisa ter draft.
* Ainda não precisa ter published.
* Aparece para o operador iniciar geração.
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
Status: implementado na Fase 4 e preservado na Fase 5.

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
Status: implementado/preservado desde a Fase 4.

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
* Fase 5 teve blocker real e aprovou RPC/migration mínima.
* Fase 6 não deve alterar schema sem novo blocker.

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
* Status implementação: concluída.
* Status validação: validada em Production.
* PR: #440.
* Resultado: fluxo mínimo validado.
* Confirmou lista de taxons elegíveis por pesquisa estruturada completa.
* Confirmou Corretor Imóveis como caso de validação, não solução pontual.
* Confirmou materialização técnica genérica de composição commercial_activation.
* Confirmou geração de draft por ação do operador.
* Confirmou publicação do draft.
* Confirmou versionamento publicado.
* Confirmou consumo de published em /a/[account].
* Confirmou runtime público sem IA, sem draft e sem archived.

11.5.1 Implementação da Fase 5
* /admin/templates lista taxons elegíveis.
* A lista não cria composição.
* A lista não gera draft.
* Geração exige ação do operador.
* taxonSlug passou a ser obrigatório.
* Removido fallback implícito para taxon piloto.
* Criado ensureCommercialActivationCompositionForTaxon.
* Criada RPC ensure_commercial_activation_composition(p_taxon_id uuid).
* RPC valida taxon ativo e pesquisa completa.
* RPC materializa composição técnica quando necessário.
* RPC retorna composição existente quando já houver.
* RPC não depende de slug, nome do taxon, Corretor Imóveis ou piloto.
* Publicação continua via publish_content_artifact_draft.
* Corrigido isUuid para UUID canônico 8-4-4-12.

11.5.2 Validação em Production
* OPENAI_API_KEY validada em Production and Preview.
* OPENAI_COMMERCIAL_ACTIVATION_MODEL validada em Production and Preview.
* Redeploy Production executado.
* Migration 20260624203000 aplicada.
* RPC ensure_commercial_activation_composition existente no Supabase real.
* service_role pode executar a RPC.
* anon e authenticated não executam.
* Corretor Imóveis: Elegível para gerar → Em revisão → Publicado.
* Corretor de imóveis de médio padrão: nova versão gerada e publicada; published atual v5.
* /a/acc-f855e6ef abriu LP publicada corretamente.
* Fluxo mínimo da E10.7 validado em Production.

11.5.3 Updates aplicados na Fase 5
#Supa36 — Data API / PostgREST 14.1
* Aplicado nas leituras server-side da listagem admin.
* Usado para taxons, pesquisas, compositions e artifacts.
* Mantidas colunas explícitas, ordenação determinística e sem endpoint público novo.
#Supa05 — Logs seguros
* Aplicado em falhas de geração, materialização e leitura admin.
* Não logar content_json, payload completo, texto gerado por IA, PII ou blocos brutos.
* Pendente UX: trocar missing_openai_env por mensagem amigável quando aplicável.
#Supa40 — SQL snippets locais
* Aplicado com snippet read-only.
* Arquivo: supabase/snippets/e10_7_phase_5_eligible_taxons_verify.sql.
* Usado para validar elegibilidade, composição e artifacts.
#Supa58 — GRANT explícito para novos objetos
* Aplicado como trava e checklist de governança.
* Blocker real justificou migration/RPC.
* RPC criada com SECURITY DEFINER.
* EXECUTE apenas para service_role.
* EXECUTE revogado de public, anon e authenticated.
* Sem nova tabela, sem nova view e sem refatoração ampla de schema.

11.6 Fase 6 — Admin comercial enxuto e contrato fixo da página comercial
* Status implementação: planejada.
* Objetivo: transformar /admin/templates em lista limpa.
* Objetivo: criar página operacional específica por taxon.
* Objetivo: mover gerar, regenerar, publicar, preview e histórico para a página específica.
* Objetivo: aplicar loading/disable nos botões no local definitivo.
* Objetivo: consolidar contrato fixo da página commercial_activation.
* Objetivo: registrar edição manual de draft como pendência futura.
* Rota sugerida: app/admin/(protected)/templates/commercial-activation/[taxonSlug].
* Rota equivalente pode ser usada se a estrutura real do Next.js indicar path melhor.
Regras:
* /admin/templates deve ficar apenas como lista limpa.
* Selecionar deve navegar para a página operacional do taxon.
* Lista não deve mostrar preview.
* Lista não deve mostrar histórico.
* Lista não deve publicar.
* Lista não deve materializar composição.
* Lista não deve gerar draft.
* Página do taxon deve conter status, gerar/regenerar, publicar, preview, histórico e diagnóstico técnico mínimo.
* Botão Gerar draft deve usar loading/disable com Gerando...
* Botão Regenerar draft deve usar loading/disable com Regenerando...
* Botão Publicar draft deve usar loading/disable com Publicando...
* Não incluir edição manual de draft nesta fase.
* Não incluir IA assistida para edição.
* Não incluir regeneração baseada em latest published nesta fase.
* Não alterar runtime público.
* Não alterar schema sem novo blocker.

12. Lacuna confirmada — próximos drafts
* Confirmado em 25/06/2026: novo draft não usa a página publicada mais recente como base editorial.
* Geração atual usa taxon ativo, pesquisa estruturada v1, composição técnica e planos.
* Prompt atual não inclui published, content_json anterior, artifact_id publicado ou texto da página publicada.
* artifact_version apenas incrementa versão; não serve como base editorial.
* Diagnóstico: nova versão é gerada a partir das fontes estruturadas atuais.
* Decisão MVP: manter modo atual funcionando.
* Pendência futura: edição manual simples do draft antes de publicar.
* Pendência posterior: regenerar draft usando latest published como referência.
Modos possíveis para futuro:
* Gerar do zero: fontes estruturadas.
* Editar manualmente: humano ajusta draft antes de publicar.
* Regenerar com base: usar latest published como referência editorial.

13. E18 e papéis dos templates
13.1 E18
* E18 criou/organiza os templates do canal.
* commercial_activation é o canal/família usado pela E10.7.
* O template de página commercial_activation_page define a entrega de página comercial.
* Os templates de section definem módulos disponíveis do canal.
13.2 Template
* Define canal, contrato e capacidades.
* Não define sozinho a estratégia de conteúdo do taxon.
* Não deve ser duplicado para cada taxon.
13.3 Composição técnica
* Resolve arranjo técnico de módulos.
* Pode estar materializada com taxon_id no schema atual.
* Não deve ser confundida com template universal do canal.
* Não é etapa do operador.
13.4 Estrutura de seções
* Define contrato fixo da página comercial no MVP.
* Pode evoluir depois sem transformar IA em dona da ordem das seções.

14. Taxons conhecidos
14.1 Taxon piloto
Corretor de imóveis de médio padrão
corretor-de-imoveis-de-medio-padrao
* Pesquisa completa.
* Draft criado.
* Published v3 validado na Fase 4.
* Nova versão gerada e publicada na Fase 5.
* Published atual v5 em Production.
* Consumo em /a/[account] implementado.
* Usado para validar fases 1 a 5.
14.2 Taxon elegível validado
Corretor Imóveis
corretor-imoveis
* business_buyer completo.
* end_customer completo.
* Validado na Fase 5 como elegível sem solução pontual.
* Passou por Elegível para gerar → Em revisão → Publicado.
* Não exigiu novo template de canal.
* Não exigiu composição manual por taxon.
* Draft só foi gerado por ação do operador.

15. Pendências futuras
* Edição manual simples do draft antes de publicar.
* Regeneração usando latest published como referência editorial.
* Mensagem amigável para missing_openai_env.
* IA assistida para edição somente depois.
* Temas visuais avançados somente depois, se necessário.

16. Regra de briefing
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

17. Regra de review
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

18. Regra de atualização documental
* Após fase mergeada, gerar relatório de encerramento.
* Enviar relatório ao Gestor de Docs.
* Aplicar prompt-abc.
* Atualizar roadmap e docs oficiais apenas quando necessário.
* Atualizar esta lousa quando houver decisão operacional do caso.
* Não transformar esta lousa em relatório histórico longo.

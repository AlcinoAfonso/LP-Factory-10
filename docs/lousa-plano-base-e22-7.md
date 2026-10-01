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


## V2 técnica candidata

### Identidade e autoridade

V1 imutável: commit `555e8c481c152d10d8660196aeb2243e3bdd67ff`, blob `1911b4c12930af8e656e31edc948c11bcba9c79c`, texto acima. Base: `d191f0b8b6373666205e02d5c5642ac1ed3fcc7f`; roadmap dessa base: blob `fd4b2f982ee2887edacef2baa4c0d59706d8d859`. Sessão principal única escritora; mesma worktree, branch `codex-app/e22-7-retirada-terminal` e PR #994 até a entrega. Plano conceitual separado: N/A; contrato funcional competente: Debate 14B §4.4.

Todos os detalhamentos abaixo são **derivação técnica da V1**: fecham consumidores e dependências reais exigidos por 4.4.2/4.4.5. Não há modernização tecnológica, alteração da V1, domínio substituto ou capacidade independente nova. A ativação administrativa reutiliza o CRUD existente para preservar a taxonomia após retirar seu gate E20.

### 22.7.1 — Objetivo e status

Retirar integralmente a autoridade executável E20/E10.10; manter E10.3/.5/.9, E10.6/.7, E9, E11, taxonomia, pesquisas compartilhadas e Base. Status inicial: V1 congelada, V2 candidata, implementação ainda não iniciada; dependência E10.11 concluída positivamente pelo recibo D14B §5.5.

### 22.7.2 — Registros do recorte

Identificar por commit os checkpoints e provas das fases canônicas. Inventário de consumidores é requisito desta V1, não uma triagem genérica. Registrar, antes de cada exclusão, imports/exports, rotas/actions, scripts, SQL/RPC, workload e variável, seu destino e consumidor independente quando houver. Pareceres e evidências preservados integralmente na sessão; somente rastreabilidade material necessária será versionada após a primeira avaliação independente.

### 22.7.3 — Auditoria de consumidores e fronteiras preservadas

A auditoria antecede toda remoção. Congelar o inventário do HEAD da V1 e resolver cada dependência a seguir:

- **Remover** onboarding factual: `lib/onboarding/factual/`, `app/a/[account]/factual-actions.ts`, `_components/FactualOnboarding.tsx` e seus ramos no loader/page da conta. Preservar Pending Setup, acesso/membership, entitlement, nicho, comercial e Base.
- **Desacoplar** taxonomia: remover leituras/contratos de cobertura, liberação e seleção de pesquisa E20 em `adminTaxonomyAdapter`, `adminReadOnlyTypes`, `adminReadOnlyAdapter`, actions e página de taxon. Retirar `adminTaxonFactualRelease*`, `AdminTaxonFactualCoverage`, `AdminTaxonInputCatalogEvaluation`, `AdminTaxonResearchSelectionForm` e `evaluationSuggestionHandoff` quando não houver import independente. Preservar identidade, aliases, hierarquia, uso, diagnóstico comercial e CRUD administrativo.
- **Desacoplar** estrutura LP: retirar a visão `entradas`, actions/componente/adapters `AdminFactualFields` e composição factual; preservar `parametros` E18.4, raiz da LP e rota administrativa existentes.
- **Remover** `landing-page/input-catalog/`, `landing-page/taxon-preparation/`, adapters factuais, cadeia taxonômica factual, contexto/provider/gate da avaliação e seleção de pesquisa bruta E20.5, com seus re-exports exclusivos. Provar a busca integral de consumidores antes de excluir cada arquivo.
- **Preservar** `commercial-activation/`, `commercialActivationAdapter`, `adminCommercialActivationTemplatesAdapter`, `taxon_market_research`, `taxon_market_research_items`, `content_artifacts` e `content_artifact_research_sources`: há consumo independente pela E10.7. Não apagar pesquisas ou arquivos brutos por associação ao leitor retirado.
- **Desacoplar** `taxon_input_catalog_sufficiency_evaluation`: retirar da identidade de produto corrente, registry, configuração operacional, prova Admin, actions e provider; conservar identidade, rótulos e filtros de leitura financeira histórica. Preservar nicho, comercial, dois workloads Base, Supabase Inspect e infraestrutura E21.
- **Preservar** migrations históricas, inclusive as duas E10.10 candidatas ainda não aplicadas, com exclusão explícita do apply. Snippets/testes históricos não são contratos operacionais vigentes; identificar sua proveniência e impedir que sejam usados como prova do estado final.
- **Retirar após cutover** somente as sete entradas dos três gates E20 inventariados. Preservar `OPENAI_API_KEY`, `OPENAI_OPERATIONAL_CONFIG_ENABLED`, `E10_11_PASSAGE_ENABLED`, gates Base, scopes e demais variáveis.

Divergência factual suspende somente a exclusão afetada. Nome, idade ou diretório não comprovam exclusividade.

### 22.7.4 — Retirada dos caminhos funcionais

1. **Conta:** para toda conta ativa, ler entitlement antes dos dados comerciais/taxonômicos; erro bloqueia com o estado de indisponibilidade existente da conta, autorização válida encaminha à Base sem taxon oficial e sem depender do gate factual antigo, ausência legítima mantém a decisão comercial/waiting vigente. Retirar todos os ramos de onboarding factual. `E10_11_PASSAGE_ENABLED` continua nos consumidores independentes de Pending Setup e passagem inicial para a Base. Não alterar decisões financeiras, checkout, matching ou conteúdo da Base.
2. **Taxonomia:** remover superfícies/ações E20 e manter as independentes. Na mutação `updateAdminTaxon` e no `AdminTaxonManageForm` existentes, permitir transição administrativa false→true, usando `requirePlatformAdmin`, validação do pai ativo quando aplicável e comparação otimista da identidade/status. Taxons novos continuam com default inativo. Reutilizar checkbox e estilo existentes; nenhuma nova liberação, cobertura ou engine.
3. **Estrutura LP:** preservar parâmetros raiz e sua apresentação; remover a alternativa factual e links órfãos. Atualizar o validador existente para provar o contrato raiz preservado.
4. **Workloads:** retirar o ID factual dos contratos correntes e execução/prova; acrescentá-lo à união histórica já existente em `lib/openai-costs/active-contracts.ts`, ao lado de `landing_page_dynamic_market_research`. Manter dashboard financeiro, custos, revisões e ativações históricos legíveis.
5. **Validação:** retirar de `package.json` somente os scripts dos três domínios exclusivos eliminados (input-catalog, taxon-preparation, factual-onboarding). Ajustar validadores de jornada, workload e Admin para os contratos terminais; preservar os demais, incluindo acesso, comercial, checkout, Pending Setup e Base. Testes novos devem provar regressão/contrato real, não espelhar implementação.

Observabilidade: aplicável pelos sinais existentes de falha de acesso/entitlement/leitura e mutação administrativa; preservar logs sem dados sensíveis e confirmar comportamento fail-closed. Não criar telemetry ou infraestrutura.

### 22.7.5 — Retirada material residual

#### Banco

Nova migration única: `supabase/migrations/20261001030000_e22_7_retire_factual_authority.sql`. Antes de redigi-la/aplicá-la, repetir inspeção read-only do ledger, dependências, ACLs, RLS/policies e unidades mutáveis no projeto autorizado `dpikmjgiteuafsbaubue`. As migrations E10.10 `20260926145500` e `20260926171100` devem permanecer ausentes do ledger.

- Preservar integralmente `taxon_factual_fields`, suas 27 linhas e suporte físico interno; revogar SELECT/INSERT/UPDATE de `service_role` e EXECUTE externo da função `e20_8_factual_field_definition_is_valid`. Manter RLS habilitado sem policies e ausência de permissão externa efetiva para anon/authenticated/ai_readonly. Sem DROP TABLE, CASCADE, cópia, archive ou limpeza de dados.
- Na migration E22.7 forward-only, após prova de ausência de consumidor factual, remover sem CASCADE apenas `taxon_factual_fields_taxon_id_fkey`; preservar integralmente as linhas e valores `taxon_id`, sem SET NULL, CASCADE, limpeza ou alteração de FKs independentes. Revogar grants E20 separadamente e reconciliar `docs/schema.md`. Confirmar por catálogo nome/definição antes do DROP; drift aborta o passo. UUID histórico pode sobreviver à exclusão posterior do taxon, sem resolução em runtime.
- Manter `business_taxons.selected_end_customer_research_version` e valores históricos, revogando apenas UPDATE dessa coluna para `service_role`. Confirmar ausência de UPDATE amplo que neutralize a revogação; preservar UPDATE de name/slug/is_active, SELECT e políticas independentes.
- Retirar somente as duas unidades mutáveis Preview/Production do ID factual em `openai_workload_operational_configurations`, após confirmar ausência de pendência. Estreitar apenas seus CHECKs mutáveis para impedir novos IDs factual/dynamic retirados. Não apagar revisões, ativações, cobertura ou custos históricos; manter seus CHECKs de leitura histórica e todos os workloads independentes.
- Executar integralmente a migration em PostgreSQL 17 isolado, com provas positivas/negativas e rollback. Reutilizar o facilitador SQL existente com um caso E22.7 focal, sem criar automação de produto ou modificar o projeto hospedado antes do merge. Provar parsing, permissões externas negadas, grants taxonômicos preservados, configuração corrente rejeitando IDs retirados, histórico legível e DELETE de fixture de taxon sem consumidor independente apesar de linha factual histórica: linha/definition/taxon_id intactos e FKs independentes ainda operantes.

#### Apply e configuração

Ajustar focalmente o workflow seletivo existente para reconhecer a migration exata E22.7 e seu escopo `e22_7_only`; inventário 62 arquivos, incluindo duas E10.10 sempre excluídas, 59 migrations já aplicadas mais a nova E22.7. Preservar scopes anteriores, exact main SHA, gate fechado por padrão, dry-run comparando exatamente a migration selecionada e bloqueio do apply integral.

Após liberação competente, merge remoto com guarda do head e runtime implantado sem consumidores factuais, executar somente esse apply seletivo no SHA exato do merge. Gate `SUPABASE_APPLY_MIGRATIONS_ENABLED` volta a false; ledger confirma apenas a nova migration e ausência das duas E10.10. Contagem/conteúdo dos dados históricos, constraints, grants e policies são conferidos separadamente; sem mutação remota fora do fluxo aprovado.

Provar ausência dos três gates E20 no runtime corrente Production, no Preview do cutover e no SHA promovido; inventariar e remover somente suas sete entradas Vercel por ambiente e branch scope após o cutover. Preservar os scopes, variáveis independentes e builds históricos. IDs, nomes, ambientes e scopes exatos devem ser registrados antes de cada retirada, sem revelar valores. Scope que sirva runtime atual legitimamente mantido exige prova focal de preservação da capacidade independente; builds imutáveis históricos não exigem reescrita. Fazer redeploy e QA dos runtimes correntes após remoção.

### Aceite e gates de conclusão

- Busca final e inventário demonstram ausência de autoridade factual executável e destino de todos os consumidores, incluindo imports, exports, rotas, actions, scripts, SQL/RPC, workload e gates.
- `npm ci` executado uma vez no lote; `npm run check`, validações focais e `git diff --check` passam. Migration integral aceita e casos SQL positivos/negativos passam em PostgreSQL compatível isolado; dry-run não substitui essa prova.
- QA autenticado de conta/Admin no Preview deste head, desktop e mobile, cobre: acesso/membership e papéis sem autorização administrativa; conta autorizada→Base sem taxon; conta sem autorização→comercial/waiting; Pending Setup; matching e aliases; taxonomia ativável sem E20; parâmetros LP; comercial E10.6/E10.7 e pesquisas independentes; workloads correntes e leitura de custos históricos. Reutilizar identidades/recursos autorizados das fontes competentes, sem publicar credenciais. Testar somente jornadas materialmente afetadas e usar evidências existentes compatíveis para capacidades preservadas.
- Design System vigente rege as superfícies afetadas; Design somente diante de dúvida material ou interação não especificada. Automação de produto: N/A conforme V1 explícita.
- Avaliação independente de plano necessária pelo risco concreto em contrato de entitlement, taxonomia, permissões e dados; revisão de implementação focal cobre esses mesmos riscos, sem recriar gates por classe histórica.
- Reconciliação documental via ABC literal, somente nos documentos/trechos realmente afetados. Planejamento: roadmap recebe apenas posição/fases planejadas quando necessário, sem antecipar execução. Consolidação final: roadmap, schema, base técnica, platform-config, automations e outras fontes efetivamente contraditas pelo delta; SEM ALTERAÇÕES NECESSÁRIAS quando não houver delta competente. Preservar proveniência histórica.
- Manter PR draft enquanto aceite, QA, correção, documento ou review aplicável estiver pendente. Antes do merge, concluir reviews já disparados e revisão automática configurada, sem threads materiais pendentes; supervisão libera somente o head avaliado.
- Conclusão positiva somente após merge, migration seletiva, gates exclusivos retirados, QA pós-merge obrigatório, documentos canônicos coerentes e recibo D14B atualizado, preservando a V1 literal. Pendência mantém o plano aberto; insuficiência de um recurso suspende apenas o ponto afetado e não encerra a condução autorizada.

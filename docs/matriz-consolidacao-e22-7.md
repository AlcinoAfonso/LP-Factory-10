# E22.7 — Destinos de consumidores e consolidação

Referência anterior a remoções: V1 `555e8c481c152d10d8660196aeb2243e3bdd67ff`; V2 corrigida `733b9bc8947f58d047fec9ea40a0ba0ca502e2ed`. PR #994, branch `codex-app/e22-7-retirada-terminal`. Este registro é a prova de destinos exigida pela V1 §4.4.2/4.4.5; ainda não afirma remoção ou conclusão. Buscas de imports, re-exports, chamadas, rotas, scripts e SQL foram realizadas antes da exclusão. Reconfirmar o consumidor de cada arquivo imediatamente antes de removê-lo.

## Tratamentos materiais

| ID | Origem e classe | Tratamento / residência na V2 | Evidência e preservação |
| --- | --- | --- | --- |
| UPD-E22.7 | Updates sobre V1 e source SHA `555e8c48`; nenhum update aplicável | Sem patch tecnológico; recursos existentes de inspeção/prova apenas conforme necessidade | Catálogos consultados; `supa#63` permanece oportunidade condicional fora desta execução. Nenhum confronto estrutural material necessário |
| EST-E22.7-01 | V1 4.4.1/4.4.5; derivação técnica | 22.7.4/Conta: retirar fallback factual e decidir Base antes de taxonomia | Loader lê factual quando o gate E10.11 está desligado; Pending Setup, acesso, entitlement, comercial e Base possuem consumidores independentes |
| EST-E22.7-02 | V1 4.4.2/4.4.5; derivação técnica | 22.7.4/Taxonomia: ativação pelo CRUD existente, guarda administrativa, pai ativo e comparação otimista | `updateAdminTaxon` recusa false→true por gate E20; formulário existente já edita status; default false e hierarquia preservados |
| EST-E22.7-03 | V1 4.4.2; derivação técnica | 22.7.4/Estrutura LP: retirar entradas e preservar parâmetros | Adapter/page misturam root E18.4 e factual; `readRootParameters`, versions/presets e contrato raiz mantidos |
| EST-E22.7-04 | V1 4.4.2/4.4.5; derivação técnica | 22.7.3/Pesquisas: preservar pesquisa estruturada e comercial, retirar seletor bruto E20 | `commercialActivationAdapter`, `commercial-activation/draft-generation`, `adminCommercialActivationTemplatesAdapter` leem insumos independentes; leitor bruto é chamado somente pela avaliação retirada |
| EST-E22.7-05 | V1 4.4.2/4.4.5; derivação técnica | 22.7.4/Workloads e 22.7.5/Banco: retirar produto corrente, conservar leitura histórica | Registry/provas/configuração mutável usam ID factual; custos, revisões, ativações e labels têm consumidor financeiro E21 independente |
| EST-E22.7-06 | V1 4.4.2/4.4.5; derivação técnica | 22.7.5/Banco: dados inertes e revogação de grants/RPC externo | Inspeção read-only: RLS sem policies, service_role SELECT/INSERT/UPDATE, função CHECK EXECUTE externo; ausência de dependência externa entrando na tabela |
| EST-E22.7-06A | V1 4.4.2/4.4.5; derivação técnica | 22.7.5/Banco: DROP somente FK factual, sem CASCADE, dados intactos | `taxon_factual_fields_taxon_id_fkey` ON DELETE RESTRICT impediria DELETE administrativo independente; todas as outras FKs preservadas |
| EST-E22.7-07 | V1 4.4.2/4.4.3; derivação técnica | 22.7.5/Apply: escopo e migration E22.7 exatos, gate default false | Workflow atual limita inventário e exclui as duas E10.10; novo apply seletivo não as executa nem abre apply integral |
| EST-E22.7-08 | V1 4.4.3/4.4.5; derivação técnica | 22.7.5/Configuração: remover entradas E20 identificadas após cutover | Três nomes com sete entradas observadas em ambientes/scopes; reconfirmar metadata. Runtime corrente e Preview do cutover devem estar sem consumidores; builds históricos e scopes independentes preservados |
| ANA-E22.7-01 | Invariante de evidência; derivação técnica | Banco/configuração: cardinalidades observadas e conferidas antes/depois | Passagem 1 preservada; delta `733b9bc8` qualifica contagem/digest e metadata. Revisão delta: aprovado para implementar |

Os pareceres integrais de Updates, Estrutura, complemento focal e Analista estão preservados nos artefatos desta sessão; respostas não foram reescritas. A primeira avaliação independente não recebeu pareceres ou esta rastreabilidade. Não há modernização material a auditar por segunda passagem; o controle independente verifica a V2 e, em delta, a reconciliação planejada do roadmap.

## Objetos e configuração

| Ativo | Destino e consumidor real |
| --- | --- |
| `business_taxons`, aliases, `account_taxonomy`, matching e resolução de nicho | Preservados: CRUD/Admin, E10.3/E10.5 e contas; retirar somente contratos E20 dentro dos adapters mistos |
| `taxon_factual_fields` e função CHECK E20.8 | Dados e suporte interno preservados inertes; nenhum runtime após 22.7.4; revogar acesso externo e remover apenas FK factual de taxon |
| `business_taxons.selected_end_customer_research_version` | Valor histórico preservado; retirar leitura/mutação de seleção E20 e UPDATE da coluna; preservar grants taxonômicos independentes |
| Pesquisa estruturada, itens, artefatos e fontes | Preservados por E10.7; inspeção observou 24 pesquisas e 48 vínculos de fontes, sem exigir cardinalidade fixa |
| Arquivos de pesquisa bruta | Preservados como dados; retirar leitor/seleção E20 sem apagar arquivos por associação |
| Configurações mutáveis do workload factual | Retirar apenas unidades sem pendência; impedir novos IDs retirados nos CHECKs mutáveis |
| Revisões, ativações, cobertura e custos E21 | Preservados como histórico legível; não reduzir seus CHECKs históricos |
| Migrations históricas e duas candidatas E10.10 | Preservadas no Git; duas E10.10 continuam fora do ledger/apply |
| `E20_5_SELECTED_RESEARCH_ENABLED` | Retirar somente entradas identificadas: Preview geral, Production e dois overrides históricos |
| `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` | Retirar somente entradas identificadas: Production e Preview |
| `E20_6_INPUT_CATALOG_REVIEW_ENABLED` | Retirar entrada identificada Production+Preview |
| Gates E10.11/Base, OpenAI compartilhado e scopes Vercel | Preservados pelos consumidores independentes; valores não revelados |

Snapshot hospedado anterior à remoção: ledger 59, E10.10 zero, E22.7 zero; factual 27 linhas observadas, digest `c6a03bdf03f5936217f5f18d540b2bf7`, zero policies. Snapshot é observação a reconfirmar, não cardinalidade imposta. Coluna selecionada: UPDATE por coluna service_role, sem UPDATE amplo; name/slug/is_active permanecem.

## Arquivos auditados

A relação abaixo inclui consumidores mistos, contratos preservados e o fecho de imports dos arquivos exclusivos. Migrations/testes históricos conservam a residência original e não são prova do estado terminal. Snippets antigos serão identificados como históricos; prova corrente reside no snippet E22.7.


| Path | Destino anterior à remoção | Consumidor / prova |
| --- | --- | --- |
| `app/a/[account]/_components/FactualOnboarding.tsx` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `app/a/[account]/_components/onboarding-journey-validation-cases.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/a/[account]/account-journey-loader.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/a/[account]/factual-actions.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `app/a/[account]/page.tsx` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/admin/(protected)/custos-openai/_components/OpenAiCostsDashboard.tsx` | preservado independente | Labels/filtros da leitura financeira histórica E21; identidade corrente da execução é retirada em outro boundary |
| `app/admin/(protected)/custos-openai/_components/OpenAiEconomicHierarchy.tsx` | preservado independente | Labels/filtros da leitura financeira histórica E21; identidade corrente da execução é retirada em outro boundary |
| `app/admin/(protected)/estrutura-lp/_components/AdminFactualFields.tsx` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `app/admin/(protected)/estrutura-lp/actions.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `app/admin/(protected)/estrutura-lp/page.tsx` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/admin/(protected)/estrutura-lp/validation-cases.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonFactualCoverage.tsx` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `app/admin/(protected)/taxonomia/[taxonId]/_components/AdminTaxonInputCatalogEvaluation.tsx` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `app/admin/(protected)/taxonomia/[taxonId]/page.tsx` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/admin/(protected)/taxonomia/actions.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/admin/(protected)/workloads-openai/actions.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/admin/(protected)/workloads-openai/proofCore.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `app/admin/(protected)/workloads-openai/validation-cases.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `components/admin/AdminTaxonManageForm.tsx` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `components/admin/AdminTaxonResearchSelectionForm.tsx` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/admin/adapters/adminFactualFieldsAdapter.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/admin/adapters/adminFactualFieldsAdapterCore.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/admin/adapters/adminLandingPageStructureAdapter.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/admin/adapters/adminReadOnlyAdapter.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/admin/adapters/adminReadOnlyTypes.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/admin/adapters/adminTaxonFactualReleaseAdapter.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/admin/adapters/adminTaxonFactualReleaseCore.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/admin/adapters/adminTaxonomyAdapter.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/admin/evaluationSuggestionHandoff.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/adapters/factualFieldsAdapter.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/adapters/factualFieldsAdapterCore.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/adapters/inputCatalogEvaluationContextAdapter.ts` | removível | Contexto/provider/gate chamados somente pela avaliação factual Admin e prova do workload retirado; nenhum consumidor independente encontrado |
| `lib/conversion-content/adapters/inputCatalogEvaluationOpenAiAdapter.ts` | removível | Contexto/provider/gate chamados somente pela avaliação factual Admin e prova do workload retirado; nenhum consumidor independente encontrado |
| `lib/conversion-content/adapters/inputCatalogEvaluationRuntimeGate.ts` | removível | Contexto/provider/gate chamados somente pela avaliação factual Admin e prova do workload retirado; nenhum consumidor independente encontrado |
| `lib/conversion-content/adapters/selectedEndCustomerResearchAdapter.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/adapters/selectedEndCustomerResearchAdapterCore.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/adapters/taxonChainAdapter.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/adapters/taxonChainAdapterCore.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/index.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/conversion-content/landing-page/index.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/conversion-content/landing-page/input-catalog/contracts.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/input-catalog/index.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/input-catalog/resolver.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/input-catalog/schema.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/input-catalog/taxon-chain.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/input-catalog/validation-cases.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/taxon-preparation/contracts.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/taxon-preparation/index.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation-schema.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/taxon-preparation/input-catalog-evaluation.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/taxon-preparation/research.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/conversion-content/landing-page/taxon-preparation/validation-cases.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/onboarding/factual/adapters/accountFactualOnboardingAdapter.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/onboarding/factual/policy.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/onboarding/factual/validation-cases.ts` | removível | Fecho exclusivo de cobertura/avaliação/liberação factual ou onboarding rejeitado; consumidores externos mistos serão desacoplados antes da exclusão |
| `lib/openai-costs/active-validation-cases.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/openai-costs/economic-hierarchy.ts` | preservado independente | Labels/filtros da leitura financeira histórica E21; identidade corrente da execução é retirada em outro boundary |
| `lib/openai-workloads/adapters/operationalConfigurationAdapterCore.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/openai-workloads/contracts.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/openai-workloads/registry.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `lib/openai-workloads/validation-cases.ts` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `package.json` | desacoplado | Consumidor misto corrente: retirar somente referências E20/E10.10 e preservar contrato independente descrito acima |
| `supabase/snippets/e20_5_selected_end_customer_research_version_verify.sql` | preservado histórico | Prova histórica E20/E21; identificar proveniência, sem afirmar estado corrente e sem usar no aceite E22.7 |
| `supabase/snippets/e20_6_factual_taxon_release_default_inactive_verify.sql` | preservado histórico | Prova histórica E20/E21; identificar proveniência, sem afirmar estado corrente e sem usar no aceite E22.7 |
| `supabase/snippets/e20_6_reviewed_input_catalog_version_verify.sql` | preservado histórico | Prova histórica E20/E21; identificar proveniência, sem afirmar estado corrente e sem usar no aceite E22.7 |
| `supabase/snippets/e20_8_factual_fields_verify.sql` | preservado histórico | Prova histórica E20/E21; identificar proveniência, sem afirmar estado corrente e sem usar no aceite E22.7 |
| `supabase/snippets/e21_2_3_openai_workload_operational_configurations_verify.sql` | preservado histórico | Prova histórica E20/E21; identificar proveniência, sem afirmar estado corrente e sem usar no aceite E22.7 |
| `supabase/snippets/e21_2_taxon_input_catalog_sufficiency_workload_verify.sql` | preservado histórico | Prova histórica E20/E21; identificar proveniência, sem afirmar estado corrente e sem usar no aceite E22.7 |
| `lib/openai-costs/active-contracts.ts` | desacoplado | União de workloads históricos já existente recebe ID factual; contratos de execução corrente seguem sem esse ID |
| `.github/workflows/e10-11-sql-proof.yml` | preservado e estendido focalmente | Facilitador existente recebe caso isolado E22.7; cadeia e prova E10.11 independentes preservadas |
| `.github/workflows/pipeline-supabase-apply-migrations.yml` | preservado e estendido focalmente | Apply seletivo existente recebe somente migration/scope E22.7; gates, scopes prévios e exclusão E10.10 preservados |
| `app/admin/(protected)/workloads-openai/_proof.ts` | desacoplado | Import/provider e dependência inputCatalogEvaluation exclusivos da prova E20; preservar provas de nicho, comercial e duas etapas da Base |

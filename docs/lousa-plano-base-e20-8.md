# Plano-base E20.8 — Substituição greenfield e simplificação terminal da E20

## V1 funcional aprovada

- Estado: V1 funcional concluída; execução Complexa e supervisão Autônoma definidas; pronta para handoff técnico.

### 4.1.1 Problema e resultado funcional

- Problema: a E20 acumulou versionamento, política comercial residual, preparação por versão revisada, duas autoridades de publicação, gates e capacidades sem consumidor, tornando uma necessidade factual simples excessivamente cara para o MVP.
- Resultado: uma E20 mínima, corrente e administrável no Supabase, independente de planos e consumidores, sem versionamento de catálogo e com herança taxonômica simples.
- Usuário principal: `platform_admin` responsável por administrar taxons e fields factuais.

### 4.1.2 Comportamento esperado

- Administrador usa uma única página principal no Admin para consultar a cobertura factual corrente de qualquer taxon na ordem Universal → Segmento → Nicho → Ultranicho quando aplicável, com distinção clara entre fields herdados e próprios e detalhes técnicos em segundo nível.
- Novo taxon inicia inativo; humano pode liberá-lo sem IA quando a cobertura for suficiente.
- Field novo é criado diretamente na camada competente e passa a integrar novos usos imediatamente após validação e confirmação.
- Field pode ser editado enquanto continuar representando o mesmo fato; mudança material exige novo fieldKey.
- Field pode ser inativado e reativado sem versionamento global.
- IA pode sugerir possível gap, mas qualquer mutação continua humana.
- Consumidores leem apenas a cobertura factual corrente quando precisarem; não existe coordenação retroativa.

### 4.1.3 Limites e escopo negativo

- Não preservar mecanismo de versionamento antigo.
- Não preservar planos comerciais dentro da E20.
- Não criar bridge de compatibilidade com registry, versões ou review markers anteriores.
- Não reconstruir E20.7 ou outra capacidade sem consumidor aprovado.
- Não criar infraestrutura nova além da menor persistência necessária na stack vigente.
- Não alterar estruturas compartilhadas de outros casos sem demonstrar o impacto e preservar sua responsabilidade vigente.
- Escopo negativo vinculante: a V2 não pode reintroduzir com outro nome mecanismo equivalente aos contratos abaixo.
- Não criar versão, revision, draft, snapshot, rollback, histórico funcional ou trilha própria da E20.
- Não criar registry paralelo, dual-write, sincronização, replicação ou segunda autoridade factual.
- Não criar `CURRENT_VERSION`, `catalog_version`, reviewed version, marker de suficiência ou equivalente operacional.
- Não criar plano comercial, entitlement, capability comercial, `allowedPlans` ou projeção por plano dentro da E20.
- Não coordenar, invalidar, reabrir, migrar ou atualizar consumidores quando field ou taxon mudar.
- Não criar override, specialization, shadowing ou herança condicional de field por plano, conta ou consumidor.
- Não criar publisher por Git, PR ou deploy para administrar fields correntes.
- Não criar fingerprint de publicação, handoff ou reconciliação entre autoridades.
- Não criar sessão, cache, fila, job, worker, event sourcing, engine ou serviço novo para a E20.
- Não persistir resultado, decisão, estado ou histórico da avaliação por IA como lifecycle da E20.
- Não tornar pesquisa E20.5, Web Search ou qualquer fonte externa requisito para liberação humana ou gestão de fields.
- Não reconstruir E20.7 nem capacidade dormente sem consumidor real aprovado.
- Não migrar versões antigas nem manter código legado apenas para conservar histórico ou compatibilidade de dados de desenvolvimento.
- Não manter contrato E20-only em consumidor antigo quando não houver responsabilidade independente a preservar.
- Não alterar responsabilidade pertencente a outro caso sem identificar previamente o impacto e obter a autorização exigida pelo contrato do projeto.

### 4.1.4 Posição planejada no roadmap

- Criar `E20.8 — Substituição greenfield e simplificação terminal da E20` como plano executável deste Debate.
- Ao concluir o plano, reconsolidar o caso macro E20 para que a documentação canônica descreva somente a arquitetura vigente; contratos superseded permanecem recuperáveis pelo histórico Git, não como obrigação atual.
- A E20.8 é o recorte de transição e fechamento da reconstrução; não autoriza multiplicar novos subcasos para preservar mecanismos antigos.

### 4.1.5 Fases

- `20.8.3 — Demolição controlada da E20 vigente`: retirar do runtime e dos contratos correntes registry/versionamento, planos e `allowedPlans`, reviewed version, review gates, publisher repo-only, fingerprints/handoffs/reconciliação, capacidades dormentes e testes/documentação que existam somente para a arquitetura abandonada; manter a branch íntegra e não fazer merge de estado intermediário quebrado.
- `20.8.4 — Autoridade factual única`: estabelecer no Supabase a residência mínima dos fields factuais correntes e a administração autorizada, sem versionamento do catálogo ou segunda autoridade.
- `20.8.5 — Herança e resolução factual`: resolver deterministicamente Universal → Segmento → Nicho → Ultranicho e devolver a cobertura corrente sem plano comercial, conta ou consumidor.
- `20.8.6 — Gestão administrativa simples`: concentrar a gestão em uma única página principal no Admin, organizada por Universal → Segmento → Nicho → Ultranicho quando aplicável, distinguindo fields herdados e próprios e permitindo adicionar, editar, inativar ou reativar fields, sem páginas/abas separadas por camada, editor JSON técnico ou publicação por repositório.
- `20.8.7 — Liberação humana e apoio opcional por IA`: preservar taxon novo inativo, liberação humana sem IA, revisão voluntária de taxon ativo e IA consultiva com decisão humana final.
- `20.8.8 — Cutover e limpeza terminal`: retirar dependências remanescentes da arquitetura antiga, reinicializar dados de desenvolvimento quando necessário e reconciliar roadmap, base técnica, schema e demais fontes canônicas com a nova E20.

### 4.1.6 Classificação

- Execução: Complexa.
- Motivo: substituição destrutiva de um contrato transversal já materializado, mudança de autoridade factual, limpeza de dependências e necessidade de provar que responsabilidades de outros casos não foram removidas por acidente.

### 4.1.7 Automação

- Não há nova automação a decidir neste Debate.
- A avaliação por IA já aprovada anteriormente permanece apenas se continuar necessária no contrato greenfield; qualquer detalhe técnico é derivado na V2.
- A liberação humana e a administração dos fields não dependem de IA.

### 4.1.8 Critérios funcionais de aceite

- Zero referência operacional a Starter/Lite/Pro/Ultra, `allowedPlans`, entitlement ou plano comercial dentro da E20.
- Zero versionamento operacional da E20: sem `CURRENT_VERSION`, versões publicadas, reviewed version, carry-forward ou gate por versão.
- Zero dependência operacional do registry repo-only da E20 antiga.
- Zero publisher administrativo dependente de PR/deploy/reconciliação entre duas autoridades.
- Supabase é a única autoridade factual corrente da E20.
- Resolver atual recebe dados factuais e cadeia taxonômica e aplica apenas herança aprovada.
- Novo taxon pode ser liberado por humano sem IA.
- A gestão de fields ocorre em uma única página principal no Admin, com visão Universal → Segmento → Nicho → Ultranicho quando aplicável, distinção entre herdados e próprios e ações simples de criar, editar, inativar e reativar; detalhes técnicos ficam em segundo nível.
- IA não muta estado por decisão própria.
- Taxon ativo não é reaberto automaticamente por mudança de field.
- Nenhum consumidor ou estrutura compartilhada de outro caso perde responsabilidade funcional sem prova e autorização correspondente.
- Documentação canônica final não apresenta contratos E20 antigos como vigentes.
- O delta final deve representar redução arquitetural material; código novo só é aceito quando substituir responsabilidade necessária com menos complexidade total.
- A nova E20 não mantém histórico funcional, revisão, draft, snapshot ou rollback próprio além de metadados operacionais genéricos sem função de lifecycle.
- `fieldKey` é globalmente único e não existe override, shadowing ou specialization por camada.
- Pesquisa E20.5, Web Search ou outra fonte externa é opcional para a IA e nunca bloqueia a operação humana.
- Contrato antigo existente somente por causa da E20 não permanece no runtime ou consumidor corrente sem responsabilidade independente comprovada.
- O lifecycle funcional de field é somente ativo/inativo, com reativação; operações destrutivas não fazem parte do uso normal do produto.

### 4.1.9 Evidências esperadas

- Prova do fluxo administrativo real de criação de field por taxon/camada até sua leitura corrente.
- Prova de herança Universal → Segmento → Nicho → Ultranicho.
- Prova de liberação humana sem IA.
- Prova de que termos e contratos de plano/versionamento antigos não atravessam o runtime novo.
- Prova de que dados legados não são necessários para operar a nova E20.
- QA hospedado em desktop e mobile da página administrativa única, comprovando leitura clara das camadas Universal → Segmento → Nicho → Ultranicho quando aplicável, distinção entre fields herdados e próprios e ausência de navegação separada por camada.
- Auditoria de dependências externas removidas/preservadas antes do merge.

### 4.1.10 Supervisão

- Supervisão: Autônomo.

## Referência da fonte aprovada

- Documento: “Debate 12B — Substituição greenfield e simplificação terminal da E20 — LP Factory 10”.
- Seção: 4.1 — PB 1 — E20.8 Substituição greenfield e simplificação terminal da E20.
- URL: https://docs.google.com/document/d/1ClohATV14m-jABtL8YGu0s-2L8mgN4WemK9gOyiHti4/edit
- Documento consultado em: 14/09/2026.

## V2 técnica

### 1. Contrato, referências imutáveis e estado de partida

- Execução: Complexa. Supervisão: Autônomo.
- V1 congelada no commit `84534bdbf674859b388009bea3c11f74ced5e3e6`, blob `a598addc9ad1a52085ecbe5ef34e8a7e683b34c1`, neste mesmo path.
- Base técnica e snapshot do roadmap: `origin/main@806bf0f8cf13d5222537953eef175fbde355c0fb`; blob `f948e5fd2c3ebc9f2dd2fa6ed987fdff36ee2eb2` de `docs/roadmap.md`.
- PR único: `#939`, draft, base `main`, branch `codex-app/e20-8-greenfield`.
- Plano conceitual: N/A. O Debate 12B contém a V1 funcional aprovada e não referencia outro plano conceitual competente para o recorte.
- O estado Supabase inspecionado antes desta V2 mantém `business_taxons`, `landing_page_input_catalog_drafts` e `reviewed_input_catalog_version`; o runtime corrente ainda seleciona o registry repo-only v6. Nenhum desses mecanismos é preservado como autoridade ou compatibilidade da E20 nova.

### 2. Boundary greenfield e invariantes transversais

- Substituir o conteúdo do boundary `lib/conversion-content/landing-page/input-catalog/` sem criar boundary paralelo. A API pública final representa somente fields factuais correntes, cadeia taxonômica e cobertura resolvida.
- O domínio puro não acessa Supabase. O adapter operacional lê a autoridade factual, normaliza rows e entrega ao resolver somente os fields e a cadeia necessários.
- `fieldKey` é globalmente único. A residência é Universal ou exatamente um taxon; não existe override, shadowing, specialization ou redefinição de uma chave herdada.
- Permanecem exatamente os escopos factuais `account`, `business`, `offer`, `campaign` e `landing_page`.
- Field ativo integra a cobertura corrente de novos usos; field inativo permanece administrável, mas não é devolvido a consumidores. A cobertura vazia é resultado válido e distinto de falha de leitura ou contrato.
- Mudança de finalidade, residência, `valueScope` ou significado material exige novo `fieldKey`. Edição sob a mesma chave exige confirmação de que o fato permanece o mesmo.
- Não manter fallback ao registry, dual-read, dual-write, alias, stub, feature flag de compatibilidade ou segunda autoridade durante o cutover.
- Preservar E18.4, a pesquisa opcional E20.5, a liberação humana e assistência consultiva E20.6, a governança transversal E21 e os objetos residuais E19 que tenham responsabilidade independente.
- Os objetos E19 que ainda possuam `catalog_version` ou snapshot permanecem resíduos de outro caso e não integram a busca de zero referência operacional da E20 nova.
- Adapters falham fechados com erro próprio quando o objeto Supabase ainda não tiver sido aplicado; não retornam catálogo antigo ou aproximação. O apply continua pós-merge pelo workflow canônico.

### 3. Persistência e segurança

- Criar `public.taxon_factual_fields` com:
  - `field_key text primary key`, com `CHECK` de snake_case e identidade global;
  - `taxon_id uuid null references public.business_taxons(id) on update cascade on delete restrict`, sendo `null` a residência Universal;
  - `definition jsonb not null`, restrito a finalidade, tipo, `valueScope`, origem esperada, obrigação, condições e validação;
  - `is_active boolean not null default true`;
  - `created_by uuid not null references auth.users(id)`, `updated_by uuid not null references auth.users(id)`, `created_at timestamptz not null default now()` e `updated_at timestamptz not null default now()`;
  - trigger canônico para `updated_at` e índice operacional somente quando necessário às leituras por `taxon_id`.
- Não criar coluna, tabela ou objeto para version, revision, draft, snapshot, rollback, histórico funcional, plano, entitlement, `allowedPlans`, retirement por versão, registry, specialization, fingerprint, handoff, reconciliação, sessão, cache, fila, job ou evento da E20.
- A migration forward-only deve criar a tabela, carregar somente os fields ativos da v6 corrente como estado inicial, retirar propriedades proibidas e não copiar v1–v5, fields aposentados ou histórico.
- Antes da carga, a migration valida IDs, slugs, níveis e relações dos taxons específicos referenciados; qualquer divergência aborta a transação inteira.
- Na mesma migration, após a carga válida, remover `public.landing_page_input_catalog_drafts` e `public.business_taxons.reviewed_input_catalog_version`. Migrations históricas permanecem imutáveis.
- Habilitar RLS sem policies públicas; revogar `PUBLIC`, `anon`, `authenticated` e `ai_readonly`; conceder a `service_role` somente `SELECT`, `INSERT` e `UPDATE`, sem `DELETE` ou `TRUNCATE`.
- Versionar migration, teste SQL transacional e `supabase/snippets/e20_8_factual_fields_verify.sql`. O snippet é estritamente read-only e deve falhar se schema, constraints, FK, índice, trigger, RLS, grants, carga inicial ou ausência dos contratos removidos divergirem.
- Após o apply, confrontar também o Security Controls como evidência complementar; essa inspeção não substitui migration, teste ou snippet.

### 4. Contrato de domínio e adapters

- Substituir no boundary atual:
  - `contracts.ts`: identidades de taxon, cadeia, definição do field, row factual, cobertura e erros sem plano ou versão;
  - `schema.ts`: validação estrita da definição e rejeição de propriedades desconhecidas;
  - `resolver.ts`: resolução pura da cobertura corrente;
  - `taxon-chain.ts`: validação da ordem Universal → Segmento → Nicho → Ultranicho;
  - `index.ts`: única API pública greenfield;
  - `validation-cases.ts`: casos do contrato novo.
- Remover `registry.ts`, `lifecycle.ts`, `draft.ts`, `current-resolver.ts` e, se ficar sem consumidor após a retirada da E20.7, `offering-scope.ts`.
- O resolver recebe rows factuais já normalizadas e a cadeia completa, rejeita chaves duplicadas e residências fora da cadeia, valida referências condicionais contra a cobertura efetiva, ordena deterministicamente as camadas e deriva a proveniência da residência.
- Criar `lib/conversion-content/adapters/factualFieldsAdapterCore.ts` com portas injetáveis para paginação completa e `lib/conversion-content/adapters/factualFieldsAdapter.ts` server-only para Supabase e reuso de `taxonChainAdapter`.
- O adapter lê apenas Universal e os IDs da cadeia selecionada, distingue `READ_FAILED`, resposta inválida e ausência legítima e nunca consulta plano, conta, consumidor, pesquisa ou estado de suficiência.
- Repontar somente consumidores que ainda tenham responsabilidade vigente. Não adicionar a leitura factual a adapters de pesquisa, OpenAI ou taxonomia por conveniência.

### 5. `20.8.3 — Demolição controlada da E20 vigente`

- Inventariar antes da exclusão imports, exports, actions, DTOs, validators, scripts, migrations correntes, documentação e consumidores de input-catalog, taxon-preparation, knowledge-resolution, Admin, E21 Workloads e E21 Costs.
- Classificar cada alvo como removido E20-only, responsabilidade preservada ou histórico inerte. Consumidor necessário fora da classificação suspende somente o ponto afetado antes da exclusão.
- Remover integralmente a capacidade E20.7: `lib/conversion-content/landing-page/knowledge-resolution/`, adapters exclusivos, exports públicos, provas/actions administrativas, validators e scripts exclusivos.
- Remover `landing_page_dynamic_market_research` de contracts, registry, apresentação, allowlists, configuração operacional e UI correntes da E21; não manter alias, stub, flag, bridge ou código dormente.
- Preservar linhas históricas de custo e auditoria somente quando a E21 possuir responsabilidade transversal independente. Separar no boundary `lib/openai-costs/` o literal retirado como tipo aceito exclusivamente pelo read model histórico; entradas de tracking aceitam somente workloads ativos.
- Preservar `taxon_input_catalog_sufficiency_evaluation`, E20.5, E18.4, o taxon chain compartilhado, a liberação humana e os contratos E21 comuns.
- Este checkpoint pode retirar E20.7 e preparar o mapa de substituição, mas não pode publicar um estado que sobreponha ou deixe simultaneamente necessárias as duas autoridades factuais.

### 6. `20.8.4 — Autoridade factual única`

- Criar migration, teste SQL e snippet da seção 3.
- Gerar a carga inicial por transformação explícita dos fields ativos v6, removendo `version`, planos, `allowedPlans`, provenance histórica, retirement, fingerprints e qualquer propriedade de lifecycle.
- Implementar o adapter factual paginado e fail-closed sem fallback ao registry.
- Repontar a leitura operacional para `public.taxon_factual_fields` e remover na mesma unidade lógica as dependências executáveis da autoridade repo-only.
- Manter migration, repontamento e remoção do registry como mudança atômica no PR; nenhum checkpoint intermediário publicado pode depender de duas autoridades.
- Não aplicar schema remoto antes do merge. O runtime publicado sem objeto aplicado deve exibir indisponibilidade explícita e não aproximar dados.

### 7. `20.8.5 — Herança e resolução factual`

- Implementar o contrato puro e os validators da seção 4.
- Resolver exclusivamente Universal → Segmento → Nicho → Ultranicho quando as camadas existirem na cadeia selecionada.
- Fields próprios e herdados preservam uma única definição; a proveniência é derivada de `taxon_id`, nunca armazenada como histórico de overrides.
- Consumidores recebem somente fields ativos e os metadados necessários para solicitar fatos. Nenhum plano, conta, LP, versão ou estado de consumidor integra a entrada ou a saída.
- Cobrir por teste: cada nível, cadeia parcial/completa, field Universal, próprio e herdado, ativos/inativos, chave duplicada, residência fora da cadeia, condição sem referência, resposta vazia, paginação acima de uma página, `READ_FAILED` e row inválida.

### 8. `20.8.6 — Gestão administrativa simples`

- Reutilizar `/admin/estrutura-lp?view=entradas` como única página principal dos fields e preservar a visão `Parâmetros` da E18.4. Não criar rota, página ou aba separada por camada.
- Substituir `AdminInputCatalogLifecycle`, seu editor JSON e as actions de draft/publicação/reconciliação por `AdminFactualFields`, `adminFactualFieldsAdapter` e Server Actions finas no mesmo boundary administrativo.
- Listar taxons ativos e inativos, permitir selecionar a cadeia e mostrar Universal → Segmento → Nicho → Ultranicho quando aplicável, agrupando fields por camada e distinguindo visual e textualmente próprio de herdado.
- Manter finalidade, tipo, escopo, obrigação, condição e validação em detalhe secundário com `<details>` ou padrão equivalente.
- Usar formulários estruturados para criar, editar, inativar e reativar. Não oferecer editor JSON, exclusão funcional, mudança de residência ou mudança de `fieldKey` durante edição.
- Criar diretamente na camada escolhida; editar somente o mesmo fato e exigir confirmação humana explícita; rejeitar alteração de residência ou `valueScope` sob a mesma chave.
- Usar `updated_at` como token de concorrência otimista sem convertê-lo em version ou revision funcional.
- Cada Server Action reexecuta `requirePlatformAdmin()`, revalida payload, row e identidade, aplica compare-and-set e confirma o estado final antes de revalidar a página.
- O administrador deve reconhecer, sem abrir detalhes técnicos, a camada de origem, a condição próprio/herdado e a próxima ação humana disponível.
- Validar WCAG 2.2 proporcional: teclado, foco visível e previsível, labels e erros associados, anúncio textual de sucesso/erro, contraste, alvos de toque de pelo menos 44 px e nenhuma ação exclusiva por hover. Combinar inspeção automática e manual sem alegar conformidade integral.

### 9. `20.8.7 — Liberação humana e apoio opcional por IA`

- Preservar `adminTaxonFactualReleaseCore.ts` e adaptar `adminTaxonFactualReleaseAdapter.ts` para a cobertura Supabase corrente. Remover dos DTOs `currentInputCatalogVersion`, reviewed marker e qualquer identidade de versão.
- O fingerprint da cobertura é permitido somente como token efêmero contra drift entre leitura e confirmação da liberação; não é persistido e não constitui publicação, reconciliação ou histórico.
- Taxon novo continua inativo. A liberação humana altera somente `business_taxons.is_active` por compare-and-set e confirma a identidade final. Taxon ativo permanece ativo durante revisão voluntária.
- Preservar `taxon_input_catalog_sufficiency_evaluation` como único workload OpenAI da E20 e adaptar input, contexto, prompt, schema, UI e testes à cadeia e cobertura correntes no Supabase, sem versão, plano, registry, draft, marker, token de decisão ou handoff ao lifecycle antigo.
- A avaliação é iniciada somente por ação explícita de `platform_admin`, server-side, e produz recomendação transitória. Selecionar uma sugestão apenas abre ou preenche o mesmo formulário humano de criação/edição; nenhuma saída de IA muta ou persiste estado.
- Preservar a configuração E21 vigente `gpt-5.6-terra + low`; não trocar modelo neste recorte. Executar uma Responses API foreground, Structured Output estrito, `store:false`, `background:false`, limite total de 45 segundos e zero retry.
- Web Search é opcional: exatamente uma chamada para hipótese focal ou no máximo duas para fallback autorizado. Aceitar como fonte somente URLs HTTPS presentes na metadata do provider.
- Não usar Agents SDK, agent, conversation, sessão, job, fila, cache, background, crawler, RAG ou fallback Codex.
- Separar instruções estáveis de dados não confiáveis; não enviar conta, oferta concreta, PII ou secrets. Telemetria sanitizada registra somente metadados técnicos, configuração, IDs de request/provider, resultado, latência, usage, custo e contagens de busca/fontes, sem prompt, resposta integral ou conteúdo de fontes.
- Falha, recusa, timeout, indisponibilidade ou resultado inconclusivo tornam somente a assistência indisponível. CRUD e liberação humana sem IA permanecem completos.
- Remover preparação/revisão por versão, `input-catalog-review`, gap handoff e tokens/decisões exclusivos do fluxo antigo, `adminTaxonomyReviewPolicy`, `inputCatalogReview` dos DTOs e toda leitura/escrita de `reviewed_input_catalog_version`.
- Versionar prompt/contrato greenfield próximo ao consumidor e validar casos típicos, limites, drift, concorrência, schema inválido, prompt injection, fonte ausente/inventada, provider indisponível e operação humana com o gate desligado.

### 10. `20.8.8 — Cutover e limpeza terminal`

- Remover resíduos executáveis da E20 antiga somente depois que os consumidores preservados apontarem para a autoridade nova; nenhuma compatibilidade permanece no runtime final.
- Atualizar scripts do `package.json`: substituir validators antigos pelos casos greenfield e retirar comandos exclusivos da E20.7 e do lifecycle abandonado.
- Executar auditoria final de imports e busca de termos proibidos limitada ao runtime E20 novo. Migrations históricas, planos encerrados e read model financeiro histórico podem manter referências inertes justificadas.
- Reconciliar por ABC `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/automations.md`, `docs/platform-config.md` e `docs/openai-model-snapshot.md` para descrever somente a arquitetura vigente. `docs/services.md` não recebe registro porque nenhum service novo é criado.
- Em `docs/automations.md`, substituir o contrato E20.6 pelo apoio corrente E20.8.7 e retirar E20.7.4. Em `docs/platform-config.md`, preservar somente o gate/configuração do workload de suficiência e retirar a capacidade E20.7 corrente. Em `docs/openai-model-snapshot.md`, manter o workload de suficiência atual e tratar E20.7 somente como histórico encerrado quando necessário.
- Resolver por fonte operacional competente qualquer divergência factual de Preview/Production no momento do cutover; não usar documentação antiga para afirmar estado hospedado.
- Preservar Next.js `16.3.3` ou baseline corrigida superior já aprovada; não introduzir Cache Components, nova política de cache ou upgrade adicional.
- Executar `npm ci`, validators focais, `npm run check`, testes SQL, `git diff --check`, auditoria de dependências e busca terminal.
- Após merge e apply canônico, executar o snippet read-only, confrontar Security Controls e validar o runtime no mesmo SHA. Se o deploy tiver ocorrido antes do objeto, confirmar recuperação e redeploy do mesmo SHA somente quando necessário.
- Executar QA hospedado com `platform_admin` em desktop `1440×900` e mobile `320×844` e `390×844`, cobrindo cadeia, próprios/herdados, criação, edição, inativação, reativação, estado vazio, erro, concorrência, liberação sem IA e assistência indisponível.
- A evidência de QA deve identificar deployment/ambiente, papel, viewport, fluxo/estado e resultado. Runs e logs são suplementares e expiráveis; PR, commits e documentos canônicos preservam a prova durável.

### 11. Arquivos e residências prováveis

- Substituir ou ajustar: `lib/conversion-content/landing-page/input-catalog/`, `lib/conversion-content/adapters/taxonChainAdapter*`, `lib/admin/adapters/adminLandingPageStructureAdapter.ts`, `lib/admin/adapters/adminTaxonFactualRelease*`, `lib/admin/adapters/adminTaxonomyAdapter.ts`, `lib/admin/adapters/adminReadOnlyTypes.ts`, `app/admin/(protected)/estrutura-lp/`, `app/admin/(protected)/taxonomia/`, `lib/conversion-content/landing-page/taxon-preparation/`, `lib/openai-workloads/`, `lib/openai-costs/`, `app/admin/(protected)/workloads-openai/`, `package.json` e `package-lock.json` somente quando o script graph exigir.
- Criar: `lib/conversion-content/adapters/factualFieldsAdapterCore.ts`, `lib/conversion-content/adapters/factualFieldsAdapter.ts`, `lib/admin/adapters/adminFactualFieldsAdapter.ts`, `app/admin/(protected)/estrutura-lp/_components/AdminFactualFields.tsx`, migration, teste SQL e snippet E20.8.
- Remover: registry/lifecycle/draft/current resolver antigos, lifecycle administrativo de catálogo, componentes e contratos de review/handoff por versão, boundary/adapters/provas/validators E20.7 e demais arquivos que a auditoria confirmar como exclusivamente ligados ao contrato abandonado.
- Documentação canônica é alterada somente por operações literais do ABC competente.

### 12. Critérios técnicos de aceite e parada

- Banco, domínio, adapter e Admin não contêm versão, plano, registry, draft, snapshot, publisher, reconciliação, override ou segunda autoridade da E20.
- A carga inicial contém somente fields ativos correntes, sem propriedades proibidas, e a migration aborta diante de taxonomia incompatível.
- RLS, revogações e grants mínimos estão comprovados por teste, snippet e inspeção complementar.
- Resolver e adapter provam herança, unicidade global, ativo/inativo, cobertura vazia, paginação completa e falhas explícitas.
- Admin prova CRUD lógico estruturado, concorrência, guard `platform_admin`, hierarquia e distinção próprio/herdado em viewports desktop/mobile.
- Liberação humana funciona sem IA; taxon ativo não reabre por mudança de field; IA não possui caminho de mutação ou persistência.
- E20.7 não possui consumidor, registry, provider, proof, action, validator, script ou configuração corrente; histórico financeiro preservado não aceita tracking novo nem reaparece como workload ativo.
- E18.4, E20.5, E20.6 humano/consultivo, E21 comum e responsabilidades de outros casos permanecem aprovados nos validadores e na auditoria de imports.
- `npm ci`, validators focais, `npm run check`, `git diff --check`, testes SQL, snippet pós-apply, Security Controls e QA hospedado estão aprovados no gate correspondente.
- Qualquer evidência de consumidor necessário não classificado, necessidade de mudança material da estrutura aprovada ou responsabilidade de outro caso afetada suspende apenas o ponto e retorna ao workflow competente; não se inventa compatibilidade.

### 13. Classificação dos acréscimos técnicos

- Derivação técnica da V1: substituição in place do boundary, tabela única, migration/carga/cutover, resolver puro, adapters, Admin estruturado, liberação humana, preservação consultiva da IA, demolição E20.7, segurança, validações e reconciliação documental.
- Modernização técnica justificada: snippet read-only reexecutável (`supa#40`) e critérios proporcionais de reconhecibilidade e WCAG 2.2 (`prod#14` e `prod#17`), todos de impacto estrutural baixo e sem alteração funcional.
- Ampliação de escopo incorporada: nenhuma.
- Oportunidade condicional não implementada: matriz RLS ampliada com ferramenta comunitária (`supa#63`), somente em futuro recorte com lacuna demonstrável nos testes SQL focais.
- Rejeitado no recorte: coluna gerada de normalização (`supa#52`), pois duplicaria a identidade canônica `fieldKey` e seu índice sem ganho líquido.

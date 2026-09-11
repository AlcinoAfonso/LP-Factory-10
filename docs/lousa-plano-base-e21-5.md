11/09/2026 — Plano-base v2 — E21.5 — Controle ativo de custos OpenAI por workload e conta

## 1. Estado e fonte canônica

- Estado: V2 técnica candidata, derivada da V1 funcional aprovada; aguarda o gate do Analista antes do checkpoint `plan-v2-approved` e da implementação.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.5 — Controle ativo de custos OpenAI por workload e conta`.
- Classificação de execução: Complexa.
- Supervisão: Autônomo.
- Plano conceitual: N/A.
- Fonte canônica: `Debate 10 — Controle de custos OpenAI por workload e conta — LP Factory 10`, seção `4.1. PB 1 — E21.5 Controle ativo de custos OpenAI por workload e conta — V1 aprovada`.
- Documento de origem: `https://docs.google.com/document/d/1CsT5NJ8E0JrXBiG_gumH91BxcGHpHi7kBQtimylrClg`.
- Revisão lida na materialização: `ANLCKQmckVTNl9jgl_EslpfkYDfzo--kW_9QHW3M0g5yvEUkN3rT_Hfz-pMmvZF_65YIFezoiDixyC1FpAPXWiN5zJ-fBky7M0M_0bp3nqU`.
- V1 congelada: commit `a85cf61c2a91b7181424e12eb31f9ca10afad6c3`, blob `22561d701463f2af9a13719fd816d1b20b2bca7f`, neste mesmo path.
- Base do PR e snapshot do roadmap: `origin/main@89c11b904ff66cd1e85629f2efa6eb2b8a2f16cb`, blob `b1650877c2279a9dc881043c8a99a7568c06c039` de `docs/roadmap.md`.
- PR único: `#921`, draft, base `main`, head `codex-app/e21-5-controle-custos-openai`.
- Gestor Estrutural: `aprovado com condicionantes`; achados `GE-E21.5-01` a `GE-E21.5-10` e condicionantes `C-GE-E21.5-01` a `C-GE-E21.5-08`.
- Gestor de Updates: `updates aplicáveis com patches autossuficientes`; aplicar agora `vercel#32` e `prod#17`, preservar `supa#2` como validação pós-apply e não implementar `vercel#1`, `supa#63`, `supa#64` ou `supa#69` neste recorte.
- Gestor de Automações: `N/A — avaliação formal dispensada na V1`.
- Confronto estrutural de modernização: N/A; nenhum update aprovado possui impacto estrutural material.

## 2. Contrato funcional aprovado

### 2.1. Problema

- A LP Factory conhece o gasto oficial total da organização OpenAI e preserva histórico financeiro legado, mas não possui atribuição financeira transversal dos workloads vigentes no grão necessário para explicar custo por universo, conta, workload, execução, modelo, effort e operações cobradas.

### 2.2. Resultado funcional

- Cada execução abrangida deve poder ser atribuída ao responsável econômico quando comprovável e decomposta nas operações OpenAI efetivamente realizadas, permitindo somar, consultar e reconciliar custos de workloads atuais e futuros sem perder modelo, effort, retry e referência de baseline quando disponível.

### 2.3. Comportamento esperado

- Capturar os fatos financeiros de cada execução e operação.
- Manter exceções explícitas.
- Não duplicar retries.
- Derivar agregações por workload, conta e universo.
- Preservar o total oficial como autoridade de reconciliação.
- Manter uma única superfície administrativa de custos.

### 2.4. Atores

- `platform_admin` como usuário administrativo da visão financeira.
- Workloads OpenAI governados por E21 como produtores dos fatos técnicos necessários.

### 2.5. Decisões de produto

- Execução sem vínculo comprovável fica não atribuída.
- Operação sem custo calculável fica com custo indisponível.
- Nenhuma das duas situações inventa valor.
- Novo workload deve aderir ao mesmo contrato financeiro sem novo subsistema.
- Automação: não aplicável; a instrumentação é comportamento determinístico intrínseco ao runtime.

## 3. Posição e fases planejadas

- Posição planejada no roadmap: `E21.5 — Controle ativo de custos OpenAI por workload e conta`.
- `E21.5.3 Atribuição e evidência por execução`.
- `E21.5.4 Cálculo e reconciliação de custos`.
- `E21.5.5 Visão administrativa de custos`.

## 4. Critérios de aceite

- Toda execução abrangida é rastreável ao workload e ao responsável econômico quando comprovável.
- Operações e retries cobrados não são duplicados.
- Modelo e effort efetivos permanecem visíveis por operação.
- Custo da execução deriva somente das operações calculáveis.
- Exceções e custos indisponíveis permanecem explícitos.
- Total oficial permanece reconciliável.
- Falha financeira não bloqueia workload.
- Novo workload governado por E21 pode aderir ao mesmo contrato.
- `/admin/custos-openai` permanece superfície única de consulta administrativa.

## 5. Evidências esperadas

- Casos representativos de LP Factory, Cliente, retry, falha, custo indisponível e novo workload demonstram atribuição, agregação e reconciliação coerentes.
- A superfície administrativa comprova filtros e totais sem expor payload de negócio, prompt, resposta integral, PII ou secrets.

## 6. Limites e escopo negativo

- Não inclui ChatGPT, Codex, assinaturas ou créditos humanos.
- Não cria governança de Baseline de IA; apenas aceita referência/versionamento quando o workload a expuser.
- Não cria cobrança comercial do cliente.
- Não usa heurística para atribuição.
- Não bloqueia workload por falha financeira.
- Não executa a transição da E21.4 para histórico legado, reservada ao PB 2.
- Não apaga, reescreve ou reclassifica eventos históricos.
- Não amplia a E21.4 para transformá-la no novo contrato transversal.

## 7. Próxima ação

- Criar o checkpoint `LP-Factory-Stage: plan-v2` contendo somente este plano.
- Executar o Analista em Passagem 1 sem pareceres ou matriz.
- Somente depois da Passagem 1, versionar a matriz de consolidação e executar a Passagem 2 com os pareceres integrais.
- Após `aprovado para merge do plano-base v2`, reconciliar `docs/roadmap.md` via ABC em modo planejamento e obter revisão delta do mesmo Analista.
- Criar `LP-Factory-Stage: plan-v2-approved` e iniciar E21.5.3 no mesmo PR, branch e worktree.

## 8. Autoridades, invariantes e boundaries

### 8.1. Autoridades e invariantes funcionais

- A Costs API da OpenAI permanece a única autoridade do gasto oficial total da organização no período.
- O ledger ativo interno é autoridade apenas da atribuição e do subtotal calculável por universo, conta, workload, execução e operação.
- A série `openai_lp_*` da E21.4 permanece histórica, congelada e somente leitura.
- Toda execução recebe exatamente um universo explícito: `lp_factory` ou `client`.
- `client` recebe `accountId` somente quando o vínculo existe no contexto autorizado; sem prova, preserva `attributionStatus = unassigned` e `accountId = null`.
- `lp_factory` usa `accountId = null` e `attributionStatus = attributed`; não é fallback para contexto ausente.
- Não existe atribuição por horário, modelo, volume, rota, proximidade, nome ou qualquer heurística.
- Uma execução é a ocorrência funcional completa; uma operação é cada chamada ou uso cobrável do provider dentro da execução.
- Retry cobrado cria nova operação dentro da mesma execução e referencia a operação anterior; replay técnico da persistência reutiliza o mesmo ID e não duplica custo.
- Custo da execução deriva somente das operações calculáveis. Operação sem usage suficiente ou preço compatível preserva os fatos e fica `unavailable`, com custo nulo, nunca zero inventado.
- Subtotal interno incompleto é identificado como calculável e não é apresentado como custo total.
- Falha de instrumentação financeira não altera sucesso, falha, retorno ou fallback funcional do workload.
- Modelo e reasoning effort efetivos permanecem dimensões separadas por operação; referência e versão de Baseline de IA são opcionais e somente carregadas quando fornecidas pelo workload.
- Novo workload governado por E21 deve declarar contexto econômico e aderir ao mesmo contrato público, sem criar subsistema próprio.

### 8.2. Boundaries preservados

- `lib/openai-costs/` é a autoridade transversal de contratos financeiros, pricing, recorder, persistência, leitura ativa, reconciliação e DTOs do dashboard.
- `lib/openai-workloads/` permanece autoridade de identidade, configuração efetiva e normalização pública de usage. Não recebe pricing, banco financeiro, provider administrativo ou escrita de custos.
- `lib/openai-costs/providers/openAiCostsProvider*` continua responsável somente pela leitura oficial da Costs API.
- `lib/openai-costs/adapters/lpCostReadModelAdapter*` continua responsável somente pela série histórica E21.4 e não é generalizado nem reativado como write-side.
- `lib/openai-workloads/observability.ts` continua telemetria operacional; `OpenAiWorkloadEvent` não vira registro financeiro.
- Consumidores e transports notificam a API pública do recorder com contexto explícito, sem importar Supabase, pricing ou rows do banco.

### 8.3. Componentes previstos

- `lib/openai-costs/active-contracts.ts`: tipos de execução, operação, atribuição, retry, indisponibilidade, cobertura e read model ativo.
- `lib/openai-costs/pricing.ts`: catálogo code-owned, versionado e com vigência temporal das combinações confirmadas.
- `lib/openai-costs/recorder.ts`: orquestração best-effort aguardada em orçamento curto e degradável, com falha encapsulada e log seguro.
- `lib/openai-costs/adapters/activeCostTrackingAdapter.ts` e `activeCostTrackingAdapterCore.ts`: chamadas RPC, validação estrita e tradução de rows.
- `lib/openai-costs/adapters/activeCostReadModelAdapter.ts` e `activeCostReadModelAdapterCore.ts`: leitura paginada keyset e composição do agregado ativo.
- `app/api/internal/openai-costs/route.ts`: ingresso interno estreito e autenticado do `supabase_inspect`.
- `automations/supabase-inspect/costRecorder.mjs`: cliente focal do protocolo de ingresso, sem credencial de banco mutável.
- `app/admin/(protected)/custos-openai/`: extensão da superfície existente para o total oficial, subtotal ativo, histórico legado, reconciliação e filtros internos.
- Não criar nova rota administrativa, dashboard financeiro paralelo, engine, fila, cron, cache financeiro, agente ou segunda residência analítica.

## 9. Contrato de dados ativo

### 9.1. Tabelas novas e independentes

- `public.openai_cost_executions`:
  - `id uuid` como identidade idempotente da execução funcional;
  - `workload text`, validado contra vocabulário governado por E21;
  - `environment text` em `production`, `preview` ou `development`;
  - `execution_origin text` em `runtime` ou `administrative_proof`, imutável e sem criar workload paralelo;
  - `universe text` em `lp_factory` ou `client`;
  - `attribution_status text` em `attributed` ou `unassigned`;
  - `account_id uuid null`, FK para `public.accounts(id)` com `ON UPDATE RESTRICT ON DELETE RESTRICT`;
  - `baseline_reference text null` e `baseline_version text null`, sanitizados e opcionais;
  - `started_at timestamptz`, `finished_at timestamptz null`, `result text null` e `failure_category text null`;
  - checks coerentes entre universo, atribuição e conta; finalização única e identidade imutável.
- `public.openai_cost_operations`:
  - `id uuid` como identidade idempotente da chamada cobrável;
  - `execution_id uuid` com FK restritiva para a execução;
  - `sequence integer` positiva e única por execução;
  - `retry_of_operation_id uuid null`, referindo uma operação anterior da mesma execução;
  - modelo, `reasoning_effort`, fonte e revisão da configuração efetiva, versões de prompt/contrato quando existirem e IDs técnicos sanitizados necessários à correlação;
  - usage normalizado em colunas numéricas não negativas: input, cached input, cache write, output, reasoning e total;
  - `web_search_call_count` não negativo, modalidade/versionamento da ferramenta e preço por chamada quando a operação usar Web Search;
  - `pricing_version`, `pricing_effective_at` e snapshot estritamente validado das regras de tokens e unidades cobradas aplicadas;
  - `cost_status` em `calculated` ou `unavailable`, `cost_unavailable_reason` sanitizado e `cost_usd numeric null` com coerência obrigatória;
  - `started_at`, `finished_at null`, `result null`, categoria/status/código/tipo de falha sanitizados;
  - unicidade `(execution_id, sequence)` e finalização única.
- `public.openai_cost_coverage`:
  - uma linha imutável por `environment + workload`;
  - `activated_at timestamptz`, versão do contrato financeiro e metadados técnicos mínimos do corte;
  - retry idêntico idempotente e tentativa divergente rejeitada.

### 9.2. RPCs versionadas

- Escrita idempotente: `start_openai_cost_execution_v1`, `finish_openai_cost_execution_v1`, `start_openai_cost_operation_v1`, `finish_openai_cost_operation_v1` e `register_openai_cost_coverage_v1`.
- Leitura sanitizada: `read_openai_cost_summary_v1` e `read_openai_cost_operations_v1`.
- Finalização permite apenas transição de pendente para terminal; identidade, atribuição, configuração, retry e evidência anterior permanecem imutáveis.
- Repetição com payload equivalente devolve a identidade existente; repetição divergente falha fechado.
- `read_openai_cost_operations_v1` usa cursor keyset determinístico por `started_at + id`; não usa offset profundo.
- Leitura por período usa intervalo UTC `[start_time, end_time)` e retorna apenas colunas necessárias aos DTOs administrativos.

### 9.3. Segurança e índices

- Criar migration forward-only; não alterar tabelas, RPCs, views, triggers ou dados `openai_lp_*`.
- Habilitar RLS nas três tabelas, sem policies diretas para `anon` ou `authenticated`.
- Revogar `PUBLIC`, `anon`, `authenticated` e `ai_readonly` em tabelas, sequences e funções aplicáveis.
- Conceder a `service_role` apenas `SELECT`, `INSERT` e o `UPDATE` estritamente necessário às finalizações; negar `DELETE` e `TRUNCATE`.
- RPCs usam `SECURITY INVOKER`, `SET search_path = pg_catalog`, nomes schema-qualified e `EXECUTE` exclusivo de `service_role`.
- Triggers rejeitam `DELETE` e qualquer `UPDATE` fora da transição terminal autorizada.
- Índices cobrem as consultas reais: período e ID, período por workload/universo, conta parcial, FK de execução e `retry_of_operation_id`.
- Teste SQL transacional com rollback e snippet read-only verificam constraints, RLS, zero policies, ACLs, grants, triggers, idempotência, transições, FK e keyset.

## 10. Captura por execução, operação e retry

### 10.1. API pública do recorder

- O chamador cria `executionId` estável antes da ocorrência funcional e informa `workload`, ambiente e contexto econômico explícito.
- O recorder tenta iniciar a execução, tenta iniciar cada operação antes da chamada e tenta finalizá-la após resposta ou falha do provider.
- A execução termina uma vez, depois da última operação funcional, independentemente de sucesso ou falha financeira do recorder.
- Todas as chamadas ao recorder são aguardadas dentro de budget próprio curto; não usar fire-and-forget em runtime serverless.
- Timeout, resposta inválida ou falha do adapter gera somente evento operacional seguro com IDs, fase e código categorizado; não contém prompt, resposta integral, payload de negócio, PII, secret ou mensagem bruta.
- O recorder nunca lança erro que substitua o resultado funcional do workload.

### 10.2. Produtores atuais

- `niche_resolution`: universo `client`; recebe o `accountId` já autorizado pelo fluxo `app/a/[account]/actions.ts` e não o infere no adapter.
- `commercial_activation_draft_generation`: universo `lp_factory`.
- `taxon_input_catalog_sufficiency_evaluation`: universo `lp_factory`.
- `landing_page_dynamic_market_research`: exige contexto financeiro explícito em cada invocação; provas administrativas atuais usam `lp_factory`, e uso futuro para cliente deve fornecer `client + accountId` autorizado sem default silencioso.
- Provas administrativas dos workloads usam universo `lp_factory` e são identificáveis como prova, sem criar workload paralelo.
- `supabase_inspect`: universo `lp_factory`, uma execução por run e uma operação por chamada real à Responses API dentro do tool loop.
- Inventário e validadores devem provar que os cinco workloads catalogados atuais possuem produtor instrumentado e que novo workload não compila ou não executa sem declarar o contexto financeiro exigido pelo contrato público.

### 10.3. Ingresso do `supabase_inspect`

- Preservar `SUPABASE_DB_URL_READONLY` exclusivamente read-only e nunca fornecer `service_role` ou DSN mutável ao workflow.
- `app/api/internal/openai-costs/route.ts` aceita somente envelope versionado, timestamp recente, nonce/IDs idempotentes e assinatura HMAC sobre bytes canônicos.
- Rejeitar método, content type, versão, timestamp expirado/futuro, replay divergente, assinatura inválida ou payload fora do schema antes de qualquer escrita.
- Comparar assinatura em tempo constante e limitar tamanho do body; não registrar assinatura nem payload bruto.
- O envelope declara `environment` a partir da Config allowlisted `OPENAI_COST_INGESTION_ENVIRONMENT`, além de modelo efetivo, origem/revisão `github_actions_default_reference` e `reasoningEffort = not_applicable`; o ingresso valida esses valores contra o contrato catalogado de `supabase_inspect`.
- Somente o modo do workflow que realiza chamada à Responses API cria execução financeira; SQL batch sem chamada OpenAI não cria execução ou operação.
- O endpoint converte o envelope validado em chamadas ao mesmo recorder/adapters do Core; não contém regra de preço duplicada.
- `automations/supabase-inspect/costRecorder.mjs` encapsula canonicalização, assinatura, timeout e envio; falha financeira é registrada no workflow e não concede acesso adicional ao banco.

## 11. Cálculo, cobertura e reconciliação

### 11.1. Pricing e custo terminal

- `pricing.ts` contém somente modelos e modalidades efetivamente confirmados para os workloads atuais, com versão e vigência temporal explícitas.
- Antes de incluir uma combinação, confirmar a tarifa na fonte oficial vigente. Tarifa ausente, divergente ou unidade de usage insuficiente não recebe aproximação.
- O terminal da operação seleciona a regra vigente no instante da chamada, valida usage sem sobreposição e persiste versão, vigência e snapshot da regra aplicada.
- Entrada ordinária é derivada sem sobreposição entre input, cached input e cache write; reasoning já incluído em output não é cobrado novamente.
- Web Search é unidade cobrável própria por chamada além dos tokens: o cálculo valida a quantidade, modalidade e regra vigente, soma uma ou duas chamadas quando ocorrerem e preserva essas unidades no snapshot.
- Se faltar tarifa ou unidade necessária de qualquer componente cobrável da operação, o custo integral fica `unavailable`; não publicar subtotal parcial de tokens ou ferramenta.
- O cálculo usa aritmética decimal exata, sem arredondamento intermediário; `decimal.ts` permanece a primitiva compartilhada.
- Histórico nunca é reprecificado por tarifa corrente. Correções futuras de pricing exigem nova versão prospectiva, sem UPDATE retroativo.

### 11.2. Read model ativo

- O read model agrega por universo, conta quando aplicável, workload, execução e operação, preservando retries, modelo, effort, baseline opcional, status de custo e resultado.
- Operação `unavailable` permanece contada e visível, mas fora do subtotal calculável.
- Execução não atribuída permanece em grupo explícito de exceções e não entra em conta nem em LP Factory por conveniência.
- Cobertura deriva somente dos cortes imutáveis por ambiente/workload e dos estados persistidos de operações pendentes ou indisponíveis; logs isolados de falha anterior à persistência não integram o read model e aparecem apenas como risco de cobertura refletido pela reconciliação.
- Ativação parcial nunca é chamada de cobertura global; falha do recorder que não chegou ao ledger não recebe contagem inventada.
- Leitura grande pagina integralmente por keyset, detecta cursor repetido/regressivo, valida cada página e falha sem publicar agregado incompleto como completo.

### 11.3. Composição financeira global

- `/admin/custos-openai` consulta em paralelo: total oficial da Costs API, agregado ativo E21.5 e série histórica congelada E21.4.
- Relação canônica: `reconciliação global = total oficial - subtotal ativo calculável - histórico legado calculável`, sem clamp ou redistribuição.
- Se o ativo ou o legado estiver indisponível, a tela preserva o total oficial e identifica a reconciliação como indisponível ou incompleta; não usa zero implícito.
- Diferença negativa permanece visível como anomalia.
- Timestamps de cada fonte permanecem separados; a tela não promete snapshot atômico entre Costs API e banco.
- Filtros por universo, conta e workload alteram somente o subtotal e o detalhamento internos. O total oficial e a reconciliação global permanecem identificados como organizacionais e não são rotulados como filtrados.

## 12. Superfície administrativa única

### 12.1. Conteúdo e interação

- Preservar período atual e personalizado, leitura sob demanda, links externos oficiais e proteção `requirePlatformAdmin()` na página e em cada Server Action.
- Apresentar, no nível global: gasto oficial, subtotal ativo calculável, histórico legado congelado e reconciliação global.
- Apresentar cobertura por ambiente/workload, exceções não atribuídas e operações sem custo calculável sem misturá-las com zero.
- Permitir filtros internos por universo, conta e workload, com resultado e escopo do filtro anunciados claramente.
- Detalhar execução e operação somente com IDs técnicos seguros, retry, modelo, effort, usage, custo/status e baseline quando fornecido.
- Não expor prompt, resposta integral, payload de negócio, URL de fonte, e-mail, nome pessoal, PII, secret, project/API key ID ou mensagem bruta do provider.

### 12.2. Acessibilidade focal — `prod#17`

- Filtros, atualização, totais, cobertura, indisponibilidade e detalhes devem ser operáveis por teclado.
- Foco deve permanecer visível e ser preservado após atualização ou expansão.
- Controles precisam de nome acessível, rótulos e associações programáticas.
- Cobertura, erro, anomalia e custo indisponível não podem depender apenas de cor ou hover.
- Contraste e alvos de toque seguem os critérios WCAG 2.2 aplicáveis ao fluxo real.
- Check automático é apoio; QA manual complementa e não alega conformidade WCAG integral.
- Validar desktop e mobile sem criar design system ou componente paralelo.

## 13. Configuração e rollout

### 13.1. Configuração mínima — `vercel#32`

- `OPENAI_ACTIVE_COST_TRACKING_ENABLED`: Config server-side por ambiente; somente o literal `true` habilita escrita ativa e nasce desligado.
- `OPENAI_COST_INGESTION_ENABLED`: Config não secreta do workflow; somente o literal `true` habilita o envio do `supabase_inspect` e nasce desligado.
- `OPENAI_COST_INGESTION_HMAC_SECRET`: Secret independente por ambiente/ingresso, disponível somente ao verificador Core e ao consumidor GitHub correspondente.
- `OPENAI_COST_INGESTION_URL`, `OPENAI_COST_INGESTION_PROTOCOL_VERSION`, `OPENAI_COST_INGESTION_ENVIRONMENT` e demais parâmetros não sensíveis de tolerância/gate: Config na Vercel ou variável não secreta no GitHub, com escopo mínimo e valor allowlisted.
- Todo material de assinatura/verificação é Secret; URL, versão, tolerância temporal e gates não sensíveis são Config.
- Nenhum valor é copiado entre ambientes por rotina, versionado, impresso, registrado em log, devolvido ao client ou incluído em evidência.
- Alteração de valor consumido pelo Core exige redeploy e validação do ambiente afetado.
- Não criar nova chave OpenAI, não reclassificar variáveis existentes e não copiar o arquivo de ambiente inteiro para a worktree.

### 13.2. Sequência pré e pós-merge

- Pré-merge: migration, código, testes, docs e UI no mesmo PR; gate ativo desligado; nenhuma mutação remota de schema ou secret.
- Pré-merge quando autorizado: inspeção read-only, `supabase migration list --linked` e `supabase db push --linked --dry-run`.
- Pós-merge: apply canônico automático da migration; snippet read-only; inspeção do Security Controls (`supa#2`); cadastro metadata-only das Configs/Secrets; redeploy dos ambientes afetados.
- Ativar `OPENAI_ACTIVE_COST_TRACKING_ENABLED` por ambiente somente depois de schema, credencial e recorder estarem disponíveis para os quatro workloads Core daquele ambiente; não alegar seletividade por workload inexistente.
- Após o gate ambiental, executar smoke de sucesso e falha financeira fail-open de cada workload Core e registrar individualmente seu único corte de cobertura.
- Ativar separadamente `OPENAI_COST_INGESTION_ENABLED` para `supabase_inspect` somente depois que ambiente/configuração catalogada, assinatura válida e rejeições de assinatura inválida, expirada e adulterada estiverem comprovados; após smoke real, registrar o corte desse workload.
- QA final em Preview/Production comprova total oficial, ativo, legado, reconciliação, filtros, exceções, indisponibilidade, retries, acesso positivo e negativo e ausência de dados sensíveis.

## 14. Fases executáveis

### 14.1. E21.5.3 — Atribuição e evidência por execução

- Objetivo: criar o ledger ativo, o recorder fail-open e o contexto econômico explícito para todos os workloads atuais.
- Entregas: migration e RPCs; contratos ativos; adapters de escrita; recorder; instrumentação dos quatro runtimes Core e das provas administrativas; ingresso HMAC e cliente do `supabase_inspect`; gate/configuração documentados.
- Critérios de aceite:
  - os cinco workloads catalogados têm produtor instrumentado;
  - runtime e prova administrativa permanecem distinguíveis por `execution_origin`, sem workload paralelo;
  - Cliente com conta, Cliente sem atribuição e LP Factory respeitam checks e não usam heurística;
  - duas operações cobradas podem pertencer à mesma execução;
  - retry cobrado liga nova operação à anterior; replay de persistência não duplica;
  - falhas de start, finish, timeout e resposta inválida do recorder não mudam o resultado funcional;
  - workflow não recebe `service_role` nem DSN mutável;
  - envelope do `supabase_inspect` valida ambiente, modelo, origem/revisão e effort não aplicável; SQL batch sem OpenAI não gera fato financeiro;
  - HMAC válida é aceita e inválida, expirada, futura ou adulterada é rejeitada;
  - migration não altera qualquer objeto `openai_lp_*`.

### 14.2. E21.5.4 — Cálculo e reconciliação de custos

- Objetivo: calcular custo terminal versionado, agregar o ledger ativo e reconciliar oficial, ativo e legado sem inventar valor.
- Entregas: pricing versionado; finalização financeira; read models ativos keyset; DTOs/agregadores; composição do dashboard e validadores focais.
- Critérios de aceite:
  - modelo, effort, usage, retry e baseline opcional permanecem rastreáveis por operação;
  - custo deriva somente de usage e snapshot de preço compatíveis;
  - uma e duas chamadas de Web Search são cobradas como unidades próprias além dos tokens, sem sobreposição;
  - ausência da tarifa de Web Search torna o custo integral da operação indisponível, sem subtotal parcial;
  - sem preço/usage produz `unavailable` e `cost_usd = null`, não zero;
  - história não é reprecificada;
  - paginação completa, decimal exato e cursor defensivo são comprovados;
  - reconciliação global usa `oficial - ativo - legado`, sem clamp;
  - filtros internos não alteram total oficial nem reconciliação global;
  - E21.4 permanece legível e inalterada.

### 14.3. E21.5.5 — Visão administrativa de custos

- Objetivo: evoluir `/admin/custos-openai` para consultar o controle ativo e o histórico legado na única superfície financeira.
- Entregas: Server Actions e página/componentes existentes; filtros; totais e timestamps; detalhes; estados de cobertura, exceção, indisponibilidade e anomalia; validações de autorização, conteúdo e acessibilidade.
- Critérios de aceite:
  - `platform_admin` consulta período, filtros e detalhes; papel comum não recebe dados;
  - total oficial, ativo calculável, legado e reconciliação são semanticamente distintos;
  - não atribuído, indisponível, retry, modelo, effort e baseline opcional ficam visíveis sem expor dados sensíveis;
  - desktop e mobile permanecem legíveis;
  - fluxo completo funciona por teclado, preserva foco e não depende apenas de cor;
  - atualização sob demanda não cria polling, cache periódico, job ou automação.

## 15. Validações e evidências

### 15.1. Gates locais por subseção

- Executar `npm ci` uma vez no início do lote contínuo e repetir somente se dependências, lockfile ou instalação mudarem.
- Executar validadores focais da subseção e `npm run check` antes de cada gate do Analista.
- Executar `git diff --check` e revisar `main..HEAD` e `main...HEAD` antes de publicação.
- E21.5.3: testes unitários do recorder/protocolo/consumidores, teste SQL transacional e inspeção de que `openai_lp_*` não aparece no diff da migration.
- E21.5.4: fixtures de Cliente, LP Factory, não atribuído, retry, replay, falha, custo indisponível, Web Search com uma e duas chamadas, tarifa de ferramenta ausente, múltiplas páginas e decimal exato.
- E21.5.5: validações de Server Action/DTO/componentes, papel positivo/negativo, desktop/mobile, teclado, foco, nome acessível, contraste e estados sem dependência exclusiva de cor.

### 15.2. Evidência hospedada e pós-merge

- Preview com gate desligado deve preservar a superfície e explicitar ausência de cobertura ativa sem quebrar a leitura oficial/histórica.
- Após apply, snippet e Security Controls comprovam schema, RLS, policies, ACLs, grants, triggers e funções.
- Smokes reais cobrem os cinco workloads e confirmam resultado funcional preservado quando o recorder falha.
- Metadata de Vercel/GitHub comprova apenas nomes, tipo Secret/Config e escopo, sem valores.
- QA hospedado comprova filtros e totais coerentes, cobertura por unidade, reconciliação e não exposição de prompt, resposta, payload, PII ou secrets.
- Ausência de recurso externo obrigatório impede declarar o PR pronto para merge, mas não bloqueia a produção dos artefatos candidatos com gates desligados.

## 16. Classificação dos acréscimos técnicos

| Acréscimo | Classe | Origem e tratamento |
| --- | --- | --- |
| Boundary ativo em `lib/openai-costs/` e preservação de `lib/openai-workloads/` | derivação técnica da V1 | `GE-E21.5-01`, incorporar |
| Ledger novo de execuções, operações e cobertura | derivação técnica da V1 | `GE-E21.5-02..04`, incorporar sem tocar E21.4 |
| RPCs, RLS, grants, triggers, índices e keyset | derivação técnica da V1 | `GE-E21.5-03`, `GE-E21.5-10`, incorporar |
| Recorder best-effort aguardado e fail-open | derivação técnica da V1 | `GE-E21.5-08`, incorporar |
| Ingresso HMAC para `supabase_inspect` | derivação técnica da V1 | `GE-E21.5-04..05`, incorporar |
| Pricing temporal e snapshot imutável | derivação técnica da V1 | `GE-E21.5-06`, incorporar |
| Cobrança explícita de Web Search por chamada | derivação técnica da V1 | correção objetiva da Passagem 1; fechar toda unidade cobrável vigente |
| Origem `runtime` ou `administrative_proof` | derivação técnica da V1 | correção objetiva da Passagem 1; distinguir prova sem workload paralelo |
| Protocolo ambiental/configuração do `supabase_inspect` | derivação técnica da V1 | correção objetiva da Passagem 1; representar o workload operacional sem contar SQL batch |
| Gates por ambiente/ingresso e cobertura persistida por workload | derivação técnica da V1 | correção objetiva da Passagem 1; remover seletividade e evidência não consumível |
| Composição oficial + ativo + legado | derivação técnica da V1 | `GE-E21.5-07..09`, incorporar |
| Classificação Secret/Config do ingresso | modernização técnica justificada | `vercel#32`, patch autossuficiente, impacto estrutural baixo |
| WCAG 2.2 focal na superfície existente | modernização técnica justificada | `prod#17`, patch autossuficiente, impacto estrutural baixo |
| Security Controls pós-apply | derivação técnica da V1 | `supa#2`, validação complementar já prevista |
| AI Gateway, rlsautotest, CDC e Trace Context | ampliação de escopo | `vercel#1`, `supa#63`, `supa#64`, `supa#69`; não implementar |

## 17. Riscos e critérios de parada

### 17.1. Riscos controlados

- Drift de pricing: versão, vigência e snapshot; ausência de confirmação vira custo indisponível.
- Perda do recorder: log seguro e reconciliação evidenciam cobertura incompleta sem bloquear o produto.
- Replay do ingresso: HMAC, timestamp, envelope versionado e IDs idempotentes.
- Fontes sem snapshot atômico: timestamps separados e estado provisório explícito.
- Ativação parcial: cobertura e corte por ambiente/workload; nenhuma alegação global antecipada.
- Volume futuro: keyset e agregação incremental; CDC/warehouse somente após gatilho e novo confronto estrutural.

### 17.2. Critérios de parada

- Parar se a implementação exigir alterar objetos `openai_lp_*`, executar PB 2 ou remover comportamento legado.
- Parar se um workload atual não puder fornecer contexto econômico sem decisão funcional nova.
- Parar se preço oficial necessário não puder ser confirmado; preservar a operação como indisponível e continuar as partes independentes.
- Parar antes de ativar gate, registrar corte ou declarar prontidão sem apply, Security Controls, smokes e QA obrigatórios.
- Mudança material fora desta V2 retorna ao Analista e, quando necessário, ao supervisor competente; não reiniciar especialistas por precaução.

27/08/2026 — Plano-base v1 — E21.4 — Visibilidade financeira e atribuição de custos OpenAI

Status: plano-base v1 consolidado após debate humano e avaliação pré-v1 do Analista.

## 1. Estado e decisões fixas

### 1.1. Recorte e objetivo

- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.4 — Visibilidade financeira e atribuição de custos OpenAI`.
- Prioridade: imediata, antes da retomada da E21.3.4.
- Objetivo: permitir ao `platform_admin` conhecer o gasto oficial OpenAI do período, entender quanto desse gasto pertence economicamente à LP Factory ou aos clientes e, quando houver evidência causal suficiente, aprofundar a atribuição até conta, Landing Page e workload.
- Finalidade de negócio: apoiar gestão de custo, margem, precificação futura e decisões de otimização sem depender de estimativas tratadas como gasto oficial.
- Plano conceitual: N/A.

### 1.2. Autoridades financeiras e técnicas

- **Costs API da OpenAI** é a autoridade do **gasto financeiro oficial total em USD** para a organização e o período consultados.
- O total oficial deve representar 100% do valor retornado pela fonte oficial para o período, independentemente da cobertura interna de atribuição.
- **Usage APIs da OpenAI** são autoridade de usage oficial por modalidade e podem fornecer dimensões técnicas como projeto, API key, modelo e outras suportadas por cada endpoint.
- Usage oficial e custo oficial são grandezas relacionadas, mas não intercambiáveis; Usage não substitui Costs para autoridade financeira.
- Cliente, Landing Page e workload são dimensões de **atribuição interna reconciliada da LP Factory**, não custos oficiais individualizados pela OpenAI.
- A apresentação não deve chamar custo por cliente, LP ou workload de “custo oficial OpenAI”.
- O `Costs API` vigente suporta filtros por `project_ids` e `api_key_ids` e agrupamento por `project_id`, `line_item` e `api_key_id`.
- A leitura oficial de Costs/Usage exige Admin API Key da organização; `OPENAI_API_KEY` de runtime não substitui essa credencial.

### 1.3. Dependência de credencial administrativa

- `OPENAI_ADMIN_KEY` é pré-requisito obrigatório para concluir a entrega principal da E21.4, pois sem autoridade oficial de Costs/Usage não existe reconciliação financeira confiável.
- Apenas Organization Owners podem criar Admin API Keys da API Platform.
- O valor da chave nunca deve ser versionado, logado, enviado ao client ou persistido em banco.
- A v2 deve definir o menor escopo e a plataforma autorizada para armazenar a credencial, preservando uso exclusivamente server-side.
- Com a credencial ausente ou inválida, a leitura oficial deve falhar fechada e a E21.4 não pode ser declarada concluída.

### 1.4. Regra de responsabilidade econômica

- A classificação econômica responde **quem originou causalmente o consumo**, não apenas qual workload foi executado.
- Categorias canônicas:
  - **LP Factory:** aquisição/pré-venda, usuário ainda não contratado, desenvolvimento, Preview, QA, testes, provas administrativas, comparações experimentais, operação interna, preparação compartilhada e demais consumos não causados por um cliente contratado identificável;
  - **Cliente/conta:** consumo causado por ação, necessidade ou atendimento identificável de cliente contratado;
  - **Não atribuído/reconciliação:** parcela do gasto oficial cuja origem causal interna não pode ser comprovada com segurança.
- `Não atribuído` é estado de reconciliação, não categoria econômica permanente.
- A classificação técnica existente `product_runtime` versus `operational` não determina automaticamente responsabilidade econômica.
- O mesmo workload pode ter responsabilidade econômica diferente conforme o contexto: geração de LP real para conta contratada é custo de cliente; a mesma geração em Preview, QA, prova ou teste é custo da LP Factory.
- Atribuição econômica ao cliente não significa cobrança separada; franquia, limite, markup, repasse e política comercial ficam fora da E21.4.

### 1.5. Autoridade para considerar uma conta como cliente

- No MVP, uma conta passa a ter consumo economicamente atribuível como **Cliente/conta** quando existe **entitlement comercial efetivo**, conforme autoridade canônica da E9.
- O entitlement efetivo exige origem comercial válida `plano_pago_confirmado`, status comercial ativo e vigência válida.
- `accounts.status`, membership, `accounts.plan_id` ou `public.plans` isoladamente não transformam consumo em custo de cliente.
- Conta e membership continuam sendo autoridades independentes de acesso operacional; não substituem o entitlement comercial.
- A responsabilidade econômica deve refletir o estado efetivo no momento da execução do consumo, sem reclassificar retrospectivamente o histórico apenas porque o entitlement mudou depois.
- Trial ou liberação manual somente passam a produzir responsabilidade econômica de cliente quando essas origens forem efetivamente aprovadas e incorporadas ao contrato comercial canônico em recorte próprio.

### 1.6. Regra mínima de evidência para atribuição

- Atribuir apenas até a profundidade sustentada por autoridade causal real do contexto de execução.
- Se a categoria econômica é conhecida e nenhuma conta é autorizadamente conhecida, parar em **LP Factory** ou **Não atribuído**, conforme o caso.
- Se a conta cliente é conhecida por autoridade real, atribuir à **conta**, mesmo que nenhuma LP específica exista.
- Se `landingPageId` é conhecido por contexto autorizado, aprofundar para a **Landing Page**.
- Se o workload executado é conhecido pelo runtime, aprofundar para o **workload**.
- Conta conhecida sem LP deve aparecer como **outros consumos da conta**, não como `Não atribuído`.
- Não inferir cliente, LP ou workload por horário, proximidade entre chamadas, modelo, volume de tokens ou heurística equivalente.
- Gasto oficial sem correlação causal interna suficiente deve permanecer em **Não atribuído/reconciliação**.

### 1.7. Histórico e data de corte

- O MVP não promete reconstrução retroativa completa por cliente, LP ou workload.
- A cobertura confiável de atribuição cliente/LP/workload começa na **data de ativação da instrumentação E21.4 em Production**.
- Períodos anteriores podem continuar exibindo o gasto oficial da OpenAI, desde que a interface não apresente cobertura parcial existente como atribuição integral.
- Evidências históricas atuais de materializações de LP podem ser usadas para investigação e validação, mas não autorizam, no MVP, uma visão histórica completa por cliente/LP.
- A v2 deve definir como registrar explicitamente a data de corte e impedir mistura visual entre período coberto e não coberto.

### 1.8. Período, atualização, moeda e atualidade

- A visão abre por padrão no **mês atual**.
- Deve permitir **período personalizado** como segunda opção do MVP.
- Atualização inicial: **sob demanda**, acionada pelo humano.
- Automação recorrente, sincronização periódica e coleta agendada ficam fora do MVP.
- Moeda financeira do MVP: exclusivamente **USD (US$)**.
- BRL, câmbio, spread e IOF ficam fora do recorte.
- O mês atual deve ser apresentado como **Provisório**, acompanhado de `Atualizado em [data/hora]`.
- Períodos anteriores podem ser apresentados como **Período encerrado**, sempre com a última atualização oficial disponível, sem afirmar fechamento contábil imutável.
- O `Costs API` vigente trabalha com buckets de custo de `1d`; atualização sob demanda não implica valor financeiro instantaneamente fechado.

### 1.9. Usage, custo, reconciliação e créditos

- O MVP preserva duas réguas complementares:
  - **usage técnico**, usando tokens e demais unidades oficiais adequadas a cada modalidade;
  - **custo financeiro em USD**, reconciliado contra Costs.
- A relação canônica da visão é:
  - **Gasto oficial total = LP Factory + Clientes + Não atribuído/reconciliação**.
- A soma interna nunca deve ser ajustada artificialmente para “bater” com Costs.
- Diferenças precisam permanecer visíveis e explicáveis.
- O ideal é conciliar também crédito/saldo acompanhado internamente com saldo/crédito oficial da OpenAI quando ambas as fontes forem confiáveis.
- A conciliação automática de saldo/créditos é condicionada à existência de fonte oficial programática adequada.
- Se nenhuma fonte oficial programática de saldo/créditos for confirmada, essa conciliação fica **fora dos critérios obrigatórios de aceite** e não bloqueia a E21.4.
- Não inferir saldo oficial por `créditos adquiridos - custo calculado`.

### 1.10. Acesso e residência

- A superfície é exclusivamente administrativa e acessível somente a `platform_admin`.
- A residência conceitual aprovada é uma superfície própria **Custos OpenAI**, separada de **Configuração OpenAI** e **Testes OpenAI**.
- A rota física não é definida na v1; a v2 deve escolher o path aderente à estrutura administrativa real do projeto.
- Hierarquia principal da UX:
  - Gasto OpenAI total;
  - LP Factory;
  - Clientes;
  - Não atribuído/reconciliação.
- Dentro de **Clientes**:
  - conta;
  - Landing Pages ou outros consumos da conta;
  - workload.
- Cada nível financeiro mostra USD; o detalhamento pode mostrar também a unidade técnica pertinente, como tokens ou imagens/requisições.

## 2. Contrato do caso

### 2.1. Fluxo canônico

- **Gatilho:** `platform_admin` abre Custos OpenAI e solicita atualização do mês atual ou de período personalizado.
- **Entrada:** período, autoridade `platform_admin`, leitura oficial Costs/Usage e evidências internas de atribuição disponíveis para o mesmo período.
- **Processamento:** obter gasto oficial completo; obter usage oficial aplicável; agregar evidências internas por responsabilidade econômica; aprofundar somente até a autoridade comprovada; calcular diferença de reconciliação.
- **Validação:** rejeitar leitura oficial incompleta, erro de paginação, credencial administrativa ausente/inválida, intervalo inválido ou classificação interna sem autoridade causal suficiente.
- **Persistência:** a v1 exige evidência prospectiva suficiente para atribuir inclusive consumos que falhem antes de materialização final; o menor mecanismo persistente será definido na v2 a partir das estruturas reais do projeto.
- **Consumo:** superfície Custos OpenAI apresenta total oficial e decomposição interna reconciliada, sem esconder cobertura parcial ou diferença.
- **Fallback:** se a fonte oficial falhar, não substituir silenciosamente por preço tabelado ou estimativa; mostrar indisponibilidade da leitura oficial. Se apenas uma atribuição interna não puder ser provada, preservar o valor oficial e mover apenas essa parcela para `Não atribuído/reconciliação`.

### 2.2. Evidência atual do projeto

- A geração de LP já possui `accountId` e `landingPage.id` no contexto autorizado v4; portanto a origem conta/LP existe no ponto de execução e não precisa ser inferida.
- Materializações concluídas preservam `attemptId`, `requestId`, contexto de geração, configuração dos workloads e usage textual; custos permanecem indisponíveis no snapshot atual.
- Tentativas que consomem OpenAI e falham antes da materialização podem gerar custo sem deixar a mesma evidência persistente por cliente/LP.
- O histórico atual é, portanto, parcial para finalidade financeira.
- Mapa econômico inicial dos workloads atuais:
  - `niche_resolution`: LP Factory no fluxo vigente de onboarding/pré-contrato;
  - `commercial_activation_draft_generation`: LP Factory;
  - `taxon_input_catalog_sufficiency_evaluation`: LP Factory;
  - `supabase_inspect`: LP Factory;
  - `landing_page_draft_generation` e `landing_page_draft_image_generation`: Cliente/conta quando executados para LP real de conta com entitlement efetivo; LP Factory em desenvolvimento, Preview, QA, prova ou teste.

### 2.3. Fontes usadas

- `README.md` — visão do MVP e simplicidade proporcional.
- `docs/roadmap.md` — prioridade e objetivo da E21.4.
- `docs/template-roadmap.md` — hierarquia do recorte.
- `docs/prompt-estrategista.md` — fluxo de plano-base.
- `docs/platform-config.md` — configuração OpenAI vigente e secrets por nome.
- `docs/lousa-plano-base-e9.md` — autoridade de elegibilidade/entitlement comercial.
- `lib/openai-workloads/contracts.ts`, `lib/openai-workloads/observability.ts` e `lib/openai-workloads/registry.ts` — contratos e observabilidade atuais.
- `lib/lp-builder/generationContextContracts.ts`, `lib/lp-builder/landingPageDraftGeneration.ts`, `lib/lp-builder/landingPageDraftImageGeneration.ts`, `lib/lp-builder/landingPageRevision.ts` e adapters correlatos — contexto e evidência atual de geração de LP.
- Documentação oficial OpenAI vigente de Costs, Usage, Admin API Keys e billing pré-pago.

## 3. Fases e próxima ação

### 3.1. E21.4.3 — Autoridade oficial de Costs e Usage

- Objetivo: disponibilizar leitura oficial sob demanda do gasto completo e do usage relevante para o período solicitado.
- Automação: não.
- Entrada: período, sessão `platform_admin` e `OPENAI_ADMIN_KEY` server-side.
- Processamento: consultar Costs como autoridade financeira e Usage APIs como autoridade técnica, com paginação completa e agrupamentos somente quando úteis à reconciliação.
- Validação:
  - credencial administrativa válida;
  - período válido;
  - leitura completa e fail-closed;
  - total em USD;
  - nenhum secret ou payload sensível exposto ao client/log.
- Persistência: nenhuma persistência periódica obrigatória nesta fase; leitura permanece sob demanda, salvo decisão técnica mínima da v2 indispensável à operação.
- Fallback: indisponibilidade explícita, sem substituir Costs por estimativa local.
- Critério de aceite: `platform_admin` consegue obter o gasto oficial completo do período e usage oficial suportado; ausência de `OPENAI_ADMIN_KEY` bloqueia a conclusão da fase.

### 3.2. E21.4.4 — Evidência prospectiva e atribuição causal

- Objetivo: garantir que novos consumos OpenAI possam ser atribuídos com autoridade até LP Factory ou cliente e, quando aplicável, conta, LP e workload, inclusive quando a tentativa falhar antes da materialização final.
- Automação: não.
- Entrada: contexto autorizado existente no ponto de execução, workload, ambiente, IDs de correlação, usage disponível e autoridade comercial efetiva da conta quando aplicável.
- Processamento: classificar responsabilidade econômica no momento da execução e preservar apenas a profundidade de atribuição comprovada.
- Validação:
  - nenhuma heurística de cliente/LP;
  - entitlement efetivo conforme E9 para classificação de cliente;
  - Preview/QA/testes classificados como LP Factory;
  - falhas pagas não desaparecem da evidência apenas por ausência de materialização final;
  - data de corte de cobertura prospectiva explícita.
- Persistência: a v2 deve escolher a menor forma persistente compatível com a arquitetura real e suficiente para consulta financeira e reconciliação; não criar duplicação de dados sem necessidade.
- Fallback: profundidade não comprovada para no nível anterior; ausência de correlação causal suficiente envia a parcela a `Não atribuído/reconciliação`.
- Critério de aceite: a partir da data de corte, consumos abrangidos pelo MVP possuem evidência causal auditável e não dependem de reconstrução heurística posterior.

### 3.3. E21.4.5 — Custos OpenAI e reconciliação administrativa

- Objetivo: entregar ao `platform_admin` a visão financeira hierárquica e reconciliada do MVP.
- Automação: não.
- Entrada: Costs/Usage oficiais e evidência interna prospectiva do mesmo período.
- Processamento: apresentar total oficial, LP Factory, Clientes e Não atribuído; permitir aprofundamento de Clientes em conta → LP/outros consumos → workload.
- Validação:
  - total oficial nunca reduzido à cobertura interna conhecida;
  - relação `Total oficial = LP Factory + Clientes + Não atribuído` preservada;
  - período atual marcado `Provisório` e atualizado em data/hora;
  - períodos anteriores sem falsa promessa de fechamento contábil definitivo;
  - histórico pré-data de corte não apresentado como cobertura integral;
  - acesso negativo sem exposição administrativa;
  - estados loading, vazio, erro oficial, parcial/não atribuído e sucesso reconhecíveis;
  - desktop e mobile sem overflow horizontal e com controles/semântica aderentes ao design system.
- Persistência: sem cache periódico ou job no MVP; usar somente a persistência mínima definida para a evidência de atribuição.
- Fallback: falha de Costs torna a visão oficial indisponível; falha apenas de atribuição interna preserva o total oficial e evidencia `Não atribuído`.
- Saldo/créditos: exibir conciliação apenas se fonte oficial programática confiável for confirmada; sua ausência não reprova a fase.
- Critério de aceite: o humano consegue responder quanto a OpenAI reporta como gasto no período, quanto foi atribuído à LP Factory, quanto aos clientes e qual diferença permanece não atribuída, aprofundando clientes até a evidência disponível.

### 3.4. Próxima ação

- Submeter este plano-base v1 às avaliações previstas pelo Prompt Estrategista antes da v2/implementação.
- O detalhamento de schema, persistência, rota, adapter oficial, configuração da Admin API Key e casos de teste pertence à v2.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do MVP E21.4

- Conversão para BRL, cotação, spread ou IOF.
- Cálculo de margem, preço de plano, cobrança, markup ou repasse ao cliente.
- Reconstrução histórica integral anterior à data de corte.
- Rateio artificial de custo LP Factory entre clientes.
- Atualização recorrente, cron, job ou sincronização automática.
- Retomada da E21.3.4.
- Persistência de payloads OpenAI completos, prompts, respostas integrais ou secrets para finalidade financeira.
- Criação de infraestrutura maior que a mínima necessária para evidência causal e leitura administrativa.
- Conciliação automática de saldo/créditos quando não houver fonte oficial programática adequada.

### 4.2. Critérios de parada

- Parar se a autoridade oficial de Costs/Usage não puder ser acessada com uma Admin API Key de escopo seguro.
- Parar se uma proposta exigir inferir cliente/LP por heurística em vez de contexto autorizado.
- Parar se a solução exigir alterar o contrato comercial da E9 para viabilizar classificação econômica.
- Parar e retornar ao humano se a menor persistência necessária implicar nova infraestrutura material além das estruturas normais do Core ou ampliar o escopo para cobrança/margem.
- Não declarar a E21.4 concluída sem leitura oficial de Costs e sem atribuição prospectiva confiável a partir da data de corte.
- A ausência de API oficial de saldo/créditos, isoladamente, não é critério de parada nem bloqueio do MVP.

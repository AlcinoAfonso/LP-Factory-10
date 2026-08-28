28/08/2026 — Plano-base v2 — E21.4 — Visibilidade financeira mínima de custos OpenAI

Status: plano-base v2 consolidado após redução humana explícita do MVP em 28/08/2026; pendente do gate do Analista antes da implementação.

## 1. Estado e decisões fixas

### 1.1. Recorte e objetivo

- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.4 — Visibilidade financeira e atribuição de custos OpenAI`.
- Prioridade: imediata, antes da retomada da E21.3.4.
- Objetivo do MVP reduzido: permitir ao `platform_admin` conhecer o gasto oficial OpenAI do período e o custo prospectivo calculado das Landing Pages geradas, agregado por conta e detalhado por Landing Page e pelos dois workloads atuais de geração.
- Workloads incluídos: `landing_page_draft_generation` e `landing_page_draft_image_generation`.
- Relação canônica: **Gasto oficial total = custos prospectivos calculados das LPs + Outros gastos / reconciliação**.
- Princípio obrigatório: priorizar redução e simplicidade; implementar a menor solução que permita saber quanto a OpenAI gastou no total e quanto custou prospectivamente cada conta/LP gerada.
- Plano conceitual: N/A.
- Fonte v1 congelada: PR #824, merge commit `428e01d81e819b5da9e508e1c4f356f0517c9c85`, blob `1f3192c24615fcf87f0aa0173fe117437241f7a8` de `docs/lousa-plano-base-e21-4.md`.

### 1.2. Autoridades e nomenclatura financeira

- A **Costs API da OpenAI** é a única autoridade do **gasto financeiro oficial total em USD** para a organização e o período consultados.
- O total oficial representa 100% do valor retornado pela fonte oficial; a cobertura interna das LPs nunca limita esse total.
- O custo textual de uma LP é calculado prospectivamente a partir do usage da chamada e de preços versionados para `modelo + service tier efetivo + faixa de contexto`, cobrindo separadamente entrada ordinária, entrada em cache, escrita de cache quando aplicável e saída.
- A entrada ordinária é derivada sem sobreposição (`input_tokens - cached_input_tokens - cache_write_tokens`); valores negativos ou dimensões sobrepostas invalidam o cálculo. Tokens de raciocínio já incluídos em `output_tokens` não são cobrados novamente.
- O custo de imagem soma o custo dos tokens de texto de entrada do prompt, conforme usage real e preço textual compatível, ao custo de saída da imagem pela combinação versionada `modelo + tamanho + qualidade + quantidade`. Se a resposta não fornecer unidade necessária, ou trouxer modalidade de entrada sem preço compatível, a tentativa fica sem custo calculado e fora da soma das LPs; não se publica custo parcial de imagem.
- A tabela de preço é um contrato versionado no código, limitado às combinações efetivamente usadas pelos dois workloads, com taxas em decimal exato ou unidade inteira mínima de USD e sem arredondamento intermediário. A evidência terminal persiste versão, modelo, service tier, faixa de contexto, unidades, taxas aplicadas e custo calculado em USD.
- Com a instrumentação ativa, a configuração solicitada e todas as dimensões de preço que ela pode produzir precisam estar cobertas antes da chamada; combinação incompatível ou desconhecida falha fechada.
- Valores por conta, LP e workload são sempre rotulados como **custo prospectivo calculado**, nunca como custo oficial individualizado pela OpenAI.
- **Outros gastos / reconciliação** é a diferença aritmética, sem clamp e sem redistribuição: `gasto oficial total - soma dos custos prospectivos calculados das LPs`.
- Diferença negativa ou cobertura incompleta permanece visível como anomalia de reconciliação; não ajustar valores internos artificialmente para fazer o total fechar.
- A afirmação da v1 de filtro/agrupamento de Costs por `api_key_id` não integra a v2: a implementação usa somente dimensões confirmadas na documentação e na resposta real vigente.

### 1.3. Credencial administrativa e leitura oficial

- `OPENAI_ADMIN_KEY` é obrigatória para a leitura oficial de Costs; `OPENAI_API_KEY` de runtime não a substitui.
- A chave reside somente como secret server-side do projeto Core na Vercel, obrigatoriamente em Production e em Preview apenas mediante autorização operacional humana específica para a prova hospedada.
- A chave nunca é versionada, logada, enviada ao client, persistida no banco ou reutilizada fora dos endpoints read-only previstos.
- Endpoint administrativo do MVP: somente `GET /v1/organization/costs`.
- O provider server-side usa timeout, limite de páginas, detecção de cursor repetido, validação estrutural e paginação até `has_more = false`.
- Ausência, invalidez, timeout, resposta incompleta, moeda diferente de USD ou paginação inconsistente tornam a leitura oficial indisponível; não há fallback para preço local, cache anterior ou chave de runtime.
- Antes da conclusão hospedada, uma resposta real sanitizada de Costs comprova organização correta, moeda, shape e paginação sem registrar chave, IDs sensíveis ou payload bruto.

### 1.4. Evidência prospectiva mínima das LPs

- A atribuição usa exclusivamente `accountId` e `landingPageId` já presentes no contexto autorizado da geração de LP; nenhum cliente ou LP é inferido por horário, modelo, volume, proximidade de chamadas ou heurística.
- O MVP não realiza classificação econômica completa `LP Factory × Cliente × Não atribuído` e não consulta entitlement comercial para classificar outros consumos.
- Somente chamadas em **Production** dos dois workloads incluídos compõem o custo prospectivo das LPs. Development, Preview, QA, provas, onboarding, taxon, workloads administrativos e automações permanecem em **Outros gastos / reconciliação** por diferença contra o total oficial.
- Cada tentativa abrangida recebe `attempt_id` estável. A chave lógica `(attempt_id, workload, event_kind)` admite exatamente um evento inicial e no máximo um terminal por `(attempt_id, workload)`; retries reutilizam a identidade e não duplicam chamadas, terminais ou soma financeira.
- O início registra, antes da chamada, conta, LP, workload, ambiente, configuração efetiva, instante e versão do preço.
- O resultado terminal registra somente metadados seguros: correlação, sucesso/falha, usage normalizado aplicável, service tier e faixa de contexto efetivos, unidades de texto e imagem, quantidade de imagens, custo calculado, taxas/versão de preço e timestamps.
- Prompt, resposta integral, payload de negócio, secret, e-mail, nome de pessoa e PII não são persistidos para finalidade financeira.
- Se o resultado terminal não puder ser gravado depois da chamada, a tentativa inicial permanece reconhecível como `resultado desconhecido`; seu valor não entra na soma calculada e permanece em Outros gastos / reconciliação.
- Com a instrumentação ativa, falha ao registrar a evidência inicial impede a chamada OpenAI. Com o gate desligado, o comportamento atual é preservado sem alegar cobertura financeira.

### 1.5. Persistência, rollout e data de corte

- Criar residência financeira dedicada e mínima no Supabase; não reutilizar `account_landing_page_materializations`, tabelas de configuração E21.2 ou `audit_logs` como autoridade financeira.
- O contrato usa eventos append-only para início e término da tentativa, correlacionados por ID estável, e um registro imutável da ativação de cobertura em Production.
- A migration habilita RLS, mantém zero policies de client, revoga `public`, `anon`, `authenticated` e `ai_readonly`, concede ao `service_role` somente `SELECT` e `INSERT`, nega `UPDATE`, `DELETE` e `TRUNCATE`, limita RPCs ao `service_role` e usa `security_invoker = true` em qualquer view exposta.
- A migration acompanha teste SQL e snippet read-only versionados para constraints, RLS, ausência de policies, ACLs, GRANTs, append-only, correlação e unicidade da data de corte.
- O gate `OPENAI_LP_COST_TRACKING_ENABLED` nasce desligado e somente o literal `true` habilita a instrumentação server-side.
- E21.4.3, E21.4.4 e E21.4.5 são implementadas no mesmo PR com migration, código, testes e documentação, mantendo o gate desligado e sem mutação remota pré-merge.
- Sequência pós-merge obrigatória: apply canônico da migration → snippet read-only → Security Controls → ativação controlada do gate em Production → redeploy → smoke → registro único da data de corte → QA hospedado.
- O runtime não depende da nova residência antes do apply aprovado.
- A cobertura confiável começa na data de corte imutável de Production. Períodos anteriores ou que cruzem o corte exibem gasto oficial, mas declaram cobertura interna parcial.

### 1.6. Período, atualização e moeda

- A visão abre no mês atual e oferece período personalizado como segunda opção.
- Os intervalos usam fronteiras técnicas UTC `[start_time, end_time)`, alinhadas aos Unix timestamps e buckets diários da fonte oficial; isso reduz conversões e não cria camada financeira de timezone no MVP.
- O período personalizado exige datas válidas, início anterior ao fim e limite proporcional ao endpoint oficial; nenhum intervalo futuro é consultado.
- Atualização é exclusivamente sob demanda, acionada por `platform_admin`.
- Não há cron, job, polling, sincronização recorrente ou cache financeiro periódico.
- Moeda exclusiva: USD (US$).
- Mês atual é rotulado `Provisório` e mostra `Atualizado em [data/hora]`; períodos anteriores são `Período encerrado`, sem alegar fechamento contábil imutável.

### 1.7. Acesso, arquitetura e residência

- Criar o domínio transversal Core `lib/openai-costs/`: `contracts.ts` para API pública e DTOs; `providers/` somente para Costs; `adapters/` para Supabase; `pricing.ts` para combinações dos dois workloads; `index.ts` para exports públicos.
- Criar a superfície própria `/admin/custos-openai`, com Server Actions e componentes dependentes em `app/admin/(protected)/custos-openai/`.
- Preservar `/admin/workloads-openai` e `lib/openai-workloads/`; esses boundaries não recebem chamadas administrativas de Costs, persistência financeira ou cálculo monetário.
- Reutilizar de `lib/openai-workloads/` somente identidades, configuração efetiva e normalização pública de usage já existente.
- A rota e cada Server Action reexecutam `requirePlatformAdmin()` antes de leitura privilegiada.
- A UI não acessa Supabase ou OpenAI diretamente e recebe somente DTO sanitizado, sem project IDs, API key IDs ou payload bruto.
- Hierarquia mínima: Gasto oficial total; Custos prospectivos calculados das LPs; Outros gastos / reconciliação; contas → Landing Pages → texto e imagem.
- Alvos documentais e de navegação obrigatórios: registrar `OPENAI_ADMIN_KEY`, `OPENAI_LP_COST_TRACKING_ENABLED`, endpoint e residência em `docs/platform-config.md`; registrar objetos, RLS, grants, corte e estado de apply em `docs/schema.md`; manter o estado canônico em `docs/roadmap.md` pelos ABCs; incluir a nova superfície no mecanismo existente de navegação administrativa, atualmente `components/admin/adminNavigation.ts`.

## 2. Contrato do caso

### 2.1. Fluxo canônico

- **Gatilho:** `platform_admin` abre Custos OpenAI e solicita atualização do mês atual ou de período personalizado.
- **Entrada:** período UTC validado, sessão `platform_admin`, leitura oficial de Costs e eventos prospectivos das duas gerações de LP no mesmo intervalo.
- **Processamento:** obter o total oficial completo; somar custos calculados terminais cobertos; agregar por conta, LP e workload; calcular Outros gastos / reconciliação por diferença aritmética.
- **Validação:** rejeitar credencial ausente/inválida, período inválido, moeda não USD, leitura incompleta, paginação inconsistente, evento sem contexto autorizado, combinação sem preço ou exposição de dados internos.
- **Persistência:** registrar início antes da chamada e término append-only depois; registrar uma única data de corte de Production.
- **Consumo:** apresentar total oficial, total calculado das LPs, Outros gastos / reconciliação e detalhamento por conta/LP/workload, sempre distinguindo oficial de calculado.
- **Fallback:** falha de Costs torna a visão indisponível. Evento incompleto ou sem custo calculável não é inventado nem redistribuído.

### 2.2. Evidência atual do projeto

- A geração textual já recebe o contexto autorizado v4 com `accountId` e `landingPage.id`.
- A geração de imagem ocorre no mesmo fluxo de revisão e recebe os mesmos IDs por parâmetro explícito, sem consulta ou inferência paralela.
- Os dois runtimes já emitem eventos normalizados de texto e imagem, mas somente em log; isso não é persistência financeira.
- Materializações concluídas não cobrem tentativas pagas que falham antes do resultado final.
- `lib/openai-workloads/` já resolve configuração e normaliza usage; a E21.4 adiciona somente wrapper financeiro server-side e residência dedicada.
- A leitura oficial não possui dimensão nativa de conta ou LP; os valores detalhados são custos prospectivos calculados internos e a diferença permanece explícita.

### 2.3. Fontes usadas

- `README.md`, `docs/roadmap.md`, `docs/template-roadmap.md`, `docs/base-tecnica.md`, `docs/platform-config.md` e `docs/schema.md`.
- `lib/openai-workloads/` e os contratos/transports atuais em `lib/lp-builder/`.
- Documentação oficial vigente da OpenAI para Costs, Admin API Keys, Pricing e geração de imagens.
- Parecer estrutural do blob v1 — `GE-E21.4-01` a `GE-E21.4-08`.
- Parecer de Updates do blob v1 — `prod#19`, `prod#16`, `prod#17`, `vercel#1` e `supa#64`.
- Decisão humana de 28/08/2026 — redução imediata do MVP ao total oficial e aos custos prospectivos das LPs.

## 3. Fases e próxima ação

### 3.1. E21.4.3 — Autoridade oficial de Costs

- Objetivo: disponibilizar leitura oficial sob demanda do gasto total OpenAI do período.
- Automação: não.
- Entrada: período UTC validado, sessão `platform_admin` e `OPENAI_ADMIN_KEY` server-side.
- Processamento: consultar Costs sem filtro que reduza o total; paginar e somar USD; retornar DTO sanitizado.
- Validação: parser estrito de período/respostas; timeout e paginação defensiva; nenhum secret/ID sensível/payload bruto; casos focais de sucesso, vazio, HTTP/provider, timeout, moeda inválida e paginação inconsistente; prova hospedada autorizada com resposta real sanitizada.
- Persistência: nenhuma; leitura sob demanda.
- Fallback: indisponibilidade explícita, sem preço local, cache ou `OPENAI_API_KEY`.
- Critério de aceite: `platform_admin` obtém o gasto oficial total em USD do período e falhas são reconhecíveis e fail-closed.

### 3.2. E21.4.4 — Evidência prospectiva dos custos de Landing Pages

- Objetivo: calcular e preservar prospectivamente o custo das tentativas de texto e imagem vinculadas a conta e LP reais em Production.
- Automação: não.
- Entrada: `accountId`, `landingPageId`, workload, ambiente, configuração efetiva, IDs de correlação, usage/quantidade e preço versionado.
- Processamento: registrar evento inicial; executar um dos transports existentes; calcular o custo sem duplicar tokens; registrar terminal append-only; agregar somente terminais válidos na cobertura ativa.
- Validação: migration, teste SQL, dry-run quando disponível, snippet read-only e Security Controls; nenhum diff em `automations/` ou workloads adiados; gate-off preserva o runtime; gate-on sem início impede chamada; texto/imagem, sucesso/falha, terminal ausente, preço desconhecido, idempotência e contexto inválido; modelo, service tier, faixa de contexto, entrada ordinária/cache/cache write/saída e prompt textual de imagem sem sobreposição; preço incompatível falha antes do provider; imagem sem unidades suficientes não publica custo parcial; data de corte única; ACL mínima.
- Persistência: eventos append-only e data de corte; nenhum prompt, resposta integral ou payload de negócio.
- Fallback: resultado não calculável permanece fora da soma das LPs e dentro de Outros gastos / reconciliação por diferença.
- Critério de aceite: após o corte, cada tentativa abrangida possui início auditável e, quando o provider devolve unidades necessárias, custo terminal por conta, LP e workload.

### 3.3. E21.4.5 — Custos OpenAI e reconciliação administrativa

- Objetivo: entregar a visão mínima do total oficial, custos prospectivos calculados das LPs e Outros gastos / reconciliação.
- Automação: não.
- Entrada: Costs oficial e read model interno do mesmo período.
- Processamento: apresentar os três totais e permitir aprofundamento conta → LP → texto/imagem.
- Validação:
  - relação `Total oficial = LPs + Outros gastos / reconciliação` sem clamp ou redistribuição;
  - rótulos distinguem oficial de calculado;
  - período atual `Provisório`, cobertura/corte visíveis e instantes distintos para `Atualizado na OpenAI` e `Atualizado na cobertura interna`, com aviso de latência/reconciliação;
  - período anterior ou cruzando o corte não promete cobertura integral;
  - estados inicial, loading, vazio, erro oficial, cobertura parcial/anômala e sucesso;
  - Preview autenticado com `platform_admin` e papel negativo, desktop e mobile, período padrão/personalizado, atualização sob demanda e hierarquia completa;
  - teclado, foco, nomes/rótulos programáticos, anúncio de estados, contraste e alvos de toque aplicáveis, sem alegar WCAG 2.2 integral;
  - sem overflow horizontal e aderente ao design system.
- Persistência: nenhuma além da E21.4.4.
- Fallback: falha oficial indisponibiliza a visão; falha interna preserva total e explicita reconciliação/cobertura parcial.
- Critério de aceite: o humano responde quanto a OpenAI reporta, quanto foi calculado para cada conta/LP e qual diferença permanece em Outros gastos / reconciliação.

### 3.4. Sequência de execução

1. Implementar E21.4.3, E21.4.4 e E21.4.5 no mesmo PR, incluindo migration, mocks/testes, navegação e documentação, sempre com o gate desligado e sem mutação remota pré-merge.
2. Validar localmente código, SQL, segurança, preços, idempotência, estados e escopo negativo; obter prova oficial hospedada em Preview somente se houver autorização humana específica para a credencial administrativa.
3. Após merge, executar apply canônico, snippet read-only e Security Controls.
4. Com banco aprovado, habilitar a instrumentação em Production, redeployar, executar smoke dos dois workloads e registrar a data de corte única.
5. Executar o QA hospedado autenticado da visão administrativa e consolidar o ABC final somente após todos os gates aprovados.
6. Não iniciar E21.3.4 nem evolução adiada.

## 4. Escopo negativo e critérios de parada

### 4.1. Adiado para evolução posterior

- Classificação completa `LP Factory × Cliente × Não atribuído`.
- Onboarding e `niche_resolution`.
- Suporte por IA e `commercial_activation_draft_generation`.
- Taxon e `taxon_input_catalog_sufficiency_evaluation`.
- `supabase_inspect` e qualquer mudança em `automations/`.
- Generalização para outros workloads, reconstrução histórica e conciliação de saldo/créditos.
- BRL, câmbio, IOF, margem, preço, cobrança, markup ou repasse.
- AI Gateway, segregação adicional de projetos/API keys, CDC, warehouse, pipeline analítico, cron, job, polling, cache recorrente ou infraestrutura não indispensável.
- Alteração de E9, entitlement, Stripe ou classificação comercial.
- Retomada da E21.3.4.

### 4.2. Updates e oportunidades

- `prod#16` — referência/trava no QA hospedado.
- `prod#17` — baseline proporcional de acessibilidade, sem alegar conformidade integral.
- `prod#19` — não implementar; a redução remove classificação por entitlement e preserva a trava para evolução futura.
- `vercel#1` — oportunidade condicional; não adotar AI Gateway.
- `supa#64` — oportunidade condicional; não criar CDC ou destino analítico.

### 4.3. Critérios de parada

- Parar se `OPENAI_ADMIN_KEY` autorizada não permitir leitura completa de Costs em USD.
- Parar se texto ou imagem não fornecerem unidades suficientes para cálculo de combinação ativa sem preço oficial versionável.
- Parar se a atribuição exigir inferir conta/LP em vez do contexto autorizado.
- Parar se o registro append-only exigir infraestrutura além do Supabase Core e rollout normal por migration/gate.
- Parar diante de exposição de secret, payload bruto, prompt, resposta integral ou PII.
- Não declarar a E21.4 concluída sem leitura oficial real, apply e gates de banco, corte de Production, smoke dos dois workloads e QA hospedado.

## 5. Classificação dos acréscimos da v2

- **Preservação:** total oficial via Costs, USD, mês atual + período personalizado, atualização sob demanda, `platform_admin`, data de corte e superfície separada.
- **Extensão adjacente necessária e proporcional:** `lib/openai-costs/`, provider read-only de Costs, preço limitado, eventos append-only, gate, `/admin/custos-openai`, testes SQL e QA/acessibilidade proporcionais.
- **Redução humana:** somente texto e imagem de LP em Production; demais workloads e classificações econômicas adiados.
- **Expansão não incorporada:** AI Gateway, segregação de projetos/API keys, CDC/warehouse, automação recorrente, histórico, créditos, cobrança e generalização.

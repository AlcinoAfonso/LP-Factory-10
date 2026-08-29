29/08/2026 — Plano-base v2 — E21.4 — Visibilidade financeira mínima de custos OpenAI

Status: plano-base v2 corrigido pelas decisões humanas posteriores de 28 e 29/08/2026; a implementação foi reconciliada com o contrato fail-open e aprovada pelo Analista. A prova oficial da Costs API e o QA hospedado pré-merge foram aprovados no Preview do HEAD `8397b342856ac5f9d8f71aaee0f17111118f1cf3`, com leitura real de `US$ 0,4064` para agosto de 2026, período personalizado, atualização sob demanda, desktop/mobile, contraste, atalhos externos e bloqueio do papel negativo. A cobertura interna indisponível no Preview é esperada porque a migration da E21.4 ainda não foi aplicada. Production possui `OPENAI_ADMIN_KEY` configurada, mas não foi redeployada nem validada em runtime; banco, migration e `OPENAI_LP_COST_TRACKING_ENABLED` permanecem inalterados, e os gates pós-merge continuam pendentes.

## 1. Estado e decisões fixas

### 1.1. Recorte e objetivo

- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.4 — Visibilidade financeira e atribuição de custos OpenAI`.
- Prioridade: imediata, antes da retomada da E21.3.4.
- Objetivo do MVP reduzido: permitir ao `platform_admin` conhecer o gasto oficial OpenAI do período e o custo prospectivo calculado das Landing Pages geradas, agregado por conta e detalhado por Landing Page e pelos dois workloads atuais de geração.
- Workloads incluídos: `landing_page_draft_generation` e `landing_page_draft_image_generation`.
- Relação canônica: **Gasto oficial total = custos prospectivos calculados das LPs + Outros gastos / reconciliação**.
- Princípio obrigatório: priorizar redução e simplicidade; implementar a menor solução que permita saber quanto a OpenAI gastou no total e quanto custou prospectivamente cada conta/LP gerada.
- Regra central: a geração da Landing Page contratada pelo cliente tem prioridade sobre a instrumentação financeira. A E21.4 mede e apresenta custos; não é autoridade para permitir ou impedir a geração.
- Plano conceitual: N/A.
- Fonte v1 congelada: PR #824, merge commit `428e01d81e819b5da9e508e1c4f356f0517c9c85`, blob `1f3192c24615fcf87f0aa0173fe117437241f7a8` de `docs/lousa-plano-base-e21-4.md`.

### 1.2. Autoridades e nomenclatura financeira

- A **Costs API da OpenAI** é a única autoridade do **gasto financeiro oficial total em USD** para a organização e o período consultados.
- O total oficial representa 100% do valor retornado pela fonte oficial; a cobertura interna das LPs nunca limita esse total.
- O custo textual de uma LP é calculado prospectivamente a partir do usage da chamada e de preços versionados para `modelo + service tier efetivo + faixa de contexto`, cobrindo separadamente entrada ordinária, entrada em cache, escrita de cache quando aplicável e saída.
- A entrada ordinária é derivada sem sobreposição (`input_tokens - cached_input_tokens - cache_write_tokens`); valores negativos ou dimensões sobrepostas invalidam o cálculo. Tokens de raciocínio já incluídos em `output_tokens` não são cobrados novamente.
- O custo de imagem soma o custo dos tokens de texto de entrada do prompt, conforme usage real e preço textual compatível, ao custo de saída da imagem pela combinação versionada `modelo + tamanho + qualidade + quantidade`. Se a resposta não fornecer unidade necessária, ou trouxer modalidade de entrada sem preço compatível, a tentativa fica sem custo calculado e fora da soma das LPs; não se publica custo parcial de imagem.
- A tabela de preço é um contrato versionado no código, limitado às combinações efetivamente usadas pelos dois workloads, com taxas em decimal exato ou unidade inteira mínima de USD e sem arredondamento intermediário. A evidência terminal persiste versão, modelo, service tier, faixa de contexto, unidades, taxas aplicadas e custo calculado em USD.
- Configuração, modelo, qualidade, service tier, faixa de contexto ou combinação ainda sem preço suportado não impedem a chamada. A tentativa permanece sem custo calculado, fora da soma interna e reconciliada em Outros gastos.
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
- `OPENAI_ADMIN_KEY` serve exclusivamente à leitura administrativa oficial de Costs. Ela não representa leitura instantânea de saldo restante e não se confunde com a `OPENAI_API_KEY` usada pelas gerações.
- O MVP não promete leitura instantânea do saldo ou dos créditos restantes da OpenAI.
- Falta real de crédito ou saldo na OpenAI, indisponibilidade, rate limit e outros erros do provider podem impedir tecnicamente a geração; esses casos seguem o tratamento normal do provider e não são falhas da instrumentação financeira.
- Erro de crédito esgotado precisa ser reconhecível na superfície administrativa e na observabilidade server-side, sem expor ao cliente detalhes financeiros internos da organização.

### 1.3.1. Fronteira entre LP Factory e OpenAI

- **OpenAI Usage/Billing é a residência canônica da visão global da organização**: gráficos gerais de gasto e usage; tokens e requisições globais; projetos, API keys, usuários e serviços; categorias de gasto e modalidades da API; budgets ou limites configurados na OpenAI; exportação de dados; créditos, faturamento e recargas; rate limits e demais controles próprios da plataforma OpenAI.
- **LP Factory — Custos OpenAI é a residência da atribuição de negócio** e limita-se ao gasto oficial total necessário à reconciliação; custo prospectivo calculado das LPs; custo por conta; custo por Landing Page; texto versus imagem; Outros gastos / reconciliação; e qualidade e cobertura da atribuição interna.
- A consulta do gasto oficial total pela Costs API dentro da LP Factory continua obrigatória para permitir a reconciliação na mesma superfície; ela não transforma a LP Factory em residência da visão global de Usage/Billing.
- A OpenAI conhece o consumo técnico da organização, mas não conhece a relação interna `conta → Landing Page → workload`. Esse vínculo é o valor exclusivo da E21.4.
- A E21.4 não amplia a Costs API para copiar funcionalidades do Usage Dashboard nem replica painéis ou controles já residentes na OpenAI.

### 1.4. Evidência prospectiva mínima das LPs

- A atribuição usa exclusivamente `accountId` e `landingPageId` já presentes no contexto autorizado da geração de LP; nenhum cliente ou LP é inferido por horário, modelo, volume, proximidade de chamadas ou heurística.
- O MVP não realiza classificação econômica completa `LP Factory × Cliente × Não atribuído` e não consulta entitlement comercial para classificar outros consumos.
- Somente chamadas em **Production** dos dois workloads incluídos compõem o custo prospectivo das LPs. Development, Preview, QA, provas, onboarding, taxon, workloads administrativos e automações permanecem em **Outros gastos / reconciliação** por diferença contra o total oficial.
- Cada tentativa abrangida recebe `attempt_id` estável. A chave lógica `(attempt_id, workload, event_kind)` admite exatamente um evento inicial e no máximo um terminal por `(attempt_id, workload)`; retries reutilizam a identidade e não duplicam chamadas, terminais ou soma financeira.
- O início tenta registrar, antes da chamada, conta, LP, workload, ambiente, configuração efetiva, instante e versão do preço, sem se tornar pré-condição da geração.
- O resultado terminal registra somente metadados seguros: correlação, sucesso/falha, usage normalizado aplicável, service tier e faixa de contexto efetivos, unidades de texto e imagem, quantidade de imagens, custo calculado, taxas/versão de preço e timestamps.
- Prompt, resposta integral, payload de negócio, secret, e-mail, nome de pessoa e PII não são persistidos para finalidade financeira.
- Se o resultado terminal não puder ser gravado depois da chamada, a tentativa inicial permanece reconhecível como `resultado desconhecido`; seu valor não entra na soma calculada e permanece em Outros gastos / reconciliação.
- Com a instrumentação ativa, falha ao registrar a evidência inicial não impede a chamada OpenAI, e falha no tracking terminal não invalida uma geração bem-sucedida.
- Usage ausente ou insuficiente para cálculo não interrompe nem altera o resultado funcional da geração; a tentativa fica sem custo calculado e fora da soma interna.
- Falha ou timeout de tracking não deve consumir materialmente o orçamento de timeout reservado ao provider. A instrumentação opera em orçamento próprio, curto e degradável.
- Falha inicial, terminal ausente, usage insuficiente ou preço não suportado reduzem a cobertura interna; a superfície administrativa informa cobertura parcial ou degradada, e a diferença permanece em Outros gastos / reconciliação.
- Com o gate desligado, o comportamento atual é preservado sem alegar cobertura financeira.

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
- A superfície oferece dois atalhos externos simples: **Abrir Usage na OpenAI** e **Abrir faturamento e créditos na OpenAI**.
- Antes da implementação dos atalhos, confirmar seus destinos oficiais e vigentes. Ambos abrem externamente, preferencialmente em nova aba, e deixam claro que o usuário está saindo da LP Factory; o acesso final depende das permissões do humano na organização OpenAI.
- Os atalhos não usam iframe, integração adicional, API, rota, banco, tabela ou serviço e não transmitem credencial, período, conta, LP ou qualquer outro dado da LP Factory.
- Alvos documentais e de navegação obrigatórios: registrar `OPENAI_ADMIN_KEY`, `OPENAI_LP_COST_TRACKING_ENABLED`, endpoint e residência em `docs/platform-config.md`; registrar objetos, RLS, grants, corte e estado de apply em `docs/schema.md`; manter o estado canônico em `docs/roadmap.md` pelos ABCs; incluir a nova superfície no mecanismo existente de navegação administrativa, atualmente `components/admin/adminNavigation.ts`.

### 1.8. Autoridade de bloqueio e crédito comercial

- A E21.4 não decide entitlement, capacidade, saldo de tokens ou crédito comercial de geração do cliente.
- Ficam fora do PR #831: saldo de tokens do cliente; crédito comercial de geração; reserva, consumo ou devolução de crédito; bloqueio de cliente por saldo comercial; e reutilização automática de `max_lps` como crédito de geração.
- Essa capacidade pertence a futuro recorte da E9.7 e não deve ser implementada pela E21.4.
- Regra conceitual: falha ao medir custo não bloqueia a LP; falta real de crédito na OpenAI pode impedir tecnicamente a geração; falta futura de crédito comercial do cliente poderá impedir comercialmente a geração somente por autoridade da E9.7.

## 2. Contrato do caso

### 2.1. Fluxo canônico

- **Gatilho:** `platform_admin` abre Custos OpenAI e solicita atualização do mês atual ou de período personalizado.
- **Entrada:** período UTC validado, sessão `platform_admin`, leitura oficial de Costs e eventos prospectivos das duas gerações de LP no mesmo intervalo.
- **Processamento:** obter o total oficial completo; somar custos calculados terminais cobertos; agregar por conta, LP e workload; calcular Outros gastos / reconciliação por diferença aritmética.
- **Validação:** rejeitar credencial administrativa ausente/inválida, período inválido, moeda não USD, leitura oficial incompleta, paginação inconsistente, evento sem contexto autorizado ou exposição de dados internos. Preço não suportado e usage insuficiente degradam somente a cobertura interna.
- **Persistência:** tentar registrar início antes da chamada e término append-only depois, sem condicionar o resultado funcional da geração; registrar uma única data de corte de Production.
- **Consumo:** apresentar total oficial, total calculado das LPs, Outros gastos / reconciliação e detalhamento por conta/LP/workload, sempre distinguindo oficial de calculado.
- **Fallback:** falha de Costs torna a visão indisponível. Evento incompleto ou sem custo calculável não é inventado nem redistribuído, fica fora da soma interna e permanece em Outros gastos / reconciliação com cobertura parcial ou degradada explícita.

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
- Decisões humanas de 28/08/2026 — redução imediata do MVP ao total oficial e aos custos prospectivos das LPs; prioridade da geração sobre a instrumentação financeira; separação entre falha de medição, falha real do provider e futuro crédito comercial da E9.7.

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
- Processamento: tentar registrar evento inicial sem bloquear o provider; executar um dos transports existentes; quando houver usage e preço suportados, calcular o custo sem duplicar tokens; tentar registrar terminal append-only; agregar somente terminais válidos na cobertura ativa.
- Validação: migration, teste SQL, dry-run quando disponível, snippet read-only e Security Controls; nenhum diff em `automations/` ou workloads adiados; gate-off preserva o runtime; gate-on mantém a geração funcional diante de falha exclusivamente financeira; texto/imagem, sucesso/falha real do provider, falha inicial, terminal ausente, preço desconhecido, usage insuficiente, timeout de tracking, idempotência e contexto inválido; modelo, service tier, faixa de contexto, entrada ordinária/cache/cache write/saída e prompt textual de imagem sem sobreposição quando calculáveis; imagem sem unidades suficientes não publica custo parcial nem interrompe a geração; data de corte única; ACL mínima; nenhum erro exclusivo da E21.4 retorna `configuration_invalid`.
- Persistência: eventos append-only e data de corte; nenhum prompt, resposta integral ou payload de negócio.
- Fallback: resultado não calculável permanece fora da soma das LPs e dentro de Outros gastos / reconciliação por diferença.
- Critério de aceite: após o corte, tentativas com evidência completa e preço suportado possuem custo terminal por conta, LP e workload; falha inicial, tracking terminal indisponível, usage insuficiente ou preço não suportado produzem cobertura parcial sem alterar o resultado funcional da geração.

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
  - falha de tracking e tentativas sem preço ou usage calculável são refletidas como cobertura parcial ou degradada, fora da soma interna e reconciliadas em Outros gastos;
  - estados inicial, loading, vazio, erro oficial, cobertura parcial/anômala e sucesso;
  - Preview autenticado com `platform_admin` e papel negativo, desktop e mobile, período padrão/personalizado, atualização sob demanda e hierarquia completa;
  - teclado, foco, nomes/rótulos programáticos, anúncio de estados, contraste e alvos de toque aplicáveis, sem alegar WCAG 2.2 integral;
  - dois atalhos externos distinguíveis para os destinos oficiais e vigentes de Usage e de faturamento/créditos da OpenAI, preferencialmente em nova aba, sem iframe, integração ou transmissão de dados da LP Factory;
  - sem overflow horizontal e aderente ao design system.
- Persistência: nenhuma além da E21.4.4.
- Fallback: falha oficial indisponibiliza a visão; falha interna preserva total e explicita reconciliação/cobertura parcial.
- Critério de aceite: o humano responde quanto a OpenAI reporta, quanto foi calculado para cada conta/LP e qual diferença permanece em Outros gastos / reconciliação.

### 3.4. Sequência de execução

1. A implementação do PR #831 já foi reconciliada com o contrato fail-open, validada localmente e aprovada pelo Analista.
2. `OPENAI_ADMIN_KEY` foi configurada como secret em Preview e Production; somente o Preview foi redeployado e validado no deployment `dpl_Cf8rFSdiDhmzauDWBuxBp6pzreVP`, estado `READY`, HEAD `8397b342856ac5f9d8f71aaee0f17111118f1cf3`.
3. A prova oficial da Costs API aprovou a leitura real de `US$ 0,4064` para agosto de 2026; o QA hospedado pré-merge aprovou período personalizado, atualização sob demanda, desktop/mobile, contraste, atalhos externos e bloqueio do papel negativo.
4. A cobertura interna indisponível no Preview é o estado esperado enquanto a migration da E21.4 permanecer não aplicada.
5. Production não foi redeployada nem validada em runtime; banco, migration e `OPENAI_LP_COST_TRACKING_ENABLED` permanecem inalterados.
6. Após o merge humano, executar exclusivamente apply canônico, snippet read-only, Security Controls, ativação controlada do gate em Production, redeploy, smoke dos dois workloads, registro único da data de corte e QA pós-merge previstos, sem repetir gates pré-merge aprovados.
7. Não iniciar E21.3.4 nem evolução adiada.

## 4. Escopo negativo e critérios de parada

### 4.1. Adiado para evolução posterior

- Classificação completa `LP Factory × Cliente × Não atribuído`.
- Onboarding e `niche_resolution`.
- Suporte por IA e `commercial_activation_draft_generation`.
- Taxon e `taxon_input_catalog_sufficiency_evaluation`.
- `supabase_inspect` e qualquer mudança em `automations/`.
- Generalização para outros workloads, reconstrução histórica e conciliação de saldo/créditos da OpenAI.
- Reprodução na LP Factory de gráficos globais de tokens ou requisições; análise geral por projeto, API key, usuário ou serviço; todas as modalidades da OpenAI; exportações gerais; budgets; rate limits; compra ou recarga de créditos; saldo oficial restante; configuração de billing; ou qualquer painel global já disponível na OpenAI.
- Ampliação da Costs API para copiar funcionalidades do Usage Dashboard.
- Saldo de tokens do cliente, crédito comercial de geração, reserva/consumo/devolução de crédito, bloqueio por saldo comercial e reutilização automática de `max_lps` como crédito; esse recorte pertence futuramente à E9.7.
- BRL, câmbio, IOF, margem, preço, cobrança, markup ou repasse.
- AI Gateway, segregação adicional de projetos/API keys, CDC, warehouse, pipeline analítico, cron, job, polling, cache recorrente ou infraestrutura não indispensável.
- Alteração de E9, entitlement, capacidade, crédito comercial, Stripe ou classificação comercial.
- Retomada da E21.3.4.

### 4.2. Updates e oportunidades

- `prod#16` — referência/trava no QA hospedado.
- `prod#17` — baseline proporcional de acessibilidade, sem alegar conformidade integral.
- `prod#19` — não implementar; a redução remove classificação por entitlement e preserva a trava para evolução futura.
- `vercel#1` — oportunidade condicional; não adotar AI Gateway.
- `supa#64` — oportunidade condicional; não criar CDC ou destino analítico.

### 4.3. Critérios de parada

- Parar se `OPENAI_ADMIN_KEY` autorizada não permitir leitura completa de Costs em USD.
- Parar se a atribuição exigir inferir conta/LP em vez do contexto autorizado.
- Parar se o registro append-only exigir infraestrutura além do Supabase Core e rollout normal por migration/gate.
- Parar diante de exposição de secret, payload bruto, prompt, resposta integral ou PII.
- Falta real de crédito/saldo da OpenAI, indisponibilidade, rate limit ou outro erro do provider pode interromper tecnicamente a geração e deve ser tratado como erro do provider, não como falha da E21.4.
- Preço não suportado, usage insuficiente e falha/timeout de tracking não são critérios de parada da geração; degradam somente a cobertura financeira.
- Não declarar a E21.4 concluída sem leitura oficial real, apply e gates de banco, corte de Production, smoke dos dois workloads e QA hospedado.

## 5. Classificação dos acréscimos da v2

- **Preservação:** total oficial via Costs, USD, mês atual + período personalizado, atualização sob demanda, `platform_admin`, data de corte e superfície separada.
- **Extensão adjacente necessária e proporcional:** `lib/openai-costs/`, provider read-only de Costs, preço limitado, eventos append-only degradáveis, gate, `/admin/custos-openai`, testes SQL e QA/acessibilidade proporcionais.
- **Redução humana:** somente texto e imagem de LP em Production; demais workloads e classificações econômicas adiados.
- **Expansão não incorporada:** AI Gateway, segregação de projetos/API keys, CDC/warehouse, automação recorrente, histórico, crédito comercial do cliente, cobrança e generalização.

## 6. Critérios de aceite da decisão humana posterior

- Falha exclusivamente financeira não altera o resultado funcional da geração.
- Preço não suportado produz tentativa sem custo calculado, sem `configuration_invalid` e sem impedir o provider.
- Usage insuficiente produz tentativa sem custo calculado e não interrompe a geração.
- Falha inicial ou terminal de tracking produz cobertura parcial ou degradada e não invalida geração bem-sucedida.
- Falha ou timeout de tracking não consome materialmente o orçamento de timeout do provider.
- Tentativa sem evidência completa ou sem preço calculável fica fora da soma interna e permanece em Outros gastos / reconciliação.
- Erro real do provider continua tratado normalmente; crédito esgotado é reconhecível administrativamente sem exposição financeira interna ao cliente.
- Nenhum erro exclusivo da E21.4 retorna `configuration_invalid`.
- A E21.4 não decide entitlement, capacidade ou crédito comercial do cliente e não reutiliza `max_lps` para essa finalidade.
- OpenAI Usage/Billing permanece como residência canônica da visão global da organização; a LP Factory limita-se à atribuição de negócio e à reconciliação do total oficial com conta, LP e workload.
- `/admin/custos-openai` oferece atalhos externos simples para Usage e para faturamento/créditos em destinos oficiais vigentes, sem iframe, integração adicional ou transmissão de dados da LP Factory.

23/08/2026 — Plano-base v2 — E21.2.5 — Catálogo administrável e UX compacta dos workloads OpenAI

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v2 aprovado pelo Analista após as Passagens 1 e 2, revisões delta e reconciliação do roadmap.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.2.5 — Catálogo administrável e UX compacta dos workloads OpenAI`.
- Plano conceitual: N/A.
- Este recorte é uma correção evolutiva da E21.2 já concluída; não reescreve nem invalida o plano-base histórico `docs/lousa-plano-base-e21-2-v2.md`.
- A E21.3 permanece prevista e não iniciada até a conclusão deste recorte.

### 1.2. Objetivo

- Separar a seleção operacional por workload da definição global de quais modelos e parâmetros podem ser oferecidos para novas candidatas.
- Permitir que `platform_admin` mantenha no Admin Dashboard um catálogo global de modelos disponível para seleção, sem exigir alteração de código, commit ou redeploy para adicionar ou indisponibilizar um modelo que use parâmetros já suportados pelo boundary.
- Preservar o lifecycle vigente da E21.2 por `ambiente + workload`: candidata → prova operacional → revisão validada → ativação humana → histórico/rollback.
- Simplificar a UX do Admin: catálogo compacto de modelos na parte superior e lista compacta de funções/workloads na parte inferior, com detalhe aberto somente quando necessário.

### 1.3. Fontes usadas

- `README.md`.
- `AGENTS.md`.
- `docs/prompt-estrategista.md` v32.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/lousa-plano-base-e21-2-v2.md`.
- `docs/base-tecnica.md`.
- `docs/platform-config.md`.
- `docs/schema.md`.
- `docs/openai-model-snapshot.md`.
- `lib/openai-workloads/registry.ts` e contratos públicos do boundary.
- `app/admin/(protected)/workloads-openai/`.
- Estado vigente da `main` no merge `587a534a1bb92eee3869c98e0b81e3512e637e3e` do PR #806.

### 1.4. Decisões fixas do catálogo

- O catálogo é global para o produto e não é duplicado por Preview/Production; a disponibilidade define somente o que pode ser escolhido em novas candidatas.
- Preview e Production continuam independentes para candidata, prova, revisão, ativação e rollback.
- Em Preview e Production, o catálogo Supabase substitui integralmente as allowlists estáticas de modelos por workload como autoridade de novas candidatas. O registry permanece autoridade somente para identidades e modalidades dos workloads, metadados de apresentação, parâmetros tipados já suportados, campos estruturais fixos de imagem e baselines determinísticos de Development.
- Remover do caminho operacional `allowedConfigurations`, `listOpenAiWorkloadConfigurationOptions` e validações equivalentes baseadas em modelos hardcoded quando perderem função. Resolvers ativos, leitores administrativos, histórico e validadores de snapshots validam identidade do workload, modalidade, identificador técnico do modelo e shape tipado do parâmetro, sem consultar disponibilidade atual nem exigir que o modelo permaneça listado em código. Somente criação/edição, prova e promoção de nova candidata consultam elegibilidade vigente; a prova revalida de forma fail-closed imediatamente antes da chamada externa, sem manter lock transacional durante o transporte, e a promoção preserva sua revalidação transacional própria.
- A autoridade de elegibilidade textual é a combinação `modelo + reasoning effort`; não existem duas allowlists independentes cuja combinação cartesiana possa gerar pares inválidos.
- A UX apresenta o catálogo por modelo e, dentro de cada modelo, os efforts permitidos/disponíveis.
- Para imagem, a mesma regra conceitual usa `modelo + quality`; `reasoning effort` não se aplica.
- O status do catálogo usa semântica de `Disponível para seleção` / `Indisponível para seleção`, e não `Ativo/Inativo`, para não confundir com a revisão ativa de um workload.
- Tornar um modelo ou parâmetro indisponível não interrompe uma revisão já ativa, não invalida histórico e não elimina rollback para revisão previamente validada; apenas impede seu uso em nova candidata enquanto estiver indisponível.
- Identidades de catálogo não são apagadas operacionalmente; modelos antigos são retirados de novas escolhas por indisponibilidade, preservando reprodutibilidade histórica.
- Um novo modelo adicionado manualmente nasce indisponível; somente `platform_admin` pode declarar os parâmetros suportados e torná-lo disponível para seleção.
- Não existe descoberta, sincronização ou ativação automática de modelos a partir da OpenAI.
- Novo valor de parâmetro ainda desconhecido pelo boundary — por exemplo um novo nome de `reasoning effort` não suportado pelo contrato atual — exige novo recorte técnico; este plano permite adicionar novos modelos que usem os parâmetros já suportados.
- O conjunto inicial textual preserva `gpt-5.4-mini` com `none | low | medium | high | xhigh` e inclui `gpt-5.6-luna`, `gpt-5.6-terra` e `gpt-5.6-sol` com `none | low | medium | high | xhigh | max`.
- O conjunto inicial de imagem preserva `gpt-image-2` com `quality = low | medium | high`.
- Os baselines e revisões ativas existentes não são alterados pelo bootstrap do catálogo.

### 1.5. Decisões fixas da UX

- A página `/admin/workloads-openai` mantém uma única superfície administrativa e não ganha nova rota neste recorte.
- Parte superior: catálogo compacto de modelos, separado visualmente por modalidade quando necessário, com nome, disponibilidade, resumo dos parâmetros e ação `Configurar`; adicionar modelo ocorre nessa área.
- A configuração detalhada de efforts ou qualities fica fechada por padrão e só aparece quando o humano abre/configura o modelo.
- Parte inferior: lista compacta das funções/workloads, preferencialmente uma linha por item e no máximo duas linhas responsivas, sem os cards extensos atuais na visão principal.
- A lista inferior possui cabeçalho sticky dentro da superfície de rolagem e deve permanecer legível sem overflow horizontal da página.
- A lista inferior usa nomes amigáveis para humanos e inclui uma coluna própria `Recorte`, por exemplo `E19.4`, para facilitar diálogo e rastreabilidade com IA.
- A coluna de configuração atual resume `modelo · parâmetro` do ambiente selecionado.
- A coluna `Imagem` exibe somente `Sim` ou `Não` na lista principal.
- A visão principal oferece seletor compacto `Preview | Production`, em vez de duplicar a lista inteira por ambiente.
- A ação `Abrir` expande o detalhe na própria página, sem criar rota adicional; apenas um detalhe precisa permanecer aberto por vez para preservar limpeza visual.
- O detalhe concentra configuração ativa, candidata, prova, ativação, rollback e histórico; lifecycle e histórico podem permanecer recolhíveis.
- Funções amigáveis podem agrupar mais de um workload técnico somente na apresentação. `Geração da Landing Page · E19.4` agrupa visualmente texto e imagem, mas `landing_page_draft_generation` e `landing_page_draft_image_generation` preservam configurações, revisões, provas, ativações e rollbacks independentes.
- Ao abrir `Geração da Landing Page`, o detalhe apresenta separadamente `Texto` (`model + reasoning effort`) e `Imagem` (`model + quality`).
- `supabase_inspect` permanece referência operacional read-only separada e não entra na lista de configurações mutáveis de produto.
- Nome amigável, recorte e agrupamento funcional permanecem metadados controlados pelo código; não são editáveis pelo catálogo operacional.
- A API pública do registry mantém uma única matriz code-owned de apresentação: `niche_resolution → Resolução de nicho · E10.5.6.5`; `commercial_activation_draft_generation → Geração de draft de ativação comercial · E10.7.3`; `landing_page_draft_generation + landing_page_draft_image_generation → Geração da Landing Page · E19.4`, com agrupamento somente visual; `taxon_input_catalog_sufficiency_evaluation → Avaliação de suficiência factual do catálogo por taxon · E20.6.5`. Não criar mapa nominal paralelo na página ou no catálogo persistido.

## 2. Contrato do caso

### 2.1. Fluxo do catálogo

- Gatilho: `platform_admin` abre a área superior do catálogo para revisar, adicionar ou alterar disponibilidade de um modelo.
- Entrada: modalidade, identificador do modelo, parâmetros suportados entre os valores já conhecidos pelo boundary e disponibilidade para novas seleções.
- Processamento: validar identidade/modalidade/shape → persistir ou atualizar a elegibilidade → projetar somente combinações disponíveis para novas candidatas dos workloads da mesma modalidade.
- Validação: impedir modelo sem parâmetro suportado, combinação incompatível com a modalidade, alteração por usuário sem `platform_admin` e qualquer operação que torne inválido o histórico já existente.
- Persistência: o catálogo usa a mesma residência operacional Supabase já adotada pela E21.2, sem segunda residência e sem depender de Vercel para mudanças ordinárias.
- Contrato físico: materializar o catálogo global em `public.openai_model_catalog_models` e `public.openai_model_catalog_parameters`. A primeira tabela identifica unicamente `modalidade + modelo`, mantém `available_for_selection`, versão otimista, ator e timestamps de criação/atualização. A segunda identifica unicamente `modalidade + modelo + parameter_kind + parameter_value`, referencia o modelo com `ON UPDATE RESTRICT` e `ON DELETE RESTRICT`, mantém sua própria disponibilidade e auditoria e aceita somente `reasoning_effort` nos valores tipados para texto ou `quality` nos valores tipados para imagem.
- Elegibilidade: uma combinação é elegível somente quando o modelo e seu parâmetro relacionado estiverem disponíveis; não derivar combinações por produto cartesiano. Modelos e parâmetros não são apagados. Novo modelo exige ao menos um parâmetro suportado, nasce indisponível e nenhuma combinação fica elegível antes de ação humana explícita. O bootstrap idempotente cria todas as combinações da seção 1.4 disponíveis para seleção e não altera candidatas, revisões, ativações ou ponteiros existentes.
- Segurança: as duas tabelas ficam no schema `public` para consumo server-side pela Data API, com RLS habilitado, nenhuma policy e revogação explícita de `PUBLIC`, `anon`, `authenticated` e `ai_readonly`. `service_role` recebe somente `SELECT`, `INSERT` e `UPDATE` necessários; não recebe `DELETE` nem `TRUNCATE`. Mutações usam RPCs versionadas `SECURITY INVOKER`, `search_path = pg_catalog`, referências schema-qualified, ator server-side e `EXECUTE` exclusivo de `service_role`.
- Consumo: o Admin e as Server Actions de candidata consultam DTO imutável exportado por `lib/openai-workloads/`; “projeção pública” significa API pública TypeScript do boundary, não view pública nem grant para client. Consumers de produto continuam resolvendo somente a revisão ativa do workload.
- Fallback: falha de leitura/validação do catálogo bloqueia criação/edição de nova candidata, mas não substitui nem derruba silenciosamente a revisão ativa já resolvível pelo lifecycle vigente.

### 2.2. Fluxo de configuração por workload

- Gatilho: o humano seleciona Preview ou Production e abre uma linha da lista de workloads.
- Entrada textual: workload técnico subjacente, ambiente, modelo disponível e effort disponível para esse modelo.
- Entrada de imagem: workload técnico subjacente, ambiente, modelo disponível e quality disponível para esse modelo.
- Processamento: salvar candidata → revalidar contra catálogo vigente → executar prova operacional existente → promover revisão validada → ativação humana explícita. Save e promoção revalidam a combinação no banco; cada operação bloqueia primeiro a unidade canônica `ambiente + workload` e depois, em ordem determinística, o modelo e parâmetro correspondentes no catálogo.
- Validação: a promoção revalida a elegibilidade na mesma transação que anexa a revisão e instala o ponteiro pendente; indisponibilidade observada antes desse ponto aborta integralmente a promoção. A mutação de disponibilidade serializa sobre as mesmas linhas do catálogo. Candidata já salva pode permanecer registrada após indisponibilização, mas não pode ser provada/promovida enquanto inelegível. Revisão pendente já validada pode ser ativada e revisão anteriormente ativa pode ser restaurada sem consultar disponibilidade corrente.
- Persistência: candidatas, revisões e ativações continuam no agregado operacional E21.2 já existente; o catálogo não substitui o histórico por workload.
- Consumo: a execução seguinte usa a revisão ativa por `ambiente + workload`, exatamente como na E21.2 atual.
- Fallback: nenhuma configuração nova é ativada automaticamente; falha preserva a configuração ativa anterior e o fallback funcional continua pertencendo ao consumer.

### 2.3. Compatibilidade e separação de responsabilidades

- O catálogo responde `quais combinações podem ser escolhidas agora`.
- O lifecycle E21.2 responde `qual revisão está ativa neste ambiente/workload e como ela muda com segurança`.
- A E21.3 continuará respondendo `qual combinação apresenta melhor custo-benefício segundo evidência reproduzível`.
- Indisponibilidade no catálogo não é kill switch de runtime e não altera revision snapshots históricos.
- A futura E21.3 pode comparar somente combinações que estejam disponíveis para novas candidatas no momento do teste, sem precisar alterar código para cada modelo já cadastrado.
- Nenhuma recomendação, benchmark ou resultado da E21.3 ativa configuração automaticamente.

### 2.4. Critérios de aceite

- O catálogo superior permite ao `platform_admin` adicionar modelo, definir parâmetros suportados entre os valores conhecidos e alterar disponibilidade sem commit/redeploy.
- Um modelo recém-adicionado nasce indisponível e não aparece nos seletores dos workloads até ação humana explícita de disponibilização.
- Desabilitar modelo ou parâmetro remove-o de novas candidatas, preservando configuração ativa, histórico e rollback existentes.
- Os workloads textuais passam a obter opções elegíveis do catálogo operacional, sem hardcode de Luna/Terra/Sol em cada workload como requisito para nova seleção.
- O conjunto inicial inclui Mini, Luna, Terra e Sol conforme a seção 1.4; imagem preserva GPT Image 2 e qualities vigentes.
- A lista principal mostra nome amigável, `Recorte`, configuração atual, `Imagem` e ação `Abrir`, com cabeçalho sticky e rows de no máximo duas linhas no layout responsivo.
- O seletor Preview/Production troca a leitura do ambiente sem misturar estados entre eles.
- A linha amigável de geração da LP exibe `Imagem = Sim`; ao abrir, texto e imagem aparecem como configurações técnicas independentes.
- Papéis negativos não conseguem ler controles privilegiados nem executar mutações; todas as mutações reexecutam `requirePlatformAdmin()` server-side.
- QA hospedado cobre desktop e mobile, header sticky, ausência de overflow de página, navegação por teclado, foco visível, labels/names, estados de sucesso/erro e touch targets proporcionais ao checklist WCAG 2.2 já adotado pelo projeto.
- Cada execução de QA hospedado registra deployment e ambiente, papel exercitado, viewport, fluxo ou estado validado e resultado observado; ferramenta automatizada pode apoiar a inspeção, mas não substitui a validação manual do fluxo.
- Aplicar os critérios WCAG 2.2 pertinentes à superfície e registrar evidência manual de teclado, ordem e foco visível, labels/names, feedback de sucesso e erro, ausência de interação exclusiva por hover, contraste e alvos de toque; cada critério registrado como N/A exige justificativa explícita. Auditoria automática é apoio e não autoriza declarar conformidade WCAG 2.2 integral.
- Testes focais cobrem catálogo, disponibilidade, preservação de revisão ativa/histórica, nova candidata, mudança de disponibilidade durante lifecycle, agrupamento de LP e regressão dos resolvers existentes.
- Todas as leituras administrativas de catálogo, revisões e ativações comprovam completude por paginação com ordenação determinística, sem depender do limite implícito da Data API. O tratamento de `416/PGRST103` preserva páginas já acumuladas; erro ou resposta parcial produz estado tipado fail-closed, nunca catálogo ou histórico aparentemente completo.
- Teste focal acima do limite de uma página comprova a reconstrução integral e confirma que falha exclusiva do catálogo bloqueia catálogo, save, prova e promoção sem afetar resolução ativa, ativação ou rollback de revisões já validadas.
- Alterações de banco usam migration forward-only, testes SQL transacionais e snippet read-only; migrations já aplicadas não são editadas. O teste SQL comprova também as duas ordens da corrida indisponibilização/promoção, sem revisão parcial, e preserva ativação/rollback de revisões previamente validadas.
- O verificador read-only do catálogo é versionado em `supabase/snippets/` e comprova, no mínimo, objetos e colunas, constraints de modalidade e parâmetro, bootstrap inicial, disponibilidade, preservação das revisões ativas e históricas, RLS, policies, grants, functions/RPCs, triggers e ausência de drift; o snippet não pode executar mutações.
- Após o apply da migration no ambiente alvo, executar o Security Controls Dashboard e bloquear o avanço enquanto houver alerta incompatível com as novas tabelas, constraints, RLS, policies, grants, functions/RPCs ou triggers do catálogo; registrar a evidência com identificação do ambiente e dos objetos novos avaliados. Este gate não autoriza criar métricas de acesso nem nova superfície no Admin.
- A migration, o teste SQL e o snippet comprovam PKs/FKs/checks, ausência de delete, bootstrap, auditoria, RLS, zero policies, ACLs exatas, RPCs e acesso Data API por `service_role`; `anon`, `authenticated` e `ai_readonly` não leem nem executam mutações.
- Modelo novo com parâmetro conhecido torna-se selecionável e ativável sem alteração de código; sua indisponibilização posterior não invalida revisão ativa, revisão pendente já validada, histórico ou rollback; não resta validação operacional paralela por lista estática de modelos.
- `npm ci`, `npm run check` e `git diff --check` devem ser aprovados antes da entrega técnica.

## 3. Fases e próxima ação

### 3.1. E21.2.5 — Catálogo administrável e UX compacta dos workloads OpenAI

- Automação: não.
- Implementar a menor persistência operacional necessária no Supabase para catálogo global de modelos e parâmetros elegíveis, reutilizando a residência, segurança e boundary existentes da E21.2.
- Fazer a validação de novas candidatas depender do catálogo operacional sem enfraquecer snapshots, histórico, ativação, rollback ou fail-closed do lifecycle atual.
- Migrar o conjunto inicial de opções para Mini/Luna/Terra/Sol e GPT Image 2 conforme as regras deste plano, preservando os baselines ativos existentes.
- Reorganizar `/admin/workloads-openai` para catálogo compacto superior + lista compacta inferior + detalhe expansível, preservando a rota e os controles server-side existentes.
- Incluir metadados amigáveis de `Recorte` e agrupamento apenas apresentacional da geração textual+imagem da LP.
- Manter um único boundary em `lib/openai-workloads/`. Criar `adapters/modelCatalogAdapter.ts` e `adapters/modelCatalogAdapterCore.ts` para o novo agregado, sem incorporar sua normalização ao adapter de lifecycle; as leituras de catálogo e as leituras históricas do adapter de lifecycle compartilham a disciplina de paginação completa, ordenada e fail-closed.
- `page.tsx` permanece SSR, executa `requirePlatformAdmin()` e compõe read models; `catalogActions.ts` contém somente reautorização, parsing e orquestração das mutações do catálogo; `actions.ts` preserva lifecycle e prova, mas delega todos os acessos Supabase afetados aos adapters, sem `createServiceClient` na camada de rota. `_proof.ts`, `proofCore.ts` e adapters de transporte existentes permanecem responsáveis pela prova OpenAI e não são usados pelo catálogo.
- Criar `_components/OpenAiModelCatalogManager.tsx` para a área superior e `_components/OpenAiWorkloadDetail.tsx` para o lifecycle expandido; substituir o conteúdo vigente de `OpenAiConfigurationManager.tsx` pelo seletor de ambiente e coordenação da lista compacta, movendo, e não duplicando, a UI de detalhe existente. Client/UI não importa Supabase, actions não normalizam DBRow, catálogo e lifecycle possuem adapters coesos e o provider não consulta catálogo.
- A entrega é backward-compatible nas duas ordens transitórias. Antes do apply, ausência ou falha do catálogo desabilita sua gestão e bloqueia save/prova/promoção de nova candidata, sem atingir a resolução ativa. Depois do apply, executar snippet read-only, verificar Security Controls e somente então habilitar a operação administrativa do catálogo. O resolver de execução não consulta os novos objetos. Nenhum estado documental pode declarar a migration aplicada antes da evidência hospedada.
- Incluir como artefatos obrigatórios: nova migration `supabase/migrations/<timestamp>_e21_2_5_openai_model_catalog.sql`; `supabase/tests/e21_2_5_openai_model_catalog.test.sql`; `supabase/snippets/e21_2_5_openai_model_catalog_verify.sql`; atualização de `docs/schema.md` com objetos, constraints, RLS, policies, grants, RPCs e estado de apply; atualização de `docs/base-tecnica.md` §3.16 para separar registry code-owned, catálogo operacional e revisão ativa; atualização de `docs/roadmap.md` com E21.2.5, artefatos e preservação da E21.3 como não iniciada. Migrations E21.2 já aplicadas permanecem imutáveis.
- Validar banco, código, UX hospedada e regressões da E21.2 antes de qualquer retomada da E21.3.
- Ampliação de testes RLS com tooling beta, tracing cross-stack, AI Gateway e apoio opcional da Vercel Toolbar permanecem oportunidades estratégicas condicionais e não autorizam `pgtap`, tracing, upgrade de dependência, mudança de transporte, Toolbar obrigatória ou nova infraestrutura neste recorte; Vercel Flags permanece não aplicável.
- Próxima ação: criar o checkpoint `LP-Factory-Stage: plan-v2-approved` e executar a subseção `E21.2.5 — Catálogo administrável e UX compacta dos workloads OpenAI` na mesma branch e no mesmo PR draft.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo

- Não iniciar benchmarking, ranking, vencedor ou comparação da E21.3.
- Não criar seleção automática de modelo, otimização automática, agente, job, workflow, cron ou automação recorrente.
- Não sincronizar automaticamente catálogo com endpoints, anúncios ou documentação da OpenAI.
- Não permitir texto livre para novos nomes de `reasoning effort` ou `quality` que ainda não pertençam ao contrato tipado do boundary; evolução do vocabulário de parâmetros exige recorte próprio.
- Não transformar indisponibilidade de catálogo em kill switch de revisão ativa.
- Não apagar modelos/revisões históricas para simplificar o catálogo.
- Não unir tecnicamente os workloads de texto e imagem da LP; o agrupamento é somente de apresentação.
- Não criar nova rota administrativa, segunda residência, cache, Realtime, AI Gateway, Vercel Flags ou Global Config.
- Não alterar prompts, schemas funcionais, payloads de negócio, domínio de LP, E19.4, E19.5, E20.6 ou consumers além do necessário para consumir a configuração resolvida existente.

### 4.2. Critérios de parada

- Parar se a solução exigir nova infraestrutura fora da residência Supabase e do boundary E21.2 já aprovados.
- Parar se a adição dinâmica de modelo exigir aceitar parâmetro desconhecido sem contrato tipado e validação determinística.
- Parar se a mudança de disponibilidade puder invalidar ou interromper uma revisão ativa existente.
- Parar se o agrupamento amigável da LP exigir compartilhar revisão, prova ou ativação entre texto e imagem.
- Parar diante de conflito material com o estado atual da `main`, migration já aplicada ou rollout operacional de outro recorte; reconciliar a fonte antes de mutar código ou banco.

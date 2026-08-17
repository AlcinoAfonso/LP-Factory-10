17/08/2026 — Plano-base v2 — E19.4 — Primeira LP real do Cenário E

## 1. Estado, autoridade e resultado

### 1.1. Estado

- Status: plano-base v2 consolidado para avaliação do Analista; implementação ainda não iniciada.
- Recorte: `E19.4 — Geração, revisão válida, materialização e preview privado da landing page em draft`.
- Path canônico: `docs/lousa-plano-base-e19-4.md`.
- Processo: `docs/prompt-estrategista.md` v31 e `docs/orquestracao-plano-base.md`.
- Plano conceitual: `docs/lp-planejamento.md`.
- Cenário ativo: somente Cenário E.
- Base obrigatória: E19.3 concluída no contrato v3, entregue como `identities + modelContext + serverContext` e mergeada pelo PR #757.
- Plano-base v1 mergeado pelo PR #759, com blob congelado `bfa5adb2677fd4597cda463a1988b3a23b0e70bf`.
- A seção `1.7. Matriz final da v1` do blob congelado é artefato histórico do debate e está integralmente excluída do contrato operacional. Nenhuma decisão, requisito ou inferência desta v2 deriva dessa seção.
- As decisões consolidadas nas demais seções da v1 permanecem preservadas, salvo detalhamento técnico explicitamente fechado nesta v2.
- A implementação será executada nas subseções exatas `E19.4.3`, `E19.4.4` e `E19.4.5`, uma por vez, na mesma frente e worktree, mas em dois PRs sequenciais por precedência factual do schema hospedado.
- PR precursor A: plano aprovado + E19.4.3 + E19.4.4, com migration backward-compatible e shell autenticada mínima da rota confirmada contendo gatilho humano protegido por readiness fail-closed; antes do apply, o gatilho não acessa o schema novo nem chama providers.
- PR B: aberto na mesma worktree somente após merge humano do PR A, apply oficial e verificação hospedada; acrescenta read model, renderer e apresentação completa do Preview, executa canário integrado final e produz a primeira LP real.

### 1.2. Decisões humanas que fecharam a v2

- Revisões 1:N: evoluir `account_landing_page_materializations`, preservando materializações históricas e append-only; não criar entidade concorrente de revisões.
- Mídia: usar Supabase Storage privado; persistir somente `bucket + path` estáveis e gerar URL assinada server-side no consumo.
- Imagem: criar workload E21.1 separado `landing_page_draft_image_generation`, com configuração, custo, observabilidade e falhas próprios, dentro do mesmo workflow controlado e não agentic.
- Preview: reutilizar/adaptar `/a/[account]/landing-pages/[landingPageId]/preview`, preservando a separação entre workspace e renderer.
- Essas decisões só voltam ao humano diante de conflito técnico factual que realmente impeça a implementação.

### 1.3. Resultado esperado

- Uma ação humana explícita gera uma candidata completa a partir de pacote E19.3 v3 válido.
- A tentativa usa uma única chamada textual, resolve uma imagem principal pertinente, valida todo o resultado e só então cria uma revisão válida da mesma LP.
- Revisões válidas são append-only 1:N, materializações históricas são preservadas e a revisão corrente é a de maior `revision_number` da LP.
- O preview privado reproduz somente o snapshot persistido da revisão corrente, sem reler fontes mutáveis.
- A primeira LP real é avaliada pela rubrica humana da v1 e pelos gates binários de factualidade, segurança e funcionamento.
- O resultado não publica a LP, não implementa E19.5 e não amplia o produto para editor, histórico visual, analytics ou automação agentic.

### 1.4. Fontes obrigatórias

- `AGENTS.md`, `README.md`, `docs/prompt-estrategista.md`, `docs/orquestracao-plano-base.md` e `docs/template-roadmap.md`.
- `docs/lp-planejamento.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/platform-config.md` e `docs/openai-model-snapshot.md`.
- Planos canônicos E18.4, E19.2, E19.3, E20.2 e E21.1.
- API pública vigente de E18.4 em `lib/conversion-content/landing-page/`.
- Pacote E19.3 v3 e seus adapters em `lib/lp-builder/`.
- Registry e observabilidade em `lib/openai-workloads/`.
- Migrações, schema hospedado e configuração real de Supabase Storage.
- Documentação oficial vigente de OpenAI, Supabase e Vercel para os contratos efetivamente usados.
- A seção 1.7 da v1 e `docs/matriz-consolidacao-e19-4.md` anterior a esta v2 não são fontes de autoridade; a matriz anterior pertence ao Cenário D e será substituída somente após a Passagem 1 do Analista.

### 1.5. Consolidação dos especialistas

- Incorporado do Gestor Estrutural:
  - separar UI route-local, guarda de acesso, casos de uso, adapters server-only, configuração/observabilidade dos workloads e renderer puro;
  - evoluir o banco somente por nova migration, com RLS, policies, grants, Data API e verificador SQL explícitos;
  - substituir os testes e snippets negativos do contrato 1:1 no mesmo recorte;
  - impedir que tentativa inválida ou interrompida deixe asset tenant-visible ou reutilizável;
  - manter renderer e UI sem dependência de `DBRow`, Supabase ou SDK de provider.
- Incorporado do Gestor de Updates:
  - logs estruturados correlacionáveis por `request_id`;
  - verificador SQL read-only versionado para 1:N, FKs, RLS, grants, revisão corrente e ausência de overwrite;
  - Supabase Storage privado com contrato explícito de bucket, path, tenant, visibilidade, segurança e falha;
  - copy original, útil, específica e apoiada nas fontes autorizadas;
  - prova humana de reconhecimento de público, oferta, CTA e próximo passo;
  - QA autenticado desktop/mobile e baseline limitada de WCAG 2.2.
- Incorporado do Gestor de Automações:
  - fluxo controlado sem tools, browsing, PTC, persisted reasoning, agente, job ou fallback silencioso;
  - Structured Output estrito, `store:false`, uma chamada textual e nenhuma repetição automática;
  - workload de imagem separado, revalidação de acesso antes do provider e antes da persistência, telemetria por chamada e limites temporais explícitos;
  - prova factual de disponibilidade dos modelos e da duração da Function antes de habilitar a geração real.
- Não incorporado:
  - reintroduzir E18.5 ou `module-catalog`; conflita com a decisão competente de `docs/lp-planejamento.md` para o Cenário E;
  - criar nova entidade concorrente de revisões; conflita com a decisão humana 1A;
  - tornar Vercel Toolbar, cache avançado, CDN adicional, observabilidade externa ou políticas amplas de produto requisitos desta entrega.
- Oportunidades condicionais registradas apenas para reavaliação futura: `supa#8`, `supa#33`, `supa#63`, `vercel#1`, `vercel#21`, `prod#3`, `prod#12`, `prod#15` e `prod#23`.

## 2. Contrato estrutural e de geração

### 2.1. Divisão de responsabilidades

- E18.4 continua autoridade dos limites universais de texto, hierarquia, responsividade, acessibilidade e qualidade visual.
- E19.4 mantém uma única autoridade de apresentação, repo-only e versionada em `lib/conversion-content/landing-page/`, derivada da API pública de E18.4 e limitada às necessidades desta consumidora.
- Essa autoridade não é um novo catálogo E18.5: ela não oferece composição comercial reutilizável, planos, módulos arbitrários ou variantes externas ao caso E19.4.
- Structured Output, validator, snapshot e renderer importam a mesma autoridade pública; não duplicar enums, cardinalidades ou regras em prompt, rota ou adapter.
- `lib/lp-builder/` contém casos de uso, contratos de tentativa/revisão e adapters server-only; não contém componentes visuais.
- `lib/openai-workloads/` contém identidade, configuração efetiva e observabilidade dos workloads; não contém prompt da feature nem regra narrativa.
- O prompt versionado fica próximo da feature consumidora e é criado pelo fluxo canônico de prompts antes da implementação do provider.
- O workspace autentica, autoriza e orquestra. O renderer recebe somente DTO validado e URLs de mídia já resolvidas, sem conhecer Supabase, tabelas, sessão ou provider.

### 2.2. Autoridade de apresentação v1

- Versão executável inicial: `landing_page_presentation_contract: 1`.
- A candidata possui `contractVersion: 1` e `sections`, com no mínimo 4 e no máximo 10 seções.
- Formas permitidas:
  - `header`: zero ou uma; quando presente, primeira; layout `standard`; permite apenas `ctaLabel` opcional, enquanto marca, logo e destino são resolvidos server-side;
  - `hero`: exatamente uma; primeira seção de conteúdo; layouts `media_left | media_right`; contém `eyebrow | null`, `heading`, `body`, `ctaLabel` e `mediaBrief`;
  - `text_media`: zero a três; layouts `media_left | media_right`; contém `heading`, `body` e `mediaBrief`;
  - `cards_grid`: zero a duas; layouts `grid_2 | grid_3`; contém `heading`, `intro | null` e 2 a 6 cards com `title` e `body`;
  - `steps`: zero a uma; layout `numbered`; contém `heading`, `intro | null` e 2 a 5 itens com `title` e `body`;
  - `faq`: zero a uma; layout `accordion`; contém `heading` e 2 a 6 itens com `question` e `answer`;
  - `cta`: uma ou duas; layout `centered`; contém `heading`, `body | null` e `ctaLabel`;
  - `footer`: zero ou uma; quando presente, última; layout `standard`; permite `tagline | null`, enquanto marca, contatos, consentimento e destinos são resolvidos server-side.
- Cada variante possui shape próprio em união discriminada por `kind`; não usar objeto genérico com fields alheios à variante.
- Todos os fields do JSON Schema são `required`; opcionalidade semântica é representada por `null`; objetos usam `additionalProperties:false`.
- A candidata contém ao menos um `mediaBrief` principal no `hero`; `text_media` pode solicitar mídia adicional, mas a primeira entrega gera no máximo uma imagem e o validator exige que os demais slots sejam omitidos.
- `brand_logo_asset` é exclusivo da marca no Header/Footer e nunca satisfaz mídia de `hero` ou `text_media`. O fluxo atual não possui asset geral de imagem do cliente; a mídia principal exige o workload de imagem. Biblioteca, upload ou seleção futura permanecem fora deste recorte.
- Heading, body, CTA e itens respeitam os papéis semânticos, faixas e `absoluteMax` da E18.4. O schema aplica limites máximos; o validator aplica cardinalidade, ordem, unicidade, hierarquia e coerência entre variante e layout.
- A IA decide narrativa, copy, presença das formas opcionais e sequência das formas intermediárias dentro dessas invariantes. Não gera HTML, CSS, React, JavaScript, URL, telefone, e-mail, logo, consentimento, ID ou path de asset.

### 2.3. Structured Output e validação

- Workload textual: `landing_page_draft_generation`, `product_runtime`, Responses API, `gpt-5.6-luna`, `reasoning.effort=max`, `store:false`, `tools:[]`, schema estrito e `max_output_tokens=12000`.
- Uma tentativa realiza exatamente uma chamada textual; timeout de 120 segundos; sem retry, fallback de modelo, redução de effort ou troca de schema automática.
- O request contém somente instruções versionadas, `modelContext` E19.3 e autoridade estrutural necessária. `serverContext` bruto, secrets, tokens, destinos e referências privadas ficam fora do modelo.
- Refusal, resposta incompleta, timeout, erro HTTP, parse inválido, shape inválido, cardinalidade inválida ou violação determinística encerram a tentativa sem revisão.
- Structured Output limita forma, não garante veracidade. O validator cruza apenas claims objetivamente verificáveis com fatos autorizados; copy livre é restringida pelo prompt e avaliada humanamente.
- O validator recusa credencial, resultado, prova social, disponibilidade, preço, endereço, condição comercial, pessoa, cliente ou outro fato específico não autorizado.
- A candidata validada ainda não é revisão: mídia, bindings, snapshot e persistência precisam concluir integralmente.

### 2.4. Workload de imagem

- Workload canônico separado: `landing_page_draft_image_generation`, `product_runtime`.
- O contrato E21.1 passa a ser uma união discriminada por API: `responses_text | image_generation`.
- `responses_text` preserva `model`, `reasoningEffort`, tokens, reasoning tokens e Structured Output. `image_generation` contém somente `model`, `size`, `quality`, `format`, `compression` e moderação aplicáveis.
- Baseline: Images API compatível com `gpt-image-2`, uma imagem (`n=1`), `quality=medium`, moderação padrão, tamanho landscape suportado mais próximo de `1536x1024`, saída WebP e compressão explícita de 80.
- O registry registra somente parâmetros aplicáveis à API/modelo de imagem. Não transportar `reasoning.effort`, Structured Output, `max_output_tokens` textual ou outro parâmetro exclusivo do workload textual.
- O brief visual deriva do `mediaBrief` validado e dos fatos semânticos autorizados; não recebe `serverContext` bruto, secrets, destinos ou alegações específicas não comprovadas.
- A imagem é cenográfica/representativa e não pode fingir ser imóvel disponível específico, cliente, pessoa real, prova social, credencial, localização exata, resultado ou condição comercial.
- Exatamente uma chamada de imagem por tentativa, timeout de 120 segundos, sem retry automático e sem fallback silencioso para outro modelo ou asset externo.
- Falha da imagem encerra a tentativa sem revisão. A operação não cria segundo planejamento semântico nem outro agente.
- Telemetria própria registra `request_id`, workload, modelo, configuração efetiva, prompt/brief version, status, latência, quantidade/dimensões, custo datado e erro seguro, sem inventar tokens, reasoning ou `max_output_tokens` para imagem. Inventário humano pode projetar `reasoningEffort=not_applicable`, mas esse campo não é enviado ao provider.

### 2.5. Workflow controlado

- Gatilho humano explícito para LP legítima em `draft`, residente em Server Action dedicada da rota `/a/[account]/landing-pages/[landingPageId]/preview`, com `maxDuration = 300` no segmento/Function efetivamente implantado.
- A Action recebe somente `accountSlug + landingPageId`, deriva identidade/autorização no servidor e devolve resultado discriminado de sucesso (`revisionId`, `revisionNumber`) ou erro público tipado, sem payload do provider.
- O PR A já implanta a shell autenticada mínima da rota e esse gatilho, sem renderer nem leitura da revisão. Readiness ausente retorna indisponibilidade segura antes de acessar o schema novo ou providers; após o apply, a mesma Action fica apta a executar os dois appends controlados.
- Antes de qualquer provider:
  - revalidar sessão, conta, membership, entitlement, LP e vínculo da configuração;
  - resolver deterministicamente `primary_conversion_channel`: `whatsapp → whatsapp_destination`, `phone → phone_destination`, `email → email_destination` e `external_url → external_url_destination`;
  - rejeitar `form` com `UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL` antes do provider; formulário exige recorte futuro próprio para interação, consentimento operacional e handling de lead, sem importar E18.5;
  - confirmar disponibilidade física da migration 1:N, função de append e bucket privado por readiness probe fail-closed;
  - compilar pacote E19.3 v3 válido;
  - confirmar configuração E21.1 efetiva e canários aprovados dos modelos.
- Processamento:
  - gerar e validar candidata textual;
  - resolver deterministicamente logo, CTA, destinos, contatos e consentimento do `serverContext`;
  - usar `brand_logo_asset` somente no binding de marca e gerar a imagem principal pelo workload dedicado;
  - normalizar mídia para o contrato permitido e fazer upload privado com `upsert:false`;
  - revalidar acesso, LP e entitlement imediatamente antes da persistência;
  - construir snapshot imutável e executar append atômico da revisão.
- Limite textual de 120 segundos, limite de imagem de 120 segundos e orçamento total de 270 segundos. A Function que contém o caso de uso precisa de `maxDuration >= 300` comprovado no ambiente alvo.
- Não há fila, cron, webhook, job, browsing, tools, PTC, persisted reasoning, Agents SDK ou multi-agent.
- Cada tentativa possui `attemptId` e `request_id` correlacionáveis, mas tentativa inválida não cria registro tenant-visible de revisão.

## 3. Persistência 1:N, mídia e snapshot

### 3.1. Evolução de `account_landing_page_materializations`

- Criar nova migration incremental; não editar a migration aplicada `20260811133500_e19_4_4_landing_page_materializations.sql`.
- Evoluir a tabela existente, sem criar tabela concorrente de revisões:
  - adicionar `id uuid` com geração server-side e torná-lo PK após backfill;
  - preservar `landing_page_id`, `account_id`, `content_json`, `generation_context_snapshot_json`, `created_by` e `created_at`;
  - adicionar `revision_number bigint` positivo;
  - adicionar `attempt_id uuid`, nulo somente para materializações históricas anteriores ao recorte;
  - backfill de cada linha histórica com `revision_number=1` e novo `id`, sem alterar conteúdo ou snapshot;
  - substituir a PK histórica em `landing_page_id` pela PK em `id`;
  - criar unicidade `(landing_page_id, revision_number)` e unicidade parcial de `attempt_id` quando não nulo;
  - indexar `(account_id, landing_page_id, revision_number desc)` para leitura tenant-safe da corrente.
- A revisão corrente é sempre a linha válida de maior `revision_number` da LP. Não persistir flag mutável `is_current` nem sobrescrever revisão anterior.
- O append ocorre somente por função transacional versionada que:
  - bloqueia a linha pai de `account_landing_pages`;
  - comprova `account_id`, LP em `draft` e identidade esperada;
  - recusa `attempt_id` repetido;
  - calcula `max(revision_number)+1` sob lock;
  - insere uma única linha completa e devolve `id + revision_number`;
  - não atualiza nem apaga materialização anterior.
- A função usa `SECURITY DEFINER` somente se necessário para retirar escrita direta da Data API, com owner controlado, `search_path` fixo, argumentos validados, `EXECUTE` revogado de `public`, `anon`, `authenticated` e `ai_readonly`, e concedido apenas a `service_role`.
- Revogar `INSERT`, `UPDATE`, `DELETE` e `TRUNCATE` diretos da tabela para roles de runtime; permitir leitura somente ao boundary server-side necessário. A escrita do produto usa exclusivamente a função de append.
- RLS permanece habilitada sem policies para `anon` ou `authenticated`; grants e exposição Data API são verificados explicitamente.
- Materialização histórica permanece legível como revisão 1 e não é recriada, migrada para outra entidade nem sobrescrita.

### 3.2. Storage privado e referência canônica

- Criar/configurar por migration o bucket privado `landing-page-revision-assets`, sem URL pública.
- O bucket aceita somente WebP da primeira entrega, com limite de tamanho explícito compatível com a imagem otimizada; upload usa `upsert:false`.
- Path canônico: `{accountId}/{landingPageId}/{attemptId}/main.webp`.
- A revisão persiste referência estruturada com `bucket`, `path`, `origin`, `mimeType`, `width`, `height`, `bytes`, `alt`, `imageWorkload`, `imageConfigVersion` e `visualBriefVersion`; nunca persiste URL assinada como identidade.
- Nenhuma policy de `storage.objects` concede leitura ou escrita direta a `anon` ou `authenticated`. Upload, leitura assinada e cleanup pertencem a adapter server-only com `service_role`.
- O consumo gera URL assinada server-side, com TTL de 300 segundos, somente depois de revalidar conta, membership, entitlement, LP e revisão.
- A entrega serve o WebP persistido por signed URL temporária, sem transformação assinada.
- Se upload concluir e qualquer validação/persistência posterior falhar, executar cleanup best-effort pelo path exato. Falha de cleanup gera log estruturado seguro; como o bucket é privado, o path é não enumerável e não existe referência persistida, o objeto órfão não fica tenant-visible nem reutilizável pelo produto.

### 3.3. Snapshot reproduzível

- `content_json` contém somente o DTO final validado, já combinado com bindings determinísticos e referências canônicas de mídia.
- `generation_context_snapshot_json` preserva:
  - `attemptId`, `request_id`, `promptVersion` e versão do contrato de apresentação;
  - identidades e `modelContext` E19.3 efetivamente usados;
  - fatos server-side necessários para reproduzir os bindings, sem secrets, tokens ou URLs assinadas;
  - versões/configurações efetivas dos workloads textual e de imagem;
  - referência e metadata canônica da mídia;
  - resultado dos validators e timestamps relevantes;
  - tokens e reasoning tokens somente para o workload textual, latências e custo estimado com fonte/data da tabela de preços;
  - quando preço confiável não estiver reconciliado, `estimatedCost=null` e `costStatus=unavailable`, sem bloquear usage, status ou latência.
- Não persistir raciocínio privado, response bruto desnecessário, chave de API, sessão, signed URL ou segredo operacional.
- Renderer e preview leem apenas materialização + referência canônica; não recompilam E19.3 e não consultam fontes mutáveis para reconstruir a revisão.

### 3.4. Invariantes e verificador hospedado

- Após o apply, o caso de uso server-side controlado executa dois appends explícitos na mesma LP de prova; o snippet não produz mutações.
- Um snippet SQL estritamente read-only e versionado deve inspecionar no ambiente alvo:
  - colunas, PK, FKs, checks, uniques e índice de corrente;
  - preservação das linhas históricas como revisão 1;
  - ausência de duplicidade por LP/revisão e por `attempt_id` novo;
  - RLS, policies, grants e execução da função apenas pelas roles previstas;
  - bucket privado, limites e ausência de policies públicas/autenticadas;
  - leitura determinística da revisão corrente por maior `revision_number`;
  - duas revisões criadas pelo caso de uso, conteúdo anterior preservado, numeração crescente e ausência de overwrite.
- Runtime fica fail-closed enquanto migration, função ou bucket não estiverem aplicados. O PR não altera schema remoto antes do merge humano.

## 4. Renderer, preview e prova humana

### 4.1. Rota e boundaries

- Reutilizar/adaptar `/a/[account]/landing-pages/[landingPageId]/preview` dentro do workspace autenticado.
- `AccessProvider` não substitui autorização server-side. O loader/caso de uso revalida conta, membership, entitlement, LP e revisão antes de qualquer leitura ou URL assinada.
- A rota coordena estados de loading, vazio, indisponível e erro seguro; não expõe row, path bruto, service role ou detalhe sensível.
- O adapter server-only lê a revisão corrente por `(account_id, landing_page_id)` e resolve URLs assinadas.
- O renderer é componente puro/read-only: recebe `LandingPageRenderModel`, não importa Supabase, `DBRow`, autenticação, OpenAI ou casos de uso.
- Workspace e chrome do produto permanecem fora do conteúdo visual da LP; a LP é renderizada em superfície própria dentro do preview, sem converter o renderer em nova área administrativa.

### 4.2. Contrato visual e funcional

- Renderer exaustivo por `kind`; variante desconhecida falha de forma segura e observável, sem HTML livre.
- Mobile-first, suporte funcional desde 320 px e sem overflow horizontal; provas canônicas em 360, 768 e 1280 px. Evidência adicional em 1440 px é permitida, mas não substitui 1280 px.
- Imagens preservam proporção, reservam espaço para evitar layout shift e usam `alt` significativo validado.
- Hierarquia possui um único H1, ordem de headings coerente, CTA principal reconhecível e estados de foco visíveis.
- Navegação e CTA são operáveis por teclado; não há interação essencial dependente apenas de hover; controles possuem nome acessível; áreas de toque e contraste seguem baseline limitada de WCAG 2.2 aplicável ao recorte.
- Footer, contatos, consentimento e destinos vêm dos bindings determinísticos. `whatsapp`, `phone`, `email` e `external_url` exigem seus respectivos destinos válidos; `form` falha antes do provider com `UNSUPPORTED_PRIMARY_CONVERSION_CHANNEL`.
- Não declarar conformidade WCAG integral. Registrar apenas os critérios efetivamente testados.
- A mídia deve ser pertinente, nítida no tamanho de prova e suficientemente otimizada; a validação registra dimensões, bytes, formato e ausência de erro visível.

### 4.3. Prova humana da primeira LP real

- A prova usa a LP real `Primeiro imóvel no Rio` após readiness hospedado e geração explícita.
- Avaliar e registrar no PR, relacionando `revisionId`, `revisionNumber`, `attemptId`, `promptVersion`, contrato estrutural e configurações dos dois workloads:
  - adequação público/oferta;
  - jornada persuasiva;
  - qualidade, originalidade e especificidade da copy;
  - hierarquia/estrutura visual;
  - qualidade/pertinência da imagem;
  - clareza do CTA/conversão.
- Gates binários obrigatórios: factualidade, segurança e funcionamento. Qualquer gate reprovado bloqueia a aceitação da primeira prova.
- O humano deve reconhecer público, oferta, CTA e próximo passo sem depender de explicação externa.
- QA autenticado no Preview verifica desktop e mobile, legibilidade, hierarquia, overflow, mídia, CTA, acesso tenant-safe, estados de erro e console visível.
- Vercel Toolbar é opcional e não substitui evidência do fluxo real.
- Não há piso numérico global nesta primeira prova. Notas humanas orientam iteração futura, sem trocar modelo ou effort silenciosamente.

## 5. Plano executável por subseção

### 5.1. E19.4.3 — Geração controlada e candidata válida

- Automações: sim — `2.1.3`, IA em fluxo controlado no runtime do LP Factory.
- Implementar autoridade de apresentação v1, DTO discriminado, schema estrito, validators e fixtures.
- Criar o prompt de runtime pelo fluxo canônico e registrar sua versão.
- Evoluir E21.1 de forma aditiva para `reasoning.effort=max` e registrar os dois workloads com configurações próprias.
- Discriminar E21.1 em `responses_text | image_generation`, inclusive resolução e eventos, sem parâmetros textuais no request de imagem.
- Implementar provider adapters, timeouts, telemetria, tratamento de refusal/incomplete e fail-closed.
- Implementar no PR A a shell autenticada mínima da rota, Server Action dedicada, readiness anterior ao schema/provider, matriz de bindings dos canais suportados, fail-closed para `form`, revalidações de acesso e pacote E19.3 v3.
- Antes da geração real, comprovar:
  - canário `gpt-5.6-luna + max + store:false + schema estrito mínimo` no Preview, sem persistência;
  - canário `gpt-image-2` com configuração mínima, sem persistência;
  - `maxDuration >= 300` na Function/ambiente alvo.
- Se modelo, parâmetro ou duração não estiver disponível, encaminhar evidência factual ao Analista; não aplicar fallback por inferência.
- Aceite: testes focais provam uma chamada textual, schema/validator, ausência de retry, separação dos workloads, segurança de contexto e nenhuma revisão em falhas.

### 5.2. E19.4.4 — Revisões append-only, mídia e snapshot

- Automações: não.
- Criar migration incremental da tabela existente, função de append, bucket privado, grants/RLS e snippet hospedado.
- Implementar adapters server-only de append, leitura corrente, upload, cleanup e referência canônica.
- Expor o append exclusivamente pelo gatilho autenticado da shell mínima do PR A; antes do apply ele retorna indisponibilidade segura, e depois do apply permite a prova controlada sem antecipar renderer ou read model.
- Persistir revisão somente após candidata, bindings, mídia e snapshot integralmente válidos.
- Substituir fixtures, testes e snippet negativos que ainda cristalizam 1:1, preservando a migration antiga apenas como histórico aplicado.
- Aceite local: duas revisões válidas da mesma LP preservam payloads distintos; corrente é a maior revisão; tentativa repetida não duplica; falha não deixa revisão.
- Aceite hospedado do PR A: migration aplicada pelo fluxo oficial após merge; dois appends executados separadamente pelo caso server-side controlado; verificador SQL read-only comprova as duas revisões, numeração e ausência de overwrite.

### 5.3. E19.4.5 — Renderer, preview e prova humana

- Automações: não.
- Evoluir no PR B a shell já implantada, acrescentando loader autorizado, read model e renderer puro exaustivo.
- Implementar estados seguros e resolução server-side de signed URL.
- Validar suporte desde 320 px e provar visualmente em 360, 768 e 1280 px; 1440 px é evidência adicional. Verificar teclado, foco, headings, contraste aplicável, mídia, CTA e console.
- Gerar a primeira LP real somente após readiness de banco, Storage, modelos e Function.
- Registrar no PR a rubrica humana, gates binários e metadados da revisão de prova.
- Aceite: preview autenticado da revisão corrente reproduz snapshot sem fontes mutáveis, revisão anterior permanece preservada e os três gates binários são aprovados.

### 5.4. Ordem, gates e validações

- Ordem obrigatória no PR A: E19.4.3 → gate do Analista → ABCs aplicáveis → E19.4.4 → gate/revisão final do Analista → ABCs e merge humano.
- Depois do merge do PR A: apply oficial → dois appends pelo gatilho autenticado já implantado → verificador hospedado read-only → nova branch na mesma worktree → PR B com read model, renderer e apresentação completa da E19.4.5 → avaliação final do Analista → ABCs finais → merge humano.
- Antes da implementação: Analista Passagens 1 e 2, matriz de consolidação substituída, ABC de `docs/roadmap.md` e checkpoint `LP-Factory-Stage: plan-v2-approved`.
- Para cada subseção com código: `npm ci`, `npm run check`, testes focais e `git diff --check`; não executar `npm run build` no sandbox Codex.
- Alteração visual: iniciar `npm run dev`, abrir a URL indicada e validar tela, comportamento e erros visíveis.
- Alteração Supabase: validar migration localmente sem mutar remoto; qualquer apply remoto ocorre somente pelo workflow oficial após merge humano.
- Antes do PR final: revisar `main..HEAD` e `main...HEAD`, secrets, `.env`, banco, workflows, arquivos e commits do escopo.

## 6. Impacto documental e matriz de transporte

- Preservação:
  - identidade estável da LP, tentativa separada de revisão, append-only, uma chamada textual, Structured Output, E19.3 v3, rubrica humana e gates binários.
- Extensão adjacente necessária:
  - E21.1 para `max` e os dois workloads;
  - `docs/schema.md` para a evolução 1:N e Storage;
  - `docs/platform-config.md` para bucket privado, duração e configurações de runtime;
  - `docs/base-tecnica.md` para boundaries, persistência e renderer;
  - `docs/openai-model-snapshot.md` para modelos/configurações comprovados;
  - `docs/gestor-automations.md` para o workflow controlado e workloads;
  - `docs/roadmap.md` para tornar executáveis as subseções 3.1–3.3.
- Expansão rejeitada:
  - E18.5/module catalog, E20.3/E10.8 como gates, entidade concorrente de revisões, publicação, editor, histórico visual, DAM, analytics, agente, fila e infraestrutura ampla.
- A matriz pós-Passagem 1 deve registrar cada achado dos três especialistas, a decisão 1A–4A, tratamento, destino e evidência, além da exclusão integral da seção 1.7 da v1.

## 7. Escopo negativo e critérios de parada

### 7.1. Fora do recorte

- E19.5, publicação pública, domínio customizado e disponibilidade comercial.
- Tracking, analytics, CRM, Ads, A/B test e engine de experimentos.
- Editor visual/manual, interface de histórico/comparação e biblioteca ampla de assets.
- Upload/seleção de imagem pelo cliente, mídia externa/licenciada e DAM.
- Transformação assinada de imagem; só pode voltar em recorte futuro se necessidade medida e compatibilidade do plano hospedado forem comprovadas.
- Lifecycle `archived`, restauração, hard delete e retenção definitiva.
- Cenário D, E18.5, E20.3, E10.8 ou camada intermediária semântica.
- HTML/CSS/React/JS livre gerado pela IA.
- Agente, multi-agent, PTC, persisted reasoning, Agents SDK, tools, browsing, job, fila, cron ou webhook.
- Perfil persistido novo de público/persona, nova superfície administrativa ou segundo DTO narrativo.
- Otimizações condicionais dos catálogos sem caso real nesta entrega.

### 7.2. Critérios de parada

- Parar se E19.3 v3 não fornecer informação indispensável sem fonte autorizada.
- Parar se a solução precisar inventar fato, prova, credencial, destino, pessoa, propriedade ou capacidade.
- Parar se a tabela existente não puder evoluir preservando linhas históricas e append-only; apresentar conflito factual antes de considerar outra entidade.
- Parar se Storage privado não puder fornecer referência estável e signed URL server-side tenant-safe.
- Parar se os workloads/modelos/parâmetros confirmados não estiverem disponíveis no ambiente alvo e encaminhar a evidência ao Analista sem fallback silencioso.
- Parar se uma tentativa inválida puder criar revisão ou asset tenant-visible/reutilizável.
- Parar se renderer ou preview dependerem de fonte mutável para reproduzir a revisão.
- Parar se houver necessidade real de ampliar escopo, autoridade ou categoria de automação.

### 7.3. Condições pós-merge

- O merge é exclusivamente humano pelo GitHub Web.
- Como o Preview usa o Supabase principal e a migration só é aplicada pelo fluxo oficial após merge, o PR A implanta a shell autenticada e a Action, mas mantém a mutação bloqueada por readiness até o apply; “fail-closed” não significa ausência do entrypoint necessário à prova.
- Após merge humano do PR A, o apply oficial habilita o mesmo gatilho autenticado para os dois appends controlados; o verificador read-only inspeciona o resultado, e ambos são gates para abrir o PR B.
- O PR B acrescenta read model, renderer e apresentação completa do preview, executa o canário integrado final e produz a primeira LP real antes de sua avaliação final e merge humano.
- O trabalho não simula apply remoto nem marca gates hospedados como concluídos antes da evidência real.
- E19.5 permanece pausada até a primeira LP real ser produzida e avaliada.

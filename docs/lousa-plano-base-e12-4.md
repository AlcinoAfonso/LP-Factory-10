# Plano-base — E12.4 — Gestão do perfil de orientação

- Data: 04/08/2026.
- Versão: v2.9.
- Status: E12.4.3, E12.4.3.1 e E12.4.3.2 implementadas e incorporadas à `main` pelo PR #672; correção da cardinalidade de cobertura concluída no PR draft #681, com gate funcional hospedado aprovado e inspeção final ainda pendente.
- Recorte previsto para o roadmap: `12.4 — Gestão do perfil de orientação`.
- Recorte executável inicial: `12.4.3 — Proposta, revisão, aprovação e ativação do perfil`.
- Recorte corretivo planejado: `12.4.3.2 — Criação e evolução estrutural baseada em lp_sections, catálogo vigente e debate humano–IA`.
- Path canônico: `docs/lousa-plano-base-e12-4.md`.
- Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A E20.3 fornece o contrato versionado, a persistência mínima e a resolução server-side, read-only e fail-closed do perfil `active` próprio ou herdado.
- A E12.4.3 e a E12.4.3.1 já entregaram a operação oficial do lifecycle e a assistência por IA no editor.
- O teste do primeiro perfil revelou um desvio funcional: a tela começa pelo preenchimento manual e a IA também propõe textos de orientação, quando a ação principal deveria criar a estrutura a partir de `lp_sections`.
- A E12.4.3.2 deve corrigir o fluxo para que:
  - sem perfil próprio, a ação destacada seja `Criar perfil com IA`;
  - com perfil `active` próprio, a nova versão use `Evoluir perfil com IA` e inicialize o editor com a estrutura completa ativa como baseline;
  - `lp_sections` seja o esqueleto obrigatório da análise;
  - a IA reavalie cada recomendação contra as pesquisas e o catálogo vigentes, distinguindo identidades compatíveis das efetivamente escolhidas, enquanto o servidor deriva prioridade e ordem;
  - o debate ocorra sobre a nova versão em `draft`, com proposta candidata e diff transitórios antes de qualquer aplicação ao editor;
  - a IA informe o delta de seções sem módulo ou variante compatível;
  - a pesquisa bruta arquivada seja usada apenas como contexto complementar quando existir e couber integralmente na requisição, sem novo gate;
  - `generation_guidance` e `item_guidance` sejam exceções opcionais e exclusivamente humanas;
  - o humano escolha entre aguardar a criação dos módulos faltantes ou prosseguir com os disponíveis, mantendo aviso explícito.
- O resultado continua sendo um perfil orientativo. Não é composição final, LP, autorização de geração nem criação automática de módulo.

### 1.2. Fontes usadas

- `README.md`.
- `docs/prompt-estrategista.md` v25.
- `docs/template-roadmap.md`.
- `docs/gestor-automations.md`.
- `docs/lp-planejamento.md`, especialmente 1.6, 1.7, 1.8 e 4.2.
- `docs/roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/lousa-plano-base-e20-3.md`.
- PR #662 e convenção opcional `docs/pesquisas-brutas/<taxon_slug>/<audience_scope>/v<research_version>.md`.
- PR #644 e implementação vigente da E20.3:
  - `lib/conversion-content/landing-page/generation-profile/`;
  - `lib/conversion-content/adapters/landingPageGenerationProfileAdapter.ts`;
  - migration `20260726144651_e20_3_generation_profile.sql`.
- Parecer do Gestor de Automações e decisões humanas de 28 e 29/07/2026:
  - automação opcional;
  - categoria `Automação com IA em fluxo controlado`;
  - ambiente `Runtime do LP Factory`;
  - OpenAI condicional;
  - acionamento exclusivo pelo `platform_admin`;
  - validação determinística, revisão e ativação humanas e fallback manual completo;
  - `lp_sections` como fonte estrutural principal da proposta;
  - IA limitada à compatibilidade e à seleção explícita de módulos e variantes e ao delta do catálogo, com prioridade e ordem derivadas pelo servidor;
  - `generation_guidance` e `item_guidance` como exceções opcionais exclusivamente humanas;
  - independência da LP materializada em relação às fontes usadas na geração inicial.

### 1.3. Decisões funcionais fixas

- Perfil próprio é permitido somente para segmento e nicho no MVP.
- Ultranicho usa o perfil `active` do ancestral elegível mais próximo.
- Os estados persistidos permanecem somente `draft`, `active` e `archived`.
- Uma versão `active` é imutável; mudança exige nova versão em `draft`.
- Ao iniciar a evolução, o editor copia integralmente a estrutura do `active` como baseline transitório; a cópia não persiste e nenhuma recomendação herdada continua válida sem reavaliação.
- Existe no máximo uma versão `active` por taxon proprietário e a versão é única nesse taxon.
- O mesmo `platform_admin` pode revisar e executar `Aprovar e ativar`; a decisão é humana e auditada, sem novo status persistido.
- Quando não houver perfil próprio, a ação inicial destacada deve ser `Criar perfil com IA`; quando houver perfil `active` próprio, a ação contextual deve ser `Evoluir perfil com IA`.
- O fluxo manual permanece alternativa completa nos dois contextos.
- A hierarquia das fontes é: E10.8 estruturada, aprovada e obrigatória como fonte operacional; E18.5 como fonte canônica das identidades executáveis; pesquisa bruta como contexto complementar opcional; feedback humano como hipótese ou orientação a avaliar.
- A IA usa `lp_sections` como esqueleto estrutural e os demais blocos resolvidos da E10.8 como contexto obrigatório.
- Quando existir pesquisa bruta correspondente à proveniência efetivamente resolvida pela E10.8, ela pode complementar a análise sem substituir, ampliar ou contrariar a fonte estruturada; divergências devem ser apresentadas ao humano e a E10.8 continua governando o perfil.
- A resposta estrutural separa obrigatoriamente:
  - `coverage[]`, com uma avaliação para cada item de `lp_sections`;
  - `recommendations[]`, com a lista final deduplicada por módulo.
- Cada item de `coverage[]` preserva `item_key`, nome da seção, prioridade e ordem de origem e informa cobertura `covered`, `partial` ou `missing`, além das identidades compatíveis, das identidades efetivamente escolhidas e de motivo e impacto quando aplicáveis.
- Compatibilidade não implica seleção: `compatible_aliases` registra as identidades semanticamente compatíveis e `selected_aliases`, transitório, registra somente as escolhidas; selecionar o alias do módulo-base recomenda o módulo sem impor variante.
- `recommendations[]` é derivado exclusivamente das identidades escolhidas e contém somente módulo e variante disponíveis, prioridade `P1`, `P2` ou `P3` e ordem recomendada.
- Prioridade, ordem e posição em arrays não escolhem módulo-base ou variante; seleções diferentes para o mesmo módulo falham fechadas, sem retry.
- `coverage[]`, referências entre seções e módulos, gaps e estados do diff são derivados e transitórios; somente `recommendations[]`, depois de aplicada ao editor e persistida por `Salvar rascunho`, integra o perfil.
- A IA não cria módulo, variante ou identidade e não preenche nem modifica `generation_guidance` ou `item_guidance`.
- `generation_guidance`, no perfil-pai, e `item_guidance`, no item-filho, são exceções opcionais preenchidas somente pelo humano.
- A criação e a evolução por IA atuam somente sobre a estrutura da nova versão em `draft` e preservam integralmente as exceções humanas existentes.
- Em cada rodada, a proposta candidata permanece apenas no estado transitório da interface; nova rodada recebe o draft original, a candidata exibida e o feedback humano mais recente.
- `Aplicar proposta` altera somente o editor não salvo; `Refinar novamente` mantém o editor original intacto; `Descartar proposta` remove a candidata e preserva o editor original.
- Cada acionamento humano autoriza somente uma chamada, sem chat persistente, memória própria, retry ou continuidade automática; a candidata transitória é reenviada explicitamente como entrada quando houver nova rodada.
- Quando houver faltantes, o humano escolhe:
  - aguardar a criação dos módulos, sem concluir o perfil como estruturalmente completo;
  - prosseguir com os disponíveis, mantendo aviso explícito da pendência.
- E18.4, E18.5, E10.8 e o perfil orientam somente a geração inicial.
- Depois de materializada, a LP pertence à conta e permanece independente dessas fontes; mudanças nelas não alteram nem governam automaticamente a LP existente.
- A E12.4.4 e a E19.4 permanecem fora da implementação deste plano, com pendências explícitas registradas em 1.4.

### 1.4. Fronteiras de responsabilidade

- E10.8 fornece a pesquisa resolvida e versionada; dentro dela, `lp_sections` é a fonte estrutural principal da proposta.
- E18.4 e E18.5 fornecem limites e identidades vigentes para a geração inicial; a E12.4.3.2 não os redefine nem cria módulos.
- Tornar `generation_guidance` opcional altera o contrato de domínio da E20.3; a evolução é formalizada na E20.3.5 e implementada no mesmo PR técnico da E12.4.3.2.
- E12.4.3.2 corrige a criação e o refinamento estrutural do perfil no Admin Dashboard.
- E12.4.4 deverá, obrigatoriamente:
  - recalcular ou recuperar os gaps antes de autorizar geração;
  - registrar adiamento com justificativa, impacto, responsável e condição de retomada;
  - classificar se o gap é impeditivo;
  - bloquear autorização enquanto houver gap impeditivo;
  - verificar incompatibilidades entre exceções humanas e os contratos usados na geração inicial.
- O snapshot das fontes e a independência da LP materializada permanecem decisões consolidadas para consumo futuro pela E19.4.
- O futuro plano-base da E19.4 deverá decidir, sem antecipação neste plano:
  - quais edições o cliente poderá fazer após a materialização;
  - quais limites permanentes pertencem ao editor;
  - se haverá regeneração e como ela tratará alterações humanas.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - `platform_admin` acessa a gestão de perfis no Admin Dashboard;
  - seleciona um segmento ou nicho;
  - sem perfil próprio, inicia manualmente ou usa `Criar perfil com IA`;
  - com perfil `active` próprio, inicia a nova versão e usa `Evoluir perfil com IA` quando desejar assistência.
- Entrada comum:
  - taxon proprietário e cadeia ativa;
  - perfil `active` atual, quando existir;
  - identidades públicas vigentes da E18.4 e E18.5.
- Entrada adicional da IA:
  - resultado completo e resolvido da E10.8, com `sourceTaxonId`, `audienceScope`, versões e proveniência;
  - estrutura completa do perfil `active` próprio como baseline, quando houver;
  - conteúdo original atual do editor da nova versão em `draft`;
  - proposta candidata transitória, quando houver nova rodada antes da aplicação;
  - feedback humano mais recente do `platform_admin`, quando informado;
  - pesquisa bruta opcional correspondente a cada fonte resolvida, localizada pelo slug canônico server-side do `sourceTaxonId`, `audienceScope` e `version`, somente quando existir e couber integralmente na requisição.
- Processamento manual:
  - iniciar a próxima versão no editor; quando houver `active` próprio, copiar integralmente sua estrutura como baseline não persistido;
  - preencher recomendações e, excepcionalmente, `generation_guidance` e `item_guidance`;
  - persistir somente após `Salvar rascunho`;
  - permitir alteração somente enquanto a versão estiver em `draft`.
- Processamento com IA:
  - exigir ação explícita do `platform_admin` e resolução completa da E10.8;
  - comparar as versões e proveniências vigentes da E10.8 e as identidades e contratos vigentes da E18.5 com o baseline ativo;
  - copiar apenas o que continua válido e reavaliar semanticamente o que mudou, sem manter recomendação apenas por herança;
  - usar todos os itens de `lp_sections` como esqueleto;
  - fazer correspondência semântica somente com identidades válidas da E18.5;
  - produzir `coverage[]` para avaliar cada seção e `recommendations[]` como lista final única por módulo;
  - permitir que várias seções apontem para o mesmo módulo e que uma seção aponte para mais de um módulo;
  - converter a prioridade de origem explicitamente em `3 → P1`, `2 → P2` e `1 → P3`;
  - ao deduplicar um módulo, preservar a prioridade mais alta entre as seções cobertas;
  - ordenar recomendações pela menor ordem de origem; em empate, usar a primeira ocorrência em `coverage[]` e depois `module_key`, atribuindo ordens finais positivas e únicas em intervalos de 10;
  - separar seções atendidas, parcialmente atendidas e sem correspondência;
  - não inventar identidade nem preencher ou modificar exceções humanas;
  - realizar no máximo uma chamada por acionamento, sem retry ou encadeamento;
  - validar deterministicamente cobertura, identidades, duplicidades, conversão de prioridade e ordem final;
    - apresentar a proposta candidata e o diff antes de alterar o editor;
  - permitir `Aplicar proposta`, `Refinar novamente` ou `Descartar proposta`;
  - aplicar somente ao editor e nunca persistir automaticamente.
- Tratamento do delta:
  - comparar candidata e editor original e mostrar módulos mantidos, adicionados, removidos e substituídos, além de variantes, prioridades e ordens alteradas e gaps novos ou resolvidos;
  - usar `mantido`, `adicionado`, `alterado` e `removido` somente como estados derivados de apresentação, sem persistência no perfil;
  - apresentar seção pesquisada, prioridade, ordem, motivo da ausência e impacto de prosseguir;
  - `Aguardar criação dos módulos` mantém o perfil em `draft`, bloqueia `Aprovar e ativar` e não cria nada automaticamente na E18.5;
  - `Prosseguir com os disponíveis` usa somente recomendações válidas e mantém aviso visível na sessão corrente;
  - nenhuma nova tabela é criada e os gaps não integram as tabelas do perfil;
  - ao salvar o rascunho, registrar no evento de auditoria vigente a decisão `wait_for_modules` ou `proceed_with_available`, os `item_key` afetados, quantidade de gaps, impacto resumido, versões das fontes usadas e, quando utilizada, referência segura da pesquisa bruta com path, versão declarada, commit ou blob, público e taxon de origem;
  - a auditoria preserva a decisão, mas não substitui o recálculo obrigatório dos gaps pela E12.4.4 antes da prontidão.
- Validação:
  - validar taxon, agregado, identidades e versões antes de salvar, ativar ou arquivar;
  - rejeitar saída ou mutação incompatível sem alterar o `draft` nem o `active`.
- Persistência:
  - reutilizar `landing_page_generation_profiles` e `landing_page_generation_profile_items`;
  - criar um boundary de mutação controlado exclusivamente para `platform_admin`;
  - manter `public`, `anon`, `authenticated`, cliente e `ai_readonly` sem escrita direta;
  - usar uma única ação visual `Salvar rascunho`;
  - executar `Aprovar e ativar` atomicamente, arquivando a versão `active` anterior quando existir;
  - tornar `generation_guidance` opcional por migration incremental e atualizar contrato, schemas, DTOs e RPCs pelo menor delta;
  - implementar a superfície em `app/admin/(protected)/perfis-de-orientacao/`, com listagem em `page.tsx`, edição por taxon em `[taxonId]/page.tsx`, Server Actions route-local em `actions.ts` e componentes com estado próprio somente em `_components/`;
  - ajustar `components/admin/adminNavigation.ts` para expor a área;
  - exigir que toda Server Action execute `requirePlatformAdmin` antes de ler entradas operacionais, chamar IA ou mutar estado;
  - impedir que UI e componentes importem Supabase, provider externo ou DBRow;
  - manter contrato, schema e validações puras em `lib/conversion-content/landing-page/generation-profile/`;
  - preservar sem mudança o resolver público active-only da E20.3 e adicionar no adapter métodos e DTOs administrativos separados para listar todas as versões e carregar `draft` e `archived`, sem alterar o shape dos consumidores vigentes;
  - concentrar mutações em adapter server-only coeso sob `lib/conversion-content/adapters/`, sem implementação paralela em `lib/admin`;
  - chamar as RPCs de mutação exclusivamente com o client Supabase vinculado à sessão autenticada, nunca com `createServiceClient()`; o `service_role` permanece limitado à leitura com `SELECT`.
- Consumo:
  - Admin Dashboard apresenta versões e o perfil resolvido atual;
  - o boundary vigente da E20.3 continua entregando somente o perfil `active` próprio ou herdado;
  - somente a futura geração inicial poderá consumir a nova versão ativa;
  - a LP materializada não recebe atualização automática quando catálogo, pesquisa ou perfil evoluem.
- Fallback:
  - manter o editor manual disponível sem IA;
  - preservar o `active` atual em qualquer falha de proposta, salvamento ou ativação;
  - não repetir chamada à IA automaticamente;
  - não converter falha técnica ou saída inválida em ausência de informação.

### 2.2. Contrato do perfil e validações

- O taxon proprietário deve ser segmento ou nicho ativo.
- `generation_guidance`:
  - opcional no banco, contrato e interface;
  - texto não vazio quando informado;
  - preenchimento e alteração exclusivamente humanos.
- Cada recomendação deve conter:
  - módulo e versão existentes;
  - `variant_key` e `variant_version` ambas presentes ou ambas ausentes;
  - variante existente e pertencente ao módulo, quando informada;
  - prioridade `P1`, `P2` ou `P3`;
  - ordem recomendada inteira positiva;
  - `item_guidance` opcional, não vazio quando presente e exclusivamente humano.
- Exemplos de exceção humana:
  - `generation_guidance`: usar somente duas cores nas LPs do nicho;
  - `item_guidance`: impor uma faixa específica ao título do módulo hero.
- No mesmo perfil:
  - módulo não pode se repetir;
  - ordem recomendada não pode se repetir;
  - a versão não pode se repetir para o mesmo taxon proprietário.
- Prioridade e ordem permanecem orientativas e nenhum campo transforma módulo em obrigatório.
- Identidade ausente ou incompatível falha fechado e não é criada ou corrigida automaticamente.
- A E12.4.3.2 não interpreta semanticamente as exceções humanas nem permite que alterem E18.4 ou E18.5.
- Exceção humana incompatível pode permanecer no perfil, mas não autoriza geração: a E12.4.4 deve classificá-la como não pronta e a futura geração deve falhar fechado.
- Os gaps da proposta não são persistidos nas tabelas do perfil neste recorte.

### 2.3. Lifecycle, atomicidade e auditoria

- Criar nova versão:
  - calcular a próxima versão sem sobrescrever histórico;
  - quando houver `active` próprio, inicializar o editor com sua estrutura completa como baseline não persistido;
  - reavaliar todas as recomendações contra E10.8 e E18.5 vigentes antes da aprovação;
  - persistir como `draft` somente após `Salvar rascunho`.
- Salvar:
  - permitir apenas sobre `draft`;
  - usar `Salvar rascunho` tanto após proposta da IA quanto após edição humana.
- Aprovar e ativar:
  - revalidar o agregado;
  - bloquear quando a última decisão auditada para o rascunho for `wait_for_modules`;
  - registrar a decisão humana;
  - arquivar o `active` anterior, quando existir;
  - ativar o novo `draft`;
  - concluir toda a troca atomicamente.
- Arquivar:
  - arquivar `draft` não altera o perfil resolvido;
  - arquivar isoladamente o `active` resolve o ancestral elegível mais próximo ou ausência tipada;
  - arquivar o `active` anterior dentro de `Aprovar e ativar` não cria fallback intermediário.
- Auditoria:
  - reutilizar o mecanismo vigente, sem nova tabela;
  - registrar somente mutações confirmadas;
  - distinguir criação ou salvamento de `draft` com origem manual ou IA;
  - incluir no `changes_json` do salvamento a decisão humana sobre gaps e seu resumo auditável, quando houver;
  - registrar `Aprovar e ativar` como uma operação;
  - registrar arquivamento explícito.

- Criar uma única migration incremental, forward-only, em `supabase/migrations/*_e12_4_3_generation_profile_lifecycle.sql`, sem alterar `20260726144651_e20_3_generation_profile.sql`, e um verificador read-only em `supabase/snippets/e12_4_3_generation_profile_lifecycle_verify.sql`.
- A migration deve criar RPCs distintas para salvar o agregado `draft`, aprovar e ativar e arquivar. Cada função deve usar transação PostgreSQL, `SECURITY DEFINER` justificado e registrado em `docs/schema.md`, `search_path` fixo, `auth.uid()` obrigatório e verificação interna de `is_platform_admin()` ou `is_super_admin()`. Revogar `EXECUTE` de `PUBLIC`, `anon`, `ai_readonly` e papéis não autorizados e conceder somente o `EXECUTE` necessário a `authenticated`.
- As tabelas devem permanecer com RLS habilitado, sem policies de DML direto e sem `INSERT`, `UPDATE` ou `DELETE` para `public`, `anon`, `authenticated`, `service_role` ou `ai_readonly`; `service_role` permanece somente com `SELECT`. As RPCs são a única exposição de mutação pela Data API. Se qualquer acesso direto for introduzido, deverão ser definidos separadamente os GRANTs e as policies correspondentes, invalidando este desenho mínimo.
- A RPC de salvamento deve bloquear o taxon proprietário, confirmar taxon ativo de nível `segment` ou `niche`, alocar a próxima versão sem corrida, criar ou atualizar somente `draft`, substituir seus itens como um único agregado e registrar auditoria somente após sucesso. Ao editar `draft` existente, deve receber `expected_updated_at`, comparar sob lock com o valor persistido e falhar fechado diante de snapshot obsoleto.
- A RPC de ativação deve bloquear o taxon, o `draft` e o `active` vigente; receber e conferir `expected_updated_at` do agregado previamente revalidado; rejeitar snapshot obsoleto ou estado diferente de `draft`; arquivar o `active` anterior; ativar o novo perfil; e registrar um único evento de aprovação e ativação dentro da mesma transação.
- A RPC de arquivamento deve bloquear e revalidar o perfil, receber e conferir `expected_updated_at`, aceitar apenas `draft` ou `active`, registrar arquivamento explícito na mesma transação e não criar fallback intermediário.
- Cada RPC deve reutilizar explicitamente `public.audit_context_event(...)` dentro da mesma transação da mutação confirmada, incluindo `request_id` e resultado humano em `changes_json` quando aplicáveis. É proibido substituir esse vínculo por auditoria paralela ou operação posterior best-effort.
- Antes de salvar e novamente antes de ativar, o boundary puro deve validar o agregado pelo schema vigente e cada identidade exclusivamente por `validateLandingPageModuleIdentity`. O adapter não aceita DTO não validado nem importa o registry da E18.5.
- A evolução E20.3.5 deve ser materializada por migration incremental própria no PR técnico da E12.4.3.2 para permitir `generation_guidance` nulo, sem alterar migrations históricas, preservando invariantes e atualizando RPCs, DTOs, schemas, testes e verificador read-only.

### 2.4. Contrato da assistência por IA

- A assistência permanece opcional, exclusivamente server-side e protegida por `requirePlatformAdmin()`.
- Antes da chamada, o boundary resolve a E10.8, exige resultado completo, separa `lp_sections` e obtém módulos e variantes somente pelas APIs públicas da E18.5.
- O catálogo compacto de seleção complementa o catálogo público de identidades com função estrutural, aliases de variantes, capabilities e kinds de interação, sem expor registry, fields, schema, lifecycle ou versões à IA.
- `lp_sections` é o esqueleto obrigatório; `strategic_core`, `lp_overview` e `seo` apenas contextualizam prioridade, ordem e escolha entre identidades válidas.
- A saída da IA contém somente:
  - `compatible_aliases` para todas as identidades semanticamente compatíveis e `selected_aliases` somente para as identidades efetivamente escolhidas;
  - delta de cobertura parcial ou ausente, com motivo e impacto.
- O contrato de cardinalidade é idêntico no Zod, no JSON Schema estrito e no validador fail-closed: `covered` e `partial` exigem listas compatível e escolhida não vazias; `missing` exige ambas vazias.
- O diagnóstico adicional da falha de cardinalidade registra somente `coverageId`, `coverageStatus`, contagens e índice; `proposalMode` e `interactionKind` distinguem o fluxo, enquanto aliases, pesquisa bruta, prompt, payload, candidata e feedback humano não integram o log.
- O servidor reconstrói versões e deriva prioridade e ordem deterministicamente das `lp_sections`, sem permitir que esses campos escolham módulo-base ou variante.
- A saída não contém `generation_guidance` nem `item_guidance`.
- A resposta estruturada separa:
  - `coverage[]`, com exatamente uma avaliação por `item_key`, podendo referenciar zero, uma ou várias identidades válidas;
  - `recommendations[]`, deduplicado por módulo e sem obrigação de relação um para um com as seções.
- Várias seções podem convergir para uma recomendação; uma seção pode originar várias recomendações quando funções estruturais distintas forem necessárias.
- `coverage[]`, referências seção–módulo, estados do diff e gaps não integram as tabelas do perfil; somente `recommendations[]` aplicadas e salvas integram o agregado, e a decisão humana sobre gaps é registrada no evento de auditoria existente.
- A validação determinística comprova cobertura de todos os itens, subconjunto e cardinalidade das seleções, ausência de conflitos intra e entre coberturas, conversão `3 → P1`, `2 → P2`, `1 → P3`, identidades existentes, vínculo da variante, deduplicação por módulo e ordens finais positivas e únicas.
- Em cada rodada, o provider recebe o editor original, a proposta candidata transitória quando existir e o feedback estrutural mais recente; o merge local preserva integralmente as exceções humanas.
- Cada clique em `Criar perfil com IA`, `Evoluir perfil com IA` ou `Refinar novamente` autoriza uma chamada, sem chat persistente, histórico próprio, memória, `previous_response_id`, retry ou encadeamento.
- A proposta válida é exibida como candidata com diff; somente `Aplicar proposta` substitui a estrutura visível do editor, e salvar, ativar, arquivar e decidir sobre gaps permanecem ações humanas separadas.
- A implementação reutiliza `OPENAI_API_KEY` e `OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL`, Responses API, JSON Schema estrito, `store = false`, limite integral de 96 KiB por requisição e timeout de 30 segundos.
- O carregamento da pesquisa bruta é server-side e determinístico no path `docs/pesquisas-brutas/<taxon_slug>/<audience_scope>/v<research_version>.md`; ausência não bloqueia o fluxo.
- A pesquisa bruta só é incluída integralmente quando couber junto às fontes obrigatórias; se não couber, é omitida sem truncamento silencioso, a proposta continua com E10.8 e E18.5 e a interface informa transitoriamente a omissão por limite.
- Limite de saída ou custo só muda após fixtures comprovarem cobertura, qualidade e custo; truncamento é `technical_failure` e preserva o editor.
- A função de IA não recebe cliente de banco e não salva, ativa, arquiva, cria módulo ou corrige dados.
- O mapeamento de falhas permanece fechado entre `missing_information`, `invalid_data` e `technical_failure`.
- Qualquer falha preserva editor, exceções humanas, `draft` e `active`; nova tentativa exige nova ação explícita.

### 2.5. Critérios visuais

- Área protegida do Admin Dashboard, sem contexto de conta.
- Seleção somente de segmento e nicho.
- Exibição clara do perfil atual como próprio, herdado ou ausente.
- Versão e status sempre visíveis.
- Editor único para recomendações e exceções humanas opcionais.
- Na ausência de perfil próprio, `Criar perfil com IA` aparece antes do editor técnico como ação principal; com perfil `active` próprio, a ação contextual é `Evoluir perfil com IA`; o preenchimento manual permanece alternativa.
- A evolução inicializa o editor da nova versão com a estrutura ativa completa, sem salvar automaticamente.
- Antes da aplicação, a interface mostra candidata, diff e as ações `Aplicar proposta`, `Refinar novamente` e `Descartar proposta`, preservando o editor original.
- Após `Aplicar proposta`, o editor mostra ordem, módulo, variante preferencial opcional e prioridade; módulo presente na lista está recomendado e não existe estado ativado/desativado por item.
- `generation_guidance` e `item_guidance` aparecem como exceções humanas opcionais, visualmente secundárias e sem sugestão automática.
- Quando houver gaps, mostrar seção, prioridade, ordem, motivo e impacto, com:
  - `Aguardar criação dos módulos`;
  - `Prosseguir com os disponíveis`.
- O aviso permanece visível na sessão corrente quando o humano prosseguir; após recarga, a E12.4.3.2 não promete reconstruí-lo pelas tabelas do perfil, e a E12.4.4 deverá recalcular os gaps.
- Ações visuais:
  - criar nova versão;
  - `Criar perfil com IA` ou `Evoluir perfil com IA`, conforme o contexto;
  - `Aplicar proposta`, `Refinar novamente` e `Descartar proposta` durante o debate transitório;
  - `Salvar rascunho`;
  - `Aprovar e ativar`;
  - arquivar.
- O botão de IA informa indisponibilidade quando faltar E10.8.
- Ativação e arquivamento exigem confirmação explícita.
- `missing_information`, `invalid_data` e `technical_failure` são estados distintos.
- Responsividade mínima em desktop e mobile.
- Aplicar WCAG 2.2 como baseline limitada aos critérios pertinentes ao fluxo: operação completa por teclado; foco visível e ordem de foco previsível; associação programática entre campos, labels, instruções e erros; anúncio acessível de feedback dinâmico; alvos de toque adequados; e gestão de foco nas confirmações e após erro ou conclusão. A validação não declara conformidade integral com WCAG 2.2.

### 2.6. Segurança e observabilidade

- Toda leitura e mutação operacional permanece server-side.
- Toda mutação exige `platform_admin` confirmado pelo guard vigente.
- A IA não recebe dados de conta, oferta, campanha, LP, copy produzida, tabelas brutas do banco ou registry interno da E18.5; pode receber somente o Markdown opcional autorizado e resolvido pelas regras deste plano.
- Registrar o mínimo necessário para diagnóstico e auditoria:
  - `platform_admin` solicitante;
  - taxon e versões das fontes utilizadas;
  - origem manual ou IA;
  - sucesso, `missing_information`, `invalid_data` ou `technical_failure`;
  - latência, consumo e custo da chamada quando houver;
  - resultado da revisão humana.
- Logs não devem expor segredo, credencial ou conteúdo não autorizado.
- Cada solicitação de proposta deve registrar evento estruturado com `request_id`, identificador do `platform_admin`, taxon, versões e relações de proveniência da E10.8, versão das identidades públicas da E18.5, referência segura da pesquisa bruta quando utilizada ou motivo transitório de omissão, modelo configurado, OpenAI response ID quando disponível, latência, `input_tokens`, `output_tokens`, custo calculado pelas tarifas operacionais vigentes, resultado (`success`, `missing_information`, `invalid_data` ou `technical_failure`) e, posteriormente, resultado da revisão humana. Logs não podem conter API key, prompt integral, orientação livre do admin, pesquisas brutas, payload completo nem resposta integral. Falha de logging não altera o resultado funcional.
- O provider retorna ao editor um `request_id` opaco e um fingerprint da proposta, usados somente para correlação e nunca para autorização. Ao salvar, a Server Action recomputa o fingerprint: igualdade registra revisão `aceita`; diferença registra `ajustada`. A RPC inclui `request_id` e resultado da revisão no `changes_json` do evento de auditoria da mutação confirmada. A ativação recupera a correlação do último evento auditado do `draft` e registra o mesmo `request_id` como `ativada`. Substituir ou limpar uma proposta ainda não salva registra apenas evento estruturado `descartada`, sem linha de domínio ou nova tabela. Valores ausentes ou inválidos de correlação não impedem o fluxo funcional e são registrados como correlação indisponível.
- A chamada deve usar `store:false`. Isso evita estado de aplicação da resposta, mas não elimina por si só os logs de monitoramento de abuso da OpenAI, que podem ser retidos por até 30 dias no regime padrão; portanto somente a allowlist de dados já aprovada pode sair do LP Factory. Não se exige Moderation API no MVP porque a saída é interna, estruturada, sem ação autônoma e obrigatoriamente revisada por `platform_admin`; essa decisão deve ser reavaliada se o conteúdo passar a ser publicado ou enviado externamente sem revisão equivalente.

## 3. Fases e próxima ação

### 3.1. E12.4.3 — Proposta, revisão, aprovação e ativação do perfil

- Automação: sim.
- Categoria: Automação com IA em fluxo controlado.
- Ambiente: Runtime do LP Factory.
- OpenAI: condicional.
- Objetivo:
  - entregar a operação manual completa do perfil e a proposta opcional por IA, com validação determinística, revisão humana e fallback manual.
- Limites da automação:
  - acionamento exclusivo pelo `platform_admin`;
  - E10.8 completa como gate;
  - entrada e saída fechadas;
  - proposta limitada ao editor;
  - sem agente, ferramentas, repetição automática, persistência, ativação ou geração de LP pela IA.
- Entregas:
  - superfície administrativa protegida para listar, criar, editar, ativar e arquivar versões;
  - boundary de mutação controlado e exclusivo para `platform_admin`;
  - fluxo manual com uma única ação `Salvar rascunho`;
  - fluxo opcional de proposta inicial e refinamento iterativo por IA no mesmo editor, sempre por acionamento explícito e sem estado conversacional persistente;
  - validação determinística do agregado e das identidades públicas da E18.5;
  - `Aprovar e ativar` atômico;
  - arquivamento com efeitos distintos para `draft` e `active`;
  - auditoria e observabilidade mínimas, reutilizando mecanismos vigentes;
  - casos executáveis e evidências visuais;
  - estender os artefatos SQL versionados de teste e verificação do perfil para comprovar: edição exclusiva de `draft`; salvamento íntegro do agregado; unicidade de versão e de `active`; arquivamento explícito de `draft` e `active`; troca atômica entre `draft` e `active`; preservação do `active` diante de falha; e ausência de escrita direta por `public`, `anon`, `authenticated`, cliente e `ai_readonly`; testes mutáveis devem executar em transação com rollback e a verificação pós-apply deve permanecer read-only, sem uso do SQL Editor para alteração de schema;
  - registrar a automação controlada da E12.4.3 em `docs/automations.md`;
  - registrar `OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL`, seu escopo Production/Preview, o consumidor e o endpoint já vigente em `docs/platform-config.md`;
  - registrar o contrato estável de IA controlada, validação, fallback, segurança e observabilidade em `docs/base-tecnica.md`;
  - não criar entrada em `docs/services.md`, novo service, provider abstraction, SDK, agente, job, fila ou infraestrutura;
  - validar a assistência com fixtures representativas da E10.8 e da E18.5, incluindo proposta válida, identidade inventada, duplicidade, recusa, truncamento, timeout e env ausente;
  - manter a operação manual funcional quando a configuração OpenAI ainda não estiver confirmada no ambiente alvo; essa pendência impede declarar a assistência pronta no ambiente, mas não interrompe a implementação independente nem a consolidação do plano;
  - atualização dos documentos canônicos materialmente afetados e de `docs/roadmap.md` pelo Prompt ABC.
- Critérios de aceite:
  - operação manual completa sem dependência da IA;
  - nenhuma chamada à IA sem ação humana e E10.8 completa;
  - proposta válida preenche o editor sem salvar automaticamente;
  - refinamento recebe o conteúdo atual do editor e o feedback humano mais recente, devolve uma proposta completa validada e mantém o editor como não salvo;
  - cada proposta ou refinamento exige um novo clique e realiza no máximo uma chamada, sem retry, encadeamento ou continuidade automática;
  - saída inválida ou falha técnica preserva o `draft` e o `active`;
  - apenas segmento e nicho aceitam perfil próprio;
  - `active` não pode ser editado;
  - exatamente três estados persistidos;
  - invariantes do banco e da E18.5 aplicados em toda mutação;
  - troca de versão ativa comprovadamente atômica;
  - nenhuma escrita direta concedida a `public`, `anon`, `authenticated`, cliente ou `ai_readonly`;
  - mutações confirmadas auditadas sem nova tabela;
  - nenhuma LP materializada alterada;
  - fluxo validado em desktop e mobile;
  - evidenciar em Preview, por logs estruturados correlacionáveis por `request_id`, os resultados `success`, `missing_information`, `invalid_data` e `technical_failure`, incluindo somente taxon, versões das fontes, origem manual ou IA, latência, consumo e custo quando houver; usar o Logs Explorer vigente como meio de inspeção, sem registrar prompt, payload bruto, credencial ou conteúdo não autorizado; AI Debugging permanece apoio opcional e não constitui dependência nem critério de aprovação;
  - no Preview funcional, usar a Vercel Toolbar e suas inspeções de acessibilidade, timing de interação e layout shift somente quando disponíveis no plano e no ambiente; sua indisponibilidade não bloqueia a entrega nem substitui validação humana de conteúdo, navegação, foco, estados e responsividade;
  - em teste humano, o `platform_admin` deve identificar sem ajuda externa o taxon selecionado, se o perfil atual é próprio, herdado ou ausente, sua versão e status, e as ações disponíveis no estado corrente; ações indisponíveis devem permanecer visíveis com motivo objetivo, sem depender de interação oculta;
  - validar em Preview, em desktop e mobile, os estados sem perfil, perfil próprio, perfil herdado, `draft`, `active`, `archived`, IA indisponível, `missing_information`, `invalid_data`, `technical_failure`, confirmação de ativação e confirmação de arquivamento; revisar navegação, conteúdo, foco, feedback, timing de interação e mudanças inesperadas de layout, registrando evidência visual dos estados materialmente distintos;
  - o runtime não considera o lifecycle habilitado antes do apply da migration E12.4.3 e da execução aprovada do verificador read-only no ambiente alvo. RPC ausente, schema cache ainda não atualizado ou ACL divergente deve ser mapeado pelo adapter para indisponibilidade fail-closed, com ações de mutação indisponíveis e preservação integral do `draft` e do `active`. A reconciliação final deve atualizar `docs/schema.md` com funções, ACLs, RLS, policies e grants efetivos e `docs/roadmap.md` com o estado comprovado da E20.3 e da E12.4.3;
  - validações do repositório e evidências do ambiente alvo definidas na v2 e aprovadas antes da execução.

#### 3.1.1. E12.4.3.1 — Refinamento iterativo assistido por IA

- Status: implementada e validada; seu escopo será restringido pela E12.4.3.2.
- Objetivo final:
  - sustentar rodadas explícitas de debate sobre a nova versão em `draft`, refinando módulos, variantes, prioridade, ordem e gaps e preservando exceções humanas.
- Critérios finais:
  - cada refinamento exige novo acionamento explícito;
  - não existe chat persistente, memória própria ou continuidade automática; a proposta candidata é somente estado transitório explícito da interface;
  - falha preserva editor, `draft` e `active`;
  - proposta refinada permanece candidata até aplicação; depois de aplicada, mantém alterações não salvas e bloqueia ativação até novo salvamento;
  - `generation_guidance` e `item_guidance` nunca são enviados para alteração pela IA.
- Escopo negativo:
  - sem tabela, rota estrutural, chat, histórico, memória, agente, `previous_response_id`, provider adicional, E12.4.4 ou geração de LP.

#### 3.1.2. E12.4.3.2 — Proposta estrutural baseada em `lp_sections` e delta do catálogo

- Status: implementada e incorporada à `main` pelo PR #672; correção localizada do contrato de cardinalidade concluída no PR draft #681 e aprovada no gate funcional hospedado.
- Ocorrência corretiva de 03/08/2026:
  - a evolução do perfil foi rejeitada de forma fail-closed como `coverage_identity_count_invalid`, sob o Request ID `c2287d63-0ff9-4fe5-8bc0-641f1e387a7a`;
  - o perfil `active v1` permaneceu preservado e nenhum `draft v2` foi criado;
  - a resposta rejeitada não foi armazenada, portanto a cobertura, o status e os aliases concretos que falharam permanecem desconhecidos e não podem ser inferidos;
  - a correção separa `covered`, `partial` e `missing` no contrato, alinha o prompt e mantém integralmente as validações server-side redundantes.
- Gate funcional hospedado aprovado em 04/08/2026:
  - execução no Preview correspondente exatamente ao HEAD funcional `e6f694454b11388f30355ddbf231bb8350ecef1f`;
  - Request ID `e360a900-082a-4707-9610-ef4f9cdfa2d9`, `proposalMode: evolution`, uma única chamada e resultado `success`;
  - candidata revisada e descartada, sem retry, salvamento ou ativação; somente o perfil `active v1` permaneceu preservado, sem criação de `draft v2`;
  - como observação não bloqueante, `rodape_contato` foi classificado como `covered`, com `compatible_aliases` `final_cta.standard` e `trust_bar.standard` e `selected_aliases` `final_cta.standard`;
  - a avaliação humana considera `rodape_contato` uma possível necessidade global de composição não integralmente coberta pelo catálogo modular; a E12.4.4 deverá recalcular e classificar o item, sem criação automática de módulo ou variante.
- Objetivo:
  - corrigir a criação e a evolução estrutural, o debate humano–IA, o contrato da proposta e a opcionalidade das exceções humanas sem refazer o lifecycle entregue.
- Entregas:
  - destacar `Criar perfil com IA` sem perfil próprio e `Evoluir perfil com IA` quando existir perfil `active` próprio;
- inicializar a nova versão com a estrutura ativa completa como baseline não persistido e revalidar cada recomendação contra as fontes vigentes;
  - usar todos os itens de `lp_sections` como esqueleto;
  - retornar `coverage[]`, recomendações estruturais deduplicadas e gaps;
- manter `coverage[]`, relações seção–módulo, gaps e estados do diff como resultados transitórios;
- mostrar candidata e diff antes da aplicação e permitir aplicar, refinar novamente ou descartar sem alterar o editor original;
- carregar opcionalmente a pesquisa bruta pela proveniência resolvida da E10.8, sem novo gate, truncamento silencioso ou bloqueio por ausência;
  - aplicar as regras explícitas de cardinalidade, prioridade e ordem;
  - perguntar se o humano aguarda módulos ou prossegue com os disponíveis;
  - auditar a decisão no evento vigente e manter aviso na sessão corrente;
  - tornar `generation_guidance` opcional por migration incremental;
  - preservar `item_guidance` opcional;
  - impedir alteração de exceções humanas pela IA;
  - registrar em E12.4.4 a obrigação de recuperar gaps e decidir prontidão;
  - registrar em E19.4 a independência da LP materializada.
- Critérios de aceite:
  - `coverage[]` avalia exatamente cada item de `lp_sections` como atendido, parcialmente atendido ou faltante e não é persistido;
- evolução parte da estrutura ativa completa, mas só mantém recomendações revalidadas contra as versões vigentes da E10.8 e da E18.5;
- rodadas adicionais recebem draft original, candidata atual e novo feedback; descartar preserva o editor original;
  - `recommendations[]` aceita um-para-muitos e muitos-para-um, mas termina único por módulo;
  - somente identidades válidas entram nas recomendações;
  - compatibilidades e escolhas permanecem separadas e transitórias; recomendações derivam somente de `selected_aliases`;
  - módulo-base sem variante exige seleção explícita e conflitos de identidade do mesmo módulo falham fechados sem usar prioridade, ordem ou posição;
  - a prioridade de origem é convertida por `3 → P1`, `2 → P2`, `1 → P3` e a ordem final é determinística, positiva e única;
  - gaps exibem seção, motivo, impacto e decisão humana;
  - a decisão é auditada no salvamento, `wait_for_modules` bloqueia ativação e a E12.4.4 recalcula gaps;
  - IA não produz nem altera `generation_guidance` ou `item_guidance`;
  - prosseguir não oculta a pendência e aguardar não cria módulo automaticamente;
  - lifecycle, auditoria e resolver active-only permanecem funcionais;
  - migration e contratos aceitam `generation_guidance` ausente ou não vazio;
  - testes cobrem cobertura, gaps, identidade inventada, preservação de exceções, env ausente, timeout e truncamento;
  - Preview desktop e mobile comprovam ações contextuais, baseline ativo, candidata com diff, aplicar/refinar/descartar, editor não salvo, decisão de gaps e ausência de salvamento ou ativação automática.
- Escopo negativo:
  - sem tabela de gaps, criação automática de módulos, diálogo com IA para exceções, E12.4.4, E19.4, geração, job, fila, agente ou nova infraestrutura.

### 3.2. Próxima ação

- Preservar o PR #669 incorporado, sem revertê-lo.
- Preservar o PR #672 incorporado e não reutilizá-lo para a correção de cardinalidade.
- Manter a correção em PR draft exclusivo até a inspeção do Estrategista e a revisão independente do Analista sobre schema, prompt, regressões, observabilidade e limites.
- Considerar concluído o gate funcional único no Preview do HEAD `e6f694454b11388f30355ddbf231bb8350ecef1f`, sem repetir a chamada à OpenAI; manter o PR draft até a inspeção final e o merge humano.
- Preservar `vercel#1 — AI Gateway` e `supa#63 — rlsautotest` apenas como oportunidades estratégicas condicionais.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Implementação da E12.4.4; somente o registro explícito de suas pendências integra este plano.
- Autorização ou revogação por conta, taxon e plano.
- E12.4.5, E12.4.6 e implementação da E19.4; somente o registro da independência da LP integra este plano.
- Geração, materialização, preview, publicação ou alteração de LP.
- Perfil próprio de ultranicho.
- Tabela ou persistência de gaps na E12.4.3.2, prontidão, aprendizado automático ou evolução automática do catálogo.
- Criação ou alteração de módulo, variante, E18.4 ou E18.5.
- Dados de conta, oferta, campanha, LP ou copy produzida.
- Acesso a tabelas brutas de pesquisa ou ao registry interno da E18.5.
- Dados externos ainda não aprovados.
- Quarto status, estado `approved`, terceira tabela de domínio ou tabela própria de auditoria.
- Escrita direta por `public`, `anon`, `authenticated`, cliente ou `ai_readonly`.
- Ativação, salvamento, repetição ou correção automática pela IA.
- Chat persistente, histórico de mensagens, memória própria, `previous_response_id`, diálogo com IA para exceções humanas, refinamento automático, retry automático ou otimização baseada em métricas.
- Agente, comportamento agentic, job, fila, cron, webhook, workflow ou nova infraestrutura.
- Implementação além do menor delta necessário para cumprir as entregas e os critérios de aceite da E12.4.3.
- Refatoração, limpeza ou reorganização de áreas não indispensáveis à E12.4.3.
- Abstração genérica criada para necessidade futura ou reutilização ainda não comprovada neste recorte.
- Componente, ação administrativa ou funcionalidade não prevista explicitamente nas entregas e nos critérios de aceite.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - o fluxo exigir ampliar a E12.4.3 ou alcançar a E12.4.4;
  - surgir necessidade de perfil próprio de ultranicho;
  - a mutação segura e atômica exigir nova tabela, nova infraestrutura ou mudança material de arquitetura;
  - a categoria aprovada não atender ao requisito;
  - houver necessidade de agente, ferramenta autônoma ou fonte externa não aprovada;
  - a auditoria vigente não puder ser reutilizada sem ampliar o escopo;
  - uma entrega exigir refatoração lateral, abstração genérica ou funcionalidade não prevista neste plano;
  - houver conflito com o contrato ou a implementação vigente da E20.3;
  - o repositório ou o ambiente alvo divergir das fontes do plano.
  - a base permanecer em Next.js `16.1.1` ou outra versão sem a correção oficial exigida; encaminhar a atualização para PR técnico próprio, fora da E12.4.3.

### 4.3. Validação deste trabalho documental

- Confirmar:
  - quatro seções principais, numeração e ordem preservadas;
  - E12.4.3.2 registrada como sub-recorte corretivo e E20.3.5 como evolução do contrato de domínio;
  - `lp_sections` como fonte estrutural principal;
  - IA limitada a informar `compatible_aliases` e `selected_aliases`, com prioridade e ordem derivadas deterministicamente pelo servidor e gaps derivados da cobertura;
  - `generation_guidance` e `item_guidance` como exceções opcionais humanas;
  - decisão entre aguardar ou prosseguir com aviso;
  - pendências explícitas da E12.4.4 e E19.4;
  - PR #656 preservado fora do escopo;
  - ausência de nova tabela, agente, job, fila, service ou infraestrutura.
- Para este delta corretivo, executar `npm ci`, `npm run check`, as validações do catálogo e do perfil, revisão do diff e verificação de whitespace; banco não se aplica porque a correção não contém nem exige schema ou migration.

### 4.4. Critérios de encerramento do plano

- O plano v2.8 será encerrado somente após:
  - decisão conceitual aprovada;
  - implementação da E12.4.3.2;
  - migration incremental da implementação histórica incorporada pelo PR #663 aplicada e verificada; o PR #672 e a correção de cardinalidade não contêm nem exigem nova migration;
  - validações técnicas e visuais aprovadas;
  - pendência da E12.4.4 e questões ainda não decididas da E19.4 registradas nos documentos próprios;
  - reconciliação documental pelo Prompt ABC;
  - merge humano;
  - confirmação do estado final no ambiente alvo.

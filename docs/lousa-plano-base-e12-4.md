# Plano-base — E12.4 — Gestão do perfil de orientação

- Data: 29/07/2026.
- Versão: v2.3.
- Status: E12.4.3 e E12.4.3.1 implementadas, validadas e reconciliadas na `main`; E12.4.3.2 planejada como correção funcional do fluxo de proposta estrutural.
- Recorte previsto para o roadmap: `12.4 — Gestão do perfil de orientação`.
- Recorte executável inicial: `12.4.3 — Proposta, revisão, aprovação e ativação do perfil`.
- Recorte corretivo planejado: `12.4.3.2 — Proposta estrutural baseada em lp_sections e delta do catálogo`.
- Path canônico: `docs/lousa-plano-base-e12-4.md`.
- Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A E20.3 fornece o contrato versionado, a persistência mínima e a resolução server-side, read-only e fail-closed do perfil `active` próprio ou herdado.
- A E12.4.3 e a E12.4.3.1 já entregaram a operação oficial do lifecycle e a assistência por IA no editor.
- O teste do primeiro perfil revelou um desvio funcional: a tela começa pelo preenchimento manual e a IA também propõe textos de orientação, quando a ação principal deveria criar a estrutura a partir de `lp_sections`.
- A E12.4.3.2 deve corrigir o fluxo para que:
  - a primeira ação humana destacada seja `Criar perfil com IA`;
  - `lp_sections` seja o esqueleto obrigatório da análise;
  - a IA proponha somente módulos e variantes válidos, prioridade e ordem;
  - a IA informe o delta de seções sem módulo ou variante compatível;
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
  - IA limitada a módulos, variantes, prioridade, ordem e delta do catálogo;
  - `generation_guidance` e `item_guidance` como exceções opcionais exclusivamente humanas;
  - independência da LP materializada em relação às fontes usadas na geração inicial.

### 1.3. Decisões funcionais fixas

- Perfil próprio é permitido somente para segmento e nicho no MVP.
- Ultranicho usa o perfil `active` do ancestral elegível mais próximo.
- Os estados persistidos permanecem somente `draft`, `active` e `archived`.
- Uma versão `active` é imutável; mudança exige nova versão em `draft`.
- Existe no máximo uma versão `active` por taxon proprietário e a versão é única nesse taxon.
- O mesmo `platform_admin` pode revisar e executar `Aprovar e ativar`; a decisão é humana e auditada, sem novo status persistido.
- Quando não houver perfil próprio, a ação inicial destacada deve ser `Criar perfil com IA`; o fluxo manual permanece alternativa completa.
- A IA usa `lp_sections` como fonte estrutural principal e os demais blocos resolvidos da E10.8 apenas como contexto.
- A IA propõe somente:
  - correspondência entre cada seção pesquisada e identidades válidas do catálogo;
  - módulo e variante disponíveis;
  - prioridade `P1`, `P2` ou `P3`;
  - ordem recomendada;
  - seções atendidas parcialmente ou sem correspondência no catálogo.
- A IA não cria módulo, variante ou identidade e não preenche nem modifica `generation_guidance` ou `item_guidance`.
- `generation_guidance`, no perfil-pai, e `item_guidance`, no item-filho, são exceções opcionais preenchidas somente pelo humano.
- O refinamento por IA atua apenas sobre a estrutura proposta e preserva integralmente as exceções humanas existentes.
- Cada acionamento humano autoriza somente uma chamada, sem conversa persistente, memória, retry ou continuidade automática.
- Quando houver faltantes, o humano escolhe:
  - aguardar a criação dos módulos, sem concluir o perfil como estruturalmente completo;
  - prosseguir com os disponíveis, mantendo aviso explícito da pendência.
- E18.4, E18.5, E10.8 e o perfil orientam somente a geração inicial.
- Depois de materializada, a LP pertence à conta e permanece independente dessas fontes; mudanças nelas não alteram nem governam automaticamente a LP existente.
- A E12.4.4 e a E19.4 permanecem fora da implementação deste plano, com pendências explícitas registradas em 1.4.

### 1.4. Fronteiras de responsabilidade

- E10.8 fornece a pesquisa resolvida e versionada; dentro dela, `lp_sections` é a fonte estrutural principal da proposta.
- E18.4 e E18.5 fornecem limites e identidades vigentes para a geração inicial; a E12.4.3.2 não os redefine nem cria módulos.
- E20.3 continua responsável pelo contrato, persistência e resolução do perfil; a E12.4.3.2 aplica somente o delta mínimo para tornar `generation_guidance` opcional.
- E12.4.3.2 corrige a criação e o refinamento estrutural do perfil no Admin Dashboard.
- E12.4.4 deverá, obrigatoriamente:
  - recalcular ou recuperar os gaps antes de autorizar geração;
  - registrar adiamento com justificativa, impacto, responsável e condição de retomada;
  - classificar se o gap é impeditivo;
  - bloquear autorização enquanto houver gap impeditivo;
  - verificar incompatibilidades entre exceções humanas e os contratos usados na geração inicial.
- E19.4 deverá formalizar:
  - geração e materialização com snapshot das fontes usadas;
  - independência da LP materializada;
  - liberdade posterior de edição pelo cliente dentro das capacidades técnicas, de funcionamento e de segurança do editor;
  - proteção contra regeneração que apague silenciosamente alterações humanas.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - `platform_admin` acessa a gestão de perfis no Admin Dashboard;
  - seleciona um segmento ou nicho;
  - inicia manualmente uma nova versão ou solicita a proposta opcional por IA.
- Entrada comum:
  - taxon proprietário e cadeia ativa;
  - perfil `active` atual, quando existir;
  - identidades públicas vigentes da E18.4 e E18.5.
- Entrada adicional da IA:
  - resultado completo e resolvido da E10.8, com versões e proveniência;
  - última versão anteriormente ativa do perfil, quando houver;
  - conteúdo atual do editor, quando o acionamento for um refinamento;
  - feedback humano mais recente do `platform_admin`, quando informado.
- Processamento manual:
  - iniciar a próxima versão no editor;
  - preencher recomendações e, excepcionalmente, `generation_guidance` e `item_guidance`;
  - persistir somente após `Salvar rascunho`;
  - permitir alteração somente enquanto a versão estiver em `draft`.
- Processamento com IA:
  - exigir ação explícita do `platform_admin` e resolução completa da E10.8;
  - usar todos os itens de `lp_sections` como esqueleto;
  - fazer correspondência semântica somente com identidades válidas da E18.5;
  - propor módulo, variante, prioridade e ordem;
  - separar seções atendidas, parcialmente atendidas e sem correspondência;
  - não inventar identidade nem preencher ou modificar exceções humanas;
  - realizar no máximo uma chamada por acionamento, sem retry ou encadeamento;
  - validar deterministicamente cobertura, identidades, duplicidades e ordem;
  - preencher o editor sem persistência automática.
- Tratamento do delta:
  - apresentar seção pesquisada, prioridade, ordem, motivo da ausência e impacto de prosseguir;
  - `Aguardar criação dos módulos` mantém o perfil sem conclusão estrutural e não cria nada automaticamente na E18.5;
  - `Prosseguir com os disponíveis` usa somente recomendações válidas e mantém aviso visível;
  - gaps e decisão permanecem transitórios neste recorte; registro e reavaliação pertencem à E12.4.4.
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
  - persistir como `draft` somente após confirmação humana.
- Salvar:
  - permitir apenas sobre `draft`;
  - usar `Salvar rascunho` tanto após proposta da IA quanto após edição humana.
- Aprovar e ativar:
  - revalidar o agregado;
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
- A E12.4.3.2 deve criar migration incremental própria para permitir `generation_guidance` nulo, sem alterar migrations históricas, preservando invariantes e atualizando RPCs, DTOs, schemas, testes e verificador read-only.

### 2.4. Contrato da assistência por IA

- A assistência permanece opcional, exclusivamente server-side e protegida por `requirePlatformAdmin()`.
- Antes da chamada, o boundary resolve a E10.8, exige resultado completo, separa `lp_sections` e obtém módulos e variantes somente pelas APIs públicas da E18.5.
- `lp_sections` é o esqueleto obrigatório; `strategic_core`, `lp_overview` e `seo` apenas contextualizam prioridade, ordem e escolha entre identidades válidas.
- A saída da IA contém somente:
  - correspondências entre itens de `lp_sections` e módulos ou variantes válidos;
  - prioridade `P1`, `P2` ou `P3`;
  - ordem recomendada;
  - delta de cobertura parcial ou ausente, com motivo e impacto.
- A saída não contém `generation_guidance` nem `item_guidance`.
- A resposta estruturada separa:
  - recomendações válidas vinculadas ao `item_key` de origem;
  - gaps vinculados ao `item_key`, com cobertura `partial` ou `missing`, prioridade, ordem, motivo e impacto.
- O vínculo de origem e os gaps são transitórios e não integram as tabelas do perfil.
- A validação determinística comprova que todos os itens de `lp_sections` foram avaliados, que identidades existem, que a variante pertence ao módulo e que não há módulo ou ordem duplicados.
- No refinamento, o provider recebe somente a estrutura atual e feedback estrutural; o merge local preserva integralmente as exceções humanas.
- Cada clique em `Criar perfil com IA` ou `Refinar estrutura com IA` autoriza uma chamada, sem conversa, histórico, memória, `previous_response_id`, retry ou encadeamento.
- A proposta válida substitui somente a estrutura visível; salvar, ativar, arquivar e decidir sobre gaps permanecem ações humanas.
- A implementação reutiliza `OPENAI_API_KEY` e `OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL`, Responses API, JSON Schema estrito, `store = false`, limite de 96 KiB e timeout de 30 segundos.
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
- Na ausência de perfil próprio, `Criar perfil com IA` aparece antes do editor técnico como ação principal; o preenchimento manual permanece alternativa.
- Após proposta válida, o editor mostra módulos, variantes, prioridade e ordem para revisão.
- `generation_guidance` e `item_guidance` aparecem como exceções humanas opcionais, visualmente secundárias e sem sugestão automática.
- Quando houver gaps, mostrar seção, prioridade, ordem, motivo e impacto, com:
  - `Aguardar criação dos módulos`;
  - `Prosseguir com os disponíveis`.
- O aviso permanece visível durante a criação e revisão quando o humano prosseguir.
- Ações visuais:
  - criar nova versão;
  - criar perfil com IA;
  - refinar estrutura com IA;
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
- A IA não recebe dados de conta, oferta, campanha, LP, copy produzida, tabelas brutas de pesquisa ou registry interno da E18.5.
- Registrar o mínimo necessário para diagnóstico e auditoria:
  - `platform_admin` solicitante;
  - taxon e versões das fontes utilizadas;
  - origem manual ou IA;
  - sucesso, `missing_information`, `invalid_data` ou `technical_failure`;
  - latência, consumo e custo da chamada quando houver;
  - resultado da revisão humana.
- Logs não devem expor segredo, credencial ou conteúdo não autorizado.
- Cada solicitação de proposta deve registrar evento estruturado com `request_id`, identificador do `platform_admin`, taxon, versões e relações de proveniência da E10.8, versão das identidades públicas da E18.5, modelo configurado, OpenAI response ID quando disponível, latência, `input_tokens`, `output_tokens`, custo calculado pelas tarifas operacionais vigentes, resultado (`success`, `missing_information`, `invalid_data` ou `technical_failure`) e, posteriormente, resultado da revisão humana. Logs não podem conter API key, prompt integral, orientação livre do admin, pesquisas brutas, payload completo nem resposta integral. Falha de logging não altera o resultado funcional.
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
  - refinar módulos, variantes, prioridade, ordem e gaps, preservando exceções humanas.
- Critérios finais:
  - cada refinamento exige novo acionamento explícito;
  - não existe conversa, memória ou continuidade automática;
  - falha preserva editor, `draft` e `active`;
  - proposta refinada mantém alterações não salvas e bloqueia ativação até novo salvamento;
  - `generation_guidance` e `item_guidance` nunca são enviados para alteração pela IA.
- Escopo negativo:
  - sem tabela, rota estrutural, chat, histórico, memória, agente, `previous_response_id`, provider adicional, E12.4.4 ou geração de LP.

#### 3.1.2. E12.4.3.2 — Proposta estrutural baseada em `lp_sections` e delta do catálogo

- Status: planejada; implementação pendente após aprovação deste plano.
- Objetivo:
  - corrigir a ação inicial, o contrato da IA e a opcionalidade das exceções humanas sem refazer o lifecycle entregue.
- Entregas:
  - destacar `Criar perfil com IA` antes do editor manual;
  - usar todos os itens de `lp_sections` como esqueleto;
  - retornar somente recomendações estruturais e gaps;
  - perguntar se o humano aguarda módulos ou prossegue com os disponíveis;
  - manter aviso transitório quando houver pendência;
  - tornar `generation_guidance` opcional por migration incremental;
  - preservar `item_guidance` opcional;
  - impedir alteração de exceções humanas pela IA;
  - registrar em E12.4.4 a obrigação de recuperar gaps e decidir prontidão;
  - registrar em E19.4 a independência da LP materializada.
- Critérios de aceite:
  - cada item de `lp_sections` aparece como atendido, parcialmente atendido ou faltante;
  - somente identidades válidas entram nas recomendações;
  - prioridade e ordem são propostas para todas as seções;
  - gaps exibem seção, motivo, impacto e decisão humana;
  - IA não produz nem altera `generation_guidance` ou `item_guidance`;
  - prosseguir não oculta a pendência e aguardar não cria módulo automaticamente;
  - lifecycle, auditoria e resolver active-only permanecem funcionais;
  - migration e contratos aceitam `generation_guidance` ausente ou não vazio;
  - testes cobrem cobertura, gaps, identidade inventada, preservação de exceções, env ausente, timeout e truncamento;
  - Preview desktop e mobile comprovam ação inicial, editor preenchido, decisão de gaps e ausência de salvamento ou ativação automática.
- Escopo negativo:
  - sem tabela de gaps, criação automática de módulos, diálogo com IA para exceções, E12.4.4, E19.4, geração, job, fila, agente ou nova infraestrutura.

### 3.2. Próxima ação

- Aprovar e mergear a v2.3 documental.
- Implementar a E12.4.3.2 em PR técnico próprio criado a partir da `main` atual.
- Não usar o PR #656, que permanece restrito à correção e ao reteste da E11.1.7.
- No PR técnico, aplicar o menor delta em UI, contrato da proposta, normalização, migration incremental, testes e documentos canônicos materialmente afetados.
- Não marcar a E12.4.3.2 como concluída antes de migration aplicada, verificador read-only aprovado, checks e validação humana hospedada em desktop e mobile.
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
- Chat, histórico de mensagens, memória persistente, `previous_response_id`, diálogo com IA para exceções humanas, refinamento automático, retry automático, comparação de versões ou otimização baseada em métricas.
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
  - E12.4.3.2 registrada como sub-recorte corretivo, sem reabrir E20.3;
  - `lp_sections` como fonte estrutural principal;
  - IA limitada a módulos, variantes, prioridade, ordem e gaps;
  - `generation_guidance` e `item_guidance` como exceções opcionais humanas;
  - decisão entre aguardar ou prosseguir com aviso;
  - pendências explícitas da E12.4.4 e E19.4;
  - PR #656 preservado fora do escopo;
  - ausência de nova tabela, agente, job, fila, service ou infraestrutura.
- Para este delta documental, executar revisão do diff e verificação de whitespace; checks de runtime, typecheck e banco pertencem ao futuro PR técnico.

### 4.4. Critérios de encerramento do plano

- O plano v2.3 será encerrado somente após:
  - decisão conceitual aprovada;
  - implementação da E12.4.3.2;
  - migration incremental aplicada e verificada;
  - validações técnicas e visuais aprovadas;
  - pendências da E12.4.4 e E19.4 registradas nos documentos próprios;
  - reconciliação documental pelo Prompt ABC;
  - merge humano;
  - confirmação do estado final no ambiente alvo.

# Plano-base — E12.4 — Gestão do perfil de orientação

- Data: 28/07/2026.
- Versão: v2.2.
- Status: plano-base v2 vigente com a E12.4.3.1 como implementação candidata no PR draft #654; revisão delta aprovada e provas hospedadas e gates pós-merge ainda pendentes.
- Recorte previsto para o roadmap: `12.4 — Gestão do perfil de orientação`.
- Recorte executável inicial: `12.4.3 — Proposta, revisão, aprovação e ativação do perfil`.
- Path canônico: `docs/lousa-plano-base-e12-4.md`.
- Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A E20.3 já fornece o contrato versionado, a persistência mínima e a resolução server-side, read-only e fail-closed do perfil `active` próprio ou herdado.
- Ainda não existe operação oficial para o `platform_admin` criar, revisar, ativar ou arquivar versões do perfil.
- A E12.4.3 deve entregar no Admin Dashboard:
  - fluxo manual completo;
  - assistência opcional por IA para propor uma nova versão;
  - lifecycle humano e controlado entre `draft`, `active` e `archived`;
  - primeiro cadastro e primeira ativação oficiais do perfil.
- O resultado é uma nova versão do perfil orientativo. Não é uma composição final, uma LP ou uma autorização de geração.

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
- Parecer do Gestor de Automações e decisão humana de 28/07/2026:
  - automação opcional;
  - categoria `Automação com IA em fluxo controlado`;
  - ambiente `Runtime do LP Factory`;
  - OpenAI condicional;
  - acionamento exclusivo pelo `platform_admin`;
  - validação determinística, revisão e ativação humanas e fallback manual completo.

### 1.3. Decisões funcionais fixas

- Perfil próprio é permitido somente para segmento e nicho no MVP.
- Ultranicho usa o perfil `active` do ancestral elegível mais próximo.
- Os estados persistidos permanecem somente `draft`, `active` e `archived`.
- Uma versão `active` é imutável.
- Mudança de orientação exige nova versão em `draft`.
- Existe no máximo uma versão `active` por taxon proprietário.
- A versão é única por taxon proprietário.
- O mesmo `platform_admin` pode revisar e executar `Aprovar e ativar`.
- A aprovação é decisão humana e evento auditado dentro de `Aprovar e ativar`; não é status persistido nem resultado estável separado.
- A IA apenas propõe conteúdo para o editor. Não salva, aprova, ativa, arquiva nem gera LP.
- A proposta pode iniciar ou refinar o conteúdo do editor; cada acionamento humano autoriza somente uma chamada, sem conversa persistente, memória própria ou continuidade automática.
- A operação manual permanece completa quando a IA não for usada, falhar ou estiver indisponível.
- A LP materializada permanece independente e não muda quando o perfil evolui.
- A E12.4.4 e as subseções posteriores permanecem fora deste plano.

### 1.4. Fronteiras de responsabilidade

- E10.8 fornece a pesquisa estruturada resolvida e versionada usada pela proposta por IA.
- E18.4 e E18.5 mantêm seus contratos vigentes; a E12.4.3 não os redefine.
- E20.3 continua responsável pelo contrato, validação, persistência e resolução do perfil.
- E12.4.3 opera criação, edição, revisão, ativação e arquivamento por `platform_admin`.
- E12.4.4 tratará autorização e revogação por conta, taxon e plano.
- E19.4 e planos posteriores tratarão geração e materialização da LP.

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
  - preencher orientação geral e recomendações;
  - persistir somente após `Salvar rascunho`;
  - permitir alteração somente enquanto a versão estiver em `draft`.
- Processamento com IA:
  - exigir ação explícita do `platform_admin`;
  - verificar a resolução completa da E10.8 antes da chamada;
  - fornecer somente as entradas autorizadas;
  - distinguir a primeira proposta, sem conteúdo anterior, do refinamento que recebe o estado atual do editor e o feedback humano mais recente;
  - realizar no máximo uma chamada por acionamento, sem retry ou encadeamento automático;
  - receber proposta limitada aos campos do perfil;
  - validar a saída deterministicamente;
  - preencher o editor sem persistência automática.
- Validação:
  - validar taxon, agregado, identidades e versões antes de salvar, ativar ou arquivar;
  - rejeitar saída ou mutação incompatível sem alterar o `draft` nem o `active`.
- Persistência:
  - reutilizar `landing_page_generation_profiles` e `landing_page_generation_profile_items`;
  - criar um boundary de mutação controlado exclusivamente para `platform_admin`;
  - manter `public`, `anon`, `authenticated`, cliente e `ai_readonly` sem escrita direta;
  - usar uma única ação visual `Salvar rascunho`;
  - executar `Aprovar e ativar` atomicamente, arquivando a versão `active` anterior quando existir;
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
  - somente gerações futuras poderão consumir a nova versão ativa.
- Fallback:
  - manter o editor manual disponível sem IA;
  - preservar o `active` atual em qualquer falha de proposta, salvamento ou ativação;
  - não repetir chamada à IA automaticamente;
  - não converter falha técnica ou saída inválida em ausência de informação.

### 2.2. Contrato do perfil e validações

- O taxon proprietário deve ser segmento ou nicho ativo.
- `generation_guidance` deve ser texto não vazio.
- Cada recomendação deve conter:
  - módulo e versão existentes;
  - `variant_key` e `variant_version` ambas presentes ou ambas ausentes;
  - variante existente e pertencente ao módulo, quando informada;
  - prioridade `P1`, `P2` ou `P3`;
  - ordem recomendada inteira positiva;
  - orientação específica não vazia, quando presente.
- No mesmo perfil:
  - módulo não pode se repetir;
  - ordem recomendada não pode se repetir;
  - a versão não pode se repetir para o mesmo taxon proprietário.
- Prioridade e ordem permanecem orientativas.
- Nenhum campo pode transformar módulo em obrigatório.
- Identidade ausente ou incompatível falha fechado e não é criada ou corrigida automaticamente.

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

### 2.4. Contrato da assistência por IA

- A assistência por IA é opcional e exclusivamente server-side. Uma Server Action protegida por `requirePlatformAdmin()` deve chamar uma função server-only local ao boundary `lib/conversion-content/landing-page/generation-profile/`. Antes da chamada, a função deve resolver a E10.8 pela API pública `resolveLandingPageResearchForTaxon`, exigir resultado completo e obter módulos e variantes somente pelas APIs públicas da E18.5.
- A implementação deve reutilizar `OPENAI_API_KEY` e usar a variável dedicada `OPENAI_LANDING_PAGE_GENERATION_PROFILE_MODEL`, sem fallback hardcoded; o valor inicial de referência é `gpt-5.4-mini`. A chamada deve usar `POST https://api.openai.com/v1/responses`, `text.format.type = json_schema`, `strict = true`, `store = false`, `max_output_tokens = 2000` e timeout de 30 segundos. O request não deve fornecer `tools`, `previous_response_id`, background mode ou qualquer mecanismo agentic. O corpo JSON integral da requisição, já serializado e incluindo schema e instruções, não pode exceder 96 KiB. Não existe retry automático.
- Com os limites e tarifas vigentes na consolidação da v2, o teto operacional de referência deve permanecer inferior a aproximadamente US$ 0,09 por chamada. Antes de habilitar qualquer troca do modelo configurado ou mudança material de tarifa, repetir as fixtures de contrato, qualidade e custo e atualizar a referência operacional; configuração alterada sem essa evidência mantém a assistência indisponível e não afeta o fluxo manual.
- A saída permitida contém somente `generation_guidance` e `recommendations[]`, cada recomendação limitada a `module_key`, `module_version`, `variant_key`, `variant_version`, `priority`, `recommended_order` e `item_guidance`. Todos os objetos do JSON Schema devem usar `additionalProperties: false`. A proposta deve passar por schema Zod próprio e pela validação pública de identidade da E18.5 antes de preencher o editor. A função de IA não recebe cliente de banco e não salva, ativa, arquiva ou corrige dados.
- O primeiro clique humano em `Solicitar proposta por IA` e cada clique posterior em `Refinar com IA` autorizam, cada um, uma única chamada paga. No refinamento, o DTO autorizado inclui o conteúdo atual do editor e o feedback humano mais recente; não usa `previous_response_id`, conversa, histórico persistente ou memória própria. A proposta válida apenas substitui o conteúdo visível do editor após validação; `Salvar rascunho`, `Aprovar e ativar` e arquivamento permanecem ações humanas independentes. Env ausente ou indisponibilidade da OpenAI tornam somente a assistência indisponível, preservando o fluxo manual completo.
- O contrato e a validação puros permanecem em `lib/conversion-content/landing-page/generation-profile/`, e o provider fica em adapter server-only separado. A Server Action protegida monta somente o DTO autorizado usando `resolveLandingPageResearchForTaxon`, a última versão anteriormente ativa própria do taxon quando houver, o estado atual validado do editor no refinamento, o feedback humano mais recente e APIs públicas da E18.5; perfil herdado ou ausência atual não substituem silenciosamente essa entrada histórica. O provider não importa Supabase, tabelas, registry interno nem adapter de mutação. Sua saída completa retorna ao boundary puro, é validada e somente então preenche o editor. O caminho de proposta ou refinamento não chama RPC de salvamento, ativação ou arquivamento.
- O mapeamento de falhas é fechado e preserva os códigos reais da E10.8: ausência, incompletude ou inelegibilidade legítima retornam `missing_information`; `READ_FAILED` e `SOURCE_NOT_NORMALIZABLE` retornam `technical_failure`; `RESEARCH_INVALID` e `RESEARCH_AMBIGUOUS` retornam `invalid_data`, sem mascaramento como ausência. Schema de proposta inválido, identidade inexistente, variante incompatível, módulo ou ordem duplicados, corpo autorizado acima de 96 KiB e demais violações do agregado retornam `invalid_data` antes de qualquer chamada quando aplicável. Configuração ausente, timeout, erro HTTP, recusa, conteúdo filtrado, resposta incompleta, ausência de output ou falha de parsing retornam `technical_failure`, com motivo técnico seguro apenas nos logs. Qualquer falha preserva integralmente os valores atuais do editor, o `draft` e o `active`. Nova tentativa exige nova ação explícita do `platform_admin`.

### 2.5. Critérios visuais

- Área protegida do Admin Dashboard, sem contexto de conta.
- Seleção somente de segmento e nicho.
- Exibição clara do perfil atual como próprio, herdado ou ausente.
- Versão e status sempre visíveis.
- Editor único para orientação geral e recomendações.
- Ações visuais:
  - criar nova versão;
  - solicitar proposta por IA;
  - refinar com IA quando houver conteúdo no editor;
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

- Objetivo:
  - permitir que o `platform_admin` refine a proposta no editor com o conteúdo corrente e seu feedback humano mais recente, sem transformar o refinamento em frente, conversa ou automação independente.
- Entregas:
  - manter `Solicitar proposta por IA` para o editor sem conteúdo anterior e apresentar `Refinar com IA` quando houver conteúdo;
  - enviar E10.8 completa, identidades públicas da E18.5, referências vigentes, conteúdo atual validado do editor e feedback humano mais recente;
  - receber e validar uma proposta completa antes de substituir somente o conteúdo visível do editor;
  - reutilizar modelo, tarifa, limites, gates, correlação e observabilidade da E12.4.3.
- Critérios de aceite:
  - primeira proposta funciona sem conteúdo anterior;
  - refinamento usa o conteúdo atual e o feedback humano mais recente;
  - falha ou resposta inválida preserva integralmente editor, `draft` e `active`;
  - proposta refinada mantém o editor com alterações não salvas e bloqueia a ativação;
  - nenhuma chamada salva ou ativa, e cada refinamento exige novo acionamento explícito.
- Escopo negativo:
  - sem tabela, migration, RPC, rota estrutural, chat, histórico de mensagens, memória persistente, agente, autonomia, `previous_response_id`, provider adicional, abstração genérica, comparação automática, métricas de desempenho, E12.4.4 ou geração de LP.

### 3.2. Próxima ação

- Submeter o PR draft #654 à autorização final de merge humano, preservando a E12.4.3.1 como implementação candidata.
- Não marcar a E12.4.3.1 como concluída antes das provas hospedadas aplicáveis e da execução dos gates pós-merge previstos neste plano.
- Preservar `vercel#1 — AI Gateway` e `supa#63 — rlsautotest` apenas como oportunidades estratégicas condicionais, sem implementação neste recorte.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- E12.4.4, autorização ou revogação por conta, taxon e plano.
- E12.4.5, E12.4.6, E19.4, geração, materialização, preview, publicação ou alteração de LP.
- Perfil próprio de ultranicho.
- Gaps persistidos, prontidão, aprendizado automático ou evolução automática do catálogo.
- Criação ou alteração de módulo, variante, E18.4 ou E18.5.
- Dados de conta, oferta, campanha, LP ou copy produzida.
- Acesso a tabelas brutas de pesquisa ou ao registry interno da E18.5.
- Dados externos ainda não aprovados.
- Quarto status, estado `approved`, terceira tabela de domínio ou tabela própria de auditoria.
- Escrita direta por `public`, `anon`, `authenticated`, cliente ou `ai_readonly`.
- Ativação, salvamento, repetição ou correção automática pela IA.
- Chat, histórico de mensagens, memória persistente, `previous_response_id`, refinamento automático, retry automático, comparação de versões ou otimização baseada em métricas.
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
  - `docs/lousa-plano-base-e12-4.md` e `docs/roadmap.md` ajustados pelo menor delta; `docs/base-tecnica.md` sem alteração por não registrar o payload detalhado da assistência;
  - quatro seções principais preservadas;
  - uma única fase executável, `E12.4.3`, com a subfase interna `E12.4.3.1` sem frente independente;
  - `Automação: sim` com categoria, ambiente, objetivo e limites;
  - E12.4.4 e subseções posteriores fora do recorte;
  - ausência de tabela, migration, RPC, rota estrutural, agente, memória ou provider novo.
- Executar a validação específica, typecheck, check e verificação de whitespace; manter Preview autenticado e teste humano como provas hospedadas pendentes.

### 4.4. Critérios de encerramento do plano

- O plano será encerrado somente após:
  - v2 aprovada;
  - implementação da E12.4.3;
  - validações técnicas e visuais aprovadas;
  - reconciliação documental pelo Prompt ABC;
  - merge humano;
  - confirmação do estado final no ambiente alvo.

26/08/2026 — Plano-base v2 — E19.5.4 — UX operacional do workspace de LPs

## 1. Estado e decisões fixas

### 1.1. Identificação e estado

- Caso macro: `E19 — LP Builder`.
- Recorte: `E19.5.4 — UX operacional do workspace de LPs`.
- Path canônico: `docs/lousa-plano-base-e19-5-4.md`.
- Estado: **plano-base v2 candidato consolidado após especialistas e decisões humanas; implementação ainda não iniciada**.
- Processo: `docs/prompt-estrategista.md` vigente na `main` reconciliada; no baseline `26476a0e6caec9001aa86acfc51ba572f5d55836`, versão v34.
- Fonte principal de visão: `README.md`.
- Antecessor material: E19.5.3 concluída e operacional em Preview e Production.
- Plano conceitual: `N/A`.

### 1.2. Problema comprovado por uso real

- A E19.5.3 comprovou tecnicamente workspace, configuração, geração, histórico, preview e aprovação, mas o teste humano posterior em Production mostrou experiência operacional pouco compreensível.
- A superfície atual prioriza termos e metadados técnicos, não torna imediatamente clara a relação `Conta → LP → Versões`, comunica mal espera/sucesso da geração e não preserva navegação contextual de forma suficiente.
- A E19.5.4 corrige somente experiência e interface do workspace existente; não reabre a validade técnica da E19.5.3 nem cria nova capability de geração, edição, publicação ou lifecycle.

### 1.3. Decisões de produto e UX

- UX é gate de produto anterior ao código para fluxos materiais; modelo mental, arquitetura da informação, linguagem, navegação, estados e wireframe precisam estar aprovados antes da implementação.
- UI é a expressão visual e interativa dessas decisões por layout, componentes, hierarquia e responsividade.
- Modelo mental principal: `Conta → LP → Versões`.
- A home do workspace responde prioritariamente: **“Qual landing page quero trabalhar agora?”**.
- A composição aprovada é o **wireframe B2 compacto em master-detail**:
  - home compacta para escolha da LP;
  - detalhe da LP para identidade completa, configuração, geração e versões;
  - preview para visualização e aceite da versão.
- O nome amigável da LP permanece distinto de sua identidade comercial.
- A identidade comercial deve permanecer legível pelos quatro atributos vigentes:
  - `funnel_stage`;
  - `transaction_intent`, quando aplicável;
  - `primary_conversion_goal`;
  - `primary_service_or_offer`.
- Na home, os quatro atributos podem ser compactados em duas linhas, sem omitir semanticamente funil, intenção, objetivo ou oferta/serviço.
- Linguagem orientada ao cliente usa `versão` em vez de `revisão` nas superfícies de produto.
- A aprovação técnica existente permanece capacidade de produto, mas sua linguagem passa a ser **`Aceitar esta versão`**.
- `Aceitar esta versão` confirma a versão aceita da LP e **não publica a página**.
- A versão aceita aparece como resultado na home e no detalhe; a ação de aceite fica no preview da versão.
- Não criar conceito adicional de `versão escolhida/oficial`.
- Os únicos estados principais exibidos neste recorte são os cinco estados derivados já existentes:
  - `Configuração incompleta`;
  - `Pronta para gerar`;
  - `Em análise`;
  - `Entregue`;
  - `Nova versão em análise`.
- `draft | active | archived` permanecem estados técnicos/lifecycle e não viram estados comerciais visíveis nesta E19.5.4.
- `Publicada`, `Arquivada` e marcador `Principal` dependem de capacidades futuras próprias e não são simulados nesta entrega.
- A experiência principal não expõe IDs técnicos, attempt IDs, request IDs, prompt IDs, modelo, metadata interna ou slug quando estes não forem necessários à decisão do cliente.
- `Nova landing page` abre a rota dedicada `/a/[account]/landing-pages/new`, preservando os campos vigentes `name` e `slug`; o slug aparece somente nesse subfluxo de criação e não na coleção em repouso.
- `Atualizada` usa `account_landing_pages.updated_at`, preservando sua semântica e a ordenação paginada vigentes; configuração compartilhada, configuração específica ou revisão não criam uma autoridade paralela para essa coluna.

### 1.4. Geração vigente e navegação

- `Gerar nova versão` preserva integralmente a semântica e o algoritmo existentes.
- A E19.5.4 não altera prompt, contexto, versão-base, conteúdo enviado à IA ou processamento da geração.
- Durante a geração:
  - permanecer no contexto da mesma LP;
  - mostrar `Gerando nova versão…` e texto de apoio compreensível;
  - impedir somente submissão duplicada da mesma geração;
  - preservar versões anteriores e a versão aceita.
- Em sucesso:
  - abrir automaticamente o preview da nova versão;
  - não limitar o feedback a mensagem técnica como `Revisão N criada`.
- Em erro:
  - permanecer no contexto da mesma LP;
  - apresentar mensagem clara e ação segura de nova tentativa;
  - não alterar versões anteriores nem a versão aceita.
- Navegação contextual aprovada:
  - `Workspace → LP → Preview`;
  - `Preview → detalhe da mesma LP`;
  - preview histórico retorna ao detalhe da mesma LP, no contexto de suas versões;
  - o botão `Voltar` do navegador não é mecanismo primário da jornada.

### 1.5. Dependências e decisões preservadas

- Owner e admin ativos continuam como perfis mutáveis conforme contrato vigente; viewer continua read-only sem controles que sugiram autoridade inexistente.
- Tenant isolation, entitlement, configuração E20.2, histórico append-only e demais boundaries da E19.5.3 devem ser preservados.
- A E20.2.8 já integra o baseline avaliado, com versão corrente explícita do catálogo, migration aplicada e consumidores reconciliados. A E19.5.4 deve preservar essa autoridade, sem reintroduzir pin em v5, `latest`, maior versão, fallback ou autoridade paralela. Antes da implementação, reconciliar somente alterações posteriores ao baseline `26476a0e6caec9001aa86acfc51ba572f5d55836` que afetem materialmente esses consumidores.
- A discussão paralela sobre representar os quatro atributos de identidade como primeira classe da LP não autoriza mudança física neste recorte.

## 2. Contrato do caso

### 2.1. Resultado esperado

- O cliente reconhece em poucos segundos quais LPs possui, qual trabalho comercial cada uma representa, situação, última versão, versão aceita e última atualização.
- O cliente abre uma LP por uma única ação principal na coleção e encontra no detalhe as operações e o histórico daquela identidade.
- O cliente visualiza uma versão e entende claramente se ela está aceita ou pode ser aceita.
- O cliente gera uma nova versão com feedback compreensível e é levado automaticamente ao novo resultado quando a geração termina.
- A experiência é simples, direta, objetiva e compreensível em desktop e mobile sem ampliar regra de negócio.

### 2.2. Home desktop — wireframe B2 aprovado

- Cabeçalho:
  - título `Minhas landing pages`;
  - ação global `Nova landing page`.
- Cada entrada contém:
  - `Página`: nome amigável + resumo compacto dos quatro atributos de identidade;
  - `Situação`: um dos cinco estados derivados vigentes;
  - `Última`: número da versão mais recente ou `—`;
  - `Aceita`: número da versão aceita ou `—`;
  - `Atualizada`: `account_landing_pages.updated_at`, preservando semântica e ordenação paginada vigentes;
  - ação única `Abrir`.
- Não aparecem na home:
  - slug;
  - IDs ou metadata técnica;
  - histórico expansível;
  - `Gerar`;
  - `Aceitar`;
  - edição de configuração;
  - estados técnicos de lifecycle.
- A coleção não carrega histórico completo de todas as LPs como conteúdo da listagem.

### 2.3. Mobile aprovado

- Mobile usa cards/composição empilhada equivalente, sem rolagem horizontal obrigatória.
- Cada card preserva os mesmos dados e a mesma hierarquia sem inventar fluxo funcional diferente:
  - nome;
  - situação;
  - identidade da LP com os quatro atributos;
  - última versão;
  - versão aceita;
  - atualização;
  - `Abrir`.
- `Nova landing page` permanece ação global visível.
- A ação navega para `/a/[account]/landing-pages/new`; a rota preserva os campos vigentes `name` e `slug` sem expor o slug nos cards da coleção.

### 2.4. Detalhe da LP

- O detalhe preserva contexto `Minhas landing pages → [nome da LP]`.
- Exibe:
  - nome amigável;
  - situação derivada;
  - bloco `Identidade da LP` com os quatro atributos em campos legíveis;
  - última versão;
  - versão aceita;
  - última atualização;
  - ação vigente `Gerar nova versão`;
  - acesso à configuração vigente conforme autoridade do usuário;
  - seção `Versões`.
- `Versões` usa ordem decrescente e cada item mostra:
  - número;
  - data;
  - marcador `Aceita` quando aplicável;
  - ação `Visualizar`.
- Não existe neste recorte:
  - `Gerar a partir desta versão`;
  - comparação automática entre versões;
  - resumo novo gerado por IA sobre diferenças;
  - edição manual do conteúdo da versão.

### 2.5. Preview e aceite

- O preview mostra contexto `LP → Versão N` e retorno explícito para a mesma LP.
- Quando a versão já é a aceita:
  - mostrar `Esta é a versão aceita desta landing page`;
  - não exibir ação redundante de aceite.
- Quando a versão não é a aceita e o usuário possui autoridade:
  - exibir `Aceitar esta versão`;
  - texto de apoio: `Confirma que esta é a versão aceita desta landing page. Isso não publica a página.`
- Aceitar uma versão histórica usa a semântica já existente do ponteiro de aprovação:
  - a versão indicada passa a ser aceita;
  - nenhuma versão é apagada, sobrescrita ou renumerada;
  - não ocorre publicação.

### 2.6. Estados auxiliares e fallback

- Carregamento da coleção usa o contrato vigente de `LoadingState`, com mensagem equivalente a `Carregando suas landing pages…`; não criar framework novo de skeleton apenas para este recorte.
- O fallback `Carregando suas landing pages…` deve ser local ao ramo assíncrono da coleção do workspace e reutilizar `components/ui/loading-state.tsx`. Não substituir por essa mensagem o loading global compartilhado por outras jornadas de `app/a/[account]`, não criar nova rota e não introduzir skeleton adicional.
- Antes da leitura terminar, nunca apresentar estado vazio.
- Coleção vazia apresenta mensagem explícita e ação `Nova landing page` quando autorizada.
- Falha de leitura apresenta indisponibilidade explícita, não coleção vazia nem coleção parcial como integral.
- Falha de geração informa que as versões anteriores permanecem preservadas e permite tentativa segura conforme contrato vigente.
- Feedback dinâmico deve usar componentes e semântica já definidos no Design System, com acessibilidade compatível.

### 2.7. Gate de UX e critérios humanos de aceite

- O wireframe desktop B2, mobile equivalente, linguagem, navegação, geração vigente e aceite foram aprovados pelo humano antes da v1.
- Mudança material desses pontos durante v2 ou implementação exige nova aprovação humana antes de código correspondente.
- O primeiro roteiro de QA deve testar reconhecimento sem instrução adicional: a pessoa identifica a LP desejada, a ação `Abrir`, a versão aceita, o retorno à mesma LP e a próxima ação compatível com seu papel sem depender de metadata técnica; tempo de clique ou descoberta não vira métrica obrigatória por padrão.
- O QA humano da implementação deve ocorrer no deployment Preview funcional e registrar evidência proporcional em desktop e mobile, sem depender de ferramenta paga; deve comprovar:
  - leitura imediata da hierarquia `Conta → LP → Versões`;
  - identidade comercial compreensível;
  - estados e ações com linguagem orientada ao cliente;
  - ausência de metadata técnica na experiência primária;
  - retorno previsível sem dependência do voltar do navegador;
  - carregamento, vazio, erro, geração, sucesso e aceite compreensíveis;
  - modo read-only coerente para viewer;
  - ausência de scroll horizontal obrigatório no mobile.
- A validação proporcional de acessibilidade deve cobrir operação por teclado; foco visível e previsível após navegação, geração, erro e aceite; nomes, relações e estados expostos semanticamente; anúncio das mensagens dinâmicas pelos componentes vigentes; contraste e alvos de toque aplicáveis; e ausência de ação comunicada apenas por cor, hover ou gesto horizontal. Ferramentas automáticas são apoio e não comprovam conformidade WCAG 2.2 integral.
- O framework permanente de UX deve residir em `docs/design-system.md`; `docs/prompt-estrategista.md` deve receber apenas regra curta de enforcement do gate, sem duplicar o framework integral.

## 3. Fases e próxima ação

### 3.1. E19.5.4 — UX operacional do workspace de LPs

- Automação: não.
- Updates aplicados: `prod#14`, `prod#16` e `prod#17`.
- Objetivo:
  - implementar o wireframe B2 aprovado no workspace vigente, preservando regras de negócio, boundaries e algoritmo de geração da E19.5.3.
- Entrega executável:
  - home compacta desktop;
  - cards mobile equivalentes;
  - detalhe contextual da LP;
  - histórico por LP no detalhe;
  - preview com `Aceitar esta versão`;
  - feedback e navegação da geração vigente;
  - estados auxiliares completos;
  - rota dedicada `/a/[account]/landing-pages/new` para a criação vigente com `name` e `slug`, sem auto-geração do slug e sem expô-lo na coleção;
  - implementar por substituição in place das superfícies existentes: coleção em `app/a/[account]/_components/LandingPageWorkspace.tsx` e sua composição em `app/a/[account]/page.tsx`; detalhe em `app/a/[account]/landing-pages/[landingPageId]/page.tsx`; preview e aceite em `app/a/[account]/landing-pages/[landingPageId]/preview/page.tsx`. Não criar workspace paralelo, nova rota principal além da rota de criação decidida, novo boundary, provider, guard ou pipeline de geração. Componentes novos, quando uma extração coesa for necessária, permanecem route-local. Remover no mesmo recorte o markup, textos, metadados técnicos e controles antigos que perderem função, sem manter as experiências antiga e nova sobrepostas;
  - reutilizar e ampliar somente os contratos, DTOs e adapters existentes do boundary `lib/lp-builder`. A coleção e o detalhe recebem uma projeção de identidade comercial pronta para apresentação, derivada da configuração resolvida vigente para `funnel_stage`, `transaction_intent` quando aplicável, `primary_conversion_goal` e `primary_service_or_offer`. O preview recebe o nome da LP e o indicador tenant-safe de que a revisão selecionada coincide com o ponteiro aprovado. UI e componentes client não leem `DBRow`, `storedValues`, snapshots, Supabase ou registries internos E20.2 e não reimplementam normalização ou autoridade;
  - transferir o controle `Gerar nova versão` e a propriedade route-local de sua Server Action do preview para o boundary da rota de detalhe da LP. Preservar sem alteração semântica guards, entitlement, contexto, versão-base, providers, revalidação, idempotência e materialização existentes. Em sucesso, consumir o `revisionId` já retornado para navegar à rota existente de preview da revisão criada; em erro, permanecer no detalhe; durante pending, bloquear somente nova submissão do mesmo controle. Remover do preview os arquivos ou controles de geração que perderem função;
  - atualização proporcional do framework de UX em `docs/design-system.md` e do enforcement em `docs/prompt-estrategista.md` pelo fluxo ABC;
  - reconciliação com alterações posteriores ao baseline `26476a0e6caec9001aa86acfc51ba572f5d55836` antes de tocar consumidores E20.2.
- Oportunidades estratégicas condicionais, sem autorização de implementação neste recorte:
  - `prod#3`: avaliar Speed Insights somente após rollout, tráfego útil, hipótese mensurável e responsável de leitura; não instalar analytics nem criar gate de score nesta E19.5.4;
  - `prod#12`: avaliar troca global de contexto somente com Partner Dashboard ou recorte equivalente aprovado e evidência de operação recorrente multi-contas; não criar switcher, favoritos ou recentes agora;
  - `vercel#15`: avaliar Toolbar somente se o Preview envolver múltiplos revisores ou feedback comprovadamente fragmentado; não habilitar nem torná-la dependência do QA atual;
  - `vercel#29`: avaliar upgrade e Instant Navigations somente em recorte técnico próprio, com compatibilidade e atraso reproduzível; preservar Next.js `16.2.11` neste recorte;
  - `supa#68`: avaliar Realtime filtrado somente se uma geração assíncrona futura aprovada não for atendida pelo fluxo vigente ou polling simples; não criar publicação, canal, subscription, migration, rota ou upgrade de dependência agora.
- Critérios de aceite:
  - contrato das seções 1 e 2 atendido sem ampliação funcional;
  - testes determinísticos/regressões aplicáveis preservados;
  - QA humano em Preview desktop e mobile aprovado antes de rollout Production;
  - nenhuma nova infraestrutura, residência ou mudança de algoritmo introduzida por conveniência de UX.
- Próxima ação:
  - submeter esta v2 às Passagens 1 e 2 do Analista e, após aprovação e reconciliação do roadmap, executar a implementação no mesmo PR draft.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo

- diálogo híbrido ou conversacional com IA para orientar nova versão;
- escolher versão histórica como base de nova geração;
- mudança de prompt, contexto ou algoritmo da geração vigente;
- publicação física da LP;
- definição física ou roteamento da LP principal;
- archive/restore operacional;
- editor manual de conteúdo;
- melhoria parcial por IA;
- comparação ou resumo novo por IA entre versões;
- testes A/B, tracking, mensuração e analytics;
- hard delete;
- nova infraestrutura, job, fila, agente ou automação recorrente;
- migration para mover os quatro atributos de identidade para `account_landing_pages`;
- reescrita das versões históricas ou substituição do modelo append-only;
- reabertura da validade técnica da E19.5.3 sem evidência específica.

### 4.2. Critérios de parada

- Parar se a implementação exigir publicação, principal, archive/restore, editor, diálogo de IA ou outra capability fora do escopo.
- Parar se o redesenho exigir alterar prompt, contexto, versão-base ou algoritmo da geração vigente.
- Parar e reconciliar se a `main` posterior ao baseline `26476a0e6caec9001aa86acfc51ba572f5d55836` alterar materialmente autoridade, identidade ou consumo E20.2 relevante ao workspace.
- Parar se a solução exigir nova residência, coluna, RPC, rota ou infraestrutura sem fonte real e decisão explícita posterior.
- Parar se especialistas ou análise técnica demonstrarem que o wireframe aprovado não pode ser implementado sem mudança material de regra de negócio; devolver a decisão ao humano.

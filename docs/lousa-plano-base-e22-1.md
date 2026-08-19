# E22.1 — Depreciação e retirada controlada de ativos históricos

Status: plano-base v1 consolidado em 19/08/2026; debate encerrado e checklist final do item 3 de `docs/prompt-estrategista.md` concluído; condição temporal satisfeita após o fechamento da E19.4 pelo PR #776; implementação material permanece anterior à E19.5 e sujeita ao processo escolhido pelo humano.

Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema

- O caminho canônico vigente de geração de LP no Cenário E não depende de E10.8, E18.5 ou E20.3.
- Apesar disso, esses ativos permanecem implementados e possuem consumidores administrativos, exports, validators, workloads e, no caso de E20.3/E12.4.3, persistência própria.
- Essa permanência aumenta a superfície que Executor, Analistas e alterações transversais precisam investigar e validar, mesmo quando o trabalho pertence ao fluxo atual E19.3 → E19.4.
- O PR #771 confirmou efeito material dessa superfície: uma alteração transversal de observabilidade da E19.4 exigiu regressão no domínio histórico de `generation-profile` porque o workload E20.3 ainda compartilha `lib/openai-workloads/`.

### 1.2. Decisões já estabelecidas

- A E19.4 foi encerrada pelo PR #776, mergeado na `main` pelo commit `735776bd3febf89deb6c77965de8679aed8f246d`; a condição temporal que bloqueava a implementação material deste recorte está satisfeita.
- A E19.5 permanece não iniciada e não deve começar antes da conclusão deste recorte; seu futuro debate de workspace, lifecycle, edição e versionamento não pertence à E22.1.
- A revisão 3 da primeira LP real permanece como baseline canônica de regressão durante a retirada: materialização e Preview devem continuar íntegros e reproduzíveis.
- A regressão da limpeza não gera revisão 4 por padrão e não chama novamente `gpt-5.6-luna` ou `gpt-image-2` apenas para provar ausência de dependência; nova geração real só é exigível se uma alteração material no caminho ativo não puder ser comprovada por checks, validadores e Preview da revisão 3.
- Não reintroduzir E10.8, E18.5 ou E20.3 no caminho canônico da geração apenas porque já estão implementadas.
- Migrations históricas aplicadas permanecem preservadas no repositório; qualquer retirada física de objetos de banco exige evolução forward-only própria.
- A retirada física de E20.3 no banco deve ocorrer somente depois que os consumidores runtime/Admin tiverem sido removidos, implantados e verificados como ausentes; a migration destrutiva não pode compartilhar o mesmo merge que ainda depende da troca de código em produção.
- Dados estruturados de pesquisa não são sinônimo de E10.8 e não podem ser removidos enquanto possuírem consumidor real independente.
- Decisão humana de 18/08/2026: o payload integral do único perfil E20.3 ativo será eliminado junto com a retirada do domínio, sem criar tabela de arquivo, snapshot paralelo, bucket ou outra persistência de preservação.
- A rastreabilidade histórica desse perfil permanece pelas migrations e commits no Git, PRs/documentação e eventos já existentes em `audit_logs`.
- A reconciliação futura de `docs/lp-planejamento.md` sobre a nova direção ampla da E19.5 é necessária, mas permanece fora do escopo deste PR; a E22.1 não absorve lifecycle, edição, publicação, créditos ou nova arquitetura estrutural.

### 1.3. Evidência factual inicial

- Supabase oficial, inspeção read-only em 18/08/2026:
  - `landing_page_generation_profiles`: 1 registro, `active`, taxon `corretor-imoveis`;
  - `landing_page_generation_profile_items`: 11 registros ligados ao perfil ativo;
  - `taxon_market_research`: 24 registros ativos;
  - `taxon_market_research_items`: 379 registros.
- O runtime `commercial_activation` ainda lê diretamente `taxon_market_research` e `taxon_market_research_items`; por isso a retirada da camada E10.8 não autoriza apagar a base de pesquisas.
- `npm run check` ainda executa os validators de pesquisa estruturada, catálogo de módulos e generation profile em toda validação geral do projeto.

### 1.4. Inventário inicial de consumidores

- E20.3 / `generation-profile`:
  - o resolver público `resolveLandingPageGenerationProfileForTaxon` aparece como consumidor efetivo somente na própria camada de adapters, na página Admin de detalhe de Perfis de orientação, no export público e nos validators do domínio;
  - a operação administrativa permanece concentrada em `/admin/perfis-de-orientacao`, seus components/actions e `landingPageGenerationProfileAdminAdapter`;
  - a assistência por IA permanece no próprio domínio e mantém o workload `landing_page_generation_profile_proposal` no boundary transversal `lib/openai-workloads/`;
  - classificação: retirada coesa de E20.3 + E12.4.3.
- E18.5 / `module-catalog`:
  - o resolver `resolveLandingPageModuleCatalog` é consumido pelo próprio domínio, pelos validators, pelo Admin `Estrutura da LP` e pelo domínio histórico de generation profile;
  - não foi identificado consumo do catálogo pelo caminho E19.3 → E19.4 vigente;
  - classificação: retirada após E20.3, com poda da visão administrativa `Módulos e variantes` e dos exports correspondentes.
- E10.8 / `research-resolution`:
  - o adapter `resolveLandingPageResearchForTaxon` é consumido por superfícies administrativas, diagnósticos da Taxonomia e pelo domínio histórico de generation profile;
  - a E19.3 vigente não depende desse adapter para pesquisa integral;
  - as tabelas `taxon_market_research` e `taxon_market_research_items` continuam consumidas diretamente por `commercial_activation`, fora do boundary E10.8;
  - classificação: retirada do boundary/resolver/adapter e consumidores históricos, preservando a persistência de pesquisas enquanto E10.7/`commercial_activation` precisar dela.
- E12.5/E12.6:
  - `adminTaxonomyAdapter` mistura diagnósticos E10.8/E20.3 com responsabilidades ainda ativas da Taxonomia e da preparação E20.5/E20.6;
  - `adminLandingPageStructureAdapter` mistura E18.4 e E20.2 ativos com as visões históricas de E18.5 e E10.8;
  - classificação: poda parcial, não aposentadoria integral dos recortes administrativos.
- E21.1 / `openai-workloads`:
  - o boundary permanece ativo e necessário aos workloads atuais;
  - somente `landing_page_generation_profile_proposal` e suas regressões tornam-se candidatos à retirada quando E20.3 sair;
  - classificação: preservar boundary e reduzir catálogo/validações apenas na medida dos consumidores efetivamente aposentados.

### 1.5. Inventário material atual da E20.3/E12.4.3 no banco

- Objetos persistentes atuais identificados no Supabase oficial:
  - tabelas `landing_page_generation_profiles` e `landing_page_generation_profile_items`;
  - RPC `save_landing_page_generation_profile_draft(...)`;
  - RPC `activate_landing_page_generation_profile(...)`;
  - RPC `archive_landing_page_generation_profile(...)`;
  - RPC `get_landing_page_generation_profile_lifecycle_status()`;
  - triggers, constraints, índices, grants e RLS próprios dessas tabelas.
- Não foi identificada view atual que consuma as tabelas de generation profile.
- O único perfil ativo contém exclusivamente identidades da E18.5 — módulos, variantes, prioridade e ordem — além de uma orientação geral; seus onze itens deixam de ter significado operacional quando E18.5 for retirada.
- `audit_logs` preserva os eventos de salvamento e ativação, request IDs, decisões humanas, versões de pesquisa e decisão de gaps, mas não preserva integralmente a lista de onze itens nem o payload completo do perfil.

### 1.6. Verificação de drift após o fechamento da E19.4

- A `main` foi verificada após o merge do PR #776 no commit `735776bd3febf89deb6c77965de8679aed8f246d`.
- A E19.4.5 adicionou loader autorizado, read model, signed URL server-side, renderer puro, estados seguros e regressões do Preview sem introduzir consumidor novo de E20.3, E18.5 ou E10.8.
- `lib/lp-builder/landingPagePreview.ts` consome a autoridade `landing-page/presentation`, a revisão materializada e adapters próprios da E19.4; não importa `module-catalog`, `generation-profile` nem `research-resolution`.
- A validação focal da geração exige explicitamente ausência de `module-catalog`, `generation-profile` e `E18.5` nos sources do fluxo E19.4.
- `lib/lp-builder/adapters/generationContextAdapter.ts` usa `loadTaxonPreparationForReviewedVersion` da preparação E20.5/E20.6 e não o resolver E10.8.
- O fechamento da E19.4 não altera a classificação da auditoria E22.1.3 nem cria motivo para reabri-la integralmente.
- A revisão 3 comprovada no PR #776 passa a ser o baseline factual da regressão E22.1.7; gaps de copy, jornada e variação visual registrados na primeira prova são aprendizado de calibração e não pertencem a este recorte de retirada.

## 2. Contrato do caso

### 2.1. Resultado esperado

- Reduzir a superfície histórica do projeto sem alterar decisões de produto já aprovadas nem quebrar consumidores ainda necessários.
- Classificar cada ativo e consumidor como:
  - preservar no caminho ativo;
  - preservar fora do caminho por consumidor real;
  - desacoplar de consumidor histórico;
  - remover após prova de ausência de consumidor necessário.
- Retirar código, rotas administrativas, exports, workloads, validators, contratos e objetos de banco somente quando a prova de dependência permitir.
- Manter documentação histórica necessária para rastreabilidade sem deixá-la atuar como contrato operacional vigente.
- Entregar à futura E19.5 uma base em que `generation-profile`, `module-catalog` e o boundary histórico `research-resolution` não sejam mais interpretáveis como autoridades atuais sem consumidor.

### 2.2. Cluster inicial obrigatório

- E20.3 — perfil de orientação para geração.
- E12.4.3 e refinamentos diretamente associados ao lifecycle e assistência do perfil E20.3.
- E18.5 — catálogo `landing_page` de módulos e variantes.
- E10.8 — boundary de resolução de pesquisas estruturadas de `landing_page`.
- Consumidores derivados em E12.5/E12.6, Admin, `lib/conversion-content`, `lib/openai-workloads`, `package.json`, schema e validações.

### 2.3. Ativos explicitamente preservados neste recorte

- E18.4 enquanto continuar autoridade ativa de limites raiz da E19.4.
- E20.2 e seu resolver/versionamento.
- E20.5 e E20.6 de preparação do taxon.
- E19.2, E19.3 e E19.4.
- E10.6 e E10.7 enquanto continuarem consumidores reais da experiência comercial e `commercial_activation`.
- Tabelas e dados de pesquisa estruturada enquanto houver consumidor necessário independente da camada E10.8.
- `lib/openai-workloads/` como boundary transversal ativo; somente workloads e regressões sem consumidor devem ser retirados.

### 2.4. Critério de retirada

- Nenhum ativo é removido apenas por estar fora do caminho canônico.
- A retirada exige, para o alvo correspondente:
  - mapa de imports/exports e callers;
  - mapa de rotas/superfícies administrativas;
  - mapa de validators e scripts;
  - quando aplicável, mapa de tabelas, RPCs, grants, RLS, dados e migrations;
  - classificação dos consumidores em ativo, histórico ou substituído;
  - regressão proporcional do fluxo que deve sobreviver.

### 2.5. Poda administrativa determinada pela auditoria

- E12.5 permanece como recorte administrativo ativo, mas perde as responsabilidades herdadas dos domínios aposentados:
  - preservar Taxonomia, Páginas comerciais e Resoluções de nicho;
  - preservar a seleção/revisão vigente de E20.5/E20.6 e a elegibilidade própria de Páginas comerciais;
  - retirar a área e os links de `Perfis de orientação` quando E20.3/E12.4.3 forem aposentados;
  - retirar `activeProfile`, `draftProfile` e `aiAssistance` do diagnóstico consolidado da Taxonomia;
  - retirar os diagnósticos BB/EC cuja semântica seja especificamente a resolução E10.8, sem apagar os dados estruturados usados por `commercial_activation`;
  - retirar de Resoluções de nicho somente a navegação contextual para perfil, preservando taxon, página comercial, lista, filtros e detalhe.
- E12.6 permanece como área administrativa read-only, porém reduzida aos contratos ainda vigentes:
  - preservar `Parâmetros` — E18.4;
  - preservar `Entradas` — E20.2;
  - retirar `Módulos e variantes` quando E18.5 for aposentada;
  - retirar `Pesquisas` quando o boundary E10.8 for aposentado;
  - ajustar `adminLandingPageStructureAdapter`, navegação e validações apenas para refletir as duas visões remanescentes, sem nova rota ou novo domínio.
- Critérios visuais mínimos após a poda:
  - a navegação Admin não exibe item morto para `Perfis de orientação`;
  - `/admin/estrutura-lp` apresenta somente as visões preservadas, sem abas, cards ou links órfãos para E18.5/E10.8;
  - Taxonomia e Resoluções de nicho preservam seus dados e ações vigentes sem badges ou CTAs históricos removidos;
  - evidência hospedada proporcional deve cobrir ao menos desktop e mobile das superfícies administrativas materialmente alteradas, sem exigir redesign.

### 2.6. Tratamento do único perfil E20.3 persistido

- Fato:
  - o perfil ativo é configuração histórica baseada integralmente em identidades da E18.5 e não participa da E19.3/E19.4;
  - depois da retirada da E18.5, manter esse payload vivo no banco não preserva comportamento utilizável;
  - os eventos de decisão humana permanecem em `audit_logs`, mas o payload integral não está replicado em fonte histórica própria.
- Decisão humana aprovada em 18/08/2026:
  - eliminar o payload integral do único perfil ativo durante a retirada do domínio;
  - não criar tabela de arquivo, snapshot paralelo, bucket, export runtime ou infraestrutura nova apenas para conservar esse payload sem consumidor;
  - preservar como rastreabilidade as migrations históricas no Git, os PRs/commits do domínio, a documentação histórica e os eventos já existentes em `audit_logs`.
- Sequenciamento obrigatório:
  - primeiro retirar e implantar código, Admin, workload, exports e validators consumidores, mantendo temporariamente as tabelas/RPCs compatíveis;
  - comprovar no ambiente implantado que não existe consumidor runtime/Admin necessário desses objetos;
  - somente em merge posterior aplicar migration forward-only que remove as quatro RPCs, as duas tabelas e seus registros;
  - se o processo escolhido não permitir esse ponto de implantação intermediário, parar antes do DDL destrutivo em vez de aceitar corrida entre deploy de aplicação e `supabase db push`.

### 2.7. Fluxo operacional da retirada

- Gatilho:
  - E19.4 encerrada, plano E22.1 aprovado e execução autorizada pelo processo escolhido.
- Entrada:
  - inventário E22.1.3 aprovado;
  - `main` vigente e drift material posterior, se houver;
  - estado remoto mínimo necessário do Supabase para os objetos efetivamente removidos;
  - revisão 3 da primeira LP como baseline de regressão.
- Processamento:
  - retirar consumidores históricos na ordem E20.3/E12.4.3 → E18.5 → boundary E10.8;
  - podar somente as responsabilidades históricas de E12.5/E12.6;
  - preservar boundaries e dados com consumidor real;
  - executar retirada física do banco somente após implantação sem consumidores.
- Validação:
  - checks e validadores focais dos domínios preservados;
  - validação dos workloads OpenAI remanescentes;
  - Preview hospedado da revisão 3;
  - QA proporcional das superfícies Admin alteradas;
  - prova read-only dos objetos de banco quando aplicável.
- Persistência:
  - nenhuma persistência nova;
  - somente migration forward-only para retirada física de E20.3 após o gate de implantação sem consumidores;
  - tabelas de pesquisa estruturada permanecem enquanto houver consumidor independente.
- Consumo:
  - E18.4, E20.2, E20.5, E20.6, E19.2, E19.3, E19.4, E10.6/E10.7 e `lib/openai-workloads/` permanecem conforme seus consumidores atuais.
- Fallback:
  - consumidor necessário inesperado, regressão da revisão 3 ou dependência não reconciliável interrompe a retirada do alvo correspondente;
  - não restaurar automaticamente arquitetura histórica nem criar substituto novo dentro da E22.1.

## 3. Fases e próxima ação

### 3.1. E22.1.3 — Auditoria e classificação integral de consumidores

- Automação: não.
- Status: concluída no planejamento em 18/08/2026; verificação de drift pós-E19.4 concluída após o merge do PR #776 sem mudança de classificação.
- Resultado:
  - consumidores principais de E20.3, E18.5 e E10.8 classificados;
  - poda E12.5/E12.6 definida;
  - objetos atuais de banco E20.3/E12.4.3 identificados;
  - tratamento do único payload E20.3 aprovado pelo humano;
  - E19.4.5 verificada sem consumidor novo dos ativos históricos alvo;
  - nenhuma remoção material prevista sem consumidor e impacto conhecidos.
- Não reiniciar a auditoria integral sem evidência de mudança material posterior na `main`.

### 3.2. E22.1.4 — Retirada de E20.3 e E12.4.3 associado

- Automação: não.
- Retirar primeiro o domínio `generation-profile`, adapters, páginas/actions de `/admin/perfis-de-orientacao`, navegação administrativa correspondente, workload `landing_page_generation_profile_proposal`, exports e validators, preservando temporariamente as duas tabelas e quatro RPCs para compatibilidade durante a implantação.
- Validar o deploy sem consumidores necessários e confirmar que os workloads OpenAI remanescentes continuam resolvendo normalmente.
- Somente em merge posterior, e após a comprovação do deploy sem consumidores, aplicar migration forward-only que remove as quatro RPCs, as duas tabelas, triggers/constraints/índices/grants/RLS próprios e o único perfil com seus onze itens, sem persistência substituta.
- Evidência visual proporcional: navegação Admin sem `Perfis de orientação` e superfícies relacionadas sem link morto ou estado órfão.
- Critério de aceite: E19.4 e demais workloads ativos permanecem íntegros; nenhum consumidor necessário do perfil permanece quebrado ou órfão; DDL destrutivo não antecede a implantação sem consumidores.

### 3.3. E22.1.5 — Retirada de E18.5 e poda dos consumidores administrativos

- Automação: não.
- Retirar o diretório `module-catalog`, API pública, exports e validator após a aposentadoria dos consumidores E20.3.
- Ajustar somente as partes de `/admin/estrutura-lp` e demais superfícies que dependem de módulos/variantes; preservar E18.4 e E20.2.
- Evidência visual proporcional: `Estrutura da LP` permanece utilizável nas visões `Parâmetros` e `Entradas`, sem superfície residual de `Módulos e variantes`.
- Critério de aceite: nenhuma seleção de módulo/variante volta ao caminho E19.3 → E19.4 e o Admin remanescente não referencia domínio removido.

### 3.4. E22.1.6 — Desacoplamento da camada E10.8

- Automação: não.
- Retirar o boundary `research-resolution` e seus adapters/diagnósticos depois de remover seus consumidores históricos.
- Não apagar `taxon_market_research` ou `taxon_market_research_items` por efeito deste recorte enquanto E10.7/`commercial_activation` ou outro consumidor real depender deles.
- Podar referências E10.8 em Taxonomia, Estrutura da LP, generation profile e exports conforme o inventário aprovado.
- Evidência visual proporcional: Taxonomia e `Estrutura da LP` não exibem diagnósticos/superfícies E10.8 removidos, preservando E20.5/E20.6 e as demais informações vigentes.
- Critério de aceite: preparação E20.5/E20.6 e E19.3 continuam usando exclusivamente a pesquisa integral selecionada no caminho canônico, sem dependência da E10.8; `commercial_activation` continua lendo a persistência estruturada que permanece preservada.

### 3.5. E22.1.7 — Consolidação da superfície transversal e regressão final

- Automação: não.
- Remover do `npm run check` somente validators de domínios efetivamente retirados.
- Reconciliar `lib/openai-workloads/`, exports públicos, navegação Admin e documentos canônicos afetados sem ampliar escopo.
- Executar regressão padrão sem nova geração real: `npm run check`, validadores focais da E19.3/E19.4 e do Preview, resolução dos workloads ativos, Preview hospedado da revisão 3 e QA proporcional das superfícies Admin alteradas.
- Nova chamada real aos providers somente se uma mudança material no caminho ativo não puder ser comprovada pelas evidências anteriores; não gerar revisão 4 apenas para validar a limpeza.
- Critério de aceite: a base restante não carrega dependências de E20.3/E18.5/E10.8 sem consumidor real, a revisão 3 permanece reproduzível no Preview, materialização/revisões continuam íntegras e as superfícies Admin preservadas permanecem funcionais em desktop/mobile.

### 3.6. Próxima ação

- Item 3 de `docs/prompt-estrategista.md` concluído: o plano mantém as quatro seções mínimas, plano conceitual, fases executáveis e `Automação: não` em todas as fases; não há matriz temporária de debate a remover.
- Seguir para o item 4 de `docs/prompt-estrategista.md` e obter decisão humana entre Processo atual e Processo automatizado.
- Antes da primeira alteração material, reconciliar a branch de execução com a `main` vigente e verificar apenas drift material posterior, se houver.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Não reabrir E19.4, não gerar revisão 4 e não usar este recorte para calibrar copy, jornada persuasiva, imagem ou variação visual da primeira LP.
- Não iniciar nem redesenhar E19.5 neste recorte; lifecycle da LP, publicação, edição manual, melhoria por IA, histórico/restauração, créditos/capacidades e UX do workspace pertencem ao debate próprio da E19.5.
- Não redesenhar E18.4, E20.2, E20.5, E20.6 ou o contrato v3 da E19.3.
- Não substituir ativos removidos por novo catálogo, engine, agente, job, banco paralelo, rota paralela ou infraestrutura nova.
- Não apagar migrations históricas aplicadas.
- Não apagar dados de pesquisa estruturada apenas para simplificar a camada E10.8.
- Não remover E10.6/E10.7 sem auditoria própria que demonstre perda de consumidor real.
- Não incorporar automaticamente neste PR a reconciliação conceitual de `docs/lp-planejamento.md` sobre a futura E19.5 ampla.

### 4.2. Critérios de parada

- Parar se surgir consumidor necessário não reconciliável com a retirada proposta.
- Parar antes do DDL destrutivo se o código consumidor ainda não tiver sido removido, implantado e verificado como ausente no ambiente alvo.
- Parar se o processo escolhido não permitir o ponto de implantação intermediário exigido entre retirada de consumidores e retirada física do banco.
- Parar se a retirada exigir reabrir decisão de produto já aprovada em E19.3/E19.4.
- Parar se a regressão da revisão 3 deixar de provar materialização e Preview independentes dos ativos aposentados.
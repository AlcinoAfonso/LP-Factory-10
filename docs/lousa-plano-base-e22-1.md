# E22.1 — Depreciação e retirada controlada de ativos históricos

Status: rascunho vivo; ainda não consolidado como plano-base v1.

Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema

- O caminho canônico vigente de geração de LP no Cenário E não depende de E10.8, E18.5 ou E20.3.
- Apesar disso, esses ativos permanecem implementados e possuem consumidores administrativos, exports, validators, workloads e, no caso de E20.3/E12.4.3, persistência própria.
- Essa permanência aumenta a superfície que Executor, Analistas e alterações transversais precisam investigar e validar, mesmo quando o trabalho pertence ao fluxo atual E19.3 → E19.4.
- O PR #771 confirmou efeito material dessa superfície: uma alteração transversal de observabilidade da E19.4 exigiu regressão no domínio histórico de `generation-profile` porque o workload E20.3 ainda compartilha `lib/openai-workloads/`.

### 1.2. Decisões já estabelecidas

- A E19.4 permanece prioridade até sua conclusão; este recorte não interrompe nem altera o PR B/E19.4.5.
- A implementação material deste recorte só deve começar após o fechamento funcional da E19.4 e antes de iniciar E19.5.
- E19.4 concluída será a regressão canônica de produto durante a retirada: geração, materialização e Preview da primeira LP real devem permanecer funcionais.
- Não reintroduzir E10.8, E18.5 ou E20.3 no caminho canônico da geração apenas porque já estão implementadas.
- Migrations históricas aplicadas permanecem preservadas no repositório; qualquer retirada física de objetos de banco exige evolução forward-only própria.
- Dados estruturados de pesquisa não são sinônimo de E10.8 e não podem ser removidos enquanto possuírem consumidor real independente.

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
  - classificação inicial: candidato a retirada coesa de E20.3 + E12.4.3, condicionada ao tratamento explícito do perfil ativo persistido.
- E18.5 / `module-catalog`:
  - o resolver `resolveLandingPageModuleCatalog` é consumido pelo próprio domínio, pelos validators, pelo Admin `Estrutura da LP` e pelo domínio histórico de generation profile;
  - não foi identificado consumo do catálogo pelo caminho E19.3 → E19.4 vigente;
  - classificação inicial: candidato à retirada após E20.3, com poda da visão administrativa `Módulos e variantes` e dos exports correspondentes.
- E10.8 / `research-resolution`:
  - o adapter `resolveLandingPageResearchForTaxon` é consumido por superfícies administrativas, diagnósticos da Taxonomia e pelo domínio histórico de generation profile;
  - a E19.3 vigente não depende desse adapter para pesquisa integral e mantém E10.8 apenas para consumidores independentes;
  - as tabelas `taxon_market_research` e `taxon_market_research_items` continuam consumidas diretamente por `commercial_activation`, fora do boundary E10.8;
  - classificação inicial: candidato à retirada do boundary/resolver/adapter e consumidores históricos, preservando a persistência de pesquisas enquanto E10.7/`commercial_activation` precisar dela.
- E12.5/E12.6:
  - `adminTaxonomyAdapter` mistura diagnósticos E10.8/E20.3 com responsabilidades ainda ativas da Taxonomia e da preparação E20.5/E20.6;
  - `adminLandingPageStructureAdapter` mistura E18.4 e E20.2 ativos com as visões históricas de E18.5 e E10.8;
  - classificação inicial: poda parcial, não aposentadoria integral dos recortes administrativos.
- E21.1 / `openai-workloads`:
  - o boundary permanece ativo e necessário aos workloads atuais;
  - somente `landing_page_generation_profile_proposal` e suas regressões tornam-se candidatos à retirada quando E20.3 sair;
  - classificação inicial: preservar boundary e reduzir catálogo/validações apenas na medida dos consumidores efetivamente aposentados.

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

### 2.6. Tratamento do único perfil E20.3 persistido

- Fato:
  - o perfil ativo é configuração histórica baseada integralmente em identidades da E18.5 e não participa da E19.3/E19.4;
  - depois da retirada da E18.5, manter esse payload vivo no banco não preserva comportamento utilizável;
  - os eventos de decisão humana permanecem em `audit_logs`, mas o payload integral não está replicado em fonte histórica própria.
- Recomendação técnica do rascunho:
  - não criar tabela de arquivo, snapshot paralelo, bucket, export runtime ou infraestrutura nova apenas para conservar um payload sem consumidor;
  - quando a retirada for autorizada, usar migration forward-only para remover RPCs e objetos do domínio e eliminar as duas tabelas com seus registros;
  - preservar como rastreabilidade as migrations históricas no Git, os PRs/commits do domínio e os eventos já existentes em `audit_logs`.
- Decisão humana ainda necessária antes da consolidação da v1:
  - aprovar a perda deliberada do payload integral do único perfil ativo durante a retirada;
  - se houver exigência de preservar integralmente esse payload, será necessário definir uma fonte competente de destino antes da implementação, pois o projeto não possui hoje um repositório canônico de arquivo para esse dado e este recorte não pode inventá-lo.

## 3. Fases e próxima ação

### 3.1. E22.1.3 — Auditoria e classificação integral de consumidores

- Automação: não.
- Auditar repositório, roadmap, base técnica, schema e estado remoto mínimo necessário do Supabase.
- Produzir inventário factual por ativo com `consumidor → dependência → classificação → ação proposta`.
- Confirmar se existe consumidor de produto fora do Admin para E20.3, E18.5 e E10.8.
- Identificar todos os recortes derivados que devem ser podados sem retirar o recorte inteiro, especialmente E12.5/E12.6.
- Estado da auditoria em 18/08/2026:
  - consumidores principais de E20.3, E18.5 e E10.8 classificados;
  - poda E12.5/E12.6 definida;
  - objetos atuais de banco E20.3/E12.4.3 identificados;
  - tratamento recomendado do payload histórico definido, pendente apenas da decisão humana de retenção.
- Critério de aceite: nenhuma remoção material prevista sem consumidor e impacto conhecidos.

### 3.2. E22.1.4 — Retirada de E20.3 e E12.4.3 associado

- Automação: não.
- Candidatos já identificados: domínio `generation-profile`, adapters, páginas/actions de `/admin/perfis-de-orientacao`, navegação administrativa, workload `landing_page_generation_profile_proposal`, exports, validators, duas tabelas, quatro RPCs e documentação canônica afetada.
- A retirada física do banco depende da decisão de retenção do payload registrada em 2.6 e deve ocorrer somente por migration forward-only.
- Critério de aceite: E19.4 e demais workloads ativos permanecem íntegros; nenhum consumidor necessário do perfil permanece quebrado ou órfão.

### 3.3. E22.1.5 — Retirada de E18.5 e poda dos consumidores administrativos

- Automação: não.
- Avaliar retirada do diretório `module-catalog`, API pública, exports e validator após a aposentadoria dos consumidores E20.3.
- Ajustar somente as partes de `/admin/estrutura-lp` e demais superfícies que dependem de módulos/variantes; preservar E18.4 e E20.2.
- Critério de aceite: nenhuma seleção de módulo/variante volta ao caminho E19.3 → E19.4 e o Admin remanescente não referencia domínio removido.

### 3.4. E22.1.6 — Desacoplamento da camada E10.8

- Automação: não.
- Separar o boundary `research-resolution` e seus adapters/diagnósticos dos dados estruturados de pesquisa ainda usados por consumidores independentes.
- Não apagar `taxon_market_research` ou `taxon_market_research_items` por efeito deste recorte enquanto E10.7/`commercial_activation` ou outro consumidor real depender deles.
- Podar referências E10.8 em Taxonomia, Estrutura da LP, generation profile e exports conforme a auditoria comprovar.
- Critério de aceite: preparação E20.5/E20.6 e E19.3 continuam usando exclusivamente a pesquisa integral selecionada no caminho canônico, sem dependência da E10.8.

### 3.5. E22.1.7 — Consolidação da superfície transversal e regressão final

- Automação: não.
- Remover do `npm run check` somente validators de domínios efetivamente retirados.
- Reconciliar `lib/openai-workloads/`, exports públicos, navegação Admin e documentos canônicos afetados sem ampliar escopo.
- Executar regressão da E19.4 concluída e dos consumidores ativos preservados.
- Critério de aceite: a base restante não carrega dependências de E20.3/E18.5/E10.8 sem consumidor real e a primeira LP real permanece reproduzível no Preview.

### 3.6. Próxima ação do rascunho

- Obter a decisão humana de retenção do payload do único perfil E20.3 conforme 2.6.
- Após essa decisão, consolidar a auditoria E22.1.3 e verificar se resta questão indispensável antes de declarar o plano-base v1.
- Antes de qualquer implementação material, confirmar novamente a `main` após o fechamento da E19.4 para detectar consumidor novo ou drift criado durante o PR B.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Não alterar E19.4 enquanto seus gates e PR B estiverem em andamento, salvo correção própria da E19.4.
- Não iniciar E19.5 neste recorte.
- Não redesenhar E18.4, E20.2, E20.5, E20.6 ou o contrato v3 da E19.3.
- Não substituir ativos removidos por novo catálogo, engine, agente, job, banco paralelo, rota paralela ou infraestrutura nova.
- Não apagar migrations históricas aplicadas.
- Não apagar dados de pesquisa estruturada apenas para simplificar a camada E10.8.
- Não remover E10.6/E10.7 sem auditoria própria que demonstre perda de consumidor real.

### 4.2. Critérios de parada

- Parar se surgir consumidor necessário não reconciliável com a retirada proposta.
- Parar antes de DDL se o tratamento dos dados persistidos de E20.3 não estiver decidido.
- Parar se a retirada exigir reabrir decisão de produto já aprovada em E19.3/E19.4.
- Parar se a regressão da primeira LP real deixar de provar geração, materialização e Preview independentes dos ativos aposentados.

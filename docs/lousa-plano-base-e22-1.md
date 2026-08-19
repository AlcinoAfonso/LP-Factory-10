# E22.1 — Retirada controlada de ativos históricos

Status: plano-base v2 consolidado em 19/08/2026 no Processo atual, após avaliação única da v1 por Analista, Gestor Estrutural e Gestor de Updates. A E19.4 está encerrada; a E22.1 permanece anterior à E19.5.

Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema

- O caminho canônico vigente de geração de LP no Cenário E não depende de E10.8, E18.5 ou E20.3.
- Apesar disso, esses ativos permanecem implementados e possuem consumidores administrativos, exports, validators, workloads e, no caso de E20.3/E12.4.3, persistência própria.
- Essa permanência aumenta a superfície que Executor, Analistas e alterações transversais precisam investigar e validar, mesmo quando o trabalho pertence ao fluxo atual E19.3 → E19.4.
- O PR #771 confirmou efeito material dessa superfície: uma alteração transversal de observabilidade da E19.4 exigiu regressão no domínio histórico de `generation-profile` porque o workload E20.3 ainda compartilha `lib/openai-workloads/`.
- O objetivo da E22.1 é reduzir essa ambiguidade arquitetural antes da E19.5, sem substituir os ativos retirados por nova arquitetura equivalente.

### 1.2. Decisões já estabelecidas

- A E19.4 foi encerrada pelo PR #776, mergeado na `main` pelo commit `735776bd3febf89deb6c77965de8679aed8f246d`.
- A E19.5 permanece não iniciada e não deve começar antes da conclusão desta retirada controlada.
- A revisão 3 da primeira LP real permanece como baseline canônica de regressão: materialização e Preview devem continuar íntegros e reproduzíveis.
- A regressão da retirada controlada não gera revisão 4 por padrão e não chama novamente `gpt-5.6-luna` ou `gpt-image-2` apenas para provar ausência de dependência; nova geração real só é exigível se uma alteração material no caminho ativo não puder ser comprovada por checks, validadores e Preview da revisão 3.
- Não reintroduzir E10.8, E18.5 ou E20.3 no caminho canônico da geração apenas porque já estão implementados.
- Migrations históricas aplicadas permanecem preservadas no repositório; qualquer retirada física de objetos de banco exige evolução forward-only própria.
- A retirada física de E20.3 no banco deve ocorrer somente depois que consumidores runtime/Admin tiverem sido removidos, implantados e verificados como ausentes; o DDL destrutivo ocorre em merge posterior.
- Dados estruturados de pesquisa não são sinônimo de E10.8 e não podem ser removidos enquanto possuírem consumidor real independente.
- Decisão humana de 18/08/2026: o payload integral do único perfil E20.3 ativo será eliminado junto com a retirada do domínio, sem tabela de arquivo, snapshot paralelo, bucket ou outra persistência de preservação.
- A rastreabilidade histórica desse perfil permanece pelas migrations e commits no Git, PRs/documentação e eventos já existentes em `audit_logs`.
- `docs/lp-planejamento.md` foi reconciliado na `main` pelo PR #778, merge commit `c0c09888058ee451e31e77bc3c4cd8d357d784e1`; essa atualização confirma E22.1 antes da E19.5 e não autoriza absorver lifecycle, edição, publicação, créditos ou nova arquitetura da E19.5 neste recorte.
- Terminologia canônica deste caso: **retirada controlada**. Não usar `limpeza`, `cleanup` ou `depreciação` como termos paralelos para o trabalho atual.

### 1.3. Evidência factual inicial

- Supabase oficial, inspeção read-only em 18/08/2026:
  - `landing_page_generation_profiles`: 1 registro `active`, id `c211015e-d9c6-4241-a29a-7cd41e93b8fc`, taxon `corretor-imoveis`;
  - `landing_page_generation_profile_items`: 11 registros ligados ao perfil ativo;
  - `taxon_market_research`: 24 registros ativos;
  - `taxon_market_research_items`: 379 registros.
- O runtime `commercial_activation` ainda lê diretamente `taxon_market_research` e `taxon_market_research_items`; por isso a retirada da camada E10.8 não autoriza apagar a base de pesquisas.
- `npm run check` ainda executa explicitamente validators de pesquisa estruturada, catálogo de módulos e generation profile.
- E20.3/E12.4.3 mantém duas tabelas e quatro RPCs próprias; não foi identificada view dependente.

### 1.4. Inventário de consumidores e classificação

- E20.3 / `generation-profile`:
  - consumidores concentram-se no próprio domínio, adapters, `/admin/perfis-de-orientacao`, exports, validators e assistência por IA;
  - o workload `landing_page_generation_profile_proposal` permanece no boundary transversal `lib/openai-workloads/` apenas por esse domínio;
  - `/admin/workloads-openai` usa o inventário dinâmico de `listOpenAiWorkloadInventory()` e deve refletir a retirada desse workload sem redesenho;
  - classificação: retirada coesa de E20.3 + E12.4.3.
- E18.5 / `module-catalog`:
  - consumidores concentram-se no próprio domínio, validators, Admin `Estrutura da LP` e E20.3;
  - não há consumo no caminho E19.3 → E19.4 vigente;
  - classificação: retirada depois de E20.3.
- E10.8 / `research-resolution`:
  - consumidores concentram-se em adapters/diagnósticos administrativos e no domínio histórico E20.3;
  - E19.3 não depende desse resolver para pesquisa integral;
  - `taxon_market_research` e `taxon_market_research_items` continuam consumidas diretamente por `commercial_activation` fora do boundary E10.8;
  - classificação: retirar boundary/resolver/adapter e consumidores históricos, preservando a persistência enquanto houver consumidor real.
- E12.5/E12.6:
  - misturam responsabilidades históricas com responsabilidades ainda ativas;
  - classificação: poda parcial, não aposentadoria integral.
- E21.1 / `openai-workloads`:
  - o boundary permanece ativo para workloads atuais;
  - retirar somente `landing_page_generation_profile_proposal` e regressões que ficarem sem consumidor.

### 1.5. Inventário material atual da E20.3/E12.4.3 no banco

- Objetos atuais identificados:
  - tabelas `landing_page_generation_profiles` e `landing_page_generation_profile_items`;
  - RPC `save_landing_page_generation_profile_draft(...)`;
  - RPC `activate_landing_page_generation_profile(...)`;
  - RPC `archive_landing_page_generation_profile(...)`;
  - RPC `get_landing_page_generation_profile_lifecycle_status()`;
  - triggers, constraints, índices, grants e RLS próprios das tabelas.
- O único perfil ativo contém exclusivamente identidades da E18.5 — módulos, variantes, prioridade e ordem — além de orientação geral; seus onze itens deixam de possuir significado operacional quando E18.5 for retirada.
- `audit_logs` preserva eventos de salvamento e ativação, request IDs, decisões humanas, versões de pesquisa e decisão de gaps, mas não o payload integral do perfil.

### 1.6. Verificação de drift após E19.4 e PR #778

- A E19.4.5 adicionou loader autorizado, read model, signed URL server-side, renderer puro, estados seguros e regressões do Preview sem introduzir consumidor novo de E20.3, E18.5 ou E10.8.
- `lib/lp-builder/landingPagePreview.ts` consome a autoridade `landing-page/presentation`, a revisão materializada e adapters próprios da E19.4; não importa `module-catalog`, `generation-profile` nem `research-resolution`.
- A validação focal da geração exige ausência de `module-catalog`, `generation-profile` e `E18.5` nos sources do fluxo E19.4.
- `lib/lp-builder/adapters/generationContextAdapter.ts` usa `loadTaxonPreparationForReviewedVersion` da preparação E20.5/E20.6 e não o resolver E10.8.
- O PR #778 atualizou somente `docs/lp-planejamento.md`; não cria consumidor novo dos ativos em retirada e confirma a precedência E22.1 → E19.5.
- Não reiniciar a auditoria integral sem evidência de mudança material posterior na `main`.

### 1.7. Consolidação dos especialistas da v1

- Analista — **aceito**:
  - gate read-only imediatamente antes do DDL destrutivo para reconfirmar o conjunto exato de dados e dependências autorizados para remoção;
  - incluir `Admin > Workloads OpenAI` entre superfícies afetadas;
  - atualizar o estado processual, pois a Opção 1 já foi escolhida.
- Gestor Estrutural — **aceito**:
  - retirar cada validator e seu script de `package.json` na mesma fase/merge;
  - atualizar `docs/schema.md` no mesmo merge do DDL destrutivo;
  - reconciliar o plano com a `main` pós-PR #778 e com o estágio real do processo.
- Gestor de Updates — **nenhum update aplicável**:
  - `supa#57` e `supa#63`: não aplicáveis ao risco central desta retirada controlada;
  - `vercel#15` e `github#10`: preservados somente como oportunidades estratégicas condicionais, sem implementação, gate, configuração ou mudança de infraestrutura neste recorte.
- Já coberto/convergente:
  - ordem E20.3/E12.4.3 → E18.5 → E10.8;
  - preservação das pesquisas estruturadas enquanto `commercial_activation` depender delas;
  - revisão 3 como baseline e ausência de revisão 4 obrigatória;
  - preservação de E18.4, E20.2, E20.5/E20.6, E19.2/E19.3/E19.4, E10.6/E10.7 e `lib/openai-workloads/`.
- Decisão humana nova: nenhuma.

## 2. Contrato do caso

### 2.1. Resultado esperado

- Reduzir a superfície histórica sem alterar decisões de produto aprovadas nem quebrar consumidores ainda necessários.
- Classificar cada ativo e consumidor como:
  - preservar no caminho ativo;
  - preservar fora do caminho por consumidor real;
  - desacoplar de consumidor histórico;
  - remover após prova de ausência de consumidor necessário.
- Retirar código, rotas administrativas, exports, workloads, validators, contratos e objetos de banco somente quando a prova de dependência permitir.
- Manter documentação histórica necessária para rastreabilidade sem deixá-la atuar como contrato operacional vigente.
- Entregar à futura E19.5 uma base em que `generation-profile`, `module-catalog` e o boundary histórico `research-resolution` não sejam interpretáveis como autoridades atuais sem consumidor.

### 2.2. Cluster obrigatório

- E20.3 — perfil de orientação para geração.
- E12.4.3 e refinamentos diretamente associados ao lifecycle e assistência do perfil E20.3.
- E18.5 — catálogo `landing_page` de módulos e variantes.
- E10.8 — boundary de resolução de pesquisas estruturadas de `landing_page`.
- Consumidores derivados em E12.5/E12.6, Admin, `lib/conversion-content`, `lib/openai-workloads`, `package.json`, schema e validações.

### 2.3. Ativos explicitamente preservados

- E18.4 enquanto continuar autoridade ativa dos limites raiz usados pela E19.4.
- E20.2 e seu resolver/versionamento.
- E20.5 e E20.6 de preparação do taxon.
- E19.2, E19.3 e E19.4.
- E10.6 e E10.7 enquanto continuarem consumidores reais da experiência comercial e `commercial_activation`.
- Tabelas e dados de pesquisa estruturada enquanto houver consumidor necessário independente da E10.8.
- `lib/openai-workloads/` como boundary transversal ativo.

### 2.4. Critério de retirada

- Nenhum ativo é removido apenas por estar fora do caminho canônico.
- A retirada exige, para o alvo correspondente:
  - mapa de imports/exports e callers;
  - mapa de rotas/superfícies administrativas;
  - mapa de validators e scripts;
  - quando aplicável, mapa de tabelas, RPCs, grants, RLS, dados e migrations;
  - classificação dos consumidores em ativo, histórico ou substituído;
  - regressão proporcional do fluxo que deve sobreviver.

### 2.5. Poda administrativa

- E12.5 permanece ativa, mas perde responsabilidades herdadas dos domínios retirados:
  - preservar Taxonomia, Páginas comerciais e Resoluções de nicho;
  - preservar seleção/revisão E20.5/E20.6 e elegibilidade própria de Páginas comerciais;
  - retirar área e links de `Perfis de orientação` quando E20.3/E12.4.3 forem retirados;
  - retirar `activeProfile`, `draftProfile` e `aiAssistance` do diagnóstico consolidado da Taxonomia;
  - retirar diagnósticos BB/EC cuja semântica seja especificamente E10.8, sem apagar dados estruturados usados por `commercial_activation`;
  - retirar de Resoluções de nicho somente navegação contextual para perfil.
- E12.6 permanece read-only, reduzida aos contratos vigentes:
  - preservar `Parâmetros` — E18.4;
  - preservar `Entradas` — E20.2;
  - retirar `Módulos e variantes` com E18.5;
  - retirar `Pesquisas` com o boundary E10.8;
  - ajustar `adminLandingPageStructureAdapter`, navegação e validações somente para as duas visões remanescentes.
- `Admin > Workloads OpenAI` permanece, mas deve deixar de listar `landing_page_generation_profile_proposal` depois da retirada E20.3 e continuar exibindo corretamente os workloads ativos.
- Critérios visuais mínimos:
  - navegação Admin sem item morto para `Perfis de orientação`;
  - `/admin/estrutura-lp` somente com visões preservadas, sem abas/cards/links órfãos;
  - Taxonomia e Resoluções de nicho preservam dados e ações vigentes sem badges/CTAs históricos;
  - `Admin > Workloads OpenAI` sem workload retirado e com inventário ativo íntegro;
  - evidência hospedada proporcional em desktop e mobile das superfícies materialmente alteradas, sem redesign.

### 2.6. Tratamento do perfil E20.3 e gates destrutivos

- Decisão humana aprovada:
  - eliminar o payload integral do perfil E20.3 ativo e seus onze itens;
  - não criar persistência substituta;
  - preservar rastreabilidade por Git, migrations históricas, PRs/documentação e `audit_logs`.
- Sequenciamento obrigatório:
  - primeiro retirar e implantar código, Admin, workload, exports e validators consumidores, mantendo temporariamente tabelas/RPCs compatíveis;
  - comprovar no ambiente implantado que não existe consumidor runtime/Admin necessário desses objetos;
  - imediatamente antes do segundo merge/DDL, executar gate read-only proporcional para reconfirmar:
    - exatamente 1 perfil E20.3, id `c211015e-d9c6-4241-a29a-7cd41e93b8fc`, ainda pertencente ao taxon `corretor-imoveis` e dentro da decisão humana de perda;
    - exatamente 11 itens ligados a esse perfil;
    - mesmas duas tabelas e quatro RPCs alvo, sem novo objeto/dependência material não reconciliado;
    - ausência de consumidor runtime/Admin necessário após o deploy anterior;
  - qualquer drift de quantidade, identidade, objeto ou dependência interrompe o DDL e retorna ao humano;
  - somente depois aplicar migration forward-only em merge posterior;
  - no mesmo merge do DDL, atualizar `docs/schema.md` e revisar referências de views, functions, RPCs e adapters dependentes antes do apply remoto;
  - após apply, produzir prova read-only de ausência dos objetos removidos.

### 2.7. Fluxo operacional

- Gatilho:
  - E19.4 encerrada, plano v2 aprovado/mergeado e fase autorizada.
- Entrada:
  - inventário E22.1.3;
  - `main` vigente e drift material posterior, se houver;
  - estado remoto mínimo necessário do Supabase;
  - revisão 3 como baseline de regressão.
- Processamento:
  - retirar consumidores históricos na ordem E20.3/E12.4.3 → E18.5 → boundary E10.8;
  - podar somente responsabilidades históricas de E12.5/E12.6;
  - preservar boundaries e dados com consumidor real;
  - executar DDL somente após deploy sem consumidores e gate destrutivo read-only.
- Validação:
  - `npm run check` executável após cada merge;
  - validadores focais dos domínios preservados;
  - resolução dos workloads OpenAI remanescentes;
  - Preview hospedado da revisão 3;
  - QA proporcional das superfícies Admin alteradas;
  - provas read-only pré e pós-DDL quando aplicável.
- Persistência:
  - nenhuma persistência nova;
  - somente migration forward-only para retirada física E20.3 após gates;
  - tabelas de pesquisa estruturada permanecem enquanto houver consumidor independente.
- Consumo:
  - E18.4, E20.2, E20.5, E20.6, E19.2, E19.3, E19.4, E10.6/E10.7 e `lib/openai-workloads/` permanecem conforme consumidores atuais.
- Fallback:
  - consumidor inesperado, drift destrutivo, regressão da revisão 3 ou dependência não reconciliável interrompe a retirada do alvo;
  - não restaurar automaticamente arquitetura histórica nem criar substituto dentro da E22.1.

## 3. Fases e próxima ação

### 3.1. E22.1.3 — Auditoria e classificação integral de consumidores

- Automação: não.
- Status: concluída no planejamento; verificação pós-E19.4 concluída sem mudança de classificação.
- Resultado:
  - consumidores principais classificados;
  - poda E12.5/E12.6 definida;
  - objetos atuais E20.3/E12.4.3 identificados;
  - tratamento do payload E20.3 aprovado;
  - E19.4.5 verificada sem consumidor novo dos ativos alvo.
- Não reiniciar auditoria integral sem evidência de mudança material posterior.

### 3.2. E22.1.4 — Retirada de E20.3 e E12.4.3 associado

- Automação: não.
- Primeiro merge da fase:
  - retirar `generation-profile`, adapters, páginas/actions `/admin/perfis-de-orientacao`, navegação correspondente, workload `landing_page_generation_profile_proposal`, exports e validator;
  - remover no mesmo merge `validate:landing-page-generation-profile` e sua chamada em `check` de `package.json`;
  - preservar temporariamente duas tabelas e quatro RPCs para compatibilidade durante a implantação;
  - implantar e comprovar ausência de consumidores necessários;
  - validar que `Admin > Workloads OpenAI` não lista o workload retirado e que workloads ativos continuam corretos;
  - manter `npm run check` executável.
- Segundo merge da fase, somente após o primeiro estar implantado e comprovado:
  - executar o gate read-only pré-DDL definido em 2.6;
  - se o gate não reproduzir exatamente o conjunto aprovado ou revelar nova dependência, parar e retornar ao humano;
  - aplicar migration forward-only removendo quatro RPCs, duas tabelas, triggers/constraints/índices/grants/RLS próprios e o perfil com seus onze itens;
  - atualizar `docs/schema.md` no mesmo merge e revisar dependentes antes do apply remoto;
  - comprovar read-only a ausência dos objetos após o apply.
- Evidência visual proporcional: navegação Admin sem `Perfis de orientação`, nenhuma superfície relacionada órfã e inventário OpenAI correto.
- Critério de aceite: E19.4 e workloads ativos íntegros; `npm run check` funcional; nenhum consumidor necessário órfão; DDL somente após os dois gates de ausência/drift.

### 3.3. E22.1.5 — Retirada de E18.5 e poda dos consumidores administrativos

- Automação: não.
- Retirar `module-catalog`, API pública, exports e validator após E20.3.
- Remover no mesmo merge `validate:landing-page-module-catalog` e sua chamada em `check` de `package.json`.
- Ajustar somente `/admin/estrutura-lp` e demais consumidores de módulos/variantes; preservar E18.4 e E20.2.
- Evidência visual proporcional: `Estrutura da LP` utilizável em `Parâmetros` e `Entradas`, sem superfície residual de `Módulos e variantes`.
- Critério de aceite: nenhuma referência E18.5 no caminho E19.3 → E19.4; Admin sem domínio removido; `npm run check` funcional.

### 3.4. E22.1.6 — Desacoplamento da camada E10.8

- Automação: não.
- Retirar `research-resolution`, adapters/diagnósticos e consumidores históricos.
- Não apagar `taxon_market_research` nem `taxon_market_research_items` enquanto E10.7/`commercial_activation` ou outro consumidor real depender deles.
- Podar referências E10.8 em Taxonomia, Estrutura da LP, generation profile e exports conforme o inventário aprovado.
- Ao retirar o validator E10.8, remover no mesmo merge `validate:landing-page-research` e sua chamada em `check` de `package.json`, após confirmar que nenhum consumidor preservado depende dele.
- Evidência visual proporcional: Taxonomia e `Estrutura da LP` sem diagnósticos/superfícies E10.8, preservando E20.5/E20.6 e demais informações vigentes.
- Critério de aceite: E20.5/E20.6 e E19.3 continuam usando pesquisa integral selecionada; `commercial_activation` continua usando a persistência estruturada preservada; `npm run check` funcional.

### 3.5. E22.1.7 — Consolidação transversal e regressão final

- Automação: não.
- Confirmar que `npm run check` não referencia validators/scripts dos domínios retirados e remover somente resíduos comprovadamente órfãos; não adiar para esta fase scripts que apontariam para arquivos eliminados em fases anteriores.
- Reconciliar resíduos em `lib/openai-workloads/`, exports públicos, navegação Admin e documentos canônicos materialmente afetados via Prompt ABC, sem ampliar escopo.
- Executar regressão padrão sem nova geração real:
  - `npm run check`;
  - validadores focais E19.3/E19.4 e Preview;
  - resolução dos workloads ativos;
  - Preview hospedado da revisão 3;
  - QA proporcional das superfícies Admin alteradas.
- Nova chamada real aos providers somente se mudança material no caminho ativo não puder ser comprovada pelas evidências anteriores.
- Critério de aceite: nenhuma dependência residual sem consumidor; revisão 3 reproduzível; materialização/revisões íntegras; Admin preservado funcional em desktop/mobile.

### 3.6. Próxima ação

- Item 4 de `docs/prompt-estrategista.md` concluído: **Opção 1 — Processo atual** escolhida pelo humano.
- Item 5 concluído: pareceres de Analista, Gestor Estrutural e Gestor de Updates recebidos e consolidados nesta v2; Gestor de Automação não participa porque todas as fases são `Automação: não`.
- A branch do PR #773 já foi reconciliada com a `main` no commit `c0c09888058ee451e31e77bc3c4cd8d357d784e1`, preservando como único delta material o plano E22.1.
- A consolidação do plano-base v2 está concluída nesta etapa do item 6.
- Próximo passo do item 6: reconciliar `docs/roadmap.md` com o Executor no mesmo PR, usando esta v2 como fonte e `docs/prompt-abc.md` + `docs/template-roadmap.md`.
- Depois da reconciliação do roadmap, solicitar ao humano o merge do PR; não iniciar implementação antes da confirmação do merge da v2.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do escopo

- Não reabrir E19.4, não gerar revisão 4 e não calibrar copy, jornada persuasiva, imagem ou variação visual nesta retirada controlada.
- Não iniciar nem redesenhar E19.5; lifecycle, publicação, edição, melhoria por IA, histórico/restauração, créditos/capacidades e UX do workspace pertencem ao caso próprio da E19.5.
- Não redesenhar E18.4, E20.2, E20.5, E20.6 ou E19.3 v3.
- Não substituir ativos retirados por novo catálogo, engine, agente, job, banco paralelo, rota paralela ou infraestrutura nova.
- Não apagar migrations históricas aplicadas.
- Não apagar dados de pesquisa estruturada apenas para simplificar E10.8.
- Não remover E10.6/E10.7 sem auditoria própria que demonstre perda de consumidor real.
- Não absorver na E22.1 decisões de implementação da E19.5 em razão da reconciliação já realizada em `docs/lp-planejamento.md`; usar esse documento somente como fonte conceitual vigente.
- Não implementar `vercel#15`, `github#10`, `supa#57` ou `supa#63` por efeito deste recorte.

### 4.2. Critérios de parada

- Parar se surgir consumidor necessário não reconciliável com a retirada proposta.
- Parar antes do DDL se o código consumidor ainda não tiver sido removido, implantado e verificado como ausente.
- Parar antes do DDL se o gate read-only pré-destrutivo mostrar qualquer drift material de quantidade, identidade, objetos ou dependências em relação à decisão humana aprovada.
- Parar se o processo de execução não permitir o ponto de implantação intermediário entre retirada dos consumidores e DDL.
- Parar se a retirada exigir reabrir decisão de produto aprovada em E19.3/E19.4.
- Parar se a regressão da revisão 3 deixar de provar materialização e Preview independentes dos ativos retirados.

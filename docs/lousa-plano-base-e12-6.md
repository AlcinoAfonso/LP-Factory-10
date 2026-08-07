# Plano-base v1 — E12.6 Estrutura da LP no Admin Dashboard

## 1. Estado e decisões fixas

### 1.1. Identificação

- Recorte: `E12.6`.
- Path: `docs/lousa-plano-base-e12-6.md`.
- Objetivo: criar uma área administrativa read-only que torne consultáveis os contratos estruturais já materializados para `landing_page`, sem transformar registries repo-only em editores e sem duplicar regras de domínio.
- Usuário principal: `platform_admin`.
- Plano conceitual: `docs/lp-planejamento.md` para as fronteiras da jornada de LP; a organização administrativa deste recorte é definida neste plano.
- Automação do recorte: não.
- Status: plano-base v1 para avaliação antes da execução.

### 1.2. Documentação e implementação usadas

- `README.md` — visão do produto, princípios do MVP e papel do Dashboard.
- `docs/prompt-estrategista.md` — fluxo do Estrategista e requisitos do plano-base v1.
- `docs/template-roadmap.md` — hierarquia e regras anti-inflação do roadmap.
- `docs/roadmap.md` — estado vigente da E12, E18 e E20.
- `docs/base-tecnica.md` — boundaries, server-side, fail-closed e regras de implementação segura.
- `docs/design-system.md` — padrões visuais do Admin aplicáveis.
- `docs/lp-planejamento.md` — separação conceitual entre parametrização, módulos, entradas, pesquisa, perfil e geração.
- `docs/lousa-plano-base-e12-5.md` — organização administrativa, navegação contextual, QA e controles anti-regressão já aprovados.
- `docs/lousa-plano-base-e18-4.md` — parametrização raiz versionada de `landing_page`.
- `docs/lousa-plano-base-e18-5.md` — catálogo de módulos, variantes, fields, capabilities e interações.
- `docs/lousa-plano-base-e20-2.md` — catálogo declarativo de entradas por taxon e plano.
- `docs/lousa-plano-base-e10-8.md` — resolução de pesquisas estruturadas e proveniência.
- `docs/lousa-plano-base-e20-3.md` — fronteira do perfil de orientação já representado pela área existente de Perfis.
- `components/admin/adminNavigation.ts` — catálogo atual de áreas administrativas.
- `lib/conversion-content/landing-page/` — API pública e registry raiz da E18.4.
- `lib/conversion-content/landing-page/module-catalog/` — API pública da E18.5.
- `lib/conversion-content/landing-page/input-catalog/` — contratos e resolver da E20.2.
- `lib/conversion-content/landing-page/research-resolution/` e `lib/conversion-content/adapters/landingPageResearchAdapter.ts` — contrato e leitura da E10.8.
- `lib/admin/adapters/adminTaxonomyAdapter.ts` — diagnóstico administrativo de pesquisas já criado na E12.5.

### 1.3. Resultado esperado

- O menu do Admin ganha uma única área principal chamada `Estrutura da LP`.
- A área usa uma única rota protegida, `/admin/estrutura-lp`, com quatro visões internas selecionáveis e endereçáveis por query string:
  - `Parâmetros` — E18.4.
  - `Módulos e variantes` — E18.5.
  - `Entradas` — E20.2.
  - `Pesquisas` — E10.8.
- Não criar quatro novos itens no menu lateral.
- Não criar editor para parametrização, módulos, variantes, entradas ou pesquisas.
- A área apresenta contratos canônicos e estados reais de forma administrativa, em português e sem expor códigos técnicos como linguagem principal quando houver rótulo operacional melhor.
- Taxonomia continua sendo o resumo operacional por taxon; `Estrutura da LP` funciona como inspeção estrutural detalhada.
- `Perfis de orientação` continua representando E20.3/E12.4.3; não criar página duplicada para perfil.
- `Páginas comerciais` continua responsável pelo fluxo comercial existente; não mover geração, preview, publicação ou histórico para esta nova área.

### 1.4. Decisões fixas por domínio

#### 1.4.1. E18.4

- A parametrização raiz permanece repo-only, versionada e read-only.
- O Admin não acessa o registry interno diretamente quando houver API pública apropriada.
- Não hardcodar `rootVersion = 1` como conhecimento próprio da UI.
- Se a API pública vigente não permitir enumerar versões, presets ou metadados mínimos necessários à consulta, autoriza-se somente uma extensão pública mínima de leitura dentro do boundary existente, sem exportar o registry e sem criar segundo resolver.

#### 1.4.2. E18.5

- Usar as operações públicas vigentes `listLandingPageModuleIdentities`, `listLandingPageModuleSelectionCatalog`, `validateLandingPageModuleIdentity` e `resolveLandingPageModuleCatalog` conforme a necessidade da visão.
- Registry e schema permanecem internos.
- O Admin não cria, edita, ativa ou arquiva módulos ou variantes.
- A inspeção de contrato resolvido deve exigir seletores explícitos quando depender de raiz, preset ou perfil de funil; não inventar contexto silenciosamente.

#### 1.4.3. E20.2

- A visão apresenta catálogo declarativo e catálogo resolvido; não apresenta valores concretos de conta, negócio, oferta, campanha ou LP.
- Plano é somente entrada do resolver do catálogo; não representa entitlement nem autorização comercial.
- A cadeia taxonômica real deve ser montada server-side a partir da taxonomia vigente, sem hardcode de IDs na UI.
- Não criar controle administrativo que autorize camada própria de ultranicho. Se uma camada futura exigir autorização não disponível no contrato vigente, exibir bloqueio seguro e devolver o caso ao recorte responsável.

#### 1.4.4. E10.8

- A visão de pesquisas deve distinguir BB e EC de forma independente para inspeção administrativa, preservando a regra canônica:
  - BB pode resolver no próprio taxon ou no pai direto.
  - EC permanece própria do taxon servido.
- Reutilizar o diagnóstico administrativo já implementado na E12.5 e o resolver canônico da E10.8; não duplicar a regra em React.
- A v1 administrativa exibe estrutura, proveniência, versão, blocos e contagens necessárias ao diagnóstico; não precisa expor integralmente `item_text` das pesquisas.

### 1.5. Recortes avaliados e não incluídos

- E20.3/E12.4.3:
  - já representada em `Perfis de orientação`;
  - não criar nova superfície.
- E9.7:
  - candidata futura forte para uma matriz de capacidades por plano;
  - não criar agora porque o registry canônico runtime permanece sem capacidades admitidas e o próprio plano vigente declarou frontend N/A nesta fase.
- E19.2:
  - não criar superfície administrativa antes da implementação do próprio recorte operacional.
- Auditoria:
  - permanece no estado atual e fora deste plano.

### 1.6. Updates aplicáveis

- `prod#14` — aplicar reconhecimento rápido de estado, origem e contrato nas visões administrativas.
- `prod#16` — usar Preview para QA visual proporcional das quatro visões.
- `prod#17` — usar WCAG 2.2 como baseline de acessibilidade aplicável, sem declarar conformidade integral.
- `prod#12` — usar navegação contextual apenas dentro de `Estrutura da LP` e para retorno a Taxonomia quando houver taxon selecionado; não criar switcher global.
- `vercel#15` — Vercel Toolbar somente como apoio opcional ao QA.
- `supa#40` — reutilizar como referência read-only para cadeia taxonômica quando necessário; não criar regra de negócio ou banco novo.
- Esses updates não autorizam nova dependência, serviço, banco, automação ou infraestrutura.

## 2. Contrato do caso

### 2.1. Usuário e objetivo operacional

- Usuário: `platform_admin` autenticado pelo shell administrativo vigente.
- Objetivo: consultar rapidamente como a LP Factory estrutura uma `landing_page` antes da geração real, separando claramente:
  - parâmetros raiz;
  - módulos e variantes;
  - entradas operacionais;
  - pesquisas estruturadas.
- A área não substitui documentação normativa; ela apresenta o estado executável ou resolvido dos contratos vigentes.

### 2.2. Arquitetura de informação

- Item lateral único: `Estrutura da LP`.
- Rota única: `/admin/estrutura-lp`.
- Visões internas por query string:
  - `?view=parametros`.
  - `?view=modulos`.
  - `?view=entradas`.
  - `?view=pesquisas`.
- A ausência de `view` deve abrir uma visão inicial simples com quatro cartões de acesso ou usar `parametros` como default documentado, sem redirect técnico desnecessário.
- As visões devem ser navegáveis por links reais, preservando URL copiável e funcionamento com teclado.
- Não criar rotas-filhas ou páginas duplicadas apenas para representar abas.

### 2.3. Visão `Parâmetros` — E18.4

- Mostrar versões disponíveis da raiz e lifecycle/status de cada contrato.
- Para a versão selecionada, mostrar:
  - preset padrão;
  - presets disponíveis;
  - papéis semânticos;
  - faixa recomendada e limite absoluto de texto;
  - opções comuns de spacing;
  - papéis visuais abstratos;
  - critérios visuais e responsivos;
  - larguras de página e leitura;
  - tipografia do preset resolvido.
- Preservar a indicação de hipótese quando o contrato vigente estiver em `hypothesis`.
- Não permitir edição, ativação, criação de nova versão ou alteração de preset canônico.

### 2.4. Visão `Módulos e variantes` — E18.5

- Lista principal:
  - módulo;
  - versão;
  - lifecycle;
  - função estrutural;
  - variantes disponíveis;
  - capabilities;
  - interaction kinds.
- Seleção de módulo/variante deve abrir inspeção na mesma rota, por query params, sem rota dinâmica adicional.
- A inspeção detalhada pode mostrar:
  - fields;
  - cardinalidade;
  - papel semântico da E18.4;
  - política do field;
  - fonte declarada de copy;
  - suporte operacional exigido quando aplicável;
  - interaction contracts;
  - critérios e restrições estruturais.
- Quando a resolução depender de perfil de funil, o usuário deve escolher explicitamente `BOFU`, `MOFU` ou `TOFU`.
- Não inferir perfil de funil pelo taxon, conta ou página comercial.

### 2.5. Visão `Entradas` — E20.2

- Controles de consulta:
  - versão do catálogo;
  - plano `Starter`, `Lite`, `Pro` ou `Ultra`;
  - taxon ativo.
- O Admin monta a cadeia real do taxon server-side e chama o resolver canônico.
- Resumo da resolução:
  - taxon servido;
  - plano consultado;
  - versão;
  - camadas aplicadas;
  - quantidade de fields;
  - validade.
- Tabela de fields:
  - `field_key`;
  - finalidade;
  - camada/origem;
  - tipo;
  - escopo;
  - obrigação;
  - condição quando houver;
  - validação;
  - política de substituição por LP quando houver;
  - proveniência.
- Evidência detalhada pode ficar em expansão ou bloco secundário para não transformar a tabela em dump técnico.
- Não consultar entitlement da conta, não medir valores preenchidos e não mostrar prontidão de geração.

### 2.6. Visão `Pesquisas` — E10.8

- Controles de consulta:
  - taxon ativo.
- Resumo por público:
  - BB: `Própria`, `Pai direto`, `Ausente`, `Revisar` ou `Indisponível`.
  - EC: `Própria`, `Ausente`, `Revisar` ou `Indisponível`.
- Para cada público, mostrar quando disponível:
  - taxon de origem;
  - relação de origem;
  - versão efetiva;
  - quatro blocos obrigatórios;
  - presença/ausência do bloco;
  - quantidade de itens ativos;
  - motivo seguro de falha ou revisão.
- Não misturar BB e EC em um único status visual.
- Não usar ausência de EC para esconder BB herdado válido.
- Não criar editor de pesquisa, alteração de status ou mutation.

### 2.7. Fluxo operacional

#### 2.7.1. Gatilho

- O administrador abre `Estrutura da LP` e escolhe uma das quatro visões.

#### 2.7.2. Entrada

- Contratos repo-only vigentes da E18.4, E18.5 e E20.2.
- Taxonomia real quando necessária à E20.2 ou E10.8.
- Pesquisas estruturadas reais quando a visão E10.8 for selecionada.
- Seletores explícitos do usuário para versão, preset, perfil de funil, plano ou taxon quando aplicável.

#### 2.7.3. Processamento

- Executar server-side.
- Reutilizar APIs públicas canônicas antes de acessar detalhes internos.
- Não importar registry privado de outro domínio para contornar API pública.
- Não duplicar resolver em adapter ou componente.
- Leituras de listas devem ser batched quando houver múltiplos taxons ou registros.
- Não criar N+1 por linha.

#### 2.7.4. Validação

- Entrada inválida ou contrato inválido falha fechado.
- Não converter erro técnico em `Ausente`.
- Não apresentar aproximação como estado real.
- Query param desconhecido deve retornar à visão segura sem crash ou produzir estado inválido controlado, conforme padrão existente.

#### 2.7.5. Persistência

- Nenhuma persistência nova.
- Nenhuma mutation.
- Nenhum snapshot.
- Nenhum novo status de domínio.

#### 2.7.6. Consumo

- Informação operacional legível em português.
- Códigos técnicos podem aparecer como metadado secundário quando necessários à inspeção.
- Tabelas densas devem usar cabeçalho fixo quando houver rolagem vertical controlada e overflow horizontal apenas quando necessário em viewport menor.

#### 2.7.7. Fallback

- Falha de um domínio não altera os demais contratos.
- Exibir mensagem segura e permitir troca de visão ou seletor.
- Não tentar corrigir registry ou banco automaticamente.

### 2.8. Critérios visuais e de UX

- Preservar shell, tokens, componentes e hierarquia do Admin vigente.
- Usar uma navegação local simples entre as quatro visões, sem novo menu global.
- Evitar exposição primária de códigos como `landing_page`, `hypothesis`, `business_buyer` ou nomes internos quando houver rótulo humano claro; códigos podem permanecer como metadado secundário.
- Normalizar português e acentuação nas novas superfícies.
- Desktop:
  - evitar barra horizontal quando a tabela couber com distribuição racional de colunas.
- Mobile:
  - permitir overflow horizontal próprio quando necessário;
  - preservar identidade do item e ação sempre que possível;
  - não exigir redesign global das tabelas do Admin neste recorte.
- Teclado:
  - ordem lógica de TAB;
  - foco visível;
  - links e seletores operáveis por teclado.

## 3. Fases e próxima ação

### 3.1. E12.6.3 — Estrutura da LP read-only no Admin

- Status: planejada.
- Automação: não.
- Objetivo:
  - implementar a rota única `Estrutura da LP` com as quatro visões read-only e as adaptações mínimas de leitura necessárias aos boundaries existentes.
- Entrega:
  - adicionar `Estrutura da LP` ao `components/admin/adminNavigation.ts`;
  - criar somente a rota protegida `/admin/estrutura-lp`;
  - implementar as quatro visões por query string na mesma rota;
  - reutilizar E18.5 e E20.2 pelas APIs vigentes;
  - adicionar somente a menor extensão pública de leitura à E18.4 se a enumeração necessária não puder ser feita pela API vigente, sem exportar registry;
  - reutilizar e, se necessário, extrair o diagnóstico de pesquisa já existente na E12.5 para evitar segunda regra administrativa;
  - criar no máximo um adapter administrativo novo para composição server-side destas leituras, somente se a responsabilidade não couber de forma coesa nos adapters existentes;
  - não criar componente compartilhado novo sem pelo menos dois consumidores reais dentro da própria área;
  - atualizar `docs/roadmap.md` e documentos canônicos materialmente afetados somente conforme `docs/prompt-abc.md`.
- Critérios de aceite:
  - uma única nova rota administrativa;
  - quatro visões endereçáveis e navegáveis por teclado;
  - nenhuma edição ou mutation dos contratos;
  - E18.4 sem hardcode de versão na UI e sem registry exportado;
  - E18.5 sem acesso direto ao registry/schema interno;
  - E20.2 resolvida por taxon + plano sem consultar entitlement;
  - E10.8 apresentada com BB e EC independentes e sem duplicação da regra canônica;
  - nenhuma consulta N+1 por lista;
  - nenhum banco, migration, RPC, policy, job, agente, automação ou chamada de IA nova;
  - `npm ci`, `npm run check`, validadores aplicáveis existentes e `git diff --check` aprovados;
  - QA autenticado em Preview cobrindo desktop, mobile, teclado, foco, console e as quatro visões;
  - relatório final de delta separando código produtivo, testes, docs e formatação, com justificativa para arquivos e linhas novas.
- Baseline anti-inflação antes do código:
  - registrar arquivos candidatos e APIs públicas reutilizadas;
  - registrar contagem de arquivos produtivos novos prevista;
  - expectativa inicial: uma nova página de rota e zero ou um adapter administrativo novo;
  - qualquer novo arquivo de domínio fora desses limites exige parada e justificativa ao Estrategista.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora do recorte

- Editor de E18.4.
- Cadastro, edição ou lifecycle de módulos/variantes da E18.5.
- Cadastro ou edição do catálogo E20.2.
- Edição de pesquisas E10.8.
- Valores concretos de entradas por conta, negócio, oferta, campanha ou LP.
- Prontidão persistida.
- Geração de LP.
- Composição final.
- Renderer novo.
- Alteração do LP Builder.
- Entitlement ou capacidade comercial da E9.7.
- Nova página de E9.7 enquanto o registry runtime estiver vazio.
- Nova página de E20.3, já representada por Perfis de orientação.
- E19.2.
- Banco, migration, RLS, policy, RPC ou trigger.
- API HTTP nova.
- Job, agente, automação, workflow ou nova infraestrutura.
- Nova chamada de IA.
- Redesign global do Admin.
- Conversão global das tabelas do Admin para cartões mobile.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se a implementação exigir:
  - segunda fonte de verdade para E18.4, E18.5, E20.2 ou E10.8;
  - exportar registry ou schema interno apenas para facilitar a UI;
  - nova persistência;
  - autorização de camada de ultranicho não definida por fonte vigente;
  - resolver paralelo;
  - mutation ou editor de contrato repo-only;
  - leitura por taxon em N+1;
  - mais de uma nova rota para representar as quatro visões;
  - mais de um novo adapter administrativo sem justificativa estrutural;
  - mudança de escopo da E9.7, E19 ou E20.3;
  - nova regra de produto não documentada nas fontes canônicas.

### 4.3. Próxima ação após a v1

- Avaliar o plano-base completo conforme `docs/prompt-estrategista.md` antes da execução.
- Após a decisão humana sobre o processo, consolidar a v2 ou acionar o processo automatizado aplicável.
- Não entregar briefing de implementação ao Executor antes do gate correspondente do plano-base.
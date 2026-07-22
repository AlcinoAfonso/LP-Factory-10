# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para liberar taxons e orientar a jornada até a criação e validação de LPs reais.

Fontes de referência: `README.md`, `AGENTS.md`, `docs/lp-planejamento.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lousa-plano-base-e10-8.md`, `docs/lousa-plano-base-e20-2.md`, `docs/lousa-plano-base-e18-4.md`, `docs/lousa-plano-base-e18-5.md`, PRs #590 e #602 e decisões humanas de 22/07/2026.

## 1. Jornada da base até as LPs publicadas

### 1.1. Resultado final esperado

- A entrega final é criar LPs testáveis e publicáveis por nicho ou ultranicho.
- Tipos ou intenções de LP: BOFU, MOFU e TOFU.
- BOFU, MOFU e TOFU não são canais; o canal é `landing_page`.
- A origem de tráfego é separada da intenção: Google Ads, Instagram Ads, WhatsApp, QR Code, orgânico ou outra origem.
- A intenção informada entra na geração da LP final sem exigir três composições oficiais por taxon no MVP.
- A LP usada como evidência deve ser criada por uma conta autorizada, pelo Account Dashboard, usando a E19 e o mesmo fluxo destinado aos clientes futuros.
- Não deve existir gerador administrativo paralelo, entidade especial de LP teste, aprovação automática pela IA ou LP oficial de validação criada por script, fixture ou insert direto.

### 1.2. Preparar o taxon e resolver os itens estruturados

- O administrador cria ou seleciona o taxon no Admin Dashboard e confirma sua posição na taxonomia `segmento → nicho → ultranicho`.
- Os itens estruturados do taxon devem ser criados, revisados e aprovados antes da composição.
- A E10.8 resolve `end_customer` exclusivamente no taxon atendido.
- A E10.8 resolve `business_buyer` no próprio taxon ou, somente quando permitido pelo contrato, no pai direto.
- A resolução preserva taxon atendido, fontes, pesquisas, itens, `audience_scope` e versões usadas.
- Os quatro blocos obrigatórios são `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
- A resolução falha fechado diante de ausência, invalidade ou ambiguidade impeditiva.
- Herança de composição não autoriza conteúdo genérico: copy, FAQ, provas, oferta e CTA continuam específicos do taxon atendido.

### 1.3. Definir a parametrização raiz da LP

- A E18.4 fornece o contrato raiz versionado da família `landing_page`.
- A raiz concentra papéis semânticos, faixas editoriais, limites técnicos absolutos, critérios visuais e responsivos, presets e opções comuns.
- A fonte versionada no repositório alimenta geração, validação e renderização sem exigir configuração dinâmica em runtime.
- A precedência começa na raiz e qualquer ampliação de limite absoluto exige nova versão da raiz.
- Os valores vigentes permanecem hipóteses até validação por LP real.

### 1.4. Definir a parametrização de módulos e variantes

- A E18.5 fornece o catálogo versionado de módulos e variantes da família `landing_page`.
- Módulo define função estrutural reutilizável; variante define execução estrutural ou comportamental compatível.
- A precedência é `raiz → módulo → variante`.
- Especializações podem restringir o contrato herdado, mas não ampliar seus limites absolutos.
- Diferença de taxon, conteúdo, campanha, plano, ordem ou ajuste já permitido não cria variante por si só.
- Os contratos preservam campos, cardinalidades, fontes de copy, perfis BOFU, MOFU e TOFU, lifecycle, compatibilidade e falha fechada.
- Módulos e variantes não criam composição, conteúdo concreto, persistência ou LP final.

### 1.5. Definir o catálogo de entradas para geração da LP

- A E20.2 fornece o catálogo declarativo versionado de entradas por taxon e plano.
- O catálogo declara quais valores da conta, negócio, oferta, campanha ou LP podem ser apresentados e usados na geração.
- A resolução segue `universal → segmento → nicho → ultranicho autorizado`.
- Camada própria de ultranicho é excepcional e depende de decisão humana.
- O catálogo não define módulos, variantes, ordem ou composição.
- `paid_search_keyword_map` permanece entrada opcional quando houver busca paga.
- Valores reais e snapshot pertencem ao fluxo da E19.4, não ao catálogo declarativo.

### 1.6. Criar e aprovar a composição base do taxon

- A composição oficial é criada pelo Admin Dashboard, dentro do fluxo da E20.3.
- O administrador seleciona taxon e plano e solicita à IA uma proposta de composição.
- A proposta usa o conjunto resolvido pela E10.8, a raiz da E18.4, o catálogo de módulos e variantes da E18.5 e o catálogo aplicável da E20.2.
- A IA propõe módulos, variantes, ordem, obrigatoriedade e escolhas permitidas por ocorrência, sem poder aprovar ou ativar.
- O sistema valida a proposta contra os contratos vigentes e bloqueia opções incompatíveis.
- O administrador revisa, ajusta somente dentro das escolhas permitidas e aprova.
- A composição aprovada é persistida como versão governada e pode ser ativada após a confirmação de prontidão.
- A primeira composição oficial deve usar o mesmo fluxo reutilizável dos próximos taxons.
- Migration, seed, script, Executor ou insert direto podem apoiar teste técnico, mas não atendem o critério funcional de criação da composição oficial.
- A composição pode ser própria ou herdada.
- A preferência é composição própria de segmento ou nicho; composição própria de ultranicho é excepcional e exige justificativa humana.
- A composição registra módulos, variantes, ordem, obrigatoriedade e escolhas permitidas.
- Composição aprovada no taxon pai pode ser herdada quando não houver composição própria válida e nenhuma restrição impeditiva.
- Gap essencial de módulo, variante, contrato ou fonte bloqueia prontidão e autorização.
- Aprovar a composição para teste não equivale a liberar o taxon e o plano para clientes.

### 1.7. Autorizar a conta de teste e gerar a primeira LP real

- A autorização é uma decisão administrativa anterior à geração e vincula exatamente `conta + taxon + plano`.
- A conta autorizada permanece uma conta normal; não recebe tipo ou status especial.
- Outros taxons ou planos exigem autorizações próprias.
- A autorização depende de composição ativa e prontidão confirmada.
- O entitlement comercial da E9 e os requisitos operacionais de conta e membership continuam obrigatórios.
- A autorização de teste não substitui o gate comercial da E9.
- Depois da autorização, a própria conta cria a primeira LP pelo Account Dashboard, usando a E19.
- A experiência deve refletir o fluxo futuro do cliente: apresentação das entradas, fornecimento de valores reais, validação, geração e continuidade do ciclo da LP.
- Admin Dashboard, script, fixture ou insert direto não criam a LP oficial de validação.
- A LP pertence à conta e usa composição, pesquisas resolvidas, entradas, plano, intenção e versões aplicáveis.
- O snapshot preserva valores, fontes, composição, parametrizações, módulos, variantes, plano e versões usados.

### 1.8. Validar a LP real e liberar o taxon e o plano

- O Admin Dashboard localiza a LP real produzida pela E19 na conta autorizada.
- O humano consulta a LP, seu snapshot, as fontes, as versões, as validações e as evidências aplicáveis.
- O humano aprova, rejeita ou solicita correções.
- Somente essa LP real pode sustentar a liberação geral do taxon e do plano.
- O Admin Dashboard não gera nem regenera LP paralela para produzir evidência.
- A decisão registra taxon, plano, conta, LP, composição, fontes, versões, responsável, momento e resultado.
- A aprovação de um plano não libera automaticamente os demais.
- Herança da liberação depende do uso da mesma composição aplicável e das regras aprovadas para os taxons descendentes.
- Mudança material em parametrização, módulo, variante, composição, catálogo ou capacidade do plano pode exigir nova validação humana.

### 1.9. Gerar, revisar e publicar as LPs das contas

- Contas autorizadas, pilotos, contas consultivas e clientes usam o mesmo fluxo da E19.
- Antes da liberação geral, a geração exige autorização específica para `conta + taxon + plano`.
- Depois da liberação, contas elegíveis usam a mesma composição, o mesmo catálogo e o mesmo fluxo produtivo.
- A geração adapta conteúdo somente dentro dos contratos e escolhas aprovados.
- Cada LP preserva snapshot e rastreabilidade das fontes e versões usadas.
- Revisão, edição controlada, publicação, renderização e tracking seguem os recortes aprovados da E19.
- Editor visual e nova infraestrutura permanecem fora até decisão e plano-base próprios.

### 1.10. Evoluir a base com as LPs validadas

- LPs reais podem revelar ajustes necessários na raiz, módulos, variantes, catálogo, composição ou critérios editoriais.
- Mudanças devem ser reutilizáveis, versionadas e tratadas no recorte proprietário.
- Ajustes soltos por taxon devem ser evitados.
- O Benchmark Blueprint é complementar e opcional após a validação da LP real.
- O Blueprint não altera automaticamente contratos, composição, renderer, banco ou LP publicada.
- Eventos de validação controlada devem permanecer identificáveis sem classificar a conta como conta de teste.

## 2. Estado da implementação e próximos recortes

### 2.1. Preparação do taxon e resolução dos itens estruturados

- E10.8 concluída e mergeada pelo PR #571.
- Resolve `end_customer` no taxon atendido e `business_buyer` próprio ou do pai direto conforme o contrato.
- Entrega resultado server-side, read-only, tipado, rastreável e fail-closed.
- E20 e E19 devem consumir o resultado sem recalcular precedência ou herança das pesquisas.

### 2.2. Parametrização raiz da LP

- E18.4 concluída após os PRs #564, #566 e #567.
- A raiz versionada é a fonte dos contratos comuns da família `landing_page`.
- A implementação anterior de composição e renderer prematuros foi removida.
- E18.4 permanece encerrada e não deve ser reaberta pelos planos restantes.

### 2.3. Parametrização de módulos e variantes

- E18.5 concluída, aprovada e mergeada pelo PR #590, com consolidação documental no PR #602.
- O catálogo repo-only fornece módulos, variantes e contratos resolvidos para consumo posterior.
- Seleção, ordem, obrigatoriedade, composição, persistência e LP real permanecem fora da E18.5.
- E18.5 permanece encerrada e não deve ser reaberta pelos planos restantes.

### 2.4. Catálogo de entradas para geração da LP

- E20.2 concluída e encerrada.
- O catálogo declarativo é resolvido por taxon e plano, com herança e proveniência.
- O recorte não coleta valores operacionais, não cria autorização e não gera LP.
- E20.3 e E19.4 devem consumir o catálogo resolvido sem duplicar seu contrato.

### 2.5. Composição, prontidão e autorização para teste

- A E20.3 deve entregar o fluxo mínimo e definitivo de:
  - proposição da composição por IA no Admin Dashboard;
  - validação contra E10.8, E18.4, E18.5 e E20.2;
  - revisão e ajustes humanos controlados;
  - aprovação, versionamento e ativação;
  - composição própria ou herdada;
  - registro de gaps impeditivos;
  - confirmação de prontidão;
  - autorização e revogação por `conta + taxon + plano`;
  - operação administrativa mínima de `12.4.3` e `12.4.4`.
- A E20.3 deve criar a primeira composição oficial pelo mesmo fluxo reutilizável dos taxons seguintes.
- O plano-base deve decidir somente os contratos e artefatos necessários ao recorte, sem antecipar banco, rota, API ou componente.

### 2.6. Geração real, validação e liberação

- A E19.4 deve implementar, para uso da conta pelo Account Dashboard:
  - apresentação das entradas aplicáveis;
  - coleta dos valores reais;
  - validação de completude e compatibilidade;
  - geração da LP;
  - persistência do resultado;
  - snapshot das fontes, valores e versões;
  - ciclo aprovado de revisão, edição controlada, publicação, renderização e tracking.
- A primeira LP oficial deve nascer integralmente desse fluxo.
- A E12.4 deve localizar e avaliar a LP produzida pela E19, sem criar outra LP.
- A liberação geral depende de decisão humana registrada sobre essa evidência real.

### 2.7. Fluxo único de LPs por conta

- A criação mínima já implementada pela E19 deve evoluir pelo novo plano-base, sem reabrir o recorte encerrado.
- O fluxo da E19 é único para conta autorizada e clientes futuros.
- Pré-liberação e pós-liberação diferem apenas pelo gate de elegibilidade, não pelo gerador ou pela persistência da LP.
- Fontes, composição, contratos, valores e versões devem permanecer rastreáveis em cada geração.
- Não antecipar editor visual ou infraestrutura nova sem decisão e plano-base próprios.

### 2.8. Evolução controlada

- Aprendizados de LPs validadas devem retornar ao recorte proprietário da decisão afetada.
- O Benchmark Blueprint permanece opcional e sem alterações automáticas.
- Não criar catálogo universal multicanal sem evidência prática de reutilização e valor.
- E10.7 e E19 permanecem separados; páginas comerciais não se convertem em LPs do Builder sem plano próprio.

## 3. Ordem dos planos-base técnicos

- Concluídos:
  - 1º — E18.4: parametrização raiz da família `landing_page`.
  - 2º — E18.5: catálogo de módulos e variantes.
  - 3º — E10.8: resolução das pesquisas estruturadas para `landing_page`.
  - 4º — E20.2: catálogo declarativo de entradas por taxon.
- Restantes, nesta ordem:
  - 5º — E20.3: composição, herança, gaps, prontidão e autorização, incluindo a operação mínima de `12.4.3` e `12.4.4`.
  - 6º — E19.4: geração e ciclo da LP real pela conta no Account Dashboard.
  - 7º — E12.4: revisão da LP real e decisão de liberação por `12.4.5` e `12.4.6`.
- Dependências:
  - E20.3 consome E10.8, E18.4, E18.5 e E20.2.
  - E19.4 consome a composição ativa e a autorização ou liberação definidas pela E20.3.
  - E12.4 revisa a LP real somente depois da produção pela E19.4.
- Cada plano-base decide apenas os artefatos necessários ao próprio recorte.

## 4. Onde cada ajuste entra no roadmap

- Esta seção distribui as decisões duráveis pelos proprietários funcionais do roadmap.
- A distribuição orienta os planos-base restantes, sem alterar automaticamente `docs/roadmap.md`.
- Não deve existir fluxo administrativo paralelo de geração de LP.

### 4.1. E10 — Taxons, pesquisas e itens estruturados

- E10.8 está concluída e permanece proprietária da resolução das pesquisas estruturadas para `landing_page`.
- `end_customer` permanece no taxon atendido.
- `business_buyer` usa o conjunto próprio elegível ou o pai direto somente nas condições aprovadas.
- O resultado preserva atomicidade, proveniência e versões e falha fechado diante de fonte inválida ou ambígua.
- E20.3 e E19.4 apenas consomem esse contrato.
- Permanecem fora da E10.8: composição, catálogo de entradas, geração, UI administrativa, automação e infraestrutura nova.

### 4.2. E12 — Autorização, validação e liberação administrativa

- A E12 é a superfície administrativa das decisões humanas, sem ser fonte dos contratos da E10, E18, E20 ou E19.
- `12.4.3` deve se chamar `Criação, aprovação e prontidão da composição` e permitir:
  - selecionar taxon e plano;
  - solicitar proposta da IA;
  - validar a proposta;
  - revisar e aplicar ajustes controlados;
  - aprovar, versionar e ativar a composição;
  - consultar e aprovar a prontidão.
- `12.4.4 — Autorização controlada para teste` deve permitir:
  - autorizar a combinação `conta + taxon + plano`;
  - consultar autorizações vigentes;
  - revogar a combinação.
- `12.4.5` e `12.4.6` entram somente depois da LP real produzida pela E19 e devem:
  - localizar a LP e suas evidências;
  - registrar aprovação, rejeição ou correções;
  - registrar a decisão de liberação.
- A E12 não gera, regenera, publica automaticamente ou aprova automaticamente uma LP.
- O plano-base define apenas as operações, permissões e evidências necessárias ao recorte.

### 4.3. E18 — Parametrização técnica da família `landing_page`

- E18.4 e E18.5 estão concluídas e não devem ser reabertas.
- Estado conceitual durável:
  - raiz versionada para regras comuns da família;
  - módulos e variantes versionados para funções e execuções reutilizáveis;
  - precedência `raiz → módulo → variante`;
  - contratos estritos, rastreáveis e fail-closed;
  - composição concreta pertence à E20;
  - conteúdo, valores operacionais e LP final pertencem à E19.
- E18 não cria composição oficial, autorização, prontidão ou LP real.

### 4.4. E20 — Preparação e liberação de taxons para geração de landing pages

- A E20 é proprietária funcional do catálogo, composição, herança, gaps, prontidão, autorização e critérios de liberação por taxon e plano.
- E20.2 está concluída; E20.3 é o próximo recorte.
- A E20.3 usa a E12 como superfície administrativa para criação e decisão humana.
- A primeira composição oficial deve ser criada, revisada, aprovada, versionada e ativada pelo fluxo definitivo do Admin Dashboard.
- A E20.3 não pode ser reduzida a insert manual, seed, fixture, script ou resolver read-only.
- A E20 não gera, revisa, edita ou publica LPs das contas.
- A E20 consome E10 e E18 sem duplicar seus contratos.
- O plano-base decide os artefatos mínimos após avaliar o estado real do projeto, sem antecipação técnica neste documento.

### 4.5. E19 — Fluxo único de landing pages por conta

- A primeira LP oficial é criada pela conta no Account Dashboard, usando a E19.
- O mesmo fluxo atende a conta autorizada antes da liberação e os clientes futuros depois da liberação.
- A E19 apresenta entradas, coleta valores, valida, gera, persiste e preserva snapshot e versões.
- Não pode existir criação prévia da LP oficial por Admin, script, fixture ou insert direto.
- A LP criada pela E19 é a evidência localizada e avaliada pela E12.
- A E19 consome entitlement da E9, pesquisas da E10.8, contratos da E18 e catálogo, composição e elegibilidade da E20.
- A E19 não recalcula herança de pesquisas nem altera contratos aprovados durante a geração.
- Editor visual, drag and drop, analytics avançado, teste A/B, domínio customizado, automação, agente, job e capacidades não aprovadas permanecem fora.

14/07/2026 — Plano-base E20.2 — Catálogo de entradas por taxon

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e10-8.md`, contratos atuais de planos, contas, taxons e landing pages, `Pesquisa bruta para corretor de imóveis de médio padrão.pdf`, `Projeto Piloto Imobiliário.pdf` e avaliações do Analista de 14/07/2026.

- Versão: v1.
- Status: plano-base v1 criado em PR vivo; avaliação única dos especialistas pendente; Executor não autorizado.
- Recorte previsto para roadmap: `20.2 — Catálogo de entradas por taxon`.
- Path canônico: `docs/lousa-plano-base-e20-2.md`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- O projeto ainda não possui um contrato canônico que declare quais dados uma conta, negócio, oferta, campanha ou LP pode ou deve fornecer para a geração de `landing_page`.
- O recorte deve definir o `lp_generation_input_catalog` sem confundi-lo com parametrização, módulos, variantes, composição, pesquisas da E10, conteúdo produzido ou LP final.
- O resultado esperado é uma fonte declarativa versionada, resolvida por `taxon + plano`, com primeiro catálogo concreto validado no recorte imobiliário.
- O catálogo aplicável deve integrar os critérios de prontidão da futura E20.3, sem avaliar nesta etapa se uma conta concreta já forneceu todos os valores.

### 1.2. Estado real confirmado

- A E18.4 já possui parametrização raiz repo-only e versionada para `landing_page`.
- A E18.5 permanece responsável por módulos e variantes e não é dependência para definir entradas operacionais da E20.2.
- A E10.8 possui plano-base v2 e implementação em PR próprio para resolver pesquisas estruturadas; a E20.2 não deve reimplementar essa precedência.
- `account_profiles` contém apenas dados mínimos de perfil e não representa o catálogo completo de geração.
- `account_landing_pages` contém apenas identidade mínima da LP e status inicial `draft`.
- Os planos comerciais confirmados são `starter`, `lite`, `pro` e `ultra`.
- Não existe fonte aprovada que determine campos diferentes entre esses quatro planos.
- Não foi demonstrada necessidade de tabela, campo, view, RPC, migration, rota, UI, API, configuração dinâmica ou persistência nova.
- A E20 ainda não está materializada em `docs/roadmap.md`; `docs/lp-planejamento.md` é a decisão conceitual obrigatória deste recorte.

### 1.3. Função das fontes empíricas

- `Pesquisa bruta para corretor de imóveis de médio padrão.pdf` é a fonte empírica principal para levantar candidatos de entrada.
- `Projeto Piloto Imobiliário.pdf` é fonte contextual complementar para comprovar operação real, campanhas, formulários, WhatsApp, qualificação e processo comercial.
- Nenhuma informação dessas fontes entra automaticamente no catálogo.
- Cada candidato deve passar pela barreira de admissão da seção 2.2 antes de ser incorporado.

### 1.4. Decisões fixas do debate

- Separar obrigatoriamente:
  - definição declarativa dos campos;
  - valores operacionais fornecidos pela conta, negócio, oferta, campanha ou LP;
  - snapshot dos valores efetivamente usados em uma geração.
- A E20.2 implementa somente a primeira camada.
- Valores operacionais e snapshot pertencem ao futuro plano da E19.4.
- A fonte canônica inicial será versionada no repositório.
- A resolução seguirá `universal → segmento → nicho → ultranicho`.
- Taxon de ultranicho pode herdar normalmente sem possuir camada própria.
- Somente a criação ou utilização de camada específica de ultranicho depende de autorização humana registrada.
- O primeiro catálogo não terá camada própria de ultranicho para `corretor de imóveis de médio padrão`; ele validará a herança das camadas de segmento e nicho.
- Todos os campos v1 serão aplicáveis igualmente a `starter`, `lite`, `pro` e `ultra`.
- Restrição por plano só poderá surgir em nova versão e com decisão comercial explícita.
- `paid_search_keyword_map` será opcional e somente aplicável quando a origem de tráfego for busca paga.
- Automação, agente, job, workflow ou rotina recorrente não se aplicam.

### 1.5. Limites de responsabilidade

- A E10.8 resolve pesquisas e proveniência; não define entradas da conta.
- A E18 define parametrizações, módulos e variantes; não define valores operacionais do negócio.
- A E20.2 define o catálogo declarativo; não coleta valores.
- A E20.3 consumirá o catálogo resolvido para prontidão e autorização controlada.
- A E19.4 apresentará os campos, receberá valores, gerará a LP e preservará snapshot.
- A E12 poderá conferir o resultado em superfície administrativa futura, mas não será fonte do contrato.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - E20.3 ou futuro consumidor solicita o catálogo aplicável a um taxon e plano.
- Entrada:
  - versão do catálogo;
  - plano entre `starter`, `lite`, `pro` e `ultra`;
  - cadeia normalizada e ativa do taxon atendido, preservando nível, identidade e ancestrais aplicáveis.
- Processamento:
  - validar versão, plano e cadeia taxonômica;
  - carregar a definição universal;
  - aplicar as camadas existentes de segmento e nicho;
  - aplicar camada de ultranicho somente quando existir e estiver autorizada;
  - adicionar campos novos e resolver especializações pelo mesmo `field_key`;
  - preservar a proveniência de cada propriedade efetiva;
  - produzir catálogo resolvido sem valores operacionais.
- Validação:
  - aplicar invariantes, especialização, condições, tipos, planos, snapshot e matriz de casos.
- Persistência:
  - somente definição declarativa versionada no repositório.
- Consumo:
  - E20.3 recebe validade e catálogo resolvido;
  - E19.4 futuramente recebe o mesmo contrato para coleta e geração.
- Fallback:
  - ausência de camada própria de nicho ou ultranicho mantém a herança válida;
  - camada existente inválida ou conflitante bloqueia a resolução;
  - não gerar campos por IA nem inferir valores ausentes.

### 2.2. Barreira de admissão dos campos

Cada campo candidato deve demonstrar cumulativamente que:

- o valor será fornecido ou confirmado pela conta, negócio atendido, oferta, campanha ou LP;
- existe consumidor real previsto na futura E19.4;
- não é resultado das pesquisas estruturadas resolvidas pela E10.8;
- não é parâmetro da E18;
- não define módulo, variante ou composição;
- não é copy, promessa, dor, objeção, FAQ, vocabulário ou conteúdo já produzido;
- não duplica outro campo herdado com a mesma finalidade;
- possui origem esperada, tipo, validação, obrigatoriedade, relação com plano e política de snapshot definidos.

Dores, objeções, medos, vocabulário, FAQ, diretrizes de copy e ordem de seções não entram no catálogo.

### 2.3. Modelo declarativo mínimo

Cada definição de campo deve possuir:

- `field_key` estável e único na cadeia resolvida;
- finalidade semântica objetiva;
- camada de origem: universal, segmento, nicho ou ultranicho;
- taxon de origem quando não universal;
- `value_type`;
- `value_scope`: `account`, `business`, `offer`, `campaign` ou `landing_page`;
- obrigação: `required`, `optional` ou `conditional`;
- `required_when`, somente quando a obrigação for condicional;
- `applicable_when`, quando o campo só puder ser apresentado ou fornecido em determinado contexto;
- validação declarativa compatível com o tipo;
- planos permitidos;
- política de snapshot;
- base de evidência resumida;
- versão do catálogo em que a definição foi criada.

A forma exata dos tipos TypeScript pertence à implementação repo-only, mas não pode criar contrato externo, rota ou payload de API nesta etapa.

### 2.4. Tipos e condições v1

Tipos permitidos na v1:

- `string`;
- `url`;
- `enum`;
- `string_list`;
- `boolean`;
- `number_range`;
- `keyword_map`.

Condições v1:

- devem referenciar um único `field_key` existente;
- operadores permitidos: igualdade ou pertencimento a conjunto;
- não haverá expressão livre, código executável, árvore arbitrária ou engine de regras;
- referências circulares, ausentes ou incompatíveis bloqueiam a resolução.

### 2.5. Especialização entre camadas

Propriedades imutáveis para o mesmo `field_key`:

- identidade do campo;
- finalidade semântica;
- `value_type`;
- `value_scope`;
- política de snapshot.

Propriedades que podem ser especializadas explicitamente em camada inferior:

- obrigação;
- `required_when`;
- `applicable_when`;
- validação;
- planos permitidos.

Regras:

- propriedades não sobrescritas permanecem herdadas;
- camada inferior pode adicionar campo novo;
- obrigação só pode ficar mais restritiva: `optional → conditional|required` e `conditional → required`;
- condição pode ser adicionada ou restringida, nunca removida para ampliar aplicação silenciosamente;
- validação pode restringir enum, formato, quantidade ou faixa, mas não ampliar o contrato herdado;
- planos permitidos só podem ser reduzidos, nunca ampliados além do pai;
- campo herdado não pode ser removido ou desativado na v1;
- alteração de propriedade imutável exige novo `field_key` e nova versão do catálogo;
- especialização inválida bloqueia a resolução e não pode ser ignorada.

### 2.6. Herança, precedência e ultranicho

- Ordem de resolução: universal, segmento, nicho e ultranicho autorizado.
- A camada inferior vence somente nas propriedades explicitamente especializadas.
- Ausência de camada inferior não é erro.
- Taxon de ultranicho sem camada própria recebe normalmente o catálogo herdado.
- Falha somente quando existir ou for solicitada camada específica de ultranicho sem autorização humana registrada.
- A primeira versão deve resolver o taxon `corretor-de-imoveis-de-medio-padrao` sem camada própria de ultranicho.
- A identidade exata do segmento ancestral deve ser confirmada no estado real antes da implementação do registry; não criar ou renomear taxon neste plano.

### 2.7. Relação com planos

- O resolver exige plano conhecido para produzir contrato estável de consumo.
- Na v1, todos os campos efetivos devem declarar os quatro planos.
- O resultado para o mesmo taxon deve ser funcionalmente equivalente nos quatro planos.
- O plano não altera obrigatoriedade, tipo, validação, herança ou snapshot na v1.
- Diferença futura exige evidência comercial, nova versão do catálogo e plano-base próprio quando material.

### 2.8. Separação dos valores futuros e snapshot

A E20.2 deve deixar explícito que o valor futuro se vinculará conceitualmente a:

- `field_key`;
- versão do catálogo;
- taxon atendido;
- plano resolvido;
- escopo do valor;
- identidade da conta e da LP quando aplicável.

Limites:

- a E20.2 não define tabela, coluna, JSON persistido, rota, action ou formulário;
- a E19.4 decidirá a persistência operacional;
- a E19.4 deverá preservar no snapshot a versão do catálogo e os valores efetivamente usados;
- todos os campos v1 terão política `include_if_used`;
- valor não utilizado na geração não deve ser incluído artificialmente no snapshot.

### 2.9. `paid_search_keyword_map`

- `field_key`: `paid_search_keyword_map`.
- Camada: universal.
- Tipo: `keyword_map`.
- Escopo: `campaign`.
- Obrigação: opcional.
- Aplicabilidade: somente quando `traffic_source = paid_search`.
- Planos: `starter`, `lite`, `pro` e `ultra`.
- Snapshot: `include_if_used`.
- Finalidade:
  - alinhar termo ou cluster de busca, contexto do anúncio ou oferta e âncora de mensagem da LP;
  - sustentar message match sem substituir pesquisas da E10;
  - não alterar módulos, variantes, composição ou parametrizações.
- Restrições:
  - não autoriza keyword stuffing;
  - não cria conteúdo automaticamente;
  - não permite termos incompatíveis com a oferta real;
  - não é obrigatório mesmo em campanha de busca paga.

### 2.10. Primeiro catálogo concreto v1

#### 2.10.1. Camada universal

- `business_display_name`:
  - tipo `string`;
  - escopo `business`;
  - obrigatório;
  - finalidade: identificar factual e publicamente o negócio ou profissional atendido.
- `funnel_stage`:
  - tipo `enum` com `bofu`, `mofu` e `tofu`;
  - escopo `landing_page`;
  - obrigatório;
  - finalidade: informar a intenção da LP sem criar composição própria por estágio.
- `traffic_source`:
  - tipo `enum` com `paid_search`, `paid_social`, `organic`, `whatsapp`, `qr_code` e `other`;
  - escopo `campaign`;
  - opcional.
- `primary_conversion_channel`:
  - tipo `enum` com `whatsapp`, `form`, `phone`, `email` e `external_url`;
  - escopo `landing_page`;
  - obrigatório.
- `primary_conversion_destination`:
  - tipo `string`;
  - escopo `landing_page`;
  - condicionalmente obrigatório quando o canal for `whatsapp`, `phone`, `email` ou `external_url`.
- `privacy_policy_url`:
  - tipo `url`;
  - escopo `business`;
  - condicionalmente obrigatório quando o canal for `form`.
- `paid_search_keyword_map`:
  - contrato definido na seção 2.9.

#### 2.10.2. Camada do segmento imobiliário

- `transaction_intent`:
  - tipo `enum` com `buy`, `sell`, `valuation` e `mixed`;
  - escopo `landing_page`;
  - obrigatório.
- `service_locations`:
  - tipo `string_list`;
  - escopo `business`;
  - obrigatório;
  - finalidade: declarar cidades, regiões, bairros ou micro-regiões realmente atendidos.
- `property_types`:
  - tipo `string_list`;
  - escopo `offer`;
  - opcional.
- `property_price_range`:
  - tipo `number_range`;
  - escopo `offer`;
  - opcional.
- `property_stage`:
  - tipo `enum` com `launch`, `under_construction`, `ready`, `used` e `mixed`;
  - escopo `offer`;
  - opcional.
- `financing_support_available`:
  - tipo `boolean`;
  - escopo `business`;
  - opcional.
- `document_support_available`:
  - tipo `boolean`;
  - escopo `business`;
  - opcional.

#### 2.10.3. Camada do nicho corretor de imóveis

- `creci_registration`:
  - tipo `string`;
  - escopo `business`;
  - obrigatório;
  - finalidade: preservar credencial factual verificável do profissional.
- `attendance_modes`:
  - tipo `string_list`;
  - escopo `business`;
  - opcional;
  - finalidade: declarar atendimento presencial, remoto ou combinação real disponível.

#### 2.10.4. Camada do ultranicho corretor de imóveis de médio padrão

- Nenhum campo próprio na v1.
- O taxon deve herdar integralmente as camadas universal, segmento e nicho.
- Faixa de preço, tipologia e estágio já são entradas operacionais do segmento e não justificam camada própria.

#### 2.10.5. Políticas comuns

- Todos os campos são permitidos nos quatro planos.
- Todos usam snapshot `include_if_used`.
- Nenhum campo define estrutura da página.
- Nenhum campo substitui pesquisa, copy ou conteúdo produzido.
- Valores e limites exatos não definidos acima devem permanecer ausentes, em vez de serem inventados pelo Executor.

### 2.11. Critério de prontidão do catálogo

O resultado da E20.2 pode ser marcado como catálogo válido quando:

- a versão existe e é única;
- o plano é conhecido;
- a cadeia taxonômica é coerente;
- toda camada aplicada é válida;
- camada própria de ultranicho, quando existir, possui autorização;
- cada campo efetivo possui todas as propriedades obrigatórias;
- não há duplicidade não declarada;
- não há mudança de propriedade imutável;
- especializações respeitam as regras da seção 2.5;
- condições apontam para campos existentes e não são circulares;
- tipos e validações são coerentes;
- todos os campos possuem origem esperada e política de snapshot;
- `paid_search_keyword_map` respeita sua aplicabilidade;
- o resultado preserva a proveniência das camadas e propriedades.

Esse sinal não significa que uma conta já forneceu os valores. A completude de valores pertence à E19.4 e será combinada pela E20.3 com os demais critérios de prontidão.

### 2.12. Resultado tipado

O sucesso deve preservar, no mínimo:

- versão do catálogo;
- taxon atendido;
- plano;
- cadeia de camadas utilizada;
- campos efetivos na ordem determinística do registry;
- definição efetiva de cada campo;
- camada e taxon de origem;
- propriedades especializadas e sua origem;
- sinal de catálogo válido para consumo pela E20.3.

A falha deve distinguir, no mínimo:

- versão inválida ou ausente;
- plano inválido;
- cadeia taxonômica inválida;
- camada inválida;
- ultranicho específico sem autorização;
- campo duplicado sem especialização válida;
- conflito de tipo ou propriedade imutável;
- especialização que amplia contrato herdado;
- condição inválida, ausente ou circular;
- contrato do `paid_search_keyword_map` inválido.

Nenhum resultado contém valores reais da conta ou snapshot de geração.

### 2.13. Boundary técnico canônico

- Boundary: `lib/conversion-content/landing-page/input-catalog/`.
- Fluxo: registry versionado → schema estrito → resolver puro → resultado tipado.
- Arquivos previstos:
  - `contracts.ts`;
  - `registry.ts`;
  - `schema.ts`;
  - `resolver.ts`;
  - `validation-cases.ts`;
  - `index.ts`.
- Export agregado:
  - ajustar `lib/conversion-content/index.ts` com namespace separado `landingPageInputCatalog`.
- Script:
  - adicionar `validate:landing-page-input-catalog` em `package.json`.
- Não criar adapter de banco na E20.2.
- O resolver recebe cadeia taxonômica normalizada do consumidor e não consulta Supabase.
- Não alterar os arquivos da parametrização raiz da E18.4 nem o boundary da E10.8.
- Não adicionar dependência nova.

### 2.14. Matriz mínima de validação

- versão inexistente: falhar;
- plano desconhecido: falhar;
- cadeia de taxon inválida ou fora de ordem: falhar;
- catálogo universal válido sem camada específica: resolver;
- segmento e nicho válidos: combinar em ordem;
- ultranicho sem camada própria: herdar e resolver;
- camada própria de ultranicho autorizada: resolver;
- camada própria de ultranicho sem autorização: falhar;
- campo novo em camada inferior: adicionar;
- especialização explícita válida: preservar propriedades não alteradas;
- mudança de `value_type`, finalidade, escopo ou snapshot: falhar;
- obrigação mais restritiva: aceitar;
- obrigação relaxada: falhar;
- validação restringida: aceitar;
- validação ampliada: falhar;
- planos reduzidos: aceitar em fixture estrutural, sem aplicar na v1 real;
- planos ampliados além do pai: falhar;
- referência de condição ausente: falhar;
- condição circular: falhar;
- `paid_search_keyword_map` ausente com busca paga: aceitar;
- mapa presente sem busca paga: falhar;
- mapa válido com busca paga: resolver;
- primeiro catálogo imobiliário nos quatro planos: produzir resultado equivalente;
- taxon de médio padrão: confirmar ausência de camada própria e herança integral;
- saída não deve conter valores operacionais nem snapshot.

## 3. Fases e próxima ação

### 3.1. E20.2.3–E20.2.6 — Contrato, catálogo imobiliário v1 e resolver repo-only

- Status: planejada.
- Automação: não.
- Objetivo:
  - implementar o contrato declarativo, versionamento, herança, especialização, primeiro catálogo concreto, `paid_search_keyword_map`, resolver e sinal de prontidão definidos na seção 2.
- Escopo executável:
  - confirmar por inspeção read-only a cadeia real do taxon imobiliário e seus slugs antes de codificar as camadas;
  - implementar somente os paths da seção 2.13;
  - implementar o registry v1 com as definições da seção 2.10;
  - manter o ultranicho de médio padrão sem camada própria;
  - criar validação executável para toda a matriz da seção 2.14;
  - garantir saída imutável e falha fechada;
  - exportar o namespace e adicionar o script de validação;
  - executar `npm ci`, `npm run check` e `npm run validate:landing-page-input-catalog`;
  - registrar neste plano a evidência, decisão e próxima ação da fase.
- Artefatos previstos:
  - criar `lib/conversion-content/landing-page/input-catalog/contracts.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/registry.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/schema.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/resolver.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/index.ts`;
  - ajustar `lib/conversion-content/index.ts`;
  - ajustar `package.json`;
  - ajustar somente este plano-base para registrar execução.
- Critérios de aceite:
  - matriz completa aprovada;
  - primeiro catálogo concreto contém somente campos admitidos pela seção 2.2;
  - taxon de médio padrão resolve por herança sem camada própria;
  - planos não produzem diferenças artificiais;
  - especializações são explícitas e restritivas;
  - `paid_search_keyword_map` permanece opcional;
  - resultado preserva proveniência e sinal de validade;
  - nenhuma pesquisa da E10 é copiada para o catálogo;
  - nenhum valor operacional ou snapshot é persistido;
  - nenhuma tabela, migration, rota, UI, API, adapter de banco, E20.3 ou E19.4 é criada ou alterada;
  - diff limitado aos artefatos previstos e a este plano-base.
- Próxima ação após consolidação do plano-base v2 e merge humano:
  - enviar o plano completo ao Executor, autorizando somente esta fase.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Coleta, edição ou persistência de valores da conta.
- Snapshot da geração.
- Tabela, campo, view, RPC, trigger, policy, grant ou migration.
- Rota, API, Server Action, formulário, Admin Dashboard ou Account Dashboard.
- Alteração de `account_profiles` ou `account_landing_pages`.
- Parametrização, módulo, variante, composição ou renderer.
- Pesquisa `business_buyer` ou `end_customer`, itens estruturados ou resolver da E10.8.
- Geração de copy, FAQ, promessa, objeção, prova textual ou conteúdo final.
- Geração, revisão, edição, publicação ou tracking de LP.
- Diferenciação entre planos sem fonte comercial aprovada.
- Camada própria de ultranicho sem decisão humana.
- Engine de regras, expressão livre, configuração dinâmica ou banco configurável.
- IA, automação, agente, job, fila, cache, workflow ou infraestrutura nova.
- Alteração automática de `docs/roadmap.md`, `docs/base-tecnica.md` ou `docs/schema.md` durante a execução.

### 4.2. Critérios de parada

- Parar se a cadeia real de taxons divergir materialmente do recorte aprovado ou não permitir identificar segmento, nicho e ultranicho de forma única.
- Parar antes de criar ou alterar taxon.
- Parar se algum campo proposto não possuir consumidor real previsto na E19.4.
- Parar se um candidato duplicar resultado da E10, parâmetro da E18, composição ou conteúdo produzido.
- Parar se o contrato exigir relaxamento silencioso de campo herdado.
- Parar se a solução repo-only não puder garantir versão, herança, proveniência e falha fechada.
- Parar antes de propor persistência, adapter de banco, rota, UI ou configuração dinâmica.
- Parar se surgir necessidade de diferenciar planos sem decisão comercial explícita.
- Parar se a implementação exigir alterar E10.8, E18.4, E18.5, E20.3 ou E19.4.
- Parar se houver necessidade de campo novo não previsto na seção 2.10; devolver ao Estrategista com evidência e consumidor.

### 4.3. Decisão ao fim da fase

- Registrar somente uma decisão: avançar, ajustar, bloquear ou encerrar.
- Como existe uma única fase executável, aprovação integral encerra a E20.2 e habilita o relatório final ao Gestor de Docs.

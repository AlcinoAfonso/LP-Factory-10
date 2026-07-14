14/07/2026 — Plano-base E20.2 — Catálogo de entradas por taxon

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lp-planejamento.md`, `docs/lousa-plano-base-e10-8.md`, `docs/supa-up.md`, `docs/prod-up.md`, contratos atuais de planos, contas, taxons e landing pages, `Pesquisa bruta para corretor de imóveis de médio padrão.pdf`, `Projeto Piloto Imobiliário.pdf`, avaliações do Analista, do Gestor Estrutural e do Gestor de Updates e decisões humanas de 14/07/2026.

- Versão: v2.
- Status: plano-base v2 consolidado no PR #573; merge humano pendente; Executor não autorizado.
- Recorte previsto para roadmap: `20.2 — Catálogo de entradas por taxon`.
- Path canônico: `docs/lousa-plano-base-e20-2.md`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- O projeto ainda não possui um contrato canônico que declare quais dados uma conta, negócio, oferta, campanha ou LP pode ou deve fornecer para a geração de `landing_page`.
- O recorte define o `lp_generation_input_catalog` sem confundi-lo com parametrização, módulos, variantes, composição, pesquisas da E10, conteúdo produzido ou LP final.
- O resultado esperado é uma fonte declarativa versionada, resolvida por `taxon + plano`, com primeiro catálogo concreto validado no recorte imobiliário.
- O catálogo aplicável integra os critérios futuros de prontidão do taxon, sem avaliar nesta etapa se uma conta concreta já forneceu os valores.

### 1.2. Estado real confirmado

- A E18.4 possui parametrização raiz repo-only e versionada para `landing_page`.
- A E18.5 permanece responsável por módulos e variantes e não é dependência para definir entradas operacionais da E20.2.
- A E10.8 possui boundary próprio para resolver pesquisas estruturadas; a E20.2 não reimplementa sua precedência.
- `account_profiles` contém apenas dados mínimos de perfil e não representa o catálogo completo de geração.
- `account_landing_pages` contém apenas identidade mínima da LP e status inicial `draft`.
- Os planos comerciais confirmados são `starter`, `lite`, `pro` e `ultra`.
- Não existe fonte aprovada que determine campos diferentes entre os quatro planos na v1 do catálogo.
- Não foi demonstrada necessidade de tabela, campo, view, RPC, migration, rota, UI, API, configuração dinâmica ou persistência nova.
- A E20 ainda não está materializada em `docs/roadmap.md`; `docs/lp-planejamento.md` é a decisão conceitual obrigatória deste recorte.

### 1.3. Função das fontes empíricas

- `Pesquisa bruta para corretor de imóveis de médio padrão.pdf` é a fonte empírica principal para levantar candidatos.
- `Projeto Piloto Imobiliário.pdf` é fonte contextual complementar para comprovar o uso real de páginas, formulários, WhatsApp, e-mail, campanhas por imóvel ou região, qualificação e processo comercial.
- As fontes PDF não são contratos técnicos nem entram automaticamente no catálogo.
- A evidência necessária para execução está resumida por `field_key` neste plano e deverá ser preservada no registry, sem copiar conteúdo sensível.
- Cada candidato passa pela barreira de admissão da seção 2.2.

### 1.4. Decisões fixas do debate

- Separar obrigatoriamente:
  - definição declarativa dos campos;
  - valores operacionais fornecidos pela conta, negócio, oferta, campanha ou LP;
  - snapshot dos valores efetivamente usados em uma geração.
- A E20.2 implementa somente a definição declarativa.
- Valores operacionais e snapshot pertencem ao futuro plano da E19.4.
- A fonte canônica inicial será versionada no repositório.
- A resolução seguirá `universal → segmento → nicho → ultranicho`.
- Taxon de ultranicho pode herdar normalmente sem camada própria.
- Somente a criação ou utilização de camada específica de ultranicho depende de autorização humana registrada.
- O primeiro catálogo não terá camada própria de ultranicho para `corretor de imóveis de médio padrão`.
- Todos os campos v1 serão aplicáveis igualmente a `starter`, `lite`, `pro` e `ultra`.
- Restrição futura por plano exige decisão comercial explícita e nova versão.
- `paid_search_keyword_map` permanece opcional e só é aplicável quando a origem de tráfego for busca paga.
- A v1 real não contém especialização de campo entre camadas; o contrato suporta somente especializações determinísticas para evolução e fixtures.
- Automação, agente, job, workflow ou rotina recorrente não se aplicam.

### 1.5. Limites de responsabilidade

- A E10.8 resolve pesquisas e proveniência; não define entradas da conta.
- A E18 define parametrizações, módulos e variantes; não define valores operacionais do negócio.
- A E20.2 define catálogo declarativo e resolve sua aplicabilidade; não coleta valores.
- A E20.3 combina a validade do catálogo com os demais critérios de prontidão do taxon.
- A E19.4 valida separadamente a completude dos valores exigidos para cada geração, gera a LP e preserva snapshot.
- A E12 poderá conferir o resultado em superfície administrativa futura, mas não será fonte do contrato.
- O plano informado ao resolver é uma entrada já determinada pelo fluxo comercial responsável.
- A E20.2 não concede entitlement, não autoriza conta de teste, não valida assinatura e não libera geração.

### 1.6. Consolidação dos especialistas

- Aceitos:
  - incluir origem esperada do valor no modelo declarativo;
  - fechar valores permitidos para origem, tipos e validações;
  - registrar validação e evidência resumida para cada campo concreto;
  - separar os destinos de conversão por canal;
  - limitar especialização v1 a propriedades comparáveis deterministicamente;
  - mover `transaction_intent`, `financing_support_available` e `document_support_available` para o nicho `corretor de imóveis`;
  - separar explicitamente prontidão de taxon na E20.3 e completude de valores na E19.4;
  - definir ordenação determinística;
  - incorporar `supa#40` como snippet read-only versionado para comprovar a cadeia taxonômica;
  - incorporar `prod#19` como trava entre aplicabilidade declarativa por plano e entitlement comercial;
  - preservar evidência resumida no plano e no registry.
- Já cobertos:
  - boundary repo-only;
  - ausência de banco, rota, UI e adapter;
  - herança sem camada própria de ultranicho;
  - equivalência funcional entre planos na v1;
  - `paid_search_keyword_map` opcional;
  - única fase material e `Automação: não`.
- Rejeitados:
  - comparador genérico de regex, formatos textuais ou expressões livres;
  - transformação automática da pesquisa em campos;
  - uso do plano do catálogo como autorização comercial;
  - consulta de Stripe, assinatura, grants ou Supabase pelo resolver puro;
  - duplicação da herança do catálogo no snippet SQL.
- Pendentes: nenhum ponto de contrato para consolidação da v2.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - E20.3 ou futuro consumidor solicita o catálogo aplicável a um taxon e plano.
- Entrada:
  - versão do catálogo;
  - plano entre `starter`, `lite`, `pro` e `ultra`;
  - cadeia normalizada e ativa do taxon atendido, preservando identidade, slug, nível e ancestrais aplicáveis;
  - autorização de camada própria de ultranicho, somente quando existir.
- Processamento:
  - validar versão, plano e cadeia taxonômica;
  - carregar a definição universal;
  - aplicar as camadas existentes de segmento e nicho;
  - aplicar camada de ultranicho somente quando existir e estiver autorizada;
  - acrescentar campos novos;
  - aplicar especializações permitidas pelo mesmo `field_key`;
  - preservar proveniência das definições e propriedades;
  - ordenar deterministicamente;
  - produzir catálogo resolvido sem valores operacionais.
- Validação:
  - aplicar invariantes, condições, tipos, validações, especializações, planos, evidência, snapshot e matriz de casos.
- Persistência:
  - somente definição declarativa versionada no repositório.
- Consumo:
  - E20.3 recebe validade e catálogo resolvido;
  - E19.4 futuramente recebe o contrato para coleta, validação de valores, geração e snapshot.
- Fallback:
  - ausência de camada própria de nicho ou ultranicho mantém a herança válida;
  - camada existente inválida ou conflitante bloqueia a resolução;
  - não gerar campos por IA, não inferir valores ausentes e não corrigir catálogo inválido silenciosamente.

### 2.2. Barreira de admissão dos campos

Cada campo candidato deve demonstrar cumulativamente que:

- o valor será fornecido ou confirmado pela conta, negócio atendido, oferta, campanha ou LP;
- existe consumidor real previsto na futura E19.4;
- não é resultado das pesquisas estruturadas resolvidas pela E10.8;
- não é parâmetro da E18;
- não define módulo, variante ou composição;
- não é copy, promessa, dor, objeção, FAQ, vocabulário ou conteúdo já produzido;
- não duplica outro campo herdado com a mesma finalidade;
- possui origem esperada, tipo, validação, obrigação, relação com plano, política de snapshot e evidência definidos.

Dores, objeções, medos, vocabulário, FAQ, diretrizes de copy e ordem de seções não entram no catálogo.

### 2.3. Modelo declarativo mínimo

Cada definição de campo deve possuir:

- `field_key` estável e único na cadeia resolvida;
- finalidade semântica objetiva;
- camada de origem: `universal`, `segment`, `niche` ou `ultra_niche`;
- identidade do taxon de origem quando não universal;
- `value_type`;
- `value_scope`;
- `expected_value_origin`;
- obrigação: `required`, `optional` ou `conditional`;
- `required_when`, somente quando a obrigação for condicional;
- `applicable_when`, quando o campo só puder ser apresentado em determinado contexto;
- validação declarativa compatível com o tipo;
- `allowed_plans`;
- política de snapshot;
- resumo de evidência;
- referências de evidência;
- versão em que a definição foi criada.

Valores permitidos para `value_scope`:

- `account`;
- `business`;
- `offer`;
- `campaign`;
- `landing_page`.

Valores permitidos para `expected_value_origin`:

- `account_provided`;
- `business_provided`;
- `offer_provided`;
- `campaign_provided`;
- `landing_page_provided`.

Esses valores indicam origem conceitual e não pressupõem tabela, coluna, endpoint ou formato de persistência.

Política de snapshot v1:

- `include_if_used`.

Referências de evidência permitidas na v1:

- `decision:lp-planning`;
- `decision:e20-2-human`;
- `technical:current-contracts`;
- `empirical:real-estate-research`;
- `context:real-estate-pilot`.

O registry deve armazenar resumo suficiente para rastrear a admissão de cada campo sem depender de acesso aos PDFs durante runtime.

### 2.4. Tipos e validações v1

Tipos permitidos:

- `string`;
- `phone`;
- `email`;
- `url`;
- `enum`;
- `string_list`;
- `boolean`;
- `number_range`;
- `keyword_map`.

Validações-base:

- `string`:
  - texto normalizado, sem apenas espaços e com pelo menos um caractere;
  - sem validação adicional quando o campo declarar `type_only`.
- `phone`:
  - valor canônico em formato E.164, com `+` e de 8 a 15 dígitos;
  - não aceitar texto livre, ramal ou URL.
- `email`:
  - endereço de e-mail sintaticamente válido após normalização;
  - não aceitar múltiplos endereços no mesmo valor.
- `url`:
  - URL absoluta `https`;
  - não aceitar URL relativa, `javascript:`, `data:` ou protocolo diferente.
- `enum`:
  - valor pertencente ao conjunto fechado declarado pelo campo.
- `string_list`:
  - lista de textos não vazios, normalizados e sem duplicidade após comparação case-insensitive;
  - quando não houver limites adicionais, declarar `type_only`.
- `boolean`:
  - somente `true` ou `false`.
- `number_range`:
  - limite mínimo e máximo finitos e não negativos;
  - mínimo menor ou igual ao máximo;
  - moeda `BRL` no primeiro catálogo imobiliário.
- `keyword_map`:
  - lista não vazia quando fornecida;
  - cada item contém `keyword_or_cluster` não vazio e `message_anchor` não vazio;
  - `ad_context` é opcional, mas não pode ser vazio quando presente;
  - `keyword_or_cluster` não pode se repetir após normalização case-insensitive.

Condições v1:

- referenciam exatamente um `field_key` existente;
- operadores permitidos: `equals` e `in`;
- o valor comparado deve ser compatível com o tipo do campo referenciado;
- não haverá expressão livre, código executável, árvore arbitrária ou engine de regras;
- condição não pode referenciar o próprio campo;
- referências circulares, ausentes ou incompatíveis bloqueiam a resolução.

### 2.5. Especialização entre camadas

Propriedades imutáveis para o mesmo `field_key`:

- identidade;
- finalidade semântica;
- `value_type`;
- `value_scope`;
- `expected_value_origin`;
- condições `required_when` e `applicable_when`;
- política de snapshot;
- versão de criação;
- referências e resumo de evidência.

Propriedades especializáveis na v1:

- obrigação;
- `allowed_plans`;
- conjunto permitido de um `enum`;
- `min_items` e `max_items` de `string_list`, quando declarados;
- limites mínimo e máximo de `number_range`, quando declarados.

Comparadores determinísticos:

- obrigação:
  - `optional → conditional`;
  - `optional → required`;
  - `conditional → required`;
  - qualquer relaxamento falha.
- planos:
  - o conjunto especializado deve ser subconjunto não vazio do conjunto herdado.
- enum:
  - o conjunto especializado deve ser subconjunto não vazio do conjunto herdado.
- `string_list`:
  - `min_items` pode aumentar;
  - `max_items` pode diminuir;
  - o resultado deve preservar `min_items <= max_items`.
- `number_range`:
  - mínimo permitido pode aumentar;
  - máximo permitido pode diminuir;
  - o resultado deve preservar mínimo menor ou igual ao máximo.

Limites:

- condição não pode ser alterada por especialização na v1;
- formato, regex, texto livre ou validação customizada não podem ser especializados;
- campo herdado não pode ser removido ou desativado;
- propriedades não sobrescritas permanecem herdadas;
- campo novo é permitido em camada inferior;
- especialização inválida bloqueia a resolução;
- o catálogo concreto v1 não usa especialização real; o suporte existe para evolução controlada e casos de validação.

### 2.6. Herança, precedência, ordenação e ultranicho

- Ordem de resolução:
  - universal;
  - segmento;
  - nicho;
  - ultranicho autorizado.
- Campos universais permanecem na ordem em que aparecem no registry universal.
- Novos campos de segmento são acrescentados ao final, na ordem do registry da camada.
- Novos campos de nicho são acrescentados depois dos campos de segmento, na ordem do registry da camada.
- Novos campos de ultranicho autorizado são acrescentados ao final, na ordem do registry da camada.
- Especialização preserva a posição original do campo herdado.
- Não ordenar alfabeticamente nem por `field_key`.
- Duplicidade de `field_key` sem especialização válida bloqueia a resolução.
- Ausência de camada inferior não é erro.
- Taxon de ultranicho sem camada própria recebe o catálogo herdado.
- Falha somente quando existir ou for solicitada camada específica de ultranicho sem autorização humana registrada.
- A primeira versão deve resolver `corretor-de-imoveis-de-medio-padrao` sem camada própria.
- A identidade e os slugs reais da cadeia serão confirmados por inspeção read-only antes do registry.
- A fase não cria, renomeia, ativa, desativa ou religa taxon.

### 2.7. Relação com planos e entitlement

- O resolver exige um plano conhecido para produzir contrato estável de consumo.
- Na v1, todos os campos efetivos declaram `starter`, `lite`, `pro` e `ultra`.
- O resultado para o mesmo taxon é funcionalmente equivalente nos quatro planos.
- A equivalência do catálogo não significa igualdade comercial entre os planos.
- Os planos declarados no catálogo representam somente aplicabilidade contratual dos campos.
- Eles não concedem entitlement, não autorizam conta de teste, não liberam geração e não substituem E9 ou `public.account_commercial_entitlements`.
- O consumidor fornece um plano previamente determinado pelo fluxo comercial responsável.
- O resolver não consulta Stripe, assinatura, grants, `account_commercial_entitlements` ou banco.
- `prod#19` é apenas referência e trava de responsabilidade.
- Redução futura de campos por plano exige decisão comercial, nova versão do catálogo e plano-base próprio quando material.

### 2.8. Separação dos valores futuros e snapshot

O valor futuro se vinculará conceitualmente a:

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
- todos os campos v1 usam `include_if_used`;
- valor não usado na geração não entra artificialmente no snapshot.

### 2.9. `paid_search_keyword_map`

- Camada: universal.
- Tipo: `keyword_map`.
- Escopo: `campaign`.
- Origem esperada: `campaign_provided`.
- Obrigação: `optional`.
- Aplicabilidade: `traffic_source equals paid_search`.
- Validação: regras de `keyword_map` da seção 2.4.
- Planos: os quatro.
- Snapshot: `include_if_used`.
- Evidência:
  - `docs/lp-planejamento.md` autoriza mapa opcional para message match;
  - a pesquisa imobiliária confirma demanda orientada por localização, tipologia e intenção de busca.
- Referências:
  - `decision:lp-planning`;
  - `empirical:real-estate-research`.
- Finalidade:
  - alinhar termo ou cluster de busca, contexto do anúncio e âncora factual de mensagem;
  - sustentar message match sem substituir E10.
- Restrições:
  - não autoriza keyword stuffing;
  - não produz copy;
  - não permite termo incompatível com oferta real;
  - não é obrigatório mesmo com busca paga.

### 2.10. Primeiro catálogo concreto v1

#### 2.10.1. Políticas comuns

- Todos os campos:
  - são criados na versão 1;
  - permitem os quatro planos;
  - usam snapshot `include_if_used`;
  - possuem consumidor futuro E19.4;
  - não definem estrutura, copy ou composição.
- Quando a validação declarar `type_only`, nenhuma regra adicional além da validação-base do tipo pode ser inventada.
- As evidências abaixo são suficientes para implementação do registry; os PDFs permanecem fontes empíricas externas, não dependências de runtime.

#### 2.10.2. Camada universal

- `business_display_name`:
  - tipo `string`;
  - escopo `business`;
  - origem `business_provided`;
  - obrigação `required`;
  - validação: texto normalizado não vazio; sem limite adicional;
  - evidência: toda LP precisa identificar factual e publicamente o negócio ou profissional atendido;
  - referências: `decision:lp-planning`, `technical:current-contracts`.
- `funnel_stage`:
  - tipo `enum` com `bofu`, `mofu` e `tofu`;
  - escopo `landing_page`;
  - origem `landing_page_provided`;
  - obrigação `required`;
  - validação: conjunto fechado declarado;
  - evidência: `docs/lp-planejamento.md` define BOFU, MOFU e TOFU como intenção informada para a LP, separada do canal;
  - referência: `decision:lp-planning`.
- `traffic_source`:
  - tipo `enum` com `paid_search`, `paid_social`, `organic`, `whatsapp`, `qr_code` e `other`;
  - escopo `campaign`;
  - origem `campaign_provided`;
  - obrigação `optional`;
  - validação: conjunto fechado declarado;
  - evidência: `docs/lp-planejamento.md` separa origem de tráfego da intenção da LP;
  - referência: `decision:lp-planning`.
- `primary_conversion_channel`:
  - tipo `enum` com `whatsapp`, `form`, `phone`, `email` e `external_url`;
  - escopo `landing_page`;
  - origem `landing_page_provided`;
  - obrigação `required`;
  - validação: conjunto fechado declarado;
  - evidência: pesquisa e piloto comprovam conversão por WhatsApp, formulários e e-mail; telefone e URL externa permanecem destinos operacionais explícitos aprovados no debate;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`, `decision:e20-2-human`.
- `whatsapp_destination`:
  - tipo `phone`;
  - escopo `landing_page`;
  - origem `landing_page_provided`;
  - obrigação `conditional`;
  - `required_when` e `applicable_when`: `primary_conversion_channel equals whatsapp`;
  - validação: E.164;
  - evidência: WhatsApp é CTA recorrente na pesquisa e canal real do piloto;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`.
- `phone_destination`:
  - tipo `phone`;
  - escopo `landing_page`;
  - origem `landing_page_provided`;
  - obrigação `conditional`;
  - `required_when` e `applicable_when`: `primary_conversion_channel equals phone`;
  - validação: E.164;
  - evidência: destino telefônico foi mantido como canal operacional explícito no contrato aprovado;
  - referência: `decision:e20-2-human`.
- `email_destination`:
  - tipo `email`;
  - escopo `landing_page`;
  - origem `landing_page_provided`;
  - obrigação `conditional`;
  - `required_when` e `applicable_when`: `primary_conversion_channel equals email`;
  - validação: e-mail único válido;
  - evidência: e-mail é canal previsto no produto e no piloto;
  - referências: `technical:current-contracts`, `context:real-estate-pilot`.
- `external_url_destination`:
  - tipo `url`;
  - escopo `landing_page`;
  - origem `landing_page_provided`;
  - obrigação `conditional`;
  - `required_when` e `applicable_when`: `primary_conversion_channel equals external_url`;
  - validação: URL absoluta `https`;
  - evidência: URL externa foi mantida como destino operacional explícito no contrato aprovado;
  - referência: `decision:e20-2-human`.
- `privacy_policy_url`:
  - tipo `url`;
  - escopo `business`;
  - origem `business_provided`;
  - obrigação `conditional`;
  - `required_when` e `applicable_when`: `primary_conversion_channel equals form`;
  - validação: URL absoluta `https`;
  - evidência: pesquisa observa política e consentimento quando existe formulário;
  - referência: `empirical:real-estate-research`.
- `paid_search_keyword_map`:
  - contrato definido na seção 2.9.

#### 2.10.3. Camada do segmento imobiliário

- `service_locations`:
  - tipo `string_list`;
  - escopo `business`;
  - origem `business_provided`;
  - obrigação `required`;
  - validação: lista única e não vazia; sem quantidade máxima ou mínima adicional;
  - evidência: pesquisa identifica jornada e descoberta orientadas por cidade, bairro e região; piloto prevê campanhas e atuação por região;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`.
- `property_types`:
  - tipo `string_list`;
  - escopo `offer`;
  - origem `offer_provided`;
  - obrigação `optional`;
  - validação: lista única e não vazia quando fornecida; sem allowlist global;
  - evidência: portais e pesquisa estruturam descoberta por tipologia; a lista real depende da oferta;
  - referência: `empirical:real-estate-research`.
- `property_price_range`:
  - tipo `number_range`;
  - escopo `offer`;
  - origem `offer_provided`;
  - obrigação `optional`;
  - validação: faixa não negativa, ordenada e em BRL;
  - evidência: faixa de preço e capacidade financeira aparecem como filtros e insumos recorrentes;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`.
- `property_stage`:
  - tipo `enum` com `launch`, `under_construction`, `ready`, `used` e `mixed`;
  - escopo `offer`;
  - origem `offer_provided`;
  - obrigação `optional`;
  - validação: conjunto fechado declarado;
  - evidência: pesquisa e piloto distinguem lançamentos, imóveis em construção, prontos e usados como estado real da oferta;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`.

#### 2.10.4. Camada do nicho corretor de imóveis

- `transaction_intent`:
  - tipo `enum` com `buy`, `sell`, `valuation` e `mixed`;
  - escopo `landing_page`;
  - origem `landing_page_provided`;
  - obrigação `required`;
  - validação: conjunto fechado declarado;
  - evidência: pesquisa diferencia LP de compra, venda/captação, avaliação e fluxo híbrido no contexto do corretor;
  - referência: `empirical:real-estate-research`.
- `financing_support_available`:
  - tipo `boolean`;
  - escopo `business`;
  - origem `business_provided`;
  - obrigação `optional`;
  - validação: tipo somente;
  - evidência: pesquisa e piloto mostram financiamento como serviço e apoio possível do corretor, não como propriedade universal do segmento;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`.
- `document_support_available`:
  - tipo `boolean`;
  - escopo `business`;
  - origem `business_provided`;
  - obrigação `optional`;
  - validação: tipo somente;
  - evidência: pesquisa e piloto mostram orientação documental como apoio possível do corretor;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`.
- `creci_registration`:
  - tipo `string`;
  - escopo `business`;
  - origem `business_provided`;
  - obrigação `required`;
  - validação: texto normalizado não vazio; sem regex regional inventada;
  - regra adicional: a E19.4 deverá exigir confirmação por fonte oficial antes de usar a credencial como prova;
  - evidência: pesquisa identifica CRECI como credencial verificável e o piloto trata a atuação profissional da corretora;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`.
- `attendance_modes`:
  - tipo `string_list` com valores permitidos `in_person` e `remote`;
  - escopo `business`;
  - origem `business_provided`;
  - obrigação `optional`;
  - validação: subconjunto não vazio e sem duplicidade quando fornecido;
  - evidência: o processo comercial do corretor pode combinar atendimento presencial e remoto;
  - referências: `empirical:real-estate-research`, `context:real-estate-pilot`.

#### 2.10.5. Camada do ultranicho corretor de imóveis de médio padrão

- Nenhum campo próprio na v1.
- O taxon herda integralmente universal, segmento e nicho.
- Faixa de preço, tipologia e estágio já são entradas do segmento e não justificam camada própria.
- Necessidade futura específica depende de evidência, consumidor real e autorização humana.

### 2.11. Critério de prontidão do catálogo

O resultado da E20.2 é catálogo válido quando:

- a versão existe e é única;
- o plano é conhecido;
- a cadeia taxonômica é coerente e ativa;
- toda camada aplicada é válida;
- camada própria de ultranicho, quando existir, possui autorização;
- cada campo possui todas as propriedades obrigatórias;
- não há duplicidade sem especialização válida;
- não há mudança de propriedade imutável;
- especializações respeitam os comparadores da seção 2.5;
- condições apontam para campos existentes, são compatíveis e não circulares;
- tipos e validações são coerentes;
- todos os campos possuem origem, evidência e política de snapshot;
- `paid_search_keyword_map` respeita aplicabilidade e validação;
- proveniência e ordem determinística são preservadas.

A E20.3 combina essa validade com os demais critérios de prontidão do taxon. A E19.4 valida separadamente a completude dos valores exigidos para cada geração.

### 2.12. Resultado tipado

O sucesso preserva, no mínimo:

- versão;
- taxon atendido;
- plano recebido;
- cadeia de camadas utilizada;
- campos efetivos em ordem determinística;
- definição efetiva de cada campo;
- camada e taxon de origem;
- propriedades especializadas e sua proveniência;
- resumo e referências de evidência;
- sinal de catálogo válido.

A falha distingue, no mínimo:

- versão inválida ou ausente;
- plano inválido;
- cadeia taxonômica inválida;
- camada inválida;
- camada própria de ultranicho sem autorização;
- campo duplicado sem especialização válida;
- conflito em propriedade imutável;
- especialização não comparável ou que amplia contrato;
- condição inválida, ausente, incompatível ou circular;
- validação incompatível com o tipo;
- evidência ou origem ausente;
- contrato do `paid_search_keyword_map` inválido.

Nenhum resultado contém valores reais, assinatura, entitlement ou snapshot de geração.

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
  - ajustar `lib/conversion-content/index.ts` com namespace `landingPageInputCatalog`.
- Script:
  - adicionar `validate:landing-page-input-catalog` em `package.json`.
- Validação read-only versionada:
  - criar `supabase/snippets/e20_2_taxon_chain_verify.sql`.
- Não criar adapter de banco.
- O resolver recebe cadeia normalizada do consumidor e não consulta Supabase.
- Não alterar parametrização raiz da E18.4 nem boundary da E10.8.
- Não adicionar dependência.

### 2.14. Snippet de cadeia taxonômica — `supa#40`

O snippet deve:

- consultar somente `public.business_taxons`;
- usar `SELECT` ou `WITH` read-only;
- declarar o slug do taxon atendido em CTE de parâmetros claramente editável;
- retornar a cadeia até o segmento;
- mostrar `id`, `name`, `slug`, `level`, `is_active`, `parent_id` e profundidade;
- permitir comprovar identidade, nível, atividade e relações pai-filho usadas pelo registry;
- limitar o resultado à cadeia do taxon solicitado;
- ser executado antes da codificação das camadas.

O snippet não pode:

- escrever dados;
- criar ou renomear taxon;
- alterar atividade ou relação parental;
- reproduzir a herança do catálogo;
- virar dependência de runtime;
- substituir o resolver puro.

### 2.15. Matriz mínima de validação

- versão inexistente: falhar;
- plano desconhecido: falhar;
- cadeia inválida, inativa ou fora de ordem: falhar;
- universal válido sem camada específica: resolver;
- segmento e nicho válidos: combinar e ordenar;
- ultranicho sem camada própria: herdar e resolver;
- camada própria autorizada: resolver;
- camada própria não autorizada: falhar;
- campo novo em camada inferior: acrescentar ao final da camada;
- especialização válida: preservar posição e propriedades não alteradas;
- alteração de identidade, tipo, escopo, origem, condição, snapshot ou evidência: falhar;
- obrigação mais restritiva: aceitar;
- obrigação relaxada: falhar;
- enum reduzido: aceitar;
- enum ampliado: falhar;
- planos reduzidos: aceitar em fixture estrutural;
- planos ampliados: falhar;
- limites de lista ou faixa restringidos: aceitar;
- limites ampliados ou incoerentes: falhar;
- especialização textual, regex ou formato customizado: falhar;
- referência de condição ausente ou incompatível: falhar;
- condição circular: falhar;
- cada destino de conversão deve aparecer somente no canal correspondente;
- canal `form` exige `privacy_policy_url`;
- `paid_search_keyword_map` ausente com busca paga: aceitar;
- mapa presente sem busca paga: falhar;
- mapa inválido: falhar;
- mapa válido com busca paga: resolver;
- catálogo imobiliário nos quatro planos: resultado funcionalmente equivalente;
- taxon de médio padrão: ausência de camada própria e herança integral;
- saída: sem valores operacionais, entitlement ou snapshot;
- registry e resultado: profundamente imutáveis.

## 3. Fases e próxima ação

### 3.1. E20.2.3–E20.2.6 — Contrato, catálogo imobiliário v1 e resolver repo-only

- Status: planejada; bloqueada até merge humano deste plano-base v2.
- Automação: não.
- Fontes obrigatórias de execução:
  - `README.md`;
  - `AGENTS.md`;
  - `docs/prompt-executor.md`;
  - `docs/base-tecnica.md`;
  - `docs/schema.md`;
  - `docs/lp-planejamento.md`;
  - `docs/supa-up.md`, item `supa#40`;
  - `docs/prod-up.md`, item `prod#19`;
  - este plano-base v2 na `main`;
  - repositório real.
- Objetivo:
  - implementar contrato declarativo, registry v1, herança, especialização determinística, primeiro catálogo imobiliário, `paid_search_keyword_map`, resolver, snippet de verificação e sinal de validade.
- Escopo executável:
  - confirmar por inspeção read-only a cadeia real do taxon e seus slugs;
  - criar e executar o snippet da seção 2.14;
  - implementar somente os paths da seção 2.13;
  - implementar o registry exatamente com a seção 2.10;
  - manter o ultranicho sem camada própria;
  - criar validação executável para a seção 2.15;
  - garantir imutabilidade profunda e falha fechada;
  - exportar namespace e adicionar script;
  - executar `npm ci`, `npm run check` e `npm run validate:landing-page-input-catalog`;
  - registrar neste plano a evidência, decisão e próxima ação da fase.
- Artefatos previstos:
  - criar `lib/conversion-content/landing-page/input-catalog/contracts.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/registry.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/schema.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/resolver.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/validation-cases.ts`;
  - criar `lib/conversion-content/landing-page/input-catalog/index.ts`;
  - criar `supabase/snippets/e20_2_taxon_chain_verify.sql`;
  - ajustar `lib/conversion-content/index.ts`;
  - ajustar `package.json`;
  - ajustar somente este plano-base para registrar execução.
- Critérios de aceite:
  - snippet confirma a cadeia real sem escrita;
  - matriz completa aprovada;
  - cada campo concreto contém origem, validação e evidência;
  - destinos de conversão são separados e condicionais por canal;
  - segmento contém somente campos reutilizáveis no imobiliário;
  - campos próprios do corretor permanecem no nicho;
  - médio padrão resolve por herança sem camada própria;
  - planos não produzem diferenças artificiais nem autorização comercial;
  - especializações são somente as determinísticas;
  - ordenação segue a seção 2.6;
  - `paid_search_keyword_map` permanece opcional;
  - resultado preserva proveniência, evidência e validade;
  - nenhuma pesquisa da E10 é copiada;
  - nenhum valor ou snapshot é persistido;
  - nenhuma tabela, migration, rota, UI, API, adapter, Stripe, E20.3 ou E19.4 é criada ou alterada;
  - diff limitado aos artefatos previstos e a este plano.
- Próxima ação após merge humano:
  - instruir o Executor somente para esta fase.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Coleta, edição ou persistência de valores.
- Snapshot da geração.
- Tabela, campo, view, RPC, trigger, policy, grant ou migration.
- Rota, API, Server Action, formulário, Admin ou Account Dashboard.
- Alteração de `account_profiles` ou `account_landing_pages`.
- Parametrização, módulo, variante, composição ou renderer.
- Pesquisa `business_buyer` ou `end_customer`, itens estruturados ou resolver da E10.8.
- Geração de copy, FAQ, promessa, objeção, prova textual ou conteúdo final.
- Geração, revisão, publicação ou tracking de LP.
- Diferenciação entre planos sem fonte comercial aprovada.
- Entitlement, assinatura, Stripe, grants ou autorização de conta.
- Camada própria de ultranicho sem decisão humana.
- Engine de regras, expressão livre, comparador genérico, configuração dinâmica ou banco configurável.
- IA, automação, agente, job, fila, cache, workflow ou infraestrutura nova.
- Alteração automática de `docs/roadmap.md`, `docs/base-tecnica.md` ou `docs/schema.md`.

### 4.2. Critérios de parada

- Parar se a cadeia real divergir materialmente ou não identificar segmento, nicho e ultranicho de forma única.
- Parar antes de criar ou alterar taxon.
- Parar se algum campo não possuir consumidor real previsto na E19.4.
- Parar se candidato duplicar E10, E18, composição ou conteúdo.
- Parar se faltar origem, validação ou evidência para campo concreto.
- Parar se o contrato exigir condição ou validação não comparável na especialização v1.
- Parar se exigir relaxamento de campo herdado.
- Parar se a solução repo-only não garantir versão, herança, proveniência, ordenação e falha fechada.
- Parar antes de propor persistência, adapter, rota, UI ou configuração dinâmica.
- Parar se surgir diferenciação de planos sem decisão comercial.
- Parar se plano do catálogo precisar autorizar entitlement ou geração.
- Parar se implementação exigir alterar E10.8, E18.4, E18.5, E20.3 ou E19.4.
- Parar se houver necessidade de campo novo não previsto na seção 2.10; devolver ao Estrategista com evidência e consumidor.

### 4.3. Decisão ao fim da fase

- Registrar somente uma decisão: avançar, ajustar, bloquear ou encerrar.
- Como existe uma única fase executável, aprovação integral encerra a E20.2 e habilita o relatório final ao Gestor de Docs.

# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para liberar nichos e orientar ajustes do projeto até a criação de LPs.

Fontes de referência: `README.md`, `docs/roadmap.md`, `docs/prompt-estrategista.md`, `docs/prompt-nicho-itens-estruturados.md`, `docs/template-blueprint.md`, `docs/template-roadmap.md`, `docs/schema.md`, `supabase/snippets/e10_5_5_nicho_carregamento.sql`, `lib/conversion-content/adapters/commercialActivationAdapter.ts`, `lib/conversion-content/landing-page/contracts.ts`, `lib/conversion-content/contracts.ts`, Google Ads Help, Google Search Central, web.dev Web Vitals e debate em chat.

## 1. Jornada da base até as LPs publicadas

### 1.1. Resultado final esperado

- A entrega final é criar LPs testáveis e publicáveis por nicho ou ultranicho.
- Tipos/intenção de LP: BOFU, MOFU e TOFU.
- BOFU, MOFU e TOFU não são canais; o canal é `landing_page`.
- Origem de tráfego é separada do tipo da LP: Google Ads, Instagram Ads, WhatsApp, QR Code, orgânico ou outra origem.
- BOFU, MOFU e TOFU entram na geração da LP final a partir da intenção informada pelo cliente, sem exigir três composições oficiais por taxon no MVP.
- A LP usada para validação deve ser uma LP real criada pela E19 dentro de uma conta de teste autorizada, usando o mesmo fluxo destinado aos clientes.
- A conta de teste permite validar de forma integrada entrada comercial, entitlement, geração, revisão, publicação, tracking e evolução entre planos quando esses recursos existirem.
- Não deve existir um gerador administrativo paralelo de LP teste.

### 1.2. Preparar o taxon e resolver os itens estruturados

- O taxon deve estar ativo e corretamente posicionado na taxonomia `segmento → nicho → ultranicho`.
- A comunicação do projeto deve seguir essa taxonomia, sem adotar a nomenclatura paralela `setor → segmento → nicho`.
- Exemplo: `imobiliário` como segmento, `corretor de imóveis` como nicho e `corretor de imóveis de médio padrão` como ultranicho.
- Os itens estruturados devem estar completos para `end_customer` no taxon específico e para `business_buyer` próprio ou herdado do taxon pai com critério determinístico.
- Para `landing_page`, a resolução deve priorizar o `business_buyer` próprio completo e elegível; somente na sua ausência pode usar o `business_buyer` completo e elegível do taxon pai direto.
- A resolução não pode misturar blocos de fontes incompatíveis nem escolher silenciosamente entre fontes ambíguas.
- O conjunto resolvido deve preservar a origem do taxon, das pesquisas, dos `audience_scope` e das versões efetivamente usadas.
- `strategic_core`: mensagem, promessa, objeções, provas, vocabulário e CTA.
- `lp_overview`: diretrizes para a composição, incluindo tom visual, densidade, tipografia, prioridade mobile, extensão e estilo de imagem.
- `lp_sections`: seções, ordem provável, função no funil e composição conceitual.
- `seo`: intenção, vocabulário, termos, FAQ e requisitos básicos de busca.
- Os itens estruturados não precisam entregar limites de caracteres, escala tipográfica, tamanho de fonte ou parametrização técnica por campo.
- Quando houver herança de composição, conteúdo, copy, FAQ, provas, oferta e CTA devem continuar específicos do taxon atendido.

### 1.3. Definir a parametrização raiz da LP

- A parametrização raiz é a fonte da verdade inicial para papéis semânticos, regras, faixas editoriais recomendadas, limites técnicos absolutos, critérios visuais e responsivos e opções permitidas para toda a família `landing_page`.
- Parâmetro por campo significa regra para H1, H2, H3, parágrafo, CTA, eyebrow, nota de privacidade, FAQ, cards, benefícios e passos.
- A parametrização raiz versionada deve alimentar ou originar os limites usados pela geração, validação e renderização, evitando fontes independentes e valores hardcoded divergentes.
- A fonte da verdade no repositório não exige configuração dinâmica em runtime; schemas, geração e renderer podem continuar estáticos quando derivarem do mesmo contrato versionado.
- Preset de LP é uma configuração ampla do conjunto da página e não se confunde com escolhas limitadas por ocorrência de seção.
- Os nomes e valores exatos dos presets ficam para o plano-base técnico.
- A parametrização raiz deve resolver as necessidades comuns da maioria dos nichos e ultranichos.
- Necessidade fora da raiz não implica automaticamente nova variante; deve ser classificada conforme módulo, composição, entradas, conteúdo ou mudança estrutural.
- Os valores exatos dos parâmetros permanecem hipóteses até validação pela primeira LP real.

### 1.4. Definir a parametrização de módulos e variantes

- A parametrização de módulos e variantes define campos, estruturas, limites estruturais, regras de copy e especializações permitidas sobre a raiz.
- Os limites textuais comuns pertencem à parametrização raiz; módulo ou variante só pode sobrescrevê-los em caso excepcional, explícito e justificado.
- A resolução das regras segue `parametrização raiz → especialização do módulo → especialização da variante`.
- Módulos herdam a raiz e registram apenas especializações justificadas para sua função estrutural.
- Variantes herdam o módulo e registram apenas especializações reutilizáveis de execução ou comportamento dentro da mesma função estrutural.
- Nova variante só deve ser criada quando houver mudança reutilizável de comportamento ou execução; mudança da função estrutural deve ser avaliada como novo módulo.
- Diferença de taxon, conteúdo, entrada da conta ou campanha, escolha de composição ou ajuste já permitido não justifica isoladamente nova variante.
- `spacing` é escolha limitada por ocorrência de seção, não preset de LP; seus valores comuns permitidos pertencem à parametrização raiz, admitindo especialização por módulo ou variante somente quando explícita e justificada.
- A parametrização deve separar `copy_source_map` e `funnel_copy_profile`.
- O `copy_source_map` define quais `item_key` cada campo de copy consulta.
- O `funnel_copy_profile` define como os insumos podem ser transformados em copy conforme BOFU, MOFU ou TOFU, incluindo tratamentos permitidos, restritos e proibidos.
- A família `landing_page` define o `funnel_copy_profile` padrão em recorte técnico posterior à parametrização raiz.
- Módulos adaptam o `funnel_copy_profile` ao papel da seção.
- Variantes só podem restringir ou sobrescrever o perfil e o mapa quando houver mudança de comportamento comercial.
- Cada campo de copy deve consultar no máximo 2 `item_key` principais e 1 `item_key` auxiliar, salvo decisão registrada no plano-base técnico.
- Escassez, garantia, prova, comparação, preço, promessa, credencial, autoridade, urgência e oferta só podem ser usados quando houver insumo real que sustente esse tratamento.
- Variante nova deve começar como candidata ou experimental até aprovação por LP real avaliada humanamente.
- Variante depreciada não deve entrar em novas gerações, mas LPs existentes continuam renderizando com a variante e versão usadas.
- Variante antiga só pode ser retirada quando não houver artefato publicado dependente ou quando houver plano de migração aprovado.

### 1.5. Definir o catálogo de entradas para geração da LP

- O catálogo não parametriza o comportamento da LP; ele define quais entradas da conta, negócio atendido, oferta, campanha ou LP podem ser apresentadas e utilizadas na geração.
- A camada geral reúne entradas aplicáveis a todos os segmentos.
- A camada específica reúne campos próprios de um segmento ou nicho, conforme o nível adequado de reutilização.
- A camada de ultranicho só deve existir excepcionalmente e por decisão humana quando segmento e nicho não forem suficientes.
- O `lp_generation_input_catalog` define campos disponíveis, obrigatórios, opcionais e condicionantes, com herança `universal → segmento → nicho → ultranicho`.
- O catálogo informa as entradas disponíveis para a geração da LP final, mas não determina automaticamente a estrutura da composição base do taxon.
- O `paid_search_keyword_map` é uma entrada opcional para alinhar busca paga, anúncio e LP quando aplicável; não substitui os itens estruturados nem autoriza alteração dos contratos parametrizados.
- A fonte canônica inicial do catálogo deve ser versionada no repositório.
- O catálogo aplicável integra os critérios de prontidão para autorizar uma conta de teste a usar determinado taxon e plano.
- A conta de teste deve fornecer valores reais ou controlados pelos mesmos campos que serão apresentados posteriormente aos clientes.
- Os valores informados pela conta, negócio atendido, oferta, campanha ou LP são dados operacionais e devem ser persistidos no BD, mas o local e o formato dependem de plano-base técnico.

### 1.6. Criar e aprovar a composição base do taxon

- A estrutura padrão permanece módulo + variante.
- A composição base do taxon não é a LP final; ela é o ponto de partida governado para gerar LPs concretas.
- A composição pode ser aprovada para segmento ou nicho. Composição própria de ultranicho deve ser excepcional e depender de decisão humana quando a composição herdável não atender.
- A IA propõe a composição a partir das duas parametrizações e do conjunto de itens estruturados resolvido pela E10.
- A composição registra módulos, variantes, ordem, obrigatoriedade e escolhas permitidas para o conjunto e para cada ocorrência.
- Essas escolhas são resultado da composição, não novas parametrizações.
- A composição seleciona somente opções permitidas pela resolução `parametrização raiz → módulo → variante`.
- O catálogo de entradas e as entradas particulares da conta, negócio atendido, oferta, campanha ou LP não determinam automaticamente sua estrutura.
- Composição aprovada no taxon pai é presumida herdável para taxons filhos, salvo marcação contrária.
- O taxon filho só herda a composição do taxon pai quando não houver composição própria aprovada.
- A herança não se aplica quando houver composição própria, módulo ou variante específica, restrição regulatória, falha técnica, editorial ou visual, ou marcação de não herança.
- Composição própria de ultranicho só deve ser criada quando a composição herdável não atender por estrutura, jornada, regulação, prova, oferta, formulário, qualificação ou resultado da validação real.
- Gap essencial de módulo ou variante impede a aprovação para teste até sua criação e parametrização.
- Taxon, conjunto de itens estruturados resolvido, parametrizações, catálogo aplicável, composição candidata e regra de herança formam o checklist mínimo de prontidão para teste.
- A aprovação da composição para teste não equivale à liberação geral do taxon e do plano para clientes.
- Com essas regras, o Critério 3 fica fechado em planejamento; a implementação depende de plano-base próprio.

### 1.7. Autorizar a conta de teste e gerar a primeira LP real

- A autorização para teste é uma decisão humana anterior à geração e deve vincular uma conta, um taxon e um plano.
- A conta de teste permanece uma conta normal; a autorização não cria novo tipo nem novo status de conta.
- Outros taxons ou planos exigem autorizações próprias.
- A autorização só pode ocorrer após a confirmação do checklist de prontidão do taxon.
- A conta de teste deve resolver seu taxon pelo fluxo aplicável da E10 e possuir entitlement comercial válido da E9 pelo mecanismo efetivamente disponível.
- A autorização específica de teste não substitui o gate comercial da E9 nem os requisitos operacionais de conta e membership.
- A E19 gera uma LP normal pertencente à conta de teste, sem entidade, persistência ou gerador administrativo paralelo.
- A LP usa a composição base aplicável, o conjunto de itens estruturados resolvido pela E10, os valores fornecidos pela conta e a intenção ou funil informado.
- A geração pode adaptar copy, CTA, prova, FAQ, formulário, densidade e ordem permitida, sem alterar schema, renderer, módulos, variantes ou opções fora dos contratos aprovados.
- A geração não pode alterar o contrato parametrizado ao aplicar entradas, intenção, funil ou palavras-chave opcionais.
- A mesma LP deve seguir o fluxo real de revisão, edição controlada, publicação e tracking disponível para clientes.
- O snapshot deve preservar valores, fontes dos itens estruturados, composição, variantes, parametrizações, plano e versões usados.

### 1.8. Validar a LP real e liberar o taxon e o plano

- A validação ocorre por plano de liberação: `starter`, `lite`, `pro` e `ultra`.
- `starter` exige pelo menos 1 LP real de conta de teste validada, com intenção ou funil definido e conteúdo específico do taxon testado.
- A avaliação humana deve ocorrer no Admin Dashboard sobre a LP produzida pela E19, sem regeneração por fluxo administrativo próprio.
- A validação inclui critérios técnicos, visuais, editoriais, responsivos, de conversão mínima, publicação, integridade do tracking aplicável e performance de carregamento.
- Performance real de campanha, volume de tráfego, conversão real e Core Web Vitals de campo não são requisitos desta etapa.
- A validação de carregamento deve prevenir regressões em LCP, estabilidade visual, bloqueio de interação, peso de imagens, embeds, JavaScript excessivo, layout shift e fallback lento.
- A decisão deve registrar taxon, plano, conta de teste, LP usada como evidência, fontes dos itens estruturados, composição, versões das parametrizações, responsável, momento e resultado.
- Uma LP aprovada no taxon proprietário da composição base pode liberar o plano para os taxons descendentes que usem a mesma composição herdável.
- Uma LP aprovada em taxon descendente que use composição herdada também pode validar essa composição para o taxon proprietário e para os demais descendentes que usem a mesma versão.
- A aprovação para `starter` não libera automaticamente `lite`, `pro` ou `ultra`.
- Mudança material em parametrização, módulo, variante, composição, catálogo ou capacidade do plano pode exigir nova validação humana.

### 1.9. Gerar, revisar e publicar as LPs das contas

- Contas de teste, contas piloto, contas consultivas e clientes usam o mesmo fluxo da E19.
- A E19 exige uma das seguintes condições: autorização específica de teste para a conta, taxon e plano; ou liberação geral vigente para o taxon e plano.
- Antes da liberação geral, somente contas de teste com autorização específica podem gerar LPs para o taxon e plano ainda em validação.
- Depois da liberação, contas comuns elegíveis passam a usar a mesma composição, o mesmo catálogo e o mesmo fluxo produtivo.
- A LP da conta usa a composição aprovada, o conjunto de itens estruturados resolvido pela E10, os valores reais fornecidos nas entradas previstas pelo catálogo e a intenção ou funil informado.
- A geração mantém os mesmos limites de schema, renderer, módulos, variantes e tratamentos comerciais sustentados por dados reais.
- Cada LP deve preservar snapshot dos valores, fontes dos itens estruturados, composição, variantes, parametrizações, plano e versões usados.
- O fluxo produtivo deve permitir revisão, edição controlada, publicação e tracking conforme os planos-base próprios, sem criar uma segunda implementação para clientes.
- Editor visual e nova infraestrutura permanecem fora até decisão e plano-base próprios.

### 1.10. Evoluir a base com as LPs validadas

- LPs de contas de teste, pilotos e clientes podem revelar ajustes necessários na parametrização raiz, módulos, variantes, catálogo de entradas, composição ou critérios editoriais.
- Mudanças devem ser reutilizáveis e passar por plano-base próprio; ajustes soltos por taxon devem ser evitados.
- O Benchmark Blueprint é complementar e opcional após a validação da LP real, sem bloquear a liberação.
- A comparação pode avaliar clareza, estrutura, copy, adequação ao taxon, visual, CTA, prova, conversão esperada, lacunas e riscos.
- O Blueprint não altera automaticamente banco, composição, renderer, schema, módulo, variante ou artefato final.
- Dados de contas de teste devem ser identificáveis para diagnóstico e não devem contaminar indicadores comerciais reais quando tracking e relatórios forem implementados.

## 2. O que precisa ser ajustado ou implementado no projeto

### 2.1. Preparação do taxon e resolução dos itens estruturados

- Confirmar regra operacional de taxon liberável usando `segmento → nicho → ultranicho`.
- Garantir leitura clara de taxon pai e filho para herança.
- Preservar o fluxo de carregamento e aprovação da E10.5.5, que registra pesquisas por taxon e não resolve herança entre fontes.
- Criar um resolver específico para `landing_page`, separado do contrato da E10.7.
- Resolver `end_customer` somente no taxon específico.
- Resolver `business_buyer` primeiro no próprio taxon e, apenas quando não houver conjunto próprio completo e elegível, no taxon pai direto.
- Exigir os quatro blocos obrigatórios em um conjunto coerente e ativo para cada `audience_scope` resolvido.
- Preservar taxon de origem, pesquisas, blocos, scopes e versões usados, sem antecipar o formato exato do contrato ou da persistência.
- Falhar fechado quando o taxon, o pai direto, a pesquisa, os blocos, o status ou a versão não permitirem uma resolução única e segura.
- Bloquear prontidão para teste e liberação geral quando faltar fonte obrigatória.
- Não alterar o taxon oficial da conta, a hierarquia, os dados de pesquisa ou o contrato executado da E10.7 durante a resolução.

### 2.2. Parametrização raiz da LP

- Definir primeiro a fonte versionada da família `landing_page`, incluindo papéis semânticos, faixas editoriais recomendadas, limites técnicos absolutos e critérios visuais e responsivos.
- Fazer a raiz alimentar ou originar os limites usados por schemas, geração e renderer, sem exigir configuração dinâmica em runtime.
- Definir valores exatos, presets, relação com o design system, contrato de leitura e casos de validação em plano-base próprio.
- Substituir a antiga implementação repo-only da E18.4, removendo os artefatos prematuros e reconstruindo somente o que for necessário após a aprovação da parametrização raiz.

### 2.3. Parametrização de módulos e variantes

- Confirmar o conjunto inicial de módulos e variantes antes de definir suas especializações.
- Fazer os limites textuais e os valores comuns de `spacing` derivarem da raiz e admitir sobrescrita por módulo ou variante somente em caso excepcional e justificado.
- Definir `copy_source_map` por módulo, campo de copy e intenção ou funil.
- Definir `funnel_copy_profile` padrão para BOFU, MOFU e TOFU e como módulos e variantes o adaptam.
- Definir tratamentos permitidos, restritos e proibidos por funil.
- Definir quando a necessidade é especialização do módulo, nova variante reutilizável ou novo módulo.
- Definir ciclo de vida das variantes e compatibilidade com LPs existentes.
- Impedir nova geração com variante depreciada e impedir sua retirada enquanto houver artefato publicado dependente, salvo migração aprovada.

### 2.4. Catálogo de entradas para geração da LP

- Definir o `lp_generation_input_catalog` com campos universais e nichados, obrigatórios, opcionais e condicionais.
- Definir o catálogo aplicável como parte do checklist de prontidão do taxon para teste.
- Separar catálogo declarativo, valores reais persistidos no BD e snapshot da geração.
- Garantir que contas de teste e clientes usem os mesmos campos aplicáveis ao taxon e ao plano.
- Definir onde e como os valores reais serão persistidos, sem autorizar nova tabela, campo ou payload antes do plano-base técnico.
- Definir `paid_search_keyword_map` opcional, origem de seus dados e regras de message match e uso natural, sem keyword stuffing.

### 2.5. Composição, prontidão e autorização para teste

- Permitir composição aprovada para segmento ou nicho e composição própria de ultranicho somente de forma excepcional e por decisão humana.
- Permitir que a IA proponha módulos, variantes, ordem, obrigatoriedade e ajustes por ocorrência dentro das opções parametrizadas.
- Não usar o catálogo de entradas nem entradas particulares da conta, negócio atendido, oferta, campanha ou LP como decisão estrutural automática.
- Consumir o conjunto de itens estruturados já resolvido pela E10, sem reimplementar na E20 a regra de herança de `business_buyer`.
- Resolver onde a composição e suas escolhas serão persistidas.
- Manter `content_template_composition_items` como relação 1:N de módulos e variantes.
- Registrar gaps essenciais e bloquear a autorização para teste até sua resolução.
- Permitir herança da composição aprovada do taxon pai quando não houver composição própria.
- Definir checklist de prontidão com taxon, fontes resolvidas dos itens estruturados, parametrizações, catálogo, composição e regra de herança.
- Definir autorização humana unitária vinculando uma conta de teste, um taxon e um plano, sem presumir agora nova tabela, campo ou rota.
- Preservar a conta de teste como conta normal, sem novo tipo ou status.
- Exigir autorizações próprias para outros taxons ou planos.
- Separar aprovação para teste da liberação geral para clientes.

### 2.6. Geração real, validação e liberação

- Usar a E19 como único fluxo de geração das LPs de contas de teste e clientes.
- Fazer a conta de teste resolver seu taxon pelo fluxo aplicável da E10 e possuir entitlement comercial válido da E9 pelo mecanismo efetivamente disponível.
- Não permitir que a autorização específica de teste substitua o gate comercial da E9.
- Exigir para a geração autorização específica de teste para a conta, taxon e plano ou liberação geral vigente para o taxon e plano.
- Consumir o conjunto de itens estruturados e sua proveniência pelo contrato da E10.8, sem recalcular herança na E19.
- Gerar a LP com composição aplicável, itens estruturados resolvidos, valores fornecidos pela conta e intenção ou funil.
- Permitir adaptações somente dentro das opções parametrizadas e da composição aprovada.
- Registrar snapshot dos valores, fontes dos itens estruturados, composição, variantes, parametrizações, plano e versões usados.
- Impedir alteração livre de schema, renderer, módulo ou variante durante a geração.
- Permitir revisão, edição controlada, publicação e tracking pelo mesmo fluxo produtivo destinado aos clientes.
- Definir checklist técnico, visual, editorial, responsivo, de conversão mínima, publicação, tracking aplicável e carregamento.
- Definir ferramenta ou combinação de ferramentas para medição no fluxo real.
- Definir bloqueios para imagem pesada, embed pesado, JavaScript excessivo, layout shift e fallback lento.
- Permitir avaliação humana no Admin Dashboard e registrar a decisão vinculada à LP real usada como evidência.
- Registrar a liberação herdável do plano e da composição quando aplicável.

### 2.7. Fluxo único de LPs por conta

- Preservar a criação mínima já implementada pela E19 e evoluí-la por novo plano-base, sem reabrir o plano anterior encerrado.
- Usar o mesmo fluxo para conta de teste, conta piloto, conta consultiva e cliente.
- Antes da liberação geral, restringir o taxon e o plano às contas de teste com autorização específica.
- Depois da liberação, permitir o uso pelas demais contas elegíveis sem criar novo gerador ou nova persistência de LP.
- Preservar fontes dos itens estruturados, composição, contratos parametrizados, rastreabilidade e snapshot de cada geração.
- Identificar as LPs e os eventos produzidos sob autorização específica de teste, permitindo separá-los dos indicadores comerciais reais sem classificar a conta como conta de teste.
- Não antecipar editor visual ou nova infraestrutura sem decisão e plano-base próprios.

### 2.8. Evolução controlada

- Definir como aprendizados de LPs validadas e do Benchmark Blueprint alimentam planos-base posteriores.
- Garantir que o Benchmark Blueprint permaneça opcional e sem alterações automáticas.
- Não criar catálogo universal multicanal sem evidência prática de duplicação e ROI.
- E10.7 e E19 permanecem separados; aprendizados podem ser reaproveitados, mas não autorizam converter páginas comerciais em LPs do Builder sem plano-base próprio.

## 3. Ordem dos planos-base técnicos

- 1º — parametrização raiz da família `landing_page`.
- 2º — parametrização de módulos e variantes, incluindo `copy_source_map` e `funnel_copy_profile`.
- 3º — resolução das pesquisas estruturadas para `landing_page`, incluindo elegibilidade, precedência e rastreabilidade do `business_buyer` próprio ou herdado.
- 4º — catálogo de entradas por taxon e critérios correspondentes de prontidão.
- 5º — composição base, herança e checklist de prontidão pela E20, com operação administrativa mínima da E12 para conferência e autorização unitária da conta de teste.
- 6º — geração, revisão, edição controlada, publicação e tracking da LP real por conta, usando a E19 para contas de teste e clientes.
- 7º — revisão da LP real, avaliação humana e liberação do taxon, plano e composição pela E12, operacionalizando os critérios da E20.
- Depois da liberação, a mesma implementação do sexto plano atende as contas comuns; não deve ser criado um segundo fluxo de geração para clientes.
- O primeiro plano-base cobre somente contrato versionado da raiz, papéis semânticos, faixas editoriais, limites técnicos, critérios visuais e responsivos, relação com o design system, contrato de leitura, herança, precedência e casos de validação.
- O primeiro plano-base também deve detalhar a substituição da antiga E18.4 e a remoção segura da implementação repo-only anterior, sem reconstruir módulos, variantes, schemas ou renderer antes das decisões conceituais correspondentes.
- Permanecem fora do primeiro plano todos os recortes posteriores listados acima, além de Admin e persistências ainda não decididas.
- O primeiro plano pertence a `18.4 — Parametrização raiz da família landing_page`, com path previsto `docs/lousa-plano-base-e18-4.md`, substituindo o plano-base atual desse path.
- O segundo plano pertence a `18.5 — Parametrização de módulos e variantes landing_page`, com path previsto `docs/lousa-plano-base-e18-5.md`.
- Não criar `18.6` para esses dois recortes.
- O terceiro plano pertence a `10.8 — Resolução de pesquisas estruturadas para landing_page`, com path previsto `docs/lousa-plano-base-e10-8.md`, sem reabrir a E10.5.5 nem alterar o contrato da E10.7.
- O quarto e o quinto planos pertencem à E20, conforme a distribuição registrada na seção 4.
- O quinto plano também materializa `12.4.3` e `12.4.4` como superfície administrativa mínima anterior à primeira geração pela E19, sem alterar seu path principal da E20.
- O sexto plano pertence a novo recorte da E19 e não reabre as fases encerradas de `docs/lousa-plano-base-E19.md`.
- O sétimo plano materializa `12.4.5` e `12.4.6` e operacionaliza os critérios de liberação da E20, sem gerar uma LP paralela.
- A remoção do código e das referências da antiga E18.4 não ocorre neste planejamento; será detalhada e executada pelo plano-base próprio e por seu briefing para o Executor.
- Cada plano-base deve decidir somente a persistência, versões, snapshots, medições e superfícies necessárias ao próprio recorte.

## 4. Onde cada ajuste entra no roadmap

- Esta seção distribui tudo o que precisa ser ajustado ou implementado pelas seções e subseções correspondentes de `docs/roadmap.md`.
- Devem ser priorizadas subseções já existentes; novas seções ou subseções só devem ser propostas quando não houver proprietário adequado no roadmap atual.
- A distribuição registrada aqui orienta os planos-base, mas não altera automaticamente o roadmap.
- Os sete planos-base ficam distribuídos entre E18, E10, E20, E19 e E12, sem criar fluxo administrativo paralelo de geração de LP.

### 4.1. E10 — Taxons, pesquisas e itens estruturados

- Tipo de intervenção: ajustar `10.5.5.3` e `10.5.5.4` e criar um novo recorte funcional `10.8`, sem reabrir os recortes concluídos da E10.5.5 nem ampliar a E10.7.
- Ajustar `10.5.5.3`, renomeando-a de `Recorte aprovado para consumo pela E10.7` para `Recortes aprovados para consumo`.
- Preservar em `10.5.5.3` o contrato já executado da E10.7, que exige pesquisas próprias `business_buyer` e `end_customer`, `active version 1`, com os quatro blocos fixos.
- Acrescentar em `10.5.5.3` o recorte distinto de `landing_page`: `end_customer` ativo no taxon específico e `business_buyer` ativo próprio ou resolvido no taxon pai direto conforme o contrato da nova `10.8`.
- Exigir nos insumos efetivamente resolvidos para `landing_page` os blocos `strategic_core`, `lp_overview`, `lp_sections` e `seo`, preservando a origem do taxon, das pesquisas e das versões usadas.
- Ajustar `10.5.5.4` para remover a pendência já superada de uso futuro dos dados pela E10.7 e registrar que a resolução própria ou herdada para `landing_page` será tratada na `10.8`.
- Preservar `10.5.6` como classificação da conta e resolução do seu taxon oficial e preservar integralmente a E10.7 como página `commercial_activation`.
- Criar `10.8 — Resolução de pesquisas estruturadas para landing_page`.
- A nova `10.8` será responsável por produzir um conjunto único, completo e rastreável de pesquisas e itens estruturados para consumo por E20 e E19, sem modificar os registros de origem.
- Estrutura prevista para o novo recorte no roadmap:
  - `10.8.1 — Objetivo e status`;
  - `10.8.2 — Registros do recorte`, somente quando houver implementação material;
  - `10.8.3 — Elegibilidade e precedência por audience_scope`;
  - `10.8.4 — Proveniência, rastreabilidade e fail-closed`;
  - `10.8.5 — Contrato de consumo e limites do recorte`.
- A resolução de `end_customer` deve permanecer no taxon solicitado.
- A resolução de `business_buyer` deve usar o conjunto próprio completo e elegível quando existir; somente na ausência desse conjunto pode usar o taxon pai direto ativo com conjunto completo e elegível.
- O recorte deve impedir mistura silenciosa de versões ou blocos incompatíveis e falhar fechado quando não houver fonte única e segura.
- O resultado deve preservar o taxon atendido e a proveniência das pesquisas usadas, sem antecipar agora nomes de tabela, campos, RPCs, rotas ou payloads.
- O terceiro plano-base pertence à nova `10.8`, com path previsto `docs/lousa-plano-base-e10-8.md`.
- Permanecem fora da `10.8`: criação ou edição de pesquisas, alteração da taxonomia, mudança do taxon oficial da conta, catálogo de entradas, composição, geração de LP, UI administrativa, automação, agente, job ou infraestrutura nova.
- A existência de `parent_id` e das pesquisas por taxon permite planejar o resolver, mas o plano-base deve avaliar o boundary e os artefatos mínimos sem presumir nova persistência.

### 4.2. E12 — Autorização, validação e liberação administrativa

- Tipo de intervenção: ajustar o contrato geral da E12 e criar um novo recorte funcional dentro da área existente de Templates.
- Subseções afetadas: `12.1.3`, `12.1.5` e nova `12.4`; não ampliar `12.3`, que permanece exclusiva da operação administrativa da E10.7.
- Ajustar `12.1.3` para manter as mutações administrativas gerais fora do escopo, exceto as operações mínimas aprovadas para a E10.7 e, quando implementadas, as operações específicas de landing pages definidas em `12.4`.
- Ajustar `12.1.5` para registrar que revisão da prontidão, autorização de contas de teste, avaliação da LP real e liberação do taxon, plano e composição não pertencem à base geral nem à E10.7, mas poderão ser implementadas somente pelo novo recorte `12.4`.
- Preservar `12.2` como base administrativa e leitura operacional read-only e preservar integralmente `12.3` como registro da operação de `commercial_activation`.
- Criar `12.4 — Autorização, validação e liberação administrativa de landing pages por taxon`, sem criar nova área na navegação, usando a área de Templates já prevista em `12.1.4`.
- O novo recorte deve permitir ao humano, conforme os contratos e persistências definidos nos planos-base aplicáveis:
  - verificar a elegibilidade do taxon, a proveniência dos itens estruturados resolvidos e o checklist de prontidão definido pela E20;
  - revisar catálogo aplicável, composição base, versão e regra de herança;
  - autorizar ou revogar uma conta de teste para um taxon e um plano determinados;
  - localizar e abrir a LP real criada pela E19 na conta de teste, sem gerar ou regenerar LP no Admin Dashboard;
  - consultar snapshot, versões, estado de publicação, validações técnicas e integridade do tracking aplicável;
  - registrar aprovação, rejeição ou necessidade de correções;
  - registrar a decisão de liberação vinculada ao taxon, plano, conta de teste, LP usada como evidência, fontes dos itens estruturados, composição, versões, responsável e momento.
- A conta de teste permanece uma conta normal, sem novo tipo ou status; outros taxons ou planos exigem autorizações próprias.
- A E12 não será a fonte dos contratos de parametrização, módulos, variantes, resolução dos itens estruturados, catálogo, composição, prontidão ou liberação; será a superfície responsável pelas operações humanas autorizadas sobre os contratos da E20 e pelas evidências produzidas pela E19.
- Estrutura prevista para o novo recorte no roadmap:
  - `12.4.1 — Objetivo e status`;
  - `12.4.2 — Registros do recorte`, somente quando houver implementação material;
  - `12.4.3 — Prontidão, fontes, catálogo e composição resolvidos`;
  - `12.4.4 — Autorização de contas de teste`;
  - `12.4.5 — Revisão da LP real e das evidências`;
  - `12.4.6 — Validação e decisão de liberação`.
- O quinto plano-base materializa `12.4.3` e `12.4.4` como operação administrativa mínima após os contratos da E10 e da E20 e antes da primeira geração pela E19; seu path principal permanece `docs/lousa-plano-base-e20-3.md` porque o proprietário funcional principal é `20.3`.
- O sétimo plano-base materializa `12.4.5` e `12.4.6`, com path previsto `docs/lousa-plano-base-e12-4.md`.
- Permanecem fora de `12.4`: geração ou regeneração de LP, gestão do ciclo das LPs das contas, LP Builder, editor visual, aprovação automática, publicação automática e infraestrutura nova não decidida pelos planos-base.
- Rota exata, actions, persistência, permissões, auditoria e evidências devem ser definidas somente pelos planos-base que materializarem cada etapa.
- As operações de prontidão e autorização previstas em `12.4.3` e `12.4.4` entram antes da primeira geração pela E19; a revisão da LP real e a decisão de liberação previstas em `12.4.5` e `12.4.6` entram depois da produção da LP pela E19.

### 4.3. E18 — Parametrização técnica da família `landing_page`

- Tipo de intervenção: reorganizar a E18 para refletir integralmente o planejamento conceitual, substituindo a atual `18.4` e criando apenas o recorte seguinte necessário.
- Seções e subseções afetadas: objetivo e status da E18, `18.1.5`, atual `18.4` e nova `18.5`.
- Ajustar o objetivo e o status da E18 para registrar que `commercial_activation` permanece implementada e preservada, enquanto a evolução de `landing_page` passa a começar pela parametrização raiz e depois pela parametrização de módulos e variantes.
- Ajustar `18.1.5` para preservar o catálogo implementado de `commercial_activation`, retirar o conjunto anterior de módulos e variantes de `landing_page` como contrato vigente e registrar que o novo conjunto será definido em `18.5` após a parametrização raiz.
- Registrar em `18.1.5` que os limites textuais e os valores comuns de `spacing` pertencem à raiz e que módulos ou variantes só podem sobrescrevê-los excepcionalmente, seguindo `raiz → módulo → variante`.
- Preservar `18.1.7` como contrato transversal geral até a materialização da composição pela E20 e preservar `18.1.8` como separação entre template, composição, conteúdo e artefato final.
- Preservar integralmente `18.2` e `18.3`, que permanecem vinculadas a `commercial_activation` e ao consumo pela E10.7.
- Substituir integralmente a atual `18.4 — Base de composição landing_page` por `18.4 — Parametrização raiz da família landing_page`.
- A nova `18.4` será responsável pela fonte versionada da verdade para papéis semânticos, faixas editoriais recomendadas, limites técnicos absolutos, critérios visuais e responsivos, presets, relação com o design system, contrato de leitura, herança, precedência e validação.
- Estrutura prevista para a nova `18.4`:
  - `18.4.1 — Objetivo e status`;
  - `18.4.2 — Registros do recorte`, somente quando houver implementação material;
  - `18.4.3 — Fonte versionada e contrato de resolução`;
  - `18.4.4 — Papéis semânticos e faixas editoriais`;
  - `18.4.5 — Limites técnicos de conteúdo`;
  - `18.4.6 — Critérios visuais e responsivos`;
  - `18.4.7 — Presets e relação com o design system`;
  - `18.4.8 — Herança, precedência e validação`;
  - `18.4.9 — Limites do recorte`.
- O plano-base da nova `18.4` terá path `docs/lousa-plano-base-e18-4.md`, substituindo o conteúdo do plano-base anterior.
- Criar `18.5 — Parametrização de módulos e variantes landing_page`, responsável pelo conjunto inicial de módulos e variantes, suas funções estruturais, campos, cardinalidades e especializações excepcionais sobre a raiz, `copy_source_map`, `funnel_copy_profile`, tratamentos por intenção ou funil, ciclo de vida, compatibilidade, depreciação e remoção.
- Estrutura prevista para `18.5`:
  - `18.5.1 — Objetivo e status`;
  - `18.5.2 — Registros do recorte`, somente quando houver implementação material;
  - `18.5.3 — Módulos e funções estruturais`;
  - `18.5.4 — Campos, estruturas e cardinalidades`;
  - `18.5.5 — Variantes e critérios de criação`;
  - `18.5.6 — Especializações sobre a parametrização raiz`;
  - `18.5.7 — Mapa de fontes de copy`;
  - `18.5.8 — Perfis de copy por intenção e funil`;
  - `18.5.9 — Ciclo de vida, compatibilidade e validação`;
  - `18.5.10 — Limites do recorte`.
- O plano-base de `18.5` terá path previsto `docs/lousa-plano-base-e18-5.md`.
- Não criar `18.6` para esses recortes.
- A substituição da antiga `18.4` implica remover, pelo plano-base próprio e por seu Executor, a implementação repo-only criada antes do planejamento conceitual, incluindo o diretório `lib/conversion-content/landing-page/`, o export correspondente, o script `validate:landing-page` e as referências normativas anteriores, após verificação final de dependências e sem deixar artefatos órfãos.
- A remoção não ocorre neste documento nem durante o fechamento da seção 4; o novo plano-base da `18.4` deve detalhar escopo, ordem, verificações e briefing para execução.
- O histórico da implementação removida permanece preservado pelo Git e não deve determinar a estrutura futura do roadmap.
- Permanecem fora da nova `18.4` e da `18.5`: elegibilidade e itens estruturados, resolução das pesquisas por taxon, catálogo de entradas, composição por taxon, herança concreta, prontidão, autorização de contas de teste, geração e ciclo das LPs por conta, avaliação humana e liberação.
- Os novos recortes não autorizam automaticamente banco, migration, rota, API, Admin, configuração dinâmica em runtime, agente, job ou automação; cada plano-base deve decidir apenas os artefatos necessários ao próprio recorte.

### 4.4. E20 — Preparação e liberação de taxons para geração de landing pages

- Tipo de intervenção: criar uma nova seção funcional no roadmap para os contratos e registros que existem no nível do taxon antes da geração de qualquer LP específica de conta.
- Objetivo: consolidar catálogo de entradas, composição base, herança, prontidão para teste e regras de liberação de taxons por plano, sem gerar landing pages e sem duplicar as responsabilidades da E10, E12, E18 ou E19.
- A E20 recebe da E10 o taxon e o conjunto de pesquisas e itens estruturados resolvido pela `10.8` e recebe da E18 as parametrizações, módulos e variantes permitidos.
- A E20 é responsável por:
  - definir o catálogo aplicável ao taxon e sua herança;
  - criar e versionar a composição base concreta do segmento ou nicho;
  - admitir composição própria de ultranicho somente quando justificada e aprovada humanamente;
  - registrar módulos, variantes, ordem, obrigatoriedade e escolhas permitidas;
  - definir a regra de herança da composição;
  - registrar gaps impeditivos;
  - consolidar o checklist de prontidão para teste;
  - definir as regras para autorização unitária de uma conta de teste por taxon e plano;
  - definir os critérios funcionais para liberação geral com base em uma LP real produzida pela E19.
- A E20 consome a resolução da E10 e não deve implementar uma segunda regra de precedência ou herança de pesquisas.
- A E20 não será uma superfície administrativa: a revisão humana, autorização de contas de teste e decisão de liberação serão operadas pela E12.
- A E20 não gera, revisa, edita, publica ou administra LPs das contas; essas responsabilidades pertencem à E19.
- Estrutura prevista para a nova seção no roadmap:
  - `20.1 — Contrato de preparação e liberação de taxons`;
  - `20.2 — Catálogo de entradas por taxon`;
  - `20.3 — Composição, herança, prontidão e autorização controlada para teste`;
  - `20.4 — Critérios de liberação por evidência da LP real`.
- O quarto plano-base pertence a `20.2`, com path previsto `docs/lousa-plano-base-e20-2.md`.
- O quinto plano-base pertence a `20.3`, com path previsto `docs/lousa-plano-base-e20-3.md`, e materializa também a operação mínima de `12.4.3` e `12.4.4` necessária antes da E19.
- O contrato de `20.4` deve ser materializado operacionalmente pelo sétimo plano da E12, sem criar um terceiro plano-base da E20 nesta jornada.
- Persistência, estados, versões, regras de herança e vínculo unitário entre conta de teste, taxon e plano só podem ser definidos pelos planos-base aplicáveis após avaliação do schema existente.
- Permanecem fora da E20: entitlement e mecanismos comerciais da E9; classificação da conta, resolução das pesquisas e itens estruturados da E10; cards e entrada comercial da E10; parametrizações da E18; geração e ciclo das LPs da E19; UI e operações humanas da E12; automação, agente, job ou infraestrutura não comprovada.

### 4.5. E19 — Fluxo único de landing pages por conta

- Tipo de intervenção: preservar os recortes concluídos da E19 e criar um novo recorte funcional, sem reabrir as fases encerradas de `docs/lousa-plano-base-E19.md`.
- Ajustar o objetivo e o status geral da E19 para registrar que a criação mínima por conta permanece implementada e que sua próxima evolução será o fluxo produtivo único usado por contas de teste, pilotos, contas consultivas e clientes.
- Preservar `19.1`, `19.2` e `19.3` como contrato e histórico do recorte concluído da Fase 3; itens registrados como fora daquela fase não impedem sua entrada no novo recorte quando expressamente aprovada pelo novo plano-base.
- Criar `19.4 — Geração e ciclo das landing pages por conta`.
- O novo recorte deve:
  - consumir o taxon oficial da conta e o conjunto de pesquisas e itens estruturados resolvido pela E10.8, com sua proveniência;
  - consumir as parametrizações, módulos e variantes da E18;
  - consumir o catálogo, a composição e a herança aplicáveis da E20;
  - consumir o entitlement comercial válido da E9 sem duplicar seus mecanismos de origem, confirmação ou persistência;
  - exigir uma das seguintes condições: autorização específica de teste para a conta, taxon e plano; ou liberação geral vigente para o taxon e plano;
  - permitir o uso pré-liberação somente por contas de teste com autorização específica;
  - permitir o uso pós-liberação pelas demais contas elegíveis;
  - apresentar e receber os valores previstos pelo catálogo;
  - gerar a LP real pertencente à conta;
  - permitir revisão e edição controladas dentro dos contratos aprovados;
  - publicar e renderizar a LP conforme o recorte aprovado;
  - registrar tracking mínimo aplicável sem confundi-lo com analytics avançado;
  - preservar snapshot de valores, fontes dos itens estruturados, taxon, plano, composição, parametrizações, módulos, variantes e versões;
  - identificar as LPs e os eventos produzidos sob autorização específica de teste, permitindo separá-los dos indicadores comerciais reais sem classificar a conta como conta de teste.
- A E19 não deve recalcular a precedência entre pesquisa própria e herdada; deve falhar fechado quando o contrato da E10.8 não entregar um conjunto consumível.
- Estrutura prevista para o novo recorte no roadmap:
  - `19.4.1 — Objetivo e status`;
  - `19.4.2 — Registros do recorte`, somente quando houver implementação material;
  - `19.4.3 — Elegibilidade e contratos resolvidos`;
  - `19.4.4 — Coleta das entradas e geração`;
  - `19.4.5 — Revisão e edição controladas`;
  - `19.4.6 — Publicação, render público e tracking mínimo`;
  - `19.4.7 — Snapshot, versões e rastreabilidade`;
  - `19.4.8 — Limites do recorte`.
- O sexto plano-base pertence a `19.4`, com path previsto `docs/lousa-plano-base-e19-4.md`.
- A geração da LP usada como evidência de teste ocorre integralmente na E19; a E12 autoriza o teste antes da geração e, depois, localiza, avalia e registra a decisão humana.
- Não criar entidade, tabela, renderer ou fluxo separado para LP teste.
- Editor visual, drag and drop, analytics avançado, teste A/B, domínio customizado, automação, agente, job e demais capacidades ainda não aprovadas permanecem fora do novo recorte.

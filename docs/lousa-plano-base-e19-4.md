17/08/2026 — Plano-base v1 — E19.4 — Primeira LP real do Cenário E

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado; debate conceitual encerrado.
- Recorte: `E19.4 — Geração, revisão válida, materialização e preview privado da landing page em draft`.
- Path canônico: `docs/lousa-plano-base-e19-4.md`.
- Processo: `docs/prompt-estrategista.md` v31.
- Plano conceitual: `docs/lp-planejamento.md`.
- Cenário ativo: somente Cenário E.
- E19.3 do Cenário E: concluída no contrato v3 e mergeada pelo PR #757; E19.4 consome `identities + modelContext + serverContext` sem reabrir inteligência intermediária.
- PR #760: correção factual de `docs/schema.md` já mergeada; o apply de `account_landing_page_materializations` não é pendência.
- PR #726 / E19.5: permanece pausado e materialmente superado na forma executável atual; sua reconciliação deve ocorrer antes de qualquer implementação futura da E19.5.
- O debate da E19.4 não será reaberto por detalhe técnico que possa ser resolvido na v2 sem alterar as decisões desta v1.

### 1.2. Resultado esperado

- Produzir e avaliar a primeira landing page real do Cenário E a partir de pacote E19.3 válido.
- Manter `landing_page` como identidade comercial estável, capaz de acumular revisões válidas sem criar nova LP a cada regeneração.
- Permitir que a IA decida narrativa, copy, quantidade/ordem de seções e layouts somente dentro da autoridade estrutural permitida.
- Produzir candidata estruturada por uma única chamada textual, resolver a mídia necessária, validar o resultado, persistir uma nova revisão válida append-only e disponibilizar preview privado da revisão corrente.
- Preservar revisões anteriores sem overwrite.
- Incluir na primeira prova pelo menos uma imagem principal pertinente à narrativa e avaliar a LP por critérios humanos e gates binários.

### 1.3. Decisões fixas da v1

- Hierarquia de autoridade:
  - E19.2/E20.2 definem fatos concretos da conta, oferta e LP;
  - pesquisa integral `end_customer` fornece contexto consultivo;
  - E18.4 fornece limites universais;
  - E19.3 autoriza, organiza e transporta;
  - E19.4 decide narrativa, estrutura, copy, composição e candidata dentro dos limites autorizados.
- A pesquisa não amplia nem contradiz a oferta concreta.
- Não existe camada intermediária de resumo, atomização ou seleção semântica antes da E19.4.
- `serverContext` bruto permanece fora da matéria-prima textual do modelo; uso operacional continua determinístico.
- A autoridade estrutural da E19.4 é única, finita e versionada; Structured Output, validator, persistência e renderer derivam dela.
- Repertório conceitual v1 de formas de apresentação:
  - Header;
  - Hero visual;
  - texto + mídia;
  - cards/grid;
  - steps;
  - FAQ;
  - CTA;
  - Footer.
- Essas formas não são módulos narrativos obrigatórios nem impõem ordem fixa.
- A primeira geração textual usa uma única chamada por tentativa para estrutura + narrativa + copy.
- Não há retry textual automático dentro da mesma tentativa; nova tentativa é explícita.
- A candidata usa Structured Outputs e um único DTO; não existe `narrativePlan` paralelo nem exigência de raciocínio privado.
- Baseline humano inicial: `gpt-5.6-luna + reasoning.effort=max`, via Responses API e Structured Outputs, como hipótese deliberada de qualidade/custo e não como vencedor definitivo.
- O workload textual canônico será `landing_page_draft_generation`, reutilizando a identidade histórica formal da E19.4.3.
- A geração textual é novo workload de produto sujeito à governança E21.1; o contrato executável deverá ser estendido de forma aditiva para aceitar `max` antes da execução.
- Classificação formal da automação: `2.1.3 — Automação com IA em fluxo controlado`.
- Ambiente principal: `2.2.1 — Runtime do LP Factory`.
- Plataforma dependente: OpenAI API.
- O fluxo não é agentic.
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK e multi-agent ficam rejeitados para este recorte por ausência de necessidade demonstrada.
- O prompt de runtime é código versionado da feature, separado do contexto dinâmico validado e baseado nos templates vigentes.
- Factualidade determinística aplica-se somente ao que for objetivamente comprovável; linguagem livre não comprovável por regra confiável é limitada pelo prompt e avaliada humanamente.

### 1.4. Identidade, tentativa e revisão

- `landing_page` é uma identidade comercial estável.
- Tentativa é uma execução de geração e não cria por si uma revisão persistida.
- Tentativa inválida falha e não produz revisão válida.
- Somente uma candidata integralmente válida produz revisão.
- Regenerar a mesma LP não cria nova linha em `account_landing_pages`.
- Revisões válidas da mesma LP são preservadas em modelo lógico append-only 1:N.
- Revisão anterior nunca é sobrescrita.
- Uma revisão corrente alimenta o preview.
- O contrato físico atual de materialização 1:1/write-once é estado legado a evoluir; tabela, PK, índices, ordenação, identificação da revisão e mecanismo de revisão corrente pertencem à v2.
- A materialização histórica de `Primeiro imóvel no Rio` não exige criar nova LP nem nova conta; após a evolução física 1:N, a mesma identidade pode receber nova revisão válida.
- O lifecycle futuro mínimo da LP é `draft | archived`, com restauração e sem hard delete nesta fase; sua implementação não pertence à E19.4 atual.

### 1.5. Imagem e mídia

- A primeira LP real possui pelo menos uma imagem principal pertinente.
- A imagem integra a narrativa; não é decoração independente.
- `brand_logo_asset` permanece exclusivo para logo.
- Imagem criada pela E19.4 é saída do workload, não novo input E20.2.
- Se não houver asset autorizado e adequado do cliente no fluxo vigente, geração de imagem por IA está autorizada.
- A operação de mídia é separada da única chamada textual e não constitui uma segunda etapa semântica de “planejar + escrever”.
- Mídia efetivamente usada precisa de referência canônica, tenant-safe e estável antes da persistência da revisão.
- Performance da mídia é requisito da primeira LP.
- Imagem gerada não pode apresentar como real imóvel específico disponível, pessoa/cliente, credencial, resultado, localização exata, propriedade, prova social, condição comercial ou outro fato não autorizado.
- Auditabilidade mínima da mídia deve permitir identificar:
  - origem fornecida ou gerada;
  - referência canônica do asset usado;
  - workload/configuração quando gerada;
  - versão do brief/prompt visual aplicável.
- Não armazenar raciocínio privado.

### 1.6. Rubrica humana e critérios de validade

- Rubrica humana v1:
  - adequação público/oferta;
  - jornada persuasiva;
  - qualidade/especificidade da copy;
  - hierarquia/estrutura visual;
  - qualidade/pertinência da imagem;
  - clareza do CTA/conversão.
- Gates binários:
  - factualidade;
  - segurança;
  - funcionamento.
- Não há piso numérico global nesta primeira prova.
- `6/10` e `7+` permanecem hipóteses não aprovadas até existir geração real avaliada.
- Cada prova deve ser relacionável a `promptVersion`, versão estrutural, modelo, effort, tokens, reasoning tokens, latência, custo e notas humanas.

### 1.7. Matriz final da v1

| Tema | Decisão da v1 | Estado | Destino técnico |
|---|---|---|---|
| Identidade da LP | Uma LP mantém identidade estável entre regenerações. | Fechado | Contrato físico na v2. |
| Tentativa | Execução de geração; inválida não persiste revisão. | Fechado | Casos executáveis na v2. |
| Revisão válida | Revisões válidas da mesma LP são append-only 1:N. | Fechado | Shape, PK, índices e ordenação na v2. |
| Revisão corrente | Preview consome uma revisão corrente sem apagar anteriores. | Fechado | Mecanismo exato na v2. |
| Materialização atual | Contrato hospedado atual é 1:1/write-once e precisa evoluir para suportar revisões 1:N. | Gap técnico conhecido | Evolução física na v2. |
| Autoridade estrutural | Única, finita e versionada. | Fechado | Fields, variantes, layouts e cardinalidades na v2. |
| Repertório v1 | Header, Hero visual, texto+mídia, cards/grid, steps, FAQ, CTA e Footer. | Fechado | Contratos exatos na v2. |
| Uma chamada textual | Estrutura + narrativa + copy em uma chamada por tentativa, sem retry automático. | Fechado | Timeout/retry técnico na v2. |
| Structured Output | Um DTO único da candidata. | Fechado | Schema exato na v2. |
| Contexto | `modelContext` + instruções estáveis + autoridade estrutural; `serverContext` bruto fora do prompt. | Fechado | Projeções seguras na v2. |
| Workload OpenAI | `landing_page_draft_generation`, sujeito à E21.1. | Fechado | Registry, `max`, configuração e observabilidade na v2. |
| Baseline | `gpt-5.6-luna + max`, Responses API, Structured Outputs. | Fechado como baseline experimental | Comparação só após prova real. |
| Automação | 2.1.3, runtime LP Factory, OpenAI API, não agentic. | Fechado | Implementação na v2. |
| Imagem principal | Pelo menos uma imagem pertinente na primeira LP. | Fechado | Layout/cardinalidade na v2. |
| Fallback de imagem | Gerar por IA quando faltar asset adequado. | Fechado | API/workload de mídia na v2. |
| Persistência da mídia | Referência canônica tenant-safe antes da revisão persistida. | Fechado como requisito | Mecanismo, visibilidade e Storage na v2. |
| Factualidade da mídia | Não representar fato não autorizado como real. | Fechado | Regras/prompt/gates na v2. |
| Performance da mídia | Parte da qualidade técnica. | Fechado | Formato, dimensões, compressão, cache/CDN na v2. |
| Claims | Validar deterministicamente apenas o comprovável. | Fechado | Regras exatas na v2. |
| Rubrica humana | Seis dimensões + três gates binários. | Fechado | Registro operacional na v2. |
| E19.5 | Pausada; PR #726 precisa ser reconciliado antes de implementação. | Fechado | Retomar somente após primeira LP real. |
| Biblioteca ampla de assets / editor / planos | Oportunidades futuras, não dependências da primeira LP. | Fora do recorte | Preservadas em 4.4. |

## 2. Contrato do caso

### 2.1. Fluxo lógico aprovado

- Gatilho:
  - ação humana explícita inicia uma tentativa de geração para LP legítima em `draft`.
- Entrada:
  - identidade da LP;
  - configuração E19.2 completa nos fields aplicáveis da E20.2;
  - taxon preparado;
  - pacote E19.3 válido;
  - workload `landing_page_draft_generation` efetivamente governado pela E21.1.
- Processamento:
  - revalidar autorização antes do provider;
  - obter pacote E19.3 sem reler diretamente suas fontes internas;
  - construir requisição com prompt versionado, `modelContext` e autoridade estrutural;
  - executar uma única chamada textual para estrutura + narrativa + copy;
  - produzir candidata estruturada dentro da autoridade permitida;
  - resolver a necessidade de mídia;
  - gerar imagem quando faltar asset adequado;
  - persistir/resolver referência canônica da mídia escolhida;
  - combinar deterministicamente destinos, bindings, assets e valores server-side;
  - validar integralmente candidata e mídia;
  - somente resultado válido cria nova revisão append-only da mesma LP.
- Validação:
  - schema, tipos, cardinalidades, identidades, layouts e referências suportados;
  - factualidade determinística somente quando objetivamente comprovável;
  - bindings, destinos, consentimento, segurança e tenant permanecem determinísticos;
  - mídia exigida deve existir, estar referenciada e respeitar factualidade;
  - falha técnica, refusal, Structured Output inválido ou mídia inválida não cria revisão.
- Persistência:
  - revisões válidas são append-only e preservadas;
  - nenhuma revisão anterior é sobrescrita;
  - o mecanismo físico 1:N será definido na v2;
  - mídia deve ter referência estável antes da persistência da revisão.
- Consumo:
  - renderer privado/read-only reproduz a revisão corrente sem reler fontes mutáveis;
  - revisões anteriores permanecem preservadas.
- Fallback:
  - fail-closed;
  - sem troca silenciosa de modelo, effort ou schema;
  - sem retry textual automático;
  - nova tentativa exige ação explícita.

### 2.2. Divisão de autoridade

- IA:
  - sintetiza público efetivo;
  - decide progressão persuasiva;
  - decide quantidade, sequência e função narrativa das formas permitidas;
  - escolhe layouts autorizados;
  - produz copy, headings, CTA textual, FAQ e demais conteúdos admitidos;
  - decide necessidade e função narrativa da mídia;
  - gera imagem quando autorizada e necessária.
- Determinístico:
  - autenticação, conta, membership e entitlement;
  - gate e contrato E19.3;
  - precedência factual E19.2/E20.2;
  - autoridade estrutural permitida;
  - schema e validação do Structured Output;
  - bindings, URLs, destinos, consentimento e segurança;
  - persistência/referência da mídia;
  - identificação e persistência da revisão;
  - snapshot;
  - renderer;
  - fail-closed.
- Humano:
  - dispara a tentativa;
  - avalia a primeira LP real pela rubrica;
  - não precisa aprovar internamente cada decisão semântica antes da persistência de uma candidata válida.

### 2.3. Prompt e governança OpenAI

- Prompt é código versionado próximo da feature consumidora.
- Instruções estáveis ficam separadas do contexto dinâmico.
- Prompt não pede cadeia de raciocínio privada.
- Runtime textual usa Responses API e Structured Outputs.
- Workload canônico: `landing_page_draft_generation`.
- Configuração inicial: `gpt-5.6-luna + reasoning.effort=max`.
- E21.1 deve ser reconciliada antes da execução:
  - registrar workload como `product_runtime`;
  - ampliar `openAiReasoningEfforts` de forma aditiva para `max`;
  - registrar configuração efetiva conforme governança vigente;
  - reutilizar observabilidade transversal existente.
- Mídia gerada por IA também deve ser mensurável e governada; v2 decide se é workload separado ou operação especializada.

### 2.4. Regra de corte da v1

- Qualquer nova questão que não impeça gerar, validar, revisar, persistir, renderizar e avaliar a primeira LP real não reabre esta v1.
- Detalhes de shape, naming, índice, limite, timeout, retry, token budget, layout, variante, storage ou fixture pertencem à v2 quando não alterarem as decisões acima.
- O plano-base v1 somente volta ao humano se surgir mudança material de escopo, autoridade, semântica de revisão, categoria de automação ou dependência capaz de exigir retrabalho relevante.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e candidata válida

- Status: pronta para detalhamento v2, não para implementação imediata.
- Automação: sim.
- Categoria: `2.1.3 — Automação com IA em fluxo controlado`.
- Ambiente: `2.2.1 — Runtime do LP Factory`.
- Objetivo:
  - transformar E19.3 em candidata completa por uma chamada textual, com Structured Output, mídia necessária e validação integral.
- Limites:
  - uma chamada textual por tentativa e sem retry textual automático;
  - IA restrita ao `modelContext` e à autoridade estrutural autorizada;
  - `serverContext` bruto, autorização, fatos, bindings, segurança, persistência e renderer permanecem determinísticos;
  - sem comportamento agentic, PTC, persisted reasoning, Agents SDK ou multi-agent neste recorte.
- Avaliação formal de Automação na v2: necessária.
- V2 deve fechar:
  - fields, variantes, layouts e cardinalidades;
  - schema exato do Structured Output;
  - prompt final de runtime;
  - E21.1/registry/`max`/observabilidade;
  - timeout, token budget e demais limites executáveis;
  - mecanismo técnico da operação de mídia;
  - casos executáveis e fixtures.

### 3.2. E19.4.4 — Revisões append-only, mídia e snapshot

- Status: pronta para detalhamento v2.
- Automação: não.
- Objetivo:
  - evoluir a persistência atual para múltiplas revisões válidas da mesma LP, sem overwrite, com mídia estável e snapshot reproduzível.
- V2 deve fechar:
  - contrato físico 1:N;
  - identificação e ordenação de revisão;
  - definição da revisão corrente;
  - relação com o agregado 1:1 existente e estratégia de evolução segura;
  - mecanismo real de persistência de mídia;
  - avaliação de Supabase Storage;
  - visibilidade do asset;
  - formatos, dimensões, compressão, otimização e cache/CDN;
  - shape de `content_json` e snapshot;
  - metadata mínima de mídia;
  - concorrência e invariantes append-only.

### 3.3. E19.4.5 — Renderer, preview e prova humana

- Status: pronta para detalhamento v2.
- Automação: não.
- Objetivo:
  - renderizar a revisão corrente em preview privado e avaliar a primeira LP real.
- V2 deve fechar:
  - contrato detalhado do renderer;
  - confirmação/adaptação da rota histórica de preview;
  - mecanismo de leitura da revisão corrente;
  - critérios objetivos de responsividade, acessibilidade e performance;
  - forma de registrar rubrica humana e gates binários.

### 3.4. Próximo passo

- Encerrar o debate v1 neste documento.
- Não solicitar nova avaliação ao Gestor de Automação neste momento.
- Não preparar nova instrução para implementação da E19.5; ela permanece pausada.
- Não executar nova frente de `docs/lp-planejamento.md` neste trabalho.
- Seguir o fluxo normal de especialistas/v2 para fechar os contratos técnicos das fases 3.1–3.3.
- Implementar somente depois da v2 e dos gates correspondentes.
- Produzir a primeira LP real do Cenário E e usar o resultado para orientar qualquer otimização posterior.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4 v1

- implementação da E19.5;
- duplicação de configuração como entrega mínima da E19.5;
- publicação pública, domínio customizado e disponibilidade comercial;
- tracking, analytics, CRM, Ads, A/B test e engine de experimentos;
- editor visual ou manualização ampla;
- interface de histórico/comparação de revisões;
- biblioteca tenant-aware ampla de assets, upload/seleção pelo cliente, DAM ou banco de imagens;
- integração externa de mídia/licenciamento;
- diferenciação completa de repertório estrutural por plano;
- nova superfície administrativa exclusiva para renderer;
- hard delete ou política definitiva de retenção;
- Cenário D;
- reintrodução de E18.5, E20.3 ou E10.8 como gate da geração;
- camada intermediária de resumo/atomização/seleção semântica;
- HTML/CSS/React/JS livre ou componentes arbitrários gerados pela IA;
- Programmatic Tool Calling;
- persisted reasoning;
- prompt caching avançado;
- Agents SDK;
- multi-agent;
- job, fila, cron, webhook, browsing ou tools externas sem necessidade demonstrada;
- perfil persistido novo de público/persona/estratégia.

### 4.2. Itens deliberadamente deferidos à v2

- schema exato do Structured Output;
- fields e variantes exatos da autoridade estrutural;
- cardinalidades e layouts;
- prompt final de runtime;
- contrato físico 1:N das revisões;
- identificação e ordenação da revisão;
- definição da revisão corrente;
- mecanismo concreto de mídia;
- avaliação de Supabase Storage;
- visibilidade do asset;
- formatos, dimensões, compressão, otimização e cache/CDN;
- metadata e referência da mídia no snapshot;
- factualidade técnica da mídia;
- workload/configuração executável E21.1;
- timeout;
- política técnica de retry compatível com a decisão de não haver retry textual automático;
- orçamento de tokens;
- shape exato do snapshot;
- renderer detalhado;
- casos executáveis e fixtures;
- critérios objetivos de responsividade, acessibilidade e performance.

### 4.3. Critérios de parada

- Parar se E19.3 faltar informação indispensável sem fonte autorizada.
- Parar se a solução tentar compensar pesquisa insuficiente com RAG, chunking, ranking ou seleção semântica não autorizada.
- Parar se a IA precisar inventar fatos, evidências, credenciais, destinos ou capacidades.
- Parar se a solução não conseguir preservar revisões válidas sem overwrite.
- Parar se uma tentativa inválida puder produzir revisão persistida.
- Parar se a mídia não puder ser persistida/referenciada de forma estável antes da revisão.
- Parar se o renderer depender de releitura de fontes mutáveis para reproduzir a revisão corrente.
- Parar se surgir necessidade de agente, engine ou infraestrutura ampla não sustentada por caso real.
- Mudança material de escopo, autoridade, semântica de revisão ou categoria de automação volta ao humano.

### 4.4. Substância preservada para recortes futuros

- E19.5 deve ser reconciliada com identidade estável da LP, revisões append-only e ausência de criação de nova LP por regeneração antes de qualquer implementação.
- Lifecycle futuro mínimo da LP: `draft | archived`, com restauração e sem hard delete nesta fase.
- Conta poderá futuramente possuir biblioteca tenant-aware de logos e imagens reutilizáveis.
- Quando houver upload/seleção de imagem pelo cliente antes da geração, avaliar input E20.2 específico; `brand_logo_asset` continua dedicado à logo.
- Estratégia de mídia futura pode ser híbrida: asset próprio, IA e eventual mídia externa/licenciada com direitos e proveniência.
- Cliente poderá futuramente editar/manualizar LP e consultar histórico/comparação de revisões.
- Repertório estrutural poderá diferir por plano sem reduzir qualidade do plano inicial.
- `/admin/estrutura-lp` permanece destino natural para projeção read-only da autoridade estrutural, sem segunda fonte de verdade.
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK e multi-agent permanecem no radar apenas para casos futuros com necessidade demonstrada.
- Hard delete e política definitiva de retenção ficam para decisão futura.

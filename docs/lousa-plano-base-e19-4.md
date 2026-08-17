14/08/2026 — Rascunho vivo — E19.4 — Primeira LP real do Cenário E

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: rascunho vivo do futuro plano-base v1; ainda não consolidado nem executável.
- Recorte: `E19.4 — Geração e materialização da landing page em draft`.
- Path canônico: `docs/lousa-plano-base-e19-4.md`.
- Processo: `docs/prompt-estrategista.md` v31.
- Plano conceitual: `docs/lp-planejamento.md`.
- Base histórica de abertura do PR #731: `main` após o merge do PR #729, commit `40baacbc516a80c2600408a9be63bfa33793ca85`.
- Atualização do debate: 17/08/2026, já sobre a `main` posterior ao merge dos PRs #757 e #760.
- O plano-base v2 anterior permanece somente no histórico Git como desenho superado dependente do contrato E19.3 `partA + partB`.
- Decisão humana de 14/08/2026: o Cenário E é a única direção ativa para a primeira geração real; o Cenário D deixa de ser alternativa em desenvolvimento ou comparação obrigatória.
- A E19.3 do Cenário E foi concluída no contrato v3 e mergeada pelo PR #757; a E19.4 consome `identities + modelContext + serverContext` como boundary já provado.
- A Preparação do taxon foi separada em dois recortes próprios anteriores à E19.3; a E19.4 apenas exige taxon previamente preparado e pacote E19.3 válido.
- Nenhuma implementação da nova E19.4 foi iniciada neste debate.
- O draft piloto `Primeiro imóvel no Rio` (`landing_page_id = 4d91020a-07e5-4bf9-a1aa-272bbc0366ff`) já possui materialização hospedada e está vinculado à configuração E19.2 vigente; não pode ser reutilizado para nova materialização write-once.

### 1.2. Objetivo e resultado esperado

- Produzir e avaliar a primeira landing page real do Cenário E a partir do pacote autorizado da E19.3.
- Dar à IA liberdade controlada para transformar contexto autorizado em jornada comercial coerente, sem delegar segurança, autorização, verdade factual, bindings operacionais, persistência ou renderer.
- Gerar candidata estruturalmente válida, resolver a mídia necessária, materializá-la em `draft` legítimo ainda não materializado e disponibilizar preview privado e read-only para avaliação humana.
- Incluir na primeira prova LP completa e reconhecível como página comercial real, com Header, corpo, CTA(s), Footer, estrutura visual, conteúdo coerente e pelo menos uma imagem principal pertinente à narrativa.
- Encerrar a E19.4 quando o fluxo estiver funcional de ponta a ponta e a LP puder ser aberta no navegador e avaliada de forma real; otimização editorial intensiva poderá continuar depois da E19.5 Light por novos drafts independentes.

### 1.3. Decisões aceitas no debate até aqui

- A hierarquia de autoridade é: fatos concretos E19.2/E20.2 definem a realidade da conta, oferta e LP; pesquisa integral fornece contexto consultivo; E18.4 fornece limites universais; E19.3 autoriza, organiza e transporta; E19.4 decide narrativa, estrutura, copy e candidata.
- A pesquisa nunca pode ampliar ou contradizer a oferta concreta; em conflito, a configuração concreta prevalece.
- Não haverá camada intermediária que resuma, atomize ou selecione semanticamente pesquisa + fatos antes da E19.4.
- `business_buyer` não é requisito da geração da LP `end_customer`; E10.8 pode permanecer para consumidores independentes, mas fica fora do caminho E19.3 → E19.4.
- A E19.4 consome diretamente `identities + modelContext + serverContext` da E19.3 e não conhece path, representação interna ou lifecycle da pesquisa integral.
- A IA sintetiza o público efetivo a partir da pesquisa `end_customer` e dos fatos concretos, sem criar perfil persistido novo.
- A LP deve possuir começo, desenvolvimento e conversão; AIDA pode servir como referência persuasiva, não como schema rígido.
- A IA pode decidir quantidade de seções, sequência, função narrativa, copy, CTA textual, omissões, repetições legítimas e layout entre opções suportadas pelo contrato estrutural.
- O sistema permanece responsável por autorização, fatos e evidências disponíveis, tipos estruturais, limites absolutos, bindings, destinos, consentimento, credenciais, segurança tenant-aware, schema, materialização, snapshot, versões e renderer.
- A IA não gera HTML, CSS, React, JavaScript, scripts, componentes desconhecidos, credenciais, webhooks ou estruturas fora do contrato suportado.
- Header e Footer pertencem ao mesmo contrato estrutural da candidata; não haverá shell estrutural paralelo.
- A E19.4 deve usar uma única fonte canônica de estrutura, da qual sejam derivadas as projeções necessárias para Structured Output, validação, materialização e renderer.
- A simplicidade do MVP limita a amplitude do repertório, não a qualidade visual: o primeiro repertório deve ser curado e pequeno o suficiente para ser confiável, mas bom o suficiente para produzir LP competitiva e capaz de encantar mesmo no plano inicial.
- A v1 fecha conceitualmente o repertório inicial como formas de apresentação, não módulos narrativos obrigatórios: Header, Hero visual, texto + mídia, cards/grid, steps, FAQ, CTA e Footer; fields, variantes, cardinalidades e layouts exatos ficam para a v2.
- A primeira geração textual usa uma única chamada por tentativa para estrutura + narrativa + copy, sem retry textual automático dentro da mesma tentativa; nova tentativa é explícita. A geração de imagem é operação de mídia separada e não cria uma segunda etapa textual de “planejar + escrever”.
- A primeira LP real não abre mão de imagem: a autoridade estrutural deve admitir pelo menos um visual principal e não impor artificialmente que toda LP use exatamente uma única imagem; cardinalidades adicionais dependem de qualidade e performance.
- `brand_logo_asset` permanece semanticamente exclusivo para logo. A imagem gerada pela própria E19.4 é saída do workload, não entrada E20.2; portanto, este teste não exige novo field E20.2 apenas para acomodar mídia gerada.
- Na primeira prova, se não existir asset autorizado e adequado do cliente disponível no fluxo vigente, a E19.4 está autorizada a gerar a imagem necessária por IA antes da materialização.
- A mídia efetivamente usada precisa possuir referência canônica persistente antes do congelamento da materialização; o projeto ainda não possui Storage/bucket/Blob/URL canônicos para assets, portanto o mecanismo mínimo de persistência de mídia é gap técnico real a fechar antes da execução.
- Performance de carregamento é requisito da primeira solução de mídia; formato, compressão, dimensões, cache/CDN e orçamento exato de peso ficam para a v2.
- Imagem gerada não pode sugerir como fato real imóvel específico ofertado, pessoa/cliente real, credencial, resultado, localização exata, propriedade do negócio, prova social, condição comercial ou outro fato não autorizado.
- A auditabilidade mínima da mídia deve permitir identificar origem (`fornecida` ou `gerada`), referência canônica do asset materializado, workload/configuração quando gerada e versão do brief/prompt visual, sem raciocínio privado; shape exato fica para a v2.
- O ponto de congelamento vigente é a materialização write-once, não publicação: tentativas anteriores podem ser descartadas; após materializar uma candidata válida, imagem, copy ou estrutura daquela versão não são sobrescritas e nova versão preservada usa novo draft.
- Para a primeira prova do novo Cenário E, o draft piloto já materializado não será apagado, sobrescrito nem rebindado; será usada nova conta/piloto que percorra o fluxo existente E19.1 + E19.2 até chegar a uma LP legítima ainda não materializada, sem antecipar E19.5.
- O prompt de runtime será tratado como código versionado da feature, separado do contexto dinâmico validado da E19.3.
- Baseline humano inicial: `gpt-5.6-luna` com `reasoning.effort=max`, via Responses API e Structured Outputs; essa combinação é hipótese deliberada para medir qualidade/custo, não combinação vencedora definitiva.
- A geração textual da E19.4 é novo workload de produto e deve passar pela governança E21.1 antes da execução. O identificador canônico será reutilizado do histórico formal da E19.4.3 como `landing_page_draft_generation`; o registry atual ainda não possui esse workload e o contrato executável de `reasoningEffort` ainda não admite `max`, portanto a extensão deve ser aditiva e detalhada na v2.
- A mídia gerada por IA também deve ser governada e mensurável; a v2 decide se será workload separado ou operação especializada do workflow conforme a API escolhida.
- A rubrica humana da primeira prova fica aprovada na v1 com seis dimensões: adequação público/oferta; jornada persuasiva; qualidade/especificidade da copy; hierarquia/estrutura visual; qualidade/pertinência da imagem; clareza de CTA/conversão. Factualidade, segurança e funcionamento permanecem gates binários.
- Não há piso numérico de aprovação por enquanto; `6/10` e `7+` permanecem hipóteses não aprovadas até existir geração real avaliada.
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK e multi-agent ficam rejeitados para o recorte atual por ausência de necessidade demonstrada; qualquer reavaliação exige caso real posterior.
- O prompt seguirá abordagem `outcome-first`, sem pedir cadeia de raciocínio privada.
- O Gestor de Automação classificou formalmente a E19.4.3 como `2.1.3 — Automação com IA em fluxo controlado`, com ambiente principal `2.2.1 — Runtime do LP Factory`, OpenAI API como plataforma dependente e sem comportamento agentic.

### 1.4. Fontes obrigatórias do novo debate

- `README.md`.
- `docs/prompt-estrategista.md`.
- `docs/template-roadmap.md`.
- `docs/roadmap.md`.
- `docs/lp-planejamento.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `docs/lousa-plano-base-e19-3.md` como contrato da única entrada de domínio da E19.4.
- `docs/lousa-plano-base-e19-2.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e18-4.md`.
- `docs/template-prompts.md`.
- `docs/template-prompts-gpt-5-6.md`.
- `docs/openai-model-snapshot.md`.
- `docs/gestor-automations.md` e `docs/automations.md`.
- Contratos vigentes de `lib/openai-workloads/`.
- PR #720 como fonte histórica do identificador canônico `landing_page_draft_generation` usado formalmente pela E19.4.3 anterior.
- PR #726 e `docs/lousa-plano-base-e19-5.md` somente como fonte conceitual da sucessora E19.5 Light.
- Artefatos SQL da materialização E19.4 preservados pelo PR #729, somente como fonte real já existente para o debate de persistência.
- Leitura read-only do Supabase hospedado de 17/08/2026 apenas como evidência factual do estado atual do draft piloto, materialização e ausência de buckets Storage.

### 1.5. Questões ainda abertas e não decididas

- Fields, variantes, cardinalidades e layouts exatos do repertório estrutural aprovado na v1.
- Qual é o menor mecanismo real de persistência e entrega da mídia gerada antes da materialização, verificando primeiro se Supabase Storage atende o recorte sem criar complexidade ou infra paralela.
- Qual visibilidade o asset da primeira prova terá: público, privado ou referência interna resolvida pelo renderer.
- Quais limites de peso, dimensões, formatos, otimização e cache/CDN serão exigidos para preservar carregamento rápido.
- Configuração efetiva do workload `landing_page_draft_generation` na governança E21.1, incluindo extensão aditiva de `reasoningEffort` para `max` e observabilidade correspondente.
- Se a mídia gerada será registrada como segundo workload ou como operação especializada do workflow textual.
- Se algum metadata mínimo e seguro derivado de `identities` ou `serverContext` precisa ser projetado ao modelo para decisão estrutural.
- Schema exato do Structured Output da candidata única.
- Quais referências de pesquisa/fatos a candidata deve devolver para permitir validação sem exigir provenance cognitiva ou cadeia de raciocínio.
- Quais métricas e casos representativos permitirão comparar posteriormente qualidade, custo, latência e consumo do baseline `gpt-5.6-luna + max` com alternativas.
- Versão e shape exatos do snapshot, incluindo auditabilidade de mídia.
- Se a rota histórica privada de preview será reutilizada sem mudança material de contrato.
- Como operacionalizar a nova conta/piloto pelo fluxo existente sem criar nova arquitetura.
- Critérios visuais/responsivos/performance objetivos complementares à rubrica humana.
- Qual parte da futura diferenciação de capacidades por plano precisa apenas ser preservada como direção de produto.

### 1.6. Direção aprovada — E → E19.5 Light → iterações

- Prosseguir somente com o Cenário E até existir E19.4 funcional ponta a ponta: novo piloto legítimo → taxon preparado + LP concreta configurada → E19.3 válida → uma chamada textual de geração → candidata estruturada → geração/resolução de mídia necessária → validação → materialização → renderer → preview privado.
- Não reutilizar o draft `Primeiro imóvel no Rio` para a nova materialização.
- Não implementar E19.4 D antes de E e não manter D como comparação obrigatória.
- A E19.3 do Cenário E já foi concluída e provada; a E19.4 deve consumir seu contrato v3 sem reabrir inteligência intermediária.
- Após a E19.4 funcional, E19.5 Light deverá permitir novos `drafts` independentes E1/E2/E3, sem overwrite e sem conhecer a representação interna da pesquisa.
- O contrato detalhado da E19.5 Light pertence ao documento e ao debate próprios.

### 1.7. Matriz do debate — decisões, hipóteses e preservação de substância

| Tema | Registro do debate | Estado | Aplicação neste recorte | Destino / preservação |
|---|---|---|---|---|
| Autoridade estrutural única | Header, Footer, seções, layouts, campos e interações pertencem à mesma autoridade; Structured Output, validator, materialização e renderer derivam dela. | Decisão aceita | Sim | Fechar contrato exato na v2 sem segunda fonte paralela. |
| Renderer × capacidade autorizada | O renderer executa a composição; o “cardápio” permitido pertence à autoridade estrutural/produto, não a regra escondida no renderer. | Decisão aceita | Sim | Não duplicar lógica comercial no renderer. |
| Qualidade do plano inicial | Plano inicial pode ter repertório menor, mas não qualidade visual inferior. | Decisão humana | Sim | Gate visual da primeira prova. |
| Capacidade disponível ≠ composição usada | A autoridade pode oferecer mais estruturas/layouts do que a IA utiliza em uma LP. | Decisão aceita | Sim | Não obrigar uso de todas as capacidades. |
| Contexto entregue ao modelo | Instruções estáveis + `modelContext` E19.3 + autoridade estrutural; `serverContext` bruto fora do prompt. | Decisão aceita | Sim | Projeções seguras exatas na v2. |
| Repertório estrutural v1 | Formas disponíveis: Header, Hero visual, texto+mídia, cards/grid, steps, FAQ, CTA e Footer; não são módulos narrativos obrigatórios. | Decisão humana | Sim | Fields, variantes, cardinalidades e layouts na v2. |
| Uma chamada textual | Uma chamada por tentativa produz estrutura + narrativa + copy, sem retry textual automático; mídia é operação separada. | Decisão humana | Sim | Nova tentativa é explícita; reabrir desenho só diante de deficiência concreta. |
| Classificação da automação | E19.4.3 é `2.1.3 — Automação com IA em fluxo controlado`, no `2.2.1 — Runtime do LP Factory`, com OpenAI API dependente e sem comportamento agentic. | Parecer formal do Gestor aceito | Sim | Fechado na v1. |
| Structured Output da candidata | Um único DTO; sem `narrativePlan` separado, justificativa de composição ou raciocínio privado. | Decisão aceita | Sim | Schema exato na v2. |
| Logo | `brand_logo_asset` permanece exclusivo para logo. | Decisão humana + fato de runtime | Quando houver logo | Não virar contêiner genérico de imagens. |
| Imagem na primeira LP | Pelo menos um visual principal pertinente; não limitar toda LP a exatamente uma imagem. | Decisão humana | Sim | Cardinalidades/layouts na v2. |
| E20.2 × imagem gerada | Imagem criada pela E19.4 é saída, não input E20.2. | Decisão confirmada | Sim | Novo field só quando houver imagem fornecida/selecionada como entrada real. |
| Fallback da imagem | Sem asset adequado do cliente, E19.4 pode gerar imagem por IA. | Decisão humana | Sim | Etapa controlada de mídia. |
| Factualidade da mídia | Mídia não pode sugerir imóvel, pessoa, credencial, resultado, localização, prova social ou fato não autorizado como real. | Decisão humana | Sim | Prompt + gate humano; validação determinística quando comprovável. |
| Auditabilidade da mídia | Snapshot deve identificar origem, referência do asset, configuração/workload quando gerada e versão do brief/prompt visual. | Decisão humana | Sim | Shape exato na v2; sem raciocínio privado. |
| Persistência da mídia | Mídia precisa de referência canônica tenant-safe e estável antes da materialização. Hoje não há bucket Storage. | Gate técnico confirmado | Sim | Avaliar primeiro Supabase Storage; mecanismo e visibilidade na v2. |
| Performance da mídia | Peso, dimensões, formato, otimização e cache/CDN são parte da qualidade técnica. | Requisito humano | Sim | Limites exatos na v2. |
| Workload OpenAI E19.4 | A geração textual usa o identificador canônico histórico `landing_page_draft_generation`, sujeito à E21.1; registry atual não o possui e `reasoningEffort` ainda não admite `max`. | Gate de governança confirmado | Sim | v2 registra o workload, extensão aditiva para `max`, configuração e observabilidade. |
| Governança da mídia IA | Mídia gerada também precisa ser mensurável e governada. | Decisão aceita | Sim | v2 decide workload separado ou operação especializada. |
| Baseline de IA | `gpt-5.6-luna + reasoning.effort=max`, Responses API e Structured Outputs. | Decisão humana | Sim | Medir qualidade, custo, tokens e latência; não declarar vencedor definitivo. |
| Claims e factualidade | Validar deterministicamente apenas o comprovável; linguagem livre sem prova confiável fica limitada pelo prompt e gate humano. | Decisão aceita | Sim | Sem segunda engine semântica. |
| Rubrica humana de qualidade | Seis dimensões: público/oferta; jornada; copy; estrutura visual; imagem; CTA/conversão. Factualidade, segurança e funcionamento são gates binários. | Decisão humana | Sim | Método de registro na v2. |
| Piso numérico | `6/10` e `7+` foram hipóteses do Analista. | Não aprovado | Não | Só reconsiderar após geração real avaliada. |
| Benchmark e auditabilidade | Relacionar resultado a `promptVersion`, versão estrutural, modelo, effort, tokens, latência, custo e notas humanas. | Decisão aceita | Sim | Shape/registro na v2. |
| Materialização | `account_landing_page_materializations` é 1:1/write-once e já está aplicada no Supabase hospedado. | Fato confirmado | Sim | Reutilizar agregado; avaliar somente adequação do shape ao Cenário E. |
| Draft piloto já materializado | `Primeiro imóvel no Rio` já possui materialização e está vinculado à configuração E19.2 atual. | Bloqueio factual confirmado | Sim | Não apagar, sobrescrever ou rebindar. |
| Novo piloto para a prova | Usar nova conta/piloto pelo fluxo existente E19.1 + E19.2 até LP ainda não materializada. | Decisão humana | Sim | Não antecipar E19.5. |
| Tentativa × materialização | Antes da materialização, tentativas podem variar; depois, imagem/copy/estrutura daquela versão não são sobrescritas. | Decisão humana | Sim | Nova versão preservada usa novo draft. |
| Preview privado | Rota histórica tenant-aware/read-only é candidata natural a reutilização. | Direção convergente | Sim | Confirmar na v2; não inventar rota sem gap. |
| Repertório por plano | Planos futuros podem autorizar repertórios diferentes sem obrigar uso integral. | Direção de produto | Não agora | Preservar em 4.4. |
| Cliente substituir/adicionar seções | Futuro cardápio de personalização dentro do plano. | Oportunidade futura | Não | Recorte próprio; não atribuir automaticamente à E19.5. |
| Biblioteca de assets | Biblioteca tenant-aware de logos/imagens próprias reutilizáveis. | Oportunidade futura | Não | Recorte próprio. |
| Estratégia híbrida de imagens | Asset próprio + IA + importação/licenciamento externo conforme direitos e qualidade. | Oportunidade futura | Só IA nesta prova | Não abrir integração externa agora. |
| Admin Dashboard | `/admin/estrutura-lp` como projeção read-only das capacidades reais por plano. | Direção futura | Não é Gate | Sem segundo dashboard/fonte de verdade. |
| Capacidades avançadas GPT-5.6 | Programmatic Tool Calling, persisted reasoning, caching avançado, Agents SDK e multi-agent. | Rejeitados no recorte atual | Não | Reavaliar somente diante de necessidade real posterior. |

## 2. Contrato do caso

### 2.1. Fluxo lógico em construção

- Gatilho:
  - ação humana explícita na jornada operacional da nova conta/piloto inicia a geração.
- Entrada:
  - LP legítima em `draft`, ainda não materializada, e configuração E19.2 completa nos fields aplicáveis da E20.2;
  - taxon previamente preparado;
  - sucesso integral da E19.3;
  - configuração OpenAI `landing_page_draft_generation` autorizada pela governança E21.1.
- Processamento:
  - revalidar autorização antes do provider;
  - obter o pacote E19.3 sem reler diretamente suas fontes internas;
  - construir a requisição a partir do prompt canônico versionado, `modelContext` e autoridade estrutural;
  - realizar uma única chamada textual para estrutura + narrativa + copy, sem retry textual automático;
  - produzir candidata dentro da fonte estrutural canônica e indicar necessidade/posição da mídia;
  - quando faltar asset adequado, gerar mídia em etapa controlada;
  - persistir/resolver referência canônica da mídia escolhida;
  - combinar deterministicamente destinos, bindings, assets e demais valores server-side;
  - validar candidata e mídia antes da materialização.
- Validação:
  - aplicar regras determinísticas somente ao objetivamente comprovável;
  - validar referência, tipo e presença da mídia exigida;
  - separar validação estrutural/factual dos gates humanos editorial/visual.
- Persistência:
  - reutilizar o agregado de materialização existente;
  - adicionar somente mecanismo mínimo de persistência de mídia comprovadamente necessário;
  - não criar nova tabela ou infraestrutura ampla de assets sem gap real.
- Consumo:
  - renderer privado/read-only reproduz a LP a partir do estado materializado e das referências congeladas de mídia.
- Fallback:
  - falha de autorização, contexto, workload, provider, mídia, schema ou validação não materializa candidata;
  - não trocar modelo, effort ou schema silenciosamente;
  - nova tentativa textual é sempre uma nova tentativa explícita.

### 2.2. Papel da IA

- Interpretar `modelContext` integral preservando precedência dos fatos concretos.
- Sintetizar público efetivo, oferta, estágio do funil e ação desejada.
- Escolher progressão persuasiva sem fórmula rígida.
- Planejar quantidade, sequência e função narrativa dentro do repertório permitido.
- Escolher layouts apenas entre alternativas suportadas.
- Decidir função e necessidade de mídia dentro das capacidades suportadas.
- Produzir copy, headings, supporting copy, CTA textual, FAQs e conteúdos admitidos.
- Quando necessário, orientar/produzir a imagem sem representar como fato concreto aquilo que não é autorizado.
- Omitir conteúdo sem função comercial e repetir CTA/argumento apenas quando houver função legítima.
- Não inventar credenciais, resultados, depoimentos, garantias, escassez, preços, benefícios ou capacidades.

### 2.3. Papel determinístico do LP Factory

- Autorizar ator, conta, membership e entitlement.
- Resolver e entregar o pacote E19.3.
- Definir fonte estrutural finita e derivar projeções para IA, validator, materialização e renderer.
- Manter `serverContext` bruto fora da matéria-prima textual e usá-lo deterministicamente.
- Resolver bindings, consentimento, credenciais e referências técnicas.
- Governar o workload `landing_page_draft_generation` pela fundação E21.1.
- Persistir/resolver mídia pelo boundary autorizado e validar a referência materializada.
- Validar schema, tipos, cardinalidades, limites, identidades, componentes e propriedades suportadas.
- Bloquear factualidade objetivamente inválida quando comprovável.
- Materializar consistentemente, congelar snapshot suficiente e renderizar deterministicamente.
- Falhar fechado diante de versão, componente, layout, mídia ou payload não suportado.

### 2.4. Prompt e workflow de geração

- O runtime E19.4 é o workflow; o prompt é o contrato de inteligência da etapa textual.
- O prompt será derivado de `docs/template-prompts.md` e complementado por `docs/template-prompts-gpt-5-6.md`.
- O prompt de produção será versionado como código próximo da feature consumidora, sem engine genérica.
- Instruções estáveis permanecem separadas do contexto dinâmico validado.
- A v1 fecha uma única chamada textual por tentativa e nenhum retry textual automático dentro da mesma tentativa.
- A primeira prova usa Responses API, Structured Outputs e `gpt-5.6-luna + reasoning.effort=max`.
- Antes da execução, a governança E21.1 deve possuir o workload efetivo `landing_page_draft_generation` compatível com a configuração aprovada.
- Validator e regras de negócio permanecem no código.
- A geração de imagem é etapa de mídia separada, não segunda etapa semântica de planejamento/redação.
- Tokens, timeout e observabilidade exata ficam para a v2; o identificador canônico do workload já está fechado.
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK, multi-agent e tools externas não entram no recorte atual.

### 2.5. Fonte estrutural canônica e projeções derivadas

- Uma única fonte canônica, finita e versionada controla a forma da candidata.
- Repertório conceitual v1:
  - Header;
  - Hero visual;
  - texto + mídia;
  - cards/grid;
  - steps;
  - FAQ;
  - CTA;
  - Footer.
- Essas formas não impõem capítulos narrativos nem ordem fixa; a IA escolhe o subconjunto e a sequência com função comercial.
- Structured Output, validação, estado materializado e renderer são projeções derivadas da mesma autoridade.
- A primeira autoridade exige capacidade para pelo menos um visual principal.
- O contrato referencia mídia; não transforma E20.2 em storage e não embute binário de imagem na candidata.
- HTML/CSS/JS livre e componente desconhecido continuam proibidos.
- Diferenciação completa por plano e edição posterior ficam em 4.4.

### 2.6. Jornada persuasiva

- A LP é sequência comercial completa, não preenchimento independente de blocos.
- Hero confirma relevância e gera interesse.
- Corpo desenvolve entendimento, valor percebido, desejo, confiança e objeções.
- CTA pode aparecer cedo e repetir-se quando a narrativa justificar.
- AIDA é referência, não schema.
- A sequência reflete público efetivo, oferta concreta e estágio do funil presentes no pacote E19.3.

### 2.7. Factualidade, pesquisa e evidência

- E19.2/E20.2 define realidade concreta; pesquisa fornece contexto e não amplia oferta/capacidades.
- Fato declarado não se torna automaticamente prova verificada.
- Claims de resultado, garantia, escassez, credencial verificada, prova social ou comparação objetiva só entram com suporte real autorizado.
- Imagem gerada não pode apresentar como real imóvel específico disponível, pessoa/cliente, credencial, resultado, localização exata, propriedade, prova social ou outro fato não autorizado.
- Estrutura, bindings, versões, cardinalidades, referências e evidências estruturadas são validados deterministicamente quando possível.
- Linguagem livre sem mecanismo confiável de prova é limitada pelo prompt e avaliada no gate humano; não criar segunda engine semântica.
- Não exigir cadeia de raciocínio.

### 2.8. Materialização, snapshot e renderer

- `account_landing_page_materializations` está aplicada no Supabase hospedado e já contém uma materialização; `docs/schema.md` foi reconciliado pelo PR #760 e não há pendência de apply da tabela.
- O estado materializado deve reproduzir a LP sem reler E19.3 ou fontes mutáveis.
- Mídia usada deve estar persistida e possuir referência estável antes da materialização; `content_json` congela a referência, não o binário bruto.
- O snapshot preserva identidades, versões, configuração do workload, contexto exposto e auditabilidade mínima da mídia: origem, referência, workload/configuração quando gerada e versão do brief/prompt visual.
- Não armazenar raciocínio privado.
- Renderer consome projeção derivada da mesma fonte estrutural canônica.
- Aparência, Header, Footer, seções, layouts, conteúdo e mídia são reproduzidos deterministicamente.
- O renderer não vira segunda fonte de regras comerciais.
- Shape exato de conteúdo/snapshot fica para a v2.

## 3. Fases e próxima ação

### 3.1. E19.4.3 — Geração controlada e validação integral da candidata

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: `2.1.3 — Automação com IA em fluxo controlado`.
- Ambiente principal: `2.2.1 — Runtime do LP Factory`.
- Plataforma dependente: OpenAI API.
- Comportamento agentic: não.
- Objetivo:
  - transformar pacote E19.3 em candidata completa por uma única chamada textual, com mídia necessária e validação antes da persistência.
- Dependências anteriores à execução:
  - nova conta/piloto pelo fluxo existente E19.1 + E19.2;
  - LP legítima ainda não materializada;
  - taxon preparado;
  - E19.3 aprovada;
  - workload `landing_page_draft_generation` governado pela E21.1 e compatível com `gpt-5.6-luna + max`.
- Questões indispensáveis ainda abertas:
  - fields/variantes/layouts/cardinalidades exatos do repertório;
  - prompt canônico e schema exato;
  - configuração/observabilidade efetiva do workload E21.1, incluindo suporte aditivo a `max`;
  - mecanismo de mídia e visibilidade do asset;
  - decisão da v2 entre workload próprio de mídia ou operação especializada;
  - casos representativos e registro da rubrica.
- Baseline decidido:
  - uma chamada textual por tentativa, sem retry textual automático;
  - `landing_page_draft_generation`;
  - `gpt-5.6-luna + reasoning.effort=max`;
  - Responses API;
  - Structured Outputs;
  - geração de imagem quando faltar asset adequado.

### 3.2. E19.4.4 — Materialização inicial e snapshot imutável

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: não, salvo nova decisão baseada em necessidade real.
- Objetivo:
  - persistir a primeira candidata válida em estado reproduzível, com mídia estável e snapshot coerente.
- Questões indispensáveis ainda abertas:
  - adequação do shape dos artefatos SQL existentes ao Cenário E; apply da tabela não é pendência;
  - mecanismo mínimo de persistência/entrega da mídia;
  - avaliação de Supabase Storage;
  - visibilidade do asset;
  - requisitos exatos de performance;
  - versão/shape de `content_json` e snapshot;
  - concorrência e write-once.

### 3.3. E19.4.5 — Visualização privada e prova humana da primeira LP real

- Status: rascunho; fase ainda não consolidada para execução.
- Automação: não.
- Objetivo:
  - renderizar privadamente a LP materializada e avaliar estrutura, narrativa, copy, factualidade, CTA, acessibilidade, mídia, carregamento e qualidade visual.
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
- Não há piso numérico de aprovação nesta etapa.
- Questões ainda abertas:
  - confirmação da rota histórica de preview;
  - contrato exato do renderer;
  - critérios objetivos de responsividade/performance;
  - forma de registrar as notas.

### 3.4. Próxima ação do debate

- Não reutilizar `Primeiro imóvel no Rio` para a nova prova; preparar novo piloto somente após a v1 estar consolidada, usando o fluxo existente e sem antecipar E19.5.
- Não reabrir E20.2 apenas para mídia gerada; voltar à E20.2 somente se surgir input factual prévio real.
- A classificação formal do Gestor de Automação está fechada na v1; a v2 materializa os patches E21.1 e o tratamento governado da mídia.
- Fechar na v2 os contratos técnicos ainda abertos: autoridade estrutural exata, configuração do workload E21.1, persistência/visibilidade/performance de mídia, Structured Output, snapshot e preview.
- Quando a LP não atingir qualidade desejada, diagnosticar nesta ordem: E19.4; pesquisa; E20.2 quando faltar dado factual; E19.3 somente diante de gap real de autorização/transporte.
- Não atualizar `docs/roadmap.md` enquanto este arquivo permanecer rascunho vivo.
- Não iniciar implementação da E19.4 antes da consolidação da v1.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora da E19.4 neste momento

- preparação do taxon e implementação E19.3;
- publicação pública, domínio customizado e disponibilidade comercial;
- tracking, analytics, CRM, Ads, A/B test e engine de experimentos;
- implementação da E19.5 Light dentro deste recorte;
- editor visual, edição manual ampla, histórico e rollback;
- personalização pós-geração pelo cliente;
- matriz comercial completa de capacidades por plano;
- nova superfície administrativa exclusiva para capacidades do renderer;
- Cenário D;
- consulta direta da IA às fontes internas fora do pacote E19.3;
- reintrodução de E18.5, E20.3 ou E10.8 como gate;
- camada intermediária de resumo/atomização/seleção semântica;
- HTML/CSS/React/JS livre ou componentes arbitrários gerados;
- catálogo estrutural amplo antecipado;
- biblioteca ampla de assets, upload/seleção pelo cliente, galeria completa, DAM, busca/importação externa ou banco de imagens;
- novo field E20.2 apenas por mídia gerada pela E19.4;
- editor pré-publicação que mute materialização write-once já congelada;
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK, multi-agent, job, fila, cron, webhook, browsing ou tools externas sem necessidade;
- nova infraestrutura além do mínimo comprovadamente necessário para mídia;
- perfil persistido novo de público/persona/estratégia.

### 4.2. Critérios de parada imediata

- Parar se E19.3 faltar informação indispensável sem fonte autorizada.
- Parar se a solução tentar compensar pesquisa insuficiente com RAG/chunking/ranking/allowlist sem evidência.
- Parar se o contrato estrutural crescer por extensibilidade hipotética.
- Parar se a IA precisar inventar fatos, evidências, credenciais, destinos ou capacidades.
- Parar se a mídia não puder ser persistida/referenciada estavelmente antes da materialização.
- Parar se a materialização exigir releitura de fontes mutáveis.
- Parar se a solução tentar sobrescrever/rebindar o draft piloto já materializado.
- Parar se surgir agente, automação adicional, engine ou infraestrutura não sustentada por fonte real.
- Toda mudança material de escopo ou categoria de automação volta ao humano antes da v1.

### 4.3. Critério provisório de conclusão do recorte

- A E19.4 é funcionalmente concluída quando uma LP real do fluxo oficial:
  - nasce de novo piloto legítimo e LP ainda não materializada;
  - é gerada a partir do pacote E19.3 por uma chamada textual governada;
  - apresenta jornada comercial coerente;
  - respeita fatos, pesquisa, limites e evidências;
  - utiliza pelo menos uma imagem principal pertinente, estável e factualmente segura;
  - preserva carregamento e responsividade aceitáveis;
  - é materializada integralmente em `draft`;
  - é reproduzida privadamente por renderer determinístico;
  - é avaliada pelas seis dimensões humanas, com factualidade, segurança e funcionamento aprovados como gates binários.
- Não exige estabilização final de prompt/modelo/effort/visual; iterações posteriores podem continuar após E19.5 Light.
- Não há piso numérico global nesta primeira prova.

### 4.4. Substância preservada para recortes futuros

- Repertório autorizado por plano pode crescer sem reduzir qualidade do plano inicial.
- Quantidade de capacidades disponíveis não define quantidade de seções usadas pela IA.
- Cliente poderá futuramente substituir/adicionar/remover seções e escolher variantes dentro do plano.
- Diferenciação comercial permanece separada do renderer.
- `/admin/estrutura-lp` permanece destino natural para projeção read-only das capacidades reais por plano, sem segunda fonte de verdade.
- Planos Pro/Ultra podem futuramente incorporar galerias, vídeo, comparadores, interações e animações com caso real.
- Conta poderá possuir biblioteca tenant-aware de assets reutilizáveis; não criar uma tabela por cliente.
- Quando existir upload/seleção de imagem pelo cliente antes da geração, avaliar field E20.2 específico; `brand_logo_asset` continua dedicado à logo.
- Estratégia de mídia futura pode ser híbrida: asset próprio, IA e importação/licenciamento externo com direitos/proveniência.
- Lifecycle futuro pode permitir experimentar imagem/copy/estrutura antes de congelamento; contrato atual congela na materialização.
- Supabase Storage é primeiro candidato para mídia por aderência à stack, sem decisão de plataforma antes da v2.
- Solução futura deve preservar performance por formato, dimensões, compressão e cache/CDN.
- Capacidades GPT-5.6 avançadas permanecem fora do recorte atual e só voltam a ser avaliadas diante de necessidade real.
- Ao consolidar v1, esta subseção mantém apenas oportunidades relevantes sem recorte próprio.

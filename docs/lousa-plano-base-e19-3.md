09/08/2026 — Plano-base v1 — E19.3 — Contrato e composição determinística do contexto de geração

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1.
- Recorte: `E19.3 — Contrato e composição determinística do contexto de geração`.
- Plano conceitual: N/A.
- O debate conceitual foi encerrado com os Gates 1, 2 e 3 fechados.
- O recorte sucessor previsto é `E19.4 — Geração e materialização da landing page em draft`.
- A E19.4 só deve ser debatida em detalhe após a E19.3 estar implementada e validada.

### 1.2. Objetivo

- Implementar o menor compilador determinístico universal capaz de receber uma `landing_page` legítima já configurada pelo fluxo oficial e produzir, server-side, um pacote completo, autorizado e testável para o consumidor seguinte.
- O compilador resolve estrutura efetiva, módulos, variantes, ordem, fields, bindings, fontes, fatos, evidências, guidance, limites e proveniência a partir dos contratos canônicos vigentes.
- A E19.3 termina com esse pacote determinístico; não chama OpenAI, não gera copy, não materializa conteúdo e não renderiza a landing page.
- O algoritmo deve permanecer universal para qualquer taxon, plano e LP admitidos pelos contratos vigentes; diferenças de nicho entram somente pelas fontes canônicas responsáveis por elas.

### 1.3. Fontes obrigatórias

- `README.md`.
- `docs/lp-planejamento.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/prompt-estrategista.md`.
- `docs/prompt-executor.md`.
- Planos-base e implementação vigentes de E10.8, E18.4, E18.5, E20.2, E20.3, E19.1 e E19.2.
- Repositório `AlcinoAfonso/LP-Factory-10`.

### 1.4. Responsabilidades preservadas

- E10.8 permanece responsável pelo contexto de pesquisa resolvido, incluindo `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
- E18.4 permanece responsável pela parametrização raiz de `landing_page`.
- E18.5 permanece responsável por módulos, variantes, fields, cardinalidades, policies, suporte, evidência e bindings.
- E20.2 permanece responsável pelo catálogo declarativo de entradas e por qualquer relação focal necessária entre seus próprios inputs e slots abstratos consumidos.
- E20.3 permanece responsável pelo perfil de orientação versionado.
- E19.2 permanece responsável pelos valores concretos configurados e pela associação ao `draft`.
- E9 permanece responsável por entitlement e plano efetivo.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho: invocação server-side explícita do compilador para obter o pacote determinístico de uma LP legítima já configurada.
- Entrada: LP legítima já configurada pela E19.2, com taxon e plano efetivos resolvidos e fontes canônicas acessíveis.
- Processamento: resolver contratos vigentes → selecionar estrutura → autorizar contexto → montar pacote determinístico.
- Validação: aplicar falha fechada para inconsistências, ambiguidades e ausências obrigatórias.
- Persistência: nenhuma nova. A proveniência integra a própria saída lógica do compilador; qualquer necessidade de persistência durável descoberta na execução deve voltar ao Estrategista e não pode ser criada implicitamente.
- Consumo: a saída real da E19.3 será a entrada da futura E19.4.
- Fallback: somente os fallbacks explicitamente autorizados pelos contratos; heurística ou default inventado são proibidos.

### 2.2. Gate 1 — seleção estrutural

- `P1 > P2 > P3` representa prioridade relativa, não obrigatoriedade ou quota.
- Recomendações válidas da E20.3 entram como candidatas e a ordem efetiva preserva `recommendedOrder` entre módulos selecionados.
- Contrato inválido, identidade inexistente, versão incompatível, root incompatível ou inconsistência estrutural falham fechados.
- Contexto legítimo que não satisfaça requisito explícito de uma variante torna somente essa variante inelegível.
- Variante preferencial elegível é usada; se ausente ou inelegível e existir exatamente uma alternativa elegível, usar a alternativa.
- Mais de uma alternativa elegível sem preferência válida falha por ambiguidade; nenhuma alternativa elegível por contexto legítimo permite omitir o módulo.
- Fallback só ocorre por compatibilidade explicitamente verificável.
- Quando a variante efetiva divergir da recomendada, preservar a recomendação original, a causa objetiva da inelegibilidade e a variante efetiva.
- Antes da execução, validar o perfil real da primeira prova; ambiguidade real é gap do contrato/perfil, nunca motivo para fallback improvisado.

### 2.3. Gate 2 — autorização do contexto

- Regra-base: reutilizar relação estruturada existente → identificar gap concreto → acrescentar somente a menor relação declarativa exigida pelo consumidor real.
- E10.8 entra por `researchPath`, `itemKeys` e demais relações explicitamente contratadas, nunca por julgamento livre de pertinência.
- E18.4 fornece apenas os parâmetros efetivamente necessários ao consumidor; regras exclusivamente visuais, responsivas ou de acessibilidade permanecem server-side quando não forem entrada real do contexto futuro de geração.
- E18.5 continua sendo a autoridade sobre `policy`, `copySourceMap`, suporte, cardinalidade, evidência e bindings.
- E20.3 fornece `generationGuidance` global e `itemGuidance` somente ao módulo correspondente.
- Um valor E20.2 só participa quando pertencer ao catálogo resolvido, estiver aplicável e válido e houver relação explícita que autorize seu consumo.
- Depois de autorizado, o fato pode ser transportado por `fieldKey`, valor e proveniência; `purpose` pode acompanhar como descrição, mas nunca autoriza seleção.
- O slot abstrato atualmente demonstrado é `applicable_capabilities`, consumido por `benefits`; implementar somente a relação mínima necessária aos inputs que realmente o sustentarem.
- A E19.3.3 não pode conter bindings nominais de nicho; a relação entre slot abstrato E18.5 e inputs concretos deve ser declarada na camada responsável da E20.2 resolvida.
- Para booleanos explicitamente autorizados a `applicable_capabilities`, `true` fornece suporte e `false` não fornece suporte para afirmar a capacidade; não generalizar preventivamente essa semântica.
- Inputs centrais já contratados, como `primary_service_or_offer` e `primary_service_or_offer_description`, podem integrar explicitamente o contexto factual global sem papel intermediário artificial.
- Dado obrigatório e aplicável ausente ou inválido falha fechado.
- Em `required_when_claimed`, ausência de suporte proíbe a afirmação factual correspondente sem eliminar automaticamente o field.
- Em `operational_required`, ausência da evidência impede produzir o field; se isso romper cardinalidade mínima, a variante pode tornar-se inelegível e o tratamento retorna ao Gate 1.

### 2.4. Gate 3 — interface lógica de saída

- A E19.3 produz conceitualmente apenas dois resultados possíveis: sucesso com pacote coerente ou falha determinística explícita.
- Em sucesso, o pacote contém duas partes lógicas; não antecipar schema físico, DTO definitivo ou persistência específica.
- Parte A — contrato determinístico da LP: identidade e versões necessárias, taxon e plano, root/preset, composição efetiva, variante recomendada e efetiva quando divergirem, ordem, fields, `semanticRole`, cardinalidades, `policy`, requisitos de suporte/evidência, bindings, proveniência e restrições aplicáveis.
- Parte B — matéria-prima autorizada para o consumidor futuro: limites editoriais projetados para o `semanticRole`, pesquisas e itens autorizados, fatos autorizados, suporte/evidência efetivamente disponível, tratamentos permitidos/restritos/proibidos e guidance aplicável.
- Parte A informa o que o sistema determinou e o que cada field exige; Parte B informa somente com quais informações autorizadas a futura E19.4 poderá cumprir esse contrato.
- A E19.3 não define o contrato da resposta da IA, Structured Output, prompt, modelo, validação pós-IA, materialização ou renderer.

### 2.5. Simplificação obrigatória

- A implementação esperada deve permanecer próxima de: ler contratos existentes → resolver seleção → filtrar autorização → montar saída determinística → validar.
- Não criar `factIdentity`, taxonomia geral de `contextRole`, registry de fatos, DSL, engine, framework genérico de resolvers ou matriz preventiva E18.5 ↔ E20.2 sem consumidor real.
- Crescimento motivado principalmente por generalizações sem consumidor atual é sinal para parar e simplificar.
- O desmembramento E19.3 → E19.4 não autoriza nova camada abstrata entre os recortes; E19.4 deve consumir diretamente o contrato real produzido pela E19.3.

## 3. Fases e próxima ação

### 3.1. E19.3.3 — Contrato e composição determinística do contexto de geração

- Status: planejado para execução.
- Automação: não.
- Objetivo: implementar integralmente o compilador determinístico descrito na seção 2 e seus testes, sem OpenAI.
- Implementação: reutilizar os contratos existentes e realizar somente o refinamento focal da E20.2 indispensável aos slots realmente consumidos pela primeira geração futura.
- Validação: cobrir seleção estrutural, variantes, ambiguidades, omissões legítimas, autorização de pesquisas e fatos, suporte/evidência, bindings, proveniência e sucesso/falha da interface lógica.
- Universalidade: demonstrar pelo algoritmo e pelos contratos vigentes, sem criar taxons, planos, slots ou fixtures fictícios apenas para provar extensibilidade futura.
- Critério de aceite: para qualquer LP válida admitida pelos contratos, produzir deterministicamente Parte A + Parte B coerentes; quando isso não for possível, falhar explicitamente sem heurística, pacote parcial silencioso ou regra nominal de nicho.
- Critério de primeira prova: validar o draft real destinado à primeira LP e confirmar que o perfil não cai em ambiguidade não resolvida.
- Fechamento documental: aplicar o Prompt ABC somente aos documentos canônicos materialmente afetados pela implementação; qualquer atualização posterior de `docs/roadmap.md` deve refletir apenas o estado realmente implementado.

### 3.2. Próxima ação

- Submeter o plano-base v1 completo aos especialistas previstos em `docs/prompt-estrategista.md` antes de qualquer implementação.
- Não iniciar o debate detalhado da E19.4 antes de a E19.3 estar implementada e validada.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- chamada à OpenAI ou qualquer geração de copy;
- escolha de modelo, prompt ou Structured Output da geração;
- contrato detalhado da resposta da IA;
- validação pós-IA;
- materialização do conteúdo gerado;
- renderer ou visualização da landing page;
- snapshot durável da LP materializada além da proveniência necessária à saída do compilador;
- publicação pública, domínio customizado, tracking, Analytics/dashboard, CRM, A/B test ou Google Ads;
- editor, regeneração, sistema de créditos, onboarding com IA, agente, memória de IA, job ou automação recorrente;
- nova capability comercial ou disponibilidade comercial `taxon + plano`;
- infraestrutura nova apenas para evolução futura;
- regra específica da conta piloto ou de um nicho dentro da E19.3;
- novo E18.6 apenas para acoplar módulos ao catálogo E20.2;
- catálogo ou matriz preventiva completa de bindings E18.5 ↔ E20.2;
- inferência de binding por `purpose`, nome de field ou semelhança textual;
- taxonomia geral de fatos, registry de `contextRole`, DSL ou framework genérico de resolvers sem consumidor real;
- antecipar na E19.3 o debate técnico detalhado da E19.4.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se a implementação exigir regra nominal de nicho dentro da E19.3.3.
- Parar se surgir ambiguidade que só possa ser resolvida por heurística ou default não contratado.
- Parar se faltar fonte canônica indispensável para estrutura, autorização ou binding.
- Parar se surgir necessidade de banco, rota, job, agente, automação, engine ou infraestrutura nova não autorizada por fonte real do projeto.
- Parar e simplificar se a maior parte do crescimento técnico vier de generalizações para consumidores futuros inexistentes.
- Tratar qualquer necessidade material de ampliar o escopo como nova decisão humana, não como extensão implícita da E19.3.

23/07/2026 — Plano-base E18.5 — Otimização do catálogo de módulos e variantes `landing_page`

Fontes: `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/prompt-executor.md`, `docs/prompt-abc.md`, `docs/template-roadmap.md`, `docs/lp-planejamento.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/lousa-plano-base-e18-4.md`, `docs/lousa-plano-base-e20-2.md`, conteúdo anterior deste path, PRs #590, #616, #617 e #618, pareceres do Gestor Estrutural e do Gestor de Updates desta orquestração, decisões humanas registradas em 23/07/2026, `lib/conversion-content/landing-page/`, `lib/conversion-content/landing-page/module-catalog/`, `lib/conversion-content/landing-page/input-catalog/`, `lib/conversion-content/index.ts` e scripts relacionados no `package.json`.

Versão: v2 consolidada após os quatro testes experimentais do PR #617 e os pareceres especializados da orquestração; pendente do gate do Analista.

Status: otimização planejada; o núcleo repo-only incorporado pelo PR #590 permanece como base material vigente; o PR #617 permanece aberto em draft, sem merge, como evidência comparativa.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Estado confirmado

- O PR #590 implementou e incorporou à `main` o catálogo repo-only da E18.5 com nove módulos e dez variantes.
- A implementação vigente possui registry versionado, resolver genérico, contratos TypeScript, schema Zod estrito, falha fechada, API pública mínima, clonagem, isolamento e imutabilidade profunda.
- O PR #617 executou quatro testes experimentais reais:
  - novo módulo `benefits@v1` com `benefits.standard@v1`;
  - nova variante `hero.form@v1`;
  - fontes combinadas de pesquisa e necessidade de suporte operacional;
  - contrato estrutural abstrato de formulário.
- Nenhum dos quatro testes exigiu alteração do resolver.
- A dificuldade de extensão ficou concentrada em contratos, registry, schema, listas paralelas, contagens e testes.
- A operação humana de adicionar identidades e definições permaneceu compreensível; o risco observado foi de manutenção distribuída e esquecimento de pontos paralelos.
- A busca no repositório não identificou consumidor operacional do namespace `landingPageModuleCatalog` fora do próprio boundary, dos exports, dos testes e da documentação.
- A ausência atual de consumidor não autoriza remover proteções que demonstraram valor estrutural nos quatro testes.
- A E18.4 permanece concluída e não será reformada neste recorte.
- A E20.2 permanece concluída e não será reaberta neste recorte.
- O PR #617 não será mergeado nem terá seus commits transportados integralmente para a `main`.
- O histórico Git e o conhecimento produzido pelos PRs #577, #590 e #617 devem ser preservados.
- Para este recorte, este plano-base mergeado pelo PR #616 é a fonte da verdade detalhada e normativa; `docs/lp-planejamento.md` fornece contexto conceitual amplo e não substitui, amplia ou redefine seus contratos, hipóteses, limites, testes ou critérios.

### 1.2. Direção aprovada

- Otimizar o recorte da E18.5 incorporado pelo PR #590, sem substituição integral da arquitetura.
- Preservar o núcleo executável que comprovou proteção e extensibilidade.
- Reduzir risco e custo de manutenção, não apenas quantidade de código.
- Tornar extensões comuns localizadas e menos dependentes de identidades, listas ou contagens paralelas.
- Incorporar como identidades permanentes no futuro PR material:
  - módulo `benefits@v1`;
  - variante `benefits.standard@v1`;
  - variante `hero.form@v1`.
- Planejar o catálogo com dez módulos e doze variantes após a implementação material.
- Manter E19, E20.2, E20.3, composição, conteúdo, persistência e renderer em seus recortes próprios.

### 1.3. Proteções obrigatórias

- Registry versionado como fonte canônica das definições vigentes.
- Resolver genérico, sem fallback aproximado e sem necessidade de alteração para extensão comum.
- Zod estrito e falha fechada para input e contrato inválidos.
- Contratos TypeScript tipados.
- Separação entre módulo, variante e fields.
- Compatibilidade com a parametrização raiz da E18.4.
- Resultado clonado, isolado e profundamente imutável.
- Casos negativos e regressões das proteções existentes.
- Registry e schema fora da API pública.
- API pública mínima.
- Ausência de fallback entre identidades, versões, presets ou perfis.

### 1.4. Otimizações autorizadas

- Remover contagens globais fixas de módulos, variantes e fields.
- Definir fontes de copy junto dos próprios fields.
- Remover o `switch` paralelo por path.
- Reduzir listas e identidades paralelas esquecíveis.
- Substituir regras Zod nominais por relações estruturais quando a relação for realmente genérica.
- Impedir que extensão comum exija ajuste nominal no resolver ou no schema genérico.
- Preservar testes específicos de contratos relevantes sem transformar números globais em regra arquitetural.
- Preferir menos pontos distribuídos de alteração, mesmo quando a quantidade total de arquivos não diminuir.

### 1.5. Hipóteses que permanecem abertas

- Derivar todas as identidades de um único descritor canônico.
- Unificar todos os modos de fontes em um único contrato.
- Remover `supportsPrimaryConversionForm`.
- Tornar `formContract` a única fonte canônica da compatibilidade com formulário.
- Validar ou cachear o registry canônico somente uma vez.
- Eliminar integralmente comparações com o registry canônico.
- O Executor material deve comparar essas alternativas e adotar somente as que:
  - reduzirem risco ou manutenção;
  - não criarem import circular;
  - não reduzirem falha fechada;
  - não enfraquecerem tipagem ou casos negativos;
  - não exigirem nova infraestrutura;
  - demonstrarem benefício real no diff ou nos testes.
- Validar ou cachear o registry uma vez permanece otimização condicional, sem ganho de desempenho comprovado e dependente de consumidor ou degradação mensurável.

### 1.6. Catálogo permanente planejado

- Estado futuro planejado:
  - dez módulos;
  - doze variantes.
- As nove identidades de módulo e dez variantes do PR #590 permanecem preservadas.
- As três novas identidades permanentes são `benefits@v1`, `benefits.standard@v1` e `hero.form@v1`.

### 1.7. Módulo `benefits@v1` e variante `benefits.standard@v1`

- Função:
  - apresentar benefícios sustentados por pesquisa e por capacidades, serviços ou ofertas reais.
- Estrutura conceitual:
  - título;
  - coleção controlada de benefícios;
  - cada benefício contém título e descrição.
- Pesquisa pode orientar intenção, desejo, crença e objeção.
- Pesquisa não comprova capacidade operacional.
- Afirmação factual exige suporte operacional aplicável.
- A E18.5 representa a dependência, mas não recebe valores concretos, não comprova preenchimento e não gera copy.
- O módulo transversal não registra diretamente chaves imobiliárias.
- A E18.5 não importa nem duplica o catálogo da E20.2.
- A criação futura de um campo `services` permanece decisão separada.
- O contrato não deve resolver o gap apenas com flags de nicho específico.

### 1.8. Variante `hero.form@v1`

- Representa uma execução da Hero com capacidade abstrata de formulário.
- Preserva fields abstratos, obrigatoriedade, tipo, função, consentimento e privacidade.
- O contrato abstrato de acessibilidade de `hero.form@v1` adota `prod#17` e WCAG 2.2 como baseline, limitado a rótulos programaticamente associados aos controles; instruções e mensagens de erro programaticamente associadas quando presentes; operação por teclado; e foco direcionado ao primeiro field inválido após tentativa de submissão.
- Esse uso de `prod#17` não declara conformidade integral com WCAG e não define HTML, ARIA concreto, contraste, alvo de toque, layout, copy final, renderer ou formulário funcional.
- Mantém vínculo conceitual com conversão por formulário.
- Não cristaliza copy final, labels definitivos ou decisões de renderer.
- `hero.standard@v1` continua incompatível com formulário.
- Redundâncias entre booleano, capability e `formContract` devem ser comparadas durante a implementação.
- Formulário visual, submissão e persistência permanecem fora da E18.5.

### 1.9. Gap de produto

- Existe evidência de que benefícios factuais precisam refletir capacidades, serviços ou ofertas reais do cliente.
- Não existe evidência suficiente para definir automaticamente um campo chamado `services`.
- Permanecem indefinidos nome, tipo, escopo, cardinalidade, obrigação e persistência do eventual contrato.
- O gap deve voltar a debate próprio quando surgir extensão real.
- A E20.2 não será alterada para resolver esse gap neste recorte.

## 2. Contrato do caso

### 2.1. Resultado técnico planejado

- Preservar o boundary `lib/conversion-content/landing-page/module-catalog/`.
- Preservar registry versionado, resolver, contratos TypeScript, schema Zod, falha fechada e imutabilidade.
- Preservar compatibilidade com a raiz e com os perfis de funil.
- Preservar separação entre módulo, variante e fields.
- Preservar API pública mínima e manter registry/schema internos.
- Incorporar definitivamente `benefits.standard@v1` e `hero.form@v1`.
- Tornar extensão comum concentrada principalmente na definição canônica da identidade.
- Manter sources junto dos fields.
- Evitar contagens fixas, regras nominais novas no Zod, alteração do resolver e listas paralelas esquecíveis.
- Uma capability realmente nova ainda pode exigir:
  - contrato TypeScript;
  - schema Zod;
  - registry;
  - casos negativos.
- A capability genérica deve ser representada estruturalmente, sem cadastrar nominalmente cada variante autorizada quando a relação não depender da identidade.

### 2.2. Fontes de copy

- Substituir `copySourceMapFor(path)` por fontes declaradas junto dos fields.
- Avaliar helpers tipados conceitualmente equivalentes a:
  - pesquisa estruturada;
  - pesquisa com necessidade de suporte operacional;
  - evidência operacional.
- Não determinar antecipadamente o shape final desses helpers.
- A solução escolhida deve:
  - evitar segundo ponto de edição em `switch`;
  - preservar Zod;
  - preservar falha fechada;
  - evitar crescimento combinatório artificial de `sourceMode`;
  - distinguir pesquisa de comprovação operacional;
  - não acoplar o catálogo genérico a um taxon.

### 2.3. Referências operacionais e integridade

- O experimento do PR #617 validou somente o formato snake_case das referências.
- Referência vazia ou malformada falhou.
- Chave inexistente, mas sintaticamente válida, pôde passar.
- O teste comprovou representação declarativa e não comprovou integridade referencial entre os registries da E18.5 e da E20.2.
- A otimização não deve criar importação, duplicação ou dependência direta do registry da E20.2.
- A solução futura deve distinguir claramente:
  - declaração de necessidade de suporte operacional;
  - validação concreta de valor ou integridade referencial pelo consumidor competente.

### 2.4. Extensibilidade desejada

- Extensão comum deve permitir editar principalmente a definição canônica da identidade.
- Adicionar módulo ou variante comum não deve exigir:
  - alterar o resolver;
  - adicionar regra nominal ao schema genérico;
  - ajustar contagem global;
  - atualizar `switch` por path;
  - manter listas paralelas sem derivação ou necessidade comprovada.
- Módulo representa função estrutural reutilizável.
- Variante representa execução estrutural ou comportamental reutilizável da mesma função.
- Taxon, plano, campanha, funil, conteúdo, ordem, ativo ou ajuste já permitido não criam isoladamente módulo ou variante.

### 2.5. Fluxo operacional

- Gatilho:
  - futuro consumidor solicita a resolução de módulo e variante registrados.
- Entrada:
  - versão do catálogo;
  - versão da raiz e preset opcional;
  - módulo e versão;
  - variante e versão;
  - perfil de funil.
- Processamento:
  - validar input;
  - validar contrato canônico;
  - resolver raiz;
  - localizar módulo, variante e fields exatos;
  - aplicar especializações e delta do perfil;
  - devolver cópia isolada e profundamente imutável.
- Persistência:
  - N/A.
- Consumo:
  - E20 escolhe composição, ordem e obrigatoriedade em recorte próprio;
  - E19 resolve conteúdo e valores concretos em recorte próprio;
  - renderer executa contrato resolvido em recorte próprio.
- Fallback:
  - contrato ausente, incompatível ou inválido falha fechado;
  - não existe aproximação, criação automática de identidade ou fallback para outro módulo, variante, versão, preset ou perfil.
- Observabilidade:
  - N/A enquanto não houver consumidor de runtime.

### 2.6. API e validação

- O namespace público `landingPageModuleCatalog`, exportado por `lib/conversion-content/index.ts`, deve permanecer expondo somente os tipos autorizados e `resolveLandingPageModuleCatalog`; `registry.ts` e `schema.ts` permanecem internos. Este recorte não autoriza renomear, remover ou substituir o namespace ou o resolver público, nem exportar registry ou schema.
- Registry e schema não integram a API pública.
- O schema genérico valida estrutura e invariantes sem se tornar uma segunda fonte nominal do catálogo.
- Testes preservam contratos específicos relevantes e casos negativos.
- Contagem de módulos, variantes ou fields não é regra arquitetural.
- Comparações com o registry canônico somente permanecem quando protegerem coerência real; sua remoção total não está previamente aprovada.

## 3. Fases e próxima ação

### 3.1. 18.5.3 — Módulos e funções estruturais

- Automação: não.
- Objetivo:
  - otimizar a definição canônica dos módulos sem substituir o núcleo executável do PR #590;
  - incorporar `benefits@v1` como décimo módulo;
  - preservar as nove identidades de módulo existentes.
- Base de execução:
  - partir da `main` atualizada;
  - usar o PR #617 somente como baseline comparativa;
  - não mergear o PR #617, não fazer cherry-pick integral e não transportar acoplamento imobiliário.
- Entregas:
  - registrar `benefits@v1` no registry canônico com função estrutural, invariantes, boundaries, lifecycle e compatibilidade raiz;
  - remover contagens globais fixas de módulos;
  - reduzir identidades ou listas paralelas de módulos quando houver derivação segura;
  - manter o módulo transversal sem chaves imobiliárias e sem importação do catálogo da E20.2;
  - preservar o resolver sem alteração.
- Teste obrigatório 1 — parte de módulo:
  - comprovar o registro exato de `benefits@v1`;
  - comprovar função, invariantes, boundaries, compatibilidade e imutabilidade;
  - não ajustar contagem global, regra nominal do schema ou resolver;
  - concluir a resolução conjunta com `benefits.standard@v1` na fase 18.5.5.
- Métricas comparativas da fase:
  - registrar arquivos alterados, inserções, exclusões, pontos necessários de alteração, contratos e tipos alterados, alterações no registry, schema e resolver, listas paralelas, contagens fixas, regras nominais, duplicações, casos negativos, proteções preservadas e diferença em relação ao PR #617;
  - registrar `0` ou `N/A` explicitamente quando não houver alteração no item.
- Validações:
  - executar `npm ci` no início do lote contínuo;
  - executar `npm run validate:landing-page-root`;
  - executar `npm run validate:landing-page-module-catalog`;
  - executar `npm run check`;
  - executar `git diff --check`;
  - todos os comandos devem terminar com código zero.

### 3.2. 18.5.4 — Campos, estruturas e cardinalidades

- Automação: não.
- Objetivo:
  - otimizar a declaração de fields e cardinalidades;
  - preparar os contratos de fields exigidos por `benefits.standard@v1` e `hero.form@v1`.
- Entregas:
  - remover contagens globais fixas de fields;
  - preservar a separação entre módulo, variante e fields;
  - representar em `benefits.standard@v1` título e coleção controlada de benefícios, cada item com título e descrição;
  - representar os fields estruturais necessários à Hero com formulário sem implementar UI, submissão ou persistência;
  - preservar cardinalidade, policy, semantic role, suporte e source válido em cada field aplicável;
  - não criar catálogo paralelo de fields;
  - não determinar nesta fase o shape final dos helpers de fontes, cuja consolidação pertence à fase 18.5.7.
- Teste obrigatório 1 — parte de fields:
  - comprovar cardinalidades e imutabilidade dos fields de `benefits.standard@v1`;
  - comprovar falha fechada para field, shape, cardinalidade, policy ou combinação inválida.
- Teste obrigatório 4 — parte de fields:
  - comprovar a representação tipada dos fields abstratos e de sua obrigatoriedade;
  - preservar labels finais, renderer e valores concretos fora do contrato.
- Métricas comparativas da fase:
  - registrar arquivos alterados, inserções, exclusões, pontos necessários de alteração, contratos e tipos alterados, alterações no registry, schema e resolver, listas paralelas, contagens fixas, regras nominais, duplicações, casos negativos, proteções preservadas e diferença em relação ao PR #617;
  - registrar `0` ou `N/A` explicitamente quando não houver alteração no item.
- Validações:
  - executar `npm run validate:landing-page-module-catalog`;
  - executar `npm run check`;
  - executar `git diff --check`;
  - todos os comandos devem terminar com código zero.

### 3.3. 18.5.5 — Variantes e critérios de criação

- Automação: não.
- Objetivo:
  - incorporar definitivamente `benefits.standard@v1` e `hero.form@v1`;
  - manter variantes como execuções estruturais ou comportamentais reutilizáveis de seus módulos.
- Entregas:
  - preservar as dez variantes existentes;
  - registrar `benefits.standard@v1` vinculada exclusivamente a `benefits@v1`;
  - registrar `hero.form@v1` vinculada exclusivamente a `hero@v1`;
  - manter `hero.standard@v1` incompatível com formulário;
  - representar capability de formulário e contrato abstrato de formulário;
  - `hero.form@v1` deve registrar `WCAG 2.2` como baseline do contrato abstrato de acessibilidade e exigir rótulos programaticamente associados aos controles; instruções e mensagens de erro programaticamente associadas quando presentes; operação por teclado; e foco direcionado ao primeiro field inválido após tentativa de submissão. Todos esses requisitos são obrigatórios e devem falhar fechado quando ausentes ou inválidos;
  - comparar redundâncias entre capability, `supportsPrimaryConversionForm` e `formContract`, adotando somente redução que preserve tipagem, falha fechada e ausência de import circular;
  - expressar relações genéricas estruturalmente, sem regra Zod nominal vinculada a `hero.form@v1`;
  - não alterar o resolver.
- Teste obrigatório 1 — conclusão:
  - resolver `benefits@v1` com `benefits.standard@v1`;
  - comprovar cardinalidades e imutabilidade;
  - comprovar ausência de alteração no resolver, contagem global e regra nominal por identidade.
- Teste obrigatório 2:
  - resolver `hero.form@v1`;
  - manter `hero.standard@v1` sem formulário;
  - comprovar capability e contrato abstrato;
  - preservar falha fechada;
  - rejeitar combinações estruturalmente incompatíveis.
- Teste obrigatório 4 — conclusão estrutural:
  - representar fields abstratos, obrigatoriedade, consentimento, necessidade de política de privacidade, acessibilidade mínima e conversão por formulário;
  - comprovar incompatibilidades por casos negativos;
  - não implementar formulário funcional.
- Métricas comparativas da fase:
  - registrar arquivos alterados, inserções, exclusões, pontos necessários de alteração, contratos e tipos alterados, alterações no registry, schema e resolver, listas paralelas, contagens fixas, regras nominais, duplicações, casos negativos, proteções preservadas e diferença em relação ao PR #617;
  - registrar `0` ou `N/A` explicitamente quando não houver alteração no item.
- Validações:
  - executar `npm run validate:landing-page-module-catalog`;
  - executar `npm run check`;
  - executar `git diff --check`;
  - todos os comandos devem terminar com código zero.

### 3.4. 18.5.6 — Especializações sobre a parametrização raiz

- Automação: não.
- Objetivo:
  - preservar a compatibilidade com a parametrização raiz da E18.4 e a precedência `raiz → módulo → variante`.
- Entregas:
  - preservar compatibilidade explícita com a versão raiz;
  - permitir somente especializações restritivas;
  - impedir ampliação de limite absoluto herdado;
  - manter validações estruturais genéricas, sem regras nominais para as novas identidades;
  - manter raiz original e raiz efetiva rastreáveis;
  - não alterar nem reabrir a E18.4;
  - não alterar o resolver para incorporar as extensões comuns.
- Regressões obrigatórias:
  - comprovar que `benefits.standard@v1` e `hero.form@v1` respeitam a raiz;
  - comprovar falha para incompatibilidade, ampliação ou contrato-pai inválido;
  - comprovar que os testes obrigatórios 1, 2 e 4 continuam resolvendo ou falhando pelo resultado discriminado esperado.
- Métricas comparativas da fase:
  - registrar arquivos alterados, inserções, exclusões, pontos necessários de alteração, contratos e tipos alterados, alterações no registry, schema e resolver, listas paralelas, contagens fixas, regras nominais, duplicações, casos negativos, proteções preservadas e diferença em relação ao PR #617;
  - registrar `0` ou `N/A` explicitamente quando não houver alteração no item.
- Validações:
  - executar `npm run validate:landing-page-root`;
  - executar `npm run validate:landing-page-module-catalog`;
  - executar `npm run check`;
  - executar `git diff --check`;
  - todos os comandos devem terminar com código zero.

### 3.5. 18.5.7 — Mapa de fontes de copy

- Automação: não.
- Objetivo:
  - manter as fontes declaradas junto dos próprios fields;
  - distinguir pesquisa estruturada de comprovação operacional.
- Entregas:
  - substituir `copySourceMapFor(path)` por fontes declaradas junto dos fields;
  - remover o `switch` paralelo por path;
  - avaliar helpers tipados equivalentes a pesquisa estruturada, pesquisa com necessidade de suporte operacional e evidência operacional, sem predeterminar seu shape final;
  - evitar crescimento combinatório artificial de `sourceMode`;
  - impedir segundo ponto nominal de edição para uma extensão comum;
  - não importar ou duplicar o registry da E20.2;
  - manter referências operacionais abstratas e sintaticamente válidas;
  - separar declaração de suporte operacional da validação concreta de valor ou integridade referencial pelo consumidor competente.
- Teste obrigatório 3:
  - representar pesquisa estruturada e necessidade de suporte operacional;
  - manter as fontes junto dos fields;
  - não incluir referência imobiliária direta;
  - não importar o registry da E20.2;
  - comprovar falha para declaração estruturalmente incompleta;
  - comprovar que chave sintaticamente válida não equivale a integridade referencial;
  - distinguir explicitamente representação declarativa de validação concreta pelo consumidor.
- Regressões obrigatórias:
  - preservar os mapas existentes das dez variantes anteriores;
  - preservar os contratos de `benefits.standard@v1` e `hero.form@v1`;
  - preservar falha fechada para source mode, path, item key, duplicação ou mapa inválido.
- Métricas comparativas da fase:
  - registrar arquivos alterados, inserções, exclusões, pontos necessários de alteração, contratos e tipos alterados, alterações no registry, schema e resolver, listas paralelas, contagens fixas, regras nominais, duplicações, casos negativos, proteções preservadas e diferença em relação ao PR #617;
  - registrar `0` ou `N/A` explicitamente quando não houver alteração no item.
- Validações:
  - executar `npm run validate:landing-page-research`;
  - executar `npm run validate:landing-page-input-catalog`;
  - executar `npm run validate:landing-page-module-catalog`;
  - executar `npm run check`;
  - executar `git diff --check`;
  - todos os comandos devem terminar com código zero.

### 3.6. 18.5.8 — Perfis de copy por intenção e funil

- Automação: não.
- Objetivo:
  - preservar BOFU, MOFU e TOFU como perfis fechados;
  - reduzir manutenção paralela sem alterar sua semântica aprovada.
- Entregas:
  - preservar os vocabulários e `ctaMode` específicos dos três perfis;
  - preservar classificação única de cada treatment;
  - manter `emphasizeTreatments` vazio nos perfis e deltas da versão vigente;
  - permitir que deltas apenas restrinjam ou proíbam treatments conhecidos;
  - reduzir listas paralelas somente quando houver derivação segura;
  - não criar regra nominal específica para `benefits.standard@v1` ou `hero.form@v1` quando a relação for estruturalmente genérica.
- Regressões obrigatórias:
  - comprovar ausência de relaxamento de restrição ou proibição herdada;
  - comprovar falha para treatment desconhecido, duplicado, ausente ou classificado mais de uma vez;
  - comprovar que as novas identidades não alteram implicitamente os perfis aprovados.
- Métricas comparativas da fase:
  - registrar arquivos alterados, inserções, exclusões, pontos necessários de alteração, contratos e tipos alterados, alterações no registry, schema e resolver, listas paralelas, contagens fixas, regras nominais, duplicações, casos negativos, proteções preservadas e diferença em relação ao PR #617;
  - registrar `0` ou `N/A` explicitamente quando não houver alteração no item.
- Validações:
  - executar `npm run validate:landing-page-module-catalog`;
  - executar `npm run check`;
  - executar `git diff --check`;
  - todos os comandos devem terminar com código zero.

### 3.7. 18.5.9 — Ciclo de vida, compatibilidade e validação

- Automação: não.
- Objetivo:
  - consolidar lifecycle, compatibilidade, API, falha fechada, imutabilidade e validação integrada do catálogo otimizado.
- Entregas:
  - preservar lifecycle separado para raiz, módulo e variante;
  - preservar registry versionado como fonte canônica;
  - preservar `resolveLandingPageModuleCatalog` sem alteração para extensão comum;
  - preservar o namespace público `landingPageModuleCatalog`, com registry e schema internos;
  - preservar ausência de fallback entre identidades, versões, presets ou perfis;
  - preservar clonagem, isolamento e imutabilidade profunda;
  - consolidar dez módulos e doze variantes;
  - atualizar documentação durável somente conforme o diff material real;
  - após o diff material e os casos executáveis comprovarem o contrato de `hero.form@v1`, reconciliar o registro de Updates da seção 18.5.2 do roadmap para manter `prod#17` aplicado a `faq.accordion@v1` e ampliá-lo a `hero.form@v1`, limitado aos requisitos abstratos comprovados pelos respectivos contratos e casos negativos, sem declarar conformidade integral com WCAG;
  - não criar banco, migration, UI, renderer, composição, persistência, adapter, automação, job, cache ou infraestrutura.
- Testes integrados obrigatórios:
  - repetir integralmente os testes obrigatórios 1, 2, 3 e 4;
  - comprovar casos positivos e negativos das proteções existentes;
  - comprovar que casos negativos falham pelo resultado discriminado esperado, sem exceção não tratada;
  - comprovar resolver inalterado;
  - comprovar ausência de dependência direta entre os registries E18.5 e E20.2;
  - comprovar API pública mínima e internalidade de registry/schema;
  - a validação executável deve resolver um caso positivo de `hero.form@v1` com o contrato abstrato de acessibilidade completo e, para cada requisito obrigatório, comprovar em caso negativo independente que sua omissão ou falsidade falha fechado, sem exceção não tratada. `hero.standard@v1` deve continuar sem `formContract`.
- Consolidação das métricas:
  - consolidar, por teste e por fase, arquivos alterados, inserções, exclusões, pontos necessários de alteração, contratos e tipos alterados, alterações no registry, schema e resolver, listas paralelas, contagens fixas, regras nominais, duplicações, casos negativos e proteções comprovadas;
  - comparar o conjunto final com o PR #617;
  - priorizar menos pontos distribuídos, ausência de contagens fixas, ausência de novas regras nominais, fontes junto dos fields, resolver intacto, mesmas proteções, mesmos casos negativos e ausência de dependência direta entre E18.5 e E20.2;
  - tratar quantidade de arquivos como métrica auxiliar, não como objetivo isolado.
- Validações finais:
  - confirmar `npm ci` executado no lote contínuo; repetir somente se dependências ou lockfile mudarem;
  - executar `npm run validate:landing-page-root`;
  - executar `npm run validate:landing-page-research`;
  - executar `npm run validate:landing-page-input-catalog`;
  - executar `npm run validate:landing-page-module-catalog`;
  - executar `npm run validate:commercial-activation`;
  - executar `npm run check`;
  - executar `git diff --check`;
  - todos os comandos devem terminar com código zero;
  - não executar `npm run build` no sandbox;
  - registrar teste humano e smoke visual como N/A enquanto não houver superfície visual.

### 3.8. Próxima ação

- Processo escolhido pelo humano: Opção 2 — Processo automatizado, em andamento nesta v2.
- Submeter esta v2 ao gate independente e à auditoria de consolidação do Analista.
- Somente após aprovação da v2, reconciliar `docs/roadmap.md` pelo menor delta do ABC e solicitar a revisão delta ao mesmo Analista.
- Publicar um único PR draft contra `main` somente depois da aprovação da v2 e do roadmap reconciliado.
- O merge permanece exclusivamente humano pelo GitHub Web.
- Somente depois do merge humano do PR da v2, iniciar a execução material com `$lp-factory-executar-plano`, em nova branch baseada na `main` atualizada.
- Não executar nenhuma fase material durante esta orquestração do plano.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não alterar materialmente a E18.5 neste PR documental.
- Não refatorar o boundary neste PR documental.
- Não alterar nem reabrir a E18.4.
- Não executar experimento artificial da E18.4.
- Não alterar nem reabrir a E20.2.
- Não criar `services`.
- Não implementar E20.3.
- Não implementar E19.4.
- Não coletar ou persistir valores.
- Não criar renderer, componente React ou formulário visual.
- Não criar submissão, endpoint, rota, banco, migration, CRM, e-mail ou captcha.
- Não criar integração operacional, agente, automação, job, cache ou infraestrutura.
- Não fechar nem mergear o PR #617.
- Não alterar o PR #616, sua branch ou seus commits; ele permanece como fonte v1 mergeada e imutável.
- Não alterar `docs/lp-planejamento.md`, já reconciliado pelo PR #618.
- Não realizar merge de qualquer PR.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - alguma alteração exigir modificar código neste PR;
  - a documentação real atribuir responsabilidade diferente à E18.4, E19.4, E20.2 ou E20.3;
  - incorporar `benefits` exigir definir agora o campo `services`;
  - o plano exigir integridade referencial direta entre E18.5 e E20.2;
  - a otimização exigir remover proteção sem evidência de que ela é desnecessária;
  - surgir consumidor real não mapeado que altere o escopo;
  - for necessário mudar estrutura, numeração ou ordem dos documentos além do recorte autorizado.

### 4.3. Validação deste trabalho documental

- Revisar o diff completo da branch v2 contra a `main` atualizada.
- Confirmar no checkpoint da v2 que somente `docs/lousa-plano-base-e18-5.md` foi alterado.
- Confirmar antes da publicação que o diff final contém somente `docs/lousa-plano-base-e18-5.md` e `docs/roadmap.md`.
- Confirmar preservação das quatro seções principais, estrutura, numeração, ordem e estilo em bullets.
- Confirmar exatamente sete fases executáveis, identificadas por `18.5.3` a `18.5.9`, cada uma com `Automação: não`.
- Buscar instruções processuais residuais já cumpridas, agrupamento de fases, remoção do núcleo do PR #590, catálogo apenas consultivo ou merge do PR #617.
- Executar `git diff --check`.
- Registrar como N/A:
  - `npm ci`;
  - `npm run check`;
  - validações materiais;
  - teste humano;
  - smoke visual.

### 4.4. Critérios de encerramento

- Preservar o PR #616 mergeado como referência imutável da v1.
- Manter o PR #617 aberto em draft, sem merge, como baseline experimental.
- Encerrar esta orquestração somente após Passagens 1 e 2 do Analista, reconciliação do roadmap, revisão delta, validações documentais, commit, push e abertura do PR draft da v2.
- A execução material futura só começa após aprovação e merge humano do PR da v2.

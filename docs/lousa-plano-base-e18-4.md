14/07/2026 — Plano-base E18.4 — Parametrização raiz da família `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/design-system.md`, `docs/lp-planejamento.md`, `docs/template-blueprint.md`, `docs/blueprint-corretor-imoveis-end-customer.md`, `docs/gestor-estrutural.md`, `docs/vercel-up.md`, `docs/prod-up.md`, conteúdo anterior deste path, `package.json`, `lib/conversion-content/index.ts`, `lib/conversion-content/landing-page/`, PRs #559, #563, #564, #566 e #567, avaliações do Analista, Gestor Estrutural e Gestor de Updates e decisões humanas de 13 e 14/07/2026.

Status: plano-base v2 concluído; fase material implementada, aprovada e mergeada no PR #564; documentação durável mergeada no PR #566; ajuste conceitual final registrado no PR #567; E18.4 formalmente encerrada por este ajuste documental. Próxima ação: iniciar o plano-base da E18.5.

Path: `docs/lousa-plano-base-e18-4.md`.

Recorte do roadmap: `18.4 — Parametrização raiz da família landing_page`.

1. Estado e decisões fixas

1.1. Estado do caso

* O PR #559 foi mergeado na `main` em 13/07/2026 e `docs/lp-planejamento.md` permanece como decisão conceitual obrigatória da jornada de LPs.
* O conteúdo anterior deste plano-base, referente a `18.4 — Base de composição landing_page`, foi substituído no mesmo path pelo recorte de parametrização raiz.
* O PR #563 consolidou e mergeou o plano-base v2 antes da execução material.
* O PR #564 removeu a implementação antiga, criou a parametrização raiz v1, recebeu o patch técnico solicitado pelo Analista e foi mergeado na `main` em 13/07/2026.
* O PR #566 atualizou `docs/roadmap.md` e `docs/base-tecnica.md` e foi mergeado na `main`.
* O PR #567 ajusta `docs/lp-planejamento.md`, esclarece o limite técnico absoluto efetivo e registra o encerramento deste plano-base.
* A implementação antiga de composição, módulos, variantes, schemas por variante, renderer e render model foi removida.
* A fonte raiz versionada está implementada em `lib/conversion-content/landing-page/`, com registry canônico, schema estrito, resolver fail-closed, saída imutável e validação executável.
* `commercial_activation`, E18.2, E18.3 e o LP Builder foram preservados.
* Não há novo escopo material pendente na E18.4.
* Este PR registra o encerramento formal da E18.4 no estado que ingressará na `main`, sem necessidade de nova rodada dos especialistas.
* A próxima ação é iniciar o plano-base da E18.5.

1.2. Decisões preservadas

* Preservar integralmente `commercial_activation`.
* Preservar integralmente os recortes E18.2 e E18.3.
* Preservar o histórico Git; não apagar ou reescrever commits anteriores.
* Preservar a separação entre:
  * parametrização raiz;
  * módulos;
  * variantes;
  * composição;
  * conteúdo;
  * artefato final.
* A parametrização raiz é versionada no repositório.
* A fonte versionada não exige configuração dinâmica em runtime.
* Os valores iniciais são hipóteses editoriais e visuais até a validação da primeira LP real.
* A parametrização raiz resolve apenas regras comuns da família `landing_page`.
* Módulos e variantes pertencem ao recorte E18.5 e não foram antecipados.
* Catálogo de entradas, composição por taxon, pesquisas estruturadas, autorização de contas, geração de LP, Admin e editor visual permanecem em seus recortes próprios.
* O registry explícito por versão é a única fonte dos valores efetivos.
* Versão, preset ou contrato inválido falha fechado, sem fallback silencioso.
* As versões anteriores permanecem imutáveis; ampliação de limite técnico absoluto exige nova `rootVersion`.
* Faixas editoriais recomendadas podem ser especializadas para cima ou para baixo na E18.5, desde que respeitem o limite técnico absoluto efetivo.
* Módulo ou variante pode impor limite absoluto mais restritivo, mas não pode ampliá-lo.

1.3. Estado técnico confirmado

* Boundary canônico: `lib/conversion-content/landing-page/`.
* Artefatos atuais:
  * `contracts.ts`;
  * `root-registry.ts`;
  * `root-schema.ts`;
  * `root-resolver.ts`;
  * `root-validation-cases.ts`;
  * `index.ts`.
* O índice `lib/conversion-content/index.ts` expõe o namespace `landingPageRoot`.
* `package.json` expõe o script `validate:landing-page-root` e não expõe mais `validate:landing-page`.
* A implementação não possui módulos, variantes, composição, renderer, render model ou schemas de conteúdo por variante.
* O schema atual possui `template_family = landing_page`, mas a parametrização raiz permanece repo-only e não exige persistência própria.
* Nenhuma mudança de banco foi realizada.
* A implementação permanece compatível com a configuração vigente de Next.js 16 e Turbopack, sem alteração de bundler, `next.config`, loaders, plugins ou dependências.
* Validações materiais registradas no PR #564:
  * `npm ci` concluído;
  * `npm run validate:landing-page-root` concluído;
  * `npm run validate:commercial-activation` concluído;
  * `npm run check` concluído com zero erros;
  * buscas pós-substituição sem referências órfãs à implementação antiga.

1.4. Roadmap afetado e gate documental

* Seção principal:
  * E18 — Base transversal de templates, módulos, composições e artefatos.
* Recorte substituído:
  * `18.4 — Base de composição landing_page`.
* Recorte implementado:
  * `18.4 — Parametrização raiz da família landing_page`.
* Subseções registradas no roadmap:
  * `18.4.1 — Objetivo e status`;
  * `18.4.2 — Registros do recorte`;
  * `18.4.3 — Fonte canônica e versionamento`;
  * `18.4.4 — Parâmetros semânticos e editoriais`;
  * `18.4.5 — Limites e evolução`;
  * `18.4.6 — Critérios visuais e responsivos`;
  * `18.4.7 — Presets e espaçamento`;
  * `18.4.8 — Resolver e validação`;
  * `18.4.9 — Limites do recorte`.
* O PR #566 concluiu a atualização de `docs/roadmap.md` e `docs/base-tecnica.md`.
* O PR #567 conclui a precisão conceitual pendente em `docs/lp-planejamento.md` e atualiza o estado deste plano-base.
* Com este ajuste, não permanece drift normativo conhecido sobre a antiga E18.4.

1.5. Avaliações e autorização

* Analista: avaliação material concluída; patch técnico incorporado no PR #564.
* Gestor Estrutural: avaliação do plano-base concluída e condicionantes incorporadas.
* Gestor de Updates: avaliação concluída e updates elegíveis incorporados.
* Gestor de Automação: não aplicável, pois todas as fases foram marcadas como `Automação: não`.
* A rodada única dos especialistas foi concluída.
* O debate humano foi encerrado e a v2 foi validada.
* O Executor concluiu a única fase material prevista.
* Não abrir nova rodada completa sem mudança relevante de escopo, nova estrutura, nova automação ou risco técnico novo.

1.6. Consolidação das avaliações e decisões humanas

* Pontos aceitos e materializados:
  * transformar a correção normativa em gate real de encerramento;
  * mergear o plano antes da implementação;
  * executar a fase material em branch e PR próprios;
  * remover atomicamente a implementação antiga;
  * preservar `commercial_activation`, E18.2 e E18.3;
  * criar registry explícito por versão como única fonte dos valores efetivos;
  * resolver o preset padrão pela própria versão, sem hardcode no resolver;
  * adicionar novas versões sem apagar ou alterar parâmetros anteriores;
  * permitir especialização das faixas recomendadas para cima ou para baixo dentro do limite técnico absoluto efetivo;
  * proibir ampliação de limite absoluto sem nova versão da raiz;
  * exigir imutabilidade profunda;
  * usar `contracts.ts` como contrato público do boundary;
  * substituir tokens concretos por papéis visuais abstratos e enumerados;
  * definir erros tipados e resultado discriminado;
  * definir contagem e normalização de texto;
  * definir lifecycle de status;
  * usar WCAG 2.2 como baseline de referência, sem declarar conformidade integral;
  * tratar 44 × 44 px como padrão interno conservador;
  * manter compatibilidade com Next.js e Turbopack sem alterar bundler;
  * usar `docs/blueprint-corretor-imoveis-end-customer.md` como fonte empírica parcial;
  * manter como hipóteses v1 os números sem sustentação direta suficiente.
* Pontos rejeitados:
  * encerrar a E18.4 apenas com relatório sem atualização documental;
  * expor tokens concretos do design system no contrato raiz;
  * permitir fallback silencioso;
  * executar remoção parcial antes de existir raiz validável;
  * preservar a implementação antiga por consumidor externo;
  * criar handoff para Codex Web;
  * antecipar módulo, variante, composição ou renderer;
  * tratar limites específicos do Hero imobiliário como prova definitiva de limites globais.
* Ponto futuro fora do encerramento da E18.4:
  * validação das hipóteses v1 por LP real e por evidência de outros nichos.
* Pontos concluídos:
  * PR #563 mergeado;
  * branch material dedicada criada;
  * fase 3.1 executada e validada;
  * PR #564 aprovado e mergeado;
  * relatório documental consolidado;
  * PR #566 mergeado;
  * código antigo removido;
  * namespace e script substituídos;
  * checks materiais concluídos.

1.7. Base de evidência das parametrizações v1

* A raiz v1 combina quatro classes de fonte:
  * decisões conceituais de `docs/lp-planejamento.md`;
  * padrões técnicos globais de responsividade, legibilidade e acessibilidade;
  * referências empíricas de blueprints e LPs reais;
  * hipóteses iniciais que serão validadas por LP real.
* `docs/blueprint-corretor-imoveis-end-customer.md` é aceito como primeira fonte empírica parcial porque:
  * foi produzido conforme `docs/template-blueprint.md`;
  * consultou LPs e funis reais;
  * separou recomendações aprovadas de hipóteses operacionais;
  * registrou fontes oficiais e critérios de confiança.
* O blueprint imobiliário oferece referências úteis para:
  * título de Hero: 45 a 80 caracteres, como hipótese operacional específica do módulo;
  * subtítulo de Hero: 90 a 160 caracteres, como hipótese operacional específica do módulo;
  * CTA principal: 14 a 28 caracteres;
  * CTA secundário: 14 a 30 caracteres;
  * prova curta: 40 a 90 caracteres;
  * título de seção: 25 a 60 caracteres;
  * descrição de card: 60 a 120 caracteres;
  * pergunta de FAQ: 45 a 90 caracteres;
  * resposta de FAQ: 90 a 220 caracteres;
  * nota de privacidade: 80 a 180 caracteres.
* A referência de Hero não é convertida diretamente em regra da raiz:
  * Hero é módulo futuro da E18.5;
  * a raiz parametriza papéis semânticos comuns, como `h1`, `paragraph` e `cta_label`;
  * a E18.5 poderá especializar esses papéis para o Hero dentro dos limites absolutos da raiz.
* O limite absoluto de 120 caracteres para `h1` não é comprovado diretamente pelo blueprint imobiliário.
* Esse limite e os demais números não sustentados diretamente permanecem hipóteses técnicas v1, não benchmarks comprovados.
* A primeira LP real e futuros blueprints de outros nichos devem gerar evidência para manter, restringir ou substituir esses parâmetros em nova `rootVersion`.

2. Contrato do caso

2.1. Problema

* A implementação anterior definiu módulos, variantes, schemas, composição e renderer antes de existir uma parametrização raiz aprovada.
* Limites editoriais foram hardcoded em schemas independentes.
* Valores visuais e responsivos foram hardcoded no renderer.
* `spacing` foi tratado apenas como configuração por seção, sem uma fonte comum versionada.
* Não existia contrato único para geração, validação e futura renderização derivarem os mesmos limites.
* Manter a implementação anterior criaria uma falsa base aprovada e condicionaria prematuramente a E18.5, a E20 e a E19.
* Por isso, a implementação anterior foi removida e substituída pela parametrização raiz versionada.

2.2. Resultado esperado

* Remover integralmente a implementação anterior da antiga E18.4.
* Remover, desacoplar ou redirecionar qualquer consumidor dessa implementação.
* Substituir a implementação anterior por uma fonte raiz versionada, pequena e executável.
* Manter todos os valores efetivos em um único registry versionado.
* Definir papéis semânticos comuns da família `landing_page`.
* Definir faixas editoriais recomendadas.
* Definir limites técnicos absolutos.
* Definir critérios visuais e responsivos comuns.
* Definir presets amplos da página sem confundi-los com escolhas por ocorrência de seção.
* Definir relação explícita com o design system existente por papéis abstratos.
* Definir contrato de leitura fail-closed.
* Definir herança e precedência para consumidores posteriores.
* Definir validações executáveis da raiz.
* Não antecipar módulos, variantes, composição ou renderer.

2.3. Usuários e consumidores

* Usuários diretos:
  * Executor;
  * Estrategista;
  * Analista;
  * futuros implementadores da E18.5, E20 e E19.
* Consumidores técnicos futuros:
  * schemas de conteúdo;
  * geração de copy;
  * validação de conteúdo;
  * renderer de `landing_page`;
  * snapshots de geração.
* O cliente final não interage diretamente com este recorte.

2.4. Fonte versionada, boundary e imutabilidade

* Boundary canônico preservado:
  * `lib/conversion-content/landing-page/`.
* A implementação anterior foi removida integralmente e o mesmo boundary foi reconstruído no PR #564 apenas com artefatos da parametrização raiz.
* Não criar path paralelo para a E18.4.
* Artefatos implementados:
  * `lib/conversion-content/landing-page/contracts.ts`;
  * `lib/conversion-content/landing-page/root-registry.ts`;
  * `lib/conversion-content/landing-page/root-schema.ts`;
  * `lib/conversion-content/landing-page/root-resolver.ts`;
  * `lib/conversion-content/landing-page/root-validation-cases.ts`;
  * `lib/conversion-content/landing-page/index.ts`.
* Responsabilidades:
  * `contracts.ts` expõe somente tipos públicos `readonly`, códigos de erro, resultado discriminado e contratos de leitura;
  * `root-registry.ts` contém uma única ocorrência dos valores efetivos de cada versão;
  * `root-schema.ts` valida estrutura e invariantes e pode manter allowlists estruturais necessárias, sem atuar como fonte dos valores resolvidos;
  * `root-resolver.ts` consulta exclusivamente o registry e não possui valores próprios de fallback;
  * `root-validation-cases.ts` prova casos positivos, negativos, versionamento e imutabilidade;
  * `index.ts` expõe apenas a interface pública autorizada.
* Identidade inicial da versão 1:
  * `family = landing_page`;
  * `rootVersion = 1`;
  * `lifecycleStatus = hypothesis`;
  * `defaultPreset = balanced`.
* Registry obrigatório:
  * mapa explícito `rootVersion → entrada imutável`;
  * nova versão deve ser adicionada como nova entrada;
  * parâmetros publicados de versão anterior não podem ser alterados ou apagados;
  * não existe versão padrão implícita; `rootVersion` é sempre obrigatório no resolver.
* Lifecycle permitido:
  * `hypothesis`: parâmetros ainda não validados por LP real;
  * `validated`: parâmetros mantidos após evidência real e decisão humana registrada;
  * `deprecated`: versão preservada para reprodução histórica, mas não recomendada para novo uso.
* O payload de parâmetros de uma versão é imutável após publicação.
* Somente o metadata de lifecycle pode avançar sob decisão humana registrada, sem alterar os parâmetros da versão.
* Imutabilidade obrigatória:
  * tipos públicos profundamente `readonly`;
  * congelamento recursivo do registry e do resultado resolvido, ou construção equivalente que não exponha referência mutável;
  * nenhuma referência mutável compartilhada entre chamadas;
  * testes de mutação em pelo menos um preset e um papel semântico aninhado.
* O índice agregado removeu o namespace antigo `landingPage` e passou a usar a identidade explícita `landingPageRoot`.
* O script antigo `validate:landing-page` foi removido e substituído por `validate:landing-page-root`.
* Não adicionar dependência npm.
* Não alterar `package-lock.json` quando não houver mudança real de dependência.

2.5. Papéis semânticos e faixas editoriais v1

* `eyebrow`:
  * faixa recomendada: 12 a 48 caracteres;
  * limite técnico absoluto: 64 caracteres.
* `h1`:
  * faixa recomendada: 36 a 72 caracteres;
  * limite técnico absoluto: 120 caracteres.
* `h2`:
  * faixa recomendada: 28 a 64 caracteres;
  * limite técnico absoluto: 100 caracteres.
* `h3`:
  * faixa recomendada: 20 a 56 caracteres;
  * limite técnico absoluto: 80 caracteres.
* `paragraph`:
  * faixa recomendada: 80 a 240 caracteres;
  * limite técnico absoluto: 420 caracteres.
* `cta_label`:
  * faixa recomendada: 10 a 32 caracteres;
  * limite técnico absoluto: 40 caracteres.
* `privacy_note`:
  * faixa recomendada: 40 a 180 caracteres;
  * limite técnico absoluto: 280 caracteres.
* `faq_question`:
  * faixa recomendada: 32 a 96 caracteres;
  * limite técnico absoluto: 140 caracteres.
* `faq_answer`:
  * faixa recomendada: 120 a 420 caracteres;
  * limite técnico absoluto: 700 caracteres.
* `card_title`:
  * faixa recomendada: 18 a 56 caracteres;
  * limite técnico absoluto: 80 caracteres.
* `card_body`:
  * faixa recomendada: 70 a 220 caracteres;
  * limite técnico absoluto: 360 caracteres.
* `benefit_item`:
  * faixa recomendada: 24 a 96 caracteres;
  * limite técnico absoluto: 140 caracteres.
* `step_label`:
  * faixa recomendada: 2 a 16 caracteres;
  * limite técnico absoluto: 24 caracteres.
* `step_title`:
  * faixa recomendada: 18 a 56 caracteres;
  * limite técnico absoluto: 80 caracteres.
* `step_body`:
  * faixa recomendada: 60 a 180 caracteres;
  * limite técnico absoluto: 320 caracteres.
* As faixas recomendadas orientam geração e revisão, mas não invalidam conteúdo por si mesmas.
* Conteúdo fora da faixa recomendada e dentro do limite absoluto deve produzir aviso, não erro bloqueante.
* Os limites absolutos devem falhar fechado.
* Os valores são hipóteses v1 e somente mudam por nova versão após evidência de LP real e decisão humana.
* O blueprint imobiliário é evidência parcial conforme 1.7; não converte valores específicos de Hero em regra global automática.

2.6. Limites técnicos comuns e medição textual

* Conteúdo textual deve ser normalizado antes da contagem:
  * converter `CRLF` e `CR` para `LF`;
  * aplicar `trim` nas extremidades;
  * substituir sequências internas de espaço horizontal ou tabulação por um único espaço;
  * preservar quebras de linha internas normalizadas;
  * contar cada quebra de linha como um caractere.
* Caractere significa ponto de código Unicode, não unidade UTF-16.
* A contagem deve usar o texto normalizado e comportamento equivalente a `Array.from(textoNormalizado).length`.
* Campo presente deve conter texto não vazio após normalização.
* O contrato raiz aceita apenas texto simples para os papéis semânticos.
* HTML, script, CSS, Tailwind, nomes de componentes, props arbitrárias e instruções de renderer são proibidos.
* O contrato raiz não define quantidade de cards, benefícios, passos, FAQs ou seções; cardinalidades pertencem à E18.5.
* O contrato raiz não define URLs, formulários, provas, oferta, preço, escassez, garantia ou tratamentos comerciais; essas regras pertencem aos recortes posteriores.
* A raiz permite somente os valores comuns de espaçamento:
  * `compact`;
  * `default`;
  * `spacious`.
* `spacing` continua sendo escolha limitada por ocorrência de seção na composição futura; o preset define apenas o valor padrão da página.
* Deve existir exatamente um papel `h1` na LP final, mas a aplicação estrutural dessa regra pertence ao consumidor que conhecer a composição.
* A raiz registra a regra de hierarquia semântica `h1 → h2 → h3`, sem criar módulos ou seções.

2.7. Critérios visuais, responsivos e de acessibilidade

* WCAG 2.2 é baseline de referência para decisões de acessibilidade deste contrato.
* Este recorte não declara conformidade integral com WCAG, não executa auditoria e não cria superfície visual.
* Abordagem mobile-first.
* Suporte técnico mínimo a viewport de 320 px ou superior.
* Viewports obrigatórios para futura evidência visual:
  * 360 px;
  * 768 px;
  * 1280 px.
* Nenhum texto pode depender de truncamento, corte, `line-clamp` ou overflow oculto para cumprir o contrato.
* Não pode haver rolagem horizontal causada por conteúdo textual ou container da LP.
* Texto de corpo deve permanecer em pelo menos `1rem`.
* Nota de apoio ou privacidade deve permanecer em pelo menos `0.875rem`.
* Alvo interativo deve possuir área mínima de 44 × 44 px como padrão interno conservador do LP Factory 10.
* Largura de leitura deve permanecer entre 45 e 75 caracteres por linha, com alvo padrão de até 68 `ch`.
* O `h1` deve permanecer legível e sem corte no mobile; alvo editorial de até quatro linhas em 360 px.
* `h2` deve permanecer legível e sem corte; alvo editorial de até três linhas em 360 px.
* Hierarquia visual deve acompanhar a hierarquia semântica.
* Foco deve ser visível.
* Contraste, legibilidade, navegação e estados interativos devem permanecer verificáveis pelos recortes que criarem componentes e renderer.
* Esses critérios são contrato da raiz; componentes, auditoria e evidência visual executável pertencem a recortes posteriores.

2.8. Presets v1 e relação com o design system

* Preset `balanced`:
  * preset padrão da versão 1;
  * densidade geral: `default`;
  * espaçamento padrão de seção: `default`;
  * largura máxima de página: `72rem`;
  * largura máxima de leitura: `68ch`;
  * escala responsiva de `h1`: `2.25rem` a `3rem`;
  * escala responsiva de `h2`: `1.5rem` a `1.875rem`;
  * escala de `h3`: `1.125rem`;
  * texto de corpo: `1rem`, admitindo `1.125rem` em destaque editorial;
  * texto de apoio: `0.875rem`.
* Preset `compact`:
  * uso para LP curta ou mais direta;
  * densidade geral: `compact`;
  * espaçamento padrão de seção: `compact`;
  * largura máxima de página: `68rem`;
  * largura máxima de leitura: `64ch`;
  * escala responsiva de `h1`: `2rem` a `2.5rem`;
  * escala responsiva de `h2`: `1.375rem` a `1.75rem`;
  * escala de `h3`: `1.0625rem` a `1.125rem`;
  * texto de corpo: `1rem`;
  * texto de apoio: `0.875rem`.
* Preset é configuração ampla da página e não seleciona módulos, variantes, ordem, conteúdo ou taxon.
* Preset não pode ampliar limites técnicos absolutos.
* Papéis visuais abstratos permitidos no contrato raiz:
  * `primary_action`;
  * `focus_indicator`;
  * `border`;
  * `surface`;
  * `text`;
  * `state`.
* Os papéis abstratos não carregam nome de classe, variável CSS ou token concreto.
* O mapeamento dos papéis abstratos para tokens do design system pertence ao futuro renderer ou adapter visual.
* Relação com o design system:
  * usar Inter como fonte-base inicial enquanto não houver decisão específica de branding da LP;
  * usar somente papéis visuais abstratos definidos neste contrato;
  * não versionar classes Tailwind no contrato raiz;
  * não transformar a identidade visual do dashboard em branding obrigatório da LP;
  * não criar tokens novos neste recorte;
  * branding por cliente permanece fora do escopo.

2.9. Contrato de leitura e erros

* Resolver público:
  * `resolveLandingPageRootParameters({ rootVersion, presetKey })`.
* Entradas:
  * `rootVersion` obrigatório;
  * `presetKey` opcional.
* Resolução de preset:
  * quando `presetKey` estiver ausente, consultar `defaultPreset` da entrada de `rootVersion` no registry;
  * o resolver não pode conter `balanced` ou qualquer outro preset hardcoded;
  * não existe fallback entre versões.
* Saída por união discriminada:
  * sucesso: `{ ok: true, value }`;
  * falha: `{ ok: false, error }`.
* Códigos mínimos de erro:
  * `UNKNOWN_ROOT_VERSION`;
  * `UNKNOWN_PRESET`;
  * `INVALID_ROOT_CONTRACT`.
* A saída válida deve conter:
  * família;
  * versão da raiz;
  * lifecycle status;
  * preset resolvido;
  * papéis semânticos;
  * faixas recomendadas;
  * limites absolutos;
  * opções comuns;
  * papéis visuais abstratos;
  * critérios visuais, responsivos e de acessibilidade.
* Versão desconhecida deve retornar `UNKNOWN_ROOT_VERSION` e falhar fechado.
* Preset desconhecido deve retornar `UNKNOWN_PRESET` e falhar fechado.
* Registry ou entrada inválida deve retornar `INVALID_ROOT_CONTRACT` e falhar fechado.
* Versão `deprecated` somente pode ser resolvida quando solicitada explicitamente; o resolver não redireciona silenciosamente para outra versão.
* O resolver não consulta banco, env, API, arquivo remoto ou configuração dinâmica.
* O resultado resolvido é profundamente somente leitura e não expõe referência mutável.
* Consumidores futuros devem importar o contrato resolvido, sem copiar valores para fontes independentes.
* Consumidores que criarem persistência em recortes posteriores devem registrar a versão e o preset usados no próprio snapshot ou artefato, conforme o plano competente.

2.10. Herança e precedência

* Precedência futura obrigatória:
  * parametrização raiz e preset selecionado;
  * especialização do módulo;
  * especialização da variante;
  * escolha permitida por ocorrência da seção.
* A raiz define os limites absolutos máximos da família.
* Em cada camada, o limite técnico absoluto efetivo é o menor valor entre o limite herdado e eventual limite mais restritivo definido no próprio nível.
* Faixas recomendadas:
  * módulo ou variante pode especializar mínimo e máximo para cima ou para baixo;
  * a especialização deve ser explícita e justificada na E18.5;
  * o mínimo especializado deve ser maior ou igual a 1;
  * o mínimo especializado não pode superar o máximo especializado;
  * o máximo especializado não pode superar o limite técnico absoluto efetivo da própria camada.
* Limites técnicos absolutos:
  * módulo ou variante pode impor limite mais restritivo;
  * módulo ou variante não pode ampliar o limite absoluto herdado;
  * ampliação acima do limite da raiz vigente exige nova `rootVersion`;
  * revisão futura de restrição própria de módulo ou variante, ainda dentro do teto da raiz, deve ser tratada pelo versionamento do respectivo contrato na E18.5.
* Opções comuns:
  * módulo ou variante pode restringir opções permitidas;
  * módulo ou variante não pode criar opção fora da enumeração da raiz.
* Escolha por ocorrência não pode alterar papel semântico, limite absoluto, schema, renderer ou componente.
* Taxon, catálogo, composição, entrada de conta, intenção, funil e conteúdo não podem sobrescrever a parametrização raiz.
* Ausência de especialização deve herdar o valor da camada anterior.
* Conflito ou valor desconhecido deve falhar fechado, sem fallback silencioso.

2.11. Validações executáveis

* O schema da raiz é Zod estrito.
* Casos mínimos de validação:
  * registry v1 válido;
  * resolução explícita da versão 1;
  * versão desconhecida;
  * preset desconhecido;
  * preset ausente resolvido pelo `defaultPreset` do registry;
  * preset padrão inexistente;
  * contrato raiz estruturalmente inválido;
  * lifecycle status desconhecido;
  * papel semântico obrigatório ausente;
  * papel semântico desconhecido;
  * faixa recomendada invertida;
  * faixa recomendada acima do limite absoluto;
  * limite absoluto menor que 1;
  * valor de `spacing` desconhecido;
  * papel visual abstrato desconhecido;
  * token concreto, classe Tailwind ou estilo livre inserido no contrato;
  * normalização de `CRLF`, espaços repetidos e contagem Unicode conforme 2.6;
  * mutação de preset aninhado impedida ou sem efeito;
  * mutação de papel semântico aninhado impedida ou sem efeito;
  * ausência de referência mutável compartilhada;
  * inclusão de nova versão sem alterar ou apagar a versão 1;
  * schema e resolver sem cópia dos números e presets do registry;
  * ausência de módulos, variantes, composition e renderer no contrato raiz;
  * ausência de imports, símbolos e scripts da implementação antiga após a substituição.
* Validações concluídas na fase:
  * busca de referências antes e depois da substituição;
  * `npm ci`;
  * `npm run validate:landing-page-root`;
  * `npm run validate:commercial-activation`;
  * `npm run check`;
  * checks do PR material em estado verde.
* `npm run build` não foi executado no sandbox, conforme `AGENTS.md` e `docs/base-tecnica.md`.
* Validação visual e auditoria WCAG não se aplicaram porque o recorte não criou renderer ou superfície visual.

2.12. Remoção da implementação anterior

* A decisão de remover a antiga E18.4 foi concluída no PR #564.
* Foram buscados imports e usos de `LandingPageRenderer`, `buildLandingPageRenderModel`, `landingPageSectionRegistry`, `validateLandingPageComposition`, do namespace `landingPage` e dos paths antigos.
* Consumidores internos foram removidos junto com a implementação antiga.
* Não foram preservados consumidores externos acoplados a módulo, variante, composição ou renderer futuro.
* Foram removidos os arquivos anteriores:
  * `schemas.ts`;
  * `registry.ts`;
  * `composition-validator.ts`;
  * `render-model.ts`;
  * `renderer.tsx`;
  * `fixture.ts`;
  * `validation-cases.ts`;
  * contratos e índice anteriores foram substituídos pelos contratos raiz.
* O namespace antigo foi removido de `lib/conversion-content/index.ts`.
* O script antigo `validate:landing-page` foi removido.
* O boundary foi reconstruído somente com os artefatos raiz previstos em 2.4.
* Buscas pós-substituição confirmaram ausência dos símbolos antigos em consumidores reais.
* `validate:commercial-activation` permaneceu funcional.
* O rollback técnico permanece o revert do commit ou do PR material; o histórico anterior está preservado no Git.

2.13. Fluxo operacional

* Gatilho:
  * debate humano encerrado;
  * plano-base v2 validado e mergeado;
  * fase 3.1 instruída ao Executor conforme `docs/prompt-executor.md`.
* Entrada:
  * decisões de `docs/lp-planejamento.md`;
  * plano-base v2;
  * implementação anterior;
  * consumidores reais encontrados por busca;
  * design system vigente;
  * blueprint imobiliário como evidência parcial;
  * regras técnicas e operacionais do repositório.
* Processamento concluído:
  * mapear consumidores;
  * remover, desacoplar ou redirecionar consumidores;
  * remover atomicamente a implementação anterior;
  * criar contratos públicos e registry versionado;
  * definir schema e resolver;
  * definir casos executáveis de validação;
  * ajustar reexport e script;
  * atualizar o estado da fase no plano-base.
* Validação concluída:
  * referências antes e depois;
  * ausência da implementação antiga;
  * schema estrito;
  * casos positivos e negativos;
  * imutabilidade profunda;
  * `npm ci`;
  * `npm run validate:landing-page-root`;
  * `npm run validate:commercial-activation`;
  * `npm run check`;
  * checks aplicáveis do PR material.
* Persistência:
  * somente arquivos versionados no repositório;
  * sem banco, migration ou configuração dinâmica.
* Consumo:
  * E18.5 e consumidores posteriores importam o contrato raiz resolvido.
* Fallback:
  * versão, preset ou contrato inválido falha fechado;
  * necessidade futura de banco, rota, Admin ou infraestrutura depende de plano próprio;
  * a implementação antiga não é fallback permitido.

2.14. Relatório documental

* Foi usado relatório consolidado ao final da fase material porque o plano possuía uma única fase, sem banco e sem automação.
* O relatório registrou:
  * substituição da antiga E18.4;
  * arquivos criados, ajustados e excluídos;
  * consumidores removidos, desacoplados ou redirecionados;
  * remoção do contrato normativo antigo;
  * nova fonte raiz versionada;
  * preservação de E18.2, E18.3 e `commercial_activation`;
  * distinção entre faixas recomendadas e limites absolutos;
  * fontes e hipóteses dos parâmetros v1;
  * papéis visuais abstratos;
  * checks executados.
* O PR #566 materializou a atualização durável de `docs/roadmap.md` e `docs/base-tecnica.md`.
* O PR #567 conclui o alinhamento de `docs/lp-planejamento.md` e deste plano-base.

3. Fases e próxima ação

3.1. E18.4.3–E18.4.8 — Remoção obrigatória da implementação antiga e parametrização raiz v1

* Status: concluída, aprovada e mergeada no PR #564 em 13/07/2026.
* Automação: não.
* Risco da execução: médio controlado.
* Entrega concluída:
  * consumidores identificados e classificados;
  * consumidores removidos, desacoplados ou redirecionados;
  * implementação antiga excluída;
  * boundary reconstruído com a raiz versionada;
  * índice agregado e script ajustados;
  * patch técnico do Analista incorporado;
  * validações concluídas;
  * estado da fase atualizado.
* Critérios de aceite atendidos:
  * fonte raiz v1 criada no boundary canônico;
  * registry como única fonte dos valores efetivamente resolvidos;
  * schema com allowlists e invariantes estruturais de validação, sem se tornar fonte dos valores resolvidos, e resolver sem valores próprios de fallback;
  * resolução pelo `defaultPreset` da versão;
  * contratos públicos profundamente `readonly`;
  * saída sem referência mutável;
  * erros discriminados e fail-closed;
  * papéis, faixas, limites, critérios e presets materializados;
  * ausência de módulos, variantes, composition, content schema e renderer;
  * `commercial_activation` preservada;
  * script antigo removido e script novo funcional;
  * checks concluídos com zero erros.

3.2. Item 7 — Instrução ao Executor

* Status: concluído.
* A fase 3.1 foi enviada ao Executor após o merge do PR #563 e a criação de branch material dedicada.
* O Executor executou somente a fase autorizada e atualizou apenas o estado do plano-base durante a implementação.
* Não foi criado briefing ou handoff para Codex Web.
* Não existe nova fase material a enviar ao Executor na E18.4.

3.3. Encerramento documental obrigatório

* Status:
  * implementação material aprovada e mergeada no PR #564;
  * checks materiais concluídos;
  * atualização de `docs/roadmap.md` e `docs/base-tecnica.md` mergeada no PR #566;
  * precisão conceitual de `docs/lp-planejamento.md` e encerramento do plano-base incluídos no PR #567.
* A E18.4 fica formalmente encerrada por este registro documental.
* A próxima ação é iniciar `docs/lousa-plano-base-e18-5.md`.

4. Escopo negativo e critérios de parada

4.1. Fora do escopo

* Catálogo de entradas.
* Composição por taxon.
* Herança concreta de composição.
* Pesquisas estruturadas e resolução por taxon.
* `copy_source_map`.
* `funnel_copy_profile`.
* Módulos.
* Variantes.
* Cardinalidades de módulos ou campos.
* Schemas de conteúdo por variante.
* Renderer de LP.
* Render model.
* Fixture de LP completa.
* Conta de teste.
* Autorização de conta, taxon ou plano.
* Entitlement.
* Geração, revisão, edição, publicação ou tracking de LP.
* Admin Dashboard.
* Editor visual.
* Banco, migration, RPC, policy, grant, trigger ou tabela.
* Rota, API ou Server Action.
* Configuração dinâmica em runtime.
* Agente, automação, job, fila ou workflow novo.
* Branding por cliente.
* Alteração funcional de `commercial_activation`.
* Alteração funcional de E18.2 ou E18.3.
* Auditoria completa de acessibilidade.
* Declaração de conformidade integral com WCAG.
* Alteração de bundler ou infraestrutura de build.
* Briefing, handoff ou execução pelo Codex Web.

4.2. Critérios gerais de parada

* Falta de fonte obrigatória para decisão material futura.
* Contradição entre a `main` e este plano que altere escopo, risco ou arquitetura.
* Necessidade comprovada de banco ou infraestrutura não autorizada.
* Risco de regressão em `commercial_activation`.
* Necessidade de definir módulo, variante, composição ou conteúdo concreto dentro da E18.4.
* Falha de validação que exija ampliação do recorte encerrado.
* Necessidade de alterar bundler, `next.config`, loader, plugin ou dependência.
* Qualquer necessidade futura desses itens deve ser tratada no plano-base competente, sem reabrir a E18.4 por conveniência.

4.3. Encerramento do plano

* O debate humano foi encerrado.
* O plano-base v2 foi validado e mergeado no PR #563.
* A fase material foi concluída, aprovada e mergeada no PR #564.
* O PR documental obrigatório foi mergeado no PR #566.
* O PR #567 registra o último alinhamento conceitual conhecido e atualiza este estado final.
* O caso E18.4 não possui pendência material.
* A E18.4 está formalmente encerrada por este ajuste documental.
* A próxima ação é iniciar o plano-base da E18.5, sem reabrir a E18.4.

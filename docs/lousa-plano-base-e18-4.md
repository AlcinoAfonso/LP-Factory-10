13/07/2026 — Plano-base E18.4 — Parametrização raiz da família `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/design-system.md`, `docs/lp-planejamento.md`, `docs/gestor-estrutural.md`, `docs/vercel-up.md`, `docs/prod-up.md`, conteúdo anterior deste path, `package.json`, `lib/conversion-content/index.ts`, `lib/conversion-content/landing-page/`, referências relacionadas na `main` após o merge do PR #559 e avaliações do Analista, Gestor Estrutural e Gestor de Updates sobre o PR #563.

Status: plano-base v2 validado; PR #563 estritamente documental e pronto para merge. A implementação somente fica autorizada após o merge deste plano na `main`, atualização da base e criação de branch dedicada.

Path: `docs/lousa-plano-base-e18-4.md`.

Recorte previsto do roadmap: `18.4 — Parametrização raiz da família landing_page`.

1. Estado e decisões fixas

1.1. Estado do caso

* O PR #559 foi mergeado na `main` em 13/07/2026.
* `docs/lp-planejamento.md` na `main` é a decisão conceitual obrigatória para este recorte.
* O conteúdo anterior deste plano-base pertence ao desenho superado de `18.4 — Base de composição landing_page` e foi substituído no mesmo path.
* O PR #563 contém somente a substituição documental deste plano-base e não pode receber implementação material.
* As avaliações do Analista, Gestor Estrutural e Gestor de Updates foram recebidas e consolidadas.
* A avaliação final da v2 aprovou o conteúdo técnico e exigiu a separação processual entre o merge do plano e o futuro PR de implementação.
* O plano-base atual trata exclusivamente a parametrização raiz da família `landing_page`.
* `docs/roadmap.md`, `docs/base-tecnica.md` e parte das referências normativas ainda descrevem a implementação anterior.
* A implementação técnica pode ser concluída antes da correção documental final, mas a E18.4 não pode ser formalmente encerrada enquanto o PR documental obrigatório definido em 1.4 não estiver mergeado.

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
* A parametrização raiz deve ser versionada no repositório.
* A fonte versionada não exige configuração dinâmica em runtime.
* Os valores iniciais são hipóteses editoriais e visuais até a validação da primeira LP real.
* A parametrização raiz deve resolver apenas regras comuns da família `landing_page`.
* Módulos e variantes serão definidos no recorte E18.5 e não podem ser antecipados neste plano.
* Catálogo de entradas, composição por taxon, pesquisas estruturadas, autorização de contas, geração de LP, Admin e editor visual permanecem em seus recortes próprios.
* A implementação material deve ocorrer como uma única substituição atômica; não é permitido remover a implementação anterior sem criar e validar a nova raiz no mesmo commit da fase.
* O PR #563 deve ser mergeado antes da criação da branch material.
* A implementação deve ocorrer em branch e PR próprios, criados a partir da `main` já atualizada com o plano mergeado.

1.3. Estado técnico confirmado

* A implementação anterior está concentrada em `lib/conversion-content/landing-page/` e contém:
  * contratos de composição;
  * catálogo de módulos e variantes;
  * schemas Zod por variante;
  * registry;
  * validador de composição;
  * render model;
  * renderer;
  * fixture;
  * casos de validação.
* O índice `lib/conversion-content/index.ts` expõe a implementação anterior como namespace `landingPage`.
* `package.json` expõe o script `validate:landing-page`.
* Não foram identificados consumidores externos do renderer, registry, schemas ou resolvedor anterior.
* A ausência de consumidor externo é premissa a ser reconfirmada por busca antes e depois da substituição.
* O LP Builder atual cria apenas o registro mínimo de LP em `account_landing_pages` e não depende da implementação anterior da E18.4.
* O schema atual possui `template_family = landing_page`, mas não possui registros-base nem persistência própria para a parametrização raiz.
* Nenhuma mudança de banco é necessária para este recorte.
* O projeto usa a configuração atual de Next.js 16; a fase não pode alterar bundler, `next.config`, loaders, plugins ou dependências.

1.4. Roadmap afetado e gate documental

* Seção principal:
  * E18 — Base transversal de templates, módulos, composições e artefatos.
* Recorte substituído:
  * `18.4 — Base de composição landing_page`.
* Novo recorte:
  * `18.4 — Parametrização raiz da família landing_page`.
* Subseções previstas:
  * `18.4.1 — Objetivo e status`;
  * `18.4.2 — Registros do recorte`, quando houver implementação material;
  * `18.4.3 — Fonte versionada e contrato de resolução`;
  * `18.4.4 — Papéis semânticos e faixas editoriais`;
  * `18.4.5 — Limites técnicos de conteúdo`;
  * `18.4.6 — Critérios visuais e responsivos`;
  * `18.4.7 — Presets e relação com o design system`;
  * `18.4.8 — Herança, precedência e validação`;
  * `18.4.9 — Limites do recorte`.
* O Executor da fase material não deve alterar `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/design-system.md` ou `docs/lp-planejamento.md`.
* Após implementação, validação técnica e aprovação da fase, o Gestor de Docs deve abrir PR obrigatório para atualizar:
  * objetivo e status gerais da E18 em `docs/roadmap.md`;
  * `18.1.5` em `docs/roadmap.md`;
  * substituição integral da antiga seção `18.4` pela nova E18.4;
  * criação documental da futura `18.5 — Parametrização de módulos e variantes landing_page`;
  * seção `3.15.2` de `docs/base-tecnica.md`;
  * changelog de `docs/base-tecnica.md`;
  * `docs/lp-planejamento.md`, para explicitar que faixas recomendadas podem ser especializadas dentro do limite absoluto e que limites absolutos somente mudam por nova versão da raiz;
  * demais referências normativas comprovadamente vinculadas à implementação removida.
* O relatório ao Gestor de Docs é obrigatório, mas não satisfaz sozinho o gate.
* O encerramento formal da E18.4 exige o merge do PR documental obrigatório.

1.5. Avaliações e autorização

* Analista: avaliação recebida e condicionantes incorporadas.
* Gestor Estrutural: avaliação recebida e condicionantes incorporadas.
* Gestor de Updates: avaliação recebida e updates elegíveis incorporados.
* Gestor de Automação: não aplicável, pois todas as fases estão marcadas como `Automação: não`.
* A avaliação única foi concluída; não abrir nova rodada completa dos três especialistas sem mudança material de escopo.
* A avaliação final da v2 aprovou tecnicamente o plano e fechou a sequência processual obrigatória de merge, atualização da base, branch dedicada e PR material separado.
* O plano-base v2 está validado.
* O Executor permanece bloqueado enquanto o PR #563 não estiver mergeado e a branch material não tiver sido criada a partir da `main` atualizada.

1.6. Consolidação das avaliações

* Pontos aceitos:
  * transformar a correção normativa em gate real de encerramento;
  * manter o PR #563 exclusivamente documental;
  * mergear o plano antes de iniciar a implementação;
  * criar branch e PR próprios para a fase material;
  * manter a execução como operação atômica;
  * repetir buscas de referências antes e depois da remoção;
  * criar registry explícito por versão como única fonte dos valores efetivos;
  * resolver o preset padrão pela própria versão, sem hardcode no resolver;
  * adicionar novas versões sem apagar ou alterar os parâmetros das versões anteriores;
  * permitir especialização das faixas recomendadas para cima ou para baixo dentro do limite absoluto;
  * proibir ampliação de limite absoluto sem nova versão da raiz;
  * exigir imutabilidade profunda;
  * usar `contracts.ts` como contrato público do boundary;
  * substituir tokens concretos por papéis visuais abstratos e enumerados;
  * definir erros tipados e resultado discriminado;
  * definir contagem e normalização de texto;
  * definir lifecycle de status;
  * usar WCAG 2.2 como baseline de referência, sem declarar conformidade integral;
  * tratar 44 × 44 px como padrão interno conservador;
  * manter compatibilidade com a configuração atual de Next.js e Turbopack sem alterar bundler;
  * classificar a execução como risco médio controlado.
* Pontos rejeitados:
  * considerar o simples envio de relatório ao Gestor de Docs suficiente para encerrar a E18.4;
  * expor nomes concretos de tokens do design system no contrato raiz;
  * classificar a execução material como baixo risco;
  * permitir fallback silencioso para versão, preset ou contrato inválido;
  * permitir alteração parcial que remova o código anterior antes da raiz validável;
  * implementar na branch ou no PR documental #563;
  * enviar briefing ao Executor antes do merge do plano na `main`.
* Pontos pendentes:
  * merge do PR #563;
  * atualização da `main` usada como base;
  * criação da branch material dedicada;
  * envio do briefing da fase 3.1 ao Executor;
  * implementação e validação técnica da fase;
  * PR documental obrigatório posterior e seu merge;
  * validação futura das hipóteses v1 por LP real.
* Pontos já cobertos e preservados:
  * boundary canônico;
  * ausência de banco, Admin, rota, renderer, módulos e variantes;
  * preservação de `commercial_activation`, E18.2 e E18.3;
  * remoção segura dos nove arquivos antigos;
  * substituição do namespace e do script de validação;
  * checks `npm ci`, validação específica e `npm run check`;
  * proibição de `npm run build` no sandbox;
  * manutenção do mesmo path para o plano-base.

2. Contrato do caso

2.1. Problema

* A implementação anterior definiu módulos, variantes, schemas, composição e renderer antes de existir uma parametrização raiz aprovada.
* Limites editoriais foram hardcoded em schemas independentes.
* Valores visuais e responsivos foram hardcoded no renderer.
* `spacing` foi tratado apenas como configuração por seção, sem uma fonte comum versionada.
* Não existe contrato único para geração, validação e futura renderização derivarem os mesmos limites.
* Manter a implementação anterior criaria uma falsa base aprovada e condicionaria prematuramente a E18.5, a E20 e a E19.

2.2. Resultado esperado

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
* Remover com segurança os módulos, variantes, schemas e renderer prematuros.

2.3. Usuários e consumidores

* Usuários diretos:
  * Executor;
  * Estrategista;
  * especialistas responsáveis pela avaliação;
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
* A implementação anterior deve ser removida integralmente e o mesmo boundary deve ser reconstruído no mesmo commit apenas com artefatos da parametrização raiz.
* Não criar path paralelo para a nova E18.4.
* Artefatos previstos:
  * `lib/conversion-content/landing-page/contracts.ts`;
  * `lib/conversion-content/landing-page/root-registry.ts`;
  * `lib/conversion-content/landing-page/root-schema.ts`;
  * `lib/conversion-content/landing-page/root-resolver.ts`;
  * `lib/conversion-content/landing-page/root-validation-cases.ts`;
  * `lib/conversion-content/landing-page/index.ts`.
* Responsabilidades:
  * `contracts.ts` expõe somente tipos públicos `readonly`, códigos de erro, resultado discriminado e contratos de leitura;
  * `root-registry.ts` contém uma única ocorrência dos valores efetivos de cada versão;
  * `root-schema.ts` valida estrutura e invariantes sem repetir números, presets ou valores efetivos do registry;
  * `root-resolver.ts` consulta exclusivamente o registry e não possui valores próprios de fallback;
  * `root-validation-cases.ts` prova os casos positivos, negativos, versionamento e imutabilidade;
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
* O índice agregado deve remover o namespace antigo `landingPage` e, se o reexport agregado for mantido, usar identidade explícita `landingPageRoot`.
* O script antigo `validate:landing-page` deve ser removido e substituído por `validate:landing-page-root`.
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
* Os valores são hipóteses v1 e somente mudam por nova versão após evidência de LP real.

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
* A raiz deve registrar a regra de hierarquia semântica `h1 → h2 → h3`, sem criar módulos ou seções.

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

* Resolver público previsto:
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
* O resolver não deve consultar banco, env, API, arquivo remoto ou configuração dinâmica.
* O resultado resolvido deve ser profundamente somente leitura e não expor referência mutável.
* Consumidores futuros devem importar o contrato resolvido, sem copiar valores para fontes independentes.
* Consumidores que criarem persistência em recortes posteriores devem registrar a versão e o preset usados no próprio snapshot ou artefato, conforme o plano competente.

2.10. Herança e precedência

* Precedência futura obrigatória:
  * parametrização raiz e preset selecionado;
  * especialização do módulo;
  * especialização da variante;
  * escolha permitida por ocorrência da seção.
* A raiz define os limites absolutos máximos da família.
* Faixas recomendadas:
  * módulo ou variante pode especializar mínimo e máximo para cima ou para baixo;
  * a especialização deve ser explícita e justificada na E18.5;
  * o mínimo especializado deve ser maior ou igual a 1;
  * o mínimo especializado não pode superar o máximo especializado;
  * o máximo especializado não pode superar o limite absoluto da raiz.
* Limites técnicos absolutos:
  * módulo ou variante pode impor limite mais restritivo;
  * módulo ou variante não pode ampliar o limite absoluto da raiz;
  * necessidade de ampliação exige nova `rootVersion`.
* Opções comuns:
  * módulo ou variante pode restringir opções permitidas;
  * módulo ou variante não pode criar opção fora da enumeração da raiz.
* Escolha por ocorrência não pode alterar papel semântico, limite absoluto, schema, renderer ou componente.
* Taxon, catálogo, composição, entrada de conta, intenção, funil e conteúdo não podem sobrescrever a parametrização raiz.
* Ausência de especialização deve herdar o valor da camada anterior.
* Conflito ou valor desconhecido deve falhar fechado, sem fallback silencioso.

2.11. Validações executáveis

* O schema da raiz deve ser Zod estrito.
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
  * ausência de módulos, variantes, composition e renderer no contrato raiz.
* Validações da fase:
  * busca de referências antes e depois da substituição;
  * `npm ci`;
  * `npm run validate:landing-page-root`;
  * `npm run check`;
  * checks do PR de implementação em estado verde.
* Os checks acima pertencem ao PR material separado, não ao PR documental #563.
* `npm run build` não deve ser executado no sandbox, conforme `AGENTS.md` e `docs/base-tecnica.md`.
* Validação visual e auditoria WCAG não se aplicam neste recorte porque não haverá renderer ou superfície visual.

2.12. Remoção segura da implementação anterior

* Antes da remoção:
  * buscar imports e usos externos de `LandingPageRenderer`, `buildLandingPageRenderModel`, `landingPageSectionRegistry`, `validateLandingPageComposition` e do namespace `landingPage`;
  * confirmar que não existe consumidor fora do diretório antigo e das referências conhecidas;
  * confirmar que `commercial_activation` não importa artefatos da implementação anterior.
* Remover os arquivos anteriores:
  * `contracts.ts` anterior;
  * `schemas.ts`;
  * `registry.ts`;
  * `composition-validator.ts`;
  * `render-model.ts`;
  * `renderer.tsx`;
  * `fixture.ts`;
  * `validation-cases.ts`;
  * `index.ts` anterior.
* Recriar `contracts.ts` no mesmo commit somente com o contrato público da parametrização raiz.
* Remover o namespace antigo de `lib/conversion-content/index.ts`.
* Remover o script antigo `validate:landing-page`.
* Reconstruir o mesmo boundary somente com os artefatos raiz previstos em 2.4.
* Depois da substituição:
  * repetir a busca de referências;
  * confirmar ausência de símbolos e paths órfãos;
  * confirmar que `validate:commercial-activation` permanece inalterado;
  * confirmar que o diff não altera E18.2, E18.3, migrations, schema, Admin, LP Builder ou runtime público.
* O rollback técnico é o revert do commit ou do PR da fase; o histórico anterior permanece no Git.
* Referências normativas antigas não serão apagadas pelo Executor; serão corrigidas pelo PR documental obrigatório definido em 1.4.

2.13. Fluxo operacional

* Gatilho:
  * PR #563 mergeado na `main`;
  * `main` atualizada como base de trabalho;
  * branch material dedicada criada;
  * briefing da fase 3.1 enviado pelo Estrategista ao Executor.
* Entrada:
  * decisões de `docs/lp-planejamento.md`;
  * plano-base v2 mergeado na `main`;
  * implementação anterior;
  * design system vigente;
  * regras técnicas e operacionais do repositório.
* Processamento:
  * verificar dependências;
  * remover atomicamente a implementação anterior;
  * criar contratos públicos e registry versionado;
  * definir schema e resolver;
  * definir casos executáveis de validação;
  * ajustar reexport e script;
  * atualizar o status da fase neste plano no PR material separado.
* Validação:
  * referências;
  * schema estrito;
  * casos positivos e negativos;
  * imutabilidade profunda;
  * `npm ci`;
  * `npm run validate:landing-page-root`;
  * `npm run check`;
  * checks aplicáveis do PR material.
* Persistência:
  * somente arquivos versionados no repositório;
  * sem banco, migration ou configuração dinâmica.
* Consumo:
  * E18.5 e consumidores posteriores importam o contrato raiz resolvido.
* Fallback:
  * versão, preset ou contrato inválido falha fechado;
  * dependência externa inesperada bloqueia a fase e devolve o caso ao Estrategista;
  * erro de bundler ou incompatibilidade com a configuração atual bloqueia a fase;
  * necessidade de banco, rota, Admin ou nova infraestrutura bloqueia a fase e exige nova decisão humana.

2.14. Relatório documental

* Usar relatório consolidado ao final da fase material.
* Justificativa:
  * plano curto;
  * uma única fase material;
  * sem banco;
  * sem automação;
  * atualização documental intermediária criaria repetição.
* O relatório final deve indicar ao Gestor de Docs:
  * substituição da antiga E18.4;
  * arquivos criados, ajustados e excluídos;
  * remoção do contrato normativo antigo;
  * nova fonte raiz versionada;
  * ausência de alteração em E18.2, E18.3 e `commercial_activation`;
  * subseções exatas do roadmap previstas em 1.4;
  * distinção consolidada entre faixas recomendadas e limites absolutos;
  * papéis visuais abstratos e ausência de tokens concretos no contrato raiz;
  * checks executados e eventuais limitações.
* O relatório deve resultar em PR documental obrigatório; não é suficiente como encerramento isolado.

3. Fases e próxima ação

3.1. E18.4.3–E18.4.8 — Substituição segura e parametrização raiz v1

* Status: pendente; plano-base v2 validado, mas implementação condicionada ao merge do PR #563 e à criação de branch material dedicada.
* Automação: não.
* Risco da execução: médio controlado.
* Objetivo:
  * substituir atomicamente a implementação anterior pela fonte versionada da parametrização raiz v1.
* Arquivos a excluir:
  * os nove arquivos da implementação anterior listados em 2.12.
* Arquivos a criar ou recriar:
  * `lib/conversion-content/landing-page/contracts.ts`;
  * `lib/conversion-content/landing-page/root-registry.ts`;
  * `lib/conversion-content/landing-page/root-schema.ts`;
  * `lib/conversion-content/landing-page/root-resolver.ts`;
  * `lib/conversion-content/landing-page/root-validation-cases.ts`;
  * `lib/conversion-content/landing-page/index.ts`.
* Arquivos a ajustar no PR material separado:
  * `lib/conversion-content/index.ts`;
  * `package.json`;
  * `docs/lousa-plano-base-e18-4.md`, somente para atualizar o estado da fase.
* Não alterar:
  * `lib/conversion-content/commercial-activation/`;
  * adapters de `commercial_activation`;
  * `lib/lp-builder/`;
  * migrations e snippets;
  * `docs/roadmap.md`;
  * `docs/base-tecnica.md`;
  * `docs/schema.md`;
  * `docs/design-system.md`;
  * `docs/lp-planejamento.md`;
  * `next.config`;
  * configuração de bundler, loaders ou plugins;
  * dependências npm.
* Critérios de aceite:
  * substituição concluída em uma única operação atômica;
  * implementação anterior removida sem referência órfã;
  * fonte raiz v1 criada no boundary canônico;
  * registry por versão contém uma única ocorrência dos valores efetivos;
  * schema e resolver não duplicam números, presets ou limites do registry;
  * resolver usa o `defaultPreset` da versão resolvida;
  * contrato público usa tipos profundamente `readonly`;
  * resultado resolvido não expõe referência mutável;
  * erros discriminados e fail-closed implementados;
  * papéis, faixas, limites, critérios e presets correspondem ao contrato da seção 2;
  * faixas recomendadas não bloqueiam conteúdo dentro do limite absoluto;
  * limite absoluto inválido falha fechado;
  * papéis visuais abstratos são estritos e não contêm tokens concretos;
  * referência WCAG 2.2 e padrão interno de 44 × 44 px permanecem no contrato, sem declaração de conformidade integral;
  * TypeScript simples e compatível com a configuração atual do projeto e Turbopack;
  * nenhuma definição de módulo, variante, composition, content schema ou renderer;
  * `commercial_activation` preservada;
  * script antigo removido e script novo funcional;
  * `npm ci` concluído;
  * `npm run validate:landing-page-root` concluído;
  * `npm run check` concluído;
  * checks do PR material em estado verde;
  * diff limitado ao escopo aprovado.
* Critérios de parada:
  * interromper se surgir consumidor externo não mapeado;
  * interromper se a remoção exigir alterar `commercial_activation`, LP Builder, banco, rota ou Admin;
  * interromper se o contrato raiz exigir conhecimento de módulo, variante, taxon, composição ou conteúdo concreto;
  * interromper se surgir necessidade de alterar `next.config`, bundler, loader, plugin ou dependência;
  * interromper diante de erro de Turbopack ou bundler sem correção estritamente interna aos arquivos autorizados;
  * interromper se os checks aplicáveis falharem sem correção restrita ao escopo.

3.2. Merge do plano e envio ao Executor

* Sequência obrigatória:
  * validar definitivamente o plano-base v2;
  * marcar o PR #563 como pronto para revisão;
  * mergear o PR #563 na `main`;
  * atualizar a `main` usada como base de trabalho;
  * criar branch dedicada para a implementação da fase 3.1;
  * preparar briefing Codex baseado em `docs/template-briefing-codex.md`;
  * enviar somente a fase 3.1 ao Executor, aplicando integralmente `docs/prompt-executor.md`;
  * abrir PR de implementação separado.
* O PR #563 permanece estritamente documental e não pode receber arquivos materiais da fase 3.1.
* “Checks aplicáveis do PR” significa checks do PR de implementação separado.
* A atualização de status deste plano durante a execução deve ocorrer no PR material separado.
* Não enviar fase documental ou fase adicional em paralelo.
* O Executor permanece bloqueado até o merge do PR #563 e a criação da branch material dedicada.

3.3. Encerramento documental obrigatório

* Após implementação e checks da fase 3.1:
  * o Analista deve avaliar o resultado material;
  * o Estrategista deve consolidar o relatório final;
  * o Gestor de Docs deve abrir o PR obrigatório definido em 1.4.
* A conclusão técnica da fase 3.1 não encerra formalmente a E18.4.
* A E18.4 somente pode receber status final de encerrada após:
  * implementação material aprovada;
  * checks aplicáveis verdes;
  * PR documental obrigatório mergeado;
  * ausência de drift normativo conhecido sobre a antiga E18.4.

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
* Alteração de `commercial_activation`.
* Alteração de E18.2 ou E18.3.
* Auditoria completa de acessibilidade.
* Declaração de conformidade integral com WCAG.
* Alteração de bundler ou infraestrutura de build.
* Implementação material no PR #563.

4.2. Critérios gerais de parada

* Falta de fonte obrigatória para decisão material.
* Contradição entre a `main` e este plano que altere escopo, risco ou arquitetura.
* Necessidade comprovada de banco ou infraestrutura não autorizada.
* Dependência externa real da implementação anterior que não possa ser removida dentro do recorte.
* Risco de regressão em `commercial_activation`.
* Necessidade de definir módulo, variante, composição ou conteúdo concreto para completar a raiz.
* Falha de validação que exija ampliação de escopo.
* Necessidade de alterar bundler, `next.config`, loader, plugin ou dependência.
* Tentativa de implementar antes do merge do PR #563.
* Tentativa de implementar na branch documental do PR #563.

4.3. Encerramento do plano

* O plano-base v2 está validado e pronto para merge no PR #563.
* O plano material termina quando a fase 3.1 estiver implementada, validada e aprovada pelo Analista.
* O caso E18.4 permanece em encerramento documental até o merge do PR obrigatório do Gestor de Docs.
* Não existe fase administrativa, de automação ou de handoff.
* O Estrategista entrega relatório consolidado ao Gestor de Docs e acompanha o gate documental até o merge.

13/07/2026 — Plano-base E18.4 — Parametrização raiz da família `landing_page`

Fontes: chat, `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/template-roadmap.md`, `docs/template-briefing-codex.md`, `docs/prompt-executor.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/design-system.md`, `docs/lp-planejamento.md`, conteúdo anterior deste path, `package.json`, `lib/conversion-content/index.ts`, `lib/conversion-content/landing-page/` e referências relacionadas na `main` após o merge do PR #559.

Status: plano-base v1 completo em PR vivo; aguardando avaliação única dos especialistas.

Path: `docs/lousa-plano-base-e18-4.md`.

Recorte previsto do roadmap: `18.4 — Parametrização raiz da família landing_page`.

1. Estado e decisões fixas

1.1. Estado do caso

* O PR #559 foi mergeado na `main` em 13/07/2026.
* `docs/lp-planejamento.md` na `main` é a decisão conceitual obrigatória para este recorte.
* O conteúdo anterior deste plano-base pertence ao desenho superado de `18.4 — Base de composição landing_page` e deve ser substituído no mesmo path.
* `docs/roadmap.md` e `docs/base-tecnica.md` ainda registram a implementação anterior como estado vigente; esse drift documental só deve ser corrigido pelo Gestor de Docs após a implementação e validação deste plano.
* O plano-base atual passa a tratar exclusivamente a parametrização raiz da família `landing_page`.

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
* O LP Builder atual cria apenas o registro mínimo de LP em `account_landing_pages` e não depende da implementação anterior da E18.4.
* O schema atual possui `template_family = landing_page`, mas não possui registros-base nem persistência própria para a parametrização raiz.
* Nenhuma mudança de banco é necessária para este recorte.

1.4. Roadmap afetado

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
* O Executor não deve alterar `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md` ou `docs/design-system.md`.

1.5. Destinatários da avaliação única

* Analista: aplicável.
* Gestor Estrutural: aplicável.
* Gestor de Updates: aplicável.
* Gestor de Automação: não aplicável, pois todas as fases estão marcadas como `Automação: não`.
* Nenhuma implementação pode ser enviada ao Executor antes da consolidação do plano-base v2 no mesmo PR.

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
* Definir papéis semânticos comuns da família `landing_page`.
* Definir faixas editoriais recomendadas.
* Definir limites técnicos absolutos.
* Definir critérios visuais e responsivos comuns.
* Definir presets amplos da página sem confundi-los com escolhas por ocorrência de seção.
* Definir relação explícita com o design system existente.
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

2.4. Fonte versionada e boundary

* Boundary canônico preservado:
  * `lib/conversion-content/landing-page/`.
* A implementação anterior deve ser removida integralmente e o mesmo boundary deve ser reconstruído no mesmo commit apenas com artefatos da parametrização raiz.
* Não criar path paralelo para a nova E18.4.
* Artefatos previstos:
  * `lib/conversion-content/landing-page/root-contract.ts`;
  * `lib/conversion-content/landing-page/root-schema.ts`;
  * `lib/conversion-content/landing-page/root-resolver.ts`;
  * `lib/conversion-content/landing-page/root-validation-cases.ts`;
  * `lib/conversion-content/landing-page/index.ts`.
* Identidade inicial:
  * `family = landing_page`;
  * `root_version = 1`;
  * `status = hypothesis`;
  * `default_preset = balanced`.
* O objeto raiz deve ser imutável em runtime e validado por schema estrito.
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
* Os limites absolutos devem falhar fechado.
* Os valores devem ser registrados como hipóteses v1 e revistos somente por nova versão após evidência de LP real.

2.6. Limites técnicos comuns

* Conteúdo textual deve ser validado após `trim`.
* Campo presente deve conter texto não vazio.
* O contrato raiz aceita apenas texto simples para os papéis semânticos.
* HTML, script, CSS, Tailwind, nomes de componentes, props arbitrárias e instruções de renderer são proibidos.
* O contrato raiz não define quantidade de cards, benefícios, passos, FAQs ou seções; cardinalidades pertencem à E18.5.
* O contrato raiz não define URLs, formulários, provas, oferta, preço, escassez, garantia ou tratamentos comerciais; essas regras pertencem aos recortes posteriores.
* A raiz permite os valores comuns de espaçamento:
  * `compact`;
  * `default`;
  * `spacious`.
* `spacing` continua sendo escolha limitada por ocorrência de seção na composição futura; o preset define apenas o valor padrão da página.
* Deve existir exatamente um papel `h1` na LP final, mas a aplicação estrutural dessa regra pertence ao consumidor que conhecer a composição.
* A raiz deve registrar a regra de hierarquia semântica `h1 → h2 → h3`, sem criar módulos ou seções.

2.7. Critérios visuais e responsivos comuns

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
* Alvo interativo deve possuir área mínima de 44 × 44 px.
* Largura de leitura deve permanecer entre 45 e 75 caracteres por linha, com alvo padrão de até 68 `ch`.
* O `h1` deve permanecer legível e sem corte no mobile; alvo editorial de até quatro linhas em 360 px.
* `h2` deve permanecer legível e sem corte; alvo editorial de até três linhas em 360 px.
* Hierarquia visual deve acompanhar a hierarquia semântica.
* Foco visível, contraste e estados interativos devem usar os tokens semânticos do design system.
* Esses critérios são contrato da raiz; componentes e evidência visual executável só serão implementados em recortes posteriores.

2.8. Presets v1 e relação com o design system

* Preset `balanced`:
  * preset padrão;
  * densidade geral: `default`;
  * espaçamento padrão de seção: `default`;
  * largura máxima de página: `72rem`;
  * largura máxima de leitura: `68ch`;
  * escala responsiva de `h1`: `2.25rem` a `3rem`;
  * escala responsiva de `h2`: `1.5rem` a `1.875rem`;
  * escala de `h3`: `1.125rem`;
  * texto de corpo: `1rem`, admitindo `1.125rem` em destaque editorial.
* Preset `compact`:
  * uso para LP curta ou mais direta;
  * densidade geral: `compact`;
  * espaçamento padrão de seção: `compact`;
  * largura máxima de página: `68rem`;
  * largura máxima de leitura: `64ch`;
  * escala responsiva de `h1`: `2rem` a `2.5rem`;
  * escala responsiva de `h2`: `1.375rem` a `1.75rem`;
  * escala de `h3`: `1.0625rem`;
  * texto de corpo: `1rem`.
* Preset é configuração ampla da página e não seleciona módulos, variantes, ordem, conteúdo ou taxon.
* Preset não pode ampliar limites técnicos absolutos.
* Relação com o design system:
  * usar Inter como fonte-base inicial enquanto não houver decisão específica de branding da LP;
  * referenciar tokens semânticos existentes, como `primary`, `ring`, `border`, `surface`, `state`, `ink` e `graytech`;
  * não versionar classes Tailwind no contrato raiz;
  * não transformar a identidade visual do dashboard em branding obrigatório da LP;
  * não criar tokens novos neste recorte;
  * branding por cliente permanece fora do escopo.

2.9. Contrato de leitura

* Resolver público previsto:
  * `resolveLandingPageRootParameters({ rootVersion, presetKey })`.
* Entradas:
  * `rootVersion` obrigatório;
  * `presetKey` opcional, usando `balanced` quando ausente.
* Saída válida:
  * família;
  * versão da raiz;
  * status;
  * preset resolvido;
  * papéis semânticos;
  * faixas recomendadas;
  * limites absolutos;
  * opções comuns;
  * critérios visuais e responsivos.
* Versão desconhecida deve retornar erro tipado e falhar fechado.
* Preset desconhecido deve retornar erro tipado e falhar fechado.
* O resolver não deve consultar banco, env, API, arquivo remoto ou configuração dinâmica.
* O resultado resolvido deve ser somente leitura.
* Consumidores futuros devem importar o contrato resolvido, sem copiar valores para fontes independentes.

2.10. Herança e precedência

* Precedência futura obrigatória:
  * parametrização raiz e preset selecionado;
  * especialização do módulo;
  * especialização da variante;
  * escolha permitida por ocorrência da seção.
* A raiz define os limites absolutos da família.
* Módulo ou variante pode restringir faixas e opções quando houver justificativa registrada na E18.5.
* Módulo ou variante não pode ampliar limite absoluto da raiz.
* Necessidade de ampliar limite absoluto exige nova versão da raiz.
* Escolha por ocorrência não pode alterar papel semântico, limite absoluto, schema, renderer ou componente.
* Taxon, catálogo, composição, entrada de conta, intenção, funil e conteúdo não podem sobrescrever a parametrização raiz.
* Ausência de especialização deve herdar o valor da camada anterior.
* Conflito ou valor desconhecido deve falhar fechado, sem fallback silencioso.

2.11. Validações executáveis

* O schema da raiz deve ser Zod estrito.
* Casos mínimos de validação:
  * objeto v1 válido;
  * versão desconhecida;
  * preset desconhecido;
  * preset padrão inexistente;
  * papel semântico obrigatório ausente;
  * papel semântico desconhecido;
  * faixa recomendada invertida;
  * faixa recomendada acima do limite absoluto;
  * limite absoluto menor que 1;
  * valor de `spacing` desconhecido;
  * token semântico não permitido;
  * classe Tailwind ou estilo livre inserido no contrato;
  * mutação do resultado resolvido impedida ou sem efeito;
  * ausência de módulos, variantes, composition e renderer no contrato raiz.
* Validações da fase:
  * busca de referências antes e depois da substituição;
  * `npm ci`;
  * `npm run validate:landing-page-root`;
  * `npm run check`.
* `npm run build` não deve ser executado no sandbox, conforme `AGENTS.md` e `docs/base-tecnica.md`.
* Validação visual não se aplica neste recorte porque não haverá renderer ou superfície visual.

2.12. Remoção segura da implementação anterior

* Antes da remoção:
  * buscar imports e usos externos de `LandingPageRenderer`, `buildLandingPageRenderModel`, `landingPageSectionRegistry`, `validateLandingPageComposition` e do namespace `landingPage`;
  * confirmar que não existe consumidor fora do diretório antigo e das referências conhecidas;
  * confirmar que `commercial_activation` não importa artefatos da implementação anterior.
* Remover os arquivos anteriores:
  * `contracts.ts`;
  * `schemas.ts`;
  * `registry.ts`;
  * `composition-validator.ts`;
  * `render-model.ts`;
  * `renderer.tsx`;
  * `fixture.ts`;
  * `validation-cases.ts`;
  * `index.ts` anterior.
* Remover o namespace antigo de `lib/conversion-content/index.ts`.
* Remover o script antigo `validate:landing-page`.
* Reconstruir o mesmo boundary somente com os artefatos raiz previstos em 2.4.
* Depois da substituição:
  * repetir a busca de referências;
  * confirmar ausência de símbolos e paths órfãos;
  * confirmar que `validate:commercial-activation` permanece inalterado;
  * confirmar que o diff não altera E18.2, E18.3, migrations, schema, Admin, LP Builder ou runtime público.
* O rollback técnico é o revert do commit ou do PR da fase; o histórico anterior permanece no Git.
* Referências normativas antigas em documentos finais não serão apagadas pelo Executor; serão corrigidas posteriormente pelo Gestor de Docs com base no relatório consolidado.

2.13. Fluxo operacional

* Gatilho:
  * plano-base v2 consolidado e fase enviada pelo Estrategista ao Executor.
* Entrada:
  * decisões de `docs/lp-planejamento.md`;
  * plano-base v2;
  * implementação anterior;
  * design system vigente;
  * regras técnicas e operacionais do repositório.
* Processamento:
  * verificar dependências;
  * remover a implementação anterior;
  * criar a fonte raiz versionada;
  * definir schema e resolver;
  * definir casos executáveis de validação;
  * ajustar reexport e script.
* Validação:
  * referências;
  * schema estrito;
  * casos positivos e negativos;
  * `npm ci`;
  * `npm run validate:landing-page-root`;
  * `npm run check`.
* Persistência:
  * somente arquivos versionados no repositório;
  * sem banco, migration ou configuração dinâmica.
* Consumo:
  * E18.5 e consumidores posteriores importam o contrato raiz resolvido.
* Fallback:
  * versão ou preset inválido falha fechado;
  * dependência externa inesperada bloqueia a fase e devolve o caso ao Estrategista;
  * necessidade de banco, rota, Admin ou nova infraestrutura bloqueia a fase e exige nova decisão humana.

2.14. Relatório documental

* Usar relatório consolidado ao final do plano.
* Justificativa:
  * plano curto;
  * uma única fase material;
  * baixo risco;
  * sem banco;
  * sem automação;
  * atualização documental intermediária criaria drift e repetição.
* O relatório final deve indicar ao Gestor de Docs:
  * substituição da antiga E18.4;
  * arquivos criados, ajustados e excluídos;
  * remoção do contrato normativo antigo;
  * nova fonte raiz versionada;
  * ausência de alteração em E18.2, E18.3 e `commercial_activation`;
  * subseções exatas do roadmap previstas em 1.4.

3. Fases e próxima ação

3.1. E18.4.3–E18.4.8 — Substituição segura e parametrização raiz v1

* Status: pendente; não enviar ao Executor antes do plano-base v2 consolidado.
* Automação: não.
* Objetivo:
  * substituir atomicamente a implementação anterior pela fonte versionada da parametrização raiz v1.
* Arquivos a excluir:
  * os nove arquivos da implementação anterior listados em 2.12.
* Arquivos a criar:
  * `lib/conversion-content/landing-page/root-contract.ts`;
  * `lib/conversion-content/landing-page/root-schema.ts`;
  * `lib/conversion-content/landing-page/root-resolver.ts`;
  * `lib/conversion-content/landing-page/root-validation-cases.ts`;
  * `lib/conversion-content/landing-page/index.ts`.
* Arquivos a ajustar:
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
  * `docs/lp-planejamento.md`.
* Critérios de aceite:
  * implementação anterior removida sem referência órfã;
  * fonte raiz v1 criada no boundary canônico;
  * papéis, faixas, limites, critérios e presets correspondem ao contrato da seção 2;
  * resolver estrito e fail-closed;
  * nenhuma definição de módulo, variante, composition, content schema ou renderer;
  * `commercial_activation` preservada;
  * script antigo removido e script novo funcional;
  * `npm ci` concluído;
  * `npm run validate:landing-page-root` concluído;
  * `npm run check` concluído;
  * diff limitado ao escopo aprovado.
* Critério de parada:
  * interromper se surgir consumidor externo não mapeado;
  * interromper se a remoção exigir alterar `commercial_activation`, LP Builder, banco, rota ou Admin;
  * interromper se o contrato raiz exigir conhecimento de módulo, variante, taxon, composição ou conteúdo concreto;
  * interromper se os checks aplicáveis falharem sem correção restrita ao escopo.

3.2. Próxima ação do Estrategista

* Publicar este plano-base v1 no PR vivo.
* Solicitar uma única avaliação do plano completo para:
  * Analista;
  * Gestor Estrutural;
  * Gestor de Updates.
* Consolidar todos os retornos em uma única análise.
* Classificar cada ponto como:
  * aceito;
  * rejeitado;
  * pendente;
  * já coberto.
* Atualizar este mesmo arquivo para plano-base v2 no mesmo PR.
* Somente depois do v2 consolidado enviar a fase 3.1 ao Executor.

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

4.2. Critérios gerais de parada

* Falta de fonte obrigatória para decisão material.
* Contradição entre a `main` e este plano que altere escopo, risco ou arquitetura.
* Necessidade comprovada de banco ou infraestrutura não autorizada.
* Dependência externa real da implementação anterior que não possa ser removida dentro do recorte.
* Risco de regressão em `commercial_activation`.
* Necessidade de definir módulo, variante, composição ou conteúdo concreto para completar a raiz.
* Falha de validação que exija ampliação de escopo.
* Pedido de implementação antes da consolidação v2.

4.3. Encerramento do plano

* O plano termina quando a fase 3.1 estiver implementada, validada e aprovada pelo Analista.
* Não existe fase administrativa, de documentação final ou de handoff.
* Após a conclusão, o Estrategista entrega relatório consolidado ao Gestor de Docs.

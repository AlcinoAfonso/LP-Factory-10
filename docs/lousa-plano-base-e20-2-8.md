23/08/2026 — Plano-base v1 — E20.2.8 — Versão atual e propagação escalável do catálogo E20.2

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado a partir da decisão humana de 23/08/2026 e ajustado após revisão do Analista; implementação não autorizada por este documento.
- Caso macro: `E20 — preparação e liberação de taxons`.
- Recorte: `E20.2.8 — Versão atual e propagação escalável do catálogo E20.2`.
- Este recorte é uma evolução operacional da E20.2 já versionada; não reescreve nem invalida o histórico de `docs/lousa-plano-base-e20-2.md`.
- A E20.6 permanece responsável pela suficiência factual por taxon; este recorte altera a relação entre versão global do catálogo e necessidade de reavaliação, conforme a seção 2.3.
- A implementação física da autoridade de versão atual, de sua persistência e da superfície administrativa permanece pendente de recorte técnico sobre o repositório real.
- Rollback operacional para versão anterior não integra a primeira entrega da E20.2.8; eventual suporte futuro depende de contrato específico para compatibilidade com configurações persistidas em versões posteriores.

### 1.2. Fontes usadas

- `README.md`.
- `AGENTS.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e20-6.md`, incluindo o refinamento funcional/UX da E20.6.5 em discussão no PR #809.
- `docs/lousa-plano-base-e19-5.md`.
- `docs/lousa-plano-base-e21-2-5.md`, cuja implementação repo-side foi mergeada pelos PRs #807 e #810; gates operacionais pós-merge permanecem independentes deste recorte.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `lib/conversion-content/landing-page/input-catalog/registry.ts`.
- `lib/conversion-content/landing-page/input-catalog/resolver.ts`.
- `lib/conversion-content/landing-page/taxon-preparation/preparation.ts`.
- `lib/lp-builder/adapters/onboardingConfigurationAdapterCore.ts`, como consumidor E19.2 pré-handoff da versão operacional.
- `lib/lp-builder/landingPageWorkspace.ts`, `lib/lp-builder/adapters/landingPageWorkspaceAdapter.ts` e `lib/lp-builder/adapters/generationContextAdapter.ts`, como consumidores E19.5 atualmente fixados na versão 5 e no gate de igualdade exata.
- `lib/lp-builder/onboardingConfiguration.ts`, para a validação fail-closed de valores persistidos contra o catálogo resolvido.
- Decisões humanas desta conversa em 23/08/2026 sobre escala, versão default e experiência administrativa.
- Revisão do Analista de 23/08/2026 sobre autoridade `R → C`, consumidores E19.2/E19.5 e deferimento do rollback.

### 1.3. Problema e resultado esperado

- A E20.2 possui versões executáveis globais e resolução hierárquica `universal → segmento → nicho → ultranicho`, mas o contrato histórico exige versão explícita por consumidor e não define uma autoridade operacional única de versão atual.
- A E20.6 vigente grava `reviewed_input_catalog_version` por taxon e exige igualdade exata com a versão requerida. Essa combinação cria custo linear: uma nova versão pode obrigar o humano a visitar e reavaliar dezenas ou centenas de taxons apenas porque o número global mudou.
- A E19.2 pré-handoff e a E19.5 implementada hoje também materializam a versão operacional a partir de contratos fixos/igualdade exata; portanto o carry-forward da E20.6 somente escala se a versão efetivamente autorizada chegar de forma canônica a esses consumidores.
- O produto deve escalar para 100, 150 ou mais taxons sem transformar cada evolução do catálogo em trabalho administrativo repetitivo nicho a nicho.
- O resultado esperado é:
  - existir uma versão atual global da E20.2 usada como default operacional;
  - uma nova versão publicada passar a ser atual por padrão;
  - a mesma versão alcançar todos os taxons pela herança existente;
  - distinguir taxons realmente afetados de taxons sem mudança material;
  - carregar automaticamente a suficiência E20.6 quando a evolução for comprovadamente compatível;
  - distinguir a última versão humanamente revisada `R` da versão operacional efetivamente autorizada `C`;
  - entregar `C` por uma autoridade canônica única à E19.2 pré-handoff, ao workspace E19.5 e à geração E19.5;
  - exigir nova avaliação somente quando a mudança puder alterar materialmente a suficiência factual.

### 1.4. Versão atual global

- A E20.2 deve possuir uma autoridade explícita de `versão atual` global.
- Uma nova versão somente pode tornar-se atual depois de existir como versão executável, passar pelas validações aplicáveis e ser publicada/ativada pelo fluxo humano aprovado.
- A publicação normal de uma nova versão executável deve torná-la a versão atual por padrão. Exemplo: se v7 é atual e v8 é publicada com sucesso, v8 passa a ser a versão atual sem atualização manual de cada taxon.
- `Versão atual` não significa `Math.max(registry)`, maior chave encontrada, `latest` inferido ou fallback silencioso.
- O resolver puro continua recebendo um número concreto e explícito; a responsabilidade de fornecer esse número pertence à autoridade canônica de versão efetiva ou a um consumidor histórico explicitamente pinado.
- Versões anteriores permanecem imutáveis e resolvíveis para reprodução histórica; esta primeira entrega não autoriza torná-las novamente a versão operacional atual.
- Snapshots e revisões históricas continuam registrando a versão efetivamente usada e nunca são reinterpretados como se tivessem usado a versão atual posterior.
- Consumidor operacional que deva acompanhar a evolução normal da E20.2 não deve manter pin hardcoded indefinidamente; consumidor que precise de pin por motivo funcional real deve declará-lo explicitamente em seu próprio contrato.

### 1.5. Alcance hierárquico

- A versão atual é única e global; não existe versão corrente diferente por nicho.
- A personalização continua ocorrendo exclusivamente pelas camadas da mesma versão.
- O alcance potencial de uma alteração é determinado pela camada em que ela nasce:
  - `universal`: todos os taxons ativos;
  - `segment`: o segmento e todos os nichos/ultranichos descendentes que o herdam;
  - `niche`: o nicho e seus ultranichos descendentes;
  - `ultra_niche`: somente o ultranicho autorizado correspondente.
- Alcance potencial não equivale a impacto material. O impacto real deve ser obtido comparando o catálogo resolvido do mesmo taxon entre a versão anterior e a nova versão.
- Taxons fora do alcance hierárquico da alteração devem acompanhar a nova versão atual sem ação humana quando o catálogo resolvido permanecer semanticamente equivalente.
- Não criar fork de versão por taxon para contornar propagação.

### 1.6. Compatibilidade de revisão

- Para a finalidade da E20.6, a transição entre a última versão humanamente revisada e a versão atual deve ser classificada deterministicamente por taxon em três situações:
  - `sem mudança material`;
  - `evolução compatível`;
  - `revisão necessária`.
- `sem mudança material` significa que, desconsiderando o número da versão e metadados editoriais sem efeito funcional, o contrato factual resolvido continua equivalente.
- `evolução compatível` significa que o contrato mudou, mas a nova versão apenas amplia cobertura factual e não remove, restringe ou reinterpreta cobertura anteriormente aprovada.
- São candidatos naturais a evolução compatível, quando isolados e deterministicamente comprovados:
  - adição de novo field sem alteração destrutiva dos fields existentes;
  - ampliação de conjunto permitido que aumente a capacidade representacional de um field;
  - alteração apenas de evidência ou texto editorial sem mudança do contrato factual efetivo.
- A adição de field `required` pode continuar compatível para a pergunta de suficiência taxonômica porque aumenta cobertura disponível; eventual incompletude dos valores concretos passa a ser tratada pelos recortes de configuração da conta/LP, e não pela E20.6.
- Uma suficiência anteriormente reaberta ou invalidada não pode ser carregada automaticamente, mesmo que a nova versão seja aditiva.
- Deve ser `revisão necessária` quando houver remoção de field, estreitamento de valores/validação, mudança material de finalidade, tipo, scope, origem esperada, condição, obrigação, aplicabilidade por plano ou qualquer transformação cuja compatibilidade não possa ser demonstrada com segurança.
- Diante de ambiguidade, falhar para `revisão necessária`.
- A IA não decide a compatibilidade estrutural entre versões; essa classificação pertence ao processamento determinístico.
- Este plano não autoriza uma engine genérica de diff. A implementação deve usar a menor comparação determinística capaz de provar as categorias acima sobre os contratos resolvidos reais.

### 1.7. Autoridade `R → C` e ciclo de vida mínimo

- `R` representa a última versão E20.2 que recebeu decisão humana explícita de suficiência para o taxon e continua registrada em `reviewed_input_catalog_version`.
- `C` representa a versão operacional efetivamente autorizada para consumo corrente daquele taxon.
- No fluxo normal, `C` é a versão atual global quando `R = C` ou quando a transição resolvida `R → C` for deterministicamente `sem mudança material` ou `evolução compatível`.
- `C` não é persistida artificialmente em `reviewed_input_catalog_version`; ela é resultado do boundary canônico de preparação e deve ser entregue como número concreto aos consumidores operacionais.
- Se `R → versão atual` exigir revisão, não existe carry-forward: o taxon permanece não preparado para a versão atual até nova decisão humana, quando o marcador passa a registrar essa versão.
- E19.2, E19.5 ou qualquer consumidor não pode derivar `C` por conta própria, consultar `Math.max`, ler `latest` ou reinterpretar `R` como se fosse necessariamente a versão operacional corrente.
- Se uma versão publicada apresentar defeito nesta primeira entrega, a correção operacional prevista é publicar uma nova versão forward-only. Rollback para versão anterior fica fora do recorte até existir contrato específico para configurações persistidas.
- Status adicional de versão como `desativada`, `deprecated` ou equivalente também fica fora desta primeira entrega e depende de benefício operacional demonstrado.

## 2. Contrato do caso

### 2.1. Fluxo da versão atual

- Gatilho:
  - uma nova versão executável E20.2 conclui o fluxo aprovado de validação/publicação.
- Entrada:
  - nova versão alvo explícita;
  - registry executável vigente;
  - validações aplicáveis da E20.2;
  - decisão humana de publicação quando aplicável.
- Processamento:
  - provar que a nova versão alvo existe e é executável;
  - tornar a versão publicada a autoridade global atual por default;
  - para cada taxon/consumidor corrente, derivar `C` somente pelo boundary canônico de preparação, considerando `R`, versão atual e compatibilidade;
  - entregar o número concreto `C` aos consumidores que seguem a versão operacional efetiva;
  - preservar resolução pura, histórico e snapshots.
- Validação:
  - nunca derivar a autoridade por maior número;
  - nunca ativar versão ainda não validada/publicada;
  - nunca transformar carry-forward compatível em write fictício de revisão humana.
- Persistência:
  - a residência física da autoridade de versão atual não é definida por este plano; deve ser escolhida em implementação própria após análise de `docs/schema.md`, `docs/base-tecnica.md` e boundaries existentes.
- Consumo:
  - consumidores correntes recebem `C` como número explícito da autoridade canônica;
  - consumidores históricos usam o número explicitamente registrado em seus snapshots/revisões.
- Fallback:
  - ausência, inconsistência ou versão atual não executável falha fechado; não usar maior versão como substituto.

### 2.2. Fluxo de impacto por taxon

- Para cada taxon relevante, comparar `R` com a nova versão atual usando a mesma cadeia taxonômica autoritativa e as projeções factuais aplicáveis.
- A camada alterada define primeiro o conjunto potencialmente afetado; taxons fora desse alcance não precisam de análise semântica individual.
- O resultado de impacto deve distinguir:
  - sem mudança material;
  - evolução compatível;
  - revisão necessária.
- `Sem mudança material` e `evolução compatível` autorizam `C = versão atual` sem mutação repetitiva de `R` apenas para atualizar o número do taxon.
- `Revisão necessária` encaminha o taxon à E20.6.5 para nova avaliação semântica contra a versão atual; até a decisão humana, `C` não pode ser promovida para essa versão.
- Falha de resolução, cadeia, plano ou comparação resulta em revisão necessária/fail-closed, nunca em aprovação automática.

### 2.3. Consequência vinculante para a E20.6

- O modelo operacional futuro supera a regra histórica de que todo avanço numérico de `N` para `M` exige necessariamente uma nova avaliação individual.
- `reviewed_input_catalog_version = R` deve representar a última versão que recebeu decisão humana explícita de suficiência para aquele taxon.
- A preparação canônica passa a distinguir `R` da versão operacional efetivamente autorizada `C`.
- Quando a versão atual global for `V`, a preparação poderá produzir `C = V` se:
  - `R = V`; ou
  - a transição resolvida `R → V` for deterministicamente `sem mudança material` ou `evolução compatível` para aquele taxon.
- Nesses casos não se deve gravar `reviewed_input_catalog_version = V` apenas para sincronizar o número; a ausência de mutação em massa preserva a informação sobre a última revisão humana real.
- Quando a transição exigir revisão, a E20.6.5 avalia o taxon contra `V`; somente a decisão humana final de suficiência grava `reviewed_input_catalog_version = V`, após o que `R = C = V`.
- Pesquisa E20.5 alterada, avaliação reaberta, marcador `NULL`, cadeia taxonômica incompatível ou falha de resolução continuam bloqueando o carry-forward.
- A igualdade exata da E20.6.4 permanece o runtime vigente até implementação completa e validada desta evolução. Não aplicar parcialmente o novo predicado em ambiente hospedado.
- O refinamento de UX da E20.6.5 passa a usar a versão atual como escolha normal/default quando esta autoridade existir, sem exigir que o humano memorize a versão mais recente. A avaliação de versão histórica continua possível somente quando houver finalidade explícita.

### 2.4. Contrato de consumo da versão efetiva

- O boundary canônico de preparação é a única autoridade que transforma `R + versão atual + compatibilidade` em uma versão operacional efetivamente autorizada `C`.
- O resultado conceitual desse boundary deve preservar separadamente:
  - `reviewedInputCatalogVersion = R`, para auditoria da última decisão humana;
  - `effectiveInputCatalogVersion = C`, para consumo operacional corrente.
- A nomenclatura física final da API pode ser reconciliada na implementação, mas a separação semântica `R`/`C` é vinculante.
- Consumidores materiais já conhecidos devem seguir o contrato abaixo quando a E20.2.8 for implementada:
  - E19.2 pré-handoff usa `C` como `operationalCatalogVersion` para resolver, validar e persistir configuração nova ou ainda não vinculada;
  - E19.5 workspace usa `C` para resolver e salvar a configuração operacional corrente;
  - geração via E19.5 usa exatamente o mesmo `C` usado pelo workspace e pela revalidação operacional;
  - nenhum desses consumidores resolve versão atual localmente, lê maior versão, consulta registry para inferir default ou substitui `C` por `R` apenas porque `R` é persistido.
- Configurações E19.2/E19.5 já persistidas continuam registrando o `catalog_version` realmente usado em sua escrita; materializações e snapshots continuam preservando a versão efetivamente usada naquela geração.
- Revalidação histórica pode resolver o `catalog_version` persistido para compreender o estado anterior, mas qualquer nova operação corrente usa a autoridade `C` aplicável e falha fechado diante de incompatibilidade.
- A implementação da E20.2.8 deve remover ou reconciliar os pins operacionais atualmente conhecidos — incluindo `LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION = 5` — somente dentro do recorte completo, sem substituí-los por outro hardcode ou por lookup local de versão atual.

### 2.5. Experiência administrativa futura

- O Admin deve oferecer uma visão central da E20.2 capaz de mostrar, de forma amigável:
  - versão atual;
  - versões executáveis anteriores para inspeção histórica;
  - resumo da mudança entre versões;
  - camada em que a mudança nasceu;
  - alcance potencial da mudança;
  - quantidade de taxons sem mudança material;
  - quantidade de taxons que acompanham automaticamente por compatibilidade;
  - quantidade de taxons que precisam de revisão E20.6.
- O humano não deve precisar visitar 100 ou 150 páginas de taxon para sincronizar uma nova versão.
- Taxons com revisão necessária devem aparecer em uma visão agregada de pendências, com acesso ao fluxo individual E20.6.5 quando necessário.
- A rota e a composição física dessa superfície não são definidas neste plano. A implementação deve primeiro avaliar as superfícies existentes de Estrutura da LP e Taxonomia e escolher a menor evolução coerente com o Design System.
- Não criar job, fila, agente, automação recorrente ou nova infraestrutura apenas para produzir essa experiência sem fonte técnica posterior.
- Ação administrativa de restaurar versão anterior como atual não integra esta primeira entrega.

### 2.6. Compatibilidade com consumidores e histórico

- A versão atual é default para consumo operacional novo/corrente, não uma reescrita retroativa de contratos históricos.
- `R` preserva a última decisão humana real; `C` preserva a versão operacional autorizada corrente; snapshots, revisões e residências preservam o número que efetivamente usaram.
- E19.2 pré-handoff, E19.5 workspace e geração E19.5 são consumidores explícitos de `C` quando a E20.2.8 entrar em vigor.
- Pins históricos ou residências já gravadas não são reescritos apenas porque a versão atual mudou.
- Outros consumidores atualmente hardcoded devem ser classificados na implementação futura:
  - acompanham `C` por natureza; ou
  - permanecem pinados por contrato funcional explícito.
- Não remover pins apenas por conveniência sem verificar a responsabilidade do consumidor.
- A E20.6 não deve voltar a ser usada como mecanismo de sincronização de número quando a compatibilidade puder ser derivada deterministicamente.

### 2.7. Rollback operacional deferido

- Rollback de `versão atual` para uma versão executável anterior não faz parte da primeira implementação da E20.2.8.
- O motivo é concreto: E19.5 pode persistir valores de fields introduzidos em versões posteriores; resolver essa residência contra catálogo anterior que não contém esses `field_key` produz configuração inválida pelo contrato fail-closed vigente.
- Manter rollback agora exigiria definir projeção/inativação de valores posteriores, preservação e recuperação ao avançar novamente, além da relação com revisões e snapshots. Esse custo não é necessário para resolver o problema principal de escala.
- Se uma versão atual publicada apresentar defeito no MVP, o caminho suportado é corrigir e publicar nova versão forward-only.
- Rollback pode ser reaberto em evolução própria somente depois de existir contrato que preserve dados e não relaxe validação fail-closed.

## 3. Fases e próxima ação

### 3.1. E20.2.8 — Versão atual e propagação escalável

- Automação: não definida/necessária neste plano; a decisão é de contrato operacional e UX.
- Próxima ação técnica futura:
  - reconciliar o plano com a `main` vigente no início da implementação;
  - identificar a menor autoridade real para `versão atual` sem criar segunda residência;
  - definir a API pública que entrega `R` e `C` separadamente e fornece o número concreto `C` aos consumidores;
  - definir o comparador mínimo de compatibilidade sobre catálogos resolvidos;
  - adaptar o predicado E20.6.4 somente como unidade completa, preservando fail-closed;
  - reconciliar E19.2 pré-handoff, E19.5 workspace e geração E19.5 para consumir a mesma `C`, removendo os pins operacionais somente dentro desse recorte completo;
  - projetar a experiência administrativa agregada sobre superfícies existentes antes de propor nova rota;
  - validar propagação universal, por segmento, nicho e ultranicho, carry-forward sem writes artificiais e snapshots/configurações históricas preservados.
- Este PR documental não autoriza implementação, migration, schema, rota, job, agente, automação, engine ou nova infraestrutura.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo

- Não implementar `Math.max`, `latest` implícito ou descoberta automática da maior chave como autoridade operacional.
- Não criar versão corrente persistida por taxon.
- Não duplicar o registry em banco apenas para resolver a versão atual.
- Não reescrever versões, residências ou snapshots históricos.
- Não implementar rollback operacional para versão anterior nesta primeira entrega.
- Não criar status `desativada/deprecated` sem benefício demonstrado.
- Não criar job, fila, agente ou automação recorrente para reavaliar taxons.
- Não aprovar semanticamente taxon por heurística determinística quando a transição for materialmente incompatível.
- Não usar IA para classificar a compatibilidade estrutural das versões.
- Não permitir que E19.2, E19.5 ou geração resolvam `versão atual` localmente ou usem `R` como substituto implícito de `C`.
- Não alterar consumidores além do necessário no futuro recorte técnico sem confirmar seu contrato real na `main` vigente.

### 4.2. Critérios de parada

- Parar se a autoridade de versão atual exigir nova residência sem justificativa e sem reconciliação com a arquitetura existente.
- Parar se não for possível distinguir de forma determinística e conservadora `sem mudança material`, `evolução compatível` e `revisão necessária`.
- Parar se não for possível fornecer uma única `C` coerente à E19.2 pré-handoff, ao workspace E19.5 e à geração E19.5.
- Parar se a propagação puder reinterpretar snapshots históricos, invalidar silenciosamente residência persistida ou alterar uma geração anterior.
- Parar se surgir necessidade de rollback antes de existir contrato específico para fields/valores posteriores; não ampliar silenciosamente este recorte.
- Parar se uma mudança por plano tornar o marcador taxonômico E20.6 insuficiente ou ambíguo.
- Parar se a experiência agregada exigir nova rota, persistência ou infraestrutura antes de analisar as superfícies administrativas já existentes.
- Parar diante de conflito material com a E20.6 vigente; a transição do predicado de igualdade exata deve ocorrer somente por implementação completa e validada, nunca por ajuste parcial.

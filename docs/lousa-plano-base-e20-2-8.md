24/08/2026 — Plano-base v2 — E20.2.8 — Versão atual e propagação escalável do catálogo E20.2

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v2 consolidado sobre o blob imutável `14718243ce834b5e37406e9d560d1db2d1f3db9e` da v1 incorporada à `main` pelo PR #809; implementação condicionada ao gate do Analista deste workflow.
- Caso macro: `E20 — preparação e liberação de taxons`.
- Recorte: `E20.2.8 — Versão atual e propagação escalável do catálogo E20.2`.
- Este recorte é uma evolução operacional da E20.2 já versionada; não reescreve nem invalida o histórico de `docs/lousa-plano-base-e20-2.md`.
- A E20.6 permanece responsável pela suficiência factual por taxon; este recorte altera a relação entre versão global do catálogo e necessidade de reavaliação, conforme a seção 2.3.
- A forma física do draft administrativo e a composição da superfície permanecem condicionadas à análise técnica sobre o repositório real; a autoridade das versões publicadas e da versão atual é repo-only conforme a decisão humana registrada abaixo.
- Rollback operacional para versão anterior não integra a primeira entrega da E20.2.8; eventual suporte futuro depende de contrato específico para compatibilidade com configurações persistidas em versões posteriores.
- Decisão humana de 24/08/2026: o registry repo-only permanece autoridade das versões publicadas. Eventual persistência em banco pode servir somente como residência do draft administrativo não operacional, se continuar sendo a menor solução após análise técnica; v1–v5 não serão migradas para tornar o banco autoridade do catálogo publicado.

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
- Plano conceitual: `N/A`; não existe referência competente nem vínculo inequívoco adicional para este recorte além das fontes canônicas e decisões já registradas.

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
- A versão atual publicada deve ser uma declaração explícita, versionada e revisável no mesmo boundary repo-only do catálogo; sua alteração integra a materialização da nova versão no repositório e somente produz efeito operacional depois de validação e deploy bem-sucedidos.
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
- No MVP, `sem mudança material` exige igualdade da sequência ordenada de fields e de todas as propriedades funcionais resolvidas, desconsiderando somente número da versão e metadata de evidência sem efeito runtime. `Evolução compatível` admite exclusivamente: adição de field válido; ampliação estrita de `allowedValues` preservando todas as demais propriedades; e mudança apenas de evidência editorial. Múltiplas diferenças são compatíveis somente quando todas pertencem a essa allowlist. Reordenação, retirada, mudança de `purpose`, origem, camada, scope, tipo, obligation, plans, conditions, substitution policy, capability binding ou qualquer validação fora da ampliação permitida resulta em `revisão necessária`.

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
- O cutover da E20.2.8 deve substituir, na mesma unidade ativável, todos os caminhos operacionais que derivam versão de `R`, de maior versão ou do pin v5. O inventário mínimo inclui `LANDING_PAGE_WORKSPACE_REQUIRED_INPUT_CATALOG_VERSION`, `save_account_landing_page_configuration_v1`, `loadTaxonPreparationForReviewedVersion`, workspace, geração, contexto de geração e o default `versions.at(-1)` da Estrutura da LP. Símbolo, export, branch legado ou validação que perder consumidor funcional deve ser removido no mesmo recorte; permanência exige consumidor histórico real e contrato de pin explícito.

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
- A visão central da E20.2 deve evoluir `/admin/estrutura-lp?view=entradas`; a página `/admin/taxonomia/[taxonId]` permanece responsável pela execução individual E20.6.5. Não criar nova rota de primeiro nível. Componentes com estado ou actions próprias permanecem route-local; cada mutação reexecuta `requirePlatformAdmin()`, deriva o ator no servidor e acessa o banco somente por adapter server-only do boundary Admin.
- Não criar job, fila, agente, automação recorrente ou nova infraestrutura apenas para produzir essa experiência sem fonte técnica posterior.
- Ação administrativa de restaurar versão anterior como atual não integra esta primeira entrega.
- A superfície administrativa deve ser validada proporcionalmente em Preview, em desktop e mobile, cobrindo o papel administrativo autorizado, os controles negativos de acesso aplicáveis, a navegação entre a visão agregada e a E20.6.5, os estados de carregamento, vazio, pendência, sucesso e erro e a integridade da coleção paginada; resposta parcial não pode ser apresentada como lista completa (`prod#16`).
- A superfície administrativa deve aplicar o baseline WCAG 2.2 pertinente ao fluxo, incluindo operação por teclado, foco visível e reposicionado após transições ou falhas, nomes e labels acessíveis, anúncio de mensagens dinâmicas, contraste, alvos de toque e ausência de interação exclusivamente por hover; a validação deve combinar inspeção automática e manual, sem declarar conformidade integral sem auditoria própria (`prod#17`).

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

- Automação: não; a implementação é um lifecycle administrativo determinístico, sem agente, IA decisória, job, fila ou rotina recorrente.
- Próxima ação técnica futura:
  - reconciliar o plano com a `main` vigente no início da implementação;
  - preservar o registry repo-only como autoridade das versões publicadas e da versão atual implantada;
  - avaliar se o draft administrativo exige persistência em banco; se exigir, limitar essa residência ao conteúdo não operacional e não duplicar nela a autoridade das versões publicadas;
  - implementar a publicação como materialização/versionamento no repositório, validação e deploy; somente depois de o artefato executável estar implantado a nova versão pode tornar-se atual e observável como `C`;
  - definir a API pública que entrega `R` e `C` separadamente e fornece o número concreto `C` aos consumidores;
  - definir o comparador mínimo de compatibilidade sobre catálogos resolvidos;
  - adaptar o predicado E20.6.4 somente como unidade completa, preservando fail-closed;
  - reconciliar E19.2 pré-handoff, E19.5 workspace e geração E19.5 para consumir a mesma `C`, removendo os pins operacionais somente dentro desse recorte completo;
  - projetar a experiência administrativa agregada sobre superfícies existentes antes de propor nova rota;
  - validar propagação universal, por segmento, nicho e ultranicho, carry-forward sem writes artificiais e snapshots/configurações históricas preservados.
- Qualquer objeto de banco novo ou alterado exige migration forward-only versionada e atualização simultânea de `docs/schema.md`. O runtime não pode depender do objeto antes do apply validado. Tabela em schema exposto nasce com RLS e decisão explícita de policies, GRANTs e Data API: acesso direto por `anon` ou `authenticated` exige policies autorizativas e grants correspondentes; acesso exclusivamente server-side exige revogação de `PUBLIC`, `anon`, `authenticated` e `ai_readonly`, grants mínimos ao papel operacional e registro explícito de que não há policy consumidora. Views expostas usam `security_invoker = true`; função privilegiada exige justificativa, `search_path` fixado e EXECUTE revogado de `PUBLIC`.
- A prova de publicação e a visão agregada devem demonstrar completude sobre todos os taxons e configurações operacionais relevantes. Paginação, chunking ou agregação não pode tratar primeira página como conjunto integral. Falha, truncamento, timeout ou cardinalidade divergente bloqueia publicação; não autoriza carry-forward parcial.
- A leitura SQL hospedada read-only de 24/08/2026 confirmou 11 taxons ativos, 1 LP operacional, 1 configuração operacional específica, 1 configuração compartilhada para conta operacional e 1 conta com LP operacional; um taxon possui `R = 5`, dez possuem `R = NULL` e as duas residências operacionais estão na v5. Esses números são evidência do estado atual, não limites de implementação; os testes devem incluir cardinalidade superior a uma página.
- Antes do gate da implementação que alterar o banco, reconciliar por ABC o drift factual de `docs/schema.md` sobre o apply já concluído da migration E19.5 `20260822170000_e19_5_3_landing_page_workspace.sql`.
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

### 4.2. Oportunidades estratégicas condicionais sem implementação

- `supa#29`: preservar apenas como hipótese de auditoria futura se, após definição do lifecycle físico, Git, migrations e registros publicados imutáveis não responderem ator, conteúdo, momento ou transição de publicação. Não criar função, trigger, tabela, cabeçalho YAML ou changelog automatizado neste recorte.
- `supa#53`: preservar apenas como alternativa de transporte durável se medição em volume real demonstrar que o processamento determinístico excede o orçamento interativo ou exige retry. Não instalar `pgmq`, criar fila, worker, job ou estado paralelo neste recorte.
- `supa#63`: preservar apenas como possibilidade de ampliar testes de RLS se a implementação futura criar múltiplas tabelas/policies e uma prova isolada demonstrar benefício líquido. Não instalar Python, `pgtap`, ferramenta, extensão ou workflow e nunca executar isso em Production neste recorte.
- `supa#68`: preservar apenas se surgir requisito aprovado de atualização em tempo real e medição demonstrar insuficiência de consulta sob demanda ou polling. Não atualizar dependência nem criar publicação, channel, subscription, migration ou rota Realtime neste recorte.
- `supa#54` é não aplicável à classificação estrutural `R → C`; similaridade vetorial não substitui a comparação determinística, conservadora e fail-closed.
- `vercel#20` é não aplicável como autoridade ou rollout segmentado da versão global; targeting não pode selecionar `C` por usuário ou taxon.

### 4.3. Critérios de parada

- Parar se a autoridade de versão atual exigir nova residência sem justificativa e sem reconciliação com a arquitetura existente.
- Parar se não for possível distinguir de forma determinística e conservadora `sem mudança material`, `evolução compatível` e `revisão necessária`.
- Parar se não for possível fornecer uma única `C` coerente à E19.2 pré-handoff, ao workspace E19.5 e à geração E19.5.
- Parar se a propagação puder reinterpretar snapshots históricos, invalidar silenciosamente residência persistida ou alterar uma geração anterior.
- Parar se surgir necessidade de rollback antes de existir contrato específico para fields/valores posteriores; não ampliar silenciosamente este recorte.
- Parar se uma mudança por plano tornar o marcador taxonômico E20.6 insuficiente ou ambíguo.
- Parar se a experiência agregada exigir nova rota, persistência ou infraestrutura antes de analisar as superfícies administrativas já existentes.
- Parar diante de conflito material com a E20.6 vigente; a transição do predicado de igualdade exata deve ocorrer somente por implementação completa e validada, nunca por ajuste parcial.

## 5. Consolidação do lifecycle do catálogo — 24/08/2026

### 5.1. Autoridade desta consolidação

- Esta seção consolida as decisões humanas e revisões do Analista posteriores à redação inicial deste plano e supera somente formulações anteriores incompatíveis sobre draft, momento da análise de impacto, publicação e retirada de fields.
- Permanecem integralmente preservados: versão global atual explícita, autoridade `R → C`, carry-forward determinístico, fail-closed, herança taxonômica, histórico imutável de versões publicadas, rollback fora do MVP e ausência de implementação física neste PR.
- O lifecycle do MVP é deliberadamente mínimo: `versão publicada atual → único próximo draft mutável → publicar → nova versão publicada atual`.

### 5.2. Próxima versão única em draft

- Enquanto existir uma versão publicada atual `V`, pode existir no máximo uma próxima versão em draft, correspondente à evolução sequencial imediatamente posterior de `V`.
- O draft é mutável e não operacional. E19.2, E19.5 workspace, geração E19.5 e demais consumidores correntes nunca usam o draft como `C`.
- Alterações aprovadas provenientes de diferentes avaliações ou taxons acumulam-se no mesmo draft enquanto ele não tiver sido publicado. Uma segunda alteração antes da publicação não cria outra versão candidata.
- Salvar o draft persiste apenas seu estado corrente; não cria uma nova versão histórica e não exige histórico de cada salvamento no MVP.
- Não permitir múltiplos drafts concorrentes, branches funcionais do catálogo ou seleção entre várias candidatas.
- A forma física de residência, edição e autorização do draft não é definida por este plano e deve ser escolhida somente no recorte técnico sobre as superfícies e boundaries reais.

### 5.3. Lifecycle dos fields

- Field criado exclusivamente no draft ainda não pertence ao contrato publicado e pode ser editado, renomeado, ter metadata, obrigação ou validação corrigidas e ser excluído integralmente antes da publicação.
- Field excluído antes de sua primeira publicação nunca existiu para E19.2/E19.5 e não precisa permanecer no histórico do catálogo.
- Depois de publicado, o contrato histórico do field é imutável nas versões em que existiu. Ele não pode ser apagado retroativamente.
- Quando um field publicado deixar de ser necessário, a evolução é forward-only: a próxima versão pode declará-lo `retirado a partir daquela versão`.
- Usar `retirado` como semântica do MVP; não criar lifecycle `ativo/inativo`, reativação ou alternância de status.
- `optional` e `required` usam o mesmo mecanismo de retirada. Na versão corrente em que foi retirado, o field deixa de ser exibido/coletado, deixa de participar de novas gerações e seu valor anterior deixa de participar do contrato operacional ativo.
- Quando o field retirado era `required`, ele também deixa de participar da completude a partir da versão que efetivou a retirada.
- Valores anteriormente persistidos não precisam ser apagados por migration ou backfill. O runtime futuro deve conseguir distinguir `field_key` historicamente publicado e depois retirado, que permanece reconhecível porém inerte, de key que nunca pertenceu a qualquer contrato publicado, que continua inválida/fail-closed.
- A representação física dessa distinção — nome de propriedade, shape, projeção ou mecanismo equivalente — não é definida neste plano e deve ser escolhida após análise dos contratos reais.
- Retirada não cria nova capacidade de override hierárquico: nicho ou ultranicho não pode simplesmente retirar/desligar um field herdado que permaneça ativo em camada superior. A retirada ocorre na evolução versionada do contrato ao qual o field pertence.
- Para a primeira E20.2.8, toda retirada de field publicado é classificada como `revisão necessária` para os taxons aos quais ele se aplica. Não implementar otimização por alegada cobertura semântica equivalente de outro field neste MVP.

### 5.4. Draft validável e evidência stale

- `Não operacional` não significa `não resolvível`: o draft final deve poder ser resolvido e validado administrativamente antes da publicação, usando as mesmas regras funcionais do catálogo que ele teria se publicado.
- A validação pré-publicação deve conseguir resolver o draft nas cadeias taxonômicas e planos aplicáveis, validar fields, condições e contratos e calcular o impacto da mudança.
- A análise de impacto de publicação considera o conteúdo integral corrente do draft, nunca um estado intermediário anterior.
- Qualquer edição material posterior do draft torna stale toda evidência que dependia daquele conteúdo, incluindo classificação estrutural de impacto, compatibilidade por taxon, avaliação E20.6.5 pré-publicação e prova de validade estrutural das configurações operacionais correntes.
- Antes de publicar, toda evidência material stale deve ser recalculada sobre o conteúdo exato que será publicado.
- Snapshots, materializações e revisões históricas não são reinterpretados contra o draft; permanecem ligados ao contrato/versionamento com que foram produzidos.

### 5.5. Duas dimensões do gate pré-publicação

- A publicação do draft final deve avaliar separadamente `suficiência taxonômica E20.6` e `validade estrutural das configurações operacionais E19`.
- Na dimensão E20.6:
  - `sem mudança material` e `evolução compatível` seguem o carry-forward já definido;
  - `revisão necessária` encaminha somente os taxons afetados à E20.6.5;
  - quando a pendência de `revisão necessária` afetar taxon/consumo já operacional segundo os contratos vigentes do produto, ela deve ser resolvida no pré-publicação antes de o draft tornar-se a nova versão atual;
  - taxon ainda não operacional não precisa bloquear a publicação e pode permanecer pendente até que sua preparação seja necessária.
- Na dimensão E19:
  - o gate pré-publicação protege validade e legibilidade estrutural das configurações operacionais correntes que passarão a consumir `C`, não a completude de toda a base;
  - uma nova versão pode tornar uma configuração antiga `válida, porém incompleta` exclusivamente pela introdução de novos dados obrigatórios ainda sem valor; isso não bloqueia publicação e preserva o lifecycle já previsto pela E19.5;
  - nesse caso, somente ações que dependem de completude permanecem bloqueadas até o preenchimento dos novos dados;
  - deve bloquear publicação uma mudança que torne configuração corrente inválida ou ilegível, por exemplo estreitamento de enum incompatível com valor existente, mudança incompatível de tipo/scope/validação ou retirada que ainda não reconheça corretamente o valor histórico como legítimo e inerte.
- O gate de continuidade não exige migração humana prévia de todas as contas nem backfill para preencher novo `required`.
- A identificação física de quais taxons/configurações são operacionais e a forma de executar essa prova pertencem ao recorte técnico futuro; este plano fixa apenas o contrato de produto.

### 5.6. E20.6.5 sobre o draft

- A E20.6.5 pode analisar administrativamente o draft final antes da publicação quando a classificação determinística indicar `revisão necessária`.
- Essa avaliação pré-publicação não torna o draft operacional e não autoriza E19.2/E19.5 a consumi-lo.
- A decisão humana pré-publicação fica vinculada ao conteúdo exato do draft avaliado; qualquer edição material posterior a torna stale e exige nova avaliação quando ainda necessária.
- A avaliação pré-publicação não deve gravar prematuramente `reviewed_input_catalog_version` como se o draft já fosse uma versão operacional publicada.
- A decisão pré-publicação é uma autorização condicionada: somente a publicação daquele mesmo conteúdo pode produzir seu efeito administrativo sobre a nova versão. O mecanismo físico para materializar esse efeito de forma segura no evento de publicação não é definido neste PR documental.
- Taxons não operacionais podem permanecer sem essa decisão e continuarão fail-closed quando sua preparação for requerida posteriormente.

### 5.7. Publicação

- `Publicar` é o único evento que encerra a mutabilidade do draft, transforma aquele conteúdo em versão publicada e imutável, torna essa versão a atual global e a disponibiliza ao consumo operacional conforme `R → C` e os gates aplicáveis.
- Não existe segundo passo humano de `tornar atual`, seletor de versão titular nem escolha manual da versão operacional pelos consumidores E19.2/E19.5.
- A publicação é uma decisão global do catálogo, não uma decisão pertencente ao taxon que originou um field ou uma alteração.
- A publicação deve falhar fechado quando o draft final estiver inválido, quando evidência material necessária estiver stale, quando houver pendência E20.6 obrigatória para consumo operacional vigente ou quando a mudança puder tornar configuração operacional corrente inválida/ilegível.
- A publicação deve constituir um único boundary indivisível de cutover, vinculando o conteúdo exato do draft, sua revisão ou identidade imutável, as validações, a análise de impacto e as autorizações pré-publicação aplicáveis. Edição concorrente, evidência stale, decisão vinculada a conteúdo diferente, publicação duplicada ou falha parcial impedem que a nova versão se torne atual. Nenhum consumidor pode observar a nova `C` antes da conclusão integral desse boundary.
- Como o registry repo-only é a autoridade publicada, o boundary administrativo não promove diretamente o conteúdo do draft: ele produz o handoff/materialização versionável no repositório e aguarda validação e deploy do artefato executável correspondente. Somente a confirmação de que exatamente esse conteúdo está implantado pode concluir o cutover da versão atual.
- A publicação não é bloqueada apenas porque um novo `required` torna configuração anterior incompleta, nem por pendência E20.6 de taxon ainda não operacional.
- Depois da publicação, a primeira alteração posterior inicia o próximo draft sequencial; a versão publicada permanece imutável.
- A superfície física da ação `Publicar` não é definida neste PR. A implementação deve primeiro avaliar as superfícies administrativas existentes e escolher a menor evolução coerente com o Design System e boundaries atuais.

### 5.8. Simplificações vinculantes do MVP

- A primeira E20.2.8 não necessita de:
  - rollback para versão anterior;
  - seletor de versão titular;
  - versão publicada ativa/inativa ou `deprecated`;
  - múltiplos drafts;
  - branches de catálogo;
  - histórico de salvamentos do draft;
  - reativação de field retirado;
  - deleção física de fields históricos;
  - backfill para apagar valores antigos;
  - escolha manual da versão operacional por E19.2/E19.5;
  - engine de equivalência semântica para evitar revisão após retirada de field.
- O lifecycle desejado fica: `versão publicada atual → único draft mutável → validação pré-publicação → publicar → nova versão publicada atual`.
- O lifecycle do field fica: `criado no draft → livremente mutável/excluível → publicado → histórico imutável → eventualmente retirado forward-only`.

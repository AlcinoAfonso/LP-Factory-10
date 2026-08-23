23/08/2026 — Plano-base v1 — E20.2.8 — Versão atual e propagação escalável do catálogo E20.2

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado a partir da decisão humana de 23/08/2026; implementação não autorizada por este documento.
- Caso macro: `E20 — preparação e liberação de taxons`.
- Recorte: `E20.2.8 — Versão atual e propagação escalável do catálogo E20.2`.
- Este recorte é uma evolução operacional da E20.2 já versionada; não reescreve nem invalida o histórico de `docs/lousa-plano-base-e20-2.md`.
- A E20.6 permanece responsável pela suficiência factual por taxon; este recorte altera a relação entre versão global do catálogo e necessidade de reavaliação, conforme a seção 2.3.
- A implementação física da autoridade de versão atual, de sua persistência e da superfície administrativa permanece pendente de recorte técnico sobre o repositório real.

### 1.2. Fontes usadas

- `README.md`.
- `AGENTS.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e20-6.md`, incluindo o refinamento funcional/UX da E20.6.5 em discussão no PR #809.
- `docs/lousa-plano-base-e21-2-5.md`, como precedente recente de separar contrato funcional de governança operacional.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `lib/conversion-content/landing-page/input-catalog/registry.ts`.
- `lib/conversion-content/landing-page/input-catalog/resolver.ts`.
- Decisões humanas desta conversa em 23/08/2026 sobre escala, versão default, rollback e experiência administrativa.

### 1.3. Problema e resultado esperado

- A E20.2 possui versões executáveis globais e resolução hierárquica `universal → segmento → nicho → ultranicho`, mas o contrato histórico exige versão explícita por consumidor e não define uma autoridade operacional única de versão atual.
- A E20.6 vigente grava `reviewed_input_catalog_version` por taxon e exige igualdade exata com a versão requerida. Essa combinação cria custo linear: uma nova versão pode obrigar o humano a visitar e reavaliar dezenas ou centenas de taxons apenas porque o número global mudou.
- O produto deve escalar para 100, 150 ou mais taxons sem transformar cada evolução do catálogo em trabalho administrativo repetitivo nicho a nicho.
- O resultado esperado é:
  - existir uma versão atual global da E20.2 usada como default operacional;
  - uma nova versão publicada passar a ser atual por padrão;
  - a mesma versão alcançar todos os taxons pela herança existente;
  - distinguir taxons realmente afetados de taxons sem mudança material;
  - carregar automaticamente a suficiência E20.6 quando a evolução for comprovadamente compatível;
  - exigir nova avaliação somente quando a mudança puder alterar materialmente a suficiência factual;
  - permitir rollback explícito para versão executável anterior sem apagar histórico.

### 1.4. Versão atual global

- A E20.2 deve possuir uma autoridade explícita de `versão atual` global.
- Uma nova versão somente pode tornar-se atual depois de existir como versão executável, passar pelas validações aplicáveis e ser publicada/ativada pelo fluxo humano aprovado.
- A publicação normal de uma nova versão executável deve torná-la a versão atual por padrão. Exemplo: se v7 é atual e v8 é publicada com sucesso, v8 passa a ser a versão atual sem atualização manual de cada taxon.
- `Versão atual` não significa `Math.max(registry)`, maior chave encontrada, `latest` inferido ou fallback silencioso.
- O resolver puro continua recebendo um número concreto e explícito; a responsabilidade de fornecer esse número pertence à autoridade comum de versão atual ou a um consumidor histórico explicitamente pinado.
- Versões anteriores permanecem imutáveis, resolvíveis e disponíveis para reprodução histórica e rollback.
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

### 1.7. Rollback e ciclo de vida mínimo

- O `platform_admin` deve poder tornar uma versão executável anterior novamente a versão atual quando houver motivo operacional.
- Exemplo: v7 apresentou problema; o humano pode publicar v8 corrigida, que passa a ser atual, ou restaurar explicitamente v6 como versão atual.
- Rollback altera apenas a autoridade de versão atual; não edita, renumera, apaga ou sobrescreve versões.
- Depois do rollback, consumidores que acompanham a versão atual recebem o número restaurado; snapshots históricos permanecem intactos.
- A compatibilidade E20.6 deve ser recalculada em direção à versão restaurada. Não presumir aprovação histórica que o estado vigente não consiga provar.
- Status adicional de versão como `desativada`, `deprecated` ou equivalente não é necessário neste recorte. Deve ser reavaliado somente se houver benefício operacional demonstrado além de escolher a versão atual e preservar histórico.

## 2. Contrato do caso

### 2.1. Fluxo da versão atual

- Gatilho:
  - uma nova versão executável E20.2 conclui o fluxo aprovado de validação/publicação; ou o humano decide restaurar versão executável anterior.
- Entrada:
  - versão alvo explícita;
  - registry executável vigente;
  - validações aplicáveis da E20.2;
  - decisão humana de publicação/rollback quando aplicável.
- Processamento:
  - provar que a versão alvo existe e é executável;
  - tornar a versão publicada a autoridade operacional atual por default, ou aplicar a versão anterior escolhida no rollback;
  - entregar o número concreto aos consumidores que seguem a versão atual;
  - preservar resolução pura, histórico e snapshots.
- Validação:
  - nunca derivar a autoridade por maior número;
  - nunca ativar versão ainda não validada/publicada;
  - nunca alterar versões históricas para simular rollback.
- Persistência:
  - a residência física da autoridade de versão atual não é definida por este plano; deve ser escolhida em implementação própria após análise de `docs/schema.md`, `docs/base-tecnica.md` e boundaries existentes.
- Consumo:
  - consumidores correntes recebem o número da versão atual;
  - consumidores históricos usam o número explicitamente registrado em seus snapshots/revisões.
- Fallback:
  - ausência, inconsistência ou versão atual não executável falha fechado; não usar maior versão como substituto.

### 2.2. Fluxo de impacto por taxon

- Para cada taxon relevante, comparar a versão de referência com a nova versão atual usando a mesma cadeia taxonômica autoritativa e as projeções factuais aplicáveis.
- A camada alterada define primeiro o conjunto potencialmente afetado; taxons fora desse alcance não precisam de análise semântica individual.
- O resultado de impacto deve distinguir:
  - sem mudança material;
  - evolução compatível;
  - revisão necessária.
- `Sem mudança material` e `evolução compatível` não exigem mutação repetitiva apenas para atualizar o número da versão no taxon.
- `Revisão necessária` encaminha o taxon à E20.6.5 para nova avaliação semântica contra a versão atual.
- Falha de resolução, cadeia, plano ou comparação resulta em revisão necessária/fail-closed, nunca em aprovação automática.

### 2.3. Consequência vinculante para a E20.6

- O modelo operacional futuro supera a regra histórica de que todo avanço numérico de `N` para `M` exige necessariamente uma nova avaliação individual.
- `reviewed_input_catalog_version = R` deve representar a última versão que recebeu decisão humana explícita de suficiência para aquele taxon.
- Quando a versão atual for `C`, a preparação poderá ser derivada se:
  - `R = C`; ou
  - a transição resolvida `R → C` for deterministicamente `sem mudança material` ou `evolução compatível` para aquele taxon.
- Nesses casos não se deve gravar `reviewed_input_catalog_version = C` apenas para sincronizar o número; a ausência de mutação em massa preserva a informação sobre a última revisão humana real.
- Quando a transição exigir revisão, a E20.6.5 avalia o taxon contra `C`; somente a decisão humana final de suficiência grava `reviewed_input_catalog_version = C`.
- Pesquisa E20.5 alterada, avaliação reaberta, marcador `NULL`, cadeia taxonômica incompatível ou falha de resolução continuam bloqueando o carry-forward.
- A igualdade exata da E20.6.4 permanece o runtime vigente até implementação completa e validada desta evolução. Não aplicar parcialmente o novo predicado em ambiente hospedado.
- O refinamento de UX da E20.6.5 passa a usar a versão atual como escolha normal/default quando esta autoridade existir, sem exigir que o humano memorize a versão mais recente. A avaliação de versão histórica continua possível somente quando houver finalidade explícita.

### 2.4. Experiência administrativa futura

- O Admin deve oferecer uma visão central da E20.2 capaz de mostrar, de forma amigável:
  - versão atual;
  - versões executáveis anteriores;
  - resumo da mudança entre versões;
  - camada em que a mudança nasceu;
  - alcance potencial da mudança;
  - quantidade de taxons sem mudança material;
  - quantidade de taxons que acompanham automaticamente por compatibilidade;
  - quantidade de taxons que precisam de revisão E20.6.
- A interface deve permitir ver diferenças e, quando autorizado, tornar versão anterior a versão atual sem editar o histórico.
- O humano não deve precisar visitar 100 ou 150 páginas de taxon para sincronizar uma nova versão.
- Taxons com revisão necessária devem aparecer em uma visão agregada de pendências, com acesso ao fluxo individual E20.6.5 quando necessário.
- A rota e a composição física dessa superfície não são definidas neste plano. A implementação deve primeiro avaliar as superfícies existentes de Estrutura da LP e Taxonomia e escolher a menor evolução coerente com o Design System.
- Não criar job, fila, agente, automação recorrente ou nova infraestrutura apenas para produzir essa experiência sem fonte técnica posterior.

### 2.5. Compatibilidade com consumidores e histórico

- A versão atual é default para consumo operacional, não uma reescrita retroativa de contratos históricos.
- Snapshots de geração, revisões de LP e qualquer artefato que registre versão usada preservam seu número original.
- Consumidores atualmente hardcoded devem ser classificados na implementação futura:
  - acompanham versão atual por natureza; ou
  - permanecem pinados por contrato funcional explícito.
- Não remover pins apenas por conveniência sem verificar a responsabilidade do consumidor.
- A E20.6 não deve voltar a ser usada como mecanismo de sincronização de número quando a compatibilidade puder ser derivada deterministicamente.

## 3. Fases e próxima ação

### 3.1. E20.2.8 — Versão atual e propagação escalável

- Automação: não definida/necessária neste plano; a decisão é de contrato operacional e UX.
- Próxima ação técnica futura:
  - reconciliar o plano com a `main` vigente no início da implementação;
  - identificar a menor autoridade real para `versão atual` sem criar segunda residência;
  - definir a API pública que entrega o número concreto aos consumidores;
  - definir o comparador mínimo de compatibilidade sobre catálogos resolvidos;
  - adaptar o predicado E20.6.4 somente como unidade completa, preservando fail-closed;
  - projetar a experiência administrativa agregada sobre superfícies existentes antes de propor nova rota;
  - validar propagação universal, por segmento, nicho e ultranicho, além de rollback e snapshots históricos.
- Este PR documental não autoriza implementação, migration, schema, rota, job, agente, automação, engine ou nova infraestrutura.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo

- Não implementar `Math.max`, `latest` implícito ou descoberta automática da maior chave como autoridade operacional.
- Não criar versão corrente por taxon.
- Não duplicar o registry em banco apenas para resolver a versão atual.
- Não reescrever versões ou snapshots históricos.
- Não criar status `desativada/deprecated` sem benefício demonstrado.
- Não criar job, fila, agente ou automação recorrente para reavaliar taxons.
- Não aprovar semanticamente taxon por heurística determinística quando a transição for materialmente incompatível.
- Não usar IA para classificar a compatibilidade estrutural das versões.
- Não alterar E20.5, E19.2, E19.5 ou consumidores sem confirmar o impacto real no recorte técnico próprio.

### 4.2. Critérios de parada

- Parar se a autoridade de versão atual exigir nova residência sem justificativa e sem reconciliação com a arquitetura existente.
- Parar se não for possível distinguir de forma determinística e conservadora `sem mudança material`, `evolução compatível` e `revisão necessária`.
- Parar se a propagação puder reinterpretar snapshots históricos ou alterar silenciosamente uma geração anterior.
- Parar se uma mudança por plano tornar o marcador taxonômico E20.6 insuficiente ou ambíguo.
- Parar se a experiência agregada exigir nova rota, persistência ou infraestrutura antes de analisar as superfícies administrativas já existentes.
- Parar diante de conflito material com a E20.6 vigente; a transição do predicado de igualdade exata deve ocorrer somente por implementação completa e validada, nunca por ajuste parcial.

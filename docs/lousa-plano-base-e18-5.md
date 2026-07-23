23/07/2026 — Plano-base E18.5 — Simplificação do catálogo de módulos e variantes `landing_page`

Fontes: `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/prompt-executor.md`, `docs/prompt-abc.md`, `docs/template-roadmap.md`, `docs/lp-planejamento.md` após o PR #615, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/lousa-plano-base-e18-4.md`, conteúdo anterior deste path, PR #590, `lib/conversion-content/landing-page/module-catalog/`, `lib/conversion-content/landing-page/`, `lib/conversion-content/index.ts` e scripts relacionados no `package.json`.

Versão: v1 para avaliação dos especialistas.

Status: simplificação planejada; a implementação vigente do PR #590 permanece íntegra até sua substituição atômica em PR material próprio.

Path: `docs/lousa-plano-base-e18-5.md`.

Recorte do roadmap: `18.5 — Parametrização de módulos e variantes landing_page`.

Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Estado confirmado

- O PR #615 foi mergeado e definiu a simplificação da E18.5 antes da reavaliação da E18.4.
- O PR #590 implementou um catálogo repo-only com nove módulos e dez variantes, mas também criou listas e tipos fechados, contratos de fields, mapa de copy por path, schema, resolver, clonagem e congelamento profundos e testes extensos.
- A busca no repositório não identificou consumidor real do namespace `landingPageModuleCatalog` fora do próprio boundary, dos exports e da documentação.
- A E18.5 ainda não participa da composição, geração, persistência ou renderização de LPs.
- E18.4, E10.8, E20.2 e `commercial_activation` possuem boundaries próprios e devem permanecer funcionais.
- O histórico Git e o conhecimento produzido pelos PRs #577 e #590 devem ser preservados.

### 1.2. Papel aprovado da E18.5

- Manter uma base de conhecimento versionada, legível e consultiva sobre módulos e variantes de `landing_page`.
- Fornecer contexto simples e serializável para a IA propor composições em recorte futuro aprovado.
- Registrar identidade, finalidade, estrutura sugerida, campos usuais, orientações de copy, sustentação factual, limitações e variantes conhecidas.
- Não funcionar, no MVP atual, como engine universal de geração, validação, resolução ou renderização.
- Manter somente proteção proporcional a um catálogo repo-only sem consumidor de runtime.

### 1.3. Conhecimento mínimo a preservar

- `hero@v1`
  - Função: apresentar a proposta principal e conduzir ao próximo passo prioritário.
  - Variante: `standard@v1`.
  - Estrutura usual: eyebrow opcional, título, subtítulo, CTA principal, prova curta opcional e mídia opcional.
  - Cuidados: sem formulário completo; mídia informativa exige alternativa textual; promessa e prova exigem suporte.
- `trust_bar@v1`
  - Função: apresentar sinais curtos e verificáveis de confiança.
  - Variante: `standard@v1`.
  - Estrutura usual: coleção breve de sinais.
  - Cuidados: sem depoimento extenso; cada sinal exige evidência real.
- `problem_solution@v1`
  - Função: relacionar problemas ou riscos a respostas práticas.
  - Variante: `standard@v1`.
  - Estrutura usual: título e coleção de pares problema–solução.
  - Cuidados: correspondência direta, distinção clara e ausência de alarmismo.
- `offer@v1`
  - Função: apresentar ofertas ou casos de uso disponíveis.
  - Variante: `standard@v1`.
  - Estrutura usual: título e coleção de itens com nome e descrição.
  - Cuidados: item, condição, preço, prazo, parceria, garantia ou disponibilidade exigem suporte operacional.
- `process@v1`
  - Função: explicar uma progressão real por etapas.
  - Variante: `standard@v1`.
  - Estrutura usual: título e sequência ordenada de etapas.
  - Cuidados: não inventar prazo, etapa ou resultado.
- `technical_assurance@v1`
  - Função: explicar salvaguardas, critérios, documentos, credenciais ou verificações.
  - Variante: `standard@v1`.
  - Estrutura usual: título e coleção de itens técnicos.
  - Cuidados: todo item deve ser verificável e não pode implicar risco zero, aprovação ou resultado garantido.
- `social_proof@v1`
  - Função: apresentar experiências reais de terceiros.
  - Variante: `standard@v1`.
  - Estrutura usual: título e coleção de citação, atribuição e referência de evidência.
  - Cuidados: prova real, rastreável, autorizada e sem alteração material.
- `faq@v1`
  - Função: responder dúvidas e objeções em pares de pergunta e resposta.
  - Variantes: `standard@v1` e `accordion@v1`.
  - Estrutura usual: título e coleção de perguntas e respostas.
  - Cuidados: fatos exigem suporte; `accordion@v1` preserva operação por teclado, estado expandido ou recolhido, associação acessível e foco.
- `final_cta@v1`
  - Função: encerrar a jornada com próximo passo claro e qualificado.
  - Variante: `standard@v1`.
  - Estrutura usual: título, corpo e CTA principal.
  - Cuidados: uma ação principal, linguagem não coercitiva, sem destino concreto no catálogo e sem formulário completo.

### 1.4. Regras de copy, fatos e intenção

- BOFU prioriza próximo passo direto, objeções e prova sustentada, sem coerção, falsa escassez ou promessa não comprovada.
- MOFU prioriza educação, relação problema–solução, processo, segurança técnica e FAQ, sem preço, urgência, garantia, comparação ou resultado inventados.
- TOFU prioriza contexto, reconhecimento do problema, desejo e educação introdutória, com CTA de baixa pressão e sem condição comercial ou promessa de resultado.
- Pesquisa pode orientar copy, mas não comprova fatos da operação.
- Credencial, capacidade, condição, preço, prazo, parceria, disponibilidade, resultado ou garantia exigem evidência operacional.
- Social Proof usa a evidência real como fonte da citação e da atribuição.
- Orientações de fontes podem permanecer próximas do campo ou da variante, sem mapa paralelo e sem `switch` por path.

### 1.5. Extensibilidade obrigatória

- Módulo representa função estrutural reutilizável.
- Variante representa outra execução estrutural ou comportamental reutilizável da mesma função.
- Taxon, plano, campanha, funil, conteúdo, ordem, ativo ou ajuste já permitido não criam isoladamente módulo ou variante.
- Adicionar ou ajustar módulo ou variante comum deve ocorrer principalmente em uma única fonte de catálogo.
- A extensão comum não pode exigir alteração de resolver genérico, listas duplicadas, contagens fixas, schema por chave ou testes que enumerem todas as identidades.
- Código adicional somente se justifica por capacidade técnica nova e real, como interação ou suporte de renderer ainda inexistente.
- Versões anteriores e histórico Git permanecem preservados; lifecycle e compatibilidade detalhados só permanecem quando um consumidor atual justificar seu custo.

## 2. Contrato do caso

### 2.1. Resultado técnico mínimo

- Manter o boundary existente como residência do catálogo, sem antecipar o nome exato dos arquivos finais.
- Ter uma fonte versionada única, legível em revisão humana e serializável diretamente para contexto de IA.
- Expor leitura somente leitura e tipos mínimos úteis.
- Permitir acesso ao catálogo completo e, somente se necessário, busca simples derivada da própria fonte.
- Manter o estado de hipótese das definições como orientação do catálogo, sem engine independente de lifecycle por raiz, módulo e variante.
- Evitar dependência da E18.4 além do estritamente necessário enquanto a implementação vigente for substituída.

### 2.2. Estrutura conceitual mínima

- Catálogo:
  - família;
  - versão do catálogo;
  - nota de validade e uso consultivo;
  - orientações gerais de copy, fatos e acessibilidade;
  - coleção de módulos.
- Módulo:
  - chave e versão;
  - função estrutural;
  - invariantes e limitações;
  - estrutura ou campos usuais;
  - orientações de copy e sustentação factual;
  - coleção de variantes.
- Variante:
  - chave e versão;
  - diferença reutilizável em relação à função do módulo;
  - estrutura sugerida quando diferir;
  - cuidados técnicos ou de acessibilidade realmente aplicáveis.
- Chaves, versões e relações devem ser derivadas da própria fonte sempre que possível, sem listas paralelas.
- O catálogo não representa payload final, schema de conteúdo, composição, ordem ou contrato de renderer.

### 2.3. Fluxo operacional

- Gatilho: fluxo futuro aprovado precisa fornecer à IA o conhecimento de módulos e variantes.
- Entrada: versão consultiva do catálogo.
- Processamento: leitura e serialização simples; filtragem ou busca somente quando um consumidor real exigir.
- Validação: tipagem estática e, se proporcional, validação estrutural genérica da fonte.
- Persistência: N/A.
- Consumo: contexto para IA e consulta por implementadores; E20.3 será responsável por proposta e composição quando implementada.
- Fallback: catálogo ausente ou estruturalmente inválido bloqueia o consumo explícito; não existe seleção aproximada, criação automática de contrato ou fallback para outro módulo.
- Observabilidade: N/A enquanto não houver consumidor de runtime.

### 2.4. API, validação e remoções

- A API pública deve ser mínima e refletir o uso atual: catálogo somente leitura e tipos essenciais.
- O namespace público existente pode ser preservado durante a transição se isso reduzir risco, mas não obriga a manter o resolver atual.
- A serialização para IA não deve depender de resolver, preset raiz, perfil fechado ou composição de deltas.
- Um schema runtime só permanece se proteger uma entrada externa ou risco real; se mantido, deve validar estrutura genérica, não conhecer todas as chaves atuais.
- Testes, quando mantidos, devem verificar invariantes genéricas, serialização e ausência de duplicidade, sem afirmar nove módulos, dez variantes ou identidades fechadas como regra do mecanismo.
- Clonagem e congelamento profundos somente permanecem se houver referência mutável compartilhada com consumidor real e benefício proporcional.
- Devem ser removidos ou simplificados, quando perderem função:
  - resolver exclusivo do catálogo;
  - schema ligado às chaves atuais;
  - listas duplicadas de módulos, variantes, fields, capabilities, perfis e treatments;
  - `copySourceMapFor` baseado em `switch` por path;
  - regras genéricas vinculadas a variantes específicas;
  - testes de contagem fixa;
  - exports e scripts órfãos.

### 2.5. Compatibilidade da substituição

- A implementação vigente permanece na `main` até o PR material substituir fonte, tipos, API e remoções de forma atômica.
- A E18.4 não será simplificada neste plano.
- A API da E18.4 necessária à compilação deve ser preservada temporariamente.
- Dependências desnecessárias da E18.4 dentro da E18.5 simplificada devem ser removidas.
- E10.8, E20.2, `commercial_activation` e os exports públicos não relacionados devem permanecer funcionais.
- `docs/base-tecnica.md`, `docs/roadmap.md`, exports e scripts devem ser atualizados no PR material conforme o diff real, sem registrar artefatos inexistentes.

## 3. Fases e próxima ação

### 3.1. E18.5.3–E18.5.9 — Simplificar o catálogo de módulos e variantes

- Automação: não.
- Objetivo: substituir a arquitetura rígida da E18.5 por um catálogo consultivo mínimo, versionado e extensível, preservando o conhecimento útil.
- Entregas:
  - confirmar novamente os consumidores e dependências antes da remoção;
  - definir, dentro do boundary existente, a menor fonte única e a menor API pública adequadas;
  - migrar os nove módulos e as dez variantes para a fonte consultiva;
  - preservar campos usuais, orientações de copy, sustentação factual, limitações e acessibilidade relevantes;
  - remover artefatos, exports e scripts que perderem função;
  - manter temporariamente apenas compatibilidade necessária para a `main` permanecer íntegra;
  - atualizar documentação durável afetada pelo estado material final.
- Critérios de aceite:
  - os nove módulos e as dez variantes permanecem disponíveis como conhecimento consultivo;
  - o catálogo pode ser serializado ou fornecido à IA sem resolver complexo;
  - módulo ou variante simples pode ser adicionado por mudança localizada na fonte do catálogo;
  - não há listas duplicadas, contagens fixas, schema por chave ou regra genérica amarrada às identidades atuais;
  - não há banco, migration, rota, UI, renderer, composição, persistência ou integração com E19/E20;
  - E18.4, E10.8, E20.2 e `commercial_activation` permanecem funcionais;
  - não ficam imports, exports, scripts ou arquivos órfãos;
  - a implementação permanece tipada e segura de forma proporcional ao uso real;
  - a remoção e a nova fonte entram atomicamente no mesmo PR.
- Validações:
  - `npm run check`;
  - validação específica da E18.5 simplificada, somente se ainda existir script próprio;
  - `npm run validate:landing-page-root`;
  - `npm run validate:landing-page-research`;
  - `npm run validate:landing-page-input-catalog`;
  - `npm run validate:commercial-activation`;
  - `git diff --check`;
  - checks da Vercel.
- Teste humano: não necessário, pois não existe superfície visual ou fluxo observável.

### 3.2. Próxima ação

- Submeter esta v1, no mesmo PR do ajuste planejado do roadmap, ao Analista, Gestor Estrutural e Gestor de Updates.
- Consolidar os pareceres em v2 neste mesmo PR, sem ampliar o escopo.
- Solicitar merge humano do plano-base v2.
- Somente após o merge, instruir o Executor a executar a fase material em branch e PR próprios.
- O Executor deve trabalhar somente na fase 3.1 e devolver conflito, dependência ou ampliação ao Estrategista.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não simplificar a E18.4.
- Não implementar composição por taxon, E20.3 ou operação administrativa.
- Não implementar proposição por IA no Admin, Responses API, geração de LP ou renderer.
- Não criar conteúdo real, banco, migration, persistência, rota, Server Action ou UI.
- Não criar agente, automação, job ou nova infraestrutura.
- Não integrar a E18.5 à E19 ou à E20.
- Não adicionar novos módulos ou variantes, salvo necessidade indispensável para provar a extensibilidade e com justificativa explícita.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se surgir consumidor real não mapeado que dependa do resolver, schema ou shape atual.
- Parar se a substituição exigir mudança de produto, banco, renderer, composição ou E18.4 simplificada.
- Parar se uma proteção nova não tiver risco real, consumidor ou benefício proporcional demonstrável.
- Parar se uma extensão comum continuar exigindo alterações distribuídas em listas, schemas, resolvers ou testes.
- Parar se o PR material não conseguir manter a `main` íntegra de forma atômica.
- Parar se houver tentativa de registrar no roadmap ou na Base Técnica uma implementação ainda não existente.

### 4.3. Critérios de encerramento

- Encerrar o plano somente após o PR material ser aprovado e mergeado.
- Confirmar no estado final a preservação dos nove módulos e das dez variantes.
- Confirmar extensão localizada, API mínima, ausência de órfãos e validações aplicáveis com código zero.
- Registrar o estado final real em `docs/roadmap.md` e a regra técnica durável mínima em `docs/base-tecnica.md`.
- Após o encerramento, reavaliar a E18.4 conforme as necessidades reais restantes.

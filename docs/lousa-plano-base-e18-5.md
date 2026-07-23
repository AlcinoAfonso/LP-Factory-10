23/07/2026 — Plano-base E18.5 — Otimização do catálogo de módulos e variantes `landing_page`

Fontes: `README.md`, `AGENTS.md`, `docs/prompt-estrategista.md`, `docs/prompt-executor.md`, `docs/prompt-abc.md`, `docs/template-roadmap.md`, `docs/lp-planejamento.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/lousa-plano-base-e18-4.md`, `docs/lousa-plano-base-e20-2.md`, conteúdo anterior deste path, PRs #590, #616 e #617, `lib/conversion-content/landing-page/`, `lib/conversion-content/landing-page/module-catalog/`, `lib/conversion-content/landing-page/input-catalog/`, `lib/conversion-content/index.ts` e scripts relacionados no `package.json`.

Versão: v1 reformulada após os quatro testes experimentais do PR #617, para merge humano e posterior orquestração.

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
- Preserva fields abstratos, obrigatoriedade, tipo, função, consentimento, privacidade e acessibilidade.
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

- O namespace público deve continuar expondo somente tipos autorizados e `resolveLandingPageModuleCatalog`, salvo alternativa comprovadamente menor e compatível aprovada pelo diff material.
- Registry e schema não integram a API pública.
- O schema genérico valida estrutura e invariantes sem se tornar uma segunda fonte nominal do catálogo.
- Testes preservam contratos específicos relevantes e casos negativos.
- Contagem de módulos, variantes ou fields não é regra arquitetural.
- Comparações com o registry canônico somente permanecem quando protegerem coerência real; sua remoção total não está previamente aprovada.

## 3. Fases e próxima ação

### 3.1. E18.5.3–E18.5.9 — Otimizar o catálogo e incorporar as extensões comprovadas

- Automação: não.
- Objetivo:
  - otimizar o recorte da E18.5 incorporado pelo PR #590;
  - incorporar definitivamente `benefits.standard@v1`;
  - incorporar definitivamente `hero.form@v1`;
  - repetir comparativamente os quatro testes do PR #617.
- Base de execução:
  - partir da `main` atualizada após o merge documental do PR #616;
  - consultar os diffs do PR #617 como evidência e baseline;
  - não mergear o PR #617;
  - não fazer cherry-pick integral de seus commits;
  - não transportar o acoplamento imobiliário;
  - não implementar automaticamente todas as sugestões experimentais.
- Entregas:
  - remover contagens globais fixas;
  - manter fontes junto dos fields e remover `copySourceMapFor(path)`;
  - reduzir listas e identidades paralelas quando houver derivação segura;
  - substituir regras nominais por relações estruturais realmente genéricas;
  - preservar resolver, falha fechada, imutabilidade, contratos e casos negativos;
  - incorporar os três identificadores permanentes planejados;
  - atualizar documentação durável somente conforme o diff material real.

### 3.2. Teste obrigatório 1 — novo módulo

- Incorporar `benefits@v1` e `benefits.standard@v1`.
- Resolver módulo e variante corretamente.
- Preservar cardinalidades e imutabilidade.
- Não alterar o resolver.
- Não alterar schema por identidade nominal.
- Não ajustar contagens globais.

### 3.3. Teste obrigatório 2 — nova variante

- Incorporar `hero.form@v1`.
- Manter `hero.standard@v1` sem formulário.
- Representar capability e contrato abstrato.
- Preservar falha fechada.
- Evitar regra nominal vinculada a `hero.form@v1` quando a relação puder ser estrutural.

### 3.4. Teste obrigatório 3 — fontes combinadas

- Representar pesquisa estruturada e necessidade de suporte operacional.
- Manter as fontes junto dos fields.
- Não incluir referências imobiliárias diretas.
- Não importar o registry da E20.2.
- Comprovar falha para declaração estruturalmente incompleta.
- Distinguir representação declarativa de integridade referencial.

### 3.5. Teste obrigatório 4 — contrato estrutural de formulário

- Representar fields abstratos.
- Representar obrigatoriedade.
- Representar consentimento.
- Representar necessidade de política de privacidade.
- Representar acessibilidade mínima.
- Representar conversão por formulário.
- Comprovar incompatibilidades por casos negativos.
- Não implementar formulário funcional.

### 3.6. Métricas comparativas obrigatórias

- Para cada teste, registrar:
  - arquivos alterados;
  - inserções e exclusões;
  - pontos necessários de alteração;
  - contratos e tipos alterados;
  - alterações no registry;
  - alterações no schema;
  - alterações no resolver;
  - listas paralelas alteradas;
  - contagens fixas alteradas;
  - regras nominais adicionadas;
  - duplicações introduzidas;
  - casos negativos preservados;
  - proteções comprovadas;
  - diferença em relação ao PR #617.
- Priorizar na comparação:
  - menos pontos distribuídos de alteração;
  - ausência de contagens fixas;
  - ausência de novas regras nominais;
  - fontes junto dos fields;
  - resolver intacto;
  - mesmas proteções;
  - mesmos casos negativos;
  - ausência de dependência direta entre os registries E18.5 e E20.2.
- Menos arquivos alterados permanece métrica auxiliar, não objetivo isolado.

### 3.7. Validações do futuro PR material

- Executar:
  - `npm ci`;
  - `npm run validate:landing-page-root`;
  - `npm run validate:landing-page-research`;
  - `npm run validate:landing-page-input-catalog`;
  - `npm run validate:landing-page-module-catalog`;
  - `npm run validate:commercial-activation`;
  - `npm run check`;
  - `git diff --check`.
- Todos os comandos devem terminar com código zero.
- Casos negativos devem falhar pelo resultado discriminado esperado, sem exceção não tratada.
- Teste humano e smoke visual permanecem N/A enquanto não houver superfície visual.

### 3.8. Próxima ação

- Processo escolhido pelo humano: Opção 2 — Processo automatizado.
- Solicitar merge humano desta v1 reformulada, com `docs/roadmap.md` ajustado no mesmo PR.
- Após a confirmação do merge, entregar ao orquestrador somente:
  - `Use Orquestrar plano-base no PR #616.`
- Somente depois da orquestração e aprovação do plano-base deverá ser criado novo PR material baseado na `main` atualizada.
- Não iniciar rodada manual dos especialistas nem execução material antes do merge.

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
- Não marcar o PR #616 como ready for review.
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

- Revisar o diff completo do PR #616.
- Confirmar que somente `docs/lousa-plano-base-e18-5.md` e `docs/roadmap.md` foram alterados.
- Confirmar preservação das quatro seções principais, estrutura, numeração, ordem e estilo em bullets.
- Buscar expressões residuais incompatíveis, especialmente:
  - substituição integral;
  - catálogo apenas consultivo;
  - nove módulos como alvo futuro;
  - dez variantes como alvo futuro;
  - remoção obrigatória do resolver;
  - merge do PR #617.
- Executar `git diff --check`.
- Registrar como N/A:
  - `npm ci`;
  - `npm run check`;
  - validações materiais;
  - teste humano;
  - smoke visual.

### 4.4. Critérios de encerramento

- Manter o PR #616 aberto em draft e aguardar avaliação humana e do Analista.
- Manter o PR #617 aberto em draft, sem merge, como baseline experimental.
- Encerrar somente esta entrega documental após commit, push, atualização do título/descrição do PR #616 e validações documentais.
- A execução material futura só começa após aprovação, merge humano e orquestração do plano-base.

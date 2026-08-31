# Orquestração de plano-base — desenho conceitual e técnico

## 1. Objetivo

Transformar uma v1 funcional incorporada à `main` em uma v2 técnica aprovada e em implementação completa com uma única instrução humana, uma branch e um PR contra `main`. A v1 define o que o recorte deve entregar; a v2 traduz esse contrato para a melhor solução técnica proporcional no repositório real, sem ampliar silenciosamente o produto. O task principal atua como orquestrador e executor; custom agents permanecem read-only.

Este documento registra somente o desenho durável. Critérios de julgamento pertencem aos TOMLs dos agentes; sequência operacional e validações pertencem às skills correspondentes.

## 2. Papéis

- **Orquestrador/Executor:** seleciona fontes, coordena avaliações, consolida a v2 técnica, mantém matriz e PR, implementa e valida sem reinterpretar o escopo funcional aprovado.
- **Gestor Estrutural:** deriva a solução técnica mínima da v1, avaliando estrutura, boundaries, reuso, coesão de adapters, acoplamento, regressão e aderência às fontes técnicas; quando um update tiver impacto estrutural material, confronta focalmente seu custo arquitetural sem reavaliar todo o plano.
- **Gestor de Updates:** desafia a solução técnica com recursos catalogados que possam melhorar qualidade, latência, custo, segurança, confiabilidade, manutenção ou complexidade líquida, inclusive quando a modernização não tiver sido imaginada durante a v1.
- **Gestor de Automações:** atua quando houver fase marcada como `Automação: sim`, salvo dispensa humana registrada na v1 porque o detalhamento material já foi fechado no debate; volta se surgir mudança relevante de automação, categoria, ambiente ou risco.
- **Analista:** é o gate de integridade entre v1, v2 e implementação; confirma cobertura funcional, suficiência técnica, ganho líquido de modernizações materiais e ausência de ampliação silenciosa. Não refaz especialidades.
- **Estrategista:** é acionado pelo humano depois da entrega completa, avalia diretamente o PR e decide quando o recorte está definitivamente concluído.
- **Humano:** decide escolhas sem autoridade documental, mudança real de produto ou escopo, testes humanos, avaliação pelo Estrategista e merge no GitHub Web.

## 3. Fluxo end-to-end

1. Congelar v1 e snapshot do roadmap na `main`.
2. Criar ou reutilizar destino isolado em branch dedicada contra `main`.
3. Obter a derivação inicial do Gestor Estrutural e o parecer do Gestor de Updates; obter Automações quando aplicável e não dispensado na v1.
4. Quando um update aprovado tiver impacto estrutural material, retornar somente esse candidato ao Gestor Estrutural para confronto focal de ganho versus custo arquitetural; não repetir a avaliação estrutural completa.
5. Produzir a v2 técnica e preparar a matriz sem expô-la ao Analista.
6. Executar Passagem 1 independente; depois gravar a matriz e executar Passagem 2 no mesmo Analista, incluindo os confrontos materiais aplicáveis.
7. Reconciliar o roadmap por `$lp-factory-abc`, auditar o delta e criar o checkpoint `plan-v2-approved`.
8. Abrir ou atualizar o único PR draft e executar todas as subseções, com gate do Analista em cada uma.
9. Validar, avaliar teste humano, declarar a entrega completa e parar.

O fluxo retoma por pareceres vinculados ao blob da v1 e trailers de checkpoint; não repete especialistas ou subseções concluídas por precaução. Confronto focal de modernização material não conta como nova avaliação completa e deve limitar-se ao candidato que o exigiu.

## 4. V1, v2 e fronteira de escopo

A v1 é o contrato funcional aprovado: problema, resultado esperado, comportamento, limites, decisões de produto, escopo negativo e critérios funcionais de aceite. Ela não precisa definir arquivos, helpers, adapters, migrations ou outras escolhas técnicas ordinárias e não congela a tecnologia disponível.

A v2 é o contrato técnico executável da v1. Ela pode acrescentar somente itens com origem verificável em requisito ou decisão da v1, invariante técnico vigente ou modernização técnica justificada.

Cada acréscimo técnico da v2 deve ser classificado como:

- `derivação técnica da v1`;
- `modernização técnica justificada`;
- `ampliação de escopo`.

`Derivação técnica da v1` transforma o contrato funcional em implementação suficiente: boundaries, arquivos, contratos, persistência, segurança, sequência e validação necessárias. Fechamentos técnicos impostos por fontes competentes ou invariantes existentes pertencem a esta classe mesmo quando a v1 não detalhar sua mecânica.

`Modernização técnica justificada` pode não ter sido conhecida ou imaginada na v1, mas preserva seu resultado funcional e demonstra ganho líquido sobre a solução técnica derivada. Modernidade isolada, disponibilidade de recurso ou boa prática genérica não bastam.

`Ampliação de escopo` altera resultado funcional, cria capacidade de produto independente ou exige decisão estratégica não contida na v1. Deve ser excluída da v2, encaminhada a novo recorte ou submetida ao humano.

Plano conceitual só é fonte quando houver referência competente ou vínculo inequívoco com o recorte. Quando não existir, registrar `N/A` e continuar; sua ausência não é pendência. Quando existir, o Analista verifica a cadeia `planejamento conceitual → v1 → v2`.

## 5. Updates e modernização técnica

Cada update relacionado ao recorte recebe um destino:

- aplicar agora;
- usar como referência, validação ou trava;
- preservar como oportunidade estratégica condicional;
- não aplicável ao recorte.

Para `aplicar agora`, o Gestor de Updates deve comparar a solução técnica sem o update e com o update, registrando ganho esperado, complexidade adicionada ou removida, impacto estrutural e eventual impacto funcional. Considerar, quando relevantes, qualidade, latência, custo, segurança, confiabilidade, manutenção, código próprio, componentes, maturidade e lock-in.

Update com impacto estrutural baixo e nenhum impacto funcional pode ser incorporado como modernização técnica justificada quando o ganho for proporcional e rastreável. Update com impacto estrutural material exige confronto focal do Gestor Estrutural antes do gate do Analista. Update com potencial impacto funcional não recebe autorização automática: o Analista decide se ainda cumpre a mesma v1; se houver mudança real de produto ou escopo, exige decisão humana ou novo recorte.

Oportunidade condicional registra valor, complexidade líquida, horizonte e gatilho, mas não autoriza implementação. Estar fora do MVP ou apresentar complexidade genérica não basta para descarte. O Analista audita o tratamento; o Orquestrador não refaz a especialidade.

## 6. Coesão estrutural e adapters

A derivação técnica deve preservar `UI → Providers → Adapters → DB` e as responsabilidades canônicas da Base Técnica.

Ao tocar adapter ou boundary existente, o Gestor Estrutural deve verificar coesão de responsabilidade, não tamanho arbitrário de arquivo. Nova responsabilidade não entra em adapter apenas por conveniência de localização. Quando a v1 ou uma modernização aprovada exigir responsabilidade distinta, preferir residência existente adequada ou extração focal mínima, sem criar boundary global novo sem responsabilidade e massa próprias.

Poluição histórica sem relação material com o recorte não autoriza refatoração ampla. Se o adapter tocado já misturar responsabilidades, o Gestor Estrutural pode exigir somente a extração focal necessária para implementar a v1 de forma coesa; o restante permanece risco ou dívida fora do recorte.

O Analista confirma que a solução preserva coesão e que qualquer extração reduz complexidade líquida sem deslocá-la para outro módulo nem ampliar funcionalidade.

## 7. Analista e matriz

Há um único papel de Analista e instâncias read-only conforme o gate. No plano, a mesma instância executa Passagem 1, Passagem 2 e revisões delta. Na implementação, uma instância avalia cada subseção e seu eventual delta.

A matriz registra todos os achados e permanece disponível enquanto o recorte puder exigir avaliação externa, merge, validação pós-merge ou PR corretivo. Para cada acréscimo técnico, registra origem (`v1`, `invariante técnico` ou `update`), classificação, tratamento, localização e evidência; para modernização, registra também ganho esperado, impacto estrutural, impacto funcional e confronto estrutural quando aplicável.

Na Passagem 1, o Analista verifica independentemente se toda decisão funcional da v1 está coberta, se a v2 é tecnicamente suficiente e se há complexidade não rastreável ou não justificada. Na Passagem 2, audita pareceres e matriz, confrontando ganho do update com custo arquitetural quando houver modernização material e rejeitando complexidade tecnicamente defensável sem ganho líquido proporcional.

Depois que o Executor declarar a entrega completa, nenhum modo do Analista deste processo é acionado. O ciclo pré-merge e eventual continuação pós-merge passam a ocorrer entre humano, Estrategista e Executor, preservando a matriz até a decisão final do recorte.

Quando o Estrategista declarar o recorte definitivamente concluído, a matriz deixa de ter consumidor operacional e deve ser removida do tree atual. Preferir a remoção no PR ainda aberto do recorte; se todo o trabalho já estiver mergeado, usar PR documental mínimo somente para essa exclusão. A limpeza preserva a rastreabilidade no histórico Git e do PR e não reabre gates do Analista ou dos especialistas.

## 8. Git, validação e parada

O fluxo normal usa uma branch e um PR draft contra `main`; não edita `main`, não cria PR empilhado e não faz merge. As validações seguem `AGENTS.md` e as skills de execução. Recurso ambiental indisponível limita somente a validação dependente, sem esconder trabalho material concluído nem bloquear entregas independentes.

Parar somente por fonte obrigatória ausente, handoff incompleto, investigação necessária, decisão material sem autoridade, mudança real de produto/escopo ou teste humano indispensável.

## 9. Fontes de verdade

- `.codex/agents/*.toml`: competência e formato de entrega dos especialistas e do Analista.
- `.agents/skills/lp-factory-*/SKILL.md`: preparação, roteamento, gates e limites operacionais.
- `README.md`: política tecnológica.
- `AGENTS.md`: regras de execução, Git, publicação e validação.
- `docs/base-tecnica.md`: boundaries, adapters, camadas, segurança e convenções técnicas.
- documentos canônicos do caso: requisitos e estado do produto.

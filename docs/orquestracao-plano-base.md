# Orquestração de plano-base — desenho conceitual e técnico

## 1. Objetivo

Transformar uma v1 incorporada à `main` em v2 aprovada e implementação completa com uma única instrução humana, uma branch e um PR contra `main`. O task principal atua como orquestrador e executor; custom agents permanecem read-only.

Este documento registra somente o desenho durável. Critérios de julgamento pertencem aos TOMLs dos agentes; sequência operacional e validações pertencem às skills correspondentes.

## 2. Papéis

- **Orquestrador/Executor:** seleciona fontes, coordena avaliações, consolida a v2, mantém matriz e PR, implementa e valida.
- **Gestor Estrutural:** avalia estrutura, boundaries, reuso, acoplamento, regressão e aderência às fontes técnicas.
- **Gestor de Updates:** classifica updates catalogados quanto à aplicabilidade atual, uso de apoio, oportunidade condicional ou não aplicabilidade.
- **Gestor de Automações:** atua quando houver fase marcada como `Automação: sim`, salvo dispensa humana registrada na v1 porque o detalhamento material já foi fechado no debate; volta se surgir mudança relevante de automação, categoria, ambiente ou risco.
- **Analista:** é o gate de integridade de escopo e rastreabilidade do plano e das subseções implementadas; não refaz especialidades.
- **Estrategista:** é acionado pelo humano depois da entrega completa e avalia diretamente o PR.
- **Humano:** decide escolhas sem autoridade documental, testes humanos, avaliação pelo Estrategista e merge no GitHub Web.

## 3. Fluxo end-to-end

1. Congelar v1 e snapshot do roadmap na `main`.
2. Criar ou reutilizar destino isolado em branch dedicada contra `main`.
3. Obter uma vez os pareceres Estrutural e de Updates; obter Automações quando aplicável e não dispensado na v1.
4. Produzir a v2 preservando a v1 e preparar a matriz sem expô-la ao Analista.
5. Executar Passagem 1 independente; depois gravar a matriz e executar Passagem 2 no mesmo Analista.
6. Reconciliar o roadmap por `$lp-factory-abc`, auditar o delta e criar o checkpoint `plan-v2-approved`.
7. Abrir ou atualizar o único PR draft e executar todas as subseções, com gate do Analista em cada uma.
8. Validar, avaliar teste humano, declarar a entrega completa e parar.

O fluxo retoma por pareceres vinculados ao blob da v1 e trailers de checkpoint; não repete especialistas ou subseções concluídas por precaução.

## 4. Escopo e planejamento conceitual

A v1 é a fronteira padrão. Cada acréscimo deve ser classificado como:

- `preservação do escopo`;
- `extensão adjacente necessária e proporcional`;
- `expansão de escopo`.

Extensão adjacente é o menor delta indispensável ao resultado da v1, rastreável e incapaz de criar capacidade, domínio, infraestrutura ou frente independente. Expansão exige exclusão, novo recorte ou decisão humana.

Plano conceitual só é fonte quando houver referência competente ou vínculo inequívoco com o recorte. Quando não existir, registrar `N/A` e continuar; sua ausência não é pendência. Quando existir, o Analista verifica a cadeia `planejamento conceitual → v1 → v2`.

## 5. Updates

Cada update relacionado ao recorte recebe um destino:

- aplicar agora;
- usar como referência, validação ou trava;
- preservar como oportunidade estratégica condicional;
- não aplicável ao recorte.

Oportunidade condicional registra valor, complexidade líquida, horizonte e gatilho, mas não autoriza implementação. Estar fora do MVP ou apresentar complexidade genérica não basta para descarte. O Analista audita o tratamento; o Orquestrador não refaz a especialidade.

## 6. Analista e matriz

Há um único papel de Analista e instâncias read-only conforme o gate. No plano, a mesma instância executa Passagem 1, Passagem 2 e revisões delta. Na implementação, uma instância avalia cada subseção e seu eventual delta.

A matriz registra todos os achados e permanece temporariamente no PR até a entrega completa. Ela inclui origem, classificação, relação com o escopo, tratamento, destino do update quando aplicável, localização e evidência. Sua remoção posterior depende de instrução humana e não cria novo gate.

Depois que o Executor declarar a entrega completa, nenhum modo do Analista deste processo é acionado. O ciclo pré-merge passa a ocorrer entre humano, Estrategista e Executor.

## 7. Git, validação e parada

O fluxo normal usa uma branch e um PR draft contra `main`; não edita `main`, não cria PR empilhado e não faz merge. As validações seguem `AGENTS.md` e as skills de execução. Recurso ambiental indisponível limita somente a validação dependente, sem esconder trabalho material concluído nem bloquear entregas independentes.

Parar somente por fonte obrigatória ausente, handoff incompleto, investigação necessária, decisão material sem autoridade ou teste humano indispensável.

## 8. Fontes de verdade

- `.codex/agents/*.toml`: competência e formato de entrega dos especialistas e do Analista.
- `.agents/skills/lp-factory-*/SKILL.md`: preparação, roteamento, gates e limites operacionais.
- `README.md`: política tecnológica.
- `AGENTS.md`: regras de execução, Git, publicação e validação.
- documentos canônicos do caso: requisitos e estado do produto.

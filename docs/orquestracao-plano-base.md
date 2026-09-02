# Orquestração de plano-base — desenho conceitual e técnico

## 1. Objetivo

Transformar uma v1 funcional incorporada à `main` em uma v2 técnica aprovada e em implementação completa com uma única instrução humana, uma branch e um PR contra `main`. A v1 define o que o recorte deve entregar; a v2 traduz esse contrato para uma solução técnica proporcional no repositório real, sem ampliar silenciosamente o produto. O task principal atua como orquestrador e executor; custom agents permanecem read-only.

Este documento registra somente o desenho durável. Critérios de julgamento pertencem aos TOMLs dos agentes; sequência operacional e validações pertencem às skills correspondentes.

## 2. Papéis

- **Orquestrador/Executor:** coordena avaliações, consolida a v2 técnica, mantém matriz e PR e executa o contrato aprovado.
- **Gestor Estrutural:** deriva a solução técnica mínima da v1 e avalia estrutura, boundaries, adapters, reuso, acoplamento e regressão.
- **Gestor de Updates:** avalia recursos catalogados que possam melhorar tecnicamente a solução, inclusive modernizações não imaginadas na v1.
- **Gestor de Automações:** atua quando houver fase marcada como `Automação: sim`, salvo dispensa humana registrada na v1.
- **Analista:** é o gate de integridade entre v1, v2 e implementação; não refaz especialidades.
- **Estrategista:** é acionado pelo humano depois da entrega completa e decide quando o recorte está definitivamente concluído.
- **Humano:** decide mudança real de produto ou escopo, testes humanos, avaliação pelo Estrategista e merge no GitHub Web.

## 3. Fluxo end-to-end

1. Congelar v1 e snapshot do roadmap na `main`.
2. Criar ou reutilizar destino isolado em branch dedicada contra `main`.
3. Obter a derivação inicial do Gestor Estrutural, o parecer do Gestor de Updates e Automações quando aplicável.
4. Quando um update aplicável tiver impacto estrutural material, submetê-lo a confronto focal do Gestor Estrutural, sem repetir a avaliação completa.
5. Produzir a v2 técnica e preparar a matriz.
6. Executar as duas passagens do Analista e corrigir somente os deltas exigidos.
7. Reconciliar o roadmap, criar o checkpoint `plan-v2-approved` e executar as subseções no mesmo PR.
8. Validar, avaliar teste humano quando aplicável, declarar a entrega completa e parar.

O fluxo retoma por pareceres vinculados ao blob da v1 e checkpoints; não repete especialistas ou subseções concluídas por precaução.

## 4. V1, v2 e fronteira de escopo

A v1 é o contrato funcional aprovado: problema, resultado esperado, comportamento, limites, decisões de produto, escopo negativo e critérios funcionais de aceite. Ela não precisa definir escolhas técnicas ordinárias e não congela a tecnologia disponível.

A v2 é o contrato técnico executável da v1. Cada acréscimo técnico deve ter origem verificável e ser classificado como:

- `derivação técnica da v1`;
- `modernização técnica justificada`;
- `ampliação de escopo`.

`Derivação técnica da v1` transforma o contrato funcional em implementação suficiente e inclui fechamentos exigidos por fontes competentes ou invariantes técnicos vigentes.

`Modernização técnica justificada` pode não ter sido imaginada na v1, mas preserva o mesmo resultado funcional e demonstra ganho técnico proporcional.

`Ampliação de escopo` altera resultado funcional ou cria capacidade de produto não aprovada na v1. Deve ser excluída da v2, encaminhada a novo recorte ou submetida ao humano.

Plano conceitual só é fonte quando houver referência competente ou vínculo inequívoco com o recorte. Quando não existir, registrar `N/A` e continuar.

## 5. Updates e modernização técnica

Cada update relacionado ao recorte recebe um destino:

- aplicar agora;
- usar como referência, validação ou trava;
- preservar como oportunidade estratégica condicional;
- não aplicável ao recorte.

Update aplicável pode alterar o como técnico sem alterar o quê funcional. Quando houver impacto estrutural material, o Gestor Estrutural confronta focalmente ganho e custo arquitetural antes do gate do Analista. Mudança funcional real exige decisão humana ou novo recorte.

Oportunidade condicional não autoriza implementação atual.

## 6. Coesão estrutural e adapters

A derivação técnica deve respeitar as responsabilidades e boundaries vigentes. O Gestor Estrutural avalia a coesão dos adapters e boundaries materialmente tocados e evita tanto nova poluição quanto refatoração histórica ampla fora do recorte.

O Analista confirma que a solução permanece coesa e dentro do contrato funcional, sem se tornar coautor da solução estrutural.

## 7. Analista e matriz

O Analista verifica independentemente a cobertura da v1 pela v2 e depois audita os pareceres e a matriz. Modernizações materiais devem preservar o mesmo resultado funcional e apresentar justificativa técnica suficiente.

A matriz mantém a rastreabilidade entre origem, classificação, tratamento, localização e evidência dos acréscimos técnicos, além do tratamento dos updates quando aplicável.

Depois que o Executor declarar a entrega completa, nenhum modo do Analista deste processo é acionado. O ciclo seguinte passa a ocorrer entre humano, Estrategista e Executor, preservando a matriz até a decisão final do recorte.

Quando o Estrategista declarar o recorte definitivamente concluído, a matriz deve ser removida do tree atual, preservando a rastreabilidade no histórico Git e do PR.

## 8. Git, validação e parada

O fluxo normal usa uma branch e um PR draft contra `main`; não edita `main`, não cria PR empilhado e não faz merge. As validações seguem `AGENTS.md` e as skills de execução.

Parar somente por fonte obrigatória ausente, handoff incompleto, investigação necessária, mudança real de produto ou escopo, decisão material sem autoridade ou teste humano indispensável.

## 9. Fontes de verdade

- `.codex/agents/*.toml`: competência e critérios dos especialistas e do Analista.
- `.agents/skills/lp-factory-*/SKILL.md`: preparação, roteamento, gates e limites operacionais.
- `README.md`: política tecnológica.
- `AGENTS.md`: regras de execução, Git, publicação e validação.
- `docs/base-tecnica.md`: boundaries, adapters, camadas, segurança e convenções técnicas.
- documentos canônicos do caso: requisitos e estado do produto.

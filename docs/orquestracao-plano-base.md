# Orquestração de planos-base no Codex

Data: 20/07/2026
Versão: v0.7
Status: Fluxo de plano integrado e fluxo de execução end-to-end definidos; teste da execução por subseção pendente.

## 1. Objetivo e função deste documento

Este documento define o planejamento conceitual e técnico da orquestração de planos-base do LP Factory 10 no Codex App.

Seu objetivo é estabelecer, antes da implementação, um contrato humano verificável para o fluxo que:

1. recebe um plano-base v1;
2. coordena as avaliações dos especialistas aplicáveis;
3. orienta o orquestrador a transformar o plano-base v1 em v2 e registrar uma matriz de consolidação dos pareceres;
4. entrega v1 e v2 ao Analista para avaliação independente e, depois, entrega pareceres e matriz para auditoria da consolidação;
5. conduz a execução de uma subseção canônica por vez, na mesma branch e PR de implementação;
6. devolve cada checkpoint e a entrega final ao Analista antes do avanço ou merge;
7. interrompe o fluxo nos pontos que exigem decisão humana ou teste humano;
8. permite retomar a mesma frente sem merge entre subseções.

O resultado esperado é reduzir coordenação manual e cópia de contexto entre tarefas, sem transferir ao Codex decisões que pertencem ao humano e sem permitir que agentes especializados alterem o repositório.

Este documento será a fonte humana do desenho aprovado. A skill executará o workflow definido aqui; cada custom agent aplicará seu contrato runtime; e o task principal permanecerá responsável pela coordenação, pelas alterações no repositório e pela entrega ao humano.

O teste estrutural isolado da seção 2 foi validado. Os contratos do Gestor Estrutural e do Analista foram otimizados após o primeiro teste integrado. O Gestor de Updates agora integra o fluxo, que permanece pendente de reteste completo.

## 2. Primeiro passo: teste do Gestor Estrutural

O primeiro passo será um teste mínimo do fluxo de delegação, limitado ao Gestor Estrutural. O objetivo é validar a comunicação entre o task principal e um custom agent antes de criar a orquestração completa.

### 2.1 Entrada do teste

O humano informará no task principal:

- o número ou a URL do PR que contém o plano-base v1;
- o pedido explícito de avaliação estrutural.

A skill deverá confirmar o repositório, a base, o head, o estado e os arquivos do PR. Quando houver exatamente um arquivo `docs/lousa-plano-base-*.md`, seu path e seu caso poderão ser resolvidos automaticamente. Se nenhum plano ou mais de um plano for identificado, o fluxo deverá parar e pedir o path exato.

O primeiro teste usará como fonte a versão do plano existente no head do PR, sem trocar a branch da worktree de orquestração. Pareceres de outros especialistas e intervenção do Analista não serão exigidos neste recorte.

### 2.2 Componentes do teste

Foram criados neste primeiro corte somente:

1. o custom agent `gestor-estrutural`, configurado em `.codex/agents/gestor-estrutural.toml`;
2. a skill `lp-factory-avaliar-plano-estrutura`, localizada em `.agents/skills/lp-factory-avaliar-plano-estrutura/`.

O custom agent definirá o papel especializado. A skill definirá o disparo, o contexto mínimo, a espera pela conclusão e a devolução do parecer ao task principal.

### 2.3 Sequência do teste

1. O humano informa o número ou a URL do PR e solicita a avaliação estrutural.
2. A skill consulta o PR e confirma repositório, base, head, estado e arquivos alterados.
3. A skill identifica um único plano-base ou pede seu path quando a identificação for ambígua.
4. A skill obtém o conteúdo integral do plano no head do PR e confirma o caso ou recorte declarado no arquivo.
5. O task principal inicia o custom agent `gestor-estrutural` e entrega os metadados do PR, o path e o conteúdo do plano.
6. O custom agent aplica o contrato runtime de `.codex/agents/gestor-estrutural.toml`.
7. O custom agent consulta somente as fontes competentes necessárias ao escopo da avaliação.
8. O custom agent avalia o plano em modo read-only e devolve o parecer ao task principal.
9. O task principal apresenta o parecer completo ao humano e confirma se houve alteração no repositório.
10. O humano e o task principal avaliam a qualidade do primeiro handoff antes de ampliar o workflow.

### 2.4 Contrato do Gestor Estrutural

O custom agent deverá:

- usar `.codex/agents/gestor-estrutural.toml` como contrato runtime único de sua especialidade;
- confirmar no repositório os paths e artefatos relevantes;
- permanecer limitado a estrutura, boundaries, reaproveitamento, adapters, acoplamento, regressão, impacto em repositório ou banco e aderência às fontes competentes;
- informar exatamente qual fonte falta quando não houver evidência suficiente;
- não editar arquivos, criar commits, publicar branches ou ampliar o escopo;
- distinguir patch autossuficiente, investigação factual e decisão humana material;
- entregar, em `requer patch estrutural`, o tratamento exato que o orquestrador aplicará sem nova escolha técnica.

### 2.5 Saída esperada

O parecer devolvido ao task principal deverá conter, no mínimo:

- identificação do plano e do caso avaliados;
- fontes consultadas;
- conclusão estrutural;
- achados objetivos;
- condicionantes ou investigações necessárias;
- patches estruturais autossuficientes, quando aplicáveis, sem implementação;
- decisão humana exata e opções válidas, quando as fontes não determinarem uma única solução;
- riscos ou conflitos com fontes competentes;
- próximo passo mínimo e seguro.

O resultado deverá aparecer no task principal. O thread individual do subagent deverá permanecer disponível no Codex App para inspeção do trabalho realizado.

### 2.6 Critérios de sucesso

O teste será considerado bem-sucedido quando:

- a skill acionar o custom agent correto;
- o agente avaliar o arquivo indicado, sem confundir caso, branch ou path;
- o parecer cumprir o contrato runtime do custom agent;
- nenhuma alteração for feita no repositório pelo custom agent;
- o parecer completo for visível no task principal;
- o resultado for suficientemente claro para ser usado, em uma etapa futura, pelo Analista;
- falhas, lacunas ou ambiguidades do handoff forem identificadas para correção antes da ampliação do workflow.

### 2.7 Escopo negativo deste passo

Este primeiro teste não inclui:

- Gestor de Updates;
- Gestor de Automações;
- Analista;
- consolidação do plano-base v2;
- edição do plano-base;
- execução de fase;
- criação ou revisão de PR de implementação;
- agenda, monitoramento ou retomada automática;
- definição final do workflow completo.

O teste foi executado em 17/07/2026 com o plano-base do PR #577. O parecer foi devolvido ao task principal em modo read-only, a qualidade foi comparada com a avaliação corrente e o humano aprovou a expansão controlada para o Analista antes da inclusão dos demais especialistas.

## 3. Segundo passo: teste do Analista sobre a v2

O segundo passo valida o Analista como gate de qualidade depois que o orquestrador consolida o parecer estrutural e produz o plano-base v2. Este recorte não inclui os demais especialistas nem a revisão de implementação.

### 3.1 Separação de responsabilidades

- o Gestor Estrutural emite o parecer dentro de sua competência;
- o orquestrador produz a v2, classifica cada achado e registra a matriz de consolidação;
- o Analista avalia a v2 de forma independente e depois audita a incorporação do parecer;
- o orquestrador executa as correções;
- o humano decide conflitos materiais e autoriza o merge pelo GitHub Web.

O Analista não consolida nem edita o plano e não substitui o especialista.

### 3.2 Componentes implementados

1. `.codex/agents/analista.toml`, contrato runtime único do custom agent read-only configurado com GPT-5.6 Sol e inteligência alta;
2. `.agents/skills/lp-factory-avaliar-plano-analista/`, skill de preparação, validação da matriz, delegação sequencial e devolução do parecer.

### 3.3 Entradas do teste

O orquestrador deve possuir:

- versão imutável e conteúdo integral da v1;
- versão imutável e conteúdo integral da v2;
- plano conceitual, quando existir, ou declaração explícita de `N/A`;
- decisões humanas registradas aplicáveis;
- parecer integral do Gestor Estrutural;
- matriz de consolidação conforme a skill `lp-factory-avaliar-plano-analista`;
- caso, roadmap, casos adjacentes e fontes técnicas aplicáveis.

### 3.4 Duas passagens no mesmo Analista

1. A skill inicia um único custom agent `analista` sem herdar turnos do task principal que possam expor os pareceres ou a matriz.
2. Na primeira passagem, entrega v1, v2, plano conceitual, caso e fontes competentes, sem parecer ou matriz.
3. O Analista registra sua avaliação independente e a devolve ao task principal.
4. A skill continua no mesmo thread do subagent e somente então entrega parecer estrutural e matriz.
5. O Analista preserva a primeira passagem e audita cada tratamento contra o parecer e a v2.
6. O Analista devolve a conclusão final e as correções, rodadas especializadas ou decisões humanas necessárias.
7. O task principal apresenta as duas passagens integralmente e confirma o estado Git.

Se o parecer ou a matriz forem expostos antes da primeira conclusão, a avaliação independente é considerada contaminada e deve ser reiniciada sem esses artefatos.

### 3.5 Gate e ciclo de correção

As conclusões permitidas são:

- `aprovado para merge do plano-base v2`;
- `aprovado com correções obrigatórias`;
- `requer nova rodada especializada`;
- `bloqueado por decisão humana`.

Somente a primeira libera o pedido de merge. Nas demais, o orquestrador corrige ou encaminha a pendência e devolve o delta ao Analista. Não há retorno padrão ao Gestor Estrutural: ele só é reacionado se a v2 introduzir questão material não coberta pelo parecer original ou se o Analista identificar explicitamente essa novidade.

### 3.6 Critérios de sucesso

O teste será aprovado quando:

- a primeira passagem ocorrer sem acesso aos pareceres ou à matriz;
- o mesmo Analista receber a segunda passagem;
- a avaliação cobrir plano conceitual quando existente, v1, v2, roadmap, casos adjacentes, escopo, suficiência e riscos;
- cada achado estrutural for rastreado e auditado;
- o Analista não refizer o parecer nem editar o repositório;
- a conclusão formal e o próximo passo forem inequívocos;
- o resultado permitir ao orquestrador corrigir a v2 sem nova interpretação informal.

### 3.7 Escopo negativo

Este passo não inclui:

- Gestor de Updates;
- Gestor de Automações;
- implementação das fases;
- revisão do PR de implementação;
- alteração dos contratos dos demais especialistas antes de seus trabalhos próprios;
- merge automático ou decisão humana delegada ao Codex.

## 4. Terceiro passo: skill de orquestração integrada

O terceiro passo reúne os dois testes anteriores em uma única entrada humana. Foi criada a skill `lp-factory-orquestrar-plano`, localizada em `.agents/skills/lp-factory-orquestrar-plano/`.

Ela não cria um custom agent de orquestração. O task comum permanece como orquestrador e executor, enquanto `gestor-estrutural`, `gestor-updates` e `analista` permanecem read-only e aplicam seus contratos runtime.

### 4.1 Entrada mínima

O humano informa somente o PR que contém o plano-base v1 e invoca explicitamente a skill:

`Use $lp-factory-orquestrar-plano no PR #577.`

Paths, branches, agentes e etapas internas são resolvidos pela skill. Informação adicional só pode ser solicitada quando houver ambiguidade real que impeça selecionar o plano ou a worktree correta.

### 4.2 Destino das alterações

A skill usa uma worktree de automação previamente criada e nunca altera a `main`, a branch do processo atual ou a branch head do PR da v1.

Uma worktree só pode ser selecionada automaticamente quando estiver limpa, usar branch `codex-app/*-v2-orquestracao`, contiver o head SHA da v1 e ainda possuir o mesmo blob do plano congelado. Se não houver exatamente uma candidata, o fluxo pede somente o path correto e para.

No primeiro teste E18.5, o destino esperado é:

- worktree: `C:\Dev\GitHub\LP-Factory-10-e18-5-automacao`;
- branch: `codex-app/e18-5-v2-orquestracao`;
- fonte congelada: plano-base v1 do PR #577.

### 4.3 Sequência integrada

1. Congelar a v1 pelo head SHA e blob do PR informado.
2. Selecionar e validar a worktree de automação já existente.
3. Acionar o Gestor Estrutural e preservar o parecer integral.
4. Acionar o Gestor de Updates sobre a mesma v1 e preservar o parecer integral.
5. Aplicar os patches autossuficientes dos dois especialistas, produzir a v2 e preparar a matriz de consolidação, sem nova rodada especializada padrão.
6. Criar referência imutável da v2 e acionar o Analista sem pareceres ou matriz.
7. Depois da Passagem 1, gravar a matriz e entregá-la com os dois pareceres ao mesmo Analista.
8. Corrigir ou encaminhar pendências conforme a conclusão formal.
9. Publicar um PR draft empilhado contra a branch da v1 somente após aprovação do Analista.

A matriz não é gravada antes da Passagem 1. Isso impede que a avaliação independente seja contaminada por um arquivo acessível na própria worktree.

### 4.4 Limites do fluxo de plano integrado

Este recorte inclui Gestor Estrutural, Gestor de Updates, consolidação pelo orquestrador e gate do Analista. O Gestor de Updates consulta obrigatoriamente os quatro catálogos vigentes, mas não os mantém nem pesquisa novos updates fora deles. Gestor de Automações continua fora do fluxo até teste próprio.

O teste será considerado válido quando uma instrução humana curta produzir dois pareceres especializados rastreáveis, uma v2 rastreável, duas passagens não contaminadas do Analista e um PR filho comparável, sem alteração da v1 e sem edição feita pelos custom agents.

## 5. Quarto passo: execução end-to-end do plano aprovado

Depois da aprovação humana do plano-base v2, o mesmo task passa a atuar como executor. A skill `lp-factory-executar-plano` cria ou reutiliza uma única branch e um único PR draft para todo o recorte. Não há merge entre subseções.

### 5.1 Contrato de fases

Cada fase deve representar exatamente uma subseção executável do roadmap, identificada como `EXX.Y.Z — título`. Não são permitidos aliases ordinais como “Fase 1”, nem o agrupamento de subseções independentes. Cada aprovação de fase gera somente um checkpoint de commit com o identificador canônico; o próximo ciclo permanece na mesma branch e PR.

### 5.2 Ciclo por subseção

1. Confirmar a subseção, critérios de aceite, escopo negativo e fontes competentes.
2. Implementar somente o necessário para a subseção.
3. Executar validações automáticas aplicáveis.
4. Acionar o Analista em modo de revisão de implementação.
5. Corrigir o delta ou parar para teste humano ou decisão humana quando exigido.
6. Após `aprovado para avançar`, criar checkpoint e, no modo experimental, entregar relatório e parar; no modo end-to-end, seguir para a próxima subseção.

### 5.3 Testes, documentação e merge

Após a última subseção, o executor realiza validações integradas e solicita a revisão final do Analista. Teste humano só abre gate quando o plano ou o Analista o exigir. Em seguida, o executor aplica o delta documental canônico, pede revisão delta do Analista e atualiza o resumo do mesmo PR.

Somente a conclusão `aprovado para merge da implementação` libera o PR para decisão humana. O relatório do PR substitui o envio manual de um relatório ao Gestor de Docs.

### 5.4 Matriz de consolidação

A matriz pertence exclusivamente à etapa de revisão do plano-base v2: ela permite ao orquestrador registrar o tratamento dos pareceres e ao Analista auditar essa consolidação. Em modo experimental, fica no PR como evidência. Em modo end-to-end, é temporária, é resumida no PR e removida antes da publicação final da v2. Não há remoção agendada nem matriz durante a implementação.

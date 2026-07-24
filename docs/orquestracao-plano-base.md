# Orquestração de planos-base no Codex

Data: 23/07/2026
Versão: v0.13
Status: Fluxo end-to-end unificado até a entrega completa; avaliação pré-merge pelo Estrategista ocorre fora da automação e somente por instrução humana.

## 1. Objetivo e função deste documento

Este documento define o planejamento conceitual e técnico da orquestração de planos-base do LP Factory 10 no Codex App.

Seu objetivo é estabelecer, antes da implementação, um contrato humano verificável para o fluxo que:

1. recebe um plano-base v1;
2. coordena as avaliações dos especialistas aplicáveis;
3. orienta o orquestrador a transformar o plano-base v1 em v2 e registrar uma matriz de consolidação dos pareceres;
4. entrega v1 e v2 ao Analista para avaliação independente e, depois, entrega pareceres e matriz para auditoria da consolidação;
5. reconcilia o roadmap com a v2 aprovada e submete o delta ao mesmo Analista;
6. conduz a execução de uma subseção canônica por vez, na mesma branch e PR de implementação;
7. devolve cada checkpoint de subseção ao Analista antes do avanço e encerra sua participação quando o Executor declara a entrega completa;
8. interrompe o fluxo nos pontos que exigem decisão humana ou teste humano;
9. permite retomar a mesma frente sem repetir especialistas ou fases concluídas;
10. entrega v2, roadmap e implementação na mesma branch e no mesmo PR contra `main`.

O resultado esperado é reduzir coordenação manual e cópia de contexto entre tarefas, sem transferir ao Codex decisões que pertencem ao humano e sem permitir que agentes especializados alterem o repositório. Uma única instrução inicia o fluxo; a skill de execução é um subfluxo interno e não exige novo comando humano.

Este documento será a fonte humana do desenho aprovado. A skill executará o workflow definido aqui; cada custom agent aplicará seu contrato runtime; e o task principal permanecerá responsável pela coordenação, pelas alterações no repositório e pela entrega ao humano.

O teste estrutural isolado da seção 2 foi validado. Os contratos do Gestor Estrutural e do Analista foram otimizados, o Gestor de Updates foi integrado, o Gestor de Automações foi adicionado condicionalmente e a reconciliação planejada do roadmap foi incorporada ao fluxo da v2. A execução E18.5.3–E18.5.9 foi concluída com gates por subseção e gate final de testes. Os PRs empilhados usados nessa comparação são exceção histórica e não integram o fluxo normal.

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

No teste isolado, somente a primeira liberava o pedido de merge. No fluxo end-to-end atual, ela libera o checkpoint `plan-v2-approved` e a execução na mesma branch e PR. Nas demais conclusões, o orquestrador corrige ou encaminha a pendência e devolve o delta ao Analista.

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

## 4. Terceiro passo: skill de orquestração end-to-end

O terceiro passo reúne revisão do plano e implementação em uma única entrada humana. A skill principal é `lp-factory-orquestrar-plano`, localizada em `.agents/skills/lp-factory-orquestrar-plano/`.

Ela não cria um custom agent de orquestração. O task comum permanece como orquestrador e executor, enquanto `gestor-estrutural`, `gestor-updates`, `gestor-automacoes` e `analista` permanecem read-only e aplicam seus contratos runtime.

### 4.1 Entrada mínima

O humano informa somente o PR que contém o plano-base v1 e invoca explicitamente a skill:

`Use $lp-factory-orquestrar-plano no PR #577.`

Paths, branches, agentes e etapas internas são resolvidos pela skill. Informação adicional só pode ser solicitada quando houver ambiguidade real que impeça selecionar o plano ou a worktree correta.

Essa instrução produz a v2 e executa suas subseções. O humano não precisa invocar separadamente `lp-factory-executar-plano`.

### 4.2 Destino das alterações

A skill nunca edita diretamente a `main`, a branch do processo atual ou a branch head do PR da v1. No fluxo normal, exige a v1 já incorporada à `main`, atualiza a base e cria uma única branch contra `main`, reutilizada da produção da v2 até a conclusão da implementação.

Usar o modo simples quando não houver frente paralela. Uma worktree existente só pode ser selecionada automaticamente quando estiver limpa, usar branch `codex-app/*-orquestracao` ou `codex-app/*-v2-orquestracao` baseada na `main` competente e possuir o mesmo blob da v1 congelada. Se houver mais de uma candidata, o fluxo pede somente o path correto.

No experimento E18.5, o destino usado foi:

- worktree: `C:\Dev\GitHub\LP-Factory-10-e18-5-automacao`;
- branch: `codex-app/e18-5-v2-orquestracao`;
- fonte congelada: plano-base v1 do PR #577.

### 4.3 Sequência integrada

1. Congelar a v1 pelo head SHA e blob do PR informado e registrar snapshot imutável do roadmap já atualizado pela entrega da v1.
2. Atualizar a `main` e criar a branch da v2 no checkout simples ou selecionar uma única worktree de automação quando houver frente paralela.
3. Acionar o Gestor Estrutural e preservar o parecer integral.
4. Acionar o Gestor de Updates sobre a mesma v1 e preservar o parecer integral.
5. Acionar o Gestor de Automações somente se alguma fase estiver marcada como `Automação: sim`; caso contrário, registrar `N/A`.
6. Aplicar os patches autossuficientes dos especialistas acionados, produzir a v2 preservando a estrutura da v1 salvo alteração estrutural especializada rastreável e preparar a matriz de consolidação, sem nova rodada especializada padrão.
7. Criar referência imutável da v2 e acionar o Analista sem pareceres ou matriz.
8. Depois da Passagem 1, gravar a matriz e entregá-la com os pareceres dos especialistas acionados ao mesmo Analista.
9. Corrigir ou encaminhar pendências conforme a conclusão formal.
10. Usar `$lp-factory-abc` em modo planejamento para reconciliar o snapshot do roadmap com a v2 aprovada.
11. Submeter o roadmap resultante ao mesmo Analista em revisão delta.
12. Criar o checkpoint `LP-Factory-Stage: plan-v2-approved` com a matriz versionada e abrir um único PR draft contra `main`.
13. Invocar internamente `lp-factory-executar-plano`, sem novo comando humano, preservando branch, worktree e PR.
14. Executar todas as subseções com gates do Analista por subseção, validações integradas e eventual teste humano.
15. Declarar a entrega completa no PR, manter a matriz disponível e encerrar a automação sem revisão final do Analista.

A matriz não é gravada antes da Passagem 1. Isso impede que a avaliação independente seja contaminada por um arquivo acessível na própria worktree. Depois da Passagem 2, ela permanece versionada durante toda a implementação e disponível na entrega completa.

### 4.4 Limites do fluxo de plano integrado

Este recorte inclui Gestor Estrutural, Gestor de Updates, Gestor de Automações quando aplicável, consolidação pelo orquestrador, gates do Analista, reconciliação do roadmap e execução. O Gestor de Updates consulta obrigatoriamente os quatro catálogos vigentes, mas não os mantém nem pesquisa novos updates fora deles. O Gestor de Automações é acionado exclusivamente por `Automação: sim`, avalia somente essas fases e não pesquisa recursos sem caso concreto. Depois da v2 aprovada, os especialistas não são reacionados; mudança material é avaliada pelo Analista e, quando necessário, encaminhada ao humano.

O teste E18.5 foi considerado válido porque uma instrução humana curta produziu dois pareceres especializados rastreáveis, uma v2 rastreável e duas passagens não contaminadas do Analista, sem edição feita pelos custom agents. O PR filho usado na comparação permanece como evidência excepcional; o workflow não permite novos PRs empilhados. O modo experimental altera apenas os checkpoints e também exige a versão do plano incorporada à `main` antes de qualquer mutação.

### 4.5 Entidades do Gestor de Automações

1. `.codex/agents/gestor-automacoes.toml`: contrato runtime read-only, baseado na governança de `docs/gestor-automations.md`.
2. `.agents/skills/lp-factory-avaliar-plano-automacoes/`: seleção das fases aplicáveis, delegação, validação e devolução do parecer.
3. `.agents/skills/lp-factory-orquestrar-plano/SKILL.md`: gatilho condicional, consolidação e encaminhamento ao Analista.

Aprovação humana operacional indicada pelo especialista vira requisito do plano e não interrompe automaticamente a orquestração. Escolhas materiais são registradas para avaliação do Analista, que decide se existe bloqueio humano.

### 4.6 Preservação da v1 e reconciliação do roadmap

A v2 mantém ordem, seções, hierarquia e granularidade da v1. Criar ou consolidar seção exige parecer especializado com achado e patch autossuficiente rastreados na matriz.

Depois de `aprovado para merge do plano-base v2`, o orquestrador usa:

1. a v2 aprovada como `RELATÓRIO`;
2. o snapshot imutável de `docs/roadmap.md` produzido após a v1;
3. `$lp-factory-abc` em modo planejamento, regida por `docs/prompt-abc.md` e `docs/template-roadmap.md`.

O menor delta pode registrar somente estrutura do recorte, identificadores, títulos, objetivos, status planejado ou definido, limites, decisões futuras aprovadas e dependências indispensáveis. Não registra implementação, banco, migrations, arquivos, updates, evidências, comandos, PRs ou histórico operacional e não altera outros documentos canônicos.

O mesmo Analista recebe v2, snapshot, ABC e roadmap resultante em `revisao_delta`. A implementação só é liberada após confirmação de alinhamento, inclusive quando o ABC concluir `SEM ALTERAÇÕES NECESSÁRIAS`. No fluxo normal, o PR único acumula plano-base v2, roadmap, matriz e implementação até o gate final.

## 5. Quarto passo: execução end-to-end do plano aprovado

Depois do checkpoint aprovado do plano-base v2, o mesmo task passa a atuar como executor. A skill `lp-factory-executar-plano` é invocada internamente e reutiliza a mesma branch e o mesmo PR draft contra `main`; a v2 não precisa de merge intermediário. Em uso independente, essa skill continua exigindo uma v2 já incorporada à `main`. Não há PR empilhado, segundo PR ou merge entre subseções.

### 5.1 Contrato de fases

Cada fase deve representar exatamente uma subseção executável do roadmap, identificada como `EXX.Y.Z — título`. Não são permitidos aliases ordinais como “Fase 1”, nem o agrupamento de subseções independentes. Cada aprovação de fase gera somente um checkpoint de commit com o identificador canônico; o próximo ciclo permanece na mesma branch e PR.

### 5.2 Ciclo por subseção

1. Confirmar a subseção, critérios de aceite, escopo negativo e fontes competentes.
2. Implementar somente o necessário para a subseção.
3. Executar `npm ci` uma vez por lote contínuo quando o lockfile e as dependências não mudarem, além das validações automáticas aplicáveis a cada subseção.
4. Acionar o Analista em modo de revisão de implementação com a matriz e os pareceres nela referenciados pertinentes à subseção.
5. Corrigir o delta ou parar para teste humano ou decisão humana quando exigido.
6. Após `aprovado para avançar`, criar checkpoint, atualizar título e resumo do mesmo PR e, no modo experimental, parar somente no checkpoint solicitado; no fluxo normal end-to-end, seguir para a próxima subseção.

### 5.3 Testes, documentação e merge

Após a última subseção, o Executor realiza validações integradas e avalia explicitamente a necessidade de teste humano. Quando o teste humano for `N/A`, registra a justificativa.

Depois dos testes, o Executor atualiza o PR, declara a entrega completa e para. A automação não aciona o Estrategista nem faz handoff: o humano instrui o mesmo Estrategista, que acessa diretamente o repositório e devolve seu relatório ao humano. Se o humano encaminhar correções ao Executor, ele aplica o delta, atualiza a entrega e para novamente; o Estrategista reavalia somente por nova instrução humana.

Depois da entrega completa, nenhum modo do Analista deste processo pode ser acionado. O ciclo pré-merge ocorre exclusivamente entre o humano, o Estrategista e o Executor até a solução dos problemas apontados.

### 5.4 Matriz de consolidação

A matriz nasce na revisão do plano-base v2 e permanece como artefato temporário de rastreabilidade durante toda a implementação e na entrega completa. O Analista a recebe somente nos gates por subseção, junto aos pareceres pertinentes, sem reabrir decisões especializadas já aprovadas. Sua remoção pode ocorrer depois, por instrução humana decorrente da avaliação do Estrategista; não gera novo gate do Analista, e o histórico dos commits preserva a evidência auditável.

### 5.5 Retomada sem repetição

O task determina o estágio por evidências do mesmo PR e pelos trailers:

- `LP-Factory-Stage: plan-v2` — v2 produzida, ainda em gates documentais;
- `LP-Factory-Stage: plan-v2-approved` — v2 e roadmap aprovados, liberar execução;
- `LP-Factory-Phase: <identificador>` — subseção implementada e aprovada.

Pareceres completos podem ser reutilizados somente para o mesmo blob da v1. Havendo checkpoint inequívoco, o fluxo retoma no próximo gate ou subseção e não reinicia especialistas por precaução.

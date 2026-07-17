# Orquestração de planos-base no Codex

Data: 17/07/2026
Versão: v0.1
Status: planejamento em construção; primeiro teste implementado e ainda não validado em execução real.

## 1. Objetivo e função deste documento

Este documento define o planejamento conceitual e técnico da orquestração de planos-base do LP Factory 10 no Codex App.

Seu objetivo é estabelecer, antes da implementação, um contrato humano verificável para o fluxo que:

1. recebe um plano-base v1;
2. coordena as avaliações dos especialistas aplicáveis;
3. entrega o plano e os pareceres ao Analista para consolidação;
4. orienta a transformação do plano-base v1 em v2;
5. conduz a execução de uma fase por vez;
6. devolve o PR da implementação ao Analista antes do merge;
7. interrompe o fluxo nos pontos que exigem decisão humana;
8. permite retomar a mesma frente após cada decisão ou merge.

O resultado esperado é reduzir coordenação manual e cópia de contexto entre tarefas, sem transferir ao Codex decisões que pertencem ao humano e sem permitir que agentes especializados alterem o repositório.

Este documento será a fonte humana do desenho aprovado. A futura skill executará o workflow definido aqui; os custom agents aplicarão os contratos de seus documentos correspondentes; e o task principal permanecerá responsável pela coordenação, pelas alterações no repositório e pela entrega ao humano.

Enquanto o status permanecer `planejamento em construção`, o workflow completo não deve ser tratado como capacidade implementada ou fluxo operacional adotado. O primeiro teste descrito na seção 2 permanece experimental até sua validação em execução real.

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
6. O custom agent lê `docs/gestor-estrutural.md` antes de avaliar o plano.
7. O custom agent consulta somente as fontes competentes necessárias ao escopo da avaliação.
8. O custom agent avalia o plano em modo read-only e devolve o parecer ao task principal.
9. O task principal apresenta o parecer completo ao humano e confirma se houve alteração no repositório.
10. O humano e o task principal avaliam a qualidade do primeiro handoff antes de ampliar o workflow.

### 2.4 Contrato do Gestor Estrutural

O custom agent deverá:

- usar `docs/gestor-estrutural.md` como contrato obrigatório de sua especialidade;
- confirmar no repositório os paths e artefatos relevantes;
- permanecer limitado a estrutura, boundaries, reaproveitamento, adapters, acoplamento, regressão, impacto em repositório ou banco e aderência às fontes competentes;
- informar exatamente qual fonte falta quando não houver evidência suficiente;
- não editar arquivos, criar commits, publicar branches ou ampliar o escopo;
- devolver uma conclusão compatível com as classificações previstas em `docs/gestor-estrutural.md`.

### 2.5 Saída esperada

O parecer devolvido ao task principal deverá conter, no mínimo:

- identificação do plano e do caso avaliados;
- fontes consultadas;
- conclusão estrutural;
- achados objetivos;
- condicionantes ou investigações necessárias;
- patches estruturais recomendados, quando aplicáveis, sem implementação;
- riscos ou conflitos com fontes competentes;
- próximo passo mínimo e seguro.

O resultado deverá aparecer no task principal. O thread individual do subagent deverá permanecer disponível no Codex App para inspeção do trabalho realizado.

### 2.6 Critérios de sucesso

O teste será considerado bem-sucedido quando:

- a skill acionar o custom agent correto;
- o agente avaliar o arquivo indicado, sem confundir caso, branch ou path;
- o parecer refletir os critérios de `docs/gestor-estrutural.md`;
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

Somente após a avaliação humana desse teste será decidido se o mesmo padrão deve ser aplicado aos demais especialistas e incorporado à skill de orquestração completa.

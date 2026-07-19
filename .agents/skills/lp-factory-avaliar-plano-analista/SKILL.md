---
name: lp-factory-avaliar-plano-analista
description: Avaliar um plano-base v2 do LP Factory 10 com o custom agent analista, primeiro de forma independente e depois auditando a matriz de consolidação e os pareceres dos especialistas. Usar quando o orquestrador já tiver produzido uma v2 a partir de uma v1 e precisar do gate do Analista antes do merge do plano.
---

# Avaliar a consolidação do plano-base v2

Executar duas passagens sequenciais com uma única instância do custom agent `analista`: uma avaliação independente da v2 e, somente depois, uma auditoria da consolidação dos pareceres.

## Entrada obrigatória

Obter antes da delegação:

- repositório e caso ou recorte;
- referência imutável, path e conteúdo integral do plano-base v1;
- referência imutável, path e conteúdo integral do plano-base v2;
- plano conceitual aplicável, com path e conteúdo, ou declaração explícita de que não existe;
- decisões humanas ou debate do caso que tenham sido registrados como fonte do plano, quando existirem;
- parecer completo de cada especialista incluído na consolidação;
- matriz de consolidação produzida pelo orquestrador.

Neste primeiro recorte, exigir somente o parecer do Gestor Estrutural. Não exigir Gestor de Updates nem Gestor de Automações.

Se v1 e v2 estiverem no mesmo path, diferenciá-las por commits, head SHAs ou outras referências imutáveis. Não comparar duas leituras do mesmo branch tip como se fossem versões diferentes.

Se faltar entrada obrigatória, parar e pedir exatamente o artefato ausente. Não reconstruir parecer, matriz, decisão humana ou versão histórica por inferência.

## Preparação das fontes

1. Confirmar worktree, branch, repositório e estado Git atual.
2. Resolver as referências da v1 e da v2 sem trocar a branch da worktree de orquestração.
3. Quando uma versão estiver em PR ou commit, obter o arquivo pelo SHA correspondente, nunca pela versão local ou pela `main` por conveniência.
4. Confirmar que v1 e v2 pertencem ao mesmo caso e identificar divergências de path ou recorte.
5. Identificar a seção competente de `docs/roadmap.md`, os casos adjacentes relevantes e as fontes técnicas necessárias ao recorte.
6. Tratar o plano conceitual como `N/A` somente quando sua inexistência tiver sido declarada ou confirmada. Não escolher um documento conceitual apenas por semelhança.
7. Ler `docs/analista.md` e validar a matriz conforme o contrato definido nesse documento.
8. Registrar o estado Git anterior à delegação.

## Passagem 1 — avaliação independente

1. Iniciar exatamente um subagent usando o custom agent `analista`, sem herdar turnos do task principal (`fork_turns=none`, quando esse controle estiver disponível).
2. Informar que o modo é `passagem_independente`.
3. Entregar somente:
   - metadados e conteúdo integral da v1;
   - metadados e conteúdo integral da v2;
   - plano conceitual ou `N/A`;
   - decisões humanas registradas aplicáveis;
   - caso, seção do roadmap, casos adjacentes e fontes técnicas necessárias;
   - pedido de avaliação do plano completo;
   - proibição de editar ou implementar.
4. Não entregar, citar, resumir nem deixar acessíveis por prompt, turnos herdados ou anexos da primeira passagem os pareceres dos especialistas ou a matriz de consolidação.
5. Aguardar a resposta do Analista e preservar integralmente o resultado como `Passagem 1`.
6. Se o agente informar que recebeu parecer ou matriz antes de concluir, classificar a passagem como contaminada e reiniciar com uma nova instância sem esses artefatos.

## Passagem 2 — auditoria da consolidação

1. Continuar no mesmo thread do subagent que concluiu a Passagem 1; não iniciar outro Analista.
2. Informar que o modo agora é `auditoria_consolidacao`.
3. Entregar o parecer estrutural completo e a matriz de consolidação sem reescrever ou resumir seus achados.
4. Exigir a auditoria de cada linha da matriz contra o parecer e contra a solução efetivamente registrada na v2.
5. Proibir a alteração retroativa da Passagem 1. Novos achados devem aparecer separadamente como resultado da auditoria.
6. Exigir uma das conclusões formais previstas em `docs/analista.md`.
7. Aguardar a conclusão final do mesmo subagent.

## Devolução ao task principal

Apresentar sem reescrever:

1. a Passagem 1 completa;
2. a Passagem 2 completa;
3. a conclusão final do Analista;
4. as correções obrigatórias e seus alvos na v2;
5. os pontos que exigem nova rodada especializada ou decisão humana;
6. um resumo operacional informando agente acionado, versões avaliadas, pareceres auditados e estado Git final.

Conferir novamente o estado Git e distinguir alterações preexistentes de qualquer mudança ocorrida durante a delegação.

Se a saída obrigatória ou a conclusão formal estiver ausente, apresentar o resultado recebido e classificar o handoff como incompleto. Não completar o parecer em nome do Analista.

## Revisão de correções

Quando o orquestrador corrigir a v2:

1. usar o modo `revisao_delta` no mesmo Analista quando o thread ainda estiver disponível;
2. entregar o diff ou as versões anterior e corrigida, além da lista de correções solicitadas;
3. exigir nova rodada do especialista competente antes do Analista quando a correção alterar materialmente uma conclusão especializada;
4. permitir o gate de merge somente após a conclusão `aprovado para merge do plano-base v2`.

## Limites

- Não editar v1, v2, matriz ou pareceres.
- Não criar commits, branches ou PRs.
- Não consolidar a v2 em nome do orquestrador.
- Não refazer a avaliação especializada.
- Não acionar Gestor de Updates ou Gestor de Automações neste primeiro recorte.
- Não avaliar implementação ou PR de código nesta etapa.
- Não autorizar merge quando houver correção obrigatória, nova rodada especializada ou decisão humana pendente.

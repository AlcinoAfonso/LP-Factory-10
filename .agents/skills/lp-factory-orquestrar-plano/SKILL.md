---
name: lp-factory-orquestrar-plano
description: Orquestrar a produção e o gate de um plano-base v2 do LP Factory 10 a partir de uma v1 já incorporada à main, usando o Gestor Estrutural, o Gestor de Updates, o Gestor de Automações quando aplicável e o Analista. Usar quando o humano informar o PR ou path da v1 e pedir para executar, orquestrar ou automatizar a revisão do plano.
---

# Orquestrar plano-base v2

Conduzir o primeiro fluxo integrado de revisão do plano-base. Manter o task principal como orquestrador e executor; usar os custom agents somente para avaliações read-only.

## Entrada humana

Aceitar como comando suficiente o número, a URL do PR ou o path da v1, por exemplo:

`Use $lp-factory-orquestrar-plano no PR #577.`

Usar o fluxo normal por padrão. Nele, exigir que a v1 esteja na `main` atualizada e publicar a v2 em uma única branch e PR contra `main`.

Aceitar `modo experimental` somente quando explícito e apenas para controlar checkpoints. Se a v1 ainda não estiver na `main`, limitar-se à avaliação read-only e parar; qualquer mutação exige primeiro sua incorporação à `main`. Nunca criar PR empilhado.

Não exigir do humano nomes de agentes, paths, branches, matriz ou etapas internas. Pedir informação adicional somente diante de ambiguidade que impeça selecionar com segurança o plano ou a worktree de destino.

## Fontes obrigatórias

Antes de executar:

1. Ler `docs/orquestracao-plano-base.md`.
2. Ler e seguir `.agents/skills/lp-factory-avaliar-plano-estrutura/SKILL.md` na delegação estrutural.
3. Ler e seguir `.agents/skills/lp-factory-avaliar-plano-updates/SKILL.md` na avaliação de updates.
4. Ler e seguir `.agents/skills/lp-factory-avaliar-plano-automacoes/SKILL.md` quando alguma fase estiver marcada como `Automação: sim`.
5. Ler e seguir `.agents/skills/lp-factory-avaliar-plano-analista/SKILL.md` no gate do Analista.

Não copiar nem reinterpretar os contratos canônicos desses arquivos.

## 1. Congelar a fonte v1

1. Confirmar repositório, número, URL, estado, base, head e head SHA do PR informado, quando houver.
2. Listar os arquivos do PR e selecionar automaticamente o plano somente quando houver exatamente um path compatível com `docs/lousa-plano-base-*.md`.
3. Se nenhum plano ou mais de um plano for encontrado, pedir somente o path exato.
4. Obter o conteúdo integral do plano pelo head SHA do PR.
5. Registrar head SHA, blob SHA, path e caso ou recorte como referência imutável da v1.
6. No fluxo normal, confirmar que o blob congelado da v1 está incorporado à `main`; se não estiver, parar antes de qualquer mutação.
7. Não editar a branch head do PR nem alterar o PR de origem.

## 2. Selecionar a worktree de automação

O task principal pode estar aberto no projeto local padrão. Direcionar as mutações a uma branch dedicada criada a partir da `main` atualizada; nunca editar diretamente a `main`.

1. Listar as worktrees Git já registradas.
2. No fluxo normal, considerar candidatas somente worktrees:
   - limpas;
   - fora da `main`;
   - em branch compatível com `codex-app/*-v2-orquestracao`;
   - criadas ou realinhadas a partir da `main` que contém a v1 congelada;
   - cujo plano, antes das alterações, corresponda ao blob SHA congelado incorporado à `main`.
3. Selecionar automaticamente quando existir exatamente uma candidata.
4. Se não houver candidata e não existir frente paralela, usar o modo simples: atualizar `main` com `git pull --ff-only` e criar uma única branch `codex-app/<caso>-v2-orquestracao`.
5. Se houver mais de uma candidata, pedir apenas o path da worktree de automação.
6. Recusar worktree ou branch destinada ao processo atual/manual, incluindo branches compatíveis com `*-v2-processo-atual`.
7. No modo experimental com v1 ainda não incorporada à `main`, não selecionar nem criar destino mutável; exigir primeiro sua incorporação à `main`.

## 3. Preparar as fontes do caso

1. Confirmar o caso e a seção competente de `docs/roadmap.md`.
2. Identificar casos adjacentes, dependências e consumidores relevantes.
3. Identificar `docs/base-tecnica.md` e outras fontes técnicas necessárias ao recorte.
4. Obter o plano conceitual somente quando houver referência competente ou vínculo inequívoco com o caso.
5. Registrar `N/A` quando a inexistência de plano conceitual for confirmada; não escolher documento por semelhança.
6. Identificar decisões humanas registradas que sejam fontes do plano.
7. Validar que cada fase executável use exatamente o identificador da subseção do roadmap; não aceitar aliases ordinais como `Fase 1` nem agrupamento de subseções independentes.
8. Identificar se existe ao menos uma fase marcada exatamente como `Automação: sim`; essa marca é o único gatilho automático do Gestor de Automações.

Parar quando faltar uma decisão material que altere produto, escopo ou arquitetura.

## 4. Obter os pareceres especializados

### 4.1 Gestor Estrutural

1. Executar o workflow de `lp-factory-avaliar-plano-estrutura` para a v1 congelada.
2. Acionar exatamente um custom agent `gestor-estrutural` e preservar integralmente seu parecer.
3. Não realizar avaliação estrutural paralela no task principal.
4. Parar antes da v2 se o handoff estiver incompleto ou se a conclusão for `requer investigação`, `bloqueado por decisão humana` ou `rejeitado por conflito com fonte competente`.
5. Em `requer patch estrutural`, confirmar que todo achado bloqueante possui patch autossuficiente. Patch que ainda exija escolha técnica torna o handoff incompleto; o orquestrador não completa a análise.
6. Produzir a v2 quando a conclusão for `aprovado`, `aprovado com condicionantes` ou `requer patch estrutural`, mantendo cada condicionante e patch rastreável.
7. Não retornar ao Gestor Estrutural durante a consolidação. O Analista audita a incorporação. Nova rodada estrutural só é cabível se a v2 introduzir questão material não coberta pelo parecer.

### 4.2 Gestor de Updates

1. Executar o workflow de `lp-factory-avaliar-plano-updates` para a mesma v1 congelada.
2. Acionar exatamente um custom agent `gestor-updates` e preservar integralmente seu parecer.
3. Não realizar avaliação de updates paralela no task principal.
4. Parar antes da v2 se o handoff estiver incompleto ou se o veredito for `requer investigação` ou `bloqueado por decisão humana`.
5. Em `updates aplicáveis com patches autossuficientes`, confirmar que todo update aprovado possui patch completo. Patch que ainda exija interpretação ou escolha torna o handoff incompleto.
6. Produzir a v2 quando o veredito for `nenhum update aplicável` ou `updates aplicáveis com patches autossuficientes`, mantendo cada update e patch rastreável.
7. Não retornar ao Gestor de Updates durante a consolidação. Nova rodada só é cabível se a v2 introduzir questão material de updates não coberta pelo parecer.

### 4.3 Gestor de Automações

1. Se nenhuma fase estiver marcada como `Automação: sim`, registrar `N/A` e não acionar o especialista.
2. Se houver ao menos uma, executar `lp-factory-avaliar-plano-automacoes` sobre a mesma v1 congelada, entregando o plano completo e destacando somente as fases aplicáveis.
3. Acionar exatamente um custom agent `gestor-automacoes` e preservar integralmente seu parecer.
4. Não realizar avaliação de automações paralela no task principal.
5. Parar antes da v2 somente se o handoff estiver incompleto ou se o veredito for `requer investigação factual`.
6. Em `automação aplicável com patches autossuficientes`, exigir patch completo para cada decisão aplicável.
7. Em `requer validação material pelo Analista`, preservar a pendência na v2 e na matriz; não abrir gate humano nem decidir no task principal.
8. Não retornar ao Gestor de Automações durante a consolidação. Nova rodada só é cabível se a v2 introduzir questão material de automação não coberta pelo parecer.

## 5. Produzir a v2 e a matriz

1. Editar somente o plano correspondente dentro da worktree de automação.
2. Preservar objetivo, decisões válidas e limites da v1; incorporar literalmente ou de forma inequivocamente equivalente os patches estruturais, de updates e, quando aplicável, de automações, usando somente tratamentos sustentados pelos pareceres e pelas fontes competentes.
3. Não implementar fases nem ampliar silenciosamente o escopo.
4. Preparar uma matriz com uma linha por achado estrutural, por update preliminarmente elegível e por decisão do Gestor de Automações, quando acionado, usando o contrato da skill `lp-factory-avaliar-plano-analista`.
5. Manter a matriz fora do alcance do Analista até ele concluir a Passagem 1:
   - não incluí-la no prompt ou nos turnos herdados;
   - não gravá-la na worktree antes da conclusão independente;
   - iniciar o Analista com `fork_turns=none`.
6. Validar a v2 com `git diff --check` e criar um commit de checkpoint somente com o plano-base v2.
7. Usar esse commit como referência imutável da v2 na Passagem 1.

## 6. Executar o gate do Analista

1. Executar a Passagem 1 de `lp-factory-avaliar-plano-analista` com v1, v2, plano conceitual ou `N/A`, decisões registradas e fontes do caso, sem pareceres especializados ou matriz.
2. Preservar integralmente a resposta independente.
3. Depois da Passagem 1, gravar a matriz em `docs/matriz-consolidacao-<caso>.md`, validar e criar novo checkpoint. No modo `experimental`, mantê-la como evidência; no fluxo normal, usá-la somente até a conclusão do Analista.
4. Continuar no mesmo Analista e entregar os pareceres completos do Gestor Estrutural, do Gestor de Updates e, quando acionado, do Gestor de Automações, além da matriz, para a Passagem 2.
5. Preservar integralmente a auditoria e a conclusão formal.
6. No fluxo normal, após aprovação final, resumir a rastreabilidade no PR e remover a matriz antes da publicação final; não agendar remoção posterior.

## 7. Tratar a conclusão

- `aprovado para merge do plano-base v2`: avançar para publicação.
- `aprovado com correções obrigatórias`: corrigir a v2 e a matriz, criar nova referência imutável e solicitar `revisao_delta` ao mesmo Analista.
- `requer nova rodada especializada`: retornar somente ao especialista do domínio indicado quando o Analista identificar questão material nova ou mudança fora do parecer original; nos demais casos, parar e apontar a incompatibilidade da conclusão.
- `bloqueado por decisão humana`: parar e apresentar somente a decisão necessária, sem escolher pelo humano.

Repetir o ciclo somente enquanto houver correções objetivas dentro do escopo. Não usar nova rodada especializada para revalidar patches já cobertos nem converter decisão material ausente em correção editorial.

## 8. Publicar para decisão humana

Somente após `aprovado para merge do plano-base v2`:

1. Confirmar que o diff contém apenas o plano v2 e, somente no modo `experimental`, sua matriz.
2. Verificar alterações acidentais, secrets, `.env`, banco e workflows.
3. Executar `git diff --check`; tratar `npm ci` e `npm run check` como não aplicáveis quando o diff for exclusivamente documental.
4. Commitar a versão final e publicar a branch de automação.
5. Abrir um único PR draft contra `main`; recusar qualquer base diferente de `main`. Se a criação automática não estiver disponível, entregar o link de comparação com base e head preenchidos.
6. Não fazer merge. O humano compara, decide e realiza o merge pelo GitHub Web.

## Devolução ao humano

Apresentar:

- v1 avaliada e sua referência imutável;
- worktree e branch de automação usadas;
- conclusão integral do Gestor Estrutural;
- parecer integral do Gestor de Updates;
- parecer integral do Gestor de Automações ou `N/A`;
- Passagens 1 e 2 do Analista;
- arquivos alterados;
- commits e validações;
- PR draft ou link de criação;
- eventual decisão ou bloqueio pendente.

## Limites

- Não alterar a v1 nem o PR de origem.
- Não editar ou commitar na `main`.
- Não criar PR empilhado.
- Não acionar especialistas fora do recorte.
- Não permitir que custom agents editem arquivos.
- Não executar fases do plano.
- Não avaliar implementação ou PR de código; encaminhar a execução aprovada para `$lp-factory-executar-plano`.
- Não fazer merge nem substituir decisão humana.

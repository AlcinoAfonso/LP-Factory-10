---
name: lp-factory-avaliar-plano-analista
description: Avaliar independentemente a questão recebida de V1 e V2 pelo Analista read-only; auditar incorporação de pareceres e revisar delta quando pertinente.
---

# Avaliar plano-base V2 com o Analista

Na execução, receba a chamada decidida pelo Executor (§3.2); valide a entrada sem refazer o roteamento. Consultas pré-V1 e pedidos humanos autorizados permanecem aceitos. No retorno, confira questão focal, parecer/contexto anterior, delta e evidências pertinentes.

## Preparar

1. Confirme finalidade, caso, repositório, worktree, branch e estado Git. Confira a finalidade e a questão recebida, sem reavaliar a conveniência da chamada.
2. Obtenha referências recuperáveis da V1/V2 e decisões registradas, roadmap/casos adjacentes e fontes técnicas pertinentes; mesmo path distingue versões por commits. Confirme acesso à versão indicada; leia integralmente as fontes pertinentes por referência, transportando conteúdo somente se o destinatário não conseguir resolvê-la ou se o julgamento exigir recebê-lo. Fonte mutável sem recuperação durável exige preservar antes o conteúdo aprovado indispensável, conforme 3.1 do Executor. Plano conceitual exige referência competente/vínculo inequívoco; na inexistência confirmada, use `N/A`.
3. Para auditoria de integração material, preserve pareceres integrais realmente acionados, tratamentos estruturais e confrontos pertinentes à finalidade recebida e matriz/rastreabilidade pertinente. Não exija especialista, matriz ou segunda passagem sem essa finalidade.
4. Confirme completude e identidade; fonte ausente/divergente volta como lacuna, sem reconstrução por inferência. Registre Git antes/depois.

## Avaliação independente

Inicie exatamente um subagent `analista` com `fork_turns=none`, quando disponível, em `passagem_independente`. Entregue a questão e a finalidade recebidas e somente as fontes permitidas: V1, V2, plano conceitual ou N/A, decisões, roadmap e fontes técnicas. Não entregue, cite ou exponha pareceres, confrontos ou matriz por prompt, histórico ou anexos; em contaminação, descarte a resposta e reinicie uma única instância limpa.

Preserve integralmente a avaliação e conclusão. Sem necessidade de auditoria posterior, essa avaliação suficiente libera implementação somente com `aprovado para implementar` ou a conclusão de compatibilidade abaixo.

## Auditoria da incorporação de pareceres

Somente após preservar a primeira avaliação, solicite ao Executor, único escritor, a gravação e o versionamento da matriz/rastreabilidade necessária. Receba e confira as referências imutáveis produzidas; só então continue no mesmo Analista em `auditoria_consolidacao`, disponibilizando as referências recuperáveis dos pareceres originais, confrontos aplicáveis e rastreabilidade, com acesso e leitura integral conforme a preparação, sem reescrever achados.

Confira formalmente uma linha por achado: ID, origem (V1, invariante técnico ou update), classe, tratamento, localização/evidência e destino/confronto de Updates quando aplicável. Rastreabilidade incompleta, tratamento estrutural sem evidência competente, confronto exigido pelo recorte ausente ou achado sem correspondência verificável impede o handoff; não complete a avaliação especializada. Aguarde conclusão própria do contrato `.codex/agents/analista.toml`; só com `aprovado para implementar` ou a conclusão de compatibilidade abaixo avance.

Para plano já iniciado cujo contrato vigente exija literalmente `aprovado para merge do plano-base v2`, informe essa exigência e sua referência imutável ao Analista. Receba essa conclusão somente como aprovação técnica equivalente a `aprovado para implementar`, preservando os demais checkpoints e gates técnicos exigidos pelo plano. O nome legado não autoriza merge nem recria classes de execução; não reescreva lousas ou aprovações históricas.

## Revisar correções

Em retorno de plano, use `revisao_delta` no mesmo Analista, entregando versões anterior/nova ou diff, questão do retorno, correções ou evidências solicitadas e fontes pertinentes. Confira a saída focal e seus efeitos/regressões sem completar o julgamento.

## Devolver e limites

Preserve avaliação, auditoria quando aplicável, conclusão, correções e rodadas/decisões integralmente; acrescente somente versões, fontes/pareceres/confrontos, agente e Git final. `aprovado com correções obrigatórias` exige delta; `requer julgamento especializado` devolve a questão e as evidências pendentes ao Executor, sem selecionar outra chamada; `bloqueado por decisão humana` devolve somente a decisão sem autoridade ao Executor para condução sob a autoridade concedida.

Retorno incompleto fica marcado incompleto, sem complementação pelo wrapper. Não escrever artefatos, criar branch/commit/PR, consolidar V2, refazer especialidade, acionar outro especialista ou avaliar implementação por este wrapper. Aprovação técnica permite avançar/implementar; merge exige autoridade competente e gates próprios do Executor.

---
name: lp-factory-avaliar-plano-estrutura
description: Avaliar estruturalmente um plano-base do LP Factory 10 por meio do custom agent gestor-estrutural, incluindo confronto focal de modernização material proposta pelo Gestor de Updates. Usar quando o humano ou orquestrador pedir derivação técnica, revisão estrutural ou confronto de modernização.
---

# Avaliar estrutura do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-estrutural` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar o repositório, a worktree, a branch e o estado Git atual.
2. Determinar o modo:
   - `derivacao_inicial`: padrão para avaliar a v1 completa e produzir a solução técnica mínima;
   - `confronto_modernizacao`: somente quando o orquestrador fornecer um update com impacto estrutural material, a solução técnica de referência e o parecer estrutural inicial.
3. Em `derivacao_inicial`, resolver a fonte informada sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; selecionar automaticamente apenas quando houver exatamente um `docs/lousa-plano-base-*.md`; obter seu conteúdo integral pelo head SHA;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
4. Em `confronto_modernizacao`, exigir referência imutável da mesma v1, parecer estrutural inicial, recomendação integral do update candidato, alternativa sem update e alternativa com update. Não exigir nova seleção de plano quando essas referências já vierem do orquestrador.
5. Parar e pedir somente o dado ausente se a seleção ou o confronto continuar incompleto.
6. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Iniciar exatamente um subagent `gestor-estrutural`.
2. Em `derivacao_inicial`, entregar modo, worktree, branch, metadados da fonte, path, conteúdo integral, caso e pedido de avaliação do plano completo.
3. Em `confronto_modernizacao`, entregar modo e somente o contexto necessário ao candidato: referências da v1, parecer estrutural inicial, recomendação do Gestor de Updates, solução sem update, solução com update e fontes competentes pertinentes. Não pedir nova avaliação completa.
4. Não repetir critérios estruturais no handoff: o contrato runtime está em `.codex/agents/gestor-estrutural.toml`.
5. Aguardar o parecer sem realizar avaliação estrutural paralela.
6. Em `derivacao_inicial`, validar identificação, fontes, uma conclusão permitida, derivação técnica mínima, achados rastreáveis, coesão dos adapters/boundaries tocados e próximo passo. Condicionantes devem ser acionáveis; em `requer patch estrutural`, cada achado bloqueante deve possuir patch autossuficiente; em `bloqueado por decisão humana`, devem constar decisão funcional/escopo, opções e lacuna das fontes.
7. Em `confronto_modernizacao`, validar comparação sem update × com update, impacto em adapters/boundaries/dependências, complexidade líquida, indício de impacto funcional, conclusão permitida e próximo passo.
8. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
9. Confirmar novamente o estado Git e distinguir alterações preexistentes.
10. Exibir o parecer integral, seguido apenas de modo, plano/update avaliado, conclusão, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano ou PR, criar branch/commit/PR, acionar outro especialista, consolidar v2 ou executar fases. Em confronto, não reabrir achados estruturais fora do update candidato.

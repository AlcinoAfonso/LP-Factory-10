---
name: lp-factory-avaliar-plano-estrutura
description: Avaliar estruturalmente um plano-base do LP Factory 10 por meio do custom agent gestor-estrutural. Usar quando o humano informar um PR ou path e pedir avaliação estrutural, revisão pelo Gestor Estrutural ou teste desse especialista.
---

# Avaliar estrutura do plano-base

Delegar uma avaliação read-only ao custom agent `gestor-estrutural` e devolver seu parecer integral.

## Preparar a entrada

1. Confirmar o repositório, a worktree, a branch e o estado Git atual.
2. Resolver a fonte informada sem inferir outro caso:
   - PR: confirmar número, URL, base, head, head SHA e estado; selecionar automaticamente apenas quando houver exatamente um `docs/lousa-plano-base-*.md`; obter seu conteúdo integral pelo head SHA;
   - path local: confirmar existência e coerência entre path, conteúdo e caso.
3. Parar e pedir somente o dado ausente se a seleção continuar ambígua.
4. Registrar o estado Git anterior à delegação.

## Delegar e devolver

1. Iniciar exatamente um subagent `gestor-estrutural`.
2. Entregar worktree, branch, metadados da fonte, path, conteúdo integral, caso e pedido de avaliação do plano completo.
3. Não repetir critérios estruturais no handoff: o contrato runtime está em `.codex/agents/gestor-estrutural.toml`.
4. Aguardar o parecer sem realizar avaliação estrutural paralela.
5. Validar que o parecer contém identificação, fontes, uma conclusão permitida, achados rastreáveis e próximo passo. Condicionantes devem ser acionáveis; em `requer patch estrutural`, cada achado bloqueante deve possuir patch autossuficiente; em `bloqueado por decisão humana`, devem constar decisão, opções e lacuna das fontes.
6. Se o contrato estiver incompleto, devolver o conteúdo recebido e marcar o handoff como incompleto; não completar nem reinterpretar o parecer.
7. Confirmar novamente o estado Git e distinguir alterações preexistentes.
8. Exibir o parecer integral, seguido apenas de plano avaliado, conclusão, agente acionado e confirmação de que o repositório permaneceu inalterado.

## Limites

Não editar plano ou PR, criar branch/commit/PR, acionar outro especialista, consolidar v2 ou executar fases.

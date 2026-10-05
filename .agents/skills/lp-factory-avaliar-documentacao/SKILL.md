---
name: lp-factory-avaliar-documentacao
description: Preparar reconciliação documental canônica via ABC com o custom agent gestor-documentacao read-only, quando houver documento afetado por plano, implementação ou correção.
---

# Avaliar documentação

Na execução, receba a chamada decidida pelo Executor (§3.2); valide a entrada sem refazer o roteamento. Pedidos humanos e demais entradas autorizadas fora da execução permanecem sujeitos aos contratos competentes. No retorno, confira questão focal, parecer/contexto anterior, delta e evidências pertinentes.

1. Confirme repositório, caso, referência, estado Git, documento-alvo ou triagem, fonte factual/relatório, etapa e entradas indispensáveis de `$lp-factory-abc`. Resolva fontes existentes sem completar lacuna por inferência.
2. Inicie exatamente um subagent `gestor-documentacao`. Entregue referências e conteúdos pertinentes; o contrato runtime está em `.codex/agents/gestor-documentacao.toml`, e `docs/prompt-abc.md` é a única fonte normativa de reconciliação, aplicada pelo procedimento de `$lp-factory-abc`. Não repita nem redefina no wrapper critérios, modelo, effort, sandbox ou mecanismo interno de acionamento.
3. Verifique somente completude formal: identificação, fontes, ABC integral por documento com operações executáveis ou `SEM ALTERAÇÕES NECESSÁRIAS`. Retorno incompleto volta como recebido, marcado incompleto; não gere, complete ou reinterprete a especialidade.
4. Devolva o resultado integral, identificação do agente, referências e estado Git antes/depois. O principal aplica e verifica literalmente o delta.

Não escrever arquivos, aplicar ABC, criar branch/commit/PR, acionar outra especialidade ou ampliar o recorte. Fonte indispensável ausente suspende somente a avaliação afetada.

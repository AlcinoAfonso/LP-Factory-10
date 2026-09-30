---
name: lp-factory-avaliar-documentacao
description: Preparar reconciliação documental canônica via ABC com o custom agent gestor-documentacao read-only, quando houver documento afetado por plano, implementação ou correção.
---

# Avaliar documentação

1. Confirme repositório, caso, referência, estado Git, documento-alvo ou triagem, fonte factual/relatório, etapa e entradas indispensáveis de `$lp-factory-abc`. Resolva fontes existentes sem completar lacuna por inferência.
2. Delegue uma vez a `gestor-documentacao` com referências e conteúdos pertinentes. O contrato está em `.codex/agents/gestor-documentacao.toml`; `docs/prompt-abc.md` é a única fonte normativa de reconciliação, aplicada pelo procedimento de `$lp-factory-abc`.
3. Verifique somente completude formal: identificação, fontes, ABC integral por documento com operações executáveis ou `SEM ALTERAÇÕES NECESSÁRIAS`. Retorno incompleto volta como recebido, marcado incompleto; não gere, complete ou reinterprete a especialidade.
4. Devolva o resultado integral e identificação do agente, referências e estado Git antes/depois, distinguindo configuração declarada da efetivamente observável. O principal aplica e verifica literalmente o delta.

Não escrever arquivos, aplicar ABC, criar branch/commit/PR, acionar outra especialidade ou ampliar o recorte. Fonte indispensável ausente suspende somente a avaliação afetada.

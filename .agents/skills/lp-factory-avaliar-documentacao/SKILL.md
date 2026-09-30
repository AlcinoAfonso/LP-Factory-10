---
name: lp-factory-avaliar-documentacao
description: Preparar reconciliação documental canônica via ABC com o custom agent gestor-documentacao read-only, quando houver documento afetado por plano, implementação ou correção.
---

# Avaliar documentação

1. Confirme repositório, caso, referência, estado Git, documento-alvo ou triagem, fonte factual/relatório, etapa e entradas indispensáveis de `$lp-factory-abc`. Resolva fontes existentes sem completar lacuna por inferência.
2. Delegue uma vez pelo mecanismo nativo com `agent_type="gestor-documentacao"`, fornecendo referências e conteúdos pertinentes, sem overrides de modelo, effort ou instruções. Garanta contexto efetivamente read-only; se o runtime herdar permissões do chamador, use contexto nativo read-only do mesmo projeto. Não injete manualmente instruções do TOML nem substitua o especialista por generalista. Sem confirmação do papel configurado ou do contexto read-only, suspenda somente esta avaliação. O contrato está em `.codex/agents/gestor-documentacao.toml`; `docs/prompt-abc.md` é a única fonte normativa de reconciliação, aplicada pelo procedimento de `$lp-factory-abc`.
3. Verifique somente completude formal: identificação, fontes, ABC integral por documento com operações executáveis ou `SEM ALTERAÇÕES NECESSÁRIAS`. Retorno incompleto volta como recebido, marcado incompleto; não gere, complete ou reinterprete a especialidade.
4. Devolva o resultado integral e identificação do agente, referências e estado Git antes/depois, distinguindo configuração declarada da efetivamente observável. O principal aplica e verifica literalmente o delta.

Não escrever arquivos, aplicar ABC, criar branch/commit/PR, acionar outra especialidade ou ampliar o recorte. Fonte indispensável ausente suspende somente a avaliação afetada.

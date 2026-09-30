---
name: lp-factory-avaliar-documentacao
description: Preparar reconciliação documental canônica via ABC com o custom agent gestor-documentacao read-only, quando houver documento afetado por plano, implementação ou correção.
---

# Avaliar documentação

Acione o papel pelo mecanismo nativo `collaboration.spawn_agent`, com `agent_type="gestor-documentacao"`, sem sobrescrever modelo, effort ou instruções: a configuração vem de `.codex/agents/gestor-documentacao.toml`. Confirme que o projeto autorizado está confiável e que o papel aparece no catálogo carregado; uma sessão aberta antes da criação do TOML precisa recarregar a configuração em uma nova sessão nativa.

A delegação deve ocorrer em uma sessão efetivamente read-only. Na versão que herda o sandbox do chamador, `sandbox_mode` no TOML não reduz sozinho a permissão do filho. Se o chamador tem escrita, execute este mesmo wrapper em uma sessão nativa do Codex no mesmo diretório/projeto, usando `codex exec --sandbox read-only --cd <diretorio-do-projeto> --json -` e enviando a invocação desta skill e suas entradas por stdin. Essa sessão somente delega ao papel nomeado e devolve seu retorno ao principal; não assume a execução do plano. Use a configuração e a confiança existentes do projeto; não copie instruções do TOML, crie um substituto generalista ou altere configuração global para contornar falha. Sem papel carregado ou sandbox read-only confirmado, suspenda somente esta avaliação e informe a limitação.

1. Confirme repositório, caso, referência, estado Git, documento-alvo ou triagem, fonte factual/relatório, etapa e entradas indispensáveis de `$lp-factory-abc`. Resolva fontes existentes sem completar lacuna por inferência.
2. Delegue uma vez a `gestor-documentacao` com referências e conteúdos pertinentes. O contrato está em `.codex/agents/gestor-documentacao.toml`; `docs/prompt-abc.md` é a única fonte normativa de reconciliação, aplicada pelo procedimento de `$lp-factory-abc`.
3. Verifique somente completude formal: identificação, fontes, ABC integral por documento com operações executáveis ou `SEM ALTERAÇÕES NECESSÁRIAS`. Retorno incompleto volta como recebido, marcado incompleto; não gere, complete ou reinterprete a especialidade.
4. Devolva o resultado integral e identificação do agente, referências e estado Git antes/depois, distinguindo configuração declarada da efetivamente observável. O principal aplica e verifica literalmente o delta.

Não escrever arquivos, aplicar ABC, criar branch/commit/PR, acionar outra especialidade ou ampliar o recorte. Fonte indispensável ausente suspende somente a avaliação afetada.

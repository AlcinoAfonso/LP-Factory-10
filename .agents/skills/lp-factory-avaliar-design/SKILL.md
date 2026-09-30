---
name: lp-factory-avaliar-design
description: Definir UI/UX e revisar resultado renderizado com gestor-design read-only, para nova página, interação relevante ou dúvida material de UX/UI no recorte aprovado.
---

# Avaliar Design

Acione o papel pelo mecanismo nativo `collaboration.spawn_agent`, com `agent_type="gestor-design"`, sem sobrescrever modelo, effort ou instruções: a configuração vem de `.codex/agents/gestor-design.toml`. Confirme que o projeto autorizado está confiável e que o papel aparece no catálogo carregado; uma sessão aberta antes da criação do TOML precisa recarregar a configuração em uma nova sessão nativa.

A delegação deve ocorrer em uma sessão efetivamente read-only. Na versão que herda o sandbox do chamador, `sandbox_mode` no TOML não reduz sozinho a permissão do filho. Se o chamador tem escrita, execute este mesmo wrapper em uma sessão nativa do Codex no mesmo diretório/projeto, usando `codex exec --sandbox read-only --cd <diretorio-do-projeto> --json -` e enviando a invocação desta skill e suas entradas por stdin. Essa sessão somente delega ao papel nomeado e devolve seu retorno ao principal; não assume a execução do plano. Use a configuração e a confiança existentes do projeto; não copie instruções do TOML, crie um substituto generalista ou altere configuração global para contornar falha. Sem papel carregado ou sandbox read-only confirmado, suspenda somente esta avaliação e informe a limitação.

1. Confirme modo `definicao` ou `revisao_resultado`, caso, repositório, referência, V1/V2 pertinentes, superfície/estados, estado Git e referência concreta visual/da experiência. Na revisão, exija evidência renderizada com versão e viewport; não substitua por inferência do código.
2. Nova página, interação relevante ou dúvida material aciona definição; ajuste visual já especificado pode seguir diretamente. Resultado renderizado materialmente novo permite revisão, sem tornar ambas as chamadas obrigatórias por rotina.
3. Delegue uma vez a `gestor-design`, fornecendo as entradas e `docs/design-system.md`. Critérios e entrega pertencem a `.codex/agents/gestor-design.toml`.
4. Confira somente completude: modo/caso/referências, fontes, solução ou achados com evidência, critérios, pendências, conclusão permitida e próximo passo. Devolva integralmente sem refazer, completar ou reinterpretar. Retorno incompleto permanece marcado incompleto.
5. Registre agente, configuração declarada versus observável e estado Git antes/depois. Fonte/renderização indispensável ausente é pendência; não declare revisão executada ou aprovada.

Não escrever código/arquivos, alterar Design System ou regra de negócio, criar branch/commit/PR ou produto/infraestrutura, acionar outra especialidade ou ampliar escopo.

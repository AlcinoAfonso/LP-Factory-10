---
name: lp-factory-avaliar-design
description: Definir UI/UX e revisar resultado renderizado com gestor-design read-only, para o recorte aprovado recebido.
---

# Avaliar Design

Na execução, receba a chamada decidida pelo Executor (§3.2); valide a entrada sem refazer o roteamento. Pedidos humanos e demais entradas autorizadas fora da execução permanecem sujeitos aos contratos competentes. No retorno, confira questão focal, parecer/contexto anterior, delta e evidências pertinentes.

1. Confirme modo `definicao` ou `revisao_resultado`, caso, repositório, referência, V1/V2 pertinentes, superfície/estados, estado Git e referência concreta visual/da experiência. Na revisão, exija evidência renderizada com versão e viewport; não substitua por inferência do código.
2. Confira compatibilidade do recorte com o modo recebido e completude da referência visual/da experiência.
3. Inicie exatamente um subagent `gestor-design`. Entregue referências e conteúdos pertinentes e `docs/design-system.md`; o contrato runtime está em `.codex/agents/gestor-design.toml`. Não repita nem redefina no wrapper critérios, modelo, effort, sandbox ou mecanismo interno de acionamento.
4. Confira somente completude: modo/caso/referências, fontes, solução ou achados com evidência, critérios, pendências, conclusão permitida e próximo passo. Devolva integralmente sem refazer, completar ou reinterpretar. Retorno incompleto permanece marcado incompleto.
5. Registre agente e estado Git antes/depois. Fonte/renderização indispensável ausente é pendência; não declare revisão executada ou aprovada.

Não escrever código/arquivos, alterar Design System ou regra de negócio, criar branch/commit/PR ou produto/infraestrutura, acionar outra especialidade ou ampliar escopo.

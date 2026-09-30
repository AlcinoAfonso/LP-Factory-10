---
name: lp-factory-avaliar-design
description: Definir UI/UX e revisar resultado renderizado com gestor-design read-only, para nova página, interação relevante ou dúvida material de UX/UI no recorte aprovado.
---

# Avaliar Design

1. Confirme modo `definicao` ou `revisao_resultado`, caso, repositório, referência, V1/V2 pertinentes, superfície/estados, estado Git e referência concreta visual/da experiência. Na revisão, exija evidência renderizada com versão e viewport; não substitua por inferência do código.
2. Nova página, interação relevante ou dúvida material aciona definição; ajuste visual já especificado pode seguir diretamente. Resultado renderizado materialmente novo permite revisão, sem tornar ambas as chamadas obrigatórias por rotina.
3. Delegue uma vez pelo mecanismo nativo com `agent_type="gestor-design"`, fornecendo referências e conteúdos pertinentes, sem overrides de modelo, effort ou instruções. Garanta contexto efetivamente read-only; se o runtime herdar permissões do chamador, use contexto nativo read-only do mesmo projeto. Não injete manualmente instruções do TOML nem substitua o especialista por generalista. Sem confirmação do papel configurado ou do contexto read-only, suspenda somente esta avaliação. Forneça `docs/design-system.md`; critérios e entrega pertencem a `.codex/agents/gestor-design.toml`.
4. Confira somente completude: modo/caso/referências, fontes, solução ou achados com evidência, critérios, pendências, conclusão permitida e próximo passo. Devolva integralmente sem refazer, completar ou reinterpretar. Retorno incompleto permanece marcado incompleto.
5. Registre agente, configuração declarada versus observável e estado Git antes/depois. Fonte/renderização indispensável ausente é pendência; não declare revisão executada ou aprovada.

Não escrever código/arquivos, alterar Design System ou regra de negócio, criar branch/commit/PR ou produto/infraestrutura, acionar outra especialidade ou ampliar escopo.

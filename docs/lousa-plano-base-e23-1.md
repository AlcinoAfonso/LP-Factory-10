# E23.1 — Atualização de segurança do Next.js

Status: V1 funcional aprovada no Debate 06; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 06 — Implementações transversais prioritárias — LP Factory 10](https://docs.google.com/document/d/1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs/edit), seção 10, revisão `ANLCKQkyv3QKi4d5bpXOOV2Y0qUhf7Saj7WUE5TL7hgFHMb0p-YUqtDXk6FvP28vvPyRe3DyeLE8z4WiGOXtJ6XKgTdnKRmAFOt8WY8xL0Q`, consultada em 06/09/2026.

## 1. Problema e resultado

- Problema: o Core usa uma versão do Next.js atingida pelo update crítico catalogado em `vercel#31`.
- Resultado funcional: o Core opera em versão corrigida e compatível, preservando as jornadas e os comportamentos atuais do produto.

## 2. Atores e comportamento esperado

- Atores afetados: usuários do produto, operadores e executores técnicos.
- Comportamento esperado: nenhuma nova função ou mudança visível; as jornadas existentes continuam funcionando depois da atualização e da publicação autorizada.

## 3. Limites, riscos e dependências

- Escopo negativo: não habilitar recursos opcionais do Next.js, não redesenhar arquitetura, não alterar banco e não aproveitar o recorte para modernizações.
- Risco funcional material: regressão de build, renderização, navegação, autenticação ou deploy.
- Dependências reais: stack atual do Core, integração Git/Vercel e validações vigentes do repositório.
- Não há dependência funcional de outro plano; merge e publicação seguem a autoridade definida pelo fluxo Autônomo vigente.

## 4. Posição no roadmap e fases

- Caso macro planejado: E23 — Segurança e governança transversal da plataforma.
- Plano-base: E23.1 — Atualização de segurança do Next.js.
- E23.1.1 — Objetivo e status.
- E23.1.2 — Registros do recorte quando houver entrega material.
- E23.1.3 — Atualização segura e validação do Core: entregar o Core corrigido, validado e sem alteração funcional intencional.

## 5. Classificação e automação

- Execução: Light, porque o resultado cabe na stack, nos contratos e nas validações existentes.
- Automação: não criar nova automação; usar somente CI e publicação Vercel já existentes como mecanismos operacionais do projeto.

## 6. Critérios de aceite e evidências

- A versão afetada é retirada do Core e a versão corrigida é confirmada no manifesto e no lockfile.
- As validações obrigatórias são aprovadas e o Preview hospedado permanece funcional.
- As jornadas críticas permanecem sem regressão observável.
- Evidências esperadas: diff do PR, checks aplicáveis, Preview validado e confirmação do deployment resultante após merge autorizado.

## 7. Estado da V1

- V1 funcional aprovada.
- Execução: Light.
- Supervisão: Autônomo.

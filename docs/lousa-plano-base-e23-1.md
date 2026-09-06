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

## 8. Plano-base V2 técnico mínimo

Status: derivado da V1 congelada no commit `2d8fead39de7f5e2b1361a1807e0121e704a4289`, blob `007362b087885b23240b55e429ae90258128d219`, a partir da `main` `af82e672d4f6e02edb2bfabe2bf5bed500a429ea`; pendente do gate Light do Analista antes da implementação.

### 8.1. Boundary técnico e invariantes

- Fixar somente `next` e `eslint-config-next` em `16.3.3`, mantendo-os alinhados, e regenerar `package-lock.json` com npm.
- Alterações transitivas no lockfile devem decorrer exclusivamente dessa resolução. Nenhuma outra dependência do manifesto pode mudar.
- Não alterar código funcional, rotas, banco, schema, migrations, configuração externa, `next.config.js`, automações ou workflows.
- O upgrade de segurança não autoriza habilitar Cache Components, Instant Navigations, `instant()`, `next-cache-components-optimizer`, prefetch customizado, nova política de cache/fetch ou reescrita de rotas.
- A versão `16.2.11`, embora tenha sido a correção registrada na rodada anterior de `vercel#27`, não permanece como baseline segura diante de `vercel#31`.
- `.github/workflows/upgrade-next-16-1-1.yml` é um helper manual legado com defaults obsoletos: não executá-lo, não aceitar seu lint não bloqueante como gate e não alterá-lo neste recorte.
- O build deve ser comprovado por CI ou Vercel. Conforme `AGENTS.md`, não executar `npm run build` na rotina local do sandbox.

### 8.2. E23.1.1 — Objetivo e status

- Objetivo: retirar do Core a versão Next.js afetada por `vercel#31` sem mudança funcional intencional.
- Estado inicial confirmado: `package.json` e o pacote raiz de `package-lock.json` fixam `next` e `eslint-config-next` em `16.2.11`.
- Estado-alvo: `package.json`, pacote raiz do lockfile e instalação resolvida fixam ambos em `16.3.3`, sem `16.2.11` como versão vigente do pacote Next.js.

### 8.3. E23.1.2 — Registros do recorte

- Registrar no próprio plano as referências imutáveis da V1 e da V2 Light e os updates incorporados.
- Após a entrega material e a obtenção das evidências, avaliar `docs/roadmap.md` pelo fluxo ABC para registrar apenas estado final, arquivos e validações do E23.1.
- Não alterar `docs/base-tecnica.md`, porque stack, arquitetura, política de dependências e gates vigentes permanecem inalterados.
- Não alterar `docs/platform-config.md`, porque o projeto, os ambientes, os recursos autorizados e o fluxo de Preview/Production permanecem inalterados.

### 8.4. E23.1.3 — Atualização segura e validação do Core

- Atualizar `package.json` e regenerar `package-lock.json` com npm para resolver `next@16.3.3` e `eslint-config-next@16.3.3`.
- Revisar o diff do lockfile e aceitar somente mudanças transitivas indispensáveis à resolução dessas duas dependências.
- Executar `npm ci`, confirmar a versão instalada com `npm ls next eslint-config-next --depth=0`, executar `npm run check` e `git diff --check`.
- Publicar a branch somente no gate remoto da entrega e obter os checks do mesmo head remoto.
- Validar o build pelo CI ou deployment Vercel da branch.
- No Preview hospedado do mesmo head, verificar ausência de erro visível de runtime e preservar, em desktop e mobile, a renderização e a navegação públicas, a tela de autenticação e o acesso protegido representativo. Qualquer regressão bloqueia a entrega e não autoriza mudança funcional fora do recorte.
- A execução termina após os checks, o build hospedado e o Preview do mesmo head, com entrega das evidências ao próximo gate e sem merge nesta execução.
- A confirmação do deployment de Production após merge autorizado permanece evidência pós-merge e fora da autoridade desta execução.

### 8.5. Updates e decisão de derivação

- Skill acionada: `$lp-factory-avaliar-plano-updates`, parecer read-only sobre a V1 imutável.
- Update aplicado: `vercel#31`, com versão-alvo mínima e corrigida `16.3.3` para `next` e `eslint-config-next`.
- Travas aplicadas: `vercel#29` para não habilitar capacidades opt-in e `vercel#27` para não preservar `16.2.11` como baseline segura.
- Validação incorporada: `prod#16`, limitada a smoke proporcional no Preview em desktop e mobile, sem nova automação ou instrumentação.
- Update rejeitado para este recorte: `vercel#22`, por não acrescentar prova proporcional sobre execução e jornadas.
- Não há candidato a confronto estrutural, arbitragem funcional, investigação adicional ou decisão humana.
- O risco funcional material de regressão declarado pela V1 exige avaliação independente do Analista no nível Light antes da implementação.

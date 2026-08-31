# E22.3 — Retirada controlada do Supabase Inspect MCP e infraestrutura associada

Status: plano-base v1 consolidado em 31/08/2026 após encerramento do debate humano.

Plano conceitual: N/A.

## 1. Estado e decisões fixas

### 1.1. Problema

- O `LPF Supabase Inspect MCP` foi criado como service read-only dedicado para inspeção do Supabase por consumidores externos.
- No estado atual, sua superfície funcional está sobreposta por recursos já disponíveis: plugin Supabase conectado para ChatGPT/Codex e `automations/supabase-inspect` para inspeção read-only controlada pelo projeto.
- O consumo documentado pelo Agent Builder tornou-se histórico, a integração `ChatGPT + MCP` não foi consolidada como caminho operacional e não foi identificado consumidor runtime ativo no repositório.
- O projeto Vercel `lpf-10-services` hospeda somente esse MCP e continua criando deployments cancelados para alterações sem relação com o service, ampliando manutenção e consumo de cota sem benefício atual comprovado.

### 1.2. Decisões já estabelecidas

- Tratar o recorte como continuação da E22 — retirada controlada de ativos históricos.
- Não mover o MCP para o Core.
- Não criar MCP, service, workflow, job, agente ou infraestrutura substituta.
- Preservar `automations/supabase-inspect` como inspeção read-only controlada do projeto.
- Preservar o acesso Supabase disponível por plugin conectado para operações assistidas em ChatGPT/Codex.
- Preservar os adapters e acessos Supabase próprios do Core; o runtime do produto não passa a depender de MCP.
- Se a auditoria final confirmar ausência de consumidor externo ativo que dependa especificamente do endpoint MCP, retirar o `LPF Supabase Inspect MCP`.
- Se, após essa retirada, `lpf-10-services` permanecer sem workload real, retirar também o projeto Vercel e somente as configurações externas exclusivas desse projeto.
- Não remover secrets, variáveis ou recursos compartilhados com outros consumidores; `SUPABASE_DB_URL_READONLY`, por exemplo, permanece preservada onde continuar necessária às automações GitHub existentes.
- Histórico técnico permanece no Git, PRs e migrations/documentos históricos aplicáveis; não criar arquivo ou infraestrutura de arquivo para o service retirado.

### 1.3. Evidência factual de entrada

- `services/` contém atualmente somente `services/mcp-supabase-inspect`.
- O MCP expõe quatro tools read-only: listagem de tabelas, inspeção estrutural de tabela, inspeção de RLS/policies e amostra controlada de linhas.
- `automations/supabase-inspect` permanece implementada com execução read-only, guardrails e role próprio.
- `docs/automations.md` classifica o uso no Agent Builder como validação funcional histórica e não como caminho a expandir.
- Busca no repositório não identificou consumidor runtime do endpoint do MCP fora do próprio service e referências documentais.
- A inspeção recente do projeto Vercel `lpf-10-services` não mostrou tráfego funcional de Production no período observado e mostrou deployments cancelados por Ignored Build Step em pushes sem alteração do service.

## 2. Contrato do caso

### 2.1. Resultado esperado

- Remover uma superfície operacional redundante sem alterar funcionalidade entregue ao cliente.
- Eliminar o MCP, seu runtime dedicado e sua infraestrutura externa somente depois da prova de que não existe consumidor necessário sem substituto aprovado.
- Eliminar os deployments desnecessários gerados pelo projeto `lpf-10-services` caso o projeto deixe de possuir workload real.
- Manter as capacidades necessárias de inspeção Supabase pelos mecanismos já vigentes e mais simples.

### 2.2. Critério obrigatório de retirada

- Antes de qualquer retirada externa, reconfirmar:
  - referências a endpoint, secret, projeto e implementação no repositório;
  - consumidores em workflows, automações, runtime, agentes ou integrações;
  - tráfego recente disponível do projeto Vercel;
  - inexistência de outro workload hospedado em `lpf-10-services`;
  - cobertura suficiente pelos mecanismos preservados.
- Referência documental histórica, isoladamente, não conta como consumidor ativo.
- Se surgir consumidor externo ativo sem substituto aprovado, interromper a retirada e devolver o caso ao Estrategista/humano.

### 2.3. Ativos preservados

- `automations/supabase-inspect` e seu workflow vigente.
- Plugin Supabase conectado disponível para operação assistida em ChatGPT/Codex.
- Acessos Supabase server-side próprios do Core.
- Banco, schema, migrations, RLS e policies vigentes.
- Secrets e variáveis compartilhados por consumidores ainda ativos, nos respectivos escopos.
- Histórico de implementação e decisões no Git/PRs.

### 2.4. Estado documental final

- `docs/services.md` não deve continuar apresentando o MCP retirado como service operacional.
- `docs/automations.md` deve preservar somente o que continuar relevante como histórico/aprendizado ou automação ativa, sem indicar dependência operacional inexistente.
- `docs/platform-config.md` deve refletir o estado externo efetivo após a retirada, sem manter projeto, endpoint, secret ou regra de deploy como configuração vigente se deixarem de existir.
- O fechamento documental deve usar `docs/prompt-abc.md`, com uma residência por assunto e sem reescrever histórico desnecessariamente.

## 3. Fases e próxima ação

### 3.1. E22.3.3 — Auditoria final de consumidores e gate de retirada

- Automação: não.
- Reconfirmar o inventário factual do MCP, do projeto `lpf-10-services`, dos consumidores e dos substitutos preservados.
- Exigir prova suficiente de ausência de consumidor externo necessário antes de autorizar a retirada.
- Não realizar mutação externa nesta fase se aparecer dependência material não resolvida.

### 3.2. E22.3.4 — Retirada do MCP e referências operacionais

- Automação: não.
- Remover o service e somente os consumidores/referências operacionais que ficarem sem função.
- Aplicar o menor delta documental necessário via Prompt ABC.
- Preservar automações, secrets compartilhados e contratos do Core que tenham consumidor real independente.
- Validar ausência de referências operacionais órfãs, `npm ci`, `npm run check` e `git diff --check` conforme aplicabilidade.

### 3.3. E22.3.5 — Retirada da infraestrutura Vercel sem workload

- Automação: não.
- Se `lpf-10-services` estiver vazio de workload real após a retirada do MCP, remover o projeto Vercel e suas configurações exclusivas.
- Confirmar que o Core `lp-factory-10` permanece inalterado e que o projeto removido deixa de gerar deployments.
- Registrar no estado documental canônico somente a configuração externa final efetivamente existente.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo

- Não mover o MCP para `app/api` ou qualquer outra superfície do Core.
- Não substituir o MCP por nova API, Edge Function, service, Agents SDK, workflow ou automação.
- Não converter o repositório para workspaces/monorepo por causa deste recorte.
- Não alterar banco, schema, RLS, policies, migrations ou permissões para compensar a retirada.
- Não remover `automations/supabase-inspect`.
- Não remover secrets compartilhados por automações ou consumidores preservados.
- Não ampliar a E22.3 para limpeza genérica de outros ativos não relacionados ao MCP e ao projeto `lpf-10-services`.

### 4.2. Critérios de parada

- Consumidor externo ativo sem substituto aprovado.
- Outro workload real hospedado em `lpf-10-services`.
- Dependência do Core ou de automação vigente identificada durante a auditoria.
- Necessidade de nova infraestrutura, novo boundary, mudança de segurança, banco ou produto para manter comportamento necessário.
- Qualquer um desses casos retorna ao Estrategista antes de ampliar o recorte.

# E22.3 — Retirada controlada do Supabase Inspect MCP e infraestrutura associada

Status: plano-base v2 técnico derivado em 31/08/2026 da v1 consolidada após encerramento do debate humano.

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

## 5. Plano-base v2 técnico

Status: derivado da v1 aprovada e do estado real da `main` em 31/08/2026, sem alteração do resultado funcional ou das decisões fixas.

Referências imutáveis de entrada:

- v1 incorporada: PR #867, head `1b1f23b26877e631f5925d84dbb256a6e08b4dcd`, arquivo `docs/lousa-plano-base-e22-3.md`, blob `a55434418d572e3f5dae4d2bae58cee207fb7292` em `main` no commit `85cc4f20482a5b11de52821f61b9e942e3b54547`.
- snapshot do roadmap: `docs/roadmap.md` em `main` no commit `85cc4f20482a5b11de52821f61b9e942e3b54547`, blob `74c1d7e14c3375f5ea3739085375ea96cf230494`.

### 5.1. Boundary técnico e invariantes

- A entrega é uma retirada controlada: não criar API, MCP, service, workflow, job, agente, automação, banco, migration, RLS, policy, permissão, infraestrutura ou configuração substituta.
- `services/` contém somente `services/mcp-supabase-inspect`; o único código de service a retirar é o diretório versionado `services/mcp-supabase-inspect/`, incluindo `api/mcp.js`, `README.md`, `package.json`, `package-lock.json`, `vercel.json` e o teste local.
- Preservar integralmente `automations/supabase-inspect/`, `.github/workflows/pipeline-supabase-inspect.yml`, `.github/workflows/automation-niche-runtime-tests.yml`, o uso compartilhado de `SUPABASE_DB_URL_READONLY`, os adapters do Core e o projeto Vercel `lp-factory-10`.
- `package.json` e `package-lock.json` da raiz não recebem ajuste: não há consumidor no Core nem script raiz que dependa do service retirado.
- Documentos canônicos só podem ser ajustados pelo Prompt ABC, com uma residência por assunto. A matriz de consolidação permanece versionada até o encerramento definitivo do recorte pelo Estrategista.

### 5.2. E22.3.3 — Derivação técnica da auditoria final

- Executar somente investigação read-only e registrar evidência factual por categoria: código do service, workflows, automações, runtime do Core, agentes/integrações documentados, endpoint, secret, projeto Vercel e mecanismos preservados.
- Usar busca reprodutível no repositório para `services/mcp-supabase-inspect`, `lpf-10-services`, `/api/mcp`, `LPF_MCP_SECRET` e consumidores relacionados; classificar cada ocorrência como operacional preservada, referência histórica ou referência operacional a remover.
- Reconfirmar no Vercel conectado o projeto exato pelo nome e vínculo `AlcinoAfonso/LP-Factory-10`, seu estado, deployments paginados e eventual workload real. Um deployment `READY` do próprio MCP apenas confirma que o service existe e não bloqueia isoladamente; parar se houver projeto homônimo ambíguo, outro workload, alias/tráfego funcional necessário ou outra dependência material.
- Registrar a janela temporal observada, a fonte, o filtro e a identidade do deployment/alias usados na verificação de tráfego, distinguindo probes/health checks da utilização externa necessária. Se a plataforma não fornecer evidência suficiente para essa janela, manter a retirada externa pendente.
- Classificar explicitamente `lib/openai-workloads/` e `app/admin/(protected)/workloads-openai/page.tsx` como inventário/referência do workflow GitHub preservado, não como consumidores do endpoint MCP; não removê-los.
- Reconfirmar que o projeto Core `lp-factory-10` é distinto e permanece fora do alvo. A ausência de evidência externa suficiente não autoriza inferência: mantém a retirada externa pendente.
- Reconciliar explicitamente o conflito canônico entre `docs/automations.md`, que registra o Agent Builder como validação funcional histórica, e `docs/platform-config.md`, que ainda o registra como ativo operacional dependente do endpoint MCP. Em `E22.3.3`, verificar o estado externo atual em vez de descartar essa divergência por classificação documental; até reconciliar a evidência, manter a retirada externa pendente e, se for confirmado consumidor necessário sem substituto aprovado, retornar ao Estrategista/humano sem remover o service nem prosseguir para a infraestrutura.
- Não executar mutação de código, documento ou plataforma nesta fase. O gate libera apenas o avanço para E22.3.4.

### 5.3. E22.3.4 — Retirada do service e das referências órfãs

- Após o gate de E22.3.3, excluir do Git somente os seis arquivos versionados do diretório `services/mcp-supabase-inspect/` e manter o restante de `services/` sem novo conteúdo.
- Executar ABC intermediário independente para `docs/services.md` e `docs/automations.md`, aplicando somente um estado de transição que retire o MCP do catálogo operacional e das dependências ativas, sem declarar a retirada externa do Vercel antes de ela ocorrer; preservar a automação GitHub ativa, o histórico necessário e updates não materializados como substitutos.
- Não editar diretamente `docs/platform-config.md` nesta fase: seu estado final depende da retirada externa autorizada em E22.3.5.
- Confirmar que não restam referências operacionais ao service, endpoint ou `LPF_MCP_SECRET` fora dos artefatos históricos, plano, matriz e catálogos de updates que preservem evidência histórica; não apagar histórico técnico por limpeza genérica.
- Executar `npm ci` uma vez no início do lote de código, `npm run check` após a retirada, `git diff --check` e os checks focais possíveis sem secrets. Não executar `npm run build` como rotina de check.

### 5.4. E22.3.5 — Retirada externa condicionada e consolidação

- Só depois dos checkpoints aprovados de E22.3.3 e E22.3.4, e com a confirmação de que não existe workload real, remover pelo controle Vercel autorizado somente o projeto `lpf-10-services` e suas configurações exclusivas, incluindo o secret `LPF_MCP_SECRET` e domínios/configurações vinculados ao projeto quando a própria remoção os atingir.
- Nunca remover `lp-factory-10`, `SUPABASE_DB_URL_READONLY`, secrets GitHub compartilhados, automações preservadas, configurações Supabase ou qualquer recurso fora do projeto alvo.
- Verificar após a mutação que `lpf-10-services` não está mais listado, que o endpoint e deployments do alvo deixaram de existir, que o Core continua separado e que nenhum novo deployment do projeto removido é gerado. Se a superfície autenticada de mutação não estiver disponível, registrar a pendência e não declarar a fase concluída.
- Executar ABC final independente para cada documento canônico afetado (`docs/services.md`, `docs/automations.md`, `docs/platform-config.md` e `docs/roadmap.md`); nos dois primeiros, auditar o estado de transição já aplicado e retornar `SEM ALTERAÇÕES NECESSÁRIAS` quando ele já corresponder ao estado final, aplicando delta somente se houver fato novo. Aplicar nos demais somente deltas literais e registrar exclusivamente o estado externo e documental efetivamente confirmado.
- Reexecutar as validações aplicáveis, confirmar a ausência de referências órfãs e registrar teste humano como `N/A` somente se não houver superfície funcional do produto alterada nem evidência visual necessária.

### 5.5. Critério técnico de conclusão

- O recorte só pode ser declarado completo quando os três identificadores `E22.3.3`, `E22.3.4` e `E22.3.5` tiverem checkpoints aprovados, os documentos canônicos tiverem sido atualizados por ABC, as validações aplicáveis estiverem registradas e nenhuma pendência de consumidor, workload, segurança, banco, infraestrutura ou produto permanecer.
- Qualquer descoberta material que exija substituto, novo boundary, nova arquitetura, mudança de segurança, banco, infraestrutura ou decisão de produto encerra o fluxo no ponto da descoberta e retorna ao Estrategista/humano.

# E22.3 — Retirada controlada do Supabase Inspect MCP e infraestrutura associada

Status: plano-base v2 técnico ajustado em 31/08/2026 após nova decisão humana de escopo, preservando a v1 e a ordem das fases; estado final da E22.3 registrado em 01/09/2026.

Plano conceitual: N/A.

## 1. Estado e decisões fixas

### 1.1. Problema

- O `LPF Supabase Inspect MCP` foi criado como service read-only dedicado para inspeção do Supabase por consumidores externos.
- No estado atual, sua superfície funcional está sobreposta por recursos já disponíveis: plugin Supabase conectado para ChatGPT/Codex e `automations/supabase-inspect` para inspeção read-only controlada pelo projeto.
- O workflow histórico do Agent Builder `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7` integra explicitamente o alvo de retirada controlada por decisão humana; não é consumidor necessário independente a preservar do MCP.
- O projeto Vercel `lpf-10-services` hospedava somente esse MCP; após a confirmação de ausência de workload real, foi removido manualmente em 01/09/2026.

### 1.2. Decisões já estabelecidas

- Tratar o recorte como continuação da E22 — retirada controlada de ativos históricos.
- Não mover o MCP para o Core.
- Não criar MCP, service, workflow, job, agente ou infraestrutura substituta.
- Preservar `automations/supabase-inspect` como inspeção read-only controlada do projeto.
- Preservar o acesso Supabase disponível por plugin conectado para operações assistidas em ChatGPT/Codex.
- Preservar os adapters e acessos Supabase próprios do Core; o runtime do produto não passa a depender de MCP.
- A auditoria final deve confirmar ausência de consumidor necessário independente além do workflow Agent Builder explicitamente incluído no alvo de retirada; sua mera existência não exige preservar o `LPF Supabase Inspect MCP`.
- Em E22.3.4, retirar o workflow/integração Agent Builder identificado e o MCP; a remoção manual do workflow e a retirada repo-side do MCP foram confirmadas em 01/09/2026, sem criar substituto ou preservar o MCP.
- Após essa retirada, `lpf-10-services` foi confirmado sem workload real e o projeto Vercel, seu domínio e suas configurações exclusivas foram removidos manualmente em 01/09/2026.
- Não remover secrets, variáveis ou recursos compartilhados com outros consumidores; `SUPABASE_DB_URL_READONLY`, por exemplo, permanece preservada onde continuar necessária às automações GitHub existentes.
- Histórico técnico permanece no Git, PRs e migrations/documentos históricos aplicáveis; não criar arquivo ou infraestrutura de arquivo para o service retirado.

### 1.3. Evidência factual de entrada

- Os seis arquivos versionados de `services/mcp-supabase-inspect` foram retirados do repositório no PR #868.
- O MCP expõe quatro tools read-only: listagem de tabelas, inspeção estrutural de tabela, inspeção de RLS/policies e amostra controlada de linhas.
- `automations/supabase-inspect` permanece implementada com execução read-only, guardrails e role próprio.
- `docs/automations.md` classifica o uso no Agent Builder como validação funcional histórica; a decisão humana o inclui no alvo de retirada e não autoriza tratá-lo como caminho a expandir.
- Busca no repositório não identificou consumidor runtime do endpoint do MCP fora do próprio service e referências documentais.
- A auditoria read-only do projeto Vercel `lpf-10-services` não mostrou tráfego funcional de Production no período observado nem outro workload; após a remoção, o projeto e seu domínio não aparecem mais na lista de projetos.

## 2. Contrato do caso

### 2.1. Resultado esperado

- Remover uma superfície operacional redundante sem alterar funcionalidade entregue ao cliente.
- Eliminar o MCP, seu runtime dedicado e sua infraestrutura externa somente depois da confirmação de que não existe consumidor necessário independente fora do workflow Agent Builder explicitamente incluído no alvo de retirada.
- Eliminar os deployments desnecessários gerados pelo projeto `lpf-10-services` caso o projeto deixe de possuir workload real.
- Manter as capacidades necessárias de inspeção Supabase pelos mecanismos já vigentes e mais simples.

### 2.2. Critério obrigatório de retirada

- Antes de qualquer retirada externa, reconfirmar:
  - referências a endpoint, secret, projeto e implementação no repositório;
  - consumidores em workflows, automações, runtime, agentes ou integrações;
  - tráfego recente disponível do projeto Vercel;
  - inexistência de outro workload hospedado em `lpf-10-services`;
  - cobertura suficiente pelos mecanismos preservados.
- Referência documental histórica, isoladamente, não conta como consumidor ativo; o workflow Agent Builder identificado é exceção de escopo para retirada, não consumidor necessário a preservar.
- A decisão humana de escopo integra o workflow Agent Builder identificado ao alvo de retirada e determina que E22.3.3 procure somente consumidor necessário independente fora dele.
- Se surgir consumidor externo ativo necessário, fora do workflow Agent Builder explicitamente incluído como alvo de retirada, sem substituto aprovado, interromper a retirada e devolver o caso ao Estrategista/humano.

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
- Reconfirmar por auditoria o inventário factual do MCP, do projeto `lpf-10-services`, dos consumidores independentes e dos substitutos preservados.
- Confirmar que não há consumidor necessário independente fora do workflow Agent Builder `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7`, que a decisão humana definiu como alvo de retirada; a mera existência desse workflow não bloqueia a retirada do MCP.
- O checkpoint read-only foi concluído sem mutação externa nesta fase; a retirada do workflow Agent Builder foi executada em E22.3.4, sem preservar o MCP.

### 3.2. E22.3.4 — Retirada do MCP e referências operacionais

- Automação: não.
- O workflow/integração Agent Builder `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7` foi removido manualmente em 01/09/2026.
- O service MCP e somente suas referências operacionais foram removidos no PR #868; não foi criado substituto.
- O menor delta documental necessário foi aplicado via Prompt ABC, preservando automações, secrets compartilhados e contratos do Core com consumidor real independente.
- A busca read-only final não encontrou referências operacionais órfãs fora dos documentos históricos e de governança.
- Foram executados `npm ci`, `npm run check` e `git diff --check` conforme aplicabilidade, sem gerar novo deployment.

### 3.3. E22.3.5 — Retirada da infraestrutura Vercel sem workload

- Automação: não.
- O projeto Vercel `lpf-10-services` e suas configurações exclusivas foram removidos manualmente em 01/09/2026 após a confirmação de ausência de workload real.
- A verificação read-only posterior mostrou somente o Core `lp-factory-10` e seu domínio; nenhum deployment/redeploy foi solicitado ou executado manualmente; a publicação final do commit acionou automaticamente um Preview do Core `lp-factory-10` pela integração Git/Vercel, concluído com sucesso; nenhum novo deployment adicional deve ser provocado.
- O estado documental canônico registra somente a configuração externa final efetivamente existente.

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

- Consumidor externo ativo necessário, fora do workflow Agent Builder explicitamente incluído como alvo de retirada, sem substituto aprovado.
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
- A janela temporal observada, a fonte, o filtro e a identidade do deployment/alias usados na verificação de tráfego foram registrados, distinguindo probes/health checks da utilização externa necessária; a evidência foi suficiente para a retirada final.
- Classificar explicitamente `lib/openai-workloads/` e `app/admin/(protected)/workloads-openai/page.tsx` como inventário/referência do workflow GitHub preservado, não como consumidores do endpoint MCP; não removê-los.
- Reconfirmar que o projeto Core `lp-factory-10` é distinto e permanece fora do alvo; a verificação final confirmou essa separação e sua preservação.
- O conflito canônico entre `docs/automations.md` e `docs/platform-config.md` foi reconciliado com o estado externo final: o Agent Builder permanece apenas como referência histórica, o workflow foi removido e não há dependência operacional do endpoint MCP.
- Não executar mutação de código, documento ou plataforma nesta fase. O gate libera apenas o avanço para E22.3.4.

### 5.3. E22.3.4 — Retirada do service e das referências órfãs

- Após o gate de E22.3.3, excluir do Git somente os seis arquivos versionados do diretório `services/mcp-supabase-inspect/` e manter o restante de `services/` sem novo conteúdo.
- O ABC intermediário de `docs/services.md`, `docs/automations.md` e do trecho do Agent Builder em `docs/platform-config.md` foi aplicado; o estado externo final substituiu o snapshot transitório sem apagar histórico técnico necessário.
- O bloco do projeto Vercel foi consolidado após a remoção externa; configurações exclusivas e `LPF_MCP_SECRET` não permanecem como configuração vigente.
- A busca read-only final confirmou que não restam referências operacionais ao service, endpoint ou `LPF_MCP_SECRET` fora dos artefatos históricos, plano, matriz e catálogos de updates.
- Foram executados `npm ci`, `npm run check`, `git diff --check` e os checks focais possíveis sem secrets. `npm run build` não foi executado como rotina de check.

### 5.4. E22.3.5 — Retirada externa condicionada e consolidação

- Depois dos checkpoints aprovados de E22.3.3 e E22.3.4 e da confirmação de que não existia workload real, foi removido pelo controle Vercel autorizado somente o projeto `lpf-10-services` e suas configurações exclusivas, incluindo o secret `LPF_MCP_SECRET` e o domínio vinculado quando a própria remoção os atingiu.
- Nunca remover `lp-factory-10`, `SUPABASE_DB_URL_READONLY`, secrets GitHub compartilhados, automações preservadas, configurações Supabase ou qualquer recurso fora do projeto alvo.
- A verificação read-only posterior confirmou que `lpf-10-services` não está mais listado, que seu domínio não está mais listado e que o Core continua separado; nenhum deployment/redeploy foi solicitado ou executado manualmente; a publicação final do commit acionou automaticamente um Preview do Core `lp-factory-10` pela integração Git/Vercel, concluído com sucesso; nenhum novo deployment adicional deve ser provocado.
- O ABC final independente foi aplicado aos documentos canônicos afetados (`docs/services.md`, `docs/automations.md`, `docs/platform-config.md` e `docs/roadmap.md`), registrando exclusivamente o estado externo e documental efetivamente confirmado.
- As validações aplicáveis foram reexecutadas e a busca final confirmou a ausência de referências órfãs; a evidência visual da exclusão Vercel foi registrada na matriz.

### 5.5. Critério técnico de conclusão

- O recorte só pode ser declarado completo quando os três identificadores `E22.3.3`, `E22.3.4` e `E22.3.5` tiverem checkpoints aprovados, os documentos canônicos tiverem sido atualizados por ABC, as validações aplicáveis estiverem registradas e nenhuma pendência de consumidor, workload, segurança, banco, infraestrutura ou produto permanecer.
- Qualquer descoberta material que exija substituto, novo boundary, nova arquitetura, mudança de segurança, banco, infraestrutura ou decisão de produto encerra o fluxo no ponto da descoberta e retorna ao Estrategista/humano.

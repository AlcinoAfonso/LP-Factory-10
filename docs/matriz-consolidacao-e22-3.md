# Matriz de consolidação — E22.3

## 1. Referências imutáveis

- Caso: `E22.3 — Retirada controlada do Supabase Inspect MCP e infraestrutura associada`.
- PR de origem: `#867`, mergeado em `main`.
- Branch/head do PR de origem: `docs/e22-3-retirada-supabase-inspect-mcp@1b1f23b26877e631f5925d84dbb256a6e08b4dcd`.
- Merge commit da v1: `85cc4f20482a5b11de52821f61b9e942e3b54547`.
- Plano-base v1: `docs/lousa-plano-base-e22-3.md`, blob `a55434418d572e3f5dae4d2bae58cee207fb7292`.
- Snapshot de `docs/roadmap.md`: blob `74c1d7e14c3375f5ea3739085375ea96cf230494` em `main@85cc4f20482a5b11de52821f61b9e942e3b54547`.
- Plano conceitual: `N/A`.
- Plano-base v2 inicial: `308cfe9c0b07c975c16c5496c769607edcb5253d`, blob `058fb1db3cf9dac34f8d6e88dcf67472991dbbb2`.
- V2 anterior à retomada: `dd64f6545cbb63efeb72f05d126ec9ac38899e9d`, blob `3cc9db358a8ac4b17d7c146d97cca0fe324ff6a2`.
- Nova decisão humana de escopo: 31/08/2026; workflow Agent Builder `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7` entra no alvo de retirada e não é consumidor necessário independente a preservar.
- Branch/worktree: `codex-app/e22-3-orquestracao` em `C:\Dev\GitHub\LP-Factory-10`.

## 2. Decisões e limites

- A v2 preserva o resultado funcional, as decisões fixas, a ordem `E22.3.3` → `E22.3.4` → `E22.3.5` e o escopo negativo da v1.
- A E22.3 é retirada controlada e limpeza: não cria API, MCP, service, workflow, job, agente, automação, banco, migration, RLS, policy, permissão, infraestrutura ou configuração substituta.
- `automations/supabase-inspect/`, seus workflows, `SUPABASE_DB_URL_READONLY`, adapters/acessos do Core e o projeto Vercel `lp-factory-10` permanecem preservados.
- A decisão humana específica dispensa Gestor Estrutural, Gestor de Updates e Gestor de Automação; não houve rodada substituta de especialistas.
- A decisão humana de 31/08/2026 integra o workflow Agent Builder `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7` ao alvo de retirada; E22.3.3 audita apenas consumidores necessários independentes fora dele.
- Se a ferramenta autorizada da OpenAI Platform não permitir excluir ou desativar o workflow, registrar exatamente esse bloqueio externo e continuar a retirada do MCP e das referências operacionais; a mera existência do workflow não preserva o MCP.
- Cada achado usa a origem `v1`, `invariante técnico` ou `update` e a taxonomia contratual `derivação técnica da v1`, `modernização técnica justificada` ou `ampliação de escopo`. Os cinco achados da Passagem 1 são derivações técnicas da v1; não há update aplicado, modernização técnica ou ampliação de escopo. As linhas N/A da seção 4 registram avaliações formalmente dispensadas, não achados consolidados.

## 3. Achados da Passagem 1 e tratamento na v2

Nenhum parecer especializado foi acionado. Os achados abaixo são do Analista e foram corrigidos antes da auditoria de consolidação.

| ID | Achado | Origem | Relação com o escopo | Classe contratual | Tratamento | Localização na v2 | Evidência |
|---|---|---|---|---|---|---|---|
| `AN-P1-E22.3-01` | Deployment `READY` do próprio MCP não prova consumidor ativo. | invariante técnico | Evita bloqueio falso do gate de retirada. | derivação técnica da v1 | Incorporado: só identidade ambígua, outro workload, alias/tráfego necessário ou dependência material bloqueia. | `docs/lousa-plano-base-e22-3.md` §5.2. | Passagem 1; correção no commit `dd64f654`. |
| `AN-P1-E22.3-02` | Tráfego funcional precisava de janela, fonte, filtro e identidade observáveis. | invariante técnico | Torna a prova de ausência de consumidor reproduzível. | derivação técnica da v1 | Incorporado: separar probes/health checks e manter retirada externa pendente se a evidência for insuficiente. | §5.2. | Passagem 1; correção no commit `dd64f654`. |
| `AN-P1-E22.3-03` | ABC intermediário e ABC final dos mesmos documentos poderiam duplicar a consolidação ou declarar estado externo falso. | v1 | Mantém residência documental coerente durante a transição. | derivação técnica da v1 | Incorporado: ABC intermediário aplica estado de transição; ABC final audita e retorna `SEM ALTERAÇÕES NECESSÁRIAS` quando aplicável. | §§5.3 e 5.4. | Passagem 1; correção no commit `dd64f654`. |
| `AN-P1-E22.3-04` | `lib/openai-workloads/` e `app/admin/(protected)/workloads-openai/page.tsx` são inventário/referência do workflow GitHub preservado, não consumidores do MCP. | invariante técnico | Impede remoção por correspondência textual ampla. | derivação técnica da v1 | Incorporado: ambos permanecem fora da retirada. | §5.2. | Passagem 1; correção no commit `dd64f654`. |
| `AN-P1-E22.3-05` | Cabeçalho global ainda dizia v1 apesar da seção técnica v2. | v1 | Remove ambiguidade de versão sem alterar o contrato funcional. | derivação técnica da v1 | Incorporado: status global alinhado à v2 técnica. | Cabeçalho do plano. | Passagem 1; correção no commit `dd64f654`. |
| `AN-P2-E22.3-01` | `docs/automations.md` registra o Agent Builder como histórico, enquanto `docs/platform-config.md` ainda o registra como ativo operacional dependente do endpoint MCP. | invariante técnico | Impede falso negativo no gate externo por confiar em uma única classificação documental. | derivação técnica da v1 | Reconciliado pela decisão humana: o workflow entra no alvo de retirada; E22.3.3 audita somente consumidores necessários independentes e a mera existência do workflow não preserva o MCP. | `docs/lousa-plano-base-e22-3.md` §5.2 e E22.3.3. | Nova decisão humana específica de 31/08/2026. |

## 4. Decisões de avaliação dispensadas

| ID | Origem | Achado/decisão | Classificação original | Relação com o escopo | Tratamento | Destino/localização | Evidência |
|---|---|---|---|---|---|---|---|
| `GE-E22.3-N/A` | Decisão humana | Gestor Estrutural dispensado; não reabrir o debate estrutural. | N/A | O Analista permanece como único gate autorizado. | não incorporado — justificado | N/A — nenhum parecer estrutural emitido. | Instrução humana específica para E22.3. |
| `GU-E22.3-N/A` | Decisão humana | Gestor de Updates dispensado; nenhuma modernização ou update é autorizado por inferência. | N/A | Preserva a v1 e impede expansão de escopo. | não incorporado — justificado | N/A — nenhum patch de update. | Instrução humana específica para E22.3. |
| `GA-E22.3-N/A` | Decisão humana e v1 | Todas as fases estão marcadas `Automação: não`; Gestor de Automação dispensado. | N/A | Não há automação nova no recorte. | não incorporado — justificado | Fases `E22.3.3`, `E22.3.4` e `E22.3.5`; avaliação formal N/A. | Marcadores literais da v1/v2 e instrução humana específica. |
| `H-E22.3-01` | Decisão humana específica de escopo (31/08/2026) | O workflow Agent Builder `wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7` integra a retirada controlada; não deve ser preservado como consumidor necessário do MCP. E22.3.3 confirma apenas consumidores necessários independentes; E22.3.4 retira workflow/integração, MCP e referências; E22.3.5 retira Vercel se sem workload. | N/A | Clarifica o escopo existente; não cria novo recorte nem renumera fases. | incorporado na v2, matriz e roadmap | E22.3.3, E22.3.4 e E22.3.5. | Instrução humana desta retomada. |
| `UPD-E22.3-N/A` | Processo autorizado | Não há update aprovado a aplicar nem avaliação formal de Updates a incorporar neste recorte. | N/A | A limpeza não cria arquitetura, boundary, segurança, banco ou infraestrutura nova. | não incorporado — justificado | preservar oportunidades fora deste recorte sem patch atual. | v1 aprovada, escopo negativo e decisão humana. |

## 5. Passagens e revisão delta do Analista

- Passagem 1: resposta integral preservada pelo orquestrador; conclusão inicial `aprovado com correções obrigatórias`.
- Revisão delta no mesmo Analista: resposta integral preservada; conclusão `aprovado para merge do plano-base v2` no HEAD `dd64f654`.
- Passagem 2: concluída no mesmo thread, com esta matriz e os pareceres aplicáveis (nenhum parecer especializado), sem reabrir especialistas; conclusão `aprovado com correções obrigatórias`.
- Retomada: nova decisão humana incorporou o workflow Agent Builder ao alvo de retirada e resolveu o bloqueio anterior de classificação; a revisão delta do mesmo Analista aprovou a v2 e a matriz sem correções.
- ABC do roadmap: o mesmo Analista aprovou o delta documental sem correções; a v2 ajustada permanece planejada, sem implementação ou mutação externa iniciada.

| ID | Gate | Correções/escopo auditados | Classe | Tratamento | Evidência |
|---|---|---|---|---|---|
| `AN-DELTA-E22.3-01` | `revisao_delta` | READY do próprio MCP, janela de tráfego, transição documental, inventário do Core e status global. | derivação técnica da v1 | Incorporado integralmente na v2 vigente. | Analista no mesmo thread; commit `dd64f654`. |
| `AN-P2-E22.3-02` | `revisao_delta` | Taxonomia contratual, origem dos achados e conflito documental do Agent Builder. | derivação técnica da v1 | Incorporado integralmente na v2 e na matriz; nenhuma correção restante. | Analista no mesmo thread; Passagem 2/revisão delta de 31/08/2026. |
| `H-DELTA-E22.3-01` | `revisao_delta` | Nova decisão humana sobre o workflow Agent Builder, ausência de consumidor necessário independente fora dele e mutação OpenAI condicional à ferramenta autorizada. | derivação técnica da v1 | Incorporado na v2 e na matriz; o roadmap foi atualizado pelo ABC e aprovado no mesmo gate. | Analista no mesmo thread; revisão delta de 31/08/2026; nenhuma correção restante. |
| `AN-ABC-E22.3-01` | `revisao_delta` | ABC mínimo do roadmap: v1.5.206, escopo humano incorporado, ordem E22.3.3/E22.3.4/E22.3.5 e ausência de implementação declarada. | derivação técnica da v1 | Incorporado; sem nova fase, renumeração, changelog ou remoção de mecanismos preservados. | Analista no mesmo thread; gate de consolidação documental de 31/08/2026; nenhuma correção restante. |

## 6. Travas preservadas

- Não remover `automations/supabase-inspect/`, seus workflows ou o secret `SUPABASE_DB_URL_READONLY` compartilhado.
- Não remover o projeto Vercel Core `lp-factory-10` nem qualquer recurso Supabase, GitHub ou externo fora de `lpf-10-services`.
- Não apagar referências históricas em catálogos de updates, plano, matriz ou histórico Git por limpeza genérica.
- Não avançar se surgir consumidor externo necessário independente sem substituto aprovado, outro workload no projeto alvo, dependência do Core/automação preservada ou necessidade material nova.
- Não preservar o MCP por causa da mera existência do workflow Agent Builder; se a ferramenta autorizada da OpenAI Platform não permitir a exclusão/desativação, registrar o bloqueio externo exato e continuar a retirada controlada prevista.

## 7. Próximo gate

A retomada ajustou v2, matriz e roadmap conforme a decisão humana específica, com aprovação do mesmo Analista. Após versionar e publicar a consolidação no PR #868, o próximo gate é a auditoria read-only de E22.3.3 pelo mesmo Analista, sem iniciar mutação externa ou reabrir especialistas.

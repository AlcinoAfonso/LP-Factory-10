# Matriz de consolidação — E19.5.4

## 1. Referências imutáveis

- V1: `26476a0e6caec9001aa86acfc51ba572f5d55836:docs/lousa-plano-base-e19-5-4.md`, blob `34e55f949698a778b928153feffcd9dd5a87aad4`.
- V2 inicial: `21dac97b2ae8b81f5ecb920f729b1e18ece8e765:docs/lousa-plano-base-e19-5-4.md`, blob `9e09fe1b9f850389ffe67d34d70840320609b299`.
- Roadmap-base: `26476a0e6caec9001aa86acfc51ba572f5d55836:docs/roadmap.md`, blob `6e2b1ee46fdb7902dfa4330b737d3c342f4c0944`.
- Plano conceitual: `N/A`.
- Gestor de Automações: `N/A — nenhuma fase com Automação: sim`.
- Decisões humanas: `DH-E19.5.4-001 = opção 2` e `DH-E19.5.4-002 = opção 1`.

## 2. Achados e tratamentos

| Especialista | ID | Achado fiel | Classificação original e relação com o escopo | Tratamento | Destino do update | Localização na v2 | Evidência ou justificativa |
|---|---|---|---|---|---|---|---|
| Gestor Estrutural | `GE-E19.5.4-001` | Identidade de PR, merge, branch, worktree, path e blob confirmada sem drift. | preservação | incorporado | N/A | 1.1 | V1 na `main` mantém o blob congelado e a branch parte do merge commit `26476a0e...`. |
| Gestor Estrutural | `GE-E19.5.4-002` | Processo registrado como v32 enquanto a fonte vigente está em v34. | preservação | incorporado | N/A | 1.1 | A v2 registra a fonte vigente e o baseline v34. |
| Gestor Estrutural | `GE-E19.5.4-003` | E20.2.8 estava descrita como reconciliação futura apesar de já integrar o baseline. | preservação | incorporado | N/A | 1.5; 3.1; 4.2 | A v2 trata versão corrente explícita como incorporada e reconcilia apenas avanço posterior. |
| Gestor Estrutural | `GE-E19.5.4-004` | Destino de `Nova landing page` não estava decidido. | extensão adjacente necessária e proporcional | incorporado | N/A | 1.3; 2.3; 3.1 | Decisão humana `DH-E19.5.4-001`: rota `/a/[account]/landing-pages/new`, com `name` e `slug`. |
| Gestor Estrutural | `GE-E19.5.4-005` | Autoridade semântica de `Atualizada` não estava definida. | preservação | incorporado | N/A | 1.3; 2.2 | Decisão humana `DH-E19.5.4-002`: `account_landing_pages.updated_at`, preservando ordenação vigente. |
| Gestor Estrutural | `GE-E19.5.4-006` | A substituição das superfícies existentes não estava normatizada. | preservação | incorporado | N/A | 3.1 | A v2 exige substituição in place, uma jornada única e remoção dos controles antigos. |
| Gestor Estrutural | `GE-E19.5.4-007` | Read models não continham toda a projeção exigida para identidade e aceite. | extensão adjacente necessária e proporcional | incorporado | N/A | 3.1 | DTOs/adapters existentes recebem projeções prontas; UI não lê DB, snapshots ou registries. |
| Gestor Estrutural | `GE-E19.5.4-008` | Geração vigente está no preview, enquanto o wireframe a coloca no detalhe. | extensão adjacente necessária e proporcional | incorporado | N/A | 3.1 | A v2 transfere somente a propriedade route-local, preserva pipeline e navega pelo `revisionId`. |
| Gestor Estrutural | `GE-E19.5.4-009` | Banco existente é suficiente; não há necessidade de migration ou novos objetos. | preservação | incorporado | N/A | 3.1; 4.1; 4.2 | O plano proíbe nova residência, schema e infraestrutura e preserva boundaries E19.5.3. |
| Gestor Estrutural | `GE-E19.5.4-010` | Loading específico da coleção não pode substituir o fallback global. | extensão adjacente necessária e proporcional | incorporado | N/A | 2.6 | Loading local reutiliza `LoadingState` sem alterar outras jornadas da conta. |
| Gestor de Updates | `prod#14` | Reconhecimento imediato da LP, situação, versão aceita e próxima ação deve virar roteiro verificável. | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | 2.7; 3.1 | QA sem instrução adicional, sem transformar tempo de clique em métrica obrigatória. |
| Gestor de Updates | `prod#16` | QA da nova superfície deve ocorrer em Preview funcional, desktop e mobile. | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | 2.7; 3.1 | Evidência proporcional de deployment e viewports, sem ferramenta paga obrigatória. |
| Gestor de Updates | `prod#17` | Acessibilidade precisava delimitar teclado, foco, semântica, anúncios, contraste e toque. | extensão adjacente necessária e proporcional | incorporado | usar como referência, validação ou trava | 2.7; 3.1 | Critérios proporcionais, sem alegar conformidade WCAG 2.2 integral. |
| Gestor de Updates | `prod#3` | Speed Insights pode separar regressão percebida após tráfego real. | preservação | incorporado | preservar como oportunidade estratégica condicional | 3.1 | Exige rollout, tráfego, hipótese e responsável; não implementar analytics neste recorte. |
| Gestor de Updates | `prod#12` | Troca global de contexto pode ter valor em operação recorrente multi-contas. | preservação | incorporado | preservar como oportunidade estratégica condicional | 3.1 | Exige recorte aprovado e evidência; não criar switcher, favoritos ou recentes. |
| Gestor de Updates | `vercel#15` | Toolbar pode reduzir feedback fragmentado no Preview. | preservação | incorporado | preservar como oportunidade estratégica condicional | 3.1 | Exige múltiplos revisores ou fragmentação comprovada; não habilitar agora. |
| Gestor de Updates | `vercel#29` | Upgrade/Instant Navigations pode reduzir atraso entre coleção, detalhe e preview. | preservação | incorporado | preservar como oportunidade estratégica condicional | 3.1 | Exige recorte técnico e atraso reproduzível; preservar Next.js `16.2.11`. |
| Gestor de Updates | `supa#68` | Realtime filtrado pode apoiar geração assíncrona futura. | preservação | incorporado | preservar como oportunidade estratégica condicional | 3.1 | Exige geração assíncrona aprovada e benefício mensurável; nenhuma subscription ou migration agora. |
| Analista — Passagem 1 | `AN-P1-E19.5.4-001` | Transferência da geração não preservava explicitamente `maxDuration = 300`. | preservação | incorporado | N/A | 3.1 | Contrato passa a preservar timeout e deadline, com regressão focal. |
| Analista — Passagem 1 | `AN-P1-E19.5.4-002` | Transição da rota de criação não explicitava autoridade, sucesso e erro. | extensão adjacente necessária e proporcional | incorporado | N/A | 3.1 | Rota preserva autoridade fail-closed, navega ao detalhe e mantém erro local sem persistência parcial. |
| Analista — Passagem 1 | `AN-P1-E19.5.4-003` | Identidade incompleta não possuía fallback semântico explícito. | extensão adjacente necessária e proporcional | incorporado | N/A | 1.3 | Ausência vira `Não informado`; não aplicabilidade vira `Não se aplica`; nenhuma dimensão é inventada ou omitida. |

## 3. Síntese de escopo

- Expansões incorporadas: nenhuma.
- Decisões humanas pendentes: nenhuma.
- Nova avaliação especializada pendente: nenhuma.
- Updates de aplicação atual: somente `prod#14`, `prod#16` e `prod#17`, como referência, validação ou trava.
- Oportunidades condicionais sem implementação: `prod#3`, `prod#12`, `vercel#15`, `vercel#29` e `supa#68`.

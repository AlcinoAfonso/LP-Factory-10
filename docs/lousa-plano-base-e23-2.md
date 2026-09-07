# E23.2 — Classificação segura das variáveis Vercel

Status: V1 funcional aprovada no Debate 06; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 06 — Implementações transversais prioritárias — LP Factory 10](https://docs.google.com/document/d/1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs/edit), seção 11, documento `1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs`, revisão `ANLCKQkyv3QKi4d5bpXOOV2Y0qUhf7Saj7WUE5TL7hgFHMb0p-YUqtDXk6FvP28vvPyRe3DyeLE8z4WiGOXtJ6XKgTdnKRmAFOt8WY8xL0Q`, consultada em 06/09/2026.

Decisão funcional superveniente: a seção 11 do mesmo Debate foi reconciliada em 07/09/2026 e relida na revisão `ANLCKQk7DtuS7jjp9PNGA9Hc0o5eI3xmIAnr8m03NHK2vX88dBsTMo0IC8bRtYcX8y9ufzYwNMitTOd6E6iVnFeaI-1ZCgwPbBj2uMn7chA`; ela preserva a rastreabilidade da V1 congelada e governa o fechamento funcional descrito abaixo.

## 1. Problema e resultado

- Problema original: o projeto documentava finalidade e escopo das variáveis, mas ainda não havia confirmado sua classificação efetiva entre Config e Secret na Vercel.
- Resultado funcional: seis ocorrências sem consumidor são removidas; 22 configurações sobreclassificadas como `Secret` e quatro branch scopes legados são aceitos temporariamente como estado conservador, sem exposição de valores, mudança indevida de consumidores ou impacto comprovado no runtime.

## 2. Atores e comportamento esperado

- Atores afetados: operadores autorizados, executores técnicos e consumidores server-side ou públicos das variáveis.
- Comportamento esperado: configurações públicas permanecem inspecionáveis; credenciais permanecem protegidas; o runtime conserva o comportamento vigente.

## 3. Limites, riscos e dependências

- Escopo negativo: não ler, copiar, imprimir, trocar ou versionar valores; não renomear variável, alterar consumidor, ampliar ambiente ou rotacionar credencial.
- Risco funcional material: uma classificação incorreta ou redeploy inadequado pode indisponibilizar um consumidor.
- Dependências reais: projeto Core da Vercel, inventário de `docs/platform-config.md` e acesso operacional autorizado.
- Não há trabalho pendente de reclassificação ou branch scope nesta V1. Correção futura só pode nascer de risco ou impacto funcional material comprovado e exige decisão própria.

## 4. Posição e fase planejadas no roadmap

- Caso macro planejado: E23 — Segurança e governança transversal da plataforma.
- Plano-base: E23.2 — Classificação segura das variáveis Vercel.
- Estrutura planejada: 23.2.1 Objetivo e status; 23.2.2 Registros do recorte quando houver entrega material; 23.2.3 Inspeção e reconciliação segura das classificações.
- Fase 23.2.3: concluir as seis remoções autorizadas e preservar o restante do inventário sob a decisão funcional conservadora, sem manipular valores ou branch scopes.

## 5. Classificação e automação

- Execução: Light, porque utiliza configuração e governança de plataforma já existentes, sem nova arquitetura.
- Automação: não criar automação; a atividade é uma inspeção e configuração operacional pontual.

## 6. Aceite e evidências

- Critério de aceite: nomes, tipos e escopos das variáveis ativas inventariados sem valores.
- Critério de aceite: credenciais confirmadas permanecem `Secret`; as 22 sobreclassificações como `Secret` e os quatro branch scopes legados permanecem protegidos e aceitos temporariamente sem impacto funcional material comprovado.
- Critério de aceite: seis ocorrências sem consumidor removidas, consumidores necessários preservados e nenhum trabalho pendente de reclassificação ou branch scope; nova correção exige decisão própria sustentada por risco ou impacto material comprovado.
- Evidências esperadas: relatório sanitizado por nome, tipo e ambiente, ausência das seis ocorrências removidas, preservação metadata-only das 22 sobreclassificações e dos quatro scopes, confirmação operacional do Preview e atualização de `docs/platform-config.md` somente para o estado material confirmado.

## 7. Estado da V1

- V1 funcional aprovada e reconciliada pela decisão superveniente do Debate. Execução: Light. Supervisão: Autônomo. Estado final: seis ocorrências removidas; 22 sobreclassificações e quatro branch scopes preservados temporariamente; nenhuma reclassificação ou mudança de scope pendente.

## 8. Plano-base V2 técnico mínimo

Status: derivado da V1 congelada no commit `939df3b60e2f1faeeefddc455b158c73c753fb4b`, blob `a53bf88c8d2af7490c0a52ab62238a045932a649`, a partir da `main` `8105378cffbb6044c0704d9adfaec2aeb7d8511a`; pronto para implementação Light.

Rastreabilidade: as regras desta V2 registram a derivação histórica daquele congelamento. A decisão funcional superveniente acima encerra as reclassificações e mudanças de branch scope sem apagar ou reescrever esse histórico.

### 8.1. Boundary técnico e invariantes

- O alvo operacional único é o projeto Vercel Core `lp-factory-10` (`prj_CUcAmxZMC0FMidqtECXzr3LCsKdl`) da conta Hobby `team_tyDQnnG4jyhR9pNLebDEKXWG`.
- A inspeção é exclusivamente metadata-only e pode registrar somente nome, tipo `Config`/`Secret`, ambientes `Production`/`Preview`/`Development`, branch scope e status da reconciliação. Não abrir, revelar, recuperar, copiar, imprimir, persistir nem transmitir valores.
- A classificação esperada deve ser derivada da finalidade documentada, sem leitura do valor. Usar `Secret` exclusivamente para credenciais, tokens, senhas, chaves privadas e material de assinatura ou autenticação; usar `Config` para URLs, chaves publishable, flags, gates, IDs e demais configurações não sensíveis, inclusive quando consumidas apenas server-side. Toda variável `NEXT_PUBLIC_*` deve permanecer `Config`; prefixo, nome contendo `KEY` ou consumo server-side, isoladamente, não define segredo.
- Não alterar nome, valor, consumidor, ambiente ou branch scope; não criar, remover, recriar, rotacionar ou expandir variável; não ativar a policy de separação de Production; não transportar ao Core secrets sem consumidor Vercel.
- Variável presente sem finalidade competente documentada gera drift sanitizado e permanece inalterada até decisão própria. Variáveis legadas ausentes não são recriadas e variáveis inertes não são removidas.
- Nenhum código, componente, service, workflow, automação, banco, schema, migration ou infraestrutura será criado ou alterado.

### 8.2. 23.2.1 — Objetivo e status

- Confirmar de forma reproduzível a cobertura completa das variáveis ativas do Core no Dashboard Vercel autorizado e confrontar cada entrada com `docs/platform-config.md` e consumidores versionados.
- O status só pode ser concluído com relatório sanitizado que cubra cada entrada ativa uma única vez por combinação de nome, ambiente e branch scope.

### 8.3. 23.2.2 — Registros do recorte

- Registrar no próprio plano o relatório sanitizado com: nome, tipo atual, tipo esperado, ambientes/branch scope, finalidade ou drift documental e resultado `conforme`, `corrigido` ou `pendente fora do escopo`.
- Reconciliar `docs/platform-config.md` somente se a inspeção comprovar estado material novo de configuração; reconciliar `docs/roadmap.md` para registrar o estado durável do recorte. Ambos são documentos canônicos e só podem receber operações literais derivadas por `$lp-factory-abc` a partir de relatório factual e snapshot anterior.
- Não registrar valores, datas de criação/alteração de cada secret, identidade individual de editor ou outros metadados desnecessários ao aceite.

### 8.4. 23.2.3 — Inspeção e reconciliação segura das classificações

- Classificar como `Secret`, quando presentes: `INVITE_STATE_SECRET`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `OPENAI_ADMIN_KEY`, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
- Classificar como `Config`, quando presentes: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `E11_MEMBERS_ENABLED`, `E20_5_SELECTED_RESEARCH_ENABLED`, `E20_6_INPUT_CATALOG_REVIEW_ENABLED`, `E19_5_WORKSPACE_ENABLED`, `ACCESS_CONTEXT_ENFORCED`, `ACCESS_CTX_USE_V2`, `OPENAI_LP_COST_TRACKING_ENABLED`, `OPENAI_OPERATIONAL_CONFIG_ENABLED`, `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` e os `STRIPE_TEST_*_PRODUCT_ID`/`STRIPE_TEST_*_PRICE_ID`.
- URLs e flags adicionais com finalidade competente documentada usam `Config`; credenciais adicionais com finalidade competente documentada usam `Secret`. Sem essa finalidade, não inferir pelo valor.
- Corrigir somente divergência de tipo quando a operação suportada pela Vercel preservar declaradamente o nome, o valor existente, os ambientes, branch scopes e consumidores sem exigir recuperação, exibição, cópia, reinserção ou substituição do valor. Se a operação exigir qualquer manipulação do valor, deixar a variável inalterada, registrar a divergência sanitizada e encerrar esse item como `pendente fora do escopo`.
- A interface Vercel atual deve ser confrontada antes da primeira mutação. A edição de uma entrada `Secret` já observada informa que o valor salvo é write-only e desabilita a conversão para `Config`; portanto, esse caminho não autoriza rotação, reinserção ou recriação para contornar a trava.
- Redeploy e smoke são executados somente no ambiente efetivamente afetado por uma correção. Ausência de correção implica ausência de redeploy e de smoke de runtime.

### 8.5. Aceite, evidências e aderência

- Confirmar como `Secret` toda credencial ativa e como `Config` toda configuração ativa não sensível, pública ou server-side. Registrar somente nome, tipo atual, tipo esperado, Production/Preview/Development/branch scope e status `conforme`, `corrigido` ou `pendente fora do escopo`.
- A cobertura deve coincidir com o inventário ativo do Dashboard, sem valores. O diff operacional, se existir, deve limitar-se ao campo de tipo; divergências não corrigíveis sem manipular valor permanecem explicitamente registradas.
- Toda correção concreta exige evidência posterior do tipo, ambiente e branch scope preservados, além de redeploy e smoke proporcionais do consumidor afetado. Sem correção concreta, registrar que nenhuma mutação, redeploy ou smoke foi necessário.
- Validar o delta documental com `git diff --check`. Como não há impacto em código ou dependências, `npm ci` e `npm run check` são não aplicáveis, salvo surgimento de mudança executável não prevista, que deve interromper o recorte.

### 8.6. Updates e decisão de derivação

- Skill acionada: `$lp-factory-avaliar-plano-updates`; parecer read-only sobre a V1 imutável no commit `939df3b60e2f1faeeefddc455b158c73c753fb4b`.
- Update aplicado: `vercel#32`, com os quatro patches autossuficientes de classificação por finalidade, correção sem manipulação de valor, evidência metadata-only e limites contra limpeza ou policy adicional.
- Oportunidade estratégica condicionada e não implementada: policy de valor de Production distinto dos demais ambientes.
- Não há candidato a confronto estrutural, arbitragem funcional, nova automação ou decisão humana para consolidar a V2. A classificação Light permanece compatível e o Analista não é necessário antes da implementação.

## 9. Relatório operacional sanitizado

### 9.1. Fonte, cobertura e resultado

- Inspeção read-only realizada no Dashboard autorizado do projeto Core `lp-factory-10`, depois da confirmação independente do projeto e da conta pela conexão Vercel.
- Cobertura inicial: 51 entradas ativas, contadas por combinação de nome, ambiente e branch scope; nenhum valor foi aberto, revelado, recuperado, copiado, impresso, transmitido ou versionado.
- Resultado final: 45 entradas ativas — 21 `conforme` e 24 preservadas por decisão funcional conservadora —, além de seis remoções metadata-only concluídas.
- Nenhuma entrada foi reclassificada, reinserida, renomeada, rotacionada ou reescopada. Foram removidas somente as seis ocorrências sem consumidor expressamente autorizadas.
- A edição de uma entrada já classificada como `Secret` mostrou a opção `Config` desabilitada e a informação de que secrets salvos são write-only. Corrigir essas divergências exigiria substituir ou reinserir o valor, ação proibida pela V1 e pela V2.
- A sobreclassificação de 22 configurações como `Secret` e os quatro branch scopes legados foram aceitos como estado funcional conservador, sem impacto material comprovado. Correção futura exige risco ou impacto funcional material comprovado e decisão própria.
- A publicação da branch acionou o Preview automático previsto pela integração Git/Vercel; deployment e smoke de runtime foram aprovados com a configuração final.

### 9.2. Inventário atual × esperado

| Nome | Tipo atual | Tipo esperado | Ambiente / branch scope | Resultado | Observação |
|---|---|---|---|---|---|
| `ACCESS_CONTEXT_ENFORCED` | `Config` | `Config` | Preview | `conforme` | tipo e escopo observados |
| `ACCESS_CONTEXT_ENFORCED` | `Config` | `Config` | Production | `conforme` | tipo e escopo observados |
| `ACCESS_CTX_USE_V2` | `Config` | `Config` | Production and Preview | `conforme` | tipo e escopo observados |
| `E11_MEMBERS_ENABLED` | `Secret` | `Config` | Preview / `codex-app/e11-11-1-7` | `preservado — decisão funcional` | sobreclassificação e branch scope aceitos sem impacto material comprovado |
| `E11_MEMBERS_ENABLED` | `Config` | `Config` | Production and Preview | `conforme` | tipo e escopo observados |
| `E19_5_WORKSPACE_ENABLED` | `Secret` | `Config` | Preview | `removido` | ocorrência sem consumidor removida por autorização expressa |
| `E19_5_WORKSPACE_ENABLED` | `Secret` | `Config` | Production | `removido` | ocorrência sem consumidor removida por autorização expressa |
| `E20_5_SELECTED_RESEARCH_ENABLED` | `Secret` | `Config` | Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `E20_5_SELECTED_RESEARCH_ENABLED` | `Config` | `Config` | Preview / `codex-app/e20-5-pos-merge` | `preservado — decisão funcional` | branch scope aceito sem impacto material comprovado |
| `E20_5_SELECTED_RESEARCH_ENABLED` | `Secret` | `Config` | Preview / `codex-app/e20-6-5-post-apply-corrections` | `preservado — decisão funcional` | sobreclassificação e branch scope aceitos sem impacto material comprovado |
| `E20_5_SELECTED_RESEARCH_ENABLED` | `Config` | `Config` | Production | `conforme` | tipo e escopo observados |
| `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` | `Secret` | `Config` | Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `E20_6_5_INPUT_CATALOG_EVALUATION_PROVIDER_ENABLED` | `Config` | `Config` | Production | `conforme` | tipo e escopo observados |
| `E20_6_INPUT_CATALOG_REVIEW_ENABLED` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `E7_ONBOARD_SERVICE_ONLY` | `Config` | `não determinado` | Preview | `removido` | ocorrência sem consumidor removida por autorização expressa |
| `INVITE_STATE_SECRET` | `Secret` | `Secret` | Preview | `conforme` | tipo e escopo observados |
| `INVITE_STATE_SECRET` | `Secret` | `Secret` | Production | `conforme` | tipo e escopo observados |
| `LPF_MCP_SECRET` | `Secret` | `Secret` | Production and Preview | `removido` | ocorrência sem consumidor removida por autorização expressa |
| `MCP_SUPABASE_INSPECT_URL` | `Config` | `Config` | All Environments | `removido` | ocorrência sem consumidor removida por autorização expressa |
| `NEXT_PUBLIC_SITE_URL` | `Config` | `Config` | Preview / `codex-app/e11-2-orquestracao` | `preservado — decisão funcional` | branch scope aceito sem impacto material comprovado |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `Config` | `Config` | Preview | `conforme` | tipo e escopo observados |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `Config` | `Config` | Production | `conforme` | tipo e escopo observados |
| `NEXT_PUBLIC_SUPABASE_URL` | `Config` | `Config` | Preview | `conforme` | tipo e escopo observados |
| `NEXT_PUBLIC_SUPABASE_URL` | `Config` | `Config` | Production | `conforme` | tipo e escopo observados |
| `OPENAI_ADMIN_KEY` | `Secret` | `Secret` | Preview | `conforme` | tipo e escopo observados |
| `OPENAI_ADMIN_KEY` | `Secret` | `Secret` | Production | `conforme` | tipo e escopo observados |
| `OPENAI_API_KEY` | `Secret` | `Secret` | Production and Preview | `conforme` | tipo e escopo observados |
| `OPENAI_LP_COST_TRACKING_ENABLED` | `Config` | `Config` | Production | `conforme` | tipo e escopo observados |
| `OPENAI_OPERATIONAL_CONFIG_ENABLED` | `Secret` | `Config` | Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `OPENAI_OPERATIONAL_CONFIG_ENABLED` | `Config` | `Config` | Production | `conforme` | tipo e escopo observados |
| `STRIPE_SECRET_KEY` | `Secret` | `Secret` | Production and Preview | `conforme` | tipo e escopo observados |
| `STRIPE_TEST_LITE_ANNUAL_PRICE_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_LITE_ANNUAL_PRODUCT_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_LITE_MONTHLY_PRICE_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_LITE_MONTHLY_PRODUCT_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_PRO_ANNUAL_PRICE_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_PRO_ANNUAL_PRODUCT_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_PRO_MONTHLY_PRICE_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_PRO_MONTHLY_PRODUCT_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_STARTER_ANNUAL_PRICE_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_STARTER_ANNUAL_PRODUCT_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_STARTER_MONTHLY_PRICE_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_STARTER_MONTHLY_PRODUCT_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_ULTRA_ANNUAL_PRICE_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_ULTRA_ANNUAL_PRODUCT_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_ULTRA_MONTHLY_PRICE_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_TEST_ULTRA_MONTHLY_PRODUCT_ID` | `Secret` | `Config` | Production and Preview | `preservado — decisão funcional` | sobreclassificação aceita sem impacto material comprovado |
| `STRIPE_WEBHOOK_SECRET` | `Secret` | `Secret` | Production and Preview | `conforme` | tipo e escopo observados |
| `SUPABASE_DB_URL_READONLY` | `Secret` | `Secret` | Production and Preview | `removido` | ocorrência sem consumidor removida somente da Vercel Core; secret GitHub homônimo preservado |
| `SUPABASE_SECRET_KEY` | `Secret` | `Secret` | Preview | `conforme` | tipo e escopo observados |
| `SUPABASE_SECRET_KEY` | `Secret` | `Secret` | Production | `conforme` | tipo e escopo observados |

### 9.3. Decisão funcional final

- As 22 sobreclassificações `Secret` → `Config` permanecem inalteradas e são aceitas como estado funcional conservador; as categorias se sobrepõem a dois dos branch scopes preservados.
- Os quatro branch scopes legados permanecem inalterados enquanto não houver risco ou impacto funcional material comprovado.
- As seis remoções de ocorrências sem consumidor foram concluídas; não há ação humana de reinserção, substituição de valor ou troca de scope pendente neste recorte.
- Nova correção de classificação ou de scope exige decisão própria sustentada por impacto funcional material comprovado.

## 10. Fechamento operacional metadata-only

### 10.1. Remoções concluídas

As seis ocorrências autorizadas foram removidas do projeto Vercel Core e tiveram a ausência confirmada individualmente pela busca nominal do Dashboard:

| Nome | Ambiente / branch scope removido | Verificação |
|---|---|---|
| `E19_5_WORKSPACE_ENABLED` | Production / sem branch scope | nenhum resultado remanescente para o nome depois da remoção das duas ocorrências |
| `E19_5_WORKSPACE_ENABLED` | Preview / sem branch scope | nenhum resultado remanescente para o nome depois da remoção das duas ocorrências |
| `MCP_SUPABASE_INSPECT_URL` | All Environments / sem branch scope | nenhum resultado remanescente para o nome |
| `LPF_MCP_SECRET` | Production and Preview / sem branch scope | nenhum resultado remanescente para o nome |
| `SUPABASE_DB_URL_READONLY` | Production and Preview / sem branch scope | nenhum resultado remanescente para o nome na Vercel Core |
| `E7_ONBOARD_SERVICE_ONLY` | Preview / sem branch scope | nenhum resultado remanescente para o nome |

O secret homônimo `SUPABASE_DB_URL_READONLY` do GitHub Actions não foi alterado. O repositório reconciliado preserva `.github/workflows/pipeline-supabase-inspect.yml` consumindo `${{ secrets.SUPABASE_DB_URL_READONLY }}` e `automations/supabase-inspect/run.mjs` usando a variável somente no processo da automação.

As remoções alteraram a configuração disponível a novos deployments, sem modificar deployments já construídos. O Preview gerado pela publicação do PR ficou `READY` e o smoke proporcional confirmou resposta HTTP 200 na rota de login. Nenhum redeploy de Production foi executado.

### 10.2. Evidência documental externa

A seção 11 do Google Doc `Debate 06 — Implementações transversais prioritárias — LP Factory 10`, tab `t.0`, foi reconciliada somente nos seis parágrafos de E23.2. A revisão final relida foi `ANLCKQk7DtuS7jjp9PNGA9Hc0o5eI3xmIAnr8m03NHK2vX88dBsTMo0IC8bRtYcX8y9ufzYwNMitTOd6E6iVnFeaI-1ZCgwPbBj2uMn7chA`; os estados de E23.1 e E23.3 permaneceram textualmente inalterados.

# E23.2 — Classificação segura das variáveis Vercel

Status: V1 funcional aprovada no Debate 06; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 06 — Implementações transversais prioritárias — LP Factory 10](https://docs.google.com/document/d/1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs/edit), seção 11, documento `1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs`, revisão `ANLCKQkyv3QKi4d5bpXOOV2Y0qUhf7Saj7WUE5TL7hgFHMb0p-YUqtDXk6FvP28vvPyRe3DyeLE8z4WiGOXtJ6XKgTdnKRmAFOt8WY8xL0Q`, consultada em 06/09/2026.

## 1. Problema e resultado

- Problema: o projeto documenta finalidade e escopo das variáveis, mas ainda não confirmou sua classificação efetiva entre Config e Secret na Vercel.
- Resultado funcional: todas as variáveis ativas ficam coerentes com sua natureza e seus ambientes, sem exposição de valores e sem mudança indevida de consumidores.

## 2. Atores e comportamento esperado

- Atores afetados: operadores autorizados, executores técnicos e consumidores server-side ou públicos das variáveis.
- Comportamento esperado: configurações públicas permanecem inspecionáveis; credenciais permanecem protegidas; o runtime conserva o comportamento vigente.

## 3. Limites, riscos e dependências

- Escopo negativo: não ler, copiar, imprimir, trocar ou versionar valores; não renomear variável, alterar consumidor, ampliar ambiente ou rotacionar credencial.
- Risco funcional material: uma classificação incorreta ou redeploy inadequado pode indisponibilizar um consumidor.
- Dependências reais: projeto Core da Vercel, inventário de `docs/platform-config.md` e acesso operacional autorizado.
- Se a inspeção revelar mudança além da classificação Config/Secret, o ponto fica fora desta V1 e exige nova decisão.

## 4. Posição e fase planejadas no roadmap

- Caso macro planejado: E23 — Segurança e governança transversal da plataforma.
- Plano-base: E23.2 — Classificação segura das variáveis Vercel.
- Estrutura planejada: 23.2.1 Objetivo e status; 23.2.2 Registros do recorte quando houver entrega material; 23.2.3 Inspeção e reconciliação segura das classificações.
- Fase 23.2.3: confirmar a classificação e corrigir somente divergências comprovadas dentro dos limites aprovados.

## 5. Classificação e automação

- Execução: Light, porque utiliza configuração e governança de plataforma já existentes, sem nova arquitetura.
- Automação: não criar automação; a atividade é uma inspeção e configuração operacional pontual.

## 6. Aceite e evidências

- Critério de aceite: nomes, tipos e escopos das variáveis ativas inventariados sem valores.
- Critério de aceite: cada credencial confirmada como Secret e cada configuração pública confirmada como Config.
- Critério de aceite: divergências necessárias corrigidas e consumidores preservados; redeploy e smoke somente quando exigidos pela mudança.
- Evidências esperadas: relatório sanitizado por nome, tipo e ambiente, confirmação operacional da Vercel e atualização de `docs/platform-config.md` somente se houver estado material novo.

## 7. Estado da V1

- V1 funcional aprovada. Execução: Light. Supervisão: Autônomo.

## 8. Plano-base V2 técnico mínimo

Status: derivado da V1 congelada no commit `939df3b60e2f1faeeefddc455b158c73c753fb4b`, blob `a53bf88c8d2af7490c0a52ab62238a045932a649`, a partir da `main` `8105378cffbb6044c0704d9adfaec2aeb7d8511a`; pronto para implementação Light.

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

20/08/2026 — Rascunho vivo — E21.2 — Configuração operacional dinâmica dos workloads OpenAI

## 1. Estado do debate

### 1.1. Status

- Status: rascunho vivo do futuro plano-base v1; ainda não consolidado.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.2 — Configuração operacional dinâmica dos workloads OpenAI`.
- O objetivo do debate é fechar o contrato conceitual antes de escolher mecanismo técnico.
- A E21.1 permanece implementada, validada e preservada como fundação e boundary transversal.
- A E21.3 permanece como próxima evolução de evidências e avaliação de custo-benefício e não integra o recorte executável da E21.2.

### 1.2. Fontes obrigatórias consultadas

- `README.md`.
- `AGENTS.md`.
- `docs/prompt-estrategista.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/lousa-plano-base-e21-1.md`.
- `docs/base-tecnica.md`.
- `docs/platform-config.md`.
- `docs/openai-model-snapshot.md`.
- `docs/gestor-automations.md`.
- `docs/automations.md`.
- Como fontes factuais complementares do estado implementado: `lib/openai-workloads/contracts.ts`, `lib/openai-workloads/registry.ts`, `lib/openai-workloads/resolve.ts` e `app/admin/(protected)/workloads-openai/page.tsx`.

### 1.3. Decisões já fixas pelo roadmap e pela E21.1

- A configuração operacional futura deve ser explícita por ambiente e workload.
- Deve existir configuração candidata antes da ativação.
- A candidata deve ser validada antes de poder tornar-se ativa.
- A ativação exige decisão humana.
- O rollback deve voltar para revisão anteriormente validada.
- Mudança ordinária de configuração deve ser possível sem redeploy.
- Os consumidores de produto devem continuar resolvendo sua configuração pelo boundary canônico `lib/openai-workloads/`, sem passar a conhecer diretamente a residência técnica da configuração.
- Workloads textuais e de imagem permanecem discriminados e recebem somente os parâmetros aplicáveis à própria modalidade.
- O boundary comum não se torna cliente OpenAI universal e não absorve prompts, schemas funcionais, persistência de resultado ou fallback dos consumidores.
- O mecanismo efetivo ainda não está autorizado: o roadmap não escolheu banco, rota, dashboard mutável, provider de configuração nem nova infraestrutura.

## 2. Problema e resultado esperado

### 2.1. Problema objetivo

- Hoje a configuração efetiva dos workloads de produto está no `repo_catalog`, em `lib/openai-workloads/registry.ts`.
- Alterar essa configuração exige mudança versionada no repositório e novo deployment, o que não atende ao requisito já aprovado de mudança ordinária sem redeploy.
- Ao mesmo tempo, a E21.1 foi construída para evitar nova refatoração dos consumidores quando a origem da configuração mudar: os consumidores já dependem do resolver comum.
- A E21.2 precisa, portanto, fechar como uma configuração operacional é proposta, validada, ativada, resolvida e revertida sem enfraquecer o boundary existente nem transformar governança em seleção autônoma de modelo.

### 2.2. Resultado esperado do recorte

- Dar ao humano autorizado uma superfície operacional no Admin Dashboard para consultar e alterar a configuração dos workloads OpenAI aplicáveis.
- A lista administrativa deve partir do inventário já existente e permitir abrir o detalhe de cada workload, sem tratar o identificador E* como unidade de configuração.
- Para workloads textuais, permitir alteração humana de `model + reasoning effort`; para workloads de mídia, preservar configuração própria e expor somente os parâmetros operacionais aprovados.
- Fazer com que uma configuração ativada passe a ser usada nas execuções seguintes daquele workload no ambiente aplicável, sem commit, PR ou redeploy para uma mudança ordinária.
- Definir um contrato operacional mínimo no qual cada workload aplicável possua uma configuração ativa inequívoca no ambiente aplicável.
- Permitir preparar uma candidata sem alterar silenciosamente a configuração ativa.
- Impedir ativação de candidata que não tenha cumprido os gates aprovados.
- Exigir ação humana explícita para promoção da candidata.
- Preservar revisão e histórico rastreáveis suficientes para consultar configurações anteriormente ativadas e permitir rollback controlado para revisão previamente validada.
- Manter a resolução fail-closed e sem fallback silencioso para modelo, effort ou configuração de mídia diferentes.
- Separar governança operacional de configuração da avaliação comparativa da E21.3.

### 2.3. Definições aceitas no debate

- A E21.2 não é apenas governança documental: ela deve materializar a capacidade operacional de o humano autorizado alterar a configuração de cada workload pelo Admin Dashboard.
- A alteração deve ocorrer sem necessidade de o humano entrar na Vercel, editar código ou disparar redeploy para mudanças ordinárias previstas pelo contrato da E21.2.
- O Admin Dashboard é a superfície humana pretendida independentemente da residência técnica escolhida para a configuração.
- O detalhe do workload poderá concentrar configuração ativa, candidata quando existir, histórico de revisões e ações humanas aplicáveis; o desenho final de UX permanece a fechar antes da v1.
- A unidade operacional deve possuir exatamente uma configuração ativa por `ambiente + workload`.
- No MVP, pode existir no máximo uma candidata em preparação por `ambiente + workload`.
- Somente `platform_admin` pode criar candidata, ativar configuração e executar rollback; Estrategista, Analista, Gestores e futura E21.3 podem produzir recomendações ou evidências, mas não alterar automaticamente a configuração ativa.
- Toda candidata precisa cumprir validações determinísticas obrigatórias e também uma prova operacional adequada ao workload antes de ficar apta à ativação.
- A prova operacional não é benchmark universal e não absorve comparação de qualidade, custo, latência ou estabilidade entre alternativas; essas comparações pertencem à E21.3.
- O núcleo da E21.2 é determinístico: criação de candidata, gates, ativação, histórico, resolução da configuração ativa e rollback não dependem de decisão de IA.
- A prova operacional pode executar o próprio workload OpenAI para comprovar que a configuração candidata funciona, mas essa execução é validação do workload e não transforma a E21.2 em automação.
- Automação: não. Por decisão humana, a E21.2 não adota automação, agente, job ou workflow próprio e não requer consulta ao Gestor de Automação antes da v1 enquanto essa decisão permanecer inalterada.
- Para a UX administrativa, `landing_page_draft_generation` e `landing_page_draft_image_generation` permanecem workloads técnicos independentes, mas devem ser apresentados de forma agrupada sob a função de geração da Landing Page para tornar a operação humana compreensível.
- No workload textual de geração da LP, a configuração operacional exposta ao humano é `model + reasoning effort`.
- No workload de imagem da LP, a configuração operacional inicial exposta ao humano é `model + quality`; tamanho, formato, compressão e moderação permanecem determinísticos no código neste recorte, pois participam do contrato técnico de apresentação, Storage ou segurança.
- Supabase é a hipótese principal de residência operacional a avaliar, por aderir naturalmente ao ciclo `candidata → validação → ativação → histórico → rollback` e por já integrar a stack base do MVP.
- Vercel Global Config permanece alternativa técnica real de comparação porque também permite leitura e alteração de configuração em runtime sem redeploy e possui APIs para gestão programática; seu uso não exigiria que o humano operasse diretamente a Vercel se o Admin Dashboard intermediasse a mutação.
- A preferência atual pelo Supabase ainda não equivale a autorização de banco ou arquitetura fechada: a decisão técnica final deve comparar as duas alternativas dentro dos requisitos do recorte antes da consolidação da v1.
- O histórico operacional da E21.2 deve registrar mudanças e ativações da configuração; evidências comparativas de qualidade, custo, latência e estabilidade pertencem à E21.3 e podem futuramente ser referenciadas, sem serem produzidas pela E21.2.

## 3. Decisões ainda abertas para debate

### 3.1. Lifecycle da candidata e revisão

- Fechar em que momento uma candidata recebe identidade/revisão estável.
- Fechar quais estados mínimos são necessários entre preparação, validação e ativação, sem criar lifecycle maior que o necessário ao MVP.
- Fechar como uma candidata reprovada ou abandonada permanece rastreável sem concorrer com a única candidata em preparação permitida.

### 3.2. Atores e validação

- A autoridade de mutação está fechada em `platform_admin` para criação de candidata, ativação e rollback.
- Permanece aberto como as validações determinísticas e a prova operacional são executadas e registradas, preservando `Automação: não`.
- A prova operacional pode executar o workload OpenAI correspondente, mas não decide aprovação, ativação ou rollback.
- Preservar que recomendações de Estrategista, Analista, Gestores ou futura E21.3 não equivalem a autoridade operacional para alterar a configuração ativa.
- Preservar que owner/admin de conta não recebe autoridade de plataforma sobre workloads OpenAI.

### 3.3. Granularidade da configuração

- Confirmar quais ambientes entram na configuração dinâmica operacional: Production, Preview e eventual tratamento de Development.
- Confirmar que a unidade primária permanece o workload, sem criar default universal de modelo ou effort.
- Para workloads textuais, a configuração operacional inicial é `model + reasoning effort`; permanece aberto se outro parâmetro transversal também precisa ser dinâmico.
- Para o workload de imagem da LP, a configuração operacional inicial é `model + quality`; tamanho, formato, compressão e moderação permanecem fixos no contrato versionado em código neste recorte.
- Identificar explicitamente quais demais propriedades estruturais continuam versionadas em código, como identidade do workload, modalidade/API, consumidor, fallback e contratos funcionais.

### 3.4. Validação obrigatória antes da ativação

- A candidata deve cumprir validações determinísticas e prova operacional adequada ao workload antes de ficar apta à ativação.
- Fechar quais gates determinísticos são universais e quais dependem da modalidade ou do workload.
- Fechar qual evidência mínima caracteriza a prova operacional sem impor canário universal inadequado.
- Preservar a fronteira: comparação de qualidade, custo, latência e estabilidade entre alternativas pertence à E21.3.
- A E19.4 permanece baseline factual e não é reaberta.

### 3.5. Rollback e comportamento fail-closed

- Definir para qual revisão validada o rollback pode apontar e confirmar a seleção explicitamente humana pelo `platform_admin`.
- Definir se rollback cria nova revisão de ativação ou apenas restaura a autoridade de uma revisão já validada.
- Definir o comportamento quando a fonte operacional estiver indisponível, inconsistente ou sem configuração válida para `ambiente + workload`.
- Preservar a proibição de fallback silencioso para outra combinação de modelo, effort ou mídia.

### 3.6. Mudança ordinária sem redeploy e residência operacional

- Definir conceitualmente quais mudanças contam como ordinárias dentro da E21.2.
- Separar alteração de parâmetros operacionais do workload de alteração estrutural que ainda deve exigir mudança de código e deployment.
- Comparar factual e minimamente Supabase e Vercel Global Config para a residência operacional, considerando leitura por ambiente/workload, escrita administrativa, autorização, histórico, candidata, ativação, rollback, atomicidade, custo, dependência adicional, comportamento de falha e simplicidade do MVP.
- Supabase permanece hipótese principal; Vercel Global Config permanece alternativa técnica, e nenhuma das duas está ainda autorizada como mecanismo definitivo.

### 3.7. UX administrativa

- A apresentação da geração da Landing Page deve agrupar visualmente os workloads de texto e imagem, sem fundir seus contratos técnicos nem suas configurações.
- Fechar a estrutura mínima da lista existente de workloads e da futura ação `Abrir`.
- Definir quais dados aparecem no detalhe antes e depois de existir candidata.
- Definir quais ações são separadas: editar/preparar candidata, validar, ativar e rollback.
- Definir quais informações históricas pertencem à E21.2 e quais referências futuras da E21.3 podem aparecer sem duplicação.
- Preservar a superfície server-side e o controle de plataforma já vigentes, sem antecipar rota, action ou componente específico antes da solução técnica.

### 3.8. Possibilidade de automação

- Decisão humana fechada neste debate: `Automação: não` para a E21.2.
- A prova operacional de uma candidata é validação do workload e pode executar OpenAI quando aplicável, mas não constitui automação do processo nem autoriza decisão autônoma.
- Não criar categoria de automação, job, agente ou workflow próprio para a E21.2.
- O Gestor de Automação não precisa ser consultado antes da v1 enquanto essa decisão e o escopo permanecerem inalterados.

## 4. Escopo negativo e próxima etapa do debate

### 4.1. Escopo negativo preservado

- Não implementar nada durante este debate.
- Não autorizar banco, rota, Server Action, provider de configuração ou nova infraestrutura apenas porque Supabase é a hipótese principal.
- Não criar job, engine, agente ou automação antecipadamente.
- Não transformar a E21.2 em laboratório de benchmarking nem absorver comparações decisórias da E21.3.
- Não reabrir a E19.4; sua revisão 3 permanece baseline real para regressão futura.
- Não alterar a E21.1 salvo incompatibilidade factual comprovada.
- Não alterar `docs/roadmap.md` durante o rascunho vivo.

### 4.2. Próxima etapa

- Debater com o humano as definições conceituais ainda abertas nas subseções 3.1 a 3.7.
- Incorporar somente decisões aceitas ao mesmo rascunho vivo, mantendo questões abertas claramente separadas.
- Obter participação do Analista no debate antes da consolidação da v1.
- Não consultar o Gestor de Automação enquanto permanecer válida a decisão humana `Automação: não` e não surgir mudança material de escopo.

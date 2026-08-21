20/08/2026 — Plano-base v2 — E21.2 — Configuração operacional dinâmica dos workloads OpenAI

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v2 consolidado para avaliação do Analista; ainda não aprovado para execução.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.2 — Configuração operacional dinâmica dos workloads OpenAI`.
- Plano conceitual: N/A.
- Fonte congelada: plano-base v1 do PR #790, blob `5cba65232b22b06a7e49bbbe592b0e74d080d274`, incorporado à `main` pelo merge commit `d260a82bf3e121e8be3f17a24229ecbd54f829ff`.
- Snapshot canônico de roadmap: `docs/roadmap.md` na `main` `d260a82bf3e121e8be3f17a24229ecbd54f829ff`, blob `e896c907fc0ff5a566d08aeb46b881ae011f01e1`.
- A E21.1 permanece implementada, validada e preservada como fundação e boundary transversal.
- A E21.3 permanece como próxima evolução de evidências e avaliação de custo-benefício e não integra o recorte executável da E21.2.
- A execução deve ocorrer na branch única `codex-app/e21-2-orquestracao`, em um único PR de implementação, sem merge automático nem mudança autônoma de estado do PR.

### 1.2. Objetivo

- Permitir que `platform_admin` consulte e altere pelo Admin Dashboard a configuração operacional dos workloads OpenAI de produto.
- Fazer com que uma configuração ativada passe a ser usada nas execuções seguintes do workload no ambiente correspondente sem commit, PR ou redeploy.
- Preservar candidata, validação, ativação humana, histórico e rollback sem transformar a E21.2 em seleção autônoma de modelo ou laboratório de benchmarking.
- Preservar os consumers e a API pública do boundary `lib/openai-workloads/`, substituindo somente a origem efetiva da configuração em Production e Preview.

### 1.3. Fontes usadas

- `AGENTS.md`, `README.md`, `docs/prompt-estrategista.md`, `docs/roadmap.md`, `docs/template-roadmap.md` e `docs/orquestracao-plano-base.md`.
- `docs/lousa-plano-base-e21-1.md`, `docs/base-tecnica.md`, `docs/platform-config.md`, `docs/openai-model-snapshot.md`, `docs/schema.md`, `docs/gestor-automations.md` e `docs/automations.md`.
- `lib/openai-workloads/contracts.ts`, `registry.ts`, `resolve.ts`, `index.ts`, `observability.ts` e `validation-cases.ts`.
- Consumers atuais em `lib/onboarding/niche-resolution/`, `lib/conversion-content/` e `lib/lp-builder/`.
- Superfície administrativa atual em `app/admin/(protected)/workloads-openai/`, gate `requirePlatformAdmin()` e cliente server-side `lib/supabase/service.ts`.
- Documentação oficial vigente da OpenAI para GPT-5.4 mini, GPT-5.6 Luna, GPT Image 2 e Image Generation.
- Documentação oficial vigente do Supabase para RLS, funções de banco e mudanças incompatíveis, além das práticas de segurança e desempenho aplicáveis ao Postgres.

### 1.4. Decisões fixas do recorte

- A unidade operacional é `ambiente + workload`; não existe default universal de modelo, effort ou configuração de mídia.
- Production e Preview usam configuração dinâmica independente; Development permanece determinístico/local e fora da gestão dinâmica v1.
- Não existe promoção automática de Preview para Production; qualquer ativação em cada ambiente é humana e explícita.
- Existe exatamente uma configuração ativa por `ambiente + workload` após o bootstrap.
- No MVP existe no máximo uma substituição pendente por `ambiente + workload`, esteja ela em preparação como candidata ou já validada aguardando ativação.
- Somente `platform_admin` pode criar/editar candidata, iniciar sua validação, ativar configuração e executar rollback.
- Recomendações de Estrategista, Analista, Gestores ou futura E21.3 não alteram automaticamente a configuração ativa.
- Toda candidata precisa cumprir validações determinísticas e uma prova operacional adequada ao workload antes de ficar apta à ativação.
- A ativação final é sempre humana.
- Rollback é uma nova ação humana de ativação que referencia uma revisão anteriormente validada; não duplica nem altera a revisão histórica restaurada.
- Após o cutover, a resolução em Production e Preview é fail-closed: fonte indisponível, configuração ausente, inválida ou inconsistente bloqueia o transporte OpenAI e não autoriza fallback silencioso para `repo_catalog`, modelo anterior, default do provedor ou outra revisão.
- O fallback funcional permanece responsabilidade de cada consumer conforme E21.1 e seus contratos próprios.
- O núcleo da E21.2 é determinístico. A prova operacional pode executar o workload OpenAI candidato, mas isso é validação e não decisão autônoma.
- Automação: não. Não criar categoria de automação, agente, job ou workflow próprio para a E21.2.

### 1.5. Residência operacional e corte seguro

- Supabase é a única residência operacional aprovada para as configurações dinâmicas, revisões e histórico mínimo da E21.2.
- Vercel continua sendo runtime/deploy do Core; a E21.2 não usa Vercel Global Config, Vercel Flags ou outra segunda residência.
- Migration e runtime permanecem no mesmo PR, mas o deploy é expand/contract e nasce desativado por um gate server-side temporário, `OPENAI_OPERATIONAL_CONFIG_ENABLED`.
- Com o gate ausente ou diferente de `true`, Production e Preview continuam no baseline compatível do `repo_catalog`; esse modo existe apenas para permitir merge, aplicação e verificação da migration antes do cutover.
- Com o gate `true`, Production e Preview consultam exclusivamente a configuração ativa no Supabase, sem cache e sem fallback para `repo_catalog`; qualquer falha é fail-closed antes do transporte.
- O gate não seleciona modelo, não substitui o lifecycle e não participa de alterações operacionais ordinárias. Após migration, bootstrap e verificações aprovadas, sua ativação ocorre no ambiente hospedado autorizado; mudanças seguintes de configuração não exigem redeploy.
- A remoção futura do modo de compatibilidade só pode ocorrer após evidência de cutover estável e pertence a delta posterior autorizado; não impede a entrega funcional da E21.2.
- `OPENAI_OPERATIONAL_CONFIG_ENABLED` é uma variável server-side não secreta, configurada independentemente em Preview e Production.
- Somente o literal `true` habilita a fonte operacional. Ausência, vazio ou qualquer outro valor mantêm o modo compatível `repo_catalog`.
- Development ignora a habilitação dinâmica e permanece no baseline local.
- O estado inicial em Preview e Production é desabilitado.
- A habilitação inicial exige redeploy do ambiente afetado; mudanças ordinárias de configuração após o cutover não exigem redeploy.
- `docs/platform-config.md` registra finalidade, escopo, estado operacional e progressão Preview → Production antes de o código consumir a variável.

### 1.5.1. Sequência executável do PR único e do cutover

- A E21.2.3 e a E21.2.4 são implementadas sequencialmente na mesma branch e no mesmo PR, sempre com `OPENAI_OPERATIONAL_CONFIG_ENABLED` ausente ou diferente de `true` durante a implementação e as validações pré-merge.
- O checkpoint pré-merge da E21.2.3 comprova migration, SQL tests, contratos, grants/RLS/RPCs, bootstrap, adapter, resolver, callsites, proveniência e comportamento gate-off. Ele não declara migration aplicada, Security Controls aprovados nem cutover concluído.
- A E21.2.4 pode iniciar após esse checkpoint técnico pré-merge da E21.2.3, preservando sua dependência lógica do agregado e do resolver já implementados, mas sem exigir evidência hospedada que só pode existir após o merge.
- O único merge ocorre com o runtime compatível ativo pelo `repo_catalog` e toda a superfície dinâmica protegida pelo gate server-side.
- Após o merge humano, a sequência operacional obrigatória é:
  1. o workflow canônico aplica a migration;
  2. o snippet SQL e o Security Controls Dashboard comprovam bootstrap, constraints, RLS, grants, RPCs e exposição;
  3. o gate é habilitado somente em Preview e o deployment correspondente é validado;
  4. o smoke completo comprova candidata, prova, promoção, ativação, próxima execução, isolamento de Production e rollback;
  5. somente após Preview aprovado o gate pode ser habilitado em Production, seguido do smoke mínimo de Production.
- Falha em apply, snippet, Security Controls, Preview ou Production mantém ou restaura o gate como desabilitado no ambiente afetado; nunca autoriza `repo_catalog` como fallback enquanto o gate estiver `true`.
- O ABC intermediário pode registrar código entregue e gates hospedados pendentes. A conclusão operacional da E21.2 e o ABC final somente podem registrar cutover concluído depois de todas as evidências pós-merge.
- Essa sequência não cria PR precursor, segundo PR, branch de migration separada nem apply remoto pré-merge.

### 1.6. Granularidade e allowlist operacional

- Workloads textuais expõem operacionalmente somente `model + reasoning effort`.
- `landing_page_draft_image_generation` expõe operacionalmente somente `model + quality`.
- No workload de imagem, `size`, `format`, `compression` e `moderation` permanecem determinísticos e versionados em código.
- Identidade do workload, classificação, modalidade/API, consumer, fallback, prompt, schema funcional, limites funcionais, persistência de resultado e contratos de domínio permanecem versionados em código.
- `supabase_inspect` continua como referência operacional externa e não entra na mutação dinâmica dos workloads de produto.
- A allowlist inicial é fechada e idêntica para os três workloads textuais `niche_resolution`, `commercial_activation_draft_generation` e `landing_page_draft_generation`:
  - `gpt-5.4-mini` com `none | low | medium | high | xhigh`;
  - `gpt-5.6-luna` com `none | low | medium | high | xhigh | max`.
- O workload `landing_page_draft_image_generation` aceita exclusivamente:
  - `gpt-image-2` com `quality = low | medium | high`.
- `auto` não é persistido como qualidade operacional.
- Não há identificador livre, modelo adicional, effort adicional, qualidade adicional nem combinação cruzada entre modalidades.
- O registry mantém a declaração separada por workload mesmo quando os três workloads textuais compartilham inicialmente o mesmo conjunto, permitindo restrição futura somente por novo recorte aprovado.
- A combinação é validada novamente antes da prova e antes da promoção da candidata.

### 1.7. Fronteira E21.2 × E21.3

- A E21.2 responde como uma configuração é proposta, validada operacionalmente, ativada, resolvida e revertida.
- A E21.3 responde qual configuração demonstrou melhor relação de qualidade, custo, latência e estabilidade e quais evidências sustentam a troca.
- O histórico da E21.2 registra lifecycle e ativações; não produz benchmark, ranking ou vencedor entre modelos/configurações.
- Evidências futuras da E21.3 podem ser referenciadas pela superfície administrativa sem serem duplicadas ou produzidas pela E21.2.

## 2. Contrato do caso

### 2.1. Fluxo lógico e API comum

- Gatilho administrativo: `platform_admin` abre o inventário e escolhe alterar a configuração de um workload em Production ou Preview.
- Entrada: ambiente, workload e parâmetros operacionais aplicáveis à modalidade.
- Processamento: preparar candidata → validar deterministicamente → executar prova operacional aplicável → registrar revisão validada e imutável → ativação humana explícita → resolver a nova configuração nas execuções seguintes.
- Persistência: Supabase mantém a candidata corrente, revisões validadas e eventos de ativação/rollback.
- Consumo: consumers continuam chamando a API pública de `lib/openai-workloads/`; não conhecem tabela, RPC ou residência técnica.
- Os resolvers públicos preservam nomes e formatos funcionais, mas passam a ser assíncronos e recebem o ambiente operacional necessário à resolução.
- Production/Preview com o gate ativo retornam configuração com origem `supabase_operational` e revisão decimal derivada de `revision_number`; Development e o modo pré-cutover retornam origem `repo_catalog`.
- Proveniência histórica `repo_catalog` continua legível. Novas execuções gerenciadas após o cutover registram `supabase_operational` e a revisão resolvida.
- Todos os callsites dos quatro workloads de produto devem aguardar o resolver antes do transporte OpenAI e manter seus fallbacks funcionais atuais.
- Para a E21.2, “preservar a API pública e os consumers” significa preservar:
  - o boundary público `lib/openai-workloads/` e seus nomes de resolver;
  - as identidades dos workloads;
  - os resultados discriminados e a separação texto/imagem;
  - o ownership de prompt, schema, transporte, fallback e persistência funcional nos domínios consumidores.
- O único delta técnico autorizado na chamada pública é:
  - o resolver passar a retornar `Promise`;
  - receber o ambiente operacional explícito;
  - ampliar origem e revisão para representar `repo_catalog` ou `supabase_operational`.
- Os quatro callsites podem ser alterados somente para aguardar o resolver, fornecer o ambiente pelo helper comum, consumir a configuração resolvida e preservar seus fallbacks e efeitos funcionais atuais.
- Nenhuma refatoração funcional adicional do consumer, cliente OpenAI universal, transporte comum ou mudança de domínio é autorizada por esse delta.

### 2.2. Responsabilidades e caminhos

- Contratos, registry, allowlists, validações, lifecycle e resolução permanecem em `lib/openai-workloads/`.
- O acesso à residência operacional fica em `lib/openai-workloads/adapters/operationalConfigurationAdapter.ts`.
- `lib/supabase/service.ts` permanece somente como infraestrutura server-side compartilhada; comentário restritivo incompatível com o uso aprovado deve ser atualizado sem criar cliente paralelo.
- Mutações administrativas ficam em `app/admin/(protected)/workloads-openai/actions.ts`.
- Estado interativo de apresentação fica apenas sob `app/admin/(protected)/workloads-openai/_components/`.
- Página e componentes não importam tipos de linha, RPCs ou cliente Supabase.
- Cada Server Action reexecuta `requirePlatformAdmin()`; o resultado existente do gate pode evoluir para fornecer `actorUserId`, que nunca é aceito de formulário, query string ou payload cliente.
- Não criar novo guard, provider, `lib/admin`, adapter administrativo paralelo ou acesso direto ao banco pelo client.

### 2.3. Contrato físico mínimo no Supabase

- O agregado usa três tabelas públicas, com nomes canônicos:
  1. `openai_workload_operational_configurations`: uma linha por `environment + workload`, com ponteiros obrigatórios para revisão ativa após bootstrap e, de forma mutuamente exclusiva, candidata mutável ou revisão validada pendente;
  2. `openai_workload_configuration_revisions`: snapshots append-only validados, com UUID, ambiente, workload, `revision_number` inteiro positivo e único na unidade, modelo, exatamente um entre `reasoning_effort` e `quality`, validador, timestamp e metadados seguros da prova;
  3. `openai_workload_configuration_activations`: eventos append-only `bootstrap | activate | rollback`, com ambiente, workload, revisão alvo, ator e timestamp; ator nulo somente em `bootstrap`.
- Constraints limitam ambiente a `production | preview`, workload aos quatro produtos conhecidos e shape à modalidade correta.
- PKs explícitas, FKs indexadas e índices compostos/partials mínimos sustentam leitura da unidade, unicidade de revisão e consultas de histórico.
- A integridade da unidade é impedida no banco, não apenas verificada por adapter ou snippet:
  - `openai_workload_configuration_revisions` possui chave candidata única para `(id, environment, workload)`;
  - os ponteiros ativo e validado pendente de `openai_workload_operational_configurations` usam FKs compostas `(revision_id, environment, workload)` para a revisão da mesma unidade;
  - `openai_workload_configuration_activations` usa FK composta `(target_revision_id, environment, workload)` para a revisão alvo da mesma unidade;
  - todas essas relações usam ações referenciais explícitas e restritivas, sem cascade que possa apagar ou reassociar histórico;
  - nenhuma RPC pode trocar ambiente ou workload de candidata, revisão ou evento.
- O snippet SQL comprova essas constraints e também procura drift; ele não substitui a proteção física.
- Não existe `UPDATE` ou `DELETE` de revisão validada ou evento de ativação.
- RPCs transacionais, versionadas e com token otimista implementam: salvar/editar candidata, descartar candidata, promover candidata após prova, ativar revisão validada e executar rollback.
- Cada RPC bloqueia a unidade `environment + workload` na mesma ordem, revalida o estado e torna troca de ponteiro/evento atômica.
- Funções usam `SECURITY INVOKER` e `search_path` fixo. `EXECUTE` é revogado de `PUBLIC`, `anon`, `authenticated` e `ai_readonly`, ficando apenas com `service_role`.
- RLS é habilitado sem policies permissivas. Acesso direto às tabelas é revogado de `PUBLIC`, `anon`, `authenticated` e `ai_readonly`; `service_role` recebe apenas os grants necessários.
- O schema `public` é aceito porque o adapter server-side usa a Data API; exposição é controlada por RLS e grants explícitos. Não criar view salvo necessidade indispensável; se criada, deve respeitar o invoker.
- A migration é forward-only, idempotente onde aplicável ao bootstrap e acompanhada da atualização de `docs/schema.md`.

### 2.4. Bootstrap e invariantes verificáveis

- O bootstrap cria exatamente oito unidades, oito revisões validadas e oito eventos `bootstrap`, sem candidata nem revisão pendente:
  - Production + Preview × `niche_resolution`: `gpt-5.4-mini + none`;
  - Production + Preview × `commercial_activation_draft_generation`: `gpt-5.4-mini + none`;
  - Production + Preview × `landing_page_draft_generation`: `gpt-5.6-luna + max`;
  - Production + Preview × `landing_page_draft_image_generation`: `gpt-image-2 + medium`.
- O registry deixa de ser fonte ativa de Production/Preview após o cutover e conserva identidade, classificação, consumer, fallback, modalidade, baseline de Development e allowlist.
- Um snippet SQL versionado e read-only em `supabase/snippets/` deve provar, em saída revisável:
  - presença das oito baselines esperadas;
  - exatamente uma ativa por unidade;
  - no máximo uma substituição pendente por unidade;
  - inexistência de ativa duplicada;
  - referências válidas entre unidade, revisão e evento;
  - coerência de ambiente, workload, modalidade e lifecycle.

### 2.5. Lifecycle mínimo e concorrência

- `candidate` é estado mutável, sem efeito no runtime; pode ser corrigido ou descartado e carrega versão otimista.
- `validated` é snapshot imutável produzido após gates determinísticos e prova operacional; recebe revisão estável e fica elegível para ativação.
- `active` é a revisão validada selecionada pelo último evento válido para a unidade e é a única usada nas chamadas seguintes.
- `historical` é uma revisão validada preservada; pode voltar a ser ativa somente por rollback humano explícito.
- Promover candidata remove a candidata e instala a revisão pendente na mesma transação. Ativar ou fazer rollback troca a revisão ativa, limpa a pendência aplicável e grava o evento na mesma transação.
- Token otimista desatualizado, concorrência, duplicidade ou transição incompatível falham sem alteração parcial.
- Ativação e rollback preservam ator, instante e revisão alvo suficientes para reconstruir a sequência operacional.

### 2.6. Validação e prova operacional

- Gates determinísticos mínimos:
  - ambiente gerenciado suportado;
  - workload conhecido e de produto;
  - modalidade preservada;
  - apenas parâmetros autorizados para a modalidade;
  - combinação presente na allowlist específica do workload;
  - ausência de tentativa de alterar prompt, schema funcional, fallback ou parâmetro estrutural fora do recorte.
- A prova injeta temporariamente a candidata no transporte de domínio existente, sem ativá-la e sem persistir resultado funcional:
  - `niche_resolution`: caminho de `openAiResolver`;
  - `commercial_activation_draft_generation`: adapter OpenAI da ativação comercial;
  - `landing_page_draft_generation`: geração textual da LP;
  - `landing_page_draft_image_generation`: geração de imagem da LP.
- A prova usa fixture determinística segura, valida o contrato técnico real do workload, guarda somente metadados permitidos e nunca publica ou altera estado visível ao cliente.
- Falha na prova mantém a configuração como candidata e inelegível. A prova não mede vencedor, qualidade comparativa, custo-benefício ou estabilidade representativa.
- Testes locais permanecem mockados. O smoke hospedado autorizado reutiliza a `OPENAI_API_KEY` já aprovada para o projeto sem copiá-la, exibi-la ou persisti-la no worktree.

### 2.7. Resolução dinâmica e comportamento de falha

- Em Production e Preview após o cutover, o resolver consulta em cada execução a configuração ativa correspondente por adapter server-side autorizado; não há cache operacional neste recorte.
- A alteração ativada deve ser observada pela execução subsequente sem redeploy.
- Somente configuração válida e ativa atravessa o boundary até o consumer.
- Falha de leitura, duplicidade de ativa, referência inválida, revisão inconsistente, payload incompatível ou ambiente desconhecido retorna falha de configuração antes do transporte OpenAI.
- Não existe escolha automática de outra revisão nem degradação para modelo considerado mais barato, seguro ou conhecido.
- O modo pré-cutover controlado pelo gate não é fallback em erro. Depois de `OPENAI_OPERATIONAL_CONFIG_ENABLED=true`, erro de Supabase nunca consulta `repo_catalog`.

### 2.8. Segurança e autoridade

- Toda leitura ou mutação administrativa permanece server-side e protegida pelo gate de plataforma vigente.
- Owner/admin de conta não recebe autoridade por pertencer a um tenant.
- UI/client não escreve diretamente no Supabase e não fornece identidade do ator.
- Secrets, API keys, prompts, respostas integrais, payloads de negócio, PII e raciocínio privado não integram configuração, prova ou histórico.
- Logs e observabilidade contêm somente ambiente, workload, origem, revisão, estado seguro, código de erro sanitizado e IDs técnicos já autorizados.
- Após aplicar a migration no ambiente autorizado e antes do cutover, o Security Controls Dashboard do Supabase deve confirmar roles, RLS, policies, grants e exposição. Alerta incompatível bloqueia o cutover.
- O snippet SQL versionado também é gate de cutover; qualquer invariante reprovada bloqueia a ativação do modo dinâmico.

### 2.9. UX administrativa mínima

- Evoluir `/admin/workloads-openai`, preservando shell e proteção vigentes.
- A página hidrata Production e Preview pelo adapter e apresenta `supabase_inspect` separadamente como referência read-only.
- `landing_page_draft_generation` e `landing_page_draft_image_generation` continuam independentes, agrupados visualmente sob `Geração da Landing Page`.
- O detalhe mostra ambiente, ativa, candidata, validação, pendência, revisões históricas, ator/data das ativações e ações permitidas pelo estado.
- Para texto, o formulário expõe `model + reasoning effort`; para imagem, `model + quality`.
- Inputs derivam da allowlist do workload e mensagens distinguem falha de validação, concorrência, prova, ativação e leitura.
- A UX deve passar por teste de reconhecimento: uma pessoa autorizada consegue distinguir, sem inferência técnica, configuração ativa, candidata editável, revisão validada pendente, ação de ativação e rollback.
- A UX não apresenta benchmark, ranking ou recomendação automática.

### 2.10. Critérios de aceite e validação transversal

- Os quatro workloads continuam resolvidos pela API pública de `lib/openai-workloads/`.
- Production e Preview possuem configurações ativas independentes no Supabase; Development permanece determinístico/local.
- Mudança ativada passa a valer na execução seguinte sem novo deployment; Production permanece inalterada durante troca controlada em Preview.
- Candidata inválida ou sem prova aprovada não pode ser promovida nem ativada.
- Ativação e rollback exigem ação explícita de `platform_admin`; usuário não autorizado falha no servidor.
- Rollback reativa revisão anteriormente validada sem recriá-la ou alterá-la.
- Falha da fonte operacional após cutover bloqueia transporte e não aciona fallback de configuração.
- Texto e imagem preservam contratos distintos e parâmetros estruturais da imagem permanecem em código.
- Testes focais cobrem validação, allowlist, resolver por ambiente/origem, adapter, concorrência/lifecycle, callsites e proveniência.
- Testes SQL cobrem constraints, grants, RLS, bootstrap, imutabilidade, transações e invariantes do snippet.
- Buscas focais no diff e nos arquivos tocados devem comprovar ausência de acesso direto de consumers ou UI ao Supabase, identificadores livres de modelo/effort/quality, fallback para `repo_catalog` com o gate ativo, secrets ou `.env`, cliente OpenAI universal e infraestrutura de AI Gateway, Vercel Flags, Global Config, Realtime, cache, tracing, drains ou automação fora do recorte; ocorrências históricas permitidas devem ser classificadas, não removidas por correspondência textual.
- `npm ci`, `npm run check` e `git diff --check` devem ser aprovados na entrega de código; `npm run build` não integra a rotina do sandbox.
- Hosted Preview QA cobre desktop e mobile, todos os estados do lifecycle, papéis positivo/negativo e estados de sucesso/erro.
- A superfície tocada passa por verificação proporcional à WCAG 2.2: teclado, foco visível e ordem, nomes/labels, mensagens de erro e feedback, contraste, alvo de toque e interação sem dependência exclusiva de hover. Ferramentas automatizadas são auxiliares; não declarar conformidade integral.
- O smoke hospedado comprova em Preview: configuração inicial, criação/edição, prova, promoção, ativação, próxima chamada usando a nova revisão, Production inalterada e rollback usando a revisão anterior.

## 3. Fases e próxima ação

### 3.1. E21.2.3 — Fonte operacional dinâmica e resolução por ambiente/workload

- Status: planejada; execução somente após aprovação do plano-base v2.
- Automação: não.
- Objetivo:
  - materializar no Supabase o agregado e suas transações;
  - bootstrapar Production e Preview com as oito configurações vigentes;
  - adaptar `lib/openai-workloads/` e os callsites para resolução assíncrona por ambiente;
  - entregar o corte expand/contract sem expor Production/Preview a runtime anterior à migration;
  - preservar Development determinístico/local e fail-closed após o cutover.
- Escopo executável:
  - migration forward-only, grants/RLS/RPCs, `docs/schema.md` e snippet SQL versionado;
  - atualizar `docs/platform-config.md` no mesmo recorte para registrar `OPENAI_OPERATIONAL_CONFIG_ENABLED`, sem versionar valor de ambiente nem criar `.env`;
  - contratos, registry/allowlist, validação, lifecycle, adapter e resolver assíncrono;
  - atualização dos quatro consumers e da proveniência;
  - gate server-side temporário pré-cutover, sem fallback após habilitação;
  - bootstrap exato das oito unidades e testes focais/SQL aplicáveis.
- Gate da fase:
  - diff restrito ao recorte e sem secret, `.env`, workflow ou segunda residência;
  - unicidade, pendência, imutabilidade, concorrência, bootstrap e grants comprovados;
  - consumers usam somente o boundary comum e bloqueiam transporte em erro pós-cutover;
  - Security Controls Dashboard e snippet SQL sem alerta incompatível antes de habilitar o gate;
  - buscas focais do recorte aprovadas conforme §2.10, com ocorrências históricas permitidas classificadas e sem remoção lateral;
  - `npm ci`, `npm run check` e `git diff --check` aprovados.
- ABC da fase:
  - delta-only para os documentos canônicos realmente afetados, após aprovação técnica da subseção e antes de seguir à E21.2.4;
  - não registrar como concluído o cutover hospedado enquanto migration, inspeção e habilitação não estiverem comprovadas.

### 3.2. E21.2.4 — Gestão administrativa, validação, ativação e rollback

- Status: planejada; depende do checkpoint técnico pré-merge da E21.2.3. O cutover hospedado permanece bloqueado até o apply e os gates operacionais pós-merge definidos em 1.5.1.
- Automação: não.
- Objetivo:
  - evoluir o Admin Dashboard para gerir candidata, validação, ativação, histórico e rollback;
  - executar prova operacional controlada por workload sem incorporar benchmarking da E21.3.
- Escopo executável:
  - Server Actions com reautorização e ator derivado do servidor;
  - listagem/detalhe Production/Preview e referência separada de `supabase_inspect`;
  - formulários derivados da allowlist, lifecycle e mensagens de erro seguras;
  - prova pelos quatro transportes reais, promoção, ativação e rollback transacionais;
  - reconhecimento de estados, acessibilidade proporcional e QA hospedada.
- Gate da fase:
  - candidata reprovada permanece inelegível e sem efeito no runtime;
  - candidata validada somente entra em uso após ativação humana;
  - próxima execução usa a ativa, Preview não altera Production e rollback restaura a anterior;
  - usuário sem `platform_admin` não lê nem muta a gestão dinâmica;
  - desktop/mobile, papéis positivo/negativo, lifecycle, sucesso/erro e checklist WCAG proporcional aprovados;
  - smoke hospedado executado com a credencial já aprovada, sem secret no repositório ou logs.
- ABC da fase:
  - delta-only final para documentos canônicos realmente afetados, registrando separadamente código entregue e gates hospedados concluídos ou pendentes;
  - não marcar a E21.3 como iniciada e não ampliar o roadmap além da E21.2.

### 3.3. Próxima ação

- Submeter esta v2 à Passagem 1 do Analista sem opiniões especialistas nem matriz.
- Após a resposta, consolidar matriz integral de tratamentos e executar a Passagem 2 com a mesma instância do Analista.
- Somente após `plan-v2-approved` iniciar E21.2.3 e avançar uma subseção canônica por vez, com validação, ABC e avaliação do Analista nos gates previstos.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não implementar E21.3, benchmarking, ranking, recomendação automática ou escolha de configuração por qualidade/custo.
- Não reabrir E19.4 nem alterar sua revisão 3 baseline.
- Não alterar E21.1 além do necessário para substituir a origem da configuração dentro do boundary já criado.
- Não incluir `supabase_inspect` na mutação dinâmica dos workloads de produto.
- Não usar Vercel Global Config, Vercel Flags, AI Gateway, Realtime, cache operacional, tracing, Log Drains ou nova plataforma.
- Não criar default universal de modelo, effort ou parâmetros de mídia.
- Não tornar `size`, `format`, `compression` ou `moderation` da imagem mutáveis neste recorte.
- Não mover prompt, schema funcional, fallback, persistência de resultado ou regra de negócio para o boundary comum.
- Não criar cliente OpenAI universal, router, engine, agente, job, fila, cron ou workflow próprio.
- Não criar automação de seleção, validação recorrente ou ativação.
- Não expor secret, prompt, resposta integral, PII, payload de negócio ou raciocínio privado no histórico, UI ou logs.
- Não incluir monitoramento de saldo/créditos da conta OpenAI.
- Não copiar ou persistir `OPENAI_API_KEY` no worktree; a chave aprovada é usada somente pelo ambiente autorizado no smoke.
- Não criar segundo PR, branch de migration separada, sincronização preventiva com `main`, merge local ou merge automático.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se a implementação exigir mudar a unidade `ambiente + workload`, introduzir outra residência além de Supabase ou tornar Development parte da gestão dinâmica.
- Parar se houver necessidade de mais de uma candidata/substituição pendente simultânea por unidade.
- Parar se a prova exigir benchmark comparativo, decisão autônoma ou automação material não prevista.
- Parar se algum workload exigir parâmetro estrutural dinâmico sem decisão humana específica.
- Parar se consumers precisarem conhecer diretamente Supabase ou se surgir necessidade de cliente OpenAI universal.
- Parar se o gate expand/contract não puder impedir runtime dinâmico antes da migration ou se erro pós-cutover puder cair em `repo_catalog`.
- Parar o cutover se Security Controls, snippet SQL, grants/RLS, bootstrap ou inspeção hospedada apresentarem incompatibilidade.
- Parar a E21.2.4 se teste de reconhecimento, acesso, Preview QA, acessibilidade proporcional, troca controlada ou rollback falhar.
- Parar se `Automação: não` deixar de atender ao requisito real do recorte.

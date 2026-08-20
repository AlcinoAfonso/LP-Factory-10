20/08/2026 — Plano-base v1 — E21.2 — Configuração operacional dinâmica dos workloads OpenAI

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado após encerramento do debate humano e avaliação preliminar do Analista.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.2 — Configuração operacional dinâmica dos workloads OpenAI`.
- Plano conceitual: N/A.
- A E21.1 permanece implementada, validada e preservada como fundação e boundary transversal.
- A E21.3 permanece como próxima evolução de evidências e avaliação de custo-benefício e não integra o recorte executável da E21.2.
- Não permanece questão humana indispensável aberta para a v1; detalhes de schema, adapters, mutações e prova operacional por workload pertencem à consolidação técnica v2 dentro deste contrato.

### 1.2. Objetivo

- Permitir que `platform_admin` consulte e altere pelo Admin Dashboard a configuração operacional dos workloads OpenAI de produto.
- Fazer com que uma configuração ativada passe a ser usada nas execuções seguintes do workload no ambiente correspondente sem commit, PR ou redeploy.
- Preservar candidata, validação, ativação humana, histórico e rollback sem transformar a E21.2 em seleção autônoma de modelo ou laboratório de benchmarking.
- Preservar os consumers e a API pública do boundary `lib/openai-workloads/`, substituindo somente a origem efetiva da configuração em Production e Preview.

### 1.3. Fontes usadas

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
- `docs/schema.md`, consultado após a decisão de usar Supabase como residência operacional.
- Estado factual complementar: `lib/openai-workloads/contracts.ts`, `lib/openai-workloads/registry.ts`, `lib/openai-workloads/resolve.ts` e `app/admin/(protected)/workloads-openai/page.tsx`.
- Documentação oficial Vercel Global Config, consultada apenas para a comparação de residência operacional.

### 1.4. Decisões fixas do recorte

- A unidade operacional é `ambiente + workload`; não existe default universal de modelo, effort ou configuração de mídia.
- Production e Preview usam configuração dinâmica independente; Development permanece determinístico/local e fora da gestão dinâmica v1.
- Não existe promoção automática de Preview para Production; qualquer ativação em cada ambiente é humana e explícita.
- Existe exatamente uma configuração ativa por `ambiente + workload`.
- No MVP existe no máximo uma substituição pendente por `ambiente + workload`, esteja ela em preparação como candidata ou já validada aguardando ativação.
- Somente `platform_admin` pode criar/editar candidata, iniciar sua validação, ativar configuração e executar rollback.
- Recomendações de Estrategista, Analista, Gestores ou futura E21.3 não alteram automaticamente a configuração ativa.
- Toda candidata precisa cumprir validações determinísticas e uma prova operacional adequada ao workload antes de ficar apta à ativação.
- A ativação final é sempre humana.
- Rollback é uma nova ação humana de ativação que referencia uma revisão anteriormente validada; não duplica nem altera a revisão histórica restaurada.
- A resolução em Production e Preview é fail-closed: fonte indisponível, configuração ausente, inválida ou inconsistente bloqueia o transporte OpenAI e não autoriza fallback silencioso para `repo_catalog`, modelo anterior, default do provedor ou outra revisão.
- O fallback funcional permanece responsabilidade de cada consumer conforme E21.1 e seus contratos próprios.
- O núcleo da E21.2 é determinístico. A prova operacional pode executar o workload OpenAI candidato, mas isso é validação e não decisão autônoma.
- Automação: não. Não criar categoria de automação, agente, job ou workflow próprio para a E21.2.

### 1.5. Residência operacional

- Supabase é a residência operacional aprovada para as configurações dinâmicas, revisões e histórico mínimo da E21.2.
- A escolha prioriza a stack base já adotada e o ciclo `candidata → validada → ativação → histórico → rollback`, evitando introduzir uma segunda residência apenas para configuração.
- Vercel Global Config foi considerada tecnicamente elegível para configuração mutável sem redeploy, mas foi rejeitada para este recorte porque o requisito inclui lifecycle, histórico, autoria e rollback estruturados que o projeto já pode concentrar no Supabase.
- A decisão autoriza a persistência mínima necessária no Supabase; quantidade, nomes e desenho exato dos objetos pertencem à v2 e devem seguir `docs/schema.md`, `docs/base-tecnica.md` e o princípio de menor complexidade suficiente.
- Vercel continua sendo runtime/deploy do Core; a E21.2 não cria dependência de Global Config.

### 1.6. Granularidade por modalidade

- Workloads textuais expõem operacionalmente `model + reasoning effort`.
- `landing_page_draft_image_generation` expõe operacionalmente `model + quality`.
- No workload de imagem, `size`, `format`, `compression` e `moderation` permanecem determinísticos e versionados em código neste recorte, pois participam do contrato técnico de apresentação, Storage ou segurança.
- Identidade do workload, classificação, modalidade/API, consumer, fallback, prompt, schema funcional, limites funcionais, persistência de resultado e contratos de domínio permanecem versionados em código.
- `supabase_inspect` continua como referência operacional externa e não entra na mutação dinâmica dos workloads de produto.

### 1.7. Fronteira E21.2 × E21.3

- A E21.2 responde como uma configuração é proposta, validada operacionalmente, ativada, resolvida e revertida.
- A E21.3 responde qual configuração demonstrou melhor relação de qualidade, custo, latência e estabilidade e quais evidências sustentam a troca.
- O histórico da E21.2 registra lifecycle e ativações; não produz benchmark, ranking ou vencedor entre modelos/configurações.
- Evidências futuras da E21.3 podem ser referenciadas pela superfície administrativa sem serem duplicadas ou produzidas pela E21.2.

## 2. Contrato do caso

### 2.1. Fluxo lógico

- Gatilho administrativo: `platform_admin` abre o inventário de workloads e escolhe alterar a configuração de um workload em Production ou Preview.
- Entrada: ambiente, workload e parâmetros operacionais aplicáveis à modalidade.
- Processamento: preparar candidata → validar deterministicamente → executar prova operacional aplicável → tornar a configuração validada e imutável → ativação humana explícita → resolver a nova configuração nas execuções seguintes.
- Validação: somente configuração compatível com o workload e aprovada nos gates do recorte pode ser ativada.
- Persistência: Supabase mantém a candidata corrente e as revisões validadas/ativações necessárias para histórico e rollback; o desenho físico mínimo é fechado na v2.
- Consumo: consumers continuam chamando a API pública de `lib/openai-workloads/`; não conhecem tabela, query ou residência técnica.
- Fallback: ausência ou falha da configuração operacional em Production/Preview interrompe a chamada antes do provider; cada consumer aplica apenas seu fallback funcional já autorizado.

### 2.2. Bootstrap e cutover

- As configurações efetivas vigentes do `repo_catalog` são a baseline do bootstrap da E21.2.
- Production e Preview devem iniciar com revisões ativas equivalentes às configurações efetivas vigentes, preservando workload, modalidade e parâmetros aplicáveis.
- Essas revisões iniciais podem ser tratadas como previamente validadas porque correspondem às configurações já comprovadas pela E21.1 e, quando aplicável, pelas execuções hospedadas da E19.4.
- O cutover não altera cada consumer individualmente; altera a resolução interna do boundary comum.
- Após o cutover aprovado, Production e Preview não usam `repo_catalog` como fallback operacional.
- Development continua usando configuração determinística/local e não participa do histórico operacional da E21.2.

### 2.3. Lifecycle mínimo

- `candidate`:
  - configuração de trabalho mutável e ainda sem efeito no runtime;
  - pode ser corrigida após falha de validação ou descartada pelo `platform_admin`;
  - não entra como revisão histórica imutável enquanto não for validada.
- `validated`:
  - snapshot imutável produzido quando a candidata cumpre os gates determinísticos e a prova operacional;
  - recebe revisão estável e fica elegível para ativação humana.
- `active`:
  - revisão validada selecionada pela última ativação válida para aquele `ambiente + workload`;
  - é a única configuração usada nas chamadas seguintes.
- `historical`:
  - revisão validada que já foi ativa ou permanece preservada para rastreabilidade;
  - pode voltar a ser ativa somente por rollback humano explícito.
- Ativação e rollback devem preservar ator, instante e revisão alvo suficientes para reconstruir a sequência operacional.
- O lifecycle não cria estados adicionais por conveniência; eventual representação física distinta entre status e eventos é decisão técnica da v2.

### 2.4. Validação da candidata

- Gates determinísticos mínimos:
  - ambiente suportado pela gestão dinâmica;
  - workload conhecido e de produto;
  - modalidade preservada;
  - presença apenas dos parâmetros operacionais autorizados para a modalidade;
  - combinação de modelo/parâmetros compatível com o contrato aprovado;
  - ausência de tentativa de alterar prompt, schema funcional, fallback ou parâmetro estrutural fora do recorte.
- Prova operacional:
  - executa a configuração candidata sem torná-la ativa;
  - comprova que o workload consegue atravessar seu contrato real até um resultado tecnicamente válido;
  - não publica nem altera silenciosamente estado visível ao cliente;
  - não mede vencedor, qualidade comparativa, custo-benefício ou estabilidade representativa.
- O mecanismo exato da prova operacional é definido por workload na v2, reutilizando contratos e pontos de injeção existentes quando aplicáveis e sem criar automação própria.
- Falha na prova mantém a configuração como candidata e inelegível para ativação.

### 2.5. Resolução dinâmica e comportamento de falha

- Em Production e Preview, o resolver comum consulta a configuração ativa correspondente a `ambiente + workload` por caminho server-side autorizado.
- A alteração ativada deve ser observada pela execução subsequente do workload sem redeploy; estratégia de cache, se existir, não pode violar essa semântica.
- Somente configuração válida e ativa atravessa o boundary até o consumer.
- Falha de leitura, duplicidade de ativa, referência inválida, revisão inconsistente ou payload incompatível retorna falha de configuração antes do transporte OpenAI.
- Não existe escolha automática de outra revisão nem degradação para um modelo considerado mais barato, seguro ou conhecido.

### 2.6. Segurança e autoridade

- Toda leitura ou mutação administrativa da E21.2 permanece server-side e protegida pelo gate de plataforma vigente.
- Owner/admin de conta não recebe autoridade por pertencer a um tenant.
- UI/client não escreve diretamente no Supabase para criar candidata, validar, ativar ou executar rollback.
- O desenho de banco deve ser fail-closed e impedir mais de uma ativa por `ambiente + workload` e mais de uma substituição pendente no lifecycle do MVP.
- Secrets, API keys, prompts, respostas integrais, payloads de negócio, PII e raciocínio privado não integram a configuração nem seu histórico.
- A rastreabilidade operacional deve registrar somente metadados necessários de configuração, ator, revisão, timestamps e resultado seguro de validação/ativação.

### 2.7. UX administrativa mínima

- Evoluir a página existente `/admin/workloads-openai`, preservando o shell e a proteção administrativa vigentes.
- A lista mostra os workloads de produto e sua configuração ativa por ambiente; `supabase_inspect` permanece como referência externa read-only.
- `landing_page_draft_generation` e `landing_page_draft_image_generation` continuam workloads técnicos independentes, mas aparecem agrupados visualmente sob a função `Geração da Landing Page`.
- O detalhe de um workload deve mostrar, quando aplicável:
  - ambiente selecionado;
  - configuração ativa;
  - candidata corrente;
  - estado da validação;
  - revisões validadas/históricas;
  - ator e data das ativações/rollbacks relevantes;
  - ações humanas `Criar/editar candidata`, `Validar`, `Ativar` e `Rollback` conforme estado.
- Para texto, o formulário expõe `model + reasoning effort`.
- Para imagem, o formulário expõe `model + quality`.
- Os inputs devem impedir combinações incompatíveis ou não suportadas; o mecanismo exato de catálogo/allowlist é definido na v2 com base no contrato do workload e documentação oficial vigente da OpenAI.
- A UX não apresenta benchmark, ranking ou recomendação automática como decisão da E21.2.

### 2.8. Critérios de aceite transversais

- Os quatro workloads de produto continuam resolvidos pela API pública de `lib/openai-workloads/`.
- Production e Preview possuem configurações ativas independentes em Supabase; Development permanece determinístico/local.
- Mudança ativada em um workload passa a valer na execução seguinte sem novo deployment.
- Uma candidata inválida ou sem prova operacional aprovada não pode ser ativada.
- A ativação exige ação explícita de `platform_admin`.
- Rollback reativa revisão anteriormente validada sem recriar ou alterar essa revisão.
- Falha da fonte operacional bloqueia o transporte e não aciona fallback silencioso de configuração.
- Texto preserva `model + reasoning effort`; imagem preserva `model + quality` como parâmetros operacionais e mantém os demais parâmetros aprovados no código.
- A página administrativa distingue claramente configuração ativa, candidata/validada e histórico, incluindo o agrupamento funcional da geração da LP.
- Acesso negativo de usuário sem autoridade de plataforma permanece bloqueado.
- Nenhum benchmark da E21.3, agente, job, workflow ou seleção autônoma é introduzido.

## 3. Fases e próxima ação

### 3.1. E21.2.3 — Fonte operacional dinâmica e resolução por ambiente/workload

- Status: planejada.
- Automação: não.
- Objetivo:
  - materializar no Supabase a persistência mínima de configuração dinâmica e histórico necessário;
  - bootstrapar Production e Preview a partir das configurações efetivas vigentes;
  - adaptar `lib/openai-workloads/` para resolver a fonte ativa por `ambiente + workload` sem alterar os consumers;
  - preservar Development determinístico/local e fail-closed em Production/Preview.
- Entregas mínimas:
  - schema/migration mínima conforme `docs/schema.md` e `docs/base-tecnica.md`;
  - boundary/adapters server-side necessários, sem acesso direto da UI ao banco;
  - contratos discriminados de texto e imagem preservados;
  - configuração inicial ativa equivalente ao baseline vigente nos dois ambientes gerenciados;
  - resolução dinâmica sem fallback para `repo_catalog` em Production/Preview.
- Critérios de aceite:
  - unicidade de ativa e de substituição pendente por `ambiente + workload` comprovada;
  - bootstrap íntegro dos workloads de produto;
  - consumers existentes continuam recebendo configuração pelo boundary comum;
  - alteração controlada da configuração é observável sem redeploy;
  - falhas de configuração bloqueiam transporte antes do provider;
  - `supabase_inspect` permanece fora da mutação dinâmica;
  - validações técnicas e de banco aplicáveis aprovadas.

### 3.2. E21.2.4 — Gestão administrativa, validação, ativação e rollback

- Status: planejada.
- Automação: não.
- Dependência: E21.2.3 aprovada.
- Objetivo:
  - evoluir o Admin Dashboard para gerir candidata, validação, ativação, histórico e rollback dentro do contrato aprovado;
  - permitir prova operacional controlada por workload sem incorporar benchmarking da E21.3.
- Entregas mínimas:
  - listagem/detalhe administrativo com Production e Preview;
  - UX agrupada para os workloads de texto e imagem da geração da Landing Page;
  - criação/edição de candidata com parâmetros permitidos por modalidade;
  - gates determinísticos e prova operacional adequada ao workload;
  - ativação humana e rollback para revisão validada;
  - histórico mínimo de revisões/ativações com ator e timestamps necessários.
- Critérios de aceite:
  - candidata reprovada permanece inelegível e não altera runtime;
  - candidata validada somente entra em uso após ativação humana;
  - próxima execução usa a nova ativa sem redeploy;
  - rollback restaura configuração validada anterior na execução seguinte;
  - texto e imagem preservam seus contratos distintos;
  - usuário sem `platform_admin` não acessa mutação;
  - desktop, mobile, teclado/foco e estados de sucesso/erro são validados na superfície tocada;
  - smoke hospedado comprova pelo menos uma troca e um rollback controlados sem ampliar o escopo para E21.3.

### 3.3. Próxima ação

- Plano-base v1 consolidado no PR #790.
- Conforme `docs/prompt-estrategista.md`, o próximo passo é a escolha humana entre:
  - Opção 1 — Processo atual;
  - Opção 2 — Processo automatizado.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não implementar E21.3, benchmarking, ranking, recomendação automática ou escolha de configuração por qualidade/custo.
- Não reabrir E19.4 nem alterar sua revisão 3 baseline.
- Não alterar E21.1 além do necessário para substituir a origem da configuração dentro do boundary já criado.
- Não incluir `supabase_inspect` na mutação dinâmica dos workloads de produto.
- Não usar Vercel Global Config neste recorte.
- Não criar default universal de modelo, effort ou parâmetros de mídia.
- Não tornar `size`, `format`, `compression` ou `moderation` da imagem mutáveis na E21.2 v1.
- Não mover prompt, schema funcional, fallback, persistência de resultado ou regra de negócio para o boundary comum.
- Não criar cliente OpenAI universal, router, engine, agente, job, fila ou workflow próprio.
- Não criar automação de seleção ou ativação.
- Não expor secret, prompt, resposta integral, PII ou payload de negócio no histórico administrativo.
- Não incluir monitoramento de saldo/créditos da conta OpenAI neste recorte.

### 4.2. Critérios de parada

- Parar e devolver ao Estrategista se a implementação exigir mudar a unidade `ambiente + workload`, introduzir outra residência além de Supabase ou tornar Development parte da gestão dinâmica.
- Parar se houver necessidade de mais de uma candidata/substituição pendente simultânea por `ambiente + workload`.
- Parar se a prova operacional exigir benchmark comparativo, decisão autônoma ou automação material não prevista.
- Parar se algum workload exigir tornar dinâmico parâmetro estrutural atualmente mantido em código sem decisão humana específica.
- Parar se a mudança exigir refatorar consumers para conhecerem diretamente Supabase ou criar cliente OpenAI universal.
- Parar se a categoria `Automação: não` deixar de atender ao requisito real do recorte.

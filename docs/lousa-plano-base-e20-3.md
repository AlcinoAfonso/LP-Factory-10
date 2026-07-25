# Plano-base — E20.3 e E12.4.3–E12.4.4

- Data: 25/07/2026.
- Versão: v1.
- Status: plano-base v1 para avaliação única dos especialistas.
- Recorte principal previsto para o roadmap: `20.3 — Composição base, prontidão e autorização de geração`.
- Recorte administrativo complementar: `12.4 — Operação administrativa da E20.3`.
- Path canônico: `docs/lousa-plano-base-e20-3.md`.
- Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- O projeto já possui:
  - taxonomia ativa e administrável;
  - pesquisas estruturadas resolvidas pela E10.8 para `end_customer` e `business_buyer`;
  - parametrização raiz versionada da E18.4;
  - catálogo canônico da E18.5 com doze módulos, quatorze variantes e 34 casos executáveis;
  - catálogo declarativo de entradas da E20.2.
- Ainda não existe o terceiro critério operacional de preparação do taxon: uma composição base oficial que determine módulos, variantes e ordem para futuras LPs.
- O resultado esperado é permitir que um administrador, no Admin Dashboard:
  - solicite à IA uma proposta de composição;
  - revise e ajuste a proposta;
  - trate gaps;
  - salve e ative uma versão válida;
  - confira a prontidão separadamente por plano;
  - autorize ou revogue o uso por uma conta específica.
- A E20.3 define e persiste os contratos e estados; a E12.4.3–E12.4.4 opera as decisões humanas no Admin Dashboard.
- Este recorte não gera, renderiza, publica ou mede uma LP. A geração real permanece para a E19.4.

### 1.2. Fontes usadas

- `README.md`.
- `docs/prompt-estrategista.md`.
- `docs/template-roadmap.md`.
- `docs/roadmap.md`.
- `docs/lp-planejamento.md`.
- `docs/base-tecnica.md`.
- `docs/platform-config.md`.
- `docs/schema.md`.
- `docs/design-system.md`.
- `docs/lousa-plano-base-e18-4.md`.
- `docs/lousa-plano-base-e18-5.md`.
- `docs/lousa-plano-base-e20-2.md`.
- Contratos e implementações reais da E10.8, E18.4, E18.5, E20.2, Admin Dashboard e integrações OpenAI server-side.
- PR #628, mergeado na `main` pelo commit `9ad815ab1315d74b413e7b11835f085fe90c553a`.
- Documentação oficial da OpenAI sobre Responses API e Structured Outputs:
  - `https://developers.openai.com/api/docs/guides/structured-outputs`;
  - `https://developers.openai.com/api/docs/guides/migrate-to-responses`.

### 1.3. Decisões funcionais fixas

- Os três critérios de preparação do taxon são:
  - taxon ativo;
  - pesquisas estruturadas válidas dos dois `audienceScope`;
  - composição base ativa própria ou herdada.
- `commercial_activation` não participa desses três critérios e não será reutilizado como domínio da E20.3.
- Existe uma composição canônica por `taxon proprietário + versão`, reutilizada entre planos.
- A prontidão é avaliada separadamente por `taxon atendido + plano + versão da composição resolvida`.
- A autorização humana é específica para `conta + taxon atendido + plano`.
- Lifecycle da composição:
  - `draft`: editável e revalidável;
  - `active`: aprovada, imutável e disponível para resolução;
  - `archived`: preservada para histórico.
- “Aprovar” é a ação humana que ativa um `draft`; não existe estado persistente `approved`.
- Uma nova versão pode permanecer `draft` enquanto a versão ativa anterior continua atendendo.
- Cada módulo pode ocorrer no máximo uma vez na composição v1.
- Cada ocorrência possui variante fixa; a futura geração não escolhe outra variante.
- A composição pode preservar apenas escolhas expressamente permitidas pelo contrato raiz ou pela variante, sem criar parâmetros livres.
- A composição v1 aceita no máximo uma variante com interação `form`, validada pela capability estrutural da E18.5, sem regra nominal exclusiva para `hero.form@v1` ou `lead_capture.form@v1`.
- Gaps não criam módulos ou variantes automaticamente.
- Um gap impeditivo mantém a composição em `draft`; um gap não impeditivo só pode ser adiado por decisão humana justificada.
- Automação: não.

### 1.4. Fronteiras de responsabilidade

- A E10.8 resolve pesquisas e proveniência; a E20.3 consome o resultado sem recalcular sua herança.
- A E18.4 define a base raiz; a E20.3 não altera seus contratos.
- A E18.5 define módulos e variantes oficiais; a E20.3 somente referencia identidades e versões válidas.
- A E20.2 define entradas declarativas; a E20.3 consome sua validade por plano sem coletar valores.
- A E12.4.3 opera proposta, revisão, ativação e leitura de prontidão.
- A E12.4.4 opera autorização e revogação.
- A E9 continua sendo a fonte do entitlement comercial da conta.
- A E19.4 será o único fluxo de geração de LP por conta.
- A E20.4 e a E12.4.5–E12.4.6 permanecem responsáveis pela avaliação da LP real e liberação futura.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - administrador seleciona um taxon elegível em `/admin/templates/landing-page`;
  - administrador abre a operação do taxon em `/admin/templates/landing-page/[taxonSlug]`.
- Entrada:
  - taxon atendido e sua cadeia ativa;
  - pesquisas resolvidas pela E10.8;
  - raiz efetiva da E18.4;
  - catálogo oficial da E18.5;
  - catálogo resolvido da E20.2 para os quatro planos;
  - versão ativa anterior, quando existir.
- Processamento:
  - resolver as fontes determinísticas;
  - solicitar proposta estruturada à IA quando o administrador pedir;
  - separar composição candidata e gaps;
  - normalizar a resposta;
  - validar deterministicamente;
  - permitir revisão humana;
  - persistir `draft`;
  - ativar somente versão válida e sem gap impeditivo;
  - resolver composição própria ou herdada;
  - avaliar prontidão por plano;
  - autorizar ou revogar combinações específicas.
- Validação:
  - validar taxonomia, fontes, identidades, versões, ordem, unicidade, obrigatoriedade, opções permitidas, interação de formulário, lifecycle, gaps, herança e prontidão;
  - revalidar no servidor antes de toda persistência ou ativação;
  - nunca confiar apenas no estado enviado pelo client ou na saída da IA.
- Persistência:
  - composição e snapshots de suas referências;
  - decisão de herança;
  - gaps e decisão humana;
  - resultado de prontidão;
  - autorização e revogação.
- Consumo:
  - Admin Dashboard lê e opera a E20.3;
  - E19.4 consumirá futuramente a composição resolvida, a prontidão atual e a autorização efetiva.
- Fallback:
  - falha da IA não cria nem altera `draft`;
  - saída inválida da IA é rejeitada com código seguro e nova tentativa manual possível;
  - ausência de composição própria tenta o ancestral elegível mais próximo;
  - fonte inválida, composição inválida, gap impeditivo ou herança bloqueada falha fechado;
  - não criar composição genérica silenciosa.

### 2.2. Identidade, ownership e lifecycle

- `servedTaxon` é o taxon para o qual a prontidão ou autorização é avaliada.
- `ownerTaxon` é o taxon proprietário da composição efetivamente resolvida.
- Segmento e nicho podem possuir composição própria.
- Composição própria de ultranicho exige autorização humana explícita registrada na política do taxon.
- Deve existir no máximo uma composição `active` por `ownerTaxon`.
- Versão deve ser inteira positiva e única dentro do `ownerTaxon`.
- A versão `active` é imutável.
- Alteração de versão ativa cria novo `draft` com nova versão.
- Ativar um novo `draft` arquiva atomicamente a versão ativa anterior do mesmo `ownerTaxon`.
- `archived` não retorna a `draft` nem a `active`; recuperação exige nova versão.

### 2.3. Contrato mínimo da composição

- Identidade:
  - ID da composição;
  - `ownerTaxon`;
  - versão;
  - status.
- Referências congeladas:
  - versão da raiz e preset efetivo da E18.4;
  - versão do catálogo E18.5;
  - versões dos módulos e variantes utilizados;
  - versão e proveniência das pesquisas E10.8;
  - versão do catálogo E20.2 usada como contexto.
- Itens ordenados:
  - identidade e versão do módulo;
  - identidade e versão da variante;
  - ordem inteira contínua e sem duplicidade;
  - obrigatoriedade;
  - opções permitidas pela ocorrência, quando existirem.
- Gaps:
  - tipo `module` ou `variant`;
  - função estrutural ausente;
  - justificativa baseada nas fontes;
  - impacto;
  - caráter impeditivo;
  - decisão humana `blocking` ou `deferred`;
  - justificativa do adiamento e condição de retomada quando `deferred`.
- Proveniência:
  - origem `ai_proposal`, `human_created` ou `human_adjusted`;
  - versão do schema da proposta;
  - modelo usado quando houver IA;
  - `request_id` seguro;
  - ator e datas de criação, última alteração e ativação.
- A composição não armazena:
  - copy;
  - valores operacionais da conta;
  - LP gerada;
  - taxon atendido quando ele apenas herda a composição.

### 2.4. Proposta síncrona por IA

- A proposta ocorre somente após ação explícita do administrador.
- Provider:
  - OpenAI Responses API;
  - Structured Outputs com JSON Schema estrito;
  - chamada server-side por `fetch`, reutilizando o padrão vigente sem adicionar SDK;
  - modelo definido por env server-side própria;
  - `store: false`;
  - limite de saída e timeout explícitos.
- Entradas permitidas:
  - taxon atendido e cadeia;
  - pesquisas E10.8 já resolvidas;
  - raiz E18.4 resolvida;
  - catálogo E18.5 oficial;
  - E20.2 como contexto declarativo, sem valores concretos;
  - composição ativa anterior, somente como referência quando existir.
- Saída:
  - itens que utilizem apenas identidades oficiais;
  - ordem, obrigatoriedade e opções permitidas;
  - gaps separados;
  - justificativa curta por item e por gap.
- A resposta da IA:
  - não grava diretamente;
  - não ativa;
  - não cria identidade;
  - não altera E10.8, E18.4, E18.5 ou E20.2;
  - passa por parse, schema local e validação determinística antes de ser exibida como proposta editável.
- Observability:
  - registrar evento, `request_id`, status, latência, modelo, quantidade de itens, quantidade de gaps e código seguro de erro;
  - não registrar prompt completo, pesquisas completas, payload bruto, valores operacionais, secret ou resposta bruta.

### 2.5. Validação determinística e ativação

- Rejeitar:
  - taxon inativo ou cadeia inválida;
  - referência desconhecida, versão inexistente ou lifecycle incompatível;
  - módulo repetido;
  - variante não vinculada ao módulo;
  - ordem vazia, duplicada ou descontínua;
  - mais de uma interação `form`;
  - opção não permitida pela raiz, módulo ou variante;
  - ampliação de limite da raiz;
  - gap impeditivo;
  - composição vazia;
  - snapshot de fonte ausente ou incompatível.
- Ativação:
  - guard obrigatório `requirePlatformAdmin`;
  - revalidação integral no servidor;
  - transação atômica para arquivar a ativa anterior e ativar o novo `draft`;
  - evento de auditoria com ator e IDs, sem payload sensível;
  - nenhuma ativação por insert direto, fixture, seed ou migration atende ao fluxo funcional.

### 2.6. Herança e resolução

- Precedência:
  - composição ativa própria;
  - composição ativa do ancestral elegível mais próximo;
  - ausência de resultado.
- Para ultranicho sem composição própria:
  - nicho direto antes do segmento.
- Para nicho sem composição própria:
  - segmento direto.
- Não existe composição universal implícita.
- Política explícita pode bloquear herança no taxon atendido.
- Composição própria de ultranicho só participa quando autorizada.
- Se o ancestral mais próximo possuir composição ativa inválida, a resolução falha e não procura ancestral mais distante.
- O resultado discriminado preserva:
  - `servedTaxon`;
  - `ownerTaxon`;
  - ID e versão da composição;
  - relação `own` ou `inherited`;
  - ancestral utilizado;
  - snapshots das fontes;
  - validade ou código fechado de falha.

### 2.7. Prontidão por plano

- A prontidão é uma avaliação determinística para:
  - `servedTaxon`;
  - plano `starter`, `lite`, `pro` ou `ultra`;
  - composição resolvida e sua versão.
- Checklist obrigatório:
  - taxon e cadeia ativos;
  - E10.8 válida para os dois `audienceScope`;
  - raiz E18.4 válida;
  - catálogo E18.5 válido;
  - E20.2 válido para o plano;
  - composição própria ou herdada válida;
  - ausência de gap impeditivo;
  - compatibilidade das versões congeladas.
- Resultado:
  - `ready` ou `blocked`;
  - códigos determinísticos por check;
  - IDs e versões avaliados;
  - data da avaliação.
- A prontidão persistida é evidência da última avaliação, não cache autorizativo.
- Todo consumo efetivo deve revalidar o estado atual; mudança em fonte, versão, lifecycle, herança ou composição invalida o efeito da prontidão anterior.
- A mesma composição pode ficar pronta em um plano e bloqueada em outro.

### 2.8. Autorização e revogação

- Somente `platform_admin`, incluindo `super_admin` pelo guard vigente, pode autorizar ou revogar.
- A autorização exige prontidão atual `ready`.
- Identidade da decisão:
  - conta;
  - `servedTaxon`;
  - plano.
- Estados:
  - `active`;
  - `revoked`.
- A autorização registra ator, data e referência da prontidão verificada no momento da decisão.
- A autorização anterior permanece registrada, mas não produz efeito enquanto a prontidão atual estiver bloqueada.
- Revalidar a prontidão pode restaurar o efeito de uma autorização ainda `active`; não criar autorização automática nova.
- Revogação é explícita, preserva histórico e impede uso mesmo quando a prontidão estiver válida.
- Autorização não substitui:
  - conta ativa;
  - membership e papel válidos;
  - entitlement comercial da E9;
  - futuros gates próprios da E19.4.

### 2.9. Persistência mínima

- Criar persistência dedicada à família `landing_page`; não reutilizar diretamente:
  - `content_templates`;
  - `content_template_taxons`;
  - `content_template_compositions`;
  - `content_artifacts`;
  - estruturas de `commercial_activation`.
- O modelo mínimo deve cobrir quatro responsabilidades sem criar engine genérica:
  - política de herança e autorização de composição própria do taxon;
  - versões de composição com payload e gaps validados;
  - última avaliação de prontidão por taxon atendido, plano e composição;
  - autorização e revogação por conta, taxon atendido e plano.
- Preferir snapshot JSONB estrito e validado para itens, gaps, fontes e checks, em vez de normalização prematura de cada propriedade.
- O banco deve proteger:
  - FKs;
  - enums/checks fechados;
  - versão positiva e única por taxon proprietário;
  - no máximo uma versão ativa por taxon proprietário;
  - unicidade da decisão corrente de autorização;
  - timestamps e atores aplicáveis.
- Segurança:
  - RLS ativo;
  - sem acesso para `anon` ou `authenticated`;
  - leitura e escrita somente server-side pelo fluxo administrativo autorizado;
  - grants explícitos para `service_role`;
  - Trigger Hub: não;
  - eventos materiais de ativação, autorização e revogação usam `audit_context_event`.
- Implementação de banco:
  - migration incremental forward-only;
  - rollback por nova migration, sem editar migration aplicada;
  - `docs/schema.md` atualizado na fase que criar os objetos;
  - runtime só entra após migration aplicada e verificada no ambiente alvo.

### 2.10. Superfície administrativa mínima

- Lista em `/admin/templates/landing-page`:
  - taxon;
  - nível;
  - situação das pesquisas;
  - composição própria ou herdada;
  - versão ativa;
  - prontidão resumida por plano;
  - ação para abrir o detalhe.
- Detalhe em `/admin/templates/landing-page/[taxonSlug]`:
  - resumo dos três critérios do taxon;
  - fontes e versões resolvidas;
  - ação “Gerar proposta com IA”;
  - editor estrutural por linhas, sem canvas e sem drag-and-drop obrigatório;
  - controles simples para módulo, variante, obrigatoriedade, opções permitidas e mover para cima ou para baixo;
  - painel separado de gaps;
  - ações salvar `draft`, revalidar e ativar;
  - prontidão por plano;
  - autorização e revogação por conta e plano.
- Estados visuais obrigatórios:
  - carregando;
  - vazio;
  - proposta pronta para revisão;
  - `draft` válido;
  - `draft` bloqueado;
  - ativo;
  - herdado;
  - erro seguro da IA;
  - operação não autorizada.
- Critérios visuais:
  - reutilizar shell, `AdminPageHeader`, `AdminStatusBadge`, componentes do design system e tokens vigentes;
  - layout responsivo empilhado no mobile;
  - tabelas com overflow horizontal quando necessário;
  - foco visível, labels associados, mensagens de erro acessíveis e botões desabilitados durante submissão;
  - não criar redesign do Admin, preview de LP ou editor visual.

### 2.11. Handoff de gaps para a E18.5

- Quando um gap exigir extensão do catálogo, o registro deve fornecer ao fluxo de `docs/prompt-catalogo-lp.md`:
  - evidência de `lp_sections` para função e anatomia;
  - papéis semânticos e limites relevantes da E18.4;
  - itens estruturados da E10.8 para sources de copy;
  - evidência E20.2 somente quando houver necessidade de dado factual;
  - critério de parada quando as fontes forem insuficientes.
- O handoff é humano e documental; não cria PR, módulo ou variante automaticamente.
- A necessidade de ajustar `docs/prompt-catalogo-lp.md` será decidida somente após o primeiro gap real validar esse handoff.

## 3. Fases e próxima ação

### 3.1. E20.3.3 — Contrato persistente de composição, versões e gaps

- Automação: não.
- Objetivo:
  - implementar o boundary server-side e a persistência mínima para política de herança, composição versionada e gaps.
- Entregas:
  - definir o path canônico dentro de `lib/conversion-content/landing-page/composition/`;
  - criar contratos TypeScript e schemas Zod estritos;
  - criar migration incremental com as estruturas mínimas da seção 2.9;
  - implementar adapters por caso de uso, sem Supabase na UI;
  - implementar criação, edição e validação de `draft`;
  - implementar ativação transacional e arquivamento da versão anterior;
  - implementar política de herança e autorização de composição própria de ultranicho;
  - registrar auditoria material;
  - atualizar `docs/schema.md` e, somente quando houver contrato técnico durável material, `docs/base-tecnica.md`.
- Critérios de aceite:
  - lifecycle e constraints protegidos no banco e no runtime;
  - versão ativa imutável;
  - uma única ativa por taxon proprietário;
  - payload inválido ou gap impeditivo não ativa;
  - sem reutilização de `commercial_activation`;
  - RLS, policies, grants e migration validados;
  - casos positivos e negativos executáveis;
  - `npm run check` e `git diff --check` aprovados.

### 3.2. E20.3.4 — Resolução própria ou herdada e prontidão por plano

- Automação: não.
- Objetivo:
  - resolver a composição aplicável e avaliar prontidão fail-closed por taxon atendido e plano.
- Entregas:
  - implementar resolver puro e adapter server-side de entrada;
  - preservar `servedTaxon`, `ownerTaxon`, relação e versões;
  - implementar precedência própria e ancestral mais próximo;
  - implementar bloqueio explícito de herança;
  - bloquear fallback distante quando a composição mais próxima estiver inválida;
  - consumir sinais de E10.8, E18.4, E18.5 e E20.2 sem duplicar seus resolvers;
  - persistir a última evidência de prontidão;
  - expor contrato mínimo de prontidão para E12.4 e futura E19.4;
  - adicionar script de validação executável da E20.3.
- Critérios de aceite:
  - casos próprios, herdados, bloqueados e inválidos cobertos;
  - os quatro planos avaliados separadamente;
  - prontidão anterior não autoriza consumo quando a validação atual falha;
  - nenhuma composição universal ou correção silenciosa;
  - imutabilidade e ordenação determinística;
  - validações E10.8, E18.4, E18.5 e E20.2 permanecem verdes;
  - `npm run check` e `git diff --check` aprovados.

### 3.3. E12.4.3 — Proposta por IA, revisão, ativação e prontidão no Admin

- Automação: não.
- Objetivo:
  - implementar a cooperação humano + IA para criar e ativar a composition do taxon no Admin Dashboard.
- Entregas:
  - criar as rotas da seção 2.10 como extensão da área existente `/admin/templates`;
  - criar leitura administrativa por adapters;
  - criar Server Actions protegidas por `requirePlatformAdmin`;
  - implementar chamada síncrona à Responses API com Structured Outputs;
  - definir env server-side exclusiva do modelo e registrar seu nome em `docs/platform-config.md`;
  - normalizar e revalidar a proposta antes de exibi-la;
  - implementar editor estrutural mínimo, gaps, salvamento, revalidação e ativação;
  - exibir os três critérios do taxon e a prontidão dos quatro planos;
  - aplicar observability segura com `request_id` e `latency_ms`;
  - preservar estados visuais e acessibilidade da seção 2.10.
- Critérios de aceite:
  - IA só roda por ação humana;
  - falha da IA não persiste nem altera composição;
  - identidade inventada aparece apenas como gap e nunca como item válido;
  - saída válida continua dependendo de revisão e ativação humanas;
  - no máximo um módulo por ocorrência e uma interação `form`;
  - comportamento responsivo e estados de loading, erro, vazio, bloqueio, draft, ativo e herdado verificados;
  - teste humano em Preview confirma o fluxo do primeiro taxon real;
  - `npm run check` e `git diff --check` aprovados.

### 3.4. E12.4.4 — Autorização e revogação por conta, taxon e plano

- Automação: não.
- Objetivo:
  - permitir que o administrador controle quais contas podem usar um taxon e plano já prontos na futura E19.4.
- Entregas:
  - implementar contrato e persistência da autorização da seção 2.8;
  - criar leitura e mutações administrativas protegidas;
  - listar somente contas elegíveis pela operação administrativa vigente;
  - exigir prontidão atual antes de autorizar;
  - permitir revogação explícita;
  - exibir autorização registrada e efeito atual separadamente;
  - expor resolver server-side fail-closed para futura E19.4;
  - registrar auditoria segura.
- Critérios de aceite:
  - combinação exata `conta + servedTaxon + plano`;
  - outro plano ou taxon não é liberado implicitamente;
  - prontidão bloqueada suspende o efeito sem apagar a autorização;
  - revogação impede efeito mesmo com prontidão válida;
  - entitlement E9, conta e membership não são duplicados nem contornados;
  - teste humano em Preview confirma autorizar, bloquear por prontidão e revogar;
  - `npm run check` e `git diff --check` aprovados.

### 3.5. Próxima ação

- Submeter esta v1 à avaliação única:
  - Analista;
  - Gestor Estrutural;
  - Gestor de Updates.
- Gestor de Automação: N/A, pois todas as fases têm `Automação: não`.
- Após os pareceres:
  - consolidar a v2 no mesmo PR pelo processo escolhido pelo humano;
  - orientar a atualização de `docs/roadmap.md` no mesmo PR, criando somente:
    - `20.3`;
    - `20.3.1`;
    - `20.3.3`;
    - `20.3.4`;
    - `12.4`;
    - `12.4.1`;
    - `12.4.3`;
    - `12.4.4`;
  - omitir `20.3.2` e `12.4.2` enquanto não houver registros materiais, conforme `docs/template-roadmap.md`.
- Não iniciar implementação material antes da aprovação, consolidação e merge humano do plano-base v2.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Geração de copy ou LP.
- Coleta e persistência de valores E20.2.
- Snapshot da futura geração.
- Renderer, preview visual da LP, publicação ou tracking.
- E19.4.
- E20.4.
- E12.4.5–E12.4.6.
- Alteração dos contratos da E10.8, E18.4, E18.5 ou E20.2.
- Criação automática de módulo, variante, taxon ou pesquisa.
- Editor visual, canvas, drag-and-drop obrigatório ou LP Builder.
- Composição universal implícita.
- Diferença artificial de composição por plano.
- Reutilização direta das tabelas de `commercial_activation`.
- Consulta direta a Stripe dentro do resolver da E20.3.
- Duplicação de entitlement, conta ou membership.
- Agente, Agents SDK, tool calling, automação, job, fila, cron, webhook, cache ou serviço separado.
- SDK OpenAI novo quando o `fetch` server-side vigente for suficiente.
- Nova infraestrutura.
- Multiple approvers, aprovação em cadeia ou workflow genérico.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - as fontes reais exigirem responsabilidade diferente para E10.8, E18.4, E18.5, E20.2, E19.4 ou E20.4;
  - a persistência mínima não puder preservar versão ativa imutável, herança, prontidão e revogação sem engine genérica;
  - a UI exigir editor visual ou geração de LP;
  - a IA precisar criar identidade não registrada;
  - surgir necessidade de agente, tool calling, job, fila ou serviço separado;
  - autorização exigir substituir ou alterar o entitlement da E9;
  - composição própria de ultranicho for necessária sem autorização humana registrada;
  - uma nova rota, tabela, policy, grant, env ou integração não puder ser justificada pelas fontes deste plano;
  - o primeiro teste real demonstrar que o handoff de gaps não fornece evidência suficiente à E18.5.

### 4.3. Validação deste trabalho documental

- Confirmar que o diff da v1 contém somente `docs/lousa-plano-base-e20-3.md`.
- Confirmar as quatro seções principais obrigatórias.
- Confirmar quatro fases executáveis:
  - E20.3.3;
  - E20.3.4;
  - E12.4.3;
  - E12.4.4.
- Confirmar `Automação: não` em todas as fases.
- Confirmar que `commercial_activation` aparece somente como fronteira negativa ou comparação rejeitada.
- Confirmar que E19.4, E20.4 e E12.4.5–E12.4.6 permanecem fora.
- Executar `git diff --check`.
- Registrar como N/A nesta v1 documental:
  - `npm ci`;
  - `npm run check`;
  - validações materiais;
  - teste humano;
  - smoke visual.

### 4.4. Critérios de encerramento do plano

- O plano só encerra após:
  - implementação das quatro fases na ordem aprovada;
  - avaliação do Analista após cada entrega material;
  - testes humanos previstos em E12.4.3 e E12.4.4;
  - merge humano do PR final;
  - relatório final ao Gestor de Docs.
- Uma composição ativa não encerra sozinha o plano enquanto a prontidão e a autorização administrativa mínima não estiverem implementadas e aprovadas.

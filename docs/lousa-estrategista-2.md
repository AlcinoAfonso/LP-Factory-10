# E10.5 e adjacências imediatas vs8

# 0) Introdução

Esta lousa se baseia no repositório, mas não o espelha.
Ela registra decisões, propostas e ajustes previstos do E10.5 e adjacências.

## 1) Definido, mas ainda não registrado/implementado

1.1 Nicho no `pending_setup` será obrigatório, em texto livre com ajuda/sugestões.

1.2 O texto livre do lead não será a base oficial de produto.

1.3 O uso inicial será enxuto, mas a estrutura não deve nascer pobre.

1.4 Hierarquia de resolução do E10.5.

* se houver nicho com template comercial válido, usa nicho
* se não houver nicho, mas houver segmento com template comercial válido, usa segmento
* se não houver nenhum dos dois, usa fallback genérico
* nicho e segmento são critérios internos de resolução; o centro visível da personalização é o template comercial recomendado

1.5 A página `active` do E10.5 será tratada como uma LP comercial.

* não será tratada como grade simples de planos
* a estrutura base deve trabalhar narrativa comercial, não apenas oferta seca

1.6 A página `active` terá estrutura de LP comercial, com composição variável por template.

* exemplos: hero, seções de valor, CTAs e seção própria de oferta

1.7 Planos entram em seção própria de oferta dentro da página.

* o formato inicial pode usar cards
* trial é opcional e depende do template
* pode ficar fora da seção de planos, inclusive em ações posteriores

1.8 A evolução dos templates comerciais tende a começar pelo segmento.

* novos nichos usam o template do segmento enquanto não tiverem template próprio
* se não houver sequer template de segmento aplicável, usa fallback genérico
* templates próprios de nicho surgem quando a demanda justificar

1.9 Tabela `content_template_sections`.

* status atual: opcional
* objetivo: quebrar templates em blocos reutilizáveis/editáveis, se isso fizer sentido depois
* campos:

  * `id`
  * `template_id`
  * `section_key`
  * `section_type`
  * `position`
  * `is_active`
  * `payload_json`
  * `created_at`
  * `updated_at`

1.10 A base estratégica por taxon será transversal.

* servirá a LPs, E10.5 e demais comunicações
* mesma base estratégica por taxon, com adaptação por contexto
* a arquitetura deve nascer completa; a ativação dos contextos pode ser gradual

## 2) Ambiguidades / aperfeiçoamento

2.1 Estratégia de alimentação das 9 tabelas.

* preenchimento manual direto fica fora de questão
* uso inicial: prompts externos + saída estruturada + carga controlada
* schema via migrations; conteúdo via seed/import/upsert
* preparar formato de entrada para futura automação por agentes

## 3) Propostas abertas

3.1 Operacionalização da resolução do E10.5.

* o sistema escolhe o melhor template comercial válido disponível
* a decisão deve ser feita no servidor, antes da renderização da página `active`

3.2 Evolução de nichos para templates próprios.

* qual sinal indica que um nicho já merece template próprio
* como essa oportunidade será sinalizada para a administração
* se essa triagem será manual, por relatório ou por agente

3.3 Camada estratégica por taxon.

* separar taxonomia, pesquisa, guias de mensagem e templates
* pesquisa e guias complementam templates; não substituem templates
* a mesma base estratégica deve poder servir a LPs, E10.5 e demais comunicações

3.4 Próxima etapa do funil após o E10.5.

* se convencer: cards e/ou trial
* se não convencer: como amadurecer o lead com mais conhecimento

## 4) Adjacências (fora do foco imediato)

4.1 CRM para trabalhar leads que não adquiriram nada.

4.2 Implementação do LP Builder / E19.

4.3 Como a IA pode melhorar a experiência do usuário neste fluxo.

4.4 Editor completo no Admin Dashboard para o template de ativação comercial.

4.5 Como preencher e evoluir as tabelas de taxonomia e templates comerciais.

## 5) Fluxo misto E10.4 / E10.5

### 5.1 Ponto de partida

1. Lead cria a conta e entra no dashboard da conta (`/a/[account]`).
2. A conta está em `pending_setup`.
3. A página mostra o estado “Primeiros passos”.
4. O campo **nicho** é obrigatório.
5. O nicho é informado em **texto livre**.

### 5.2 Cenário 1 — Entrada no E10.4 (Primeiros passos)

**O que o usuário vê**

* título “Primeiros passos”
* subtexto curto
* formulário inline
* campo de nicho obrigatório

**O que o sistema faz**

* carrega o formulário
* prepara a captura do nicho em texto bruto

**Resultado**

* o usuário entende que precisa informar seu nicho para continuar

### 5.3 Cenário 2 — Salvar os Primeiros passos

**O que o usuário faz**

* preenche os campos obrigatórios
* informa o nicho
* clica em “Salvar e continuar”

**O que o usuário vê**

* estado de carregamento no botão

**O que o sistema faz**

* valida os campos
* persiste os dados do onboarding
* mantém o nicho digitado como texto bruto
* tenta classificar esse nicho
* promove a conta de `pending_setup` para `active`

**Resultado**

* o usuário sai do E10.4
* segue para o E10.5

### 5.4 Cenário 3 — O sistema entende o nicho com confiança suficiente

**O que o sistema faz**

* guarda o texto original
* identifica um taxon oficial
* liga a conta à classificação oficial
* decide qual nível usar no E10.5

**O que o usuário vê**

* uma página `active` mais aderente ao seu contexto

**Resultado**

* o E10.5 fica menos genérico

### 5.5 Cenário 4 — O sistema não entende bem o nicho

**O que o sistema faz**

* guarda o texto bruto
* não bloqueia a ativação
* aplica fallback no E10.5

**O que o usuário vê**

* uma versão mais genérica ou por segmento da página `active`

**Resultado**

* o fluxo continua

### 5.6 Cenário 5 — Entrada no E10.5 (`active` sem entitlements)

**O que o usuário vê**

* uma página persuasiva pós-setup
* hero
* seções de valor
* CTAs
* seção própria de oferta

**O que o sistema faz**

* decide qual versão do conteúdo comercial exibir
* usa a taxonomia quando houver
* usa fallback quando necessário

**Resultado**

* o lead recebe uma narrativa comercial coerente com seu contexto

### 5.7 Cenário 6 — Lead se convence no E10.5

**O que o usuário faz**

* escolhe um plano
* ou aceita trial

**O que o sistema faz**

* registra a escolha
* encaminha para a próxima etapa

**Resultado**

* o lead avança no funil

### 5.8 Cenário 7 — Lead não se convence no E10.5

**O que o usuário faz**

* não escolhe plano
* não aceita trial
* sai ou permanece sem avançar

**O que o sistema faz**

* mantém a conta ativa
* preserva o contexto já capturado

**Resultado**

* o lead não converte agora
* pode seguir para uma trilha futura de maturação

## 6) Esboço / plano base do caso

### 6.0 Regra universal dos planos de execução

Todo plano de execução deve ter como documento-alvo `docs/prompt-executor.md`.
O plano deve definir apenas o recorte específico da etapa, sem reescrever o fluxo operacional já definido no prompt.
O plano deve indicar os documentos canônicos da etapa.
Quando o plano envolver criação de tabelas, deve explicitar também:

* a convenção mínima para novas tabelas
* o modelo mínimo de acesso e governança por tabela
  Em caso de conflito, prevalece `docs/prompt-executor.md`, salvo exceção explicitamente registrada no próprio plano.
  Cada item `6.x` nasce como esboço da etapa correspondente.
  Quando a etapa for ativada, o esboço correspondente é sobrescrito pelo plano de execução daquela etapa.
  O próximo plano só entra após a etapa anterior ser implementada e aprovada.
  O plano de testes vem depois do implementado e aprovado.

### 6.1 Implementado — E10.5.2 Criar a base do BD

* status: implementado
* resultado: 8 tabelas criadas com PK, FK, `CHECK`, índices mínimos, RLS + policies CRUD admin-only
* `supa#52` aplicado em `business_taxon_aliases.alias_text_normalized` como generated column
* fora de auditoria e fora de Trigger Hub nesta etapa

#### 6.1.1 Objetivo

6.1.1.1 Criar no banco a base estrutural do E10.5 e adjacências imediatas.
6.1.1.2 Entregar as 8 tabelas aprovadas desta fase com relações e estrutura mínima coerente.
6.1.1.3 Ajustar a documentação canônica afetada no mesmo pacote.

#### 6.1.2 Escopo desta etapa

6.1.2.1 `business_taxons`
6.1.2.2 `business_taxon_aliases`
6.1.2.3 `account_taxonomy`
6.1.2.4 `content_templates`
6.1.2.5 `content_template_taxons`
6.1.2.6 `taxon_market_research`
6.1.2.7 `taxon_market_research_items`
6.1.2.8 `taxon_message_guides`

#### 6.1.3 Contrato das tabelas desta etapa

##### 6.1.3.1 `business_taxons`

* `id`
* `parent_id`
* `level` (`segment`, `niche`, `ultra_niche`)
* `name`
* `slug`
* `is_active`

##### 6.1.3.2 `business_taxon_aliases`

* `id`
* `taxon_id`
* `alias_text`
* `alias_text_normalized` *(generated column)*
* `is_active`

##### 6.1.3.3 `account_taxonomy`

* `id`
* `account_id`
* `taxon_id`
* `is_primary`
* `status`
* `source_type`
* `created_at`
* `updated_at`

##### 6.1.3.4 `content_templates`

* `id`
* `template_key`
* `name`
* `slug`
* `template_family`
* `template_scope`
* `status`
* `version`
* `is_active`
* `payload_json`
* `notes`
* `created_at`
* `updated_at`

##### 6.1.3.5 `content_template_taxons`

* `id`
* `template_id`
* `taxon_id`
* `resolution_level`
* `priority`
* `is_primary`
* `is_active`
* `created_at`
* `updated_at`

##### 6.1.3.6 `taxon_market_research`

* `id`
* `taxon_id`
* `version`
* `status`
* `base_summary`
* `created_at`
* `updated_at`

##### 6.1.3.7 `taxon_market_research_items`

* `id`
* `research_id`
* `item_tag`
* `item_text`
* `priority`
* `is_active`
* `created_at`
* `updated_at`

##### 6.1.3.8 `taxon_message_guides`

* `id`
* `research_id`
* `context_type`
* `guide_payload_json`
* `version`
* `is_active`
* `created_at`
* `updated_at`

#### 6.1.4 Decisões fechadas desta etapa

6.1.4.1 `business_taxons.parent_id` como auto-relação da própria tabela.
6.1.4.2 `slug` como campo estável da taxonomia e dos templates.
6.1.4.3 `account_taxonomy` com `id` próprio.
6.1.4.4 `content_template_sections` fica fora desta etapa.

#### 6.1.5 Updates desta etapa

6.1.5.1 Implementar `supa#52` nesta etapa, de forma explícita, em `business_taxon_aliases.alias_text_normalized`.
6.1.5.2 Referência de update desta etapa: `docs/supa-up.md`.

#### 6.1.6 Resultado esperado da etapa

6.1.6.1 As 8 tabelas ficam criadas no BD.
6.1.6.2 As relações principais ficam fechadas sem conflito estrutural.
6.1.6.3 `docs/schema.md` passa a refletir o novo contrato.
6.1.6.4 `docs/roadmap.md` passa a registrar a etapa E10.5.2.
6.1.6.5 `docs/base-tecnica.md` só é ajustado se surgir regra estrutural que realmente precise entrar nele.

#### 6.1.7 Fora do escopo

6.1.7.1 Seed.
6.1.7.2 Importação de conteúdo.
6.1.7.3 Classificação automática do nicho.
6.1.7.4 Runtime do E10.5.
6.1.7.5 Adapters.
6.1.7.6 Views, RPCs ou jobs novos, salvo se forem indispensáveis para a integridade estrutural da etapa.

#### 6.1.8 Documentos canônicos desta etapa

* `docs/prompt-executor.md`
* `docs/schema.md`
* `docs/roadmap.md`
* `docs/base-tecnica.md` (somente se houver ajuste estrutural que realmente precise entrar nele)

### 6.2 Plano base do caso — E10.5.3 Carga inicial da taxonomia oficial (Grupo A)

#### 6.2.1 Objetivo

6.2.1.1 Popular a base inicial da taxonomia oficial criada no E10.5.2.
6.2.1.2 Entregar os primeiros segmentos, nichos, ultranichos e aliases do caso.
6.2.1.3 Fechar o formato inicial de carga controlada deste grupo.

#### 6.2.2 Escopo desta etapa

6.2.2.1 Investigar `business_taxons` e `business_taxon_aliases` para confirmar o que já existe.
6.2.2.2 Propor 5 a 10 segmentos ainda não cadastrados.
6.2.2.3 Propor 2 a 3 nichos por segmento proposto.
6.2.2.4 Incluir aliases principais por taxon.
6.2.2.5 Entregar os dados no formato canônico para carga no SQL Editor.
6.2.2.6 Validar a base após a carga.

#### 6.2.3 Decisões fechadas desta etapa

6.2.3.1 O grupo A inicial cobre `business_taxons` e `business_taxon_aliases`.
6.2.3.2 `account_taxonomy` não entra nesta carga inicial.
6.2.3.3 A carga continua controlada; não haverá preenchimento manual direto tabela por tabela.
6.2.3.4 O processo inicial será manual via chat, com aprovação antes da carga.
6.2.3.5 `supa#40` entra nesta etapa.
6.2.3.6 Os snippets locais concretos devem ser fechados em `supabase/snippets`.

#### 6.2.4 Updates desta etapa

6.2.4.1 Implementar `supa#40` nesta etapa.
6.2.4.2 Fechar os snippets locais concretos de apoio operacional e inspeção do grupo A.
6.2.4.3 Referência de update desta etapa: `docs/supa-up.md`.

#### 6.2.5 Resultado esperado da etapa

6.2.5.1 Primeiros segmentos, nichos e ultranichos cadastrados.
6.2.5.2 Primeiros aliases cadastrados.
6.2.5.3 Formato canônico de carga do grupo A fechado.
6.2.5.4 Validação pós-carga concluída.

#### 6.2.6 Fora do escopo

6.2.6.1 `account_taxonomy`.
6.2.6.2 Templates comerciais.
6.2.6.3 Base estratégica por taxon.
6.2.6.4 Classificação automática do nicho.
6.2.6.5 Runtime do E10.5.
6.2.6.6 Adapters.
6.2.6.7 FTS e `pg_trgm`.
6.2.6.8 Tracking, cache e observability do runtime.

#### 6.2.7 Documentos canônicos desta etapa

* `docs/prompt-executor.md`
* `docs/schema.md`
* `docs/roadmap.md`
* `docs/supa-up.md`

### 6.3 Esboço — E10.5.4 Carga inicial da base estratégica por taxon (Grupo C)

* investigar `taxon_market_research`, `taxon_market_research_items` e `taxon_message_guides`
* propor a primeira base estratégica por taxon
* aprovar antes da carga
* entregar no formato canônico para carga no SQL Editor
* validar pós-carga

### 6.4 Esboço — E10.5.5 Carga inicial dos templates comerciais (Grupo B)

* investigar `content_templates` e `content_template_taxons`
* usar a base estratégica do grupo C como insumo para títulos, subtítulos, seções e CTAs
* aprovar antes da carga
* entregar no formato canônico para carga no SQL Editor
* validar pós-carga

### 6.5 Esboço — E10.5.6 Classificação da conta e resolução do template

* classificar o nicho bruto
* gravar o vínculo oficial em `account_taxonomy`
* escolher no servidor o template recomendado
* implementar nesta etapa:

  * `supa#36` — FTS
  * `supa#51` — `pg_trgm`

### 6.6 Esboço — E10.5.7 Colocar o E10.5 no runtime

* integrar o E10.5 ao fluxo `active`
* renderizar a página como LP comercial
* ligar oferta, cards e trial conforme o template
* implementar nesta etapa:

  * `vercel#8` — `revalidateTag`
  * `vercel#10` — observability redirects
  * `vercel#11` — tracking server-side

### 6.7 Esboço — Etapa futura opcional

* decidir se `content_template_sections` entra ou não
* só implementar se o runtime realmente precisar de composição por blocos

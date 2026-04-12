# E10.5 e adjacências imediatas vs9

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

### 6.0 Regra dos planos base dos casos

#### 6.0.1 Como gerar o plano base do caso

* o plano base do caso deve ser gerado em cima do esboço já definido na lousa
* deve recortar apenas a etapa correspondente
* deve apontar os documentos canônicos da etapa
* deve trazer um objetivo bem traçado, deixando claro o que a etapa entrega e o que fica fora dela
* pode incluir insights do que pode precisar ser investigado no repositório, quando isso ajudar a preparar melhor a execução
* não deve reescrever o fluxo operacional do `docs/prompt-executor.md`

#### 6.0.2 O que enviar ao Executor

* acessar `docs/prompt-executor.md`
* usar como plano base o item `6.x` correspondente em `docs/lousa-estrategista-2.md`
* usar a lousa também como visão geral do caso, se necessário

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

### 6.2 Parcialmente implementado — E10.5.3 Kit operacional de expansão do Grupo A

* status: parcialmente implementado
* entregue até agora: primeiro lote piloto do Grupo A
* resultado atual: segmento `Marketing digital`, nicho `SaaS de landing pages e conversão` e 5 aliases iniciais carregados
* formato canônico inicial de carga fechado como SQL idempotente
* novo foco da etapa: criar o kit operacional para que outro chat investigue, proponha e carregue novos dados sem drift

#### 6.2.1 Objetivo

6.2.1.1 Criar o kit operacional de expansão do Grupo A.
6.2.1.2 Padronizar como outro chat deve investigar duplicidades, propor novos taxons e aliases, formatar a saída e entregar o SQL final.
6.2.1.3 Evitar carga manual solta e evitar drift entre chats.
6.2.1.4 Arquivar os prompts operacionais desta etapa em `docs/`.
6.2.1.5 Arquivar os SQLs/snippets operacionais desta etapa em `supabase/snippets/`.
6.2.1.6 `supabase/snippets/` é a pasta-alvo dos snippets SQL operacionais do projeto e ainda não está materializada no repositório nesta conversa.

#### 6.2.2 Escopo desta etapa

6.2.2.1 Criar o template de investigação do que já existe em `business_taxons` e `business_taxon_aliases`.
6.2.2.2 Criar o prompt de proposta de novos segmentos, nichos, ultranichos e aliases.
6.2.2.3 Criar o template canônico de saída dos dados aprovados.
6.2.2.4 Criar o SQL canônico de carga do Grupo A.
6.2.2.5 Criar o checklist de validação pós-carga.

#### 6.2.3 Decisões fechadas desta etapa

6.2.3.1 O Grupo A cobre `business_taxons` e `business_taxon_aliases`.
6.2.3.2 `account_taxonomy` não entra neste processo.
6.2.3.3 O processo inicial será manual via chat, com aprovação antes da carga.
6.2.3.4 Outro chat deve primeiro investigar para evitar duplicidades.
6.2.3.5 A carga final deve sair em SQL no formato canônico definido nesta etapa.
6.2.3.6 `supa#40` permanece como apoio operacional desta etapa.
6.2.3.7 Os prompts operacionais do Grupo A devem ser versionados em `docs/`.
6.2.3.8 Os SQLs/snippets operacionais do Grupo A devem ser versionados em `supabase/snippets/`.
6.2.3.9 A criação/materialização dessa pasta e dos primeiros snippets continua pendente nesta etapa.

#### 6.2.4 Updates desta etapa

6.2.4.1 `supa#40` deve apoiar a governança e o QA do Grupo A.
6.2.4.2 A materialização em `supabase/snippets` continua pendente.
6.2.4.3 Referência de update desta etapa: `docs/supa-up.md`.

#### 6.2.5 Resultado esperado da etapa

6.2.5.1 Template de investigação anti-duplicidade fechado.
6.2.5.2 Prompt de proposta de novos taxons e aliases fechado.
6.2.5.3 Template canônico de saída fechado.
6.2.5.4 SQL canônico de carga do Grupo A fechado.
6.2.5.5 Checklist de validação pós-carga fechado.

#### 6.2.6 Fora do escopo

6.2.6.1 `account_taxonomy`.
6.2.6.2 Base estratégica por taxon.
6.2.6.3 Templates comerciais.
6.2.6.4 Classificação automática do nicho.
6.2.6.5 Runtime do E10.5.
6.2.6.6 Adapters.
6.2.6.7 `supa#51` e matching textual leve.

#### 6.2.7 Documentos canônicos desta etapa

* `docs/prompt-executor.md`
* `docs/schema.md`
* `docs/roadmap.md`
* `docs/supa-up.md`

### 6.3 Esboço — E10.5.4 Kit operacional de expansão do Grupo C

#### 6.3.1 Objetivo

6.3.1.1 Criar o kit operacional de expansão do Grupo C.
6.3.1.2 Padronizar como outro chat deve investigar lacunas, propor base estratégica por taxon, formatar a saída e entregar o SQL final.
6.3.1.3 Evitar carga manual solta e evitar drift entre chats.
6.3.1.4 Arquivar os prompts operacionais desta etapa em `docs/`.
6.3.1.5 Arquivar os SQLs/snippets operacionais desta etapa em `supabase/snippets/`.
6.3.1.6 `supabase/snippets/` é a pasta-alvo dos snippets SQL operacionais do projeto e ainda não está materializada no repositório nesta conversa.

#### 6.3.2 Escopo desta etapa

6.3.2.1 Criar o template de investigação do que já existe em `taxon_market_research`, `taxon_market_research_items` e `taxon_message_guides`.
6.3.2.2 Criar o prompt de proposta da primeira base estratégica por taxon.
6.3.2.3 Criar o template canônico de saída dos dados aprovados do Grupo C.
6.3.2.4 Criar o SQL canônico de carga do Grupo C.
6.3.2.5 Criar o checklist de validação pós-carga.

#### 6.3.3 Decisões fechadas desta etapa

6.3.3.1 O Grupo C cobre `taxon_market_research`, `taxon_market_research_items` e `taxon_message_guides`.
6.3.3.2 O processo inicial será manual via chat, com aprovação antes da carga.
6.3.3.3 Outro chat deve primeiro investigar para evitar duplicidades e lacunas.
6.3.3.4 A carga final deve sair em SQL no formato canônico definido nesta etapa.
6.3.3.5 Os prompts operacionais do Grupo C devem ser versionados em `docs/`.
6.3.3.6 Os SQLs/snippets operacionais do Grupo C devem ser versionados em `supabase/snippets/`.
6.3.3.7 A criação/materialização dessa pasta e dos primeiros snippets continua pendente nesta etapa.

#### 6.3.4 Updates desta etapa

6.3.4.1 `supa#40` deve apoiar a governança e o QA do Grupo C.
6.3.4.2 A materialização em `supabase/snippets` continua pendente.
6.3.4.3 Referência de update desta etapa: `docs/supa-up.md`.

#### 6.3.5 Resultado esperado da etapa

6.3.5.1 Template de investigação do Grupo C fechado.
6.3.5.2 Prompt de proposta da base estratégica por taxon fechado.
6.3.5.3 Template canônico de saída do Grupo C fechado.
6.3.5.4 SQL canônico de carga do Grupo C fechado.
6.3.5.5 Checklist de validação pós-carga fechado.

#### 6.3.6 Fora do escopo

6.3.6.1 Templates comerciais do Grupo B.
6.3.6.2 `account_taxonomy`.
6.3.6.3 Classificação automática do nicho.
6.3.6.4 Runtime do E10.5.
6.3.6.5 Adapters.
6.3.6.6 `supa#51` e matching textual leve.

#### 6.3.7 Documentos canônicos desta etapa

* `docs/prompt-executor.md`
* `docs/schema.md`
* `docs/roadmap.md`
* `docs/supa-up.md`

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

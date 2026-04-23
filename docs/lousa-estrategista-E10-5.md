## Título: docs/lousa-estrategista-E10-5.md

Versão 17

## 1) Objetivo

Esta lousa se baseia no repositório, mas não o espelha.
Ela registra o caso de uso atual, suas decisões, ambiguidades, propostas, fluxo e esboço de execução.

## 2) Fontes

### 2.1 Docs alvos

* `docs/roadmap.md`
* `docs/base-tecnica.md`
* `docs/schema.md`
* `docs/design-system.md`

### 2.2 Docs de apoio e watchlist

* `docs/prompt-executor.md`
* `docs/prompt-abc.md`
* `docs/template-briefing-codex.md`
* `docs/supa-up.md`
* `docs/vercel-up.md`
* `docs/auto-agentes-up.md`

### 2.3 Fontes operacionais validadas

#### 2.3.1 Repositório GitHub

* acesso confirmado ao repositório `AlcinoAfonso/LP-Factory-10`
* nível validado no repositório: leitura e inspeção do repositório real
* inclui: buscar arquivos, abrir arquivos, ler conteúdo, confirmar paths e artefatos versionados
* não assumir capacidade mutável no repositório sem teste explícito no caso

#### 2.3.2 Vercel

* acesso confirmado ao workspace e aos projetos da Vercel do LP Factory 10
* projetos já validados: `lp-factory-10` e `lpf-10-services`
* nível validado na Vercel até aqui: inspeção operacional
* inclui: listar team, listar projetos, ler metadados de projeto, listar deploys, ler deployment por ID e ler build logs
* não assumir aqui capacidade de alterar settings, variáveis, domínios ou disparar deploy sem teste explícito no caso

## 3) Regras

### 3.1 Regra dos planos base dos casos

#### 3.1.1 Como gerar o plano base do caso

* o plano base do caso deve ser gerado em cima do esboço já definido na lousa
* quando o esboço for consolidado, o título da etapa deixa de ser esboço e passa a ser plano base
* deve recortar apenas a etapa correspondente
* deve apontar os documentos canônicos da etapa
* deve trazer um objetivo bem traçado, deixando claro o que a etapa entrega e o que fica fora dela
* pode incluir insights do que pode precisar ser investigado no repositório, quando isso ajudar a preparar melhor a execução
* o plano base define apenas objetivo, escopo, docs canônicos e resultado esperado; nunca processo, sequência de execução ou etapas do executor, que pertencem exclusivamente ao docs/prompt-executor.md.

#### 3.1.2 Instruções ao Executor

* você é o executor deste caso
* você tem acesso direto, via conectores já configurados, ao GitHub `AlcinoAfonso/LP-Factory-10`, branch `main`, onde estão os docs deste caso
* acessar `docs/prompt-executor.md`
* usar como plano base o item `6.x` correspondente em `docs/lousa-estrategista-E10-5.md`
* usar esse doc também como visão geral do caso, se necessário

#### 3.1.3 Após receber o relatório do executor

* etapa 1: ajustar a lousa com base no relatório recebido do executor
* após concluir a etapa 1, a IA deve parar e aguardar comando do proprietário do produto para seguir
* etapa 2: debater com o proprietário do produto os casos de uso propostos pelo executor
* após concluir a etapa 2, a IA deve parar e aguardar comando do proprietário do produto para seguir
* etapa 3: antes de entregar qualquer ABC, a IA deve avaliar os docs alvos do caso e informar quais precisam de atualização e quais não precisam de atualização
* na etapa 3, a IA deve avaliar também se `docs/design-system.md` deve receber atualização documental própria, com base no impacto real do caso sobre UI, componentes, padrões visuais e superfícies do produto
* após concluir essa triagem documental da etapa 3, a IA deve parar e aguardar comando do proprietário do produto para seguir
* depois da triagem documental, a IA deve gerar o ABC de cada doc que exigir ajuste, com base no relatório do executor, na lousa já ajustada, na definição sobre novo caso de uso e em `docs/prompt-abc.md`
* para os docs cobertos por `docs/prompt-abc.md`, a IA deve seguir esse documento e entregar um ABC por vez
* após concluir cada ABC, a IA deve parar e aguardar comando do proprietário do produto para seguir

## 4) Caso de uso atual — E10.5 e adjacências imediatas

### 4.1 Objetivo do caso de uso

* consolidar o caso E10.5 e suas adjacências imediatas
* registrar decisões, ambiguidades, propostas abertas, adjacências, fluxo e esboço das etapas
* manter neste bloco apenas o conteúdo variável do caso atual

### 4.2 Definido, mas ainda não registrado/implementado

4.2.1 Nicho no `pending_setup` será obrigatório, em texto livre com ajuda/sugestões.

4.2.2 O texto livre do lead não será a base oficial de produto.

4.2.3 Hierarquia de resolução do E10.5.

* se houver nicho com template comercial válido, usa nicho
* se não houver nicho, mas houver segmento com template comercial válido, usa segmento
* se não houver nenhum dos dois, usa fallback genérico
* nicho e segmento são critérios internos de resolução; o centro visível da personalização é o template comercial recomendado

4.2.4 A página `active` do E10.5 será tratada como uma LP comercial.

* não será tratada como grade simples de planos
* a estrutura base deve trabalhar narrativa comercial, não apenas oferta seca

4.2.5 A página `active` terá estrutura de LP comercial, com composição variável por template.

* exemplos: hero, seções de valor, CTAs e seção própria de oferta

4.2.6 Planos entram em seção própria de oferta dentro da página.

* o formato inicial pode usar cards
* trial é opcional e depende do template
* pode ficar fora da seção de planos, inclusive em ações posteriores

4.2.7 A evolução dos templates comerciais tende a começar pelo segmento.

* novos nichos usam o template do segmento enquanto não tiverem template próprio
* se não houver sequer template de segmento aplicável, usa fallback genérico
* templates próprios de nicho surgem quando a demanda justificar

4.2.8 Tabela `content_template_sections`.

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

4.2.9 A base estratégica por taxon será transversal.

* servirá a LPs, E10.5 e demais comunicações
* mesma base estratégica por taxon, com adaptação por contexto
* a arquitetura deve nascer completa; a ativação dos contextos pode ser gradual

4.2.10 Grupo C — item_tag com padrão + flexíveis.

* o Grupo C não deve seguir uma grade fixa igual para todos os nichos
* o Grupo C deve operar com alguns itens padrão e outros flexíveis por nicho e contexto

4.2.11 Grupo C — ajuste estrutural prioritário de `taxon_market_research_items`.

* o desenho do Grupo C deve manter as 3 tabelas já definidas
* não deve ser criada nova tabela agora
* o ajuste estrutural deve ocorrer na própria `taxon_market_research_items`
* esse ajuste é pré-condição para a primeira carga real do Grupo C

### 4.3 Ambiguidades / aperfeiçoamento

4.3.1 Estratégia de alimentação das 9 tabelas.

* preenchimento manual direto fica fora de questão
* uso inicial: prompts externos + saída estruturada + carga controlada
* schema via migrations; conteúdo via seed/import/upsert
* preparar formato de entrada para futura automação por agentes

4.3.2 Grupo C — estrutura mínima final de `taxon_market_research_items`.

* está definido que o ajuste estrutural da tabela é necessário antes da primeira carga real do Grupo C
* a ambiguidade agora é qual é a estrutura mínima final da tabela para diferenciar com segurança tipo amplo do item, chave semântica, escopo de público, conteúdo, ordem e observação opcional

### 4.4 Propostas abertas

4.4.1 Operacionalização da resolução do E10.5.

* o sistema escolhe o melhor template comercial válido disponível
* a decisão deve ser feita no servidor, antes da renderização da página `active`

4.4.2 Evolução de nichos para templates próprios.

* qual sinal indica que um nicho já merece template próprio
* como essa oportunidade será sinalizada para a administração
* se essa triagem será manual, por relatório ou por agente

4.4.3 Camada estratégica por taxon.

* separar taxonomia, pesquisa, guias de mensagem e templates
* pesquisa e guias complementam templates; não substituem templates
* a mesma base estratégica deve poder servir a LPs, E10.5 e demais comunicações

4.4.4 Próxima etapa do funil após o E10.5.

* se convencer: cards e/ou trial
* se não convencer: como amadurecer o lead com mais conhecimento

### 4.5 Adjacências

4.5.1 CRM para trabalhar leads que não adquiriram nada.

4.5.2 Implementação do LP Builder / E19.

4.5.3 Como a IA pode melhorar a experiência do usuário neste fluxo.

4.5.4 Editor completo no Admin Dashboard para o template de ativação comercial.

4.5.5 Como preencher e evoluir as tabelas de taxonomia e templates comerciais.

## 5) Fluxo do caso

### 5.1 Fluxo misto E10.4 / E10.5

#### 5.1.1 Ponto de partida

1. Lead cria a conta e entra no dashboard da conta (`/a/[account]`).
2. A conta está em `pending_setup`.
3. A página mostra o estado “Primeiros passos”.
4. O campo **nicho** é obrigatório.
5. O nicho é informado em **texto livre**.

#### 5.1.2 Cenário 1 — Entrada no E10.4 (Primeiros passos)

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

#### 5.1.3 Cenário 2 — Salvar os Primeiros passos

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

#### 5.1.4 Cenário 3 — O sistema entende o nicho com confiança suficiente

**O que o sistema faz**

* guarda o texto original
* identifica um taxon oficial
* liga a conta à classificação oficial
* decide qual nível usar no E10.5

**O que o usuário vê**

* uma página `active` mais aderente ao seu contexto

**Resultado**

* o E10.5 fica menos genérico

#### 5.1.5 Cenário 4 — O sistema não entende bem o nicho

**O que o sistema faz**

* guarda o texto bruto
* não bloqueia a ativação
* aplica fallback no E10.5

**O que o usuário vê**

* uma versão mais genérica ou por segmento da página `active`

**Resultado**

* o fluxo continua

#### 5.1.6 Cenário 5 — Entrada no E10.5 (`active` sem entitlements)

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

#### 5.1.7 Cenário 6 — Lead se convence no E10.5

**O que o usuário faz**

* escolhe um plano
* ou aceita trial

**O que o sistema faz**

* registra a escolha
* encaminha para a próxima etapa

**Resultado**

* o lead avança no funil

#### 5.1.8 Cenário 7 — Lead não se convence no E10.5

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

## 6) Plano base do caso

### 6.1 Implementado — E10.5.2 Criar a base do BD

* status: implementado
* resultado: 8 tabelas criadas com PK, FK, `CHECK`, índices mínimos, RLS + policies CRUD admin-only
* `supa#52` aplicado em `business_taxon_aliases.alias_text_normalized` como generated column
* fora de auditoria e fora de Trigger Hub nesta etapa

#### 6.1.1 Objetivo

* criar no banco a base estrutural do E10.5 e adjacências imediatas
* entregar as 8 tabelas aprovadas desta fase com relações e estrutura mínima coerente
* ajustar a documentação canônica afetada no mesmo pacote

#### 6.1.2 Escopo desta etapa

* `business_taxons`
* `business_taxon_aliases`
* `account_taxonomy`
* `content_templates`
* `content_template_taxons`
* `taxon_market_research`
* `taxon_market_research_items`
* `taxon_message_guides`

#### 6.1.3 Referência documental desta etapa

* o detalhamento desta etapa já está documentado nos documentos canônicos do projeto
* usar como referência principal `docs/roadmap.md`
* usar como referência estrutural `docs/schema.md`
* usar como referência de regras técnicas `docs/base-tecnica.md`

#### 6.1.4 Plano base — E10.5.2.1 Ajustar `taxon_market_research` e `taxon_market_research_items` no BD

##### 6.1.4.1 Objetivo

* ajustar no BD as duas tabelas do Grupo C para refletir a modelagem já definida na seção 6.3
* preparar a base estrutural para a primeira carga real do Grupo C
* manter o ajuste restrito às duas tabelas já existentes, sem criação de nova tabela

##### 6.1.4.2 Escopo desta etapa

* ajustar `taxon_market_research` para incluir `research_block`
* manter `research_block` como texto governado por prompts e processo operacional, sem `CHECK` fechado nesta etapa
* manter a unicidade técnica de `taxon_market_research` por `taxon_id + research_block + version`
* garantir no BD no máximo uma versão ativa por `taxon_id + research_block`
* ajustar `taxon_market_research_items` para remover `item_type`
* ajustar `taxon_market_research_items` para os campos: `item_key`, `audience_scope`, `item_text`, `priority`, `sort_order`, `is_active`, `notes`
* aplicar `CHECK` fechado em `audience_scope` para `end_customer` e `business_buyer`
* manter `taxon_market_research_items` sem unicidade extra nesta etapa
* manter `sort_order` obrigatório com default `999`

##### 6.1.4.3 Referência documental desta etapa

* `docs/roadmap.md`
* `docs/schema.md`
* `docs/base-tecnica.md`
* `docs/supa-up.md`
* `docs/lousa-estrategista-E10-5.md`

##### 6.1.4.4 Resultado esperado

* `taxon_market_research` ajustada para versionamento por `research_block`
* `taxon_market_research_items` ajustada para a nova estrutura sem `item_type`
* contrato do BD alinhado à seção 6.3

##### 6.1.4.5 Fora do escopo

* criação de nova tabela
* ajuste de `taxon_message_guides`
* reabertura de decisões de prompts, blocos operacionais ou carga do Grupo B

### 6.2 Implementado — E10.5.3 Kit operacional de expansão do Grupo A

#### 6.2.1 Objetivo

* criar o kit operacional de expansão do Grupo A para padronizar a investigação, proposta, aprovação, carga e validação de `business_taxons` e `business_taxon_aliases` sem drift entre chats

#### 6.2.2 Referência documental desta etapa

* usar como referência principal `docs/roadmap.md`
* usar como referência operacional `docs/supa-up.md`
* usar como referência de execução `docs/e10-5-3-grupo-a-investigacao.md`
* usar como referência de snippets `supabase/snippets/e10_5_3_grupo_a_carga.sql`
* usar como referência de snippets `supabase/snippets/e10_5_3_grupo_a_investigacao_taxons.sql`
* usar como referência de snippets `supabase/snippets/e10_5_3_grupo_a_investigacao_aliases.sql`


### 6.3 Plano base — E10.5.4 Kit operacional de expansão do Grupo C

#### 6.3.1 Objetivo

* criar o kit operacional de expansão do Grupo C
* padronizar como outro chat deve estruturar, consolidar e preparar a base estratégica por taxon sem drift entre chats
* reduzir carga manual solta e versionar os artefatos operacionais desta etapa em `docs/` e `supabase/snippets/`

#### 6.3.2 Documentos canônicos desta etapa

* `docs/prompt-executor.md`
* `docs/schema.md`
* `docs/roadmap.md`
* `docs/supa-up.md`

#### 6.3.3 Definições e ambiguidades por item

##### 6.3.3.1 Tabelas

###### 6.3.3.1.1 `taxon_market_research`

A) Definido

* `taxon_market_research` será ajustada para incluir `research_block`
* `research_block` será usado para versionar os blocos de pesquisa do Grupo C
* os blocos previstos para cada etapa serão definidos pelos prompts operacionais
* a unicidade técnica da tabela-pai deve ser por `taxon_id + research_block + version`
* os campos mínimos de `taxon_market_research` passam a ser: `taxon_id`, `research_block`, `version`, `status`, `created_at`, `updated_at`
* a regra de no máximo uma versão ativa por `taxon_id + research_block` será garantida no BD por índice único parcial

B) Ambiguidades / A definir

* sem ambiguidades relevantes nesta etapa

###### 6.3.3.1.2 `taxon_market_research_items`

A) Definido

* `taxon_market_research_items` remove `item_type`
* os campos mínimos de `taxon_market_research_items` passam a ser: `item_key`, `audience_scope`, `item_text`, `priority`, `sort_order`, `is_active`, `notes`
* os valores iniciais de `audience_scope` ficam: `end_customer` e `business_buyer`
* `audience_scope` entrará no BD com `CHECK` fechado para `end_customer` e `business_buyer`
* `taxon_market_research_items` não terá unicidade extra nesta etapa, além de PK + FK
* `sort_order` será obrigatório com default `999`
* `item_key` novo descoberto na pesquisa não entra automaticamente no BD; só entra após aprovação humana e, se necessário, após ajuste do `docs/prompt-E10-5-4-consolidacao-pesquisa-nicho.md`

B) Ambiguidades / A definir

* sem ambiguidades relevantes nesta etapa

##### 6.3.3.2 Prompt de pesquisa

A) Definido

* o prompt de pesquisa desta etapa deve ficar em `docs/prompt-E10-5-4-pesquisa-completa-nicho.md`
* ele deve funcionar como prompt mestre do nicho
* ele deve permitir selecionar um, vários ou todos os `research_block`
* os `research_block` previstos para cada rodada de pesquisa serão definidos no próprio prompt
* a pesquisa pode ter liberdade controlada, mas deve entregar apenas conteúdo útil à estrutura da tabela

B) Ambiguidades / A definir

* sem ambiguidades relevantes nesta etapa

##### 6.3.3.3 Prompt de consolidação

A) Definido

* o prompt de consolidação desta etapa deve ficar em `docs/prompt-E10-5-4-consolidacao-pesquisa-nicho.md`
* ele deve transformar a pesquisa bruta em saída canônica pronta para carga
* a saída consolidada deve separar:

  * referência operacional ao taxon
  * registro pai de `research`
  * itens filhos da pesquisa
* `taxon_name`, `taxon_slug` e `taxon_level` podem existir no template apenas para controle manual
* na carga final, a `research` deve ser relacionada ao taxon já existente

B) Ambiguidades / A definir

* sem ambiguidades relevantes nesta etapa

##### 6.3.3.4 SQLs e snippets

A) Definido

* os SQLs/snippets operacionais do Grupo C devem ser versionados em `supabase/snippets/`
* a carga deve criar 1 registro pai por `research_block`
* os itens devem entrar ligados ao `research_id` correspondente
* a saída consolidada desta etapa deve servir de base para a carga SQL posterior do Grupo B

B) Ambiguidades / A definir

* sem ambiguidades relevantes nesta etapa

##### 6.3.3.5 Regras operacionais do recorte

A) Definido

* o processo inicial será manual via chat, com aprovação antes da carga
* o taxon já existente no E10.5.3 deve ser tratado apenas como pré-condição operacional
* este fluxo não recadastra taxon nem alias
* `taxon_message_guides` fica fora deste recorte

B) Ambiguidades / A definir

* sem ambiguidades relevantes nesta etapa

#### 6.3.4 Fora do escopo

* geração automática do comercial do E10.5 por IA em runtime
* carga SQL do Grupo B em si
* `taxon_message_guides`
* `account_taxonomy`
* classificação automática do nicho
* runtime do E10.5
* adapters
* `supa#51` e matching textual leve

---


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

  * `supa#36` — FTS como base canônica de matching
  * `supa#51` — `pg_trgm` como apoio para variações leves de grafia sobre `business_taxon_aliases.alias_text_normalized`
  * sem confiança suficiente: fallback do E10.5

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

---

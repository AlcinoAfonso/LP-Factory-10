# Título: E10.5 e adjacências imediatas vs10

## 1) Objetivo

Esta lousa se baseia no repositório, mas não o espelha.
Ela registra decisões, propostas e ajustes previstos do E10.5 e adjacências.

## 2) Fontes

### 2.1 Docs alvos

* `docs/roadmap.md`
* `docs/base-tecnica.md`
* `docs/schema.md`
* `docs/design-system.md`

### 2.2 Docs de apoio e watchlist

* `docs/prompt-executor.md`
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
* deve recortar apenas a etapa correspondente
* deve apontar os documentos canônicos da etapa
* deve trazer um objetivo bem traçado, deixando claro o que a etapa entrega e o que fica fora dela
* pode incluir insights do que pode precisar ser investigado no repositório, quando isso ajudar a preparar melhor a execução
* não deve reescrever o fluxo operacional do `docs/prompt-executor.md`

#### 3.1.2 Instruções ao Executor

* você tem acesso direto, via conectores já configurados, ao GitHub `AlcinoAfonso/LP-Factory-10`, branch `main`, onde estão os docs deste caso
* acessar `docs/prompt-executor.md`
* usar como plano base o item `9.x` correspondente nesta lousa
* usar a lousa também como visão geral do caso, se necessário

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

### 4.3 Ambiguidades / aperfeiçoamento

4.3.1 Estratégia de alimentação das 9 tabelas.

* preenchimento manual direto fica fora de questão
* uso inicial: prompts externos + saída estruturada + carga controlada
* schema via migrations; conteúdo via seed/import/upsert
* preparar formato de entrada para futura automação por agentes

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

## 6) Esboço / plano base do caso

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

### 6.2 Parcialmente implementado — E10.5.3 Kit operacional de expansão do Grupo A

* status: parcialmente implementado
* entregue até agora: primeiro lote piloto do Grupo A
* resultado atual: segmento `Marketing digital`, nicho `SaaS de landing pages e conversão` e 5 aliases iniciais carregados
* formato canônico inicial de carga fechado como SQL idempotente
* artefatos versionados de referência já existentes para esta etapa: `docs/roadmap.md` e `docs/supa-up.md`
* em `docs/supa-up.md`, usar como apoio principal os itens `#40` e `#51`
* artefatos operacionais próprios desta etapa em `docs/` e `supabase/snippets/` ainda seguem pendentes de materialização no repositório
* novo foco da etapa: criar o kit operacional para que outro chat investigue, proponha e carregue novos dados sem drift

#### 6.2.1 Objetivo

* criar o kit operacional de expansão do Grupo A
* padronizar como outro chat deve investigar duplicidades, propor novos taxons e aliases, formatar a saída e entregar o SQL final
* evitar carga manual solta e evitar drift entre chats
* arquivar os prompts operacionais desta etapa em `docs/`
* arquivar os SQLs/snippets operacionais desta etapa em `supabase/snippets/`
* `supabase/snippets/` é a pasta-alvo dos snippets SQL operacionais do projeto e ainda não está materializada no repositório nesta conversa

#### 6.2.2 Escopo desta etapa

* criar o template de investigação do que já existe em `business_taxons` e `business_taxon_aliases`
* criar o prompt de proposta de novos segmentos, nichos, ultranichos e aliases
* criar o template canônico de saída dos dados aprovados
* criar o SQL canônico de carga do Grupo A
* criar o checklist de validação pós-carga

#### 6.2.3 Decisões fechadas desta etapa

* o Grupo A cobre `business_taxons` e `business_taxon_aliases`
* `account_taxonomy` não entra neste processo
* o processo inicial será manual via chat, com aprovação antes da carga
* outro chat deve primeiro investigar para evitar duplicidades
* a carga final deve sair em SQL no formato canônico definido nesta etapa
* `supa#40` permanece como apoio operacional desta etapa
* os prompts operacionais do Grupo A devem ser versionados em `docs/`
* os SQLs/snippets operacionais do Grupo A devem ser versionados em `supabase/snippets/`
* a criação/materialização dessa pasta e dos primeiros snippets continua pendente nesta etapa
* o cadastro inicial de aliases no Grupo A deve priorizar aliases de sentido, comerciais e realmente relevantes de mercado
* o desenho dos aliases nesta etapa já deve considerar que o `supa#51` existirá depois, na etapa E10.5.6
* o Grupo A não precisa tentar cobrir exaustivamente variações leves de grafia
* essas variações serão parcialmente absorvidas depois por `supa#51` na etapa E10.5.6

#### 6.2.4 Updates desta etapa

* `supa#40` deve apoiar a governança e o QA do Grupo A
* a materialização em `supabase/snippets` continua pendente
* referência de update desta etapa: `docs/supa-up.md`

#### 6.2.5 Resultado esperado da etapa

* template de investigação anti-duplicidade fechado
* prompt de proposta de novos taxons e aliases fechado
* template canônico de saída fechado
* SQL canônico de carga do Grupo A fechado
* checklist de validação pós-carga fechado

#### 6.2.6 Fora do escopo

* `account_taxonomy`
* base estratégica por taxon
* templates comerciais
* classificação automática do nicho
* runtime do E10.5
* adapters
* implementação do `supa#51` e do matching textual leve

#### 6.2.7 Documentos canônicos desta etapa

* `docs/prompt-executor.md`
* `docs/schema.md`
* `docs/roadmap.md`
* `docs/supa-up.md`

### 6.3 Esboço — E10.5.4 Kit operacional de expansão do Grupo C

#### 6.3.1 Objetivo

* criar o kit operacional de expansão do Grupo C
* padronizar como outro chat deve investigar lacunas, propor base estratégica por taxon, formatar a saída e entregar o SQL final
* evitar carga manual solta e evitar drift entre chats
* arquivar os prompts operacionais desta etapa em `docs/`
* arquivar os SQLs/snippets operacionais desta etapa em `supabase/snippets/`
* `supabase/snippets/` é a pasta-alvo dos snippets SQL operacionais do projeto e ainda não está materializada no repositório nesta conversa

#### 6.3.2 Escopo desta etapa

* criar o template de investigação do que já existe em `taxon_market_research`, `taxon_market_research_items` e `taxon_message_guides`
* criar o prompt de proposta da primeira base estratégica por taxon
* criar o template canônico de saída dos dados aprovados do Grupo C
* criar o SQL canônico de carga do Grupo C
* criar o checklist de validação pós-carga

#### 6.3.3 Decisões fechadas desta etapa

* o Grupo C cobre `taxon_market_research`, `taxon_market_research_items` e `taxon_message_guides`
* o processo inicial será manual via chat, com aprovação antes da carga
* outro chat deve primeiro investigar para evitar duplicidades e lacunas
* a carga final deve sair em SQL no formato canônico definido nesta etapa
* os prompts operacionais do Grupo C devem ser versionados em `docs/`
* os SQLs/snippets operacionais do Grupo C devem ser versionados em `supabase/snippets/`
* a criação/materialização dessa pasta e dos primeiros snippets continua pendente nesta etapa

#### 6.3.4 Updates desta etapa

* `supa#40` deve apoiar a governança e o QA do Grupo C
* a materialização em `supabase/snippets` continua pendente
* referência de update desta etapa: `docs/supa-up.md`

#### 6.3.5 Resultado esperado da etapa

* template de investigação do Grupo C fechado
* prompt de proposta da base estratégica por taxon fechado
* template canônico de saída do Grupo C fechado
* SQL canônico de carga do Grupo C fechado
* checklist de validação pós-carga fechado

#### 6.3.6 Fora do escopo

* templates comerciais do Grupo B
* `account_taxonomy`
* classificação automática do nicho
* runtime do E10.5
* adapters
* `supa#51` e matching textual leve

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

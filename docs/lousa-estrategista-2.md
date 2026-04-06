# E10.5 e adjacências imediatas

## 0) Introdução

Esta lousa se baseia no repositório, mas não o espelha.
Ela registra decisões, propostas e ajustes previstos do E10.5 e adjacências.

## 1) Definido, mas ainda não registrado/implementado

1.1 Nicho no `pending_setup` será obrigatório, em texto livre com ajuda/sugestões.

1.2 `account_profiles.niche` permanece como texto livre bruto.

1.3 O texto livre do lead não será a base oficial de produto.

1.4 Será criada uma taxonomia oficial separada no BD.

1.5 A taxonomia deve nascer preparada para: segmento, nicho e ultranicho.

1.6 O vínculo oficial da conta com a taxonomia será separado do `account_profiles`.

1.7 O uso inicial será enxuto, mas a estrutura não deve nascer pobre.

1.8 Tabela `business_taxons`.

* `id`
* `parent_id`
* `level` (`segment`, `niche`, `ultra_niche`)
* `name`
* `slug`
* `is_active`

1.9 Tabela `business_taxon_aliases`.

* `id`
* `taxon_id`
* `alias_text`
* `alias_text_normalized`
* `is_active`

1.10 Tabela `account_taxonomy`.

* `account_id`
* `taxon_id`
* `is_primary`
* `status`
* `source_type`
* `created_at`
* `updated_at`

1.11 Hierarquia de resolução do E10.5.

* se houver nicho com template comercial válido, usa nicho
* se não houver nicho, mas houver segmento com template comercial válido, usa segmento
* se não houver nenhum dos dois, usa fallback genérico

1.12 A página `active` do E10.5 será tratada como uma LP comercial.

* não será tratada como grade simples de planos
* a estrutura base deve trabalhar narrativa comercial, não apenas oferta seca

1.13 A página `active` terá estrutura de LP comercial, com composição variável por template.

* exemplos: hero, seções de valor, CTAs e seção própria de oferta

1.14 Planos entram em seção própria de oferta dentro da página.

* o formato inicial pode usar cards
* trial é opcional e depende do template
* pode ficar fora da seção de planos, inclusive em ações posteriores

## 2) Ambiguidades

2.1 Centro da personalização do E10.5.

* o eixo principal será segmento, nicho ou template comercial recomendado
* como isso deve aparecer para o usuário sem aumentar complexidade

## 3) Propostas abertas

3.1 Como operacionalizar a hierarquia de resolução do E10.5.

* como detectar template comercial válido
* qual sinal define nicho, segmento ou fallback genérico
* onde essa decisão será resolvida no sistema

3.2 Relação entre taxonomia e templates comerciais.

* quantidade viável de templates por segmento
* ROI de produzir templates por nicho
* até onde a estrutura de templates comerciais pode ser reaproveitada por LPs futuras

3.3 Tabela `content_templates`.

* uso inicial: E10.5
* objetivo: catálogo neutro de templates para páginas/blocos de conteúdo
* possibilidade futura: reaproveitamento em LPs, se a estrutura real for compatível
* campos-base sugeridos:

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

3.4 Tabela `content_template_taxons`.

* objetivo: vincular templates à taxonomia oficial
* uso esperado: permitir resolução por nicho, segmento e fallback genérico
* campos-base sugeridos:

  * `id`
  * `template_id`
  * `taxon_id`
  * `resolution_level`
  * `priority`
  * `is_primary`
  * `is_active`
  * `created_at`
  * `updated_at`

3.5 Tabela `content_template_sections`.

* status atual: opcional
* objetivo: quebrar templates em blocos reutilizáveis/editáveis, se isso fizer sentido depois
* campos-base sugeridos:

  * `id`
  * `template_id`
  * `section_key`
  * `section_type`
  * `position`
  * `is_active`
  * `payload_json`
  * `created_at`
  * `updated_at`

3.6 Próxima etapa do funil após o E10.5.

* se convencer: cards e/ou trial
* se não convencer: como amadurecer o lead com mais conhecimento

## 4) Adjacências (fora do foco imediato)

4.1 CRM para trabalhar leads que não adquiriram nada.

4.2 Implementação do LP Builder / E19.

4.3 Como a IA pode melhorar a experiência do usuário neste fluxo.

4.4 Editor completo no Admin Dashboard para o template de ativação comercial.

4.5 Como preencher e evoluir as tabelas de taxonomia e templates comerciais.

## 5) Fluxo misto E10.4 / E10.5

### 5.1 Ponto de Partida

1. Lead cria a conta e entra no dashboard da conta (`/a/[account]`).
2. A conta está em `pending_setup`.
3. A página mostra o estado “Primeiros passos”.
4. O campo **nicho** é obrigatório.
5. O nicho é informado em **texto livre**.

### 5.2 Cenário 1 — Entrada no E10.4 (Primeiros passos)

**O que o usuário vê**

* Título: “Primeiros passos”.
* Subtexto curto.
* Formulário inline.
* Campo de nicho obrigatório.
* Ajuda opcional no campo de nicho:

  * exemplos
  * sugestões
  * orientação curta

**O que o sistema faz**

* carrega o formulário
* prepara a captura do nicho em texto bruto

**Resultado**

* usuário entende que precisa informar seu nicho para continuar

**Ambiguidades**

* O nicho será texto livre puro ou texto livre com ajuda/sugestões?
* Como essa ajuda aparecerá na UI?

**Necessidades**

* definição de UX do campo
* persistência do texto bruto
* base futura para sugestões/aliases

### 5.3 Cenário 2 — Salvar os Primeiros passos

**Usuário**

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

* usuário sai do E10.4
* segue para o E10.5

**Ambiguidades**

* A classificação do nicho precisa acontecer já no save?
* A classificação pode acontecer depois sem travar o fluxo?

**Necessidades**

* regra de classificação
* regra de fallback
* separação entre texto bruto e classificação oficial

### 5.4 Cenário 3 — O sistema entende o nicho com confiança suficiente

**O que o sistema faz**

* guarda o texto original
* identifica um taxon oficial
* liga a conta à classificação oficial
* decide qual nível usar no E10.5

**O que o usuário vê**

* uma página `active` mais aderente ao seu negócio

**Resultado**

* E10.5 fica menos genérico

**Ambiguidades**

* O E10.5 deve comunicar por nicho ou por segmento?
* Quando o nicho melhora a conversão e quando complica?

**Necessidades**

* taxonomia oficial
* aliases/sinônimos
* vínculo oficial da conta com a taxonomia

### 5.5 Cenário 4 — O sistema não entende bem o nicho

**O que o sistema faz**

* guarda o texto bruto
* não bloqueia a ativação
* aplica fallback no E10.5

**O que o usuário vê**

* uma versão mais genérica ou por segmento da página `active`

**Resultado**

* o fluxo continua
* a ambiguidade fica para tratamento posterior

**Ambiguidades**

* O fallback deve ser por segmento ou totalmente genérico?
* Vale pedir esclarecimento já nesta fase?

**Necessidades**

* status de classificação
* regra de fallback
* trilha futura de maturação/follow-up

### 5.6 Cenário 5 — Entrada no E10.5 (`active` sem entitlements)

**O que o usuário vê**

* uma página persuasiva pós-setup
* hero
* seções de valor
* CTAs
* cards em seção própria

**O que o sistema faz**

* decide qual versão do conteúdo comercial exibir
* usa a taxonomia quando houver
* usa fallback quando necessário

**Resultado**

* lead recebe uma narrativa comercial coerente com seu contexto

**Ambiguidades**

* O centro da página será:

  * segmento
  * nicho
  * template comercial recomendado
* Onde entra a oferta de trial?

**Necessidades**

* tabela própria para templates comerciais
* vínculo entre taxonomia e template comercial
* regra de exibição de planos e trial

### 5.7 Cenário 6 — Lead se convence no E10.5

**O que o usuário faz**

* escolhe um plano
* ou aceita trial

**O que o sistema faz**

* registra a escolha
* encaminha para a próxima etapa

**Resultado**

* lead avança no funil

**Ambiguidades**

* O CTA principal será plano ou trial?
* Trial ajuda a conversão ou compete com os planos?

**Necessidades**

* regra comercial dos CTAs
* lógica de passagem para a próxima etapa

### 5.8 Cenário 7 — Lead não se convence no E10.5

**O que o usuário faz**

* não escolhe plano
* não aceita trial
* sai ou permanece sem avançar

**O que o sistema faz**

* mantém a conta ativa
* preserva o contexto já capturado

**Resultado**

* lead não converte agora
* pode seguir para uma trilha futura de maturação

**Ambiguidades**

* Como amadurecer esse lead depois?
* Qual é o próximo passo fora do E10.5?

**Necessidades**

* futura camada de CRM/follow-up
* estratégia de conteúdo/maturação
* possível uso de IA em etapa posterior

### 5.9 Casos do Roadmap

* E10.4
* E10.5
* adjacência direta: taxonomia oficial de segmento/nicho/ultranicho
* adjacência futura: templates comerciais
* adjacência futura: CRM/follow-up

### 5.10 Estruturas sugeridas por este fluxo

1. `account_profiles.niche` como texto bruto.
2. `business_taxons` como taxonomia oficial.
3. `business_taxon_aliases` para aliases, sugestões e normalização.
4. `account_taxonomy` como vínculo oficial da conta com a taxonomia.
5. tabela própria de templates comerciais do E10.5.

Testando Compartilhamento

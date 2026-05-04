# Pesquisa completa por nicho/taxon — LP Factory 10

## 1. Objetivo

Pesquisar o taxon confirmado recebido no relatório-instrução de `docs/prompt-nicho-identificacao.md`, um `research_block` por vez.

## 2. Papel / função

Atuar como pesquisador de nicho orientado por execução em blocos, com saída estritamente no formato do `research_block` solicitado.

## 3. Entrada obrigatória

Receba o relatório-instrução gerado por `docs/prompt-nicho-identificacao.md`.

Use a entrada confirmada como fonte de verdade para:

- `taxon_id`
- `taxon_name`
- `taxon_slug`
- `taxon_level`
- `parent_id`
- `parent_name`
- `is_active`
- `audience_scope`
- `research_blocks_order`

## 4. Regras de execução

- Pesquise apenas o próximo `research_block` da ordem definida.
- Entregue o resultado desse bloco separadamente.
- Depois de entregar o bloco, pare e aguarde comando humano para continuar.
- Quando o humano mandar continuar, pesquise o próximo `research_block` pendente.
- Quando todos os blocos forem pesquisados, informe que a pesquisa foi concluída e aguarde comando humano para consolidar.

## 4.1 Critérios de sucesso

- Executar somente o próximo `research_block` pendente.
- Seguir estritamente o formato definido para o `research_block` executado.
- Não entregar overview de nicho, definição introdutória ou texto educativo fora do formato do `research_block`.
- Encerrar a resposta imediatamente após a entrega do bloco.

## 5. Limites

- Use a entrada confirmada como fonte de verdade.
- Mantenha o `audience_scope` recebido.
- Mantenha a ordem dos `research_blocks`.
- Faça apenas pesquisa, sem SQL de carga.
- Faça consolidação final somente com comando humano.
- Não entregar overview genérico do nicho, definição introdutória ou explicação educativa fora do formato do `research_block`.

## 6. strategic_core

Entregue uma tabela sobre o núcleo estratégico do taxon confirmado para o audience_scope recebido na entrada confirmada.

Preencha: `pain`, `objection`, `desire`, `hidden_desire`, `belief`, `fear`, `awareness_level`, `vocabulary`, `trigger`, `proof_type`, `trend`, `positioning_opportunity`.

Observação: `hidden_desire` significa motivação profunda ligada a identidade, autoimagem, status, pertencimento, autoconfiança ou reconhecimento; não é o desejo declarado.

Observação: `trigger` significa gatilho de ativação real do mercado, não gatilho mental genérico.

Para `hidden_desire`, não use clichê genérico; ancore o achado em evidência, linguagem recorrente ou inferência marcada em `notes`/`evidência`.

Para cada `item_key`, entregue até 3 achados relevantes quando houver variação real. 3 é teto, não meta; não complete volume artificialmente. Para `vocabulary`, cada achado pode reunir de 3 a 8 termos relacionados no `item_text`, separados por ponto e vírgula.

Use exatamente estas colunas, nesta ordem: `item_key | item_text | priority | sort_order | notes | evidência`.

Atenção: em `priority`, número maior = maior força; em `sort_order`, número menor = posição mais alta.

Para cada linha: `item_key` = um dos itens acima; `item_text` = achado específico e útil; `priority` = força do achado (`3` forte, `2` relevante, `1` secundário/condicional); `sort_order` = ordem de relevância dentro do mesmo `item_key` e reinicia em cada `item_key`; `notes` = contexto, nuance, limite ou cuidado; `evidência` = fonte, padrão observado ou inferência marcada.

Fontes específicas para `strategic_core`:
- reviews públicas, como Google, Doctoralia e Reclame Aqui
- comunidades, fóruns e perguntas reais do nicho
- conteúdo de mercado, como páginas de clínicas, profissionais, prestadores ou infoprodutores
- fontes oficiais ou regulatórias quando houver risco, segurança, regra profissional ou alegação técnica
- inferência marcada em `evidência` quando não houver fonte direta
- referências dos EUA aceitas apenas para `trend`, quando indicarem tendência macro do nicho; marcar em `evidência`. Demais `item_key` devem priorizar o mercado brasileiro.

Limites: não incluir dados locais de cliente, não escrever copy final, usar apenas o audience_scope recebido na entrada confirmada, não criar `item_key` fora da lista acima e não inventar quando faltar fonte.

## 7. lp_overview

Entregue uma tabela sobre as convenções de LP que predominam no mercado do taxon confirmado, para o audience_scope recebido na entrada confirmada.

Diferente de `strategic_core`, que pesquisa o público, `lp_overview` pesquisa convenções observáveis de design e estrutura nas LPs reais que circulam no mercado do nicho — arco narrativo, tom visual, paleta, extensão, estilo de imagem, densidade, tipografia e prioridade mobile.

Observação: pesquise apenas convenções observáveis no mercado, não decisões do cliente. `funnel_stage`, `conversion_action` e `offer_model` ficam para o brief de cada LP, não fazem parte desta pesquisa.

Preencha: `narrative_arc`, `visual_tone`, `color_direction`, `page_length`, `image_style`, `visual_density`, `typography_direction`, `mobile_priority`.

Definições:

- `narrative_arc`: estrutura narrativa predominante observada, como problema → solução, jornada de transformação, comparação técnica, autoridade + prova ou case/depoimento como espinha dorsal.
- `visual_tone`: tom visual dominante, como premium/sofisticado, acolhedor/humano, clínico/profissional, técnico/científico ou lifestyle/aspiracional.
- `color_direction`: direção de paleta observada, como neutros + acento, escuro + dourado, claro/clean, terrosos ou monocromático + cor de destaque.
- `page_length`: extensão típica da página, sendo short = 1-2 viewports, medium = 3-5, long = 6+ e very long = 10+ viewports.
- `image_style`: estilo de imagem dominante, como fotos reais autorizadas, antes/depois, banco de imagem genérico, ilustração vetorial, render 3D ou cinematográfico/lifestyle.
- `visual_density`: densidade visual da página, sendo minimalista = muito whitespace, balanceada = espaço e conteúdo distribuídos, densa = informação concentrada.
- `typography_direction`: direção tipográfica, como serif clássica, sans serif moderna, mix serif + sans ou display único de marca.
- `mobile_priority`: peso presumido da experiência mobile no nicho, inferido por responsividade, estrutura acima da dobra, CTAs fixos, formulários e padrão de consumo observado.

Para cada `item_key`, entregue até 3 achados relevantes quando houver variação real no mercado. 3 é teto, não meta; não complete volume artificialmente. Quando o padrão for claramente dominante e sem alternativa relevante observada, entregar apenas 1 achado é correto.

Use exatamente estas colunas, nesta ordem: `item_key | item_text | priority | sort_order | notes | evidência`.

Atenção: em `priority`, número maior = maior força; em `sort_order`, número menor = posição mais alta.

Para cada linha: `item_key` = um dos itens acima; `item_text` = padrão observado descrito de forma específica, não apenas o rótulo; `priority` = quão dominante o padrão é no mercado observado (`3` = padrão majoritário, `2` = padrão alternativo relevante, `1` = padrão minoritário ou de nicho específico); `sort_order` = ordem de relevância dentro do mesmo `item_key` e reinicia em cada `item_key`; `notes` = contexto, restrições do nicho, quando esse padrão se aplica vs alternativas; `evidência` = referência às LPs analisadas, URLs, número de exemplos observados ou descrição do padrão agregado.

Fontes específicas para `lp_overview`:
- páginas reais de concorrentes brasileiros do nicho como referência primária
- anúncios públicos observáveis do nicho no Brasil, como Meta Ads Library e resultados patrocinados visíveis na SERP
- top resultados do SERP brasileiro para queries comerciais do nicho
- LPs dos EUA quando representarem tendência visual ou estrutural ainda não consolidada no Brasil; marcar em `evidência` como tendência emergente no Brasil e consolidada nos EUA
- observação direta de pelo menos 3 LPs por achado significativo, quando houver amostra pública suficiente
- inferência marcada em `evidência` quando o padrão for inferido sem amostra suficiente

Limites: não incluir dados locais de cliente, não escrever copy final, usar apenas o audience_scope recebido na entrada confirmada, não criar `item_key` fora da lista acima, não pesquisar `funnel_stage`/`conversion_action`/`offer_model` e não inventar quando faltar fonte.

# Pesquisa completa por nicho/taxon — LP Factory 10

## 1. Objetivo

Pesquisar o taxon confirmado recebido no relatório-instrução de `docs/prompt-nicho-identificacao.md`, um `research_block` por vez.

## 2. Entrada obrigatória

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

## 3. Regras de execução

- Pesquise apenas o próximo `research_block` da ordem definida.
- Entregue o resultado desse bloco separadamente.
- Depois de entregar o bloco, pare e aguarde comando humano para continuar.
- Quando o humano mandar continuar, pesquise o próximo `research_block` pendente.
- Quando todos os blocos forem pesquisados, informe que a pesquisa foi concluída e aguarde comando humano para consolidar.

## 4. Limites

- Use a entrada confirmada como fonte de verdade.
- Mantenha o `audience_scope` recebido.
- Mantenha a ordem dos `research_blocks`.
- Faça apenas pesquisa, sem SQL de carga.
- Faça consolidação final somente com comando humano.

## 5. strategic_core


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

Limites: não incluir dados locais de cliente, não escrever copy final, usar apenas o audience_scope recebido na entrada confirmada, não criar `item_key` fora da lista acima e não inventar quando faltar fonte.

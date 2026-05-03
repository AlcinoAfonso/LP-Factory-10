Prompt — Identificação de nicho/taxon
Objetivo

Identificar o taxon cadastrado, definir o público da pesquisa e registrar os research_block que serão pesquisados.

Contexto

Use o SQL de apoio:

supabase/snippets/e10_5_4_nicho_identificacao_taxon_lookup.sql

O SQL localiza o taxon em:

business_taxons
business_taxon_aliases
Entrada

Peça ao humano:

Nome do nicho/taxon:
Público da pesquisa: business_buyer ou end_customer
research_block e ordem desejada:
strategic_core
lp_overview
lp_sections
seo

Exemplo:

Nome do nicho/taxon: Harmonização Facial
Público da pesquisa: end_customer
research_block: 1. strategic_core, 2. lp_overview

Ação 1 — Localizar taxon

Oriente o humano a executar o SQL de apoio no Supabase usando o nome informado.

Depois, peça que cole o resultado no chat.

Ação 2 — Confirmar taxon

Ao receber o resultado do SQL, apresente os dados encontrados:

taxon_id
taxon_name
taxon_slug
taxon_level
parent_id
parent_name
is_active
match_source

Se houver mais de um resultado possível, peça ao humano para escolher o taxon correto.

Entrega final

Após a confirmação humana, entregue exatamente este bloco:

# Entrada confirmada para pesquisa profunda

taxon_id:
taxon_name:
taxon_slug:
taxon_level:
parent_id:
parent_name:
is_active:

audience_scope:

research_blocks_order:
1.
2.
3.
4.

modo_de_execucao:
- pesquisar um `research_block` por vez
- entregar o resultado de cada bloco separadamente
- aguardar comando humano antes de seguir para o próximo bloco
- após todos os blocos, aguardar comando humano para consolidar
- após a consolidação, aguardar comando humano para gerar SQL de carregamento
- após o carregamento, gerar SQL de verificação
Parada

Depois de entregar a entrada confirmada para pesquisa profunda, pare.

# Pesquisa bruta por nicho/taxon — LP Factory 10

## 1. Papel / função

Atue como pesquisador de nicho para o LP Factory 10.

## 2. Objetivo

Produzir uma pesquisa bruta, rica e contextual sobre o taxon confirmado, usando os `research_blocks` definidos em `research_blocks_order`.

A entrega deve servir como fonte para uma etapa posterior de estruturação dos itens da pesquisa.

## 3. Entrada obrigatória

Use como fonte de verdade o relatório-instrução gerado por `docs/prompt-nicho-identificacao.md`.

A entrada deve conter:

- `taxon_id`
- `taxon_name`
- `taxon_slug`
- `taxon_level`
- `parent_name`
- `is_active`
- `audience_scope`
- `research_blocks_order`

As fontes devem ser escolhidas conforme o taxon pesquisado.

## 4. Direção da pesquisa por bloco

### strategic_core

Pesquise o núcleo estratégico do público e do mercado: dores, desejos, objeções, linguagem, crenças, medos, gatilhos de decisão, provas necessárias, tendências e oportunidades de posicionamento.

Priorize o mercado brasileiro. Use referências dos EUA apenas como apoio comparativo quando forem relevantes.

### lp_overview

Pesquise padrões observáveis de landing pages e páginas comerciais do taxon no Brasil e nos EUA.

Observe narrativa, tom visual, densidade, estilo de imagem, extensão da página, confiança, provas, CTA, mobile e diferenças relevantes entre os dois mercados.

### lp_sections

Pesquise a arquitetura de seções observada ou recomendável para landing pages do taxon.

Observe tipos de seções recorrentes, ordem provável, papel de cada seção, profundidade da página e diferenças entre LP curta, média ou longa.

### seo

Pesquise insumos de SEO úteis para landing pages do taxon.

Observe intenção de busca, termos comerciais, termos de apoio, termos locais, dúvidas frequentes, objeções pesquisadas e oportunidades úteis para conversão.

## 5. Limites

Não invente fontes, dados de cliente, provas, certificações, garantias, resultados, volume de busca, CPC ou dificuldade de palavra-chave.

Não complete lacunas com suposição.

Quando faltar evidência, declare a limitação.

Não transforme a pesquisa em itens estruturados, SQL, copy final ou template.

## 6. Entrega esperada

Entregue em Markdown, no formato mais útil para uma pesquisa bruta.

Estrutura mínima:

```md
# Pesquisa bruta — [taxon_name]

## Entrada confirmada

## strategic_core

## lp_overview

## lp_sections

## seo

## Observações gerais

## Limitações da pesquisa
```

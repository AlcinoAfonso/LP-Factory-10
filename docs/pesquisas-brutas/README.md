# Pesquisas brutas

## 1. Objetivo

- Arquivar pesquisas brutas em Markdown para consulta humana e uso complementar pela IA.
- Preservar contexto, evidências, justificativas, limitações e inferências que não cabem integralmente nos itens estruturados.

## 2. Path

- Padrão: `docs/pesquisas-brutas/<taxon_slug>/<audience_scope>/v<research_version>.md`.
- Exemplo: `docs/pesquisas-brutas/corretor-imoveis/end_customer/v1.md`.
- `taxon_slug`, `audience_scope` e `research_version` devem corresponder à pesquisa estruturada relacionada.

## 3. Regra de uso

- A pesquisa bruta é uma fonte complementar.
- Quando o arquivo correspondente estiver disponível, a IA poderá usá-lo para ampliar o contexto da análise.
- Quando o arquivo não estiver disponível, o fluxo continua com as fontes estruturadas vigentes.
- A ausência da pesquisa bruta não cria bloqueio, critério de prontidão, fallback obrigatório ou requisito adicional.
- Em caso de divergência, os itens estruturados e aprovados permanecem como fonte operacional.
- A pesquisa bruta não autoriza módulo, variante ou identidade inexistente nos contratos vigentes.

## 4. Conteúdo mínimo

- Identificação do taxon, público e versão.
- Conteúdo integral da pesquisa.
- Limitações e inferências declaradas.
- Fontes consultadas.
- Origem do arquivo, quando convertido de outro formato.

## 5. Formato

- Usar Markdown como formato principal.
- Manter tabelas em Markdown sempre que a estrutura original permitir.
- Não exigir cópia em PDF.
- Não incluir dados de clientes, segredos ou informações confidenciais.

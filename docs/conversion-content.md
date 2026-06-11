# Templates universais de conversão

## 1. Objetivo

Este documento define a base dos templates universais de conversão da LP Factory.

Ele estabelece o contrato para estruturas reutilizáveis por canal e objetivo e para os artefatos de conteúdo gerados sobre essas estruturas. Os templates universais pertencem à E18 e podem ser consumidos por produtos finais em outras seções do Core.

## 2. Conceito

Template universal é uma estrutura reutilizável de conteúdo e montagem definida por canal e objetivo.

O template não deve ser específico por nicho como regra. A especialização ocorre pela combinação do template com a inteligência disponível para o taxon e com dados reais do cliente, quando existirem.

Templates universais são fontes compartilhadas. Páginas, mensagens e demais produtos finais são consumidores ou saídas, mantidos nas fronteiras responsáveis por sua experiência.

## 3. Fórmula do sistema

```txt
produto final = template universal + itens estruturados da pesquisa + dados do cliente
```

- **Template universal:** lógica de montagem, estrutura esperada e contrato de saída para um canal e objetivo.
- **Itens estruturados da pesquisa:** inteligência do nicho obtida pela pesquisa associada ao taxon.
- **Dados do cliente:** realidade comercial, oferta, diferenciais, provas, restrições e demais entradas específicas disponíveis.
- **Produto final:** entrega personalizada conforme canal, objetivo e contexto.

A ausência de pesquisa ou de dados do cliente não cria outro template. O consumidor deve aplicar o fallback definido e sinalizar dados faltantes quando isso for relevante para a saída.

## 4. Classificação dos templates

### 4.1 Primeiro nível: canal

Exemplos:

- Account Dashboard
- Landing page
- WhatsApp
- E-mail
- Instagram
- TikTok

### 4.2 Segundo nível: objetivo

Exemplos:

- Account Dashboard — Página comercial
- Landing page — Agendamento
- Landing page — Captação de leads
- WhatsApp — Primeiro contato
- WhatsApp — Follow-up
- E-mail — Oferta
- Instagram — Carrossel de objeção

Canal e objetivo identificam o template. Variações contextuais devem ser tratadas como parâmetros internos, e não como novos templates sem necessidade estrutural comprovada.

## 5. Parâmetros internos

Parâmetros internos ajustam a resolução ou a aplicação de um template universal:

- `funnel_stage`
- `tier`
- `audience_scope`
- `subobjective`
- `conversion_goal`
- `taxon_id`
- `client_inputs`
- `output_format`

Exemplo: usar `Landing page — Agendamento` com `tier = Pro`.

Não criar `Landing page — Agendamento — Pro` como template paralelo apenas por causa do tier. A mesma regra vale para nicho, estágio do funil, público e demais parâmetros.

## 6. Contrato universal

### 6.1 Entrada

O contrato de entrada pode conter:

- `channel`: canal consumidor;
- `objective`: objetivo da entrega;
- parâmetros internos aplicáveis;
- taxon resolvido, quando existir;
- itens estruturados disponíveis para o taxon e o `audience_scope` requerido;
- dados do cliente, quando existirem;
- contexto e restrições do consumidor;
- indicação do fallback utilizado.

Campos obrigatórios e opcionais devem ser definidos por template quando houver consumo real. Este documento não define schema de banco nem contrato de runtime.

### 6.2 Saída

O contrato de saída deve:

- seguir a estrutura definida pelo template;
- distinguir conteúdo resolvido de alertas ou lacunas;
- preservar o canal, o objetivo e o contexto usados;
- permitir que o consumidor renderize ou transforme o resultado sem assumir dados inexistentes;
- registrar conceitualmente a origem aplicada: taxon resolvido, ancestral ou fallback genérico.

O primeiro formato técnico da saída está definido em `lib/conversion-content/contracts.ts`. Ele separa headline, promessa, contexto, cards comerciais, CTAs, blocos de prova ou benefício e alertas de dados faltantes.

A validação estrutural pura fica em `lib/conversion-content/generatedCommercialContent.ts`. URLs, rotas e efeitos dos CTAs pertencem ao consumidor e não devem ser gerados como copy.

## 7. Relação com a pesquisa por taxon

`taxon_market_research` é o registro-pai da pesquisa. `taxon_market_research_items` contém os itens estruturados e é a fonte principal da inteligência por nicho para os templates universais.

Os itens herdam o `audience_scope` do registro-pai por `research_id`.

Mapeamento conceitual dos blocos:

- `strategic_core`: dores, desejos, objeções, provas, medos, linguagem e posicionamento;
- `lp_overview`: narrativa, tom visual, densidade, imagem e direção visual;
- `lp_sections`: estrutura, prioridade e ordem das seções;
- `seo`: intenção de busca, termos, FAQ e requisitos de SEO.

O uso de cada bloco depende do canal e do objetivo. O template não deve copiar todos os itens indiscriminadamente nem transformar blocos de pesquisa em templates paralelos.

## 8. Fallback por taxon

A resolução conceitual da inteligência deve seguir esta ordem:

1. taxon resolvido com o `audience_scope` necessário;
2. taxon pai com o mesmo `audience_scope`;
3. próximo ancestral disponível com o mesmo `audience_scope`;
4. fallback genérico da LP Factory.

O fallback deve permitir uma saída válida sem inventar pesquisa ou dados do cliente. Quando a ausência de dados limitar a personalização, a saída pode incluir alertas de dados faltantes.

Para `Account Dashboard — Página comercial`, o `audience_scope` preferencial é `business_buyer`.

## 9. Primeiro template

### 9.1 Identificação

- **Canal:** `account_dashboard`
- **Objetivo:** `commercial_page`
- **Nome:** Account Dashboard — Página comercial
- **Caso consumidor:** E10.6

### 9.2 Objetivo

Apresentar uma vitrine persuasiva interna para contas `active` sem entitlements, com experiência semelhante a uma landing page interna e cards comerciais para compra, solicitação, briefing ou ativação da primeira entrega.

### 9.3 Entradas

- `channel = account_dashboard`
- `objective = commercial_page`
- `audience_scope = business_buyer`
- conta existente no contexto do Account Dashboard;
- taxon resolvido, se existir;
- itens estruturados disponíveis;
- dados do cliente disponíveis, se existirem;
- fallback hierárquico aplicável;
- fallback genérico.

Nesta primeira fase, a conta existe como contexto da página, mas o template não depende de dados comerciais ricos do cliente. Oferta, provas, diferenciais, imagens e CTA específico podem estar ausentes.

O taxon também é opcional e serve apenas para personalização. Sua ausência não bloqueia a página: o mesmo template universal deve usar a inteligência genérica de fallback, sem criar um template paralelo.

### 9.4 Saída esperada

- headline;
- promessa principal;
- texto curto de contexto;
- cards comerciais;
- CTA principal;
- CTA secundário;
- blocos de prova ou benefício;
- alertas de dados faltantes, quando aplicável.

O contrato de saída possui resolução server-side implementada na E10.5.6.7 e validação estrutural inicial na E18.5. O runtime de persistência está preparado para criar drafts, ativar uma versão e recuperar o artefato ativo. A geração por provider e a renderização permanecem fora desta fase.

O mesmo template possui uma copy final genérica e determinística para uso quando não houver artefato específico válido. Esse fallback não depende de chamada de IA ou API durante a renderização.

### 9.5 Sequência de implementação

1. A E18 define o contrato universal e o template `Account Dashboard — Página comercial`.
2. A E10.5.6.7 implementa a resolução server-side do template comercial para uma conta existente, usando seu taxon apenas quando disponível e aplicando o fallback genérico sem bloquear a saída.
3. A E18.5 define o contrato dos campos finais, a identidade inicial do artefato, a proveniência da pesquisa e a validação estrutural pura.
4. A E18.5 prepara a persistência versionada dos artefatos, com estados `draft`, `active` e `archived`, ativação transacional e acesso server-side.
5. A E12.7 operará geração e regeneração administrativas.
6. A primeira entrega da E10.6 renderiza a página comercial no Account Dashboard com o fallback determinístico; a leitura do artefato ativo permanece desativada até a persistência ser aplicada e validada.

A resolução não gera texto final nem renderiza a página. Ela retorna o template versionado, a inteligência estruturada aplicável, a proveniência das pesquisas com `research_id`, versão e `updated_at`, a origem do fallback e alertas de dados faltantes.

## 10. Persistência futura

Tabelas só devem ser avaliadas quando houver necessidade real de salvar dados operacionais, como:

- canal escolhido;
- objetivo;
- estágio do funil;
- comprador, vendedor ou outro subobjetivo;
- dados do cliente;
- template usado;
- saída gerada;
- versões;
- aprovações;
- histórico;
- status como `draft`, `approved` ou `published`.

O caso real de reutilização foi definido pela E18.5. A estrutura transversal proposta usa `generated_content_artifacts`, com uma sequência de versões por `scope_key` estável e no máximo uma versão ativa por escopo. O `scope_key` separa o fallback genérico do conteúdo por `researchTaxon`, sem fragmentar o histórico quando template, schema ou pesquisa mudarem. O `input_fingerprint` registra essas entradas mutáveis e permite rejeitar um ativo desatualizado até sua regeneração. A proveniência completa fica em `provenance_json`; a forma como uma conta alcançou a pesquisa não participa do escopo persistido. O SQL operacional e a verificação estão em `supabase/snippets/`; a tabela ainda depende de aplicação e validação no Supabase.

## 11. Fronteiras

- **E18:** define os templates universais de conversão e seus contratos.
- **E10.5.5:** cobre a pesquisa por taxon; não concentra produtos finais.
- **E10.5.6.7:** resolve server-side o template comercial para a conta existente, usando taxon opcional e fallback genérico para consumo da E10.6.
- **E18.5:** define contratos de conteúdo gerado, identidade, proveniência, validação estrutural e runtime server-side de persistência, sem provider.
- **E12.7:** operará futuramente a geração e regeneração administrativas.
- **E10.6:** consumirá artefato ativo ou fallback determinístico e será responsável pela página comercial interna do Account Dashboard.
- **E19:** permanece responsável pelo LP Builder; pode consumir templates universais quando aplicável, sem concentrá-los.

Ficam fora desta fase:

- provider ou runtime de geração;
- leitura do artefato persistido pela E10.6;
- LP Builder;
- aplicação de SQL no Supabase sem autorização e validação operacional;
- detalhamento dos prompts finais por canal;
- adoção de provider ou gateway de IA.

## 12. Próximos passos

1. Aplicar e validar o SQL operacional de persistência no Supabase.
2. Criar migration histórica após a validação operacional.
3. Definir e implementar o runtime de geração dos campos finais.
4. Implementar a operação administrativa da E12.7.
5. Integrar a E10.6 ao artefato ativo, preservando o fallback determinístico já implementado.

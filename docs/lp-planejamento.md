# Planejamento de LPs — LP Factory 10

## 1. Objetivo

Este documento organiza o debate sobre entregas, insumos, camadas de decisão e dependências necessárias para transformar pesquisa por nicho, itens estruturados, Blueprint e dados do cliente em landing pages testáveis no LP Factory 10.

O objetivo imediato não é implementar código, banco, rotas, automações, agentes ou nova infraestrutura. O objetivo é consolidar um plano de raciocínio para chegar depois a um roteiro de implementação seguro.

## 2. Fontes e limites

### 2.1. Fontes usadas

- `README.md` — visão geral do produto, proposta de valor, stack base e princípios do MVP.
- `AGENTS.md` — regras operacionais para alteração em branch dedicada e escopo controlado.
- `docs/template-blueprint.md` — estrutura de pesquisa independente para Blueprint.
- `docs/prompt-nicho-itens-estruturados.md` — blocos estruturados `strategic_core`, `lp_overview`, `lp_sections` e `seo`.
- `lib/conversion-content/contracts.ts` — referência técnica de composição, item de composição, variante e artefato publicado.
- Debate em chat sobre LPs, Blueprint, itens estruturados, composição e parametrização.

### 2.2. Limites deste documento

- Não define implementação.
- Não cria nova tabela, rota, job, agente, automação, engine ou infraestrutura.
- Não substitui plano-base futuro.
- Não substitui o Blueprint de nicho.
- Não substitui os itens estruturados.
- Não define ainda checklist final de aceite de LP.

## 3. Entregas esperadas de LP

### 3.1. Entregas principais

- LP BOFU — voltada para conversão direta, como WhatsApp, formulário, orçamento, simulação ou agendamento.
- LP MOFU — voltada para consideração, educação, comparação, prova, objeções e avanço para contato.
- LP TOFU — voltada para descoberta, intenção inicial, conteúdo útil, SEO ou tráfego frio.

### 3.2. Entregas complementares

- LP teste por nicho — primeira página gerada para validar composição, parametrização, copy, visual, responsividade e clareza.
- Variação por origem de tráfego — ajuste de ângulo para Google, Instagram, SEO, WhatsApp, QR code ou tráfego orgânico.

### 3.3. Observação sobre origem de tráfego

- Origem de tráfego não deve ser tratada automaticamente como novo canal de conteúdo.
- A LP continua sendo landing page.
- Google, Instagram, WhatsApp, SEO ou QR code funcionam como origem/distribuição e podem influenciar hero, CTA, densidade, formulário e prova.

## 4. Camadas necessárias para entregar uma LP

### 4.1. Composição do nicho

A composição do nicho define quais módulos entram, em qual ordem, com qual variante, obrigatoriedade e configuração inicial.

Deve responder:

- Quais seções são essenciais.
- Quais seções são recomendadas.
- Quais seções são opcionais ou condicionais.
- Qual ordem tende a fazer sentido.
- Qual papel de conversão cada seção cumpre.

### 4.2. Dados do cliente

Os dados do cliente alimentam a LP concreta de uma conta ou oferta.

Devem incluir, quando aplicável:

- Nome do cliente ou marca.
- Nicho e recorte comercial.
- Oferta principal.
- Público-alvo.
- Região de atuação.
- Provas reais.
- Imagens e ativos visuais.
- CTA principal.
- WhatsApp, formulário ou destino de conversão.
- Restrições legais ou regulatórias.
- Política de privacidade ou texto de confiança.

### 4.3. Conteúdo da LP

O conteúdo da LP é a copy final que preenche os campos dos módulos escolhidos.

Deve respeitar:

- Parametrização editorial por campo.
- Limites de caracteres.
- Tom definido para o nicho.
- Promessas permitidas.
- Provas disponíveis.
- Vocabulário do público.
- Restrições de segurança, compliance e privacidade.

### 4.4. Renderização e teste

A LP precisa ser renderizada e avaliada antes de ser considerada pronta para uso.

A avaliação deve considerar:

- Clareza da proposta.
- Ordem das seções.
- Responsividade mobile.
- Densidade visual.
- Leitura do H1, H2, H3, parágrafos e detalhes.
- Funcionamento do CTA.
- Coerência entre origem de tráfego e hero.
- Existência de prova suficiente.
- Ausência de promessa indevida.

## 5. Camadas necessárias para entregar a composição do nicho

### 5.1. Itens estruturados

Os itens estruturados são a leitura interna do nicho dentro do LP Factory 10.

Devem ajudar a decidir:

- Estratégia de mensagem.
- Arquitetura de seções.
- Vocabulário.
- Objeções.
- Provas necessárias.
- Tom visual.
- Densidade.
- Direção tipográfica.
- Prioridade mobile.

### 5.2. Blueprint do nicho

O Blueprint é a pesquisa externa de mercado usada para confrontar os itens estruturados.

Deve ajudar a validar:

- Padrões reais observados em LPs, sites e funis.
- Módulos e variantes recorrentes.
- Provas usadas no mercado.
- Padrões de CRO, UX e copy.
- Lacunas prováveis do catálogo.
- Parametrizações por campo.
- Riscos e hipóteses.

### 5.3. Confronto entre itens estruturados e Blueprint

A composição do nicho não deve sair apenas do Blueprint nem apenas dos itens estruturados.

A regra de trabalho deve ser:

- Itens estruturados indicam a leitura interna do nicho.
- Blueprint traz evidência externa de mercado.
- O confronto dos dois gera decisão de composição e parametrização.
- Divergências relevantes viram decisão humana.

## 6. Papel de cada bloco dos itens estruturados

### 6.1. `strategic_core`

Ajuda a parametrizar mensagem, promessa, objeções e provas.

Deve apoiar decisões sobre:

- Dor dominante.
- Desejo principal.
- Objeção principal.
- Medo.
- Crença.
- Nível de consciência.
- Vocabulário.
- Gatilho de conversão.
- Tipo de prova exigido.
- Oportunidade de posicionamento.

### 6.2. `lp_overview`

Ajuda a parametrizar a camada visual e editorial ampla da LP.

Deve apoiar decisões sobre:

- Arco narrativo da página.
- Tom visual.
- Direção de cores.
- Comprimento da página.
- Estilo de imagem.
- Densidade visual.
- Direção tipográfica.
- Prioridade mobile.

### 6.3. `lp_sections`

Ajuda a parametrizar composição, ordem e função das seções.

Deve apoiar decisões sobre:

- Seções essenciais.
- Seções recomendadas.
- Seções opcionais.
- Ordem provável.
- Papel de conversão.
- Adequação por LP curta, média ou longa.

### 6.4. `seo`

Ajuda a parametrizar intenção, vocabulário, FAQ e alinhamento com busca.

Deve apoiar decisões sobre:

- Intenção de busca.
- Palavras comerciais.
- Palavras de apoio.
- Termos locais.
- Perguntas de FAQ.
- Requisitos básicos de SEO.

## 7. Parametrização de módulos e variantes

### 7.1. Primeira camada universal

A primeira camada de parametrização pode ser universal e simples.

Ela deve cobrir inicialmente:

- H1.
- H2.
- H3.
- Parágrafo.
- Texto pequeno ou detalhe.
- CTA.
- Eyebrow ou linha curta de contexto.
- Nota de privacidade ou confiança.

### 7.2. Presets iniciais

Os presets iniciais devem ser poucos e reutilizáveis.

Sugestão inicial:

- `compact` — menor, direto, denso, útil para páginas objetivas, técnicas ou com muito conteúdo prático.
- `default` — equilíbrio padrão entre clareza, leitura e impacto.
- `premium` — maior, mais espaçoso, aspiracional, útil quando visual, marca e percepção de valor pesam mais.

### 7.3. Exemplo de escala tipográfica inicial

Exemplo para H1:

- `compact` — `text-3xl / sm:text-4xl`.
- `default` — `text-4xl / sm:text-5xl`.
- `premium` — `text-5xl / sm:text-6xl`.

Essa escala ainda é hipótese de planejamento. Precisa ser confrontada com design system, renderer atual, Blueprint, itens estruturados e teste visual.

### 7.4. Ajuste por nicho

A camada universal pode ser ajustada por nicho, mas esse ajuste deve ser limitado.

Exemplos:

- Corretor econômico ou financiamento-first tende a usar `default` ou `compact`.
- Corretor alto padrão tende a usar `premium`.
- Serviço técnico B2B tende a usar `compact` ou `default`.
- Saúde regulada tende a usar `default`, com promessa controlada e prova forte.

### 7.5. Regra de factibilidade

A parametrização por nicho é factível se for feita por presets simples e não por desenho artesanal para cada nicho.

Evitar:

- Fonte diferente para cada nicho sem necessidade comprovada.
- Escalas infinitas de tipografia.
- Ajuste visual livre por IA.
- Parametrização sem teste visual.

## 8. Papel da LP teste por nicho

### 8.1. Função

A LP teste por nicho é a primeira validação prática da composição e da parametrização.

Ela deve testar:

- Se a composição do nicho faz sentido.
- Se os módulos escolhidos são suficientes.
- Se há lacunas no catálogo.
- Se a parametrização editorial funciona.
- Se a escala visual funciona.
- Se a página fica clara em mobile.
- Se a copy respeita limites e promessas.

### 8.2. Resultado esperado

A LP teste deve gerar uma decisão:

- Aprovar composição do nicho.
- Ajustar ordem de seções.
- Trocar variante.
- Parametrizar módulo existente.
- Criar hipótese de novo módulo ou variante para plano futuro.
- Rejeitar elemento específico por baixo valor ou complexidade.

## 9. Papel do Blueprint no fluxo

### 9.1. Necessidade

O Blueprint é necessário quando os itens estruturados não bastam para decidir com segurança a composição e a parametrização.

Ele é especialmente útil para:

- Evitar achismo.
- Validar padrões reais de mercado.
- Identificar módulos recorrentes.
- Confirmar provas e objeções.
- Comparar variações por origem de tráfego.
- Apoiar decisões de parametrização por campo.

### 9.2. Arquivamento

A pesquisa de Blueprint deve ser arquivada como documento de apoio do nicho.

Sugestão atual de padrão:

- `docs/blueprint-[nicho]-[audience_scope].md`

Exemplo já usado no debate:

- `docs/blueprint-corretor-imoveis-end-customer.md`

### 9.3. Limite

O Blueprint não deve substituir a composição do nicho.

Ele deve alimentar:

- Decisão de módulos.
- Decisão de variantes.
- Parametrização editorial.
- Parametrização visual.
- Lacunas prováveis.
- Perguntas para decisão humana.

## 10. Sequência de trabalho proposta

### 10.1. Sequência de trás para frente

1. Definir o que é uma LP entregue.
2. Definir quais LPs precisam existir por nicho.
3. Definir insumos mínimos para gerar uma LP.
4. Definir composição do nicho.
5. Confrontar itens estruturados com Blueprint.
6. Parametrizar módulos e variantes.
7. Gerar LP teste por nicho.
8. Avaliar LP teste.
9. Ajustar composição e parametrização.
10. Só depois transformar em roteiro de implementação.

### 10.2. Primeira frente de debate

A primeira frente deve avaliar as entregas finais.

Perguntas:

- Quais tipos de LP o MVP precisa entregar primeiro?
- BOFU, MOFU e TOFU são suficientes para o primeiro recorte?
- LP teste por nicho deve ser obrigatória antes de liberar o nicho?
- Variação por origem de tráfego entra no MVP ou fica como refinamento?

### 10.3. Segunda frente de debate

A segunda frente deve avaliar os itens estruturados.

Perguntas:

- `lp_overview` entrega o suficiente para decidir preset visual e tipográfico?
- `lp_sections` entrega o suficiente para decidir composição?
- `strategic_core` entrega o suficiente para decidir copy e prova?
- `seo` entrega o suficiente para FAQ e vocabulário?
- Algum bloco precisa entregar mais dados?

### 10.4. Terceira frente de debate

A terceira frente deve avaliar o Blueprint.

Perguntas:

- O Blueprint é sempre obrigatório ou só para nichos novos/complexos?
- O Blueprint deve ser arquivado sempre em `docs/blueprint-[nicho]-[audience_scope].md`?
- O Blueprint deve ser gerado antes ou depois dos itens estruturados?
- Como registrar divergência entre Blueprint e itens estruturados?

### 10.5. Quarta frente de debate

A quarta frente deve avaliar parametrização.

Perguntas:

- Quais campos têm parametrização universal?
- Quais campos dependem do nicho?
- Quais presets visuais existem no MVP?
- `compact`, `default` e `premium` são suficientes?
- O que precisa ser decidido por teste visual?

## 11. Pendências para virar roteiro de implementação

### 11.1. Pendências conceituais

- Definir checklist de LP entregue.
- Definir relação final entre TOFU, MOFU, BOFU e origem de tráfego.
- Definir se LP teste por nicho é gate obrigatório.
- Definir quando Blueprint é obrigatório.
- Definir onde registrar decisões finais de composição.

### 11.2. Pendências de parametrização

- Definir se a composição precisa de configuração global por nicho para preset tipográfico, densidade, tom visual, funil/origem e prioridade mobile.
- Definir presets visuais iniciais.
- Definir escala tipográfica inicial.
- Definir limites editoriais por campo.
- Definir quais decisões vêm de `lp_overview`.
- Definir quais decisões vêm de `lp_sections`.
- Definir como o Blueprint confronta os itens estruturados.

### 11.3. Pendências de liberação de nicho

- Avaliar se, para liberar um nicho filho para criação de LP, os itens estruturados de `end_customer` devem ser obrigatórios no próprio nicho filho.
- Avaliar se, para o mesmo nicho filho, os itens estruturados de `business_buyer` podem ser herdados do nicho pai quando já existirem e fizerem sentido para o recorte comercial.
- Exemplo: para `corretor de imóveis de médio padrão`, exigir `end_customer` no nicho filho, mas permitir `business_buyer` herdado do nicho pai `corretor de imóveis`.
- Registrar critérios para decidir quando a herança de `business_buyer` é segura e quando o nicho filho exige pesquisa própria.
- Tratar esta regra como pendência de validação, não como regra implementada.

### 11.4. Pendências técnicas futuras

- Avaliar renderer atual antes de qualquer alteração.
- Avaliar contratos atuais antes de qualquer alteração.
- Avaliar se a parametrização cabe em configuração existente.
- Evitar nova infraestrutura sem necessidade comprovada.
- Transformar decisões aprovadas em plano-base separado antes de implementação.

## 12. Regra provisória de decisão

Enquanto este documento estiver em desenvolvimento, a regra provisória é:

- Não implementar antes de fechar entregas esperadas.
- Não parametrizar sem saber qual LP será testada.
- Não aceitar Blueprint como verdade única.
- Não aceitar itens estruturados como verdade única.
- Confrontar itens estruturados, Blueprint e LP teste antes de fixar regra permanente.

# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para liberar nichos e orientar ajustes do projeto até a criação de LPs.

Fontes de referência: `README.md`, `docs/prompt-nicho-itens-estruturados.md`, `docs/template-blueprint.md`, `docs/schema.md`, `lib/conversion-content/landing-page/contracts.ts`, `lib/conversion-content/contracts.ts`, web.dev Web Vitals e debate em chat.

## 1. O que estamos definindo

### 1.1. Entrega final esperada

- A entrega final é criar LPs testáveis e publicáveis por nicho ou ultranicho.
- Tipos/intenção de LP: BOFU, MOFU e TOFU.
- BOFU, MOFU e TOFU não são canais; o canal é `landing_page`.
- Origem de tráfego é separada do tipo da LP: Google Ads, Instagram Ads, WhatsApp, QR Code, orgânico ou outra origem.
- BOFU, MOFU e TOFU entram na geração da LP final a partir da intenção informada pelo cliente, sem exigir três composições oficiais por taxon no MVP.
- LP teste por nicho ou ultranicho é validação prática antes da liberação plena.

### 1.2. Critérios de liberação de nicho ou ultranicho

- Critério 1: taxon ativo e corretamente posicionado na taxonomia `segmento → nicho → ultranicho`.
- Critério 2: itens estruturados completos para `end_customer` no taxon específico e `business_buyer` próprio ou herdado do taxon pai com critério.
- Critério 3: composição base parametrizada própria do taxon ou composição herdável aprovada do nicho base, quando o taxon específico for um ultranicho.
- Critério 4: LP teste ou conjunto de LPs teste validados por plano de liberação do nicho base, com liberação herdável para taxons que usam a mesma composição base, incluindo validação técnica, visual, editorial, conversão mínima e performance de carregamento.
- Item 5 opcional: Benchmark Blueprint complementar, sem bloqueio automático de liberação.

### 1.3. Papel dos itens estruturados

- `strategic_core`: mensagem, promessa, objeções, provas, vocabulário e CTA.
- `lp_overview`: config global da composição, incluindo tom visual, densidade, tipografia, mobile, extensão e estilo de imagem.
- `lp_sections`: seções, ordem, função no funil e composição conceitual.
- `seo`: intenção, vocabulário, termos, FAQ e requisitos básicos de busca.
- Os itens estruturados não precisam entregar limites de caracteres, escala tipográfica, tamanho de fonte ou parametrização técnica por campo.
- Quando houver herança de composição do nicho para ultranicho, conteúdo, copy, FAQ, provas, oferta e CTA devem continuar específicos do ultranicho.

### 1.4. Composição e variantes

- A estrutura padrão permanece módulo + variante.
- Módulo define a função estrutural.
- Variante define a execução específica daquela função.
- Parametrização define como a variante se comporta no tipo de LP, nicho, ultranicho e origem/funil.
- A composição base do taxon não é a LP final; ela é o ponto de partida governado para gerar LPs concretas.
- A config global pertence à composição base.
- Configs específicas pertencem aos itens da composição.
- Composição aprovada de nicho é presumida herdável para ultranichos, salvo marcação contrária.
- O ultranicho só herda composição do nicho base quando não houver composição própria aprovada.
- Criar composição própria do ultranicho apenas quando a composição do nicho não atender por estrutura, jornada, regulação, prova, oferta, formulário, qualificação ou resultado da LP teste.
- Exceções por nicho ou ultranicho devem virar variantes reutilizáveis e hierarquicamente superiores, não ajustes soltos.

### 1.5. Parametrização

- A base inicial deve ser uma base reutilizável de parametrização para a família `landing_page`.
- A base deve considerar a precedência: família `landing_page` → intenção/funil da LP gerada → módulo → variante → composição base do taxon → item da composição.
- A fonte canônica da base reutilizável deve ser versionada no repositório, porque impacta renderer, contratos, testes e design system.
- Espelho, referência de versão ou payload operacional no banco só devem ser decididos no plano-base técnico, se houver necessidade operacional.
- Parâmetro por campo significa regra para H1, H2, H3, parágrafo, CTA, eyebrow, nota de privacidade, FAQ, cards, benefícios e passos.
- Presets candidatos iniciais: `compact`, `default`, `premium`, sujeitos a validação no plano-base da base reutilizável de parametrização para `landing_page`.
- Presets não substituem BOFU/MOFU/TOFU, módulos ou variantes.
- Presets não autorizam override livre de design system, schema, renderer, segurança, performance ou acessibilidade.
- A base reutilizável deve resolver a maioria dos nichos e ultranichos.
- Taxons que exigirem parâmetros fora da base reutilizável devem usar variante própria reutilizável.
- Valores exatos de parâmetros e presets ficam para o plano-base técnico da base reutilizável.

### 1.6. Blueprint

- O Blueprint não substitui nem compete com os itens estruturados.
- O Blueprint entra inicialmente como benchmark de ROI da LP teste, não como etapa obrigatória do critério 3.
- A comparação deve avaliar qualidade, conversão esperada, estrutura, clareza, visual, adequação ao nicho, lacunas e riscos.
- Se o Blueprint provar ganho claro, incorporar apenas a parte que gerou ganho: benchmark, lacunas, parametrização editorial, UX/CRO ou outra contribuição objetiva.

### 1.7. Taxonomia de comunicação

- A comunicação do projeto deve seguir a taxonomia técnica existente: `segmento → nicho → ultranicho`.
- Não adotar nomenclatura paralela `setor → segmento → nicho`, para evitar retrabalho e conflito entre sistema, documentação, Admin e comunicação.
- Exemplo: `saúde` como segmento, `odontologia` como nicho e `implante dentário` como ultranicho.
- Exemplo: `imobiliário` como segmento, `corretor de imóveis` como nicho e `corretor de imóveis de médio padrão` como ultranicho.
- Para o critério de composição, o nicho pode ter composição base herdável que atende seus ultranichos.

### 1.8. Fechamento conceitual do Critério 3

- O Critério 3 fica fechado em planejamento com as regras deste documento.
- A implementação técnica depende de plano-base próprio antes de qualquer alteração em banco, contratos, renderer, Admin, schema ou validações.
- O fechamento conceitual não autoriza criação de tabela, campo, rota, job, automação, agente ou nova infraestrutura.

### 1.9. Critério 4 — LP teste por plano de liberação

- A validação deve ocorrer por plano de liberação: `starter`, `lite`, `pro` e `ultra`.
- O Critério 4 não exige LP teste para cada ultranicho quando eles usam a mesma composição base herdável do nicho base.
- Uma LP teste aprovada no nicho base libera o plano para seus ultranichos herdáveis.
- Uma LP teste aprovada em um ultranicho que usa a composição herdável do nicho base também valida a composição para o nicho base e seus ultranichos irmãos herdáveis.
- A liberação herdada não se aplica quando o ultranicho tiver composição própria, módulo/variante específica, restrição regulatória, falha técnica/editorial/visual, ou marcação de não herança.
- `starter` exige pelo menos 1 LP teste validada, com intenção/funil definido e conteúdo específico do taxon testado.
- `lite`, `pro` e `ultra` devem ter critérios proporcionais ao escopo real de cada plano, sem antecipar testes complexos sem fonte comercial ou plano-base próprio.
- Performance de carregamento em ambiente de teste é requisito obrigatório da LP teste.
- Performance real de campanha, tráfego real, conversão real e Core Web Vitals de campo não são requisitos do Critério 4.
- A validação de performance deve prevenir regressões antes da liberação, com atenção a LCP, estabilidade visual, bloqueio de interação, peso de imagens, embeds, JavaScript excessivo, layout shift e fallback lento.
- O Benchmark Blueprint pode ser usado para comparação de ROI, mas não é obrigatório para liberar o Critério 4.

### 1.10. Item 5 — Benchmark Blueprint opcional

- O Item 5 é complementar e opcional; não é critério de liberação.
- Após a LP teste passar no Critério 4, o projeto pode gerar uma LP alternativa ou avaliação comparativa orientada por Blueprint.
- O objetivo é comparar a LP teste do processo normal com uma proposta ou avaliação Blueprint.
- A comparação deve avaliar clareza, estrutura, copy, adequação ao nicho ou ultranicho, visual, CTA, prova, conversão esperada, lacunas e riscos.
- O Benchmark Blueprint não bloqueia liberação de nicho, ultranicho ou plano, salvo decisão humana explícita.
- Se o Blueprint apresentar ganho relevante, a melhoria deve ser registrada como insumo para evolução da base reutilizável, composição, variantes, parametrização editorial ou critérios de UX/CRO.
- O Blueprint não altera automaticamente banco, composição, renderer, schema, módulo, variante ou artefato final.
- O Item 5 não autoriza criação de tabela, campo, rota, job, automação, agente ou nova infraestrutura.

## 2. O que precisa ser ajustado ou implementado no projeto

### 2.1. Critério 1 — Taxon

- Confirmar regra operacional de taxon liberável usando a taxonomia `segmento → nicho → ultranicho`.
- Garantir leitura clara de taxon pai e filho para herança quando aplicável.
- Evitar nomenclatura paralela entre sistema, documentação, Admin e comunicação.

### 2.2. Critério 2 — Itens estruturados

- Adequar a regra para aceitar `end_customer` no taxon específico e `business_buyer` próprio ou herdado do taxon pai.
- Registrar critério de segurança para herança de `business_buyer`.
- Bloquear liberação quando faltar bloco obrigatório.

### 2.3. Critério 3 — Composição base parametrizada

- Criar ou ajustar fluxo Admin de curadoria da composição base do taxon.
- Permitir que a IA proponha config global com base em `lp_overview`.
- Permitir que a IA proponha módulos, variantes, ordem, obrigatoriedade e config por item com base em `lp_sections`, `strategic_core` e `seo`.
- Resolver no plano-base técnico onde a config global da composição base será persistida.
- Manter `content_template_composition_items` como relação 1:N de módulos/variantes.
- Registrar gaps de catálogo quando módulo ou variante essencial não existir.
- Impedir liberação plena até gap essencial ser criado e parametrizado.
- Permitir que a LP final adapte copy, CTA, prova, FAQ, formulário, densidade e ordem permitida conforme a intenção do cliente.
- Impedir que a intenção/funil altere livremente schema, renderer, módulo ou variante fora do catálogo aprovado.
- Permitir que ultranicho use composição base aprovada e herdável do nicho base quando não houver composição própria aprovada.
- Bloquear liberação se não houver composição própria aprovada nem composição herdável aprovada do nicho base.

### 2.4. Base reutilizável de parametrização

- Criar base reutilizável versionada no repositório para a família `landing_page`.
- Avaliar no plano-base técnico se o banco terá espelho, referência de versão ou payload operacional da base reutilizável para Admin e IA.
- Definir parâmetros por campo para a família `landing_page`.
- Definir limites editoriais iniciais para H1, H2, H3, parágrafo, CTA, FAQ, cards, benefícios, passos e nota de privacidade.
- Definir escala tipográfica inicial para presets candidatos, sem tratá-los como contrato final antes de validação.
- Definir adaptações permitidas por intenção/funil da LP gerada: BOFU, MOFU e TOFU.
- Definir quantidades padrão, como FAQ, benefícios/cards e passos.
- Definir quando uma exceção exige nova variante reutilizável.

### 2.5. Variantes

- Confirmar catálogo inicial de módulos e variantes de LP.
- Criar variantes quando a necessidade não couber na base reutilizável.
- Garantir que variantes sejam reutilizáveis em outros nichos sempre que possível.
- Definir hierarquia de variante universal, variante por intenção de LP e variante por nicho quando necessário.
- Evitar ajuste solto por nicho ou ultranicho; primeiro avaliar variante existente, depois nova variante reutilizável e só por último exceção específica de baixo reaproveitamento.

### 2.6. Blueprint

- Implementar ou simular comparação de ROI entre LP teste do processo normal e benchmark orientado por Blueprint.
- Avaliar se o Blueprint melhora parametrização editorial, UX/CRO, lacunas, riscos ou qualidade da LP teste.
- Ajustar template do Blueprint se ele precisar entregar parâmetros de forma mais objetiva.
- Não tornar Blueprint obrigatório sem evidência de ganho.

### 2.7. Pendências técnicas

- Avaliar contratos, banco, renderer e Admin contra este plano.
- Ajustar o projeto somente após decisão registrada neste documento.
- Não criar nova tabela, campo, rota, job, automação ou agente sem plano-base ou briefing próprio.

### 2.8. Critério 4 — LP teste por plano

- Definir checklist da LP teste por plano.
- Definir validação técnica da LP teste.
- Definir validação visual, editorial e de conversão mínima.
- Definir métrica mínima de carregamento em ambiente de teste.
- Definir se a medição será por Lighthouse, PageSpeed, Playwright, ferramenta interna ou combinação.
- Definir bloqueios para imagem pesada, embed pesado, JavaScript excessivo, layout shift e fallback lento.
- Definir como registrar que a liberação de um plano no nicho base foi herdada pelos ultranichos.
- Definir como registrar que uma LP teste aprovada em ultranicho herdado validou o nicho base e ultranichos irmãos que usam a mesma composição base.
- Definir critérios específicos para `lite`, `pro` e `ultra` somente quando houver escopo real desses planos.

### 2.9. Item 5 — Benchmark Blueprint opcional

- Definir formato de comparação entre LP teste validada e proposta ou avaliação Blueprint.
- Definir como registrar ganhos, lacunas e riscos encontrados pelo Benchmark Blueprint.
- Definir como transformar ganhos relevantes em insumo para plano-base, base reutilizável, composição, variantes ou critérios editoriais.
- Garantir que o Item 5 não bloqueie liberação sem decisão humana explícita.
- Garantir que o Item 5 não altere automaticamente banco, composição, renderer, schema, módulo, variante ou artefato final.

## 3. Pendências para plano-base técnico

- Definir onde persistir a config global da composição base do taxon.
- Definir como marcar composição de nicho restrita, quando ela não puder ser herdada por ultranichos.
- Definir onde persistir a intenção/funil da LP gerada e quais adaptações a composição base pode permitir.
- Definir os valores exatos dos parâmetros por campo e dos presets candidatos.
- Definir se haverá espelho, referência de versão ou payload operacional da base reutilizável no banco.
- Definir o mecanismo de registro da liberação por plano e da herança entre nicho base e ultranichos.
- Definir a métrica mínima de performance de carregamento e a ferramenta de medição em ambiente de teste.
- Definir o formato de registro do Benchmark Blueprint opcional quando ele for usado como insumo de evolução.

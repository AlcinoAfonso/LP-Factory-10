# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para liberar nichos e orientar ajustes do projeto até a criação de LPs.

Fontes de referência: `README.md`, `docs/prompt-nicho-itens-estruturados.md`, `docs/template-blueprint.md`, `docs/schema.md`, `lib/conversion-content/landing-page/contracts.ts`, `lib/conversion-content/contracts.ts` e debate em chat.

## 1. O que estamos definindo

### 1.1. Entrega final esperada

- A entrega final é criar LPs testáveis e publicáveis por nicho.
- Tipos/intenção de LP: BOFU, MOFU e TOFU.
- BOFU, MOFU e TOFU não são canais; o canal é `landing_page`.
- Origem de tráfego é separada do tipo da LP: Google Ads, Instagram Ads, WhatsApp, QR Code, orgânico ou outra origem.
- LP teste por nicho é validação prática antes da liberação plena.

### 1.2. Critérios de liberação de nicho

- Critério 1: taxon ativo e corretamente posicionado na taxonomia.
- Critério 2: itens estruturados completos para `end_customer` no nicho filho e `business_buyer` próprio ou herdado do nicho pai com critério.
- Critério 3: composição parametrizada da LP criada para o nicho, com página, módulos, variantes, ordem, obrigatoriedade, config global e config por item.
- Critério 4: a definir após concluir o critério 3.

### 1.3. Papel dos itens estruturados

- `strategic_core`: mensagem, promessa, objeções, provas, vocabulário e CTA.
- `lp_overview`: config global da composição, incluindo tom visual, densidade, tipografia, mobile, extensão e estilo de imagem.
- `lp_sections`: seções, ordem, função no funil e composição conceitual.
- `seo`: intenção, vocabulário, termos, FAQ e requisitos básicos de busca.
- Os itens estruturados não precisam entregar limites de caracteres, escala tipográfica, tamanho de fonte ou parametrização técnica por campo.

### 1.4. Composição e variantes

- A estrutura padrão permanece módulo + variante.
- Módulo define a função estrutural.
- Variante define a execução específica daquela função.
- Parametrização define como a variante se comporta no tipo de LP, nicho e origem/funil.
- Exceções por nicho devem virar variantes reutilizáveis e hierarquicamente superiores, não ajustes soltos.

### 1.5. Parametrização

- A base inicial deve ser uma base reutilizável de parametrização para a família `landing_page`.
- A base deve considerar a precedência: família `landing_page` → tipo BOFU/MOFU/TOFU → módulo → variante → composição do nicho → item da composição.
- A fonte canônica da base reutilizável deve ser versionada no repositório, porque impacta renderer, contratos, testes e design system.
- O banco pode ter espelho, referência de versão ou payload operacional para leitura do Admin e da IA, mas não deve ser a única fonte canônica da base reutilizável.
- Parâmetro por campo significa regra para H1, H2, H3, parágrafo, CTA, eyebrow, nota de privacidade, FAQ, cards, benefícios e passos.
- Presets candidatos iniciais: `compact`, `default`, `premium`, sujeitos a validação no plano-base da base reutilizável de parametrização para `landing_page`.
- Presets não substituem BOFU/MOFU/TOFU, módulos ou variantes.
- Presets não autorizam override livre de design system, schema, renderer, segurança, performance ou acessibilidade.
- A base reutilizável deve resolver a maioria dos nichos.
- Nichos que exigirem parâmetros fora da base reutilizável devem usar variante própria reutilizável.

### 1.6. Blueprint

- O Blueprint não substitui nem compete com os itens estruturados.
- O Blueprint entra inicialmente como benchmark de ROI da LP teste, não como etapa obrigatória do critério 3.
- A comparação deve avaliar qualidade, conversão esperada, estrutura, clareza, visual, adequação ao nicho, lacunas e riscos.
- Se o Blueprint provar ganho claro, incorporar apenas a parte que gerou ganho: benchmark, lacunas, parametrização editorial, UX/CRO ou outra contribuição objetiva.

## 2. O que precisa ser ajustado ou implementado no projeto

### 2.1. Critério 1 — Taxon

- Confirmar regra operacional de taxon liberável.
- Garantir leitura clara de taxon pai e filho para herança quando aplicável.

### 2.2. Critério 2 — Itens estruturados

- Adequar a regra para aceitar `end_customer` no nicho filho e `business_buyer` próprio ou herdado do nicho pai.
- Registrar critério de segurança para herança de `business_buyer`.
- Bloquear liberação quando faltar bloco obrigatório.

### 2.3. Critério 3 — Composição parametrizada

- Criar ou ajustar fluxo Admin de curadoria da composição.
- Permitir que a IA proponha config global com base em `lp_overview`.
- Permitir que a IA proponha módulos, variantes, ordem, obrigatoriedade e config por item com base em `lp_sections`, `strategic_core` e `seo`.
- Resolver onde a config global da composição será persistida.
- Manter `content_template_composition_items` como relação 1:N de módulos/variantes.
- Registrar gaps de catálogo quando módulo ou variante essencial não existir.
- Impedir liberação plena até gap essencial ser criado e parametrizado.

### 2.4. Base reutilizável de parametrização

- Criar base reutilizável versionada no repositório para a família `landing_page`.
- Definir se o banco terá espelho, referência de versão ou payload operacional da base reutilizável para Admin e IA.
- Definir parâmetros por campo para a família `landing_page`.
- Definir limites editoriais iniciais para H1, H2, H3, parágrafo, CTA, FAQ, cards, benefícios, passos e nota de privacidade.
- Definir escala tipográfica inicial para presets candidatos, sem tratá-los como contrato final antes de validação.
- Definir ajustes por tipo de LP: BOFU, MOFU e TOFU.
- Definir quantidades padrão, como FAQ, benefícios/cards e passos.
- Definir quando uma exceção exige nova variante reutilizável.

### 2.5. Variantes

- Confirmar catálogo inicial de módulos e variantes de LP.
- Criar variantes quando a necessidade não couber na base reutilizável.
- Garantir que variantes sejam reutilizáveis em outros nichos sempre que possível.
- Definir hierarquia de variante universal, variante por tipo de LP e variante por nicho quando necessário.

### 2.6. Blueprint

- Implementar ou simular comparação de ROI entre LP teste do processo normal e benchmark orientado por Blueprint.
- Avaliar se o Blueprint melhora parametrização editorial, UX/CRO, lacunas, riscos ou qualidade da LP teste.
- Ajustar template do Blueprint se ele precisar entregar parâmetros de forma mais objetiva.
- Não tornar Blueprint obrigatório sem evidência de ganho.

### 2.7. Pendências técnicas

- Avaliar contratos, banco, renderer e Admin contra este plano.
- Ajustar o projeto somente após decisão registrada neste documento.
- Não criar nova tabela, campo, rota, job, automação ou agente sem plano-base ou briefing próprio.

## 3. Ambiguidades e decisões em aberto

- Definir se a base reutilizável ficará apenas no repositório ou também terá espelho/payload no banco.
- Definir onde persistir a config global da composição do nicho.
- Definir os valores exatos dos parâmetros por campo e dos presets candidatos.
- Definir se BOFU, MOFU e TOFU serão templates separados ou tipo/configuração dentro da composição.
- Definir se, após resolver base reutilizável, config global e config por item, o critério 3 pode ser considerado concluído.

# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para liberar nichos e orientar ajustes do projeto até a criação de LPs.

Fontes de referência: `README.md`, `docs/prompt-nicho-itens-estruturados.md`, `docs/template-blueprint.md`, `docs/schema.md`, `lib/conversion-content/landing-page/contracts.ts`, `lib/conversion-content/contracts.ts` e debate em chat.

## 1. O que estamos definindo

### 1.1. Entrega final esperada

- A entrega final é criar LPs testáveis e publicáveis por nicho.
- Tipos de LP: BOFU, MOFU e TOFU.
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

- A base inicial de parametrização deve ser universal por template/variante.
- Parâmetro por campo significa regra para H1, H2, H3, parágrafo, CTA, eyebrow, nota de privacidade, FAQ, cards, benefícios e passos.
- Presets iniciais: `compact`, `default`, `premium`.
- A base universal deve resolver a maioria dos nichos.
- Nichos que exigirem parâmetros fora da base universal devem usar variante própria reutilizável.

### 1.6. Blueprint

- O Blueprint não substitui nem compete com os itens estruturados.
- O Blueprint deve ser avaliado pelo que agrega além dos itens estruturados.
- Possíveis agregações: limites editoriais, UX/CRO, padrões externos de módulos e variantes, riscos, lacunas de catálogo e benchmark da LP teste.
- Ainda não está decidido se o Blueprint é obrigatório no critério 3, se será usado na validação da LP teste, ou ambos.

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

### 2.4. Base universal de parametrização

- Definir parâmetros universais por campo no template de LP.
- Definir limites editoriais iniciais para H1, H2, H3, parágrafo, CTA, FAQ, cards, benefícios, passos e nota de privacidade.
- Definir escala tipográfica inicial para `compact`, `default` e `premium`.
- Definir quantidades padrão, como FAQ, benefícios/cards e passos.
- Definir quando uma exceção exige nova variante reutilizável.

### 2.5. Variantes

- Confirmar catálogo inicial de módulos e variantes de LP.
- Criar variantes quando a necessidade não couber na base universal.
- Garantir que variantes sejam reutilizáveis em outros nichos sempre que possível.
- Definir hierarquia de variante universal, variante por tipo de LP e variante por nicho quando necessário.

### 2.6. Blueprint

- Avaliar se o Blueprint deve ser obrigatório no critério 3.
- Avaliar se o Blueprint deve ser usado como benchmark contra a LP teste.
- Ajustar template do Blueprint se ele precisar entregar parâmetros de forma mais objetiva.
- Registrar decisão final antes de avançar para critério 4.

### 2.7. Pendências técnicas

- Avaliar contratos, banco, renderer e Admin contra este plano.
- Ajustar o projeto somente após decisão registrada neste documento.
- Não criar nova tabela, campo, rota, job, automação ou agente sem plano-base ou briefing próprio.

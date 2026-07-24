# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para preparar taxons, gerar LPs reais e liberar seu uso.

Fontes de referência: `README.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, planos-base da jornada e implementação vigente no repositório.

## 1. Jornada da base até as LPs publicadas

### 1.1. Resultado final esperado

- Criar LPs testáveis e publicáveis por nicho ou ultranicho.
- `landing_page` é o canal; BOFU, MOFU e TOFU são intenções informadas na geração.
- A origem de tráfego permanece separada da intenção.
- A LP de validação deve ser criada pela E19 em uma conta normal autorizada, usando o mesmo fluxo futuro dos clientes.
- Não deve existir gerador, entidade ou persistência paralela de LP teste.

### 1.2. Preparar o taxon e resolver os itens estruturados

- O taxon deve estar ativo na cadeia `segmento → nicho → ultranicho`.
- A E10.8 resolve `end_customer` no taxon atendido e `business_buyer` próprio ou, na sua ausência, do pai direto.
- A resolução exige `strategic_core`, `lp_overview`, `lp_sections` e `seo`, sem mistura de fontes ou versões incompatíveis.
- O resultado preserva taxon atendido, origem, pesquisas, `audience_scope` e versões.
- Conteúdo, copy, prova, oferta, FAQ e CTA permanecem específicos do taxon atendido, mesmo quando a composição é herdada.

### 1.3. Manter a base raiz da família `landing_page`

- A E18.4 reúne a parametrização raiz versionada de `landing_page`, incluindo papéis semânticos, faixas editoriais, limites técnicos e princípios visuais, responsivos e de acessibilidade.
- O núcleo atual com registry, resolver, schema, falha fechada e contratos versionados permanece vigente enquanto essas proteções tiverem valor comprovado.
- A E18.4 não será automaticamente simplificada nem substituída antes da E20.3.
- Depois da otimização da E18.5, a E18.4 deve ser reavaliada somente se testes reais demonstrarem manutenção distribuída, rigidez desnecessária ou dificuldade relevante de extensão.
- Ajustar uma orientação deve exigir mudança localizada e validação proporcional ao dado alterado, sem banco ou nova infraestrutura.
- Os valores iniciais permanecem hipóteses até validação por LP real.

### 1.4. Manter e otimizar o catálogo de módulos e variantes

- A E18.5 mantém um catálogo executável, versionado e tipado para a IA e futuros consumidores conhecerem módulos, variantes, finalidades, estruturas, fields, fontes e capacidades permitidas.
- O núcleo incorporado pelo PR #590 permanece preservado: registry versionado, resolver genérico, Zod estrito, falha fechada, contratos TypeScript, API pública mínima, isolamento e imutabilidade profunda.
- Módulo representa função estrutural reutilizável; variante representa outra execução estrutural ou comportamental reutilizável da mesma função.
- Taxon, plano, campanha, conteúdo, ordem ou ajuste já permitido não justificam isoladamente novo módulo ou variante.
- Para o humano, adicionar ou ajustar módulo ou variante deve continuar simples por briefing e revisão do PR; internamente, a extensão frequente deve ficar concentrada na definição canônica da identidade, nos fields aplicáveis e nos contratos já existentes.
- Uma extensão que reutiliza capability ou interaction kind existente não deve exigir alteração do resolver, do schema genérico, dos contratos TypeScript de interação, de contagem global, de `switch` por path ou de listas paralelas evitáveis.
- Form e Accordion usam uma moldura discriminada comum de interações; capability interativa é derivada do contrato declarado, e capabilities de ação ou imagem são derivadas dos fields quando seguro.
- Código adicional permanece legítimo quando o primeiro caso real introduzir capability ou interaction kind realmente novo; nesse caso, contrato TypeScript, ramo discriminado, schema Zod e casos positivos e negativos próprios podem evoluir uma vez, sem criar propriedade isolada por variante.
- O primeiro caso real de mídia avançada deve introduzir moldura discriminada própria; a E18.5 não antecipa vídeo, áudio, animação, visual interativo ou 3D sem caso material.
- A otimização incorpora permanentemente `benefits@v1`, `benefits.standard@v1` e `hero.form@v1` e preserva os quatro testes de extensibilidade derivados do PR #617.
- A E18.5 não será substituída por catálogo apenas consultivo e não perderá as proteções comprovadas nos testes.
- A E18.5 não implementa dados concretos, conteúdo final, composição, renderer, persistência ou integração operacional.

### 1.5. Definir o catálogo de entradas para geração da LP

- A E20.2 define entradas universais e específicas por taxon e plano, separadas de composição e conteúdo.
- O catálogo indica campos obrigatórios, opcionais e condicionais; os valores reais pertencem à conta, oferta, campanha ou LP.
- O catálogo participa da prontidão, mas não decide automaticamente módulos, variantes ou ordem.
- `paid_search_keyword_map` permanece opcional para alinhamento entre busca, anúncio e LP.

### 1.6. Criar e aprovar a composição base do taxon

- Existe uma composição base canônica por taxon proprietário e versão, reutilizada entre planos.
- A composição pode pertencer a segmento ou nicho; composição própria de ultranicho é excepcional.
- Pelo Admin Dashboard, o administrador solicita à IA uma proposta baseada nas pesquisas resolvidas, na E18.4 e no catálogo E18.5.
- A IA propõe módulos, variantes, ordem, obrigatoriedade e escolhas permitidas; o sistema valida a proposta e o humano revisa, ajusta, salva como `draft`, aprova e ativa.
- A composição válida só pode referenciar módulos, variantes e versões oficialmente registrados na E18.5.
- Migration, seed, fixture, script ou insert direto podem apoiar testes, mas não criam a composição oficial nem atendem ao fluxo funcional.
- Uma versão ativa não é editada diretamente; mudança aprovada cria nova versão e preserva as anteriores.
- A composição do ancestral elegível é herdada quando não houver composição própria aprovada e a herança não estiver bloqueada.

### 1.7. Tratar gaps identificados pela IA

- A IA deve separar proposta válida, usando apenas o catálogo existente, de necessidades não atendidas por módulos ou variantes atuais.
- Identidade inexistente não pode entrar na composição válida; o sistema deve rejeitar referência desconhecida e mantê-la apenas como gap para decisão humana.
- A IA não cria novos contratos automaticamente.
- O administrador decide se o gap:
  - bloqueia a composição ou a prontidão atual e deve retornar à E18.5;
  - pode ser adiado, com justificativa, impacto, responsável e condição de retomada registrados.
- Gap de função estrutural aponta para novo módulo; diferença reutilizável de execução aponta para nova variante.
- Quando o gap for impeditivo, a composição permanece `draft`, a prontidão não é aprovada e a extensão segue por plano e PR próprios da E18.5.
- Depois do merge da nova identidade versionada, a IA deve refazer ou revalidar a composição antes da aprovação humana.
- A ampliação da E18.5 deve permanecer simples. Se uma extensão comum voltar a exigir alterações distribuídas, a arquitetura deve ser otimizada antes de prosseguir, sem remover proteções comprovadas.

### 1.8. Confirmar prontidão e autorizar a primeira geração

- A prontidão é avaliada por `taxon atendido + plano + versão da composição`.
- O checklist confirma taxon, E10.8, E18.4, E18.5, E20.2, composição própria ou herdada, compatibilidade e ausência de gaps impeditivos.
- A autorização é uma decisão humana para a combinação exata `conta + taxon + plano`, vinculada à prontidão aprovada.
- A conta permanece normal; outro taxon ou plano exige nova autorização.
- Autorização não substitui conta ativa, membership válido nem entitlement E9.

### 1.9. Gerar, revisar e publicar a LP real

- A E19 é o único fluxo de LPs para contas autorizadas e clientes liberados.
- Pelo Account Dashboard, a conta fornece os valores aplicáveis, gera, revisa e publica a LP conforme o recorte aprovado.
- A geração usa pesquisas E10.8, base E18.4, catálogo E18.5, composição E20 e entradas E20.2, sem alterar essas fontes.
- O snapshot preserva taxon, plano, valores, pesquisas, composição, módulos, variantes e versões usados.

### 1.10. Validar e liberar por plano

- O Admin Dashboard avalia a LP real produzida pela E19 e registra aprovação, rejeição ou correção.
- A liberação é registrada por taxon e plano; aprovação de um plano não libera automaticamente os superiores.
- A mesma composição é reutilizada entre planos.
- A regra exata para evoluir ou reutilizar a LP entre `starter`, `lite`, `pro` e `ultra` permanece para E19.4, E20.4 e E12.4.5–12.4.6.
- A evidência pode abranger descendentes que utilizem a mesma composição e versão, conforme decisão posterior de liberação.

## 2. O que precisa ser ajustado ou implementado no projeto

### 2.1. E10.8 — Pesquisas resolvidas

- Preservar o resolver server-side, determinístico, rastreável e fail-closed já concluído.
- E20 e E19 consomem seu resultado sem recalcular herança de pesquisas.

### 2.2. E18.4 — Base raiz versionada

- Preservar a implementação atual enquanto suas proteções permanecerem úteis para a E18.5 e para os consumidores reais.
- Reavaliar a extensibilidade somente depois da otimização e dos testes comparativos da E18.5.
- Criar plano próprio de otimização apenas se houver evidência de rigidez, manutenção distribuída ou artefato sem retorno proporcional.
- Garantir alteração localizada e validação proporcional ao dado alterado.

### 2.3. E18.5 — Otimização do catálogo executável

- Preservar o núcleo executável incorporado pelo PR #590 e suas proteções comprovadas.
- Incorporar `benefits@v1`, `benefits.standard@v1` e `hero.form@v1` como identidades permanentes.
- Remover contagens globais fixas, declarar fontes junto dos fields, eliminar o `switch` paralelo por path e reduzir listas e identidades paralelas evitáveis.
- Preferir relações Zod estruturais realmente genéricas a regras nominais vinculadas a variantes específicas.
- Reutilizar interaction kinds existentes pela coleção discriminada da variante e derivar capabilities simples de interactions e fields, evitando booleanos ou propriedades paralelas como fontes canônicas.
- Reservar a evolução de contratos e schema ao primeiro caso real de novo interaction kind; reutilizações posteriores devem permanecer localizadas.
- Manter resolver genérico, Zod estrito, falha fechada, tipagem, imutabilidade, casos negativos e API pública mínima.
- Repetir os quatro testes do PR #617 e comparar pontos de alteração, duplicações e proteções antes de concluir a otimização.
- Não substituir o catálogo por fonte apenas consultiva.

### 2.4. E20.2 — Catálogo de entradas

- Preservar catálogo declarativo, herança e resolução já concluídos.
- Valores operacionais e snapshot permanecem para a E19.

### 2.5. E20.3 e E12.4.3–12.4.4 — Composição e autorização

- Implementar no Admin Dashboard o fluxo real de solicitar proposta à IA, revisar, ajustar, salvar `draft`, aprovar e ativar a composição.
- Persistir composição, versões, herança, gaps, prontidão, aprovação, autorização e revogação conforme plano-base próprio.
- Usar composição única por taxon proprietário e avaliar prontidão separadamente por plano.
- Validar que a composição usa somente identidades e versões registradas na E18.5.
- Permitir que a IA registre gaps sem criar módulos ou variantes automaticamente.
- Manter composição com gap impeditivo em `draft` até a extensão da E18.5 ser mergeada e a proposta ser revalidada.
- Impedir atalhos que considerem composição oficial criada apenas por carga direta.

### 2.6. E19.4 — Fluxo único da LP por conta

- Evoluir a criação mínima existente para coleta de entradas, geração, revisão, publicação, tracking mínimo e snapshot.
- Exigir autorização específica ou liberação geral, além dos gates da E9 e da conta.
- Não criar fluxo especial para LP teste.

### 2.7. E20.4 e E12.4.5–12.4.6 — Liberação

- Avaliar a LP real e registrar a decisão por taxon e plano.
- Definir quando uma LP deve evoluir, quando nova evidência é necessária e quando a evidência pode ser reutilizada.
- Evitar exigir LPs repetidas sem diferença material apenas para cumprir todos os planos ou taxons descendentes.

### 2.8. Evolução controlada

- Aprendizados de LPs reais podem ajustar E18.4, E18.5, E20.2 ou composições por novos planos e versões.
- Benchmark Blueprint permanece opcional e não altera contratos automaticamente.
- Não criar catálogo multicanal, editor visual, agente ou nova infraestrutura sem evidência e plano-base próprios.

## 3. Ordem dos próximos planos-base

- 1º — otimizar a E18.5 preservando o núcleo do PR #590 e incorporando as extensões comprovadas.
- 2º — repetir comparativamente os quatro testes do PR #617 e consolidar a implementação material.
- 3º — reavaliar se a E18.4 necessita plano próprio; sem evidência de problema, mantê-la vigente e seguir.
- 4º — implementar E20.3 com a operação administrativa mínima da E12.4.3 e E12.4.4.
- 5º — implementar E19.4 como fluxo real e único de geração por conta.
- 6º — implementar a avaliação e liberação por E20.4 e E12.4.5–12.4.6.
- E10.8 e E20.2 permanecem concluídas e são consumidas pelos próximos recortes.

## 4. Onde cada ajuste entra no roadmap

### 4.1. E10

- E10.8 permanece responsável somente pela resolução das pesquisas de `landing_page`.
- Não cria composição, catálogo, geração ou UI administrativa.

### 4.2. E12

- `12.4.3` deve abranger proposição por IA, criação, revisão, aprovação, ativação e prontidão da composição.
- `12.4.4` opera autorização e revogação por `conta + taxon + plano`.
- `12.4.5` e `12.4.6` avaliam a LP real e registram a liberação.
- A E12 opera decisões humanas; os contratos e estados pertencem à E20.

### 4.3. E18

- E18.4 mantém a base raiz versionada e executável da família `landing_page`.
- E18.5 mantém o catálogo executável, versionado e tipado de módulos e variantes.
- A E18.5 será otimizada sem remover resolver, Zod, falha fechada, contratos tipados, imutabilidade ou API pública mínima.
- A E18.4 será reavaliada somente após os testes da E18.5 e não é condição automática para iniciar a E20.3.
- Ambos devem permanecer simples para o humano e eficientes para o sistema, sem antecipar renderer, persistência ou infraestrutura fora de seus recortes.

### 4.4. E20

- E20.2 permanece responsável pelo catálogo de entradas.
- E20.3 define e persiste composição, herança, gaps, prontidão e autorização, operados pela E12.
- E20.3 só aceita identidades oficialmente registradas na E18.5; sugestões inexistentes permanecem gaps até decisão humana e eventual extensão versionada.
- E20.4 define critérios de liberação por evidência da LP real.
- A composição é única por taxon proprietário e versão; prontidão e liberação são avaliadas por plano.

### 4.5. E19

- E19.4 gera e mantém a LP real da conta usando as fontes aprovadas.
- Conta de teste e cliente usam o mesmo fluxo.
- Não existe LP teste paralela nem geração pelo Admin Dashboard.

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

### 1.3. Manter a base geral da família `landing_page`

- A E18.4 reúne orientações gerais reutilizáveis, como papéis de texto, extensão, limites necessários e princípios visuais e responsivos.
- Essa base orienta a IA e os implementadores; no MVP, não deve funcionar como engine universal de geração, validação ou renderização.
- Ajustar uma orientação deve exigir mudança localizada na fonte versionada, sem banco, nova infraestrutura ou alterações distribuídas em consumidores genéricos.
- Regras técnicas rígidas só devem ser criadas quando houver consumidor real e necessidade comprovada.
- Os valores iniciais permanecem hipóteses até validação por LP real.

### 1.4. Manter o catálogo de módulos e variantes

- A E18.5 é um catálogo versionado e consultivo para a IA conhecer módulos, variantes, finalidades, estruturas sugeridas, campos usuais e cuidados relevantes.
- Módulo representa função estrutural reutilizável; variante representa outra execução reutilizável da mesma função.
- Taxon, plano, campanha, conteúdo, ordem ou ajuste já permitido não justificam isoladamente novo módulo ou variante.
- Adicionar ou ajustar módulo ou variante deve ser uma mudança simples e localizada no catálogo, sem banco, migration, novo resolver ou atualização de listas e testes genéricos duplicados.
- Código adicional só se justifica quando a nova opção exigir capacidade técnica ainda inexistente no fluxo real, como nova interação ou suporte de renderer.
- A implementação vigente da E18.4 e da E18.5 deve ser reavaliada e simplificada antes da E20.3; preservar o conhecimento útil e o histórico Git.

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
- Migration, seed, fixture, script ou insert direto podem apoiar testes, mas não criam a composição oficial nem atendem ao fluxo funcional.
- Uma versão ativa não é editada diretamente; mudança aprovada cria nova versão e preserva as anteriores.
- A composição do ancestral elegível é herdada quando não houver composição própria aprovada e a herança não estiver bloqueada.

### 1.7. Tratar gaps identificados pela IA

- A IA deve separar proposta válida, usando apenas o catálogo existente, de necessidades não atendidas por módulos ou variantes atuais.
- Ela não cria novos contratos automaticamente.
- O administrador decide se o gap:
  - bloqueia a composição ou a prontidão atual e deve retornar à E18.5;
  - pode ser adiado, com justificativa, impacto, responsável e condição de retomada registrados.
- Gap de função estrutural aponta para novo módulo; diferença reutilizável de execução aponta para nova variante.
- A ampliação da E18.5 deve permanecer simples. Se uma extensão comum exigir alterações espalhadas em vários schemas, resolvers ou testes genéricos, a arquitetura deve ser simplificada antes de prosseguir.

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

### 2.2. E18.4 — Base geral simples

- Reavaliar a implementação atual para manter somente orientação versionada necessária à IA e aos consumidores reais.
- Remover rigidez e artefatos sem consumidor comprovado.
- Garantir alteração localizada e validação proporcional ao dado alterado.

### 2.3. E18.5 — Catálogo consultivo simples

- Preservar as definições úteis dos módulos e variantes atuais.
- Substituir o catálogo executável excessivamente fechado por uma fonte consultiva simples e extensível.
- Tornar adição e ajuste de módulos e variantes localizados, sem listas duplicadas, contagens fixas ou regras genéricas vinculadas a chaves específicas.
- Manter revisão humana e critérios de reutilização.

### 2.4. E20.2 — Catálogo de entradas

- Preservar catálogo declarativo, herança e resolução já concluídos.
- Valores operacionais e snapshot permanecem para a E19.

### 2.5. E20.3 e E12.4.3–12.4.4 — Composição e autorização

- Implementar no Admin Dashboard o fluxo real de solicitar proposta à IA, revisar, ajustar, salvar `draft`, aprovar e ativar a composição.
- Persistir composição, versões, herança, gaps, prontidão, aprovação, autorização e revogação conforme plano-base próprio.
- Usar composição única por taxon proprietário e avaliar prontidão separadamente por plano.
- Permitir que a IA registre gaps sem criar módulos ou variantes automaticamente.
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

- 1º — simplificar a E18.4 como base geral consultiva e facilmente ajustável.
- 2º — simplificar a E18.5 como catálogo consultivo e facilmente extensível.
- 3º — implementar E20.3 com a operação administrativa mínima da E12.4.3 e E12.4.4.
- 4º — implementar E19.4 como fluxo real e único de geração por conta.
- 5º — implementar a avaliação e liberação por E20.4 e E12.4.5–12.4.6.
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

- E18.4 mantém a base geral consultiva da família `landing_page`.
- E18.5 mantém o catálogo consultivo de módulos e variantes.
- Ambos devem ser simples de ajustar e não antecipar engines, renderers ou validações sem consumidor real.
- As implementações atuais devem ser simplificadas por planos-base próprios antes da E20.3.

### 4.4. E20

- E20.2 permanece responsável pelo catálogo de entradas.
- E20.3 define e persiste composição, herança, gaps, prontidão e autorização, operados pela E12.
- E20.4 define critérios de liberação por evidência da LP real.
- A composição é única por taxon proprietário e versão; prontidão e liberação são avaliadas por plano.

### 4.5. E19

- E19.4 gera e mantém a LP real da conta usando as fontes aprovadas.
- Conta de teste e cliente usam o mesmo fluxo.
- Não existe LP teste paralela nem geração pelo Admin Dashboard.

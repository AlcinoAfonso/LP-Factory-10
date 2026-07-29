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
- Conteúdo, copy, prova, oferta, FAQ e CTA permanecem específicos do taxon atendido, mesmo quando o perfil de orientação é herdado.

### 1.3. Manter a base raiz da família `landing_page`

- A E18.4 reúne a parametrização raiz versionada de `landing_page`, incluindo papéis semânticos, faixas editoriais, limites técnicos e princípios visuais, responsivos e de acessibilidade.
- O núcleo atual com registry, resolver, schema, falha fechada e contratos versionados permanece vigente enquanto essas proteções tiverem valor comprovado.
- A E18.4 não é simplificada, substituída ou reaberta automaticamente.
- Sua reavaliação depende de testes com LPs reais que demonstrem manutenção distribuída, rigidez desnecessária ou dificuldade relevante de extensão.
- Ajustar uma orientação deve exigir mudança localizada e validação proporcional ao dado alterado, sem banco ou nova infraestrutura.
- Os valores iniciais permanecem hipóteses até validação por LP real.

### 1.4. Manter o catálogo de módulos e variantes

- A E18.5 mantém um catálogo executável, versionado e tipado para a IA e futuros consumidores conhecerem módulos, variantes, finalidades, estruturas, fields, fontes e capacidades permitidas.
- O catálogo otimizado preserva registry versionado, resolver genérico, Zod estrito, falha fechada, contratos TypeScript, API pública mínima, isolamento e imutabilidade profunda.
- Módulo representa função estrutural reutilizável; variante representa outra execução estrutural ou comportamental reutilizável da mesma função.
- Taxon, plano, campanha, conteúdo, ordem ou ajuste já permitido não justificam isoladamente novo módulo ou variante.
- Para o humano, adicionar ou ajustar módulo ou variante deve continuar simples por briefing e revisão do PR; internamente, extensões frequentes devem permanecer concentradas na identidade canônica, nos fields aplicáveis e nos contratos vigentes.
- Uma extensão que reutiliza capability ou interaction kind existente não deve exigir alteração do resolver, do schema genérico, dos contratos TypeScript de interação ou de listas paralelas evitáveis.
- Form e Accordion usam uma moldura discriminada comum de interações; capabilities são derivadas dos contratos e fields quando seguro.
- Código adicional permanece legítimo quando o primeiro caso real introduzir capability, interaction kind ou mídia realmente novos, sem antecipação para necessidades hipotéticas.
- As identidades já consolidadas permanecem canônicas; novas identidades dependem de função ou execução estrutural nova e comprovada.
- A E18.5 não será substituída por catálogo apenas consultivo e não perderá as proteções comprovadas nos testes.
- A E18.5 não implementa dados concretos, conteúdo final, perfil de orientação, renderer, persistência ou integração operacional.

### 1.5. Manter o catálogo de entradas para geração da LP

- A E20.2 define entradas universais e específicas por taxon e plano, separadas do perfil de orientação e do conteúdo.
- O catálogo indica campos obrigatórios, opcionais e condicionais; os valores reais pertencem à conta, oferta, campanha ou LP.
- O catálogo participa da prontidão, mas não decide automaticamente módulos, variantes ou ordem.
- `paid_search_keyword_map` permanece opcional para alinhamento entre busca, anúncio e LP.

### 1.6. Manter o perfil de orientação do taxon

- Existe um perfil versionado e evolutivo por taxon proprietário, reutilizado entre planos para orientar a geração inicial da LP.
- No MVP, o perfil próprio pertence somente a segmento ou nicho; ultranicho usa o perfil `active` do ancestral elegível mais próximo.
- Os estados persistidos são `draft`, `active` e `archived`.
- O perfil reúne orientação geral, módulos recomendados, variantes preferenciais, prioridades, ordem recomendada e orientações específicas por módulo.
- Prioridade orienta a seleção futura; ordem recomendada indica a posição relativa entre os módulos selecionados; nenhuma delas torna um módulo obrigatório.
- A E12.4.3 estabelece o Admin Dashboard como fluxo oficial para o `platform_admin` criar, revisar, salvar, ativar e arquivar versões do perfil.
- A IA pode propor uma versão inicial ou refinar o conteúdo atual somente após ação explícita; cada acionamento autoriza uma chamada e nenhuma proposta salva, aprova, ativa ou arquiva automaticamente.
- O fluxo manual permanece completo quando a IA não é usada, falha ou está indisponível.
- A orientação pode guiar escolhas dentro dos contratos vigentes, mas não redefinir, ampliar ou contrariar a E18.4 ou a E18.5; módulos e variantes referenciados devem existir na E18.5.
- Migration, seed, fixture, script ou insert direto podem apoiar testes, mas não substituem o fluxo oficial de gestão do perfil.
- Uma versão `active` não é editada diretamente; mudança aprovada cria nova versão e preserva as anteriores.
- Na ausência de perfil próprio ativo, o ancestral elegível mais próximo fornece a orientação herdada; sem ancestral elegível, o resultado é ausência tipada.

### 1.7. Tratar gaps identificados pela IA

- A IA deve separar recomendações válidas, usando apenas o catálogo existente, de necessidades não atendidas por módulos ou variantes atuais.
- Identidade inexistente não pode entrar nas recomendações oficiais e deve permanecer como gap para decisão humana.
- A IA não cria novos contratos automaticamente.
- O administrador decide se o gap:
  - bloqueia o perfil ou a prontidão atual e deve retornar à E18.5;
  - pode ser adiado, com justificativa, impacto, responsável e condição de retomada registrados.
- Gap de função estrutural aponta para novo módulo; diferença reutilizável de execução aponta para nova variante.
- Quando o gap for impeditivo, o perfil permanece `draft`, a prontidão não é aprovada e a extensão segue por plano e PR próprios da E18.5.
- Depois do merge da nova identidade versionada, a IA deve refazer ou revalidar o perfil antes da aprovação humana.
- A ampliação da E18.5 deve permanecer simples. Se uma extensão comum voltar a exigir alterações distribuídas, a arquitetura deve ser otimizada antes de prosseguir, sem remover proteções comprovadas.

### 1.8. Confirmar prontidão e autorizar a primeira geração

- A prontidão é avaliada por `taxon atendido + plano + versão do perfil`.
- O checklist confirma taxon, E10.8, E18.4, E18.5, E20.2, perfil próprio ou herdado, compatibilidade e ausência de gaps impeditivos.
- A autorização é uma decisão humana para a combinação exata `conta + taxon + plano`, vinculada à prontidão aprovada.
- A conta permanece normal; outro taxon ou plano exige nova autorização.
- Autorização não substitui conta ativa, membership válido nem entitlement E9.

### 1.9. Gerar, revisar e publicar a LP real

- A E19 é o único fluxo de LPs para contas autorizadas e clientes liberados.
- Pelo fluxo da E19, a conta fornece os valores aplicáveis, gera, revisa e publica a LP conforme o recorte aprovado.
- A geração usa pesquisas E10.8, base E18.4, catálogo E18.5, perfil E20 e entradas E20.2, sem alterar essas fontes.
- A LP é materializada como artefato independente; o snapshot preserva taxon, plano, valores, pesquisas, perfil e versão usados, mas mudanças futuras no perfil não alteram LPs existentes.

### 1.10. Validar e liberar por plano

- O Admin Dashboard avalia a LP real produzida pela E19 e registra aprovação, rejeição ou correção.
- A liberação é registrada por taxon e plano; aprovação de um plano não libera automaticamente os superiores.
- O mesmo perfil é reutilizado entre planos; a regra exata de seleção por prioridade permanece para a geração futura.
- A regra exata para evoluir ou reutilizar a LP entre `starter`, `lite`, `pro` e `ultra` permanece para E19.4, E20.4 e E12.4.5–12.4.6.
- A evidência pode abranger descendentes que utilizem o mesmo perfil e versão, conforme decisão posterior de liberação.

## 2. O que precisa ser preservado ou implementado no projeto

### 2.1. E10.8 — Pesquisas resolvidas

- Preservar o resolver server-side, determinístico, rastreável e fail-closed já concluído.
- E20 e E19 consomem seu resultado sem recalcular herança de pesquisas.

### 2.2. E18.4 — Base raiz versionada

- Preservar a implementação atual enquanto suas proteções permanecerem úteis para a E18.5 e para os consumidores reais.
- Reavaliar a extensibilidade somente quando testes com LPs reais demonstrarem rigidez, manutenção distribuída ou dificuldade material de extensão.
- Criar plano próprio de otimização apenas diante dessa evidência.
- Garantir alteração localizada e validação proporcional ao dado alterado.

### 2.3. E18.5 — Catálogo executável otimizado

- Preservar o catálogo executável, versionado e tipado já consolidado.
- Manter resolver genérico, Zod estrito, falha fechada, tipagem, imutabilidade, casos positivos e negativos e API pública mínima.
- Manter fields, fontes, capabilities e interações junto das identidades competentes, sem listas ou regras nominais paralelas evitáveis.
- Reutilizar capabilities e interaction kinds vigentes quando o novo caso não introduzir diferença estrutural real.
- Evoluir contratos e schema somente diante do primeiro caso material de nova capability, interaction kind ou mídia.
- Não substituir o catálogo por fonte apenas consultiva.

### 2.4. E20.2 — Catálogo de entradas

- Preservar catálogo declarativo, herança e resolução já concluídos.
- Valores operacionais e snapshot permanecem para a E19.

### 2.5. E20.3 — Perfil de orientação para geração

- Preservar o contrato, a persistência mínima e os três estados do perfil versionado por taxon.
- Manter orientação geral e recomendações por módulo, com variante preferencial, prioridade, ordem recomendada e orientação específica quando aplicável.
- Validar todas as referências contra a E18.5.
- Resolver perfil próprio ou herdado e entregá-lo por um único boundary server-side.
- O perfil orienta gerações futuras sem governar ou alterar a LP materializada.

#### 2.5.1. E12.4.3 — Operação administrativa do perfil

- Operar criação, edição, salvamento, ativação e arquivamento por decisão humana no Admin Dashboard.
- Manter `Salvar rascunho`, `Aprovar e ativar` e arquivamento como ações explícitas do `platform_admin`.
- Permitir proposta inicial e refinamento opcional por IA dentro do contrato fechado, sem persistência ou ativação automática.
- Exigir uma nova ação humana para cada chamada, sem conversa persistente, memória própria, retry ou continuidade automática.
- Preservar validação determinística, fallback manual completo e independência das LPs já materializadas.

### 2.6. E19.4 — Fluxo único da LP por conta

- Evoluir a criação mínima existente para coleta de entradas, geração, revisão, publicação, tracking mínimo e snapshot.
- Exigir autorização específica ou liberação geral, além dos gates da E9 e da conta.
- Não criar fluxo especial para LP teste.

### 2.7. E20.4 e E12.4.5–12.4.6 — Liberação

- Avaliar a LP real e registrar a decisão por taxon e plano.
- Definir quando uma LP deve evoluir, quando nova evidência é necessária e quando a evidência pode ser reutilizada.
- Evitar exigir LPs repetidas sem diferença material apenas para cumprir todos os planos ou taxons descendentes.

### 2.8. Evolução controlada

- Aprendizados de LPs reais podem ajustar E18.4, E18.5, E20.2 ou perfis de orientação por novos planos e versões.
- Benchmark Blueprint permanece opcional e não altera contratos automaticamente.
- Não criar catálogo multicanal, editor visual, agente ou nova infraestrutura sem evidência e plano-base próprios.

## 3. Ordem dos próximos planos-base

- Base consolidada para a jornada: E10.8, E18.4, E18.5, E20.2, E20.3 e E12.4.3.
- 1º — implementar E12.4.4 para prontidão, autorização e revogação por conta, taxon e plano.
- 2º — implementar E19.4 como fluxo real e único de geração, revisão, materialização e publicação por conta.
- 3º — implementar a avaliação e liberação por E20.4 e E12.4.5–12.4.6.
- Reabrir E18.4, E18.5, E20.2 ou o perfil de orientação somente diante de aprendizado material obtido com LPs reais.
- Gates operacionais remanescentes da E12.4.3 são acompanhados no roadmap e não criam novo plano conceitual.

## 4. Onde cada ajuste entra no roadmap

### 4.1. E10

- E10.8 permanece responsável somente pela resolução das pesquisas de `landing_page`.
- Não cria perfil de orientação, catálogo, geração ou UI administrativa.

### 4.2. E12

- `12.4.3` opera proposta por IA, revisão, salvamento, aprovação, ativação e arquivamento do perfil.
- `12.4.3.1` permite refinamento assistido do conteúdo atual do editor, sempre por ação explícita e sem persistência automática.
- `12.4.4` tratará prontidão, autorização e revogação por conta, taxon e plano.
- `12.4.5` e `12.4.6` avaliam a LP real e registram a liberação.
- A E12 opera decisões humanas; os contratos, estados e resolução pertencem à E20.

### 4.3. E18

- E18.4 mantém a base raiz versionada e executável da família `landing_page`.
- E18.5 mantém o catálogo executável, otimizado, versionado e tipado de módulos e variantes.
- Ambos devem permanecer simples para o humano e eficientes para o sistema, sem antecipar renderer, persistência ou infraestrutura fora de seus recortes.
- E18.4 ou E18.5 só devem ser reabertas diante de evidência material produzida por consumidores ou LPs reais.

### 4.4. E20

- E20.2 permanece responsável pelo catálogo de entradas.
- E20.3 mantém contrato, persistência, estados, validação e resolução própria ou herdada do perfil de orientação.
- A operação humana do lifecycle pertence à E12.4.3.
- Identidades inexistentes não entram nas recomendações oficiais e poderão ser tratadas posteriormente como gaps.
- E20.4 define critérios de liberação por evidência da LP real.

### 4.5. E19

- E19.4 gera e mantém a LP real da conta usando as fontes aprovadas.
- Conta de teste e cliente usam o mesmo fluxo.
- Não existe LP teste paralela nem geração pelo Admin Dashboard.

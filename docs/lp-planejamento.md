# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para preparar taxons, configurar contas, gerar LPs reais e liberar seu uso.

Fontes de referência: `README.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, planos-base da jornada e implementação vigente no repositório.

## 1. Jornada da base até as LPs publicadas

### 1.1. Resultado final esperado

- Criar LPs testáveis e publicáveis por nicho ou ultranicho.
- `landing_page` é o canal; BOFU, MOFU e TOFU são intenções informadas na geração.
- A origem de tráfego permanece separada da intenção.
- Depois de receber entitlement válido, a conta passa primeiro por onboarding e configuração mínima antes de criar ou gerar sua primeira LP.
- A LP de validação deve ser criada pela E19 em uma conta normal com entitlement válido, usando o mesmo fluxo futuro dos clientes.
- A conta piloto usa a origem `liberacao_manual` pelo fluxo administrativo vigente, sem autorização paralela.
- Não deve existir fluxo, entidade ou persistência paralela para LP teste; conta piloto e clientes usam o mesmo onboarding e a mesma jornada.
- A conta é proprietária dos dados reutilizáveis do negócio; owner ou admin são apenas os atores autorizados a configurá-los.

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

### 1.5. Manter o catálogo de entradas para configuração e geração da LP

- A E20.2 mantém um catálogo declarativo único, versionado e separado do perfil de orientação e do conteúdo.
- A resolução segue `universal → segmento → nicho → ultranicho`, aplicando somente as camadas da cadeia do taxon atendido e do plano informado.
- O catálogo define quais campos existem, sua aplicabilidade, origem esperada, tipo, validação e classificação como obrigatório, opcional ou condicional.
- Cada campo preserva um escopo explícito entre `account`, `business`, `offer`, `campaign` e `landing_page`.
- Valores de conta ou negócio funcionam como padrões reutilizáveis; valores de oferta podem alimentar várias LPs; valores de campanha pertencem ao contexto de aquisição; valores de `landing_page` pertencem somente à página concreta.
- O contrato de cada campo deve indicar se o valor é herdado, se admite substituição por LP e se a substituição integra o snapshot; não existe override genérico para qualquer campo.
- Nome do negócio, nome fantasia e logo oficial são valores da conta ou negócio. A LP pode decidir exibir ou omitir a logo, mas não substitui silenciosamente a fonte oficial por outra logo.
- A paleta visual é um padrão reutilizável da conta e pode admitir substituição explícita na LP.
- O estágio de funil pertence à LP.
- Configuração de Google Ads possui dois níveis: conexão e padrões reutilizáveis no nível da conta; associação de campanha, objetivo de conversão e mensuração específica no nível da LP.
- Credenciais, tokens e secrets de Google Ads não são campos comuns da E20.2 e pertencem ao boundary seguro da integração responsável.
- Os valores concretos pertencem à conta, negócio, oferta, campanha ou LP; a E19 os coleta, valida e persiste e preserva o snapshot da geração.
- Os campos da E20.2 não são copiados para o perfil da E20.3.
- Para a configuração mínima Starter, a conta deve informar ao menos o serviço ou oferta principal e uma descrição factual curta do que realmente entrega.
- Logo ou asset da marca é opcional; sua ausência não bloqueia o onboarding nem a futura geração.
- `paid_search_keyword_map` permanece opcional para alinhamento entre busca, anúncio e LP.
- A experiência apresenta somente os campos exigidos pelas capacidades do plano vigente; upgrade solicita apenas novos valores efetivamente consumidos, sem repetir toda a configuração.
- A E20.2 v1 ainda aplica campos equivalentes aos quatro planos; a E19.2 pode exigir refinamento focalizado de `allowedPlans`, tipos, escopos ou política de override quando houver consumidor real e aprovação pela barreira de admissão vigente, sem catálogo preventivo.

### 1.6. Manter o perfil de orientação do taxon

- Existe um perfil versionado e evolutivo por taxon proprietário, reutilizado entre planos para orientar a geração inicial da LP.
- Perfil `active` significa orientação estrutural revisada e aprovada para futuras gerações; não significa disponibilidade comercial, entitlement ou LP já testada.
- No MVP, o perfil próprio pertence a segmento ou nicho; ultranicho usa o perfil `active` do ancestral elegível mais próximo.
- Perfil próprio de ultranicho permanece evolução futura, excepcional, explícita e não bloqueante, caso a operação demonstre necessidade estrutural.
- Os estados persistidos são `draft`, `active` e `archived`.
- O perfil reúne módulos recomendados, variantes preferenciais, prioridades e ordem recomendada; `generation_guidance` e `item_guidance` são exceções humanas opcionais.
- Prioridade orienta a seleção futura; ordem recomendada indica a posição relativa entre os módulos selecionados; nenhuma delas torna um módulo obrigatório.
- A E12.4.3 estabelece o Admin Dashboard como fluxo oficial para o `platform_admin` criar, revisar, salvar, ativar e arquivar versões do perfil.
- A E12.4.3.2 usa `lp_sections` como esqueleto: em cada item de `coverage[]`, `compatible_aliases` registra as identidades semanticamente compatíveis e `selected_aliases` registra somente as identidades efetivamente escolhidas.
- `recommendations[]` é derivado exclusivamente de `selected_aliases`; o servidor reconstrói versões, deriva prioridade, ordem e gaps, deduplica por módulo e valida conflitos.
- Várias seções podem convergir para um módulo e uma seção pode exigir vários módulos; a prioridade é convertida por `3 → P1`, `2 → P2`, `1 → P3` e a ordem final é determinística, positiva e única.
- A seleção mantém uma identidade global por módulo; conflitos entre módulo-base e variante ou entre variantes do mesmo módulo falham fechados e não são resolvidos por prioridade, ordem ou posição.
- Cada acionamento autoriza uma chamada; a IA limita-se à compatibilidade e à seleção estrutural, não define versões, prioridade ou ordem nem altera `generation_guidance` ou `item_guidance`; nenhuma proposta é persistida, salva, aprovada, ativada, arquivada nem cria identidades automaticamente.
- O fluxo manual permanece completo quando a IA não é usada, falha ou está indisponível.
- A orientação pode guiar escolhas dentro dos contratos vigentes, mas não redefinir, ampliar ou contrariar a E18.4 ou a E18.5; módulos e variantes referenciados devem existir na E18.5.
- Migration, seed, fixture, script ou insert direto podem apoiar testes, mas não substituem o fluxo oficial de gestão do perfil.
- Uma versão `active` não é editada diretamente; mudança aprovada cria nova versão e preserva as anteriores.
- Na ausência de perfil próprio ativo, o ancestral elegível mais próximo fornece a orientação herdada; sem ancestral elegível, o resultado é ausência tipada.
- O perfil não absorve pesquisas, catálogos completos, valores concretos, oferta, copy, LP ou snapshot.

### 1.7. Tratar gaps identificados pela IA

- A assistência deve separar recomendações válidas, usando apenas o catálogo existente, de necessidades não atendidas pela seleção estrutural.
- Identidade inexistente não pode entrar nas recomendações oficiais, mas um gap não implica automaticamente novo módulo ou variante.
- O gap pode representar:
  - função estrutural ou execução reutilizável ausente;
  - problema de pesquisa ou modelagem;
  - característica ou orientação global não representada por identidade modular.
- Antes da ativação, o administrador decide se o gap:
  - exige `wait_for_modules` e mantém o perfil em `draft`;
  - permite `proceed_with_available` e autoriza a ativação com a pendência aceita.
- A decisão e o resumo dos gaps são registrados no evento de auditoria vigente ao salvar o rascunho, sem nova tabela.
- Somente evidência de nova função estrutural reutilizável encaminha novo módulo; somente evidência de nova execução estrutural ou comportamental reutilizável encaminha nova variante.
- Nenhuma extensão da E18.5 é automática; eventual correção segue pelo documento e PR próprios e, antes da ativação, o perfil deve ser reavaliado contra a identidade versionada vigente.
- A E12.4.4 não recalcula nem reclassifica posteriormente os gaps já decididos nesse lifecycle.
- A ampliação da E18.5 deve permanecer simples. Se uma extensão comum voltar a exigir alterações distribuídas, a arquitetura deve ser otimizada antes de prosseguir, sem remover proteções comprovadas.

### 1.8. Habilitar o onboarding após o entitlement

- Entitlement válido direciona a conta ao onboarding da E19.2 antes da criação ou geração da primeira LP; a disponibilidade pública da combinação permanece uma decisão comercial separada.
- A experiência da página da conta possui três estados derivados:
  - sem entitlement válido: experiência comercial e contratação, quando aplicável;
  - com entitlement e configuração incompleta: boas-vindas, orientação e onboarding da primeira LP Starter;
  - com entitlement e configuração completa: espaço operacional para criar ou continuar LPs.
- Não criar novo status de onboarding em `accounts`; a completude é derivada dos campos obrigatórios e condicionais aplicáveis ao taxon e ao plano.
- O onboarding reutiliza valores já existentes e solicita somente os ausentes, sem repetir o setup inicial da conta nem pedir novamente o nicho já resolvido.
- O taxon primário ativo é exibido como contexto autoritativo; ausência, inatividade ou ambiguidade falha fechada e nenhum taxon arbitrário pode ser escolhido.
- Owner ou admin ativo configura a conta; os valores permanecem pertencentes à conta ou ao negócio.
- Dados reutilizáveis do negócio devem permanecer separados dos valores específicos da oferta, campanha ou LP.
- Durante o primeiro onboarding, os campos essenciais permanecem visíveis em jornada guiada; depois da conclusão, valores reutilizáveis e alterações futuras ficam organizados na área ou seletor `Configurações`.
- A conta piloto usa o fluxo administrativo vigente de entitlement com origem `liberacao_manual`, plano, justificativa, operador e validade opcional, sem autorização paralela.
- O entitlement manual preserva as capacidades normais já vinculadas ao entitlement, inclusive as regras vigentes de membros e convites.

### 1.9. Configurar identidade visual e preparar a geração posterior

- A E19.2 coleta e confirma a configuração mínima da conta e o brief da primeira LP Starter; não gera conteúdo da LP.
- A logo é opcional e pode orientar a proposta visual, mas suas cores não limitam obrigatoriamente a LP.
- Com logo, o sistema pode usar suas cores como candidatas; sem logo, usa a orientação visual resolvida para o taxon e o contexto da LP para apresentar poucas paletas pré-validadas.
- Na E19.2 v1, a proposta inicial de paleta é manual ou determinística e pode considerar logo, quando houver, itens estruturais de `lp_overview` como `visual_tone`, `color_direction`, `image_style` e `typography_direction`, e os limites visuais da E18.4, sem depender de IA.
- A paleta apresenta funções compreensíveis para cor principal, secundária e de destaque, além de combinações acessíveis de fundo e texto.
- A conta pode aceitar, reorganizar, alterar ou escolher outra opção pré-validada; o fluxo separa proposta, edição e confirmação para que a origem da proposta possa evoluir sem alterar o contrato final.
- Contraste, legibilidade, foco e demais limites de acessibilidade permanecem validados deterministicamente.
- A paleta confirmada funciona como padrão reutilizável da conta, sem impedir outra escolha em uma LP específica.
- O plano-base da E19.2 define o contrato de logo, armazenamento seguro do asset, formatos, limites, remoção e persistência da paleta, sem presumir que uma URL livre ou JSON existente resolva o domínio.
- Ao concluir o onboarding, a conta fica apta a criar ou selecionar a identidade mínima de uma LP `draft` pelo fluxo vigente da E19.1.
- A E19 permanece o único fluxo de LPs para contas com entitlement válido; uma evolução posterior compõe E10.8, E18.4, E18.5, E20.2 e E20.3 e usa os valores confirmados no onboarding, sem alterar essas fontes.
- Na LP concreta, a seleção efetiva de módulos e variantes pertence ao servidor e deve considerar plano, prioridade, ordem recomendada e dados ou evidências operacionais disponíveis.
- A IA não escolhe taxon, plano, módulos, variantes, versões, prioridade ou ordem; módulo que dependa de informação ou evidência operacional ausente não entra na LP concreta.
- Se houver IA, ela produz somente conteúdo estruturado para os fields previamente selecionados pelo servidor; taxon, entitlement, plano, versões, cardinalidades, destinos de conversão, validação, persistência, estados e publicação permanecem determinísticos.
- A saída da IA permanece estruturada, validada, candidata e sujeita à revisão humana, sem HTML, CSS, JSX, identidade inventada ou fato, preço, prova, garantia ou condição não fornecidos.
- Geração cria conteúdo candidato em `draft`; revisão e correção são ações humanas e não publicam automaticamente; publicação é uma ação separada.
- A E20.2 define os campos; a E19 coleta, valida e persiste os valores concretos.
- A LP é materializada como artefato independente; o snapshot preserva os valores efetivamente usados, taxon atendido, plano, pesquisas e versões consumidas, perfil e versão própria ou herdada, versão do catálogo E20.2, root ou preset, módulos e variantes selecionados, ordem efetiva e versão do contrato de saída, sem que evoluções futuras dessas fontes alterem a LP existente.
- O snapshot não copia registries completos, módulos disponíveis não selecionados, pesquisas não utilizadas, prompts integrais, resposta bruta não validada, secrets nem todos os perfis ou taxons da plataforma.
- A regra exata de edição, regeneração, evolução entre planos, renderer e publicação permanece para o plano-base da evolução posterior da E19; a disponibilidade comercial continua posterior em E20.4 e E12.4.5–12.4.6.

### 1.10. Validar e disponibilizar por plano

- Depois que o pacote puder ser resolvido, o `platform_admin` decide a disponibilidade comercial da combinação `taxon + plano`.
- A LP real é a evidência preferencial, mas não obrigatória; equivalência, comparação, experiência operacional ou outra evidência suficiente podem fundamentar a decisão.
- Disponibilizar, suspender ou reativar exige justificativa; a referência a uma LP é opcional.
- Cada plano é decidido e registrado independentemente, sem propagação automática entre planos superiores ou inferiores.
- Uma mesma decisão humana pode abranger vários planos, desde que cada combinação `taxon + plano` seja registrada explicitamente e sem propagação automática.
- Não existe herança automática entre taxons ou descendentes; a mesma evidência pode sustentar outra combinação somente por decisão humana justificada.
- A disponibilidade controla exposição de cards, preços, checkout e novas contratações ou trials públicos.
- Quando nenhum plano estiver disponível, a página comercial informa a indisponibilidade sem prometer notificação inexistente, e o checkout falha fechado server-side.
- Depois do entitlement, as capacidades da conta continuam governadas pelo entitlement; suspensão comercial não cancela automaticamente entitlements, assinaturas ou LPs existentes.
- A regra exata para evoluir ou reutilizar a LP entre `starter`, `lite`, `pro` e `ultra` permanece para a evolução posterior da E19, E20.4 e E12.4.5–12.4.6.

### 1.11. Governar capacidades e limites por plano

- A E9 deve manter um catálogo canônico único de capacidades e limites para `starter`, `lite`, `pro` e `ultra`.
- O entitlement informa o `planKey` efetivo da conta; o catálogo informa o que esse plano permite; cada domínio aplica server-side a capacidade ou o limite correspondente.
- Disponibilidade comercial por `taxon + plano`, entitlement da conta e capacidades do plano são decisões distintas e não devem ser fundidas.
- A E20.2 define informações necessárias e não define quantidade de LPs, publicação, tracking, relatórios, leads ou CRM.
- Capacidades usam chaves estáveis e limites explícitos, sem condições espalhadas do tipo `if plan === ...` em páginas ou componentes.
- A UI consome o resultado resolvido e não reinterpreta o nome do plano.
- O contrato inicial do Starter deve prever:
  - quantidade limitada de LPs em `draft`, com número exato ainda sujeito a decisão humana;
  - no máximo uma LP publicada simultaneamente;
  - tracking mínimo confiável;
  - dashboard mínimo de resultados;
  - ausência de CRM completo;
  - eventual lista simples de leads somente quando existir captura real e recorte aprovado.
- O tracking mínimo deve começar por visualizações da LP, cliques no CTA principal e conversão confirmável quando aplicável.
- O dashboard mínimo deve informar LP, período, visualizações, cliques e conversões disponíveis, sem analytics avançado.
- Novos planos revelam capacidades e configurações adicionais de forma progressiva; upgrade não repete dados já confirmados e não promete recurso ainda não implementado e disponibilizado.
- A evolução contínua ocorre adicionando ou ajustando capacidades no catálogo canônico e implementando-as no domínio responsável, sem duplicar o contrato em E19, E20.2 ou na UI.

## 2. O que precisa ser preservado ou implementado no projeto

### 2.1. E10.8 — Pesquisas resolvidas

- Preservar o resolver server-side, determinístico, rastreável e fail-closed já concluído.
- E20 e E19 consomem seu resultado sem recalcular herança de pesquisas.
- `lp_overview` pode orientar sugestões visuais, mas não armazena logo, paleta confirmada ou valores concretos da conta.

### 2.2. E18.4 — Base raiz versionada

- Preservar a implementação atual enquanto suas proteções permanecerem úteis para a E18.5 e para os consumidores reais.
- Reavaliar a extensibilidade somente quando testes com LPs reais demonstrarem rigidez, manutenção distribuída ou dificuldade material de extensão.
- Criar plano próprio de otimização apenas diante dessa evidência.
- Garantir alteração localizada e validação proporcional ao dado alterado.
- Preservar contraste, legibilidade, papéis visuais, responsividade e acessibilidade como guardrails da sugestão e confirmação da paleta.

### 2.3. E18.5 — Catálogo executável otimizado

- Preservar o catálogo executável, versionado e tipado já consolidado.
- Manter resolver genérico, Zod estrito, falha fechada, tipagem, imutabilidade, casos positivos e negativos e API pública mínima.
- Manter fields, fontes, capabilities e interações junto das identidades competentes, sem listas ou regras nominais paralelas evitáveis.
- Reutilizar capabilities e interaction kinds vigentes quando o novo caso não introduzir diferença estrutural real.
- Evoluir contratos e schema somente diante do primeiro caso material de nova capability, interaction kind ou mídia.
- Não substituir o catálogo por fonte apenas consultiva.

### 2.4. E20.2 — Catálogo de entradas

- Preservar o catálogo declarativo, suas camadas, resolução por taxon e plano, proveniência, validação e barreira de admissão já concluídos.
- Não copiar os campos resolvidos para o perfil da E20.3.
- Refinar focalmente o catálogo para a E19.2 quando necessário para representar serviço ou oferta principal, descrição factual curta, logo opcional e paleta confirmada, com escopo, origem, tipo, validação, obrigação, plano e snapshot definidos.
- Formalizar em cada campo a política de reutilização, herança e eventual override por LP.
- Manter logo e nome do negócio como valores da conta ou negócio; manter funil como valor da LP; permitir paleta padrão da conta com override explícito por LP.
- Representar apenas configurações e referências não secretas de Google Ads; credenciais e tokens permanecem fora do catálogo.
- Não criar catálogo completo de produtos, serviços, mídias ou identidade visual antes de necessidade real.
- Valores operacionais, avaliação das condições concretas e snapshot permanecem para a E19.

### 2.5. E20.3 — Perfil de orientação para geração

- Preservar a persistência mínima e os três estados do perfil versionado por taxon.
- Preservar a E20.3.5 já implementada: `generation_guidance` é exceção humana opcional e, quando presente, permanece não vazia; `item_guidance` continua opcional e exclusivamente humano por item.
- Validar todas as referências contra a E18.5.
- Resolver perfil próprio ou herdado e entregá-lo por um único boundary server-side.
- A E20.3 é a fonte orientadora da estrutura; a E19 compõe todas as fontes necessárias à geração.
- O perfil orienta gerações futuras sem governar o onboarding, a disponibilidade comercial nem alterar a LP materializada.

#### 2.5.1. E12.4.3 — Operação administrativa do perfil

- Operar criação, edição, salvamento, ativação e arquivamento por decisão humana no Admin Dashboard.
- Manter `Salvar rascunho`, `Aprovar e ativar` e arquivamento como ações explícitas do `platform_admin`.
- Preservar a E12.4.3.2 já implementada: proposta inicial e refinamento estrutural por IA usam `coverage[]` com compatibilidade e seleção explícitas, enquanto o servidor deriva recomendações, versões, prioridade, ordem e gaps.
- Manter candidata, diff, coverage e gaps como resultados transitórios.
- Somente recomendações aplicadas e posteriormente salvas integram o perfil, mantendo aplicação, salvamento e lifecycle como ações separadas.
- Não permitir que a IA preencha ou modifique `generation_guidance` ou `item_guidance`, persista, ative ou crie identidades.
- Exigir uma nova ação humana para cada chamada, sem conversa persistente, memória própria, retry ou continuidade automática.
- Preservar validação determinística, fallback manual completo e independência das LPs já materializadas.

### 2.6. E19.2 — Onboarding e configuração mínima da conta para LP Starter

- A E19.1 já mantém a identidade mínima de uma LP `draft`, vinculada à conta e protegida pelos gates de conta, membership e entitlement.
- A E19.2 cria a experiência pós-entitlement da conta e prepara os valores reutilizáveis do negócio e o brief mínimo da primeira LP Starter, sem gerar conteúdo.
- Substituir a permanência na página comercial por onboarding quando houver entitlement válido e configuração incompleta; depois da conclusão, direcionar ao espaço operacional da E19.
- Reutilizar nome, contatos, site, taxon e demais valores existentes quando válidos e solicitar somente os dados ausentes.
- Coletar separadamente valores da conta ou negócio e valores específicos da primeira LP.
- Exigir para Starter serviço ou oferta principal e descrição factual curta; manter logo opcional.
- Apresentar e confirmar a paleta visual conforme a seção 1.9 por caminho manual ou determinístico na E19.2 v1, preservando possibilidade de alteração e override por LP.
- A E19.2 v1 deve permanecer integralmente utilizável sem IA; assistência futura pode produzir candidatas sem alterar os contratos da E20.2 nem a confirmação humana.
- Aplicar progressive disclosure conforme as capacidades efetivas resolvidas pela E9, sem hardcode do nome do plano.
- Organizar configurações reutilizáveis de conta em seletor ou área própria depois do primeiro onboarding.
- Separar configuração padrão de tracking no nível da conta da associação e mensuração específicas da LP.
- Não criar novo status de onboarding na conta; derivar completude do catálogo aplicável.
- Exigir owner ou admin ativo e entitlement válido, sem autorização adicional da E12.4.4.
- Derivar o taxon pela taxonomia autoritativa e falhar fechado diante de ausência, inatividade ou ambiguidade.
- Ao concluir, permitir criação ou seleção da LP `draft` pelo fluxo existente da E19.1.
- Não compor o pacote completo de geração, selecionar módulos, chamar IA de copy, materializar conteúdo, revisar ou publicar LP neste recorte.
- A evolução posterior da E19 deverá compor o pacote de fontes, selecionar módulos e variantes no servidor, gerar conteúdo estruturado, preservar snapshot e tracking mínimo, separar geração, revisão, correção e publicação e usar os valores confirmados pela E19.2, sem fluxo especial para LP teste ou prontidão paralela.

### 2.7. E20.4 e E12.4.5–12.4.6 — Disponibilidade comercial

- Avaliar evidências e registrar decisão humana justificada por `taxon + plano`.
- Permitir disponibilização, suspensão e reativação sem criar autorização por conta nem alterar entitlements existentes automaticamente.
- Definir quando uma LP deve evoluir, quando nova evidência é necessária e quando a evidência pode ser reutilizada por decisão humana.
- A LP real permanece evidência preferencial, não obrigatória.
- E10.6, E10.7 e a autoridade financeira da E11.2 consomem a disponibilidade somente para exposição comercial e checkout; depois do entitlement, permanecem vigentes as regras próprias da conta e de membros.

### 2.8. Evolução controlada

- Aprendizados de LPs reais podem ajustar E18.4, E18.5, E20.2 ou perfis de orientação por novos planos e versões.
- Benchmark Blueprint permanece opcional e não altera contratos automaticamente.
- Não criar catálogo multicanal, editor visual, agente ou nova infraestrutura sem evidência e plano-base próprios.

### 2.9. E9 — Catálogo de capacidades e limites por plano

- A E9 continua responsável pelo entitlement comercial e passa a planejar o contrato canônico de capacidades e limites por plano.
- O catálogo não substitui entitlement, disponibilidade comercial, taxonomia, E20.2 ou gates operacionais.
- O resolver recebe o plano efetivo e entrega capabilities e limites tipados para consumo server-side.
- O contrato deve distinguir, no mínimo, limites de LPs em `draft`, LPs publicadas, nível de tracking, nível de relatórios, captura ou gestão de leads e demais recursos evolutivos.
- O Starter começa com uma LP publicada simultaneamente, tracking e dashboard mínimos e sem CRM completo; a quantidade de rascunhos e a eventual lista simples de leads permanecem decisões humanas do plano-base.
- `public.plans`, `max_lps`, `max_conversions` e `features` são fontes atuais a avaliar, sem presumir que o contrato vigente já distingue todos os limites necessários.
- Cada domínio continua responsável por implementar e validar suas capacidades; a E9 não implementa LP Builder, tracking, analytics ou CRM.
- Novas capacidades entram de forma versionada e contínua, sem feature flags ou condicionais paralelas espalhadas pela aplicação.

## 3. Ordem dos próximos planos-base

- Base consolidada para a jornada: E10.8, E18.4, E18.5, E20.2, E20.3, incluindo E20.3.5, E12.4.3, incluindo E12.4.3.1–12.4.3.2, E19.1 e entitlement comercial da E9.
- 1º — preparar no E9 o plano-base do catálogo canônico de capacidades e limites por plano, começando pelo contrato mínimo do Starter.
- 2º — refinar focalmente a E20.2 para escopos, política de override e campos realmente consumidos pelo onboarding Starter.
- 3º — preparar o plano-base v1 da E19.2 para onboarding e configuração mínima Starter e reconciliar no mesmo PR as referências ativas do roadmap, preservando como históricos os planos já encerrados.
- 4º — no plano-base da E19.2, fechar contratos de valores, logo, paleta, tracking por nível, persistência, completude, progressive disclosure e transição da página comercial para o espaço operacional.
- 5º — implementar a E19.2 em fases pequenas, sem geração de conteúdo.
- 6º — validar o onboarding com a conta piloto e confirmar que o brief mínimo Starter está completo.
- 7º — avaliar e preparar o plano-base da evolução posterior da E19 para composição, geração, revisão, materialização e publicação.
- 8º — gerar e avaliar a primeira LP piloto pelo fluxo oficial da E19.
- 9º — planejar a disponibilidade comercial por `taxon + plano` em E20.4 e E12.4.5–12.4.6.
- A E12.4.4 é retirada da implementação e absorvida pela jornada simplificada; não é concluída nem bloqueia a E19.2.
- Reabrir E18.4, E18.5 ou o perfil de orientação somente diante de aprendizado material obtido com LPs reais. A E20.2 pode receber refinamento focalizado durante o planejamento ou a implementação da E19.2 quando houver consumidor real, necessidade concreta e aprovação pela barreira de admissão vigente.
- Gates operacionais remanescentes da E12.4.3 são acompanhados no roadmap e não criam novo plano conceitual.

## 4. Onde cada ajuste entra no roadmap

### 4.1. E10

- E10.8 permanece responsável somente pela resolução das pesquisas de `landing_page` e pode fornecer orientação visual estruturada à sugestão de paleta.
- E10.6 e E10.7 deverão consumir a futura disponibilidade por `taxon + plano` somente na experiência comercial e no checkout.
- E10 não armazena logo, paleta confirmada, valores operacionais, perfil de orientação, geração ou UI administrativa.

### 4.2. E12

- `12.4.3` opera proposta por IA, revisão, salvamento, aprovação, ativação e arquivamento do perfil.
- `12.4.3.1` mantém refinamento estrutural por ação explícita.
- `12.4.3.2` separa compatibilidade de seleção em `coverage[]`, mantém candidata e diff transitórios, deriva `recommendations[]` no servidor, audita a decisão humana sobre gaps e preserva a orientação textual exclusivamente humana.
- `12.4.3.3` permanece futuro e não bloqueante para refinamentos do editor e da modelagem do perfil.
- `12.4.4` é retirada da implementação e absorvida pela jornada simplificada, sem prontidão persistida, recálculo posterior de gaps, autorização ou revogação por conta.
- `12.4.5` e `12.4.6` deverão ser reconciliadas como operação humana de avaliação e disponibilidade comercial por `taxon + plano`.
- A E12 opera decisões humanas; os contratos, estados e resolução pertencem aos domínios responsáveis.

### 4.3. E18

- E18.4 mantém a base raiz versionada e executável da família `landing_page` e os limites visuais usados para validar a paleta.
- E18.5 mantém o catálogo executável, otimizado, versionado e tipado de módulos e variantes.
- Ambos devem permanecer simples para o humano e eficientes para o sistema, sem antecipar renderer, persistência ou infraestrutura fora de seus recortes.
- E18.4 ou E18.5 só devem ser reabertas diante de evidência material produzida por consumidores ou LPs reais.

### 4.4. E20

- E20.2 define e resolve o catálogo de entradas; a E19 coleta, valida e persiste os valores concretos e preserva o snapshot.
- O refinamento focalizado da E20.2 para a E19.2 deve cobrir somente valores realmente consumidos no onboarding Starter, inclusive serviço ou oferta principal, descrição factual, logo opcional, paleta confirmada, escopos e overrides autorizados.
- E20.2 não define capacidades ou limites comerciais do plano.
- E20.3 mantém contrato, persistência, estados, validação e resolução própria ou herdada do perfil de orientação, sem copiar a E20.2.
- A E20.3.5 mantém `generation_guidance` opcional e exclusivamente humano sem alterar estados, herança, resolução ou recomendações.
- A operação humana do lifecycle pertence à E12.4.3.
- Identidades inexistentes não entram nas recomendações oficiais; a decisão sobre gaps ocorre antes da ativação, sem recálculo obrigatório pela E12.4.4.
- E20.4 deverá definir critérios e evidências para a disponibilidade comercial por `taxon + plano`, sem autorização por conta.

### 4.5. E19

- A E19.1 mantém a identidade mínima da LP real em `draft` e os gates já implementados.
- A E19.2 implementa o onboarding pós-entitlement, coleta e confirmação dos valores mínimos Starter, identidade visual, configuração de tracking por nível e preparação do brief, sem gerar conteúdo.
- A E19.2 v1 deve permanecer utilizável sem IA; propostas futuras por IA devem produzir candidatas editáveis e confirmáveis, sem alterar contratos, ownership ou completude.
- A E19.2 consome capacidades e limites resolvidos pela E9 para controlar progressive disclosure e impedir hardcode do plano.
- Uma evolução posterior da E19 compõe o pacote atual de fontes e gera e mantém a LP real da conta com entitlement válido.
- Conta piloto e cliente usam o mesmo onboarding e o mesmo fluxo; o entitlement manual válido permite o piloto antes da disponibilidade pública.
- Não existe LP teste paralela, geração pelo Admin Dashboard, prontidão persistida nem dependência implementável da E12.4.4.

### 4.6. E9

- A E9 mantém entitlement, plano efetivo e o catálogo canônico de capacidades e limites.
- O catálogo começa pelo Starter e evolui para Lite, Pro e Ultra por chaves estáveis e limites explícitos.
- A E9 não implementa os recursos dos domínios consumidores; entrega o contrato resolvido que cada domínio aplica server-side.
- Disponibilidade comercial por taxon, entitlement da conta e capacidades do plano permanecem separados.

## 5. Evoluções prioritárias após a primeira LP real

- Gatilho comum: reavaliar somente após gerar e validar a primeira LP real pelo fluxo oficial, sem competir com o caminho crítico atual.

### 5.1. `pending_setup` e taxon assistidos por IA

- Reavaliar E10.4/E10.5.6 para uma experiência conversacional assistida por IA sobre negócio e oferta, com dois objetivos: apoiar a precisão e confirmação do taxon pelo fluxo autoritativo existente e gerar encantamento na primeira experiência relevante do lead.
- A evolução deve reutilizar o pipeline de resolução vigente; a IA não cria nem altera silenciosamente o taxon, e a E19 continua apenas consumindo o taxon autoritativo.

### 5.2. Assistência por IA na configuração da LP

- Manter a E19.2 v1 integralmente utilizável sem IA; após a primeira LP validada, avaliar assistência opcional para serviço/oferta e identidade visual.
- A IA futura produz somente candidatas; o cliente edita e confirma, enquanto campos, ownership, validação e completude da E20.2 permanecem inalterados.
- O desenho atual deve separar a origem da proposta do valor confirmado para permitir essa evolução sem reconstruir domínio, persistência ou jornada.

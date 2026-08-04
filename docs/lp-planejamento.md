# Planejamento de LPs — LP Factory 10

Fonte objetiva de decisão para preparar taxons, gerar LPs reais e liberar seu uso.

Fontes de referência: `README.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, planos-base da jornada e implementação vigente no repositório.

## 1. Jornada da base até as LPs publicadas

### 1.1. Resultado final esperado

- Criar LPs testáveis e publicáveis por nicho ou ultranicho.
- `landing_page` é o canal; BOFU, MOFU e TOFU são intenções informadas na geração.
- A origem de tráfego permanece separada da intenção.
- A LP de validação deve ser criada pela E19 em uma conta normal com entitlement válido, usando o mesmo fluxo futuro dos clientes.
- A conta piloto usa a origem `liberacao_manual` pelo fluxo administrativo vigente, sem autorização paralela.
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

- A E20.2 mantém um catálogo declarativo único, versionado e separado do perfil de orientação e do conteúdo.
- A resolução segue `universal → segmento → nicho → ultranicho`, aplicando somente as camadas da cadeia do taxon atendido e do plano informado.
- O catálogo define quais campos existem, sua aplicabilidade, origem esperada, tipo, validação e classificação como obrigatório, opcional ou condicional.
- Os valores concretos pertencem à conta, negócio, oferta, campanha ou LP; a E19 os coleta, valida e persiste e preserva o snapshot da geração.
- Os campos da E20.2 não são copiados para o perfil da E20.3.
- `paid_search_keyword_map` permanece opcional para alinhamento entre busca, anúncio e LP.
- Antes ou durante o plano da E19.4, revisar os campos somente diante de necessidade concreta do piloto e da barreira de admissão vigente da E20.2, sem inclusão preventiva.

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

### 1.8. Resolver o pacote e habilitar a geração piloto

- Em cada tentativa, a E19 prossegue somente quando o pacote atual de fontes puder ser resolvido com sucesso.
- Um único boundary server-side compõe E10.8, E18.4, E18.5, E20.2 e E20.3, preservando versões e proveniência sem duplicar as regras de cada domínio.
- O resultado de pacote resolvível não é persistido e não cria status de prontidão, fingerprint, obsolescência ou autorização paralela.
- A conta piloto usa o fluxo administrativo vigente de entitlement com origem `liberacao_manual`, plano, justificativa, operador e validade opcional.
- Entitlement válido controla o acesso da conta à E19; a indisponibilidade pública da combinação não bloqueia a geração piloto.
- A E19 deve derivar ou validar o taxon atendido com base na taxonomia autoritativa da conta, sem aceitar taxon arbitrário.
- Ausência, inatividade ou ambiguidade do taxon autoritativo falha fechada; a regra entre taxon primário e descendente compatível será definida na E19.4.
- O entitlement manual preserva as capacidades normais já vinculadas ao entitlement, inclusive as regras vigentes de membros e convites.

### 1.9. Gerar, revisar e publicar a LP real

- A E19 é o único fluxo de LPs para contas com entitlement válido.
- Pelo fluxo da E19, a conta fornece os valores aplicáveis, e o sistema valida a completude, gera, revisa e publica a LP conforme o recorte aprovado.
- A geração usa o pacote composto de pesquisas E10.8, base E18.4, catálogo E18.5, catálogo de entradas E20.2 e perfil E20.3, sem alterar essas fontes.
- A E20.2 define os campos; a E19 coleta, valida e persiste os valores concretos.
- A LP é materializada como artefato independente; o snapshot preserva taxon, plano, valores e versões das fontes usadas, mas mudanças futuras nessas fontes não alteram LPs existentes.
- A regra exata de edição, regeneração, evolução entre planos, renderer e publicação permanece para o plano da E19.4.

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
- A regra exata para evoluir ou reutilizar a LP entre `starter`, `lite`, `pro` e `ultra` permanece para E19.4, E20.4 e E12.4.5–12.4.6.

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

- Preservar o catálogo declarativo, suas camadas, resolução por taxon e plano, proveniência, validação e barreira de admissão já concluídos.
- Não copiar os campos resolvidos para o perfil da E20.3.
- Revisar candidatos adicionais apenas a partir de consumidor real e necessidade comprovada na E19.4.
- Valores operacionais, avaliação das condições concretas e snapshot permanecem para a E19.

### 2.5. E20.3 — Perfil de orientação para geração

- Preservar a persistência mínima e os três estados do perfil versionado por taxon.
- Preservar a E20.3.5 já implementada: `generation_guidance` é exceção humana opcional e, quando presente, permanece não vazia; `item_guidance` continua opcional e exclusivamente humano por item.
- Validar todas as referências contra a E18.5.
- Resolver perfil próprio ou herdado e entregá-lo por um único boundary server-side.
- A E20.3 é a fonte orientadora da estrutura; a E19 compõe todas as fontes necessárias à geração.
- O perfil orienta gerações futuras sem governar a disponibilidade comercial nem alterar a LP materializada.

#### 2.5.1. E12.4.3 — Operação administrativa do perfil

- Operar criação, edição, salvamento, ativação e arquivamento por decisão humana no Admin Dashboard.
- Manter `Salvar rascunho`, `Aprovar e ativar` e arquivamento como ações explícitas do `platform_admin`.
- Preservar a E12.4.3.2 já implementada: proposta inicial e refinamento estrutural por IA usam `coverage[]` com compatibilidade e seleção explícitas, enquanto o servidor deriva recomendações, versões, prioridade, ordem e gaps.
- Manter candidata, diff, coverage e gaps como resultados transitórios.
- Somente recomendações aplicadas e posteriormente salvas integram o perfil, mantendo aplicação, salvamento e lifecycle como ações separadas.
- Não permitir que a IA preencha ou modifique `generation_guidance` ou `item_guidance`, persista, ative ou crie identidades.
- Exigir uma nova ação humana para cada chamada, sem conversa persistente, memória própria, retry ou continuidade automática.
- Preservar validação determinística, fallback manual completo e independência das LPs já materializadas.

### 2.6. E19.4 — Fluxo único da LP por conta

- Evoluir a criação mínima existente para compor o pacote de fontes, coletar e persistir valores, gerar, revisar, publicar, preservar tracking mínimo e snapshot.
- Exigir conta e membership permitidos e entitlement válido conforme a E9, sem autorização adicional da E12.4.4.
- Derivar ou validar o taxon atendido pela taxonomia autoritativa da conta e falhar fechado diante de ausência, inatividade, ambiguidade ou taxon arbitrário.
- Usar a mesma resolução do pacote na geração piloto e nas gerações posteriores, sem persistir prontidão paralela.
- Não criar fluxo especial para LP teste.

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

## 3. Ordem dos próximos planos-base

- Base consolidada para a jornada: E10.8, E18.4, E18.5, E20.2, E20.3, incluindo E20.3.5, e E12.4.3, incluindo E12.4.3.1–12.4.3.2.
- 1º — reconciliar os documentos derivados da E12.4 e o roadmap com este planejamento.
- 2º — avaliar os gates residuais da E19.4: campos mínimos da E20.2, fontes do taxon piloto, taxonomia autoritativa da conta, contrato do pacote e persistência mínima dos valores.
- 3º — preparar e implementar a E19.4 como fluxo real e único de geração, revisão, materialização e publicação por conta.
- 4º — gerar e avaliar a primeira LP piloto pelo fluxo oficial da E19.
- 5º — planejar a disponibilidade comercial por `taxon + plano` em E20.4 e E12.4.5–12.4.6.
- A E12.4.4 é retirada da implementação e absorvida pela jornada simplificada; não é concluída nem bloqueia a E19.4.
- Reabrir E18.4, E18.5 ou o perfil de orientação somente diante de aprendizado material obtido com LPs reais. A E20.2 pode receber refinamento focalizado durante o planejamento ou a implementação da E19.4 quando houver consumidor real, necessidade concreta e aprovação pela barreira de admissão vigente.
- Gates operacionais remanescentes da E12.4.3 são acompanhados no roadmap e não criam novo plano conceitual.

## 4. Onde cada ajuste entra no roadmap

### 4.1. E10

- E10.8 permanece responsável somente pela resolução das pesquisas de `landing_page`.
- E10.6 e E10.7 deverão consumir a futura disponibilidade por `taxon + plano` somente na experiência comercial e no checkout.
- E10 não cria perfil de orientação, catálogo, geração ou UI administrativa.

### 4.2. E12

- `12.4.3` opera proposta por IA, revisão, salvamento, aprovação, ativação e arquivamento do perfil.
- `12.4.3.1` mantém refinamento estrutural por ação explícita.
- `12.4.3.2` separa compatibilidade de seleção em `coverage[]`, mantém candidata e diff transitórios, deriva `recommendations[]` no servidor, audita a decisão humana sobre gaps e preserva a orientação textual exclusivamente humana.
- `12.4.3.3` permanece futuro e não bloqueante para refinamentos do editor e da modelagem do perfil.
- `12.4.4` é retirada da implementação e absorvida pela jornada simplificada, sem prontidão persistida, recálculo posterior de gaps, autorização ou revogação por conta.
- `12.4.5` e `12.4.6` deverão ser reconciliadas como operação humana de avaliação e disponibilidade comercial por `taxon + plano`.
- A E12 opera decisões humanas; os contratos, estados e resolução pertencem aos domínios responsáveis.

### 4.3. E18

- E18.4 mantém a base raiz versionada e executável da família `landing_page`.
- E18.5 mantém o catálogo executável, otimizado, versionado e tipado de módulos e variantes.
- Ambos devem permanecer simples para o humano e eficientes para o sistema, sem antecipar renderer, persistência ou infraestrutura fora de seus recortes.
- E18.4 ou E18.5 só devem ser reabertas diante de evidência material produzida por consumidores ou LPs reais.

### 4.4. E20

- E20.2 define e resolve o catálogo de entradas; a E19 coleta, valida e persiste os valores concretos e preserva o snapshot.
- E20.3 mantém contrato, persistência, estados, validação e resolução própria ou herdada do perfil de orientação, sem copiar a E20.2.
- A E20.3.5 mantém `generation_guidance` opcional e exclusivamente humano sem alterar estados, herança, resolução ou recomendações.
- A operação humana do lifecycle pertence à E12.4.3.
- Identidades inexistentes não entram nas recomendações oficiais; a decisão sobre gaps ocorre antes da ativação, sem recálculo obrigatório pela E12.4.4.
- E20.4 deverá definir critérios e evidências para a disponibilidade comercial por `taxon + plano`, sem autorização por conta.

### 4.5. E19

- E19.4 compõe o pacote atual de fontes e gera e mantém a LP real da conta com entitlement válido.
- A E19 coleta, valida e persiste os valores concretos e preserva o snapshot das fontes e dos valores usados.
- Conta piloto e cliente usam o mesmo fluxo; o entitlement manual válido permite o piloto antes da disponibilidade pública.
- Não existe LP teste paralela, geração pelo Admin Dashboard, prontidão persistida nem dependência implementável da E12.4.4.

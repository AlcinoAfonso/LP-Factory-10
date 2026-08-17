# Planejamento de LPs — LP Factory 10

Fonte conceitual de decisão para preparar taxons, configurar contas, gerar LPs reais e liberar seu uso.

Status arquitetural: reconciliado com o Cenário E e com a semântica vigente de LP, tentativa, revisão e lifecycle em 17/08/2026. Este documento distingue o caminho canônico vigente de ativos históricos ainda preservados no projeto. Estar fora do caminho canônico não autoriza remoção física; qualquer retirada depende de auditoria de consumidores, dados e dependências no roadmap e no repositório.

Fontes de referência: `README.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, `docs/lousa-plano-base-e19-4.md` no HEAD vigente do PR #759, `docs/lousa-plano-base-e19-5.md` / PR #726 apenas como histórico do plano em reconciliação e implementação atual de `account_landing_pages` e `account_landing_page_materializations` no repositório.

## 1. Jornada da base até as LPs publicadas

### 1.1. Resultado final esperado

- Criar LPs testáveis e publicáveis por nicho ou ultranicho, usando o mesmo fluxo oficial para conta piloto e clientes.
- `landing_page` é o canal; BOFU, MOFU e TOFU são intenções da LP, e a origem de tráfego permanece separada da intenção.
- Depois de receber entitlement válido, a conta passa por onboarding e configuração factual antes da geração da primeira LP.
- Não deve existir fluxo, entidade ou persistência paralela para LP teste.
- A conta é proprietária dos dados reutilizáveis do negócio; owner ou admin são atores autorizados a configurá-los.
- A primeira LP real deve ser produzida a partir de taxon preparado, configuração factual válida e contexto autorizado, sem atalhos administrativos específicos da conta piloto.
- O grau de determinismo acompanha a natureza da decisão: segurança, autorização, fatos, estado, bindings e contratos permanecem determinísticos; decisões semânticas, narrativas, criativas e persuasivas preservam flexibilidade controlada da IA.
- Não antecipar deterministicamente uma decisão que o workload existe justamente para a IA tomar.
- **Identidade comercial estável:** `landing_page` é a identidade comercial da página; uma tentativa é uma execução de geração, e somente uma tentativa válida produz uma nova revisão gerada da mesma LP.
- Enquanto estiver em `draft`, a mesma LP pode continuar evoluindo por novas tentativas e revisões; regenerar não cria uma nova `account_landing_pages`.
- Cada revisão válida é preservada de forma append-only; revisões anteriores não são sobrescritas, e a revisão corrente pode alimentar o preview.
- O histórico de revisões pertence à própria LP; a lista principal do workspace mantém uma linha por LP comercial, e nova identidade só nasce quando o usuário realmente deseja outra página comercial.
- **Lifecycle de produto:** `draft` representa LP ativa em trabalho e pode receber novas tentativas/revisões; `archived` é direção aprovada para futura implementação no workspace, removendo a LP da lista operacional principal sem perder identidade, configuração ou revisões e permitindo restauração para `draft`.
- Hard delete não é requisito atual; política definitiva de retenção e exclusão fica para recorte futuro. O schema vigente ainda materializa apenas `draft`, e a forma física de `archived` não é definida neste documento.
- **Independência das revisões materializadas:** cada revisão preservada possui conteúdo e snapshot suficientes para reprodução; evolução posterior das fontes canônicas não altera silenciosamente revisões existentes.
- Edições e regenerações futuras devem adotar versões mais novas das fontes somente por ação explícita e contrato próprio.

### 1.2. Preparar o taxon para geração

- A preparação do taxon ocorre antes da geração e está materializada pelos recortes E20.5 e E20.6.
- O taxon precisa estar ativo na taxonomia autoritativa.
- A E20.5 mantém uma versão integral `end_customer` explicitamente selecionada por decisão humana e validada por boundary server-side.
- As versões integrais permanecem imutáveis no GitHub em `docs/pesquisas-brutas/<taxon_slug>/end_customer/vN.md`; criar nova versão não altera automaticamente a seleção vigente.
- `business_buyer` não é requisito da preparação do taxon nem do caminho canônico de geração da LP `end_customer`.
- A E20.6 confronta a pesquisa integral selecionada com uma versão executável E20.2 escolhida explicitamente, sem `latest` ou maior versão implícita.
- A decisão de suficiência permanece humana; a assistência por IA não grava automaticamente a aprovação.
- O estado `prepared` é derivado, não persistido: taxon ativo + pesquisa integral selecionada/válida + `reviewed_input_catalog_version` compatível com a versão E20.2 explicitamente requerida.
- Gap factual real identificado na avaliação retorna à E20.2 para evolução e nova avaliação; ausência de gap não cria especialização preventiva.
- E10.8, E18.5 e E20.3 não participam deste gate.

### 1.3. Manter a base raiz da família `landing_page`

- A E18.4 reúne a parametrização raiz versionada de `landing_page`, incluindo papéis semânticos, faixas editoriais, limites técnicos e princípios visuais, responsivos e de acessibilidade.
- A E18.4 permanece autoridade ativa no caminho canônico enquanto suas proteções tiverem valor comprovado.
- A E19.3 projeta somente o subconjunto necessário à geração; não duplica a parametrização raiz.
- A E19.4 decide a jornada narrativa e a composição dentro dos limites aplicáveis, sem transformar E18.4 em schema rígido de página.
- A reavaliação da E18.4 depende de evidência produzida por LPs reais, como rigidez desnecessária, manutenção distribuída ou dificuldade material de extensão.
- Ajustes devem permanecer localizados e com validação proporcional, sem nova infraestrutura por antecipação.

### 1.4. Preservar o catálogo de módulos e variantes fora do caminho canônico

- A E18.5 existe, está implementada e mantém catálogo executável, versionado e tipado de módulos e variantes.
- **Situação arquitetural atual:** E18.5 está fora do caminho canônico E19.3 → E19.4 do Cenário E e não governa a estrutura da primeira LP real.
- A E19.4 não deve voltar a usar E18.5 para selecionar previamente módulos, variantes, prioridade ou ordem antes da decisão da IA.
- A implementação permanece preservada porque ainda pode possuir consumidores administrativos e dependências históricas, inclusive ligadas à E20.3.
- Enquanto a auditoria geral do roadmap e dos consumidores não estiver concluída, não remover código, contratos, migrations ou dados de E18.5 apenas por ela ter perdido autoridade arquitetural.
- Também não expandir E18.5 para atender o Cenário E. Nova utilização exige consumidor real e decisão explícita.
- Se a auditoria comprovar ausência de consumidor necessário, a retirada deverá ocorrer em recorte próprio, com mapa de dependências e regressões proporcionais.

### 1.5. Manter o catálogo de entradas para configuração e geração da LP

- A E20.2 mantém um catálogo declarativo único, versionado e separado de conteúdo, pesquisa e composição narrativa.
- A resolução canônica usa versão explícita, plano efetivo e cadeia taxonômica autoritativa completa.
- A herança segue `universal → segmento → nicho → ultranicho autorizado`; camadas inexistentes são simplesmente herdadas, e especializações só podem ocorrer dentro das regras do resolver canônico.
- A E19.3 nunca reconstrói manualmente essa herança.
- O catálogo define fields, aplicabilidade, origem esperada, tipo, validação, obrigação e demais propriedades contratuais.
- Cada field preserva escopo entre `account`, `business`, `offer`, `campaign` e `landing_page`.
- Valores concretos pertencem à conta, negócio, oferta, campanha ou LP e são coletados/persistidos pela E19.2, não pela E20.2.
- A versão histórica da configuração E19.2 permanece distinta da versão E20.2 revisada para geração.
- Na geração, a E19.3 resolve `reviewed_input_catalog_version` com plano efetivo + cadeia taxonômica completa e revalida read-only os valores históricos contra os fields efetivos resultantes.
- Se a revalidação revelar novo field obrigatório aplicável, valor ausente ou incompatível, a E19.3 falha fechado e devolve o gap factual à E19.2 para coleta/correção.
- Se revelar defeito no catálogo, resolver, camada ou especialização E20.2, o gap retorna à E20.2.
- Não migrar nem regravar configuração histórica apenas para alinhar número de versão quando os valores continuam válidos.
- A versão executável atual já evoluiu além da v2; nenhuma parte do planejamento deve presumir que maior versão disponível é automaticamente a versão consumida.

### 1.6. Preservar o perfil de orientação fora do caminho canônico

- A E20.3 existe, está implementada e mantém perfil versionado por taxon, lifecycle administrativo, resolução própria ou herdada e integrações com E18.5.
- **Situação arquitetural atual:** E20.3 está fora do caminho canônico E19.3 → E19.4 do Cenário E e não é gate, fonte obrigatória de estrutura nem pré-condição da primeira LP real.
- Perfil `active`, recomendações, variantes preferenciais, prioridade, ordem, `generation_guidance` e `item_guidance` não governam a geração atual.
- A E19.4 não deve consultar E20.3 para decidir narrativa, seções, ordem ou layout.
- O lifecycle administrativo E12.4.3 permanece preservado enquanto os consumidores e dados de E20.3 forem auditados.
- Não criar novos perfis ou expandir o domínio E20.3 para sustentar o Cenário E.
- Remoção futura de E20.3, E12.4.3 associado, tabelas, adapters ou páginas Admin exige recorte próprio e prova de ausência de consumidor necessário.

### 1.7. Tratar gaps e ativos históricos sem reintroduzir a arquitetura antiga

- Gaps encontrados durante geração real devem voltar ao contrato responsável, sem criar camada paralela de correção.
- Gap factual de valores concretos retorna à E19.2; gap do catálogo factual retorna à E20.2; gap de pesquisa retorna à E20.5 ou ao processo de produção da pesquisa; gap de transporte/autorização retorna à E19.3; gap de interpretação/composição retorna à E19.4.
- A qualidade insuficiente da LP não autoriza automaticamente reintroduzir módulos, perfis, ranking de pesquisa, RAG, chunking, `itemKey`, `priority`, `sortOrder` ou seleção semântica intermediária.
- E10.8, E18.5, E20.3 e recortes derivados continuam preservados até auditoria geral do roadmap e dos consumidores.
- A classificação recomendada para ativos históricos é: ativo no caminho canônico; preservado fora do caminho; candidato à depreciação; removível após prova de ausência de consumidor.
- Primeiro retirar autoridade arquitetural; depois provar ausência de consumidor; somente então retirar implementação.

### 1.8. Habilitar o onboarding após o entitlement

- Entitlement válido direciona a conta ao onboarding da E19.2 antes da geração da primeira LP; disponibilidade comercial por `taxon + plano` permanece decisão separada.
- A experiência da conta deriva estados a partir de entitlement, papel, configuração e vínculo real, sem novo status de onboarding em `accounts`.
- O onboarding reutiliza valores autoritativos e solicita somente os ausentes.
- O taxon primário ativo é contexto autoritativo; ausência, inatividade ou ambiguidade falha fechada.
- Owner ou admin ativo configura a conta; os valores pertencem à conta, negócio, oferta, campanha ou LP conforme o escopo do field.
- Dados reutilizáveis do negócio permanecem separados dos valores específicos da LP.
- A conta piloto usa o fluxo oficial de entitlement com `liberacao_manual`, sem autorização paralela.
- Configuração completa e vinculada libera o espaço operacional, mas não implica taxon preparado, disponibilidade comercial ou LP gerada.

### 1.9. Configurar a LP e gerar no Cenário E

- A E19.2 coleta e confirma a configuração factual mínima e vincula a configuração a um `draft` real; não gera conteúdo da LP.
- A logo permanece opcional; a paleta confirmada e demais valores concretos seguem os contratos E19.2/E20.2.
- Antes da geração, o taxon deve estar preparado por E20.5/E20.6.
- A E19.3 é o menor boundary determinístico entre fontes autorizadas e a E19.4.
- A E19.3 recebe LP/configuração legítimas, resolve a versão E20.2 explicitamente revisada usando plano efetivo + cadeia taxonômica autoritativa completa, revalida os valores E19.2 e entrega exatamente `identities + modelContext + serverContext`.
- A pesquisa integral `end_customer` selecionada chega ao contexto sem atomização, resumo intermediário, RAG, chunking ou dependência de E10.8.
- A E19.3 não escolhe módulos, variantes, ordem, função narrativa, seções, layout, intensidade comercial ou copy e não chama OpenAI.
- A E19.4 recebe somente o pacote autorizado E19.3 e interpreta o conjunto respeitando a hierarquia: fatos concretos E19.2/E20.2 definem a realidade; pesquisa integral fornece contexto consultivo; E18.4 fornece limites universais.
- A pesquisa nunca pode ampliar ou contradizer a oferta concreta.
- A IA da E19.4 pode sintetizar público efetivo, progressão narrativa, quantidade e sequência de seções, função narrativa, copy, CTA textual, omissões, repetições legítimas e layout entre estruturas suportadas pelo contrato vigente.
- O sistema permanece responsável por autorização, facts disponíveis, evidências disponíveis, estruturas suportadas, limites absolutos, bindings, destinos, consentimento, credenciais, schema, validação objetiva, persistência e renderer.
- A IA não gera HTML, CSS, React, JavaScript, scripts, componentes desconhecidos, credenciais ou fatos não autorizados.
- A E19.4 deve usar a menor fonte estrutural canônica necessária à primeira LP real; novas primitivas ou layouts só entram quando caso concreto demonstrar necessidade.
- Cada tentativa de geração é uma execução explícita. Tentativa inválida não cria revisão válida, não materializa conteúdo e não cria nova identidade de LP.
- Uma candidata que passa a validação torna-se nova revisão válida da mesma `landing_page`; as revisões anteriores permanecem preservadas e podem ser comparadas técnica ou editorialmente.
- A direção conceitual vigente da materialização é `1 LP → N revisões materializadas append-only`. O contrato atual `account_landing_page_materializations` 1:1/write-once permanece fato histórico do estágio anterior; o shape físico da evolução pertence à v2/implementação da E19.4 e não é antecipado aqui.
- Cada revisão válida preserva conteúdo e snapshot suficientes para auditoria e reprodução, sem raciocínio privado; a revisão corrente pode alimentar o preview sem apagar o histórico.
- A primeira LP real deve possuir ao menos uma imagem principal pertinente à narrativa. Quando não houver asset adequado do cliente disponível, a E19.4 pode gerar a mídia necessária por IA.
- Imagem gerada pela E19.4 é saída do workload e não cria, apenas por existir, novo field E20.2. A mídia efetivamente usada precisa possuir referência estável antes da materialização, e performance de imagem é requisito.
- Detalhes físicos de persistência, formato, compressão, dimensões, entrega ou API de mídia pertencem ao plano técnico da E19.4 e não a este planejamento conceitual.
- O caminho canônico permanece: taxon preparado + configuração factual → E19.3 v3 → E19.4 → revisão válida → materialização → renderer → preview.

### 1.10. Validar e disponibilizar por plano

- Disponibilidade comercial por `taxon + plano` permanece separada de preparação técnica do taxon, entitlement da conta e prontidão factual da LP concreta.
- O `platform_admin` deve decidir disponibilização, suspensão ou reativação por combinação explícita e justificativa, conforme os recortes próprios de E20.4/E12.4.5–12.4.6 quando forem retomados.
- A LP real é evidência preferencial para a primeira liberação, mas o critério final pertence ao recorte de disponibilidade comercial.
- Suspensão comercial não cancela automaticamente entitlements ou LPs existentes.
- O caminho crítico atual é produzir e avaliar a primeira LP real antes de ampliar disponibilidade, publicação, tracking ou outros recursos.

### 1.11. Governar capacidades e limites por plano

- A E9 mantém entitlement, plano efetivo e o catálogo canônico de capacidades e limites.
- Disponibilidade comercial por `taxon + plano`, entitlement da conta e capacidades do plano são decisões distintas.
- A E20.2 define informações factuais necessárias e não define quantidade de LPs, publicação, tracking, relatórios, leads ou CRM.
- Cada domínio consumidor aplica server-side as capacidades relevantes e a UI consome o resultado resolvido, sem interpretar nomes de plano localmente.
- Capacidades futuras entram apenas com consumidor real e decisão aprovada; não prometer recurso ainda não implementado/disponibilizado.
- Limites específicos de publicação, tracking, dashboard ou leads devem permanecer nos respectivos planos-base enquanto não forem materializados no produto.

## 2. O que precisa ser preservado ou implementado no projeto

### 2.1. E10.8 — Pesquisas estruturadas preservadas fora do caminho canônico

- E10.8 está implementada e pode continuar atendendo consumidores independentes.
- **Situação arquitetural:** fora do caminho canônico E19.3 → E19.4 do Cenário E.
- A geração da primeira LP não depende de pesquisa estruturada, quatro blocos, 59 itens, `itemKey`, `priority` ou `sortOrder`.
- Não remover E10.8 até a auditoria identificar todos os consumidores reais e confirmar que nenhum deles é necessário.
- Não criar novo consumidor E19 apenas para justificar sua preservação.

### 2.2. E18.4 — Base raiz versionada ativa

- Preservar a implementação atual e sua API enquanto servir aos consumidores reais.
- E19.3 projeta somente limites necessários; E19.4 respeita esses limites sem transformar a raiz em arquitetura narrativa fixa.
- Reavaliar apenas diante de evidência produzida por LP real.

### 2.3. E18.5 — Catálogo executável preservado fora do caminho canônico

- E18.5 está implementada e permanece fisicamente preservada.
- **Situação arquitetural:** não participa da geração do Cenário E e não deve ser expandida para isso.
- Inventariar consumidores administrativos, contratos dependentes e relações com E20.3 antes de qualquer remoção.
- Se a auditoria comprovar que todos os consumidores restantes são legados dispensáveis, criar recorte próprio de depreciação e retirada.

### 2.4. E20.2, E20.5 e E20.6 — catálogo factual e preparação do taxon

- E20.2 permanece ativo como catálogo factual declarativo, versionado, resolvido por versão explícita + plano + cadeia taxonômica completa.
- Preservar herança, especializações, proveniência, validação, autorização de ultranicho e falha fechada do resolver canônico.
- E20.5 permanece responsável pela pesquisa integral `end_customer` selecionada, leitura repo-only, validação de identidade e versão.
- E20.6 permanece responsável pela avaliação humana assistida da suficiência factual E20.2 e pelo predicado derivado de preparação do taxon.
- `corretor-imoveis` é a primeira prova real de taxon preparado, não regra especial do produto.
- Evoluções futuras devem permanecer genéricas nas dimensões temporal e taxonômica.

### 2.5. E20.3 — Perfil de orientação preservado fora do caminho canônico

- E20.3, suas tabelas, resolver, adapters e lifecycle administrativo existem e permanecem preservados até auditoria.
- **Situação arquitetural:** não é fonte da estrutura da E19.4, não é gate da E19.3 e não é requisito da primeira LP real.
- Não criar novos perfis para sustentar o Cenário E.
- Não remover fisicamente enquanto houver página Admin, consumidor necessário, dado persistido ou dependência legítima ainda não tratada.

#### 2.5.1. E12.4.3 — Operação administrativa do perfil

- E12.4.3 permanece como lifecycle administrativo do ativo E20.3 enquanto esse domínio estiver preservado.
- **Situação arquitetural:** fora do caminho canônico da primeira LP e candidato a reavaliação junto com E20.3.
- Não ampliar proposta estrutural, coverage, recommendations ou gestão de gaps para atender E19.4.
- Eventual retirada deve ocorrer junto do recorte que tratar o destino de E20.3 e de seus dados.

### 2.6. E19.2 — Onboarding e configuração factual da conta/LP

- E19.1 mantém a identidade mínima de uma LP `draft` legítima.
- E19.2 está concluída e permanece ativa para coleta, validação, persistência e vínculo dos valores concretos.
- A configuração persistida mantém versão histórica própria; plano e cadeia taxonômica são resolvidos das autoridades atuais no runtime.
- A E19.3 pode revalidar esses valores contra versão E20.2 posterior explicitamente revisada sem migration automática da configuração.
- Gap factual de valor retorna à E19.2; defeito de catálogo retorna à E20.2.
- E19.2 não seleciona estrutura narrativa, não chama IA de copy e não materializa LP final.
- O vínculo da configuração a uma LP não transforma cada nova tentativa em nova identidade; a identidade comercial permanece a mesma enquanto o usuário estiver evoluindo a mesma página em `draft`.

### 2.7. E20.4 e E12.4.5–12.4.6 — Disponibilidade comercial

- Permanecem recortes separados de preparação técnica, geração e entitlement.
- Retomar somente depois da primeira LP real quando houver evidência suficiente e prioridade comercial.
- Não usar disponibilidade comercial como substituto de `prepared` nem vice-versa.

### 2.8. Evolução controlada e política de depreciação

- Aprendizados de LPs reais podem ajustar E18.4, E20.2, pesquisa integral, E19.3 ou E19.4 por novos planos e versões.
- E10.8, E18.5, E20.3 e recortes derivados não voltam ao caminho canônico apenas porque já existem.
- Auditoria do roadmap deve classificar ativos históricos por situação arquitetural e mapear consumidores reais.
- Remoção física depende de recorte próprio, prova de ausência de consumidor necessário e tratamento explícito de dados, migrations, páginas, adapters, imports, exports e testes.
- O contrato material atual 1:1/write-once de `account_landing_page_materializations` deve ser preservado como estado vigente até a evolução própria da E19.4; a direção conceitual de revisões append-only não autoriza migration ou novo shape neste documento.
- O lifecycle `archived`, histórico navegável de revisões e política definitiva de exclusão pertencem a recortes futuros e não alteram o schema atual por efeito deste planejamento.
- Não criar catálogo multicanal, editor visual, agente ou infraestrutura nova sem necessidade real demonstrada.

### 2.9. E9 — Catálogo de capacidades e limites por plano

- E9 continua responsável por entitlement, plano efetivo e capacidades/limites canônicos.
- O catálogo não substitui disponibilidade comercial, taxonomia, E20.2, preparação do taxon nem gates operacionais.
- Cada domínio implementa e valida suas próprias capacidades.
- Novas capacidades entram de forma versionada e somente com consumidor real.

## 3. Ordem dos próximos planos-base

- Base ativa para a primeira LP real: E18.4, E20.2, E20.5, E20.6, E19.1, E19.2 e entitlement/plano efetivo da E9.
- Ativos preservados fora do caminho canônico: E10.8, E18.5, E20.3 e lifecycle E12.4.3 associado, sujeitos a auditoria própria e sem bloquear a primeira LP.
- 1º — E19.3 do Cenário E está concluída no `contractVersion: 3` e mergeada pelo PR #757; não reabrir composição intermediária, atomização ou seleção semântica nesse boundary.
- 2º — a prova read-only `E19.2 histórica v2 → E20.2 revisada v4` já foi aprovada como caso real do mecanismo genérico temporal e taxonômico.
- 3º — concluir o plano E19.4 do Cenário E e produzir a primeira LP real: geração por IA com liberdade controlada → candidata estruturada → validação → revisão válida → materialização → renderer → avaliação humana.
- 4º — após E19.4 funcional, reconciliar E19.5 Light para workspace e lifecycle da LP estável, permitindo novas tentativas e revisões preservadas da mesma LP em `draft`; comparação técnica/editorial ocorre entre revisões, sem E1/E2/E3 como LPs independentes e sem multiplicar identidades apenas para testar prompt, modelo ou renderer.
- 5º — somente depois da primeira LP real, retomar publicação, tracking, disponibilidade comercial e demais evoluções priorizadas.
- A auditoria de obsolescência do roadmap deve ocorrer como trabalho próprio e não reintroduzir dependências legadas no caminho crítico.

## 4. Onde cada ajuste entra no roadmap

### 4.1. E10

- E10.8 permanece implementada, porém fora do caminho canônico da geração do Cenário E.
- Seus consumidores reais devem ser auditados antes de qualquer decisão de retirada.
- E10.6 e E10.7 continuam relacionados à experiência comercial e checkout quando a disponibilidade por `taxon + plano` for retomada.

### 4.2. E12

- E12.4.3 e seus refinamentos permanecem associados ao lifecycle E20.3 e estão fora do caminho canônico da primeira LP.
- Esses recortes devem ser auditados em conjunto com E20.3 antes de expansão ou remoção.
- E12.4.4 permanece retirada da implementação e não cria gate paralelo.
- E12.4.5 e E12.4.6 permanecem relacionados à disponibilidade comercial futura.

### 4.3. E18

- E18.4 permanece ativa no caminho canônico como base raiz e fonte de limites aplicáveis.
- E18.5 permanece implementada, mas fora do caminho E19.3 → E19.4 e candidata à auditoria de depreciação.
- A E19.4 cria somente o contrato estrutural mínimo necessário à primeira LP real, sem reconstruir E18.5.

### 4.4. E20

- E20.2 permanece ativo como catálogo factual e já possui versões executáveis explícitas, incluindo v4.
- E20.5 permanece ativo como seleção e leitura validada da pesquisa integral `end_customer`.
- E20.6 permanece ativo como avaliação de suficiência factual e preparação derivada do taxon.
- E20.3 permanece implementado, mas fora do caminho canônico e sujeito a auditoria junto com seu lifecycle E12.4.3.
- E20.4 permanece separado como disponibilidade comercial futura.

### 4.5. E19

- E19.1 mantém a identidade mínima da LP `draft`; essa identidade representa a página comercial e não uma tentativa de geração.
- E19.2 mantém onboarding e configuração factual persistida.
- E19.3 é boundary determinístico de autorização, pesquisa integral, revalidação factual e transporte de contexto; não gera nem materializa LP.
- E19.4 é responsável por tentativas de geração, decisões narrativas/estruturais da IA dentro do contrato suportado, candidata, validação, revisão válida, materialização, renderer e prova humana.
- A direção vigente da E19.4 é uma LP estável com múltiplas revisões append-only; o contrato 1:1/write-once existente é histórico do estágio anterior e seu shape físico só muda em recorte próprio da E19.4.
- E19.5 Light sucede E19.4 para workspace operacional e lifecycle da LP estável, permitindo ao usuário acionar, pelo boundary vigente da E19.4, novas tentativas que possam produzir revisões preservadas da mesma LP em `draft`. A formulação do PR #726 com novos drafts independentes E1/E2/E3 permanece apenas como histórico do plano em reconciliação.
- A home do cliente deve preservar uma linha por LP comercial; histórico e comparação de revisões pertencem à LP concreta.
- Conta piloto e cliente continuam no mesmo fluxo oficial.

### 4.6. E9

- E9 mantém entitlement, plano efetivo e capacidades/limites.
- Disponibilidade comercial, preparação do taxon e capacidades do plano permanecem decisões separadas.
- E9 não implementa LP Builder, pesquisa, geração, tracking, analytics ou CRM.

## 5. Evoluções prioritárias após a primeira LP real

- Gatilho comum: reavaliar somente após gerar e validar a primeira LP real pelo fluxo oficial, sem competir com o caminho crítico atual.
- Preservar para recortes futuros uma biblioteca tenant-aware de logos e imagens reutilizáveis, com upload e seleção de assets próprios quando existir contrato real de produto para isso.
- A estratégia de mídia pode evoluir de forma híbrida entre asset próprio do cliente, imagem gerada por IA e eventual mídia externa/licenciada com direitos e proveniência adequados.
- Edição futura de LP em `draft`, histórico/visualização de revisões e restauração operacional devem evoluir sem transformar cada revisão em nova LP comercial.
- Repertórios estruturais podem diferir por plano futuramente; `/admin/estrutura-lp` pode ser uma projeção read-only da autoridade estrutural real, nunca segunda fonte de verdade.
- Programmatic Tool Calling, persisted reasoning, prompt caching avançado, Agents SDK e multi-agent permanecem possibilidades condicionais, avaliadas somente diante de necessidade real e benefício demonstrável; não são Gate da E19.4 atual.

### 5.1. `pending_setup` e taxon assistidos por IA

- Reavaliar E10.4/E10.5.6 para experiência conversacional assistida por IA somente se houver valor demonstrado.
- A IA não cria nem altera silenciosamente o taxon; o fluxo autoritativo continua responsável pela identidade taxonômica consumida pela E19.

### 5.2. Assistência por IA na configuração da LP

- Manter E19.2 integralmente utilizável sem IA.
- Após a primeira LP validada, avaliar assistência opcional para serviço/oferta e identidade visual.
- A IA futura produz somente candidatas; o cliente edita e confirma, enquanto fields, ownership, validação e completude da E20.2 permanecem sob contratos determinísticos.
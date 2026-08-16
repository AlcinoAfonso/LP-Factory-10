# Planejamento de LPs — LP Factory 10

Fonte conceitual de decisão para preparar taxons, configurar contas, gerar LPs reais e liberar seu uso.

Status arquitetural: reconciliado com o Cenário E em 16/08/2026. O estado de execução, histórico dos recortes e registros operacionais pertencem a `docs/roadmap.md` e aos planos-base próprios. Este documento não substitui essas autoridades nem replica seus detalhes.

Estar fora do caminho canônico não autoriza remoção física. Qualquer retirada depende de auditoria de consumidores, dados e dependências no roadmap e no repositório.

Fontes de referência: `README.md`, `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/schema.md`, planos-base vigentes da jornada e implementação atual no repositório.

## 1. Princípios e resultado da jornada

### 1.1. Resultado esperado

- Criar LPs testáveis e publicáveis para taxons preparados, usando o mesmo fluxo oficial para conta piloto e clientes.
- `landing_page` é o canal; BOFU, MOFU e TOFU representam intenção de funil, e a origem de tráfego permanece separada dessa intenção.
- Depois de receber entitlement válido, a conta passa por configuração factual antes da geração da primeira LP.
- Não deve existir fluxo, entidade ou persistência paralela para LP teste.
- A conta é proprietária dos dados reutilizáveis do negócio; os atores autorizados apenas os configuram conforme os boundaries vigentes.
- O grau de determinismo acompanha a natureza da decisão: segurança, autorização, fatos, estado, bindings e contratos permanecem determinísticos; decisões semânticas, narrativas, criativas e persuasivas preservam flexibilidade controlada da IA.
- Não antecipar deterministicamente uma decisão que o workload existe justamente para a IA tomar.
- Depois de materializada, a LP possui estado próprio suficiente para reprodução; evolução posterior das fontes canônicas não altera silenciosamente uma LP existente.
- Edições ou regenerações futuras adotam versões mais novas das fontes somente por ação explícita e contrato próprio.

### 1.2. Separação de autoridades

- E20.2 define e resolve o catálogo factual de entradas; não fornece valores concretos nem decide narrativa.
- E20.5 mantém a pesquisa integral `end_customer` explicitamente selecionada para o taxon.
- E20.6 registra a versão E20.2 avaliada e deriva a preparação do taxon sem persistir um status adicional de prontidão.
- E19.2 coleta, valida, persiste e vincula os valores concretos da configuração ao `draft` legítimo.
- E18.4 mantém a parametrização raiz e os limites universais aplicáveis.
- E19.3 autoriza, revalida, organiza e transporta o contexto para geração; não decide a LP.
- E19.4 interpreta o contexto autorizado e decide narrativa, estrutura suportada e copy da candidata.
- E9 permanece autoridade do entitlement e do plano efetivo; E9.7 é o recorte responsável pelo contrato canônico de capacidades e limites, que evolui somente com capacidades admitidas e consumidores reais.
- Disponibilidade comercial por `taxon + plano` permanece decisão separada de preparação do taxon, entitlement, configuração factual e geração.

## 2. Jornada canônica do Cenário E

### 2.1. Preparar o taxon

- O taxon deve estar ativo na taxonomia autoritativa.
- A E20.5 exige uma pesquisa integral `end_customer` versionada, explicitamente selecionada e válida; criar nova versão não altera automaticamente a seleção vigente.
- `business_buyer` não é requisito da preparação nem do caminho canônico de geração da LP `end_customer`.
- A E20.6 avalia uma versão E20.2 explicitamente indicada, sem `latest`, maior versão implícita ou promoção automática.
- A decisão de suficiência permanece humana; assistência por IA não grava automaticamente a aprovação.
- `prepared` é resultado derivado das autoridades vigentes, não estado persistido independente.
- Gap do catálogo factual identificado na avaliação retorna à E20.2 para correção/evolução e nova avaliação; ausência de gap não cria especialização preventiva.

### 2.2. Configurar os fatos da LP

- Entitlement válido direciona a conta à E19.2 antes da geração da primeira LP.
- O onboarding reutiliza valores autoritativos e solicita somente os ausentes; não cria `onboarding_status` paralelo.
- O taxon primário ativo é contexto autoritativo; ausência, inatividade ou ambiguidade falha fechado.
- A configuração factual é vinculada a uma LP `draft` legítima pelo fluxo vigente da E19.1/E19.2.
- A configuração persistida preserva sua versão histórica; plano efetivo e cadeia taxonômica são reconstruídos das autoridades atuais no runtime.
- Dados reutilizáveis do negócio permanecem separados dos valores específicos da oferta, campanha ou LP conforme o escopo do field.
- Configuração completa e vinculada libera o espaço operacional, mas não implica taxon preparado, disponibilidade comercial ou LP gerada.

### 2.3. Revalidar e montar o pacote E19.3

- A E19.3 recebe LP/configuração legítimas e taxon preparado e entrega exatamente `identities + modelContext + serverContext` em contrato próprio do Cenário E.
- A E19.3 consome `reviewed_input_catalog_version` como a versão E20.2 explicitamente revisada e resolve o catálogo E20.2 nessa versão usando o plano efetivo e a cadeia taxonômica autoritativa completa.
- O resolver E20.2 permanece a única autoridade para compor a herança `universal → segmento → nicho → ultranicho autorizado`, aplicar especializações válidas e filtrar por plano.
- A E19.3 nunca reconstrói manualmente essa herança.
- Os valores históricos E19.2 são revalidados read-only contra os fields efetivos resultantes; a versão histórica da configuração permanece distinta da versão E20.2 usada na geração.
- Novo field obrigatório aplicável, valor ausente ou incompatível falha fechado e retorna à E19.2 para coleta/correção.
- Defeito de catálogo, camada, especialização ou resolver retorna à E20.2.
- Não migrar nem regravar configuração histórica apenas para alinhar números de versão quando os valores continuam válidos.
- Nenhuma versão E20.2 é inferida por ser a maior disponível; o consumidor usa a versão explicitamente autorizada pelo contrato responsável.
- A pesquisa integral selecionada chega ao `modelContext` sem atomização, resumo intermediário, RAG, chunking, ranking ou seleção semântica.
- A E19.3 projeta somente os limites E18.4 necessários à geração e separa valores semanticamente visíveis de valores operacionais server-side conforme o contrato vigente.
- A E19.3 não escolhe módulos, variantes, ordem, função narrativa, seções, layout, intensidade comercial ou copy e não chama OpenAI.

### 2.4. Gerar a candidata E19.4

- A E19.4 recebe somente o pacote autorizado E19.3 e não relê diretamente as fontes internas para reconstruir o contexto.
- A hierarquia de autoridade é: fatos concretos E19.2/E20.2 definem a realidade; pesquisa integral fornece contexto consultivo; E18.4 fornece limites universais; E19.3 transporta; E19.4 decide.
- A pesquisa nunca pode ampliar ou contradizer a oferta concreta.
- A IA pode sintetizar público efetivo, progressão narrativa, quantidade e sequência de seções, função narrativa, copy, CTA textual, omissões, repetições legítimas e layout entre estruturas suportadas pelo contrato vigente.
- O sistema permanece responsável por autorização, fatos e evidências disponíveis, estruturas suportadas, limites absolutos, bindings, destinos, consentimento, credenciais, schema, validação objetiva, persistência e renderer.
- A IA não gera HTML, CSS, React, JavaScript, scripts, componentes desconhecidos, credenciais ou fatos não autorizados.
- A E19.4 deve usar a menor fonte estrutural canônica suficiente à primeira LP real; novas primitivas ou layouts entram somente quando caso concreto demonstrar necessidade.
- A candidata válida é materializada em estado próprio suficiente para reprodução.
- O shape exato da candidata, materialização, snapshot, concorrência e renderer pertence ao plano E19.4 e não deve ser antecipado neste documento.

### 2.5. Disponibilidade comercial e capacidades

- Disponibilidade comercial por `taxon + plano` permanece decisão futura e separada. Ator, evidências, lifecycle e efeitos pertencem ao recorte próprio quando retomado.
- A primeira LP real deve ser produzida e avaliada antes de ampliar o caminho crítico para publicação, tracking, disponibilidade comercial ou outros recursos não necessários à prova.
- E9 informa entitlement e plano efetivo; E9.7 evolui o contrato de capacidades e limites sem presumir capacidades ainda não admitidas.
- E20.2 define informações factuais necessárias e não define quantidade de LPs, publicação, tracking, relatórios, leads ou CRM.
- Cada domínio consumidor implementa e aplica server-side suas próprias capacidades e limites quando houver contrato admitido e consumidor real.

## 3. Mapa de autoridades arquiteturais

### 3.1. Ativos no caminho canônico da primeira LP

- E18.4 — parametrização raiz e limites universais.
- E20.2 — catálogo factual versionado e resolver taxonômico.
- E20.5 — pesquisa integral `end_customer` selecionada e validada.
- E20.6 — avaliação da suficiência E20.2 e preparação derivada do taxon.
- E19.1 — identidade mínima da LP `draft`.
- E19.2 — onboarding, valores concretos e vínculo da configuração.
- E19.3 — pacote autorizado, revalidação factual e transporte de contexto.
- E19.4 — geração, candidata, validação, materialização, renderer e prova humana conforme seu plano vigente.
- E9 — entitlement e plano efetivo; capacidades e limites evoluem pelo recorte E9.7.

### 3.2. Ativos preservados fora do caminho canônico

- E10.8 permanece implementada para consumidores independentes, mas a geração do Cenário E não depende da pesquisa estruturada, seus blocos ou seus metadados de item.
- E18.5 permanece implementada, mas não governa a estrutura E19.3 → E19.4 e não deve ser expandida para sustentar o Cenário E.
- E20.3 permanece implementada, mas não é gate, fonte estrutural ou requisito da primeira LP real.
- E12.4.3 e refinamentos associados permanecem vinculados ao lifecycle E20.3 e fora do caminho canônico da primeira LP.
- Nenhum desses ativos deve ser removido fisicamente ou voltar ao caminho canônico sem avaliação própria de consumidores e dependências.

## 4. Próxima sequência de trabalho

### 4.1. Caminho crítico

- 1º — executar E19.3.3 conforme o plano-base vigente e concluir a prova read-only real `E19.2 histórica v2 → E20.2 revisada v4`, sem hardcode de versão, slug, plano ou nível taxonômico.
- 2º — após aprovação da prova E19.3, retomar e consolidar E19.4 Cenário E e produzir a primeira LP real de ponta a ponta.
- 3º — após E19.4 funcional, E19.5 Light permanece direção conceitual sucessora prevista para novos `drafts` independentes e iterações sem overwrite; seu contrato e identificação formal pertencem a recorte próprio.
- 4º — somente depois da primeira LP real, retomar publicação, tracking, disponibilidade comercial e demais evoluções conforme prioridade e planos próprios.
- A auditoria de obsolescência do roadmap permanece trabalho próprio e não bloqueia E19.3/E19.4.

## 5. Política de gaps e depreciação

### 5.1. Destino dos gaps

- Gap de valor concreto retorna à E19.2.
- Gap do catálogo factual ou resolver retorna à E20.2.
- Gap da pesquisa selecionada retorna à E20.5 ou ao processo responsável por produzir nova versão da pesquisa.
- Gap de preparação do taxon retorna à E20.5/E20.6 conforme a autoridade envolvida.
- Gap de transporte, autorização ou contrato do pacote retorna à E19.3.
- Gap de interpretação, composição ou qualidade da candidata retorna à E19.4.
- Qualidade insuficiente da LP não autoriza automaticamente reintroduzir módulos, perfis, ranking de pesquisa, RAG, chunking, `itemKey`, `priority`, `sortOrder` ou camada semântica intermediária.

### 5.2. Depreciação de ativos históricos

- Classificar cada ativo como: ativo no caminho canônico; preservado fora do caminho; candidato à depreciação; removível após prova.
- Primeiro retirar autoridade arquitetural; depois provar ausência de consumidor necessário; somente então retirar implementação.
- Remoção física exige recorte próprio e tratamento explícito de consumidores, dados, migrations, páginas, adapters, imports, exports e testes.
- Não criar novo consumidor apenas para justificar a preservação de ativo histórico.
- Não reintroduzir ativo histórico no caminho canônico apenas porque sua implementação já existe.

## 6. Evoluções condicionais após a primeira LP real

### 6.1. Taxon assistido por IA

- Reavaliar E10.4/E10.5.6 para experiência conversacional assistida por IA somente se houver valor demonstrado.
- A IA não cria nem altera silenciosamente o taxon; o fluxo autoritativo continua responsável pela identidade taxonômica consumida pela E19.

### 6.2. Assistência por IA na configuração factual

- Manter E19.2 integralmente utilizável sem IA.
- Após a primeira LP validada, avaliar assistência opcional para serviço/oferta e identidade visual.
- A IA futura produz somente candidatas; o cliente edita e confirma, enquanto fields, ownership, validação e completude da E20.2 permanecem sob contratos determinísticos.
